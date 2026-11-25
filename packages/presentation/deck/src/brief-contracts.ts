import type { CatalogRef, DesignSnapshot, ThemeValues } from '@deckagent/design'
import type { SourceReference } from '@deckagent/presentation-document'
import type { briefTopics } from './brief.ts'
import type { OutlineTarget } from './outline-contracts.ts'

export type BriefSourceRef = SourceReference
export type InterviewTopic = (typeof briefTopics)[number]
export interface BriefDraft {
  readonly presenterNotes?: boolean
  readonly topic?: string
  readonly audience?: string
  readonly durationMinutes?: number
  readonly purpose?: string
  readonly language?: string
  readonly requirements: readonly string[]
  readonly answers: readonly { readonly topic: InterviewTopic; readonly value: string }[]
  readonly assumptions: readonly string[]
  readonly sources: {
    readonly material: boolean
    readonly modelKnowledge: boolean
    readonly publicResearch: boolean
    readonly refs: readonly BriefSourceRef[]
  }
  readonly images: {
    readonly mode: 'none' | 'attachments' | 'public-research' | 'unavailable'
    readonly provider?: 'tavily' | 'commons'
    readonly attachmentIds: readonly string[]
    readonly unmetRequirements: readonly string[]
  }
  readonly proposedSlideCount?: number
  readonly requestedFormat?: string
  readonly generationFormat?: 'html'
  readonly template?: CatalogRef
  readonly designSystem?: CatalogRef
  readonly themeOverrides?: Partial<ThemeValues>
}
export interface BriefRecord {
  readonly sessionId: string
  readonly briefId: string
  readonly version: number
  readonly createdAt: string
  readonly draft: BriefDraft
  readonly design: DesignSnapshot | null
}
export interface InterviewState {
  readonly questions: readonly {
    readonly topic: InterviewTopic
    readonly prompt: string
    readonly suggestions: readonly string[]
    readonly required: boolean
  }[]
  readonly blockers: readonly { readonly code: string; readonly message: string }[]
  readonly readyForOutline: boolean
  readonly skipAllowed: boolean
  readonly notice: string
}
export interface BriefSnapshot {
  readonly sessionId: string
  readonly version: number
  readonly current: BriefRecord | null
  readonly locked: boolean
}

export interface BriefProposalInput {
  readonly requestId: string
  readonly responseIndex: number
  readonly expectedBriefVersion: number
  readonly expectedOutline: OutlineTarget | null
  readonly draft: unknown
  readonly outline?: unknown
  readonly restoredFrom?: string
}
