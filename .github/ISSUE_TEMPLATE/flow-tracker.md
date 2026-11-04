---
name: Flow tracker
about: Root tracking issue for a build scope. One per scoped build.
title: "Flow tracker — "
labels: flow-tracker
---

## Scope

- **Version:** vN (milestone)
- **Use case:** UC-XXX
- **Steps:** (e.g. S1-S2, or "all")
- **Alternatives:** (e.g. A1, A3, or "all")
- **FRs in scope:** FR-NNN, FR-NNN
- **NFRs in scope:** NFR-NNN
- **Build folder:** dev/versions/vN/builds/UC-XXX-short-label/

## Phase 1: Research
<!-- Gate: all research tickets closed; every matrix row has a tier; no orphan RQ -->

_Tickets added when the research question checklist is created._

## Phase 2: Testing plan and test stubs
<!-- Gate: tests approved and locked; eval cases and rubric approved; manual checks listed -->
<!-- Blocked by: Phase 1 complete -->

_Tickets added when the testing plan is created. Format: #N title (tier, author @handle)_

## Phase 3: Implementation plan
<!-- Gate: PO approves; module boundaries and LLM boundary filled -->
<!-- Blocked by: Phase 2 complete -->

- [ ] Implementation plan approved by the PO

## Phase 4: Implementation tickets
<!-- Gate: all tickets created and linked; test author ≠ assignee on every ticket -->

_Tickets added when the implementation plan is approved. Format: #N title (test author @handle)_

## Phase 5: Execution and post-impl tests
<!-- Gate: all phase:impl and phase:post-impl tickets closed -->

_Post-impl test tickets added alongside the implementation tickets._

## Phase 6: Verification
<!-- Gate: this issue closed; every matrix row's Verified column is ticked -->
<!-- Blocked by: Phase 5 complete -->

- [ ] Full CI suite, smoke and E2E pass
- [ ] Eval run recorded for every eval-tier AC
- [ ] As-built: PO prediction, then actual flow and drift
- [ ] docs/architecture/ updated
- [ ] Manual checks done by the PO

### Verified per AC
<!-- One line per AC, taken from dev/versions/vN/builds/UC-XXX/traceability-matrix.md -->

_AC list added from the traceability matrix when Phase 6 is reached._
