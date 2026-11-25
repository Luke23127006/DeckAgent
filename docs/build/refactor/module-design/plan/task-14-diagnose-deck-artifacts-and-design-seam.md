# Task 14: Diagnose presentation/deck artifact storage and design contract seam

Read this file to run read-only diagnosis on `packages/presentation/deck/` artifact storage and `packages/presentation/design/` contracts, then stop for owner approval [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/codebase-design/DEEPENING.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/build/refactor/module-design/README.md` (lines 65-120)
- `docs/conventions/project-structure.md` (lines 91-164)
- `docs/conventions/code.md` (lines 1-114)
- `packages/presentation/deck/src/artifact-store.ts` (985 lines)
- `packages/presentation/deck/src/image-needs.ts` (38 lines)
- `packages/presentation/design/package.json`
- `packages/presentation/design/src/contracts.ts` (89 lines)
- `packages/presentation/design/src/index.ts` (485 lines)
- `packages/presentation/deck/tests/artifact-publication.test.mjs` (475 lines)
- `packages/presentation/design/tests/design-catalog.test.mjs` (129 lines)
- `packages/presentation/deck/src/contracts.ts` (seam reference only, lines 1-160 and 300-446)
- `packages/presentation/deck/src/schema.ts` (seam reference only, 101 lines)
- `packages/presentation/deck/src/index.ts` (seam reference only, lines 192-260 and 500-995)

**Files:**

- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-14-diagnose-deck-artifacts-and-design-seam.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-14-diagnose-deck-artifacts-and-design-seam.md`

**Interfaces:**

- Uses: 4 production files (`packages/presentation/deck/src/artifact-store.ts`, `packages/presentation/deck/src/image-needs.ts`, `packages/presentation/design/src/contracts.ts`, `packages/presentation/design/src/index.ts`) totaling 1,597 lines with 5 non-`as const` type assertions, 20 non-null assertions, and 20 root exports in `@deckagent/design`, plus `scripts/scan-module-design.mjs`.
- Produces: a file-and-line deep-module diagnosis report in `docs/build/refactor/module-design/reports/task-14-diagnose-deck-artifacts-and-design-seam.md` with export audit, assertion audit, seam map, and classified finding table, then stops for owner approval.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task (for example, missing files or changed line counts).
- The task needs a decision that this task does not contain.
- The same step failed two times.
- `git status --short` shows any modification outside the four files in `Files`.

**Forbidden:**

- Change any production code, test file, `package.json`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md`.
- Delete, skip, or weaken any test or check.
- Add a comment, a lint-disable directive, or `@ts-expect-error`.
- Commit or push before Step 5 checks pass.

## Finding classification decision table

Apply this table in top-to-bottom order to every finding in `artifact-store.ts`, `image-needs.ts`, and `packages/presentation/design/`:

| Signal | Action |
| --- | --- |
| A non-barrel file under 30 lines, thin wrapper, or pass-through re-export lowers caller complexity when merged or deleted | Propose `focused refactor (merge or delete)` with exact file, lines, and caller impact |
| A file over 400 lines or a function over 80 lines mixes distinct responsibilities or leaks internal or test-only exports beyond its authority | Propose `focused refactor (split responsibility or narrow export surface)` with exact file, lines, and seam |
| A non-`as const` type assertion or non-null assertion (`!`) exists in a touched Slice 2B file without a documented boundary guard | Propose `focused refactor (replace assertion with boundary guard)` with exact file and line |
| A rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` forces a shallow wrapper, duplicated contract, or awkward ownership across `deck/` and `design/` | Propose `convention update` naming the exact document path, section heading, and concrete friction |
| A file, type, or seam protects a real invariant or contract boundary, and moving it raises caller complexity | Propose `no action` with file-and-line rationale |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Measure live file metrics, assertions, and `@deckagent/design` importers**

Run:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const targets=new Set(['packages/presentation/deck/src/artifact-store.ts','packages/presentation/deck/src/image-needs.ts','packages/presentation/design/src/contracts.ts','packages/presentation/design/src/index.ts']); const files=out.files.filter(f=>targets.has(f.path)).map(f=>{const src=fs.readFileSync(f.path,'utf8'); const sf=ts.createSourceFile(f.path,src,ts.ScriptTarget.Latest,true); const nonNullLines=[]; const visit=n=>{if(ts.isNonNullExpression(n)) nonNullLines.push(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1); ts.forEachChild(n,visit);}; visit(sf); return {path:f.path,lines:f.lines,exports:f.exportCount,longFn:f.longFunctions,assertions:f.typeAssertions,nonNullLines};}); const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('packages/presentation/design/')); const designImporters=all.filter(f=>fs.readFileSync(f,'utf8').includes('@deckagent/design')); console.log(JSON.stringify({fileCount:files.length,totalLines:files.reduce((n,f)=>n+f.lines,0),typeAssertionTotal:files.reduce((n,f)=>n+f.assertions.length,0),nonNullTotal:files.reduce((n,f)=>n+f.nonNullLines.length,0),files,designImporterCount:designImporters.length,designImporters},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"fileCount": 4`, `"totalLines": 1597`, `"typeAssertionTotal": 5`, `"nonNullTotal": 20`, and `"designImporterCount": 22`.

- [ ] **Step 2: Audit all 20 `@deckagent/design` exports and inspect artifact and design seams**

Run:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); const s=fs.readFileSync('packages/presentation/design/src/index.ts','utf8'); const re=[...s.matchAll(/export(?:\s+type)?\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(x=>x.trim().split(/\s+as\s+/).pop()).filter(Boolean)); const dir=[...s.matchAll(/^export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_]+)/gm)].map(m=>m[1]); const names=[...new Set([...re,...dir])]; const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('packages/presentation/design/')); const usage={}; for(const n of names) usage[n]={deck:0,document:0,html:0,webProd:0,tests:0}; for(const f of all){const txt=fs.readFileSync(f,'utf8'); if(!txt.includes('@deckagent/design')) continue; const bucket=f.startsWith('packages/presentation/deck/src/')?'deck':f.startsWith('packages/presentation/document/src/')?'document':f.startsWith('packages/presentation/html/src/')?'html':f.startsWith('apps/web/src/')?'webProd':'tests'; for(const n of names){if(new RegExp('(?<![A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(txt)) usage[n][bucket]++;}} console.log(JSON.stringify({exportCount:names.length,zeroProdUsage:Object.entries(usage).filter(([,u])=>u.deck+u.document+u.html+u.webProd===0).map(([k])=>k),deckOnly:Object.entries(usage).filter(([,u])=>u.deck>0&&u.document===0&&u.html===0&&u.webProd===0).map(([k])=>k),usage},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"exportCount": 20` with per-bucket usage counts for every export of `@deckagent/design`.

Read `packages/presentation/deck/src/artifact-store.ts` (985 lines), `packages/presentation/deck/src/image-needs.ts` (38 lines), `packages/presentation/design/src/contracts.ts` (89 lines), `packages/presentation/design/src/index.ts` (485 lines), `packages/presentation/design/package.json`, both listed test files, and the seam reference sections in `deck/src/{contracts,schema,index}.ts`.
Record exact file-and-line observations for:
1. Responsibilities inside `packages/presentation/deck/src/artifact-store.ts` (985 lines, 36 methods): separate outline image preparation and caching (`prepareImages` line 167, `researchImage` line 651, `preparedRecord`, `imageReview`, `imagePreview`, `restoredImage`, `imageBlockers`). Separate stage lifecycle, disk artifact I/O, validation cleanup, publication manifest, and recovery (`begin`, `append`, `asset`, `prepare`, `manifest`, `published`, `discard`, `content`, `native`, `recover`). State whether `ArtifactStorage` mixes two owners and propose exact internal module seams.
2. Exact boundary guards for both type assertions (`line 282` `PreparedRecord` parse and `line 590` `notes` cast) and all 6 non-null assertions (`lines 203, 291, 321, 342, 674, 692`) in `artifact-store.ts`. Record what happens on corrupt SQLite JSON or missing rows.
3. Cohesion of `packages/presentation/deck/src/image-needs.ts` (38 lines) with `artifact-store.ts` and `WebImageIntent` in `packages/presentation/design/src/contracts.ts` (lines 54-69). Check whether `image-needs.ts` stays standalone or folds into an image storage module.
4. Internal structure of `packages/presentation/design/src/index.ts` (485 lines, 20 exports): separate static catalog definitions (`system`, `template`) from design snapshot resolution and fingerprinting. Separate content plan checks (`validateContentPlan`, line 239, 95 lines) from layout compatibility review (`reviewLayouts`).
5. Exact boundary guards for all 3 type assertions (`line 148` theme keys cast and `line 313` double cast on `block.intent`) in `packages/presentation/design/src/index.ts`. Record guards for all 14 non-null assertions (`lines 345, 352, 354, 361, 364, 381-384, 392`).
6. Cross-package contract seam between `packages/presentation/deck/` and `packages/presentation/design/`: explain why `deck/src/{index,contracts}.ts` co-changed 3 to 4 times with `design/src/{index,contracts}.ts`. Check whether `ContentBlock` and `WebImageIntent` belong in `design/` or `document/` or `deck/`, and state whether Slice 2B should refactor `packages/presentation/design/` together with `packages/presentation/deck/` or defer `design/` to Phase 3.

- [ ] **Step 3: Answer the four deep-module diagnosis questions and classify every finding**

Produce structured answers backed by exact file paths and line numbers:
1. **Interface width:** State the count of methods on `ArtifactStorage` (`36`), exported symbols in `@deckagent/design` (`20`), and concepts callers must know across the artifact and design seam. List every unused export, leaked internal, or cross-package re-export.
2. **Deletion test:** Test `image-needs.ts` (38 lines), duplicate helper logic between `artifact-store.ts` and `deck/src/index.ts`, and any thin wrappers or pass-through types across `deck/` and `design/`. State the exact effect on caller complexity.
3. **Locality:** Walk through two fixed change scenarios and count every file in `packages/presentation/deck/` and `packages/presentation/design/` that changes together, with line ranges:
   - **Scenario A:** Add one new `ContentBlock` variant and one layout capacity rule.
   - **Scenario B:** Add one new metadata field to prepared research images stored during outline image preparation and consumed during slide staging.
4. **Action classification and convention fit:** Apply the [Finding classification decision table](#finding-classification-decision-table) to every finding. Tag each involved dependency using the four categories in `.agents/skills/codebase-design/DEEPENING.md` (`In-process`, `Local-substitutable`, `Remote but owned`, `True external`). Name any hard-fit rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` with its exact heading.

- [ ] **Step 4: Check that no code or convention file changed**

Run: `git status --short`
Expected: PASS. No file under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` appears in the output.

- [ ] **Step 5: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Update the Task 14 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` and link `../reports/task-14-diagnose-deck-artifacts-and-design-seam.md`.
2. Create `docs/build/refactor/module-design/reports/task-14-diagnose-deck-artifacts-and-design-seam.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Commands run, with exit codes and key output.
   - Export audit table for `@deckagent/design` (20 exports) and `ArtifactStorage` responsibility map (36 methods).
   - Table of all 5 type assertions and all 20 non-null assertions with exact line numbers and proposed guards.
   - Four deep-module diagnosis sections (Interface width, Deletion test, Locality for Scenarios A and B, Action classification and convention fit). Add an explicit recommendation on whether `packages/presentation/design/` refactors inside Slice 2B or Phase 3.
   - Classified finding table: `ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact`.
   - Items that a decision table sent to the report.
   - What the commands do not prove: static checks do not run rendering, publication, or design catalog tests, and do not prove behavioral parity.
3. Add a Task 14 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the four files listed in `Files` changed. Stage only those four files, commit with a conventional commit message (example: `docs(module-design): add Task 14 deck artifacts and design seam report`), and run `git push`.

**STOP** and send the Task 14 report summary with the commit hash. Do not write or start Slice 2B refactor tasks until the owner approves both the Task 13 and Task 14 finding tables.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
