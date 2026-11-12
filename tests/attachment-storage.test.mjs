import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { MemoryDraftStore, SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import * as local from '../apps/local-web/lib/index.js'

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-attachments-'))
  const stores = []
  const open = () => { const store = new SqliteSessionStore(join(dir, 'sessions.sqlite')); stores.push(store); return store }
  t.after(async () => { for (const store of stores) store.close(); await rm(dir, { recursive: true, force: true }) })
  return { dir, open }
}

test('attachment metadata belongs to its Chat and a ready source keeps its identity after reopening', async t => {
  const { open } = await fixture(t)
  const store = open()
  await store.open('a')
  await store.open('b')
  const item = store.attachments.create('a', 'notes.txt')
  assert.equal(item.state, 'preparing')
  assert.throws(() => store.attachments.get('b', item.attachmentId), { code: 'ATTACHMENT_NOT_FOUND' })
  assert.throws(() => store.attachments.get('a', 'missing'), { code: 'ATTACHMENT_NOT_FOUND' })
  store.attachments.received('a', item.attachmentId, { byteSize: 5, fingerprint: 'a'.repeat(64) })
  const ready = store.attachments.ready('a', item.attachmentId, 'text/plain')
  assert.equal(ready.state, 'ready')
  assert.equal(ready.source.version, 1)
  store.close()
  assert.deepEqual(open().attachments.get('a', item.attachmentId), ready)
})

test('request admission binds ready attachments atomically and failed admission leaves them unsent', async t => {
  const { open } = await fixture(t)
  const store = open()
  await store.open('a')
  await store.open('b')
  const item = store.attachments.create('a', 'notes.txt')
  const input = { requestId: 'req-files', sessionId: 'a', input: '', selection: { provider: 'p', model: 'm' }, attachmentIds: [item.attachmentId] }
  assert.throws(() => store.requests.admit(input), { code: 'ATTACHMENT_NOT_READY' })
  assert.deepEqual(await store.read('a'), [])
  assert.equal(store.requests.activeFor('a'), undefined)
  store.attachments.received('a', item.attachmentId, { byteSize: 5, fingerprint: 'a'.repeat(64) })
  const ready = store.attachments.ready('a', item.attachmentId, 'text/plain')
  assert.throws(() => store.requests.admit({ ...input, sessionId: 'b' }), { code: 'ATTACHMENT_NOT_FOUND' })
  store.requests.admit(input)
  assert.deepEqual(await store.read('a'), [{ role: 'user', content: '', attachments: [ready] }])
  assert.throws(() => store.attachments.removeUnsent('a', item.attachmentId), { code: 'ATTACHMENT_CONFLICT' })
  assert.deepEqual(store.attachments.unsent(), [])
  store.requests.finish('req-files', 'completed')
  store.close()
  const reopened = open()
  assert.deepEqual(await reopened.read('a'), [{ role: 'user', content: '', attachments: [ready] }])
  assert.equal((await reopened.chats()).find(chat => chat.sessionId === 'a').title, 'notes.txt')
})

test('managed bytes survive committed restart; unsent uploads expire with the draft and foreign reads fail', async t => {
  const { dir, open } = await fixture(t)
  const store = open()
  await store.open('a')
  await store.open('b')
  const drafts = new MemoryDraftStore()
  const files = await local.ManagedAttachments.open(join(dir, 'files'), store.attachments, drafts)
  const upload = name => files.receive({ sessionId: 'a', name, expectedRevision: drafts.snapshot('a').revision,
    bytes: (async function* () { yield Buffer.from('hello') })(), maxBytes: 10, signal: new AbortController().signal })
  const sent = await upload('notes.txt')
  assert.equal(sent.state, 'preparing', 'Saving bytes does not claim parsing has succeeded')
  store.attachments.ready('a', sent.attachmentId, 'text/plain')
  store.requests.admit({ requestId: 'req-1', sessionId: 'a', input: '', attachmentIds: [sent.attachmentId], selection: { provider: 'p', model: 'm' } })
  store.requests.finish('req-1', 'completed')
  const staleRevision = drafts.snapshot('a').revision
  drafts.set('a', 'next request')
  assert.equal(drafts.clear('a', staleRevision), false, 'A sent request cannot clear a newer draft')
  const unsent = await upload('unsent.txt')
  await assert.rejects(files.read('b', sent.attachmentId, new AbortController().signal), { code: 'ATTACHMENT_NOT_FOUND' })
  store.close()
  const next = open()
  const reopenedDrafts = new MemoryDraftStore()
  const reopened = await local.ManagedAttachments.open(join(dir, 'files'), next.attachments, reopenedDrafts)
  assert.equal((await reopened.read('a', sent.attachmentId, new AbortController().signal)).toString(), 'hello')
  assert.throws(() => next.attachments.get('a', unsent.attachmentId), { code: 'ATTACHMENT_NOT_FOUND' })
  assert.deepEqual(reopenedDrafts.snapshot('a'), { text: '', attachmentIds: [], revision: 0 })
  assert.equal((await next.read('a'))[0].attachments[0].source.version, 1)
})

test('failed and oversized uploads keep the draft and rejection; removal clears only the selected unsent file', async t => {
  const { dir, open } = await fixture(t)
  const store = open()
  await store.open('a')
  const drafts = new MemoryDraftStore()
  drafts.set('a', 'keep this text')
  const files = await local.ManagedAttachments.open(join(dir, 'files'), store.attachments, drafts)
  await assert.rejects(files.receive({ sessionId: 'a', name: 'large.txt', expectedRevision: 1,
    bytes: (async function* () { yield Buffer.from('too large') })(), maxBytes: 2, signal: new AbortController().signal }), { code: 'ATTACHMENT_TOO_LARGE' })
  const snapshot = drafts.snapshot('a')
  const id = snapshot.attachmentIds[0]
  assert.equal(snapshot.text, 'keep this text')
  assert.equal(store.attachments.get('a', id).rejectionCode, 'ATTACHMENT_TOO_LARGE')
  assert.deepEqual(await readdir(join(dir, 'files', 'attachments')), [])
  await assert.rejects(files.remove('a', id, 1), { code: 'DRAFT_CONFLICT' })
  await files.remove('a', id, snapshot.revision)
  assert.equal(drafts.get('a'), 'keep this text')
  assert.deepEqual(drafts.snapshot('a').attachmentIds, [])
  await assert.rejects(files.receive({ sessionId: 'a', name: 'broken.txt', expectedRevision: drafts.snapshot('a').revision,
    bytes: (async function* () { yield Buffer.from('part'); throw new Error('raw failure with private material') })(), maxBytes: 10,
    signal: new AbortController().signal }), error => error.code === 'ATTACHMENT_NOT_SAVED' && !error.message.includes('private'))
  assert.equal(drafts.get('a'), 'keep this text')
})

test('a source file is unchanged and a modified managed copy is reported unreadable instead of silently reused', async t => {
  const { dir, open } = await fixture(t)
  const source = join(dir, 'user.txt')
  await writeFile(source, 'hello')
  const store = open()
  await store.open('a')
  const drafts = new MemoryDraftStore()
  const files = await local.ManagedAttachments.open(join(dir, 'files'), store.attachments, drafts)
  const item = await files.receive({ sessionId: 'a', name: 'user.txt', expectedRevision: 0,
    bytes: (async function* () { yield await readFile(source) })(), maxBytes: 10, signal: new AbortController().signal })
  store.attachments.ready('a', item.attachmentId, 'text/plain')
  const managed = join(dir, 'files', 'attachments', `${item.attachmentId}.bin`)
  await writeFile(managed, 'other')
  await assert.rejects(files.read('a', item.attachmentId, new AbortController().signal), { code: 'ATTACHMENT_UNREADABLE' })
  assert.equal(await readFile(source, 'utf8'), 'hello')
})

test('history attachments survive the Host and client projection without exposing physical paths', async t => {
  const { startHost } = await import('../packages/host/api/lib/index.js')
  const { HostClient } = await import('../packages/client/runtime/lib/index.js')
  const { open } = await fixture(t)
  const store = open()
  await store.open('a')
  const item = store.attachments.create('a', 'notes.txt')
  store.attachments.received('a', item.attachmentId, { byteSize: 5, fingerprint: 'a'.repeat(64) })
  const ready = store.attachments.ready('a', item.attachmentId, 'text/plain')
  store.requests.admit({ requestId: 'req-h', sessionId: 'a', input: '', attachmentIds: [item.attachmentId], selection: { provider: 'p', model: 'm' } })
  const host = await startHost({ readHistory: id => store.read(id) })
  t.after(() => host.close())
  const history = await new HostClient(host.origin, host.token).history('a')
  assert.equal(history[0].attachments[0].attachmentId, item.attachmentId)
  assert.equal(history[0].attachments[0].source.sourceId, ready.source.sourceId)
  assert.equal(history[0].attachments[0].fingerprint, undefined, 'Private content fingerprints are not needed in the browser')
})

test('v3 conversations, request events and native bindings survive the attachment migration', async t => {
  const { dir, open } = await fixture(t)
  const db = new DatabaseSync(join(dir, 'sessions.sqlite'))
  db.exec(`
    CREATE TABLE sessions (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, provider TEXT, model TEXT,
      workspace_id TEXT, removed_provider TEXT, removed_model TEXT);
    CREATE TABLE messages (session_id TEXT REFERENCES sessions(id), sequence INTEGER, payload TEXT, PRIMARY KEY(session_id,sequence));
    CREATE TABLE requests (id TEXT PRIMARY KEY, session_id TEXT REFERENCES sessions(id), status TEXT, provider TEXT, model TEXT,
      history_start INTEGER, started_at TEXT, ended_at TEXT, error_code TEXT);
    CREATE TABLE request_events (request_id TEXT REFERENCES requests(id), sequence INTEGER, created_at TEXT, payload TEXT,
      PRIMARY KEY(request_id,sequence));
    CREATE TABLE runtime_bindings (session_id TEXT PRIMARY KEY, native_session_id TEXT, provider TEXT, model TEXT,
      context TEXT, last_request_id TEXT, updated_at TEXT);
    INSERT INTO sessions VALUES ('old','2026-01-01','2026-01-01','p','m','default',NULL,NULL);
    INSERT INTO messages VALUES ('old',1,'{"role":"user","content":"kept"}');
    INSERT INTO requests VALUES ('req-old','old','completed','p','m',0,'2026-01-01','2026-01-01',NULL);
    INSERT INTO request_events VALUES ('req-old',1,'2026-01-01','{"kind":"status","status":"completed"}');
    INSERT INTO runtime_bindings VALUES ('old','native-old','p','m','old-boundary','req-old','2026-01-01');
    PRAGMA application_id = ${0x44414754}; PRAGMA user_version = 3;
  `)
  db.close()
  const store = open()
  assert.deepEqual(await store.read('old'), [{ role: 'user', content: 'kept' }])
  assert.equal(store.requests.events('req-old')[0].status, 'completed')
  assert.equal(store.requests.binding('old').nativeSessionId, 'native-old')
  assert.equal(store.attachments.create('old', 'new.txt').state, 'preparing')
  store.close()
  assert.deepEqual(await open().read('old'), [{ role: 'user', content: 'kept' }])
})

test('database failure rolls back message/request associations and restart removes only uncommitted bytes', async t => {
  const { dir, open } = await fixture(t)
  const store = open()
  await store.open('a')
  const drafts = new MemoryDraftStore()
  const files = await local.ManagedAttachments.open(join(dir, 'files'), store.attachments, drafts)
  const item = await files.receive({ sessionId: 'a', name: 'notes.txt', expectedRevision: 0,
    bytes: (async function* () { yield Buffer.from('hello') })(), maxBytes: 10, signal: new AbortController().signal })
  store.attachments.ready('a', item.attachmentId, 'text/plain')
  const fault = new DatabaseSync(join(dir, 'sessions.sqlite'))
  fault.exec("CREATE TRIGGER refuse_request BEFORE INSERT ON requests BEGIN SELECT RAISE(ABORT, 'fixture disk failure'); END;")
  assert.throws(() => store.requests.admit({ requestId: 'req-fail', sessionId: 'a', input: '', attachmentIds: [item.attachmentId],
    selection: { provider: 'p', model: 'm' } }), { code: 'SESSION_STORAGE' })
  assert.deepEqual(await store.read('a'), [])
  assert.equal(store.requests.get('req-fail'), undefined)
  assert.equal(drafts.snapshot('a').attachmentIds[0], item.attachmentId)
  fault.close()
  store.close()
  const next = open()
  await local.ManagedAttachments.open(join(dir, 'files'), next.attachments, new MemoryDraftStore())
  assert.deepEqual(await readdir(join(dir, 'files', 'attachments')), [])
})

test('cancellation stops an upload even when the next input chunk never arrives', async t => {
  const { dir, open } = await fixture(t)
  const store = open()
  await store.open('a')
  const drafts = new MemoryDraftStore()
  const files = await local.ManagedAttachments.open(join(dir, 'files'), store.attachments, drafts)
  const abort = new AbortController()
  let started
  const waiting = new Promise(resolve => { started = resolve })
  const work = files.receive({ sessionId: 'a', name: 'waiting.txt', expectedRevision: 0, maxBytes: 10, signal: abort.signal,
    bytes: { [Symbol.asyncIterator]() { return { next() { started(); return new Promise(() => {}) } } } } })
  await waiting
  abort.abort()
  const result = await Promise.race([work.then(() => 'completed', error => error.code), new Promise(resolve => setTimeout(() => resolve('hung'), 500))])
  assert.equal(result, 'UPLOAD_CANCELLED')
  assert.equal(store.attachments.get('a', drafts.snapshot('a').attachmentIds[0]).state, 'rejected')
})

test('removing a preparing attachment cancels its upload and keeps the draft text', async t => {
  const { dir, open } = await fixture(t)
  const store = open()
  await store.open('a')
  const drafts = new MemoryDraftStore()
  drafts.set('a', 'keep')
  const files = await local.ManagedAttachments.open(join(dir, 'files'), store.attachments, drafts)
  let started
  const waiting = new Promise(resolve => { started = resolve })
  const work = files.receive({ sessionId: 'a', name: 'waiting.txt', expectedRevision: 1, maxBytes: 10, signal: new AbortController().signal,
    bytes: { [Symbol.asyncIterator]() { return { next() { started(); return new Promise(() => {}) } } } } })
  const outcome = work.then(() => 'completed', error => error.code)
  await waiting
  const draft = drafts.snapshot('a')
  await files.remove('a', draft.attachmentIds[0], draft.revision)
  assert.equal(await outcome, 'UPLOAD_CANCELLED')
  assert.equal(drafts.get('a'), 'keep')
  assert.deepEqual(drafts.snapshot('a').attachmentIds, [])
  assert.deepEqual(await readdir(join(dir, 'files', 'attachments')), [])
})

test('startup rejects a linked attachment root without deleting the linked folder contents', async t => {
  const { dir, open } = await fixture(t)
  const source = join(dir, 'source')
  const root = join(dir, 'files')
  await mkdir(source)
  await mkdir(root)
  await writeFile(join(source, 'keep.txt'), 'untouched')
  await symlink(source, join(root, 'attachments'), process.platform === 'win32' ? 'junction' : 'dir')
  await assert.rejects(local.ManagedAttachments.open(root, open().attachments, new MemoryDraftStore()), { code: 'ATTACHMENT_NOT_SAVED' })
  assert.equal(await readFile(join(source, 'keep.txt'), 'utf8'), 'untouched')
})

test('missing committed bytes stay referenced after recovery and cannot be silently replaced', async t => {
  const { dir, open } = await fixture(t)
  const store = open()
  await store.open('a')
  const files = await local.ManagedAttachments.open(join(dir, 'files'), store.attachments, new MemoryDraftStore())
  const item = await files.receive({ sessionId: 'a', name: 'notes.txt', expectedRevision: 0, maxBytes: 10,
    bytes: (async function* () { yield Buffer.from('hello') })(), signal: new AbortController().signal })
  store.attachments.ready('a', item.attachmentId, 'text/plain')
  store.requests.admit({ requestId: 'req-missing', sessionId: 'a', input: 'use notes', attachmentIds: [item.attachmentId], selection: { provider: 'p', model: 'm' } })
  store.requests.finish('req-missing', 'completed')
  await unlink(join(dir, 'files', 'attachments', `${item.attachmentId}.bin`))
  store.close()
  const next = open()
  const recovered = await local.ManagedAttachments.open(join(dir, 'files'), next.attachments, new MemoryDraftStore())
  assert.equal((await next.read('a'))[0].attachments[0].attachmentId, item.attachmentId)
  await assert.rejects(recovered.read('a', item.attachmentId, new AbortController().signal), { code: 'ATTACHMENT_UNREADABLE' })
})
