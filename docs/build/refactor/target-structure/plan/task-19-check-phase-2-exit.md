# Task 19: Check the Phase 2 exit condition

Read this file to learn the steps of Task 19, which checks each part of the Phase 2 exit condition and stops.

The phase README gives the Phase 2 exit condition in four parts. (1) `apps/host/src/server.ts` and `http/` serve every current route through Express 5. (2) The `node:http` routing with regular expressions is gone. (3) The HTTP black-box tests pass without changes to their expected values. (4) Folder-level `no-restricted-imports` rules exist, each with a negative fixture (TS-09). This task runs one check for each part. It does not change code.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/build/refactor/target-structure/README.md` (section `## Abstract phase plan`, the Phase 2 row)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-19-check-phase-2-exit.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-19-check-phase-2-exit.md`
- Outside the repository: `deckagent-exit-diff.mjs` in the temporary folder of the system

**Interfaces:**

- Uses: the commit `34c8218`, which is the last commit before Phase 2 changed code, and the commit `533ef55`, which added `e2e/http-edge.test.mjs`. The result table of the report of Task 12.
- Produces: a report table `Part | Check | Result | Evidence`, with one row for each of the four parts.

**STOP when:**

- The output of a command does not match `Expected`. Write `FAIL` for the part and continue with the next part. STOP after the report.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change a file that is not in the `Files` block. This task does not change code.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Fix a failed check. Record it in the report.
- Change `docs/build/refactor/target-structure/README.md`. A person changes the phase status after approving the report.

- [x] **Step 1: Check the start state**

Run: `git status --short && git log -1 --format=%h`

Expected: PASS. `git status --short` prints no line. Write the commit hash in the report.

- [x] **Step 2: Part 1, every route goes through Express**

Run: `git grep -n "createServer(\|express()" -- apps/host/src/http packages/host/api/src`

Expected: PASS. The output has two lines: `apps/host/src/http/app.ts` with `express()` and `apps/host/src/http/start-host.ts` with `createServer(app)`.

Run: `git grep -c "router\.\(get\|put\|post\|delete\)(" -- packages/host/api/src/transport`

Expected: PASS. The counts are `deck-routes.ts:3`, `management-routes.ts:23`, `request-routes.ts:5` and `session-routes.ts:12`. The total is 43, which is the number of `/api/` routes R2 to R44 in the report of Task 9. Write the four counts in the report.

- [x] **Step 3: Part 2, no regular expression routing remains**

Run: `git grep -n "\.exec(pathname\|req\.method\|pathname ===" -- packages/host/api/src`

Expected: PASS. The command prints no line and exits with code 1.

Run: `git grep -n "\.exec(\|new RegExp" -- apps/host/src/http`

Expected: PASS. The command prints no line and exits with code 1. `apps/host/src/http/app.ts` compares `req.method` for the asset `GET` and for `HEAD` and `OPTIONS`. These two checks are not routing.

- [x] **Step 4: Part 3, the HTTP tests keep their expected values**

Save the script below as `deckagent-exit-diff.mjs` in the temporary folder of the system (`$env:TEMP` in PowerShell, `$TEMP` in Git Bash). The script lists each changed line of the test files since a commit. It skips import lines and path lines.

```js
import { execFileSync } from 'node:child_process'

const base = process.argv[2]
const diff = execFileSync(
  'git',
  ['diff', '-U0', '-M', '--diff-filter=MR', base, '--', 'e2e', 'apps/web/tests', 'apps/host/tests', 'packages/host/api/tests'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
)
const pathChange = /(import|from '|apps\/(web|host)\/|lib\/|@deckagent\/(local-web|host)|'apps', '(web|host)'|server\.js|index\.js|startHost)/
let file = ''
const other = []
for (const line of diff.split('\n')) {
  if (line.startsWith('+++ ')) file = line.slice(6)
  if (line.startsWith('+++') || line.startsWith('---')) continue
  if (!line.startsWith('+') && !line.startsWith('-')) continue
  const text = line.slice(1).trim()
  if (text === '' || pathChange.test(text)) continue
  other.push(`${file}: ${line}`)
}
const newFiles = execFileSync('git', ['diff', '--name-status', '-M', base, '--', 'e2e', 'apps/web/tests', 'apps/host/tests', 'packages/host/api/tests'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(line => line.startsWith('A'))
console.log(`added test files: ${newFiles.length}`)
for (const line of newFiles) console.log(line)
console.log(`changed lines that are not import or path lines: ${other.length}`)
for (const line of other) console.log(line)
```

Run from the repository root: `node <temporary folder>/deckagent-exit-diff.mjs 34c8218`

Expected: PASS. The output contains `added test files: 2`, the lines for `apps/host/tests/fixtures/http-host.mjs` and `e2e/http-edge.test.mjs`, and `changed lines that are not import or path lines: 0`.

Run: `node <temporary folder>/deckagent-exit-diff.mjs 533ef55`

Expected: PASS. The output contains `changed lines that are not import or path lines: 0`.

Run: `corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`.

Run each suite below. For each suite, write the exit code and the `# pass` and `# fail` lines in the report. When a suite fails, run it one more time.

| Suite | Expected |
| --- | --- |
| `corepack pnpm@11.28.5 test:http-edge` | `# pass 12`, `# fail 0` |
| `corepack pnpm@11.28.5 test:tools-browser` | `# pass 14`, `# fail 0` |
| `corepack pnpm@11.28.5 test:local-web` | `# pass 8`, `# fail 0` |
| `corepack pnpm@11.28.5 test:local-foundation` | `# pass 43`, `# fail 0` |
| `corepack pnpm@11.28.5 test:model-requests` | `# pass 29`, `# fail 0` |
| `corepack pnpm@11.28.5 test:source-permissions` | `# pass 11`, `# fail 0` |
| `corepack pnpm@11.28.5 test:attachments` | `# pass 29`, `# fail 0` |
| `corepack pnpm@11.28.5 test:research` | `# pass 5`, `# fail 0` |
| `corepack pnpm@11.28.5 test:images` | `# pass 39`, `# fail 0` |
| `corepack pnpm@11.28.5 test:outline-workflow` | `# pass 6`, `# fail 0` |
| `corepack pnpm@11.28.5 test:brief-foundation` | `# pass 15`, `# fail 0` |
| `corepack pnpm@11.28.5 test:deck-review` | `# pass 21`, `# fail 0` |
| `corepack pnpm@11.28.5 test:generation-publication` | `# pass 72`, `# fail 0` |
| `corepack pnpm@11.28.5 test:slide-pipeline` | `# pass 7`, `# fail 0` |
| `corepack pnpm@11.28.5 test:session-persistence` | `# pass 7`, `# fail 0` |
| `corepack pnpm@11.28.5 test:opencode-resources` | `# pass 3`, `# fail 0` |
| `corepack pnpm@11.28.5 test:layouts` | `# pass 10`, `# fail 0` |
| `corepack pnpm@11.28.5 test:browser-smoke` | `# pass 13`, `# fail 0` |
| `corepack pnpm@11.28.5 test:env-startup` | `# pass 2`, `# fail 0` |

- [x] **Step 5: Part 4, the folder-level rules have negative fixtures**

Run: `git grep -n "apps/host/src/http/\*\*\|\"@deckagent/host\"," -- .oxlintrc.json`

Expected: PASS. The output has two lines: the `files` pattern of the HTTP edge override and the `@deckagent/host` line of the Browser override.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 39` and `# fail 0`.

- [x] **Step 6: Write the report file and stop**

1. Mark Steps 1 to 5 as `- [x]` in this file. Change the Task 19 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-19-check-phase-2-exit.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-19-check-phase-2-exit.md` with:
   - H1 `# Task 19: Check the Phase 2 exit condition report` and the purpose line `Read this file to learn whether each part of the Phase 2 exit condition holds, with the evidence for each part.`
   - Files changed: the list of files.
   - The commit hash from Step 1.
   - The table `Part | Check | Result | Evidence`, with `PASS` or `FAIL` for each part.
   - The suite table from Step 4.
   - What the commands do not prove: Step 4 skips each line that has an import or a path. A changed expected value on such a line passes the check. The rules of Part 4 cover `apps/host/src/http/` and `apps/web/src/browser/` only. The rules for `apps/host/src/modules/` come with Phase 3.
3. Add a row for Task 19 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run the STE linter from Global Constraints on the report file. Expected: the output contains `0 violations`.
5. Mark Step 6 as `- [x]`.

**STOP** and send the report summary. Phase 3 starts after a person approves the report.

**Result:** Part 2 and Part 4 pass. Part 1 and Part 3 record `FAIL`. The last commit `4a6ee13` has no Phase 2 code, so `git grep` and `git diff` cannot see `apps/host/src/http/` and `apps/host/tests/fixtures/http-host.mjs`. The suites, the build, `lint` and `check:boundaries` pass. Step 6.1 does not apply, because the plan keeps the status `Pending` until all checks pass. See the [report](../reports/task-19-check-phase-2-exit.md).
