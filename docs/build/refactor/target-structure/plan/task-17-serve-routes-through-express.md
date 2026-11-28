# Task 17: Serve every route through Express

Read this file to learn the steps of Task 17, which replaces the regular expression routing of the Local Host with Express 5.2.1.

After this task, `apps/host/src/http/` holds the Express app, the shared checks, the error handler and `startHost`. The route files in `packages/host/api/src/transport/` become Express router registrars. The registrars keep each method, path parameter class, status and route order of the current code. The HTTP contract does not change: the tests keep their expected values. This task does not split the routes into modules, and it does not use `multer` or `helmet`.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/conventions/testware.md`
- `packages/host/api/src/index.ts` (147 lines)
- `packages/host/api/src/transport/session-routes.ts` (158 lines), `management-routes.ts` (147 lines), `request-routes.ts` (105 lines), `deck-routes.ts` (37 lines), `error-response.ts` (48 lines)
- `apps/host/src/server.ts` (lines 1-12)

**Files:**

- Change: `packages/host/api/package.json`, `apps/host/package.json`, `pnpm-lock.yaml` (Step 2 only)
- Create: `packages/host/api/src/transport/route-params.ts`
- Change (complete file): `packages/host/api/src/index.ts`, `packages/host/api/src/transport/deck-routes.ts`, `packages/host/api/src/transport/session-routes.ts`, `packages/host/api/src/transport/management-routes.ts`, `packages/host/api/src/transport/request-routes.ts`
- Delete: `packages/host/api/src/transport/error-response.ts`
- Create: `apps/host/src/http/app.ts`, `apps/host/src/http/error-handler.ts`, `apps/host/src/http/start-host.ts`, `apps/host/tests/fixtures/http-host.mjs`
- Move with `git mv`: `packages/host/api/tests/host-api.test.mjs` to `apps/host/tests/http-server.test.mjs`
- Change (one import each): `apps/host/src/server.ts`, `apps/host/tests/http-server.test.mjs`, `apps/web/tests/browser-runtime.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/request-lifecycle.test.mjs`, `e2e/attachment-storage.test.mjs`
- Change: `package.json` (script `test:tools-browser`), `AGENTS.md` (section `## Tech Stack`), `docs/conventions/project-structure.md` (mapping table of `## Trong lúc chuyển`)
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-17-serve-routes-through-express.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-17-serve-routes-through-express.md`

**Interfaces:**

- Uses: `HostOptions`, `HttpError`, `RequestFailure` and `HttpFailureResponse` from `@deckagent/host-api`. `RequestController` in `packages/host/api/src/lifecycle/request-controller.ts`. The helpers `json`, `readJson`, `readAgentRequest` and `parseCursor` in `packages/host/api/src/transport/http-io.ts`, `openSseStream` in `sse.ts` and `receiveAttachment` in `multipart.ts`. These helpers do not change.
- Produces:
  - `createHostRoutes(options: HostOptions): HostRoutes` and `interface HostRoutes { readonly router: Router; readonly streams: Set<ServerResponse>; close(): Promise<void> }`, exported by `@deckagent/host-api`. `startHost` is no longer an export of `@deckagent/host-api`.
  - `registerSessionRoutes`, `registerDeckRoutes`, `registerManagementRoutes` and `registerRequestRoutes` in `packages/host/api/src/transport/`.
  - `WORD_ID`, `params(patterns)`, `param(req, name)` and `route(handler)` in `packages/host/api/src/transport/route-params.ts`.
  - `startHost(options: HostOptions): Promise<{ origin: string; token: string; close(): Promise<void> }>` in `apps/host/src/http/start-host.ts`. `createHttpApp(config: HttpAppConfig): Express` in `apps/host/src/http/app.ts`. `writeRouteError(res, error, options)` in `apps/host/src/http/error-handler.ts`.
  - The test fixture `apps/host/tests/fixtures/http-host.mjs`, which exports `startHost` for tests outside `apps/host/`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in `Read first` is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit script in Step 5 prints a line that starts with a file name and `expected`.
- A suite in Step 7 fails, and the report of Task 12 shows `PASS` for the suite.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`. The comments in the code of Step 3 are part of the code.
- Commit or push.
- Change an expected value in a test. This task changes only the import of `startHost` in tests.
- Change the code of Step 3. When `build` or `lint` reports an error in it, STOP.
- Install a package other than the two packages of Step 2, or use `express.json()`, `multer` or `helmet`.

## Route rules

The code of Step 3 follows these rules. Use them to review the code. Do not change the code.

| Current behavior | Express code |
| --- | --- |
| A path parameter has a character class, for example `[\w-]{1,100}` | The middleware `params({ name: /^...$/ })` before the handler. A value outside the class calls `next('route')`, so the request goes on to the next route or to `404 NOT_FOUND`. Express 5.2.1 rejects a regular expression in a route path (Task 16, E11). |
| A route exists only when an optional object of `HostOptions` or `WebManagement` is present | The registrar registers the route only when the object is present. |
| `/api/workspaces/selected` is not a workspace ID | The pattern `/^(?!selected$)[\w-]{1,100}$/`. |
| No `HEAD` or `OPTIONS` route, exact letter case, no trailing slash, no `X-Powered-By`, no `ETag` | `app.disable('x-powered-by')`, `app.set('etag', false)`, `case sensitive routing`, `strict routing` (Task 16, C1 to C4). The first middleware answers `HEAD` and `OPTIONS` on `/api/` with `404 NOT_FOUND` after the bearer check. |
| A `%` in an `/api/` path matches no route | The first middleware answers `404 NOT_FOUND`, because Express decodes `%41` to `A` (Task 16, E7). |
| The routes match the normalized path of `new URL(req.url, origin)` | The first middleware sets `req.url` to that path before the router runs. |
| A rejected promise goes to `writeRouteError` | `route(handler)` sends a rejected promise and a thrown error to `next`. The lint rule `no-async-endpoint-handlers` rejects an `async` handler without this wrapper. |

- [x] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. The command prints no line.

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" packages/host/api/src/index.ts packages/host/api/src/transport/session-routes.ts packages/host/api/src/transport/management-routes.ts packages/host/api/src/transport/request-routes.ts packages/host/api/src/transport/deck-routes.ts packages/host/api/src/transport/error-response.ts`

Expected: PASS. The counts are `147`, `158`, `147`, `105`, `37` and `48`, in this order.

- [x] **Step 2: Install Express and its types**

Run: `corepack pnpm@11.28.5 --filter @deckagent/host-api --filter @deckagent/host add express@5.2.1`

Run: `corepack pnpm@11.28.5 --filter @deckagent/host-api --filter @deckagent/host add -D @types/express@5.0.6`

Expected: PASS. Each command exits with code 0. `packages/host/api/package.json` and `apps/host/package.json` each have `"express": "5.2.1"` in `dependencies` and `"@types/express": "5.0.6"` in `devDependencies`.

Run: `git diff --stat pnpm-lock.yaml`

Expected: PASS. The output starts with `pnpm-lock.yaml | 120` and contains `1 file changed, 120 insertions(+)`.

- [x] **Step 3: Write the new code**

Write each text below as the complete file. Do not copy the outer fence.

`packages/host/api/src/transport/route-params.ts`:

```ts
import type { NextFunction, Request, Response } from 'express'

export const WORD_ID = /^[\w-]{1,100}$/

type Handler = (req: Request, res: Response) => Promise<void> | void

export function params(patterns: Readonly<Record<string, RegExp>>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const [name, pattern] of Object.entries(patterns)) {
      if (!pattern.test(param(req, name))) {
        next('route')
        return
      }
    }
    next()
  }
}

export function param(req: Request, name: string): string {
  const value = req.params[name]
  return typeof value === 'string' ? value : ''
}

export function route(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch(next)
  }
}
```

`packages/host/api/src/transport/deck-routes.ts`:

```ts
import type { ServerResponse } from 'node:http'
import type { DeckChange, DeckReader } from '@deckagent/deck'
import type { Router } from 'express'
import { json } from './http-io.ts'
import { param, params, route, WORD_ID } from './route-params.ts'
import { openSseStream } from './sse.ts'

/**
 * Called only after Host authentication/origin checks. Subscribe before initial read.
 * Notices are invalidations, not an event log. Every reconnect starts at current version.
 */
export function registerDeckRoutes(router: Router, decks: DeckReader, streams: Set<ServerResponse>): void {
  router.get(
    '/api/sessions/:sessionId/deck',
    params({ sessionId: WORD_ID }),
    route((req, res) => {
      json(res, 200, decks.snapshot(param(req, 'sessionId')))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/deck/slides/:slideId/revisions/:revision',
    params({ sessionId: WORD_ID, slideId: WORD_ID, revision: /^[1-9][0-9]{0,9}$/ }),
    route((req, res) => {
      json(res, 200, decks.content(param(req, 'sessionId'), param(req, 'slideId'), Number(param(req, 'revision'))))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/deck/events',
    params({ sessionId: WORD_ID }),
    route((req, res) => {
      const sessionId = param(req, 'sessionId')
      const send = (change: DeckChange) => {
        if (res.destroyed || res.writableEnded) return
        if (!res.write(`event: deck-changed\ndata: ${JSON.stringify(change)}\n\n`)) res.end()
      }
      const unsubscribe = decks.subscribe(sessionId, send)
      try {
        const initial = decks.snapshot(sessionId)
        openSseStream(res, streams, unsubscribe)
        send({ sessionId, deckId: initial.deckId, version: initial.version })
      } catch (error) {
        unsubscribe()
        throw error
      }
    }),
  )
}
```

`packages/host/api/src/transport/session-routes.ts`:

```ts
import type { ServerResponse } from 'node:http'
import type { Router } from 'express'
import type { RequestController } from '../lifecycle/request-controller.ts'
import type { AttachmentManagement, HostMessage, HostOptions } from './contracts.ts'
import { registerDeckRoutes } from './deck-routes.ts'
import { HttpError } from './http-error.ts'
import { json, readJson } from './http-io.ts'
import { receiveAttachment } from './multipart.ts'
import { param, params, route, WORD_ID } from './route-params.ts'

function projectHistoryMessage(message: HostMessage) {
  return {
    role: message.role,
    content: message.content,
    ...(message.role === 'user' && message.attachments
      ? {
          attachments: message.attachments.map(item => ({
            attachmentId: item.attachmentId,
            name: item.name,
            state: item.state,
            byteSize: item.byteSize,
            ...(item.detectedType ? { detectedType: item.detectedType } : {}),
            ...(item.rejectionCode ? { rejectionCode: item.rejectionCode } : {}),
            ...(item.preparation ? { preparation: item.preparation } : {}),
            ...(item.source
              ? {
                  source: {
                    sourceId: item.source.sourceId,
                    version: item.source.version,
                    kind: item.source.kind,
                    label: item.source.label,
                  },
                }
              : {}),
          })),
        }
      : {}),
    ...(message.role === 'assistant' && message.interrupted ? { interrupted: true } : {}),
    ...(message.role === 'tool'
      ? { toolCallId: message.toolCallId, name: message.name, isError: message.isError === true }
      : {}),
  }
}

function registerAttachmentRoutes(router: Router, attachments: AttachmentManagement): void {
  const ids = params({ sessionId: WORD_ID, attachmentId: WORD_ID })
  router.post(
    '/api/sessions/:sessionId/attachments',
    params({ sessionId: WORD_ID }),
    route(async (req, res) => {
      json(res, 202, await receiveAttachment(req, param(req, 'sessionId'), attachments))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/attachments/:attachmentId',
    ids,
    route(async (req, res) => {
      json(res, 200, await attachments.get(param(req, 'sessionId'), param(req, 'attachmentId')))
    }),
  )
  router.delete(
    '/api/sessions/:sessionId/attachments/:attachmentId',
    ids,
    route(async (req, res) => {
      const value = await readJson(req)
      if (
        !value ||
        typeof value !== 'object' ||
        !('expectedRevision' in value) ||
        !Number.isSafeInteger(value.expectedRevision) ||
        Number(value.expectedRevision) < 0 ||
        Object.keys(value).some(key => key !== 'expectedRevision')
      )
        throw new HttpError(400, 'INVALID_REQUEST')
      json(
        res,
        200,
        await attachments.remove(param(req, 'sessionId'), param(req, 'attachmentId'), Number(value.expectedRevision)),
      )
    }),
  )
  router.get(
    '/api/sessions/:sessionId/attachments/:attachmentId/preview',
    ids,
    route(async (req, res) => {
      const abort = new AbortController()
      res.once('close', () => abort.abort())
      const result = await attachments.preview(param(req, 'sessionId'), param(req, 'attachmentId'), abort.signal)
      res.setHeader('content-security-policy', "sandbox; default-src 'none'; frame-ancestors 'none'")
      res.writeHead(200, { 'content-type': result.contentType, 'content-length': result.body.length })
      res.end(result.body)
    }),
  )
}

export function registerSessionRoutes(
  router: Router,
  options: HostOptions,
  controller: RequestController | undefined,
  streams: Set<ServerResponse>,
): void {
  const session = params({ sessionId: WORD_ID })
  const { confirmations, briefs, decks, outlines, attachments } = options
  if (confirmations && controller) {
    router.post(
      '/api/sessions/:sessionId/deck/confirm',
      session,
      route(async (req, res) => {
        json(
          res,
          200,
          await confirmations.confirm(param(req, 'sessionId'), await readJson(req), (request, settings) =>
            controller.submit(request, settings),
          ),
        )
      }),
    )
  }
  const interview = briefs?.interview?.bind(briefs)
  if (interview) {
    router.get(
      '/api/sessions/:sessionId/interview',
      session,
      route(async (req, res) => {
        json(res, 200, await interview(param(req, 'sessionId')))
      }),
    )
  }
  if (briefs) {
    router.get(
      '/api/sessions/:sessionId/brief',
      session,
      route(async (req, res) => {
        json(res, 200, await briefs.get(param(req, 'sessionId'), undefined))
      }),
    )
    router.get(
      '/api/sessions/:sessionId/brief/versions/:version',
      params({ sessionId: WORD_ID, version: /^\d{1,10}$/ }),
      route(async (req, res) => {
        json(res, 200, await briefs.get(param(req, 'sessionId'), Number(param(req, 'version'))))
      }),
    )
    router.put(
      '/api/sessions/:sessionId/brief',
      session,
      route(async (req, res) => {
        json(res, 200, await briefs.save(param(req, 'sessionId'), await readJson(req)))
      }),
    )
  }
  if (decks) registerDeckRoutes(router, decks, streams)
  const outlineImagePreview = outlines?.outlineImagePreview?.bind(outlines)
  if (outlineImagePreview) {
    router.get(
      '/api/sessions/:sessionId/outlines/:outlineId/images/:imageId',
      params({ sessionId: WORD_ID, outlineId: WORD_ID, imageId: /^need-[a-f0-9]{64}$/ }),
      route((req, res) => {
        const bytes = outlineImagePreview(param(req, 'sessionId'), param(req, 'outlineId'), param(req, 'imageId'))
        res.writeHead(200, {
          'content-type': 'image/png',
          'cache-control': 'private, no-store',
          'x-content-type-options': 'nosniff',
        })
        res.end(bytes)
      }),
    )
  }
  if (outlines) {
    router.get(
      '/api/sessions/:sessionId/outline',
      session,
      route((req, res) => {
        json(res, 200, outlines.outlineSnapshot(param(req, 'sessionId')))
      }),
    )
  }
  if (attachments) registerAttachmentRoutes(router, attachments)
  router.get(
    '/api/sessions/:sessionId/history',
    session,
    route(async (req, res) => {
      const messages = await options.readHistory(param(req, 'sessionId'))
      json(res, 200, messages.filter(message => message.role !== 'system').map(projectHistoryMessage))
    }),
  )
}
```

`packages/host/api/src/transport/management-routes.ts`:

```ts
import type { WebSession } from '@deckagent/host-contracts'
import type { Router } from 'express'
import type { WebManagement, WorkspaceManagement } from './contracts.ts'
import { json, readJson } from './http-io.ts'
import { param, params, route, WORD_ID } from './route-params.ts'

const PROVIDER_ID = params({ providerId: /^[\w.-]{1,100}$/ })

function registerWorkspaceRoutes(router: Router, workspaces: WorkspaceManagement): void {
  router.get(
    '/api/workspaces',
    route(async (_req, res) => {
      json(res, 200, await workspaces.list())
    }),
  )
  router.post(
    '/api/workspaces',
    route(async (req, res) => {
      json(res, 200, await workspaces.add(await readJson(req)))
    }),
  )
  router.put(
    '/api/workspaces/selected',
    route(async (req, res) => {
      json(res, 200, await workspaces.select(await readJson(req)))
    }),
  )
  const notSelected = params({ workspaceId: /^(?!selected$)[\w-]{1,100}$/ })
  router.put(
    '/api/workspaces/:workspaceId',
    notSelected,
    route(async (req, res) => {
      json(res, 200, await workspaces.rename(param(req, 'workspaceId'), await readJson(req)))
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
      json(res, 200, await workspaces.relink(param(req, 'workspaceId'), await readJson(req)))
    }),
  )
}

function registerSettingsAndProviderRoutes(router: Router, management: WebManagement): void {
  router.get(
    '/api/settings',
    route(async (_req, res) => {
      json(res, 200, await management.settings())
    }),
  )
  const research = management.research
  if (research) {
    router.put(
      '/api/research',
      route(async (req, res) => {
        await research.save(await readJson(req))
        json(res, 200, { ok: true })
      }),
    )
    router.delete(
      '/api/research',
      route(async (_req, res) => {
        await research.remove()
        json(res, 200, { ok: true })
      }),
    )
  }
  const preferences = management.preferences
  if (preferences) {
    router.get(
      '/api/preferences',
      route(async (_req, res) => {
        json(res, 200, await preferences.get())
      }),
    )
    router.put(
      '/api/preferences',
      route(async (req, res) => {
        json(res, 200, await preferences.save(await readJson(req)))
      }),
    )
  }
  router.put(
    '/api/providers/:providerId',
    PROVIDER_ID,
    route(async (req, res) => {
      await management.saveProvider(param(req, 'providerId'), await readJson(req))
      json(res, 200, { saved: true })
    }),
  )
  router.delete(
    '/api/providers/:providerId',
    PROVIDER_ID,
    route(async (req, res) => {
      await management.deleteProvider(param(req, 'providerId'))
      json(res, 200, { saved: true })
    }),
  )
  router.get(
    '/api/providers/:providerId/catalog',
    PROVIDER_ID,
    route(async (req, res) => {
      json(res, 200, await management.catalog(param(req, 'providerId')))
    }),
  )
}

export function registerManagementRoutes(
  router: Router,
  management: WebManagement,
  withActive: (sessions: readonly WebSession[]) => Promise<readonly WebSession[]>,
): void {
  const session = params({ sessionId: WORD_ID })
  registerSettingsAndProviderRoutes(router, management)
  const research = management.research
  if (research) {
    router.get(
      '/api/sessions/:sessionId/research-sources',
      session,
      route(async (req, res) => {
        json(res, 200, await research.sources(param(req, 'sessionId')))
      }),
    )
  }
  router.get(
    '/api/sessions',
    route(async (_req, res) => {
      json(res, 200, await withActive(await management.sessions()))
    }),
  )
  router.post(
    '/api/sessions',
    route(async (req, res) => {
      json(res, 201, await management.createSession(await readJson(req)))
    }),
  )
  router.put(
    '/api/sessions/:sessionId/selection',
    session,
    route(async (req, res) => {
      json(res, 200, await management.selectModel(param(req, 'sessionId'), await readJson(req)))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/activities',
    session,
    route(async (req, res) => {
      json(res, 200, await management.activities(param(req, 'sessionId')))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/requests',
    session,
    route(async (req, res) => {
      json(res, 200, await management.requests(param(req, 'sessionId')))
    }),
  )
  const searchSessions = management.searchSessions?.bind(management)
  if (searchSessions) {
    router.post(
      '/api/sessions/search',
      route(async (req, res) => {
        json(res, 200, await withActive(await searchSessions(await readJson(req))))
      }),
    )
  }
  const drafts = management.drafts
  if (drafts) {
    router.get(
      '/api/sessions/:sessionId/draft',
      session,
      route(async (req, res) => {
        json(res, 200, await drafts.get(param(req, 'sessionId')))
      }),
    )
    router.put(
      '/api/sessions/:sessionId/draft',
      session,
      route(async (req, res) => {
        json(res, 200, await drafts.save(param(req, 'sessionId'), await readJson(req)))
      }),
    )
  }
  if (management.workspaces) registerWorkspaceRoutes(router, management.workspaces)
}
```

`packages/host/api/src/transport/request-routes.ts`:

```ts
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { RequestEvent } from '@deckagent/host-contracts'
import type { Router } from 'express'
import type { RequestController } from '../lifecycle/request-controller.ts'
import { HttpError } from './http-error.ts'
import { json, parseCursor, readAgentRequest, readJson } from './http-io.ts'
import { param, params, route, WORD_ID } from './route-params.ts'
import { openSseStream } from './sse.ts'

const activeStatuses = new Set(['active', 'waiting_approval'])

function streamRequestEvents(
  req: IncomingMessage,
  res: ServerResponse,
  id: string,
  controller: RequestController,
  streams: Set<ServerResponse>,
): void {
  const after = parseCursor(req)
  // Subscribe before reading saved events, so nothing published in between is lost; the cursor drops repeats.
  let last = after
  let ended = false
  const queued: RequestEvent[] = []
  let replaying = true
  const write = (event: RequestEvent) => {
    if (ended || event.sequence <= last || res.destroyed || res.writableEnded) return
    last = event.sequence
    const ready = res.write(`id: ${event.sequence}\nevent: request\ndata: ${JSON.stringify(event)}\n\n`)
    if ((event.kind === 'status' && !activeStatuses.has(event.status)) || !ready) {
      ended = true
      res.end()
    }
  }
  const unsubscribe = controller.subscribe(event => {
    if (event.requestId !== id) return
    if (replaying) queued.push(event)
    else write(event)
  })
  try {
    openSseStream(res, streams, unsubscribe)
  } catch (error) {
    unsubscribe()
    throw error
  }
  try {
    for (const event of controller.events(id, after)) write(event)
  } finally {
    replaying = false
    for (const event of queued.splice(0)) write(event)
  }
  // A request that ended before the cursor has nothing more to say.
  if (!ended && !activeStatuses.has(controller.get(id).status) && last >= controller.get(id).sequence) {
    ended = true
    res.end()
  }
}

export function registerRequestRoutes(
  router: Router,
  controller: RequestController | undefined,
  maxFiles: number,
  streams: Set<ServerResponse>,
): void {
  const request = params({ requestId: WORD_ID })
  router.post(
    '/api/requests',
    route(async (req, res) => {
      // No Agent runtime is connected: refuse the request instead of pretending to start work.
      if (!controller) throw new HttpError(503, 'REQUESTS_UNAVAILABLE')
      json(res, 202, await controller.submit(await readAgentRequest(req, maxFiles)))
    }),
  )
  router.post(
    '/api/requests/:requestId/approvals/:approvalId/decision',
    params({ requestId: WORD_ID, approvalId: WORD_ID }),
    route(async (req, res) => {
      if (!controller) throw new HttpError(404, 'APPROVAL_NOT_FOUND')
      const value = await readJson(req)
      if (
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value) ||
        !('decision' in value) ||
        Object.keys(value).some(key => key !== 'decision') ||
        (value.decision !== 'allow-once' && value.decision !== 'refuse')
      )
        throw new HttpError(400, 'INVALID_REQUEST')
      json(res, 200, controller.decide(param(req, 'requestId'), param(req, 'approvalId'), value.decision))
    }),
  )
  router.post(
    '/api/requests/:requestId/stop',
    request,
    route((req, res) => {
      if (!controller) throw new HttpError(404, 'REQUEST_NOT_FOUND')
      json(res, 200, controller.stop(param(req, 'requestId')))
    }),
  )
  router.get(
    '/api/requests/:requestId',
    request,
    route((req, res) => {
      if (!controller) throw new HttpError(404, 'REQUEST_NOT_FOUND')
      json(res, 200, controller.get(param(req, 'requestId')))
    }),
  )
  router.get(
    '/api/requests/:requestId/events',
    request,
    route((req, res) => {
      if (!controller) throw new HttpError(404, 'REQUEST_NOT_FOUND')
      const requestId = param(req, 'requestId')
      controller.get(requestId)
      streamRequestEvents(req, res, requestId, controller, streams)
    }),
  )
}
```

`packages/host/api/src/index.ts`:

```ts
import type { ServerResponse } from 'node:http'
import type { WebSession } from '@deckagent/host-contracts'
import { Router } from 'express'
import type { ContractSyncVerified } from './contract-sync.ts'
import { RequestController } from './lifecycle/request-controller.ts'
import type { HostOptions } from './transport/contracts.ts'
import { registerManagementRoutes } from './transport/management-routes.ts'
import { registerRequestRoutes } from './transport/request-routes.ts'
import { registerSessionRoutes } from './transport/session-routes.ts'

export { RequestFailure } from './lifecycle/request-failure.ts'
export type {
  PreparedRequest,
  RequestAdmission,
  RequestRun,
  RequestRuntime,
  RuntimeEvent,
  RuntimeOutcome,
} from './lifecycle/contracts.ts'
export type { PreparedTools, RequestTools, ToolContext, ToolResult, ToolSchema } from './lifecycle/tool-contracts.ts'
export type {
  AttachmentManagement,
  BriefManagement,
  HostMessage,
  HostOptions,
  HttpFailureResponse,
  WebManagement,
  WorkspaceManagement,
} from './transport/contracts.ts'
export { HttpError } from './transport/http-error.ts'
export type { HttpErrorDetail } from './transport/http-error.ts'

const contractSync: ContractSyncVerified = true

export interface HostRoutes {
  readonly router: Router
  readonly streams: Set<ServerResponse>
  close(): Promise<void>
}

/** Routes of the Local Host API in their match order. Disconnect never cancels a request. */
export function createHostRoutes(options: HostOptions): HostRoutes {
  if (!contractSync) throw new Error('Contract sync failed')
  const controller = options.requests
    ? new RequestController(
        options.requests.store,
        options.requests.runtime,
        options.requests.prepareTools,
        options.requests.closingText,
      )
    : undefined
  const streams = new Set<ServerResponse>()
  const withActive = async (sessions: readonly WebSession[]): Promise<readonly WebSession[]> =>
    sessions.map(session => {
      const activeRequestId = controller?.active(session.sessionId)
      return { ...session, ...(activeRequestId ? { activeRequestId } : {}) }
    })
  const router = Router({ caseSensitive: true, strict: true })
  registerSessionRoutes(router, options, controller, streams)
  if (options.management) registerManagementRoutes(router, options.management, withActive)
  registerRequestRoutes(router, controller, options.attachments?.maxFiles ?? 0, streams)
  return {
    router,
    streams,
    close: async () => {
      await controller?.close()
    },
  }
}
```

`apps/host/src/http/error-handler.ts`:

```ts
import type { ServerResponse } from 'node:http'
import { HttpError, RequestFailure, type HostOptions, type HttpFailureResponse } from '@deckagent/host-api'

const requestFailureStatus: Readonly<Record<string, number>> = {
  HOST_CLOSED: 503,
  HOST_BUSY: 429,
  REQUEST_NOT_FOUND: 404,
  APPROVAL_NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  SESSION_BUSY: 409,
  GENERATION_LINK_CONFLICT: 409,
  APPROVAL_CONFLICT: 409,
  REQUEST_CLOSED: 409,
  DRAFT_CONFLICT: 409,
  ATTACHMENT_REJECTED: 409,
  ATTACHMENT_NOT_READY: 409,
  ATTACHMENT_COUNT_EXCEEDED: 413,
  REQUEST_EMPTY: 400,
  REQUEST_NOT_SAVED: 500,
  GENERATION_LINK_FAILED: 500,
}

function requestFailureResponse(error: RequestFailure): HttpFailureResponse {
  return { status: requestFailureStatus[error.code] ?? 500, code: error.code }
}

export function writeRouteError(res: ServerResponse, error: unknown, options: HostOptions): void {
  if (res.headersSent) {
    res.destroy()
    return
  }
  const mapped =
    error instanceof RequestFailure ? requestFailureResponse(error) : options.mapApplicationFailure?.(error)
  const known = error instanceof HttpError
  const status = mapped ? mapped.status : known ? error.status : 500
  const code = mapped ? mapped.code : known ? error.code : 'HOST_ERROR'
  const detail = mapped?.detail ?? (known ? error.detail : undefined)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(
    JSON.stringify({
      error: {
        code,
        message: options.failureMessage?.(mapped || known ? code : '') ?? 'Request could not be completed',
        ...(detail ? { detail } : {}),
      },
    }),
  )
}
```

`apps/host/src/http/app.ts`:

```ts
import { timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { HttpError, type HostOptions } from '@deckagent/host-api'
import express, { type Express, type NextFunction, type Request, type Response, type Router } from 'express'
import { writeRouteError } from './error-handler.ts'

export interface HttpAppConfig {
  readonly options: HostOptions
  readonly token: string
  readonly router: Router
  origin(): string
  closing(): boolean
}

function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-content-type-options', 'nosniff')
  res.setHeader('referrer-policy', 'no-referrer')
  res.setHeader(
    'content-security-policy',
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src blob: data:; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  )
}

function checkOrigin(req: IncomingMessage, origin: string): void {
  if (
    req.headers.host !== new URL(origin).host ||
    (req.headers.origin !== undefined && req.headers.origin !== origin) ||
    req.headers['sec-fetch-site'] === 'cross-site'
  )
    throw new HttpError(403, 'ORIGIN_DENIED')
}

function serveAsset(req: IncomingMessage, res: ServerResponse, pathname: string, options: HostOptions): void {
  const asset = options.assets && Object.hasOwn(options.assets, pathname) ? options.assets[pathname] : undefined
  if (req.method !== 'GET' || !asset) throw new HttpError(404, 'NOT_FOUND')
  if (asset.sandboxed)
    res.setHeader(
      'content-security-policy',
      "sandbox; default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
    )
  res.writeHead(200, { 'content-type': asset.contentType })
  res.end(asset.body)
}

export function createHttpApp(config: HttpAppConfig): Express {
  const { options } = config
  const expected = Buffer.from(`Bearer ${config.token}`)
  const app = express()
  app.disable('x-powered-by')
  app.set('etag', false)
  app.set('case sensitive routing', true)
  app.set('strict routing', true)
  app.use((req: Request, res: Response, next: NextFunction) => {
    setSecurityHeaders(res)
    if (config.closing()) throw new HttpError(503, 'HOST_CLOSED')
    const origin = config.origin()
    checkOrigin(req, origin)
    const url = new URL(req.originalUrl, origin)
    if (url.search) throw new HttpError(400, 'INVALID_REQUEST')
    if (!url.pathname.startsWith('/api/')) {
      serveAsset(req, res, url.pathname, options)
      return
    }
    const auth = Buffer.from(req.headers.authorization ?? '')
    if (auth.length !== expected.length || !timingSafeEqual(auth, expected)) throw new HttpError(401, 'AUTH_REQUIRED')
    if (req.method === 'HEAD' || req.method === 'OPTIONS' || url.pathname.includes('%'))
      throw new HttpError(404, 'NOT_FOUND')
    req.url = url.pathname
    next()
  })
  app.use(config.router)
  app.use(() => {
    throw new HttpError(404, 'NOT_FOUND')
  })
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    writeRouteError(res, error, options)
  })
  return app
}
```

`apps/host/src/http/start-host.ts`:

```ts
import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { createHostRoutes, type HostOptions } from '@deckagent/host-api'
import { createHttpApp } from './app.ts'

/** Loopback-only, authenticated HTTP/SSE boundary. Disconnect never cancels a request. */
export async function startHost(options: HostOptions) {
  const token = randomBytes(32).toString('hex')
  const routes = createHostRoutes(options)
  let origin = ''
  let closing: Promise<void> | undefined
  const app = createHttpApp({
    options,
    token,
    router: routes.router,
    origin: () => origin,
    closing: () => closing !== undefined,
  })
  const server = createServer(app)
  server.requestTimeout = 10000
  server.headersTimeout = 10000
  server.on('clientError', (_error, socket) => socket.destroy())

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(options.port ?? 0, '127.0.0.1', () => {
        server.off('error', reject)
        resolve()
      })
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Host failed to listen')
    origin = `http://127.0.0.1:${address.port}`
  } catch (error) {
    server.close()
    throw error
  }

  return {
    origin,
    token,
    close(): Promise<void> {
      closing ??= (async () => {
        const stopped = new Promise<void>((resolve, reject) =>
          server.close(error => (error ? reject(error) : resolve())),
        )
        for (const stream of routes.streams) stream.end()
        server.closeAllConnections()
        await Promise.all([stopped, routes.close()])
      })()
      return closing
    },
  }
}
```

`apps/host/tests/fixtures/http-host.mjs`:

```js
export { startHost } from '../../lib/types/http/start-host.js'
```

- [x] **Step 4: Delete the old error response file and move the HTTP test**

Run: `git rm packages/host/api/src/transport/error-response.ts`

Run: `git mv packages/host/api/tests/host-api.test.mjs apps/host/tests/http-server.test.mjs`

Expected: PASS. Each command exits with code 0.

- [x] **Step 5: Run the edit script**

Save the script below as `deckagent-express-edits.mjs` in the temporary folder of the system (`$env:TEMP` in PowerShell, `$TEMP` in Git Bash), outside the repository. The script reads each file with LF line endings, checks the number of matches of each text, and then replaces it.

```js
import { readFileSync, writeFileSync } from 'node:fs'

const failures = []
function edit(file, pairs) {
  let text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  for (const [from, to, count] of pairs) {
    const found = text.split(from).length - 1
    if (found !== count) {
      failures.push(`${file}: expected ${count} of ${JSON.stringify(from.slice(0, 70))}, found ${found}`)
      continue
    }
    text = text.split(from).join(to)
  }
  writeFileSync(file, text)
}

edit('apps/host/src/server.ts', [
  [
    "import { startHost, type HostOptions, type RequestRuntime } from '@deckagent/host-api'\n",
    "import type { HostOptions, RequestRuntime } from '@deckagent/host-api'\nimport { startHost } from './http/start-host.ts'\n",
    1,
  ],
])
edit('apps/host/tests/http-server.test.mjs', [
  ["import { startHost } from '../lib/index.js'\n", "import { startHost } from '../lib/types/http/start-host.js'\n", 1],
])
edit('apps/web/tests/browser-runtime.test.mjs', [
  [
    "import { startHost } from '@deckagent/host-api'\n",
    "import { startHost } from '../../host/tests/fixtures/http-host.mjs'\n",
    1,
  ],
])
edit('e2e/attachment-admission.test.mjs', [
  [
    "import { startHost, HttpError } from '@deckagent/host-api'\n",
    "import { HttpError } from '@deckagent/host-api'\nimport { startHost } from '../apps/host/tests/fixtures/http-host.mjs'\n",
    1,
  ],
])
edit('e2e/request-lifecycle.test.mjs', [
  [
    "import { HttpError, startHost } from '@deckagent/host-api'\n",
    "import { HttpError } from '@deckagent/host-api'\nimport { startHost } from '../apps/host/tests/fixtures/http-host.mjs'\n",
    1,
  ],
])
edit('e2e/attachment-storage.test.mjs', [
  [
    "  const { startHost } = await import('@deckagent/host-api')\n",
    "  const { startHost } = await import('../apps/host/tests/fixtures/http-host.mjs')\n",
    1,
  ],
])
edit('package.json', [
  ['packages/host/api/tests/host-api.test.mjs', 'apps/host/tests/http-server.test.mjs', 1],
])
edit('AGENTS.md', [
  [
    '- Thư viện đích đã chọn, chưa cài: Express 5 với `multer` và `helmet` cho Local Host,',
    '- Express 5.2.1 cho HTTP của Local Host, type từ `@types/express` 5.0.6.\n- Thư viện đích đã chọn, chưa cài: `multer` và `helmet` cho Local Host,',
    1,
  ],
])
edit('docs/conventions/project-structure.md', [
  [
    '| `packages/host/api/src/index.ts`, `transport/http-io.ts`, `transport/error-response.ts`, `transport/sse.ts` | `apps/host/src/http/` |\n',
    '| `packages/host/api/src/transport/http-io.ts`, `transport/sse.ts`, `transport/multipart.ts`, `transport/http-error.ts`, `transport/route-params.ts` | `apps/host/src/http/` |\n| `packages/host/api/src/index.ts` (`createHostRoutes`) | `apps/host/src/server.ts` |\n',
    1,
  ],
])

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('express-edits: 10 files changed, 0 failures')
```

Run from the repository root: `node <temporary folder>/deckagent-express-edits.mjs`

Expected: PASS. The output is `express-edits: 10 files changed, 0 failures`.

- [x] **Step 6: Build and run the checks**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 lint`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 35` and `# fail 0`.

Run: `git grep -n --untracked "createServer\|\.exec(pathname\|req\.method" -- packages/host/api/src`

Expected: PASS. The command prints no line and exits with code 1. No regular expression routing and no `node:http` server remain in `packages/host/api/src/`.

Run: `git grep -n --untracked "createServer(" -- apps/host/src packages/host/api/src`

Expected: PASS. The output has two lines: `apps/host/src/http/start-host.ts` and `apps/host/src/integrations/opencode/mcp-bridge.ts`. The second line is the local MCP bridge of OpenCode. It is not part of the HTTP edge.

Run: `corepack pnpm@11.28.5 check:docs`

Expected: PASS. The output contains `0 error(s)`.

- [x] **Step 7: Run the non-live suites**

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

- [x] **Step 8: Check the changed paths**

Run: `git status --short`

Expected: PASS. The output has these lines in any order, and other lines only for files in `docs/build/refactor/target-structure/`:

```text
 M AGENTS.md
 M apps/host/package.json
 M apps/host/src/server.ts
RM packages/host/api/tests/host-api.test.mjs -> apps/host/tests/http-server.test.mjs
 M apps/web/tests/browser-runtime.test.mjs
 M docs/conventions/project-structure.md
 M e2e/attachment-admission.test.mjs
 M e2e/attachment-storage.test.mjs
 M e2e/request-lifecycle.test.mjs
 M package.json
 M packages/host/api/package.json
 M packages/host/api/src/index.ts
 M packages/host/api/src/transport/deck-routes.ts
D  packages/host/api/src/transport/error-response.ts
 M packages/host/api/src/transport/management-routes.ts
 M packages/host/api/src/transport/request-routes.ts
 M packages/host/api/src/transport/session-routes.ts
 M pnpm-lock.yaml
?? apps/host/src/http/
?? apps/host/tests/fixtures/http-host.mjs
?? packages/host/api/src/transport/route-params.ts
```

Git can show `R ` in place of `RM`, or `M ` in place of ` M`. Only the path matters.

- [x] **Step 9: Write the report file and stop**

1. Mark Steps 1 to 8 as `- [x]` in this file. Change the Task 17 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-17-serve-routes-through-express.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-17-serve-routes-through-express.md` with:
   - H1 `# Task 17: Serve every route through Express report` and the purpose line `Read this file to learn how the Local Host serves its routes through Express 5.2.1, and the result of each check after the change.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command. Write each command that you ran in another form, for example in PowerShell.
   - The suite table from Step 7.
   - What the commands do not prove: the tests check the routes and the behaviors that they call. A route that no test calls can have a wrong parameter class. A path with dot segments, for example `/api/x/../sessions`, has no test.
3. Add a row for Task 17 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run the STE linter from Global Constraints on the report file. Expected: the output contains `0 violations`.
5. Mark Step 9 as `- [x]`.

**STOP** and send the report summary. Do not start Task 18 until a person approves the report.
