import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { startHost } from '../packages/host/api/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'

// B02: the in-request question/reply contract was removed (ADR-0004: a question ends its request, the reply is a new
// request), so its waiting-snapshot case is gone. The browser follows saved request events instead of snapshots.

test('history exposes tool identity for Activity without exposing internal fields or arguments', async t => {
  const host = await startHost({
    readHistory: async () => [{ role: 'tool', content: 'Saved output', toolCallId: 'call-one', name: 'read_file', isError: false,
      arguments: { internal: 'private-fixture-marker' }, providerState: { private: 'private-fixture-marker' } },
    { role: 'assistant', content: 'Half', interrupted: true }],
  })
  t.after(() => host.close())
  const history = await new HostClient(host.origin, host.token).history('chat')
  assert.deepEqual(history, [{ role: 'tool', content: 'Saved output', toolCallId: 'call-one', name: 'read_file', isError: false },
    { role: 'assistant', content: 'Half', interrupted: true }])
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
  for (const field of [{ toolCallId: 3 }, { name: '<script>' }, { isError: 'false' }, { interrupted: true }]) {
    payload = [{ role: 'tool', content: 'Earlier output', ...field }]
    await assert.rejects(client.history('chat'), /INVALID_RESPONSE/)
  }
})

test('browser connection submits a request, follows saved events and restores history', async t => {
  const messages = new Map()
  const events = []
  const store = {
    admit({ requestId, sessionId, input, selection }) {
      messages.set(sessionId, [{ role: 'user', content: input }])
      events.push({ kind: 'status', status: 'active', requestId, sequence: 1, timestamp: 't' })
      this.request = { requestId, sessionId, status: 'active', selection, historyStart: 0, startedAt: 't', lastSequence: 1 }
      return this.request
    },
    append(requestId, event) {
      const saved = { ...event, requestId, sequence: events.length + 1, timestamp: 't' }
      events.push(saved)
      return saved
    },
    finish(requestId, status) {
      messages.get(this.request.sessionId).push({ role: 'assistant', content: 'Browser connected' })
      this.request = { ...this.request, status }
      const saved = { kind: 'status', status, requestId, sequence: events.length + 1, timestamp: 't' }
      events.push(saved)
      return [saved]
    },
    get() { return this.request && { ...this.request, lastSequence: events.length } },
    events: (_id, after = 0) => events.filter(event => event.sequence > after),
    text: () => events.filter(event => event.kind === 'text').map(event => event.text).join(''),
    activeFor() { return this.request?.status === 'active' ? this.request.requestId : undefined },
  }
  const runtime = {
    async prepare() {
      return { selection: { provider: 'test', model: 'fixture' }, async start(run) {
        await run.emit({ kind: 'text', part: 'p', text: 'Browser connected' })
        return { status: 'completed' }
      } }
    },
  }
  const host = await startHost({ requests: { store, runtime }, readHistory: async id => messages.get(id) ?? [] })
  t.after(() => host.close())
  const client = new HostClient(host.origin, host.token)
  const accepted = await client.send({ sessionId: 'browser-test', input: 'Hello' })
  const received = []
  for await (const value of client.watch(accepted.requestId)) received.push(value)
  assert.deepEqual(received.map(event => event.kind), ['status', 'text', 'status'])
  assert.equal(received.at(-1).status, 'completed')
  assert.deepEqual(await client.history('browser-test'), [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Browser connected' },
  ])
  const snapshot = await client.snapshot(accepted.requestId)
  assert.deepEqual([snapshot.status, snapshot.text], ['completed', 'Browser connected'])
  await assert.rejects(new HostClient(host.origin, 'wrong').history('browser-test'), /AUTH_REQUIRED/)
})

test('client reads fragmented UTF-8 event frames, skips repeats below its cursor and rejects malformed events', async t => {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    const frames = req.url.includes('malformed')
      ? [{ requestId: 'malformed', sequence: 1, timestamp: 't', kind: 'status', status: 'done' }]
      : [
          { requestId: 'mock', sequence: 1, timestamp: 't', kind: 'status', status: 'active' },
          { requestId: 'mock', sequence: 2, timestamp: 't', kind: 'text', part: 'p', text: 'Xin chào 🌿' },
          { requestId: 'mock', sequence: 2, timestamp: 't', kind: 'text', part: 'p', text: 'Xin chào 🌿' },
          { requestId: 'mock', sequence: 3, timestamp: 't', kind: 'status', status: 'completed' },
        ]
    const bytes = Buffer.from(`: heartbeat\n\n${frames.map(value => `id: ${value.sequence}\nevent: request\ndata: ${JSON.stringify(value)}\n\n`).join('')}`)
    // Split inside a multibyte character, not just between complete frames.
    const split = Math.max(1, bytes.indexOf(Buffer.from('🌿')) + 2)
    res.write(bytes.subarray(0, split))
    setImmediate(() => res.end(bytes.subarray(split)))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }))
  const client = new HostClient(`http://127.0.0.1:${server.address().port}`, 'fixture-token')
  const received = []
  for await (const value of client.watch('mock')) received.push(value)
  assert.deepEqual(received.map(event => event.sequence), [1, 2, 3])
  assert.equal(received[1].text, 'Xin chào 🌿')
  await assert.rejects(async () => {
    for await (const _value of client.watch('malformed')) {
      /* Invalid wire data must reject before yielding. */
    }
  }, /INVALID_RESPONSE/)
})
