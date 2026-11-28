# Task 8: Split workspace types, unify WorkspaceError and rename migrations

Read this file to learn the steps of Task 8, which creates `workspace.types.ts` and `workspaces.migrations.ts` and merges workspace errors into `workspaces.errors.ts`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `apps/host/src/modules/workspaces/contracts.ts`
- `apps/host/src/modules/workspaces/schema.ts`
- `apps/host/src/modules/workspaces/workspaces.errors.ts`
- `apps/host/src/modules/workspaces/folder-policy.ts`
- `apps/host/src/modules/workspaces/workspace-name.ts`
- `apps/host/src/modules/workspaces/workspaces.store.ts` (imports and constructor)
- `apps/host/src/modules/workspaces/workspaces.service.ts`
- `apps/host/src/modules/workspaces/index.ts`
- `apps/host/src/server.ts` (imports and `mapApplicationFailure`)
- `apps/host/tests/workspace-registry.test.mjs`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Create: `apps/host/src/modules/workspaces/workspace.types.ts`
- Create: `apps/host/src/modules/workspaces/workspaces.migrations.ts`
- Remove: `apps/host/src/modules/workspaces/contracts.ts`
- Remove: `apps/host/src/modules/workspaces/schema.ts`
- Change: `apps/host/src/modules/workspaces/workspaces.errors.ts`
- Change: `apps/host/src/modules/workspaces/folder-policy.ts`
- Change: `apps/host/src/modules/workspaces/workspace-name.ts`
- Change: `apps/host/src/modules/workspaces/workspaces.store.ts`
- Change: `apps/host/src/modules/workspaces/workspaces.service.ts`
- Change: `apps/host/src/modules/workspaces/index.ts`
- Change: `apps/host/src/server.ts`
- Test: `apps/host/tests/workspace-registry.test.mjs`

**Interfaces:**
- Produces: `defaultWorkspaceId`, `type FolderStatus`, `interface Workspace`, `interface WorkspaceState` and `type FolderRefusal` in `apps/host/src/modules/workspaces/workspace.types.ts`.
- Produces: `type WorkspaceErrorCode` (with `'WORKSPACE_REQUEST_ACTIVE'`), `interface WorkspaceErrorDetail`, `class WorkspaceError` and `export function mapWorkspaceError(error: unknown): HttpFailureResponse | undefined` in `apps/host/src/modules/workspaces/workspaces.errors.ts`.
- Produces: `export function migrateWorkspacesDatabase(db: DatabaseSync, defaultName: string): void` in `apps/host/src/modules/workspaces/workspaces.migrations.ts`.

**STOP when:** Task protocol only

**Forbidden:** Do not rename `WorkspaceRegistry`, `createWorkspaceOperations` or `WorkspaceOperations` in this task. Do not change `.oxlintrc.json` or `scripts/check-boundaries.mjs`.

- [x] **Step 1: Write the failing test**

In `apps/host/tests/workspace-registry.test.mjs`, import `WorkspaceError` and `mapWorkspaceError` from `'../lib/types/modules/workspaces/workspaces.errors.js'`. Add this test at the end of the file:

```js
test('WorkspaceError and mapWorkspaceError map codes to HTTP status and safe detail', () => {
  const active = new WorkspaceError('WORKSPACE_REQUEST_ACTIVE', 'Workspace has an active request')
  assert.equal(active.name, 'WorkspaceError')
  assert.deepEqual(mapWorkspaceError(active), { status: 409, code: 'WORKSPACE_REQUEST_ACTIVE' })
  assert.deepEqual(
    mapWorkspaceError(
      new WorkspaceError('WORKSPACE_FOLDER_IN_USE', 'Another workspace has this folder', {
        workspaceName: 'Alpha',
      }),
    ),
    { status: 409, code: 'WORKSPACE_FOLDER_IN_USE', detail: { workspaceName: 'Alpha' } },
  )
  assert.deepEqual(
    mapWorkspaceError(
      new WorkspaceError('WORKSPACE_FOLDER_REFUSED', 'The folder cannot be a project folder', {
        reason: 'user-folder',
        allowInside: true,
      }),
    ),
    { status: 422, code: 'WORKSPACE_FOLDER_REFUSED', detail: { reason: 'user-folder', allowInside: true } },
  )
  assert.deepEqual(mapWorkspaceError(new WorkspaceError('WORKSPACE_NOT_FOUND', 'Workspace is not set up')), {
    status: 404,
    code: 'WORKSPACE_NOT_FOUND',
  })
  assert.deepEqual(mapWorkspaceError(new WorkspaceError('WORKSPACES_STALE', 'Stale')), {
    status: 409,
    code: 'WORKSPACES_STALE',
  })
  assert.equal(mapWorkspaceError(new Error('other')), undefined)
})
```

- [x] **Step 2: Run the test and make sure that it fails**

Run: `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs`
Expected: FAIL. Node exits with a non-zero code because `WorkspaceError` and `mapWorkspaceError` are not exported from `workspaces.errors.js`.

- [x] **Step 3: Create `workspace.types.ts` and `workspaces.migrations.ts`, and unify `workspaces.errors.ts`**

1. Create `apps/host/src/modules/workspaces/workspace.types.ts` with `defaultWorkspaceId`, `FolderStatus`, `Workspace`, `WorkspaceState` and `FolderRefusal` from `contracts.ts`. Remove `apps/host/src/modules/workspaces/contracts.ts`.
2. In `apps/host/src/modules/workspaces/workspaces.errors.ts`:
   - Import `type { HttpErrorDetail, HttpFailureResponse }` from `'../../http/route-helpers.ts'` and `type { FolderRefusal }` from `'./workspace.types.ts'`. Remove the `contracts.ts` and `workspaces.service.ts` imports.
   - Export `WorkspaceErrorCode` with the 12 existing codes plus `'WORKSPACE_REQUEST_ACTIVE'`.
   - Export `WorkspaceErrorDetail` and `class WorkspaceError extends Error` with `constructor(public readonly code: WorkspaceErrorCode, message: string, public readonly detail: WorkspaceErrorDetail = {})` and `this.name = 'WorkspaceError'`.
   - Keep `workspaceStatus: Readonly<Record<WorkspaceErrorCode, number>>` and add `WORKSPACE_REQUEST_ACTIVE: 409`.
   - Export `mapWorkspaceError(error: unknown): HttpFailureResponse | undefined` that returns `undefined` for non-`WorkspaceError` values, maps `error.code` through `workspaceStatus`, and includes `detail` only when `error.detail` has `workspaceName`, `reason` or `allowInside`. Remove `mapWorkspaceFailure`.
3. Create `apps/host/src/modules/workspaces/workspaces.migrations.ts` from `schema.ts`:
   - Import `WorkspaceError` from `'./workspaces.errors.ts'` and `defaultWorkspaceId` from `'./workspace.types.ts'`.
   - Rename `initialize` to `export function migrateWorkspacesDatabase(db: DatabaseSync, defaultName: string): void`. Keep all SQL statements, pragmas and checks unchanged.
   - Remove `apps/host/src/modules/workspaces/schema.ts`.

- [x] **Step 4: Update imports and callers**

1. In `apps/host/src/modules/workspaces/folder-policy.ts`, import `FolderRefusal` from `'./workspace.types.ts'` and `WorkspaceError` from `'./workspaces.errors.ts'`.
2. In `apps/host/src/modules/workspaces/workspace-name.ts`, import `WorkspaceError` from `'./workspaces.errors.ts'`.
3. In `apps/host/src/modules/workspaces/workspaces.store.ts`, import `WorkspaceError` from `'./workspaces.errors.ts'`, types and `defaultWorkspaceId` from `'./workspace.types.ts'`, and `migrateWorkspacesDatabase` from `'./workspaces.migrations.ts'`. Call `migrateWorkspacesDatabase` in place of `initialize`.
4. In `apps/host/src/modules/workspaces/workspaces.service.ts`, remove `WorkspaceWorkflowErrorCode` and `WorkspaceWorkflowError`. Import `WorkspaceError` from `'./workspaces.errors.ts'` and throw `new WorkspaceError('WORKSPACE_REQUEST_ACTIVE', 'Workspace has an active request')` in `requireNoActiveRequest`.
5. In `apps/host/src/modules/workspaces/index.ts` and `apps/host/src/server.ts`, replace `mapWorkspaceFailure` with `mapWorkspaceError`.

- [x] **Step 5: Build, run tests and run checks**

Run: `corepack pnpm@11.28.5 build`
Expected: exit code 0.

Run: `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs e2e/local-foundation.test.mjs`
Expected: exit code 0 and `# fail 0`.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
