# Task 9: Inventory the HTTP routes report

Read this file to learn each current HTTP route of the Local Host and the facts that can change when Express matches it.

## Files changed

- `docs/build/refactor/target-structure/plan/task-09-inventory-http-routes.md`: marked Steps 1 to 6 as done.
- `docs/build/refactor/target-structure/plan/README.md`: changed Task 9 to `Done` and added the report link.
- `docs/build/refactor/target-structure/reports/README.md`: added the report index row.
- `docs/build/refactor/target-structure/reports/task-09-inventory-http-routes.md`: added this report.

## Commands run

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `grep -c "req.method" packages/host/api/src/transport/management-routes.ts` | 0 | `23` |
| 1 | `grep -c "req.method" packages/host/api/src/transport/request-routes.ts` | 0 | `4` |
| 1 | `grep -c "req.method" packages/host/api/src/transport/session-routes.ts` | 0 | `12` |
| 1 | `grep -c "req.method" packages/host/api/src/transport/deck-routes.ts` | 0 | `0` |
| 2 | `grep -n "req.method\|\.exec(\|pathname ===\|pathname.startsWith" packages/host/api/src/transport/*-routes.ts` | 0 | 61 lines |
| 3 | `grep -rlF "<segment>" e2e apps/web/tests packages/host/api/tests --include=*.test.mjs` | 0 | File lists in the `Tests` column. No segment gave exit code 1. |
| 4 | `grep -rn "/api/" apps/web/src/browser/transport` | 0 | 14 lines |
| 5 | `git status --short` | 0 | No output |
| 6 | `corepack pnpm@11.28.5 check:docs` | 0 | `0 error(s)` |
| 6 | `python3.12 -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-09-inventory-http-routes.md` | 0 | `0 violations` |

The shell of Step 1 is Git Bash on Windows. The loop form of the Step 1 command did not pass the loop variable through the Windows wrapper. The same four `grep -c` commands ran as separate lines in one shell, with the expected output.

`python` is not in the PATH of this machine. The environment provides `python3.12`, so the ste-lint command ran with `python3.12` and the same arguments.

## Route table

The rows follow the call order of the code. The line of the method check is the location, or the line of the path check when the route has no method check. One code regex can answer more than one path shape. Each row then gives the part of the regex that its shape matches, and the flags give the parameter classes of that shape.

| ID | Method | Path pattern | Location (file:line) | Body | Status | Condition | Flags | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | `GET` | `!url.pathname.startsWith('/api/')` | `index.ts:59` | none | `200` | `options.assets` has the pathname as an own key | optional (HostOptions.assets), route-error (`404 NOT_FOUND`) | `e2e/layout-review-browser.test.mjs`, `e2e/local-web.test.mjs`, `e2e/portable-generation.test.mjs` |
| R2 | `POST` | `^\/api\/sessions\/([\w-]{1,100})\/deck\/confirm$` | `session-routes.ts:95` | json (`readJson`) | `200` | `options.confirmations` is present, a controller exists | param-pattern (`[\w-]{1,100}`), optional (HostOptions.confirmations) | `e2e/artifact-rendering.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs`, `e2e/deck-pipeline.test.mjs`, `e2e/generation-bridge.test.mjs` (15 total) |
| R3 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/interview$` | `session-routes.ts:106` | none | `200` | `options.briefs.interview` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.briefs) | `e2e/browser-smoke.test.mjs`, `e2e/image-recovery-http.test.mjs`, `e2e/interview-workflow.test.mjs`, `e2e/portable-generation-http.test.mjs`, `apps/web/tests/brief-host.test.mjs` |
| R4 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/brief$` | `session-routes.ts:113` | none | `200` | `options.briefs` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.briefs) | `e2e/artifact-rendering.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/generation-continuation-http.test.mjs` (17 total) |
| R5 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/brief\/versions\/(\d{1,10})$` | `session-routes.ts:113` | none | `200` | `options.briefs` is present | param-pattern (`[\w-]{1,100}`, `\d{1,10}`), optional (HostOptions.briefs) | `e2e/step-approval.test.mjs`, `apps/web/tests/brief-client.test.mjs`, `apps/web/tests/brief-host.test.mjs` |
| R6 | `PUT` | `^\/api\/sessions\/([\w-]{1,100})\/brief$` | `session-routes.ts:121` | json (`readJson`) | `200` | `options.briefs` is present, the path has no version | param-pattern (`[\w-]{1,100}`), optional (HostOptions.briefs) | `e2e/artifact-rendering.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/generation-continuation-http.test.mjs` (17 total) |
| R7 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/deck$` | `session-routes.ts:126` (path: `deck-routes.ts:12`) | json | `200` | `options.decks` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.decks) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs` (42 total) |
| R8 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/deck\/events$` | `session-routes.ts:126` (path: `deck-routes.ts:12`) | sse (`openSseStream`, `deck-routes.ts:30`) | `200` | `options.decks` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.decks) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/deck-pipeline.test.mjs`, `e2e/env-startup.test.mjs`, `e2e/generation-bridge.test.mjs` (26 total) |
| R9 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/deck\/slides\/([\w-]{1,100})\/revisions\/([1-9][0-9]{0,9})$` | `session-routes.ts:126` (path: `deck-routes.ts:12`) | none | `200` | `options.decks` is present | param-pattern (`[\w-]{1,100}`, `[\w-]{1,100}`, `[1-9][0-9]{0,9}`), optional (HostOptions.decks) | `e2e/browser-smoke.test.mjs`, `e2e/image-recovery-http.test.mjs`, `e2e/interview-workflow.test.mjs` |
| R10 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/outlines\/([\w-]{1,100})\/images\/(need-[a-f0-9]{64})$` | `session-routes.ts:134` | none (PNG bytes) | `200` | `options.outlines.outlineImagePreview` is present | param-pattern (`[\w-]{1,100}`, `[\w-]{1,100}`, `need-[a-f0-9]{64}`), optional (HostOptions.outlines) | `e2e/artifact-rendering.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/generation-continuation-http.test.mjs` (19 total) |
| R11 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/outline$` | `session-routes.ts:146` | json | `200` | `options.outlines` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.outlines) | `e2e/artifact-rendering.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs`, `e2e/deck-pipeline.test.mjs`, `e2e/generation-bridge.test.mjs` (20 total) |
| R12 | `POST` | `^\/api\/sessions\/([\w-]{1,100})\/attachments$` | `session-routes.ts:52` | multipart (`receiveAttachment`) | `202` | `options.attachments` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.attachments) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/image-recovery-http.test.mjs` (15 total) |
| R13 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/attachments\/([\w-]{1,100})$` | `session-routes.ts:56` | none | `200` | `options.attachments` is present | param-pattern (`[\w-]{1,100}`, `[\w-]{1,100}`), optional (HostOptions.attachments) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/image-recovery-http.test.mjs` (15 total) |
| R14 | `DELETE` | `^\/api\/sessions\/([\w-]{1,100})\/attachments\/([\w-]{1,100})$` | `session-routes.ts:60` | json (`readJson`, `{ expectedRevision }`) | `200` | `options.attachments` is present, the body has only `expectedRevision` as a safe integer | param-pattern (`[\w-]{1,100}`, `[\w-]{1,100}`), optional (HostOptions.attachments) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/image-recovery-http.test.mjs` (15 total) |
| R15 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/attachments\/([\w-]{1,100})\/preview$` | `session-routes.ts:74` | none (image bytes or JSON text) | `200` | `options.attachments` is present, the client stays connected | param-pattern (`[\w-]{1,100}`, `[\w-]{1,100}`), optional (HostOptions.attachments) | `e2e/attachment-admission.test.mjs`, `e2e/browser-smoke.test.mjs` |
| R16 | `GET` | `^\/api\/sessions\/([A-Za-z0-9_-]{1,100})\/history$` | `session-routes.ts:152` | json | `200` | `options.readHistory` exists | param-pattern (`[A-Za-z0-9_-]{1,100}`) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/generation-continuation-http.test.mjs` (19 total) |
| R17 | `GET` | `'/api/settings'` | `management-routes.ts:51` | none | `200` | `options.management` is present | optional (HostOptions.management) | `e2e/browser-smoke.test.mjs`, `e2e/env-startup.test.mjs`, `e2e/model-requests.test.mjs`, `apps/web/tests/opencode-adapter.test.mjs`, `apps/web/tests/opencode-resources.test.mjs` (7 total) |
| R18 | `PUT` | `'/api/research'` | `management-routes.ts:56` | json (`readJson`) | `200` | `management.research` is present | optional (HostOptions.management, WebManagement.research) | `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/image-recovery-http.test.mjs`, `e2e/interview-workflow.test.mjs`, `e2e/layout-review-browser.test.mjs` (15 total) |
| R19 | `DELETE` | `'/api/research'` | `management-routes.ts:61` | none | `200` | `management.research` is present | optional (HostOptions.management, WebManagement.research) | `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/image-recovery-http.test.mjs`, `e2e/interview-workflow.test.mjs`, `e2e/layout-review-browser.test.mjs` (15 total) |
| R20 | `GET` | `'/api/preferences'` | `management-routes.ts:68` | none | `200` | `management.preferences` is present | optional (HostOptions.management, WebManagement.preferences) | `apps/web/tests/web-management.test.mjs` |
| R21 | `PUT` | `'/api/preferences'` | `management-routes.ts:72` | json (`readJson`) | `200` | `management.preferences` is present | optional (HostOptions.management, WebManagement.preferences) | `apps/web/tests/web-management.test.mjs` |
| R22 | `PUT` | `^\/api\/providers\/([\w.-]{1,100})$` | `management-routes.ts:79` | json (`readJson`) | `200` | `options.management` is present | param-pattern (`[\w.-]{1,100}`), optional (HostOptions.management) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/generation-continuation-http.test.mjs`, `e2e/image-recovery-http.test.mjs` (21 total) |
| R23 | `DELETE` | `^\/api\/providers\/([\w.-]{1,100})$` | `management-routes.ts:78` | none | `200` | `options.management` is present | param-pattern (`[\w.-]{1,100}`), optional (HostOptions.management) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/generation-continuation-http.test.mjs`, `e2e/image-recovery-http.test.mjs` (21 total) |
| R24 | `GET` | `^\/api\/providers\/([\w.-]{1,100})\/catalog$` | `management-routes.ts:85` | none | `200` | `options.management` is present | param-pattern (`[\w.-]{1,100}`), optional (HostOptions.management) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/generation-continuation-http.test.mjs`, `e2e/image-recovery-http.test.mjs` (13 total) |
| R25 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/research-sources$` | `management-routes.ts:101` | none | `200` | `management.research` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.management, WebManagement.research) | `e2e/image-recovery-http.test.mjs`, `e2e/portable-generation-http.test.mjs`, `e2e/research-live.test.mjs`, `apps/web/tests/research.test.mjs` |
| R26 | `GET` | `'/api/sessions'` | `management-routes.ts:106` | none | `200` | `options.management` is present | optional (HostOptions.management) | `e2e/attachment-admission.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/deck-pipeline.test.mjs`, `e2e/layout-review-browser.test.mjs`, `e2e/local-web.test.mjs` (9 total) |
| R27 | `POST` | `'/api/sessions'` | `management-routes.ts:110` | json (`readJson`) | `201` | `options.management` is present | optional (HostOptions.management) | `e2e/attachment-admission.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/deck-pipeline.test.mjs`, `e2e/layout-review-browser.test.mjs`, `e2e/local-web.test.mjs` (9 total) |
| R28 | `PUT` | `^\/api\/sessions\/([\w-]{1,100})\/(selection\|activities\|requests)$` | `management-routes.ts:116` | json (`readJson`) | `200` | `options.management` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.management) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs` (32 total) |
| R29 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/(selection\|activities\|requests)$` | `management-routes.ts:120` | none | `200` | `options.management` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.management) | `e2e/model-requests.test.mjs`, `e2e/request-lifecycle.test.mjs` |
| R30 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/(selection\|activities\|requests)$` | `management-routes.ts:124` | none | `200` | `options.management` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.management) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs` (24 total) |
| R31 | `POST` | `'/api/sessions/search'` | `management-routes.ts:128` | json (`readJson`) | `200` | `management.searchSessions` is present | optional (HostOptions.management, WebManagement.searchSessions) | `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/generation-continuation-http.test.mjs`, `e2e/image-recovery-http.test.mjs` (20 total) |
| R32 | `GET` | `^\/api\/sessions\/([\w-]{1,100})\/draft$` | `management-routes.ts:134` | none | `200` | `management.drafts` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.management, WebManagement.drafts) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs` (24 total) |
| R33 | `PUT` | `^\/api\/sessions\/([\w-]{1,100})\/draft$` | `management-routes.ts:138` | json (`readJson`) | `200` | `management.drafts` is present | param-pattern (`[\w-]{1,100}`), optional (HostOptions.management, WebManagement.drafts) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs` (24 total) |
| R34 | `GET` | `'/api/workspaces'` | `management-routes.ts:13` | none | `200` | `management.workspaces` is present | optional (HostOptions.management, WebManagement.workspaces) | `e2e/browser-smoke.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/model-requests.test.mjs`, `e2e/opencode-source-live.test.mjs` (8 total) |
| R35 | `POST` | `'/api/workspaces'` | `management-routes.ts:17` | json (`readJson`) | `200` | `management.workspaces` is present | optional (HostOptions.management, WebManagement.workspaces) | `e2e/browser-smoke.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/model-requests.test.mjs`, `e2e/opencode-source-live.test.mjs` (8 total) |
| R36 | `PUT` | `'/api/workspaces/selected'` | `management-routes.ts:22` | json (`readJson`) | `200` | `management.workspaces` is present | optional (HostOptions.management, WebManagement.workspaces) | `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/interview-workflow.test.mjs` (13 total) |
| R37 | `PUT` | `^\/api\/workspaces\/([\w-]{1,100})$` | `management-routes.ts:29` | json (`readJson`) | `200` | `workspaceId !== 'selected'` | param-pattern (`[\w-]{1,100}`), order (R36), optional (HostOptions.management, WebManagement.workspaces) | `e2e/browser-smoke.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/model-requests.test.mjs`, `e2e/opencode-source-live.test.mjs` (8 total) |
| R38 | `DELETE` | `^\/api\/workspaces\/([\w-]{1,100})$` | `management-routes.ts:33` | none | `200` | `workspaceId !== 'selected'` | param-pattern (`[\w-]{1,100}`), optional (HostOptions.management, WebManagement.workspaces) | `e2e/browser-smoke.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/model-requests.test.mjs`, `e2e/opencode-source-live.test.mjs` (8 total) |
| R39 | `PUT` | `^\/api\/workspaces\/([\w-]{1,100})\/folder$` | `management-routes.ts:37` | json (`readJson`) | `200` | `workspaceId !== 'selected'` | param-pattern (`[\w-]{1,100}`), optional (HostOptions.management, WebManagement.workspaces) | `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/local-web.test.mjs` (12 total) |
| R40 | `POST` | `'/api/requests'` | `request-routes.ts:64` | json (`readAgentRequest`) | `202` | a controller exists | route-error (`503 REQUESTS_UNAVAILABLE`) | `e2e/request-lifecycle.test.mjs`, `apps/web/tests/web-management.test.mjs`, `packages/host/api/tests/host-api.test.mjs` |
| R41 | `POST` | `^\/api\/requests\/([\w-]{1,100})\/approvals\/([\w-]{1,100})\/decision$` | `request-routes.ts:72` | json (`readJson`) | `200` | `decision` is `allow-once` or `refuse` | param-pattern (`[\w-]{1,100}`, `[\w-]{1,100}`), route-error (`404 APPROVAL_NOT_FOUND`) | `e2e/source-requests.test.mjs`, `e2e/step-approval.test.mjs` |
| R42 | `POST` | `^\/api\/requests\/([\w-]{1,100})\/stop$` | `request-routes.ts:88` | none | `200` | a controller exists | param-pattern (`[\w-]{1,100}`), route-error (`404 REQUEST_NOT_FOUND`) | `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs`, `e2e/generation-continuation-http.test.mjs` (21 total) |
| R43 | `GET` | `^\/api\/requests\/([\w-]{1,100})$` | `request-routes.ts:94` | none | `200` | a controller exists | param-pattern (`[\w-]{1,100}`), route-error (`404 REQUEST_NOT_FOUND`) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/browser-smoke.test.mjs`, `e2e/confirmation-host.test.mjs` (24 total) |
| R44 | `GET` | `^\/api\/requests\/([\w-]{1,100})\/events$` | `request-routes.ts:94` (stream: `:96`) | sse (`openSseStream`) | `200` | a controller exists | param-pattern (`[\w-]{1,100}`), route-error (`404 REQUEST_NOT_FOUND`) | `e2e/artifact-rendering.test.mjs`, `e2e/attachment-storage.test.mjs`, `e2e/deck-pipeline.test.mjs`, `e2e/env-startup.test.mjs`, `e2e/generation-bridge.test.mjs` (26 total) |

## Flag count

| Flag | Count | Routes |
| --- | --- | --- |
| `any-method` | 0 | None. R7 to R9 have no method check in `deck-routes.ts`, but the caller `session-routes.ts:126` limits them to `GET`. |
| `param-pattern` | 31 | R2 to R16, R22 to R25, R28 to R30, R32, R33, R37 to R39, R41 to R44 |
| `order` | 1 | R37. The other route is R36. |
| `optional` | 38 | R1 to R15, R17 to R39 |
| `route-error` | 6 | R1, R40, R41, R42, R43, R44 |
| none | 0 | Every route has at least one flag. |

## Route call order and the checks before it

1. `route` (`index.ts:99`) calls `routeSession` (`index.ts:110`), `routeManagement` (`index.ts:111`, only when `options.management` is present) and `routeRequests` (`index.ts:112`), in this order. When no function returns `true`, `index.ts:113` throws `HttpError(404, 'NOT_FOUND')`. The server callback at `index.ts:87` sends this error with `writeRouteError`.
2. The checks before the route functions, in their order:

| Order | Location | Check | Result |
| --- | --- | --- | --- |
| 1 | `index.ts:100` | `closing` has a value | `503 HOST_CLOSED` |
| 2 | `index.ts:101` | `checkOrigin` (`index.ts:48`) compares `host`, `origin` and `sec-fetch-site` | `403 ORIGIN_DENIED` |
| 3 | `index.ts:103` | `url.search` is not empty | `400 INVALID_REQUEST` |
| 4 | `index.ts:104` | The pathname does not start with `/api/` | `serveAsset` answers the request |
| 5 | `index.ts:108` | The `authorization` header is not `Bearer <token>` | `401 AUTH_REQUIRED` |

3. `serveAsset` (`index.ts:57`) answers every path that does not start with `/api/`, through the call at `index.ts:105`. It answers only a `GET` for a pathname that is an own key of `options.assets` (`index.ts:58`). It adds a sandbox CSP when `asset.sandboxed` is true (`index.ts:60`). Every other request on such a path gets `404 NOT_FOUND`.

## Browser client of each route

| Route | Function in `apps/web/src/browser/transport/` |
| --- | --- |
| R1 | Not called by the Browser. The page loads the assets as page resources. |
| R2 | `ConfirmationClient.confirm` (`confirmation-client.ts:47`) |
| R3 | `BriefClient.interview` (`brief-client.ts:68`) |
| R4 | `BriefClient.snapshot` (`brief-client.ts:61`) |
| R5 | `BriefClient.snapshot` (`brief-client.ts:61`) |
| R6 | `BriefClient.save` (`brief-client.ts:64`) |
| R7 | `DeckClient.snapshot` (`deck-client.ts:83`) |
| R8 | `DeckClient.watch` (`deck-client.ts:165`) |
| R9 | `DeckClient.content` (`deck-client.ts:123`) |
| R10 | `HostClient.outlineImage` (`host-client.ts:195`) |
| R11 | `OutlineClient.snapshot` (`outline-client.ts:58`) |
| R12 | `ManagementClient.uploadAttachment` (`management-client.ts:175`) |
| R13 | Not called by the Browser. |
| R14 | `ManagementClient.removeAttachment` (`management-client.ts:191`) |
| R15 | `ManagementClient.previewAttachment` (`management-client.ts:200`) |
| R16 | `HostClient.history` (`host-client.ts:215`) |
| R17 | `ManagementClient.settings` (`management-client.ts:115`) |
| R18 | `ManagementClient.saveResearch` (`management-client.ts:119`) |
| R19 | `ManagementClient.removeResearch` (`management-client.ts:122`) |
| R20 | Not called by the Browser. |
| R21 | `ManagementClient.saveTheme` (`management-client.ts:130`) |
| R22 | `ManagementClient.save` (`management-client.ts:227`) |
| R23 | `ManagementClient.remove` (`management-client.ts:241`) |
| R24 | `ManagementClient.catalog` (`management-client.ts:244`) |
| R25 | `ManagementClient.researchSources` (`management-client.ts:125`) |
| R26 | `ManagementClient.sessions` (`management-client.ts:134`) |
| R27 | `ManagementClient.create` (`management-client.ts:139`) |
| R28 | `ManagementClient.select` (`management-client.ts:142`) |
| R29 | `ManagementClient.activities` (`management-client.ts:247`) |
| R30 | `ManagementClient.requests` (`management-client.ts:250`) |
| R31 | `ManagementClient.search` (`management-client.ts:146`) |
| R32 | `ManagementClient.draftState` (`management-client.ts:151`) |
| R33 | `ManagementClient.saveDraftState` (`management-client.ts:154`) |
| R34 | `ManagementClient.workspaces` (`management-client.ts:208`) |
| R35 | `ManagementClient.addWorkspace` (`management-client.ts:211`) |
| R36 | `ManagementClient.selectWorkspace` (`management-client.ts:214`) |
| R37 | `ManagementClient.renameWorkspace` (`management-client.ts:217`) |
| R38 | `ManagementClient.removeWorkspace` (`management-client.ts:223`) |
| R39 | `ManagementClient.relinkWorkspace` (`management-client.ts:220`) |
| R40 | `HostClient.send` (`host-client.ts:183`) |
| R41 | `HostClient.decide` (`host-client.ts:152`) |
| R42 | `HostClient.stop` (`host-client.ts:209`) |
| R43 | `HostClient.snapshot` (`host-client.ts:205`) |
| R44 | `HostClient.watch` (`host-client.ts:254`) |

## Items that the columns do not show

1. `management-routes.ts:143` tests `pathname.startsWith('/api/workspaces')`. A pathname such as `/api/workspacesX` enters `routeWorkspaces` (`management-routes.ts:6`), matches no route and returns `false`. The request then ends as `404 NOT_FOUND`. The prefix is wider than the route paths.
2. `serveAsset` matches an exact own key of `options.assets`. It has no directory mapping and no file extension rule. `Object.hasOwn` excludes inherited keys such as `/constructor`.
3. R16 uses `[A-Za-z0-9_-]{1,100}` (`session-routes.ts:151`). Every other session parameter uses `[\w-]{1,100}`. In JavaScript `\w` is `[A-Za-z0-9_]`, so the two classes accept the same characters.
4. The code tests `url.pathname` (`index.ts:102`). `new URL` keeps percent-encoding in `pathname`. A segment with `%20` does not match `[\w-]`, and the request gets `404 NOT_FOUND`.
5. `routeRequests` gets `options.attachments?.maxFiles ?? 0` (`index.ts:112`). The file limit is 0 when `options.attachments` is absent.
6. `routeDeck` has no `req.method` check (Step 1 prints 0). The check at `session-routes.ts:126` limits the three deck routes to `GET`.
7. Three routes write the body without `json`: `serveAsset` (`index.ts:65`), the attachment preview (`session-routes.ts:79`) and the outline image (`session-routes.ts:136`). The attachment preview aborts its read when the client disconnects (`session-routes.ts:75`).
8. A request for `/api/research` or `/api/preferences` gets `404 NOT_FOUND` when the optional object is absent. The branch does not match, and the request falls to `index.ts:113`. R18 to R21 have no `route-error` flag.
9. R12 does not use the body limit of `readJson`. `receiveAttachment` sets the limits of Busboy (`multipart.ts:13`). It reads `expectedRevision` as a field and the file as one stream.
10. The code compares the exact method. A `HEAD` or `OPTIONS` request matches no route, including R1, and gets `404 NOT_FOUND`.
11. Every path regex ends with `$`, and every literal check uses `===`. A trailing slash such as `/api/sessions/` matches no route and gets `404 NOT_FOUND`.

## Limits of the commands

- The search of Step 3 finds a file that contains the segment. It does not prove that a test calls the route or checks its response.
- Several segments are common words: `deck`, `events`, `requests`, `search`, `stop`, `folder`, `selected`, `draft`, `settings` and `research`. The `Tests` cells for their routes include files that may not call the route.
- Step 1 counts text occurrences of `req.method`. It does not count route decisions.
- `git status --short` shows the tracked and the untracked files of this repository. It does not show a change outside the repository.
- This report records the current code. It does not design the Express routes.
