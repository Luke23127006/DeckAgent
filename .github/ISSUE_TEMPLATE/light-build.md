---
name: Light build
about: A bug fix or a small change to an existing FR (dev/mvp/WORKFLOW.md "Build sizes").
title: "Light: "
labels: build:light
---

## Context

**Milestone:** mvp
**FR / AC:** FR-NNN / AC-N (existing or new; statement in `dev/mvp/spec/`, criterion written in this issue)
**Tier:** ci / eval / manual
**Matrix row:** dev/mvp/builds/_light/traceability-matrix.md

## Problem

<!-- Observed vs expected. For a bug: steps to reproduce. -->

## Test

<!-- The test that fails now and passes after the fix. Path and what it checks.
     The PO approves the test before the fix merges. The same developer may write both. -->

`tests/...`

```bash
npm test -- --grep "FR-NNN"
```

## Fix

- **File(s):** `src/...` (at most 3)
- **Change:** one or two sentences

## Do NOT

- Do not modify files outside the listed paths.
- Do not modify locked tests other than the one named above.
- Do not modify any spec file.

## Acceptance

- [ ] Test approved by the PO
- [ ] Test was red before the fix and is green after
- [ ] No other tests broken
- [ ] Matrix row added
