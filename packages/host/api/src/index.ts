import type { ServerResponse } from 'node:http'
import type { WebSession } from '@deckagent/host-contracts'
import { Router } from 'express'
import type { ContractSyncVerified } from './contract-sync.ts'
import { RequestController } from './lifecycle/request-controller.ts'
import type { HostOptions } from './transport/contracts.ts'
import { registerManagementRoutes } from './transport/management-routes.ts'
import { registerRequestRoutes } from './transport/request-routes.ts'
import { registerSessionRoutes } from './transport/session-routes.ts'

export { RequestFailure } from './lifecycle/request-failure.ts'
export type {
  PreparedRequest,
  RequestAdmission,
  RequestRun,
  RequestRuntime,
  RuntimeEvent,
  RuntimeOutcome,
} from './lifecycle/contracts.ts'
export type { PreparedTools, RequestTools, ToolContext, ToolResult, ToolSchema } from './lifecycle/tool-contracts.ts'
export type {
  AttachmentManagement,
  BriefManagement,
  HostMessage,
  HostOptions,
  HttpFailureResponse,
  WebManagement,
} from './transport/contracts.ts'
export { HttpError } from './transport/http-error.ts'
export { json, readJson } from './transport/http-io.ts'
export { param, params, route } from './transport/route-params.ts'
export { openSseStream } from './transport/sse.ts'
export type { HttpErrorDetail } from './transport/http-error.ts'

const contractSync: ContractSyncVerified = true

export interface HostRoutes {
  readonly router: Router
  readonly streams: Set<ServerResponse>
  close(): Promise<void>
}

/** Routes of the Local Host API in their match order. Disconnect never cancels a request. */
export function createHostRoutes(options: HostOptions): HostRoutes {
  if (!contractSync) throw new Error('Contract sync failed')
  const controller = options.requests
    ? new RequestController(
        options.requests.store,
        options.requests.runtime,
        options.requests.prepareTools,
        options.requests.closingText,
      )
    : undefined
  const streams = new Set<ServerResponse>()
  const withActive = async (sessions: readonly WebSession[]): Promise<readonly WebSession[]> =>
    sessions.map(session => {
      const activeRequestId = controller?.active(session.sessionId)
      return { ...session, ...(activeRequestId ? { activeRequestId } : {}) }
    })
  const router = Router({ caseSensitive: true, strict: true })
  registerSessionRoutes(router, options, controller, streams)
  if (options.management) registerManagementRoutes(router, options.management, withActive)
  for (const routes of options.routes ?? []) router.use(routes)
  registerRequestRoutes(router, controller, options.attachments?.maxFiles ?? 0, streams)
  return {
    router,
    streams,
    close: async () => {
      await controller?.close()
    },
  }
}
