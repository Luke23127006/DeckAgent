import type { ArtifactDescriptor, ContentOrigin, SlideDocument } from '@deckagent/presentation-document'
import type { BriefRecord, BriefSourceRef, DesignSnapshot } from './brief.ts'

export interface WebImageIntent {
  readonly subject: string
  readonly role: string
  readonly mustInclude: readonly string[]
  readonly mustAvoid: readonly string[]
  readonly aspect: 'landscape' | 'portrait' | 'square' | 'any'
}

export type ContentBlock =
  | { readonly kind: 'subtitle' | 'lead' | 'text' | 'source-note'; readonly text: string }
  | { readonly kind: 'bullets'; readonly items: readonly string[] }
  | { readonly kind: 'columns'; readonly columns: readonly { readonly bullets: readonly string[] }[] }
  | { readonly kind: 'metrics'; readonly items: readonly { readonly value: string; readonly label: string }[] }
  | { readonly kind: 'image'; readonly attachmentId: string; readonly caption?: string }
  | {
      readonly kind: 'web-image'
      readonly query: string
      readonly caption?: string
      readonly required?: boolean
      readonly intent?: WebImageIntent
      readonly provider?: 'tavily' | 'commons'
      readonly replace?: boolean
    }

export interface LayoutIssue {
  readonly code: 'DESIGN_LAYOUT_INCOMPATIBLE'
  readonly slideIndex: number
  readonly path: string
  readonly message: string
  readonly expected: string
  readonly layoutId?: 'cover' | 'section' | 'title-body' | 'two-column' | 'key-figures' | 'image-text' | 'image-pair'
  readonly actual?: number
  readonly limit?: number
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
  readonly generation?: GenerationSnapshot
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

export interface SlideContent {
  readonly document?: SlideDocument
  readonly artifact?: ArtifactDescriptor
  readonly imageCredits?: readonly ImageCredit[]
  readonly imageOmissions?: readonly string[]
  readonly notes?: string
  readonly provenance?: readonly ContentOrigin[]
  readonly sessionId: string
  readonly slideId: string
  readonly revision: number
  readonly html: string
}

export interface ConfirmationTarget {
  readonly confirmationId: string
  readonly outlineId: string
  readonly outlineVersion: number
  readonly briefId: string
  readonly briefVersion: number
}

export interface ConfirmationReceipt extends ConfirmationTarget {
  readonly sessionId: string
  readonly deckId: string
  readonly intentId: string
  readonly requestId: string
  readonly fingerprint: string
  readonly createdAt: string
}

export interface GenerationSnapshot {
  readonly receipt: ConfirmationReceipt
  /** The current execution; the original confirmation receipt remains immutable. */
  readonly activeRequestId?: string
  readonly state: 'pending' | 'admitted' | 'generating' | 'generated' | 'incomplete'
  readonly startedAt: string | null
  readonly formatLocked: boolean
  readonly format: 'html'
  readonly design: DesignSnapshot
  readonly selection: { readonly provider: string; readonly model: string }
}

export interface ImageCredit {
  readonly url: string
  readonly author: string
  readonly license: 'public-domain' | 'CC0' | 'CC BY' | 'Pexels' | 'unknown'
  readonly evidence?: 'image-metadata' | 'pexels-cdn'
  readonly downloadUrl?: string
  readonly licenseUrl: string
  readonly unknownLicense: boolean
  readonly retrievedAt: string
}

export interface ImageSelection {
  readonly provider: 'tavily' | 'commons'
  readonly query: string
  readonly imageUrl: string
  readonly description: string
  readonly reason: string
  readonly evidence: 'metadata'
  readonly policy: 'web-images-v1' | 'web-images-v2'
}

export interface ImageSourceCheck {
  readonly sourceUrl: string
  readonly code: string
  readonly httpStatus?: number
}

export interface ImageAttempt {
  readonly candidateId: string
  readonly imageUrl: string
  readonly code: string
  readonly checks: readonly ImageSourceCheck[]
}

export interface OutlineImageReview {
  readonly attempts?: readonly ImageAttempt[]
  readonly digest?: string
  readonly needId: string
  readonly slideIndex: number
  readonly blockIndex: number
  readonly required: boolean
  readonly status: 'prepared' | 'unavailable'
  readonly failure?: string
  readonly credit?: ImageCredit
  readonly selection?: ImageSelection
}

export interface OutlineTarget {
  readonly outlineId: string
  readonly version: number
}

export interface OutlineChanges {
  readonly overviewChanged: boolean
  readonly suggestionsChanged: boolean
  readonly briefFields: readonly string[]
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly changed: readonly string[]
  readonly orderChanged: boolean
}

export interface OutlineProposal extends OutlineTarget {
  /** Derived on read from the pinned catalog; never persisted as proposal content. */
  readonly layoutIssues?: readonly LayoutIssue[]
  readonly imageReview?: readonly OutlineImageReview[]
  readonly brief?: BriefRecord
  readonly revisionSuggestions?: readonly string[]
  readonly previousOutlineId?: string
  readonly restoredFrom?: string
  readonly changes?: OutlineChanges
  readonly requestId: string
  /** Index of the completed assistant response in the public, non-system history. */
  readonly responseIndex: number
  readonly overview: string
  readonly slides: readonly {
    readonly slideId: string
    readonly title: string
    readonly content: string
    readonly blocks?: readonly ContentBlock[]
    readonly sources?: readonly BriefSourceRef[]
  }[]
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
