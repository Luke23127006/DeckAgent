import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { AgentRuntime, MemorySessionStore } from '../packages/agent/runtime/lib/index.js'
import { startHost } from '../packages/host/api/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'

test('waiting snapshots require a valid question and an SSE stream continues through reply to completion', async t => {
  const question = { questionId: 'question', version: 1, prompt: 'Chủ đề?', options: ['Tái chế'], allowSkip: true }
  const waiting = { requestId: 'waiting', sessionId: 'chat', status: 'awaiting_user', question }
  let payload = waiting
  const server = createServer((req, res) => {
    if (req.url.endsWith('/events')) {
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      res.end([waiting, { requestId: 'waiting', sessionId: 'chat', status: 'running' },
        { requestId: 'waiting', sessionId: 'chat', status: 'completed', result: { status: 'completed', text: 'Outline ready', steps: 2 } }]
        .map(value => `event: snapshot\ndata: ${JSON.stringify(value)}\n\n`).join(''))
    } else res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(payload))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve) }))
  const client = new HostClient(`http://127.0.0.1:${server.address().port}`, 'fixture')
  assert.deepEqual(await client.snapshot('waiting'), waiting)
  const states = []
  for await (const value of client.watch('waiting')) states.push(value.status)
  assert.deepEqual(states, ['awaiting_user', 'running', 'completed'])
  for (const bad of [undefined, { ...question, version: 0 }, { ...question, options: [3] }, { ...question, allowSkip: 'yes' }]) {
    payload = { ...waiting, question: bad }
    await assert.rejects(client.snapshot('waiting'), /INVALID_RESPONSE/)
  }
  payload = { ...waiting, status: 'running' }
  await assert.rejects(client.snapshot('waiting'), /INVALID_RESPONSE/)
})

test('history exposes tool identity for Activity without exposing internal fields or arguments', async t => {
  const host = await startHost({
    openAgent: async () => { throw new Error('No work should start') },
    readHistory: async () => [{ role: 'tool', content: 'Saved output', toolCallId: 'call-one', name: 'read_file', isError: false,
      arguments: { internal: 'private-fixture-marker' }, providerState: { private: 'private-fixture-marker' } }],
  })
  t.after(() => host.close())
  const history = await new HostClient(host.origin, host.token).history('chat')
  assert.deepEqual(history, [{ role: 'tool', content: 'Saved output', toolCallId: 'call-one', name: 'read_file', isError: false }])
  assert.equal(JSON.stringify(history).includes('private-fixture-marker'), false)
})

test('history accepts legacy tool output and rejects malformed optional Activity identity', async t => {
  let payload = [{ role: 'tool', content: 'Earlier output' }]
  const server = createServer((_req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(payload)) })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const client = new HostClient(`http://127.0.0.1:${server.address().port}`, 'fixture')
  assert.deepEqual(await client.history('chat'), payload)
  for (const field of [{ toolCallId: 3 }, { name: '<script>' }, { isError: 'false' }]) {
    payload = [{ role: 'tool', content: 'Earlier output', ...field }]
    await assert.rejects(client.history('chat'), /INVALID_RESPONSE/)
  }
})

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
