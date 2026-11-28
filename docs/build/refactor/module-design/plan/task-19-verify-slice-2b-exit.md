# Task 19: Check Slice 2B exit gate and rescan metrics

Read this file to run quality checks, tool tests, all 18 non-live suites, and Slice 2B metrics, then stop for owner approval [[1]](#ref-1) [[2]](#ref-2).

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/docs.md`
- `package.json` (lines 1-45)

**Files:**

- Change: `docs/build/refactor/module-design/plan/README.md`
- Change: `docs/build/refactor/module-design/plan/task-19-verify-slice-2b-exit.md`
- Change: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-19-verify-slice-2b-exit.md`

**Interfaces:**

- Uses: all 5 quality scripts, all 5 root tool test files, all 18 non-live test suites in `package.json`, and `scripts/scan-module-design.mjs`.
- Produces: Slice 2B exit gate report in `docs/build/refactor/module-design/reports/task-19-verify-slice-2b-exit.md` proving zero regressions and full metric target achievement.

**STOP when:**

- Any quality check, root tool test, or non-live suite fails or skips a test (except pre-existing Windows `CRLF` diffs outside Slice 2B in `format:check`).
- Any `packages/presentation/deck/` metric fails its target.
- `git status --short` shows any modification outside the four files in `Files`.
- The same step failed two times.

**Forbidden:**

- Change any production code, test file, `package.json`, or `docs/conventions/`.
- Delete, skip, or weaken any test or check.
- Run live suites (`test:research-live`, `test:opencode-live`).
- Commit or push before Step 5 checks pass.

- [x] **Step 1: Run all five static quality checks**

Run:

```bash
corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:docs
```

Expected: PASS. All four commands exit with code `0`, `0 violation(s)`, `0 warnings and 0 errors`, and `0 error(s) in 0 file(s)`.

Run Biome check on `packages/presentation/deck/src/` and `packages/host/api/src/contract-sync.ts`:

```bash
npx biome format packages/presentation/deck/src/ packages/host/api/src/contract-sync.ts
```

Expected: PASS. Exit code `0` with `0` formatting diffs (note Windows `CRLF` checkout state if repo-wide `format:check` reports untouched files).

- [x] **Step 2: Run all five root tool test files**

Run:

```bash
node --test tests/check-boundaries.test.mjs tests/check-docs.test.mjs tests/oxlint-boundaries.test.mjs tests/post-edit-hook.test.mjs tests/scan-module-design.test.mjs
```

Expected: PASS. Exit code `0`, `# fail 0`, and `# skipped 0`.

- [x] **Step 3: Run all 18 non-live package test suites**

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

- [x] **Step 4: Measure Slice 2B before and after metrics**

Run:

```bash
node -e "const fs=require('node:fs'); const ts=require('typescript'); const {execFileSync}=require('node:child_process'); const data=JSON.parse(execFileSync('node',['scripts/scan-module-design.mjs','--json'],{encoding:'utf8'})); const area=data.areas.find(x=>x.area==='packages/presentation/deck/'); const files=data.files.filter(f=>f.area==='packages/presentation/deck/'); let nonNull=0; for(const f of files){const sf=ts.createSourceFile(f.path,fs.readFileSync(f.path,'utf8'),ts.ScriptTarget.Latest,true); const v=n=>{if(ts.isNonNullExpression(n)) nonNull++; ts.forEachChild(n,v);}; v(sf);} const pkg=JSON.parse(fs.readFileSync('packages/presentation/deck/package.json','utf8')); console.log(JSON.stringify({area,nonNull,subpaths:Object.keys(pkg.exports)},null,2));"
```

Compare against the Phase 1 baseline for `packages/presentation/deck/`:
- Baseline: `12` files, `3,695` lines, `3` over 400, `11` fn over 80, `1` under 30, `2` type assertions, `21` non-null assertions, `1` `*Service`, `66` root exports, `2` package subpaths (`"."`, `"./brief"`).
- Target: `0` over 400, `0` fn over 80, `0` under 30, `0` type assertions, `0` non-null assertions, `0` `*Service`, `31` root exports, `1` package subpath (`"."`).

- [x] **Step 5: Mark task done, write the Slice 2B exit report, and commit and push**

1. Mark Steps 1 to 4 as `- [x]` in this file. Update the Task 19 row in `docs/build/refactor/module-design/plan/README.md` to `Done` and link `../reports/task-19-verify-slice-2b-exit.md`.
2. Create `docs/build/refactor/module-design/reports/task-19-verify-slice-2b-exit.md` with:
   - One-sentence purpose line after H1 (`Read this file to ...`).
   - Table of all 5 static quality checks and 5 root tool test files with exit codes and counts.
   - Table of all 18 non-live suites with exact `# tests`, `# pass`, `# fail`, and `# skipped`.
   - Before and after Slice 2B metrics table for `packages/presentation/deck/`.
   - Statement that the Slice 2B exit gate passed and Slice 2C (`apps/web/src/features/`, `integrations/`, `apps/web/src/` root) diagnosis is ready for Revision 4.
3. Add a Task 19 row to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` and `0 error(s)`.
4. Mark Step 5 as `- [x]` in this file.
5. Run `git status --short` and check that only the four files listed in `Files` changed. Stage only those four files, commit with a conventional commit message (example: `docs(refactor): record Slice 2B exit gate report`), and run `git push`.

**STOP** and send the Task 19 report summary with the commit hash. Do not start Slice 2C until the owner approves the Slice 2B exit report.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
