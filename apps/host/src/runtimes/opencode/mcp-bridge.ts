import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import type { RunTools } from '../../runs/ports.ts'

export interface ToolBridge {
  readonly url: string
  readonly token: string
  revoke(): void
  close(): Promise<void>
}

type Denied = { isError: true; content: { type: 'text'; text: string }[] }

const denied = (code: string): Denied => ({ isError: true, content: [{ type: 'text', text: code }] })

function isAuthorized(req: IncomingMessage, expectedHost: string, token: string, active: () => boolean): boolean {
  const actual = Buffer.from(req.headers.authorization ?? '')
  const expected = Buffer.from(`Bearer ${token}`)
  return (
    active() &&
    req.url === '/mcp' &&
    req.headers.host === expectedHost &&
    !req.headers.origin &&
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  )
}

async function readJsonBody(req: IncomingMessage, res: ServerResponse): Promise<{ body?: unknown; handled: boolean }> {
  if (req.method !== 'POST' || req.headers['content-type']?.split(';')[0] !== 'application/json') {
    res.writeHead(405).end()
    return { handled: true }
  }
  try {
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of req) {
      size += chunk.length
      if (size > 64 * 1024) {
        res.writeHead(413).end()
        return { handled: true }
      }
      chunks.push(chunk)
    }
    return { body: JSON.parse(Buffer.concat(chunks).toString('utf8')), handled: false }
  } catch {
    res.writeHead(400).end()
    return { handled: true }
  }
}

function createToolServer(tools: RunTools, active: () => boolean, servers: Set<Server>): Server {
  const server = new Server({ name: 'deckagent', version: '0.0.0' }, { capabilities: { tools: {} } })
  servers.add(server)
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: active()
      ? tools.schemas.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: { ...tool.inputSchema, required: [...tool.inputSchema.required] },
        }))
      : [],
  }))
  server.setRequestHandler(CallToolRequestSchema, async request => {
    if (!active()) return denied('REQUEST_CLOSED')
    if (!tools.schemas.some(tool => tool.name === request.params.name)) return denied('TOOL_NOT_ALLOWED')
    try {
      const result = await tools.call(request.params.name, request.params.arguments ?? {})
      return active()
        ? { isError: result.isError, content: result.content.map(item => ({ ...item })) }
        : denied('REQUEST_CLOSED')
    } catch {
      return denied('TOOL_FAILED')
    }
  })
  return server
}

async function forwardMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  expectedHost: string,
  body: unknown,
  server: Server,
): Promise<void> {
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true })
  const connection: Transport = {
    start: () => transport.start(),
    send: (message, opts) => transport.send(message, opts),
    close: () => transport.close(),
  }
  transport.onmessage = (message, extra) => connection.onmessage?.(message, extra)
  transport.onerror = error => connection.onerror?.(error)
  transport.onclose = () => connection.onclose?.()

  res.on('close', () => {
    void server.close().catch(() => {})
  })

  try {
    await server.connect(connection)
    const headers = new Headers()
    for (const [name, value] of Object.entries(req.headers))
      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
    const response = await transport.handleRequest(
      new Request(`http://${expectedHost}/mcp`, { method: 'POST', headers, body: JSON.stringify(body) }),
      { parsedBody: body },
    )
    // Let Node frame the HTTP body. The Node SDK wrapper's optimized socket path can emit invalid chunks.
    const outgoing = Object.fromEntries(response.headers)
    delete outgoing['transfer-encoding']
    res.writeHead(response.status, outgoing)
    if (response.body) for await (const bytes of response.body) res.write(bytes)
    res.end()
  } catch {
    if (!res.headersSent) res.writeHead(500).end()
  }
}

/** One loopback listener and fresh bearer per admitted request. No product state is written here. */
export async function openToolBridge(options: {
  readonly tools: RunTools
  readonly signal: AbortSignal
}): Promise<ToolBridge> {
  const token = randomBytes(32).toString('hex')
  let revoked = false
  let closing: Promise<void> | undefined
  let expectedHost = ''
  const servers = new Set<Server>()
  const revoke = () => {
    revoked = true
  }
  options.signal.addEventListener('abort', revoke, { once: true })
  const active = () => !revoked && !options.signal.aborted
  const http = createServer(async (req, res) => {
    if (!isAuthorized(req, expectedHost, token, active)) {
      res.writeHead(403).end()
      return
    }

    const { body, handled } = await readJsonBody(req, res)
    if (handled) return

    if (!active()) {
      res.writeHead(403).end()
      return
    }

    const server = createToolServer(options.tools, active, servers)
    await forwardMcpRequest(req, res, expectedHost, body, server)
    servers.delete(server)
    void server.close().catch(() => {})
  })
  http.requestTimeout = 10_000
  http.headersTimeout = 10_000

  await new Promise<void>((resolve, reject) => {
    http.once('error', reject)
    http.listen(0, '127.0.0.1', resolve)
  })

  const address = http.address()
  if (!address || typeof address === 'string') throw new Error('MCP_BRIDGE_UNAVAILABLE')

  expectedHost = `127.0.0.1:${address.port}`
  return {
    url: `http://${expectedHost}/mcp`,
    token,
    revoke,
    close() {
      closing ??= (async () => {
        revoke()
        options.signal.removeEventListener('abort', revoke)
        await Promise.all([...servers].map(server => server.close().catch(() => {})))
        http.closeAllConnections()
        await new Promise<void>(resolve => http.close(() => resolve()))
      })()
      return closing
    },
  }
}
