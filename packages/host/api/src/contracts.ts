import type { DeckReader, OutlineReader } from '@deckagent/deck'

export interface ModelSelection {
  readonly provider: string
  readonly model: string
}

/** A generic chat request (B02). Generation entries arrive with their own builds. */
export interface AgentRequest {
  readonly sessionId: string
  readonly input: string
}

/** Request lifecycle decided by the Host (ADR-0004). `active` and `waiting_approval` hold the chat's one active slot. */
export type RequestStatus = 'active' | 'waiting_approval' | 'completed' | 'failed' | 'stopped' | 'interrupted'
export type ActivityStatus = 'running' | 'completed' | 'failed' | 'stopped'
export type TerminalStatus = 'completed' | 'failed' | 'stopped' | 'interrupted'

/** Sanitized product events. Raw runtime output, provider errors and credentials never become an event. */
export type RequestEventBody =
  | { readonly kind: 'status'; readonly status: RequestStatus; readonly errorCode?: string }
  | { readonly kind: 'activity'; readonly id: string; readonly label: string; readonly type: 'model' | 'tool'; readonly status: ActivityStatus }
  | { readonly kind: 'text'; readonly part: string; readonly text: string }
  | { readonly kind: 'notice'; readonly code: string }

/** What a runtime may report; the Host alone writes status events. */
export type RuntimeEvent = Exclude<RequestEventBody, { readonly kind: 'status' }>

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
}

export interface StoredRequest {
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

/** Durable request records. The application adapts its storage owner; writes after a request ends are refused. */
export interface RequestStore {
  /** Saves the user's message and the active request together. Throws when the chat already has an active request. */
  admit(input: { readonly requestId: string; readonly sessionId: string; readonly input: string; readonly selection: ModelSelection }): StoredRequest
  append(requestId: string, event: RuntimeEvent): RequestEvent
  /** Ends an active request once; `undefined` when it had already ended. */
  finish(requestId: string, status: TerminalStatus, errorCode?: string): readonly RequestEvent[] | undefined
  get(requestId: string): StoredRequest | undefined
  events(requestId: string, after?: number): readonly RequestEvent[]
  text(requestId: string): string
  activeFor(sessionId: string): string | undefined
}

/** A request the runtime accepted: its settings are frozen at admission (FR-042). Holds no secret visible to the Host API. */
export interface PreparedRequest {
  readonly selection: ModelSelection
  start(run: RequestRun): Promise<RuntimeOutcome>
}

export interface RequestRun {
  readonly requestId: string
  readonly sessionId: string
  /** Aborted by Stop, Host shutdown or a refused write. */
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
}

export interface HostOptions {
  /** Absent while no Agent runtime is connected: `POST /api/requests` is refused with `REQUESTS_UNAVAILABLE`. */
  readonly requests?: { readonly store: RequestStore; readonly runtime: RequestRuntime }
  readonly readHistory: (sessionId: string) => Promise<readonly HostMessage[]>
  readonly port?: number
  readonly management?: WebManagement
  readonly decks?: DeckReader
  readonly outlines?: OutlineReader
  /** Fixed trusted assets only. Workspace files are never exposed over HTTP. */
  readonly assets?: Readonly<Record<string, { readonly contentType: string; readonly body: string; readonly sandboxed?: boolean }>>
}

/** API protocols of BR-005 V-4. */
export type ProviderProtocol = 'chat-completions' | 'responses' | 'anthropic-messages' | 'gemini'

export interface ProviderSettings {
  readonly id: string
  readonly displayName: string
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
  readonly models: readonly string[]
  /** Whether a key is saved. No part of a key is ever returned (FR-040). */
  readonly hasKey: boolean
  /** The saved key can be read on this computer and account. */
  readonly keyAvailable: boolean
  readonly builtIn: boolean
}

export interface WebSettings {
  readonly providers: readonly ProviderSettings[]
  /** The credential store of this computer can keep keys. */
  readonly persistentKeys: boolean
  readonly builtIns: readonly ProviderTemplate[]
  /** Whether the Agent runtime can run requests, and why not. */
  readonly runtime: { readonly available: boolean; readonly reason?: string }
}

export interface ProviderTemplate {
  readonly id: string
  readonly displayName: string
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
  /** What the user gives for this provider (BR-006). */
  readonly needs: readonly ('key' | 'baseUrl')[]
}

export interface WebSession {
  /** Derived from the first user message; absent on older Hosts. */
  readonly title?: string
  /** True only when at least one slide has a published revision. */
  readonly hasSlides?: boolean
  readonly sessionId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly messageCount: number
  readonly selection?: ModelSelection
  /** The selected model was removed; the chat has no selected model (FR-065). */
  readonly removedSelection?: ModelSelection
  readonly selectable: boolean
  readonly activeRequestId?: string
  /** Workspace of the chat; `null` for an ungrouped chat. */
  readonly workspaceId: string | null
  /** False when the saved work of the chat cannot be read; the chat stays listed (FR-050). */
  readonly readable: boolean
  /** True while the Host keeps a non-empty draft for the chat. */
  readonly hasDraft?: boolean
}

export type WorkspaceFolderStatus = 'none' | 'available' | 'unreadable' | 'different-folder'

/** Browser projection of a workspace. The folder path is shown to the user who chose it, on the local Host only. */
export interface WorkspaceView {
  readonly id: string
  readonly name: string
  readonly folder: string | null
  readonly isDefault: boolean
  readonly folderStatus: WorkspaceFolderStatus
}

export interface WorkspaceList {
  readonly workspaces: readonly WorkspaceView[]
  /** The workspace in use. */
  readonly selectedId: string
}

export interface ChatDraft {
  readonly sessionId: string
  readonly text: string
}

/** Interface preferences kept by the Host, so they survive a change of origin (the local port is random). */
export interface WebPreferences {
  readonly theme: 'light' | 'dark' | 'system'
}

/** Management inputs are untrusted JSON; application validates before mutating storage. */
export interface WebManagement {
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
