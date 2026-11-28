# Task 35: Browser Deck Feature Refactor Report

Read this file to review the move of `imageFailure` into `features/deck/`, the deck module splits, the `DeckModel` type narrowing, and the verification output [[1]](#ref-1) [[2]](#ref-2).

## Files changed

Created:

- `apps/web/src/browser/features/deck/outline-image-review.ts` (150 lines) — file-local `imageFailure` copy table, `renderImageAudit`, `attachImagePreview`, and the exported `renderImageReviewFigure` that returns the figure and replace button.
- `apps/web/src/browser/features/deck/deck-preview-queue.ts` (144 lines) — `SLIDE_CSP` and `createPreviewQueue` with the three-request concurrency queue, revision-keyed cache, lazy preview painting, and `IntersectionObserver` registration.
- `apps/web/src/browser/features/deck/deck-presentation.ts` (92 lines) — `attachPresentationControls` with fullscreen toggle, idle wake timer, pointer wake listeners, keyboard shortcuts, and stage click navigation.

Removed:

- `apps/web/src/browser/transport/image-review-client.ts` (27 lines) — the Vietnamese `imageFailure` copy table moved to `outline-image-review.ts` and no longer belongs in `transport/`.

Modified:

- `apps/web/src/browser/transport/index.ts` (7 → 6 lines) — drops the `imageFailure` re-export and keeps the 9 approved symbols.
- `apps/web/src/browser/features/deck/deck-canvas.ts` (414 → 347 lines) — delegates preview loading and presentation to the new modules, builds the canvas through `createCanvasDom`, and stores `SlideButtonRefs` in the slide-button map.
- `apps/web/src/browser/features/deck/outline-view.ts` (302 → 307 lines) — delegates image-review rendering to `outline-image-review.ts` and splits proposal, slide, diff, and card updates into file-local helpers.
- `apps/web/src/browser/features/deck/deck-model.ts` (133 → 134 lines) — binds `sessionId` and `signal` in `select` and removes the non-null assertion on the abort signal.
- `apps/web/src/browser/features/deck/deck-resizer.ts` (118 → 153 lines) — splits bounds, state, pointer capture, and keyboard stepping into file-local helpers.
- `apps/web/src/browser/features/deck/deck-tab.ts` (85 → 96 lines) — moves sample-layout load and save into file-local helpers.
- `apps/web/src/browser/features/deck/index.ts` (6 lines) — exports `DeckModel` and `OutlineAction` as types only.
- `apps/web/tests/deck-model.test.mjs` — imports `DeckModel` from `../lib/browser-types/features/deck/deck-model.js`.
- `docs/build/refactor/module-design/plan/README.md` — Task 35 is `Done`.
- `docs/build/refactor/module-design/plan/task-35-refactor-browser-deck-feature.md` — Steps 1 to 7 are marked `- [x]`.
- `docs/build/refactor/module-design/reports/README.md` — adds the Task 35 row.

## Module responsibilities

| Module | Owns |
| --- | --- |
| `outline-image-review.ts` | Image-review copy, preview toggle loading, credit links, audit history, and the "Tìm ảnh khác" button |
| `deck-preview-queue.ts` | Sandbox CSP for published HTML, visible-slide preview requests, revision-keyed cache, and session reset |
| `deck-presentation.ts` | Fullscreen presentation state, idle chrome fading, keyboard navigation, and stage click navigation |
| `deck-canvas.ts` | Canvas DOM, slide button reconciliation, snapshot-driven status and stage rendering, and `DeckModel` wiring |
| `outline-view.ts` | Stable proposal cards, slide block rendering, proposal changes, and confirmation controls |
| `deck-resizer.ts` | Divider bounds, pointer and keyboard resizing, and width persistence hand-off |
| `deck-tab.ts` | Sample tab DOM and sample-layout persistence |

## Behaviour preservation

- Every Vietnamese UI string, DOM class name, ARIA attribute, `localStorage` key (`deckagent-canvas-width`, `deckagent-sample-layout`), and the `SLIDE_CSP` value moved without edits.
- `mountDeckCanvas(container, client, reveal)`, `mountDeckTab(container)`, `mountDeckResizer(container, initial, save)`, `OutlineView`, and `OutlineAction` keep their signatures.
- Preview requests still run at most three at a time, stay keyed by `sessionId/slideId/revision`, and reset on a session change.
- Presentation still uses the panel as the fullscreen element, fades chrome after 2500 ms, and keeps the keydown and stage-click rules.
- `DeckModel.select` keeps the same early return: no session, no signal, an aborted signal, or an unknown slide id leaves the model unchanged.

## Metrics

The AST sweep reads `scripts/scan-module-design.mjs --json` and counts non-null expressions with the TypeScript API.

| File | Lines | Over 400 | Functions over 80 | `as` | `!` | Exports |
| --- | --- | --- | --- | --- | --- | --- |
| `brief-view.ts` | 95 | false | 0 | 0 | 0 | 3 |
| `deck-canvas.ts` | 347 | false | 0 | 0 | 0 | 1 |
| `deck-model.ts` | 134 | false | 0 | 0 | 0 | 2 |
| `deck-presentation.ts` | 92 | false | 0 | 0 | 0 | 2 |
| `deck-preview-queue.ts` | 144 | false | 0 | 0 | 0 | 3 |
| `deck-resizer.ts` | 153 | false | 0 | 0 | 0 | 1 |
| `deck-tab.ts` | 96 | false | 0 | 0 | 0 | 1 |
| `deck-workflow-view.ts` | 228 | false | 0 | 0 | 0 | 1 |
| `features/deck/index.ts` | 6 | false | 0 | 0 | 0 | 6 |
| `outline-image-review.ts` | 150 | false | 0 | 0 | 0 | 3 |
| `outline-view.ts` | 307 | false | 0 | 0 | 0 | 2 |
| `transport/index.ts` | 6 | false | 0 | 0 | 0 | 9 |

Every function is under 65 lines, and every file is under 400 lines. `transport/image-review-client.ts` is absent. `brief-view.ts` and `deck-workflow-view.ts` keep their pre-task content.

Four files exceed the task line targets: `deck-canvas.ts` 347 against 250, `outline-view.ts` 307 against 230, `deck-preview-queue.ts` 144 against 125, and `outline-image-review.ts` 150 against 140. The original canvas and outline modules held 414 and 302 lines, and the task also requires every function under 65 lines. Splitting those functions adds signatures, parameter bundles, and return objects, so the two targets cannot both hold. The split keeps the function-size rule and the 400-line scanner threshold.

## Verification

| Command | Exit code | Result |
| --- | --- | --- |
| `corepack pnpm@11.28.5 build` | `0` | `tsc -b` and `node scripts/build-workspace.mjs` completed |
| `corepack pnpm@11.28.5 check:boundaries` | `0` | `check-boundaries: 0 violation(s)` |
| `corepack pnpm@11.28.5 lint` | `0` | no diagnostics |
| `npx biome format --write apps/web/src/browser/transport/index.ts apps/web/src/browser/features/deck/ apps/web/tests/deck-model.test.mjs` | `0` | `Formatted 13 files` |
| Step 5 AST sweep on `apps/web/src/browser/features/deck/` and `apps/web/src/browser/transport/` | `0` | `over400: false`, `longFn: 0`, `smallNonBarrel: false`, `as: 0`, `nn: 0` on every file; `transport/index.ts` has `exports: 9` |
| `corepack pnpm@11.28.5 test:slide-pipeline` | `0` | `# tests 7`, `# pass 7`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:deck-review` | `0` | `# tests 21`, `# pass 21`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:layouts` | `0` | `# tests 10`, `# pass 10`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 test:tools-browser` | `0` | `# tests 14`, `# pass 14`, `# fail 0`, `# skipped 0` |
| `corepack pnpm@11.28.5 check:docs` | `0` | `check-docs` reported `0 error(s)` |

## What the commands do not prove

- No new test was added. The four suites cover the deck model, deck client, outline client, and layout review; they do not render `createCanvasDom`, `reconcileSlideButtons`, `applyDeckState`, the presentation controls, or the preview queue, because those paths need a browser DOM and `IntersectionObserver`.
- `lint` and `check:boundaries` enforce static rules only. They do not prove that fullscreen entry, idle fading, keyboard navigation, or stage clicks behave as before at runtime.
- The AST sweep counts lines, function spans, type assertions, and non-null assertions. It does not prove that the UI strings, DOM class names, ARIA attributes, `localStorage` keys, or `SLIDE_CSP` value are unchanged; the diff of those moved blocks does.
- `check:docs` checks the document structure, the purpose line, relative links, and citations. It does not check that this report still matches a later rescan of the folder.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 35 Plan](../plan/task-35-refactor-browser-deck-feature.md)
