# Task 18: Clean the composition root, db/ and root files and check Phase 7

Read this file to track the Phase 7 refactor of `server.ts`, `db/` and the root files of `apps/host/src/`, its completed steps and the Phase 7 exit check.

**Type:** Move or rename and Code (phase-exit task)

**Status:** Done. Implementation, independent review, fixes and all Phase 7 exit checks passed.

This task records work that preceded the task file, as the user requested. It is not a record of test-first implementation.
Read the report before continuing. Do not repeat the completed steps.

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints)
- [Decisions for Revision 7](README.md#revision-7-phase-7-composition-root-db-and-root-files)
- `docs/build/refactor/naming-and-grouping/module-map.md` (`server.ts`, `db/` and the root files)
- `docs/conventions/code.md`, `docs/conventions/project-structure.md` and `docs/conventions/testware.md`
- [Task 18 report](../reports/task-18-clean-composition-root-and-check-phase-7.md)

**Files:**
- Change: `apps/host/src/server.ts`
- Change: `apps/host/src/http/error-handler.ts`, `app.ts`, `route-helpers.ts`, `start-host.ts`, `web-assets.ts`. Rename `http/contracts.ts` to `http/http.types.ts`
- Change: `apps/host/src/db/index.ts`, `approvals.ts`, `request-queries.ts`, `request-sources.ts`, `request-validation.ts`, `run-store.ts`, `runtime-bindings.ts`
- Create: `apps/host/src/db/chat-database.ts`, `chats.migrations.ts`, `records.ts`, `settings-database.ts`, `settings.migrations.ts`
- Remove: `apps/host/src/db/session-database.ts`, `sessions-schema.ts`, `contracts.ts`
- Create: `apps/host/src/modules/settings/` (`index.ts`, `settings.errors.ts`, `settings.routes.ts`, `settings.service.ts`, `settings.store.ts`)
- Create: `apps/host/src/storage/` (`index.ts`, `storage-root.ts`, `credential-store.ts`)
- Remove: `apps/host/src/web-state.ts`, `settings-routes.ts`, `storage-root.ts`, `credential-store.ts`
- Create: `apps/host/src/modules/deck/deck-store.ts`
- Change: services, stores, errors and `index.ts` in `modules/chats/`, `modules/attachments/`, `modules/research/`, `modules/workspaces/`, `modules/providers/` and `modules/deck/`
- Change: `apps/host/src/runs/index.ts`, `runs/lifecycle/index.ts`, `runs/lifecycle/run-controller.ts`, `runtimes/opencode/index.ts`
- Change: `apps/host/src/tools/index.ts`, `tools/executors/*`, `tools/policy/source-access.ts`, `tools/sources/*`. Rename `tools/policy/contracts.ts` to `policy.types.ts` and `tools/sources/attachment-contracts.ts` to `attachment.types.ts`
- Change: `.oxlintrc.json`, `scripts/check-boundaries.mjs` and `package.json` (`test:local-web` only)
- Test: `apps/host/tests/settings-and-error-handler.test.mjs` (new), `chat-persistence.test.mjs`, `run-lifecycle.test.mjs`, `runs-preparation.test.mjs`, `source-access.test.mjs`, `workspace-registry.test.mjs`, `fixtures/b02-helpers.mjs`, `fixtures/session-store.mjs`, `e2e/request-lifecycle.test.mjs`, `tests/check-boundaries.test.mjs`, `tests/oxlint-boundaries.test.mjs`
- Document: `docs/conventions/project-structure.md`, `docs/build/refactor/naming-and-grouping/README.md` and `module-map.md`

**Interfaces:**
- Produces: `ChatDatabase`, `DatabaseError`, `SettingsDatabase`, `SettingsService`, `SqliteSettingsStore`, `SettingsError`, `mapSettingsError`, `createSettingsRoutes`, `createDeckStore` and `AttachmentService.preparedImage`.
- Produces: `runFailureStatuses` and `mapApplicationFailure` in `http/error-handler.ts`, and `admitPassthroughCodes` in `RunController`.
- Keeps: all HTTP paths, status codes and JSON bodies. `sessions.sqlite` and `web.sqlite` on disk.

**STOP when:**
- A Phase 7 check fails on host changes. Fix the defect and run the check again.
- A failure belongs to concurrent `apps/web/` React work. Record the failure and its owner without changing `apps/web/`.

**Forbidden:** Do not change `apps/web/`, `packages/presentation/` or HTTP black-box test expected values.

- [x] **Step 1: Diagnose server.ts, db/ and the root files**

Answer each `Open` item of Phase 7 in the module map. Record the answers in the Revision 7 decision table.

- [x] **Step 2: Move the parts of server.ts that are not wiring**

Move `mapRunFailure` to `http/error-handler.ts`, the admission allowlist to `RunController`, `createDeckStore` to the deck module and the prepared image read to `AttachmentService`.
Remove `mapSessionFailure`. Translate `SESSION_CORRUPT` to `CHAT_UNREADABLE` in the services that read chat rows.

- [x] **Step 3: Rename db/ and move the root files**

Rename `SessionDatabase`, `SessionError`, `db/contracts.ts` and `db/sessions-schema.ts`. Move `web-state.ts` and `settings-routes.ts` to `modules/settings/` and `db/`. Move `storage-root.ts` and `credential-store.ts` to `storage/`.
Rename the `contracts.ts` type files in `http/` and `tools/` to `*.types.ts`.

- [x] **Step 4: Narrow the barrels and update the checks**

Remove each barrel export that no file outside its folder imports. Point tests at internal `lib/` files.
Add `settings` to `ROLE_FILE_MODULES`. Add the `storage/` and `http/` import rules to `.oxlintrc.json` and `project-structure.md`, with tests.

- [x] **Step 5: Run independent review and fix findings**

Run a fresh-context reviewer against `code.md`, `project-structure.md`, `testware.md` and `LESSONS.md`. Fix each finding and run the affected checks again.

- [x] **Step 6: Pass the Phase 7 exit checks**

Run `corepack pnpm@11.28.5 build`, `lint`, `check:boundaries`, `check:docs`, all non-live `test:*` scripts and `test:web` Vitest.
Expected: exit code 0 with zero failures.

- [x] **Step 7: Write the report file and stop**
