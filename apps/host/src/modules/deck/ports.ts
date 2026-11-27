import type { BriefSourceRef } from '@deckagent/deck'
import type { StoredRequest } from '@deckagent/host-contracts'
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
export interface DeckSessionStore {
  getInfo(sessionId: string): Promise<unknown>
  read(sessionId: string): Promise<readonly { readonly role: string }[]>
  readonly attachments: { sent(sessionId: string): readonly DeckAttachmentRecord[] }
  readonly requests: {
    activeFor(sessionId: string): string | undefined
    get(requestId: string): StoredRequest | undefined
    text(requestId: string): string
    sourceCatalogue(sessionId: string): readonly DeckSourceCatalogueItem[]
    researchSources(sessionId: string): readonly ResearchSourceRecord[]
  }
}
export interface ImageParserPort {
  parse(input: { readonly name: string; readonly bytes: Uint8Array; readonly signal: AbortSignal }): Promise<{
    readonly parts: readonly ({ readonly type: 'image'; readonly data: string } | { readonly type: string })[]
  }>
  close(): Promise<void>
}
