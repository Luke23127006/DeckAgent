import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { DatabaseSync } from 'node:sqlite'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'

test('History summaries derive titles and timestamps from saved sessions without starting work', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-history-summary-'))
  const store = new SqliteSessionStore(join(dir, 'db', 'sessions.sqlite'))
  const input = `  Tái chế\n${'nội dung '.repeat(12)}`
  await store.open('saved')
  await store.append('saved', [{ role: 'user', content: input }])
  const saved = await store.getInfo('saved')
  store.close()
  const app = await startLocalWeb({ dataDir: dir,
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
  assert.equal(summary.workspaceId, 'default', 'A chat saved before workspaces existed belongs to the default workspace')
  assert.equal(summary.readable, true)
  assert.deepEqual(await new HostClient(app.origin, app.token).history('saved'), [{ role: 'user', content: input }])
  const response = await fetch(`${app.origin}/api/sessions`, { method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' }, body: '{}' })
  assert.equal(response.status, 201)
  const created = await response.json()
  assert.equal(created.title, 'New chat')
})

test('empty Web opens Settings without a model and can create an empty chat; sending is refused', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-management-'))
  let app
  t.after(async () => {
    await app?.close()
    await rm(dir, { recursive: true, force: true })
  })
  app = await startLocalWeb({ dataDir: join(dir, 'data') })
  const headers = { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' }
  const settings = await fetch(`${app.origin}/api/settings`, { headers })
  assert.equal(settings.status, 200)
  assert.deepEqual((await settings.json()).providers, [])
  const created = await fetch(`${app.origin}/api/sessions`, { method: 'POST', headers, body: '{}' })
  assert.equal(created.status, 201)
  const session = await created.json()
  assert.equal(session.selection, undefined, 'A chat may exist without a selected model; none is chosen for it')
  const history = await fetch(`${app.origin}/api/sessions/${session.sessionId}/history`, { headers })
  assert.deepEqual(await history.json(), [])
  const denied = await fetch(`${app.origin}/api/requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId: session.sessionId, input: 'Hello' }),
  })
  assert.equal(denied.status, 503)
  assert.equal((await denied.json()).error.code, 'REQUESTS_UNAVAILABLE')
  assert.deepEqual(await (await fetch(`${app.origin}/api/sessions/${session.sessionId}/history`, { headers })).json(), [],
    'A refused request appends nothing to the conversation')
})

test('deleting an environment-bootstrapped provider persists across restart with the same startup options', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-provider-deletion-'))
  const options = {
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

test('settings persist encrypted keys, keep the chat selection across restart, and open for repair of a damaged key', {
  timeout: 30000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-model-snapshot-'))
  let app
  const server = createServer((_req, res) => { res.writeHead(500); res.end() })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(async () => {
    await app?.close()
    await new Promise(resolve => {
      server.close(resolve)
      server.closeAllConnections()
    })
    await rm(dir, { recursive: true, force: true })
  })
  const options = { dataDir: join(dir, 'data') }
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
  assert.equal(
    (await api(`sessions/${session.sessionId}/selection`, 'PUT', { provider: 'fixture', model: 'b' })).status,
    200,
  )
  assert.equal((await api('providers/fixture', 'PUT', { ...provider, key: 'fixture-key-two' })).status, 200)
  await app.close()
  const storedBytes = await readFile(join(dir, 'data', 'db', 'web.sqlite'))
  assert.equal(storedBytes.includes(Buffer.from('fixture-key-one')), false)
  assert.equal(storedBytes.includes(Buffer.from('fixture-key-two')), false)
  app = await startLocalWeb(options)
  const settings = (await api('settings')).data
  assert.equal(settings.providers[0].hasKey, true)
  assert.equal(JSON.stringify(settings).includes('fixture-key'), false)
  assert.equal((await api('sessions')).data[0].selection.model, 'b')
  await app.close()
  // Deliberately damaged on-disk credential fixture: Settings must still open for repair.
  const damaged = new DatabaseSync(join(dir, 'data', 'db', 'web.sqlite'))
  damaged
    .prepare("UPDATE providers SET payload=json_set(payload, '$.encryptedKey', 'not-a-dpapi-blob') WHERE id='fixture'")
    .run()
  damaged.close()
  app = await startLocalWeb(options)
  const unavailable = (await api('settings')).data.providers[0]
  assert.equal(unavailable.hasKey, true)
  assert.equal(unavailable.keyAvailable, false)
  assert.equal((await api('providers/fixture', 'PUT', { ...provider, models: [], key: 'fixture-key-two' })).status, 200)
  assert.equal((await api('settings')).data.providers[0].keyAvailable, true)
  assert.equal((await api('sessions')).data[0].selectable, false, 'A removed model leaves the chat with no selectable model')
  assert.equal((await api('providers/fixture', 'DELETE')).status, 200)
  assert.equal((await api('sessions')).data[0].selectable, false)
})

test('The interface theme is kept by the Host, so it survives a restart on a different port', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-theme-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const open = () => startLocalWeb({ dataDir: join(dir, 'data'), port: 0 })
  const call = (app, path, init = {}) => fetch(`${app.origin}${path}`, { ...init, headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' } })
  let app = await open()
  try {
    assert.deepEqual(await (await call(app, '/api/preferences')).json(), { theme: 'system' })
    assert.equal(await (await fetch(`${app.origin}/theme.js`)).text(), '', 'System theme sets nothing before first paint')
    for (const body of ['{"theme":"neon"}', '{"theme":"dark","extra":1}', '{}', '[]']) {
      const rejected = await call(app, '/api/preferences', { method: 'PUT', body })
      assert.equal(rejected.status, 400, body)
    }
    assert.equal((await call(app, '/api/preferences', { method: 'PUT', body: '{"theme":"dark"}' })).status, 200)
    assert.match(await (await fetch(`${app.origin}/theme.js`)).text(), /dataset\.theme='dark'/)
    assert.equal((await fetch(`${app.origin}/api/preferences`)).status, 401, 'Preferences need the Host token like every other API')
  } finally { await app.close() }
  app = await open()
  try {
    assert.deepEqual(await (await call(app, '/api/preferences')).json(), { theme: 'dark' })
    assert.match(await (await fetch(`${app.origin}/theme.js`)).text(), /dataset\.theme='dark'/)
    await call(app, '/api/preferences', { method: 'PUT', body: '{"theme":"system"}' })
    assert.equal(await (await fetch(`${app.origin}/theme.js`)).text(), '')
  } finally { await app.close() }
})

test('An existing web.sqlite without the preferences table is upgraded in place', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-theme-upgrade-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const options = { dataDir: join(dir, 'data'), port: 0 }
  await (await startLocalWeb(options)).close()
  const db = new DatabaseSync(join(dir, 'data', 'db', 'web.sqlite'))
  db.exec('DROP TABLE preferences')
  db.close()
  const app = await startLocalWeb(options)
  try {
    const response = await fetch(`${app.origin}/api/preferences`, { headers: { authorization: `Bearer ${app.token}` } })
    assert.deepEqual(await response.json(), { theme: 'system' })
  } finally { await app.close() }
})
