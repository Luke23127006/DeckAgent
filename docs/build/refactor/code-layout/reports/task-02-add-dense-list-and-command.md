# Task 2: Add the dense body list and the command report

Read this file to review the files, the commands and the mutant verification of Task 2 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

- Changed `scripts/format-layout.mjs`: added `listDenseBodies` and the command `node scripts/format-layout.mjs <--check|--write|--dense> [path ...]`.
- Changed `tests/format-layout.test.mjs`: added the test `listDenseBodies lists bodies with 6 statements, 12 lines and no blank line`, the test `the command checks, writes and lists files in a folder`, the new imports and 2 lines of mutant verification in the header comment.
- Marked the steps as complete in [Task 2: Add the dense body list and the command](../plan/task-02-add-dense-list-and-command.md).
- Changed the row of Task 2 to `Done` in the [plan README](../plan/README.md).
- Added the row of Task 2 to [Code Layout Reports](README.md).
- Created this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 2 | `node --test --test-reporter=tap tests/format-layout.test.mjs` | `1` | Failed with `SyntaxError: The requested module '../scripts/format-layout.mjs' does not provide an export named 'listDenseBodies'`, as expected |
| 4 | `corepack pnpm@11.28.5 exec biome format --write scripts/format-layout.mjs tests/format-layout.test.mjs` | `0` | `Formatted 2 files in 11ms. No fixes applied.` |
| 4 | `node scripts/format-layout.mjs --check scripts/format-layout.mjs tests/format-layout.test.mjs` | `0` | `format-layout: 0 finding(s)` |
| 4 | `node --test --test-reporter=tap tests/format-layout.test.mjs` | `0` | `# tests 12`, `# pass 12`, `# fail 0` |
| 4 | `corepack pnpm@11.28.5 lint` | `0` | `$ oxlint -c .oxlintrc.json apps packages scripts tests e2e`, no warning or error |
| 6 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 367 file(s) checked, 0 error(s) in 0 file(s)` |

## Mutant verification

Each fault was applied to `scripts/format-layout.mjs`, the test file ran, and the file was restored from a copy. The clean file passes all 12 tests again after each restore.

| Fault | Failing tests |
| --- | --- |
| Removed the blank-line check in `listDenseBodies` | `listDenseBodies lists bodies with 6 statements, 12 lines and no blank line` |
| Made `--check` always exit with code 0 | `the command checks, writes and lists files in a folder` |

## Items that a decision table sent to the report

none

## STOP and retry

none

## What the commands do not prove

- The temporary folder has only `src/a.ts`. The test does not prove that the command skips a file with the extension `.d.ts` and the folders `node_modules`, `lib`, `dist` and `coverage`.
- The test passes the path `src` in each run. It does not prove the default targets `apps`, `packages`, `scripts` and `tests` when the command has no path.
- The sample source text has one function declaration and one arrow function that a variable holds. The test does not prove the name of a method or an accessor, and the name `<anonymous>`.
- The dense sample has 8 statements and 12 lines. The short sample has 6 statements and 8 lines. The test does not separate the statement limit from the line limit: it has no sample with 5 statements and 12 lines, and no sample with 6 statements and 12 lines.
- The test uses in-memory source text and one temporary file. It does not prove the result of `--dense` on the files of the repository. Tasks 7 to 11 use the list on the repository.
- The test does not check the exit code of `--dense` and the printed path of a file outside the current folder.
- The TypeScript API parses a constructor as a `ConstructorDeclaration`. The task lists a function, a method, an arrow function and an accessor only. A dense constructor body with 10 statements and 12 lines returns no item. Tasks 7 to 11 must add the steps in a constructor by hand.
