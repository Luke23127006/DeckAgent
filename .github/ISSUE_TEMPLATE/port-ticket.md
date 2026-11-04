---
name: Port ticket
about: Move legacy code into a workflow build, against tests that already exist.
title: "Port: "
labels: phase:impl, legacy:port
---

## Context

<!-- Rules: WORKFLOW.md "Legacy source". The tests come first; the legacy code is
     input, not the definition of done. -->

**Version:** vN (milestone)
**Use case:** UC-XXX
**FR / AC:** FR-NNN / AC-N
**Decisions:** DEC-NNN (link to dev/decisions/)
**Plan step:** Step N of dev/versions/vN/builds/UC-XXX-label/implementation-plan.md
**Drift inventory:** link to the rows in research-checklist.md that this port follows
**Test author:** @handle — must not be the assignee (separation rule)
**Flow tracker:** #N

### Legacy source

<!-- Read legacy code at a pinned commit, never at a branch head. -->

- **Branch and commit:** `feat/v2-opencode` @ `<sha>`
- **Files to port from:**
  - `apps/.../file.ts` — what it does, which part to take

### LLM boundary

<!-- From the plan's LLM boundary table. A legacy model call the plan marks as code is
     NOT ported as a model call. -->

- Model call: none / at {step}, input {…}, decides {…}
- Prebuilt assets to use: {theme / layout / renderer, with path}

### Existing files

- `path/to/file.ts` — what it contains

## Task

### Create / modify

- **File:** `path/in/the/plan.ts`
- **Function:** `functionName(param: Type): ReturnType`
- **Behavior:** what the function does, in one or two sentences

## Tests to pass

```bash
node --test <test file>
```

**Specific tests:**
- [ ] `tests/acceptance/...` — AC-N description

## Do NOT carry

<!-- Legacy behavior the PO ruled out in the drift inventory: bugs, unspecified
     behavior, unwanted behavior. Name each one. -->

- {behavior} — {reason: bug / not in spec / dropped}

## Do NOT

- Do not modify files outside the listed paths.
- Do not modify any test in `tests/acceptance/` or `tests/eval/` (locked).
- Do not modify any spec file or any file in `dev/legacy/`.
- Do not port legacy code that is not listed above.
- Do not call the model where the LLM boundary above says none.
- Do not add dependencies not listed here.

## Acceptance

- [ ] All listed tests pass
- [ ] No other tests broken
- [ ] Maximum 3 files changed
- [ ] Nothing from "Do NOT carry" is present

## Blocked by

- #N (test stub)
- #N (other module)
