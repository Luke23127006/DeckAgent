import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { access, mkdir, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { delimiter, isAbsolute, join } from 'node:path'
import type { AgentRequest, RequestRun, RuntimeEvent, RuntimeOutcome } from '@deckagent/host-api'
import { summarizedNotice } from '@deckagent/session-persistence'
import type { ProviderRunSettings } from '../../features/providers/index.ts'
import { OpenCodeError } from './contracts.ts'
import type { OpenCodeExecutor, RuntimeSessionAccess } from './contracts.ts'
import {
  encodeConfiguration,
  isolatedEnvironment,
  pinnedVersion,
  runtimeConfiguration,
  safeConfiguration,
  toolBoundary,
} from './config.ts'
import { openToolBridge } from './mcp-bridge.ts'
import type { RuntimeFolders } from './config.ts'
import { errorCode, isContextOverflow, parseEvent } from './events.ts'
import { seedPrompt } from './history.ts'
import { runProcess } from './process.ts'
import { UnsupportedProviderError, selector } from './provider.ts'
import { resourceExecutable } from './resources.ts'

export interface OpenCodeOptions {
  /** Absolute developer override. Absent: use app resources, the installed platform runtime, then PATH. */
  readonly executable?: string
  /** Prepared release resources. App startup defaults to its own resources/opencode directory. */
  readonly resourceDir?: string
  /** Version the CLI must report. Tests with a fake CLI may set their own. */
  readonly version?: string
  /** Longest a request may run before it is ended as not finished. */
  readonly timeoutMs?: number
  /** Arguments placed before every OpenCode argument, for a launcher such as `node cli.mjs` (developer checks). */
  readonly launcherArgs?: readonly string[]
}

/** Finds the CLI as a real executable file: `opencode.exe` on Windows (a .cmd shim needs a shell and is not used). */
export async function findExecutable(
  configured: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
  resourceDir?: string,
): Promise<string | undefined> {
  if (!configured && resourceDir) {
    const bundled = await resourceExecutable(resourceDir)
    if (bundled.present) return bundled.executable
  }
  let installed: string | undefined
  if (!configured && process.platform === 'win32' && process.arch === 'x64') {
    try {
      installed = createRequire(import.meta.url).resolve('opencode-windows-x64/bin/opencode.exe')
    } catch {
      // Optional platform packages can be omitted; startup reports the missing runtime.
    }
  }
  const candidates = configured
    ? [configured]
    : [
        ...(installed ? [installed] : []),
        ...(env.PATH ?? env.Path ?? '')
          .split(delimiter)
          .filter(Boolean)
          .map(folder => join(folder, process.platform === 'win32' ? 'opencode.exe' : 'opencode')),
      ]
  for (const candidate of candidates) {
    if (!isAbsolute(candidate)) continue
    try {
      if (!(await stat(candidate)).isFile()) continue
      if (process.platform !== 'win32') await access(candidate, constants.X_OK)
      return candidate
    } catch {
      /* Next candidate. */
    }
  }
  return undefined
}

interface Attempt {
  readonly outcome: RuntimeOutcome
  readonly nativeSessionId?: string
  /** Nothing ran in the native session: a missing or unusable session to resume. */
  readonly noWork: boolean
}

/**
 * The OpenCode CLI as DeckAgent's Agent Runtime (ADR-0002/0003/0004/0006): `opencode run --format json`, one isolated
 * run per request, native session resume only when its guard holds. The Host decides the request status.
 */
export class OpenCodeRuntime implements OpenCodeExecutor {
  private versionCheck: Promise<boolean> | undefined
  private healthy = false
  private get launcher(): readonly string[] {
    return this.options.launcherArgs ?? []
  }

  constructor(
    private readonly executable: string | undefined,
    private readonly runtimeRoot: string,
    private readonly sessions: RuntimeSessionAccess,
    private readonly options: OpenCodeOptions = {},
  ) {}

  /** Check the executable before the browser can offer Send; no model call is made. */
  async initialize(): Promise<void> {
    this.healthy = !!this.executable && (await this.checkVersion(this.executable))
  }

  /** Whether requests can run, and why not, for the interface. */
  availability(): { available: boolean; reason?: string } {
    if (!this.executable) return { available: false, reason: 'RUNTIME_UNAVAILABLE' }
    return this.healthy ? { available: true } : { available: false, reason: 'RUNTIME_VERSION_UNSUPPORTED' }
  }

  async ensureAvailable(): Promise<void> {
    if (!this.executable) throw new OpenCodeError('RUNTIME_UNAVAILABLE')
    if (!(await this.checkVersion(this.executable)))
      throw new OpenCodeError('RUNTIME_VERSION_UNSUPPORTED', { version: this.options.version ?? pinnedVersion })
  }

  private checkVersion(executable: string): Promise<boolean> {
    this.versionCheck ??= (async () => {
      const folder = join(this.runtimeRoot, 'shared', 'home')
      await mkdir(folder, { recursive: true })
      const result = await runProcess(executable, [...this.launcher, '--version'], {
        cwd: folder,
        env: {
          PATH: process.env.PATH ?? '',
          SystemRoot: process.env.SystemRoot ?? '',
          HOME: folder,
          USERPROFILE: folder,
        },
        signal: AbortSignal.timeout(30_000),
        collect: true,
        maxOutputBytes: 4096,
      })
      return result.code === 0 && result.stdout.trim() === (this.options.version ?? pinnedVersion)
    })().catch(() => false)
    // A failed check is tried again next time (the CLI may have been installed meanwhile).
    void this.versionCheck.then(ok => {
      if (!ok) this.versionCheck = undefined
    })
    return this.versionCheck
  }

  private async folders(chatId: string): Promise<RuntimeFolders> {
    const shared = join(this.runtimeRoot, 'shared')
    const chat = join(this.runtimeRoot, 'chats', createHash('sha256').update(chatId).digest('hex').slice(0, 32))
    const folders = {
      home: join(shared, 'home'),
      config: join(shared, 'config'),
      cache: join(shared, 'cache'),
      data: join(chat, 'data'),
      state: join(chat, 'state'),
      work: join(chat, 'work'),
    }
    for (const folder of Object.values(folders)) await mkdir(folder, { recursive: true })
    return folders
  }

  async execute(
    request: AgentRequest,
    settings: ProviderRunSettings,
    run: RequestRun,
  ): Promise<RuntimeOutcome> {
    if (!this.executable) return { status: 'failed', errorCode: 'RUNTIME_UNAVAILABLE' }
    const executable = this.executable
    const folders = await this.folders(request.sessionId)
    const context = `${folders.work}|${toolBoundary}|${run.tools?.context ?? 'no-source-capability'}|${createHash(
      'sha256',
    )
      .update(run.instructions ?? '')
      .digest('hex')}`
    const binding = this.sessions.binding(request.sessionId)
    const earlier = this.sessions.requests(request.sessionId).filter(item => item.requestId !== run.requestId)
    const history = await this.sessions.read(request.sessionId)
    const current = this.sessions.request(run.requestId)
    const before = current ? history.slice(0, current.historyStart) : history.slice(0, -1)
    // Resume guard (ADR-0002): same chat, provider, model and context, and the last request of the chat is the
    // completed turn the native session holds. Otherwise a new native session, seeded with the saved conversation.
    const resumable =
      !!binding &&
      binding.lastRequestId === earlier.at(-1)?.requestId &&
      binding.selection.provider === settings.provider &&
      binding.selection.model === settings.model &&
      binding.context === context
    if (binding && !resumable) {
      this.sessions.unbind(request.sessionId)
      await run.emit({ kind: 'notice', code: 'NEW_RUNTIME_SESSION' })
    }
    const fresh = () => seedPrompt(before, request.input)
    let attempt = await this.attempt(
      executable,
      settings,
      folders,
      run,
      resumable ? request.input : fresh(),
      resumable ? binding!.nativeSessionId : undefined,
    )
    if (resumable && attempt.noWork && attempt.outcome.status === 'failed' && !run.signal.aborted) {
      // The native session could not be resumed (expired or missing). The chat keeps its history; a new session starts.
      this.sessions.unbind(request.sessionId)
      await run.emit({ kind: 'notice', code: 'NEW_RUNTIME_SESSION' })
      attempt = await this.attempt(executable, settings, folders, run, fresh(), undefined)
    }
    const { outcome, nativeSessionId } = attempt
    if (outcome.status !== 'completed' || !nativeSessionId)
      return outcome.status === 'completed' ? { status: 'failed', errorCode: 'RUNTIME_INCOMPLETE' } : outcome
    return {
      status: 'completed',
      commit: () =>
        this.sessions.bind({
          sessionId: request.sessionId,
          nativeSessionId,
          selection: { provider: settings.provider, model: settings.model },
          context,
          lastRequestId: run.requestId,
        }),
    }
  }

  private async attempt(
    executable: string,
    settings: ProviderRunSettings,
    folders: RuntimeFolders,
    run: RequestRun,
    prompt: string,
    resume: string | undefined,
  ): Promise<Attempt> {
    let config: ReturnType<typeof runtimeConfiguration>
    const bridge = run.tools ? await openToolBridge({ tools: run.tools, signal: run.signal }) : undefined
    try {
      config = runtimeConfiguration(
        settings,
        bridge && run.tools ? { url: bridge.url, names: run.tools.schemas.map(tool => tool.name) } : undefined,
        run.instructions,
      )
    } catch (error) {
      await bridge?.close()
      return {
        outcome: {
          status: 'failed',
          errorCode: error instanceof UnsupportedProviderError ? 'PROVIDER_UNSUPPORTED' : 'RUNTIME_FAILED',
        },
        noWork: false,
      }
    }
    const env = isolatedEnvironment(folders, encodeConfiguration(config), settings.key, bridge?.token)
    const local = new AbortController()
    let timedOut = false
    let remaining = this.options.timeoutMs ?? 600_000
    let started = Date.now()
    let timer: ReturnType<typeof setTimeout> | undefined
    const arm = () => {
      started = Date.now()
      timer = setTimeout(() => {
        timedOut = true
        local.abort()
      }, remaining)
    }
    arm()
    let waiting = false
    const unsubscribeWait = run.onApprovalWait?.(value => {
      if (value === waiting) return
      waiting = value
      if (value) {
        clearTimeout(timer)
        remaining = Math.max(1, remaining - (Date.now() - started))
      } else arm()
    })
    const signal = AbortSignal.any([run.signal, local.signal])
    try {
      // The effective configuration is checked before any model work: a native tool or plugin that slipped in stops the run.
      const audit = await runProcess(executable, [...this.launcher, 'debug', 'config', '--pure'], {
        cwd: folders.work,
        env,
        signal,
        collect: true,
        maxOutputBytes: 4 * 1024 * 1024,
      })
      if (signal.aborted)
        return { outcome: { status: 'failed', errorCode: timedOut ? 'REQUEST_TIMEOUT' : 'STOPPED' }, noWork: true }
      if (audit.startFailed) return { outcome: { status: 'failed', errorCode: 'RUNTIME_UNAVAILABLE' }, noWork: true }
      let resolved: unknown
      try {
        resolved = JSON.parse(audit.stdout)
      } catch {
        resolved = undefined
      }
      if (audit.code !== 0 || !safeConfiguration(resolved, config))
        return { outcome: { status: 'failed', errorCode: 'RUNTIME_CONFIG_UNSAFE' }, noWork: true }
      resolved = undefined

      let nativeSessionId: string | undefined
      let steps = 0
      let modelSteps = 0
      let modelActivity: string | undefined
      let finishReason: string | undefined
      let failure: string | undefined
      let protocolError = false
      // FR-079: after a context overflow OpenCode writes a summary in a new assistant message, then goes on.
      // `waiting`: overflow reported, summary not started; `writing`: the summary message is being written.
      let summary: 'none' | 'waiting' | 'writing' = 'none'
      let summaryMessage: string | undefined
      let summaryActivity = ''
      let overflows = 0
      let summaries = 0
      let writes: Promise<void> = Promise.resolve()
      const assistantMessages = new Set<string>()
      const texts = new Map<string, string>()
      const tools = new Map<string, string>()
      const emit = (event: RuntimeEvent) => {
        writes = writes
          .then(() => run.emit(event))
          .catch(() => {
            // The Host refused the write (the request ended or could not be saved): no more work for this run.
            local.abort()
          })
      }
      const ofSummary = (messageId: string | undefined) =>
        summary === 'writing' &&
        (summaryMessage === undefined || messageId === undefined || messageId === summaryMessage)
      const endSummary = (status: 'completed' | 'failed') => {
        emit({ kind: 'activity', id: summaryActivity, label: 'Conversation summary', type: 'model', status })
        summary = 'none'
        summaryMessage = undefined
      }
      const args = [
        'run',
        '--pure',
        '--agent',
        'deckagent',
        '--format',
        'json',
        '--model',
        selector,
        '--title',
        'DeckAgent chat',
        ...(resume ? ['--session', resume] : []),
      ]
      const result = await runProcess(executable, [...this.launcher, ...args], {
        cwd: folders.work,
        env,
        signal,
        input: run.tools
          ? `Current Host source manifest (data, not permissions):\n${run.tools.manifest}\n\n${prompt}`
          : prompt,
        onLine: value => {
          if (signal.aborted) return
          const event = parseEvent(value)
          if (!event) {
            protocolError = true
            local.abort()
            return
          }
          if (event.sessionId && !nativeSessionId) nativeSessionId = event.sessionId
          if (event.sessionId && event.sessionId !== nativeSessionId) {
            protocolError = true
            local.abort()
            return
          }
          if (event.type === 'step_start') {
            steps++
            if (event.messageId) assistantMessages.add(event.messageId)
            if (summary === 'waiting') {
              summary = 'writing'
              summaryMessage = event.messageId
              return
            }
            if (ofSummary(event.messageId)) return
            modelSteps++
            modelActivity = `model-${modelSteps}`
            emit({ kind: 'activity', id: modelActivity, label: 'Model response', type: 'model', status: 'running' })
          } else if (event.type === 'step_finish') {
            if (ofSummary(event.messageId)) {
              if (event.reason === 'error' || event.reason === 'content-filter') {
                failure ??= 'CONTEXT_SUMMARY_FAILED'
                endSummary('failed')
                return
              }
              summaries++
              endSummary('completed')
              // Said once per request: the model now reads a summary in place of the conversation before it.
              if (summaries === 1) emit({ kind: 'notice', code: summarizedNotice })
              return
            }
            finishReason = event.reason
            if (modelActivity)
              emit({ kind: 'activity', id: modelActivity, label: 'Model response', type: 'model', status: 'completed' })
            modelActivity = undefined
          } else if (event.type === 'text') {
            // The summary is what the model reads, not the reply; the user keeps the whole conversation (FR-079).
            if (ofSummary(event.messageId)) return
            // A text part of a user message (such as OpenCode's own "continue" note after a summary) is not the reply.
            if (event.messageId && !assistantMessages.has(event.messageId)) return
            // Repeated frames of a part replace it; identical frames are not saved twice.
            if (texts.get(event.partId) === event.text) return
            texts.set(event.partId, event.text)
            emit({ kind: 'text', part: event.partId, text: event.text })
          } else if (event.type === 'tool') {
            // Native tools are denied in this build: a denied call is a failed activity, not a failed request (FR-070).
            if (tools.get(event.callId) === event.status) return
            tools.set(event.callId, event.status)
            // Host tools publish their own activities at the authorization boundary; ignore duplicate CLI records.
            if (!event.tool.startsWith('deckagent_'))
              emit({
                kind: 'activity',
                id: `tool-${event.callId}`,
                label: event.tool,
                type: 'tool',
                status: event.status,
              })
          } else if (event.type === 'error') {
            if (isContextOverflow(event) && summary === 'none') {
              // The call was refused as too long; OpenCode summarizes and answers again.
              overflows++
              finishReason = undefined
              if (modelActivity)
                emit({ kind: 'activity', id: modelActivity, label: 'Model response', type: 'model', status: 'failed' })
              modelActivity = undefined
              summary = 'waiting'
              summaryActivity = `summary-${overflows}`
              emit({
                kind: 'activity',
                id: summaryActivity,
                label: 'Conversation summary',
                type: 'model',
                status: 'running',
              })
              return
            }
            // An error while summarizing: the summary could not be written and the request does not finish.
            if (summary !== 'none') {
              failure ??= isContextOverflow(event) ? 'CONTEXT_SUMMARY_FAILED' : errorCode(event)
              endSummary('failed')
              return
            }
            failure ??= errorCode(event)
          }
        },
      })
      // A summary not written ends the request even when the CLI said nothing more (FR-079, as UC-003 A11).
      if (summary !== 'none' && !failure && !run.signal.aborted && !timedOut) {
        failure = 'CONTEXT_SUMMARY_FAILED'
        endSummary('failed')
      }
      await writes
      // Work was done when a step ran or the native session already took part in a summary: never retried elsewhere.
      const noWork = steps === 0 && overflows === 0
      if (run.signal.aborted) return { outcome: { status: 'failed', errorCode: 'STOPPED' }, noWork }
      if (timedOut) return { outcome: { status: 'failed', errorCode: 'REQUEST_TIMEOUT' }, noWork }
      if (result.startFailed) return { outcome: { status: 'failed', errorCode: 'RUNTIME_UNAVAILABLE' }, noWork: true }
      if (protocolError || result.malformed)
        return { outcome: { status: 'failed', errorCode: 'RUNTIME_PROTOCOL' }, noWork }
      if (local.signal.aborted) return { outcome: { status: 'failed', errorCode: 'REQUEST_NOT_SAVED' }, noWork }
      if (failure) return { outcome: { status: 'failed', errorCode: failure }, noWork }
      // OpenCode 1.19.5 exits 1 after any reported error, including an overflow it then summarized and recovered from.
      if (result.code !== 0 && !(result.code === 1 && summaries > 0))
        return { outcome: { status: 'failed', errorCode: 'RUNTIME_FAILED' }, noWork }
      // Exit 0 alone is not completion: the last step must have finished with a final answer, in a known native session.
      if (!steps || !finishReason || finishReason === 'tool-calls' || !nativeSessionId)
        return { outcome: { status: 'failed', errorCode: 'RUNTIME_INCOMPLETE' }, noWork }
      return { outcome: { status: 'completed' }, nativeSessionId, noWork: false }
    } finally {
      clearTimeout(timer)
      unsubscribeWait?.()
      bridge?.revoke()
      await bridge?.close()
    }
  }
}
