# Test strategy

How DeckAgent **designs the tests a change needs**. It is a **toolbox**, not a checklist to fill: each section says **what a method is for** and **how to apply it**, and a change **uses the depth its risk needs**. A risky behavior gets the full technique; a simple one gets a criterion and a test. The **engineering rules** are in `dev/mvp/WORKFLOW.md` "Engineering rules"; this document says **how to test well**.

## Required and optional

**Testing quality is required; formal testing documentation is not.** Every change meets the **quality requirements**; the **records** below are kept **only when the scope or the risk needs them and a simpler form would not do**.

| Required for every change (quality) | Optional, when scope or risk needs it (documentation) |
|---|---|
| The **expected behavior** and its **source** are known before the production code | A **basis register** and **sentence map** ([Test basis register](#test-basis-register)) |
| Expected results come from an **independent oracle** | A **testing plan** record ([Planning decisions](#planning-decisions)) |
| **Depth matches the risk**: a high-risk behavior gets the **techniques its kinds call for** ([Risk and depth](#risk-and-depth)) | A **technique evidence file** per technique ([Test design specification](#test-design-specification)) |
| Each deterministic criterion names the **defect it catches**, and its test **can fail on it** | A full **traceability matrix** ([The chain](#the-chain)) |
| Tests are **isolated, deterministic** and **not weakened** ([Technical checklist](#technical-checklist) C1–C7) | A **test summary** record |
| **Evidence and residual risks** are reported | A **test-implementation contract** or **test tickets** |

**Reuse first.** A change **reuses** the analysis, plan and design that exist, and adds **only what is missing**: in the **issue, the PR or the test file** when that is enough, in a **shared record** when the addition is **reusable** or changes **shared coverage**. The steps of a technique (below) are **how to apply it well** when it is applied; they do not make its **evidence file** mandatory. A **formal record** is worth keeping for a **high-risk area several tasks share** (B1's workspace and filesystem behaviors are the example), or when a reviewer needs to **redo the design by hand**.

## At a glance

- **Risk sets the depth.** Each in-scope FR and NFR gets a **risk level**; the level suggests **which techniques are worth applying** ([Risk and depth](#risk-and-depth)).
- **Requirements pick the technique.** Each **kind of requirement** has a **test design technique** and a **coverage criterion** that says **when it is applied enough** ([Technique per requirement](#technique-per-requirement)), so the tests stop at a reason, not when the writer runs out of ideas.
- **Planning applies rules to records.** A planning decision names its **inputs** and the **rule** behind it, so a reader **sees why** instead of trusting a rationale ([Planning decisions](#planning-decisions)).
- **The chain keeps tests honest.** A test traces **basis item → condition → AC → test case → test → result** ([The chain](#the-chain)), so when a test is wrong the team can **find the step that went wrong**.
- **STLC is a method, not a schedule.** The activities of the Software Testing Life Cycle say **what testing produces**; a change uses the activities **it is missing**, when it needs them ([Frame](#frame-stlc-and-the-workflow)). There is **no phase system**.
- **Black-box first, white-box with the code.** Tests are designed **from the spec**; **unit tests and branch coverage** come with the code; **test strength** is checked before a build is accepted ([Evidence by moment](#evidence-by-moment)).
- **A test must be able to fail.** Every deterministic criterion names the **defect it catches**, and the **technical checklist** catches a test that **cannot fail on that defect**.

## Frame: STLC and the workflow

STLC names the **activities of testing** and what each produces. They are **capabilities a change draws on**, not a sequence it must run. The "Full record" column is the **formal form**, kept **when scope or risk needs it** ([Required and optional](#required-and-optional)); the lighter form is enough otherwise.

| STLC activity | Answers | Light form | Full record (optional) | When |
|---|---|---|---|---|
| **Requirement analysis** | What must be true, from which source, what can go wrong | Expected behavior, source, risks and ambiguities in the issue or PR | `testing/analysis/`: `test-analysis.md`, `basis-register.md`, `sentence-map.md` | Before the production code of the behavior |
| **Test planning** | Which level, which technique, how much is enough | Level, tier and technique named with the cases | `testing/planning/testing-plan.md` | Before the production code of the behavior |
| **Test case design** | Which concrete checks, with which expected results | Cases with input, preconditions, actions and expected result, in the issue or the test file | `testing/design/`: technique evidence files, `test-design.md`, `acceptance-criteria.md` | Before the production code of the behavior |
| **Test implementation and environment setup** | How the tests run | The tests and fixtures themselves | `implementation/test-implementation.md` | With the increment that needs them |
| **Test execution** | Did it pass | CI results, eval runs, defect issues | — | Continuously |
| **Test closure** | What is covered, what is left | Evidence and residual risks in the PR or issue | `test-summary.md`, the matrix's **Verified** column | Before a build is accepted |

The activities **overlap**: one behavior can be implemented while another is still analysed. **New information revises the records; it starts no second cycle** ([Going back](#going-back)).

## The chain

Four concepts, **kept apart**:

| Concept | Question it answers | Examples | Chosen in |
|---|---|---|---|
| **Level** | Which **object** is tested | unit, integration, acceptance, E2E ([Test levels](#test-levels)) | Planning |
| **Type** | Which **quality** is checked | functional, performance, security, reliability, platform, usability ([Test types](#test-types-and-approaches)) | Analysis (selection), planning (approach) |
| **Technique** | **How conditions are derived** from the basis | EP + BVA, decision table, state transition ([Technique per requirement](#technique-per-requirement)) | Planning (**selected** from the kind and the risk level); design (**applied**) |
| **Coverage criterion** | **When the technique is applied enough** | the share of the technique's **coverage items** that have a test ([Coverage](#coverage)) | Planning (target), design (items), execution (count) |

**Level and type are independent**: security can be tested at several levels. A **technique serves a type**. A **coverage criterion belongs to a technique**.

What the chain links:

| Entity | Meaning | Recorded in |
|---|---|---|
| **Basis item** | One **testable statement** of the spec: a UC step or alternative, a clause of an FR or NFR, a value of a BR ([Test basis register](#test-basis-register)) | `basis-register.md` |
| **Condition** | **One thing to check**, derived by a technique from basis items. It carries an **ID** | `test-design.md` |
| **AC** | The **condition under which the PO accepts a behavior** of an FR, BR or UC flow. It states **what must hold**, not one input. One basis item may have **several** AC. An AC may be **drafted early** and is **final before its tests are written** | `acceptance-criteria.md` |
| **Measure** | The **quantity or property** that decides an **NFR**, with its **condition, target and pass rule**. It plays the role of an AC for an NFR, and **cites its basis items** the same way | `acceptance-criteria.md` |
| **Test case** | **One concrete check** of an AC or a measure: its **input**, its **preconditions**, its **actions** and its **expected result**, and the **coverage items** it exercises. One AC or measure may give **several** cases; **each independent variant is its own case** ([Test infrastructure rules](#test-infrastructure-rules)). A case may exercise **several coverage items**, and a coverage item may be checked by **several cases**; the relation is **not one to one**. **How coverage items combine in one case** is set by the **technique** (its capability skill), not by a rule common to all techniques. It has an **ID**: the AC or measure ID plus a **variant label** (`FR-071 AC-2 V3`, `NFR-008 M-1 V2`); an AC with one variant has the label `V1` | Variant list of the AC or measure block; test name in the code; the technique evidence file |
| **Test** | A test case written as **code** | `tests/` |
| **Result** | **Pass or fail** of a run, and the **defect** if any | CI, `eval-runs/`, defect issue |

The chain is the **order of reasoning** for every test. **Writing it down as records** is needed only where a formal record is kept; elsewhere a test name that **cites its criterion** and a PR that **cites the source** carry the same links. Where the records exist, the **link rules** hold at review, **whatever order the records were written in**:
- Every **AC and every measure cites at least one basis item**.
- Every **condition cites a basis item**, and the AC or measure it serves.
- Every **test case cites at least one condition**, and **its ID names its AC or measure**.
- Every **basis item** has a condition and a test case, **or** the status `excluded` or `deferred` with a scope ruling.

The **forward direction finds omissions**; the **backward direction finds tests the spec does not support** ("Rule from the spec only"). The chain gives the **order of inference**. An AC **may be drafted early**, but a **drafted AC is never an input of design**: a technique derives its outputs **from the basis items and the plan only**, and drafted AC are **compared at the end** ([How a technique is applied](#how-a-technique-is-applied), reconciliation). A condition found during design **may add an AC**.

## Risk and depth

| Risk level | Applies to | Depth |
|---|---|---|
| **High** | **Data loss**, **security** (access outside the allowed folder, data leaving the machine), **writes to a project folder**, **half state after a kill** | **Every technique** of [Technique per requirement](#technique-per-requirement) that matches the kinds **of the behavior being built**; **mutation testing** on the high-risk modules before B1 is accepted |
| **Normal** | Everything else | **Use case testing** and the **`Catches` line**; other techniques **only for a gap** someone names. **Every behavior built still gets at least one condition** with its expected result |

The risk level is set **per behavior**, where its design lives (a testing plan, or the issue). **Without a stated level, a behavior change is high.** **Quality risks** that no statement names are found in the test analysis ([Test types](#test-types-and-approaches)) and get a level the same way.

**Safety in increments.** A rule the spec attaches to an operation (a refusal, an invariant) is **enforced when the operation is opened**, and **every known bypass through the inputs the implementation accepts** is **tested before the merge**; the **rest of the coverage criterion** may be met over later increments, and the behavior is **complete** only when it is.

## Test levels

| Level | What it exercises | Written | Who writes it |
|---|---|---|---|
| **Unit** | **One module** through its public interface; dependencies **faked** | **With the increment** that builds the module | The **implementer** |
| **Integration** | **Two or more real modules**, or one module and a **real external part** (file system, runtime, provider fixture) | **As soon as the parts exist**; it may pass on its first run | Preferably a developer **who did not implement them** |
| **Acceptance** | **One acceptance criterion**, through the **test driver** against the **whole DeckAgent server**, once the server and the driver exist | **Before or with the production code** of the behavior; for new deterministic behavior, **seen failing first** | Preferably a developer **who will not implement that FR** |
| **E2E** | A **use case flow** from the **real interface** to the **saved result** | **As soon as the flow is integrated**, not at the end of the MVP; it may pass on its first run | Preferably a developer **who did not implement the flow** |

**The acceptance tests play two roles.** By **scope** they exercise the **whole server** through the driver, as a system test does. By **basis and objective** they **confirm each acceptance criterion**. The PO **accepts a build** from **all the evidence**, not from this suite alone. A criterion whose result is **observable at a lower level** may be checked there until the driver reaches it.

**Prefer a separate test author.** The **author of an FR's acceptance tests** is preferably **not its implementer**: the person who writes the code tends to test **what they already thought of**. When that is not possible, the test is written **and seen failing first**.

## Test types and approaches

**Selecting a type** uses **three sources**, and a type is **selected on any one**:
1. A **statement of the spec** names the quality (an NFR, a BR, a clause of an FR).
2. A **quality risk** found in the test analysis, **even when no statement names it**.
3. A **trait of the system or its environment** (it runs on Windows, reads the user's files, sends data to a provider).

Each type gets **one row** in the quality risk and type record with **three attributes**:

| Attribute | Values | Meaning |
|---|---|---|
| **Selected** | `yes` with the source; `no` with the reason | Whether the quality is checked in this build |
| **Oracle status** | `asserted` (a statement or a threshold decides pass or fail); `recorded-only` (a risk exists and **no threshold is set**) | What pass or fail rests on |
| **Approach** | `scripted automated`, `scripted manual`, `exploratory`; **one type may use several** | How the check is performed |

**Types** the record covers: **functional**; **performance**; **security** (confidentiality, integrity, authentication, authorization, availability, non-repudiation, **one row each**); **reliability and recovery**; **configuration, platform and installation**; **usability**; **structural**; **change-related** (retest, regression).

- A `recorded-only` type is **measured and recorded**, not asserted (a target the PO has not set reads **`not set`**). A result that looks wrong is **raised to the PO**, who **adds a threshold to the spec first** or **rules it out**.
- A `recorded-only` type still needs a **defined measurement**: the **operation**, the **metric** and the **conditions** (for example the time from the driver's call to its answer, with a stated number of workspaces). The **duration of a whole test run** includes the server start, the fixtures and the cleanup, so it **does not measure the product** and is not a measurement. Without a defined measurement the quality stays a **candidate quality risk**, and the PO **chooses** to leave it unmeasured or to approve a measurement.
- **Exploratory** is an **approach**, not an outcome. It has a **charter**, a **scope**, a **time box** and a **recorded result**. Its findings go to a **defect issue** or to a **ruling**; it creates **no acceptance test** by itself.
- **Tier** (WORKFLOW "Test tiers") says **what blocks the merge or the build**; the approach says **how the check is done**. `ci` is `scripted automated`, `eval` is `scripted automated` against a real model, `manual` is a person's `scripted manual` or `exploratory` check.

## Test basis register

**A formal register is optional**: it is worth keeping for a **high-risk area several tasks share**, where omissions are costly. For a single behavior, **reading its statement clause by clause** (each "when X, then Y", each effect, each negation) gives the same items without a document. When kept, the **basis item** is the unit of **requirement coverage**. The register **lists every item** of the in-scope spec, with its **kind**, its **risk level** (taken from its FR or NFR), its **ambiguities**, its **scope** (`to test`, `excluded` or `deferred`) and the **approval** of that scope (`approved` or `pending`). How items are cut:
- First **cut each spec text into units** (a sentence, or a clause ended by `;`) and **classify each unit**: **normative** (it states a behavior or a value), **explanatory** (a reason, an example, a note that adds no behavior) or **definition** (a term, a boundary, a pointer to another spec). A note that **states a behavior is normative**, in whatever section it sits. **Classification follows the content of the unit, never its scope**: a normative unit whose behavior another spec outside the build owns is **still normative**, and its item is `deferred` with a scope ruling that names the owner. A unit that only **points** to another spec, or **states a boundary**, is a definition. Only **normative units** become items.
- The **sentence map** (`sentence-map.md`, beside the register) shows **every unit** with a **stable locator**, its **class** and the **items it feeds**. The PO can **recount** it and can follow any unit to its items and any item back to its units.
- An item that **mixes behaviors of different scope** (one needs a request, another does not) is **split**, one item per scope, so that its status is **true of all of it**.
- **Scope rulings.** An `excluded` or `deferred` item points to a **scope ruling** (`SR-n`), one row per reason in the **"Items not tested"** section of the build's `traceability-matrix.md`: the **items**, **what they need** that the build lacks, and the **build that takes them** (or why they are excluded). The register keeps **two separate attributes**: the **proposed scope** and its **approval**. A scope the PO has not approved is `pending`, and it is **not yet in force**. Gaps and deviations of the design are ruled in `test-design.md`.
- Each **"when X, then Y"** is one item; each **effect joined by "and"** is one item; each **negation** ("changes no file") is one item, and it is an **invariant**.
- Each **value (V-n) of a BR** is one item. The **members of a closed list inside a value** are **not** items of their own: they are **test data**, and the [closed list rule](#technique-per-requirement) sets the criterion.
- Each **UC step** and **alternative** is one item.

**Checks that a kept register is complete:**
- Every **normative unit** of the in-scope spec text **maps to at least one item**. The **count of unmapped normative units**, read off the sentence map, is **0** before planning starts; the count is **not independent evidence** while one reader made the map.
- **Cross-reference:** compare UC steps and alternatives, FRs, and BR values with one another (does each step and alternative appear in an FR, is each FR cited by a UC or a BR, does each BR value have an item). A **mismatch is a candidate gap for review, not a spec error**: an FR about stored data or configuration may belong to **no user flow**. A mismatch that **changes something** becomes an **item**, an **ambiguity** or a **candidate gap**; one that **changes nothing** is **not recorded**.
- A second reader may **re-derive the list independently**; the **differences** are read by the PO. Agreement is **not proof**: the register **reduces** omissions, it does not remove them. What it misses is caught by **error guessing**, **exploratory testing** and **defects that escape** ([Going back](#going-back)).

## Technique per requirement

Each spec part is read for **its kind**; one part may hold **several kinds**, and each kind **adds its own tests**.

| Kind of requirement | Technique | Coverage criterion (met when…) |
|---|---|---|
| **Use case flow** (steps, alternatives) | **Use case testing** | **every step** and **every alternative** reaching a **different end state** has a test |
| **Lifecycle** (an object with states: workspace, chat, folder status) | **State transition testing** | **every event in every state** has a test, **including events that must be refused**; the **state × event matrix** gives **every event in every state** an answer; a **diagram is optional** |
| **Rule with several conditions** (a BR with values, a validation order) | **Decision table** | **every leaf** of the **decision tree** has **one outcome** and **at least one test**; a test input **falls in exactly one leaf** |
| **Input with a range or a format** (names, paths, sizes, counts) | **Equivalence partitioning + boundary value analysis** | **every partition** has a test, and **each boundary** is tested **at, just below and just above** |
| **Invariant** ("never reads a file", "never changes the project folder") | **Invariant check** on every test of the area | the invariant is **asserted after every action** in its area, with a **positive control** that proves the check **can see a violation** |
| **Every kind** | **Error guessing** | each criterion has a **`Catches` line**, and the plan applies the **shared error list** ([Error list](#shared-error-list)) |

**Rule from the spec only.** A technique **finds gaps**; it **does not add behavior**. For a check with a pass or fail, a gap the spec does not answer is **raised to the PO**, who **adds it to the spec first** or **rules it out of test** with a reason (WORKFLOW "Spec rules" rule 3).

**Closed lists.** A value that is a **closed list** (the key folders, the system folders) is **one basis item**. The **condition** is "a member of the list is refused". The **members are test data**. At **high risk** the criterion is **every member has a test**; at **normal risk** it is **one member plus one non-member**. The plan states the criterion it applies.

**Deviations.** Work that **does not apply** a technique or a coverage criterion its risk level requires **states it with the reason** (in the gaps table of a kept record, or in the PR). A deviation that **leaves a product risk** the spec covers goes to the **PO**; a technical one is the **developer's** call, reviewed in the PR.

### How a technique is applied

The **steps are the method**: a reviewer can **redo one section by hand** and compare. When a technique's output is **kept as an evidence file** (a high-risk area, a shared design), the rules below apply to it; when the technique is applied **inside one task**, its **cases and expected results** in the issue or the test file are enough, and the rules still guide **how the cases are derived**. Rules for **every technique**:
- **Each step leaves its own output** in the technique's **evidence file** (a list or a table), and that output is **enough to check the next step** without reading what follows it. For example, the **partitions can be reviewed before any test case** exists.
- A step uses **only the basis items, the plan and the outputs of earlier steps**. Each output row **cites its basis item** or the earlier output it comes from, and the **reason** where the step makes a choice.
- A step whose output is **wrong is corrected before the next step** builds on it.
- The **coverage items are fixed before test cases are attached** to them.
- **Each test case is its own record**: its **ID**, **input** (exact, or a reference to one row of a data table that fixes it), **preconditions**, **actions**, **expected result** with its **source**, the **coverage items** it exercises, and its **status**. Preconditions and actions shared by a group may be written **once** above the group; a row never holds **several test case IDs**.
- A test case is **Ready** when **every** part of its expected result has a basis item, and **Blocked** when **any** part waits for a ruling (it names the gap). A Blocked case may still list the parts that **are** known.
- Each coverage item has **one status**: **Covered** (at least one **Ready** test case), **Blocked** (identified, but every test case for it waits for a ruling), **Uncovered** (no test case), **Infeasible** (a fact shows it cannot occur). Counts report **each status separately**; only **Covered** counts toward test design coverage.
- A **completion check** closes the test cases: every coverage item is **Covered**, or **Blocked** with its gap, or **Infeasible** with its fact; an **Uncovered** item fails the check. The technique's skill adds **its own checks** (for example every state × event cell answered).
- **Design evidence is not execution evidence.** A completion check and a script that recomputes expected values show the **design is consistent**; they do **not** show that a fixture can build the input or that the product behaves as expected. The evidence file says, for each result, whether it is **design-checked**, **computed** (by a script it names), **assumed** (an assumption with where it gets confirmed) or **awaiting execution**.
- The **last step is reconciliation**: each coverage item is compared with the **drafted AC** and recorded as **match**, **missing** (no AC checks it), **conflict** (the AC's expected result disagrees with the spec), or **unsupported** (an AC or a variant that no coverage item needs). Reconciliation is a **final check, not the measure of design quality**: a design is judged by **its steps and their basis**, and **neither finding nor not finding a difference** proves it right.

| Technique | Steps | Coverage items |
|---|---|---|
| **EP + BVA** | 1) **Inputs and variables**: the basis items, the **input and output variables**, and the **rules** that act on each. 2) **Domain analysis**: the **domain** of each variable, its **sub-variables** (counting unit, encoding, normalization, trimming), and the **relations between variables** (a variable that decides which rules apply). 3) **Partitions**, valid and invalid, each with its **reason** and its **expected behavior from the spec**. 4) **Boundaries**, derived from the partitions and the rules, with **three values** each (just below, at, just above). 5) **Coverage items** and the criterion; list what is **not covered** and why. 6) **Representatives and test cases**: a **representative value** per partition and the boundary values, then the cases, each with **input, preconditions, actions and expected result** and the **coverage items** it exercises, combined as the technique's method says. 7) **Reconciliation** | partitions, boundary values |
| **Decision table** | 1) List the **conditions** and **actions** from the statement and the BR values. 2) List **every combination**. 3) Mark a combination **infeasible** only with the spec statement that excludes it. 4) **Merge** combinations only with an **argument, from the spec, that the outcome is the same**, recorded with the merge. 5) Each remaining rule is one item | rules (leaves) |
| **State transition** | 1) States and events **from the spec**. 2) The **state × event matrix**. 3) **Model completeness**: every cell has an answer in the spec (a transition, a refusal, a no-op); an **empty cell is a gap** for the PO. 4) The **coverage criterion** is the one in the table above | state-event pairs |
| **Use case testing** | 1) The **main flow**. 2) Each **alternative** is a flow. 3) Combinations of alternatives **only at high risk**. 4) Each flow names its **end state** | flows |
| **Invariant check** | 1) List the **"never" statements**. 2) Assert after **every action** of the area. 3) Add a **positive control** | invariants × area |
| **Threat-based** | 1) **Assets**. 2) **Trust boundaries**. 3) **Entry points** that cross a boundary. 4) **Threat scenarios**. 5) **Screen** each candidate by how it can really be exploited: keep it as a scenario or record it as **not feasible** with the reason | kept scenarios |
| **Fault injection** | 1) List the **points where a failure changes what the requirement protects**: writes that form a commit point, calls to external parts (provider, network, file system), long-running or streaming operations. 2) For each point choose the **failure modes that can really occur there** (kill the process, a failed call, a timeout, an interruption in the middle of a stream, a partial write, a full disk, a lost permission). 3) A requirement that **names the failure and the points** (for example "killed at each write step of these actions") **fixes them**; otherwise the choice comes from the **architecture and the risk**, and each **point and mode is recorded with its reason**. 4) After the failure, **restart or retry and check the state** the requirement protects | injection point × failure mode, as chosen |
| **Error guessing, exploratory** | The **shared error list** applied to each criterion; a **charter** for a session | list entries; charters |

## NFR kinds

| NFR kind | Technique | Tier |
|---|---|---|
| **Timing** (a step finishes within N) | **Measure** over repeated runs; assert the **stated percentile** | CI if stable, otherwise **manual** with recorded numbers |
| **Security** (data stays local, no access outside the folder) | **Threat-based**: one test per **kept threat scenario** (link, junction, substituted drive, relative path, network path) | CI |
| **Reliability** (no half state, recovery) | **Fault injection**: choose the **failure scenarios and injection points** from the **requirement, the architecture and the risk**, inject them, then **restart or retry and check** the state the requirement protects | CI |
| **Platform** (Windows paths, encodings) | **Partition by platform trait**: long path, UNC path, NFD name, case variants | CI on the target OS |

A target the PO has **not set** reads **`not set`**: the measure is **recorded, not asserted**.

## Coverage

Coverage is **a count over a list that exists before the count**. The **denominator is listed first**, with **no dependence on how many test cases get written**.

| Measure | Denominator | Numerator |
|---|---|---|
| **Requirement coverage** | **Basis items** `to test`, **plus** the items whose `excluded` or `deferred` scope is still `pending`; **without** the `excluded` and `deferred` items whose scope is `approved` | Items **linked to a condition and a test case** |
| **Test design coverage** (**planned coverage**) | **Coverage items** the technique and the risk level require | Items with **at least one test case** |
| **Execution coverage** | Test cases to run | Test cases **run** |
| **Pass coverage** | Test cases to pass | Test cases **passed** |
| **Structural coverage** | Statements and branches in the measured scope | Statements and branches **executed** |

- **Only a settled scope fixes the denominator.** While a scope is `pending`, the figures are **provisional**, and a `pending` exclusion or deferral does **not** shrink the denominator.
- **`excluded` and `deferred` items are never counted as covered.** They are reported **beside the ratio** ("38 / 38, excluded 2, deferred 2"), each with its ruling.
- **Requirement coverage is necessary, not sufficient.** An item with a test case is not shown to be **tested enough**; the test design coverage answers that.
- **Execution and pass coverage are never judged alone.** Their denominator is test cases, so **fewer test cases make them look better**. They mean something **only when the two design measures are fixed and met**.
- **Each variant counts as one test case** in execution coverage and pass coverage.
- **Planned coverage is a plan**, not a result of running tests. It counts **Covered** coverage items only; **Blocked**, **Uncovered** and **Infeasible** items are reported **beside** the ratio.

## Automation feasibility

Every mechanism a test depends on (a fixture, an audit, a runner or CI condition) has **one status** in the test analysis:

| Status | Meaning |
|---|---|
| **Verified** | Run, with **evidence** (a green self-test on the target runner, or a spike) |
| **Assumed** | There is a **basis** for it; it is **not run yet**. The **dependency and the risk are recorded** |
| **Blocked** | There is **no reliable way** yet; the plan **changes the level or the tier** of the tests that need it |
| **Not applicable** | The build **does not need it** |

- A **plan can go ahead with `assumed` mechanisms**.
- A test **does not count as evidence for its AC** when the build is accepted while a mechanism it depends on is **not `verified`**.
- A **fixture self-test that runs green on CI** is the usual way to reach `verified`. A **spike** is used where no self-test exists.

## Planning decisions

This section applies **when a testing plan record is kept** (a build area several tasks share). For a single behavior, the same rules choose **its technique and level** in a line of the issue. Test planning turns the **test analysis** into decisions. Each decision is a **rule of this section applied to recorded inputs**, so a reader **sees where it comes from**; the plan keeps the **inputs, the rule applied and the output**, not the agent's reasoning. Planning **never reads drafted AC or test cases**: a decision derived from them is **back-fitted**, whatever rationale it carries. When a rule needs a fact the analysis lacks (a **mechanism**, a **quality risk**), the fact goes **back to the analysis**, never into the plan alone. A **classification is never changed to justify a technique**: a technique the kind does not select needs **its own source** (P4, P5), recorded in the plan.

| Decision | Inputs | Rule | Output in `testing-plan.md` |
|---|---|---|---|
| **Technique per item group** | Register: **kind, risk, scope** of each item; quality risk and type record; the **words of the item** (behavior traits) | P1–P5 below | Technique selection table: one row per **item and kind**, with the items, the rule and the technique |
| **Depth parameters** | Risk level; BR values (closed lists, sources); UC alternatives; quality risks at high | Strategy rules: closed lists, alternative combinations, a quality risk's variable (P4) | Design inputs table |
| **Level** | Where the item's result is **observable**; the mechanisms it needs | L1–L4 below | Levels; a level per design input |
| **Approach** | Type record (selected, approach) | **Copied**, not decided again | Types by level and approach |
| **Quality risk handling** | Quality risk record | Each risk is handled by a **technique on named items**, or is a **known risk** with its reason | Quality risks by approach |
| **Coverage criterion and targets** | Technique table of this strategy; settled scope | The criterion is the **technique's**; denominators come from the **settled scope**, never from AC or test cases ([Coverage](#coverage)) | Items table; coverage targets |
| **Environment and dependencies** | Automation feasibility | Every **mechanism** a selected technique needs **has a row** in the feasibility record | Environment; dependencies; design inputs |
| **Entry and exit** | [Evidence by moment](#evidence-by-moment) | Each criterion names the **record or check that shows it** | Entry and exit criteria |

**Technique selection rules:**
- **P1 · Floor.** **Every item `to test`**, at any risk, gets **at least one condition** and a **`Catches` line**. This is what **requirement coverage** counts.
- **P2 · Kind at high risk.** Each **kind of a high item** selects the technique of [Technique per requirement](#technique-per-requirement).
- **P3 · Kind at normal risk.** A **flow item** selects **use case testing**; other kinds get **P1 only**, unless the **PO names a gap**, or the item is a **state, event, partition or area** of a technique that **a high item selects** (then it is a **coverage item of that technique**, recorded **with the high item**; the normal item's own depth does not change).
- **P4 · Type and quality risk.** A **selected type** whose approach names a technique (security: **threat-based**; reliability: **fault injection**; platform: **partitions by platform trait**) adds that technique to the **items its source names**. A **quality risk at high** adds **its variable** (a sub-variable, a partition, a path form, an oracle such as the refusal reason) to the technique of the **items it names**, even when an item is normal; that item's own depth stays.
- **P5 · Behavior trait.** Planning re-reads each item for **traits its kind does not cover**: an outcome that **depends on a condition or a source** ("when", "only for", "and not for") selects a **decision table**; a **count, length, format, set of forms** or a **containment** ("itself", "inside", "contains") selects **EP + BVA**; an object that **changes state** selects **state transition**; "never", "keeps", "does not" selects an **invariant check**. The selection row **quotes the words** of the item that show the trait; the **register's kind stays as it is**.
- A high item whose kind selects a technique that the plan **does not apply** is a **deviation** ([Technique per requirement](#technique-per-requirement)).

**Level rules:**
- **L1 · Acceptance** for every item whose result is **observable through the public interface** of the server, with mechanisms that exist **before implementation**.
- **L2 · E2E** for **UC flows**, and for a result that **only the real interface** shows.
- **L3 · Integration** when the test needs a **real external part** or a **failure point** that only the **implementation plan** defines.
- **L4 · Unit** for **structure**, and for a failure **inside one module** that no higher level can trigger.

**Hand-off to design.** The plan gives **one design input per technique evidence file** of `testing/design/techniques/`: the **basis items**, the **coverage criterion and depth parameters**, the **mechanisms**, the **candidate gaps** to check, and the **open questions** that affect it. Design on an input **waits for an open question only when the answer would change its expected results**, and the file **cites the input** instead of restating why the technique was selected.

## Checks

Checks that **catch mistakes cheaply**; the agent runs them and **reports what fails**:
- **Environment validation**: fixture self-tests with positive controls, and the smoke result. Their results are **CI results**, so **no separate record** exists.
- The **technical checklist** (C1–C7) on **each PR that adds or changes tests**; C8 when work is split into **test tickets**.
- The **orphan check**, in both directions ([The chain](#the-chain)), **where a traceability matrix is kept**.

A reviewer who wants to **check a design** can redo **one technique section by hand**, step by step, and compare.

### Going back

A finding sends work **back to the record that caused it**. The matrix names the **downstream items**, and **only those are reviewed again**.

| Finding | Goes back to | Reviewed again |
|---|---|---|
| The spec is **unclear or silent** (at any step) | The **ambiguities** of the test analysis or the **ruling log** of `test-design.md`: the PO **changes the spec first** or **rules it out of test** | The basis items changed, and what follows them |
| A mechanism turns **`blocked`** | **Planning**: the level or the tier changes | The plan only; the conditions stay |
| A technique **missed** a class, a boundary or a cell | **Design**: apply it again; add the entry to the **error list** | The new conditions and cases |
| A defect is a **test defect** | **Design** or the test code | The affected cases |
| A defect **escapes** the tests | Find which step failed: **basis** (analysis), **condition** (design), **environment** | That step's output, and the error list |
| A task meets a **behavior with no design** | **Design that behavior only**, in the issue, the PR or the test file, or in the shared record when it is reusable | The new conditions and cases |
| New information arrives (module boundaries, a new mechanism) | **Analysis** addendum and **design** | The items added or changed |
| An **exit criterion is not met** at closure | **Design** (more conditions), or the PO **accepts the residual risk** in the summary | The addition |

### Defects

A **defect is a GitHub issue**. It names the **test case**, the **condition**, the **AC** and the **run** that failed, and one **cause**: **product defect**, **test defect**, **environment** or **spec gap**. A **spec gap** goes to the PO and the ruling log; a **test defect** goes back to design or to the test code (the table above). The fix is **retested**. A defect found **outside the tests** also names the **record that missed it**.

## Evidence by moment

What evidence a change adds, by **when it happens**, not by a phase. The rows are **evidence to produce when the moment arrives**, not gates a task waits behind.

| Moment | Box | What is added | Evidence | Reported |
|---|---|---|---|---|
| **Before the production code of a behavior** | **Black** | The **expected results and the cases** of that behavior, **from the spec**, with the techniques its **risk** calls for (reused or added) | Each case has a **source** and an **expected result**; for new deterministic behavior, the first tests **fail on an assertion** | The cases used, and those **left out** because a ruling is pending |
| **With each increment** | **White** | Unit tests **per module**; the next acceptance cases | Tests **green**; **branch coverage** of new code reported (threshold **`not set`** until the PO sets one); an **uncovered branch** is **tested or explained** in the PR; known bypasses of a rule the increment opens are **tested** | **Branch coverage**, **`it.fails` left**, coverage still to add |
| **When parts are integrated** | **Black** | Integration and E2E tests of the flows that now run | Tests **green** on CI; they may pass on their first run | Flows covered, flows still missing |
| **Before a build is accepted** | **White** | The **coverage criterion** of each behavior met; **mutation testing** on the **high-risk modules** of B1 (the workflow review decides **whether it stays**) | **No `it.fails` left**; each **surviving mutant** is **killed by a new test** or **ruled equivalent**; eval runs recorded | **Mutation score**, **surviving mutants**, **eval scores**, **residual risks** |

## Test infrastructure rules

- **Test driver.** Acceptance tests **call only the driver**. The driver **calls only the public interface**, **renames fields** with a **fixed mapping**, **passes values unchanged** both ways, **never derives** a business value, and **throws a contract error** on a missing or unknown field, so a reader **tells a driver failure from a DeckAgent failure**.
- **Not wired yet.** A driver function whose product API does not exist yet **throws `NotWiredError`**. A test of **new deterministic behavior** written ahead of its API **cannot show it fails for the right reason** until the API exists, so the PR that adds the API shows it: a commit runs those tests **against the new API** and shows that **each fails on an assertion**, not on `NotWiredError` or a contract error; a **later commit** turns `it.fails` into `it`. Tests of **existing behavior** (regression, refactor, integration, E2E) need **no red state**.
- **How a variant is identified.** A variant is **independent** when it **differs from the others in at least one coverage item** of a condition (a partition, a boundary value, a state-event cell, a leaf, a path form, a closed-list member, an injection point) and **can pass or fail alone**. The AC or measure block **lists each variant** with its **label** (`V1`, `V2`…) and its **coverage item**; the **test name in the code starts with the test case ID** (`FR-071 AC-2 V3 · junction`); the technique evidence file links **each coverage item** to the **test case IDs** that check it. Labels are **never renumbered**; a removed variant leaves its label unused.
- **Independent variants are separate test cases.** One AC may hold **several variants** (seven forms of one path, four unreadable folders, two refused names). Each variant that is an **independent condition** runs as **its own case**, for example with a **parameterized test**, so each gets **its own result**. A test **never counts as having checked a variant** because **another assertion in the same test** failed as expected. In particular, an expected failure (`it.fails`) around a **loop over variants** ends at the **first failing assertion** and **hides the rest**, so every variant needs **its own `it.fails`**, and the implementation PR shows **each variant** failing on an assertion in its first commit.
- **Invariant audits have a positive control.** An audit (for example the **file-system audit**) has a **self-test** that **performs the forbidden action** and **expects the audit to see it**.
- **No silent skip on CI.** A fixture that **cannot set up** its condition **fails on CI**. On a developer machine it may **skip with a reason**, **only behind an explicit opt-in** variable.
- **Isolation.** Each test uses a **new data folder** and **its own temporary folders**; it **restores** permissions, links and drives **in `finally`**; it uses **no fixed port, drive letter or wall-clock wait**.
- **Deterministic environment.** A test **does not depend on the CI image**: system and user folders are **passed in as substitutes**, plus **one test against the real folder** where the spec names it.

## Shared error list

Error guessing applies these **recurring defects** to **every matching criterion**. A build **adds a line** when it finds a new one.

- **Paths compared as strings** (case, slash, trailing separator, short name, junction, substituted drive).
- **Check done on one entry point only** (add checks a rule, change or restart does not).
- **Refusal with a side effect** (refused, but state already changed).
- **Value trimmed, normalized or defaulted** in the wrong layer.
- **State kept in the wrong place** (memory instead of storage, or the reverse).
- **One interface updated, the others not.**
- **Half state after a kill** between two writes.
- **Count before normalization** (code points before NFC).

## Technical checklist

The agent runs C1–C7 on **each PR that adds or changes tests**, and C8 when work is **split into test tickets**. Each item **passes or names the criterion** that fails.

| # | Check |
|---|---|
| **C1** | No **always-pass Then**: no assertion of an absence that **never occurs**, no "no error" **without checking the effect** |
| **C2** | The test **fails on the defect** its `Catches` line names |
| **C3** | **No silent skip** on CI |
| **C4** | The driver **does not compute, default or translate** a value the test asserts |
| **C5** | The test **can fail on an assertion**: nothing in it fails **before its Thens** run; for **new deterministic behavior**, the PR shows the assertion failure before the code that passes it |
| **C6** | **Isolated and not flaky**: no shared state, no fixed resource, no timing wait, cleanup in `finally` |
| **C7** | **Deterministic on Windows CI**: no dependency on the real user folder, admin rights or image contents, except the named real-folder test |
| **C8** | Each test ticket holds **one concern**, stays **small** (a few files), and is **blocked only** by tickets it names |

## Test design specification

**A formal test design specification is optional.** It is worth keeping for a **high-risk area several tasks share** (B1 keeps one); a behavior designed inside one task keeps its **cases and expected results** in the issue, the PR or the test file. When a build keeps one, it lives in `testing/design/`, in **two parts**:
- **One evidence file per design input**, `techniques/Dn-topic.md` (template `dev/mvp/templates/test-design-technique.md`): the **output of each step** of one technique, its **coverage items**, its **test cases** and its **reconciliation**. A reviewer reads **one technique at a time**, and can read a step's output **before the next step exists**.
- The summary `test-design.md` (template `dev/mvp/templates/test-design.md`): the **techniques applied** with their **coverage counts**, and the **ruling log** of gaps, deviations and design rulings.

Together they let a reviewer check **six things**:
1. **Which techniques** were applied: each evidence file **cites its design input** in the testing plan, which holds **why** it was selected ([Planning decisions](#planning-decisions)).
2. **How each technique was applied**: the **output of each step** from [How a technique is applied](#how-a-technique-is-applied), **in the order of the steps** (variables and sub-variables, infeasible combinations, merges and their arguments, empty cells, screened threats, chosen injection points), ending with the **reconciliation** against the drafted AC.
3. Which **conditions** each technique derived, and from **which basis items**.
4. The **coverage items** and the **coverage criterion** that makes them enough, with the **count**.
5. How each **condition links to its AC** and to the **test cases** that check it; each test case has its **input, preconditions, actions, expected result** and the **coverage items** it exercises.
6. The **gaps, deviations and design rulings**, each with its **outcome** or `pending`.

**The form follows the technique**: no technique is forced into another's structure, and a **diagram is optional** wherever a table already answers the question:

| Technique | Its evidence file shows |
|---|---|
| **Use case testing** | The main flow and each alternative, with its end state |
| **State transition** | States, events, **one row per transition**, and the **state × event matrix** (a diagram **cannot show a missing arrow**; the matrix gives **every cell** an answer) |
| **Decision table** | Conditions, actions, rules (a table or a tree with one outcome per leaf), infeasible combinations and merges |
| **EP + BVA** | Variables, sub-variables, partitions, **representatives**, boundaries with their three values |
| **Invariant check** | The "never" statements, the area each is asserted in, the positive control |
| **Threat-based** | Assets, trust boundaries, entry points, threat scenarios with their screening |
| **Fault injection** | Injection points, failure modes and the reason for each, the state checked after restart |
| **Performance** (when selected) | Operation, workload conditions, metric, target or `not set` |

A build has **only the evidence files of the techniques it applies**. Every transition, cell, rule, partition, boundary, invariant, scenario and injection point is a **condition** with an **ID unique in the build** (the design input code is its prefix when two files would collide). A condition **without an AC** is a **gap** in the ruling log. **Scope rulings** stay in the matrix's "Items not tested" and **rulings on ambiguities** in `test-analysis.md`; the **AC and measures** stay in `acceptance-criteria.md`; the **driver and fixture contract** stays in `implementation/test-implementation.md` and **follows the design**, never the reverse.

**Skills by capability.** The method of a technique (its steps, the evidence each step leaves, how to check it) and of a test type (performance, security, reliability) is taught by **one skill per capability**, for example `equivalence-partitioning`, `boundary-value-analysis`, `decision-table-testing` (these three exist), `state-transition`, `performance-testing`, `security-testing`, `reliability-testing`. This strategy keeps the **rules every skill obeys** (the chain, the step rules, coverage); the `testing-plan` skill runs **the activities a change is missing**, at the depth it needs, and calls a capability skill **where one exists**. Until a capability skill exists, its technique follows [How a technique is applied](#how-a-technique-is-applied).
