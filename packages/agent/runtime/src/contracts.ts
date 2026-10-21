/** Provider-neutral contracts owned by DeckAgent. No Harness types cross this seam. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
export type ToolArguments = Readonly<Record<string, JsonValue>>

export interface ToolCall {
  readonly id: string
  readonly name: string
  readonly arguments: ToolArguments
}

export type Message =
  | { readonly role: 'system' | 'user'; readonly content: string }
  | { readonly role: 'assistant'; readonly content: string; readonly toolCalls?: readonly ToolCall[]; readonly interrupted?: true; readonly providerState?: ProviderState }
  | { readonly role: 'tool'; readonly content: string; readonly toolCallId: string; readonly name: string; readonly isError: boolean }

/** Initial supported schema subset: closed objects with primitive parameters. */
export interface ToolSchema {
  readonly name: string
  readonly description: string
  readonly parameters: {
    readonly type: 'object'
    readonly properties: Readonly<Record<string, { readonly type: 'string' | 'number' | 'boolean' }>>
    readonly required?: readonly string[]
    readonly additionalProperties: false
  }
}

export interface ModelSelection {
  readonly provider: string
  readonly model: string
}

/** Protocol metadata is replayed only by the matching connection and model. Never credentials. */
export interface ProviderState extends ModelSelection {
  readonly data: JsonValue
}

export interface ModelRequest {
  readonly selection: ModelSelection
  readonly messages: readonly Message[]
  readonly tools: readonly ToolSchema[]
  readonly signal: AbortSignal
}

/** Adapters normalize incremental provider arguments into complete tool calls. */
export type ModelEvent =
  | { readonly type: 'text-delta'; readonly text: string }
  | { readonly type: 'tool-call'; readonly call: ToolCall }
  /** Opaque protocol state (e.g. thought signatures), persisted with this assistant message. */
  | { readonly type: 'provider-state'; readonly state: JsonValue }
  | { readonly type: 'finish'; readonly reason: 'stop' | 'tool-calls' }

export interface ModelAdapter {
  /** Must settle promptly when request.signal is aborted. Exceptions fail this turn. */
  stream(request: ModelRequest): AsyncIterable<ModelEvent>
}

export interface ToolDefinition extends ToolSchema {
  /** Must observe signal and settle before disposal completes. */
  execute(args: ToolArguments, context: { readonly signal: AbortSignal }): Promise<string>
}

export interface SessionStore {
  /** Create an empty session if absent; otherwise open its existing history. */
  open(sessionId: string): Promise<void>
  read(sessionId: string): Promise<readonly Message[]>
  /** Append the complete batch in order or reject without a partial batch. */
  append(sessionId: string, messages: readonly Message[]): Promise<void>
}

export interface Failure { readonly code: string; readonly message: string }
export type TurnResult =
  | { readonly status: 'completed'; readonly text: string; readonly steps: number }
  | { readonly status: 'failed' | 'cancelled'; readonly text: string; readonly steps: number; readonly error: Failure }

export interface AgentOptions {
  readonly sessionId: string
  readonly selection: ModelSelection
  /** Only these tools may be advertised and called by this Agent. Default: none. */
  readonly tools?: readonly string[]
}

export interface AgentHandle {
  readonly sessionId: string
  readonly status: 'idle' | 'running' | 'disposed'
  send(input: string, options?: SendOptions): Promise<TurnResult>
  history(): Promise<readonly Message[]>
  /** Cancel and await active work. Keeps session history; releases the live identity. */
  dispose(): Promise<void>
}

/** Observable work only; never contains model reasoning, credentials or raw exceptions. */
export interface ActivityEvent {
  readonly id: string
  readonly kind: 'model' | 'tool'
  readonly label: string
  readonly status: 'running' | 'completed' | 'failed' | 'stopped' | 'unknown'
}

export interface SendOptions {
  readonly signal?: AbortSignal
  /** Awaited before proceeding so a durable sink can preserve activity ordering. */
  readonly onActivity?: (event: ActivityEvent) => Promise<void>
}

export class RuntimeError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'RuntimeError'
  }
}
