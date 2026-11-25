import type { ImageCredit, DeckChange, DeckSnapshot, SlideContent } from '@deckagent/host-contracts'
import { decodeGeneration } from '@deckagent/host-contracts'
import { decodeArtifactDescriptor, decodeContentOrigins, decodeSlideDocument } from '@deckagent/presentation-document'
import { fetchAuthorized, readSseFrames } from './http.ts'

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function id(value: unknown): value is string {
  return typeof value === 'string' && /^[\w-]{1,100}$/.test(value)
}
function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}
function invalid(): never {
  throw new Error('INVALID_DECK_RESPONSE')
}

const IMAGE_LICENSES = ['public-domain', 'CC0', 'CC BY', 'Pexels', 'unknown'] as const

function decodeImageCredits(value: unknown): readonly ImageCredit[] {
  if (!Array.isArray(value) || value.length > 100) invalid()
  return value.map(item => {
    if (
      !object(item) ||
      typeof item.url !== 'string' ||
      !item.url.startsWith('https://') ||
      typeof item.author !== 'string' ||
      typeof item.licenseUrl !== 'string' ||
      (item.evidence !== undefined && item.evidence !== 'image-metadata' && item.evidence !== 'pexels-cdn') ||
      (item.downloadUrl !== undefined &&
        (typeof item.downloadUrl !== 'string' || !item.downloadUrl.startsWith('https://'))) ||
      typeof item.retrievedAt !== 'string' ||
      typeof item.unknownLicense !== 'boolean'
    )
      invalid()
    const license = IMAGE_LICENSES.find(known => known === item.license)
    if (!license) invalid()
    if (item.unknownLicense !== (license === 'unknown')) invalid()
    return {
      url: item.url,
      author: item.author,
      licenseUrl: item.licenseUrl,
      license,
      ...(item.evidence === 'image-metadata' || item.evidence === 'pexels-cdn' ? { evidence: item.evidence } : {}),
      ...(typeof item.downloadUrl === 'string' ? { downloadUrl: item.downloadUrl } : {}),
      unknownLicense: item.unknownLicense,
      retrievedAt: item.retrievedAt,
    }
  })
}

function decodeStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) invalid()
  return value.map(item => (typeof item === 'string' ? item : invalid()))
}

function change(value: unknown, sessionId: string): DeckChange {
  if (!object(value) || value.sessionId !== sessionId || value.deckId !== sessionId || !integer(value.version))
    invalid()
  return { sessionId, deckId: sessionId, version: value.version }
}

/** Full authenticated metadata reads plus small SSE invalidations; no HTML in notices. */
export class DeckClient {
  constructor(
    private readonly origin: string,
    private readonly token: string,
  ) {}

  private async request(sessionId: string, suffix: string, signal?: AbortSignal): Promise<Response> {
    if (!id(sessionId)) invalid()
    const response = await fetchAuthorized(
      this.origin,
      this.token,
      `/api/sessions/${encodeURIComponent(sessionId)}/deck${suffix}`,
      { signal: signal ?? AbortSignal.timeout(15000) },
    )
    if (!response.ok) throw new Error(response.status === 401 ? 'AUTH_REQUIRED' : 'DECK_REQUEST_FAILED')
    return response
  }

  async snapshot(sessionId: string, signal?: AbortSignal): Promise<DeckSnapshot> {
    const value: unknown = await (await this.request(sessionId, '', signal)).json()
    const base = change(value, sessionId)
    if (
      !object(value) ||
      (value.outlineId !== null && !id(value.outlineId)) ||
      !Array.isArray(value.slides) ||
      (value.generation === undefined && value.slides.length > 100)
    )
      invalid()
    const slides = value.slides.map((slide: unknown, position: number) => {
      if (
        !object(slide) ||
        !id(slide.slideId) ||
        typeof slide.title !== 'string' ||
        !slide.title.trim() ||
        (value.generation === undefined && slide.title.length > 300) ||
        slide.order !== position ||
        !integer(slide.revision) ||
        slide.status !== (slide.revision ? 'published' : 'pending')
      )
        invalid()
      return {
        slideId: slide.slideId,
        title: slide.title,
        order: position,
        revision: slide.revision,
        status: slide.revision ? ('published' as const) : ('pending' as const),
      }
    })
    if (
      new Set(slides.map(s => s.slideId)).size !== slides.length ||
      (base.version === 0 ? value.outlineId !== null || slides.length > 0 : value.outlineId === null || !slides.length)
    )
      invalid()
    const generation = value.generation === undefined ? undefined : decodeGeneration(value.generation, sessionId)
    if (generation && generation.receipt.outlineId !== value.outlineId) invalid()
    return { ...base, outlineId: value.outlineId, slides, ...(generation ? { generation } : {}) }
  }

  async content(sessionId: string, slideId: string, revision: number, signal?: AbortSignal): Promise<SlideContent> {
    if (!id(slideId) || !integer(revision) || !revision) invalid()
    const value: unknown = await (
      await this.request(sessionId, `/slides/${encodeURIComponent(slideId)}/revisions/${revision}`, signal)
    ).json()
    if (
      !object(value) ||
      value.sessionId !== sessionId ||
      value.slideId !== slideId ||
      value.revision !== revision ||
      typeof value.html !== 'string' ||
      value.html.length > 4 * 1024 * 1024 ||
      (value.notes !== undefined && (typeof value.notes !== 'string' || value.notes.length > 16000))
    )
      invalid()
    const imageCredits = value.imageCredits === undefined ? undefined : decodeImageCredits(value.imageCredits)
    const imageOmissions = value.imageOmissions === undefined ? undefined : decodeStringArray(value.imageOmissions)
    const document = value.document === undefined ? undefined : decodeSlideDocument(value.document)
    const artifact = value.artifact === undefined ? undefined : decodeArtifactDescriptor(value.artifact)
    if (
      document &&
      (document.slideId !== slideId ||
        artifact?.documentVersion !== document.schemaVersion ||
        document.notes !== value.notes)
    )
      invalid()
    if (artifact?.documentVersion && !document) invalid()
    return {
      sessionId,
      slideId,
      revision,
      html: value.html,
      ...(document ? { document } : {}),
      ...(artifact ? { artifact } : {}),
      ...(imageCredits === undefined ? {} : { imageCredits }),
      ...(imageOmissions === undefined ? {} : { imageOmissions }),
      ...(typeof value.notes === 'string' ? { notes: value.notes } : {}),
      ...(Array.isArray(value.provenance) ? { provenance: decodeContentOrigins(value.provenance) } : {}),
    }
  }

  /** A connection always starts with a current-version notice, including an empty deck. */
  async *watch(sessionId: string, signal: AbortSignal): AsyncGenerator<DeckChange> {
    const response = await this.request(sessionId, '/events', signal)
    const frames = readSseFrames(response, {
      maxBufferBytes: 65536,
      lostError: 'DECK_CONNECTION_LOST',
      invalidError: 'INVALID_DECK_RESPONSE',
      eventName: 'deck-changed',
      matchMode: 'prefix',
    })
    for await (const data of frames) yield change(JSON.parse(data), sessionId)
  }
}
