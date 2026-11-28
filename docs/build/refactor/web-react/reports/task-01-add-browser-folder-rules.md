# Task 1 Report: Add the Browser folder rules

Read this file to know what Task 1 changed, which commands it ran and what the commands do not prove.

## Files changed

- `.oxlintrc.json`: eight overrides at the end of `overrides`, for `apps/web/src/{pages,components,layouts,contexts,hooks,api,editor,styles}/`, `apps/web/src/{routes,text}.*`, `apps/web/src/main.tsx`, and one override for all of `apps/web/src/` and `apps/web/mocks/` with `react/no-danger` and `unicorn/filename-case`.
- `tests/oxlint-boundaries.test.mjs`: seven tests and one line in the header comment.

## Commands

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs` (Step 2) | 1 | `# pass 40`, `# fail 6`. The six `browser ... reject` tests failed. The accept test passed |
| `node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs` (Step 4, first run) | 1 | `# fail 1`: `browser files reject a PascalCase file name and dangerouslySetInnerHTML` also got `react(react-in-jsx-scope)` |
| `corepack pnpm@11.28.5 lint` (Step 4, first run) | 1 | `unicorn(no-array-sort)` in the new test code |
| `node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs` (Step 4, after the fix) | 0 | `# pass 46`, `# fail 0` |
| `corepack pnpm@11.28.5 lint` (Step 4, after the fix) | 0 | no diagnostic |

## STOP and retry

- Step 4, first run: the plugin `react` also turns on `react/react-in-jsx-scope`, a rule for React before version 17. The planner changed the plan: the last override sets `"react/react-in-jsx-scope": "off"`.
- Step 4, first run: the test code used `Array#sort()`, which `unicorn/no-array-sort` rejects. The planner changed the plan and the test to `toSorted()`.

## What the commands do not prove

- `no-restricted-imports` does not check a dynamic `import()`. Review must find a dynamic import of `mocks/`.
- The rule "a page does not import another page" has no check. Review enforces it.
- No file exists yet in the new folders, so the lint of the repository does not exercise the overrides. Only the fixtures do.
