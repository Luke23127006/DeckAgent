# Task 10: Diagnose the shared HTTP behavior and the error maps

Read this file to learn the steps of Task 10, which records the shared HTTP behavior and the error maps of the Local Host.

Phase 2 keeps the bearer check, the origin check, the security headers and the SSE cursor behavior, and moves them into Express middleware. Express 5 has default behaviors that the current server does not have. This task records each current behavior and the Express default that can change it. It also records the facts for the `Open` point in Project Structure about the place of the error map. It does not design the middleware or decide the place of the error map.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/project-structure.md` (section `## Dependency rules`, the `Open` paragraph at the end)
- `packages/host/api/src/index.ts` (147 lines)
- `packages/host/api/src/transport/http-io.ts` (45 lines)
- `packages/host/api/src/transport/error-response.ts` (48 lines)
- `packages/host/api/src/transport/http-error.ts` (12 lines)
- `packages/host/api/src/transport/sse.ts` (16 lines)
- `packages/host/api/src/transport/multipart.ts` (118 lines)
- `packages/host/api/src/transport/contracts.ts` (144 lines)
- `apps/web/src/local-transport.ts` (304 lines)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-10-diagnose-shared-http-behavior.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-10-diagnose-shared-http-behavior.md`

**Interfaces:**

- Uses: `startHost`, `setSecurityHeaders`, `checkOrigin` and `serveAsset` in `packages/host/api/src/index.ts`. `writeRouteError` and `requestFailureStatus` in `packages/host/api/src/transport/error-response.ts`. `mapApplicationFailure` in `apps/web/src/local-transport.ts`. The options `mapApplicationFailure` and `failureMessage` of `HostOptions` in `packages/host/api/src/transport/contracts.ts`.
- Produces: a report with one row for each shared behavior, with IDs `B1`, `B2`, and so on. The report also has one row for each error map, with IDs `M1`, `M2`, and so on.

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
- Install a package or run Express.
- Propose a middleware, a file name or a place for the error map.

## Express 5 defaults

The planner took this list from the Express 5 API reference. Do not check the list. Use the IDs in the `Express` column of the behavior table.

| ID | Express 5 default |
| --- | --- |
| E1 | Each response has the header `X-Powered-By: Express` until the app calls `app.disable('x-powered-by')`. |
| E2 | `res.send` and `res.json` add a weak `ETag` header. |
| E3 | A `GET` route also answers `HEAD`. |
| E4 | Routing ignores letter case and ignores a trailing slash. `/API/sessions/` matches `/api/sessions`. |
| E5 | A request that no route matches gets status 404 with an HTML body `Cannot <METHOD> <path>`. |
| E6 | An error that no error handler takes gets status 500 with an HTML body. |
| E7 | A path parameter such as `:id` matches one or more characters other than `/`, and Express decodes it with `decodeURIComponent`. |
| E8 | Express parses the query string into `req.query`. |
| E9 | The router answers `OPTIONS` with an `Allow` header when no route handles `OPTIONS`. |
| E10 | A rejected promise from an async handler goes to the error handler. |

## Behavior decision table

Apply the rows from top to bottom to each behavior. Use the first row that matches.

| Signal | Action |
| --- | --- |
| The code sets a response header, or checks the `Host`, `Origin`, `Sec-Fetch-Site` or `Authorization` header | Class `security`. |
| The code limits a size, a count or a time, for example `256 * 1024`, `streams.size >= 64` or `requestTimeout` | Class `limit`. Write the value. |
| The code reads or checks the request body, the query string, the `Content-Type` header or the `Last-Event-ID` header | Class `parse`. |
| The code writes the error body or chooses the status of an error | Class `error-shape`. |
| The code runs when the Host starts or closes, or when a stream opens or closes | Class `lifecycle`. |
| The code answers a path that does not start with `/api/` | Class `asset`. |
| No row matches | Class `unclassified`. Add the item to the report. Do not change it. |

## Error map decision table

Apply the rows from top to bottom to each error map. Use the first row that matches.

| Signal | Action |
| --- | --- |
| The map gives a status for the codes of one error class that one folder in `apps/web/src/features/` exports | Owner `feature:<name>`, for example `feature:chats`. |
| The map gives a status for the codes of one error class that one package in `packages/` exports | Owner `package:<name>`, for example `package:workspace-registry`. |
| The map gives a status for the codes of `RequestFailure` from `packages/host/api/src/lifecycle/` | Owner `lifecycle`. |
| The map gives a status for the codes of more than one error class | Owner `mixed`. Write each error class. |
| No row matches | Owner `unclassified`. Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `wc -l packages/host/api/src/index.ts packages/host/api/src/transport/http-io.ts packages/host/api/src/transport/error-response.ts packages/host/api/src/transport/sse.ts packages/host/api/src/transport/multipart.ts apps/web/src/local-transport.ts`

Expected: PASS. The line counts are `147`, `45`, `48`, `16`, `118` and `304`. FAIL: any other number.

- [ ] **Step 2: List and classify each shared behavior**

Read `packages/host/api/src/index.ts`, `http-io.ts`, `error-response.ts`, `http-error.ts`, `sse.ts` and `multipart.ts` in full. Write one row for each behavior in the report table `ID | Behavior | Location (file:line) | Observable effect | Class | Express | Tests`.

- `Behavior`: one sentence, for example `Rejects a request that has a query string`.
- `Observable effect`: the status, the error code, the header or the body that a client sees, for example `400 INVALID_REQUEST`.
- `Class`: the class from the [Behavior decision table](#behavior-decision-table).
- `Express`: the IDs from [Express 5 defaults](#express-5-defaults) that can change the effect, separated with commas. Write `none` when no ID applies.
- `Tests`: leave empty in this step.

Include at least these behaviors, each in its own row:

- In `packages/host/api/src/index.ts`: each header in `setSecurityHeaders`, each condition in `checkOrigin`, the query string check, the bearer check and the `HOST_CLOSED` check.
- Also in `index.ts`: the 404 `NOT_FOUND` at the end of `route`, `requestTimeout`, `headersTimeout`, the `clientError` handler, the `127.0.0.1` listen address and each step of `close`.
- The `headersSent` branch of `writeRouteError`.
- The body limit and the `Content-Type` check of `readJson`, and the `Last-Event-ID` check of `parseCursor`.
- The stream limit, the heartbeat and the `x-accel-buffering` header of `openSseStream`.
- Each limit in `multipart.ts`.

- [ ] **Step 3: Find the tests of each behavior**

For each row from Step 2, take the error code or the header name, for example `ORIGIN_DENIED`, `TOO_MANY_STREAMS` or `x-content-type-options`. Run this command with the value:

Run: `grep -rlF "<value>" e2e apps/web/tests packages/host/api/tests --include=*.test.mjs`

Expected: PASS. The command exits with code 0 or 1. Code 1 means that no file contains the value.

Write the file names in the `Tests` column. Write `Not found` when the command finds no file. For a row without an error code or a header name, write `No search value`.

- [ ] **Step 4: List and classify each error map**

Run: `grep -n "Record<.*number>\|=> number\|status:" packages/host/api/src/transport/error-response.ts apps/web/src/local-transport.ts`

Expected: PASS. The command exits with code 0.

Write one row for each map or function that gives an HTTP status for an error code, in the report table `ID | Name | Location (file:line) | Number of codes | Error class | Owner`. Use the [Error map decision table](#error-map-decision-table) for `Owner`.

Also write these facts in the report, with file and line:

1. The order in which `writeRouteError` tries `RequestFailure`, `mapApplicationFailure` and `HttpError`, and the status and the code when no branch matches.
2. The file that passes `mapApplicationFailure` and `failureMessage` to `startHost`. Run `grep -rn "mapApplicationFailure\|failureMessage" apps/web/src packages/host/api/src`.
3. Each error code that has a status in more than one map. Write `None` when no code has two statuses.
4. Each `HttpError` that a route file throws with a literal status. Run `grep -n "new HttpError(" packages/host/api/src/transport/*.ts packages/host/api/src/index.ts`.

- [ ] **Step 5: Check that no code changed**

Run: `git status --short`

Expected: PASS. No path under `apps/`, `packages/`, `e2e/`, `tests/`, `scripts/` or `docs/conventions/` is in the output.

- [ ] **Step 6: Write the report file and stop**

1. Mark Steps 1 to 5 as `- [x]` in this file. Change the Task 10 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-10-diagnose-shared-http-behavior.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-10-diagnose-shared-http-behavior.md` with:
   - H1 `# Task 10: Diagnose the shared HTTP behavior and the error maps report` and the purpose line `Read this file to learn the behavior that every HTTP request of the Local Host goes through, and where each error gets its HTTP status.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - The behavior table from Steps 2 and 3.
   - A count of rows for each class, and a count of rows with `Not found` in `Tests`.
   - For each ID from [Express 5 defaults](#express-5-defaults), the IDs of the rows that it can change.
   - The error map table and the four facts from Step 4.
   - Items with class `unclassified` or owner `unclassified`.
   - What the commands do not prove: the Express column comes from a list that the planner wrote. This task did not run Express. A test file that contains a value does not prove that the test checks the behavior.
3. Add a row for Task 10 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-10-diagnose-shared-http-behavior.md`. Expected: the output contains `0 violations`.
5. Mark Step 6 as `- [x]`.

**STOP** and send the report summary. Do not start Task 11 until a person approves the behavior table and the error map table.
