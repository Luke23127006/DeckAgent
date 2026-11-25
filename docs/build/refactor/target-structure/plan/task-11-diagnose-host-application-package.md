# Task 11: Diagnose the Host application package

Read this file to learn the steps of Task 11, which records the imports, the callers and the checks of the Local Host process.

Phase 2 creates `apps/host/src/server.ts` and `apps/host/src/http/`. Today the composition root is `apps/web/src/index.ts`, and the HTTP server is in `packages/host/api/`. The feature code stays in `apps/web/src/features/` until Phase 3. This task collects the facts for the decision about what `apps/host/` contains in Phase 2 and what it imports. It does not make the decision.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/project-structure.md` (section `## Trong lúc chuyển`)
- `apps/web/src/index.ts` (391 lines)
- `apps/web/src/cli.ts` (178 lines)
- `apps/web/package.json` (32 lines)
- `packages/host/api/package.json` (23 lines)
- `scripts/build-workspace.mjs` (lines 1-80)

**Files:**

- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-11-diagnose-host-application-package.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-11-diagnose-host-application-package.md`

**Interfaces:**

- Uses: `startLocalWeb`, `LocalWebOptions`, `StorageError`, `resolveStorageRoot` and `ProviderConnection`, which `apps/web/src/index.ts` exports. `startHost`, which `@deckagent/host-api` exports. The package names `@deckagent/local-web` and `@deckagent/host-api`.
- Produces: a report with one row for each import of `apps/web/src/index.ts` and `apps/web/src/cli.ts`, with IDs `I1`, `I2`, and so on. The report also has one row for each caller of `@deckagent/local-web`, with IDs `C1`, `C2`, and so on.

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
- Create the folder `apps/host/`.
- Propose a package name, a file name or an import direction for `apps/host/`.

## Import decision table

The target folders come from the table in section `## Trong lúc chuyển` of `docs/conventions/project-structure.md`. Apply the rows from top to bottom to each import. Use the first row that matches.

| Signal | Action |
| --- | --- |
| The specifier starts with `node:` | Kind `node`. Target `none`. |
| The specifier is `@deckagent/host-api` | Kind `host-api`. Target `apps/host/src/http/` and `apps/host/src/runs/`. Write each imported name. |
| The specifier starts with `./features/<name>/` | Kind `feature`. Target `apps/host/src/modules/<name>/`. |
| The specifier starts with `./integrations/opencode/` | Kind `integration`. Target `apps/host/src/runtimes/opencode/`. |
| The specifier starts with `./integrations/<name>/` and `<name>` is not `opencode` | Kind `integration`. Target `Module that uses the adapter, or apps/host/src/runtimes/`. |
| The specifier is `./local-transport.ts` | Kind `error-map`. Target `Open in Project Structure`. |
| The specifier is `./ui-assets.ts` | Kind `browser-asset`. Target `React components and pages in apps/web/src/`. |
| The specifier starts with `@deckagent/` | Kind `package`. Write the package name as the target. |
| The specifier starts with `./` and no row above matches | Kind `local`. Target `Not in the table`. Write the exported names that the file uses. |
| No row matches | Kind `unclassified`. Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `grep -c "from '" apps/web/src/index.ts apps/web/src/cli.ts && grep -c "^export" apps/web/src/index.ts`

Expected: PASS. The output is three lines: `apps/web/src/index.ts:30`, `apps/web/src/cli.ts:8` and `4`. FAIL: any other number.

- [ ] **Step 2: List and classify each import**

Run: `grep -n "from '" apps/web/src/index.ts apps/web/src/cli.ts`

Expected: PASS. The output has 38 lines.

For each line, write one row in the report table `ID | File:line | Specifier | Imported names | Kind | Target`. Use the [Import decision table](#import-decision-table).

Then write these facts in the report, with file and line:

1. The order in which `startLocalWeb` in `apps/web/src/index.ts` opens storage, creates the runtime layer, loads the Browser assets and calls `startHost`.
2. The order of the functions in `closers` in `startLocalWeb`.
3. The path from which `startLocalWeb` loads the Browser assets, and the code that builds the path.
4. Each field of `LocalWebOptions`, with its type.
5. What `apps/web/src/cli.ts` does before it calls `startLocalWeb`, in order: arguments, environment variables and files that it reads.

- [ ] **Step 3: List the callers of the two packages**

Run: `grep -rln "@deckagent/local-web" --include=*.mjs --include=*.ts --include=*.json . | grep -v node_modules | grep -v "/lib/"`

Expected: PASS. The output has 14 lines.

Run: `grep -rln "@deckagent/host-api" --include=*.ts --include=*.mjs --include=*.json apps packages e2e scripts tests | grep -v node_modules | grep -v /lib/`

Expected: PASS. The output has 28 lines.

For each test file in the first output, write one row in the report table `ID | File | Imported names | Uses origin and token`. In `Uses origin and token`, write `yes` when the test reads `origin` or `token` from the value that `startLocalWeb` returns. Otherwise write `no`.

For the second output, write the number of files under each folder: `apps/web/src/features/`, `apps/web/src/integrations/`, `apps/web/src/` (other files), `apps/web/tests/`, `e2e/` and other folders.

- [ ] **Step 4: List the paths that start, build and package the Host**

Run: `grep -rn "apps/web/lib\|apps/web/" package.json scripts/build-workspace.mjs scripts/package-opencode.mjs e2e/env-startup.test.mjs e2e/deck-pipeline.test.mjs`

Expected: PASS. The command exits with code 0.

For each line, write in the report the file, the line and what the path is for: start, build, browser bundle, package or test.

Also write these facts:

1. The entries in `extraEntries` in `scripts/build-workspace.mjs`, and the special build steps for `@deckagent/local-web`.
2. The `dependencies` of `apps/web/package.json` and of `packages/host/api/package.json`.
3. The `references` of `apps/web/tsconfig.json`, and the purpose of `apps/web/tsconfig.browser.json`.

- [ ] **Step 5: List the checks that name the moved paths**

Run: `grep -n "local-web\|apps/web\|host-api\|packages/host/api" scripts/check-boundaries.mjs .oxlintrc.json`

Expected: PASS. The output has 20 lines.

For each line, write the file and the line in the report. Also write the rule ID or the `files` pattern, and the path or the package that the rule names.

Then run: `grep -n "^test(" tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs | grep -i "host/api\|apps/web\|host-api\|lifecycle\|transport"`

Expected: PASS. The command exits with code 0.

For each line, write the test name. These tests are the negative fixtures of the rules that name the moved paths.

- [ ] **Step 6: Check that no code changed**

Run: `git status --short`

Expected: PASS. No path under `apps/`, `packages/`, `e2e/`, `tests/`, `scripts/` or `docs/conventions/` is in the output.

- [ ] **Step 7: Write the report file and stop**

1. Mark Steps 1 to 6 as `- [x]` in this file. Change the Task 11 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-11-diagnose-host-application-package.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-11-diagnose-host-application-package.md` with:
   - H1 `# Task 11: Diagnose the Host application package report` and the purpose line `Read this file to learn what the Local Host process imports, who starts it and which checks name its paths.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - The import table and the five facts from Step 2.
   - A count of imports for each kind.
   - The caller table and the folder counts from Step 3.
   - The path list and the three facts from Step 4.
   - The rule list and the test names from Step 5.
   - Items with kind `unclassified`.
   - What the commands do not prove: the searches find names in files. They do not find a dynamic import or a path that the code builds at run time.
3. Add a row for Task 11 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-11-diagnose-host-application-package.md`. Expected: the output contains `0 violations`.
5. Mark Step 7 as `- [x]`.

**STOP** and send the report summary. Do not start Task 12 until a person approves the import table and the caller table.
