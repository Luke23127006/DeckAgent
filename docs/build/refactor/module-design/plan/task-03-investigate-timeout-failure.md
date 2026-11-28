# Task 3: Investigate portable-generation-http REQUEST_TIMEOUT baseline failure

Read this file to learn the steps of Task 3, which measures and diagnoses the pre-existing `#60 REQUEST_TIMEOUT` failure in `e2e/portable-generation-http.test.mjs`.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `e2e/portable-generation-http.test.mjs` (lines 1-232)
- `apps/web/tests/fixtures/b02-helpers.mjs` (lines 62-102)
- `apps/web/src/integrations/opencode/runtime.ts` (lines 249-294, 443-472)
- `apps/web/src/integrations/rendering/artifact-renderer.ts` (lines 101-272)
- `apps/web/tests/fixtures/fake-opencode.mjs` (lines 120-250)

**Files:**

- Change: this task file, for completion checkboxes only. This is a read-only diagnosis task.

**Interfaces:**

- Uses: `corepack pnpm@11.28.5 build`, `node --test --test-reporter=tap e2e/portable-generation-http.test.mjs`, `corepack pnpm@11.28.5 test:images`, and `corepack pnpm@11.28.5 test:generation-publication`.
- Produces: measured run timings, code-path audit, and a classified root cause in the conversation report for Revision 1b planning.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times with an environment error (such as `EPERM` or missing browser binary).

**Forbidden:**

- Change any file outside `Files` (do not edit `e2e/portable-generation-http.test.mjs`, `b02-helpers.mjs`, or `artifact-renderer.ts`).
- Delete, skip, or weaken any test or check.
- Run live network suites (`test:research-live`, `test:opencode-live`).
- Commit or push.

## Root-cause decision table

Apply this table to the measured timings and failure output from Steps 2 through 4:

| Signal | Action |
| --- | --- |
| Isolated run passes near or below 30000 ms, while suite run fails with `REQUEST_TIMEOUT` after earlier slides publish | Classify as fixture timeout budget exhaustion (`b02-helpers.mjs` sets `openCode.timeoutMs: 30000` for 7 cold browser renders). Record measured v2 and v3 durations and report both options: raise fixture `openCode.timeoutMs` in `e2e/portable-generation-http.test.mjs` or evaluate browser reuse in `artifact-renderer.ts`. |
| Both isolated and suite runs stall on the same slide or MCP step with no progress until timeout | Classify as a generation or renderer hang. Record the exact stalled step, template version, and emitted event list. |
| Failure output contains `ARTIFACT_RENDERER_BUSY`, `ARTIFACT_RENDERER_FAILED`, or leftover headless browser processes stay alive after `finally` | Classify as renderer concurrency or cleanup defect in `apps/web/src/integrations/rendering/artifact-renderer.ts`. |
| All three runs (isolated x2, `test:images`, `test:generation-publication`) exit with code 0 and print `# fail 0` | Classify as non-reproducible in current run. Record exact `duration_ms` margins relative to the 30000 ms budget in `b02-helpers.mjs`. |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 1: Check compiled build artifacts match source**

Run: `corepack pnpm@11.28.5 build`
Expected: PASS. The command exits with code 0.

- [x] **Step 2: Measure isolated runs of `e2e/portable-generation-http.test.mjs`**

Run the command two times in sequence:

1. `node --test --test-reporter=tap e2e/portable-generation-http.test.mjs`
2. `node --test --test-reporter=tap e2e/portable-generation-http.test.mjs`

Expected: Both commands finish within 180 seconds. Record exact exit code, pass/fail status, `duration_ms`, and any `errorCode` for both template versions (`v2` and `v3`) on each run. Do not stop early when a run exits non-zero. Record its exact failure output and continue to Step 3.

- [x] **Step 3: Measure `test:images` and `test:generation-publication` suite runs**

Run each command separately:

1. `corepack pnpm@11.28.5 test:images`
2. `corepack pnpm@11.28.5 test:generation-publication`

Expected: Both commands run to completion. Record exact exit code, `# tests`, `# pass`, `# fail`, `# skipped`, and the exact failing test number, name, `errorCode`, and `duration_ms` for every test in `portable-generation-http.test.mjs`. Stop immediately if any test outside `portable-generation-http.test.mjs` fails.

- [x] **Step 4: Audit timeout and renderer budgets in code**

Read the exact lines listed in `Read first` and record these four values in the report:
- Production default `timeoutMs` in `apps/web/src/integrations/opencode/runtime.ts` (line 252).
- Test fixture default `timeoutMs` in `apps/web/tests/fixtures/b02-helpers.mjs` (line 72), and whether `e2e/portable-generation-http.test.mjs` overrides `openCode.timeoutMs`.
- Per-slide renderer timeout and concurrency cap in `apps/web/src/integrations/rendering/artifact-renderer.ts` (lines 104-106).
- Browser spawn count per 7-slide deck in `artifact-renderer.ts` (line 122) and cleanup behavior in `finally` (lines 258-270).

- [x] **Step 5: Check that no repository files changed outside checkboxes**

Run: `git status --short`
Expected: PASS. No tracked production, test, or doc file shows new modifications from this task.

- [x] **Step 6: Report and stop**

Apply the [Root-cause decision table](#root-cause-decision-table) and send this report, then STOP (do not implement a fix until the owner approves Revision 1b):
- Files changed: `docs/build/refactor/module-design/plan/task-03-investigate-timeout-failure.md` (checkboxes only)
- Commands run, with exit codes and the last 20 lines of output of each command
- Timing table: `Run | Exit code | v2 status & duration_ms | v3 status & duration_ms | Failing errorCode`
- Timeout budget audit (four values from Step 4)
- Classified root cause from the decision table and any unmatched items
- What the commands do not prove: local timings on one Windows machine do not measure CI runner load margins or live OpenCode model latency
