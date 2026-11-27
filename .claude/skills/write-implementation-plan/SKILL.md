---
name: write-implementation-plan
description: Use when a spec or a set of approved decisions must become a task-by-task implementation plan, before any code changes. Writes the plan so that a small model (for example DeepSeek V4.1 Flash) can execute each task alone, without decisions of its own.
---

# Write Implementation Plan

## Overview

The executor of the plan is a small model. It reads one task and the Global Constraints. It does not read the other tasks. It does not load skills by itself. It does not make good decisions where the plan leaves a choice. So the plan makes every design decision: names, files, interfaces, order, values and the rules that sort items.

The executor can find facts. It can read code, run commands, count results and fill tables. So the plan does not contain facts that the executor can find. Examples are line numbers, line counts, grep output and the list of call sites. To write such facts, you must do the work of the task yourself. That costs tokens two times, and the facts become wrong when an earlier task changes the files.

Do not run a task to learn its output before you give the task to the executor. The STOP conditions and the review of the task report catch errors in the plan.

This skill keeps the structure of the superpowers `writing-plans` skill (see `UPSTREAM.md`): DRY, YAGNI, TDD, small tasks, exact files, exact interfaces and exact commands. It adds the rules in [Small-model rules](#small-model-rules).

Write the plan in English. Apply `asd-ste100` in strict mode (`.agents/skills/asd-ste100/SKILL.md`). Run the linter on each file of the plan before you finish:

```bash
python -I .agents/skills/asd-ste100/scripts/ste-lint.py <plan-folder>/*.md
```

## Where the plan goes

A plan is a folder, not one file. Create the folder at this path:

```text
docs/build/<workstream>/<topic>/plan/
```

`<workstream>` tells which kind of change the plan makes. Use one value from this table:

| Workstream | The plan changes | User-visible behavior |
| --- | --- | --- |
| `feature` | Product code, to add or extend behavior that a use case in `docs/UCs/` specifies | Changes |
| `fix` | Product code, to make it obey behavior that is already specified | Changes back to the specified behavior |
| `refactor` | Code structure, documents, rules or checks | Does not change |
| `ops` | Build, CI, packaging, release or the runtime environment | Does not change |

`<topic>` tells which part of the repository the plan changes. Use the rule for the workstream:

| Workstream | Topic rule | Topic values |
| --- | --- | --- |
| `feature` | The file name of the use case in `docs/UCs/`, without `.md` | For `docs/UCs/upload.md`, the topic is `upload` |
| `fix` | `issue-<number>` of the GitHub Issue | `issue-58` |
| `refactor` | One value from the next column | `rules`: conventions and the checks that enforce them. `boundaries`: source ownership, contracts, and dependency boundaries. `module-design`: internal module shape, code hygiene, testware alignment, and flow lookup maps. `docs`: structure of the documents in `docs/`. `UCs`: migration and structure of the use case files in `docs/UCs/`. `naming-and-grouping`: symbol names, one name for each concept, and the grouping of code inside the modules of `apps/host/src/` |
| `ops` | One value from the next column | `ci`: CI workflows. `release`: versions and packages. `runtime`: the runtime environment and its provisioning |

Get the workstream and the topic from the user request and from these tables. Ask the user before you write files in these cases:

- The change fits two workstreams. For example, the plan adds behavior and also changes CI.
- No table row gives the topic. For example, a `refactor` plan changes a part of the repository that `rules`, `boundaries`, `module-design` and `docs` do not include.
- A `feature` plan has no use case file in `docs/UCs/`.
- A `fix` plan has no GitHub Issue.

Do not add a new workstream or a new topic value without approval from the user. When the user approves a new value, add it to the tables in this skill. Do not create a plan in the repository root or in another folder.

When a plan with the same workstream and topic already exists, do not create a second folder. Add the new tasks to the existing plan as a new revision.

The folder contains these files:

| File | Content |
| --- | --- |
| `README.md` | The plan header, Decisions, Global Constraints, Review Focus, the Tasks table and Next revision. See [Plan README](#plan-readme). |
| `task-NN-<slug>.md` | One task. `NN` is the task number with two digits (`01`, `02`). `<slug>` is the task name in kebab-case. See [Task file](#task-file). |

Task reports go in the sibling folder `docs/build/<workstream>/<topic>/reports/`:

| File | Content |
| --- | --- |
| `README.md` | Index table of all task reports for the plan. |
| `task-NN-<slug>.md` | Execution report written after Task `NN` finishes. |

After you create the folder, add a link to `<topic>/plan/README.md` in `docs/build/README.md`. Each file in `docs/` must have a link from the nearest `README.md`.

## Before you write tasks

1. Read the spec or the decision record. The plan gets its requirements from it. Put its path in the plan README.
2. Find every open choice in the spec: "if X, use Y", "choose", "when stable", "TBD". Resolve each open choice before you write tasks:
   - When the user can decide, ask the user.
   - When a measurement can decide, write an investigation task. The task gives the measurement and the pass criteria, and it ends with STOP. Do not write the tasks that use the result. Write them in a later revision of the plan.
3. Map the files. List each file that the plan creates or changes, and its one responsibility. Follow the patterns of the existing codebase.
4. Read the repository rules: `AGENTS.md`, `docs/conventions/` and `LESSONS.md`. Copy the rules that the executor needs into Global Constraints. The executor does not read `AGENTS.md` by itself.

## Small-model rules

Every task must obey all eleven rules.

1. **Self-contained.** The task and Global Constraints contain all the information that the executor needs. Do not write "as in Task 2" or "see above". Repeat the exact name, path or value. The [Task protocol](#plan-readme) in Global Constraints is part of each task, so do not repeat it in the task file.
2. **Read first.** Each task starts with a `Read first` block. The block lists the files to read, as paths from the repository root. For a long file, name the symbol or the heading to read (for example "the function `createRuntimeLayer`"). Do not give line ranges. Include each skill that the task needs (see [Skill map](#skill-map)).
3. **Exact files and interfaces.** Give the exact path of each file to create or change. For a change, name the symbol or the section that changes. Give the exact signature of each function and the exact name of each export that the task produces or uses.
4. **No open choices.** A task does not contain "choose", "decide", "appropriate", "as needed" or "handle edge cases". A task does not contain a condition that selects between two designs. If a step needs a decision, make the decision in the plan, or move the decision to an investigation task that ends with STOP.
5. **Tests as code.** A test step contains the complete test code with the exact values. A code step contains the signature and the values. Write a function body only for an algorithm that the signature and the tests do not determine.
6. **Exact commands, criteria as Expected.** Each verification step gives the exact command for Git Bash on Windows, from the repository root. `Expected` is a criterion that you can write without running the command. Use one of these criteria:
   - an exit code, or a fixed marker such as `# fail 0`.
   - "no line", for a search that must find nothing.
   - a pattern that each line must match, for example "each line starts with `apps/host/src/modules/`".
   - a count or a value that an earlier task or a decision in the plan fixed.

   Do not copy command output into `Expected`. Do not put line numbers, line counts or lists of search results into `Expected`, unless an earlier task or a decision fixed them.
7. **STOP conditions.** The default STOP conditions are in the Task protocol. A task lists only the STOP conditions that are special to the task.
8. **Forbidden list.** The default forbidden actions are in the Task protocol. A task lists only the forbidden actions that are special to the task.
9. **Decision tables for judgment.** When a task needs judgment (for example, to sort comments or to rename symbols), give a decision table: `Signal | Action`. Each row has one signal that the executor can see in the file, and one action. The last row is always: `No row matches | Add the item to the report. Do not change it.`
10. **Fixed report file.** Each task ends with the step `Write the report file and stop`. The Task protocol gives the contents of that step. The task is complete only when each command in the report has the expected output and the report file exists.
11. **Size.** A task file has a maximum of approximately 150 lines. When a task is longer, first remove the facts that the executor can find. If the task is still longer, divide it into two tasks.

## Task types

Each task has one type. The type tells what the plan gives and what the executor finds.

| Type | The plan gives | The plan does not give |
| --- | --- | --- |
| Code | Signatures, the complete test code, the commands | Function bodies, except for an algorithm that the signature and the tests do not determine |
| Move or rename | The mapping from the old path or name to the new one, and the checks that no old path or name stays | The list of each import site or each use |
| Diagnosis | The questions, the columns of each report table, the places to search, the commands, and decision tables to sort the items | The answers, line numbers, line counts and search results |
| Investigation | The measurement, the pass criteria and STOP | The result of the measurement |

A diagnosis task records facts before a later revision of the plan makes decisions. Its value comes from the facts that the executor finds. If you already know the facts, you do not need the diagnosis task.

## Skill map

Add a skill to `Read first` when the task matches the condition.

| Condition | Skill file |
| --- | --- |
| The task writes or changes code | `.agents/skills/tdd/SKILL.md` |
| The task changes a module boundary or a public interface | `.agents/skills/codebase-design/SKILL.md` |
| The task writes English text that an agent or a tool reads (skill, lint message, error message) | `.agents/skills/asd-ste100/SKILL.md` |
| The task writes Vietnamese text that an agent reads (`docs/conventions/`, `AGENTS.md`) | `.agents/skills/ste-vi/SKILL.md` |
| The task writes or changes a file in `docs/` | `docs/conventions/docs.md` |
| The task writes a Mermaid diagram in Markdown | `.agents/skills/mermaid-markdown/SKILL.md` |

## Plan README

The `README.md` of the plan folder has this structure:

```markdown
# <Feature Name> Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of <feature>.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, mark the task `Done` in this file and write the task report file in `../reports/`. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** <one sentence>

**Approach:** <two or three sentences>

**Tech stack:** <key tools and versions>

**Spec:** <path to the spec or decision record>

## Decisions

<A table `Topic | Decision` with each decision that the tasks use. Add other sections (for example a scope table) when more than one task uses the same rule.>

## Global Constraints

<One line for each project rule that every task must obey, with exact values: shell, Node version, package manager, language of text, forbidden actions for all tasks.>

### Task protocol

Each task obeys this protocol. A task file adds only its special conditions and actions.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in the task.
- The task needs a decision that the task does not contain.
- The same step failed two times.

**Forbidden:**

- Change a file that is not in the `Files` block of the task.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

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
4. Mark this step as `- [x]`, stop, and send the report summary.

## Review Focus

<The five inputs or failure modes that the spec implies, that no test covers yet, and that most probably cause a defect. One line each. Each line names the test and links to the task file that owns the test.>

## Tasks

| Task | Status | File |
| --- | --- | --- |
| 1 | Pending | [<Component name>](task-01-<slug>.md) |

## Next revision

<The tasks that wait for the result of an investigation task. One line each. Leave out this section when no task waits.>
```

## Task file

Each task is one file `task-NN-<slug>.md`. The executor reads only this file and Global Constraints in `README.md`. A task file does not link to another task file. When a task uses a name from an earlier task, write the name again in the `Interfaces` block.

````markdown
# Task N: <Component name>

Read this file to learn the steps of Task N, which <one verb phrase>.

**Type:** <Code | Move or rename | Diagnosis | Investigation>

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `<path>` (the function `<name>`)
- `.agents/skills/<skill>/SKILL.md`

**Files:**
- Create: `<exact/path>`
- Change: `<exact/path>` (the function `<name>`)
- Test: `<exact/path>`

**Interfaces:**
- Uses: <exact names and signatures from earlier tasks>
- Produces: <exact names and signatures that later tasks use>

**STOP when:** <only the conditions for this task, or `Task protocol only`>

**Forbidden:** <only the actions for this task, or `Task protocol only`>

- [ ] **Step 1: Write the failing test**

```js
<complete test code>
```

- [ ] **Step 2: Run the test and make sure that it fails**

Run: `node --test <path>`
Expected: FAIL. The output contains `<exact text>`.

- [ ] **Step 3: Implement `<signature>` in `<path>`**

<one line about the approach, only when the signature and the test leave a choice>

- [ ] **Step 4: Run the test and make sure that it passes**

Run: `node --test <path>`
Expected: PASS. The output contains `# fail 0`.

- [ ] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
````

A diagnosis task replaces Steps 1 to 4 with steps of this shape:

````markdown
- [ ] **Step 2: Record the callers of `<name>`**

Run: `git grep -n -E "<pattern>" -- <paths>`

Expected: PASS. Exit code 0 and one or more lines. FAIL: no line.

Read each line and the declaration of the receiver. Write the table `Callers` with the columns `<A> | <B> | <C>`. Use this table for `<C>`:

| Signal | <C> |
| --- | --- |
| <signal that the executor can see> | <value> |
| No row matches | Write `unknown` and add the line to `Open items` in the report. |
````

## Self-review

After you write the complete plan, do these checks:

1. **Spec coverage.** For each requirement in the spec, find the task that implements it. Add a task for each gap.
2. **Open choices.** Search the plan for `choose`, `decide`, `appropriate`, `as needed`, `TBD` and `handle`. Each match must be a decision that the plan already made, or a STOP condition.
3. **Self-contained tasks.** Read each task file alone. Each name, path and value that the task uses must be in the task file or in Global Constraints. A task file has no link to another task file.
4. **Name consistency.** A name in a later task must be the same as the name that an earlier task produces.
5. **Review Focus.** Each line has a test in the task that owns the code.
6. **Proportion.** If code blocks are most of the plan, replace function bodies with signatures and tests.
7. **Facts and size.** Search each task for line numbers, line ranges and copied command output. Each match must be a value that an earlier task or a decision fixed. Each task file has a maximum of approximately 150 lines (rule 11).
8. **Language.** The linter command in [Overview](#overview) exits with code 0.
9. **Location.** The plan is in `docs/build/<workstream>/<topic>/plan/`. The Tasks table links each task file. `docs/build/README.md` links the plan README.
10. **Task protocol.** The plan README has the section `Task protocol`. Each task has a `Type` line and ends with the step `Write the report file and stop`.

Fix each problem in the plan. Then give the user the path of the plan and ask the user to review it.
