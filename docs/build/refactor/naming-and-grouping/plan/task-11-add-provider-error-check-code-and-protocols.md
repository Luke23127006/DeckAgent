# Task 11: Add ProviderError, ProviderCheckCode and providerProtocols

Read this file to learn the steps of Task 11, which adds `ProviderError`, `ProviderCheckCode` and `providerProtocols`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`, and the row `Parallel phases` of Decisions (Revision 4)
- `apps/host/src/modules/providers/providers.errors.ts`
- `apps/host/src/modules/providers/providers.service.ts` (the class `ProviderFailure`, the constant `protocols` and the function `isProviderProtocol`)
- `apps/host/src/modules/providers/provider-catalog.ts` (the type `ProviderFailure` and the class `ProviderCheckError`)
- `apps/host/src/modules/providers/index.ts`
- `apps/host/src/cli.ts` (the function `connection`)
- `apps/host/src/server.ts` (the imports from `./modules/providers/index.ts` and the call of `mapProviderFailure`)
- `packages/host/contracts/src/management.ts` (the type `ProviderProtocol`)
- `packages/host/contracts/src/index.ts`
- `packages/host/contracts/tests/validation.test.mjs` (the imports)
- `apps/host/tests/web-management.test.mjs` (the imports)
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Change: `apps/host/src/modules/providers/providers.errors.ts`
- Change: `apps/host/src/modules/providers/providers.service.ts`
- Change: `apps/host/src/modules/providers/provider-catalog.ts`
- Change: `apps/host/src/modules/providers/index.ts`
- Change: `apps/host/src/cli.ts` (the import and the function `connection`)
- Change: `apps/host/src/server.ts` (the providers import and the call of `mapProviderFailure` only)
- Change: `packages/host/contracts/src/management.ts`
- Change: `packages/host/contracts/src/index.ts`
- Test: `packages/host/contracts/tests/validation.test.mjs`
- Test: `apps/host/tests/web-management.test.mjs`

**Interfaces:**
- Produces: `export type ProviderErrorCode` (18 codes), `export class ProviderError extends Error` with `constructor(readonly code: ProviderErrorCode, readonly detail?: Readonly<Record<string, string | boolean>>)` and `name = 'ProviderError'`, and `export function mapProviderError(error: unknown): HttpFailureResponse | undefined` in `apps/host/src/modules/providers/providers.errors.ts`.
- Produces: `export type ProviderCheckCode` in `apps/host/src/modules/providers/provider-catalog.ts`. `ProviderCheckError.code` has the type `ProviderCheckCode`.
- Produces: `export const providerProtocols = ['chat-completions', 'responses', 'anthropic-messages', 'gemini'] as const` and `export type ProviderProtocol = (typeof providerProtocols)[number]` in `packages/host/contracts/src/management.ts`, exported from `@deckagent/host-contracts`.

**STOP when:** `tsc` reports a `ProviderError` code that is not one of the 18 codes of the current `providerStatus` table.

**Forbidden:** Do not rename `ProviderConfigurations`, `ProviderConfigurationsOptions` or `ProviderOperations` in this task. Do not change `apps/web/`.

- [x] **Step 1: Write the failing tests**

1. In `packages/host/contracts/tests/validation.test.mjs`, add `providerProtocols` to the existing import from the contracts package. Add this test at the end of the file:

```js
test('providerProtocols lists the four API protocols of BR-005 V-4', () => {
  assert.deepEqual([...providerProtocols], ['chat-completions', 'responses', 'anthropic-messages', 'gemini'])
})
```

2. In `apps/host/tests/web-management.test.mjs`, add these imports:

```js
import { ProviderError, mapProviderError } from '../lib/types/modules/providers/providers.errors.js'
import { ProviderCheckError } from '../lib/types/modules/providers/provider-catalog.js'
```

Add this test at the end of the file:

```js
test('ProviderError and mapProviderError map codes to HTTP status and detail', () => {
  const stale = new ProviderError('PROVIDERS_STALE')
  assert.equal(stale.name, 'ProviderError')
  assert.deepEqual(mapProviderError(stale), { status: 409, code: 'PROVIDERS_STALE' })
  assert.deepEqual(mapProviderError(new ProviderError('INVALID_PROVIDER', { field: 'baseUrl' })), {
    status: 400,
    code: 'INVALID_PROVIDER',
    detail: { field: 'baseUrl' },
  })
  assert.deepEqual(mapProviderError(new ProviderError('PROVIDER_ID_TAKEN', { provider: 'OpenAI', builtIn: true })), {
    status: 409,
    code: 'PROVIDER_ID_TAKEN',
    detail: { provider: 'OpenAI', builtIn: true },
  })
  assert.deepEqual(mapProviderError(new ProviderError('PROVIDER_NOT_FOUND')), { status: 404, code: 'PROVIDER_NOT_FOUND' })
  assert.deepEqual(mapProviderError(new ProviderError('PROVIDER_KEY_REFUSED')), { status: 422, code: 'PROVIDER_KEY_REFUSED' })
  assert.deepEqual(mapProviderError(new ProviderError('CATALOG_UNAVAILABLE', { reason: 'no-answer' })), {
    status: 502,
    code: 'CATALOG_UNAVAILABLE',
    detail: { reason: 'no-answer' },
  })
  assert.deepEqual(mapProviderError(new ProviderError('PROVIDER_NO_ANSWER')), { status: 504, code: 'PROVIDER_NO_ANSWER' })
  assert.deepEqual(mapProviderError(new ProviderError('CREDENTIAL_NOT_SAVED')), { status: 500, code: 'CREDENTIAL_NOT_SAVED' })
  assert.equal(mapProviderError(new ProviderCheckError('PROVIDER_HTTP', 500)), undefined)
  assert.equal(mapProviderError(new Error('other')), undefined)
})
```

- [x] **Step 2: Build and run the tests, and make sure that they fail**

Run: `corepack pnpm@11.28.5 build; node --test --test-reporter=tap packages/host/contracts/tests/validation.test.mjs apps/host/tests/web-management.test.mjs`
Expected: FAIL. `providerProtocols` is not exported from the contracts package, and `ProviderError` is not exported from `providers.errors.js`.

- [x] **Step 3: Move the protocol list to the host contracts**

1. In `packages/host/contracts/src/management.ts`, replace the type `ProviderProtocol` with `providerProtocols` and the type from it, as Interfaces gives them. Keep the comment `/** API protocols of BR-005 V-4. */` on `providerProtocols`.
2. In `packages/host/contracts/src/index.ts`, add `export { providerProtocols } from './management.ts'`. Keep `ProviderProtocol` in the type export.

- [x] **Step 4: Move the provider error and rename the check code**

1. In `apps/host/src/modules/providers/providers.errors.ts`, add `ProviderErrorCode` with the 18 keys of `providerStatus`, and `ProviderError` as Interfaces gives it. Type `providerStatus` as `Readonly<Record<ProviderErrorCode, number>>`. Rename `mapProviderFailure` to `mapProviderError`, and use `providerStatus[error.code]` without `?? 500`. Remove the import of `./providers.service.ts`.
2. In `apps/host/src/modules/providers/providers.service.ts`, remove the class `ProviderFailure` and the constant `protocols`. Import `ProviderError` from `./providers.errors.ts` and `providerProtocols` from `@deckagent/host-contracts`. Replace each `ProviderFailure` with `ProviderError`, and each `protocols` with `providerProtocols`.
3. In `apps/host/src/modules/providers/provider-catalog.ts`, rename the type `ProviderFailure` to `ProviderCheckCode`.
4. In `apps/host/src/modules/providers/index.ts`, remove `ProviderFailure` and `protocols` from the export of `./providers.service.ts`, and export `mapProviderError` in place of `mapProviderFailure`.
5. In `apps/host/src/cli.ts`, import `providerProtocols` from `@deckagent/host-contracts` and `validBaseUrl` from `./modules/providers/index.ts`. Replace `protocols.find` with `providerProtocols.find`.
6. In `apps/host/src/server.ts`, replace `mapProviderFailure` with `mapProviderError` in the import and in the call.

- [x] **Step 5: Build, run the tests and run the checks**

Run: `corepack pnpm@11.28.5 build && node --test --test-reporter=tap packages/host/contracts/tests/validation.test.mjs apps/host/tests/web-management.test.mjs`
Expected: exit code 0 and `# fail 0`.

Run: `git grep -n -E "\bProviderFailure\b|mapProviderFailure" -- apps/host/src apps/host/tests e2e; git grep -n -w "protocols" -- apps/host/src/modules/providers apps/host/src/cli.ts`
Expected: no line.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
