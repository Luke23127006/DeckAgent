import type { OutlineProposal, OutlineSnapshot } from '@deckagent/deck'

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function id(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value)
}
function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}
function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && !!value.trim() && value.length <= max
}

function proposal(value: unknown): OutlineProposal {
  if (!object(value) || !id(value.outlineId) || !id(value.requestId) || !integer(value.version) || !value.version ||
    !integer(value.responseIndex) || !text(value.overview, 4000) || !Array.isArray(value.slides) ||
    !value.slides.length || value.slides.length > 100 ||
    (value.status !== 'current' && value.status !== 'confirmed' && value.status !== 'superseded' && value.status !== 'cancelled'))
    throw new Error('INVALID_RESPONSE')
  const slides = value.slides.map((slide: unknown) => {
    if (!object(slide) || !id(slide.slideId) || !text(slide.title, 300) || !text(slide.content, 8000)) throw new Error('INVALID_RESPONSE')
    return { slideId: slide.slideId, title: slide.title, content: slide.content }
  })
  if (new Set(slides.map(slide => slide.slideId)).size !== slides.length) throw new Error('INVALID_RESPONSE')
  return { outlineId: value.outlineId, requestId: value.requestId, version: value.version,
    responseIndex: value.responseIndex, overview: value.overview, status: value.status, slides }
}

/** Outline versions are independent of Deck revisions. Reads never replay requests. */
export class OutlineClient {
  constructor(private readonly origin: string, private readonly token: string) {}

  async snapshot(sessionId: string, signal?: AbortSignal): Promise<OutlineSnapshot> {
    const response = await fetch(`${this.origin}/api/sessions/${encodeURIComponent(sessionId)}/outline`, {
      headers: { authorization: `Bearer ${this.token}` }, credentials: 'omit', redirect: 'error',
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(response.status === 401 ? 'AUTH_REQUIRED' : 'OUTLINE_UNAVAILABLE')
    const value: unknown = await response.json()
    if (!object(value) || value.sessionId !== sessionId || typeof value.active !== 'boolean' || !integer(value.version) ||
      (value.currentId !== null && !id(value.currentId)) || (value.confirmedId !== null && !id(value.confirmedId)) ||
      !Array.isArray(value.proposals) || value.proposals.length > 100) throw new Error('INVALID_RESPONSE')
    const proposals = value.proposals.map(proposal)
    const version = value.version
    if (new Set(proposals.map(p => p.outlineId)).size !== proposals.length ||
      new Set(proposals.map(p => p.requestId)).size !== proposals.length ||
      proposals.some((p, index) => p.version > version || (index > 0 && p.version <= proposals[index - 1]!.version) ||
        (p.status === 'current' && p.outlineId !== value.currentId) || (p.status === 'confirmed' && p.outlineId !== value.confirmedId)) ||
      (value.currentId !== null && !proposals.some(p => p.outlineId === value.currentId && ['current', 'confirmed'].includes(p.status))) ||
      (value.confirmedId !== null && (value.confirmedId !== value.currentId || !proposals.some(p => p.outlineId === value.confirmedId && p.status === 'confirmed'))) ||
      (!value.active && (value.version !== 0 || proposals.length > 0 || value.currentId !== null || value.confirmedId !== null)))
      throw new Error('INVALID_RESPONSE')
    return { sessionId, active: value.active, version: value.version, currentId: value.currentId,
      confirmedId: value.confirmedId, proposals }
  }
}
