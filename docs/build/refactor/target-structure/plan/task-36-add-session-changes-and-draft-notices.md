# Task 36: Add session change route and draft change notices

Read this file to learn the steps of Task 36, which adds `GET /api/sessions/:sessionId/changes` and publishes `draft` notices after each draft write and each attachment settlement.

**Type:** Code

After this task, `GET /api/sessions/:sessionId/changes` streams chat-scoped change notices over the shared `ChangeFeed` and `routes.streams`. Every committed write in `MemoryDraftStore` increases the per-chat notice version and publishes `{ topic: 'draft', key: sessionId, version }`. Background attachment settlement (`ready` and `reject`) also increases the per-chat notice version and publishes a `draft` notice, without changing `draft.revision`, so background preparation never causes `DRAFT_CONFLICT`.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/ste-vi/SKILL.md`
- `apps/host/src/http/change-feed.ts` and `apps/host/src/http/start-host.ts`
- `apps/host/src/modules/attachments/draft.store.ts`, `attachments.store.ts` (the method `receive`) and `attachments.service.ts` (the methods `upload` and `prepare`)
- `apps/host/src/server.ts` (the functions `createHostOptions` and `startLocalWeb`)
- `apps/host/tests/change-feed.test.mjs` and `e2e/attachment-admission.test.mjs`
- `docs/architecture/10-agent-core.md` (the section `Aggregate vÃ  change notice`)

**Files:**

- Change: `apps/host/src/http/change-feed.ts`, `apps/host/src/http/start-host.ts`
- Change: `apps/host/src/modules/attachments/draft.store.ts`, `attachments.store.ts`, `attachments.service.ts`
- Change: `apps/host/src/server.ts`, `docs/architecture/10-agent-core.md`
- Test: `apps/host/tests/change-feed.test.mjs`, `e2e/attachment-admission.test.mjs`

**Interfaces:**

- In `apps/host/src/http/change-feed.ts`:
  - `export interface SessionChangeTopic { readonly topic: ChangeTopic; version(sessionId: string): number }`
  - `export interface SessionChangeRoutesOptions { readonly topics: readonly SessionChangeTopic[]; readonly exists?: (sessionId: string) => Promise<boolean> }`
  - `createChangeRoutes(feed: ChangeFeed, hostTopics: readonly HostChangeTopic[], streams: Set<ServerResponse>, session?: SessionChangeRoutesOptions): Router`
- In `apps/host/src/http/start-host.ts`:
  - `StartHostOptions.changes` adds `readonly sessionTopics?: readonly SessionChangeTopic[]` and `readonly sessionExists?: (sessionId: string) => Promise<boolean>`.
- In `apps/host/src/modules/attachments/draft.store.ts`:
  - `MemoryDraftStore`: `constructor(onChanged?: (sessionId: string, version: number) => void)`
  - `version(chatId: string): number` returns the current notice version (`0` before any change).
  - `touch(chatId: string): number` increases the notice version by `1`, calls `onChanged?.(chatId, next)` and returns `next`. It does not change `draft.revision`.
  - `save(...)`: calls `this.touch(chatId)` after `this.drafts.set(chatId, next)`.
- In `apps/host/src/modules/attachments/attachments.service.ts`:
  - `AttachmentCoordinator.draftVersion(id: string): number` returns `this.drafts.version(id)`.

**STOP when:** a test of Step 2 passes before Step 3.

**Forbidden:** change `draft.revision` inside `touch()`, `prepare()` or `reject()`. Open a second stream set instead of `routes.streams`.

## Notice rules

- `GET /api/sessions/:sessionId/changes`: use `params({ sessionId: /^[\w-]{1,100}$/ })`. When `session?.exists` returns `false`, throw `new HttpError(404, 'SESSION_NOT_FOUND')`. Subscribe to each topic with key `sessionId` before reading initial versions. Open the stream with `openSseStream(res, streams, unsubscribeAll)` and send each initial `{ topic, key: sessionId, version }` notice.
- `attachments.store.ts` (`receive` `catch` block): call `this.drafts.touch(input.sessionId)` right after `this.log.reject(input.sessionId, item.attachmentId, code)`.
- `attachments.service.ts`:
  - `upload` `catch` block: call `this.drafts.touch(input.sessionId)` right after `this.store.attachments.reject(...)`.
  - `prepare`: call `this.drafts.touch(id)` right after `this.store.attachments.ready(...)` and right after `this.store.attachments.reject(...)`.
- `server.ts`:
  - `const drafts = new MemoryDraftStore((key, version) => changeFeed.publish({ topic: 'draft', key, version }))`
  - In `changes`: add `sessionExists: async id => !!(await sessions.getInfo(id))` and `sessionTopics: [{ topic: 'draft', version: id => runtime.inputs.draftVersion(id) }]`.
- `docs/architecture/10-agent-core.md`: in the row `draft`, change the cell `Hiá»‡n táº¡i` to `CÃ³ notice \`draft\` trÃªn \`GET /api/sessions/:sessionId/changes\` (phiÃªn báº£n notice riÃªng vá»›i \`revision\` cá»§a draft). Browser nháº­n notice thay cho poll 500 ms`.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 35 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Write the failing tests**

Add this test at the end of `apps/host/tests/change-feed.test.mjs`:

```js
test('GET /api/sessions/:sessionId/changes checks auth and existence, sends initial versions, isolates keys and shares the 64-stream limit', async t => {
  const feed = createChangeFeed()
  const versions = new Map([['chat-a', 2]])
  const host = await startHost({
    readHistory: async () => [],
    changes: {
      feed,
      hostTopics: [{ topic: 'workspaces', version: () => 0 }],
      sessionExists: async id => id === 'chat-a',
      sessionTopics: [{ topic: 'draft', version: id => versions.get(id) ?? 0 }],
    },
  })
  t.after(() => host.close())

  assert.equal((await fetch(`${host.origin}/api/sessions/chat-a/changes`)).status, 401)
  const missing = await fetch(`${host.origin}/api/sessions/missing/changes`, {
    headers: { authorization: `Bearer ${host.token}` },
  })
  assert.equal(missing.status, 404)
  assert.equal((await missing.json()).error.code, 'SESSION_NOT_FOUND')

  const stream = await openStream(host, '/api/sessions/chat-a/changes')
  t.after(() => stream.req.destroy())
  assert.equal(stream.res.statusCode, 200)
  assert.equal(await readNextEvent(stream.res), 'event: change\ndata: {"topic":"draft","key":"chat-a","version":2}')

  const next = readNextEvent(stream.res)
  feed.publish({ topic: 'draft', key: 'chat-b', version: 1 })
  feed.publish({ topic: 'draft', key: 'chat-a', version: 3 })
  assert.equal(await next, 'event: change\ndata: {"topic":"draft","key":"chat-a","version":3}')
})
```

Add this test at the end of `e2e/attachment-admission.test.mjs` (import `request` from `node:http` at the top of the file):

```js
test('draft writes and attachment preparation send draft notices on /api/sessions/:sessionId/changes without changing revision on ready', async t => {
  const { api, app, id } = await fixture(t)
  const { port, host } = new URL(app.origin)
  const stream = await new Promise((resolve, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port,
        path: `/api/sessions/${id}/changes`,
        headers: { host, authorization: `Bearer ${app.token}` },
      },
      res => resolve({ req, res }),
    )
    req.on('error', reject)
    req.end()
  })
  t.after(() => stream.req.destroy())
  assert.equal(stream.res.statusCode, 200)
  let buffer = ''
  const queued = []
  const waiters = []
  stream.res.on('data', chunk => {
    buffer += chunk.toString('utf8')
    let cut = buffer.indexOf('\n\n')
    while (cut >= 0) {
      const frame = buffer.slice(0, cut)
      buffer = buffer.slice(cut + 2)
      const data = frame.split('\n').find(line => line.startsWith('data: '))?.slice(6)
      if (data) {
        const notice = JSON.parse(data)
        const waiter = waiters.shift()
        if (waiter) waiter(notice)
        else queued.push(notice)
      }
      cut = buffer.indexOf('\n\n')
    }
  })
  const nextNotice = () =>
    queued.length ? Promise.resolve(queued.shift()) : new Promise(resolve => waiters.push(resolve))

  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 0 })
  const saved = await api(`sessions/${id}/draft`, 'PUT', { text: 'Hello', expectedRevision: 0 })
  assert.equal(saved.status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 1 })
  assert.equal((await api(`sessions/${id}/draft`, 'PUT', { text: 'stale', expectedRevision: 0 })).status, 409)

  const form = new FormData()
  form.append('expectedRevision', String(saved.data.revision))
  form.append('file', new Blob(['evidence']), 'notes.txt')
  const uploaded = await api(`sessions/${id}/attachments`, 'POST', form)
  assert.equal(uploaded.status, 202)
  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 2 })
  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 3 })
  const afterReady = await api(`sessions/${id}/draft`)
  assert.equal(afterReady.data.attachments[0].state, 'ready')
  assert.equal(afterReady.data.revision, uploaded.data.draft.revision, 'Preparation keeps draft.revision')

  const removed = await api(`sessions/${id}/attachments/${uploaded.data.attachment.attachmentId}`, 'DELETE', {
    expectedRevision: uploaded.data.draft.revision,
  })
  assert.equal(removed.status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 4 })
})
```

Run: `corepack pnpm@11.28.5 build`, then `node --test apps/host/tests/change-feed.test.mjs e2e/attachment-admission.test.mjs`

Expected: FAIL. The output contains `# fail 2`.

- [x] **Step 3: Write the code**

Do the changes of the sections `Interfaces` and `Notice rules`. Run the commands of Step 2.

Expected: PASS. The output contains `# fail 0`.

- [x] **Step 4: Break the code and make sure that the tests fail**

1. In `attachments.service.ts`, remove `this.drafts.touch(id)` after `this.store.attachments.ready(...)`. Build and run `node --test e2e/attachment-admission.test.mjs` with a 15-second timeout or wait for the test timeout. Expected: FAIL (timeout or `# fail 1`). Undo the change.
2. In `draft.store.ts`, remove `this.touch(chatId)` from `save`. Build and run `node --test e2e/attachment-admission.test.mjs`. Expected: FAIL. Undo the change.

- [x] **Step 5: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [x] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: the Browser still uses its 500 ms poll and does not open `/api/sessions/:sessionId/changes` yet. Task 38 adds it.
- `CHANGELOG.md` line: ``- Add `GET /api/sessions/:sessionId/changes` to the Host `ChangeFeed`, track a per-chat draft notice version in `MemoryDraftStore` apart from `draft.revision`, and publish `draft` notices after each draft write and attachment settlement. Task 36 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: add session change route and draft change notices`
