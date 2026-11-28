# Task 38: Connect the Browser to draft notices and handle DRAFT_CONFLICT report

Read this file to learn how the Browser reads draft notices and handles `DRAFT_CONFLICT`, and the result of each check.

## Files changed

Changed:

- `apps/web/src/browser/transport/change-client.ts`: adds `watchSession(sessionId, signal)`, which opens `/api/sessions/:sessionId/changes`, and the private `stream(path, signal)`. `watch` yields from `stream('/api/changes', signal)`.
- `apps/web/src/browser/chat-navigation.ts`: adds the optional member `onSessionOpen` to `ChatNavigationOptions`. `open` calls `this.options.onSessionOpen?.(session.sessionId)` directly after `this.options.deckModel.open(session.sessionId)`.
- `apps/web/src/browser/boot.ts`: adds `sessionWatcher`, `watchedSessionId` and the function `openSessionChanges`. It closes the previous watcher, starts one `ChangeWatcher` over `changeClient.watchSession`, and calls `draftSync.onDraftNotice` for a newer `draft` notice of the open chat. It passes `onSessionOpen: openSessionChanges` to `createChatNavigation` and calls `sessionWatcher?.close()` in the `pagehide` handler.
- `apps/web/src/browser/draft-sync.ts`: removes `attachmentTimer`, `setInterval`, `checkAttachments`, `checkingAttachments`, `onFocus`, the window `focus` listener and `syncFocusedDraft`. It adds `pendingNotices`, `noticeVersions`, `syncingNotices`, the method `onDraftNotice` and the helper `drainPendingNotice`. `uploadAttachments`, `removeAttachment` and `flushDraft` drain a pending notice in `finally`. `flushDraft` shows the conflict message on `DRAFT_CONFLICT` and does not send the write again. `removeAttachment` reads the draft again after an error and ignores a second read error before it rethrows.
- `e2e/browser-smoke.test.mjs`: adds the test `Browser updates the open draft from the draft notice of /api/sessions/:sessionId/changes` and the test `A draft save after a change in another client gets DRAFT_CONFLICT, keeps the typed text and does not send again`.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 38 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-38-connect-browser-to-draft-notices.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `CHANGELOG.md`: records the draft notice stream, the removed polling, and the `DRAFT_CONFLICT` behavior.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "^\| 37 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the row of Task 37. |
| 2 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 2 | `node --test --test-name-pattern="draft notice\|DRAFT_CONFLICT" e2e/browser-smoke.test.mjs` | 1 | `# pass 0`, `# fail 2`. |
| 3 | `git grep -n -E "setInterval\|checkAttachments\|syncFocusedDraft" -- apps/web/src/browser/draft-sync.ts` | 1 | No line. |
| 3 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 3 | `node --test --test-name-pattern="draft notice\|DRAFT_CONFLICT" e2e/browser-smoke.test.mjs` | 0 | `# pass 2`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 build` and then `node --test --test-name-pattern="draft notice" e2e/browser-smoke.test.mjs` | 0 and 1 | `# pass 0`, `# fail 1`. The change removes the `draft` call in `openSessionChanges`. |
| 4 | `corepack pnpm@11.28.5 build` and then `node --test --test-name-pattern="DRAFT_CONFLICT" e2e/browser-smoke.test.mjs` | 0 and 1 | `# pass 0`, `# fail 1`. The change removes the `DRAFT_CONFLICT` branch, and `onDraftNotice` returns at once. |
| 4 | `corepack pnpm@11.28.5 build` and then `node --test --test-name-pattern="draft notice\|DRAFT_CONFLICT" e2e/browser-smoke.test.mjs` | 0 and 0 | `# pass 2`, `# fail 0`. Both breaks are undone. |
| 5 | `corepack pnpm@11.28.5 exec biome format --write <the five code and test files>` | 0 | `Formatted 4 files in 15ms. No fixes applied.` |
| 5 | The same `biome format` command without `--write` | 0 | `Checked 4 files in 38ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 5 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 5 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 5 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 244 file(s) checked, 0 error(s) in 0 file(s)`. |
| 6 | The nineteen suite commands of the table below | 0 | Each suite gives `# fail 0`. |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 245 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py <this report>` | 0 | `0 violations (0 hard, baseline 0)`. |

The command `biome format` reports `Formatted 4 files` because `biome.json` limits `files.includes` to `apps`, `packages`, `scripts` and `tests`, and `e2e/browser-smoke.test.mjs` is outside those folders. The output `No fixes applied` holds for all files.

## Suites

| Suite | Command | Exit code | Pass and fail |
| --- | --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# pass 22`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | 0 | `# pass 11`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# pass 54`, `# fail 0` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | 0 | `# pass 29`, `# fail 0` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | 0 | `# pass 11`, `# fail 0` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | 0 | `# pass 31`, `# fail 0` |
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
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | 1 on the first run, 0 on the second run | `# pass 18`, `# fail 1` with the known timing flake `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides`, then `# pass 19`, `# fail 0`. |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | 0 | `# pass 2`, `# fail 0` |

## Items for the report

- The `DRAFT_CONFLICT` message is the existing text of `receiveDraft`. The browser test of the conflict reads the message from `.request-status[role=status]`.
- `ChangeWatcher` keeps its interface `Pick<ChangeClient, 'watch'>`. `boot.ts` passes the inline object `{ watch: signal => changeClient.watchSession(sessionId, signal) }`, so `change-watcher.ts` needs no change.
- The test of the draft notice uses one Browser tab and one HTTP client. No second Browser tab opens the same chat.

## Retries

1. Step 2, the first `build` after the new tests: the wrapper reported exit code 1, and the pipeline `| Select-Object -Last 20` printed no error. The next run of the same command wrote its full output to a file, and it gave exit code 0 with no `error` line. The cause is the output pipeline of the first shell call, not a defect in the code. No file changed.
2. Step 6, `test:browser-smoke` gave `# fail 1` on the known timing flake `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides`. The task protocol permits one more run of the suite. The second run gave `# pass 19`, `# fail 0`.

No STOP condition occurred.

## What the commands do not prove

- The tests use one Browser tab and one HTTP client, not two Browser tabs.
- No test proves that the Browser closes the session stream when it opens another chat. The code closes `sessionWatcher` in `openSessionChanges` and in the `pagehide` handler, but no test counts the open streams.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
