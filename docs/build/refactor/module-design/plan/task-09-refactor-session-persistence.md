# Task 9: Refactor Session Persistence and Move MemoryDraftStore to Apps Web

Read this file to execute approved findings P1, P2, P3, P4, P5, and P9 in `packages/session/persistence/` and `apps/web/` [[1]](#ref-1) [[2]](#ref-2).

**Goal:** Remove all 4 type assertions from `packages/session/persistence/`, split `requests.ts` into focused modules under 250 lines, narrow root exports, and move volatile `MemoryDraftStore` to `apps/web/src/draft-store.ts`.

**Scope:** Keep all SQLite schemas, migrations, error codes, and `RequestLog` method signatures unchanged.

## Files

- Create: `apps/web/src/draft-store.ts`
- Create: `apps/web/tests/draft-store.test.mjs`
- Create: `packages/session/persistence/src/request-validation.ts`
- Create: `packages/session/persistence/src/request-queries.ts`
- Create: `packages/session/persistence/src/runtime-bindings.ts`
- Create: `packages/session/persistence/src/request-sources.ts`
- Modify: `packages/session/persistence/src/requests.ts`
- Modify: `packages/session/persistence/src/contracts.ts`
- Modify: `packages/session/persistence/src/index.ts`
- Modify: `packages/session/persistence/tests/chat-persistence.test.mjs`
- Modify: `apps/web/src/index.ts`
- Modify: `apps/web/src/local-transport.ts`
- Modify: `apps/web/src/features/attachments/attachment-service.ts`
- Modify: `apps/web/src/features/attachments/managed-attachments.ts`
- Modify: `apps/web/src/features/chats/index.ts`
- Modify: `apps/web/tests/fixtures/b02-helpers.mjs`
- Modify: `e2e/attachment-storage.test.mjs`
- Modify: `package.json`
- Remove: `packages/session/persistence/src/draft-store.ts`
- Modify: `docs/build/refactor/module-design/plan/README.md`
- Modify: `docs/build/refactor/module-design/plan/task-09-refactor-session-persistence.md`
- Modify: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-09-refactor-session-persistence.md`

## Steps

- [ ] **Step 1: Move `MemoryDraftStore` and `DraftSnapshot` to `apps/web/src/draft-store.ts` (P9)**

  1. Create `apps/web/src/draft-store.ts` containing:
     - `export interface DraftSnapshot { readonly text: string; readonly attachmentIds: readonly string[]; readonly revision: number }`
     - `export type DraftErrorCode = 'DRAFT_TOO_LARGE' | 'DRAFT_CONFLICT' | 'INVALID_REQUEST'`
     - `export class DraftError extends Error` with `public readonly code: DraftErrorCode` and `this.name = 'DraftError'`.
     - Private `const draftLimit = 16_000` (do not export `draftLimit`).
     - `export class MemoryDraftStore` copied from `packages/session/persistence/src/draft-store.ts`, throwing `new DraftError(...)` with the exact existing error codes and messages.
  2. Update `apps/web/src/local-transport.ts`:
     - Import `DraftError` from `./draft-store.ts`.
     - Inside `mapApplicationFailure`, map `DraftError` codes: `'DRAFT_TOO_LARGE'` to `{ status: 413, code: 'DRAFT_TOO_LARGE' }`, `'DRAFT_CONFLICT'` to `{ status: 409, code: 'DRAFT_CONFLICT' }`, `'INVALID_REQUEST'` to `{ status: 400, code: 'INVALID_REQUEST' }`.
  3. Update imports of `MemoryDraftStore` in:
     - `apps/web/src/index.ts` (from `./draft-store.ts`).
     - `apps/web/src/features/attachments/attachment-service.ts` (type import from `../../draft-store.ts`).
     - `apps/web/src/features/attachments/managed-attachments.ts` (type import from `../../draft-store.ts`).
     - `apps/web/src/features/chats/index.ts` (type import from `../../draft-store.ts`).
  4. Update `apps/web/tests/fixtures/b02-helpers.mjs`:
     - Add `export { MemoryDraftStore } from '../../lib/types/draft-store.js'`.
  5. Update `e2e/attachment-storage.test.mjs`:
     - Remove `MemoryDraftStore` from the `@deckagent/session-persistence` import.
     - Import `MemoryDraftStore` alongside `ManagedAttachments` from `../apps/web/tests/fixtures/b02-helpers.mjs`.
  6. Move the `MemoryDraftStore` test block from `packages/session/persistence/tests/chat-persistence.test.mjs` (lines 148 to 161) to `apps/web/tests/draft-store.test.mjs`.
     - Import `MemoryDraftStore` from `../lib/types/draft-store.js`.
     - Include the required Testware top comment header [[3]](#ref-3).
     - Add `apps/web/tests/draft-store.test.mjs` to the `test:local-foundation` script in `package.json`.
  7. Remove `packages/session/persistence/src/draft-store.ts` and remove `DraftSnapshot` from `packages/session/persistence/src/contracts.ts`.

- [ ] **Step 2: Create `packages/session/persistence/src/request-validation.ts` (P4, P5)**

  Create `packages/session/persistence/src/request-validation.ts` with zero `as` assertions and zero `!` non-null assertions:

  1. Export `isRequestStatus(value: unknown): value is RequestStatus` checking membership in `['active', 'waiting_approval', 'completed', 'failed', 'stopped', 'interrupted']`.
  2. Export `isActivityStatus(value: unknown): value is ActivityStatus` checking membership in `['running', 'completed', 'failed', 'stopped']`.
  3. Export `requestCodePattern`, `requestIdPattern`, and `validateEvent(value: unknown): asserts value is RequestEventBody` using `isRequestStatus` and `isActivityStatus` instead of `as RequestStatus` and `as ActivityStatus`.
  4. Export `parseResearchSource(raw: string): ResearchSource`:
     - Wrap `JSON.parse(raw)` in `try/catch` and throw `new SessionError('SESSION_CORRUPT', 'Stored research source does not match the supported format')` on parse failure.
     - Check every field of `ResearchSource` (`sourceId`, `version === 1`, `kind === 'research'`, `provider === 'tavily'`, `query`, `title`, `url`, `content`, `partial === true`, `fingerprint`, `retrievedAt`, `providerRequestId?: string`, and `location` `{ kind: 'research-result', start: 0, end: non-negative safe integer }`).
     - Reject unexpected keys and throw `new SessionError('SESSION_CORRUPT', 'Stored research source does not match the supported format')` on any mismatch.

- [ ] **Step 3: Split `packages/session/persistence/src/requests.ts` into focused modules (P3)**

  Split `requests.ts` into three helper modules plus the `RequestLog` facade without changing any public method signature or SQL statement:

  1. Create `packages/session/persistence/src/request-queries.ts`:
     - Export `readRequest`, `requireRequest`, `listRequests`, `activeRequestFor`, `readRequestEvent`, `readRequestEvents`, `readRequestActivities`, and `assembleRequestText`.
     - Inside `readRequest`, check `row.status` with `isRequestStatus(row.status)` before building `RequestRecord` (removes line 562 `as RequestStatus`).
     - Inside `listRequests`, filter out undefined reads with an explicit check instead of `this.read(...)!` (removes the non-null assertion).
  2. Create `packages/session/persistence/src/runtime-bindings.ts`:
     - Export `readRuntimeBinding`, `saveRuntimeBinding`, and `deleteRuntimeBinding`.
  3. Create `packages/session/persistence/src/request-sources.ts`:
     - Export `readSourceCatalogue`, `saveSourceRead`, `reserveResearchAttempt`, `saveResearchResults`, and `readResearchSources`.
     - Inside `readResearchSources`, parse every row with `parseResearchSource(String(row.payload))` (removes line 516 `as ResearchSource`).
  4. Update `packages/session/persistence/src/requests.ts`:
     - Keep `export const summarizedNotice = 'CONVERSATION_SUMMARIZED'` and `export class RequestLog`.
     - Keep `admit`, `append`, `finish`, `interruptActive`, `settle`, and `insert` on `RequestLog`, and delegate queries, bindings, and source/research operations to the three helper modules.
     - Replace the remaining non-null assertions in `requests.ts` (lines 152 and 529) with explicit undefined checks throwing `SessionError`.
     - Check that every new and modified file in `packages/session/persistence/src/` stays under 250 lines and every function stays under 80 lines.

- [ ] **Step 4: Narrow `packages/session/persistence/src/index.ts` exports and update tests (P1, P2)**

  1. In `packages/session/persistence/src/index.ts`:
     - Remove `RequestLog`, `validateEvent`, `draftLimit`, `chatTitle`, and `MemoryDraftStore` from root exports.
     - Remove the 9 nested type re-exports with zero external importer by name (`JsonValue`, `ProviderState`, `SessionInfo`, `ToolCall`, `AttachmentPreparation`, `DraftSnapshot`, `SourceRef`, `ActivityRecord`, `ResearchSource`). Keep those types exported from `./contracts.ts` so TypeScript declaration emit resolves them cleanly.
  2. In `packages/session/persistence/tests/chat-persistence.test.mjs`:
     - Remove `MemoryDraftStore` and `chatTitle` from the `../lib/index.js` import.
     - Replace `assert.equal(chatTitle([]), '')` (line 93) with a public API check: call `await store.open('empty')`, read `chats`, and assert `empty.title === ''` and `empty.readable === true`.
     - Add two test cases for `researchSources` corruption (P5):
       - Insert a malformed JSON row (`'{not json'`) into `research_sources` and assert `store.requests.researchSources(sessionId)` throws `{ name: 'SessionError', code: 'SESSION_CORRUPT' }`.
       - Insert a valid JSON object with missing fields (`'{"sourceId":"bad"}'`) into `research_sources` and assert `store.requests.researchSources(sessionId)` throws `{ name: 'SessionError', code: 'SESSION_CORRUPT' }`.

- [ ] **Step 5: Build, check boundaries, lint, format, scan, and run tests**

  Run:

  ```bash
  corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 format:check
  ```

  Expected: exit code `0` with 0 errors. If `format:check` reports formatting issues in your touched files, run `corepack pnpm@11.28.5 format` on only those touched files and re-run the check.

  Run:

  ```bash
  corepack pnpm@11.28.5 test:session-persistence && corepack pnpm@11.28.5 test:local-foundation && corepack pnpm@11.28.5 test:attachments && corepack pnpm@11.28.5 test:model-requests && corepack pnpm@11.28.5 test:source-permissions && corepack pnpm@11.28.5 test:research
  ```

  Expected: every suite passes with `# fail 0` and `# skipped 0`.

  Run:

  ```bash
  node -e "const cp=require('node:child_process'); const data=JSON.parse(cp.execSync('node scripts/scan-module-design.mjs --json',{encoding:'utf8'})); const a=data.areas.find(x=>x.area==='packages/session/persistence/'); console.log(JSON.stringify({files:a.fileCount,lines:a.totalLines,over400:a.filesOver400,fnOver80:a.functionsOver80,assertions:a.assertionCount}));"
  ```

  Expected: `over400` is `0`, `fnOver80` is `0`, and `assertions` is `0`.

  **STOP** if `tsc -b` fails on declaration emit for any removed type export, if any suite fails, or if `assertions` is not `0`.

- [ ] **Step 6: Mark task done, write the report, and commit and push**

  1. Mark Steps 1 to 5 as `- [x]` in this file. Update the Task 9 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` with a link to `../reports/task-09-refactor-session-persistence.md`.
  2. Create `docs/build/refactor/module-design/reports/task-09-refactor-session-persistence.md` with:
     - One-sentence purpose line after H1 (`Read this file to ...`).
     - Table of created, modified, and removed files.
     - Before and after counts for `packages/session/persistence/` (files, lines, root exports, files over 400 lines, assertions).
     - Exact command results and test counts from Step 5.
  3. Add Task 9 to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` with `0 error(s)`.
  4. Mark Step 6 as `- [x]` in this file.
  5. Stage only the files listed in `Files`, commit with a conventional commit message (example: `refactor(session-persistence): split requests, guard assertions, and move draft store`), and run `git push`.

  **STOP** and send the Task 9 report with the commit hash. Do not start Task 10 until the owner approves the report.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Task 7 Report](../reports/task-07-diagnose-session-persistence.md)
3. <a id="ref-3"></a>[Testware](../../../../conventions/testware.md)
