/** Chat contracts owned by DeckAgent persistence. No runtime or transport types cross this seam. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

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
  | { readonly role: 'system' | 'user'; readonly content: string }
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
  readonly messageCount: number
  /** `null` is an ungrouped chat: its workspace was removed. */
  readonly workspaceId: string | null
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
