# Task 21: Move the workspaces module into apps/host/src/modules report

Read this file to learn where the code of the workspaces module is after the move, and the result of each check after the move.

## Files changed

Moved or added:

- `apps/host/src/modules/workspaces/contracts.ts` (from `packages/workspace/registry/src/contracts.ts`)
- `apps/host/src/modules/workspaces/folder-policy.ts` (from `packages/workspace/registry/src/folder-policy.ts`)
- `apps/host/src/modules/workspaces/schema.ts` (from `packages/workspace/registry/src/schema.ts`)
- `apps/host/src/modules/workspaces/workspace-name.ts` (from `packages/workspace/registry/src/workspace-name.ts`)
- `apps/host/src/modules/workspaces/workspaces.store.ts` (from `packages/workspace/registry/src/registry.ts`)
- `apps/host/src/modules/workspaces/workspaces.service.ts` (from `apps/host/src/features/workspaces/index.ts`)
- `apps/host/src/modules/workspaces/workspaces.routes.ts` (new)
- `apps/host/src/modules/workspaces/workspaces.errors.ts` (new)
- `apps/host/src/modules/workspaces/index.ts` (new)
- `apps/host/tests/workspace-registry.test.mjs` (from `packages/workspace/registry/tests/workspace-registry.test.mjs`)

Deleted:

- `packages/workspace/registry/package.json`
- `packages/workspace/registry/src/index.ts`
- `packages/workspace/registry/tsconfig.json`
- The folder `packages/workspace/`, with its old `lib/` output.

Changed:

- `packages/host/api/src/transport/management-routes.ts`: deletes `registerWorkspaceRoutes` and its call.
- `packages/host/api/src/transport/contracts.ts`: deletes `WorkspaceManagement` and the field `workspaces` of `WebManagement`, and adds the field `HostOptions.routes`.
- `packages/host/api/src/index.ts`: deletes the export of `WorkspaceManagement`, exports `json`, `readJson`, `param`, `params` and `route`, and mounts each router of `routes` after the management routes.
- `apps/host/src/local-transport.ts`: deletes the workspace error map, the two `mapApplicationFailure` branches and `workspaceManagement`. The function `body` stays for `chatManagement`.
- `apps/host/src/features/chats/index.ts`: adds `createWorkspaceChats`, and takes `WorkspaceLookup`.
- `apps/host/src/features/sources/source-tools.ts`: takes `WorkspaceLookup`.
- `apps/host/src/server.ts`: imports the module from `./modules/workspaces/index.ts`, adds the router in `HostOptions.routes`, and gives `mapWorkspaceFailure` before `mapApplicationFailure`.
- `apps/host/package.json`, `package.json`: delete the dependency `@deckagent/workspace-registry`, and `package.json` runs the moved test file.
- `apps/host/tsconfig.json`, `tsconfig.json`: delete the project reference of the old package.
- `pnpm-lock.yaml`: deletes the entry of the old package.
- `docs/conventions/project-structure.md`: deletes the mapping row of the old package.
- `CHANGELOG.md`: records the move.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 21 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-21-move-workspaces-module.md`: marks Steps 1 to 10 as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-21-move-workspaces-module.md` (new): this report.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| before 1 | `git add docs/build/README.md docs/build/refactor/target-structure/plan/README.md docs/build/refactor/target-structure/plan/task-21-move-workspaces-module.md docs/build/refactor/target-structure/plan/task-22-add-module-folder-rules.md` then `git commit -m "docs: add Revision 3b of the target structure plan"` | 0 | Commit `38e604e`, 4 files changed, 1200 insertions(+), 14 deletions(-). |
| 1 | `git status --short` | 0 | No line. |
| 1 | `node -e "<line count of each file>" packages/workspace/registry/src/registry.ts apps/host/src/features/workspaces/index.ts packages/host/api/src/transport/management-routes.ts apps/host/src/local-transport.ts` | 0 | Four lines: `289`, `65`, `193` and `304`. |
| 1 | `git grep -n "workspace-registry\|workspace/registry\|features/workspaces/" -- apps/host packages package.json tsconfig.json` | 0 | Fourteen lines, at the line numbers of the step. |
| 2 | `corepack pnpm@11.28.5 build` | 0 | Twelve bundles in the folder of each package. |
| 2 | `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# tests 43`, `# pass 43`, `# fail 0`. |
| 3 | `node -e "require('fs').mkdirSync('apps/host/src/modules/workspaces', { recursive: true })"`, seven `git mv` and three `git rm -q` commands, then `node -e "require('fs').rmSync('packages/workspace', { recursive: true, force: true })"` | 0 | No error. |
| 3 | `git status --short` | 0 | Ten lines: seven with `R ` and three with `D `. |
| 4 | Write `workspaces.service.ts`, `workspaces.routes.ts`, `workspaces.errors.ts` and `index.ts` | — | The text of the four files is the text of Step 4. |
| 5 | `node C:\Users\Duy\AppData\Local\Temp\deckagent-workspace-edits.mjs` | 0 | `workspace-edits: 13 files changed, 0 failures`. |
| 5 | `corepack pnpm@11.28.5 install --offline` | 0 | `- @deckagent/workspace-registry` in the list of deleted dev dependencies. |
| 5 | `git diff --stat pnpm-lock.yaml` | 0 | `1 file changed, 8 deletions(-)`. No insertion. |
| 6 | `corepack pnpm@11.28.5 build` | 0 | Eleven bundles. The bundle of `packages/workspace/registry` is absent. |
| 6 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 6 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 6 | `corepack pnpm@11.28.5 exec biome format apps/host/src/modules apps/host/src/local-transport.ts apps/host/src/server.ts apps/host/src/features/chats apps/host/src/features/sources packages/host/api/src apps/host/tests/workspace-registry.test.mjs` | 0 | `Checked 31 files in 36ms. No fixes applied.` |
| 6 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# tests 39`, `# pass 39`, `# fail 0`. |
| 6 | `git grep -n "workspace-registry\|workspace/registry\|features/workspaces/" -- apps/host packages package.json tsconfig.json` | 0 | One line: `package.json:8`. The step expects no line. See the deviation section. |
| 6 | `git grep -n "@deckagent/workspace-registry\|packages/workspace/registry\|src/features/workspaces/" -- apps/host packages package.json tsconfig.json` | 1 | No line. |
| 6 | `git grep -n "registerWorkspaceRoutes\|WorkspaceManagement\|workspaceManagement" -- apps packages e2e tests` | 1 | No line. |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 211 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | The nineteen suite commands of the table below | 0 | Each suite gives the expected `# pass` and `# fail` lines. |
| 8 | `git status --short` | 0 | The expected paths, with `R ` or `RM` for the moved files and `??` for the three new files. |
| 9 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 212 file(s) checked, 0 error(s) in 0 file(s)`. |
| 9 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-21-move-workspaces-module.md` | 0 | `0 violations (0 hard, baseline 0)`. The first run reported three `synonym-rotation` violations, and this report now uses one word for each action. |

## Deviation from the step text

Step 1 expects `git status --short` to print no line. At the start, the working tree held the documents of Revision 3b: `docs/build/README.md`, `plan/README.md`, Task 21 and Task 22. The owner approved a separate commit of these documents before Step 1. The commit is `38e604e`.

Step 6 expects the first `git grep` to print no line. The command prints one line, `package.json:8`, because the new test path `apps/host/tests/workspace-registry.test.mjs` holds the text `workspace-registry`. The edit script of Step 5 gives this path. The owner approved the continuation and this record. A stricter pattern (`@deckagent/workspace-registry`, `packages/workspace/registry`, `src/features/workspaces/`) prints no line.

## Suites after the move

| Suite | Command | Exit code | Pass and fail |
| --- | --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# pass 14`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | 0 | `# pass 8`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# pass 43`, `# fail 0` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | 0 | `# pass 29`, `# fail 0` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | 0 | `# pass 11`, `# fail 0` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | 0 | `# pass 29`, `# fail 0` |
| test:research | `corepack pnpm@11.28.5 test:research` | 0 | `# pass 5`, `# fail 0` |
| test:images | `corepack pnpm@11.28.5 test:images` | 0 | `# pass 39`, `# fail 0` |
| test:outline-workflow | `corepack pnpm@11.28.5 test:outline-workflow` | 0 | `# pass 6`, `# fail 0` |
| test:brief-foundation | `corepack pnpm@11.28.5 test:brief-foundation` | 0 | `# pass 15`, `# fail 0` |
| test:deck-review | `corepack pnpm@11.28.5 test:deck-review` | 0 | `# pass 21`, `# fail 0` |
| test:generation-publication | `corepack pnpm@11.28.5 test:generation-publication` | 0 | `# pass 72`, `# fail 0` |
| test:slide-pipeline | `corepack pnpm@11.28.5 test:slide-pipeline` | 0 | `# pass 7`, `# fail 0` |
| test:session-persistence | `corepack pnpm@11.28.5 test:session-persistence` | 0 | `# pass 7`, `# fail 0` |
| test:opencode-resources | `corepack pnpm@11.28.5 test:opencode-resources` | 0 | `# pass 3`, `# fail 0` |
| test:layouts | `corepack pnpm@11.28.5 test:layouts` | 0 | `# pass 10`, `# fail 0` |
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | `# pass 13`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | 0 | `# pass 2`, `# fail 0` |

## What the commands do not prove

- The tests call the six workspace routes and the methods of the registry. They do not prove that the route order stays the same for a path that no test calls.
- No test reads the order of the two error maps. A person must read `server.ts` to check that `mapWorkspaceFailure` runs before `mapApplicationFailure`.
- `scripts/scan-module-design.mjs` still names `packages/workspace/registry/` in its area list. This task does not change that tool.
- The `git grep` check of Step 6 cannot tell the name of the old package from the name of the new test file. A person must read the line `package.json:8`.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
