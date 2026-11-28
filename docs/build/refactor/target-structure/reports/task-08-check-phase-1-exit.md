# Task 8: Check the Phase 1 exit condition report

Read this file to learn whether Phase 1 of the Target Structure Refactor meets its exit condition.

## Files changed

- `docs/build/refactor/target-structure/plan/task-08-check-phase-1-exit.md`: marked Steps 1 to 6 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 8 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index row.
- `docs/build/refactor/target-structure/reports/task-08-check-phase-1-exit.md`: added this report.

## Start state

Step 1 printed one line for each of the 7 Task 7 files. The user approved a commit of these files before the checks. The commit is `417690c`. After the commit, Step 1 printed no line.

## Exit table

| Condition | Command | Output | Result |
| --- | --- | --- | --- |
| Project Structure describes the target layout and the rules for old and new code during the move | `grep -c "^## Cấu trúc đích$\|^## Trong lúc chuyển$" docs/conventions/project-structure.md` | `2` | PASS |
| The Tech Stack section of AGENTS.md lists the chosen libraries | `grep -c "^## Tech Stack$" AGENTS.md && grep -c "Express 5" AGENTS.md && grep -c "React với Vite" AGENTS.md` | `1`, `1`, `1` | PASS |
| The run owner, the `AgentRuntime` port, the run preparation contribution and the change notice each have a written shape | `grep -c "^## ADR-00[1-4]: " docs/architecture/30-decisions.md && grep -c "^export interface \(RunOwner\|RunContribution\|AgentRuntime\|ChangeNotice\) {$" docs/architecture/10-agent-core.md` | `4`, `4` | PASS |
| The docs check finds no error | `corepack pnpm@11.28.5 check:docs` | `check-docs: 184 file(s) checked, 0 error(s) in 0 file(s)` | PASS |

Phase 1 exit: PASS

## What the commands do not prove

- The greps check headings and names only.
- A person decides whether the content is correct.
- The ADRs have status `Proposed` until a person accepts them.
