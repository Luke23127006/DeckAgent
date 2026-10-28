import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'

test('Host data cannot be placed inside the Agent grant, including names beginning with two dots', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-data-policy-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const app = startLocalWeb({
    workspace: dir,
    dataDir: join(dir, '..private'),
    selection: { provider: 'fixture', model: 'test' },
    model: {
      async *stream() {
        yield { type: 'finish', reason: 'stop' }
      },
    },
  })
  await assert.rejects(async () => {
    const started = await app
    await started.close()
  }, /outside/)
})

test('Local Web wires Agent, File Tools and durable Session; denied writes leave no file', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-web-'))
  const apps = []
  t.after(async () => {
    for (const app of apps) await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const model = {
    async *stream(request) {
      if (request.messages.at(-1).role === 'tool') {
        yield { type: 'text-delta', text: request.messages.at(-1).isError ? 'Write denied' : 'HTML created' }
        yield { type: 'finish', reason: 'stop' }
      } else {
        yield {
          type: 'tool-call',
          call: {
            id: `write-${request.messages.length}`,
            name: 'write_file',
            arguments: {
              path: request.messages.at(-1).content.includes('outside') ? '../outside.html' : 'slide.html',
              content: '<h1>Real file</h1>',
            },
          },
        }
        yield { type: 'finish', reason: 'tool-calls' }
      }
    },
  }
  const options = {
    model,
    selection: { provider: 'fixture', model: 'test' },
    workspace: join(dir, 'workspace'),
    dataDir: join(dir, 'data'),
  }
  const app = await startLocalWeb(options)
  apps.push(app)
  const client = new HostClient(app.origin, app.token)
  let createdRequest
  for (const [sessionId, input, expected] of [
    ['create', 'Create HTML', 'HTML created'],
    ['deny', 'Write outside', 'Write denied'],
  ]) {
    const accepted = await client.send({ sessionId, input })
    if (sessionId === 'create') createdRequest = accepted.requestId
    let completed
    for await (const value of client.watch(accepted.requestId)) completed = value
    assert.equal(completed.status, 'completed')
    assert.equal(completed.result.text, expected)
  }
  assert.equal(await readFile(join(dir, 'workspace', createHash('sha256').update('create').digest('hex'), createdRequest, 'slide.html'), 'utf8'), '<h1>Real file</h1>')
  await assert.rejects(readFile(join(dir, 'outside.html')), { code: 'ENOENT' })
  const page = await fetch(app.origin)
  assert.equal(page.status, 200)
  assert.match(await page.text(), /data-slot="request"/)
  assert.equal((await fetch(`${app.origin}/slide.html`)).status, 404)
  await app.close()
  const restarted = await startLocalWeb(options)
  apps.push(restarted)
  const history = await new HostClient(restarted.origin, restarted.token).history('create')
  assert.equal(history.at(-1).content, 'HTML created')
})
