# Task 29: Check Slice 2C exit gate and rescan metrics

Read this file to run quality checks, root tool tests, all 18 non-live suites, and Slice 2C metrics before stopping [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `package.json` (lines 1-45)

**Files:**

- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-29-verify-slice-2c-exit.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-29-verify-slice-2c-exit.md`

**Interfaces:**

- Uses: all 5 quality scripts, all 5 root tool test files, all 18 non-live test suites in `package.json`, and `scripts/scan-module-design.mjs`.
- Produces: Slice 2C exit gate report in `docs/build/refactor/module-design/reports/task-29-verify-slice-2c-exit.md` proving zero regressions and full metric achievement across `features/`, `integrations/`, and `apps/web/src/` root.

**STOP when:**

- Any quality check, root tool test, or non-live suite fails or skips a test (except pre-existing Windows `CRLF` diffs outside Slice 2C in repo-wide `format:check`).
- Any Slice 2C metric fails its target.
- `git status --short` shows any modification outside the four files in `Files`.
- The same step failed two times.

**Forbidden:**

- Change any production code, test file, `package.json`, or `docs/conventions/`.
- Delete, skip, or weaken any test or check.
- Run live suites (`test:research-live`, `test:opencode-live`).
- Commit or push before Step 5 checks pass.

- [ ] **Step 1: Run all five static quality checks**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:docs
```

Expected: PASS. All four commands exit with code `0`, `0 violation(s)`, `0 warnings and 0 errors`, and `0 error(s) in 0 file(s)`.

Run Biome check on all Slice 2C paths:

```bash
npx biome format apps/web/src/features/ apps/web/src/integrations/ apps/web/src/index.ts apps/web/src/local-transport.ts apps/web/src/cli.ts apps/web/src/web-state.ts apps/web/src/ui-assets.ts apps/web/tests/image-research.test.mjs e2e/artifact-rendering.test.mjs
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

- [ ] **Step 4: Measure Slice 2C before and after metrics**

Run:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const data=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const areas=['apps/web/src/features/','apps/web/src/integrations/','apps/web/src/']; const summary=areas.map(name=>{const files=data.files.filter(f=>f.area===name); let nonNull=0; let revImports=0; for(const f of files){const text=fs.readFileSync(f.path,'utf8'); if(name==='apps/web/src/integrations/'&&text.includes('features/')) revImports++; const sf=ts.createSourceFile(f.path,text,ts.ScriptTarget.Latest,true); const v=n=>{if(ts.isNonNullExpression(n)) nonNull++; ts.forEachChild(n,v);}; v(sf);} return {area:name,files:files.length,lines:files.reduce((a,f)=>a+f.lines,0),over400:files.filter(f=>f.lines>400).length,longFn:files.reduce((a,f)=>a+f.longFunctions.length,0),smallNonBarrel:files.filter(f=>!f.isBarrel&&f.lines<30).map(f=>f.path),assertions:files.reduce((a,f)=>a+f.typeAssertions.length,0),nonNull,services:files.reduce((a,f)=>a+f.serviceSymbols.length,0),revImports};}); console.log(JSON.stringify(summary,null,2));"
```

Compare against the Slice 2C pre-refactor baseline:
- `apps/web/src/features/`:
  - Baseline: `28` files, `3,862` lines, `2` over 400, `11` fn over 80, `7` small non-barrel, `6` type assertions, `12` non-null assertions, `4` `*Service`.
  - Target: `0` over 400, `0` fn over 80, `1` small non-barrel (`apps/web/src/features/deck/failures.ts`, approved `FD8`), `0` type assertions, `0` non-null assertions, `0` `*Service`.
- `apps/web/src/integrations/`:
  - Baseline: `22` files, `2,526` lines, `1` over 400, `10` fn over 80, `0` small non-barrel, `4` type assertions, `10` non-null assertions, `0` `*Service`, `4` reverse imports from `features/providers/`.
  - Target: `0` over 400, `0` fn over 80, `0` small non-barrel, `0` type assertions, `0` non-null assertions, `0` `*Service`, `0` reverse imports from `features/`.
- `apps/web/src/` (root):
  - Baseline: `11` files, `1,429` lines, `1` over 400, `3` fn over 80, `4` small non-barrel, `0` type assertions, `4` non-null assertions, `0` `*Service`.
  - Target: `0` over 400, `0` fn over 80, `0` small non-barrel, `0` type assertions, `0` non-null assertions, `0` `*Service`.

- [ ] **Step 5: Mark task done, write the Slice 2C exit report, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Update the Task 29 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-29-verify-slice-2c-exit.md`.
2. Create `docs/build/refactor/module-design/reports/task-29-verify-slice-2c-exit.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Table of all 5 static quality checks and 5 root tool test files with exit codes and counts.
   - Table of all 18 non-live suites with exact `# tests`, `# pass`, `# fail`, and `# skipped`.
   - Before and after Slice 2C metrics table for `features/`, `integrations/`, and `apps/web/src/` root.
   - Statement that the Slice 2C exit gate passed and Slice 2D (`apps/web/src/browser/`) diagnosis is ready for Revision 5.
3. Add a Task 29 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the four files listed in `Files` changed. Stage only those four files, commit with a conventional commit message (example: `docs(refactor): record Slice 2C exit gate report`), and run `git push`.

**STOP** and send the Task 29 report summary with the commit hash. Do not start Slice 2D until the owner approves the Slice 2C exit report.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
