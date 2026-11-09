---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Testing plan — {scope}

<!-- Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, reference FRs by ID (don't restate the statement), keep the section order below.
     Derived from dev/development/test-strategy.md: risk sets the depth, each kind of requirement picks its technique and coverage criterion. The plan applies the strategy; it does not restate its rules.
     This is the one home of the acceptance criteria and measures of the build (dev/mvp/WORKFLOW.md "Spec rules"); the length budget does not count them.
     Gaps, deviations and the PO's rulings live in review-flows.md only. A ruling's result is written here as current fact (for example in the driver section), not as a ruling.
     Written by the PO (the agent drafts). Developers write the tests from this plan; the PO approves each test before it is locked (dev/mvp/WORKFLOW.md "Phase 2"). -->

## At a glance

- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **Spine:** [traceability-matrix.md](./traceability-matrix.md) — every criterion here has a row there
- **PO review view:** [review-flows.md](./review-flows.md) — diagrams, decision trees, gaps and rulings
- **Tiers:** _N ci · N eval · N manual_
- **Technical checklist (C1–C8):** _N of 8 pass_ — failures listed in review-flows.md

<!-- One row per in-scope FR and NFR. Risk: high | normal (test-strategy.md "Risk and depth"; unset = high). Kinds and techniques: one sentence per kind, naming its technique (test-strategy.md "Technique per requirement"). Coverage: criteria met / required by the risk level; a criterion not met is a deviation in review-flows.md. -->

| Item | Risk | Kinds and techniques | Coverage met / required |
|---|---|---|---|
| FR-NNN | high | The lifecycle uses **state transition**. The input range uses **EP + BVA**. | 0 / 0 |
| NFR-NNN | normal | Reliability uses **fault injection**. | 0 / 0 |

## Test driver and fixtures

<!-- Build-specific only. The general rules (driver contract, NotWiredError, positive control, no silent skip, isolation) are in test-strategy.md "Test infrastructure rules"; do not restate them.
     Functions: the driver calls the criteria use. Fields: the names the criteria assert, one row each. Fixtures: each with what it sets up and its self-test. -->

| Driver function | Used by |
|---|---|
| `functionName(args)` | FR-NNN AC-1 |

| Field | Meaning |
|---|---|
| `field` | |

| Fixture | Sets up | Self-test |
|---|---|---|
| `fixtureName` | | |

## Acceptance criteria

<!-- Written after Phase 1, so research results shape them. One "### FR-NNN" heading per in-scope FR, then one block per criterion: "#### AC-n · name". IDs are not renumbered; a later build that takes the same FR continues its numbering.
     Given: the relevant state and input, described well enough to repeat. When: a user action or event.
     Then: the observable result, one line per thing, no "if".
     Catches: the wrong DeckAgent behavior this test fails on (deterministic criteria; checklist C2).
     Check: deterministic (observable state or an exact invariant) | evaluation (a person judges meaning/relevance against Then).
     Tier: ci | eval | manual. Default from Check: deterministic → ci, evaluation → eval; the PO may move one to manual.
     Each criterion adds precision beyond the use case response (spec/03-requirements/fr/_CRITERIA.md FRG-03). -->

### FR-NNN

#### AC-1 · short name

- **Given:**
- **When:**
- **Then:**
- **Catches:**
- **Check:** deterministic
- **Tier:** ci

## Measures

<!-- One "### NFR-NNN" heading per in-scope NFR, then one block per measure: "#### M-n · name".
     Condition: the state, input, and environment, enough to repeat; state the product-controlled or end-to-end boundary; state provider-dependent conditions, do not silently hide provider time.
     Measure: the quantity measured or the property checked. How to measure: in prose, no tool, no architecture.
     Target: a value with unit and bound, or a required property. "not set" while pending; do not guess a number.
     Passes when: what counts as a pass. "not set" while pending.
     Rules: spec/03-requirements/nfr/_CRITERIA.md NFG-05, NFG-06. -->

### NFR-NNN

#### M-1 · measure name

- **Condition:**
- **Measure:**
- **How to measure:**
- **Target:** not set
- **Passes when:** not set
- **Tier:** ci

## Eval cases (eval tier)

<!-- One row per eval-tier AC. Cases and rubric live in tests/eval/; this table names them. The rubric scores what the AC's Then says, nothing else. Write "None." when the build has no eval-tier criterion. -->

| AC | Cases (inputs) | Rubric criteria | Pass threshold |
|---|---|---|---|
| FR-NNN AC-2 | | | |

## Manual checks (manual tier)

<!-- Write "None." when the build has no manual-tier criterion. -->

| AC | What the PO checks | How |
|---|---|---|
| FR-NNN AC-3 | | |

## Post-implementation tests

<!-- Planned now, ticketed in Phase 4 (phase:post-impl). Level: integration | E2E. Target: a UC flow or alternative, or an NFR measure (point to it, do not restate its target). Technique: test-strategy.md. Mark the smoke subset in the last column. -->

| Level | Target | Technique | What it checks | Smoke |
|---|---|---|---|---|
| E2E | UC-XXX main flow S1-S6 | use case testing | | yes |
| E2E | UC-XXX A1 | use case testing | | |
| Integration | NFR-NNN M-1 | fault injection | | |

## Test-stub tickets

<!-- Input of ticket-writer in Phase 2. One concern per ticket, at most 3 files (checklist C8). T0 tickets build the driver and fixtures; they carry no criterion. -->

| Ticket | Criteria | Files | Fixtures | Blocked by |
|---|---|---|---|---|
| T0 · test driver | — | `tests/acceptance/support/...` | — | — |
| T1 · name | FR-NNN AC-1..3 | `tests/acceptance/...` | | T0 |
