---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Testing plan — {scope}

<!-- Optional: a full testing plan record, for a high-risk area several tasks share (dev/development/test-strategy.md "Required and optional"). A single behavior names its level, tier and technique in its issue or PR instead. Fill only the sections the area needs.
     Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, reference FRs by ID (don't restate the statement), keep the section order below.
     Planning decisions only, made with test-analysis.md, each derived by the rules of dev/development/test-strategy.md "Planning decisions". The plan applies the strategy; it does not restate its rules.
     Not here: the AC, measures, eval cases, manual checks and charters (../design/acceptance-criteria.md); the conditions, coverage items and test cases (../design/techniques/); the driver and fixtures (../../implementation/test-implementation.md).
     Scope rulings live in the matrix's "Items not tested" and readings of ambiguities in test-analysis.md only; gaps, deviations and the design rulings live in test-design.md only. A ruling's result is written here as current fact, not as a ruling.
     Drafted by the agent or a developer; the PO rules only the open questions on scope and on what the spec means. -->

## At a glance

- **What this document is:** the **test plan** of the build: the **planning decisions**, each with its **inputs and rule**, and the **design inputs** handed to test design (section 2.3). The structure follows the **STLC activities** of test-strategy.md "Frame"; it **does not claim conformance** to an external standard.
- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **Test analysis:** [test-analysis.md](../analysis/test-analysis.md) — the test basis, the test types and the automation feasibility
- **Spine:** [traceability-matrix.md](../traceability-matrix.md)
- **Test design:** [test-design.md](../design/test-design.md) — techniques applied, coverage counts, gaps and design rulings; AC in [acceptance-criteria.md](../design/acceptance-criteria.md)
- **Status:** _draft_ · open questions: _N_ (section 9)
- **Requirement coverage target:** _N / N_ basis items `to test`; excluded N, deferred N
- **Planned coverage:** _N / N_ coverage items, from test-design.md

## 1. Test objectives

<!-- What the tests of this build are for, one row each; an objective is not an AC. Name the evidence that shows it when the build is accepted. State the two roles of the acceptance tests (test-strategy.md "Test levels"). List what is outside the objectives (types not selected, platforms not claimed, residual risks). -->

| ID | Objective | Evidence |
|---|---|---|
| O1 | | |

## 2. Items, risk and techniques

<!-- Derived by the rules of test-strategy.md "Planning decisions" from test-analysis.md, never from drafted AC or test cases. Three tables: the selection (evidence), the items (summary) and the design inputs (hand-off). -->

### 2.1 Technique selection

<!-- One row per item and kind, read off the register: only items to test. Risk: the register's. Rule: P1–P5 of the strategy. Technique: what the rule selects; "P1 only" when it selects nothing beyond the floor; "through X" when a technique of another item covers it (P3). A technique selected by a behavior trait (P5) quotes the item's words in the Rule cell; the register's kind stays as it is. Check line: the row counts add up to the register's to test count. -->

| Item | Kind | Items to test | Risk | Rule | Technique | Design input |
|---|---|---|---|---|---|---|
| FR-NNN | lifecycle | .1, .3 | high | P2 | state transition | D1 |
| FR-NNN | invariant | .4 | normal | P3 | P1 only; through invariant check of UC-XXX.G1 | D5 |
| BR-NNN | range or format | V2 | high | P2; P5 ("only for user names") | EP + BVA; decision table | D2 |

**Check:** _N_ rows, _N_ items; the register has _N_ items `to test`.

### 2.2 Items

<!-- One row per in-scope FR and NFR; Risk: high | normal (test-strategy.md "Risk and depth"; unset = high). BR and UC rows take their risk from the register of test-analysis.md. Basis items: to test (deferred, excluded), from the register. Kinds and techniques: the summary of 2.1 for the item. Coverage criterion: the strategy's, per technique. Level: where its AC or measures are checked (section 3.1). Design record: the AC or measures section and the design inputs of 2.3. Every FR, NFR, BR and UC of the test basis has a row. The coverage item counts and the planned coverage are results of test design, in test-design.md. -->

| Item | Risk | Basis items to test (deferred, excluded) | Kinds | Techniques | Coverage criterion | Level | Design record |
|---|---|---|---|---|---|---|---|
| FR-NNN | high | 0 (0, 0) | lifecycle, range or format | **state transition**, **EP + BVA** | every event in every state; every partition, each boundary at three values | acceptance | AC of FR-NNN; test-design.md "State transition" |
| NFR-NNN | normal | 0 (0, 0) | reliability | **fault injection** | injection point × failure mode, as chosen | integration | measures of NFR-NNN; test-design.md "Fault injection" |
| BR-NNN | high (from FR-NNN) | 0 (0, 0) | multi-condition rule | **decision table** | every leaf | acceptance, through FR-NNN | AC of the FRs that cite it; test-design.md "Decision table" |
| UC-XXX | high | 0 (0, 0) | flow | **use case testing** | every step and alternative with a different end state | acceptance, E2E | AC of its FRs; section 8; test-design.md "Use case testing" |

### 2.3 Design inputs

<!-- The hand-off to test design (test-strategy.md "Planning decisions"): one row per technique evidence file of ../design/techniques/. Basis items: from 2.1. Criterion and depth: the strategy's criterion plus the depth parameters (closed list criterion, name sources, alternative combinations, a quality risk's variable), each with its value or ruling. Mechanisms: rows of test-analysis.md "Automation feasibility". Candidate gaps: the ones the section checks. Waits on: an open question of section 9 whose answer would change the expected results; empty otherwise. The evidence file cites the code and does not restate why. -->

| Code | Technique evidence file | Basis items | Criterion and depth parameters | Level (rule) | Mechanisms | Candidate gaps | Waits on |
|---|---|---|---|---|---|---|---|
| D1 | State transition: object | FR-NNN.1, .3 | every event in every state | acceptance (L1) | M1, M2 | CG-n | — |

## 3. Test approach

### 3.1 Levels

<!-- One row per level the build uses (test-strategy.md "Test levels"): the object and scope in this build, when it is written, who writes it, the tier. Add mutation testing before the build is accepted when the strategy requires it. -->

| Level | Object and scope | Written | Who writes it | Tier |
|---|---|---|---|---|
| Acceptance | | before or with the code of the behavior | | ci |

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

<!-- The five measures of test-strategy.md "Coverage". The denominator comes from the settled scope, never from a count of AC or test cases. -->

| Measure | Denominator in this build | Target | Measured at |
|---|---|---|---|
| Requirement coverage | | | test design, before build acceptance |
| Test design coverage | | 100 %; a shortfall is a deviation | test design |
| Execution coverage | | | before build acceptance |
| Pass coverage | | | before build acceptance |
| Structural coverage | | threshold `not set` until the PO sets one | with each increment |

## 4. Environment

<!-- OS and file system, runtime, runner, storage, folders and their substitutes, rights, E2E browser, developer machine. Test data. Environment validation (fixture self-tests). Link the mechanism rows of test-analysis.md; do not restate their status. -->

| Component | Value | Note |
|---|---|---|
| | | |

## 5. Dependencies

<!-- What the tests need that is resolved elsewhere (a decision, a mechanism, a CI change), and what it blocks. Do not restate mechanism status. -->

| Dependency | Resolved in | Blocks |
|---|---|---|
| | | |

## 6. Entry and exit criteria

<!-- One row per testing activity: test design, test implementation, execution, closure. The exits apply test-strategy.md "Evidence by moment" to the build; they report progress and gate no task. Each criterion names the record or check that shows it. Test design starts per section, when its design input (2.3) is clear enough. Add the suspension and resumption rules. -->

| Activity | Entry | Exit |
|---|---|---|
| Test design | Its design input (2.3) waits on nothing | |

## 7. Testing risks

<!-- Risks to the testing itself, not to the product (the product risk is the Risk column of section 2): what could make a test unable to run, or make it pass without proving anything. One row per risk; a ruling about it lives in test-design.md. For a risk that comes from a mechanism, link its row in test-analysis.md "Automation feasibility" and do not restate its status. Write "None." when the build has none. -->

| ID | Risk | Impact if it happens | Mitigation | Owner |
|---|---|---|---|---|
| R1 | | | | |

## 8. Post-implementation tests

<!-- Planned now, written once their parts exist. Level: integration | E2E. Target: a UC flow or alternative, or an NFR measure (point to it, do not restate its target). Technique: test-strategy.md. Mark the smoke subset in the last column. Name a ticket only when the test is handed off. -->

| Level | Target | Technique | What it checks | Smoke |
|---|---|---|---|---|
| E2E | UC-XXX main flow S1-S6 | use case testing | | yes |
| E2E | UC-XXX A1 | use case testing | | |
| Integration | NFR-NNN M-1 | fault injection | | |

## 9. Open questions

<!-- Planning questions that need the PO: a scope in doubt, a spec reading, a choice that changes what is tested. One row each with a proposal. An answered question is written into the section it changes and removed from this table, so the table holds only open ones. Write "None." when there is none. -->

| ID | What needs a decision | Proposal | Outcome |
|---|---|---|---|
| PD-1 | | | pending |
