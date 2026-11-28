# Task 31: Diagnose browser/features/deck UI modules

Read this file to run a read-only deep-module diagnosis of `apps/web/src/browser/features/deck/`, then stop for owner approval [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/codebase-design/DEEPENING.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/build/refactor/module-design/README.md` (lines 65-120)
- `docs/conventions/project-structure.md` (lines 78-164)
- `docs/conventions/code.md` (lines 1-114)
- `apps/web/src/browser/features/deck/index.ts` (6 lines)
- `apps/web/src/browser/features/deck/brief-view.ts` (95 lines)
- `apps/web/src/browser/features/deck/deck-canvas.ts` (414 lines)
- `apps/web/src/browser/features/deck/deck-model.ts` (133 lines)
- `apps/web/src/browser/features/deck/deck-resizer.ts` (118 lines)
- `apps/web/src/browser/features/deck/deck-tab.ts` (85 lines)
- `apps/web/src/browser/features/deck/deck-workflow-view.ts` (228 lines)
- `apps/web/src/browser/features/deck/outline-view.ts` (302 lines)
- `apps/web/src/browser/boot.ts` (seam reference only, lines 25-35, 84-106, and 175-198)
- `apps/web/src/browser/transport/image-review-client.ts` (seam reference only, 27 lines)
- `apps/web/tests/deck-model.test.mjs`
- `apps/web/tests/layout-review.test.mjs`
- `e2e/layout-review-browser.test.mjs`
- `e2e/browser-smoke.test.mjs`

**Files:**

- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-31-diagnose-browser-deck-feature.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-31-diagnose-browser-deck-feature.md`

**Interfaces:**

- Uses: 8 files in `apps/web/src/browser/features/deck/` (1,381 lines, 6 barrel exports, 1 file over 400 lines, 6 functions over 80 lines). The scope also holds 1 type assertion, 4 non-null assertions, and 0 `*Service` symbols, and uses `scripts/scan-module-design.mjs`.
- Produces: a file-and-line deep-module diagnosis report in `docs/build/refactor/module-design/reports/task-31-diagnose-browser-deck-feature.md` with export audit, assertion audit, long-function split map, and classified finding table, then stops for owner approval.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task (for example, missing files or changed line counts).
- The task needs a decision that this task does not contain.
- The same step failed two times.
- `git status --short` shows any modification outside the four files in `Files`.

**Forbidden:**

- Change any production code, test file, `package.json`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md`.
- Remove, skip, or weaken any test or check.
- Add a comment, a lint-disable directive, or `@ts-expect-error`.
- Commit or push before Step 5 checks pass.

## Finding classification decision table

Apply this table in top-to-bottom order to every finding in `apps/web/src/browser/features/deck/`:

| Signal | Action |
| --- | --- |
| A thin wrapper, dead export, or pass-through re-export lowers caller complexity when folded or removed | Propose `focused refactor (merge or remove)` with exact file, lines, and caller impact |
| A file over 400 lines or a function over 80 lines mixes distinct responsibilities or leaks internal or test-only exports beyond its authority | Propose `focused refactor (split responsibility or narrow export surface)` with exact file, lines, and seam |
| A non-`as const` type assertion or non-null assertion (`!`) exists in a touched Slice 2D file | Propose `focused refactor (add boundary guard)` with exact file and line |
| A rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` forces a shallow wrapper or awkward ownership | Propose `convention update` naming the exact document path, section heading, and concrete friction |
| A file, type, or seam protects a real UI invariant or deck boundary, and moving it raises caller complexity | Propose `no action` with file-and-line rationale |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 1: Measure live file metrics, long functions, and assertions**

Run:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.path.startsWith('apps/web/src/browser/features/deck/')).map(f=>{const src=fs.readFileSync(f.path,'utf8'); const sf=ts.createSourceFile(f.path,src,ts.ScriptTarget.Latest,true); const nonNullLines=[]; const visit=n=>{if(ts.isNonNullExpression(n)) nonNullLines.push(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1); ts.forEachChild(n,visit);}; visit(sf); return {path:f.path,lines:f.lines,isBarrel:f.isBarrel,exports:f.exportCount,longFn:f.longFunctions,assertions:f.typeAssertions,services:f.serviceSymbols,nonNullLines};}); console.log(JSON.stringify({fileCount:files.length,totalLines:files.reduce((n,f)=>n+f.lines,0),over400Count:files.filter(f=>f.lines>400).length,longFnTotal:files.reduce((n,f)=>n+f.longFn.length,0),assertionTotal:files.reduce((n,f)=>n+f.assertions.length,0),nonNullTotal:files.reduce((n,f)=>n+f.nonNullLines.length,0),serviceTotal:files.reduce((n,f)=>n+f.services.length,0),files},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"fileCount": 8`, `"totalLines": 1381`, `"over400Count": 1`, `"longFnTotal": 6`, `"assertionTotal": 1`, `"nonNullTotal": 4`, and `"serviceTotal": 0`.

- [x] **Step 2: Audit all 6 barrel exports and inspect every file in `apps/web/src/browser/features/deck/`**

Run:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); const s=fs.readFileSync('apps/web/src/browser/features/deck/index.ts','utf8'); const names=[...new Set([...s.matchAll(/export(?:\s+type)?\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(x=>x.trim().split(/\s+as\s+/).pop()).filter(Boolean)))]; const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('apps/web/src/browser/features/deck/')); const usage=Object.fromEntries(names.map(n=>[n,{prod:0,tests:0}])); for(const f of all){const txt=fs.readFileSync(f,'utf8'); if(!/browser\/features\/deck\/|features\/deck\/index/.test(txt)) continue; const bucket=f.startsWith('apps/web/src/')?'prod':'tests'; for(const n of names){if(new RegExp('(?<![A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(txt)) usage[n][bucket]++;}} console.log(JSON.stringify({exportCount:names.length,zeroProdUsage:Object.entries(usage).filter(([,u])=>u.prod===0).map(([k])=>k),usage},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"exportCount": 6` with production and test usage counts for every export of `apps/web/src/browser/features/deck/index.ts`.

Read all 8 files in `apps/web/src/browser/features/deck/`, the seam reference lines in `apps/web/src/browser/boot.ts`, `apps/web/src/browser/transport/image-review-client.ts`, and the 4 listed test files.
Record exact file-and-line observations for:
1. `apps/web/src/browser/features/deck/deck-canvas.ts` (414 lines): map `mountDeckCanvas` (lines 17-414, 398 lines) and the inner anonymous function (lines 175-305, 131 lines). Separate toolbar and navigation chrome, slide iframe rendering and sandbox attributes, revision switching, export actions, and keyboard shortcuts. Record guards for the type assertion at line 154 and the 2 non-null assertions at lines 259 and 262. Propose exact internal helpers or sibling modules that keep every file under 400 lines and every function under 80 lines.
2. `apps/web/src/browser/features/deck/outline-view.ts` (302 lines): map `OutlineView.render` (lines 58-301, 244 lines) and the inner anonymous function (lines 70-193, 124 lines). Separate outline proposal rendering, slide list rendering, image-review candidate selection, and confirmation controls. Check why `OutlineView` imports `imageFailure` from `../../transport/index.ts` and whether `imageFailure` belongs inside `browser/features/deck/`. Record a guard for the non-null assertion at line 123.
3. `apps/web/src/browser/features/deck/deck-resizer.ts` (118 lines, `mountDeckResizer` lines 4-118) and `deck-tab.ts` (85 lines, `mountDeckTab` lines 5-85): inspect pointer resize logic and split-pane tab controls. Propose helper extractions under 80 lines.
4. `apps/web/src/browser/features/deck/deck-workflow-view.ts` (228 lines), `brief-view.ts` (95 lines), and `deck-model.ts` (133 lines, 1 `!` at line 70): inspect how `DeckWorkflowView` coordinates `BriefView` and `OutlineView`. Inspect how `DeckModel` manages slide state and how `apps/web/tests/deck-model.test.mjs` imports `DeckModel`.
5. `apps/web/src/browser/features/deck/index.ts` (6 exports): inspect which exports (`DeckModel`, `DeckWorkflowView`, `mountDeckCanvas`, `mountDeckTab`, `OutlineView`, `OutlineAction`) have real external production callers in `boot.ts` versus internal-only or test-only usage.

- [x] **Step 3: Answer the four deep-module diagnosis questions and classify every finding**

Produce structured answers backed by exact file paths and line numbers:
1. **Interface width:** State the count of barrel exports (`6`) in `features/deck/index.ts` and public symbols across the 8 files. State the concepts `boot.ts` must know to mount the deck UI. Name every zero-production-usage or test-only export.
2. **Deletion test:** Test `OutlineView` and `OutlineAction` barrel exports, `DeckModel` barrel exposure, any thin wrapper between `deck-workflow-view.ts`, `brief-view.ts`, and `outline-view.ts`, and the cross-boundary import of `imageFailure` from `transport/`. State the exact effect of removing or moving each item.
3. **Locality:** Walk through two fixed change scenarios and count every file in `apps/web/src/browser/features/deck/` that changes together, with line ranges:
   - **Scenario A:** Add one new action button on each outline slide card (for example, reorder or regenerate slide) and route the action to `boot.ts`.
   - **Scenario B:** Add one new metadata badge in the slide canvas viewer (for example, slide layout name) read from the deck snapshot.
4. **Action classification and convention fit:** Apply the [Finding classification decision table](#finding-classification-decision-table) to every finding. Tag each involved dependency using the four categories in `.agents/skills/codebase-design/DEEPENING.md` (`In-process`, `Local-substitutable`, `Remote but owned`, `True external`). Name any hard-fit rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` with its exact heading.

- [x] **Step 4: Check that no code or convention file changed**

Run: `git status --short`
Expected: PASS. No file under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` appears in the output.

- [x] **Step 5: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Update the Task 31 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` and link `../reports/task-31-diagnose-browser-deck-feature.md`.
2. Create `docs/build/refactor/module-design/reports/task-31-diagnose-browser-deck-feature.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Commands run, with exit codes and key output.
   - Export audit table for `apps/web/src/browser/features/deck/index.ts` (6 exports).
   - Table of the 1 type assertion and all 4 non-null assertions with exact lines and proposed guards.
   - Split map for all 6 functions over 80 lines across `deck-canvas.ts`, `outline-view.ts`, `deck-resizer.ts`, and `deck-tab.ts`.
   - Four deep-module diagnosis sections (Interface width, Deletion test, Locality for Scenarios A and B, Action classification and convention fit).
   - Classified finding table: `ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact`. Use IDs `BD1`, `BD2`, and so on.
   - Items that a decision table sent to the report.
   - What the commands do not prove: static inspection and symbol counts do not run layout-review or browser-smoke suites. They do not prove behavioral parity after a refactor.
3. Add a Task 31 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the four files listed in `Files` changed. Stage only those four files, commit with a conventional commit message (example: `docs(module-design): add Task 31 browser deck feature diagnosis report`), and run `git push`.

**STOP** and send the Task 31 report summary with the commit hash. Do not write or start Slice 2D refactor tasks until the owner approves the finding table.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
