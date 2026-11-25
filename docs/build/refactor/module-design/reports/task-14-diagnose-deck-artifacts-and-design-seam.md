# Task 14: Presentation Deck Artifact Storage and Design Seam Diagnosis Report

Read this file to review the deep-module diagnosis of `packages/presentation/deck/` artifact storage and the `packages/presentation/design/` contract seam for owner approval [[1]](#ref-1) [[2]](#ref-2).

## Scope and commands run

Task 14 made no changes to production code, test files, `package.json`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md`. The inline `node -e` scripts from Steps 1 and 2 ran via `node -` stdin heredocs in PowerShell with identical logic.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `scripts/scan-module-design.mjs --json` + TypeScript AST non-null count + `@deckagent/design` importer scan | `0` | `fileCount: 4`, `totalLines: 1597`, `typeAssertionTotal: 5`, `nonNullTotal: 20`, `designImporterCount: 22`, 4 functions over 80 lines |
| 2 | Export usage audit for `@deckagent/design` across `apps/`, `packages/`, `e2e/`, `tests/` | `0` | `exportCount: 20`, `zeroProdUsage: ["DesignSystem", "SlideContentPlan", "Template", "validateTheme"]`, `deckOnly: 8` |
| 2b | Co-change query, `rg` import/caller audits, and `git log` history across `deck/` and `design/` | `0` | `deck/index.ts <-> design/index.ts` (4x), `deck/contracts.ts <-> design/contracts.ts` (3x), `deck/contracts.ts <-> design/index.ts` (3x), `deck/index.ts <-> design/contracts.ts` (3x). `outlineImageNeeds` has 2 internal callers and 1 external production caller (`deck-workflow.ts`) |
| 4 | `git status --short` | `0` | Zero modifications before report edits |

## File metrics summary

| File | Lines | Exports | Functions over 80 lines | `as` count | `!` count | Role |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/presentation/deck/src/artifact-store.ts` | 985 | 2 | `ArtifactStorage.prepareImages` (87), `ArtifactStorage.researchImage` (85) | 2 | 6 | `PreparedArtifact` + `ArtifactStorage` (36 methods across outline image preparation, slide staging, manifest/disk I/O, and recovery) |
| `packages/presentation/deck/src/image-needs.ts` | 38 | 1 | 0 | 0 | 0 | `outlineImageNeeds` pure policy helper (`web-images-v2` SHA-256 `needId`) |
| `packages/presentation/design/src/contracts.ts` | 89 | 11 | 0 | 0 | 0 | Design catalog, `ContentBlock`, `WebImageIntent`, `DesignSnapshot`, `Layout`, `LayoutIssue`, `DesignError` |
| `packages/presentation/design/src/index.ts` | 485 | 20 | `validateContentPlan` (95), anonymous `.map` (82) | 3 | 14 | Catalog v1-v3 definitions, theme/snapshot resolution, content plan validation, layout compatibility, `reviewLayouts` |

## Export audit and responsibility map

### Root `@deckagent/design` (20 exports)

Counts below reflect direct file references across non-test source files (`deck`, `document`, `html`, `webProd`) and external tests (`tests`). Direct `import` inspection shows `Layout` in `generation-workflow.ts` matched the word `Layout` inside a prompt string literal at line 102 rather than an `import` statement.

| Export | Kind | Origin | deck | document | html | webProd | tests | Audit note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `DesignError` | value | `./contracts.ts` | 2 | 0 | 0 | 1 | 0 | Domain error mapped in `deck/src/index.ts` and `brief-store.ts`. Imported in `apps/web/src/features/deck/brief-service.ts` |
| `WebImageIntent` | type | `./contracts.ts` | 1 | 0 | 0 | 0 | 0 | Referenced by `ImageNeed.intent` in `deck/src/contracts.ts:168`. Duplicated in `host/contracts/src/deck.ts:4` |
| `CatalogRef` | type | `./contracts.ts` | 2 | 0 | 0 | 0 | 0 | Used in `deck/src/contracts.ts` and re-exported (pass-through) by `deck/src/index.ts:68` |
| `ContentBlock` | type | `./contracts.ts` | 2 | 1 | 0 | 1* | 0 | Used by `deck/src/contracts.ts` and `document/src/index.ts:1`. Regex matched a prompt string in `deck-workflow.ts:286`. Duplicated in `host/contracts/src/deck.ts:12` |
| `DesignSnapshot` | type | `./contracts.ts` | 2 | 1 | 1 | 0 | 0 | Cross-package snapshot shared across `deck`, `document` (`FormatContext`), and `html` (`policy.ts`) |
| `DesignSystem` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | 0 | Zero direct importers. Return element type of `listDesignSystems` |
| `Layout` | type | `./contracts.ts` | 0 | 0 | 0 | 1* | 0 | Zero `import` statements (`webProd` regex matched prompt text in `generation-workflow.ts:102`). Element type of `Template.layouts` |
| `SlideContentPlan` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | 0 | Zero direct importers. Parameter and return type of `validateContentPlan` and `reviewLayouts` |
| `Template` | type | `./contracts.ts` | 0 | 0 | 0 | 0 | 0 | Zero direct importers. Return element type of `listTemplates` |
| `ThemeValues` | type | `./contracts.ts` | 2 | 0 | 0 | 0 | 0 | Used by `deck/src/contracts.ts:43` (`themeOverrides`) and re-exported (pass-through) by `deck/src/index.ts:69` |
| `LayoutIssue` | type | `./contracts.ts` | 1 | 0 | 0 | 0 | 0 | Used by `OutlineProposal.layoutIssues` in `deck/src/contracts.ts:314`. Duplicated in `host/contracts/src/deck.ts:28` |
| `listDesignSystems` | value | `./index.ts:127` | 0 | 0 | 0 | 1 | 0 | Catalog query used by `apps/web/src/features/deck/deck-workflow.ts:267` |
| `listTemplates` | value | `./index.ts:130` | 1 | 0 | 0 | 2 | 1 | Used by `deck/src/interview.ts:114`, `deck-workflow.ts:267`, `generation-workflow.ts:81`, and `layout-quality.test.mjs` |
| `validateTheme` | value | `./index.ts:144` | 0 | 0 | 0 | 0 | 0 | Zero production callers. Directly tested in `design/tests/design-catalog.test.mjs:121` |
| `resolveDesign` | value | `./index.ts:161` | 1 | 0 | 0 | 0 | 5 | Used by `deck/src/brief-store.ts:24` and 5 test suites (`brief-client`, `outline-client`, `portable-generation`, `html-template`, `html-template-v3`) |
| `decodeDesignSnapshot` | value | `./index.ts:189` | 2 | 0 | 0 | 0 | 0 | Used by `deck/src/brief-store.ts` and `generation-store.ts` |
| `validateContentPlan` | value | `./index.ts:239` | 1 | 0 | 0 | 0 | 0 | Used by `deck/src/bound-outline.ts:58` and internally by `findCompatibleLayouts` and `reviewLayouts` |
| `findCompatibleLayouts` | value | `./index.ts:335` | 0 | 0 | 1 | 1 | 1 | Used by `html/src/controlled-template.ts`, `generation-workflow.ts:91`, and `html-template-v3.test.mjs` |
| `resolveLayout` | value | `./index.ts:400` | 1 | 0 | 0 | 0 | 0 | Used by `deck/src/artifact-store.ts:397` (`ArtifactStorage.begin`) |
| `reviewLayouts` | value | `./index.ts:409` | 1 | 0 | 0 | 1 | 1 | Used by `deck/src/index.ts:157,351`, `deck-workflow.ts:512`, and `apps/web/tests/layout-review.test.mjs` |

### `ArtifactStorage` responsibility map (36 methods + 1 constructor)

`ArtifactStorage` (`packages/presentation/deck/src/artifact-store.ts:94-985`) owns 25 public methods and 11 private methods across two distinct functional areas over shared SQLite and disk-file state.

| Internal responsibility | Methods (public / private) | Lines | State and external dependencies |
| --- | --- | --- | --- |
| Outline image preparation and review | 6 public (`prepareImages`, `commitImages`, `imageReview`, `imagePreview`, `restoredImage`, `imageBlockers`), 1 private (`preparedRecord`) | `167-372` | `prepared_images` SQLite table, `preparations` `WeakMap`, `outlineImageNeeds`, `options.researchImage`, `options.activeRequest`, disk read/write (`256 KiB` PNG) |
| Slide staging and publication manifest | 12 public (`begin`, `setDocument`, `draft`, `append`, `setProvenance`, `asset`, `researchImage`, `prepare`, `receiptFingerprint`, `removeValidationArtifact`, `published`, `discard`), 7 private (`stage`, `status`, `context`, `matchesNeed`, `documentFromPlan`, `source`, `manifest`) | `162-166`, `373-580`, `593-736`, `765-891` | In-memory `stages` `Map`, `stageAttempts`/`imageAttempts`/`researchImages` `WeakMap`s, `resolveLayout`, `decodeSlideDocument`, `FormatAdapter`, `options.preparedImage`, `options.researchImage`, `options.renderCheck` |
| Persisted readback and disk recovery | 7 public (`provenance`, `notes`, `imageMetadata`, `content`, `native`, `metadata`, `recover`), 3 private (`path`, `write`, `read`) | `128-161`, `581-592`, `737-763`, `892-984` | `artifactRoot` filesystem (`lstatSync`/`realpathSync`/`O_NOFOLLOW`), `artifact_revisions` + `prepared_images` SQLite tables, `validateProvenance`, `decodeSlideDocument`, `decodeArtifactDescriptor` |

### `packages/presentation/design/src/index.ts` internal structure

| Section | Lines | Symbols | Notes |
| --- | --- | --- | --- |
| Re-exports and types | `1-25` | 11 re-exported symbols from `./contracts.ts` | Surface barrel mixed into `index.ts` |
| Static catalog v1-v3 | `27-133` | `immutable`, `system`, `template`, `templateV2`, `templateV3`, `selectedTemplate`, `listDesignSystems`, `listTemplates` | Immutable catalog data and lookup |
| Theme and snapshot validation | `134-232` | `reference`, `validateTheme`, `resolveDesign`, `decodeDesignSnapshot` | Theme validation + SHA-256 snapshot fingerprinting |
| Content plan validation | `234-333` | `only`, `text`, `texts`, `validateContentPlan` (95 lines) | Per-kind block decoder with inline 82-line `.map` callback and `WebImageIntent` checks |
| Layout compatibility and review | `335-485` | `findCompatibleLayouts`, `resolveLayout`, `reviewLayouts` | Capacity matching across v1-v3 layouts and field-level `LayoutIssue` reporting |

## Type assertions and non-null assertions audit

### Non-`as const` type assertions (`5` total)

| # | Location | Expression | Boundary behavior and proposed guard |
| --- | --- | --- | --- |
| 1 | `artifact-store.ts:282` | `JSON.parse(String(r.payload)) as PreparedRecord` | Unchecked `JSON.parse` throws raw `SyntaxError` (mapped by `DeckService.access` to `DECK_STORAGE` instead of `ARTIFACT_CORRUPT`) and trusts parsed fields (`line 188` and `line 959` have the same unguarded parse). Replace with `parsePreparedRecord(raw: unknown): PreparedRecord` throwing `DeckError('ARTIFACT_CORRUPT')` |
| 2 | `artifact-store.ts:590` | `return notes as string | undefined` | `JSON.parse(String(row.manifest)).notes` lacks object/JSON guard (`SyntaxError` maps to `DECK_STORAGE`). Guard `manifest` object and rewrite lines `588-590` with early return (`if (notes === undefined) return undefined`) and `typeof notes !== 'string'` guard |
| 3 | `design/src/index.ts:148` | `Object.keys(system.theme) as (keyof ThemeValues)[]` | `Object.keys` widens keys to `string[]`. Replace with an explicit `const THEME_KEYS: readonly (keyof ThemeValues)[]` tuple matching `ThemeValues` |
| 4 | `design/src/index.ts:313` | `block.intent as unknown` | Part 1 of double cast after inline `isRecord` validation on lines `290-303`. Extract `decodeWebImageIntent(value: unknown): WebImageIntent` returning a newly constructed typed object |
| 5 | `design/src/index.ts:313` | `... as import('./contracts.ts').WebImageIntent` | Part 2 of double cast at line `313`. Eliminated by returning a constructed `WebImageIntent` from `decodeWebImageIntent` |

### Non-null assertions (`20` total)

| # | Location | Expression | Proposed guard |
| --- | --- | --- | --- |
| 1 | `artifact-store.ts:203` | `this.options.researchImage!(sessionId, query, signal)` | Bind `const research = this.options.researchImage` once, branch on `resolver` vs `if (!research) throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')` |
| 2 | `artifact-store.ts:291` | `outline.slides[need.slideIndex]!` | Bind `const slide = outline.slides[need.slideIndex]`. Throw `DeckError('DECK_CONTENT_NOT_FOUND')` when `!slide` |
| 3 | `artifact-store.ts:321` | `outline.slides[need.slideIndex]!` | Bind `const slide = outline.slides[need.slideIndex]`. Throw `DeckError('DECK_CONTENT_NOT_FOUND')` when `!slide` |
| 4 | `artifact-store.ts:342` | `outline.slides[need.slideIndex]!` | Bind `const slide = outline.slides[need.slideIndex]`. Throw `DeckError('RESEARCH_IMAGE_SELECTION_REQUIRED')` when `!slide` |
| 5 | `artifact-store.ts:674` | `cache!.clear()` | Bind a non-nullable local `const grantCache = cache` on initialization before registering the `abort` listener |
| 6 | `artifact-store.ts:692` | `cache!.delete(key)` | Capture the same non-nullable `grantCache` local inside `.catch(...)` |
| 7-20 | `design/src/index.ts:345,352(x3),354,361(x2),364,381,382,383(x2),384,392` | `c.title!`, `c.minBullets!`, `c.maxBullets!`, `c.bullet!`, `c.subtitle!`, `c.lead!`, `c.text!`, `c.lead!`, `c.minMetrics!`, `c.maxMetrics!`, `c.value!`, `c.label!`, `c.note!`, `c.caption!` (14 expressions) | Replace `Layout.capacity: Readonly<Record<string, number>>` in `design/src/contracts.ts:31` with per-layout typed capacity shapes (discriminated union on `Layout['id']`) or a guarded `capacityLimit(c, key)` helper throwing `DesignError('DESIGN_TEMPLATE_NOT_FOUND')` |

## Deep-module diagnosis

### 1. Interface width

`ArtifactStorage` exposes **25** public methods (36 total methods plus 1 constructor) on an internal class consumed solely by `DeckService` (`packages/presentation/deck/src/index.ts`). Because `DeckService` forwards almost every method 1-to-1, callers of `@deckagent/deck` must learn six staging and image concepts. Those concepts cover image preparation tokens (`prepareImages`/`commitImages`), outline image review/blockers, stage chunking, asset attachment, render verification, and manifest readback/recovery. Meanwhile, `packages/presentation/design/` exports **20** root symbols (`11` types/error from `contracts.ts` and `9` functions from `index.ts`) across **22** workspace importers (`12` production files and `10` test files).

Four exports in `@deckagent/design` have zero direct production `import` references (`DesignSystem`, `SlideContentPlan`, `Template`, `validateTheme`). `DesignSystem`, `Template`, and `SlideContentPlan` appear in return or parameter signatures of `listDesignSystems`, `listTemplates`, and `reviewLayouts`. `design-catalog.test.mjs:121` tests `validateTheme` directly. Across the `deck/` seam, `deck/src/contracts.ts:12` and `deck/src/index.ts:56,67-69` re-export `ContentBlock`, `DesignSnapshot`, `CatalogRef`, and `ThemeValues` as pass-throughs (Task 13 D2). `packages/host/contracts/src/deck.ts:4-40` duplicates `WebImageIntent`, `ContentBlock`, and `LayoutIssue` without a compile-time parity check.

### 2. Deletion test

- **`packages/presentation/deck/src/image-needs.ts` (38 lines, 1 export):** `outlineImageNeeds` computes deterministic `needId` hashes (`'web-images-v2'`) used by `artifact-store.ts` (`lines 176, 290, 340`), `apps/web/src/features/deck/deck-workflow.ts` (`lines 8, 235, 535`), and `apps/web/tests/image-research.test.mjs`. Deleting its external root export pushes SHA-256 `needId` computation into `apps/web/`, raising caller complexity. Instead, folding `image-needs.ts` into the extracted `PreparedImageStore` (`image-store.ts`) module removes a 38-line file. Keeping `outlineImageNeeds` exported from `@deckagent/deck` root preserves zero external caller impact.
- **Duplicate validation and hash helpers inside `artifact-store.ts` and `deck/src/index.ts`:** Authors wrote PNG header, SHA-256 hex digest, and `ImageCredit` checks inline three times across `prepareImages` (`208-224`), `asset` (`625-635`), `researchImage` (`705-720`), and `imageMetadata` (`750-761`). `deck/src/index.ts:265,849` repeats `createHash('sha256')`. Extracting internal helpers removes duplication without creating a cross-package `shared` module.
- **Direct SQL in `DeckService` (`deck/src/index.ts:213-232`) vs `ArtifactStorage`:** `reserveImageSearch` writes `image_search_attempts` directly inside `index.ts`, separating search budget state from `prepared_images` in `artifact-store.ts`. Moving `reserveImageSearch` into `PreparedImageStore` keeps all outline image persistence in one module.
- **Thin wrappers across `design/`:** None of `design/`'s 9 functions is a pass-through. `resolveDesign`, `decodeDesignSnapshot`, `validateContentPlan`, `findCompatibleLayouts`, `resolveLayout`, and `reviewLayouts` protect catalog invariants, snapshot integrity hashes, and layout capacity rules. Deleting `design/` exports other than pass-throughs in `deck/` forces callers to duplicate catalog validation.

### 3. Locality

- **Scenario A (new `ContentBlock` and layout rule).** Maintainers update **2** files in `packages/presentation/design/` (`src/contracts.ts:28-62` and `src/index.ts:62-113,239-333,335-398,409-485`). It also touches **1** file in `packages/presentation/deck/` (`src/artifact-store.ts:476-506` `documentFromPlan`) if the variant transforms before becoming a `SlideNode`. Across package seams, `packages/presentation/document/src/{contracts,index}.ts` and `packages/presentation/html/src/controlled-template.ts` change too. `packages/host/contracts/src/{deck,outline-validation}.ts` (`ContentBlock`, `decodeContentBlock`) also change together. `deck/src/bound-outline.ts:56-60` delegates to `validateContentPlan` and requires no change.
- **Scenario B (add one metadata field to prepared research images stored during outline preparation and consumed during slide staging).** This change touches **2** files in `packages/presentation/deck/`: `src/contracts.ts:153-238` (`PreparedResearchImage`, `OutlineImageReview`, `ArtifactAsset`) and **7 separate line ranges** inside `src/artifact-store.ts`. Those ranges cover `PreparedRecord` (`52-61`), `prepareImages` (`225-248`), `commitImages` (`261-270`), `imageReview` (`301-316`), `restoredImage` (`354-362`), `begin` (`436-445`), `researchImage` (`685-734`), and `imageMetadata`/`manifest` (`737-763,845-863`). It touches **0** files in `packages/presentation/design/` unless the metadata originates on a `web-image` outline block (`design/src/contracts.ts:55-62`, `design/src/index.ts:281-315`).
- **Co-change rationale (`deck/src/{index,contracts}.ts` <-> `design/src/{index,contracts}.ts`, 3-4 commits):** Git commits `5cace4f`, `f603176`, `cfa65fb`, and `a52f9fd` co-changed `deck` and `design` across feature increments. Those increments added the versioned design catalog, `web-image` and `WebImageIntent` blocks, and `reviewLayouts` and `LayoutIssue`. The co-changes reflect feature-level schema additions across the outline-to-design contract, not circular dependencies (`design/` depends on zero packages).

### 4. Action classification, convention fit, and Slice 2B vs Phase 3 recommendation

Dependency categories follow [Deepening](../../../../../.agents/skills/codebase-design/DEEPENING.md) [[3]](#ref-3). Cross-package ownership rules in [Project Structure](../../../../conventions/project-structure.md#packages) (`### packages/`, lines 97-99, 111) and `### Package và feature` (lines 137-138) fit the `deck/ -> design/` and `document/ -> design/` edges cleanly. `design/` has zero workspace dependencies and owns catalog, theme, and layout compatibility contracts. Moving `ContentBlock` or `WebImageIntent` into `deck/` inverts dependencies and breaks `document/` and `html/`. Conversely, `packages/host/contracts/src/deck.ts` duplicates `ContentBlock`, `WebImageIntent`, and `LayoutIssue` because `host/contracts/` cannot import `@deckagent/design` or `@deckagent/deck` at runtime without pulling catalog logic into the browser bundle (matching Task 13 D8).

**Recommendation for `packages/presentation/design/`:** **Defer `packages/presentation/design/` code changes (D12, D13) to Phase 3 (Tier 2 hygiene).** Keep **Slice 2B (Revision 3b)** focused on `packages/presentation/deck/` (including `artifact-store.ts` and `image-needs.ts`) plus the compile-time parity check in `packages/host/api/src/contract-sync.ts` (D14, extending Task 13 D8). In Phase 1, the owner approved `design/` as Tier 2 (`574` lines, zero dependency boundary violations, 22 importers across 5 packages/apps), and `deck/` already consumes `design/` cleanly through package `exports`.

## Classified findings table

IDs continue from Task 13 (`D1`-`D9`) so Revision 3b tracks one non-overlapping finding list.

| ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact |
| --- | --- | --- | --- | --- | --- |
| D10 | `packages/presentation/deck/src/artifact-store.ts:1-985`, `image-needs.ts:1-38`, `index.ts:213-232` | `artifact-store.ts` is 985 lines (>400) with 36 methods across two owners and 2 methods >80 lines (`prepareImages` 87, `researchImage` 85). PNG/credit validation repeats (`208-224`, `625-635`, `705-720`, `750-761`), and `image-needs.ts` is 38 lines | Local-substitutable (`DatabaseSync`, `artifactRoot` fs) + True external (`researchImage`, `preparedImage`, `renderCheck`) | `focused refactor (split responsibility or narrow export surface)` + `focused refactor (merge or delete)`: extract internal `PreparedImageStore` (`image-store.ts`) owning `prepared_images`, `image_search_attempts` (`reserveImageSearch`), and `outlineImageNeeds` (removing `image-needs.ts`). Split slide staging and disk readback/recovery under 400 lines with shared PNG/credit helpers | Zero external caller impact (`DeckStore` preserves `outlineImageNeeds` root export and all active method signatures) |
| D11 | `packages/presentation/deck/src/artifact-store.ts:188,203,282,291,321,342,582,587,590,674,692,741,875,934,943,959` | 2 non-`as const` type assertions (`282`, `590`), 6 `!` expressions (`203`, `291`, `321`, `342`, `674`, `692`), and unguarded `JSON.parse` calls on SQLite rows | Local-substitutable (`DatabaseSync`) + True external (`options.researchImage`) | `focused refactor (replace assertion with boundary guard)`: add `parsePreparedRecord` and manifest JSON guards throwing `DeckError('ARTIFACT_CORRUPT')`, rewrite `notes()` with positive narrowing, and replace all 6 `!` expressions with explicit guards/locals | Zero impact on valid inputs. Corrupt SQLite JSON maps to `ARTIFACT_CORRUPT` instead of `DECK_STORAGE` |
| D12 | `packages/presentation/design/src/index.ts:1-485` | `index.ts` is 485 lines (>400) and `validateContentPlan` is 95 lines (>80, with an 82-line `.map` callback at `250`). Four exports have 0 direct prod imports (`DesignSystem`, `SlideContentPlan`, `Template`, `validateTheme`) | In-process | `focused refactor (split responsibility or narrow export surface)` **(defer to Phase 3 Tier 2)**: split `design/src/index.ts` into internal catalog, theme, content-plan, and layout modules under 400 lines and 80 lines per function. Keep signature types exported | Zero impact in Slice 2B (deferred to Phase 3). Zero external caller impact across 22 importers in Phase 3 |
| D13 | `packages/presentation/design/src/index.ts:148,313,345,352,354,361,364,381-384,392`, `contracts.ts:28-32` | 3 type assertions (`148`, `313` x2) and 14 `!` assertions inside `findCompatibleLayouts` caused by `Layout.capacity: Readonly<Record<string, number>>` | In-process | `focused refactor (replace assertion with boundary guard)` **(defer to Phase 3 Tier 2)**: add `THEME_KEYS` tuple, `decodeWebImageIntent` constructor, and per-layout typed `capacity` or guarded `capacityLimit` helper | Zero impact in Slice 2B (deferred to Phase 3). Check `Layout.capacity` readers in `apps/web/` and `html/` tests in Phase 3 |
| D14 | `packages/host/contracts/src/{deck,outline-validation}.ts` vs `packages/presentation/design/src/{contracts,index}.ts` | `host/contracts` duplicates `WebImageIntent`, `ContentBlock`, `LayoutIssue`, and `decodeContentBlock` without a compile-time parity check | In-process | `convention update` (`docs/conventions/project-structure.md` `### packages/` line 111, bundled with Task 13 D8) + `focused refactor (replace assertion with boundary guard)`: add `AssertEqual` checks for `WebImageIntent`, `ContentBlock`, and `LayoutIssue` in `packages/host/api/src/contract-sync.ts` | Zero runtime caller impact. `tsc -b` catches contract drift |
| D15 | `packages/presentation/design/src/contracts.ts:1-89`, `packages/presentation/design/package.json` | Zero-dependency design contract package imported by 22 files across `deck`, `document`, `html`, `pptx`, and `apps/web` | In-process | `no action`: keep `ContentBlock`, `WebImageIntent`, `DesignSnapshot`, and catalog validation in `@deckagent/design` rather than moving them to `deck/` or `document/` | None. Preserves clean `document -> design` and `deck -> design` dependency direction |

## Items sent to the report

- **`ContentBlock['web-image']` planning fields (`provider`, `replace`, `intent`) in `design/src/contracts.ts:55-62`:** `findCompatibleLayouts` (`design/src/index.ts:346,350`) collapses `'web-image'` to `'image'`, while `provider`, `replace`, and `intent` serve only outline image research (`deck/src/image-needs.ts`). Recorded without action. Separating them splits `BoundOutlineDraft` slide blocks across two packages.
- **`ArtifactStorage.prepare` (`artifact-store.ts:765-844`):** Exactly 80 lines (right at the `>80` threshold). Split into pre-build checks, adapter execution and render check, and manifest emission during D10 so it stays below 80 lines.
- **Duplicated `digest` and primitive predicates (`isRecord`/`only`/`text`):** `artifact-store.ts:63`, `deck/src/index.ts:265,849`, `image-needs.ts:31`, and `design/src/index.ts:185,229` duplicate SHA-256 hashing and plain-object guards. Deduplicate `digest` internally inside `packages/presentation/deck/src/` during D10 without introducing a cross-package `shared` module.
- **Grant-keyed `WeakMap` state in `ArtifactStorage` (`lines 96,99,100`):** `stageAttempts`, `imageAttempts`, and `researchImages` rely on `GenerationGrant` object identity, matching `DeckService.grants`. Preserve this invariant when splitting `ArtifactStorage`.
- **Legacy `html` descriptor synthesis in `ArtifactStorage.native` (`lines 929-935`):** Synthesizes a fallback descriptor from `manifest.design.template` using unguarded `JSON.parse` when `manifest.artifact` is absent. Guard against malformed `manifest` JSON in D11 while keeping v1/v2 readback compatibility.

## What the commands do not prove

- Static AST scans and export regex counts do not run `tsc -b`, `artifact-publication.test.mjs`, `design-catalog.test.mjs`, or E2E suites, and do not prove behavioral parity after refactoring.
- Regex identifier counts match string literals in unrelated code (`ContentBlock` in `deck-workflow.ts:286`, `Layout` in `generation-workflow.ts:102`). We inspected direct `import` statements to determine actual consumers.
- Co-change counts cover the last 200 non-merge commits filtered by commits touching at most 20 production files rather than individual line-level diffs.

## References

1. <a id="ref-1"></a>[Task 14: Diagnose presentation/deck artifact storage and design contract seam](../plan/task-14-diagnose-deck-artifacts-and-design-seam.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
3. <a id="ref-3"></a>[Deepening](../../../../../.agents/skills/codebase-design/DEEPENING.md)
