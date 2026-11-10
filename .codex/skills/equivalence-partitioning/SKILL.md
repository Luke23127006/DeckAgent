---
name: equivalence-partitioning
description: Apply equivalence partitioning to one design input of a build's test design. Identifies the input and output variables from the test basis, the domain and the dimensions of each input, partitions every dimension into disjoint equivalence classes with an expected behavior taken from the spec, picks a representative value per class, fixes the class coverage items, derives test cases by the EP combination rule and runs the EP completion checks. Owns the variables, dimensions, classes and representatives that boundary-value-analysis and decision-table-testing reference. Used in Phase 2 test design, called by the testing-plan skill.
---

# Equivalence partitioning

**Divide each input into classes** that the specification treats **the same way**, so that **one representative** stands for its whole class. The **evidence** is the chain variables → dimensions → classes → representatives → coverage items → test cases; each link is **written down and cites its source**, so the PO can **redo any row by hand**. Filling the tables to fit test cases you already have in mind **is not EP**.

The rules every technique obeys (the chain, step outputs, anti-anchoring, coverage) are in `dev/development/test-strategy.md`; this skill **expands the method** and never overrides them.

## When to use it

- **Use** when an input (or a computed value the rule measures) has a **domain** the spec splits into groups that are **handled differently**: a range, a length, a format, a set of forms, an encoding or normalization, a membership ("inside", "one of"), a source that changes the processing.
- **Do not use** for an object whose behavior depends on its **history** (use state transition), for a **combination of conditions** that decides an outcome (EP gives the classes; decision-table-testing combines them), or for a statement with **no input variation** ("never reads a file": invariant check).
- EP **alone is not enough** when the classes are **ordered** and the spec puts a **limit** between them: run **boundary-value-analysis** on those dimensions.

## Inputs

1. The **design input** row of `testing/planning/testing-plan.md` section 2.3: its **basis items**, **coverage criterion and depth parameters** (for example "per name source", "closed list: every member", a quality risk's sub-variable), **mechanisms**, **candidate gaps**.
2. The **basis items** in `testing/analysis/basis-register.md`, the **ambiguity rulings** in `testing/analysis/test-analysis.md`, and the **spec text** they cut from.
3. **Platform facts** the domain depends on, each with its source (a research file, a mechanism, a check you ran).

**Never read** the drafted AC (`acceptance-criteria.md`), drafted test cases or `pre-stlc-design.md` before the reconciliation step.

## Steps and the evidence each leaves

Write the evidence into `testing/design/techniques/Dn-topic.md` (template `dev/mvp/templates/test-design-technique.md`, form "Equivalence partitioning"), **one sub-heading per step, in order**.

### EP-1 · Variables

- One row per **input variable** (what the user or the environment supplies) and per **output variable** (what the test observes), with the **rules acting on it** and its **basis items**.
- Include **hidden inputs**: a mode or a source that changes the processing, existing state that a rule compares against.
- Include every **observable effect** the basis items name, including effects that must **not** happen to related objects (the folder keeps its name).
- **Out of this design input:** an effect whose basis belongs to another technique (a state cell, an invariant area, an identity rule) is listed with the **design input that owns it**. Never point to a pre-STLC section.

### EP-2 · Domains and dimensions

- The **domain** of each input variable, per **mode or source** when the processing differs. A limit that comes from the **platform**, not the spec, is marked **platform** with its source, and a **fixture or a check** that will confirm it.
- **Dimensions** (sub-variables): the independent properties of a value that a rule reacts to or that a **plausible defect** reacts to: the measured quantity (length after the rule's transformations), normalization form, counting unit, characters at the ends, inner characters, relation to existing values. Each dimension cites the **rule** or the **fault hypothesis** (an entry of the shared error list, a quality risk) that makes it matter.
- **Relations between variables:** a variable that decides **which rule applies** to another (a source that decides trimming or refusal), an **infeasible** region, an **order** of transformations. A relation found **not to change any outcome** is recorded **with its argument** and creates no class.

### EP-3 · Equivalence classes

- Partition **each dimension** of each variable (per mode or source). The classes of one dimension must be **disjoint** and **cover the dimension's domain**: write the **cover argument** in one line ("L ∈ {0}, [1,100], [101,∞) covers all lengths").
- Each class has: a **code** (`EC-n`), its **definition**, **valid or invalid** (invalid: the spec **refuses or rejects** it), the **expected behavior from the spec** with the **basis item**, and the **reason** the class exists (a rule, or a fault hypothesis).
- A class whose expected behavior **the spec does not state**, or states only under a **reading that waits for a ruling**, gets **no invented result**: its expected cell reads **"gap Z-n"**, the gap goes to the ruling log, and the class will be **Blocked**.
- A class that **cannot occur** stays in the table, marked **infeasible** with the **fact** that excludes it (spec or platform).
- **Split** a class when two of its members take **different processing paths** that a defect could treat differently (empty raw string versus a string that becomes empty after trimming). **Merge** two classes only when the spec gives them the **same behavior** and **no fault hypothesis** separates them; record the merge.
- A **closed list** in a value is one class whose **members are test data**; the criterion (every member, or one member plus one non-member) comes from the plan.
- **Observable where?** Mark a class **"observable at a limit"** when its expected behavior shows **only near a boundary** (a counting rule: far from the limit, a correct and a wrong count give the same outcome). Its representative still checks what **is** observable (the stored form, no failure), and the class is **handed to boundary-value-analysis** as a column of its variant matrix.

### EP-4 · Representatives

- One **representative value** per feasible class, written **exactly** (escape invisible characters, give code points), with the **measured quantity** it yields (for example code points after NFC) and **why it represents the class**.
- A representative sits **inside** its class, **away from boundaries** (boundaries are the job of boundary-value-analysis), and differs from the **base value** only in the dimension it represents.
- Every computed property of a representative (a length after normalization, a trim result) is **checked by running it** when the property is not obvious; record what was run.

### EP-5 · Coverage items

- **Coverage items** are the **feasible classes**, plus each **member** of a closed list when the criterion is "every member". List them by code with the **count**. After EP-6 each gets a **status** (strategy "How a technique is applied"): **Covered** (a Ready test case), **Blocked** (only Blocked test cases, gap named), **Uncovered**, **Infeasible**.
- List what is **not covered** and **why**: infeasible classes, classes waiting for a gap ruling.
- **Stop here** when the design input asks for a PO checkpoint: the classes and representatives are reviewable without any test case.

### EP-6 · Test cases (EP rule)

EP contributes to the shared **Test cases** section of the evidence file:

- A **valid** test case may combine **one valid class from each dimension**; choose combinations so that **every valid class** appears in at least one case.
- An **invalid** class appears in a case **with every other dimension at its base valid class**, so a refusal can be **attributed to that class alone**.
- **One record per test case ID**: **input** (the representative values, exactly, or a reference to one row that fixes them), **preconditions**, **actions** (shared ones may be written once above the group), **expected result** with its **source**, the **coverage items** it exercises, and its **status**: **Ready** when every part of the expected result has a basis, **Blocked** when any part waits for a ruling.
- The expected result of a combined case is the **conjunction** of the classes' expected behaviors; if they **conflict** or the spec is **silent** on the combination, do not combine: split the case, or raise a gap.

## Completion checks

Run them after EP-6 and record each as **pass** or **fail with the row**:

| Check | Fails when |
|---|---|
| EP-C1 · variables | A basis item of the design input acts on no variable, or an output it names has no output variable |
| EP-C2 · cover | A dimension has no cover argument, or its classes overlap |
| EP-C3 · source | A class has an expected behavior with no basis item, and no "gap Z-n" |
| EP-C4 · feasibility | A class marked infeasible cites no excluding fact |
| EP-C5 · representatives | A feasible class has no representative, or the representative's computed property was not checked when it is not obvious |
| EP-C6 · coverage | A feasible class (or a required closed-list member) is **Uncovered**, or is reported **Covered** while all its test cases are **Blocked** |
| EP-C7 · attribution | An invalid class shares a test case with another non-base class |
| EP-C8 · traceability | A test case lacks input, preconditions, actions, expected result with source, coverage items or status, or one row holds **several test case IDs** |
| EP-C9 · hand-over | A class marked "observable at a limit" has no column in the BVA variant matrix |
| EP-C10 · evidence kind | A result is stated without its **evidence kind**: design-checked, computed (by a named script), assumed (with where it gets confirmed) or awaiting execution |

A check **detects omissions of method**, not missing requirements: a dimension nobody thought of is **not** caught by EP-C2. Say so in the evidence file's limits.

## Gaps, assumptions, deviations

- **Gap** (the spec does not answer): a "gap Z-n" in the class row, and a row in the ruling log of `test-design.md`.
- **Assumption** (a fact the design relies on that is neither spec nor verified: a platform limit, an interface constraint): an `AS-n` row in the evidence file with **what would falsify it** and **where it gets confirmed** (a fixture self-test, a mechanism).
- **Deviation** (the plan's criterion is not met): a row in the ruling log with the reason.

## Output contract

- **Owned here:** variables, dimensions, classes (`EC-n`), representatives. Other skills **reference these codes** and never copy the tables.
- **For test design:** the coverage item count of EP and its uncovered list, for the design input's row in `test-design.md`.
- **For traceability:** every class row names its **basis items**; every test case names its **coverage items**; the AC's `Serves` line cites the class codes, and its `Variants` line maps each label to a test case.
