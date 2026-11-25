# Task 13: Diagnose presentation/deck core, stores, and public surface

Read this file to run a read-only deep-module diagnosis of the core files, stores, and public surface in `packages/presentation/deck/`, then stop for owner approval [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/codebase-design/DEEPENING.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/build/refactor/module-design/README.md` (lines 65-120)
- `docs/conventions/project-structure.md` (lines 91-164)
- `docs/conventions/code.md` (lines 1-114)
- `packages/presentation/deck/package.json`
- `packages/presentation/deck/src/index.ts` (1,065 lines)
- `packages/presentation/deck/src/contracts.ts` (446 lines)
- `packages/presentation/deck/src/brief.ts` (234 lines)
- `packages/presentation/deck/src/bound-outline.ts` (218 lines)
- `packages/presentation/deck/src/outline-store.ts` (198 lines)
- `packages/presentation/deck/src/generation-store.ts` (149 lines)
- `packages/presentation/deck/src/brief-store.ts` (132 lines)
- `packages/presentation/deck/src/interview.ts` (118 lines)
- `packages/presentation/deck/src/schema.ts` (101 lines)
- `packages/presentation/deck/src/provenance.ts` (11 lines)
- `packages/presentation/deck/tests/deck-service.test.mjs` (95 lines)
- `packages/presentation/deck/tests/deck-brief.test.mjs` (219 lines)
- `packages/presentation/deck/tests/bound-outline.test.mjs` (159 lines)
- `packages/presentation/deck/tests/outline-state.test.mjs` (131 lines)
- `packages/presentation/deck/tests/generation-confirmation.test.mjs` (104 lines)
- `packages/presentation/deck/tests/generation-continuation.test.mjs` (46 lines)
- `packages/presentation/deck/tests/interview-policy.test.mjs` (44 lines)
- `packages/host/contracts/src/brief-validation.ts` (seam comparison only)
- `packages/host/contracts/src/outline-validation.ts` (seam comparison only)
- `packages/host/contracts/src/generation-validation.ts` (seam comparison only)

**Files:**

- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-13-diagnose-deck-core-and-surface.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-13-diagnose-deck-core-and-surface.md`

**Interfaces:**

- Uses: 10 core files in `packages/presentation/deck/src/` (2,672 lines, 66 root exports, 7 `./brief` exports, 1 `*Service` symbol `DeckService`, 15 non-null assertions) and `scripts/scan-module-design.mjs`.
- Produces: a file-and-line deep-module diagnosis report in `docs/build/refactor/module-design/reports/task-13-diagnose-deck-core-and-surface.md` with an export audit and classified finding table, then stops for owner approval.

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

Apply this table in top-to-bottom order to every finding in the 10 core files of `packages/presentation/deck/`:

| Signal | Action |
| --- | --- |
| A non-barrel file under 30 lines, thin wrapper, subpath export, or pass-through re-export lowers caller complexity when merged or deleted | Propose `focused refactor (merge or delete)` with exact file, lines, and caller impact |
| A file over 400 lines or a function over 80 lines mixes distinct responsibilities or leaks internal or test-only exports beyond its authority | Propose `focused refactor (split responsibility or narrow export surface)` with exact file, lines, and seam |
| A `*Service` declaration, non-`as const` type assertion, or non-null assertion (`!`) exists in a touched Slice 2B file | Propose `focused refactor (rename service or add boundary guard)` with exact file and line |
| A rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` forces a shallow wrapper, duplicated schema, or awkward ownership | Propose `convention update` naming the exact document path, section heading, and concrete friction |
| A file, type, or seam protects a real invariant or contract boundary, and moving it raises caller complexity | Propose `no action` with file-and-line rationale |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Measure live file metrics, non-null assertions, and workspace importers**

Run:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const excluded=new Set(['packages/presentation/deck/src/artifact-store.ts','packages/presentation/deck/src/image-needs.ts']); const files=out.files.filter(f=>f.area==='packages/presentation/deck/'&&!excluded.has(f.path)).map(f=>{const src=fs.readFileSync(f.path,'utf8'); const sf=ts.createSourceFile(f.path,src,ts.ScriptTarget.Latest,true); const nonNullLines=[]; const visit=n=>{if(ts.isNonNullExpression(n)) nonNullLines.push(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1); ts.forEachChild(n,visit);}; visit(sf); return {path:f.path,lines:f.lines,exports:f.exportCount,longFn:f.longFunctions,assertions:f.typeAssertions,services:f.serviceSymbols,nonNullLines};}); const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('packages/presentation/deck/')); const importers={root:[],brief:[]}; for(const f of all){const s=fs.readFileSync(f,'utf8'); if(/['\"]@deckagent\/deck['\"]/.test(s)) importers.root.push(f); if(s.includes('@deckagent/deck/brief')) importers.brief.push(f);} console.log(JSON.stringify({fileCount:files.length,totalLines:files.reduce((n,f)=>n+f.lines,0),nonNullTotal:files.reduce((n,f)=>n+f.nonNullLines.length,0),files,importerCounts:{root:importers.root.length,brief:importers.brief.length},importers},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"fileCount": 10`, `"totalLines": 2672`, `"nonNullTotal": 15`, `"root": 31`, and `"brief": 2`.

- [ ] **Step 2: Audit all 66 root exports and all 7 `./brief` subpath exports**

Run:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); function namesOf(p){const s=fs.readFileSync(p,'utf8'); const re=[...s.matchAll(/export(?:\s+type)?\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(x=>x.trim().split(/\s+as\s+/).pop()).filter(Boolean)); const dir=[...s.matchAll(/^export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_]+)/gm)].map(m=>m[1]); return [...new Set([...re,...dir])];} const rootNames=namesOf('packages/presentation/deck/src/index.ts'); const briefNames=namesOf('packages/presentation/deck/src/brief.ts'); const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('packages/presentation/deck/')); function audit(names,matcher){const usage={}; for(const n of names) usage[n]={hostApi:0,webProd:0,otherPkg:0,tests:0}; for(const f of all){const s=fs.readFileSync(f,'utf8'); if(!matcher(s)) continue; const bucket=f.startsWith('packages/host/api/src/')?'hostApi':f.startsWith('apps/web/src/')?'webProd':(f.startsWith('packages/')&&!f.includes('/tests/'))?'otherPkg':'tests'; for(const n of names){if(new RegExp('(?<![A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(s)) usage[n][bucket]++;}} return {exportCount:names.length,zeroProdUsage:Object.entries(usage).filter(([,u])=>u.hostApi+u.webProd+u.otherPkg===0).map(([k])=>k),testOnlyUsage:Object.entries(usage).filter(([,u])=>u.hostApi+u.webProd+u.otherPkg===0&&u.tests>0).map(([k])=>k),zeroUsage:Object.entries(usage).filter(([,u])=>u.hostApi+u.webProd+u.otherPkg+u.tests===0).map(([k])=>k),usage};} console.log(JSON.stringify({root:audit(rootNames,s=>/['\"]@deckagent\/deck['\"]/.test(s)),briefSubpath:audit(briefNames,s=>s.includes('@deckagent/deck/brief'))},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"exportCount": 66` for `root` and `"exportCount": 7` for `briefSubpath`.

Read all 10 core files in `packages/presentation/deck/src/`, `packages/presentation/deck/package.json`, all 7 listed test files, and the 3 seam reference files in `packages/host/contracts/src/`.
Record exact file-and-line observations for:
1. Re-exports in `packages/presentation/deck/src/index.ts` (lines 4-10, 34-87) and `packages/presentation/deck/src/contracts.ts` (lines 1-14) from `@deckagent/presentation-document` and `@deckagent/design`. List every pass-through symbol, zero-production-usage symbol, and test-only export.
2. Subpath export `./brief` in `packages/presentation/deck/package.json` (lines 9-12) and `packages/presentation/deck/src/brief.ts` (234 lines, `decodeBriefDraft` at line 124, 111 lines). Check why only `apps/web/src/features/deck/deck-workflow.ts` imports `@deckagent/deck/brief` and compare `brief.ts` Zod rules against `packages/host/contracts/src/brief-validation.ts`.
3. `DeckService` in `packages/presentation/deck/src/index.ts` (1,065 lines, 45 methods): classify its methods by responsibility (brief, interview, outline, generation, image delegation, artifact staging, publication, subscription, DB lifecycle). Inspect `generationCapability` (line 509, 82 lines), `publishArtifactFromStage` (line 636, 104 lines), and `publish` (line 828, 84 lines). Propose a concrete non-`*Service` replacement name for `DeckService` and list every caller affected by a rename or split.
4. `packages/presentation/deck/src/contracts.ts` (446 lines, 52 exports): check which types belong to brief, outline, generation, artifact/image, or deck publication, and check overlap with `packages/host/contracts/src/{brief-validation,outline-validation,generation-validation}.ts`.
5. Store files and helpers: inspect `bound-outline.ts` (218 lines, `saveBoundOutline` at line 131), `outline-store.ts` (198 lines, `snapshot` at line 45), `generation-store.ts` (149 lines), and `brief-store.ts` (132 lines). Inspect `interview.ts` (118 lines), `schema.ts` (101 lines), and `provenance.ts` (11 lines). Explain why `contracts.ts <-> index.ts` co-changed 9 times.
6. All 15 non-null assertions (`!`) across `index.ts` (9), `schema.ts` (3), `interview.ts` (2), and `outline-store.ts` (1). Record exact line numbers and exact guard replacements.

- [ ] **Step 3: Answer the four deep-module diagnosis questions and classify every finding**

Produce structured answers backed by exact file paths and line numbers:
1. **Interface width:** State the count of exported symbols (`66` root + `7` `./brief`), `DeckService` method count (`45`), and concepts callers must know to use `@deckagent/deck`. Name every pass-through re-export, unused export, and test-only export.
2. **Deletion test:** Test `packages/presentation/deck/src/provenance.ts` (11 lines), the `./brief` subpath export, pass-through re-exports from `@deckagent/presentation-document` and `@deckagent/design`, and any thin forwarding methods on `DeckService`. State the exact effect of deleting or folding each item.
3. **Locality:** Walk through two fixed change scenarios and count every file in `packages/presentation/deck/` that changes together, with line ranges:
   - **Scenario A:** Add one optional field to `BriefDraft`, check it at the boundary, and persist it in SQLite.
   - **Scenario B:** Add one new generation failure status or stage transition and emit a deck change event.
4. **Action classification and convention fit:** Apply the [Finding classification decision table](#finding-classification-decision-table) to every finding. Tag each involved dependency using the four categories in `.agents/skills/codebase-design/DEEPENING.md` (`In-process`, `Local-substitutable`, `Remote but owned`, `True external`). Name any hard-fit rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` with its exact heading.

- [ ] **Step 4: Check that no code or convention file changed**

Run: `git status --short`
Expected: PASS. No file under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` appears in the output.

- [ ] **Step 5: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Update the Task 13 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` and link `../reports/task-13-diagnose-deck-core-and-surface.md`.
2. Create `docs/build/refactor/module-design/reports/task-13-diagnose-deck-core-and-surface.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Commands run, with exit codes and key output.
   - Export audit tables for `@deckagent/deck` (66 root exports) and `@deckagent/deck/brief` (7 subpath exports).
   - Table of all 15 non-null assertions with exact line numbers and proposed guards.
   - Four deep-module diagnosis sections (Interface width, Deletion test, Locality for Scenarios A and B, Action classification and convention fit).
   - Classified finding table: `ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact`.
   - Items that a decision table sent to the report.
   - What the commands do not prove: static inspection and symbol counts do not run SQLite or E2E suites or prove behavioral parity after a refactor.
3. Add a Task 13 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the four files listed in `Files` changed. Stage only those four files, commit with a conventional commit message (example: `docs(module-design): add Task 13 deck core diagnosis report`), and run `git push`.

**STOP** and send the Task 13 report summary with the commit hash. Do not write or start Slice 2B refactor tasks until the owner approves the finding table.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
