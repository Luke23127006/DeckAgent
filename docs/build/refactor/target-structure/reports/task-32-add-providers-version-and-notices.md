# Task 32: Add the providers version and change notices report

Read this file to learn how `web.sqlite` schema 2, the providers version and the `providers` notice work, and the result of each check.

## Files changed

- `apps/host/src/web-state.ts`: adds the constant `applicationId`, the constant `schemaVersion` and the constant `changeVersionsTable`. The constructor of `WebState` creates `change_versions` and the row `('providers', 'host', 0)` for a fresh file and for a schema 1 file, and sets `user_version` to 2.
- `apps/host/src/modules/providers/providers.store.ts`: adds the member `version`, the member `upgrade` and the private member `upsert`. `put` now runs the row upsert, the `UPDATE change_versions` statement and the reads in one transaction, and it returns the new version.
- `apps/host/src/modules/providers/providers.service.ts`: adds the option `onProvidersChanged` and the member `version`. `save` and `remove` give the new version to `onProvidersChanged` before the first `await` after the write. `load` uses `store.upgrade` for the rewrite of an older row.
- `apps/host/src/server.ts`: gives `changeFeed` to `createRuntimeLayer` as the last parameter, publishes the `providers` notice there, adds `providersVersion` to `settings`, and adds the `providers` entry to `hostTopics` after `chats`.
- `packages/host/contracts/src/management.ts`: adds `providersVersion: number` to `WebSettings`.
- `apps/web/src/browser/transport/management-decoders.ts`: `decodeSettings` requires a non-negative safe integer in `providersVersion` and returns it.
- `apps/web/src/browser/chat-navigation.ts`: `emptySettings` gives `providersVersion: 0`.
- `docs/architecture/10-agent-core.md`: the row `providers` of the aggregate table gives the new version and notice cell.
- `e2e/local-foundation.test.mjs`: the function `changeNotices` gives the next notice of any topic when the caller names no topic. Two new tests cover the version, the notice order and the schema 1 upgrade.
- `docs/build/refactor/target-structure/plan/README.md`: sets Task 32 to `Done` and adds the link to this report.
- `docs/build/refactor/target-structure/plan/task-32-add-providers-version-and-notices.md`: marks the steps as done.
- `docs/build/refactor/target-structure/reports/README.md`: adds the row of this report.
- `docs/build/refactor/target-structure/reports/task-32-add-providers-version-and-notices.md`: this report.
- `CHANGELOG.md`: records the change.

## Commands run

The shell is PowerShell 5.1 on Windows. Every command ran from `C:/Users/Duy/Desktop/DeckAgent`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `git status --short` | 0 | No line. |
| 1 | `git grep -n "^\| 31 \| Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One line, the row of Task 31. |
| 2 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 2 | `node --test e2e/local-foundation.test.mjs` | 1 | `not ok 12`, `not ok 13`, `# tests 13`, `# pass 11`, `# fail 1`. See the deviation section. |
| 3 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 3 | `node --test e2e/local-foundation.test.mjs` | 0 | `# tests 13`, `# pass 13`, `# fail 0`. |
| 4 | `corepack pnpm@11.28.5 build` and `node --test e2e/local-foundation.test.mjs`, after the moved `onProvidersChanged` call | 0 | `not ok 12`, `# pass 12`, `# fail 1`. The change is undone. |
| 4 | The same two commands, after the deleted `UPDATE change_versions` statement | 0 | `not ok 12`, `# pass 12`, `# fail 1`. The change is undone. |
| 5 | `corepack pnpm@11.28.5 exec biome format --write <the eight changed code and test files>` | 0 | `Formatted 7 files in 42ms. Fixed 1 file.` |
| 5 | The same `biome format` command without `--write` | 0 | `Checked 7 files in 37ms. No fixes applied.` |
| 5 | `corepack pnpm@11.28.5 build` | 0 | Every bundle completes. |
| 5 | `corepack pnpm@11.28.5 lint` | 0 | No error. |
| 5 | `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| 5 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 234 file(s) checked, 0 error(s) in 0 file(s)`. |
| 6 | The nineteen suite commands of the table below | 0 | Every suite gives `# fail 0` after the retries of the second section. |
| 6 | `corepack pnpm@11.28.5 test:generation-publication` | 0 | `# pass 72`, `# fail 0`. |
| 6 | `corepack pnpm@11.28.5 test:browser-smoke` | 0 | `# pass 15`, `# fail 0`. |
| 7 | `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 235 file(s) checked, 0 error(s) in 0 file(s)`. |
| 7 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py <this report>` | 0 | `0 violations (0 hard, baseline 0)`. |

## Schema rules

| File state | Result of the constructor of `WebState` |
| --- | --- |
| A fresh file | Creates `providers`, `preferences` and `change_versions`. Inserts `('providers', 'host', 0)`. Sets `application_id` to `1145132866` and `user_version` to 2. |
| `application_id` `0x44415742` and `user_version` 1 | Creates `change_versions`, inserts `('providers', 'host', 0)` and sets `user_version` to 2, between `BEGIN IMMEDIATE` and `COMMIT`. Each row of `providers` and `preferences` stays. |
| `application_id` `0x44415742` and `user_version` 2 | Keeps the file. |
| Any other file | Throws `WebStateError('SETTINGS_SCHEMA')`, as before. |

The test `web.sqlite schema 1 upgrades to schema 2 in place and keeps providers and preferences` checks row 2, row 3 and the `STORAGE_CORRUPT` error of a `user_version` 3 file.

## Notice rules

| Write | Version | Order of the notice |
| --- | --- | --- |
| `save` | One increase in the transaction of `put` | After the new row, the in-memory map and the key map change, before the key cleanup and before `modelsRemoved`. |
| `remove` | One increase in the transaction of `put` | After the tombstone, the in-memory map and the key map change, before the key cleanup and before `modelsRemoved`. |
| `load` | No increase | No notice. `store.upgrade` writes the row only. |
| A refused write | No increase | No notice. The test `provider writes increase the providers version and send the providers notice before the chats notice` checks it. |

## Suites after the change

| Suite | Exit code | Pass and fail |
| --- | --- | --- |
| test:http-edge | 0 | `# pass 12`, `# fail 0` |
| test:tools-browser | 0 | `# pass 19`, `# fail 0` |
| test:local-web | 0 | `# pass 11`, `# fail 0` |
| test:local-foundation | 0 | `# pass 53`, `# fail 0` |
| test:model-requests | 0 | `# pass 29`, `# fail 0` |
| test:source-permissions | 0 | `# pass 11`, `# fail 0` |
| test:attachments | 0 | `# pass 29`, `# fail 0` |
| test:research | 0 | `# pass 5`, `# fail 0` |
| test:images | 0 | `# pass 39`, `# fail 0` |
| test:outline-workflow | 0 | `# pass 6`, `# fail 0` |
| test:brief-foundation | 0 | `# pass 15`, `# fail 0` |
| test:deck-review | 0 | `# pass 21`, `# fail 0` |
| test:generation-publication | 0 | `# pass 72`, `# fail 0` on the third run |
| test:slide-pipeline | 0 | `# pass 7`, `# fail 0` |
| test:session-persistence | 0 | `# pass 7`, `# fail 0` |
| test:opencode-resources | 0 | `# pass 3`, `# fail 0` |
| test:layouts | 0 | `# pass 10`, `# fail 0` |
| test:browser-smoke | 0 | `# pass 15`, `# fail 0` on the third run |
| test:env-startup | 0 | `# pass 2`, `# fail 0` |

## Deviations and retries

1. Step 2, `node --test e2e/local-foundation.test.mjs`: the expected output is `# fail 2` and the output gives `# fail 1` with `# cancelled 1`. Node 22.23.5 stops the test `provider writes increase the providers version and send the providers notice before the chats notice` at its 30000 ms timeout, and the summary counts a timed-out test as `cancelled`, not as `fail`. The output gives `not ok 12` and `not ok 13`, so both new tests fail as the task wants. Step 3 gives `# pass 13` and `# fail 0`.
2. Step 6, first run, `test:generation-publication`: `# pass 71`, `# fail 1`. The test `Create deck prepares images, then MCP templates v3 publish all seven layouts through the real local renderer` fails in its `after` hook with `EBUSY: resource busy or locked, unlink ...\artifact-check\render-hwu5QZ\CrashpadMetrics-active.pma`. A Chromium process keeps a file of the temporary renderer profile open while the hook clears the folder. No production file is in the stack.
3. Step 6, second run, `test:generation-publication`: `# pass 71`, `# fail 1` on another test, `web-image generation saves attribution and separate presenter notes, then reopens offline without replay`. The cause is the same `EBUSY` error of another file of the temporary renderer folder. The failing test is different, so the two failures do not name one behavior.
4. Step 6, first and second run, `test:browser-smoke`: `# pass 14`, `# fail 1` on `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides`. This test is one of the two known timing flakes of the Task protocol. The assertion waits for `3/3` slides after an explicit continuation and reads `1/3` with the status `Đang gửi` after 40000 ms.
5. Step 6, third run: `node --test --test-concurrency=1 e2e/browser-smoke.test.mjs` gives `# pass 14`, `# fail 0`, and `node --test --test-concurrency=1 apps/host/tests/research-image-generation.test.mjs e2e/portable-generation-http.test.mjs` gives `# pass 3`, `# fail 0`.
6. Step 6, fourth run: `corepack pnpm@11.28.5 test:generation-publication` gives `# pass 72`, `# fail 0`, and `corepack pnpm@11.28.5 test:browser-smoke` gives `# pass 15`, `# fail 0`. The machine was idle for the last two runs and no other renderer ran.

No STOP condition occurred. Every suite passes on its own. The failures of the first runs come from two different tests of the same cleanup hook and from the named timing flake. They do not name one behavior that the change broke.

`python` is not on this machine. The STE lint command ran with `python3.12`.

## What the commands do not prove

- The Browser does not read `providersVersion` or the `providers` notice yet. Task 34 adds it. The `onNotice` handler of `apps/web/src/browser/boot.ts` ignores the `providers` topic, and no test shows that the Browser refreshes the settings on a `providers` notice.
- The upgrade test reads one schema 1 file that the current code made. It does not prove the upgrade of a schema 1 file that an older DeckAgent version wrote. It also does not prove that every row of a larger file stays.
- No test covers a write to `providers` that fails after the row upsert and before `COMMIT`. The `ROLLBACK` branch of `put` has no test.
- The suites prove the current behavior only. They do not prove that a later change keeps it.
