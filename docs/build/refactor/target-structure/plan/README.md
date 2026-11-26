# Target Structure Refactor Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of the Target Structure Refactor.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, mark the task `Done` in this file and write the task report file in `../reports/`. From Task 21, the last step of each task commits and pushes the work. When a STOP condition occurs, do not commit: stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Complete Phase 1 of the Target Structure Refactor, and collect the facts that the design of Phase 2 needs. Phase 1: the conventions describe the target layout, AGENTS.md lists the tech stack, and the four agent core contracts have a written shape. Phase 2: the Local Host serves every current route through Express 5. Phase 3: each domain module lives in `apps/host/src/modules/<name>/`, and each store has a `version` and a change notice.

**Approach:** Revision 1 (Tasks 1 to 6) has two parts. Tasks 1 and 2 change Project Structure [[1]](#ref-1) and the Tech Stack section of AGENTS.md [[2]](#ref-2). Executors follow these files, so the files must not send new code to the old layout. Tasks 3 to 6 are diagnosis tasks that do not change code. Each task covers one agent core contract and ends with STOP. Revision 1b (Tasks 7 and 8) writes the contract shapes from the approved diagnosis reports and checks the Phase 1 exit condition. Revision 2 (Tasks 9 to 12) starts Phase 2 with four diagnosis tasks that do not change code. They cover the routes, the shared HTTP behavior and the error maps, the Host application package and the test baseline. Revision 2b (Tasks 13 to 16) writes the Phase 2 structure decisions into Project Structure and adds tests for the shared HTTP behavior. It also moves the Node code of `apps/web/` into `apps/host/` and measures the Express 5 defaults. Revision 2c (Tasks 17 to 19) serves every route through Express 5.2.1 and adds the folder-level import rules for the HTTP edge and the Browser. Its last task checks the Phase 2 exit condition. Revision 3 (Task 20) starts Phase 3 with a diagnosis of the `workspaces` module that does not change code. Revision 3b (Tasks 21 and 22) moves the `workspaces` module into `apps/host/src/modules/workspaces/` with no change of behavior, and adds the folder-level rules for `apps/host/src/modules/`. Revision 3c (Tasks 23 to 25) adds the change notice contracts and Host `ChangeFeed`, upgrades `workspaces.sqlite` to schema 2 with `version` and `expectedVersion`, and connects the Browser to `GET /api/changes` and `WORKSPACES_STALE`. Revision 3d (Task 26) starts the move of the `chats` module with a diagnosis that does not change code. Revision 3e (Tasks 27 to 29) moves the `chats` module into `apps/host/src/modules/chats/` with no change of behavior. It also gives the chat list one `version` with `chats` notices, and makes the Browser read the chat list again after a newer notice.

**Tech stack:** Windows, Git Bash, Node.js 22.19.0, pnpm 11.28.5 (`corepack pnpm@11.28.5`), TypeScript 6.0.3, oxlint 1.94.0, Biome 2.5.15, Zod 4.6.7, `node:sqlite`, `node:test`, OpenCode 1.19.5.

**Spec:** Target Structure Refactor [[3]](#ref-3), Phases 1 and 2. Inputs: Target Layout [[4]](#ref-4), Current Gap [[5]](#ref-5), Target Structure Criteria [[6]](#ref-6), Libraries [[7]](#ref-7) and Feature Pressure [[8]](#ref-8).

## Decisions

| Topic | Decision |
| --- | --- |
| Workstream and topic | This folder owns `refactor/target-structure`. The phase README is `docs/build/refactor/target-structure/README.md` [[3]](#ref-3). Each phase adds one revision to this folder. |
| Phase 1 start | Task 39 of Module Design Refactor is `Done`. The start condition of Phase 1 is true. |
| Revision 1 scope | Tasks 1 and 2 change documents only. Tasks 3 to 6 read code and write reports only. No task in Revision 1 changes production code, test code, `package.json` or a check script. |
| Project Structure content | Task 1 replaces `docs/conventions/project-structure.md` with the complete text in the task file. The text describes the target layout from Target Layout [[4]](#ref-4), the module shape and the dependency rules. It also gives the rules for old and new code during the move, and the enforcement table. |
| Old and new code during the move | An old folder keeps the ownership of its target folder in the mapping table. New code of an area with old code goes next to the old code until the revision that moves the area. New code of a new area goes to `apps/web/src/features/<name>/` before `apps/host/` exists, and to `apps/host/src/modules/<name>/` after. Only a phase revision of this plan moves an old folder, or creates a target folder for an area with old code. A move updates all callers in the same revision and leaves no re-export file at the old path. A `check:boundaries` rule for an old path stays until the revision that moves the path adds a folder-level rule with a negative fixture. |
| Open points in Project Structure | Two points stay `Open` in Project Structure: the place of `packages/presentation/deck/` (Phase 3 diagnosis decides) and the place of the error-to-HTTP-status map (Phase 2 diagnosis decides). |
| Tech Stack content | Task 2 writes the current tools with the versions from `package.json` and the chosen target libraries without versions. The phase that installs a library pins its version. Drizzle is not chosen [[7]](#ref-7). |
| Where the contract shapes go | Revision 1b writes one ADR with status `Proposed` for each contract in `docs/architecture/30-decisions.md`, and the type shapes and flows in a new file `docs/architecture/10-agent-core.md`. Both files are in Vietnamese, because `docs/architecture/` is not in `docs/build/`. |
| Diagnosis before design | Tasks 3 to 6 collect facts and stop. They do not propose type shapes. The planner writes the shapes in Revision 1b from the approved reports. |
| Product question about old `version` | What a user sees when a write has an old `version` is the open question OQ-061 in `docs/open-questions.md`. Revision 1 adds no new open question. |
| Run owner (Revision 1b) | A run has `RunOwner = { kind, id }` in place of `sessionId`. `runs/` keeps one active run for each owner with a unique index on `(owner_kind, owner_id)`. Different owners run in parallel. The HTTP wire keeps `sessionId` and the current codes. |
| Change notice (Revision 1b) | One `version` and one notice topic for each aggregate that the user sees. Child tables increase the `version` of the parent aggregate. |
| Contract text (Revision 1b) | Task 7 writes the complete Vietnamese texts of `docs/architecture/30-decisions.md`, `docs/architecture/10-agent-core.md` and `docs/architecture/README.md`. The texts are in the task file. |
| ADR status (Revision 2) | ADR-001 to ADR-004 in `docs/architecture/30-decisions.md` keep status `Proposed` until Phase 4. Revision 2 does not change `docs/architecture/`. |
| Revision 2 scope | Tasks 9 to 12 read code, run checks and write reports only. No task in Revision 2 changes production code, test code, `package.json`, a check script or `docs/architecture/`, and no task installs a package. |
| Express defaults list | Task 10 compares the current behavior with a fixed list of Express 5 defaults that the planner took from the Express 5 API reference. The executor does not run Express. A later revision proves each difference with an HTTP test. |
| Host application (Revision 2b) | `apps/host/` is the workspace package `@deckagent/host`. Task 15 moves all Node code of `apps/web/src/` into `apps/host/src/` in one change: `index.ts` becomes `server.ts`, and `features/` and `integrations/` keep their names until Phases 3 and 4. `apps/web/` keeps the Browser code and `src/index.ts`, which is the former `ui-assets.ts` and exports `loadWebAssets`. `@deckagent/host` imports `loadWebAssets` from `@deckagent/local-web`. |
| Route registrars (Revision 2b) | The route files stay in `packages/host/api/src/transport/` until Phase 3. Revision 2c rewrites them as Express routers in place. Each Phase 3 revision moves the routes and the feature code of one module into `apps/host/src/modules/<name>/` together. |
| Error map (Revision 2b) | The error handler in `http/` maps `HttpError`, `RequestFailure` and unknown errors (`500 HOST_ERROR`). Each module owns the map of its own error class, and `server.ts` registers the maps. Phase 2 keeps `local-transport.ts` as one file. Phase 3 splits it by module. Task 13 writes this rule into Project Structure. |
| `helmet` and `multer` (Revision 2b) | Phase 2 does not use them. Phase 2 keeps `setSecurityHeaders` and `multipart.ts` and wraps them as Express middleware. A later revision evaluates `helmet` after the header tests of Task 14 exist. The `attachments` move in Phase 3 decides `multer`. |
| HTTP contract during Phase 2 | The Express app keeps the current contract. Paths match with exact letter case and without a trailing slash. Responses have no `X-Powered-By` and no `ETag`. An unknown path gets a JSON `404 NOT_FOUND` body, and `HEAD` and `OPTIONS` get `404`. A query string gets `400 INVALID_REQUEST`. Each path parameter keeps its current character class. Task 16 measures which Express settings this needs. |
| Paths in `docs/architecture/` (Revision 2b) | Task 15 changes the code paths in `docs/architecture/10-agent-core.md` that the move makes wrong. It does not change the ADR status. |
| Express code (Revision 2c) | `apps/host/src/http/` holds the Express app, the shared checks, the error handler and `startHost`. `@deckagent/host-api` exports `createHostRoutes`, which builds the `RequestController` and registers the four route registrars in the current match order. `startHost` is no longer a package export. Tests outside `apps/host/` import it from the fixture `apps/host/tests/fixtures/http-host.mjs`. |
| Express versions (Revision 2c) | `express` 5.2.1 and `@types/express` 5.0.6 in `@deckagent/host-api` and `@deckagent/host`. Task 16 measured 5.2.1. |
| Path parameter classes (Revision 2c) | The middleware `params()` checks each class and calls `next('route')` on a mismatch, because Express 5.2.1 rejects a regular expression in a route path. A `%` in an `/api/` path gets `404 NOT_FOUND` before the router. |
| Folder-level rules (Revision 2c) | One `no-restricted-imports` override for `apps/host/src/http/`, and `@deckagent/host` in the Browser override. Each has negative fixtures in `tests/oxlint-boundaries.test.mjs`. |
| Workspaces schema upgrade (Revision 3) | The move of `workspaces` upgrades an existing `workspaces.sqlite` from schema 1 to schema 2 in place, in one transaction at startup, as `packages/session/persistence/src/schema.ts` does. Existing workspaces, names and the selection stay. |
| Change feed (Revision 3) | The revision that moves `workspaces` also builds the `ChangeFeed` of ADR-004 in `apps/host/src/http/` and its SSE route for the topic `workspaces`. Later modules add a topic only. |
| Revision 3 scope | Task 20 reads code, runs `git grep` and writes a report only. It changes no code, no test, no `package.json` and no file in `docs/architecture/`. |
| Commit | Tasks 1 to 20: executors do not commit or push, and a person commits after approving the report. From Task 21: the last step of each task adds a `CHANGELOG.md` line, commits and pushes, with the exact commands of the step. A task with a STOP condition has no commit. A person approves the report before the next task starts. |
| Revision 3b scope | Task 21 moves the code of the `workspaces` module and keeps the HTTP contract. Task 22 adds the folder-level rules for `apps/host/src/modules/`. The `version`, the schema 2, `expectedVersion`, `WORKSPACES_STALE`, the `ChangeFeed` and the Browser changes are in Revision 3c. |
| Module files (Revision 3b) | `apps/host/src/modules/workspaces/` has `workspaces.store.ts` (the former `registry.ts`, class name `WorkspaceRegistry`), `workspaces.service.ts`, `workspaces.routes.ts`, `workspaces.errors.ts` and `index.ts`. The helper files `contracts.ts`, `folder-policy.ts`, `schema.ts` and `workspace-name.ts` keep their names. Code outside the module imports `index.ts` only. |
| Module routes (Revision 3b) | A module exports a function that returns an Express `Router`. `server.ts` gives the routers in `HostOptions.routes`, and `createHostRoutes` mounts them after the management routes. `server.ts` registers the error map of the module before `mapApplicationFailure`. |
| Route helpers (Revision 3b) | `@deckagent/host-api` exports `json`, `readJson`, `param`, `params` and `route` until the last route registrar leaves `packages/host/api/`. That revision moves the helpers into `apps/host/src/http/`. |
| Calls between modules (Revision 3b) | The workspaces service receives the port `WorkspaceChats`, which the chats feature implements. `chats` and `sources` receive `WorkspaceLookup`, which has only the methods that they call. |
| SSE route for change notices (Revision 3c) | One stream for all topics with the key `'host'`: `GET /api/changes`, with the event `change` and the data `{ topic, key, version }`. On connect, the Host sends the current `version` of each topic. A later module adds a topic to this stream and opens no new connection. |
| Stale write of workspaces (Revision 3c) | When a write gets `WORKSPACES_STALE`, the Browser reads the list again, shows the new list and shows a message. The Browser does not send the write again. |
| Initial version and required expectedVersion (Revision 3c) | `change_versions` starts at `version = 0` for `('workspaces', 'host')` on both a new database and a schema 1 upgrade, matching `brief`, `deck` and `draft`. All five workspace write HTTP routes require `expectedVersion` (a non-negative safe integer) in a strict JSON body (`400 INVALID_REQUEST` if absent or malformed). `WorkspaceRegistry` methods accept optional `expectedVersion?: number` for direct unit tests. |
| Shared SSE stream cap (Revision 3c) | `GET /api/changes` mounts in `startHost` through `StartHostOptions.changes` and uses `routes.streams` via `openSseStream`, so change streams share the 64-stream limit (`429 TOO_MANY_STREAMS`) and close on `host.close()`. |
| Revision 3d scope | Task 26 reads code, runs `git grep` and writes a report only. It changes no code, no test, no `package.json` and no file in `docs/architecture/`. The design of the `chats` move waits for the approved report. |
| Revision 3e scope | Task 27 moves the chats feature, the four chat routes (`GET /api/sessions`, `POST /api/sessions`, `PUT /api/sessions/:sessionId/selection`, `POST /api/sessions/search`), the chat projection and the chat error map, and keeps the HTTP contract. Task 28 adds schema 8 of `sessions.sqlite` and the `chats` notices. Task 29 changes the Browser. |
| Chats store (Revision 3e) | `SqliteSessionStore` stays in `packages/session/persistence/`, because `RequestLog` writes `messages` and `sessions.updated_at` in the transactions of `admit` and `settle`, and the request and attachment tables have foreign keys to `sessions`. The module declares the ports `ChatStore`, `ChatModels` and `ChatMarks`. A later revision splits the package when `runs/` and `attachments` move. `GET /api/sessions/:sessionId/history` stays in `packages/host/api/` until then. |
| Chats version (Revision 3e) | One row `('chats', 'host')` in `change_versions` of `sessions.sqlite`, not one row for each workspace. `GET /api/sessions` returns the chats of every workspace in one list, a chat can have no workspace, and an ungroup moves a chat between two keys. The reply of `GET /api/sessions` does not change. The Browser keeps the version of the last `chats` notice that it handled. |
| No stale check for chats (Revision 3e) | Chat writes take no `expectedVersion`, and no code `CHATS_STALE` exists. Each message of each chat increases the version of the list. A check would then refuse a create or a model change with no real conflict. Task 28 records this exception in ADR-004 and in `docs/architecture/10-agent-core.md`. |
| Fields outside the chats version (Revision 3e) | `hasDraft`, `activeRequestId`, `hasSlides` and `selectable` come from other stores and do not increase the chats version. The Browser keeps its current reads for them. |
| Chats and the session database (Revision 3d) | `packages/session/persistence/` holds the stores of `modules/chats/`, `modules/attachments/` and `runs/` in one database. Task 26 records which member of `SqliteSessionStore` reads and writes which table. It does not split the package. |

## Global Constraints

- Shell: PowerShell 5.1 or Git Bash on Windows. Run every command from the repository root `C:/Users/Duy/Desktop/DeckAgent`. The commands of Revision 2c use only `git`, `node` and `corepack pnpm@11.28.5`, so they run in both shells. When a step names a shell-specific form, write the form that you ran in the report.
- Package manager: `corepack pnpm@11.28.5`. Do not run `pnpm` without `corepack`. Do not install packages, except with the exact install command of a task step.
- Docs check: `corepack pnpm@11.28.5 check:docs`. PASS: the output contains `0 error(s)`. FAIL: the output contains `error(s)` with a number above 0.
- Language: files in `docs/build/` are in English. Files in `docs/conventions/`, `docs/architecture/` and `AGENTS.md` are in Vietnamese and keep English technical terms.
- Each new file in `docs/` starts with an H1 and one purpose sentence. English files use `Read this file to ...`. Vietnamese files use `Đọc file này để biết ...`.
- Each new file in `docs/` must have a link from the nearest `README.md`.
- Do not create a Markdown file that the `Files` block of the task does not list.
- Do not change production code, test code, `package.json`, `.oxlintrc.json` or a file in `scripts/` in Revision 1.
- Do not change `docs/build/refactor/target-structure/README.md` or the research files next to it.
- Do not add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit and push only in the last step of a task, with the exact commands of that step, and only when no STOP condition occurred. Do not use `--force`. Do not skip a hook with `--no-verify`. Do not add a `Co-Authored-By` line or another AI attribution to the commit message. Tasks 1 to 20 have no commit step.
- Start a task only when `git status --short` prints no line. A check that reads a commit, for example `git grep` or `git diff <commit>`, does not see a file with no commit.
- Write reports in English with `asd-ste100` strict mode. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py <report-file>` on each report. When `python` is not available, run the same script with `python3` or `python3.12`.

## Review Focus

These are the six failure modes most likely in Revision 1. No automated test covers them, so the reviewer checks them by hand.

1. Project Structure still sends new code to an old folder, for example a new Host route to `packages/host/api/src/transport/`. Owner: [Task 1](task-01-update-project-structure.md), Step 3 checks the mapping table.
2. Project Structure drops an old boundary rule before a replacement check exists. Owner: [Task 1](task-01-update-project-structure.md), Step 3 checks the enforcement table.
3. The run owner diagnosis misses a `sessionId` use that enforces the rule "one active request for each chat". Owner: [Task 3](task-03-diagnose-run-owner.md), Step 1 counts every site.
4. The runtime diagnosis lists failure codes but not where each code comes from, so the error categories in Revision 1b have no evidence. Owner: [Task 4](task-04-diagnose-agent-runtime-port.md), Step 2 records the origin of each code.
5. The run preparation diagnosis misses a part that the code builds under another name, for example `seedPrompt` in `history.ts`. The search by name finds it only by chance. Owner: [Task 5](task-05-diagnose-run-preparation.md), Step 2 reads the files in full.
6. The change notice diagnosis misses a store that writes user-visible state without a `version`. Owner: [Task 6](task-06-diagnose-change-notice.md), Step 1 lists every file that runs SQL.

Revision 1b adds these failure modes:

7. A contract type in `10-agent-core.md` keeps a `sessionId` field. Owner: [Task 7](task-07-write-agent-core-contracts.md), Step 5 counts `sessionId:`.
8. An ADR states a fact that the diagnosis reports do not contain. Owner: [Task 7](task-07-write-agent-core-contracts.md). No check covers it, so the reviewer compares each `Bối cảnh` section with its report.

Revision 2 adds these failure modes:

9. The route inventory misses a route that a branch answers without a method check, for example the deck routes. Owner: [Task 9](task-09-inventory-http-routes.md), Step 1 counts the method checks and Step 2 reads the files in full.
10. A path parameter keeps its current character class only by chance after the move, because Express accepts any character other than `/`. Owner: [Task 9](task-09-inventory-http-routes.md), flag `param-pattern`.
11. A shared behavior has no test, so the move to middleware can drop it with no failed test. Owner: [Task 10](task-10-diagnose-shared-http-behavior.md), `Not found` in the `Tests` column.
12. An e2e test imports `@deckagent/local-web` directly, so a move of the composition root changes the test. Owner: [Task 11](task-11-diagnose-host-application-package.md), Step 3.
13. A suite fails before Phase 2 changes code, and a later task reports the failure as a regression. Owner: [Task 12](task-12-record-http-test-baseline.md).

Revision 2b adds these failure modes:

14. A characterization test passes on any server, so it cannot catch a lost behavior. Owner: [Task 14](task-14-add-http-edge-characterization-tests.md), Step 5 breaks two behaviors and expects two failed tests.
15. A test or a script names a path of the old place, for example `apps/web/lib/cli.js`, and still passes because an old build output is on disk. Owner: [Task 15](task-15-move-node-code-to-apps-host.md), Step 6 removes `apps/web/lib/` before the build.
16. A Host test stays in `apps/web/tests/` and imports Host code across the application boundary. Owner: [Task 15](task-15-move-node-code-to-apps-host.md), the test move table.
17. The Express configuration of Revision 2c relies on a default that Express 5.2.1 does not have. Owner: [Task 16](task-16-measure-express-5-defaults.md), the `Match` column.

Revision 2c adds these failure modes:

18. A route registrar registers a route whose parameter class is wider than the current class, for example `:id` without `params()`. Owner: [Task 17](task-17-serve-routes-through-express.md), the route rules table and `test:http-edge`.
19. A test outside `apps/host/` still imports `startHost` from `@deckagent/host-api` through a dynamic import, which a text search misses. Owner: [Task 17](task-17-serve-routes-through-express.md), Step 7 runs every suite.
20. A new lint rule passes on every input, so it cannot catch a wrong import. Owner: [Task 18](task-18-add-folder-import-rules.md), Step 4 breaks each rule and expects three failed tests.
21. The exit check counts a changed expected value as a path change. Owner: [Task 19](task-19-check-phase-2-exit.md), Step 4. No check covers this case, so the reviewer reads the import and path lines of the diff.

Revision 3 adds these failure modes:

22. The diagnosis misses a caller of the registry outside `apps/host/src/features/workspaces/`, so the move breaks a caller in another module. Owner: [Task 20](task-20-diagnose-workspaces-module.md), Step 3.
23. A write to `workspaces` or `registry_state` runs outside `this.transaction`, so a later `version` increase is not in the same transaction as the write. Owner: [Task 20](task-20-diagnose-workspaces-module.md), the column `Inside this.transaction` of Step 5.

Revision 3b adds these failure modes:

24. `createHostRoutes` mounts the workspaces router at another place in the route order, so a request reaches another route or `404 NOT_FOUND`. Owner: [Task 21](task-21-move-workspaces-module.md), `test:local-foundation` and `test:http-edge` in Step 7.
25. A caller still imports `@deckagent/workspace-registry`, and the build passes because the old `lib/` output is on disk. Owner: [Task 21](task-21-move-workspaces-module.md), Step 3 removes `packages/workspace/` with its `lib/`.
26. The error map of the module runs after `mapApplicationFailure`, so another branch maps a workspace error first. Owner: [Task 21](task-21-move-workspaces-module.md), the `Move rules` table. No test covers this case, so the reviewer reads `server.ts`.
27. A later oxlint override replaces the groups of an earlier override for the same file. Then a routes file can import the store of another module. Owner: [Task 22](task-22-add-module-folder-rules.md), the routes fixture with `../chats/chats.store.ts`.
28. A new module rule passes on every input. Owner: [Task 22](task-22-add-module-folder-rules.md), Step 5 breaks the rules and expects failed tests.

Revision 3c adds these failure modes:

29. `decodeWorkspaceAddBody` or `decodeWorkspaceRenameBody` uses `z.string()` for `folder` or `name`, so an invalid folder or long name gets `400 INVALID_REQUEST` instead of `WORKSPACE_FOLDER_INVALID` or `WORKSPACE_NAME_TOO_LONG`. Owner: [Task 23](task-23-add-change-contracts-and-feed.md), `packages/host/contracts/tests/validation.test.mjs`.
30. `GET /api/changes` uses its own stream set instead of `routes.streams`, so open change streams bypass the 64-stream cap or hang `host.close()`. Owner: [Task 23](task-23-add-change-contracts-and-feed.md), `apps/host/tests/change-feed.test.mjs`.
31. A schema 1 `workspaces.sqlite` upgrade drops existing workspaces or `selected`, or runs outside one transaction. Owner: [Task 24](task-24-add-workspaces-version-and-notices.md), `apps/host/tests/workspace-registry.test.mjs`.
32. `remove` publishes the `workspaces` notice before `chats.ungroup` finishes, so another tab reads chats before they ungroup. Owner: [Task 24](task-24-add-workspaces-version-and-notices.md), `e2e/local-foundation.test.mjs`.
33. On `WORKSPACES_STALE`, the Browser sends the write again or keeps the old workspace list on screen. Owner: [Task 25](task-25-connect-browser-to-changes-and-stale-workspaces.md), `e2e/browser-smoke.test.mjs`.

Revision 3d adds these failure modes:

34. The diagnosis misses a write to `sessions` that a request makes through `appendMessages`, so a later `chats` notice does not go out when a reply changes `updatedAt` or `title`. Owner: [Task 26](task-26-diagnose-chats-module.md), Step 6 and the table `List fields` of Step 7.
35. The diagnosis counts a call on `RequestStore` or `RuntimeSessionAccess` as a call on the chat store, because the method names are the same (`append`, `bind`, `read`). Owner: [Task 26](task-26-diagnose-chats-module.md), the column `Receiver type` of Step 4.
36. A field of the chat list comes from a store other than `sessions`, for example `hasDraft` or `activeRequestId`, and the diagnosis does not record it. Then the design gives the topic `chats` a `version` that does not change when the list changes. Owner: [Task 26](task-26-diagnose-chats-module.md), Step 7.

Revision 3e adds these failure modes:

37. The chats router mounts at another place, so a session route catches a chat path or the path gets `404 NOT_FOUND`. Owner: [Task 27](task-27-move-chats-module.md), `test:http-edge` and `test:local-web`.
38. `GET /api/sessions` loses `activeRequestId`, because `withActive` left `@deckagent/host-api`. Owner: [Task 27](task-27-move-chats-module.md), the new assertion in `e2e/model-requests.test.mjs`. No test checks `activeRequestId` in `POST /api/sessions/search`, so the reviewer reads `chats.service.ts`.
39. A `chats` notice goes out before the commit, or after a write that failed. Owner: [Task 28](task-28-add-chats-version-and-notices.md), `packages/session/persistence/tests/chat-persistence.test.mjs` and the break step.
40. A request writes a message and the chats version does not change, so another tab keeps an old title or time. Owner: [Task 28](task-28-add-chats-version-and-notices.md), the `admit` call of the test `each chat write increases the chats version once`.
41. Each start of DeckAgent increases the chats version, although `ungroupExcept` changes no row. Then each Browser reads the list again with no change. Owner: [Task 28](task-28-add-chats-version-and-notices.md), the test `a write that changes no chat, or that fails, keeps the chats version`.
42. A `chats` notice does not refresh the Browser list, or opens the new chat. Owner: [Task 29](task-29-refresh-browser-chat-list-from-notices.md), `e2e/browser-smoke.test.mjs`.

## Tasks

| Task | Status | File |
| --- | --- | --- |
| 1 | Done | [Update Project Structure to the target layout](task-01-update-project-structure.md) ([report](../reports/task-01-update-project-structure.md)) |
| 2 | Done | [Write the Tech Stack section of AGENTS.md](task-02-write-tech-stack.md) ([report](../reports/task-02-write-tech-stack.md)) |
| 3 | Done | [Diagnose the run owner](task-03-diagnose-run-owner.md) ([report](../reports/task-03-diagnose-run-owner.md)) |
| 4 | Done | [Diagnose the AgentRuntime port](task-04-diagnose-agent-runtime-port.md) ([report](../reports/task-04-diagnose-agent-runtime-port.md)) |
| 5 | Done | [Diagnose run preparation](task-05-diagnose-run-preparation.md) ([report](../reports/task-05-diagnose-run-preparation.md)) |
| 6 | Done | [Diagnose the change notice and version](task-06-diagnose-change-notice.md) ([report](../reports/task-06-diagnose-change-notice.md)) |
| 7 | Done | [Write the agent core contracts](task-07-write-agent-core-contracts.md) ([report](../reports/task-07-write-agent-core-contracts.md)) |
| 8 | Done | [Check the Phase 1 exit condition](task-08-check-phase-1-exit.md) ([report](../reports/task-08-check-phase-1-exit.md)) |
| 9 | Done | [Inventory the HTTP routes](task-09-inventory-http-routes.md) ([report](../reports/task-09-inventory-http-routes.md)) |
| 10 | Done | [Diagnose the shared HTTP behavior and the error maps](task-10-diagnose-shared-http-behavior.md) ([report](../reports/task-10-diagnose-shared-http-behavior.md)) |
| 11 | Done | [Diagnose the Host application package](task-11-diagnose-host-application-package.md) ([report](../reports/task-11-diagnose-host-application-package.md)) |
| 12 | Done | [Record the test baseline before Phase 2](task-12-record-http-test-baseline.md) ([report](../reports/task-12-record-http-test-baseline.md)) |
| 13 | Done | [Record the Phase 2 structure decisions in Project Structure](task-13-record-phase-2-structure-decisions.md) ([report](../reports/task-13-record-phase-2-structure-decisions.md)) |
| 14 | Done | [Add the HTTP edge characterization tests](task-14-add-http-edge-characterization-tests.md) ([report](../reports/task-14-add-http-edge-characterization-tests.md)) |
| 15 | Done | [Move the Node code of the web app into apps/host](task-15-move-node-code-to-apps-host.md) ([report](../reports/task-15-move-node-code-to-apps-host.md)) |
| 16 | Done | [Measure the Express 5 defaults](task-16-measure-express-5-defaults.md) ([report](../reports/task-16-measure-express-5-defaults.md)) |
| 17 | Done | [Serve every route through Express](task-17-serve-routes-through-express.md) ([report](../reports/task-17-serve-routes-through-express.md)) |
| 18 | Done | [Add the folder-level import rules for the HTTP edge and the Browser](task-18-add-folder-import-rules.md) ([report](../reports/task-18-add-folder-import-rules.md)) |
| 19 | Done | [Check the Phase 2 exit condition](task-19-check-phase-2-exit.md) ([report](../reports/task-19-check-phase-2-exit.md)) |
| 20 | Done | [Diagnose the workspaces module](task-20-diagnose-workspaces-module.md) ([report](../reports/task-20-diagnose-workspaces-module.md)) |
| 21 | Done | [Move the workspaces module into apps/host/src/modules](task-21-move-workspaces-module.md) ([report](../reports/task-21-move-workspaces-module.md)) |
| 22 | Done | [Add the folder-level rules for apps/host/src/modules](task-22-add-module-folder-rules.md) ([report](../reports/task-22-add-module-folder-rules.md)) |
| 23 | Done | [Add the change notice contracts, workspace body schemas and Host ChangeFeed](task-23-add-change-contracts-and-feed.md) ([report](../reports/task-23-add-change-contracts-and-feed.md)) |
| 24 | Done | [Add version, schema 2 upgrade, expectedVersion and ChangeFeed wiring to the workspaces module](task-24-add-workspaces-version-and-notices.md) ([report](../reports/task-24-add-workspaces-version-and-notices.md)) |
| 25 | Done | [Connect the Browser to /api/changes and handle WORKSPACES_STALE](task-25-connect-browser-to-changes-and-stale-workspaces.md) ([report](../reports/task-25-connect-browser-to-changes-and-stale-workspaces.md)) |
| 26 | Done | [Diagnose the chats module](task-26-diagnose-chats-module.md) ([report](../reports/task-26-diagnose-chats-module.md)) |
| 27 | Pending | [Move the chats module into apps/host/src/modules](task-27-move-chats-module.md) |
| 28 | Pending | [Add the chats version and change notices](task-28-add-chats-version-and-notices.md) |
| 29 | Pending | [Refresh the Browser chat list from chats notices](task-29-refresh-browser-chat-list-from-notices.md) |

## Next revision

After a person approves the reports of Tasks 27 to 29, the `chats` move is complete. The next revision starts the diagnosis of the next Phase 3 module.

A later revision decides `helmet`, with the header tests of Task 14 as evidence.

## References

1. <a id="ref-1"></a>[Project Structure](../../../../conventions/project-structure.md)
2. <a id="ref-2"></a>[Project: DeckAgent](../../../../../AGENTS.md)
3. <a id="ref-3"></a>[Target Structure Refactor](../README.md)
4. <a id="ref-4"></a>[Layout đích](../target-layout.md)
5. <a id="ref-5"></a>[Khoảng cách hiện tại](../current-gap.md)
6. <a id="ref-6"></a>[Tiêu chí của cấu trúc đích](../criteria.md)
7. <a id="ref-7"></a>[Thư viện](../libraries.md)
8. <a id="ref-8"></a>[Áp lực từ feature còn thiếu](../feature-pressure.md)
