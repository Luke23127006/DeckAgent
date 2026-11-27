# Task 49: Move the OpenCode integration into apps/host/src/runtimes/opencode report

Read this file to learn the changes and check results for Task 49.

## Files changed

- `apps/host/src/runtimes/opencode/*.ts`: 11 files moved from `apps/host/src/integrations/opencode/`. The file names do not change.
- `apps/host/src/integrations/`: removed. The folder is empty after the move.
- `apps/host/src/server.ts`: imports `./runtimes/opencode/index.ts`.
- `apps/host/src/features/requests/prepare-runtime.ts`: imports `../../runtimes/opencode/index.ts`.
- `apps/host/tests/fixtures/b02-helpers.mjs`, `apps/host/tests/mcp-bridge.test.mjs`, `apps/host/tests/opencode-adapter.test.mjs`: import from `lib/types/runtimes/opencode/`.
- `scripts/check-boundaries.mjs`: adds `runtimeOfPath` and the rule `runtime-private-import`. The rule `integration-private-import` stays.
- `.oxlintrc.json`: adds `../runtimes/**` to the `apps/host/src/http/` override. Adds `../../runtimes/**` and `../../../runtimes/**` to the five `apps/host/src/modules/` overrides. Adds the override for `apps/host/src/runtimes/`.
- `tests/check-boundaries.test.mjs`: adds one test for `runtime-private-import`. Biome also reformats four blocks that the task does not change.
- `tests/oxlint-boundaries.test.mjs`: adds two tests for the runtime import rules.
- `docs/conventions/project-structure.md`: removes the two `apps/host/src/integrations/` rows from `## Trong lúc chuyển`. Adds `runtime-private-import` and the `apps/host/src/runtimes/` oxlint rule to `## Enforcement`.
- This task file, the plan index, the report index and `CHANGELOG.md` record the result.

## Moved files

| Old path | New path |
| --- | --- |
| `apps/host/src/integrations/opencode/config.ts` | `apps/host/src/runtimes/opencode/config.ts` |
| `apps/host/src/integrations/opencode/contracts.ts` | `apps/host/src/runtimes/opencode/contracts.ts` |
| `apps/host/src/integrations/opencode/events.ts` | `apps/host/src/runtimes/opencode/events.ts` |
| `apps/host/src/integrations/opencode/history.ts` | `apps/host/src/runtimes/opencode/history.ts` |
| `apps/host/src/integrations/opencode/index.ts` | `apps/host/src/runtimes/opencode/index.ts` |
| `apps/host/src/integrations/opencode/mcp-bridge.ts` | `apps/host/src/runtimes/opencode/mcp-bridge.ts` |
| `apps/host/src/integrations/opencode/process.ts` | `apps/host/src/runtimes/opencode/process.ts` |
| `apps/host/src/integrations/opencode/provider.ts` | `apps/host/src/runtimes/opencode/provider.ts` |
| `apps/host/src/integrations/opencode/resources.ts` | `apps/host/src/runtimes/opencode/resources.ts` |
| `apps/host/src/integrations/opencode/runtime.ts` | `apps/host/src/runtimes/opencode/runtime.ts` |
| `apps/host/src/integrations/opencode/stream-tracker.ts` | `apps/host/src/runtimes/opencode/stream-tracker.ts` |

## Commands run

Commands ran from `C:/Users/Duy/Desktop/DeckAgent` in PowerShell 5.1. The package command prefix is `corepack pnpm@11.28.5`.

| Command | Exit code | Key output |
| --- | --- | --- |
| `git status --short` before the move | 0 | No line |
| `git grep -n "^| 48 | Done"` | 0 | One line, the Task 48 row |
| `git mv` for every mapping row and remove of the empty folder | 0 | 11 renames. `apps/host/src/integrations/` is absent |
| `git grep --untracked -n "integrations/opencode" -- apps packages e2e scripts` | 1 | No line |
| `exec biome format --write` on the changed code and tests | 0 | `Formatted 19 files`, `Fixed 2 files` |
| `exec biome format` on the same files | 0 | `No fixes applied` |
| `build` | 0 | The Host, the deck package and the web package report `Build complete` |
| `lint` | 0 | No error |
| `check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `check:docs` | 0 | 268 files, 0 error(s) |
| `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | 54 pass, 0 fail |

## Required suites

Every command below exited with code 0 and reported `# fail 0`. No suite needed a second run.

| Command | Pass | Fail |
| --- | --- | --- |
| `test:http-edge` | 12 | 0 |
| `test:tools-browser` | 24 | 0 |
| `test:local-web` | 11 | 0 |
| `test:local-foundation` | 57 | 0 |
| `test:model-requests` | 29 | 0 |
| `test:source-permissions` | 11 | 0 |
| `test:attachments` | 31 | 0 |
| `test:research` | 5 | 0 |
| `test:images` | 39 | 0 |
| `test:outline-workflow` | 6 | 0 |
| `test:brief-foundation` | 16 | 0 |
| `test:deck-review` | 21 | 0 |
| `test:generation-publication` | 72 | 0 |
| `test:slide-pipeline` | 9 | 0 |
| `test:session-persistence` | 7 | 0 |
| `test:opencode-resources` | 3 | 0 |
| `test:layouts` | 10 | 0 |
| `test:browser-smoke` | 22 | 0 |
| `test:env-startup` | 2 | 0 |

## Plan corrections and retries

None. No STOP condition occurred and no step needed a retry.

## Items outside the mapping

The Move rules do not name these two items. I report them and make no other change.

1. The rule `integration-private-import` and the oxlint pattern `../integrations/**` stay after `apps/host/src/integrations/` is gone. The Move rule keeps the rule, and the unit tests in `tests/check-boundaries.test.mjs` and `tests/oxlint-boundaries.test.mjs` still use the old paths. A later task can remove the rule and its tests.
2. The step `Format, build and check` formats `tests/check-boundaries.test.mjs` in full. Biome reformats four blocks that Task 49 does not change. The step `exec biome format` must report `No fixes applied`, so the file cannot keep these blocks.

## What the commands do not prove

- `apps/host/src/runtimes/opencode/` imports the type `ProviderRunSettings` from `../../modules/providers/index.ts` until a later task moves that type to `apps/host/src/runs/ports.ts`.
- The oxlint tests show that the runtime rule rejects the named imports. They do not show that the production code stays clear of these imports at run time. `check:boundaries` shows the same for `runtime-private-import`.
- The suites show that the runtime behavior does not change for the tested paths. They do not prove the HTTP contract for a path with no test.

## Commit handoff

The task file commits and pushes this report. The commit message is `refactor: move OpenCode integration into apps/host/src/runtimes/opencode`.
