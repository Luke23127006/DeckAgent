import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebSession } from '@deckagent/host-contracts'
import type { ContractSyncVerified } from './contract-sync.ts'
import { RequestController } from './lifecycle/request-controller.ts'
import type { HostOptions } from './transport/contracts.ts'
import { writeRouteError } from './transport/error-response.ts'
import { HttpError } from './transport/http-error.ts'
import { routeManagement } from './transport/management-routes.ts'
import { routeRequests } from './transport/request-routes.ts'
import { routeSession } from './transport/session-routes.ts'

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
  WorkspaceManagement,
} from './transport/contracts.ts'
export { HttpError } from './transport/http-error.ts'
export type { HttpErrorDetail } from './transport/http-error.ts'

const contractSync: ContractSyncVerified = true

function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-content-type-options', 'nosniff')
  res.setHeader('referrer-policy', 'no-referrer')
  res.setHeader(
    'content-security-policy',
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src blob: data:; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  )
}

function checkOrigin(req: IncomingMessage, origin: string): void {
  if (
    req.headers.host !== new URL(origin).host ||
    (req.headers.origin !== undefined && req.headers.origin !== origin) ||
    req.headers['sec-fetch-site'] === 'cross-site'
  )
    throw new HttpError(403, 'ORIGIN_DENIED')
}

function serveAsset(req: IncomingMessage, res: ServerResponse, pathname: string, options: HostOptions): void {
  const asset = options.assets && Object.hasOwn(options.assets, pathname) ? options.assets[pathname] : undefined
  if (req.method !== 'GET' || !asset) throw new HttpError(404, 'NOT_FOUND')
  if (asset.sandboxed)
    res.setHeader(
      'content-security-policy',
      "sandbox; default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
    )
  res.writeHead(200, { 'content-type': asset.contentType })
  res.end(asset.body)
}

/** Loopback-only, authenticated HTTP/SSE boundary. Disconnect never cancels a request. */
export async function startHost(options: HostOptions) {
  if (!contractSync) throw new Error('Contract sync failed')
  const token = randomBytes(32).toString('hex')
  const expected = Buffer.from(`Bearer ${token}`)
  const controller = options.requests
    ? new RequestController(
        options.requests.store,
        options.requests.runtime,
        options.requests.prepareTools,
        options.requests.closingText,
      )
    : undefined
  const streams = new Set<ServerResponse>()
  let origin = ''
  let closing: Promise<void> | undefined
  const server = createServer((req, res) => {
    setSecurityHeaders(res)
    route(req, res).catch(error => writeRouteError(res, error, options))
  })
  server.requestTimeout = 10000
  server.headersTimeout = 10000
  server.on('clientError', (_error, socket) => socket.destroy())

  const withActive = async (sessions: readonly WebSession[]): Promise<readonly WebSession[]> =>
    sessions.map(session => {
      const activeRequestId = controller?.active(session.sessionId)
      return { ...session, ...(activeRequestId ? { activeRequestId } : {}) }
    })

  async function route(req: IncomingMessage, res: ServerResponse) {
    if (closing) throw new HttpError(503, 'HOST_CLOSED')
    checkOrigin(req, origin)
    const url = new URL(req.url ?? '/', origin)
    if (url.search) throw new HttpError(400, 'INVALID_REQUEST')
    if (!url.pathname.startsWith('/api/')) {
      serveAsset(req, res, url.pathname, options)
      return
    }
    const auth = Buffer.from(req.headers.authorization ?? '')
    if (auth.length !== expected.length || !timingSafeEqual(auth, expected)) throw new HttpError(401, 'AUTH_REQUIRED')
    if (await routeSession(req, res, url.pathname, options, controller, streams)) return
    if (options.management && (await routeManagement(req, res, url.pathname, options.management, withActive))) return
    if (await routeRequests(req, res, url.pathname, controller, options.attachments?.maxFiles ?? 0, streams)) return
    throw new HttpError(404, 'NOT_FOUND')
  }

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(options.port ?? 0, '127.0.0.1', () => {
        server.off('error', reject)
        resolve()
      })
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Host failed to listen')
    origin = `http://127.0.0.1:${address.port}`
  } catch (error) {
    server.close()
    throw error
  }

  return {
    origin,
    token,
    close(): Promise<void> {
      closing ??= (async () => {
        const stopped = new Promise<void>((resolve, reject) =>
          server.close(error => (error ? reject(error) : resolve())),
        )
        for (const stream of streams) stream.end()
        server.closeAllConnections()
        await Promise.all([stopped, controller?.close()])
      })()
      return closing
    },
  }
}
