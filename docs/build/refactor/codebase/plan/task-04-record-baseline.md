# Task 4: Record baseline of boundaries and test suites

Read this file to learn the steps of Task 4, which records the current build, lint, boundary and test baseline.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `.github/workflows/workspace.yml`

**Files:**
- Change: this task file, for its completion checkboxes only. This is a read-only measurement task.

**Interfaces:**
- Uses: `corepack pnpm@11.28.5 check:boundaries:report` from `scripts/check-boundaries.mjs`.
- Produces: baseline report recorded in `README.md`.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**
- Change any file outside `Files`.
- Delete, skip or weaken a test or a check.
- Run live network test suites (`test:research-live`, `test:opencode-live`).
- Commit or push.

- [x] **Step 1: Run build, lint and documentation checks**

Run: `corepack pnpm@11.28.5 build`
Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 lint`
Expected: PASS. The output contains `Found 0 warnings and 0 errors.`.

Run: `corepack pnpm@11.28.5 check:docs`
Expected: PASS. The output contains `0 error(s) in 0 file(s)`.

- [x] **Step 2: Record the current boundary violation counts**

Run: `corepack pnpm@11.28.5 check:boundaries:report`
Expected: PASS. The command exits with code 0. Record the rule counts and the total violation count in the report.

- [x] **Step 3: Run all non-live test suites from CI plus the new check tests**

Run each command in order and record PASS or FAIL with the pass/fail counts:

1. `node --test --test-reporter=tap tests/check-docs.test.mjs tests/post-edit-hook.test.mjs tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`
2. `corepack pnpm@11.28.5 test:session-persistence`
3. `corepack pnpm@11.28.5 test:tools-browser`
4. `corepack pnpm@11.28.5 test:env-startup`
5. `corepack pnpm@11.28.5 test:local-web`
6. `corepack pnpm@11.28.5 test:local-foundation`
7. `corepack pnpm@11.28.5 test:model-requests`
8. `corepack pnpm@11.28.5 test:opencode-resources`
9. `corepack pnpm@11.28.5 test:source-permissions`
10. `corepack pnpm@11.28.5 test:attachments`
11. `corepack pnpm@11.28.5 test:research`
12. `corepack pnpm@11.28.5 test:slide-pipeline`
13. `corepack pnpm@11.28.5 test:outline-workflow`
14. `corepack pnpm@11.28.5 test:brief-foundation`
15. `corepack pnpm@11.28.5 test:deck-review`
16. `corepack pnpm@11.28.5 test:generation-publication`
17. `corepack pnpm@11.28.5 test:browser-smoke`

Expected: Each command runs to completion. If a test suite fails on the unmodified baseline, do not stop early. Record its exact exit code and failure output in the report, then continue to the next suite.

- [x] **Step 4: Check that Task 4 adds no code changes**

Run: `git status --short`
Expected: PASS. Task 4 modifies no source or config file beyond the earlier Wave 0 tasks (only checkboxes in `docs/build/refactor/codebase/plan/task-04-record-baseline.md`).

- [x] **Step 5: Report and stop**

Send this report and STOP (do not start Revision 2):
- Files changed: `docs/build/refactor/codebase/plan/task-04-record-baseline.md` (checkboxes only)
- Boundary report summary: exact per-rule violation counts from Step 2
- Test suite table: `Command | Exit code | Last 5 lines` for all 17 commands in Step 3
- Items that a decision table sent to the report: `None`
- What the commands do not prove
