# Task 26: Diagnose the chats module report

Read this file to learn the code, store members, callers, write sites, list fields and the tests of the chats module before its move.

## Files changed

- `docs/build/refactor/target-structure/plan/task-26-diagnose-chats-module.md`: marked Steps 1 to 11 as done.
- `docs/build/refactor/target-structure/plan/README.md`: set the Task 26 row to `Done` and added the link to this report.
- `docs/build/refactor/target-structure/reports/README.md`: added the index row of this report.
- `docs/build/refactor/target-structure/reports/task-26-diagnose-chats-module.md` (new): this report.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`. Steps give patterns in Git Bash form. The table gives the PowerShell form that ran.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git ls-files apps/host/src/modules` | 0 | Nine lines, each with the prefix `apps/host/src/modules/workspaces/`. |
| 1 | `git grep -n "^\| 25 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line at `README.md:170`. |
| 2 | `node -e "<line count of each file>" <the six files>` | 0 | Six lines with the counts `83`, `357`, `160`, `142`, `185` and `137`, in the order of the task. |
| 4 | `git grep -n -E "(sessions\|store)\.(open\|create\|bind\|getInfo\|select\|list\|chats\|search\|ungroup\|ungroupExcept\|read\|append\|clearSelections)\(" -- apps/host/src packages/host/api/src ':!apps/host/src/features/chats'` | 0 | 20 lines, in the order of the task. |
| 4 | `git grep -l "SqliteSessionStore" -- apps/host/src packages/host/api/src` | 0 | Twelve lines, in the order of the task. |
| 5 | `git grep -n -E "\b(sessions\|registry\|web\|decks\|drafts)\.[a-zA-Z.]+\(" -- apps/host/src/features/chats` | 0 | 15 lines of `index.ts`: 31, 33, 34, 47, 48, 52, 60, 61, 62, 66, 67, 68, 71, 73 and 75. |
| 6 | `git grep -n -E "\.run\(\|exec\('(BEGIN\|COMMIT\|ROLLBACK)" -- packages/session/persistence/src/index.ts` | 0 | Twelve lines: 94, 118, 141, 199, 212, 251, 265, 268, 288, 291, 294 and 331. |
| 6 | `git grep -n -E "(UPDATE\|INSERT INTO\|DELETE FROM) sessions" -- packages/session/persistence/src` | 0 | Nine lines: `index.ts` 93, 117, 139, 199, 208, 249, 268 and 329, and `schema.ts:115`. |
| 6 | `git grep -n "appendMessages(" -- packages/session/persistence/src` | 0 | Three lines: `requests.ts:42`, `requests.ts:103` and `requests.ts:279`. |
| 8 | `git grep -n -E "management\.(sessions\|create\|select\|search)\(\|client\.history\(" -- apps/web/src/browser` | 0 | Seven lines: `boot.ts:326` and `chat-navigation.ts` 159, 170, 177, 217, 280 and 298. |
| 10 | `git grep -l -E <the pattern of the task> -- e2e apps/host/tests apps/web/tests packages/host/api/tests`, in single quotes | 0 | Seven lines, in the order of the task. |
| 10 | The same command in double quotes | 1 | Three lines. The PowerShell double quote dropped the backtick from the character class. The single-quoted form gives the seven lines that the task expects. |
| 10 | `git grep -n "^test(" -- packages/session/persistence/tests/chat-persistence.test.mjs packages/session/persistence/tests/session-persistence.test.mjs` | 0 | 13 lines: six in `chat-persistence.test.mjs` and seven in `session-persistence.test.mjs`. |
| 10 | `git grep -n "<file path>" -- package.json`, nine times | 0 | Nine lines. Each file has one suite. |
| 9 | `git grep -n "user_version" -- packages/session/persistence/tests/chat-persistence.test.mjs` | 0 | Two lines: 39 and 53. |
| 10 | `git grep -n -o -E "api/sessions[A-Za-z0-9_/:.-]*" -- <each of the seven files>` | 0 | The route strings of the column `Chat routes or store members that the file calls`. |
| 4 | `git grep -n -E "store: (SqliteSessionStore\|...)\|this\.store = \|private readonly store\|constructor\(" -- <seven files>` | 0 | The declarations that give the column `Receiver type`. |
| 11 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 221 file(s) checked, 0 error(s) in 0 file(s)`. |
| 11 | `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-26-diagnose-chats-module.md` | 0 | `0 violations (0 hard, baseline 0)`. The commands `python` and `python3` are not on this machine. The script ran as `C:\Users\Duy\.local\bin\python3.12.exe -I <script> <report>`. The first run reported 5 hard violations. The purpose line of Step 11 has 28 words, above the 25-word cap, so the report drops three `the` words from it. |

## Module files

| File | Lines | Responsibility |
| --- | --- | --- |
| `apps/host/src/features/chats/index.ts` | 83 | Defines `ChatWorkflowError` and `ChatOperations`. Builds `WorkspaceChats` and the four chat operations, and projects one `ChatSummary` to `WebSession`. |
| `packages/session/persistence/src/index.ts` | 357 | Holds `SqliteSessionStore`. Runs the SQL of the chats, the messages and the model selections in `access` and in `transaction`. |
| `packages/session/persistence/src/schema.ts` | 160 | Creates schema 7 on a new file. Upgrades versions 1 to 6 in place, refuses another format and checks integrity. |
| `packages/session/persistence/src/message.ts` | 142 | Checks a stored message and an attachment record. Derives the chat title and the search match. |
| `packages/session/persistence/src/contracts.ts` | 185 | Declares the chat types, the request types, the research types and the class `SessionError`. |
| `apps/host/src/web-state.ts` | 137 | Holds the Browser projection, the model selection preference and the `providers` table of the settings database. |
| `packages/host/api/src/transport/management-routes.ts`, lines 73 to 131 | 59 | Registers the session list, create, selection, activities and requests routes, and the search route. Gives the two list replies to `withActive`. |
| `packages/host/api/src/transport/session-routes.ts`, lines 179 to 186 | 8 | Registers `GET /api/sessions/:sessionId/history`. Reads the history through `options.readHistory` and drops the system messages. |
| `packages/host/api/src/index.ts`, lines 44 to 72 | 29 | Builds the `RequestController`, the function `withActive` and the router. Registers the session routes, the management routes, the option routes and the request routes. |
| `packages/host/api/src/transport/contracts.ts`, lines 101 to 129 | 29 | Declares `WebManagement`: settings, providers, sessions, create, selection, activities, requests, search and drafts. |
| `apps/host/src/local-transport.ts`, lines 17 to 22 | 6 | Maps each `ChatWorkflowErrorCode` to an HTTP status. |
| `apps/host/src/local-transport.ts`, lines 135 to 155 | 21 | Registers `ChatWorkflowError` in `featureFailures`. Maps three `SessionError` codes to HTTP responses. |
| `apps/host/src/local-transport.ts`, lines 178 to 196 | 19 | Adapts `ChatOperations` to `WebManagement`. Checks the create body, the search body and calls the operations. |
| `packages/host/contracts/src/management.ts`, lines 43 to 63 | 21 | Declares `WebSession`, the shape of one chat in the Browser list. |
| `apps/host/src/server.ts`, lines 189 to 203 | 15 | Reconciles the chats at startup: interrupts the active request, ungroups the chats of an absent workspace, then binds or opens each plan in `options.confirmedDecks`. |
| `apps/host/src/server.ts`, line 345 | 1 | Wires `chatManagement(createChatOperations(...))` into the management object. |

Step 2 names seven ranges and lists nine. The table has one row for each range that Step 2 lists.

## Store members

| Member | Public | Tables read | Tables written | Inside this.transaction |
| --- | --- | --- | --- | --- |
| `open` | yes | `none` | `sessions` | no |
| `create` | yes | `sessions`, `messages` | `sessions` | yes |
| `bind` | yes | `sessions`, `messages` | `sessions` | yes |
| `getInfo` | yes | `sessions`, `messages` | `none` | no write |
| `select` | yes | `sessions`, `messages` | `sessions` | yes |
| `list` | yes | `sessions`, `messages` | `none` | no write |
| `chats` | yes | `sessions`, `messages` | `none` | no write |
| `search` | yes | `sessions`, `messages` | `none` | no write |
| `ungroup` | yes | `none` | `sessions` | no |
| `ungroupExcept` | yes | `sessions` | `sessions` | yes |
| `read` | yes | `sessions`, `messages` | `none` | no write |
| `append` | yes | `sessions`, `messages` | `messages`, `sessions` | yes |
| `clearSelections` | yes | `sessions` | `sessions` | yes |
| `close` | yes | `none` | `none` | no write |
| `requests` | yes | `RequestLog`, `not read in this task` | `RequestLog`, `not read in this task` | no write |
| `attachments` | yes | `AttachmentLog`, `not read in this task` | `AttachmentLog`, `not read in this task` | no write |
| `RequestLog.admit` | yes | `sessions`, `requests`, `request_research`, `messages`, `attachments`, `request_events` | `messages`, `sessions`, `requests`, `request_research`, `attachments`, `request_events` | yes |
| `RequestLog.settle`, private | no | `requests`, `request_approvals`, `request_events` | `requests`, `request_approvals`, `request_events`, `messages`, `sessions` | yes |

`open` calls `ensure` and writes one row of `sessions`. `create` and `bind` call `ensure` and `info`. `ungroup` writes with no transaction. The other members that write a table call `this.transaction`.

## Callers

| Caller | Line | Member | Receiver type | Caller area |
| --- | --- | --- | --- | --- |
| `apps/host/src/features/attachments/attachment-coordinator.ts` | 79 | `getInfo` | `SqliteSessionStore` | `attachments` |
| `apps/host/src/features/deck/brief-coordinator.ts` | 18 | `getInfo` | `SqliteSessionStore` | `deck` |
| `apps/host/src/features/deck/deck-workflow.ts` | 197 | `read` | `SqliteSessionStore` | `deck` |
| `apps/host/src/features/requests/prepare-runtime.ts` | 39 | `getInfo` | `SqliteSessionStore` | `requests` |
| `apps/host/src/features/requests/prepare-runtime.ts` | 42 | `read` | `SqliteSessionStore` | `requests` |
| `apps/host/src/features/sources/source-tools.ts` | 159 | `getInfo` | `SqliteSessionStore` | `sources` |
| `apps/host/src/features/sources/source-tools.ts` | 167 | `getInfo` | `SqliteSessionStore` | `sources` |
| `apps/host/src/integrations/opencode/runtime.ts` | 164 | `read` | `RuntimeSessionAccess` | `not a chat member` |
| `apps/host/src/integrations/opencode/runtime.ts` | 195 | `bind` | `RuntimeSessionAccess` | `not a chat member` |
| `apps/host/src/local-transport.ts` | 230 | `getInfo` | `SqliteSessionStore` | `error map and HTTP adapter` |
| `apps/host/src/server.ts` | 196 | `ungroupExcept` | `SqliteSessionStore` | `composition root` |
| `apps/host/src/server.ts` | 198 | `getInfo` | `SqliteSessionStore` | `composition root` |
| `apps/host/src/server.ts` | 199 | `bind` | `SqliteSessionStore` | `composition root` |
| `apps/host/src/server.ts` | 200 | `open` | `SqliteSessionStore` | `composition root` |
| `apps/host/src/server.ts` | 244 | `clearSelections` | `SqliteSessionStore` | `composition root` |
| `apps/host/src/server.ts` | 257 | `read` | `SqliteSessionStore` | `composition root` |
| `apps/host/src/server.ts` | 335 | `read` | `SqliteSessionStore` | `composition root` |
| `packages/host/api/src/lifecycle/request-controller.ts` | 240 | `append` | `RequestStore` | `not a chat member` |
| `packages/host/api/src/lifecycle/request-controller.ts` | 285 | `append` | `RequestStore` | `not a chat member` |
| `packages/host/api/src/lifecycle/request-controller.ts` | 354 | `append` | `RequestStore` | `not a chat member` |

## Calls into other stores

| Line | Call | Store | Function that makes the call |
| --- | --- | --- | --- |
| 31 | `sessions.list()` | `SqliteSessionStore` | `createWorkspaceChats` |
| 33 | `sessions.requests.activeFor(chat.sessionId)` | `RequestLog` | `createWorkspaceChats` |
| 34 | `sessions.ungroup(workspaceId)` | `SqliteSessionStore` | `createWorkspaceChats` |
| 47 | `web.project(chat, ...)` | `WebState` | `project` |
| 47 | `decks.snapshot(chat.sessionId)` | `DeckStore` | `project` |
| 48 | `drafts.get(chat.sessionId)` | `MemoryDraftStore` | `project` |
| 48 | `drafts.snapshot(chat.sessionId)` | `MemoryDraftStore` | `project` |
| 52 | `sessions.chats()` | `SqliteSessionStore` | `chat` |
| 60 | `web.lastSelection()` | `WebState` | `create` |
| 61 | `web.selectable(resolved)` | `WebState` | `create` |
| 62 | `sessions.create(registry.selectedId(), resolved)` | `SqliteSessionStore` | `create` |
| 62 | `registry.selectedId()` | `WorkspaceLookup` | `create` |
| 66 | `web.selectable(chosen)` | `WebState` | `selectModel` |
| 67 | `sessions.select(id, chosen)` | `SqliteSessionStore` | `selectModel` |
| 68 | `web.rememberSelection(chosen)` | `WebState` | `selectModel` |
| 71 | `sessions.chats()` | `SqliteSessionStore` | `list` |
| 73 | `sessions.chats()` | `SqliteSessionStore` | `search` |
| 75 | `sessions.search(...)` | `SqliteSessionStore` | `search` |

## Write sites

| Line | Public method | Table | Columns written | Inside this.transaction | HTTP route or caller |
| --- | --- | --- | --- | --- | --- |
| 94 | `create` | `sessions` | `provider`, `model` | yes | `POST /api/sessions` |
| 118 | `bind` | `sessions` | `provider`, `model` | yes | Startup, `apps/host/src/server.ts:199` |
| 141 | `select` | `sessions` | `provider`, `model`, `removed_provider`, `removed_model` | yes | `PUT /api/sessions/:sessionId/selection` |
| 199 | `ungroup` | `sessions` | `workspace_id` | no | `DELETE /api/workspaces/:workspaceId` (through `WorkspaceChats.ungroup`) |
| 212 | `ungroupExcept` | `sessions` | `workspace_id` | yes | Startup, `apps/host/src/server.ts:196` |
| 251 | `clearSelections` | `sessions` | `provider`, `model`, `removed_provider`, `removed_model` | yes | `modelsRemoved` of `ProviderStore`, `apps/host/src/server.ts:244` |
| 265 | `append` | `messages` | `session_id`, `sequence`, `payload` | yes | The request lifecycle. Step 4 found no call on `SqliteSessionStore.append`. |
| 265 | `RequestLog.admit` | `messages` | `session_id`, `sequence`, `payload` | yes | The request lifecycle. Step 4 does not match the caller. |
| 265 | `RequestLog.settle` | `messages` | `session_id`, `sequence`, `payload` | yes | The request lifecycle. Step 4 does not match the caller. |
| 268 | `append` | `sessions` | `updated_at` | yes | The request lifecycle. Step 4 found no call on `SqliteSessionStore.append`. |
| 268 | `RequestLog.admit` | `sessions` | `updated_at` | yes | The request lifecycle. Step 4 does not match the caller. |
| 268 | `RequestLog.settle` | `sessions` | `updated_at` | yes | The request lifecycle. Step 4 does not match the caller. |
| 331 | `open` | `sessions` | `id`, `created_at`, `updated_at`, `workspace_id` | no | Startup, `apps/host/src/server.ts:200` |
| 331 | `bind` | `sessions` | `id`, `created_at`, `updated_at`, `workspace_id` | yes | Startup, `apps/host/src/server.ts:199` |
| 331 | `create` | `sessions` | `id`, `created_at`, `updated_at`, `workspace_id` | yes | `POST /api/sessions`, through `apps/host/src/features/chats/index.ts:62` |

Line 288, 291 and 294 are the `BEGIN IMMEDIATE`, `COMMIT` and `ROLLBACK` of `transaction`. They write no table and have no row.

Step 4 found three calls of `append` at `request-controller.ts:240`, `:285` and `:354`. The receiver there is `RequestStore`, not `SqliteSessionStore`. Step 4 finds no caller of `SqliteSessionStore.append`, `RequestLog.admit` or `RequestLog.settle`.

## List fields

| Field | Set by | Source store and column | Write sites that change it |
| --- | --- | --- | --- |
| `title` | `WebState.project` | `SqliteSessionStore`, `messages.payload`, through `chatTitle`. The fallback is `'New chat'`. | 265 |
| `hasSlides` | `WebState.project` | `DeckStore`, the in-memory `snapshot().slides[].revision` | not in the lines read |
| `sessionId` | `WebState.project` | `SqliteSessionStore`, `sessions.id` | 331 |
| `createdAt` | `WebState.project` | `SqliteSessionStore`, `sessions.created_at` | 331 |
| `updatedAt` | `WebState.project` | `SqliteSessionStore`, `sessions.updated_at` | 268, 331 |
| `messageCount` | `WebState.project` | `SqliteSessionStore`, the count of `messages` rows of the chat | 265 |
| `selection` | `WebState.project` | `SqliteSessionStore`, `sessions.provider` and `sessions.model` | 94, 118, 141, 251, 331 |
| `removedSelection` | `WebState.project` | `SqliteSessionStore`, `sessions.removed_provider` and `sessions.removed_model` | 141, 251 |
| `selectable` | `WebState.project` | The in-memory `isSelectable` callback of `ProviderStore` | not in the lines read |
| `activeRequestId` | `withActive` | The in-memory active execution of `RequestController` | not in the lines read |
| `workspaceId` | `WebState.project` | `SqliteSessionStore`, `sessions.workspace_id` | 199, 212, 331 |
| `readable` | `WebState.project` | `SqliteSessionStore`, the in-memory flag of `chats()`. It is false only when a stored message does not match the message format. | 265 writes the payloads. No write site sets it to false. |
| `hasDraft` | `project` of `createChatOperations` | `MemoryDraftStore`, the draft text and the attachment IDs | not in the lines read |

Line 331 writes `sessions.provider` and `sessions.model` as `NULL`, because the INSERT does not name those columns.

## Browser reads

| File | Line | Client method | HTTP route | Function that makes the call | Event that runs the function |
| --- | --- | --- | --- | --- | --- |
| `apps/web/src/browser/boot.ts` | 326 | `management.select` | `PUT /api/sessions/:sessionId/selection` | the `change` handler on `shell.model` | `change` on the model selector |
| `apps/web/src/browser/chat-navigation.ts` | 159 | `management.sessions` | `GET /api/sessions` | `ChatNavigation.refresh` | Startup `start`, and the seven callers of `refresh`. The callers are the model `change`, the reconnect `click`, the new-chat `click`, the settings panel close, the workspace change, the research change and the draft refresh. |
| `apps/web/src/browser/chat-navigation.ts` | 170 | `management.search` | `POST /api/sessions/search` | `ChatNavigation.refresh` | The same events as line 159. |
| `apps/web/src/browser/chat-navigation.ts` | 177 | `client.history` | `GET /api/sessions/:sessionId/history` | `ChatNavigation.showHistory` | The submit of a request and the follow of an active request, at `request-runner.ts:216` and `:133`. |
| `apps/web/src/browser/chat-navigation.ts` | 217 | `client.history` | `GET /api/sessions/:sessionId/history` | `ChatNavigation.open` | `click` on a chat button, at `chat-navigation.ts:126`, and startup `start` |
| `apps/web/src/browser/chat-navigation.ts` | 280 | `management.create` | `POST /api/sessions` | `ChatNavigation.newChat` | `click` on `shell.newChatButton`, at `boot.ts:342`, and startup `start` when `sessionStorage` holds no chat |
| `apps/web/src/browser/chat-navigation.ts` | 298 | `management.search` | `POST /api/sessions/search` | `ChatNavigation.findChats` | `input` on the search box after the 200 ms timer, or `submit` on the search form |

## Error map

| Error class | Code | HTTP status | File and line |
| --- | --- | --- | --- |
| `ChatWorkflowError` | `SESSION_NOT_FOUND` | 404 | `apps/host/src/local-transport.ts:18` |
| `ChatWorkflowError` | `MODEL_NOT_SELECTABLE` | 409 | `apps/host/src/local-transport.ts:19` |
| `ChatWorkflowError` | `CHAT_UNREADABLE` | 409 | `apps/host/src/local-transport.ts:20` |
| `ChatWorkflowError` | `DRAFT_TOO_LARGE` | 413 | `apps/host/src/local-transport.ts:21` |
| `SessionError` | `SESSION_NOT_FOUND` | 404, response code `SESSION_NOT_FOUND` | `apps/host/src/local-transport.ts:151` |
| `SessionError` | `SESSION_CORRUPT` | 409, response code `CHAT_UNREADABLE` | `apps/host/src/local-transport.ts:152` |
| `SessionError` | `DRAFT_TOO_LARGE` | 413, response code `DRAFT_TOO_LARGE` | `apps/host/src/local-transport.ts:153` |
| `HttpError` | `INVALID_SESSION` | 400 | `apps/host/src/local-transport.ts:185` |
| `HttpError` | `INVALID_REQUEST` | 400 | `apps/host/src/local-transport.ts:192` |

`chatManagement` calls `body` for the search body. `body` throws `HttpError(400, 'INVALID_REQUEST')` at `local-transport.ts:117`, outside lines 178 to 196.

## Schema upgrade path

| Condition on user_version and application_id | Action | File and line |
| --- | --- | --- |
| `version === 0`, `owner === 0` and no table in `sqlite_master` | Create every table at schema 7. Set `application_id` to `0x44414754` and `user_version` to 7. | `packages/session/persistence/src/schema.ts:86` |
| `version >= 1`, `version <= 6` and `owner === applicationId` | Run each upgrade step that the version needs. Set `user_version` to 7 and keep every row. | `packages/session/persistence/src/schema.ts:110` |
| `version === 1` inside the upgrade branch | Add `sessions.workspace_id`, set every row to `'default'` and create the index `sessions_workspace`. | `packages/session/persistence/src/schema.ts:112` |
| `version < 3` | Create `requests`, `request_events` and `runtime_bindings`. Add `removed_provider` and `removed_model` to `sessions`. | `packages/session/persistence/src/schema.ts:118` |
| `version < 4` | Create `attachments` and `sources`. | `packages/session/persistence/src/schema.ts:119` |
| `version < 5` | Create `request_approvals` and `source_reads`. | `packages/session/persistence/src/schema.ts:120` |
| `version < 6` | Add `attachments.preparation` and `attachments.parsed_fingerprint`. | `packages/session/persistence/src/schema.ts:121` |
| `version !== schemaVersion` or `owner !== applicationId` | Throw `SESSION_SCHEMA` and keep the file. | `packages/session/persistence/src/schema.ts:123` |
| The test opens a database with `user_version` 1 and `application_id` `0x44414754` | The test asserts `user_version` 7. | `packages/session/persistence/tests/chat-persistence.test.mjs:53` |

## Tests

| File | Suite in package.json | Chat routes or store members that the file calls |
| --- | --- | --- |
| `apps/host/tests/http-server.test.mjs` | `test:tools-browser` | `GET /api/sessions/:sessionId/history` |
| `apps/host/tests/web-management.test.mjs` | `test:local-web` | `GET /api/sessions`, `POST /api/sessions`, `PUT /api/sessions/:sessionId/selection`, `GET /api/sessions/:sessionId/history` |
| `e2e/browser-smoke.test.mjs` | `test:browser-smoke` | `POST /api/sessions` |
| `e2e/deck-pipeline.test.mjs` | `test:slide-pipeline` | `GET /api/sessions` |
| `e2e/http-edge.test.mjs` | `test:http-edge` | `GET /api/sessions`, `POST /api/sessions`, `GET /api/sessions/:sessionId/history` |
| `e2e/local-web.test.mjs` | `test:tools-browser` | `GET /api/sessions` with no token, which expects 401 |
| `e2e/opencode-live.test.mjs` | `test:opencode-live` | `POST /api/sessions` |
| `packages/session/persistence/tests/chat-persistence.test.mjs` | `test:local-foundation` | `open`, `create`, `getInfo`, `read`, `append`, `chats`, `search`, `ungroup`, `ungroupExcept`, `close`, `requests.admit` and `requests.researchSources`, and the schema 1 to 7 upgrade |
| `packages/session/persistence/tests/session-persistence.test.mjs` | `test:session-persistence` | `open`, `append`, `read`, `getInfo`, `bind`, `list` and `close` |

## Store holders without a chat member call

- `apps/host/src/features/chats/index.ts`
- `apps/host/src/features/deck/confirmation-coordinator.ts`
- `apps/host/src/features/deck/generation-workflow.ts`
- `apps/host/src/features/research/research-coordinator.ts`
- `packages/host/api/src/contract-sync.ts`

Step 4 excludes `apps/host/src/features/chats/`, so that file cannot have a row.

## Open items

None.

## What the commands do not prove

- Step 4 does not find a caller that uses a variable with another name than `sessions` or `store`.
- Step 4 does not find a call on a method that a caller took from the store with destructuring or passed as a function value.
- Step 4 reads the declared type only. It does not prove that a value of type `SqliteSessionStore` is the chat store of the running Host.
- Step 4 and Step 5 read tracked files. They do not see a file with no commit.
- Step 6 decides `Inside this.transaction` from the text `this.transaction(`. The table does not prove that a `yes` row protects an invariant or that a `no` row breaks one.
- Step 6 does not prove that `RequestStore.append` and `SqliteSessionStore.append` have the same effect. The names match and the receivers differ.
- Step 7 does not find a field of the chat list that the Browser computes by itself.
- Step 7 reads the fields that `WebState.project`, the `project` of `createChatOperations` and `withActive` write. A field that another function adds to the reply is not in the table.
- Step 8 reads the Browser text. A call through an object with another name has no match. The table does not prove that no other Browser module calls a chat route.
- Step 9 lists the error codes of the lines that Step 9 names. Other routes, for example the attachment routes, have their own status maps.
- No command runs a test suite or the build. The tables record text matches and code reads only.
