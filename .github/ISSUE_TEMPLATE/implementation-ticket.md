---
name: Implementation ticket
about: A single implementation task for a flash model or agent to complete.
title: "Impl: "
labels: phase:impl, flash-ready
---

## Context

<!-- What already exists that the implementer needs to know.
     Include file paths and brief descriptions. Not "see the codebase". -->

**Milestone:** mvp
**Use case:** UC-XXX
**FR / AC:** FR-NNN / AC-N
**Decisions:** DEC-NNN (link to dev/mvp/decisions/)
**Plan step:** Step N of dev/mvp/builds/UC-XXX-label/implementation/implementation-plan.md
**Test author:** @handle — preferably not the assignee
**Flow tracker:** #N

### LLM boundary

<!-- From the plan's LLM boundary table: does this ticket's code call the model?
     "No model call" unless the plan says so. -->

- Model call: none / at {step}, input {…}, decides {…}
- Prebuilt assets to use: {theme / layout / renderer, with path}

### Existing files

<!-- List files the implementer needs to read or depend on. -->

- `path/to/file.ts` — what it contains

### Reference code

<!-- Only when the plan step names one (dev/mvp/WORKFLOW.md "Reference code"). Read it to understand; write new code against the tests. Omit if empty. -->

- `feat/v2-opencode` @ `{commit}`: `path/to/file.ts` — what to learn from it

## Task

<!-- Exactly what to create or change. File paths, function signatures, types. -->

### Create / modify

- **File:** `src/...`
- **Function:** `functionName(param: Type): ReturnType`
- **Behavior:** what the function does, in one or two sentences

## Tests to pass

<!-- The command that proves this ticket is done. -->

```bash
npm test -- --grep "FR-NNN"
```

**Specific tests:**
- [ ] `tests/.../test-file.ts` — AC-N description

## Do NOT

<!-- Explicit boundaries. What the implementer must NOT touch, refactor, or change. -->

- **Do not modify files outside the listed paths**.
- **Do not weaken any test** in `tests/acceptance/` or `tests/eval/`; a needed change **says why in the PR**.
- **Do not modify any spec file**.
- **Do not call the model** where the **LLM boundary above says none**.
- **Do not add dependencies** not listed here.
- **Do not refactor existing code**.
- **Do not copy reference code wholesale**; **do not modify the legacy code**.

## Acceptance

- [ ] **All listed tests pass**
- [ ] **No other tests broken**
- [ ] **The change stays within the listed files**
- [ ] **Type checks pass** (`npm run typecheck` or equivalent)

## Blocked by

<!-- Prerequisite tickets that must be merged before starting this one. -->

- #N (test stub)
- #N (other module)
