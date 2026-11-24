# Task 12: Check Slice 2A Exit Gate and Rescan Metrics

Read this file to run the full Slice 2A exit gate across all non-live test suites, root tool tests, checks, and quantitative metrics [[1]](#ref-1) [[2]](#ref-2).

**Goal:** Prove that Slice 2A (`packages/session/persistence/`, `packages/host/contracts/`, `packages/host/api/`) passes every build, boundary, lint, format, doc, and non-live test check with `# fail 0` and record the before/after metrics delta.

**Scope:** Read-only check over code. Write only the Task 12 report and report index entry.

## Files

- Modify: `docs/build/refactor/module-design/plan/README.md`
- Modify: `docs/build/refactor/module-design/plan/task-12-verify-slice-2a-exit.md`
- Modify: `docs/build/refactor/module-design/reports/README.md`
- Create: `docs/build/refactor/module-design/reports/task-12-verify-slice-2a-exit.md`

## Steps

- [ ] **Step 1: Run build and static quality gates**

  Run:

  ```bash
  corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 format:check && corepack pnpm@11.28.5 check:docs
  ```

  Expected: exit code `0` with 0 errors across all five commands.

- [ ] **Step 2: Run all 5 root tool test files**

  Run:

  ```bash
  node --test tests/check-boundaries.test.mjs tests/check-docs.test.mjs tests/oxlint-boundaries.test.mjs tests/post-edit-hook.test.mjs tests/scan-module-design.test.mjs
  ```

  Expected: exit code `0`, `# fail 0`, `# skipped 0`.

- [ ] **Step 3: Run all 18 non-live package test suites**

  Run each suite sequentially and record exact `# tests`, `# pass`, `# fail`, and `# skipped` counts:

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

  Expected: all 18 suites exit with code `0`, `# fail 0`, and `# skipped 0`.

  **STOP** if any suite fails or skips a test. Report the exact failing test name and error without modifying production code.

- [ ] **Step 4: Measure Slice 2A quantitative metrics delta**

  Run:

  ```bash
  node -e "const cp=require('node:child_process'); const data=JSON.parse(cp.execSync('node scripts/scan-module-design.mjs --json',{encoding:'utf8'})); const slice=['packages/host/contracts/','packages/host/api/','packages/session/persistence/']; const rows=slice.map(id=>{ const a=data.areas.find(x=>x.area===id); return {area:id,files:a.fileCount,lines:a.totalLines,over400:a.filesOver400,fnOver80:a.functionsOver80,under30:a.nonBarrelFilesUnder30,assertions:a.assertionCount}; }); console.log(JSON.stringify({totals:data.totals,slice2A:rows},null,2));"
  ```

  Compare against the Phase 1 baseline:
  - `packages/host/contracts/`: baseline `7` files, `1501` lines, `1` over 400, `1` fn over 80, `0` assertions. Target: `0` over 400, `0` fn over 80, `0` assertions.
  - `packages/host/api/`: baseline `8` files, `1566` lines, `2` over 400, `4` fn over 80, `1` assertion. Target: `0` over 400, `1` fn over 80 (`receiveAttachment`), `0` assertions.
  - `packages/session/persistence/`: baseline `9` files, `1875` lines, `1` over 400, `0` fn over 80, `4` assertions. Target: `0` over 400, `0` fn over 80, `0` assertions.

  Check root export counts for all three packages:

  ```bash
  node -e "const fs=require('node:fs'); const ts=require('typescript'); for(const f of ['packages/host/contracts/src/index.ts','packages/host/api/src/index.ts','packages/session/persistence/src/index.ts']){ const sf=ts.createSourceFile(f,fs.readFileSync(f,'utf8'),ts.ScriptTarget.Latest,true); let n=0; for(const s of sf.statements){ if(ts.isExportDeclaration(s)&&s.exportClause&&ts.isNamedExports(s.exportClause)) n+=s.exportClause.elements.length; else if(ts.canHaveModifiers(s)&&ts.getModifiers(s)?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)) n++; } console.log(f,n); }"
  ```

  Expected: `packages/host/contracts/src/index.ts` dropped from `65`, `packages/host/api/src/index.ts` is `22` (down from `56`), and `packages/session/persistence/src/index.ts` dropped from `32`.

- [ ] **Step 5: Mark task done, write the Slice 2A exit report, and commit and push**

  1. Mark Steps 1 to 4 as `- [x]` in this file. Update the Task 12 row in `docs/build/refactor/module-design/plan/README.md` from `Pending` to `Done` with a link to `../reports/task-12-verify-slice-2a-exit.md`.
  2. Create `docs/build/refactor/module-design/reports/task-12-verify-slice-2a-exit.md` with:
     - One-sentence purpose line after H1 (`Read this file to ...`).
     - Table of all 5 quality checks and 5 root tool test files with exit codes and counts.
     - Table of all 18 non-live suites with exact `# tests`, `# pass`, `# fail`, and `# skipped`.
     - Before and after Slice 2A metrics table (files, lines, over 400, fn over 80, assertions, root exports).
     - Statement that the Slice 2A exit gate passed and Slice 2B (`packages/presentation/deck/`) diagnosis is ready for Revision 3.
  3. Add Task 12 to `docs/build/refactor/module-design/reports/README.md` and run `corepack pnpm@11.28.5 check:docs`. Expected: exit code `0` with `0 error(s)`.
  4. Mark Step 5 as `- [x]` in this file.
  5. Stage only the files listed in `Files`, commit with a conventional commit message (example: `docs(refactor): record Slice 2A exit gate report`), and run `git push`.

  **STOP** and send the Task 12 report with the commit hash. Do not start Slice 2B until the owner approves the Slice 2A exit report.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](README.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
