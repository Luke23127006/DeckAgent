import type { DeckChange, DeckSnapshot, SlideContent } from '@deckagent/deck'
import type { EditableSlide, SlideEdit, PublishedSlide } from '@deckagent/deck'

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
  private async editing(sessionId: string, slideId: string, action: string, input?: SlideEdit): Promise<unknown> {
    if (!id(sessionId) || !id(slideId)) invalid()
    const response = await fetch(`${this.origin}/api/sessions/${sessionId}/deck/slides/${slideId}/${action}`, {
      method: input ? 'POST' : 'GET',
      headers: { authorization: `Bearer ${this.token}`, ...(input ? { 'content-type': 'application/json' } : {}) },
      ...(input ? { body: JSON.stringify(input) } : {}),
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    const value: unknown = await response.json()
    if (!response.ok) {
      const code = object(value) && object(value.error) && typeof value.error.code === 'string' ? value.error.code : ''
      throw new Error(
        [
          'DECK_CONFLICT',
          'DECK_PUBLICATION_CONFLICT',
          'DECK_EDIT_UNSUPPORTED',
          'DECK_INVALID_EDIT',
          'DECK_UNSAFE_HTML',
          'SESSION_BUSY',
          'AUTH_REQUIRED',
          'NOT_FOUND',
        ].includes(code)
          ? code
          : 'DECK_EDIT_FAILED',
      )
    }
    return value
  }
  async editableSlide(sessionId: string, slideId: string): Promise<EditableSlide> {
    const value = await this.editing(sessionId, slideId, 'editor')
    if (
      !object(value) ||
      value.sessionId !== sessionId ||
      value.slideId !== slideId ||
      !integer(value.revision) ||
      !value.revision ||
      typeof value.html !== 'string' ||
      value.html.length > 262144 ||
      !id(value.outlineId) ||
      typeof value.baseHash !== 'string' ||
      !/^[a-f0-9]{64}$/.test(value.baseHash) ||
      !Array.isArray(value.nodes) ||
      value.nodes.length > 1000 ||
      (value.reason !== undefined && value.reason !== 'DECK_EDIT_UNSUPPORTED')
    )
      invalid()
    const nodes = value.nodes.map((node: unknown) => {
      if (
        !object(node) ||
        typeof node.nodeId !== 'string' ||
        !/^n-\d{1,7}$/.test(node.nodeId) ||
        typeof node.tag !== 'string' ||
        node.tag.length > 20 ||
        typeof node.text !== 'string' ||
        node.text.length > 262144 ||
        typeof node.layoutEditable !== 'boolean'
      )
        invalid()
      return { nodeId: node.nodeId, tag: node.tag, text: node.text, layoutEditable: node.layoutEditable }
    })
    return {
      sessionId,
      slideId,
      revision: value.revision,
      html: value.html,
      outlineId: value.outlineId,
      baseHash: value.baseHash,
      nodes,
      ...(value.reason ? { reason: value.reason } : {}),
    }
  }
  async previewSlideEdit(sessionId: string, input: SlideEdit): Promise<string> {
    const value = await this.editing(sessionId, input.slideId, 'preview', input)
    if (
      !object(value) ||
      value.sessionId !== sessionId ||
      value.slideId !== input.slideId ||
      value.revision !== input.expectedRevision ||
      typeof value.html !== 'string' ||
      value.html.length > 262144
    )
      invalid()
    return value.html
  }
  async editSlide(sessionId: string, input: SlideEdit): Promise<PublishedSlide> {
    const value = await this.editing(sessionId, input.slideId, 'edit', input),
      base = change(value, sessionId)
    if (!object(value) || value.slideId !== input.slideId || value.revision !== input.expectedRevision + 1) invalid()
    return { ...base, slideId: input.slideId, revision: input.expectedRevision + 1 }
  }

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
      value.slides.length > 100
    )
      invalid()
    const slides = value.slides.map((slide: unknown, position: number) => {
      if (
        !object(slide) ||
        !id(slide.slideId) ||
        typeof slide.title !== 'string' ||
        !slide.title.trim() ||
        slide.title.length > 300 ||
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
    return { ...base, outlineId: value.outlineId, slides }
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
      value.html.length > 262144
    )
      invalid()
    return { sessionId, slideId, revision, html: value.html }
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
