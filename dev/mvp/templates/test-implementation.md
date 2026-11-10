---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Test implementation — {scope}

<!-- Optional. The test implementation contract of the build: what the acceptance tests call (driver functions, fields) and the fixtures with their self-tests. Created when the implementation first needs a driver or fixture, and extended as later work needs more; it is not built in advance. Checked in the PRs that change it (test-strategy.md "Checks"). It follows the design and never limits it: a criterion that needs a function, a field or a fixture the contract lacks extends the contract. A risk that a fixture or runner cannot run, or passes without proving anything, is a row of "Testing risks" in testing-plan.md, not of this file. -->

## At a glance

- **Status:** _draft_
- **Criteria:** [acceptance-criteria.md](../testing/design/acceptance-criteria.md) · **Mechanisms:** [test-analysis.md](../testing/analysis/test-analysis.md) "Automation feasibility"

## Test driver and fixtures

<!-- Test implementation contract. Build-specific only. The general rules (driver contract, NotWiredError, positive control, no silent skip, isolation) are in test-strategy.md "Test infrastructure rules"; do not restate them.
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

## Test tickets

<!-- Only when tests are handed off as separate tickets (skill ticket-writer); remove this section otherwise. One concern per ticket, kept small (checklist C8). A ticket is never a prerequisite for implementing a behavior whose design exists. -->

| Ticket | Criteria | Files | Fixtures | Blocked by |
|---|---|---|---|---|
| T0 · test driver | — | `tests/acceptance/support/...` | — | — |
| T1 · name | FR-NNN AC-1..3 | `tests/acceptance/...` | | T0 |
