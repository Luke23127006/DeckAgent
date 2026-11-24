# Task 6: Diagnose host/contracts and host/api module design

Read this file to run a read-only deep-module diagnosis of `packages/host/contracts/` and `packages/host/api/` and stop for owner approval.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/codebase-design/DEEPENING.md`
- `docs/build/refactor/module-design/README.md` (lines 65-120)
- `docs/conventions/project-structure.md` (lines 91-163)
- `docs/conventions/code.md` (lines 1-114)
- `packages/host/contracts/package.json`
- `packages/host/contracts/src/index.ts` (75 lines)
- `packages/host/contracts/src/brief.ts` (113 lines)
- `packages/host/contracts/src/brief-validation.ts` (111 lines)
- `packages/host/contracts/src/deck.ts` (198 lines)
- `packages/host/contracts/src/management.ts` (93 lines)
- `packages/host/contracts/src/requests.ts` (145 lines)
- `packages/host/contracts/src/validation.ts` (766 lines)
- `packages/host/api/package.json`
- `packages/host/api/src/index.ts` (711 lines)
- `packages/host/api/src/contracts.ts` (225 lines)
- `packages/host/api/src/request-controller.ts` (405 lines)
- `packages/host/api/src/multipart.ts` (118 lines)
- `packages/host/api/src/deck-routes.ts` (45 lines)
- `packages/host/api/src/tool-contracts.ts` (44 lines)
- `packages/host/api/src/http-error.ts` (12 lines)
- `packages/host/api/src/request-failure.ts` (6 lines)
- `packages/host/api/tests/host-api.test.mjs` (165 lines)
- `packages/host/api/tests/request-failure.test.mjs` (48 lines)

**Files:**

- Change: this task file, for completion checkboxes only. This is a read-only diagnosis task.

**Interfaces:**

- Uses: `packages/host/contracts/src/*.ts` (7 files, 1,501 lines, 65 root exports), `packages/host/api/src/*.ts` (8 files, 1,566 lines, 56 root exports), and `scripts/scan-module-design.mjs`.
- Produces: a file-and-line deep-module diagnosis report and classified action table in the conversation report, then STOPs for owner approval.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task (for example, missing files or changed line counts).
- The task needs a decision that this task does not contain.
- The same step failed two times.
- `git status --short` shows any new modification outside this task file.

**Forbidden:**

- Change any file outside `Files` (do not change source code, tests, `package.json`, `docs/conventions/`, or `docs/build/refactor/module-design/README.md`).
- Delete, skip, or weaken any test or check.
- Add a comment, a lint-disable directive, or `@ts-expect-error`.
- Commit or push.

## Finding classification decision table

Apply this table in top-to-bottom order to every finding in `packages/host/contracts/` and `packages/host/api/`:

| Signal | Action |
| --- | --- |
| A non-barrel file under 30 lines, thin wrapper, or re-export pass-through lowers caller complexity when merged or deleted | Propose `focused refactor (merge or delete)` with exact file, lines, and caller impact |
| A file over 400 lines or a function over 80 lines mixes distinct responsibilities or leaks internal or pass-through exports beyond its authority | Propose `focused refactor (split responsibility or narrow export surface)` with exact file, lines, and seam |
| A non-`as const` type assertion exists inside a touched Slice 2A file without a documented boundary guard | Propose `focused refactor (replace type assertion with boundary guard)` with exact file and line |
| A rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` forces a shallow wrapper, duplicated contract, or awkward ownership | Propose `convention update` naming the exact document path, section heading, and concrete friction |
| A file, type, or seam protects a real invariant or two-adapter boundary, and moving it raises caller complexity | Propose `no action` with file-and-line rationale |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 1: Measure live file counts, export counts, and workspace importers**

Run:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const areas=['packages/host/contracts/','packages/host/api/']; const files=out.files.filter(f=>areas.includes(f.area)).map(f=>({path:f.path,lines:f.lines,exports:f.exportCount,longFn:f.longFunctions,assertions:f.typeAssertions})); const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)); const importers={contracts:[],api:[]}; for(const f of all){const s=fs.readFileSync(f,'utf8'); if(s.includes('@deckagent/host-contracts')) importers.contracts.push(f); if(s.includes('@deckagent/host-api')) importers.api.push(f);} console.log(JSON.stringify({fileCount:files.length,totalLines:files.reduce((n,f)=>n+f.lines,0),files,importerCounts:{contracts:importers.contracts.length,api:importers.api.length},importers},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"fileCount": 15` and `"totalLines": 3067` (7 files in `packages/host/contracts/` totaling 1,501 lines and 8 files in `packages/host/api/` totaling 1,566 lines).

- [x] **Step 2: Audit every file and exported symbol in `packages/host/contracts/`**

Read all 7 files in `packages/host/contracts/src/` and `packages/host/contracts/package.json`.
Run a read-only symbol usage check over all importers of `@deckagent/host-contracts` found in Step 1:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); const idx=fs.readFileSync('packages/host/contracts/src/index.ts','utf8'); const names=[...idx.matchAll(/export(?:\s+type)?\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(s=>s.trim().split(/\s+as\s+/).pop()).filter(Boolean)); const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('packages/host/contracts/')); const usage={}; for(const n of names) usage[n]={browser:0,hostApi:0,webHost:0,tests:0}; for(const f of all){const s=fs.readFileSync(f,'utf8'); if(!s.includes('@deckagent/host-contracts')) continue; const bucket=f.startsWith('apps/web/src/browser/')?'browser':f.startsWith('packages/host/api/')?'hostApi':f.startsWith('apps/web/src/')?'webHost':'tests'; for(const n of names){if(new RegExp('\\b'+n+'\\b').test(s)) usage[n][bucket]++;}} console.log(JSON.stringify({exportCount:names.length,zeroProdUsage:Object.entries(usage).filter(([,u])=>u.browser+u.hostApi+u.webHost===0).map(([k])=>k),hostApiOnly:Object.entries(usage).filter(([,u])=>u.hostApi>0&&u.browser===0&&u.webHost===0).map(([k])=>k),browserOnly:Object.entries(usage).filter(([,u])=>u.browser>0&&u.hostApi===0&&u.webHost===0).map(([k])=>k),usage},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"exportCount": 65` with per-bucket usage counts for every root export.

Record exact file-and-line observations for:
1. Exports in `packages/host/contracts/src/index.ts` that have 0 production callers or serve only `packages/host/api/`. Compare them against `docs/conventions/project-structure.md`, which restricts `host/contracts/` to browser-and-host wire contracts.
2. Internal cohesion of `packages/host/contracts/src/validation.ts` (766 lines, including `decodeBoundProposal` at line 599, 94 lines) versus `packages/host/contracts/src/brief-validation.ts` (111 lines). List every exported decoder, its internal helpers, duplicated validation logic, and caller list.
3. Re-exports from `@deckagent/presentation-document` at `packages/host/contracts/src/index.ts` (lines 1-6). Check whether downstream callers import them through `@deckagent/host-contracts` or directly from `@deckagent/presentation-document`.

- [x] **Step 3: Audit every file, export, and seam in `packages/host/api/`**

Read all 8 files in `packages/host/api/src/`, `packages/host/api/package.json`, `packages/host/api/tests/host-api.test.mjs`, and `packages/host/api/tests/request-failure.test.mjs`.
Run a read-only symbol usage check over all importers of `@deckagent/host-api` found in Step 1:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); const idx=fs.readFileSync('packages/host/api/src/index.ts','utf8'); const reExports=[...idx.matchAll(/export(?:\s+type)?\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(s=>s.trim().split(/\s+as\s+/).pop()).filter(Boolean)); const direct=[...idx.matchAll(/^export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_]+)/gm)].map(m=>m[1]); const names=[...new Set([...reExports,...direct])]; const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('packages/host/api/')); const usage={}; for(const n of names) usage[n]={webFeatures:0,webIntegrations:0,webRoot:0,tests:0}; for(const f of all){const s=fs.readFileSync(f,'utf8'); if(!s.includes('@deckagent/host-api')) continue; const bucket=f.startsWith('apps/web/src/features/')?'webFeatures':f.startsWith('apps/web/src/integrations/')?'webIntegrations':f.startsWith('apps/web/src/')?'webRoot':'tests'; for(const n of names){if(new RegExp('\\b'+n+'\\b').test(s)) usage[n][bucket]++;}} console.log(JSON.stringify({exportCount:names.length,zeroProdUsage:Object.entries(usage).filter(([,u])=>u.webFeatures+u.webIntegrations+u.webRoot===0).map(([k])=>k),usage},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"exportCount": 56` with per-bucket usage counts for every root export.

Record exact file-and-line observations for:
1. Pass-through re-exports in `packages/host/api/src/index.ts` (lines 12-65) and `packages/host/api/src/contracts.ts` (225 lines, 50 exports). List every symbol re-exported from `@deckagent/host-contracts` or `@deckagent/session-persistence`. Explain why `contracts.ts <-> index.ts` co-changed 18 times and `index.ts <-> request-controller.ts` co-changed 12 times.
2. Mixed responsibilities inside `packages/host/api/src/index.ts` (711 lines): inspect `body` (line 96, 128 lines), `startHost` (line 257, 455 lines), `route` (line 330, 349 lines), and the type assertion `value.publicResearch as boolean` (line 219). Also inspect `packages/host/api/src/multipart.ts` (`receiveAttachment`, line 7, 112 lines) and `packages/host/api/src/request-controller.ts` (405 lines).
3. Deletion test on small files: inspect `packages/host/api/src/http-error.ts` (12 lines), `packages/host/api/src/request-failure.ts` (6 lines), `packages/host/api/src/deck-routes.ts` (45 lines), and `packages/host/api/src/tool-contracts.ts` (44 lines). State whether deleting or folding each file lowers complexity or breaks a real seam.
4. Transport versus Request Lifecycle seam: check whether `packages/host/api/src/request-controller.ts` stays free of HTTP types and status codes. Check whether each management interface in `contracts.ts` (`WebManagement`, `WorkspaceManagement`, `BriefManagement`, `AttachmentManagement`, `HostOptions`) has two adapters or only one pass-through adapter.
5. Deck import in Local Host transport: inspect `import { DeckError, deckFailureMessage } from '@deckagent/deck'` at `packages/host/api/src/index.ts` (line 4) and its call sites in `index.ts` and `deck-routes.ts`. Compare with `docs/conventions/project-structure.md` (`host/api/` authority table) to check whether this is a proper transport error translation or an ownership leak.

- [x] **Step 4: Answer the four deep-module diagnosis questions and classify every finding**

Produce structured answers backed by exact file paths and line numbers:
1. **Interface width:** State the count of exported symbols, concepts, and call steps callers must know for `@deckagent/host-contracts` and `@deckagent/host-api`. Name every leaked internal symbol, unused export, or pass-through re-export.
2. **Deletion test:** List every file, class, helper, or type alias tested for deletion, with the exact effect on caller complexity.
3. **Locality:** Walk through two fixed change scenarios and count every file in `packages/host/contracts/` and `packages/host/api/` that changes together, with line ranges:
   - **Scenario A:** Add one optional boolean field to a chat request payload and check it at the transport boundary.
   - **Scenario B:** Add one new Local Host HTTP endpoint for an existing management feature.
4. **Action classification and convention fit:** Apply the [Finding classification decision table](#finding-classification-decision-table) to every finding. Tag each involved dependency using the four categories in `.agents/skills/codebase-design/DEEPENING.md` (`In-process`, `Local-substitutable`, `Remote but owned`, `True external`). List any hard-fit rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` with its exact heading.

- [x] **Step 5: Check that no repository file changed outside task checkboxes**

Run: `git status --short`
Expected: PASS. No tracked file under `packages/`, `apps/`, `e2e/`, `tests/`, or `docs/conventions/` shows new changes from this task.

- [x] **Step 6: Report and stop**

Send this report and STOP for owner approval before writing Revision 2b refactor tasks:
- Files changed: `docs/build/refactor/module-design/plan/task-06-diagnose-host-contracts-and-api.md` (checkboxes only)
- Commands run, with exit codes and the last 20 lines of output of each command
- Export audit tables for `@deckagent/host-contracts` (65 exports) and `@deckagent/host-api` (56 exports): unused exports, pass-through re-exports, and single-consumer exports
- Four deep-module diagnosis sections (Interface width, Deletion test, Locality for Scenarios A and B, Action classification and convention fit)
- Classified finding table: `ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact`
- Items that a decision table sent to the report
- What the commands do not prove: static inspection and symbol counts do not execute runtime tests or prove behavioral equivalence after a refactor
