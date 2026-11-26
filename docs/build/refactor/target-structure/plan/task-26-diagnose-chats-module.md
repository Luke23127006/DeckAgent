# Task 26: Diagnose the chats module

Read this file to learn the steps of Task 26, which records the facts of the `chats` module before its move, and then stops.

The `chats` module is the second module of Phase 3. Its code is in five places:

- the folder `apps/host/src/features/chats/`.
- the chat part of the package `packages/session/persistence/`.
- the projection in `apps/host/src/web-state.ts`.
- the chat routes in `packages/host/api/src/transport/management-routes.ts` and `session-routes.ts`.
- the chat part of the error map in `apps/host/src/local-transport.ts`.

The package `packages/session/persistence/` also holds the store of requests and of attachments in the same database. The move adds a `version` for the topic `chats` with the key `workspaceId`. This task collects the facts that the design of the move needs. It changes no code and it does not design the move.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/project-structure.md` (sections `## Hình dạng module` and `## Trong lúc chuyển`)
- `docs/architecture/30-decisions.md` (sections `## ADR-001` and `## ADR-004`)
- `docs/architecture/10-agent-core.md` (section `## Aggregate và change notice`)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-26-diagnose-chats-module.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-26-diagnose-chats-module.md`

**Interfaces:**

- Uses: no code. The task reads the files below and runs `git grep`.
- Produces: the report tables `Module files`, `Store members`, `Callers`, `Calls into other stores`, `Write sites`, `List fields`, `Browser reads`, `Error map`, `Schema upgrade path` and `Tests`. Each table has the columns that its step gives.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- `git status --short` in Step 1 prints a line.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Propose a type, a file name, an SQL statement, a route or an owner for the move. This task records facts only.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line. FAIL: one or more lines. The plan files of Revision 3d must have a commit before this task starts.

Run: `git ls-files apps/host/src/modules`

Expected: PASS. Nine lines. Each line starts with `apps/host/src/modules/workspaces/`.

Run: `git grep -n "^| 25 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Record the module files**

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" apps/host/src/features/chats/index.ts packages/session/persistence/src/index.ts packages/session/persistence/src/schema.ts packages/session/persistence/src/message.ts packages/session/persistence/src/contracts.ts apps/host/src/web-state.ts`

Expected: PASS. Six lines, in this order: `83`, `357`, `160`, `142`, `185`, `137`.

Read each of the six files in full. Read these ranges also:

- `packages/host/api/src/transport/management-routes.ts`, lines 73 to 131 (the function `registerManagementRoutes`, up to the route `POST /api/sessions/search`).
- `packages/host/api/src/transport/session-routes.ts`, lines 179 to 186 (the route `GET /api/sessions/:sessionId/history`).
- `packages/host/api/src/index.ts`, lines 44 to 72 (the function `createHostRoutes` and the function `withActive`).
- `packages/host/api/src/transport/contracts.ts`, lines 101 to 129 (the interface `WebManagement`).
- `apps/host/src/local-transport.ts`, lines 17 to 22, 135 to 155 and 178 to 196.
- `packages/host/contracts/src/management.ts`, lines 43 to 63 (the interface `WebSession`).
- `apps/host/src/server.ts`, lines 189 to 203 and line 345.

Write the table `Module files` with the columns `File | Lines | Responsibility`. Add one row for each of the six files and one row for each of the seven ranges. In `Responsibility`, write one sentence about what the code does, from the code that you read. Do not write where the code goes after the move.

- [ ] **Step 3: Record the store members**

Read the class `SqliteSessionStore` in `packages/session/persistence/src/index.ts`, lines 35 to 357.

Write the table `Store members` with the columns `Member | Public | Tables read | Tables written | Inside this.transaction`. Add one row for each of these 16 members, in this order: `open`, `create`, `bind`, `getInfo`, `select`, `list`, `chats`, `search`, `ungroup`, `ungroupExcept`, `read`, `append`, `clearSelections`, `close`, `requests`, `attachments`.

- `Public` is `yes` for each of the 16 members.
- `Tables read` and `Tables written` are the SQL table names that the member and the private methods that it calls read or write. For `requests` and `attachments`, write `RequestLog` or `AttachmentLog` and the text `not read in this task`.
- `Inside this.transaction` is `yes` when each write of the member runs inside a function that `this.transaction(` receives, `no` when one write runs outside, and `no write` when the member writes no table.

Then read `packages/session/persistence/src/requests.ts`, lines 73 to 125 and 240 to 290. Add one row for `RequestLog.admit` and one row for the private method `RequestLog.settle`. In `Tables written`, include `messages` and `sessions` when the method calls `this.access.appendMessages`.

- [ ] **Step 4: Record the callers of the chat members**

Run: `git grep -n -E "(sessions|store)\.(open|create|bind|getInfo|select|list|chats|search|ungroup|ungroupExcept|read|append|clearSelections)\(" -- apps/host/src packages/host/api/src ':!apps/host/src/features/chats'`

Expected: PASS. 20 lines:

- `apps/host/src/features/attachments/attachment-coordinator.ts:79`
- `apps/host/src/features/deck/brief-coordinator.ts:18`
- `apps/host/src/features/deck/deck-workflow.ts:197`
- `apps/host/src/features/requests/prepare-runtime.ts:39`
- `apps/host/src/features/requests/prepare-runtime.ts:42`
- `apps/host/src/features/sources/source-tools.ts:159`
- `apps/host/src/features/sources/source-tools.ts:167`
- `apps/host/src/integrations/opencode/runtime.ts:164`
- `apps/host/src/integrations/opencode/runtime.ts:195`
- `apps/host/src/local-transport.ts:230`
- `apps/host/src/server.ts:196`
- `apps/host/src/server.ts:198`
- `apps/host/src/server.ts:199`
- `apps/host/src/server.ts:200`
- `apps/host/src/server.ts:244`
- `apps/host/src/server.ts:257`
- `apps/host/src/server.ts:335`
- `packages/host/api/src/lifecycle/request-controller.ts:240`
- `packages/host/api/src/lifecycle/request-controller.ts:285`
- `packages/host/api/src/lifecycle/request-controller.ts:354`

Run: `git grep -l "SqliteSessionStore" -- apps/host/src packages/host/api/src`

Expected: PASS. Twelve lines: nine files in `apps/host/src/features/` (`attachments/attachment-coordinator.ts`, `chats/index.ts`, `deck/brief-coordinator.ts`, `deck/confirmation-coordinator.ts`, `deck/deck-workflow.ts`, `deck/generation-workflow.ts`, `requests/prepare-runtime.ts`, `research/research-coordinator.ts`, `sources/source-tools.ts`), `apps/host/src/local-transport.ts`, `apps/host/src/server.ts` and `packages/host/api/src/contract-sync.ts`.

For each line of the first command, read the line and the declaration of the variable before the dot. Write the table `Callers` with the columns `Caller | Line | Member | Receiver type | Caller area`. `Member` is the method name after the dot. `Receiver type` is the declared type of the variable before the dot, for example `SqliteSessionStore`, `RequestStore` or `RuntimeSessionAccess`. Use this table for `Caller area`:

| Signal | Caller area |
| --- | --- |
| `Receiver type` is not `SqliteSessionStore` | `not a chat member` |
| The path starts with `apps/host/src/features/attachments/` | `attachments` |
| The path starts with `apps/host/src/features/deck/` | `deck` |
| The path starts with `apps/host/src/features/requests/` | `requests` |
| The path starts with `apps/host/src/features/sources/` | `sources` |
| The path starts with `apps/host/src/integrations/opencode/` | `opencode` |
| The path is `apps/host/src/local-transport.ts` | `error map and HTTP adapter` |
| The path is `apps/host/src/server.ts` | `composition root` |
| No row matches | Write `unknown` and add the line to the list `Open items` of the report. |

Use the rows of the decision table in order. The first row that matches gives the value.

Some files of the second command have no row in the table `Callers`. For each of these files, add its path to the list `Store holders without a chat member call` of the report.

- [ ] **Step 5: Record the calls into other stores**

Run: `git grep -n -E "\b(sessions|registry|web|decks|drafts)\.[a-zA-Z.]+\(" -- apps/host/src/features/chats`

Expected: PASS. 15 lines of `apps/host/src/features/chats/index.ts`: 31, 33, 34, 47, 48, 52, 60, 61, 62, 66, 67, 68, 71, 73 and 75.

Write the table `Calls into other stores` with the columns `Line | Call | Store | Function that makes the call`. Add one row for each call on each line. A line can have two calls. Use this table for `Store`:

| Signal | Store |
| --- | --- |
| The call starts with `sessions.requests.` | `RequestLog` |
| The call starts with `sessions.` | `SqliteSessionStore` |
| The call starts with `registry.` | `WorkspaceLookup` |
| The call starts with `web.` | `WebState` |
| The call starts with `decks.` | `DeckStore` |
| The call starts with `drafts.` | `MemoryDraftStore` |
| No row matches | Write `unknown` and add the line to the list `Open items` of the report. |

`Function that makes the call` is `createWorkspaceChats`, `project`, `chat`, or the member of `ChatOperations` (`create`, `selectModel`, `list` or `search`) that contains the line.

- [ ] **Step 6: Record the write sites**

Run: `git grep -n -E "\.run\(|exec\('(BEGIN|COMMIT|ROLLBACK)" -- packages/session/persistence/src/index.ts`

Expected: PASS. Twelve lines: 94, 118, 141, 199, 212, 251, 265, 268, 288, 291, 294 and 331.

Run: `git grep -n -E "(UPDATE|INSERT INTO|DELETE FROM) sessions" -- packages/session/persistence/src`

Expected: PASS. Nine lines: eight lines in `index.ts` (93, 117, 139, 199, 208, 249, 268 and 329) and one line in `schema.ts` (115).

Run: `git grep -n "appendMessages(" -- packages/session/persistence/src`

Expected: PASS. Three lines: `requests.ts:42`, `requests.ts:103` and `requests.ts:279`.

Write the table `Write sites` with the columns `Line | Public method | Table | Columns written | Inside this.transaction | HTTP route or caller`. Add one row for each `.run(` line of the first command. Do not add rows for lines 288, 291 and 294.

- `Public method` is the public method of `SqliteSessionStore` that contains the line, or that calls the private method that contains the line. For lines 265 and 268 (the private method `insertMessages`), write `append`, `RequestLog.admit` and `RequestLog.settle`.
- `Inside this.transaction` is `yes` when the line runs inside a function that `this.transaction(` receives. Otherwise it is `no`. For lines 265 and 268, write the value for each of the three callers.
- Use this table for `HTTP route or caller`:

| Public method | HTTP route or caller |
| --- | --- |
| `create` | `POST /api/sessions` |
| `select` | `PUT /api/sessions/:sessionId/selection` |
| `ungroup` | `DELETE /api/workspaces/:workspaceId` (through `WorkspaceChats.ungroup`) |
| `ungroupExcept` | Startup, `apps/host/src/server.ts:196` |
| `clearSelections` | `modelsRemoved` of `ProviderStore`, `apps/host/src/server.ts:244` |
| `open` or `bind` | Startup, `apps/host/src/server.ts:199` or `apps/host/src/server.ts:200`, and the callers of Step 4 |
| `append`, `RequestLog.admit` or `RequestLog.settle` | The request lifecycle. Write the callers that Step 4 found, or `not found by Step 4` |
| No row matches | Write `none` and add the line to the list `Open items` of the report. |

- [ ] **Step 7: Record the fields of the chat list**

Read `apps/host/src/web-state.ts`, the method `project`, `apps/host/src/features/chats/index.ts`, the function `project`, and `packages/host/api/src/index.ts`, the function `withActive`.

Write the table `List fields` with the columns `Field | Set by | Source store and column | Write sites that change it`. Add one row for each of the 13 fields of the interface `WebSession` in `packages/host/contracts/src/management.ts`, in the order of the interface.

- `Set by` is the function that writes the field into the object: `WebState.project`, the function `project` of `createChatOperations`, or `withActive`.
- `Source store and column` is the store and the SQL column or the in-memory value that gives the field, for example `SqliteSessionStore, sessions.updated_at` or `MemoryDraftStore, draft text`.
- `Write sites that change it` is the list of lines of the table `Write sites` that change the source. When the source is not in `SqliteSessionStore`, write the store method that changes it, from the code that you read, or `not in the lines read`.

- [ ] **Step 8: Record the Browser reads**

Run: `git grep -n -E "management\.(sessions|create|select|search)\(|client\.history\(" -- apps/web/src/browser`

Expected: PASS. Seven lines: `apps/web/src/browser/boot.ts:326`, and six lines in `apps/web/src/browser/chat-navigation.ts` (159, 170, 177, 217, 280 and 298).

Read 30 lines before each line of the output and 10 lines after each line of the output. Read also each caller of the function `refresh` in `apps/web/src/browser/chat-navigation.ts` and in `apps/web/src/browser/boot.ts`.

Write the table `Browser reads` with the columns `File | Line | Client method | HTTP route | Function that makes the call | Event that runs the function`. `Event` is the user action or the timer that you see in the code, for example a click handler, `focus` or `setInterval`. When the code that you read does not show the event, write `not in the lines read`.

- [ ] **Step 9: Record the error map and the schema upgrade path**

Write the table `Error map` with the columns `Error class | Code | HTTP status | File and line`. Add one row for each code of `chatStatus` in `apps/host/src/local-transport.ts`, lines 17 to 22, and one row for each `SessionError` code that `mapApplicationFailure` maps in lines 150 to 155. Add one row for each `HttpError` that `chatManagement` throws in lines 178 to 196.

Read `packages/session/persistence/src/schema.ts`, lines 81 to 160, and `packages/session/persistence/tests/chat-persistence.test.mjs`, lines 30 to 60.

Write the table `Schema upgrade path` with the columns `Condition on user_version and application_id | Action | File and line`. Write one row for each branch of the `if` and `else if` chain in `schema.ts`, and one row for each `if (version` line inside the upgrade branch. Add one row for the test in `chat-persistence.test.mjs` that opens a database with an old `user_version`. Its `Action` is the value that the test asserts.

- [ ] **Step 10: Record the tests**

Run: `git grep -l -E "api/sessions(['\`]|/search|/[^/]+/selection|.*/history)" -- e2e apps/host/tests apps/web/tests packages/host/api/tests`

Expected: PASS. Seven lines: `apps/host/tests/http-server.test.mjs`, `apps/host/tests/web-management.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/deck-pipeline.test.mjs`, `e2e/http-edge.test.mjs`, `e2e/local-web.test.mjs` and `e2e/opencode-live.test.mjs`.

Run: `git grep -n "^test(" -- packages/session/persistence/tests/chat-persistence.test.mjs packages/session/persistence/tests/session-persistence.test.mjs`

Expected: PASS. 13 lines: six lines in `chat-persistence.test.mjs` and seven lines in `session-persistence.test.mjs`.

Write the table `Tests` with the columns `File | Suite in package.json | Chat routes or store members that the file calls`. Add one row for each of the seven files of the first command. Add one row for each of the two files of the second command. To find the suite, run `git grep -n "<file path>" -- package.json` for each file. When the output has no line, write `no suite`.

- [ ] **Step 11: Write the report file and stop**

1. Mark Steps 1 to 10 as `- [x]` in this file. Change the Task 26 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and link `../reports/task-26-diagnose-chats-module.md`.
2. Create `docs/build/refactor/target-structure/reports/task-26-diagnose-chats-module.md` with:
   - The H1 `# Task 26: Diagnose the chats module report` and the purpose line `Read this file to learn the code, the store members, the callers, the write sites, the list fields and the tests of the chats module before its move.`
   - Files changed.
   - Commands run, with the exit code and the key output of each command.
   - The ten tables of Steps 2 to 10.
   - The list `Store holders without a chat member call` of Step 4.
   - The list `Open items`, with each line that a decision table sent to the report. Write `None` when the list is empty.
   - What the commands do not prove. Include at least these two items. Step 4 does not find a caller that uses a variable with another name than `sessions` or `store`. Step 7 does not find a field of the chat list that the Browser computes by itself.
3. Add a row for Task 26 in `docs/build/refactor/target-structure/reports/README.md`.
4. Run `corepack pnpm@11.28.5 check:docs`. Expected: PASS. The output contains `0 error(s)`.
5. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-26-diagnose-chats-module.md`. When `python` is not available, run the same script with `python3` or `python3.12`. Expected: PASS. The output contains `0 violations`.
6. Mark Step 11 as `- [x]`, stop, and send the report summary.
