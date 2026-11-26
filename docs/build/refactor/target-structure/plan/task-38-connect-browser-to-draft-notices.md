# Task 38: Connect the Browser to draft notices and handle DRAFT_CONFLICT

Read this file to learn the steps of Task 38, which connects the Browser to `GET /api/sessions/:sessionId/changes` and handles `DRAFT_CONFLICT`.

**Type:** Code

After this task, opening a chat opens one `ChangeWatcher` to `GET /api/sessions/:sessionId/changes`. When a newer `draft` notice arrives, `DraftSync` reads the draft again. Attachments move to `ready` or `rejected` without polling, and remote text edits appear when the editor has no unsaved edit. When the editor has an unsaved local edit or when `flushDraft` gets `DRAFT_CONFLICT`, the Browser keeps the typed text. It shows the conflict message and does not send the write again. `DraftSync` has no 500 ms `setInterval` and no window `focus` listener.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `apps/web/src/browser/transport/change-client.ts`
- `apps/web/src/browser/boot.ts` (the `ChangeWatcher`, `createChatNavigation` call and `pagehide` handler)
- `apps/web/src/browser/chat-navigation.ts` (the interface `ChatNavigationOptions` and the method `open`)
- `apps/web/src/browser/draft-sync.ts`
- `e2e/browser-smoke.test.mjs` (the test `attachments survive reload and Chat switching, preview safely, reject invalid input and send without text` and the helper `openProviderChanges`)

**Files:**

- Change: `apps/web/src/browser/transport/change-client.ts`
- Change: `apps/web/src/browser/chat-navigation.ts`
- Change: `apps/web/src/browser/boot.ts`
- Change: `apps/web/src/browser/draft-sync.ts`
- Test: `e2e/browser-smoke.test.mjs`

**Interfaces:**

- In `apps/web/src/browser/transport/change-client.ts`:
  - `ChangeClient.watchSession(sessionId: string, signal: AbortSignal): AsyncGenerator<ChangeNotice>` opens `/api/sessions/${encodeURIComponent(sessionId)}/changes` and yields decoded `ChangeNotice` frames (share one private `stream(path, signal)` helper with `watch`).
- In `apps/web/src/browser/chat-navigation.ts`:
  - `ChatNavigationOptions` adds `readonly onSessionOpen?: (sessionId: string) => void`.
  - `ChatNavigation.open` calls `this.options.onSessionOpen?.(session.sessionId)` right after `this.options.deckModel.open(session.sessionId)`.
- In `apps/web/src/browser/boot.ts`:
  - Keep `let sessionWatcher: ChangeWatcher | undefined` and `let watchedSessionId: string | undefined`.
  - Add `openSessionChanges(sessionId: string): void` that closes the previous `sessionWatcher`, starts a new `ChangeWatcher` over `changeClient.watchSession(sessionId, signal)`, and calls `await draftSync.onDraftNotice(sessionId, notice.version)` when `notice.key === sessionId && notice.topic === 'draft'`.
  - Pass `onSessionOpen: openSessionChanges` to `createChatNavigation`, and call `sessionWatcher?.close()` in the `pagehide` handler.
- In `apps/web/src/browser/draft-sync.ts`:
  - Remove `attachmentTimer`, `setInterval`, `checkAttachments`, `checkingAttachments`, `onFocus`, `window.addEventListener('focus', ...)` and `syncFocusedDraft`.
  - Add `onDraftNotice(id: string, version: number): Promise<void>`:
    - Ignore when `this.disposed`, when `this.options.currentSessionId() !== id` or when `version <= (this.noticeVersions.get(id) ?? -1)`.
    - When `this.attachmentBusy.has(id)`, `this.pendingDrafts.has(id)` or `this.syncingNotices.has(id)` is true, store `Math.max(version, this.pendingNotices.get(id) ?? -1)` in `this.pendingNotices` and return.
    - Otherwise add `id` to `this.syncingNotices`, read `draft = await this.options.management.draftState(id)`, record `this.noticeVersions.set(id, Math.max(version, this.noticeVersions.get(id) ?? -1))`, then apply `draft`:
      - If `this.options.currentSessionId() === id && !this.pendingDrafts.has(id) && this.options.input.value === (this.draftStates.get(id)?.text ?? '')`: set `this.drafts.set(id, draft.text)`, set `this.options.input.value = draft.text` when different, and call `this.receiveDraft(draft, true)`.
      - Otherwise call `this.receiveDraft(draft, false)` (which keeps the user's text and shows the conflict message when `draft.text` changed).
    - In `finally`, remove `id` from `this.syncingNotices` and drain `this.pendingNotices` if a newer version arrived.
  - Drain `this.pendingNotices` in `finally` of `uploadAttachments`, `removeAttachment` and `flushDraft` (when `this.pendingNotices.get(id)` exists, remove it and call `void this.onDraftNotice(id, pending)`).
  - In `flushDraft` `catch (error)`: when `error instanceof ManagementError && error.message === 'DRAFT_CONFLICT'`, set `this.options.status.textContent` to `'Bản nháp đã đổi ở giao diện khác. Giữ nội dung đang soạn và mở lại chat để đối chiếu trước khi lưu hoặc gửi.'` and return `false` without resending.
  - In `removeAttachment`: add a `catch (error)` block that reloads `await this.options.management.draftState(id)` into `this.receiveDraft(...)` (ignoring a secondary read error) before rethrowing `error`.

**STOP when:** a test of Step 2 passes before Step 3.

**Forbidden:** re-add `setInterval` or `focus` polling in `draft-sync.ts`. Overwrite unsaved user text on `DRAFT_CONFLICT`.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 37 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Write the failing tests**

Add these two tests at the end of `e2e/browser-smoke.test.mjs`:

```js
test('Browser updates the open draft from the draft notice of /api/sessions/:sessionId/changes', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-draft-changes-'))
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
    () => evaluate(`!!document.querySelector('.chat-navigation nav button[aria-current=true]')`),
    'Browser boot failed',
  )
  const sessionId = await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`)
  await delay(300)
  const saved = await fetch(`${state.app.origin}/api/sessions/${sessionId}/draft`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${state.app.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Draft from another client', expectedRevision: 0 }),
  })
  assert.equal(saved.status, 200)
  await eventually(
    () => evaluate(`document.querySelector('.composer textarea').value === 'Draft from another client'`),
    'Browser did not show the draft text from the draft notice',
  )
  const form = new FormData()
  form.append('expectedRevision', '1')
  form.append('file', new Blob(['remote evidence']), 'remote.txt')
  const uploaded = await fetch(`${state.app.origin}/api/sessions/${sessionId}/attachments`, {
    method: 'POST',
    headers: { authorization: `Bearer ${state.app.token}` },
    body: form,
  })
  assert.equal(uploaded.status, 202)
  await eventually(
    () => evaluate(`document.querySelector('.attachment-row')?.dataset.state === 'ready'`),
    'Browser did not show the ready attachment from the draft notice',
  )
})

test('A draft save after a change in another client gets DRAFT_CONFLICT, keeps the typed text and does not send again', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-draft-conflict-'))
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
    () => evaluate(`!!document.querySelector('.chat-navigation nav button[aria-current=true]')`),
    'Browser boot failed',
  )
  const sessionId = await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`)
  await delay(300)
  await evaluate(`{
    const original = window.fetch;
    window.__draftPuts = 0;
    window.fetch = async (url, init) => {
      if (String(url).endsWith('/draft') && init?.method === 'PUT') window.__draftPuts += 1;
      return original(url, init);
    };
    const input = document.querySelector('.composer textarea');
    input.value = 'Local unsaved edit';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  } true`)
  const remote = await fetch(`${state.app.origin}/api/sessions/${sessionId}/draft`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${state.app.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Remote edit', expectedRevision: 0 }),
  })
  assert.equal(remote.status, 200)
  await eventually(() => evaluate('window.__draftPuts === 1'), 'Browser did not send the draft save')
  await eventually(
    () =>
      evaluate(
        `document.querySelector('.request-status[role=status]')?.textContent.includes('Bản nháp đã đổi ở giao diện khác')`,
      ),
    'Browser did not show the DRAFT_CONFLICT message',
  )
  await delay(400)
  assert.equal(
    await evaluate(`document.querySelector('.composer textarea').value`),
    'Local unsaved edit',
    'DRAFT_CONFLICT must keep the user text',
  )
  assert.equal(await evaluate('window.__draftPuts'), 1, 'The Browser must not send a stale draft write again')
})
```

Run: `corepack pnpm@11.28.5 build`, then `node --test --test-name-pattern="draft notice|DRAFT_CONFLICT" e2e/browser-smoke.test.mjs`

Expected: FAIL. The output contains `# fail 2`.

- [x] **Step 3: Write the code**

Do the changes of the section `Interfaces`.

Run: `git grep -n -E "setInterval|checkAttachments|syncFocusedDraft" -- apps/web/src/browser/draft-sync.ts`

Expected: PASS. No line.

Run: `corepack pnpm@11.28.5 build`, then `node --test --test-name-pattern="draft notice|DRAFT_CONFLICT" e2e/browser-smoke.test.mjs`

Expected: PASS. The output contains `# fail 0`.

- [x] **Step 4: Break the code and make sure that the tests fail**

1. In `boot.ts`, remove the `if (notice.topic === 'draft')` call inside `openSessionChanges`. Build and run `node --test --test-name-pattern="draft notice" e2e/browser-smoke.test.mjs`. Expected: FAIL. `# fail 1`. Undo the change.
2. In `draft-sync.ts`, remove the `DRAFT_CONFLICT` branch in `flushDraft` and disable `onDraftNotice` temporarily (return immediately). Build and run `node --test --test-name-pattern="DRAFT_CONFLICT" e2e/browser-smoke.test.mjs`. Expected: FAIL. `# fail 1`. Undo the change.

- [x] **Step 5: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [x] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: the tests use one Browser tab and one HTTP client, not two Browser tabs.
- `CHANGELOG.md` line: ``- Connect the Browser to `GET /api/sessions/:sessionId/changes` for `draft` notices, remove the 500 ms attachment poll and window focus sync from `DraftSync`, and keep unsaved text with a clear message on `DRAFT_CONFLICT` without resending. Task 38 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: connect the Browser to draft notices and handle DRAFT_CONFLICT`
