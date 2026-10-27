import { join } from 'node:path'
import { startLocalWeb } from '../../apps/local-web/lib/index.js'
import { HostClient } from '../../packages/client/runtime/lib/index.js'

const app = await startLocalWeb({
  dataDir: join(process.argv[2], 'data'),
  selection: { provider: 'fixture', model: 'concurrent' },
  model: {
    async *stream({ messages, signal }) {
      const last = messages.at(-1)
      if (last.content === 'Hold running') {
        yield { type: 'text-delta', text: 'Partial running reply' }
        await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }))
      } else if (last.role === 'user') {
        yield {
          type: 'tool-call',
          call: {
            id: 'ask-concurrent',
            name: 'ask_clarification',
            arguments: {
              question: JSON.stringify({ prompt: 'Waiting question', options: ['Answer'], allowSkip: true }),
            },
          },
        }
        yield { type: 'finish', reason: 'tool-calls' }
      } else {
        yield { type: 'text-delta', text: 'Waiting question' }
        yield { type: 'finish', reason: 'stop' }
      }
    },
  },
})
const client = new HostClient(app.origin, app.token)
const running = await client.send({ sessionId: 'running-chat', input: 'Hold running' })
const waiting = await client.send({ sessionId: 'waiting-chat', input: 'Ask a question' })
for await (const snapshot of client.watch(waiting.requestId)) {
  if (snapshot.status === 'awaiting_user') {
    process.send({ 'running-chat': running.requestId, 'waiting-chat': waiting.requestId })
    break
  }
}
