# Task 5: Enforce the layout in format and the post-edit hook report

Read this file to review the files, the commands and the checks of Task 5 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

- Changed `scripts/hooks/post-edit.mjs`: `runPostEdit` reads an edited file one time. For a docs target it runs the existing `checkMarkdown` check. For a layout target it runs `formatLayout` and returns exit code 2 with one line for each finding.
- Changed `package.json`: `format` runs `node scripts/format-layout.mjs --write && biome format --write`, and `format:check` runs `node scripts/format-layout.mjs --check && biome format`.
- Changed `tests/post-edit-hook.test.mjs`: added the header comment and three tests. The helper `sourceFile` writes a source file in a temporary folder.
- Marked the 6 steps as complete in [Task 5](../plan/task-05-enforce-layout-in-format-and-hook.md).
- Changed the row of Task 5 to `Done` in the [plan README](../plan/README.md).
- Added the row of Task 5 to [Code Layout Reports](README.md).
- Created this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 2 | `node --test --test-reporter=tap tests/post-edit-hook.test.mjs` | `1` | `# pass 7`, `# fail 1`. The failing test is `not ok 6 - blocks an edited source file with a missing blank line` with `0 !== 2`. |
| 4 | `node --test --test-reporter=tap tests/post-edit-hook.test.mjs tests/format-layout.test.mjs` | `0` | `# tests 20`, `# pass 20`, `# fail 0` |
| 4 | `corepack pnpm@11.28.5 format:check` | `0` | `format-layout: 0 finding(s)` and `Checked 312 files in 680ms. No fixes applied.` |
| 4 | `corepack pnpm@11.28.5 lint` | `0` | `$ oxlint -c .oxlintrc.json apps packages scripts tests e2e`, no warning or error |
| 5 | `node --test --test-reporter=tap tests/post-edit-hook.test.mjs` with the `isLayoutTarget` row removed | `1` | `# pass 7`, `# fail 1`. The failing test is `not ok 6 - blocks an edited source file with a missing blank line`. |
| 5 | `node --test --test-reporter=tap tests/post-edit-hook.test.mjs` after the row was restored | `0` | `# pass 8`, `# fail 0` |
| 6 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 370 file(s) checked, 0 error(s) in 0 file(s)` |

## Result of Step 5

The test `blocks an edited source file with a missing blank line` fails when the hook does not handle a layout target. The failure message is `0 !== 2`: the hook returns exit code 0 for a source file that misses a blank line. The other 7 tests stay green. The row is back in place and the test file passes.

## Items that a decision table sent to the report

none

## STOP and retry

none

## What the commands do not prove

- The tests call `runPostEdit` with a path in a temporary folder. They do not prove that the post-edit hook of a real editor session sends the `tool_input.file_path` value and the working directory in the same shape.
- Step 4 does not run the full test suite. Task 12 runs the exit checks. The lint run proves that the lint rules hold for the changed files. It does not prove their behavior at runtime.
- The tests do not prove the layout rules themselves. `tests/format-layout.test.mjs` proves those rules, and Step 4 runs it.
- The docs behavior for an edited document stays the same. The two existing docs tests prove the two paths they cover, not each rule of `scripts/check-docs.mjs`.
- `format` and `format:check` run the layout script before Biome. The commands of Step 4 prove that no finding remains in the repository today. They do not prove that a future file with a missing blank line stops `format:check`, because the repository has no such file at this commit.
