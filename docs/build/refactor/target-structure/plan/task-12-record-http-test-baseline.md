# Task 12: Record the test baseline before Phase 2

Read this file to learn the steps of Task 12, which records the result of the checks and the non-live test suites before Phase 2.

The Phase 2 exit condition says that the HTTP black-box tests pass without changes to their expected values. A later task can prove this only when it knows the result before the change. This task records that result. It does not fix a failed test.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `package.json` (section `scripts`)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-12-record-http-test-baseline.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-12-record-http-test-baseline.md`

**Interfaces:**

- Uses: the scripts in `package.json` that the [Suite list](#suite-list) names.
- Produces: a report table with the columns `Suite | Command | Exit code | Pass | Fail | Duration | Result`, with one row for each command in the [Suite list](#suite-list).

**STOP when:**

- The output of a command does not match `Expected`. A failed suite is not a STOP condition. Use the [Failure decision table](#failure-decision-table).
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- `git status --short` shows a change outside the four files in `Files` after Step 4.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Fix a failed test or a failed check. Change a timeout or a wait in a test.
- Run a script with `live` in its name. These scripts need credentials and a network.

## Suite list

Run the commands in this order. Each command runs from the repository root.

| Suite | Command |
| --- | --- |
| build | `corepack pnpm@11.28.5 build` |
| lint | `corepack pnpm@11.28.5 lint` |
| check:boundaries | `corepack pnpm@11.28.5 check:boundaries` |
| boundary fixtures | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` |
| test:research | `corepack pnpm@11.28.5 test:research` |
| test:images | `corepack pnpm@11.28.5 test:images` |
| test:outline-workflow | `corepack pnpm@11.28.5 test:outline-workflow` |
| test:brief-foundation | `corepack pnpm@11.28.5 test:brief-foundation` |
| test:deck-review | `corepack pnpm@11.28.5 test:deck-review` |
| test:generation-publication | `corepack pnpm@11.28.5 test:generation-publication` |
| test:slide-pipeline | `corepack pnpm@11.28.5 test:slide-pipeline` |
| test:session-persistence | `corepack pnpm@11.28.5 test:session-persistence` |
| test:opencode-resources | `corepack pnpm@11.28.5 test:opencode-resources` |
| test:layouts | `corepack pnpm@11.28.5 test:layouts` |
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` |

## Failure decision table

| Signal | Action |
| --- | --- |
| The exit code is 0, and the output contains `# fail 0` or no `# fail` line | Write `PASS` in `Result`. |
| The exit code is not 0 the first time | Run the same command one more time. Write both results in the row, for example `FAIL, then PASS`. |
| The command fails two times | Write `FAIL` in `Result`. Copy the names of the failed tests and the first error line of each into the report. Do the next command. |
| The command does not stop after 600 seconds | Stop the command. Write `TIMEOUT` in `Result`. Do the next command. |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `git status --short && git log -1 --format=%h`

Expected: PASS. The output has no line before the commit hash. FAIL: the output lists a file. A person must commit the reports of Tasks 9 to 11 before this task starts. Write the commit hash in the report.

- [ ] **Step 2: Check the Node version**

Run: `node --version`

Expected: PASS. The output starts with `v22.` or with a major version of 24 or higher. Write the version in the report.

- [ ] **Step 3: Run each suite**

Run each command in the [Suite list](#suite-list) in order. For each command, write one row in the report table. Take `Pass` and `Fail` from the `# pass` and `# fail` lines. Write `-` when the output has no such line. Use the [Failure decision table](#failure-decision-table) for `Result`.

Expected: PASS. Each command has a row in the table.

- [ ] **Step 4: Check that no tracked file changed**

Run: `git status --short`

Expected: PASS. The output has one line, for `docs/build/refactor/target-structure/plan/task-12-record-http-test-baseline.md`. FAIL: another file changed. Write each changed file in the report.

- [ ] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file. Change the Task 12 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-12-record-http-test-baseline.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-12-record-http-test-baseline.md` with:
   - H1 `# Task 12: Record the test baseline before Phase 2 report` and the purpose line `Read this file to learn which checks and non-live test suites pass before Phase 2 changes code.`
   - Files changed: the list of files.
   - The commit hash and the Node version.
   - The suite table from Step 3.
   - The failed tests and their first error lines.
   - What the commands do not prove: one run does not prove that a suite is stable. A suite that passed one time can fail under load.
3. Add a row for Task 12 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-12-record-http-test-baseline.md`. Expected: the output contains `0 violations`.
5. Mark Step 5 as `- [x]`.

**STOP** and send the report summary. Phase 2 implementation tasks start after a person approves the reports of Tasks 9 to 12.
