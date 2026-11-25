# Task 3: Diagnose the run owner report

Read this file to learn where the request lifecycle and the OpenCode adapter use sessionId, and which use is a chat rule.

## Files changed

- `docs/build/refactor/target-structure/plan/task-03-diagnose-run-owner.md`: marked Steps 1 to 5 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 3 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index.
- `docs/build/refactor/target-structure/reports/task-03-diagnose-run-owner.md`: added this report.

No code, test, script or convention file changed.

## Commands run

All commands ran in Git Bash on Windows from the repository root.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| Before Step 1 | `git status --short` | 0 | The output listed the uncommitted files of Task 2. Before Step 4, a person committed them as `9765948`. No file of Task 3 was in the list. |
| Before Step 1 | `wc -l` on the ten `Read first` files | 0 | Every line count equals the count in the task file. |
| 1 | `grep -rnw sessionId` on the four paths, each with `wc -l` | 0 | Four lines: `25`, `21`, `3`, `2` |
| 2 | `grep -rnw sessionId` on the four paths together, with `wc -l` | 0 | `51` lines |
| 3 | `grep -n "session_id\|CREATE TABLE" packages/session/persistence/src/schema.ts` | 0 | 32 lines |
| 3 (extra) | `grep -rn "REQUEST_ACTIVE\|SESSION_BUSY"` and `grep -rn activeFor` in `packages/` and `apps/` | 0 | Found the store check in `packages/session/persistence/src/requests.ts:85-88` |
| 4 | `git status --short` | 0 | Empty output. No path changed before this report. |
| 5 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 176 file(s) checked, 0 error(s) in 0 file(s)` |
| 5 | `uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py` on this report | 0 | `0 violations` |

## Site table

Classes are from the Site decision table in the task file. Rows follow the output order of the Step 2 command.

| ID | Location | Class | Record |
| --- | --- | --- | --- |
| RO1 | `packages/host/api/src/lifecycle/contracts.ts:24` | contract-field | `RequestRun` |
| RO2 | `packages/host/api/src/lifecycle/request-controller.ts:16` | contract-field | `Execution` (internal interface) |
| RO3 | `packages/host/api/src/lifecycle/request-controller.ts:64` | contract-field | Parameter of the `prepareTools` function type in the `RequestController` constructor |
| RO4 | `packages/host/api/src/lifecycle/request-controller.ts:68` | contract-field | Parameter of the `closingText` function type in the `RequestController` constructor |
| RO5 | `packages/host/api/src/lifecycle/request-controller.ts:76` | unclassified | Compares the chat of the saved request with the chat of the new request. The code is `GENERATION_LINK_CONFLICT`. See [Unclassified items](#unclassified-items). |
| RO6 | `packages/host/api/src/lifecycle/request-controller.ts:80` | chat-rule | `SESSION_BUSY`. The `admitting` set holds the chat. |
| RO7 | `packages/host/api/src/lifecycle/request-controller.ts:81` | chat-rule | No code on this line. `admitting.add` sets the guard that line 80 reads. |
| RO8 | `packages/host/api/src/lifecycle/request-controller.ts:83` | chat-rule | No code on this line. `busy.get` gives `previous`. Line 84 returns `SESSION_BUSY` when `previous` has not ended. |
| RO9 | `packages/host/api/src/lifecycle/request-controller.ts:88` | chat-rule | `SESSION_BUSY`. The `busy` map still holds the chat after the release wait of 5000 ms. |
| RO10 | `packages/host/api/src/lifecycle/request-controller.ts:89` | chat-rule | `SESSION_BUSY`. Store method `activeFor`. |
| RO11 | `packages/host/api/src/lifecycle/request-controller.ts:93` | pass-through | `prepareTools` |
| RO12 | `packages/host/api/src/lifecycle/request-controller.ts:100` | owner-key | Store method `admit` |
| RO13 | `packages/host/api/src/lifecycle/request-controller.ts:118` | pass-through | `Execution` object |
| RO14 | `packages/host/api/src/lifecycle/request-controller.ts:128` | chat-rule | No code on this line. `busy.set` holds the chat until the execution settles. Lines 83 and 88 read it. |
| RO15 | `packages/host/api/src/lifecycle/request-controller.ts:133` | pass-through | `RequestSnapshot` returned by `submit` |
| RO16 | `packages/host/api/src/lifecycle/request-controller.ts:139` | chat-rule | No code on this line. `admitting.delete` releases the guard of line 80. |
| RO17 | `packages/host/api/src/lifecycle/request-controller.ts:148` | pass-through | `RequestSnapshot` returned by `get` |
| RO18 | `packages/host/api/src/lifecycle/request-controller.ts:186` | contract-field | Parameter of the public method `RequestController.active` |
| RO19 | `packages/host/api/src/lifecycle/request-controller.ts:187` | chat-rule | No code on this line. Store method `activeFor` returns the active request ID of the chat or `undefined`. |
| RO20 | `packages/host/api/src/lifecycle/request-controller.ts:228` | pass-through | `start`, which receives a `RequestRun` |
| RO21 | `packages/host/api/src/lifecycle/request-controller.ts:265` | chat-rule | No code on this line. `busy.get` and `busy.delete` release the chat when the execution settles. |
| RO22 | `packages/host/api/src/lifecycle/request-controller.ts:269` | unclassified | Cache eviction of `executions` skips an item whose chat is in `busy`. See [Unclassified items](#unclassified-items). |
| RO23 | `packages/host/api/src/lifecycle/request-controller.ts:284` | pass-through | `closingText` |
| RO24 | `packages/host/api/src/lifecycle/request-controller.ts:367` | pass-through | `tools.execute`, which receives a `ToolContext` |
| RO25 | `packages/host/api/src/lifecycle/tool-contracts.ts:24` | contract-field | `ToolContext` |
| RO26 | `apps/web/src/integrations/opencode/contracts.ts:21` | contract-field | `RuntimeSessionAccess.read` |
| RO27 | `apps/web/src/integrations/opencode/contracts.ts:22` | contract-field | `RuntimeSessionAccess.requests` |
| RO28 | `apps/web/src/integrations/opencode/contracts.ts:24` | contract-field | `RuntimeSessionAccess.binding` |
| RO29 | `apps/web/src/integrations/opencode/contracts.ts:26` | contract-field | `RuntimeSessionAccess.unbind` |
| RO30 | `apps/web/src/integrations/opencode/events.ts:6` | contract-field | `OpenCodeEvent`, variant `step_start`. The field holds the OpenCode native session ID. |
| RO31 | `apps/web/src/integrations/opencode/events.ts:9` | contract-field | `OpenCodeEvent`, variant `text`. Native session ID. |
| RO32 | `apps/web/src/integrations/opencode/events.ts:14` | contract-field | `OpenCodeEvent`, variant `step_finish`. Native session ID. |
| RO33 | `apps/web/src/integrations/opencode/events.ts:17` | contract-field | `OpenCodeEvent`, variant `tool`. Native session ID. |
| RO34 | `apps/web/src/integrations/opencode/events.ts:24` | contract-field | `OpenCodeEvent`, variant `error`. Native session ID. |
| RO35 | `apps/web/src/integrations/opencode/events.ts:29` | contract-field | `OpenCodeEvent`, variant `other`. Native session ID. |
| RO36 | `apps/web/src/integrations/opencode/events.ts:49` | runtime-native | Reads `sessionID` from the raw event, before the `switch`. The read applies to every event type. |
| RO37 | `apps/web/src/integrations/opencode/events.ts:50` | runtime-native | Copies the native ID into `base`, which every event type spreads. |
| RO38 | `apps/web/src/integrations/opencode/runtime.ts:158` | pass-through | `folders`. The method hashes the chat ID into the per-chat runtime folder name (`runtime.ts:142`). |
| RO39 | `apps/web/src/integrations/opencode/runtime.ts:162` | owner-key | `sessions.binding` |
| RO40 | `apps/web/src/integrations/opencode/runtime.ts:163` | owner-key | `sessions.requests` |
| RO41 | `apps/web/src/integrations/opencode/runtime.ts:164` | pass-through | `sessions.read`. The call reads the message history of the chat. |
| RO42 | `apps/web/src/integrations/opencode/runtime.ts:176` | owner-key | `sessions.unbind` |
| RO43 | `apps/web/src/integrations/opencode/runtime.ts:185` | owner-key | `sessions.unbind` |
| RO44 | `apps/web/src/integrations/opencode/runtime.ts:196` | owner-key | `sessions.bind`, inside the `commit` callback |
| RO45 | `apps/web/src/integrations/opencode/stream-tracker.ts:92` | runtime-native | Event type: any event that has `sessionId`. The first native ID becomes `nativeSessionId`. |
| RO46 | `apps/web/src/integrations/opencode/stream-tracker.ts:93` | runtime-native | Event type: any event that has `sessionId`. A different native ID sets `protocolError`, and `classify` returns `RUNTIME_PROTOCOL` (`stream-tracker.ts:119`). |
| RO47 | `packages/host/contracts/src/requests.ts:14` | contract-field | `AgentRequest` |
| RO48 | `packages/host/contracts/src/requests.ts:95` | contract-field | `RequestSnapshot` |
| RO49 | `packages/host/contracts/src/requests.ts:107` | contract-field | `StoredRequest` |
| RO50 | `apps/web/src/features/requests/prepare-runtime.ts:39` | pass-through | `sessions.getInfo`. Line 40 returns `SESSION_NOT_FOUND` when the call gives no result. |
| RO51 | `apps/web/src/features/requests/prepare-runtime.ts:42` | pass-through | `sessions.read` |

## Rows for each class

| Class | Rows | IDs |
| --- | --- | --- |
| contract-field | 19 | RO1 to RO4, RO18, RO25 to RO35, RO47 to RO49 |
| runtime-native | 4 | RO36, RO37, RO45, RO46 |
| chat-rule | 9 | RO6 to RO10, RO14, RO16, RO19, RO21 |
| owner-key | 6 | RO12, RO39, RO40, RO42, RO43, RO44 |
| deck-scope | 0 | None |
| pass-through | 11 | RO11, RO13, RO15, RO17, RO20, RO23, RO24, RO38, RO41, RO50, RO51 |
| unclassified | 2 | RO5, RO22 |
| Total | 51 | |

Notes on the classes:

- RO30 to RO35 match the first row of the table (field in a type declaration), so they are `contract-field`. The field holds the OpenCode native session ID. It does not hold the chat ID.
- RO3, RO4 and RO18 are parameters of function types or of a class method. The report treats them as `contract-field` because the first row has no better match.
- The table has no row for the message history of a chat. RO41 and RO51 are `pass-through` for that reason. In both rows the code uses the chat ID as a key to read messages.
- No row has class `deck-scope`. No site in the four paths reads or writes deck, brief, outline or generation state with `sessionId`.

## Storage and wire facts

### 1. Tables with a `session_id` column

All lines are in `packages/session/persistence/src/schema.ts`. The `sessions` table (line 92) has an `id` column and no `session_id` column.

| Table | Line | `REFERENCES` clause |
| --- | --- | --- |
| `research_sources` | 13 | Yes: `REFERENCES sessions(id)` |
| `requests` | 23 | Yes: `REFERENCES sessions(id)` |
| `runtime_bindings` | 35 | Yes: `PRIMARY KEY REFERENCES sessions(id)`. One binding for each chat. |
| `attachments` | 44 | Yes: `REFERENCES sessions(id)`. Line 49 adds `FOREIGN KEY (session_id, message_sequence) REFERENCES messages(session_id, sequence)`. |
| `sources` | 54 | Yes: `REFERENCES sessions(id)` |
| `source_reads` | 69 | Yes: `REFERENCES sessions(id)` |
| `messages` | 98 | Yes: `REFERENCES sessions(id)`. The column is part of the primary key `(session_id, sequence)`. |

Two indexes use `session_id` for the chat rule and for lookup: `requests_one_active` (line 29) and `requests_session` (line 28).

### 2. Wire types with a `sessionId` field

All lines are in `packages/host/contracts/src/requests.ts`. The HTTP contract keeps these fields in Phase 1.

- `AgentRequest` (line 14)
- `RequestSnapshot` (line 95)
- `StoredRequest` (line 107)

### 3. Public methods of `RequestController`

All lines are in `packages/host/api/src/lifecycle/request-controller.ts`.

| Line | Method | Parameters |
| --- | --- | --- |
| 60 | `constructor` | `store: RequestStore`, `runtime: RequestRuntime`, `prepareTools?: (sessionId: string, attachmentIds?: readonly string[], publicResearch?: boolean) => Promise<PreparedTools>`, `closingText?: (sessionId: string, requestId: string, status: TerminalStatus) => string \| undefined` |
| 71 | `submit` | `request: AgentRequest`, `admission?: RequestAdmission` |
| 143 | `get` | `requestId: string` |
| 157 | `decide` | `requestId: string`, `approvalId: string`, `decision: 'allow-once' \| 'refuse'` |
| 180 | `events` | `requestId: string`, `after: number` |
| 186 | `active` | `sessionId: string` |
| 194 | `stop` | `requestId: string` |
| 208 | `subscribe` | `listener: (event: RequestEvent) => void` |
| 214 | `close` | None |

Only `submit` and `active` take the chat through `sessionId`. `submit` reads it from `request.sessionId`.

### 4. The lines that enforce one active request for each chat

Four lines in `request-controller.ts` return `SESSION_BUSY`:

- Line 80: a second `submit` for the same chat while the first `submit` is in admission (`admitting` set).
- Line 84: the execution of the chat has not ended (`busy` map, `previous.ended` is false). This line does not contain the word `sessionId`. It reads `previous` from line 83.
- Line 88: the `busy` map still holds the chat after the stopped execution had up to 5000 ms (`releaseWait`, line 30) to end.
- Line 89: the saved records show an active request for the chat (`store.activeFor`).

The store enforces the same rule in a second place, outside the four paths of Step 2:

- `packages/session/persistence/src/requests.ts:85-88`: `admit` selects an active request of the chat inside a transaction and throws `SessionError('REQUEST_ACTIVE')`.
- `packages/session/persistence/src/schema.ts:29`: the unique index `requests_one_active` on `requests(session_id)` where the status is `active` or `waiting_approval`.
- `request-controller.ts:42`: `mapAdmitError` maps `REQUEST_ACTIVE` to `SESSION_BUSY`.

A separate rule exists in `apps/web/src/features/workspaces/index.ts:32-37`. It refuses to remove or move a workspace when `sessions.requests.activeFor` finds an active request in one of its chats. The code is `WORKSPACE_REQUEST_ACTIVE`. This site does not use the word `sessionId` as a name, so the Step 2 command does not list it.

## Unclassified items

- RO5, `request-controller.ts:76`. `submit` can receive an `admission` for a request ID that is already saved. The code then compares the chat of the saved request with the chat of the new request. A difference gives `GENERATION_LINK_CONFLICT`. The site does not match any row. It does not test for an active request, and it does not use the chat as a key. It tests who owns a saved request.
- RO22, `request-controller.ts:269`. When the `executions` map holds more than 256 items, the code removes the first item whose execution ended and whose chat is not in `busy`. The site reads the `busy` map by chat. It does not reject or admit a request.

## What the commands do not prove

- `grep -w` finds the name `sessionId` only. It does not find a chat ID that the code passes under another name, for example `id` or `chatId`. RO38 shows one case: the method `folders(chatId)` in `runtime.ts:140` uses the name `chatId`, so the table does not list its uses.
- The counts do not include the files that implement `RequestStore`, `SqliteSessionStore` and `ToolContext` users. The report did not read the use of `ToolContext.sessionId` inside the tools (RO25). The report does not prove what the tools do with it.
- The report does not show that the chat rule works in every case. No test ran.
- The class of a site is a reading of the code around it. A person can check each row with the location column.
