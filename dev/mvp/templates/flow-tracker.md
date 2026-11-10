---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Flow tracker — {scope}

**Local mirror** of the **GitHub flow tracker issue** (milestone `mvp`). **Update this file when the issue is updated**.

<!-- Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, keep the phase order below. Every #N must be a clickable link:
     [#N](https://github.com/{owner}/{repo}/issues/N) — see dev/mvp/WORKFLOW.md "Linking convention". -->

## At a glance

- **Milestone:** mvp
- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **FRs in scope:** FR-NNN, FR-NNN
- **Active phase:** Phase 1
- **Spine:** [traceability-matrix.md](./testing/traceability-matrix.md)

## Phase 1: Research
<!-- Done when: the questions that block the tests or the plan are answered; every drift line has an outcome -->

- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) question title

## Phase 2: Tests before code
<!-- Done when: every in-scope FR and NFR has criteria with a tier; CI-tier tests fail as expected; eval cases and rubric written; manual checks listed -->

- [ ] Test analysis and plan: [test-analysis.md](./testing/analysis/test-analysis.md), [testing-plan.md](./testing/planning/testing-plan.md)
- [ ] Test design and AC: [test-design.md](./testing/design/test-design.md), [acceptance-criteria.md](./testing/design/acceptance-criteria.md)
- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) test stub title (tier: ci, author: @handle)

## Phase 3: Implementation plan
<!-- Done when: the PO has settled the module and LLM boundaries; every matrix row has a step -->

- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) plan review

## Phase 4: Implementation tickets
<!-- Done when: every matrix row has its tickets, and every ticket maps to a row -->

- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) module name (test author: @handle; Blocked by: [#N](https://github.com/{owner}/{repo}/issues/N))

## Phase 5: Execution and post-impl tests
<!-- Done when: the build's tickets are closed; no it.fails left -->

- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) test name (Blocked by: [#N](https://github.com/{owner}/{repo}/issues/N))

## Phase 6: Verification
<!-- Done when: CI green; eval run recorded; as-built and docs/architecture/ current; the PO has accepted the build -->

- [ ] Full CI suite, smoke and E2E pass
- [ ] Eval run recorded for every eval-tier AC: [eval-runs/](./testing/execution/eval-runs/)
- [ ] As-built: prediction written by the PO, then actual flow and drift: [as-built.md](./implementation/as-built.md)
- [ ] `docs/architecture/` updated (LLM boundary map, module map)
- [ ] Manual checks and exploratory sessions done
- [ ] Test summary written: [test-summary.md](./testing/test-summary.md)
- [ ] Build accepted

### Verified per AC
<!-- One line per AC, taken from the traceability matrix -->

- [ ] FR-NNN / AC-1 — confirmed
- [ ] FR-NNN / AC-2 — confirmed
