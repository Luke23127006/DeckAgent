---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Testing plan — {scope}

<!-- Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, reference FRs by ID (don't restate the statement), keep the section order below.
     Planning decisions only, decided at Gate 1 with test-analysis.md, each derived by the rules of dev/development/test-strategy.md "Planning decisions". The plan applies the strategy; it does not restate its rules.
     Not here: the AC, measures, eval cases, manual checks and charters (../design/acceptance-criteria.md, Gate 2); the conditions, coverage items and test cases (../design/techniques/); the driver, fixtures and test-stub tickets (../../implementation/test-implementation.md).
     Scope rulings and rulings on ambiguities live in test-analysis.md only; gaps, deviations and the design rulings live in test-design.md only. A ruling's result is written here as current fact, not as a ruling.
     Written by the PO (the agent drafts). -->

## At a glance

- **What this document is:** the **test plan** of the build: the **planning decisions**, each with its **inputs and rule**, and the **design inputs** handed to Gate 2 (section 2.3). The structure follows the **STLC activities** of test-strategy.md "Frame"; it **does not claim conformance** to an external standard.
- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **Test analysis (Gate 1):** [test-analysis.md](../analysis/test-analysis.md) — the test basis, the test types and the automation feasibility
- **Spine:** [traceability-matrix.md](../traceability-matrix.md)
- **Test design (Gate 2):** [test-design.md](../design/test-design.md) — techniques applied, coverage counts, gaps and design rulings; AC in [acceptance-criteria.md](../design/acceptance-criteria.md)
- **Gate 1:** _Not started_ · **Gate 2:** _Not started_
- **Requirement coverage target:** _N / N_ basis items `to test`; excluded N, deferred N
- **Planned coverage:** _N / N_ coverage items, from test-design.md at Gate 2

## 1. Test objectives

<!-- What the tests of this build are for, one row each; an objective is not an AC. Name the evidence that shows it at Gate 3. State the two roles of the acceptance tests (test-strategy.md "Test levels"). List what is outside the objectives (types not selected, platforms not claimed, residual risks). -->

| ID | Objective | Evidence at Gate 3 |
|---|---|---|
| O1 | | |

## 2. Items, risk and techniques

<!-- Derived by the rules of test-strategy.md "Planning decisions" from the approved test-analysis.md, never from drafted AC or test cases. Three tables: the selection (evidence), the items (summary) and the design inputs (hand-off). -->

### 2.1 Technique selection

<!-- One row per item and kind, read off the register: only items to test. Risk: the register's. Rule: P1–P5 of the strategy. Technique: what the rule selects; "P1 only" when it selects nothing beyond the floor; "through X" when a technique of another item covers it (P3). A technique selected by a behavior trait (P5) quotes the item's words in the Rule cell; the register's kind stays as approved; after Gate 1 the row carries its planning delta and selects nothing until the PO approves it. Check line: the row counts add up to the register's to test count. -->

| Item | Kind | Items to test | Risk | Rule | Technique | Design input |
|---|---|---|---|---|---|---|
| FR-NNN | lifecycle | .1, .3 | high | P2 | state transition | D1 |
| FR-NNN | invariant | .4 | normal | P3 | P1 only; through invariant check of UC-XXX.G1 | D5 |
| BR-NNN | range or format | V2 | high | P2; P5 ("only for user names") | EP + BVA; decision table | D2 |

**Check:** _N_ rows, _N_ items; the register has _N_ items `to test`.

### 2.2 Items

<!-- One row per in-scope FR and NFR; the PO sets Risk: high | normal (test-strategy.md "Risk and depth"; unset = high). BR and UC rows take their risk from the register of test-analysis.md. Basis items: to test (deferred, excluded), from the register. Kinds and techniques: the summary of 2.1 for the item. Coverage criterion: the strategy's, per technique. Level: where its AC or measures are checked (section 3.1). Gate 2 record: the AC or measures section and the design inputs of 2.3. Every FR, NFR, BR and UC of the test basis has a row. The coverage item counts and the planned coverage are Gate 2 results, in test-design.md. -->

| Item | Risk | Basis items to test (deferred, excluded) | Kinds | Techniques | Coverage criterion | Level | Gate 2 record |
|---|---|---|---|---|---|---|---|
| FR-NNN | high | 0 (0, 0) | lifecycle, range or format | **state transition**, **EP + BVA** | every event in every state; every partition, each boundary at three values | acceptance | AC of FR-NNN; test-design.md "State transition" |
| NFR-NNN | normal | 0 (0, 0) | reliability | **fault injection** | injection point × failure mode, as chosen | integration | measures of NFR-NNN; test-design.md "Fault injection" |
| BR-NNN | high (from FR-NNN) | 0 (0, 0) | multi-condition rule | **decision table** | every leaf | acceptance, through FR-NNN | AC of the FRs that cite it; test-design.md "Decision table" |
| UC-XXX | high | 0 (0, 0) | flow | **use case testing** | every step and alternative with a different end state | acceptance, E2E | AC of its FRs; section 8; test-design.md "Use case testing" |

### 2.3 Design inputs

<!-- The hand-off to Gate 2 (test-strategy.md "Planning decisions"): one row per technique evidence file of ../design/techniques/. Basis items: from 2.1. Criterion and depth: the strategy's criterion plus the depth parameters (closed list criterion, name sources, alternative combinations, a quality risk's variable), each with its value or ruling. Mechanisms: rows of test-analysis.md "Automation feasibility". Candidate gaps: the ones the section checks. Blocked by: pending planning deltas; design starts the evidence file only when this cell is empty. The evidence file cites the code and does not restate why. -->

| Code | Technique evidence file | Basis items | Criterion and depth parameters | Level (rule) | Mechanisms | Candidate gaps | Blocked by |
|---|---|---|---|---|---|---|---|
| D1 | State transition: object | FR-NNN.1, .3 | every event in every state | acceptance (L1) | M1, M2 | CG-n | — |

## 3. Test approach

### 3.1 Levels

<!-- One row per level the build uses (test-strategy.md "Test levels"): the object and scope in this build, when it is written, who writes it, the tier. Add mutation testing in Phase 6 when the strategy requires it. -->

| Level | Object and scope | Written | Who writes it | Tier |
|---|---|---|---|---|
| Acceptance | | Phase 2 | | ci |

### 3.2 Types by level and approach

<!-- One row per type selected in test-analysis.md; do not restate the selection or its source. Basis items: the items the type's source names (rule P4), or "all" for functional; a type with no basis item (structural, change-related) says what it runs on. -->

| Selected type | Basis items | Level | Approach | Technique (design input) |
|---|---|---|---|---|
| Functional | all | acceptance | scripted automated | 2.1 |

### 3.3 Quality risks by approach

<!-- One row per quality risk of test-analysis.md: the technique and the items that address it (rule P4), and the variable it adds; or the ruling that leaves it untested. -->

| Quality risk | Risk level | Basis items | Addressed by (design input) |
|---|---|---|---|
| QR-1 | | | |

### 3.4 Coverage targets

<!-- The five measures of test-strategy.md "Coverage". The denominator comes from the approved scope, never from a count of AC or test cases. -->

| Measure | Denominator in this build | Target | Measured at |
|---|---|---|---|
| Requirement coverage | | | Gate 2, Gate 3 |
| Test design coverage | | 100 %; a shortfall is a deviation | Gate 2 |
| Execution coverage | | | Phase 6 |
| Pass coverage | | | Gate 3 |
| Structural coverage | | threshold set in the implementation plan | Phase 5 |

## 4. Environment

<!-- OS and file system, runtime, runner, storage, folders and their substitutes, rights, E2E browser, developer machine. Test data. Environment validation (fixture self-tests). Link the mechanism rows of test-analysis.md; do not restate their status. -->

| Component | Value | Note |
|---|---|---|
| | | |

## 5. Dependencies

<!-- What the tests need that is resolved elsewhere (a ticket, a Phase 3 decision, a CI change), and what it blocks. Do not restate mechanism status. -->

| Dependency | Resolved in | Blocks |
|---|---|---|
| | | |

## 6. Entry and exit criteria

<!-- One row per testing activity: test design (Gate 2), test implementation, execution (Phase 5), closure (Gate 3). The exits apply test-strategy.md "Phases" to the build. Each criterion names the record or check that shows it. Test design starts per section, when its design input (2.3) has no pending delta. Add the suspension and resumption rules. -->

| Activity | Entry | Exit |
|---|---|---|
| Test design (Gate 2) | Gate 1 approved | |

## 7. Testing risks

<!-- Risks to the testing itself, not to the product (the product risk is the Risk column of section 2): what could make a test unable to run, or make it pass without proving anything. One row per risk; a ruling about it lives in test-design.md. For a risk that comes from a mechanism, link its row in test-analysis.md "Automation feasibility" and do not restate its status. Write "None." when the build has none. -->

| ID | Risk | Impact if it happens | Mitigation | Owner |
|---|---|---|---|---|
| R1 | | | | |

## 8. Post-implementation tests

<!-- Planned now, ticketed in Phase 4 (phase:post-impl). Level: integration | E2E. Target: a UC flow or alternative, or an NFR measure (point to it, do not restate its target). Technique: test-strategy.md. Mark the smoke subset in the last column. List the tickets Phase 4 must create besides the module tickets. -->

| Level | Target | Technique | What it checks | Smoke |
|---|---|---|---|---|
| E2E | UC-XXX main flow S1-S6 | use case testing | | yes |
| E2E | UC-XXX A1 | use case testing | | |
| Integration | NFR-NNN M-1 | fault injection | | |

## 9. Planning deltas for the PO

<!-- Each change of the plan after Gate 1 is approved, and each conflict with a Gate 1 decision, one row each with a proposal; the PO rules it. Write "None." before Gate 1. -->

| ID | Kind | What changes or needs a decision | Proposal | PO ruling |
|---|---|---|---|---|
| PD-1 | | | | pending |
