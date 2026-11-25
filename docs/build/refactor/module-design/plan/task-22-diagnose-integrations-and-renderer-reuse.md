# Task 22: Diagnose apps/web/src/integrations and renderer browser reuse

Read this file to run a read-only deep-module diagnosis of `apps/web/src/integrations/` and evaluate browser reuse in `artifact-renderer.ts`, then stop for owner approval [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/codebase-design/DEEPENING.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/build/refactor/module-design/README.md` (lines 65-120)
- `docs/build/refactor/module-design/reports/task-03-investigate-timeout-failure.md` (lines 1-49)
- `docs/conventions/project-structure.md` (lines 78-145)
- `docs/conventions/code.md` (lines 1-114)
- `apps/web/src/integrations/credentials/index.ts` (7 lines), `credential-store.ts` (151 lines)
- `apps/web/src/integrations/images/index.ts` (5 lines), `commons-images.ts` (190 lines), `image-source.ts` (73 lines), `public-image-reader.ts` (188 lines)
- `apps/web/src/integrations/opencode/index.ts` (6 lines), `config.ts` (175 lines), `contracts.ts` (32 lines), `events.ts` (115 lines), `history.ts` (39 lines), `mcp-bridge.ts` (150 lines), `process.ts` (156 lines), `provider.ts` (66 lines), `resources.ts` (38 lines), `runtime.ts` (469 lines)
- `apps/web/src/integrations/providers/index.ts` (2 lines), `provider-catalog.ts` (173 lines)
- `apps/web/src/integrations/rendering/index.ts` (1 line), `artifact-renderer.ts` (272 lines)
- `apps/web/src/integrations/research/index.ts` (2 lines), `tavily.ts` (216 lines)
- `apps/web/src/index.ts` (seam reference only, lines 115-155 and 344-403)
- `apps/web/tests/commons-images.test.mjs`
- `apps/web/tests/mcp-bridge.test.mjs`
- `apps/web/tests/opencode-adapter.test.mjs`
- `apps/web/tests/opencode-resources.test.mjs`
- `e2e/artifact-rendering.test.mjs`
- `e2e/portable-generation-http.test.mjs`

**Files:**

- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-22-diagnose-integrations-and-renderer-reuse.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-22-diagnose-integrations-and-renderer-reuse.md`

**Interfaces:**

- Uses: 22 production files in `apps/web/src/integrations/` (2,526 lines, 6 barrels totaling 30 exports, 1 file over 400 lines) and `scripts/scan-module-design.mjs`. The area also holds 10 functions over 80 lines, 4 type assertions, 10 non-null assertions, and 0 `*Service` symbols.
- Produces: a file-and-line deep-module diagnosis report in `docs/build/refactor/module-design/reports/task-22-diagnose-integrations-and-renderer-reuse.md` with export audit, assertion audit, browser reuse recommendation for `artifact-renderer.ts`, and classified finding table, then stops for owner approval.

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

Apply this table in top-to-bottom order to every finding in `apps/web/src/integrations/`:

| Signal | Action |
| --- | --- |
| A thin wrapper, pass-through re-export, or unused barrel export lowers caller complexity when merged or removed | Propose `focused refactor (merge or remove)` with exact file, lines, and caller impact |
| A file over 400 lines or a function over 80 lines mixes distinct protocol, process, or validation responsibilities | Propose `focused refactor (split responsibility or narrow export surface)` with exact file, lines, and seam |
| A non-`as const` type assertion or non-null assertion (`!`) exists in a touched Slice 2C file without a documented boundary guard | Propose `focused refactor (replace assertion with boundary guard)` with exact file and line |
| Reusing a managed headless browser in `artifact-renderer.ts` keeps network isolation, crash recovery, and clean shutdown while cutting cold spawns | Propose `focused refactor (managed browser reuse)` with exact lifecycle, isolation, and shutdown contract |
| Reusing a headless browser adds crash-state risk or weakens isolation without clear benefit over the current cold-spawn contract | Propose `no action (keep cold spawn)` with file-and-line rationale |
| A rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` forces a shallow wrapper or awkward ownership | Propose `convention update` naming the exact document path, section heading, and concrete friction |
| A file, type, or seam protects a real protocol or security invariant, and moving it raises caller complexity | Propose `no action` with file-and-line rationale |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Measure live file metrics, assertions, and renderer importers**

Run:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.area==='apps/web/src/integrations/').map(f=>{const src=fs.readFileSync(f.path,'utf8'); const sf=ts.createSourceFile(f.path,src,ts.ScriptTarget.Latest,true); const nonNullLines=[]; const visit=n=>{if(ts.isNonNullExpression(n)) nonNullLines.push(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1); ts.forEachChild(n,visit);}; visit(sf); return {path:f.path,lines:f.lines,exports:f.exportCount,longFn:f.longFunctions,assertions:f.typeAssertions,nonNullLines};}); const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('apps/web/src/integrations/rendering/')); const rendererImporters=all.filter(f=>/integrations\/rendering\/|artifactRenderer/.test(fs.readFileSync(f,'utf8'))); console.log(JSON.stringify({fileCount:files.length,totalLines:files.reduce((n,f)=>n+f.lines,0),longFnTotal:files.reduce((n,f)=>n+f.longFn.length,0),assertionTotal:files.reduce((n,f)=>n+f.assertions.length,0),nonNullTotal:files.reduce((n,f)=>n+f.nonNullLines.length,0),files,rendererImporters},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"fileCount": 22`, `"totalLines": 2526`, `"longFnTotal": 10`, `"assertionTotal": 4`, `"nonNullTotal": 10`, and `"rendererImporters": ["apps/web/src/index.ts"]`.

- [ ] **Step 2: Audit all 30 integration barrel exports and inspect every file in `apps/web/src/integrations/`**

Run:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); function namesOf(p){const s=fs.readFileSync(p,'utf8'); const re=[...s.matchAll(/export(?:\s+type)?\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(x=>x.trim().split(/\s+as\s+/).pop()).filter(Boolean)); const dir=[...s.matchAll(/^export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_]+)/gm)].map(m=>m[1]); return [...new Set([...re,...dir])];} const barrels=['apps/web/src/integrations/credentials/index.ts','apps/web/src/integrations/images/index.ts','apps/web/src/integrations/opencode/index.ts','apps/web/src/integrations/providers/index.ts','apps/web/src/integrations/rendering/index.ts','apps/web/src/integrations/research/index.ts']; const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)); const summary=barrels.map(b=>{const dir=b.slice(0,b.lastIndexOf('/')+1); const names=namesOf(b); const ext=all.filter(f=>!f.startsWith(dir)); const counts=Object.fromEntries(names.map(n=>[n,{prod:0,tests:0}])); for(const f of ext){const txt=fs.readFileSync(f,'utf8'); const bucket=f.startsWith('apps/web/src/')||(f.startsWith('packages/')&&!f.includes('/tests/'))?'prod':'tests'; for(const n of names){if(new RegExp('(?<![A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(txt)) counts[n][bucket]++;}} return {barrel:b,exportCount:names.length,counts};}); console.log(JSON.stringify({barrelCount:summary.length,totalBarrelExports:summary.reduce((n,s)=>n+s.exportCount,0),summary},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"barrelCount": 6` and `"totalBarrelExports": 30`.

Read all 22 files in `apps/web/src/integrations/`, `docs/build/refactor/module-design/reports/task-03-investigate-timeout-failure.md`, the seam reference lines in `apps/web/src/index.ts`, and the 6 listed test files.
Record exact file-and-line observations for:
1. `apps/web/src/integrations/rendering/artifact-renderer.ts` (272 lines, `artifactRenderer` lines 102-272, 171 lines): inspect the CDP WebSocket client (`connect` lines 61-99), process spawn, and `DevToolsActivePort` polling (lines 122-162). Inspect `Network.setBlockedURLs` isolation (lines 169-172), the DOM script (lines 182-254), and `finally` cleanup (lines 258-270). Evaluate browser reuse versus cold spawn:
   - Compare cold spawn (14 browser processes per 7-slide deck) against a managed browser using incognito `Target.createBrowserContext` and `Target.createTarget` tabs with `Target.closeTarget` and `Target.disposeBrowserContext`.
   - Record concrete invariants for safe reuse: concurrency cap (`running >= 2`), per-target `Network.setBlockedURLs`, crash and abort recovery, and temp profile cleanup. Also check an explicit `close()` lifecycle hook wired into `apps/web/src/index.ts`.
   - State a single clear recommendation (`managed browser reuse` or `keep cold spawn`) backed by evidence and note its impact on `e2e/portable-generation-http.test.mjs`.
2. `apps/web/src/integrations/opencode/` (10 files, 1,246 lines): inspect `runtime.ts` (469 lines, `attempt` lines 220-468, `onLine` lines 346-438), `mcp-bridge.ts` (150 lines, `openToolBridge` lines 17-150), and `process.ts` (156 lines, `runProcess` lines 63-156). Also inspect `config.ts` (175 lines), `events.ts` (115 lines), `provider.ts` (66 lines), `history.ts` (39 lines), `resources.ts` (38 lines), `contracts.ts` (32 lines), and `index.ts` (6 lines, 10 exports). Record guards for all 3 type assertions (`config.ts` line 170, `resources.ts` lines 12 and 20). Record guards for all 6 non-null assertions (`process.ts` lines 124, 125, 147, 148, and 154, plus `runtime.ts` line 196).
3. `apps/web/src/integrations/images/` (4 files, 456 lines): inspect `commons-images.ts` (190 lines, `candidates` lines 59-143, `as` at line 101) and `image-source.ts` (73 lines, `!` at line 30). Inspect `public-image-reader.ts` (188 lines, `load` lines 65-187, 3 `!` at lines 108, 122, and 150).
4. `apps/web/src/integrations/credentials/` (158 lines), `providers/` (175 lines), and `research/` (218 lines): inspect error contracts, timeout bounds, barrel exports, and whether `tavily.ts` leaks `ResearchFailure` from `features/research/` or reverses the feature-to-integration dependency direction.

- [ ] **Step 3: Answer the four deep-module diagnosis questions and classify every finding**

Produce structured answers backed by exact file paths and line numbers:
1. **Interface width:** State the count of barrel exports (`30`) across the 6 integration folders and list every unused, test-only, or leaked export. Check whether any integration imports a feature module (for example `tavily.ts` importing `ResearchFailure`).
2. **Deletion test:** Test small integration files (`contracts.ts`, `history.ts`, `resources.ts`, `image-source.ts`), thin wrappers, and duplicate helper functions (for example repeated `record()` or `object()` guards across integration files). State the exact effect of removing or folding each item.
3. **Locality:** Walk through two fixed change scenarios and count every file in `apps/web/src/integrations/` that changes together, with line ranges:
   - **Scenario A:** Add one new OpenCode runtime stream event type and forward it to the request listener.
   - **Scenario B:** Add one new DOM visibility rule or lifecycle hook (`close()`) to `artifact-renderer.ts` and wire it in `apps/web/src/index.ts`.
4. **Action classification and convention fit:** Apply the [Finding classification decision table](#finding-classification-decision-table) to every finding. Tag each involved dependency using the four categories in `.agents/skills/codebase-design/DEEPENING.md` (`In-process`, `Local-substitutable`, `Remote but owned`, `True external`). Name any hard-fit rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` with its exact heading.

- [ ] **Step 4: Check that no code or convention file changed**

Run: `git status --short`
Expected: PASS. No file under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` appears in the output.

- [ ] **Step 5: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Update the Task 22 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` and link `../reports/task-22-diagnose-integrations-and-renderer-reuse.md`.
2. Create `docs/build/refactor/module-design/reports/task-22-diagnose-integrations-and-renderer-reuse.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Commands run, with exit codes and key output.
   - Export audit table for all 6 integration barrels (30 exports).
   - Table of all 4 type assertions and all 10 non-null assertions with exact line numbers and proposed guards.
   - Dedicated `artifact-renderer.ts` browser reuse evaluation section with concrete lifecycle design or keep-cold-spawn rationale.
   - Four deep-module diagnosis sections (Interface width, Deletion test, Locality for Scenarios A and B, Action classification and convention fit).
   - Classified finding table: `ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact`. Use IDs `IN1`, `IN2`, and so on.
   - Items that a decision table sent to the report.
   - What the commands do not prove: static inspection and symbol counts do not run OpenCode, image-reader, or headless browser tests. They do not measure live browser reuse latency.
3. Add a Task 22 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the four files listed in `Files` changed. Stage only those four files, commit with a conventional commit message (example: `docs(module-design): add Task 22 integrations and renderer reuse diagnosis report`), and run `git push`.

**STOP** and send the Task 22 report summary with the commit hash. Do not write or start Slice 2C refactor tasks until the owner approves the Task 20, Task 21, and Task 22 finding tables.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
