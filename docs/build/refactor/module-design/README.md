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
Write implementation tasks into `docs/build/refactor/module-design/plan/` one phase at a time as sequential revisions [[4]](#ref-4).
Do not write implementation tasks for a later phase until the current phase passes its exit gate.

## Measured baseline

A static scan on 2026-11-24 measured 156 production TypeScript files across 14 areas in `apps/` and `packages/` (excluding `lib/`, `tests/`, and `node_modules/`), totaling 26,180 lines.
The repository also holds 67 test files (including 26 in `e2e/`) and 2 shared helpers in `scripts/lib/`.

| Signal | Measured value | Notable locations |
| --- | --- | --- |
| Files over 400 lines | 17 files | `apps/web/src/browser/boot.ts` (1,263 lines), `packages/presentation/deck/src/index.ts` (1,065 lines), `packages/presentation/deck/src/artifact-store.ts` (985 lines), `apps/web/src/features/deck/deck-workflow.ts` (817 lines), `packages/host/contracts/src/validation.ts` (766 lines), `packages/host/api/src/index.ts` (711 lines) |
| Wide public export surface | High in Deck | `packages/presentation/deck/src/contracts.ts` exports 49 symbols and `packages/presentation/deck/src/index.ts` exports 16 symbols |
| Small files under 30 lines | 44 files | Repeated 9-to-12-line `failures.ts` files across 5 features and thin wrappers such as `apps/web/src/browser/transport/bound-outline-decoder.ts` (1 line) |
| Non-`as const` type assertions | 90 occurrences | Concentrated in `apps/web/src` (51) and `packages/session/persistence` (14) |
| Architecture lookup docs | 1 file | `docs/architecture/` contains only `README.md` [[5]](#ref-5) |
| Pre-existing test failure | 1 test | `portable-generation-http.test.mjs` #60 `REQUEST_TIMEOUT` in `test:generation-publication` [[1]](#ref-1) |

### Area inventory

| Area | Files | Approximate lines | Files over 400 lines | Proposed tier |
| --- | --- | --- | --- | --- |
| `apps/web/src/browser/` | 36 | 6,800 | 5 | Tier 1 (Slice 2D) |
| `apps/web/src/features/` | 28 | 3,890 | 2 | Tier 1 (Slice 2C) |
| `packages/presentation/deck/` | 12 | 3,700 | 3 | Tier 1 (Slice 2B) |
| `apps/web/src/integrations/` | 22 | 2,550 | 1 | Tier 1 (Slice 2C) |
| `packages/session/persistence/` | 9 | 1,880 | 1 | Tier 1 (Slice 2A) |
| `packages/host/api/` | 8 | 1,570 | 2 | Tier 1 (Slice 2A) |
| `packages/host/contracts/` | 7 | 1,510 | 1 | Tier 1 (Slice 2A) |
| `apps/web/src/` (root) | 10 | 1,350 | 1 | Tier 1 (Slice 2C) |
| `packages/tools/filesystem/` | 7 | 849 | 0 | Tier 2 (hygiene only) |
| `packages/presentation/html/` | 6 | 629 | 0 | Tier 2 (hygiene only) |
| `packages/workspace/registry/` | 6 | 591 | 0 | Skip unless defect appears |
| `packages/presentation/design/` | 2 | 576 | 1 | Tier 2 (inspect large file) |
| `packages/presentation/document/` | 2 | 274 | 0 | Skip unless defect appears |
| `packages/presentation/pptx/` | 1 | 144 | 0 | Skip unless defect appears |

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

**Proposed:** Execute Phase 2 from core contracts outward so UI and workflow callers do not change twice:

1. **Slice 2A (Host and Persistence):** `packages/host/contracts/`, `packages/host/api/`, and `packages/session/persistence/`.
2. **Slice 2B (Presentation Deck Core):** `packages/presentation/deck/` (and `packages/presentation/design/` if contracts overlap).
3. **Slice 2C (Application Features and Integrations):** `apps/web/src/features/` (including repeated `failures.ts` files), `apps/web/src/integrations/`, and `apps/web/src/index.ts`.
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

**Open:** Resolve these items before creating `docs/build/refactor/module-design/plan/` Revision 1:

- Record one or two recent incidents where inspecting agent code or fixing a bug felt slow or risky, so Phase 1 targets real friction.
- Decide whether Slice 2B (`packages/presentation/deck/`) should run before Slice 2A (`packages/host/` and `packages/session/persistence/`) if deck-editing feature work starts early.

## References

1. <a id="ref-1"></a>[Codebase Refactor Implementation Plan](../boundaries/plan/README.md)
2. <a id="ref-2"></a>[Project Structure](../../../conventions/project-structure.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../../conventions/code.md)
4. <a id="ref-4"></a>[Write Implementation Plan](../../../../.agents/skills/write-implementation-plan/SKILL.md)
5. <a id="ref-5"></a>[Architecture](../../../architecture/README.md)
6. <a id="ref-6"></a>[Codebase Design](../../../../.agents/skills/codebase-design/SKILL.md)
7. <a id="ref-7"></a>[Testware](../../../conventions/testware.md)
