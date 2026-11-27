import type { ContentBlock, DesignSnapshot, WebImageIntent } from '@deckagent/design'
import type { ContentOrigin, FormatAdapter, SlideDocument, ValidationIssue } from '@deckagent/presentation-document'
import type { BriefSourceRef } from './brief-contracts.ts'
import type { OutlineProposal } from './outline-contracts.ts'
import type { DeckSlide, PublishedSlide } from './deck-contracts.ts'

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
/** An object identity issued by DeckStore, never a model-supplied grant or a persisted credential. */
export interface GenerationGrant {
  readonly intentId: string
  readonly requestId: string
  readonly sessionId: string
}
export interface DeckOptions {
  readonly onDeckChanged?: (sessionId: string, version: number) => void
  readonly onBriefChanged?: (sessionId: string, version: number) => void
  readonly onOutlineChanged?: (sessionId: string, version: number) => void
  readonly formats?: readonly FormatAdapter[]
  readonly legacyHtmlPolicy?: (source: unknown) => void
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
  readonly license: 'public-domain' | 'CC0' | 'CC BY' | 'Pexels' | 'unknown'
  readonly evidence?: 'image-metadata' | 'pexels-cdn'
  readonly downloadUrl?: string
  readonly licenseUrl: string
  readonly unknownLicense: boolean
  readonly retrievedAt: string
}
export interface PreparedResearchImage extends PreparedImageAsset {
  readonly credit: ImageCredit
  readonly selection?: ImageSelection
  readonly attempts?: readonly ImageAttempt[]
}
export interface ImageNeed {
  readonly contextBlocks: readonly ContentBlock[]
  readonly needId: string
  readonly slideIndex: number
  readonly blockIndex: number
  readonly title: string
  readonly content: string
  readonly query: string
  readonly caption: string
  readonly provider: 'tavily' | 'commons'
  readonly intent: WebImageIntent
  readonly required: boolean
  readonly replace: boolean
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
export type ImageResolver = (need: ImageNeed, signal: AbortSignal) => Promise<PreparedResearchImage>
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
  readonly imageNeedId?: string
  readonly selection?: ImageSelection
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
