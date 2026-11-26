# Task 39: Move the research module, credentials and settings routes

Read this file to learn the steps of Task 39, which moves the research module, `credential-store.ts` and the settings routes.

**Type:** Move or rename

After this task, the research module lives in `apps/host/src/modules/research/`. It holds the SQL store for the `research` preference row, the Tavily client, the research coordinator, the three research routes and the research error map. The module imports no code from `@deckagent/session-persistence` or `apps/host/src/http/`. `apps/host/src/credential-store.ts` holds the credential store next to `storage-root.ts` and `web-state.ts`, and `apps/host/src/settings-routes.ts` registers `GET /api/settings`, `GET /api/preferences` and `PUT /api/preferences`. The HTTP contract does not change: each path, status code, error code and JSON body stays the same. This task adds no version and no change notice.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/conventions/project-structure.md` (the section `## Hình dạng module`)
- `apps/host/src/features/research/research-coordinator.ts` and `apps/host/src/integrations/research/tavily.ts`
- `apps/host/src/integrations/credentials/credential-store.ts`
- `apps/host/src/modules/providers/providers.store.ts`, `providers.service.ts` and `providers.routes.ts`
- `packages/host/api/src/transport/management-routes.ts` and `contracts.ts`
- `apps/host/src/local-transport.ts` (the constant `researchStatus`, `featureFailures` and `sessionReadManagement`)
- `apps/host/src/server.ts` (the functions `createRuntimeLayer` and `createHostOptions`)

**Files:**

- Create: `apps/host/src/modules/research/research.store.ts`, `research.service.ts`, `tavily.ts`, `research.routes.ts`, `research.errors.ts`, `index.ts`
- Create: `apps/host/src/credential-store.ts`, `apps/host/src/settings-routes.ts`
- Remove: `apps/host/src/features/research/`, `apps/host/src/integrations/research/`, `apps/host/src/integrations/credentials/` (with all their files)
- Change: `packages/host/api/src/transport/contracts.ts`, `packages/host/api/src/transport/management-routes.ts`
- Change: `apps/host/src/server.ts`, `apps/host/src/local-transport.ts`, `apps/host/src/modules/providers/providers.service.ts`
- Change: `apps/host/src/features/sources/source-tools.ts`, `apps/host/src/features/deck/image-research.ts`, `apps/host/src/features/deck/image-review-run.ts`, `apps/host/src/integrations/images/image-source.ts`
- Change: `apps/host/tests/fixtures/b02-helpers.mjs`, `apps/host/tests/research.test.mjs`, `apps/host/tests/image-research.test.mjs`

**Interfaces:**

- Produces, in `apps/host/src/credential-store.ts`: `CredentialStore`, `CredentialErrorCode`, `CredentialError`, `windowsDataProtection`, `ProtectedFileCredentialStore`, `UnavailableCredentialStore`, `defaultCredentialStore`.
- Produces, in `apps/host/src/settings-routes.ts`:
  - `export interface SettingsRoutesOptions { settings(): Promise<WebSettings>; readonly preferences: { get(): Promise<WebPreferences>; save(value: unknown): Promise<WebPreferences> } }`
  - `export function createSettingsRoutes(options: SettingsRoutesOptions): Router`
- Produces, in `apps/host/src/modules/research/`:
  - `research.store.ts`: `class SqliteResearchStore { constructor(db: DatabaseSync); read(): string | undefined; put(payload: string): void }`
  - `tavily.ts`: `TavilyError`, `TavilyClient`, `ResearchResult`, `ImageSearchCandidate`
  - `research.service.ts`: `ResearchFailure`, `ResearchSourceRecord`, `ResearchSessionStore`, `ResearchSettings`, `ResearchOperations`, `ResearchCoordinator` (the constructor takes `store: SqliteResearchStore`, `credentials: CredentialStore`, `sessions: ResearchSessionStore`, `environmentKey: string | undefined` and `client: Pick<TavilyClient, 'check' | 'search' | 'images'>`, and the class adds `sources(sessionId: string): Promise<readonly ResearchSourceRecord[]>`)
  - `research.routes.ts`: `function createResearchRoutes(research: ResearchOperations): Router`
  - `research.errors.ts`: `function mapResearchFailure(error: unknown): HttpFailureResponse | undefined`
  - `index.ts`: exports `SqliteResearchStore`, `ResearchCoordinator`, `ResearchFailure`, `TavilyClient`, `TavilyError`, `createResearchRoutes`, `mapResearchFailure`, and the types `ImageSearchCandidate`, `ResearchOperations`, `ResearchResult`, `ResearchSessionStore`, `ResearchSettings` and `ResearchSourceRecord`.

**STOP when:** the build reports an error that a change in the tables `Mapping` and `Move rules` does not fix.

**Forbidden:** change the behavior of a route or a method of `ResearchCoordinator`, `TavilyClient`, `WebState` or `ProtectedFileCredentialStore`.

## Mapping

| Old | New |
| --- | --- |
| `apps/host/src/integrations/credentials/credential-store.ts` | `apps/host/src/credential-store.ts` |
| `apps/host/src/integrations/research/tavily.ts` | `apps/host/src/modules/research/tavily.ts` |
| `apps/host/src/features/research/research-coordinator.ts` | `apps/host/src/modules/research/research.service.ts` |
| `researchStatus` and the `ResearchFailure` entry in `local-transport.ts` | `apps/host/src/modules/research/research.errors.ts` |
| `PUT /api/research`, `DELETE /api/research` and `GET /api/sessions/:sessionId/research-sources` in `management-routes.ts` | `apps/host/src/modules/research/research.routes.ts` |
| `GET /api/settings`, `GET /api/preferences` and `PUT /api/preferences` in `management-routes.ts` | `apps/host/src/settings-routes.ts` |
| `WebManagement.research`, `WebManagement.preferences` and `WebManagement.settings` in `contracts.ts` | Removed. `WebManagement` keeps `activities` and `requests` only. |

## Move rules

| Item | Rule |
| --- | --- |
| `research.store.ts` | Own the SQL of `preferences` where `key = 'research'`. `read()` selects `value` and returns `String(row.value)` or `undefined`. `put(payload)` runs `INSERT INTO preferences (key, value) VALUES ('research', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`. |
| `research.service.ts` | Remove imports from `node:sqlite`, `@deckagent/session-persistence` and `../../web-state.ts`. Add a local `record` guard. Import `CredentialStore` from `../../credential-store.ts`, `TavilyError` and `TavilyClient` from `./tavily.ts`, and `SqliteResearchStore` from `./research.store.ts`. Use `this.store.read()` and `this.store.put(...)` for SQL. Add `sources(sessionId)`: throw `new ResearchFailure('SESSION_NOT_FOUND')` when `!(await this.sessions.getInfo(sessionId))`, then return `this.sessions.requests.researchSources(sessionId)`. |
| `research.routes.ts` | Use `Router({ caseSensitive: true, strict: true })` and `WORD_ID = /^[\w-]{1,100}$/`. Register `PUT /api/research` (`200 { ok: true }`), `DELETE /api/research` (`200 { ok: true }`) and `GET /api/sessions/:sessionId/research-sources` (`params({ sessionId: WORD_ID })`, `200`). |
| `research.errors.ts` | Map `ResearchFailure` through `researchStatus` (include `SESSION_NOT_FOUND: 404`, unknown code gives `500`). Return `undefined` for other errors. |
| `settings-routes.ts` | Use `Router({ caseSensitive: true, strict: true })`. Register `GET /api/settings`, `GET /api/preferences` and `PUT /api/preferences` with `json`, `readJson` and `route` from `@deckagent/host-api`. |
| `local-transport.ts` | Remove `ResearchFailure`, `ResearchCoordinator` and `researchStatus`. Change `SessionReadManagement` and `sessionReadManagement(store: SqliteSessionStore)` to keep `activities` and `requests` only. |
| `server.ts` | Import `defaultCredentialStore` and `CredentialStore` from `./credential-store.ts`. Pass `new SqliteResearchStore(web.db)` to `ResearchCoordinator`. Add `createResearchRoutes(runtime.research)` and `createSettingsRoutes({ settings: async () => runtime.settings(), preferences: { get: async () => web.preferences(), save: async value => web.savePreferences(value) } })` after `createAttachmentRoutes(runtime.inputs)` in `routes`. Add `mapResearchFailure(error)` before `mapApplicationFailure(error)`. Pass `management: sessionReadManagement(sessions)`. |
| Callers and tests | Point `providers.service.ts` to `../../credential-store.ts`, `b02-helpers.mjs` to `../../lib/types/credential-store.js`, `source-tools.ts`, `image-research.ts`, `image-review-run.ts` and `image-source.ts` to `../../modules/research/index.ts`, and `research.test.mjs` and `image-research.test.mjs` to `../lib/types/modules/research/index.js`. |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 38 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Move the code**

Do the changes of the tables `Mapping` and `Move rules`. Use `git mv` for `credential-store.ts`, `tavily.ts` and `research-coordinator.ts`. Then remove `apps/host/src/features/research/`, `apps/host/src/integrations/research/` and `apps/host/src/integrations/credentials/`.

- [x] **Step 3: Check that no old path or name stays**

Run: `git grep --untracked -n -E "features/research|integrations/research|integrations/credentials" -- apps/host packages e2e scripts`

Expected: PASS. No line.

Run: `git grep --untracked -n -E "@deckagent/session-persistence|@deckagent/file-tools|node:sqlite" -- apps/host/src/modules/research/research.service.ts apps/host/src/modules/research/research.routes.ts`

Expected: PASS. No line.

Run: `git grep -n -E "ResearchFailure|researchStatus|ResearchCoordinator" -- apps/host/src/local-transport.ts`

Expected: PASS. No line.

- [x] **Step 4: Format, build and check**

Run `rm -rf apps/host/lib packages/host/api/lib` first, so that an old build output does not hide a broken import. Then do the step `Format, build and check` of the Task protocol.

- [x] **Step 5: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 6: Check the changed paths**

Run: `git status --short`

Expected: PASS. Each path starts with `apps/host/`, `packages/host/api/src/`, `docs/build/refactor/target-structure/` or `CHANGELOG.md`.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Moved files` with the columns `Old path | New path | Symbols`.

- What the commands do not prove: no new test checks the route order or the error map order. The existing suites check the HTTP contract.
- `CHANGELOG.md` line: ``- Move the research module into `apps/host/src/modules/research/`, move `credential-store.ts` into `apps/host/src/` and move the settings and preferences routes into `apps/host/src/settings-routes.ts`. Task 39 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `refactor: move the research module, credentials and settings routes`
