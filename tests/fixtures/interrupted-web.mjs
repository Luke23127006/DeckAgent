import { join } from 'node:path'
import { startLocalWeb } from '../../apps/local-web/lib/index.js'
import { HostClient } from '../../packages/client/runtime/lib/index.js'
import { DeckService } from '../../packages/presentation/deck/lib/index.js'
import { mkdir, writeFile } from 'node:fs/promises'

const directory = process.argv[2]
await mkdir(join(directory, 'data'), { recursive: true })
await mkdir(join(directory, 'workspace'), { recursive: true })
const decks = new DeckService(join(directory, 'data', 'decks.sqlite'))
decks.confirm('interrupted-chat', { outlineId: 'outline', slides: [{ slideId: 'saved', title: 'Saved' }, { slideId: 'pending', title: 'Pending' }] })
decks.publish('interrupted-chat', { outlineId: 'outline', slideId: 'saved', expectedRevision: 0, publicationId: 'saved', html: '<h1>Durable before crash</h1>' })
decks.close()
await writeFile(join(directory, 'workspace', 'unfinished.html'), '<h1>Never published')
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
