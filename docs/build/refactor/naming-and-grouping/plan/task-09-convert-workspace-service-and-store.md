# Task 9: Rename SqliteWorkspaceStore, convert WorkspaceService to a class and wire routes

Read this file to learn the steps of Task 9, which renames `WorkspaceRegistry` to `SqliteWorkspaceStore`, introduces `class WorkspaceService`, and updates `workspaces.routes.ts`, `workspaces/index.ts` and `server.ts`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `apps/host/src/modules/workspaces/workspaces.store.ts`
- `apps/host/src/modules/workspaces/workspaces.service.ts`
- `apps/host/src/modules/workspaces/workspaces.routes.ts`
- `apps/host/src/modules/workspaces/index.ts`
- `apps/host/src/modules/chats/chats.service.ts` (imports from `../workspaces/index.ts`)
- `apps/host/src/server.ts` (imports, `StorageLayer`, `openStorageLayer`, `createHostOptions`)
- `apps/host/tests/workspace-registry.test.mjs`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`

**Files:**
- Change: `apps/host/src/modules/workspaces/workspaces.store.ts`
- Change: `apps/host/src/modules/workspaces/workspaces.service.ts`
- Change: `apps/host/src/modules/workspaces/workspaces.routes.ts`
- Change: `apps/host/src/modules/workspaces/index.ts`
- Change: `apps/host/src/server.ts`
- Test: `apps/host/tests/workspace-registry.test.mjs`

**Interfaces:**
- Uses: `WorkspaceError` and `mapWorkspaceError` from `apps/host/src/modules/workspaces/workspaces.errors.ts`.
- Uses: `WorkspaceList` from `@deckagent/host-contracts`.
- Produces: `export interface WorkspaceStoreOptions extends FolderPolicyOptions` and `export class SqliteWorkspaceStore` in `apps/host/src/modules/workspaces/workspaces.store.ts`.
- Produces: `export interface WorkspaceChats` and `export class WorkspaceService` with constructor `(private readonly store: SqliteWorkspaceStore, private readonly chats: WorkspaceChats)` and public methods `list`, `add`, `select`, `rename`, `relink` and `remove` in `apps/host/src/modules/workspaces/workspaces.service.ts`.
- Produces: `export function createWorkspaceRoutes(workspaces: WorkspaceService): Router` in `apps/host/src/modules/workspaces/workspaces.routes.ts`.
- Produces: `export type WorkspaceLookup = Pick<SqliteWorkspaceStore, 'selectedId' | 'get' | 'folders'>` in `apps/host/src/modules/workspaces/index.ts`.

**STOP when:** Task protocol only

**Forbidden:** Do not change `scripts/check-boundaries.mjs` or `.oxlintrc.json`. Do not change HTTP paths, status codes or JSON bodies.

- [ ] **Step 1: Write the failing tests**

In `apps/host/tests/workspace-registry.test.mjs`:

1. Replace the `WorkspaceRegistry` import with `import { SqliteWorkspaceStore, WorkspaceService } from '../lib/types/modules/workspaces/index.js'`.
2. Replace every `new WorkspaceRegistry(` call in the file with `new SqliteWorkspaceStore(`.
3. Add this test at the end of the file:

```js
test('WorkspaceService blocks relink and remove on active requests and ungroups before publishing', async t => {
  const { dir, home, dataRoot } = await setup(t)
  const events = []
  const store = new SqliteWorkspaceStore({
    path: join(dataRoot, 'db', 'workspaces.sqlite'),
    home,
    dataRoot,
    publish: notice => events.push(['publish', notice.version]),
  })
  t.after(() => store.close())
  let active = true
  const service = new WorkspaceService(store, {
    hasActiveRequest: async () => active,
    ungroup: async workspaceId => {
      events.push(['ungroup', workspaceId])
    },
  })
  const first = await folder(dir, 'first')
  const second = await folder(dir, 'second')
  const added = await service.add(first, 0)
  const id = added.selectedId
  events.length = 0

  await assert.rejects(
    service.relink(id, second, added.version),
    error => error instanceof WorkspaceError && error.code === 'WORKSPACE_REQUEST_ACTIVE',
  )
  await assert.rejects(
    service.remove(id, added.version),
    error => error instanceof WorkspaceError && error.code === 'WORKSPACE_REQUEST_ACTIVE',
  )
  assert.equal((await store.get(id)).folder, await realpath(first))
  assert.deepEqual(events, [])

  active = false
  const afterRemove = await service.remove(id, added.version)
  assert.equal(afterRemove.selectedId, 'default')
  assert.equal(afterRemove.version, added.version + 1)
  assert.deepEqual(events, [
    ['ungroup', id],
    ['publish', added.version + 1],
  ])
})
```

- [ ] **Step 2: Run the test and make sure that it fails**

Run: `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs`
Expected: FAIL. Node exits with a non-zero code because `SqliteWorkspaceStore` and `WorkspaceService` do not exist in `modules/workspaces/index.js`.

- [ ] **Step 3: Implement `SqliteWorkspaceStore`, `WorkspaceService`, `workspaces.routes.ts` and `workspaces/index.ts`**

1. In `apps/host/src/modules/workspaces/workspaces.store.ts`:
   - Rename `WorkspaceRegistryOptions` to `WorkspaceStoreOptions`.
   - Rename `WorkspaceRegistry` to `SqliteWorkspaceStore` and update the constructor parameter type to `WorkspaceStoreOptions`.
   - Keep `AddResult` and all method signatures and SQL behavior unchanged.
2. In `apps/host/src/modules/workspaces/workspaces.service.ts`:
   - Import `type { SqliteWorkspaceStore }` from `'./workspaces.store.ts'`.
   - Remove `WorkspaceOperations` and `createWorkspaceOperations`.
   - Keep `export interface WorkspaceChats`.
   - Export `class WorkspaceService` with `constructor(private readonly store: SqliteWorkspaceStore, private readonly chats: WorkspaceChats)` and methods `list()`, `add(folder: unknown, expectedVersion: number)`, `select(id: string, expectedVersion: number)`, `rename(id: string, name: unknown, expectedVersion: number)`, `relink(id: string, folder: unknown, expectedVersion: number)` and `remove(id: string, expectedVersion: number)`. Keep the active-request check before `relink` and `remove`, and keep `ungroup` before `publishVersion` in `remove`.
3. In `apps/host/src/modules/workspaces/workspaces.routes.ts`, import `type { WorkspaceService }` from `'./workspaces.service.ts'` and change `createWorkspaceRoutes` to take `workspaces: WorkspaceService`.
4. In `apps/host/src/modules/workspaces/index.ts`, export only `SqliteWorkspaceStore` (`./workspaces.store.ts`), `WorkspaceService` and `type WorkspaceChats` (`./workspaces.service.ts`), `createWorkspaceRoutes` (`./workspaces.routes.ts`), `mapWorkspaceError` (`./workspaces.errors.ts`), and `export type WorkspaceLookup = Pick<SqliteWorkspaceStore, 'selectedId' | 'get' | 'folders'>`.

- [ ] **Step 4: Update `apps/host/src/server.ts`**

1. Import `SqliteWorkspaceStore` and `WorkspaceService` in place of `WorkspaceRegistry` and `createWorkspaceOperations` from `'./modules/workspaces/index.ts'`.
2. Change `StorageLayer.registry` and `let registry` in `openStorageLayer` from `WorkspaceRegistry` to `SqliteWorkspaceStore`, and construct `new SqliteWorkspaceStore(...)`.
3. In `createHostOptions`, replace `createWorkspaceRoutes(createWorkspaceOperations(registry, chats))` with `createWorkspaceRoutes(new WorkspaceService(registry, chats))`.

- [ ] **Step 5: Build, run tests and run checks**

Run: `corepack pnpm@11.28.5 build`
Expected: exit code 0.

Run: `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs apps/host/tests/chat-persistence.test.mjs e2e/local-foundation.test.mjs`
Expected: exit code 0 and `# fail 0`.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [ ] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
