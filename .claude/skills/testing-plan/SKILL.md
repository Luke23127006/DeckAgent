---
name: testing-plan
description: Generate the test analysis (Gate 1), the testing plan (Gate 1 and Gate 2) and the test design specification (Gate 2) from FRs, NFRs and decisions, by applying dev/development/test-strategy.md. Lists the test basis, selects the test types, records the automation feasibility, sets each item's risk level, picks the technique and coverage criterion per kind of requirement, drafts the acceptance criteria and measures with a tier and a Catches line, plans the test driver, fixtures, post-implementation tests and test-stub tickets, and runs the technical checklist C1–C8. Used at the start of Phase 2.
---

# Testing plan

**Draft the test analysis**, the **testing plan** of a build and its **test design specification**. The **PO owns and approves all three**, including the risk levels, the acceptance criteria and every ruling; **developers write the tests** from the plan; the **PO approves each test before it is locked** (dev/mvp/WORKFLOW.md "Phase 2").

The plan **applies** `dev/development/test-strategy.md`. It **does not invent a method** and **does not restate the strategy's rules**; it **points to them**.

## Input

1. `dev/development/test-strategy.md`: the frame, the chain, risk and depth, test types and approaches, the test basis register, technique per requirement and how it is applied, coverage, automation feasibility, gates, infrastructure rules, shared error list, technical checklist.
2. The use case file: `dev/mvp/spec/02-use-cases/UC-XXX.md`
3. Every in-scope FR and NFR in `dev/mvp/spec/03-requirements/`, and the BRs they cite.
4. Decisions from Phase 1: `dev/mvp/decisions/DEC-*.md`
5. The research checklist and the matrix: `dev/mvp/builds/UC-XXX-label/`
6. `dev/mvp/spec/03-requirements/fr/_CRITERIA.md` and `nfr/_CRITERIA.md`: the rules a criterion and a measure meet.
7. `dev/mvp/builds/_STYLE.md`: build files are **Vietnamese prose with English terms**.
8. **Optional idea source**: the **legacy acceptance criteria** of the same FR on the `docs/spec` branch at `71ff143`. They are **not approved**; the **current statement wins**.
9. **Candidate gaps** from earlier reviews. They are **inputs to the register**, not findings: **check each with the technique**; never add a test case only because a gap was listed.

## Output

- `dev/mvp/builds/UC-XXX-label/test-analysis.md` from `dev/mvp/templates/test-analysis.md` (**Gate 1**).
- `dev/mvp/builds/UC-XXX-label/testing-plan.md` from `dev/mvp/templates/testing-plan.md`: the **approach sections** (Gate 1), the **acceptance criteria and measures** (Gate 2).
- `dev/mvp/builds/UC-XXX-label/test-design.md` from `dev/mvp/templates/test-design.md` (**Gate 2**).
- The **updated** `traceability-matrix.md`.

**Keep each template's section order** and **front-load `## At a glance`** (dev/mvp/WORKFLOW.md "Document rules"). **Scope rulings** (which items are `excluded` or `deferred`) and the **rulings on ambiguities** live **only in test-analysis.md**; **gaps, deviations and the design rulings** live **only in test-design.md**. The plan states a ruling's **result as current fact**. A ruling the PO has not given reads **`pending`**.

## Process

### Part A — Gate 1: scope and approach

#### Step 1 — Test basis register

List every **basis item** of the in-scope spec in `test-analysis.md`: **cut each spec text into units**, **classify each unit** (normative, explanatory, definition), **cut the normative ones** into items by the rules in the strategy's "Test basis register", give each item a **kind**, an **ID**, a **scope** (`to test`, `excluded`, `deferred`) and an **approval** (`approved`, `pending`), and flag **ambiguities**. **Classify by the content of the unit, never by its scope**: a behavior that a spec outside the build owns stays **normative**, and its item is `deferred`. **Split** an item that mixes behaviors of different scope. Write the **sentence map** (every unit, its locator, its class, its items) and **recount from it**: the unmapped normative units are **0**. A **closed list inside a BR value** is **one item**; its members are **test data**. Give each `excluded` or `deferred` item a **scope ruling** (reason, build, ruling); mark its approval **`pending`** when the PO has not ruled, and keep it in the coverage denominator until then. Compare UC steps and alternatives, FRs and BR values: **each mismatch is a candidate gap**, recorded with **why it is fine** or **raised to the PO**.

#### Step 2 — Risk level per item

For each in-scope FR and NFR, **propose `high` or `normal`** by the strategy's "Risk and depth" table, with a **one-line reason**. The **PO sets the level**; an item **without a level is high**. Add the **quality risks** that no statement names, found by asking what the system **does with the user's files, the provider, the disk and the platform**.

#### Step 3 — Test types

One row per **test type** in the quality risk and type record: **selected** (with its source: a statement, a quality risk, a trait of the system) or **not selected** (with the reason), the **oracle status** (`asserted` or `recorded-only`) and the **approach** (scripted automated, scripted manual, exploratory). **Security gets one row per aspect.** Never leave a type without a row. A `recorded-only` type **names its measurement** (operation, metric, conditions); the **duration of a whole test run** is **not** a measurement. Without one, the type is **not selected** and the quality stays a **candidate quality risk** for the PO to rule.

#### Step 4 — Automation feasibility

One row per **mechanism** a test depends on (a fixture, an audit, a runner or CI condition): **what needs it**, its **status** (`verified`, `assumed`, `blocked`, `not applicable`), the **evidence or basis**, and **what happens to the tests if it is not verified**. **Do not run a spike without the PO's approval**; a fixture self-test that is green on CI is the usual proof.

#### Step 5 — Approach, levels, targets

In `testing-plan.md`, write the **"Kinds and techniques"** cell of the At a glance table (**one sentence per kind**, naming its technique), then the **test approach**: the **level** of each group of items, the **coverage targets** and the **exit criteria**, the **environment**. Then the **testing risks** (what could stop a test from running or let it pass without proving anything; **link the mechanism rows** of `test-analysis.md`, **do not restate their status**) and the **post-implementation tests**: one row per **E2E** test for the **main flow** and **each alternative** reaching a **different end state**, and per **integration** test an NFR measure needs (fault injection, timing); **point to the measure**, do not restate its target; **mark the smoke subset**. The **risk level** decides which techniques **apply**; the **coverage criterion** of each applied technique sets the **required count**. **Stop here**: the **PO decides Gate 1** before Part B starts.

### Part B — Gate 2: test design

#### Step 6 — Write the test design specification

Write `test-design.md` (strategy "Test design specification"). **Start with "Techniques applied"**: one row per technique the plan applies, with the **basis items** it covers, **why** it is selected (kind of requirement, risk level), its **coverage criterion** and its **coverage item count**. Then **one section per applied technique**, in the template's order; **delete the sections of techniques the build does not apply**. For each, **follow its steps** in the strategy's "How a technique is applied" and **keep the evidence in its section**:

- **Use case testing:** the **main flow** and each **alternative** reaching a **different end state**, with that end state.
- **State transition:** the **states and events** from the spec; **one diagram per lifecycle**, arrows numbered, **refused events included**; one row per arrow; then the **state × event matrix**: **fill every cell** with a code and a few words, a **"—" with the reason** the event cannot happen, or a **Z-n** gap. **Use the matrix to find gaps**: check each "—" really cannot happen, and each code really starts in that state.
- **Decision table:** the **conditions and actions**, every **rule** (a table, or a tree with **one outcome per leaf**), the **infeasible combinations** with the statement that excludes them, each **merge with its argument**; **define the terms** the conditions use.
- **EP + BVA:** the **variables** and **sub-variables** (counting unit, encoding, normalization, trimming), the **partitions**, the **boundaries** with their **three values**.
- **Invariant check:** each **"never" statement**, the **area** it is asserted in, its **positive control**.
- **Threat-based:** **assets**, **trust boundaries**, **entry points**, **threat scenarios**, each **screened** as kept or not feasible with the reason.
- **Fault injection:** **injection points** and **failure modes**, each with **its reason**, and the **state checked** after restart or retry.
- **Performance** (only when selected): the **operation**, the **workload conditions**, the **metric**, the target or `not set`.

**Every arrow, cell, rule, partition, boundary, invariant, scenario and injection point is a condition** with a **code unique in the file**, its **basis items** and its **AC with the test cases** (independent variants) that check it. A condition row in prose follows `dev/mvp/builds/_STYLE.md` "Sentences": **When** (the situation and the action), **DeckAgent must** (one full sentence per check), **Defect the test catches** (each sentence starts with "DeckAgent"). A condition **without an AC** points to a **"Z-n · no AC"** node or cell and becomes a **gap**. A question the **spec does not answer** is a **gap** too: **never answer it in a criterion** (strategy "Rule from the spec only"). **Never turn a candidate gap into a test case** without deriving it with the technique.

#### Step 7 — Acceptance criteria and measures

For each in-scope FR, **write `AC-n` blocks**: **Given, When, Then, Catches, Serves, Check, Tier**. Each **adds precision beyond the use case response** (FRG-03). **One criterion may serve several arrows, leaves or classes**; **every condition** gets **at least one**. **`Serves`** lists the **basis items** and the **condition codes** of the criterion. **One AC may hold several variants**; list them, because **each independent variant is its own test case** (strategy "Test infrastructure rules"). For an FR an **earlier build already took**, **continue its AC numbering**.

- **Catches** names the **wrong DeckAgent behavior** the test fails on. **Apply the shared error list** to every matching criterion.
- **Input ranges:** test **every partition** and **each boundary at, below and above**.
- **Invariants:** assert **after every action** of the area; the audit has a **positive control**.

For each in-scope NFR, **write `M-n` blocks** with the technique of its NFR kind. A target the PO has not set **reads `not set`**; **never guess a number**. For fault injection, **record each injection point and failure mode with its reason**.

**Do not add behavior the statement lacks**: **flag it as a gap**.

#### Step 8 — Tier

**Default** from `Check`: `deterministic` → **ci** (the **model is replaced** by a recorded fixture or a mock); `evaluation` → **eval** (fixed cases, a rubric that scores **exactly the Then**, a **proposed pass threshold**); **only a person can judge it** → **manual** (what the PO checks and how). **Flag a tier that looks wrong** instead of changing it.

#### Step 9 — Test driver and fixtures

List the **driver functions** the criteria call, the **fields** they assert, and each **fixture** with **what it sets up** and **its self-test**. **Only build-specific content**; the general rules stay in the strategy. A fixture, runner or CI condition that **could stop a test** or **let it pass without proving anything** is a row of **"Testing risks"** (Step 5), not of this section.

#### Step 10 — Exploratory charters

List the **exploratory charters** (scope, time box) when a type uses that approach.

#### Step 11 — Test-stub tickets

Group the ci-tier criteria into tickets: **one concern**, **at most 3 files**, **blocked only by named tickets**. **T0 tickets** build the driver and the fixtures and **carry no criterion**. A ticket's test command shows **each variant** of its AC as **its own case**.

#### Step 12 — Count and check

- Fill **"Planned coverage"** per item: **coverage items with a test case** / items **the risk level requires**, with the **`excluded` and `deferred` counts beside** the ratio. It is a **plan, not a test result**. Each **unmet criterion** is a **deviation** in test-design.md, with its reason.
- Run the **link rules** of the strategy (AC → basis item, condition → basis item, test case → condition, basis item → condition and test case or a status with a ruling).
- Run the **technical checklist C1–C8** on every criterion and ticket. Each **failure** is fixed in the draft or listed in test-design.md as **kind `checklist`**.
- Fill the **counts** in the At a glance blocks.

#### Step 13 — Matrix

**Split each FR row into one row per AC** and **each NFR row into one row per measure**, **fill the Tier**, the **basis items and conditions**, the **DEC that shaped the row**, and the **test-stub ticket** in the Test column. List the **`excluded` and `deferred` items** apart.

## Rules

- **Every in-scope AC appears** with **exactly one tier**. **No AC is skipped**.
- **Do not start Part B before the PO approves Gate 1.**
- **No orphan (dev/mvp/WORKFLOW.md "Traceability"):** every in-scope FR/AC and NFR has **at least one test**, and every in-scope DEC is **consumed by at least one test or implementation step**. **Flag gaps**.
- **Do not invent test scenarios** beyond what the **spec statements and the approved criteria** define; a technique **finds gaps**, it **does not fill them**.
- **No ci-tier test calls a real model**.
- **Pre-implementation ci tests are expected failures** (`it.fails`) that **can fail on a real assertion**, **one per independent variant**; the **implementation PR's first commit** shows it (strategy "Test infrastructure rules", checklist C5).
- The agent **drafts and proposes**; it **does not set a risk level, rule a gap, approve a test** or **close a gate**.
