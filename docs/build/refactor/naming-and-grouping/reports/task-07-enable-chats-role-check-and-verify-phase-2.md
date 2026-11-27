# Task 7 Report: Enable role-file-symbol for chats and check Phase 2

Read this file to know how Task 7 enabled `role-file-symbol` for `chats`, which Phase 2 exit checks passed, and which pre-existing `format:check` failures a person accepted as an exception.

## Files changed

- `scripts/check-boundaries.mjs`: changed `const ROLE_FILE_MODULES = []` to `const ROLE_FILE_MODULES = ['chats']`.
- `tests/check-boundaries.test.mjs`: added the assertion `assert.deepEqual(findings(files), [...])` to the test `checkBoundaries rejects role files without their role symbols in a listed module`. The assertion uses no `roleFileModules` argument, so it reads the default `ROLE_FILE_MODULES`.
- `apps/host/src/server.ts`: collapsed the `./db/index.ts` import to one line. This is a Phase 2 formatting defect that `format:check` found and Step 5 repaired.
- `docs/build/refactor/naming-and-grouping/plan/task-07-enable-chats-role-check-and-verify-phase-2.md`: marked the steps as done.
- `docs/build/refactor/naming-and-grouping/plan/README.md`: set the Task 7 status to `Done` and linked this report.
- `docs/build/refactor/naming-and-grouping/reports/README.md`: added the row for Task 7.
- `docs/build/refactor/naming-and-grouping/reports/task-07-enable-chats-role-check-and-verify-phase-2.md`: this report.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap tests/check-boundaries.test.mjs` (Step 2, before the change) | 1 | Test 28 failed: actual `[]`, expected the 7 `role-file-symbol` findings. `# fail 1` |
| `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs` | 0 | `# tests 75`, `# pass 75`, `# fail 0` |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `git grep -n -E "<old chat symbols>" -- apps/host/src/modules/chats apps/host/src/server.ts apps/host/src/modules/deck/confirmation-coordinator.ts apps/host/tests/fixtures` | 1 | No line, as the step expects |
| `corepack pnpm@11.28.5 format:check` | 1 | `Found 21 errors` in 20 files. See the next table |
| `corepack pnpm@11.28.5 build` | 0 | `tsc -b` passed and all workspace bundles completed |
| `corepack pnpm@11.28.5 lint` | 0 | `oxlint` reported no error |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 320 file(s) checked, 0 error(s) in 0 file(s)`. Re-run after this report was created: `321 file(s)`, 0 error(s) |
| `corepack pnpm@11.28.5 exec biome format apps/host/src/modules/chats apps/host/src/server.ts packages/host/contracts apps/host/tests/fixtures apps/host/tests/chat-persistence.test.mjs apps/host/tests/web-management.test.mjs` | 1 | 1 error: `apps/host/tests/fixtures/attachment-fixtures.mjs`. This file has CRLF only and no git diff |

### `format:check` failures

| Group | Files | Difference |
| --- | --- | --- |
| Not Biome-formatted at `HEAD` | `packages/presentation/design/tests/design-catalog.test.mjs`, `tests/check-docs.test.mjs`, `tests/oxlint-boundaries.test.mjs` | Real format difference. `git show HEAD:<file>` run through `biome format --stdin-file-path=<file>` also reports the difference |
| CRLF line endings only | `apps/host/src/storage-root.ts`, `apps/host/tests/fixtures/attachment-fixtures.mjs`, `apps/web/tests/deck-client.test.mjs`, `biome.json`, `packages/presentation/deck/tests/bound-outline.test.mjs`, `packages/presentation/deck/tests/deck-brief.test.mjs`, `packages/presentation/deck/tests/fixtures/brief.mjs`, `packages/presentation/deck/tests/generation-confirmation.test.mjs`, `packages/presentation/deck/tests/interview-policy.test.mjs`, `packages/presentation/deck/tests/outline-state.test.mjs`, `packages/presentation/document/src/contracts.ts`, `packages/presentation/document/tests/slide-document.test.mjs`, `packages/presentation/html/src/contracts.ts`, `packages/presentation/pptx/src/index.ts`, `scripts/check-docs.mjs`, `scripts/hooks/post-edit.mjs`, `tests/post-edit-hook.test.mjs` | After `\r\n` to `\n` conversion, `biome format` accepts the file. The files show no line in `git status` |

All 20 files are outside the `Files` block of Task 7 and outside the Phase 2 repair area. Two of them are in `packages/presentation/`, which the global constraints forbid to change. The person accepted the exception and selected `Mark Done with exception`.

### Non-live test suites

| Script | Exit code | Tests passed |
| --- | --- | --- |
| `test:local-foundation` | 0 | 61 |
| `test:model-requests` | 0 | 57 |
| `test:source-permissions` | 0 | 11 |
| `test:attachments` | 0 | 31 |
| `test:research` | 0 | 5 |
| `test:images` | 0 | 39 |
| `test:outline-workflow` | 0 | 6 |
| `test:brief-foundation` | 0 | 16 |
| `test:deck-review` | 0 | 25 |
| `test:generation-publication` | 0 | 72 |
| `test:slide-pipeline` | 0 | 9 |
| `test:session-persistence` | 0 | 8 |
| `test:tools-browser` | 0 | 25 |
| `test:opencode-resources` | 0 | 3 |
| `test:browser-smoke` | 0 | 22 |
| `test:env-startup` | 0 | 2 |
| `test:http-edge` | 0 | 12 |
| `test:local-web` | 0 | 12 |
| `test:layouts` | 0 | 10 |

Each suite reported `# fail 0`. The total is 426 tests.

## STOP and retry

- Step 5, `format:check` returned exit code 1 with 21 errors. Cause: 3 tracked files are not Biome-formatted at `HEAD`, and 17 tracked files have CRLF line endings in this Windows working copy. The step's `Expected` is exit code 0. First action: repaired the one Phase 2 defect, the `apps/host/src/server.ts` import block. The other 20 files stay outside the task scope, so the step stayed failing and the task stopped. The person chose `Mark Done with exception`.
- Step 5, first `build` and `lint` commands piped through `Select-Object`: PowerShell printed `NativeCommandError` for the pnpm script echo and the pipeline returned exit code 1. Cause: PowerShell treats the stderr echo of `corepack` as an error. Retry: redirected each command to a file and read `$LASTEXITCODE`; `build` and `lint` returned 0.

## What the commands do not prove

- `format:check` does not pass. This task does not prove that the 3 files with a real difference at `HEAD` become formatted, and it does not normalise the CRLF working copy.
- `role-file-symbol` checks only the name of the main export and the suffix of a `Service` or `Store` class. It does not check behaviour, imports or the number of exports.
- The 19 suites are non-live. They use local fixtures and a fake OpenCode CLI, so they do not prove a real provider run.
- The suites exercise the HTTP behaviour, but this task does not compare the wire contract against a stored specification. The unchanged `apps/web/` tests and the `test:http-edge` suite are the only contract evidence.
