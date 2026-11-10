---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Basis register — {scope}

<!-- A record of Gate 1, beside test-analysis.md (dev/development/test-strategy.md "Test basis register"). It holds the register rows only; their counts and the ambiguities live in test-analysis.md, the scope rulings in the matrix's "Items not tested". The units each item is cut from are in sentence-map.md.
     Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, reference FRs by ID (don't restate the statement), keep the section order below. Its length follows the spec it covers.
     Build files are written in Vietnamese prose with English terms (dev/mvp/builds/_STYLE.md). -->

## Contents

- [At a glance](#at-a-glance)
- [FR-NNN · Title](#fr-nnn--title)

## At a glance

- **Purpose:** **every basis item** of the in-scope spec, the unit of **requirement coverage**. Tests, conditions and AC **cite these IDs**.
- **Counts:** [test-analysis.md](./test-analysis.md) section 1 · **Scope rulings:** [traceability-matrix.md](../traceability-matrix.md) "Items not tested" · **Sentence map:** [sentence-map.md](./sentence-map.md)
- **Status:** _N basis items (N to test · N deferred · N excluded) · N pending_

<!-- One table per spec, in the order of the sentence map; the heading is the spec ID and its title. One row per basis item. ID: the spec ID and the number of the item cut from it (FR-NNN.n); explain any other ID pattern here. Kind: flow | lifecycle | multi-condition rule | range or format | invariant | NFR kind. Source: the spec ID and the clause. Risk: copied from the FR or NFR row of testing-plan.md, where the PO sets it (high | normal; unset = high). Ambiguity: the AM-n or CG-n of test-analysis.md section 4. Scope: to test | excluded | deferred; an excluded or deferred item cites its scope ruling (SR-n) in the matrix's "Items not tested". Approval: approved | pending; a scope the PO has not approved is pending and does not shrink the coverage denominator. An item that mixes behaviors of different scope is split, one item per scope. A closed list inside a BR value is one item; its members are test data (strategy "Technique per requirement", closed lists). -->

## FR-NNN · Title

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-NNN.1 | FR-NNN | One sentence. | lifecycle | high | | to test | pending |
