import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { ProviderStore } from '../apps/local-web/lib/types/provider-settings.js'
import { createServer } from 'node:http'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { openWireFixture, replyChat } from './fixtures/opencode-wire.mjs'

test('active Host request keeps captured model while settings and the next Chat selection change', {
  skip: process.env.DECKAGENT_OPENCODE_CLI_TESTS !== '1',
  timeout: 210000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-active-selection-'))
  let entered, release
  const started = new Promise(done => {
      entered = done
    }),
    released = new Promise(done => {
      release = done
    })
  const fixture = await openWireFixture('chat-completions', async (_body, res, index) => {
    if (index === 1) {
      entered()
      await released
    }
    replyChat(res, { text: `MODEL_REPLY_${index}` })
  })
  const app = await startLocalWeb({
    dataDir: join(root, 'data'),
    workspace: join(root, 'work'),
    openCode: {
      executable: resolve(
        process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
          '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
      ),
    },
    selection: { provider: 'custom', model: 'first' },
    connections: [{ id: 'custom', protocol: 'chat-completions', baseUrl: fixture.baseUrl }],
  })
  t.after(async () => {
    release()
    await app.close()
    await fixture.close()
    await rm(root, { recursive: true, force: true })
  })
  const client = new HostClient(app.origin, app.token)
  const first = await client.send({ sessionId: 'selection', input: 'First request' })
  await Promise.race([
    started,
    (async () => {
      for await (const value of client.watch(first.requestId))
        if (value.status !== 'running') throw new Error(`Inference ended before fixture entry: ${value.status}`)
    })(),
  ])
  const put = async (path, body) => {
    const result = await fetch(`${app.origin}/api/${path}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    assert.equal(result.status, 200)
  }
  await put('providers/custom', {
    displayName: 'Custom',
    protocol: 'chat-completions',
    baseUrl: fixture.baseUrl,
    models: ['first', 'second'],
  })
  await put('sessions/selection/selection', { provider: 'custom', model: 'second' })
  release()
  let terminal
  for await (const value of client.watch(first.requestId)) terminal = value
  assert.equal(terminal.status, 'completed')
  const next = await client.send({ sessionId: 'selection', input: 'Second request' })
  for await (const value of client.watch(next.requestId)) terminal = value
  assert.equal(terminal.status, 'completed')
  assert.deepEqual(
    fixture.requests.map(request => request.body.model),
    ['first', 'second'],
  )
  assert.deepEqual(
    (await client.history('selection')).filter(message => message.role === 'user').map(message => message.content),
    ['First request', 'Second request'],
  )
})

test('client keeps the actionable compatibility code from Host admission', async t => {
  const server = createServer((_req, res) =>
    res
      .writeHead(409, { 'content-type': 'application/json' })
      .end(JSON.stringify({ error: { code: 'OPENCODE_UNSUPPORTED_OPTION' } })),
  )
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  t.after(
    () =>
      new Promise(done => {
        server.closeAllConnections()
        server.close(done)
      }),
  )
  await assert.rejects(
    new HostClient(`http://127.0.0.1:${server.address().port}`, 'fixture').send({
      sessionId: 'chat',
      input: 'Keep my draft',
    }),
    /OPENCODE_UNSUPPORTED_OPTION/,
  )
})

test('capture maps the chosen provider/options once and keeps unknown metadata unset', async t => {
  const db = new DatabaseSync(':memory:')
  db.exec('CREATE TABLE providers (id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
  t.after(() => db.close())
  const previous = process.env.DECKAGENT_PARITY_KEY
  process.env.DECKAGENT_PARITY_KEY = 'CAPTURED_FIXTURE_KEY'
  t.after(() => {
    if (previous === undefined) delete process.env.DECKAGENT_PARITY_KEY
    else process.env.DECKAGENT_PARITY_KEY = previous
  })
  const store = new ProviderStore(db)
  await store.load(
    [
      {
        id: 'custom-user-id',
        protocol: 'responses',
        baseUrl: 'https://invalid.example/v1',
        apiKeyEnv: 'DECKAGENT_PARITY_KEY',
        maxOutputTokens: 456,
        timeoutMs: 1500,
        reasoningOptions: [{ label: 'Thấp', apiValue: 'low' }],
      },
    ],
    { provider: 'custom-user-id', model: 'exact-model' },
  )
  const captured = store.captureOpenCode({ provider: 'custom-user-id', model: 'exact-model', reasoningLevel: 'Thấp' })
  t.after(() => captured.release())
  assert.equal(captured.provider.protocol, 'responses')
  assert.equal(captured.provider.model, 'exact-model')
  assert.equal(captured.provider.reasoningEffort, 'low')
  assert.equal(captured.provider.maxOutputTokens, 456)
  assert.equal(captured.provider.timeoutMs, 1500)
  process.env.DECKAGENT_PARITY_KEY = 'LATER_FIXTURE_KEY'
  assert.equal(captured.provider.key, 'CAPTURED_FIXTURE_KEY')
  assert.deepEqual(store.snapshot().providers[0].modelMetadata, [])
  await assert.rejects(
    store.save('custom-user-id', {
      displayName: 'Changed',
      protocol: 'chat-completions',
      baseUrl: 'https://invalid.example/v1',
      models: ['other'],
    }),
    /PROTOCOL_IMMUTABLE/,
  )
  await store.save('custom-user-id', {
    displayName: 'Changed',
    protocol: 'responses',
    baseUrl: 'https://invalid.example/v1',
    models: ['other'],
    key: 'NEXT_FIXTURE_KEY',
  })
  assert.equal(captured.provider.model, 'exact-model')
  assert.equal(captured.provider.key, 'CAPTURED_FIXTURE_KEY')
  assert.equal(captured.provider.reasoningEffort, 'low')
  const next = store.captureOpenCode({ provider: 'custom-user-id', model: 'other' })
  next.release()
  assert.equal(next.provider.model, 'other')
  assert.equal(next.provider.key, 'NEXT_FIXTURE_KEY')
  assert.equal(
    next.provider.maxOutputTokens,
    456,
    'Saving a display/model change must not drop legacy generation options',
  )
  assert.equal(next.provider.timeoutMs, 1500)
  const reopened = new ProviderStore(db)
  await reopened.load()
  const restored = reopened.captureOpenCode({ provider: 'custom-user-id', model: 'other', reasoningLevel: 'Thấp' })
  restored.release()
  assert.equal(restored.provider.maxOutputTokens, 456)
  assert.equal(restored.provider.reasoningEffort, 'low')
})

test('saving and reopening a legacy connection cannot silently remove an unsupported token-field choice', async t => {
  const db = new DatabaseSync(':memory:')
  db.exec('CREATE TABLE providers (id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
  t.after(() => db.close())
  let store = new ProviderStore(db)
  const selection = { provider: 'legacy-chat', model: 'exact' }
  await store.load(
    [
      {
        id: 'legacy-chat',
        protocol: 'chat-completions',
        baseUrl: 'https://invalid.example/v1',
        tokenLimitField: 'max_completion_tokens',
        maxOutputTokens: 123,
        temperature: 0.5,
      },
    ],
    selection,
  )
  assert.throws(() => store.captureOpenCode(selection), /OPENCODE_UNSUPPORTED_OPTION/)
  await store.save('legacy-chat', {
    displayName: 'Renamed',
    protocol: 'chat-completions',
    baseUrl: 'https://invalid.example/v1',
    models: ['exact'],
  })
  store = new ProviderStore(db)
  await store.load()
  assert.throws(() => store.captureOpenCode(selection), /OPENCODE_UNSUPPORTED_OPTION/)
  const legacy = store.capture(selection)
  legacy.release()
})
