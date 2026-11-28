# Task 9: Inventory the HTTP routes

Read this file to learn the steps of Task 9, which records each current HTTP route of the Local Host and then stops.

Phase 2 serves every current route through Express 5. Express matches paths and methods in a different way from the current regular expressions. This task records each route and the facts that can change when Express matches it. It does not design the Express routes.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `packages/host/api/src/index.ts` (147 lines)
- `packages/host/api/src/transport/session-routes.ts` (158 lines)
- `packages/host/api/src/transport/deck-routes.ts` (37 lines)
- `packages/host/api/src/transport/management-routes.ts` (147 lines)
- `packages/host/api/src/transport/request-routes.ts` (105 lines)
- `packages/host/api/src/transport/multipart.ts` (118 lines)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-09-inventory-http-routes.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-09-inventory-http-routes.md`

**Interfaces:**

- Uses: the functions `routeSession`, `routeManagement` and `routeRequests` that `startHost` in `packages/host/api/src/index.ts` calls in this order, and the function `routeDeck` in `packages/host/api/src/transport/deck-routes.ts`.
- Produces: a report with one row for each route, with IDs `R1`, `R2`, and so on. Each row has the columns `ID | Method | Path pattern | Location (file:line) | Body | Status | Condition | Flags | Tests`.

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
- Propose an Express route, a router file or a file name for the new code.

## Column rules

| Column | What to write |
| --- | --- |
| Method | The value that the code compares with `req.method`. When the code does not compare `req.method`, write `any`. |
| Path pattern | The regular expression or the string that the code compares with the path, as it is in the code. |
| Location | The file and the line of the method check. When there is no method check, the line of the path check. |
| Body | `none`, `json` (the route calls `readJson` or `readAgentRequest`), `multipart` (the route calls `receiveAttachment`), `sse` (the route calls `openSseStream`) or `other` with the function name. |
| Status | The status code of the success response, for example `200`, `201` or `202`. |
| Condition | Each check other than the method and the path that the route must pass, for example `management.research` or `workspaceId !== 'selected'`. Write `none` when there is no check. |
| Flags | The flags from the [Route decision table](#route-decision-table), separated with commas. Write `none` when no row matches. |
| Tests | The test files that the command in Step 3 finds for the route. Write `Not found` when the command finds no file. |

## Route decision table

Apply each row to each route. A route can get more than one flag.

| Signal | Action |
| --- | --- |
| The route has no `req.method` check | Flag `any-method`. |
| A path parameter has a character class other than `[^/]` (for example `[\w-]{1,100}`, `[\w.-]{1,100}`, `\d{1,10}`, `[1-9][0-9]{0,9}` or `need-[a-f0-9]{64}`) | Flag `param-pattern`. Write the character class of each parameter in the report. |
| A request that matches this route can also match a route that the code checks before it. For example, a literal segment such as `selected` is in the same position as a parameter | Flag `order`. Write the ID of the other route. |
| The route exists only when an optional object of `HostOptions` or `WebManagement` is present | Flag `optional`. Write the name of the object. |
| The route throws an `HttpError` before it calls the handler, for example `REQUESTS_UNAVAILABLE` when `controller` is `undefined` | Flag `route-error`. Write the status and the code. |
| No row matches | Write `none` in `Flags`. When the route has a behavior that the columns do not show, add the item to the report. Do not change it. |

- [x] **Step 1: Check the start state**

Run: `for f in management request session deck; do grep -c "req.method" packages/host/api/src/transport/$f-routes.ts; done`

Expected: PASS. The output is four lines: `23`, `4`, `12` and `0`. FAIL: any other number.

- [x] **Step 2: List and classify each route**

Run: `grep -n "req.method\|\.exec(\|pathname ===\|pathname.startsWith" packages/host/api/src/transport/*-routes.ts`

Expected: PASS. The command exits with code 0.

Read the four route files in full. Start at `route` in `packages/host/api/src/index.ts` and follow the calls in the order of the code. Write one row for each pair of a method and a path that returns a response. A branch that checks two methods on one path is two rows. Fill each column with the [Column rules](#column-rules) and the [Route decision table](#route-decision-table).

Also write these facts in the report, with file and line:

1. The order in which `route` in `packages/host/api/src/index.ts` calls the route functions, and what happens when no function returns `true`.
2. The checks that `route` does before it calls a route function, in their order.
3. The paths that do not start with `/api/`, and the function that answers them.

- [x] **Step 3: Find the tests of each route**

For each route, take the last literal segment of the path pattern, for example `attachments`, `decision` or `catalog`. For a route without a literal segment after `/api/`, take the full path, for example `/api/sessions`. Run this command with the segment:

Run: `grep -rlF "<segment>" e2e apps/web/tests packages/host/api/tests --include=*.test.mjs`

Expected: PASS. The command exits with code 0 or 1. Code 1 means that no file contains the segment.

Write the file names in the `Tests` column. When the command finds more than five files, write the first five and the total number.

- [x] **Step 4: Find the Browser client of each route**

Run: `grep -rn "/api/" apps/web/src/browser/transport`

Expected: PASS. The command exits with code 0.

For each route, write in the report the function in `apps/web/src/browser/transport/` that calls the route. Write `Not called by the Browser` when no function calls the route.

- [x] **Step 5: Check that no code changed**

Run: `git status --short`

Expected: PASS. No path under `apps/`, `packages/`, `e2e/`, `tests/`, `scripts/` or `docs/conventions/` is in the output.

- [x] **Step 6: Write the report file and stop**

1. Mark Steps 1 to 5 as `- [x]` in this file. Change the Task 9 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-09-inventory-http-routes.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-09-inventory-http-routes.md` with:
   - H1 `# Task 9: Inventory the HTTP routes report` and the purpose line `Read this file to learn each current HTTP route of the Local Host and the facts that can change when Express matches it.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - The route table from Step 2 and Step 3.
   - A count of routes for each flag.
   - The three facts from Step 2.
   - The Browser client of each route from Step 4.
   - Items that the decision table sent to the report.
   - What the commands do not prove: the search in Step 3 finds a file that contains the segment. It does not prove that the test calls the route or checks its response.
3. Add a row for Task 9 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-09-inventory-http-routes.md`. Expected: the output contains `0 violations`.
5. Mark Step 6 as `- [x]`.

**STOP** and send the report summary. Do not start Task 10 until a person approves the route table.
