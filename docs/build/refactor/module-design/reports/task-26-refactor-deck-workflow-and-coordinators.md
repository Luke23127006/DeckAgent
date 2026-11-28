# Task 26: Deck Workflow, BriefCoordinator, and ConfirmationCoordinator Refactor Report

Read this file to review the split of `deck-workflow.ts`, the shared generation execution, the renamed coordinators, and the removal of all remaining `!` assertions in `apps/web/src/features/deck/` [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `apps/web/src/features/deck/generation-execution.ts` (54 lines) — `executeGenerationRun` runs one admitted generation and records its terminal intent state. `executeRecoveryRun` runs the single image recovery pass with only the image tools and a fresh tool context hash.
- `apps/web/src/features/deck/deck-prompts.ts` (385 lines) — `emptyBriefDraft`, `deckToolResult`, `decodeDeckToolArgs`, `buildDeckToolSchemas`, `buildDeckInstructions`, and `buildRecoveryInstructions`. It also owns the model-facing payload rules that the tool session calls: `assertBriefChoices`, `buildDeckWorkflowContext`, `isSourceToolAllowed`, `deckRepairLimitResult`, `decodeImageToolCall`, and `recordDeckToolFailure`.
- `apps/web/src/features/deck/deck-tool-session.ts` (358 lines) — `createDeckToolSession` returns `{ tools, state, runImageRecovery }`. `createDeckImageReview` opens the request-scoped image review and computes the staged Brief and resumed Outline. Private helpers run each tool, format failures through `recordDeckToolFailure`, and check `hasRecoverableImages`.
- `apps/web/src/features/deck/brief-coordinator.ts` (130 lines) — `BriefCoordinator` replaces `BriefService` and keeps the `BriefManagement` interface.
- `apps/web/src/features/deck/confirmation-coordinator.ts` (137 lines) — `ConfirmationCoordinator` replaces `ConfirmationService`. `confirm` keeps the per-Chat queue and delegates to `findExistingConfirmation`, `admitConfirmedGeneration`, and `rethrowConfirmationError`.

Removed:

- `apps/web/src/features/deck/brief-service.ts`
- `apps/web/src/features/deck/confirmation-service.ts`

Modified:

- `apps/web/src/features/deck/deck-workflow.ts` (812 → 252 lines) — keeps `prepare`, `prepareContinuation`, `prepareDeckCommand`, `start`, `settleOutcome`, and `commitProposal`. The `!` assertion on `request.deck` and the `!` assertion on `command.restoreOutlineId` are gone.
- `apps/web/src/features/deck/index.ts` — exports `BriefCoordinator` and `ConfirmationCoordinator` instead of the two `*Service` classes. The barrel keeps 7 exports.
- `apps/web/src/index.ts` — imports and constructs the renamed coordinators.
- `docs/build/refactor/module-design/plan/README.md` — Task 26 is `Done`.
- `docs/build/refactor/module-design/plan/task-26-refactor-deck-workflow-and-coordinators.md` — Steps 1 to 7 are marked `- [x]`.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 26 row.

## Module responsibilities

| Module | Owns |
| --- | --- |
| `deck-workflow.ts` | Request preparation for continuation and deck commands, the run decision order, and proposal commit |
| `deck-tool-session.ts` | Mutable staging state, model tool dispatch and allowlisting, image review setup, and the image recovery pass |
| `deck-prompts.ts` | Tool schemas, model instructions, workflow context, payload decoding, admitted-choice guards, and failure payloads |
| `generation-execution.ts` | The generation grant lifecycle shared by confirmation and continuation, and the recovery run |
| `brief-coordinator.ts` | Chat existence, source and attachment verification, Interview state, and Brief reads and writes |
| `confirmation-coordinator.ts` | Per-Chat confirmation serialization, idempotency, model selection freeze, and generation admission |

## Design notes and deviations from the plan text

- The plan put `openImageReview` and `buildWorkflowContext` in `deck-workflow.ts`. Both moved to `deck-tool-session.ts` and `deck-prompts.ts` so that `deck-workflow.ts` stays under 260 lines. The behaviour is the same: the image review opens before the model call and the workflow context is built from the same inputs.
- `deck-prompts.ts` exports 14 symbols instead of 6, and `generation-execution.ts` exports 2 instead of 1. The extra exports keep the 260-line and 360-line budgets for the other two files. They are internal to `features/deck/` and no other package imports them.
- `recordDeckToolFailure` keeps the original failure payloads: the same issue text, the same `repair` counts, and the same `imageToolError` codes.
- One behaviour detail is unchanged but now explicit. `ConfirmationCoordinator` reads `DeckStore.generation` in `findExistingConfirmation` and again in `admitConfirmedGeneration`. Both reads happen in the same queue turn, so the value cannot change between them.

## Behaviour preservation

- The generation lifecycle keeps the same order: `startGeneration`, `prepared.start` with the grant and capability, `finishGeneration` with `stopped` when the signal is aborted, `GENERATION_INCOMPLETE` when a completed run leaves the intent unfinished, and `GENERATION_FAILED` when the start throws.
- The tool allowlist, the repair limits, the activity events, the image budgets, and the recovery guard keep their previous conditions.
- The 17 instruction lines and the recovery instructions are byte-identical to the previous text.
- `verify` still throws `SOURCE_NOT_FOUND` for an unknown attachment or a missing source reference. It now binds `const source = item?.source` and returns the same error without a `!` assertion.
- No `DeckWorkflowFailure` code, HTTP status, or wire payload changed.

## Metrics

The Step 6 AST sweep reads `scripts/scan-module-design.mjs --json` and counts non-null expressions with the TypeScript API.

| File | Lines | Functions over 80 | `as` | `!` | `*Service` | Exports |
| --- | --- | --- | --- | --- | --- | --- |
| `brief-coordinator.ts` | 130 | 0 | 0 | 0 | 0 | 1 |
| `confirmation-coordinator.ts` | 137 | 0 | 0 | 0 | 0 | 1 |
| `deck-prompts.ts` | 385 | 0 | 0 | 0 | 0 | 14 |
| `deck-tool-session.ts` | 358 | 0 | 0 | 0 | 0 | 6 |
| `deck-workflow.ts` | 252 | 0 | 0 | 0 | 0 | 1 |
| `failures.ts` | 12 | 0 | 0 | 0 | 0 | 2 |
| `generation-execution.ts` | 54 | 0 | 0 | 0 | 0 | 2 |
| `generation-prompts.ts` | 127 | 0 | 0 | 0 | 0 | 6 |
| `generation-report.ts` | 58 | 0 | 0 | 0 | 0 | 1 |
| `generation-tools.ts` | 371 | 0 | 0 | 0 | 0 | 2 |
| `generation-workflow.ts` | 59 | 0 | 0 | 0 | 0 | 1 |
| `image-credit.ts` | 94 | 0 | 0 | 0 | 0 | 1 |
| `image-research.ts` | 179 | 0 | 0 | 0 | 0 | 1 |
| `image-review-run.ts` | 299 | 0 | 0 | 0 | 0 | 2 |
| `index.ts` | 7 | 0 | 0 | 0 | 0 | 7 |

`failures.ts` is the only non-barrel file under 30 lines. The longest functions are `commitProposal` (65 lines), `createDeckImageReview` (62), `assertBriefChoices` (53), `start` (48), and `admitConfirmedGeneration` (44).

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | no diagnostics |
| `npx biome format --write apps/web/src/features/deck/ apps/web/src/index.ts` | `0` | `No fixes applied` on the final run |
| Step 6 AST sweep on `apps/web/src/features/deck/` | `0` | `over400: false`, `longFn: 0`, `as: 0`, `nn: 0`, `services: 0` on every file; `index.ts` has `exports: 7` |
| `corepack pnpm@11.28.5 test:brief-foundation` | `0` | `# tests 15`, `# pass 15`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:outline-workflow` | `0` | `# tests 6`, `# pass 6`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:deck-review` | `0` | `# tests 21`, `# pass 21`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:slide-pipeline` | `0` | `# tests 7`, `# pass 7`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:generation-publication` | `0` | `# tests 72`, `# pass 72`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `0 error(s)` |

## What the commands do not prove

- No new test was added. The five suites exercise the existing seams and prove that the moved code keeps its current behaviour for the fixtures they contain.
- No suite forces a failure inside `executeGenerationRun` while a continuation runs, so the `GENERATION_FAILED` branch of the shared helper is covered only through the confirmation path.
- No suite checks the internal split of `deck-prompts.ts`. A future change to a tool schema description or a repair message needs its own assertion.
- The recovery run moved to `generation-execution.ts`. Its tool filter and context hash are covered by the image recovery fixtures only when recovery is reachable.
- `check:docs` verifies structure, purpose lines, and links only. It does not verify that the report numbers match a later rescan.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 26 Plan](../plan/task-26-refactor-deck-workflow-and-coordinators.md)
