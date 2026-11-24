import { decodeBriefView } from '@deckagent/host-contracts'
import type { BriefDraft, BriefView, InterviewState } from '@deckagent/host-contracts'
export { decodeBriefView } from '@deckagent/host-contracts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.isWellFormed()
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(text)

export class BriefClient {
  constructor(
    private readonly origin: string,
    private readonly token: string,
  ) {}

  private async request(
    sessionId: string,
    version?: number,
    input?: { expectedVersion: number; draft: BriefDraft },
  ): Promise<BriefView> {
    const response = await fetch(
      `${this.origin}/api/sessions/${encodeURIComponent(sessionId)}/brief${version === undefined ? '' : `/versions/${version}`}`,
      {
        method: input ? 'PUT' : 'GET',
        headers: { authorization: `Bearer ${this.token}`, ...(input ? { 'content-type': 'application/json' } : {}) },
        credentials: 'omit',
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
        ...(input ? { body: JSON.stringify(input) } : {}),
      },
    )
    if (!response.ok) {
      if (response.status === 401) throw new Error('AUTH_REQUIRED')
      const value: unknown = await response.json().catch(() => null)
      const codes = [
        'BRIEF_INVALID',
        'BRIEF_STALE',
        'BRIEF_LOCKED',
        'BRIEF_NOT_FOUND',
        'SESSION_BUSY',
        'SESSION_NOT_FOUND',
        'SOURCE_NOT_FOUND',
        'DESIGN_FORMAT_UNAVAILABLE',
        'DESIGN_TEMPLATE_NOT_FOUND',
        'DESIGN_SYSTEM_NOT_FOUND',
        'DESIGN_THEME_INVALID',
        'DESIGN_FONT_UNAVAILABLE',
      ]
      throw new Error(
        object(value) && object(value.error) && typeof value.error.code === 'string' && codes.includes(value.error.code)
          ? value.error.code
          : 'BRIEF_UNAVAILABLE',
      )
    }
    const view = decodeBriefView(await response.json(), sessionId)
    if (version !== undefined && view.version !== version) throw new Error('INVALID_RESPONSE')
    return view
  }

  snapshot(sessionId: string, version?: number): Promise<BriefView> {
    return this.request(sessionId, version)
  }
  save(sessionId: string, expectedVersion: number, draft: BriefDraft): Promise<BriefView> {
    return this.request(sessionId, undefined, { expectedVersion, draft })
  }

  async interview(sessionId: string): Promise<{ brief: BriefView; state: InterviewState }> {
    const response = await fetch(`${this.origin}/api/sessions/${encodeURIComponent(sessionId)}/interview`, {
      headers: { authorization: `Bearer ${this.token}` },
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(response.status === 401 ? 'AUTH_REQUIRED' : 'BRIEF_UNAVAILABLE')
    const value: unknown = await response.json()
    if (!object(value) || !object(value.state)) throw new Error('INVALID_RESPONSE')
    const s = value.state
    if (
      !Array.isArray(s.questions) ||
      !Array.isArray(s.blockers) ||
      typeof s.readyForOutline !== 'boolean' ||
      typeof s.skipAllowed !== 'boolean' ||
      !text(s.notice)
    )
      throw new Error('INVALID_RESPONSE')
    const questions = s.questions.map((q: unknown) => {
      if (!object(q) || !text(q.prompt) || !strings(q.suggestions) || typeof q.required !== 'boolean')
        throw new Error('INVALID_RESPONSE')
      const topic = (
        [
          'topic',
          'audience',
          'duration',
          'purpose',
          'sources',
          'language',
          'images',
          'format',
          'template',
          'design-system',
        ] as const
      ).find(t => t === q.topic)
      if (!topic) throw new Error('INVALID_RESPONSE')
      return { topic, prompt: q.prompt, suggestions: q.suggestions, required: q.required }
    })
    const blockers = s.blockers.map((b: unknown) => {
      if (!object(b) || !text(b.code) || !text(b.message)) throw new Error('INVALID_RESPONSE')
      return { code: b.code, message: b.message }
    })
    if (
      (s.readyForOutline && (questions.length || blockers.length)) ||
      new Set(questions.map(q => q.topic)).size !== questions.length
    )
      throw new Error('INVALID_RESPONSE')
    return {
      brief: decodeBriefView(value.brief, sessionId),
      state: { questions, blockers, readyForOutline: s.readyForOutline, skipAllowed: s.skipAllowed, notice: s.notice },
    }
  }
}
