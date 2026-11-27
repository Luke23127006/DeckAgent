# Task 55: Move HTTP helpers into apps/host/src/http and remove packages/host/api

Read this file to learn the steps of Task 55, which moves HTTP helpers into `apps/host/src/http/` and removes `packages/host/api/`.

**Type:** Move or rename

After this task, `packages/host/api/` no longer exists. `apps/host/src/http/` owns the HTTP helpers (`http-error.ts`, `http-io.ts`, `multipart.ts`, `route-params.ts`, `sse.ts`, `contracts.ts`, `route-helpers.ts`) and `startHost` mounts `options.routes` and `options.changes` directly. Targeted `.oxlintrc.json` rules allow `*.routes.ts` and `*.errors.ts` to import `../../http/route-helpers.ts` only, while blocking all other HTTP edge files and keeping `*.service.ts` and `*.store.ts` blocked from `../../http/**`.

**Read first:**

- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `packages/host/api/package.json`, `src/index.ts`, `src/contract-sync.ts`, `src/transport/{contracts.ts,http-error.ts,http-io.ts,multipart.ts,route-params.ts,sse.ts}`
- `apps/host/src/http/{app.ts,change-feed.ts,error-handler.ts,start-host.ts}`
- `apps/host/src/settings-routes.ts`, `apps/host/src/server.ts`, `apps/host/package.json`, `apps/host/tsconfig.json`
- `package.json`, `tsconfig.json`, `.oxlintrc.json`, `scripts/check-boundaries.mjs`
- `tests/oxlint-boundaries.test.mjs`, `tests/check-boundaries.test.mjs`
- `apps/host/tests/fixtures/http-host.mjs`, `apps/host/tests/http-server.test.mjs`, `apps/web/tests/browser-runtime.test.mjs`, `e2e/request-lifecycle.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`

**Files:**

- Create: `apps/host/src/http/route-helpers.ts`
- Move into `apps/host/src/http/`: `packages/host/api/src/transport/{contracts.ts,http-error.ts,http-io.ts,multipart.ts,route-params.ts,sse.ts}`
- Move into `apps/host/src/`: `packages/host/api/src/contract-sync.ts`
- Remove: `packages/host/api/`
- Change: `apps/host/src/http/{app.ts,change-feed.ts,error-handler.ts,start-host.ts}`, `apps/host/src/server.ts`, `apps/host/src/settings-routes.ts`, `apps/host/src/modules/{attachments,chats,deck,providers,research,workspaces}/*.{routes,errors}.ts`, `apps/host/package.json`, `apps/host/tsconfig.json`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.oxlintrc.json`, `scripts/check-boundaries.mjs`
- Test: `apps/host/tests/fixtures/http-host.mjs`, `apps/host/tests/http-server.test.mjs`, `apps/web/tests/browser-runtime.test.mjs`, `e2e/request-lifecycle.test.mjs`, `e2e/attachment-admission.test.mjs`, `e2e/attachment-storage.test.mjs`, `tests/oxlint-boundaries.test.mjs`, `tests/check-boundaries.test.mjs`

**Interfaces:**

- Produces, in `apps/host/src/http/route-helpers.ts`: exports `HttpError`, `json`, `readJson`, `parseCursor`, `readAgentRequest`, `receiveAttachment`, `param`, `params`, `route`, `WORD_ID`, `openSseStream`, and types `HttpErrorDetail`, `HttpFailureResponse`, `HostRouteContext`, `HostRouteRegistrar`, `AttachmentUploadTarget`.
- Produces, in `apps/host/src/http/contracts.ts`: `HostMessage`, `HostOptions` (`mapApplicationFailure`, `failureMessage`, `port`, `routes`, `assets`, `onClose`), `HostRouteContext` (`{ readonly streams: Set<ServerResponse> }`), `HostRouteRegistrar`, `HttpFailureResponse`.
- Changes, in `apps/host/src/http/start-host.ts`: `startHost(options: StartHostOptions)` builds `Router({ caseSensitive: true, strict: true })` and `streams = new Set<ServerResponse>()`, mounts `options.routes` and `options.changes`, and calls `options.onClose?.()` during `close()`.
- Produces, in `apps/host/tests/fixtures/http-host.mjs`: exports `startHost` and `HttpError` from `apps/host/lib/types/http/`.

**STOP when:** `corepack pnpm@11.28.5 install --offline` fails or tries to download a package, or any route match order changes.

**Forbidden:** allow `apps/host/src/modules/*/*.service.ts` or `*.store.ts` to import `../../http/**`. Allow `*.routes.ts` or `*.errors.ts` to import `../../http/app.ts`, `../../http/start-host.ts`, `../../http/error-handler.ts` or `../../http/change-feed.ts`.

## Mapping

| Old | New |
| --- | --- |
| `packages/host/api/src/transport/contracts.ts`, `http-error.ts`, `http-io.ts`, `multipart.ts`, `route-params.ts`, `sse.ts` | `apps/host/src/http/` (same file names) |
| `packages/host/api/src/contract-sync.ts` | `apps/host/src/contract-sync.ts` |

## Move rules

| Item | Rule |
| --- | --- |
| `apps/host/src/http/*.ts` | Replace `@deckagent/host-api` imports with local `./` imports. Pass `mapRunFailure` through `HostOptions` so `apps/host/src/http/` keeps `../runs/**` blocked completely. |
| `apps/host/src/modules/*/*.routes.ts`, `*.errors.ts`, `settings-routes.ts` | Replace `@deckagent/host-api` with `../../http/route-helpers.ts` (or `./http/route-helpers.ts` in `settings-routes.ts`). |
| `apps/host/src/server.ts` | Remove `omitLegacyRoutes` and `@deckagent/host-api` imports. Import `HostOptions` and `HostRouteContext` from `./http/contracts.ts`. Pass `mapRunFailure` in `mapApplicationFailure` chain. |
| `apps/host/package.json`, `package.json`, `tsconfig.json`, `apps/host/tsconfig.json` | Move `busboy` (`1.6.0`) and `@types/busboy` (`1.5.4`) into `apps/host/package.json`. Remove `@deckagent/host-api` and `packages/host/api` references. Remove `packages/host/api/tests/request-failure.test.mjs` from `test:model-requests` in `package.json`. |
| `.oxlintrc.json` | Remove `@deckagent/host-api`, `local-transport.ts` and the `packages/host/api/src/lifecycle` override. In `modules/*/*.routes.ts`, replace `../../http/**` with `../../http/app*`, `../../http/start-host*`, `../../http/error-handler*` and `../../http/change-feed*`. Add `modules/*/*.errors.ts` with the same HTTP pattern and `modules/deck/deck.errors.ts` allowing `@deckagent/deck`. Keep `../../http/**` blocked in `modules/**`, `modules/deck/**`, `*.service.ts` and `deck.service.ts`. |
| `scripts/check-boundaries.mjs` | Update `LIFECYCLE_DIRECTORIES` to `['apps/host/src/runs']` and check imports resolving into `apps/host/src/http` or `node:http`/`node:https`. Remove `TRANSPORT_MODULES`. |
| Test files | Point `e2e/attachment-admission.test.mjs` and `e2e/request-lifecycle.test.mjs` `HttpError` imports to `apps/host/tests/fixtures/http-host.mjs`. Update `apps/host/tests/http-server.test.mjs`, `apps/web/tests/browser-runtime.test.mjs`, `e2e/request-lifecycle.test.mjs`, `e2e/attachment-admission.test.mjs` and `e2e/attachment-storage.test.mjs` to mount `createChatRoutes` / `createRequestRoutes` with `RunController` (or a small history route) via `options.routes` and `onClose`. Update `tests/oxlint-boundaries.test.mjs` and `tests/check-boundaries.test.mjs` with negative fixtures proving `*.routes.ts` rejects `../../http/app.ts` and accepts `../../http/route-helpers.ts`, and `*.service.ts` rejects `../../http/route-helpers.ts`. |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 54 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

- [ ] **Step 2: Move files, remove `packages/host/api/` and apply `Move rules`**

Run `git mv` for each row of `Mapping`. Remove `packages/host/api/` completely so no old `lib/` stays on disk. Create `apps/host/src/http/route-helpers.ts` and apply every row of `Move rules`.

- [ ] **Step 3: Sync the lockfile offline**

Run: `corepack pnpm@11.28.5 install --offline`

Expected: PASS. Exit code 0.

- [ ] **Step 4: Check that no `@deckagent/host-api` reference stays in production code**

Run: `git grep --untracked -n "@deckagent/host-api" -- apps packages e2e package.json tsconfig.json .oxlintrc.json`

Expected: PASS. No line.

- [ ] **Step 5: Format, build and check**

Remove `apps/host/lib` first. Do the step `Format, build and check` of the Task protocol. Run `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`.

Expected: PASS. Output contains `# fail 0`.

- [ ] **Step 6: Run every suite**

Do the step `Run every suite` of the Task protocol.

- [ ] **Step 7: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol. Add the table `Moved files` with the columns `Old path | New path | Symbols`.

- What the commands do not prove: `packages/session/persistence/` still holds SQLite chat, attachment and request tables in one package. A later task splits it into `apps/host/src/db/` and module stores.
- `CHANGELOG.md` line: ``- Move HTTP helpers into `apps/host/src/http/`, move `contract-sync.ts` into `apps/host/src/`, remove `packages/host/api/` and enforce `http/route-helpers.ts` boundaries in oxlint. Task 55 is `Done` in `docs/build/refactor/target-structure/plan/`.``
- Commit message: `refactor: move HTTP helpers into apps/host/src/http and remove packages/host/api`
