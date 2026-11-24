import type {
  ApprovalView,
  ModelSelection,
  RequestEvent,
  RequestEventBody,
  RequestRecord,
  TerminalStatus,
} from './contracts.ts'

export interface ApprovalStep {
  readonly key: string
  readonly operation: 'read-file'
  readonly target: string
  readonly reason: string
}

/** Durable request records. Writes after a request ends are refused. */
export interface RequestStore {
  readonly approvals?: {
    create(
      requestId: string,
      step: ApprovalStep,
    ): { readonly approval: ApprovalView; readonly events: readonly RequestEvent[] }
    decide(
      requestId: string,
      approvalId: string,
      decision: 'allow-once' | 'refuse',
    ): { readonly approval: ApprovalView; readonly events: readonly RequestEvent[] }
    pending(requestId: string): ApprovalView | undefined
  }
  /** Saves the user's message and the active request together. Throws when the chat already has an active request. */
  admit(input: {
    readonly publicResearch?: boolean
    readonly requestId: string
    readonly sessionId: string
    readonly input: string
    readonly selection: ModelSelection
    readonly attachmentIds?: readonly string[]
    readonly draftRevision?: number
  }): RequestRecord
  append(requestId: string, event: Exclude<RequestEventBody, { readonly kind: 'status' | 'approval' }>): RequestEvent
  /** Ends an active request once; `undefined` when it had already ended. */
  finish(requestId: string, status: TerminalStatus, errorCode?: string): readonly RequestEvent[] | undefined
  get(requestId: string): RequestRecord | undefined
  events(requestId: string, after?: number): readonly RequestEvent[]
  text(requestId: string): string
  activeFor(sessionId: string): string | undefined
}
