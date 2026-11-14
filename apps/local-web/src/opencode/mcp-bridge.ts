import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import type { RequestTools } from '@deckagent/host-api'

export interface ToolBridge {
  readonly url: string
  readonly token: string
  revoke(): void
  close(): Promise<void>
}

/** One loopback listener and fresh bearer per admitted request. No product state is written here. */
export async function openToolBridge(options: {
  readonly tools: RequestTools
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
  const denied = (code: string) => ({ isError: true, content: [{ type: 'text' as const, text: code }] })
  const http = createServer(async (req, res) => {
    const actual = Buffer.from(req.headers.authorization ?? '')
    const expected = Buffer.from(`Bearer ${token}`)
    if (
      !active() ||
      req.url !== '/mcp' ||
      req.headers.host !== expectedHost ||
      req.headers.origin ||
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    ) {
      res.writeHead(403).end()
      return
    }
    if (req.method !== 'POST' || req.headers['content-type']?.split(';')[0] !== 'application/json') {
      res.writeHead(405).end()
      return
    }
    let body: unknown
    try {
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > 64 * 1024) {
          res.writeHead(413).end()
          return
        }
        chunks.push(chunk)
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      res.writeHead(400).end()
      return
    }
    if (!active()) {
      res.writeHead(403).end()
      return
    }
    const server = new Server({ name: 'deckagent', version: '0.0.0' }, { capabilities: { tools: {} } })
    servers.add(server)
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: active()
        ? options.tools.schemas.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: { ...tool.inputSchema, required: [...tool.inputSchema.required] },
          }))
        : [],
    }))
    server.setRequestHandler(CallToolRequestSchema, async request => {
      if (!active()) return denied('REQUEST_CLOSED')
      if (!options.tools.schemas.some(tool => tool.name === request.params.name)) return denied('TOOL_NOT_ALLOWED')
      try {
        const result = await options.tools.call(request.params.name, request.params.arguments ?? {})
        return active()
          ? { isError: result.isError, content: result.content.map(item => ({ ...item })) }
          : denied('REQUEST_CLOSED')
      } catch {
        return denied('TOOL_FAILED')
      }
    })
    const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true })
    const connection: Transport = {
      start: () => transport.start(),
      send: (message, opts) => transport.send(message, opts),
      close: () => transport.close(),
    }
    transport.onmessage = (message, extra) => connection.onmessage?.(message, extra)
    transport.onerror = error => connection.onerror?.(error)
    transport.onclose = () => connection.onclose?.()
    res.on('close', () => {
      servers.delete(server)
      void server.close().catch(() => {})
    })
    try {
      await server.connect(connection)
      await transport.handleRequest(req, res, body)
    } catch {
      if (!res.headersSent) res.writeHead(500).end()
    }
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
