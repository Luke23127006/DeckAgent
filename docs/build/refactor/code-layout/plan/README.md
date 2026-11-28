# Code Layout Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of the Code Layout Refactor.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, mark the task `Done` in this file and write the task report file in `../reports/`. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

> **For the person who approves a report:** The executor commits and pushes each task with the subject in the column `Commit subject` of the [Tasks](#tasks) table. Task 12 finds the style commits by these subjects. Run `git show --stat HEAD` to see the commit of a task.

**Goal:** Add a script that adds the blank lines that a machine can find. Apply the script and Biome to the repository. Run the script in `format`, `format:check` and the post-edit hook. Write the layout rules into `docs/conventions/code.md`. Add blank lines between the steps of dense function bodies by hand.

**Approach:** Tasks 1 and 2 write `scripts/format-layout.mjs` with the TypeScript compiler API. Tasks 3 and 4 apply Biome and the script to the repository, each in its own style commit. Tasks 5 and 6 enforce the rules. Tasks 7 to 11 add blank lines by hand with a decision table, one area for each task. Task 12 records the style commits in `.git-blame-ignore-revs` and runs the exit checks.

**Tech stack:** Node.js 22.19.0, pnpm 11.28.5 through `corepack pnpm@11.28.5`, TypeScript 6.0.3 (compiler API), `node:test`, oxlint 1.94.0, Biome 2.5.15, Git 2.56.

**Spec:** [Code Layout Refactor](../README.md).

## Decisions

| Topic | Decision |
| --- | --- |
| Tool | A Node script `scripts/format-layout.mjs` that uses the `typescript` package of the repository root. Do not add ESLint, `@stylistic` or a new dependency. Reason: Biome does not add blank lines, and oxlint has no rule for them. |
| Files that the script reads | Files with the extensions `.ts`, `.tsx`, `.js`, `.mjs` and `.cjs` under `apps/`, `packages/`, `scripts/` and `tests/`. Skip files that end with `.d.ts`, and skip each folder with the name `node_modules`, `lib`, `dist` or `coverage`. Reason: the same file set as `files.includes` in `biome.json`. |
| Rule `layout-after-imports` | One blank line between the last import declaration at the start of a file and the next statement. |
| Rule `layout-between-declarations` | One blank line between two top-level statements when one of the two statements spans more than one line. Two one-line statements stay together. Two import declarations stay together. Two function declarations with the same name stay together when the first has no body (overloads). Source: agent proposal. Reason: a group of one-line `const` or `export` statements reads as one group, and a blank line between multi-line declarations shows where each one ends. |
| Rule `layout-between-members` | The rule `layout-between-declarations` for the members of each class declaration and class expression, at any depth. Two methods with the same name stay together when the first has no body. |
| Gap between two statements | The number of lines between the end of the previous statement and the start of the next statement. The start is the first leading comment of the next statement, when it has one. A blank line is missing when the gap is exactly one line. When the two statements are on the same line, the script does nothing. |
| Line endings | The script writes `\r\n` when the source text contains `\r\n`, and `\n` in other cases. |
| Dense function body | A function, method, arrow function or accessor with a block body. The body has 6 or more direct statements and 12 or more lines from `{` to `}`. It has no blank line between two direct statements. Source: agent proposal. Reason: at these values the scan of 2026-11-28 found 249 bodies, which five tasks can do by hand. |
| Steps inside function bodies | Only a person or an executor with the decision table of Tasks 7 to 11 adds them. The script lists dense bodies and does not change them. Reason: a machine does not know which statements belong to one step. |
| Order of statements | Tasks do not move, merge or split statements. Tasks 7 to 11 report declarations that are far from their first use. A later revision can move them. |
| Biome pass | Task 3 runs `biome format --write` before the layout pass, in its own commit. Reason: 24 files do not pass `biome format` today, and a separate commit keeps the layout diff to blank lines only. |
| Proof that a layout task changes only blank lines | `git diff -U0 --ignore-blank-lines` prints no hunk header (`@@`), and `git diff -U0` prints no removed line. |
| Blame | Task 12 creates `.git-blame-ignore-revs` with the hashes of the commits whose subject starts with `style(format):` or `style(layout):`. The count is 7. |
| Post-edit hook | `scripts/hooks/post-edit.mjs` runs the layout rules on each edited file that the script reads, and exits with code 2 when a blank line is missing. Reason: agents write most of the code, and the hook tells the agent at the time of the edit. |
| Language of the conventions | Vietnamese, with the skill `ste-vi` in light mode. Documents in `docs/build/` are in English. |

## Global Constraints

- Shell: Git Bash on Windows. Run each command from the repository root `C:\Users\Duy\Desktop\DeckAgent`.
- Package manager: `corepack pnpm@11.28.5`. Do not call `pnpm` directly.
- Documents in `docs/conventions/` are in Vietnamese. Documents in `docs/build/` are in English. Keep technical terms in English.
- Messages that the script and the hook print are English text that an agent reads. Write them in Simplified Technical English: short sentences and active voice.
- Do not change behavior. Do not change HTTP paths, status codes, JSON bodies, names of symbols or files.
- Do not run the full test suite in a regular task. Run only the commands of the task. Task 12 runs the exit checks.
- Do not add `enum`, `const enum`, `any`, non-`as const` type assertions, lint-disable directives or `@ts-expect-error`.
- Test files obey `docs/conventions/testware.md`: the header comment tells what the file tests, the environment, the command and the source of the expected values. Expected values are literals.

### Task protocol

Each task obeys this protocol. A task file adds only its special conditions and actions.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in the task.
- The task needs a decision that the task does not contain.
- The same step failed two times.

**Forbidden:**

- Change a file that is not in the `Files` block of the task.
- Remove, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push before the step `Write the report file and stop`, or commit after a STOP.
- Use `git add -A`, `git add .`, `git commit --amend`, `--no-verify` or `git push --force`.

**Files of each task:** in addition to the `Files` block, each task changes `plan/README.md`, its own task file and `../reports/README.md`, and it creates `../reports/task-NN-<slug>.md`.

**Step `Write the report file and stop`:**

1. Mark the other steps as `- [x]` in the task file. Change the row of the task in this file to `Done` and link `../reports/task-NN-<slug>.md`.
2. Create `../reports/task-NN-<slug>.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output of each command
   - The tables that the task asks for
   - Items that a decision table sent to the report
   - Each STOP and each retry, with the step and the cause. Write `none` when no STOP or retry occurred.
   - What the commands do not prove
3. Add a row for the task in `../reports/README.md` and run `corepack pnpm@11.28.5 check:docs`.
4. Mark this step as `- [x]`.
5. Commit and push the task. Do this only when no STOP occurred:
   - Stage each file of the task by its path: the files of the `Files` block, `docs/build/refactor/code-layout/plan/README.md`, the task file, `docs/build/refactor/code-layout/reports/README.md` and the report file. For a `Files` block that names folders, run `git add -- <folder ...>` with the folders of the task.
   - Run `git diff --cached --name-only`. Expected: each line is a file of the task. Other changes in the working tree stay unstaged.
   - Run `git commit -m "<subject>"`. `<subject>` is the value of the column `Commit subject` for the task in the [Tasks](#tasks) table. Expected: exit code 0.
   - Run `git push origin HEAD`. Expected: exit code 0.
   - STOP when the commit or the push fails. Write the cause in the report summary.
6. Stop, and send the report summary with the commit hash from `git rev-parse --short HEAD`.

## Review Focus

- The script adds a blank line between overload signatures, or inside a group of one-line fields or `const` statements. Tests: `formatLayout keeps one-line groups and overloads together` and `formatLayout adds blank lines between class members` in [Task 1](task-01-add-layout-rules.md).
- The script adds the blank line between a JSDoc comment and its declaration instead of before the comment. Test: `formatLayout adds the blank line before the leading comment` in [Task 1](task-01-add-layout-rules.md).
- The script doubles a line ending in a CRLF file, or a second run changes the output again. Test: `formatLayout keeps CRLF line endings and a second run changes nothing` in [Task 1](task-01-add-layout-rules.md).
- The post-edit hook blocks a file outside the script scope, or accepts a source file with a missing blank line. Tests: `blocks an edited source file with a missing blank line` and `ignores a file outside the check scope` in [Task 5](task-05-enforce-layout-in-format-and-hook.md).
- A hand task changes a line that is not blank. Check: `git diff -U0 --ignore-blank-lines` prints no `@@` line in [Task 7](task-07-add-steps-in-host-deck-module.md) to [Task 11](task-11-add-steps-in-other-packages.md).

## Tasks

| Task | Status | File | Commit subject |
| --- | --- | --- | --- |
| 1 | Done | [Add the layout rules](task-01-add-layout-rules.md) ([report](../reports/task-01-add-layout-rules.md)) | `feat(scripts): add the code layout rules` |
| 2 | Done | [Add the dense body list and the command](task-02-add-dense-list-and-command.md) ([report](../reports/task-02-add-dense-list-and-command.md)) | `feat(scripts): add the dense body list and the layout command` |
| 3 | Done | [Apply Biome to the repository](task-03-apply-biome-format.md) ([report](../reports/task-03-apply-biome-format.md)) | `style(format): apply biome format` |
| 4 | Done | [Apply the layout script to the repository](task-04-apply-layout-script.md) ([report](../reports/task-04-apply-layout-script.md)) | `style(layout): add blank lines between declarations and members` |
| 5 | Done | [Enforce the layout in format and the post-edit hook](task-05-enforce-layout-in-format-and-hook.md) ([report](../reports/task-05-enforce-layout-in-format-and-hook.md)) | `chore(scripts): run the layout check in format and the post-edit hook` |
| 6 | Done | [Write the layout rules into the conventions](task-06-write-layout-rules-into-conventions.md) ([report](../reports/task-06-write-layout-rules-into-conventions.md)) | `docs(conventions): add the code layout rules` |
| 7 | Done | [Add steps in the Host deck module](task-07-add-steps-in-host-deck-module.md) ([report](../reports/task-07-add-steps-in-host-deck-module.md)) | `style(layout): add steps in the Host deck module` |
| 8 | Done | [Add steps in the other Host folders](task-08-add-steps-in-other-host-folders.md) ([report](../reports/task-08-add-steps-in-other-host-folders.md)) | `style(layout): add steps in the other Host folders` |
| 9 | Done | [Add steps in the Browser](task-09-add-steps-in-browser.md) ([report](../reports/task-09-add-steps-in-browser.md)) | `style(layout): add steps in the Browser` |
| 10 | Pending | [Add steps in the deck package](task-10-add-steps-in-deck-package.md) | `style(layout): add steps in the deck package` |
| 11 | Pending | [Add steps in the other packages](task-11-add-steps-in-other-packages.md) | `style(layout): add steps in the other packages` |
| 12 | Pending | [Record the style commits and run the exit checks](task-12-record-style-commits-and-exit.md) | `chore: ignore the code layout commits in git blame` |
