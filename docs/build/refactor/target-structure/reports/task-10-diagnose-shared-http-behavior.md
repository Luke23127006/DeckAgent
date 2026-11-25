# Task 10: Diagnose the shared HTTP behavior and the error maps report

Read this file to learn the behavior that every HTTP request of the Local Host goes through, and where each error gets its HTTP status.

## Files changed

- `docs/build/refactor/target-structure/plan/task-10-diagnose-shared-http-behavior.md`: marked Steps 1 to 6 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 10 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index row.
- `docs/build/refactor/target-structure/reports/task-10-diagnose-shared-http-behavior.md`: added this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `wc -l packages/host/api/src/index.ts packages/host/api/src/transport/http-io.ts packages/host/api/src/transport/error-response.ts packages/host/api/src/transport/sse.ts packages/host/api/src/transport/multipart.ts apps/web/src/local-transport.ts` | 0 | `147`, `45`, `48`, `16`, `118`, `304` |
| 3 | `grep -rlF "<value>" e2e apps/web/tests packages/host/api/tests --include=*.test.mjs` for 25 values | 0 for 12 values, 1 for 13 values | File lists in the `Tests` column. 13 values found no file. |
| 4 | `grep -n "Record<.*number>\|=> number\|status:" packages/host/api/src/transport/error-response.ts apps/web/src/local-transport.ts` | 0 | 8 `Record` maps, one `=> number` parameter, 6 `status:` lines |
| 4 | `grep -rn "mapApplicationFailure\|failureMessage" apps/web/src packages/host/api/src` | 0 | 8 lines |
| 4 | `grep -n "new HttpError(" packages/host/api/src/transport/*.ts packages/host/api/src/index.ts` | 0 | 24 lines |
| 5 | `git status --short` | 0 | No output. After Step 6, the output shows the four files of this task only. |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `0 error(s)` |
| 6 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-10-diagnose-shared-http-behavior.md` | 0 | `0 violations` |

The `bash` on this machine is WSL2 bash. It shows the repository at `/mnt/c/Users/Duy/Desktop/DeckAgent`. The commands of Steps 1 to 5 ran in that shell.

The shell of this machine removes the quotation marks of a nested command. Step 3 ran from a temporary script file with the same 25 commands. The Step 4 pattern `<` needs a script file too, so the command ran as three separate `grep` commands with the same patterns.

`python` is not in the PATH of this machine. The environment provides `python3.12`, so the ste-lint command ran with `python3.12` and the same arguments.

## Behavior table

The rows follow the call order of the code. The location gives the file name and the line. `index.ts` is `packages/host/api/src/index.ts`. `http-io.ts`, `error-response.ts`, `sse.ts` and `multipart.ts` are in `packages/host/api/src/transport/`.

The `Express` column gives the IDs of [Express 5 defaults](../plan/task-10-diagnose-shared-http-behavior.md#express-5-defaults) that can change the stated effect. The column leaves E1 out on purpose, because E1 adds a header to every response. [Express default coverage](#express-default-coverage) lists the rows for E1.

| ID | Behavior | Location (file:line) | Observable effect | Class | Express | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | Sets `cache-control: no-store` on each response | `index.ts:39` | Each response has `cache-control: no-store` | security | none | Not found |
| B2 | Sets `x-content-type-options: nosniff` on each response | `index.ts:40` | Each response has `x-content-type-options: nosniff` | security | none | Not found |
| B3 | Sets `referrer-policy: no-referrer` on each response | `index.ts:41` | Each response has `referrer-policy: no-referrer` | security | none | Not found |
| B4 | Sets the default `content-security-policy` on each response | `index.ts:42` | Each response has the policy, with `default-src 'none'` and `frame-ancestors 'none'` | security | none | `e2e/browser-smoke.test.mjs` |
| B5 | Rejects a request when the `Host` header is not the Host origin | `index.ts:50` | `403 ORIGIN_DENIED` | security | none | Not found |
| B6 | Rejects a request when the `Origin` header is present and is not the Host origin | `index.ts:51` | `403 ORIGIN_DENIED` | security | none | Not found |
| B7 | Rejects a request when `sec-fetch-site` is `cross-site` | `index.ts:52` | `403 ORIGIN_DENIED` | security | none | `packages/host/api/tests/host-api.test.mjs` |
| B8 | Rejects a request that has a query string | `index.ts:103` | `400 INVALID_REQUEST` | parse | E8 | Not found |
| B9 | Sends each path that does not start with `/api/` to `serveAsset` | `index.ts:104` | The asset body, or `404 NOT_FOUND` | asset | E3, E4, E5, E9 | No search value |
| B10 | Rejects a request without the bearer token | `index.ts:108` | `401 AUTH_REQUIRED` | security | none | `apps/web/tests/brief-client.test.mjs`, `apps/web/tests/browser-runtime.test.mjs`, `apps/web/tests/outline-client.test.mjs` |
| B11 | Rejects a request after `close` starts | `index.ts:100` | `503 HOST_CLOSED` | error-shape | none | `packages/host/api/tests/request-failure.test.mjs` |
| B12 | Answers `404 NOT_FOUND` when no route matches | `index.ts:113` | `404 NOT_FOUND` with a JSON body | error-shape | E4, E5, E9 | `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/request-lifecycle.test.mjs`, `apps/web/tests/brief-host.test.mjs` |
| B13 | Stops a request that takes more than 10000 ms | `index.ts:89` | The server sends 408, or closes the connection, with no route response | limit (10000 ms) | none | Not found |
| B14 | Stops a request whose headers take more than 10000 ms | `index.ts:90` | The connection closes with no response | limit (10000 ms) | none | Not found |
| B15 | Closes the socket on a client parse error | `index.ts:91` | The client gets a closed connection and no response | unclassified | none | Not found |
| B16 | Listens on `127.0.0.1` only | `index.ts:119` | The Host accepts connections through the loopback address only | lifecycle | none | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/env-startup.test.mjs`, `e2e/generation-bridge.test.mjs` (31 total) |
| B17 | Runs the close steps one time for each Host | `index.ts:136` | Each `close` call returns the same promise | lifecycle | none | No search value |
| B18 | Stops the server from accepting connections | `index.ts:137` | The server refuses new connections, and `close` waits for the open connections | lifecycle | none | No search value |
| B19 | Ends each open SSE stream | `index.ts:140` | Each open stream ends | lifecycle | none | No search value |
| B20 | Closes all open connections | `index.ts:141` | The server destroys the open connections | lifecycle | none | No search value |
| B21 | Waits for the server and the request controller | `index.ts:142` | `close` resolves after both stop | lifecycle | none | No search value |
| B22 | Answers `404 NOT_FOUND` for an asset path that is not a known `GET` | `index.ts:59` | `404 NOT_FOUND` | asset | E3, E4, E5, E9 | `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/request-lifecycle.test.mjs`, `apps/web/tests/brief-host.test.mjs` |
| B23 | Sets the sandbox `content-security-policy` on a sandboxed asset | `index.ts:60` | The asset response has a policy with `sandbox` | security | E4 | `e2e/browser-smoke.test.mjs` |
| B24 | Answers `200` with the asset `content-type` and body | `index.ts:65` | `200`, the asset `content-type`, the asset body | asset | E2, E3, E4 | No search value |
| B25 | Rejects a request whose `Content-Type` is not `application/json` | `http-io.ts:12` | `415 JSON_REQUIRED` | parse | none | Not found |
| B26 | Rejects a JSON body over 262144 bytes | `http-io.ts:17` | `413 REQUEST_TOO_LARGE` | limit (262144 bytes) | none | Not found |
| B27 | Rejects a JSON body that `JSON.parse` fails on | `http-io.ts:23` | `400 INVALID_REQUEST` | parse | none | Not found |
| B28 | Reads the `Last-Event-ID` header as a cursor | `http-io.ts:29` | `0` when absent, the number when it has 1 to 15 digits, `400 INVALID_REQUEST` for another value | parse | none | `e2e/request-lifecycle.test.mjs` |
| B29 | Writes each JSON body as `application/json; charset=utf-8` | `http-io.ts:7` | Each JSON response has that content type | security | E2 | `e2e/attachment-admission.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/image-recovery-http.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/opencode-brief-live.test.mjs` (22 total) |
| B30 | Destroys the response when the error handler runs after the headers | `error-response.ts:31` | The Host destroys the connection and sends no JSON error body | error-shape | none | No search value |
| B31 | Answers `500 HOST_ERROR` when no error branch matches | `error-response.ts:38` | `500`, code `HOST_ERROR`, message `Request could not be completed` | error-shape | E6 | Not found |
| B32 | Sends each rejected route promise to `writeRouteError` | `index.ts:87` | A failed route becomes a JSON error response | error-shape | E10 | Not found |
| B33 | Rejects a 65th open SSE stream | `sse.ts:5` | `429 TOO_MANY_STREAMS` | limit (64 streams) | none | Not found |
| B34 | Opens each SSE response with the event-stream headers | `sse.ts:6` | `200`, `content-type: text/event-stream`, `x-accel-buffering: no` | security | none | Not found |
| B35 | Writes a heartbeat to each open stream every 15000 ms | `sse.ts:8` | The stream has a `: heartbeat` comment every 15000 ms | lifecycle | none | `apps/web/tests/browser-runtime.test.mjs` |
| B36 | Cleans up when a stream closes | `sse.ts:11` | The heartbeat stops, `onClose` runs, and the stream leaves the set | lifecycle | none | No search value |
| B37 | Accepts 1 multipart field | `multipart.ts:16` | `400 INVALID_REQUEST` on a second field | limit (1 field) | none | Not found |
| B38 | Accepts 1 multipart file | `multipart.ts:16` | `400 INVALID_REQUEST` on a second file | limit (1 file) | none | Not found |
| B39 | Accepts 3 multipart parts | `multipart.ts:16` | `400 INVALID_REQUEST` on a fourth part | limit (3 parts) | none | Not found |
| B40 | Accepts a field value of 32 bytes | `multipart.ts:16` | `400 INVALID_REQUEST` when Busboy truncates the field value | limit (32 bytes) | none | Not found |
| B41 | Accepts 20 header pairs in the part | `multipart.ts:16` | `400 INVALID_REQUEST` when the part has more header pairs | limit (20 pairs) | none | Not found |
| B42 | Accepts a file of `maxBytes + 1` bytes | `multipart.ts:16`, `multipart.ts:59` | `413 ATTACHMENT_TOO_LARGE` | limit (`maxBytes + 1` bytes) | none | `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs` |
| B43 | Rejects a multipart body over `maxBytes + 65536` bytes | `multipart.ts:93` | `413 ATTACHMENT_TOO_LARGE` | limit (`maxBytes + 64 KiB`) | none | `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs` |
| B44 | Rejects a missing or invalid `expectedRevision` field | `multipart.ts:39` | `400 INVALID_REQUEST` | parse | none | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/deck-pipeline.test.mjs` (8 total) |
| B45 | Rejects a request that fails during the upload | `multipart.ts:86` | `400 UPLOAD_CANCELLED` | parse | none | `e2e/attachment-storage.test.mjs` |

## Row count for each class

| Class | Rows | IDs |
| --- | --- | --- |
| `security` | 11 | B1, B2, B3, B4, B5, B6, B7, B10, B23, B29, B34 |
| `limit` | 11 | B13, B14, B26, B33, B37, B38, B39, B40, B41, B42, B43 |
| `parse` | 6 | B8, B25, B27, B28, B44, B45 |
| `error-shape` | 5 | B11, B12, B30, B31, B32 |
| `lifecycle` | 8 | B16, B17, B18, B19, B20, B21, B35, B36 |
| `asset` | 3 | B9, B22, B24 |
| `unclassified` | 1 | B15 |
| Total | 45 | B1 to B45 |

| `Tests` value | Rows | Count |
| --- | --- | --- |
| One or more file names | B4, B7, B10, B11, B12, B16, B22, B23, B28, B29, B35, B42, B43, B44, B45 | 15 |
| `Not found` | B1, B2, B3, B5, B6, B8, B13, B14, B15, B25, B26, B27, B31, B32, B33, B34, B37, B38, B39, B40, B41 | 21 |
| `No search value` | B9, B17, B18, B19, B20, B21, B24, B30, B36 | 9 |

## Express default coverage

| ID | Rows that it can change |
| --- | --- |
| E1 | E1 adds `X-Powered-By: Express` to every response. It changes none of the effects above. Rows that send a response through the application: B1 to B12, B22 to B29, B31 to B34, and B37 to B45. |
| E2 | B24, B29. B29 writes every JSON response. So E2 can also add an `ETag` to the error responses of B11, B12, B25 to B28, B31, B32 and B37 to B45. |
| E3 | B9, B22, B24 |
| E4 | B9, B12, B22, B23, B24 |
| E5 | B9, B12, B22 |
| E6 | B31 |
| E7 | None. Path parameters live in the route files, which [Task 9](task-09-inventory-http-routes.md) records. |
| E8 | B8 |
| E9 | B9, B12, B22 |
| E10 | B32 |

## Error map table

The location gives the file name and the line. `error-response.ts` is `packages/host/api/src/transport/error-response.ts`. `local-transport.ts` is `apps/web/src/local-transport.ts`.

| ID | Name | Location (file:line) | Number of codes | Error class | Owner |
| --- | --- | --- | --- | --- | --- |
| M1 | `requestFailureStatus` | `error-response.ts:7` | 16 | `RequestFailure` | lifecycle |
| M2 | `requestFailureResponse` | `error-response.ts:26` | 16, and 500 for another code | `RequestFailure` | lifecycle |
| M3 | `workspaceStatus` | `local-transport.ts:26` | 11 | `WorkspaceError` | package:workspace-registry |
| M4 | `mapWorkspaceError` | `local-transport.ts:149` | 11, from M3 | `WorkspaceError` | package:workspace-registry |
| M5 | `chatStatus` | `local-transport.ts:40` | 4 | `ChatWorkflowError` | feature:chats |
| M6 | `providerStatus` | `local-transport.ts:47` | 17 | `ProviderFailure` | feature:providers |
| M7 | `requestPreparationStatus` | `local-transport.ts:67` | 6 | `RequestPreparationFailure` | feature:requests |
| M8 | `researchStatus` | `local-transport.ts:76` | 9 | `ResearchFailure` | feature:research |
| M9 | `attachmentStatus` | `local-transport.ts:88` | 17 | `AttachmentFailure` | feature:attachments |
| M10 | `sourceToolStatus` | `local-transport.ts:108` | 4 | `SourceToolFailure` | feature:sources |
| M11 | `deckWorkflowStatus` | `local-transport.ts:115` | 17 entries: 16 codes and the `DESIGN_` prefix, and 500 for another code | `DeckWorkflowFailure` | feature:deck |
| M12 | `WorkspaceWorkflowError` branch | `local-transport.ts:180` | All codes of the class, each with 409 | `WorkspaceWorkflowError` | feature:workspaces |
| M13 | `SessionError` branch | `local-transport.ts:186` | 3, and no response for another code | `SessionError` | package:session-persistence |
| M14 | `DeckError` branch | `local-transport.ts:192` | 5, and no response for another code | `DeckError` | package:deck |
| M15 | `DraftError` branch | `local-transport.ts:203` | 3, which is all of `DraftErrorCode` | `DraftError` | unclassified |
| M16 | `WebStateError` branch | `local-transport.ts:207` | 4, which is all of `WebStateErrorCode` | `WebStateError` | unclassified |
| M17 | `featureFailure` | `local-transport.ts:159` | No code of its own. It takes the status from the map that the caller gives. | `ChatWorkflowError`, `ProviderFailure`, `RequestPreparationFailure`, `ResearchFailure`, `AttachmentFailure`, `SourceToolFailure` | mixed |
| M18 | `toAttachmentHttpError` | `local-transport.ts:249` | 17, from M9, and 500 for another code | `AttachmentFailure` | feature:attachments |

## Error map facts

### 1. The order in `writeRouteError`

`writeRouteError` (`error-response.ts:30`) tries the branches in this order:

1. `RequestFailure` gives the status and the code from M1 (`error-response.ts:36`). A code that M1 does not list gets 500, and the code stays the same (`error-response.ts:27`). This branch runs before the application map, so an application map cannot change the status of a `RequestFailure`.
2. Otherwise `options.mapApplicationFailure` gives a response (`error-response.ts:36`). Its status and its code win, and its `detail` wins over the `detail` of an `HttpError`.
3. Otherwise an `HttpError` gives its own `status` and `code` (`error-response.ts:37` to `:39`).
4. Otherwise the status is 500 and the code is `HOST_ERROR` (`error-response.ts:38` to `:39`).

The message comes from `options.failureMessage` with the code when branch 1, 2 or 3 answered (`error-response.ts:44`). When no branch matches, `failureMessage` receives the empty string. When `failureMessage` returns `undefined`, the message is `Request could not be completed`. The body has `error.detail` only when a detail exists.

### 2. The file that passes the two options

`apps/web/src/index.ts` passes both options to `startHost`. It sets `mapApplicationFailure` at line 302 and `failureMessage: deckFailureMessage` at line 303, inside `createHostOptions`. The call `startHost(createHostOptions(...))` is at line 376. `deckFailureMessage` comes from `@deckagent/deck`, and the import is at line 9.

### 3. Each code that has a status in more than one map

17 codes have a status in more than one map. Each code has the same status in every map.

| Code | Status | Maps |
| --- | --- | --- |
| `SESSION_NOT_FOUND` | 404 | M1, M5, M7, M9, M10, M11, M13 |
| `HOST_CLOSED` | 503 | M1, M9 |
| `HOST_BUSY` | 429 | M1, M9 |
| `DRAFT_CONFLICT` | 409 | M1, M9, M15 |
| `ATTACHMENT_REJECTED` | 409 | M1, M9 |
| `ATTACHMENT_NOT_READY` | 409 | M1, M9 |
| `ATTACHMENT_COUNT_EXCEEDED` | 413 | M1, M9 |
| `DRAFT_TOO_LARGE` | 413 | M5, M9, M13, M15 |
| `MODEL_NOT_SELECTABLE` | 409 | M5, M6 |
| `CHAT_UNREADABLE` | 409 | M5, M7, M13 |
| `INVALID_REQUEST` | 400 | M8, M9, M15, M16 |
| `SOURCE_ARGUMENTS_INVALID` | 400 | M8, M10 |
| `ATTACHMENT_NOT_FOUND` | 404 | M9, M10 |
| `SESSION_BUSY` | 409 | M1, M11 |
| `OUTLINE_STALE` | 409 | M11, M14 |
| `OUTLINE_ALREADY_CONFIRMED` | 409 | M11, M14 |
| `SETTINGS_STORAGE` | 500 | M6, M16 |

Two more facts about the status of a code:

- `UPLOAD_CANCELLED` has 409 in M9. `multipart.ts:89` throws `HttpError(400, 'UPLOAD_CANCELLED')` for the same code. A client sees 409 when an `AttachmentFailure` carries the code, and 400 when the request fails in `receiveAttachment`. This is the only code with two different statuses in the two paths.
- `OUTLINE_NOT_FOUND` has one map (M11) and two statuses. It gives 404 when `reason` is `restore-outline-missing`, and 409 for another reason (`local-transport.ts:116`).

### 4. Each `HttpError` that a route file throws with a literal status

The command of Step 4 found 24 calls. The call at `http-io.ts:41` does not have a literal status: it throws 413 when the code is `REQUEST_TEXT_TOO_LONG`, and 400 for another code.

| Location | Status | Code |
| --- | --- | --- |
| `packages/host/api/src/index.ts:54` | 403 | `ORIGIN_DENIED` |
| `packages/host/api/src/index.ts:59` | 404 | `NOT_FOUND` |
| `packages/host/api/src/index.ts:100` | 503 | `HOST_CLOSED` |
| `packages/host/api/src/index.ts:103` | 400 | `INVALID_REQUEST` |
| `packages/host/api/src/index.ts:109` | 401 | `AUTH_REQUIRED` |
| `packages/host/api/src/index.ts:113` | 404 | `NOT_FOUND` |
| `packages/host/api/src/transport/http-io.ts:12` | 415 | `JSON_REQUIRED` |
| `packages/host/api/src/transport/http-io.ts:17` | 413 | `REQUEST_TOO_LARGE` |
| `packages/host/api/src/transport/http-io.ts:23` | 400 | `INVALID_REQUEST` |
| `packages/host/api/src/transport/http-io.ts:31` | 400 | `INVALID_REQUEST` |
| `packages/host/api/src/transport/multipart.ts:28` | 400 | `INVALID_REQUEST` |
| `packages/host/api/src/transport/multipart.ts:59` | 413 | `ATTACHMENT_TOO_LARGE` |
| `packages/host/api/src/transport/multipart.ts:89` | 400 | `UPLOAD_CANCELLED` |
| `packages/host/api/src/transport/multipart.ts:94` | 413 | `ATTACHMENT_TOO_LARGE` |
| `packages/host/api/src/transport/multipart.ts:108` | 400 | `INVALID_REQUEST` |
| `packages/host/api/src/transport/multipart.ts:114` | 400 | `INVALID_REQUEST` |
| `packages/host/api/src/transport/request-routes.ts:66` | 503 | `REQUESTS_UNAVAILABLE` |
| `packages/host/api/src/transport/request-routes.ts:73` | 404 | `APPROVAL_NOT_FOUND` |
| `packages/host/api/src/transport/request-routes.ts:83` | 400 | `INVALID_REQUEST` |
| `packages/host/api/src/transport/request-routes.ts:89` | 404 | `REQUEST_NOT_FOUND` |
| `packages/host/api/src/transport/request-routes.ts:95` | 404 | `REQUEST_NOT_FOUND` |
| `packages/host/api/src/transport/session-routes.ts:70` | 400 | `INVALID_REQUEST` |
| `packages/host/api/src/transport/sse.ts:5` | 429 | `TOO_MANY_STREAMS` |
| `packages/host/api/src/transport/http-io.ts:41` | 413 or 400 | The code of `RequestValidationError` |

## Items with an unclassified class or owner

| Item | Reason |
| --- | --- |
| B15, the `clientError` handler | The handler sets no header, reads no request part, limits no value and writes no error body. It destroys the socket. No row of the behavior table matches. |
| M15, the `DraftError` branch | `DraftError` comes from `apps/web/src/draft-store.ts`. It is not in a folder of `apps/web/src/features/`, and it is not a package in `packages/`. |
| M16, the `WebStateError` branch | `WebStateError` comes from `apps/web/src/web-state.ts`. It is not in a folder of `apps/web/src/features/`, and it is not a package in `packages/`. |

## What the commands do not prove

1. The Express column comes from a list that the planner wrote. This task did not run Express and did not install it.
2. A test file that contains a value does not prove that the test checks the behavior. `127.0.0.1` is in every e2e helper, and `content-type` is in many assertions of no relation to B29.
3. A `Not found` row does not prove that no test checks the behavior. A test can check a status or a header without the error code. The search covers the three test folders only.
4. The counts of codes come from the `Record` literals and from the branches. A code that arrives at run time has no fixed count. Examples are the `DESIGN_` prefix, a `SessionError` code and an `AttachmentFailure` code that M9 does not list.
5. 21 rows have `Not found` in the `Tests` column. These rows are the risk in Review Focus item 11: the move to middleware can drop the behavior with no failed test. The five headers of B1, B2, B3 and B4 are the clearest example. Only `content-security-policy` appears in a test file.
6. `wc -l` counts the lines of the six files. It proves the start state only.
7. `git status --short` shows the tracked and the untracked files of this repository. It does not show a change outside the repository.
8. This report records the current behavior and the Express 5 defaults. It does not design the middleware and does not choose the place of the error map.
