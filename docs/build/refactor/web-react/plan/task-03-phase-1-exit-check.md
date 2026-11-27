# Task 3: Phase 1 exit check

Read this file to learn the steps of Task 3, which runs the Phase 1 exit checks and records Phase 1 as done.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `docs/build/refactor/web-react/README.md` (the table `Abstract phase plan`, row 1)
- `package.json` (the `scripts` that start with `test:`)

**Files:**
- Change: `docs/build/refactor/web-react/README.md` (the section `Phase 1: Decisions, conventions and checks`)

**Interfaces:** none

**STOP when:** A test suite fails in its run alone, and the cause is in a file that Phase 1 did not change. When the cause is in a file that Phase 1 changed, fix the defect, run the suite again, and record the fix in the report.

**Forbidden:** Do not run the scripts `test:research-live` and `test:opencode-live`, because they need live services.

- [x] **Step 1: Run the static checks**

Run: `corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 check:docs`
Expected: exit code 0.

- [x] **Step 2: Run the check tests**

Run: `node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs tests/check-docs.test.mjs`
Expected: PASS. The output contains `# fail 0`.

- [x] **Step 3: Run the non-live test suites**

Run each script of `package.json` whose name starts with `test:`, except `test:research-live` and `test:opencode-live`, with `corepack pnpm@11.28.5 <script>`. When a suite fails, run it again alone.
Expected: each suite has `# fail 0` in its first run or in its run alone.

Write the table `Suites` with the columns `Script | First run | Run alone`.

- [x] **Step 4: Record Phase 1 as done**

In `docs/build/refactor/web-react/README.md`, add this sentence at the end of the section `Phase 1: Decisions, conventions and checks`: `Phase 1 is done. Revision 1 of the plan has the tasks and the reports.` Link `Revision 1` to `plan/README.md`.

Run: `corepack pnpm@11.28.5 check:docs`
Expected: exit code 0.

- [x] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
