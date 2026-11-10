---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Acceptance criteria and measures — {scope}

<!-- The one home of the build's acceptance criteria, measures, eval cases, manual checks and exploratory charters (dev/mvp/WORKFLOW.md "Spec rules" rule 2). Part of test design, decided at Gate 2.
     Written AFTER the technique evidence files in techniques/ have derived the conditions and coverage items from the basis items and the plan. A criterion drafted earlier is compared only in the reconciliation step of each technique (test-strategy.md "How a technique is applied"); it is never an input of design.
     The length budget does not count this file. Build files are written in Vietnamese prose with English terms (dev/mvp/builds/_STYLE.md). -->

## At a glance

- **Status:** _draft · final at Gate 2_
- **Basis:** [test-analysis.md](../analysis/test-analysis.md) · **Plan:** [testing-plan.md](../planning/testing-plan.md) · **Design:** [test-design.md](./test-design.md) · **Spine:** [traceability-matrix.md](../traceability-matrix.md)
- **Counts:** _N AC · N measures · N test cases · tiers: N ci · N eval · N manual_

## Acceptance criteria

<!-- Gate 2. Written after Phase 1, so research results shape them. One "### FR-NNN" heading per in-scope FR, then one block per criterion: "#### AC-n · name". IDs are not renumbered; a later build that takes the same FR continues its numbering.
     Given: the relevant state and input, described well enough to repeat. When: a user action or event.
     Then: the observable result, one line per thing, no "if".
     Catches: the wrong DeckAgent behavior this test fails on (deterministic criteria; checklist C2).
     Check: deterministic (observable state or an exact invariant) | evaluation (a person judges meaning/relevance against Then).
     Tier: ci | eval | manual. Default from Check: deterministic → ci, evaluation → eval; the PO may move one to manual.
     Serves: the basis items (../analysis/basis-register.md) and the condition codes (techniques/) this criterion covers. Every AC cites at least one basis item.
     Variants: the test cases of this AC, one line each: label (V1, V2…), the input, any precondition or action that differs from Given and When, the expected result when it differs from Then, and the coverage items it exercises (one or more, combined as the technique's method says; the relation is not one to one). An AC with one input has V1. Each variant is its own test case with its own result; its ID is the AC ID plus the label (test-strategy.md "The chain"). The technique evidence file holds the derivation; this line holds the case.
     Each criterion adds precision beyond the use case response (spec/03-requirements/fr/_CRITERIA.md FRG-03). -->

### FR-NNN

#### AC-1 · short name

- **Given:**
- **When:**
- **Then:**
- **Catches:**
- **Serves:** BI-1; X1
- **Variants:** V1 · input · coverage item
- **Check:** deterministic
- **Tier:** ci

## Measures

<!-- Gate 2. One "### NFR-NNN" heading per in-scope NFR, then one block per measure: "#### M-n · name".
     Condition: the state, input, and environment, enough to repeat; state the product-controlled or end-to-end boundary; state provider-dependent conditions, do not silently hide provider time.
     Measure: the quantity measured or the property checked. How to measure: in prose, no tool, no architecture.
     Target: a value with unit and bound, or a required property. "not set" while pending; do not guess a number.
     Passes when: what counts as a pass. "not set" while pending.
     Serves: the basis items (../analysis/basis-register.md) and the condition codes (techniques/) this measure covers; every measure cites at least one basis item.
     Variants: the test cases of this measure, one line each: label, the run condition (for example an injection point × failure mode, or a workload), the coverage item. Each is its own test case with its own result.
     Rules: spec/03-requirements/nfr/_CRITERIA.md NFG-05, NFG-06. -->

### NFR-NNN

#### M-1 · measure name

- **Condition:**
- **Measure:**
- **How to measure:**
- **Target:** not set
- **Passes when:** not set
- **Serves:** NFR-NNN.1; X1
- **Variants:** V1 · run condition · coverage item
- **Tier:** ci

## Eval cases (eval tier)

<!-- Gate 2. One row per eval-tier AC. Cases and rubric live in tests/eval/; this table names them. The rubric scores what the AC's Then says, nothing else. Write "None." when the build has no eval-tier criterion. -->

| AC | Cases (inputs) | Rubric criteria | Pass threshold |
|---|---|---|---|
| FR-NNN AC-2 | | | |

## Manual checks (manual tier)

<!-- Gate 2. Write "None." when the build has no manual-tier criterion. -->

| AC | What the PO checks | How |
|---|---|---|
| FR-NNN AC-3 | | |

<!-- Exploratory charters: one row per session. It creates no locked test; the findings go to a defect issue or a ruling. Write "None." when the build has none. -->

| Charter | Type | Scope | Time box |
|---|---|---|---|
| | security | | |

