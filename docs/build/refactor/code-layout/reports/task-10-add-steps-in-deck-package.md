# Task 10: Add steps in the deck package report

Read this file to review the files, the commands and the checks of Task 10 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

The task added 179 blank lines between the direct statements of 47 of the 49 dense function bodies that Step 2 of [Task 10](../plan/task-10-add-steps-in-deck-package.md) lists. It changed no blank line count in the other two bodies; see `Unchanged bodies`. No other line changed.

| File | Blank lines | Dense bodies |
| --- | --- | --- |
| `packages/presentation/deck/src/artifact-fs.ts` | 4 | 2 |
| `packages/presentation/deck/src/artifact-readback.ts` | 9 | 3 |
| `packages/presentation/deck/src/artifact-stage.ts` | 17 | 4 |
| `packages/presentation/deck/src/artifact-store.ts` | 26 | 5 |
| `packages/presentation/deck/src/bound-outline.ts` | 10 | 4 |
| `packages/presentation/deck/src/brief-store.ts` | 10 | 2 |
| `packages/presentation/deck/src/brief.ts` | 4 | 1 |
| `packages/presentation/deck/src/deck-authoring.ts` | 12 | 3 |
| `packages/presentation/deck/src/deck-generation.ts` | 8 | 2 |
| `packages/presentation/deck/src/deck-publication.ts` | 29 | 8 |
| `packages/presentation/deck/src/deck-reads.ts` | 3 | 1 |
| `packages/presentation/deck/src/generation-store.ts` | 10 | 3 |
| `packages/presentation/deck/src/image-store.ts` | 14 | 5 |
| `packages/presentation/deck/src/interview.ts` | 4 | 2 |
| `packages/presentation/deck/src/outline-store.ts` | 8 | 2 |
| `packages/presentation/deck/src/schema.ts` | 11 | 2 |
| Total | 179 | 49 |

In addition, the task marked the 6 steps as complete in [Task 10](../plan/task-10-add-steps-in-deck-package.md), changed the row of Task 10 to `Done` in the [plan README](../plan/README.md), added the row of Task 10 to [Code Layout Reports](README.md) and created this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --porcelain -- apps packages scripts tests` | `0` | no line |
| 2 | `node scripts/format-layout.mjs --dense packages/presentation/deck/src > /tmp/dense-before.txt; tail -n 1 /tmp/dense-before.txt` | `0` | `format-layout: 49 dense function bodies` |
| 4 | `git diff -U0 --ignore-blank-lines -- packages/presentation/deck/src \| grep -E '^@@'` | `1` | no line |
| 4 | `git diff -U0 -- packages/presentation/deck/src \| grep -E '^-' \| grep -v -E '^---'` | `1` | no line |
| 4 | `git diff -U0 -- packages/presentation/deck/src \| grep -E '^\+.*[^[:space:]]' \| grep -v -E '^\+\+\+'` | `1` | no line |
| 4 | `git diff --name-only` | `0` | 16 files, each one starts with `packages/presentation/deck/src` |
| 4 | `git diff --stat -- packages/presentation/deck/src` | `0` | `16 files changed, 179 insertions(+)` |
| 5 | `node scripts/format-layout.mjs --dense packages/presentation/deck/src \| tail -n 1` | `0` | `format-layout: 2 dense function bodies` |
| 5 | `corepack pnpm@11.28.5 format:check` | `1`, then `0` after the retry | first run: `Found 1 error` at `packages\presentation\deck\src\image-store.ts`. Second run: `format-layout: 0 finding(s)`, `Checked 314 files in 759ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | `0` | `tsc -b`, the Vite build and `scripts/build-workspace.mjs` complete |
| 6 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 375 file(s) checked, 0 error(s) in 0 file(s)` |

An exit code of `1` for a `grep` command means that the pattern matched no line. That is the expected result of the three commands of Step 4.

## Result of Step 3

Each body got its blank lines from the table of Step 3. These rows needed an interpretation:

- A guard that spans 3 or more lines is a guard, so only the row of the guard group applies to it. The rows for a multi-line `if` or a multi-line expression statement do not apply to a guard. This case occurs in `parseAsset` and `assertStageReadyForBuild` at `artifact-fs.ts` and `artifact-store.ts`, and in `commitPreparedArtifact` at `deck-publication.ts`.
- A `const` or `let` declaration that spans more than one line is not an "expression statement that spans 3 or more lines", so no row selects a blank line before it. This case occurs in `begin` at `artifact-stage.ts` (`const stage: Stage = {`), in `loadCachedResearchImage` at `artifact-store.ts` and in `commitPreparedArtifact` at `deck-publication.ts`.
- The exception of the row moves the blank line before a one-line declaration that the next multi-line statement uses on its first line. The declaration already gets a blank line from the row of the guard group, so the task adds one blank line, not two. This case occurs in `imageMetadata` at `artifact-readback.ts` (`const assets` and `for (const asset of assets)`).
- A blank line that the rows put after a statement goes after its last line. A blank line that the rows put before a statement goes before its first leading comment. This case occurs twice in `applyMigrations` at `schema.ts`, where the comment before `if (version < 7)` stays with its statement.
- The row before the last `return` and the row after the statement before the `return` can select the same position. The task adds one blank line in that case. This case occurs in `append` at `artifact-stage.ts` and `saveBoundOutline` at `bound-outline.ts`.
- The task measures the distance of the row for a far declaration in the file after this task. An added blank line can increase the distance by one line, so a declaration at 9 lines before the task is in the table at 10 lines after the task.
- `assertStageReadyForBuild` at `artifact-store.ts` has 7 statements and all of them are guards. The group of guards ends at the end of the body, so no row adds a blank line. `interviewState` at `interview.ts` has 6 statements and no row matches. Both bodies are in the table `Unchanged bodies`.

## Far declarations

The location is the line of the declaration in the file after this task. The task does not move a declaration.

| Location | Name |
| --- | --- |
| `packages/presentation/deck/src/artifact-fs.ts:99` | `needId` |
| `packages/presentation/deck/src/artifact-fs.ts:100` | `slideId` |
| `packages/presentation/deck/src/artifact-fs.ts:101` | `failure` |
| `packages/presentation/deck/src/artifact-fs.ts:102` | `slideIndex` |
| `packages/presentation/deck/src/artifact-fs.ts:103` | `blockIndex` |
| `packages/presentation/deck/src/artifact-fs.ts:104` | `asset` |
| `packages/presentation/deck/src/artifact-fs.ts:105` | `attempts` |
| `packages/presentation/deck/src/artifact-fs.ts:183` | `credit` |
| `packages/presentation/deck/src/artifact-fs.ts:184` | `selection` |
| `packages/presentation/deck/src/artifact-fs.ts:185` | `attachmentId` |
| `packages/presentation/deck/src/artifact-fs.ts:186` | `webQuery` |
| `packages/presentation/deck/src/artifact-fs.ts:187` | `imageNeedId` |
| `packages/presentation/deck/src/artifact-stage.ts:240` | `stage` |
| `packages/presentation/deck/src/artifact-store.ts:156` | `image` |
| `packages/presentation/deck/src/artifact-store.ts:331` | `document` |
| `packages/presentation/deck/src/bound-outline.ts:71` | `content` |
| `packages/presentation/deck/src/bound-outline.ts:72` | `kinds` |
| `packages/presentation/deck/src/bound-outline.ts:108` | `fields` |
| `packages/presentation/deck/src/bound-outline.ts:109` | `a` |
| `packages/presentation/deck/src/bound-outline.ts:110` | `b` |
| `packages/presentation/deck/src/bound-outline.ts:114` | `retainedBefore` |
| `packages/presentation/deck/src/bound-outline.ts:115` | `retainedAfter` |
| `packages/presentation/deck/src/bound-outline.ts:145` | `previous` |
| `packages/presentation/deck/src/bound-outline.ts:147` | `slides` |
| `packages/presentation/deck/src/brief-store.ts:99` | `briefId` |
| `packages/presentation/deck/src/brief-store.ts:100` | `version` |
| `packages/presentation/deck/src/brief-store.ts:101` | `createdAt` |
| `packages/presentation/deck/src/deck-authoring.ts:193` | `fresh` |
| `packages/presentation/deck/src/deck-authoring.ts:194` | `outlineVersion` |
| `packages/presentation/deck/src/deck-authoring.ts:216` | `brief` |
| `packages/presentation/deck/src/deck-publication.ts:107` | `result` |
| `packages/presentation/deck/src/deck-publication.ts:135` | `generation` |
| `packages/presentation/deck/src/deck-publication.ts:230` | `fresh` |
| `packages/presentation/deck/src/deck-publication.ts:250` | `result` |
| `packages/presentation/deck/src/deck-publication.ts:390` | `assets` |
| `packages/presentation/deck/src/deck-publication.ts:391` | `publication` |
| `packages/presentation/deck/src/deck-publication.ts:392` | `planning` |
| `packages/presentation/deck/src/image-store.ts:108` | `identity` |
| `packages/presentation/deck/src/interview.ts:101` | `assumptions` |
| `packages/presentation/deck/src/outline-store.ts:109` | `brief` |
| `packages/presentation/deck/src/outline-store.ts:167` | `draft` |

## Unchanged bodies

The command of Step 5 lists these bodies after Step 3. Each body has no row of the table of Step 3 that adds a blank line.

| Location | Name |
| --- | --- |
| `packages/presentation/deck/src/artifact-store.ts:257` | `assertStageReadyForBuild` |
| `packages/presentation/deck/src/interview.ts:24` | `interviewState` |

## Items that a decision table sent to the report

The table of Step 3 sent the 41 declarations of the table `Far declarations` and the 2 bodies of the table `Unchanged bodies`. The section `Result of Step 3` records the seven interpretations. No other row sent an item to the report.

## STOP and retry

- **Retry of `format:check` in Step 5.** The first run exited with code `1`. Biome reported `packages\presentation\deck\src\image-store.ts` and would have removed the blank line at line 159. That blank line was the last line inside the body of `prepareSingleNeed`, after the last statement (the `try` statement). The table of Step 3 puts a blank line after a multi-line statement only when the statement is not the last statement of the body, so the task removes that one blank line. The second run exited with code `0`. No STOP occurred.

## What the commands do not prove

- The command of Step 5 proves that each body except the two in `Unchanged bodies` has a blank line between two direct statements. It does not prove that each blank line sits between two steps: no command checks the meaning of a step.
- The three commands of Step 4 prove that the diff adds only blank lines. They do not prove that each blank line is at the position that the table of Step 3 selects. A person must read the diff to check the position of each blank line.
- `format:check` and `build` prove that Biome accepts each blank line and that the code compiles. They do not prove that a blank line separates the correct statements.
- The far declarations stay where they are, because the task does not move a statement. The table above records them for a later revision.
- The task does not prove that the two bodies in `Unchanged bodies` need no blank line in a later revision. A person must decide whether a group of guards that reaches the end of a body, and an object built in one statement, read as one step.
