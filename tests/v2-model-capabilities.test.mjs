import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'

test('schema 2 sessions acquire optional reasoning without changing old messages or selection', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-selection-migration-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const path = join(dir, 'sessions.sqlite')
  const old = new DatabaseSync(path)
  old.exec(`CREATE TABLE sessions (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    provider TEXT, model TEXT, workspace_id TEXT DEFAULT 'default',
    CHECK ((provider IS NULL AND model IS NULL) OR (provider IS NOT NULL AND model IS NOT NULL))) STRICT;
    CREATE TABLE messages (session_id TEXT NOT NULL REFERENCES sessions(id), sequence INTEGER NOT NULL CHECK (sequence > 0),
    payload TEXT NOT NULL, PRIMARY KEY (session_id, sequence)) STRICT;
    INSERT INTO sessions VALUES ('old-chat','2026-01-01','2026-01-01','custom','old-model','default');
    INSERT INTO messages VALUES ('old-chat',1,'{"role":"user","content":"Keep me"}');
    PRAGMA application_id = 1145128788; PRAGMA user_version = 2;`)
  old.close()
  const store = new SqliteSessionStore(path)
  assert.deepEqual((await store.getInfo('old-chat')).selection, { provider: 'custom', model: 'old-model' })
  assert.deepEqual(await store.read('old-chat'), [{ role: 'user', content: 'Keep me' }])
  await store.select('old-chat', { provider: 'custom', model: 'old-model', reasoningLevel: 'Deep' })
  store.close()
  const reopened = new SqliteSessionStore(path)
  assert.deepEqual((await reopened.getInfo('old-chat')).selection, {
    provider: 'custom',
    model: 'old-model',
    reasoningLevel: 'Deep',
  })
  assert.deepEqual(await reopened.read('old-chat'), [{ role: 'user', content: 'Keep me' }])
  reopened.close()
})

test('saved model descriptors stay optional, survive restart, and gate reasoning per model', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-capabilities-'))
  let app = await startLocalWeb({ dataDir: dir })
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', value) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    return { status: response.status, data: await response.json() }
  }
  const base = {
    displayName: 'Custom',
    protocol: 'responses',
    baseUrl: 'http://127.0.0.1:9',
    models: ['known', 'manual'],
  }
  const descriptor = {
    provider: 'custom',
    model: 'known',
    displayName: 'Known model',
    contextWindow: 1000,
    maxOutputTokens: 100,
    inputModalities: ['text'],
    reasoningOptions: [{ label: 'Deep', apiValue: 'high' }],
  }
  assert.equal((await api('providers/custom', 'PUT', { ...base, modelMetadata: [descriptor] })).status, 200)
  assert.equal((await api('providers/custom', 'PUT', base)).status, 200, 'An older Settings client may omit metadata')
  assert.equal(
    (await api('providers/custom', 'PUT', { ...base, modelMetadata: [{ ...descriptor, maxOutputTokens: 2000 }] })).data
      .error.code,
    'INVALID_MODEL_METADATA',
  )
  assert.equal(
    (
      await api('providers/custom', 'PUT', {
        ...base,
        modelMetadata: [{ ...descriptor, maxOutputTokens: 2_147_483_648 }],
      })
    ).data.error.code,
    'INVALID_MODEL_METADATA',
  )
  let settings = (await api('settings')).data.providers[0]
  assert.deepEqual(settings.modelMetadata, [descriptor])
  assert.deepEqual(settings.models, ['known', 'manual'])
  assert.equal(
    (await api('sessions', 'POST', { selection: { provider: 'custom', model: 'manual', reasoningLevel: 'Deep' } }))
      .status,
    409,
  )
  const session = (
    await api('sessions', 'POST', { selection: { provider: 'custom', model: 'known', reasoningLevel: 'Deep' } })
  ).data
  assert.deepEqual(session.selection, { provider: 'custom', model: 'known', reasoningLevel: 'Deep' })
  assert.equal(
    (await api(`sessions/${session.sessionId}/selection`, 'PUT', { provider: 'custom', model: 'manual' })).status,
    200,
  )
  await app.close()
  app = await startLocalWeb({ dataDir: dir })
  settings = (await api('settings')).data.providers[0]
  assert.deepEqual(settings.modelMetadata, [descriptor])
  assert.deepEqual((await api('sessions')).data[0].selection, { provider: 'custom', model: 'manual' })
  assert.equal(
    (await api('providers/custom', 'PUT', { ...base, modelMetadata: [descriptor], models: ['known'] })).status,
    200,
  )
  assert.equal((await api('sessions')).data[0].selection, undefined, 'Removing a model clears its Chat selection')
  assert.equal(
    (
      await api(`sessions/${session.sessionId}/selection`, 'PUT', {
        provider: 'custom',
        model: 'known',
        reasoningLevel: 'Deep',
      })
    ).status,
    200,
  )
  assert.equal(
    (
      await api('providers/custom', 'PUT', {
        ...base,
        models: ['known'],
        modelMetadata: [{ provider: 'custom', model: 'known', displayName: 'Known model' }],
      })
    ).status,
    200,
  )
  assert.deepEqual(
    (await api('sessions')).data[0].selection,
    { provider: 'custom', model: 'known' },
    'Removing an effort clears only that choice',
  )
  assert.equal((await api('providers/custom', 'DELETE')).status, 200)
  assert.equal((await api('sessions')).data[0].selection, undefined, 'Deleting a provider clears its Chat selection')
})

test('Responses request captures effort and endpoint while later model edits affect only later turns', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-effort-snapshot-'))
  const calls = []
  let release
  let entered
  const hold = new Promise(resolve => {
    release = resolve
  })
  const started = new Promise(resolve => {
    entered = resolve
  })
  const server = createServer(async (request, response) => {
    let raw = ''
    for await (const chunk of request) raw += chunk
    calls.push(JSON.parse(raw))
    if (calls.length === 1) {
      entered()
      await hold
    }
    response.writeHead(200, { 'content-type': 'text/event-stream' })
    response.end(
      'data: {"type":"response.output_text.delta","delta":"OK"}\n\ndata: {"type":"response.completed","response":{"status":"completed"}}\n\n',
    )
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const app = await startLocalWeb({ dataDir: dir })
  t.after(async () => {
    release()
    await app.close()
    server.closeAllConnections()
    server.close()
    await rm(dir, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', value) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    return { status: response.status, data: await response.json() }
  }
  const provider = {
    displayName: 'Custom',
    protocol: 'responses',
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    models: ['model-x'],
    modelMetadata: [{ provider: 'custom', model: 'model-x', reasoningOptions: [{ label: 'Deep', apiValue: 'high' }] }],
  }
  assert.equal((await api('providers/custom', 'PUT', provider)).status, 200)
  const session = (
    await api('sessions', 'POST', { selection: { provider: 'custom', model: 'model-x', reasoningLevel: 'Deep' } })
  ).data
  const client = new HostClient(app.origin, app.token)
  const first = await client.send({ sessionId: session.sessionId, input: 'First' })
  await started
  assert.equal(
    (
      await api('providers/custom', 'PUT', {
        ...provider,
        modelMetadata: [
          {
            provider: 'custom',
            model: 'model-x',
            reasoningOptions: [
              { label: 'Deep', apiValue: 'medium' },
              { label: 'Fast', apiValue: 'low' },
            ],
          },
        ],
      })
    ).status,
    200,
  )
  assert.equal(
    (
      await api(`sessions/${session.sessionId}/selection`, 'PUT', {
        provider: 'custom',
        model: 'model-x',
        reasoningLevel: 'Fast',
      })
    ).status,
    200,
  )
  release()
  for await (const _snapshot of client.watch(first.requestId)) {
  }
  const second = await client.send({ sessionId: session.sessionId, input: 'Second' })
  for await (const _snapshot of client.watch(second.requestId)) {
  }
  assert.equal(
    (
      await api(`sessions/${session.sessionId}/selection`, 'PUT', {
        provider: 'custom',
        model: 'model-x',
        reasoningLevel: 'Deep',
      })
    ).status,
    200,
  )
  const third = await client.send({ sessionId: session.sessionId, input: 'Third' })
  for await (const _snapshot of client.watch(third.requestId)) {
  }
  assert.deepEqual(
    calls.map(call => call.reasoning),
    [{ effort: 'high' }, { effort: 'low' }, { effort: 'medium' }],
  )
  assert.deepEqual(
    (await api(`sessions/${session.sessionId}/requests`)).data.map(row => row.selection.reasoningLevel),
    ['Deep', 'Fast', 'Deep'],
  )
})
