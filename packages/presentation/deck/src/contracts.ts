/** Trusted Host input. Model tools cannot confirm or replace a plan. */
export interface ConfirmedDeckPlan {
  readonly outlineId: string
  readonly slides: readonly { readonly slideId: string; readonly title: string }[]
}

export interface DeckSlide {
  readonly slideId: string
  readonly title: string
  readonly order: number
  readonly status: 'pending' | 'published'
  readonly revision: number
}

/** Full metadata only: HTML is fetched separately for an immutable revision. */
export interface DeckSnapshot {
  readonly sessionId: string
  readonly deckId: string
  readonly outlineId: string | null
  readonly version: number
  readonly slides: readonly DeckSlide[]
}

export interface DeckChange {
  readonly sessionId: string
  readonly deckId: string
  readonly version: number
}

export interface PublishSlide {
  readonly outlineId: string
  readonly slideId: string
  readonly expectedRevision: number
  /** Stable per attempted publication; retry with identical input returns its receipt. */
  readonly publicationId: string
  readonly html: string
}

export interface PublishedSlide extends DeckChange {
  readonly slideId: string
  readonly revision: number
}

export interface SlideContent {
  readonly sessionId: string
  readonly slideId: string
  readonly revision: number
  readonly html: string
}

export interface DeckReader {
  snapshot(sessionId: string): DeckSnapshot
  content(sessionId: string, slideId: string, revision: number): SlideContent
  subscribe(sessionId: string, listener: (change: DeckChange) => void): () => void
}

export interface DeckPublisher {
  snapshot(sessionId: string): DeckSnapshot
  publish(sessionId: string, input: PublishSlide, signal?: AbortSignal): PublishedSlide
}

export class DeckError extends Error {
  constructor(public readonly code: string) {
    super(code)
    this.name = 'DeckError'
  }
}

export function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value)
}
