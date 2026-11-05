---
name: testing-plan
description: Generate a testing plan from FRs, NFRs and decisions. Drafts the acceptance criteria of each in-scope FR and the measures of each in-scope NFR, assigns each a tier (ci, eval, manual), a test type and a phase. Identifies security, resilience, performance, and E2E test needs. Used at the start of Phase 2.
---

# Testing plan

Draft the testing plan for a build. The PO owns and approves it, including its acceptance
criteria; developers write the tests from it; the PO approves each test before it is
locked (dev/mvp/WORKFLOW.md "Phase 2").

## Input

1. The use case file: `dev/mvp/spec/02-use-cases/UC-XXX.md`
2. Every in-scope FR and NFR in `dev/mvp/spec/03-requirements/`, and the BRs they cite.
3. Decisions from Phase 1: `dev/mvp/decisions/DEC-*.md`
4. The research checklist and the matrix: `dev/mvp/builds/UC-XXX-label/`
5. `dev/mvp/spec/03-requirements/fr/_CRITERIA.md` and `nfr/_CRITERIA.md`: the rules a
   criterion and a measure meet.
6. Optional idea source: the legacy acceptance criteria of the same FR on the `docs/spec`
   branch at `71ff143`. They are not approved; the current statement wins.

The spec holds statements only. The acceptance criteria and measures are written here
(dev/mvp/WORKFLOW.md "Spec rules").

## Process

### Step 0 — Draft the acceptance criteria and measures

For each in-scope FR, write `AC-n` blocks in the plan's "Acceptance criteria" section:
Given, When, Then, Check. Each adds precision beyond the use case response (FRG-03): an
observable result, an input condition, an edge case, an invariant or error behavior. Use
the research answers and decisions of Phase 1. For an FR that an earlier build already
took, continue its AC numbering.

For each in-scope NFR, write `M-n` blocks in the "Measures" section. A target the PO has
not set reads `not set`; never guess a number.

Do not add behavior the statement lacks. If a criterion needs one, flag it: the PO adds
it to the spec first.

### Step 1 — Assign a tier to each AC

Default from each criterion's `Check` field:

- `deterministic` → **ci**: an automated test; the model is replaced by a recorded
  fixture or a mock. Name the fixture.
- `evaluation` → **eval**: fixed cases against a real model, scored by a rubric. The
  rubric scores exactly what the AC's Then says. Propose a pass threshold.
- Only a person can judge it (visual quality, feel) → **manual**: describe what the PO
  checks and how.

Flag any AC whose tier looks wrong (for example, a deterministic check that needs a real
model) instead of silently changing it. The PO decides.

### Step 2 — Map ACs to test types

- Pure validation logic → unit test (with implementation)
- Security-related (SSRF, input validation, data leaving the machine) → security test
  (pre-implementation)
- External integration (model provider, file system, runtime) → integration test
  (post-implementation)

For each ci-tier acceptance or security test, write the **Checks** cell: what the test
asserts, in one line. It must let a developer write the test and the PO review it against
the AC without reading anything else.

### Step 3 — Identify UC-level tests

- **E2E test:** UC happy path (all S steps in order)
- **E2E tests:** each alternative flow that reaches a different end state
- **Smoke tests:** minimal checks that prove the build works
- **Recovery/resilience tests:** each alternative flow with a failure condition

### Step 4 — Identify NFR tests

- An NFR with a measurable target → performance test with the target as the assertion.
- An NFR describing a behavior → E2E or integration test.

### Step 5 — Phase assignment

| Test type | Tier | Written | Ticket created in |
|---|---|---|---|
| Acceptance, security | ci | Before implementation | Phase 2 (`phase:test-stubs`) |
| Eval cases and rubric | eval | Before implementation | Phase 2 (`phase:test-stubs`) |
| Manual check | manual | Listed in the plan only | — |
| Unit | ci | With implementation | Phase 4 impl tickets |
| Integration, recovery | ci | After the modules they test | Phase 4 (`phase:post-impl`) |
| E2E, smoke, performance | ci | After all implementation | Phase 4 (`phase:post-impl`) |

## Output

Create `dev/mvp/builds/UC-XXX-label/testing-plan.md` from
`dev/mvp/templates/testing-plan.md`.

For each acceptance and security test, fill the **DEC column** with the decision that
shaped it (if any), so a changed decision points to the tests to revisit.

Then update `traceability-matrix.md`: split each FR row into one row per AC and each NFR
row into one row per measure, fill the Tier column, and put each test on its row's Test
column.

Follow dev/mvp/WORKFLOW.md "Document rules": front-load `## At a glance`, keep the template's
section order, reference each AC by id and matrix row — do not copy requirement text.

## Rules

- Every in-scope AC appears in the plan with exactly one tier. No AC is skipped.
- **No orphan (dev/mvp/WORKFLOW.md "Traceability"):** every in-scope FR/AC and NFR has at least
  one test, and every in-scope DEC is consumed by at least one test or implementation
  step. Flag gaps.
- Every UC alternative with a failure condition gets a resilience test.
- Do not invent test scenarios beyond what the spec statements and the approved criteria
  define.
- No ci-tier test calls a real model.
- Pre-implementation ci tests must run red — failing on a real assertion, not a syntax
  error.
- The agent drafts; it does not approve tests or close the Phase 2 gate.
