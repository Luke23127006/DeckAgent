import type { PreparedRequest, RequestRuntime } from '@deckagent/host-api'
import type { AgentRequest } from '@deckagent/host-contracts'
import { SessionError } from '@deckagent/session-persistence'
import type { SqliteSessionStore } from '@deckagent/session-persistence'
import type { ProviderConfigurations } from '../../modules/providers/index.ts'
import { OpenCodeError } from '../../runtimes/opencode/index.ts'
import type { OpenCodeExecutor } from '../../runtimes/opencode/index.ts'

export type RequestPreparationFailureCode =
  | 'SESSION_NOT_FOUND'
  | 'CHAT_UNREADABLE'
  | 'SESSION_UNAVAILABLE'
  | 'NO_SELECTABLE_MODEL'
  | 'RUNTIME_UNAVAILABLE'
  | 'RUNTIME_VERSION_UNSUPPORTED'

export type RequestPreparationFailureDetail = Readonly<Record<string, string | boolean>>

export class RequestPreparationFailure extends Error {
  constructor(
    readonly code: RequestPreparationFailureCode,
    readonly detail?: RequestPreparationFailureDetail,
  ) {
    super(code)
    this.name = 'RequestPreparationFailure'
  }
}

export interface RuntimePreparationDependencies {
  readonly sessions: SqliteSessionStore
  readonly providers: Pick<ProviderConfigurations, 'providerSettings' | 'selectable' | 'runSettings'>
  readonly runtime: OpenCodeExecutor
}

export function createRequestRuntime(dependencies: RuntimePreparationDependencies): RequestRuntime {
  const { sessions, providers, runtime } = dependencies
  return {
    async prepare(request: AgentRequest): Promise<PreparedRequest> {
      const info = await sessions.getInfo(request.sessionId).catch(() => undefined)
      if (!info) throw new RequestPreparationFailure('SESSION_NOT_FOUND')
      try {
        await sessions.read(request.sessionId)
      } catch (error) {
        if (error instanceof SessionError && error.code === 'SESSION_CORRUPT')
          throw new RequestPreparationFailure('CHAT_UNREADABLE')
        throw new RequestPreparationFailure('SESSION_UNAVAILABLE')
      }
      // FR-046: no selectable model, no request. The reason is said; no model is chosen for the chat.
      const configured = providers.providerSettings()
      if (!info.selection || !providers.selectable(info.selection)) {
        const reason = !configured.length
          ? 'no-provider'
          : !configured.some(provider => provider.models.length)
            ? 'no-model'
            : info.selection
              ? 'model-removed'
              : info.removedSelection
                ? 'model-removed'
                : 'no-selection'
        throw new RequestPreparationFailure('NO_SELECTABLE_MODEL', { reason })
      }
      const settings = providers.runSettings(info.selection)
      try {
        await runtime.ensureAvailable()
      } catch (error) {
        if (error instanceof OpenCodeError) throw new RequestPreparationFailure(error.code, error.detail)
        throw error
      }
      return {
        selection: { provider: settings.provider, model: settings.model },
        start: run => runtime.execute(request, settings, run),
      }
    },
  }
}
