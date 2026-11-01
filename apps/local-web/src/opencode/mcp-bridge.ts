import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import type { ActivityEvent, SessionStore, ToolRegistry } from '@deckagent/agent-runtime'

/** Request-local tools stay in the Host process, behind the existing registry. */
export async function openToolBridge(options: {
  tools: ToolRegistry
  allowed: readonly string[]
  signal: AbortSignal
  sessions: SessionStore
  sessionId: string
  onActivity: (event: ActivityEvent) => Promise<void>
}) {
  const token = randomUUID()
  let revoked = false
  let queue: Promise<unknown> = Promise.resolve()
  const servers = new Set<Server>()
  const http = createServer(async (req, res) => {
    if (revoked || options.signal.aborted || req.url !== '/mcp' || req.headers.authorization !== `Bearer ${token}`) {
      res.writeHead(403).end()
      return
    }
    if (req.headers.origin || req.method !== 'POST') {
      res.writeHead(405).end()
      return
    }
    const server = new Server({ name: 'deckagent', version: '0.0.0' }, { capabilities: { tools: {} } })
    servers.add(server)
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: options.tools.schemas(options.allowed).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters,
      })),
    }))
    server.setRequestHandler(CallToolRequestSchema, request => {
      const work = queue.then(async () => {
        if (revoked) throw new Error('Tool access revoked')
        options.signal.throwIfAborted()
        const id = randomUUID(),
          name = request.params.name
        const entries: [string, string | number | boolean][] = []
        for (const [key, value] of Object.entries(request.params.arguments ?? {})) {
          if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean')
            throw new Error('Invalid tool arguments')
          entries.push([key, value])
        }
        const args = Object.fromEntries(entries)
        const call = { id, name, arguments: args }
        // The existing client joins tool history to activities using this prefix.
        const activityId = `tool-${id}`
        await options.onActivity({ id: activityId, kind: 'tool', label: name, status: 'running' })
        if (revoked) throw new Error('Tool access revoked')
        options.signal.throwIfAborted()
        await options.sessions.append(options.sessionId, [{ role: 'assistant', content: '', toolCalls: [call] }])
        const result =
          revoked || options.signal.aborted
            ? options.tools.failure(call, 'TOOL_NOT_STARTED')
            : await options.tools.execute(call, options.allowed, options.signal)
        await options.sessions.append(options.sessionId, [result])
        await options.onActivity({
          id: activityId,
          kind: 'tool',
          label: name,
          status: options.signal.aborted ? 'stopped' : result.isError ? 'failed' : 'completed',
        })
        return { isError: result.isError, content: [{ type: 'text' as const, text: result.content }] }
      })
      queue = work.catch(() => {})
      // Persistence/activity failures are outside ToolRegistry's error sanitizer.
      // Never let the MCP SDK forward an arbitrary exception message to the model.
      return work.catch(() => ({
        isError: true,
        content: [{ type: 'text' as const, text: 'DeckAgent tool call failed' }],
      }))
    })
    const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true })
    res.on('close', () => {
      servers.delete(server)
      void server.close()
    })
    // SDK 1.26's concrete callbacks include undefined; its interface uses optional fields.
    // Forward callbacks explicitly so strict optional-property checking stays enabled.
    const connection: Transport = {
      start: () => transport.start(),
      send: (message, options) => transport.send(message, options),
      close: () => transport.close(),
    }
    transport.onmessage = (message, extra) => connection.onmessage?.(message, extra)
    transport.onerror = error => connection.onerror?.(error)
    transport.onclose = () => connection.onclose?.()
    try {
      await server.connect(connection)
      await transport.handleRequest(req, res)
    } catch {
      if (!res.headersSent) res.writeHead(500).end()
    }
  })
  await new Promise<void>((resolve, reject) => {
    http.once('error', reject)
    http.listen(0, '127.0.0.1', resolve)
  })
  const address = http.address()
  if (!address || typeof address === 'string') throw new Error('Bridge listener unavailable')
  return {
    url: `http://127.0.0.1:${address.port}/mcp`,
    token,
    revoke() {
      revoked = true
    },
    async close() {
      revoked = true
      await queue
      await Promise.all([...servers].map(server => server.close()))
      http.closeAllConnections()
      await new Promise<void>((resolve, reject) => http.close(error => (error ? reject(error) : resolve())))
    },
  }
}
