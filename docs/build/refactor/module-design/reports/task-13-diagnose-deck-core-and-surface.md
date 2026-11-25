# Task 13: Presentation Deck Core and Public Surface Diagnosis Report

Read this file to review the deep-module diagnosis of `packages/presentation/deck/` and the classified finding table for owner approval [[1]](#ref-1) [[2]](#ref-2).

## Scope and commands run

Task 13 made no changes to production code, test files, `package.json`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md`. The inline `node -e` scripts from Steps 1 and 2 ran via `node -` stdin heredocs in PowerShell with identical logic.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `scripts/scan-module-design.mjs --json` + TypeScript AST non-null count + workspace importer scan | `0` | `fileCount: 10`, `totalLines: 2672`, `nonNullTotal: 15`, `importerCounts: { root: 31, brief: 2 }`, 1 `*Service` (`DeckService`), 0 type assertions, 7 functions over 80 lines |
| 2 | Export usage audit across `apps/`, `packages/`, `e2e/`, `tests/` (excluding `packages/presentation/deck/`) | `0` | `root.exportCount: 66` (`zeroProdUsage: 34`, `testOnlyUsage: 0`, `zeroUsage: 34`), `briefSubpath.exportCount: 7` (`zeroProdUsage: 4`, `testOnlyUsage: 0`, `zeroUsage: 4`) |
| 2b | Co-change + caller reference script + `rg` checks across `DeckService` methods and `provenance.ts` | `0` | `contracts.ts <-> index.ts` co-changed 9 times. `validateProvenance` appears only in `artifact-store.ts` lines 566 and 583. `DeckService` has 45 methods (37 public, 8 private) and 1 constructor |
| 4 | `git status --short` | `0` | Zero changes under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` |

## File metrics summary

| File | Lines | Exports | Functions over 80 lines | `!` count | Role |
| --- | --- | --- | --- | --- | --- |
| `packages/presentation/deck/src/index.ts` | 1,065 | 66 | `generationCapability` (82), `publishArtifactFromStage` (104), `publish` (84) | 9 | Public barrel + `DeckService` facade, lifecycle, staging, publication, readback |
| `packages/presentation/deck/src/contracts.ts` | 446 | 52 | 0 | 0 | All Brief, Outline, Generation, Image, Publication types + `DeckError` + `validId` |
| `packages/presentation/deck/src/brief.ts` | 234 | 7 | `decodeBriefDraft` (111) | 0 | Zod schema, `briefJsonSchema`, `decodeBriefDraft`, `./brief` subpath |
| `packages/presentation/deck/src/bound-outline.ts` | 218 | 3 | `saveBoundOutline` (88) | 0 | `validateBoundOutline`, `outlineChanges`, `saveBoundOutline` |
| `packages/presentation/deck/src/outline-store.ts` | 198 | 2 | `OutlineStorage.snapshot` (95) | 1 | `validateOutlineDraft` + `OutlineStorage` (legacy and bound decoding) |
| `packages/presentation/deck/src/generation-store.ts` | 149 | 3 | 0 | 0 | `validateConfirmation`, `sameConfirmation`, `GenerationStorage` |
| `packages/presentation/deck/src/brief-store.ts` | 132 | 2 | 0 | 0 | `validateBriefDraft` (catalog check) + `BriefStorage` |
| `packages/presentation/deck/src/interview.ts` | 118 | 2 | 0 | 2 | `interviewState` and `skipInterview` policy |
| `packages/presentation/deck/src/schema.ts` | 101 | 1 | `initialize` (98) | 3 | SQLite schema v1-v10 initialization and migration |
| `packages/presentation/deck/src/provenance.ts` | 11 | 1 | 0 | 0 | `validateProvenance` wrapper around `decodeContentOrigins` |

## Export audit

### Root `@deckagent/deck` (66 exports)

External usage counts exclude `packages/presentation/deck/` (including its 7 internal test files). `hostApi` covers `packages/host/api/src/`, `webProd` covers `apps/web/src/`, `otherPkg` covers non-test files in other `packages/`, and `tests` covers `apps/web/tests/`, `e2e/`, `packages/presentation/html/tests/`, and `tests/`.

| Export | Kind | Source | hostApi | webProd | otherPkg | tests | Audit note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `decodeSlideDocument` | value | `@deckagent/presentation-document` | 0 | 1 | 0 | 0 | Pass-through, used only by `apps/web/src/features/deck/generation-workflow.ts` line 3 |
| `documentText` | value | `@deckagent/presentation-document` | 0 | 0 | 0 | 0 | Pass-through, zero usage |
| `FormatError` | value | `@deckagent/presentation-document` | 0 | 1 | 0 | 0 | Pass-through, used only by `apps/web/src/features/deck/generation-workflow.ts` line 3 |
| `SlideDocument` | type | `@deckagent/presentation-document` | 0 | 0 | 0 | 0 | Pass-through, zero external importer (used in `StageStatus`, `SlideContent`, `GenerationCapability`) |
| `FormatAdapter` | type | `@deckagent/presentation-document` | 0 | 0 | 0 | 0 | Pass-through, zero external importer (used in `DeckOptions`) |
| `ArtifactDescriptor` | type | `@deckagent/presentation-document` | 0 | 0 | 0 | 0 | Pass-through, zero external importer (used in `SlideContent` and `nativeArtifact`) |
| `ValidationIssue` | type | `@deckagent/presentation-document` | 0 | 0 | 0 | 0 | Pass-through, zero external importer (used in `GenerationCapability.validate` and `DeckError`) |
| `GenerationCapability` | type | `./contracts.ts` | 1 | 0 | 0 | 0 | Port used by `packages/host/api/src/lifecycle/contracts.ts` line 1 |
| `ContentProvenance` | type | `./contracts.ts` (`ContentOrigin`) | 0 | 1 | 0 | 0 | Type alias of `@deckagent/presentation-document` `ContentOrigin`, used by `generation-workflow.ts` line 7 |
| `PreparedResearchImage` | type | `./contracts.ts` | 0 | 2 | 0 | 0 | Used in `apps/web/src/features/deck/image-research.ts` and `integrations/images/commons-images.ts` |
| `ImageCredit` | type | `./contracts.ts` | 0 | 3 | 0 | 0 | Used in `image-research.ts`, `commons-images.ts`, `image-source.ts` |
| `ImageNeed` | type | `./contracts.ts` | 0 | 1 | 0 | 0 | Used in `apps/web/src/features/deck/image-research.ts` |
| `ImageResolver` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, referenced by `prepareOutlineImages` |
| `ImageSelection` | type | `./contracts.ts` | 0 | 1 | 0 | 0 | Used in `apps/web/src/features/deck/image-research.ts` |
| `OutlineImageReview` | type | `./contracts.ts` | 0 | 1 | 0 | 0 | Used in `apps/web/src/features/deck/image-research.ts` |
| `ImageAttempt` | type | `./contracts.ts` | 0 | 1 | 0 | 0 | Used in `apps/web/src/features/deck/image-research.ts` |
| `ImageSourceCheck` | type | `./contracts.ts` | 0 | 2 | 0 | 0 | Used in `image-research.ts` and `integrations/images/image-source.ts` |
| `ImagePreparationError` | value | `./contracts.ts` | 0 | 1 | 0 | 0 | Used in `apps/web/src/features/deck/image-research.ts` |
| `outlineImageNeeds` | value | `./image-needs.ts` | 0 | 1 | 0 | 1 | Used in `deck-workflow.ts` and `apps/web/tests/image-research.test.mjs` |
| `ArtifactPublication` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, used in `GenerationCapability` |
| `ArtifactAsset` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, used in `GenerationCapability` and `StageStatus` |
| `PreparedImageAsset` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, used in `DeckOptions.preparedImage` |
| `StageChunk` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, used in `GenerationCapability.append` |
| `StageStatus` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, used in `GenerationCapability` |
| `validateConfirmation` | value | `./generation-store.ts` | 0 | 1 | 0 | 0 | Used by `apps/web/src/features/deck/confirmation-service.ts` |
| `ConfirmationReceipt` | type | `./contracts.ts` | 0 | 1 | 0 | 0 | Used by `apps/web/src/features/deck/confirmation-service.ts` |
| `ConfirmationTarget` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, supertype of `ConfirmationReceipt` |
| `GenerationSnapshot` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, used in `DeckService.generation` and `DeckSnapshot` |
| `GenerationGrant` | type | `./contracts.ts` | 1 | 0 | 0 | 0 | Port used by `packages/host/api/src/lifecycle/contracts.ts` line 1 |
| `DeckOptions` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, constructor options type |
| `validateBoundOutline` | value | `./bound-outline.ts` | 0 | 1 | 0 | 0 | Used by `apps/web/src/features/deck/deck-workflow.ts` |
| `BoundOutlineDraft` | type | `./contracts.ts` | 0 | 1 | 0 | 0 | Used by `apps/web/src/features/deck/deck-workflow.ts` |
| `BoundOutlineInput` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, parameter of `proposeBoundOutline` |
| `OutlineChanges` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, nested in `OutlineProposal` |
| `BriefProposalInput` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, parameter of `commitBriefProposal` |
| `ContentBlock` | type | `@deckagent/design` | 0 | 1* | 0 | 0 | Pass-through from `@deckagent/design`, regex matched only a prompt string literal in `deck-workflow.ts` line 286 |
| `validateBriefDraft` | value | `./brief-store.ts` | 0 | 2 | 0 | 0 | Used by `brief-service.ts` and `deck-workflow.ts` (plus `deck-brief.test.mjs`) |
| `interviewState` | value | `./interview.ts` | 0 | 2 | 0 | 0 | Used by `brief-service.ts` and `deck-workflow.ts` (plus `interview-policy.test.mjs`) |
| `skipInterview` | value | `./interview.ts` | 0 | 1 | 0 | 0 | Used by `deck-workflow.ts` (plus `interview-policy.test.mjs`) |
| `InterviewState` | type | `./contracts.ts` | 1 | 0 | 0 | 0 | Port used by `packages/host/api/src/transport/contracts.ts` line 1 |
| `BriefDraft` | type | `./contracts.ts` | 0 | 2 | 0 | 0 | Used by `brief-service.ts` and `deck-workflow.ts` |
| `BriefRecord` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, return type of `saveBrief` and `briefVersion` |
| `BriefSnapshot` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, return type of `briefSnapshot` |
| `BriefSourceRef` | type | `./contracts.ts` (`SourceReference`) | 0 | 1 | 0 | 0 | Type alias of `@deckagent/presentation-document` `SourceReference`, used in `generation-workflow.ts` line 7 |
| `InterviewTopic` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, nested in `BriefDraft` and `InterviewState` |
| `DesignSnapshot` | type | `@deckagent/design` | 0 | 0 | 0 | 0 | Pass-through from `@deckagent/design`, zero external importer |
| `CatalogRef` | type | `@deckagent/design` | 0 | 0 | 0 | 0 | Pass-through from `@deckagent/design`, zero external importer |
| `ThemeValues` | type | `@deckagent/design` | 0 | 0 | 0 | 0 | Pass-through from `@deckagent/design`, zero external importer |
| `DeckError` | value | `./contracts.ts` | 0 | 10 | 0 | 0 | Primary domain error across `apps/web/src/` |
| `deckFailureMessage` | value | `./contracts.ts` | 0 | 1 | 0 | 0 | Used by `apps/web/src/index.ts` line 11 |
| `validateOutlineDraft` | value | `./outline-store.ts` | 0 | 0 | 0 | 0 | Unused externally and unused in `packages/presentation/deck/tests/` |
| `OutlineDraft` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, parameter of unused `proposeOutline` |
| `OutlineProposal` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, nested in `OutlineSnapshot` |
| `OutlineReader` | type | `./contracts.ts` | 1 | 0 | 0 | 0 | Port used by `packages/host/api/src/transport/contracts.ts` line 1 |
| `OutlineSnapshot` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, return type of `OutlineReader.outlineSnapshot` |
| `OutlineTarget` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, parameter of `currentOutline`, `confirmOutline`, and `cancelOutline` |
| `ConfirmedDeckPlan` | type | `./contracts.ts` | 0 | 1 | 0 | 0 | Used by `apps/web/src/index.ts` line 13 |
| `DeckChange` | type | `./contracts.ts` | 1 | 0 | 0 | 0 | Port event used by `packages/host/api/src/transport/deck-routes.ts` line 2 |
| `DeckPublisher` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Unused port interface anywhere (implemented by `DeckService`, never imported) |
| `DeckReader` | type | `./contracts.ts` | 2 | 0 | 0 | 0 | Port used by `packages/host/api/src/transport/{contracts,deck-routes}.ts` |
| `DeckSnapshot` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, return type of `DeckReader.snapshot` |
| `DeckSlide` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, nested in `DeckSnapshot` |
| `PublishedSlide` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, return type of `publish` and `publishArtifact` |
| `PublishSlide` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, parameter of `publish` |
| `SlideContent` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | Zero external importer, return type of `DeckReader.content` |
| `DeckService` | value | `./index.ts` | 0 | 6 | 0 | 15 | `*Service` class, imported by 6 `apps/web/src/` files, 13 test files, and 2 boundary test fixtures |

### Subpath `@deckagent/deck/brief` (7 exports)

Only `apps/web/src/features/deck/deck-workflow.ts` (line 11) and `tests/check-boundaries.test.mjs` (lines 46 and 51, string fixtures) match `@deckagent/deck/brief`. Inside `deck-workflow.ts`, line 11 imports only `briefContractVersion` and `briefJsonSchema`, while line 10 imports `BriefDraft` from `@deckagent/deck` root.

| Export | Kind | hostApi | webProd | otherPkg | tests | Audit note |
| --- | --- | --- | --- | --- | --- | --- |
| `BriefDraft` | type | 0 | 1* | 0 | 0 | Regex matched `deck-workflow.ts` line 10 (`@deckagent/deck` root import, not subpath) |
| `BriefSourceRef` | type | 0 | 0 | 0 | 0 | Unused via `./brief` |
| `InterviewTopic` | type | 0 | 0 | 0 | 0 | Unused via `./brief` |
| `briefContractVersion` | value | 0 | 1 | 0 | 0 | Imported by `deck-workflow.ts` line 11 |
| `briefTopics` | value | 0 | 0 | 0 | 0 | Unused via `./brief` |
| `briefJsonSchema` | value | 0 | 1 | 0 | 0 | Imported by `deck-workflow.ts` line 11 |
| `decodeBriefDraft` | value | 0 | 0 | 0 | 0 | Imported only internally (`brief-store.ts` line 6) and by `deck-brief.test.mjs` line 10 via `../lib/brief.js` |

### Subpath `./brief` vs `host/contracts/src/brief-validation.ts`

`packages/presentation/deck/src/brief.ts` (lines 8-190) and `packages/host/contracts/src/brief-validation.ts` (lines 14-147) duplicate `briefTopics`, the `BriefDraft` Zod `shape` (including `sources`, `images`, `answers`, `themeOverrides`), the 128 KiB UTF-8 size check, and all 8 cross-field checks. They differ only in error reporting. `brief.ts` collects `ValidationIssue[]` with `.describe(...)` hints for `briefJsonSchema` and throws `DeckError('BRIEF_INVALID', issues)`. `brief-validation.ts` exposes boolean `isWireBriefDraft` for `decodeBriefView` without importing `@deckagent/deck` runtime errors. In addition, `packages/host/contracts/src/brief.ts` (lines 1-113) and `packages/host/contracts/src/deck.ts` (lines 1-198) duplicate 28 TypeScript interfaces from `deck/src/contracts.ts` and `@deckagent/design`, with no compile-time `AssertEqual` check in `packages/host/api/src/contract-sync.ts`.

## Non-null assertions (`!`) across core files

| # | Location | Expression | Proposed guard |
| --- | --- | --- | --- |
| 1 | `index.ts:378` | `this.db.prepare('SELECT payload FROM generation_intents WHERE session_id=?').get(sessionId)!` | Assign `row` and throw `new DeckError('GENERATION_NOT_FOUND')` if `!row` |
| 2 | `index.ts:403` | `Number(this.db.prepare('SELECT version FROM decks WHERE session_id=?').get(sessionId)!.version)` | Read `deck` inside a helper or inside `this.transaction(...)` and throw `DECK_CORRUPT` when `!deck` |
| 3 | `index.ts:427` | `Number(this.db.prepare('SELECT version FROM decks WHERE session_id=?').get(sessionId)!.version)` | Return `{ grant, version }` from `this.transaction(...)` using a guarded `deckVersion(sessionId)` helper |
| 4 | `index.ts:454` | `Number(this.db.prepare('SELECT version FROM decks WHERE session_id=?').get(sessionId)!.version)` | Return `version` from `this.transaction(...)` using the same guarded `deckVersion(sessionId)` helper |
| 5 | `index.ts:548` | `const generation = this.generations.get(grant.sessionId)!` | Reuse `{ generation } = this.access(() => this.granted(grant))` from the grant check instead of re-querying SQLite |
| 6 | `index.ts:713` | `Number(this.db.prepare('SELECT version FROM decks WHERE session_id=?').get(grant.sessionId)!.version) + 1` | Guard `const deck = ...`, and if `!deck` throw `new DeckError('DECK_NOT_CONFIRMED')` |
| 7 | `index.ts:806` | `...(this.generations.get(sessionId) ? { generation: this.generations.get(sessionId)! } : {})` | Store `const generation = this.generations.get(sessionId)` once, then spread conditionally |
| 8 | `index.ts:944` | `...(this.artifacts.notes(row) ? { notes: this.artifacts.notes(row)! } : {})` | Store `const notes = this.artifacts.notes(row)` once (also removes duplicate JSON parse), then spread conditionally |
| 9 | `index.ts:971` | `...(this.artifacts.notes(artifact) ? { notes: this.artifacts.notes(artifact)! } : {})` | Store `const notes = this.artifacts.notes(artifact)` once, then spread conditionally |
| 10 | `schema.ts:7` | `Number(db.prepare('PRAGMA application_id').get()!.application_id)` | Read `ownerRow`, and throw `new DeckError('DECK_SCHEMA')` if `!ownerRow` |
| 11 | `schema.ts:8` | `Number(db.prepare('PRAGMA user_version').get()!.user_version)` | Read `versionRow`, and throw `new DeckError('DECK_SCHEMA')` if `!versionRow` |
| 12 | `schema.ts:79` | `db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok'` | Use optional chaining: `db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok'` |
| 13 | `interview.ts:114` | `listTemplates('html')[0]!.id` | Bind `const defaultTemplate = listTemplates('html')[0]`, and if `!defaultTemplate` throw `new DeckError('DECK_CONFIG')` |
| 14 | `interview.ts:114` | `listTemplates('html')[0]!.version` | Reuse `defaultTemplate.version` from guard #13 |
| 15 | `outline-store.ts:166` | `return this.snapshot(sessionId).proposals.at(-1)!` | Bind `const created = ...`, and if `!created` throw `new DeckError('DECK_CORRUPT')`, or construct the proposal directly |

## Deep-module diagnosis

### 1. Interface width

The package exports **66** root symbols (`index.ts` lines 4-92) and **7** `./brief` symbols (`brief.ts` lines 5-124). `DeckService` (`index.ts` lines 92-1065) exposes **37** public methods (45 total methods: 37 public + 8 private, plus 1 constructor). Of the 66 root exports, **34** have zero external production or test usage by name. Those 34 exports include 10 pass-through symbols from `@deckagent/presentation-document` and `@deckagent/design` (`ContentBlock` matched only a prompt string literal in `deck-workflow.ts` line 286). `DeckService` mixes seven responsibilities behind one class:

| Responsibility | Public methods | Private methods | Notes |
| --- | --- | --- | --- |
| Brief CRUD and atomic proposal receipts | 4 (`briefSnapshot`, `briefVersion`, `saveBrief`, `commitBriefProposal`) | 0 | `commitBriefProposal` (47 lines) bridges Brief, Bound Outline, Images, and `brief_request_receipts` |
| Outline (bound + legacy) | 7 (`outlineSnapshot`, `proposeBoundOutline`, `beginOutline`, `proposeOutline`, `currentOutline`, `confirmOutline`, `cancelOutline`) | 0 | 5 legacy methods have zero `apps/web` or `host/api` callers (`currentOutline` has zero callers anywhere) |
| Image research and preview | 5 (`prepareOutlineImages`, `reserveImageSearch`, `outlineImagePreview`, `restoredOutlineImage`, `imageBlockers`) | 0 | `reserveImageSearch` writes SQLite directly instead of delegating to `ArtifactStorage` |
| Generation lifecycle and grant | 8 (`generation`, `confirmGeneration`, `continueGeneration`, `admitGeneration`, `startGeneration`, `finishGeneration`, `reconcileGenerations`, `generationCapability`) | 1 (`granted`) | 5 lifecycle methods write `generation_intents` SQL directly in `index.ts`, bypassing `GenerationStorage` |
| Artifact staging | 4 (`beginStage`, `appendStage`, `attachStageImage`, `publishArtifact`) | 1 (`publishArtifactFromStage`) | All 4 public staging methods have zero external callers (only called through `generationCapability`) |
| Deck plan, publication, and readback | 7 (`confirm`, `snapshot`, `publish`, `provenance`, `slideMetadata`, `content`, `nativeArtifact`) | 1 (`insertPlan`) | `publish` (legacy raw HTML) and `DeckPublisher` have zero production callers |
| Subscriptions and DB transactions | 2 (`subscribe`, `close`) | 5 (`id`, `access`, `asyncAccess`, `transaction`, `notify`) | `access` translates `DesignError` and `FormatError` to `DeckError` |

To use `@deckagent/deck`, callers must learn eight domain concepts: `BriefDraft`/`InterviewState`, legacy `OutlineDraft` vs `BoundOutlineDraft`, `ConfirmedDeckPlan`, 5-state `GenerationSnapshot`, WeakSet-enforced `GenerationGrant` + `GenerationCapability`, staging sequences, legacy HTML vs portable artifact publication, and `DeckChange` invalidations. A concrete non-`*Service` replacement name is **`DeckStore`**, matching `SqliteSessionStore` and `WorkspaceRegistry`. Renaming or splitting `DeckService` affects 6 `apps/web/src/` files (`index.ts`, `features/chats/index.ts`, `features/deck/{brief-service,confirmation-service,deck-workflow,generation-report}.ts`), 13 test files (`apps/web/tests/` 3, `e2e/` 9, `packages/presentation/html/tests/` 1, excluding internal `deck/tests/`), and 2 boundary test string fixtures (`tests/{check,oxlint}-boundaries.test.mjs`).

### 2. Deletion test

- **`packages/presentation/deck/src/provenance.ts` (11 lines, 1 export):** Fold `validateProvenance` into `artifact-store.ts` (lines 566 and 583). That change removes a non-barrel file under 30 lines with zero external caller impact.
- **`./brief` subpath (`package.json` lines 9-12, `brief.ts`):** Only `apps/web/src/features/deck/deck-workflow.ts` (line 11) imports `briefContractVersion` and `briefJsonSchema` from `@deckagent/deck/brief`. Lines 9-10 of that same file already import `@deckagent/deck` root. `brief.ts` also imports `DeckError` from `contracts.ts` (which imports `@deckagent/presentation-document`), and no Browser file uses `./brief`. Removing `./brief` and exporting `briefContractVersion` and `briefJsonSchema` from root lowers caller import friction across `deck-workflow.ts` line 11 and `tests/check-boundaries.test.mjs` lines 46 and 51.
- **Pass-through re-exports (`index.ts` lines 4-10, `contracts.ts` line 12, `index.ts` lines 56, 67-69):** Removing all 7 `@deckagent/presentation-document` pass-throughs from `index.ts` lines 4-10 drops 5 unused exports (`documentText`, `SlideDocument`, `FormatAdapter`, `ArtifactDescriptor`, `ValidationIssue`). It also shifts 1 caller (`apps/web/src/features/deck/generation-workflow.ts` line 3) to import `decodeSlideDocument` and `FormatError` directly from `@deckagent/presentation-document` (already in `apps/web/package.json` line 21). Removing the 4 `@deckagent/design` pass-throughs (`ContentBlock`, `DesignSnapshot`, `CatalogRef`, `ThemeValues`) drops 4 exports with zero external `import` callers (`apps/web/package.json` line 16 already depends on `@deckagent/design`).
- **Thin / unused `DeckService` methods:** Hiding `beginStage`, `appendStage`, `attachStageImage`, and `publishArtifact` inside `generationCapability` shrinks `DeckService`'s public surface by 4 methods with zero caller impact. By contrast, exposing `BriefStorage`, `OutlineStorage`, or `GenerationStorage` directly to callers would raise caller complexity by leaking SQLite transactions, ID checks, and error translation.

### 3. Locality

- **Scenario A (add one optional field to `BriefDraft`, check at boundary, persist in SQLite):** Changes **4** files in `packages/presentation/deck/src/`. Maintainers update `contracts.ts` (lines 16-44) and `brief.ts` (Zod `shape` lines 76-102 and projection lines 210-233). They also update `brief-store.ts` (lines 10-57) and `interview.ts` (lines 23-118) when catalog or readiness rules use the field. `BriefStorage` stores JSON, so `schema.ts` needs no migration. Across the `host/contracts` seam, **2** more files must change in lockstep: `packages/host/contracts/src/brief.ts` (lines 51-79) and `packages/host/contracts/src/brief-validation.ts` (lines 64-82, 122-147), with no compile-time parity check.
- **Scenario B (add one generation failure status or stage transition and emit a deck change event):** Changes **4** files in `packages/presentation/deck/src/`. Maintainers update `contracts.ts` (lines 111-121, 388-439), `schema.ts` (lines 28, 55-60, 78 if `generation_intents.state` grows), `generation-store.ts` (lines 81-83), and `index.ts` (lines 369-474, `publishArtifactFromStage` lines 636-739, and `this.notify`). Across the `host/contracts` seam, `packages/host/contracts/src/deck.ts` (line 97) and `packages/host/contracts/src/generation-validation.ts` (lines 31, 60-61) also duplicate the `GenerationSnapshot['state']` union and checks.
- **Co-change rationale (`contracts.ts <-> index.ts`, 9 shared commits):** Git history (`f5e0d2d` through `54a2574`) shows `contracts.ts` and `index.ts` changed together across 9 feature increments. Those increments covered design catalog, brief, interview, bound outline, generation confirmation, portable artifacts, image review, and layouts. Each new contract type or error code in `contracts.ts` required matching re-exports and `DeckService` methods in `index.ts`.

### 4. Action classification and convention fit

Dependency categories follow `.agents/skills/codebase-design/DEEPENING.md` [[3]](#ref-3). Hard-fit friction appears in `docs/conventions/project-structure.md` under `### packages/` (lines 95-97 and 111) and `### Package và feature` (line 137). Forbidding `host/contracts/` from depending on `deck/` forces duplicated `BriefDraft` Zod rules and 28 DTO types across `host/contracts/` and `deck/`. In addition, `### packages/` (line 111) documents the `AssertEqual` compile-time parity rule only for `session/persistence/`, omitting `presentation/deck/`.

## Classified findings and owner decisions

| ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | `packages/presentation/deck/src/provenance.ts:1-11` | Non-barrel file under 30 lines (11 lines) wrapping `decodeContentOrigins` | In-process | `focused refactor (merge or delete)`: remove `provenance.ts` and inline `validateProvenance` in `artifact-store.ts` | Zero external callers (`artifact-store.ts:45,566,583` only) | Approved for Revision 3b |
| D2 | `packages/presentation/deck/src/index.ts:4-10,56,67-69`, `contracts.ts:12` | Pass-through re-exports from `@deckagent/presentation-document` (7) and `@deckagent/design` (4), 9 unused externally | In-process | `focused refactor (merge or delete)`: remove all 11 pass-through re-exports from `index.ts` and `contracts.ts` | Update 1 file (`apps/web/src/features/deck/generation-workflow.ts:3` imports directly from `@deckagent/presentation-document`) | Approved for Revision 3b |
| D3 | `packages/presentation/deck/package.json:9-12`, `brief.ts:1-234` | `./brief` subpath has 1 real importer (which also imports root), and `decodeBriefDraft` is 111 lines (>80) | In-process | `focused refactor (merge or delete)`: remove `./brief` subpath (export `briefContractVersion` and `briefJsonSchema` from root) and split `decodeBriefDraft` helpers under 80 lines | Update `apps/web/src/features/deck/deck-workflow.ts:11` and `tests/check-boundaries.test.mjs:46,51` | Approved for Revision 3b |
| D4 | `packages/presentation/deck/src/contracts.ts:1-446`, `index.ts:34-87` | `contracts.ts` is 446 lines (>400), and 66 root exports include 23 own exports with zero external usage (`DeckPublisher`, `validateOutlineDraft`, etc.) | In-process | `focused refactor (split responsibility or narrow export surface)`: split `contracts.ts` by domain (`brief`, `outline`, `generation`, `deck`, `errors`) and remove unused root exports (`DeckPublisher`, `validateOutlineDraft`, internal types not in public signatures) | Check `tsc -b` across `host/api` and `apps/web`, with zero production callers using removed exports | Approved for Revision 3b |
| D5 | `packages/presentation/deck/src/index.ts:92-1065` | `*Service` symbol (`DeckService`), 1,065 lines (>400), 45 methods across 7 concerns, and 3 methods >80 lines (`509`, `636`, `828`). Also 4 unused public staging methods (`500`, `592`, `599`, `614`), duplicated publication idempotency checks (`660-679`, `695-707`, `854-884`), and direct SQL writes bypassing `GenerationStorage` | Local-substitutable (`DatabaseSync`, `ArtifactStorage`) | `focused refactor (split responsibility or narrow export surface)` + `focused refactor (rename service or add boundary guard)`. Rename `DeckService` to `DeckStore`. Hide the 4 staging wrappers inside `generationCapability`. Move `generation_intents` SQL writes into `generation-store.ts`. Extract publication helpers under 80 lines | Rename `DeckService` in 6 `apps/web/src/` files, 13 test files, and 2 boundary test fixtures, while keeping active method signatures compatible | Approved for Revision 3b |
| D6 | `bound-outline.ts:131-218`, `outline-store.ts:45-139`, `schema.ts:4-101` | 3 functions >80 lines (`saveBoundOutline` 88, `OutlineStorage.snapshot` 95, `initialize` 98), and `OutlineStorage.snapshot` creates `new BriefStorage(this.db)` inside `.map` | Local-substitutable (`DatabaseSync`) | `focused refactor (split responsibility or narrow export surface)`: extract validation, diff, and persistence helpers under 80 lines and reuse injected `BriefStorage` | Zero caller impact (signatures preserved) | Approved for Revision 3b |
| D7 | `index.ts:378,403,427,454,548,713,806,944,971`, `schema.ts:7,8,79`, `interview.ts:114`, `outline-store.ts:166` | 15 non-null assertions (`!`) forbidden by `docs/conventions/code.md` line 22 | Local-substitutable (13) + In-process (2) | `focused refactor (rename service or add boundary guard)`: replace all 15 `!` expressions with explicit `if (!row)` / `DeckError` guards, optional chaining, and single-lookup locals | Zero caller impact | Approved for Revision 3b |
| D8 | `packages/host/contracts/src/{brief,deck,brief-validation,outline-validation,generation-validation}.ts` vs `packages/presentation/deck/src/{contracts,brief}.ts` | Duplicated `BriefDraft` Zod schema and 28 DTO interfaces across `host/contracts` and `deck` without a parity check | In-process | `convention update` (`docs/conventions/project-structure.md` section `### packages/` line 111) + `focused refactor (rename service or add boundary guard)`: document the duplicate `host/contracts <-> deck` DTO rule matching `P8` and add an `AssertEqual` compile-time check in `packages/host/api/src/contract-sync.ts` | Zero runtime caller impact, with compile-time drift protection | Approved by owner |
| D9 | `DeckReader`, `OutlineReader`, `DeckChange`, `InterviewState`, `GenerationCapability`, `GenerationGrant`, `BriefStorage`, `GenerationStorage`, `DeckError` | Port interfaces, storage boundaries, and domain error hierarchy | In-process / Local-substitutable | `no action`: protects Transport vs Domain seam (`host/api`), WeakSet grant authority, and SQLite transaction atomicity | None | Approved |

## Items sent to the report

- **Legacy compatibility methods with zero production callers:** `DeckService.publish` (lines 828-911), `beginOutline` (line 308), `proposeOutline` (line 742), `currentOutline` (line 752), `confirmOutline` (line 759), and `cancelOutline` (line 772) have zero production callers. `OutlineStorage`'s legacy `outline_proposals` branch (lines 119-136) also has zero production callers. `apps/web/src/index.ts` (line 169) calls `confirm` (line 125) only for `options.confirmedDecks` fixture seeding. These items remain unchanged until the owner decides whether TASK-005/006 fixtures stay.
- **Schema sanity check gap:** `schema.ts` lines 81-94 run `SELECT ... LIMIT 0` checks on 12 tables from v1-v6, but omit `prepared_images` (v8) and `image_search_attempts` (v9).
- **Double reads inside `DeckService`:** `snapshot` (line 806) calls `this.generations.get(sessionId)` twice, and `slideMetadata` / `content` (lines 944, 971) call `this.artifacts.notes(...)` twice (fixed by the D7 guards).
- **Hardcoded default template/design-system in `interview.ts`:** `skipInterview` (`interview.ts` lines 114-116) hardcodes `'deckagent-neutral'` version `1` and inspects `listTemplates('html')[0]`.
- **Cross-package `presentation/design` co-changes:** `contracts.ts <-> design/contracts.ts` (3x) and `index.ts <-> design/index.ts` (4x) sit on the `presentation/design` seam covered by Task 14.

## What the commands do not prove

- Static AST inspection and regex symbol audits do not run `tsc -b`, SQLite storage tests, or E2E suites, and do not prove behavioral parity after a refactor.
- Regex symbol counts match identifiers inside file text, including string literals (`ContentBlock` in `deck-workflow.ts` line 286 and fixtures in `tests/check-boundaries.test.mjs`). Run `tsc -b` before removing exported types to catch indirect signature dependencies.
- Co-change counts come from `git log` history over the last 200 non-merge commits rather than single-commit diffs.

## References

1. <a id="ref-1"></a>[Task 13: Diagnose presentation/deck core, stores, and public surface](../plan/task-13-diagnose-deck-core-and-surface.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
3. <a id="ref-3"></a>[Deepening](../../../../../.agents/skills/codebase-design/DEEPENING.md)
