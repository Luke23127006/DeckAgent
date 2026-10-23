import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { HostClient, DeckClient } from '../packages/client/runtime/lib/index.js'
import { fork } from 'node:child_process'
import { DatabaseSync } from 'node:sqlite'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'

test('a killed Host turns a waiting request into unknown without replay and rejects old reply controls', { timeout: 15000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-waiting-recovery-'))
  const child = fork(new URL('./fixtures/waiting-web.mjs', import.meta.url), [dir], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] })
  const closed = once(child, 'exit')
  let app
  t.after(async () => { child.kill(); await closed; await app?.close(); await rm(dir, { recursive: true, force: true }) })
  const [waiting] = await Promise.race([once(child, 'message'), closed.then(() => { throw new Error('Waiting fixture exited') })])
  child.kill('SIGKILL')
  await closed
  let calls = 0
  app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'waiting' }, model: { async *stream() { calls++; yield { type: 'finish', reason: 'stop' } } } })
  const headers = { authorization: `Bearer ${app.token}` }
  const records = await (await fetch(`${app.origin}/api/sessions/waiting-chat/requests`, { headers })).json()
  assert.equal(records[0].status, 'unknown')
  assert.equal(records[0].question.questionId, waiting.question.questionId)
  const sessions = await (await fetch(`${app.origin}/api/sessions`, { headers })).json()
  assert.equal(sessions[0].activeRequestId, undefined)
  await assert.rejects(new HostClient(app.origin, app.token).reply(waiting.requestId, {
    sessionId: 'waiting-chat', questionId: waiting.question.questionId, version: waiting.question.version,
    replyId: 'old-button', answer: { type: 'option', index: 0 },
  }), /REQUEST_NOT_FOUND/)
  assert.equal(calls, 0)
})

test('History summaries derive titles and timestamps from saved sessions without starting work', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-history-summary-'))
  const store = new SqliteSessionStore(join(dir, 'sessions.sqlite'))
  const input = `  Tái chế\n${'nội dung '.repeat(12)}`
  await store.open('saved')
  await store.append('saved', [{ role: 'user', content: input }])
  const saved = await store.getInfo('saved')
  store.close()
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: dir,
    confirmedDecks: [{ sessionId: 'saved', outlineId: 'outline', slides: [{ slideId: 'one', title: 'Pending' }] }],
  })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const headers = { authorization: `Bearer ${app.token}` }
  const list = await (await fetch(`${app.origin}/api/sessions`, { headers })).json()
  const summary = list.find(session => session.sessionId === 'saved')
  assert.equal(summary.title, `${input.replace(/\s+/g, ' ').trim().slice(0, 64)}…`)
  assert.equal(summary.updatedAt, saved.updatedAt)
  assert.equal(summary.hasSlides, false, 'A pending plan must not count as published slides')
  assert.equal(summary.messageCount, 1)
  assert.deepEqual(await new HostClient(app.origin, app.token).history('saved'), [{ role: 'user', content: input }])
  const response = await fetch(`${app.origin}/api/sessions`, { method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' }, body: '{}' })
  assert.equal(response.status, 201)
  const created = await response.json()
  assert.equal(created.title, 'New chat')
})

test('empty Web opens Settings without a model and can create an empty chat without sending work', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-management-'))
  let app
  t.after(async () => {
    await app?.close()
    await rm(dir, { recursive: true, force: true })
  })
  app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data') })
  const headers = { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' }
  const settings = await fetch(`${app.origin}/api/settings`, { headers })
  assert.equal(settings.status, 200)
  assert.deepEqual((await settings.json()).providers, [])
  const created = await fetch(`${app.origin}/api/sessions`, { method: 'POST', headers, body: '{}' })
  assert.equal(created.status, 201)
  const session = await created.json()
  assert.equal(session.selection, undefined)
  const history = await fetch(`${app.origin}/api/sessions/${session.sessionId}/history`, { headers })
  assert.deepEqual(await history.json(), [])
  const denied = await fetch(`${app.origin}/api/requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId: session.sessionId, input: 'Hello' }),
  })
  assert.equal(denied.status, 409)
})

test('deleting an environment-bootstrapped provider persists across restart with the same startup options', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-provider-deletion-'))
  const options = {
    workspace: join(dir, 'workspace'),
    dataDir: join(dir, 'data'),
    selection: { provider: 'seeded', model: 'a' },
    connections: [{ id: 'seeded', protocol: 'chat-completions', baseUrl: 'http://127.0.0.1:1' }],
  }
  let app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const headers = { authorization: `Bearer ${app.token}` }
  assert.equal((await (await fetch(`${app.origin}/api/settings`, { headers })).json()).providers.length, 1)
  assert.equal((await fetch(`${app.origin}/api/providers/seeded`, { method: 'DELETE', headers })).status, 200)
  await app.close()
  app = await startLocalWeb(options)
  const settings = await (
    await fetch(`${app.origin}/api/settings`, { headers: { authorization: `Bearer ${app.token}` } })
  ).json()
  assert.deepEqual(settings.providers, [])
})

test('reopening Web after a killed Host preserves unconfirmed activity without replaying work', {
  timeout: 15000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-interrupted-web-'))
  let app
  const child = fork(new URL('./fixtures/interrupted-web.mjs', import.meta.url), [dir], {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    windowsHide: true,
  })
  const closed = once(child, 'exit')
  t.after(async () => {
    child.kill()
    await closed
    await app?.close()
    await rm(dir, { recursive: true, force: true })
  })
  await Promise.race([
    once(child, 'message'),
    closed.then(() => {
      throw new Error('Fixture exited before starting work')
    }),
  ])
  child.kill('SIGKILL')
  await closed
  let modelRequests = 0
  app = await startLocalWeb({
    workspace: join(dir, 'workspace'),
    dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'interrupted' },
    model: {
      async *stream() {
        modelRequests++
        yield { type: 'finish', reason: 'stop' }
      },
    },
  })
  const headers = { authorization: `Bearer ${app.token}` }
  const requests = await (await fetch(`${app.origin}/api/sessions/interrupted-chat/requests`, { headers })).json()
  const activities = await (await fetch(`${app.origin}/api/sessions/interrupted-chat/activities`, { headers })).json()
  assert.equal(requests[0].status, 'unknown')
  assert.equal(activities[0].status, 'unknown')
  assert.equal(modelRequests, 0)
  const decks = new DeckClient(app.origin, app.token)
  assert.deepEqual((await decks.snapshot('interrupted-chat')).slides.map(slide => [slide.slideId, slide.revision, slide.status]),
    [['saved', 1, 'published'], ['pending', 0, 'pending']])
  assert.equal((await decks.content('interrupted-chat', 'saved', 1)).html, '<h1>Durable before crash</h1>')
  assert.equal(modelRequests, 0, 'Reading a restored deck must not replay work')
  assert.equal(
    (await new HostClient(app.origin, app.token).history('interrupted-chat'))[0].content,
    'Work until the Host is killed',
  )
})

test('settings persist encrypted keys; changing selection/key during a request affects only later requests', {
  timeout: 30000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-model-snapshot-'))
  let app
  let release
  let started
  const entered = new Promise(resolve => {
    started = resolve
  })
  const hold = new Promise(resolve => {
    release = resolve
  })
  const received = []
  const server = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    const request = JSON.parse(body)
    received.push({ model: request.model, auth: req.headers.authorization })
    if (received.length === 1) {
      started()
      await hold
    }
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    res.end('data: {"choices":[{"index":0,"delta":{"content":"OK"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(async () => {
    release()
    await app?.close()
    await new Promise(resolve => {
      server.close(resolve)
      server.closeAllConnections()
    })
    await rm(dir, { recursive: true, force: true })
  })
  const options = { workspace: join(dir, 'workspace'), dataDir: join(dir, 'data') }
  app = await startLocalWeb(options)
  const api = async (path, method = 'GET', value) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    return { status: response.status, data: await response.json() }
  }
  const provider = {
    displayName: 'Local fixture',
    protocol: 'chat-completions',
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    models: ['a', 'b'],
    key: 'fixture-key-one',
  }
  assert.equal((await api('providers/fixture', 'PUT', provider)).status, 200)
  assert.equal(
    (await api('providers/fixture', 'PUT', { ...provider, key: undefined, baseUrl: 'http://127.0.0.1:1' })).data.error
      .code,
    'NEW_ENDPOINT_REQUIRES_KEY',
  )
  assert.equal((await api('providers/other', 'PUT', provider)).data.error.code, 'PROVIDER_NAME_EXISTS')
  assert.equal(
    (await api('providers/fixture', 'PUT', { ...provider, protocol: 'gemini' })).data.error.code,
    'PROTOCOL_IMMUTABLE',
  )
  const session = (await api('sessions', 'POST', { selection: { provider: 'fixture', model: 'a' } })).data
  let client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: session.sessionId, input: 'First' })
  await entered
  assert.equal((await api('providers/fixture', 'DELETE')).status, 409)
  assert.equal(
    (await api(`sessions/${session.sessionId}/selection`, 'PUT', { provider: 'fixture', model: 'b' })).status,
    200,
  )
  assert.equal((await api('providers/fixture', 'PUT', { ...provider, key: 'fixture-key-two' })).status, 200)
  assert.equal((await api(`sessions/${session.sessionId}/activities`)).data[0].status, 'running')
  release()
  for await (const _snapshot of client.watch(accepted.requestId)) {
    /* Wait for terminal result. */
  }
  await app.close()
  const storedBytes = await readFile(join(dir, 'data', 'web.sqlite'))
  assert.equal(storedBytes.includes(Buffer.from('fixture-key-one')), false)
  assert.equal(storedBytes.includes(Buffer.from('fixture-key-two')), false)
  app = await startLocalWeb(options)
  client = new HostClient(app.origin, app.token)
  const settings = (await api('settings')).data
  assert.equal(settings.providers[0].hasKey, true)
  assert.equal(JSON.stringify(settings).includes('fixture-key'), false)
  assert.equal((await api('sessions')).data[0].selection.model, 'b')
  assert.equal((await api(`sessions/${session.sessionId}/activities`)).data[0].status, 'completed')
  assert.deepEqual(
    (await api(`sessions/${session.sessionId}/requests`)).data.map(request => [
      request.selection.model,
      request.status,
    ]),
    [['a', 'completed']],
  )
  const second = await client.send({ sessionId: session.sessionId, input: 'Second' })
  for await (const _snapshot of client.watch(second.requestId)) {
    /* Wait for terminal result. */
  }
  assert.deepEqual(received, [
    { model: 'a', auth: 'Bearer fixture-key-one' },
    { model: 'b', auth: 'Bearer fixture-key-two' },
  ])
  assert.deepEqual((await api(`sessions/${session.sessionId}/requests`)).data.map(request => request.historyStart), [0, 2], 'Request records must keep exact conversation positions across restart')
  assert.equal((await client.history(session.sessionId)).length, 4)
  await app.close()
  // Deliberately damaged on-disk credential fixture: Settings must still open for repair.
  const damaged = new DatabaseSync(join(dir, 'data', 'web.sqlite'))
  damaged
    .prepare("UPDATE providers SET payload=json_set(payload, '$.encryptedKey', 'not-a-dpapi-blob') WHERE id='fixture'")
    .run()
  damaged.close()
  app = await startLocalWeb(options)
  client = new HostClient(app.origin, app.token)
  const unavailable = (await api('settings')).data.providers[0]
  assert.equal(unavailable.hasKey, true)
  assert.equal(unavailable.keyAvailable, false)
  assert.equal(
    (await api('requests', 'POST', { sessionId: session.sessionId, input: 'Repair first' })).data.error.code,
    'PROVIDER_CREDENTIALS',
  )
  assert.equal(
    (await client.history(session.sessionId)).length,
    4,
    'Unavailable credentials must be rejected before appending user history',
  )
  assert.equal((await api('providers/fixture', 'PUT', { ...provider, models: [], key: 'fixture-key-two' })).status, 200)
  assert.equal((await api('settings')).data.providers[0].keyAvailable, true)
  assert.equal((await api('sessions')).data[0].selectable, false)
  assert.equal((await api('requests', 'POST', { sessionId: session.sessionId, input: 'Do not send' })).status, 409)
  assert.equal(received.length, 2)
  assert.equal((await api('providers/fixture', 'DELETE')).status, 200)
  assert.equal((await api('sessions')).data[0].selectable, false)
  assert.equal((await client.history(session.sessionId)).length, 4)
})
