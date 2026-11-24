import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { SqliteSessionStore } from '@deckagent/session-persistence'

test('Web model selection changes independently of conversation and survives restart; storage binding still guards mismatches', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-web-session-'))
  const path = join(dir, 'sessions.sqlite')
  let store = new SqliteSessionStore(path)
  t.after(async () => {
    store.close()
    await rm(dir, { recursive: true, force: true })
  })
  await store.bind('chat', { provider: 'first', model: 'a' })
  await store.append('chat', [{ role: 'user', content: 'Keep this conversation' }])
  await store.select('chat', { provider: 'second', model: 'b' })
  store.close()
  store = new SqliteSessionStore(path)
  assert.deepEqual((await store.getInfo('chat')).selection, { provider: 'second', model: 'b' })
  assert.deepEqual(await store.read('chat'), [{ role: 'user', content: 'Keep this conversation' }])
  await assert.rejects(store.bind('chat', { provider: 'first', model: 'a' }), { code: 'SESSION_CONFLICT' })
})
