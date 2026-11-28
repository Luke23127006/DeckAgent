# Task 17: Serve every route through Express report

Read this file to learn how the Local Host serves its routes through Express 5.2.1, and the result of each check after the change.

## Files changed

- `packages/host/api/package.json`: add `express` 5.2.1 and `@types/express` 5.0.6.
- `apps/host/package.json`: add `express` 5.2.1 and `@types/express` 5.0.6.
- `pnpm-lock.yaml`: record the two new packages.
- `packages/host/api/src/transport/route-params.ts` (new): the helpers `WORD_ID`, `params`, `param` and `route`.
- `packages/host/api/src/transport/deck-routes.ts`: replace `routeDeck` with `registerDeckRoutes`.
- `packages/host/api/src/transport/session-routes.ts`: replace `routeSession` with `registerSessionRoutes`.
- `packages/host/api/src/transport/management-routes.ts`: replace `routeManagement` with `registerManagementRoutes`.
- `packages/host/api/src/transport/request-routes.ts`: replace `routeRequests` with `registerRequestRoutes`.
- `packages/host/api/src/transport/error-response.ts`: deleted. `apps/host/src/http/error-handler.ts` replaces it.
- `packages/host/api/src/index.ts`: export `createHostRoutes` and `HostRoutes` in place of `startHost`.
- `apps/host/src/http/app.ts` (new): `createHttpApp` builds the Express app.
- `apps/host/src/http/error-handler.ts` (new): `writeRouteError` maps an error to a response.
- `apps/host/src/http/start-host.ts` (new): `startHost` runs the HTTP server.
- `apps/host/tests/fixtures/http-host.mjs` (new): re-export `startHost` for tests outside `apps/host/`.
- `apps/host/tests/http-server.test.mjs`: moved from `packages/host/api/tests/host-api.test.mjs`. One import changes.
- `apps/host/src/server.ts`: one import changes.
- `apps/web/tests/browser-runtime.test.mjs`: one import changes.
- `e2e/attachment-admission.test.mjs`: one import changes.
- `e2e/request-lifecycle.test.mjs`: one import changes.
- `e2e/attachment-storage.test.mjs`: one import changes.
- `package.json`: the script `test:tools-browser` names the moved test file.
- `AGENTS.md`: the section `## Tech Stack` gives the Express version.
- `docs/conventions/project-structure.md`: the mapping table of `## Trong lúc chuyển` gives the new paths.
- `docs/build/refactor/target-structure/plan/task-17-serve-routes-through-express.md`: mark Steps 1 to 9 as done.
- `docs/build/refactor/target-structure/plan/README.md`: change the Task 17 row to `Done`.
- `docs/build/refactor/target-structure/reports/README.md`: add the index row of this report.
- `docs/build/refactor/target-structure/reports/task-17-serve-routes-through-express.md`: add this report.

## Commands run

Every command ran in PowerShell 5.1 from `C:/Users/Duy/Desktop/DeckAgent`. The `bash` command in this PATH starts WSL, not Git Bash, so the shell of the task was PowerShell. PowerShell has no `python` command, so the linter of Step 9 runs with `python3` from WSL.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | Five lines, all in `docs/build/`. See the note below the table. |
| 1 | `node -e "for (const f of process.argv.slice(1)) console.log(...)" <six files>` | 0 | `147`, `158`, `147`, `105`, `37`, `48` in the order of the task. |
| 2 | `corepack pnpm@11.28.5 --filter @deckagent/host-api --filter @deckagent/host add express@5.2.1` | 0 | `+2` and `Done in 8s using pnpm v11.28.5`. |
| 2 | `corepack pnpm@11.28.5 --filter @deckagent/host-api --filter @deckagent/host add -D @types/express@5.0.6` | 0 | `+9` and `Done in 8.7s using pnpm v11.28.5`. |
| 2 | `Get-Content` on the two `package.json` files | 0 | `packages/host/api/package.json` and `apps/host/package.json` each show `"express": "5.2.1"` and `"@types/express": "5.0.6"`. |
| 2 | `git --no-pager diff --stat pnpm-lock.yaml` | 0 | `pnpm-lock.yaml \| 120` and `1 file changed, 120 insertions(+)`. |
| 4 | `git rm packages/host/api/src/transport/error-response.ts` | 0 | `rm 'packages/host/api/src/transport/error-response.ts'`. |
| 4 | `git mv packages/host/api/tests/host-api.test.mjs apps/host/tests/http-server.test.mjs` | 0 | No output. |
| 5 | `node "$env:TEMP\deckagent-express-edits.mjs"` | 0 | `express-edits: 10 files changed, 0 failures`. |
| 6 | `corepack pnpm@11.28.5 build` | 0 | The build ends with `Build complete`. No TypeScript error. |
| 6 | `corepack pnpm@11.28.5 lint` | 0 | No line from oxlint. |
| 6 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 6 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# pass 35` and `# fail 0`. |
| 6 | `git grep -n --untracked "createServer\|\.exec(pathname\|req\.method" -- packages/host/api/src` | 1 | No line. |
| 6 | `git grep -n --untracked "createServer(" -- apps/host/src packages/host/api/src` | 0 | Two lines: `apps/host/src/http/start-host.ts:19` and `apps/host/src/integrations/opencode/mcp-bridge.ts:138`. |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 204 file(s) checked, 0 error(s) in 0 file(s)`. |
| 8 | `git status --short` | 0 | 18 changed paths and 3 untracked paths. All of them are in the `Files` block of the task. |
| 9 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 205 file(s) checked, 0 error(s) in 0 file(s)`. |
| 9 | `wsl python3 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-17-serve-routes-through-express.md` | 0 | `0 violations (0 hard, baseline 0)`. |

Step 1 has one deviation. The first `git status --short` showed three lines in `docs/build/`: two modified README files and three untracked task files of Revision 2c. No code file was different, and the six line counts matched `Expected`. A commit `4a6ee13` then recorded those documents. The output of Step 8 matched `Expected` with no extra line.

The script of Step 5 changed 9 files. Its last line names `10 files`. The text of Step 3 of the task gives this line, so the report keeps it as is.

## Suites of Step 7

`test:images` failed on the first run. The test `Create deck prepares images, then MCP templates v3 publish all seven layouts through the real local renderer` fails in its cleanup hook with `EBUSY: resource busy or locked, unlink ...\Cache\No_Vary_Search\journal.baj`. The second run passes. No route is in that test.

| Suite | Command | Exit code | `# pass` | `# fail` |
| --- | --- | --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | 0 | 12 | 0 |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | 0 | 14 | 0 |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | 0 | 8 | 0 |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | 0 | 43 | 0 |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | 0 | 29 | 0 |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | 0 | 11 | 0 |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | 0 | 29 | 0 |
| test:research | `corepack pnpm@11.28.5 test:research` | 0 | 5 | 0 |
| test:images | `corepack pnpm@11.28.5 test:images` | 1, then 0 | 38, then 39 | 1, then 0 |
| test:outline-workflow | `corepack pnpm@11.28.5 test:outline-workflow` | 0 | 6 | 0 |
| test:brief-foundation | `corepack pnpm@11.28.5 test:brief-foundation` | 0 | 15 | 0 |
| test:deck-review | `corepack pnpm@11.28.5 test:deck-review` | 0 | 21 | 0 |
| test:generation-publication | `corepack pnpm@11.28.5 test:generation-publication` | 0 | 72 | 0 |
| test:slide-pipeline | `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | 7 | 0 |
| test:session-persistence | `corepack pnpm@11.28.5 test:session-persistence` | 0 | 7 | 0 |
| test:opencode-resources | `corepack pnpm@11.28.5 test:opencode-resources` | 0 | 3 | 0 |
| test:layouts | `corepack pnpm@11.28.5 test:layouts` | 0 | 10 | 0 |
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | 13 | 0 |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | 0 | 2 | 0 |

The second run of `test:images` gives the expected result of the task. All other suites give the expected result on the first run.

## What the commands do not prove

- The tests check the routes and the behaviors that they call. A route that no test calls can have a wrong parameter class.
- A path with dot segments, for example `/api/x/../sessions`, has no test.
- The route files keep the order of the current code, and the tests pass. The tests do not prove that the order of two routes that never collide is the same as before.
- The two `git grep` commands prove that no regular expression routing and no `node:http` server remain in `packages/host/api/src/`. They do not prove that each new route keeps its status code and its conditions. Only the suites of Step 7 give evidence for that.
- `test:images` failed one time on a Windows file lock in a cleanup hook. The second run passes. The failure is not in the HTTP edge, but one run gives no proof that the failure cannot occur again.
