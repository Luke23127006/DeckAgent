# Naming and Grouping Implementation Plan

Read this file to learn the goal, the decisions, the global constraints and the task order of the Naming and Grouping Refactor.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. After all checks of a task pass, mark the task `Done` in this file and write the task report file in `../reports/`. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Phase 1 writes the naming rules into the conventions and adds the checks that enforce them. Phase 2 refactors `apps/host/src/modules/chats/` to match those rules and enables `role-file-symbol` for `chats`.

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

### Tasks

| Task | Status | File |
| --- | --- | --- |
| 3 | Done | [Add chat and approval body decoders to host contracts](task-03-add-chat-contract-decoders.md) ([report](../reports/task-03-add-chat-contract-decoders.md)) |
| 4 | Done | [Split message validation into Zod schema and chat text helpers](task-04-split-message-validation-and-chat-text.md) ([report](../reports/task-04-split-message-validation-and-chat-text.md)) |
| 5 | Pending | [Extract ChatError, ChatRequestService and conversation contribution](task-05-extract-chat-errors-requests-and-contribution.md) |
| 6 | Pending | [Convert ChatService to a class and wire chat routes](task-06-convert-chat-service-and-routes.md) |
| 7 | Pending | [Enable role-file-symbol for chats and check Phase 2](task-07-enable-chats-role-check-and-verify-phase-2.md) |
