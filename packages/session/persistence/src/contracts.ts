/** Chat contracts owned by DeckAgent persistence. No runtime or transport types cross this seam. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface SourceRef {
  readonly sourceId: string
  readonly version: number
  readonly kind: 'attachment'
  readonly label: string
}

/** Metadata only. Physical storage locations never cross this interface. */
export interface AttachmentRecord {
  readonly attachmentId: string
  readonly name: string
  readonly state: 'preparing' | 'ready' | 'rejected'
  readonly byteSize: number
  readonly detectedType?: string
  readonly rejectionCode?: string
  readonly fingerprint?: string
  readonly source?: SourceRef
  readonly preparation?: AttachmentPreparation
  readonly parsedFingerprint?: string
}

export interface AttachmentPreparation {
  readonly parserVersion: string
  readonly capabilities: readonly string[]
  readonly completeness: 'complete' | 'partial'
  readonly omitted: readonly { readonly code: string; readonly entry?: string }[]
}

export interface DraftSnapshot {
  readonly text: string
  readonly attachmentIds: readonly string[]
  readonly revision: number
}

export interface ToolCall {
  readonly id: string
  readonly name: string
  readonly arguments: Readonly<Record<string, JsonValue>>
}

export interface ModelSelection {
  readonly provider: string
  readonly model: string
}

/** Protocol metadata replayed only by the matching connection and model. Never credentials. */
export interface ProviderState extends ModelSelection {
  readonly data: JsonValue
}

export type Message =
  | { readonly role: 'system'; readonly content: string }
  | { readonly role: 'user'; readonly content: string; readonly attachments?: readonly AttachmentRecord[] }
  | {
      readonly role: 'assistant'
      readonly content: string
      readonly toolCalls?: readonly ToolCall[]
      readonly interrupted?: true
      readonly providerState?: ProviderState
    }
  | {
      readonly role: 'tool'
      readonly content: string
      readonly toolCallId: string
      readonly name: string
      readonly isError: boolean
    }

export interface SessionInfo {
  readonly sessionId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly selection?: ModelSelection
  /** The selected model that was removed from its provider configuration; the chat has no selected model (FR-065). */
  readonly removedSelection?: ModelSelection
  readonly messageCount: number
  /** `null` is an ungrouped chat: its workspace was removed. */
  readonly workspaceId: string | null
}

/** Request lifecycle owned by the Host (ADR-0004). `active` and `waiting_approval` hold the chat's one active slot. */
export type RequestStatus = 'active' | 'waiting_approval' | 'completed' | 'failed' | 'stopped' | 'interrupted'
export type ActivityStatus = 'running' | 'completed' | 'failed' | 'stopped'
export type TerminalStatus = 'completed' | 'failed' | 'stopped' | 'interrupted'

/** A sanitized product event. Raw runtime output, provider errors and credentials never become an event. */
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

export interface ApprovalView {
  readonly approvalId: string
  readonly requestId: string
  readonly operation: 'read-file'
  readonly target: string
  readonly reason: string
  readonly state: 'pending' | 'allowed' | 'refused' | 'cancelled'
}

export type RequestEvent = RequestEventBody & {
  readonly requestId: string
  /** Monotonic within the request; the reconnect cursor. */
  readonly sequence: number
  readonly timestamp: string
}

export interface RequestRecord {
  readonly requestId: string
  readonly sessionId: string
  readonly status: RequestStatus
  /** Model the request was admitted with; later changes never apply to it (FR-042). */
  readonly selection: ModelSelection
  /** Index of the request's user message in the conversation. */
  readonly historyStart: number
  readonly startedAt: string
  readonly endedAt?: string
  readonly errorCode?: string
  /** Sequence of the newest saved event. */
  readonly lastSequence: number
  /**
   * FR-079: during this request the conversation before it was summarized for the model. The summary starts at
   * this request's user message; every earlier message stays readable.
   */
  readonly summarized?: true
}

/** Latest state of one activity; `sequence` is where it first happened, so activities keep their order. */
export interface ActivityRecord {
  readonly requestId: string
  readonly sequence: number
  readonly id: string
  readonly label: string
  readonly type: 'model' | 'tool'
  readonly status: ActivityStatus
}

/** Chat -> OpenCode native session, saved only after a completed request (ADR-0002). */
export interface RuntimeBinding {
  readonly sessionId: string
  readonly nativeSessionId: string
  readonly selection: ModelSelection
  /** Execution context identity: managed working folder and tool boundary. */
  readonly context: string
  /** The completed request that last used the native session. */
  readonly lastRequestId: string
}

/** One earlier chat as the list shows it. `readable: false` keeps a damaged chat listed instead of hiding it. */
export interface ChatSummary extends SessionInfo {
  readonly title: string
  readonly readable: boolean
}

export class SessionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'SessionError'
  }
}
