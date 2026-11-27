# Task 2 Report: Add the enum check and the role file check

Read this file to know what Task 2 added to `check:boundaries` and `.oxlintrc.json`, and which checks and fault tests passed.

## Files changed

- `scripts/check-boundaries.mjs`: `ROLE_FILE_MODULES` (value `[]`), `ROLE_FILE_EXPORTS`, `ROLE_SUFFIXES`, `roleOfPath`, `extractDeclarations`, and the rules `typescript-enum` and `role-file-symbol` in `checkBoundaries`. `checkBoundaries` reads `snapshot.roleFileModules ?? ROLE_FILE_MODULES`.
- `.oxlintrc.json`: `"oxc/no-const-enum": "error"` in `rules`.
- `tests/check-boundaries.test.mjs`: the helper `findings` takes `roleFileModules`, three new tests, and three lines in the header list of faults.
- `tests/oxlint-boundaries.test.mjs`: the test `rejects a const enum`.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs` (Step 2) | 1 | `# fail 3`: the enum test, the role file rejection test and `rejects a const enum` |
| `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs` (Step 4) | 0 | `# pass 68`, `# fail 0` |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | 0 | No error |
| `corepack pnpm@11.28.5 exec biome check --write` on the four changed files | 0 | `Fixed 1 file` (format of `scripts/check-boundaries.mjs`) |

## Phase 1 exit

`corepack pnpm@11.28.5 build` exited with code 0. Each of the 19 non-live `test:*` scripts in `package.json` exited with code 0 and `# fail 0`. Together they ran 421 tests.

## Fault tests

| Fault | Tests that failed |
| --- | --- |
| Rename the rule ID `typescript-enum` | `checkBoundaries rejects an enum and a const enum in source and test files` |
| Remove the branch for a `Service` or `Store` suffix outside its role file | `checkBoundaries rejects role files without their role symbols in a listed module` |
| Set `ROLE_FILE_MODULES` to `['workspaces']` | `checkBoundaries accepts role symbols in a listed module and ignores modules outside the list` and two module import tests |

## STOP and retry

Step 2 expected four failing tests. Three tests failed. The test `checkBoundaries accepts role symbols in a listed module and ignores modules outside the list` passed, because it expects no violation and no rule existed yet. The planner changed `Expected` of Step 2 in the task file. No other STOP or retry occurred.

## What the commands do not prove

- `role-file-symbol` checks the prefix and the suffix of the main export, not the singular domain noun. Review checks the noun.
- The rule finds only `export class` and `export function` declarations at the top level. A role symbol that a file exports with `export { Name }` is not found. No role file in `apps/host/src/modules/` uses that form today.
