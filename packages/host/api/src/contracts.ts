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
  /** Monotonic per-request state revision; absent on older Hosts. */
  readonly revision?: number
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
  /** Host owns the returned handle until the turn and disposal finish. */
  readonly openAgent: (sessionId: string, requestId: string, request: AgentRequest) => Promise<RequestAgent>
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
  readonly latestRequest?: RequestSummary
  readonly workspaceId?: string
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
}

export interface StoredActivity extends ActivityEvent {
  readonly startedAt?: number
  readonly endedAt?: number
  readonly requestId: string
  readonly sequence: number
}

export interface StoredRequest {
  readonly revision?: number
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

export interface RequestSummary {
  readonly requestId: string
  readonly status: StoredRequest['status']
  /** Durable request admission order, not a success indicator. */
  readonly sequence: number
  readonly revision?: number
}

/** Management inputs are untrusted JSON; application validates before mutating storage. */
export interface WebManagement {
  workspaces?(): Promise<readonly Workspace[]>
  addWorkspace?(value: unknown): Promise<Workspace>
  removeWorkspace?(id: string): Promise<void>
  repointWorkspace?(id: string, value: unknown): Promise<Workspace>
  settings(): Promise<WebSettings>
  saveProvider(id: string, value: unknown): Promise<void>
  deleteProvider(id: string): Promise<void>
  catalog(id: string): Promise<readonly string[]>
  sessions(): Promise<readonly WebSession[]>
  createSession(value: unknown): Promise<WebSession>
  selectModel(id: string, value: unknown): Promise<WebSession>
  activities(id: string): Promise<readonly StoredActivity[]>
  requests(id: string): Promise<readonly StoredRequest[]>
}

export interface Workspace {
  readonly id: string
  readonly name: string
  readonly projectFolder?: string
  readonly state: 'available' | 'missing'
}
