---
scope: ""
title: ""
milestone: mvp
created: DD-MM-YYYY
---

# Traceability matrix — {scope}

The build's **traceability spine**. **One row per in-scope FR/AC** (and per NFR), threading **requirement → basis items → conditions → tier → research/decision → test → implementation ticket → result → verification**.

**No-orphan rule:** every deliverable must have a **consumer downstream**. **No phase gate closes** while a row is **missing a link that phase was responsible for** producing (see dev/mvp/WORKFLOW.md "Traceability"). Other plan documents **link to rows here** **instead of restating requirements** (dev/mvp/WORKFLOW.md "Document rules").

## At a glance

- **Requirement text:** statements in `dev/mvp/spec/`; acceptance criteria and measures in [testing-plan.md](./testing-plan.md)
- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **FRs in scope:** FR-NNN, FR-NNN
- **NFRs in scope:** NFR-NNN
- **Status:** _N rows · N tested · N implemented · N verified_

<!-- Every #N and file path is a clickable link (dev/mvp/WORKFLOW.md "Linking convention"). -->

## Matrix

| FR / AC | Basis items | Conditions | Tier | RQ | DEC | Test (ticket) | Test author | Impl (ticket / PR) | Result | Verified |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-NNN / AC-1 | BI-1 | X1 | ci | [RQ-N](...) | [DEC-NNN](...) | [#N](https://github.com/{owner}/{repo}/issues/N) | @handle | [#N](https://github.com/{owner}/{repo}/issues/N) | | [ ] |
| FR-NNN / AC-2 | BI-2 | K1, K2 | eval | | | [#N](https://github.com/{owner}/{repo}/issues/N) | @handle | [#N](https://github.com/{owner}/{repo}/issues/N) | | [ ] |
| NFR-NNN | BI-3 | | ci | [RQ-N](...) | [DEC-NNN](...) | [#N](https://github.com/{owner}/{repo}/issues/N) | @handle | [#N](https://github.com/{owner}/{repo}/issues/N) | | [ ] |

## Items not tested

<!-- Basis items ruled excluded or deferred (test-strategy.md "Coverage"). They are never counted as covered. Write "None." when there is none. -->

| Basis item | Status | Ruling |
|---|---|---|
| BI-N | excluded | [SR-n](./test-analysis.md) |

## Columns

- **FR / AC** — in **Phase 1**, **one row per in-scope FR and NFR**. In **Phase 2**, each FR row **splits into one row per acceptance criterion** and each NFR row **into one row per measure** (`NFR-NNN / M-1`).
- **Basis items** and **Conditions** — the **basis items** (`test-analysis.md`) the row covers, and the **condition codes** (`test-design.md`) that serve it. **Filled in Phase 2**.
- **Tier** — `ci`, `eval` or `manual` (dev/mvp/WORKFLOW.md "Test tiers"). **Set in Phase 2** from the testing plan; **empty in Phase 1**.
- **RQ** — the **answered research question** for this row (may be empty).
- **DEC** — the **decision that shaped this row** (may be empty).
- **Test (ticket)** — the **test-stub ticket that proves the AC**. For a **manual row**, the **check's anchor in the testing plan**. **Required** for every row after Phase 2.
- **Test author** — **who wrote the test**. **Must differ from the implementer** (separation rule), **except in a light build**.
- **Impl (ticket / PR)** — the **ticket or PR that makes this row pass**. **Not a function link**.
- **Result** — the **last run** of the row's tests (`pass`, `fail`) and the **defect issue** if any.
- **Verified** — `[x]` once the **PO confirms this AC in Phase 6**: **CI green** for `ci`, a **recorded eval run** for `eval`, the **PO's own check** for `manual`.

## Orphan check (run at every gate)

- [ ] **Every in-scope FR and NFR has a row** (Phase 1); **every AC and measure has a row and a tier** (after Phase 2).
- [ ] **Every row has at least one test** (after Phase 2).
- [ ] **No implementer is the test author** of the same row (except light builds).
- [ ] **Every in-scope DEC is consumed** by at least one row (test or impl).
- [ ] **Every answered RQ leads to a DEC** or a row that uses its result.
- [ ] **No test or implementation ticket exists without a matrix row**.
- [ ] **Link rules hold** (after Phase 2): every AC cites a basis item; every condition cites a basis item; every test case cites a condition; every basis item has a condition and a test case, or is listed under **Items not tested** with a ruling.
