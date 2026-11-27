# Task 9: Phase 2 exit check

Read this file to learn the steps of Task 9, which runs the Phase 2 exit checks and marks Phase 2 done.

**Type:** Code

**Read first:**
- [Revision 2 Global Constraints](README.md#revision-2-global-constraints) and [Task protocol](README.md#task-protocol) in `README.md`
- `docs/build/refactor/web-react/README.md` (the table `Abstract phase plan`, row 2, and the section `Phase 2: React shell`)
- `docs/build/refactor/web-react/web-rules.md` (the table `Enforcement`)
- `docs/conventions/project-structure.md` (the table `Enforcement`)
- `package.json` (the `scripts` that start with `test:`)
- `docs/conventions/docs.md`

**Files:**
- Change: `docs/build/refactor/web-react/README.md`, `docs/build/refactor/web-react/web-rules.md`, `docs/conventions/project-structure.md`

**Interfaces:** none

**STOP when:** A test suite fails in its run alone, and the cause is in a file that Phase 2 did not change. When the cause is in a file that Phase 2 changed, fix the defect, run the suite again, and record the fix in the report.

**Forbidden:** Do not run `test:research-live` or `test:opencode-live`, because they need live services.

- [ ] **Step 1: Run the static checks**

Run: `corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 check:docs`
Expected: exit code 0.

- [ ] **Step 2: Run the check tests and Vitest suite**

Run: `node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs tests/check-docs.test.mjs tests/vite-build-mocks.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `corepack pnpm@11.28.5 test:web`
Expected: PASS. Exit code 0.

- [ ] **Step 3: Run all non-live test suites**

Run each script of `package.json` whose name starts with `test:`, except `test:research-live` and `test:opencode-live`, with `corepack pnpm@11.28.5 <script>`. When a suite fails, run it again alone.
Expected: each suite passes in its first run or in its run alone.

Write the table `Suites` with the columns `Script | First run | Run alone` in the report.

- [ ] **Step 4: Record Phase 2 as done and update Enforcement tables**

1. In `docs/build/refactor/web-react/README.md`:
   - In the table `Abstract phase plan`, change Phase 2 `Status` from `Pending` to `Done ([Revision 2](plan/README.md#revision-2-phase-2-react-shell))`.
   - In `Phase 2: React shell`, replace the `Open` and `Proposed` text with `Phase 2 is done. Legacy screens mount into a ref through LegacyBrowserMount until Phases 3 to 6 replace them. Revision 2 of the plan has the tasks and the reports.` Link `Revision 2` to `plan/README.md#revision-2-phase-2-react-shell`.
2. In `docs/build/refactor/web-react/web-rules.md`, change the `Status` column of `Production build has no chunk from mocks/ or MSW` from `` `Proposed`: Phase 2, with the Vite build `` to `Exists`.
3. In `docs/conventions/project-structure.md`, move the build check for `mocks/` or MSW from `Check mục tiêu` into `Chặn bởi` as `Vite build plugin (forbidMocksInBuild) kèm fixture âm trong tests/vite-build-mocks.test.mjs` and set `Check mục tiêu` to `—`.

Run: `corepack pnpm@11.28.5 check:docs`
Expected: exit code 0.

- [ ] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
