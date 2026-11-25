# Task 19: Check the Phase 2 exit condition report

Read this file to learn whether each part of the Phase 2 exit condition holds, with the evidence for each part.

## Files changed

- `docs/build/refactor/target-structure/plan/task-19-check-phase-2-exit.md`: marked Steps 1 to 6 as done and recorded the result.
- `docs/build/refactor/target-structure/plan/README.md`: added the link to this report in the Task 19 row.
- `docs/build/refactor/target-structure/reports/README.md`: added the index row of this report.
- `docs/build/refactor/target-structure/reports/task-19-check-phase-2-exit.md` (new): this report.

## Start state

Step 1 printed 29 lines. The task expects no line. The commit hash is `4a6ee13`, with the subject `upload task 17 - 19 plan`. The branch `refactor` points to this commit. A `git fetch` shows that `origin/refactor` points to the same commit.

All 29 lines are the uncommitted work of Task 17 and Task 18. Git does not track two of these paths: `apps/host/src/http/` and `apps/host/tests/fixtures/http-host.mjs`.

`git grep` and `git diff` read tracked files only. They cannot see an untracked file. Part 1 and Part 3 record `FAIL` for this reason. The same commands with the flag `--untracked` give the expected output.

## Result table

| Part | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `git grep -n "createServer(\|express()" -- apps/host/src/http packages/host/api/src` | FAIL | Exit code 1 and no output, because the folder `apps/host/src/http/` has no commit. The same command with `--untracked` prints two lines. `apps/host/src/http/app.ts:49` has `const app = express()`. `apps/host/src/http/start-host.ts:19` has `const server = createServer(app)`. |
| 1 | `git grep -c "router\.\(get\|put\|post\|delete\)(" -- packages/host/api/src/transport` | PASS | `deck-routes.ts:3`, `management-routes.ts:23`, `request-routes.ts:5`, `session-routes.ts:12`. The total is 43, which is the count of routes R2 to R44 in the Task 9 report. |
| 2 | `git grep -n "\.exec(pathname\|req\.method\|pathname ===" -- packages/host/api/src` | PASS | Exit code 1 and no output. The same command with `--untracked` also gives no output. |
| 2 | `git grep -n "\.exec(\|new RegExp" -- apps/host/src/http` | PASS | Exit code 1 and no output. The same command with `--untracked` also gives no output. |
| 3 | `node <temporary folder>/deckagent-exit-diff.mjs 34c8218` | FAIL | `added test files: 1`. The task expects 2. The output has the line `A e2e/http-edge.test.mjs`. The fixture `apps/host/tests/fixtures/http-host.mjs` has no commit, so `git diff` omits it. `changed lines that are not import or path lines: 0`. |
| 3 | `node <temporary folder>/deckagent-exit-diff.mjs 533ef55` | PASS | `added test files: 0` and `changed lines that are not import or path lines: 0`. |
| 3 | `corepack pnpm@11.28.5 build`, `corepack pnpm@11.28.5 lint`, `corepack pnpm@11.28.5 check:boundaries` | PASS | Exit code 0 for each command. The last command prints `check-boundaries: 0 violation(s)`. |
| 3 | The 19 suites of the next table | PASS | Each suite gives the expected count of `# pass` and `# fail 0`. All 19 exit codes are 0. |
| 4 | `git grep -n 'apps/host/src/http/\*\*\|"@deckagent/host",' -- .oxlintrc.json` | PASS | Two lines. `.oxlintrc.json:68` has `"@deckagent/host",` in the Browser override. `.oxlintrc.json:86` has the `files` pattern of the HTTP edge override. The check ran in the `cmd.exe` form, because PowerShell 5.1 deletes a double quote from a native command argument. |
| 4 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | PASS | `# tests 39`, `# pass 39` and `# fail 0` with exit code 0. |

Phase 2 exit: FAIL.

Part 1 fails on the first check only. Part 3 fails on the first check only. Part 2 and Part 4 pass. The two failed checks read a commit, and the Phase 2 code has no commit. A commit of the working tree can make both checks pass. No code change is necessary.

## Suites

| Suite | Exit code | Output |
| --- | --- | --- |
| `corepack pnpm@11.28.5 test:http-edge` | 0 | `# pass 12`, `# fail 0` |
| `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# pass 14`, `# fail 0` |
| `corepack pnpm@11.28.5 test:local-web` | 0 | `# pass 8`, `# fail 0` |
| `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# pass 43`, `# fail 0` |
| `corepack pnpm@11.28.5 test:model-requests` | 0 | `# pass 29`, `# fail 0` |
| `corepack pnpm@11.28.5 test:source-permissions` | 0 | `# pass 11`, `# fail 0` |
| `corepack pnpm@11.28.5 test:attachments` | 0 | `# pass 29`, `# fail 0` |
| `corepack pnpm@11.28.5 test:research` | 0 | `# pass 5`, `# fail 0` |
| `corepack pnpm@11.28.5 test:images` | 0 | `# pass 39`, `# fail 0` |
| `corepack pnpm@11.28.5 test:outline-workflow` | 0 | `# pass 6`, `# fail 0` |
| `corepack pnpm@11.28.5 test:brief-foundation` | 0 | `# pass 15`, `# fail 0` |
| `corepack pnpm@11.28.5 test:deck-review` | 0 | `# pass 21`, `# fail 0` |
| `corepack pnpm@11.28.5 test:generation-publication` | 0 | `# pass 72`, `# fail 0` |
| `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | `# pass 7`, `# fail 0` |
| `corepack pnpm@11.28.5 test:session-persistence` | 0 | `# pass 7`, `# fail 0` |
| `corepack pnpm@11.28.5 test:opencode-resources` | 0 | `# pass 3`, `# fail 0` |
| `corepack pnpm@11.28.5 test:layouts` | 0 | `# pass 10`, `# fail 0` |
| `corepack pnpm@11.28.5 test:browser-smoke` | 0 | `# pass 13`, `# fail 0` |
| `corepack pnpm@11.28.5 test:env-startup` | 0 | `# pass 2`, `# fail 0` |

No suite failed, so no suite ran a second time. The total is 369 passing tests.

## What the commands do not prove

- Step 4 skips each line that has an import or a path. A changed expected value on such a line passes the check.
- The rules of Part 4 cover `apps/host/src/http/` and `apps/web/src/browser/` only. The rules for `apps/host/src/modules/` come with Phase 3.
- `git grep` and `git diff` read a commit. They do not prove the state of the working tree. A file with no commit is invisible to them.

## Run after the commit

A person made the commit `4d42e0f` with the work of Tasks 17 and 18. Then the two failed checks ran again on that commit, in Git Bash from `C:/Users/Duy/Desktop/DeckAgent`.

| Part | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git grep -n "createServer(|express()" -- apps/host/src/http packages/host/api/src` | 0 | Two lines: `apps/host/src/http/app.ts:49` has `const app = express()`. `apps/host/src/http/start-host.ts:19` has `const server = createServer(app)`. |
| 3 | `node <temporary folder>/deckagent-exit-diff.mjs 34c8218` | 0 | `added test files: 2`, the lines `A apps/host/tests/fixtures/http-host.mjs` and `A e2e/http-edge.test.mjs`, and `changed lines that are not import or path lines: 0`. |
| 3 | `node <temporary folder>/deckagent-exit-diff.mjs 533ef55` | 0 | `changed lines that are not import or path lines: 0`. |

Phase 2 exit after the commit: PASS. All four parts pass.

## Result for the plan

Step 6.1 asks for the status `Done` in the Task 19 row. The plan gate says that a task is `Done` only when all its checks pass. Part 1 and Part 3 fail, so the row stayed `Pending` until the run after the commit. That run passes, so the Task 19 row is `Done`.
