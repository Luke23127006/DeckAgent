---
name: Integration or E2E test ticket
about: A test handed off on its own, for code that already exists (integration, E2E, smoke, recovery, regression, performance).
title: "Test: "
labels: ""
---

## Context

**Milestone:** mvp
**Use case:** UC-XXX
**Design:** {link to the existing design of this flow, when there is one}

## Test type

<!-- One of: integration, e2e, smoke, recovery/resilience, regression, performance -->

## What to test

**UC steps / alternative:** S1-S6 / A-N

## Preconditions

## Steps

1. ...

## Expected result

<!-- Observable outcomes, from the spec. -->

## Test file

`tests/...`

## Acceptance

- [ ] Test **passes against the implemented code** (it may pass on its first run)
- [ ] Test **fails when the tested behavior is broken** (not a tautology)

## Blocked by

<!-- Code that must be merged before this test can run. Remove if none. -->
