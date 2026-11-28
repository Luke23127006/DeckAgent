# Task 41: Add Zod decoders and PREFERENCES_STALE checks report

Read this file to learn the changes and check results for Task 41.

## Files changed

- `packages/host/contracts/src/preferences-validation.ts` and `index.ts`: add strict Zod decoders and their public exports.
- `apps/host/src/web-state.ts`: check the expected preferences version inside the theme transaction.
- `apps/host/src/settings-routes.ts`: decode preferences bodies and pass theme and expected version to WebState.
- `apps/host/src/local-transport.ts`: map stale preferences to HTTP 409.
- `apps/host/src/server.ts`: connect the updated preferences save signature.
- `apps/host/src/modules/research/`: check stale writes before Tavily and inside the SQL transaction.
- `apps/web/src/browser/transport/management-client.ts`: send expected versions and decode preferences replies.
- `apps/web/src/browser/theme.ts` and `boot.ts`: track the preferences version after a successful theme write.
- `apps/web/src/browser/features/research/research-view.ts`: snapshot the preferences version and read the ManagementError message code.
- `packages/host/contracts/tests/validation.test.mjs`: test valid and malformed bodies.
- `apps/host/tests/research.test.mjs` and `web-management.test.mjs`: send expected versions on valid writes.
- `e2e/local-foundation.test.mjs`: test stale writes and send expected versions on existing valid writes.
- `e2e/research-live.test.mjs`: send the current expected version.
- The task file, plan index, report index, and changelog: record task completion.

## Commands run

Commands ran from the repository root in PowerShell.
Every package command uses `corepack pnpm@11.28.5`.
The evidence folder is `C:/Users/Duy/AppData/Local/Temp/deckagent-task41-405c200c608b440d85b43738868b3ae2`.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` before changes | 0 | Approved Task 39 and Task 40 changes |
| `git grep` for the Task 40 Done row | 0 | One row |
| `build` before implementation | 0 | Build complete |
| Planned red tests before implementation | 1 | Pass 16, fail 2, cancelled 0 |
| `build` after implementation | 0 | Build complete |
| Planned green tests after implementation | 0 | Pass 38, fail 0, cancelled 0 |
| `build` with the moved stale check | 0 | Build complete |
| `node --test e2e/local-foundation.test.mjs` with the mutant | 1 | Pass 16, fail 1, cancelled 0 |
| `exec tsc -b --force` after source restoration | 0 | No error |
| `exec biome format --write` on 15 included code and test files | 0 | Formatted 15 files |
| `exec biome format` on the same files | 0 | No fixes applied |
| Biome stdin format on both E2E files | 0 | Second pass produced identical text |
| Final `build` | 0 | Build complete |
| `lint` | 0 | No error |
| `check:boundaries` | 0 | 0 violation(s) |
| `check:docs` before report creation | 0 | 251 files, 0 error(s) |
| Format and build after the boot fix | 0 | Build complete |
| `lint` and `check:boundaries` after the boot fix | 0 | No error and 0 violation(s) |
| Final `check:docs` | 0 | 252 files, 0 error(s) |
| Report and review prompt STE lint | 0 | 0 violations |
| `git diff --check HEAD` | 0 | No whitespace error |

The red and green commands were:

```text
node --test packages/host/contracts/tests/validation.test.mjs e2e/local-foundation.test.mjs
node --test packages/host/contracts/tests/validation.test.mjs apps/host/tests/research.test.mjs apps/host/tests/web-management.test.mjs e2e/local-foundation.test.mjs
```

Biome excludes the E2E folder in the existing configuration.
Both E2E files used stdin with `--stdin-file-path=apps/host/tests/format-input.mjs`.

## Suites

All 19 required suites passed. The browser suite passed after the approved boot fix.

| Command | Exit code | Pass | Fail |
| --- | --- | --- | --- |
| `corepack pnpm@11.28.5 test:http-edge` | 0 | 12 | 0 |
| `corepack pnpm@11.28.5 test:tools-browser` | 0 | 23 | 0 |
| `corepack pnpm@11.28.5 test:local-web` | 0 | 11 | 0 |
| `corepack pnpm@11.28.5 test:local-foundation` | 0 | 57 | 0 |
| `corepack pnpm@11.28.5 test:model-requests` | 0 | 29 | 0 |
| `corepack pnpm@11.28.5 test:source-permissions` | 0 | 11 | 0 |
| `corepack pnpm@11.28.5 test:attachments` | 0 | 31 | 0 |
| `corepack pnpm@11.28.5 test:research` | 0 | 5 | 0 |
| `corepack pnpm@11.28.5 test:images` | 0 | 39 | 0 |
| `corepack pnpm@11.28.5 test:outline-workflow` | 0 | 6 | 0 |
| `corepack pnpm@11.28.5 test:brief-foundation` | 0 | 15 | 0 |
| `corepack pnpm@11.28.5 test:deck-review` | 0 | 21 | 0 |
| `corepack pnpm@11.28.5 test:generation-publication` | 0 | 72 | 0 |
| `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | 7 | 0 |
| `corepack pnpm@11.28.5 test:session-persistence` | 0 | 7 | 0 |
| `corepack pnpm@11.28.5 test:opencode-resources` | 0 | 3 | 0 |
| `corepack pnpm@11.28.5 test:layouts` | 0 | 10 | 0 |
| `corepack pnpm@11.28.5 test:browser-smoke` | 1 | 0 | 19 |
| `corepack pnpm@11.28.5 test:browser-smoke` (retry) | 0 | 19 | 0 |
| `corepack pnpm@11.28.5 test:env-startup` | 0 | 2 | 0 |


## Retries and deviations

- The approved baseline contains Task 39 and Task 40 changes. The user excluded commit and push from this execution.
- The final workspace therefore contains changes for review. Neither commit nor push ran.
- The decoder red test failed at module load because its exports did not exist yet.
- The stale-write red test failed because a stale theme write returned HTTP 200.
- The required mutant moved the initial research stale check after the Tavily check.
- The test detected one Tavily call where it expected zero.
- The executor restored the exact green source and forced TypeScript compilation.
- The first browser suite reported pass 0 and fail 19 because the Browser did not finish startup.
- Dialog construction called the preferences getter before navigation initialization.
- The orchestrator approved a bounded fix and one full browser-suite rerun.
- Dialog state now starts at zero. It snapshots the current version on open and after a successful refresh.
- The executor waited for the initial run to finish before rebuilding, so that run used one bundle version.
- The rebuilt browser suite verifies the fixed startup path.
- No other test retry occurred.
- No unresolved STOP condition remains.
- No item in the test-write rules required a new design decision.
- The live Tavily suite was not run. The task requires its caller update, but does not require the live suite.

## Review

An independent agent found no production defect.
The reviewer checked early stale refusal, both transaction checks, and credential cleanup.
One low finding requested a test header comment for the fetch stub fault evidence.
The task plan forbids comments. The orchestrator kept that constraint and required exact evidence in this report instead.
The reviewer found no substantive simulation fault.
The stub uses the external fetch boundary, and the mutant proves that the test detects the premature Tavily call.

The mutation test name is:

```text
research and preferences writes reject a stale expectedVersion with PREFERENCES_STALE before calling Tavily
```

The mutant moved the initial version check after `this.client.check`.
The assertion `A stale research save must not call Tavily` expected zero and observed one.
Its log is `C:/Users/Duy/AppData/Local/Temp/deckagent-task41-405c200c608b440d85b43738868b3ae2/mutation-tests.log`.
The executor restored the source before the final build. A forced TypeScript compile prevented old mutation output.
The review prompt passed STE lint with zero violations.

## What the commands do not prove

The Browser does not react to preferences notices or show a stale message on PREFERENCES_STALE yet.
Task 42 adds that behavior.
The stale-write test checks refusal before Tavily. It does not create a concurrent change during the Tavily request.
Source review checks the second version comparison inside the SQL transaction and credential cleanup after a stale result.
