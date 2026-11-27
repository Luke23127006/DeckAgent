# Task 10: Enable role-file-symbol for workspaces and check Phase 3

Read this file to learn the steps of Task 10, which enables `role-file-symbol` for `workspaces`, updates the migrations lint rule and checks Phase 3.

**Type:** Code (phase-exit task)

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `scripts/check-boundaries.mjs` (`ROLE_FILE_MODULES`)
- `.oxlintrc.json` (the override for `**/apps/host/src/modules/*/*.routes.ts`)
- `docs/conventions/project-structure.md` (Enforcement table)
- `tests/check-boundaries.test.mjs` (the module import and role file tests)
- `tests/oxlint-boundaries.test.mjs` (the module routes and store tests)
- `package.json` (`scripts`)
- `docs/conventions/docs.md`
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Change: `scripts/check-boundaries.mjs` (`ROLE_FILE_MODULES`)
- Change: `.oxlintrc.json` (`**/apps/host/src/modules/*/*.routes.ts` override)
- Change: `docs/conventions/project-structure.md` (Enforcement table)
- Test: `tests/check-boundaries.test.mjs`
- Test: `tests/oxlint-boundaries.test.mjs`
- Fix (only if Step 5 finds a defect from Phase 3): files in `apps/host/`

**Interfaces:**
- Produces: `const ROLE_FILE_MODULES = ['chats', 'workspaces']` in `scripts/check-boundaries.mjs`.
- Produces: `"./*.migrations.ts"` in place of `"./schema.ts"` in the `**/apps/host/src/modules/*/*.routes.ts` override of `.oxlintrc.json`.

**STOP when:** A defect in Step 5 needs a design decision, requires an HTTP contract change, or stays failing after two fix attempts.

**Forbidden:** Do not change `apps/web/`, `packages/presentation/` or HTTP black-box test expectations.

- [ ] **Step 1: Write the failing tests**

1. In `tests/check-boundaries.test.mjs`:
   - In the two module import tests (`checkBoundaries rejects private import into a module from a feature and from another module` and `checkBoundaries accepts a module index import and an import inside the same module`), replace `WorkspaceRegistry` with `SqliteWorkspaceStore`.
   - In `checkBoundaries rejects role files without their role symbols in a listed module`, add this block at the end of the test:

```js
  const workspaceFiles = [
    {
      path: 'apps/host/src/modules/workspaces/workspaces.service.ts',
      content: 'export function createWorkspaceOperations() {}\n',
    },
    { path: 'apps/host/src/modules/workspaces/workspaces.store.ts', content: 'export class WorkspaceRegistry {}\n' },
    { path: 'apps/host/src/modules/workspaces/workspaces.routes.ts', content: 'export function workspaceRouter() {}\n' },
    {
      path: 'apps/host/src/modules/workspaces/workspaces.errors.ts',
      content: 'export class WorkspaceFailure extends Error {}\nexport function mapWorkspaceFailure() {}\n',
    },
    {
      path: 'apps/host/src/modules/workspaces/folder-policy.ts',
      content: 'export class FolderService {}\nexport class FolderStore {}\n',
    },
  ]
  assert.deepEqual(findings(workspaceFiles), [
    { path: 'apps/host/src/modules/workspaces/folder-policy.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/folder-policy.ts', line: 2, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/workspaces.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/workspaces.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/workspaces.routes.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/workspaces.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/workspaces.store.ts', line: 1, rule: 'role-file-symbol' },
  ])
```

   - In `checkBoundaries accepts role symbols in a listed module and ignores modules outside the list`, replace the `workspaces.service.ts` entry with valid `workspaces` role files (`WorkspaceService`, `SqliteWorkspaceStore`, `createWorkspaceRoutes`, `WorkspaceError` and `mapWorkspaceError`) and add an unlisted file `{ path: 'apps/host/src/modules/providers/providers.service.ts', content: 'export class ProviderConfigurations {}\n' }`. Change `findings(files, {}, ['chats'])` to `findings(files, {}, ['chats', 'workspaces'])`.

2. In `tests/oxlint-boundaries.test.mjs`:
   - Update `rejects a store, the SQL driver and another module store inside a module routes file` to:

```js
test('rejects a store, migrations, the SQL driver and another module store inside a module routes file', () => {
  const result = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.routes.ts',
    [
      "import { SqliteWorkspaceStore } from './workspaces.store.ts'",
      "import { migrateWorkspacesDatabase } from './workspaces.migrations.ts'",
      "import { DatabaseSync } from 'node:sqlite'",
      "import { ChatStore } from '../chats/chats.store.ts'",
      'console.log(SqliteWorkspaceStore, migrateWorkspacesDatabase, DatabaseSync, ChatStore)',
      '',
    ].join('\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 4)
  const help = result.diagnostics.map(diagnostic => diagnostic.help).toSorted()
  assert.match(help[0], /A module must not import the store of another module, a storage package or the HTTP edge\./)
  assert.match(help[1], /A module route must not import a store or the SQL driver\./)
  assert.match(help[2], /A module route must not import a store or the SQL driver\./)
  assert.match(help[3], /A module route must not import a store or the SQL driver\./)
})
```

   - In `accepts the service, route helpers and Express inside a module routes file, and SQL inside a store file`, replace `WorkspaceOperations` with `WorkspaceService` and replace `./schema.ts` and `initialize` with `./workspaces.migrations.ts` and `migrateWorkspacesDatabase`.

- [ ] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs`
Expected: FAIL. Both suites fail because `workspaces` is not in `ROLE_FILE_MODULES` and `./*.migrations.ts` is not restricted in `.oxlintrc.json`.

- [ ] **Step 3: Enable `workspaces` in `ROLE_FILE_MODULES`, update `.oxlintrc.json` and update docs**

1. In `scripts/check-boundaries.mjs`, change `const ROLE_FILE_MODULES = ['chats']` to `const ROLE_FILE_MODULES = ['chats', 'workspaces']`.
2. In `.oxlintrc.json`, inside the `**/apps/host/src/modules/*/*.routes.ts` override, change `"./schema.ts"` to `"./*.migrations.ts"`.
3. In `docs/conventions/project-structure.md`, in the Enforcement table row for module routes, change `` `schema.ts` `` to `` `*.migrations.ts` ``.

Run: `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [ ] **Step 4: Check that no old workspace symbol stays in production code or host tests**

Run: `git grep -n -E "WorkspaceRegistry|WorkspaceRegistryOptions|createWorkspaceOperations|WorkspaceOperations|WorkspaceWorkflowError|mapWorkspaceFailure|modules/workspaces/contracts|modules/workspaces/schema" -- apps/host/src apps/host/tests e2e`
Expected: exit code 1 and no line.

- [ ] **Step 5: Run the Phase 3 exit checks and fix defects**

Run: `corepack pnpm@11.28.5 exec biome format apps/host/src/modules/workspaces apps/host/src/server.ts apps/host/tests/workspace-registry.test.mjs scripts/check-boundaries.mjs tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs && corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 check:docs`
Expected: exit code 0.

Run all 19 non-live `test:*` scripts in `package.json`:

```bash
for s in test:local-foundation test:model-requests test:source-permissions test:attachments test:research test:images test:outline-workflow test:brief-foundation test:deck-review test:generation-publication test:slide-pipeline test:session-persistence test:tools-browser test:opencode-resources test:browser-smoke test:env-startup test:http-edge test:local-web test:layouts; do
  echo "=== $s ==="
  corepack pnpm@11.28.5 "$s" || exit 1
done
```

If any suite fails because of a Phase 3 defect, fix the defect in `apps/host/`, rebuild, and run the checks and all 19 suites again. Record every defect and fix in the report.

Expected: exit code 0, and `# fail 0` for each of the 19 suites. Record the table `Script | Exit code | Tests passed` in the report.

- [ ] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
