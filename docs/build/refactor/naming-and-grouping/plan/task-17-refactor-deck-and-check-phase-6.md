# Task 17: Refactor deck module and check Phase 6

Read this file to track the deck module refactor, its completed steps and the Phase 6 exit check.

**Type:** Move or rename and Code (phase-exit task)

**Status:** Done. Implementation, independent review, fixes and all Phase 6 exit checks passed.

This task records work that preceded the task file, as the user requested. It is not a record of test-first implementation.
Read the report before continuing. Do not repeat the completed steps.

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints)
- [Decisions for Revision 6](README.md#revision-6-phase-6-deck-module)
- `docs/build/refactor/naming-and-grouping/module-map.md` (`modules/deck/`)
- `docs/conventions/code.md`, `docs/conventions/project-structure.md` and `docs/conventions/testware.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `.agents/skills/review-change/SKILL.md`
- [Task 17 report](../reports/task-17-refactor-deck-and-check-phase-6.md)

**Files:**
- Change: `apps/host/src/modules/deck/deck.errors.ts`, `deck.service.ts`, `deck.routes.ts`, `ports.ts`, `index.ts` and `images/index.ts`
- Create: `apps/host/src/modules/deck/brief/` (`brief-rules.ts`, `brief-tool-protocol.ts`, `brief-prompts.ts`, `brief-workflow.ts`, `deck-run-tools.ts`, `deck-run-plan.ts`)
- Create: `apps/host/src/modules/deck/generation/` (`generation-prompts.ts`, `generation-report.ts`, `generation-tools.ts`, `generation-run-plan.ts`, `generation-preparation.ts`, `generation-confirmation.ts`)
- Create: `apps/host/src/modules/deck/images/` (`image-credit.ts`, `image-research.ts`, `image-review-run.ts`)
- Remove: 13 old root files in `apps/host/src/modules/deck/` (`brief-coordinator.ts`, `confirmation-coordinator.ts`, `deck-prompts.ts`, `deck-run-plan.ts`, `deck-tool-session.ts`, `failures.ts`, `generation-prompts.ts`, `generation-report.ts`, `generation-run-plan.ts`, `generation-tools.ts`, `image-credit.ts`, `image-research.ts`, `image-review-run.ts`)
- Change: `apps/host/src/modules/chats/chats.service.ts` (`DeckChats` implementation and typed `ChatInfo`), `apps/host/src/modules/attachments/attachments.service.ts` (`DeckAttachments` implementation)
- Change: `apps/host/src/tools/executors/ports.ts`, `apps/host/src/tools/executors/source-tools.ts` and `apps/host/src/tools/index.ts` (split `ToolSessionStore` into `ToolChats`, `ToolAttachmentRecords` and `ToolRuns`)
- Change: `apps/host/src/server.ts` (wire `DeckService`, remove `chatSessions` adapter and deck run planning)
- Change: `scripts/check-boundaries.mjs` (`ROLE_FILE_MODULES` only) and `package.json` (`test:deck-review` only)
- Test: `apps/host/tests/deck-errors.test.mjs`, `apps/host/tests/deck-run-plan.test.mjs`, `apps/host/tests/run-lifecycle.test.mjs` and `tests/check-boundaries.test.mjs`
- Document: `docs/build/refactor/naming-and-grouping/README.md` and `module-map.md`

**Interfaces:**
- Produces: `DeckService`, `DeckWorkflowError`, `DeckWorkflowErrorCode`, `mapDeckError`, `DeckChats` and `DeckAttachments`.
- Produces: `ToolChats`, `ToolAttachmentRecords` and `ToolRuns` in `apps/host/src/tools/`.
- Uses: `Readonly<Record<DeckWorkflowErrorCode, number>>` for the HTTP status table, preserving `OUTLINE_NOT_FOUND` at HTTP 404 for `restore-outline-missing` and HTTP 409 otherwise.
- Keeps: `@deckagent/deck` `DeckError` mapping, all HTTP paths, status codes and JSON bodies unchanged.

**STOP when:**
- A Phase 6 check fails on deck, tools or server changes. Fix the defect and run the check again.
- A failure belongs to concurrent `apps/web/` React work. Record the failure and its owner without changing `apps/web/`.

**Forbidden:** Do not change `apps/web/`, `packages/presentation/` or HTTP black-box test expected values. Preserve other entries in `ROLE_FILE_MODULES`.

- [x] **Step 1: Diagnose the deck module and split capabilities**

Record the private names, folder layout, error table, port split and `server.ts` removals in the Revision 6 decision table.
Move root files into `brief/`, `generation/` and `images/`. Split `deck-prompts.ts` into `brief-rules.ts`, `brief-tool-protocol.ts` and `brief-prompts.ts`. Rename `DeckToolSession` to `DeckRunTools`.

- [x] **Step 2: Unify deck errors and ports**

Replace `DeckWorkflowFailure` (`failures.ts`) with `DeckWorkflowError`, `DeckWorkflowErrorCode`, `deckWorkflowErrorCode` and `mapDeckError` in `deck.errors.ts`.
Replace `DeckSessionStore` with `DeckChats`, `DeckAttachments` and `DeckRuns`. Implement `DeckChats` on `ChatService` and `DeckAttachments` on `AttachmentService`.
Split `ToolSessionStore` in `apps/host/src/tools/` into `ToolChats`, `ToolAttachmentRecords` and `ToolRuns`.

- [x] **Step 3: Convert DeckService and clean server.ts**

Replace `createDeckOperations` and `DeckOperations` with `class DeckService` owning `BriefWorkflow`, `GenerationConfirmation`, `prepareGeneration` and `prepareRun`.
Update `createDeckRoutes` to receive `DeckService`. Narrow `modules/deck/index.ts` to external consumers only.
Remove the `chatSessions` adapter and deck run planning from `apps/host/src/server.ts`.

- [x] **Step 4: Enable the role check, update tests and run mutations**

Add `'deck'` to `ROLE_FILE_MODULES` in `scripts/check-boundaries.mjs`. Move the unlisted fixture in `tests/check-boundaries.test.mjs` to `settings` and add the default `deck` role check test.
Add `apps/host/tests/deck-errors.test.mjs` and register it in `test:deck-review`. Update `apps/host/tests/deck-run-plan.test.mjs` to test through `DeckService`. Update `apps/host/tests/run-lifecycle.test.mjs` for split source-tool ports.
Prove each new or changed test with a mutation. Check that each mutant returns exit code 1, then restore all mutated files.

- [x] **Step 5: Run independent review and fix findings**

Run a fresh-context reviewer against `code.md`, `project-structure.md`, `testware.md` and `LESSONS.md`.
Add missing `DESIGN_SYSTEM_NOT_FOUND` (400) and `DECK_PLAN_CONFLICT` (500) codes to `DeckWorkflowErrorCode`. Restore full `try/catch` error translation in `GenerationConfirmation.confirm` with `SelectionPassthrough` for `readSelection`. Remove unconsumed type re-exports from `modules/deck/index.ts`.

- [x] **Step 6: Pass the Phase 6 exit checks**

Run `corepack pnpm@11.28.5 build`, `lint`, `check:boundaries`, `check:docs`, Biome format check on Phase 6 files, all 19 non-live `test:*` scripts and `test:web` Vitest.
Expected: exit code 0 with zero failures.

- [x] **Step 7: Write the report file and stop**

Write `../reports/task-17-refactor-deck-and-check-phase-6.md`, add its row to `../reports/README.md`, update `plan/README.md`, `../README.md` and `../module-map.md`, and run `corepack pnpm@11.28.5 check:docs`.
