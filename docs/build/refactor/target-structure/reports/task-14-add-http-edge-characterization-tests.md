# Task 14: Add the HTTP edge characterization tests report

Read this file to learn which shared HTTP behaviors the new tests check, and the proof that the tests can fail.

## Files changed

- `e2e/http-edge.test.mjs`: new file with 12 tests.
- `package.json`: added the script `test:http-edge` after the line of `test:env-startup`.
- `docs/build/refactor/target-structure/plan/task-14-add-http-edge-characterization-tests.md`: marked Steps 1 to 7 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 14 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index row.
- `docs/build/refactor/target-structure/reports/task-14-add-http-edge-characterization-tests.md`: added this report.

## Behaviors that the tests check

| Test | Behavior | Task 10 ID |
| --- | --- | --- |
| 1 | An API response and a page response carry the four security headers. Neither response has `x-powered-by` or `etag`. | B1, B2, B3, B4 |
| 2 | A foreign `Host` header and a foreign `Origin` header get `403 ORIGIN_DENIED`. | B5, B6 |
| 3 | A query string gets `400 INVALID_REQUEST` with the fixed message. | B8 |
| 4 | `HEAD` and `OPTIONS` get `404`. The `OPTIONS` response has no `allow` header. | B12 |
| 5 | A trailing slash and two other letter cases get `404 NOT_FOUND` with a JSON body. | B12 |
| 6 | A chat ID of 100 word characters reaches the route, which answers `SESSION_NOT_FOUND`. 101 characters or a `%20` gets `404 NOT_FOUND`. | B12, Task 9 flag `param-pattern` |
| 7 | A body with `content-type: text/plain` gets `415 JSON_REQUIRED`. | B25 |
| 8 | A JSON body of 262144 bytes reaches the route, which answers `INVALID_SESSION`. 262145 bytes gets `413 REQUEST_TOO_LARGE`. | B26 |
| 9 | A JSON body that does not parse gets `400 INVALID_REQUEST`. | B27 |
| 10 | A multipart body with two `expectedRevision` fields gets `400 INVALID_REQUEST`. | B37 |
| 11 | A stream opens with `200`, `text/event-stream`, `x-accel-buffering: no` and `cache-control: no-store`. The 65th open stream gets `429 TOO_MANY_STREAMS`. | B33, B34 |
| 12 | Bytes that are not HTTP close the connection with no response bytes. | B15 |

The 12 tests cover 15 behaviors that have a Task 10 ID. They also cover 2 route facts of Task 9. One fact is the absent `x-powered-by` and `etag` headers. The other fact is the character class of the chat ID parameter.

## Commands run

Git Bash is not installed on this machine. Every command ran in PowerShell 5.1 from the repository root. Step 1 counts lines with `(Get-Content <file>).Count`, because PowerShell has no `wc -l`. PowerShell has no `python` command, so the linter at Step 7 runs with `python3` from WSL.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `(Get-Content <file>).Count` for the three source files, then `git status --short` | 0 | `147`, `45`, `16`, and no line from `git status --short` |
| 2 | Create `e2e/http-edge.test.mjs`. Add one line to `package.json`. | 0 | No output |
| 3 | `corepack pnpm@11.28.5 build` | 0 | The 12 workspace builds complete. The last line is `Build complete in 43ms`. |
| 3 | `corepack pnpm@11.28.5 lint` | 0 | No output |
| 4 | `corepack pnpm@11.28.5 test:http-edge` | 0 | `ok 1` to `ok 12`, `# pass 12`, `# fail 0`, `# duration_ms 24185` |
| 5 | `corepack pnpm@11.28.5 build` with the two breaks | 0 | The 12 workspace builds complete |
| 5 | `corepack pnpm@11.28.5 test:http-edge` with the two breaks | 1 | `not ok 1 - API and page responses carry the four security headers and no X-Powered-By or ETag`, `not ok 11 - A deck stream opens with event-stream headers, and the 65th open stream gets 429 TOO_MANY_STREAMS`, `# pass 10`, `# fail 2` |
| 5 | `git checkout -- packages/host/api/src/index.ts packages/host/api/src/transport/sse.ts`, then `build` and `test:http-edge` | 0 | `# pass 12`, `# fail 0` |
| 6 | `git status --short` | 0 | ` M package.json` and `?? e2e/http-edge.test.mjs` |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 199 file(s) checked, 0 error(s) in 0 file(s)` |
| 7 | `wsl python3 -I .agents/skills/asd-ste100/scripts/ste-lint.py <this file>` | 0 | `0 violations (0 hard, baseline 0), 681 words, 0.0 per 100 words` |

The first `git status --short` call at Step 1 printed several files as staged, including the files of Task 13. A second call printed no line, because Git refreshed the index. The worktree did not change, and the Task 13 changes were already committed before Task 14 started.

In the failed run at Step 5, test 11 stopped at the `cache-control` assertion on line 227 of the test file. Test 1 stopped at the `cache-control` assertion on line 74. The run shows that test 1 and test 11 can fail. It does not show which of the two breaks caused the failure of test 11.

## Behaviors that the task does not test

| Behavior (Task 10 ID) | Reason |
| --- | --- |
| `requestTimeout` and `headersTimeout` of 10000 ms (B13, B14) | A test must wait 10 seconds of real time. Testware forbids a fixed wait. |
| Heartbeat every 15000 ms (B35) | Same reason. |
| `500 HOST_ERROR` (B31) | No HTTP request can make a route throw an unknown error. |
| Field size, part count and header pair limits of multipart (B39, B40, B41) | The rule for `expectedRevision` rejects the same inputs with the same `400 INVALID_REQUEST`. A black-box test cannot see which check rejected the input. |

## What the commands do not prove

The tests check one request for each behavior. They do not prove the behavior for each route. Step 5 breaks two behaviors only, so it proves that two of the 12 tests can fail.

The tests record the current behavior. They do not check that this behavior agrees with a requirement.
