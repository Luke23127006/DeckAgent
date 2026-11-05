---
name: Post-implementation test ticket
about: A test that runs after implementation is complete.
title: "Test: "
labels: phase:post-impl
---

## Context

**Milestone:** mvp **Use case:** UC-XXX **Testing plan:** dev/mvp/builds/UC-XXX-label/testing-plan.md **Flow tracker:** #N

## Test type

<!-- One of: e2e, smoke, recovery/resilience, regression, performance -->

## What to test

<!-- The scenario being verified. Reference UC steps or alternatives. -->

**UC steps / alternative:** S1-S6 / A-N

## Preconditions

<!-- What must be true before the test runs. -->

## Steps

<!-- Ordered steps the test performs. -->

1. ...
2. ...
3. ...

## Expected result

<!-- What a passing test looks like. Observable outcomes. -->

## Test file

`tests/...`

## Acceptance

- [ ] Test file exists
- [ ] Test passes against the implemented code
- [ ] Test fails when the tested behavior is broken (not a tautology)

## Blocked by

<!-- Implementation tickets that must be merged before this test can run. -->

- #N (module)
