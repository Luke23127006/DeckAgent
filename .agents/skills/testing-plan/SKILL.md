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
5. The research checklist and the matrix: `dev/mvp/builds/UC-XXX-label/research/research-checklist.md`, `dev/mvp/builds/UC-XXX-label/testing/traceability-matrix.md`
6. `dev/mvp/spec/03-requirements/fr/_CRITERIA.md` and `nfr/_CRITERIA.md`: the rules a criterion and a measure meet.
7. `dev/mvp/builds/_STYLE.md`: build files are **Vietnamese prose with English terms**.
8. **Optional idea source**: the **legacy acceptance criteria** of the same FR on the `docs/spec` branch at `71ff143`. They are **not approved**; the **current statement wins**.
9. **Candidate gaps** from earlier reviews. They are **inputs to the register**, not findings: **check each with the technique**; never add a test case only because a gap was listed.

## Output

All paths below are under `dev/mvp/builds/UC-XXX-label/`; each file **owns one kind of fact**.

| File | Template | Owns | Gate |
|---|---|---|---|
| `testing/analysis/test-analysis.md` | `test-analysis.md` | Basis register, sentence map, scope rulings, quality risks, types, automation feasibility, ambiguities | 1 |
| `testing/planning/testing-plan.md` | `testing-plan.md` | **Planning decisions only**, each with its inputs and rule, and the **design inputs** | 1 |
| `testing/design/techniques/Dn-topic.md` | `test-design-technique.md` | The **evidence of one technique**: each step's output, coverage items, test cases, reconciliation | 2 |
| `testing/design/test-design.md` | `test-design.md` | Techniques applied with coverage counts; the **ruling log** of gaps, deviations and design rulings | 2 |
| `testing/design/acceptance-criteria.md` | `acceptance-criteria.md` | AC, measures, eval cases, manual checks, exploratory charters | 2 |
| `implementation/test-implementation.md` | `test-implementation.md` | Driver functions and fields, fixtures and self-tests, test-stub ticket list | per ticket |
| `testing/traceability-matrix.md` | `traceability-matrix.md` | The spine | — |

**Keep each template's section order** and **front-load `## At a glance`** (dev/mvp/WORKFLOW.md "Document rules"). **Scope rulings** and **rulings on ambiguities** live **only in test-analysis.md**; **gaps, deviations and design rulings** live **only in test-design.md**. A ruling's **result** is written **as current fact** into the file that owns it. A ruling the PO has not given reads **`pending`**. **Never write a fact into a file that does not own it**; link to its home.

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

In `testing-plan.md`, write the **test planning sections 1–9** in the template's order, applying the rules of the strategy's **"Planning decisions"** to the records of Steps 1–4: **derive each decision from the register, the quality risk and type record and the feasibility record only**; **never from drafted AC or test cases**, and never write a decision first and its reason after. **Objectives**: what the tests are for, the **evidence** of each at Gate 3, the **two roles** of the acceptance tests, and what is **outside** the objectives. **Items, risk and techniques**: first the **technique selection** (2.1): read the register **item by item**, one row per **item and kind** with the **rule** (P1–P5) and the technique it selects, and **check that the rows add up** to the `to test` count. A technique the kind does not select needs **its own source**: a selected type or quality risk (P4), or a **behavior trait** (P5) whose **words you quote**; **never change the register's kind** to justify a technique, and after Gate 1 a new selection is a **planning delta**. Then the **items** (2.2): one row per FR and NFR (plus BR and UC rows with the register's risk), the **basis item counts** from the approved scope, the **kinds**, the **techniques** of 2.1 and their **coverage criterion**; **no coverage item count** (that is Gate 2). Then the **design inputs** (2.3): one row per technique section with its **basis items**, **criterion and depth parameters**, **level and its rule**, **mechanisms**, **candidate gaps** and the **pending deltas that block it**; every mechanism a technique needs **has a feasibility row**, or its absence is a **delta**. Then the **test approach**: the **levels** (rules L1–L4), the **types by level** with the **items** each type's source names, the **quality risks by approach** with their **items** and the variable each adds, and the **five coverage targets** with denominators from the **approved scope**, never from a count of AC. Then the **environment**, the **dependencies** (what is resolved elsewhere and what it blocks), and the **entry and exit criteria** per testing activity. Then the **testing risks** (what could stop a test from running or let it pass without proving anything; **link the mechanism rows** of `test-analysis.md`, **do not restate their status**) and the **post-implementation tests**: one row per **E2E** test for the **main flow** and **each alternative** reaching a **different end state**, and per **integration** test an NFR measure needs (fault injection, timing); **point to the measure**, do not restate its target; **mark the smoke subset**. **After Gate 1 is approved**, a change to these sections, or a conflict with a Gate 1 decision, goes to **"Planning deltas for the PO"** with a proposal; **do not apply it** to the Gate 1 decision yourself. **AC and test cases written before Gate 2 are not coverage evidence.** The **risk level** decides which techniques **apply**; the **coverage criterion** of each applied technique sets the **required count**. **Stop here**: the **PO decides Gate 1** before Part B starts.

### Part B — Gate 2: test design

#### Step 6 — Apply each technique, one evidence file per design input

**The method comes before the result.** For each design input of the plan (section 2.3) **with no pending delta**, create `testing/design/techniques/Dn-topic.md` from `test-design-technique.md` and **keep only its technique's form**. Use the **capability skill** of the technique when one exists; otherwise **follow its steps** in the strategy's "How a technique is applied". **Keep the output of each step, in step order**: the intermediate results (variables, partitions, representatives, boundaries, conditions and rules, states, events and transitions, threats, injection points) **are the evidence**, not scaffolding to delete. **Derive from the basis items and the plan only**: **do not read the drafted AC, the drafted test cases or the pre-STLC design** until the reconciliation step, and **do not start from test cases you already have in mind** and fill the tables to fit them. Each output row **cites its basis item** or the earlier output it comes from, with the **reason** for each choice. **Fix the coverage items before writing test cases**, and **stop for the PO** where the design input asks. Each test case has its **input, preconditions, actions, expected result** (with its source) and the **coverage items** it exercises; how coverage items **combine in one case** follows the **technique's method** (its capability skill), not a rule common to all techniques. **End each file with the reconciliation table** (match, missing, conflict, unsupported); it is a final check, **not the success measure** of the design. **No technique is forced into another's form**, and a **diagram is optional**. Then update `test-design.md`: one row per design input with its **evidence file** and **coverage count**, and the **ruling log**. Per technique:

- **Use case testing:** the **main flow** and each **alternative** reaching a **different end state**, with that end state.
- **State transition:** the **states and events** from the spec; **one row per transition**, numbered, **refused events included** (a diagram only when it helps); then the **state × event matrix**: **fill every cell** with a code and a few words, a **"—" with the reason** the event cannot happen, or a **Z-n** gap. **Use the matrix to find gaps**: check each "—" really cannot happen, and each code really starts in that state.
- **Decision table:** the **conditions and actions**, every **rule** (a table, or a tree with **one outcome per leaf**), the **infeasible combinations** with the statement that excludes them, each **merge with its argument**; **define the terms** the conditions use.
- **EP + BVA:** the **inputs and variables** with the rules acting on each; the **domain analysis** (domains, **sub-variables** such as counting unit, encoding, normalization, trimming, and the **relations between variables**); the **partitions** with reason and expected behavior; the **boundaries** with their **three values**; the **coverage items** and what is not covered; the **representatives**; the **test cases**; the **reconciliation**.
- **Invariant check:** each **"never" statement**, the **area** it is asserted in, its **positive control**.
- **Threat-based:** **assets**, **trust boundaries**, **entry points**, **threat scenarios**, each **screened** as kept or not feasible with the reason.
- **Fault injection:** **injection points** and **failure modes**, each with **its reason**, and the **state checked** after restart or retry.
- **Performance** (only when selected): the **operation**, the **workload conditions**, the **metric**, the target or `not set`.

**Every arrow, cell, rule, partition, boundary, invariant, scenario and injection point is a condition** with a **code unique in the file**, its **basis items** and its **AC with the test cases** (independent variants) that check it. A condition row in prose follows `dev/mvp/builds/_STYLE.md` "Sentences": **When** (the situation and the action), **DeckAgent must** (one full sentence per check), **Defect the test catches** (each sentence starts with "DeckAgent"). A condition **without an AC** points to a **"Z-n · no AC"** node or cell and becomes a **gap**. A question the **spec does not answer** is a **gap** too: **never answer it in a criterion** (strategy "Rule from the spec only"). **Never turn a candidate gap into a test case** without deriving it with the technique.

#### Step 7 — Acceptance criteria and measures

In `testing/design/acceptance-criteria.md`, **after** the evidence files have fixed the conditions and test cases: an AC drafted earlier is **revised from the reconciliation**, never the reverse. For each in-scope FR, **write `AC-n` blocks**: **Given, When, Then, Catches, Serves, Variants, Check, Tier**. **An AC is not a test case**: it states what must hold; its **test cases** are its variants. Each **adds precision beyond the use case response** (FRG-03). **One criterion may serve several arrows, leaves or classes**; **every condition** gets **at least one**. **`Serves`** lists the **basis items** and the **condition codes** of the criterion. **`Variants`** lists **each test case** with its **label** (`V1`, `V2`…), its **input**, what it changes in the preconditions or actions, and its **coverage items**, as derived in the evidence file; the test case ID is the AC ID plus the label (strategy "The chain", "Test infrastructure rules"). BR items and UC flows are served **through the AC of the FRs** that exercise them; **every basis item** reaches an AC or a measure. For an FR an **earlier build already took**, **continue its AC numbering**.

- **Catches** names the **wrong DeckAgent behavior** the test fails on. **Apply the shared error list** to every matching criterion.
- **Input ranges:** test **every partition** and **each boundary at, below and above**.
- **Invariants:** assert **after every action** of the area; the audit has a **positive control**.

For each in-scope NFR, **write `M-n` blocks** with the technique of its NFR kind, with **`Serves`** (basis items, conditions) and **`Variants`** (each run condition, such as an injection point × failure mode, is a test case). A target the PO has not set **reads `not set`**; **never guess a number**. For fault injection, **record each injection point and failure mode with its reason**.

**Do not add behavior the statement lacks**: **flag it as a gap**.

#### Step 8 — Tier

**Default** from `Check`: `deterministic` → **ci** (the **model is replaced** by a recorded fixture or a mock); `evaluation` → **eval** (fixed cases, a rubric that scores **exactly the Then**, a **proposed pass threshold**); **only a person can judge it** → **manual** (what the PO checks and how). **Flag a tier that looks wrong** instead of changing it.

#### Step 9 — Test driver and fixtures

In `implementation/test-implementation.md`, list the **driver functions** the criteria call, the **fields** they assert, and each **fixture** with **what it sets up** and **its self-test**. **Only build-specific content**; the general rules stay in the strategy. The contract **follows the final AC**: an existing contract is a **baseline**, never a limit on the design; a criterion that needs a function, field or fixture it lacks **extends it**. A fixture, runner or CI condition that **could stop a test** or **let it pass without proving anything** is a row of **"Testing risks"** (Step 5), not of this section.

#### Step 10 — Exploratory charters

List the **exploratory charters** (scope, time box) in `acceptance-criteria.md` when a type uses that approach.

#### Step 11 — Test-stub tickets

In `implementation/test-implementation.md`, group the ci-tier criteria into tickets: **one concern**, **at most 3 files**, **blocked only by named tickets**. **T0 tickets** build the driver and the fixtures and **carry no criterion**. A ticket's test command shows **each variant** of its AC as **its own case**.

#### Step 12 — Count and check

- Fill **"Planned coverage"** per design input in test-design.md "Techniques applied", from each evidence file, and its total in the testing plan's At a glance: **coverage items with a test case** / items **the risk level requires**, with the **`excluded` and `deferred` counts beside** the ratio. It is a **plan, not a test result**. Each **unmet criterion** is a **deviation** in test-design.md, with its reason.
- Run the **link rules** of the strategy (AC → basis item, condition → basis item, test case → condition, basis item → condition and test case or a status with a ruling).
- Run the **technical checklist C1–C8** on every criterion and ticket. Each **failure** is fixed in the draft or listed in test-design.md as **kind `checklist`**.
- Fill the **counts** in the At a glance blocks.

#### Step 13 — Matrix

**Split each FR row into one row per AC** and **each NFR row into one row per measure**, **fill the Tier**, the **basis items and conditions**, the **DEC that shaped the row**, and the **test-stub ticket** in the Test column. List the **`excluded` and `deferred` items** apart.

## Capability skills

This skill **orchestrates** the testing activities and **owns no technique's method**. The method of each **technique** and **test type** belongs to **one skill per capability** (strategy "Test design specification", "Skills by capability"):

| Kind | Skills | Each one teaches |
|---|---|---|
| Technique | **Built:** `equivalence-partitioning`, `boundary-value-analysis`, `decision-table-testing`. **Planned:** `state-transition`, `use-case-testing`, `invariant-check`, `threat-based`, `fault-injection` | Its steps, the **evidence each step leaves**, the **checkpoint** where the PO reviews, how to **check its own output** before the next step |
| Test type | `security-testing`, `reliability-testing`, `performance-testing`, `platform-testing` | How the type is **selected**, which **techniques and measurements** it uses, its **oracle** (asserted or recorded-only), its **mechanisms** |

A design input whose technique **has a skill** follows that skill, step by step, and records **its completion checks**. A technique **without a skill yet** applies the strategy's "How a technique is applied" and "NFR kinds" directly, and says so in the evidence file. Skills that **share** a design input (EP with BVA or a decision table) write **one evidence file**: EP owns the variables, dimensions and classes; the others **reference their codes**. A capability skill **never overrides** the strategy's rules (the chain, step rules, coverage, gates); it **expands the method**.

## Rules

- **Every in-scope AC appears** with **exactly one tier**. **No AC is skipped**.
- **Do not start Part B before the PO approves Gate 1**, and **do not start an evidence file** whose design input has a **pending delta**.
- **Do not count a filled template as an applied technique**: a technique is applied when **each step's output exists**, cites its source, and the PO **can redo it**.
- **No orphan (dev/mvp/WORKFLOW.md "Traceability"):** every in-scope FR/AC and NFR has **at least one test**, and every in-scope DEC is **consumed by at least one test or implementation step**. **Flag gaps**.
- **Do not invent test scenarios** beyond what the **spec statements and the approved criteria** define; a technique **finds gaps**, it **does not fill them**.
- **No ci-tier test calls a real model**.
- **Pre-implementation ci tests are expected failures** (`it.fails`) that **can fail on a real assertion**, **one per independent variant**; the **implementation PR's first commit** shows it (strategy "Test infrastructure rules", checklist C5).
- The agent **drafts and proposes**; it **does not set a risk level, rule a gap, approve a test** or **close a gate**.
