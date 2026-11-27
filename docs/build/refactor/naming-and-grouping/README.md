# Naming and Grouping Refactor

Read this file to follow the abstract phase plan that fixes symbol names and code grouping in `apps/host/src/`, and to find the research files behind it.

## Scope and relationship to target structure

The Target Structure Refactor [[1]](#ref-1) moved the code of the Host to its target folders and finished its Phase 4 on 2026-11-27. The move kept the old names. This workstream renames symbols, splits files by responsibility and moves the parts of `server.ts` that are not wiring to their owners. It does not move code between applications or packages.

- Scope: `apps/host/src/`, `apps/host/tests/`, `e2e/` where a test imports a renamed symbol, and `docs/conventions/`.
- Out of scope: `apps/web/`, because Phase 5 of the Target Structure Refactor rewrites the Browser. Also out of scope: `packages/presentation/`, because the Module Design Refactor [[2]](#ref-2) already cleaned it.
- The HTTP contract stays the same in Phases 1 to 7: paths, status codes and JSON bodies do not change. Only Phase 8 changes the contract.
- For `apps/host/`, Phase 1 of this workstream replaces the carried item "rename `*Service` symbols" of the Target Structure Refactor.

## Research files

| File | Question it answers |
| --- | --- |
| [problems.md](problems.md) | Which naming and grouping problems does `apps/host/src/` have, with which evidence, and which decisions are fixed? |
| [naming-rules.md](naming-rules.md) | Which rules give one name for each concept, and which rules apply to role files, errors, ports and validation? |
| [module-map.md](module-map.md) | What is the target name of each symbol, which parts of `server.ts` move, and where? |
| [plan/README.md](plan/README.md) | Which tasks does each phase do, in which order? |
| [reports/README.md](reports/README.md) | What did each task do, and which checks passed? |

## Planner and executor

The planner writes one revision in `plan/` for each phase, with the skill `write-implementation-plan` [[3]](#ref-3). Do not write a revision for a later phase before the current phase is done.

- Each phase has exactly one revision. Do not divide a phase into smaller revisions or sub-phases, for example `2a`, `2b` and `2c`.
- The planner writes all the tasks of the phase in that one revision, at one time. A later revision does not add tasks to a phase that already has a revision.

- The planner does the diagnosis of the phase. It reads the code of the phase and answers each `Open` item of the phase in [Module Map](module-map.md). It records each answer in a decision table in the revision, with the reason.
- The planner writes only execution tasks. A revision has no diagnosis task and no task that ends with `STOP` for a decision.
- The executor does each task as written and makes no design decision. When the code does not match the task, the executor stops and reports the difference. The planner then changes the revision.
- A regular task does not run the full test suite. It runs only the tests that cover the files it changes. Only the phase-exit task of a revision runs the full non-live test suite, to find and fix defects before the phase ends.
- When a phase changes a name or a rule in [Naming Rules](naming-rules.md) or [Module Map](module-map.md), the planner changes that file in the same revision.

## Abstract phase plan

Every phase is done only when `build`, `lint`, `check:boundaries`, `check:docs` and the non-live test suites pass. In Phases 1 to 7, HTTP black-box tests pass without changes to their expected values.

| Phase | Name | Starts when | Done when | Status |
| --- | --- | --- | --- | --- |
| 1 | Conventions and checks | Now | The Coding Guidelines [[4]](#ref-4) and the Project Structure [[5]](#ref-5) contain the rules of [Naming Rules](naming-rules.md). The carried item "rename `*Service` symbols" of the Target Structure Refactor [[1]](#ref-1) points to these rules. `oxc/no-const-enum` is on. `check:boundaries` has a rule against `enum` and a rule that a role file exports its role symbol, each with a negative fixture. The role symbol rule applies to the modules that a list in the check names, and the list starts empty | Done ([Revision 1](plan/README.md#revision-1-phase-1-conventions-and-checks)) |
| 2 | Chats module | Phase 1 is done | `ChatService`, `ChatRequestService`, `ChatError`, `chats.run-contribution.ts`, `message-validation.ts` and `chat-text.ts` exist as [Module Map](module-map.md#moduleschats) gives them. The chat routes read bodies with `decode*` functions. `ChatService` implements `WorkspaceChats`. The chats module is in the list of the role symbol rule | Pending |
| 3 | Workspaces module | Phase 2 is done | `WorkspaceService`, `SqliteWorkspaceStore`, one `WorkspaceError`, `workspace.types.ts` and `workspaces.migrations.ts` exist. The workspaces module is in the list of the role symbol rule | Pending |
| 4 | Providers and research modules | Phase 2 is done | `ProviderService`, `ProviderError`, `ProviderCheckCode`, `ResearchService` and `ResearchError` exist. The research port has the owner that the Phase 4 diagnosis selects. Both modules are in the list of the role symbol rule | Pending |
| 5 | Attachments module | Phase 2 is done | `AttachmentService`, one `AttachmentError` with a typed status table, `AttachmentFileStore`, `SqliteAttachmentStore` and the port `AttachmentChats` exist. The attachments module is in the list of the role symbol rule | Pending |
| 6 | Deck module | Phases 2 to 5 are done | `DeckService` owns the brief and confirmation use cases. `DeckWorkflowError` and the port `DeckChats` exist. The files in the module root are in folders by capability. Deck run planning is not in `server.ts`. The `chatSessions` adapter in `server.ts` is removed. The deck module is in the list of the role symbol rule | Pending |
| 7 | Composition root, `db/` and root files | Phase 6 is done | `server.ts` holds only startup, shutdown, configuration and wiring. `mapRunFailure` is in `http/`. `db/` maps no error to an HTTP status. Each file in the root of `apps/host/src/` has an owner in the Project Structure [[5]](#ref-5). Each barrel exports only operations that a consumer outside the module uses | Pending |
| 8 | Contract rename of the chat ID | Phase 7 is done, and Phase 5 of the Target Structure Refactor is done | `sessionId`, `/api/sessions` and the `SESSION_*` codes have the chat names in the wire, the database, `packages/presentation/`, `apps/web/` and the tests, in one revision. A database migration keeps the user data | Pending |

Phases 3, 4 and 5 can run in any order after Phase 2.

### Phase 1: Conventions and checks

Change the conventions before any code changes. Then the executors of this workstream use the new names in new code. The executors of Phase 5 of the Target Structure Refactor also use them. The role symbol rule starts with an empty list of modules, because no module follows the rule yet. Each later phase adds its module to the list. Thus the check passes after each phase, and the negative fixture proves that the rule finds a violation.

### Phase 2: Chats module

Start with the chats module, because it has the most problems and because the workspaces module uses `ChatService`. The diagnosis of this phase decides which operations of the `chatSessions` adapter move to `ChatService` now, and which stay until Phase 6.

### Phase 6: Deck module

The deck module is the largest module, and most of its logic is in `@deckagent/deck`. The planner reads the module and the package before the plan. The diagnosis decides the names of the private parts that replace `BriefCoordinator` and `ConfirmationCoordinator`, and the folders of the module root.

### Phase 8: Contract rename of the chat ID

This phase changes the contract between the Browser and the Host on purpose. Do it after Phase 5 of the Target Structure Refactor. Then the rename changes the new React code one time, and not the old Browser code. On 2026-11-27, `sessionId` occurs 438 times in `apps/host/src/`, 246 times in `apps/web/src/` and 457 times in `packages/presentation/` [[6]](#ref-6).

## References

1. <a id="ref-1"></a>[Target Structure Refactor](../target-structure/README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../module-design/README.md)
3. <a id="ref-3"></a>[Write Implementation Plan](../../../../.agents/skills/write-implementation-plan/SKILL.md)
4. <a id="ref-4"></a>[Coding Guidelines](../../../conventions/code.md)
5. <a id="ref-5"></a>[Project Structure](../../../conventions/project-structure.md)
6. <a id="ref-6"></a>[Module Map](module-map.md)
