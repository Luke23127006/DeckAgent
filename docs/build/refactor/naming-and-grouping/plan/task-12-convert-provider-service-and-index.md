# Task 12: Rename ProviderService and narrow the providers index

Read this file to learn the steps of Task 12, which renames the provider service class, removes `ProviderOperations` and narrows the exports of `providers/index.ts`.

**Type:** Move or rename

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`, and the row `Parallel phases` of Decisions (Revision 4)
- `apps/host/src/modules/providers/providers.service.ts` (the class `ProviderConfigurations`, the interface `ProviderConfigurationsOptions` and the type `ProviderOperations`)
- `apps/host/src/modules/providers/providers.routes.ts`
- `apps/host/src/modules/providers/index.ts`
- `apps/host/src/server.ts` (the imports from `./modules/providers/index.ts`, `HostOptions`, `RuntimeLayer` and the function `createRuntimeLayer`)
- `apps/host/tests/web-management.test.mjs` (the imports)
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`

**Files:**
- Change: `apps/host/src/modules/providers/providers.service.ts`
- Change: `apps/host/src/modules/providers/providers.routes.ts`
- Change: `apps/host/src/modules/providers/index.ts`
- Change: `apps/host/src/server.ts` (the provider names only)
- Test: `apps/host/tests/web-management.test.mjs`

**Interfaces:**
- Uses: `ProviderError` and `mapProviderError` in `apps/host/src/modules/providers/providers.errors.ts`. `providerProtocols` in `@deckagent/host-contracts`.
- Produces: `export class ProviderService` and `export interface ProviderServiceOptions` in `apps/host/src/modules/providers/providers.service.ts`. The constructor stays `(store: SqliteProviderStore, credentials: CredentialStore, options: ProviderServiceOptions = {})`.
- Produces: `export function createProviderRoutes(providers: ProviderService): Router` in `apps/host/src/modules/providers/providers.routes.ts`.
- Produces: the exports of `apps/host/src/modules/providers/index.ts`: `SqliteProviderStore`, `ProviderService`, `type ProviderServiceOptions`, `type ProviderConnection`, `listModels`, `validBaseUrl`, `createProviderRoutes` and `mapProviderError`.

**STOP when:** A file outside `apps/host/src/modules/providers/` and `apps/host/src/server.ts` imports a symbol that the new `providers/index.ts` does not export.

**Forbidden:** Do not change the methods of the provider service, their order or their bodies. Do not change `apps/host/src/modules/providers/providers.store.ts` or `provider-catalog.ts`.

- [ ] **Step 1: Write the failing test**

In `apps/host/tests/web-management.test.mjs`, add this test at the end of the file:

```js
test('providers index exports ProviderService and only the operations that callers use', async () => {
  const providers = await import('../lib/types/modules/providers/index.js')
  assert.deepEqual(Object.keys(providers).toSorted(), [
    'ProviderService',
    'SqliteProviderStore',
    'createProviderRoutes',
    'listModels',
    'mapProviderError',
    'validBaseUrl',
  ])
})
```

- [ ] **Step 2: Build and run the test, and make sure that it fails**

Run: `corepack pnpm@11.28.5 build; node --test --test-reporter=tap apps/host/tests/web-management.test.mjs`
Expected: FAIL. The new test reports `ProviderConfigurations` in place of `ProviderService`.

- [ ] **Step 3: Rename the class and the options**

Use this mapping in `apps/host/src/modules/providers/` and `apps/host/src/server.ts`:

| Old name | New name |
| --- | --- |
| `ProviderConfigurations` | `ProviderService` |
| `ProviderConfigurationsOptions` | `ProviderServiceOptions` |
| `ProviderOperations` | Removed. `createProviderRoutes` takes `providers: ProviderService` |

1. In `apps/host/src/modules/providers/providers.service.ts`, rename the class and the interface. Remove the line `export type ProviderOperations = ...`.
2. In `apps/host/src/modules/providers/providers.routes.ts`, import `type { ProviderService }` from `./providers.service.ts` and change the parameter type of `createProviderRoutes`.
3. Replace the content of `apps/host/src/modules/providers/index.ts` with exports of the 8 names in Interfaces: `SqliteProviderStore` from `./providers.store.ts`, `ProviderService`, `type ProviderServiceOptions` and `type ProviderConnection` from `./providers.service.ts`, `listModels` and `validBaseUrl` from `./provider-catalog.ts`, `createProviderRoutes` from `./providers.routes.ts`, and `mapProviderError` from `./providers.errors.ts`.
4. In `apps/host/src/server.ts`, replace `ProviderConfigurations` with `ProviderService` and `ProviderConfigurationsOptions` with `ProviderServiceOptions`.

- [ ] **Step 4: Build, run the tests and run the checks**

Run: `corepack pnpm@11.28.5 build && node --test --test-reporter=tap apps/host/tests/web-management.test.mjs apps/host/tests/web-session.test.mjs`
Expected: exit code 0 and `# fail 0`.

Run: `git grep -n -E "ProviderConfigurations|ProviderOperations" -- apps/host/src apps/host/tests e2e`
Expected: no line.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [ ] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
