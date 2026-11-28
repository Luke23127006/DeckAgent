# Task 1: Add the layout rules report

Read this file to review the files, the commands and the mutant verification of Task 1 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

- Created `scripts/format-layout.mjs` with `isLayoutTarget` and `formatLayout`.
- Created `tests/format-layout.test.mjs` with 10 tests and the list `Faults caught during mutant verification`.
- Marked the steps as complete in [Task 1: Add the layout rules](../plan/task-01-add-layout-rules.md).
- Changed the row of Task 1 to `Done` in the [plan README](../plan/README.md).
- Added the row of Task 1 to [Code Layout Reports](README.md).
- Created this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 2 | `node --test --test-reporter=tap tests/format-layout.test.mjs` | `1` | Failed with `ERR_MODULE_NOT_FOUND` for `scripts/format-layout.mjs`, as expected |
| 4 | `corepack pnpm@11.28.5 exec biome format --write scripts/format-layout.mjs tests/format-layout.test.mjs` | `0` | `Formatted 2 files in 17ms. No fixes applied.` |
| 4 | `node --test --test-reporter=tap tests/format-layout.test.mjs` | `0` | `# tests 10`, `# pass 10`, `# fail 0` |
| 4 | `corepack pnpm@11.28.5 lint` | `0` | `$ oxlint -c .oxlintrc.json apps packages scripts tests e2e`, no warning or error |

## Mutant verification

Each fault was applied to `scripts/format-layout.mjs`, the test file ran, and the file was restored from a copy. The clean file passes all tests again after each restore.

| Fault | Failing tests |
| --- | --- |
| Removed the exception for overloads | `formatLayout keeps one-line groups and overloads together`, `formatLayout adds blank lines between class members` |
| Measured the gap from `node.getStart()` and ignored the leading comment | `formatLayout adds the blank line before the leading comment` |
| Always wrote `\n` as the line ending | `formatLayout keeps CRLF line endings and a second run changes nothing` |

## STOP and retry

none

## What the commands do not prove

- The tests use in-memory source text. They do not prove that the script reads and writes the files of the repository. Task 4 applies the script to the repository.
- The tests do not prove the behavior of the script on a real file with two or more blank lines, because Biome removes the extra blank lines before the script runs.
- The tests do not prove that the script skips a leading comment that is not JSDoc, an import equals declaration or a semicolon class element.
- `isLayoutTarget` has no test for a file with the `.mjs` extension under `apps/` or `packages/`, because the test cases use one extension for each prefix.
