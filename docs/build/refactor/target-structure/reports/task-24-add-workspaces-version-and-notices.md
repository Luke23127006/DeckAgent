# Task 24: Add version, schema 2 upgrade, expectedVersion and ChangeFeed wiring to the workspaces module report

Read this file to learn how the workspaces module upgrades to schema 2, checks expectedVersion and publishes change notices, and the result of each check.

## Files changed

Changed code:

- `apps/host/src/modules/workspaces/contracts.ts`: adds `WORKSPACES_STALE` to `WorkspaceErrorCode`.
- `apps/host/src/modules/workspaces/schema.ts`: writes schema version 2, creates the table `change_versions` with the row `('workspaces', 'host', 0)`, and upgrades a schema 1 database in the same transaction as the other checks.
- `apps/host/src/modules/workspaces/workspaces.store.ts`: adds `version()` and `publishVersion(version)`, adds the option `WorkspaceRegistryOptions.publish`, gives the write methods the optional argument `expectedVersion`, and returns the new version from `remove`. Each write increases the version and writes the row inside one transaction. A notice goes out after the commit.
- `apps/host/src/modules/workspaces/workspaces.service.ts`: the write methods of `WorkspaceOperations` require `expectedVersion`, the list has `version`, and `remove` publishes the notice after `chats.ungroup` ends.
- `apps/host/src/modules/workspaces/workspaces.routes.ts`: the five Zod body decoders replace the helper `field`. A `RequestValidationError` becomes `400 INVALID_REQUEST`.
- `apps/host/src/modules/workspaces/workspaces.errors.ts`: maps `WORKSPACES_STALE` to HTTP status 409.
- `apps/host/src/modules/workspaces/folder-policy.ts`: replaces the type assertion with a check on `code in error`. The file has no type assertion now.
- `packages/host/contracts/src/management.ts`: `WorkspaceList` has the field `readonly version: number`.
- `apps/host/src/server.ts`: creates the `ChangeFeed`, gives it to `WorkspaceRegistry`, and gives it to `startHost` with the topic `workspaces`. `createHostOptions` returns `StartHostOptions`.
- `apps/web/src/browser/transport/management-decoders.ts`: reads `version` and rejects a list that has no non-negative safe integer in that field.
- `apps/web/src/browser/transport/management-client.ts`: each write call sends `expectedVersion`, and `allowedCodes` has `WORKSPACES_STALE`.
- `apps/web/src/browser/chat-navigation.ts` and `apps/web/src/browser/features/workspaces/workspace-view.ts`: the first list has `version: 0`, and each write call sends `state.list.version`.

Changed tests:

- `apps/host/tests/workspace-registry.test.mjs` (new tests): the schema 1 upgrade, the version increase and notices of each write, and the stale `expectedVersion`.
- `e2e/local-foundation.test.mjs`: the calls send `expectedVersion`. One new test checks the HTTP status 409, the notice after `chats.ungroup`, and the first notice of each connection.
- `e2e/model-requests.test.mjs`, `apps/host/tests/brief-host.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/source-requests.test.mjs` and `e2e/opencode-source-live.test.mjs`: the add calls send `expectedVersion: 0`.

Changed documents:

- `CHANGELOG.md`: records this task under `## [Unreleased]` and `### Added`.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 24 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-24-add-workspaces-version-and-notices.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-24-add-workspaces-version-and-notices.md` (new): this report.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `node -e "<line count of each file>"` with the seven files of Step 1 | 0 | Seven lines: `56`, `60`, `289`, `64`, `59`, `38` and `394`. |
| 2 | Write the six module files with a temporary copy, then compare each file with its code block in the task file | 0 | `matched 6 of 6`. |
| 3 | `node C:\Users\Duy\AppData\Local\Temp\deckagent-task24\deckagent-task24-edits.mjs` | 0 | `task24-edits: 14 files changed, 0 failures`. |
| 4 | `corepack pnpm@11.28.5 build` | 0 | `Build complete` for each bundle. |
| 4 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 4 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 4 | `corepack pnpm@11.28.5 exec biome format <9 paths>` | 1, then 0 | The first run reported `format ━` in two files. See `Deviations from the plan`. The second run gave `Checked 17 files in 46ms. No fixes applied.` |
| 4 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# tests 47`, `# pass 47`, `# fail 0`. |
| 4 | `git grep -n "function field(" -- apps/host/src/modules/workspaces` | 1 | No line. |
| 4 | `git grep -n " as " -- apps/host/src/modules/workspaces/folder-policy.ts` | 0 | Three lines: two comments and one message string. The type assertion is absent. See `Deviations from the plan`. |
| 5 | The nineteen suite commands of the table below | 0 | Each suite gives the expected `# pass` and `# fail` lines, after the fix of the two new tests. See `Deviations from the plan`. |
| 4, 5 | `corepack pnpm@11.28.5 build`, `corepack pnpm@11.28.5 lint`, `corepack pnpm@11.28.5 check:boundaries` and `biome format` again after the fix of the two new tests | 0 | The same result as above. |
| 6 | `git status --short` | 0 | Twenty lines with ` M`, and the paths match the list of Step 6. |

## Deviations from the plan

1. `apps/host/src/modules/workspaces/workspaces.store.ts`: the method `currentVersion` writes the query chain on one line, because the line has 120 characters and the Biome line width is 120. The command `biome format --write` made this change. The code does the same work.
2. `apps/host/tests/brief-host.test.mjs`: the command `biome format --write` broke one line that was already longer than 120 characters at line 83 before this task. The step command of Step 4 names this file, so the check needs the change. No other line changed.
3. Step 4 expects `git grep -n " as "` on `folder-policy.ts` to print no line. The command prints three lines, and each line is a comment or a message string. The file held these three lines before this task. The type assertion at line 55 is absent. The command `git grep -nE "\) as [A-Za-z]|as (const|unknown|any|NodeJS)"` prints no line, so the file has no type assertion.
4. Step 5: the first two runs of `test:local-foundation` gave `# pass 45` and `# fail 2`. The two new tests of `apps/host/tests/workspace-registry.test.mjs` failed in the hook `after` with `EBUSY` on `workspaces.sqlite-shm`. The helper `setup(t)` removes the temporary folder in its own `after` hook, and Node runs the hooks in the order of registration, so the folder went before `t.after(() => registry.close())`. Each new test now calls `registry.close()` as its last line. The third run gave `# pass 47` and `# fail 0`. This case meets the STOP condition of Step 5, and the owner must approve the fix before Task 25 starts.

## Suites

| Suite | Command | Exit code | Pass and fail |
| --- | --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# pass 19`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | 0 | `# pass 8`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# pass 47`, `# fail 0` |
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

- The Browser does not open `GET /api/changes` yet, and it does not show the `WORKSPACES_STALE` message yet. `management-client.ts` decodes `WORKSPACES_STALE`, and `workspace-view.ts` sends the version. No test in a real browser proves these two parts. Task 25 adds the Browser behavior and its real-browser test.
- The new test of `e2e/local-foundation.test.mjs` reads the notice after `chats.ungroup` ends. It proves the order for one remove call. It does not prove the order for a later change of the code.
- The test of the schema 1 upgrade reads one database with two workspaces. It does not prove the upgrade of a database with a removed workspace or with a different selection.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
