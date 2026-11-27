import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import {
  ChatDatabase,
  DatabaseError,
  SqliteChatStore,
  SqliteRunStore,
  openSessionStore,
} from './fixtures/session-store.mjs'
import { ChatError, ChatRequestService, ChatService } from '../lib/types/modules/chats/index.js'
import { RunFailure } from '../lib/types/runs/ports.js'

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
  const store = openSessionStore(join(dir, 'sessions.sqlite'))
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
  assert.equal(Number(check.prepare('PRAGMA user_version').get().user_version), 9)
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
  await store.open('empty')
  const chats = await store.chats()
  const good = chats.find(chat => chat.sessionId === 'good')
  const bad = chats.find(chat => chat.sessionId === 'bad')
  const empty = chats.find(chat => chat.sessionId === 'empty')
  assert.equal(good.readable, true)
  assert.equal([...good.title].length, 65, '64 characters and an ellipsis')
  assert.ok(good.title.startsWith('Kế hoạch tái chế'))
  assert.deepEqual([bad.readable, bad.title, bad.messageCount], [false, '', 1])
  await assert.rejects(store.read('bad'), { code: 'SESSION_CORRUPT' })
  assert.equal(empty.title, '')
  assert.equal(empty.readable, true)
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

test('corrupt research_sources rows throw SESSION_CORRUPT', async t => {
  const dir = await directory(t)
  const store = storeIn(t, dir)
  const session = await store.create('default')
  store.requests.admit({
    requestId: 'req-research-corrupt',
    sessionId: session.sessionId,
    input: 'find sources',
    selection: { provider: 'p', model: 'm' },
  })
  const raw = new DatabaseSync(join(dir, 'sessions.sqlite'))
  raw
    .prepare('INSERT INTO research_sources (id, request_id, session_id, payload) VALUES (?, ?, ?, ?)')
    .run('src-bad-json', 'req-research-corrupt', session.sessionId, '{not json')
  raw.close()
  assert.throws(() => store.requests.researchSources(session.sessionId), {
    name: 'DatabaseError',
    code: 'SESSION_CORRUPT',
  })

  const rawMissing = new DatabaseSync(join(dir, 'sessions.sqlite'))
  rawMissing.prepare('UPDATE research_sources SET payload = ? WHERE id = ?').run('{"sourceId":"bad"}', 'src-bad-json')
  rawMissing.close()
  assert.throws(() => store.requests.researchSources(session.sessionId), {
    name: 'DatabaseError',
    code: 'SESSION_CORRUPT',
  })
})

test('a v7 Session database upgrades to schema 9 in place, keeps its chats and starts the chats version at 0', async t => {
  const dir = await directory(t)
  const path = join(dir, 'sessions.sqlite')
  const v7 = new DatabaseSync(path)
  v7.exec(`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      provider TEXT, model TEXT, workspace_id TEXT, removed_provider TEXT, removed_model TEXT,
      CHECK ((provider IS NULL AND model IS NULL) OR (provider IS NOT NULL AND model IS NOT NULL))
    ) STRICT;
    CREATE TABLE messages (
      session_id TEXT NOT NULL REFERENCES sessions(id), sequence INTEGER NOT NULL CHECK (sequence > 0),
      payload TEXT NOT NULL, PRIMARY KEY (session_id, sequence)
    ) STRICT;
    CREATE INDEX sessions_workspace ON sessions(workspace_id);
    CREATE TABLE requests (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id),
      status TEXT NOT NULL CHECK (status IN ('active','waiting_approval','completed','failed','stopped','interrupted')),
      provider TEXT NOT NULL, model TEXT NOT NULL, history_start INTEGER NOT NULL CHECK (history_start >= 0),
      started_at TEXT NOT NULL, ended_at TEXT, error_code TEXT
    ) STRICT;
    CREATE INDEX requests_session ON requests(session_id);
    CREATE UNIQUE INDEX requests_one_active ON requests(session_id) WHERE status IN ('active','waiting_approval');
    CREATE TABLE request_events (
      request_id TEXT NOT NULL REFERENCES requests(id), sequence INTEGER NOT NULL CHECK (sequence > 0),
      created_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (request_id, sequence)
    ) STRICT;
    CREATE TABLE runtime_bindings (
      session_id TEXT PRIMARY KEY REFERENCES sessions(id), native_session_id TEXT NOT NULL,
      provider TEXT NOT NULL, model TEXT NOT NULL, context TEXT NOT NULL, last_request_id TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE attachments (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id), name TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('preparing','ready','rejected')),
      byte_size INTEGER NOT NULL DEFAULT 0 CHECK (byte_size >= 0), fingerprint TEXT,
      detected_type TEXT, rejection_code TEXT, request_id TEXT REFERENCES requests(id), message_sequence INTEGER,
      preparation TEXT, parsed_fingerprint TEXT,
      FOREIGN KEY (session_id, message_sequence) REFERENCES messages(session_id, sequence)
    ) STRICT;
    CREATE INDEX attachments_session ON attachments(session_id);
    CREATE TABLE sources (
      id TEXT NOT NULL, version INTEGER NOT NULL CHECK (version > 0),
      session_id TEXT NOT NULL REFERENCES sessions(id), attachment_id TEXT NOT NULL REFERENCES attachments(id),
      fingerprint TEXT NOT NULL, label TEXT NOT NULL, PRIMARY KEY (id, version), UNIQUE (attachment_id)
    ) STRICT;
    CREATE TABLE request_approvals (
      id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id), step_key TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation = 'read-file'), target TEXT NOT NULL, reason TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('pending','allowed','refused','cancelled'))
    ) STRICT;
    CREATE UNIQUE INDEX approvals_one_pending ON request_approvals(request_id) WHERE state = 'pending';
    CREATE INDEX approvals_refused ON request_approvals(request_id, step_key, state);
    CREATE TABLE source_reads (
      source_id TEXT NOT NULL, version INTEGER NOT NULL, session_id TEXT NOT NULL REFERENCES sessions(id),
      origin TEXT NOT NULL, label TEXT NOT NULL, fingerprint TEXT NOT NULL, line_count INTEGER NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('project-file','approved-file')), request_id TEXT NOT NULL REFERENCES requests(id),
      PRIMARY KEY (source_id, version), UNIQUE (session_id, origin, version)
    ) STRICT;
    CREATE TABLE request_research (
      request_id TEXT PRIMARY KEY REFERENCES requests(id), selected INTEGER NOT NULL CHECK(selected IN (0,1)),
      attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3)
    ) STRICT;
    CREATE TABLE research_sources (
      id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id),
      session_id TEXT NOT NULL REFERENCES sessions(id), payload TEXT NOT NULL
    ) STRICT;
    CREATE INDEX research_sources_chat ON research_sources(session_id);
    INSERT INTO sessions (id, created_at, updated_at, workspace_id) VALUES ('chat-v7', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', 'workspace-a');
    PRAGMA application_id = ${0x44414754};
    PRAGMA user_version = 7;
  `)
  v7.close()
  const store = storeIn(t, dir)
  assert.equal(store.chatsVersion(), 0)
  assert.equal((await store.getInfo('chat-v7')).workspaceId, 'workspace-a')
  store.close()
  const check = new DatabaseSync(path)
  assert.equal(Number(check.prepare('PRAGMA user_version').get().user_version), 9)
  check.close()
})

test('a v8 Session database migrates in place to schema 9, preserves requests and bindings under run owner keys, and passes foreign_key_check', async t => {
  const dir = await directory(t)
  const path = join(dir, 'sessions.sqlite')
  const v8 = new DatabaseSync(path)
  v8.exec(`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      provider TEXT, model TEXT, workspace_id TEXT, removed_provider TEXT, removed_model TEXT,
      CHECK ((provider IS NULL AND model IS NULL) OR (provider IS NOT NULL AND model IS NOT NULL))
    ) STRICT;
    CREATE TABLE messages (
      session_id TEXT NOT NULL REFERENCES sessions(id), sequence INTEGER NOT NULL CHECK (sequence > 0),
      payload TEXT NOT NULL, PRIMARY KEY (session_id, sequence)
    ) STRICT;
    CREATE INDEX sessions_workspace ON sessions(workspace_id);
    CREATE TABLE requests (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id),
      status TEXT NOT NULL CHECK (status IN ('active','waiting_approval','completed','failed','stopped','interrupted')),
      provider TEXT NOT NULL, model TEXT NOT NULL, history_start INTEGER NOT NULL CHECK (history_start >= 0),
      started_at TEXT NOT NULL, ended_at TEXT, error_code TEXT
    ) STRICT;
    CREATE INDEX requests_session ON requests(session_id);
    CREATE UNIQUE INDEX requests_one_active ON requests(session_id) WHERE status IN ('active','waiting_approval');
    CREATE TABLE request_events (
      request_id TEXT NOT NULL REFERENCES requests(id), sequence INTEGER NOT NULL CHECK (sequence > 0),
      created_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (request_id, sequence)
    ) STRICT;
    CREATE TABLE runtime_bindings (
      session_id TEXT PRIMARY KEY REFERENCES sessions(id), native_session_id TEXT NOT NULL,
      provider TEXT NOT NULL, model TEXT NOT NULL, context TEXT NOT NULL, last_request_id TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE attachments (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id), name TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('preparing','ready','rejected')),
      byte_size INTEGER NOT NULL DEFAULT 0 CHECK (byte_size >= 0), fingerprint TEXT,
      detected_type TEXT, rejection_code TEXT, request_id TEXT REFERENCES requests(id), message_sequence INTEGER,
      preparation TEXT, parsed_fingerprint TEXT,
      FOREIGN KEY (session_id, message_sequence) REFERENCES messages(session_id, sequence)
    ) STRICT;
    CREATE INDEX attachments_session ON attachments(session_id);
    CREATE TABLE sources (
      id TEXT NOT NULL, version INTEGER NOT NULL CHECK (version > 0),
      session_id TEXT NOT NULL REFERENCES sessions(id), attachment_id TEXT NOT NULL REFERENCES attachments(id),
      fingerprint TEXT NOT NULL, label TEXT NOT NULL, PRIMARY KEY (id, version), UNIQUE (attachment_id)
    ) STRICT;
    CREATE TABLE request_approvals (
      id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id), step_key TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation = 'read-file'), target TEXT NOT NULL, reason TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('pending','allowed','refused','cancelled'))
    ) STRICT;
    CREATE UNIQUE INDEX approvals_one_pending ON request_approvals(request_id) WHERE state = 'pending';
    CREATE INDEX approvals_refused ON request_approvals(request_id, step_key, state);
    CREATE TABLE source_reads (
      source_id TEXT NOT NULL, version INTEGER NOT NULL, session_id TEXT NOT NULL REFERENCES sessions(id),
      origin TEXT NOT NULL, label TEXT NOT NULL, fingerprint TEXT NOT NULL, line_count INTEGER NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('project-file','approved-file')), request_id TEXT NOT NULL REFERENCES requests(id),
      PRIMARY KEY (source_id, version), UNIQUE (session_id, origin, version)
    ) STRICT;
    CREATE TABLE request_research (
      request_id TEXT PRIMARY KEY REFERENCES requests(id), selected INTEGER NOT NULL CHECK(selected IN (0,1)),
      attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3)
    ) STRICT;
    CREATE TABLE research_sources (
      id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id),
      session_id TEXT NOT NULL REFERENCES sessions(id), payload TEXT NOT NULL
    ) STRICT;
    CREATE INDEX research_sources_chat ON research_sources(session_id);
    CREATE TABLE change_versions (
      topic TEXT NOT NULL, key TEXT NOT NULL, version INTEGER NOT NULL CHECK (version >= 0), PRIMARY KEY (topic, key)
    ) STRICT;
    INSERT INTO change_versions VALUES ('chats', 'host', 4);
    INSERT INTO sessions (id, created_at, updated_at, provider, model, workspace_id)
      VALUES ('chat-v8', '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z', 'openai', 'gpt', 'default');
    INSERT INTO messages VALUES ('chat-v8', 1, '{"role":"user","content":"Migrate me"}');
    INSERT INTO requests VALUES ('req-v8', 'chat-v8', 'completed', 'openai', 'gpt', 0, '2026-01-02T00:00:00.000Z', '2026-01-02T00:01:00.000Z', NULL);
    INSERT INTO request_events VALUES ('req-v8', 1, '2026-01-02T00:00:00.000Z', '{"kind":"status","status":"completed"}');
    INSERT INTO request_research VALUES ('req-v8', 0, 0);
    INSERT INTO runtime_bindings VALUES ('chat-v8', 'ses-native-v8', 'openai', 'gpt', 'ctx-v8', 'req-v8', '2026-01-02T00:01:00.000Z');
    PRAGMA application_id = ${0x44414754};
    PRAGMA user_version = 8;
  `)
  v8.close()

  const store = storeIn(t, dir)
  assert.equal(store.chatsVersion(), 4)
  const record = store.runs.get('req-v8')
  assert.deepEqual(record.owner, { kind: 'chat', id: 'chat-v8' })
  assert.equal(record.status, 'completed')
  assert.deepEqual(store.runs.binding('chat:chat-v8'), {
    ownerKey: 'chat:chat-v8',
    nativeSessionId: 'ses-native-v8',
    selection: { provider: 'openai', model: 'gpt' },
    context: 'ctx-v8',
    lastRequestId: 'req-v8',
  })
  store.close()

  const check = new DatabaseSync(path)
  assert.equal(Number(check.prepare('PRAGMA user_version').get().user_version), 9)
  assert.equal(check.prepare('PRAGMA foreign_key_check').get(), undefined)
  check.close()
})

test('an admission failure rolls back user messages, requests and change notices atomically', async t => {
  const dir = await directory(t)
  const path = join(dir, 'sessions.sqlite')
  const notices = []
  const db = new ChatDatabase(path)
  stores.get(t).push(db)
  const chats = new SqliteChatStore(db, { onChatsChanged: version => notices.push(version) })
  const chat = await chats.create('default')
  assert.deepEqual(notices, [1])
  const runs = new SqliteRunStore(db, {
    beforeAdmit: input => chats.admitUserMessageInTx(input.owner.id, input.input, []),
    afterAdmit: () => {
      throw new DatabaseError('ATTACHMENT_CONFLICT', 'Simulated failure after message and request insert')
    },
  })
  assert.throws(
    () =>
      runs.admit({
        requestId: 'req-rollback',
        owner: { kind: 'chat', id: chat.sessionId },
        input: 'Must roll back',
        selection: { provider: 'p', model: 'm' },
      }),
    error => error instanceof DatabaseError && error.code === 'ATTACHMENT_CONFLICT',
  )
  assert.equal(runs.get('req-rollback'), undefined)
  assert.deepEqual(await chats.read(chat.sessionId), [])
  assert.equal(chats.chatsVersion(), 1)
  assert.deepEqual(notices, [1])
})

test('each chat write increases the chats version once and sends the notice after the commit', async t => {
  const dir = await directory(t)
  const path = join(dir, 'sessions.sqlite')
  const seen = []
  const store = openSessionStore(path, {
    onChatsChanged: version => {
      const reader = new DatabaseSync(path)
      const row = reader.prepare("SELECT version FROM change_versions WHERE topic = 'chats' AND key = 'host'").get()
      reader.close()
      seen.push([version, Number(row.version)])
    },
  })
  stores.get(t).push(store)
  assert.equal(store.chatsVersion(), 0)
  const chat = await store.create('workspace-a')
  await store.select(chat.sessionId, { provider: 'p', model: 'm' })
  await store.append(chat.sessionId, [
    { role: 'user', content: 'Một' },
    { role: 'assistant', content: 'Hai' },
  ])
  store.requests.admit({
    requestId: 'request-1',
    sessionId: chat.sessionId,
    input: 'Ba',
    selection: { provider: 'p', model: 'm' },
  })
  await store.clearSelections('p')
  await store.ungroup('workspace-a')
  await store.open('chat-opened')
  assert.deepEqual(seen, [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 6],
    [7, 7],
  ])
  assert.equal(store.chatsVersion(), 7)
})

test('a write that changes no chat, or that fails, keeps the chats version and sends no notice', async t => {
  const dir = await directory(t)
  const seen = []
  const store = openSessionStore(join(dir, 'sessions.sqlite'), { onChatsChanged: version => seen.push(version) })
  stores.get(t).push(store)
  await store.open('chat-a')
  await store.open('chat-a')
  await store.ungroup('workspace-none')
  await store.ungroupExcept(['default'])
  await store.clearSelections('provider-none')
  await assert.rejects(store.select('chat-missing', { provider: 'p', model: 'm' }), { code: 'SESSION_NOT_FOUND' })
  await assert.rejects(
    store.append('chat-a', [
      { role: 'user', content: 'Một' },
      { role: 'nobody', content: 'Hai' },
    ]),
    {
      name: 'DatabaseError',
    },
  )
  assert.deepEqual(seen, [1])
  assert.equal(store.chatsVersion(), 1)
  assert.deepEqual(await store.read('chat-a'), [])
})

test('ChatRequestService maps run busy errors and unreadable chat errors to ChatError', async () => {
  const selection = { provider: 'openai', model: 'gpt-4o' }
  const unused = () => {
    throw new Error('unused')
  }
  const makeService = ({ getInfo, read, start }) =>
    new ChatRequestService({
      chats: { getInfo, read },
      providers: {
        providerSettings: () => [{ models: ['gpt-4o'] }],
        selectable: value => value.provider === 'openai' && value.model === 'gpt-4o',
      },
      runs: { start, get: unused, decide: unused, events: () => [], stop: unused, subscribe: () => () => {} },
      deckPlanner: { prepare: async () => unused() },
      preflightResearch: async () => {},
    })

  const isChatCode = code => error => error instanceof ChatError && error.code === code
  const missing = makeService({ getInfo: async () => undefined, read: async () => [], start: async () => ({}) })
  await assert.rejects(missing.readSelection('missing'), isChatCode('SESSION_NOT_FOUND'))

  const corrupt = makeService({
    getInfo: async () => ({ selection }),
    read: async () => {
      throw new DatabaseError('SESSION_CORRUPT', 'corrupt')
    },
    start: async () => ({}),
  })
  await assert.rejects(corrupt.readSelection('bad'), isChatCode('CHAT_UNREADABLE'))

  const busy = makeService({
    getInfo: async () => ({ selection }),
    read: async () => [],
    start: async () => {
      throw new RunFailure('RUN_OWNER_BUSY')
    },
  })
  await assert.rejects(busy.submit({ sessionId: 'chat-1', input: 'Hello' }), isChatCode('SESSION_BUSY'))

  const ok = makeService({
    getInfo: async () => ({ selection }),
    read: async () => [],
    start: async () => ({
      requestId: 'req-1',
      owner: { kind: 'chat', id: 'chat-1' },
      status: 'active',
      text: '',
      sequence: 1,
    }),
  })
  assert.deepEqual(await ok.submit({ sessionId: 'chat-1', input: 'Hello' }), {
    requestId: 'req-1',
    sessionId: 'chat-1',
    status: 'active',
    text: '',
    sequence: 1,
  })
})

test('ChatService implements WorkspaceChats and projects stored chat requests', async t => {
  const store = storeIn(t, await directory(t))
  const chatA = await store.create('workspace-a', { provider: 'openai', model: 'gpt-4o' })
  const chatB = await store.create('workspace-b')
  store.runs.admit({
    requestId: 'req-ws-a',
    owner: { kind: 'chat', id: chatA.sessionId },
    input: 'Start',
    selection: { provider: 'openai', model: 'gpt-4o' },
  })
  const service = new ChatService(
    store.chatStore,
    store.runs,
    { selectedId: () => 'workspace-a' },
    { lastSelection: () => undefined, selectable: () => true, rememberSelection: () => {} },
    { hasSlides: () => false, hasDraft: () => false },
  )
  assert.equal(await service.hasActiveRequest('workspace-a'), true)
  assert.equal(await service.hasActiveRequest('workspace-b'), false)
  const requests = await service.requests(chatA.sessionId)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].requestId, 'req-ws-a')
  assert.equal(requests[0].sessionId, chatA.sessionId)
  assert.equal('owner' in requests[0], false)
  await service.ungroup('workspace-b')
  assert.equal((await store.getInfo(chatB.sessionId)).workspaceId, null)
  assert.equal((await store.getInfo(chatA.sessionId)).workspaceId, 'workspace-a')
})
