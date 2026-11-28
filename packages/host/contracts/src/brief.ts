import type { SourceReference } from '@deckagent/presentation-document'

export type BriefSourceRef = SourceReference

export type InterviewTopic =
  | 'topic'
  | 'audience'
  | 'duration'
  | 'purpose'
  | 'sources'
  | 'language'
  | 'images'
  | 'format'
  | 'template'
  | 'design-system'

export interface CatalogRef {
  readonly id: string
  readonly version: number
}

export interface ThemeValues {
  readonly 'color.background': string
  readonly 'color.surface': string
  readonly 'color.text': string
  readonly 'color.muted': string
  readonly 'color.accent': string
  readonly 'color.onAccent': string
  readonly 'color.border': string
  readonly 'font.heading': string
  readonly 'font.body': string
  readonly 'type.display': number
  readonly 'type.heading': number
  readonly 'type.body': number
  readonly 'type.caption': number
  readonly 'space.unit': number
  readonly 'type.lineHeight': number
}

export interface DesignSnapshot {
  readonly format: 'html'
  readonly designSystem: CatalogRef
  readonly template: CatalogRef
  readonly theme: ThemeValues
  readonly rules: readonly string[]
  readonly brandAssets: readonly string[]
  readonly viewport: { readonly width: 1280; readonly height: 720 }
  readonly fingerprint: string
}

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

export interface BriefSnapshot {
  readonly sessionId: string
  readonly version: number
  readonly current: BriefRecord | null
  readonly locked: boolean
}

export interface BriefView extends BriefSnapshot {
  /** A receipt is not proof that the source bytes can still be read. Reads recheck B03 permissions. */
  readonly sourceStates: readonly { readonly source: BriefSourceRef; readonly status: 'recorded' | 'unavailable' }[]
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
