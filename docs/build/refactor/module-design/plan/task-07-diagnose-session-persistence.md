# Task 7: Diagnose session/persistence module design and host seam

Read this file to run a read-only deep-module diagnosis of `packages/session/persistence/` and its seam with `packages/host/api/`, then stop for owner approval.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `.agents/skills/codebase-design/DEEPENING.md`
- `docs/build/refactor/module-design/README.md` (lines 65-120)
- `docs/conventions/project-structure.md` (lines 91-163)
- `docs/conventions/code.md` (lines 1-114)
- `packages/session/persistence/package.json`
- `packages/session/persistence/src/index.ts` (364 lines)
- `packages/session/persistence/src/contracts.ts` (191 lines)
- `packages/session/persistence/src/requests.ts` (579 lines)
- `packages/session/persistence/src/attachments.ts` (213 lines)
- `packages/session/persistence/src/schema.ts` (160 lines)
- `packages/session/persistence/src/message.ts` (142 lines)
- `packages/session/persistence/src/approvals.ts` (122 lines)
- `packages/session/persistence/src/draft-store.ts` (56 lines)
- `packages/session/persistence/src/request-store.ts` (48 lines)
- `packages/session/persistence/tests/chat-persistence.test.mjs` (161 lines)
- `packages/session/persistence/tests/session-persistence.test.mjs` (222 lines)
- `packages/host/api/src/request-controller.ts` (405 lines, seam caller reference only)
- `packages/host/api/src/contracts.ts` (225 lines, seam caller reference only)
- `packages/host/contracts/src/requests.ts` (145 lines, type duplication comparison only)

**Files:**

- Change: this task file, for completion checkboxes only. This is a read-only diagnosis task.

**Interfaces:**

- Uses: `packages/session/persistence/src/*.ts` (9 files, 1,875 lines, 32 root exports, 4 non-`as const` type assertions in `requests.ts`), seam references in `packages/host/api/src/` and `packages/host/contracts/src/requests.ts`, and `scripts/scan-module-design.mjs`.
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

Apply this table in top-to-bottom order to every finding in `packages/session/persistence/` and its seam with `packages/host/api/`:

| Signal | Action |
| --- | --- |
| A non-barrel file under 30 lines, thin wrapper, or re-export pass-through lowers caller complexity when merged or deleted | Propose `focused refactor (merge or delete)` with exact file, lines, and caller impact |
| A file over 400 lines or a function over 80 lines mixes distinct responsibilities or leaks internal or test-only exports beyond its authority | Propose `focused refactor (split responsibility or narrow export surface)` with exact file, lines, and seam |
| A non-`as const` type assertion exists inside a touched Slice 2A file without a documented boundary guard | Propose `focused refactor (replace type assertion with boundary guard)` with exact file and line |
| A rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` forces a shallow wrapper, duplicated contract, or awkward ownership | Propose `convention update` naming the exact document path, section heading, and concrete friction |
| A file, type, or seam protects a real invariant or two-adapter boundary, and moving it raises caller complexity | Propose `no action` with file-and-line rationale |
| No row matches | Add the item to the report. Do not change it. |

- [x] **Step 1: Measure live file counts, export counts, and workspace importers**

Run:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); const out=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const files=out.files.filter(f=>f.area==='packages/session/persistence/').map(f=>({path:f.path,lines:f.lines,exports:f.exportCount,longFn:f.longFunctions,assertions:f.typeAssertions})); const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('packages/session/persistence/')); const importers=all.filter(f=>fs.readFileSync(f,'utf8').includes('@deckagent/session-persistence')); console.log(JSON.stringify({fileCount:files.length,totalLines:files.reduce((n,f)=>n+f.lines,0),assertionCount:files.reduce((n,f)=>n+f.assertions.length,0),files,importerCount:importers.length,importers},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"fileCount": 9`, `"totalLines": 1875`, and `"assertionCount": 4` (all 4 inside `packages/session/persistence/src/requests.ts`).

- [x] **Step 2: Audit root exports, internal structure, type assertions, and seam contracts**

Read all 9 files in `packages/session/persistence/src/`, `packages/session/persistence/package.json`, both test files in `packages/session/persistence/tests/`, and the three seam reference files (`packages/host/api/src/request-controller.ts`, `packages/host/api/src/contracts.ts`, `packages/host/contracts/src/requests.ts`).
Run a read-only symbol usage check over all importers of `@deckagent/session-persistence` found in Step 1:

```bash
node -e "const fs=require('node:fs'); const {execFileSync}=require('node:child_process'); const idx=fs.readFileSync('packages/session/persistence/src/index.ts','utf8'); const reExports=[...idx.matchAll(/export(?:\s+type)?\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(s=>s.trim().split(/\s+as\s+/).pop()).filter(Boolean)); const direct=[...idx.matchAll(/^export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_]+)/gm)].map(m=>m[1]); const names=[...new Set([...reExports,...direct])]; const all=execFileSync('git',['ls-files','apps','packages','e2e','tests'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(ts|tsx|mjs|js)$/.test(f)&&!f.startsWith('packages/session/persistence/')); const usage={}; for(const n of names) usage[n]={hostApi:0,webProd:0,tests:0}; for(const f of all){const s=fs.readFileSync(f,'utf8'); if(!s.includes('@deckagent/session-persistence')) continue; const bucket=f.startsWith('packages/host/api/src/')?'hostApi':f.startsWith('apps/web/src/')?'webProd':'tests'; for(const n of names){if(new RegExp('\\b'+n+'\\b').test(s)) usage[n][bucket]++;}} console.log(JSON.stringify({exportCount:names.length,testOnlyExports:Object.entries(usage).filter(([,u])=>u.hostApi+u.webProd===0&&u.tests>0).map(([k])=>k),zeroUsageExports:Object.entries(usage).filter(([,u])=>u.hostApi+u.webProd+u.tests===0).map(([k])=>k),usage},null,2));"
```

Expected: PASS. The command exits with code 0 and prints `"exportCount": 32` with per-bucket usage counts for every root export.

Record exact file-and-line observations for:
1. Export surface of `packages/session/persistence/src/index.ts` (32 exports, 364 lines): classify production contracts and test-only exports (`testOnlyExports`). Check whether exporting concrete sub-stores (`RequestLog`, `AttachmentLog`) and internal helpers (`validateEvent`, `summarizedNotice`, `chatTitle`) exposes internal seams.
2. Cohesion of `packages/session/persistence/src/requests.ts` (579 lines) versus `index.ts` (364 lines), `attachments.ts` (213 lines), `approvals.ts` (122 lines), `message.ts` (142 lines), and `schema.ts` (160 lines). Explain why `host/api/src/{contracts,index,request-controller}.ts <-> session/persistence/src/index.ts` co-changed 7 to 8 times and `index.ts <-> schema.ts` co-changed 7 times.
3. Exact boundary guards for all 4 non-`as const` type assertions in `packages/session/persistence/src/requests.ts`:
   - line 44: `value.status as RequestStatus`
   - line 56: `value.status as ActivityStatus`
   - line 516: `JSON.parse(String(row.payload)) as ResearchSource`
   - line 562: `String(row.status) as RequestStatus`
   Record what happens on corrupt or unexpected database rows or input values at each line.
4. `RequestStore` seam in `packages/session/persistence/src/request-store.ts` (48 lines). List every production and test adapter that implements `RequestStore`. Check whether optional `approvals?` forces defensive branching in `packages/host/api/src/request-controller.ts`, and state whether `RequestStore` is a real two-adapter seam.
5. `MemoryDraftStore` in `packages/session/persistence/src/draft-store.ts` (56 lines): list every caller of `MemoryDraftStore` and `draftLimit`. Check whether an in-memory volatile draft store fits `session/persistence/` ownership in `docs/conventions/project-structure.md` or exposes an ownership tension.
6. Contract duplication across the Host seam: compare overlapping types in `packages/session/persistence/src/contracts.ts` (191 lines), `packages/host/contracts/src/requests.ts` (145 lines), and `packages/host/api/src/contracts.ts` (225 lines), such as `ApprovalView`, `ModelSelection`, `RequestEvent`, `RequestEventBody`, `RequestStatus`, `ActivityStatus`, and `TerminalStatus`. Record exact line numbers for each duplicate declaration and check whether `docs/conventions/project-structure.md` dependency rules force or justify the duplication.

- [x] **Step 3: Answer the four deep-module diagnosis questions and classify every finding**

Produce structured answers backed by exact file paths and line numbers:
1. **Interface width:** State the count of exported symbols, exposed properties (`.requests`, `.attachments`), and concepts callers must know to use `@deckagent/session-persistence`. List every test-only export, leaked internal helper, or duplicated seam contract.
2. **Deletion test:** List every file, class, helper, or duplicate type tested for deletion or internalization, with the exact effect on caller complexity.
3. **Locality:** Walk through two fixed change scenarios and count every file in `packages/session/persistence/` (and its seam in `packages/host/api/`) that changes together, with line ranges:
   - **Scenario A:** Add one new event variant to `RequestEventBody` and store it in SQLite.
   - **Scenario B:** Add one new persisted column or state transition to a request or approval record.
4. **Action classification and convention fit:** Apply the [Finding classification decision table](#finding-classification-decision-table) to every finding. Tag each involved dependency using the four categories in `.agents/skills/codebase-design/DEEPENING.md` (`In-process`, `Local-substitutable`, `Remote but owned`, `True external`). List any hard-fit rule in `docs/conventions/project-structure.md` or `docs/conventions/code.md` with its exact heading.

- [x] **Step 4: Check that no repository file changed outside task checkboxes**

Run: `git status --short`
Expected: PASS. No tracked file under `packages/`, `apps/`, `e2e/`, `tests/`, or `docs/conventions/` shows new changes from this task.

- [x] **Step 5: Report and stop**

Send this report and STOP for owner approval before writing Revision 2b refactor tasks:
- Files changed: `docs/build/refactor/module-design/plan/task-07-diagnose-session-persistence.md` (checkboxes only)
- Commands run, with exit codes and the last 20 lines of output of each command
- Export audit table for `@deckagent/session-persistence` (32 exports): production exports, test-only exports, and leaked internals
- Table of all 4 type assertions in `packages/session/persistence/src/requests.ts` with exact line numbers and proposed boundary guards
- Contract duplication table comparing `packages/session/persistence/src/contracts.ts`, `packages/host/contracts/src/requests.ts`, and `packages/host/api/src/contracts.ts`
- Four deep-module diagnosis sections (Interface width, Deletion test, Locality for Scenarios A and B, Action classification and convention fit)
- Classified finding table: `ID | Location (file:line) | Signal | Dependency category | Proposed action | Caller impact`
- Items that a decision table sent to the report
- What the commands do not prove: static inspection and symbol counts do not execute SQLite runtime tests or prove behavioral equivalence after a refactor
