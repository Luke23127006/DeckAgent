# Task 33: Add the providers stale check

Read this file to learn the steps of Task 33, which makes each provider write send `expectedVersion` and refuses a write with an old version with `409 PROVIDERS_STALE`.

**Type:** Code

After this task, `PUT /api/providers/:providerId` and `DELETE /api/providers/:providerId` require `expectedVersion` (a non-negative safe integer) in the JSON body. A missing or bad value gives `400 INVALID_REQUEST`. An old value gives `409 PROVIDERS_STALE`, and the Host does not call the provider. The Browser client sends the `providersVersion` of the last settings reply. Each test that writes a provider sends the current version.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `packages/host/contracts/src/workspace-validation.ts`
- `apps/host/src/modules/workspaces/workspaces.routes.ts` (the function `parseBody`)
- `apps/host/src/modules/providers/providers.routes.ts`, `providers.service.ts` (the methods `save` and `remove`) and `providers.errors.ts`
- `apps/web/src/browser/transport/management-client.ts` (the methods `save` and `remove`, and the list of error codes that contains `PROVIDER_NAME_EXISTS`)
- `apps/web/src/browser/features/providers/settings-panel.ts` (the functions `refresh`, `removeProvider` and `submitProvider`, and the type `PanelState`)

**Files:**

- Create: `packages/host/contracts/src/provider-validation.ts`
- Change: `packages/host/contracts/src/index.ts`, `apps/host/src/modules/providers/providers.routes.ts`, `providers.service.ts`, `providers.errors.ts`
- Change: `apps/web/src/browser/transport/management-client.ts`, `apps/web/src/browser/features/providers/settings-panel.ts`
- Test: `packages/host/contracts/tests/validation.test.mjs`, `e2e/local-foundation.test.mjs`
- Change: each file in `e2e/` and `apps/host/tests/` that the search of Step 4 finds

**Interfaces:**

- `decodeProviderSaveBody(value: unknown): { readonly provider: Readonly<Record<string, unknown>>; readonly expectedVersion: number }`. Use `z.looseObject({ expectedVersion: nonNegativeInt })`. `provider` is a copy of the input object without the key `expectedVersion`.
- `decodeProviderRemoveBody(value: unknown): { readonly expectedVersion: number }`. Use `z.strictObject({ expectedVersion: nonNegativeInt })`.
- Both decoders throw `new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')`, and `index.ts` exports both.
- `ProviderConfigurations.save(id: string, value: unknown, expectedVersion: number): Promise<void>` and `ProviderConfigurations.remove(id: string, expectedVersion: number): Promise<void>`. The first statement of the function that `this.serialize` receives is `if (expectedVersion !== this.store.version()) throw new ProviderFailure('PROVIDERS_STALE')`.
- `providerStatus` in `providers.errors.ts` gets `PROVIDERS_STALE: 409`.
- The routes decode the body with a function `parseBody` that is the same as the one in `workspaces.routes.ts`, and give `body.provider` and `body.expectedVersion` to the service.
- `ManagementClient.save(id: string, value: <the current type>, expectedVersion: number): Promise<void>` sends `{ ...value, expectedVersion }`. `ManagementClient.remove(id: string, expectedVersion: number): Promise<void>` sends `DELETE` with `{ expectedVersion }`. Add `'PROVIDERS_STALE'` to the list of error codes.
- `PanelState` gets `providersVersion: number`, with the start value `0`. `refresh` sets it to `settings.providersVersion`. `submitProvider` and `removeProvider` give it to `client.save` and `client.remove`.

**STOP when:** a test fails with `PROVIDERS_STALE` after Step 4.

## Test write rules

Step 4 adds `expectedVersion` to each provider write of a test. Use the first row that matches.

| Signal | Action |
| --- | --- |
| The write is in a test of `e2e/local-foundation.test.mjs` that has `fixtureProvider` | Use the values of the list below the table. |
| A call of `ManagementClient.save` that expects `INVALID_PROVIDER` with `field: 'providerId'` | Keep it. The client refuses the ID before it sends. |
| A `PUT` or `DELETE` through a helper that returns `{ status, data }` | Add `expectedVersion: (await <helper>('settings')).data.providersVersion` to the body. A `DELETE` with no body gets the body `{ expectedVersion: ... }`. |
| A `PUT` or `DELETE` through a helper that returns the parsed JSON body | Add `expectedVersion: (await <helper>('settings')).providersVersion` to the body. |
| The `fetch` call with `method: 'DELETE'` for `providers/seeded` in `apps/host/tests/web-management.test.mjs` | Add `'content-type': 'application/json'` to its headers and `body: JSON.stringify({ expectedVersion: 0 })`. |
| The `fetch` call with `method: 'PUT'` for `api/providers/live` in `e2e/opencode-live.test.mjs` | Add `expectedVersion: 0` to the object in `JSON.stringify`. This write is the first provider write of the Host. |
| No row matches | STOP. Add the line to the report. |

Values for `e2e/local-foundation.test.mjs`:

- Test `provider writes increase the providers version and send the providers notice before the chats notice`: the first `PUT` gets `expectedVersion: 0`, the second `PUT` gets `1`, the `PUT` that expects `INVALID_PROVIDER` gets `2`, and the `DELETE` gets `{ expectedVersion: 2 }`.
- Test `web.sqlite schema 1 upgrades to schema 2 in place and keeps providers and preferences`: `providers/kept` gets `0`, `providers/gone` gets `1`, and the `DELETE` gets `{ expectedVersion: 2 }`.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 32 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Write the failing tests**

Add this test to `packages/host/contracts/tests/validation.test.mjs`. Add `decodeProviderRemoveBody`, `decodeProviderSaveBody` and `RequestValidationError` to its import list when they are not in it.

```js
test('provider write bodies require a non-negative expectedVersion and keep the other fields', () => {
  assert.deepEqual(decodeProviderSaveBody({ displayName: 'A', models: [], expectedVersion: 3 }), {
    provider: { displayName: 'A', models: [] },
    expectedVersion: 3,
  })
  assert.deepEqual(decodeProviderRemoveBody({ expectedVersion: 0 }), { expectedVersion: 0 })
  const invalid = error => error instanceof RequestValidationError && error.code === 'INVALID_REQUEST'
  for (const value of [undefined, null, [], 'x', { displayName: 'A' }, { expectedVersion: -1 }, { expectedVersion: 1.5 }, { expectedVersion: '1' }])
    assert.throws(() => decodeProviderSaveBody(value), invalid)
  for (const value of [undefined, {}, { expectedVersion: -1 }, { expectedVersion: 0, extra: true }])
    assert.throws(() => decodeProviderRemoveBody(value), invalid)
})
```

Add this test to `e2e/local-foundation.test.mjs`, after the test `web.sqlite schema 1 upgrades to schema 2 in place and keeps providers and preferences`:

```js
test('a provider write with an old expectedVersion gets PROVIDERS_STALE and changes nothing', {
  timeout: 30000,
}, async t => {
  const { start } = await area(t)
  let checks = 0
  const app = await start({ providerAccess: { check: async () => { checks += 1 }, catalog: async () => [] } })
  const call = api(app)
  const saved = await call('providers/fixture', 'PUT', { ...fixtureProvider(['a']), new: true, expectedVersion: 0 })
  assert.equal(saved.status, 200)
  assert.equal(checks, 1)
  const moved = { ...fixtureProvider(['a']), baseUrl: 'http://127.0.0.1:2', expectedVersion: 0 }
  const staleSave = await call('providers/fixture', 'PUT', moved)
  assert.deepEqual([staleSave.status, staleSave.data.error.code], [409, 'PROVIDERS_STALE'])
  assert.equal(checks, 1, 'A stale save must not call the provider')
  const staleRemove = await call('providers/fixture', 'DELETE', { expectedVersion: 0 })
  assert.deepEqual([staleRemove.status, staleRemove.data.error.code], [409, 'PROVIDERS_STALE'])
  const settings = (await call('settings')).data
  assert.deepEqual(
    [settings.providersVersion, settings.providers.map(provider => provider.baseUrl)],
    [1, ['http://127.0.0.1:1']],
  )
  for (const body of [fixtureProvider(['a']), { ...fixtureProvider(['a']), expectedVersion: -1 }]) {
    const invalid = await call('providers/fixture', 'PUT', body)
    assert.deepEqual([invalid.status, invalid.data.error.code], [400, 'INVALID_REQUEST'])
  }
  const noBody = await call('providers/fixture', 'DELETE')
  assert.deepEqual([noBody.status, noBody.data.error.code], [400, 'INVALID_REQUEST'])
  assert.equal((await call('providers/fixture', 'DELETE', { expectedVersion: 1 })).status, 200)
  assert.equal((await call('settings')).data.providersVersion, 2)
})
```

Run: `corepack pnpm@11.28.5 build`, then `node --test packages/host/contracts/tests/validation.test.mjs e2e/local-foundation.test.mjs`

Expected: FAIL. The output contains `# fail 2`: the import of the two decoders fails, and the new test gets `200` for the stale save.

- [x] **Step 3: Write the code**

Do the changes of the section `Interfaces`. Run the commands of Step 2.

Expected: FAIL. The output contains `# fail 2`. The failed tests are the two tests that Task 32 added, and each gets `400 INVALID_REQUEST`.

- [x] **Step 4: Add expectedVersion to the test writes**

Run: `git grep -n -E "providers/.*(PUT|DELETE)" -- e2e apps/host/tests`

Run: `git grep -n -E "fetch\(.*api/providers/" -- e2e apps/host/tests`

Expected: PASS. Exit code 0 for each command. Change each line that writes a provider with the table `Test write rules`. Then run the commands of Step 2. Expected: PASS. `# fail 0`.

- [x] **Step 5: Break the code and make sure that the test fails**

In `providers.service.ts`, move the version check of `save` to after the call of `this.options.check`. Build and run `node --test e2e/local-foundation.test.mjs`. Expected: FAIL. `# fail 1`. Undo the change.

- [x] **Step 6: Format, build and check**

Do the step `Format, build and check` of the Task protocol.

- [x] **Step 7: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 8: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Test writes` with the columns `File | Line | Rule row`.

- What the commands do not prove: the live suites (`e2e/*-live.test.mjs`) got the new field but did not run. The Browser shows the generic save failure for `PROVIDERS_STALE` until Task 34. The provider wizard tests of `test:browser-smoke` are the only check that the Browser sends the right version.
- `CHANGELOG.md` line: ``- Require `expectedVersion` on `PUT` and `DELETE /api/providers/:providerId`, refuse an old version with `409 PROVIDERS_STALE` before the provider check, and send the version from the Browser client. Task 33 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `feat: add the providers stale check`
