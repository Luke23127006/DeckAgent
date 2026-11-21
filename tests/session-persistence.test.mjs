import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'

async function database(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-sessions-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  return join(dir, 'nested', 'sessions.sqlite')
}

test('a conversation and its model selection survive closing and reopening storage', async t => {
  const path = await database(t)
  const first = new SqliteSessionStore(path)
  const info = await first.bind('chat-01', { provider: 'google', model: 'chosen-model' })
  await first.append('chat-01', [
    { role: 'user', content: 'Xin chào' },
    { role: 'assistant', content: 'Hello' },
  ])
  first.close()
  const second = new SqliteSessionStore(path)
  try {
    await second.open('chat-01')
    assert.deepEqual(await second.read('chat-01'), [
      { role: 'user', content: 'Xin chào' },
      { role: 'assistant', content: 'Hello' },
    ])
    const restored = await second.getInfo('chat-01')
    assert.deepEqual(restored.selection, { provider: 'google', model: 'chosen-model' })
    assert.equal(restored.createdAt, info.createdAt)
    assert.equal(restored.messageCount, 2)
    assert.ok(restored.updatedAt >= info.createdAt)
    assert.deepEqual(await second.list(), [restored])
  } finally {
    second.close()
  }
})

test('a failed append rolls back its entire batch and leaves metadata and later ordering intact', async t => {
  const path = await database(t)
  const store = new SqliteSessionStore(path)
  try {
    await store.open('atomic')
    await store.append('atomic', [{ role: 'user', content: 'Before' }])
    const before = await store.getInfo('atomic')
    await assert.rejects(
      store.append('atomic', [
        { role: 'assistant', content: 'Must roll back' },
        { role: 'tool', content: 'Missing tool identity' },
      ]),
      { code: 'SESSION_MESSAGE' },
    )
    assert.deepEqual(await store.read('atomic'), [{ role: 'user', content: 'Before' }])
    assert.deepEqual(await store.getInfo('atomic'), before)
    await store.append('atomic', [{ role: 'assistant', content: 'After' }])
    assert.deepEqual(await store.read('atomic'), [
      { role: 'user', content: 'Before' },
      { role: 'assistant', content: 'After' },
    ])
  } finally {
    store.close()
  }
})

test('unsupported or unowned databases are refused without replacing their contents', async t => {
  const path = await database(t)
  await mkdir(dirname(path), { recursive: true })
  const external = new DatabaseSync(path)
  external.exec(
    "CREATE TABLE important_data (value TEXT); INSERT INTO important_data VALUES ('keep me'); PRAGMA user_version = 2;",
  )
  external.close()
  const before = await readFile(path)
  assert.throws(() => new SqliteSessionStore(path), { code: 'SESSION_SCHEMA' })
  assert.deepEqual(await readFile(path), before)
  const unknown = new DatabaseSync(path)
  unknown.exec('PRAGMA user_version = 0;')
  unknown.close()
  const unowned = await readFile(path)
  assert.throws(() => new SqliteSessionStore(path), { code: 'SESSION_SCHEMA' })
  assert.deepEqual(await readFile(path), unowned)
})

test('all supported message fields round-trip exactly and read snapshots cannot change stored history', async t => {
  const path = await database(t)
  const store = new SqliteSessionStore(path)
  const messages = [
    { role: 'system', content: 'System message' },
    { role: 'user', content: 'Unicode: tiếng Việt 🚀\nSecond line' },
    {
      role: 'assistant',
      content: '',
      toolCalls: [
        { id: 'call-one', name: 'noop', arguments: { value: 'DeckAgent', nested: { array: [null, 2, false] } } },
      ],
      providerState: {
        provider: 'google',
        model: 'chosen-model',
        data: { protocol: 'gemini', parts: [{ thoughtSignature: 'exact-signature' }] },
      },
    },
    { role: 'tool', content: 'Failure detail', toolCallId: 'call-one', name: 'noop', isError: true },
    {
      role: 'assistant',
      content: 'Partial text',
      interrupted: true,
      providerState: { provider: 'google', model: 'chosen-model', data: null },
    },
  ]
  await store.open('exact')
  await store.append('exact', messages)
  const snapshot = await store.read('exact')
  snapshot[2].toolCalls[0].arguments.value = 'Changed'
  messages[1].content = 'Caller changed its array'
  store.close()
  const reopened = new SqliteSessionStore(path)
  try {
    const restored = await reopened.read('exact')
    assert.equal(restored[1].content, 'Unicode: tiếng Việt 🚀\nSecond line')
    assert.equal(restored[2].toolCalls[0].arguments.value, 'DeckAgent')
    assert.deepEqual(restored.slice(2), [
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { id: 'call-one', name: 'noop', arguments: { value: 'DeckAgent', nested: { array: [null, 2, false] } } },
        ],
        providerState: {
          provider: 'google',
          model: 'chosen-model',
          data: { protocol: 'gemini', parts: [{ thoughtSignature: 'exact-signature' }] },
        },
      },
      { role: 'tool', content: 'Failure detail', toolCallId: 'call-one', name: 'noop', isError: true },
      {
        role: 'assistant',
        content: 'Partial text',
        interrupted: true,
        providerState: { provider: 'google', model: 'chosen-model', data: null },
      },
    ])
  } finally {
    reopened.close()
  }
})

test('Session identities are isolated, model binding is stable, and closed storage rejects new work', async t => {
  const store = new SqliteSessionStore(await database(t))
  try {
    await assert.rejects(store.open('  '), { code: 'SESSION_CONFIG' })
    await assert.rejects(store.read('missing'), { code: 'SESSION_NOT_FOUND' })
    await assert.rejects(store.append('missing', [{ role: 'user', content: 'Do not create' }]), {
      code: 'SESSION_NOT_FOUND',
    })
    assert.equal(await store.getInfo('missing'), undefined)
    await store.bind('../an-id-not-a-path', { provider: 'custom', model: 'model-one' })
    await store.open('empty')
    await store.append('../an-id-not-a-path', [{ role: 'user', content: 'Only this session' }])
    await assert.rejects(store.bind('../an-id-not-a-path', { provider: 'custom', model: 'model-two' }), {
      code: 'SESSION_CONFLICT',
    })
    assert.deepEqual((await store.getInfo('../an-id-not-a-path')).selection, { provider: 'custom', model: 'model-one' })
    assert.deepEqual(await store.read('empty'), [])
    store.close()
    store.close()
    await assert.rejects(store.list(), { code: 'SESSION_CLOSED' })
    await assert.rejects(store.open('after-close'), { code: 'SESSION_CLOSED' })
  } finally {
    store.close()
  }
})

test('non-JSON message data is rejected instead of being silently changed or dropped', async t => {
  const store = new SqliteSessionStore(await database(t))
  try {
    await store.open('invalid-json')
    for (const data of [undefined, NaN, Infinity, new Date(), [undefined], { value: undefined }, 1n]) {
      await assert.rejects(
        store.append('invalid-json', [
          { role: 'assistant', content: '', providerState: { provider: 'custom', model: 'chosen-model', data } },
        ]),
        { code: 'SESSION_MESSAGE' },
      )
    }
    assert.deepEqual(await store.read('invalid-json'), [])
  } finally {
    store.close()
  }
})

test('invalid files and corrupted message payloads fail safely without resetting data', async t => {
  const path = await database(t)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, 'not a database: untrusted-sensitive-details')
  assert.throws(
    () => new SqliteSessionStore(path),
    error => error.code === 'SESSION_STORAGE' && !error.message.includes('untrusted-sensitive-details'),
  )
  assert.equal(await readFile(path, 'utf8'), 'not a database: untrusted-sensitive-details')
  const valid = join(dirname(path), 'valid.sqlite')
  const store = new SqliteSessionStore(valid)
  await store.open('damaged')
  await store.append('damaged', [{ role: 'user', content: 'Keep the row' }])
  store.close()
  // Simulate an externally damaged file, then verify through the store's public interface.
  const external = new DatabaseSync(valid)
  external.prepare('UPDATE messages SET payload = ?').run('{bad json: untrusted-sensitive-details')
  external.close()
  const reopened = new SqliteSessionStore(valid)
  try {
    await assert.rejects(
      reopened.read('damaged'),
      error => error.code === 'SESSION_CORRUPT' && !error.message.includes('untrusted-sensitive-details'),
    )
    assert.equal((await reopened.getInfo('damaged')).messageCount, 1)
  } finally {
    reopened.close()
  }
})
