# Task 8 Report: Split workspace types, unify WorkspaceError and rename migrations

Read this file to know how Task 8 created `workspace.types.ts` and `workspaces.migrations.ts`, merged the workspace errors into `workspaces.errors.ts`, and why the task closed with an exception for the `build` and `e2e` checks.

## Files changed

- `apps/host/src/modules/workspaces/workspace.types.ts`: new file with `defaultWorkspaceId`, `FolderStatus`, `Workspace`, `WorkspaceState` and `FolderRefusal`.
- `apps/host/src/modules/workspaces/contracts.ts`: removed. Its types moved to `workspace.types.ts`, and its error types moved to `workspaces.errors.ts`.
- `apps/host/src/modules/workspaces/workspaces.errors.ts`: added `WorkspaceErrorCode` with 13 codes (the 12 existing codes plus `WORKSPACE_REQUEST_ACTIVE`), `WorkspaceErrorDetail`, `WorkspaceError` and `mapWorkspaceError`. Added `WORKSPACE_REQUEST_ACTIVE: 409` to `workspaceStatus`. Removed `mapWorkspaceFailure` and the `contracts.ts` and `workspaces.service.ts` imports.
- `apps/host/src/modules/workspaces/workspaces.migrations.ts`: new file from `schema.ts`. `initialize` became `migrateWorkspacesDatabase(db, defaultName)`. The SQL statements, pragmas, schema version 2 and application ID are unchanged.
- `apps/host/src/modules/workspaces/schema.ts`: removed.
- `apps/host/src/modules/workspaces/folder-policy.ts`: imports `FolderRefusal` from `workspace.types.ts` and `WorkspaceError` from `workspaces.errors.ts`.
- `apps/host/src/modules/workspaces/workspace-name.ts`: imports `WorkspaceError` from `workspaces.errors.ts`.
- `apps/host/src/modules/workspaces/workspaces.store.ts`: imports the types and `defaultWorkspaceId` from `workspace.types.ts`, calls `migrateWorkspacesDatabase`, and imports `WorkspaceError` from `workspaces.errors.ts`.
- `apps/host/src/modules/workspaces/workspaces.service.ts`: removed `WorkspaceWorkflowErrorCode` and `WorkspaceWorkflowError`. `requireNoActiveRequest` throws `WorkspaceError('WORKSPACE_REQUEST_ACTIVE', 'Workspace has an active request')`.
- `apps/host/src/modules/workspaces/index.ts` and `apps/host/src/server.ts`: renamed `mapWorkspaceFailure` to `mapWorkspaceError`.
- `apps/host/tests/workspace-registry.test.mjs`: added the import and the test `WorkspaceError and mapWorkspaceError map codes to HTTP status and safe detail`.
- `docs/build/refactor/naming-and-grouping/plan/task-08-split-workspace-types-errors-and-migrations.md`: marked the steps as done.
- `docs/build/refactor/naming-and-grouping/plan/README.md`: set the Task 8 status to `Done` and linked this report.
- `docs/build/refactor/naming-and-grouping/reports/README.md`: added the row for Task 8.
- `docs/build/refactor/naming-and-grouping/reports/task-08-split-workspace-types-errors-and-migrations.md`: this report.

No table is requested by the task, and no decision table sends an item to this report.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs` (Step 2, before the change) | 1 | `SyntaxError: The requested module '../lib/types/modules/workspaces/workspaces.errors.js' does not provide an export named 'WorkspaceError'`, `# fail 1` |
| `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs` | 0 | `ok 17 - WorkspaceError and mapWorkspaceError map codes to HTTP status and safe detail`, `# tests 17`, `# pass 17`, `# fail 0` |
| `corepack pnpm@11.28.5 build` | 1 | `error TS2878: This import path is unsafe to rewrite ...` while `tsc -b` builds `apps/web/tsconfig.json`, and `apps/host/src/server.ts(426,3): error TS6133: 'drafts' is declared but its value is never read.` |
| `node --test --test-reporter=tap apps/host/tests/workspace-registry.test.mjs e2e/local-foundation.test.mjs` | 1 | The workspace test passed. `e2e/local-foundation.test.mjs` failed at load: `SyntaxError: The requested module '../../lib/types/modules/attachments/index.js' does not provide an export named 'SqliteAttachmentStore'`. `# tests 18`, `# pass 17`, `# fail 1` |
| `corepack pnpm@11.28.5 lint` | 0 | `oxlint` reported no error |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 328 file(s) checked, 0 error(s) in 0 file(s)` |

## STOP and retry

- Step 5, `build` returned exit code 1. Cause 1: the `TS2878` error comes from `apps/web/tsconfig.json`, not from a file of this task. The working tree holds uncommitted changes of the Pending web-react Task 7. That task removed `"exclude": ["src/browser/**"]` and added a `packages/presentation/document` reference, so `src/browser/**` belongs to two projects. Cause 2: the `TS6133` error comes from a concurrent uncommitted attachments refactor, which removed the use of the `drafts` parameter in `createHostOptions`. Both causes are outside the `Files` block of Task 8. The global constraints forbid changes in `apps/web/`. The person directed: when the cause is outside the task scope, close the task normally. This task closed with this exception.
- Step 5, `node --test ... e2e/local-foundation.test.mjs` returned exit code 1. Cause: `apps/host/tests/fixtures/session-store.mjs` imports `SqliteAttachmentStore`, an export of the concurrent attachments refactor. The build failed before it rebuilt `apps/host/lib/types`, so the fixture and the library disagree. This file is outside the `Files` block of Task 8. `apps/host/tests/workspace-registry.test.mjs` passed against the host library built from these Task 8 sources.
- Step 5, the first `lint` and `check:boundaries` commands piped through `Select-Object` returned exit code 1. Cause: PowerShell reports the pnpm script echo on stderr as `NativeCommandError`. Retry: ran each command through `cmd /c` with a file redirect. Both commands returned exit code 0.

## What the commands do not prove

- `build` does not pass in this working tree. This task does not prove that the committed files compile together with the uncommitted web-react and attachments changes, and it does not prove a full bundle.
- The `e2e` suite did not run. This task does not prove the HTTP paths of workspaces, the `409` response for `WORKSPACE_REQUEST_ACTIVE`, or the schema 1 upgrade through a started Host.
- The new test checks `WorkspaceError` and `mapWorkspaceError` only. It does not prove that every caller throws every code.
- `check:boundaries` checks the names of role file exports, not behaviour. `lint` checks rules only, not runtime behaviour.
