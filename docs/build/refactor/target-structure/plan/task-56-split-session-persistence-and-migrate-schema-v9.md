# Task 56: Split packages/session/persistence into apps/host/src/db and module stores with schema v9

Read this file to learn the steps of Task 56, which splits `packages/session/persistence/` into `apps/host/src/db/` and module stores with schema v9.

**Type:** Move or rename

After this task, `packages/session/` no longer exists. `apps/host/src/db/` owns `SessionDatabase`, schema v9 migrations and `SqliteRunStore` (implementing `RunStore` and `OwnerBindingStore` with `(owner_kind, owner_id)` unique index and `owner_key` bindings). `apps/host/src/modules/chats/chats.store.ts` owns `sessions`, `messages` and `change_versions` SQL. `apps/host/src/modules/attachments/attachment-log.store.ts` owns `attachments` and `sources` SQL. `apps/host/src/server.ts` wires atomic admission and settlement hooks on the shared `SessionDatabase` transaction.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/architecture/30-decisions.md` (ADR-001)
- `packages/session/persistence/src/{index.ts,schema.ts,contracts.ts,message.ts,attachments.ts,requests.ts,approvals.ts,request-queries.ts,request-sources.ts,request-validation.ts,runtime-bindings.ts}`
- `apps/host/src/server.ts`, `apps/host/src/web-state.ts`, `apps/host/src/contract-sync.ts`, `apps/host/src/runs/ports.ts`
- `.oxlintrc.json`, `scripts/check-boundaries.mjs`, `tests/oxlint-boundaries.test.mjs`, `tests/check-boundaries.test.mjs`
- `package.json`, `apps/host/package.json`, `tsconfig.json`, `apps/host/tsconfig.json`

**Files:**

- Create: `apps/host/src/db/{session-database.ts,sessions-schema.ts,contracts.ts,approvals.ts,request-queries.ts,request-sources.ts,request-validation.ts,runtime-bindings.ts,run-store.ts,index.ts}`, `apps/host/src/modules/chats/{chats.store.ts,message.ts}`, `apps/host/src/modules/attachments/attachment-log.store.ts`, `apps/host/tests/fixtures/session-store.mjs`
- Move into `apps/host/tests/`: `packages/session/persistence/tests/{chat-persistence.test.mjs,session-persistence.test.mjs}`, `apps/web/tests/web-session.test.mjs`
- Remove: `packages/session/`
- Change: `apps/host/src/server.ts`, `apps/host/src/web-state.ts`, `apps/host/src/contract-sync.ts`, `apps/host/src/modules/chats/index.ts`, `apps/host/src/modules/attachments/index.ts`, `apps/host/package.json`, `apps/host/tsconfig.json`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.oxlintrc.json`, `scripts/check-boundaries.mjs`
- Test: `apps/host/tests/{chat-persistence.test.mjs,session-persistence.test.mjs,web-session.test.mjs,http-server.test.mjs,research.test.mjs,web-management.test.mjs}`, `e2e/{attachment-storage.test.mjs,browser-smoke.test.mjs,deck-pipeline.test.mjs,generation-bridge.test.mjs,layout-review-browser.test.mjs,local-foundation.test.mjs,local-web.test.mjs,model-requests.test.mjs,request-lifecycle.test.mjs,step-approval.test.mjs}`, `tests/oxlint-boundaries.test.mjs`, `tests/check-boundaries.test.mjs`

**Interfaces:**

- Produces, in `apps/host/src/db/session-database.ts`:
  - `SessionDatabase`: exposes `readonly db: DatabaseSync`, `run<T>(op: () => T): T`, `transaction<T>(op: () => T): T`, `afterCommit(callback: () => void): void` and `close(): void`. `transaction` uses a depth counter, commits and runs queued `afterCommit` callbacks at depth 0 only, and rolls back and clears callbacks on error.
- Produces, in `apps/host/src/db/run-store.ts`:
  - `RunStoreHooks`: `{ beforeAdmit?(input: RunAdmitInput): { readonly historyStart: number; readonly messageSequence?: number }; afterAdmit?(input: RunAdmitInput, messageSequence: number | undefined): void; onSettle?(owner: RunOwner, status: TerminalStatus, text: string): void }`
  - `SqliteRunStore` implementing `RunStore` (`admit`, `append`, `finish`, `get`, `events`, `text`, `activeFor`, `approvals`) and `OwnerBindingStore` (`binding`, `bind`, `unbind`, `lastCompletedRequestId`), plus `interruptActive()`, `list(owner)`, `activities(owner)`, `sourceCatalogue(sessionId)`, `recordSourceRead(requestId, value)`, `reserveResearch(requestId, sessionId)`, `recordResearch(requestId, sessionId, query, result)`, `researchSources(sessionId)`. Throws `SessionError('RUN_OWNER_BUSY', ...)` when `(owner_kind, owner_id)` already has an active run.
- Produces, in `apps/host/src/db/index.ts`: exports `SessionDatabase`, `SqliteRunStore`, `SessionError`, `defaultWorkspaceId`, `mapSessionFailure` (`SESSION_NOT_FOUND: 404`, `SESSION_CORRUPT: 409 CHAT_UNREADABLE`, `DRAFT_TOO_LARGE: 413`) and persistence types.
- Produces, in `apps/host/src/modules/chats/chats.store.ts`: `SqliteChatStore(sessionDb: SessionDatabase, options?: { readonly onChatsChanged?: (version: number) => void })` owning `sessions`, `messages`, `change_versions` SQL plus transactional helpers `admitUserMessageInTx(sessionId, input, attachments)` and `appendAssistantMessageInTx(sessionId, text, interrupted)` using `sessionDb.afterCommit(...)`.
- Produces, in `apps/host/src/modules/attachments/attachment-log.store.ts`: `SqliteAttachmentLog(sessionDb: SessionDatabase)` owning `attachments` and `sources` SQL plus transactional helpers `validateReadyInTx(sessionId, attachmentIds)` and `linkToRequestInTx(requestId, messageSequence, attachmentIds)`.
- Produces, in `apps/host/src/server.ts` and `apps/host/tests/fixtures/session-store.mjs`: `openSessionStorage(path, options)` composing `SessionDatabase`, `SqliteChatStore`, `SqliteAttachmentLog` and `SqliteRunStore` with the atomic `RunStoreHooks`.

**STOP when:** `corepack pnpm@11.28.5 install --offline` fails or tries to download a package, or any schema v1 to v8 migration loses rows or fails `PRAGMA foreign_key_check`.

**Forbidden:** import `apps/host/src/modules/` inside `apps/host/src/db/`. Allow `*.routes.ts` or `*.service.ts` to import `../../db/**`. Change any HTTP wire field or HTTP error code.

## Schema v9 rules

| Case | Rule |
| --- | --- |
| Fresh database (`version === 0`) | Create `requests(id, owner_kind, owner_id, status, provider, model, history_start, started_at, ended_at, error_code)` with `requests_owner` index on `(owner_kind, owner_id)` and `requests_one_active` unique index on `(owner_kind, owner_id) WHERE status IN ('active','waiting_approval')`. Create `runtime_bindings(owner_key PRIMARY KEY, native_session_id, provider, model, context, last_request_id, updated_at)`. Set `PRAGMA user_version = 9`. |
| Upgrade (`version` 1 to 8) | Run `PRAGMA foreign_keys = OFF` before `BEGIN IMMEDIATE`. Run each incremental step from `version` through 8. Rebuild `requests` migrating `session_id` to `('chat', session_id)` and rebuild `runtime_bindings` migrating `session_id` to `'chat:' \|\| session_id`. Run `PRAGMA quick_check`, `PRAGMA foreign_key_check` and column `SELECT ... LIMIT 0` checks before `COMMIT`. Run `PRAGMA foreign_keys = ON` after `COMMIT`. |

## Move rules

| Item | Rule |
| --- | --- |
| `apps/host/src/web-state.ts`, `apps/host/src/contract-sync.ts` | Import `ModelSelection` from `@deckagent/host-contracts` in `web-state.ts`. Update `contract-sync.ts` to import persistence types from `./db/index.ts`. |
| `apps/host/src/server.ts` | Use `openSessionStorage` directly. Remove the temporary `owner <-> sessionId` adapter shims around `RunController` and `OpenCodeAgentRuntime`. Use `mapSessionFailure` from `./db/index.ts`. |
| `.oxlintrc.json` | Add an override for `**/apps/host/src/db/**/*.{ts,tsx,mts,cts,js,mjs,cjs}` blocking `../modules/**`, `../http/**`, `../runs/lifecycle/**`, `../runs/preparation/**`, `../runs/budget/**`, `../runtimes/**`, `../tools/**`, `express` and `express/*`. Replace `@deckagent/session-persistence` with `../db/**` in `http/**` and `runs/**`, and with `../../db/**` in `runtimes/**`, `tools/executors/**`, `modules/**`, `modules/deck/**`, `*.routes.ts`, `*.errors.ts`, `deck.errors.ts`, `*.service.ts` and `deck.service.ts`. Add `**/apps/host/src/modules/*/*.store.ts` omitting `../../db/**` while blocking `../*/*.store.ts`, `../../http/**`, `../../tools/**`, `../../runtimes/**`, `express`, `express/*`, `@deckagent/deck` and `@deckagent/deck/*`. Remove `@deckagent/session-persistence` from `browser/**` and `contracts/**`. |
| `scripts/check-boundaries.mjs` | Remove `'packages/session/persistence'` from `DOMAIN_DIRECTORIES`. |
| `package.json`, `apps/host/package.json`, `tsconfig.json`, `apps/host/tsconfig.json` | Remove `@deckagent/session-persistence` and `packages/session/persistence` references. Point `test:local-foundation`, `test:session-persistence` and `test:local-web` to `apps/host/tests/{chat-persistence,session-persistence,web-session}.test.mjs`. |
| Test files | Replace `@deckagent/session-persistence` imports with `apps/host/tests/fixtures/session-store.mjs` (`openSessionStore`, `SessionError`). Update `chat-persistence.test.mjs` expected `user_version` from `8` to `9` and add a v8-to-v9 in-place migration test plus an atomic admission rollback test. Update direct store calls in `e2e/request-lifecycle.test.mjs` (lines testing `store.requests` directly) to pass `owner: { kind: 'chat', id }`, `ownerKey: 'chat:' + id`, and expect `RUN_OWNER_BUSY`. Update `tests/oxlint-boundaries.test.mjs` with negative fixtures for `apps/host/src/db/` and `../../db/index.ts` inside `*.service.ts` and `*.routes.ts`, plus a positive fixture for `*.store.ts` importing `../../db/index.ts`. |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 55 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Split persistence into `apps/host/src/db/`, `modules/chats/`, `modules/attachments/` and remove `packages/session/`**

Create the files in `apps/host/src/db/`, `apps/host/src/modules/chats/` and `apps/host/src/modules/attachments/` following `Schema v9 rules` and `Interfaces`. Move the three test files into `apps/host/tests/`. Remove `packages/session/` completely so no old `lib/` stays on disk. Apply all rows of `Move rules`.

- [ ] **Step 3: Sync the lockfile offline**

Run: `corepack pnpm@11.28.5 install --offline`

Expected: PASS. Exit code 0.

- [ ] **Step 4: Check that no `@deckagent/session-persistence` reference stays in production code**

Run: `git grep --untracked -n "@deckagent/session-persistence" -- apps packages e2e package.json tsconfig.json .oxlintrc.json`

Expected: PASS. No line.

- [ ] **Step 5: Format, build and check**

Remove `apps/host/lib` first. Do the step `Format, build and check` of the Task protocol. Run `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`.

Expected: PASS. Output contains `# fail 0`.

- [ ] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Split files` with the columns `Old path | New path | Owner`.

- What the commands do not prove: Architecture ADRs (`ADR-001` to `ADR-004`) and `docs/conventions/project-structure.md` still show pre-Phase-4 status until the exit task updates them.
- `CHANGELOG.md` line: ``- Split `packages/session/persistence/` into `apps/host/src/db/` (schema v9 `(owner_kind, owner_id)` and `SqliteRunStore`), `modules/chats/chats.store.ts` and `modules/attachments/attachment-log.store.ts`, and remove `@deckagent/session-persistence`. Task 56 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `refactor: split session persistence into apps/host/src/db and module stores with schema v9`
