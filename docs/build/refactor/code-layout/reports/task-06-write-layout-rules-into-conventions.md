# Task 6: Write the layout rules into the conventions report

Read this file to review the files, the commands and the checks of Task 6 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

- Changed `docs/conventions/code.md`: the first paragraph names `bố cục` in the list of topics.
- Changed `docs/conventions/code.md`: added the section `Bố cục` between `TypeScript` and `Comments`. Five rules name the tool that blocks each one: the three `format-layout` rules of `format` and the post-edit hook, the `--dense` command for the review of dense bodies, and `review` for the hook order of a React component.
- Marked the 4 steps as complete in [Task 6](../plan/task-06-write-layout-rules-into-conventions.md).
- Changed the row of Task 6 to `Done` in the [plan README](../plan/README.md).
- Added the row of Task 6 to [Code Layout Reports](README.md).
- Created this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 3 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 370 file(s) checked, 0 error(s) in 0 file(s)` |
| 3 | `git grep -n "format-layout" -- docs/conventions/code.md` | `0` | 4 lines, at lines 64 to 67 |
| 4 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 370 file(s) checked, 0 error(s) in 0 file(s)` |

## Result of Step 3

The section `Bố cục` spans lines 60 to 68 of `docs/conventions/code.md`. The command `git grep -n "format-layout"` prints the rule lines at 64, 65 and 66 and the `--dense` command at 67. Each line is inside the section `Bố cục`. The section `TypeScript` ends at line 58 and the section `Comments` starts at line 70, so no line of another section changed.

## Items that a decision table sent to the report

none

## STOP and retry

none

## What the commands do not prove

- `check-docs` proves the structure, the links and the purpose line of the file. It does not prove that the text of the new section is correct. The text comes from the task file without a change.
- `git grep` proves that each mention of `format-layout` sits between the headings `Bố cục` and `Comments` in the current file. It does not prove that each rule keeps that place after a later edit of the file.
- The task does not run `format:check` or the post-edit hook. The three rules in the new section describe the behavior that Task 1 and Task 5 prove with the tests of `tests/format-layout.test.mjs` and `tests/post-edit-hook.test.mjs`. This task does not run them again.
- The section is a rule that reviewers apply. No command fails when a function body has no blank line between two steps. `node scripts/format-layout.mjs --dense <path>` lists such a body, but a person must read the list.
