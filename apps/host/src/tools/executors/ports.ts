import type { ParsedAttachment } from '../sources/attachment-contracts.ts'

/** Chat metadata the executors read; the composition supplies the real chat store. */
export interface ToolSessionInfo {
  readonly workspaceId: string | null
}

/** Project folders the executors may read; the composition supplies the workspace registry. */
export interface ToolWorkspaceLookup {
  readonly get: (id: string) => Promise<{ readonly folderStatus: string; readonly folder?: string | null }>
  readonly folders: () => readonly string[]
}

/** Admitted attachment bytes; the composition supplies managed attachment storage. */
export interface ToolAttachmentReader {
  prepared(sessionId: string, attachmentId: string, signal: AbortSignal): Promise<ParsedAttachment>
  read(sessionId: string, attachmentId: string, signal: AbortSignal): Promise<Uint8Array>
}

/** One public research capability, bound at request admission. */
export interface ToolResearchSession {
  readonly revision: string
  search(query: string, requestId: string, sessionId: string, signal: AbortSignal): Promise<readonly unknown[]>
}

export interface ToolAttachmentSource {
  readonly sourceId: string
  readonly version: number
  readonly kind: 'attachment'
  readonly label: string
}

export interface ToolAttachmentPreparation {
  readonly parserVersion: string
  readonly capabilities: readonly string[]
  readonly completeness: 'complete' | 'partial'
  readonly omitted: readonly { readonly code: string; readonly entry?: string }[]
}

export interface ToolAttachmentRecord {
  readonly attachmentId: string
  readonly name: string
  readonly state: 'preparing' | 'ready' | 'rejected'
  readonly detectedType?: string
  readonly fingerprint?: string
  readonly parsedFingerprint?: string
  readonly preparation?: ToolAttachmentPreparation
  readonly source?: ToolAttachmentSource
}

export interface ToolResearchSource {
  readonly sourceId: string
  readonly version: 1
  readonly kind: 'research'
  readonly provider: 'tavily'
  readonly query: string
  readonly title: string
  readonly url: string
  readonly content: string
  readonly partial: true
  readonly fingerprint: string
  readonly retrievedAt: string
  readonly providerRequestId?: string
  readonly location: { readonly kind: 'research-result'; readonly start: 0; readonly end: number }
}

export interface ToolSourceCatalogueItem {
  readonly sourceId: string
  readonly version: number
  readonly kind: string
  readonly label: string
}

export interface ToolSourceReadInput {
  readonly origin: string
  readonly label: string
  readonly fingerprint: string
  readonly lineCount: number
  readonly kind: 'project-file' | 'approved-file'
}

export interface ToolSourceReadReceipt extends ToolSourceCatalogueItem {
  readonly kind: 'project-file' | 'approved-file'
  readonly location: { readonly kind: 'lines'; readonly start: number; readonly end: number }
}

/** Chat metadata the source tools read. `ChatService` implements it. */
export interface ToolChats {
  getInfo(sessionId: string): Promise<ToolSessionInfo | undefined>
}

/** Attachment metadata the source tools read. `SqliteAttachmentStore` implements it. */
export interface ToolAttachmentRecords {
  sent(sessionId: string): readonly ToolAttachmentRecord[]
  get(sessionId: string, attachmentId: string): ToolAttachmentRecord
}

/** Run source records that the source tools read and write. `SqliteRunStore` implements it. */
export interface ToolRuns {
  sourceCatalogue(sessionId: string): readonly ToolSourceCatalogueItem[]
  researchSources(sessionId: string): readonly ToolResearchSource[]
  recordSourceRead(requestId: string, value: ToolSourceReadInput): ToolSourceReadReceipt
}
