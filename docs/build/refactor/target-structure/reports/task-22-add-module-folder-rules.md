# Task 22: Add the folder-level rules for apps/host/src/modules report

Read this file to learn which import rules apply in apps/host/src/modules, and the proof that each rule rejects a wrong import.

## Files changed

- `.oxlintrc.json`: adds three `no-restricted-imports` overrides for module files, `*.routes.ts` files and `*.service.ts` files. Adds the pattern `../modules/**` to the override for `apps/host/src/http/`. Deletes the three lines for `@deckagent/workspace-registry`.
- `scripts/check-boundaries.mjs`: adds `moduleOfPath`, the rules `module-private-import` and `module-cycle`, and the list `moduleEdges`. Deletes `packages/workspace/registry` from `DOMAIN_DIRECTORIES`.
- `tests/check-boundaries.test.mjs`: adds three tests.
- `tests/oxlint-boundaries.test.mjs`: adds five tests.
- `docs/conventions/project-structure.md`: changes four rows of the enforcement table.
- `CHANGELOG.md`: records this task under `## [Unreleased]` and `### Added`.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 22 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-22-add-module-folder-rules.md`: marks Steps 1 to 8 as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-22-add-module-folder-rules.md` (new): this report.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`. The first command of Step 1 printed the changes of Task 21. The owner then committed them as `c661dff` (`refactor: move the workspaces module into apps/host/src/modules`). The command below ran again after the commit.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line, after the commit `c661dff`. |
| 1 | `git ls-files apps/host/src/modules/workspaces` | 0 | Nine lines, one for each file of the module. |
| 1 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# tests 39`, `# pass 39`, `# fail 0`. |
| 1 | `git grep -c "workspace-registry\|workspace/registry" -- .oxlintrc.json scripts/check-boundaries.mjs` | 0 | Two lines: `.oxlintrc.json:3` and `scripts/check-boundaries.mjs:1`. |
| 2 | `corepack pnpm@11.28.5 build` | 0 | `Build complete` for each bundle. |
| 3 | `node C:\Users\Duy\AppData\Local\Temp\deckagent-module-rules-edits.mjs` | 0 | `module-rules-edits: 5 files changed, 0 failures`. |
| 4 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# tests 47`, `# pass 47`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 4 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 4 | `git grep -c "workspace-registry\|workspace/registry" -- .oxlintrc.json scripts/check-boundaries.mjs` | 1 | No line. |
| 4 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 212 file(s) checked, 0 error(s) in 0 file(s)`. |
| 5 | `node C:\Users\Duy\AppData\Local\Temp\deckagent-module-rules-mutant.mjs break` | 0 | `mutant: 2 files broken`. |
| 5 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 1 | `# pass 41`, `# fail 6`. |
| 5 | `node C:\Users\Duy\AppData\Local\Temp\deckagent-module-rules-mutant.mjs restore` | 0 | `mutant: 2 files restored`. |
| 5 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# tests 47`, `# pass 47`, `# fail 0`. |
| 6 | `git status --short` | 0 | Five lines with ` M`: `.oxlintrc.json`, `docs/conventions/project-structure.md`, `scripts/check-boundaries.mjs`, `tests/check-boundaries.test.mjs` and `tests/oxlint-boundaries.test.mjs`. |

## Tests that failed in Step 5

The mutant script changes each path `apps/host/src/modules/` of the new rules to `apps/host/src/nomodules/`. It also deletes the pattern `"../modules/**",`. These six tests failed:

- `checkBoundaries rejects private import into a module from a feature and from another module`
- `checkBoundaries detects a module cycle separately from feature cycles`
- `rejects a store, the SQL driver and another module store inside a module routes file`
- `rejects Express and the SQL driver inside a module service file`
- `rejects another module store, a storage package and the HTTP edge inside a module`
- `rejects a module import inside apps/host/src/http`

The two tests that start with `accepts` passed. The other 41 tests passed.

## What the commands do not prove

- The oxlint rules match file names and import paths. A store file with a name other than `<name>.store.ts` is not in the rules. An import through a re-export is not in the rules.
- `check:boundaries` reads relative imports only. An import of a module through a package name is not in `module-private-import`.
- The tests prove that each rule rejects the fixture in the test. They do not prove that the rules cover every wrong import of a later module.
