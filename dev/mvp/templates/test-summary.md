---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Test summary — {scope}

<!-- The record of Gate 3, the build verdict (dev/development/test-strategy.md "Coverage", "Gates"). The agent drafts it in Phase 6; the PO decides the verdict.
     Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, keep the section order below.
     Build files are written in Vietnamese prose with English terms (dev/mvp/builds/_STYLE.md). -->

## At a glance

- **Purpose:** the PO decides at **Gate 3** whether the **evidence is enough to accept the build**.
- **Use case:** UC-XXX
- **Spine:** [traceability-matrix.md](./traceability-matrix.md)
- **Records:** [test-analysis.md](./analysis/test-analysis.md), [testing-plan.md](./planning/testing-plan.md), [test-design.md](./design/test-design.md), [acceptance-criteria.md](./design/acceptance-criteria.md)
- **Status:** _N rows verified of N · N defects open · N mechanisms not `verified`_

## 1. Coverage

<!-- The five measures of test-strategy.md "Coverage". Excluded and deferred items are reported beside the ratio, never counted as covered. Execution and pass coverage are read together with the two design measures. -->

| Measure | Result | Excluded | Deferred |
|---|---|---|---|
| Requirement coverage | 0 / 0 | 0 | 0 |
| Test design coverage | 0 / 0 | 0 | 0 |
| Execution coverage | 0 / 0 | — | — |
| Pass coverage | 0 / 0 | — | — |
| Structural coverage | 0 % | — | — |

## 2. Results by test type

| Type | Approach | Oracle status | Result |
|---|---|---|---|
| Functional | scripted automated | asserted | |

## 3. Defects

<!-- One row per defect issue found in this build. Cause: product defect | test defect | environment | spec gap. Write "None." when there is none. -->

| Issue | Case | Condition | Cause | Status |
|---|---|---|---|---|
| [#N](https://github.com/{owner}/{repo}/issues/N) | FR-NNN AC-n | | | open |

## 4. Residual risks and mechanisms

<!-- Open risks the PO accepts, and every mechanism that is not verified, with the tests that depend on it. Write "None." when there is none. -->

| Item | Impact | Accepted by the PO |
|---|---|---|
| | | |

## 5. Verdict

<!-- Written by the PO only. -->

- **Decision:**
- **Reason:**
- **Date:** DD-MM-YYYY
