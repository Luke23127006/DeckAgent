import type { AgentRequest, RequestRun, RuntimeOutcome } from '@deckagent/host-api'
import type { Message, RequestRecord, RuntimeBinding } from '@deckagent/session-persistence'
import type { ProviderRunSettings } from '../../features/providers/index.ts'

export type OpenCodeErrorCode = 'RUNTIME_UNAVAILABLE' | 'RUNTIME_VERSION_UNSUPPORTED'

export type OpenCodeErrorDetail = Readonly<Record<string, string | boolean>>

export class OpenCodeError extends Error {
  constructor(
    readonly code: OpenCodeErrorCode,
    readonly detail?: OpenCodeErrorDetail,
  ) {
    super(code)
    this.name = 'OpenCodeError'
  }
}

export interface RuntimeSessionAccess {
  read(sessionId: string): Promise<readonly Message[]>
  requests(sessionId: string): readonly RequestRecord[]
  request(requestId: string): RequestRecord | undefined
  binding(sessionId: string): RuntimeBinding | undefined
  bind(binding: RuntimeBinding): void
  unbind(sessionId: string): void
}

export interface OpenCodeExecutor {
  execute(request: AgentRequest, settings: ProviderRunSettings, run: RequestRun): Promise<RuntimeOutcome>
  ensureAvailable(): Promise<void>
}
