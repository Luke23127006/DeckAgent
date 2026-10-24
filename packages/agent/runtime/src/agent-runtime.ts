import { RuntimeError } from './contracts.ts'
import type { ActivityEvent, SendOptions, AgentHandle, AgentOptions, JsonValue, Message, ModelAdapter, SessionStore, ToolCall, TurnResult } from './contracts.ts'
import { buildPrompt } from './prompt.ts'
import { ToolRegistry } from './tool-registry.ts'

export interface RuntimeOptions {
  readonly model: ModelAdapter
  readonly sessions: SessionStore
  readonly systemPrompt?: string
  readonly maxSteps?: number
  readonly tools?: ToolRegistry
}

interface LiveAgent {
  readonly options: AgentOptions
  disposed: boolean
  active: Promise<TurnResult> | undefined
  abort: AbortController | undefined
}

/**
 * Fixed, safe text published for a turn failure, keyed by the stable error code.
 * Exception messages are never forwarded: they may carry request URLs, bodies or
 * credentials (CQC-009). Codes not listed here fall back to 'Turn failed'.
 */
const TURN_FAILURE_MESSAGE: Readonly<Record<string, string>> = {
  MODEL_PROTOCOL: 'The model returned an invalid response',
  STEP_LIMIT: 'Agent reached its model-step limit',
}

/**
 * Closed allowlist of the codes the Runtime may publish in a TurnResult. These are
 * the codes produced by the Agent Runtime, Model Providers and Session Persistence.
 * A RuntimeError carrying any other code (a private or spoofed value such as a
 * credential fragment) collapses to TURN_FAILED so it never reaches a caller.
 */
const EXPOSABLE_ERROR_CODES: ReadonlySet<string> = new Set([
  'ABORTED',
  'AGENT_DISPOSED',
  'DUPLICATE_TOOL',
  'INVALID_CONFIG',
  'INVALID_INPUT',
  'INVALID_SESSION',
  'INVALID_TOOL',
  'MODEL_PROTOCOL',
  'PROVIDER_AUTH',
  'PROVIDER_CONFIG',
  'PROVIDER_CREDENTIALS',
  'PROVIDER_HTTP',
  'PROVIDER_NETWORK',
  'PROVIDER_NOT_FOUND',
  'PROVIDER_RATE_LIMIT',
  'PROVIDER_TLS',
  'PROVIDER_TIMEOUT',
  'RUNTIME_DISPOSED',
  'SESSION_BUSY',
  'SESSION_CLOSED',
  'SESSION_CONFIG',
  'SESSION_CONFLICT',
  'SESSION_CORRUPT',
  'SESSION_MESSAGE',
  'SESSION_NOT_FOUND',
  'SESSION_SCHEMA',
  'SESSION_STORAGE',
  'STEP_LIMIT',
  'TOOL_NOT_FOUND',
])

/** Owns live turns, not provider credentials or persistent storage. */
export class AgentRuntime {
  private readonly agents = new Map<string, LiveAgent>()
  private readonly opening = new Map<string, Promise<void>>()
  private disposed = false
  private disposal: Promise<void> | undefined
  private readonly maxSteps: number
  private readonly tools: ToolRegistry

  constructor(private readonly options: RuntimeOptions) {
    this.maxSteps = options.maxSteps ?? 8
    this.tools = options.tools ?? new ToolRegistry()
    if (!Number.isSafeInteger(this.maxSteps) || this.maxSteps < 1) {
      throw new RuntimeError('INVALID_CONFIG', 'maxSteps must be a positive safe integer')
    }
  }

  async createAgent(options: AgentOptions): Promise<AgentHandle> {
    this.assertActive()
    if (!options.sessionId.trim() || !options.selection.provider.trim() || !options.selection.model.trim()) {
      throw new RuntimeError('INVALID_CONFIG', 'Session, provider and model are required')
    }
    if (this.agents.has(options.sessionId) || this.opening.has(options.sessionId)) {
      throw new RuntimeError('SESSION_BUSY', 'This session already has a live Agent')
    }
    const owned = structuredClone(options)
    if (new Set(owned.tools).size !== (owned.tools?.length ?? 0)) {
      throw new RuntimeError('INVALID_CONFIG', 'Agent tool names must be unique')
    }
    this.tools.schemas(owned.tools ?? [])
    const opening = Promise.resolve().then(() => this.options.sessions.open(owned.sessionId))
    this.opening.set(owned.sessionId, opening)
    try {
      await opening
      this.assertActive()
      const state: LiveAgent = { options: owned, disposed: false, active: undefined, abort: undefined }
      this.agents.set(owned.sessionId, state)
      return {
        sessionId: owned.sessionId,
        get status() { return state.disposed ? 'disposed' : state.active ? 'running' : 'idle' },
        send: (input, control) => this.send(state, input, control),
        history: () => this.options.sessions.read(owned.sessionId),
        dispose: () => this.disposeAgent(state),
      }
    } finally {
      this.opening.delete(owned.sessionId)
    }
  }

  private assertActive(): void {
    if (this.disposed) throw new RuntimeError('RUNTIME_DISPOSED', 'Agent Runtime is disposed')
  }

  private async send(state: LiveAgent, input: string, control?: SendOptions): Promise<TurnResult> {
    const signal = control?.signal
    this.assertActive()
    if (state.disposed) throw new RuntimeError('AGENT_DISPOSED', 'Agent is disposed')
    if (state.active) throw new RuntimeError('SESSION_BUSY', 'A turn is already running in this session')
    if (!input.trim()) throw new RuntimeError('INVALID_INPUT', 'User message must not be empty')
    const abort = new AbortController()
    state.abort = abort
    const cancel = () => abort.abort()
    if (signal?.aborted) cancel()
    else signal?.addEventListener('abort', cancel, { once: true })
    const promptContext = control?.promptContext === undefined ? undefined : structuredClone(control.promptContext)
    const active = this.turn(state, input, abort.signal, control?.onActivity, control?.continuation, promptContext).finally(() => {
      signal?.removeEventListener('abort', cancel)
      state.active = undefined
      state.abort = undefined
    })
    state.active = active
    return active
  }

  private async turn(state: LiveAgent, input: string, signal: AbortSignal, onActivity?: SendOptions['onActivity'], continuation = false, promptContext?: readonly Message[]): Promise<TurnResult> {
    let text = ''
    let steps = 0
    let replyCommitted = false
    let activity: ActivityEvent | undefined
    const report = async (event: ActivityEvent) => {
      await onActivity?.(event)
      activity = event.status === 'running' ? event : undefined
    }
    try {
      signal.throwIfAborted()
      if (!continuation) await this.options.sessions.append(state.options.sessionId, [{ role: 'user', content: input }])
      const contextStart = promptContext === undefined ? 0 : (await this.options.sessions.read(state.options.sessionId)).length
      while (steps < this.maxSteps) {
        signal.throwIfAborted()
        steps++
        text = ''
        replyCommitted = false
        const history = await this.options.sessions.read(state.options.sessionId)
        const seenCalls = new Set(history.flatMap(message => message.role === 'assistant' ? message.toolCalls?.map(call => call.id) ?? [] : []))
        const calls: ToolCall[] = []
        let providerState: JsonValue | undefined
        let finish: 'stop' | 'tool-calls' | undefined
        await report({ id: `model-${steps}`, kind: 'model', label: 'Model response', status: 'running' })
        for await (const event of this.options.model.stream({
          selection: structuredClone(state.options.selection),
          messages: buildPrompt(promptContext === undefined ? history : [...promptContext, ...history.slice(contextStart)], this.options.systemPrompt ?? ''),
          tools: this.tools.schemas(state.options.tools ?? []), signal,
        })) {
          signal.throwIfAborted()
          if (finish) throw new RuntimeError('MODEL_PROTOCOL', 'Model emitted data after finish')
          if (event.type === 'text-delta' && typeof event.text === 'string') text += event.text
          else if (event.type === 'tool-call') {
            const call = event.call
            if (!call || typeof call.id !== 'string' || !call.id.trim() || seenCalls.has(call.id)
              || typeof call.name !== 'string' || !call.name.trim() || !call.arguments || typeof call.arguments !== 'object' || Array.isArray(call.arguments)) {
              throw new RuntimeError('MODEL_PROTOCOL', 'Model returned an invalid or duplicate tool call')
            }
            seenCalls.add(call.id)
            calls.push(structuredClone(call))
          } else if (event.type === 'provider-state') providerState = structuredClone(event.state)
          else if (event.type === 'finish' && ['stop', 'tool-calls'].includes(event.reason)) finish = event.reason
          else throw new RuntimeError('MODEL_PROTOCOL', 'Unexpected model event')
        }
        signal.throwIfAborted()
        if (!finish || (finish === 'tool-calls') !== (calls.length > 0)) {
          throw new RuntimeError('MODEL_PROTOCOL', 'Model finish must match the returned tool calls')
        }
        await this.options.sessions.append(state.options.sessionId, [{
          role: 'assistant', content: text, ...(calls.length ? { toolCalls: calls } : {}),
          ...(providerState !== undefined ? { providerState: { ...state.options.selection, data: providerState } } : {}),
        }])
        replyCommitted = true
        await report({ id: `model-${steps}`, kind: 'model', label: 'Model response', status: 'completed' })
        if (!calls.length) return { status: 'completed', text, steps }
        for (const call of calls) {
          if (!signal.aborted) await report({ id: `tool-${call.id}`, kind: 'tool', label: call.name, status: 'running' })
          const result = signal.aborted
            ? this.tools.failure(call, 'TOOL_NOT_STARTED')
            : await this.tools.execute(call, state.options.tools ?? [], signal)
          await this.options.sessions.append(state.options.sessionId, [result])
          if (activity) await report({ ...activity, status: result.isError ? (signal.aborted ? 'unknown' : 'failed') : 'completed' })
        }
        signal.throwIfAborted()
      }
      throw new RuntimeError('STEP_LIMIT', 'Agent reached its model-step limit')
    } catch (error) {
      if (activity) await report({ ...activity, status: activity.kind === 'tool' ? 'unknown' : signal.aborted ? 'stopped' : 'failed' })
      if (text && !replyCommitted) {
        await this.options.sessions.append(state.options.sessionId, [{ role: 'assistant', content: text, interrupted: true }])
      }
      const aborted = signal.aborted
      // Publish only a stable code and fixed text. A failure message is never taken
      // from an exception (it may contain URLs, bodies or credentials, CQC-009); the
      // code is accepted only from the Runtime's closed allowlist so a private or
      // spoofed RuntimeError code (e.g. a credential fragment) cannot leak.
      const code = !aborted && error instanceof RuntimeError && EXPOSABLE_ERROR_CODES.has(error.code)
        ? error.code
        : aborted ? 'ABORTED' : 'TURN_FAILED'
      return {
        status: aborted ? 'cancelled' : 'failed', text, steps,
        error: { code, message: aborted ? 'Turn cancelled' : TURN_FAILURE_MESSAGE[code] ?? 'Turn failed' },
      }
    }
  }

  private async disposeAgent(state: LiveAgent): Promise<void> {
    state.disposed = true
    state.abort?.abort()
    try {
      await state.active
    } finally {
      if (this.agents.get(state.options.sessionId) === state) this.agents.delete(state.options.sessionId)
    }
  }

  dispose(): Promise<void> {
    this.disposed = true
    if (this.disposal === undefined) {
      this.disposal = Promise.allSettled([
        ...this.opening.values(), ...[...this.agents.values()].map(state => this.disposeAgent(state)),
      ]).then(results => {
        const errors = results.flatMap(result => result.status === 'rejected' ? [result.reason] : [])
        if (errors.length) throw new AggregateError(errors, 'Agent disposal failed')
      })
    }
    return this.disposal
  }
}
