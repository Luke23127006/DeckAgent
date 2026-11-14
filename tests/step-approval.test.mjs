import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-approval-'))
  const stores = []
  const open = () => { const store = new SqliteSessionStore(join(dir, 'sessions.sqlite')); stores.push(store); return store }
  t.after(async () => { for (const store of stores) store.close(); await rm(dir, { recursive: true, force: true }) })
  const store = open()
  await store.open('chat')
  store.requests.admit({ requestId: 'req-1', sessionId: 'chat', input: 'read source', selection: { provider: 'p', model: 'm' } })
  return { dir, store, open }
}

const step = { key: 'a'.repeat(64), operation: 'read-file', target: 'outside.txt', reason: 'Read a file outside the project folder' }

test('approval is durable, keeps request active, consumes a decision once and refuses repeated denied steps', async t => {
  const { store, open } = await fixture(t)
  const pending = store.requests.approvals.create('req-1', step).approval
  assert.equal(store.requests.get('req-1').status, 'waiting_approval')
  assert.equal(store.requests.activeFor('chat'), 'req-1')
  const allowed = store.requests.approvals.decide('req-1', pending.approvalId, 'allow-once')
  assert.equal(allowed.approval.state, 'allowed')
  assert.equal(store.requests.approvals.decide('req-1', pending.approvalId, 'allow-once').events.length, 0)
  assert.throws(() => store.requests.approvals.decide('req-1', pending.approvalId, 'refuse'), { code: 'APPROVAL_CONFLICT' })
  const second = store.requests.approvals.create('req-1', step).approval
  assert.notEqual(second.approvalId, pending.approvalId)
  store.requests.approvals.decide('req-1', second.approvalId, 'refuse')
  assert.equal(store.requests.approvals.create('req-1', step).approval.state, 'refused')
  const third = store.requests.approvals.create('req-1', { ...step, key: 'b'.repeat(64), target: 'different.txt' }).approval
  store.close()
  const next = open()
  assert.equal(next.requests.approvals.pending('req-1').approvalId, third.approvalId)
  next.requests.interruptActive()
  assert.equal(next.requests.get('req-1').status, 'interrupted')
  assert.equal(next.requests.approvals.pending('req-1'), undefined)
  assert.ok(next.requests.events('req-1').some(event => event.kind === 'approval' && event.approval.state === 'cancelled'))
  assert.throws(() => next.requests.approvals.decide('req-1', third.approvalId, 'allow-once'), { code: 'REQUEST_CLOSED' })
  assert.ok((await next.read('chat')).at(-1).content.includes('outside.txt'))
})

test('runtime events cannot grant approval and source versions stay scoped to their Chat', async t => {
  const { store } = await fixture(t)
  const pending = store.requests.approvals.create('req-1', step).approval
  assert.throws(() => store.requests.append('req-1', { kind: 'approval', approval: { ...pending, state: 'allowed' } }), { code: 'REQUEST_EVENT' })
  store.requests.approvals.decide('req-1', pending.approvalId, 'allow-once')
  const first = store.requests.recordSourceRead('req-1', { origin: '/fixture/source.txt', label: 'source.txt', fingerprint: 'a'.repeat(64), lineCount: 2, kind: 'project-file' })
  const same = store.requests.recordSourceRead('req-1', { origin: '/fixture/source.txt', label: 'source.txt', fingerprint: 'a'.repeat(64), lineCount: 2, kind: 'project-file' })
  assert.deepEqual(first, same)
  const changed = store.requests.recordSourceRead('req-1', { origin: '/fixture/source.txt', label: 'source.txt', fingerprint: 'b'.repeat(64), lineCount: 3, kind: 'project-file' })
  assert.equal(changed.sourceId, first.sourceId)
  assert.equal(changed.version, 2)
  await store.open('other')
  assert.deepEqual(store.requests.sourceCatalogue('other'), [])
  assert.equal(store.requests.sourceCatalogue('chat')[0].version, 2)
  store.requests.finish('req-1', 'completed')
  assert.throws(() => store.requests.recordSourceRead('req-1', { origin: '/fixture/source.txt', label: 'source.txt', fingerprint: 'c'.repeat(64), lineCount: 1, kind: 'project-file' }), { code: 'REQUEST_CLOSED' })
})

test('v4 attachment associations survive the approval migration and existing work is not retried', async t => {
  const { dir, store, open } = await fixture(t)
  store.requests.finish('req-1', 'completed')
  const item = store.attachments.create('chat', 'old.txt')
  store.attachments.received('chat', item.attachmentId, { byteSize: 5, fingerprint: 'a'.repeat(64) })
  const ready = store.attachments.ready('chat', item.attachmentId, 'text/plain')
  store.requests.admit({ requestId: 'req-v4', sessionId: 'chat', input: '', attachmentIds: [item.attachmentId], selection: { provider: 'p', model: 'm' } })
  store.requests.finish('req-v4', 'completed')
  store.close()
  // Reconstruct the shipped v4 schema, excluding both approval and preparation additions.
  const v4 = new DatabaseSync(join(dir, 'sessions.sqlite'))
  v4.exec('DROP TABLE request_approvals; DROP TABLE source_reads; ALTER TABLE attachments DROP COLUMN preparation; ALTER TABLE attachments DROP COLUMN parsed_fingerprint; PRAGMA user_version = 4;')
  v4.close()
  const upgraded = open()
  assert.deepEqual(upgraded.attachments.get('chat', item.attachmentId), ready)
  assert.equal((await upgraded.read('chat'))[1].attachments[0].source.sourceId, ready.source.sourceId)
  assert.equal(upgraded.requests.get('req-v4').status, 'completed')
  assert.equal(upgraded.requests.activeFor('chat'), undefined)
  assert.deepEqual(upgraded.requests.sourceCatalogue('chat'), [])
  upgraded.requests.admit({ requestId: 'req-v5', sessionId: 'chat', input: 'next', selection: { provider: 'p', model: 'm' } })
  assert.equal(upgraded.requests.approvals.create('req-v5', step).approval.state, 'pending')
})
