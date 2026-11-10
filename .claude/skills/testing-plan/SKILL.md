---
name: testing-plan
description: Run the test analysis, test planning or test design a change is missing, at the depth its risk needs, by applying dev/development/test-strategy.md. Focused by default - reuse the existing records, add only the missing expected behaviors, risks, techniques or test cases for the behaviors in scope, and write them where they serve (issue, PR, test file). A full record set (basis register, sentence map, testing plan, technique evidence files, acceptance criteria, test-implementation contract, matrix) is produced only when explicitly needed for a high-risk area several tasks share. Not a phase and not a prerequisite for implementation.
---

# Testing plan

**Supply the testing knowledge a change is missing**: test analysis, test planning, test design, or any one of them. **Reuse first**: read the records that exist, and add **only what is missing** for the **behaviors in scope**. The PO settles **scope** and **what the spec means** where it is unclear; everything else is the team's.

The skill **applies** `dev/development/test-strategy.md`. It **does not invent a method** and **does not restate the strategy's rules**; it **points to them**. It is **not a phase** and **not a gate**: implementation starts as soon as the behavior in hand has its expected results and its verification design.

## Choose the scope of the run

| Mode | When | Output |
|---|---|---|
| **Focused** (default) | One behavior or a few: a task, a feature, a gap found while coding | For the behaviors in scope: the **expected behavior and source**, the **risks**, the **level and technique**, and the **test cases** (input, preconditions, actions, expected result), written in the **issue, the PR or the test file**. A shared record is updated **only** when the addition is **reusable** or changes **shared coverage**. |
| **Extend a record** | An area that already keeps formal records (B1's `testing/`) needs a missing design input or new items | The **missing part only**, in the record that owns it (a new technique file, new rows, a new ruling); **never regenerate** what exists |
| **Full record** | A **high-risk area several tasks share**, with no records yet, where a reviewer must be able to **redo the design by hand** | The file set under "Output of a full record", built step by step below |

**Pick the smallest mode that protects correctness.** Run **only the activities that are missing**: analysis without a plan, a plan without new design, or one technique on one input. A **step of the full process** may be used on its own when it helps (for example the EP + BVA steps on one input, with the cases kept in the test file).

**Focused run, in short:**
1. **Read** the spec items of the behavior and the **existing design** for them (the build's `testing/` records, `dev/mvp/README.md` "MVP testing").
2. **List what is missing** for correctness: an expected result, a risk, a boundary, a refusal, a bypass, a failure mode. Stop when nothing is missing.
3. **Resolve or flag ambiguities**: a product question goes to the PO as `pending`, and the cases that depend on it are **left out**; the rest proceed.
4. **Choose depth by risk** (strategy "Risk and depth"): high-risk kinds get their technique **on the behavior in scope**, not on the whole area.
5. **Write the cases** with their expected results and sources where they serve. **Hand off** to implementation (skill `tdd`).

## Full record

The rest of this skill describes the **full record**. Use it **only in the "Full record" or "Extend a record" mode**, and in the second case only for the **part being added**.

## Input

1. `dev/development/test-strategy.md`: the frame, the chain, risk and depth, test types and approaches, the test basis register, technique per requirement and how it is applied, coverage, automation feasibility, checks, infrastructure rules, shared error list, technical checklist.
2. The use case file: `dev/mvp/spec/02-use-cases/UC-XXX.md`
3. Every in-scope FR and NFR in `dev/mvp/spec/03-requirements/`, and the BRs they cite.
4. The decisions that shape the behaviors: `dev/mvp/decisions/DEC-*.md`
5. The records that exist: research checklist, matrix, analysis, plan, design (`dev/mvp/builds/UC-XXX-label/`)
6. `dev/mvp/spec/03-requirements/fr/_CRITERIA.md` and `nfr/_CRITERIA.md`: the rules a criterion and a measure meet.
7. `dev/mvp/builds/_STYLE.md`: build files are **Vietnamese prose with English terms**.
8. **Optional idea source**: the **legacy acceptance criteria** of the same FR on the `docs/spec` branch at `71ff143`. They are **not approved**; the **current statement wins**.
9. **Candidate gaps** from earlier reviews. They are **inputs to the register**, not findings: **check each with the technique**; never add a test case only because a gap was listed.

## Output of a full record

All paths below are under `dev/mvp/builds/UC-XXX-label/`; each file **owns one kind of fact**. A file that **would say nothing** for the area is **not created**.

| File | Template | Owns | Part |
|---|---|---|---|
| `testing/analysis/test-analysis.md` | `test-analysis.md` | Counts of the basis, quality risks, types, automation feasibility, ambiguities and candidate gaps | A |
| `testing/analysis/basis-register.md` | `basis-register.md` | The register rows: one per basis item | A |
| `testing/analysis/sentence-map.md` | `sentence-map.md` | The sentence map: every unit of the in-scope spec text, its class and items | A |
| `testing/planning/testing-plan.md` | `testing-plan.md` | **Planning decisions only**, each with its inputs and rule, and the **design inputs** | A |
| `testing/design/techniques/Dn-topic.md` | `test-design-technique.md` | The **evidence of one technique**: each step's output, coverage items, test cases, reconciliation | B |
| `testing/design/test-design.md` | `test-design.md` | Techniques applied with coverage counts; the **ruling log** of gaps, deviations and design rulings | B |
| `testing/design/acceptance-criteria.md` | `acceptance-criteria.md` | AC, measures, eval cases, manual checks, exploratory charters | B |
| `implementation/test-implementation.md` | `test-implementation.md` | Driver functions and fields, fixtures and self-tests; a test ticket list only when work is handed off as tickets | B |
| `testing/traceability-matrix.md` | `traceability-matrix.md` | The spine | — |

**Keep each template's section order** and **front-load `## At a glance`** (dev/mvp/WORKFLOW.md "Document rules"). **Scope rulings** live **only in the matrix's "Items not tested"**; **readings of ambiguities** **only in test-analysis.md**; **gaps, deviations and design rulings** **only in test-design.md**. A ruling's **result** is written **as current fact** into the file that owns it. A ruling the PO has not given reads **`pending`**. **Write outcomes, not the conversation** (dev/mvp/WORKFLOW.md "Document rules" rule 7): **never who decided or when**, and **no table** that only records a review or a check that changed nothing. **Never write a fact into a file that does not own it**; link to its home.

## Full record process

### Part A — Scope and approach

#### Step 1 — Test basis register

List every **basis item** of the in-scope spec in `basis-register.md`: **cut each spec text into units**, **classify each unit** (normative, explanatory, definition), **cut the normative ones** into items by the rules in the strategy's "Test basis register", give each item a **kind**, an **ID**, a **scope** (`to test`, `excluded`, `deferred`) and an **approval** (`approved`, `pending`), and flag **ambiguities**. **Classify by the content of the unit, never by its scope**: a behavior that a spec outside the build owns stays **normative**, and its item is `deferred`. **Split** an item that mixes behaviors of different scope. Write the **sentence map** in `sentence-map.md` (every unit, its locator, its class, its items) and **recount from it**: the unmapped normative units are **0**. Copy the **counts per spec** from both files into section 1 of `test-analysis.md`. A **closed list inside a BR value** is **one item**; its members are **test data**. Give each `excluded` or `deferred` item a **scope ruling** in the matrix's **"Items not tested"** (items, what they need, build); mark its approval **`pending`** when the PO has not ruled, and keep it in the coverage denominator until then. Compare UC steps and alternatives, FRs and BR values: a mismatch that **changes something** becomes an **item**, an **ambiguity** or a **candidate gap**; one that **changes nothing** is **not recorded**.

#### Step 2 — Risk level per item

For each in-scope FR and NFR, **propose `high` or `normal`** by the strategy's "Risk and depth" table, with a **one-line reason**. Ask the PO **only where the level is in doubt**; an item **without a level is high**. Add the **quality risks** that no statement names, found by asking what the system **does with the user's files, the provider, the disk and the platform**.

#### Step 3 — Test types

One row per **test type** in the quality risk and type record: **selected** (with its source: a statement, a quality risk, a trait of the system) or **not selected** (with the reason), the **oracle status** (`asserted` or `recorded-only`) and the **approach** (scripted automated, scripted manual, exploratory). **Security gets one row per aspect.** Never leave a type without a row. A `recorded-only` type **names its measurement** (operation, metric, conditions); the **duration of a whole test run** is **not** a measurement. Without one, the type is **not selected** and the quality stays a **candidate quality risk** for the PO to rule.

#### Step 4 — Automation feasibility

One row per **mechanism** a test depends on (a fixture, an audit, a runner or CI condition): **what needs it**, its **status** (`verified`, `assumed`, `blocked`, `not applicable`), the **evidence or basis**, and **what happens to the tests if it is not verified**. A fixture self-test that is green on CI is the usual proof.

#### Step 5 — Approach, levels, targets

In `testing-plan.md`, write the **test planning sections 1–9** in the template's order, applying the rules of the strategy's **"Planning decisions"** to the records of Steps 1–4: **derive each decision from the register, the quality risk and type record and the feasibility record only**; **never from drafted AC or test cases**, and never write a decision first and its reason after. **Objectives**: what the tests are for, the **evidence** of each, the **two roles** of the acceptance tests, and what is **outside** the objectives. **Items, risk and techniques**: first the **technique selection** (2.1): read the register **item by item**, one row per **item and kind** with the **rule** (P1–P5) and the technique it selects, and **check that the rows add up** to the `to test` count. A technique the kind does not select needs **its own source**: a selected type or quality risk (P4), or a **behavior trait** (P5) whose **words you quote**; **never change the register's kind** to justify a technique. Then the **items** (2.2): one row per FR and NFR (plus BR and UC rows with the register's risk), the **basis item counts** from the settled scope, the **kinds**, the **techniques** of 2.1 and their **coverage criterion**; **no coverage item count** (that comes from test design). Then the **design inputs** (2.3): one row per technique section with its **basis items**, **criterion and depth parameters**, **level and its rule**, **mechanisms**, **candidate gaps** and the **open questions** whose answer would change its expected results; every mechanism a technique needs **has a feasibility row**. Then the **test approach**: the **levels** (rules L1–L4), the **types by level** with the **items** each type's source names, the **quality risks by approach** with their **items** and the variable each adds, and the **five coverage targets** with denominators from the **settled scope**, never from a count of AC. Then the **environment**, the **dependencies** (what is resolved elsewhere and what it blocks), and the **entry and exit criteria** per testing activity. Then the **testing risks** (what could stop a test from running or let it pass without proving anything; **link the mechanism rows** of `test-analysis.md`, **do not restate their status**) and the **post-implementation tests**: one row per **E2E** test for the **main flow** and **each alternative** reaching a **different end state**, and per **integration** test an NFR measure needs (fault injection, timing); **point to the measure**, do not restate its target; **mark the smoke subset**. A question for the PO (a scope in doubt, a spec reading) goes to **"Open questions"** with a proposal. **AC and test cases drafted before test design are not coverage evidence.** The **risk level** decides which techniques **apply**; the **coverage criterion** of each applied technique sets the **required count**. **Show the PO the open questions** before Part B; a design input that **waits on none** can start right away.

### Part B — Test design

#### Step 6 — Apply each technique, one evidence file per design input

**The method comes before the result.** For each design input of the plan (section 2.3) that **waits on no open question**, create `testing/design/techniques/Dn-topic.md` from `test-design-technique.md` and **keep only its technique's form**. Use the **capability skill** of the technique when one exists; otherwise **follow its steps** in the strategy's "How a technique is applied". **Keep the output of each step, in step order**: the intermediate results (variables, partitions, representatives, boundaries, conditions and rules, states, events and transitions, threats, injection points) **are the evidence**, not scaffolding to delete. **Derive from the basis items and the plan only**: **do not read the drafted AC, the drafted test cases or the pre-STLC design** until the reconciliation step, and **do not start from test cases you already have in mind** and fill the tables to fit them. Each output row **cites its basis item** or the earlier output it comes from, with the **reason** for each choice. **Fix the coverage items before writing test cases**, and **ask the PO** where the spec does not answer. Each test case has its **input, preconditions, actions, expected result** (with its source) and the **coverage items** it exercises; how coverage items **combine in one case** follows the **technique's method** (its capability skill), not a rule common to all techniques. **End each file with the reconciliation table** (match, missing, conflict, unsupported); it is a final check, **not the success measure** of the design. **No technique is forced into another's form**, and a **diagram is optional**. Then update `test-design.md`: one row per design input with its **evidence file** and **coverage count**, and the **ruling log**. Per technique:

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

#### Step 11 — Test tickets (optional)

**Only when tests are handed off as separate tickets.** Otherwise tests are written **with the implementation**, and this step is skipped. When used, in `implementation/test-implementation.md`, group the ci-tier criteria into tickets: **one concern**, **kept small**, **blocked only by named tickets**. A ticket's test command shows **each variant** of its AC as **its own case**. A ticket is **never a prerequisite** for implementing a behavior whose design exists.

#### Step 12 — Count and check

- Fill **"Planned coverage"** per design input in test-design.md "Techniques applied", from each evidence file, and its total in the testing plan's At a glance: **coverage items with a test case** / items **the risk level requires**, with the **`excluded` and `deferred` counts beside** the ratio. It is a **plan, not a test result**. Each **unmet criterion** is a **deviation** in test-design.md, with its reason.
- Run the **link rules** of the strategy (AC → basis item, condition → basis item, test case → condition, basis item → condition and test case or a status with a ruling).
- Run the **technical checklist C1–C8** on every criterion and ticket. Each **failure** is fixed in the draft or listed in test-design.md as **kind `checklist`**.
- Fill the **counts** in the At a glance blocks.

#### Step 13 — Matrix (when one is kept)

**Split each FR row into one row per AC** and **each NFR row into one row per measure**, **fill the Tier**, the **basis items and conditions**, the **DEC that shaped the row**, and the **test** (or its ticket, when one exists) in the Test column. List the **`excluded` and `deferred` items** apart.

## Capability skills

This skill **orchestrates** the testing activities and **owns no technique's method**. The method of each **technique** and **test type** belongs to **one skill per capability** (strategy "Test design specification", "Skills by capability"):

| Kind | Skills | Each one teaches |
|---|---|---|
| Technique | **Built:** `equivalence-partitioning`, `boundary-value-analysis`, `decision-table-testing`. **Planned:** `state-transition`, `use-case-testing`, `invariant-check`, `threat-based`, `fault-injection` | Its steps, the **evidence each step leaves**, the **checkpoint** where a reviewer looks, how to **check its own output** before the next step |
| Test type | `security-testing`, `reliability-testing`, `performance-testing`, `platform-testing` | How the type is **selected**, which **techniques and measurements** it uses, its **oracle** (asserted or recorded-only), its **mechanisms** |

A design input whose technique **has a skill** follows that skill, step by step, and records **its completion checks**. A technique **without a skill yet** applies the strategy's "How a technique is applied" and "NFR kinds" directly, and says so in the evidence file. Skills that **share** a design input (EP with BVA or a decision table) write **one evidence file**: EP owns the variables, dimensions and classes; the others **reference their codes**. A capability skill **never overrides** the strategy's rules (the chain, step rules, coverage); it **expands the method**.

## Rules

These apply **in every mode**:

- **Reuse before creating.** Read the existing records first; **never regenerate** a design that exists.
- **Expected results come from the spec**, a decision, the existing behavior or a reproduction; a case that rests on a **pending ruling** is **left out**, not guessed.
- **Do not invent test scenarios** beyond what the **spec statements** define; a technique **finds gaps**, it **does not fill them**.
- **Depth follows risk**: high-risk behaviors get the techniques their kinds call for, **on the behaviors in scope**.
- **No ci-tier test calls a real model**.
- A ci test of **new deterministic behavior** written **ahead of its code** is an **expected failure** (`it.fails`) that **can fail on a real assertion**, **one per independent variant** (strategy "Test infrastructure rules", checklist C5). Tests of existing behavior need no red state.
- The agent **drafts and proposes**; it **does not settle a scope**, **answer a spec question** or **accept a build**: those are the PO's.

These apply **to a full record** only:

- **Every in-scope AC appears** with **exactly one tier**.
- **Do not start an evidence file** whose design input **waits on an open question** that would change its expected results.
- **Do not count a filled template as an applied technique**: a technique is applied when **each step's output exists**, cites its source, and a reviewer **can redo it**.
- **Report orphans** in the matrix: an FR/AC or NFR with **no test**, a DEC **nobody uses**.
