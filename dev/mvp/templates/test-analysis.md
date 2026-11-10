---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Test analysis — {scope}

<!-- The records of Gate 1 (dev/development/test-strategy.md "Test basis register", "Test types and approaches", "Automation feasibility", "Gates"). The PO approves them, together with testing-plan.md, before any design starts.
     The register rows live in basis-register.md and the sentence map in sentence-map.md, beside this file; the excluded and deferred items, with their scope rulings, in the matrix section "Items not tested". This file keeps the counts, the quality risks and test types, the mechanisms, and the ambiguities and candidate gaps.
     Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, reference FRs by ID (don't restate the statement), keep the section order below, write outcomes and not the conversation (rule 7).
     Build files are written in Vietnamese prose with English terms (dev/mvp/builds/_STYLE.md). -->

## Contents

- [At a glance](#at-a-glance)
- [1. Test basis register](#1-test-basis-register)
- [2. Quality risks and test types](#2-quality-risks-and-test-types)
- [3. Automation feasibility](#3-automation-feasibility)
- [4. Ambiguities and candidate gaps](#4-ambiguities-and-candidate-gaps)
  - [Ambiguities](#ambiguities)
  - [Candidate gaps](#candidate-gaps)

## At a glance

- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **Spine:** [traceability-matrix.md](../traceability-matrix.md), with the items not tested · **Approach, levels, targets:** [testing-plan.md](../planning/testing-plan.md)
- **Status:** _N basis items (N to test · N deferred · N excluded · N pending) · N spec units · N unmapped normative units · N types selected · N mechanisms `assumed` · N `blocked` · N ambiguities `pending`_

## 1. Test basis register

- **Register:** [basis-register.md](./basis-register.md), one row per basis item · **Sentence map:** [sentence-map.md](./sentence-map.md), every unit of the in-scope spec text · **Items not tested:** [traceability-matrix.md](../traceability-matrix.md)

<!-- One row per spec, in the order of the register. Every count is read off the two files above: Items, To test, Deferred, Excluded and Pending from the register; Units and Normative without an item from the sentence map. Pending: the excluded or deferred items whose scope the PO has not approved yet; they stay in the coverage denominator, which is To test + Pending. -->

| Spec | Items | To test | Deferred | Excluded | Pending | Units | Normative without an item |
|---|---|---|---|---|---|---|---|
| FR-NNN | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** | **0** | **0** | **0** | **0** |

## 2. Quality risks and test types

<!-- Quality risks that no statement names: what the system does with the user's files, the provider, the disk and the platform. Write "None." when there is none. -->

| ID | Quality risk | Source (trait of the system) | Risk level |
|---|---|---|---|
| QR-1 | | | high |

<!-- One row per test type. Selected: yes (with the source: a statement, a quality risk, a trait of the system) | no (with the reason) | pending while the PO has not decided. Oracle status: asserted | recorded-only; a recorded-only type names its measurement (operation, metric, conditions), and the duration of a whole test run is not a measurement. Without one the type is not selected and the quality stays a candidate quality risk for the PO to rule. Approach: scripted automated | scripted manual | exploratory (one type may use several). Security has one row per aspect. -->

| Type | Selected | Source or reason | Oracle status | Approach |
|---|---|---|---|---|
| Functional | yes | all FRs in scope | asserted | scripted automated |
| Performance | | | | |
| Security — confidentiality | | | | |
| Security — integrity | | | | |
| Security — authentication | | | | |
| Security — authorization | | | | |
| Security — availability | | | | |
| Security — non-repudiation | | | | |
| Reliability and recovery | | | | |
| Configuration, platform, installation | | | | |
| Usability | | | | |
| Structural | | | | |
| Change-related (retest, regression) | | | | |

## 3. Automation feasibility

<!-- One row per mechanism a test depends on (a fixture, an audit, a runner or CI condition). Status: verified (run, with evidence) | assumed (a basis, not run yet) | blocked (no reliable way yet) | not applicable. A plan can be approved with assumed mechanisms; a test is not evidence for its AC at Gate 3 while a mechanism it needs is not verified. Write "None." when there is none. -->

| Mechanism | Needed by | Status | Evidence or basis | If not verified |
|---|---|---|---|---|
| | FR-NNN AC-n | assumed | | |

## 4. Ambiguities and candidate gaps

<!-- Ambiguity: a place where the spec is unclear; the PO decides it (change the spec first, or fix the reading). Reading: the reading the tests use, as current fact, or "pending" while the PO has not decided. Spec entry: "not needed" | the spec file to change, waiting for the PO's go-ahead (`dev/mvp/spec/` is a protected path, and a new behavior enters the spec before a build uses it) | "in the spec". A reading is not used as an expected result until its spec entry reads "not needed" or "in the spec". Candidate gap: something the agent suspects is missing from the tests or the scope; it is an input to Gate 2, not a finding, and no test case is added only because it is listed. The Ambiguity column of the register points here. Write "None." when there is none. -->

### Ambiguities

| ID | Where | What is unclear | Reading | Spec entry |
|---|---|---|---|---|
| AM-1 | FR-NNN.n | | pending | |

### Candidate gaps

| ID | Item | What is suspected | Technique that will check it |
|---|---|---|---|
| CG-1 | FR-NNN.n | | |
