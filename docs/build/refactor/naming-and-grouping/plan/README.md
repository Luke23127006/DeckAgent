# Naming and Grouping Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of the Naming and Grouping Refactor.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, mark the task `Done` in this file and write the task report file in `../reports/`. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Phase 1 writes the naming rules into the conventions and adds the checks that enforce them.

**Approach:** One revision for each phase of the Naming and Grouping Refactor. The planner did the diagnosis of the phase, and the decisions below record the answers. Each task is an execution task.

**Tech stack:** Node.js 22.19.0, pnpm 11.28.5 through `corepack pnpm@11.28.5`, TypeScript 6.0.3, `node:test`, oxlint 1.94.0.

**Spec:** [Naming and Grouping Refactor](../README.md), [Naming Rules](../naming-rules.md), [Module Map](../module-map.md).

## Revision 1: Phase 1, conventions and checks

### Decisions

| Topic | Decision |
| --- | --- |
| Place of the table of code names for technical concepts | The section `Naming` of `docs/conventions/code.md`, because the table is a naming rule for code |
| Form of the role file rule | The rule checks the prefix and the suffix of the main export. `*.service.ts` exports a class `<Name>Service`. `*.store.ts` exports a class `Sqlite<Name>Store`, `Memory<Name>Store` or `<Name>FileStore`. `*.routes.ts` exports a function `create<Name>Routes`. `*.errors.ts` exports a class `<Name>Error` and a function `map<Name>Error`. In the same modules, a class with the suffix `Service` or `Store` outside its role file is a violation. The rule does not check the singular noun, because a check of the noun needs a copy of the module names. Review checks the noun |
| Modules that the role file rule checks | The constant `ROLE_FILE_MODULES` in `scripts/check-boundaries.mjs`, with the value `[]`. The snapshot field `roleFileModules` replaces the constant in tests. Each later phase adds its module name to the constant |
| Rule IDs | `typescript-enum` and `role-file-symbol` |
| Files that `typescript-enum` checks | Every file that `check:boundaries` reads: production files and test files in `apps/`, `packages/`, `tests/` and `e2e/` |
| oxlint | Add `"oxc/no-const-enum": "error"` to the top-level `rules` of `.oxlintrc.json` |
| Language of the conventions | Vietnamese, with the skill `ste-vi` in light mode |
| Carried item of the Target Structure Refactor | Change the row "Phase 3: remove non-`as const` type assertions, audit comments, rename `*Service` symbols". The rename follows the role file table in the Coding Guidelines. The Naming and Grouping Refactor does the rename for `apps/host/` |
| Out of Phase 1 | Owners of the root files of `apps/host/src/`, names for `SessionDatabase` and `SessionError`, and any change to production code. Phase 7 decides the owners and the names |

### Global Constraints

- Shell: Git Bash on Windows. Run each command from the repository root `C:\Users\Duy\Desktop\DeckAgent`.
- Package manager: `corepack pnpm@11.28.5`. Do not call `pnpm` directly.
- Documents in `docs/conventions/` are in Vietnamese. Documents in `docs/build/` are in English. Keep technical terms in English.
- A message of a check is English text that an agent reads. Write it in Simplified Technical English: short sentences, active voice, and a sentence that tells the fix.
- Do not change production code in `apps/` or `packages/`.

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

### Review Focus

- `typescript-enum` misses a `const enum`, or reports an enum in a file that `check:boundaries` does not read. Test: `checkBoundaries rejects an enum and a const enum in source and test files` in [Task 2](task-02-add-enum-and-role-file-checks.md).
- `role-file-symbol` reports a module that is not in the list, so that `check:boundaries` fails on the current code. Test: `checkBoundaries accepts role symbols in a listed module and ignores modules outside the list` in [Task 2](task-02-add-enum-and-role-file-checks.md).
- `role-file-symbol` accepts a `*Service` class in a file that is not a service file. Test: `checkBoundaries rejects role files without their role symbols in a listed module` in [Task 2](task-02-add-enum-and-role-file-checks.md).
- The conventions name a check that does not exist, or say that a rule is enforced when only review enforces it. Owner: [Task 1](task-01-write-naming-rules-into-conventions.md), Step 5.
- The Coding Guidelines and the Project Structure give two different shapes for a module. Owner: [Task 1](task-01-write-naming-rules-into-conventions.md), Step 5.

### Tasks

| Task | Status | File |
| --- | --- | --- |
| 1 | Done | [Write the naming rules into the conventions](task-01-write-naming-rules-into-conventions.md) ([report](../reports/task-01-write-naming-rules-into-conventions.md)) |
| 2 | Done | [Add the enum check and the role file check](task-02-add-enum-and-role-file-checks.md) ([report](../reports/task-02-add-enum-and-role-file-checks.md)) |
