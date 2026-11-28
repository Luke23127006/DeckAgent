# Task 4: Diagnose the AgentRuntime port report

Read this file to learn which events, failure codes, usage data and timeout the current runtime contract has.

## Files changed

- `docs/build/refactor/target-structure/plan/task-04-diagnose-agent-runtime-port.md`: marked Steps 1 to 5 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 4 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index.
- `docs/build/refactor/target-structure/reports/task-04-diagnose-agent-runtime-port.md`: added this report.

No code, test, script or convention file changed.

## Commands run

All commands ran in Git Bash on Windows from the repository root.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| Before Step 1 | `git status --short` | 0 | Empty output. Task 3 was already committed (`5f36d48`). |
| Before Step 1 | `wc -l` on the six `Read first` code files | 0 | `46`, `6`, `397`, `115`, `294`, `219`. Every count equals the count in the task file. |
| 1 | `grep -rhoE` with `sort -u` and `wc -l` on the four files | 0 | `40` |
| 1 | `grep -rnoE` on the four files | 0 | 79 lines in the form `<path>:<line>:'<CODE>'`. |
| 3 | `grep -n "tokens"` on `fake-opencode.mjs` | 0 | One line: `519`, with `tokens: { input: 10, output: 5 }`. |
| 3 | `grep -n "case '"` on `events.ts` | 0 | 5 lines: 56, 58, 63, 70, 83. |
| 3 | `grep -n "timeoutMs"` on `runtime.ts` and `stream-tracker.ts` | 0 | 4 lines: `runtime.ts:35`, `runtime.ts:227`, `stream-tracker.ts:21`, `stream-tracker.ts:24`. |
| 3 (extra) | Grep of `timeoutMs`, `tokens` and `new OpenCodeRuntime(` in `apps/web/src` and `apps/web/tests` | 0 | See facts 2 and 4. |
| 4 | `git status --short` | 0 | Empty output before this report. No path changed. |
| 5 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 177 file(s) checked, 0 error(s) in 0 file(s)` |
| 5 | `uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py` on this report | 0 | `0 violations` |

## Code table

Origins and groups follow the [Code decision table](../plan/task-04-diagnose-agent-runtime-port.md#code-decision-table). The first matching row decides the origin. IDs follow the first line of each code in the Step 1 output. The column `OQ-063` has a value only for origins `provider-event` and `adapter`. A dash means that the origin has no OQ-063 value.

| ID | Code | Location | Origin | Group | OQ-063 |
| --- | --- | --- | --- | --- | --- |
| RT1 | `RUNTIME_UNAVAILABLE` | `runtime.ts:105`, `110`, `156`, `283`, `stream-tracker.ts:118` | adapter | `executable missing` (`runtime.ts:156`). `process did not start` (`audit.startFailed` at `runtime.ts:283`, `result.startFailed` at `stream-tracker.ts:118`). Lines 105 and 110 are an availability reason and an `OpenCodeError`, not an outcome. | none |
| RT2 | `RUNTIME_VERSION_UNSUPPORTED` | `runtime.ts:106`, `112` | unclassified | Availability reason (106) and `OpenCodeError` code (112). See [Unclassified items](#unclassified-items). | - |
| RT3 | `NEW_RUNTIME_SESSION` | `runtime.ts:177`, `186` | notice | The adapter emits it at 177 when a native session binding exists but the resume guard fails. The adapter emits it at 186 when a resumed attempt did no work and failed. | - |
| RT4 | `RUNTIME_INCOMPLETE` | `runtime.ts:191`, `stream-tracker.ts:126` | adapter | `attempt completed without native session ID` (`runtime.ts:191`). `no step ran, no finish reason, finish reason is tool-calls, or no native session ID` (`stream-tracker.ts:125`). | none |
| RT5 | `PROVIDER_UNSUPPORTED` | `runtime.ts:223` | adapter | `runtimeConfiguration` throws `UnsupportedProviderError`. | none |
| RT6 | `RUNTIME_FAILED` | `events.ts:114`, `runtime.ts:223`, `stream-tracker.ts:123`, `request-controller.ts:250` | provider-event | Fallback of `errorCode`: no `statusCode`, no matching `name`, no `imageUnsupported`. The same code is also an adapter outcome. `runtime.ts:223` returns it for a configuration error other than `UnsupportedProviderError`. `stream-tracker.ts:123` returns it for a process exit code other than 0. It is also a lifecycle outcome at `request-controller.ts:250`, where `start` threw. | none |
| RT7 | `REQUEST_TIMEOUT` | `runtime.ts:282`, `stream-tracker.ts:117` | adapter | `timer expired` (`timedOut()` is true). | timeout |
| RT8 | `STOPPED` | `runtime.ts:282`, `stream-tracker.ts:116` | adapter | `run.signal aborted` and the timer did not expire. | none |
| RT9 | `RUNTIME_CONFIG_UNSAFE` | `runtime.ts:291` | adapter | `debug config` exit code is not 0, or `safeConfiguration` is false. | none |
| RT10 | `CONTEXT_SUMMARY_FAILED` | `stream-tracker.ts:107`, `163`, `209` | adapter | The code sets `this.failure` and `classify` returns it (`stream-tracker.ts:121`). Conditions: a summary is still open at the end (107). The summary step finished with reason `error` or `content-filter` (163). A context overflow error came while a summary was open (209). | content blocked (line 163 only, with reason `content-filter`. Reason `error` shares the line) |
| RT11 | `RUNTIME_PROTOCOL` | `stream-tracker.ts:119` | adapter | `protocolError` is true (a line is not an event, or the native session ID changed), or `result.malformed`. | none |
| RT12 | `REQUEST_NOT_SAVED` | `stream-tracker.ts:120`, `request-controller.ts:45`, `175`, `176`, `243`, `289`, `328`, `329`, `378`, `379`, `384` | adapter | `localAborted`: the local abort controller fired and no earlier condition matched. The lifecycle uses the same code 10 times for store write failures. | none |
| RT13 | `PROVIDER_AUTH` | `events.ts:108` | provider-event | `statusCode 401`, `statusCode 403` or `name ProviderAuthError`. | key rejected |
| RT14 | `PROVIDER_RATE_LIMIT` | `events.ts:109` | provider-event | `statusCode 429`. | rate limit |
| RT15 | `CONTEXT_LIMIT` | `events.ts:110` | provider-event | `name` matches `/context\|overflow/i`. | none |
| RT16 | `IMAGE_INPUT_UNAVAILABLE` | `events.ts:111` | provider-event | `imageUnsupported` is true. `parseEvent` sets it from a regex on the provider message (`events.ts:88-90`). | none |
| RT17 | `PROVIDER_MODEL_UNAVAILABLE` | `events.ts:112` | provider-event | `statusCode 404`. | none |
| RT18 | `PROVIDER_HTTP` | `events.ts:113` | provider-event | Any other `statusCode` from 100 to 599. | none |
| RT19 | `DRAFT_CONFLICT` | `request-controller.ts:33` | lifecycle | `admit`. The literal is in the set `admitFailureCodes`. `mapAdmitError` (lines 40-46) turns a store code in this set into a `RequestFailure`. | - |
| RT20 | `ATTACHMENT_COUNT_EXCEEDED` | `request-controller.ts:34` | lifecycle | `admit`. Same path as RT19. | - |
| RT21 | `ATTACHMENT_REJECTED` | `request-controller.ts:35` | lifecycle | `admit`. Same path as RT19. | - |
| RT22 | `ATTACHMENT_NOT_READY` | `request-controller.ts:36` | lifecycle | `admit`. Same path as RT19. | - |
| RT23 | `REQUEST_EMPTY` | `request-controller.ts:37` | lifecycle | `admit`. Same path as RT19. | - |
| RT24 | `REQUEST_ACTIVE` | `request-controller.ts:42` | unclassified | A store error code that `mapAdmitError` reads and maps to `SESSION_BUSY`. See [Unclassified items](#unclassified-items). | - |
| RT25 | `SESSION_BUSY` | `request-controller.ts:42`, `80`, `84`, `88`, `89` | lifecycle | `submit` (admission checks) and `admit` (mapped from `REQUEST_ACTIVE`). | - |
| RT26 | `SESSION_NOT_FOUND` | `request-controller.ts:43` (two literals) | lifecycle | `admit` (`mapAdmitError`). | - |
| RT27 | `HOST_CLOSED` | `request-controller.ts:72`, `94` | lifecycle | `submit`. | - |
| RT28 | `GENERATION_LINK_CONFLICT` | `request-controller.ts:76` | lifecycle | `submit` with an `admission` whose saved request belongs to another chat. | - |
| RT29 | `HOST_BUSY` | `request-controller.ts:90` | lifecycle | `submit` when 16 or more chats are busy. | - |
| RT30 | `GENERATION_LINK_FAILED` | `request-controller.ts:113`, `114` | lifecycle | `admission.admitted()` throws. Line 113 saves a failed status through `store.finish`. Line 114 throws a `RequestFailure`. | - |
| RT31 | `REQUEST_NOT_FOUND` | `request-controller.ts:145`, `172`, `181`, `197` | lifecycle | `get` (145), `events` (181), `stop` (197). Line 172 in `decide` only compares a store code. | - |
| RT32 | `APPROVAL_NOT_FOUND` | `request-controller.ts:158`, `172` | lifecycle | `decide`. | - |
| RT33 | `APPROVAL_CONFLICT` | `request-controller.ts:173` | lifecycle | `decide`. | - |
| RT34 | `REQUEST_CLOSED` | `request-controller.ts:173`, `348`, `371`, `375` | lifecycle | `decide` (173). Lines 348, 371 and 375 are the text of a `ToolResult` that goes back to the runtime, not a `RequestFailure`. | - |
| RT35 | `HOST_STOPPED` | `request-controller.ts:217` | lifecycle | `close`. It is the `errorCode` of an `interrupted` status. | - |
| RT36 | `TOOL_NOT_ALLOWED` | `request-controller.ts:349` | unclassified | Text of a `ToolResult` for a tool name that is not in `tools.schemas`. See [Unclassified items](#unclassified-items). | - |
| RT37 | `SESSION_STORAGE` | `request-controller.ts:377` | unclassified | A code read from an error that `tools.execute` threw. See [Unclassified items](#unclassified-items). | - |
| RT38 | `SESSION_CLOSED` | `request-controller.ts:377` | unclassified | Same as RT37. | - |
| RT39 | `SESSION_CORRUPT` | `request-controller.ts:377` | unclassified | Same as RT37. | - |
| RT40 | `TOOL_FAILED` | `request-controller.ts:386` | unclassified | Text of a `ToolResult` when `tools.execute` throws an error with no `SOURCE_*` code. See [Unclassified items](#unclassified-items). | - |

## Count of rows for each origin

| Origin | Rows | IDs |
| --- | --- | --- |
| provider-event | 7 | RT6, RT13 to RT18 |
| adapter | 9 | RT1, RT4, RT5, RT7 to RT12 |
| lifecycle | 16 | RT19 to RT23, RT25 to RT35 |
| notice | 1 | RT3 |
| other | 0 | - |
| unclassified | 7 | RT2, RT24, RT36 to RT40 |
| Total | 40 | |

## OQ-063 category coverage

OQ-063 lists the categories key rejected, quota, network, rate limit and content blocked. OQ-062 adds timeout. This list uses only the conditions in the table, not the code names.

| Category | Condition that shows it | Note |
| --- | --- | --- |
| key rejected | RT13: `statusCode 401`, `statusCode 403` or `name ProviderAuthError` | The condition does not show other reasons for a 403. |
| rate limit | RT14: `statusCode 429` | The condition does not show whether a provider also uses 429 for an exhausted quota. |
| timeout | RT7: the attempt timer expired | This is the DeckAgent clock for the whole attempt (fact 4). It is not a provider response timeout. |
| content blocked | RT10 at `stream-tracker.ts:163`: the summary step ended with reason `content-filter` | The line shares the condition with reason `error`. No code shows this category for a normal model step. |
| quota | No condition | A provider quota error with a status code other than 429 goes to RT18 (`PROVIDER_HTTP`), or to RT6 (`RUNTIME_FAILED`) with no status code. |
| network | No condition | No condition in the four files shows a network failure. |

## Facts of Step 3

### Fact 1: Run events and their emit sites

`RuntimeEvent` is `RequestEventBody` without `status` and `approval` (`contracts.ts:6`). It has three members: `activity`, `text` and `notice` (`requests.ts:74-82`). The runtime emits through `run.emit`.

| Kind | Emitted at | Notes |
| --- | --- | --- |
| `activity`, `type: 'model'` | `stream-tracker.ts:134` (helper `activity`), called at 143, 158, 174, 200, 204 | Label `Model response` at 158, 174 and 200. Label `Conversation summary` at 143 and 204. Status values used: `running`, `completed`, `failed`. The type also allows `stopped`, but no adapter code emits it. |
| `activity`, `type: 'tool'` | `stream-tracker.ts:193` | Only for a tool name that does not start with `deckagent_`. |
| `text` | `stream-tracker.ts:185` | One event for each changed text part. |
| `notice` | `runtime.ts:177`, `runtime.ts:186` (`NEW_RUNTIME_SESSION`), `stream-tracker.ts:170` (`summarizedNotice`) | `summarizedNotice` is the string `CONVERSATION_SUMMARIZED` in `packages/session/persistence/src/request-queries.ts:9`. |

The lifecycle also writes events without the runtime. `request-controller.ts:354-360` writes `activity` events with `type: 'tool'` for Host tools. `request-controller.ts:285` writes a `text` event with part `generation-summary`.

### Fact 2: OpenCode events, dropped fields and tokens

`parseEvent` reads five types from `opencode run --format json`. All other types become `{ type: 'other' }` (`events.ts:101-102`).

| OpenCode type | `case` line | Fields kept | Fields dropped |
| --- | --- | --- | --- |
| `step_start` | 56 | `sessionID`, `part.messageID` | All other fields of `part`. |
| `text` | 58 | `sessionID`, `part.messageID`, `part.id`, `part.text` | `part.type` and all other fields. |
| `step_finish` | 63 | `sessionID`, `part.messageID`, `part.reason` | `part.tokens`, `part.id`, `part.type` and all other fields. |
| `tool_use` | 70 | `sessionID`, `part.callID` or `part.id`, `part.tool`, `part.state.status` | The tool input, the tool output and all other fields of `part.state`. |
| `error` | 83 | `sessionID`, `error.name`, `error.data.statusCode`, and a flag `imageUnsupported` | `error.data.message` and `error.data.responseBody`. `parseEvent` reads both only for the regex test at `events.ts:88-90`. |

Every event also loses its top-level `timestamp`. The file comment at `events.ts:1-4` states this rule.

Line 519 of `fake-opencode.mjs` is `event('step_finish', { id: 'prt_finish', type: 'step-finish', reason: 'stop', tokens: { input: 10, output: 5 } })`. The helper `event` (line 74-75) puts the second argument in `part`. So the raw `step_finish` part has a `tokens` field. `parseEvent` does not keep it: the `step_finish` case reads only `part.reason` (`events.ts:68`), and the type `OpenCodeEvent` has no `tokens` field (`events.ts:14`). A grep of `apps/web/src` for the word `tokens` finds only the markdown regex in `apps/web/src/browser/features/chats/message-content.ts`. No code in `apps/web/src` reads token usage from OpenCode.

`stream-tracker.ts` keeps a private counter `modelSteps` (line 67, incremented at 156). It only builds the activity ID `model-N`. No code reports the counter.

### Fact 3: Fields of `RuntimeOutcome`

`RuntimeOutcome` (`contracts.ts:32-34`) is one of two shapes:

- `{ status: 'completed'; commit?(): void }`
- `{ status: 'failed'; errorCode: string }`

No field carries usage data. `errorCode` is a free `string`. The status event has the same free `errorCode?: string` (`requests.ts:73`). The types do not hold failure categories. The adapter type `AttemptResult` (`stream-tracker.ts:7-11`) adds `nativeSessionId` and `noWork`. It is internal to the adapter.

### Fact 4: Timeout

- Default: `600_000` ms (`runtime.ts:227`).
- Option: `OpenCodeOptions.timeoutMs` (`runtime.ts:35`), read at `runtime.ts:227`. In `apps/web/src`, the only code that passes it is the option object `options.openCode` that `index.ts:257` hands to the constructor. No other file in `apps/web/src` sets it.
- Code on expiry: `REQUEST_TIMEOUT` (`stream-tracker.ts:117`). The check of the configuration before the model call returns the same code (`runtime.ts:282`).
- The clock covers one attempt. An approval wait pauses it, and the remaining time continues after the wait (`stream-tracker.ts:36-43`). A resumed attempt that falls back to a new session starts a second clock (`runtime.ts:187`).
- Other `timeoutMs` names are different options: `provider-catalog.ts:122-125` (model list request, default `20_000`), `index.ts:235` (`30_000`), and the provider connection setting that `cli.ts:26` checks. The version check has a fixed `30_000` ms (`runtime.ts:127`).

### Fact 5: Where `RequestController` turns an outcome into a terminal status

`request-controller.ts:252-257`, in `run`:

- `completed` calls `this.end(execution, 'completed')`.
- `failed` calls `this.end(execution, 'failed', outcome.errorCode)`.
- `end` (`request-controller.ts:277-300`) saves the status with `store.finish` (line 293) and then publishes the events.

Other facts from the same code:

- If `start` throws, the outcome becomes `RUNTIME_FAILED` (lines 249-251).
- If the execution already ended (Stop, Host close or a refused write), the controller ignores the outcome (line 252).
- If the closing text cannot be saved, a `completed` status becomes `failed` with `REQUEST_NOT_SAVED` (lines 287-290).
- `commit` runs only after the controller saves a `completed` status (lines 257-263).

## Unclassified items

No row of the decision table matches these seven literals. The table assigns them to origin `unclassified`. A person decides the origin.

| ID | Code | Why no row matches |
| --- | --- | --- |
| RT2 | `RUNTIME_VERSION_UNSUPPORTED` | The code is an availability reason (`runtime.ts:106`) and an `OpenCodeError` code (`runtime.ts:112`). It is not in a `{ status: 'failed', errorCode }` outcome. |
| RT24 | `REQUEST_ACTIVE` | The controller reads this store code and maps it to `SESSION_BUSY`. It never returns the literal. |
| RT36 | `TOOL_NOT_ALLOWED` | It is the text of a `ToolResult` that goes to the runtime. It is not a `RequestFailure`, an `HttpError` or a status event. |
| RT37 | `SESSION_STORAGE` | The controller reads this code from an error that `tools.execute` throws, and ends the request with `REQUEST_NOT_SAVED`. |
| RT38 | `SESSION_CLOSED` | Same as RT37. |
| RT39 | `SESSION_CORRUPT` | Same as RT37. |
| RT40 | `TOOL_FAILED` | It is the text of a `ToolResult` when `tools.execute` throws an error with no `SOURCE_*` code. |

Four more rows need a reviewer to check the choice:

- RT19 to RT23: the literals are in a set, not in a `RequestFailure`. The set feeds `mapAdmitError`, so the table uses origin `lifecycle`.
- RT6: `events.ts:114` matches first, so the origin is `provider-event`. The same code is also an adapter outcome and a lifecycle outcome.
- RT12: `stream-tracker.ts:120` matches first, so the origin is `adapter`. 10 of the 11 sites are lifecycle store write failures.
- RT10: the code reaches `classify` through `this.failure`, not through a literal in `classify`. The table uses origin `adapter`.

## What the commands do not prove

- The fake OpenCode fixture is not the real OpenCode 1.19.5 output. The report does not prove that real `step_finish` events carry `tokens`.
- No live test ran. The report does not show which `statusCode` or `name` a real provider sends for a rejected key, an exhausted quota or a blocked content.
- The report reads the code. It does not run it. For example, the statement that `stream-tracker.ts:125` does not reject a final step with reason `content-filter` comes from the code, not from a test.
- The code count covers literals with four or more upper-case letters and underscores in single quotes in four files. The table has no code that the program builds from a variable, such as `code` at `request-controller.ts:44` and `173`. It has no code from another file.
