import { createHash } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  AgentRuntime,
  RunError,
  RunInput,
  RunResult,
  RunSink,
  RunUsage,
  RuntimeAvailability,
} from '../../runs/ports.ts'
import { runOwnerKey } from '../../runs/ports.ts'
import {
  encodeConfiguration,
  isolatedEnvironment,
  pinnedVersion,
  runtimeConfiguration,
  safeConfiguration,
  toolBoundary,
  type RuntimeFolders,
} from './config.ts'
import { seedConversationPrompt } from './history.ts'
import { openToolBridge } from './mcp-bridge.ts'
import { runProcess } from './process.ts'
import { UnsupportedProviderError, selector } from './provider.ts'
import { createAttemptTimer, createStreamTracker, type ClassifiedAttempt } from './stream-tracker.ts'

export interface OwnerRuntimeBinding {
  readonly ownerKey: string
  readonly nativeSessionId: string
  readonly selection: { readonly provider: string; readonly model: string }
  readonly context: string
  readonly lastRequestId: string
}

export interface OwnerBindingStore {
  binding(ownerKey: string): OwnerRuntimeBinding | undefined
  bind(binding: OwnerRuntimeBinding): void
  unbind(ownerKey: string): void
  lastCompletedRequestId(ownerKey: string, currentRequestId: string): string | undefined
}

export interface OpenCodeAgentRuntimeOptions {
  readonly version?: string
  readonly timeoutMs?: number
  readonly launcherArgs?: readonly string[]
}

const runtimeUnavailable: RunError = { category: 'runtime-unavailable', code: 'RUNTIME_UNAVAILABLE' }
const runtimeIncomplete: RunError = { category: 'runtime-incomplete', code: 'RUNTIME_INCOMPLETE' }
const providerUnsupported: RunError = { category: 'runtime-config', code: 'PROVIDER_UNSUPPORTED' }
const configurationUnsafe: RunError = { category: 'runtime-config', code: 'RUNTIME_CONFIG_UNSAFE' }
const runtimeFailed: RunError = { category: 'runtime-failed', code: 'RUNTIME_FAILED' }
const timeout: RunError = { category: 'timeout', code: 'REQUEST_TIMEOUT' }
const stopped: RunError = { category: 'stopped', code: 'STOPPED' }
const noUsage: RunUsage = { modelCalls: 0 }

function failed(error: RunError, usage: RunUsage = noUsage, noWork = true): ClassifiedAttempt {
  return {
    outcome: { status: 'failed', errorCode: error.code },
    runResult: { status: 'failed', usage, error },
    noWork,
  }
}

export class OpenCodeAgentRuntime implements AgentRuntime {
  readonly name = 'opencode'
  private versionCheck: Promise<boolean> | undefined
  private get launcher(): readonly string[] {
    return this.options.launcherArgs ?? []
  }

  constructor(
    private readonly executable: string | undefined,
    private readonly runtimeRoot: string,
    private readonly bindings: OwnerBindingStore,
    private readonly options: OpenCodeAgentRuntimeOptions = {},
  ) {}

  async availability(): Promise<RuntimeAvailability> {
    if (!this.executable) return { available: false, code: 'RUNTIME_UNAVAILABLE' }
    if (!(await this.checkVersion(this.executable)))
      return {
        available: false,
        code: 'RUNTIME_VERSION_UNSUPPORTED',
        detail: { version: this.options.version ?? pinnedVersion },
      }
    return { available: true }
  }

  async run(input: RunInput, sink: RunSink): Promise<RunResult> {
    const executable = this.executable
    if (!executable) return failed(runtimeUnavailable).runResult
    const ownerKey = runOwnerKey(input.owner)
    const folders = await this.folders(ownerKey)
    const instructions = input.instructions.join('\n\n')
    const context = `${folders.work}|${toolBoundary}|${input.tools?.context ?? 'no-source-capability'}|${createHash('sha256').update(instructions).digest('hex')}`
    const binding = this.bindings.binding(ownerKey)
    const resumable =
      !!binding &&
      binding.lastRequestId === this.bindings.lastCompletedRequestId(ownerKey, input.requestId) &&
      binding.selection.provider === input.provider.provider &&
      binding.selection.model === input.provider.model &&
      binding.context === context
    if (binding && !resumable) {
      this.bindings.unbind(ownerKey)
      await sink.emit({ kind: 'notice', code: 'NEW_RUNTIME_SESSION' })
    }
    const conversation = input.resources.find(resource => resource.kind === 'conversation')?.messages ?? []
    const request = conversation.at(-1)?.content ?? ''
    const fresh = () => seedConversationPrompt(conversation.slice(0, -1), request)
    const resumeSessionId = resumable && binding ? binding.nativeSessionId : undefined
    let attempt = await this.attempt(
      executable,
      input,
      sink,
      folders,
      resumeSessionId ? request : fresh(),
      resumeSessionId,
    )
    if (resumable && attempt.noWork && attempt.runResult.status === 'failed' && !input.signal.aborted) {
      this.bindings.unbind(ownerKey)
      await sink.emit({ kind: 'notice', code: 'NEW_RUNTIME_SESSION' })
      attempt = await this.attempt(executable, input, sink, folders, fresh(), undefined)
    }
    if (attempt.runResult.status !== 'completed') return attempt.runResult
    const nativeSessionId = attempt.nativeSessionId
    if (!nativeSessionId) return failed(runtimeIncomplete, attempt.runResult.usage).runResult
    return {
      status: 'completed',
      usage: attempt.runResult.usage,
      commit: () =>
        this.bindings.bind({
          ownerKey,
          nativeSessionId,
          selection: { provider: input.provider.provider, model: input.provider.model },
          context,
          lastRequestId: input.requestId,
        }),
    }
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
    void this.versionCheck.then(ok => {
      if (!ok) this.versionCheck = undefined
    })
    return this.versionCheck
  }

  private async folders(ownerKey: string): Promise<RuntimeFolders> {
    const shared = join(this.runtimeRoot, 'shared')
    const owner = join(this.runtimeRoot, 'chats', createHash('sha256').update(ownerKey).digest('hex').slice(0, 32))
    const folders = {
      home: join(shared, 'home'),
      config: join(shared, 'config'),
      cache: join(shared, 'cache'),
      data: join(owner, 'data'),
      state: join(owner, 'state'),
      work: join(owner, 'work'),
    }
    for (const folder of Object.values(folders)) await mkdir(folder, { recursive: true })
    return folders
  }

  private async attempt(
    executable: string,
    input: RunInput,
    sink: RunSink,
    folders: RuntimeFolders,
    prompt: string,
    resume: string | undefined,
  ): Promise<ClassifiedAttempt> {
    const bridge = input.tools ? await openToolBridge({ tools: input.tools, signal: input.signal }) : undefined
    let config: ReturnType<typeof runtimeConfiguration>
    try {
      config = runtimeConfiguration(
        input.provider,
        bridge && input.tools ? { url: bridge.url, names: input.tools.schemas.map(tool => tool.name) } : undefined,
        input.instructions.join('\n\n'),
        input.stepLimit,
      )
    } catch (error) {
      await bridge?.close()
      return failed(error instanceof UnsupportedProviderError ? providerUnsupported : runtimeFailed, noUsage, false)
    }
    const env = isolatedEnvironment(folders, encodeConfiguration(config), input.provider.key, bridge?.token)
    const timer = createAttemptTimer(this.options.timeoutMs ?? 600_000, input)
    const tracker = createStreamTracker(
      sink,
      () => timer.local.abort(),
      usage => sink.usage(usage),
    )
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
        input: input.tools
          ? `Current Host source manifest (data, not permissions):\n${input.tools.manifest}\n\n${prompt}`
          : prompt,
        onLine: value => {
          if (!timer.signal.aborted) tracker.onLine(value)
        },
      })
      await tracker.finalize(input.signal.aborted, timer.timedOut())
      return tracker.classify(result, input.signal.aborted, timer.timedOut(), timer.local.signal.aborted)
    } finally {
      timer.cleanup()
      bridge?.revoke()
      await bridge?.close()
    }
  }

  private async auditConfiguration(
    executable: string,
    folders: RuntimeFolders,
    env: NodeJS.ProcessEnv,
    signal: AbortSignal,
    config: ReturnType<typeof runtimeConfiguration>,
    expired: () => boolean,
  ): Promise<ClassifiedAttempt | undefined> {
    const audit = await runProcess(executable, [...this.launcher, 'debug', 'config', '--pure'], {
      cwd: folders.work,
      env,
      signal,
      collect: true,
      maxOutputBytes: 4 * 1024 * 1024,
    })
    if (signal.aborted) return failed(expired() ? timeout : stopped)
    if (audit.startFailed) return failed(runtimeUnavailable)
    let resolved: unknown
    try {
      resolved = JSON.parse(audit.stdout)
    } catch {
      resolved = undefined
    }
    if (audit.code !== 0 || !safeConfiguration(resolved, config)) return failed(configurationUnsafe)
    return undefined
  }
}
