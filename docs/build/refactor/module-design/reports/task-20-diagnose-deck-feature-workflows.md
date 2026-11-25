# Task 20: Features/Deck Workflows and Image Research Diagnosis Report

Read this file to review the deep-module diagnosis of `apps/web/src/features/deck/` and the classified finding table for owner approval [[1]](#ref-1) [[2]](#ref-2).

## Scope and commands run

Task 20 made no changes to production code, test files, `package.json`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md`. The inline `node -e` scripts from Steps 1 and 2 ran via `node -` stdin heredocs in PowerShell with identical logic.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `scripts/scan-module-design.mjs --json` + TypeScript AST non-null count + workspace importer scan | `0` | `fileCount: 8`, `totalLines: 2033`, `longFnTotal: 9`, `assertionTotal: 3`, `nonNullTotal: 9`, `serviceTotal: 2`, `importerCount: 7` (3 real external importers plus 4 regex matches on browser paths or test fixtures) |
| 2 | Export usage audit on `apps/web/src/features/deck/index.ts` across `apps/`, `packages/`, `e2e/`, `tests/` | `0` | `exportCount: 9`, `zeroProdUsage: ["OutlineNotFoundReason", "imagePageCredit"]` (`OutlineNotFoundReason`: 0 prod / 0 tests, `imagePageCredit`: 0 prod / 1 test) |
| 2b | Co-change pair filter from `scan-module-design.mjs --json` + importer line inspection | `0` | `0` co-change pairs involving `apps/web/src/features/deck/`. Real external importers: `apps/web/src/index.ts`, `apps/web/src/local-transport.ts`, and `apps/web/tests/image-research.test.mjs` |
| 4 | `git status --short` | `0` | Empty output. Zero changes under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` |

## File metrics summary

| File | Lines | Exports | Functions over 80 lines | `as` count | `!` count | `*Service` | Role |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/features/deck/deck-workflow.ts` | 812 | 1 | `DeckWorkflow.prepare` (95), `DeckWorkflow.start` (622), `call` (314) | 0 | 3 | 0 | Brief/Outline interview workflow, image review dispatch, image recovery pass, continuation handoff |
| `apps/web/src/features/deck/image-research.ts` | 483 | 3 | `WebImageResearch.prepare` (103), `ImageReviewRun.select` (98) | 0 | 3 | 0 | JSON-LD credit parsing, Commons/Tavily image verification, request-scoped review state machine |
| `apps/web/src/features/deck/generation-workflow.ts` | 384 | 1 | `GenerationWorkflow.prepare` (330), `start` (324), `call` (214) | 3 | 1 | 0 | Confirmed generation `RequestRuntime` decorator, source-read evidence ledger, 11-tool dispatcher |
| `apps/web/src/features/deck/confirmation-service.ts` | 141 | 1 | `ConfirmationService.confirm` (121) | 0 | 0 | 1 | Per-chat serialized confirmation queue, idempotency check, and generation admission |
| `apps/web/src/features/deck/brief-service.ts` | 135 | 1 | 0 | 0 | 2 | 1 | `BriefManagement` cross-store coordinator (`DeckStore` + `SqliteSessionStore`) |
| `apps/web/src/features/deck/generation-report.ts` | 58 | 1 | 0 | 0 | 0 | 0 | Closing summary formatter backed by published `DeckStore` revisions |
| `apps/web/src/features/deck/failures.ts` | 12 | 2 | 0 | 0 | 0 | 0 | Feature error class (`DeckWorkflowFailure`) and `OutlineNotFoundReason` union |
| `apps/web/src/features/deck/index.ts` | 8 | 9 | 0 | 0 | 0 | 0 | Feature public barrel |

## Export audit (`apps/web/src/features/deck/index.ts`, 9 exports)

The Step 2 script counted references across all files outside `apps/web/src/features/deck/` whose text matched `/(?<!browser\/)features\/deck\//`. Only three files actually import `apps/web/src/features/deck/index.ts`: `apps/web/src/index.ts` (lines 45-52), `apps/web/src/local-transport.ts` (line 16), and `apps/web/tests/image-research.test.mjs` (line 5). Four other regex matches (`apps/web/src/browser/boot.ts` line 27, `apps/web/tests/deck-model.test.mjs` line 4, `tests/check-boundaries.test.mjs`, and `tests/scan-module-design.test.mjs`) reference browser deck paths or string fixtures.

| Export | Kind | Source | Prod (`apps/web/src/`) | Tests | Audit note |
| --- | --- | --- | --- | --- | --- |
| `DeckWorkflowFailure` | value (class) | `./failures.ts:3` | 1 (`local-transport.ts:16,115,224`) | 0 | Mapped to HTTP statuses in `deckWorkflowStatus` |
| `OutlineNotFoundReason` | type | `./failures.ts:1` | 0 | 0 | Zero external usage. `local-transport.ts:116` checks `error.reason` through `DeckWorkflowFailure` without importing the alias |
| `BriefService` | value (class) | `./brief-service.ts:10` | 1 (`index.ts:46,274`) | 0 | `*Service` name. Wired into `startHost({ briefs })`, `ConfirmationService`, and `DeckWorkflow` |
| `ConfirmationService` | value (class) | `./confirmation-service.ts:11` | 1 (`index.ts:47,278`) | 0 | `*Service` name. Wired into `startHost({ confirmations })` |
| `DeckWorkflow` | value (class) | `./deck-workflow.ts:84` | 1 (`index.ts:48,291`) | 0 | Wired as `startHost({ requests: { runtime } })` |
| `GenerationWorkflow` | value (class) | `./generation-workflow.ts:48` | 1 (`index.ts:49,282,296`) | 0 | Wired into both `ConfirmationService` and `DeckWorkflow` in `index.ts` |
| `generationReport` | value (function) | `./generation-report.ts:5` | 1 (`index.ts:51,289`) | 0 | Wired as `startHost({ requests: { closingText } })` |
| `WebImageResearch` | value (class) | `./image-research.ts:117` | 1 (`index.ts:50,297`) | 1 (`image-research.test.mjs:5`) | Wired into `DeckWorkflow` and exercised directly in `image-research.test.mjs` |
| `imagePageCredit` | value (function) | `./image-research.ts:43` | 0 | 1 (`image-research.test.mjs:5,205-224`) | Test-only export in `index.ts`. Internal call site is `image-research.ts:200` |

Note: `image-research.ts:255` also declares `export class ImageReviewRun`, which is not re-exported by `index.ts` and has zero external importers.

## Type assertions, non-null assertions, and `*Service` symbols

### Type assertions (3)

| # | Location | Expression | Proposed replacement |
| --- | --- | --- | --- |
| 1 | `generation-workflow.ts:146` | `kind as BriefSourceRef['kind']` | Add type predicate `isSourceKind(value: unknown): value is BriefSourceRef['kind']` and call it at line 135 |
| 2 | `generation-workflow.ts:283` | `entry.kind as ContentProvenance['kind']` | Add type predicate `isProvenanceKind(value: unknown): value is ContentProvenance['kind']` and call it at line 269 |
| 3 | `generation-workflow.ts:296` | `entry.quote as string` | Check `entry.quote` inside a helper or local `const quote = proof ? requireQuote(entry.quote, proof) : undefined` so `quote` narrows to `string` without a cast |

### Non-null assertions (9)

| # | Location | Expression | Proposed guard |
| --- | --- | --- | --- |
| 1 | `brief-service.ts:43` | `item.source!.sourceId` | Bind `const source = item?.source` before the `if` at line 36, check `!source`, and read `source.sourceId` inside `.some(...)` |
| 2 | `brief-service.ts:43` | `item.source!.version` | Reuse `source.version` from guard #1 |
| 3 | `deck-workflow.ts:197` | `request.deck!` | Pass `command: NonNullable<AgentRequest['deck']>` from `prepare` (line 135) as a parameter to private `start` |
| 4 | `deck-workflow.ts:343` | `run.tools!.call(name, args)` | Bind `const baseTools = run.tools` before the ternary at line 331 and call `baseTools.call(name, args)` |
| 5 | `deck-workflow.ts:768` | `command.restoreOutlineId!` | Bind `const restoreId = restored ? command.restoreOutlineId : undefined` before line 761 and pass `restoreId` into the callback |
| 6 | `generation-workflow.ts:66` | `plan.outline.brief!.draft` | Bind `const briefRecord = plan.outline.brief`, return `{ status: 'failed', errorCode: 'BRIEF_NOT_FOUND' }` if `!briefRecord`, then read `briefRecord.draft` |
| 7 | `image-research.ts:54` | `JSON.parse(match[1]!)` | Bind `const raw = match[1]`, skip with `if (!raw) continue`, then call `JSON.parse(raw)` |
| 8 | `image-research.ts:76` | `reference(item.license)!` | Bind `const link = reference(item.license)` once before line 71 and check `link !== undefined` in the condition (removes the duplicate call too) |
| 9 | `image-research.ts:407` | `state.candidates.find(...)!` | Resolve the ranked `Candidate[]` list once during argument validation (lines 385-398) or guard `if (!candidate) throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')` |

### `*Service` symbols (2)

| # | Location | Current name | Assessment | Proposed concrete name |
| --- | --- | --- | --- | --- |
| 1 | `brief-service.ts:10` | `BriefService` | Owns real cross-store orchestration across `DeckStore` and `SqliteSessionStore` (chat existence, source receipt and attachment image verification, `sourceStates` projection, `interview` blocker merge, `SESSION_BUSY` guard, error translation). Not a thin wrapper | `BriefCoordinator` |
| 2 | `confirmation-service.ts:11` | `ConfirmationService` | Owns real per-chat async serialization queue, idempotency against `DeckStore.generation` and `SqliteSessionStore.requests`, brief staleness and source availability checks, runtime preparation, and generation grant admission. Not a thin wrapper | `ConfirmationCoordinator` |

## Deep-module diagnosis

### 1. Interface width

`apps/web/src/features/deck/index.ts` exports **9** symbols across 8 files (10 non-barrel exports exist in the folder because `image-research.ts:255` exports `ImageReviewRun` without re-exporting it from `index.ts`).

To wire `features/deck/`, `apps/web/src/index.ts` (lines 45-52, 274-298) must construct and connect **6** separate exported symbols in a specific dependency graph:

1. Construct `BriefService(presentation, store)` and pass it to `startHost({ briefs })`, `ConfirmationService`, and `DeckWorkflow`.
2. Construct `GenerationWorkflow(runtime, store)` twice (lines 282 and 296), once for `ConfirmationService` and once for `DeckWorkflow` continuation.
3. Construct `ConfirmationService(presentation, store, briefs, generationWorkflow)` and pass it to `startHost({ confirmations })`.
4. Construct `WebImageResearch` (`images`) and pass it to `DeckWorkflow` (line 297).
5. Construct `DeckWorkflow(runtime, presentation, store, briefs, generationWorkflow, images)` as `startHost({ requests: { runtime } })`.
6. Wire `generationReport(presentation, sessionId, requestId, status)` as `startHost({ requests: { closingText } })`.

`apps/web/src/local-transport.ts` (lines 16, 115-137, 224-230) must know `DeckWorkflowFailure`, its `code` strings (15 distinct codes mapped to HTTP `400`, `404`, `409`, `503`, or fallback `500`), and its `reason === 'restore-outline-missing'` distinction for `OUTLINE_NOT_FOUND`.

Two barrel exports have zero production external usage:
- `OutlineNotFoundReason` (`index.ts:2`): **0** production callers, **0** test callers.
- `imagePageCredit` (`index.ts:8`): **0** production callers, **1** test caller (`apps/web/tests/image-research.test.mjs:5,205-224`), leaking an internal HTML/JSON-LD helper through the feature barrel.

### 2. Deletion test

- **`apps/web/src/features/deck/failures.ts` (12 lines, 2 exports):** Deleting `OutlineNotFoundReason` from `index.ts:2` removes an unused public type with zero caller impact. Deleting `failures.ts` itself does **not** simplify the module: `brief-service.ts:7`, `confirmation-service.ts:8`, and `deck-workflow.ts:18` all throw `DeckWorkflowFailure`. Folding `DeckWorkflowFailure` into `deck-workflow.ts` would create an import cycle because `deck-workflow.ts:17` imports `BriefService`. Folding it into `brief-service.ts` would couple `deck-workflow.ts` and `confirmation-service.ts` to `brief-service.ts` at runtime for unrelated outline errors (`OUTLINE_NOT_FOUND`, `OutlineNotFoundReason`). Keep `failures.ts` as an internal leaf error file for now, and revisit cross-feature `failures.ts` duplication after Task 21 audits the other seven features.
- **Thin wrappers inside `brief-service.ts` and `confirmation-service.ts`:** Removing either class would scatter cross-store invariants (`DeckStore` + `SqliteSessionStore` source checks, `SESSION_BUSY` guards, per-chat confirmation mutex queue, and grant lifecycle) into `apps/web/src/index.ts`. Both classes earn their keep. However, `confirmation-service.ts:93-117` and `deck-workflow.ts:107-130` duplicate the exact `startGeneration -> prepared.start(grant, capability) -> finishGeneration -> GENERATION_INCOMPLETE / GENERATION_FAILED` wrapper. Extracting one shared internal helper (`generation-execution.ts`) removes 24 lines of duplicated lifecycle logic and keeps both entry paths aligned.
- **Duplicated prompt/tool boilerplate between `deck-workflow.ts` and `generation-workflow.ts`:** Both files define local `result(...)` (`deck-workflow.ts:47` vs `generation-workflow.ts:11`), `object(...)` (`generation-workflow.ts:10` vs `image-research.ts:19`), `{ json: string }` schema builders (`deck-workflow.ts:28-46` vs `generation-workflow.ts:36-45`), activity emitters (`deck-workflow.ts:365-367` vs `generation-workflow.ts:166-168`), and `sha256` context hashes (`deck-workflow.ts:333-335` vs `generation-workflow.ts:154-156`). Their JSON size limits (`128 KiB` vs `60 KiB`) and error payloads (`DeckError('BRIEF_INVALID', issues)` vs `'GENERATION_ARGUMENTS_INVALID'`) differ intentionally. Do not build a generic workflow framework. Sharing small internal JSON or activity helpers is optional. Splitting each workflow's prompts and tool dispatch into focused internal files removes the 314-line and 214-line `call` closures.
- **Test-only export (`imagePageCredit` in `index.ts:8`):** Removing `imagePageCredit` from `index.ts` closes the test-only export leak. `apps/web/tests/image-research.test.mjs:197-231` can exercise the same JSON-LD license rules through `WebImageResearch.prepare` with a fake `reader` (matching lines 266-299 of that test file). This follows the rule that the interface is the test surface [[3]](#ref-3).

### 3. Locality

- **Scenario A (add one new MCP tool to the outline workflow and propagate a new `DeckWorkflowFailure` error code to HTTP transport):**
  - Inside `apps/web/src/features/deck/`: **1 file** changes (`deck-workflow.ts`: instruction text lines 281-300, `stageSchemas` lines 301-322, tool allowlist line 342, handler branch inside `call` lines 338-651, and pre-run `throw new DeckWorkflowFailure(...)` in `prepare` lines 135-170). `failures.ts` does not change because `DeckWorkflowFailure.code` is untyped `string` (unless a new `reason` union member is added at `failures.ts:1-8`).
  - Across the seam in `apps/web/src/`: **1 file** changes (`local-transport.ts:115-137` `deckWorkflowStatus` to map the new code instead of falling through to HTTP `500` at line 136).
  - Total: **1 file** in `features/deck/` plus **1 file** in `apps/web/src/local-transport.ts`. Note that because `DeckWorkflowFailure.code` is a plain `string`, TypeScript cannot detect a missing HTTP status mapping in `local-transport.ts`.
- **Scenario B (add one new image-credit field returned by web image research and saved during slide generation provenance):**
  - Inside `apps/web/src/features/deck/`: **2 files** change. Update `image-research.ts:98-106` (`imagePageCredit`) and `image-research.ts:249,328,444` if review views expose the field. Update `generation-report.ts:45-48` to print the field in the closing summary. `generation-workflow.ts` does not change because image credits move through `DeckStore`'s `PreparedResearchImage` and `GenerationCapability` rather than `record_slide_provenance`.
  - Outside `features/deck/` (seam context): `packages/presentation/deck/` (`ImageCredit` contract and readback), `packages/host/contracts/` (`ImageCredit` DTO + `contract-sync.ts`), and `apps/web/src/integrations/images/` (`commons-images.ts`, `image-source.ts`).

### 4. Action classification and convention fit

Dependency categories follow `.agents/skills/codebase-design/DEEPENING.md` [[3]](#ref-3).

Checked `docs/conventions/project-structure.md` (`### apps/web/` lines 78-89, `### Runtime` lines 121-130, `### Package và feature` lines 132-145) and `docs/conventions/code.md` (`## Naming` line 15, `## TypeScript` line 22, `### Biểu diễn` lines 84-96). **No convention update is required for Task 20.** Every finding already aligns with existing project rules:
- `docs/conventions/project-structure.md` (`### apps/web/`, line 89) states that features do not require `service.ts`, and `docs/conventions/code.md` (`## Naming`, line 15) forbids generic `*Service` names that hide responsibility.
- `docs/conventions/code.md` (`## TypeScript`, line 22) forbids type assertions (`as Type`) and non-null assertions (`!`).
- `docs/conventions/project-structure.md` (`### Package và feature`, line 142) prohibits leaking private helpers through public exports for tests (`imagePageCredit`).
- `docs/conventions/code.md` (`### Biểu diễn`, line 96) forbids a shared Error Service, which explains why `failures.ts` stays local to `features/deck/`. Cross-feature `failures.ts` patterns will be evaluated after Task 21 audits the other seven feature folders.

## Classified findings

| ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact |
| --- | --- | --- | --- | --- | --- |
| FD1 | `apps/web/src/features/deck/index.ts:2,8` | Test-only export (`imagePageCredit`, 0 prod / 1 test) and unused type export (`OutlineNotFoundReason`, 0 prod / 0 test) | In-process | `focused refactor (merge or remove)`: remove `OutlineNotFoundReason` and `imagePageCredit` from `index.ts`, and test JSON-LD license rules through `WebImageResearch.prepare` | Update `apps/web/tests/image-research.test.mjs:5,197-231`. Zero production caller impact |
| FD2 | `apps/web/src/features/deck/deck-workflow.ts:94-811` | File over 400 lines (812) and 3 functions over 80 lines (`prepare` 95, `start` 622, `call` 314) mixing continuation, staging, prompts, dispatch, recovery, and commit. Duplicates generation execution (`107-130`) | Local-substitutable (`DeckStore`, `SqliteSessionStore`, `RequestRuntime`) + In-process | `focused refactor (split responsibility or narrow export surface)`: extract internal `generation-execution.ts`, `deck-prompts.ts`, and `deck-tool-session.ts`. Keep `deck-workflow.ts` under 400 lines and all functions under 80 lines | Zero external caller impact (`DeckWorkflow` constructor and `RequestRuntime` contract unchanged) |
| FD3 | `apps/web/src/features/deck/image-research.ts:43-483` | File over 400 lines (483 lines), 2 functions over 80 lines (`WebImageResearch.prepare` 103, `ImageReviewRun.select` 98) mixing pure JSON-LD parsing, provider/HTTP image verification, and request-scoped review state machine | True external (Wikimedia Commons, Tavily, `PublicImageReader`) + Local-substitutable (`AttachmentParser`) + In-process | `focused refactor (split responsibility or narrow export surface)`: extract internal `image-credit.ts` and `image-review-run.ts`, split `prepare` and `select` helpers under 80 lines, and keep `ImageReviewRun` internal | Zero production caller impact (`WebImageResearch` public API unchanged) |
| FD4 | `apps/web/src/features/deck/generation-workflow.ts:54-383` | 3 nested functions over 80 lines (`prepare` 330, `start` 324, `call` 214) mixing prompt/schema assembly, source-read evidence ledger, and 11-branch generation tool dispatch | Local-substitutable (`SqliteSessionStore`, `GenerationCapability`, `RequestRuntime`) + In-process | `focused refactor (split responsibility or narrow export surface)`: extract internal `generation-prompts.ts` and `generation-tools.ts` (evidence ledger + tool handlers) so all functions stay under 80 lines | Zero external caller impact (`GenerationWorkflow` interface unchanged) |
| FD5 | `apps/web/src/features/deck/brief-service.ts:10`, `apps/web/src/features/deck/confirmation-service.ts:11,20-140` | 2 `*Service` declarations (`BriefService`, `ConfirmationService`) and 1 function over 80 lines (`ConfirmationService.confirm` 121 lines, duplicating generation lifecycle `93-117`) | Local-substitutable (`DeckStore`, `SqliteSessionStore`, `RequestRuntime`) | `focused refactor (rename service or add boundary guard)` + `focused refactor (split responsibility or narrow export surface)`: rename to `BriefCoordinator` and `ConfirmationCoordinator`, share `generation-execution.ts`, and split `confirm` helpers under 80 lines | Update imports and instantiations in `apps/web/src/index.ts:46-47,274,278` plus internal imports in `deck-workflow.ts:17` and `confirmation-service.ts:7` |
| FD6 | `apps/web/src/features/deck/generation-workflow.ts:146,283,296` | 3 non-`as const` type assertions (`kind as BriefSourceRef['kind']`, `entry.kind as ContentProvenance['kind']`, `entry.quote as string`) | In-process | `focused refactor (rename service or add boundary guard)`: replace with `isSourceKind` and `isProvenanceKind` type predicates and a validated `quote` binding | Zero caller impact |
| FD7 | `brief-service.ts:43` (2), `deck-workflow.ts:197,343,768` (3), `generation-workflow.ts:66` (1), `image-research.ts:54,76,407` (3) | 9 non-null assertions (`!`) forbidden by `docs/conventions/code.md` line 22 | In-process (8) + Local-substitutable (1) | `focused refactor (rename service or add boundary guard)`: replace all 9 `!` expressions with bound locals, explicit guards, or narrowed parameters (`command` passed into `DeckWorkflow.start`) | Zero caller impact |
| FD8 | `apps/web/src/features/deck/failures.ts:1-12` | Non-barrel file under 30 lines (12 lines) defining `DeckWorkflowFailure` and `OutlineNotFoundReason` | In-process | `no action`: protects an acyclic leaf error seam shared by `brief-service.ts`, `confirmation-service.ts`, and `deck-workflow.ts`. Revisit cross-feature `failures.ts` patterns after Task 21 | None (barrel export `OutlineNotFoundReason` is removed under `FD1`) |
| FD9 | `apps/web/src/features/deck/generation-report.ts:5-58` | Single-purpose read formatter (58 lines, 0 long functions, 0 assertions) | Local-substitutable (`DeckStore`) | `no action`: protects the invariant that closing summaries come from published `DeckStore` revisions rather than model text | None |

## Items sent to the report

- **Untyped `DeckWorkflowFailure.code: string` (`failures.ts:5`):** `local-transport.ts:115-137` maps 15 string codes manually and falls back to HTTP `500` at line 136. Narrowing `code` to a string literal union would add compile-time drift detection across `features/deck/` and `local-transport.ts`. Evaluate this alongside other `features/*/failures.ts` files in Task 21.
- **Duplicate `GenerationWorkflow` instantiation in `apps/web/src/index.ts:282,296`:** `index.ts` constructs `new GenerationWorkflow(runtime, store)` twice when `options.generationRuntime` is omitted. Task 21 covers `apps/web/src/index.ts` wiring cleanup.
- **Duplicated `empty()` Brief draft initializer:** `brief-service.ts:52-58` and `deck-workflow.ts:21-27` both construct the same empty `BriefDraft` literal.
- **Broad `catch` block in `confirmation-service.ts:122-135`:** Duck-types `error.name === 'RequestPreparationFailure'` and `'status' in error && 'code' in error` instead of an explicit error contract. Task 21 will inspect `features/requests/` and `local-transport.ts` to check whether this seam can be simplified.

## What the commands do not prove

- Static AST inspection and symbol usage counts do not run `tsc -b`, workflow unit tests (`brief-host.test.mjs`, `image-research.test.mjs`, `research-image-generation.test.mjs`), or E2E suites (`confirmation-host.test.mjs`, `deck-pipeline.test.mjs`, `generation-bridge.test.mjs`), and do not prove behavioral parity after a refactor.
- Regex usage counts match text occurrences rather than resolved TypeScript bindings (`apps/web/src/browser/boot.ts` and `apps/web/tests/deck-model.test.mjs` matched `features/deck/` via browser paths, and `tests/check-boundaries.test.mjs` and `tests/scan-module-design.test.mjs` matched string fixtures). Run `tsc -b` during Revision 4b to check every caller before removing or renaming any export.

## References

1. <a id="ref-1"></a>[Task 20: Diagnose features/deck workflows and image research](../plan/task-20-diagnose-deck-feature-workflows.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
3. <a id="ref-3"></a>[Deepening](../../../../../.agents/skills/codebase-design/DEEPENING.md)
