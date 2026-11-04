---
scope: ""
title: ""
version: vN
created: DD-MM-YYYY
---

# Traceability matrix — {scope}

The build's traceability spine. One row per in-scope FR/AC (and per NFR), threading
requirement → tier → research/decision → test → implementation ticket → verification.

**No-orphan rule:** every deliverable must have a consumer downstream. No phase gate
closes while a row is missing a link that phase was responsible for producing (see
WORKFLOW.md "Traceability"). Other plan documents link to rows here instead of restating
requirements (WORKFLOW.md "Document rules").

## At a glance

- **Version:** vN — requirement text lives in `dev/versions/vN/spec/`
- **Use case:** UC-XXX
- **Steps:** S1-S2 (or "all")
- **Alternatives:** A1, A3 (or "all")
- **FRs in scope:** FR-NNN, FR-NNN
- **NFRs in scope:** NFR-NNN
- **Status:** _N rows · N tested · N implemented · N verified_

<!-- Every #N and file path is a clickable link (WORKFLOW.md "Linking convention"). -->

## Matrix

| FR / AC | Tier | RQ | DEC | Test (ticket) | Test author | Impl (ticket / PR) | Verified |
|---|---|---|---|---|---|---|---|
| FR-NNN / AC-1 | ci | [RQ-N](...) | [DEC-NNN](...) | [#N](https://github.com/{owner}/{repo}/issues/N) | @handle | [#N](https://github.com/{owner}/{repo}/issues/N) | [ ] |
| FR-NNN / AC-2 | eval | | | [#N](https://github.com/{owner}/{repo}/issues/N) | @handle | [#N](https://github.com/{owner}/{repo}/issues/N) | [ ] |
| NFR-NNN | ci | [RQ-N](...) | [DEC-NNN](...) | [#N](https://github.com/{owner}/{repo}/issues/N) | @handle | [#N](https://github.com/{owner}/{repo}/issues/N) | [ ] |

## Columns

- **FR / AC** — one row per in-scope acceptance criterion. An NFR with no AC uses the
  NFR itself as the row.
- **Tier** — `ci`, `eval` or `manual` (WORKFLOW.md "Test tiers"). Set in Phase 1 from the
  AC's `Check` field; the PO may change it.
- **RQ** — the answered research question for this row (may be empty).
- **DEC** — the decision that shaped this row (may be empty).
- **Test (ticket)** — the test-stub ticket that proves the AC. For a manual row, the
  check's anchor in the testing plan. **Required** for every row after Phase 2.
- **Test author** — who wrote the test. Must differ from the implementer (separation
  rule), except in a light build.
- **Impl (ticket / PR)** — the ticket or PR that makes this row pass. Not a function link.
- **Verified** — `[x]` once the PO confirms this AC in Phase 6: CI green for `ci`, a
  recorded eval run for `eval`, the PO's own check for `manual`.

## Orphan check (run at every gate)

- [ ] Every in-scope FR/AC and NFR has a row and a tier.
- [ ] Every row has at least one test (after Phase 2).
- [ ] No implementer is the test author of the same row (except light builds).
- [ ] Every in-scope DEC is consumed by at least one row (test or impl).
- [ ] Every answered RQ leads to a DEC or a row that uses its result.
- [ ] No test or implementation ticket exists without a matrix row.
