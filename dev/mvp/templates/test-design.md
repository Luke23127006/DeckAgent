---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Test design — {scope}

<!-- The summary of the Test Design Specification of the build (dev/development/test-strategy.md "Test design specification"). The evidence of each technique lives in techniques/Dn-topic.md (template test-design-technique.md); this file is the index of those files, the coverage counts and the ruling log.
     Homes: the basis items live in ../analysis/basis-register.md; the scope rulings in ../traceability-matrix.md "Items not tested"; the readings of ambiguities in ../analysis/test-analysis.md; the selection of each technique and its design input in ../planning/testing-plan.md; the AC and measures in acceptance-criteria.md. This file cites them by ID and does not restate them.
     Build files are written in Vietnamese prose with English terms (dev/mvp/builds/_STYLE.md). -->

## At a glance

- **Purpose:** a reviewer checks that the **conditions are complete** and that **each technique was applied as the strategy says**, one evidence file at a time.
- **Basis:** [test-analysis.md](../analysis/test-analysis.md) · **Design inputs:** [testing-plan.md](../planning/testing-plan.md) section 2.3 · **Criteria:** [acceptance-criteria.md](./acceptance-criteria.md) · **Spine:** [traceability-matrix.md](../traceability-matrix.md)
- **Status:** _N conditions · coverage items N / N with a test case · N gaps, N ruled, N pending_; checklist: _N of 8 pass_

## 1. Techniques applied

<!-- One row per design input of testing-plan.md section 2.3; the selection, the basis items, the criterion and the depth live there and are not restated here. Coverage items: the count the criterion requires, from the evidence file; a shortfall is a deviation in the next section. Error guessing has no file: it lives in the Catches line of each AC. -->

| Design input | Technique | Evidence file | Coverage items (with a test case / required) | Status |
|---|---|---|---|---|
| D1 | State transition | [D1-topic.md](./techniques/D1-topic.md) | 0 / 0 | not started |

## 2. Gaps, deviations and design rulings

<!-- Kind: gap (the spec does not answer), deviation (a technique or coverage criterion the risk level requires is not applied), checklist (a C1–C8 failure), infra (a test-infrastructure choice). Outcome: "pending" while the PO has not decided. A decided item's result is written as current fact into the file that owns it (testing-plan.md, acceptance-criteria.md, an evidence file, ../../implementation/test-implementation.md, or the spec) and the row is removed, so the table holds only open items. Scope rulings stay in the matrix's "Items not tested" and readings of ambiguities in ../analysis/test-analysis.md. -->

| ID | Kind | What, proposal | Outcome |
|---|---|---|---|
| Z-1 | gap | | pending |
