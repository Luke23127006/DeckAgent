---
name: Test ticket (ahead of code)
about: A test or eval cases handed off on their own, written before the behavior exists. Usually tests are written with the code instead.
title: "Test: "
labels: ""
---

## Context

**Milestone:** mvp
**Use case:** UC-XXX
**FR / AC:** FR-NNN / AC-N (criterion text where it lives: a build's `acceptance-criteria.md`, an issue, or below)
**Tier:** ci / eval <!-- also set the label tier:ci or tier:eval -->

> The **author of this test** should preferably **not implement FR-NNN** (dev/mvp/WORKFLOW.md "Tests and code"). A teammate **reviews the test against its criterion**; a later change to it **says why in its PR**.

## Test type

<!-- One of: acceptance, security (tier ci) · eval cases and rubric (tier eval) -->

## What to test

<!-- The defect the test catches, and the criterion's Given / When / Then by id. Do not restate requirement text that lives elsewhere. -->

## Test file

`tests/...`

## Model

<!-- ci: which recorded fixture or mock replaces the model (no real model call in CI).
     eval: the real model is used; name the cases and the rubric file. -->

## Acceptance

- [ ] ci: the test **runs and fails on a real assertion** (an expected failure, `it.fails`), **not a syntax or wiring error**
- [ ] eval: **cases and rubric cover every item** of the criterion's Then
- [ ] **Reviewed** by a teammate against its criterion

## Blocked by

<!-- Only what must be merged first. Remove if none. -->
