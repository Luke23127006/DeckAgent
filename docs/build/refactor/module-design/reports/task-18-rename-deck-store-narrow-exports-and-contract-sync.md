# Task 18: Deck Store Rename, Export Narrowing and Contract Sync Report

Read this file to review the `DeckService` to `DeckStore` rename, the `deck-publication.ts` extraction, the 31-export barrel, the removed `./brief` subpath, and the 16 new `AssertEqual` contract checks [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `packages/presentation/deck/src/deck-publication.ts` (378 lines) — `PublicationHost`, `readSavedPublicationReceipt`, `validateArtifactPublicationInput`, `commitPreparedArtifact`, `publishArtifactFromStage`, `publishArtifact`, `validateLegacyPublication`, `publishLegacySlide`, `stagingMethods`, `assetMethods`, `publicationMethods`, `planningMethods`, `createGenerationCapability`. The four staging wrappers (`beginStage`, `appendStage`, `attachStageImage`, `publishArtifact`) and `publish` now live only here.
- `packages/presentation/deck/src/deck-store.ts` (322 lines) — `DeckStore` (`implements DeckReader`), `DeckHost`. It keeps the constructor, the delegation surface, and the private host factories.
- `packages/presentation/deck/src/deck-authoring.ts` (297 lines) — `AuthoringHost`, `DeckAuthoring` (`confirm`, `outlineSnapshot`, `briefSnapshot`, `briefVersion`, `saveBrief`, `proposeBoundOutline`, `prepareOutlineImages`, `reserveImageSearch`, `outlineImagePreview`, `restoredOutlineImage`, `imageBlockers`, `commitBriefProposal`, `beginOutline`, `proposeOutline`, `currentOutline`, `confirmOutline`, `cancelOutline`, `insertPlan`).
- `packages/presentation/deck/src/deck-generation.ts` (164 lines) — `GenerationHost`, `GenerationWorkflow` (`confirmGeneration`, `continueGeneration`, `admitGeneration`, `startGeneration`, `finishGeneration`, `reconcileGenerations`, `granted`). The `WeakSet` of live grants now lives here.
- `packages/presentation/deck/src/deck-reads.ts` (145 lines) — `ReadHost`, `DeckReads` (`generation`, `snapshot`, `provenance`, `slideMetadata`, `content`, `nativeArtifact`, `subscribe`).
- `packages/presentation/deck/src/deck-runtime.ts` (75 lines) — `DeckRuntime` (`id`, `access`, `asyncAccess`, `transaction`, `notify`, `close`). It owns the SQLite connection lifecycle and the error mapping.

The last four files are the owner-approved addition described in [Deviations](#deviations-from-the-task-text).

Modified:

- `packages/presentation/deck/src/index.ts` (1,013 → 24 lines) — a pure barrel that exports exactly 31 symbols.
- `packages/presentation/deck/src/deck-contracts.ts` — removed `DeckPublisher`.
- `packages/presentation/deck/src/artifact-stage.ts`, `artifact-store.ts`, `bound-outline.ts`, `brief-store.ts`, `generation-contracts.ts`, `outline-store.ts` — the header comments now name `DeckStore`.
- `packages/presentation/deck/package.json` — `exports` contains only `"."`.
- `scripts/build-workspace.mjs` — removed `'@deckagent/deck': ['lib/types/brief.js']` from `extraEntries`.
- `packages/host/api/src/contract-sync.ts` — 9 persistence pairs plus 16 deck and design pairs.
- `apps/web/src/index.ts`, `apps/web/src/features/chats/index.ts`, `apps/web/src/features/deck/brief-service.ts`, `confirmation-service.ts`, `deck-workflow.ts`, `generation-report.ts` — `DeckService` renamed to `DeckStore`.
- `apps/web/src/features/deck/generation-workflow.ts` — imports `DeckError` from `@deckagent/deck` and `FormatError`, `decodeSlideDocument` from `@deckagent/presentation-document`.
- `apps/web/src/features/deck/deck-workflow.ts` — imports `briefContractVersion` and `briefJsonSchema` from the `@deckagent/deck` root.
- `packages/presentation/deck/tests/deck-brief.test.mjs` — imports `briefJsonSchema` from the root, calls `validateBriefDraft` instead of `decodeBriefDraft`, and renamed `DeckService`.
- `packages/presentation/deck/tests/artifact-publication.test.mjs` — renamed `DeckService` and migrated the 32 staging call sites to the public capability ([Deviations](#deviations-from-the-task-text), item 3).
- 18 further test files — `DeckService` renamed to `DeckStore`: `packages/presentation/deck/tests/{bound-outline,deck-service,generation-confirmation,generation-continuation,outline-state}.test.mjs`, `apps/web/tests/{image-research,outline-client,research-image-generation}.test.mjs`, `e2e/{artifact-rendering,browser-smoke,confirmation-host,deck-pipeline,generation-bridge,generation-continuation-http,layout-review-browser,opencode-generation-live,portable-generation}.test.mjs`, `packages/presentation/html/tests/html-template-v3.test.mjs`.
- `tests/check-boundaries.test.mjs` — the deck fixture exports only `"."`, the two subpath fixtures use `@deckagent/host-contracts`, and `DeckService` renamed to `DeckStore`.
- `tests/oxlint-boundaries.test.mjs` — `DeckService` renamed to `DeckStore`.

## Module responsibilities

| Module | Owns |
| --- | --- |
| `deck-store.ts` | Deck lifecycle facade: constructor, cross-module delegation, connection ownership |
| `deck-authoring.ts` | Brief and Outline proposals, image preparation, Deck plan creation |
| `deck-generation.ts` | Confirmation, admission, continuation, completion, and the grant `WeakSet` |
| `deck-publication.ts` | Legacy `publish`, artifact publication, idempotency receipts, generation capability |
| `deck-reads.ts` | Deck snapshot, slide content, provenance, native artifact, subscriptions |
| `deck-runtime.ts` | SQLite connection lifecycle, error mapping, transactions, change notification |

`DeckStore` builds one immutable host object per concern and passes it to the module. The host object exposes `access`, `asyncAccess`, `transaction`, and `notify` as closures, so the modules never widen the public method surface of `DeckStore`.

## Metrics

`scripts/scan-module-design.mjs --json` and the AST sweep report these counts for `packages/presentation/deck/`:

| Metric | Before | After |
| --- | --- | --- |
| `files` | 18 | 24 |
| `lines` | 4,181 | 4,568 |
| `filesOver400` | 1 | 0 |
| `functionsOver80` | 4 | 0 |
| `smallNonBarrelFiles` | 0 | 0 |
| `typeAssertions` | 0 | 0 |
| `nonNullTotal` | 5 | 0 |
| `serviceSymbols` | 1 | 0 |
| `rootExports` | 66 | 31 |

`index.ts` falls from 1,013 to 24 lines and `deck-store.ts` is 322 lines, below the 360-line target. The five removed `!` assertions are the `generations.get(...)!` calls in `begin`, `snapshot`, `slideMetadata`, `content`, and the deck-version read at publication; each one now binds a local and spreads it conditionally or guards it with `DECK_NOT_CONFIRMED`. No file in the area exceeds 400 lines and no function exceeds 80 lines.

## Public surface

The 31 root exports of `packages/presentation/deck/src/index.ts`:

Values (12): `DeckStore`, `DeckError`, `ImagePreparationError`, `deckFailureMessage`, `briefContractVersion`, `briefJsonSchema`, `validateBriefDraft`, `interviewState`, `skipInterview`, `validateBoundOutline`, `validateConfirmation`, `outlineImageNeeds`.

Types (19): `BriefDraft`, `BriefSourceRef`, `InterviewState`, `BoundOutlineDraft`, `OutlineReader`, `ConfirmationReceipt`, `ContentProvenance`, `GenerationCapability`, `GenerationGrant`, `ImageAttempt`, `ImageCredit`, `ImageNeed`, `ImageSelection`, `ImageSourceCheck`, `OutlineImageReview`, `PreparedResearchImage`, `ConfirmedDeckPlan`, `DeckChange`, `DeckReader`.

Removed from the surface: `DeckPublisher`, the 11 `@deckagent/presentation-document` and `@deckagent/design` pass-throughs, and the nested `DeckSlide`, `DeckSnapshot`, `PublishedSlide`, `PublishSlide`, `SlideContent`, `ArtifactPublication`, `ArtifactAsset`, `OutlineDraft`, `OutlineProposal`, `OutlineSnapshot`, `OutlineTarget`, `BriefRecord`, `BriefSnapshot`, `BriefProposalInput`, `BoundOutlineInput`, `OutlineChanges`, `InterviewTopic`, `GenerationSnapshot`, `DeckOptions`, `ConfirmationTarget`, `StageChunk`, `StageStatus`, `ImageResolver`, and `validateOutlineDraft` re-exports. Callers that need a nested contract derive it from a reader type, as `contract-sync.ts` does.

`packages/presentation/deck/package.json` `exports` contains only `"."`, and `scripts/build-workspace.mjs` no longer bundles `lib/types/brief.js`.

## Contract parity

`packages/host/api/src/contract-sync.ts` now checks 25 pairs. The 9 `session-persistence` pairs are unchanged.

| Pair | `host/contracts` | `presentation/deck` |
| --- | --- | --- |
| 10 | `BriefDraft` | `BriefDraft` |
| 11 | `BriefRecord` | `NonNullable<OutlineReader['outlineSnapshot'](...)['proposals'][number]['brief']>` |
| 12 | `BriefSnapshot` | `ReturnType<DeckStore['briefSnapshot']>` |
| 13 | `BriefSourceRef` | `BriefSourceRef` |
| 14 | `ConfirmationReceipt` | `ConfirmationReceipt` |
| 15 | `ConfirmationTarget` | `Pick<ConfirmationReceipt, 'confirmationId' \| 'outlineId' \| 'outlineVersion' \| 'briefId' \| 'briefVersion'>` |
| 16 | `DeckChange` | `DeckChange` |
| 17 | `DeckSnapshot` | `ReturnType<DeckReader['snapshot']>` |
| 18 | `ImageCredit` | `ImageCredit` |
| 19 | `InterviewState` | `InterviewState` |
| 20 | `OutlineProposal` | `OutlineSnapshot['proposals'][number]` |
| 21 | `OutlineSnapshot` | `ReturnType<OutlineReader['outlineSnapshot']>` |
| 22 | `SlideContent` | `ReturnType<DeckReader['content']>` |
| 23 | `ContentBlock` | `OutlineProposal['slides'][number]['blocks'][number]` |
| 24 | `WebImageIntent` | `ContentBlock['intent']` for `kind: 'web-image'` |
| 25 | `LayoutIssue` | `OutlineProposal['layoutIssues'][number]` |

Every import in the file is `import type`, so `host/api` stays free of runtime `@deckagent/deck` imports. `tsc -b` fails at compile time when a duplicated DTO drifts.

## Behaviour preservation

- Every error code, message, and throw order is unchanged. `deck-publication.ts` shares one `readSavedPublicationReceipt` decoder for the artifact pre-check, the concurrent retry check, and the legacy `publish`; the legacy path passes `strictLegacyFields` so it still rejects a receipt whose `sessionId`, `deckId`, `slideId`, or `revision` disagrees.
- The four capability methods that were previously public on the class stay asynchronous: `validate`, `publish`, `image`, and `researchImage` return promises, so a grant check failure rejects instead of throwing synchronously. `test:generation-publication` caught the synchronous variant of `publish` and it is fixed.
- `snapshot`, `content`, `slideMetadata`, and `nativeArtifact` keep their SQL statements, their `DECK_CONTENT_NOT_FOUND` and `DECK_CORRUPT` codes, and their `BEGIN`/`COMMIT`/`ROLLBACK` read transaction.
- `DeckStore.confirm`, the legacy outline methods, and `insertPlan` keep their validation and their `DECK_INVALID_PLAN` and `DECK_PLAN_CONFLICT` codes.
- `close()` keeps the `closed` guard, closes the database once, and clears the listener map.
- No database schema, wire payload, or product behaviour changed.

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | oxlint reported no diagnostics |
| `npx biome format --write packages/presentation/deck/src/ packages/host/api/src/contract-sync.ts scripts/build-workspace.mjs` | `0` | `No fixes applied` on the final run |
| Step 6 AST sweep | `0` | `filesOver400: 0`, `functionsOver80: 0`, `smallNonBarrelFiles: 0`, `typeAssertions: 0`, `serviceSymbols: 0`, `nonNullTotal: 0`, `rootExports: 31`, `leftovers: []` |
| `node --test tests/check-boundaries.test.mjs tests/check-docs.test.mjs tests/oxlint-boundaries.test.mjs tests/post-edit-hook.test.mjs tests/scan-module-design.test.mjs` | `0` | `# tests 69`, `# pass 69`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:brief-foundation` | `0` | `# tests 15`, `# pass 15`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:outline-workflow` | `0` | `# tests 6`, `# pass 6`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:deck-review` | `0` | `# tests 21`, `# pass 21`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:slide-pipeline` | `0` | `# tests 7`, `# pass 7`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:generation-publication` | `0` | `# tests 71`, `# pass 71`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:images` | `0` | `# tests 39`, `# pass 39`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:layouts` | `0` | `# tests 10`, `# pass 10`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:browser-smoke` | `0` | `# tests 13`, `# pass 13`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `0 error(s)` |

The 8 suites total 182 tests with `# fail 0` and `# skipped 0`.

Two runs failed once and passed on every rerun: `test:brief-foundation` (`# fail 1`, unreproduced on 4 reruns) and `test:browser-smoke` (`not ok 7 - interactive composer: model choice, Send, live reply and Stop survive a reload`, `Live reply not shown`, unreproduced on rerun). Both tests are unrelated to the Deck store; the reads and the renames above do not touch the composer or the live-reply path. The final clean pass of all 8 suites above is the recorded result.

## Deviations from the task text

1. **Added `deck-authoring.ts` and `deck-generation.ts` (owner-approved).** The task bounds `deck-store.ts` at 360 lines. Moving only `deck-publication.ts` leaves about 650 lines in `deck-store.ts`, because the Brief, Outline, image, and generation-lifecycle methods stay behind. The owner approved the split into `deck-authoring.ts` and `deck-generation.ts`, and the same split moved the read path and the runtime into `deck-reads.ts` and `deck-runtime.ts` so `deck-store.ts` reaches 322 lines and no file in the area exceeds 400 lines. Every method name, signature, and error code is unchanged.
2. **The plan decision row names the extra modules.** The Task 18 row in `plan/README.md` now lists `deck-authoring.ts`, `deck-generation.ts`, `deck-reads.ts`, and `deck-runtime.ts` next to `deck-publication.ts`.
3. **The 32 staging call sites in `artifact-publication.test.mjs` use the capability (owner-approved).** Step 1 removes the public `beginStage`, `appendStage`, `attachStageImage`, and `publishArtifact` wrappers, and Step 5 authorizes only the `DeckService` rename in that file. The owner approved migrating the calls to `f.cap.begin`, `f.cap.append`, `f.cap.image`, and `f.cap.publish`, where `cap` is `decks.generationCapability(grant, signal)`. The fixture builds `cap` once. The one assertion that used a foreign grant object now asserts that `generationCapability({ ...grant }, signal)` throws `GENERATION_GRANT_INVALID`, which is where the check runs now.
4. **Six header comments name `DeckStore`.** `artifact-stage.ts`, `artifact-store.ts`, `bound-outline.ts`, `brief-store.ts`, `generation-contracts.ts`, and `outline-store.ts` referred to `DeckService` in one header comment each. Step 6 expects `leftovers: []`, so the comments follow the rename. No comment text or reason changed.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 18 Plan](../plan/task-18-rename-deck-store-narrow-exports-and-contract-sync.md)
