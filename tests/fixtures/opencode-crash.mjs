import { join } from 'node:path'
import { SqliteSessionStore } from '../../packages/session/persistence/lib/index.js'
import { ToolRegistry } from '../../packages/agent/runtime/lib/index.js'
import { openToolBridge } from '../../apps/local-web/lib/types/opencode/mcp-bridge.js'

const sessions = new SqliteSessionStore(join(process.argv[2], 'sessions.sqlite'))
await sessions.open('crashed-chat')
const tools = new ToolRegistry()
tools.register({
  name: 'wait',
  description: 'Crash fixture',
  parameters: { type: 'object', properties: {}, additionalProperties: false },
  async execute() {
    process.send({ type: 'entered' })
    await new Promise(() => {})
    return 'unreachable'
  },
})
const bridge = await openToolBridge({
  tools,
  allowed: ['wait'],
  sessions,
  sessionId: 'crashed-chat',
  signal: new AbortController().signal,
  onActivity: async () => {},
})
process.send({ type: 'ready', url: bridge.url, token: bridge.token })
