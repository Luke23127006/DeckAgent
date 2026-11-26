# Task 44: Move deck and session-read routes and remove WebManagement

Read this file to learn the steps of Task 44, which moves the deck routes into `apps/host/src/modules/deck/`, moves the session-read routes into `apps/host/src/modules/chats/`, and removes `WebManagement`, `BriefManagement`, `deck-routes.ts` and `management-routes.ts`.

**Type:** Move or rename

After this task, `apps/host/src/modules/deck/deck.routes.ts` registers all ten deck, brief, outline, interview and confirmation routes through `DeckOperations` in `deck.service.ts` and `HostRouteContext` from `@deckagent/host-api`. `apps/host/src/modules/chats/chats.routes.ts` registers `GET /api/sessions/:sessionId/activities` and `GET /api/sessions/:sessionId/requests`. `packages/host/api/src/transport/deck-routes.ts`, `management-routes.ts`, `WebManagement`, `BriefManagement` and `sessionReadManagement` in `local-transport.ts` no longer exist. The HTTP contract stays unchanged.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `packages/host/api/src/index.ts`, `transport/contracts.ts`, `transport/deck-routes.ts`, `transport/management-routes.ts`, `transport/session-routes.ts`
- `apps/host/src/modules/chats/chats.service.ts`, `chats.routes.ts`, `index.ts`
- `apps/host/src/modules/deck/index.ts`, `brief-coordinator.ts`, `confirmation-coordinator.ts`
- `apps/host/src/local-transport.ts` and `apps/host/src/server.ts`

**Files:**

- Create: `apps/host/src/modules/deck/deck.service.ts`, `apps/host/src/modules/deck/deck.routes.ts`
- Remove: `packages/host/api/src/transport/deck-routes.ts`, `packages/host/api/src/transport/management-routes.ts`
- Change: `packages/host/api/src/index.ts`, `packages/host/api/src/transport/contracts.ts`, `packages/host/api/src/transport/session-routes.ts`
- Change: `apps/host/src/modules/deck/brief-coordinator.ts`, `apps/host/src/modules/deck/index.ts`
- Change: `apps/host/src/modules/chats/chats.service.ts`, `apps/host/src/modules/chats/chats.routes.ts`
- Change: `apps/host/src/local-transport.ts`, `apps/host/src/server.ts`

**Interfaces:**

- Produces, in `packages/host/api/src/transport/contracts.ts` (exported from `packages/host/api/src/index.ts`):
  - `export interface HostRouteContext { readonly streams: Set<ServerResponse>; readonly submit?: (request: AgentRequest, options: RequestAdmission) => Promise<RequestSnapshot> }`
  - `export type HostRouteRegistrar = Router | ((context: HostRouteContext) => Router)`
  - `HostOptions.routes?: readonly HostRouteRegistrar[]`
- Produces, in `apps/host/src/modules/deck/deck.service.ts`:
  - `export interface DeckOperations { confirm(sessionId: string, value: unknown, submit: (request: AgentRequest, options: RequestAdmission) => Promise<RequestSnapshot>): Promise<ConfirmationResult>; interview(sessionId: string): Promise<{ readonly brief: BriefView; readonly state: InterviewState }>; getBrief(sessionId: string, version?: number): Promise<BriefView>; saveBrief(sessionId: string, value: unknown): Promise<BriefView>; snapshot(sessionId: string): DeckSnapshot; content(sessionId: string, slideId: string, revision: number): SlideContent; subscribe(sessionId: string, listener: (change: DeckChange) => void): () => void; outlineImagePreview(sessionId: string, outlineId: string, needId: string): Uint8Array; outlineSnapshot(sessionId: string): OutlineSnapshot }`
  - `export function createDeckOperations(decks: DeckStore, briefs: BriefCoordinator, confirmations: ConfirmationCoordinator): DeckOperations`
- Produces, in `apps/host/src/modules/deck/deck.routes.ts`:
  - `export function createDeckRoutes(deck: DeckOperations, context: HostRouteContext): Router`
- Changes, in `apps/host/src/modules/chats/chats.service.ts`:
  - `ChatStore` adds `getInfo(sessionId: string): Promise<unknown>`, `requests.activities(sessionId: string): readonly StoredActivity[]` and `requests.list(sessionId: string): readonly StoredRequest[]`.
  - `ChatOperations` adds `activities(id: string): Promise<readonly StoredActivity[]>` and `requests(id: string): Promise<readonly StoredRequest[]>`.
- Produces, in `apps/host/src/modules/deck/index.ts`: also exports `createDeckOperations`, `createDeckRoutes` and the type `DeckOperations`.

**STOP when:** the build reports an error that a change in the table `Move rules` does not fix.

**Forbidden:** import `@deckagent/deck` in `apps/host/src/modules/deck/deck.routes.ts`. Change any route path, parameter class, status code or response body.

## Move rules

| Item | Rule |
| --- | --- |
| `packages/host/api/src/transport/contracts.ts` | Remove the `@deckagent/deck` import, `BriefManagement`, `WebManagement`, and the `HostOptions` fields `confirmations`, `briefs`, `management`, `decks` and `outlines`. Add `HostRouteContext` and `HostRouteRegistrar`, and type `HostOptions.routes` as `readonly HostRouteRegistrar[]`. |
| `packages/host/api/src/index.ts` | Remove `BriefManagement`, `WebManagement` and `registerManagementRoutes`. Export `HostRouteContext` and `HostRouteRegistrar`. In `createHostRoutes`, build `context` with `streams` and optional `submit` (calling `controller.submit`), and mount each entry of `options.routes` as `typeof entry === 'function' ? entry(context) : entry`. |
| `packages/host/api/src/transport/session-routes.ts` | Remove `registerDeckRoutes` and all deck, brief, outline and confirmation routes. Keep only `GET /api/sessions/:sessionId/history` and `projectHistoryMessage`. Remove unused parameters (`controller`, `streams`) from `registerSessionRoutes`. |
| `packages/host/api/src/transport/` | Remove `deck-routes.ts` and `management-routes.ts`. |
| `apps/host/src/modules/chats/chats.service.ts` and `chats.routes.ts` | In `createChatOperations`, add `activities(id)` and `requests(id)`: throw `new ChatWorkflowError('SESSION_NOT_FOUND')` when `!(await store.getInfo(id))`, then return `store.requests.activities(id)` or `store.requests.list(id)`. In `chats.routes.ts`, register `GET /api/sessions/:sessionId/activities` and `GET /api/sessions/:sessionId/requests` with `params({ sessionId: /^[\w-]{1,100}$/ })`. |
| `apps/host/src/modules/deck/brief-coordinator.ts` | Remove `import type { BriefManagement } from '@deckagent/host-api'` and `implements BriefManagement`. |
| `apps/host/src/modules/deck/deck.service.ts` | Import `BriefView`, `ConfirmationResult`, `DeckChange`, `DeckSnapshot`, `InterviewState`, `OutlineSnapshot`, `SlideContent` and `AgentRequest`, `RequestSnapshot` from `@deckagent/host-contracts`, `RequestAdmission` from `@deckagent/host-api`, and `DeckStore` from `@deckagent/deck`. Return `DeckOperations` delegating to `decks`, `briefs` and `confirmations`. |
| `apps/host/src/modules/deck/deck.routes.ts` | Import only from `express`, `@deckagent/host-api` (`json`, `openSseStream`, `param`, `params`, `readJson`, `route`, `HostRouteContext`), `@deckagent/host-contracts` (`DeckChange`) and `./deck.service.ts`. Use `Router({ caseSensitive: true, strict: true })` and `WORD_ID = /^[\w-]{1,100}$/`. Register all ten routes with the exact parameter patterns, headers (`image/png`, `private, no-store`, `nosniff` for outline image preview) and SSE behavior (`event: deck-changed`, `openSseStream(res, context.streams, unsubscribe)`). Mount `POST /api/sessions/:sessionId/deck/confirm` only when `context.submit` exists. |
| `apps/host/src/local-transport.ts` | Remove `HttpError`, `WebManagement`, `SqliteSessionStore`, `SessionReadManagement`, `requireSession` and `sessionReadManagement`. |
| `apps/host/src/server.ts` | Remove `sessionReadManagement`, `confirmations`, `briefs`, `decks`, `outlines` and `management` from `createHostOptions`. Build `deckOps = createDeckOperations(decks, briefs, new ConfirmationCoordinator(decks, sessions, briefs, runtime.generationRuntime))` and add `context => createDeckRoutes(deckOps, context)` after `createSettingsRoutes(...)` in `routes`. |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 43 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Move the routes and remove WebManagement**

Do the changes of the table `Move rules`.

- [ ] **Step 3: Check that no removed symbol or file stays**

Run: `git grep --untracked -n -E "WebManagement|BriefManagement|registerDeckRoutes|registerManagementRoutes|sessionReadManagement" -- apps packages e2e scripts`

Expected: PASS. No line.

Run: `git grep --untracked -n "@deckagent/deck" -- apps/host/src/modules/deck/deck.routes.ts packages/host/api/src/transport`

Expected: PASS. No line.

- [ ] **Step 4: Format, build and check**

Remove `apps/host/lib` and `packages/host/api/lib` first so that an old build output does not hide a broken import. Then do the step `Format, build and check` of the Task protocol.

- [ ] **Step 5: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Moved routes` with the columns `Method | Path | New file`.

- What the commands do not prove: no new test checks route registration order. Existing suites check every route over HTTP.
- `CHANGELOG.md` line: ``- Move all ten deck, brief, outline and confirmation routes into `apps/host/src/modules/deck/deck.routes.ts`, move session activity and request reads into `apps/host/src/modules/chats/`, and remove `WebManagement`, `BriefManagement`, `deck-routes.ts` and `management-routes.ts`. Task 44 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `refactor: move deck and session-read routes and remove WebManagement`
