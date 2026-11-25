# Task 39: Check Slice 2D and Phase 2 exit gate and rescan metrics

Read this file to run quality checks, root tool tests, all 18 non-live suites, and Slice 2D metrics to close Phase 2 [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `package.json` (lines 1-45)

**Files:**

- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-39-verify-slice-2d-exit.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-39-verify-slice-2d-exit.md`

**Interfaces:**

- Uses: all 5 quality scripts, all 5 root tool test files, all 18 non-live test suites in `package.json`, and `scripts/scan-module-design.mjs`.
- Produces: Slice 2D and Phase 2 exit gate report in `docs/build/refactor/module-design/reports/task-39-verify-slice-2d-exit.md` proving zero regressions and full metric achievement across `apps/web/src/browser/` and all eight Tier 1 areas.

**STOP when:**

- Any quality check, root tool test, or non-live suite fails or skips a test (except pre-existing Windows `CRLF` diffs outside Slice 2D in repo-wide `format:check`).
- Any Slice 2D metric fails its target.
- `git status --short` shows any modification outside the four files in `Files`.
- The same step failed two times.

**Forbidden:**

- Change any production code, test file, `package.json`, or `docs/conventions/`.
- Remove, skip, or weaken any test or check.
- Run live suites (`test:research-live`, `test:opencode-live`).
- Commit or push before Step 5 checks pass.

- [ ] **Step 1: Run all five static quality checks**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:docs
```

Expected: PASS. All four commands exit with code `0`, `0 violation(s)`, `0 warnings and 0 errors`, and `0 error(s) in 0 file(s)`.

Run Biome format check on all Slice 2D paths:

```bash
npx biome format apps/web/src/browser/ apps/web/tests/fixtures/browser-driver.mjs apps/web/tests/brief-client.test.mjs apps/web/tests/deck-model.test.mjs
```

Expected: PASS. Exit code `0` with `0` formatting diffs.

- [ ] **Step 2: Run all five root tool test files**

Run:

```bash
node --test tests/check-boundaries.test.mjs tests/check-docs.test.mjs tests/oxlint-boundaries.test.mjs tests/post-edit-hook.test.mjs tests/scan-module-design.test.mjs
```

Expected: PASS. Exit code `0`, `# fail 0`, and `# skipped 0`.

- [ ] **Step 3: Run all 18 non-live package test suites**

Run each suite (outside the sandbox on Windows only when `EPERM`, `EBUSY`, or Chromium sandbox restrictions block it):

1. `corepack pnpm@11.28.5 test:session-persistence`
2. `corepack pnpm@11.28.5 test:tools-browser`
3. `corepack pnpm@11.28.5 test:env-startup`
4. `corepack pnpm@11.28.5 test:local-web`
5. `corepack pnpm@11.28.5 test:local-foundation`
6. `corepack pnpm@11.28.5 test:model-requests`
7. `corepack pnpm@11.28.5 test:opencode-resources`
8. `corepack pnpm@11.28.5 test:source-permissions`
9. `corepack pnpm@11.28.5 test:attachments`
10. `corepack pnpm@11.28.5 test:research`
11. `corepack pnpm@11.28.5 test:brief-foundation`
12. `corepack pnpm@11.28.5 test:outline-workflow`
13. `corepack pnpm@11.28.5 test:deck-review`
14. `corepack pnpm@11.28.5 test:slide-pipeline`
15. `corepack pnpm@11.28.5 test:layouts`
16. `corepack pnpm@11.28.5 test:images`
17. `corepack pnpm@11.28.5 test:generation-publication`
18. `corepack pnpm@11.28.5 test:browser-smoke`

Expected: PASS. All 18 suites exit with code `0`, `# fail 0`, and `# skipped 0`.

- [ ] **Step 4: Measure Slice 2D and Phase 2 Tier 1 metrics**

Run:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const data=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const areas=['packages/session/persistence/','packages/host/contracts/','packages/host/api/','packages/presentation/deck/','apps/web/src/features/','apps/web/src/integrations/','apps/web/src/','apps/web/src/browser/']; const summary=areas.map(name=>{const files=data.files.filter(f=>f.area===name); let nonNull=0; for(const f of files){const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); const v=n=>{if(ts.isNonNullExpression(n)) nonNull++; ts.forEachChild(n,v);}; v(sf);} return {area:name,files:files.length,lines:files.reduce((a,f)=>a+f.lines,0),over400:files.filter(f=>f.lines>400).length,longFn:files.reduce((a,f)=>a+f.longFunctions.length,0),smallNonBarrel:files.filter(f=>!f.isBarrel&&f.lines<30).map(f=>f.path),assertions:files.reduce((a,f)=>a+f.typeAssertions.length,0),nonNull,services:files.reduce((a,f)=>a+f.serviceSymbols.length,0)};}); const transportExports=data.files.find(f=>f.path==='apps/web/src/browser/transport/index.ts')?.exportCount; const deckExports=data.files.find(f=>f.path==='apps/web/src/browser/features/deck/index.ts')?.exportCount; console.log(JSON.stringify({summary,transportExports,deckExports},null,2));"
```

Compare `apps/web/src/browser/` against the Slice 2D pre-refactor baseline:

- Baseline: `36` files, `6,762` lines, `5` over 400, `11` fn over 80, `3` small non-barrel (`dom.ts`, `layout.ts`, `image-review-client.ts`) plus `1`-line `bound-outline-decoder.ts`, `7` `as`, `32` `!`, `0` `*Service`, `15` `transport/index.ts` exports.
- Target: `0` over 400, `0` fn over 80, `1` small non-barrel (`apps/web/src/browser/dom.ts`, approved `BB10`), `0` `as`, `0` `!`, `0` `*Service`, `9` `transport/index.ts` exports, and `6` `browser/features/deck/index.ts` exports (`4` runtime values and `2` types).
- All eight Tier 1 areas across Phase 2 (`Slices 2A` to `2D`) must report `0` files over 400 lines, `0` functions over 80 lines, `0` `as`, `0` `!`, and `0` `*Service`.

- [ ] **Step 5: Mark task done, write the Slice 2D and Phase 2 exit report, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Change the Task 39 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-39-verify-slice-2d-exit.md`.
2. Create `docs/build/refactor/module-design/reports/task-39-verify-slice-2d-exit.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Table of all 5 static quality checks and 5 root tool test files with exit codes and counts.
   - Table of all 18 non-live suites with exact `# tests`, `# pass`, `# fail`, and `# skipped`.
   - Before and after Slice 2D metrics table plus the 8-area Phase 2 Tier 1 summary table.
   - Statement that Slice 2D and Phase 2 passed their exit gates and Phase 3 (`Revision 6`) is ready.
3. Add a Task 39 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the four files in `Files` changed. Stage only those four files, commit with `docs(refactor): record Slice 2D and Phase 2 exit gate report`, and run `git push`.

**STOP** and send the Task 39 report summary with the commit hash. Do not start Phase 3 until the owner approves the Slice 2D and Phase 2 exit report.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
