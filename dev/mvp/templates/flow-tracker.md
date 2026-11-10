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
<!-- Gate: all research tickets closed; every row has a tier; no orphan RQ -->

- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) question title

## Phase 2: Testing plan and test stubs
<!-- Gate: tests approved and locked; eval cases and rubric approved; manual checks listed -->
<!-- Blocked by: Phase 1 complete -->

- [ ] Gate 1: [test-analysis.md](./testing/analysis/test-analysis.md) and the approach approved
- [ ] Gate 2: [test-design.md](./testing/design/test-design.md) and the AC approved
- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) test stub title (tier: ci, author: @handle)

## Phase 3: Implementation plan
<!-- Gate: PO approves; module boundaries and LLM boundary filled -->
<!-- Blocked by: Phase 2 complete -->

- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) plan review

## Phase 4: Implementation tickets
<!-- Gate: all tickets created and linked; separation rule holds -->

- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) module name (test author: @handle; Blocked by: [#N](https://github.com/{owner}/{repo}/issues/N))

## Phase 5: Execution and post-impl tests
<!-- Gate: all phase:impl and phase:post-impl tickets closed -->

- [ ] [#N](https://github.com/{owner}/{repo}/issues/N) test name (Blocked by: [#N](https://github.com/{owner}/{repo}/issues/N))

## Phase 6: Verification
<!-- Gate: every matrix row verified; flow tracker issue closed -->
<!-- Blocked by: Phase 5 complete -->

- [ ] Full CI suite, smoke and E2E pass
- [ ] Eval run recorded for every eval-tier AC: [eval-runs/](./testing/execution/eval-runs/)
- [ ] As-built: prediction written by the PO, then actual flow and drift: [as-built.md](./implementation/as-built.md)
- [ ] `docs/architecture/` updated (LLM boundary map, module map)
- [ ] Manual checks and exploratory sessions done by the PO
- [ ] Test summary written: [test-summary.md](./testing/test-summary.md)
- [ ] Gate 3: build verdict

### Verified per AC
<!-- One line per AC, taken from the traceability matrix -->

- [ ] FR-NNN / AC-1 — confirmed
- [ ] FR-NNN / AC-2 — confirmed
