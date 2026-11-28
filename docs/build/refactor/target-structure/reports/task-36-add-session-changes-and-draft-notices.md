# Task 36: Add session change route and draft change notices report

Read this file to learn how the new session change route and draft notices work and the result of each check.

## Files changed

Changed:

- `apps/host/src/http/change-feed.ts`: adds the interfaces `SessionChangeTopic` and `SessionChangeRoutesOptions`, the function `writeNotice`, the optional parameter `session` of `createChangeRoutes`, and the route `GET /api/sessions/:sessionId/changes`. The route uses `params({ sessionId: /^[\w-]{1,100}$/ })` and replies `404 SESSION_NOT_FOUND` when `session.exists` returns `false`. It subscribes to each topic with the key `sessionId` before it reads the initial versions. It then opens the stream with `openSseStream(res, streams, unsubscribeAll)` and sends each initial notice.
- `apps/host/src/http/start-host.ts`: adds `sessionTopics` and `sessionExists` to `StartHostOptions.changes` and passes them to `createChangeRoutes`.
- `apps/host/src/modules/attachments/draft.store.ts`: adds the optional constructor argument `onChanged`, the private map `notices`, and the methods `version(chatId)` and `touch(chatId)`. The method `save` calls `this.touch(chatId)` after `this.drafts.set(chatId, next)`.
- `apps/host/src/modules/attachments/attachments.store.ts`: the `catch` block of `receive` calls `this.drafts.touch(input.sessionId)` after `this.log.reject(...)`.
- `apps/host/src/modules/attachments/attachments.service.ts`: adds `AttachmentCoordinator.draftVersion(id)`. The `catch` block of `upload` calls `this.drafts.touch(input.sessionId)` after `this.store.attachments.reject(...)`. The method `prepare` calls `this.drafts.touch(id)` after `this.store.attachments.ready(...)` and after `this.store.attachments.reject(...)`.
- `apps/host/src/server.ts`: creates `changeFeed` before `drafts`, gives the publish callback to `new MemoryDraftStore(...)`, and adds `sessionExists` and `sessionTopics` to `changes`.
- `apps/host/tests/change-feed.test.mjs`: adds the test of the session change route.
- `e2e/attachment-admission.test.mjs`: imports `request` from `node:http` and adds the test of the draft notices.
- `docs/architecture/10-agent-core.md`: changes the `Hiện tại` cell of the `draft` row of the table `Aggregate và change notice`.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 36 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-36-add-session-changes-and-draft-notices.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `CHANGELOG.md`: records the session change route and the draft notices.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "^\| 35 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the row of Task 35. |
| 2 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 2 | `node --test apps/host/tests/change-feed.test.mjs e2e/attachment-admission.test.mjs` | 1 | `# pass 9`, `# fail 2`. |
| 3 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 3 | `node --test apps/host/tests/change-feed.test.mjs e2e/attachment-admission.test.mjs` | 0 | `# pass 11`, `# fail 0`. |
| 4 | `node --test --test-timeout=15000 e2e/attachment-admission.test.mjs` after the removal of `this.drafts.touch(id)` | 1 | `test timed out after 15000ms`, `# pass 6`, `# cancelled 1`. |
| 4 | The same command after the removal of `this.touch(chatId)` from `save` | 1 | `test timed out after 15000ms`, `# pass 6`, `# cancelled 1`. |
| 5 | `corepack pnpm@11.28.5 exec biome format --write <the eight code and test files>` | 0 | `Formatted 7 files in 31ms. No fixes applied.` |
| 5 | The same `biome format` command without `--write` | 0 | `Checked 7 files in 31ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 5 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 5 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 5 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 242 file(s) checked, 0 error(s) in 0 file(s)`. |
| 6 | The nineteen suite commands of the table below | 0 | Each suite gives `# fail 0`. |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 243 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py <this report>` | 0 | `0 violations (0 hard, baseline 0)`. |

The command `biome format` reports `Formatted 7 files` because `biome.json` limits `files.includes` to `apps`, `packages`, `scripts` and `tests`, and the argument `e2e/attachment-admission.test.mjs` is outside those folders. The output `No fixes applied` holds for all files.

## Suites

| Suite | Command | Exit code | Pass and fail |
| --- | --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | 0 | `# pass 21`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | 0 | `# pass 11`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | 0 | `# pass 54`, `# fail 0` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | 0 | `# pass 29`, `# fail 0` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | 0 | `# pass 11`, `# fail 0` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | 0 | `# pass 30`, `# fail 0` |
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
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | `# pass 17`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | 0 | `# pass 2`, `# fail 0` |

## Notice rules

| Rule | Where | Check |
| --- | --- | --- |
| The session stream shares `routes.streams` | `createChangeRoutes` gets the set `routes.streams` from `startHost` | The 64-stream limit test of `apps/host/tests/change-feed.test.mjs` passes |
| The route checks existence | `session.exists` gives `404 SESSION_NOT_FOUND` | The new test of `apps/host/tests/change-feed.test.mjs` |
| The route isolates keys | `feed.subscribe(entry.topic, sessionId, send)` | The new test publishes `chat-b` and gets only `chat-a` |
| Each draft write increases the notice version | `MemoryDraftStore.save` calls `this.touch(chatId)` | The new e2e test expects version 1 after the first write |
| Each attachment settlement increases the notice version | `receive`, `upload`, `prepare` | The new e2e test expects versions 2, 3 and 4 |
| Background settlement keeps `draft.revision` | `touch` changes no draft snapshot | The new e2e test compares the revision after `ready` |

## Items for the report

- The `Hiện tại` cell of the `draft` row is the only cell that this task changes in the architecture file. The `version` column still says `revision của draft`, as the task states.
- `AttachmentCoordinator.draftVersion` is not part of `AttachmentOperations`, because only `server.ts` reads it and no route needs it.
- The e2e test uses the `request` function of `node:http` instead of `fetch`, because the global `fetch` buffers an SSE reply and the test needs each event as it arrives.
- The two break checks of Step 4 fail as a timeout, not as an assertion. The test waits for a notice that the broken code never publishes. I used `--test-timeout=15000` so the run ends in 15 seconds.
- `python` is not on this machine. The STE lint command ran as `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py`.

## Retries

1. Step 3, the first `build` after the code changes: the wrapper reported exit code 1 while the pipeline `| Select-Object -Last 15` printed no error. The next run of the same command wrote its full output to a file and gave exit code 0 with no line that contains `error` or `fail`. The cause is the output pipeline of the first shell call, not a defect in the code. No file changed.

No STOP condition occurred.

## What the commands do not prove

- The Browser still uses its 500 ms poll and does not open `/api/sessions/:sessionId/changes` yet. Task 38 adds it.
- No test covers the `reject` path of `upload` and `prepare` with a draft notice. The new e2e test covers the `ready` path and the draft writes.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
