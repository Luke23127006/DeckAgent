import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { HostOptions, RequestSnapshot } from './contracts.ts'
import { HttpError, RequestController } from './request-controller.ts'

export type { AgentRequest, HistoryMessage, HostOptions, RequestSnapshot, ProviderSettings, ProviderTemplate, WebSettings, WebSession, StoredActivity, StoredRequest, WebManagement } from './contracts.ts'
export { HttpError } from './request-controller.ts'

const idPattern = /^[A-Za-z0-9_-]{1,100}$/

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

async function body(req: IncomingMessage): Promise<{ sessionId: string; input: string }> {
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
    value.input.length > 16000 ||
    Object.keys(value).some(key => !['sessionId', 'input'].includes(key))
  )
    throw new HttpError(400, 'INVALID_REQUEST')
  return { sessionId: value.sessionId, input: value.input }
}

/** Loopback-only, authenticated HTTP/SSE boundary. Disconnect never cancels a turn. */
export async function startHost(options: HostOptions) {
  const token = randomBytes(32).toString('hex')
  const expected = Buffer.from(`Bearer ${token}`)
  const controller = new RequestController(options.openAgent)
  const streams = new Set<ServerResponse>()
  let origin = ''
  let closing: Promise<void> | undefined
  const server = createServer((req, res) => {
    res.setHeader('cache-control', 'no-store')
    res.setHeader('x-content-type-options', 'nosniff')
    res.setHeader('referrer-policy', 'no-referrer')
    res.setHeader(
      'content-security-policy',
      "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    )
    route(req, res).catch(error => {
      if (res.headersSent) {
        res.destroy()
        return
      }
      const known = error instanceof HttpError
      json(res, known ? error.status : 500, {
        error: { code: known ? error.code : 'HOST_ERROR', message: 'Request could not be completed' },
      })
    })
  })
  server.requestTimeout = 10000
  server.headersTimeout = 10000
  server.on('clientError', (_error, socket) => {
    socket.destroy()
  })

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
      if (asset.sandboxed) res.setHeader('content-security-policy', "sandbox; default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'")
      res.writeHead(200, { 'content-type': asset.contentType })
      res.end(asset.body)
      return
    }
    const auth = Buffer.from(req.headers.authorization ?? '')
    if (auth.length !== expected.length || !timingSafeEqual(auth, expected)) throw new HttpError(401, 'AUTH_REQUIRED')
    const management = options.management
    if (management) {
      if (url.pathname === '/api/settings' && req.method === 'GET') {
        json(res, 200, await management.settings()); return
      }
      const provider = /^\/api\/providers\/([\w.-]{1,100})$/.exec(url.pathname)
      if (provider && (req.method === 'PUT' || req.method === 'DELETE')) {
        if (req.method === 'PUT') await management.saveProvider(provider[1]!, await readJson(req))
        else await management.deleteProvider(provider[1]!)
        json(res, 200, { saved: true }); return
      }
      const catalog = /^\/api\/providers\/([\w.-]{1,100})\/catalog$/.exec(url.pathname)
      if (catalog && req.method === 'GET') { json(res, 200, await management.catalog(catalog[1]!)); return }
      if (url.pathname === '/api/sessions') {
        if (req.method === 'GET') {
          const sessions = await management.sessions()
          json(res, 200, sessions.map(session => {
            const activeRequestId = controller.active(session.sessionId)
            return { ...session, ...(activeRequestId ? { activeRequestId } : {}) }
          })); return
        }
        if (req.method === 'POST') { json(res, 201, await management.createSession(await readJson(req))); return }
      }
      const resource = /^\/api\/sessions\/([\w-]{1,100})\/(selection|activities|requests)$/.exec(url.pathname)
      if (resource?.[2] === 'selection' && req.method === 'PUT') {
        json(res, 200, await management.selectModel(resource[1]!, await readJson(req))); return
      }
      if (resource?.[2] === 'activities' && req.method === 'GET') {
        json(res, 200, await management.activities(resource[1]!)); return
      }
      if (resource?.[2] === 'requests' && req.method === 'GET') {
        json(res, 200, await management.requests(resource[1]!)); return
      }
    }
    if (url.pathname === '/api/requests' && req.method === 'POST') {
      json(res, 202, await controller.submit(await body(req)))
      return
    }
    const request = /^\/api\/requests\/([\w-]+)(\/events)?$/.exec(url.pathname)
    if (request && req.method === 'GET') {
      const snapshot = controller.get(request[1]!)
      if (!request[2]) {
        json(res, 200, snapshot)
        return
      }
      if (streams.size >= 64) throw new HttpError(429, 'TOO_MANY_STREAMS')
      res.writeHead(200, { 'content-type': 'text/event-stream', 'x-accel-buffering': 'no' })
      streams.add(res)
      const send = (value: RequestSnapshot) => {
        if (value.requestId !== snapshot.requestId || res.destroyed || res.writableEnded) return
        const ready = res.write(`event: snapshot\ndata: ${JSON.stringify(value)}\n\n`)
        if (value.status !== 'running' || !ready) res.end()
      }
      const unsubscribe = controller.subscribe(send)
      const heartbeat = setInterval(() => {
        if (!res.write(': heartbeat\n\n')) res.end()
      }, 15000)
      res.on('close', () => {
        clearInterval(heartbeat)
        unsubscribe()
        streams.delete(res)
      })
      send(snapshot)
      return
    }
    const session = /^\/api\/sessions\/([A-Za-z0-9_-]{1,100})\/history$/.exec(url.pathname)
    if (session && req.method === 'GET') {
      const messages = await options.readHistory(session[1]!)
      json(
        res,
        200,
        messages.filter(message => message.role !== 'system').map(({ role, content }) => ({ role, content })),
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
        await Promise.all([stopped, controller.close()])
      })()
      return closing
    },
  }
}
