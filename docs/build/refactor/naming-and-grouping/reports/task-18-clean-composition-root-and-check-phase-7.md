# Task 18 Report: Clean the composition root, db/ and root files and check Phase 7

Read this file to review the completed Phase 7 refactor of `server.ts`, `db/` and the root files of `apps/host/src/`, the review fixes and the exit checks.

**Status:** Done. Build, lint, boundary, docs and format checks passed. The user stopped the full test run after 16 of 20 non-live scripts. Those 16 scripts passed, and one of them passed only on a second run.

The user requested direct diagnosis and execution, followed by one Task 18 record and report for Phase 7.
This report records the work performed. It does not claim that a plan or failing test preceded the implementation.

## Work log and files changed

| Order | Work | Files |
| --- | --- | --- |
| 1 | Answered the `Open` items of Phase 7 in the module map and recorded the Revision 7 decisions | `module-map.md`, `plan/README.md` |
| 2 | Moved `mapRunFailure` to `http/error-handler.ts` with `runFailureStatuses` and `mapApplicationFailure`. Moved the admission allowlist to `admitPassthroughCodes` in `RunController` | `apps/host/src/http/error-handler.ts`, `runs/lifecycle/run-controller.ts`, `server.ts` |
| 3 | Removed `mapSessionFailure`. `ChatService`, `ChatRequestService`, `ResearchService` and `AttachmentService` translate `SESSION_CORRUPT` to `CHAT_UNREADABLE` (HTTP 409) | `modules/chats/*`, `modules/research/*`, `modules/attachments/*` |
| 4 | Renamed `SessionDatabase` to `ChatDatabase`, `SessionError` to `DatabaseError`, `db/contracts.ts` to `db/records.ts` and `db/sessions-schema.ts` to `db/chats.migrations.ts` | `apps/host/src/db/*` |
| 5 | Replaced `web-state.ts` and `settings-routes.ts` with `modules/settings/` and `db/settings-database.ts` with `db/settings.migrations.ts`. Added `SettingsError` (`PREFERENCES_STALE`, HTTP 409) | `apps/host/src/modules/settings/*`, `apps/host/src/db/settings-*.ts` |
| 6 | Moved `storage-root.ts` and `credential-store.ts` to `storage/` | `apps/host/src/storage/*` |
| 7 | Moved `createDeckStore` to `modules/deck/deck-store.ts`. Replaced `createPreparedImageReader` with `AttachmentService.preparedImage` | `modules/deck/deck-store.ts`, `modules/attachments/attachments.service.ts`, `server.ts` |
| 8 | Renamed type files: `http/contracts.ts` to `http.types.ts`, `tools/policy/contracts.ts` to `policy.types.ts`, `tools/sources/attachment-contracts.ts` to `attachment.types.ts` | `apps/host/src/http/*`, `apps/host/src/tools/*` |
| 9 | Narrowed each barrel to exports that a file outside its folder imports. Pointed tests at internal `lib/` files | `index.ts` files in `apps/host/src/`, `apps/host/tests/*` |
| 10 | Added `settings` to `ROLE_FILE_MODULES`. Added the `storage/` and `http/error-handler.ts` import rules, with tests | `scripts/check-boundaries.mjs`, `.oxlintrc.json`, `docs/conventions/project-structure.md`, `tests/check-boundaries.test.mjs`, `tests/oxlint-boundaries.test.mjs` |
| 11 | Added `apps/host/tests/settings-and-error-handler.test.mjs` and registered it in `test:local-web` | `apps/host/tests/settings-and-error-handler.test.mjs`, `package.json` |
| 12 | Ran the independent review and fixed the findings (see below) | See the review table |
| 13 | Closing audit: removed the dead globs `../*-store.ts` and `../*-state.ts` from the two `http/` rules in `.oxlintrc.json`. Removed `createSourceAccess` from `tools/index.ts`, because only a test used it. `source-access.test.mjs` imports `tools/policy/source-access.js` | `.oxlintrc.json`, `apps/host/src/tools/index.ts`, `apps/host/tests/source-access.test.mjs` |
| 14 | Recorded Revision 7, Task 18, this report, the module map, the workstream status and the changelog | `README.md`, `module-map.md`, `plan/README.md`, `plan/task-18-*.md`, `reports/README.md`, `CHANGELOG.md` |

`server.ts` went from 714 lines (2026-11-27) to 557 lines. The root of `apps/host/src/` holds only `cli.ts`, `contract-sync.ts` and `server.ts`.

## Commands run

Commands ran in Git Bash from `C:\Users\Duy\Desktop\DeckAgent`, after the closing audit edits.

| Command | Exit code | Key output or result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | 0 | All packages built |
| `corepack pnpm@11.28.5 lint` | 0 | No diagnostics |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `0 violation(s)` with `settings` in `ROLE_FILE_MODULES` |
| `corepack pnpm@11.28.5 exec biome format` on the changed Host, test and script files | 0 | 69 files checked, no changes needed |
| Barrel audit script: each export of each `index.ts` in `apps/host/src/` against imports outside its folder | — | Only `createSourceAccess` in `tools/index.ts` had no consumer. Removed in order 13 |
| `corepack pnpm@11.28.5 test:local-foundation` (first run) | 1 | 62 passed, 1 failed: `search, unreadable chats and folder status` got HTTP 500 `HOST_ERROR` for `GET /api/sessions/broken/history` instead of 409 `CHAT_UNREADABLE` |
| Same test alone, 9 runs | 0 | 9 of 9 passed |
| `corepack pnpm@11.28.5 test:local-foundation` (second run) | 0 | 63 passed, 0 failed |
| `test:model-requests` | 0 | 57 passed |
| `test:source-permissions` | 0 | 11 passed (includes the changed `source-access.test.mjs`) |
| `test:attachments` | 0 | 32 passed |
| `test:research` | 0 | 8 passed |
| `test:images` | 0 | 39 passed |
| `test:outline-workflow` | 0 | 6 passed |
| `test:brief-foundation` | 0 | 16 passed |
| `test:deck-review` | 0 | 27 passed |
| `test:generation-publication` | 0 | 72 passed |
| `test:slide-pipeline` | 0 | 9 passed |
| `test:session-persistence` | 0 | 8 passed |
| `test:tools-browser` | 0 | 33 passed |
| `test:opencode-resources` | 0 | 3 passed |
| `test:browser-smoke` | 0 | 22 passed |
| `test:env-startup` | 0 | 2 passed |
| `test:http-edge`, `test:local-web`, `test:web`, `test:layouts` | Not run | The user stopped the run during `test:http-edge` |

The earlier Phase 7 session also ran three mutation proofs on `settings-and-error-handler.test.mjs`: `HOST_BUSY` 429 to 500, `PREFERENCES_STALE` 409 to 400 and removal of `DRAFT_CONFLICT` from `admitPassthroughCodes`. Each mutant made the file fail. The file header lists these and two more mutants.

## Independent review

A fresh-context reviewer checked the Phase 7 diff against `code.md`, `project-structure.md`, `testware.md` and `LESSONS.md`.

| Severity | Finding | Resolution |
| --- | --- | --- |
| High | After `mapSessionFailure` was removed, `ResearchService.sources`, `AttachmentService.draft` and `ChatRequestService.get`, `events` and `stop` let `SESSION_CORRUPT` through as HTTP 500 | Each service translates it to `CHAT_UNREADABLE` (HTTP 409). Test: `ChatService, ChatRequestService, ResearchService and AttachmentService translate corrupt SQLite rows to HTTP 409 CHAT_UNREADABLE` |
| Medium | The status map of `RunFailure` used `Record<string, number>` with `?? 500` | `runFailureStatuses` has one entry for each known code. Unknown codes map to 500 through `isKnownRunFailureCode` |
| Medium | `SettingsErrorCode` had four codes that no code threw | `SettingsErrorCode` has only `PREFERENCES_STALE`. Migration errors stay `DatabaseError` |
| Low | Barrels exported symbols that only tests used | Barrels narrowed. Tests import internal `lib/` files. The closing audit removed the last one, `createSourceAccess` |
| Low | `http/` rules in `.oxlintrc.json` kept dead globs for old root files | Removed in the closing audit |
| Low | The `storage/` lint test named eight categories but asserted five diagnostics | The test imports eight denied targets and asserts eight diagnostics |

The closing audit edits (order 13) did not get a second independent review. They remove a dead glob and one barrel export, and `lint`, `check:boundaries` and `test:source-permissions` passed after them.

## STOP conditions and retries

| Event | Action and result |
| --- | --- |
| `test:local-foundation` failed one test on the first run (HTTP 500 instead of 409 for a corrupt chat history) | `apps/host/lib/` was not rebuilt during the run. The same test passed 9 of 9 runs alone, and the full script passed on the second run. The cause was not found. The Host does not log the error behind a `HOST_ERROR` response, so the run gave no stack |
| The user stopped the test run after 16 scripts | Recorded the 4 scripts that did not run |

## What the commands do not prove

- `test:http-edge`, `test:local-web` (which contains `settings-and-error-handler.test.mjs`), `test:web` and `test:layouts` did not run after the closing audit. The earlier Phase 7 session ran all of them with zero failures before the review fixes.
- The intermittent HTTP 500 on a corrupt chat history has no known cause. It can be a defect that occurs only under load.
- Live provider suites (`test:research-live`, `test:opencode-live`) did not run.
- The working tree also holds uncommitted `apps/web/` and `packages/host/contracts/` changes of the concurrent web-react work. The test results include that code.
