---
name: boundary-value-analysis
description: Apply boundary value analysis to one design input of a build's test design. Finds every boundary between ordered equivalence classes (and at the edges of a domain), places it on the quantity the rule actually measures, derives the boundary values the plan's criterion requires, adds the measurement variants where a transformation separates the raw value from the measured one, fixes the boundary-value coverage items, derives test cases by the BVA rule and runs the BVA completion checks. References the variables and classes owned by equivalence-partitioning. Used in Phase 2 test design, called by the testing-plan skill.
---

# Boundary value analysis

Defects cluster **where the behavior changes**: the comparison is off by one, the limit is measured on the **wrong quantity**, or the value is cut at the **wrong unit**. BVA tests **at and around** each place where an **ordered** dimension crosses from one class to another. The **evidence** is the list of boundaries, each **derived from two adjacent classes and a rule**, and the values chosen around it.

The rules every technique obeys are in `dev/development/test-strategy.md`; this skill **expands the method** and never overrides them.

## When to use it

- **Use** on a dimension whose values are **ordered** (a count, a length, a size, a position, a date) and where the spec puts a **limit**: a minimum, a maximum, a cut point, a threshold.
- **Use** at the **edges of a domain** (the platform's maximum, the smallest feasible value) when a rule still applies there.
- **Do not use** on an **unordered** dimension (a set of forms, a normalization form, a source): there is no "just above". Those stay with equivalence-partitioning.

## Inputs

1. The **classes and dimensions** from **equivalence-partitioning** in the same evidence file (`EC-n`, the dimension list). **BVA does not define classes**: if a dimension it needs has no classes yet, run EP-1 to EP-3 for it first; EP owns them.
2. The **design input** row (coverage criterion: two-value or **three-value** boundaries, the dimensions the plan names, such as "the measured length after NFC and trim").
3. The **basis items** and spec text that state each limit.

## Steps and the evidence each leaves

Form "Boundary value analysis" of `dev/mvp/templates/test-design-technique.md`, one sub-heading per step.

### BVA-1 · Boundaries

- Every boundary has a **kind**, a **source**, a **test objective** (the defect it targets) and whether the plan's **criterion requires** it:
  - **Requirement boundary:** between two **adjacent EP classes** that a **rule** separates. Fields: the two classes, the **boundary point**, the spec's **inclusive or exclusive** wording ("at most 100, inclusive"), the basis item. Required by the criterion.
  - **Transformation or position boundary:** a point that a rule's **operation** defines inside a class (the cut point of a truncation, the position of a multi-unit element relative to it). Source: the operation's rule. Required when the plan names the transformation; its expected values depend on **how** the operation is specified, so it is **Blocked** when that is a pending gap.
  - **Platform boundary:** an **edge of the domain** set by the platform, not by the spec (the longest name a file system allows). Source: an **assumption** `AS-n`. Added by design when a rule still applies there; **not required** by the criterion, counted **apart**.
- A neighbour value that is **infeasible** stays in the row, marked infeasible with its fact.
- **Measured quantity.** Write **what is measured** at the boundary (code points after NFC and trimming, bytes, UTF-16 units) and **in which order** the transformations run, citing the spec. A boundary is always placed on **the quantity the spec measures**, never on the raw input length.

### BVA-2 · Boundary values

- For each boundary, the values the criterion requires: **three-value** (just below, at, just above the boundary point) or **two-value** (the last value of the lower class, the first of the upper). Each value names the **class it falls in** and therefore its **expected behavior** (taken from EP, not restated).
- **Measurement variants.** When a **transformation** (trimming, normalization, a counting unit) makes the raw value differ from the measured one, a defect that measures **before** the transformation, or in the **wrong unit**, changes the outcome only where the raw side and the measured side fall **on different sides of a boundary**. Write a **variant matrix**: one row per boundary, one column per transformation the plan names or an EP class hands over (see below), and in **every cell** either **"variant BD-n-X"** or **"none"** with the one-line reason (for example "normalization never maps a non-empty name to an empty one, so it cannot cross the 0|1 boundary"). **Every boundary gets a row**, the lower ones included. A variant has the same values on the measured quantity and states the **raw quantity** each value implies.
- **Classes handed over by EP.** A class whose expected behavior is **observable only near a limit** (a counting rule: "a non-BMP character counts as one") is a column of the matrix; its variant is where it is actually tested.
- **Position boundaries.** When a value is **cut** at a boundary (a truncation), the **position of a special element** relative to the cut point (a multi-unit character just before, at, or just after the cut) is a boundary of its own.
- Each value is written **exactly** (representative string, its measured and raw quantities) and checked by **running** the computation when it is not obvious.

### BVA-3 · Coverage items

- **Coverage items** are the **boundary values** (per boundary and per variant), excluding infeasible ones. List them with codes (`BD-n.lo`, `.at`, `.hi`) and the **count**.
- List what is **not covered** and **why**.

### BVA-4 · Test cases (BVA rule)

BVA contributes to the shared **Test cases** section:

- **One record per test case ID**, as in equivalence-partitioning EP-6, with its **status**.
- **One boundary value per test case.** Every other dimension stays at its **base valid class** (EP), so a failure points to **that value**.
- A boundary value and an EP class may **share a case** when the value lies in that class and the case still varies **one** boundary.
- The expected result is the **behavior of the class** the value falls in, with its source.

## Completion checks

| Check | Fails when |
|---|---|
| BVA-C1 · derivation | An ordered dimension with a limit in the spec has no boundary, or a boundary lacks its **kind**, **source**, **test objective** or "required by the criterion" mark, or a requirement boundary cites no class pair and rule |
| BVA-C2 · measured quantity | A boundary does not state what is measured and after which transformations |
| BVA-C3 · values | A boundary lacks a value the criterion requires, or a value names no class |
| BVA-C4 · variants | The variant matrix lacks a boundary row or a transformation column, a cell is empty, a "none" cell has no reason, or a variant's raw and measured sides are on the same side for every value |
| BVA-C5 · inclusiveness | The value "at" the boundary falls in a class that contradicts the spec's inclusive or exclusive wording |
| BVA-C6 · coverage | A feasible boundary value is **Uncovered**, or reported **Covered** while all its test cases are **Blocked** |
| BVA-C7 · isolation | A test case varies more than one boundary value |

The checks find **missing or misplaced values** on the dimensions EP listed; they **cannot** find a limit that the spec states and EP did not model as a dimension (that is EP-C1 and the PO's review).

## Gaps, assumptions, deviations

As in equivalence-partitioning: gaps go to the ruling log of `test-design.md`; assumptions (a platform maximum, a unit) are `AS-n` rows with how they get confirmed; an unmet criterion is a deviation.

## Output contract

- **Owned here:** boundaries (`BD-n`), boundary values and measurement variants. They **reference** EP's classes by code.
- **For test design and traceability:** the boundary-value coverage count and uncovered list; each test case lists the **boundary value codes** it exercises.
