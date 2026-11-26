# Task 35: Move the attachments module into apps/host/src/modules

Read this file to learn the steps of Task 35, which moves the attachment and draft code into `apps/host/src/modules/attachments/` and keeps `busboy` 1.6.0.

**Type:** Move or rename

After this task, the attachment and draft module lives in `apps/host/src/modules/attachments/`. It holds the draft store, the managed file store, the attachment coordinator, the six routes and the error map. The module imports no code from `@deckagent/session-persistence`, `@deckagent/file-tools` or `apps/host/src/http/`. `packages/host/api/` keeps `multipart.ts` with `busboy` 1.6.0 and exports `receiveAttachment`. The HTTP contract does not change: each path, status code, error code and JSON body stays the same. This task adds no change notice and does not make `expectedRevision` required on `PUT /api/sessions/:sessionId/draft`.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/conventions/project-structure.md` (the section `## Hình dạng module`)
- `apps/host/src/draft-store.ts`
- `apps/host/src/features/attachments/managed-attachments.ts` and `attachment-coordinator.ts`
- `apps/host/src/modules/chats/chats.service.ts` and `apps/host/src/modules/providers/providers.routes.ts`
- `packages/host/api/src/transport/multipart.ts`, `session-routes.ts` (the function `registerAttachmentRoutes`), `management-routes.ts` (the `drafts` routes), `contracts.ts` and `packages/host/api/src/index.ts`
- `apps/host/src/local-transport.ts` (the constant `attachmentStatus`, the `DraftError` branch and the function `attachmentManagement`)
- `apps/host/src/server.ts` (the functions `createRuntimeLayer` and `createHostOptions`)
- `AGENTS.md` (the section `## Tech Stack`)

**Files:**

- Create: `apps/host/src/modules/attachments/draft.store.ts`, `attachments.store.ts`, `attachments.service.ts`, `attachments.routes.ts`, `attachments.errors.ts`, `index.ts`
- Remove: `apps/host/src/features/attachments/` (with all its files) and `apps/host/src/draft-store.ts`
- Change: `packages/host/api/src/transport/multipart.ts`, `session-routes.ts`, `management-routes.ts`, `contracts.ts`, `packages/host/api/src/index.ts`
- Change: `apps/host/src/server.ts`, `apps/host/src/local-transport.ts`, `apps/host/src/features/sources/source-tools.ts`, `AGENTS.md`
- Change: `apps/host/tests/draft-store.test.mjs`, `apps/host/tests/fixtures/b02-helpers.mjs`, `e2e/attachment-admission.test.mjs`

**Interfaces:**

- Produces, in `packages/host/api/`:
  - `interface AttachmentUploadTarget { readonly maxBytes: number; upload(input: { readonly sessionId: string; readonly name: string; readonly expectedRevision: number; readonly bytes: AsyncIterable<Uint8Array>; readonly signal: AbortSignal; readonly complete?: Promise<void> }): Promise<unknown> }`
  - `function receiveAttachment<T>(req: IncomingMessage, sessionId: string, attachments: AttachmentUploadTarget & { upload(input: Parameters<AttachmentUploadTarget['upload']>[0]): Promise<T> }): Promise<T>`
  - `HostOptions.maxAttachments?: number` (replaces `HostOptions.attachments`)
- Produces, in `apps/host/src/modules/attachments/`:
  - `draft.store.ts`: `DraftSnapshot`, `DraftErrorCode`, `DraftError`, `MemoryDraftStore`
  - `attachments.store.ts`: `AttachmentStorageError`, `AttachmentRecordView`, `AttachmentLogPort`, `AttachmentLocationData`, `AttachmentPartData`, `ParsedAttachmentData`, `AttachmentUpload`, `ManagedAttachments`
  - `attachments.service.ts`: `AttachmentFailure`, `AttachmentLimits`, `AttachmentParserPort`, `AttachmentSessionStore`, `AttachmentUploadInput`, `AttachmentPreview`, `AttachmentOperations`, `DraftAdmitInput`, `AttachmentCoordinator`
  - `attachments.routes.ts`: `function createAttachmentRoutes(attachments: AttachmentOperations): Router`
  - `attachments.errors.ts`: `function mapAttachmentFailure(error: unknown): HttpFailureResponse | undefined`
  - `index.ts`: exports `DraftError`, `MemoryDraftStore`, `AttachmentStorageError`, `ManagedAttachments`, `AttachmentFailure`, `AttachmentCoordinator`, `createAttachmentRoutes`, `mapAttachmentFailure`, and the types `DraftSnapshot`, `DraftErrorCode`, `AttachmentRecordView`, `AttachmentLogPort`, `ParsedAttachmentData`, `AttachmentUpload`, `AttachmentLimits`, `AttachmentParserPort`, `AttachmentSessionStore`, `AttachmentUploadInput`, `AttachmentPreview`, `AttachmentOperations` and `DraftAdmitInput`.

**STOP when:** the build reports an error that a change in the tables `Mapping` and `Move rules` does not fix.

**Forbidden:** install `multer`. Change the behavior of a route or a method of `ManagedAttachments`, `MemoryDraftStore` or `AttachmentCoordinator`.

## Mapping

| Old | New |
| --- | --- |
| `apps/host/src/draft-store.ts` | `apps/host/src/modules/attachments/draft.store.ts` |
| `apps/host/src/features/attachments/managed-attachments.ts` | `apps/host/src/modules/attachments/attachments.store.ts` |
| `apps/host/src/features/attachments/attachment-coordinator.ts` | `apps/host/src/modules/attachments/attachments.service.ts` |
| `apps/host/src/features/attachments/index.ts` | `apps/host/src/modules/attachments/index.ts` |
| `attachmentStatus`, the `AttachmentFailure` entry, the `DraftError` branch and `attachmentManagement` in `local-transport.ts` | `apps/host/src/modules/attachments/attachments.errors.ts` (remove `attachmentManagement`) |
| `registerAttachmentRoutes` in `session-routes.ts` and the `drafts` routes in `management-routes.ts` | `apps/host/src/modules/attachments/attachments.routes.ts` |
| `HostOptions.attachments`, `AttachmentManagement` and `WebManagement.drafts` in `contracts.ts` | Removed. `HostOptions.maxAttachments?: number` feeds `registerRequestRoutes` |

## Move rules

| Item | Rule |
| --- | --- |
| `multipart.ts` | Keep `busboy` 1.6.0. Track the rejection of `attachments.upload(...)` in `let uploadError: unknown`. In the outer `catch`, rethrow `error` when `error instanceof HttpError` or when `uploadError !== undefined && error === uploadError`. Export `receiveAttachment` and `type AttachmentUploadTarget` from `packages/host/api/src/index.ts`. |
| `attachments.store.ts` | Remove imports from `@deckagent/session-persistence` and `@deckagent/file-tools`. Define `AttachmentStorageError` (`readonly code: string`), the structural ports `AttachmentRecordView`, `AttachmentLogPort` and `ParsedAttachmentData`, the guard `isParsedAttachmentData` (same checks as `isParsedAttachment`) and `maxStoredBytes = 20 * 1024 * 1024`. Replace `SessionError` checks with `error instanceof AttachmentStorageError` or an allowlist of the twelve storage domain codes, so a Node `fs` code never becomes a rejection code. Keep the signature of `ManagedAttachments.open(filesRoot, log, drafts)`. |
| `attachments.service.ts` | Remove imports from `@deckagent/session-persistence`, `@deckagent/file-tools`, `@deckagent/host-api` and Express. Take `store: AttachmentSessionStore`, `drafts: MemoryDraftStore`, `files: ManagedAttachments`, `parser: AttachmentParserPort` and `limits: AttachmentLimits` in the constructor of `AttachmentCoordinator`. Replace `requestStore()` with `admitDraft<TInput extends DraftAdmitInput, TResult>(input: TInput, admit: (input: TInput) => TResult): TResult`, which runs the same checks, throws `AttachmentFailure`, calls `admit(input)` and clears the draft. In `prepare` and `safeError`, map errors through `knownAttachmentCodes` without `SessionError` or `SourceError`. |
| `attachments.routes.ts` | Register all six routes with `Router({ caseSensitive: true, strict: true })` and `WORD_ID = /^[\w-]{1,100}$/`: `GET` and `PUT /api/sessions/:sessionId/draft`, `POST /api/sessions/:sessionId/attachments` (202, `receiveAttachment`), `GET` and `DELETE /api/sessions/:sessionId/attachments/:attachmentId` and `GET /api/sessions/:sessionId/attachments/:attachmentId/preview` (same sandbox CSP and headers). |
| `attachments.errors.ts` | `mapAttachmentFailure` maps `AttachmentFailure` through `attachmentStatus` (unknown code gives `500`) and `DraftError` (`DRAFT_TOO_LARGE` -> `413`, `DRAFT_CONFLICT` -> `409`, other -> `400`). Return `undefined` for other errors. |
| `server.ts` | Import `AttachmentParser` and `attachmentLimits` from `@deckagent/file-tools`. Pass `new AttachmentParser()` and `attachmentLimits` to `AttachmentCoordinator`. Wrap `sessions.requests` in `createHostOptions` so `admit` calls `runtime.inputs.admitDraft`. Pass `maxAttachments: runtime.inputs.maxFiles`. Add `createAttachmentRoutes(runtime.inputs)` after `createProviderRoutes(runtime.providers)` in `routes`. Add `mapAttachmentFailure(error)` before `mapApplicationFailure(error)`. |
| `source-tools.ts`, tests and `AGENTS.md` | Point `source-tools.ts` to `../../modules/attachments/index.ts`. Point `draft-store.test.mjs` and `b02-helpers.mjs` to `modules/attachments/index.js`, and export `createAttachmentRoutes` from `b02-helpers.mjs`. In `e2e/attachment-admission.test.mjs`, pass `routes: [createAttachmentRoutes(...)]` in test 1 instead of `attachments:`. In `AGENTS.md`, remove `multer` from the target library list and note that multipart keeps `busboy` 1.6.0. |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 34 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Move the code**

Do the changes of the tables `Mapping` and `Move rules`. Use `git mv` for `draft-store.ts`, `managed-attachments.ts` and `attachment-coordinator.ts`. Then remove `apps/host/src/features/attachments/`.

- [ ] **Step 3: Check that no old path or name stays**

Run: `git grep --untracked -n -E "features/attachments|draft-store\.ts|AttachmentManagement|attachmentManagement" -- apps/host packages e2e scripts`

Expected: PASS. No line.

Run: `git grep --untracked -n -E "@deckagent/session-persistence|@deckagent/file-tools|node:sqlite" -- apps/host/src/modules/attachments`

Expected: PASS. No line.

Run: `git grep -n -E "AttachmentFailure|attachmentStatus|DraftError" -- apps/host/src/local-transport.ts`

Expected: PASS. No line.

- [ ] **Step 4: Format, build and check**

Run `rm -rf apps/host/lib packages/host/api/lib` first, so that an old build output does not hide a broken import. Then do the step `Format, build and check` of the Task protocol.

- [ ] **Step 5: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 6: Check the changed paths**

Run: `git status --short`

Expected: PASS. Each path starts with `apps/host/`, `packages/host/api/src/`, `e2e/attachment-admission.test.mjs`, `AGENTS.md`, `docs/build/refactor/target-structure/` or `CHANGELOG.md`.

- [ ] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Moved files` with the columns `Old path | New path | Symbols`.

- What the commands do not prove: no new test checks the route order or the error map order. The existing suites check the HTTP contract.
- `CHANGELOG.md` line: ``- Move the attachments and draft module into `apps/host/src/modules/attachments/`, keep `busboy` 1.6.0 for multipart instead of `multer`, and remove the attachment and draft routes from `@deckagent/host-api` and `local-transport.ts`. Task 35 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `refactor: move the attachments module into apps/host/src/modules`
