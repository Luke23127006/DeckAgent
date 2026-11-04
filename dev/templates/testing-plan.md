---
scope: ""
title: ""
version: vN
created: DD-MM-YYYY
---

# Testing plan — {scope}

<!-- Document rules (WORKFLOW.md "Document rules"): front-load the "At a glance" block,
     reference matrix rows by FR/AC id (don't restate the requirement text), keep the
     section order below, keep under ~1 page.
     Written by the PO (the agent drafts). Developers write the tests from this plan;
     the PO approves each test before it is locked (WORKFLOW.md "Phase 2"). -->

## At a glance

- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **FRs in scope:** FR-NNN, FR-NNN
- **NFRs in scope:** NFR-NNN
- **Tiers:** _N ci · N eval · N manual — N of N ACs have a tier_
- **Status:** _N of N tests approved and locked_
- **Spine:** [traceability-matrix.md](./traceability-matrix.md) — every test here maps to a row there

## Tiers

| Tier | Covers | Model | Blocks |
|---|---|---|---|
| ci | Deterministic ACs | Recorded fixtures or a mock | Merge |
| eval | Generation quality | Real model, fixed cases, rubric | Closing the build |
| manual | What only a person can judge | — | Closing the build |

## Pre-implementation tests (CI tier)

### Acceptance tests

<!-- "Checks": what the test asserts, in one line — enough for a developer to write it
     and for the PO to review it against the AC. DEC: the decision that shaped this test,
     so a changed decision points to the tests to revisit. -->

| AC | FR | DEC | Checks | Fixture / mock | Ticket | Status |
|---|---|---|---|---|---|---|
| AC-1 | FR-NNN | DEC-NNN | | | #N | open |

### Security tests

| Threat / AC | FR | DEC | Checks | Ticket | Status |
|---|---|---|---|---|---|
| | FR-NNN | DEC-NNN | | #N | open |

## Eval cases (eval tier)

<!-- One block per eval-tier AC. Cases and rubric live in tests/eval/; this table names
     them. The rubric scores what the AC's Then says, nothing else. -->

| AC | FR | Cases (inputs) | Rubric criteria | Pass threshold | Ticket | Status |
|---|---|---|---|---|---|---|
| AC-2 | FR-NNN | | | | #N | open |

## Manual checks (manual tier)

| AC | FR | What the PO checks | How |
|---|---|---|---|
| AC-3 | FR-NNN | | |

## Tests with implementation (bundled into impl tickets)

| Module / function | FR | Test description | Impl ticket |
|---|---|---|---|
| | FR-NNN | | #N |

## Post-implementation tests

### E2E tests

| Flow | UC steps | Test description | Ticket | Status |
|---|---|---|---|---|
| Happy path | S1-S6 | | #N | open |

### Smoke tests

| Check | Description | Ticket | Status |
|---|---|---|---|
| | | #N | open |

### Recovery / resilience tests

| Failure scenario | UC alternative | Test description | Ticket | Status |
|---|---|---|---|---|
| | A-N | | #N | open |

### Performance tests

| Metric | NFR | Target | Test description | Ticket | Status |
|---|---|---|---|---|---|
| | NFR-NNN | | | #N | open |

### Regression tests

Added when a bug is found and fixed. Not planned ahead.
