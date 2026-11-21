import type { CatalogRef, DesignSnapshot, ThemeValues } from '@deckagent/design'
import { FormatError } from '@deckagent/presentation-document'
import type {
  SourceReference,
  ContentOrigin,
  SlideDocument,
  FormatAdapter,
  ArtifactDescriptor,
  ValidationIssue,
} from '@deckagent/presentation-document'
export type { CatalogRef, ContentBlock, DesignSnapshot, ThemeValues } from '@deckagent/design'

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
  readonly generation?: GenerationSnapshot
  readonly sessionId: string
  readonly deckId: string
  readonly outlineId: string | null
  readonly version: number
  readonly slides: readonly DeckSlide[]
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
/** An object identity issued by DeckService, never a model-supplied grant or a persisted credential. */
export interface GenerationGrant {
  readonly intentId: string
  readonly requestId: string
  readonly sessionId: string
}
export interface DeckOptions {
  readonly formats?: readonly FormatAdapter[]
  readonly researchImage?: (sessionId: string, query: string, signal: AbortSignal) => Promise<PreparedResearchImage>
  readonly activeRequest?: (sessionId: string, requestId: string) => boolean
  readonly artifactRoot?: string
  readonly renderCheck?: (html: string, requiredText: readonly string[], signal: AbortSignal) => Promise<void>
  readonly preparedImage?: (sessionId: string, attachmentId: string, signal: AbortSignal) => Promise<PreparedImageAsset>
}
export interface PreparedImageAsset {
  readonly bytes: Uint8Array
  readonly source: BriefSourceRef
  readonly originalDigest: string
  readonly parsedDigest: string
}
export interface ImageCredit {
  readonly url: string
  readonly author: string
  readonly license: 'public-domain' | 'CC0' | 'CC BY' | 'unknown'
  readonly licenseUrl: string
  readonly unknownLicense: boolean
  readonly retrievedAt: string
}
export interface PreparedResearchImage extends PreparedImageAsset {
  readonly credit: ImageCredit
}
export interface StageStatus {
  readonly rules?: readonly string[]
  readonly starter?: string
  readonly document?: SlideDocument
  readonly assets?: readonly ArtifactAsset[]
  readonly stageId: string
  readonly nextSequence: number
  readonly finalized: boolean
  readonly digest: string | null
}
export interface StageChunk {
  readonly sequence: number
  readonly text: string
  readonly final: boolean
}
export interface ArtifactPublication {
  readonly stageId: string
  readonly slideId: string
  readonly expectedRevision: number
  readonly publicationId: string
}
export interface ArtifactAsset {
  readonly assetId: string
  readonly source: BriefSourceRef
  readonly attachmentId?: string
  readonly webQuery?: string
  readonly credit?: ImageCredit
  readonly digest: string
  readonly originalDigest: string
  readonly parsedDigest: string
  readonly byteSize: number
}
export type ContentProvenance = ContentOrigin
export interface GenerationCapability {
  draft(stageId: string): StageStatus
  document(stageId: string, document: SlideDocument): void
  validate(input: ArtifactPublication): Promise<readonly ValidationIssue[]>
  researchImage(stageId: string, slideId: string, query: string): Promise<ArtifactAsset>
  plan(): {
    readonly generation: GenerationSnapshot
    readonly outline: OutlineProposal
    readonly slides?: readonly DeckSlide[]
  }
  begin(slideId: string, layoutId: string): StageStatus
  append(stageId: string, chunk: StageChunk): StageStatus
  provenance(stageId: string, records: readonly ContentProvenance[], notes?: string): void
  discard(stageId: string): void
  image(stageId: string, slideId: string, attachmentId: string): Promise<ArtifactAsset>
  publish(input: ArtifactPublication): Promise<PublishedSlide>
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
  readonly document?: SlideDocument
  readonly artifact?: ArtifactDescriptor
  readonly imageCredits?: readonly ImageCredit[]
  readonly imageOmissions?: readonly string[]
  readonly notes?: string
  readonly provenance?: readonly ContentProvenance[]
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

export interface OutlineDraft {
  readonly overview: string
  readonly slides: readonly { readonly title: string; readonly content: string }[]
}

export interface OutlineTarget {
  readonly outlineId: string
  readonly version: number
}

export interface OutlineProposal extends OutlineTarget {
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
    readonly blocks?: readonly import('@deckagent/design').ContentBlock[]
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
    readonly blocks: readonly import('@deckagent/design').ContentBlock[]
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
export interface BriefProposalInput {
  readonly requestId: string
  readonly responseIndex: number
  readonly expectedBriefVersion: number
  readonly expectedOutline: OutlineTarget | null
  readonly draft: unknown
  readonly outline?: unknown
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
  outlineSnapshot(sessionId: string): OutlineSnapshot
}

export class DeckError extends FormatError {
  constructor(code: string, issues: readonly ValidationIssue[] = []) {
    super(code, issues)
    this.message = deckFailureMessage(code) ? `${code}: ${deckFailureMessage(code)}` : code
    this.name = 'DeckError'
  }
}

const failureMessages: Readonly<Record<string, string>> = {
  IMAGE_PREPARATION_REQUIRED:
    'Required images are not prepared. Revise the Outline query, select an alternative or explicitly mark the image optional before confirming again.',
  SLIDE_CORRECTION_LIMIT:
    'The correction budget for this slide is exhausted. Review the validation issues and retained publications before starting a new request.',
  CONFIRMATION_INVALID: 'Confirm exactly the displayed Outline and Brief. Refresh the proposal and try again.',
  CONFIRMATION_CONFLICT:
    'This confirmation targets different saved content. Reload the current proposal before confirming.',
  BRIEF_STALE: 'The Brief changed. Reload it and review the current Outline before confirming.',
  GENERATION_UNAVAILABLE:
    'Generation is not connected. Keep the saved proposal and retry when generation is available.',
  GENERATION_MODEL_CHANGED: 'Select the model used by this confirmation before retrying admission.',
  GENERATION_REQUEST_INACTIVE: 'This generation request has ended. Read the saved Deck; no further writes are allowed.',
  STAGE_LIMIT: 'Two stages are open. Publish or discard one before opening another.',
  STAGE_CHUNK_INVALID:
    'Send a nonempty, well-formed UTF-8 chunk of at most 8 KiB with its expected sequence and final flag.',
  STAGE_SOURCE_TOO_LARGE:
    'The slide source exceeds 256 KiB. Revise it explicitly and resubmit; no content was truncated.',
  STAGE_CHUNK_CONFLICT:
    'This sequence already has different bytes. Retry identical content or start a corrected stage.',
  STAGE_INCOMPLETE: 'Complete the staged source before publication.',
  ARTIFACT_UNSAFE_HTML:
    'Use supported static HTML. Remove active content, embeds and non-managed references, then resubmit.',
  ARTIFACT_UNSAFE_CSS:
    'Use supported layout declarations and named theme roles. Remove imports, URLs and unsupported declarations.',
  ARTIFACT_THEME_MISMATCH: 'Use the supplied effective theme variables instead of adding colours, fonts or type sizes.',
  ARTIFACT_RENDERER_UNAVAILABLE:
    'Install a supported local Chrome or Edge browser before publishing. The current revision was kept.',
  ARTIFACT_OVERFLOW: 'Content exceeds the 1280 by 720 slide. Revise the layout and resubmit.',
  ARTIFACT_REQUIRED_CONTENT_MISSING: 'Include all planned headings and content visibly before publishing.',
  ARTIFACT_UNREADABLE: 'Some content is invisible or unreadable. Revise its layout or theme use and resubmit.',
  ARTIFACT_CORRUPT:
    'Published bytes are missing or changed. Keep a backup of the data folder and restore a known-good copy.',
}
export function deckFailureMessage(code: string): string | undefined {
  return failureMessages[code]
}

export function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value)
}
