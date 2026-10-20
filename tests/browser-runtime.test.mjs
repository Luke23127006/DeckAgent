import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { AgentRuntime, MemorySessionStore } from '../packages/agent/runtime/lib/index.js'
import { startHost } from '../packages/host/api/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'

test('browser connection submits a request, follows snapshots and restores history', async t => {
  const sessions = new MemorySessionStore()
  const runtime = new AgentRuntime({
    sessions,
    model: {
      async *stream() {
        yield { type: 'text-delta', text: 'Browser connected' }
        yield { type: 'finish', reason: 'stop' }
      },
    },
  })
  const host = await startHost({
    openAgent: id => runtime.createAgent({ sessionId: id, selection: { provider: 'test', model: 'fixture' } }),
    readHistory: id => sessions.read(id),
  })
  t.after(async () => {
    await host.close()
    await runtime.dispose()
  })
  const client = new HostClient(host.origin, host.token)
  const accepted = await client.send({ sessionId: 'browser-test', input: 'Hello' })
  const snapshots = []
  for await (const value of client.watch(accepted.requestId)) snapshots.push(value)
  assert.equal(snapshots.at(-1).status, 'completed')
  assert.equal(snapshots.at(-1).result.text, 'Browser connected')
  assert.deepEqual(await client.history('browser-test'), [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Browser connected' },
  ])
  assert.equal((await client.snapshot(accepted.requestId)).status, 'completed')
  await assert.rejects(new HostClient(host.origin, 'wrong').history('browser-test'), /AUTH_REQUIRED/)
})

test('client works against a mock SSE server with fragmented UTF-8 and rejects malformed snapshots', async t => {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    const value = req.url.includes('malformed')
      ? { requestId: 'malformed', sessionId: 'mock', status: 'completed' }
      : {
          requestId: 'mock',
          sessionId: 'mock',
          status: 'completed',
          result: { status: 'completed', text: 'Xin chào 🌿', steps: 1 },
        }
    const bytes = Buffer.from(`: heartbeat\n\nevent: snapshot\ndata: ${JSON.stringify(value)}\n\n`)
    // Split inside a multibyte character, not just between complete JSON frames.
    const split = bytes.indexOf(Buffer.from('🌿')) + 2
    res.write(bytes.subarray(0, split))
    setImmediate(() => res.end(bytes.subarray(split)))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(
    () =>
      new Promise(resolve => {
        server.close(resolve)
        server.closeAllConnections()
      }),
  )
  const client = new HostClient(`http://127.0.0.1:${server.address().port}`, 'fixture-token')
  const received = []
  for await (const value of client.watch('mock')) received.push(value)
  assert.equal(received.at(-1).result.text, 'Xin chào 🌿')
  await assert.rejects(async () => {
    for await (const _value of client.watch('malformed')) {
      /* Invalid wire data must reject before yielding. */
    }
  }, /INVALID_RESPONSE/)
})
