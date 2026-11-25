# Task 25: Deck Image Research and Generation Workflow Refactor Report

Read this file to review the split of `image-research.ts` and `generation-workflow.ts`, the narrowed `features/deck/` barrel, and the JSON-LD licence tests that now run through `WebImageResearch.prepare` [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `apps/web/src/features/deck/image-credit.ts` (94 lines) — `imagePageCredit`, `extractImageObjectCredit`, `licenseFromLink`, and `authorOf`. The JSON-LD scan keeps the 500-visit and 10-depth caps.
- `apps/web/src/features/deck/image-review-run.ts` (299 lines) — `Candidate`, `ImageReviewRun`, and its private `resolveRankedChoices`, `attemptChoice`, and `recordAttemptFailure`.
- `apps/web/src/features/deck/generation-prompts.ts` (127 lines) — `generationToolSchemas`, `GenerationContext`, `GenerationPlan`, `GenerationSource`, `buildGenerationContext`, and `buildGenerationInstructions`.
- `apps/web/src/features/deck/generation-tools.ts` (371 lines) — `createGenerationTools`, `GenerationToolOptions`, the source-kind and provenance-kind predicates, `createEvidenceLedger`, `parseProvenanceEntries`, `callAuthorizedSourceTool`, `dispatchStageTool`, and `dispatchPublishOrContentTool`.

Modified:

- `apps/web/src/features/deck/image-research.ts` (483 → 179 lines) — keeps `WebImageResearch` with `close`, `open`, `candidates`, and `prepare`. The prepared-image path splits into `prepareCommonsCandidate`, `resolveSourceCredit`, `readCachedPage`, and `downloadAndNormalize`. `resolveSourceCredit` returns `{ kind: 'credit' }` for page metadata and `{ kind: 'image' }` when a Wikimedia page entry is authoritative, so those entries are still not downloaded twice.
- `apps/web/src/features/deck/generation-workflow.ts` (384 → 59 lines) — keeps `GenerationWorkflow` with its `(runtime, sessions)` constructor and `prepare(request)` signature. `startRun` is the only start path.
- `apps/web/src/features/deck/index.ts` (8 → 7 lines) — drops `OutlineNotFoundReason` and `imagePageCredit`. The barrel keeps 7 exports.
- `apps/web/tests/image-research.test.mjs` — imports only `WebImageResearch` and checks every exact JSON-LD licence rule through `WebImageResearch.prepare` with a fake reader.
- `docs/build/refactor/module-design/plan/README.md` — Task 25 is `Done`.
- `docs/build/refactor/module-design/plan/task-25-refactor-deck-image-research-and-generation-workflow.md` — Steps 1 to 6 are marked `- [x]`.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 25 row.

## Module responsibilities

| Module | Owns |
| --- | --- |
| `image-credit.ts` | The JSON-LD scan and the rule that only matching `ImageObject` metadata establishes an accepted licence |
| `image-review-run.ts` | Request-scoped candidates, searches, ranked selections, attempt logs, and prepared-image retention |
| `image-research.ts` | Candidate identity, source resolution, page cache, download and normalization through the attachment parser |
| `generation-prompts.ts` | Tool schemas, the model context payload, and the system instructions |
| `generation-tools.ts` | Tool allowlisting, source-read authority, the evidence ledger, provenance validation, stage dispatch, and publish dispatch |
| `generation-workflow.ts` | Host confirmation and grant checks, plan and source selection, and wiring the prompt and tool modules to the runtime |

## Behaviour preservation

- The JSON-LD rules are unchanged: an exact `contentUrl` or `url` match, `ImageObject` type, `CC BY` 1.0 to 4.0, `CC0`, public-domain mark, an `@id` licence reference, a required author for `CC BY`, and the `RESEARCH_IMAGE_LICENSE_UNSUPPORTED` and `RESEARCH_IMAGE_AUTHOR_REQUIRED` rejections.
- Source resolution keeps the three-page cap, the 25-entry page cache, the 512 KiB page limit, the 8 MiB asset limit, the 20-second operation timeout, and the `RESEARCH_IMAGE_BUDGET`, `RESEARCH_IMAGE_TIMEOUT`, and `RESEARCH_IMAGE_SOURCE_UNRESOLVED` codes.
- Image review keeps two searches per need, four selection attempts, the stale, duplicate, and busy refusals, the retained prepared image after resume, and the same attempt log shape.
- Generation keeps the same tool allowlist, source-tool authority checks, evidence IDs, provenance validation, activity events, 60 KiB argument limit, and the requirement to call `record_slide_provenance` before `publish_slide`.
- One new guard: a confirmed generation request with no brief record now returns `BRIEF_NOT_FOUND` instead of failing on a missing property. No other error code, wire payload, or database schema changed.

## Metrics

The Step 5 AST sweep reads `scripts/scan-module-design.mjs --json` and counts non-null expressions with the TypeScript API.

| File | Lines | Functions over 80 | `as` | `!` | Exports |
| --- | --- | --- | --- | --- | --- |
| `image-research.ts` | 179 | 0 | 0 | 0 | 1 |
| `image-credit.ts` | 94 | 0 | 0 | 0 | 1 |
| `image-review-run.ts` | 299 | 0 | 0 | 0 | 2 |
| `generation-workflow.ts` | 59 | 0 | 0 | 0 | 1 |
| `generation-prompts.ts` | 127 | 0 | 0 | 0 | 6 |
| `generation-tools.ts` | 371 | 0 | 0 | 0 | 2 |
| `index.ts` | 7 | 0 | 0 | 0 | 7 |

The task limits hold. The longest functions are `dispatchPublishOrContentTool` (61 lines, limit 70), `createGenerationTools` (55, limit 65), `resolveSourceCredit` (51, limit 65), and `dispatchStageTool` (43, limit 70). Every other function in the new modules is under 65 lines.

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `node --test apps/web/tests/image-research.test.mjs` before the split | `0` | `# tests 20`, `# pass 20`, `# fail 0`; the rewritten test already passed at the `WebImageResearch.prepare` seam |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | no diagnostics |
| `npx biome format --write apps/web/src/features/deck/ apps/web/tests/image-research.test.mjs` | `0` | `Formatted 13 files`, `Fixed 3 files`; a later run on `image-research.ts` reported `No fixes applied` |
| Step 5 AST sweep on the seven files | `0` | `over400: false`, `longFn: 0`, `as: 0`, `nn: 0` on every file; `index.ts` has `exports: 7` |
| `corepack pnpm@11.28.5 test:images` | `0` | `# tests 39`, `# pass 39`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:generation-publication` | `0` | `# tests 72`, `# pass 72`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:slide-pipeline` | `0` | `# tests 7`, `# pass 7`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `0 error(s)` |

## What the commands do not prove

- The JSON-LD test covers the licence rules only. It does not reach the 500-visit or 10-depth traversal caps.
- No test forces the 20-second operation timeout, the 25-entry page cache budget, the three-page source cap, or the 8 MiB asset limit.
- The `BRIEF_NOT_FOUND` guard has no test: no fixture reaches a confirmed generation request without a brief record.
- The `RESEARCH_IMAGE_SELECTION_BUSY` refusal and the stale-selection race depend on existing coverage; the split did not add a dedicated test.
- The activity sequence for invalid JSON (a `failed` event without a preceding `running` event) is preserved in code but not asserted.
- `check:docs` verifies structure, purpose lines, and links only; it does not verify that the report numbers match a later rescan.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 25 Plan](../plan/task-25-refactor-deck-image-research-and-generation-workflow.md)
