# Task 17: Deck Artifact Storage Split and Image Store Extraction Report

Read this file to review the Slice 2B split of `artifact-store.ts` into staging, image, readback, and filesystem modules, with the corrupt-JSON guards and the verification commands [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `packages/presentation/deck/src/artifact-fs.ts` (297 lines) — `ArtifactFileStore`, `isManagedArtifactName`, `PNG_MAGIC`, `IMAGE_LICENSES`, `hashMismatch`, `isValidPngBytes`, `isValidImageCredit`, `validateProvenance`, `parseJsonObject`, `PreparedRecord`, `parsePreparedRecord`.
- `packages/presentation/deck/src/image-store.ts` (298 lines) — `outlineImageNeeds`, `PreparedImageStore` (`prepareImages`, `commitImages`, `reserveImageSearch`, `preparedRecord`, `imageReview`, `imagePreview`, `restoredImage`, `imageBlockers`).
- `packages/presentation/deck/src/artifact-readback.ts` (158 lines) — `ArtifactReadback` (`provenance`, `notes`, `imageMetadata`, `metadata`, `content`, `native`, `recover`).
- `packages/presentation/deck/src/artifact-stage.ts` (285 lines) — `Stage`, `ArtifactStaging` (`begin`, `setDocument`, `draft`, `append`, `setProvenance`, `published`, `discard`). This file is the owner-approved addition described in [Deviations](#deviations-from-the-task-text).

Modified:

- `packages/presentation/deck/src/artifact-store.ts` (985 → 362 lines) — `PreparedArtifact`, `ArtifactStorage` (`begin`, `setDocument`, `draft`, `append`, `setProvenance`, `asset`, `researchImage`, `prepare`, `receiptFingerprint`, `removeValidationArtifact`, `published`, `discard`).
- `packages/presentation/deck/src/index.ts` — builds `ArtifactFileStore`, `PreparedImageStore`, `ArtifactStaging`, `ArtifactReadback`, and `ArtifactStorage` in the constructor, delegates image and readback methods, and re-exports `outlineImageNeeds` from `./image-store.ts`.
- `packages/presentation/deck/tests/artifact-publication.test.mjs` — adds the two `ARTIFACT_CORRUPT` tests.

Removed:

- `packages/presentation/deck/src/provenance.ts` (11 lines) — `validateProvenance` moved to `artifact-fs.ts`.
- `packages/presentation/deck/src/image-needs.ts` (38 lines) — `outlineImageNeeds` moved to `image-store.ts`.

## Module responsibilities

| Module | Owns | Persistence |
| --- | --- | --- |
| `artifact-fs.ts` | Managed file names, PNG and image-credit guards, provenance validation, prepared-record decoding | `artifactRoot` files |
| `artifact-stage.ts` | Open slide stages, source chunks, stage documents, provenance, stage status | `.part` files in memory and on disk |
| `image-store.ts` | Outline image needs, prepared image records, search budget | `prepared_images`, `image_search_attempts` |
| `artifact-store.ts` | Stage images, artifact build verification, manifests, receipt fingerprints | Managed PNG and artifact files |
| `artifact-readback.ts` | Published metadata and bytes readback, managed-orphan recovery | `artifact_revisions`, managed files |

`DeckService` keeps the active-grant checks and the SQLite transactions. Each store takes `DatabaseSync`, `ArtifactFileStore`, or `FormatAdapter` only through its constructor.

## Fail-first proof

The two new tests read a deliberately corrupt `prepared_images` row and a corrupt `artifact_revisions` row. With the unguarded `JSON.parse` (the behaviour before this task), `DeckService.access` maps the `SyntaxError` to `DECK_STORAGE`:

```text
not ok 10 - corrupt prepared_images JSON fails with ARTIFACT_CORRUPT instead of DECK_STORAGE
    +   code: 'DECK_STORAGE'
not ok 11 - corrupt artifact_revisions manifest JSON fails with ARTIFACT_CORRUPT on notes and provenance readback
    +   code: 'DECK_STORAGE'
# tests 11
# pass 9
# fail 2
```

With `parseJsonObject` and `parsePreparedRecord` in place, both tests pass with `# pass 11`, `# fail 0`.

## Metrics

`scripts/scan-module-design.mjs --json` reports these counts for the five artifact modules:

| File | Lines | Functions over 80 | Type assertions | `!` |
| --- | --- | --- | --- | --- |
| `artifact-fs.ts` | 297 | 0 | 0 | 0 |
| `artifact-stage.ts` | 285 | 0 | 0 | 0 |
| `image-store.ts` | 298 | 0 | 0 | 0 |
| `artifact-store.ts` | 362 | 0 | 0 | 0 |
| `artifact-readback.ts` | 158 | 0 | 0 | 0 |

Every file is under 400 lines. `artifact-fs.ts` is 297 lines, above the 180-line target in the task: `parsePreparedRecord` validates each `ArtifactAsset`, `ImageSelection`, and `ImageAttempt` field so it can return a typed record without a type assertion.

## Behaviour preservation

- The `index.ts` root exports keep the same 65 names. `outlineImageNeeds` is re-exported from `./image-store.ts`, so `apps/web/src/features/deck/deck-workflow.ts` and `apps/web/tests/image-research.test.mjs` keep their import.
- The `FORMAT_DUPLICATE` check stays in the `DeckService` constructor. `ArtifactStorage` receives the finished map.
- The research-image cache stays keyed by `[slideId, query]` for one grant, keeps the abort listener, and keeps the removed `cache!` assertions. The search budget and the `RESEARCH_IMAGE_BUDGET` limit are unchanged.
- `imageReview`, `imagePreview`, and `restoredImage` throw `DECK_CONTENT_NOT_FOUND` or `RESEARCH_IMAGE_SELECTION_REQUIRED` when the outline has no slide at the recorded index instead of dereferencing it.
- Every existing error code and message is unchanged. Malformed SQLite JSON now throws `DeckError('ARTIFACT_CORRUPT')` instead of reaching the `DECK_STORAGE` fallback.
- `recover()` keeps the rule that a file whose name is not a managed artifact name is left untouched, and removes only managed files that no row references.

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed; `lib/index.js` rebuilt |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | oxlint exited with `0` diagnostics on 260 files |
| `npx biome format --write packages/presentation/deck/src/ packages/presentation/deck/tests/artifact-publication.test.mjs` | `0` | `No fixes applied` on the final run |
| Step 7 quantitative check | `0` | 5 files, `provenanceExists: false`, `imageNeedsExists: false`, every file `over400: false`, `longFn: 0`, `as: 0`, `nn: 0` |
| `node --test packages/presentation/deck/tests/artifact-publication.test.mjs` | `0` | `# tests 11`, `# pass 11`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:generation-publication` | `0` | `# tests 71`, `# pass 71`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:images` | `0` | `# tests 39`, `# pass 39`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:deck-review` | `0` | `# tests 21`, `# pass 21`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:slide-pipeline` | `0` | `# tests 7`, `# pass 7`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:outline-workflow` | `0` | `# tests 6`, `# pass 6`, `# fail 0`, `# skipped 0` |

The task's four suites total 142 tests with `# fail 0` and `# skipped 0`. `test:slide-pipeline` and `test:outline-workflow` cover the legacy `publish` readback and the outline snapshot that this task changes, so they ran as extra regression checks.

## Deviations from the task text

1. **Added `artifact-stage.ts`.** The task requires `ArtifactStorage` to keep 12 methods and to split `researchImage` and `prepare` into more methods, while `artifact-store.ts` must be under 390 lines. The remaining methods are 607 lines without the staging state. The owner approved moving the stage state machine and source operations into `artifact-stage.ts`; `ArtifactStorage` keeps the required method names and delegates the stage operations. As a result, `ArtifactStorage` no longer needs `PreparedImageStore` and takes `(files, staging, formats, options)`.
2. **First corrupt-JSON test reads through `restoredOutlineImage`.** The test fixture uses template version 1, and `imageReview` returns an empty list before it reads `prepared_images`. The test therefore calls `restoredOutlineImage` with the `needId` from `outlineImageNeeds`, which reads the corrupt row through `preparedRecord`. The test name and the `ARTIFACT_CORRUPT` assertion are unchanged.
3. **Test database handles go to `f.closeAfter`.** The fixture's `t.after` hook deletes the temporary directory before a later `t.after(() => db.close())` runs, and Windows refuses to delete an open SQLite file with `EBUSY`. The tests push the handle to `f.closeAfter`, which the fixture closes before it removes the directory.
4. **`isManagedArtifactName` is exported** from `artifact-fs.ts` so `ArtifactFileStore.path` and `ArtifactReadback.recover` share one managed-name pattern.
5. **`IMAGE_LICENSES` is typed `readonly string[]`** instead of `as const`, so `isValidImageCredit` keeps a `value is ImageCredit` predicate without a type assertion.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 17 Plan](../plan/task-17-refactor-deck-artifacts-and-image-store.md)
