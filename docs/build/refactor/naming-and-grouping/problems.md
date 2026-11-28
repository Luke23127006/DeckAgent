# Naming and Grouping Problems

Read this file to know the naming and grouping problems in `apps/host/src/` after the Target Structure Refactor, and the direction for each problem.

The Target Structure Refactor [[1]](#ref-1) moves code to its target folders. It copies the code and keeps the old names. Thus it does not fix the symbol names or the grouping of code inside a module. This file records those problems from a scan of `apps/host/src/` on 2026-11-27. The rules that fix the problems are in [Naming Rules](naming-rules.md). The target name of each symbol is in [Module Map](module-map.md). The file uses four labels:

- `Measured`: a value from the scan.
- `Inferred`: a conclusion from the code that the scan did not prove.
- `Proposed`: a direction that is not a decision yet.
- `Open`: a question that needs a decision.

| Prefix | Group | Source |
| --- | --- | --- |
| `NG` | Naming and grouping problems in [Problems](#problems) | Scan of `apps/host/src/` on 2026-11-27 |

## Root cause

Two conventions in the repository disagree:

- File names follow the pattern `<feature>.<role>.ts`, for example `chats.service.ts` and `chats.store.ts` [[2]](#ref-2). A file name of this type tells the reader the role of the file.
- Symbol names follow a rule that limits the suffixes `Service`, `Controller` and `Repository` [[3]](#ref-3). The Module Design Refactor renamed `*Service` symbols for this reason, for example `DeckService` became `DeckStore` [[4]](#ref-4). The Target Structure Refactor still carries "rename `*Service` symbols" as an item for Phase 6 [[1]](#ref-1).

The result is that each module chose its own names when its code moved. A reader cannot predict what a `<name>.service.ts` file exports. `Inferred`: the old rename was right for `DeckService`, because that class was a 1,065-line store [[4]](#ref-4). The fault was the wrong role, not the suffix. The authority table of the project structure already defines "service of a module" as a role [[2]](#ref-2). Thus a `Service` suffix on the service of a module describes the role correctly.

## Decisions

- A service and a store are classes. The main class of `<name>.service.ts` is `<Name>Service` (problems NG-01 and NG-02).
- The product concept is "chat". "Session" is not a name for it in new or renamed code (problems NG-03 and NG-19). The ID field `sessionId` stays until one contract revision renames it (see [Naming Rules](naming-rules.md#one-name-for-each-concept)).

## Problems

| ID | Problem | Evidence (`Measured` unless labeled) | Direction |
| --- | --- | --- | --- |
| NG-01 | The symbols for one role have different names in different modules | Service: `createChatOperations`, `AttachmentCoordinator`, `ProviderConfigurations`, `ResearchCoordinator`, `createWorkspaceOperations`, `createDeckOperations`. Store: `SqliteChatStore`, `ManagedAttachments`, `WorkspaceRegistry`, `SqliteProviderStore`, `SqliteResearchStore` | [Role files and symbols](naming-rules.md#role-files-and-symbols) |
| NG-02 | Services use two forms: a class, or a closure factory with a separate `*Operations` interface | Classes: `attachments`, `providers`, `research`. Factories: `chats`, `workspaces`, `deck` | Decided: a class |
| NG-03 | One concept has two names: chat and session | The module is `chats`, but the ID is `sessionId`, the error codes are `SESSION_NOT_FOUND` and `SESSION_BUSY`, the Browser type is `WebSession`, the database class is `SessionDatabase`, and the table is `sessions`. The product glossary has "Chat" and no "Session" [[5]](#ref-5) | Decided: "chat". [One name for each concept](naming-rules.md#one-name-for-each-concept) |
| NG-04 | Request and run look like two names for one concept | `request.routes.ts` is in `modules/chats/`. `projectRequest` converts `RunSnapshot` to `RequestSnapshot`. The product glossary defines "Request" [[5]](#ref-5). `RunOwnerKind` in `runs/ports.ts` has one value, `chat` | Not a defect: a request is a run whose owner is a chat. The rule is in [One name for each concept](naming-rules.md#one-name-for-each-concept) |
| NG-05 | `chats.service.ts` holds five responsibilities in 361 lines | Chat operations, request submission (`createChatRequestOperations`), the `conversation` run contribution, the adapter for `workspaces` (`createWorkspaceChats`), and model selection reads (`readChatSelection`) | `ChatService`, `ChatRequestService` and `chats.run-contribution.ts`. See [Module Map](module-map.md#moduleschats) |
| NG-06 | Error classes use four name patterns | 22 error classes in `apps/host/src/` use `*Error`, `*Failure`, `*WorkflowError` and `*WorkflowFailure`. Some modules have two or three classes, for example `AttachmentFailure`, `AttachmentStorageError` and `DraftError` | [Errors](naming-rules.md#errors) |
| NG-07 | The module shape does not list files that the code already has | `<name>.errors.ts` exists in each module, but the module shape in the project structure lists only routes, service and store [[2]](#ref-2) | Add `<name>.errors.ts`, `<name>.run-contribution.ts` and `<name>.migrations.ts` to the module shape, with the symbol that each file exports |
| NG-08 | `message.ts` validates messages by hand | `apps/host/src/modules/chats/message.ts` has 167 lines. Lines 1 to 128 are hand-written type guards (`record`, `nonempty`, `keys`, `json`, `isValidMessage`, `attachment`). The tech stack uses Zod for validation at boundaries | [Values and validation](naming-rules.md#values-and-validation). Do not use a TypeScript `enum` for `role` |
| NG-09 | `message.ts` holds three rules under one name | Message validation for storage, the chat title rule (`chatTitle`) and the chat search rule (`chatMatches`, `searchWords`) | `message-validation.ts` and `chat-text.ts` |
| NG-10 | Many files have a copy of the same type guard | 15 files in `apps/host/src/` define `record()` or `isRecord()`, for example `chats.routes.ts`, `providers.service.ts`, `web-state.ts`, `runtimes/opencode/config.ts` and `tools/sources/attachment-extraction.ts` | Replace the guards with Zod schemas at each boundary. Do not move them to a shared `utils` file, because the project structure forbids that [[2]](#ref-2) |
| NG-11 | `db/` holds the SQL of runs, but the project structure says that `db/` owns only the connection and migrations | `db/run-store.ts`, `db/approvals.ts`, `db/request-queries.ts`, `db/request-sources.ts`. `runs/` must not import an SQL driver [[2]](#ref-2), so the adapter for the `RunStore` port must be outside `runs/` | Change the project structure: `db/` also owns the persistence adapters for the ports of `runs/`. `Inferred`: this is a gap in the document, not a defect in the code |
| NG-12 | Files in the root of `apps/host/src/` have no owner in the target structure | `cli.ts`, `credential-store.ts`, `settings-routes.ts`, `storage-root.ts`, `web-state.ts`, `contract-sync.ts` | [Module Map](module-map.md#db-and-the-root-files) |
| NG-13 | The composition root is large | `server.ts` has 714 lines. Its role is startup, shutdown, configuration and wiring [[2]](#ref-2) | [Module Map](module-map.md#serverts) |
| NG-14 | `modules/deck/` is flat and uses many name patterns | 18 files in the module root, plus `images/` and `rendering/`. Names use `*-coordinator`, `*-run-plan`, `*-prompts` and `*-tools`. There is no `deck.store.ts`. `deck-prompts.ts` holds tool results, tool argument decode, brief validation, tool schemas, instructions and `sourceKindsForBrief` | Group the root files by capability. A diagnosis of the deck module comes first |
| NG-15 | Barrel files export everything instead of the public operations | `runs/index.ts` exports 36 types. `chats/index.ts` exports `readChatSelection` | After the renames, export only the operations that have a consumer outside the module [[2]](#ref-2) |
| NG-16 | Comments name classes that no longer exist | `ChatStore` in `chats.service.ts` and `AttachmentSessionStore` in `attachments.service.ts` say that `SqliteSessionStore` implements them. The split of session persistence removed `SqliteSessionStore` | Remove or fix the comments [[3]](#ref-3) |
| NG-17 | One adapter in `server.ts` joins the stores of three owners under the name "sessions" | `chatSessions` (`server.ts` lines 441–465) gives the chat store, the attachment store and the run store to deck, research, attachments and source tools. The consumers declare ports named `DeckSessionStore`, `ResearchSessionStore` and `AttachmentSessionStore`. The project structure says that a module uses only the public operations of the service of another module [[2]](#ref-2) | [Ports that a module declares](naming-rules.md#ports-that-a-module-declares) |
| NG-18 | The providers module exports two different things named `ProviderFailure` | A type (union of the error codes of `ProviderCheckError`) in `provider-catalog.ts` and a class in `providers.service.ts` | `ProviderCheckCode` and `ProviderError` |
| NG-19 | "Session" has four meanings in `apps/host/src/` | A chat (`sessionId`, `SessionDatabase`). An OpenCode session (`runtimes/opencode/`, 26 occurrences). The tool state of one deck run (`DeckToolSession`). The change-feed topics with a key for each chat (`sessionTopics`) | [One name for each concept](naming-rules.md#one-name-for-each-concept) |
| NG-20 | Some routes validate bodies by hand, but the contracts package has decoders | `chats.routes.ts` validates the body of create and search with `isRecord`. `research.routes.ts` uses `decodeResearchSaveBody`. `packages/host/contracts/src/` has 19 `decode*` functions on Zod schemas | Each route uses a `decode*` function from the contracts package |
| NG-21 | `server.ts` holds rules of runs and of the deck module | `mapRunFailure` (HTTP status of `RunFailure`), the list of admission error codes in `runStore`, the deck run planner and the generation preparation | [Module Map](module-map.md#serverts) |
| NG-22 | `db/` maps an error to an HTTP status | `mapSessionFailure` in `db/index.ts` returns 404, 409 and 413. The project structure gives each module its own error table, and `db/` is not a module [[2]](#ref-2) | Move the table to the chats module |
| NG-23 | `contracts.ts` and `schema.ts` mean different things in different folders | `contracts.ts` in `db/`, `http/`, `tools/policy/` and `modules/workspaces/` holds local types, but "contracts" also means the wire package. `schema.ts` and `sessions-schema.ts` hold database schemas, but "schema" also means a Zod schema | `<name>.types.ts`, `records.ts` and `<name>.migrations.ts` |
| NG-24 | `deck.service.ts` passes each call through | Each method of `DeckOperations` calls `BriefCoordinator`, `ConfirmationCoordinator` or `DeckStore` with the same arguments | `DeckService` owns the brief and confirmation use cases |
| NG-25 | Some error tables are not typed by their codes | `chats.errors.ts` uses `Record<ChatWorkflowErrorCode, number>`. `attachments.errors.ts` uses `Record<string, number>` with `?? 500`, and `attachments.service.ts` keeps a second list of the same codes (`knownAttachmentCodes`) | [Errors](naming-rules.md#errors) |
| NG-26 | Two functions convert a run owner to `sessionId` | `toStoredRequest` in `server.ts` and `projectRequest` in `chats.service.ts` | One converter in the chats module |

## Industry standards

The values in this table come from the pages as read on 2026-11-27.

| Standard | What the page says | Applies to | How much to follow |
| --- | --- | --- | --- |
| Angular style guide, v22 [[6]](#ref-6) | Separate words in file names with hyphens. The examples have no type suffix, for example `user-profile.ts`. Tests end with `.spec.ts` | NG-01, NG-07 | Do not follow the removal of the suffix. DeckAgent keeps `<name>.<role>.ts`, as NestJS does, because one module has many roles |
| TypeScript handbook, "Objects vs Enums" [[7]](#ref-7) | "You may not need an enum when an object with `as const` could suffice" | NG-08 | Follow: a union, or `as const` for a runtime list |
| Google TypeScript Style Guide [[8]](#ref-8) | `const enum` is not allowed. No `I` prefix for interfaces. No `_` suffix. Use parameter properties | NG-08, naming in general | Follow. DeckAgent also forbids `enum` as a project choice, not because the guide forbids it |
| Ubiquitous language from Domain-Driven Design | One name for each concept, the same in code and in the product | NG-03, NG-04, NG-19 | Follow with the product glossary [[5]](#ref-5). Do not adopt the other Domain-Driven Design patterns |
| Zod as the only schema at boundaries | — | NG-08, NG-10, NG-20 | Follow. Zod is already in the tech stack |

## Documents to change

| Document | Change (`Proposed`) | Problems |
| --- | --- | --- |
| Coding Guidelines, Naming [[3]](#ref-3) | The rules in [Role files and symbols](naming-rules.md#role-files-and-symbols), [Errors](naming-rules.md#errors) and [Ports that a module declares](naming-rules.md#ports-that-a-module-declares) | NG-01, NG-02, NG-06, NG-17, NG-18, NG-25 |
| Coding Guidelines, TypeScript and Validation [[3]](#ref-3) | The rules in [Values and validation](naming-rules.md#values-and-validation) | NG-08, NG-10, NG-20 |
| Project Structure, module shape and `apps/host/` table [[2]](#ref-2) | List the symbol that each module file exports. Add `<name>.errors.ts`, `<name>.run-contribution.ts` and `<name>.migrations.ts`. Give `db/` the persistence adapters of `runs/`. Give an owner to each root file | NG-07, NG-11, NG-12, NG-22 |
| Product glossary in the use cases [[5]](#ref-5) | No change. Code names follow it | NG-03, NG-04 |
| A table of code names for technical concepts | The table in [One name for each concept](naming-rules.md#one-name-for-each-concept). `Open`: Coding Guidelines, or a file in `docs/architecture/` | NG-03, NG-19, NG-23 |
| Target Structure Refactor, Carried items [[1]](#ref-1) | Change "rename `*Service` symbols" to "rename symbols to the role table", so that Phase 6 does not remove the `Service` suffix | NG-01 |

## References

1. <a id="ref-1"></a>[Target Structure Refactor](../target-structure/README.md)
2. <a id="ref-2"></a>[Project Structure](../../../conventions/project-structure.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../../conventions/code.md)
4. <a id="ref-4"></a>[Module Design Implementation Plan](../module-design/plan/README.md)
5. <a id="ref-5"></a>[Use Cases](../../../UCs/README.md)
6. <a id="ref-6"></a>[Angular Style Guide](https://angular.dev/style-guide)
7. <a id="ref-7"></a>[TypeScript Handbook: Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
8. <a id="ref-8"></a>[Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
