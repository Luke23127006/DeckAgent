# Task 9: Add steps in the Browser report

Read this file to review the files, the commands and the checks of Task 9 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

The task added 145 blank lines between the direct statements of the 57 dense function bodies that Step 2 of [Task 9](../plan/task-09-add-steps-in-browser.md) lists. No other line changed.

| File | Blank lines | Dense bodies |
| --- | --- | --- |
| `apps/web/src/api/client.ts` | 4 | 2 |
| `apps/web/src/components/chat-list.tsx` | 3 | 2 |
| `apps/web/src/components/chat-screen.tsx` | 4 | 3 |
| `apps/web/src/components/deck-workflow.tsx` | 2 | 1 |
| `apps/web/src/components/model-picker.tsx` | 6 | 2 |
| `apps/web/src/components/outline-card.tsx` | 2 | 2 |
| `apps/web/src/components/published-deck.tsx` | 2 | 1 |
| `apps/web/src/components/request-row.tsx` | 5 | 2 |
| `apps/web/src/components/research-controls.tsx` | 3 | 2 |
| `apps/web/src/components/workspace-controls.tsx` | 2 | 2 |
| `apps/web/src/hooks/use-conversation.ts` | 45 | 13 |
| `apps/web/src/hooks/use-deck-model.ts` | 6 | 2 |
| `apps/web/src/hooks/use-deck-screens.ts` | 7 | 3 |
| `apps/web/src/hooks/use-motion.ts` | 11 | 5 |
| `apps/web/src/hooks/use-panel-resizer.ts` | 8 | 3 |
| `apps/web/src/hooks/use-presentation.ts` | 6 | 2 |
| `apps/web/src/hooks/use-request-stream.ts` | 6 | 3 |
| `apps/web/src/hooks/use-settings-navigation.ts` | 4 | 2 |
| `apps/web/src/hooks/use-slide-previews.ts` | 10 | 2 |
| `apps/web/src/pages/settings/components/provider-form.tsx` | 6 | 2 |
| `apps/web/src/pages/settings/settings-page.tsx` | 3 | 1 |
| Total | 145 | 57 |

In addition, the task marked the 6 steps as complete in [Task 9](../plan/task-09-add-steps-in-browser.md), changed the row of Task 9 to `Done` in the [plan README](../plan/README.md), added the row of Task 9 to [Code Layout Reports](README.md) and created this report.

The working tree also held uncommitted work of a different change: a translation of Vietnamese strings to English in 12 files, and the new file `scripts/check-source-language.mjs`. That work is not part of this task and this task did not stage it. Two of those files are under `apps/web/src`: `apps/web/src/text.ts` and `apps/web/src/styles/legacy.css`. The task changes neither file: `--dense` lists 0 bodies in `text.ts`, and the script does not read a CSS file. The proof of Step 4 names the 21 files of this task, so the diff of the other change stays out of it.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --porcelain -- apps packages scripts tests` | `0` | 13 modified files and the untracked file `scripts/check-source-language.mjs`. The person who runs the task told the executor to continue. See `STOP and retry`. |
| 2 | `node scripts/format-layout.mjs --dense apps/web/src > /tmp/dense-before.txt; tail -n 1 /tmp/dense-before.txt` | `0` | `format-layout: 57 dense function bodies` |
| 4 | `git diff -U0 --ignore-blank-lines -- <21 files> \| grep -E '^@@'` | `1` | no line |
| 4 | `git diff -U0 -- <21 files> \| grep -E '^-' \| grep -v -E '^---'` | `1` | no line |
| 4 | `git diff -U0 -- <21 files> \| grep -E '^\+.*[^[:space:]]' \| grep -v -E '^\+\+\+'` | `1` | no line |
| 4 | `git diff --stat -- <21 files>` | `0` | `21 files changed, 145 insertions(+)` |
| 5 | `node scripts/format-layout.mjs --dense apps/web/src \| tail -n 1` | `0` | `format-layout: 0 dense function bodies` |
| 5 | `corepack pnpm@11.28.5 format:check` | `0` | `format-layout: 0 finding(s)`, `Checked 314 files in 623ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | `0` | `tsc -b`, the Vite build and `scripts/build-workspace.mjs` complete |
| 6 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 374 file(s) checked, 0 error(s) in 0 file(s)` |

`<21 files>` is the list of the column `File` in the table above. The command of Step 4 in the task file names `apps/web/src` instead. The task scopes the command to the 21 files of this task because the working tree held the other change, which the person did not commit. The three commands prove the same property for the files of this task: the diff of a file of this task adds only blank lines.

An exit code of `1` for a `grep` command means that the pattern matched no line. That is the expected result of the three commands of Step 4.

## Result of Step 3

Each body got its blank lines from the table of Step 3. These rows needed an interpretation:

- A guard that spans 3 or more lines (an `if` with no `else` whose branch is only a `throw` or a `return`, or a call whose callee ends with `throwIfAborted`) is a guard, so only the row of the guard group applies to it. The rows for a multi-line `if` or a multi-line expression statement do not apply to a guard. This case occurs in `SlideBlocks` at `apps/web/src/components/outline-card.tsx` and in `requestFeedback` at `apps/web/src/components/request-row.tsx`.
- The row for a declaration that the body uses on the first line of a multi-line statement moves the blank line before the declaration. When the declaration already gets a blank line from the row of the guard group or is the first statement of the body, the task adds no second blank line. This case occurs in `submitDialog` at `apps/web/src/components/workspace-controls.tsx` and in `onDeck` at `apps/web/src/hooks/use-deck-screens.ts`.
- The blank line that the rows of Step 3 put before a statement goes before the first leading comment of that statement, as rule `layout-between-declarations` does. This case occurs twice in `open` at `apps/web/src/hooks/use-conversation.ts`.
- The row for a React component and the row before the last `return` both select the line of the `return` in most components, so the task adds one blank line, not two.

## Far declarations

The location is the line of the declaration in the file after this task. The task does not move a declaration.

| Location | Name |
| --- | --- |
| `apps/web/src/api/client.ts:224` | `eventLine` |
| `apps/web/src/components/chat-list.tsx:66` | `chats` |
| `apps/web/src/components/chat-list.tsx:70` | `selectedId` |
| `apps/web/src/components/chat-list.tsx:71` | `foundIds` |
| `apps/web/src/components/chat-list.tsx:83` | `grouped` |
| `apps/web/src/components/chat-list.tsx:84` | `ungrouped` |
| `apps/web/src/components/outline-card.tsx:154` | `slideIndex` |
| `apps/web/src/components/outline-card.tsx:154` | `proposal` |
| `apps/web/src/components/published-deck.tsx:49` | `preview` |
| `apps/web/src/components/request-row.tsx:25` | `toolErrors` |
| `apps/web/src/components/request-row.tsx:104` | `note` |
| `apps/web/src/components/request-row.tsx:104` | `setNote` |
| `apps/web/src/components/request-row.tsx:105` | `asked` |
| `apps/web/src/hooks/use-conversation.ts:404` | `previousGeneration` |
| `apps/web/src/hooks/use-conversation.ts:647` | `expected` |
| `apps/web/src/hooks/use-conversation.ts:649` | `publicResearch` |
| `apps/web/src/hooks/use-deck-screens.ts:194` | `knowledge` |
| `apps/web/src/hooks/use-deck-screens.ts:194` | `research` |
| `apps/web/src/hooks/use-deck-screens.ts:194` | `format` |
| `apps/web/src/hooks/use-deck-screens.ts:197` | `image` |
| `apps/web/src/hooks/use-motion.ts:105` | `letters` |
| `apps/web/src/hooks/use-panel-resizer.ts:57` | `save` |
| `apps/web/src/hooks/use-panel-resizer.ts:58` | `valueText` |
| `apps/web/src/hooks/use-panel-resizer.ts:60` | `drag` |
| `apps/web/src/hooks/use-panel-resizer.ts:136` | `maximum` |
| `apps/web/src/hooks/use-request-stream.ts:35` | `parts` |
| `apps/web/src/hooks/use-request-stream.ts:37` | `errorCode` |
| `apps/web/src/hooks/use-request-stream.ts:40` | `pendingApproval` |
| `apps/web/src/hooks/use-request-stream.ts:94` | `onSnapshot` |
| `apps/web/src/hooks/use-request-stream.ts:95` | `onActivity` |
| `apps/web/src/hooks/use-request-stream.ts:96` | `onSummarized` |
| `apps/web/src/hooks/use-request-stream.ts:97` | `onConnectionLost` |
| `apps/web/src/hooks/use-request-stream.ts:98` | `onEnded` |
| `apps/web/src/hooks/use-settings-navigation.ts:20` | `index` |
| `apps/web/src/pages/settings/components/provider-form.tsx:26` | `id` |
| `apps/web/src/pages/settings/components/provider-form.tsx:26` | `setId` |
| `apps/web/src/pages/settings/components/provider-form.tsx:27` | `name` |
| `apps/web/src/pages/settings/components/provider-form.tsx:27` | `setName` |
| `apps/web/src/pages/settings/components/provider-form.tsx:28` | `protocol` |
| `apps/web/src/pages/settings/components/provider-form.tsx:28` | `setProtocol` |
| `apps/web/src/pages/settings/components/provider-form.tsx:29` | `url` |
| `apps/web/src/pages/settings/components/provider-form.tsx:29` | `setUrl` |
| `apps/web/src/pages/settings/components/provider-form.tsx:30` | `key` |
| `apps/web/src/pages/settings/components/provider-form.tsx:30` | `setKey` |
| `apps/web/src/pages/settings/components/provider-form.tsx:31` | `removeKey` |
| `apps/web/src/pages/settings/components/provider-form.tsx:31` | `setRemoveKey` |
| `apps/web/src/pages/settings/components/provider-form.tsx:32` | `models` |
| `apps/web/src/pages/settings/components/provider-form.tsx:32` | `setModels` |
| `apps/web/src/pages/settings/components/provider-form.tsx:33` | `baselineVersion` |
| `apps/web/src/pages/settings/components/provider-form.tsx:34` | `failure` |
| `apps/web/src/pages/settings/components/provider-form.tsx:34` | `setFailure` |
| `apps/web/src/pages/settings/components/provider-form.tsx:56` | `inputClass` |
| `apps/web/src/pages/settings/components/provider-form.tsx:57` | `error` |
| `apps/web/src/pages/settings/components/provider-form.tsx:67` | `credential` |
| `apps/web/src/pages/settings/settings-page.tsx:10` | `settings` |
| `apps/web/src/pages/settings/settings-page.tsx:11` | `preferences` |
| `apps/web/src/pages/settings/settings-page.tsx:12` | `theme` |
| `apps/web/src/pages/settings/settings-page.tsx:13` | `navigate` |
| `apps/web/src/pages/settings/settings-page.tsx:14` | `location` |
| `apps/web/src/pages/settings/settings-page.tsx:15` | `selected` |
| `apps/web/src/pages/settings/settings-page.tsx:15` | `setSelected` |
| `apps/web/src/pages/settings/settings-page.tsx:16` | `setDirty` |
| `apps/web/src/pages/settings/settings-page.tsx:17` | `setBusy` |
| `apps/web/src/pages/settings/settings-page.tsx:18` | `revision` |
| `apps/web/src/pages/settings/settings-page.tsx:18` | `setRevision` |
| `apps/web/src/pages/settings/settings-page.tsx:19` | `notice` |
| `apps/web/src/pages/settings/settings-page.tsx:19` | `setNotice` |
| `apps/web/src/pages/settings/settings-page.tsx:30` | `back` |
| `apps/web/src/pages/settings/settings-page.tsx:41` | `template` |

## Unchanged bodies

Each body of the list of Step 2 has at least one blank line after Step 3. The command of Step 5 prints `format-layout: 0 dense function bodies`, so this table has no row.

| Location | Name |
| --- | --- |

## Items that a decision table sent to the report

The table of Step 3 sends the declarations of the table `Far declarations` above. The section `Result of Step 3` records the four interpretations. No other row sent an item to the report.

## STOP and retry

- **Step 1, first STOP.** The command printed ` M apps/web/src/text.ts`, a translation of the strings of the file to English. The executor stopped and sent the STOP to the person. The person told the executor to continue.
- **Step 1, second STOP.** The executor held the working tree change in a stash to get a clean tree. The command then printed 12 more modified files and, after that, the untracked file `scripts/check-source-language.mjs`. A different agent was changing the repository at the same time. The executor restored the stash and sent the situation to the person. The person said that the other agent was almost complete and told the executor to continue.
- **Retry of the proof of Step 4.** Because the other change stayed in the working tree, the executor ran the three commands of Step 4 with the 21 files of this task instead of `apps/web/src`. The commands prove the same property for the files of this task. Step 1 and the command `git diff --name-only` of Step 4 do not pass as written; see `What the commands do not prove`.

## What the commands do not prove

- The command of Step 5 proves that each body of the list has a blank line between two direct statements. It does not prove that each blank line sits between two steps: no command checks the meaning of a step.
- The three commands of Step 4 prove that the diff of the 21 files of this task has no changed line and no added text. They do not prove that each blank line is at the position that the table of Step 3 selects. A person must read the diff to check the position of each blank line.
- Step 1 does not pass as written. The working tree held the uncommitted work of a different change, and that change is not part of this commit. `git diff --name-only` therefore lists files outside `apps/web/src`, such as `apps/host/src/db/run-store.ts` and `packages/presentation/deck/src/interview.ts`. The commit of this task stages the 21 files of this task and the documents of the task only.
- `format:check` and `build` prove that Biome accepts each blank line and that the code compiles. They do not prove that a blank line separates the correct statements.
- The far declarations stay where they are, because the task does not move a statement. The table above records them for a later revision.
