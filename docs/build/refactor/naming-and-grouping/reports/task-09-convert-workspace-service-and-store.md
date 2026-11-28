# Task 9 Report: Rename SqliteWorkspaceStore, convert WorkspaceService to a class and wire routes

Read this file to know how Task 9 renamed `WorkspaceRegistry` to `SqliteWorkspaceStore`, replaced `createWorkspaceOperations` with `class WorkspaceService`, and why the task closed with exceptions for the `build` and `lint` checks.

## Files changed

- `apps/host/src/modules/workspaces/workspaces.store.ts`: renamed `WorkspaceRegistryOptions` to `WorkspaceStoreOptions` and `WorkspaceRegistry` to `SqliteWorkspaceStore`. `AddResult`, every method signature and every SQL statement are unchanged.
- `apps/host/src/modules/workspaces/workspaces.service.ts`: removed `WorkspaceOperations` and `createWorkspaceOperations`. Added `export class WorkspaceService` with the constructor `(store: SqliteWorkspaceStore, chats: WorkspaceChats)` and the methods `list`, `add`, `select`, `rename`, `relink` and `remove`. `WorkspaceChats` stays in this file. `relink` and `remove` keep the active-request check, and `remove` keeps `ungroup` before `publishVersion`.
- `apps/host/src/modules/workspaces/workspaces.routes.ts`: `createWorkspaceRoutes` takes `workspaces: WorkspaceService`. The HTTP paths, the status codes and the JSON bodies are unchanged.
- `apps/host/src/modules/workspaces/index.ts`: exports only `SqliteWorkspaceStore`, `WorkspaceService`, `type WorkspaceChats`, `createWorkspaceRoutes`, `mapWorkspaceError` and `type WorkspaceLookup = Pick<SqliteWorkspaceStore, 'selectedId' | 'get' | 'folders'>`.
- `apps/host/src/server.ts`: imports `SqliteWorkspaceStore` and `WorkspaceService` in place of `WorkspaceRegistry` and `createWorkspaceOperations`. `StorageLayer.registry` and `let registry` have the type `SqliteWorkspaceStore`, and `createHostOptions` builds `createWorkspaceRoutes(new WorkspaceService(registry, chats))`. The other changes in this file belong to the concurrent provider, attachment and web-react work.
- `apps/host/tests/workspace-registry.test.mjs`: the import is `{ SqliteWorkspaceStore, WorkspaceService }` from `../lib/types/modules/workspaces/index.js`, every `new WorkspaceRegistry(` call is `new SqliteWorkspaceStore(`, and the test `WorkspaceService blocks relink and remove on active requests and ungroups before publishing` is new.
- `docs/build/refactor/naming-and-grouping/plan/task-09-convert-workspace-service-and-store.md`: marked the steps as done.
- `docs/build/refactor/naming-and-grouping/plan/README.md`: set the Task 9 status to `Done` and linked this report.
- `docs/build/refactor/naming-and-grouping/reports/README.md`: added the row for Task 9.
- `docs/build/refactor/naming-and-grouping/reports/task-09-convert-workspace-service-and-store.md`: this report.

Steps 1 to 4 were already in the working tree when this run started. This run checked every step against the task file and then ran the checks of Step 5.

No table is requested by the task, and no decision table sends an item to this report.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` (first run) | 1 | Every bundle printed `Build complete`, including `apps/web` Vite `built in 1.37s`. No error line was in the captured output. The run overlapped with the concurrent `apps/web` React rewrite. |
| `corepack pnpm@11.28.5 build` (retry) | 0 | The same bundles completed, and no `error` line is in the log |
| `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs apps/host/tests/chat-persistence.test.mjs e2e/local-foundation.test.mjs` (first run) | 1 | `# tests 48`, `# pass 39`, `# fail 9`. All 9 failures are `ENOENT: no such file or directory, scandir 'apps/web/dist'` at `loadWebDistAssets`, before any assertion | 
| `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs` | 0 | `# tests 18`, `# pass 18`, `# fail 0` |
| `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs apps/host/tests/chat-persistence.test.mjs` | 0 | `# tests 31`, `# pass 31`, `# fail 0` |
| `node --test --test-reporter=tap e2e/local-foundation.test.mjs` (retry) | 0 | `# tests 17`, `# pass 17`, `# fail 0` |
| `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs apps/host/tests/chat-persistence.test.mjs e2e/local-foundation.test.mjs` (retry) | 0 | `# tests 48`, `# pass 48`, `# fail 0` |
| `corepack pnpm@11.28.5 lint` | 1 | 4013 errors, all in `apps/web/dist/assets/index-DGCoaXod.js`, for example `error eslint(no-unused-expressions): Expected expression to be used` |
| `corepack pnpm@11.28.5 exec oxlint apps/host/src/modules/workspaces apps/host/src/server.ts apps/host/tests/workspace-registry.test.mjs` | 0 | no output, no error |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 339 file(s) checked, 0 error(s) in 0 file(s)` |

## STOP and retry

- Step 5, the first `build` returned exit code 1 while every bundle reported `Build complete`. The cause is outside the `Files` block: the concurrent `apps/web` React rewrite changes `apps/web/src`, `apps/web/tsconfig.json` and `apps/web/package.json` at the same time. Retry: the same command returned exit code 0, and this task changed no file between the two runs.
- Step 5, the first combined test run returned exit code 1 with 9 failures. The cause is outside the `Files` block: the concurrent `apps/web` React rewrite deletes `apps/web/dist` and builds it again, so `loadWebDistAssets` found no directory. Every failure happens at Local Web startup, before the asserted behaviour. All 31 host tests, including the new `WorkspaceService` test, passed in the same run. Retry after the rewrite rebuilt `apps/web/dist`: `# fail 0`.
- Step 5, `lint` returned exit code 1. All 4013 errors are in `apps/web/dist/assets/index-*.js`, the untracked bundle of the concurrent `apps/web` React rewrite. `apps/web/dist` is a build output, and the global constraints forbid changes in `apps/web/`. `oxlint` on the files of this task returned exit code 0. This task closed with this exception.
- Step 5, `check:boundaries` ran through a PowerShell pipe and printed `NativeCommandError` on stderr for the pnpm script echo. The command still reported `check-boundaries: 0 violation(s)` and returned exit code 0.

## What the commands do not prove

- `lint` does not pass in this working tree. This task does not prove that `lint` passes over the whole repository, only over the files that it changed.
- The `build` of the first run failed, so the record does not prove that the sources compile together with the exact state of the concurrent web, provider and attachment changes at that moment.
- The new test starts `SqliteWorkspaceStore` directly. It does not prove the HTTP paths of workspaces, the `409` status for `WORKSPACE_REQUEST_ACTIVE`, or the change notices of a running Host beyond what `e2e/local-foundation.test.mjs` covers.
- `check:boundaries` and `lint` check names and rules, not runtime behaviour.
