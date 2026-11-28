# Task 54: Cut over Host runs, routes and OpenCode adapter to RunController and OpenCodeAgentRuntime

Read this file to learn the steps of Task 54, which cuts over the Local Host to `RunController` and `OpenCodeAgentRuntime` and removes legacy wrappers.

**Type:** Code

After this task, every live HTTP request runs through `apps/host/src/modules/chats/` (history and request routes), `apps/host/src/modules/deck/` (`createDeckRunPlan`, `createGenerationRunPlan`), `apps/host/src/runs/lifecycle/` (`RunController`), `apps/host/src/runs/preparation/` and `apps/host/src/runtimes/opencode/` (`OpenCodeAgentRuntime`). `apps/host/src/features/requests/`, `apps/host/src/local-transport.ts`, `OpenCodeRuntime`, `isSourceToolAllowed` and `sourceToolNames` no longer exist. `packages/host/api/` stays as a temporary HTTP-helper shell until the next task removes it.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `apps/host/src/server.ts`, `apps/host/src/local-transport.ts`, `apps/host/src/web-state.ts`, `apps/host/src/http/error-handler.ts`, `apps/host/src/http/start-host.ts`
- `apps/host/src/features/requests/prepare-runtime.ts`
- `apps/host/src/modules/chats/{chats.service.ts,chats.routes.ts,chats.errors.ts,index.ts}`
- `apps/host/src/modules/deck/{confirmation-coordinator.ts,deck.service.ts,deck.routes.ts,deck-prompts.ts,deck-tool-session.ts,generation-tools.ts,deck-run-plan.ts,generation-run-plan.ts,index.ts}`
- `apps/host/src/runtimes/opencode/{agent-runtime.ts,config.ts,history.ts,mcp-bridge.ts,resources.ts,runtime.ts,stream-tracker.ts,index.ts}`
- `packages/host/api/src/transport/{request-routes.ts,session-routes.ts}`

**Files:**

- Create: `apps/host/src/modules/chats/request.routes.ts`
- Remove: `apps/host/src/features/requests/index.ts`, `apps/host/src/features/requests/prepare-runtime.ts`, `apps/host/src/local-transport.ts`, `apps/host/src/modules/deck/deck-workflow.ts`, `apps/host/src/modules/deck/generation-workflow.ts`, `apps/host/src/modules/deck/generation-execution.ts`, `apps/host/src/runtimes/opencode/runtime.ts`, `apps/host/src/runtimes/opencode/contracts.ts`
- Change: `apps/host/src/server.ts`, `apps/host/src/web-state.ts`, `apps/host/src/http/error-handler.ts`, `apps/host/src/http/start-host.ts`, `apps/host/src/modules/chats/{chats.service.ts,chats.routes.ts,chats.errors.ts,index.ts}`, `apps/host/src/modules/deck/{confirmation-coordinator.ts,deck.service.ts,deck.routes.ts,deck-prompts.ts,deck-tool-session.ts,generation-tools.ts,deck-run-plan.ts,generation-run-plan.ts,index.ts}`, `apps/host/src/runtimes/opencode/{agent-runtime.ts,config.ts,history.ts,mcp-bridge.ts,resources.ts,stream-tracker.ts,index.ts}`, `apps/host/src/tools/executors/source-tools.ts`, `apps/host/src/tools/index.ts`
- Test: `apps/host/tests/opencode-adapter.test.mjs`, `apps/host/tests/deck-run-plan.test.mjs`

**Interfaces:**

- Produces, in `apps/host/src/modules/chats/chats.service.ts` (exported by `modules/chats/index.ts`):
  - `createConversationContribution(readMessages: (sessionId: string) => Promise<readonly HostMessage[]>): RunContribution` returning `{ resources: [{ kind: 'conversation', messages }] }` for `context.owner.kind === 'chat'`.
  - `ChatRequestOperations`: `submit(request: AgentRequest): Promise<RequestSnapshot>`, `get(requestId: string): RequestSnapshot`, `decide(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): ApprovalView`, `events(requestId: string, after: number): readonly RequestEvent[]`, `stop(requestId: string): RequestSnapshot`, `subscribe(listener: (event: RequestEvent) => void): () => void`.
  - `createChatRequestOperations(deps)`: checks chat existence (`SESSION_NOT_FOUND`), chat readability (`CHAT_UNREADABLE`, `SESSION_UNAVAILABLE`), model selectability (`NO_SELECTABLE_MODEL` with exact `reason`) and public research availability (`preflightResearch`) before calling `runs.start(plan, startOptions)`. Routes `request.deck` and `request.continueDeck` through a narrow `DeckRunPlanner` port. Maps `RunFailure('RUN_OWNER_BUSY')` to `ChatWorkflowError('SESSION_BUSY')` and projects `RunSnapshot` (`owner.id`) to wire `RequestSnapshot` (`sessionId`).
  - Add `history(sessionId: string)` on `ChatOperations` (filtering `role !== 'system'` and projecting history messages identically to `session-routes.ts`).
- Produces, in `apps/host/src/modules/chats/request.routes.ts`: `createRequestRoutes(requests: ChatRequestOperations, maxAttachments: number, streams: Set<ServerResponse>): Router` registering the five `/api/requests*` routes with exact path parameter checks and SSE cursor replay.
- Produces, in `apps/host/src/web-state.ts`: `mapWebStateFailure(error: unknown)` mapping `WebStateError` (`PREFERENCES_STALE: 409`, `INVALID_SELECTION`/`INVALID_REQUEST`: 400, fallback 500).
- Changes, in `apps/host/src/http/start-host.ts`: add optional `readonly onClose?: () => Promise<void> | void` and `readonly omitLegacyRoutes?: boolean` (when true, `server.ts` mounts `/api/sessions/:sessionId/history` and `/api/requests*` via module routes instead of `packages/host/api/`).

**STOP when:** Any HTTP status code, JSON error code, error `detail` field or SSE event frame changes on an existing e2e test.

**Forbidden:** remove `packages/host/api/` or edit `packages/session/persistence/` in this task. Import `apps/host/src/modules/` inside `apps/host/src/runs/` or `apps/host/src/runtimes/`.

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 53 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Move history and request routes and run preparation into `apps/host/src/modules/chats/`**

1. Add `history(sessionId)` to `ChatOperations` and register `GET /api/sessions/:sessionId/history` in `apps/host/src/modules/chats/chats.routes.ts`.
2. Create `apps/host/src/modules/chats/request.routes.ts` with `createRequestRoutes` preserving the five `/api/requests*` routes and SSE stream behavior.
3. Add `createConversationContribution` and `createChatRequestOperations` to `apps/host/src/modules/chats/chats.service.ts`. Map `RunFailure('RUN_OWNER_BUSY')` to `ChatWorkflowError('SESSION_BUSY')`.
4. Extend `ChatWorkflowErrorCode` and `apps/host/src/modules/chats/chats.errors.ts` with `SESSION_BUSY` (409), `NO_SELECTABLE_MODEL` (409), `SESSION_UNAVAILABLE` (500), `RUNTIME_UNAVAILABLE` (503) and `RUNTIME_VERSION_UNSUPPORTED` (503).

- [x] **Step 3: Switch `apps/host/src/modules/deck/` to `RunController` and remove legacy deck wrappers**

1. Update `ConfirmationCoordinator` and `createDeckOperations` so `confirm(sessionId, value)` uses injected `runs` (`start` returning `RunSnapshot`, mapping `RUN_OWNER_BUSY` to `DeckWorkflowFailure('SESSION_BUSY')`) and `createGenerationRunPlan` directly, without receiving `submit` from `HostRouteContext`.
2. Update `apps/host/src/modules/deck/deck.routes.ts` to mount `POST /api/sessions/:sessionId/deck/confirm` without reading `context.submit`.
3. Move any helper still needed by `deck-run-plan.ts` or `generation-run-plan.ts` out of `deck-tool-session.ts` and `generation-tools.ts`. Remove `@deckagent/host-api` and `features/requests` imports from all non-route deck files. Remove `isSourceToolAllowed` from `deck-prompts.ts`, `sourceToolNames` from `generation-tools.ts`, and `deck-workflow.ts`, `generation-workflow.ts` and `generation-execution.ts`.
4. Update `apps/host/tests/deck-run-plan.test.mjs` to keep the 16-case `sourceKinds` table asserted against the documented expected tool sets directly (since `isSourceToolAllowed` no longer exists).

- [x] **Step 4: Clean up `apps/host/src/runtimes/opencode/` and `apps/host/src/tools/`**

1. Move `findExecutable` and `OpenCodeOptions` into `apps/host/src/runtimes/opencode/resources.ts` and `agent-runtime.ts`. Remove `runtime.ts` and `contracts.ts`.
2. In `apps/host/src/runtimes/opencode/config.ts`, replace `stepLimit ?? (bridge?.names.includes('publish_slide') ? 'none' : 8)` with `stepLimit ?? 8`.
3. Remove `seedPrompt` and the `@deckagent/host-api` import from `history.ts`. Switch `mcp-bridge.ts` to `RunTools` from `../../runs/ports.ts`. Remove `AttemptResult.outcome` and the `@deckagent/host-api` import from `stream-tracker.ts`. Update `runtimes/opencode/index.ts`.
4. Update `apps/host/src/tools/executors/source-tools.ts` to use `ToolSet`, `ToolContext`, `ToolSchema` and `ToolResult` from `../../runs/ports.ts` with zero `@deckagent/host-api` imports.
5. Update `apps/host/tests/opencode-adapter.test.mjs` to import `seedConversationPrompt` instead of `seedPrompt` where tested.

- [x] **Step 5: Wire `server.ts`, `http/error-handler.ts`, `http/start-host.ts` and `web-state.ts`, and remove `features/` and `local-transport.ts`**

1. Add `RunFailure` status mapping (`HOST_CLOSED: 503`, `HOST_BUSY: 429`, `RUNTIME_UNAVAILABLE: 503`, `RUNTIME_VERSION_UNSUPPORTED: 503`, `REQUEST_NOT_FOUND: 404`, `APPROVAL_NOT_FOUND: 404`, `SESSION_NOT_FOUND: 404`, `RUN_OWNER_BUSY: 409`, `SESSION_BUSY: 409`, `GENERATION_LINK_CONFLICT: 409`, `APPROVAL_CONFLICT: 409`, `REQUEST_CLOSED: 409`, `DRAFT_CONFLICT: 409`, `ATTACHMENT_REJECTED: 409`, `ATTACHMENT_NOT_READY: 409`, `ATTACHMENT_COUNT_EXCEEDED: 413`, `REQUEST_EMPTY: 400`, `REQUEST_NOT_SAVED: 500`, `GENERATION_LINK_FAILED: 500`, preserving `error.detail`) to `apps/host/src/http/error-handler.ts`.
2. Export `mapWebStateFailure` from `apps/host/src/web-state.ts`.
3. Update `apps/host/src/server.ts` to construct `OpenCodeAgentRuntime` (with an `OwnerBindingStore` adapter over `sessions.requests` translating `chat:<id>` to `<id>`), `RunController` (with a `RunStore` adapter over `sessions.requests` + `runtime.inputs.admitDraft`, `ProviderResolver` over `providers`, and registered contributions `[conversationContribution, sourceToolsContribution]`), `createChatRequestOperations`, `createRequestRoutes`, and `settings: async () => ...` mapping `await openCode.availability()` to `{ available: true } | { available: false, reason: avail.code }`. Pass `onClose: () => runs.close()`, `omitLegacyRoutes: true` (mounting `createChatRoutes` and `createRequestRoutes` in the exact current route order), and error maps including `mapSourceToolFailure`, `mapWebStateFailure` and `SessionError` mapping (`SESSION_NOT_FOUND: 404`, `SESSION_CORRUPT: 409 CHAT_UNREADABLE`, `DRAFT_TOO_LARGE: 413`).
4. Remove `apps/host/src/features/requests/` (and empty `apps/host/src/features/`) and `apps/host/src/local-transport.ts`.

- [x] **Step 6: Check that no removed paths remain and run checks**

Run: `git grep --untracked -n -E "features/requests|local-transport|OpenCodeRuntime|OpenCodeError|isSourceToolAllowed|sourceToolNames" -- apps/host/src`

Expected: PASS. No line.

Do the step `Format, build and check` of the Task protocol. Run `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`.

Expected: PASS. Output contains `# fail 0`.

- [x] **Step 7: Run every suite**

Deferred by user instruction until Tasks 53 through 57 finish.

- [x] **Step 8: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.

- What the commands do not prove: `packages/host/api/` still supplies HTTP helpers and `startHost` test harnesses until the next task moves them into `apps/host/src/http/`.
- `CHANGELOG.md` line: ``- Cut over Local Host runs, chat/request routes, deck workflows and OpenCode adapter to `RunController`, `RunContribution` and `OpenCodeAgentRuntime`, and remove `apps/host/src/features/` and `local-transport.ts`. Task 54 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `refactor: cut over Local Host to RunController, RunContribution and OpenCodeAgentRuntime`
