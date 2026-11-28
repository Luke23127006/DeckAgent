# Task 56: Split packages/session/persistence into apps/host/src/db and module stores with schema v9 report

Read this file to check the split of session persistence, schema v9 migration, boundary checks and full test results.

## Result

`packages/session/` no longer exists on disk.
`apps/host/src/db/` now owns `SessionDatabase`, schema v9 migrations and `SqliteRunStore`.
`apps/host/src/modules/chats/chats.store.ts` now owns `sessions`, `messages` and `change_versions` SQL.
`apps/host/src/modules/attachments/attachment-log.store.ts` now owns `attachments` and `sources` SQL.
`apps/host/src/server.ts` composes `openSessionStorage` with atomic admission and settlement hooks.
The temporary `owner` to `sessionId` adapters around `RunController` and `OpenCodeAgentRuntime` are gone.
All 19 test suites, the build, lint, boundary checks and docs checks pass.
The parent agent owns the commit and push.

## Split files

| Old path | New path | Owner |
| --- | --- | --- |
| `packages/session/persistence/src/index.ts` | `apps/host/src/db/session-database.ts` | Host database layer |
| `packages/session/persistence/src/index.ts` | `apps/host/src/modules/chats/chats.store.ts` | Chats module |
| `packages/session/persistence/src/index.ts` | `apps/host/src/db/index.ts` | Host database layer |
| `packages/session/persistence/src/schema.ts` | `apps/host/src/db/sessions-schema.ts` | Host database layer |
| `packages/session/persistence/src/contracts.ts` | `apps/host/src/db/contracts.ts` | Host database layer |
| `packages/session/persistence/src/requests.ts` | `apps/host/src/db/run-store.ts` | Host database layer |
| `packages/session/persistence/src/approvals.ts` | `apps/host/src/db/approvals.ts` | Host database layer |
| `packages/session/persistence/src/request-queries.ts` | `apps/host/src/db/request-queries.ts` | Host database layer |
| `packages/session/persistence/src/request-sources.ts` | `apps/host/src/db/request-sources.ts` | Host database layer |
| `packages/session/persistence/src/request-validation.ts` | `apps/host/src/db/request-validation.ts` | Host database layer |
| `packages/session/persistence/src/runtime-bindings.ts` | `apps/host/src/db/runtime-bindings.ts` | Host database layer |
| `packages/session/persistence/src/message.ts` | `apps/host/src/modules/chats/message.ts` | Chats module |
| `packages/session/persistence/src/attachments.ts` | `apps/host/src/modules/attachments/attachment-log.store.ts` | Attachments module |
| `packages/session/persistence/tests/chat-persistence.test.mjs` | `apps/host/tests/chat-persistence.test.mjs` | Host tests |
| `packages/session/persistence/tests/session-persistence.test.mjs` | `apps/host/tests/session-persistence.test.mjs` | Host tests |
| `apps/web/tests/web-session.test.mjs` | `apps/host/tests/web-session.test.mjs` | Host tests |

## Files changed

- Created: `apps/host/src/db/session-database.ts`, `apps/host/src/db/sessions-schema.ts`, `apps/host/src/db/contracts.ts`, `apps/host/src/db/approvals.ts`, `apps/host/src/db/request-queries.ts`, `apps/host/src/db/request-sources.ts`, `apps/host/src/db/request-validation.ts`, `apps/host/src/db/runtime-bindings.ts`, `apps/host/src/db/run-store.ts`, `apps/host/src/db/index.ts`, `apps/host/src/modules/chats/chats.store.ts`, `apps/host/src/modules/chats/message.ts`, `apps/host/src/modules/attachments/attachment-log.store.ts`, `apps/host/tests/fixtures/session-store.mjs`.
- Moved: `apps/host/tests/chat-persistence.test.mjs`, `apps/host/tests/session-persistence.test.mjs`, `apps/host/tests/web-session.test.mjs`.
- Removed: `packages/session/` and `apps/web/tests/web-session.test.mjs`.
- Changed: `apps/host/src/server.ts`, `apps/host/src/web-state.ts`, `apps/host/src/contract-sync.ts`, `apps/host/src/modules/chats/index.ts`, `apps/host/src/modules/attachments/index.ts`, `apps/host/package.json`, `apps/host/tsconfig.json`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.oxlintrc.json`, `scripts/check-boundaries.mjs`.
- Updated tests: `apps/host/tests/http-server.test.mjs`, `apps/host/tests/research.test.mjs`, `apps/host/tests/web-management.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/deck-pipeline.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/layout-review-browser.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/local-web.test.mjs`, `e2e/model-requests.test.mjs`, `e2e/request-lifecycle.test.mjs`, `e2e/step-approval.test.mjs`, `tests/oxlint-boundaries.test.mjs`, `tests/check-boundaries.test.mjs`.
- Updated docs and changelog: `docs/build/refactor/target-structure/plan/task-56-split-session-persistence-and-migrate-schema-v9.md`, `docs/build/refactor/target-structure/plan/README.md`, `docs/build/refactor/target-structure/reports/README.md`, `CHANGELOG.md`.

## Commands and results

All package commands used `corepack pnpm@11.28.5` from the repository root in PowerShell 5.1.

| Command | Exit | Result |
| --- | --- | --- |
| `git status --short` | 0 | Expected 9 untracked continuation files. |
| `git grep -n "^| 55 | Done" -- docs/build/refactor/target-structure/plan/README.md` | 0 | One matching row. |
| `corepack pnpm@11.28.5 install --offline` | 0 | Zero downloads. 9 workspace projects. |
| `git grep --untracked -n "@deckagent/session-persistence" -- apps packages e2e package.json tsconfig.json .oxlintrc.json` | 1 | No line. |
| `corepack pnpm@11.28.5 exec biome format --write <changed files>` then without `--write` | 0 | `Checked 28 files in 41ms. No fixes applied.` |
| `corepack pnpm@11.28.5 build` | 0 | TypeScript and workspace bundle builds passed. |
| `corepack pnpm@11.28.5 lint` | 0 | 0 warnings and 0 errors on 306 files. |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)`. |
| `corepack pnpm@11.28.5 check:docs` | 0 | `281 file(s) checked, 0 error(s) in 0 file(s)`. |
| `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs` | 0 | `# pass 64`, `# fail 0`. |

## Suite results

| Suite | Exit | Pass | Fail |
| --- | --- | --- | --- |
| `test:http-edge` | 0 | 12 | 0 |
| `test:tools-browser` | 0 | 24 | 0 |
| `test:local-web` | 0 | 11 | 0 |
| `test:local-foundation` | 0 | 59 | 0 |
| `test:model-requests` | 0 | 57 | 0 |
| `test:source-permissions` | 0 | 11 | 0 |
| `test:attachments` | 0 | 31 | 0 |
| `test:research` | 0 | 5 | 0 |
| `test:images` | 0 | 39 | 0 |
| `test:outline-workflow` | 0 | 6 | 0 |
| `test:brief-foundation` | 0 | 16 | 0 |
| `test:deck-review` | 0 | 25 | 0 |
| `test:generation-publication` | 0 | 72 | 0 |
| `test:slide-pipeline` | 0 | 9 | 0 |
| `test:session-persistence` | 0 | 7 | 0 |
| `test:opencode-resources` | 0 | 3 | 0 |
| `test:layouts` | 0 | 10 | 0 |
| `test:browser-smoke` | 0 | 22 | 0 |
| `test:env-startup` | 0 | 2 | 0 |

## Decision table items

none

## STOPs and retries

- Step 2 and Step 5: Removing `packages/session/` and `apps/host/lib`, running `biome format --write`, and running `tsc -b` hit Windows sandbox `EPERM` errors. Retrying those commands outside the sandbox passed.
- Step 6: Legacy downgrade tests in `e2e/attachment-storage.test.mjs`, `e2e/step-approval.test.mjs` and `apps/host/tests/research.test.mjs` open a fresh v9 database and lower `user_version` without reverting `requests` and `runtime_bindings` columns. Checking `PRAGMA table_info` before the v8-to-v9 table rebuild fixed all three failures. The sequential run of all 19 suites then passed with 421 passed and 0 failed.

## What the commands do not prove

- Architecture ADRs (`ADR-001` to `ADR-004`) and `docs/conventions/project-structure.md` still show pre-Phase-4 status until the exit task updates them.
- The tests do not run live providers or the live OpenCode CLI.
- The parent agent owns the commit and push.
