# Task 8: Check the Phase 1 exit condition

Read this file to learn the steps of Task 8, which checks the exit condition of Phase 1 and reports the result.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `docs/build/refactor/target-structure/README.md` (section `## Abstract phase plan`, row of Phase 1)
- `docs/conventions/project-structure.md` (headings only)
- `AGENTS.md` (section `## Tech Stack`)
- `docs/architecture/30-decisions.md` (headings only)
- `docs/architecture/10-agent-core.md` (section `## Contract`)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-08-check-phase-1-exit.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-08-check-phase-1-exit.md`

**Interfaces:**

- Uses: the files that Tasks 1, 2 and 7 wrote: `docs/conventions/project-structure.md`, `AGENTS.md`, `docs/architecture/30-decisions.md` and `docs/architecture/10-agent-core.md`.
- Produces: the exit table in `docs/build/refactor/target-structure/reports/task-08-check-phase-1-exit.md`, with the columns `Condition | Command | Output | Result`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Change `docs/conventions/project-structure.md`, `AGENTS.md` or a file in `docs/architecture/` to make a check pass. When a check fails, write `FAIL` in the exit table and stop.
- Write tasks for Phase 2.

## Exit decision table

| Signal | Action |
| --- | --- |
| The command output equals `Expected` | Write `PASS` in the `Result` column |
| The command output is different from `Expected` | Write `FAIL` in the `Result` column. Do the next step. Stop after Step 5 |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. The output is empty. FAIL: the output lists a file. A person must commit Task 7 before this task starts.

- [ ] **Step 2: Check Project Structure**

Condition: Project Structure describes the target layout and the rules for old and new code during the move.

Run: `grep -c "^## Cấu trúc đích$\|^## Trong lúc chuyển$" docs/conventions/project-structure.md`

Expected: PASS. The output is `2`.

- [ ] **Step 3: Check the Tech Stack section**

Condition: the Tech Stack section of AGENTS.md lists the chosen libraries.

Run: `grep -c "^## Tech Stack$" AGENTS.md && grep -c "Express 5" AGENTS.md && grep -c "React với Vite" AGENTS.md`

Expected: PASS. The output is three lines: `1`, `1` and `1`.

- [ ] **Step 4: Check the four contract shapes**

Condition: the run owner, the `AgentRuntime` port, the run preparation contribution and the change notice each have a written shape.

Run: `grep -c "^## ADR-00[1-4]: " docs/architecture/30-decisions.md && grep -c "^export interface \(RunOwner\|RunContribution\|AgentRuntime\|ChangeNotice\) {$" docs/architecture/10-agent-core.md`

Expected: PASS. The output is two lines: `4` and `4`.

- [ ] **Step 5: Run the docs check**

Run: `corepack pnpm@11.28.5 check:docs`

Expected: PASS. The output contains `0 error(s)`. FAIL: the output contains `error(s)` with a number above 0.

- [ ] **Step 6: Write the report file and stop**

1. Mark Steps 1 to 5 as `- [x]` in this file. Change the Task 8 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-08-check-phase-1-exit.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-08-check-phase-1-exit.md` with:
   - H1 `# Task 8: Check the Phase 1 exit condition report` and the purpose line `Read this file to learn whether Phase 1 of the Target Structure Refactor meets its exit condition.`
   - Files changed: the list of files.
   - The exit table: one row for each of Steps 2 to 5, with the columns `Condition | Command | Output | Result`.
   - One line: `Phase 1 exit: PASS` when all four rows are `PASS`, or `Phase 1 exit: FAIL` and the IDs of the failed steps.
   - What the commands do not prove: the greps check headings and names only. A person decides whether the content is correct. The ADRs have status `Proposed` until a person accepts them.
3. Add a row for Task 8 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-08-check-phase-1-exit.md`. Expected: the output contains `0 violations`.
5. Mark Step 6 as `- [x]`.

**STOP** and send the report summary. Phase 2 starts after a person approves this report.
