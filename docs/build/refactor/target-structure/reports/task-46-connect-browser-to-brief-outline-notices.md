# Task 46: Connect the Browser to brief and outline change notices report

Read this file to learn the changes, test evidence and results for Task 46.

## Files changed

- `apps/web/src/browser/boot.ts`: the `onNotice` callback of `openSessionChanges` now handles `brief` and `outline` notices for the open chat.
- `apps/web/src/browser/features/deck/deck-workflow-view.ts`: the new `briefVersion` getter reports the loaded Brief version. A newer Brief sets the view to `deck` mode.
- `e2e/browser-smoke.test.mjs`: one new test writes a Brief two times over HTTP and reads the Browser view.
- `docs/build/refactor/target-structure/plan/README.md`: the row of Task 46 is `Done`.
- `docs/build/refactor/target-structure/plan/task-46-connect-browser-to-brief-outline-notices.md`: every step is `- [x]`.
- `docs/build/refactor/target-structure/reports/README.md`: one new row links this report.
- `CHANGELOG.md`: one new line under `### Added`.

## Commands run

Commands ran in PowerShell from the repository root.
The package command prefix is `corepack pnpm@11.28.5`.
The Node.js version was v22.23.5.
The Step 1 check was:

```powershell
git grep -n "^| 45 | Done" -- docs/build/refactor/target-structure/plan/README.md
```

The check printed one line for the Task 45 row.

| Step | Command | Exit code | Result |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 2 | `build` | 0 | Build passes. |
| 2 | `node --test --test-name-pattern="brief and outline notices" e2e/browser-smoke.test.mjs` | 1 | Pass 0, fail 1. Message: `Browser did not refresh Brief from brief notice`. |
| 3 | `build` | 0 | Build passes. |
| 3 | `node --test --test-name-pattern="brief and outline notices" e2e/browser-smoke.test.mjs` | 0 | Pass 1, fail 0. Duration 9128 ms. |
| 4 | `build` without the `brief` branch | 0 | Build passes. |
| 4 | `node --test --test-name-pattern="brief and outline notices" e2e/browser-smoke.test.mjs` | 1 | Pass 0, fail 1. The missing `brief` branch fails the test. |
| 4 | `exec tsc -b --force` after the restore | 0 | No TypeScript error. |
| 4 | `build` after the restore | 0 | Build passes. |
| 5 | `exec biome format --write` on the three changed code and test files | 0 | `No fixes applied`. |
| 5 | `exec biome format` on the same files | 0 | `No fixes applied`. |
| 5 | `build` | 0 | Build passes. |
| 5 | `lint` | 0 | No lint finding. |
| 5 | `check:boundaries` | 0 | `0 violation(s)`. |
| 5 | `check:docs` | 0 | `261 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | `check:docs` with this report and no index row | 1 | `unlisted-file` for this report. |
| 7 | `check:docs` with the index row | 1 | `h1-first-line` for `reports/README.md`. The write added a byte-order mark. |
| 7 | `check:docs` after the byte-order mark removal | 0 | `262 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py` on this report | 0 | `0 violations`. |

## Regression suites

Each suite ran one time in the order of the task protocol.
Two suites failed one shared real-renderer test.
The same two suites passed when they ran alone.
The table gives the count of each suite in its final run.

| Suite | Pass | Fail |
| --- | --- | --- |
| `test:http-edge` | 12 | 0 |
| `test:tools-browser` | 24 | 0 |
| `test:local-web` | 11 | 0 |
| `test:local-foundation` | 57 | 0 |
| `test:model-requests` | 29 | 0 |
| `test:source-permissions` | 11 | 0 |
| `test:attachments` | 31 | 0 |
| `test:research` | 5 | 0 |
| `test:images` | 39 | 0 |
| `test:outline-workflow` | 6 | 0 |
| `test:brief-foundation` | 16 | 0 |
| `test:deck-review` | 21 | 0 |
| `test:generation-publication` | 72 | 0 |
| `test:slide-pipeline` | 9 | 0 |
| `test:session-persistence` | 7 | 0 |
| `test:opencode-resources` | 3 | 0 |
| `test:layouts` | 10 | 0 |
| `test:browser-smoke` | 22 | 0 |
| `test:env-startup` | 2 | 0 |

## STOP conditions and retries

No STOP condition occurred.
Two retries occurred in Step 6 and two retries occurred in Step 7.

- Step 6, `test:images`: the test `Create deck prepares images, then MCP templates v2 publish all seven layouts through the real local renderer` failed with `ARTIFACT_RENDERER_FAILED`. The result was pass 38 and fail 1. The same suite passed alone with pass 39 and fail 0.
- Step 6, `test:generation-publication`: the same test failed in its cleanup hook with `EBUSY` on `CrashpadMetrics-active.pma`. The result was pass 71 and fail 1. The same suite passed alone with pass 72 and fail 0.
- Step 7, `check:docs`: the first run reported `unlisted-file` because the index had no row for this report. The next run passed after I added the row.
- Step 7, `check:docs`: the second run reported `h1-first-line` for `reports/README.md` because a PowerShell write added a byte-order mark. The next run passed after I removed the byte-order mark.

Both failures are renderer resource contention. Task 45 recorded the same failures for the same test.

## Limits

The new test writes a Brief over HTTP and uses one Browser tab.
It does not test two Browser tabs.
It does not test a live remote Outline write in Chromium.
Task 45 covers the Outline store and the SSE path at the store level.
The `outline` branch in `openSessionChanges` has no Browser test in this task.
