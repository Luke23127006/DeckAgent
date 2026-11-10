---
name: Flow tracker
about: Root tracking issue for a build scope. One per scoped build.
title: "Flow tracker — "
labels: flow-tracker
---

## Scope

- **Milestone:** mvp
- **Use case:** UC-XXX
- **Steps:** (e.g. S1-S2, or "all")
- **Alternatives:** (e.g. A1, A3, or "all")
- **FRs in scope:** FR-NNN, FR-NNN
- **NFRs in scope:** NFR-NNN
- **Build folder:** dev/mvp/builds/UC-XXX-short-label/

## Phase 1: Research
<!-- Done when: the questions that block the tests or the plan are answered; every drift line has an outcome -->

_Tickets added when the research question checklist is created._

## Phase 2: Tests before code
<!-- Done when: every in-scope FR and NFR has criteria with a tier; CI-tier tests fail as expected; eval cases and rubric written; manual checks listed -->

_Tickets added when the testing plan is created. Format: #N title (tier, author @handle)_

## Phase 3: Implementation plan
<!-- Done when: the PO has settled the module and LLM boundaries; every matrix row has a step -->

- [ ] **Module and LLM boundaries settled**

## Phase 4: Implementation tickets
<!-- Done when: every matrix row has its tickets, and every ticket maps to a row -->

_Tickets added when the implementation plan is ready. Format: #N title (test author @handle)_

## Phase 5: Execution and post-impl tests
<!-- Done when: the build's tickets are closed; no it.fails left -->

_Post-impl test tickets added alongside the implementation tickets._

## Phase 6: Verification
<!-- Done when: CI green; eval run recorded; as-built and docs/architecture/ current; the PO has accepted the build -->

- [ ] **Full CI suite, smoke and E2E pass**
- [ ] **Eval run recorded** for every eval-tier AC
- [ ] **As-built**: PO prediction, then actual flow and drift
- [ ] **docs/architecture/ updated**
- [ ] **Manual checks done**
- [ ] **Build accepted** by the PO

### Verified per AC
<!-- One line per AC, taken from dev/mvp/builds/UC-XXX-label/testing/traceability-matrix.md -->

_AC list added from the traceability matrix when Phase 6 is reached._
