# Task 46: Connect the Browser to brief and outline change notices

Read this file to learn the steps of Task 46, which connects the Browser session change watcher to `brief` and `outline` notices on `GET /api/sessions/:sessionId/changes`.

**Type:** Code

After this task, a newer `brief` notice on `GET /api/sessions/:sessionId/changes` makes the Browser refresh the open chat's Brief and interview view without a reload. A newer `outline` notice makes the Browser refresh the open chat's Outline proposals and Brief view without a reload. `DeckModel` keeps its existing `GET /api/sessions/:sessionId/deck/events` stream unchanged until Phase 5.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `apps/web/src/browser/boot.ts` (the function `openSessionChanges`)
- `apps/web/src/browser/features/deck/deck-workflow-view.ts` (the methods `open`, `refresh` and `render`)
- `apps/web/src/browser/chat-navigation.ts` (the method `showOutlines`)
- `e2e/browser-smoke.test.mjs` (the `draft notice` test)

**Files:**

- Change: `apps/web/src/browser/features/deck/deck-workflow-view.ts`
- Change: `apps/web/src/browser/boot.ts`
- Test: `e2e/browser-smoke.test.mjs`

**Interfaces:**

- In `apps/web/src/browser/features/deck/deck-workflow-view.ts`:
  - Add `get briefVersion(): number | undefined { return this.state?.brief.version }`.
  - In `refresh(id: string)`: keep existing behavior. When `this.state` already exists and `next.brief.version > 0`, also set `this.active = true` when `changed` is true so a remote Brief write reveals the updated Brief summary in an open chat.
- In `apps/web/src/browser/boot.ts`, inside `openSessionChanges(sessionId: string)` `onNotice`:
  - Return early when `watchedSessionId !== sessionId || notice.key !== sessionId`.
  - When `notice.topic === 'draft'`, return `draftSync.onDraftNotice(sessionId, notice.version)`.
  - When `notice.topic === 'brief'`:
    - Return when `workflow.briefVersion === undefined || notice.version <= workflow.briefVersion`.
    - Run `await workflow.refresh(sessionId)` and then `controls()`.
  - When `notice.topic === 'outline'`:
    - Return when `navigation.outlineState?.sessionId !== sessionId || notice.version <= navigation.outlineState.version`.
    - Return `navigation.showOutlines(sessionId, navigation.generation)`.

**STOP when:** the new test of Step 2 passes before Step 3.

**Forbidden:** remove or change `DeckModel`'s `GET /api/sessions/:sessionId/deck/events` connection. Refresh a chat other than the open chat.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 45 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Write the failing test**

Add this test at the end of `e2e/browser-smoke.test.mjs`:

```js
test('Browser updates Brief and Outline views from brief and outline notices on /api/sessions/:sessionId/changes', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-brief-outline-changes-'))
  const state = {}
  t.after(async () => {
    try {
      await closeBrowser(state.session)
      if (state.app) await state.app.close()
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
    }
  })
  state.session = await openBrowser(dir)
  state.app = await startLocalWeb({ dataDir: join(dir, 'data'), home: join(dir, 'home') })
  const { protocol, evaluate } = state.session
  await protocol.call('Page.enable')
  await protocol.call('Page.navigate', { url: `${state.app.origin}/#token=${state.app.token}` })
  await eventually(
    () => evaluate(`!!document.querySelector('[data-session-id]')`),
    'Browser did not open initial chat',
  )
  const sessionId = await evaluate(`document.querySelector('[data-session-id][aria-current="true"]').dataset.sessionId`)
  await delay(300)
  const headers = { authorization: `Bearer ${state.app.token}`, 'content-type': 'application/json' }
  const first = await fetch(`${state.app.origin}/api/sessions/${sessionId}/brief`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ expectedVersion: 0, draft: brief() }),
  })
  assert.equal(first.status, 200)
  await eventually(
    () => evaluate(`document.querySelector('.deck-workflow details summary')?.textContent?.includes('v1') === true`),
    'Browser did not refresh Brief from brief notice',
  )
  const updated = brief()
  updated.topic = 'Updated Brief Topic'
  const second = await fetch(`${state.app.origin}/api/sessions/${sessionId}/brief`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ expectedVersion: 1, draft: updated }),
  })
  assert.equal(second.status, 200)
  await eventually(
    () =>
      evaluate(
        `document.querySelector('.deck-workflow details summary')?.textContent?.includes('v2') === true && document.querySelector('.deck-workflow details').textContent.includes('Updated Brief Topic')`,
      ),
    'Browser did not show second Brief version from brief notice',
  )
})
```

Run: `corepack pnpm@11.28.5 build`, then `node --test --test-name-pattern="brief and outline notices" e2e/browser-smoke.test.mjs`

Expected: FAIL. The output contains `# fail 1`.

- [x] **Step 3: Write the code**

Do the changes of the section `Interfaces`. Run `corepack pnpm@11.28.5 build`, then `node --test --test-name-pattern="brief and outline notices" e2e/browser-smoke.test.mjs`.

Expected: PASS. The output contains `# fail 0`.

- [x] **Step 4: Break the code and make sure that the test fails**

In `apps/web/src/browser/boot.ts`, remove the `notice.topic === 'brief'` branch from `openSessionChanges`. Build and run `node --test --test-name-pattern="brief and outline notices" e2e/browser-smoke.test.mjs`. Expected: FAIL. `# fail 1`. Undo the change and run `corepack pnpm@11.28.5 exec tsc -b --force`.

- [x] **Step 5: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [x] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: the test exercises a remote `brief` write over HTTP and one Browser tab. It does not test two Browser tabs or a live remote `outline` write in Chromium (covered at the store and SSE level in Task 45).
- `CHANGELOG.md` line: ``- Connect the Browser session change watcher on `GET /api/sessions/:sessionId/changes` to `brief` and `outline` notices so remote Brief and Outline changes refresh the open view without reload. Task 46 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: refresh Browser Brief and Outline views from session change notices`
