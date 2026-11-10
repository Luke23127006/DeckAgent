---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Test implementation — {scope}

<!-- The test implementation contract of the build: what the acceptance tests call (driver functions, fields), the fixtures with their self-tests, and the test-stub tickets. Written after Gate 2 from the final AC; checked per ticket, not at a gate (test-strategy.md "Checks that are not gates"). It follows the design and never limits it: a criterion that needs a function, a field or a fixture the contract lacks extends the contract. A risk that a fixture or runner cannot run, or passes without proving anything, is a row of "Testing risks" in testing-plan.md, not of this file. -->

## At a glance

- **Status:** _draft · baseline approved by the PO (date)_
- **Criteria:** [acceptance-criteria.md](../testing/design/acceptance-criteria.md) · **Mechanisms:** [test-analysis.md](../testing/analysis/test-analysis.md) "Automation feasibility"

## Test driver and fixtures

<!-- Test implementation contract, checked per ticket. Build-specific only. The general rules (driver contract, NotWiredError, positive control, no silent skip, isolation) are in test-strategy.md "Test infrastructure rules"; do not restate them.
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

## Test-stub tickets

<!-- Test implementation contract. Input of ticket-writer in Phase 2, after Gate 2. One concern per ticket, at most 3 files (checklist C8). T0 tickets build the driver and fixtures; they carry no criterion. -->

| Ticket | Criteria | Files | Fixtures | Blocked by |
|---|---|---|---|---|
| T0 · test driver | — | `tests/acceptance/support/...` | — | — |
| T1 · name | FR-NNN AC-1..3 | `tests/acceptance/...` | | T0 |
