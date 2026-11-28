# Task 11: Add steps in the other packages report

Read this file to review the files, the commands and the checks of Task 11 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

The task added 82 blank lines between the direct statements of all 23 dense function bodies that Step 2 of [Task 11](../plan/task-11-add-steps-in-other-packages.md) lists. No body stayed dense, so the table `Unchanged bodies` is empty. No other line changed.

| File | Blank lines | Dense bodies |
| --- | --- | --- |
| `packages/host/contracts/src/brief-validation.ts` | 8 | 2 |
| `packages/host/contracts/src/conversation-validation.ts` | 2 | 1 |
| `packages/host/contracts/src/deck-validation.ts` | 11 | 4 |
| `packages/host/contracts/src/generation-validation.ts` | 2 | 1 |
| `packages/host/contracts/src/outline-validation.ts` | 7 | 3 |
| `packages/host/contracts/src/request-validation.ts` | 6 | 2 |
| `packages/presentation/design/src/index.ts` | 15 | 4 |
| `packages/presentation/document/src/index.ts` | 3 | 1 |
| `packages/presentation/html/src/controlled-template.ts` | 6 | 1 |
| `packages/presentation/html/src/index.ts` | 5 | 1 |
| `packages/presentation/html/src/layout-inspection.ts` | 6 | 1 |
| `packages/presentation/html/src/policy.ts` | 4 | 1 |
| `packages/presentation/pptx/src/index.ts` | 7 | 1 |
| Total | 82 | 23 |

In addition, the task marked the 6 steps as complete in [Task 11](../plan/task-11-add-steps-in-other-packages.md), changed the row of Task 11 to `Done` in the [plan README](../plan/README.md), added the row of Task 11 to [Code Layout Reports](README.md) and created this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --porcelain -- apps packages scripts tests` | `0` | no line |
| 2 | `node scripts/format-layout.mjs --dense packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src > /tmp/dense-before.txt; tail -n 1 /tmp/dense-before.txt` | `0` | `format-layout: 23 dense function bodies` |
| 4 | `git diff -U0 --ignore-blank-lines -- packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src \| grep -E '^@@'` | `1` | no line |
| 4 | `git diff -U0 -- packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src \| grep -E '^-' \| grep -v -E '^---'` | `1` | no line |
| 4 | `git diff -U0 -- packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src \| grep -E '^\+.*[^[:space:]]' \| grep -v -E '^\+\+\+'` | `1` | no line |
| 4 | `git diff --name-only` | `0` | 16 files: the 13 files of the table above and 3 skill files with a change that already existed before Step 1 (see `STOP and retry`) |
| 4 | `git diff --stat -- packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src` | `0` | `13 files changed, 82 insertions(+)` |
| 5 | `node scripts/format-layout.mjs --dense packages/host/contracts/src packages/presentation/design/src packages/presentation/document/src packages/presentation/html/src packages/presentation/pptx/src \| tail -n 1` | `0` | `format-layout: 0 dense function bodies` |
| 5 | `corepack pnpm@11.28.5 format:check` | `0` | `format-layout: 0 finding(s)`, `Checked 314 files in 571ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | `0` | `tsc -b`, the Vite build and `scripts/build-workspace.mjs` complete |
| 6 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 376 file(s) checked, 0 error(s) in 0 file(s)` |

An exit code of `1` for a `grep` command means that the pattern matched no line. That is the expected result of the three commands of Step 4.

## Result of Step 3

Each body got its blank lines from the table of Step 3. These rows needed an interpretation:

- A guard that spans 3 or more lines is a guard, so only the row of the guard group applies to it. The rows for a multi-line `if` and for a multi-line expression statement do not apply to a guard. This case occurs in `isWireBriefDraft`, `decodeBriefView`, `decodeDeckSnapshot`, `decodeSlideContent`, `decodeInterview`, `decodeConfirmationResult`, `decodeContentBlock`, `decodeProposalSlide`, `decodeBoundProposal`, `resolveDesign`, `decodeDesignSnapshot`, `decodeSlideDocument`, `controlledStarter`, `decodeAgentRequest` and `build` at `pptx/src/index.ts`.
- A `const` or `let` declaration that spans more than one line is a declaration, not an expression statement, so no row selects a blank line before it. This case occurs in `decodeBriefView` (`const matchesRefs`), `decodeDeckSnapshot` (`const slides`), `decodeInterview` (`const questions`, `const blockers`), `decodeDesignSnapshot` (`const invalid`, `const ref`, `const snapshot`), `decodeProposalSlide` (`const hasInvalidSource`), `decodeBoundProposal` (`const brief`), `controlledStarter` (`const plan`), `decodeSlideDocument` (`const d`, `const root`), `verifyContent` (`const d`, `const root`), `inspectControlledLayout` (`const issue`, `const title`, `const content`, `const pair`, `const columns`) and `build` (`const font`, `const lines`).
- The exception of the row for a multi-line `if` moves the blank line before a one-line declaration that the `if` uses on its first line. This case occurs once, in `decodeBriefView`: the blank line goes before `const current = data.current`, not before `if (current === null) {`.
- The row for a multi-line expression statement selects the blank line before `slide.addText(d.title, {` in `build` at `pptx/src/index.ts`.
- A blank line that the rows put after a statement goes after its last line. A blank line that the rows put before a statement goes before its first leading comment. This case occurs in `controlledStarter`, where the comment before `for (let i = imageCount; ...)` stays with its statement.
- The row before the last `return` and the row after the statement before the `return` select the same position in `isWireBriefDraft`, `decodeBoundProposal` and `build` at `pptx/src/index.ts`. The task adds one blank line in each of these three positions.
- The task measures the distance of the row for a far declaration in the file after this task. An added blank line can increase the distance by one line, so a declaration at 9 lines before the task can be in the table at 10 lines after the task. `width` and `height` in `build` at `pptx/src/index.ts` are at 10 lines in this task.

## Far declarations

The location is the line of the declaration in the file after this task. The task does not move a declaration.

| Location | Name |
| --- | --- |
| `packages/host/contracts/src/deck-validation.ts:63` | `base` |
| `packages/host/contracts/src/deck-validation.ts:157` | `imageCredits` |
| `packages/host/contracts/src/deck-validation.ts:158` | `imageOmissions` |
| `packages/host/contracts/src/deck-validation.ts:170` | `provenance` |
| `packages/host/contracts/src/request-validation.ts:238` | `deck` |
| `packages/presentation/design/src/index.ts:181` | `chosenTemplate` |
| `packages/presentation/design/src/index.ts:203` | `invalid` |
| `packages/presentation/html/src/controlled-template.ts:62` | `imageCount` |
| `packages/presentation/html/src/controlled-template.ts:63` | `expectedImages` |
| `packages/presentation/html/src/index.ts:67` | `found` |
| `packages/presentation/html/src/index.ts:69` | `all` |
| `packages/presentation/pptx/src/index.ts:52` | `images` |
| `packages/presentation/pptx/src/index.ts:53` | `words` |
| `packages/presentation/pptx/src/index.ts:65` | `width` |
| `packages/presentation/pptx/src/index.ts:66` | `height` |

## Unchanged bodies

The command of Step 5 lists no body after Step 3. Each of the 23 bodies got at least one blank line, so this table is empty.

| Location | Name |
| --- | --- |

## Items that a decision table sent to the report

The table of Step 3 sent the 15 declarations of the table `Far declarations` and no body to the table `Unchanged bodies`. The section `Result of Step 3` records the seven interpretations. No other row sent an item to the report.

## STOP and retry

- **STOP at Step 4, `git diff --name-only`.** The command printed three files in addition to the 13 files of the task: `.agents/skills/write-implementation-plan/SKILL.md`, `.claude/skills/write-implementation-plan/SKILL.md` and `.codex/skills/write-implementation-plan/SKILL.md`. These files had a change before Step 1 and the task does not touch them; Step 1 does not print them because it checks only `apps`, `packages`, `scripts` and `tests`. They are not staged. The three commands that prove that the diff adds only blank lines printed no line, and `git diff --stat` shows 82 insertions in the 13 files of the task. The task does not commit by itself, because the final file list of Step 4 does not match `Expected`. The person who approved this report approved a commit that stages only the files of the task.
- **Retry in Step 3.** One edit of `packages/presentation/design/src/index.ts` removed the line break between `return plan.blocks.length === 1 && ... c.lead!)` and `if (layout.id === 'title-body')`. A read of the file found the joined line. The next edit restored the line break, and the task added the blank line before `if (layout.id === 'section')` with a correct edit. The three commands of Step 4 then printed no line.

## What the commands do not prove

- The command of Step 5 proves that no body of the task is dense. It does not prove that each blank line sits between two steps: no command checks the meaning of a step.
- The three commands of Step 4 prove that the diff adds only blank lines. They do not prove that each blank line is at the position that the table of Step 3 selects. A person must read the diff to check the position of each blank line.
- `format:check` and `build` prove that Biome accepts each blank line and that the code compiles. They do not prove that a blank line separates the correct statements.
- The far declarations stay where they are, because the task does not move a statement. The table above records them for a later revision.
- `git diff --name-only` does not isolate the change of the task from the change that already existed in the three skill files. A person must confirm that these three files are unrelated to Task 11 before the commit.
