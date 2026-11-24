# Module Design Refactor Implementation Plan

Read this file to learn the goal, decisions, global constraints, and task order for Phase 1 and Phase 2 Slice 2A diagnosis.

> **For executors:** Do one task at a time, in the order of the [Tasks](#tasks) table. Read Global Constraints in this file and your task file only. Do every step in order. When you complete a step, change its `- [ ]` to `- [x]` in the task file. When a STOP condition occurs, stop and send the report. Do not start the next task until a person approves the report.

**Goal:** Complete Phase 1 measurement and baseline green checks, then diagnose Phase 2 Slice 2A (`packages/host/contracts/`, `packages/host/api/`, and `packages/session/persistence/`) before changing production code.

**Approach:** Revisions 1 and 1b (Tasks 1 to 5) passed the Phase 1 exit gate. All 18 non-live suites and 5 root tool test files passed with `# fail 0`. Revision 2 adds two read-only diagnosis tasks (Tasks 6 and 7) for Slice 2A. Both tasks stop for owner approval before Revision 2b changes code.

**Tech stack:** Windows, Node.js 22.19.0, pnpm 11.28.5 (`corepack pnpm@11.28.5`), TypeScript 6.0.3, oxlint 1.94.0, Biome 2.5.15, and `node:test`.

**Spec:** Phase scope, baseline signals, and gates come from Module Design Refactor [[1]](#ref-1). Ownership, implementation, testware, and deep-module rules come from Project Structure [[2]](#ref-2), Coding Guidelines [[3]](#ref-3), Testware [[4]](#ref-4), and Codebase Design [[5]](#ref-5).

## Decisions

| Topic | Decision |
| --- | --- |
| Workstream and revision | This folder owns `refactor/module-design`. Revisions 1 and 1b closed Phase 1, and Revision 2 runs Phase 2 Slice 2A diagnosis [[1]](#ref-1). |
| Scanner script | Place the static scanner at `scripts/scan-module-design.mjs` and its unit tests at `tests/scan-module-design.test.mjs`. Add `"scan:module-design": "node scripts/scan-module-design.mjs"` in `package.json`. |
| Scanner parser | Parse TypeScript and JavaScript files with the installed `typescript` compiler API (`ts.createSourceFile`), matching `scripts/check-boundaries.mjs`. Add no new npm dependency. |
| Production area scope | Scan tracked and non-ignored `.ts` and `.tsx` files under `apps/` and `packages/`, excluding `lib/`, `tests/`, and `node_modules/`. Group files into the 14 areas listed in Module Design Refactor [[1]](#ref-1). |
| Quantitative thresholds | Flag production files over 400 lines, functions over 80 lines, non-barrel files under 30 lines, non-`as const` type assertions, and `*Service` declarations. Collect `git log` co-change pairs with at least 3 shared commits across the last 200 non-merge commits, skipping commits over 20 production files. |
| Testware scan scope | Scan tracked `.test.mjs` and `.test.ts` files across `apps/`, `packages/`, `e2e/`, and `tests/`. Report counts per root, files missing a top comment header, files calling `setTimeout(`, and importers of `scripts/lib/`. |
| Triage approval gate | Task 2 proposes a Tier 1, Tier 2, or Skip label for every area and stops. Do not change `docs/build/refactor/module-design/README.md` until the owner approves the table. |
| Timeout diagnosis first | Task 3 measures isolated and suite timings for `e2e/portable-generation-http.test.mjs` and classifies the root cause before any fix. Revision 1b applies the approved fix and checks `# fail 0` across all non-live suites. |
| Approved 14-area triage | Approve 8 Tier 1 areas, 5 Tier 2 areas (`filesystem/`, `html/`, `design/`, `registry/`, `document/`), and 1 Skip area (`pptx/`). Record the AST baseline (32 type assertions, 21 non-barrel files under 30 lines, 68 test files) in `docs/build/refactor/module-design/README.md`. |
| Timeout fix scope | Set `openCode: { timeoutMs: 120000 }` inside `e2e/portable-generation-http.test.mjs`. Keep the `30000` ms default in `apps/web/tests/fixtures/b02-helpers.mjs`. Defer browser reuse evaluation in `apps/web/src/integrations/rendering/artifact-renderer.ts` to Phase 2 Slice 2C. |
| CI timeout guardrail | Raise `timeout-minutes` from `2` to `6` on the `generation_publication` step in `.github/workflows/workspace.yml` so the full suite (~3 minutes locally) does not expire in CI. |
| Scanner test hardening | Close the four coverage gaps from the Task 1 report inside `tests/scan-module-design.test.mjs`. Keep `scripts/scan-module-design.mjs` unchanged. |
| Phase 2 slice order | Keep Inside-Out order: run Slice 2A (`packages/host/` and `packages/session/persistence/`) before Slice 2B (`packages/presentation/deck/`) [[1]](#ref-1). |
| Slice 2A diagnosis split | Split Slice 2A diagnosis into two read-only tasks so each executor reads every line without truncation. Task 6 covers `packages/host/contracts/` (7 files, 1,501 lines) and `packages/host/api/` (8 files, 1,566 lines). Task 7 covers `packages/session/persistence/` (9 files, 1,875 lines) and its seam with `packages/host/api/`. |
| Slice 2A diagnosis gate | Tasks 6 and 7 inspect code without editing source files. Each task cites file-and-line facts for four deep-module questions, classifies findings, and stops before Revision 2b [[1]](#ref-1). |

## Global Constraints

- Run commands from the repository root in Git Bash on Windows.
- Use Node.js 22.19.0 and `corepack pnpm@11.28.5`. Do not install another runtime or package manager version.
- On Windows, run `build`, `test:attachments`, or `test:model-requests` outside the sandbox only when `EPERM` or `EBUSY` blocks them.
- Preserve existing working-tree changes. Never reset, clean, or overwrite unrelated files.
- Do not commit, push, publish, or call a live external provider.
- Do not run live suites (`test:research-live`, `test:opencode-live`).
- Do not read real user data, credentials, or `.env` values.
- Do not change product behavior, database schemas, wire payloads, or deferred features.
- Do not add a new external npm package or change lockfiles.
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
9. `packages/host/contracts/` and `packages/host/api/` diagnosis audits all 65 and 56 root exports, tests small files for deletion, and inspects the `@deckagent/deck` import in `host/api/src/index.ts`. Check: [Task 6](task-06-diagnose-host-contracts-and-api.md).
10. `packages/session/persistence/` diagnosis maps all 32 root exports, all 4 type assertions in `requests.ts`, `MemoryDraftStore` ownership, and duplicate types across the `host/api/` seam. Check: [Task 7](task-07-diagnose-session-persistence.md).

## Tasks

| Task | Status | File |
| --- | --- | --- |
| 1 | Done | [Build quantitative module-design scanner and unit tests](task-01-quantitative-scan-script.md) ([report](../reports/task-01-quantitative-scan-script.md)) |
| 2 | Done | [Run quantitative scan and draft 14-area triage table](task-02-run-scan-and-triage.md) ([report](../reports/task-02-scan-and-triage.md)) |
| 3 | Done | [Investigate portable-generation-http REQUEST_TIMEOUT baseline failure](task-03-investigate-timeout-failure.md) ([report](../reports/task-03-investigate-timeout-failure.md)) |
| 4 | Done | [Record approved 14-area triage and AST baseline](task-04-record-phase1-triage-and-baseline.md) ([report](../reports/task-04-record-phase1-triage-and-baseline.md)) |
| 5 | Done | [Fix portable-generation-http timeout, harden scanner tests, and check Phase 1 exit gate](task-05-fix-timeout-and-verify-phase1-exit.md) ([report](../reports/task-05-fix-timeout-and-verify-phase1-exit.md)) |
| 6 | Done | [Diagnose host/contracts and host/api module design](task-06-diagnose-host-contracts-and-api.md) ([report](../reports/task-06-diagnose-host-contracts-and-api.md)) |
| 7 | Pending | [Diagnose session/persistence module design and host seam](task-07-diagnose-session-persistence.md) |

## Next revision

- Revision 2b waits for owner approval of Task 6 and Task 7 reports. It refactors Slice 2A (`packages/host/contracts/`, `packages/host/api/`, `packages/session/persistence/`) and updates approved rules in Project Structure [[2]](#ref-2) or Coding Guidelines [[3]](#ref-3).
- Revisions 3 to 5 wait for Slice 2A to pass tests and boundary checks. They run Slice 2B (`packages/presentation/deck/`), Slice 2C (`apps/web/src/features/`, `integrations/`, `apps/web/src/` root), and Slice 2D (`apps/web/src/browser/`). Slice 2C includes `artifact-renderer.ts` browser reuse evaluation. Each slice starts with a read-only diagnosis task and STOP gate.

## References

1. <a id="ref-1"></a>[Module Design Refactor](../README.md)
2. <a id="ref-2"></a>[Project Structure](../../../../conventions/project-structure.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../../../conventions/code.md)
4. <a id="ref-4"></a>[Testware](../../../../conventions/testware.md)
5. <a id="ref-5"></a>[Codebase Design](../../../../../.agents/skills/codebase-design/SKILL.md)
