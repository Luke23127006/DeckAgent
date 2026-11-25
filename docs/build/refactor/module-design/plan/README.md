# Module Design Refactor Implementation Plan

Read this file to learn the goal, decisions, global constraints, and task order for Phase 1 and Phase 2.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you finish a step, change its `- [ ]` to `- [x]` in the task file. After all checks pass, mark the task `Done` in this file, write the task report, and commit and push only the task files. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Run approved Phase 2 Slice 2C refactors across `apps/web/src/integrations/`, `apps/web/src/features/`, and `apps/web/src/` root, then pass the Slice 2C exit gate.

**Approach:** Revisions 1 to 4 (Tasks 1 to 22) closed Phase 1, Slice 2A, Slice 2B, and Slice 2C diagnosis. Revision 4b applies all approved Slice 2C findings (`IN1`-`IN8`, `FD1`-`FD7`, `FA1`-`FA10`) across Tasks 23 to 28. Task 29 runs the Slice 2C exit gate. Slice 2C requires no convention update.

**Tech stack:** Windows, Node.js 22.19.0, pnpm 11.28.5 (`corepack pnpm@11.28.5`), TypeScript 6.0.3, oxlint 1.94.0, Biome 2.5.15, Zod, and `node:test`.

**Spec:** Phase scope, baseline signals, and gates come from Module Design Refactor [[1]](#ref-1). Ownership, implementation, testware, and deep-module rules come from Project Structure [[2]](#ref-2), Coding Guidelines [[3]](#ref-3), Testware [[4]](#ref-4), and Codebase Design [[5]](#ref-5).

## Decisions

| Topic | Decision |
| --- | --- |
| Workstream and revision | This folder owns `refactor/module-design`. Revisions 1 to 4 closed Phase 1, Slice 2A, Slice 2B, and Slice 2C diagnosis. Revision 4b runs Slice 2C refactors and the exit gate [[1]](#ref-1). |
| Scanner script | Place the static scanner at `scripts/scan-module-design.mjs` and its unit tests at `tests/scan-module-design.test.mjs`. Add `"scan:module-design": "node scripts/scan-module-design.mjs"` in `package.json`. |
| Scanner parser | Parse TypeScript and JavaScript files with the installed `typescript` compiler API (`ts.createSourceFile`), matching `scripts/check-boundaries.mjs`. Add no new npm dependency. |
| Production area scope | Scan tracked and non-ignored `.ts` and `.tsx` files under `apps/` and `packages/`, excluding `lib/`, `tests/`, and `node_modules/`. Group files into the 14 areas listed in Module Design Refactor [[1]](#ref-1). |
| Quantitative thresholds | Flag production files over 400 lines, functions over 80 lines, non-barrel files under 30 lines, non-`as const` type assertions, and `*Service` declarations. Collect `git log` co-change pairs with at least 3 shared commits across the last 200 non-merge commits, skipping commits over 20 production files. |
| Testware scan scope | Scan tracked `.test.mjs` and `.test.ts` files across `apps/`, `packages/`, `e2e/`, and `tests/`. Report counts per root, files missing a top comment header, files calling `setTimeout(`, and importers of `scripts/lib/`. |
| Triage approval gate | Task 2 proposes a Tier 1, Tier 2, or Skip label for every area and stops. Do not change `docs/build/refactor/module-design/README.md` until the owner approves the table. |
| Timeout diagnosis first | Task 3 measures isolated and suite timings for `e2e/portable-generation-http.test.mjs` and classifies the root cause before any fix. Revision 1b applies the approved fix and checks `# fail 0` across all non-live suites. |
| Approved 14-area triage | Approve 8 Tier 1 areas, 5 Tier 2 areas (`filesystem/`, `html/`, `design/`, `registry/`, `document/`), and 1 Skip area (`pptx/`). Record the AST baseline (32 type assertions, 21 non-barrel files under 30 lines, 68 test files) in `docs/build/refactor/module-design/README.md`. |
| Timeout fix scope | Set `openCode: { timeoutMs: 120000 }` inside `e2e/portable-generation-http.test.mjs`. Keep the `30000` ms default in `apps/web/tests/fixtures/b02-helpers.mjs`. Defer browser reuse evaluation in `apps/web/src/integrations/rendering/artifact-renderer.ts` to Phase 2 Slice 2C. |
| CI timeout guardrail | Raise `timeout-minutes` from `2` to `6` on the `generation_publication` step in `.github/workflows/workspace.yml` so the full suite (~3 minutes locally) does not expire in CI. |
| Scanner test hardening | Close the four coverage gaps from the Task 1 report inside `tests/scan-module-design.test.mjs`. Keep `scripts/scan-module-design.mjs` unchanged. |
| Phase 2 slice order | Keep Inside-Out order: run Slice 2A (`packages/session/persistence/`, `packages/host/contracts/`, `packages/host/api/`) before Slice 2B (`packages/presentation/deck/`) [[1]](#ref-1). |
| Slice 2A convention updates | Record four owner-approved rules in Project Structure [[2]](#ref-2). `host/api` imports only type-level reader ports from domain packages (F15). Pure wire payload decoders live in `host/contracts/` while `host/api/` owns HTTP framing (F16). `host/contracts/` and `session/persistence/` keep separate request vocabulary copies guarded by a compile-time check in `host/api/` (P8). `session/persistence/` owns durable records only (P9). |
| `MemoryDraftStore` ownership | Move `MemoryDraftStore` and `DraftSnapshot` from `packages/session/persistence/` to `apps/web/src/draft-store.ts` with a `DraftError` class keeping the same error codes (`DRAFT_TOO_LARGE`, `DRAFT_CONFLICT`, `INVALID_REQUEST`). Move its unit test to `apps/web/tests/draft-store.test.mjs` (P9). |
| Persistence decomposition and guards | Split `packages/session/persistence/src/requests.ts` into `request-validation.ts`, `request-queries.ts`, `runtime-bindings.ts`, `request-sources.ts`, and a facade `requests.ts` (P3). Replace all 4 `as` assertions with type predicates and a `parseResearchSource` guard that throws `SESSION_CORRUPT` (P4, P5). Narrow `session/persistence` root exports and test empty chat title through `SqliteSessionStore` (P1, P2). |
| Host contracts unification | Split `packages/host/contracts/src/validation.ts` into `validation-primitives.ts`, `request-validation.ts`, `brief-validation.ts`, `outline-validation.ts`, and `generation-validation.ts` using Zod schemas while preserving `INVALID_RESPONSE` and `INVALID_GENERATION_RESPONSE` errors (F6). Move the pure `AgentRequest` JSON decoder (`decodeAgentRequest`) into `request-validation.ts` (F3, F16). Remove `@deckagent/presentation-document` re-exports from `host/contracts` and add `"@deckagent/presentation-document": "workspace:*"` to `apps/web/package.json` (F7). Narrow 18 unused nested exports from `host/contracts/src/index.ts` (F8). |
| Host API split and boundary alignment | Move `DeckError` HTTP mapping to `apps/web/src/local-transport.ts` and pass `failureMessage: deckFailureMessage` through `HostOptions` so `host/api` drops its runtime `@deckagent/deck` import (F1, F15). Place lifecycle files in `packages/host/api/src/lifecycle/` and transport files in `packages/host/api/src/transport/` so existing `oxlint` and `check:boundaries` rules enforce the seam (F5, F10). Add `packages/host/api/src/contract-sync.ts` for compile-time contract equality (P8). Share `transport/sse.ts` between request events and `deck-routes.ts`, and remove all 24 non-null assertions in `host/api` (F4, F5). Narrow root exports to 22 symbols and update `apps/web/src` callers to import wire DTOs from `@deckagent/host-contracts` (F2, F9). |
| Task completion workflow | After all checks of a task pass, mark all step checkboxes `- [x]` and mark the task `Done` in `plan/README.md`. Next, write the task report and update `reports/README.md`. Then commit and push only the task files with a conventional commit message before stopping. |
| Slice 2A exit gate | Tasks 8 to 12 passed `build`, `check:boundaries`, `lint`, `check:docs`, 5 root tool test files (69 pass, 0 fail), and 18 non-live suites (331 pass, 0 fail). All three Slice 2A packages reached 0 files over 400 lines and 0 type assertions. |
| Slice 2B diagnosis split | Split Slice 2B diagnosis into two tasks. Task 13 covers `packages/presentation/deck/` core, stores, and public surface (10 files, 2,672 lines). Task 14 covers artifact storage and the `packages/presentation/design/` seam (4 files, 1,597 lines). Each session stays inside the 1,500 to 3,500 line budget [[1]](#ref-1). |
| Slice 2B convention and parity check | Update Project Structure [[2]](#ref-2) (`### packages/` line 111) to state that `host/contracts/` keeps independent DTO copies of `presentation/deck/` and `presentation/design/` types, guarded at compile time in `packages/host/api/src/contract-sync.ts` (D8, D14). |
| `presentation/design/` deferral | Defer `packages/presentation/design/` refactors (D12, D13) to Phase 3 Tier 2 hygiene. Keep `ContentBlock`, `WebImageIntent`, `DesignSnapshot`, and layout checks in `@deckagent/design` (D15). |
| Deck contracts and core stores | Split `packages/presentation/deck/src/contracts.ts` into `errors.ts`, `brief-contracts.ts`, `outline-contracts.ts`, `generation-contracts.ts`, and `deck-contracts.ts` (D4). Split long functions under 80 lines in `brief.ts`, `bound-outline.ts`, `outline-store.ts`, and `schema.ts`, inject `BriefStorage` into `OutlineStorage`, and move `generation_intents` SQL writes into `generation-store.ts` (D3, D5, D6). Replace core `!` assertions with explicit guards (D7). |
| Deck artifacts and image store | Remove `provenance.ts` and `image-needs.ts` (D1, D10). Extract `artifact-fs.ts`, `image-store.ts` (`PreparedImageStore` owning `prepared_images`, `image_search_attempts`, and `outlineImageNeeds`), and `artifact-readback.ts` (`ArtifactReadback`) so `artifact-store.ts` owns staging and preparation under 400 lines (D10). Guard all `as`, `!`, and `JSON.parse` calls with `DeckError('ARTIFACT_CORRUPT')` (D11). |
| `DeckStore` rename and export narrowing | Rename `DeckService` to `DeckStore` and keep `index.ts` as a 31-export barrel (D2, D4, D5). Extract `deck-publication.ts` with the four staging wrappers hidden inside `generationCapability`. Split authoring, generation, reads, and runtime into `deck-authoring.ts`, `deck-generation.ts`, `deck-reads.ts`, and `deck-runtime.ts` so `deck-store.ts` stays under 360 lines. Remove the `./brief` subpath from `packages/presentation/deck/package.json` and `scripts/build-workspace.mjs`, export `briefContractVersion` and `briefJsonSchema` from root, drop 11 pass-through re-exports, and update all callers (D2, D3, D5). |
| Slice 2B exit gate | Tasks 15 to 19 passed `build`, `check:boundaries`, `lint`, `check:docs`, and Biome on touched paths. All 5 root tool test files (69 pass, 0 fail) and 18 non-live suites (333 pass, 0 fail) passed. `packages/presentation/deck/` reached 0 files over 400 lines, 0 functions over 80 lines, 0 type assertions, 0 non-null assertions, 0 `*Service` symbols, 31 root exports, and 1 subpath. |
| Slice 2C diagnosis split | Split Slice 2C diagnosis into three read-only tasks inside the 1,500 to 3,500 line budget [[1]](#ref-1). Task 20 covers `apps/web/src/features/deck/` (8 files, 2,033 lines). Task 21 covers the other seven feature folders and `apps/web/src/` root (31 files, 3,258 lines). Task 22 covers `apps/web/src/integrations/` and `artifact-renderer.ts` browser reuse (22 files, 2,526 lines). |
| Slice 2C conventions and deferrals | Slice 2C requires no convention update. Keep `apps/web/src/features/deck/failures.ts` (`FD8`) as an acyclic leaf error file. Keep `pinnedVersion` and `openToolBridge` in `opencode/index.ts` (`IN5`) until Phase 4 Testware alignment. Keep `toAttachmentHttpError` on `attachmentManagement.upload` (`FA6`) until `multipart.ts` forwards mapped errors. |
| Slice 2C integrations and `ProviderRunSettings` | Move `ProviderRunSettings` into `apps/web/src/integrations/providers/provider-catalog.ts` and export it from `integrations/providers/index.ts` so `integrations/` drops all imports from `features/` (`IN6`). Split `opencode/runtime.ts`, `process.ts`, `mcp-bridge.ts`, `commons-images.ts`, and `public-image-reader.ts` under 80 lines per function (`IN2`, `IN3`, `IN7`). Remove unused `opencode/` and `credentials/` exports and replace all 4 `as` and 10 `!` assertions (`IN4`, `IN5`, `IN8`). |
| Managed browser reuse in `artifact-renderer.ts` | Replace cold Chromium spawns with one managed browser process per renderer instance using incognito CDP contexts and flattened sessions (`IN1`). Wire explicit `close()` into `apps/web/src/index.ts`, add crash recycling, and add a `60_000` ms `unref()` idle recycle timer. Keep `openCode.timeoutMs: 120000` in `e2e/portable-generation-http.test.mjs`. |
| Slice 2C `features/deck/` refactor | Remove `OutlineNotFoundReason` and `imagePageCredit` from `features/deck/index.ts` and test JSON-LD license rules through `WebImageResearch.prepare` (`FD1`). Split `image-research.ts`, `generation-workflow.ts`, and `deck-workflow.ts` into internal modules under 400 lines and 80 lines per function (`FD2`, `FD3`, `FD4`). Share `generation-execution.ts`, rename `BriefService` and `ConfirmationService` to `BriefCoordinator` and `ConfirmationCoordinator`, and replace all 3 `as` and 9 `!` assertions (`FD5`, `FD6`, `FD7`). |
| Slice 2C non-deck features and web root | Fold the four small root asset files into `ui-assets.ts` (`FA1`), the four single-caller `failures.ts` files into their sibling modules (`FA2`), and `chats/contracts.ts` and `workspaces/contracts.ts` into their `index.ts` files (`FA3`). Remove five unused feature barrel exports (`FA4`). Rename `AttachmentService` and `ResearchService` to `AttachmentCoordinator` and `ResearchCoordinator` (`FA9`). Split `source-tools.ts`, `index.ts`, `local-transport.ts`, and `cli.ts` under 80 lines per function, move `SESSION_NOT_FOUND` guards into `local-transport.ts`, and replace all 3 `as` and 7 `!` assertions (`FA5`, `FA6`, `FA7`, `FA8`, `FA10`). |

## Global Constraints

- Run commands from the repository root in Git Bash on Windows.
- Use Node.js 22.19.0 and `corepack pnpm@11.28.5`. Do not install another runtime or package manager version.
- On Windows, run `build`, `test:attachments`, or `test:model-requests` outside the sandbox only when `EPERM` or `EBUSY` blocks them.
- Preserve existing working-tree changes. Never reset, clean, or overwrite unrelated files.
- Do not publish packages or call a live external provider.
- Commit and push only after all task checks pass, you mark all step checkboxes `- [x]`, you mark the task `Done` in `plan/README.md`, and you write the task report. Stage only the task files listed in `Files`. Never stage unrelated working-tree files.
- Do not run live suites (`test:research-live`, `test:opencode-live`).
- Do not read real user data, credentials, or `.env` values.
- Do not change product behavior, database schemas, wire payloads, or deferred features.
- Do not add a new external npm package. Update `pnpm-lock.yaml` only through `corepack pnpm@11.28.5 install --offline` in Task 10 for the internal `@deckagent/presentation-document` workspace dependency.
- Keep package imports strictly through `package.json` `exports` [[2]](#ref-2).
- Do not add `any`, lint-disable directives, `@ts-expect-error`, `@ts-ignore`, or `@ts-nocheck` [[3]](#ref-3).
- Do not add non-null assertions (`!`) or type assertions (`as Type`) in touched files [[3]](#ref-3).
- Write code comments only for the five allowed reasons in Coding Guidelines [[3]](#ref-3). Write required file headers on every new test file [[4]](#ref-4).
- Keep test inputs and expected values as independent literals, not imports of production constants [[4]](#ref-4).
- Do not remove, skip, or weaken any test or check.
- Write all plan text and script error messages in English following `asd-ste100` structural rules.
- Change only the files listed in the active task `Files` block.
- Stop when command output differs from `Expected` or when a file differs from the task description.
- Stop when a step requires an unrecorded decision or fails two times.

## Review Focus

1. `classifyArea` maps all 14 production areas accurately and excludes `lib/`, `tests/`, `e2e/`, and `scripts/`. Test: [Task 1](task-01-quantitative-scan-script.md).
2. `analyzeSourceFile` counts non-`as const` type assertions (`as Type` and `<Type>expr`) while ignoring `as const`, comments, and string literals. Test: [Task 1](task-01-quantitative-scan-script.md).
3. `analyzeSourceFile` separates re-export-only barrel files under 30 lines from real non-barrel small files under 30 lines. Test: [Task 1](task-01-quantitative-scan-script.md).
4. `computeCoChangePairs` drops bulk commits over 20 production files so structural moves do not pollute co-change clusters. Test: [Task 1](task-01-quantitative-scan-script.md).
5. `portable-generation-http.test.mjs` timeout diagnosis distinguishes 30-second fixture budget exhaustion from a renderer hang or process leak before changing code. Check: [Task 3](task-03-investigate-timeout-failure.md).
6. Approved 14-area tiers and AST baseline counts in `docs/build/refactor/module-design/README.md` match the Task 2 report and owner decisions. Check: [Task 4](task-04-record-phase1-triage-and-baseline.md).
7. `e2e/portable-generation-http.test.mjs` passes with `openCode: { timeoutMs: 120000 }`, while `apps/web/tests/fixtures/b02-helpers.mjs` keeps its `30000` ms default. Test: [Task 5](task-05-fix-timeout-and-verify-phase1-exit.md).
8. All 18 non-live package test suites and all 5 root tool test files pass with `# fail 0` and 0 skips. Test: [Task 5](task-05-fix-timeout-and-verify-phase1-exit.md).
9. `packages/host/contracts/` and `packages/host/api/` diagnosis audits all 65 and 56 root exports, tests small files for deletion, and inspects the `@deckagent/deck` import in `host/api/src/index.ts`. Check: [Task 6](task-06-diagnose-host-contracts-and-api.md).
10. `packages/session/persistence/` diagnosis maps all 32 root exports, all 4 type assertions in `requests.ts`, `MemoryDraftStore` ownership, and duplicate types across the `host/api/` seam. Check: [Task 7](task-07-diagnose-session-persistence.md).
11. `docs/conventions/project-structure.md` states the four approved Slice 2A ownership and dependency rules (`F15`, `F16`, `P8`, `P9`). Check: [Task 8](task-08-update-slice-2a-conventions.md).
12. `packages/session/persistence/` has 0 type assertions, 0 files over 400 lines, `SESSION_CORRUPT` coverage for invalid `research_sources` rows, and `MemoryDraftStore` lives in `apps/web/src/draft-store.ts`. Test: [Task 9](task-09-refactor-session-persistence.md).
13. `packages/host/contracts/` splits validation into Zod-backed domain modules, owns `decodeAgentRequest`, drops `@deckagent/presentation-document` re-exports, and keeps the browser bundle Node-free. Test: [Task 10](task-10-refactor-host-contracts.md).
14. `packages/host/api/` drops its runtime `@deckagent/deck` import, isolates `lifecycle/` from `transport/`, checks contract parity at compile time, eliminates all 24 non-null assertions, and exposes 22 own symbols. Test: [Task 11](task-11-refactor-host-api.md).
15. All 18 non-live suites, all 5 root tool test files, boundary checks, lint, format, and docs checks pass after Slice 2A. Test: [Task 12](task-12-verify-slice-2a-exit.md).
16. `packages/presentation/deck/` core diagnosis audits all 66 root exports, all 7 `./brief` exports, `DeckService` (`*Service`, 1,065 lines), `contracts.ts` (446 lines), and `provenance.ts` (11 lines). It also audits all 15 non-null assertions. Check: [Task 13](task-13-diagnose-deck-core-and-surface.md).
17. Artifact storage and design seam diagnosis audits `artifact-store.ts` (985 lines), `image-needs.ts` (38 lines), and `packages/presentation/design/` (574 lines, 20 exports). It also audits all 5 type assertions and all 20 non-null assertions. Check: [Task 14](task-14-diagnose-deck-artifacts-and-design-seam.md).
18. `docs/conventions/project-structure.md` states the compile-time parity rule across `host/contracts/`, `presentation/deck/`, and `presentation/design/` (D8, D14). Check: [Task 15](task-15-update-slice-2b-conventions.md).
19. `packages/presentation/deck/` splits `contracts.ts` into domain modules, reduces long functions under 80 lines, moves `generation_intents` SQL into `generation-store.ts`, and injects `BriefStorage` into `OutlineStorage`. Test: [Task 16](task-16-refactor-deck-contracts-and-core-stores.md).
20. `PreparedImageStore`, `ArtifactReadback`, and `ArtifactStorage` split artifact concerns under 400 lines, remove `provenance.ts` and `image-needs.ts`, and throw `ARTIFACT_CORRUPT` on corrupt SQLite JSON. Test: [Task 17](task-17-refactor-deck-artifacts-and-image-store.md).
21. `DeckStore` replaces `DeckService`, hides 4 staging wrappers, exports 31 symbols without `./brief` or pass-throughs, and passes 16 new `AssertEqual` checks in `packages/host/api/src/contract-sync.ts`. Test: [Task 18](task-18-rename-deck-store-narrow-exports-and-contract-sync.md).
22. All 18 non-live suites, all 5 root tool tests, boundary checks, lint, docs, and Slice 2B scan targets pass with 0 failures. Test: [Task 19](task-19-verify-slice-2b-exit.md).
23. `apps/web/src/features/deck/` diagnosis audits `deck-workflow.ts` (812 lines), `image-research.ts` (483 lines), `generation-workflow.ts` (384 lines), 2 `*Service` symbols, 3 type assertions, 9 non-null assertions, and `failures.ts` (12 lines). Check: [Task 20](task-20-diagnose-deck-feature-workflows.md).
24. Non-deck features and `apps/web/src/` root diagnosis audits `index.ts` (403 lines), `local-transport.ts` (301 lines), and 10 small non-barrel files. It also audits 2 `*Service` symbols, 3 type assertions, and 7 non-null assertions. Check: [Task 21](task-21-diagnose-app-features-and-web-root.md).
25. `apps/web/src/integrations/` diagnosis audits `opencode/runtime.ts` (469 lines), 10 functions over 80 lines, 4 type assertions, 10 non-null assertions, and browser reuse in `rendering/artifact-renderer.ts` (272 lines). Check: [Task 22](task-22-diagnose-integrations-and-renderer-reuse.md).
26. `apps/web/src/integrations/` drops all imports from `features/`, removes unused exports, splits `runtime.ts`, `process.ts`, `mcp-bridge.ts`, `commons-images.ts`, and `public-image-reader.ts` under 80 lines per function, and eliminates all 4 `as` and 10 `!` assertions. Test: [Task 23](task-23-refactor-integrations-opencode-images-credentials.md).
27. `artifact-renderer.ts` reuses one managed browser profile across renders, enforces `1280x720` incognito isolation and blocked URLs, and removes its temp profile on `app.close()`. Test: [Task 24](task-24-refactor-artifact-renderer-managed-browser-reuse.md).
28. `features/deck/` drops `imagePageCredit` and `OutlineNotFoundReason` from its barrel, tests JSON-LD rules through `WebImageResearch.prepare`, splits `image-research.ts` and `generation-workflow.ts`, and removes all 3 `as` and 4 `!` assertions in those files. Test: [Task 25](task-25-refactor-deck-image-research-and-generation-workflow.md).
29. `features/deck/` splits `deck-workflow.ts` under 400 lines, shares `generation-execution.ts`, renames `BriefService` and `ConfirmationService` to coordinators, and removes all remaining `!` assertions in `features/deck/`. Test: [Task 26](task-26-refactor-deck-workflow-and-coordinators.md).
30. Non-deck `apps/web/src/features/` folds 6 small files, narrows 5 unused exports, splits `source-tools.ts`, renames `AttachmentService` and `ResearchService` to coordinators, and eliminates all remaining feature assertions. Test: [Task 27](task-27-refactor-non-deck-features.md).
31. `apps/web/src/` root folds 4 small asset files into `ui-assets.ts`, splits `index.ts`, `local-transport.ts`, and `cli.ts` under 80 lines per function, removes `HttpError` from `index.ts`, and eliminates all 4 root `!` assertions. Test: [Task 28](task-28-refactor-web-root-and-local-transport.md).
32. All 18 non-live suites, all 5 root tool tests, boundary checks, lint, docs, Biome, and Slice 2C scan targets pass with 0 failures. Test: [Task 29](task-29-verify-slice-2c-exit.md).

## Tasks

| Task | Status | File |
| --- | --- | --- |
| 1 | Done | [Build quantitative module-design scanner and unit tests](task-01-quantitative-scan-script.md) ([report](../reports/task-01-quantitative-scan-script.md)) |
| 2 | Done | [Run quantitative scan and draft 14-area triage table](task-02-run-scan-and-triage.md) ([report](../reports/task-02-scan-and-triage.md)) |
| 3 | Done | [Investigate portable-generation-http REQUEST_TIMEOUT baseline failure](task-03-investigate-timeout-failure.md) ([report](../reports/task-03-investigate-timeout-failure.md)) |
| 4 | Done | [Record approved 14-area triage and AST baseline](task-04-record-phase1-triage-and-baseline.md) ([report](../reports/task-04-record-phase1-triage-and-baseline.md)) |
| 5 | Done | [Fix portable-generation-http timeout, harden scanner tests, and check Phase 1 exit gate](task-05-fix-timeout-and-verify-phase1-exit.md) ([report](../reports/task-05-fix-timeout-and-verify-phase1-exit.md)) |
| 6 | Done | [Diagnose host/contracts and host/api module design](task-06-diagnose-host-contracts-and-api.md) ([report](../reports/task-06-diagnose-host-contracts-and-api.md)) |
| 7 | Done | [Diagnose session/persistence module design and host seam](task-07-diagnose-session-persistence.md) ([report](../reports/task-07-diagnose-session-persistence.md)) |
| 8 | Done | [Update Project Structure conventions for Slice 2A](task-08-update-slice-2a-conventions.md) ([report](../reports/task-08-update-slice-2a-conventions.md)) |
| 9 | Done | [Refactor session/persistence and move MemoryDraftStore to apps/web](task-09-refactor-session-persistence.md) ([report](../reports/task-09-refactor-session-persistence.md)) |
| 10 | Done | [Refactor host/contracts validation and narrow exports](task-10-refactor-host-contracts.md) ([report](../reports/task-10-refactor-host-contracts.md)) |
| 11 | Done | [Refactor host/api boundaries, routes, and exports](task-11-refactor-host-api.md) ([report](../reports/task-11-refactor-host-api.md)) |
| 12 | Done | [Check Slice 2A exit gate and rescan metrics](task-12-verify-slice-2a-exit.md) ([report](../reports/task-12-verify-slice-2a-exit.md)) |
| 13 | Done | [Diagnose presentation/deck core, stores, and public surface](task-13-diagnose-deck-core-and-surface.md) ([report](../reports/task-13-diagnose-deck-core-and-surface.md)) |
| 14 | Done | [Diagnose presentation/deck artifact storage and design contract seam](task-14-diagnose-deck-artifacts-and-design-seam.md) ([report](../reports/task-14-diagnose-deck-artifacts-and-design-seam.md)) |
| 15 | Done | [Update Project Structure conventions for Slice 2B](task-15-update-slice-2b-conventions.md) ([report](../reports/task-15-update-slice-2b-conventions.md)) |
| 16 | Done | [Split presentation/deck contracts and refactor core stores](task-16-refactor-deck-contracts-and-core-stores.md) ([report](../reports/task-16-refactor-deck-contracts-and-core-stores.md)) |
| 17 | Done | [Split deck artifact storage, extract image store, and guard assertions](task-17-refactor-deck-artifacts-and-image-store.md) ([report](../reports/task-17-refactor-deck-artifacts-and-image-store.md)) |
| 18 | Done | [Rename DeckService to DeckStore, narrow exports, and check contract parity](task-18-rename-deck-store-narrow-exports-and-contract-sync.md) ([report](../reports/task-18-rename-deck-store-narrow-exports-and-contract-sync.md)) |
| 19 | Done | [Check Slice 2B exit gate and rescan metrics](task-19-verify-slice-2b-exit.md) ([report](../reports/task-19-verify-slice-2b-exit.md)) |
| 20 | Done | [Diagnose features/deck workflows and image research](task-20-diagnose-deck-feature-workflows.md) ([report](../reports/task-20-diagnose-deck-feature-workflows.md)) |
| 21 | Done | [Diagnose non-deck features and apps/web/src root](task-21-diagnose-app-features-and-web-root.md) ([report](../reports/task-21-diagnose-app-features-and-web-root.md)) |
| 22 | Done | [Diagnose apps/web/src/integrations and renderer browser reuse](task-22-diagnose-integrations-and-renderer-reuse.md) ([report](../reports/task-22-diagnose-integrations-and-renderer-reuse.md)) |
| 23 | Done | [Refactor integrations OpenCode, images, and credentials](task-23-refactor-integrations-opencode-images-credentials.md) ([report](../reports/task-23-refactor-integrations-opencode-images-credentials.md)) |
| 24 | Done | [Refactor artifact-renderer for managed browser reuse](task-24-refactor-artifact-renderer-managed-browser-reuse.md) ([report](../reports/task-24-refactor-artifact-renderer-managed-browser-reuse.md)) |
| 25 | Pending | [Refactor deck image research and generation workflow](task-25-refactor-deck-image-research-and-generation-workflow.md) |
| 26 | Pending | [Refactor deck workflow, BriefCoordinator, and ConfirmationCoordinator](task-26-refactor-deck-workflow-and-coordinators.md) |
| 27 | Pending | [Refactor non-deck application features](task-27-refactor-non-deck-features.md) |
| 28 | Pending | [Refactor web root composition, local transport, CLI, and web-state](task-28-refactor-web-root-and-local-transport.md) |
| 29 | Pending | [Check Slice 2C exit gate and rescan metrics](task-29-verify-slice-2c-exit.md) |

## Next revision

- Revision 5 waits for the Slice 2C exit gate (Task 29). It starts Slice 2D (`apps/web/src/browser/`) with read-only diagnosis tasks and a STOP gate.

## References

1. <a id="ref-1"></a>[Module Design Refactor](../README.md)
2. <a id="ref-2"></a>[Project Structure](../../../../conventions/project-structure.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../../../conventions/code.md)
4. <a id="ref-4"></a>[Testware](../../../../conventions/testware.md)
5. <a id="ref-5"></a>[Codebase Design](../../../../../.agents/skills/codebase-design/SKILL.md)
