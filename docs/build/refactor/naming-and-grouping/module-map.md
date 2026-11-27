# Module Map

Read this file to know the target name of each symbol and file in `apps/host/src/`.

The file also gives the parts of `server.ts` that move to their owners, and the order of the revisions.

The rules are in [Naming Rules](naming-rules.md). The problems are in [Naming and Grouping Problems](problems.md). Every target name is `Proposed` until the revision of that module starts. Wire paths, status codes and JSON bodies do not change in these revisions, as the [rules for the move](../../../conventions/project-structure.md#trong-lúc-chuyển) of the Project Structure require [[1]](#ref-1).

## `modules/chats/`

| Current | Target | Problems |
| --- | --- | --- |
| `createChatOperations`, `ChatOperations` in `chats.service.ts` | `class ChatService` in `chats.service.ts` | NG-01, NG-02 |
| `createWorkspaceChats` | Methods `hasActiveRequest(workspaceId)` and `ungroup(workspaceId)` on `ChatService`. `ChatService` implements the port `WorkspaceChats`, so the adapter goes away | NG-05 |
| `createChatRequestOperations`, `ChatRequestOperations`, `ChatRunOperations`, `ChatRequestDependencies`, `DeckRunPlanner`, `readChatSelection` | `class ChatRequestService` in `chat-requests.service.ts` with `readSelection(sessionId)`. It has dependencies (runs, providers, deck planner) that `ChatService` does not have | NG-05 |
| `request.routes.ts`, `createRequestRoutes` | `chat-requests.routes.ts`, `createChatRequestRoutes`. The paths `/api/requests/...` stay | NG-05 |
| `createConversationContribution` in `chats.service.ts` | Same name, in `chats.run-contribution.ts` | NG-05, NG-07 |
| `ChatWorkflowError`, `ChatWorkflowErrorCode` in `chats.service.ts`. `mapChatFailure` in `chats.errors.ts` | `ChatError`, `ChatErrorCode` and `mapChatError` in `chats.errors.ts` | NG-06 |
| `message.ts`: `isValidMessage` and the type guards | `message-validation.ts`: `messageSchema = z.discriminatedUnion('role', [...])` and `decodeMessage`. The `Message` type comes from `z.infer` | NG-08, NG-10 |
| `message.ts`: `chatTitle`, `searchWords`, `chatMatches` | `chat-text.ts`. The store and the service use it | NG-09 |
| Hand checks of the body in `chats.routes.ts` (`isRecord`, `searchWords`), `request.routes.ts` (approval decision) and `decodeSelection` callback | `decodeChatCreateBody`, `decodeChatSearchBody`, `decodeModelSelection` and `decodeApprovalDecisionBody` in the contracts package | NG-10, NG-20 |
| `projectRequest` in `chats.service.ts` and `toStoredRequest` in `server.ts` | `toChatRequest` in `chats.service.ts` | NG-26 |
| Comment "`SqliteSessionStore` implements it" on `ChatStore` | "`SqliteChatStore` implements it" | NG-16 |
| `SqliteChatStore`, `ChatStore`, `ChatModels` | No change | — |

## `modules/workspaces/`

| Current | Target | Problems |
| --- | --- | --- |
| `createWorkspaceOperations`, `WorkspaceOperations` | `class WorkspaceService` | NG-01, NG-02 |
| `WorkspaceRegistry` in `workspaces.store.ts` | `SqliteWorkspaceStore`. The port `WorkspaceLookup` stays | NG-01 |
| `WorkspaceWorkflowError` in `workspaces.service.ts` and `WorkspaceError` in `contracts.ts` | One `WorkspaceError` in `workspaces.errors.ts` | NG-06 |
| `contracts.ts` | `workspace.types.ts` | NG-23 |
| `schema.ts`, `initialize` | `workspaces.migrations.ts`, `migrateWorkspacesDatabase` | NG-23 |

## `modules/providers/`

| Current | Target | Problems |
| --- | --- | --- |
| `ProviderConfigurations`, `ProviderOperations` (`Pick` of the class) | `class ProviderService` | NG-01, NG-02 |
| Class `ProviderFailure` in `providers.service.ts` | `ProviderError` in `providers.errors.ts` | NG-06, NG-18 |
| Type `ProviderFailure` in `provider-catalog.ts` | `ProviderCheckCode`. `ProviderCheckError` stays as the integration error | NG-18 |
| `protocols` in `providers.service.ts` | `providerProtocols` with `as const` in `packages/host/contracts/src/management.ts`. `ProviderProtocol` comes from it, because the wire contract owns the protocol list | NG-08 |
| `SqliteProviderStore` | No change | — |

## `modules/research/`

| Current | Target | Problems |
| --- | --- | --- |
| `ResearchCoordinator`, `ResearchOperations` | `class ResearchService` | NG-01, NG-02 |
| `ResearchFailure` | `ResearchError` in `research.errors.ts`. `TavilyError` stays as the integration error | NG-06 |
| `ResearchSessionStore` | Two ports. `ResearchChats` has `getInfo(sessionId)`, and `ChatService` implements it. `ResearchRuns` has `reserveResearch`, `recordResearch` and `researchSources`. Its owner is `runs/`, because these operations write the run store and `SqliteRunStore` in `db/` implements them | NG-17 |
| `SqliteResearchStore`, `TavilyClient` | No change | — |

## `modules/attachments/`

| Current | Target | Problems |
| --- | --- | --- |
| `AttachmentCoordinator`, `AttachmentOperations` | `class AttachmentService` | NG-01, NG-02 |
| `AttachmentFailure`, `AttachmentStorageError`, `DraftError` | One `AttachmentError` in `attachments.errors.ts`, unless a caller handles one of them differently. Remove the copy of the code list (`knownAttachmentCodes` beside `attachmentStatus`) | NG-06, NG-25 |
| `ManagedAttachments` in `attachments.store.ts` (files on disk) | `AttachmentFileStore` in `attachment-files.store.ts` | NG-01 |
| `SqliteAttachmentLog` in `attachment-log.store.ts` (rows in SQLite) | `SqliteAttachmentStore` in `attachments.store.ts` | NG-01 |
| `AttachmentSessionStore` | `AttachmentChats` | NG-17 |
| `MemoryDraftStore`, `AttachmentParserPort` | No change | — |

## `modules/deck/`

The deck module needs its own diagnosis before its revision, because it is the largest module and most of its logic is in `@deckagent/deck`. The table gives the direction only.

| Current | Target | Problems |
| --- | --- | --- |
| `createDeckOperations`, `DeckOperations`. Each method calls `BriefCoordinator`, `ConfirmationCoordinator` or `DeckStore` with the same arguments | `class DeckService` that owns the brief and confirmation use cases. `BriefCoordinator` and `ConfirmationCoordinator` become private parts of the module with names that tell the use case | NG-02, NG-24 |
| `DeckWorkflowFailure` in `failures.ts` | `DeckWorkflowError` in `deck.errors.ts` | NG-06 |
| `DeckSessionStore` in `ports.ts` | `DeckChats` | NG-17 |
| `deck-prompts.ts`: tool results, tool argument decode, brief validation, tool schemas, instructions, `sourceKindsForBrief` | Split by responsibility | NG-14 |
| `deck-tool-session.ts`, `DeckToolSession` | A name without "session", for example `DeckRunTools` | NG-19 |
| 18 files in the module root | `brief/`, `generation/`, `images/` (with `image-credit.ts`, `image-research.ts`, `image-review-run.ts`) and `rendering/` | NG-14 |
| Deck planning in `server.ts` (`deckPlanner`, `prepareGeneration`, `generationDependencies`, `sourceToolsContribution`) | The deck module | NG-21 |

## `server.ts`

`server.ts` has 714 lines. These parts are not wiring and move to their owners:

| Lines (2026-11-27) | Part | Target owner | Problems |
| --- | --- | --- | --- |
| 122–125 | `toStoredRequest` | The chats module, as one converter with `projectRequest` | NG-26 |
| 128–147 | `openSessionStorage` (joins the chat store, the attachment store and the run store with admission hooks) | `db/`. Tests import it | NG-13 |
| 182–235 | `createPreparedImageReader`, `createDeckStore` | The deck module | NG-13 |
| 403–427 | `mapRunFailure` (HTTP status of `RunFailure`) | The error handler in `http/`, because the project structure gives the mapping of `runs/` errors to `http/` [[1]](#ref-1) | NG-21 |
| 441–465 | `chatSessions`: one object that gives deck, research, attachments and source tools the chat store, the attachment store and the run store | Removed. Each consumer gets its `<Consumer><Provider>` port from the service of the owner | NG-17 |
| 467–499 | `runStore`: run admission through the draft, with a list of error codes that pass through | `Open`: `runs/` or `ChatRequestService` | NG-21 |
| 532–596 | Deck run planning and generation preparation | The deck module | NG-21 |

## `db/` and the root files

| Current | Target | Problems |
| --- | --- | --- |
| `db/run-store.ts`, `db/approvals.ts`, `db/request-queries.ts`, `db/request-sources.ts` | Stay in `db/`. The project structure gives `db/` the persistence adapters of the ports of `runs/` | NG-11 |
| `mapSessionFailure` in `db/index.ts` | The error table of the chats module. `db/` does not know HTTP status | NG-22 |
| `db/contracts.ts` | `db/records.ts` | NG-23 |
| `db/sessions-schema.ts` | `db/chats.migrations.ts`. The file name `sessions.sqlite` on disk stays, because it is user data | NG-19, NG-23 |
| `SessionDatabase`, `SessionError` | `Open`: names for the database of chats, attachments and runs | NG-19 |
| `web-state.ts` (`WebState`, preferences, `web.sqlite`) and `settings-routes.ts` | `modules/settings/` with `settings.routes.ts`, `settings.service.ts` and `settings.store.ts`. The connection to `web.sqlite` goes to `db/`, because `SqliteProviderStore` and `SqliteResearchStore` also use it | NG-12 |
| `credential-store.ts` | `Open`: the providers module, or a folder of its own. Providers and research use it | NG-12 |
| `storage-root.ts` | `Open`: `db/`, or a folder of its own for the storage layout | NG-12 |
| `cli.ts` | No change. It is an entry point, as `server.ts` is | — |
| `contract-sync.ts` | No change. It goes away when `packages/host/contracts/` becomes `packages/contracts/` | — |

## Scope and order

The scope is `apps/host/` and the glossary. The glossary also applies to `packages/contracts/` and `apps/web/`, because wire names cross the boundary. Do not rename code in `apps/web/` while Phase 5 of the Target Structure Refactor rewrites the Browser [[2]](#ref-2). Do not change `packages/presentation/` in this refactor, because the Module Design Refactor already cleaned it [[3]](#ref-3).

| Order | Revision | Starts when |
| --- | --- | --- |
| 1 | Write [Naming Rules](naming-rules.md) into the Coding Guidelines and the Project Structure. Change the carried item "rename `*Service` symbols" of the Target Structure Refactor [[2]](#ref-2) to these rules | Now |
| 2 | Chats module, with the removal of the `chatSessions` adapter for chat operations | Phase 4 of the Target Structure Refactor is done |
| 3 | Workspaces module | Revision 2 is done, because `WorkspaceService` uses `ChatService` |
| 4 | Providers module and research module | Revision 2 is done |
| 5 | Attachments module | Revision 2 is done |
| 6 | Deck module: diagnosis, then the move | Revisions 2 to 5 are done |
| 7 | `server.ts`, `db/` and the root files | Revision 6 is done |
| 8 | Contract revision: `sessionId` to `chatId`, `/api/sessions` to `/api/chats`, `SESSION_*` codes, in the wire, the database, `packages/presentation/` and `apps/web/` together | `Open`: with Phase 5 of the Target Structure Refactor, or after it |

The contract revision changes many places. On 2026-11-27, `sessionId` occurs 438 times in `apps/host/src/`, 246 times in `apps/web/src/`, 457 times in `packages/presentation/`, 36 times in `packages/host/contracts/src/`, 338 times in `e2e/` and 158 times in `apps/host/tests/`.

## References

1. <a id="ref-1"></a>[Project Structure](../../../conventions/project-structure.md)
2. <a id="ref-2"></a>[Target Structure Refactor](../target-structure/README.md)
3. <a id="ref-3"></a>[Module Design Refactor](../module-design/README.md)
