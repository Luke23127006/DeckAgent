import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { MemoryDraftStore, SqliteSessionStore, chatTitle } from '../packages/session/persistence/lib/index.js'

const stores = new WeakMap()

/** One cleanup hook per test: close every store first, then remove the folder (Windows keeps open files locked). */
async function directory(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-chats-'))
  const opened = []
  stores.set(t, opened)
  t.after(async () => {
    for (const store of opened) store.close()
    await rm(dir, { recursive: true, force: true })
  })
  return dir
}

function storeIn(t, dir) {
  const store = new SqliteSessionStore(join(dir, 'sessions.sqlite'))
  stores.get(t).push(store)
  return store
}

test('a v1 Session database migrates in place: chats join the default workspace and keep their history', async t => {
  const dir = await directory(t)
  const path = join(dir, 'sessions.sqlite')
  // The exact v1 schema shipped before workspaces existed.
  const v1 = new DatabaseSync(path)
  v1.exec(`
    CREATE TABLE sessions (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, provider TEXT, model TEXT,
      CHECK ((provider IS NULL AND model IS NULL) OR (provider IS NOT NULL AND model IS NOT NULL))) STRICT;
    CREATE TABLE messages (session_id TEXT NOT NULL REFERENCES sessions(id), sequence INTEGER NOT NULL CHECK (sequence > 0),
      payload TEXT NOT NULL, PRIMARY KEY (session_id, sequence)) STRICT;
    PRAGMA application_id = ${0x44414754}; PRAGMA user_version = 1;
    INSERT INTO sessions VALUES ('old', '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z', 'google', 'gemini');
    INSERT INTO messages VALUES ('old', 1, '{"role":"user","content":"Bài cũ"}');
  `)
  v1.close()
  const store = storeIn(t, dir)
  const info = await store.getInfo('old')
  assert.equal(info.workspaceId, 'default')
  assert.deepEqual(info.selection, { provider: 'google', model: 'gemini' })
  assert.equal(info.updatedAt, '2026-01-02T00:00:00.000Z')
  assert.deepEqual(await store.read('old'), [{ role: 'user', content: 'Bài cũ' }])
  store.close()
  const check = new DatabaseSync(path)
  // B02 schema v3 adds request tables; a v1 file passes through the v2 step and keeps every row.
  assert.equal(Number(check.prepare('PRAGMA user_version').get().user_version), 3)
  check.close()
})

test('new chats have their own IDs and empty conversations in the given workspace, with or without a model', async t => {
  const store = storeIn(t, await directory(t))
  const a = await store.create('workspace-a')
  const b = await store.create('workspace-b', { provider: 'openai', model: 'gpt' })
  assert.notEqual(a.sessionId, b.sessionId)
  assert.match(a.sessionId, /^chat-[0-9a-f-]{36}$/)
  assert.equal(a.workspaceId, 'workspace-a')
  assert.equal(a.selection, undefined, 'A chat may exist without a selected model')
  assert.deepEqual(b.selection, { provider: 'openai', model: 'gpt' })
  assert.deepEqual(await store.read(a.sessionId), [])
  await store.append(a.sessionId, [{ role: 'user', content: 'Only in A' }])
  assert.deepEqual(await store.read(b.sessionId), [], 'Nothing is copied between chats')
  await assert.rejects(store.create('  '), { code: 'SESSION_CONFIG' })
})

test('chats are named from their first user message; an unreadable chat stays listed and is never shown as empty', async t => {
  const dir = await directory(t)
  const store = storeIn(t, dir)
  await store.open('good')
  await store.append('good', [
    { role: 'system', content: 'hidden' },
    { role: 'user', content: `  Kế hoạch\n tái chế ${'x'.repeat(80)}` },
  ])
  await store.open('bad')
  await store.append('bad', [{ role: 'user', content: 'Will break' }])
  const raw = new DatabaseSync(join(dir, 'sessions.sqlite'))
  raw.prepare("UPDATE messages SET payload='{not json' WHERE session_id='bad'").run()
  raw.close()
  const chats = await store.chats()
  const good = chats.find(chat => chat.sessionId === 'good')
  const bad = chats.find(chat => chat.sessionId === 'bad')
  assert.equal(good.readable, true)
  assert.equal([...good.title].length, 65, '64 characters and an ellipsis')
  assert.ok(good.title.startsWith('Kế hoạch tái chế'))
  assert.deepEqual([bad.readable, bad.title, bad.messageCount], [false, '', 1])
  await assert.rejects(store.read('bad'), { code: 'SESSION_CORRUPT' })
  assert.equal(chatTitle([]), '')
})

test('search matches every word in the name or the conversation of each chat only, without case, after NFC', async t => {
  const dir = await directory(t)
  const store = storeIn(t, dir)
  const seed = async (id, messages) => {
    await store.open(id)
    await store.append(id, messages)
  }
  await seed('recycling', [
    { role: 'user', content: 'Kế hoạch tái chế' },
    { role: 'assistant', content: 'Giấy và NHỰA' },
  ])
  await seed('budget', [
    { role: 'user', content: 'Ngân sách' },
    { role: 'tool', content: 'nhựa', toolCallId: 't', name: 'read_file', isError: false },
  ])
  await seed('other-workspace', [{ role: 'user', content: 'Tái chế nhựa ở nơi khác' }])
  await seed('broken', [{ role: 'user', content: 'nhựa' }])
  const raw = new DatabaseSync(join(dir, 'sessions.sqlite'))
  raw.prepare("UPDATE messages SET payload='[]' WHERE session_id='broken'").run()
  raw.close()
  const scope = ['recycling', 'budget', 'broken']
  assert.deepEqual(
    await store.search('nhựa', scope),
    ['recycling'],
    'Tool output is not conversation text; unreadable chats never match',
  )
  assert.deepEqual(await store.search('TÁI   chế', scope), ['recycling'], 'Case and Unicode form do not matter')
  assert.deepEqual(await store.search('tái ngân', scope), [], 'Every word must be in the same chat')
  assert.deepEqual(await store.search('   ', scope), [])
  assert.deepEqual(await store.search('nhựa', ['missing', 'recycling']), ['recycling'])
  assert.equal(
    (await store.search('nhựa', scope)).includes('other-workspace'),
    false,
    'Only the given chats are searched',
  )
})

test('chats of a removed workspace become ungrouped with their model; reconciliation ungroups chats of unknown workspaces', async t => {
  const store = storeIn(t, await directory(t))
  const kept = await store.create('kept')
  const removed = await store.create('removed', { provider: 'p', model: 'm' })
  const orphan = await store.create('crashed-before-ungroup')
  await store.ungroup('removed')
  const after = await store.getInfo(removed.sessionId)
  assert.equal(after.workspaceId, null)
  assert.deepEqual(after.selection, { provider: 'p', model: 'm' })
  await store.ungroupExcept(['default', 'kept'])
  assert.equal((await store.getInfo(orphan.sessionId)).workspaceId, null)
  assert.equal((await store.getInfo(kept.sessionId)).workspaceId, 'kept')
  assert.equal((await store.chats()).length, 3, 'No chat is deleted')
})

test('drafts belong to one chat each, are capped, and live only in memory', () => {
  const drafts = new MemoryDraftStore()
  drafts.set('a', 'Draft A')
  drafts.set('b', 'Draft B')
  assert.equal(drafts.get('a'), 'Draft A')
  assert.equal(drafts.get('b'), 'Draft B')
  assert.equal(drafts.get('c'), '')
  drafts.set('a', '')
  assert.equal(drafts.get('a'), '')
  assert.equal(drafts.get('b'), 'Draft B')
  assert.equal(drafts.set('a', 'đ'.repeat(16000)).length, 16000)
  assert.throws(() => drafts.set('a', 'x'.repeat(16001)), { code: 'DRAFT_TOO_LARGE' })
  assert.equal(new MemoryDraftStore().get('b'), '', 'A new store, as after a restart, keeps no draft')
})
