import { parseArgs } from 'node:util'
import { isAbsolute, join } from 'node:path'
import { DeckService } from '@deckagent/deck'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { externalPresentation } from './external-presentation.ts'

const { values } = parseArgs({
  options: {
    profile: { type: 'string' },
    session: { type: 'string' },
    action: { type: 'string', default: 'inspect' },
    slides: { type: 'string', default: '' },
    version: { type: 'string' },
    outline: { type: 'string' },
  },
})
if (!values.profile || !isAbsolute(values.profile) || !values.session || !/^[\w-]{1,100}$/.test(values.session))
  throw Error('Explicit absolute --profile and valid --session required')
const deck = new DeckService(join(values.profile, 'decks.sqlite'))
try {
  if (values.action === 'inspect')
    console.log(
      JSON.stringify(
        { contractVersion: 1, outline: deck.outlineSnapshot(values.session), deck: deck.snapshot(values.session) },
        null,
        2,
      ),
    )
  else if (values.action === 'confirm') {
    if (!values.outline || !values.version || !/^\d+$/.test(values.version))
      throw Error('Exact --outline and --version required')
    deck.confirmOutline(values.session, { outlineId: values.outline, version: Number(values.version) })
    console.log(JSON.stringify(deck.snapshot(values.session), null, 2))
  } else if (values.action === 'serve') {
    if (values.version === undefined || !/^\d+$/.test(values.version)) throw Error('Exact deck --version required')
    const tools = externalPresentation(
        deck,
        values.session,
        values.slides ? values.slides.split(',') : [],
        Number(values.version),
      ),
      abort = new AbortController()
    const server = new Server({ name: 'deckagent-presentation', version: '1.0.0' }, { capabilities: { tools: {} } })
    let queue: Promise<unknown> = Promise.resolve()
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: tools.schemas().map(t => ({ name: t.name, description: t.description, inputSchema: t.parameters })),
    }))
    server.setRequestHandler(CallToolRequestSchema, request => {
      const work = queue
        .then(async () => {
          abort.signal.throwIfAborted()
          const args = request.params.arguments ?? {}
          if (Object.values(args).some(v => !['string', 'number', 'boolean'].includes(typeof v)))
            return { isError: true, content: [{ type: 'text' as const, text: 'INVALID_TOOL_INPUT' }] }
          const result = await tools.call(
            request.params.name,
            args as Record<string, string | number | boolean>,
            abort.signal,
          )
          return { isError: result.isError ?? false, content: [{ type: 'text' as const, text: result.content }] }
        })
        .catch(() => ({ isError: true, content: [{ type: 'text' as const, text: 'External tool unavailable' }] }))
      queue = work
      return work
    })
    await server.connect(new StdioServerTransport())
    await new Promise<void>(resolve => {
      server.onclose = () => {
        abort.abort()
        resolve()
      }
      for (const event of ['SIGINT', 'SIGTERM'] as const)
        process.once(event, () => {
          abort.abort()
          void server.close()
        })
    })
    await queue
  } else throw Error('Action must be inspect, confirm or serve')
} finally {
  deck.close()
}
