# Task 31: Move the providers module into apps/host/src/modules

Read this file to learn the steps of Task 31, which moves the provider code into `apps/host/src/modules/providers/` and keeps the SQL apart from the rules.

**Type:** Move or rename

After this task, the provider code is in `apps/host/src/modules/providers/`. The class `ProviderStore` becomes two classes: `SqliteProviderStore` runs the SQL of the table `providers`, and `ProviderConfigurations` keeps the rules, the in-memory maps and the calls to the credential store. The HTTP contract does not change: each path, status code, error code and JSON body stays the same. This task adds no `version`. `apps/host/src/integrations/credentials/` does not move.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/conventions/project-structure.md` (the section `## Hình dạng module`)
- `apps/host/src/features/providers/provider-settings.ts`
- `apps/host/src/integrations/providers/provider-catalog.ts`
- `apps/host/src/modules/chats/chats.routes.ts` and `apps/host/src/modules/chats/chats.errors.ts`
- `packages/host/api/src/transport/management-routes.ts` (the function `registerSettingsAndProviderRoutes`)
- `packages/host/api/src/transport/contracts.ts` (the interface `WebManagement`)
- `apps/host/src/local-transport.ts` (the constant `providerStatus` and the constant `featureFailures`)
- `apps/host/src/server.ts` (the function `createRuntimeLayer` and the object with `routes:` and `management:`)

**Files:**

- Create: `apps/host/src/modules/providers/providers.store.ts`, `providers.service.ts`, `providers.routes.ts`, `providers.errors.ts`, `provider-catalog.ts`, `built-in-providers.ts`, `index.ts`
- Delete: `apps/host/src/features/providers/` and `apps/host/src/integrations/providers/`, with all their files
- Change: `apps/host/src/server.ts`, `apps/host/src/local-transport.ts`, `packages/host/api/src/transport/management-routes.ts`, `packages/host/api/src/transport/contracts.ts`
- Change: each other file that imports an old path or an old name of the table `Mapping`

**Interfaces:**

- Produces, in `apps/host/src/modules/providers/`:
  - `interface ProviderRow { readonly id: string; readonly payload: string }`
  - `class SqliteProviderStore { constructor(db: DatabaseSync); rows(): readonly ProviderRow[]; put(row: ProviderRow): void }`
  - `class ProviderConfigurations { constructor(store: SqliteProviderStore, credentials: CredentialStore, options?: ProviderConfigurationsOptions) }` with the members of `ProviderStore`, with the same signatures: `load`, `providerSettings`, `persistentKeys`, `builtIns`, `selectable`, `runSettings`, `save`, `remove`, `catalog` and `close`.
  - `type ProviderOperations = Pick<ProviderConfigurations, 'save' | 'remove' | 'catalog'>`
  - `function createProviderRoutes(providers: ProviderOperations): Router`
  - `function mapProviderFailure(error: unknown): HttpFailureResponse | undefined`
- `index.ts` exports: `ProviderConfigurations`, `SqliteProviderStore`, `ProviderFailure`, `protocols`, `validBaseUrl`, `listModels`, `createProviderRoutes`, `mapProviderFailure`, and the types `ProviderConfigurationsOptions`, `ProviderConnection`, `ProviderEndpoint`, `ProviderRunSettings` and `ProviderOperations`.

**STOP when:** the build reports an error that a change of an import path or a name of the table `Mapping` does not fix.

**Forbidden:** change the body of a member of `ProviderConfigurations`, except the SQL calls of the table `Move rules`. Move a file of `apps/host/src/integrations/credentials/`.

## Mapping

| Old | New |
| --- | --- |
| `apps/host/src/features/providers/provider-settings.ts`, without its SQL | `apps/host/src/modules/providers/providers.service.ts` |
| The `SELECT` and the `INSERT ... ON CONFLICT` statements of `ProviderStore` | `apps/host/src/modules/providers/providers.store.ts` |
| Class `ProviderStore` | Class `ProviderConfigurations` |
| Type `ProviderStoreOptions` | Type `ProviderConfigurationsOptions`, with the same members |
| `apps/host/src/features/providers/built-in-providers.ts` | `apps/host/src/modules/providers/built-in-providers.ts` |
| `apps/host/src/integrations/providers/provider-catalog.ts` | `apps/host/src/modules/providers/provider-catalog.ts` |
| `apps/host/src/features/providers/index.ts`, `apps/host/src/integrations/providers/index.ts` | `apps/host/src/modules/providers/index.ts` |
| The constant `providerStatus` and the `ProviderFailure` entry of `featureFailures` in `local-transport.ts` | `apps/host/src/modules/providers/providers.errors.ts` |
| The three routes `/api/providers/...` of `registerSettingsAndProviderRoutes` | `apps/host/src/modules/providers/providers.routes.ts` |
| `saveProvider`, `deleteProvider` and `catalog` of `WebManagement` and of the `management` object in `server.ts` | Deleted. `server.ts` gives `createProviderRoutes(runtime.providers)` in `routes` |

## Move rules

| Item | Rule |
| --- | --- |
| `ProviderConfigurations.load` | Reads the rows with `this.store.rows()`. The rewrite of an older row calls `this.store.put({ id, payload })` with the payload of the private method `write`. |
| `ProviderConfigurations.save` | The private method `write` calls `this.store.put({ id, payload: JSON.stringify(payload) })`. A bootstrap provider writes no row, as now. |
| `ProviderConfigurations.remove` | Calls `this.store.put({ id, payload: JSON.stringify({ deleted: true }) })`. |
| `providers.store.ts` | Has the two SQL statements and no rule. It imports `DatabaseSync` as a type from `node:sqlite`. |
| `providers.service.ts` | Does not import `node:sqlite` or Express. |
| `providers.routes.ts` | Uses `Router({ caseSensitive: true, strict: true })`, `params({ providerId: /^[\w.-]{1,100}$/ })` and `json`, `readJson`, `param`, `params`, `route` from `@deckagent/host-api`. The replies are `{ saved: true }` for `PUT` and `DELETE`, and the model list for the catalog. |
| `mapProviderFailure` | Returns `undefined` for an error that is not a `ProviderFailure`. Otherwise it returns `{ status, code, ...(detail ? { detail } : {}) }`. `status` comes from `providerStatus`, and an unknown code gives `500`. |
| Error map order in `server.ts` | `mapWorkspaceFailure(error) ?? mapChatFailure(error) ?? mapProviderFailure(error) ?? mapApplicationFailure(error)` |
| Router order in `server.ts` | `createProviderRoutes(runtime.providers)` comes after `createChatRoutes(...)` in `routes`. |
| The OpenCode files, `cli.ts` and `features/requests/prepare-runtime.ts` | Import from `apps/host/src/modules/providers/index.ts` with a relative path. |
| A comment that names an old path or an old name | Write the new path or the new name. |
| Another comment | Keep it. |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 30 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [x] **Step 2: Move the code**

Do the changes of the tables `Mapping` and `Move rules`. Use `git mv` for `built-in-providers.ts` and `provider-catalog.ts`. Then delete the folders `apps/host/src/features/providers/` and `apps/host/src/integrations/providers/`.

- [x] **Step 3: Check that no old path or name stays**

Run: `git grep --untracked -n -E "features/providers|integrations/providers|saveProvider|deleteProvider" -- apps/host packages e2e tests scripts`

Expected: PASS. No line.

Run: `git grep --untracked -n -w -E "ProviderStore|ProviderStoreOptions" -- apps packages e2e tests scripts`

Expected: PASS. No line.

Run: `git grep -n -E "ProviderFailure|providerStatus" -- apps/host/src/local-transport.ts`

Expected: PASS. No line.

Run: `git grep --untracked -n -E "node:sqlite|express" -- apps/host/src/modules/providers/providers.service.ts`

Expected: PASS. No line.

Run: `git grep --untracked -l "modules/providers/index.ts" -- apps/host/src/integrations/opencode`

Expected: PASS. Four lines: `config.ts`, `contracts.ts`, `provider.ts` and `runtime.ts` in `apps/host/src/integrations/opencode/`.

- [x] **Step 4: Format, build and check**

Run `rm -rf apps/host/lib` first, so that an old build output does not hide a broken import. Then do the step `Format, build and check` of the Task protocol.

- [x] **Step 5: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [x] **Step 6: Check the changed paths**

Run: `git status --short`

Expected: PASS. Each path starts with `apps/host/src/`, `packages/host/api/src/`, `docs/build/refactor/target-structure/` or `CHANGELOG.md`.

- [x] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Moved files` with the columns `Old path | New path | Symbols`.

- What the commands do not prove: no new test checks the route order or the error map order. The existing suites check the HTTP contract.
- `CHANGELOG.md` line: ``- Move the providers module into `apps/host/src/modules/providers/`: `SqliteProviderStore` runs the SQL of `providers`, `ProviderConfigurations` keeps the rules, and the provider routes and error map leave `@deckagent/host-api` and `local-transport.ts`. Task 31 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `refactor: move the providers module into apps/host/src/modules`
