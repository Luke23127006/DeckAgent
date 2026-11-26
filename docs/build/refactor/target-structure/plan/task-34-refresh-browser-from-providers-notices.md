# Task 34: Refresh the Browser from providers notices

Read this file to learn the steps of Task 34, which makes the Browser react to `providers` notices and to `PROVIDERS_STALE`.

**Type:** Code

After this task, a newer `providers` notice makes the Browser call `navigation.refresh()`, which reads the settings and the chat list again. The model picker and `selectable` in the chat list then show the change. An open settings dialog keeps the values in its form. When a save or a removal gets `PROVIDERS_STALE`, the dialog reads the settings again, fills the form from the saved values and shows a message. The Browser does not send the write again.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `apps/web/src/browser/boot.ts` (the `onNotice` function of `ChangeWatcher`)
- `apps/web/src/browser/features/providers/settings-panel.ts` (the functions `perform` and `refresh`)
- `apps/web/src/browser/features/providers/provider-errors.ts` (the function `saveFailure`)
- `e2e/browser-smoke.test.mjs` (the functions `eventually`, `openBrowser`, `closeBrowser` and `fixtureProvider`, and the test `Browser shows a chat that another client creates, from the chats notice of /api/changes`)

**Files:**

- Change: `apps/web/src/browser/boot.ts`, `apps/web/src/browser/features/providers/settings-panel.ts`, `apps/web/src/browser/features/providers/provider-errors.ts`
- Test: `e2e/browser-smoke.test.mjs`

**Interfaces:**

- In `onNotice` of `boot.ts`, before the line `if (notice.topic !== 'workspaces') return`: when `notice.topic === 'providers'`, return when `notice.version <= navigation.settings.providersVersion`. Otherwise run `await navigation.refresh()`, then `controls()`, then return.
- In `perform` of `settings-panel.ts`: when the error is a `ManagementError` with the message `PROVIDERS_STALE`, run `await refresh(panel, panel.dom.chooser.value).catch(() => {})` before the line that writes `saveFailure(error)` to the message.
- In `saveFailure`: `if (code === 'PROVIDERS_STALE') return 'Cấu hình provider vừa thay đổi ở nơi khác. Cài đặt đã được làm mới, hãy kiểm tra rồi thử lại. Chưa lưu gì.'`

**STOP when:** a test of Step 2 passes before Step 3.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 33 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Write the failing tests**

Add these two tests to `e2e/browser-smoke.test.mjs`, after the test `Browser shows a chat that another client creates, from the chats notice of /api/changes`:

```js
async function openProviderChanges(t, name) {
  const dir = await mkdtemp(join(tmpdir(), `deckagent-${name}-`))
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
  const providerAccess = { check: async () => {}, catalog: async () => [] }
  const options = { dataDir: join(dir, 'data'), home: join(dir, 'home'), ...fixtureProvider('providers'), providerAccess }
  state.app = await startLocalWeb(options)
  const { protocol, evaluate } = state.session
  await protocol.call('Page.enable')
  await protocol.call('Page.navigate', { url: `${state.app.origin}/#token=${state.app.token}` })
  await eventually(
    () => evaluate(`!!document.querySelector('.chat-navigation nav button[aria-current=true]')`),
    'Browser boot failed',
  )
  const saveOther = async () => {
    const response = await fetch(`${state.app.origin}/api/providers/other`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${state.app.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Other',
        protocol: 'chat-completions',
        baseUrl: 'http://127.0.0.1:1',
        models: ['other-model'],
        new: true,
        expectedVersion: 0,
      }),
    })
    assert.equal(response.status, 200)
  }
  const pickerShowsOther = () =>
    eventually(
      () =>
        evaluate(
          `[...document.querySelector('.composer select').options].some(option => option.value === ${JSON.stringify(JSON.stringify({ provider: 'other', model: 'other-model' }))})`,
        ),
      'Browser did not show the provider of another client after the providers notice',
    )
  return { evaluate, saveOther, pickerShowsOther }
}

test('Browser shows a provider that another client saves, from the providers notice of /api/changes', {
  timeout: 60000,
}, async t => {
  const { saveOther, pickerShowsOther } = await openProviderChanges(t, 'provider-changes')
  await saveOther()
  await pickerShowsOther()
})

test('A settings save after a change in another client gets PROVIDERS_STALE, reads the settings again and does not send again', {
  timeout: 60000,
}, async t => {
  const { evaluate, saveOther, pickerShowsOther } = await openProviderChanges(t, 'provider-stale')
  await evaluate(
    `document.querySelector('[aria-label="Chọn model"]').click();document.querySelector('.model-manage').click();true`,
  )
  await eventually(() => evaluate(`document.querySelector('.settings-dialog').open`), 'Settings missing')
  await evaluate(`document.querySelector('.settings-dialog [data-provider="fixture"]').click();true`)
  await eventually(
    () => evaluate(`document.querySelector('[aria-label="Display name"]').value === 'fixture'`),
    'Settings did not show the saved provider',
  )
  await evaluate(
    `{const name=document.querySelector('[aria-label="Display name"]');name.value='Renamed';name.dispatchEvent(new Event('input',{bubbles:true}))} true`,
  )
  await saveOther()
  await pickerShowsOther()
  assert.equal(
    await evaluate(`document.querySelector('[aria-label="Display name"]').value`),
    'Renamed',
    'A providers notice must not fill the open form again',
  )
  await evaluate(`{
    const original = window.fetch;
    window.__providerWrites = 0;
    window.fetch = async (url, init) => {
      if (String(url).endsWith('/api/providers/fixture') && init?.method === 'PUT') window.__providerWrites += 1;
      return original(url, init);
    };
  } true`)
  await evaluate(`document.querySelector('.settings-dialog form').requestSubmit();true`)
  await eventually(
    () =>
      evaluate(
        `document.querySelector('.settings-body [role=status]').textContent.includes('vừa thay đổi ở nơi khác')`,
      ),
    'Browser did not show the PROVIDERS_STALE message',
  )
  assert.equal(await evaluate(`document.querySelector('[aria-label="Display name"]').value`), 'fixture')
  assert.equal(
    await evaluate(`!!document.querySelector('.settings-dialog [data-provider="other"]')`),
    true,
    'The dialog must read the settings again',
  )
  assert.equal(await evaluate('window.__providerWrites'), 1, 'The Browser must not send the stale write again')
})
```

Run: `corepack pnpm@11.28.5 build`, then `node --test --test-name-pattern="providers notice|PROVIDERS_STALE" e2e/browser-smoke.test.mjs`

Expected: FAIL. The output contains `# fail 2`.

- [ ] **Step 3: Write the code**

Do the changes of the section `Interfaces`. Run the commands of Step 2.

Expected: PASS. The output contains `# fail 0`, and the two new tests pass.

- [ ] **Step 4: Break the code and make sure that the tests fail**

1. In `boot.ts`, remove the `providers` branch of `onNotice`. Build and run the test command of Step 2. Expected: FAIL. `# fail 2`. Undo the change.
2. In `settings-panel.ts`, remove the new `refresh` call of `perform`. Build and run the same command. Expected: FAIL. `# fail 1`. Undo the change.

- [ ] **Step 5: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [ ] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: the tests use one Browser tab and one HTTP client, not two Browser tabs. No test checks a removal that gets `PROVIDERS_STALE`, because a removal opens a `confirm` dialog.
- `CHANGELOG.md` line: ``- Read the settings and the chat list again in the Browser after a newer `providers` notice, and on `PROVIDERS_STALE` read the settings again, show the saved values and a message, and do not send the write again. Task 34 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: refresh the Browser from providers notices`
