import type { AgentHandle, Message, TurnResult } from '@deckagent/agent-runtime'

export interface AgentRequest {
  readonly sessionId: string
  readonly input: string
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
  readonly openAgent: (sessionId: string) => Promise<AgentHandle>
  readonly readHistory: (sessionId: string) => Promise<readonly Message[]>
  readonly port?: number
  /** Fixed trusted assets only. Workspace files are never exposed over HTTP. */
  readonly assets?: Readonly<Record<string, { readonly contentType: string; readonly body: string }>>
}
