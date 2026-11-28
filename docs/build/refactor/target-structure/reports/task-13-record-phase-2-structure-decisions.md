# Task 13: Record the Phase 2 structure decisions report

Read this file to learn which Phase 2 decisions Project Structure now states.

## Files changed

- `docs/conventions/project-structure.md`: replaced the `Open` error map paragraph with the decided rule, changed the mapping row of `apps/web/src/local-transport.ts`, and added the Phase 2 exception to rule 3 of `## Trong lúc chuyển`.
- `docs/build/refactor/target-structure/plan/task-13-record-phase-2-structure-decisions.md`: marked Steps 1 to 7 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 13 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index row.
- `docs/build/refactor/target-structure/reports/task-13-record-phase-2-structure-decisions.md`: added this report.

## Commands run

The text commands ran in WSL bash, because Git Bash is not installed on this machine. The `pnpm` commands ran in PowerShell 5.1, because WSL cannot execute the Windows `corepack` shim. Every command ran from the repository root.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `wc -l docs/conventions/project-structure.md` and `grep -n` on the three start lines | 0 | `237 docs/conventions/project-structure.md`, then `171:`, `182:` and `200:` |
| 2, 3, 4 | Three edits, each replaced one complete line | 0 | No output |
| 5 | `wc -l` and `grep -c` on the changed text | 0 | `237 docs/conventions/project-structure.md` and `2` |
| 5 | `git diff --stat` | 0 | `docs/conventions/project-structure.md | 6 ++--`, `3 files changed, 28 insertions(+), 14 deletions(-)` |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 197 file(s) checked, 0 error(s) in 0 file(s)` |
| 7 | `corepack pnpm@11.28.5 check:docs` after the report and the index row | 0 | `check-docs: 198 file(s) checked, 0 error(s) in 0 file(s)` |

The `git diff --stat` output also names `docs/build/README.md` and `docs/build/refactor/target-structure/plan/README.md`. These two files had changes from the planner before Task 13 started, and Task 13 did not touch them. Task 13 replaces 3 lines in `docs/conventions/project-structure.md` with 3 new lines.

## Fixes

None. No link or anchor needed a fix.

## Ste-lint

`python` is not available on this machine. The lint ran with `python3` from WSL.

```text
python3 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-13-record-phase-2-structure-decisions.md
0 violations (0 hard, baseline 0), 278 words, 0.0 per 100 words
```

## What the commands do not prove

`check:docs` checks links and structure only. No check enforces the error map rule yet. The mapping table still names `apps/web/src/` paths until the move task changes them.
