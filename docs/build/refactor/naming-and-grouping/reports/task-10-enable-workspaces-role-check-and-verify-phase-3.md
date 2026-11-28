# Task 10 Report: Enable role-file-symbol for workspaces and check Phase 3

Read this file to know how Task 10 found `workspaces` already in `ROLE_FILE_MODULES`, which Phase 3 exit checks passed, and which failures came from the concurrent provider, web-react and attachment work.

## Files changed

- `docs/build/refactor/naming-and-grouping/plan/task-10-enable-workspaces-role-check-and-verify-phase-3.md`: marked the steps as done.
- `docs/build/refactor/naming-and-grouping/plan/README.md`: set the Task 10 status to `Done` and linked this report.
- `docs/build/refactor/naming-and-grouping/reports/README.md`: added the row for Task 10.
- `docs/build/refactor/naming-and-grouping/reports/task-10-enable-workspaces-role-check-and-verify-phase-3.md`: this report.

No production file, test file or check file changed in this run. Steps 1 and 3 were already in the working tree when the run started:

- `tests/check-boundaries.test.mjs` already used `SqliteWorkspaceStore` in the two module import tests, already had the `workspaceFiles` block, already had the valid `workspaces` fixtures with the unlisted `providers.service.ts` fixture, and already called `findings(files, {}, ['chats', 'workspaces'])`.
- `tests/oxlint-boundaries.test.mjs` already had the test `rejects a store, migrations, the SQL driver and another module store inside a module routes file`, and the accepted-fixture test already used `WorkspaceService`, `./workspaces.migrations.ts` and `migrateWorkspacesDatabase`.
- `.oxlintrc.json` already had `"./*.migrations.ts"` in the `**/apps/host/src/modules/*/*.routes.ts` override.
- `docs/conventions/project-structure.md` already said `*.migrations.ts` in the Enforcement table row for module routes.
- `scripts/check-boundaries.mjs` already had `workspaces` in `ROLE_FILE_MODULES`. The parallel Phase 4 and Phase 5 work added `providers`, `research` and `attachments` to the same constant during this run.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs` (Step 2) | 0 | `# tests 76`, `# pass 76`, `# fail 0`. Step 2 expects FAIL. The test files and the two rules were already in place, so no failure was possible |
| `git grep -n -E "<old workspace symbols>" -- apps/host/src apps/host/tests e2e` (Step 4, first run) | 1 | No line, as the step expects |
| `git grep -n -E "<old workspace symbols>" -- apps/host/src apps/host/tests e2e` (Step 4, after the concurrent commits) | 1 | No line, as the step expects |
| `corepack pnpm@11.28.5 exec biome format apps/host/src/modules/workspaces apps/host/src/server.ts apps/host/tests/workspace-registry.test.mjs scripts/check-boundaries.mjs tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs` | 0 | `Checked 14 files in 108ms. No fixes applied.` |
| `corepack pnpm@11.28.5 build` (first run) | 0 | `tsc -b` passed and every workspace bundle printed `Build complete` |
| `corepack pnpm@11.28.5 lint` (first run) | 0 | `oxlint` reported no diagnostic |
| `corepack pnpm@11.28.5 check:boundaries` (first run) | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` (first run) | 0 | `check-docs: 340 file(s) checked, 0 error(s) in 0 file(s)` |
| `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs` (second run, after the concurrent commits) | 0 | `# tests 77`, `# pass 77`, `# fail 0` |
| `corepack pnpm@11.28.5 build` (second run, after the concurrent commits) | 2 | Two `error TS2379` lines in `apps/web/src/api/preferences.ts(6,57)` and `apps/web/src/api/providers.ts(15,51)`: `signal: AbortSignal \| undefined` is not assignable under `exactOptionalPropertyTypes` |
| `corepack pnpm@11.28.5 lint` (second run) | 0 | `oxlint` reported no diagnostic |
| `corepack pnpm@11.28.5 check:boundaries` (second run) | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` (second run) | 0 | `check-docs: 343 file(s) checked, 0 error(s) in 0 file(s)` |

### Non-live test suites

The first loop ran the 19 scripts. The second loop repeated the 5 failing scripts and ran the 4 scripts that the interruption skipped. The table gives the result of the last run of each script.

| Script | Exit code | Tests passed |
| --- | --- | --- |
| `test:local-foundation` | 0 | 63 |
| `test:model-requests` | 0 | 57 |
| `test:source-permissions` | 0 | 11 |
| `test:attachments` | 0 | 32 |
| `test:research` | 0 | 5 |
| `test:images` | 0 | 39 |
| `test:outline-workflow` | 0 | 6 |
| `test:brief-foundation` | 0 | 16 |
| `test:deck-review` | 0 | 25 |
| `test:generation-publication` | 0 | 72 |
| `test:slide-pipeline` | 0 | 9 |
| `test:session-persistence` | 0 | 8 |
| `test:tools-browser` | 0 | 26 |
| `test:opencode-resources` | 0 | 3 |
| `test:browser-smoke` | 1 | 21 of 22. See the STOP list |
| `test:env-startup` | 0 | 2 |
| `test:http-edge` | 0 | 12 |
| `test:local-web` | 0 | 14 |
| `test:layouts` | 0 | 10 |

Test counts are higher than the Phase 2 report because the concurrent Phase 4, Phase 5 and web-react work added tests to the same scripts. Every suite except `test:browser-smoke` reported `# fail 0`.

No table is requested by the task other than this one, and no decision table sends an item to this report.

## STOP and retry

- Step 2, expected FAIL, got PASS (`# tests 76`, `# fail 0`). Cause: Steps 1 and 3 were already in the working tree before this run started, so the check already enforced `workspaces` and the migration file. This is not a defect: the check of Step 3 returned `check-boundaries: 0 violation(s)`, and Step 4 found no old symbol. This run records the deviation instead of reverting the files to make the test fail.
- Step 5, the first test loop returned exit code 1 for 5 scripts: `test:generation-publication` (7 fail), `test:slide-pipeline` (1 fail), `test:session-persistence` (1 fail), `test:tools-browser` (2 fail), `test:browser-smoke` (2 fail). Every `test:browser-smoke` failure and 19 of the other 20 failures were `SyntaxError: The requested module '../../lib/types/modules/attachments/index.js' does not provide an export named 'AttachmentFileStore'` at `apps/host/tests/fixtures/b02-helpers.mjs:12`. Cause: the concurrent Phase 5 attachment work changed `apps/host/src/modules/attachments/index.ts` and its build output while the loop ran, so the compiled `lib/` copy was stale for a moment. The symbol is in both files now. Retry after the concurrent flows committed: all 5 scripts reached `# fail 0`, except the `test:browser-smoke` case below.
- Step 5, the first loop stopped at `test:env-startup` because of the run interruption, not a test failure. Retry: the second loop ran `test:env-startup`, `test:http-edge`, `test:local-web` and `test:layouts`, and each returned exit code 0.
- Step 5, `test:browser-smoke` returned exit code 1 with `# tests 22`, `# pass 21`, `# fail 1` in two separate runs. The failing test is `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides` at `e2e/browser-smoke.test.mjs:762`, with the message `Explicit continuation did not finish the remaining slides: {"status":"Đang gửi","progress":"1/3 slide đã lưu · Chưa hoàn tất, không tự chạy tiếp"}`. The test exercises the deck generation continuation through the React Browser shell. It does not read or write the workspaces module, and the workspaces test `real browser boots without a model: workspaces, chats, search, drafts and an unreadable chat` passes in the same run. The flow is owned by the concurrent web-react refactor and by Phase 6 of this plan, which is not started. This task did not fix it, because the fix is outside Phase 3 and the global constraints forbid changes in `apps/web/`.
- Step 5, the second `build` returned exit code 2 with two `error TS2379` lines in `apps/web/src/api/preferences.ts` and `apps/web/src/api/providers.ts`. Both files are new files of the concurrent web-react settings work, and they are under `apps/web/`, which this plan forbids to change. The first `build` of this run, before those files existed, returned exit code 0. This task did not fix them.
- Step 5, `lint`, `check:boundaries` and `check:docs` printed a PowerShell `NativeCommandError` line for the pnpm script echo on stderr. Each command still returned exit code 0.

## What the commands do not prove

- Phase 3 is not proven against the final tree. The first `build`, `lint`, `check:boundaries`, `check:docs` and test loop ran before the concurrent flows committed `8c4f9d7`, `08babe1` and `a82bb6d`. The second `build` fails on `apps/web/` files of the web-react flow, so the record does not prove that the current tree compiles.
- `role-file-symbol` checks only the name of the main export and the suffix of a `Service` or `Store` class. It does not check behaviour, imports or the number of exports.
- `check:boundaries` and `lint` check names and rules, not runtime behaviour.
- The 19 suites are non-live. They use local fixtures and a fake OpenCode CLI, so they do not prove a real provider run.
- The suites exercise the HTTP behaviour, but this task does not compare the wire contract against a stored specification. The unchanged `apps/web/` tests and `test:http-edge` are the only contract evidence.
