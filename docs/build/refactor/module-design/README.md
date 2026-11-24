# Module Design Refactor

Read this file to follow the 5-phase abstract plan, baseline measurements, deep-module method, and handoff rules for the post-boundary refactor.

## Scope and relationship to boundaries

The boundary refactor moves files to their owners, separates contracts, and enforces import direction in CI [[1]](#ref-1).
That work builds structural walls, not internal module design.
This workstream addresses internal module shape, interface surface, locality, code hygiene, testware, and flow lookup maps [[1]](#ref-1).

Project Structure [[2]](#ref-2) and Coding Guidelines [[3]](#ref-3) are revisable inputs, not rigid constraints.
When module diagnosis shows that a rule forces shallow wrappers, awkward ownership, or an unnecessary hard fit, update that rule directly.
Do not add pass-through layers to force code into an existing rule.

All post-boundary refactor work stays under `docs/build/refactor/module-design/`.
Write implementation tasks into [Module Design Implementation Plan](plan/README.md) one phase at a time as sequential revisions [[4]](#ref-4).
Do not write implementation tasks for a later phase until the current phase passes its exit gate.

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

**Inferred:** The codebase still feels messy after structural boundary moves for two combined reasons.
First, the boundary refactor moved ownership walls without reshaping large internal files or wide public interfaces.
Second, `docs/architecture/` lacks flow maps that link product behavior to owner files, which makes incident triage slow.

## Design direction

Use the deep-module model from Codebase Design [[6]](#ref-6) as the primary design lens instead of running a broad SOLID or DRY sweep.

| Criterion | Broad SOLID or DRY sweep | Deep Modules [[6]](#ref-6) |
| --- | --- | --- |
| Common failure mode with agents | Splits one large file into thin pass-through files and single-use interfaces | Reduces interface surface and keeps related behavior inside one owner |
| Agent context efficiency | Forces an agent to read scattered files to verify one invariant | Lets an agent read small neighbor interfaces and focus context on one module |
| Human review and incident triage | Hides decision points across forwarding layers | Concentrates behavior behind one clear seam and its behavioral tests |
| Fit with DeckAgent rules | Encourages shared helpers and template layers that conflict with ownership [[2]](#ref-2) [[3]](#ref-3) | Aligns with the deletion test and explicit boundary protection [[3]](#ref-3) [[6]](#ref-6) |

Do not ask an agent to scan the full repository and propose edits from abstract principles.
Without measured symptoms, an agent invents speculative abstractions that add indirection without lowering maintenance cost.

## Divide-and-conquer method

Separate diagnosis from implementation across three layers so each agent session fits comfortably in context.

1. **Static quantitative scan:** Run a script over all 14 areas before design review. Collect file lines (over 400), function lines (over 80), export counts, and non-barrel files under 30 lines. Also collect non-`as const` type assertions, `*Service` symbols, and `git log` co-change clusters.
2. **Narrow single-area diagnosis:** Assign one area of roughly 1,500 to 3,500 lines per session so an agent reads every line without truncation. Require file-and-line evidence for four questions before editing code:
   - **Interface width:** How many concepts or call steps must a caller know, and do internal details leak through exports?
   - **Deletion test:** Which file, class, or wrapper lowers complexity when removed?
   - **Locality:** For one concrete upcoming change, how many files must change together and why?
   - **Action classification:** Sort each finding into focused refactor, convention update in Project Structure [[2]](#ref-2) or Coding Guidelines [[3]](#ref-3), or no action.
3. **Flow-based lookup maps:** Document core runtime flows in Architecture [[5]](#ref-5) after module shapes stabilize. Human reviewers then map symptoms to owners, first files, and behavioral tests.

## Abstract 5-phase plan

| Phase | Name | Plan location | Entry gate | Exit gate |
| --- | --- | --- | --- | --- |
| 1 | Full scan, triage, and baseline timeout fix | `plan/` Revision 1 | Open inputs resolved | All 14 areas classified into Tier 1, Tier 2, or Skip. All non-live test suites pass with `# fail 0` |
| 2 | Deep-module refactor (Inside-Out slices) | `plan/` Revisions 2–5 | Phase 1 exit gate passed | Approved Tier 1 slices reshaped. Conventions updated where hard-fit appeared. `check:boundaries` and tests pass |
| 3 | Repo-wide code hygiene and guardrails | `plan/` Revision 6 | Phase 2 exit gate passed | Remaining type assertions, comment audit (`KEEP` / `REMOVE`), and ambiguous `*Service` names resolved |
| 4 | Testware alignment | `plan/` Revision 7 | Phase 3 exit gate passed | Test files obey Testware [[7]](#ref-7). Mixed `e2e/` splits and `scripts/lib/` helper moves done. Test-only exports removed |
| 5 | Flow lookup maps and final exit audit | `plan/` Revision 8 | Phase 4 exit gate passed | Three flow docs published in Architecture [[5]](#ref-5). Before/After scan verifies all exit criteria |

### Phase 1: Full scan, triage, and baseline timeout fix

Run the quantitative scan across all 14 production areas and 67 test files.
Approve the final classification of every area into Tier 1 (deep refactor), Tier 2 (hygiene only), or Skip (untouched).
Investigate and fix the pre-existing `portable-generation-http.test.mjs` (#60 `REQUEST_TIMEOUT`) failure so later phases enforce `# fail 0` with no exceptions [[1]](#ref-1).

### Phase 2: Deep-module refactor (Inside-Out slices)

Execute Phase 2 from core contracts outward so UI and workflow callers do not change twice (approved order: Slice 2A before Slice 2B):

1. **Slice 2A (Host and Persistence):** `packages/host/contracts/`, `packages/host/api/`, and `packages/session/persistence/`.
2. **Slice 2B (Presentation Deck Core):** `packages/presentation/deck/` (and `packages/presentation/design/` if contracts overlap).
3. **Slice 2C (Application Features and Integrations):** `apps/web/src/features/` (including repeated `failures.ts` files), `apps/web/src/integrations/`, and `apps/web/src/index.ts`. Slice 2C diagnosis also evaluates browser reuse in `apps/web/src/integrations/rendering/artifact-renderer.ts`, which Phase 1 deferred when raising the fixture timeout.
4. **Slice 2D (Browser and `boot.ts`):** `apps/web/src/browser/`, focusing on `boot.ts`, `settings-panel.ts`, `management-client.ts`, `conversation-view.ts`, and 1-line wrappers.

Each slice starts with an investigation task that ends with `STOP` and a decision table [[4]](#ref-4).
Write the executable refactor tasks for that slice only after the task owner approves the decision table.
Clean up type assertions and `*Service` names inside files already touched by each slice.
Update Project Structure [[2]](#ref-2) or Coding Guidelines [[3]](#ref-3) whenever diagnosis exposes an awkward rule.

### Phase 3: Repo-wide code hygiene and guardrails

Sweep remaining Coding Guidelines [[3]](#ref-3) items across Tier 2 and untouched files:

- Remove remaining non-`as const` type assertions or replace them with boundary guards.
- Audit existing code comments with a `KEEP` / `REMOVE` decision table based on the five allowed reasons [[3]](#ref-3).
- Rename remaining ambiguous `*Service` symbols to operation-specific names.
- Evaluate lightweight lint rules to block regressions in new agent-written code.

### Phase 4: Testware alignment

Align the test suite with Testware [[7]](#ref-7) after production interfaces stabilize so tests are rewritten once:

- Add required file headers (behavior tested, fake environment, run command, expected-result source, and fail-first proof).
- Replace production-constant imports in test inputs and expected values with independent literals.
- Remove remaining fixed sleeps by using fake clocks or condition waits.
- Split mixed `e2e/` test files into owner suites where fixture boundaries are explicit, and move shared helpers out of `scripts/lib/` [[1]](#ref-1).
- Remove production exports that exist only for tests [[7]](#ref-7).

### Phase 5: Flow lookup maps and final exit audit

Write three concise flow documents in Architecture [[5]](#ref-5) after paths and symbols settle:

- **Request Lifecycle:** submission, SSE streaming, tool approval, cancellation, and startup recovery.
- **Deck Pipeline:** Brief, Outline, generation, format adapter, and revision publication.
- **Workspace and Source Permission:** workspace registration, folder policy, and bounded file access.

Each flow document maps a symptom to its owner, first files to inspect, and behavioral tests.
End Phase 5 by rerunning the Phase 1 static scan to compare Before and After metrics against Definition of Done.

## Definition of done

Stop refactoring and move to deferred product features once every condition below holds:

- `build`, `lint`, `check:docs`, and `check:boundaries` pass with 0 errors.
- All non-live test suites pass with `# fail 0` and 0 hidden skips, including `portable-generation-http.test.mjs`.
- All 14 production areas have an explicit final status (`Refactored`, `Hygiene complete`, or `Skipped by decision`).
- Testware rules hold across the suite: no production-constant expected values, no fixed sleeps, and no test-only production exports [[7]](#ref-7).
- The three core flow lookup maps exist in Architecture [[5]](#ref-5) and match current file paths.
- **Proposed:** No mixed-responsibility god-file remains unaddressed without a recorded rationale, and non-`as const` type assertions drop to 0 outside documented boundary exceptions.

## Fresh-chat handoff

A new chat starts the next phase with four steps:

1. Read this file and inspect `docs/build/refactor/module-design/plan/README.md` (when present) to find the last completed phase.
2. Verify that the entry gate for the next phase is green.
3. Run `/write-implementation-plan` to add only the next phase's revision to `docs/build/refactor/module-design/plan/` [[4]](#ref-4).
4. Ask the user for any phase-specific open inputs before writing executable tasks.

## Open inputs

The owner resolved all Phase 1 entry-gate inputs on 2026-11-24:

- **Friction anchor:** The owner added no extra personal incident beyond the measured baseline. Phase 1 uses the recorded baseline friction points (`portable-generation-http.test.mjs` #60 `REQUEST_TIMEOUT`, mixed-responsibility god-files led by `apps/web/src/browser/boot.ts` and `packages/presentation/deck/`, wide Deck exports, and missing architecture flow maps).
- **Phase 2 slice order:** Keep the default Inside-Out order — run Slice 2A (`packages/host/` and `packages/session/persistence/`) before Slice 2B (`packages/presentation/deck/`) so workflow and UI callers do not change twice.

## References

1. <a id="ref-1"></a>[Codebase Refactor Implementation Plan](../boundaries/plan/README.md)
2. <a id="ref-2"></a>[Project Structure](../../../conventions/project-structure.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../../conventions/code.md)
4. <a id="ref-4"></a>[Write Implementation Plan](../../../../.agents/skills/write-implementation-plan/SKILL.md)
5. <a id="ref-5"></a>[Architecture](../../../architecture/README.md)
6. <a id="ref-6"></a>[Codebase Design](../../../../.agents/skills/codebase-design/SKILL.md)
7. <a id="ref-7"></a>[Testware](../../../conventions/testware.md)
