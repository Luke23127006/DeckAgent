import type { DeckReader, OutlineReader } from '@deckagent/deck'
import type {
  AgentRequest,
  AttachmentView,
  BriefView,
  ChatDraft,
  ConfirmationResult,
  ModelSelection,
  RequestEventBody,
  RequestSnapshot,
  StoredActivity,
  StoredRequest,
  TerminalStatus,
  WebPreferences,
  WebSession,
  WebSettings,
  WorkspaceList,
} from '@deckagent/host-contracts'
export type { BriefDraft, BriefRecord, BriefSnapshot, BriefSourceRef } from '@deckagent/deck'
export type {
  ActivityStatus,
  AgentRequest,
  AttachmentView,
  BriefView,
  ChatDraft,
  ConfirmationResult,
  DeckRequest,
  HistoryMessage,
  ModelSelection,
  ProviderProtocol,
  ProviderSettings,
  ProviderTemplate,
  RequestEvent,
  RequestEventBody,
  RequestSnapshot,
  RequestStatus,
  StoredActivity,
  StoredRequest,
  TerminalStatus,
  WebPreferences,
  WebSession,
  WebSettings,
  WorkspaceFolderStatus,
  WorkspaceList,
  WorkspaceView,
} from '@deckagent/host-contracts'
import type { PreparedTools, RequestTools } from './tool-contracts.ts'
import type { RequestStore } from '@deckagent/session-persistence'
export type { RequestStore }
export type {
  ApprovalStep,
  ApprovalView,
  PreparedTools,
  RequestTools,
  ToolContext,
  ToolResult,
  ToolSchema,
} from './tool-contracts.ts'

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
  readonly presentation?: import('@deckagent/deck').GenerationCapability
  readonly generation?: import('@deckagent/deck').GenerationGrant
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

/** Saved conversation message as the Host reads it. */
export interface HostMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool'
  readonly content: string
  readonly interrupted?: boolean
  readonly toolCallId?: string
  readonly name?: string
  readonly isError?: boolean
  readonly attachments?: readonly AttachmentView[]
}

export interface HostOptions {
  readonly confirmations?: {
    confirm(
      sessionId: string,
      value: unknown,
      submit: (request: AgentRequest, options: RequestAdmission) => Promise<RequestSnapshot>,
    ): Promise<ConfirmationResult>
  }
  readonly briefs?: BriefManagement
  /** Absent while no Agent runtime is connected: `POST /api/requests` is refused with `REQUESTS_UNAVAILABLE`. */
  readonly requests?: {
    /** Host-owned summary derived from committed product state, including explicit Stop. */
    readonly closingText?: (sessionId: string, requestId: string, status: TerminalStatus) => string | undefined
    readonly store: RequestStore
    readonly runtime: RequestRuntime
    readonly prepareTools?: (
      sessionId: string,
      attachmentIds?: readonly string[],
      publicResearch?: boolean,
    ) => Promise<PreparedTools>
  }
  readonly readHistory: (sessionId: string) => Promise<readonly HostMessage[]>
  readonly port?: number
  readonly management?: WebManagement
  readonly attachments?: AttachmentManagement
  readonly decks?: DeckReader
  readonly outlines?: OutlineReader
  /** Fixed trusted assets only. Workspace files are never exposed over HTTP. */
  readonly assets?: Readonly<
    Record<string, { readonly contentType: string; readonly body: string; readonly sandboxed?: boolean }>
  >
}
/** Host-only admission settings. HTTP and model inputs cannot supply these callbacks or IDs. */
export interface RequestAdmission {
  readonly requestId: string
  readonly prepared: PreparedRequest
  admitted(): void
}
export interface BriefManagement {
  interview?(
    sessionId: string,
  ): Promise<{ readonly brief: BriefView; readonly state: import('@deckagent/deck').InterviewState }>
  get(sessionId: string, version?: number): Promise<BriefView>
  save(sessionId: string, value: unknown): Promise<BriefView>
}

export interface AttachmentManagement {
  readonly maxBytes: number
  readonly maxFiles: number
  upload(input: {
    readonly sessionId: string
    readonly name: string
    readonly expectedRevision: number
    readonly bytes: AsyncIterable<Uint8Array>
    readonly signal: AbortSignal
    readonly complete?: Promise<void>
  }): Promise<{ readonly attachment: AttachmentView; readonly draft: ChatDraft }>
  get(sessionId: string, attachmentId: string): Promise<AttachmentView>
  remove(sessionId: string, attachmentId: string, expectedRevision: number): Promise<ChatDraft>
  preview(
    sessionId: string,
    attachmentId: string,
    signal: AbortSignal,
  ): Promise<{ readonly body: Uint8Array; readonly contentType: string }>
}

/** Management inputs are untrusted JSON; application validates before mutating storage. */
export interface WebManagement {
  readonly research?: {
    save(value: unknown): Promise<void>
    remove(): Promise<void>
    sources(sessionId: string): Promise<unknown>
  }
  /** Optional: an older application without it simply has no `/api/preferences`. */
  readonly preferences?: {
    get(): Promise<WebPreferences>
    save(value: unknown): Promise<WebPreferences>
  }
  settings(): Promise<WebSettings>
  saveProvider(id: string, value: unknown): Promise<void>
  deleteProvider(id: string): Promise<void>
  catalog(id: string): Promise<readonly string[]>
  sessions(): Promise<readonly WebSession[]>
  /** Creates the chat in the workspace in use. */
  createSession(value: unknown): Promise<WebSession>
  selectModel(id: string, value: unknown): Promise<WebSession>
  activities(id: string): Promise<readonly StoredActivity[]>
  requests(id: string): Promise<readonly StoredRequest[]>
  /** Optional: an application without workspaces has no `/api/workspaces` routes. */
  readonly workspaces?: WorkspaceManagement
  /** Earlier chats whose name or conversation holds the words. Body: `{ words }`. */
  searchSessions?(value: unknown): Promise<readonly WebSession[]>
  readonly drafts?: {
    get(sessionId: string): Promise<ChatDraft>
    save(sessionId: string, value: unknown): Promise<ChatDraft>
  }
}

/** Workspace operations. Every input is untrusted JSON; the application validates it. */
export interface WorkspaceManagement {
  list(): Promise<WorkspaceList>
  /** Body: `{ folder }`. Sets up a workspace, or finds the one of that folder, and makes it the workspace in use. */
  add(value: unknown): Promise<WorkspaceList>
  /** Body: `{ id }`. */
  select(value: unknown): Promise<WorkspaceList>
  /** Body: `{ name }`. */
  rename(id: string, value: unknown): Promise<WorkspaceList>
  /** Body: `{ folder }`. */
  relink(id: string, value: unknown): Promise<WorkspaceList>
  remove(id: string): Promise<WorkspaceList>
}
