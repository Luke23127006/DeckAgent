# Task 42: Connect the Browser to preferences notices and handle PREFERENCES_STALE

Read this file to learn the steps of Task 42, which connects the Browser to `preferences` notices and handles `PREFERENCES_STALE`.

**Type:** Code

After this task, a newer `preferences` notice on `GET /api/changes` makes the Browser read `GET /api/settings` and `GET /api/preferences` again. The research controls and active theme update without a reload. An open research dialog keeps any key typed in the input. On `PREFERENCES_STALE`, the research dialog reads settings again, shows the stale message and does not send the write again. On `PREFERENCES_STALE`, the theme control reads `GET /api/preferences` again, applies the saved theme, shows the stale title and does not send the write again.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `apps/web/src/browser/boot.ts` (the `ChangeWatcher` and `themeControl` wiring)
- `apps/web/src/browser/theme.ts`
- `apps/web/src/browser/features/research/research-view.ts`
- `e2e/browser-smoke.test.mjs` (the `PROVIDERS_STALE` test and the `research` tests)

**Files:**

- Change: `apps/web/src/browser/boot.ts`
- Change: `apps/web/src/browser/theme.ts`
- Change: `apps/web/src/browser/features/research/research-view.ts`
- Test: `e2e/browser-smoke.test.mjs`

**Interfaces:**

- In `apps/web/src/browser/theme.ts`:
  - Import `ManagementError` from `./transport/index.ts`.
  - `themeControl(management: ManagementClient, getPreferencesVersion: () => number, onPreferencesVersion: (version: number) => void): { readonly node: HTMLElement; update(theme: Theme): void }`.
  - `update(theme)` sets `current = theme`, calls `apply(theme)` (with no view-transition origin) and calls `sync()`.
  - In the button click `catch (error)`: when `error instanceof ManagementError && error.message === 'PREFERENCES_STALE'`, read `const saved = await management.preferences().catch(() => undefined)`. When `saved` exists, set `current = saved.theme`, call `apply(saved.theme)`, `sync()` and `onPreferencesVersion(saved.version)`. Otherwise revert to `previous`. Set `group.title` to `'Giao diện vừa thay đổi ở nơi khác. Đã cập nhật theo cài đặt mới nhất.'` and do not send again. For other errors, keep the current revert and title.
- In `apps/web/src/browser/features/research/research-view.ts`:
  - Add `PREFERENCES_STALE: 'Cài đặt tìm kiếm vừa thay đổi ở nơi khác. Đã tải lại trạng thái mới nhất; hãy kiểm tra rồi thử lại.'` to `messages`.
  - In `performResearch` `catch (error)`: when `code === 'PREFERENCES_STALE'`, call `await state.changed().catch(() => {})` and refresh `state.preferencesVersion` from `context.getPreferencesVersion()` before setting `state.status.textContent = messages.PREFERENCES_STALE`. Do not clear `state.key.value` and do not send the write again.
- In `apps/web/src/browser/boot.ts`:
  - Keep `const themeUI = themeControl(management, () => navigation.settings.preferencesVersion, version => { navigation.settings = { ...navigation.settings, preferencesVersion: version } })` and append `themeUI.node` to `themeSection`.
  - In `changeWatcher` `onNotice`: add a branch for `notice.topic === 'preferences'`:
    - Return when `notice.version <= navigation.settings.preferencesVersion`.
    - Run `const [, prefs] = await Promise.all([navigation.refresh(), management.preferences()])`.
    - Call `themeUI.update(prefs.theme)` and `controls()`.

**STOP when:** a test of Step 2 passes before Step 3.

**Forbidden:** send a second write after `PREFERENCES_STALE`. Clear the key input of an open `.research-dialog` when a `preferences` notice arrives.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 41 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Write the failing tests**

Add this constant and these two tests at the end of `e2e/browser-smoke.test.mjs`:

```js
const freeResearchUsage = {
  key: { usage: 0, limit: null },
  account: { current_plan: 'Researcher', plan_usage: 0, plan_limit: 1000, paygo_usage: 0, paygo_limit: null },
}

test('Browser updates research controls and theme from a preferences notice on /api/changes', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-preferences-changes-'))
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
  state.app = await startLocalWeb({
    dataDir: join(dir, 'data'),
    home: join(dir, 'home'),
    researchAccess: { key: 'notice-research-key', fetch: async () => Response.json(freeResearchUsage) },
  })
  const { protocol, evaluate } = state.session
  await protocol.call('Page.enable')
  await protocol.call('Page.navigate', { url: `${state.app.origin}/#token=${state.app.token}` })
  await eventually(
    () => evaluate(`!!document.querySelector('.public-research-choice:not(:disabled)')`),
    'Browser did not enable research from startup env key',
  )
  await delay(300)
  const headers = { authorization: `Bearer ${state.app.token}`, 'content-type': 'application/json' }
  const removed = await fetch(`${state.app.origin}/api/research`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ expectedVersion: 0 }),
  })
  assert.equal(removed.status, 200)
  await eventually(
    () =>
      evaluate(
        `document.querySelector('.public-research-choice').disabled && document.querySelector('.research-info').textContent === 'Chưa cấu hình'`,
      ),
    'Browser did not disable research after preferences notice',
  )
  const themed = await fetch(`${state.app.origin}/api/preferences`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ theme: 'dark', expectedVersion: 1 }),
  })
  assert.equal(themed.status, 200)
  await eventually(
    () => evaluate(`document.documentElement.dataset.theme === 'dark'`),
    'Browser did not apply dark theme after preferences notice',
  )
})

test('A research save after a change in another client gets PREFERENCES_STALE, refreshes settings and does not send again', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-preferences-stale-'))
  const state = {}
  let tavilyCalls = 0
  t.after(async () => {
    try {
      await closeBrowser(state.session)
      if (state.app) await state.app.close()
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
    }
  })
  state.session = await openBrowser(dir)
  state.app = await startLocalWeb({
    dataDir: join(dir, 'data'),
    home: join(dir, 'home'),
    researchAccess: {
      key: 'stale-research-key',
      fetch: async () => {
        tavilyCalls += 1
        return Response.json(freeResearchUsage)
      },
    },
  })
  const { protocol, evaluate } = state.session
  await protocol.call('Page.enable')
  await protocol.call('Page.navigate', { url: `${state.app.origin}/#token=${state.app.token}` })
  await eventually(
    () => evaluate(`!!document.querySelector('.public-research-choice:not(:disabled)')`),
    'Browser boot failed',
  )
  await delay(300)
  await evaluate(
    `[...document.querySelectorAll('button')].find(b=>b.textContent==='Cài đặt tìm kiếm').click();true`,
  )
  await eventually(() => evaluate(`document.querySelector('.research-dialog').open`), 'Research dialog missing')
  await evaluate(
    `{const input=document.querySelector('.research-dialog input[type=password]');input.value='typed-in-dialog'} true`,
  )
  const headers = { authorization: `Bearer ${state.app.token}`, 'content-type': 'application/json' }
  const remote = await fetch(`${state.app.origin}/api/research`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ expectedVersion: 0 }),
  })
  assert.equal(remote.status, 200)
  await eventually(
    () => evaluate(`document.querySelector('.research-info').textContent === 'Chưa cấu hình'`),
    'Browser did not receive the preferences notice',
  )
  assert.equal(
    await evaluate(`document.querySelector('.research-dialog input[type=password]').value`),
    'typed-in-dialog',
    'A preferences notice must not clear the open research input',
  )
  await evaluate(`{
    const original = window.fetch;
    window.__researchWrites = 0;
    window.fetch = async (url, init) => {
      if (String(url).endsWith('/api/research') && init?.method === 'PUT') window.__researchWrites += 1;
      return original(url, init);
    };
    [...document.querySelectorAll('.research-dialog button')].find(b=>b.textContent==='Kiểm tra và lưu key').click();
  } true`)
  await eventually(
    () =>
      evaluate(
        `document.querySelector('.research-dialog [role=status]').textContent.includes('vừa thay đổi ở nơi khác')`,
      ),
    'Browser did not show the PREFERENCES_STALE message',
  )
  await delay(300)
  assert.equal(await evaluate('window.__researchWrites'), 1, 'Browser must not send the stale research write again')
  assert.equal(tavilyCalls, 0, 'A stale research save must not call Tavily')
})
```

Run: `corepack pnpm@11.28.5 build`, then `node --test --test-name-pattern="preferences notice|PREFERENCES_STALE" e2e/browser-smoke.test.mjs`

Expected: FAIL. The output contains `# fail 2`.

- [x] **Step 3: Write the code**

Do the changes of the section `Interfaces`. Run `corepack pnpm@11.28.5 build`, then `node --test --test-name-pattern="preferences notice|PREFERENCES_STALE" e2e/browser-smoke.test.mjs`.

Expected: PASS. The output contains `# fail 0`.

- [x] **Step 4: Break the code and make sure that the tests fail**

1. In `apps/web/src/browser/boot.ts`, remove the `notice.topic === 'preferences'` branch. Build and run `node --test --test-name-pattern="preferences notice" e2e/browser-smoke.test.mjs`. Expected: FAIL. `# fail 1`. Undo the change.
2. In `apps/web/src/browser/features/research/research-view.ts`, remove the `PREFERENCES_STALE` entry from `messages`. Build and run `node --test --test-name-pattern="PREFERENCES_STALE" e2e/browser-smoke.test.mjs`. Expected: FAIL. `# fail 1`. Undo the change.

- [x] **Step 5: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [x] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: the tests use one Browser tab and one HTTP client, not two Browser tabs. No Browser test exercises `PREFERENCES_STALE` on the theme buttons directly.
- `CHANGELOG.md` line: ``- Connect the Browser to `preferences` notices on `GET /api/changes` to refresh research controls and theme without a reload, and show a stale message on `PREFERENCES_STALE` without sending the write again. Task 42 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: connect the Browser to preferences notices and handle PREFERENCES_STALE`
