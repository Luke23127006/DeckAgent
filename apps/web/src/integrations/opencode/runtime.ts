import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { access, mkdir, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { delimiter, isAbsolute, join } from 'node:path'
import type { RequestRun, RuntimeOutcome } from '@deckagent/host-api'
import type { AgentRequest } from '@deckagent/host-contracts'
import type { ProviderRunSettings } from '../providers/index.ts'
import { OpenCodeError } from './contracts.ts'
import type { OpenCodeExecutor, RuntimeSessionAccess } from './contracts.ts'
import {
  encodeConfiguration,
  isolatedEnvironment,
  pinnedVersion,
  runtimeConfiguration,
  safeConfiguration,
  toolBoundary,
  type RuntimeFolders,
} from './config.ts'
import { openToolBridge } from './mcp-bridge.ts'
import { seedPrompt } from './history.ts'
import { runProcess } from './process.ts'
import { UnsupportedProviderError, selector } from './provider.ts'
import { resourceExecutable } from './resources.ts'
import { createAttemptTimer, createStreamTracker, type AttemptResult } from './stream-tracker.ts'

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

  async execute(request: AgentRequest, settings: ProviderRunSettings, run: RequestRun): Promise<RuntimeOutcome> {
    if (!this.executable) return { status: 'failed', errorCode: 'RUNTIME_UNAVAILABLE' }
    const executable = this.executable
    const folders = await this.folders(request.sessionId)
    const seed = createHash('sha256').update(run.instructions ?? '')
    const instructions = seed.digest('hex')
    const context = `${folders.work}|${toolBoundary}|${run.tools?.context ?? 'no-source-capability'}|${instructions}`
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
    const resumeSessionId = resumable && binding ? binding.nativeSessionId : undefined
    const prompt = resumable ? request.input : fresh()
    let attempt = await this.attempt(executable, settings, folders, run, prompt, resumeSessionId)
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
  ): Promise<AttemptResult> {
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
      const failure = error instanceof UnsupportedProviderError ? 'PROVIDER_UNSUPPORTED' : 'RUNTIME_FAILED'
      return { outcome: { status: 'failed', errorCode: failure }, noWork: false }
    }
    const env = isolatedEnvironment(folders, encodeConfiguration(config), settings.key, bridge?.token)
    const timer = createAttemptTimer(this.options.timeoutMs ?? 600_000, run)
    const tracker = createStreamTracker(run, () => timer.local.abort())
    try {
      const audit = await this.auditConfiguration(executable, folders, env, timer.signal, config, timer.timedOut)
      if (audit) return audit
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
        signal: timer.signal,
        input: run.tools
          ? `Current Host source manifest (data, not permissions):\n${run.tools.manifest}\n\n${prompt}`
          : prompt,
        onLine: value => {
          if (!timer.signal.aborted) tracker.onLine(value)
        },
      })
      await tracker.finalize(run.signal.aborted, timer.timedOut())
      return tracker.classify(result, run.signal.aborted, timer.timedOut(), timer.local.signal.aborted)
    } finally {
      timer.cleanup()
      bridge?.revoke()
      await bridge?.close()
    }
  }

  /** The effective configuration is checked before any model work: a native tool or plugin that slipped in stops the run. */
  private async auditConfiguration(
    executable: string,
    folders: RuntimeFolders,
    env: NodeJS.ProcessEnv,
    signal: AbortSignal,
    config: ReturnType<typeof runtimeConfiguration>,
    timedOut: () => boolean,
  ): Promise<AttemptResult | undefined> {
    const audit = await runProcess(executable, [...this.launcher, 'debug', 'config', '--pure'], {
      cwd: folders.work,
      env,
      signal,
      collect: true,
      maxOutputBytes: 4 * 1024 * 1024,
    })
    if (signal.aborted)
      return { outcome: { status: 'failed', errorCode: timedOut() ? 'REQUEST_TIMEOUT' : 'STOPPED' }, noWork: true }
    if (audit.startFailed) return { outcome: { status: 'failed', errorCode: 'RUNTIME_UNAVAILABLE' }, noWork: true }
    let resolved: unknown
    try {
      resolved = JSON.parse(audit.stdout)
    } catch {
      resolved = undefined
    }
    if (audit.code !== 0 || !safeConfiguration(resolved, config))
      return { outcome: { status: 'failed', errorCode: 'RUNTIME_CONFIG_UNSAFE' }, noWork: true }
    return undefined
  }
}
