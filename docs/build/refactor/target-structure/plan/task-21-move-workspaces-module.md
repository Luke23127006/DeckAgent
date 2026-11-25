# Task 21: Move the workspaces module into apps/host/src/modules

Read this file to learn the steps of Task 21, which moves the code of the `workspaces` module into `apps/host/src/modules/workspaces/` with no change of behavior.

Today, the code of the `workspaces` module is in four places:

- The package `packages/workspace/registry/`.
- The folder `apps/host/src/features/workspaces/`.
- The function `registerWorkspaceRoutes` in `packages/host/api/src/transport/management-routes.ts`.
- The error map and the body checks in `apps/host/src/local-transport.ts`.

After this task, all of this code is in `apps/host/src/modules/workspaces/`, and the package `@deckagent/workspace-registry` does not exist. The HTTP contract does not change: each path, status code, error code and JSON body stays the same, and the tests keep their expected values. This task adds no `version`, no change notice and no new test.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/conventions/project-structure.md` (sections `## Hình dạng module` and `## Trong lúc chuyển`)
- `packages/workspace/registry/src/registry.ts` (289 lines)
- `apps/host/src/features/workspaces/index.ts` (65 lines)
- `packages/host/api/src/transport/management-routes.ts` (193 lines)
- `apps/host/src/local-transport.ts` (lines 1-38 and 139-227)

**Files:**

- Move with `git mv` into `apps/host/src/modules/workspaces/`: `packages/workspace/registry/src/contracts.ts`, `folder-policy.ts`, `schema.ts` and `workspace-name.ts` (same names), `packages/workspace/registry/src/registry.ts` (new name `workspaces.store.ts`), `apps/host/src/features/workspaces/index.ts` (new name `workspaces.service.ts`)
- Move with `git mv`: `packages/workspace/registry/tests/workspace-registry.test.mjs` to `apps/host/tests/workspace-registry.test.mjs`
- Delete with `git rm`: `packages/workspace/registry/package.json`, `packages/workspace/registry/tsconfig.json`, `packages/workspace/registry/src/index.ts`. Then delete the folder `packages/workspace/`.
- Change (complete file): `apps/host/src/modules/workspaces/workspaces.service.ts`
- Create: `apps/host/src/modules/workspaces/workspaces.routes.ts`, `apps/host/src/modules/workspaces/workspaces.errors.ts`, `apps/host/src/modules/workspaces/index.ts`
- Change (edit script): `apps/host/tests/workspace-registry.test.mjs`, `packages/host/api/src/transport/management-routes.ts`, `packages/host/api/src/transport/contracts.ts`, `packages/host/api/src/index.ts`, `apps/host/src/local-transport.ts`, `apps/host/src/features/chats/index.ts`, `apps/host/src/features/sources/source-tools.ts`, `apps/host/src/server.ts`, `apps/host/package.json`, `package.json`, `apps/host/tsconfig.json`, `tsconfig.json`, `docs/conventions/project-structure.md`
- Change: `pnpm-lock.yaml` (Step 5 only)
- Change: `CHANGELOG.md`
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-21-move-workspaces-module.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-21-move-workspaces-module.md`

**Interfaces:**

- Uses: `WorkspaceRegistry`, `WorkspaceError`, `FolderPolicy`, `nameFromFolder` and `nameFromUser`. These names keep their code, and only their files move. `SqliteSessionStore.list()`, `SqliteSessionStore.requests.activeFor(sessionId)` and `SqliteSessionStore.ungroup(workspaceId)` from `@deckagent/session-persistence`. `HttpError`, `HttpErrorDetail` and `HttpFailureResponse` from `@deckagent/host-api`.
- Produces:
  - In `apps/host/src/modules/workspaces/index.ts`: `WorkspaceRegistry`, `createWorkspaceOperations(registry: WorkspaceRegistry, chats: WorkspaceChats): WorkspaceOperations`, `interface WorkspaceChats { hasActiveRequest(workspaceId: string): Promise<boolean>; ungroup(workspaceId: string): Promise<void> }`, `createWorkspaceRoutes(workspaces: WorkspaceOperations): Router`, `mapWorkspaceFailure(error: unknown): HttpFailureResponse | undefined` and `type WorkspaceLookup = Pick<WorkspaceRegistry, 'selectedId' | 'get' | 'folders'>`.
  - In `apps/host/src/features/chats/index.ts`: `createWorkspaceChats(sessions: SqliteSessionStore): WorkspaceChats`.
  - In `@deckagent/host-api`: the field `HostOptions.routes?: readonly Router[]`, and the exports `json`, `readJson`, `param`, `params` and `route`. `createHostRoutes` mounts each router of `routes` after the management routes and before the request routes. `WebManagement.workspaces` and the type `WorkspaceManagement` do not exist after this task.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in `Read first` is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit script in Step 5 prints a line that starts with a file name and `expected`.
- A suite in Step 7 fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`. The comments in the code of Step 4 are part of the code.
- Change an expected value in a test. This task changes only the import lines of `apps/host/tests/workspace-registry.test.mjs`.
- Change the code of Step 4. When `build` or `lint` reports an error in it, STOP.
- Change a file in `docs/architecture/`.
- Commit when a STOP condition occurred. Push with `--force`, or skip a hook with `--no-verify`.

## Move rules

The code of Step 4 and the edit script of Step 5 follow these rules. Use them to review the code. Do not change the code.

| Current code | Code after the move |
| --- | --- |
| `registerWorkspaceRoutes` registers six routes on the router of `@deckagent/host-api` when `management.workspaces` is present | `createWorkspaceRoutes` returns a router with the same six routes, methods, paths and parameter class. `server.ts` gives it in `HostOptions.routes`, and `createHostRoutes` mounts it at the place of the old call, after the management routes. |
| `workspaceManagement` checks the JSON body with `body(value, key)` | The private function `field(value, key)` in `workspaces.routes.ts` does the same check. `body` stays in `local-transport.ts`, because `chatManagement` uses it. |
| `mapApplicationFailure` maps `WorkspaceWorkflowError` and `WorkspaceError` first | `mapWorkspaceFailure` maps them. `server.ts` gives `error => mapWorkspaceFailure(error) ?? mapApplicationFailure(error)`, so the order stays the same. |
| The workspaces feature imports `SqliteSessionStore` and reads the chats | The service receives `WorkspaceChats`. `createWorkspaceChats` in the chats feature runs the same `list`, `activeFor` and `ungroup` calls. A module does not import the store of another module. |
| `chats` and `sources` receive the type `WorkspaceRegistry` | They receive `WorkspaceLookup`, which has only the three methods that they call. |
| Tests import `../lib/index.js` of the registry package | `apps/host/tests/workspace-registry.test.mjs` imports the compiled files in `apps/host/lib/types/modules/workspaces/`. |

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" packages/workspace/registry/src/registry.ts apps/host/src/features/workspaces/index.ts packages/host/api/src/transport/management-routes.ts apps/host/src/local-transport.ts`

Expected: PASS. Four lines, in this order: `289`, `65`, `193`, `304`.

Run: `git grep -n "workspace-registry\|workspace/registry\|features/workspaces/" -- apps/host packages package.json tsconfig.json`

Expected: PASS. Fourteen lines: `apps/host/package.json:24`, `apps/host/src/features/chats/index.ts:5`, `apps/host/src/features/sources/source-tools.ts:8`, `apps/host/src/features/workspaces/index.ts:3`, `apps/host/src/local-transport.ts:11`, `apps/host/src/local-transport.ts:22`, `apps/host/src/local-transport.ts:23`, `apps/host/src/server.ts:9`, `apps/host/src/server.ts:15`, `apps/host/tsconfig.json:19`, `package.json:8`, `package.json:60`, `packages/workspace/registry/package.json:2` and `tsconfig.json:14`.

- [ ] **Step 2: Build and record the suite before the move**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 test:local-foundation`

Expected: PASS. The output contains `# pass 43` and `# fail 0`.

- [ ] **Step 3: Move and delete the files**

Run these commands in order, from the repository root:

```text
node -e "require('fs').mkdirSync('apps/host/src/modules/workspaces', { recursive: true })"
git mv packages/workspace/registry/src/contracts.ts apps/host/src/modules/workspaces/contracts.ts
git mv packages/workspace/registry/src/folder-policy.ts apps/host/src/modules/workspaces/folder-policy.ts
git mv packages/workspace/registry/src/schema.ts apps/host/src/modules/workspaces/schema.ts
git mv packages/workspace/registry/src/workspace-name.ts apps/host/src/modules/workspaces/workspace-name.ts
git mv packages/workspace/registry/src/registry.ts apps/host/src/modules/workspaces/workspaces.store.ts
git mv apps/host/src/features/workspaces/index.ts apps/host/src/modules/workspaces/workspaces.service.ts
git mv packages/workspace/registry/tests/workspace-registry.test.mjs apps/host/tests/workspace-registry.test.mjs
git rm -q packages/workspace/registry/package.json packages/workspace/registry/tsconfig.json packages/workspace/registry/src/index.ts
node -e "require('fs').rmSync('packages/workspace', { recursive: true, force: true })"
```

The last command also deletes `packages/workspace/registry/lib/`. Git ignores this build output, so the old compiled files cannot hide a wrong import.

Run: `git status --short`

Expected: PASS. Ten lines: seven lines that start with `R ` (one for each `git mv`) and three lines that start with `D ` (one for each file of `git rm`).

- [ ] **Step 4: Write the new code**

Write each file below with the exact content. `workspaces.service.ts` replaces the content that `git mv` moved.

`apps/host/src/modules/workspaces/workspaces.service.ts`:

```ts
import type { WorkspaceList } from '@deckagent/host-contracts'
import type { WorkspaceRegistry } from './workspaces.store.ts'

type WorkspaceWorkflowErrorCode = 'WORKSPACE_REQUEST_ACTIVE'

export class WorkspaceWorkflowError extends Error {
  constructor(readonly code: WorkspaceWorkflowErrorCode) {
    super(code)
  }
}

export interface WorkspaceChats {
  hasActiveRequest(workspaceId: string): Promise<boolean>
  ungroup(workspaceId: string): Promise<void>
}

export interface WorkspaceOperations {
  list(): Promise<WorkspaceList>
  add(folder: unknown): Promise<WorkspaceList>
  select(id: string): Promise<WorkspaceList>
  rename(id: string, name: unknown): Promise<WorkspaceList>
  relink(id: string, folder: unknown): Promise<WorkspaceList>
  remove(id: string): Promise<WorkspaceList>
}

/** Coordinates workspace registry changes with active-request checks and chat ungrouping. */
export function createWorkspaceOperations(registry: WorkspaceRegistry, chats: WorkspaceChats): WorkspaceOperations {
  const listWorkspaces = async (): Promise<WorkspaceList> => ({
    workspaces: await registry.list(),
    selectedId: registry.selectedId(),
  })

  // UC-013 A5: a workspace with an active request in one of its chats is not removed or moved; no request is stopped.
  const requireNoActiveRequest = async (workspaceId: string): Promise<void> => {
    if (await chats.hasActiveRequest(workspaceId)) throw new WorkspaceWorkflowError('WORKSPACE_REQUEST_ACTIVE')
  }

  return {
    list: () => listWorkspaces(),
    add: async folder => {
      await registry.add(folder)
      return listWorkspaces()
    },
    select: async id => {
      registry.select(id)
      return listWorkspaces()
    },
    rename: async (id, name) => {
      registry.rename(id, name)
      return listWorkspaces()
    },
    relink: async (id, folder) => {
      await requireNoActiveRequest(id)
      await registry.relink(id, folder)
      return listWorkspaces()
    },
    remove: async id => {
      await requireNoActiveRequest(id)
      registry.remove(id)
      await chats.ungroup(id)
      return listWorkspaces()
    },
  }
}
```

`apps/host/src/modules/workspaces/workspaces.routes.ts`:

```ts
import { HttpError, json, param, params, readJson, route } from '@deckagent/host-api'
import { Router } from 'express'
import type { WorkspaceOperations } from './workspaces.service.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function field(value: unknown, key: string): unknown {
  if (!isRecord(value) || Object.keys(value).some(name => name !== key)) throw new HttpError(400, 'INVALID_REQUEST')
  return value[key]
}

export function createWorkspaceRoutes(workspaces: WorkspaceOperations): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.get(
    '/api/workspaces',
    route(async (_req, res) => {
      json(res, 200, await workspaces.list())
    }),
  )
  router.post(
    '/api/workspaces',
    route(async (req, res) => {
      json(res, 200, await workspaces.add(field(await readJson(req), 'folder')))
    }),
  )
  router.put(
    '/api/workspaces/selected',
    route(async (req, res) => {
      const id = field(await readJson(req), 'id')
      if (typeof id !== 'string') throw new HttpError(400, 'INVALID_REQUEST')
      json(res, 200, await workspaces.select(id))
    }),
  )
  const notSelected = params({ workspaceId: /^(?!selected$)[\w-]{1,100}$/ })
  router.put(
    '/api/workspaces/:workspaceId',
    notSelected,
    route(async (req, res) => {
      json(res, 200, await workspaces.rename(param(req, 'workspaceId'), field(await readJson(req), 'name')))
    }),
  )
  router.delete(
    '/api/workspaces/:workspaceId',
    notSelected,
    route(async (req, res) => {
      json(res, 200, await workspaces.remove(param(req, 'workspaceId')))
    }),
  )
  router.put(
    '/api/workspaces/:workspaceId/folder',
    notSelected,
    route(async (req, res) => {
      json(res, 200, await workspaces.relink(param(req, 'workspaceId'), field(await readJson(req), 'folder')))
    }),
  )
  return router
}
```

`apps/host/src/modules/workspaces/workspaces.errors.ts`:

```ts
import type { HttpErrorDetail, HttpFailureResponse } from '@deckagent/host-api'
import { WorkspaceError } from './contracts.ts'
import { WorkspaceWorkflowError } from './workspaces.service.ts'

const workspaceStatus: Readonly<Record<WorkspaceError['code'], number>> = {
  WORKSPACE_NOT_FOUND: 404,
  WORKSPACE_DEFAULT: 409,
  WORKSPACE_FOLDER_REQUIRED: 400,
  WORKSPACE_FOLDER_INVALID: 400,
  WORKSPACE_FOLDER_UNREADABLE: 422,
  WORKSPACE_FOLDER_REFUSED: 422,
  WORKSPACE_FOLDER_IN_USE: 409,
  WORKSPACE_NAME_EMPTY: 400,
  WORKSPACE_NAME_TOO_LONG: 400,
  WORKSPACE_STORAGE: 500,
  WORKSPACE_SCHEMA: 500,
}

/** Safe details only: a workspace name or a refusal reason, never a path. */
function mapWorkspaceError(error: WorkspaceError): HttpFailureResponse {
  const { workspaceName, reason, allowInside } = error.detail
  const detail: HttpErrorDetail = {
    ...(workspaceName === undefined ? {} : { workspaceName }),
    ...(reason === undefined ? {} : { reason }),
    ...(allowInside === undefined ? {} : { allowInside }),
  }
  return {
    status: workspaceStatus[error.code],
    code: error.code,
    ...(Object.keys(detail).length > 0 ? { detail } : {}),
  }
}

export function mapWorkspaceFailure(error: unknown): HttpFailureResponse | undefined {
  if (error instanceof WorkspaceWorkflowError) return { status: 409, code: error.code }
  if (error instanceof WorkspaceError) return mapWorkspaceError(error)
  return undefined
}
```

`apps/host/src/modules/workspaces/index.ts`:

```ts
import type { WorkspaceRegistry } from './workspaces.store.ts'

export { WorkspaceRegistry } from './workspaces.store.ts'
export { createWorkspaceOperations } from './workspaces.service.ts'
export type { WorkspaceChats } from './workspaces.service.ts'
export { createWorkspaceRoutes } from './workspaces.routes.ts'
export { mapWorkspaceFailure } from './workspaces.errors.ts'

export type WorkspaceLookup = Pick<WorkspaceRegistry, 'selectedId' | 'get' | 'folders'>
```

- [ ] **Step 5: Run the edit script and update the lockfile**

Save the script below as `deckagent-workspace-edits.mjs` in the temporary folder of the system (`$env:TEMP` in PowerShell, `$TEMP` in Git Bash), outside the repository. The script reads each file with LF line endings and checks the number of matches of each text. Then it replaces the text and writes the file with its original line endings. A pair with `{ start, end }` deletes the text from `start` up to `end`, and keeps `end`.

```js
import { readFileSync, writeFileSync } from 'node:fs'

const failures = []
let changed = 0
function edit(file, pairs) {
  const original = readFileSync(file, 'utf8')
  const eol = original.includes('\r\n') ? '\r\n' : '\n'
  let text = original.replace(/\r\n/g, '\n')
  for (const [match, to, count] of pairs) {
    const start = typeof match === 'string' ? -1 : text.indexOf(match.start)
    const end = typeof match === 'string' ? -1 : text.indexOf(match.end)
    const from = typeof match === 'string' ? match : start >= 0 && end > start ? text.slice(start, end) : `${match.start}...`
    const found = text.split(from).length - 1
    if (found !== count) {
      failures.push(`${file}: expected ${count} of ${JSON.stringify(from.slice(0, 60))}, found ${found}`)
      continue
    }
    text = text.split(from).join(to)
  }
  writeFileSync(file, eol === '\n' ? text : text.replace(/\n/g, eol))
  changed += 1
}

edit('apps/host/tests/workspace-registry.test.mjs', [
  [
    "import {\n  FolderPolicy,\n  nameFromFolder,\n  nameFromUser,\n  WorkspaceRegistry,\n} from '../lib/index.js'\n",
    "import { FolderPolicy } from '../lib/types/modules/workspaces/folder-policy.js'\nimport { nameFromFolder, nameFromUser } from '../lib/types/modules/workspaces/workspace-name.js'\nimport { WorkspaceRegistry } from '../lib/types/modules/workspaces/workspaces.store.js'\n",
    1,
  ],
])

edit('packages/host/api/src/transport/management-routes.ts', [
  [
    "import type { WebManagement, WorkspaceManagement } from './contracts.ts'\n",
    "import type { WebManagement } from './contracts.ts'\n",
    1,
  ],
  [{ start: 'function registerWorkspaceRoutes(', end: 'function registerSettingsAndProviderRoutes(' }, '', 1],
  ['  if (management.workspaces) registerWorkspaceRoutes(router, management.workspaces)\n', '', 1],
])

edit('packages/host/api/src/transport/contracts.ts', [
  ['  WebSettings,\n  WorkspaceList,\n} from', '  WebSettings,\n} from', 1],
  [
    "import type { RequestStore } from '@deckagent/session-persistence'\n",
    "import type { RequestStore } from '@deckagent/session-persistence'\nimport type { Router } from 'express'\n",
    1,
  ],
  [
    '  readonly management?: WebManagement\n',
    '  readonly management?: WebManagement\n  readonly routes?: readonly Router[]\n',
    1,
  ],
  [
    '  /** Optional: an application without workspaces has no `/api/workspaces` routes. */\n  readonly workspaces?: WorkspaceManagement\n',
    '',
    1,
  ],
  [
    "\n/** Workspace operations. Every input is untrusted JSON; the application validates it. */\nexport interface WorkspaceManagement {\n  list(): Promise<WorkspaceList>\n  /** Body: `{ folder }`. Sets up a workspace, or finds the one of that folder, and makes it the workspace in use. */\n  add(value: unknown): Promise<WorkspaceList>\n  /** Body: `{ id }`. */\n  select(value: unknown): Promise<WorkspaceList>\n  /** Body: `{ name }`. */\n  rename(id: string, value: unknown): Promise<WorkspaceList>\n  /** Body: `{ folder }`. */\n  relink(id: string, value: unknown): Promise<WorkspaceList>\n  remove(id: string): Promise<WorkspaceList>\n}\n",
    '',
    1,
  ],
])

edit('packages/host/api/src/index.ts', [
  ['  WebManagement,\n  WorkspaceManagement,\n} from', '  WebManagement,\n} from', 1],
  [
    "export { HttpError } from './transport/http-error.ts'\n",
    "export { HttpError } from './transport/http-error.ts'\nexport { json, readJson } from './transport/http-io.ts'\nexport { param, params, route } from './transport/route-params.ts'\n",
    1,
  ],
  [
    '  if (options.management) registerManagementRoutes(router, options.management, withActive)\n',
    '  if (options.management) registerManagementRoutes(router, options.management, withActive)\n  for (const routes of options.routes ?? []) router.use(routes)\n',
    1,
  ],
])

edit('apps/host/src/local-transport.ts', [
  [
    'import type {\n  AttachmentManagement,\n  HttpErrorDetail,\n  HttpFailureResponse,\n  WebManagement,\n  WorkspaceManagement,\n} from',
    'import type { AttachmentManagement, HttpErrorDetail, HttpFailureResponse, WebManagement } from',
    1,
  ],
  ["import { WorkspaceError } from '@deckagent/workspace-registry'\n", '', 1],
  [
    "import { WorkspaceWorkflowError } from './features/workspaces/index.ts'\nimport type { WorkspaceOperations } from './features/workspaces/index.ts'\n",
    '',
    1,
  ],
  [
    "const workspaceStatus: Readonly<Record<WorkspaceError['code'], number>> = {\n  WORKSPACE_NOT_FOUND: 404,\n  WORKSPACE_DEFAULT: 409,\n  WORKSPACE_FOLDER_REQUIRED: 400,\n  WORKSPACE_FOLDER_INVALID: 400,\n  WORKSPACE_FOLDER_UNREADABLE: 422,\n  WORKSPACE_FOLDER_REFUSED: 422,\n  WORKSPACE_FOLDER_IN_USE: 409,\n  WORKSPACE_NAME_EMPTY: 400,\n  WORKSPACE_NAME_TOO_LONG: 400,\n  WORKSPACE_STORAGE: 500,\n  WORKSPACE_SCHEMA: 500,\n}\n\n",
    '',
    1,
  ],
  [
    "/** Safe details only: a workspace name or a refusal reason, never a path. */\nfunction mapWorkspaceError(error: WorkspaceError): HttpFailureResponse {\n  const { workspaceName, reason, allowInside } = error.detail\n  const detail: HttpErrorDetail = {\n    ...(workspaceName === undefined ? {} : { workspaceName }),\n    ...(reason === undefined ? {} : { reason }),\n    ...(allowInside === undefined ? {} : { allowInside }),\n  }\n  return mapFailureEntry(error.code, Object.keys(detail).length > 0 ? detail : undefined, workspaceStatus[error.code])\n}\n\n",
    '',
    1,
  ],
  [
    '  if (error instanceof WorkspaceWorkflowError) return { status: 409, code: error.code }\n  if (error instanceof WorkspaceError) return mapWorkspaceError(error)\n',
    '',
    1,
  ],
  [
    "export function workspaceManagement(operations: WorkspaceOperations): WorkspaceManagement {\n  return {\n    list: () => operations.list(),\n    add: value => operations.add(body(value, 'folder')),\n    select: value => {\n      const id = body(value, 'id')\n      if (typeof id !== 'string') throw new HttpError(400, 'INVALID_REQUEST')\n      return operations.select(id)\n    },\n    rename: (id, value) => operations.rename(id, body(value, 'name')),\n    relink: (id, value) => operations.relink(id, body(value, 'folder')),\n    remove: id => operations.remove(id),\n  }\n}\n\n",
    '',
    1,
  ],
])

edit('apps/host/src/features/chats/index.ts', [
  [
    "import type { WorkspaceRegistry } from '@deckagent/workspace-registry'\n",
    "import type { WorkspaceChats, WorkspaceLookup } from '../../modules/workspaces/index.ts'\n",
    1,
  ],
  ['  registry: WorkspaceRegistry,\n', '  registry: WorkspaceLookup,\n', 1],
  [
    '/** Coordinates chat creation, model selection, listing, search, and Browser projection. */\n',
    'export function createWorkspaceChats(sessions: SqliteSessionStore): WorkspaceChats {\n  return {\n    hasActiveRequest: async workspaceId =>\n      (await sessions.list())\n        .filter(chat => chat.workspaceId === workspaceId)\n        .some(chat => sessions.requests.activeFor(chat.sessionId)),\n    ungroup: workspaceId => sessions.ungroup(workspaceId),\n  }\n}\n\n/** Coordinates chat creation, model selection, listing, search, and Browser projection. */\n',
    1,
  ],
])

edit('apps/host/src/features/sources/source-tools.ts', [
  [
    "import type { WorkspaceRegistry } from '@deckagent/workspace-registry'\n",
    "import type { WorkspaceLookup } from '../../modules/workspaces/index.ts'\n",
    1,
  ],
  ['  readonly registry: WorkspaceRegistry\n', '  readonly registry: WorkspaceLookup\n', 1],
])

edit('apps/host/src/server.ts', [
  [
    "import { WorkspaceRegistry } from '@deckagent/workspace-registry'\n",
    "import {\n  WorkspaceRegistry,\n  createWorkspaceOperations,\n  createWorkspaceRoutes,\n  mapWorkspaceFailure,\n} from './modules/workspaces/index.ts'\n",
    1,
  ],
  [
    "import { createChatOperations } from './features/chats/index.ts'\nimport { createWorkspaceOperations } from './features/workspaces/index.ts'\n",
    "import { createChatOperations, createWorkspaceChats } from './features/chats/index.ts'\n",
    1,
  ],
  ['  sessionReadManagement,\n  workspaceManagement,\n} from', '  sessionReadManagement,\n} from', 1],
  [
    '    mapApplicationFailure,\n    failureMessage: deckFailureMessage,\n',
    '    mapApplicationFailure: error => mapWorkspaceFailure(error) ?? mapApplicationFailure(error),\n    failureMessage: deckFailureMessage,\n',
    1,
  ],
  ['      workspaces: workspaceManagement(createWorkspaceOperations(registry, sessions)),\n', '', 1],
  [
    '    readHistory: id => sessions.read(id),\n',
    '    readHistory: id => sessions.read(id),\n    routes: [createWorkspaceRoutes(createWorkspaceOperations(registry, createWorkspaceChats(sessions)))],\n',
    1,
  ],
])

edit('apps/host/package.json', [['    "@deckagent/workspace-registry": "workspace:*",\n', '', 1]])
edit('package.json', [
  ['    "@deckagent/workspace-registry": "workspace:*",\n', '', 1],
  [
    'node --test packages/workspace/registry/tests/workspace-registry.test.mjs ',
    'node --test apps/host/tests/workspace-registry.test.mjs ',
    1,
  ],
])
edit('apps/host/tsconfig.json', [['    { "path": "../../packages/workspace/registry" },\n', '', 1]])
edit('tsconfig.json', [['    {\n      "path": "packages/workspace/registry"\n    },\n', '', 1]])
edit('docs/conventions/project-structure.md', [
  ['| `packages/workspace/registry/` | `apps/host/src/modules/workspaces/` |\n', '', 1],
])

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(`workspace-edits: ${changed} files changed, 0 failures`)
```

Run from the repository root: `node <temporary folder>/deckagent-workspace-edits.mjs`

Expected: PASS. The output is `workspace-edits: 13 files changed, 0 failures`.

Run: `corepack pnpm@11.28.5 install --offline`

Expected: PASS. The command exits with code 0, and the output contains `- @deckagent/workspace-registry`.

Run: `git diff --stat pnpm-lock.yaml`

Expected: PASS. The output contains `8 deletions(-)` and no `insertion`.

- [ ] **Step 6: Build and run the checks**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 lint`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`.

Run: `corepack pnpm@11.28.5 exec biome format apps/host/src/modules apps/host/src/local-transport.ts apps/host/src/server.ts apps/host/src/features/chats apps/host/src/features/sources packages/host/api/src apps/host/tests/workspace-registry.test.mjs`

Expected: PASS. The output contains `No fixes applied` and does not contain `format ━`.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 39` and `# fail 0`.

Run: `git grep -n "workspace-registry\|workspace/registry\|features/workspaces/" -- apps/host packages package.json tsconfig.json`

Expected: PASS. The command prints no line and exits with code 1.

Run: `git grep -n "registerWorkspaceRoutes\|WorkspaceManagement\|workspaceManagement" -- apps packages e2e tests`

Expected: PASS. The command prints no line and exits with code 1.

Run: `corepack pnpm@11.28.5 check:docs`

Expected: PASS. The output contains `0 error(s)`.

- [ ] **Step 7: Run the non-live suites**

Run each command below in order. For each command, write the exit code and the `# pass` and `# fail` lines in the report. When a command fails, run it one more time. When it fails two times, STOP.

| Suite | Command | Expected |
| --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | `# pass 14`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | `# pass 8`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | `# pass 43`, `# fail 0` |
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
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | `# pass 13`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | `# pass 2`, `# fail 0` |

- [ ] **Step 8: Check the changed paths**

Run: `git status --short`

Expected: PASS. The output has these lines in any order, and other lines only for files in `docs/build/refactor/target-structure/` and for `CHANGELOG.md`:

```text
 M apps/host/package.json
 M apps/host/src/features/chats/index.ts
 M apps/host/src/features/sources/source-tools.ts
 M apps/host/src/local-transport.ts
R  packages/workspace/registry/src/contracts.ts -> apps/host/src/modules/workspaces/contracts.ts
R  packages/workspace/registry/src/folder-policy.ts -> apps/host/src/modules/workspaces/folder-policy.ts
?? apps/host/src/modules/workspaces/index.ts
R  packages/workspace/registry/src/schema.ts -> apps/host/src/modules/workspaces/schema.ts
R  packages/workspace/registry/src/workspace-name.ts -> apps/host/src/modules/workspaces/workspace-name.ts
?? apps/host/src/modules/workspaces/workspaces.errors.ts
?? apps/host/src/modules/workspaces/workspaces.routes.ts
R  apps/host/src/features/workspaces/index.ts -> apps/host/src/modules/workspaces/workspaces.service.ts
R  packages/workspace/registry/src/registry.ts -> apps/host/src/modules/workspaces/workspaces.store.ts
 M apps/host/src/server.ts
R  packages/workspace/registry/tests/workspace-registry.test.mjs -> apps/host/tests/workspace-registry.test.mjs
 M apps/host/tsconfig.json
 M docs/conventions/project-structure.md
 M package.json
 M packages/host/api/src/index.ts
 M packages/host/api/src/transport/contracts.ts
 M packages/host/api/src/transport/management-routes.ts
D  packages/workspace/registry/package.json
D  packages/workspace/registry/src/index.ts
D  packages/workspace/registry/tsconfig.json
 M pnpm-lock.yaml
 M tsconfig.json
```

Git can show ` M` in place of `M `, `RM` in place of `R `, and `A ` or `??` for a new file. Only the path matters.

- [ ] **Step 9: Write the report file**

1. Mark Steps 1 to 8 as `- [x]` in this file. Change the Task 21 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-21-move-workspaces-module.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-21-move-workspaces-module.md` with:
   - H1 `# Task 21: Move the workspaces module into apps/host/src/modules report` and the purpose line `Read this file to learn where the code of the workspaces module is after the move, and the result of each check after the move.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command. Write each command that you ran in another form, for example in PowerShell.
   - The suite table from Step 7.
   - What the commands do not prove: the tests call the six workspace routes and the registry methods. They do not prove that the route order is the same for a path that no test calls. `scripts/scan-module-design.mjs` still names `packages/workspace/registry/` in its area list. This task does not change that tool.
3. Add a row for Task 21 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 20 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run the STE linter from Global Constraints on the report file. Expected: the output contains `0 violations`.
5. Mark Step 9 as `- [x]`.

- [ ] **Step 10: Commit and push**

Do this step only when Steps 1 to 9 passed and no STOP condition occurred.

1. Add this line under `## [Unreleased]` and `### Changed` in `CHANGELOG.md`. When `### Changed` is not under `## [Unreleased]`, add the heading `### Changed` after the last bullet of `### Added`.

   ```text
   - Move the `workspaces` module into `apps/host/src/modules/workspaces/` (store, service, routes and error map) and remove the package `@deckagent/workspace-registry`. The HTTP contract does not change. Task 21 is `Done` in `docs/build/refactor/target-structure/plan/`.
   ```

2. Mark Step 10 as `- [x]` in this file.
3. Run: `git add -A`
4. Run: `git commit -m "refactor: move the workspaces module into apps/host/src/modules"`

   Expected: PASS. The command exits with code 0. When a hook fails, STOP. Do not run the commit again with `--no-verify`.

5. Run: `git push`

   Expected: PASS. The output contains `refactor -> refactor`. When Git rejects the push, STOP. Do not use `--force`.

6. Run: `git status --short`

   Expected: PASS. No line.

**STOP** and send the report summary with the commit hash. Do not start Task 22 until a person approves the report.
