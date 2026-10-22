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
  readonly status: 'running' | 'completed' | 'failed' | 'cancelled'
  readonly result?: TurnResult
}

/** Browser projection deliberately excludes provider protocol metadata and tool arguments. */
export interface HistoryMessage {
  readonly role: 'user' | 'assistant' | 'tool'
  readonly content: string
}

export interface HostOptions {
  /** Host owns the returned handle until the turn and disposal finish. */
  readonly openAgent: (sessionId: string, requestId: string, request: AgentRequest) => Promise<AgentHandle>
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
  readonly sessionId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly messageCount: number
  readonly selection?: ModelSelection
  readonly selectable: boolean
  readonly activeRequestId?: string
}

export interface StoredActivity extends ActivityEvent {
  readonly requestId: string
  readonly sequence: number
}

export interface StoredRequest {
  readonly requestId: string
  readonly selection: ModelSelection
  readonly status: 'running' | 'completed' | 'failed' | 'cancelled' | 'unknown'
  readonly errorCode?: string
  /** Index before this turn in the public (non-system) history. Absent on older records. */
  readonly historyStart?: number
}

/** Management inputs are untrusted JSON; application validates before mutating storage. */
export interface WebManagement {
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
