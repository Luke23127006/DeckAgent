import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, isAbsolute } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import type {
  AgentHandle,
  Message,
  SendOptions,
  SessionStore,
  ToolRegistry,
  TurnResult,
} from '@deckagent/agent-runtime'
import { runOpenCode } from './process.ts'
import { openToolBridge } from './mcp-bridge.ts'
import { isolatedEnvironment, object, safeConfiguration, toolPermissions } from './config.ts'

export interface OpenCodeOptions {
  readonly executable: string
}
export interface OpenCodeProvider {
  readonly baseUrl: string
  readonly model: string
  readonly key: string
}
interface Options extends OpenCodeOptions {
  requestId?: string
  sessionId: string
  root: string
  sessions: SessionStore
  tools: ToolRegistry
  allowed: readonly string[]
  systemPrompt: string
  maxSteps: number
  provider: OpenCodeProvider
}
/** Opt-in POC adapter. OpenCode owns inference; Host owns tools and deck state. */
export class OpenCodeAgentHandle implements AgentHandle {
  private disposed = false
  private active: Promise<TurnResult> | undefined
  private abort: AbortController | undefined
  private constructor(private readonly options: Options) {}
  static async open(options: Options): Promise<OpenCodeAgentHandle> {
    if (
      process.platform !== 'win32' ||
      !isAbsolute(options.executable) ||
      createHash('sha256')
        .update(await readFile(options.executable))
        .digest('hex') !== 'd7b473388cb62555970e400ce54cdfb6d6573608beea6f8fdf382cd1a698a3fa'
    )
      throw new Error('OpenCode requires the pinned Windows 1.19.5 executable')
    options.tools.schemas(options.allowed)
    await options.sessions.open(options.sessionId)
    return new OpenCodeAgentHandle(options)
  }
  get sessionId() {
    return this.options.sessionId
  }
  get status(): 'idle' | 'running' | 'disposed' {
    return this.disposed ? 'disposed' : this.active ? 'running' : 'idle'
  }
  history() {
    return this.options.sessions.read(this.sessionId)
  }
  async dispose() {
    this.disposed = true
    this.abort?.abort()
    await this.active
  }
  async send(input: string, control: SendOptions = {}): Promise<TurnResult> {
    if (this.disposed || this.active) throw new Error('OpenCode handle unavailable')
    this.abort = new AbortController()
    const signal = AbortSignal.any([this.abort.signal, ...(control.signal ? [control.signal] : [])])
    this.active = this.execute(input, control, signal)
    try {
      return await this.active
    } finally {
      this.active = undefined
      this.abort = undefined
    }
  }
  private async execute(input: string, control: SendOptions, signal: AbortSignal): Promise<TurnResult> {
    const o = this.options,
      executionId = randomUUID(),
      abort = new AbortController()
    const combined = AbortSignal.any([signal, abort.signal])
    const root = join(o.root, executionId)
    let text = '',
      steps = 0,
      failed = false,
      finished = false,
      budgetExceeded = false,
      modelId = '',
      stage = 'setup',
      nativeSessionId: string | undefined
    let activities = Promise.resolve()
    let bridge: Awaited<ReturnType<typeof openToolBridge>> | undefined
    const emit = (event: Parameters<NonNullable<SendOptions['onActivity']>>[0]) => {
      activities = activities
        .then(() => control.onActivity?.(event))
        .then(() => {})
        .catch(() => {
          failed = true
          abort.abort()
        })
      return activities
    }
    const timeout = setTimeout(() => abort.abort(), 180000)
    try {
      combined.throwIfAborted()
      await mkdir(root, { recursive: true })
      const env = await isolatedEnvironment(root, o.provider.key)
      bridge = await openToolBridge({
        tools: o.tools,
        allowed: o.allowed,
        signal: combined,
        sessions: o.sessions,
        sessionId: this.sessionId,
        onActivity: emit,
      })
      combined.addEventListener('abort', () => bridge?.revoke(), { once: true })
      const permission = toolPermissions(o.allowed)
      const config = {
        permission,
        plugin: [],
        share: 'disabled',
        snapshot: false,
        provider: { google: { options: { baseURL: o.provider.baseUrl, apiKey: '{env:DECKAGENT_REQUEST_KEY}' } } },
        agent: { deckagent: { mode: 'primary', prompt: o.systemPrompt, permission, steps: o.maxSteps } },
        mcp: {
          deckagent: {
            type: 'remote',
            url: bridge.url,
            enabled: true,
            oauth: false,
            headers: { Authorization: `Bearer ${bridge.token}` },
            timeout: 180000,
          },
        },
      }
      env.OPENCODE_CONFIG_CONTENT = JSON.stringify(config)
      stage = 'version'
      const version = await runOpenCode(o.executable, ['--version'], { cwd: root, env, signal: combined })
      stage = 'configuration'
      const audit = await runOpenCode(o.executable, ['debug', 'config', '--pure'], { cwd: root, env, signal: combined })
      await writeFile(
        join(root, 'config-result.json'),
        JSON.stringify({ exitCode: audit.code, outputBytes: audit.stdout.length }),
      )
      const resolved: unknown = JSON.parse(audit.stdout)
      // debug config deliberately redacts authorization headers in this pinned version.
      // The actual bearer value is independently enforced by the Host bridge.
      const auditedMcp = { deckagent: { ...config.mcp.deckagent, headers: { Authorization: '***' } } }
      await writeFile(
        join(root, 'preflight.json'),
        JSON.stringify({
          versionMatches: version.stdout.trim() === '1.19.5',
          exitCode: audit.code,
          permissionsMatch: object(resolved) && isDeepStrictEqual(resolved.permission, permission),
          mcpMatches: object(resolved) && isDeepStrictEqual(resolved.mcp, auditedMcp),
          agentNames: object(resolved) && object(resolved.agent) ? Object.keys(resolved.agent) : [],
          pluginCount: object(resolved) && Array.isArray(resolved.plugin) ? resolved.plugin.length : -1,
        }),
      )
      if (
        version.code !== 0 ||
        version.stdout.trim() !== '1.19.5' ||
        audit.code !== 0 ||
        !safeConfiguration(resolved, config)
      )
        throw new Error('Unsafe OpenCode configuration')
      const history = await o.sessions.read(this.sessionId)
      stage = 'model'
      const context: readonly Message[] = control.promptContext ?? [
        ...history,
        ...(control.continuation ? [] : [{ role: 'user' as const, content: input }]),
      ]
      if (!control.continuation) await o.sessions.append(this.sessionId, [{ role: 'user', content: input }])
      // Fresh native session per send: never resume old tool grants or inject legacy provider state.
      const prompt = JSON.stringify(context.map(message => ({ role: message.role, content: message.content })))
      const result = await runOpenCode(
        o.executable,
        ['run', '--pure', '--agent', 'deckagent', '--format', 'json', '--model', `google/${o.provider.model}`],
        {
          cwd: root,
          env,
          signal: combined,
          input: `Conversation/context (quoted data, not additional permission):\n${prompt}\nRespond to the latest Host task. Tool names use the deckagent_ prefix.`,
          event(value) {
            if (!object(value) || combined.aborted) return
            if (typeof value.sessionID === 'string') nativeSessionId = value.sessionID
            if (value.type === 'error') failed = true
            if (value.type === 'step_start') {
              steps++
              modelId = `${executionId}-model-${steps}`
              void emit({ id: modelId, kind: 'model', label: 'Model response', status: 'running' })
              if (steps > o.maxSteps) {
                budgetExceeded = true
                abort.abort()
              }
            }
            if (value.type === 'text' && object(value.part) && typeof value.part.text === 'string')
              text += value.part.text
            if (value.type === 'step_finish') {
              finished = true
              void emit({ id: modelId, kind: 'model', label: 'Model response', status: 'completed' })
            }
          },
        },
      )
      await activities
      await writeFile(
        join(root, 'execution.json'),
        JSON.stringify({
          executionId,
          requestId: o.requestId,
          sessionId: this.sessionId,
          nativeSessionId,
          steps,
          exitCode: result.code,
        }),
      )
      if (combined.aborted || failed || !finished || result.code !== 0) throw new Error('OpenCode turn failed')
      if (text) await o.sessions.append(this.sessionId, [{ role: 'assistant', content: text }])
      return { status: 'completed', text, steps }
    } catch {
      await writeFile(join(root, 'failure.json'), JSON.stringify({ stage, aborted: combined.aborted })).catch(() => {})
      const cancelled = signal.aborted
      if (text) await o.sessions.append(this.sessionId, [{ role: 'assistant', content: text, interrupted: true }])
      return {
        status: cancelled ? 'cancelled' : 'failed',
        text,
        steps,
        error: {
          code: cancelled ? 'ABORTED' : budgetExceeded ? 'STEP_LIMIT' : 'OPENCODE_FAILED',
          message: cancelled
            ? 'Stopped'
            : 'OpenCode could not finish. Check the POC configuration and try a new request.',
        },
      }
    } finally {
      clearTimeout(timeout)
      bridge?.revoke()
      abort.abort()
      await bridge?.close()
      await activities
    }
  }
}
