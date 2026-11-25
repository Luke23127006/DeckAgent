# Task 16: Deck Contracts Split and Core Store Refactor Report

Read this file to review the Slice 2B contract split and core store refactor applied to `packages/presentation/deck/src/`, with the verification commands and metrics [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `packages/presentation/deck/src/errors.ts` (72 lines) — `DeckError`, `ImagePreparationError`, `failureMessages`, `deckFailureMessage`, `validId`, `isRecord`, `sha256Hex`.
- `packages/presentation/deck/src/brief-contracts.ts` (72 lines) — `BriefSourceRef`, `InterviewTopic`, `BriefDraft`, `BriefRecord`, `InterviewState`, `BriefSnapshot`, `BriefProposalInput`.
- `packages/presentation/deck/src/outline-contracts.ts` (80 lines) — `OutlineDraft`, `OutlineTarget`, `OutlineChanges`, `OutlineProposal`, `BoundOutlineDraft`, `BoundOutlineInput`, `OutlineSnapshot`, `OutlineReader`.
- `packages/presentation/deck/src/generation-contracts.ts` (167 lines) — the 20 confirmation, generation, image, stage, and artifact types.
- `packages/presentation/deck/src/deck-contracts.ts` (70 lines) — `ConfirmedDeckPlan`, `DeckSlide`, `DeckSnapshot`, `DeckChange`, `PublishSlide`, `PublishedSlide`, `SlideContent`, `DeckReader`, `DeckPublisher`.

Modified:

- `packages/presentation/deck/src/brief.ts`, `brief-store.ts`, `bound-outline.ts`, `outline-store.ts`, `generation-store.ts`, `interview.ts`, `schema.ts`, `index.ts`, `artifact-store.ts`, `image-needs.ts`, `provenance.ts`.

Removed:

- `packages/presentation/deck/src/contracts.ts` (446 lines) — replaced by the five files above.

## Core-file metrics

The Step 7 quantitative check skips `index.ts`, `artifact-store.ts`, `image-needs.ts`, and `provenance.ts` because Task 17 and Task 18 own them.

| File | Lines | Functions over 80 | Type assertions | `!` |
| --- | --- | --- | --- | --- |
| `bound-outline.ts` | 240 | 0 | 0 | 0 |
| `brief-contracts.ts` | 72 | 0 | 0 | 0 |
| `brief-store.ts` | 132 | 0 | 0 | 0 |
| `brief.ts` | 239 | 0 | 0 | 0 |
| `deck-contracts.ts` | 70 | 0 | 0 | 0 |
| `errors.ts` | 72 | 0 | 0 | 0 |
| `generation-contracts.ts` | 167 | 0 | 0 | 0 |
| `generation-store.ts` | 246 | 0 | 0 | 0 |
| `interview.ts` | 123 | 0 | 0 | 0 |
| `outline-contracts.ts` | 80 | 0 | 0 | 0 |
| `outline-store.ts` | 214 | 0 | 0 | 0 |
| `schema.ts` | 113 | 0 | 0 | 0 |

Every listed file is under 400 lines, so no file in this group is over the file-size threshold.

## Function splits

| File | Before | After |
| --- | --- | --- |
| `brief.ts` | `decodeBriefDraft` (111) | `decodeBriefDraft` (45), `collectCrossFieldIssues` (40), `normalizeBriefDraft` (29) |
| `bound-outline.ts` | `saveBoundOutline` (88) | `saveBoundOutline` (44), `assertBoundOutlinePreconditions` (34), `resolveBoundSlides` (28), `validateBoundOutline` (71), `outlineChanges` (35) |
| `outline-store.ts` | `OutlineStorage.snapshot` (95) | `snapshot` (20), `decodeBoundProposalRow` (59), `decodeLegacyProposalRow` (17) |
| `schema.ts` | `initialize` (98) | `initialize` (39), `applyMigrations` (51), `verifySchema` (18) |

## Behaviour preservation

- The `index.ts` root export names are unchanged. The named re-export set is 65 symbols before and after the change, and the difference is empty in both directions.
- `generation-store.ts` owns the `generation_intents` writes. `DeckService.continueGeneration`, `admitGeneration`, `startGeneration`, `finishGeneration`, and `reconcileGenerations` delegate to `GenerationStorage` and keep their `notify(sessionId, version)` calls; `finishGeneration` notifies `version ?? deckVersion(this.db, sessionId)`.
- `OutlineStorage` receives `BriefStorage` through its constructor, so `snapshot` no longer constructs a store inside `.map`.
- Every error code, validation path, and error message is unchanged.
- `bound-outline.ts` adds `exceedsOutlineSize(value)` for the 128 KiB check, so `validateBoundOutline` is 71 lines instead of 75.
- The remaining non-null assertions in `packages/presentation/deck/src/` are 6 in `artifact-store.ts` and 5 in `index.ts`. This task removes 9 of the 20 that existed before it and leaves the rest to Task 17 and Task 18.

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed; `packages/presentation/deck/lib/index.js` and `lib/brief.js` rebuilt |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | oxlint `--format=json`: `diagnostics: 0`, `number_of_files: 260` |
| `npx biome format --write packages/presentation/deck/src/` | `0` | `Formatted 16 files`, 8 fixed on the first run; the final run reports `No fixes applied` |
| Step 7 quantitative check on the 12 core files | `0` | `files=12 violations=0`; every file has `over400: false`, `longFn: 0`, `as: 0`, `nn: 0` |
| `corepack pnpm@11.28.5 test:brief-foundation` | `0` | `# tests 15`, `# pass 15`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:outline-workflow` | `0` | `# tests 6`, `# pass 6`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:deck-review` | `0` | `# tests 21`, `# pass 21`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:slide-pipeline` | `0` | `# tests 7`, `# pass 7`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:generation-publication` | `0` | `# tests 69`, `# pass 69`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs: 114 file(s) checked, 0 error(s) in 0 file(s)` |

The five deck suites total 118 tests with `# fail 0` and `# skipped 0`.

## Notes

- The first `test:brief-foundation` run failed once in `apps/web/tests/brief-host.test.mjs` with `Timed out waiting` from the attachment-preparation poll. That file passed 3/3 alone and the suite passed 15/15 on the next run, both before and after the `bound-outline.ts` change last in this task. The code under `apps/web/` is outside this task's `Files`, and the failure is a timing flake in the shared attachment worker.
- oxlint writes its summary to a console handle that this shell does not capture. The verification table therefore records the counts from `oxlint --format=json` instead of the default reporter line.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 16 Plan](../plan/task-16-refactor-deck-contracts-and-core-stores.md)
