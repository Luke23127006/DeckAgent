# Task 16: Refactor attachments and check Phase 5

Read this file to track the attachment refactor, its completed steps and the remaining Phase 5 exit check.

**Type:** Move or rename and Code (phase-exit task)

**Status:** Blocked. Implementation is complete. The full exit check did not pass.

This task records work that preceded the task file, as the user requested. It is not a record of test-first implementation.
Read the report before continuing. Do not repeat the completed implementation steps.

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints)
- [Decisions for Revision 5](README.md#revision-5-phase-5-attachments-module)
- `docs/build/refactor/naming-and-grouping/module-map.md` (`modules/attachments/`)
- `docs/conventions/code.md`, `docs/conventions/project-structure.md` and `docs/conventions/testware.md`
- `.agents/skills/diagnosing-bugs/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `.agents/skills/review-change/SKILL.md`
- [Task 16 report](../reports/task-16-refactor-attachments-and-check-phase-5.md)

**Files:**
- Change: `apps/host/src/modules/attachments/attachments.service.ts`, `attachments.errors.ts`, `attachments.routes.ts`, `attachments.store.ts`, `draft.store.ts` and `index.ts`
- Create: `apps/host/src/modules/attachments/attachment-files.store.ts`
- Remove: `apps/host/src/modules/attachments/attachment-log.store.ts`
- Change: `apps/host/src/modules/chats/chats.service.ts` (`AttachmentChats` implementation)
- Change: `apps/host/src/server.ts` (attachment wiring and the shared `ChatService` instance)
- Change: `apps/host/src/http/multipart.ts` (service name in its comment)
- Change: `scripts/check-boundaries.mjs` (`ROLE_FILE_MODULES` only) and `package.json` (`test:attachments` only)
- Test: `apps/host/tests/attachment-errors.test.mjs`, `draft-store.test.mjs`, `fixtures/b02-helpers.mjs` and `fixtures/session-store.mjs`
- Test: `e2e/attachment-storage.test.mjs` and `tests/check-boundaries.test.mjs`
- Document: `docs/build/refactor/naming-and-grouping/README.md` and `module-map.md`

**Interfaces:**
- Produces: `AttachmentService`, `AttachmentError`, `AttachmentErrorCode`, `mapAttachmentError`, `AttachmentFileStore` and `SqliteAttachmentStore`.
- Produces: `AttachmentChats.getInfo(id: string): Promise<unknown>`, implemented by `ChatService`.
- Uses: `Readonly<Record<AttachmentErrorCode, number>>` for the HTTP status table.
- Keeps: `MemoryDraftStore`, `AttachmentParserPort`, shared database `SessionError` and all HTTP contracts.

**STOP when:**
- An exit check fails outside the files of Phase 5. Record the failure. Do not change concurrent work.
- Another operation changes source files or build outputs during verification. Record the affected evidence.

**Forbidden:** Do not change `apps/web/`, `packages/presentation/` or HTTP test expected values. Preserve other entries in `ROLE_FILE_MODULES`.

- [x] **Step 1: Diagnose the module**

Record error handling, storage ownership and the consumer port in the Revision 5 decisions.
Use the existing HTTP tests and the boundary checker as the feedback loop for this structural refactor.

- [x] **Step 2: Rename the service and stores**

Rename `AttachmentCoordinator` to `AttachmentService`. Remove `AttachmentOperations`. Routes receive `AttachmentService`.
Move `ManagedAttachments` to `attachment-files.store.ts` as `AttachmentFileStore`.
Move `SqliteAttachmentLog` to `attachments.store.ts` as `SqliteAttachmentStore`. Update imports and consumers.

- [x] **Step 3: Unify attachment errors**

Replace `AttachmentFailure`, `AttachmentStorageError` and `DraftError` with `AttachmentError` in `attachments.errors.ts`.
Keep internal messages out of HTTP responses. Preserve safe detail fields and every existing status.
Keep `REQUEST_EMPTY` at its previous fallback status of 500. Remove `knownAttachmentCodes`.

- [x] **Step 4: Separate the chat port from attachment metadata**

Replace `AttachmentSessionStore` with `AttachmentChats`. Pass the attachment metadata store separately to `AttachmentService`.
Add `ChatService.getInfo`. Construct one `ChatService` for attachment use and route use.

- [x] **Step 5: Enable the role check and check related behavior**

Add `attachments` to `ROLE_FILE_MODULES`. Add the default enforcement test and the error contract test.
Add the error contract test to `test:attachments`. Keep existing HTTP expected values.

Run: `node --test apps/host/tests/attachment-errors.test.mjs apps/host/tests/draft-store.test.mjs tests/check-boundaries.test.mjs e2e/attachment-storage.test.mjs e2e/attachment-admission.test.mjs`
Expected: exit code 0 and `# fail 0`.

Prove each new test with a mutation. Change `INVALID_REQUEST` from 400 to 401 in compiled error output.
Remove `attachments` from the default role list in a second mutation. Restore each file after its test.
Expected: each mutant test returns exit code 1. Run independent review after restoring the files.

- [ ] **Step 6: Pass the full Phase 5 exit check**

Run: `corepack pnpm@11.28.5 build`
Run: `corepack pnpm@11.28.5 lint`
Run: `corepack pnpm@11.28.5 check:boundaries`
Run: `corepack pnpm@11.28.5 check:docs`
Expected: each command returns exit code 0.

Run from Git Bash: `mapfile -t tests < <(rg --files apps packages tests e2e -g '*.test.mjs' | rg -v 'live\.test\.mjs$'); node --test --test-concurrency=2 "${tests[@]}"`
Run: `corepack pnpm@11.28.5 --filter @deckagent/local-web exec vitest run --configLoader native`
Expected: both test commands return exit code 0, with no failures or cancellations.
Do not mark the task or Phase 5 Done until this step passes.

- [x] **Step 7: Write the report file and stop**

Write `../reports/task-16-refactor-attachments-and-check-phase-5.md`. Record completed work, commands, failures, retries and evidence limits.
Keep the task status Blocked while Step 6 fails. This status overrides the default instruction to mark a reported task Done.
