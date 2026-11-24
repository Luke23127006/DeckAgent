# Module Design Refactor Implementation Plan

Read this file to learn the goal, decisions, global constraints, and task order for Phase 1 of the module design refactor.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Measure all 14 production areas and all test files, then record the approved triage and AST baseline. Fix the pre-existing timeout failure in `portable-generation-http.test.mjs` so every non-live suite passes with `# fail 0`.

**Approach:** Revision 1 built the AST scanner (Task 1), ran the scan (Task 2), and diagnosed `#60 REQUEST_TIMEOUT` (Task 3). Revision 1b records the owner-approved triage and AST baseline (Task 4). Task 5 raises the fixture timeout, hardens scanner unit tests, and checks all non-live suites for Phase 1 exit.

**Tech stack:** Windows, Node.js 22.19.0, pnpm 11.28.5 (`corepack pnpm@11.28.5`), TypeScript 6.0.3, oxlint 1.94.0, Biome 2.5.15, and `node:test`.

**Spec:** Phase scope, baseline signals, and gates come from Module Design Refactor [[1]](#ref-1). Ownership and implementation rules come from Project Structure [[2]](#ref-2), Coding Guidelines [[3]](#ref-3), and Testware [[4]](#ref-4).

## Decisions

| Topic | Decision |
| --- | --- |
| Workstream and revision | This folder owns `refactor/module-design`. Revisions 1 and 1b complete Phase 1 scan, triage, timeout fix, and exit checks [[1]](#ref-1). |
| Scanner script | Place the static scanner at `scripts/scan-module-design.mjs` and its unit tests at `tests/scan-module-design.test.mjs`. Add `"scan:module-design": "node scripts/scan-module-design.mjs"` in `package.json`. |
| Scanner parser | Parse TypeScript and JavaScript files with the installed `typescript` compiler API (`ts.createSourceFile`), matching `scripts/check-boundaries.mjs`. Add no new npm dependency. |
| Production area scope | Scan tracked and non-ignored `.ts` and `.tsx` files under `apps/` and `packages/`, excluding `lib/`, `tests/`, and `node_modules/`. Group files into the 14 areas listed in Module Design Refactor [[1]](#ref-1). |
| Quantitative thresholds | Flag production files over 400 lines, functions over 80 lines, non-barrel files under 30 lines, non-`as const` type assertions, and `*Service` declarations. Collect `git log` co-change pairs with at least 3 shared commits across the last 200 non-merge commits, skipping commits over 20 production files. |
| Testware scan scope | Scan tracked `.test.mjs` and `.test.ts` files across `apps/`, `packages/`, `e2e/`, and `tests/`. Report counts per root, files missing a top comment header, files calling `setTimeout(`, and importers of `scripts/lib/`. |
| Triage approval gate | Task 2 proposes a Tier 1, Tier 2, or Skip label for every area and stops. Do not edit `docs/build/refactor/module-design/README.md` until the owner approves the table. |
| Timeout diagnosis first | Task 3 measures isolated and suite timings for `e2e/portable-generation-http.test.mjs` and classifies the root cause before any fix. Revision 1b applies the approved fix and checks `# fail 0` across all non-live suites. |
| Approved 14-area triage | Approve 8 Tier 1 areas, 5 Tier 2 areas (`filesystem/`, `html/`, `design/`, `registry/`, `document/`), and 1 Skip area (`pptx/`). Record the AST baseline (32 type assertions, 21 non-barrel files under 30 lines, 68 test files) in `docs/build/refactor/module-design/README.md`. |
| Timeout fix scope | Set `openCode: { timeoutMs: 120000 }` inside `e2e/portable-generation-http.test.mjs`. Keep the `30000` ms default in `apps/web/tests/fixtures/b02-helpers.mjs`. Defer browser reuse evaluation in `apps/web/src/integrations/rendering/artifact-renderer.ts` to Phase 2 Slice 2C. |
| Scanner test hardening | Close the four coverage gaps from the Task 1 report inside `tests/scan-module-design.test.mjs`. Keep `scripts/scan-module-design.mjs` unchanged. |
| Phase 2 slice order | Keep Inside-Out order: run Slice 2A (`packages/host/` and `packages/session/persistence/`) before Slice 2B (`packages/presentation/deck/`) [[1]](#ref-1). |

## Global Constraints

- Run commands from the repository root in Git Bash on Windows.
- Use Node.js 22.19.0 and `corepack pnpm@11.28.5`. Do not install another runtime or package manager version.
- On Windows, run `build`, `test:attachments`, or `test:model-requests` outside the sandbox only when `EPERM` or `EBUSY` blocks them.
- Preserve existing working-tree changes. Never reset, clean, or overwrite unrelated files.
- Do not commit, push, publish, or call a live external provider.
- Do not run live suites (`test:research-live`, `test:opencode-live`).
- Do not read real user data, credentials, or `.env` values.
- Do not change product behavior, database schemas, wire payloads, or deferred features.
- Do not add a new external npm package or edit lockfiles.
- Keep package imports strictly through `package.json` `exports` [[2]](#ref-2).
- Do not add `any`, lint-disable directives, `@ts-expect-error`, `@ts-ignore`, or `@ts-nocheck` [[3]](#ref-3).
- Write code comments only for the five allowed reasons in Coding Guidelines [[3]](#ref-3). Write required file headers on every new test file [[4]](#ref-4).
- Keep test inputs and expected values as independent literals, not imports of production constants [[4]](#ref-4).
- Do not delete, skip, or weaken any test or check.
- Write all plan text and script error messages in English following `asd-ste100` structural rules.
- Change only the files listed in the active task `Files` block.
- Stop when command output differs from `Expected` or when a file differs from the task description.
- Stop when a step requires an unrecorded decision or fails two times.

## Review Focus

1. `classifyArea` maps all 14 production areas accurately and excludes `lib/`, `tests/`, `e2e/`, and `scripts/`. Test: [Task 1](task-01-quantitative-scan-script.md).
2. `analyzeSourceFile` counts non-`as const` type assertions (`as Type` and `<Type>expr`) while ignoring `as const`, comments, and string literals. Test: [Task 1](task-01-quantitative-scan-script.md).
3. `analyzeSourceFile` separates re-export-only barrel files under 30 lines from real non-barrel small files under 30 lines. Test: [Task 1](task-01-quantitative-scan-script.md).
4. `computeCoChangePairs` drops bulk commits over 20 production files so structural moves do not pollute co-change clusters. Test: [Task 1](task-01-quantitative-scan-script.md).
5. `portable-generation-http.test.mjs` timeout diagnosis distinguishes 30-second fixture budget exhaustion from a renderer hang or process leak before changing code. Check: [Task 3](task-03-investigate-timeout-failure.md).
6. Approved 14-area tiers and AST baseline counts in `docs/build/refactor/module-design/README.md` match the Task 2 report and owner decisions. Check: [Task 4](task-04-record-phase1-triage-and-baseline.md).
7. `e2e/portable-generation-http.test.mjs` passes with `openCode: { timeoutMs: 120000 }`, while `apps/web/tests/fixtures/b02-helpers.mjs` keeps its `30000` ms default. Test: [Task 5](task-05-fix-timeout-and-verify-phase1-exit.md).
8. All 18 non-live package test suites and all 5 root tool test files pass with `# fail 0` and 0 skips. Test: [Task 5](task-05-fix-timeout-and-verify-phase1-exit.md).

## Tasks

| Task | Status | File |
| --- | --- | --- |
| 1 | Done | [Build quantitative module-design scanner and unit tests](task-01-quantitative-scan-script.md) ([report](../reports/task-01-quantitative-scan-script.md)) |
| 2 | Done | [Run quantitative scan and draft 14-area triage table](task-02-run-scan-and-triage.md) ([report](../reports/task-02-scan-and-triage.md)) |
| 3 | Done | [Investigate portable-generation-http REQUEST_TIMEOUT baseline failure](task-03-investigate-timeout-failure.md) ([report](../reports/task-03-investigate-timeout-failure.md)) |
| 4 | Done | [Record approved 14-area triage and AST baseline](task-04-record-phase1-triage-and-baseline.md) ([report](../reports/task-04-record-phase1-triage-and-baseline.md)) |
| 5 | Pending | [Fix portable-generation-http timeout, harden scanner tests, and check Phase 1 exit gate](task-05-fix-timeout-and-verify-phase1-exit.md) |

## Next revision

- Revisions 2 to 5 (after Task 5 passes the Phase 1 exit gate): execute Phase 2 Inside-Out slices in approved order. Start with Slice 2A diagnosis (`packages/host/`, `packages/session/persistence/`), then Slice 2B (`packages/presentation/deck/`), Slice 2C (`apps/web/src/features/`, `integrations/`, `index.ts`), and Slice 2D (`apps/web/src/browser/`).

## References

1. <a id="ref-1"></a>[Module Design Refactor](../README.md)
2. <a id="ref-2"></a>[Project Structure](../../../../conventions/project-structure.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../../../conventions/code.md)
4. <a id="ref-4"></a>[Testware](../../../../conventions/testware.md)
