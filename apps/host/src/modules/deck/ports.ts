import type { BriefSourceRef } from '@deckagent/deck'
import type { RequestStatus } from '@deckagent/host-contracts'
import type { RunEvent, RunOwner, RunPlan, RunSnapshot, RunStartOptions, RunTools } from '../../runs/ports.ts'
import type { ResearchSourceRecord } from '../research/index.ts'

export interface DeckAttachmentRecord {
  readonly attachmentId: string
  readonly name: string
  readonly state: string
  readonly detectedType?: string
  readonly source?: BriefSourceRef
}

export interface DeckSourceCatalogueItem {
  readonly sourceId: string
  readonly version: number
  readonly kind: string
  readonly label: string
}

/** Chat operations the deck module needs. `ChatService` implements it. */
export interface DeckChats {
  getInfo(sessionId: string): Promise<unknown>
  history(sessionId: string): Promise<readonly { readonly role: string }[]>
}

/** Sent attachments the deck module inspects for source ownership. `AttachmentService` implements it. */
export interface DeckAttachments {
  sent(sessionId: string): readonly DeckAttachmentRecord[]
}

export interface DeckRunRecord {
  readonly requestId: string
  readonly status: RequestStatus
  readonly lastSequence: number
  readonly errorCode?: string
}

/** Run-store operations the deck module reads. `SqliteRunStore` implements it. */
export interface DeckRuns {
  activeFor(owner: RunOwner): string | undefined
  get(requestId: string): DeckRunRecord | undefined
  text(requestId: string): string
  sourceCatalogue(sessionId: string): readonly DeckSourceCatalogueItem[]
  researchSources(sessionId: string): readonly ResearchSourceRecord[]
}

export interface DeckRunStarter {
  start(plan: RunPlan, options?: RunStartOptions): Promise<RunSnapshot>
}

export interface DeckToolRun {
  readonly requestId: string
  readonly sessionId: string
  readonly signal: AbortSignal
  readonly tools?: RunTools
  emit(event: RunEvent): Promise<void>
}

export interface ImageParserPort {
  parse(input: { readonly name: string; readonly bytes: Uint8Array; readonly signal: AbortSignal }): Promise<{
    readonly parts: readonly ({ readonly type: 'image'; readonly data: string } | { readonly type: string })[]
  }>
  close(): Promise<void>
}
