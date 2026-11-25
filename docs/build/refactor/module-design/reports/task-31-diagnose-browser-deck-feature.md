# Task 31: Browser Features Deck Diagnosis Report

Read this file to review the deep-module diagnosis of `apps/web/src/browser/features/deck/` and the classified finding table for owner approval [[1]](#ref-1) [[2]](#ref-2).

## Scope and commands run

Task 31 made no changes to production code, test files, `package.json`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md`.

| Step | Command | Exit code | Key output |
| --- | --- | --- | --- |
| 1 | `scripts/scan-module-design.mjs --json` + TypeScript AST non-null count | `0` | `fileCount: 8`, `totalLines: 1381`, `over400Count: 1`, `longFnTotal: 6`, `assertionTotal: 1`, `nonNullTotal: 4`, `serviceTotal: 0` |
| 2 | Export usage audit on `apps/web/src/browser/features/deck/index.ts` | `0` | `exportCount: 6`, `zeroProdUsage: ["DeckModel", "OutlineView", "OutlineAction"]`, `DeckModel` (`prod: 0`, `tests: 1`), `DeckWorkflowView` (`prod: 1`, `tests: 0`), `mountDeckCanvas` (`prod: 1`, `tests: 0`), `mountDeckTab` (`prod: 1`, `tests: 0`) |
| 2b | Exact `rg` call-site verification + TS AST export listing across `apps/web/src/browser/features/deck/` | `0` | Confirmed `OutlineView` and `OutlineAction` have `1` prod caller (`apps/web/src/browser/features/chats/conversation-view.ts:11-12` via `../deck/index.ts`); confirmed `11` unique exported symbols across the 7 implementation files |
| 4 | `git status --short` | `0` | Zero changes under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` |

## File metrics summary

| File | Lines | Barrel | Exports | Functions over 80 lines | `as` count | `!` count | Role |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/browser/features/deck/index.ts` | 6 | Yes | 6 | 0 | 0 | 0 | Public barrel for browser deck UI modules |
| `apps/web/src/browser/features/deck/brief-view.ts` | 95 | No | 3 | 0 | 0 | 0 | Shared Brief field labels, source references, and `briefDetails` DOM helpers |
| `apps/web/src/browser/features/deck/deck-canvas.ts` | 414 | No | 1 | 2 | 1 | 2 | Slide canvas stage, filmstrip preview queue, `DeckModel` sync, and fullscreen presentation controls |
| `apps/web/src/browser/features/deck/deck-model.ts` | 133 | No | 2 | 0 | 0 | 1 | Session-scoped slide state machine, `DeckClient` snapshot/content reads, and SSE wake-up loop |
| `apps/web/src/browser/features/deck/deck-resizer.ts` | 118 | No | 1 | 1 | 0 | 0 | Shared pointer-drag and keyboard width resizer for `deck-canvas.ts` and `deck-tab.ts` |
| `apps/web/src/browser/features/deck/deck-tab.ts` | 85 | No | 1 | 1 | 0 | 0 | Sample-only slide preview sidebar with `localStorage` layout persistence |
| `apps/web/src/browser/features/deck/deck-workflow-view.ts` | 228 | No | 1 | 0 | 0 | 0 | Interview mode/source/format/image controls and `DeckRequest` command builder |
| `apps/web/src/browser/features/deck/outline-view.ts` | 302 | No | 2 | 2 | 0 | 1 | Stable outline proposal cards, structured slide blocks, image-review preview/audit, and confirm/revise actions |

## Export audit

The Step 2 regex matched only `browser/features/deck/` and `features/deck/index`, so it missed the relative import `../deck/index.ts` in `apps/web/src/browser/features/chats/conversation-view.ts:11-12` and reported `OutlineView` and `OutlineAction` as `0`. The table below lists verified callers across `apps/web/src/`, `apps/web/tests/`, and `e2e/`.

### `apps/web/src/browser/features/deck/index.ts` (6 exports)

| Export | Kind | Source | Prod callers outside `features/deck/` | Test callers (`apps/web/tests`, `e2e`) | Audit note |
| --- | --- | --- | --- | --- | --- |
| `DeckModel` | class | `deck-model.ts:14` | 0 (`deck-canvas.ts:2` imports `./deck-model.ts`; `boot.ts:180` receives instance from `mountDeckCanvas`) | 1 (`apps/web/tests/deck-model.test.mjs:4`) | Test-only runtime export. Drop from `index.ts` (optionally keep `export type { DeckModel }` if needed) and migrate `deck-model.test.mjs` |
| `DeckWorkflowView` | class | `deck-workflow-view.ts:7` | 1 (`apps/web/src/browser/boot.ts:27,88`) | 0 | Keep |
| `mountDeckCanvas` | function | `deck-canvas.ts:17` | 1 (`apps/web/src/browser/boot.ts:27,180`) | 0 | Keep |
| `mountDeckTab` | function | `deck-tab.ts:5` | 1 (`apps/web/src/browser/boot.ts:27,177`) | 0 | Keep |
| `OutlineView` | class | `outline-view.ts:17` | 1 (`apps/web/src/browser/features/chats/conversation-view.ts:11,93,109,120,134,506`) | 0 | Keep |
| `OutlineAction` | type | `outline-view.ts:6` | 1 (`apps/web/src/browser/features/chats/conversation-view.ts:12,97`) | 0 | Keep |

Five additional exports exist only on internal sibling modules (`briefFieldLabel`, `sourceReferences`, and `briefDetails` in `brief-view.ts`; `DeckViewState` in `deck-model.ts`; `mountDeckResizer` in `deck-resizer.ts`). None are re-exported by `index.ts`.

## Type assertions and non-null assertions

The scope holds `1` non-`as const` type assertion and `4` non-null assertions. Four `as const` expressions in `deck-workflow-view.ts:49,166,167` and `outline-view.ts:243` comply with Coding Guidelines [[3]](#ref-3).

| # | Kind | Location | Expression | Proposed guard |
| --- | --- | --- | --- | --- |
| 1 | `as` | `deck-canvas.ts:154` | `entry.target as HTMLElement` | Check `if (!(entry.target instanceof HTMLElement)) continue` and bind `const item = entry.target` before `visible.add(item)` and `ensurePreview(item)` |
| 2 | `!` | `deck-canvas.ts:259` | `item.querySelector('.thumbnail-label')!` | Store `{ button, label, index, thumbnail }` references in `slideButtons: Map<string, SlideButtonRefs>` at creation (`245-256`) and update `refs.label.textContent` directly |
| 3 | `!` | `deck-canvas.ts:262` | `item.querySelector('.thumbnail-index')!` | Update `refs.index.textContent` from the same `SlideButtonRefs` entry in `slideButtons` |
| 4 | `!` | `deck-model.ts:70` | `this.control!.signal` | Bind `const sessionId = this.sessionId, signal = this.control?.signal` at the top of `select` and return early when `!sessionId || !signal || signal.aborted`, matching `refresh()` (`43-45`) |
| 5 | `!` | `outline-view.ts:123` | `this.imagePreview!(sessionId, proposal.outlineId, review.needId)` | Bind `const preview = this.imagePreview` inside the `if (review.status === 'prepared' && this.imagePreview && proposal.brief)` guard (`114`) or pass `preview` as a non-optional parameter to the extracted image-review helper |

## Long-function split map

Six functions across four files exceed 80 lines. Note that `deck-canvas.ts` contains header presentation/close controls (`Trình chiếu`, `Đóng`) and slide navigation (`Trước`, `Sau`, `Về đầu`, `Thoát`), with no file export actions.

### `apps/web/src/browser/features/deck/deck-canvas.ts` (414 lines)

`mountDeckCanvas` (`17-414`, `398` lines) and its nested `DeckModel` subscription callback (`175-305`, `131` lines) mix toolbar/navigation chrome, sandboxed stage/thumbnail iframe rendering, revision-keyed preview loading, `DeckModel` state reconciliation, and fullscreen/keyboard presentation handling.

| Target file | Extracted function or module | Owned responsibility and source ranges | Target budget (lines) |
| --- | --- | --- | --- |
| `apps/web/src/browser/features/deck/deck-preview-queue.ts` | `createPreviewQueue` + `SLIDE_CSP` (`12`) | Own `PREVIEW_CONCURRENCY` queue (`84-108`), `IntersectionObserver` with `instanceof HTMLElement` guard (`149-163`), `paintPreview` (`110-125`), `ensurePreview` (`126-148`), and `reset()` on session change (`196-200`) | 95–115 |
| `apps/web/src/browser/features/deck/deck-presentation.ts` | `attachPresentationControls` | Own `presenting()`, `wake()` idle timer (`9, 317-323`), `togglePresentation` (`324-330`), `fullscreenchange` (`331-338`), pointer wake (`339`), `keydown` shortcuts (`341-377`), and stage click navigation (`379-383`) | 85–100 |
| `apps/web/src/browser/features/deck/deck-canvas.ts` | `createCanvasDom`, `reconcileSlideButtons`, `applyDeckState`, `mountDeckCanvas` | Build toolbar/stage/controls DOM (`18-82, 385-396`), reconcile `SlideButtonRefs` without `!` (`237-271`), apply snapshot reset/status/progress/stage `srcdoc` revision switch (`175-236, 272-305`), and wire `DeckModel` + `mountDeckResizer` (`397-413`) | 200–230 |

### `apps/web/src/browser/features/deck/outline-view.ts` (302 lines)

`OutlineView.render` (`58-301`, `244` lines) and its nested slide-card callback (`70-193`, `124` lines) mix outline summary/diff rendering, slide block rendering, image-review preview/audit rendering, and confirmation/dock state updates.

| Target file | Extracted function or module | Owned responsibility and source ranges | Target budget (lines) |
| --- | --- | --- | --- |
| `apps/web/src/browser/features/deck/outline-image-review.ts` | `imageFailure` + `renderImageReviewFigure` + `renderImageAudit` | Absorb `imageFailure` moved from `transport/image-review-client.ts` (Task 30 `BB3`), lazy `imagePreview` toggle loader with captured `preview` binding (`114-136`), credit/license links (`150-163`), audit history (`164-178`), and `'Tìm ảnh khác'` trigger (`179-186`) | 105–125 |
| `apps/web/src/browser/features/deck/outline-view.ts` | `renderSlideBlocks`, `renderPlannedSlide`, `renderProposalChanges`, `buildProposalCard`, `updateCardState` | Separate slide block/source DOM (`70-110, 190-192`), proposal changes/brief details (`225-255`), card assembly (`60-69, 194-224, 256-259`), and blocker/status/dock/button updates (`260-300`), leaving `OutlineView.render` under 20 lines | 185–210 |

### `apps/web/src/browser/features/deck/deck-resizer.ts` (118 lines) and `deck-tab.ts` (85 lines)

| Target file | Extracted helper functions | Owned responsibility and source ranges | Target budget (lines) |
| --- | --- | --- | --- |
| `apps/web/src/browser/features/deck/deck-resizer.ts` | `computeBounds`, `createResizerState`, `attachPointerResize`, `attachKeyboardResize` | Separate viewport bounds (`14-23`), ARIA/width/finish state (`24-47`), overlay pointer capture (`48-89`), and keyboard step handling (`90-109`), leaving `mountDeckResizer` under 25 lines | 115–130 |
| `apps/web/src/browser/features/deck/deck-tab.ts` | `loadSampleLayout`, `saveSampleLayout` | Separate `localStorage` `'deckagent-sample-layout'` validation (`46-77`) from `mountDeckTab` (`5-45, 78-85`), bringing `mountDeckTab` to ~50 lines | 85–95 |

## Deep-module diagnosis

### 1. Interface width

- `apps/web/src/browser/features/deck/index.ts` exports **6** symbols: `DeckModel`, `DeckWorkflowView`, `mountDeckCanvas`, `mountDeckTab`, `OutlineView`, and `OutlineAction`. Across the 7 non-barrel implementation files, there are **11** distinct exported symbols (`briefFieldLabel`, `sourceReferences`, `briefDetails`, `mountDeckCanvas`, `DeckViewState`, `DeckModel`, `mountDeckResizer`, `mountDeckTab`, `DeckWorkflowView`, `OutlineAction`, `OutlineView`).
- To mount the deck UI, `boot.ts` must know **3** feature entrypoints (`mountDeckTab`, `mountDeckCanvas` plus the returned `DeckModel` instance methods `open`/`close`/`state`, and `DeckWorkflowView` methods `open`/`refresh`/`update`/`setResearchAvailable`/`requestRevision`/`command`/`preparingDeck`/`inputHint`). `boot.ts` never imports `OutlineView` or `OutlineAction`; `ConversationView` imports both from `../deck/index.ts` (`conversation-view.ts:11-12`).
- Only **`DeckModel`** is a true zero-external-production-usage / test-only barrel export (`0` prod callers outside `features/deck/`, `1` test caller in `apps/web/tests/deck-model.test.mjs:4`). `OutlineView` and `OutlineAction` each have `1` production caller in `conversation-view.ts`.

### 2. Deletion test

- **`OutlineView` and `OutlineAction` exports (`index.ts:5-6`):** Pass the deletion test. `conversation-view.ts:11-12` requires them across the `chats` to `deck` feature seam enforced by `check:boundaries` (`browser-feature-private-import`). Folding `OutlineView` (`302` lines) into `ConversationView` (`519` lines) would widen `ConversationView` and duplicate `brief-view.ts` helpers.
- **`DeckModel` barrel export (`index.ts:1`):** Fails the deletion test as a runtime barrel export. `deck-canvas.ts:2` imports `./deck-model.ts` directly, and `boot.ts:180` receives the `DeckModel` instance returned by `mountDeckCanvas` without importing the constructor. Only `apps/web/tests/deck-model.test.mjs:4` imports `DeckModel` from `index.js`.
- **Internal helpers (`brief-view.ts`, `deck-workflow-view.ts`, `outline-view.ts`):** Pass the deletion test. `DeckWorkflowView` and `OutlineView` do not call each other (`boot.ts` coordinates them via `update()` at `437` and `requestRevision()` at `112`). `brief-view.ts` (`95` lines) avoids duplicating Vietnamese field labels, `sourceReferences`, and `briefDetails` between `deck-workflow-view.ts:4` and `outline-view.ts:3`.
- **Cross-boundary `imageFailure` import (`outline-view.ts:4`):** Fails the deletion test inside `transport/`. `apps/web/src/browser/transport/image-review-client.ts` (`27` lines) performs zero HTTP calls and has only one caller (`outline-view.ts:4,142,168,173`). Moving `imageFailure` into `apps/web/src/browser/features/deck/` keeps UI copy with its sole consumer (matching Task 30 `BB3`).

### 3. Locality

- **Scenario A (add one new action button on each outline slide card and route it to `boot.ts`):**
  - **1 file** in `apps/web/src/browser/features/deck/` changes: `outline-view.ts` (`OutlineAction` or constructor callback at `6, 33-38`, slide button wiring inside `70-193`, and busy/status disabling in `setBusy` at `47-56` and `render` at `297-299`).
  - Outside `features/deck/`, `apps/web/src/browser/features/chats/conversation-view.ts` (`11-12, 95-110`) forwards the handler from `boot.ts` (`106-110`), where the action is executed.
- **Scenario B (add one new metadata badge in the slide canvas viewer read from the deck snapshot):**
  - **1 file** in `apps/web/src/browser/features/deck/` changes: `deck-canvas.ts` (DOM badge creation at `26-27` or `392`, empty-snapshot reset at `176-190`, and snapshot metadata update at `272-290`).
  - `deck-model.ts` (`4-9, 46-60`) already stores and emits the full `DeckSnapshot` unchanged, so `deck-model.ts` requires zero changes when reading an existing snapshot field.

### 4. Action classification and convention fit

Dependency categories follow Deepening [[4]](#ref-4):

- **In-process:** `brief-view.ts`, `deck-resizer.ts`, `deck-tab.ts`, `deck-canvas.ts` DOM/fullscreen/keyboard/preview-queue logic, `outline-view.ts` DOM/blob URL rendering, and `deck-workflow-view.ts` form/command logic.
- **Remote but owned:** `deck-model.ts` (uses `DeckClient`), `deck-canvas.ts` (`client.content` preview fetches), `deck-workflow-view.ts` (`BriefClient.interview`), and `outline-view.ts` (`imagePreview` callback wired to `HostClient.outlineImage`).

Convention fit against Project Structure [[5]](#ref-5) and Coding Guidelines [[6]](#ref-6):

- `docs/conventions/project-structure.md` (`### apps/web/` line 84) assigns `error hiển thị cho Browser` to `src/browser/transport/`, conflicting with `docs/conventions/code.md` (`### Biểu diễn` line 94). That wording placed `imageFailure` in `transport/image-review-client.ts` instead of `browser/features/deck/`; Task 30 `BB9` already proposes updating line 84.
- `docs/conventions/project-structure.md` (`### Package và feature` line 139) and `docs/conventions/testware.md` (line 10) align directly with removing the test-only `DeckModel` runtime export from `features/deck/index.ts`. No additional convention change is needed.

## Classified findings and owner decisions

| ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| BD1 | `apps/web/src/browser/features/deck/outline-view.ts:4,142,168,173` | Cross-boundary import of misplaced UI copy table `imageFailure` from `transport/image-review-client.ts:1-27` | In-process | `focused refactor (merge or remove)`: move `imageFailure` into `apps/web/src/browser/features/deck/outline-image-review.ts` and drop `transport/image-review-client.ts` (paired with Task 30 `BB3`) | Update 1 import in `outline-view.ts:4` | Approved for Revision 5b |
| BD2 | `apps/web/src/browser/features/deck/deck-canvas.ts:1-414` | File over 400 lines (`414`) and 2 functions over 80 lines (`mountDeckCanvas` `17-414`, callback `175-305`) | In-process + Remote but owned | `focused refactor (split responsibility or narrow export surface)`: extract internal `deck-preview-queue.ts` and `deck-presentation.ts`, plus `createCanvasDom`, `reconcileSlideButtons`, and `applyDeckState` inside `deck-canvas.ts` | Zero external caller impact (`mountDeckCanvas` signature unchanged) | Approved for Revision 5b |
| BD3 | `apps/web/src/browser/features/deck/outline-view.ts:58-301` | Two functions over 80 lines (`OutlineView.render` `58-301`, slide map callback `70-193`) | In-process + Remote but owned | `focused refactor (split responsibility or narrow export surface)`: extract internal `outline-image-review.ts` (including `imageFailure` from `BD1`) and file-local helpers (`renderSlideBlocks`, `renderPlannedSlide`, `renderProposalChanges`, `buildProposalCard`, `updateCardState`) | Zero external caller impact (`OutlineView` and `OutlineAction` unchanged) | Approved for Revision 5b |
| BD4 | `apps/web/src/browser/features/deck/deck-resizer.ts:4-118`, `deck-tab.ts:5-85` | Two functions over 80 lines (`mountDeckResizer` `4-118` at 115 lines; `mountDeckTab` `5-85` at 81 lines) | In-process | `focused refactor (split responsibility or narrow export surface)`: extract `computeBounds`, `createResizerState`, `attachPointerResize`, and `attachKeyboardResize` inside `deck-resizer.ts`, and `loadSampleLayout` + `saveSampleLayout` inside `deck-tab.ts` | Zero caller impact | Approved for Revision 5b |
| BD5 | `apps/web/src/browser/features/deck/index.ts:1` | Test-only barrel export (`DeckModel` has `0` external prod callers and `1` test caller at `apps/web/tests/deck-model.test.mjs:4`) | Remote but owned | `focused refactor (split responsibility or narrow export surface)`: drop `DeckModel` runtime export from `index.ts:1` (keep `export type { DeckModel }` if declaration emit requires it) | Update `apps/web/tests/deck-model.test.mjs:4` or defer test migration to Phase 4 (`Testware alignment`) | Approved for Revision 5b |
| BD6 | `deck-canvas.ts:154,259,262`, `deck-model.ts:70`, `outline-view.ts:123` | 1 non-`as const` type assertion and 4 non-null assertions (`!`) forbidden by `docs/conventions/code.md` line 22 | In-process + Remote but owned | `focused refactor (add boundary guard)`: use `entry.target instanceof HTMLElement`, `SlideButtonRefs` map in `slideButtons`, `const signal = this.control?.signal` guard in `select`, and local `const preview = this.imagePreview` binding | Zero caller impact | Approved for Revision 5b |
| BD7 | `docs/conventions/project-structure.md` (`### apps/web/` line 84) | `src/browser/transport/` wording (`error hiển thị cho Browser`) conflicts with `code.md` line 94 and caused `BD1` | In-process | `convention update`: clarify `transport/` maps HTTP/SSE errors to typed client codes while UI copy lives in `browser/` or `browser/features/` (already tracked under Task 30 `BB9`) | Aligns `project-structure.md` with `code.md` line 94 | Approved for Revision 5b |
| BD8 | `brief-view.ts:1-95`, `deck-workflow-view.ts:1-228`, `deck-resizer.ts`, `index.ts:2-6` | Shared internal UI helpers (`brief-view.ts`, `deck-resizer.ts`), clean feature view (`deck-workflow-view.ts`), and 5 active barrel exports | In-process + Remote but owned | `no action`: moving or inlining them duplicates Vietnamese labels, resizer logic, or bloats `boot.ts` and `conversation-view.ts` | None | Approved |

## Items sent to the report

- **Test-only `DeckModel` export (`BD5`) timing:** Dropping `DeckModel` from `features/deck/index.ts:1` leaves `apps/web/tests/deck-model.test.mjs:4` as the sole external consumer. Owner must choose between updating `deck-model.test.mjs:4` to import `../lib/browser-types/features/deck/deck-model.js` in Revision 5b or keeping `DeckModel` on `index.ts` until Phase 4 (`Testware alignment`, alongside `IN5`).
- **Coordinating `BD1` with Task 30 `BB3`:** Merging `imageFailure` into `outline-image-review.ts` (rather than a standalone `image-failure.ts`) prevents introducing a new 27-line non-barrel file under `features/deck/`.
- **`as const` assertions retained:** `deck-workflow-view.ts` (`lines 49, 166, 167`) and `outline-view.ts` (`line 243`) contain four `as const` literals allowed by Coding Guidelines [[6]](#ref-6).
- **Canvas action inventory note:** `deck-canvas.ts` exposes presentation/close header actions and slide navigation (`Trước`, `Sau`, `Về đầu`, `Thoát`), with no file export actions.

## What the commands do not prove

- Static inspection and symbol counts do not run `apps/web/tests/deck-model.test.mjs`, `apps/web/tests/layout-review.test.mjs`, `e2e/layout-review-browser.test.mjs`, or `e2e/browser-smoke.test.mjs`. They do not prove behavioral parity after a refactor.
- Regex usage counts in Step 2 missed relative imports (`../deck/index.ts` in `conversation-view.ts`). Run `tsc -b` and `check:boundaries` in Revision 5b before removing any export.

## References

1. <a id="ref-1"></a>[Task 31: Diagnose browser/features/deck UI modules](../plan/task-31-diagnose-browser-deck-feature.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../../../conventions/code.md)
4. <a id="ref-4"></a>[Deepening](../../../../../.agents/skills/codebase-design/DEEPENING.md)
5. <a id="ref-5"></a>[Project Structure](../../../../conventions/project-structure.md)
6. <a id="ref-6"></a>[Testware](../../../../conventions/testware.md)
