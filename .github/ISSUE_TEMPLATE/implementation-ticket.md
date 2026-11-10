---
name: Implementation ticket
about: A task handed to a teammate or a flash model. Ordinary work does not need one to start.
title: "Impl: "
labels: ""
---

## Context

<!-- What already exists that the implementer needs to know. Include file paths and brief descriptions. Not "see the codebase". Remove the lines that do not apply. -->

**Milestone:** mvp
**Use case:** UC-XXX
**FR / AC:** FR-NNN / AC-N
**Decisions:** DEC-NNN (link to dev/mvp/decisions/)

### Expected behavior and verification

<!-- The behavior in words and its source (spec item, decision, existing behavior, reproduction). Then how it is verified: link the existing design (for example a build's acceptance-criteria.md or a technique file), or state the cases here (input, expected result). Note the cases left out because a ruling is pending. -->

### LLM boundary

<!-- Does this code call the model? "No model call" unless an approved LLM boundary says so. Remove if not applicable. -->

- Model call: none / at {step}, input {…}, decides {…}
- Prebuilt assets to use: {theme / layout / renderer, with path}

### Existing files

- `path/to/file.ts` — what it contains

### Reference code

<!-- Only when the work follows reference code (dev/mvp/WORKFLOW.md "Reference code"). Read it to understand; write new code against the tests. Remove if empty. -->

- `feat/v2-opencode` @ `{commit}`: `path/to/file.ts` — what to learn from it

## Task

<!-- Exactly what to create or change. File paths, and the signatures and types another part depends on. -->

- **File:** `src/...`
- **Behavior:** what the code does, in one or two sentences

## Tests to pass

```bash
pnpm test -- FR-NNN
```

## Do NOT

- **Do not modify files outside the listed paths**.
- **Do not weaken any test**; a needed change **says why in the PR**.
- **Do not modify any spec file**.
- **Do not call the model** where the **LLM boundary above says none**.
- **Do not add dependencies** not listed here.
- **Do not copy reference code wholesale**; **do not modify the legacy code**.

## Acceptance

- [ ] **The tests above pass**, and **no other test breaks**
- [ ] **The evidence and residual risks** are stated in the PR

## Blocked by

<!-- Only what must be merged first. Remove if none. -->
