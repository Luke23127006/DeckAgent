import assert from 'node:assert/strict'
import test from 'node:test'
import { request as httpRequest } from 'node:http'
import { AgentRuntime, MemorySessionStore } from '../packages/agent/runtime/lib/index.js'
import { startHost } from '../packages/host/api/lib/index.js'

test('HTTP request completes and SSE reconnect returns its final snapshot and history', async t => {
  const sessions = new MemorySessionStore()
  const runtime = new AgentRuntime({
    sessions,
    model: {
      async *stream() {
        yield { type: 'text-delta', text: 'Hello browser' }
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
  const headers = { authorization: `Bearer ${host.token}`, 'content-type': 'application/json' }
  const response = await fetch(`${host.origin}/api/requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId: 'chat-browser', input: 'Hello' }),
  })
  assert.equal(response.status, 202)
  const accepted = await response.json()
  const events = await fetch(`${host.origin}/api/requests/${accepted.requestId}/events`, { headers })
  const stream = await events.text()
  assert.match(stream, /event: snapshot/)
  assert.match(stream, /"status":"completed"/)
  assert.match(stream, /Hello browser/)
  const history = await fetch(`${host.origin}/api/sessions/chat-browser/history`, { headers })
  assert.deepEqual(await history.json(), [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hello browser' },
  ])
})

test('unauthenticated and cross-origin callers cannot submit requests; malformed input has no side effect', async t => {
  const sessions = new MemorySessionStore()
  const runtime = new AgentRuntime({
    sessions,
    model: {
      async *stream() {
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
  const headers = { authorization: `Bearer ${host.token}`, 'content-type': 'application/json' }
  for (const [extra, status] of [
    [{ authorization: '' }, 401],
    [{ origin: 'https://evil.example' }, 403],
    [{ 'sec-fetch-site': 'cross-site' }, 403],
  ]) {
    const response = await fetch(`${host.origin}/api/requests`, {
      method: 'POST',
      headers: { ...headers, ...extra },
      body: JSON.stringify({ sessionId: 'safe', input: 'Do work' }),
    })
    assert.equal(response.status, status, JSON.stringify(extra))
    assert.equal((await response.text()).includes(host.token), false)
  }
  // fetch rewrites Host; use raw HTTP to exercise DNS rebinding protection.
  const rebound = await new Promise((resolve, reject) => {
    const request = httpRequest(
      `${host.origin}/api/requests`,
      { headers: { host: 'evil.example', authorization: headers.authorization } },
      response => {
        response.resume()
        resolve(response.statusCode)
      },
    )
    request.on('error', reject)
    request.end()
  })
  assert.equal(rebound, 403)
  for (const body of [
    'null',
    '{',
    JSON.stringify({ sessionId: '../unsafe', input: 'work' }),
    JSON.stringify({ sessionId: 'safe', input: 'work', tools: ['write_file'] }),
  ]) {
    const response = await fetch(`${host.origin}/api/requests`, { method: 'POST', headers, body })
    assert.equal(response.status, 400)
  }
  const oversized = await fetch(`${host.origin}/api/requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId: 'safe', input: 'x'.repeat(22000) }),
  })
  assert.equal(oversized.status, 413)
  await assert.rejects(sessions.read('safe'), { code: 'SESSION_NOT_FOUND' })
})

test('failed admission and storage errors are safe, and cleanup drains a pending open', async t => {
  let release
  let opened
  let disposed = false
  const pending = new Promise(resolve => {
    release = resolve
  })
  const opening = new Promise(resolve => {
    opened = resolve
  })
  const host = await startHost({
    async openAgent() {
      opened()
      await pending
      return {
        async send() {
          throw new Error('private-key-value')
        },
        async dispose() {
          disposed = true
        },
      }
    },
    async readHistory() {
      throw new Error('private-key-value')
    },
  })
  t.after(async () => {
    release()
    await host.close()
  })
  const headers = { authorization: `Bearer ${host.token}`, 'content-type': 'application/json' }
  const history = await fetch(`${host.origin}/api/sessions/test/history`, { headers })
  assert.equal(history.status, 500)
  assert.equal((await history.text()).includes('private-key-value'), false)
  const request = fetch(`${host.origin}/api/requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId: 'test', input: 'Hello' }),
  })
  // Network close may reject the pending submit; shutdown owns its execution, not its socket.
  const settled = request.then(
    () => undefined,
    () => undefined,
  )
  await opening
  const closing = host.close()
  release()
  await closing
  await settled
  assert.equal(disposed, true)
})

test('disconnect keeps work running, duplicates are rejected, and Host shutdown drains active work', async t => {
  let release
  const ready = new Promise(resolve => {
    release = resolve
  })
  const sessions = new MemorySessionStore()
  const runtime = new AgentRuntime({
    sessions,
    model: {
      async *stream(request) {
        yield { type: 'text-delta', text: 'retained' }
        await Promise.race([
          ready,
          new Promise(resolve => request.signal.addEventListener('abort', resolve, { once: true })),
        ])
        if (request.signal.aborted) request.signal.throwIfAborted()
        yield { type: 'finish', reason: 'stop' }
      },
    },
  })
  const host = await startHost({
    openAgent: id => runtime.createAgent({ sessionId: id, selection: { provider: 'test', model: 'fixture' } }),
    readHistory: id => sessions.read(id),
  })
  t.after(async () => {
    release()
    await host.close()
    await runtime.dispose()
  })
  const headers = { authorization: `Bearer ${host.token}`, 'content-type': 'application/json' }
  const submit = () =>
    fetch(`${host.origin}/api/requests`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sessionId: 'busy', input: 'Hello' }),
    })
  const accepted = await (await submit()).json()
  const abort = new AbortController()
  const events = await fetch(`${host.origin}/api/requests/${accepted.requestId}/events`, {
    headers,
    signal: abort.signal,
  })
  await events.body.getReader().read()
  abort.abort()
  assert.equal((await submit()).status, 409)
  const running = await (await fetch(`${host.origin}/api/requests/${accepted.requestId}`, { headers })).json()
  assert.equal(running.status, 'running')
  await host.close()
  const history = await sessions.read('busy')
  assert.equal(history.at(-1).content, 'retained')
  assert.equal(history.at(-1).interrupted, true)
  await host.close()
})
