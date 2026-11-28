# Task 6: Convert ChatService to a class and wire chat routes

Read this file to learn the steps of Task 6, which introduces `class ChatService`, wires contract decoders in `chats.routes.ts`, narrows `chats/index.ts`, and trims `chatSessions` in `server.ts`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `apps/host/src/modules/chats/chats.service.ts`
- `apps/host/src/modules/chats/chats.routes.ts`
- `apps/host/src/modules/chats/index.ts`
- `apps/host/src/modules/workspaces/workspaces.service.ts` (`WorkspaceChats`)
- `apps/host/src/server.ts` (imports and `createHostOptions`)
- `apps/host/tests/fixtures/http-host.mjs`
- `apps/host/tests/chat-persistence.test.mjs`
- `apps/host/tests/web-management.test.mjs`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`

**Files:**
- Change: `apps/host/src/modules/chats/chats.service.ts`
- Change: `apps/host/src/modules/chats/chats.routes.ts`
- Change: `apps/host/src/modules/chats/index.ts`
- Change: `apps/host/src/server.ts`
- Change: `apps/host/tests/fixtures/http-host.mjs`
- Test: `apps/host/tests/chat-persistence.test.mjs`
- Test: `apps/host/tests/web-management.test.mjs`

**Interfaces:**
- Uses: `decodeChatCreateBody`, `decodeChatSearchBody`, `decodeModelSelection` and `RequestValidationError` from `@deckagent/host-contracts`.
- Uses: `WorkspaceChats` and `WorkspaceLookup` from `apps/host/src/modules/workspaces/index.ts`.
- Produces: `export type ChatRunRecord = Omit<StoredRequest, 'sessionId'> & { readonly owner: RunOwner }`, `export interface ChatRuns` (`activeFor`, `activities`, `list` taking `RunOwner`), and `export class ChatService implements WorkspaceChats` with constructor `(private readonly store: ChatStore, private readonly runs: ChatRuns, private readonly registry: WorkspaceLookup, private readonly models: ChatModels, private readonly marks: ChatMarks)` in `apps/host/src/modules/chats/chats.service.ts`.
- Produces: `export function createChatRoutes(chats: ChatService): Router` in `apps/host/src/modules/chats/chats.routes.ts`.

**STOP when:** Task protocol only

**Forbidden:** Do not remove `getInfo`, `read`, `attachments` or `requests.{activeFor, get, text, sourceCatalogue, researchSources, recordSourceRead}` from `chatSessions` in `server.ts`. Do not change `web-state.ts`.

- [x] **Step 1: Write the failing tests**

In `apps/host/tests/chat-persistence.test.mjs`, import `ChatService` from `'../lib/types/modules/chats/index.js'` and add this test at the end of the file:

```js
test('ChatService implements WorkspaceChats and projects stored chat requests', async t => {
  const store = storeIn(t, await directory(t))
  const chatA = await store.create('workspace-a', { provider: 'openai', model: 'gpt-4o' })
  const chatB = await store.create('workspace-b')
  store.runs.admit({
    requestId: 'req-ws-a',
    owner: { kind: 'chat', id: chatA.sessionId },
    input: 'Start',
    selection: { provider: 'openai', model: 'gpt-4o' },
  })
  const service = new ChatService(
    store.chatStore,
    store.runs,
    { selectedId: () => 'workspace-a' },
    { lastSelection: () => undefined, selectable: () => true, rememberSelection: () => {} },
    { hasSlides: () => false, hasDraft: () => false },
  )
  assert.equal(await service.hasActiveRequest('workspace-a'), true)
  assert.equal(await service.hasActiveRequest('workspace-b'), false)
  const requests = await service.requests(chatA.sessionId)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].requestId, 'req-ws-a')
  assert.equal(requests[0].sessionId, chatA.sessionId)
  assert.equal('owner' in requests[0], false)
  await service.ungroup('workspace-b')
  assert.equal((await store.getInfo(chatB.sessionId)).workspaceId, null)
  assert.equal((await store.getInfo(chatA.sessionId)).workspaceId, 'workspace-a')
})
```

In `apps/host/tests/web-management.test.mjs`, add this test at the end of the file:

```js
test('Chat HTTP routes reject invalid create, selection and search payloads with stable error codes', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-chat-validation-'))
  const app = await startLocalWeb({ dataDir: join(dir, 'data') })
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const send = async (path, method, body) => {
    const res = await fetch(`${app.origin}${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    return { status: res.status, data: await res.json() }
  }
  const created = (await send('/api/sessions', 'POST', {})).data
  for (const [path, method, body, code] of [
    ['/api/sessions', 'POST', { extra: true }, 'INVALID_SESSION'],
    ['/api/sessions', 'POST', { selection: { provider: 'bad space', model: 'm' } }, 'INVALID_SELECTION'],
    [`/api/sessions/${created.sessionId}/selection`, 'PUT', { provider: 'openai', model: '   ' }, 'INVALID_SELECTION'],
    ['/api/sessions/search', 'POST', { words: 'x'.repeat(501) }, 'INVALID_REQUEST'],
  ]) {
    const reply = await send(path, method, body)
    assert.equal(reply.status, 400)
    assert.equal(reply.data.error.code, code)
  }
})
```

- [x] **Step 2: Run the test and make sure that it fails**

Run: `node --test --test-reporter=tap apps/host/tests/chat-persistence.test.mjs`
Expected: FAIL. Node exits with a non-zero code because `ChatService` does not exist in `modules/chats/index.js`.

- [x] **Step 3: Implement `ChatService`, update `chats.routes.ts` and narrow `chats/index.ts`**

1. In `apps/host/src/modules/chats/chats.service.ts`:
   - Change the comment on `ChatStore` from `SqliteSessionStore` to `SqliteChatStore`. Remove `requests` from `ChatStore`.
   - Export `ChatRunRecord` and `ChatRuns`.
   - Replace `ChatOperations`, `createWorkspaceChats` and `createChatOperations` with `export class ChatService implements WorkspaceChats`.
   - Implement `history`, `activities`, `requests`, `create`, `selectModel`, `list`, `search`, `hasActiveRequest` and `ungroup` on `ChatService`. Use `this.runs.activeFor({ kind: 'chat', id })`, `this.runs.activities({ kind: 'chat', id })` and `this.runs.list({ kind: 'chat', id }).map(toChatRequest)`.
2. In `apps/host/src/modules/chats/chats.routes.ts`:
   - Remove `isRecord`, `searchWords` and the `decodeSelection` parameter.
   - Change the signature to `export function createChatRoutes(chats: ChatService): Router`.
   - Add `parseBody<T>(decode: (value: unknown) => T, value: unknown): T` that catches `RequestValidationError` and throws `new HttpError(400, error.code)`.
   - Use `decodeChatCreateBody`, `decodeModelSelection` and `decodeChatSearchBody` from `@deckagent/host-contracts`.
3. In `apps/host/src/modules/chats/index.ts`, export only `ChatError` and `mapChatError` (`./chats.errors.ts`), `ChatService`, `toChatRequest` and `type ChatMarks` (`./chats.service.ts`), `ChatRequestService` (`./chat-requests.service.ts`), `createConversationContribution` (`./chats.run-contribution.ts`), `createChatRoutes` (`./chats.routes.ts`), `createChatRequestRoutes` (`./chat-requests.routes.ts`), and `SqliteChatStore` and `type ChatStoreOptions` (`./chats.store.ts`).

- [x] **Step 4: Update `server.ts` and `http-host.mjs`**

- In `apps/host/src/server.ts`:
  - Import `ChatService` in place of `createChatOperations` and `createWorkspaceChats`. Remove `selection` from the `./web-state.ts` import.
  - Create `const chats = new ChatService(sessions.chats, sessions.runs, registry, web, chatMarks(decks, drafts))`.
  - Pass `chats` to `createWorkspaceOperations(registry, chats)` and `createChatRoutes(chats)`.
  - Remove `chats`, `list`, `create`, `select`, `search`, `ungroup`, `requests.activities` and `requests.list` from `chatSessions`.
- In `apps/host/tests/fixtures/http-host.mjs`: replace `createChatOperations` with `ChatService` and construct `new ChatService({ read: readHistory }, {}, {}, {}, {})`.

- [x] **Step 5: Build, run tests and run checks**

Run: `corepack pnpm@11.28.5 build`
Expected: exit code 0.

Run: `node --test --test-reporter=tap apps/host/tests/chat-persistence.test.mjs apps/host/tests/web-management.test.mjs e2e/http-edge.test.mjs`
Expected: exit code 0 and `# fail 0`.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
