---
name: testing-plan
description: Generate a testing plan and its review-flows view from FRs, NFRs and decisions, by applying dev/development/test-strategy.md. Sets each item's risk level, picks the technique and coverage criterion per kind of requirement, drafts the acceptance criteria and measures with a tier and a Catches line, plans the test driver, fixtures, post-implementation tests and test-stub tickets, and runs the technical checklist C1–C8. Used at the start of Phase 2.
---

# Testing plan

**Draft the testing plan** of a build and its **review-flows view**. The **PO owns and approves both**, including the risk levels, the acceptance criteria and every ruling; **developers write the tests** from the plan; the **PO approves each test before it is locked** (dev/mvp/WORKFLOW.md "Phase 2").

The plan **applies** `dev/development/test-strategy.md`. It **does not invent a method** and **does not restate the strategy's rules**; it **points to them**.

## Input

1. `dev/development/test-strategy.md`: risk and depth, technique per requirement, NFR kinds, infrastructure rules, shared error list, technical checklist.
2. The use case file: `dev/mvp/spec/02-use-cases/UC-XXX.md`
3. Every in-scope FR and NFR in `dev/mvp/spec/03-requirements/`, and the BRs they cite.
4. Decisions from Phase 1: `dev/mvp/decisions/DEC-*.md`
5. The research checklist and the matrix: `dev/mvp/builds/UC-XXX-label/`
6. `dev/mvp/spec/03-requirements/fr/_CRITERIA.md` and `nfr/_CRITERIA.md`: the rules a criterion and a measure meet.
7. `dev/mvp/builds/_STYLE.md`: build files are **Vietnamese prose with English terms**.
8. **Optional idea source**: the **legacy acceptance criteria** of the same FR on the `docs/spec` branch at `71ff143`. They are **not approved**; the **current statement wins**.

## Output

- `dev/mvp/builds/UC-XXX-label/testing-plan.md` from `dev/mvp/templates/testing-plan.md`.
- `dev/mvp/builds/UC-XXX-label/review-flows.md` from `dev/mvp/templates/review-flows.md`.
- The **updated** `traceability-matrix.md`.

**Keep each template's section order** and **front-load `## At a glance`** (dev/mvp/WORKFLOW.md "Document rules"). **Gaps, deviations and rulings** live **only in review-flows.md**; the plan states a ruling's **result as current fact**.

## Process

### Step 1 — Risk level per item

For each in-scope FR and NFR, **propose `high` or `normal`** by the strategy's "Risk and depth" table, with a **one-line reason**. The **PO sets the level**; an item **without a level is high**.

### Step 2 — Kinds, techniques and coverage criteria

Read each item and the UC steps it serves for **its kinds**: use case flow, lifecycle, multi-condition rule, input range or format, invariant; for an NFR, its **NFR kind**. Write the **"Kinds and techniques"** cell of the At a glance table: **one sentence per kind**, naming its technique. The **risk level** decides which techniques **apply**; the **coverage criterion** of each applied technique sets the **required count**.

### Step 3 — Draw the review-flows view

- **One diagram per lifecycle or flow**: every **state** and **every event in every state**, **refused events included**; number the arrows.
- **One decision tree per multi-condition rule**: every **leaf** has **one outcome**; **define the terms** the conditions use.
- **Always-true box** for each invariant of the area.
- **One completeness check table** after the lifecycle diagrams: **every event** in a row, **every state** in a column. **Fill every cell** with an arrow code and a few words, a **"—" with the reason** the event cannot happen, or a **Z-n** gap. **Use the table to find gaps**: check each "—" really cannot happen, and each code really starts in that state.

Each arrow gets **one table row**: **When** (the situation and the action), **DeckAgent must** (one full sentence per check), **Defect the test catches** (each sentence starts with "DeckAgent"); follow `dev/mvp/builds/_STYLE.md` "Sentences". An arrow or a leaf **without a criterion** points to a **"Z-n · no criterion" node** and becomes a **gap**. A question the **spec does not answer** is a **gap** too: **never answer it in a criterion** (strategy "Rule from the spec only").

### Step 4 — Acceptance criteria and measures

For each in-scope FR, **write `AC-n` blocks**: **Given, When, Then, Catches, Check, Tier**. Each **adds precision beyond the use case response** (FRG-03). **One criterion may serve several arrows or leaves**; **every arrow and leaf** gets **at least one**. For an FR an **earlier build already took**, **continue its AC numbering**.

- **Catches** names the **wrong DeckAgent behavior** the test fails on. **Apply the shared error list** to every matching criterion.
- **Input ranges:** test **every partition** and **each boundary at, below and above**.
- **Invariants:** assert **after every action** of the area; the audit has a **positive control**.

For each in-scope NFR, **write `M-n` blocks** with the technique of its NFR kind. A target the PO has not set **reads `not set`**; **never guess a number**.

**Do not add behavior the statement lacks**: **flag it as a gap**.

### Step 5 — Tier

**Default** from `Check`: `deterministic` → **ci** (the **model is replaced** by a recorded fixture or a mock); `evaluation` → **eval** (fixed cases, a rubric that scores **exactly the Then**, a **proposed pass threshold**); **only a person can judge it** → **manual** (what the PO checks and how). **Flag a tier that looks wrong** instead of changing it.

### Step 6 — Test driver, fixtures and testing risks

List the **driver functions** the criteria call, the **fields** they assert, and each **fixture** with **what it sets up** and **its self-test**. **Only build-specific content**; the general rules stay in the strategy.

For each fixture, runner or CI condition, ask **what could stop a test from running** or **let it pass without proving anything**. Each such risk is a row of **"Testing risks"**: the **impact**, the **mitigation** (a self-test, a lock, a blocking ticket) and its **owner**.

### Step 7 — Post-implementation tests

One row per **E2E** test for the **main flow** and **each alternative** reaching a **different end state**, and per **integration** test an NFR measure needs (fault injection, timing). **Point to the measure**; do not restate its target. **Mark the smoke subset**.

### Step 8 — Test-stub tickets

Group the ci-tier criteria into tickets: **one concern**, **at most 3 files**, **blocked only by named tickets**. **T0 tickets** build the driver and the fixtures and **carry no criterion**.

### Step 9 — Count and check

- Fill **"Planned coverage"** per item: items **with a written criterion** / items **the risk level requires**. It is a **plan, not a test result**. Each **unmet criterion** is a **deviation** in review-flows.md, with its reason.
- Run the **technical checklist C1–C8** on every criterion and ticket. Each **failure** is fixed in the draft or listed in review-flows.md as **kind `checklist`**.
- Fill the **counts** in both At a glance blocks.

### Step 10 — Matrix

**Split each FR row into one row per AC** and **each NFR row into one row per measure**, **fill the Tier**, the **DEC that shaped the row**, and the **test-stub ticket** in the Test column.

## Rules

- **Every in-scope AC appears** with **exactly one tier**. **No AC is skipped**.
- **No orphan (dev/mvp/WORKFLOW.md "Traceability"):** every in-scope FR/AC and NFR has **at least one test**, and every in-scope DEC is **consumed by at least one test or implementation step**. **Flag gaps**.
- **Do not invent test scenarios** beyond what the **spec statements and the approved criteria** define; a technique **finds gaps**, it **does not fill them**.
- **No ci-tier test calls a real model**.
- **Pre-implementation ci tests are expected failures** (`it.fails`) that **can fail on a real assertion**; the **implementation PR's first commit** shows it (strategy "Test infrastructure rules", checklist C5).
- The agent **drafts and proposes**; it **does not set a risk level, rule a gap, approve a test** or **close the Phase 2 gate**.
