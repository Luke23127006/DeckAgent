# Task 7: Write the agent core contracts report

Read this file to learn the result of Task 7, which wrote the four agent core ADRs and the agent core architecture file.

## Files changed

- `docs/architecture/30-decisions.md`: created. The file holds ADR-001 to ADR-004 with status `Proposed`.
- `docs/architecture/10-agent-core.md`: created. The file holds the contract shapes, the run flow, the map from code to category and the aggregate table.
- `docs/architecture/README.md`: replaced the whole file with the file table and the driver matrix.
- `docs/build/refactor/target-structure/plan/task-07-write-agent-core-contracts.md`: marked Steps 1 to 7 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 7 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index.
- `docs/build/refactor/target-structure/reports/task-07-write-agent-core-contracts.md`: added this report.

## Commands run

The shell on this machine is PowerShell. `wc` and `grep` are not available. The line count used `(Get-Content <file>).Count`. The count checks used `rg -c`. The `rg -c` command gives no output when the count is `0`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `Get-ChildItem docs/architecture -Name` and a line count of `README.md` | 0 | `README.md` and `3` |
| 2, 3, 4 | Node script that copies each fenced block of the task file to the target file, then a line count of each target file | 0 | Block sizes 202, 391 and 23 lines. First lines `# Quyết định kiến trúc`, `# Agent core` and `# Architecture`. Target file sizes 201, 390 and 22 lines |
| 5 | Six `rg -c` checks on the three target files | 0 | `4`, `4`, `4`, no output for `sessionId:` (count `0`), `1` and `2` |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 183 file(s) checked, 0 error(s) in 0 file(s)` |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 184 file(s) checked, 0 error(s) in 0 file(s)` |

The difference of one line between a block and its target file is the last empty element of the split. The file has no trailing blank line.

## Fixes

No fixes.

## Ste-lint

`python` is not available on this machine. The lint ran with the `python.exe` file that LibreOffice ships (Python 3.12.14).

Command and output:

```text
"C:\Program Files\LibreOffice\program\python.exe" -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-07-write-agent-core-contracts.md
0 violations (0 hard, baseline 0), 323 words, 0.0 per 100 words
```

## What the commands do not prove

`check:docs` checks links and structure only. The greps check names only. They do not prove agreement with the code. They do not prove agreement with the reports. No code uses the contracts yet.
