import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { DeckError } from '@deckagent/deck'
import { routeDeck } from './deck-routes.ts'
import type { AgentRequest, HostOptions, RequestEvent, WebSession } from './contracts.ts'
import { HttpError, RequestController } from './request-controller.ts'

export type { AttachmentView } from './contracts.ts'
export type {
  ApprovalStep,
  ApprovalView,
  PreparedTools,
  RequestTools,
  ToolContext,
  ToolResult,
  ToolSchema,
} from './contracts.ts'
export type {
  ActivityStatus,
  AgentRequest,
  HistoryMessage,
  HostMessage,
  HostOptions,
  ModelSelection,
  PreparedRequest,
  ProviderProtocol,
  ProviderSettings,
  ProviderTemplate,
  RequestEvent,
  RequestEventBody,
  RequestRun,
  RequestRuntime,
  RequestSnapshot,
  RequestStatus,
  RequestStore,
  RuntimeEvent,
  RuntimeOutcome,
  StoredActivity,
  StoredRequest,
  TerminalStatus,
  WebManagement,
  WebPreferences,
  WebSession,
  WebSettings,
} from './contracts.ts'
export type {
  ChatDraft,
  WorkspaceFolderStatus,
  WorkspaceList,
  WorkspaceManagement,
  WorkspaceView,
} from './contracts.ts'
export type { HttpErrorDetail } from './http-error.ts'
export { HttpError, RequestController } from './request-controller.ts'

const idPattern = /^[A-Za-z0-9_-]{1,100}$/
/** Transport limit of one request text; BR-002 sets the product maximum when it is decided. */
export const requestTextLimit = 16000
const activeStatuses = new Set(['active', 'waiting_approval'])

function json(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(value))
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new HttpError(415, 'JSON_REQUIRED')
  let bytes = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    bytes += chunk.length
    if (bytes > 20 * 1024) throw new HttpError(413, 'REQUEST_TOO_LARGE')
    chunks.push(chunk)
  }
  let value: unknown
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'INVALID_REQUEST')
  }
  return value
}

/** A generic chat request. Generation entries (presentation, outline actions) are not accepted in this build. */
async function body(req: IncomingMessage): Promise<AgentRequest> {
  const value = await readJson(req)
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !('sessionId' in value) ||
    typeof value.sessionId !== 'string' ||
    !idPattern.test(value.sessionId) ||
    !('input' in value) ||
    typeof value.input !== 'string' ||
    !value.input.trim() ||
    Object.keys(value).some(key => !['sessionId', 'input'].includes(key))
  )
    throw new HttpError(400, 'INVALID_REQUEST')
  if (value.input.length > requestTextLimit) throw new HttpError(413, 'REQUEST_TEXT_TOO_LONG')
  return { sessionId: value.sessionId, input: value.input }
}

/** Last-Event-ID is the reconnect cursor: the stream resumes after it with no gap and no repeat. */
function cursor(req: IncomingMessage): number {
  const raw = req.headers['last-event-id']
  if (raw === undefined) return 0
  if (typeof raw !== 'string' || !/^\d{1,15}$/.test(raw)) throw new HttpError(400, 'INVALID_REQUEST')
  return Number(raw)
}

/** Loopback-only, authenticated HTTP/SSE boundary. Disconnect never cancels a request. */
export async function startHost(options: HostOptions) {
  const token = randomBytes(32).toString('hex')
  const expected = Buffer.from(`Bearer ${token}`)
  const controller = options.requests
    ? new RequestController(options.requests.store, options.requests.runtime, options.requests.prepareTools)
    : undefined
  const streams = new Set<ServerResponse>()
  let origin = ''
  let closing: Promise<void> | undefined
  const server = createServer((req, res) => {
    res.setHeader('cache-control', 'no-store')
    res.setHeader('x-content-type-options', 'nosniff')
    res.setHeader('referrer-policy', 'no-referrer')
    res.setHeader(
      'content-security-policy',
      "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    )
    route(req, res).catch(error => {
      if (res.headersSent) {
        res.destroy()
        return
      }
      const known = error instanceof HttpError
      const deck = error instanceof DeckError
      const outline =
        deck &&
        ['OUTLINE_STALE', 'OUTLINE_ALREADY_CONFIRMED', 'OUTLINE_READ_ONLY', 'OUTLINE_LIMIT'].includes(error.code)
      json(res, known ? error.status : outline ? 409 : deck && error.code === 'DECK_CONTENT_NOT_FOUND' ? 404 : 500, {
        error: {
          code: known
            ? error.code
            : outline || (deck && error.code === 'DECK_CONTENT_NOT_FOUND')
              ? error.code
              : 'HOST_ERROR',
          message: 'Request could not be completed',
          ...(known && error.detail ? { detail: error.detail } : {}),
        },
      })
    })
  })
  server.requestTimeout = 10000
  server.headersTimeout = 10000
  server.on('clientError', (_error, socket) => {
    socket.destroy()
  })

  async function withActive(sessions: readonly WebSession[]): Promise<readonly WebSession[]> {
    return sessions.map(session => {
      const activeRequestId = controller?.active(session.sessionId)
      return { ...session, ...(activeRequestId ? { activeRequestId } : {}) }
    })
  }

  async function route(req: IncomingMessage, res: ServerResponse) {
    if (closing) throw new HttpError(503, 'HOST_CLOSED')
    if (
      req.headers.host !== new URL(origin).host ||
      (req.headers.origin !== undefined && req.headers.origin !== origin) ||
      req.headers['sec-fetch-site'] === 'cross-site'
    )
      throw new HttpError(403, 'ORIGIN_DENIED')
    const url = new URL(req.url ?? '/', origin)
    if (url.search) throw new HttpError(400, 'INVALID_REQUEST')
    if (!url.pathname.startsWith('/api/')) {
      const asset =
        options.assets && Object.hasOwn(options.assets, url.pathname) ? options.assets[url.pathname] : undefined
      if (req.method !== 'GET' || !asset) throw new HttpError(404, 'NOT_FOUND')
      if (asset.sandboxed)
        res.setHeader(
          'content-security-policy',
          "sandbox; default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
        )
      res.writeHead(200, { 'content-type': asset.contentType })
      res.end(asset.body)
      return
    }
    const auth = Buffer.from(req.headers.authorization ?? '')
    if (auth.length !== expected.length || !timingSafeEqual(auth, expected)) throw new HttpError(401, 'AUTH_REQUIRED')
    if (options.decks && req.method === 'GET' && routeDeck(url.pathname, res, options.decks, streams)) return
    const outline = /^\/api\/sessions\/([\w-]{1,100})\/outline$/.exec(url.pathname)
    if (outline && options.outlines && req.method === 'GET') {
      json(res, 200, options.outlines.outlineSnapshot(outline[1]!))
      return
    }
    const management = options.management
    if (management) {
      if (url.pathname === '/api/settings' && req.method === 'GET') {
        json(res, 200, await management.settings())
        return
      }
      if (url.pathname === '/api/preferences' && management.preferences) {
        if (req.method === 'GET') {
          json(res, 200, await management.preferences.get())
          return
        }
        if (req.method === 'PUT') {
          json(res, 200, await management.preferences.save(await readJson(req)))
          return
        }
      }
      const provider = /^\/api\/providers\/([\w.-]{1,100})$/.exec(url.pathname)
      if (provider && (req.method === 'PUT' || req.method === 'DELETE')) {
        if (req.method === 'PUT') await management.saveProvider(provider[1]!, await readJson(req))
        else await management.deleteProvider(provider[1]!)
        json(res, 200, { saved: true })
        return
      }
      const catalog = /^\/api\/providers\/([\w.-]{1,100})\/catalog$/.exec(url.pathname)
      if (catalog && req.method === 'GET') {
        json(res, 200, await management.catalog(catalog[1]!))
        return
      }
      if (url.pathname === '/api/sessions') {
        if (req.method === 'GET') {
          json(res, 200, await withActive(await management.sessions()))
          return
        }
        if (req.method === 'POST') {
          json(res, 201, await management.createSession(await readJson(req)))
          return
        }
      }
      const resource = /^\/api\/sessions\/([\w-]{1,100})\/(selection|activities|requests)$/.exec(url.pathname)
      if (resource?.[2] === 'selection' && req.method === 'PUT') {
        json(res, 200, await management.selectModel(resource[1]!, await readJson(req)))
        return
      }
      if (resource?.[2] === 'activities' && req.method === 'GET') {
        json(res, 200, await management.activities(resource[1]!))
        return
      }
      if (resource?.[2] === 'requests' && req.method === 'GET') {
        json(res, 200, await management.requests(resource[1]!))
        return
      }
      if (url.pathname === '/api/sessions/search' && req.method === 'POST' && management.searchSessions) {
        json(res, 200, await withActive(await management.searchSessions(await readJson(req))))
        return
      }
      const draft = /^\/api\/sessions\/([\w-]{1,100})\/draft$/.exec(url.pathname)
      if (draft && management.drafts) {
        if (req.method === 'GET') {
          json(res, 200, await management.drafts.get(draft[1]!))
          return
        }
        if (req.method === 'PUT') {
          json(res, 200, await management.drafts.save(draft[1]!, await readJson(req)))
          return
        }
      }
      const workspaces = management.workspaces
      if (workspaces && url.pathname.startsWith('/api/workspaces')) {
        if (url.pathname === '/api/workspaces') {
          if (req.method === 'GET') {
            json(res, 200, await workspaces.list())
            return
          }
          if (req.method === 'POST') {
            json(res, 200, await workspaces.add(await readJson(req)))
            return
          }
        }
        if (url.pathname === '/api/workspaces/selected' && req.method === 'PUT') {
          json(res, 200, await workspaces.select(await readJson(req)))
          return
        }
        const workspace = /^\/api\/workspaces\/([\w-]{1,100})(\/folder)?$/.exec(url.pathname)
        if (workspace && workspace[1] !== 'selected') {
          if (!workspace[2] && req.method === 'PUT') {
            json(res, 200, await workspaces.rename(workspace[1]!, await readJson(req)))
            return
          }
          if (!workspace[2] && req.method === 'DELETE') {
            json(res, 200, await workspaces.remove(workspace[1]!))
            return
          }
          if (workspace[2] && req.method === 'PUT') {
            json(res, 200, await workspaces.relink(workspace[1]!, await readJson(req)))
            return
          }
        }
      }
    }
    if (url.pathname === '/api/requests' && req.method === 'POST') {
      // No Agent runtime is connected: refuse the request instead of pretending to start work.
      if (!controller) throw new HttpError(503, 'REQUESTS_UNAVAILABLE')
      json(res, 202, await controller.submit(await body(req)))
      return
    }
    const approval = /^\/api\/requests\/([\w-]{1,100})\/approvals\/([\w-]{1,100})\/decision$/.exec(url.pathname)
    if (approval && req.method === 'POST') {
      if (!controller) throw new HttpError(404, 'APPROVAL_NOT_FOUND')
      const value = await readJson(req)
      if (
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value) ||
        !('decision' in value) ||
        Object.keys(value).some(key => key !== 'decision') ||
        (value.decision !== 'allow-once' && value.decision !== 'refuse')
      )
        throw new HttpError(400, 'INVALID_REQUEST')
      json(res, 200, controller.decide(approval[1]!, approval[2]!, value.decision))
      return
    }
    const stop = /^\/api\/requests\/([\w-]{1,100})\/stop$/.exec(url.pathname)
    if (stop && req.method === 'POST') {
      if (!controller) throw new HttpError(404, 'REQUEST_NOT_FOUND')
      json(res, 200, controller.stop(stop[1]!))
      return
    }
    const request = /^\/api\/requests\/([\w-]{1,100})(\/events)?$/.exec(url.pathname)
    if (request && req.method === 'GET') {
      if (!controller) throw new HttpError(404, 'REQUEST_NOT_FOUND')
      const id = request[1]!
      const snapshot = controller.get(id)
      if (!request[2]) {
        json(res, 200, snapshot)
        return
      }
      const after = cursor(req)
      if (streams.size >= 64) throw new HttpError(429, 'TOO_MANY_STREAMS')
      // Subscribe before reading saved events, so nothing published in between is lost; the cursor drops repeats.
      let last = after
      let ended = false
      const queued: RequestEvent[] = []
      let replaying = true
      const write = (event: RequestEvent) => {
        if (ended || event.sequence <= last || res.destroyed || res.writableEnded) return
        last = event.sequence
        const ready = res.write(`id: ${event.sequence}\nevent: request\ndata: ${JSON.stringify(event)}\n\n`)
        if ((event.kind === 'status' && !activeStatuses.has(event.status)) || !ready) {
          ended = true
          res.end()
        }
      }
      const unsubscribe = controller.subscribe(event => {
        if (event.requestId !== id) return
        if (replaying) queued.push(event)
        else write(event)
      })
      res.writeHead(200, { 'content-type': 'text/event-stream', 'x-accel-buffering': 'no' })
      streams.add(res)
      const heartbeat = setInterval(() => {
        if (!res.writableEnded && !res.write(': heartbeat\n\n')) res.end()
      }, 15000)
      res.on('close', () => {
        clearInterval(heartbeat)
        unsubscribe()
        streams.delete(res)
      })
      try {
        for (const event of controller.events(id, after)) write(event)
      } finally {
        replaying = false
        for (const event of queued.splice(0)) write(event)
      }
      // A request that ended before the cursor has nothing more to say.
      if (!ended && !activeStatuses.has(controller.get(id).status) && last >= controller.get(id).sequence) {
        ended = true
        res.end()
      }
      return
    }
    const session = /^\/api\/sessions\/([A-Za-z0-9_-]{1,100})\/history$/.exec(url.pathname)
    if (session && req.method === 'GET') {
      const messages = await options.readHistory(session[1]!)
      json(
        res,
        200,
        messages
          .filter(message => message.role !== 'system')
          .map(message => ({
            role: message.role,
            content: message.content,
            ...(message.role === 'user' && message.attachments
              ? {
                  attachments: message.attachments.map(item => ({
                    attachmentId: item.attachmentId,
                    name: item.name,
                    state: item.state,
                    byteSize: item.byteSize,
                    ...(item.detectedType ? { detectedType: item.detectedType } : {}),
                    ...(item.rejectionCode ? { rejectionCode: item.rejectionCode } : {}),
                    ...(item.source
                      ? {
                          source: {
                            sourceId: item.source.sourceId,
                            version: item.source.version,
                            kind: item.source.kind,
                            label: item.source.label,
                          },
                        }
                      : {}),
                  })),
                }
              : {}),
            ...(message.role === 'assistant' && message.interrupted ? { interrupted: true } : {}),
            ...(message.role === 'tool'
              ? { toolCallId: message.toolCallId, name: message.name, isError: message.isError === true }
              : {}),
          })),
      )
      return
    }
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
