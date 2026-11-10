---
name: Small change
about: A bug fix or a small change to an existing FR, tracked by this one issue when it needs an issue at all.
title: "Fix: "
labels: ""
---

## Context

**Milestone:** mvp
**FR / AC:** FR-NNN / AC-N (statement in `dev/mvp/spec/`; the criterion may be written here)
**Tier:** ci / eval / manual

## Problem

<!-- Observed vs expected, with the source of the expected behavior. For a bug: steps to reproduce. -->

## Test

<!-- The regression test, built from the reproduction: it fails now and passes after the fix. Path and what it checks. -->

`tests/...`

## Fix

- **File(s):** `src/...`
- **Change:** one or two sentences

## Do NOT

- **Do not modify files outside the listed paths**.
- **Do not weaken other tests**; a change to one says why in the PR.
- **Do not modify any spec file**.

## Acceptance

- [ ] The regression test was **red before the fix** and is **green after**
- [ ] **No other test broken**
