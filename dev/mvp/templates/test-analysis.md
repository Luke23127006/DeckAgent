---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Test analysis — {scope}

<!-- The records of Gate 1 (dev/development/test-strategy.md "Test basis register", "Test types and approaches", "Automation feasibility", "Gates"). The PO approves them, together with the approach sections of testing-plan.md, before any design starts.
     Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, reference FRs by ID (don't restate the statement), keep the section order below.
     Build files are written in Vietnamese prose with English terms (dev/mvp/builds/_STYLE.md). -->

## At a glance

- **Purpose:** the PO decides at **Gate 1** whether we **found everything to test**, and which **types**, **levels** and **depth** fit. This file holds the **evidence**.
- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **Spine:** [traceability-matrix.md](./traceability-matrix.md)
- **Approach, levels, targets:** [testing-plan.md](./testing-plan.md)
- **Status:** _N basis items (N to test · N deferred · N excluded) · N spec units · N unmapped normative units · N excluded or deferred items without a PO ruling · N types selected · N mechanisms `assumed` · N `blocked`_

## 1. Test basis register

<!-- One row per basis item. Kind: flow | lifecycle | multi-condition rule | range or format | invariant | NFR kind. Source: the spec ID and the clause. Risk: copied from the FR or NFR row of testing-plan.md, where the PO sets it (high | normal; unset = high). Scope: to test | excluded | deferred; an excluded or deferred item cites its scope ruling (SR-n) below. Approval: approved | pending; a scope the PO has not approved is pending and does not shrink the coverage denominator. An item that mixes behaviors of different scope is split, one item per scope. A closed list inside a BR value is one item; its members are test data (strategy "Technique per requirement", closed lists). -->

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| BI-1 | FR-NNN | One sentence. | lifecycle | high | none | to test | pending |

### Scope rulings

<!-- One row per reason for which items are excluded or deferred (strategy "Test basis register", scope rulings). PO ruling: the existing ruling with its source and date, or "pending" while the PO has not ruled; an item is excluded or deferred in force only after the ruling. Mark with † an item that the ruling's source does not name literally. Write "None." when there is none. -->

| ID | Reason | Taken by | PO ruling | Items |
|---|---|---|---|---|
| SR-1 | | build N | pending | BI-1 |

### Sentence map

<!-- Every unit of every in-scope spec text (a sentence, or a clause ended by ";"), in reading order. Locator: the field and the number of the unit inside it. Class: N normative | E explanatory | D definition, decided by the content of the unit and never by its scope. Items: the items a normative unit feeds, including a unit whose behavior a spec outside the build owns (its item is deferred); a definition only points to another spec or states a boundary, and may name the target. The totals below are counted from this table. Text of the product-evidence section is a research record and is not counted. -->

| Spec file | Units | Normative | Explanatory | Definition | Normative without an item |
|---|---|---|---|---|---|
| FR-NNN | 0 | 0 | 0 | 0 | 0 |

#### FR-NNN

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the user chooses | N | BI-1 |

### Cross-reference mismatches

<!-- Compare UC steps and alternatives, FRs and BR values. A mismatch is a candidate gap, not a spec error. Write "None." when there is none. -->

| Mismatch | Why it is fine, or raised as |
|---|---|
| | |

## 2. Quality risks and test types

<!-- Quality risks that no statement names: what the system does with the user's files, the provider, the disk and the platform. Write "None." when there is none. -->

| ID | Quality risk | Source (trait of the system) | Risk level |
|---|---|---|---|
| QR-1 | | | high |

<!-- One row per test type. Selected: yes (with the source: a statement, a quality risk, a trait of the system) | no (with the reason). Oracle status: asserted | recorded-only; a recorded-only type names its measurement (operation, metric, conditions), and the duration of a whole test run is not a measurement. Without one the type is not selected and the quality stays a candidate quality risk for the PO to rule. Approach: scripted automated | scripted manual | exploratory (one type may use several). Security has one row per aspect. A type the PO has not ruled reads "pending" beside its Selected value. -->

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

<!-- Ambiguity: a place where the spec is unclear; the PO rules it (change the spec first, or fix the reading). Spec entry: "not needed" | the spec file to change, waiting for the PO's go-ahead (`dev/mvp/spec/` is a protected path, and a new behavior enters the spec before a build uses it) | "in the spec". A ruling is not used as an expected result until its spec entry reads "not needed" or "in the spec". Candidate gap: something the agent suspects is missing from the tests or the scope; it is an input to Gate 2, not a finding, and no test case is added only because it is listed. The Ambiguity column of the register points here. Write "None." when there is none. -->

### Ambiguities

| ID | Where | What is unclear | How the plan reads it now | PO ruling | Spec entry |
|---|---|---|---|---|---|
| AM-1 | FR-NNN.n | | | pending | |

### Candidate gaps

| ID | Item | What is suspected | Technique that will check it |
|---|---|---|---|
| CG-1 | FR-NNN.n | | |
