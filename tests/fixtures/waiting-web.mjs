import { join } from 'node:path'
import { startLocalWeb } from '../../apps/local-web/lib/index.js'
import { HostClient } from '../../packages/client/runtime/lib/index.js'

const directory = process.argv[2]
const app = await startLocalWeb({ workspace: join(directory, 'workspace'), dataDir: join(directory, 'data'),
  selection: { provider: 'fixture', model: 'waiting' }, model: { async *stream(request) {
    if (request.messages.at(-1).role === 'user') {
      yield { type: 'tool-call', call: { id: 'waiting-topic', name: 'ask_clarification', arguments: {
        question: JSON.stringify({ prompt: 'Chủ đề nào?', options: ['Tái chế'], allowSkip: true }),
      } } }
      yield { type: 'finish', reason: 'tool-calls' }
    } else {
      yield { type: 'text-delta', text: 'Chủ đề nào?' }
      yield { type: 'finish', reason: 'stop' }
    }
  } } })
const client = new HostClient(app.origin, app.token)
const accepted = await client.send({ sessionId: 'waiting-chat', input: 'Tạo trình bày', presentation: true })
for await (const snapshot of client.watch(accepted.requestId)) {
  if (snapshot.status === 'awaiting_user') { process.send({ requestId: accepted.requestId, question: snapshot.question }); break }
}
