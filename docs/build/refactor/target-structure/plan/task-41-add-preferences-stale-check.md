# Task 41: Add Zod decoders and PREFERENCES_STALE check on research and preferences writes

Read this file to learn the steps of Task 41, which checks research and preferences write bodies with Zod schemas and rejects stale writes with `409 PREFERENCES_STALE`.

**Type:** Code

After this task, `PUT /api/research`, `DELETE /api/research` and `PUT /api/preferences` decode their JSON bodies with strict Zod decoders in `@deckagent/host-contracts`. Each route requires a non-negative safe integer `expectedVersion` (`400 INVALID_REQUEST` when absent or malformed). A stale `expectedVersion` returns `409 PREFERENCES_STALE` and changes nothing. `ResearchCoordinator.save` checks `expectedVersion` before it calls Tavily and again inside the SQL transaction, so a stale save never sends a key to Tavily. The Browser client sends `expectedVersion` on every research and theme write.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `packages/host/contracts/src/provider-validation.ts` and `packages/host/contracts/src/index.ts`
- `packages/host/contracts/tests/validation.test.mjs`
- `apps/host/src/web-state.ts`, `apps/host/src/settings-routes.ts`, `apps/host/src/local-transport.ts` and `apps/host/src/server.ts`
- `apps/host/src/modules/research/research.store.ts`, `research.service.ts`, `research.routes.ts` and `research.errors.ts`
- `apps/web/src/browser/transport/management-client.ts`, `apps/web/src/browser/theme.ts`, `apps/web/src/browser/features/research/research-view.ts` and `apps/web/src/browser/boot.ts`
- `apps/host/tests/research.test.mjs`, `apps/host/tests/web-management.test.mjs`, `e2e/local-foundation.test.mjs` and `e2e/research-live.test.mjs`

**Files:**

- Create: `packages/host/contracts/src/preferences-validation.ts`
- Change: `packages/host/contracts/src/index.ts`
- Change: `apps/host/src/web-state.ts`, `apps/host/src/settings-routes.ts`, `apps/host/src/local-transport.ts`, `apps/host/src/server.ts`
- Change: `apps/host/src/modules/research/research.store.ts`, `research.service.ts`, `research.routes.ts`, `research.errors.ts`, `index.ts`
- Change: `apps/web/src/browser/transport/management-client.ts`, `apps/web/src/browser/theme.ts`, `apps/web/src/browser/features/research/research-view.ts`, `apps/web/src/browser/boot.ts`
- Test: `packages/host/contracts/tests/validation.test.mjs`, `apps/host/tests/research.test.mjs`, `apps/host/tests/web-management.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/research-live.test.mjs`

**Interfaces:**

- Produces, in `packages/host/contracts/src/preferences-validation.ts` (exported from `packages/host/contracts/src/index.ts`):
  - `export type ResearchSaveBody = ({ readonly key: string } | { readonly useEnvironment: true }) & { readonly expectedVersion: number }`
  - `export interface PreferencesSaveBody { readonly theme: 'light' | 'dark' | 'system'; readonly expectedVersion: number }`
  - `export function decodePreferencesSaveBody(value: unknown): PreferencesSaveBody` (`z.strictObject({ theme: z.enum(['light', 'dark', 'system']), expectedVersion: nonNegativeInt })`)
  - `export function decodeResearchSaveBody(value: unknown): ResearchSaveBody` (`z.union` of two strict objects: `{ key: z.string().min(1).max(4096).refine(s => s.trim().length > 0), expectedVersion: nonNegativeInt }` and `{ useEnvironment: z.literal(true), expectedVersion: nonNegativeInt }`)
  - `export function decodeResearchRemoveBody(value: unknown): { readonly expectedVersion: number }` (`z.strictObject({ expectedVersion: nonNegativeInt })`)
  - Each decoder throws `new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')` on failure.
- In `apps/host/src/web-state.ts`, `local-transport.ts`, `settings-routes.ts` and `server.ts`:
  - Add `'PREFERENCES_STALE'` to `WebStateErrorCode` and map it to `409` in `local-transport.ts`.
  - `WebState.savePreferences(theme: WebPreferences['theme'], expectedVersion: number): WebPreferences`: inside `BEGIN IMMEDIATE`, throw `new WebStateError('PREFERENCES_STALE')` when `this.preferencesVersion() !== expectedVersion`.
  - `settings-routes.ts`: change `SettingsRoutesOptions.preferences.save` to `save(theme: WebPreferences['theme'], expectedVersion: number): Promise<WebPreferences>`. Decode `PUT /api/preferences` with `decodePreferencesSaveBody` (`RequestValidationError` -> `HttpError(400, error.code)`) and call `preferences.save(body.theme, body.expectedVersion)`.
  - `server.ts`: pass `save: async (theme, expectedVersion) => web.savePreferences(theme, expectedVersion)` to `createSettingsRoutes`.
- In `apps/host/src/modules/research/`:
  - `research.store.ts`: `put(payload: string, expectedVersion: number): number | undefined`: inside `BEGIN IMMEDIATE`, roll back and return `undefined` when `this.version() !== expectedVersion`. Otherwise write, increment `change_versions`, commit and return the new version.
  - `research.service.ts`: `save(value: ResearchSaveInput, expectedVersion: number): Promise<void>` and `remove(expectedVersion: number): Promise<void>`. Check `expectedVersion !== this.store.version()` first (inside `this.change(...)`, before reading the key or calling `this.client.check`). When `this.store.put(payload, expectedVersion)` returns `undefined`, remove any newly saved `reference` and throw `new ResearchFailure('PREFERENCES_STALE')`.
  - `research.errors.ts`: add `PREFERENCES_STALE: 409`.
  - `research.routes.ts`: decode `PUT /api/research` with `decodeResearchSaveBody` and `DELETE /api/research` with `decodeResearchRemoveBody` (`RequestValidationError` -> `HttpError(400, error.code)`).
- In Browser (`management-client.ts`, `theme.ts`, `research-view.ts`, `boot.ts`):
  - Add `'PREFERENCES_STALE'` to `allowedCodes` in `management-client.ts`. Add `preferences(): Promise<WebPreferences>` (`GET /api/preferences` through `decodePreferences`). Change `saveTheme(theme, expectedVersion): Promise<WebPreferences>`, `saveResearch(value, expectedVersion): Promise<void>` and `removeResearch(expectedVersion): Promise<void>` to send `expectedVersion`.
  - In `research-view.ts`: import `ManagementError`, extract the error code with `error instanceof ManagementError ? error.message : ''` (fix the broken `'code' in error` check), accept `getPreferencesVersion: () => number`, snapshot `preferencesVersion` on `openSettings()` and after `await state.changed()`, and pass it to `saveResearch` and `removeResearch`.
  - In `theme.ts`: accept `getPreferencesVersion: () => number` and `onPreferencesVersion: (version: number) => void`, pass `getPreferencesVersion()` to `saveTheme` and call `onPreferencesVersion(saved.version)` on success.
  - In `boot.ts`: pass `() => navigation.settings.preferencesVersion` to `researchView` and `themeControl`, and pass `version => { navigation.settings = { ...navigation.settings, preferencesVersion: version } }` to `themeControl`.

**STOP when:** a new test of Step 2 passes before Step 3.

**Forbidden:** call `this.client.check` before the `expectedVersion` check in `ResearchCoordinator.save`.

## Test write rules

| File | Rule |
| --- | --- |
| `apps/host/tests/research.test.mjs` | Send `expectedVersion: (await f.call('settings')).data.preferencesVersion` on each `PUT` and `DELETE` to `research`. |
| `apps/host/tests/web-management.test.mjs` | Send `expectedVersion` (`0` for the first `PUT`, `1` for the second `PUT`) on each valid `PUT` to `/api/preferences`. |
| `e2e/local-foundation.test.mjs` | Send `expectedVersion` on each `PUT` to `preferences` and each `PUT` or `DELETE` to `research`. |
| `e2e/research-live.test.mjs` | Send `expectedVersion: (await api('settings')).preferencesVersion` on `PUT` to `research`. |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 40 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Write the failing tests**

Add this test at the end of `packages/host/contracts/tests/validation.test.mjs` (import `decodePreferencesSaveBody`, `decodeResearchRemoveBody` and `decodeResearchSaveBody` from `../lib/index.js`):

```js
test('preferences and research decoders require expectedVersion and reject malformed bodies', () => {
  assert.deepEqual(decodePreferencesSaveBody({ theme: 'dark', expectedVersion: 0 }), {
    theme: 'dark',
    expectedVersion: 0,
  })
  assert.deepEqual(decodeResearchSaveBody({ key: 'secret-key', expectedVersion: 1 }), {
    key: 'secret-key',
    expectedVersion: 1,
  })
  assert.deepEqual(decodeResearchSaveBody({ useEnvironment: true, expectedVersion: 2 }), {
    useEnvironment: true,
    expectedVersion: 2,
  })
  assert.deepEqual(decodeResearchRemoveBody({ expectedVersion: 3 }), { expectedVersion: 3 })
  const invalid = error => error instanceof RequestValidationError && error.code === 'INVALID_REQUEST'
  for (const value of [
    undefined,
    { theme: 'dark' },
    { theme: 'neon', expectedVersion: 0 },
    { theme: 'dark', expectedVersion: -1 },
    { theme: 'dark', expectedVersion: 0, extra: 1 },
  ])
    assert.throws(() => decodePreferencesSaveBody(value), invalid)
  for (const value of [
    undefined,
    { key: 'ok' },
    { key: '   ', expectedVersion: 0 },
    { key: 'x'.repeat(4097), expectedVersion: 0 },
    { useEnvironment: true, key: 'ok', expectedVersion: 0 },
    { useEnvironment: false, expectedVersion: 0 },
    { useEnvironment: true, expectedVersion: -1 },
    { useEnvironment: true, expectedVersion: 0, extra: 1 },
  ])
    assert.throws(() => decodeResearchSaveBody(value), invalid)
  for (const value of [undefined, {}, { expectedVersion: -1 }, { expectedVersion: 0, extra: 1 }])
    assert.throws(() => decodeResearchRemoveBody(value), invalid)
})
```

Add this test at the end of `e2e/local-foundation.test.mjs`:

```js
test('research and preferences writes reject a stale expectedVersion with PREFERENCES_STALE before calling Tavily', {
  timeout: 30000,
}, async t => {
  const { start } = await area(t)
  let checks = 0
  const freeUsage = {
    key: { usage: 0, limit: null },
    account: { current_plan: 'Researcher', plan_usage: 0, plan_limit: 1000, paygo_usage: 0, paygo_limit: null },
  }
  const app = await start({
    researchAccess: {
      key: 'env-key',
      fetch: async () => {
        checks += 1
        return Response.json(freeUsage)
      },
    },
  })
  const call = api(app)
  assert.equal((await call('preferences', 'PUT', { theme: 'dark', expectedVersion: 0 })).status, 200)
  const staleTheme = await call('preferences', 'PUT', { theme: 'light', expectedVersion: 0 })
  assert.deepEqual([staleTheme.status, staleTheme.data.error.code], [409, 'PREFERENCES_STALE'])
  assert.deepEqual((await call('preferences')).data, { theme: 'dark', version: 1 })

  const staleSave = await call('research', 'PUT', { key: 'new-key', expectedVersion: 0 })
  assert.deepEqual([staleSave.status, staleSave.data.error.code], [409, 'PREFERENCES_STALE'])
  assert.equal(checks, 0, 'A stale research save must not call Tavily')

  const staleRemove = await call('research', 'DELETE', { expectedVersion: 0 })
  assert.deepEqual([staleRemove.status, staleRemove.data.error.code], [409, 'PREFERENCES_STALE'])

  for (const [path, method, body] of [
    ['preferences', 'PUT', { theme: 'light' }],
    ['research', 'PUT', { useEnvironment: true }],
    ['research', 'DELETE', undefined],
  ]) {
    const res = await call(path, method, body)
    assert.deepEqual([res.status, res.data.error.code], [400, 'INVALID_REQUEST'], `${method} ${path}`)
  }
  assert.equal((await call('research', 'PUT', { useEnvironment: true, expectedVersion: 1 })).status, 200)
  assert.equal(checks, 1)
  assert.equal((await call('research', 'DELETE', { expectedVersion: 2 })).status, 200)
  assert.equal((await call('settings')).data.preferencesVersion, 3)
})
```

Run: `corepack pnpm@11.28.5 build`, then `node --test packages/host/contracts/tests/validation.test.mjs e2e/local-foundation.test.mjs`

Expected: FAIL. The output contains `# fail 2`.

- [x] **Step 3: Write the code and change the existing tests**

Do the changes of the section `Interfaces` and the table `Test write rules`. Run `corepack pnpm@11.28.5 build`, then `node --test packages/host/contracts/tests/validation.test.mjs apps/host/tests/research.test.mjs apps/host/tests/web-management.test.mjs e2e/local-foundation.test.mjs`.

Expected: PASS. The output contains `# fail 0`.

- [x] **Step 4: Break the code and make sure that the tests fail**

In `apps/host/src/modules/research/research.service.ts`, move the `expectedVersion !== this.store.version()` check in `save` after `this.client.check(...)`. Build and run `node --test e2e/local-foundation.test.mjs`. Expected: FAIL. `# fail 1` on `A stale research save must not call Tavily`. Undo the change.

- [x] **Step 5: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [x] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: the Browser does not react to `preferences` notices or show a stale message on `PREFERENCES_STALE` yet. Task 42 adds that behavior.
- `CHANGELOG.md` line: ``- Add Zod decoders for research and preferences writes in `@deckagent/host-contracts`, reject stale writes with `409 PREFERENCES_STALE` before calling Tavily, and send `expectedVersion` from the Browser. Task 41 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: require expectedVersion and return PREFERENCES_STALE on research and preferences writes`
