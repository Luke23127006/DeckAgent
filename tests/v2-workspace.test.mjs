import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, rm, rename, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DatabaseSync } from 'node:sqlite'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import { HostClient, DeckClient } from '../packages/client/runtime/lib/index.js'
import { createHash } from 'node:crypto'

test('Workspace ownership survives restart and removal preserves ungrouped Chat history', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-v2-workspace-'))
  const projectFolder = join(dir, 'project')
  await mkdir(projectFolder)
  await writeFile(join(projectFolder, 'notes.txt'), 'unchanged')
  const options = { dataDir: join(dir, 'data'), workspace: join(dir, 'work') }
  let app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', body) => {
    const response = await fetch(app.origin + path, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    return { status: response.status, value: await response.json() }
  }
  const defaults = await api('/api/workspaces')
  assert.equal(defaults.status, 200)
  assert.equal(defaults.value[0].id, 'default')
  const added = await api('/api/workspaces', 'POST', { projectFolder })
  assert.equal(added.status, 201)
  const id = added.value.id
  assert.equal((await api('/api/workspaces', 'POST', { projectFolder })).value.id, id)
  const chat = (await api('/api/sessions', 'POST', { workspaceId: id })).value
  assert.equal(chat.workspaceId, id)
  assert.equal((await api('/api/workspaces/default', 'DELETE')).status, 409)
  await app.close()
  app = await startLocalWeb(options)
  assert.equal((await api('/api/sessions')).value.find(x => x.sessionId === chat.sessionId).workspaceId, id)
  await rename(projectFolder, join(dir, 'moved'))
  assert.equal((await api('/api/workspaces')).value.find(x => x.id === id).state, 'missing')
  assert.equal((await api(`/api/sessions/${chat.sessionId}/history`)).status, 200)
  assert.equal((await api(`/api/workspaces/${id}`, 'PUT', { projectFolder: join(dir, 'moved') })).status, 200)
  assert.equal((await api(`/api/workspaces/${id}`, 'DELETE')).status, 200)
  const ungrouped = (await api('/api/sessions')).value.find(x => x.sessionId === chat.sessionId)
  assert.equal(ungrouped.workspaceId, undefined)
  assert.equal(await readFile(join(dir, 'moved', 'notes.txt'), 'utf8'), 'unchanged')
  await app.close()
  app = await startLocalWeb(options)
  assert.equal((await api('/api/sessions')).value.find(x => x.sessionId === chat.sessionId).workspaceId, undefined)
})

test('V1 schema migration retains IDs, selection and messages and persists explicit ungrouped ownership', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-v1-schema-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const path = join(dir, 'sessions.sqlite')
  const db = new DatabaseSync(path)
  db.exec(`CREATE TABLE sessions(id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, provider TEXT, model TEXT) STRICT;
    CREATE TABLE messages(session_id TEXT NOT NULL REFERENCES sessions(id), sequence INTEGER NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(session_id,sequence)) STRICT;
    INSERT INTO sessions VALUES ('legacy','2026-01-01','2026-01-02','fixture','old');
    INSERT INTO messages VALUES ('legacy',1,'{"role":"user","content":"Keep original"}');
    PRAGMA application_id=1145128788; PRAGMA user_version=1;`)
  db.close()
  let store = new SqliteSessionStore(path)
  assert.equal((await store.getInfo('legacy')).workspaceId, 'default')
  assert.deepEqual((await store.getInfo('legacy')).selection, { provider: 'fixture', model: 'old' })
  assert.deepEqual(await store.read('legacy'), [{ role: 'user', content: 'Keep original' }])
  await store.detachWorkspace('default')
  store.close()
  store = new SqliteSessionStore(path)
  try {
    assert.equal((await store.getInfo('legacy')).workspaceId, undefined)
  } finally {
    store.close()
  }
})

test('a failed V1 schema upgrade rolls back without replacing the original database', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-v1-rollback-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const path = join(dir, 'sessions.sqlite')
  const db = new DatabaseSync(path)
  db.exec(`CREATE TABLE sessions(id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, provider TEXT, model TEXT) STRICT;
    INSERT INTO sessions VALUES ('legacy','2026-01-01','2026-01-02',NULL,NULL);
    PRAGMA application_id=1145128788; PRAGMA user_version=1;`)
  db.close()
  const original = await readFile(path)
  // Missing V1 messages table forces validation to fail after the attempted ALTER TABLE.
  assert.throws(() => new SqliteSessionStore(path), { code: 'SESSION_STORAGE' })
  assert.deepEqual(await readFile(path), original)
  const retained = new DatabaseSync(path, { readOnly: true })
  try {
    assert.equal(retained.prepare('PRAGMA user_version').get().user_version, 1)
    assert.equal(retained.prepare('SELECT id FROM sessions').get().id, 'legacy')
  } finally {
    retained.close()
  }
})

test('Workspace registration rejects internal storage and replacement folders stay unavailable until explicitly repointed', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-v2-folder-identity-'))
  const projectFolder = join(dir, 'project')
  await mkdir(projectFolder)
  const dataDir = join(dir, 'data')
  const app = await startLocalWeb({ dataDir })
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', body) => {
    const response = await fetch(app.origin + path, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    return { status: response.status, value: await response.json() }
  }
  assert.equal(
    (await api('/api/workspaces', 'POST', { projectFolder: dataDir })).value.error.code,
    'WORKSPACE_STORAGE_OVERLAP',
  )
  assert.equal((await api('/api/workspaces', 'POST', { projectFolder: dir })).status, 409)
  assert.equal((await api('/api/sessions', 'POST', { workspaceId: 'missing' })).status, 404)
  const workspace = (await api('/api/workspaces', 'POST', { projectFolder })).value
  await rename(projectFolder, join(dir, 'original'))
  await mkdir(projectFolder)
  const changed = (await api('/api/workspaces')).value.find(item => item.id === workspace.id)
  assert.equal(changed.state, 'missing')
  const restored = await api(`/api/workspaces/${workspace.id}`, 'PUT', { projectFolder })
  assert.equal(restored.value.id, workspace.id)
  assert.equal(restored.value.state, 'available')
})

test('project reads and slide publication share private request roots and busy Workspace changes are rejected', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-v2-roots-'))
  const projectFolder = join(dir, 'project')
  await mkdir(projectFolder)
  await writeFile(join(projectFolder, 'notes.txt'), 'Project marker')
  const reached = Promise.withResolvers()
  let mode = 'publish'
  const options = {
    dataDir: join(dir, 'data'),
    workspace: join(dir, 'work'),
    selection: { provider: 'fixture', model: 'local' },
    model: {
      async *stream({ messages, signal }) {
        if (mode === 'wait') {
          reached.resolve()
          await new Promise((_, reject) =>
            signal.addEventListener('abort', () => reject(signal.reason), { once: true }),
          )
        }
        const last = messages.at(-1)
        if (last.role !== 'tool')
          yield {
            type: 'tool-call',
            call: { id: 'source', name: 'read_file', arguments: { path: 'notes.txt', scope: 'source' } },
          }
        else if (last.name === 'read_file') {
          assert.equal(last.content, 'Project marker')
          yield {
            type: 'tool-call',
            call: {
              id: 'draft',
              name: 'write_file',
              arguments: { path: 'slide.html', content: '<h1>Project marker</h1>' },
            },
          }
        } else if (last.name === 'write_file') {
          assert.equal(last.isError, false)
          yield {
            type: 'tool-call',
            call: {
              id: 'publish',
              name: 'publish_slide',
              arguments: {
                outlineId: 'plan',
                publicationId: 'first',
                slideId: 'one',
                path: 'slide.html',
                expectedRevision: 0,
              },
            },
          }
        } else yield { type: 'text-delta', text: 'Published' }
        yield { type: 'finish', reason: last.name === 'publish_slide' ? 'stop' : 'tool-calls' }
      },
    },
    confirmedDecks: [{ sessionId: 'owned', outlineId: 'plan', slides: [{ slideId: 'one', title: 'One' }] }],
  }
  let app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', body) => {
    const response = await fetch(app.origin + path, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    return { status: response.status, value: await response.json() }
  }
  const workspace = (await api('/api/workspaces', 'POST', { projectFolder })).value
  // Import/fixture ownership is assigned through the public store before restarting Host.
  await app.close()
  const store = new SqliteSessionStore(join(dir, 'data', 'sessions.sqlite'))
  await store.assignWorkspace('owned', workspace.id)
  store.close()
  app = await startLocalWeb(options)
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'owned', input: 'Publish slide 1 using notes.txt' })
  let final
  for await (const snapshot of client.watch(accepted.requestId)) final = snapshot
  assert.equal(final.status, 'completed')
  const deck = new DeckClient(app.origin, app.token)
  assert.equal((await deck.snapshot('owned')).slides[0].revision, 1)
  assert.match((await deck.content('owned', 'one', 1)).html, /Project marker/)
  const workRoot = join(dir, 'work', createHash('sha256').update('owned').digest('hex'), accepted.requestId)
  assert.equal(await readFile(join(workRoot, 'slide.html'), 'utf8'), '<h1>Project marker</h1>')
  assert.equal(await readFile(join(projectFolder, 'notes.txt'), 'utf8'), 'Project marker')
  mode = 'wait'
  const running = await client.send({ sessionId: 'owned', input: 'Read slide 1' })
  await reached.promise
  assert.equal((await api(`/api/workspaces/${workspace.id}`, 'DELETE')).status, 409)
  assert.equal((await api(`/api/workspaces/${workspace.id}`, 'PUT', { projectFolder })).status, 409)
  await client.stop(running.requestId)
  for await (const snapshot of client.watch(running.requestId)) final = snapshot
  assert.equal(final.status, 'cancelled')
  assert.equal((await api(`/api/workspaces/${workspace.id}`, 'DELETE')).status, 200)
  assert.equal((await deck.snapshot('owned')).slides[0].revision, 1)
})
