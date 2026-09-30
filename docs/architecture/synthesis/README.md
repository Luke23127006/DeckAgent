# DeckAgent Architecture Synthesis

## Purpose

This folder holds the progressive architecture synthesis for DeckAgent V1. It starts from Product
truth and moves through problems, decision options, candidate architectures, evaluation, trade-off
comparison and evidence resolution. It ends with the W-035 baseline selection.

Each file is one phase and builds on the files before it. This README is only an entry point: it
adds no decisions and does not restate the reasoning.

## Current Status

- W-033, W-034 and W-035 are complete.
- **Candidate B is the current DeckAgent V1 architecture baseline.**
- Detailed Design has **not** started.
- The phase artifacts are frozen. `10-baseline-selection.md` is the current W-035 decision record.
- The empirical items still open are **validation debt and reopen triggers**, not an open baseline
  selection (`10-baseline-selection.md` §14, §15).

## Reading Order

| File | Phase / purpose |
|---|---|
| [`01-context.md`](01-context.md) | Phase 0. Normalized Product and architecture context. |
| [`02-problem-map.md`](02-problem-map.md) | Phase 1. Architecture problems and how they couple. |
| [`03-decision-bank.md`](03-decision-bank.md) | Phase 2. Decision families and mechanism options. |
| [`04-decision-graph.md`](04-decision-graph.md) | Phase 3. Relationships, dependencies and mechanism bundles. |
| [`05-candidates.md`](05-candidates.md) | Phase 4. Candidate architectures. |
| [`06-evaluation.md`](06-evaluation.md) | Phase 5. Gate / Observability evaluation. |
| [`07-tradeoff-comparison.md`](07-tradeoff-comparison.md) | Phase 6. AC-21 … AC-27 narrative comparison. |
| [`08-evidence-resolution.md`](08-evidence-resolution.md) | Phase 8. Evidence contract, assumptions and readiness. |
| [`09-product-semantics-resolution.md`](09-product-semantics-resolution.md) | Phase 9. Product owner decisions and the resulting candidate revisions. |
| [`10-baseline-selection.md`](10-baseline-selection.md) | Phase 7. W-035 final comparison and the selected baseline. |

The phase numbers follow the order in which the phases were defined, not the file order. Phases 8
and 9 were run before Phase 7 (see `08-evidence-resolution.md`, "Phase naming").

## Selected Baseline

**Candidate B — presentation-native serialized architecture with worker isolation**
(`10-baseline-selection.md` §11, §12).

Its defining choices, at architecture level:

- a DeckAgent-owned, PPTX-shaped content form;
- serialized command coordination (one command channel, one commit command);
- a local stateless worker for AI and render work;
- delivery-time geometry evidence (MB-08 D), under the current PA-04A = N;
- origin tracking by PROV-06 + PROV-01;
- authority held by the application process;
- one separate session for each browser view.

The selection fits the current V1 context and is not universal. A-r1 is the primary alternative,
and C is a documented alternative. The reopen conditions and the validation debt are recorded in
`10-baseline-selection.md` §14 and §15.

## Source of Truth / Governance

- **Product truth** stays in Project Hub.
- **DOC-004**
  ([`architecture-acceptance-criteria.md`](../architecture-acceptance-criteria.md)) stays the
  architecture acceptance criteria.
- **DOC-008** ([`testing-approach.md`](../../testing/testing-approach.md)) stays the testing and
  evidence guidance.
- The files in this folder record the reasoning and the decision path. They do not replace the
  sources above.
- `10-baseline-selection.md` is the current W-035 decision artifact.

**Relocation note.** These files were written under `trash/architecture-synthesis/` and moved here
unchanged. Their canonical location is now `docs/architecture/synthesis/`. Files 01–09 are kept
byte-identical, because `08-evidence-resolution.md` §2 and `10-baseline-selection.md` §1 record
their sha256 prefixes as a freeze check. Those prefixes were taken over the original working-tree
bytes, which mixed LF and CRLF line endings; Git normalizes line endings, so a fresh checkout may
not reproduce them. From this commit on, Git history is the integrity record. So:

- files 01–07 still describe themselves as scratch files under `trash/`. Read that as history;
- relative `evidence/…` paths in 08 point to `trash/architecture-synthesis/evidence/` (08 §1).

The spike evidence and a working copy of DOC-004 remain in `trash/architecture-synthesis/`. That
folder is gitignored, so the evidence is local-only.

## Next Step

**Detailed Design / implementation planning.** It has **not** started in these synthesis
artifacts. `10-baseline-selection.md` §12 and §16 list the boundaries left open for it.
