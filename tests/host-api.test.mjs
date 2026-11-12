import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { request as httpRequest } from 'node:http'
import { startHost } from '../packages/host/api/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'

// B02: the Host owns admission, events, Stop and terminal status (ADR-0004). The legacy question/reply case and the
// openAgent lock case were replaced; lifecycle details are checked in request-lifecycle.test.mjs.

async function fixture(t, start) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-host-api-'))
  const store = new SqliteSessionStore(join(dir, 'sessions.sqlite'))
  let host
  t.after(async () => { await host?.close(); store.close(); await rm(dir, { recursive: true, force: true }) })
  const runtime = { opened: 0, async prepare() { runtime.opened++; return { selection: { provider: 'test', model: 'fixture' }, start } } }
  host = await startHost({ requests: { store: store.requests, runtime }, readHistory: id => store.read(id) })
  const chat = await store.create('default')
  return { host, store, runtime, chat, headers: { authorization: `Bearer ${host.token}`, 'content-type': 'application/json' } }
}

test('unauthenticated and cross-origin callers cannot submit requests; malformed input has no side effect', async t => {
  const { host, store, runtime, chat, headers } = await fixture(t, async () => ({ status: 'completed' }))
  for (const [extra, status] of [[{ authorization: '' }, 401], [{ origin: 'https://evil.example' }, 403], [{ 'sec-fetch-site': 'cross-site' }, 403]]) {
    const response = await fetch(`${host.origin}/api/requests`, { method: 'POST', headers: { ...headers, ...extra },
      body: JSON.stringify({ sessionId: chat.sessionId, input: 'Do work' }) })
    assert.equal(response.status, status, JSON.stringify(extra))
    assert.equal((await response.text()).includes(host.token), false)
  }
  // fetch rewrites Host; use raw HTTP to exercise DNS rebinding protection.
  const rebound = await new Promise((resolve, reject) => {
    const request = httpRequest(`${host.origin}/api/requests`, { headers: { host: 'evil.example', authorization: headers.authorization } }, response => {
      response.resume()
      resolve(response.statusCode)
    })
    request.on('error', reject)
    request.end()
  })
  assert.equal(rebound, 403)
  for (const body of ['null', '{', JSON.stringify({ sessionId: '../unsafe', input: 'work' }),
    JSON.stringify({ sessionId: chat.sessionId, input: 'work', tools: ['write_file'] })]) {
    const response = await fetch(`${host.origin}/api/requests`, { method: 'POST', headers, body })
    assert.equal(response.status, 400)
  }
  const oversized = await fetch(`${host.origin}/api/requests`, { method: 'POST', headers,
    body: JSON.stringify({ sessionId: chat.sessionId, input: 'x'.repeat(22000) }) })
  assert.equal(oversized.status, 413)
  assert.equal(runtime.opened, 0)
  assert.deepEqual(await store.read(chat.sessionId), [])
})

test('storage and runtime errors are safe: no private text reaches the browser or the records', async t => {
  const { host, store, chat, headers } = await fixture(t, async () => { throw new Error('private-key-value') })
  const broken = await startHost({ readHistory: async () => { throw new Error('private-key-value') } })
  t.after(() => broken.close())
  const history = await fetch(`${broken.origin}/api/sessions/test/history`, { headers: { authorization: `Bearer ${broken.token}` } })
  assert.equal(history.status, 500)
  assert.equal((await history.text()).includes('private-key-value'), false)
  const accepted = await (await fetch(`${host.origin}/api/requests`, { method: 'POST', headers,
    body: JSON.stringify({ sessionId: chat.sessionId, input: 'Hello' }) })).json()
  const stream = await (await fetch(`${host.origin}/api/requests/${accepted.requestId}/events`, { headers })).text()
  assert.match(stream, /"status":"failed","errorCode":"RUNTIME_FAILED"/)
  assert.equal(stream.includes('private-key-value'), false)
  assert.equal(JSON.stringify(store.requests.events(accepted.requestId)).includes('private-key-value'), false)
  const missing = await fetch(`${host.origin}/api/requests/req-missing`, { headers })
  assert.equal(missing.status, 404)
})

test('disconnect keeps work running, a second request is refused, and Host shutdown leaves it not finished', async t => {
  let release
  const ready = new Promise(resolve => { release = resolve })
  const { host, store, chat, headers } = await fixture(t, async run => {
    await run.emit({ kind: 'text', part: 'p', text: 'retained' })
    await Promise.race([ready, new Promise(resolve => run.signal.addEventListener('abort', resolve, { once: true }))])
    return { status: 'completed' }
  })
  t.after(release)
  const submit = () => fetch(`${host.origin}/api/requests`, { method: 'POST', headers, body: JSON.stringify({ sessionId: chat.sessionId, input: 'Hello' }) })
  const accepted = await (await submit()).json()
  const abort = new AbortController()
  const events = await fetch(`${host.origin}/api/requests/${accepted.requestId}/events`, { headers, signal: abort.signal })
  await events.body.getReader().read()
  abort.abort()
  assert.equal((await submit()).status, 409)
  const running = await (await fetch(`${host.origin}/api/requests/${accepted.requestId}`, { headers })).json()
  assert.equal(running.status, 'active', 'A closed stream does not stop the request')
  await host.close()
  assert.equal(store.requests.get(accepted.requestId).status, 'interrupted')
  const history = await store.read(chat.sessionId)
  assert.deepEqual(history.at(-1), { role: 'assistant', content: 'retained', interrupted: true })
  await host.close()
})

test('without an Agent runtime the Host refuses every request and starts no work', async t => {
  const host = await startHost({ readHistory: async () => [] })
  t.after(() => host.close())
  const response = await fetch(`${host.origin}/api/requests`, {
    method: 'POST',
    headers: { authorization: `Bearer ${host.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId: 'chat', input: 'Hello' }),
  })
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: { code: 'REQUESTS_UNAVAILABLE', message: 'Request could not be completed' } })
})
