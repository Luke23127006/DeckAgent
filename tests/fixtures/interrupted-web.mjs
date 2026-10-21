import { join } from 'node:path'
import { startLocalWeb } from '../../apps/local-web/lib/index.js'
import { HostClient } from '../../packages/client/runtime/lib/index.js'

const directory = process.argv[2]
const app = await startLocalWeb({
  workspace: join(directory, 'workspace'), dataDir: join(directory, 'data'),
  selection: { provider: 'fixture', model: 'interrupted' },
  model: {
    async *stream(request) {
      process.send({ started: true })
      await new Promise((_, reject) => request.signal.addEventListener('abort', () => reject(new Error('Fixture aborted')), { once: true }))
      yield { type: 'finish', reason: 'stop' }
    },
  },
})
await new HostClient(app.origin, app.token).send({ sessionId: 'interrupted-chat', input: 'Work until the Host is killed' })
