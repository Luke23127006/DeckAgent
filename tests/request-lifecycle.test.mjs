import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { SessionError, SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import { HttpError, startHost } from '../packages/host/api/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'

const selection = { provider: 'fixture', model: 'model-a' }

async function storeFixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-requests-'))
  const store = new SqliteSessionStore(join(dir, 'sessions.sqlite'))
  const open = [store]
  // Every store closes before the folder goes (Windows keeps open files locked).
  t.after(async () => { for (const item of open) item.close(); await rm(dir, { recursive: true, force: true }) })
  return { dir, store, track: item => { open.push(item); return item } }
}

test('admission saves the user message and the active request together; a chat has one active request', async t => {
  const { store } = await storeFixture(t)
  const chat = await store.create('default')
  const other = await store.create('default')
  const admitted = store.requests.admit({ requestId: 'req-1', sessionId: chat.sessionId, input: 'Hello', selection })
  assert.equal(admitted.status, 'active')
  assert.equal(admitted.historyStart, 0)
  assert.deepEqual(await store.read(chat.sessionId), [{ role: 'user', content: 'Hello' }])
  assert.deepEqual(store.requests.events('req-1').map(event => [event.sequence, event.kind]), [[1, 'status']])
  assert.throws(() => store.requests.admit({ requestId: 'req-2', sessionId: chat.sessionId, input: 'Again', selection }),
    error => error instanceof SessionError && error.code === 'REQUEST_ACTIVE')
  assert.deepEqual(await store.read(chat.sessionId), [{ role: 'user', content: 'Hello' }], 'A refused admission adds no message')
  // Another chat runs independently.
  store.requests.admit({ requestId: 'req-3', sessionId: other.sessionId, input: 'Other', selection })
  assert.equal(store.requests.activeFor(other.sessionId), 'req-3')
  assert.throws(() => store.requests.admit({ requestId: 'req-4', sessionId: 'chat-missing', input: 'x', selection }),
    error => error instanceof SessionError && error.code === 'SESSION_NOT_FOUND')
})

test('events are ordered; finish settles running activities, keeps the text once, and refuses later writes', async t => {
  const { store } = await storeFixture(t)
  const chat = await store.create('default')
  store.requests.admit({ requestId: 'req-1', sessionId: chat.sessionId, input: 'Hi', selection })
  store.requests.append('req-1', { kind: 'activity', id: 'model-1', label: 'Model response', type: 'model', status: 'running' })
  store.requests.append('req-1', { kind: 'text', part: 'p1', text: 'Hel' })
  store.requests.append('req-1', { kind: 'text', part: 'p1', text: 'Hello there' })
  store.requests.append('req-1', { kind: 'activity', id: 'tool-1', label: 'read', type: 'tool', status: 'failed' })
  assert.equal(store.requests.text('req-1'), 'Hello there', 'A repeated part replaces itself instead of doubling')
  assert.throws(() => store.requests.append('req-1', { kind: 'status', status: 'completed' }))
  assert.throws(() => store.requests.append('req-1', { kind: 'text', part: 'p1', text: 'x', extra: 1 }),
    error => error instanceof SessionError && error.code === 'REQUEST_EVENT')
  const written = store.requests.finish('req-1', 'stopped')
  assert.deepEqual(written.map(event => event.kind === 'activity' ? `${event.id}:${event.status}` : `${event.kind}:${event.status}`),
    ['model-1:stopped', 'status:stopped'])
  assert.equal(store.requests.finish('req-1', 'completed'), undefined, 'A request ends once')
  assert.throws(() => store.requests.append('req-1', { kind: 'text', part: 'p2', text: 'late' }),
    error => error instanceof SessionError && error.code === 'REQUEST_CLOSED')
  const sequences = store.requests.events('req-1').map(event => event.sequence)
  assert.deepEqual(sequences, sequences.map((_, index) => index + 1))
  assert.deepEqual(store.requests.events('req-1', 5).map(event => event.sequence), [6, 7], 'A cursor returns only later events')
  assert.deepEqual(await store.read(chat.sessionId), [
    { role: 'user', content: 'Hi' },
    { role: 'assistant', content: 'Hello there', interrupted: true },
  ])
  assert.deepEqual(store.requests.activities(chat.sessionId).map(item => [item.id, item.status, item.sequence]),
    [['model-1', 'stopped', 2], ['tool-1', 'failed', 5]], 'Activities keep the order they started in')
  assert.equal(store.requests.get('req-1').status, 'stopped')
  assert.equal(store.requests.activeFor(chat.sessionId), undefined)
})

test('Host start marks requests left active as interrupted, keeps their text, and starts nothing', async t => {
  const { dir, store, track } = await storeFixture(t)
  const chat = await store.create('default')
  store.requests.admit({ requestId: 'req-1', sessionId: chat.sessionId, input: 'Hi', selection })
  store.requests.append('req-1', { kind: 'activity', id: 'model-1', label: 'Model response', type: 'model', status: 'running' })
  store.requests.append('req-1', { kind: 'text', part: 'p1', text: 'Half an answer' })
  store.close()
  const reopened = track(new SqliteSessionStore(join(dir, 'sessions.sqlite')))
  assert.equal(reopened.requests.interruptActive(), 1)
  assert.equal(reopened.requests.interruptActive(), 0)
  const request = reopened.requests.get('req-1')
  assert.equal(request.status, 'interrupted')
  assert.equal(request.errorCode, 'HOST_RESTARTED')
  assert.deepEqual(reopened.requests.activities(chat.sessionId).map(item => item.status), ['failed'])
  assert.deepEqual((await reopened.read(chat.sessionId)).at(-1), { role: 'assistant', content: 'Half an answer', interrupted: true })
})

test('native session binding only follows a completed request of the same chat', async t => {
  const { store } = await storeFixture(t)
  const chat = await store.create('default')
  const other = await store.create('default')
  store.requests.admit({ requestId: 'req-1', sessionId: chat.sessionId, input: 'Hi', selection })
  const binding = { sessionId: chat.sessionId, nativeSessionId: 'ses_abc', selection, context: 'ctx', lastRequestId: 'req-1' }
  assert.throws(() => store.requests.bind(binding), error => error.code === 'SESSION_CONFLICT', 'Not before completion')
  store.requests.finish('req-1', 'completed')
  assert.throws(() => store.requests.bind({ ...binding, sessionId: other.sessionId }), error => error.code === 'SESSION_CONFLICT')
  store.requests.bind(binding)
  assert.deepEqual(store.requests.binding(chat.sessionId), binding)
  assert.equal(store.requests.binding(other.sessionId), undefined)
  store.requests.unbind(chat.sessionId)
  assert.equal(store.requests.binding(chat.sessionId), undefined)
})

test('schema v2 files gain request tables in place; removed models leave chats with no selection', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-schema-v3-'))
  let store
  t.after(async () => { store?.close(); await rm(dir, { recursive: true, force: true }) })
  const path = join(dir, 'sessions.sqlite')
  const db = new DatabaseSync(path)
  db.exec(`CREATE TABLE sessions (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, provider TEXT, model TEXT, workspace_id TEXT,
      CHECK ((provider IS NULL AND model IS NULL) OR (provider IS NOT NULL AND model IS NOT NULL))) STRICT;
    CREATE TABLE messages (session_id TEXT NOT NULL REFERENCES sessions(id), sequence INTEGER NOT NULL CHECK (sequence > 0), payload TEXT NOT NULL,
      PRIMARY KEY (session_id, sequence)) STRICT;
    CREATE INDEX sessions_workspace ON sessions(workspace_id);
    INSERT INTO sessions VALUES ('old', '2026-01-01', '2026-01-01', 'fixture', 'model-a', 'default');
    INSERT INTO sessions VALUES ('kept', '2026-01-01', '2026-01-01', 'fixture', 'model-b', 'default');
    PRAGMA application_id = ${0x44414754}; PRAGMA user_version = 2;`)
  db.close()
  store = new SqliteSessionStore(path)
  assert.deepEqual((await store.getInfo('old')).selection, selection)
  assert.deepEqual(await store.clearSelections('fixture', ['model-a']), ['old'])
  const info = await store.getInfo('old')
  assert.equal(info.selection, undefined)
  assert.deepEqual(info.removedSelection, selection)
  assert.deepEqual((await store.getInfo('kept')).selection, { provider: 'fixture', model: 'model-b' })
  await store.select('old', { provider: 'fixture', model: 'model-b' })
  assert.equal((await store.getInfo('old')).removedSelection, undefined)
})

/** A Host request store over the real persistence, and a runtime the test controls. */
async function hostFixture(t, start) {
  const { store } = await storeFixture(t)
  const chats = [await store.create('default'), await store.create('default')]
  const runtime = {
    prepared: 0,
    async prepare(request) {
      runtime.prepared++
      if (request.input === 'no model') throw new HttpError(409, 'NO_SELECTABLE_MODEL', { reason: 'no-selection' })
      return { selection, start: run => start(run, request) }
    },
  }
  const host = await startHost({ requests: { store: store.requests, runtime }, readHistory: id => store.read(id) })
  t.after(() => host.close())
  const client = new HostClient(host.origin, host.token)
  return { store, chats, host, client, runtime }
}

async function collect(client, id, after = 0) {
  const events = []
  for await (const event of client.watch(id, undefined, after)) events.push(event)
  return events
}

test('Host persists before publishing, replays by cursor, and the runtime alone never decides completion', async t => {
  let release
  const gate = new Promise(resolve => { release = resolve })
  const { client, chats, store } = await hostFixture(t, async run => {
    await run.emit({ kind: 'activity', id: 'model-1', label: 'Model response', type: 'model', status: 'running' })
    // Every published event is already saved.
    assert.equal(store.requests.events(run.requestId).at(-1).kind, 'activity')
    await run.emit({ kind: 'text', part: 'p', text: 'Hello' })
    await gate
    await run.emit({ kind: 'activity', id: 'model-1', label: 'Model response', type: 'model', status: 'completed' })
    return { status: 'completed' }
  })
  const accepted = await client.send({ sessionId: chats[0].sessionId, input: 'Hi' })
  assert.equal(accepted.status, 'active')
  await assert.rejects(client.send({ sessionId: chats[0].sessionId, input: 'Second' }), error => error.message === 'SESSION_BUSY')
  // A reader that drops after two events reconnects at its cursor and gets the rest once.
  const first = []
  for await (const event of client.watch(accepted.requestId)) { first.push(event); if (first.length === 2) break }
  release()
  const rest = await collect(client, accepted.requestId, first.at(-1).sequence)
  const all = [...first, ...rest]
  assert.deepEqual(all.map(event => event.sequence), all.map((_, index) => index + 1), 'No gap and no repeat')
  assert.deepEqual(all.at(-1), { ...all.at(-1), kind: 'status', status: 'completed' })
  const snapshot = await client.snapshot(accepted.requestId)
  assert.equal(snapshot.status, 'completed')
  assert.equal(snapshot.text, 'Hello')
  assert.deepEqual(await client.history(chats[0].sessionId), [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }])
  // A finished stream replays everything and ends.
  assert.equal((await collect(client, accepted.requestId)).length, all.length)
})

test('Stop ends a silent runtime at once, refuses its late writes, and the chat accepts the next request', async t => {
  let lateWrite
  const { client, chats, store } = await hostFixture(t, async (run, request) => {
    if (request.input !== 'hang') return { status: 'completed' }
    await run.emit({ kind: 'text', part: 'p', text: 'Done part' })
    // Sends nothing more and ignores the abort for a while, like a hung provider.
    await new Promise(resolve => setTimeout(resolve, 300))
    lateWrite = run.emit({ kind: 'text', part: 'late', text: 'late' }).then(() => 'accepted', () => 'refused')
    return { status: 'completed' }
  })
  const accepted = await client.send({ sessionId: chats[0].sessionId, input: 'hang' })
  await new Promise(resolve => setTimeout(resolve, 50))
  const started = Date.now()
  const stopped = await client.stop(accepted.requestId)
  assert.equal(stopped.status, 'stopped')
  assert.ok(Date.now() - started < 1000, 'Stop shows its effect without waiting for the runtime')
  assert.equal((await client.stop(accepted.requestId)).status, 'stopped', 'Stop is idempotent')
  const next = await client.send({ sessionId: chats[0].sessionId, input: 'after' })
  assert.equal(await lateWrite, 'refused')
  assert.equal(store.requests.get(accepted.requestId).status, 'stopped', 'A runtime "completed" after Stop changes nothing')
  assert.equal(store.requests.text(accepted.requestId), 'Done part')
  await collect(client, next.requestId)
  assert.deepEqual((await client.history(chats[0].sessionId)).map(message => [message.role, message.interrupted ?? false]),
    [['user', false], ['assistant', true], ['user', false]])
})

test('failure, refused admission, two chats in parallel and Host shutdown', async t => {
  const { client, chats, host, store, runtime } = await hostFixture(t, async (run, request) => {
    if (request.input === 'fail') return { status: 'failed', errorCode: 'PROVIDER_AUTH' }
    if (request.input === 'throw') throw new Error('raw provider text with sk-secret')
    await new Promise(resolve => run.signal.addEventListener('abort', resolve))
    return { status: 'failed', errorCode: 'STOPPED' }
  })
  await assert.rejects(client.send({ sessionId: chats[0].sessionId, input: 'no model' }),
    error => error.message === 'NO_SELECTABLE_MODEL' && error.detail.reason === 'no-selection')
  assert.deepEqual(await client.history(chats[0].sessionId), [], 'A refused request adds nothing to the chat')
  const failed = await client.send({ sessionId: chats[0].sessionId, input: 'fail' })
  const failure = (await collect(client, failed.requestId)).at(-1)
  assert.equal(failure.status, 'failed')
  assert.equal(failure.errorCode, 'PROVIDER_AUTH')
  const thrown = await client.send({ sessionId: chats[0].sessionId, input: 'throw' })
  const last = (await collect(client, thrown.requestId)).at(-1)
  assert.equal(last.errorCode, 'RUNTIME_FAILED')
  assert.equal(JSON.stringify(store.requests.events(thrown.requestId)).includes('sk-secret'), false)
  const a = await client.send({ sessionId: chats[0].sessionId, input: 'wait' })
  const b = await client.send({ sessionId: chats[1].sessionId, input: 'wait' })
  assert.notEqual(a.requestId, b.requestId)
  assert.equal(runtime.prepared, 5)
  await host.close()
  for (const id of [a.requestId, b.requestId]) {
    assert.equal(store.requests.get(id).status, 'interrupted')
    assert.equal(store.requests.get(id).errorCode, 'HOST_STOPPED')
  }
})

test('without a runtime the Host refuses requests and saves nothing', async t => {
  const { store } = await storeFixture(t)
  const chat = await store.create('default')
  const host = await startHost({ readHistory: id => store.read(id) })
  t.after(() => host.close())
  const response = await fetch(`${host.origin}/api/requests`, { method: 'POST',
    headers: { authorization: `Bearer ${host.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: chat.sessionId, input: 'Hi' }) })
  assert.equal(response.status, 503)
  assert.equal((await response.json()).error.code, 'REQUESTS_UNAVAILABLE')
  assert.deepEqual(await store.read(chat.sessionId), [])
})

test('request input is validated before admission', async t => {
  const { host, chats } = await hostFixture(t, async () => ({ status: 'completed' }))
  const post = body => fetch(`${host.origin}/api/requests`, { method: 'POST',
    headers: { authorization: `Bearer ${host.token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal((await post({ sessionId: chats[0].sessionId, input: ' ' })).status, 400)
  assert.equal((await post({ sessionId: chats[0].sessionId, input: 'x', presentation: true })).status, 400)
  const long = await post({ sessionId: chats[0].sessionId, input: 'x'.repeat(16001) })
  assert.equal(long.status, 413)
  assert.equal((await long.json()).error.code, 'REQUEST_TEXT_TOO_LONG')
  const bad = await fetch(`${host.origin}/api/requests/req-x/events`, { headers: { authorization: `Bearer ${host.token}`, 'last-event-id': 'abc' } })
  assert.equal(bad.status, 404)
})
