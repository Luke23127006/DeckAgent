# Task 29: Refresh the Browser chat list from chats notices report

Read this file to learn how the Browser reads the chat list again after a newer chats notice, and the result of each check.

## Files changed

- `apps/web/src/browser/boot.ts`: keeps the version of the last `chats` notice that this tab handled in `chatsVersion`, and starts it at `-1`. A `chats` notice with a higher version awaits `navigation.refresh()`, saves the version and calls `controls()`. The notice does not open a chat. The `workspaces` branch does not change.
- `e2e/browser-smoke.test.mjs`: adds the test `Browser shows a chat that another client creates, from the chats notice of /api/changes`. The test opens the Browser and counts the reads of `GET /api/sessions`. It then creates a chat from a second client and waits for the new chat button. It checks that the Browser read the chat list again. It also checks that the new chat is not open.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 29 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-29-refresh-browser-chat-list-from-notices.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-29-refresh-browser-chat-list-from-notices.md` (new): this report.
- `CHANGELOG.md`: records the new read of the chat list.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "^| 28 | Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line: `README.md:187`. |
| 1 | `node -e "<line count of each file>" apps/web/src/browser/boot.ts e2e/browser-smoke.test.mjs` | 0 | Two lines: `414 apps/web/src/browser/boot.ts` and `2475 e2e/browser-smoke.test.mjs`. |
| 1 | `git grep -n "topic: 'chats'" -- apps/host/src/server.ts` | 0 | Two lines: `server.ts:184` and `server.ts:354`. |
| 2 | `node C:/Users/Duy/AppData/Local/Temp/deckagent-task29-edits.mjs` | 0 | `task29-edits: 2 files changed, 0 failures`. No line contains `expected 1 match`. |
| 3 | `corepack pnpm@11.28.5 exec biome format apps/web/src/browser/boot.ts` | 0 | `Checked 1 file in 14ms. No fixes applied.` |
| 3 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 3 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 3 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 4 | `node --test --test-name-pattern "chats notice" e2e/browser-smoke.test.mjs` | 0 | `# pass 1`, `# fail 0`. |
| 4 | `git stash push -- apps/web/src/browser/boot.ts` | 0 | `Saved working directory and index state`. |
| 4 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 4 | `node --test --test-name-pattern "chats notice" e2e/browser-smoke.test.mjs` | 1 | `# pass 0`, `# fail 1`. The failure is `Browser did not show the chat of another client after the chats notice`. |
| 4 | `git stash pop` | 0 | `Dropped refs/stash@{0}`. |
| 4 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 4 | `node --test --test-name-pattern "chats notice" e2e/browser-smoke.test.mjs` | 0 | `# pass 1`, `# fail 0`. |
| 5 | The nineteen suite commands of the table below | 0 | Each suite gives the expected `# pass` and `# fail` lines. |
| 6 | `git status --short` | 0 | `M apps/web/src/browser/boot.ts` and `M e2e/browser-smoke.test.mjs`. |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 227 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-29-refresh-browser-chat-list-from-notices.md` | 0 | `0 violations (0 hard, baseline 0)`. `python` is not on this machine. The first run gave one `long-sentence` violation at line 8, and the split sentence of that line cleared it. |

## Suites after the change

| Suite | Command | Exit code | Pass and fail |
| --- | --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# pass 19`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | 0 | `# pass 11`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# pass 51`, `# fail 0` |
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
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | `# pass 15`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | 0 | `# pass 2`, `# fail 0` |

## What the commands do not prove

- The new test proves one chat that another client creates. It does not prove a model change, a message or an ungroup from another client.
- The first notice of each connection runs one extra read of the list. `chatsVersion` starts at `-1`, so the first `chats` notice always passes the check. No test counts the reads of one connection.
- The test counts the reads of `GET /api/sessions` in the Browser only. It does not prove which read comes from the notice and which read comes from another call.
- No test sends two notices with the same version or with a lower version. No test proves that such a notice skips the read.
- No test opens a chat and then sends a `chats` notice. The test proves that the new chat is not open only when no chat was open before.
- A tab that stays open across a table rebuild keeps `chatsVersion` in memory. No test covers the case where the Host restarts and the version starts again at a lower value.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
