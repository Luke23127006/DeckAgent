import type { ContentBlock, LayoutIssue } from '@deckagent/design'
import type { BriefRecord, BriefSourceRef } from './brief-contracts.ts'
import type { OutlineImageReview } from './generation-contracts.ts'

export interface OutlineDraft {
  readonly overview: string
  readonly slides: readonly { readonly title: string; readonly content: string }[]
}

export interface OutlineTarget {
  readonly outlineId: string
  readonly version: number
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

export interface OutlineChanges {
  readonly overviewChanged: boolean
  readonly suggestionsChanged: boolean
  readonly briefFields: readonly string[]
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly changed: readonly string[]
  readonly orderChanged: boolean
}
export interface BoundOutlineDraft {
  readonly overview: string
  readonly revisionSuggestions: readonly string[]
  readonly slides: readonly {
    readonly slideId?: string
    readonly title: string
    readonly content: string
    readonly blocks: readonly ContentBlock[]
    readonly sources: readonly BriefSourceRef[]
  }[]
}
export interface BoundOutlineInput {
  readonly requestId: string
  readonly responseIndex: number
  readonly expectedOutline: OutlineTarget | null
  readonly expectedBrief: { readonly briefId: string; readonly version: number }
  readonly draft: unknown
  readonly restoredFrom?: string
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
  outlineImagePreview?(sessionId: string, outlineId: string, needId: string): Uint8Array
  outlineSnapshot(sessionId: string): OutlineSnapshot
}
