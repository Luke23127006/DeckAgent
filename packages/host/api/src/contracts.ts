import type { ActivityEvent, AgentHandle, Message, ModelSelection, TurnResult } from '@deckagent/agent-runtime'
import type { DeckReader, OutlineReader, OutlineTarget } from '@deckagent/deck'

export interface AgentRequest {
  readonly sessionId: string
  readonly input: string
  /** Explicit presentation entry preserves generic chat/file requests. */
  readonly presentation?: true
  readonly outlineTarget?: OutlineTarget
  readonly outlineAction?: OutlineTarget & { readonly type: 'confirm' | 'cancel' }
}

export interface RequestSnapshot {
  readonly requestId: string
  readonly sessionId: string
  readonly status: 'running' | 'awaiting_user' | 'completed' | 'failed' | 'cancelled'
  readonly question?: UserQuestion
  readonly result?: TurnResult
}

export interface QuestionDraft {
  readonly prompt: string
  readonly options: readonly string[]
  readonly allowSkip: boolean
}

export interface UserQuestion extends QuestionDraft {
  readonly questionId: string
  readonly version: number
}

export interface RequestReply {
  readonly sessionId: string
  readonly questionId: string
  readonly version: number
  readonly replyId: string
  readonly answer: { readonly type: 'text'; readonly text: string } | { readonly type: 'option'; readonly index: number } | { readonly type: 'skip' }
}

/** Application wrapper releases each model turn before exposing a pending question. */
export interface RequestAgent extends AgentHandle {
  question?(): QuestionDraft | undefined
}

/** Browser projection deliberately excludes provider protocol metadata and tool arguments. */
export interface HistoryMessage {
  readonly role: 'user' | 'assistant' | 'tool'
  readonly content: string
  /** Optional tool identity for matching output to its Activity; no tool arguments. */
  readonly toolCallId?: string
  readonly name?: string
  readonly isError?: boolean
}

export interface HostOptions {
  /**
   * Host owns the returned handle until the turn and disposal finish.
   * Absent while no Agent runtime is connected: `POST /api/requests` is refused with `REQUESTS_UNAVAILABLE`.
   */
  readonly openAgent?: (sessionId: string, requestId: string, request: AgentRequest) => Promise<RequestAgent>
  /** Persist an active transition before it becomes visible or starts more model work. */
  readonly requestState?: (snapshot: RequestSnapshot) => Promise<void>
  /** Runs after handle disposal and before terminal snapshot/Session lock release. */
  readonly finishRequest?: (request: AgentRequest, requestId: string, result: TurnResult) => Promise<void>
  readonly readHistory: (sessionId: string) => Promise<readonly Message[]>
  readonly port?: number
  readonly management?: WebManagement
  readonly decks?: DeckReader
  readonly outlines?: OutlineReader
  /** Fixed trusted assets only. Workspace files are never exposed over HTTP. */
  readonly assets?: Readonly<Record<string, { readonly contentType: string; readonly body: string; readonly sandboxed?: boolean }>>
}

export interface ProviderSettings {
  readonly id: string
  readonly displayName: string
  readonly protocol: 'chat-completions' | 'anthropic-messages' | 'gemini'
  readonly baseUrl: string
  readonly models: readonly string[]
  readonly hasKey: boolean
  readonly keyAvailable: boolean
}

export interface WebSettings {
  readonly providers: readonly ProviderSettings[]
  readonly persistentKeys: boolean
  readonly builtIns: readonly ProviderTemplate[]
}

export interface ProviderTemplate {
  readonly id: string
  readonly displayName: string
  readonly protocol: ProviderSettings['protocol']
  readonly baseUrl: string
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

export interface StoredActivity extends ActivityEvent {
  readonly requestId: string
  readonly sequence: number
}

export interface StoredRequest {
  readonly requestId: string
  readonly selection: ModelSelection
  readonly status: 'running' | 'awaiting_user' | 'completed' | 'failed' | 'cancelled' | 'unknown'
  readonly question?: UserQuestion
  readonly errorCode?: string
  /** Index before this turn in the public (non-system) history. Absent on older records. */
  readonly historyStart?: number
  /** Public history index of a Host-authored recovery notice, when saved. */
  readonly noticeIndex?: number
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
