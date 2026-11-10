---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Traceability matrix — {scope}

**Optional.** Kept by a build whose criteria **several tasks share** (dev/mvp/WORKFLOW.md "Traceability"); a smaller change links its criterion, test and result in its PR or issue. **One row per in-scope FR/AC** (and per NFR), threading **requirement → basis items → conditions → tier → research/decision → test → implementation → result → verification**. Rows are **added as the work reaches them**, not all in advance.

**No-orphan check:** every deliverable should have a **consumer downstream**; a **missing link** usually means **forgotten work** (see dev/mvp/WORKFLOW.md "Traceability"). Other plan documents **link to rows here** **instead of restating requirements** (dev/mvp/WORKFLOW.md "Document rules").

## At a glance

- **Requirement text:** statements in `dev/mvp/spec/`; acceptance criteria and measures in [acceptance-criteria.md](./design/acceptance-criteria.md)
- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **FRs in scope:** FR-NNN, FR-NNN
- **NFRs in scope:** NFR-NNN
- **Status:** _N rows · N tested · N implemented · N verified_

<!-- Every #N and file path is a clickable link (dev/mvp/WORKFLOW.md "Linking convention"). -->

## Matrix

| FR / AC | Basis items | Conditions | Tier | RQ | DEC | Test | Test author | Impl (PR) | Result | Verified |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-NNN / AC-1 | BI-1 | X1 | ci | [RQ-N](...) | [DEC-NNN](...) | [#N](https://github.com/{owner}/{repo}/issues/N) | @handle | [#N](https://github.com/{owner}/{repo}/issues/N) | | [ ] |
| FR-NNN / AC-2 | BI-2 | K1, K2 | eval | | | [#N](https://github.com/{owner}/{repo}/issues/N) | @handle | [#N](https://github.com/{owner}/{repo}/issues/N) | | [ ] |
| NFR-NNN | BI-3 | | ci | [RQ-N](...) | [DEC-NNN](...) | [#N](https://github.com/{owner}/{repo}/issues/N) | @handle | [#N](https://github.com/{owner}/{repo}/issues/N) | | [ ] |

## Items not tested

<!-- The scope rulings: one row per reason for which basis items are excluded or deferred (test-strategy.md "Test basis register"). They are never counted as covered. Needs: what the item needs that this build lacks, or why it can never be tested (excluded). Build: the build whose testing plan takes the items, "—" for excluded. A row whose items the PO has not approved reads "pending" in Build; the approval of each item is in analysis/basis-register.md. Write the outcome only, never who decided or when (dev/mvp/WORKFLOW.md "Document rules" rule 7). Write "None." when there is none. -->

| ID | Items | Status | Needs | Build |
|---|---|---|---|---|
| SR-1 | FR-NNN.n | deferred | | build N |

## Columns

- **FR / AC** — **one row per in-scope FR and NFR**; once its criteria are written, each FR row **splits into one row per acceptance criterion** and each NFR row **into one row per measure** (`NFR-NNN / M-1`).
- **Basis items** and **Conditions** — the **basis items** the row covers, and the **condition codes** that serve it, where the build keeps those records.
- **Tier** — `ci`, `eval` or `manual` (dev/mvp/WORKFLOW.md "Test tiers"), set when the criterion is written.
- **RQ** — the **answered research question** for this row (may be empty).
- **DEC** — the **decision that shaped this row** (may be empty).
- **Test** — the **test that proves the AC** (file and test name, or the PR that adds it). For a **manual row**, the **check's anchor in `acceptance-criteria.md`**.
- **Test author** — **who wrote the test**; preferably **not the implementer** (dev/development/test-strategy.md "Test levels").
- **Impl (PR)** — the **PR that makes this row pass**. **Not a function link**.
- **Result** — the **last run** of the row's tests (`pass`, `fail`) and the **defect issue** if any.
- **Verified** — `[x]` once the AC **holds**: **CI green** for `ci`, a **recorded eval run** for `eval`, the **PO's own check** for `manual`.

## Orphan check (when a task closes)

- [ ] **Every row the work reached has at least one test**, and **every criterion has a tier**.
- [ ] **Every in-scope DEC is consumed** by at least one row (test or impl).
- [ ] **No test exists without a row**, in the areas this matrix covers.
- [ ] Where the records exist, the **link rules hold**: every AC cites a basis item; every condition cites a basis item; every test case cites a condition; every basis item has a condition and a test case, or is listed under **Items not tested**.
