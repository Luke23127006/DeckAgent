---
name: Test stub ticket
about: Write a test (pre-implementation) or eval cases that define expected behavior.
title: "Test stub: "
labels: phase:test-stubs
---

## Context

**Milestone:** mvp
**Use case:** UC-XXX
**FR / AC:** FR-NNN / AC-N (criterion text in the build's `testing/design/acceptance-criteria.md`)
**Tier:** ci / eval <!-- also set the label tier:ci or tier:eval -->
**Acceptance criteria:** dev/mvp/builds/UC-XXX-label/testing/design/acceptance-criteria.md (AC-N); **contract:** dev/mvp/builds/UC-XXX-label/implementation/test-implementation.md
**Flow tracker:** #N

> The **author of this test** should preferably **not implement FR-NNN** (dev/mvp/WORKFLOW.md "Phase 2"). A teammate **reviews the test against its AC**; a later change to it **says why in its PR**.

## Test type

<!-- One of: acceptance, security (tier ci) · eval cases and rubric (tier eval) -->

## What to test

<!-- Copy the "Catches" line of the AC in acceptance-criteria.md. Reference the AC's Given / When / Then by id; do not restate it. -->

## Test file

<!-- Exact path. ci: tests/acceptance/... or tests/security/...  eval: tests/eval/... -->

`tests/...`

## Model

<!-- ci: which recorded fixture or mock replaces the model (no real model call in CI).
     eval: the real model is used; name the cases and the rubric file. -->

## Skeleton

<!-- ci: describe/it blocks with assertions. The test must RUN (red) but not PASS.
     eval: case inputs and rubric criteria with the pass threshold from acceptance-criteria.md ("Eval cases"). -->

```typescript
// Example — replace with actual skeleton
describe('FR-NNN: title', () => {
  it('AC-N: description', () => {
    // Arrange: ...
    // Act: ...
    // Assert: ...
    throw new Error('Not implemented');
  });
});
```

## Acceptance

- [ ] **Test file exists** at the specified path
- [ ] ci: test **runs and fails (red) on a real assertion**, **not a syntax error**
- [ ] eval: **cases and rubric cover every item** of the AC's Then
- [ ] Test **matches the testing plan row**
- [ ] **Approved by the PO**

## Blocked by

<!-- Prerequisite tickets. Research decisions that affect the test shape. -->
