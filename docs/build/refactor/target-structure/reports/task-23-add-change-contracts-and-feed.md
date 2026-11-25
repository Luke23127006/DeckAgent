# Task 23: Add the change notice contracts, workspace body schemas and Host ChangeFeed report

Read this file to learn which change notice contracts, workspace body schemas and Host ChangeFeed code Task 23 added, and the result of each check.

## Files changed

- `packages/host/contracts/src/changes.ts` (new): the types `ChangeTopic`, `ChangeNotice` and `PublishChange`, and the function `decodeChangeNotice`.
- `packages/host/contracts/src/workspace-validation.ts` (new): the five functions `decodeWorkspaceAddBody`, `decodeWorkspaceSelectBody`, `decodeWorkspaceRenameBody`, `decodeWorkspaceRelinkBody` and `decodeWorkspaceRemoveBody`. Each body needs `expectedVersion` and rejects unknown keys with `INVALID_REQUEST`. The fields `folder` and `name` stay unchecked, so the module maps them to its own error codes.
- `packages/host/contracts/src/index.ts`: exports the new types and the six decoders.
- `packages/host/contracts/tests/validation.test.mjs`: adds two tests for `decodeChangeNotice` and the five workspace body decoders.
- `packages/host/api/src/index.ts`: exports `openSseStream`.
- `apps/host/src/http/change-feed.ts` (new): the interfaces `ChangeFeed` and `HostChangeTopic`, the function `createChangeFeed` and the function `createChangeRoutes` with `GET /api/changes`.
- `apps/host/src/http/start-host.ts`: adds `StartHostOptions` with the optional field `changes` and mounts the change route on `routes.streams`.
- `apps/host/tests/change-feed.test.mjs` (new): three tests for the feed, the route and the 64-stream limit.
- `package.json`: adds `apps/host/tests/change-feed.test.mjs` to `test:tools-browser`.
- `CHANGELOG.md`: records this task under `## [Unreleased]` and `### Added`.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 23 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-23-add-change-contracts-and-feed.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-23-add-change-contracts-and-feed.md` (new): this report.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

Step 1 first printed five lines of the plan files of Revision 3c. The owner approved a separate commit of these files. The commit is `3b6cde2` (`docs: add Revision 3c of the target structure plan`). The command below ran again after the commit.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line, after the commit `3b6cde2`. |
| 1 | `node -e "..."` with the five files in the `Read first` block | 0 | Five lines: `57`, `36`, `283`, `71`, `55`. |
| 1 | `corepack pnpm@11.28.5 build` | 0 | `Build complete` for each bundle. |
| 1 | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# tests 14`, `# pass 14`, `# fail 0`. |
| 3 | `node C:\Users\Duy\AppData\Local\Temp\deckagent-task23-edits.mjs` | 0 | `task23-edits: 5 files changed, 0 failures`. |
| 4 | `corepack pnpm@11.28.5 build` | 0 | `Build complete` for each bundle. |
| 4 | `corepack pnpm@11.28.5 lint` | 1, then 0 | The first run reported `unicorn(no-useless-spread)` in `change-feed.ts:23`. The second run had no error. See `Deviations from the plan`. |
| 4 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 4 | `corepack pnpm@11.28.5 exec biome format <8 files>` | 1, then 0 | The first run reported `changes.ts format ━` on the union `ChangeTopic`. The second run gave `Checked 8 files in 29ms. No fixes applied.` See `Deviations from the plan`. |
| 4 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# tests 47`, `# pass 47`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# tests 19`, `# pass 19`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 test:http-edge` | 0 | `# tests 12`, `# pass 12`, `# fail 0`. |
| 5 | `git status --short` | 0 | Nine lines: five with ` M` and four with `??`, and the paths match the list of Step 5. |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `0 error(s)`. |
| 6 | `python -I .agents/skills/asd-ste100/scripts/ste-lint.py <this file>` | 0 | `0 violations`. |
| 7 | `git add -A` and `git commit` | 0 | The commit that holds this task. |
| 7 | `git push` | 0 | The output contains `refactor -> refactor`. |
| 7 | `git status --short` | 0 | No line. |

## Deviations from the plan

Step 2 has two small differences from the code in the task file. The owner approved the first difference.

1. `apps/host/src/http/change-feed.ts`, line 23: the code is `for (const listener of Array.from(bucket))` and not `for (const listener of [...bucket])`. The rule `unicorn/no-useless-spread` of oxlint rejects the spread. `Array.from` makes the same copy before the loop, so a listener that unsubscribes or throws during `publish` cannot change the loop. The behaviour is the same.
2. `packages/host/contracts/src/changes.ts`: the union `ChangeTopic` is on one line. The formatter Biome writes the union on one line. The command `biome format --write` made this change. No other line changed.

## What the commands do not prove

- `startLocalWeb` does not wire `ChangeFeed` yet, and `workspaces.routes.ts` does not call the new body decoders yet. Task 24 wires them into the `workspaces` module.
- The test `GET /api/changes shares the 64-stream limit` proves the cap of this route. It does not prove that a later module uses the same set `routes.streams`.
- `decodeChangeNotice` has no caller in production code yet. No test proves that a store publishes a correct notice. Task 24 adds this proof.
