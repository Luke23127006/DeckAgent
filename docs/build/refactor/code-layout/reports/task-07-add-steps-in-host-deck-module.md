# Task 7: Add steps in the Host deck module report

Read this file to review the files, the commands and the checks of Task 7 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

The task added 137 blank lines between the direct statements of the 43 dense function bodies that Step 2 of [Task 7](../plan/task-07-add-steps-in-host-deck-module.md) lists in `apps/host/src/modules/deck`. No other line changed.

| File | Blank lines | Dense bodies |
| --- | --- | --- |
| `apps/host/src/modules/deck/brief/brief-rules.ts` | 4 | 1 |
| `apps/host/src/modules/deck/brief/brief-tool-protocol.ts` | 3 | 1 |
| `apps/host/src/modules/deck/brief/deck-run-plan.ts` | 8 | 2 |
| `apps/host/src/modules/deck/brief/deck-run-tools.ts` | 15 | 6 |
| `apps/host/src/modules/deck/deck.routes.ts` | 11 | 1 |
| `apps/host/src/modules/deck/generation/generation-confirmation.ts` | 6 | 3 |
| `apps/host/src/modules/deck/generation/generation-preparation.ts` | 4 | 1 |
| `apps/host/src/modules/deck/generation/generation-report.ts` | 4 | 1 |
| `apps/host/src/modules/deck/generation/generation-run-plan.ts` | 5 | 2 |
| `apps/host/src/modules/deck/generation/generation-tools.ts` | 17 | 5 |
| `apps/host/src/modules/deck/images/commons-images.ts` | 11 | 3 |
| `apps/host/src/modules/deck/images/image-credit.ts` | 7 | 2 |
| `apps/host/src/modules/deck/images/image-research.ts` | 3 | 2 |
| `apps/host/src/modules/deck/images/image-review-run.ts` | 10 | 3 |
| `apps/host/src/modules/deck/images/image-source.ts` | 5 | 1 |
| `apps/host/src/modules/deck/images/public-image-reader.ts` | 10 | 3 |
| `apps/host/src/modules/deck/rendering/artifact-renderer.ts` | 8 | 3 |
| `apps/host/src/modules/deck/rendering/cdp-browser.ts` | 4 | 2 |
| `apps/host/src/modules/deck/rendering/dom-validation.ts` | 2 | 1 |
| Total | 137 | 43 |

In addition, the task marked the 6 steps as complete in [Task 7](../plan/task-07-add-steps-in-host-deck-module.md), changed the row of Task 7 to `Done` in the [plan README](../plan/README.md), added the row of Task 7 to [Code Layout Reports](README.md) and created this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --porcelain -- apps packages scripts tests` | `0` | no line |
| 2 | `node scripts/format-layout.mjs --dense apps/host/src/modules/deck > /tmp/dense-before.txt; tail -n 1 /tmp/dense-before.txt` | `0` | `format-layout: 43 dense function bodies` |
| 4 | `git diff -U0 --ignore-blank-lines -- apps/host/src/modules/deck \| grep -E '^@@'` | `1` | no line |
| 4 | `git diff -U0 -- apps/host/src/modules/deck \| grep -E '^-' \| grep -v -E '^---'` | `1` | no line |
| 4 | `git diff -U0 -- apps/host/src/modules/deck \| grep -E '^\+.*[^[:space:]]' \| grep -v -E '^\+\+\+'` | `1` | no line |
| 4 | `git diff --name-only` | `0` | 19 paths, all under `apps/host/src/modules/deck` |
| 5 | `node scripts/format-layout.mjs --dense apps/host/src/modules/deck \| tail -n 1` | `0` | `format-layout: 0 dense function bodies` |
| 5 | `corepack pnpm@11.28.5 format:check` | `0` | `format-layout: 0 finding(s)`, `Checked 312 files in 1299ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` complete |
| 6 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 372 file(s) checked, 0 error(s) in 0 file(s)` |

An exit code of `1` for a `grep` command means that the pattern matched no line. That is the expected result of the three commands of Step 4.

## Result of Step 3

Each body got its blank lines from the table of Step 3. Two rows needed an interpretation:

- A guard that spans 3 or more lines (an `if` with no `else` whose branch is only a `throw` or a `return`) is a guard, so only the row of the guard group applies to it. The rows for a multi-line `if` do not apply to a guard. Example: the 6-line guard at `brief-tool-protocol.ts:111` stays in its guard group, and the body does not get a blank line inside that group.
- The row before the last `return` counts the one-line statements after the last blank line of the body. That blank line is the result of the rows above, so a `return` that a `try` or an `if` block already separates from the other statements does not get a second blank line.

## Far declarations

The location is the line of the declaration in the file after this task.

| Location | Name |
| --- | --- |
| `apps/host/src/modules/deck/generation/generation-report.ts:21` | `brief` |
| `apps/host/src/modules/deck/generation/generation-run-plan.ts:77` | `prepared` |
| `apps/host/src/modules/deck/generation/generation-run-plan.ts:78` | `lifecycle` |
| `apps/host/src/modules/deck/generation/generation-run-plan.ts:79` | `grant` |
| `apps/host/src/modules/deck/generation/generation-run-plan.ts:80` | `capability` |
| `apps/host/src/modules/deck/generation/generation-run-plan.ts:111` | `runContext` |
| `apps/host/src/modules/deck/generation/generation-tools.ts:44` | `excerpt` |
| `apps/host/src/modules/deck/images/image-research.ts:95` | `checks` |
| `apps/host/src/modules/deck/images/image-review-run.ts:267` | `image` |
| `apps/host/src/modules/deck/rendering/artifact-renderer.ts:120` | `poisoned` |
| `apps/host/src/modules/deck/rendering/artifact-renderer.ts:121` | `failure` |
| `apps/host/src/modules/deck/rendering/cdp-browser.ts:99` | `socket` |
| `apps/host/src/modules/deck/rendering/cdp-browser.ts:101` | `sequence` |
| `apps/host/src/modules/deck/rendering/cdp-browser.ts:198` | `folder` |
| `apps/host/src/modules/deck/rendering/cdp-browser.ts:200` | `cdp` |
| `apps/host/src/modules/deck/rendering/cdp-browser.ts:201` | `abort` |

## Unchanged bodies

Each body of the list of Step 2 has at least one blank line after Step 3. The command of Step 5 prints `format-layout: 0 dense function bodies`, so this table has no row.

| Location | Name |
| --- | --- |

## Items that a decision table sent to the report

The table of Step 3 sends the declarations of the table `Far declarations` above. No other row sent an item to the report.

## STOP and retry

none

## What the commands do not prove

- The command of Step 5 proves that each body of the list has a blank line between two direct statements. It does not prove that each blank line sits between two steps: no command checks the meaning of a step.
- The three commands of Step 4 prove that the diff has no changed line and no added text. They do not prove that each blank line is at the position that the table of Step 3 selects. A person must read the diff to check the position of each blank line.
- `format:check` and `build` prove that Biome accepts each blank line and that the code compiles. They do not prove that a blank line separates the correct statements.
- The far declarations stay where they are, because the task does not move a statement. The table above records them for a later revision.
