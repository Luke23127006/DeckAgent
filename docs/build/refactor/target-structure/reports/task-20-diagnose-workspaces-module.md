# Task 20: Diagnose the workspaces module report

Read this file to learn the code, the callers, the write sites and the tests of the workspaces module before its move.

## Files changed

- `docs/build/refactor/target-structure/plan/task-20-diagnose-workspaces-module.md`: marked Steps 1 to 9 as done.
- `docs/build/refactor/target-structure/plan/README.md`: set the Task 20 row to `Done` and added the link to this report.
- `docs/build/refactor/target-structure/reports/README.md`: added the index row of this report.
- `docs/build/refactor/target-structure/reports/task-20-diagnose-workspaces-module.md` (new): this report.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git ls-files apps/host/src/http` | 0 | Three lines: `app.ts`, `error-handler.ts`, `start-host.ts`. |
| 1 | `git grep -n "^\| 19 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line at `README.md:131`. |
| 2 | `node -e "<line count of each file>" <the eight files>` | 0 | Eight lines with the counts `65`, `56`, `137`, `14`, `289`, `60`, `29` and `349`. |
| 3 | `git grep -n -E "registry\.[a-zA-Z]+\b" -- apps/host/src ':!apps/host/src/features/workspaces'` | 0 | Eight lines. |
| 3 | `git grep -n -E "\bWorkspaceError\b\|\bdefaultWorkspaceId\b" -- apps packages ':!packages/workspace/registry'` | 0 | Nine lines. |
| 4 | `git grep -n -E "sessions\.[a-zA-Z.]+\(" -- apps/host/src/features/workspaces` | 0 | Three lines: 34, 35 and 61 of `index.ts`. |
| 5 | `git grep -n -E "\.run\(\|exec\('(BEGIN\|COMMIT\|ROLLBACK)" -- packages/workspace/registry/src/registry.ts` | 0 | Nine lines: 133, 148, 163, 192, 208, 263, 279, 282 and 285. |
| 5 | `git grep -n "setSelected(\|this.transaction(\|this.access(" -- packages/workspace/registry/src/registry.ts` | 0 | Eleven lines that include 104, 123, 130, 134, 143, 149, 160, 180, 206, 210 and 258. |
| 6 | `git grep -n -E "management\.(workspaces\|addWorkspace\|selectWorkspace\|renameWorkspace\|relinkWorkspace\|removeWorkspace)\(" -- apps/web/src/browser` | 0 | Eight lines: `chat-navigation.ts:160` and seven lines in `workspace-view.ts`. |
| 8 | `git grep -l -E "['\`]workspaces" -- e2e apps/host/tests apps/web/tests` | 0 | Six lines, in the order of the task. |
| 8 | `git grep -n "^test(" -- packages/workspace/registry/tests/workspace-registry.test.mjs` | 0 | Thirteen lines. |
| 8 | `git grep -n "test:local-foundation" -- package.json` | 0 | One line at `package.json:8`. It names the registry test file. |
| 8 | `git grep -n "<each test file>" -- package.json`, seven times | 0 | Seven lines. Each file has one suite. |
| 9 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 209 file(s) checked, 0 error(s) in 0 file(s)`. |
| 9 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-20-diagnose-workspaces-module.md` | 0 | `0 violations (0 hard, baseline 0)`. The commands `python` and `python3` are not on this machine. The first run reported one `synonym-rotation` violation, and this report changed `validates` to `checks`. |

## Module files

| File | Lines | Responsibility |
| --- | --- | --- |
| `apps/host/src/features/workspaces/index.ts` | 65 | Defines `WorkspaceWorkflowError` and `WorkspaceOperations`. Builds the six operations and checks for an active request before `relink` and `remove`. |
| `packages/workspace/registry/src/contracts.ts` | 56 | Defines the workspace types, the four folder states, the eleven error codes and the `WorkspaceError` class. |
| `packages/workspace/registry/src/folder-policy.ts` | 137 | Refuses a project folder by the BR-019 rules and reads the identity of an allowed folder. |
| `packages/workspace/registry/src/index.ts` | 14 | Exports the public names of the registry package. |
| `packages/workspace/registry/src/registry.ts` | 289 | Runs the SQL of the registry, the folder checks and the transactions of the six operations. |
| `packages/workspace/registry/src/schema.ts` | 60 | Creates schema 1 at first start and refuses every other format. |
| `packages/workspace/registry/src/workspace-name.ts` | 29 | Applies the BR-020 name rules to a folder name and to a name from the user. |
| `packages/workspace/registry/tests/workspace-registry.test.mjs` | 349 | Holds 13 `node:test` cases for names, folder refusals, the six operations and a damaged database. |
| `packages/host/api/src/transport/management-routes.ts`, the function `registerWorkspaceRoutes` and its call at line 192 | 42 | Registers the six `/api/workspaces` routes when the management object has a `workspaces` field. |
| `apps/host/src/local-transport.ts`, lines 26 to 37, 148 to 157, 180 to 181 and 214 to 226 | 37 | Holds the error status map, the safe error detail, the two `mapApplicationFailure` branches and the `workspaceManagement` adapter. The adapter checks the JSON body. |
| `packages/host/api/src/transport/contracts.ts`, lines 122 to 143 | 22 | Declares the optional `workspaces` field of `WebManagement` and the six members of `WorkspaceManagement`. |
| `packages/host/contracts/src/management.ts`, lines 68 to 93 | 26 | Declares the Browser shapes `WorkspaceView` and `WorkspaceList`, and the chat draft and preference types next to them. |

## Callers

| Caller | Line | Member | Caller area |
| --- | --- | --- | --- |
| `apps/host/src/features/chats/index.ts` | 52 | `selectedId` | `chats` |
| `apps/host/src/features/sources/source-tools.ts` | 61 | `folders` | `sources` |
| `apps/host/src/features/sources/source-tools.ts` | 161 | `get` | `sources` |
| `apps/host/src/features/sources/source-tools.ts` | 172 | `get` | `sources` |
| `apps/host/src/features/sources/source-tools.ts` | 173 | `get` | `sources` |
| `apps/host/src/server.ts` | 174 | `overlapsFolder` | composition root |
| `apps/host/src/server.ts` | 190 | `activeIds` | composition root |
| `apps/host/src/server.ts` | 358 | `close` | composition root |
| `apps/host/src/local-transport.ts` | 11 | `WorkspaceError` | error map |
| `apps/host/src/local-transport.ts` | 26 | `WorkspaceError` | error map |
| `apps/host/src/local-transport.ts` | 149 | `WorkspaceError` | error map |
| `apps/host/src/local-transport.ts` | 181 | `WorkspaceError` | error map |
| `packages/session/persistence/src/index.ts` | 8 | `defaultWorkspaceId` | session store (own copy of the name) |
| `packages/session/persistence/src/index.ts` | 80 | `defaultWorkspaceId` | session store (own copy of the name) |
| `packages/session/persistence/src/index.ts` | 105 | `defaultWorkspaceId` | session store (own copy of the name) |
| `packages/session/persistence/src/schema.ts` | 18 | `defaultWorkspaceId` | session store (own copy of the name) |
| `packages/session/persistence/src/schema.ts` | 115 | `defaultWorkspaceId` | session store (own copy of the name) |

## Calls into other stores

| Line | Call | Operation that makes the call |
| --- | --- | --- |
| 34 | `(await sessions.list()).filter(chat => chat.workspaceId === workspaceId)` | `relink`, `remove` |
| 35 | `sessions.requests.activeFor(chat.sessionId)` | `relink`, `remove` |
| 61 | `sessions.ungroup(id)` | `remove` |

Line 34 and line 35 sit in `requireNoActiveRequest`. The operations `relink` and `remove` call that function.

## Write sites

| Line | Public method | Table | Inside this.transaction | HTTP route |
| --- | --- | --- | --- | --- |
| 133 | `add` | `workspaces` | yes | `POST /api/workspaces` |
| 148 | `add` | `workspaces` | yes | `POST /api/workspaces` |
| 163 | `rename` | `workspaces` | yes | `PUT /api/workspaces/:workspaceId` |
| 192 | `relink` | `workspaces` | yes | `PUT /api/workspaces/:workspaceId/folder` |
| 208 | `remove` | `workspaces` | yes | `DELETE /api/workspaces/:workspaceId` |
| 263 | `setSelected`, private, called by `select`, `add` and `remove` | `registry_state` | yes for `add` (134, 149) and `remove` (210), no for `select` (104) and `add` (123) | `none` |
| 279 | `transaction`, private, called by `add`, `rename`, `relink` and `remove` | `none` | no | `none` |
| 282 | `transaction`, private, called by `add`, `rename`, `relink` and `remove` | `none` | no | `none` |
| 285 | `transaction`, private, called by `add`, `rename`, `relink` and `remove` | `none` | no | `none` |
| 104 | `select` | `registry_state` | no | `PUT /api/workspaces/selected` |
| 123 | `add` | `registry_state` | no | `POST /api/workspaces` |
| 134 | `add` | `registry_state` | yes | `POST /api/workspaces` |
| 149 | `add` | `registry_state` | yes | `POST /api/workspaces` |
| 210 | `remove` | `registry_state` | yes | `DELETE /api/workspaces/:workspaceId` |

Two writes to `registry_state` run with no transaction: `select` at line 104 and the `existing` branch of `add` at line 123. Every write to `workspaces` runs inside `this.transaction`.

## Browser reads

| File | Line | Client method | Function that makes the call | Event that runs the function |
| --- | --- | --- | --- | --- |
| `apps/web/src/browser/chat-navigation.ts` | 160 | `management.workspaces()` | `ChatNavigation.refresh` | not in the lines read |
| `apps/web/src/browser/features/workspaces/workspace-view.ts` | 231 | `management.workspaces()` | `runWorkspaceChange`, the `catch` branch | the failed write that `runWorkspaceChange` started |
| `apps/web/src/browser/features/workspaces/workspace-view.ts` | 276 | `management.removeWorkspace` | `removeSelectedWorkspace` | `click` on the remove button, after `confirm()` |
| `apps/web/src/browser/features/workspaces/workspace-view.ts` | 297 | `management.renameWorkspace` | `submitWorkspaceDialog` | `submit` on the dialog form |
| `apps/web/src/browser/features/workspaces/workspace-view.ts` | 299 | `management.relinkWorkspace` | `submitWorkspaceDialog` | `submit` on the dialog form |
| `apps/web/src/browser/features/workspaces/workspace-view.ts` | 300 | `management.addWorkspace` | `submitWorkspaceDialog` | `submit` on the dialog form |
| `apps/web/src/browser/features/workspaces/workspace-view.ts` | 317 | `management.relinkWorkspace` | the `click` handler on `dom.adopt` | `click` on the adopt button |
| `apps/web/src/browser/features/workspaces/workspace-view.ts` | 332 | `management.selectWorkspace` | the `change` handler on `dom.select` | `change` on the workspace selector |

Line 231 runs only when a workspace write fails with `WORKSPACE_NOT_FOUND`. The Browser then reads the list again.

## Deck notice path

| Step | File and line | What the code does |
| --- | --- | --- |
| 1. The store calls `notify` | `packages/presentation/deck/src/deck-store.ts:124` | The store gives the write modules a `notify` function. The function calls `this.runtime.notify(sessionId, version)`. |
| 2. The runtime keeps the listeners | `packages/presentation/deck/src/deck-reads.ts:124` | `subscribe` adds the listener to the `Set` of the chat in `DeckRuntime.listeners` (`deck-runtime.ts:16`). The returned function removes the listener. |
| 3. The route subscribes | `packages/host/api/src/transport/deck-routes.ts:36` | The SSE route calls `decks.subscribe(sessionId, send)` before it reads the snapshot. |
| 4. The route sends the first event | `packages/host/api/src/transport/deck-routes.ts:40` | The route calls `send` with the `version` of the snapshot. The Browser receives the current state at once. |
| 5. The route sends a later event | `packages/host/api/src/transport/deck-routes.ts:32` | `send` writes `event: deck-changed` with the change. A failed write calls `res.end()`. |
| 6. A listener throws | `packages/presentation/deck/src/deck-runtime.ts:62` | The `catch` removes the listener from the `Set` of the chat. A commit stays. |
| 7. The connection closes | `packages/host/api/src/transport/sse.ts:10` | The `close` handler clears the heartbeat, calls the unsubscribe function and removes the response from `streams`. |

## Schema upgrade path

| Database | Condition on user_version and application_id | Action | File and line |
| --- | --- | --- | --- |
| sessions | `version === 0`, `owner === 0` and no table | Create every table at schema 7. Set `application_id` to DAGT and `user_version` to 7. | `packages/session/persistence/src/schema.ts:86` |
| sessions | `version >= 1`, `version <= 6` and `owner === applicationId` | Add `workspace_id` for v1 and add the tables of v3 to v6. Set `user_version` to 7 and keep every row. | `packages/session/persistence/src/schema.ts:110` |
| sessions | `version !== schemaVersion` or `owner !== applicationId` | Throw `SESSION_SCHEMA`. Keep the file. | `packages/session/persistence/src/schema.ts:123` |
| workspaces | `version === 0`, `owner === 0` and no table | Create `workspaces` and `registry_state`. Set `application_id` to DAWS and `user_version` to 1. Insert the default workspace and the selection. | `packages/workspace/registry/src/schema.ts:12` |
| workspaces | `version !== schemaVersion` or `owner !== applicationId` | Throw `WORKSPACE_SCHEMA`. Keep the file. | `packages/workspace/registry/src/schema.ts:36` |
| sessions | The test opens a database with `user_version` 1 and `application_id` DAGT. | The test asserts `user_version` 7. | `packages/session/persistence/tests/chat-persistence.test.mjs:53` |

The workspaces schema has two branches only. Version 1 is the only accepted version. A file with another version gets `WORKSPACE_SCHEMA`, and no branch changes it.

## Tests

| File | Suite in package.json | Workspace routes or methods that the file calls |
| --- | --- | --- |
| `packages/workspace/registry/tests/workspace-registry.test.mjs` | `test:local-foundation` | `list`, `get`, `add`, `select`, `rename`, `relink`, `remove`, `activeIds`, `selectedId`, `close`, `FolderPolicy.refusal`, `FolderPolicy.inspect`, `nameFromUser`, `nameFromFolder` |
| `apps/host/tests/brief-host.test.mjs` | `test:brief-foundation` | `POST /api/workspaces` |
| `e2e/generation-bridge.test.mjs` | `test:generation-publication` | `POST /api/workspaces` |
| `e2e/local-foundation.test.mjs` | `test:local-foundation` | `GET /api/workspaces`, `POST /api/workspaces`, `PUT /api/workspaces/selected`, `PUT /api/workspaces/:workspaceId`, `PUT /api/workspaces/:workspaceId/folder`, `DELETE /api/workspaces/:workspaceId`, `GET /api/sessions` |
| `e2e/model-requests.test.mjs` | `test:model-requests` | `POST /api/workspaces`, `PUT /api/workspaces/:workspaceId/folder`, `DELETE /api/workspaces/:workspaceId`, `GET /api/sessions` |
| `e2e/opencode-source-live.test.mjs` | `test:opencode-live` | `POST /api/workspaces` |
| `e2e/source-requests.test.mjs` | `test:source-permissions` | `POST /api/workspaces` |

## Open items

- Step 5 gives one HTTP route to a row. Four rows have no single route: line 263 and lines 279, 282 and 285. The table gives the value `none` for each of them.

## What the commands do not prove

- A caller that reaches the registry through a variable with another name than `registry` is not in Step 3. Step 3 finds the text `registry.` only.
- A registry passed as an argument to a function, or a method taken with destructuring, has no `registry.` text. Step 3 misses that call.
- Step 3 and Step 5 read tracked files in a commit. They do not see a file with no commit.
- Step 5 decides `Inside this.transaction` from the text `this.transaction(`. The table does not prove that a `yes` row protects an invariant, and it does not prove that a `no` row breaks one.
- Step 6 reads Browser text. It does not prove that no other Browser module calls a workspace route. A call through an object with another name has no match.
- Step 7 reads the deck path only. The workspaces store has no notice and no `version` column today, so the deck path is the only worked example in the code.
- Step 8 lists the files that contain the string `workspaces`. A test that calls a workspace route through a helper with no such string is not in the list.
- No command runs a test suite or the build. The tables record text matches and code reads only.
