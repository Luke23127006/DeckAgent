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
  /** Host-only rendering projection; never persisted as canonical HTML. */
  readonly displayHtml?: string
}
export interface FrozenDeck {
  readonly sessionId: string
  readonly outlineId: string
  readonly version: number
  readonly slides: readonly (SlideContent & { readonly title: string; readonly order: number })[]
}
export interface ImageAsset {
  readonly assetId: string
  readonly sessionId: string
  readonly mediaType: 'image/png' | 'image/jpeg'
  readonly sizeBytes: number
  readonly width: number
  readonly height: number
  readonly sha256: string
  readonly sourceUrl: string
  readonly finalUrl: string
}
export interface InsertSlideImage {
  readonly outlineId: string
  readonly slideId: string
  readonly expectedRevision: number
  readonly assetId: string
  readonly publicationId: string
  readonly alt: string
}
export interface DeckImageEditor {
  insertImage(sessionId: string, input: InsertSlideImage, signal?: AbortSignal): PublishedSlide
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

export interface SlideEditOperation {
  readonly nodeId: string
  readonly text?: string
  readonly layout?: {
    readonly fontSize?: number
    readonly textAlign?: 'left' | 'center' | 'right'
    readonly marginTop?: number
    readonly marginLeft?: number
  }
}
export interface SlideEdit {
  readonly outlineId: string
  readonly slideId: string
  readonly expectedRevision: number
  readonly baseHash: string
  readonly editId: string
  readonly operations: readonly SlideEditOperation[]
}
export interface EditableSlide extends SlideContent {
  readonly outlineId: string
  readonly baseHash: string
  readonly nodes: readonly {
    readonly nodeId: string
    readonly tag: string
    readonly text: string
    readonly layoutEditable: boolean
  }[]
  readonly reason?: 'DECK_EDIT_UNSUPPORTED'
}
export interface DeckEditor {
  editableSlide(sessionId: string, slideId: string): EditableSlide
  previewSlideEdit(sessionId: string, input: SlideEdit): SlideContent
  editSlide(sessionId: string, input: SlideEdit, signal?: AbortSignal): PublishedSlide
}

export interface OutlineDraft {
  readonly overview: string
  readonly slides: readonly { readonly title: string; readonly content: string }[]
}

export interface OutlineTarget {
  readonly outlineId: string
  readonly version: number
}

export interface OutlineProposal extends OutlineTarget {
  readonly requestId: string
  /** Index of the completed assistant response in the public, non-system history. */
  readonly responseIndex: number
  readonly overview: string
  readonly slides: readonly { readonly slideId: string; readonly title: string; readonly content: string }[]
  readonly status: 'current' | 'superseded' | 'cancelled' | 'confirmed'
}

export interface OutlineSnapshot {
  readonly sessionId: string
  readonly active: boolean
  /** Independent of Deck publication versions. Increments on each outline transition. */
  readonly version: number
  readonly currentId: string | null
  readonly confirmedId: string | null
  readonly proposals: readonly OutlineProposal[]
}

export interface OutlineReader {
  outlineSnapshot(sessionId: string): OutlineSnapshot
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
