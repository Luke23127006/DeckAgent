# Task 17 Report: Refactor deck module and check Phase 6

Read this file to review the completed Phase 6 deck module refactor, independent review fixes and full exit checks.

**Status:** Done. All Phase 6 checks and non-live test suites passed.

The user requested direct diagnosis and execution before task creation, followed by one Task 17 record and report for Phase 6.
This report records the work performed. It does not claim that a plan or failing test preceded the implementation.

## Work log and files changed

| Order | Work | Files |
| --- | --- | --- |
| 1 | Read the Phase 6 criteria, module map, naming rules, conventions, lessons and every file in `modules/deck/`, `tools/executors/` and `server.ts` | No file change |
| 2 | Replaced `DeckWorkflowFailure` (`failures.ts`) with `DeckWorkflowError`, `DeckWorkflowErrorCode`, `deckWorkflowErrorCode` and `mapDeckError` using a typed status table | `apps/host/src/modules/deck/deck.errors.ts`, removed `failures.ts` |
| 3 | Reorganized 12 root files into capability folders `brief/`, `generation/` and `images/`, split `deck-prompts.ts` into `brief-rules.ts`, `brief-tool-protocol.ts` and `brief-prompts.ts`, renamed `DeckToolSession` to `DeckRunTools`, and moved `prepareGeneration` out of `server.ts` | `apps/host/src/modules/deck/brief/*`, `generation/*`, `images/*`, removed 12 old root files |
| 4 | Replaced `DeckSessionStore` with `DeckChats`, `DeckAttachments` and `DeckRuns`. Implemented `DeckChats` on `ChatService` (with typed `ChatInfo`) and `DeckAttachments` on `AttachmentService` | `apps/host/src/modules/deck/ports.ts`, `apps/host/src/modules/chats/chats.service.ts`, `apps/host/src/modules/attachments/attachments.service.ts` |
| 5 | Converted `DeckService` to a class owning `BriefWorkflow`, `GenerationConfirmation` and `prepareRun`. Updated `createDeckRoutes` and narrowed `modules/deck/index.ts` | `apps/host/src/modules/deck/deck.service.ts`, `deck.routes.ts`, `index.ts` |
| 6 | Split `ToolSessionStore` into `ToolChats`, `ToolAttachmentRecords` and `ToolRuns`. Removed the `chatSessions` adapter and deck run planning from `server.ts` | `apps/host/src/tools/executors/ports.ts`, `source-tools.ts`, `tools/index.ts`, `apps/host/src/server.ts` |
| 7 | Enabled `role-file-symbol` for `deck`. Added `deck-errors.test.mjs`, updated `deck-run-plan.test.mjs` to test through `DeckService`, and updated `run-lifecycle.test.mjs` and `check-boundaries.test.mjs` | `scripts/check-boundaries.mjs`, `tests/check-boundaries.test.mjs`, `apps/host/tests/deck-errors.test.mjs`, `deck-run-plan.test.mjs`, `run-lifecycle.test.mjs`, `package.json` |
| 8 | Ran targeted tests, 3 mutation proofs, independent review and all 19 non-live `test:*` scripts plus web Vitest | No file change |
| 9 | Fixed all 3 independent review findings: added `DESIGN_SYSTEM_NOT_FOUND` (400) and `DECK_PLAN_CONFLICT` (500), restored full `try/catch` in `GenerationConfirmation.confirm` using `SelectionPassthrough`, and removed unconsumed type re-exports from `modules/deck/index.ts` | `apps/host/src/modules/deck/deck.errors.ts`, `generation/generation-preparation.ts`, `generation/generation-confirmation.ts`, `index.ts`, `apps/host/tests/deck-errors.test.mjs` |
| 10 | Recorded Revision 6 decisions, Task 17, report and updated workstream docs | `README.md`, `module-map.md`, `plan/README.md`, `plan/task-17-refactor-deck-and-check-phase-6.md`, `reports/README.md`, this report |

## Commands run

Commands ran in PowerShell from `C:\Users\Duy\Desktop\DeckAgent`. Build and E2E suites that write `lib/` or launch Chrome CDP ran outside the sandbox. Static checks and pure unit tests ran inside the sandbox.

| Command | Exit code | Key output or result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` (after review fixes) | 0 | All packages, `apps/host/lib`, and `apps/web/dist` built cleanly |
| `corepack pnpm@11.28.5 lint` (after review fixes) | 0 | `0 warnings and 0 errors` on 348 files |
| `corepack pnpm@11.28.5 check:boundaries` (after review fixes) | 0 | `0 violation(s)` with `chats`, `attachments`, `workspaces`, `providers`, `research`, `deck` |
| `corepack pnpm@11.28.5 exec biome format` on Phase 6 files | 0 | Zero format errors after formatting `brief/deck-run-plan.ts` and `deck-errors.test.mjs` |
| `corepack pnpm@11.28.5 check:docs` | 0 | `347 file(s) checked, 0 error(s)` |
| Mutation proofs (3 mutants, restored after failure) | Each mutant: 1 | Changing `OUTLINE_NOT_FOUND` `restore-outline-missing` to 409 failed `deck-errors.test.mjs`. Removing `deck` from `ROLE_FILE_MODULES` failed `check-boundaries.test.mjs`. Returning `[]` in `sourceKindsForBrief` failed `deck-run-plan.test.mjs` |
| Post-fix targeted tests (`deck-errors`, `deck-run-plan`, `brief-host`, `confirmation-host`, `check-boundaries`) | 0 | 45 passed, 0 failed |
| `tests/oxlint-boundaries.test.mjs` and `apps/host/tests/run-lifecycle.test.mjs` | 0 | All passed, 0 failed |
| `corepack pnpm@11.28.5 test:local-foundation` | 0 | 63 passed, 0 failed |
| `corepack pnpm@11.28.5 test:model-requests` | 0 | 57 passed, 0 failed |
| `corepack pnpm@11.28.5 test:source-permissions` | 0 | 11 passed, 0 failed |
| `corepack pnpm@11.28.5 test:attachments` | 0 | 32 passed, 0 failed |
| `corepack pnpm@11.28.5 test:research` | 0 | 8 passed, 0 failed |
| `corepack pnpm@11.28.5 test:images` (second run after Windows `EBUSY` cleanup flake) | 0 | 39 passed, 0 failed |
| `corepack pnpm@11.28.5 test:outline-workflow` | 0 | 6 passed, 0 failed |
| `corepack pnpm@11.28.5 test:brief-foundation` | 0 | 16 passed, 0 failed |
| `corepack pnpm@11.28.5 test:deck-review` | 0 | 26 passed, 0 failed |
| `corepack pnpm@11.28.5 test:generation-publication` | 0 | 72 passed, 0 failed |
| `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | 9 passed, 0 failed |
| `corepack pnpm@11.28.5 test:session-persistence` | 0 | 8 passed, 0 failed |
| `corepack pnpm@11.28.5 test:tools-browser` | 0 | 28 passed, 0 failed |
| `corepack pnpm@11.28.5 test:opencode-resources` | 0 | 3 passed, 0 failed |
| `corepack pnpm@11.28.5 test:http-edge` | 0 | 12 passed, 0 failed |
| `corepack pnpm@11.28.5 test:local-web` | 0 | 14 passed, 0 failed |
| `corepack pnpm@11.28.5 test:layouts` | 0 | 10 passed, 0 failed |
| `corepack pnpm@11.28.5 test:browser-smoke` | 0 | 22 passed, 0 failed |
| `corepack pnpm@11.28.5 test:env-startup` | 0 | 2 passed, 0 failed |
| `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native` | 0 | 6 files passed, 23 tests passed |

## Independent review

A fresh-context reviewer checked the scoped Phase 6 diff against `code.md`, `project-structure.md`, `testware.md` and `LESSONS.md`, and reported three findings:

| Severity | Finding | Resolution |
| --- | --- | --- |
| High | `DESIGN_SYSTEM_NOT_FOUND` (HTTP 400) and `DECK_PLAN_CONFLICT` (HTTP 500) were missing from `DeckWorkflowErrorCode` | Added both codes and statuses to `deck.errors.ts` and pinned them in `apps/host/tests/deck-errors.test.mjs` |
| Medium | Narrowing `try/catch` in `GenerationConfirmation.confirm` left `decks.generation`, `runs.activeFor` and `prepareGeneration` outside error translation | Restored full `try/catch` around `confirm()` and added module-private `SelectionPassthrough` so `ChatError` from `readSelection` still passes through without importing `modules/chats/` |
| Low | `modules/deck/index.ts` re-exported 4 unconsumed types (`DeckServiceDependencies`, `DeckWorkflowErrorCode`, `OutlineNotFoundReason`, `DeckRuns`). `tools/index.ts` re-exported `ToolChats`, `ToolAttachmentRecords` and `ToolRuns` | Removed the 4 unconsumed type re-exports from `modules/deck/index.ts`. Kept `tools/index.ts` port types for Phase 7 barrel audit because `SourceToolOptions` references them |

## STOP conditions and retries

| Event | Action and result |
| --- | --- |
| Sandbox blocked deleting old root files in `modules/deck/` and writing `apps/host/lib/` during `tsc -b` | Ran `Remove-Item` and `corepack pnpm@11.28.5 build` outside the sandbox. Both exited 0 |
| Sandbox blocked Chrome CDP launch and attachment temp writes in 6 E2E/HTTP test files | Re-ran those 6 files outside the sandbox with `--test-concurrency=1`. All 25 tests passed |
| First `test:images` run hit one Windows `EBUSY` cleanup hook error on `CrashpadMetrics-active.pma` in `e2e/portable-generation-http.test.mjs` | Re-ran `corepack pnpm@11.28.5 test:images`. All 39 tests passed with 0 failures |
| Two `image-research.test.mjs` tests timed out at 5000 ms under default multi-file concurrency | Ran `image-research.test.mjs` with `--test-concurrency=1` (matching `test:images`). All tests passed |

## What the commands do not prove

- Live provider suites (`test:research-live`, `test:opencode-live`) did not run.
- After applying the 3 review fixes, `build`, `lint`, `check:boundaries` and 45 directly affected tests passed again. The other 18 non-live scripts ran immediately before those fixes and did not run a second time because the fixes only touch `deck.errors.ts`, `generation-preparation.ts`, `generation-confirmation.ts` and `modules/deck/index.ts`.
- `createPreparedImageReader` and `createDeckStore` in `apps/host/src/server.ts` stay for Phase 7, because `createPreparedImageReader` depends on `SessionError` and attachment storage.
