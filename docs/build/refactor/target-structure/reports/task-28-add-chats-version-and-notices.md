# Task 28: Add the chats version and change notices report

Read this file to learn how sessions.sqlite gets schema 8 and how the Host sends chats notices, and the result of each check.

## Files changed

- `packages/session/persistence/src/schema.ts`: sets `schemaVersion` to 8, adds the table `change_versions` with the row `('chats', 'host', 0)`, and makes a schema 1 to 7 file upgrade in place.
- `packages/session/persistence/src/index.ts`: adds `SessionStoreOptions`, `chatsVersion()`, `changedChats()` and `readChatsVersion()`. Each write that changes the chat list increases the version once in its transaction. The notice goes out after the commit only.
- `apps/host/src/server.ts`: gives `onChatsChanged` to `SqliteSessionStore`, publishes the notice on the `ChangeFeed`, and adds the topic `chats` to `hostTopics`.
- `apps/host/tests/research.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/step-approval.test.mjs`: add `DROP TABLE change_versions;` to the setup that builds an old database.
- `packages/session/persistence/tests/chat-persistence.test.mjs`: changes the expected `user_version` from 7 to 8. It adds three tests for the upgrade, the increase of the version and the writes that change no chat.
- `e2e/local-foundation.test.mjs`: adds the helper `changeNotices(app, t)`, uses it in the workspace test, and adds one test for the `chats` notice.
- `docs/architecture/30-decisions.md`: records the key `'host'` for the topic `chats`, the exception for `expectedVersion` and the fields outside the chats version.
- `docs/architecture/10-agent-core.md`: changes the `chats` row of the aggregate table.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 28 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-28-add-chats-version-and-notices.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-28-add-chats-version-and-notices.md` (new): this report.
- `CHANGELOG.md`: records schema 8 and the chats notices.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "^| 27 | Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line: `README.md:186`. |
| 1 | `node -e "<line count of each file>" <the ten files>` | 0 | Ten lines: `412`, `357`, `160`, `460`, `178`, `263`, `499`, `157`, `201` and `390`, in the order of the task. |
| 2 | `git checkout -- .` | 0 | No line. It rewrites the ten files with LF line endings. See the deviation section. |
| 2 | `node C:/Users/Duy/AppData/Local/Temp/deckagent-task28-edits.mjs` | 0 | `task28-edits: 10 files changed, 0 failures`. No line contains `expected 1 match`. |
| 3 | `corepack pnpm@11.28.5 exec biome format --write packages/session/persistence apps/host/src/server.ts apps/host/tests/research.test.mjs` | 0 | `Formatted 16 files in 80ms. Fixed 7 files.` See the deviation section. |
| 3 | The same command without `--write` | 0 | `Checked 16 files in 34ms. No fixes applied.` |
| 4 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 4 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 4 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 4 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 225 file(s) checked, 0 error(s) in 0 file(s)`. |
| 4 | `node --test packages/session/persistence/tests/chat-persistence.test.mjs` | 0 | `# pass 9`, `# fail 0`. |
| 5 | `node C:/Users/Duy/AppData/Local/Temp/deckagent-task28-break.mjs notice-before-commit` | 0 | `task28-break: applied notice-before-commit`. |
| 5 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 5 | `node --test packages/session/persistence/tests/chat-persistence.test.mjs` | 1 | `# pass 7`, `# fail 2`. The failures are `each chat write increases the chats version once and sends the notice after the commit` and `a write that changes no chat, or that fails, keeps the chats version and sends no notice`. |
| 5 | `node C:/Users/Duy/AppData/Local/Temp/deckagent-task28-break.mjs restore` | 0 | `task28-break: restored`. |
| 5 | `node C:/Users/Duy/AppData/Local/Temp/deckagent-task28-break.mjs no-message-bump` | 0 | `task28-break: applied no-message-bump`. |
| 5 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 5 | `node --test packages/session/persistence/tests/chat-persistence.test.mjs` | 1 | `# pass 8`, `# fail 1`. The failure is `each chat write increases the chats version once and sends the notice after the commit`. |
| 5 | `node C:/Users/Duy/AppData/Local/Temp/deckagent-task28-break.mjs restore` | 0 | `task28-break: restored`. |
| 5 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 5 | `node --test packages/session/persistence/tests/chat-persistence.test.mjs` | 0 | `# pass 9`, `# fail 0`. |
| 6 | The nineteen suite commands of the table below | 0 | Each suite gives the expected `# pass` and `# fail` lines. |
| 7 | `git status --short` | 0 | The ten expected paths. |
| 8 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 226 file(s) checked, 0 error(s) in 0 file(s)`. |
| 8 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-28-add-chats-version-and-notices.md` | 0 | `0 violations (0 hard, baseline 0)`. `python` is not on this machine. |

## Deviation from the step text

The working copy of the ten files had CRLF line endings before Step 2. The repository stores LF: `.gitattributes` sets `* text=auto eol=lf`. The edit script of Step 2 compares text with the separator `\n`, so three edits in `schema.ts` found no match:

```text
packages/session/persistence/src/schema.ts expected 1 match, found 0: const schemaVersion = 7
packages/session/persistence/src/schema.ts expected 1 match, found 0:         ${researchTables}
        PRAGMA application_id
packages/session/persistence/src/schema.ts expected 1 match, found 0:     db.exec('COMMIT')
```

The recovery had two parts. It first restored the ten files with `git checkout -- .`, which rewrote them with LF. Git kept the same content, because the committed form of these files is LF. It then ran the same edit script again, with no change to the script. The second run gave `10 files changed, 0 failures`.

Step 3 expects `Fixed 3 files`. The command gave `Fixed 7 files`, because four more files in `packages/session/persistence/` had CRLF line endings. The command changed their line endings to LF. Their bytes after the command equal their bytes in `HEAD`, so they add no diff:

```text
packages/session/persistence/src/approvals.ts
packages/session/persistence/src/attachments.ts
packages/session/persistence/src/message.ts
packages/session/persistence/tests/session-persistence.test.mjs
```

The second command of Step 3 gave `No fixes applied`, so the formatting is stable.

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
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | `# pass 14`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | 0 | `# pass 2`, `# fail 0` |

## What the commands do not prove

- The Browser does not read the `chats` notice yet. Task 29 adds that read.
- The fields `hasDraft`, `activeRequestId`, `hasSlides` and `selectable` do not change the `version`. No test proves that a change of one of these fields alone sends no notice.
- The upgrade test reads one schema 7 file with one chat. No test reads a file with no chat, many chats, or a chat with messages.
- No test starts a connection while a chat write is in its transaction. The test `each chat write increases the chats version once and sends the notice after the commit` reads the database inside the notice callback, so it proves the order of the commit and the notice. It does not prove the behavior of a reader at a third moment.
- The chat write routes take no `expectedVersion`. No test sends one to a chat route and checks that the route ignores it.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
