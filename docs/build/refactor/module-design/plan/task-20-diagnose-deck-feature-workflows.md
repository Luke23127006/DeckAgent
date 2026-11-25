# Task 20: Diagnose features/deck workflows and image research

Read this file to run a read-only deep-module diagnosis of `apps/web/src/features/deck/`, then stop for owner approval [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/codebase-design/DEEPENING.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/build/refactor/module-design/README.md` (lines 65-120)
- `docs/conventions/project-structure.md` (lines 78-145)
- `docs/conventions/code.md` (lines 1-114)
- `apps/web/src/features/deck/index.ts` (8 lines)
- `apps/web/src/features/deck/failures.ts` (12 lines)
- `apps/web/src/features/deck/brief-service.ts` (135 lines)
- `apps/web/src/features/deck/confirmation-service.ts` (141 lines)
- `apps/web/src/features/deck/deck-workflow.ts` (812 lines)
- `apps/web/src/features/deck/generation-report.ts` (58 lines)
- `apps/web/src/features/deck/generation-workflow.ts` (384 lines)
- `apps/web/src/features/deck/image-research.ts` (483 lines)
- `apps/web/src/index.ts` (seam reference only, lines 45-55 and 270-310)
- `apps/web/src/local-transport.ts` (seam reference only, lines 115-138 and 211-230)
- `apps/web/tests/brief-host.test.mjs`
- `apps/web/tests/image-research.test.mjs`
- `apps/web/tests/research-image-generation.test.mjs`
- `e2e/confirmation-host.test.mjs`
- `e2e/deck-pipeline.test.mjs`
- `e2e/generation-bridge.test.mjs`

**Files:**

- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-20-diagnose-deck-feature-workflows.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-20-diagnose-deck-feature-workflows.md`

**Interfaces:**

- Uses: 8 files in `apps/web/src/features/deck/` (2,033 lines, 9 barrel exports, 2 files over 400 lines, 9 functions over 80 lines) and `scripts/scan-module-design.mjs`. The area also holds 1 small non-barrel file, 3 type assertions, 9 non-null assertions, `BriefService`, and `ConfirmationService`.
- Produces: a file-and-line deep-module diagnosis report in `docs/build/refactor/module-design/reports/task-20-diagnose-deck-feature-workflows.md` with an export audit, assertion audit, and classified finding table, then stops for owner approval.

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

Apply this table in top-to-bottom order to every finding in `apps/web/src/features/deck/`:

| Signal | Action |
| --- | --- |
| A non-barrel file under 30 lines, thin wrapper, or pass-through re-export lowers caller complexity when merged or removed | Propose `focused refactor (merge or remove)` with exact file, lines, and caller impact |
| A file over 400 lines or a function over 80 lines mixes distinct responsibilities or leaks internal or test-only exports beyond its authority | Propose `focused refactor (split responsibility or narrow export surface)` with exact file, lines, and seam |
| A `*Service` declaration, non-`as const` type assertion, or non-null assertion (`!`) exists in a touched Slice 2C file | Propose `focused refactor (rename service or add boundary guard)` with exact file and line |
| A rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` forces a shallow wrapper, duplicated failure class, or awkward ownership | Propose `convention update` naming the exact document path, section heading, and concrete friction |
| A file, type, or seam protects a real invariant or workflow boundary, and moving it raises caller complexity | Propose `no action` with file-and-line rationale |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Measure live file metrics, assertions, and external importers**

Run:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.path.startsWith('apps/web/src/features/deck/')).map(f=>{const src=fs.readFileSync(f.path,'utf8'); const sf=ts.createSourceFile(f.path,src,ts.ScriptTarget.Latest,true); const nonNullLines=[]; const visit=n=>{if(ts.isNonNullExpression(n)) nonNullLines.push(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1); ts.forEachChild(n,visit);}; visit(sf); return {path:f.path,lines:f.lines,exports:f.exportCount,longFn:f.longFunctions,assertions:f.typeAssertions,services:f.serviceSymbols,nonNullLines};}); const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('apps/web/src/features/deck/')); const importers=all.filter(f=>/(?<!browser\/)features\/deck\//.test(fs.readFileSync(f,'utf8'))); console.log(JSON.stringify({fileCount:files.length,totalLines:files.reduce((n,f)=>n+f.lines,0),longFnTotal:files.reduce((n,f)=>n+f.longFn.length,0),assertionTotal:files.reduce((n,f)=>n+f.assertions.length,0),nonNullTotal:files.reduce((n,f)=>n+f.nonNullLines.length,0),serviceTotal:files.reduce((n,f)=>n+f.services.length,0),files,importerCount:importers.length,importers},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"fileCount": 8`, `"totalLines": 2033`, `"longFnTotal": 9`, `"assertionTotal": 3`, `"nonNullTotal": 9`, and `"serviceTotal": 2`.

- [ ] **Step 2: Audit all 9 barrel exports and inspect every file in `apps/web/src/features/deck/`**

Run:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); const s=fs.readFileSync('apps/web/src/features/deck/index.ts','utf8'); const re=[...s.matchAll(/export(?:\s+type)?\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(x=>x.trim().split(/\s+as\s+/).pop()).filter(Boolean)); const names=[...new Set(re)]; const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('apps/web/src/features/deck/')); const usage={}; for(const n of names) usage[n]={prod:0,tests:0}; for(const f of all){const txt=fs.readFileSync(f,'utf8'); if(!/(?<!browser\/)features\/deck\//.test(txt)) continue; const bucket=f.startsWith('apps/web/src/')?'prod':'tests'; for(const n of names){if(new RegExp('(?<![A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(txt)) usage[n][bucket]++;}} console.log(JSON.stringify({exportCount:names.length,zeroProdUsage:Object.entries(usage).filter(([,u])=>u.prod===0).map(([k])=>k),usage},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"exportCount": 9` with production and test usage counts for every export of `apps/web/src/features/deck/index.ts`.

Read all 8 files in `apps/web/src/features/deck/`, the seam reference lines in `apps/web/src/index.ts` and `apps/web/src/local-transport.ts`, and the 6 listed test files.
Record exact file-and-line observations for:
1. `apps/web/src/features/deck/deck-workflow.ts` (812 lines): map the responsibilities inside `DeckWorkflow.prepare` (lines 94-188, 95 lines), `DeckWorkflow.start` (lines 190-811, 622 lines), and `call` (lines 338-651, 314 lines). Separate Brief interview routing, Outline proposal tools, outline restoration, image review dispatch, and generation handoff. Check all 3 non-null assertions (lines 197, 343, 768) and propose exact internal module seams.
2. `apps/web/src/features/deck/image-research.ts` (483 lines): separate Wikimedia/Tavily search orchestration (`WebImageResearch.prepare`, lines 149-251, 103 lines), candidate review and selection (`ImageReviewRun.select`, lines 378-475, 98 lines), JSON parsing, and attribution formatting (`imagePageCredit`). Check whether `imagePageCredit` is test-only in `index.ts` and record guards for all 3 non-null assertions (lines 54, 76, 407).
3. `apps/web/src/features/deck/generation-workflow.ts` (384 lines): map `GenerationWorkflow.prepare` (lines 54-383, 330 lines), `start` (lines 58-381, 324 lines), and `call` (lines 164-377, 214 lines). Inspect all 3 type assertions (lines 146, 283, 296) and the non-null assertion (line 66), and compare tool dispatch patterns with `deck-workflow.ts`.
4. `apps/web/src/features/deck/brief-service.ts` (135 lines) and `confirmation-service.ts` (141 lines): inspect `BriefService` (line 10, 2 non-null assertions at line 43) and `ConfirmationService` (line 11, `confirm` lines 20-140, 121 lines). Propose concrete non-`*Service` names and check whether either class wraps `DeckStore` thinly or owns real cross-store orchestration.
5. `apps/web/src/features/deck/failures.ts` (12 lines) and `generation-report.ts` (58 lines): test `failures.ts` under the deletion test by comparing folding `DeckWorkflowFailure` and `OutlineNotFoundReason` against keeping a separate file. Inspect `generationReport` coupling to `DeckStore`.

- [ ] **Step 3: Answer the four deep-module diagnosis questions and classify every finding**

Produce structured answers backed by exact file paths and line numbers:
1. **Interface width:** State the count of barrel exports (`9`), public classes/functions across the 8 files, and concepts `apps/web/src/index.ts` and `local-transport.ts` must know to wire `features/deck/`. Name every test-only or zero-production-usage export.
2. **Deletion test:** Test `failures.ts` (12 lines), thin wrappers inside `brief-service.ts` and `confirmation-service.ts`, duplicated prompt/tool boilerplate between `deck-workflow.ts` and `generation-workflow.ts`, and any test-only export. State the exact effect of removing or folding each item.
3. **Locality:** Walk through two fixed change scenarios and count every file in `apps/web/src/features/deck/` that changes together, with line ranges:
   - **Scenario A:** Add one new MCP tool to the outline workflow and propagate a new `DeckWorkflowFailure` error code to HTTP transport.
   - **Scenario B:** Add one new image-credit field returned by web image research and saved during slide generation provenance.
4. **Action classification and convention fit:** Apply the [Finding classification decision table](#finding-classification-decision-table) to every finding. Tag each involved dependency using the four categories in `.agents/skills/codebase-design/DEEPENING.md` (`In-process`, `Local-substitutable`, `Remote but owned`, `True external`). Name any hard-fit rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` with its exact heading.

- [ ] **Step 4: Check that no code or convention file changed**

Run: `git status --short`
Expected: PASS. No file under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` appears in the output.

- [ ] **Step 5: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Update the Task 20 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` and link `../reports/task-20-diagnose-deck-feature-workflows.md`.
2. Create `docs/build/refactor/module-design/reports/task-20-diagnose-deck-feature-workflows.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Commands run, with exit codes and key output.
   - Export audit table for `apps/web/src/features/deck/index.ts` (9 exports).
   - Table of all 3 type assertions, all 9 non-null assertions, and both `*Service` symbols with exact lines and proposed replacements.
   - Four deep-module diagnosis sections (Interface width, Deletion test, Locality for Scenarios A and B, Action classification and convention fit).
   - Classified finding table: `ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact`. Use IDs `FD1`, `FD2`, and so on.
   - Items that a decision table sent to the report.
   - What the commands do not prove: static inspection and symbol counts do not run workflow or E2E suites or prove behavioral parity after a refactor.
3. Add a Task 20 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the four files listed in `Files` changed. Stage only those four files, commit with a conventional commit message (example: `docs(module-design): add Task 20 deck feature diagnosis report`), and run `git push`.

**STOP** and send the Task 20 report summary with the commit hash. Do not write or start Slice 2C refactor tasks until the owner approves the finding table.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
