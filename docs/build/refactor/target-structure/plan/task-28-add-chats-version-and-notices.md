# Task 28: Add the chats version and change notices

Read this file to learn the steps of Task 28, which gives the chat list one `version` and a `chats` notice after each committed change.

The chat list of the Browser comes from `GET /api/sessions`. It shows every chat of every workspace. Its fields come from the tables `sessions` and `messages` of `sessions.sqlite`, and a request writes `messages` and `sessions.updated_at` through `appendMessages`. After this task:

- `sessions.sqlite` has schema 8 with the table `change_versions` and the row `('chats', 'host', 0)`. A schema 1 to 7 file upgrades in place, in the transaction of `initialize`.
- Each committed write that changes the chat list increases this `version` by one, in the same transaction. A write that changes no row, or that fails, keeps the `version`.
- `SqliteSessionStore` calls `onChatsChanged(version)` after the commit. `server.ts` publishes `{ topic: 'chats', key: 'host', version }` on the `ChangeFeed`, and `GET /api/changes` sends the current `chats` version on connect.
- The chat write routes do not get `expectedVersion`, and no code `CHATS_STALE` exists. The reply of `GET /api/sessions` does not change.
- ADR-004 and the aggregate table of `docs/architecture/10-agent-core.md` record the key `'host'` and the exception for `expectedVersion`.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/ste-vi/SKILL.md`
- `docs/architecture/30-decisions.md` (section `## ADR-004`)
- `packages/session/persistence/src/index.ts` (357 lines)
- `packages/session/persistence/src/schema.ts` (160 lines)
- `packages/session/persistence/src/requests.ts` (lines 73-125 and 240-290)
- `apps/host/src/http/change-feed.ts`
- `e2e/local-foundation.test.mjs` (lines 1-60 and 406-460)

**Files:**

- Change (edit script): `packages/session/persistence/src/schema.ts`, `packages/session/persistence/src/index.ts`, `apps/host/src/server.ts`, `apps/host/tests/research.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/step-approval.test.mjs`, `packages/session/persistence/tests/chat-persistence.test.mjs`, `e2e/local-foundation.test.mjs`, `docs/architecture/30-decisions.md`, `docs/architecture/10-agent-core.md`
- Change: `CHANGELOG.md`
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-28-add-chats-version-and-notices.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-28-add-chats-version-and-notices.md`

**Interfaces:**

- Uses: `ChangeFeed.publish(notice: ChangeNotice): void` and `HostChangeTopic = { topic: ChangeTopic; version(): number }` from `apps/host/src/http/change-feed.ts`. `StartHostOptions.changes.hostTopics` in `apps/host/src/http/start-host.ts`.
- Produces, in `@deckagent/session-persistence`:
  - `interface SessionStoreOptions { readonly onChatsChanged?: (version: number) => void }`
  - `new SqliteSessionStore(path: string, options?: SessionStoreOptions)`
  - `SqliteSessionStore.chatsVersion(): number`
- Produces, on `GET /api/changes`: the first notices of a connection are `{ topic: 'workspaces', key: 'host', version }` and then `{ topic: 'chats', key: 'host', version }`.

## Write rules

The edit script of Step 2 follows these rules. Use them to review the code. Do not change the code.

| Write | Increases the chats version |
| --- | --- |
| `create`, `bind`, `select` | Always, once. |
| `open` | Only when it inserts the chat. `open` now runs in `this.transaction`. |
| `ungroup`, `ungroupExcept` | Only when one row or more changed. `ungroup` now runs in `this.transaction`. |
| `clearSelections` | Only when one chat or more had the provider. |
| `append`, `RequestLog.admit`, `RequestLog.settle` | When `insertMessages` writes one message or more. |
| A write that throws | Never. `transaction` clears the pending version on `ROLLBACK`. |
| Two changes in one transaction | Once. `changedChats` runs the `UPDATE` only for the first change. |

The three tests `apps/host/tests/research.test.mjs`, `e2e/attachment-storage.test.mjs` and `e2e/step-approval.test.mjs` make an old database from a current one: they drop the tables that the old schema did not have. The edit script adds `DROP TABLE change_versions;` to each of these setups, because schema 7 and earlier have no such table. The expected values of these tests do not change. `e2e/local-foundation.test.mjs` gets the helper `changeNotices(app, t)`, which skips the notices of other topics. The workspace test uses it with the same expected values.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in Step 1 is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit script in Step 2 prints a line that contains `expected 1 match`.
- A command of Step 5 gives another `# fail` count than `Expected`.
- A suite in Step 6 fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`. The comments in the code of this task are part of the code.
- Commit when a STOP condition occurred. Push with `--force`, or skip a hook with `--no-verify`.
- Change an expected value of an existing test, other than `7` to `8` for `user_version` in `chat-persistence.test.mjs`.
- Change the edit script of Step 2. When `build` or `lint` reports an error in the result, STOP.
- Add `expectedVersion` or `CHATS_STALE` to a chat route.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 27 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" apps/host/src/server.ts packages/session/persistence/src/index.ts packages/session/persistence/src/schema.ts e2e/local-foundation.test.mjs packages/session/persistence/tests/chat-persistence.test.mjs apps/host/tests/research.test.mjs e2e/attachment-storage.test.mjs e2e/step-approval.test.mjs docs/architecture/30-decisions.md docs/architecture/10-agent-core.md`

Expected: PASS. Ten lines, in this order: `412`, `357`, `160`, `460`, `178`, `263`, `499`, `157`, `201`, `390`.

- [ ] **Step 2: Run the edit script**

Write the script below to `C:/Users/Duy/AppData/Local/Temp/deckagent-task28-edits.mjs`.

```js
import { readFileSync, writeFileSync } from 'node:fs'

let changed = 0
let failures = 0

function edit(path, pairs) {
  let text = readFileSync(path, 'utf8')
  for (const [before, after] of pairs) {
    const count = text.split(before).length - 1
    if (count !== 1) {
      console.log(`${path} expected 1 match, found ${count}: ${before.slice(0, 60)}`)
      failures += 1
      continue
    }
    text = text.replace(before, () => after)
  }
  writeFileSync(path, text)
  changed += 1
}

edit('packages/session/persistence/src/schema.ts', [
  ['const schemaVersion = 7\n', 'const schemaVersion = 8\n'],
  [
    '/** Chats saved before workspaces existed belong to the default workspace. */',
    "/** One version for the chat list of the Host (ADR-004). It starts at 0 on a new file and on an upgrade. */\nconst changeVersionsTable = `\n  CREATE TABLE change_versions (\n    topic TEXT NOT NULL, key TEXT NOT NULL, version INTEGER NOT NULL CHECK (version >= 0), PRIMARY KEY (topic, key)\n  ) STRICT;\n  INSERT INTO change_versions (topic, key, version) VALUES ('chats', 'host', 0);\n`\n/** Chats saved before workspaces existed belong to the default workspace. */",
  ],
  ['        ${researchTables}\n        PRAGMA application_id', '        ${researchTables}\n        ${changeVersionsTable}\n        PRAGMA application_id'],
  [
    '    } else if (version >= 1 && version <= 6 && owner === applicationId) {',
    '    } else if (version >= 1 && version <= 7 && owner === applicationId) {',
  ],
  [
    '      db.exec(`${researchTables} PRAGMA user_version = ${schemaVersion};`)',
    '      if (version < 7) db.exec(researchTables)\n      db.exec(`${changeVersionsTable} PRAGMA user_version = ${schemaVersion};`)',
  ],
  [
    "    db.exec('COMMIT')\n",
    "    db.prepare('SELECT topic, key, version FROM change_versions LIMIT 0').all()\n    if (!db.prepare(\"SELECT version FROM change_versions WHERE topic = 'chats' AND key = 'host'\").get())\n      throw new SessionError('SESSION_CORRUPT', 'Session database has no chats version row')\n    db.exec('COMMIT')\n",
  ],
])

edit('packages/session/persistence/src/index.ts', [
  [
    '/** Local durable storage of chats and their conversations. The application owns close(). */\nexport class SqliteSessionStore {\n  private readonly db: DatabaseSync\n  private closed = false\n',
    '/** Options of the session store. */\nexport interface SessionStoreOptions {\n  /** Called after a committed write that changed the chat list, with the new chats version. */\n  readonly onChatsChanged?: (version: number) => void\n}\n\n/** Local durable storage of chats and their conversations. The application owns close(). */\nexport class SqliteSessionStore {\n  private readonly db: DatabaseSync\n  private readonly onChatsChanged: ((version: number) => void) | undefined\n  private chatsChange: number | undefined\n  private closed = false\n',
  ],
  [
    '  constructor(path: string) {\n    let db: DatabaseSync | undefined\n',
    '  constructor(path: string, options: SessionStoreOptions = {}) {\n    this.onChatsChanged = options.onChatsChanged\n    let db: DatabaseSync | undefined\n',
  ],
  [
    '    this.access(() => this.ensure(sessionId, defaultWorkspaceId))\n  }\n',
    '    this.access(() =>\n      this.transaction(() => {\n        if (this.ensure(sessionId, defaultWorkspaceId)) this.changedChats()\n      }),\n    )\n  }\n\n  /** The version of the chat list. Each committed write that changes the list increases it by one. */\n  chatsVersion(): number {\n    return this.access(() => this.readChatsVersion())\n  }\n',
  ],
  [
    '            .run(selection.provider, selection.model, sessionId)\n        return this.info(sessionId)!\n      }),\n    )\n  }\n\n  /** Bind the app',
    '            .run(selection.provider, selection.model, sessionId)\n        this.changedChats()\n        return this.info(sessionId)!\n      }),\n    )\n  }\n\n  /** Bind the app',
  ],
  [
    "          .prepare('UPDATE sessions SET provider = ?, model = ? WHERE id = ?')\n          .run(selection.provider, selection.model, sessionId)\n        return this.info(sessionId)!",
    "          .prepare('UPDATE sessions SET provider = ?, model = ? WHERE id = ?')\n          .run(selection.provider, selection.model, sessionId)\n        this.changedChats()\n        return this.info(sessionId)!",
  ],
  [
    '          .run(selection.provider, selection.model, sessionId)\n        return this.info(sessionId)!\n      }),\n    )\n  }\n\n  async list()',
    '          .run(selection.provider, selection.model, sessionId)\n        this.changedChats()\n        return this.info(sessionId)!\n      }),\n    )\n  }\n\n  async list()',
  ],
  [
    "    this.access(() => {\n      this.db.prepare('UPDATE sessions SET workspace_id = NULL WHERE workspace_id = ?').run(workspaceId)\n    })",
    "    this.access(() =>\n      this.transaction(() => {\n        const result = this.db\n          .prepare('UPDATE sessions SET workspace_id = NULL WHERE workspace_id = ?')\n          .run(workspaceId)\n        if (Number(result.changes) > 0) this.changedChats()\n      }),\n    )",
  ],
  [
    '          if (!keep.has(String(row.workspace_id))) update.run(String(row.workspace_id))\n        }',
    '          if (!keep.has(String(row.workspace_id)) && Number(update.run(String(row.workspace_id)).changes) > 0)\n            this.changedChats()\n        }',
  ],
  [
    '        for (const row of rows) update.run(provider, String(row.model), String(row.id))\n',
    '        for (const row of rows) update.run(provider, String(row.model), String(row.id))\n        if (rows.length > 0) this.changedChats()\n',
  ],
  [
    "    if (messages.length)\n      this.db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), sessionId)\n",
    "    if (messages.length) {\n      this.db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), sessionId)\n      this.changedChats()\n    }\n",
  ],
  [
    "  private transaction<T>(operation: () => T): T {\n    this.db.exec('BEGIN IMMEDIATE')\n    try {\n      const result = operation()\n      this.db.exec('COMMIT')\n      return result\n    } catch (error) {\n      this.db.exec('ROLLBACK')\n      throw error\n    }\n  }\n",
    "  /** Runs `operation` in one transaction. A chats notice goes out after the commit only. */\n  private transaction<T>(operation: () => T): T {\n    this.chatsChange = undefined\n    this.db.exec('BEGIN IMMEDIATE')\n    let result: T\n    try {\n      result = operation()\n      this.db.exec('COMMIT')\n    } catch (error) {\n      this.chatsChange = undefined\n      this.db.exec('ROLLBACK')\n      throw error\n    }\n    const version = this.chatsChange\n    this.chatsChange = undefined\n    if (version !== undefined) this.onChatsChanged?.(version)\n    return result\n  }\n\n  /** Increases the chats version once in the current transaction. */\n  private changedChats(): void {\n    if (this.chatsChange !== undefined) return\n    this.db\n      .prepare(\"UPDATE change_versions SET version = version + 1 WHERE topic = 'chats' AND key = 'host'\")\n      .run()\n    this.chatsChange = this.readChatsVersion()\n  }\n\n  private readChatsVersion(): number {\n    const row = this.db.prepare(\"SELECT version FROM change_versions WHERE topic = 'chats' AND key = 'host'\").get()\n    if (!row) throw new SessionError('SESSION_CORRUPT', 'Session database has no chats version row')\n    return Number(row.version)\n  }\n",
  ],
  [
    '  private ensure(sessionId: string, workspaceId: string): void {\n    this.validateId(sessionId)\n    const now = new Date().toISOString()\n    this.db\n      .prepare(\n        \'INSERT INTO sessions (id, created_at, updated_at, workspace_id) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING\',\n      )\n      .run(sessionId, now, now, workspaceId)\n  }',
    '  /** Inserts the chat when it is absent. Returns true when it inserted a row. */\n  private ensure(sessionId: string, workspaceId: string): boolean {\n    this.validateId(sessionId)\n    const now = new Date().toISOString()\n    const result = this.db\n      .prepare(\n        \'INSERT INTO sessions (id, created_at, updated_at, workspace_id) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING\',\n      )\n      .run(sessionId, now, now, workspaceId)\n    return Number(result.changes) > 0\n  }',
  ],
])

edit('apps/host/src/server.ts', [
  [
    "      sessions = new SqliteSessionStore(join(layout.databases, 'sessions.sqlite'))",
    "      sessions = new SqliteSessionStore(join(layout.databases, 'sessions.sqlite'), {\n        onChatsChanged: version => changeFeed.publish({ topic: 'chats', key: 'host', version }),\n      })",
  ],
  [
    "    changes: { feed: changeFeed, hostTopics: [{ topic: 'workspaces', version: () => registry.version() }] },",
    "    changes: {\n      feed: changeFeed,\n      hostTopics: [\n        { topic: 'workspaces', version: () => registry.version() },\n        { topic: 'chats', version: () => sessions.chatsVersion() },\n      ],\n    },",
  ],
])

edit('apps/host/tests/research.test.mjs', [
  [
    "old.exec('DROP TABLE research_sources; DROP TABLE request_research; PRAGMA user_version=6;')",
    "old.exec('DROP TABLE change_versions; DROP TABLE research_sources; DROP TABLE request_research; PRAGMA user_version=6;')",
  ],
])

edit('e2e/attachment-storage.test.mjs', [
  ["    'DROP TABLE research_sources; DROP TABLE request_research; ALTER TABLE attachments", "    'DROP TABLE change_versions; DROP TABLE research_sources; DROP TABLE request_research; ALTER TABLE attachments"],
])

edit('e2e/step-approval.test.mjs', [
  [
    "    'DROP TABLE research_sources; DROP TABLE request_research; DROP TABLE request_approvals;",
    "    'DROP TABLE change_versions; DROP TABLE research_sources; DROP TABLE request_research; DROP TABLE request_approvals;",
  ],
])

edit('packages/session/persistence/tests/chat-persistence.test.mjs', [
  [
    "  assert.equal(Number(check.prepare('PRAGMA user_version').get().user_version), 7)",
    "  assert.equal(Number(check.prepare('PRAGMA user_version').get().user_version), 8)",
  ],
])

const streamBlock =
  "  const streamControl = new AbortController()\n  t.after(() => streamControl.abort())\n  const streamResponse = await fetch(`${app.origin}/api/changes`, {\n    headers: { authorization: `Bearer ${app.token}` },\n    signal: streamControl.signal,\n  })\n  assert.equal(streamResponse.status, 200)\n  const reader = streamResponse.body.getReader()\n  const decoder = new TextDecoder()\n  let buffer = ''\n  const nextNotice = async () => {\n    while (true) {\n      const boundary = buffer.indexOf('\\n\\n')\n      if (boundary >= 0) {\n        const frame = buffer.slice(0, boundary)\n        buffer = buffer.slice(boundary + 2)\n        if (frame.startsWith('event: change\\ndata: ')) return JSON.parse(frame.slice('event: change\\ndata: '.length))\n        continue\n      }\n      const part = await reader.read()\n      if (part.done) throw new Error('Stream ended')\n      buffer += decoder.decode(part.value, { stream: true }).replace(/\\r\\n/g, '\\n')\n    }\n  }\n"

const streamHelper =
  "/** Opens GET /api/changes. The returned function gives the next notice of one topic and skips the other topics. */\nasync function changeNotices(app, t) {\n  const streamControl = new AbortController()\n  t.after(() => streamControl.abort())\n  const streamResponse = await fetch(`${app.origin}/api/changes`, {\n    headers: { authorization: `Bearer ${app.token}` },\n    signal: streamControl.signal,\n  })\n  assert.equal(streamResponse.status, 200)\n  const reader = streamResponse.body.getReader()\n  const decoder = new TextDecoder()\n  let buffer = ''\n  return async topic => {\n    while (true) {\n      const boundary = buffer.indexOf('\\n\\n')\n      if (boundary >= 0) {\n        const frame = buffer.slice(0, boundary)\n        buffer = buffer.slice(boundary + 2)\n        if (!frame.startsWith('event: change\\ndata: ')) continue\n        const notice = JSON.parse(frame.slice('event: change\\ndata: '.length))\n        if (notice.topic === topic) return notice\n        continue\n      }\n      const part = await reader.read()\n      if (part.done) throw new Error('Stream ended')\n      buffer += decoder.decode(part.value, { stream: true }).replace(/\\r\\n/g, '\\n')\n    }\n  }\n}\n\n"

edit('e2e/local-foundation.test.mjs', [
  [streamBlock, '  const nextNotice = await changeNotices(app, t)\n'],
  ['async function tree(folder) {', `${streamHelper}async function tree(folder) {`],
  [
    "  assert.deepEqual(await nextNotice(), { topic: 'workspaces', key: 'host', version: 0 })",
    "  assert.deepEqual(await nextNotice('workspaces'), { topic: 'workspaces', key: 'host', version: 0 })",
  ],
  [
    "  assert.deepEqual(await nextNotice(), { topic: 'workspaces', key: 'host', version: 1 })",
    "  assert.deepEqual(await nextNotice('workspaces'), { topic: 'workspaces', key: 'host', version: 1 })",
  ],
  ['  const noticeAfterRemove = nextNotice()', "  const noticeAfterRemove = nextNotice('workspaces')"],
])

edit('docs/architecture/30-decisions.md', [
  [
    '`deck`, `brief`, `outline` và `draft` theo chat; `chats` theo workspace; `workspaces`, `providers` và `preferences` cho cả Host.',
    '`deck`, `brief`, `outline` và `draft` theo chat. `chats`, `workspaces`, `providers` và `preferences` cho cả Host.',
  ],
  [
    'Aggregate mới dùng code `<TOPIC>_STALE`, ví dụ `WORKSPACES_STALE`.\n',
    'Aggregate mới dùng code `<TOPIC>_STALE`, ví dụ `WORKSPACES_STALE`.\n- Topic `chats` là ngoại lệ. Lệnh ghi chat không gửi `expectedVersion`, và không có code `CHATS_STALE`. Mỗi tin nhắn trong một chat cũng tăng `version` của danh sách chat. Nếu store kiểm `version`, lệnh tạo chat và lệnh đổi model bị từ chối khi không có xung đột thật. Lệnh tạo chat chỉ thêm một chat, và lệnh đổi model chỉ đổi một chat.\n',
  ],
  [
    '- Màn hình đọc lại cả aggregate sau mỗi thay đổi. Chấp nhận cho đến khi có số đo cho thấy chậm.\n',
    '- Màn hình đọc lại cả aggregate sau mỗi thay đổi. Chấp nhận cho đến khi có số đo cho thấy chậm.\n- Các field `hasDraft`, `activeRequestId`, `hasSlides` và `selectable` của danh sách chat lấy từ store khác. Chúng không tăng `version` của `chats`. Browser giữ cách đọc lại hiện tại cho các field này.\n',
  ],
])

edit('docs/architecture/10-agent-core.md', [
  [
    '| `chats` | Workspace ID | `change_versions` | `sessions` | Không có `version` | `CHATS_STALE` |',
    "| `chats` | `'host'` | `change_versions` trong `sessions.sqlite` | `sessions`, `messages` | Không có `version` | Không có. Lệnh ghi chat không gửi `expectedVersion` |",
  ],
])

function appendTo(path, block) {
  writeFileSync(path, `${readFileSync(path, 'utf8')}\n${block}`)
}

appendTo(
  'packages/session/persistence/tests/chat-persistence.test.mjs',
  `test('a v7 Session database upgrades to schema 8 in place, keeps its chats and starts the chats version at 0', async t => {
  const dir = await directory(t)
  const path = join(dir, 'sessions.sqlite')
  const first = storeIn(t, dir)
  const chat = await first.create('workspace-a')
  first.close()
  const v7 = new DatabaseSync(path)
  v7.exec('DROP TABLE change_versions; PRAGMA user_version = 7;')
  v7.close()
  const store = storeIn(t, dir)
  assert.equal(store.chatsVersion(), 0)
  assert.equal((await store.getInfo(chat.sessionId)).workspaceId, 'workspace-a')
  store.close()
  const check = new DatabaseSync(path)
  assert.equal(Number(check.prepare('PRAGMA user_version').get().user_version), 8)
  check.close()
})

test('each chat write increases the chats version once and sends the notice after the commit', async t => {
  const dir = await directory(t)
  const path = join(dir, 'sessions.sqlite')
  const seen = []
  const store = new SqliteSessionStore(path, {
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
  const store = new SqliteSessionStore(join(dir, 'sessions.sqlite'), { onChatsChanged: version => seen.push(version) })
  stores.get(t).push(store)
  await store.open('chat-a')
  await store.open('chat-a')
  await store.ungroup('workspace-none')
  await store.ungroupExcept(['default'])
  await store.clearSelections('provider-none')
  await assert.rejects(store.select('chat-missing', { provider: 'p', model: 'm' }), { code: 'SESSION_NOT_FOUND' })
  await assert.rejects(store.append('chat-a', [{ role: 'user', content: 'Một' }, { role: 'nobody', content: 'Hai' }]), {
    name: 'SessionError',
  })
  assert.deepEqual(seen, [1])
  assert.equal(store.chatsVersion(), 1)
  assert.deepEqual(await store.read('chat-a'), [])
})
`,
)

appendTo(
  'e2e/local-foundation.test.mjs',
  `test('chat writes publish a chats notice after the commit, and each connection starts with the current version', async t => {
  const { start } = await area(t)
  const app = await start()
  const call = api(app)
  const nextNotice = await changeNotices(app, t)
  assert.deepEqual(await nextNotice('chats'), { topic: 'chats', key: 'host', version: 0 })

  const created = await call('sessions', 'POST', {})
  assert.equal(created.status, 201)
  assert.deepEqual(await nextNotice('chats'), { topic: 'chats', key: 'host', version: 1 })
  assert.ok((await call('sessions')).data.some(item => item.sessionId === created.data.sessionId))

  const later = await changeNotices(app, t)
  assert.deepEqual(await later('chats'), { topic: 'chats', key: 'host', version: 1 })
})
`,
)

console.log(`task28-edits: ${changed} files changed, ${failures} failures`)
```

Run: `node C:/Users/Duy/AppData/Local/Temp/deckagent-task28-edits.mjs`

Expected: PASS. The output is `task28-edits: 10 files changed, 0 failures`, and no line contains `expected 1 match`.

- [ ] **Step 3: Format the code**

Run: `corepack pnpm@11.28.5 exec biome format --write packages/session/persistence apps/host/src/server.ts apps/host/tests/research.test.mjs`

Expected: PASS. The output contains `Fixed 3 files`.

Run: `corepack pnpm@11.28.5 exec biome format packages/session/persistence apps/host/src/server.ts apps/host/tests/research.test.mjs`

Expected: PASS. The output contains `No fixes applied`.

- [ ] **Step 4: Build and check**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 lint`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`.

Run: `corepack pnpm@11.28.5 check:docs`

Expected: PASS. The output contains `0 error(s)`.

Run: `node --test packages/session/persistence/tests/chat-persistence.test.mjs`

Expected: PASS. The output contains `# pass 9` and `# fail 0`.

- [ ] **Step 5: Break the code and make sure that the tests fail**

Write the script below to `C:/Users/Duy/AppData/Local/Temp/deckagent-task28-break.mjs`. It changes `packages/session/persistence/src/index.ts` for one test run, and then puts the file back.

```js
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const path = 'packages/session/persistence/src/index.ts'
const backup = join(tmpdir(), 'deckagent-task28-index.ts')
const mutations = {
  'notice-before-commit': [
    "      result = operation()\n      this.db.exec('COMMIT')",
    "      result = operation()\n      if (this.chatsChange !== undefined) this.onChatsChanged?.(this.chatsChange)\n      this.db.exec('COMMIT')",
  ],
  'no-message-bump': [
    "      this.db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), sessionId)\n      this.changedChats()\n",
    "      this.db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), sessionId)\n",
  ],
}

const action = process.argv[2]
if (action === 'restore') {
  writeFileSync(path, readFileSync(backup, 'utf8'))
  console.log('task28-break: restored')
} else if (action in mutations) {
  const [before, after] = mutations[action]
  const text = readFileSync(path, 'utf8')
  if (text.split(before).length !== 2) {
    console.log(`task28-break: ${path} expected 1 match for ${action}`)
    process.exit(1)
  }
  writeFileSync(backup, text)
  writeFileSync(path, text.replace(before, () => after))
  console.log(`task28-break: applied ${action}`)
} else {
  console.log('task28-break: unknown action')
  process.exit(1)
}
```

Run these commands in order. Each `Expected` is for the command just before it.

1. `node C:/Users/Duy/AppData/Local/Temp/deckagent-task28-break.mjs notice-before-commit`. Expected: `task28-break: applied notice-before-commit`.
2. `corepack pnpm@11.28.5 build`. Expected: exit code 0.
3. `node --test packages/session/persistence/tests/chat-persistence.test.mjs`. Expected: FAIL. The output contains `# fail 2`. The failed tests are `each chat write increases the chats version once and sends the notice after the commit` and `a write that changes no chat, or that fails, keeps the chats version and sends no notice`.
4. `node C:/Users/Duy/AppData/Local/Temp/deckagent-task28-break.mjs restore`. Expected: `task28-break: restored`.
5. `node C:/Users/Duy/AppData/Local/Temp/deckagent-task28-break.mjs no-message-bump`. Expected: `task28-break: applied no-message-bump`.
6. `corepack pnpm@11.28.5 build`. Expected: exit code 0.
7. `node --test packages/session/persistence/tests/chat-persistence.test.mjs`. Expected: FAIL. The output contains `# fail 1`. The failed test is `each chat write increases the chats version once and sends the notice after the commit`.
8. `node C:/Users/Duy/AppData/Local/Temp/deckagent-task28-break.mjs restore`. Expected: `task28-break: restored`.
9. `corepack pnpm@11.28.5 build`. Expected: exit code 0.
10. `node --test packages/session/persistence/tests/chat-persistence.test.mjs`. Expected: PASS. The output contains `# pass 9` and `# fail 0`.

When the restore command fails, STOP. Do not repair `index.ts` by hand.

- [ ] **Step 6: Run every suite**

Run each command of the table. `test:browser-smoke` has two host timing flakes that earlier reports record: the test `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides` and the test `interactive composer: model choice, Send, live reply and Stop survive a reload; drafts stay per chat`. When one of these two tests is the only failed test, run the suite one more time. When the second run also fails, STOP.

| Suite | Command | Expected |
| --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | `# pass 19`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | `# pass 11`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | `# pass 51`, `# fail 0` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | `# pass 29`, `# fail 0` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | `# pass 11`, `# fail 0` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | `# pass 29`, `# fail 0` |
| test:research | `corepack pnpm@11.28.5 test:research` | `# pass 5`, `# fail 0` |
| test:images | `corepack pnpm@11.28.5 test:images` | `# pass 39`, `# fail 0` |
| test:outline-workflow | `corepack pnpm@11.28.5 test:outline-workflow` | `# pass 6`, `# fail 0` |
| test:brief-foundation | `corepack pnpm@11.28.5 test:brief-foundation` | `# pass 15`, `# fail 0` |
| test:deck-review | `corepack pnpm@11.28.5 test:deck-review` | `# pass 21`, `# fail 0` |
| test:generation-publication | `corepack pnpm@11.28.5 test:generation-publication` | `# pass 72`, `# fail 0` |
| test:slide-pipeline | `corepack pnpm@11.28.5 test:slide-pipeline` | `# pass 7`, `# fail 0` |
| test:session-persistence | `corepack pnpm@11.28.5 test:session-persistence` | `# pass 7`, `# fail 0` |
| test:opencode-resources | `corepack pnpm@11.28.5 test:opencode-resources` | `# pass 3`, `# fail 0` |
| test:layouts | `corepack pnpm@11.28.5 test:layouts` | `# pass 10`, `# fail 0` |
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | `# pass 14`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | `# pass 2`, `# fail 0` |

- [ ] **Step 7: Check the changed paths**

Run: `git status --short`

Expected: PASS. The output has these paths in any order, and other paths only in `docs/build/refactor/target-structure/` and `CHANGELOG.md`:

```text
 M apps/host/src/server.ts
 M apps/host/tests/research.test.mjs
 M docs/architecture/10-agent-core.md
 M docs/architecture/30-decisions.md
 M e2e/attachment-storage.test.mjs
 M e2e/local-foundation.test.mjs
 M e2e/step-approval.test.mjs
 M packages/session/persistence/src/index.ts
 M packages/session/persistence/src/schema.ts
 M packages/session/persistence/tests/chat-persistence.test.mjs
```

- [ ] **Step 8: Write the report file**

1. Mark Steps 1 to 7 as `- [x]` in this file. Change the Task 28 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-28-add-chats-version-and-notices.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-28-add-chats-version-and-notices.md` with:
   - The H1 `# Task 28: Add the chats version and change notices report` and the purpose line `Read this file to learn how sessions.sqlite gets schema 8 and how the Host sends chats notices, and the result of each check.`
   - Files changed: the list of files.
   - Commands run, with the exit code and the key output of each command.
   - The suite table of the suite step.
   - What the commands do not prove. Include at least: the Browser does not read the `chats` notice yet, and Task 29 adds it. The fields `hasDraft`, `activeRequestId`, `hasSlides` and `selectable` do not change the `version`. The upgrade test reads one schema 7 file with one chat.
3. Add a row for Task 28 in `docs/build/refactor/target-structure/reports/README.md`.
4. Run `corepack pnpm@11.28.5 check:docs`. Expected: PASS. The output contains `0 error(s)`.
5. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-28-add-chats-version-and-notices.md`. When `python` is not available, run the same script with `python3` or `python3.12`. Expected: PASS. The output contains `0 violations`.
6. Mark Step 8 as `- [x]`.

- [ ] **Step 9: Commit and push**

Do this step only when Steps 1 to 8 passed and no STOP condition occurred.

1. Add this line under `## [Unreleased]` and `### Added` in `CHANGELOG.md`, as the first line of the list:

   ```text
   - Upgrade `sessions.sqlite` to schema 8 with `change_versions`, increase the chats version in the transaction of each write that changes the chat list, and publish `{ topic: 'chats', key: 'host' }` notices on `GET /api/changes` after commit. Chat writes take no `expectedVersion`. Task 28 is `Done` in `docs/build/refactor/target-structure/plan/`.
   ```

2. Mark Step 9 as `- [x]` in this file.
3. Run: `git add -A`
4. Run: `git commit -m "feat: add the chats version and change notices"`

   Expected: PASS. The command exits with code 0. When a hook fails, STOP. Do not run the commit again with `--no-verify`.

5. Run: `git push`

   Expected: PASS. The output contains `refactor -> refactor`. When Git rejects the push, STOP. Do not use `--force`.

6. Run: `git status --short`

   Expected: PASS. No line.

**STOP** and send the report summary with the commit hash. Do not start Task 29 until a person approves the report.
