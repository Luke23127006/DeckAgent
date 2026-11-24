import type { GenerationCapability, GenerationGrant } from '@deckagent/deck'
import type { AgentRequest, ModelSelection, RequestEventBody } from '@deckagent/host-contracts'
import type { RequestTools } from './tool-contracts.ts'

/** What a runtime may report; the Host alone writes status events. */
export type RuntimeEvent = Exclude<RequestEventBody, { readonly kind: 'status' | 'approval' }>

/** A request the runtime accepted: its settings are frozen at admission (FR-042). Holds no secret visible to the Host API. */
export interface PreparedRequest {
  /** Host-frozen policy for a continuation of an already confirmed deck. */
  readonly publicResearch?: boolean
  readonly selection: ModelSelection
  start(run: RequestRun): Promise<RuntimeOutcome>
}

export interface RequestRun {
  readonly presentation?: GenerationCapability
  readonly generation?: GenerationGrant
  /** Trusted Host phase policy, never read from model output or source content. */
  readonly instructions?: string
  readonly tools?: RequestTools
  onApprovalWait?(listener: (waiting: boolean) => void): () => void
  readonly requestId: string
  readonly sessionId: string
  /** Aborted at terminal state, including Stop, Host shutdown or a refused write. */
  readonly signal: AbortSignal
  /** Persists, then publishes. Rejects once the request has ended, so late work cannot write. */
  emit(event: RuntimeEvent): Promise<void>
}

/** Runtime evidence only; the Host decides the request status. `commit` runs after a completed request is saved. */
export type RuntimeOutcome =
  | { readonly status: 'completed'; commit?(): void }
  | { readonly status: 'failed'; readonly errorCode: string }

export interface RequestRuntime {
  /** Validates the chat, its selected model and the runtime, and freezes the settings. Throws HttpError with the reason. */
  prepare(request: AgentRequest): Promise<PreparedRequest>
}

/** Host-only admission settings. HTTP and model inputs cannot supply these callbacks or IDs. */
export interface RequestAdmission {
  readonly requestId: string
  readonly prepared: PreparedRequest
  admitted(): void
}
