import assert from 'node:assert/strict'
import test from 'node:test'
import { request as httpRequest } from 'node:http'
import { AgentRuntime, MemorySessionStore } from '../packages/agent/runtime/lib/index.js'
import { startHost } from '../packages/host/api/lib/index.js'

test('a question keeps one request active; replies are bound, idempotent and Stop drains waiting work', async t => {
  const inputs = []
  let question
  let disposed = 0
  const host = await startHost({
    readHistory: async () => [],
    openAgent: async sessionId => ({ sessionId, status: 'idle', history: async () => [],
      question: () => question,
      send: async input => {
        inputs.push(input)
        question = { prompt: inputs.length === 1 ? 'Chủ đề của bạn?' : 'Đối tượng nghe?', options: ['Sinh viên', 'Đồng nghiệp'], allowSkip: true }
        return { status: 'completed', text: question.prompt, steps: 1 }
      }, dispose: async () => { disposed++ },
    }),
  })
  t.after(() => host.close())
  const headers = { authorization: `Bearer ${host.token}`, 'content-type': 'application/json' }
  const post = (path, value) => fetch(`${host.origin}/api/${path}`, { method: 'POST', headers, body: JSON.stringify(value) })
  const accepted = await (await post('requests', { sessionId: 'questions', input: 'Tạo bài trình bày' })).json()
  const get = () => fetch(`${host.origin}/api/requests/${accepted.requestId}`, { headers }).then(r => r.json())
  async function waiting() {
    for (let i = 0; i < 100; i++) {
      const value = await get()
      if (value.status !== 'running') return value
      await new Promise(resolve => setTimeout(resolve, 5))
    }
    throw new Error('Question not exposed')
  }
  const first = await waiting()
  assert.equal(first.status, 'awaiting_user')
  assert.equal(first.question.prompt, 'Chủ đề của bạn?')
  assert.deepEqual(inputs, ['Tạo bài trình bày'])
  assert.equal((await post('requests', { sessionId: 'questions', input: 'Another request' })).status, 409)
  const reply = { sessionId: 'questions', questionId: first.question.questionId, version: first.question.version,
    replyId: 'reply-one', answer: { type: 'text', text: 'Tái chế' } }
  const path = `requests/${accepted.requestId}/reply`
  assert.equal((await post(path, { ...reply, sessionId: 'other' })).status, 409)
  assert.equal((await post(path, reply)).status, 202)
  assert.equal((await post(path, reply)).status, 202)
  assert.equal((await post(path, { ...reply, answer: { type: 'text', text: 'Changed' } })).status, 409)
  const second = await waiting()
  assert.equal(second.status, 'awaiting_user')
  assert.equal(second.requestId, accepted.requestId)
  assert.notEqual(second.question.questionId, first.question.questionId)
  assert.deepEqual(inputs, ['Tạo bài trình bày', 'Tái chế'])
  assert.equal((await post(path, { ...reply, replyId: 'late' })).status, 409)
  await post(`requests/${accepted.requestId}/stop`, {})
  const final = await waiting()
  assert.equal(final.status, 'cancelled')
  assert.equal(disposed, 1)
  assert.equal((await post(path, { ...reply, replyId: 'after-stop' })).status, 409)
})

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
