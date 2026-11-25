# Task 35: Refactor `browser/features/deck` and move `imageFailure` from transport

Read this file to move `imageFailure` into `browser/features/deck/`, split long deck UI modules under 400 and 80 lines, narrow `DeckModel`, and remove assertions (`BB3`, `BD1` to `BD6`) [[1]](#ref-1).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/conventions/code.md`
- `apps/web/src/browser/transport/image-review-client.ts` (27 lines)
- `apps/web/src/browser/transport/index.ts` (7 lines)
- `apps/web/src/browser/features/deck/index.ts` (6 lines)
- `apps/web/src/browser/features/deck/deck-canvas.ts` (414 lines)
- `apps/web/src/browser/features/deck/deck-model.ts` (133 lines)
- `apps/web/src/browser/features/deck/outline-view.ts` (302 lines)
- `apps/web/src/browser/features/deck/deck-resizer.ts` (118 lines)
- `apps/web/src/browser/features/deck/deck-tab.ts` (85 lines)
- `apps/web/tests/deck-model.test.mjs` (98 lines)

**Files:**

- Remove: `apps/web/src/browser/transport/image-review-client.ts`
- Change: `apps/web/src/browser/transport/index.ts`
- Create: `apps/web/src/browser/features/deck/outline-image-review.ts`
- Create: `apps/web/src/browser/features/deck/deck-preview-queue.ts`
- Create: `apps/web/src/browser/features/deck/deck-presentation.ts`
- Change: `apps/web/src/browser/features/deck/outline-view.ts`
- Change: `apps/web/src/browser/features/deck/deck-canvas.ts`
- Change: `apps/web/src/browser/features/deck/deck-model.ts`
- Change: `apps/web/src/browser/features/deck/deck-resizer.ts`
- Change: `apps/web/src/browser/features/deck/deck-tab.ts`
- Change: `apps/web/src/browser/features/deck/index.ts`
- Change: `apps/web/tests/deck-model.test.mjs`
- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-35-refactor-browser-deck-feature.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-35-refactor-browser-deck-feature.md`

**Interfaces:**

- Produces:
  - `apps/web/src/browser/transport/index.ts`: exports exactly 9 symbols (`HostClient`, `HostRequestError`, `isActive`, `ManagementClient`, `ManagementError`, `DeckClient`, `OutlineClient`, `BriefClient`, `ConfirmationClient`).
  - `apps/web/src/browser/features/deck/index.ts`: exports `export type { DeckModel }`, `DeckWorkflowView`, `mountDeckCanvas`, `mountDeckTab`, `OutlineView`, and `export type { OutlineAction }`.
  - `apps/web/src/browser/features/deck/outline-image-review.ts`: internal `renderImageReviewFigure` absorbing `imageFailure`.
  - `apps/web/src/browser/features/deck/deck-preview-queue.ts`: internal `SLIDE_CSP` and `createPreviewQueue`.
  - `apps/web/src/browser/features/deck/deck-presentation.ts`: internal `attachPresentationControls`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files` (do not touch `brief-view.ts`, `deck-workflow-view.ts`, or `boot.ts`).
- Change any Vietnamese UI string, DOM class name, ARIA attribute, `localStorage` key, or `SLIDE_CSP` value.
- Add `any`, type assertions (`as Type`), non-null assertions (`!`), lint-disable directives, or `@ts-expect-error`.
- Remove, skip, or weaken any test or check.
- Commit or push before Step 7 checks pass.

- [ ] **Step 1: Move `imageFailure` into `outline-image-review.ts` and split `outline-view.ts` (`BB3`, `BD1`, `BD3`, `BD6`)**

1. Create `apps/web/src/browser/features/deck/outline-image-review.ts` (under 140 lines, every function under 65 lines):
   - Move the `imageFailure` Vietnamese copy map verbatim from `apps/web/src/browser/transport/image-review-client.ts` as a file-local helper.
   - Extract file-local `renderImageAudit` for `review.attempts` (`outline-view.ts` lines 164-178) and `attachImagePreview` for lazy `detail` toggle loading (`lines 114-136`). Pass `preview` as a non-optional callback to `attachImagePreview` so the `!` assertion at `outline-view.ts:123` disappears.
   - Export `renderImageReviewFigure` building the `<figure class="outline-image-review">` element and returning `{ figure, replaceButton }`.
2. Remove `apps/web/src/browser/transport/image-review-client.ts` and remove `export { imageFailure } from './image-review-client.ts'` from `apps/web/src/browser/transport/index.ts`.
3. Refactor `apps/web/src/browser/features/deck/outline-view.ts` (under 230 lines, every function under 65 lines):
   - Import `renderImageReviewFigure` from `./outline-image-review.ts` and remove the `../../transport/index.ts` import.
   - Extract file-local helpers `renderSlideBlocks`, `renderPlannedSlide`, `renderProposalChanges`, `buildProposalCard`, and `updateCardState` so `OutlineView.render` drops under 20 lines.
   - Keep `OutlineView` and `OutlineAction` signatures unchanged.

- [ ] **Step 2: Split `deck-canvas.ts` into preview queue, presentation controls, and canvas helpers (`BD2`, `BD6`)**

1. Create `apps/web/src/browser/features/deck/deck-preview-queue.ts` (under 125 lines, every function under 55 lines):
   - Export `SLIDE_CSP` verbatim from `deck-canvas.ts:12`.
   - Export `createPreviewQueue(options)` managing `PREVIEW_CONCURRENCY = 3`, `fetchPreview`, `paintPreview`, `ensurePreview`, `observe`, `unobserve`, and `reset()`.
   - In the `IntersectionObserver` callback (`deck-canvas.ts:154`), guard `if (!(entry.target instanceof HTMLElement)) continue` and bind `const item = entry.target`, removing `as HTMLElement`.
2. Create `apps/web/src/browser/features/deck/deck-presentation.ts` (under 110 lines, every function under 55 lines):
   - Export `attachPresentationControls(options)` owning `presenting()`, `wake()`, `togglePresentation()`, `fullscreenchange`, pointer wake listeners, panel `keydown` shortcuts, and stage click navigation.
3. Refactor `apps/web/src/browser/features/deck/deck-canvas.ts` (under 250 lines, every function under 65 lines):
   - Replace `Map<string, HTMLButtonElement>` with `Map<string, SlideButtonRefs>` where `SlideButtonRefs` holds `{ button: HTMLButtonElement; label: HTMLElement; index: HTMLElement; thumbnail: HTMLElement }`. Update `refs.label.textContent` and `refs.index.textContent` directly, removing the two `!` assertions at lines 259 and 262.
   - Extract file-local `createCanvasDom`, `reconcileSlideButtons`, and `applyDeckState` so `mountDeckCanvas` stays under 65 lines and keeps its exact signature `(container: HTMLElement, client: DeckClient, reveal: () => void): DeckModel`.

- [ ] **Step 3: Remove `!` in `deck-model.ts` and split `deck-resizer.ts` and `deck-tab.ts` (`BD4`, `BD6`)**

1. In `apps/web/src/browser/features/deck/deck-model.ts` lines 64-74 (`select`), bind `const sessionId = this.sessionId` and `const signal = this.control?.signal` at the top, and return early when `!sessionId || !signal || signal.aborted || !this.current.snapshot?.slides.some(s => s.slideId === slideId)`. Remove `this.control!.signal`.
2. In `apps/web/src/browser/features/deck/deck-resizer.ts`, extract file-local `computeBounds`, `createResizerState`, `attachPointerResize`, and `attachKeyboardResize` so every function is under 55 lines and `mountDeckResizer` is under 30 lines.
3. In `apps/web/src/browser/features/deck/deck-tab.ts`, extract file-local `loadSampleLayout` and `saveSampleLayout` so every function is under 55 lines and `mountDeckTab` is under 60 lines.

- [ ] **Step 4: Narrow `DeckModel` on `features/deck/index.ts` and update `deck-model.test.mjs` (`BD5`)**

1. In `apps/web/src/browser/features/deck/index.ts` line 1, change `export { DeckModel } from './deck-model.ts'` to `export type { DeckModel } from './deck-model.ts'`.
2. In `apps/web/tests/deck-model.test.mjs` line 4, change `import { DeckModel } from '../lib/browser-types/features/deck/index.js'` to `import { DeckModel } from '../lib/browser-types/features/deck/deck-model.js'`.

- [ ] **Step 5: Build, check boundaries, lint, format, and measure AST metrics**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint
```

Expected: PASS. Exit code `0`, `0 violation(s)`, and `0 warnings and 0 errors`.

Run Biome format on touched files:

```bash
npx biome format --write apps/web/src/browser/transport/index.ts apps/web/src/browser/features/deck/ apps/web/tests/deck-model.test.mjs
```

Run quantitative AST check on `apps/web/src/browser/features/deck/` and `apps/web/src/browser/transport/`:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.path.startsWith('apps/web/src/browser/features/deck/')||f.path.startsWith('apps/web/src/browser/transport/')).map(f=>{const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); let nn=0; const v=n=>{if(ts.isNonNullExpression(n)) nn++; ts.forEachChild(n,v);}; v(sf); return {path:f.path,lines:f.lines,over400:f.lines>400,longFn:f.longFunctions.length,smallNonBarrel:!f.isBarrel&&f.lines<30,as:f.typeAssertions.length,nn,exports:f.exportCount};}); console.log(JSON.stringify(files,null,2));"
```

Expected: PASS. Every file has `over400: false`, `longFn: 0`, `smallNonBarrel: false`, `as: 0`, and `nn: 0`. `transport/index.ts` has `exports: 9`, and `image-review-client.ts` is absent.

- [ ] **Step 6: Run deck and browser client suites**

Run:

```bash
corepack pnpm@11.28.5 test:slide-pipeline && corepack pnpm@11.28.5 test:deck-review && corepack pnpm@11.28.5 test:layouts && corepack pnpm@11.28.5 test:tools-browser
```

Expected: PASS. All four suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [ ] **Step 7: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 6 as `- [x]` in this file. Change the Task 35 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-35-refactor-browser-deck-feature.md`.
2. Create `docs/build/refactor/module-design/reports/task-35-refactor-browser-deck-feature.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - List of created, changed, and removed files.
   - AST metrics table for every file in `apps/web/src/browser/features/deck/` and `transport/index.ts`.
   - Verification table with commands, exit codes, and test counts.
   - What the commands do not prove.
3. Add a Task 35 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 7 as `- [x]` in this file.
5. Run `git status --short` and check that only the files in `Files` changed. Stage only those files, commit with `refactor(browser): split deck UI modules and move imageFailure`, and run `git push`.

**STOP** and send the Task 35 report summary with the commit hash.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
