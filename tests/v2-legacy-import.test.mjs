import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir, link } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import * as web from '../apps/local-web/lib/index.js'
import { HostClient, DeckClient } from '../packages/client/runtime/lib/index.js'

async function profile(t) {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-legacy-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const source = join(root, 'old')
  const target = join(root, 'new')
  await mkdir(source)
  const store = new SqliteSessionStore(join(source, 'sessions.sqlite'))
  await store.bind('saved-chat', { provider: 'fixture', model: 'model-a' })
  await store.append('saved-chat', [{ role: 'user', content: 'Saved presentation request' }])
  store.close()
  await mkdir(join(source, 'workspace'))
  await writeFile(join(source, 'workspace', 'draft.html'), '<h1>Saved draft</h1>')
  return { root, source, target }
}

test('explicit legacy import preserves saved work, backup and original bytes, and is idempotent', async t => {
  const { source, target } = await profile(t)
  const original = await readFile(join(source, 'sessions.sqlite'))
  const result = await web.importLegacyProfile({ source, target })
  assert.equal(result.imported, true)
  assert.deepEqual(await readFile(join(source, 'sessions.sqlite')), original)
  assert.deepEqual(await readFile(join(result.backup, 'sessions.sqlite')), original)
  assert.equal(await readFile(join(target, 'workspace', 'draft.html'), 'utf8'), '<h1>Saved draft</h1>')
  const reopened = new SqliteSessionStore(join(target, 'sessions.sqlite'))
  try {
    assert.deepEqual(await reopened.read('saved-chat'), [{ role: 'user', content: 'Saved presentation request' }])
    assert.deepEqual((await reopened.getInfo('saved-chat')).selection, { provider: 'fixture', model: 'model-a' })
  } finally {
    reopened.close()
  }
  const repeated = await web.importLegacyProfile({ source, target })
  assert.equal(repeated.imported, false)
  assert.equal(repeated.backup, result.backup)
})

test('legacy import refuses overlapping paths and existing target data without changing them', async t => {
  const { source, target } = await profile(t)
  await assert.rejects(web.importLegacyProfile({ source, target: join(source, 'nested') }), {
    code: 'LEGACY_PATH_OVERLAP',
  })
  await mkdir(target)
  await writeFile(join(target, 'keep.txt'), 'Keep this profile')
  await assert.rejects(web.importLegacyProfile({ source, target }), { code: 'LEGACY_TARGET_EXISTS' })
  assert.equal(await readFile(join(target, 'keep.txt'), 'utf8'), 'Keep this profile')
  assert.deepEqual(await readdir(target), ['keep.txt'])
})

test('legacy import rejects active SQLite sidecars and linked source material before installation', async t => {
  const { source, target } = await profile(t)
  await writeFile(join(source, 'sessions.sqlite-wal'), 'Active fixture')
  await assert.rejects(web.importLegacyProfile({ source, target }), { code: 'LEGACY_PROFILE_ACTIVE' })
  await rm(join(source, 'sessions.sqlite-wal'))
  await link(join(source, 'workspace', 'draft.html'), join(source, 'linked-draft.html'))
  await assert.rejects(web.importLegacyProfile({ source, target }), { code: 'LEGACY_UNSAFE_FILE' })
  await assert.rejects(readFile(join(target, 'sessions.sqlite')), { code: 'ENOENT' })
})

test('failed integrity validation preserves the original and backup without installing a partial profile', async t => {
  const { root, source, target } = await profile(t)
  await writeFile(join(source, 'decks.sqlite'), 'Invalid SQLite fixture')
  const original = await readFile(join(source, 'sessions.sqlite'))
  let failure
  await assert.rejects(web.importLegacyProfile({ source, target }), error => {
    failure = error
    return error.code === 'LEGACY_DATABASE_INVALID'
  })
  assert.equal(typeof failure.backup, 'string')
  assert.deepEqual(await readFile(join(source, 'sessions.sqlite')), original)
  assert.deepEqual(await readFile(join(failure.backup, 'sessions.sqlite')), original)
  await assert.rejects(readFile(join(target, 'sessions.sqlite')), { code: 'ENOENT' })
  assert.equal(
    (await readdir(root)).some(name => name.includes('-stage-')),
    false,
  )
})

test('an imported Local Web profile reopens providers, activities and saved deck work together', async t => {
  const { source, target } = await profile(t)
  const fixture = {
    selection: { provider: 'fixture', model: 'model-a' },
    model: {
      async *stream() {
        yield { type: 'text-delta', text: 'Saved fixture reply' }
        yield { type: 'finish', reason: 'stop' }
      },
    },
  }
  let app = await web.startLocalWeb({
    ...fixture,
    dataDir: source,
    confirmedDecks: [
      { sessionId: 'saved-chat', outlineId: 'saved-outline', slides: [{ slideId: 'one', title: 'Saved slide' }] },
    ],
  })
  try {
    const api = async path =>
      (await fetch(app.origin + path, { headers: { authorization: `Bearer ${app.token}` } })).json()
    const chat = new HostClient(app.origin, app.token)
    const accepted = await chat.send({ sessionId: 'activity-chat', input: 'Create saved activity' })
    for await (const _snapshot of chat.watch(accepted.requestId)) {
      /* Wait for durable finalization. */
    }
    const savedProvider = await fetch(`${app.origin}/api/providers/custom-fixture`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Saved custom provider',
        protocol: 'chat-completions',
        baseUrl: 'http://127.0.0.1:1',
        models: ['saved-model'],
      }),
    })
    assert.equal(savedProvider.status, 200)
    const before = {
      settings: await api('/api/settings'),
      requests: await api('/api/sessions/activity-chat/requests'),
      activities: await api('/api/sessions/activity-chat/activities'),
      deck: await new DeckClient(app.origin, app.token).snapshot('saved-chat'),
    }
    assert.ok(before.activities.length > 0)
    assert.equal(before.requests[0].status, 'completed')
    await app.close()
    await web.importLegacyProfile({ source, target })
    app = await web.startLocalWeb({ ...fixture, dataDir: target })
    assert.deepEqual(await api('/api/settings'), before.settings)
    assert.deepEqual(await api('/api/sessions/activity-chat/requests'), before.requests)
    assert.deepEqual(await api('/api/sessions/activity-chat/activities'), before.activities)
    assert.deepEqual(await new DeckClient(app.origin, app.token).snapshot('saved-chat'), before.deck)
    assert.equal(
      (await new HostClient(app.origin, app.token).history('activity-chat')).at(-1).content,
      'Saved fixture reply',
    )
  } finally {
    await app.close()
  }
})
