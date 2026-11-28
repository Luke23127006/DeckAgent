# Task 4: Record approved 14-area triage and AST baseline

Read this file to record the Phase 1 AST baseline, approved 14-area tiers, and Slice 2C browser reuse note.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `docs/build/refactor/module-design/README.md` (lines 1-115)
- `docs/build/refactor/module-design/reports/task-02-scan-and-triage.md` (lines 1-76)
- `docs/build/refactor/module-design/reports/task-03-investigate-timeout-failure.md` (lines 1-49)

**Files:**

- Change: `docs/build/refactor/module-design/README.md`
- Change: this task file, for completion checkboxes only

**Interfaces:**

- Uses: `corepack pnpm@11.28.5 check:docs` and `uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py`.
- Produces: updated baseline counts, approved 14-area tiers, and Slice 2C browser reuse note in `docs/build/refactor/module-design/README.md`.

**STOP when:**

- The output of a command does not match `Expected`.
- A target section in `docs/build/refactor/module-design/README.md` differs from the text below.
- The task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**

- Change any production file, test file, or plan file outside `Files`.
- Delete or weaken any document check or link.
- Commit or push.

- [x] **Step 1: Update the Measured baseline section in `docs/build/refactor/module-design/README.md`**

Replace lines 19-32 of `docs/build/refactor/module-design/README.md` with this exact Markdown block:

```markdown
## Measured baseline

The Phase 1 AST scan on 2026-11-24 measured 156 production TypeScript files totaling 26,177 lines across 14 areas.
The scan covers `apps/` and `packages/` and excludes `lib/`, `tests/`, and `node_modules/`.
The repository also holds 68 test files and 2 shared helpers in `scripts/lib/`.
Test files split across `e2e/` (26), `apps/web/tests/` (17), `packages/**/tests/` (20), and `tests/` (5).

| Signal | Measured value | Notable locations |
| --- | --- | --- |
| Files over 400 lines | 17 files | `apps/web/src/browser/boot.ts` (1,263 lines), `packages/presentation/deck/src/index.ts` (1,065 lines), `packages/presentation/deck/src/artifact-store.ts` (985 lines), `apps/web/src/features/deck/deck-workflow.ts` (817 lines), `packages/host/contracts/src/validation.ts` (766 lines), `packages/host/api/src/index.ts` (711 lines) |
| Functions over 80 lines | 57 functions | Concentrated in `apps/web/src/browser/` (11), `apps/web/src/features/` (11), `packages/presentation/deck/` (11), and `apps/web/src/integrations/` (10) |
| Wide public export surface | High in Deck and Host | `packages/presentation/deck/` (max 66 exports), `packages/host/contracts/` (max 65), `packages/host/api/` (max 56), and `packages/session/persistence/` (max 32) |
| Non-barrel files under 30 lines | 21 files | `apps/web/src/features/` (7, including repeated short `failures.ts` files), `apps/web/src/` (4), and thin wrappers such as `apps/web/src/browser/transport/bound-outline-decoder.ts` (1 line) |
| Non-`as const` type assertions | 32 occurrences | Spread across `apps/web/src/browser/` (7), `apps/web/src/features/` (6), `apps/web/src/integrations/` (4), `packages/session/persistence/` (4), and `packages/presentation/document/` (4) |
| `*Service` declarations | 5 symbols | `apps/web/src/features/` (4) and `packages/presentation/deck/` (1) |
| Testware baseline gaps | 68 test files | 62 files miss a top header, 6 files call fixed `setTimeout(`, and 2 files import `scripts/lib/` |
| Architecture lookup docs | 1 file | `docs/architecture/` contains only `README.md` [[5]](#ref-5) |
| Pre-existing test failure | 1 test file | `e2e/portable-generation-http.test.mjs` `REQUEST_TIMEOUT` caused by `openCode.timeoutMs: 30000` in `b02-helpers.mjs` across 14 cold browser spawns per 7-slide deck [[1]](#ref-1) |
```

Expected: The `## Measured baseline` section matches the Task 2 AST scan report and Task 3 root-cause finding with exact counts.

- [x] **Step 2: Replace the Area inventory table with approved tiers**

Replace `### Area inventory` through the `packages/presentation/pptx/` row in `docs/build/refactor/module-design/README.md` with this exact Markdown block:

```markdown
### Area inventory

The owner approved all 14 area tiers on 2026-11-24 from the Task 2 AST scan report.
`packages/workspace/registry/` and `packages/presentation/document/` moved from Skip to `Tier 2 (hygiene only)` to remove remaining type assertions.
`packages/presentation/pptx/` stays `Skip unless defect appears` because its single 143-line file holds zero type assertions and zero `*Service` symbols.

| Area | Files | Lines | Files over 400 lines | Approved tier |
| --- | --- | --- | --- | --- |
| `apps/web/src/browser/` | 36 | 6,766 | 5 | Tier 1 (Slice 2D) |
| `apps/web/src/features/` | 28 | 3,865 | 2 | Tier 1 (Slice 2C) |
| `packages/presentation/deck/` | 12 | 3,695 | 3 | Tier 1 (Slice 2B) |
| `apps/web/src/integrations/` | 22 | 2,528 | 1 | Tier 1 (Slice 2C) |
| `packages/session/persistence/` | 9 | 1,875 | 1 | Tier 1 (Slice 2A) |
| `packages/host/api/` | 8 | 1,566 | 2 | Tier 1 (Slice 2A) |
| `packages/host/contracts/` | 7 | 1,501 | 1 | Tier 1 (Slice 2A) |
| `apps/web/src/` (root) | 10 | 1,342 | 1 | Tier 1 (Slice 2C) |
| `packages/tools/filesystem/` | 7 | 842 | 0 | Tier 2 (hygiene only) |
| `packages/presentation/html/` | 6 | 623 | 0 | Tier 2 (hygiene only) |
| `packages/workspace/registry/` | 6 | 585 | 0 | Tier 2 (hygiene only) |
| `packages/presentation/design/` | 2 | 574 | 1 | Tier 2 (inspect large file) |
| `packages/presentation/document/` | 2 | 272 | 0 | Tier 2 (hygiene only) |
| `packages/presentation/pptx/` | 1 | 143 | 0 | Skip unless defect appears |
```

Expected: All 14 areas have exact AST line counts and owner-approved final tiers (8 Tier 1, 5 Tier 2, 1 Skip).

- [x] **Step 3: Record the deferred browser reuse note under Phase 2 Slice 2C**

In `docs/build/refactor/module-design/README.md`, replace item 3 under `### Phase 2: Deep-module refactor (Inside-Out slices)`:

Target:
```markdown
3. **Slice 2C (Application Features and Integrations):** `apps/web/src/features/` (including repeated `failures.ts` files), `apps/web/src/integrations/`, and `apps/web/src/index.ts`.
```

Replacement:
```markdown
3. **Slice 2C (Application Features and Integrations):** `apps/web/src/features/` (including repeated `failures.ts` files), `apps/web/src/integrations/`, and `apps/web/src/index.ts`. Slice 2C diagnosis also evaluates browser reuse in `apps/web/src/integrations/rendering/artifact-renderer.ts`, which Phase 1 deferred when raising the fixture timeout.
```

Expected: The Slice 2C scope explicitly records the deferred browser reuse evaluation without changing any other Phase 2 slice.

- [x] **Step 4: Run documentation and STE checks**

Run:
1. `corepack pnpm@11.28.5 check:docs`
2. `uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/module-design/README.md`

Expected: Both commands exit with code 0. `check:docs` reports `0 error(s) in 0 file(s)`. `ste-lint.py` reports `0 violations (0 hard, baseline 0)`.

- [x] **Step 5: Check repository status**

Run: `git status --short`
Expected: PASS. Only `docs/build/refactor/module-design/README.md` and this task file show new modifications from Task 4.

- [x] **Step 6: Report and stop**

Send this report, then STOP:
- Files changed (`docs/build/refactor/module-design/README.md` and this task file)
- Commands run, with exit codes and exact summary lines from `check:docs` and `ste-lint.py`
- Summary of recorded baseline deltas (AST counts vs prior estimate) and the 14 approved area tiers
- What the checks do not prove: documentation checks do not run test suites or clear the `# fail 0` exit gate (Task 5 checks runtime suites)
