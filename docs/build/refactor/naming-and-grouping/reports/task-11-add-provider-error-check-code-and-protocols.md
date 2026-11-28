# Task 11 Report: Add ProviderError, ProviderCheckCode and providerProtocols

Read this file to know how Task 11 moved the provider error into `providers.errors.ts`, renamed the check code and moved the API protocol list into the host contracts.

## Files changed

- `packages/host/contracts/src/management.ts`: replaced the union type `ProviderProtocol` with `export const providerProtocols = [...] as const` and `export type ProviderProtocol = (typeof providerProtocols)[number]`. The comment `/** API protocols of BR-005 V-4. */` stays on `providerProtocols`.
- `packages/host/contracts/src/index.ts`: added `export { providerProtocols } from './management.ts'`. `ProviderProtocol` stays in the type export.
- `apps/host/src/modules/providers/providers.errors.ts`: removed the import of `providers.service.ts`. Added `ProviderErrorCode` with the 18 keys of `providerStatus`, the class `ProviderError`, and the function `mapProviderError`. `providerStatus` is now `Readonly<Record<ProviderErrorCode, number>>` and the `?? 500` fallback is gone.
- `apps/host/src/modules/providers/providers.service.ts`: removed the class `ProviderFailure` and the constant `protocols`. Imports `ProviderError` from `./providers.errors.ts` and `providerProtocols` from `@deckagent/host-contracts`. Every `ProviderFailure` throw became a `ProviderError` throw, and `isProviderProtocol` and `load` use `providerProtocols`.
- `apps/host/src/modules/providers/provider-catalog.ts`: renamed the type `ProviderFailure` to `ProviderCheckCode`. `ProviderCheckError.code` has type `ProviderCheckCode`.
- `apps/host/src/modules/providers/index.ts`: exports only `ProviderConfigurations` from `providers.service.ts`, and `mapProviderError` from `providers.errors.ts`.
- `apps/host/src/cli.ts`: imports `providerProtocols` from `@deckagent/host-contracts` and only `validBaseUrl` from `./modules/providers/index.ts`. `connection` calls `providerProtocols.find`.
- `apps/host/src/server.ts`: only the import and the call changed from `mapProviderFailure` to `mapProviderError`.
- `packages/host/contracts/tests/validation.test.mjs`: imports `providerProtocols` and adds the test `providerProtocols lists the four API protocols of BR-005 V-4`.
- `apps/host/tests/web-management.test.mjs`: imports `ProviderError`, `mapProviderError` and `ProviderCheckError`, and adds the test `ProviderError and mapProviderError map codes to HTTP status and detail`. The test body was reformatted by `biome format`; the assertions are unchanged.
- `docs/build/refactor/naming-and-grouping/plan/task-11-add-provider-error-check-code-and-protocols.md`: marked Steps 1 to 5 as done.
- `docs/build/refactor/naming-and-grouping/plan/README.md`: set the Task 11 status to `Done` and linked this report.
- `docs/build/refactor/naming-and-grouping/reports/README.md`: added the row for Task 11.
- `docs/build/refactor/naming-and-grouping/reports/task-11-add-provider-error-check-code-and-protocols.md`: this report.

No table is requested by the task, and no decision table sends an item to this report.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` (Step 2, first attempt) | 2 | `error TS2878: This import path is unsafe to rewrite because it resolves to another project` while `tsc -b` builds `apps/web`. |
| `node --test --test-reporter=tap packages/host/contracts/tests/validation.test.mjs apps/host/tests/web-management.test.mjs` (Step 2, before the source change) | 1 | `SyntaxError: The requested module '../lib/index.js' does not provide an export named 'providerProtocols'`, `# pass 0`, `# fail 2` |
| `node scripts/build-workspace.mjs` (after the source change) | 0 | Bundled each workspace package, including `packages/host/contracts/lib/index.js`. |
| `node --test --test-reporter=tap packages/host/contracts/tests/validation.test.mjs apps/host/tests/web-management.test.mjs` | 0 | `ok 9 - ProviderError and mapProviderError map codes to HTTP status and detail`, `ok 20 - providerProtocols lists the four API protocols of BR-005 V-4`, `# tests 20`, `# pass 20`, `# fail 0` |
| `corepack pnpm@11.28.5 build && node --test --test-reporter=tap packages/host/contracts/tests/validation.test.mjs apps/host/tests/web-management.test.mjs` (Step 5) | 0 | Build complete for every package, `# tests 20`, `# pass 20`, `# fail 0` |
| `git grep -n -E "\bProviderFailure\b\|mapProviderFailure" -- apps/host/src apps/host/tests e2e` | 1 | No line. |
| `git grep -n -w "protocols" -- apps/host/src/modules/providers apps/host/src/cli.ts` | 1 | No line. |
| `corepack pnpm@11.28.5 lint` | 0 | `oxlint` reported no error after the untracked `apps/web/dist` folder was removed (see retry 2). |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 exec biome format` on the 9 changed files | 1 | One error in `apps/host/tests/web-management.test.mjs`: the formatter would break 4 long assertion lines. |
| `corepack pnpm@11.28.5 exec biome format --write apps/host/tests/web-management.test.mjs` | 0 | `Formatted 1 file in 55ms. Fixed 1 file.` The same check then reported `Checked 9 files ... No fixes applied.` |
| `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 337 file(s) checked, 0 error(s) in 0 file(s)` |

## STOP and retry

- Step 2, `build` returned exit code 2 with `error TS2878`. Cause: the working tree holds a concurrent change of `apps/web/tsconfig.json` and `apps/web/src/index.ts` from the parallel phase that the row `Parallel phases` of Decisions (Revision 4) names. Those files are outside the `Files` block, and the global constraints forbid changes in `apps/web/`. `tsc -b` still emitted `apps/host/lib/types` and `packages/host/contracts/lib/types`. Retry: ran `node scripts/build-workspace.mjs` to run the bundle step that the failed build skipped. A later `corepack pnpm@11.28.5 build` returned exit code 0 when the concurrent change settled, so Step 5 ran the plan's command unchanged.
- Step 5, the first `lint` returned exit code 1 on `apps/web/dist/assets/index-*.js` with `eslint(no-unused-expressions)`. Cause: a successful `build` writes the untracked `apps/web/dist` folder, and `.gitignore` does not list it. The folder is a build output that did not exist at the start of the task. Retry: removed `apps/web/dist`; `lint` returned exit code 0.
- Step 5, a test run after that removal returned exit code 1 with `ENOENT: no such file or directory, scandir 'apps/web/dist'` in 7 tests. Cause: `startLocalWeb` serves the browser assets of `apps/web/dist`, so the folder is needed by `apps/host/tests/web-management.test.mjs`. Retry: ran the plan's combined `build && node --test` command, which rebuilds `apps/web/dist` first; exit code 0. Removed `apps/web/dist` again before the final `lint` so the tree matches the state at the start of the task.
- Step 5, `biome format` on the changed files returned exit code 1. Cause: the test lines copied from the plan are longer than the formatter line width. Retry: ran `biome format --write` on `apps/host/tests/web-management.test.mjs` only; the assertions are unchanged. The check then returned exit code 0.

## What the commands do not prove

- The new mapper test checks 8 of the 18 codes. It does not prove the HTTP status of the other 10 codes. `tsc` proves that `providerStatus` has a number for each of the 18 codes.
- The new tests do not start a Host and send a provider request. They do not prove the HTTP paths, status codes or bodies of the provider routes.
- The `git grep` commands read tracked files only, and only the paths that the task names. They do not prove that an untracked file or another path has no old name.
- `check:boundaries` does not include `providers` in `ROLE_FILE_MODULES` yet, so it does not check the role symbols of this module. Task 15 adds that check.
- `build` and `lint` also read files of the concurrent phases in this working tree. This task does not prove that those files are correct.
