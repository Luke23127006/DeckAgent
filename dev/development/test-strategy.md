# Test strategy

How DeckAgent **decides which tests a build needs**. A build's **testing plan is derived from this document**: the plan **applies the strategy** to the in-scope requirements, it **does not invent its own method**. The **phases and gates** are in `dev/mvp/WORKFLOW.md`; this document says **what each phase tests and how**, and the gates **point here**.

## At a glance

- **Risk sets the depth.** The PO gives each in-scope FR and NFR a **risk level**; the level decides **which techniques apply** ([Risk and depth](#risk-and-depth)).
- **Requirements pick the technique.** Each **kind of requirement** has **one test design technique** and **one coverage criterion** ([Technique per requirement](#technique-per-requirement)). A plan is **complete** when **every criterion is met**, not when the reviewer runs out of ideas.
- **Black-box first, white-box later.** **Phase 2** designs tests **from the spec only**; **Phase 5** adds **unit tests and branch coverage**; **Phase 6** checks **test strength** ([Phases](#phases)).
- **A test must be able to fail.** Every deterministic criterion names the **defect it catches**, and the **technical checklist** rejects a test that **cannot fail on that defect**.
- **The PO reviews flows and numbers, the agent reviews technique.** The PO reads the **review-flows view** and the **numbers of each gate**; the agent runs the **checklist**.

## Risk and depth

| Risk level | Applies to | Depth |
|---|---|---|
| **High** | **Data loss**, **security** (access outside the allowed folder, data leaving the machine), **writes to a project folder**, **half state after a kill** | **Every technique** of [Technique per requirement](#technique-per-requirement) that matches its kinds; **mutation testing** in Phase 6 |
| **Normal** | Everything else | **Use case testing** and the **`Catches` line**; other techniques **only for a gap** the PO names |

The PO sets the level **per FR and NFR** in the testing plan's **At a glance**. **Without a level, an item is high.**

## Test levels

| Level | What it exercises | Written | Who writes it |
|---|---|---|---|
| **Unit** | **One module** through its public interface; dependencies **faked** | Inside the **implementation ticket** (Phase 5) | The **implementer** |
| **Integration** | **Two or more real modules**, or one module and a **real external part** (file system, runtime, provider fixture) | **After the modules** exist (`phase:post-impl`) | A developer **who did not implement them** |
| **Acceptance** | **One acceptance criterion**, through the **test driver** against the **whole DeckAgent server** | **Before implementation** (Phase 2) | A developer **who will not implement that FR** |
| **E2E** | A **use case flow** from the **real interface** to the **saved result** | **After all implementation** (`phase:post-impl`) | A developer **who did not implement the flow** |

**Separation rule:** the **author of an FR's acceptance tests** is **never its implementer**. A **light build** may break it, **only if the test is approved first** (WORKFLOW "Build sizes").

## Technique per requirement

Each spec part is read for **its kind**; one part may hold **several kinds**, and each kind **adds its own tests**.

| Kind of requirement | Technique | Coverage criterion (met when…) |
|---|---|---|
| **Use case flow** (steps, alternatives) | **Use case testing** | **every step** and **every alternative** reaching a **different end state** has a test |
| **Lifecycle** (an object with states: workspace, chat, folder status) | **State transition testing** | **every event in every state** has a test, **including events that must be refused**; the **state diagram** is drawn in review-flows, and its **completeness check table** gives **every event in every state** an answer |
| **Rule with several conditions** (a BR with values, a validation order) | **Decision table** | **every leaf** of the **decision tree** has **one outcome** and **at least one test**; a test input **falls in exactly one leaf** |
| **Input with a range or a format** (names, paths, sizes, counts) | **Equivalence partitioning + boundary value analysis** | **every partition** has a test, and **each boundary** is tested **at, just below and just above** |
| **Invariant** ("never reads a file", "never changes the project folder") | **Invariant check** on every test of the area | the invariant is **asserted after every action** in its area, with a **positive control** that proves the check **can see a violation** |
| **Every kind** | **Error guessing** | each criterion has a **`Catches` line**, and the plan applies the **shared error list** ([Error list](#shared-error-list)) |

**Rule from the spec only.** A technique **finds gaps**; it **does not add behavior**. A gap the spec does not answer is **raised to the PO**, who **adds it to the spec first** or **rules it out of test** with a reason (WORKFLOW "Spec rules" rule 3).

**Deviations.** A plan that **does not apply** a technique or a coverage criterion its risk level requires **lists it in its gaps table** with the **reason**; the **PO rules each line**.

## NFR kinds

| NFR kind | Technique | Tier |
|---|---|---|
| **Timing** (a step finishes within N) | **Measure** over repeated runs; assert the **stated percentile** | CI if stable, otherwise **manual** with recorded numbers |
| **Security** (data stays local, no access outside the folder) | **Threat-based**: one test per **threat path** (link, junction, substituted drive, relative path, network path) | CI |
| **Reliability** (no half state, recovery) | **Fault injection**: **kill the process** or **fail the call** at each write step, then **restart and check** | CI |
| **Platform** (Windows paths, encodings) | **Partition by platform trait**: long path, UNC path, NFD name, case variants | CI on the target OS |

A target the PO has **not set** reads **`not set`**: the measure is **recorded, not asserted**.

## Phases

The **WORKFLOW gate** of each phase **includes this table's exit column**.

| Phase | Box | What is added | Exit | PO sees |
|---|---|---|---|---|
| **Phase 2** | **Black** | **Review-flows view**, acceptance tests and eval cases, **from the spec** and the techniques of each item's **risk level** | Every **coverage criterion** is met or **ruled a deviation**; every CI test is an **expected failure** (`it.fails`) that **can fail on an assertion**; the **checklist passes** | **Criteria met / required**, **open deviations**, **checklist failures** |
| **Phase 5** | **White** | Unit tests **per module** | The PR's **first commit** shows its tests **fail on an assertion**; its `it.fails` are then **flipped to `it`** and **green**; **branch coverage** of new code reaches the **threshold the PO sets** in the implementation plan; an **uncovered branch** is **tested or explained** in the PR | **`it.fails` left in the build**, **branch coverage per module** |
| **Phase 6** | **White** | **Mutation testing** on the **high-risk modules**, **in the first build only**; the **workflow review** after it decides **whether it stays** | **No `it.fails` left**; each **surviving mutant** is **killed by a new test** or **ruled equivalent** by the PO | **Mutation score**, **surviving mutants**, **eval scores** |

## Test infrastructure rules

- **Test driver.** Acceptance tests **call only the driver**. The driver **calls only the public interface**, **renames fields** with a **fixed mapping**, **passes values unchanged** both ways, **never derives** a business value, and **throws a contract error** on a missing or unknown field, so a reader **tells a driver failure from a DeckAgent failure**.
- **Not wired yet.** Until the driver is wired, every driver function **throws `NotWiredError`**. A test **cannot show it fails for the right reason** before the product API it calls exists, so **each implementation PR** shows it: its **first commit** runs the PR's tests **against the new API** and shows that **each fails on an assertion**, not on `NotWiredError` or a contract error; a **later commit** turns `it.fails` into `it`.
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

The agent runs it on **every testing plan** before the PO approves it, and again on **each test PR**. Each item **passes or names the criterion** that fails.

| # | Check |
|---|---|
| **C1** | No **always-pass Then**: no assertion of an absence that **never occurs**, no "no error" **without checking the effect** |
| **C2** | The test **fails on the defect** its `Catches` line names |
| **C3** | **No silent skip** on CI |
| **C4** | The driver **does not compute, default or translate** a value the test asserts |
| **C5** | The test **can fail on an assertion**: nothing in it fails **before its Thens** run, and its **implementation PR** shows the assertion failure in its **first commit** |
| **C6** | **Isolated and not flaky**: no shared state, no fixed resource, no timing wait, cleanup in `finally` |
| **C7** | **Deterministic on Windows CI**: no dependency on the real user folder, admin rights or image contents, except the named real-folder test |
| **C8** | Each test ticket changes **at most 3 files**, holds **one concern**, and is **blocked only** by tickets it names |

## Review-flows view

Each build's plan comes with a **review-flows view** for the PO: one **diagram per lifecycle or flow** (numbered arrows), an **"always true" box** for invariants, **one table row per arrow** (when it happens, what DeckAgent must do, the defect the test catches), a **completeness check table** with **every event in every state**, one **decision tree per multi-condition rule**, and a **gaps table** with the PO's ruling on each gap and deviation. An arrow **without a criterion** points to a **"no criterion" node**; a **dashed** arrow is **moved to a later build**. The completeness check exists because a diagram **cannot show a missing arrow**. The view is **where the coverage criteria are checked**.
