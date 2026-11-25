# Task 3: Diagnose the run owner

Read this file to learn the steps of Task 3, which records each use of `sessionId` in the request lifecycle and then stops.

The target contract replaces `sessionId` with an owner that has a type and an ID. For example, the owner is a chat or a design system. The rule "one active request for each chat" moves to the chats module. This task collects the facts for that design. It does not design the contract.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `packages/host/api/src/lifecycle/contracts.ts` (46 lines)
- `packages/host/api/src/lifecycle/tool-contracts.ts` (42 lines)
- `packages/host/api/src/lifecycle/request-controller.ts` (397 lines)
- `apps/web/src/integrations/opencode/contracts.ts` (32 lines)
- `apps/web/src/integrations/opencode/runtime.ts` (294 lines)
- `apps/web/src/integrations/opencode/events.ts` (115 lines)
- `apps/web/src/integrations/opencode/stream-tracker.ts` (219 lines)
- `apps/web/src/features/requests/prepare-runtime.ts` (75 lines)
- `packages/host/contracts/src/requests.ts` (145 lines)
- `packages/session/persistence/src/schema.ts` (160 lines)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-03-diagnose-run-owner.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-03-diagnose-run-owner.md`

**Interfaces:**

- Uses: `RequestRun.sessionId`, `ToolContext.sessionId`, `RequestController` in `packages/host/api/src/lifecycle/`, and the OpenCode event field `sessionId` in `apps/web/src/integrations/opencode/events.ts`.
- Produces: a report with one row for each `sessionId` site, with IDs `RO1`, `RO2`, and so on, and one class from the [Site decision table](#site-decision-table) for each row.

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

## Site decision table

Apply the rows from top to bottom to each `sessionId` site. Use the first row that matches.

| Signal | Action |
| --- | --- |
| The site is a field or a parameter in a type or an interface declaration | Class `contract-field`. Record the type name. |
| The site reads `sessionId` from an OpenCode event or writes the OpenCode native session ID | Class `runtime-native`. This `sessionId` is the OpenCode session, not the chat. Record the event type. |
| The site uses `sessionId` to find, admit, queue or reject a request because another request of the same chat is active | Class `chat-rule`. Record the error code that the site returns, for example `SESSION_BUSY` or `REQUEST_ACTIVE`. |
| The site uses `sessionId` as a key to read or write a request, an event, an approval or a binding record | Class `owner-key`. Record the store method that the site calls. |
| The site uses `sessionId` to read or write deck, brief, outline or generation state | Class `deck-scope`. Record the deck method that the site calls. |
| The site only passes `sessionId` to another function or object | Class `pass-through`. Record the callee. |
| No row matches | Class `unclassified`. Add the item to the report. Do not change it. |

- [ ] **Step 1: Count the `sessionId` sites**

Run: `grep -rnw sessionId packages/host/api/src/lifecycle | wc -l && grep -rnw sessionId apps/web/src/integrations/opencode | wc -l && grep -rnw sessionId packages/host/contracts/src/requests.ts | wc -l && grep -rnw sessionId apps/web/src/features/requests | wc -l`

Expected: PASS. The output is four lines: `25`, `21`, `3` and `2`. FAIL: any other number.

- [ ] **Step 2: List and classify each site**

Run: `grep -rnw sessionId packages/host/api/src/lifecycle apps/web/src/integrations/opencode packages/host/contracts/src/requests.ts apps/web/src/features/requests`

Expected: PASS. The output has 51 lines. Each line has the form `<path>:<line>:<text>`.

For each of the 51 lines, read the code around the line and apply the [Site decision table](#site-decision-table). Write one row in the report table `ID | Location (file:line) | Class | Record`.

- [ ] **Step 3: Record the storage and wire facts**

Run: `grep -n "session_id\|CREATE TABLE" packages/session/persistence/src/schema.ts`

Expected: PASS. The command exits with code 0.

Record these facts in the report, with file and line:

1. Each table in `packages/session/persistence/src/schema.ts` that has a `session_id` column, and whether the column has a `REFERENCES` clause.
2. Each wire type in `packages/host/contracts/src/requests.ts` that has a `sessionId` field. The HTTP contract keeps these fields in Phase 1.
3. The public methods of `RequestController` in `packages/host/api/src/lifecycle/request-controller.ts`, with the parameters of each method.
4. The line in `request-controller.ts` that enforces one active request for each chat, and the error code that it returns. When no line enforces this rule, write `Not found` and the search that you did.

- [ ] **Step 4: Check that no code changed**

Run: `git status --short`

Expected: PASS. No path under `apps/`, `packages/`, `e2e/`, `tests/`, `scripts/` or `docs/conventions/` is in the output.

- [ ] **Step 5: Write the report file and stop**

1. Mark Steps 1 to 4 as `- [x]` in this file. Change the Task 3 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-03-diagnose-run-owner.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-03-diagnose-run-owner.md` with:
   - H1 `# Task 3: Diagnose the run owner report` and the purpose line `Read this file to learn where the request lifecycle and the OpenCode adapter use sessionId, and which use is a chat rule.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - The site table from Step 2, with 51 rows.
   - A count of rows for each class.
   - The four facts from Step 3.
   - Items with class `unclassified`.
   - What the commands do not prove: `grep -w` finds the name `sessionId` only. It does not find a chat ID that the code passes under another name, for example `id` or `chatId`.
3. Add a row for Task 3 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Mark Step 5 as `- [x]`.

**STOP** and send the report summary. Do not start Task 4 until a person approves the site table.
