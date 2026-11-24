import type { ImageCredit, DeckChange, DeckSnapshot, SlideContent } from '@deckagent/host-contracts'
import { decodeGeneration } from '@deckagent/host-contracts'
import { decodeArtifactDescriptor, decodeContentOrigins, decodeSlideDocument } from '@deckagent/presentation-document'

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
    const response = await fetch(`${this.origin}/api/sessions/${encodeURIComponent(sessionId)}/deck${suffix}`, {
      signal: signal ?? AbortSignal.timeout(15000),
      redirect: 'error',
      credentials: 'omit',
      headers: { authorization: `Bearer ${this.token}` },
    })
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
    if (
      value.imageCredits !== undefined &&
      (!Array.isArray(value.imageCredits) ||
        value.imageCredits.length > 100 ||
        value.imageCredits.some(
          c =>
            !object(c) ||
            typeof c.url !== 'string' ||
            !c.url.startsWith('https://') ||
            typeof c.author !== 'string' ||
            typeof c.licenseUrl !== 'string' ||
            !['public-domain', 'CC0', 'CC BY', 'Pexels', 'unknown'].includes(String(c.license)) ||
            (c.evidence !== undefined && c.evidence !== 'image-metadata' && c.evidence !== 'pexels-cdn') ||
            (c.downloadUrl !== undefined &&
              (typeof c.downloadUrl !== 'string' || !c.downloadUrl.startsWith('https://'))) ||
            c.unknownLicense !== (c.license === 'unknown') ||
            typeof c.retrievedAt !== 'string',
        ))
    )
      invalid()
    if (
      value.imageOmissions !== undefined &&
      (!Array.isArray(value.imageOmissions) || value.imageOmissions.some(q => typeof q !== 'string'))
    )
      invalid()
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
      ...(Array.isArray(value.imageCredits)
        ? { imageCredits: value.imageCredits as unknown as readonly ImageCredit[] }
        : {}),
      ...(Array.isArray(value.imageOmissions) ? { imageOmissions: value.imageOmissions as string[] } : {}),
      ...(typeof value.notes === 'string' ? { notes: value.notes } : {}),
      ...(Array.isArray(value.provenance) ? { provenance: decodeContentOrigins(value.provenance) } : {}),
    }
  }

  /** A connection always starts with a current-version notice, including an empty deck. */
  async *watch(sessionId: string, signal: AbortSignal): AsyncGenerator<DeckChange> {
    const response = await this.request(sessionId, '/events', signal)
    if (!response.body || !response.headers.get('content-type')?.startsWith('text/event-stream')) invalid()
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    try {
      while (true) {
        const part = await reader.read()
        if (part.done) throw new Error('DECK_CONNECTION_LOST')
        buffer += decoder.decode(part.value, { stream: true }).replace(/\r\n/g, '\n')
        if (buffer.length > 65536) invalid()
        let boundary = buffer.indexOf('\n\n')
        while (boundary >= 0) {
          const frame = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          if (frame.startsWith('event: deck-changed\n')) {
            const data = frame
              .split('\n')
              .filter(line => line.startsWith('data: '))
              .map(line => line.slice(6))
              .join('\n')
            yield change(JSON.parse(data), sessionId)
          }
          boundary = buffer.indexOf('\n\n')
        }
      }
    } finally {
      // Cancelling a read-only subscription cannot change a committed publication.
      await reader.cancel().catch(() => {})
      reader.releaseLock()
    }
  }
}
