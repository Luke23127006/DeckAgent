---
name: Test stub ticket
about: Write a test (pre-implementation) or eval cases that define expected behavior.
title: "Test stub: "
labels: phase:test-stubs
---

## Context

**Milestone:** mvp
**Use case:** UC-XXX
**FR / AC:** FR-NNN / AC-N (criterion text in the build's `testing-plan.md`)
**Tier:** ci / eval <!-- also set the label tier:ci or tier:eval -->
**Testing plan:** dev/mvp/builds/UC-XXX-label/testing-plan.md (row AC-N)
**Flow tracker:** #N

> The **author of this ticket's test must not implement FR-NNN** (separation rule, dev/mvp/WORKFLOW.md "Phase 4"). The **PO approves the test before it merges**; once merged it is **locked**.

## Test type

<!-- One of: acceptance, security (tier ci) · eval cases and rubric (tier eval) -->

## What to test

<!-- Copy the "Checks" cell of the testing plan row. Reference the AC's Given / When / Then by id; do not restate it. -->

## Test file

<!-- Exact path. ci: tests/acceptance/... or tests/security/...  eval: tests/eval/... -->

`tests/...`

## Model

<!-- ci: which recorded fixture or mock replaces the model (no real model call in CI).
     eval: the real model is used; name the cases and the rubric file. -->

## Skeleton

<!-- ci: describe/it blocks with assertions. The test must RUN (red) but not PASS.
     eval: case inputs and rubric criteria with the pass threshold from the testing plan. -->

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
