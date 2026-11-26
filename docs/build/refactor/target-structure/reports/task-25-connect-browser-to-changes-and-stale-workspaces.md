# Task 25: Connect the Browser to /api/changes and handle WORKSPACES_STALE report

Read this file to learn how the Browser watches /api/changes and handles WORKSPACES_STALE, and the result of each check.

## Files changed

New code:

- `apps/web/src/browser/transport/change-client.ts`: `ChangeClient.watch` reads the SSE stream of `GET /api/changes` and decodes each frame with `decodeChangeNotice`. It throws `AUTH_REQUIRED` on HTTP status 401 and `CHANGES_REQUEST_FAILED` on another failed status.
- `apps/web/src/browser/change-watcher.ts`: `ChangeWatcher` holds one connection, gives each notice to `onNotice`, reconnects after a drop with a doubling delay, and stops after `AUTH_REQUIRED` or `close()`.

New test:

- `apps/web/tests/change-watcher.test.mjs`: the client reads fragmented frames and ignores a heartbeat. A malformed notice gives `INVALID_RESPONSE`. The watcher reconnects after a drop and stops after `close()` or `AUTH_REQUIRED`.

Changed code:

- `apps/web/src/browser/transport/index.ts`: exports `ChangeClient`.
- `apps/web/src/browser/features/workspaces/workspace-view.ts`: adds the message of `WORKSPACES_STALE`. On `WORKSPACE_NOT_FOUND` or `WORKSPACES_STALE` the view reads the list again, shows the new list and calls `changed(next, false)`.
- `apps/web/src/browser/boot.ts`: creates one `ChangeWatcher`. On a `workspaces` notice for `host` with a newer version, it reads the list again, updates the select, the chat list and the controls. It starts the watcher after `navigation.start()` and closes it on `pagehide`.

Changed tests:

- `apps/web/tests/fixtures/browser-driver.mjs`: exports `ChangeClient`.
- `e2e/browser-smoke.test.mjs`: one new test. A write through the HTTP API changes the list in the Browser. A stale `PUT` shows the message, reads the list again, keeps the dialog open and sends one write only.
- `package.json`: `test:local-web` runs `apps/web/tests/change-watcher.test.mjs`.

Changed documents:

- `CHANGELOG.md`: records this task under `## [Unreleased]` and `### Added`.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 25 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-25-connect-browser-to-changes-and-stale-workspaces.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-25-connect-browser-to-changes-and-stale-workspaces.md` (new): this report.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `node -e "<line count of each file>"` with the four files of Step 1 | 0 | Four lines: `6`, `367`, `393` and `11`. |
| 2 | Write the three new files with the content of the task file | 0 | Three files created. |
| 3 | `node C:\Users\Duy\AppData\Local\Temp\deckagent-task25-edits.mjs` | 0 | `task25-edits: 5 files changed, 0 failures`. |
| 4 | `corepack pnpm@11.28.5 build` | 0 | `Build complete` for each bundle. |
| 4 | `corepack pnpm@11.28.5 lint` | 1, then 0 | The first run reported `eslint(require-yield)` in the third test. See `Deviations from the plan`. The second run gave no error. |
| 4 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 4 | `corepack pnpm@11.28.5 exec biome format <7 paths>` | 0 | `Checked 7 files in 55ms. No fixes applied.` |
| 4 | `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# tests 47`, `# pass 47`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 test:local-web` | 0 | `# tests 11`, `# pass 11`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# pass 19`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# pass 47`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 test:http-edge` | 0 | `# pass 12`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | `# pass 14`, `# fail 0`. The suite passed on the first run. |
| 5 | `git status --short` | 0 | Nine lines. The paths match the list of Step 5. |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `0 error(s)`. |
| 6 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py <this report>` | 0 | `0 violations`. The command `python` is not available on this machine, so the run uses `python3.12`. |

## Deviations from the plan

1. `apps/web/tests/change-watcher.test.mjs`: the third test had the stub `async *watch()` with no `yield`. The command `lint` reported `eslint(require-yield)` at line 94. The plan marks this case as a STOP condition. The task owner approved one added line, `yield* []`, before the `throw`. The stub still throws `AUTH_REQUIRED` on the first `next()` call, and the test still gets one connection. The rule `require-yield` passes now. The change adds no lint-disable directive.

## What the commands do not prove

- `/api/changes` carries the `workspaces` topic only. Other Host topics (`providers`, `preferences`) join the same stream when their modules move in later Phase 3 revisions.
- The watcher discards a notice with a version that is not newer than the list in memory. The test of `e2e/browser-smoke.test.mjs` proves one add and one rename from another client. It does not prove a remove or a select from another client.
- The test `e2e/browser-smoke.test.mjs` replaces `window.fetch` after the first two notices. It proves the stale path of one `PUT` call. It does not prove the stale path of `POST` or `DELETE`.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
