# Task 16 Report: Refactor attachments and check Phase 5

Read this file to review the completed attachment refactor and the failures that prevent Phase 5 closure.

**Status:** Blocked at the phase-exit check. Implementation and independent review are complete.

The user requested direct diagnosis and execution before task creation. The user then requested one Task 16 for all of Phase 5.
This report records the work already performed. It does not claim that a plan or failing test preceded the implementation.

## Work log and files changed

| Order | Work | Files |
| --- | --- | --- |
| 1 | Read the phase criteria, module map, conventions, lessons and diagnosis skill. Checked existing workspace changes | No file change |
| 2 | Renamed `AttachmentCoordinator` to `AttachmentService`. Removed `AttachmentOperations`. Routes now receive the class | `apps/host/src/modules/attachments/attachments.service.ts`, `attachments.routes.ts`, `index.ts` and `apps/host/src/http/multipart.ts` |
| 3 | Moved file storage to `AttachmentFileStore`. Moved SQLite metadata to `SqliteAttachmentStore` | `apps/host/src/modules/attachments/attachment-files.store.ts`, `attachments.store.ts`. Removed `attachment-log.store.ts` |
| 4 | Unified three error classes. Added the typed status table and its code lookup. Removed `knownAttachmentCodes` | `apps/host/src/modules/attachments/attachments.errors.ts`, `attachments.service.ts`, `attachment-files.store.ts`, `draft.store.ts` and `index.ts` |
| 5 | Split `AttachmentChats` from metadata access. Shared one `ChatService` instance between attachment use and routes | `apps/host/src/modules/chats/chats.service.ts`, `apps/host/src/server.ts` |
| 6 | Updated store imports and the draft error comment. Preserved existing HTTP expected values | `apps/host/tests/fixtures/b02-helpers.mjs`, `fixtures/session-store.mjs`, `draft-store.test.mjs` and `e2e/attachment-storage.test.mjs` |
| 7 | Added error contract and default role enforcement tests. Enabled the attachments role check | `apps/host/tests/attachment-errors.test.mjs`, `tests/check-boundaries.test.mjs`, `scripts/check-boundaries.mjs` |
| 8 | Ran related tests and two mutations. Restored the mutated files. Added the new error test to the attachment script | `package.json` (`test:attachments`) |
| 9 | Ran build, lint, boundary, documentation and full non-live checks. Requested independent review | No additional production change |
| 10 | Recorded diagnosis, status and evidence. Created Task 16 after execution | The workstream README, module map, plan index, report index, Task 16 and this report |

The refactor keeps `REQUEST_EMPTY` at HTTP 500, its previous fallback status. It keeps shared database `SessionError` unchanged.
The HTTP mapper hides internal error messages. It retains explicit safe detail fields.

## Commands run

Commands used PowerShell from the repository root. Node ran outside the sandbox after the sandbox denied access to the installed runtime.
The runtime was Node 22.23.5. Commands used `corepack pnpm@11.28.5` for package operations.

| Command | Exit code | Key output or result |
| --- | --- | --- |
| `node --version` after adding the installed Node directory to PATH | 0 | `v22.23.5` |
| `corepack pnpm@11.28.5 typecheck` | 1 | `TS2878`, plus an unused `drafts` parameter in `server.ts` |
| `corepack pnpm@11.28.5 build` after removing the unused parameter | 1 | `TS2878`: unsafe import rewrite between projects |
| `corepack pnpm@11.28.5 exec tsc -b --verbose` | 0 | Incremental projects reported up to date. This did not resolve the later forced-build failure |
| `corepack pnpm@11.28.5 exec tsc -b --force --verbose` | Not captured for the compiler | `TS2878` occurred while building `apps/web/tsconfig.json`. The logging shell returned 0 because its last operation read the log |
| `corepack pnpm@11.28.5 exec tsc -p apps/host/tsconfig.json` | 0 | Host compilation passed without rebuilding the web project |
| `corepack pnpm@11.28.5 exec node scripts/build-workspace.mjs` | 0 | Bundles completed from emitted output. This was not a successful full build |
| `corepack pnpm@11.28.5 lint` | 0 | No lint error |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` before Task 16 creation | 0 on the final completed run | `334 file(s) checked, 0 error(s)` |
| `corepack pnpm@11.28.5 check:docs` after Task 16 creation | 0 | `336 file(s) checked, 0 error(s)` |
| Related tests: command below | 0 | 54 tests passed, zero failures, zero skips |
| Mutations: temporary edits followed by `node --test` | Each mutant test: 1 | Removing default attachment enforcement failed its new test. Changing HTTP 400 to 401 failed the error contract test |
| Full non-live Node run: command below | 1 | 435 tests: 400 passed, 33 failed, two cancelled, zero skips |
| `corepack pnpm@11.28.5 test:web` | 1 | The nested script selected pnpm 12.21.0 and failed the required version check |
| `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native` | 1 | Four files: three passed, one failed. Six tests: five passed, one timed out at 5000 ms |
| `git diff --check` on Phase 5 files | 0 | No whitespace error |
| `python3.12.exe -I .agents/skills/asd-ste100/scripts/ste-lint.py` on Task 16, its report and Revision 5 prose | 0 | Zero violations |

Related tests:

```powershell
node --test apps/host/tests/attachment-errors.test.mjs apps/host/tests/draft-store.test.mjs tests/check-boundaries.test.mjs e2e/attachment-storage.test.mjs e2e/attachment-admission.test.mjs
```

The full run selected 72 non-live Node test files:

```powershell
$phase5Tests = @(rg --files apps packages tests e2e -g '*.test.mjs' | Where-Object { $_ -notmatch 'live\.test\.mjs$' })
node --test --test-concurrency=2 @phase5Tests
```

The command redirected output to `%TEMP%/deckagent-phase5-nonlive.log`. It finished after approximately 1123 seconds.
The log is local temporary evidence. The totals and failure classes below remain in this report.

## Exit failures, STOP conditions and retries

| Event | Action and result |
| --- | --- |
| The sandbox could not access Node or Corepack | Used the installed runtime outside the sandbox. The task installed no runtime |
| Host compilation found the unused `drafts` parameter after moving `ChatService` construction | Removed the parameter and its call argument. The later Host-only compilation passed |
| Incremental typecheck and forced build gave different results | Used the forced build as evidence. Recorded the web-project failure instead of claiming full build success |
| A docs check saw seven missing Phase 4 plan links during concurrent writes | Kept those files unchanged. A later docs check passed after the other work created the files |
| The web script selected the wrong nested pnpm version | Called Vitest directly through Corepack 11.28.5. It ran and reported the shell route timeout |
| `env-startup.test.mjs` stopped producing output for more than ten minutes | Verified the test process identity. Stopped that process tree with `taskkill /PID 8224 /T /F`. The runner continued |
| Other operations changed source and build outputs while the full suite ran | Recorded the affected imports and the failed suite. Did not repair concurrent web, provider or workspace work |
| The phase-exit checks did not pass | Kept Phase 5 and Task 16 open. No accepted exception and no Done marker |

| Failure class | Observed evidence |
| --- | --- |
| Browser flows | Missing chat, composer, welcome or list elements in `e2e/browser-smoke.test.mjs` during the web-react transition |
| Resource locks | `EBUSY` while removing a renderer lockfile or a workspace SQLite file |
| Runtime resources | The OpenCode resource preparation test exceeded its 60000 ms timeout |
| Renderer behavior | The renderer profile reuse assertion failed |
| Startup hang | The env-startup process did not finish. The final suite reported two cancelled tests |
| Changing web output | Import failure for `@deckagent/local-web/index.js` after the package changed during the suite |
| Changing provider output | Contract validation imported `providerProtocols` before the bundle supplied that export |
| Web Vitest | `apps/web/tests/app-shell-routes.test.tsx` exceeded the 5000 ms test timeout |

## Independent review

A reviewer with a fresh context checked the scoped diff, conventions, lessons and mutation evidence. The reviewer found no new production regression.
The reviewer checked that the port split preserves chat existence checks and attachment metadata ownership.
The reviewer also noted a pre-existing test limitation: some attachment tests call same-process close and reopen a restart.
This refactor changed their symbol names only. It did not repair that older simulation or claim fresh-process restart coverage.

## What the commands do not prove

- The full build and full non-live suites did not pass. Task 16 and Phase 5 are not Done.
- Source files and generated outputs changed during the full run. The run does not prove the final workspace state.
- The passing related tests prove the exercised attachment paths. They do not prove every browser flow or unrelated module.
- Mutation failures prove that the two new tests detect their selected faults. They do not prove exhaustive fault detection.
- Same-process reopen tests do not prove process restart behavior.
- No live provider suite ran. This report records implementation and exit checks before publication.

## Remaining work

After concurrent source and build changes stabilize, run Step 6 of Task 16 again.
Repair failures owned by Phase 5. Record failures outside Phase 5 without changing their owners.
Mark Task 16 and Phase 5 Done only after every required exit check passes or the user explicitly accepts an exception.
