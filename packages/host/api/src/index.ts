import type { ServerResponse } from 'node:http'
import { Router } from 'express'
import type { ContractSyncVerified } from './contract-sync.ts'
import { RequestController } from './lifecycle/request-controller.ts'
import type { HostOptions, HostRouteContext, HostRouteRegistrar } from './transport/contracts.ts'
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
  HostMessage,
  HostOptions,
  HttpFailureResponse,
  HostRouteContext,
  HostRouteRegistrar,
} from './transport/contracts.ts'
export { HttpError } from './transport/http-error.ts'
export { json, readJson } from './transport/http-io.ts'
export { receiveAttachment } from './transport/multipart.ts'
export type { AttachmentUploadTarget } from './transport/multipart.ts'
export { param, params, route } from './transport/route-params.ts'
export { openSseStream } from './transport/sse.ts'
export type { HttpErrorDetail } from './transport/http-error.ts'

function isRouter(entry: HostRouteRegistrar): entry is Router {
  return 'handle' in entry && typeof entry.handle === 'function'
}

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
  const router = Router({ caseSensitive: true, strict: true })
  registerSessionRoutes(router, options)
  const context: HostRouteContext = {
    streams,
    ...(controller ? { submit: (request, settings) => controller.submit(request, settings) } : {}),
  }
  for (const entry of options.routes ?? []) router.use(isRouter(entry) ? entry : entry(context))
  registerRequestRoutes(router, controller, options.maxAttachments ?? 0, streams)
  return {
    router,
    streams,
    close: async () => {
      await controller?.close()
    },
  }
}
