# Task 5: Extract ChatError, ChatRequestService and conversation contribution

Read this file to learn the steps of Task 5, which moves `ChatError`, extracts `ChatRequestService` and `chats.run-contribution.ts`, renames `request.routes.ts`, and adds `toChatRequest`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `apps/host/src/modules/chats/chats.errors.ts`
- `apps/host/src/modules/chats/chats.service.ts`
- `apps/host/src/modules/chats/request.routes.ts`
- `apps/host/src/modules/chats/index.ts`
- `apps/host/src/modules/deck/confirmation-coordinator.ts` (imports and `rethrowConfirmationError`)
- `apps/host/src/server.ts` (imports, `toStoredRequest`, `createHostOptions`)
- `apps/host/tests/fixtures/http-host.mjs`
- `apps/host/tests/chat-persistence.test.mjs`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`

**Files:**
- Change: `apps/host/src/modules/chats/chats.errors.ts`
- Create: `apps/host/src/modules/chats/chats.run-contribution.ts`
- Create: `apps/host/src/modules/chats/chat-requests.service.ts`
- Create: `apps/host/src/modules/chats/chat-requests.routes.ts`
- Remove: `apps/host/src/modules/chats/request.routes.ts`
- Change: `apps/host/src/modules/chats/chats.service.ts`
- Change: `apps/host/src/modules/chats/index.ts`
- Change: `apps/host/src/modules/deck/confirmation-coordinator.ts`
- Change: `apps/host/src/server.ts`
- Change: `apps/host/tests/fixtures/http-host.mjs`
- Test: `apps/host/tests/chat-persistence.test.mjs`

**Interfaces:**
- Uses: `decodeApprovalDecisionBody` and `RequestValidationError` from `@deckagent/host-contracts`.
- Produces: `ChatError`, `type ChatErrorCode` and `mapChatError` in `apps/host/src/modules/chats/chats.errors.ts`.
- Produces: `export function toChatRequest<T extends { readonly owner: RunOwner }>(value: T): Omit<T, 'owner'> & { readonly sessionId: string }` in `apps/host/src/modules/chats/chats.service.ts`.
- Produces: `export function createConversationContribution(readMessages: (id: string) => Promise<readonly ChatHistoryMessage[]>): RunContribution` in `apps/host/src/modules/chats/chats.run-contribution.ts`.
- Produces: `export class ChatRequestService` with `readSelection(sessionId: string): Promise<ModelSelection>`, `submit(request: AgentRequest): Promise<RequestSnapshot>`, `get(requestId: string): RequestSnapshot`, `decide(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): ApprovalView`, `events(requestId: string, after: number): readonly RequestEvent[]`, `stop(requestId: string): RequestSnapshot` and `subscribe(listener: (event: RequestEvent) => void): () => void` in `apps/host/src/modules/chats/chat-requests.service.ts`.
- Produces: `export function createChatRequestRoutes(requests: ChatRequestService, maxFiles: number, streams: Set<ServerResponse>): Router` in `apps/host/src/modules/chats/chat-requests.routes.ts`.

**STOP when:** Task protocol only

**Forbidden:** Do not change `createChatOperations`, `ChatOperations`, `createWorkspaceChats` or `chats.routes.ts` in this task.

- [x] **Step 1: Write the failing test**

In `apps/host/tests/chat-persistence.test.mjs`, import `ChatError` and `ChatRequestService` from `'../lib/types/modules/chats/index.js'` and `RunFailure` from `'../lib/types/runs/ports.js'`. Add this test at the end of the file:

```js
test('ChatRequestService maps run busy errors and unreadable chat errors to ChatError', async () => {
  const selection = { provider: 'openai', model: 'gpt-4o' }
  const unused = () => {
    throw new Error('unused')
  }
  const makeService = ({ getInfo, read, start }) =>
    new ChatRequestService({
      chats: { getInfo, read },
      providers: {
        providerSettings: () => [{ models: ['gpt-4o'] }],
        selectable: value => value.provider === 'openai' && value.model === 'gpt-4o',
      },
      runs: { start, get: unused, decide: unused, events: () => [], stop: unused, subscribe: () => () => {} },
      deckPlanner: { prepare: async () => unused() },
      preflightResearch: async () => {},
    })

  const isChatCode = code => error => error instanceof ChatError && error.code === code
  const missing = makeService({ getInfo: async () => undefined, read: async () => [], start: async () => ({}) })
  await assert.rejects(missing.readSelection('missing'), isChatCode('SESSION_NOT_FOUND'))

  const corrupt = makeService({
    getInfo: async () => ({ selection }),
    read: async () => {
      throw new SessionError('SESSION_CORRUPT', 'corrupt')
    },
    start: async () => ({}),
  })
  await assert.rejects(corrupt.readSelection('bad'), isChatCode('CHAT_UNREADABLE'))

  const busy = makeService({
    getInfo: async () => ({ selection }),
    read: async () => [],
    start: async () => {
      throw new RunFailure('RUN_OWNER_BUSY')
    },
  })
  await assert.rejects(busy.submit({ sessionId: 'chat-1', input: 'Hello' }), isChatCode('SESSION_BUSY'))

  const ok = makeService({
    getInfo: async () => ({ selection }),
    read: async () => [],
    start: async () => ({
      requestId: 'req-1',
      owner: { kind: 'chat', id: 'chat-1' },
      status: 'active',
      text: '',
      sequence: 1,
    }),
  })
  assert.deepEqual(await ok.submit({ sessionId: 'chat-1', input: 'Hello' }), {
    requestId: 'req-1',
    sessionId: 'chat-1',
    status: 'active',
    text: '',
    sequence: 1,
  })
})
```

- [x] **Step 2: Run the test and make sure that it fails**

Run: `node --test --test-reporter=tap apps/host/tests/chat-persistence.test.mjs`
Expected: FAIL. Node exits with a non-zero code because `ChatError` and `ChatRequestService` do not exist in `modules/chats/index.js`.

- [x] **Step 3: Move `ChatError`, `chats.run-contribution.ts`, `ChatRequestService` and `chat-requests.routes.ts`**

1. In `apps/host/src/modules/chats/chats.errors.ts`, declare and export `ChatErrorCode`, `ChatError` (with `this.name = 'ChatError'`) and `mapChatError`. Keep `chatStatus` typed as `Readonly<Record<ChatErrorCode, number>>`.
2. Create `apps/host/src/modules/chats/chats.run-contribution.ts` and move `createConversationContribution` there.
3. In `apps/host/src/modules/chats/chats.service.ts`:
   - Import `ChatError` from `./chats.errors.ts`. Replace every `ChatWorkflowError` call with `ChatError`.
   - Export `toChatRequest<T extends { readonly owner: RunOwner }>(value: T): Omit<T, 'owner'> & { readonly sessionId: string }`.
   - Remove `ChatWorkflowError`, `ChatWorkflowErrorCode`, `ChatWorkflowErrorDetail`, `ChatRequestOperations`, `ChatRunOperations`, `DeckRunPlanner`, `ChatRequestDependencies`, `createConversationContribution`, `projectRequest`, `createChatRequestOperations` and `readChatSelection`.
4. Create `apps/host/src/modules/chats/chat-requests.service.ts`:
   - Export `ChatRunOperations`, `DeckRunPlanner`, `ChatRequestDependencies` (with `chats` in place of `sessions`) and `class ChatRequestService`.
   - Implement `readSelection(sessionId)` with the logic of `readChatSelection`, throwing `ChatError`.
   - Implement `submit`, `get`, `stop`, `decide`, `events` and `subscribe` with `toChatRequest` and `ChatError`.
5. Create `apps/host/src/modules/chats/chat-requests.routes.ts` from `request.routes.ts` and remove `request.routes.ts`:
   - Rename `createRequestRoutes` to `createChatRequestRoutes(requests: ChatRequestService, maxFiles: number, streams: Set<ServerResponse>): Router`.
   - Replace the hand-written approval decision body check with `decodeApprovalDecisionBody` from `@deckagent/host-contracts`, catching `RequestValidationError` and throwing `new HttpError(400, error.code)`.
6. Update `apps/host/src/modules/chats/index.ts` to export `ChatError` and `mapChatError` from `./chats.errors.ts`, `toChatRequest` from `./chats.service.ts`, `ChatRequestService` from `./chat-requests.service.ts`, `createConversationContribution` from `./chats.run-contribution.ts` and `createChatRequestRoutes` from `./chat-requests.routes.ts`. Remove `ChatWorkflowError`, `mapChatFailure`, `createChatRequestOperations`, `ChatRequestOperations`, `ChatRunOperations`, `DeckRunPlanner`, `readChatSelection` and `createRequestRoutes`.

- [x] **Step 4: Update callers**

- In `apps/host/src/modules/deck/confirmation-coordinator.ts`: replace `ChatWorkflowError` with `ChatError`.
- In `apps/host/src/server.ts`:
  - Import `ChatRequestService`, `createChatRequestRoutes`, `mapChatError` and `toChatRequest` from `./modules/chats/index.ts`. Remove `createChatRequestOperations`, `createRequestRoutes`, `readChatSelection`, `mapChatFailure`, `toStoredRequest` and unused `StoredRequest` / `RequestRecord` imports.
  - Replace `toStoredRequest` calls in `chatSessions.requests` with `toChatRequest`.
  - Construct `const requests = new ChatRequestService({ chats: sessions.chats, providers: runtime.providers, runs, preflightResearch, deckPlanner })` before `prepareGeneration`.
  - In `prepareGeneration`, replace `readChatSelection(...)` with `await requests.readSelection(request.sessionId)`.
  - Use `mapChatError(error)` and `createChatRequestRoutes(requests, runtime.inputs.maxFiles, context.streams)`.
- In `apps/host/tests/fixtures/http-host.mjs`: replace `createRequestRoutes` with `createChatRequestRoutes`.

- [x] **Step 5: Build, run tests and run checks**

Run: `corepack pnpm@11.28.5 build`
Expected: exit code 0.

Run: `node --test --test-reporter=tap apps/host/tests/chat-persistence.test.mjs apps/host/tests/opencode-adapter.test.mjs e2e/request-lifecycle.test.mjs`
Expected: exit code 0 and `# fail 0`.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
