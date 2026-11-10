---
name: decision-table-testing
description: Apply decision table testing to one design input of a build's test design. Lists the conditions and actions a rule combines, enumerates every combination, marks infeasible ones with the statement that excludes them, merges only with a spec argument, gives each remaining rule its actions from the spec or a gap, fixes the rule coverage items, derives test cases whose inputs fall in exactly one rule and runs the decision table completion checks. Conditions on an input value reference the classes owned by equivalence-partitioning. Used in Phase 2 test design, called by the testing-plan skill.
---

# Decision table testing

A decision table makes **every combination** of the conditions a rule depends on **visible**, so a combination the spec forgot, or two combinations it answers differently, **cannot hide**. The **evidence** is the full combination list, the infeasible and merged combinations **with their arguments**, and each remaining rule with **its actions and their source**.

The rules every technique obeys are in `dev/development/test-strategy.md`; this skill **expands the method** and never overrides them.

## When to use it

- **Use** when the outcome depends on **two or more conditions together** ("when", "only for", "and not for", "unless"), including a **mode or a source** that changes which rule applies.
- **Do not use** for a single condition with two outcomes (EP's valid and invalid classes already cover it), for behavior that depends on **order of events** (state transition), or to **re-test the classes of one input** (EP).

## Inputs

1. The **design input** row (criterion: every rule; depth parameters).
2. The **basis items** and spec text that state the conditions and the outcomes.
3. When a condition is about an **input value**, the **classes** from **equivalence-partitioning** in the same evidence file; the condition **references the class codes** ("C2 · the name is in EC-1 or EC-2") and does not redefine them.

## Steps and the evidence each leaves

Form "Decision table" of `dev/mvp/templates/test-design-technique.md`, one sub-heading per step.

### DT-1 · Conditions and actions

- **Conditions** (`C-n`): each a **yes/no** (or a small enumerated) question, with its **basis item** and, for an input value, the **EP classes** that answer it. Define every **term** a condition uses, **measured the way the spec measures it** (for example "the length after the processing the source receives").
- A condition is defined by the spec **as written**. **Never define it through a reading that waits for a ruling**: the open question becomes an **EP class** whose expected result is a gap (Blocked), or an **extra condition** whose actions are gaps; the definition of the existing conditions does not move with the future ruling.
- **Actions** (`A-n`): every effect the rule can produce, with its basis item: what is **done** (normalize, trim, cut, store), what is **refused**, what is **said** (the reason), what is **kept**. An outcome is a **set of actions**, not a single label.
- A condition is **independent** of the others or its dependency is written (C3 can only be "yes" when C2 is "no").

### DT-2 · All combinations

- List **every combination** of the condition values (2 × 2 × 2 = 8 for three binary conditions), each with a code. Nothing is skipped at this step.

### DT-3 · Infeasible combinations

- Mark a combination **infeasible** only with the **statement or platform fact** that excludes it. A combination excluded only by an **ambiguous** reading stays feasible and its actions read **"gap Z-n"**.

### DT-4 · Merges

- **Merge** feasible combinations into one rule only with an **argument from the spec** that every action is the same; write the argument. Do not merge to save test cases. "Don't care" cells appear only after a recorded merge.

### DT-5 · Rules and their actions

- Each remaining rule (`DR-n`) lists its condition values, **every action** (marked done or not done), and the **basis item** of each action. An action the spec does not state for that rule reads **"gap Z-n"**.
- Check **consistency**: two rules with the same condition values and different actions mean a **contradiction in the spec**; raise it.

### DT-6 · Coverage items

- **Coverage items** are the **rules**, excluding infeasible combinations; a rule whose actions are all a gap is listed but **not counted as covered** until ruled. Count them.

### DT-7 · Test cases (decision table rule)

DT contributes to the shared **Test cases** section:

- **One record per test case ID**, as in equivalence-partitioning EP-6, with its **status**.
- **At least one test case per rule.** Its input **falls in exactly one rule**: state the condition values the input produces.
- Choose inputs from **EP representatives** of the classes the conditions reference; a case may also serve an EP class or a boundary value when that keeps it in one rule.
- The expected result lists **every action** of the rule, done or not done (for a refusal: the old value is kept, the reason is given), with sources.

## Completion checks

| Check | Fails when |
|---|---|
| DT-C1 · conditions | A condition or action stated in the basis items is missing, a condition on an input value references no EP class, or a condition's meaning depends on a pending ruling |
| DT-C2 · enumeration | The number of listed combinations differs from the product of the condition values |
| DT-C3 · infeasible | An infeasible combination cites no excluding statement or fact |
| DT-C4 · merges | A merge has no spec argument, or a "don't care" cell has no recorded merge |
| DT-C5 · actions | A rule has an action with no basis item and no "gap Z-n" |
| DT-C6 · consistency | Two rules with the same condition values have different actions |
| DT-C7 · coverage | A feasible rule is **Uncovered**, or reported **Covered** while all its test cases are **Blocked** |
| DT-C8 · single rule | A test case's input satisfies the conditions of more than one rule |

The checks prove the table is **complete over the conditions listed**; a condition nobody listed is **not** detected (DT-C1 only checks against the basis items the design input names).

## Gaps, assumptions, deviations

As in equivalence-partitioning: gaps go to the ruling log of `test-design.md`; assumptions are `AS-n` rows; an unmet criterion is a deviation.

## Output contract

- **Owned here:** conditions (`C-n`), actions (`A-n`), combinations, rules (`DR-n`). Conditions **reference** EP classes by code.
- **For test design and traceability:** the rule coverage count; each test case lists the **rule** it falls in; the AC's `Serves` line cites the rule codes.
