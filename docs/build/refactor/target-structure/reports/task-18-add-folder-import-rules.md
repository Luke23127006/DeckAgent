# Task 18: Add the folder-level import rules for the HTTP edge and the Browser report

Read this file to learn which import rules now guard the HTTP edge and the Browser, and the proof that each rule can fail.

## Files changed

- `.oxlintrc.json`: add `@deckagent/host` to the Local Host group of the Browser override. Add one override for `apps/host/src/http/`.
- `tests/oxlint-boundaries.test.mjs`: add four tests at the end of the file.
- `docs/conventions/project-structure.md`: add one row to the table of `## Enforcement`, and give the new Browser check in the `apps/web/` row.
- `docs/build/refactor/target-structure/plan/README.md`: change the Task 18 row to `Done`.
- `docs/build/refactor/target-structure/plan/task-18-add-folder-import-rules.md`: mark Steps 1 to 6 as done.
- `docs/build/refactor/target-structure/reports/README.md`: add the index row of this report.
- `docs/build/refactor/target-structure/reports/task-18-add-folder-import-rules.md` (new): this report.

## Commands run

Every command ran in PowerShell 5.1 from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | 25 lines, all from the uncommitted work of Task 17. See the note below the table. |
| 1 | `node --test tests/oxlint-boundaries.test.mjs` | 0 | `# pass 13` and `# fail 0`. |
| 2 | `node "$env:TEMP\deckagent-lint-edits.mjs"` | 0 | `lint-edits: 3 files changed, 0 failures`. |
| 3 | `node --test tests/oxlint-boundaries.test.mjs` | 0 | `# pass 17` and `# fail 0`. |
| 3 | `corepack pnpm@11.28.5 lint` | 0 | No line from oxlint. |
| 3 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 3 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 205 file(s) checked, 0 error(s) in 0 file(s)`. |
| 4 | `Copy-Item .oxlintrc.json "$env:TEMP\oxlintrc.backup.json"` | 0 | No output. |
| 4 | Edit of `.oxlintrc.json`: change the path of the `http/` override, delete the line `"@deckagent/host",` in the Browser override | 0 | `JSON.parse` accepts the file. The path is `"**/apps/host/src/nohttp/**/*.ts"`. |
| 4 | `node --test tests/oxlint-boundaries.test.mjs` | 1 | `not ok 14 - rejects @deckagent/host import in apps/web/src/browser`, `not ok 15 - rejects feature, integration and store imports inside apps/host/src/http`, `not ok 16 - rejects storage package and node:sqlite imports inside apps/host/src/http`, `# pass 14` and `# fail 3`. |
| 4 | `Copy-Item "$env:TEMP\oxlintrc.backup.json" .oxlintrc.json -Force` | 0 | No output. |
| 4 | `node --test tests/oxlint-boundaries.test.mjs` | 0 | `# pass 17` and `# fail 0`. |
| 5 | `git status --short` | 0 | ` M .oxlintrc.json`, ` M docs/conventions/project-structure.md` and ` M tests/oxlint-boundaries.test.mjs`, plus the lines of Task 17 and of `docs/build/refactor/target-structure/`. |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 206 file(s) checked, 0 error(s) in 0 file(s)`. |
| 6 | `wsl python3 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-18-add-folder-import-rules.md` | 0 | `0 violations (0 hard, baseline 0)`. |

The run of Step 4 gives the message `# pass 14` and `# fail 3`. Test 17 passes in that run, because it checks a path inside the `http/` folder that the broken rule no longer covers. The four tests of Step 2 give these results:

- The test `rejects @deckagent/host import in apps/web/src/browser` fails when the Browser override has no `@deckagent/host`.
- The test `rejects feature, integration and store imports inside apps/host/src/http` fails when the `http/` override has a wrong path.
- The test `rejects storage package and node:sqlite imports inside apps/host/src/http` fails when the `http/` override has a wrong path.

The rules are back in the file after Step 4. The second run of Step 4 gives `# pass 17` and `# fail 0`.

## Deviations from the task text

The start state of Step 1 is not the start state that the task expects. The command `git status --short` prints 25 lines, and the task expects no line. All 25 lines are the uncommitted work of Task 17. Task 17 is `Done` in the plan and its report exists. A person approved that this task continues and that this report records the fact. The check of Step 3 gives no error in `apps/host/src/http/`, so the new rule accepts the current code of that folder.

The edit script of Step 2 expects two rows of the enforcement table without a value in the column `Check mục tiêu`. The current table has a value in that column, because Task 1 wrote it. The script would make a row with four cells and a broken table. A person approved the intent of the task:

- The new row for `http/` gives the `oxlint` check in the column `Chặn bởi` and `—` in the column `Check mục tiêu`.
- The row for `apps/web/` adds the `oxlint` note to the column `Chặn bởi`. The column `Check mục tiêu` keeps `oxlint` (`no-restricted-imports`) for the full `apps/web/` folder, because that check does not exist yet.
- The general row `Route không import store ...` keeps its `oxlint` target check, because the folder rules for `apps/host/src/modules/` belong to Phase 3.

## What the commands do not prove

- The rules check static import paths only. A dynamic `import()` with a computed path has no static specifier, so the rules do not see it.
- The rule for `apps/host/src/http/` reads the files in that folder only. The code in `packages/host/api/src/transport/` does not obey the rule, and Phase 3 moves that code.
- The rule blocks the relative forms `../features/**`, `../integrations/**`, `../*-store.ts`, `../*-state.ts` and `../local-transport.ts`. A relative import with another name, for example `../db/index.ts`, is not blocked.
- The rule blocks the package names in its group. A new storage package is not blocked until a person adds its name to the group.
- The test `accepts the Host API, Express and Node HTTP imports inside apps/host/src/http` proves that the rule permits these three imports. It does not prove that the list of blocked imports is complete.
