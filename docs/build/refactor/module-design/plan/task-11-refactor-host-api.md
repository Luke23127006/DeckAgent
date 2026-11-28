# Task 11: Refactor Host API Boundaries, Routes, and Exports

Read this file to execute approved findings F1, F2, F3 (transport wiring), F4, F5, F9, F10, and P8 in `packages/host/api/` and `apps/web/` [[1]](#ref-1) [[2]](#ref-2) [[3]](#ref-3).

**Goal:** Drop the runtime `@deckagent/deck` import from `host/api`, isolate `lifecycle/` from `transport/`, and split `startHost` and `route`. Share one SSE helper, remove all 24 non-null assertions, add compile-time contract parity checks, and narrow `host/api` exports to 22 own symbols.

**Scope:** Keep every HTTP route, status code, response body, SSE frame format, security header, and `RequestController` behavior identical.

## Files

- Create: `packages/host/api/src/contract-sync.ts`
- Create: `packages/host/api/src/lifecycle/contracts.ts`
- Create: `packages/host/api/src/lifecycle/request-controller.ts`
- Create: `packages/host/api/src/lifecycle/request-failure.ts`
- Create: `packages/host/api/src/lifecycle/tool-contracts.ts`
- Create: `packages/host/api/src/transport/contracts.ts`
- Create: `packages/host/api/src/transport/http-error.ts`
- Create: `packages/host/api/src/transport/multipart.ts`
- Create: `packages/host/api/src/transport/sse.ts`
- Create: `packages/host/api/src/transport/http-io.ts`
- Create: `packages/host/api/src/transport/error-response.ts`
- Create: `packages/host/api/src/transport/deck-routes.ts`
- Create: `packages/host/api/src/transport/management-routes.ts`
- Create: `packages/host/api/src/transport/session-routes.ts`
- Create: `packages/host/api/src/transport/request-routes.ts`
- Modify: `packages/host/api/src/index.ts`
- Modify: `packages/host/api/tests/request-failure.test.mjs`
- Modify: `apps/web/tsconfig.json`
- Modify: `apps/web/src/index.ts`
- Modify: `apps/web/src/local-transport.ts`
- Modify: `apps/web/src/features/attachments/attachment-service.ts`
- Modify: `apps/web/src/features/deck/brief-service.ts`
- Modify: `apps/web/src/features/deck/confirmation-service.ts`
- Modify: `apps/web/src/features/deck/deck-workflow.ts`
- Modify: `apps/web/src/features/deck/generation-report.ts`
- Modify: `apps/web/src/features/deck/generation-workflow.ts`
- Modify: `apps/web/src/features/providers/built-in-providers.ts`
- Modify: `apps/web/src/features/providers/provider-settings.ts`
- Modify: `apps/web/src/features/requests/prepare-runtime.ts`
- Modify: `apps/web/src/integrations/opencode/contracts.ts`
- Modify: `apps/web/src/integrations/opencode/provider.ts`
- Modify: `apps/web/src/integrations/opencode/runtime.ts`
- Modify: `apps/web/src/integrations/providers/provider-catalog.ts`
- Remove: `packages/host/api/src/contracts.ts`
- Remove: `packages/host/api/src/request-controller.ts`
- Remove: `packages/host/api/src/request-failure.ts`
- Remove: `packages/host/api/src/tool-contracts.ts`
- Remove: `packages/host/api/src/http-error.ts`
- Remove: `packages/host/api/src/multipart.ts`
- Remove: `packages/host/api/src/deck-routes.ts`
- Modify: `docs/build/refactor/module-design/plan/README.md`
- Modify: `docs/build/refactor/module-design/plan/task-11-refactor-host-api.md`
- Modify: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-11-refactor-host-api.md`

## Steps

- [x] **Step 1: Isolate Request Lifecycle in `packages/host/api/src/lifecycle/` (F10)**

  Existing rules in `.oxlintrc.json` and `scripts/check-boundaries.mjs` enforce `lifecycle-transport-import` on every file under `packages/host/api/src/lifecycle/`.

  1. Create `packages/host/api/src/lifecycle/tool-contracts.ts` from `src/tool-contracts.ts`, removing the unused re-export lines `export type { ApprovalView }` and `export type { ApprovalStep }` (keep the `import type { ApprovalStep } from '@deckagent/session-persistence'` needed by `ToolContext`).
  2. Create `packages/host/api/src/lifecycle/request-failure.ts` from `src/request-failure.ts`.
  3. Create `packages/host/api/src/lifecycle/contracts.ts` containing only lifecycle ports (zero HTTP imports): `RuntimeEvent`, `PreparedRequest`, `RequestRun`, `RuntimeOutcome`, `RequestRuntime`, and `RequestAdmission`. Import `AgentRequest`, `ModelSelection`, and `RequestEventBody` from `@deckagent/host-contracts`, `RequestTools` from `./tool-contracts.ts`, and type-only `GenerationCapability` and `GenerationGrant` from `@deckagent/deck`.
  4. Create `packages/host/api/src/lifecycle/request-controller.ts` from `src/request-controller.ts`, importing wire DTOs from `@deckagent/host-contracts`, lifecycle contracts from `./contracts.ts`, `RequestFailure` from `./request-failure.ts`, and tool contracts from `./tool-contracts.ts`.

- [x] **Step 2: Create compile-time contract sync check `packages/host/api/src/contract-sync.ts` (P8)**

  Create `packages/host/api/src/contract-sync.ts` with zero runtime statements (type-only imports only):
  - Import `ModelSelection`, `RequestStatus`, `ActivityStatus`, `TerminalStatus`, `RequestEventBody`, `ApprovalView`, `RequestEvent`, `StoredRequest`, `StoredActivity` from `@deckagent/host-contracts`.
  - Import the matching types (`ModelSelection`, `RequestStatus`, `ActivityStatus`, `TerminalStatus`, `RequestEventBody`, `ApprovalView`, `RequestEvent`, `RequestRecord`, `ActivityRecord`) from `@deckagent/session-persistence`.
  - Define `type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never` and assert all 9 pairs (`type _SyncModelSelection = AssertEqual<HostModelSelection, PersistedModelSelection>`, through `StoredActivity` and `ActivityRecord`).
  - Export `type ContractSyncVerified = true` and reference it as a type import in `packages/host/api/src/index.ts` so TypeScript always checks the file during `tsc -b`.

- [x] **Step 3: Create transport contracts and move `DeckError` mapping out of `host/api` (F1, F10)**

  1. Create `packages/host/api/src/transport/http-error.ts` from `src/http-error.ts`.
  2. Create `packages/host/api/src/transport/multipart.ts` from `src/multipart.ts`, updating its imports to `./http-error.ts` and `./contracts.ts` (keep `receiveAttachment` intact per approved finding F13).
  3. Create `packages/host/api/src/transport/contracts.ts` containing only transport ports: `HostMessage`, `HttpFailureResponse`, `HostOptions`, `BriefManagement`, `AttachmentManagement`, `WebManagement`, and `WorkspaceManagement`.
     - Add `readonly failureMessage?: (code: string) => string | undefined` to `HostOptions`.
     - Import type-only `DeckReader`, `OutlineReader`, and `InterviewState` from `@deckagent/deck`, wire DTOs from `@deckagent/host-contracts`, lifecycle ports from `../lifecycle/contracts.ts`, `PreparedTools` from `../lifecycle/tool-contracts.ts`, `RequestStore` from `@deckagent/session-persistence`, and `HttpErrorDetail` from `./http-error.ts`.
     - Do not re-export any pass-through wire DTO or domain type from `transport/contracts.ts`.
  4. Update `apps/web/src/local-transport.ts`:
     - Import `DeckError` from `@deckagent/deck`.
     - Inside `mapApplicationFailure`, add a `DeckError` branch. Map `'OUTLINE_STALE'`, `'OUTLINE_ALREADY_CONFIRMED'`, `'OUTLINE_READ_ONLY'`, and `'OUTLINE_LIMIT'` to `{ status: 409, code: error.code }`. Map `'DECK_CONTENT_NOT_FOUND'` to `{ status: 404, code: error.code }`.
  5. Update `apps/web/src/index.ts`:
     - Import `deckFailureMessage` alongside `DeckService` from `@deckagent/deck`.
     - Pass `failureMessage: deckFailureMessage` inside `startHost({ ... })`.

- [x] **Step 4: Split `startHost`, `route`, SSE, and error handling into `packages/host/api/src/transport/` (F3, F4, F5)**

  Create focused transport modules with zero `as` assertions, zero `!` non-null assertions, every file under 250 lines, and every function under 80 lines (except `receiveAttachment` in `multipart.ts` per F13):

  1. Create `packages/host/api/src/transport/sse.ts`:
     - Export `openSseStream(res: ServerResponse, streams: Set<ServerResponse>, onClose: () => void): void`: check `streams.size >= 64` and throw `new HttpError(429, 'TOO_MANY_STREAMS')`, write `200` headers (`'content-type': 'text/event-stream'`, `'x-accel-buffering': 'no'`), register `res` in `streams`, start the `15000` ms `: heartbeat\n\n` interval, and clean up interval, `onClose()`, and `streams.delete(res)` on `'close'`.
  2. Create `packages/host/api/src/transport/http-io.ts`:
     - Export `json(res, status, value)`, `readJson(req)` (256 KiB cap, `415 JSON_REQUIRED`, `413 REQUEST_TOO_LARGE`, `400 INVALID_REQUEST`), `parseCursor(req)`, and `readAgentRequest(req, maxAttachments)` calling `decodeAgentRequest` from `@deckagent/host-contracts` and mapping `RequestValidationError` (`'REQUEST_TEXT_TOO_LONG'` -> `413`, `'REQUEST_EMPTY'` and `'INVALID_REQUEST'` -> `400`).
  3. Create `packages/host/api/src/transport/error-response.ts`:
     - Export `writeRouteError(res, error, options)` handling `RequestFailure` (using the exact `requestFailureStatus` map), `options.mapApplicationFailure?.(error)`, `HttpError`, and fallback `500 HOST_ERROR`, setting `message: options.failureMessage?.(mapped || known ? code : '') ?? 'Request could not be completed'`.
  4. Create `packages/host/api/src/transport/deck-routes.ts`:
     - Port `routeDeck` from `src/deck-routes.ts` using `openSseStream` from `./sse.ts` and replacing `resource[1]!` with explicit destructuring (`const [, sessionId, tail, slideId, rev] = resource; if (!sessionId) return false`).
  5. Create `packages/host/api/src/transport/management-routes.ts`:
     - Export `routeManagement(req, res, pathname, management, withActive)` handling `/api/settings`, `/api/research`, `/api/sessions/:id/research-sources`, `/api/preferences`, `/api/providers/*`, `/api/sessions` (`GET`, `POST`, `search`), `/api/sessions/:id/(selection|activities|requests|draft)`, and `/api/workspaces/*`. Replace every regex `!` with explicit destructuring checks.
  6. Create `packages/host/api/src/transport/session-routes.ts`:
     - Export `routeSession(req, res, pathname, options, controller, streams)` handling `/api/sessions/:id/deck/confirm`, `interview`, `brief`, `deck` (delegating to `routeDeck`), `outlines/.../images`, `outline`, `attachments`, and `history` (using helper `projectHistoryMessage` preserving the exact output fields). Replace every regex `!` with explicit destructuring checks.
  7. Create `packages/host/api/src/transport/request-routes.ts`:
     - Export `routeRequests(req, res, pathname, controller, maxFiles, streams)` handling `POST /api/requests` (using `readAgentRequest`), `POST /api/requests/:id/approvals/:aid/decision`, `POST /api/requests/:id/stop`, `GET /api/requests/:id`, and `GET /api/requests/:id/events` (using `openSseStream` from `./sse.ts` while preserving subscribe-before-replay ordering and replay buffering). Replace every regex `!` with explicit destructuring checks.

- [x] **Step 5: Rewrite `packages/host/api/src/index.ts`, remove old files, and update callers (F2, F9)**

  1. Rewrite `packages/host/api/src/index.ts` (target under 130 lines, zero `@deckagent/deck` import, zero `!` assertions):
     - Export only `host/api`'s 22 own public symbols: `startHost`, `HttpError`, `RequestFailure`, `type HttpErrorDetail`, `type HostOptions`, `type HttpFailureResponse`, `type HostMessage`, `type BriefManagement`, `type AttachmentManagement`, `type WebManagement`, `type WorkspaceManagement`, `type RuntimeEvent`, `type PreparedRequest`, `type RequestRun`, `type RuntimeOutcome`, `type RequestRuntime`, `type RequestAdmission`, `type PreparedTools`, `type RequestTools`, `type ToolContext`, `type ToolResult`, `type ToolSchema`.
     - Do not export `RequestController`, `requestTextLimit`, or any pass-through wire or domain type.
     - Keep `startHost` responsible for token generation, security headers, origin and auth checks, trusted asset serving, route delegation (`routeSession`, `routeManagement`, `routeRequests`), server startup, and `close()`.
  2. Remove the 7 old files in `packages/host/api/src/`: `contracts.ts`, `request-controller.ts`, `request-failure.ts`, `tool-contracts.ts`, `http-error.ts`, `multipart.ts`, and `deck-routes.ts`.
  3. Update `packages/host/api/tests/request-failure.test.mjs`:
     - Import `RequestController` from `../lib/types/lifecycle/request-controller.js` and `RequestFailure` from `../lib/index.js`.
  4. Update `apps/web/tsconfig.json`:
     - Add `{ "path": "../../packages/host/contracts" }` to `references`.
  5. Update the 14 files in `apps/web/src/` that previously imported pass-through wire DTOs from `@deckagent/host-api` so wire DTOs (`AgentRequest`, `AttachmentView`, `BriefView`, `ChatDraft`, `ConfirmationResult`, `ModelSelection`, `ProviderProtocol`, `ProviderSettings`, `ProviderTemplate`, `RequestSnapshot`, `TerminalStatus`, `WebSettings`) import from `@deckagent/host-contracts` while `host/api` ports (`AttachmentManagement`, `BriefManagement`, `HttpError`, `HttpErrorDetail`, `HttpFailureResponse`, `PreparedRequest`, `RequestAdmission`, `RequestFailure`, `RequestRun`, `RequestRuntime`, `RuntimeEvent`, `RuntimeOutcome`, `WebManagement`, `WorkspaceManagement`, `startHost`, `ToolResult`, `ToolSchema`) stay on `@deckagent/host-api`:
     - `apps/web/src/index.ts`
     - `apps/web/src/features/attachments/attachment-service.ts`
     - `apps/web/src/features/deck/brief-service.ts`
     - `apps/web/src/features/deck/confirmation-service.ts`
     - `apps/web/src/features/deck/deck-workflow.ts`
     - `apps/web/src/features/deck/generation-report.ts`
     - `apps/web/src/features/deck/generation-workflow.ts`
     - `apps/web/src/features/providers/built-in-providers.ts`
     - `apps/web/src/features/providers/provider-settings.ts`
     - `apps/web/src/features/requests/prepare-runtime.ts`
     - `apps/web/src/integrations/opencode/contracts.ts`
     - `apps/web/src/integrations/opencode/provider.ts`
     - `apps/web/src/integrations/opencode/runtime.ts`
     - `apps/web/src/integrations/providers/provider-catalog.ts`

- [x] **Step 6: Build, check boundaries, lint, format, scan, and run tests**

  Run:

  ```bash
  corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 format:check
  ```

  Expected: exit code `0` with 0 errors.

  Check for zero runtime `@deckagent/deck` imports and zero non-null assertions in `packages/host/api/src/`:

  ```bash
  node -e "const fs=require('node:fs'); const cp=require('node:child_process'); const files=cp.execSync('git ls-files packages/host/api/src',{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean); const ts=require('typescript'); let runtimeDeck=0, nonNull=0; for(const f of files){ const src=fs.readFileSync(f,'utf8'); const sf=ts.createSourceFile(f,src,ts.ScriptTarget.Latest,true); const visit=n=>{ if(ts.isImportDeclaration(n)&&n.moduleSpecifier.text==='@deckagent/deck'&&!n.importClause?.isTypeOnly) runtimeDeck++; if(ts.isNonNullExpression(n)) nonNull++; ts.forEachChild(n,visit); }; visit(sf); } console.log(JSON.stringify({runtimeDeck,nonNull})); if(runtimeDeck||nonNull) process.exit(1);"
  ```

  Expected: `{"runtimeDeck":0,"nonNull":0}` and exit code `0`.

  Run:

  ```bash
  corepack pnpm@11.28.5 test:tools-browser && corepack pnpm@11.28.5 test:model-requests && corepack pnpm@11.28.5 test:local-web && corepack pnpm@11.28.5 test:local-foundation && corepack pnpm@11.28.5 test:attachments && corepack pnpm@11.28.5 test:source-permissions && corepack pnpm@11.28.5 test:brief-foundation && corepack pnpm@11.28.5 test:outline-workflow && corepack pnpm@11.28.5 test:slide-pipeline
  ```

  Expected: every suite passes with `# fail 0` and `# skipped 0`.

  Run:

  ```bash
  node -e "const cp=require('node:child_process'); const data=JSON.parse(cp.execSync('node scripts/scan-module-design.mjs --json',{encoding:'utf8'})); const a=data.areas.find(x=>x.area==='packages/host/api/'); console.log(JSON.stringify({files:a.fileCount,lines:a.totalLines,over400:a.filesOver400,fnOver80:a.functionsOver80,assertions:a.assertionCount}));"
  ```

  Expected: `over400` is `0`, `fnOver80` is `1` (`receiveAttachment` in `transport/multipart.ts`), and `assertions` is `0`.

  **STOP** if `runtimeDeck > 0`, `nonNull > 0`, `assertions > 0`, `over400 > 0`, or any test fails.

- [x] **Step 7: Mark task done, write the report, and commit and push**

  1. Mark Steps 1 to 6 as `- [x]` in this file. Update the Task 11 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` with a link to `../reports/task-11-refactor-host-api.md`.
  2. Create `docs/build/refactor/module-design/reports/task-11-refactor-host-api.md` with:
     - One-sentence purpose line after H1 (`Read this file to ...`).
     - Table of created, modified, and removed files.
     - Before and after counts for `packages/host/api/` (files, lines, root exports, files over 400 lines, functions over 80 lines, `as` assertions, non-null assertions).
     - Exact command results and test counts from Step 6.
  3. Add Task 11 to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` with `0 error(s)`.
  4. Mark Step 7 as `- [x]` in this file.
  5. Stage only the files listed in `Files`, commit with a conventional commit message (example: `refactor(host-api): separate lifecycle and transport and narrow exports`), and run `git push`.

  **STOP** and send the Task 11 report with the commit hash. Do not start Task 12 until the owner approves the report.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Task 6 Report](../reports/task-06-diagnose-host-contracts-and-api.md)
3. <a id="ref-3"></a>[Task 7 Report](../reports/task-07-diagnose-session-persistence.md)
