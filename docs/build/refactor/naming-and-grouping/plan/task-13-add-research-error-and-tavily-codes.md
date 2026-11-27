# Task 13: Add ResearchError and the Tavily error codes

Read this file to learn the steps of Task 13, which moves the research error class to `research.errors.ts`, types the codes of `TavilyError` and updates the callers.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`, and the row `Parallel phases` of Decisions (Revision 4)
- `apps/host/src/modules/research/research.errors.ts`
- `apps/host/src/modules/research/research.service.ts` (the class `ResearchFailure` and each `new ResearchFailure`)
- `apps/host/src/modules/research/tavily.ts` (the class `TavilyError`, the function `failure` and each `new TavilyError`)
- `apps/host/src/modules/research/index.ts`
- `apps/host/src/modules/deck/confirmation-coordinator.ts` (the import and the use of `ResearchFailure`)
- `apps/host/src/modules/deck/image-research.ts` (the import and the use of `ResearchFailure`)
- `apps/host/src/modules/deck/image-review-run.ts` (the import and the use of `ResearchFailure`)
- `apps/host/src/server.ts` (the imports from `./modules/research/index.ts` and the call of `mapResearchFailure`)
- `apps/host/tests/research.test.mjs` (the imports)
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Change: `apps/host/src/modules/research/research.errors.ts`
- Change: `apps/host/src/modules/research/research.service.ts`
- Change: `apps/host/src/modules/research/tavily.ts` (`TavilyError` and `failure` only)
- Change: `apps/host/src/modules/research/index.ts`
- Change: `apps/host/src/modules/deck/confirmation-coordinator.ts` (the name `ResearchFailure` only)
- Change: `apps/host/src/modules/deck/image-research.ts` (the name `ResearchFailure` only)
- Change: `apps/host/src/modules/deck/image-review-run.ts` (the name `ResearchFailure` only)
- Change: `apps/host/src/server.ts` (the research import and the call of `mapResearchFailure` only)
- Test: `apps/host/tests/research.test.mjs`

**Interfaces:**
- Produces: `export type ResearchErrorCode` with the 11 codes of the current `researchStatus` table, `export class ResearchError extends Error` with `constructor(readonly code: ResearchErrorCode, readonly detail?: Readonly<Record<string, string | boolean>>)` and `name = 'ResearchError'`, and `export function mapResearchError(error: unknown): HttpFailureResponse | undefined` in `apps/host/src/modules/research/research.errors.ts`.
- Produces: `export type TavilyErrorCode = 'SOURCE_ARGUMENTS_INVALID' | 'RESEARCH_KEY_REJECTED' | 'RESEARCH_QUOTA_EXHAUSTED' | 'RESEARCH_UNAVAILABLE' | 'RESEARCH_RESPONSE_TOO_LARGE' | 'RESEARCH_FREE_ONLY'` in `apps/host/src/modules/research/tavily.ts`. `TavilyError` has `constructor(readonly code: TavilyErrorCode)`, and `failure` has the parameter `code: TavilyErrorCode = 'RESEARCH_UNAVAILABLE'`.

**STOP when:** `tsc` reports a `TavilyError` code that is not in `TavilyErrorCode`. Also stop when `tsc` reports a `ResearchError` code that is not in `ResearchErrorCode`.

**Forbidden:** Do not rename `ResearchCoordinator`, `ResearchOperations` or `ResearchSessionStore` in this task. In `apps/host/src/modules/deck/`, change only the import and the name `ResearchFailure`.

- [ ] **Step 1: Write the failing test**

In `apps/host/tests/research.test.mjs`, add these imports:

```js
import { ResearchError, mapResearchError } from '../lib/types/modules/research/research.errors.js'
import { TavilyError } from '../lib/types/modules/research/tavily.js'
```

Add this test at the end of the file:

```js
test('ResearchError and mapResearchError map codes to HTTP status and detail', () => {
  const freeOnly = new ResearchError('RESEARCH_FREE_ONLY')
  assert.equal(freeOnly.name, 'ResearchError')
  assert.deepEqual(mapResearchError(freeOnly), { status: 503, code: 'RESEARCH_FREE_ONLY' })
  assert.deepEqual(mapResearchError(new ResearchError('SESSION_NOT_FOUND')), { status: 404, code: 'SESSION_NOT_FOUND' })
  assert.deepEqual(mapResearchError(new ResearchError('SOURCE_ARGUMENTS_INVALID')), {
    status: 400,
    code: 'SOURCE_ARGUMENTS_INVALID',
  })
  assert.deepEqual(mapResearchError(new ResearchError('PREFERENCES_STALE', { field: 'expectedVersion' })), {
    status: 409,
    code: 'PREFERENCES_STALE',
    detail: { field: 'expectedVersion' },
  })
  assert.deepEqual(mapResearchError(new ResearchError('RESEARCH_NOT_SAVED')), { status: 500, code: 'RESEARCH_NOT_SAVED' })
  assert.equal(mapResearchError(new TavilyError('RESEARCH_UNAVAILABLE')), undefined)
  assert.equal(mapResearchError(new Error('other')), undefined)
})
```

- [ ] **Step 2: Build and run the test, and make sure that it fails**

Run: `corepack pnpm@11.28.5 build; node --test --test-reporter=tap apps/host/tests/research.test.mjs`
Expected: FAIL. `ResearchError` is not exported from `research.errors.js`.

- [ ] **Step 3: Move the research error and type the Tavily codes**

1. In `apps/host/src/modules/research/research.errors.ts`, add `ResearchErrorCode` with the 11 keys of `researchStatus`, and `ResearchError` as Interfaces gives it. Type `researchStatus` as `Readonly<Record<ResearchErrorCode, number>>`. Rename `mapResearchFailure` to `mapResearchError`, and use `researchStatus[error.code]` without `?? 500`. Remove the import of `./research.service.ts`.
2. In `apps/host/src/modules/research/tavily.ts`, add `TavilyErrorCode` and change `TavilyError` and `failure` as Interfaces gives them.
3. In `apps/host/src/modules/research/research.service.ts`, remove the class `ResearchFailure`. Import `ResearchError` from `./research.errors.ts`, and replace each `ResearchFailure` with `ResearchError`.
4. In `apps/host/src/modules/research/index.ts`, export `ResearchError` from `./research.errors.ts` in place of `ResearchFailure`, and export `mapResearchError` in place of `mapResearchFailure`.
5. In the three files of `apps/host/src/modules/deck/` in the `Files` block, replace `ResearchFailure` with `ResearchError` in the import and in each use.
6. In `apps/host/src/server.ts`, replace `mapResearchFailure` with `mapResearchError` in the import and in the call.

- [ ] **Step 4: Build, run the tests and run the checks**

Run: `corepack pnpm@11.28.5 build && node --test --test-reporter=tap apps/host/tests/research.test.mjs apps/host/tests/image-research.test.mjs apps/host/tests/research-image-generation.test.mjs`
Expected: exit code 0 and `# fail 0`.

Run: `git grep -n -E "ResearchFailure|mapResearchFailure" -- apps/host/src apps/host/tests e2e`
Expected: no line.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [ ] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
