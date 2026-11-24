import type { ConfirmationReceipt } from './deck.ts'

export interface ModelSelection {
  readonly provider: string
  readonly model: string
}

/** A generic chat request (B02). Generation entries arrive with their own builds. */
export interface AgentRequest {
  /** Explicit user request to finish an existing incomplete deck, without another confirmation. */
  readonly continueDeck?: true
  readonly deck?: DeckRequest
  readonly publicResearch?: boolean
  readonly sessionId: string
  readonly input: string
  readonly attachmentIds?: readonly string[]
  readonly draftRevision?: number
}

export interface DeckRequest {
  readonly action: 'collect' | 'skip' | 'revise' | 'question' | 'clarify' | 'restore'
  readonly expectedBriefVersion: number
  readonly expectedOutline: { readonly outlineId: string; readonly version: number } | null
  readonly restoreOutlineId?: string
  readonly formatChoice?: 'html'
  readonly imageChoice?: 'none' | 'attachments' | 'public-research'
  readonly imageProviderChoice?: 'tavily' | 'commons'
  readonly sourceChoice?: {
    readonly material: boolean
    readonly modelKnowledge: boolean
    readonly publicResearch: boolean
  }
}

/** Safe history projection, independent of private managed-file metadata. */
export interface AttachmentView {
  readonly attachmentId: string
  readonly name: string
  readonly state: 'preparing' | 'ready' | 'rejected'
  readonly byteSize: number
  readonly detectedType?: string
  readonly rejectionCode?: string
  readonly preparation?: {
    readonly parserVersion: string
    readonly capabilities: readonly string[]
    readonly completeness: 'complete' | 'partial'
    readonly omitted: readonly { readonly code: string; readonly entry?: string }[]
  }
  readonly source?: {
    readonly sourceId: string
    readonly version: number
    readonly kind: 'attachment'
    readonly label: string
  }
}

export interface ApprovalView {
  readonly approvalId: string
  readonly requestId: string
  readonly operation: 'read-file'
  readonly target: string
  readonly reason: string
  readonly state: 'pending' | 'allowed' | 'refused' | 'cancelled'
}

/** Request lifecycle decided by the Host (ADR-0004). `active` and `waiting_approval` hold the chat's one active slot. */
export type RequestStatus = 'active' | 'waiting_approval' | 'completed' | 'failed' | 'stopped' | 'interrupted'
export type ActivityStatus = 'running' | 'completed' | 'failed' | 'stopped'
export type TerminalStatus = 'completed' | 'failed' | 'stopped' | 'interrupted'

/** Sanitized product events. Raw runtime output, provider errors and credentials never become an event. */
export type RequestEventBody =
  | { readonly kind: 'status'; readonly status: RequestStatus; readonly errorCode?: string }
  | {
      readonly kind: 'activity'
      readonly id: string
      readonly label: string
      readonly type: 'model' | 'tool'
      readonly status: ActivityStatus
    }
  | { readonly kind: 'text'; readonly part: string; readonly text: string }
  | { readonly kind: 'notice'; readonly code: string }
  | { readonly kind: 'approval'; readonly approval: ApprovalView }

export type RequestEvent = RequestEventBody & {
  readonly requestId: string
  /** Monotonic within the request; the reconnect cursor. */
  readonly sequence: number
  readonly timestamp: string
}

/** Current state of one request, read from saved records. `sequence` is the newest saved event. */
export interface RequestSnapshot {
  readonly requestId: string
  readonly sessionId: string
  readonly status: RequestStatus
  readonly errorCode?: string
  /** Assistant text saved so far. */
  readonly text: string
  readonly sequence: number
  readonly pendingApproval?: ApprovalView | null
}

export interface StoredRequest {
  readonly publicResearch?: boolean
  readonly requestId: string
  readonly sessionId: string
  readonly status: RequestStatus
  readonly selection: ModelSelection
  /** Index of the request's user message in the public history. */
  readonly historyStart: number
  readonly startedAt: string
  readonly endedAt?: string
  readonly errorCode?: string
  readonly lastSequence: number
  /** FR-079: the conversation before this request was summarized for the model; the summary starts here. */
  readonly summarized?: true
}

export interface StoredActivity {
  readonly requestId: string
  readonly sequence: number
  readonly id: string
  readonly label: string
  readonly type: 'model' | 'tool'
  readonly status: ActivityStatus
}

/** Browser projection deliberately excludes provider protocol metadata and tool arguments. */
export interface HistoryMessage {
  readonly role: 'user' | 'assistant' | 'tool'
  readonly content: string
  /** An assistant reply of a request that did not finish: the part saved before it ended. */
  readonly interrupted?: true
  /** Optional tool identity for matching output to its Activity; no tool arguments. */
  readonly toolCallId?: string
  readonly name?: string
  readonly isError?: boolean
  readonly attachments?: readonly AttachmentView[]
}

export interface ConfirmationResult {
  readonly receipt: ConfirmationReceipt
  readonly request: RequestSnapshot
}
