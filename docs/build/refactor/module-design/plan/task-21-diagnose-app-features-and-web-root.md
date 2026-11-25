# Task 21: Diagnose non-deck features and apps/web/src root

Read this file to run a read-only deep-module diagnosis of the seven non-deck feature folders and `apps/web/src/` root, then stop for owner approval [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/codebase-design/DEEPENING.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/build/refactor/module-design/README.md` (lines 65-120)
- `docs/conventions/project-structure.md` (lines 78-145)
- `docs/conventions/code.md` (lines 1-114)
- `apps/web/src/features/attachments/index.ts` (4 lines), `failures.ts` (9 lines), `attachment-service.ts` (275 lines), `managed-attachments.ts` (340 lines)
- `apps/web/src/features/chats/index.ts` (58 lines), `contracts.ts` (25 lines)
- `apps/web/src/features/providers/index.ts` (3 lines), `failures.ts` (9 lines), `built-in-providers.ts` (36 lines), `provider-settings.ts` (374 lines)
- `apps/web/src/features/requests/index.ts` (6 lines), `prepare-runtime.ts` (75 lines)
- `apps/web/src/features/research/index.ts` (2 lines), `failures.ts` (9 lines), `research-service.ts` (177 lines)
- `apps/web/src/features/sources/index.ts` (2 lines), `failures.ts` (9 lines), `source-tools.ts` (345 lines)
- `apps/web/src/features/workspaces/index.ts` (53 lines), `contracts.ts` (18 lines)
- `apps/web/src/index.ts` (403 lines)
- `apps/web/src/local-transport.ts` (301 lines)
- `apps/web/src/ui-assets.ts` (213 lines)
- `apps/web/src/cli.ts` (165 lines)
- `apps/web/src/web-state.ts` (135 lines)
- `apps/web/src/storage-root.ts` (81 lines)
- `apps/web/src/draft-store.ts` (71 lines)
- `apps/web/src/sample-slides.ts` (29 lines), `outline-style.ts` (16 lines), `research-style.ts` (8 lines), `attachment-style.ts` (7 lines)
- `apps/web/src/features/deck/failures.ts` (seam reference only, 12 lines)
- `apps/web/tests/draft-store.test.mjs`
- `apps/web/tests/research.test.mjs`
- `apps/web/tests/web-management.test.mjs`
- `apps/web/tests/web-session.test.mjs`
- `e2e/attachment-admission.test.mjs`
- `e2e/local-foundation.test.mjs`
- `e2e/source-requests.test.mjs`

**Files:**

- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-21-diagnose-app-features-and-web-root.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-21-diagnose-app-features-and-web-root.md`

**Interfaces:**

- Uses: 31 production files across 7 non-deck `apps/web/src/features/` folders (20 files, 1,829 lines) and `apps/web/src/` root (11 files, 1,429 lines) totaling 3,258 lines. The scope holds 1 file over 400 lines, 5 functions over 80 lines, 10 small non-barrel files, and 33 barrel exports. It also holds 3 type assertions, 7 non-null assertions, `AttachmentService`, `ResearchService`, and uses `scripts/scan-module-design.mjs`.
- Produces: a file-and-line deep-module diagnosis report in `docs/build/refactor/module-design/reports/task-21-diagnose-app-features-and-web-root.md` with export audit, small-file deletion audit, assertion audit, and classified finding table, then stops for owner approval.

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

Apply this table in top-to-bottom order to every finding across the 7 non-deck feature folders and `apps/web/src/` root:

| Signal | Action |
| --- | --- |
| A non-barrel file under 30 lines, thin wrapper, or duplicated `failures.ts` or style file lowers caller complexity when merged or removed | Propose `focused refactor (merge or remove)` with exact file, lines, and caller impact |
| A file over 400 lines or a function over 80 lines mixes distinct responsibilities or leaks internal or test-only exports beyond its authority | Propose `focused refactor (split responsibility or narrow export surface)` with exact file, lines, and seam |
| A `*Service` declaration, non-`as const` type assertion, or non-null assertion (`!`) exists in a touched Slice 2C file | Propose `focused refactor (rename service or add boundary guard)` with exact file and line |
| A rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` forces a shallow wrapper, repeated error class, or awkward ownership | Propose `convention update` naming the exact document path, section heading, and concrete friction |
| A file, type, or seam protects a real invariant or startup boundary, and moving it raises caller complexity | Propose `no action` with file-and-line rationale |
| No row matches | Add the item to the report. Do not change it. |

- [ ] **Step 1: Measure live file metrics, small non-barrel files, assertions, and `*Service` symbols**

Run:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>(f.area==='apps/web/src/features/'&&!f.path.startsWith('apps/web/src/features/deck/'))||f.area==='apps/web/src/').map(f=>{const src=fs.readFileSync(f.path,'utf8'); const sf=ts.createSourceFile(f.path,src,ts.ScriptTarget.Latest,true); const nonNullLines=[]; const visit=n=>{if(ts.isNonNullExpression(n)) nonNullLines.push(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1); ts.forEachChild(n,visit);}; visit(sf); return {path:f.path,area:f.area,lines:f.lines,isBarrel:f.isBarrel,smallNonBarrel:!f.isBarrel&&f.lines<30,exports:f.exportCount,longFn:f.longFunctions,assertions:f.typeAssertions,services:f.serviceSymbols,nonNullLines};}); console.log(JSON.stringify({fileCount:files.length,totalLines:files.reduce((n,f)=>n+f.lines,0),smallNonBarrelCount:files.filter(f=>f.smallNonBarrel).length,longFnTotal:files.reduce((n,f)=>n+f.longFn.length,0),assertionTotal:files.reduce((n,f)=>n+f.assertions.length,0),nonNullTotal:files.reduce((n,f)=>n+f.nonNullLines.length,0),serviceTotal:files.reduce((n,f)=>n+f.services.length,0),files},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"fileCount": 31`, `"totalLines": 3258`, `"smallNonBarrelCount": 10`, `"longFnTotal": 5`, `"assertionTotal": 3`, `"nonNullTotal": 7`, and `"serviceTotal": 2`.

- [ ] **Step 2: Audit all 33 barrel exports and inspect every file in scope**

Run:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); function namesOf(p){const s=fs.readFileSync(p,'utf8'); const re=[...s.matchAll(/export(?:\s+type)?\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(x=>x.trim().split(/\s+as\s+/).pop()).filter(Boolean)); const dir=[...s.matchAll(/^export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_]+)/gm)].map(m=>m[1]); return [...new Set([...re,...dir])];} const barrels=['apps/web/src/features/attachments/index.ts','apps/web/src/features/chats/index.ts','apps/web/src/features/providers/index.ts','apps/web/src/features/requests/index.ts','apps/web/src/features/research/index.ts','apps/web/src/features/sources/index.ts','apps/web/src/features/workspaces/index.ts','apps/web/src/index.ts']; const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)); const summary=barrels.map(b=>{const dir=b.slice(0,b.lastIndexOf('/')+1); const names=namesOf(b); const ext=all.filter(f=>!f.startsWith(dir)); const counts=Object.fromEntries(names.map(n=>[n,{prod:0,tests:0}])); for(const f of ext){const txt=fs.readFileSync(f,'utf8'); const bucket=f.startsWith('apps/web/src/')||f.startsWith('packages/')&&!f.includes('/tests/')?'prod':'tests'; for(const n of names){if(new RegExp('(?<![A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(txt)) counts[n][bucket]++;}} return {barrel:b,exportCount:names.length,counts};}); console.log(JSON.stringify({barrelCount:summary.length,totalBarrelExports:summary.reduce((n,s)=>n+s.exportCount,0),summary},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"barrelCount": 8` and `"totalBarrelExports": 33`.

Read all 31 files in scope, the seam reference `apps/web/src/features/deck/failures.ts`, and the 7 listed test files.
Record exact file-and-line observations for:
1. `apps/web/src/index.ts` (403 lines, `startLocalWeb` lines 90-403, 314 lines): separate storage bootstrap, inline `preparedImage` attachment bridge (lines 123-144), and static asset loading (lines 240-271). Separate inline HTTP management checks throwing `HttpError` (lines 318-336) and the duplicated nested `try/finally` close chains (lines 350-401). Explain why `index.ts` co-changed 3 times with `local-transport.ts`.
2. `apps/web/src/local-transport.ts` (301 lines, `mapApplicationFailure` lines 145-240, 96 lines): check why `attachmentManagement` (lines 277-301) wraps `AttachmentFailure` into `HttpError` when `mapApplicationFailure` (lines 197-203) already maps `AttachmentFailure`. Check whether `mapApplicationFailure` splits cleanly by status table or stays in one file.
3. The 10 non-barrel files under 30 lines:
   - Four root asset files: `attachment-style.ts` (7 lines), `research-style.ts` (8 lines), `outline-style.ts` (16 lines), and `sample-slides.ts` (29 lines). Check why they live at `apps/web/src/` root instead of `ui-assets.ts` (213 lines).
   - Four feature `failures.ts` files (`attachments/failures.ts`, `providers/failures.ts`, `research/failures.ts`, `sources/failures.ts`, 9 lines each, plus `deck/failures.ts` 12 lines). Check whether each class folds into its feature module or needs a convention rule.
   - Two tiny contract files: `chats/contracts.ts` (25 lines) and `workspaces/contracts.ts` (18 lines). Check whether folding each into its sibling `index.ts` (58 and 53 lines) lowers complexity.
4. `apps/web/src/features/sources/source-tools.ts` (345 lines, `prepareSourceTools` lines 53-345, `execute` lines 162-343) and `providers/provider-settings.ts` (374 lines): inspect long function splits and ownership seams. Inspect `attachments/attachment-service.ts` (275 lines), `attachments/managed-attachments.ts` (340 lines), and `research/research-service.ts` (177 lines), and propose non-`*Service` names for `AttachmentService` (line 56) and `ResearchService` (line 18).
5. `apps/web/src/cli.ts` (165 lines, `main` lines 54-153, 100 lines), `web-state.ts` (135 lines), `storage-root.ts` (81 lines), and `draft-store.ts` (71 lines): inspect structure and error mapping. Record guards for all 3 type assertions (`provider-settings.ts` lines 80 and 91, `source-tools.ts` line 165). Record guards for all 7 non-null assertions (`cli.ts` line 49, `managed-attachments.ts` lines 332 and 333, `source-tools.ts` line 300, `web-state.ts` lines 45, 46, and 61).

- [ ] **Step 3: Answer the four deep-module diagnosis questions and classify every finding**

Produce structured answers backed by exact file paths and line numbers:
1. **Interface width:** State the count of barrel exports (`33`) across the 8 entry files, plus the count of distinct error classes mapped by `local-transport.ts`. Identify every redundant wrapper, pass-through export, or leaked internal.
2. **Deletion test:** Test all 10 non-barrel files under 30 lines, `toAttachmentHttpError` in `local-transport.ts`, and any thin forwarding layers across `chats/`, `workspaces/`, `requests/`, and `apps/web/src/` root. State the exact effect of removing or folding each item.
3. **Locality:** Walk through two fixed change scenarios and count every file in scope that changes together, with line ranges:
   - **Scenario A:** Add one new application failure code to a feature and map it to an HTTP status in local transport.
   - **Scenario B:** Add one new local SQLite store or background resource that opens during `startLocalWeb` and closes cleanly on startup failure or shutdown.
4. **Action classification and convention fit:** Apply the [Finding classification decision table](#finding-classification-decision-table) to every finding. Tag each involved dependency using the four categories in `.agents/skills/codebase-design/DEEPENING.md` (`In-process`, `Local-substitutable`, `Remote but owned`, `True external`). Name any hard-fit rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` with its exact heading.

- [ ] **Step 4: Check that no code or convention file changed**

Run: `git status --short`
Expected: PASS. No file under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` appears in the output.

- [ ] **Step 5: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Update the Task 21 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` and link `../reports/task-21-diagnose-app-features-and-web-root.md`.
2. Create `docs/build/refactor/module-design/reports/task-21-diagnose-app-features-and-web-root.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Commands run, with exit codes and key output.
   - Export audit table for all 8 entry files (33 exports) and deletion-test table for all 10 small non-barrel files.
   - Table of all 3 type assertions, all 7 non-null assertions, and both `*Service` symbols with exact lines and proposed replacements.
   - Four deep-module diagnosis sections (Interface width, Deletion test, Locality for Scenarios A and B, Action classification and convention fit).
   - Classified finding table: `ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact`. Use IDs `FA1`, `FA2`, and so on.
   - Items that a decision table sent to the report.
   - What the commands do not prove: static inspection and symbol counts do not run local-web, attachment, or provider suites. They do not prove behavioral parity after a refactor.
3. Add a Task 21 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the four files listed in `Files` changed. Stage only those four files, commit with a conventional commit message (example: `docs(module-design): add Task 21 app features and web root diagnosis report`), and run `git push`.

**STOP** and send the Task 21 report summary with the commit hash. Do not write or start Slice 2C refactor tasks until the owner approves the finding table.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
