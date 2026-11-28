# Task 27: Move the chats module into apps/host/src/modules

Read this file to learn the steps of Task 27, which moves the code of the `chats` module into `apps/host/src/modules/chats/` with no change of behavior.

Today, the code of the `chats` module is in four places:

- The folder `apps/host/src/features/chats/`.
- The four chat routes and the function `withActive` in `packages/host/api/src/transport/management-routes.ts` and `packages/host/api/src/index.ts`.
- The method `project` of `WebState` in `apps/host/src/web-state.ts`.
- The error map `chatStatus` and the function `chatManagement` in `apps/host/src/local-transport.ts`.

After this task, this code is in `apps/host/src/modules/chats/`. The store `SqliteSessionStore` stays in `packages/session/persistence/`, because the same database holds the requests and the attachments. The route `GET /api/sessions/:sessionId/history` stays in `packages/host/api/src/transport/session-routes.ts`. The HTTP contract does not change: each path, status code, error code and JSON body stays the same. This task adds one assertion to an existing test and no `version`.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/conventions/project-structure.md` (sections `## Hình dạng module` and `## Trong lúc chuyển`)
- `apps/host/src/features/chats/index.ts` (83 lines)
- `apps/host/src/local-transport.ts` (lines 1-25, 110-200)
- `packages/host/api/src/transport/management-routes.ts` (lines 73-149)
- `packages/host/api/src/index.ts` (lines 44-72)
- `apps/host/src/modules/workspaces/index.ts` and `apps/host/src/modules/workspaces/workspaces.routes.ts`, as the pattern of a module

**Files:**

- Move with `git mv`: `apps/host/src/features/chats/index.ts` to `apps/host/src/modules/chats/chats.service.ts`. Then delete the folder `apps/host/src/features/chats/`.
- Change (complete file): `apps/host/src/modules/chats/chats.service.ts`
- Create: `apps/host/src/modules/chats/chats.routes.ts`, `apps/host/src/modules/chats/chats.errors.ts`, `apps/host/src/modules/chats/index.ts`
- Change (edit script): `packages/host/api/src/transport/management-routes.ts`, `packages/host/api/src/transport/contracts.ts`, `packages/host/api/src/index.ts`, `apps/host/src/local-transport.ts`, `apps/host/src/web-state.ts`, `apps/host/src/server.ts`, `e2e/model-requests.test.mjs`
- Change: `CHANGELOG.md`
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-27-move-chats-module.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-27-move-chats-module.md`

**Interfaces:**

- Uses: `SqliteSessionStore` from `@deckagent/session-persistence` (the methods `chats`, `list`, `create`, `select`, `search`, `ungroup` and `requests.activeFor`). `WebState` and `selection(value: unknown): ModelSelection` from `apps/host/src/web-state.ts`. `WorkspaceChats` and `WorkspaceLookup` from `apps/host/src/modules/workspaces/index.ts`. `HttpError`, `HttpFailureResponse`, `json`, `readJson`, `param`, `params` and `route` from `@deckagent/host-api`.
- Produces, in `apps/host/src/modules/chats/index.ts`:
  - `createChatOperations(store: ChatStore, registry: WorkspaceLookup, models: ChatModels, marks: ChatMarks): ChatOperations`
  - `createWorkspaceChats(store: ChatStore): WorkspaceChats`
  - `createChatRoutes(chats: ChatOperations, decodeSelection: (value: unknown) => ModelSelection): Router`
  - `mapChatFailure(error: unknown): HttpFailureResponse | undefined`
  - The types `ChatStore`, `ChatModels`, `ChatMarks`, `ChatOperations` and `ChatRecord`.
- Deletes: `WebManagement.sessions`, `WebManagement.createSession`, `WebManagement.selectModel` and `WebManagement.searchSessions` in `@deckagent/host-api`, the third parameter of `registerManagementRoutes`, `WebState.project`, and `chatManagement` in `apps/host/src/local-transport.ts`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in Step 1 is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit script in Step 5 prints a line that contains `expected 1 match`.
- A suite in Step 7 fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`. The comments in the code of this task are part of the code.
- Commit when a STOP condition occurred. Push with `--force`, or skip a hook with `--no-verify`.
- Change an expected value in a test. This task adds one assertion to `e2e/model-requests.test.mjs` and changes no other test.
- Change the code of Step 4 or the edit script of Step 5. When `build` or `lint` reports an error in it, STOP.
- Change a file in `docs/architecture/`.

## Move rules

The code of Step 4 and the edit script of Step 5 follow these rules. Use them to review the code. Do not change the code.

| Current code | Code after the move |
| --- | --- |
| `registerManagementRoutes` registers `GET /api/sessions`, `POST /api/sessions`, `PUT /api/sessions/:sessionId/selection` and `POST /api/sessions/search` | `createChatRoutes` returns a router with the same four routes, methods, paths and parameter class. `server.ts` gives it in `HostOptions.routes` after the workspaces router. `createHostRoutes` mounts it after the management routes. No earlier route matches these four paths and methods. |
| `withActive` in `createHostRoutes` adds `activeRequestId` from `RequestController.active`, which calls `activeFor` of the request store | The operations `list` and `search` add `activeRequestId` from `store.requests.activeFor`. This is the same request log. `create` and `selectModel` do not add it, as before. |
| `chatManagement` checks the bodies, and `selection` throws `WebStateError('INVALID_SELECTION')` | `chats.routes.ts` does the same checks with the same codes: `INVALID_SESSION` for the create body and `INVALID_REQUEST` for the search body. `server.ts` gives `selection` from `web-state.ts` as `decodeSelection`, so the code `INVALID_SELECTION` stays. |
| `mapApplicationFailure` maps `ChatWorkflowError` first | `mapChatFailure` maps it. `server.ts` gives `error => mapWorkspaceFailure(error) ?? mapChatFailure(error) ?? mapApplicationFailure(error)`. `SessionError` stays in `mapApplicationFailure`, because the attachments use it too. |
| `WebState.project` builds the chat projection | The private function `projectChat` in `chats.service.ts` builds the same fields in the same order. `chatMarks` in `server.ts` gives `hasSlides` and `hasDraft` from the deck store and the draft store. |
| The chats feature imports `SqliteSessionStore`, `DeckStore`, `MemoryDraftStore` and `WebState` | A module does not import a storage package. The service declares the ports `ChatStore`, `ChatModels` and `ChatMarks`. `SqliteSessionStore` and `WebState` match them by shape. |

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" apps/host/src/features/chats/index.ts apps/host/src/local-transport.ts apps/host/src/server.ts apps/host/src/web-state.ts packages/host/api/src/transport/management-routes.ts packages/host/api/src/transport/contracts.ts packages/host/api/src/index.ts`

Expected: PASS. Seven lines, in this order: `83`, `253`, `402`, `137`, `149`, `129`, `72`.

Run: `git grep -n "features/chats" -- apps/host/src`

Expected: PASS. Three lines: `apps/host/src/local-transport.ts:7`, `apps/host/src/local-transport.ts:8` and `apps/host/src/server.ts:20`.

- [x] **Step 2: Build and record the suite before the move**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 test:local-foundation`

Expected: PASS. The output contains `# pass 47` and `# fail 0`.

- [x] **Step 3: Move the file**

Run these commands in order:

```text
node -e "require('fs').mkdirSync('apps/host/src/modules/chats', { recursive: true })"
git mv apps/host/src/features/chats/index.ts apps/host/src/modules/chats/chats.service.ts
node -e "require('fs').rmSync('apps/host/src/features/chats', { recursive: true, force: true })"
```

Run: `git status --short`

Expected: PASS. One line: `R  apps/host/src/features/chats/index.ts -> apps/host/src/modules/chats/chats.service.ts`.

- [x] **Step 4: Write the new code**

Write each file below with the exact content. `chats.service.ts` replaces the content that `git mv` moved.

`apps/host/src/modules/chats/chats.service.ts`:

```ts
import type { ModelSelection, WebSession } from '@deckagent/host-contracts'
import type { WorkspaceChats, WorkspaceLookup } from '../workspaces/index.ts'

export type ChatWorkflowErrorCode = 'SESSION_NOT_FOUND' | 'MODEL_NOT_SELECTABLE' | 'CHAT_UNREADABLE' | 'DRAFT_TOO_LARGE'

type ChatWorkflowErrorDetail = Readonly<Record<string, string | boolean>>

export class ChatWorkflowError extends Error {
  constructor(
    readonly code: ChatWorkflowErrorCode,
    readonly detail?: ChatWorkflowErrorDetail,
  ) {
    super(code)
  }
}

/** One saved chat as the chat store reads it. */
export interface ChatRecord {
  readonly sessionId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly messageCount: number
  readonly workspaceId: string | null
  readonly selection?: ModelSelection
  readonly removedSelection?: ModelSelection
  readonly title: string
  readonly readable: boolean
}

/** The chat part of the session database. `SqliteSessionStore` implements it. */
export interface ChatStore {
  chats(): Promise<readonly ChatRecord[]>
  list(): Promise<readonly { readonly sessionId: string; readonly workspaceId: string | null }[]>
  create(workspaceId: string, selection?: ModelSelection): Promise<{ readonly sessionId: string }>
  select(sessionId: string, selection: ModelSelection): Promise<unknown>
  search(words: string, chatIds: readonly string[]): Promise<readonly string[]>
  ungroup(workspaceId: string): Promise<void>
  readonly requests: { activeFor(sessionId: string): string | undefined }
}

/** The model choice rules of the Browser settings. `WebState` implements it. */
export interface ChatModels {
  lastSelection(): ModelSelection | undefined
  selectable(value: ModelSelection | undefined): boolean
  rememberSelection(value: ModelSelection): void
}

/** Marks that other stores own. */
export interface ChatMarks {
  hasSlides(sessionId: string): boolean
  hasDraft(sessionId: string): boolean
}

export interface ChatOperations {
  create(selection?: ModelSelection): Promise<WebSession>
  selectModel(id: string, selection: ModelSelection): Promise<WebSession>
  list(): Promise<readonly WebSession[]>
  search(words: string): Promise<readonly WebSession[]>
}

export function createWorkspaceChats(store: ChatStore): WorkspaceChats {
  return {
    hasActiveRequest: async workspaceId =>
      (await store.list())
        .filter(chat => chat.workspaceId === workspaceId)
        .some(chat => store.requests.activeFor(chat.sessionId)),
    ungroup: workspaceId => store.ungroup(workspaceId),
  }
}

/** Browser projection of a chat. A chat with no user message yet is shown as a new chat. */
function projectChat(chat: ChatRecord, models: ChatModels, marks: ChatMarks): WebSession {
  return {
    sessionId: chat.sessionId,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messageCount: chat.messageCount,
    workspaceId: chat.workspaceId,
    readable: chat.readable,
    title: chat.title || 'New chat',
    hasSlides: chat.readable && marks.hasSlides(chat.sessionId),
    selectable: models.selectable(chat.selection),
    ...(chat.selection ? { selection: chat.selection } : {}),
    ...(chat.removedSelection ? { removedSelection: chat.removedSelection } : {}),
    hasDraft: marks.hasDraft(chat.sessionId),
  }
}

/** Coordinates chat creation, model selection, listing, search, and Browser projection. */
export function createChatOperations(
  store: ChatStore,
  registry: WorkspaceLookup,
  models: ChatModels,
  marks: ChatMarks,
): ChatOperations {
  const project = (chat: ChatRecord): WebSession => projectChat(chat, models, marks)
  const withActive = (session: WebSession): WebSession => {
    const activeRequestId = store.requests.activeFor(session.sessionId)
    return { ...session, ...(activeRequestId ? { activeRequestId } : {}) }
  }

  const chat = async (id: string): Promise<WebSession> => {
    const found = (await store.chats()).find(item => item.sessionId === id)
    if (!found) throw new ChatWorkflowError('SESSION_NOT_FOUND')
    return project(found)
  }

  return {
    async create(chosen?: ModelSelection): Promise<WebSession> {
      // FR-053: without an explicit choice, the most recent model choice in any chat when still selectable.
      const resolved = chosen === undefined ? models.lastSelection() : chosen
      if (resolved && !models.selectable(resolved)) throw new ChatWorkflowError('MODEL_NOT_SELECTABLE')
      const created = await store.create(registry.selectedId(), resolved)
      return chat(created.sessionId)
    },
    async selectModel(id: string, chosen: ModelSelection): Promise<WebSession> {
      if (!models.selectable(chosen)) throw new ChatWorkflowError('MODEL_NOT_SELECTABLE')
      await store.select(id, chosen)
      models.rememberSelection(chosen)
      return chat(id)
    },
    list: async () => (await store.chats()).map(project).map(withActive),
    async search(words: string): Promise<readonly WebSession[]> {
      const chats = await store.chats()
      const found = new Set(
        await store.search(
          words,
          chats.map(item => item.sessionId),
        ),
      )
      return chats
        .filter(item => found.has(item.sessionId))
        .map(project)
        .map(withActive)
    },
  }
}
```

`apps/host/src/modules/chats/chats.routes.ts`:

```ts
import { HttpError, json, param, params, readJson, route } from '@deckagent/host-api'
import type { ModelSelection } from '@deckagent/host-contracts'
import { Router } from 'express'
import type { ChatOperations } from './chats.service.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function searchWords(value: unknown): string {
  if (!isRecord(value) || Object.keys(value).some(name => name !== 'words')) throw new HttpError(400, 'INVALID_REQUEST')
  const words = value.words
  if (typeof words !== 'string' || words.length > 500) throw new HttpError(400, 'INVALID_REQUEST')
  return words
}

export function createChatRoutes(chats: ChatOperations, decodeSelection: (value: unknown) => ModelSelection): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.get(
    '/api/sessions',
    route(async (_req, res) => {
      json(res, 200, await chats.list())
    }),
  )
  router.post(
    '/api/sessions',
    route(async (req, res) => {
      const value = await readJson(req)
      if (!isRecord(value) || Object.keys(value).some(key => key !== 'selection'))
        throw new HttpError(400, 'INVALID_SESSION')
      const chosen = value.selection === undefined ? undefined : decodeSelection(value.selection)
      json(res, 201, await chats.create(chosen))
    }),
  )
  router.put(
    '/api/sessions/:sessionId/selection',
    params({ sessionId: /^[\w-]{1,100}$/ }),
    route(async (req, res) => {
      json(res, 200, await chats.selectModel(param(req, 'sessionId'), decodeSelection(await readJson(req))))
    }),
  )
  router.post(
    '/api/sessions/search',
    route(async (req, res) => {
      json(res, 200, await chats.search(searchWords(await readJson(req))))
    }),
  )
  return router
}
```

`apps/host/src/modules/chats/chats.errors.ts`:

```ts
import type { HttpFailureResponse } from '@deckagent/host-api'
import { ChatWorkflowError, type ChatWorkflowErrorCode } from './chats.service.ts'

const chatStatus: Readonly<Record<ChatWorkflowErrorCode, number>> = {
  SESSION_NOT_FOUND: 404,
  MODEL_NOT_SELECTABLE: 409,
  CHAT_UNREADABLE: 409,
  DRAFT_TOO_LARGE: 413,
}

export function mapChatFailure(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof ChatWorkflowError)) return undefined
  return { status: chatStatus[error.code], code: error.code, ...(error.detail ? { detail: error.detail } : {}) }
}
```

`apps/host/src/modules/chats/index.ts`:

```ts
export { createChatOperations, createWorkspaceChats } from './chats.service.ts'
export type { ChatMarks, ChatModels, ChatOperations, ChatRecord, ChatStore } from './chats.service.ts'
export { createChatRoutes } from './chats.routes.ts'
export { mapChatFailure } from './chats.errors.ts'
```

- [x] **Step 5: Run the edit script**

Write the script below to `C:/Users/Duy/AppData/Local/Temp/deckagent-task27-edits.mjs`. The script is outside the repository, so it is not part of the commit.

```js
import { readFileSync, writeFileSync } from 'node:fs'

let changed = 0
let failures = 0

function edit(path, pairs) {
  let text = readFileSync(path, 'utf8')
  for (const [before, after] of pairs) {
    const count = text.split(before).length - 1
    if (count !== 1) {
      console.log(`${path} expected 1 match, found ${count}: ${before.slice(0, 60)}`)
      failures += 1
      continue
    }
    text = text.replace(before, () => after)
  }
  writeFileSync(path, text)
  changed += 1
}

edit('packages/host/api/src/transport/management-routes.ts', [
  ["import type { WebSession } from '@deckagent/host-contracts'\n", ''],
  [
    'export function registerManagementRoutes(\n  router: Router,\n  management: WebManagement,\n  withActive: (sessions: readonly WebSession[]) => Promise<readonly WebSession[]>,\n): void {',
    'export function registerManagementRoutes(router: Router, management: WebManagement): void {',
  ],
  [
    "  router.get(\n    '/api/sessions',\n    route(async (_req, res) => {\n      json(res, 200, await withActive(await management.sessions()))\n    }),\n  )\n  router.post(\n    '/api/sessions',\n    route(async (req, res) => {\n      json(res, 201, await management.createSession(await readJson(req)))\n    }),\n  )\n  router.put(\n    '/api/sessions/:sessionId/selection',\n    session,\n    route(async (req, res) => {\n      json(res, 200, await management.selectModel(param(req, 'sessionId'), await readJson(req)))\n    }),\n  )\n",
    '',
  ],
  [
    "  const searchSessions = management.searchSessions?.bind(management)\n  if (searchSessions) {\n    router.post(\n      '/api/sessions/search',\n      route(async (req, res) => {\n        json(res, 200, await withActive(await searchSessions(await readJson(req))))\n      }),\n    )\n  }\n",
    '',
  ],
])

edit('packages/host/api/src/transport/contracts.ts', [
  ['  WebSession,\n', ''],
  [
    '  sessions(): Promise<readonly WebSession[]>\n  /** Creates the chat in the workspace in use. */\n  createSession(value: unknown): Promise<WebSession>\n  selectModel(id: string, value: unknown): Promise<WebSession>\n',
    '',
  ],
  [
    '  /** Earlier chats whose name or conversation holds the words. Body: `{ words }`. */\n  searchSessions?(value: unknown): Promise<readonly WebSession[]>\n',
    '',
  ],
])

edit('packages/host/api/src/index.ts', [
  ["import type { WebSession } from '@deckagent/host-contracts'\n", ''],
  [
    '  const withActive = async (sessions: readonly WebSession[]): Promise<readonly WebSession[]> =>\n    sessions.map(session => {\n      const activeRequestId = controller?.active(session.sessionId)\n      return { ...session, ...(activeRequestId ? { activeRequestId } : {}) }\n    })\n',
    '',
  ],
  [
    '  if (options.management) registerManagementRoutes(router, options.management, withActive)',
    '  if (options.management) registerManagementRoutes(router, options.management)',
  ],
])

edit('apps/host/src/local-transport.ts', [
  [
    "import { ChatWorkflowError } from './features/chats/index.ts'\nimport type { ChatOperations, ChatWorkflowErrorCode } from './features/chats/index.ts'\n",
    '',
  ],
  ["import { WebStateError, record, selection } from './web-state.ts'", "import { WebStateError } from './web-state.ts'"],
  [
    'const chatStatus: Readonly<Record<ChatWorkflowErrorCode, number>> = {\n  SESSION_NOT_FOUND: 404,\n  MODEL_NOT_SELECTABLE: 409,\n  CHAT_UNREADABLE: 409,\n  DRAFT_TOO_LARGE: 413,\n}\n\n',
    '',
  ],
  [
    "function body(value: unknown, key: string): unknown {\n  if (!record(value) || Object.keys(value).some(name => name !== key)) throw new HttpError(400, 'INVALID_REQUEST')\n  return value[key]\n}\n\n",
    '',
  ],
  ['  featureFailure(ChatWorkflowError, error => chatStatus[error.code]),\n', ''],
])

const transportPath = 'apps/host/src/local-transport.ts'
const transport = readFileSync(transportPath, 'utf8')
const start = transport.indexOf('export function chatManagement(')
const end = transport.indexOf('async function toAttachmentHttpError')
if (start < 0 || end < start) {
  console.log(`${transportPath} expected chatManagement before toAttachmentHttpError`)
  failures += 1
} else writeFileSync(transportPath, transport.slice(0, start) + transport.slice(end))

edit('apps/host/src/web-state.ts', [
  [
    "import type { WebPreferences, WebSession } from '@deckagent/host-contracts'\nimport type { ChatSummary, ModelSelection } from '@deckagent/session-persistence'",
    "import type { WebPreferences } from '@deckagent/host-contracts'\nimport type { ModelSelection } from '@deckagent/session-persistence'",
  ],
  [
    "  /** Browser projection of a chat. A chat with no user message yet is shown as a new chat. */\n  project(chat: ChatSummary, hasSlides: boolean): WebSession {\n    return {\n      sessionId: chat.sessionId,\n      createdAt: chat.createdAt,\n      updatedAt: chat.updatedAt,\n      messageCount: chat.messageCount,\n      workspaceId: chat.workspaceId,\n      readable: chat.readable,\n      title: chat.title || 'New chat',\n      hasSlides,\n      selectable: this.selectable(chat.selection),\n      ...(chat.selection ? { selection: chat.selection } : {}),\n      ...(chat.removedSelection ? { removedSelection: chat.removedSelection } : {}),\n    }\n  }\n\n",
    '',
  ],
])

edit('apps/host/src/server.ts', [
  [
    "import { WebState } from './web-state.ts'\nimport { createChatOperations, createWorkspaceChats } from './features/chats/index.ts'\nimport {\n  attachmentManagement,\n  chatManagement,\n  mapApplicationFailure,\n  sessionReadManagement,\n} from './local-transport.ts'",
    "import { WebState, selection } from './web-state.ts'\nimport {\n  createChatOperations,\n  createChatRoutes,\n  createWorkspaceChats,\n  mapChatFailure,\n  type ChatMarks,\n} from './modules/chats/index.ts'\nimport { attachmentManagement, mapApplicationFailure, sessionReadManagement } from './local-transport.ts'",
  ],
  [
    '    mapApplicationFailure: error => mapWorkspaceFailure(error) ?? mapApplicationFailure(error),',
    '    mapApplicationFailure: error => mapWorkspaceFailure(error) ?? mapChatFailure(error) ?? mapApplicationFailure(error),',
  ],
  [
    '    routes: [createWorkspaceRoutes(createWorkspaceOperations(registry, createWorkspaceChats(sessions)))],',
    '    routes: [\n      createWorkspaceRoutes(createWorkspaceOperations(registry, createWorkspaceChats(sessions))),\n      createChatRoutes(createChatOperations(sessions, registry, web, chatMarks(decks, drafts)), selection),\n    ],',
  ],
  ['      ...chatManagement(createChatOperations(sessions, registry, web, decks, drafts)),\n', ''],
  [
    'function createHostOptions(',
    "function chatMarks(decks: DeckStore, drafts: MemoryDraftStore): ChatMarks {\n  return {\n    hasSlides: id => decks.snapshot(id).slides.some(slide => slide.revision > 0),\n    hasDraft: id => drafts.get(id).trim() !== '' || drafts.snapshot(id).attachmentIds.length > 0,\n  }\n}\n\nfunction createHostOptions(",
  ],
])

edit('e2e/model-requests.test.mjs', [
  [
    '  await waitFor(async () => (await client.snapshot(hung.requestId)).text)\n  await app.close()\n',
    "  await waitFor(async () => (await client.snapshot(hung.requestId)).text)\n  const listed = (await call('sessions')).data.find(item => item.sessionId === chat.sessionId)\n  assert.equal(listed.activeRequestId, hung.requestId)\n  await app.close()\n",
  ],
])

console.log(`task27-edits: ${changed} files changed, ${failures} failures`)
```

Run: `node C:/Users/Duy/AppData/Local/Temp/deckagent-task27-edits.mjs`

Expected: PASS. The output is `task27-edits: 7 files changed, 0 failures`, and no line contains `expected 1 match`.

- [x] **Step 6: Build and check**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 lint`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`.

Run: `corepack pnpm@11.28.5 exec biome format apps/host/src/modules/chats apps/host/src/server.ts apps/host/src/local-transport.ts apps/host/src/web-state.ts packages/host/api/src`

Expected: PASS. The output contains `No fixes applied`, and the command exits with code 0.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 47` and `# fail 0`.

Run: `git grep -n "features/chats\|chatManagement\|searchSessions\|management, withActive" -- apps/host/src packages/host/api/src`

Expected: PASS. No line, and the command exits with code 1.

- [x] **Step 7: Run every suite**

Run each command of the table. `test:browser-smoke` has two host timing flakes that earlier reports record: the test `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides` and the test `interactive composer: model choice, Send, live reply and Stop survive a reload; drafts stay per chat`. When one of these two tests is the only failed test, run the suite one more time. When the second run also fails, STOP.

| Suite | Command | Expected |
| --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | `# pass 19`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | `# pass 11`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | `# pass 47`, `# fail 0` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | `# pass 29`, `# fail 0` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | `# pass 11`, `# fail 0` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | `# pass 29`, `# fail 0` |
| test:research | `corepack pnpm@11.28.5 test:research` | `# pass 5`, `# fail 0` |
| test:images | `corepack pnpm@11.28.5 test:images` | `# pass 39`, `# fail 0` |
| test:outline-workflow | `corepack pnpm@11.28.5 test:outline-workflow` | `# pass 6`, `# fail 0` |
| test:brief-foundation | `corepack pnpm@11.28.5 test:brief-foundation` | `# pass 15`, `# fail 0` |
| test:deck-review | `corepack pnpm@11.28.5 test:deck-review` | `# pass 21`, `# fail 0` |
| test:generation-publication | `corepack pnpm@11.28.5 test:generation-publication` | `# pass 72`, `# fail 0` |
| test:slide-pipeline | `corepack pnpm@11.28.5 test:slide-pipeline` | `# pass 7`, `# fail 0` |
| test:session-persistence | `corepack pnpm@11.28.5 test:session-persistence` | `# pass 7`, `# fail 0` |
| test:opencode-resources | `corepack pnpm@11.28.5 test:opencode-resources` | `# pass 3`, `# fail 0` |
| test:layouts | `corepack pnpm@11.28.5 test:layouts` | `# pass 10`, `# fail 0` |
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | `# pass 14`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | `# pass 2`, `# fail 0` |

- [x] **Step 8: Check the changed paths**

Run: `git status --short`

Expected: PASS. The output has these paths in any order, and other paths only in `docs/build/refactor/target-structure/` and `CHANGELOG.md`:

```text
RM apps/host/src/features/chats/index.ts -> apps/host/src/modules/chats/chats.service.ts
 M apps/host/src/local-transport.ts
 M apps/host/src/server.ts
 M apps/host/src/web-state.ts
 M e2e/model-requests.test.mjs
 M packages/host/api/src/index.ts
 M packages/host/api/src/transport/contracts.ts
 M packages/host/api/src/transport/management-routes.ts
?? apps/host/src/modules/chats/chats.errors.ts
?? apps/host/src/modules/chats/chats.routes.ts
?? apps/host/src/modules/chats/index.ts
```

- [x] **Step 9: Write the report file**

1. Mark Steps 1 to 8 as `- [x]` in this file. Change the Task 27 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-27-move-chats-module.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-27-move-chats-module.md` with:
   - The H1 `# Task 27: Move the chats module into apps/host/src/modules report` and the purpose line `Read this file to learn how the code of the chats module moved into apps/host/src/modules/chats/, and the result of each check.`
   - Files changed: the list of files.
   - Commands run, with the exit code and the key output of each command.
   - The suite table of the suite step.
   - What the commands do not prove. Include at least: the chat list has no `version` and the Host sends no `chats` notice yet. Task 28 adds them. Only one test checks a present `activeRequestId` in `GET /api/sessions`, and no test checks it in `POST /api/sessions/search`.
3. Add a row for Task 27 in `docs/build/refactor/target-structure/reports/README.md`.
4. Run `corepack pnpm@11.28.5 check:docs`. Expected: PASS. The output contains `0 error(s)`.
5. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-27-move-chats-module.md`. When `python` is not available, run the same script with `python3` or `python3.12`. Expected: PASS. The output contains `0 violations`.
6. Mark Step 9 as `- [x]`.

- [x] **Step 10: Commit and push**

Do this step only when Steps 1 to 9 passed and no STOP condition occurred.

1. Add this line under `## [Unreleased]` and `### Added` in `CHANGELOG.md`, as the first line of the list:

   ```text
   - Move the chats feature, the four chat routes, the chat projection and the chat error map into `apps/host/src/modules/chats/` with no change of the HTTP contract. `SqliteSessionStore` stays in `packages/session/persistence/`. Task 27 is `Done` in `docs/build/refactor/target-structure/plan/`.
   ```

2. Mark Step 10 as `- [x]` in this file.
3. Run: `git add -A`
4. Run: `git commit -m "refactor: move the chats module into apps/host/src/modules"`

   Expected: PASS. The command exits with code 0. When a hook fails, STOP. Do not run the commit again with `--no-verify`.

5. Run: `git push`

   Expected: PASS. The output contains `refactor -> refactor`. When Git rejects the push, STOP. Do not use `--force`.

6. Run: `git status --short`

   Expected: PASS. No line.

**STOP** and send the report summary with the commit hash. Do not start Task 28 until a person approves the report.
