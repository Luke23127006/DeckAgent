# Task 2: Quantitative Scan and 14-Area Triage Report

Read this file to review the Phase 1 quantitative scan metrics, testware baseline, co-change clusters, and 14-area triage classification produced by Task 2 [[1]](#ref-1).

## Scope and commands run

Task 2 ran the static TypeScript AST scanner without modifying source code or [Module Design Refactor](../README.md) [[1]](#ref-1) [[2]](#ref-2).

- `corepack pnpm@11.28.5 scan:module-design` — exit code `0` (`14` production areas, `156` production files, `68` test files, `55` co-change pairs).
- `corepack pnpm@11.28.5 scan:module-design --json` (area-count check) — exit code `0`, output: `{"areaCount":14,"prodFiles":156,"testFiles":68,"coChangePairs":55}`.
- `git status --short` — exit code `0`, no unexpected working-tree changes.

## 14-area triage table

The computed tier applies the [Triage decision table](../plan/task-02-run-scan-and-triage.md#triage-decision-table) top-to-bottom and compares each result against the initial [Area inventory](../README.md#area-inventory) [[1]](#ref-1) [[2]](#ref-2).

| Area | Files | Lines | >400 | Fn>80 | <30 non-barrel | Assertions | *Service | Max exports | Computed tier | Differs from README? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/browser/` | 36 | 6766 | 5 | 11 | 3 | 7 | 0 | 15 | `Tier 1 (deep refactor)` | No (`Tier 1 (Slice 2D)`) |
| `apps/web/src/features/` | 28 | 3865 | 2 | 11 | 7 | 6 | 4 | 9 | `Tier 1 (deep refactor)` | No (`Tier 1 (Slice 2C)`) |
| `packages/presentation/deck/` | 12 | 3695 | 3 | 11 | 1 | 2 | 1 | 66 | `Tier 1 (deep refactor)` | No (`Tier 1 (Slice 2B)`) |
| `apps/web/src/integrations/` | 22 | 2528 | 1 | 10 | 0 | 4 | 0 | 10 | `Tier 1 (deep refactor)` | No (`Tier 1 (Slice 2C)`) |
| `packages/session/persistence/` | 9 | 1875 | 1 | 0 | 0 | 4 | 0 | 32 | `Tier 1 (deep refactor)` | No (`Tier 1 (Slice 2A)`) |
| `packages/host/api/` | 8 | 1566 | 2 | 4 | 2 | 1 | 0 | 56 | `Tier 1 (deep refactor)` | No (`Tier 1 (Slice 2A)`) |
| `packages/host/contracts/` | 7 | 1501 | 1 | 1 | 0 | 0 | 0 | 65 | `Tier 1 (deep refactor)` | No (`Tier 1 (Slice 2A)`) |
| `apps/web/src/` | 10 | 1342 | 1 | 2 | 4 | 0 | 0 | 8 | `Tier 1 (deep refactor)` | No (`Tier 1 (Slice 2C)`) |
| `packages/tools/filesystem/` | 7 | 842 | 0 | 2 | 1 | 0 | 0 | 14 | `Tier 2 (hygiene only)` | No (`Tier 2 (hygiene only)`) |
| `packages/presentation/html/` | 6 | 623 | 0 | 2 | 2 | 0 | 0 | 8 | `Tier 2 (hygiene only)` | No (`Tier 2 (hygiene only)`) |
| `packages/workspace/registry/` | 6 | 585 | 0 | 0 | 1 | 1 | 0 | 17 | `Tier 2 (hygiene only)` | Yes (`Skip unless defect appears`) |
| `packages/presentation/design/` | 2 | 574 | 1 | 2 | 0 | 3 | 0 | 20 | `Tier 2 (inspect large file)` | No (`Tier 2 (inspect large file)`) |
| `packages/presentation/document/` | 2 | 272 | 0 | 0 | 0 | 4 | 0 | 16 | `Tier 2 (hygiene only)` | Yes (`Skip unless defect appears`) |
| `packages/presentation/pptx/` | 1 | 143 | 0 | 1 | 0 | 0 | 0 | 2 | `Tier 2 (hygiene only)` | Yes (`Skip unless defect appears`) |

Three areas differ from the initial table because each has `filesOver400 === 0` while carrying at least one hygiene signal:

- `packages/workspace/registry/`: `smallNonBarrelFiles = 1`, `typeAssertions = 1` (initial table: `Skip unless defect appears`).
- `packages/presentation/document/`: `typeAssertions = 4` (initial table: `Skip unless defect appears`).
- `packages/presentation/pptx/`: `functionsOver80 = 1` (initial table: `Skip unless defect appears`).

No area fell into the `No row matches` fallback branch.

## Testware baseline summary

| Group | Files | Lines | Missing Header | Fixed `setTimeout` Files | `scripts/lib/` Importers |
| --- | --- | --- | --- | --- | --- |
| `e2e/` | 26 | 8619 | 25 | 5 | 1 |
| `apps/web/tests/` | 17 | 2676 | 16 | 1 | 0 |
| `packages/**/tests/` | 20 | 3024 | 19 | 0 | 1 |
| `tests/` | 5 | 897 | 2 | 0 | 0 |

- Fixed `setTimeout` files: `apps/web/tests/opencode-adapter.test.mjs` (line 230), `e2e/attachment-storage.test.mjs` (line 406), `e2e/browser-smoke.test.mjs` (line 175), `e2e/env-startup.test.mjs` (line 92), `e2e/model-requests.test.mjs` (lines 370, 454), `e2e/source-requests.test.mjs` (line 87).
- `scripts/lib/` importers: `e2e/layout-review-browser.test.mjs` (`../scripts/lib/browser-session.mjs`) and `packages/presentation/html/tests/layout-quality.test.mjs` (`../../../../scripts/lib/browser-session.mjs`, `../../../../scripts/lib/layout-fixtures.mjs`).

## Top 10 co-change pairs

| Pair | Shared Commits |
| --- | --- |
| `packages/host/api/src/contracts.ts <-> packages/host/api/src/index.ts` | 18 |
| `packages/host/api/src/index.ts <-> packages/host/api/src/request-controller.ts` | 12 |
| `packages/host/api/src/contracts.ts <-> packages/host/api/src/request-controller.ts` | 11 |
| `packages/presentation/deck/src/contracts.ts <-> packages/presentation/deck/src/index.ts` | 9 |
| `packages/host/api/src/contracts.ts <-> packages/session/persistence/src/index.ts` | 8 |
| `packages/host/api/src/index.ts <-> packages/session/persistence/src/index.ts` | 7 |
| `packages/host/api/src/request-controller.ts <-> packages/session/persistence/src/index.ts` | 7 |
| `packages/presentation/deck/src/contracts.ts <-> packages/presentation/deck/src/schema.ts` | 7 |
| `packages/presentation/deck/src/index.ts <-> packages/presentation/deck/src/schema.ts` | 7 |
| `packages/session/persistence/src/index.ts <-> packages/session/persistence/src/schema.ts` | 7 |

## Measurement limits

Static AST and `git log` metrics measure structural symptoms only and do not evaluate domain ownership or runtime correctness.

## References

1. <a id="ref-1"></a>[Task 2: Run quantitative scan and draft 14-area triage table](../plan/task-02-run-scan-and-triage.md)
2. <a id="ref-2"></a>[Module Design Refactor](../README.md)
