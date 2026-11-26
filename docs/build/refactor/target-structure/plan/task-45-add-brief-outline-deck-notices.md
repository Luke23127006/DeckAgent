# Task 45: Fix deck notify versions and publish brief, outline and deck change notices

Read this file to learn the steps of Task 45, which fixes the three hardcoded `notify(..., 1)` calls and publishes `brief`, `outline` and `deck` change notices on `GET /api/sessions/:sessionId/changes`.

**Type:** Code

After this task, `DeckStore` reads the committed `decks.version` inside the SQL transaction for every `notify` call instead of passing `1`. `DeckStore` calls optional `onDeckChanged`, `onBriefChanged` and `onOutlineChanged` callbacks after `COMMIT` on every committed write, and never on idempotent replay or failed writes. `GET /api/sessions/:sessionId/changes` sends initial versions and live notices for `draft`, `brief`, `outline` and `deck`. `GET /api/sessions/:sessionId/deck/events` stays unchanged.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/ste-vi/SKILL.md`
- `packages/presentation/deck/src/generation-contracts.ts`, `deck-runtime.ts`, `deck-authoring.ts`, `deck-generation.ts`, `deck-store.ts`, `generation-store.ts`, `outline-store.ts`
- `apps/host/src/server.ts` (the functions `createDeckStore` and `createHostOptions`)
- `packages/presentation/deck/tests/deck-service.test.mjs`, `apps/host/tests/brief-host.test.mjs` and `e2e/attachment-admission.test.mjs`
- `docs/architecture/10-agent-core.md` (the sections `Aggregate và change notice` and `Rủi ro và điểm còn mở`)

**Files:**

- Change: `packages/presentation/deck/src/generation-contracts.ts`, `deck-runtime.ts`, `deck-authoring.ts`, `deck-generation.ts`, `deck-store.ts`
- Change: `apps/host/src/server.ts`
- Change: `docs/architecture/10-agent-core.md`
- Test: `packages/presentation/deck/tests/deck-service.test.mjs`, `apps/host/tests/brief-host.test.mjs`, `e2e/attachment-admission.test.mjs`

**Interfaces:**

- In `packages/presentation/deck/src/generation-contracts.ts`, `DeckOptions` adds:
  - `readonly onDeckChanged?: (sessionId: string, version: number) => void`
  - `readonly onBriefChanged?: (sessionId: string, version: number) => void`
  - `readonly onOutlineChanged?: (sessionId: string, version: number) => void`
- In `packages/presentation/deck/src/deck-runtime.ts`:
  - Constructor accepts optional third parameter `onDeckChanged?: (sessionId: string, version: number) => void`.
  - `notify(sessionId, version)` calls each listener and then calls `this.onDeckChanged?.(sessionId, version)` inside a `try/catch` so a transport error cannot fail the commit.
- In `packages/presentation/deck/src/deck-authoring.ts` and `deck-generation.ts`:
  - `AuthoringHost` and `GenerationHost` add `notifyBrief(sessionId: string, version: number): void` and `notifyOutline(sessionId: string, version: number): void`.
  - `insertPlan(sessionId, plan)` returns `number | null`: return `null` when `existing` matches, or `Number(host.db.prepare('SELECT version FROM decks WHERE session_id=?').get(sessionId)!.version)` after `INSERT`.
  - `confirm`: capture `const version = host.transaction(() => this.insertPlan(sessionId, plan))`. When `version !== null`, call `host.notify(sessionId, version)`.
  - `confirmOutline`: inside `host.transaction`, run `insertPlan` and `outlines.confirm`, and return `{ deckVersion: deckVersion(host.db, sessionId), outlineVersion: Number(host.db.prepare('SELECT version FROM outline_heads WHERE session_id=?').get(sessionId)!.version) }`. After commit, call `host.notifyOutline(sessionId, versions.outlineVersion)` and `host.notify(sessionId, versions.deckVersion)`.
  - `confirmGeneration`: inside `host.transaction`, return `{ receipt, fresh, deckVersion, outlineVersion }`. After commit, when `fresh`, call `host.notifyOutline(sessionId, result.outlineVersion)` and `host.notify(sessionId, result.deckVersion)`.
  - `saveBrief`: call `host.notifyBrief(sessionId, record.version)` after commit.
  - `proposeBoundOutline` and `proposeOutline`: call `host.notifyOutline(sessionId, proposal.version)` after commit.
  - `cancelOutline`: return committed `outline_heads.version` from the transaction and call `host.notifyOutline(sessionId, version)` after commit.
  - `commitBriefProposal`: track `fresh = false` and `outlineVersion: number | undefined` inside the transaction. Set `fresh = true` only after `host.briefs.save` (never on receipt replay). After commit, when `fresh`, call `host.notifyBrief(sessionId, brief.version)` and when `outlineVersion !== undefined`, call `host.notifyOutline(sessionId, outlineVersion)`.
- In `packages/presentation/deck/src/deck-store.ts`:
  - Add `briefHeadVersion(sessionId: string): number`, `outlineHeadVersion(sessionId: string): number` and `deckHeadVersion(sessionId: string): number` (each reads `SELECT version FROM <tableName> WHERE session_id=?` inside `this.runtime.access` after `this.runtime.id(sessionId)`, returning `row ? Number(row.version) : 0`).
- In `apps/host/src/server.ts`:
  - Pass `changeFeed` to `createDeckStore`, and wire `onDeckChanged`, `onBriefChanged` and `onOutlineChanged` to `changeFeed.publish({ topic, key: sessionId, version })`.
  - In `createHostOptions`, set `changes.sessionTopics` to `draft`, `brief` (`decks.briefHeadVersion`), `outline` (`decks.outlineHeadVersion`) and `deck` (`decks.deckHeadVersion`).

**STOP when:** a new test of Step 2 passes before Step 3.

**Forbidden:** publish any notice before `COMMIT`, on idempotent replay or on a refused write. Hardcode `1` in any `notify` call.

## Existing test and doc changes

- In `e2e/attachment-admission.test.mjs`, in `draft writes and attachment preparation send draft notices on /api/sessions/:sessionId/changes without changing revision on ready`, right after `assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 0 })`, assert the three new initial notices `{ topic: 'brief', key: id, version: 0 }`, `{ topic: 'outline', key: id, version: 0 }` and `{ topic: 'deck', key: id, version: 0 }`.
- In `docs/architecture/10-agent-core.md`:
  - Update the `Hiện tại` cells of `deck`, `brief`, `outline`, `chats` and `workspaces` in `## Aggregate và change notice` to match the current implementation (committed `version` and notices on `GET /api/changes` and `GET /api/sessions/:sessionId/changes`, and `deck` keeping `GET /api/sessions/:sessionId/deck/events`).
  - Remove the bullet about the three hardcoded `notify(..., 1)` calls in `## Rủi ro và điểm còn mở`.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 44 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Write the failing tests**

Add this test at the end of `packages/presentation/deck/tests/deck-service.test.mjs` (import `brief` from `./fixtures/brief.mjs`):

```js
test('deck, brief and outline writes emit committed versions after commit and stay silent on replay or failure', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-notices-'))
  const events = []
  const decks = new DeckStore(join(dir, 'decks.sqlite'), {
    legacyHtmlPolicy: validateLegacySlideHtml,
    onDeckChanged: (sessionId, version) => events.push({ topic: 'deck', sessionId, version }),
    onBriefChanged: (sessionId, version) => events.push({ topic: 'brief', sessionId, version }),
    onOutlineChanged: (sessionId, version) => events.push({ topic: 'outline', sessionId, version }),
  })
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  assert.deepEqual([decks.briefHeadVersion('chat'), decks.outlineHeadVersion('chat'), decks.deckHeadVersion('chat')], [0, 0, 0])
  const saved = decks.saveBrief('chat', { expectedVersion: 0, draft: brief() })
  assert.throws(() => decks.saveBrief('chat', { expectedVersion: 0, draft: brief() }), { code: 'BRIEF_STALE' })
  const proposal = decks.proposeOutline('legacy', {
    requestId: 'req-1',
    responseIndex: 1,
    draft: { overview: 'Plan', slides: [{ title: 'One', content: 'Body' }] },
  })
  decks.confirmOutline('legacy', { outlineId: proposal.outlineId, version: proposal.version })
  decks.confirm('chat', plan)
  decks.confirm('chat', plan)
  assert.deepEqual(events, [
    { topic: 'brief', sessionId: 'chat', version: saved.version },
    { topic: 'outline', sessionId: 'legacy', version: 1 },
    { topic: 'outline', sessionId: 'legacy', version: 2 },
    { topic: 'deck', sessionId: 'legacy', version: 1 },
    { topic: 'deck', sessionId: 'chat', version: 1 },
  ])
  assert.deepEqual([decks.briefHeadVersion('chat'), decks.outlineHeadVersion('legacy'), decks.deckHeadVersion('chat')], [1, 2, 1])
})
```

Add this test at the end of `apps/host/tests/brief-host.test.mjs` (import `request` from `node:http`):

```js
test('GET /api/sessions/:sessionId/changes emits initial and live brief notices and stays silent on BRIEF_STALE', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'brief-changes-'))
  const f = await startApp(dir)
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const id = (await f.call('sessions', 'POST', {})).data.sessionId
  const { port, host } = new URL(f.app.origin)
  const stream = await new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port, path: `/api/sessions/${id}/changes`, headers: { host, authorization: `Bearer ${f.app.token}` } },
      res => resolve({ req, res }),
    )
    req.on('error', reject)
    req.end()
  })
  t.after(() => stream.req.destroy())
  let buffer = ''
  const queued = []
  const waiters = []
  stream.res.on('data', chunk => {
    buffer += chunk.toString('utf8')
    let cut = buffer.indexOf('\n\n')
    while (cut >= 0) {
      const data = buffer.slice(0, cut).split('\n').find(line => line.startsWith('data: '))?.slice(6)
      buffer = buffer.slice(cut + 2)
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
  assert.deepEqual(await nextNotice(), { topic: 'brief', key: id, version: 0 })
  assert.deepEqual(await nextNotice(), { topic: 'outline', key: id, version: 0 })
  assert.deepEqual(await nextNotice(), { topic: 'deck', key: id, version: 0 })
  assert.equal((await f.call(`sessions/${id}/brief`, 'PUT', { expectedVersion: 0, draft: brief() })).status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'brief', key: id, version: 1 })
  assert.equal((await f.call(`sessions/${id}/brief`, 'PUT', { expectedVersion: 0, draft: brief() })).status, 409)
  assert.equal((await f.call(`sessions/${id}/brief`, 'PUT', { expectedVersion: 1, draft: brief() })).status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'brief', key: id, version: 2 })
})
```

Run: `corepack pnpm@11.28.5 build`, then `node --test packages/presentation/deck/tests/deck-service.test.mjs apps/host/tests/brief-host.test.mjs`

Expected: FAIL. Both new tests fail (exit code 1).

- [ ] **Step 3: Write the code and check no hardcoded notify stays**

Do the changes of the sections `Interfaces` and `Existing test and doc changes`. Run `git grep -n "notify(.*, 1)" -- packages/presentation/deck/src`.

Expected: PASS. No line.

Run: `corepack pnpm@11.28.5 build`, then `node --test packages/presentation/deck/tests/deck-service.test.mjs apps/host/tests/brief-host.test.mjs e2e/attachment-admission.test.mjs`

Expected: PASS. The output contains `# fail 0`.

- [ ] **Step 4: Break the code and make sure that the tests fail**

In `packages/presentation/deck/src/deck-authoring.ts`, remove `host.notifyBrief(sessionId, record.version)` from `saveBrief`. Build and run `node --test --test-timeout=15000 packages/presentation/deck/tests/deck-service.test.mjs`. Expected: FAIL. Undo the change and run `corepack pnpm@11.28.5 exec tsc -b --force`.

- [ ] **Step 5: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [ ] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: the Browser does not react to `brief` and `outline` notices on `GET /api/sessions/:sessionId/changes` yet.
- `CHANGELOG.md` line: ``- Fix the three hardcoded `notify(..., 1)` calls in `@deckagent/deck` and publish `brief`, `outline` and `deck` change notices on `GET /api/sessions/:sessionId/changes`. Task 45 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: publish brief, outline and deck notices on session change stream`
