import { join } from 'node:path'
import { startLocalWeb } from '../../apps/local-web/lib/index.js'
const dir = process.argv[2]
const selection = { provider: 'fixture', model: 'approval-restart' }
const app = await startLocalWeb({
  dataDir: join(dir, 'data'),
  selection,
  model: {
    async *stream() {
      yield {
        type: 'tool-call',
        call: { id: 'read', name: 'read_file', arguments: { path: join(dir, 'outside.txt'), scope: 'external' } },
      }
      yield { type: 'finish', reason: 'tool-calls' }
    },
  },
})
const api = async (path, method = 'GET', value) =>
  (
    await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
  ).json()
const session = await api('sessions', 'POST', { selection })
const request = await api('requests', 'POST', { sessionId: session.sessionId, input: 'Read' })
const timer = setInterval(async () => {
  const state = await api(`requests/${request.requestId}`)
  if (state.approval) {
    clearInterval(timer)
    process.send({ sessionId: session.sessionId, requestId: request.requestId, approval: state.approval })
  }
}, 10)
