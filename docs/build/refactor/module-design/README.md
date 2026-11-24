# Module Design Refactor

Read this file to review codebase measurements, the deep-module direction, and the divide-and-conquer diagnosis method for the post-boundary refactor.

## Scope and relationship to boundaries

The active boundary refactor moves files to their owners, separates contracts, and enforces import direction in CI [[1]](#ref-1).
That work builds structural boundaries, not internal module design.
This workstream addresses internal module shape, interface surface, locality, and human reviewability after Tasks 15 through 18 complete [[1]](#ref-1).

Project Structure [[2]](#ref-2) and Coding Guidelines [[3]](#ref-3) are revisable inputs, not rigid constraints.
When module diagnosis shows that a convention forces shallow wrappers, awkward ownership, or an unnecessary hard fit, update that convention directly.
Do not add pass-through layers to force code into an existing rule.

## Measured baseline

A static scan on 2026-11-24 measured 156 production TypeScript files across `apps/` and `packages/` (excluding `lib/`, `tests/`, and `node_modules/`), totaling 26,180 lines.

| Signal | Measured value | Notable locations |
| --- | --- | --- |
| Files over 400 lines | 17 files | `apps/web/src/browser/boot.ts` (1,263 lines), `packages/presentation/deck/src/index.ts` (1,065 lines), `packages/presentation/deck/src/artifact-store.ts` (985 lines), `apps/web/src/features/deck/deck-workflow.ts` (817 lines), `packages/host/contracts/src/validation.ts` (766 lines), `packages/host/api/src/index.ts` (711 lines) |
| Wide public export surface | High in Deck | `packages/presentation/deck/src/contracts.ts` exports 49 symbols and `packages/presentation/deck/src/index.ts` exports 16 symbols |
| Small files under 30 lines | 44 files | Repeated 9-to-12-line `failures.ts` files across 5 features and thin wrappers such as `apps/web/src/browser/transport/bound-outline-decoder.ts` (1 line) |
| Non-`as const` type assertions | 90 occurrences | Concentrated in `apps/web/src` (51) and `packages/session/persistence` (14) |
| Architecture lookup docs | 1 file | `docs/architecture/` contains only `README.md` [[4]](#ref-4) |

**Inferred:** The feeling that the codebase remains messy after 14 structural tasks comes from two combined gaps.
First, the boundary refactor moved ownership walls without reshaping large internal files or wide public interfaces.
Second, `docs/architecture/` lacks flow maps that link product behavior to owner files, which makes incident triage and agent review slow.

## Design direction

Use the deep-module model from Codebase Design [[5]](#ref-5) as the primary design lens instead of running a broad SOLID or DRY sweep across the repository.

| Criterion | Broad SOLID or DRY sweep | Deep Modules [[5]](#ref-5) |
| --- | --- | --- |
| Common failure mode with agents | Splits one large file into many thin pass-through files and single-use interfaces | Reduces interface surface and keeps related behavior inside one owner |
| Agent context efficiency | Forces an agent to read many scattered files to verify one invariant | Lets an agent read small neighbor interfaces and focus context on one module |
| Human review and incident triage | Hides decision points across forwarding layers | Concentrates behavior behind one clear seam and its behavioral tests |
| Fit with DeckAgent rules | Encourages shared helpers and template layers that conflict with ownership [[2]](#ref-2) [[3]](#ref-3) | Aligns with the deletion test and explicit boundary protection [[3]](#ref-3) [[5]](#ref-5) |

Do not ask an agent to scan the full repository and propose edits from abstract principles.
Without measured symptoms, an agent invents speculative abstractions that add indirection without lowering maintenance cost.

## Divide-and-conquer method

Separate diagnosis from implementation across three layers so each agent session fits comfortably in context.

### 1. Static quantitative scan

Run a cheap script over the repository before invoking an agent for design review.
Collect five signals per package or feature:

- File line counts (over 400 lines) and function line counts (over 80 lines)
- Public export counts per package or feature entry point
- Small files under 30 lines that are not required barrel exports
- Counts of non-`as const` type assertions per area
- Co-change clusters from `git log` showing files that change together repeatedly

Use these numbers to select at most two or three high-impact areas that also block upcoming product work.

### 2. Narrow single-area diagnosis

Assign one area of roughly 1,500 to 3,500 lines per session so an agent reads every line without truncation.
Require the agent to answer four questions with file and line evidence before proposing code edits:

1. **Interface width:** How many concepts or call steps must a caller know to use this module, and do internal details leak through its exports?
2. **Deletion test:** Which file, class, or wrapper lowers complexity when removed?
3. **Locality:** For one concrete upcoming change, how many files must change together and why?
4. **Action classification:** Classify each finding into three buckets. Mark items for a focused refactor, a convention update in Project Structure [[2]](#ref-2) or Coding Guidelines [[3]](#ref-3), or no action.

Produce a short decision table first.
Start code changes only after the task owner approves the selected items.

### 3. Flow-based lookup maps

Because agents write most code in DeckAgent, the human reviewer needs fast lookup paths rather than memorized file trees.
Add short flow documents in Architecture [[4]](#ref-4) for the core runtime flows:

- **Request Lifecycle:** submission, SSE streaming, tool approval, cancellation, and startup recovery
- **Deck Pipeline:** Brief, Outline, generation, format adapter, and revision publication
- **Workspace and Source Permission:** workspace registration, folder policy, and bounded file access

Each flow document maps a symptom to its owner, the first files to inspect, and the behavioral tests for that invariant.

## Priority candidates

**Proposed:** Start diagnosis on the three areas that combine large static complexity with upcoming feature work in the deferred backlog [[1]](#ref-1):

1. `packages/presentation/deck/` (3,695 lines across 12 files, wide export surface, central to upcoming deck editing features)
2. `apps/web/src/features/deck/` (`deck-workflow.ts` at 817 lines, `image-research.ts` at 483 lines, `generation-workflow.ts` at 382 lines)
3. `apps/web/src/browser/boot.ts` (1,263 lines mixing draft, navigation, request observation, and confirmation coordination [[1]](#ref-1))

Leave small, stable packages untouched unless active feature work exposes a defect.
Current examples include `packages/workspace/registry/` (585 lines), `packages/presentation/document/` (272 lines), and `packages/presentation/pptx/` (143 lines).

## Open inputs

**Open:** Select two inputs before starting the first single-area diagnosis session:

- Record one or two recent incidents where inspecting agent code or fixing a bug felt slow or risky, so the first diagnosis targets real friction.
- Pick the first diagnosis target from the three proposed candidates after Tasks 15 through 18 of the boundary refactor finish [[1]](#ref-1).

## References

1. <a id="ref-1"></a>[Codebase Refactor Implementation Plan](../boundaries/plan/README.md)
2. <a id="ref-2"></a>[Project Structure](../../../conventions/project-structure.md)
3. <a id="ref-3"></a>[Coding Guidelines](../../../conventions/code.md)
4. <a id="ref-4"></a>[Architecture](../../../architecture/README.md)
5. <a id="ref-5"></a>[Codebase Design](../../../../.agents/skills/codebase-design/SKILL.md)
