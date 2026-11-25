# Task 4: Diagnose the AgentRuntime port

Read this file to learn the steps of Task 4, which records the facts of the current runtime contract and then stops.

The target `AgentRuntime` port has three parts: run events, resource usage (tokens and model calls), and failure codes in categories (key rejected, quota, network, timeout). This task collects the facts for that design. It does not design the port.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `packages/host/api/src/lifecycle/contracts.ts` (46 lines)
- `packages/host/api/src/lifecycle/request-failure.ts` (6 lines)
- `packages/host/api/src/lifecycle/request-controller.ts` (397 lines)
- `packages/host/contracts/src/requests.ts` (lines 60-90)
- `apps/web/src/integrations/opencode/events.ts` (115 lines)
- `apps/web/src/integrations/opencode/runtime.ts` (294 lines)
- `apps/web/src/integrations/opencode/stream-tracker.ts` (219 lines)
- `apps/web/tests/fixtures/fake-opencode.mjs` (lines 500-520)
- `docs/open-questions.md` (rows OQ-062, OQ-063 and OQ-069)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-04-diagnose-agent-runtime-port.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-04-diagnose-agent-runtime-port.md`

**Interfaces:**

- Uses: `RuntimeEvent`, `PreparedRequest`, `RequestRun`, `RuntimeOutcome` and `RequestRuntime` in `packages/host/api/src/lifecycle/contracts.ts`.
- Uses: `RequestEventBody` in `packages/host/contracts/src/requests.ts`.
- Uses: `OpenCodeEvent`, `parseEvent` and `errorCode` in `apps/web/src/integrations/opencode/events.ts`.
- Produces: a report with one row for each code literal, with IDs `RT1`, `RT2`, and so on. Each row has an origin and a group from the [Code decision table](#code-decision-table).

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
- Propose a type shape, an interface or a file name for the new port.
- Run a live test (`test:opencode-live`, `test:research-live`).

## Code decision table

Apply the rows from top to bottom to each code literal. Use the first row that matches. Write the origin and the group.

| Signal | Action |
| --- | --- |
| The function `errorCode` in `events.ts` returns the literal | Origin `provider-event`. Group: write the condition in `errorCode` that returns it, for example `statusCode 429`. |
| `runtime.ts` or `stream-tracker.ts` returns the literal in a `{ status: 'failed', errorCode }` outcome | Origin `adapter`. Group: write the condition that causes it, for example `timer expired` or `executable missing`. |
| `request-controller.ts` uses the literal in a `RequestFailure`, an `HttpError` or a status event | Origin `lifecycle`. Group: write the operation that rejects, for example `admit` or `approve`. |
| The literal is a notice code in a `{ kind: 'notice' }` event | Origin `notice`. Group: write the event that the adapter emits. |
| The literal is in one of the four files, but it is not a failure code or a notice code | Origin `other`. Group: write what the literal is. |
| No row matches | Origin `unclassified`. Add the item to the report. Do not change it. |

- [ ] **Step 1: List the code literals**

Run: `grep -rhoE "'[A-Z][A-Z_]{3,}'" apps/web/src/integrations/opencode/runtime.ts apps/web/src/integrations/opencode/stream-tracker.ts apps/web/src/integrations/opencode/events.ts packages/host/api/src/lifecycle/request-controller.ts | sort -u | wc -l`

Expected: PASS. The output is `40`. FAIL: any other number.

Run: `grep -rnoE "'[A-Z][A-Z_]{3,}'" apps/web/src/integrations/opencode/runtime.ts apps/web/src/integrations/opencode/stream-tracker.ts apps/web/src/integrations/opencode/events.ts packages/host/api/src/lifecycle/request-controller.ts`

Expected: PASS. The command exits with code 0. Each line has the form `<path>:<line>:'<CODE>'`.

- [ ] **Step 2: Classify each code literal**

For each of the 40 literals, read the lines from the second command of Step 1 and apply the [Code decision table](#code-decision-table). Write one row in the report table `ID | Code | Location (file:line) | Origin | Group`. When a literal is in more than one file, write all locations in one row.

Then write, for each row with origin `provider-event` or `adapter`, which of these OQ-063 categories it can match: `key rejected`, `quota`, `rate limit`, `network`, `timeout`, `content blocked`, `none`. Use `none` when the code condition does not show the category. Do not guess from the code name.

- [ ] **Step 3: Record the event and usage facts**

Run: `grep -n "tokens" apps/web/tests/fixtures/fake-opencode.mjs && grep -n "case '" apps/web/src/integrations/opencode/events.ts && grep -n "timeoutMs" apps/web/src/integrations/opencode/runtime.ts apps/web/src/integrations/opencode/stream-tracker.ts`

Expected: PASS. The first command prints line `519` with `tokens: { input: 10, output: 5 }`. The second command prints 5 lines. The third command prints at least 3 lines.

Record these facts in the report, with file and line:

1. Each member of `RuntimeEvent` (the `RequestEventBody` kinds without `status` and `approval`), and the place in `stream-tracker.ts` or `runtime.ts` that emits each kind.
2. Each OpenCode event type that `parseEvent` reads, and the raw fields that `parseEvent` drops. State whether the raw `step_finish` part in `fake-opencode.mjs` line 519 has a `tokens` field and whether `parseEvent` keeps it.
3. Each field of `RuntimeOutcome`. State whether any field carries usage data.
4. The default timeout value in `runtime.ts`, the option that changes it, and the code that a timeout returns.
5. The place where `RequestController` turns a `RuntimeOutcome` into a terminal status event.

- [ ] **Step 4: Check that no code changed**

Run: `git status --short`

Expected: PASS. No path under `apps/`, `packages/`, `e2e/`, `tests/`, `scripts/` or `docs/conventions/` is in the output.

- [ ] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file. Change the Task 4 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-04-diagnose-agent-runtime-port.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-04-diagnose-agent-runtime-port.md` with:
   - H1 `# Task 4: Diagnose the AgentRuntime port report` and the purpose line `Read this file to learn which events, failure codes, usage data and timeout the current runtime contract has.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - The code table from Step 2, with 40 rows and the OQ-063 category column.
   - A count of rows for each origin.
   - The five facts from Step 3.
   - Items with origin `unclassified`.
   - What the commands do not prove: the fake OpenCode fixture is not the real OpenCode 1.19.5 output. The report does not prove that real `step_finish` events carry `tokens`. No live test ran.
3. Add a row for Task 4 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Mark Step 5 as `- [x]`.

**STOP** and send the report summary. Do not start Task 5 until a person approves the code table.
