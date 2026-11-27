# Naming and Grouping Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of the Naming and Grouping Refactor.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, mark the task `Done` in this file and write the task report file in `../reports/`. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Phase 1 writes the naming rules into the conventions and adds the checks that enforce them. Phase 2 refactors `apps/host/src/modules/chats/` to match those rules and enables `role-file-symbol` for `chats`. Phase 3 refactors `apps/host/src/modules/workspaces/` to match those rules and enables `role-file-symbol` for `workspaces`. Phase 4 refactors `apps/host/src/modules/providers/` and `apps/host/src/modules/research/` to match those rules and enables `role-file-symbol` for `providers` and `research`. Phase 5 refactors the attachments module and runs its exit checks. Phase 6 refactors `apps/host/src/modules/deck/`, removes the `chatSessions` adapter and deck run planning from `server.ts`, and enables `role-file-symbol` for `deck`. Phase 7 reduces `server.ts` to startup, shutdown, configuration and wiring, moves the root files of `apps/host/src/` to their owners, removes HTTP status from `db/` and narrows each barrel.

**Approach:** One revision for each phase of the Naming and Grouping Refactor. The planner does the diagnosis of each phase, and the decision table records every answer. Each task is an execution task.

**Tech stack:** Node.js 22.19.0, pnpm 11.28.5 through `corepack pnpm@11.28.5`, TypeScript 6.0.3, Zod 4.6.7, `node:test`, oxlint 1.94.0, Biome 2.5.15.

**Spec:** [Naming and Grouping Refactor](../README.md), [Naming Rules](../naming-rules.md), [Module Map](../module-map.md).

## Global Constraints

- Shell: Git Bash on Windows. Run each command from the repository root `C:\Users\Duy\Desktop\DeckAgent`.
- Package manager: `corepack pnpm@11.28.5`. Do not call `pnpm` directly.
- Documents in `docs/conventions/` are in Vietnamese. Documents in `docs/build/` are in English. Keep technical terms in English.
- Error messages and check messages are English text that an agent reads. Write them in Simplified Technical English: short sentences and active voice.
- HTTP wire contracts stay the same in Phases 1 to 7. Do not change HTTP paths, status codes or JSON bodies.
- Do not change `apps/web/` or `packages/presentation/` in Phases 1 to 7.
- Do not run the full test suite in a regular task. Run only the tests that cover the changed area. Only a phase-exit task runs the full non-live test suite to find and fix defects.
- Do not add `enum` or `const enum`, `any`, non-`as const` type assertions, lint-disable directives or `@ts-expect-error`.

### Task protocol

Each task obeys this protocol. A task file adds only its special conditions and actions.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in the task.
- The task needs a decision that the task does not contain.
- The same step failed two times.

**Forbidden:**

- Change a file that is not in the `Files` block of the task.
- Remove, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

**Files of each task:** in addition to the `Files` block, each task changes `plan/README.md`, its own task file and `../reports/README.md`, and it creates `../reports/task-NN-<slug>.md`.

**Step `Write the report file and stop`:**

1. Mark the other steps as `- [x]` in the task file. Change the row of the task in this file to `Done` and link `../reports/task-NN-<slug>.md`.
2. Create `../reports/task-NN-<slug>.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`)
   - Files changed
   - Commands run, with exit codes and key output of each command
   - The tables that the task asks for
   - Items that a decision table sent to the report
   - Each STOP and each retry, with the step and the cause. Write `none` when no STOP or retry occurred.
   - What the commands do not prove
3. Add a row for the task in `../reports/README.md` and run `corepack pnpm@11.28.5 check:docs`.
4. Mark this step as `- [x]`, stop, and send the report summary.

## Revision 1: Phase 1, conventions and checks

### Decisions (Revision 1)

| Topic | Decision |
| --- | --- |
| Revision 1 scope | Do not change production code in `apps/` or `packages/`. |
| Place of the table of code names for technical concepts | The section `Naming` of `docs/conventions/code.md`, because the table is a naming rule for code. |
| Form of the role file rule | The rule checks the prefix and the suffix of the main export. `*.service.ts` exports a class `<Name>Service`. `*.store.ts` exports a class `Sqlite<Name>Store`, `Memory<Name>Store` or `<Name>FileStore`. `*.routes.ts` exports a function `create<Name>Routes`. `*.errors.ts` exports a class `<Name>Error` and a function `map<Name>Error`. In the same modules, a class with the suffix `Service` or `Store` outside its role file is a violation. |
| Modules that the role file rule checks | The constant `ROLE_FILE_MODULES` in `scripts/check-boundaries.mjs`, with the initial value `[]`. The snapshot field `roleFileModules` replaces the constant in tests. |
| Rule IDs | `typescript-enum` and `role-file-symbol`. |
| Files that `typescript-enum` checks | Every file that `check:boundaries` reads: production files and test files in `apps/`, `packages/`, `tests/` and `e2e/`. |
| oxlint | Add `"oxc/no-const-enum": "error"` to the top-level `rules` of `.oxlintrc.json`. |
| Language of the conventions | Vietnamese, with the skill `ste-vi` in light mode. |
| Carried item of the Target Structure Refactor | Change the row "Phase 3: remove non-`as const` type assertions, audit comments, rename `*Service` symbols" to follow the role file table in the Coding Guidelines. |

### Review Focus (Revision 1)

- `typescript-enum` misses a `const enum`, or reports an enum in a file that `check:boundaries` does not read. Test: `checkBoundaries rejects an enum and a const enum in source and test files` in [Task 2](task-02-add-enum-and-role-file-checks.md).
- `role-file-symbol` reports a module that is not in the list, so that `check:boundaries` fails on the current code. Test: `checkBoundaries accepts role symbols in a listed module and ignores modules outside the list` in [Task 2](task-02-add-enum-and-role-file-checks.md).
- `role-file-symbol` accepts a `*Service` class in a file that is not a service file. Test: `checkBoundaries rejects role files without their role symbols in a listed module` in [Task 2](task-02-add-enum-and-role-file-checks.md).
- The conventions name a check that does not exist, or say that a rule is enforced when only review enforces it. Owner: [Task 1](task-01-write-naming-rules-into-conventions.md), Step 5.
- The Coding Guidelines and the Project Structure give two different shapes for a module. Owner: [Task 1](task-01-write-naming-rules-into-conventions.md), Step 5.

### Tasks (Revision 1)

| Task | Status | File |
| --- | --- | --- |
| 1 | Done | [Write the naming rules into the conventions](task-01-write-naming-rules-into-conventions.md) ([report](../reports/task-01-write-naming-rules-into-conventions.md)) |
| 2 | Done | [Add the enum check and the role file check](task-02-add-enum-and-role-file-checks.md) ([report](../reports/task-02-add-enum-and-role-file-checks.md)) |

### Phase 1 exit

Phase 1 is done. Tasks 1 and 2 are `Done`, and commit `b77d062` holds their changes. `build`, `lint`, `check:boundaries` (0 violations) and `check:docs` passed. Each of the 19 non-live `test:*` scripts passed with `# fail 0`. The report of Task 2 has the evidence.

## Revision 2: Phase 2, chats module

### Decisions (Revision 2)

| Topic | Decision |
| --- | --- |
| Zod dependency in `apps/host` | Add `"zod": "4.6.7"` to `apps/host/package.json` `dependencies` and run `corepack pnpm@11.28.5 install --offline`. Reason: `message-validation.ts` lives in `apps/host/src/modules/chats/`, and pnpm strict `node_modules` requires an explicit dependency. |
| Message validation split | Split `apps/host/src/modules/chats/message.ts` into `message-validation.ts` (`JsonValue`, `messageSchema`, `Message` from `z.infer`, `decodeMessage`) and `chat-text.ts` (`chatTitle`, `searchWords`, `chatMatches`). Remove `message.ts`. Use Zod 4 `.exactOptional()` on every optional field so `Message` satisfies `exactOptionalPropertyTypes: true` and rejects explicit `undefined`. Check `isJsonValue` on raw input before `messageSchema.safeParse` so non-plain prototypes and symbol keys fail. `SqliteChatStore` imports `Message` and `decodeMessage` from `./message-validation.ts` instead of `../../db/index.ts`. Do not touch `apps/host/src/db/` until Phase 7. |
| Contract body decoders | Add `'INVALID_SESSION'` and `'INVALID_SELECTION'` to `RequestValidationCode` in `packages/host/contracts/src/request-validation.ts`. Add `decodeApprovalDecisionBody` to `request-validation.ts`. Create `packages/host/contracts/src/chat-validation.ts` with `decodeModelSelection`, `decodeChatCreateBody` and `decodeChatSearchBody`. Export all four from `packages/host/contracts/src/index.ts`. Reason: `chats.routes.ts` and `chat-requests.routes.ts` keep exact HTTP 400 error codes (`INVALID_SESSION`, `INVALID_SELECTION`, `INVALID_REQUEST`) with zero hand-written body checks. `web-state.ts` keeps its internal `selection` helper until Phase 7. |
| Chat error class and map | Move `ChatErrorCode` and `ChatError` from `chats.service.ts` into `chats.errors.ts`, and rename `mapChatFailure` to `mapChatError`. Keep `chatStatus` typed as `Readonly<Record<ChatErrorCode, number>>`. Update `confirmation-coordinator.ts` and `server.ts`. |
| Conversation run contribution | Move `createConversationContribution` from `chats.service.ts` into `apps/host/src/modules/chats/chats.run-contribution.ts`. Keep its signature. |
| Run-to-chat request converter | Export `toChatRequest<T extends { readonly owner: RunOwner }>(value: T): Omit<T, 'owner'> & { readonly sessionId: string }` from `chats.service.ts` and re-export it from `chats/index.ts`. Remove `projectRequest` from `chats.service.ts` and `toStoredRequest` from `server.ts`. |
| `ChatRequestService` and `readChatSelection` | Create `apps/host/src/modules/chats/chat-requests.service.ts` with `class ChatRequestService`. Move `readChatSelection` onto `ChatRequestService` as `readSelection(sessionId: string): Promise<ModelSelection>`. Rename `ChatRequestDependencies.sessions` to `chats`. Remove `createChatRequestOperations`, `ChatRequestOperations` and the standalone `readChatSelection`. Rename `request.routes.ts` to `chat-requests.routes.ts` and `createRequestRoutes` to `createChatRequestRoutes`. |
| `ChatService` and `WorkspaceChats` | Replace `createChatOperations`, `ChatOperations` and `createWorkspaceChats` with `export class ChatService implements WorkspaceChats` in `chats.service.ts`. Constructor takes `(store: ChatStore, runs: ChatRuns, registry: WorkspaceLookup, models: ChatModels, marks: ChatMarks)`. Remove `requests` from `ChatStore`, update the comment on `ChatStore` from `SqliteSessionStore` to `SqliteChatStore`, and pass `sessions.chats` and `sessions.runs` directly from `server.ts`. |
| `chatSessions` split in `server.ts` | Move out of `chatSessions` in Phase 2: `chats`, `list`, `create`, `select`, `search`, `ungroup`, `requests.activities` and `requests.list` (`ChatService` uses `sessions.chats` and `sessions.runs` directly, `createWorkspaceOperations` receives `chats`, `ChatRequestService` receives `sessions.chats`, and `prepareGeneration` calls `requests.readSelection`). Stay in `chatSessions` until Phase 6: `getInfo`, `read`, `attachments` and `requests.{activeFor, get, text, sourceCatalogue, researchSources, recordSourceRead}`, because `DeckSessionStore` and `ToolSessionStore` still use them. |
| Public exports of `chats/index.ts` | Export only symbols that callers outside `modules/chats/` import: `ChatError`, `mapChatError`, `ChatService`, `toChatRequest`, `type ChatMarks`, `ChatRequestService`, `createConversationContribution`, `createChatRoutes`, `createChatRequestRoutes`, `SqliteChatStore` and `type ChatStoreOptions`. |
| Role symbol check | Change `ROLE_FILE_MODULES` in `scripts/check-boundaries.mjs` from `[]` to `['chats']`. |

### Review Focus (Revision 2)

- `POST /api/sessions` returns `INVALID_REQUEST` instead of `INVALID_SESSION` on a non-object or unknown key, or returns `INVALID_SESSION` instead of `INVALID_SELECTION` on a bad `selection` object. Test: `chat and approval body decoders validate wire shapes and throw the expected validation codes` in [Task 3](task-03-add-chat-contract-decoders.md).
- `decodeMessage` strips non-plain prototypes or symbol keys before JSON validation, or accepts explicit `undefined` on optional message fields. Test: `message validation rejects unknown fields, explicit undefined, cycles, symbol keys and invalid attachments` in [Task 4](task-04-split-message-validation-and-chat-text.md).
- `ChatRequestService.readSelection` fails to map `SESSION_CORRUPT` to `CHAT_UNREADABLE`, or `ChatRequestService.submit` fails to map `RunFailure('RUN_OWNER_BUSY')` to `ChatError('SESSION_BUSY')`. Test: `ChatRequestService maps run busy errors and unreadable chat errors to ChatError` in [Task 5](task-05-extract-chat-errors-requests-and-contribution.md).
- `ChatService.hasActiveRequest` counts an active run from another workspace, or `ChatService.requests` drops `sessionId` when converting a `RequestRecord`. Test: `ChatService implements WorkspaceChats and projects stored chat requests` in [Task 6](task-06-convert-chat-service-and-routes.md).
- `role-file-symbol` does not include `chats` in `ROLE_FILE_MODULES` by default, so `check:boundaries` misses a regression in `apps/host/src/modules/chats/`. Test: `checkBoundaries rejects role files without their role symbols in a listed module` in [Task 7](task-07-enable-chats-role-check-and-verify-phase-2.md).

### Tasks (Revision 2)

| Task | Status | File |
| --- | --- | --- |
| 3 | Done | [Add chat and approval body decoders to host contracts](task-03-add-chat-contract-decoders.md) ([report](../reports/task-03-add-chat-contract-decoders.md)) |
| 4 | Done | [Split message validation into Zod schema and chat text helpers](task-04-split-message-validation-and-chat-text.md) ([report](../reports/task-04-split-message-validation-and-chat-text.md)) |
| 5 | Done | [Extract ChatError, ChatRequestService and conversation contribution](task-05-extract-chat-errors-requests-and-contribution.md) ([report](../reports/task-05-extract-chat-errors-requests-and-contribution.md)) |
| 6 | Done | [Convert ChatService to a class and wire chat routes](task-06-convert-chat-service-and-routes.md) ([report](../reports/task-06-convert-chat-service-and-routes.md)) |
| 7 | Done | [Enable role-file-symbol for chats and check Phase 2](task-07-enable-chats-role-check-and-verify-phase-2.md) ([report](../reports/task-07-enable-chats-role-check-and-verify-phase-2.md)) |

### Phase 2 exit

Phase 2 is done. Tasks 3 to 7 are `Done` (commits `102366c` and `f0c6c40` hold Tasks 3 to 6, and Task 7 is in the working tree). `build`, `lint`, `check:boundaries` (0 violations with `chats` in `ROLE_FILE_MODULES`) and `check:docs` passed. Each of the 19 non-live `test:*` scripts passed with `# fail 0` (426 tests). Every Phase 2 file passed `biome format`, and a person accepted the `format:check` exception for unrelated files outside Phase 2. The report of Task 7 has the evidence.

## Revision 3: Phase 3, workspaces module

### Decisions (Revision 3)

| Topic | Decision |
| --- | --- |
| Workspace types and error split | Rename `apps/host/src/modules/workspaces/contracts.ts` to `workspace.types.ts` for `defaultWorkspaceId`, `FolderStatus`, `Workspace`, `WorkspaceState` and `FolderRefusal`. Move `WorkspaceErrorCode`, `WorkspaceErrorDetail` and `WorkspaceError` into `workspaces.errors.ts`. Remove `contracts.ts`. |
| Single workspace error class and mapper | Merge `WorkspaceWorkflowError` from `workspaces.service.ts` into `WorkspaceError` in `workspaces.errors.ts`. Add `'WORKSPACE_REQUEST_ACTIVE'` to `WorkspaceErrorCode` and map it to HTTP 409 in `workspaceStatus: Readonly<Record<WorkspaceErrorCode, number>>`. Rename `mapWorkspaceFailure` to `mapWorkspaceError` and keep safe detail filtering (`workspaceName`, `reason`, `allowInside` only). |
| Workspace migrations file | Rename `apps/host/src/modules/workspaces/schema.ts` to `workspaces.migrations.ts` and rename `initialize` to `migrateWorkspacesDatabase`. Keep schema version 2, application ID `0x44415753` and all SQL statements unchanged. Update `.oxlintrc.json` route restrictions and `docs/conventions/project-structure.md` from `schema.ts` to `*.migrations.ts`. |
| Workspace store rename | Rename `WorkspaceRegistry` to `SqliteWorkspaceStore` and `WorkspaceRegistryOptions` to `WorkspaceStoreOptions` in `workspaces.store.ts`. Keep `AddResult` and all store methods unchanged. Keep `WorkspaceLookup = Pick<SqliteWorkspaceStore, 'selectedId' | 'get' | 'folders'>` in `workspaces/index.ts`. |
| Workspace service class | Replace `WorkspaceOperations` and `createWorkspaceOperations` in `workspaces.service.ts` with `export class WorkspaceService` taking `(store: SqliteWorkspaceStore, chats: WorkspaceChats)`. Keep `WorkspaceChats` in `workspaces.service.ts`. Change `createWorkspaceRoutes` to take `workspaces: WorkspaceService`. |
| Public exports of `workspaces/index.ts` | Export only symbols that callers outside `modules/workspaces/` import: `SqliteWorkspaceStore`, `WorkspaceService`, `type WorkspaceChats`, `createWorkspaceRoutes`, `mapWorkspaceError` and `type WorkspaceLookup`. |
| Role symbol check | Change `ROLE_FILE_MODULES` in `scripts/check-boundaries.mjs` from `['chats']` to `['chats', 'workspaces']`. Update existing `workspaces` fixtures in `tests/check-boundaries.test.mjs` to use `SqliteWorkspaceStore` and move the unlisted-module fixture to `providers`. |

### Review Focus (Revision 3)

- `mapWorkspaceError` drops safe detail fields (`workspaceName`, `reason`, `allowInside`), returns a detail key on `WORKSPACE_REQUEST_ACTIVE`, or maps a code to the wrong HTTP status. Test: `WorkspaceError and mapWorkspaceError map codes to HTTP status and safe detail` in [Task 8](task-08-split-workspace-types-errors-and-migrations.md).
- `migrateWorkspacesDatabase` fails to upgrade a schema 1 `workspaces.sqlite` database in place or loses the selected workspace. Test: `schema 1 workspaces.sqlite upgrades to schema 2 in place while keeping workspaces and selection` in [Task 8](task-08-split-workspace-types-errors-and-migrations.md).
- `WorkspaceService.relink` or `WorkspaceService.remove` mutates the store or throws an error other than `WorkspaceError('WORKSPACE_REQUEST_ACTIVE')` when the workspace has an active request. Test: `WorkspaceService blocks relink and remove on active requests and ungroups before publishing` in [Task 9](task-09-convert-workspace-service-and-store.md).
- `WorkspaceService.remove` publishes the `workspaces` change notice before `chats.ungroup(id)` finishes. Test: `WorkspaceService blocks relink and remove on active requests and ungroups before publishing` in [Task 9](task-09-convert-workspace-service-and-store.md).
- `role-file-symbol` omits `workspaces` from default `ROLE_FILE_MODULES`, or a module route imports `./workspaces.migrations.ts` without an oxlint failure. Tests: `checkBoundaries rejects role files without their role symbols in a listed module` and `rejects a store, migrations, the SQL driver and another module store inside a module routes file` in [Task 10](task-10-enable-workspaces-role-check-and-verify-phase-3.md).

### Tasks

| Task | Status | File |
| --- | --- | --- |
| 8 | Done | [Split workspace types, unify WorkspaceError and rename migrations](task-08-split-workspace-types-errors-and-migrations.md) ([report](../reports/task-08-split-workspace-types-errors-and-migrations.md)) |
| 9 | Pending | [Rename SqliteWorkspaceStore, convert WorkspaceService to a class and wire routes](task-09-convert-workspace-service-and-store.md) |
| 10 | Pending | [Enable role-file-symbol for workspaces and check Phase 3](task-10-enable-workspaces-role-check-and-verify-phase-3.md) |

## Revision 4: Phase 4, providers and research modules

### Decisions (Revision 4)

| Topic | Decision |
| --- | --- |
| Parallel phases | Phases 3 and 5 run at the same time as Phase 4. Other executors change `apps/host/src/server.ts`, `apps/host/src/modules/chats/chats.service.ts`, `scripts/check-boundaries.mjs` and `tests/check-boundaries.test.mjs`. In these files, change only the symbols that the task names. Do not revert or reformat a change that the task does not name. |
| Provider error class and map | Move the class `ProviderFailure` from `providers.service.ts` to `providers.errors.ts` as `class ProviderError` with `code: ProviderErrorCode`. `ProviderErrorCode` is the union of the 18 codes of the current `providerStatus` table. Type `providerStatus` as `Readonly<Record<ProviderErrorCode, number>>` and remove the `?? 500` fallback. Rename `mapProviderFailure` to `mapProviderError`. `providers.errors.ts` does not import `providers.service.ts`. |
| Provider check code | Rename the type `ProviderFailure` in `provider-catalog.ts` to `ProviderCheckCode`. `ProviderCheckError` keeps its name and its codes. |
| Provider protocol list | Remove `protocols` from `providers.service.ts`. In `packages/host/contracts/src/management.ts`, export `const providerProtocols = ['chat-completions', 'responses', 'anthropic-messages', 'gemini'] as const` and `type ProviderProtocol = (typeof providerProtocols)[number]`. Export `providerProtocols` from `packages/host/contracts/src/index.ts`. Reason: the wire contract owns `ProviderProtocol`. `apps/web/` keeps its own list until the Browser rewrite. |
| Provider service class | Rename `ProviderConfigurations` to `ProviderService` and `ProviderConfigurationsOptions` to `ProviderServiceOptions`. Remove `ProviderOperations`. `createProviderRoutes` takes `providers: ProviderService`. |
| Public exports of `providers/index.ts` | Export only symbols that callers outside `modules/providers/` import: `SqliteProviderStore`, `ProviderService`, `type ProviderServiceOptions`, `type ProviderConnection`, `listModels`, `validBaseUrl`, `createProviderRoutes` and `mapProviderError`. |
| Research error class and map | Move `ResearchFailure` from `research.service.ts` to `research.errors.ts` as `class ResearchError` with `code: ResearchErrorCode`. `ResearchErrorCode` is the union of the 11 codes of the current `researchStatus` table. Type `researchStatus` as `Readonly<Record<ResearchErrorCode, number>>` and remove the `?? 500` fallback. Rename `mapResearchFailure` to `mapResearchError`. |
| Tavily error code | Add `type TavilyErrorCode` to `tavily.ts` with the 6 codes that `tavily.ts` throws: `'SOURCE_ARGUMENTS_INVALID'`, `'RESEARCH_KEY_REJECTED'`, `'RESEARCH_QUOTA_EXHAUSTED'`, `'RESEARCH_UNAVAILABLE'`, `'RESEARCH_RESPONSE_TOO_LARGE'` and `'RESEARCH_FREE_ONLY'`. `TavilyError.code` has this type. Then `new ResearchError(error.code)` type-checks without a cast. |
| Research ports (the `Open` item of the module map) | Replace `ResearchSessionStore` with two ports in `research.service.ts`. `ResearchChats` has `getInfo(sessionId: string): Promise<unknown>`, and `ChatService` implements it. `ResearchRuns` has `reserveResearch`, `recordResearch` and `researchSources` with the current signatures. Its owner is `runs/`, because the operations write the run store and `SqliteRunStore` in `db/run-store.ts` implements them. `server.ts` passes `chats` and `sessions.runs`. |
| Research service class | Rename `ResearchCoordinator` to `ResearchService` with the constructor `(store: SqliteResearchStore, credentials: CredentialStore, chats: ResearchChats, runs: ResearchRuns, environmentKey: string \| undefined, client: Pick<TavilyClient, 'check' \| 'search' \| 'images'>, onPreferencesChanged?: (version: number) => void)`. Remove `ResearchOperations`. `createResearchRoutes` takes `research: ResearchService`. |
| Public exports of `research/index.ts` | Export only symbols that callers outside `modules/research/` import: `SqliteResearchStore`, `ResearchService`, `type ResearchChats`, `type ResearchSourceRecord`, `ResearchError`, `mapResearchError`, `TavilyClient`, `type ImageSearchCandidate` and `createResearchRoutes`. |
| Deck call sites | Change only the imports and the names of `ResearchFailure` and `ResearchCoordinator` in `apps/host/src/modules/deck/`. Phase 6 owns the other changes of the deck module. |
| Hand validation in providers and research | Do not replace `record()`, `parse` or the configuration checks in Phase 4. The Done criteria of Phase 4 do not include them, and the review row of [Naming Rules](../naming-rules.md#enforcement) still covers them. |
| Role symbol check | Add `'providers'` and `'research'` to the end of `ROLE_FILE_MODULES` in `scripts/check-boundaries.mjs`. Keep the other entries. In the test that ignores modules outside the list, the unlisted fixture is `apps/host/src/modules/deck/deck.service.ts`. |

### Review Focus (Revision 4)

- `mapProviderError` maps a code to a different HTTP status than before, or drops the `detail` of `PROVIDER_ID_TAKEN` or `CATALOG_UNAVAILABLE`. Test: `ProviderError and mapProviderError map codes to HTTP status and detail` in [Task 11](task-11-add-provider-error-check-code-and-protocols.md).
- `providerProtocols` has a different order or a different set of values than the wire type `ProviderProtocol`, so that `cli.ts` refuses a valid model config. Test: `providerProtocols lists the four API protocols of BR-005 V-4` in [Task 11](task-11-add-provider-error-check-code-and-protocols.md).
- `mapResearchError` maps a `TavilyError` directly, or maps `SESSION_NOT_FOUND` to a status other than 404. Test: `ResearchError and mapResearchError map codes to HTTP status and detail` in [Task 13](task-13-add-research-error-and-tavily-codes.md).
- `ResearchService.sources` reads the chat through `ResearchRuns`, or `search` calls `recordResearch` before `reserveResearch`. Test: `ResearchService reads chats through ResearchChats and records sources through ResearchRuns` in [Task 14](task-14-convert-research-service-and-ports.md).
- `role-file-symbol` omits `providers` or `research` from the default `ROLE_FILE_MODULES`. Test: `checkBoundaries applies role symbol checks to providers and research by default` in [Task 15](task-15-enable-providers-research-role-check-and-verify-phase-4.md).

### Tasks (Revision 4)

| Task | Status | File |
| --- | --- | --- |
| 11 | Done | [Add ProviderError, ProviderCheckCode and providerProtocols](task-11-add-provider-error-check-code-and-protocols.md) ([report](../reports/task-11-add-provider-error-check-code-and-protocols.md)) |
| 12 | Done | [Rename ProviderService and narrow the providers index](task-12-convert-provider-service-and-index.md) ([report](../reports/task-12-convert-provider-service-and-index.md)) |
| 13 | Done | [Add ResearchError and the Tavily error codes](task-13-add-research-error-and-tavily-codes.md) ([report](../reports/task-13-add-research-error-and-tavily-codes.md)) |
| 14 | Done | [Convert ResearchService and split the research ports](task-14-convert-research-service-and-ports.md) ([report](../reports/task-14-convert-research-service-and-ports.md)) |
| 15 | Blocked: implementation complete, exit check failed | [Enable role-file-symbol for providers and research and check Phase 4](task-15-enable-providers-research-role-check-and-verify-phase-4.md) ([report](../reports/task-15-enable-providers-research-role-check-and-verify-phase-4.md)) |

## Revision 5: Phase 5, attachments module

The user requested one task for Phase 5 after direct diagnosis and execution. Task 16 records that work and its remaining exit check.

### Decisions (Revision 5)

| Topic | Decision |
| --- | --- |
| Service | `AttachmentService` replaces `AttachmentCoordinator`. Remove `AttachmentOperations`. Routes use the class |
| Errors | One `AttachmentError` replaces `AttachmentFailure`, `AttachmentStorageError` and `DraftError`. Shared database errors stay unchanged |
| HTTP table | Use `Readonly<Record<AttachmentErrorCode, number>>`. Recognize codes from this table. Preserve `REQUEST_EMPTY` at HTTP 500 |
| Internal messages | Store internal messages on the error. Do not expose them through `mapAttachmentError` |
| File storage | `AttachmentFileStore` lives in `attachment-files.store.ts` |
| SQLite metadata | `SqliteAttachmentStore` lives in `attachments.store.ts` |
| Chat port | `AttachmentChats` has `getInfo(id: string): Promise<unknown>`. `ChatService` implements it |
| Metadata dependency | Pass `SqliteAttachmentStore` separately. Do not combine it with the chat port |
| Composition | Reuse one `ChatService` instance for attachments and chat routes |
| Role enforcement | Add `attachments` without removing other modules from `ROLE_FILE_MODULES` |
| Concurrent changes | Stop at failures outside Phase 5. Preserve web, workspace, provider and research work |

### Review Focus (Revision 5)

- Preserve HTTP statuses, private messages and safe detail fields. Test: `attachment errors keep HTTP statuses and hide internal messages`.
- Keep attachments in default role enforcement. Test: `checkBoundaries applies role symbol checks to attachments by default`.
- Keep the chat port separate from attachment metadata. Inspect `AttachmentService` and its production wiring.
- Distinguish related test success from the failed full exit check. Read the Task 16 report.

### Tasks (Revision 5)

| Task | Status | File |
| --- | --- | --- |
| 16 | Blocked: implementation complete, exit check failed | [Refactor attachments and check Phase 5](task-16-refactor-attachments-and-check-phase-5.md) ([report](../reports/task-16-refactor-attachments-and-check-phase-5.md)) |

## Revision 6: Phase 6, deck module

The user requested direct diagnosis and execution before task creation, followed by one Task 17 record and report for Phase 6.

### Decisions (Revision 6)

| Topic | Decision |
| --- | --- |
| Service and private workflows | Replace `createDeckOperations` and `DeckOperations` with `export class DeckService` in `deck.service.ts`. Rename `BriefCoordinator` to `BriefWorkflow` in `brief/brief-workflow.ts` and `ConfirmationCoordinator` to `GenerationConfirmation` in `generation/generation-confirmation.ts`. Both stay private to `modules/deck/`. `createDeckRoutes` takes `DeckService`. |
| Deck errors | Remove `failures.ts`. Move `DeckWorkflowError`, `DeckWorkflowErrorCode`, `OutlineNotFoundReason`, `deckWorkflowErrorCode` and `mapDeckError` into `deck.errors.ts` with `deckWorkflowStatus: Readonly<Record<DeckWorkflowErrorCode, number>>`. Keep `OUTLINE_NOT_FOUND` at HTTP 404 for `restore-outline-missing` and 409 otherwise, keep all `DESIGN_*` codes at 400 (including `DESIGN_SYSTEM_NOT_FOUND`), and keep `@deckagent/deck` `DeckError` mapping unchanged. |
| Capability folders and prompt split | Keep `index.ts`, `deck.service.ts`, `deck.routes.ts`, `deck.errors.ts` and `ports.ts` in the module root. Group the rest into `brief/`, `generation/`, `images/` (adding `image-credit.ts`, `image-research.ts`, `image-review-run.ts`) and `rendering/`. Split `deck-prompts.ts` into `brief/brief-rules.ts`, `brief/brief-tool-protocol.ts` and `brief/brief-prompts.ts`. Rename `deck-tool-session.ts` and `DeckToolSession` to `brief/deck-run-tools.ts` and `DeckRunTools`. |
| Deck run planning and generation preparation | Move `deckPlanner` branching into `DeckService.prepareRun` and move `prepareGeneration` into `generation/generation-preparation.ts`. Use module-private `SelectionPassthrough` so `ChatError` from `readSelection` propagates through `GenerationConfirmation.confirm` without importing `modules/chats/`, keeping the module dependency graph acyclic. |
| Ports and `chatSessions` removal | Replace `DeckSessionStore` with `DeckChats` (implemented by `ChatService`, with `getInfo` returning `ChatInfo \| undefined` and `history`), `DeckAttachments` (implemented by `AttachmentService.sent`) and `DeckRuns` (implemented directly by `SqliteRunStore`). Split `ToolSessionStore` in `apps/host/src/tools/` into `ToolChats`, `ToolAttachmentRecords` and `ToolRuns`. Remove the `chatSessions` adapter from `server.ts`. Keep `createPreparedImageReader` and `createDeckStore` in `server.ts` until Phase 7. |
| Public exports of `deck/index.ts` | Export only symbols imported outside `modules/deck/`: `DeckService`, `createDeckRoutes`, `DeckWorkflowError`, `mapDeckError`, `type DeckAttachments`, `type DeckChats`, `CommonsImages`, `PublicImageReader`, `WebImageResearch`, `type ImageLookup`, `artifactRenderer`, `type ArtifactRenderer` and `type GenerationRuntimeOverride`. Update `apps/host/tests/deck-run-plan.test.mjs` to test through `DeckService`. |
| Role symbol check | Add `'deck'` to `ROLE_FILE_MODULES` in `scripts/check-boundaries.mjs` while keeping existing entries. Move the unlisted fixture in `tests/check-boundaries.test.mjs` to `settings` and add a default `deck` role check test. |

### Review Focus (Revision 6)

- `mapDeckError` preserves HTTP 404 vs 409 for `OUTLINE_NOT_FOUND` reasons, HTTP 400 for `DESIGN_*` codes (including `DESIGN_SYSTEM_NOT_FOUND`), and `DeckError` codes. Test: `DeckWorkflowError and mapDeckError preserve HTTP statuses, reasons and detail fields` in [Task 17](task-17-refactor-deck-and-check-phase-6.md).
- `DeckService.confirm` translates `DeckError` and unexpected failures while preserving `ChatError` from `readSelection` without creating a `chats <-> deck` cycle. Test: `DeckService.confirm translates DeckError and unexpected failures while preserving ChatError from readSelection` in [Task 17](task-17-refactor-deck-and-check-phase-6.md).
- `DeckService.prepareRun` computes all 16 source grant combinations and runs review, restore, image recovery and generation plans through `RunController`. Test: `apps/host/tests/deck-run-plan.test.mjs`.
- `role-file-symbol` includes `deck` by default in `ROLE_FILE_MODULES`. Test: `checkBoundaries applies role symbol checks to deck by default` in `tests/check-boundaries.test.mjs`.

### Tasks (Revision 6)

| Task | Status | File |
| --- | --- | --- |
| 17 | Done | [Refactor deck module and check Phase 6](task-17-refactor-deck-and-check-phase-6.md) ([report](../reports/task-17-refactor-deck-and-check-phase-6.md)) |

### Phase 6 exit

Phase 6 is done. Task 17 is `Done`. `build`, `lint`, `check:boundaries` (`0 violation(s)` with `deck` in `ROLE_FILE_MODULES`), `check:docs`, Biome format on Phase 6 files, all 19 non-live `test:*` scripts and `test:web` Vitest (6 files, 23 tests) passed with zero failures. Independent review findings were fixed and re-verified. The report of Task 17 has the evidence.

## Revision 7: Phase 7, composition root, `db/` and root files

The user requested direct diagnosis and execution, followed by one Task 18 record and report for Phase 7.

### Decisions (Revision 7)

| Topic | Decision |
| --- | --- |
| Run failure statuses | Move `mapRunFailure` from `server.ts` to `http/error-handler.ts`. Use `runFailureStatuses` with one status for each known `RunFailure` code. An unknown `RunFailure` code maps to HTTP 500. `writeRouteError` takes `mapApplicationFailure` for the module error maps. Keep every status and JSON body |
| Corrupt chat rows | Remove `mapSessionFailure` from `db/`. `ChatService`, `ChatRequestService`, `ResearchService` and `AttachmentService` translate `DatabaseError('SESSION_CORRUPT')` to their `CHAT_UNREADABLE` error at HTTP 409 |
| Run admission allowlist | Move the list of admission error codes that pass through from `server.ts` to `admitPassthroughCodes` in `runs/lifecycle/run-controller.ts`. Other admission errors become `REQUEST_NOT_SAVED` |
| Chat database | Rename `SessionDatabase` to `ChatDatabase` (`db/chat-database.ts`) and `SessionError` to `DatabaseError` (`db/records.ts`). Rename `db/contracts.ts` to `db/records.ts` and `db/sessions-schema.ts` to `db/chats.migrations.ts`. Keep `sessions.sqlite` on disk |
| Store wiring | Keep `openChatStorage` in `server.ts`, not exported. It joins stores of two modules and `db/`, and `db/` must not import a module |
| Settings | Replace `web-state.ts` and `settings-routes.ts` with `modules/settings/` (`SqliteSettingsStore`, `SettingsService`, `createSettingsRoutes`, `SettingsError` with `PREFERENCES_STALE` at HTTP 409, `mapSettingsError`). Put the `web.sqlite` connection in `db/settings-database.ts` with `db/settings.migrations.ts`. Add `settings` to `ROLE_FILE_MODULES` |
| Storage layout and credentials | Move `storage-root.ts` and `credential-store.ts` to `storage/` with a barrel. `storage/` imports no module, HTTP, `runs/`, runtime, tool, `db/`, Express or `node:sqlite`. `http/` does not import `storage/` |
| Deck store and prepared images | Move `createDeckStore` to `modules/deck/deck-store.ts`. Replace `createPreparedImageReader` with `AttachmentService.preparedImage` |
| Type files | Rename `http/contracts.ts` to `http/http.types.ts`, `tools/policy/contracts.ts` to `tools/policy/policy.types.ts` and `tools/sources/attachment-contracts.ts` to `tools/sources/attachment.types.ts` |
| Barrels | Each `index.ts` in `apps/host/src/` exports only symbols that a file outside its folder imports. Tests import internal files from `lib/` directly |
| Root files | The root of `apps/host/src/` holds `cli.ts`, `contract-sync.ts` and `server.ts`. The Project Structure gives each one an owner |

### Review Focus (Revision 7)

- `writeRouteError` keeps each `RunFailure` status and detail field. Test: `writeRouteError maps RunFailure statuses, preserves detail, and defaults unknown RunFailure codes to 500` in `apps/host/tests/settings-and-error-handler.test.mjs`.
- Corrupt chat rows give HTTP 409 `CHAT_UNREADABLE` on all read paths. Test: `ChatService, ChatRequestService, ResearchService and AttachmentService translate corrupt SQLite rows to HTTP 409 CHAT_UNREADABLE`.
- Run admission passes only allowed codes. Test: `RunController passes through allowed admission codes and masks storage errors as REQUEST_NOT_SAVED`.
- `storage/` and `http/` import rules. Tests: `tests/oxlint-boundaries.test.mjs`.

### Tasks (Revision 7)

| Task | Status | File |
| --- | --- | --- |
| 18 | Done | [Clean the composition root, db/ and root files and check Phase 7](task-18-clean-composition-root-and-check-phase-7.md) ([report](../reports/task-18-clean-composition-root-and-check-phase-7.md)) |

### Phase 7 exit

Phase 7 is done. Task 18 is `Done`. `build`, `lint`, `check:boundaries` (`0 violation(s)` with `settings` in `ROLE_FILE_MODULES`), `check:docs`, Biome format on Phase 7 files, 80 boundary tests, 10 mutation proofs, all 19 non-live `test:*` scripts and `test:web` Vitest (23 passed) passed with zero failures. Independent review findings were fixed and re-verified. The report of Task 18 has the evidence.
