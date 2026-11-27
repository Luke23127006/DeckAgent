# Task 15: Enable role-file-symbol for providers and research and check Phase 4

Read this file to learn the steps of Task 15, which enables `role-file-symbol` for `providers` and `research` and runs the Phase 4 exit checks.

**Type:** Code (phase-exit task)

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`, and the row `Parallel phases` of Decisions (Revision 4)
- `scripts/check-boundaries.mjs` (`ROLE_FILE_MODULES`)
- `tests/check-boundaries.test.mjs` (the role file tests)
- `package.json` (`scripts`)
- `docs/conventions/docs.md`
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Change: `scripts/check-boundaries.mjs` (`ROLE_FILE_MODULES` only)
- Test: `tests/check-boundaries.test.mjs` (the role file tests only)
- Fix (only if Step 5 finds a defect from Phase 4): files in `apps/host/src/modules/providers/`, `apps/host/src/modules/research/` and the call sites that Tasks 11 to 14 changed

**Interfaces:**
- Uses: `ProviderService`, `SqliteProviderStore`, `createProviderRoutes`, `ProviderError`, `mapProviderError`, `ResearchService`, `SqliteResearchStore`, `createResearchRoutes`, `ResearchError` and `mapResearchError`.
- Produces: `ROLE_FILE_MODULES` in `scripts/check-boundaries.mjs` contains `'providers'` and `'research'` at the end, after the entries that the file already has.

**STOP when:**
- A test or a check in Step 5 fails because of a file that Phase 4 does not change. Examples are a file of Phase 3, a file of Phase 5 and a file in `apps/web/`. Record the failure in the report. Do not fix it.
- A defect from Phase 4 needs a design decision, needs an HTTP contract change, or stays after two fix attempts.

**Forbidden:** Do not change `apps/web/`, `packages/presentation/` or the expected values of HTTP black-box tests. Do not remove or reorder the entries that `ROLE_FILE_MODULES` already has.

- [ ] **Step 1: Write the failing tests**

In `tests/check-boundaries.test.mjs`:

1. In `checkBoundaries accepts role symbols in a listed module and ignores modules outside the list`, remove each fixture entry with a path that starts with `apps/host/src/modules/providers/` or `apps/host/src/modules/research/`. Add this entry to the `files` array:

```js
    { path: 'apps/host/src/modules/deck/deck.service.ts', content: 'export function createDeckOperations() {}\n' },
```

2. Add this test at the end of the file:

```js
test('checkBoundaries applies role symbol checks to providers and research by default', () => {
  const invalid = [
    { path: 'apps/host/src/modules/providers/providers.service.ts', content: 'export class ProviderConfigurations {}\n' },
    {
      path: 'apps/host/src/modules/providers/providers.errors.ts',
      content: 'export class ProviderFailure extends Error {}\nexport function mapProviderFailure() {}\n',
    },
    { path: 'apps/host/src/modules/research/research.service.ts', content: 'export class ResearchCoordinator {}\n' },
    { path: 'apps/host/src/modules/research/tavily.ts', content: 'export class TavilyService {}\n' },
  ]
  assert.deepEqual(findings(invalid), [
    { path: 'apps/host/src/modules/providers/providers.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/providers/providers.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/providers/providers.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/research/research.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/research/tavily.ts', line: 1, rule: 'role-file-symbol' },
  ])
  const valid = [
    { path: 'apps/host/src/modules/providers/providers.service.ts', content: 'export class ProviderService {}\n' },
    { path: 'apps/host/src/modules/providers/providers.store.ts', content: 'export class SqliteProviderStore {}\n' },
    { path: 'apps/host/src/modules/providers/providers.routes.ts', content: 'export function createProviderRoutes() {}\n' },
    {
      path: 'apps/host/src/modules/providers/providers.errors.ts',
      content: 'export class ProviderError extends Error {}\nexport function mapProviderError() {}\n',
    },
    { path: 'apps/host/src/modules/research/research.service.ts', content: 'export class ResearchService {}\n' },
    { path: 'apps/host/src/modules/research/research.store.ts', content: 'export class SqliteResearchStore {}\n' },
    { path: 'apps/host/src/modules/research/research.routes.ts', content: 'export function createResearchRoutes() {}\n' },
    {
      path: 'apps/host/src/modules/research/research.errors.ts',
      content: 'export class ResearchError extends Error {}\nexport function mapResearchError() {}\n',
    },
    { path: 'apps/host/src/modules/research/tavily.ts', content: 'export class TavilyClient {}\n' },
  ]
  assert.deepEqual(findings(valid), [])
})
```

- [ ] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/check-boundaries.test.mjs`
Expected: FAIL. The new test fails because `providers` and `research` are not in `ROLE_FILE_MODULES`.

- [ ] **Step 3: Add `providers` and `research` to `ROLE_FILE_MODULES`**

In `scripts/check-boundaries.mjs`, add `'providers', 'research'` to the end of the array `ROLE_FILE_MODULES`.

Run: `node --test --test-reporter=tap tests/check-boundaries.test.mjs && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0, `# fail 0` and `check-boundaries: 0 violation(s)`.

- [ ] **Step 4: Check that no old provider or research symbol stays**

Run: `git grep -n -E "ProviderConfigurations|ProviderOperations|\bProviderFailure\b|mapProviderFailure|ResearchCoordinator|ResearchOperations|ResearchSessionStore|ResearchFailure|mapResearchFailure" -- apps/host/src apps/host/tests e2e`
Expected: exit code 1 and no line.

- [ ] **Step 5: Run the Phase 4 exit checks and fix defects**

Run: `corepack pnpm@11.28.5 exec biome format apps/host/src/modules/providers apps/host/src/modules/research apps/host/src/cli.ts packages/host/contracts/src apps/host/tests/web-management.test.mjs apps/host/tests/research.test.mjs scripts/check-boundaries.mjs tests/check-boundaries.test.mjs && corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 check:docs`
Expected: exit code 0.

Run all 19 non-live `test:*` scripts in `package.json`:

```bash
for s in test:local-foundation test:model-requests test:source-permissions test:attachments test:research test:images test:outline-workflow test:brief-foundation test:deck-review test:generation-publication test:slide-pipeline test:session-persistence test:tools-browser test:opencode-resources test:browser-smoke test:env-startup test:http-edge test:local-web test:layouts; do
  echo "=== $s ==="
  corepack pnpm@11.28.5 "$s" || exit 1
done
```

If a suite fails because of a Phase 4 defect, fix the defect, build again, and run the checks and the 19 suites again. Record each defect and each fix in the report.

Expected: exit code 0, and `# fail 0` for each of the 19 suites. Record the table `Script | Exit code | Tests passed` in the report.

- [ ] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
