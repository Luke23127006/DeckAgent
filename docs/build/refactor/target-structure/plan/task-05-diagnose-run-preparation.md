# Task 5: Diagnose run preparation

Read this file to learn the steps of Task 5, which records where the code builds the parts of a run and then stops.

In the target layout, each module registers a contribution (instructions, tools, skills, resources) at the composition root, and `runs/preparation/` collects the contributions for one run. Today these parts are in many files. This task collects the facts for the contribution contract. It does not design the contract.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `packages/host/api/src/lifecycle/contracts.ts` (46 lines)
- `packages/host/api/src/lifecycle/tool-contracts.ts` (42 lines)
- `apps/web/src/features/requests/prepare-runtime.ts` (75 lines)
- `apps/web/src/features/deck/deck-prompts.ts` (385 lines)
- `apps/web/src/features/deck/generation-prompts.ts` (127 lines)
- `apps/web/src/features/deck/generation-execution.ts` (54 lines)
- `apps/web/src/features/deck/generation-workflow.ts` (59 lines)
- `apps/web/src/features/deck/deck-workflow.ts` (252 lines)
- `apps/web/src/features/deck/deck-tool-session.ts` (358 lines)
- `apps/web/src/features/deck/generation-tools.ts` (371 lines)
- `apps/web/src/features/sources/source-tools.ts` (394 lines)
- `apps/web/src/integrations/opencode/runtime.ts` (294 lines)
- `apps/web/src/integrations/opencode/config.ts` (176 lines)
- `apps/web/src/integrations/opencode/mcp-bridge.ts` (178 lines)
- `apps/web/src/integrations/opencode/resources.ts` (45 lines)
- `apps/web/src/index.ts` (391 lines)
- `packages/host/api/src/transport/request-routes.ts` (105 lines)
- `packages/host/api/src/transport/session-routes.ts` (158 lines)
- `packages/host/api/src/lifecycle/request-controller.ts` (397 lines)
- `apps/web/src/features/deck/confirmation-coordinator.ts` (137 lines)
- `apps/web/src/integrations/opencode/history.ts` (39 lines)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-05-diagnose-run-preparation.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-05-diagnose-run-preparation.md`

**Interfaces:**

- Uses: the fields of `RequestRun` (`presentation`, `generation`, `instructions`, `tools`, `onApprovalWait`) in `packages/host/api/src/lifecycle/contracts.ts`.
- Uses: the fields of `PreparedRequest` (`publicResearch`, `selection`, `start`) in the same file.
- Uses: `PreparedTools` and `RequestTools` in `packages/host/api/src/lifecycle/tool-contracts.ts`.
- Uses: `createRequestRuntime` in `apps/web/src/features/requests/prepare-runtime.ts`.
- Produces: a report with one row for each place that builds a part of a run, with IDs `RP1`, `RP2`, and so on. Each row has a kind and an owner from the [Part decision table](#part-decision-table).

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in `Read first` is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- `git status --short` shows a change outside the four files in `Files`.

**Forbidden:**

- Change a file that is not in the `Files` block. This task does not change code.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Propose a type shape, an interface or a file name for the new contract.

## Part decision table

Apply the rows from top to bottom to each place that builds a part of a run. Use the first row that matches. Write the kind and the owner. The owner is the folder under `apps/web/src/features/`, `apps/web/src/integrations/` or `packages/host/api/src/` that contains the code. For code in `apps/web/src/index.ts`, the owner is `composition-root`.

A type declaration is not a row, because it builds nothing. This applies to `contracts.ts`, `tool-contracts.ts` and `transport/contracts.ts`.

| Signal | Action |
| --- | --- |
| The code builds a string that becomes `RequestRun.instructions` or a system prompt | Kind `instructions`. |
| The code builds text that the model reads as user input, and the text is not `RequestRun.instructions`. For example, the quote of earlier messages in `seedPrompt`. | Kind `prompt-input`. |
| The code builds `ToolSchema` values, a tool manifest or a tool `context` string, or the `execute` function of `PreparedTools` | Kind `tools`. |
| The code builds a `GenerationCapability`, a `GenerationGrant` or the `publicResearch` value | Kind `grant`. |
| The code selects or freezes the model, the provider settings or the chat settings at admission | Kind `settings`. |
| The code writes OpenCode config, agent files or MCP bridge settings for one run | Kind `runtime-config`. |
| The code checks or locates the OpenCode binary or a package resource, and does not depend on the run | Kind `install`. This kind is not a run contribution. |
| The code passes a part from one object to another without a change | Kind `pass-through`. |
| No row matches | Kind `unclassified`. Add the item to the report. Do not change it. |

- [x] **Step 1: Find the files that use the run parts**

Run: `git ls-files 'apps/web/src/**/*.ts' 'apps/web/src/*.ts' 'packages/host/api/src/**/*.ts' | grep -v '^apps/web/src/browser/' | xargs grep -lwE "instructions|PreparedTools|RequestTools|GenerationCapability|GenerationGrant|publicResearch" | wc -l`

Expected: PASS. The output is `18`. FAIL: any other number.

Run: `git ls-files 'apps/web/src/**/*.ts' 'apps/web/src/*.ts' 'packages/host/api/src/**/*.ts' | grep -v '^apps/web/src/browser/' | xargs grep -nwE "instructions|PreparedTools|RequestTools|GenerationCapability|GenerationGrant|publicResearch"`

Expected: PASS. The command exits with code 0. Each line has the form `<path>:<line>:<text>`.

- [x] **Step 2: Classify each place that builds a part**

Read the lines from the second command of Step 1, and read `prepare-runtime.ts` and `resources.ts` in full. For each place that builds a part of a run, apply the [Part decision table](#part-decision-table). Write one row in the report table `ID | Location (file:lines) | Kind | Owner | Inputs | Consumer`. `Inputs` are the values that the code reads, for example `deck snapshot` or `selected sources`. `Consumer` is the function or the object that receives the part.

- [x] **Step 3: Record the order of preparation**

Record these facts in the report, with file and line:

1. The call order from the HTTP request route to `PreparedRequest.start(run)`, as a numbered list of functions with file and line.
2. The place in `apps/web/src/index.ts` that connects `createRequestRuntime`, the deck workflow and the source tools.
3. For each feature folder that adds a part (for example `features/deck/` and `features/sources/`), the condition that decides whether the part is in the run. For example: the chat has a deck that the user accepted.
4. Each part that the OpenCode adapter converts to an OpenCode format, and the function that converts it.

- [x] **Step 4: Check that no code changed**

Run: `git status --short`

Expected: PASS. No path under `apps/`, `packages/`, `e2e/`, `tests/`, `scripts/` or `docs/conventions/` is in the output.

- [x] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file. Change the Task 5 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-05-diagnose-run-preparation.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-05-diagnose-run-preparation.md` with:
   - H1 `# Task 5: Diagnose run preparation report` and the purpose line `Read this file to learn where the code builds the instructions, the tools, the resources and the grants of a run.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - The part table from Step 2.
   - A count of rows for each kind and for each owner.
   - The four facts from Step 3.
   - Items with kind `unclassified`.
   - The fact that the current code has no skill. The command is `grep -rniE "skill" apps/web/src packages --include=*.ts -l`, and it prints no line. State the result in the report.
   - What the commands do not prove: the search finds parts by name only. A part that the code builds under another name is in the report only when Step 2 found it by reading.
3. Add a row for Task 5 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-05-diagnose-run-preparation.md`. Expected: PASS. The output shows 0 hard violations. FAIL: fix the text and run the command again.
5. Mark Step 5 as `- [x]`.

**STOP** and send the report summary. Do not start Task 6 until a person approves the part table.
