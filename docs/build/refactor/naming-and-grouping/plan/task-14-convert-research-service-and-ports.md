# Task 14: Convert ResearchService and split the research ports

Read this file to learn the steps of Task 14, which renames the research service class, replaces `ResearchSessionStore` with `ResearchChats` and `ResearchRuns`, and narrows the exports of `research/index.ts`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`, and the row `Parallel phases` of Decisions (Revision 4)
- `apps/host/src/modules/research/research.service.ts` (the interfaces `ResearchSessionStore` and `ResearchOperations`, and the class `ResearchCoordinator`)
- `apps/host/src/modules/research/research.routes.ts`
- `apps/host/src/modules/research/index.ts`
- `apps/host/src/modules/chats/chats.service.ts` (the imports and the `implements` clause of `ChatService`)
- `apps/host/src/modules/deck/image-research.ts` (the use of `ResearchCoordinator`)
- `apps/host/src/db/run-store.ts` (the methods `reserveResearch`, `recordResearch` and `researchSources`)
- `apps/host/src/server.ts` (the research imports, `RuntimeLayer` and the construction of the research service in `createRuntimeLayer`)
- `apps/host/tests/research.test.mjs` (the imports and the helper `MemoryCredentials`)
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`

**Files:**
- Change: `apps/host/src/modules/research/research.service.ts`
- Change: `apps/host/src/modules/research/research.routes.ts`
- Change: `apps/host/src/modules/research/index.ts`
- Change: `apps/host/src/modules/chats/chats.service.ts` (the import and the `implements` clause only)
- Change: `apps/host/src/modules/deck/image-research.ts` (the name `ResearchCoordinator` only)
- Change: `apps/host/src/server.ts` (the research names and the construction of the research service only)
- Test: `apps/host/tests/research.test.mjs`

**Interfaces:**
- Uses: `ResearchError` and `mapResearchError` in `apps/host/src/modules/research/research.errors.ts`. `TavilyErrorCode` in `apps/host/src/modules/research/tavily.ts`.
- Produces in `apps/host/src/modules/research/research.service.ts`:

```ts
export interface ResearchChats {
  getInfo(sessionId: string): Promise<unknown>
}

export interface ResearchRuns {
  reserveResearch(requestId: string, sessionId: string): void
  recordResearch(requestId: string, sessionId: string, query: string, result: ResearchResult): readonly ResearchSourceRecord[]
  researchSources(sessionId: string): readonly ResearchSourceRecord[]
}

export class ResearchService {
  constructor(
    store: SqliteResearchStore,
    credentials: CredentialStore,
    chats: ResearchChats,
    runs: ResearchRuns,
    environmentKey: string | undefined,
    client: Pick<TavilyClient, 'check' | 'search' | 'images'>,
    onPreferencesChanged?: (version: number) => void,
  )
}
```

- Produces: `export function createResearchRoutes(research: ResearchService): Router` in `apps/host/src/modules/research/research.routes.ts`.
- Produces: `export class ChatService implements ..., ResearchChats` in `apps/host/src/modules/chats/chats.service.ts`.
- Produces: the exports of `apps/host/src/modules/research/index.ts`: `SqliteResearchStore`, `ResearchService`, `type ResearchChats`, `type ResearchSourceRecord`, `ResearchError`, `mapResearchError`, `TavilyClient`, `type ImageSearchCandidate` and `createResearchRoutes`.

**STOP when:** `SqliteRunStore` does not satisfy `ResearchRuns`, or `ChatService` does not satisfy `ResearchChats`, without a change to `apps/host/src/db/` or to the body of a `ChatService` method.

**Forbidden:** Do not change `apps/host/src/db/`. Do not change the bodies of the methods of the research service, except the names `this.sessions.getInfo` and `this.sessions.requests`. In `apps/host/src/modules/chats/chats.service.ts`, keep the other interfaces of the `implements` clause.

- [ ] **Step 1: Write the failing tests**

In `apps/host/tests/research.test.mjs`, add these two tests at the end of the file:

```js
test('ResearchService reads chats through ResearchChats and records sources through ResearchRuns', async () => {
  const db = new DatabaseSync(':memory:')
  db.exec(
    "CREATE TABLE preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE change_versions (topic TEXT NOT NULL, key TEXT NOT NULL, version INTEGER NOT NULL, PRIMARY KEY (topic, key)); INSERT INTO change_versions (topic, key, version) VALUES ('preferences', 'host', 0)",
  )
  const source = { sourceId: 'research-1' }
  const calls = []
  const chats = { getInfo: async id => (id === 'chat-1' ? { sessionId: id } : undefined) }
  const runs = {
    reserveResearch: (requestId, sessionId) => calls.push(['reserve', requestId, sessionId]),
    recordResearch: (requestId, sessionId, query) => {
      calls.push(['record', requestId, sessionId, query])
      return [source]
    },
    researchSources: sessionId => {
      calls.push(['sources', sessionId])
      return [source]
    },
  }
  const client = {
    check: async () => {},
    search: async () => ({
      requestId: 'tavily-1',
      results: [{ title: 'Public source', url: 'https://example.org/a', content: 'Known.', partial: true }],
    }),
    images: async () => [],
  }
  const research = new app.ResearchService(
    new app.SqliteResearchStore(db),
    new MemoryCredentials(),
    chats,
    runs,
    'environment-key',
    client,
  )
  assert.deepEqual(await research.sources('chat-1'), [source])
  await assert.rejects(
    research.sources('missing'),
    error => error instanceof app.ResearchError && error.code === 'SESSION_NOT_FOUND',
  )
  const prepared = await research.prepare(true)
  assert.deepEqual(await prepared.search('public topic', 'request-1', 'chat-1', new AbortController().signal), [source])
  assert.deepEqual(calls, [
    ['sources', 'chat-1'],
    ['reserve', 'request-1', 'chat-1'],
    ['record', 'request-1', 'chat-1', 'public topic'],
  ])
  db.close()
})

test('research index exports ResearchService and only the operations that callers use', () => {
  assert.deepEqual(Object.keys(app).toSorted(), [
    'ResearchError',
    'ResearchService',
    'SqliteResearchStore',
    'TavilyClient',
    'createResearchRoutes',
    'mapResearchError',
  ])
})
```

- [ ] **Step 2: Build and run the tests, and make sure that they fail**

Run: `corepack pnpm@11.28.5 build; node --test --test-reporter=tap apps/host/tests/research.test.mjs`
Expected: FAIL. `app.ResearchService` is not a constructor, and the index exports `ResearchCoordinator` and `TavilyError`.

- [ ] **Step 3: Split the ports and rename the class**

1. In `apps/host/src/modules/research/research.service.ts`, replace `ResearchSessionStore` with `ResearchChats` and `ResearchRuns` as Interfaces gives them. Remove `ResearchOperations`. Rename `ResearchCoordinator` to `ResearchService` and use the constructor of Interfaces. Replace `this.sessions.getInfo` with `this.chats.getInfo`, and each `this.sessions.requests.` with `this.runs.`.
2. In `apps/host/src/modules/research/research.routes.ts`, import `type { ResearchService }` from `./research.service.ts` and change the parameter type of `createResearchRoutes`.
3. Replace the content of `apps/host/src/modules/research/index.ts` with exports of the 9 names in Interfaces, each from the file that declares it.
4. In `apps/host/src/modules/chats/chats.service.ts`, import `type { ResearchChats }` from `../research/index.ts`, and add `ResearchChats` to the end of the `implements` clause of `ChatService`.
5. In `apps/host/src/modules/deck/image-research.ts`, replace `ResearchCoordinator` with `ResearchService` in the import and in `Pick<..., 'imageSearch'>`.
6. In `apps/host/src/server.ts`, replace `ResearchCoordinator` with `ResearchService`. In `createRuntimeLayer`, replace the argument `{ getInfo: id => sessions.chats.getInfo(id), requests: sessions.runs }` with the two arguments `chats, sessions.runs`. `chats` is the `ChatService` that `createRuntimeLayer` already creates.

- [ ] **Step 4: Build, run the tests and run the checks**

Run: `corepack pnpm@11.28.5 build && node --test --test-reporter=tap apps/host/tests/research.test.mjs apps/host/tests/image-research.test.mjs apps/host/tests/research-image-generation.test.mjs e2e/source-requests.test.mjs`
Expected: exit code 0 and `# fail 0`.

Run: `git grep -n -E "ResearchCoordinator|ResearchOperations|ResearchSessionStore" -- apps/host/src apps/host/tests e2e`
Expected: no line.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries`
Expected: exit code 0 and `check-boundaries: 0 violation(s)`.

- [ ] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
