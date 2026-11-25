# Task 32: Diagnose non-deck browser UI features

Read this file to run a read-only deep-module diagnosis of the six non-deck folders in `apps/web/src/browser/features/`, then stop for owner approval [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/codebase-design/DEEPENING.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `docs/build/refactor/module-design/README.md` (lines 65-120)
- `docs/conventions/project-structure.md` (lines 78-164)
- `docs/conventions/code.md` (lines 1-114)
- `apps/web/src/browser/features/attachments/index.ts` (1 line), `attachment-view.ts` (78 lines)
- `apps/web/src/browser/features/chats/index.ts` (1 line), `conversation-view.ts` (519 lines), `message-content.ts` (104 lines)
- `apps/web/src/browser/features/providers/index.ts` (2 lines), `model-picker.ts` (172 lines), `settings-panel.ts` (604 lines)
- `apps/web/src/browser/features/requests/index.ts` (1 line), `request-feedback.ts` (279 lines)
- `apps/web/src/browser/features/research/index.ts` (1 line), `research-view.ts` (158 lines)
- `apps/web/src/browser/features/workspaces/index.ts` (1 line), `workspace-view.ts` (285 lines)
- `apps/web/src/browser/boot.ts` (seam reference only, lines 25-42, 106-140, 195-215, 725-785, and 885-970)
- `apps/web/tests/web-management.test.mjs`
- `e2e/browser-smoke.test.mjs`
- `e2e/local-web.test.mjs`

**Files:**

- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-32-diagnose-browser-non-deck-features.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-32-diagnose-browser-non-deck-features.md`

**Interfaces:**

- Uses: 14 files across six non-deck `apps/web/src/browser/features/` folders (`attachments`, `chats`, `providers`, `requests`, `research`, `workspaces`) totaling 2,206 lines. The scope holds 2 files over 400 lines, 5 functions over 80 lines, and 9 barrel exports across 6 barrels. It also holds 1 type assertion, 21 non-null assertions, and 0 `*Service` symbols, and uses `scripts/scan-module-design.mjs`.
- Produces: a file-and-line deep-module diagnosis report in `docs/build/refactor/module-design/reports/task-32-diagnose-browser-non-deck-features.md` with export audit, assertion audit, long-function split map, and classified finding table, then stops for owner approval.

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

Apply this table in top-to-bottom order to every finding across the six non-deck browser feature folders:

| Signal | Action |
| --- | --- |
| A thin wrapper, dead export, or pass-through re-export lowers caller complexity when folded or removed | Propose `focused refactor (merge or remove)` with exact file, lines, and caller impact |
| A file over 400 lines or a function over 80 lines mixes distinct responsibilities or leaks internal or test-only exports beyond its authority | Propose `focused refactor (split responsibility or narrow export surface)` with exact file, lines, and seam |
| A non-`as const` type assertion or non-null assertion (`!`) exists in a touched Slice 2D file | Propose `focused refactor (add boundary guard)` with exact file and line |
| A rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` forces a shallow wrapper or awkward ownership | Propose `convention update` naming the exact document path, section heading, and concrete friction |
| A file, type, or seam protects a real UI invariant or feature boundary, and moving it raises caller complexity | Propose `no action` with file-and-line rationale |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 1: Measure live file metrics, long functions, and assertions**

Run:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.path.startsWith('apps/web/src/browser/features/')&&!f.path.startsWith('apps/web/src/browser/features/deck/')).map(f=>{const src=fs.readFileSync(f.path,'utf8'); const sf=ts.createSourceFile(f.path,src,ts.ScriptTarget.Latest,true); const nonNullLines=[]; const visit=n=>{if(ts.isNonNullExpression(n)) nonNullLines.push(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1); ts.forEachChild(n,visit);}; visit(sf); return {path:f.path,lines:f.lines,isBarrel:f.isBarrel,exports:f.exportCount,longFn:f.longFunctions,assertions:f.typeAssertions,services:f.serviceSymbols,nonNullLines};}); console.log(JSON.stringify({fileCount:files.length,totalLines:files.reduce((n,f)=>n+f.lines,0),over400Count:files.filter(f=>f.lines>400).length,longFnTotal:files.reduce((n,f)=>n+f.longFn.length,0),assertionTotal:files.reduce((n,f)=>n+f.assertions.length,0),nonNullTotal:files.reduce((n,f)=>n+f.nonNullLines.length,0),serviceTotal:files.reduce((n,f)=>n+f.services.length,0),files},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"fileCount": 14`, `"totalLines": 2206`, `"over400Count": 2`, `"longFnTotal": 5`, `"assertionTotal": 1`, `"nonNullTotal": 21`, and `"serviceTotal": 0`.

- [x] **Step 2: Audit all 9 barrel exports across 6 barrels and inspect every file in scope**

Run:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); function namesOf(p){const s=fs.readFileSync(p,'utf8'); const re=[...s.matchAll(/export(?:\s+type)?\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(x=>x.trim().split(/\s+as\s+/).pop()).filter(Boolean)); const dir=[...s.matchAll(/^export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_]+)/gm)].map(m=>m[1]); return [...new Set([...re,...dir])];} const barrels=['apps/web/src/browser/features/attachments/index.ts','apps/web/src/browser/features/chats/index.ts','apps/web/src/browser/features/providers/index.ts','apps/web/src/browser/features/requests/index.ts','apps/web/src/browser/features/research/index.ts','apps/web/src/browser/features/workspaces/index.ts']; const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)); const summary=barrels.map(b=>{const dir=b.slice(0,b.lastIndexOf('/')+1); const names=namesOf(b); const ext=all.filter(f=>!f.startsWith(dir)); const counts=Object.fromEntries(names.map(n=>[n,{prod:0,tests:0}])); for(const f of ext){const txt=fs.readFileSync(f,'utf8'); const bucket=f.startsWith('apps/web/src/')||(f.startsWith('packages/')&&!f.includes('/tests/'))?'prod':'tests'; for(const n of names){if(new RegExp('(?<![A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(txt)) counts[n][bucket]++;}} return {barrel:b,exportCount:names.length,counts};}); console.log(JSON.stringify({barrelCount:summary.length,totalBarrelExports:summary.reduce((n,s)=>n+s.exportCount,0),summary},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"barrelCount": 6` and `"totalBarrelExports": 9` with production and test usage counts for every exported symbol.

Read all 14 files in scope, the seam reference lines in `apps/web/src/browser/boot.ts`, and the 3 listed test files.
Record exact file-and-line observations for:
1. `apps/web/src/browser/features/providers/settings-panel.ts` (604 lines, `settingsPanel` lines 6-604, 599 lines) and `model-picker.ts` (172 lines, `modelPicker` lines 5-172, 168 lines): inspect both files. Separate modal shell, provider connection CRUD, key testing, model discovery, and research settings tabs inside `settings-panel.ts`. Record guards for the 5 `!` assertions in `settings-panel.ts` (lines 251, 538, 539, 577, 579). Record guards for the 1 `as` (line 129) and 1 `!` (line 156) in `model-picker.ts`. Propose exact internal modules under `browser/features/providers/` under 400 lines and 80 lines per function.
2. `apps/web/src/browser/features/chats/conversation-view.ts` (519 lines, `ConversationView.updateRequest` lines 266-358, 93 lines) and `message-content.ts` (104 lines): map message history rendering, live streaming updates, approval cards, tool activity views, and attachment badges inside `conversation-view.ts`. Record guards for the 2 `!` assertions in `conversation-view.ts` (lines 486, 516). Record guards for all 12 `!` assertions in `message-content.ts` (lines 45, 51, 55, 55, 56, 56, 69, 70, 78, 82, 84, 94). Propose exact internal splits under 400 lines and 80 lines per function.
3. `apps/web/src/browser/features/workspaces/workspace-view.ts` (285 lines, `workspaceView` lines 67-285, 219 lines): inspect workspace creation, folder binding, chat assignment, and dialog state. Check why the file exports 4 symbols while its barrel exports only `workspaceView`. Record a guard for the non-null assertion at line 80 and propose helper splits under 80 lines.
4. `apps/web/src/browser/features/research/research-view.ts` (158 lines, `researchView` lines 15-158, 144 lines): inspect web-search mode toggles, receipt inspection, and dialog helpers. Propose helper splits under 80 lines.
5. `apps/web/src/browser/features/requests/request-feedback.ts` (279 lines) and `apps/web/src/browser/features/attachments/attachment-view.ts` (78 lines): inspect error-message tables, `failureFeedback`, `offersSettings`, `requestFeedback`, and draft attachment badges. Check whether any internal export (`attachment-view.ts` exports 2 symbols while its barrel exports 1) has zero callers or repeats another symbol.

- [x] **Step 3: Answer the four deep-module diagnosis questions and classify every finding**

Produce structured answers backed by exact file paths and line numbers:
1. **Interface width:** State the count of barrel exports (`9`) across the 6 feature folders, plus the count of internal file exports that never leave their folder (`workspace-view.ts`, `attachment-view.ts`). Note cross-feature browser dependencies (`conversation-view.ts` importing `requests/`, `settings-panel.ts` importing `research/` or `workspaces/`, if any).
2. **Deletion test:** Test every unused internal export, repeated modal/dialog boilerplate across `settings-panel.ts`, `workspace-view.ts`, and `research-view.ts`, and any pass-through wrapper between the six features and `boot.ts`. State the exact effect of removing or folding each item.
3. **Locality:** Walk through two fixed change scenarios and count every file in scope that changes together, with line ranges:
   - **Scenario A:** Add one new provider connection field (for example, custom headers toggle) in settings and check it before saving.
   - **Scenario B:** Add one new request failure code with Vietnamese user copy and a button that opens the Settings panel.
4. **Action classification and convention fit:** Apply the [Finding classification decision table](#finding-classification-decision-table) to every finding. Tag each involved dependency using the four categories in `.agents/skills/codebase-design/DEEPENING.md` (`In-process`, `Local-substitutable`, `Remote but owned`, `True external`). Name any hard-fit rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` with its exact heading.

- [x] **Step 4: Check that no code or convention file changed**

Run: `git status --short`
Expected: PASS. No file under `packages/`, `apps/`, `e2e/`, `tests/`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md` appears in the output.

- [x] **Step 5: Mark task done, write the report file, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Update the Task 32 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` and link `../reports/task-32-diagnose-browser-non-deck-features.md`.
2. Create `docs/build/refactor/module-design/reports/task-32-diagnose-browser-non-deck-features.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Commands run, with exit codes and key output.
   - Export audit table for all 6 feature barrels (9 exports) and internal non-barrel exports.
   - Table of the 1 type assertion and all 21 non-null assertions with exact lines and proposed guards.
   - Split map for all 5 functions over 80 lines across `settings-panel.ts`, `conversation-view.ts`, `workspace-view.ts`, `model-picker.ts`, and `research-view.ts`.
   - Four deep-module diagnosis sections (Interface width, Deletion test, Locality for Scenarios A and B, Action classification and convention fit).
   - Classified finding table: `ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact`. Use IDs `BF1`, `BF2`, and so on.
   - Items that a decision table sent to the report.
   - What the commands do not prove: static inspection and symbol counts do not run web-management, local-web, or browser-smoke suites. They do not prove behavioral parity after a refactor.
3. Add a Task 32 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the four files listed in `Files` changed. Stage only those four files, commit with a conventional commit message (example: `docs(module-design): add Task 32 non-deck browser features diagnosis report`), and run `git push`.

**STOP** and send the Task 32 report summary with the commit hash. Do not write or start Slice 2D refactor tasks until the owner approves the finding table.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
