# Task 20: Diagnose the workspaces module

Read this file to learn the steps of Task 20, which records the facts of the `workspaces` module before its move, and then stops.

The `workspaces` module is the first module of Phase 3. Its code is in four places: the package `packages/workspace/registry/`, the folder `apps/host/src/features/workspaces/`, the routes in `packages/host/api/src/transport/management-routes.ts` and the error map in `apps/host/src/local-transport.ts`. The move adds a `version`, a change notice and a schema upgrade. This task collects the facts that the design of the move needs. It changes no code and it does not design the move.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/project-structure.md` (sections `## Hình dạng module` and `## Trong lúc chuyển`)
- `docs/architecture/30-decisions.md` (section `## ADR-004: Mỗi aggregate người dùng thấy có một version và phát change notice sau khi commit`)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-20-diagnose-workspaces-module.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-20-diagnose-workspaces-module.md`

**Interfaces:**

- Uses: no code. The task reads the files below and runs `git grep`.
- Produces: the report tables `Module files`, `Callers`, `Calls into other stores`, `Write sites`, `Browser reads`, `Deck notice path`, `Schema upgrade path` and `Tests`. Each table has the columns that its step gives.

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
- Propose a type, a file name, an SQL statement or a route for the move. This task records facts only.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line. FAIL: one or more lines. The work of Tasks 17 to 19 must have a commit before this task starts.

Run: `git ls-files apps/host/src/http`

Expected: PASS. Three lines: `apps/host/src/http/app.ts`, `apps/host/src/http/error-handler.ts` and `apps/host/src/http/start-host.ts`.

Run: `git grep -n "^| 19 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Record the module files**

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" apps/host/src/features/workspaces/index.ts packages/workspace/registry/src/contracts.ts packages/workspace/registry/src/folder-policy.ts packages/workspace/registry/src/index.ts packages/workspace/registry/src/registry.ts packages/workspace/registry/src/schema.ts packages/workspace/registry/src/workspace-name.ts packages/workspace/registry/tests/workspace-registry.test.mjs`

Expected: PASS. Eight lines, in this order: `65`, `56`, `137`, `14`, `289`, `60`, `29`, `349`.

Read each of the eight files in full. Read these ranges also:

- `packages/host/api/src/transport/management-routes.ts`, the function `registerWorkspaceRoutes` and the line that calls it.
- `apps/host/src/local-transport.ts`, lines 26 to 37, 148 to 157, 180 to 181 and 214 to 226.
- `packages/host/api/src/transport/contracts.ts`, lines 122 to 143.
- `packages/host/contracts/src/management.ts`, lines 68 to 93.

Write the table `Module files` with the columns `File | Lines | Responsibility`. Add one row for each of the eight files and one row for each of the four ranges. In `Responsibility`, write one sentence about what the code does, from the code that you read. Do not write where the code goes after the move.

- [x] **Step 3: Record the callers of the registry**

Run: `git grep -n -E "registry\.[a-zA-Z]+\b" -- apps/host/src ':!apps/host/src/features/workspaces'`

Expected: PASS. Eight lines:

- `apps/host/src/features/chats/index.ts:52`
- `apps/host/src/features/sources/source-tools.ts:61`
- `apps/host/src/features/sources/source-tools.ts:161`
- `apps/host/src/features/sources/source-tools.ts:172`
- `apps/host/src/features/sources/source-tools.ts:173`
- `apps/host/src/server.ts:174`
- `apps/host/src/server.ts:190`
- `apps/host/src/server.ts:358`

Run: `git grep -n -E "\bWorkspaceError\b|\bdefaultWorkspaceId\b" -- apps packages ':!packages/workspace/registry'`

Expected: PASS. Nine lines: four lines in `apps/host/src/local-transport.ts` (11, 26, 149, 181), and five lines in `packages/session/persistence/src/` (`index.ts:8`, `index.ts:80`, `index.ts:105`, `schema.ts:18`, `schema.ts:115`).

Write the table `Callers` with the columns `Caller | Line | Member | Caller area`. Add one row for each line of the two commands. `Member` is the registry method or the exported name on the line. Use this table for `Caller area`:

| Signal | Caller area |
| --- | --- |
| The path starts with `apps/host/src/features/chats/` | `chats` |
| The path starts with `apps/host/src/features/sources/` | `sources` |
| The path is `apps/host/src/server.ts` | composition root |
| The path is `apps/host/src/local-transport.ts` | error map |
| The path starts with `packages/session/persistence/` | session store (own copy of the name) |
| No row matches | Write `unknown` and add the line to the list `Open items` of the report. |

- [x] **Step 4: Record the calls into other stores**

Run: `git grep -n -E "sessions\.[a-zA-Z.]+\(" -- apps/host/src/features/workspaces`

Expected: PASS. Three lines: 34, 35 and 61 of `apps/host/src/features/workspaces/index.ts`.

Write the table `Calls into other stores` with the columns `Line | Call | Operation that makes the call`. `Operation` is the member of `WorkspaceOperations` (`list`, `add`, `select`, `rename`, `relink` or `remove`) that runs the call. Read the function `requireNoActiveRequest` to find the operations of lines 34 and 35.

- [x] **Step 5: Record the write sites**

Run: `git grep -n -E "\.run\(|exec\('(BEGIN|COMMIT|ROLLBACK)" -- packages/workspace/registry/src/registry.ts`

Expected: PASS. Nine lines: 133, 148, 163, 192, 208, 263, 279, 282 and 285.

Run: `git grep -n "setSelected(\|this.transaction(\|this.access(" -- packages/workspace/registry/src/registry.ts`

Expected: PASS. The output contains the lines 104, 123, 130, 134, 143, 149, 160, 180, 206, 210 and 258.

Write the table `Write sites` with the columns `Line | Public method | Table | Inside this.transaction | HTTP route`. Add one row for each `.run(` line of the first command, and one row for each call of `setSelected` (lines 104, 123, 134, 149 and 210). For a `setSelected` row, `Table` is `registry_state` and `Line` is the line of the call.

- `Public method` is the public method of `WorkspaceRegistry` that contains the line, or that calls the private method that contains the line.
- `Inside this.transaction` is `yes` when the line runs inside a function that `this.transaction(` receives. Otherwise it is `no`.
- Use this table for `HTTP route`:

| Public method | HTTP route |
| --- | --- |
| `add` | `POST /api/workspaces` |
| `select` | `PUT /api/workspaces/selected` |
| `rename` | `PUT /api/workspaces/:workspaceId` |
| `relink` | `PUT /api/workspaces/:workspaceId/folder` |
| `remove` | `DELETE /api/workspaces/:workspaceId` |
| No row matches | Write `none` and add the line to the list `Open items` of the report. |

- [x] **Step 6: Record the Browser reads**

Run: `git grep -n -E "management\.(workspaces|addWorkspace|selectWorkspace|renameWorkspace|relinkWorkspace|removeWorkspace)\(" -- apps/web/src/browser`

Expected: PASS. Eight lines: `apps/web/src/browser/chat-navigation.ts:160`, and seven lines in `apps/web/src/browser/features/workspaces/workspace-view.ts` (231, 276, 297, 299, 300, 317 and 332).

Read 30 lines before each line of the output and 10 lines after each line of the output.

Write the table `Browser reads` with the columns `File | Line | Client method | Function that makes the call | Event that runs the function`. `Event` is the user action or the timer that you see in the code, for example a click handler, `focus` or `setInterval`. When the code that you read does not show the event, write `not in the lines read`.

- [x] **Step 7: Record the deck notice path and the schema upgrade path**

Read these ranges:

- `packages/presentation/deck/src/deck-runtime.ts`, lines 40 to 75.
- `packages/host/api/src/transport/deck-routes.ts`, lines 25 to 50.
- `packages/session/persistence/src/schema.ts`, lines 80 to 135.
- `packages/workspace/registry/src/schema.ts`, lines 1 to 60.
- `packages/session/persistence/tests/chat-persistence.test.mjs`, lines 30 to 60.

Write the table `Deck notice path` with the columns `Step | File and line | What the code does`. Write one row for each of these seven steps:

1. The store calls `notify`.
2. The runtime keeps the listeners.
3. The route subscribes.
4. The route sends the first event.
5. The route sends a later event.
6. A listener throws.
7. The connection closes.

Write the table `Schema upgrade path` with the columns `Database | Condition on user_version and application_id | Action | File and line`. Write one row for each branch of the `if` and `else if` chain in the two `schema.ts` files. Add one row for the test in `chat-persistence.test.mjs` that opens a database with an old `user_version`. Its `Action` is the value that the test asserts.

- [x] **Step 8: Record the tests**

Run: `git grep -l -E "['\`]workspaces" -- e2e apps/host/tests apps/web/tests`

Expected: PASS. Six lines: `apps/host/tests/brief-host.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/model-requests.test.mjs`, `e2e/opencode-source-live.test.mjs` and `e2e/source-requests.test.mjs`.

Run: `git grep -n "^test(" -- packages/workspace/registry/tests/workspace-registry.test.mjs`

Expected: PASS. 13 lines.

Run: `git grep -n "test:local-foundation" -- package.json`

Expected: PASS. One line. It contains `packages/workspace/registry/tests/workspace-registry.test.mjs`.

Write the table `Tests` with the columns `File | Suite in package.json | Workspace routes or methods that the file calls`. Add one row for each of the seven test files. To find the suite, run `git grep -n "<file path>" -- package.json` for each file. When the output has no line, write `no suite`.

- [x] **Step 9: Write the report file and stop**

1. Mark Steps 1 to 8 as `- [x]` in this file. Change the Task 20 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and link `../reports/task-20-diagnose-workspaces-module.md`.
2. Create `docs/build/refactor/target-structure/reports/task-20-diagnose-workspaces-module.md` with:
   - The H1 `# Task 20: Diagnose the workspaces module report` and the purpose line `Read this file to learn the code, the callers, the write sites and the tests of the workspaces module before its move.`
   - Files changed.
   - Commands run, with the exit code and the key output of each command.
   - The eight tables of Steps 2 to 8.
   - The list `Open items`, with each line that a decision table sent to the report. Write `None` when the list is empty.
   - What the commands do not prove. Include at least: a caller that reaches the registry through a variable with another name than `registry` is not in Step 3.
3. Add a row for Task 20 in `docs/build/refactor/target-structure/reports/README.md`.
4. Run `corepack pnpm@11.28.5 check:docs`. Expected: PASS. The output contains `0 error(s)`.
5. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-20-diagnose-workspaces-module.md`. When `python` is not available, run the same script with `python3` or `python3.12`. Expected: PASS. The output contains `0 violations`.
6. Mark Step 9 as `- [x]`, stop, and send the report summary.
