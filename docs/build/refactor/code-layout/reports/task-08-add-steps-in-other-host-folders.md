# Task 8: Add steps in the other Host folders report

Read this file to review the files, the commands and the checks of Task 8 of the [Code Layout implementation plan](../plan/README.md).

## Files changed

The task added 320 blank lines between the direct statements of the 89 dense function bodies that Step 2 of [Task 8](../plan/task-08-add-steps-in-other-host-folders.md) lists. No other line changed.

| File | Blank lines | Dense bodies |
| --- | --- | --- |
| `apps/host/src/cli.ts` | 5 | 1 |
| `apps/host/src/db/approvals.ts` | 7 | 2 |
| `apps/host/src/db/chat-database.ts` | 5 | 1 |
| `apps/host/src/db/request-sources.ts` | 3 | 1 |
| `apps/host/src/db/run-store.ts` | 11 | 2 |
| `apps/host/src/db/settings.migrations.ts` | 3 | 1 |
| `apps/host/src/http/app.ts` | 12 | 3 |
| `apps/host/src/http/change-feed.ts` | 2 | 1 |
| `apps/host/src/http/error-handler.ts` | 2 | 1 |
| `apps/host/src/http/multipart.ts` | 1 | 1 |
| `apps/host/src/modules/attachments/attachment-files.store.ts` | 22 | 5 |
| `apps/host/src/modules/attachments/attachments.routes.ts` | 7 | 1 |
| `apps/host/src/modules/attachments/attachments.service.ts` | 9 | 3 |
| `apps/host/src/modules/attachments/attachments.store.ts` | 9 | 2 |
| `apps/host/src/modules/attachments/draft.store.ts` | 2 | 1 |
| `apps/host/src/modules/chats/chat-requests.routes.ts` | 9 | 2 |
| `apps/host/src/modules/chats/chat-requests.service.ts` | 4 | 1 |
| `apps/host/src/modules/chats/chats.routes.ts` | 7 | 1 |
| `apps/host/src/modules/chats/chats.store.ts` | 8 | 3 |
| `apps/host/src/modules/chats/message-validation.ts` | 1 | 1 |
| `apps/host/src/modules/providers/provider-catalog.ts` | 1 | 1 |
| `apps/host/src/modules/providers/providers.routes.ts` | 4 | 1 |
| `apps/host/src/modules/providers/providers.service.ts` | 15 | 4 |
| `apps/host/src/modules/research/research.service.ts` | 6 | 1 |
| `apps/host/src/modules/research/tavily.ts` | 9 | 3 |
| `apps/host/src/modules/workspaces/folder-policy.ts` | 8 | 2 |
| `apps/host/src/modules/workspaces/workspaces.routes.ts` | 7 | 1 |
| `apps/host/src/modules/workspaces/workspaces.store.ts` | 8 | 3 |
| `apps/host/src/runs/lifecycle/run-controller.ts` | 18 | 4 |
| `apps/host/src/runs/preparation/index.ts` | 2 | 1 |
| `apps/host/src/runtimes/opencode/agent-runtime.ts` | 14 | 3 |
| `apps/host/src/runtimes/opencode/config.ts` | 2 | 1 |
| `apps/host/src/runtimes/opencode/events.ts` | 2 | 1 |
| `apps/host/src/runtimes/opencode/mcp-bridge.ts` | 8 | 3 |
| `apps/host/src/runtimes/opencode/process.ts` | 15 | 3 |
| `apps/host/src/runtimes/opencode/resources.ts` | 5 | 1 |
| `apps/host/src/runtimes/opencode/stream-tracker.ts` | 7 | 4 |
| `apps/host/src/server.ts` | 4 | 3 |
| `apps/host/src/storage/credential-store.ts` | 5 | 1 |
| `apps/host/src/storage/storage-root.ts` | 1 | 1 |
| `apps/host/src/tools/executors/source-tools.ts` | 18 | 5 |
| `apps/host/src/tools/policy/source-access.ts` | 10 | 2 |
| `apps/host/src/tools/sources/attachment-extraction.ts` | 15 | 4 |
| `apps/host/src/tools/sources/attachment-parser.ts` | 7 | 2 |
| Total | 320 | 89 |

In addition, the task marked the 6 steps as complete in [Task 8](../plan/task-08-add-steps-in-other-host-folders.md), changed the row of Task 8 to `Done` in the [plan README](../plan/README.md), added the row of Task 8 to [Code Layout Reports](README.md) and created this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --porcelain -- apps packages scripts tests` | `0` | no line |
| 2 | `node scripts/format-layout.mjs --dense apps/host/src/cli.ts apps/host/src/contract-sync.ts apps/host/src/server.ts apps/host/src/db apps/host/src/http apps/host/src/runs apps/host/src/runtimes apps/host/src/storage apps/host/src/tools apps/host/src/modules/attachments apps/host/src/modules/chats apps/host/src/modules/providers apps/host/src/modules/research apps/host/src/modules/settings apps/host/src/modules/workspaces > /tmp/dense-before.txt; tail -n 1 /tmp/dense-before.txt` | `0` | `format-layout: 89 dense function bodies` |
| 4 | `git diff -U0 --ignore-blank-lines -- apps/host/src/cli.ts apps/host/src/contract-sync.ts apps/host/src/server.ts apps/host/src/db apps/host/src/http apps/host/src/runs apps/host/src/runtimes apps/host/src/storage apps/host/src/tools apps/host/src/modules/attachments apps/host/src/modules/chats apps/host/src/modules/providers apps/host/src/modules/research apps/host/src/modules/settings apps/host/src/modules/workspaces \| grep -E '^@@'` | `1` | no line |
| 4 | `git diff -U0 -- apps/host/src/cli.ts apps/host/src/contract-sync.ts apps/host/src/server.ts apps/host/src/db apps/host/src/http apps/host/src/runs apps/host/src/runtimes apps/host/src/storage apps/host/src/tools apps/host/src/modules/attachments apps/host/src/modules/chats apps/host/src/modules/providers apps/host/src/modules/research apps/host/src/modules/settings apps/host/src/modules/workspaces \| grep -E '^-' \| grep -v -E '^---'` | `1` | no line |
| 4 | `git diff -U0 -- apps/host/src/cli.ts apps/host/src/contract-sync.ts apps/host/src/server.ts apps/host/src/db apps/host/src/http apps/host/src/runs apps/host/src/runtimes apps/host/src/storage apps/host/src/tools apps/host/src/modules/attachments apps/host/src/modules/chats apps/host/src/modules/providers apps/host/src/modules/research apps/host/src/modules/settings apps/host/src/modules/workspaces \| grep -E '^\+.*[^[:space:]]' \| grep -v -E '^\+\+\+'` | `1` | no line |
| 4 | `git diff --name-only` | `0` | 44 paths, all under `apps/host/src` |
| 5 | `node scripts/format-layout.mjs --dense apps/host/src/cli.ts apps/host/src/contract-sync.ts apps/host/src/server.ts apps/host/src/db apps/host/src/http apps/host/src/runs apps/host/src/runtimes apps/host/src/storage apps/host/src/tools apps/host/src/modules/attachments apps/host/src/modules/chats apps/host/src/modules/providers apps/host/src/modules/research apps/host/src/modules/settings apps/host/src/modules/workspaces \| tail -n 1` | `0` | `format-layout: 0 dense function bodies` |
| 5 | `corepack pnpm@11.28.5 format:check` | `0` | `format-layout: 0 finding(s)`, `Checked 312 files in 670ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` complete |
| 6 | `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 373 file(s) checked, 0 error(s) in 0 file(s)` |

An exit code of `1` for a `grep` command means that the pattern matched no line. That is the expected result of the three commands of Step 4.

## Result of Step 3

Each body got its blank lines from the table of Step 3. Four rows needed an interpretation:

- A guard that spans 3 or more lines (an `if` with no `else` whose branch is only a `throw` or a `return`, or a call whose callee ends with `throwIfAborted`) is a guard, so only the row of the guard group applies to it. The rows for a multi-line `if` or a multi-line expression statement do not apply to a guard.
- The row before the last `return` counts the one-line statements after the last blank line of the body. That blank line is the result of the rows above, so a `return` that a `try` or an `if` block already separates from the other statements does not get a second blank line.
- The exception of the row for a multi-line `if`, loop or `try` moves the blank line before the one-line declaration that the statement uses on its first line. When that declaration is the first statement of the body, the task does not add the blank line, because the `Forbidden` section does not allow a blank line as the first line inside a block. This case occurs once, in `createChatRoutes` at `apps/host/src/modules/chats/chats.routes.ts`. The row after the statement still adds a blank line, so the body gets a step after the first route.
- The row for a declaration that is far from its first use sends a row to the table `Far declarations`. The task does not move the declaration.

## Far declarations

The location is the line of the declaration in the file after this task.

| Location | Name |
| --- | --- |
| `apps/host/src/server.ts:185` | `initial` |
| `apps/host/src/server.ts:187` | `sessions` |
| `apps/host/src/server.ts:188` | `decks` |
| `apps/host/src/server.ts:189` | `settingsDb` |
| `apps/host/src/server.ts:288` | `initial` |
| `apps/host/src/server.ts:505` | `commonsImages` |
| `apps/host/src/server.ts:506` | `renderer` |
| `apps/host/src/server.ts:508` | `drafts` |
| `apps/host/src/server.ts:511` | `attachments` |
| `apps/host/src/server.ts:512` | `host` |
| `apps/host/src/server.ts:513` | `closing` |
| `apps/host/src/db/run-store.ts:100` | `prepared` |
| `apps/host/src/db/run-store.ts:101` | `now` |
| `apps/host/src/db/run-store.ts:250` | `now` |
| `apps/host/src/db/run-store.ts:251` | `written` |
| `apps/host/src/db/run-store.ts:252` | `settled` |
| `apps/host/src/http/app.ts:65` | `expected` |
| `apps/host/src/http/multipart.ts:27` | `work` |
| `apps/host/src/http/multipart.ts:28` | `uploadError` |
| `apps/host/src/runs/lifecycle/run-controller.ts:267` | `result` |
| `apps/host/src/runs/lifecycle/run-controller.ts:351` | `written` |
| `apps/host/src/runtimes/opencode/config.ts:155` | `provider` |
| `apps/host/src/runtimes/opencode/config.ts:157` | `deckagent` |
| `apps/host/src/runtimes/opencode/mcp-bridge.ts:130` | `token` |
| `apps/host/src/runtimes/opencode/mcp-bridge.ts:132` | `closing` |
| `apps/host/src/runtimes/opencode/mcp-bridge.ts:134` | `servers` |
| `apps/host/src/runtimes/opencode/process.ts:78` | `limit` |
| `apps/host/src/runtimes/opencode/process.ts:79` | `pending` |
| `apps/host/src/runtimes/opencode/process.ts:80` | `total` |
| `apps/host/src/runtimes/opencode/process.ts:156` | `malformed` |
| `apps/host/src/runtimes/opencode/process.ts:157` | `killed` |
| `apps/host/src/tools/executors/source-tools.ts:222` | `sourceKinds` |
| `apps/host/src/tools/executors/source-tools.ts:254` | `schemas` |
| `apps/host/src/tools/executors/source-tools.ts:458` | `nextCursor` |
| `apps/host/src/tools/executors/source-tools.ts:459` | `completeness` |
| `apps/host/src/tools/sources/attachment-extraction.ts:170` | `location` |
| `apps/host/src/tools/sources/attachment-parser.ts:96` | `result` |
| `apps/host/src/modules/attachments/attachment-files.store.ts:235` | `signal` |
| `apps/host/src/modules/attachments/attachments.routes.ts:20` | `ids` |
| `apps/host/src/modules/chats/chat-requests.routes.ts:40` | `queued` |
| `apps/host/src/modules/chats/chat-requests.routes.ts:41` | `replaying` |
| `apps/host/src/modules/chats/chat-requests.routes.ts:83` | `request` |
| `apps/host/src/modules/providers/provider-catalog.ts:122` | `anthropic` |
| `apps/host/src/modules/providers/provider-catalog.ts:123` | `ids` |
| `apps/host/src/modules/providers/provider-catalog.ts:124` | `seen` |
| `apps/host/src/modules/research/research.service.ts:136` | `previous` |
| `apps/host/src/modules/research/tavily.ts:200` | `results` |
| `apps/host/src/modules/workspaces/workspaces.store.ts:127` | `key` |
| `apps/host/src/modules/workspaces/workspaces.store.ts:135` | `moved` |
| `apps/host/src/modules/workspaces/workspaces.store.ts:212` | `key` |
| `apps/host/src/modules/workspaces/workspaces.store.ts:215` | `next` |

## Unchanged bodies

Each body of the list of Step 2 has at least one blank line after Step 3. The command of Step 5 prints `format-layout: 0 dense function bodies`, so this table has no row.

| Location | Name |
| --- | --- |

## Items that a decision table sent to the report

The table of Step 3 sends the declarations of the table `Far declarations` above. The exception case of `createChatRoutes` is in the section `Result of Step 3`. No other row sent an item to the report.

## STOP and retry

none

## What the commands do not prove

- The command of Step 5 proves that each body of the list has a blank line between two direct statements. It does not prove that each blank line sits between two steps: no command checks the meaning of a step.
- The three commands of Step 4 prove that the diff has no changed line and no added text. They do not prove that each blank line is at the position that the table of Step 3 selects. A person must read the diff to check the position of each blank line.
- `format:check` and `build` prove that Biome accepts each blank line and that the code compiles. They do not prove that a blank line separates the correct statements.
- The far declarations stay where they are, because the task does not move a statement. The table above records them for a later revision.
