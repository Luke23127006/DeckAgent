# Task 40: Upgrade web.sqlite to schema 3 and add preferences version and notices

Read this file to learn the steps of Task 40, which upgrades `web.sqlite` to schema 3, adds the `preferences` version to `GET /api/settings` and `GET /api/preferences`, and publishes `preferences` notices.

**Type:** Code

After this task, `web.sqlite` has schema version 3 and keeps the row `('preferences', 'host', 0)` in `change_versions`. A schema 1 or schema 2 file upgrades in place in one transaction and keeps each provider and preference row. Every committed write to the `theme` or `research` key increases the `preferences` version by 1 inside its SQL transaction and publishes `{ topic: 'preferences', key: 'host', version }` on `GET /api/changes` after commit. `rememberSelection` does not change this version and publishes no notice. `WebSettings` adds `preferencesVersion`, and `WebPreferences` adds `version`.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/ste-vi/SKILL.md`
- `packages/host/contracts/src/management.ts`
- `apps/host/src/web-state.ts`
- `apps/host/src/modules/research/research.store.ts` and `research.service.ts`
- `apps/host/src/server.ts` (the functions `openStorageLayer`, `createRuntimeLayer` and `createHostOptions`)
- `apps/web/src/browser/transport/management-decoders.ts` and `apps/web/src/browser/chat-navigation.ts`
- `apps/host/tests/web-management.test.mjs` and `e2e/local-foundation.test.mjs` (the `web.sqlite` and `provider writes` tests)
- `docs/architecture/10-agent-core.md` (the section `Aggregate và change notice`)

**Files:**

- Change: `packages/host/contracts/src/management.ts`
- Change: `apps/host/src/web-state.ts`, `apps/host/src/modules/research/research.store.ts`, `apps/host/src/modules/research/research.service.ts`, `apps/host/src/server.ts`
- Change: `apps/web/src/browser/transport/management-decoders.ts`, `apps/web/src/browser/chat-navigation.ts`
- Change: `docs/architecture/10-agent-core.md`
- Test: `apps/host/tests/web-management.test.mjs`, `e2e/local-foundation.test.mjs`

**Interfaces:**

- In `packages/host/contracts/src/management.ts`:
  - `WebSettings` adds `readonly preferencesVersion: number`.
  - `WebPreferences` adds `readonly version: number`.
- In `apps/host/src/web-state.ts`:
  - `schemaVersion = 3`.
  - Constructor: `constructor(path: string, isSelectable: (selection: ModelSelection) => boolean, onPreferencesChanged?: (version: number) => void)`.
  - `preferencesVersion(): number`: reads `SELECT version FROM change_versions WHERE topic = 'preferences' AND key = 'host'`. Returns `0` when absent.
  - `preferences(): WebPreferences`: returns `{ theme, version: this.preferencesVersion() }`.
  - `savePreferences(value: unknown): WebPreferences`: runs `BEGIN IMMEDIATE ... COMMIT`, writes `preferences` (`key = 'theme'`), increments `change_versions` for `('preferences', 'host')`, commits, calls `this.onPreferencesChanged?.(version)` and returns `{ theme, version }`.
  - `rememberSelection`: keeps no change to `change_versions` and sends no notice.
- In `apps/host/src/modules/research/research.store.ts`:
  - `version(): number`: reads `SELECT version FROM change_versions WHERE topic = 'preferences' AND key = 'host'`.
  - `put(payload: string): number`: runs `BEGIN IMMEDIATE ... COMMIT`, writes `preferences` (`key = 'research'`), increments `change_versions` for `('preferences', 'host')`, commits and returns the new `version`.
- In `apps/host/src/modules/research/research.service.ts`:
  - Constructor adds optional 6th parameter `onPreferencesChanged?: (version: number) => void`.
  - `save` and `remove`: capture `const version = this.store.put(...)`, then call `this.onPreferencesChanged?.(version)` right after commit and before `this.credentials.remove(...)`.
- In `apps/web/src/browser/transport/management-decoders.ts` and `chat-navigation.ts`:
  - `decodeSettings` checks `preferencesVersion` (non-negative safe integer) and includes it. `emptySettings()` sets `preferencesVersion: 0`.
  - Export `decodePreferences(value: unknown): WebPreferences` (checks `theme` and non-negative safe integer `version`). `decodeTheme` returns `decodePreferences(value).theme`.

**STOP when:** a new test of Step 2 passes before Step 3.

**Forbidden:** increase the `preferences` version inside `rememberSelection` or during startup. Publish a notice before `COMMIT`.

## Schema and wiring rules

- `web-state.ts`: accept `version === 1 || version === 2 || version === schemaVersion` for an existing database. Fresh DB and schema 1 upgrade insert both `('providers', 'host', 0)` and `('preferences', 'host', 0)` and set `PRAGMA user_version=3`. Schema 2 upgrade runs `INSERT OR IGNORE INTO change_versions (topic, key, version) VALUES ('preferences', 'host', 0); PRAGMA user_version=3;` inside the constructor transaction.
- `server.ts`: pass `version => changeFeed.publish({ topic: 'preferences', key: 'host', version })` to `new WebState(...)` and `new ResearchCoordinator(...)`. Add `preferencesVersion: web.preferencesVersion()` to `runtime.settings()`. Add `{ topic: 'preferences', version: () => web.preferencesVersion() }` to `changes.hostTopics`.
- `docs/architecture/10-agent-core.md`: in the `preferences` row, change the `Hiện tại` cell to ``Có `version` trong `change_versions` của `web.sqlite` (schema 3), notice `preferences` sau commit cho `theme` và `research` (`lastSelection` không tăng `version`)``.
- Existing tests:
  - In `apps/host/tests/web-management.test.mjs`, change the three `/api/preferences` `assert.deepEqual` checks to expect `{ theme: 'system', version: 0 }`, `{ theme: 'dark', version: 1 }` and `{ theme: 'system', version: 0 }`.
  - In `e2e/local-foundation.test.mjs`, in `provider writes increase the providers version and send the providers notice before the chats notice`, drain `assert.deepEqual(await nextNotice('preferences'), { topic: 'preferences', key: 'host', version: 0 })` right after `await nextNotice('providers')`.
  - In `e2e/local-foundation.test.mjs`, in `web.sqlite schema 1 upgrades to schema 2 in place and keeps providers and preferences`, change the expected `user_version` to `3`, expect both `providers` and `preferences` rows in `change_versions`, expect `{ theme: 'dark', version: 0 }`, and test `PRAGMA user_version=4` for `STORAGE_CORRUPT`.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 39 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Write the failing tests**

Add these two tests at the end of `e2e/local-foundation.test.mjs`:

```js
test('preferences and research writes increase the preferences version, send notices after commit and keep version on rememberSelection and restart', {
  timeout: 30000,
}, async t => {
  const { start } = await area(t)
  const freeUsage = {
    key: { usage: 0, limit: null },
    account: { current_plan: 'Researcher', plan_usage: 0, plan_limit: 1000, paygo_usage: 0, paygo_limit: null },
  }
  const researchAccess = {
    key: 'env-research-key',
    fetch: async (_url, init) =>
      init?.headers?.Authorization === 'Bearer bad-key' ? new Response('denied', { status: 401 }) : Response.json(freeUsage),
  }
  const app = await start({ providerAccess, researchAccess })
  const call = api(app)
  const nextNotice = await changeNotices(app, t)
  assert.deepEqual(await nextNotice('preferences'), { topic: 'preferences', key: 'host', version: 0 })
  assert.equal((await call('settings')).data.preferencesVersion, 0)
  assert.deepEqual((await call('preferences')).data, { theme: 'system', version: 0 })

  const dark = await call('preferences', 'PUT', { theme: 'dark' })
  assert.equal(dark.status, 200)
  assert.deepEqual(dark.data, { theme: 'dark', version: 1 })
  assert.deepEqual(await nextNotice('preferences'), { topic: 'preferences', key: 'host', version: 1 })

  assert.equal((await call('research', 'PUT', { useEnvironment: true })).status, 200)
  assert.deepEqual(await nextNotice('preferences'), { topic: 'preferences', key: 'host', version: 2 })
  assert.equal((await call('settings')).data.preferencesVersion, 2)

  assert.equal((await call('research', 'PUT', { key: 'bad-key' })).status, 503)
  assert.equal((await call('settings')).data.preferencesVersion, 2, 'A refused write keeps the version')

  assert.equal((await call('research', 'DELETE')).status, 200)
  assert.deepEqual(await nextNotice('preferences'), { topic: 'preferences', key: 'host', version: 3 })

  assert.equal((await call('providers/fixture', 'PUT', { ...fixtureProvider(['a']), new: true, expectedVersion: 0 })).status, 200)
  assert.equal((await call('sessions', 'POST', { selection: { provider: 'fixture', model: 'a' } })).status, 201)
  assert.equal((await call('settings')).data.preferencesVersion, 3, 'rememberSelection keeps the preferences version')

  await app.close()
  const restarted = await start({ providerAccess, researchAccess })
  assert.equal((await api(restarted)('settings')).data.preferencesVersion, 3, 'A start keeps the version')
})

test('web.sqlite schema 2 upgrades to schema 3 in place and keeps providers, providersVersion and preferences', {
  timeout: 30000,
}, async t => {
  const { start, options } = await area(t)
  const first = await start({ providerAccess })
  const call = api(first)
  assert.equal((await call('providers/kept', 'PUT', { ...fixtureProvider(['a']), new: true, expectedVersion: 0 })).status, 200)
  assert.equal((await call('preferences', 'PUT', { theme: 'dark' })).status, 200)
  await first.close()

  const path = join(options.dataDir, 'db', 'web.sqlite')
  const old = new DatabaseSync(path)
  old.exec("DELETE FROM change_versions WHERE topic = 'preferences'; PRAGMA user_version=2")
  old.close()

  const second = await start({ providerAccess })
  const settings = (await api(second)('settings')).data
  assert.equal(settings.providersVersion, 1)
  assert.equal(settings.preferencesVersion, 0)
  assert.deepEqual((await api(second)('preferences')).data, { theme: 'dark', version: 0 })
  const check = new DatabaseSync(path, { readOnly: true })
  assert.equal(check.prepare('PRAGMA user_version').get().user_version, 3)
  check.close()
})
```

Run: `corepack pnpm@11.28.5 build`, then `node --test e2e/local-foundation.test.mjs`

Expected: FAIL. The output contains `# fail 2`.

- [ ] **Step 3: Write the code**

Do the changes of the sections `Interfaces` and `Schema and wiring rules`. Run `corepack pnpm@11.28.5 build`, then `node --test apps/host/tests/web-management.test.mjs e2e/local-foundation.test.mjs`.

Expected: PASS. The output contains `# fail 0`.

- [ ] **Step 4: Break the code and make sure that the tests fail**

1. In `apps/host/src/modules/research/research.service.ts`, remove `this.onPreferencesChanged?.(version)` from `save`. Build and run `node --test --test-timeout=15000 e2e/local-foundation.test.mjs`. Expected: FAIL. Undo the change.
2. In `apps/host/src/web-state.ts`, remove `this.onPreferencesChanged?.(version)` from `savePreferences`. Build and run `node --test --test-timeout=15000 e2e/local-foundation.test.mjs`. Expected: FAIL. Undo the change.

- [ ] **Step 5: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [ ] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: writes to `/api/research` and `/api/preferences` do not require `expectedVersion` yet, and the Browser does not react to `preferences` notices yet.
- `CHANGELOG.md` line: ``- Upgrade `web.sqlite` to schema 3 with the `preferences` version in `change_versions`, return `preferencesVersion` in `GET /api/settings` and `version` in `/api/preferences`, and publish `preferences` notices after theme and research commits. Task 40 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: add web.sqlite schema 3 and preferences change notices`
