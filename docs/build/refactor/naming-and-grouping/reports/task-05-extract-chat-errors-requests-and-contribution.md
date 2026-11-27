# Task 5 Report: Extract ChatError, ChatRequestService and conversation contribution

Read this file to know how Task 5 moved `ChatError`, extracted `ChatRequestService` and `chats.run-contribution.ts`, renamed the request routes file and added `toChatRequest`, and which checks passed.

## Files changed

- `apps/host/src/modules/chats/chats.errors.ts`: declares and exports `ChatErrorCode` and `ChatError` (`this.name = 'ChatError'`), and renames `mapChatFailure` to `mapChatError`. `chatStatus` stays typed as `Readonly<Record<ChatErrorCode, number>>`.
- `apps/host/src/modules/chats/chats.run-contribution.ts`: created. Holds `createConversationContribution` with its unchanged signature.
- `apps/host/src/modules/chats/chat-requests.service.ts`: created. Exports `ChatRunOperations`, `DeckRunPlanner`, `ChatRequestDependencies` (with `chats` in place of `sessions`) and `class ChatRequestService`. `readSelection` holds the logic of `readChatSelection` and throws `ChatError`. `submit`, `get`, `stop`, `decide`, `events` and `subscribe` use `toChatRequest` and `ChatError`.
- `apps/host/src/modules/chats/chats.service.ts`: imports `ChatError`, replaces every `ChatWorkflowError` call with `ChatError`, exports `toChatRequest`. Removed `ChatWorkflowError`, `ChatWorkflowErrorCode`, `ChatWorkflowErrorDetail`, `ChatRequestOperations`, `ChatRunOperations`, `DeckRunPlanner`, `ChatRequestDependencies`, `createConversationContribution`, `projectRequest`, `createChatRequestOperations` and `readChatSelection`.
- `apps/host/src/modules/chats/chat-requests.routes.ts`: created from `request.routes.ts`. Renames `createRequestRoutes` to `createChatRequestRoutes(requests: ChatRequestService, maxFiles, streams)`. The hand-written approval decision check is replaced by `decodeApprovalDecisionBody`, and `RequestValidationError` becomes `new HttpError(400, error.code)`.
- `apps/host/src/modules/chats/request.routes.ts`: removed.
- `apps/host/src/modules/chats/index.ts`: exports `ChatError`, `mapChatError`, `toChatRequest`, `ChatRequestService`, `createConversationContribution` and `createChatRequestRoutes`. Removed `ChatWorkflowError`, `mapChatFailure`, `createChatRequestOperations`, `ChatRequestOperations`, `ChatRunOperations`, `DeckRunPlanner`, `readChatSelection` and `createRequestRoutes`.
- `apps/host/src/modules/deck/confirmation-coordinator.ts`: changed `ChatWorkflowError` to `ChatError` in the import and in `rethrowConfirmationError`.
- `apps/host/src/server.ts`: imports `ChatRequestService`, `createChatRequestRoutes`, `mapChatError` and `toChatRequest`. Removed `createChatRequestOperations`, `createRequestRoutes`, `readChatSelection`, `mapChatFailure`, `toStoredRequest`, `StoredRequest` and `RequestRecord`. `toStoredRequest` calls became `toChatRequest`. `ChatRequestService` is constructed from `sessions.chats` before `prepareGeneration`, `prepareGeneration` calls `requests.readSelection`, and the routes use `mapChatError` and `createChatRequestRoutes`.
- `apps/host/tests/fixtures/http-host.mjs`: changed `createRequestRoutes` to `createChatRequestRoutes`.
- `apps/host/tests/chat-persistence.test.mjs`: added `ChatRequestService maps run busy errors and unreadable chat errors to ChatError`.

Note: outside this task, `apps/web/package.json` and `pnpm-lock.yaml` changed during the run (React stack dependencies). Task 5 does not change `apps/web/`, so treat those changes as the work of another session.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `node --test --test-reporter=tap apps/host/tests/chat-persistence.test.mjs` (Step 2, before the change) | 1 | `SyntaxError: The requested module '../lib/types/modules/chats/index.js' does not provide an export named 'ChatError'`; `# fail 1` |
| `corepack pnpm@11.28.5 build` | 0 | `tsc -b` passed and all workspace bundles completed |
| `node --test --test-reporter=tap apps/host/tests/chat-persistence.test.mjs apps/host/tests/opencode-adapter.test.mjs e2e/request-lifecycle.test.mjs` | 0 | `# tests 38`, `# pass 38`, `# fail 0` |
| `corepack pnpm@11.28.5 lint` | 0 | `oxlint` reported no warning and no error |
| `corepack pnpm@11.28.5 check:boundaries` | 0 | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 check:docs` | 0 | `check-docs: 313 file(s) checked, 0 error(s) in 0 file(s)` |

`check:docs` starts with pnpm's dependency check. That check failed with `ERR_PNPM_EPERM` on `node_modules/.pnpm/headers-polyfill@5.0.1`, because another session held files in `node_modules` while it ran. The script itself still ran and reported 0 errors.

## STOP and retry

none

## What the commands do not prove

- The checks do not exercise `startLocalWeb` composition (the real `ChatRequestService` wiring in `createHostOptions`). Only `tsc -b` checks that wiring, because the tests use the fixture Host in `apps/host/tests/fixtures/http-host.mjs`.
- No test sends a POST to `/api/requests/:requestId/approvals/:approvalId/decision`. `decodeApprovalDecisionBody` stays covered only by the contract tests of Task 3, so the `400 INVALID_REQUEST` behaviour of this route is checked by review.
- `role-file-symbol` does not check the `chats` module until Task 7 adds it to `ROLE_FILE_MODULES`.
