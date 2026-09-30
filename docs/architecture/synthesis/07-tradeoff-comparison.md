# Phase 6 — Architecture Trade-off Comparison

- Inputs (frozen): `01-context.md` … `06-evaluation.md`.
- Authoritative sources consulted:
  - DOC-004 §9, for the AC-21 … AC-27 questions;
  - the Project Hub snapshot, for C-002, C-003 and C-004 only.
- Supporting: DOC-008, only where `06-evaluation.md` already relies on it.
- Built: 2026-09-30. This is a scratch file under `trash/` (gitignored). No frozen artifact and no
  Project Hub record was modified.

## 1. Phase boundary

- **In scope:**
  - how Candidates A, B and C differ on each trade-off dimension (AC-21 … AC-27);
  - which decisions cause those differences, and which costs purchase which benefits;
  - which differences are stable, and which depend on open evidence or Product answers;
  - the decision surfaces Phase 7 must face.
- **Out of scope:**
  - selecting, recommending, ranking or scoring a candidate;
  - naming a winner on any criterion;
  - weighting criteria;
  - resolving PA or SA items, or assuming spike results;
  - revising candidates, or using their fallbacks;
  - W-035 baseline selection.
- **Language.** Differences are stated as causal chains: decision → consequence → benefit → cost →
  exposure → evidence. Qualitative descriptors appear only where a frozen artifact supports them,
  and none of them is ordinal.

## 2. Input consistency check

The frozen `06-evaluation.md` was checked against the expected Phase 5 state.

| Expected item | Frozen Phase 5 | Match |
|---|---|---|
| No `Does not meet` Gate for any candidate | None (§6, §7) | Yes |
| A Gate NYA: AC-03, AC-10, AC-30 | AC-03, AC-10, AC-30 | Yes |
| B Gate NYA: AC-01, AC-03, AC-06, AC-10, AC-30 | Same | Yes |
| C Gate NYA: AC-02, AC-03, AC-10, AC-11, AC-28, AC-30 | Same | Yes |
| Observability NYA: A none; B AC-14, AC-18; C none | Same | Yes |
| AC-05 `Meets` for A, B, C as the derivation invariant; AG-02 not an AC-05 blocker; AG-02 still a Phase 4 invalidation condition via R-028 | Same (§4 AC-05; §9) | Yes |
| SA-P4-01 superseded and closed by Product truth (reload ends the session); P5-TENSION-01 is a reopen trigger only | Same (§2; §11) | Yes |
| GC-P4-01 accepted; P5-TENSION-02 recorded; AG-P5-01 defined | Same | Yes |

**P6-INPUT-TENSION:** none. No candidate is revised in this phase, and no fallback branch is used as
the compared state.

## 3. Candidate structural snapshot

This table is taken from `05-candidates.md` §3 and §7.

| Concern | Candidate A | Candidate B | Candidate C |
|---|---|---|---|
| State shape (X-1) | Immutable version values + authoritative references (STATE-03) | Mutable accepted / pending slots + per-operation candidate areas (STATE-02) | Append-only transition log with immutable payloads (STATE-04); constraint ledger (INTENT-02) |
| Coordination (X-2) | Guarded atomic transitions, compare-and-set (OP-06, OP-04) | One serialized command channel (OP-07, OP-05); per-operation coordinator (OP-02) | Guarded conditional log appends (OP-06, OP-04) |
| Content form (X-3) | Format-neutral deck model (DELIV-01) | DeckAgent-owned PPTX-shaped model (DELIV-02a) | Web-rendered form with native PPTX conversion (DELIV-03 native) |
| Validation / geometry (X-4) | Pre-display, geometry computed by the product (VALID-02, OBS-01); headless render path (OBS-04) | Content-only admission gate; geometry from produced files at delivery (VALID-01, OBS-03, VALID-06, OBS-05, VALID-03) | Pre-display render-then-measure in the page's engine (VALID-02, OBS-02, OBS-04) |
| Runtime boundary (X-5) | In-process ports (DEP-01) | Ports + a stateless worker process (DEP-01 + DEP-03) | Ports + a confined external agent runtime (DEP-01 + DEP-02c) |
| Provenance (X-6) | By construction from pre-extracted source items (PROV-05, SOURCE-02) | Model-declared, verified against source items (PROV-06) | Model-declared, verified against source text (PROV-06) |
| Authority location | The local application process that serves the page | The local application process; AI and render work run in the worker | The page (one authority per page instance); the host is stateless for the lifecycle |
| Export stability | Value captured by identity (DELIV-04) | Private copy by a channel command (DELIV-05) | Immutable payload captured by identity (DELIV-04, under GC-P4-01) |
| Session-loss evaluation | Authority records + pushed page mirror (SESSION-01 + SESSION-02) | Authority records + pushed page mirror (SESSION-01 + SESSION-02) | Direct reads of the log in the page (SESSION-01) |

## 4. Eligibility context from Phase 5

This section is context only. It shows that being compared does not make a candidate eligible for
W-035 selection. The lists are factual and are not compared.

**Candidate A**
- Gate failures: none.
- Gate NYA: AC-03, AC-10, AC-30.
- Observability NYA: none.
- Unresolved Product blockers: SA-P3-02 (AC-03); PA-04 (AC-10).
- Unresolved empirical blockers:
  - AG-01a (AC-10);
  - AG-01b (AC-10, only if PA-04 selects a rendered check);
  - AG-09 (AC-30).

**Candidate B**
- Gate failures: none.
- Gate NYA: AC-01, AC-03, AC-06, AC-10, AC-30.
- Observability NYA: AC-14, AC-18.
- Unresolved Product blockers: PA-04 (AC-06, AC-10); SA-P3-02 (AC-03, through AG-P5-01).
- Unresolved empirical blockers:
  - AG-01b (AC-01, AC-14, AC-18);
  - AG-P5-01 (AC-03);
  - AG-09 (AC-30).

**Candidate C**
- Gate failures: none.
- Gate NYA: AC-02, AC-03, AC-10, AC-11, AC-28, AC-30.
- Observability NYA: none.
- Unresolved Product blockers: SA-P3-01 (AC-28, AC-30); PA-04 (AC-10); SA-P3-02 (AC-03, through
  AG-P5-01).
- Unresolved empirical blockers:
  - AG-P4-01 (AC-02, AC-11);
  - AG-01b (AC-10);
  - AG-P5-01 (AC-03).

**All three:** AG-02 is required before W-035 as candidate-viability evidence (R-028 and the
Phase 4 invalidation conditions). It blocks no Gate.

## 5. AC-21 — Team feasibility and learning curve

### Comparison question

DOC-004 asks:

- how many unfamiliar or custom subsystems each candidate requires, relative to team capacity;
- which subsystems must be custom-built;
- which rely on technology the team has not used;
- how the work is distributed across owners.

C-002 (Active) limits the team's time, headcount and capability. It warns against architectures
that make the team build very large subsystems. No source records the team's specific skills, so
nothing here infers them (see AG-P6-01, §19). Each profile below separates the **implementation
surface** (code to build), the **conceptual learning** (models to understand) and the
**operational learning** (what must run and be debugged).

### Candidate A

- Relevant decisions: DELIV-01, OBS-01, OBS-04, STATE-03 with MB-05 G, PROV-05 with SOURCE-02,
  DEP-01.
- Structural consequence:
  - *Implementation surface:*
    - a DeckAgent-owned format-neutral model;
    - a layout computation that produces geometry, including text fit;
    - a web render of the model, used by the page and headless;
    - a PPTX writer, and a PDF writer (or a print of the render);
    - source-item extraction for by-construction placement.
  - *Conceptual:* immutable values with compare-and-set transitions over references, and a
    layout model with text metrics.
  - *Operational:* one process.
- Benefit purchased: no inter-process protocol and no converter on the preview or admission path.
  Lifecycle reasoning lives in one place (05 §4 *Benefits*).
- Cost accepted: an owned layout computation, plus three output paths kept consistent with one
  model (05 §4 *Trade-offs* AC-21).
- Failure / maintenance exposure: the model, the layout computation and the writers evolve
  together (05 §4 *Complexity*: "moderate" maintenance). The layout computation must track real
  text metrics (NPC-10).
- Evidence uncertainty:
  - AG-01a: a failure adds a render-then-measure path to admission (medium reversibility).
  - AG-02: may narrow the model to writer-expressible features.
  - P6-TENSION-01: it is not fixed whether the writers are owned code or libraries.

### Candidate B

- Relevant decisions: STATE-02, MB-05 S (channel), OP-02, OP-05, DEP-03, DELIV-02a, MB-08 D,
  PROV-06.
- Structural consequence:
  - *Implementation surface:*
    - a PPTX-shaped model with a native serializer;
    - a command channel with per-operation coordinators;
    - a worker process and its message protocol;
    - converter integration for preview, PDF and geometry;
    - round-trip re-reading (VALID-06);
    - declared-span verification.
  - *Conceptual:* serialized command semantics, coordinator detachment, and cross-process event
    ordering (a worker event must be enqueued, never applied directly; E-39, E-55).
  - *Operational:* two processes plus a converter, and orphaned-worker handling (05 §5 *Risks*).
- Benefit purchased: races reduce to command order. No layout engine is owned, because text-fit
  geometry is read from produced files.
- Cost accepted: channel semantics, a worker lifecycle and a protocol (05 §5 *Trade-offs* AC-21);
  "moderate to high" implementation (05 §5 *Complexity*).
- Failure / maintenance exposure: the model follows the PPTX object model, and the converter is an
  external moving part (05 §5 *Complexity*).
- Evidence uncertainty:
  - AG-01b and AG-02 (converter capability and fidelity).
  - PA-04: its other answer adds pre-display geometry, which B does not currently build.

### Candidate C

- Relevant decisions: STATE-04, INTENT-02, REQ-02, page-held authority, DELIV-03 native, OBS-02,
  OBS-04, DEP-02c, PROV-06.
- Structural consequence:
  - *Implementation surface:*
    - log derivation and conditional appends in the page;
    - a constraint ledger;
    - a render-and-measure gate;
    - a web form → native PPTX converter;
    - external runtime integration under a confinement contract;
    - stateless host ports.
  - *Conceptual:* event-log derivation (versions, slot, outcomes and ledger are all derived), and
    what the confinement contract requires of the runtime.
  - *Operational:* page, host and runtime process. Lifecycle state lives in browser memory.
- Benefit purchased: layout comes from the browser engine rather than owned code. Preview,
  validation render and PDF share that engine. No worker protocol carries state.
- Cost accepted: "high" implementation (05 §6 *Complexity*), covering the converter, log
  derivation and runtime confinement. Confinement removes much of the runtime's tool-using benefit
  (C-14).
- Failure / maintenance exposure: the converter tracks both web rendering and PPTX ("moderate to
  high" maintenance, 05 §6).
- Evidence uncertainty:
  - AG-P4-01: can the runtime be confined at all? This is viability of DEP-02c, not effort.
  - AG-02 (converter scope).
  - P6-TENSION-01 (converter owned or external).

### Cross-candidate contrast

- **Layout knowledge.**
  - A owns layout as code.
  - B obtains text fit from produced files through a converter.
  - C delegates layout to the browser engine and owns a web → PPTX conversion instead.
- **Coordination.**
  - B's coordination adds a process boundary and a message protocol to the learning surface.
  - A and C coordinate inside one authority: A with compare-and-set, C with conditional appends.
- **State model.**
  - C's state model is derived from an event log.
  - A's and B's state models hold versions directly: as values in A, as mutable slots in B.
- **External runtime.** C carries an external agent runtime whose integration cost includes
  confinement work. A and B call the AI provider through DeckAgent-owned ports.
- **Operations.** A runs one process. B runs two processes plus a converter. C runs a page, a host
  and a runtime process.
- **C-002 concern.** C-002 names "very large subsystems" as the concern. The sources do not say
  whether any candidate's owned subsystem reaches that size, so this contrast cannot be closed
  without AG-P6-01.

### Evidence sensitivity

**Material.**

- AG-01a can add a render path to A's admission.
- PA-04 can add pre-display geometry to B.
- AG-P4-01 can remove C's runtime confinement work if C is revised to DEP-01 (a reopen condition,
  not the compared state).
- AG-02 can change the writer or converter scope for all three.
- Team-capability evidence (AG-P6-01) is missing for every candidate.

## 6. AC-22 — External dependency cost

### Comparison question

DOC-004 asks:

- which external models, libraries or renderers are critical, and where they sit on the Core
  Flow;
- how replaceable each one is;
- what happens when one fails or changes;
- what behaviour, cost or licensing risk each brings.

Kept separate below:

- **resource cost after a stop** (AG-03), which is not stop correctness;
- **confinement viability** (AG-P4-01), which concerns whether C's DEP-02c choice is valid, not
  its cost.

### Candidate A

- Relevant decisions: DEP-01 only, DELIV-01, OBS-04, and OP-01 with no OP-03.
- Structural consequence:
  - Generation and refinement depend on the AI provider through an in-process port.
  - Preview is the browser's render of the model.
  - A headless render serves AC-18. It sits on the admission path only if PA-04 requires a
    rendered check.
  - The PPTX and PDF writers sit on the export path.
- Benefit purchased:
  - The AI provider is replaceable at one adapter.
  - No external converter sits on the preview or admission path.
- Cost accepted: after a stop, outstanding provider calls complete and are discarded. There is no
  kill-on-stop, so consumption continues (AG-03).
- Failure / maintenance exposure: a provider failure is an operation error and blocks only
  generation or refinement. A writer failure fails the export and changes no version (AC-09).
- Evidence uncertainty:
  - AG-03 (the cost after a stop).
  - P6-TENSION-01: whether the writers are libraries decides whether their change or licensing
    risk counts as an external dependency.

### Candidate B

- Relevant decisions: DEP-03, OP-03, DELIV-02a, OBS-05, OBS-03.
- Structural consequence: the critical path includes:
  - the AI provider, called from the worker;
  - a PPTX → image / PDF converter, used for preview, PDF export and delivery-time geometry;
  - the worker process.
- Benefit purchased: stop terminates the worker's in-flight work (OP-03), which bounds local worker
  resource consumption after a stop. Whether an outstanding external-provider invocation also stops
  consuming depends on AG-03.
- Cost accepted:
  - A converter failure or behaviour change affects preview, PDF and geometry evidence together.
  - The converter's semantic surface is PPTX rendering.
- Failure / maintenance exposure: the converter is "an external moving part" (05 §5 *Complexity*).
  Replacing it touches three paths.
- Evidence uncertainty:
  - AG-01b and AG-02 (converter capability and fidelity).
  - AG-03: does worker termination reach outstanding provider calls?

### Candidate C

- Relevant decisions: DEP-02c, OP-03, OBS-02, OBS-04, DELIV-03 native.
- Structural consequence: the critical path includes:
  - the external agent runtime, for generation and refinement, reaching the AI provider;
  - the browser render engine, for the gate, preview and PDF;
  - the web → native PPTX converter, for PPTX export.
- Benefit purchased: the render engine is the page itself, so no separate renderer process is
  needed.
- Cost accepted:
  - A runtime change must be re-checked against the confinement contract.
  - If the runtime invocation cannot be terminated physically, it keeps consuming after a stop
    (AG-03; correctness is unaffected).
  - Confinement removes much of the runtime's stated benefit (C-14).
  - The render engine is on the admission path (E-50: stop latency, C-03).
- Failure / maintenance exposure: a runtime failure blocks generation and refinement, and becomes
  an operation failure. A render failure in the gate becomes an operation failure.
- Evidence uncertainty:
  - **AG-P4-01** (viability of DEP-02c; separate from cost).
  - AG-03 (runtime termination).
  - AG-01b (render reliability on the admission path).

### Cross-candidate contrast

- **Generation path.** A and B reach the AI provider through DeckAgent-owned ports. C reaches it
  through an external runtime that must satisfy a confinement contract.
- **Preview path.**
  - B's preview and PDF depend on an external PPTX converter.
  - A's preview depends on the browser rendering its own model.
  - C's preview, gate and PDF depend on the browser engine.
- **Admission path.**
  - C places a render dependency on the admission path in every case.
  - A does so only under a PA-04 answer that requires a rendered check.
  - B places none there.
- **Stopping external work.**
  - A has no stop-time termination.
  - B terminates worker work.
  - C terminates the runtime invocation if that is possible (AG-03).

  This is a resource-cost difference only. All three reject late results at admission.
- **Replaceability.** In A, changing an output dependency touches export only. In B, a converter
  change touches preview, PDF and geometry evidence together. In C, a runtime change touches
  generation and needs confinement re-verification.

### Evidence sensitivity

**Material.**

- AG-01b decides whether B's converter is usable at all, and whether C's admission-path render is
  reliable.
- AG-P4-01 decides whether C's runtime dependency exists as defined.
- AG-03 changes only the after-stop cost column.
- P6-TENSION-01 moves A's and C's writer or converter cost between AC-21 (owned) and AC-22
  (library).

## 7. AC-23 — Blast radius

### Comparison question

DOC-004 asks which parts change if a key assumption fails, and what else stops if one part fails
at runtime. Three failure effects are kept apart:

- **session loss:** the deck and its session are gone;
- **version corruption:** accepted or pending state becomes wrong;
- **operation failure:** the operation ends in error, and the state is the recovery baseline.

### Candidate A

- Relevant decisions: one process (DEP-01 only), STATE-03, the authority in the application
  process.
- Structural consequence:
  - A crash in an adapter or in the layout code inside the authority process **ends the session**
    (05 §4 *Failure / stop model*).
  - An external provider error or timeout is an **operation failure**.
  - **Version corruption** by a failure mid-operation is excluded: values are immutable, and
    references change only at a guarded transition.
  - The page is a view. The session-loss mirror is pushed to it.
- Benefit purchased: no cross-process state to reconcile after a failure.
- Cost accepted: there is no process-level isolation, so one fault in any in-process component
  ends the session.
- Failure / maintenance exposure: an in-process adapter that blocks stalls the authority (05 §4
  *Risks*).
  - Assumption failures:
    - AG-01a failing changes the geometry source and adds a renderer to the admission path;
    - the other SA-P3-02 answer changes X-6, which touches ingestion and the AI output contract;
    - AG-02 failing changes X-3.
- Evidence uncertainty: the likelihood of an in-process crash is not known. AG-01a, SA-P3-02 and
  AG-02 decide the assumption-failure surface.

### Candidate B

- Relevant decisions: DEP-03, the serialized channel, the authority in the application process,
  and a converter on the preview and PDF paths.
- Structural consequence:
  - A worker failure, whether in AI or render work, ends at a point set by where in the lifecycle
    it happens:
    - AI generation or validation failing before the C-02 logical success boundary is an
      **operation failure** (error), and no version is created;
    - preview rendering failing after admission leaves the pending version in place, because it
      already exists. This is the SA-05 preview-failure case, and it does not retroactively change
      an operation that is already `done`;
    - export rendering or conversion failing is an **export failure** under AC-09, with no version
      change.
  - A stalled channel blocks every action in the session, but corrupts nothing.
  - A crash of the authority process is **session loss**.
  - In none of these cases does a worker failure take down the session or corrupt a version.
- Benefit purchased: AI and render failures are contained behind the worker boundary. Their
  terminal outcome depends on the lifecycle point, as listed above.
- Cost accepted:
  - The channel is a single point of stall.
  - Worker events racing a stop must be ordered through the channel (E-39, E-55).
- Failure / maintenance exposure: an orphaned worker keeps consuming after a stop (05 §5 *Risks*).
  - Assumption failures:
    - the other PA-04 answer changes X-4, putting a render or layout step before admission;
    - AG-01b or AG-02 failing leaves no branch within X-3.
- Evidence uncertainty: AG-01b, AG-02, PA-04.

### Candidate C

- Relevant decisions: the authority in the page, a stateless host, DEP-02c, OBS-02.
- Structural consequence:
  - A page crash is **session loss**: the state is in page memory.
  - A crash of the host or the runtime is an **operation failure**, and the page keeps its log.
  - A render failure in the gate is an **operation failure**.
  - **Version corruption** by the host or runtime is excluded: only the page appends, and runtime
    output reaches the page only as the return value of the page's own call (06 §2).
- Benefit purchased: nothing outside the page can corrupt lifecycle state.
- Cost accepted: the page is the single holder of session state, and its lifetime bounds the
  session.
- Failure / maintenance exposure: page memory pressure from large decks and a growing log (05 §6
  *Risks*).
  - Assumption failures:
    - the SA-P3-01 answer "shared session" moves the authority out of the page;
    - AG-02 failing changes X-3;
    - AG-01b failing together with a PA-04 geometry answer changes X-4;
    - AG-P4-01 failing changes only X-5.
- Evidence uncertainty: SA-P3-01, AG-02, AG-01b × PA-04, AG-P4-01.

### Cross-candidate contrast

- **What a crash of the part holding state costs.** In A and B, a crash of the application process
  loses the session. In C, a crash of the page loses it.
- **Where AI and render failures land.**
  - In A, AI and layout failures inside the authority process can take the session with them.
  - In B, they are held at the worker boundary. The outcome depends on the lifecycle point:
    - an operation error before the success boundary;
    - the SA-05 preview-failure case after admission;
    - an export failure (AC-09) during export.
  - In C, AI and host failures are held outside the page, and render failures in the gate become
    operation failures.
- **Stall points.** B has a session-wide stall point (the channel). A's stall point is a blocking
  in-process adapter. C's is the page's own event loop, which the sources do not discuss.
- **Version corruption.** It is excluded by structure in all three: values in A, ordered copy-in
  in B, conditional appends in C.
- **How far a failed assumption spreads.**
  - A: X-6 (ingestion and AI contract) or X-3.
  - B: X-4 (the admission path) or X-3.
  - C: the authority location (a Product answer) or X-3.

### Evidence sensitivity

**Material for the assumption-failure half; stable for the runtime-failure half.** The runtime
failure boundaries are structural. Which assumption failure actually occurs depends on SA-P3-02
(A), PA-04 (B), SA-P3-01 (C), and AG-02 (all).

## 8. AC-24 — Rollback and redesign cost

### Comparison question

DOC-004 asks which choices are costly to reverse, which reopen conditions would force redesign,
and how much would change. Reversibility is taken from 05 *Reversibility* for §4, §5 and §6.
DOC-002 §20 was not read (AG-08); only the candidates' own reopen conditions are used.

### Candidate A

- Relevant decisions:
  - low reversibility: STATE-03, DELIV-01, PROV-05;
  - medium: OBS-01 → OBS-02;
  - high: EXPORT-05, the SESSION-01 / SESSION-02 split, adding DEP-03, ROLE-01.
- Structural consequence: the redesign cost lives in the content model and value semantics, and in
  provenance by construction, which shapes source ingestion and the AI output contract.
- Benefit purchased:
  - A geometry-source failure (AG-01a) is absorbed by a medium-reversibility switch within the same
    state shape.
  - A process boundary can be added later (DEP-03 is high reversibility for A).
- Cost accepted: two reopen conditions touch low-reversibility choices:
  - the other SA-P3-02 answer moves X-6 to Variant M, changing ingestion, the AI contract and
    validation of declared spans;
  - an AG-02 invalidation changes X-3, reaching model, layout, render and writers.
- Failure / maintenance exposure: the X-3 and X-6 reopen conditions (05 §4 *Reopen conditions*).
- Evidence uncertainty: AG-02, SA-P3-02, AG-01a.

### Candidate B

- Relevant decisions:
  - low reversibility: DELIV-02a, STATE-02, the serialized channel as the coordination backbone;
  - medium: DEP-03 (can collapse into DEP-01);
  - high: EXPORT-05, SESSION-01 / SESSION-02, the VALID-03 lane, provenance verification rules.
- Structural consequence: the redesign cost lives in the PPTX-shaped content form, slot copy
  semantics, and the channel that orders every action.
- Benefit purchased: the process boundary can be removed without touching state, and provenance
  rules can change locally.
- Cost accepted: two reopen conditions touch low-reversibility choices:
  - the other PA-04 answer changes X-4 (restructuring: render or layout before admission, with
    effects on operation lifetime and stop latency);
  - an AG-02 or AG-01b invalidation leaves no branch within X-3.
- Failure / maintenance exposure: 05 §5 *Reopen conditions*.
- Evidence uncertainty: PA-04, AG-01b, AG-02.

### Candidate C

- Relevant decisions:
  - low reversibility: STATE-04, DELIV-03, page-held authority;
  - medium: DEP-02c (replaceable by DEP-01 without touching state);
  - high: EXPORT-05, VALID-06 rules, ROLE-01, provenance verification rules.
- Structural consequence: the redesign cost lives in the log model, the web content form, and the
  placement of authority in the page.
- Benefit purchased:
  - An AG-P4-01 failure is absorbed at medium reversibility.
  - The ledger represents constraint lifetimes as attributed events, so PA-06 answers need no restructuring (05 §6 *Benefits*,
    PA-06).
- Cost accepted: four reopen conditions touch low-reversibility choices:
  - the SA-P3-01 answer "shared session" relocates the authority;
  - a Product change reopening SA-P4-01 (P5-TENSION-01) relocates the authority;
  - an AG-02 failure changes X-3;
  - an AG-01b failure together with a PA-04 geometry answer changes X-4.

  The SA-P3-01 answer "not allowed" is additive: a cross-view refusal mechanism.
- Failure / maintenance exposure: 05 §6 *Reopen conditions*.
- Evidence uncertainty: SA-P3-01, AG-02, AG-01b × PA-04, AG-P4-01; P5-TENSION-01 as a reopen
  trigger only.

### Cross-candidate contrast

- **Reopen conditions do not all touch the same kind of surface:**
  - A's Product-sensitive one (SA-P3-02) touches the **provenance and ingestion contract**;
  - B's (PA-04) touches **validation placement and the admission path**;
  - C's (SA-P3-01) touches **authority location and the session boundary**.
- **AG-02** touches the content form (X-3) in all three. In B and C, Phase 4 records no branch
  within X-3. In A, it records a narrowing branch: "narrow the model to writer-expressible
  features".
- **Runtime boundary.** It is medium reversibility in B (collapse the worker) and C (replace the
  runtime), and high reversibility in A (add a worker).
- **Coordination.** B's serialized channel is a low-reversibility backbone. For A and C, Phase 4
  lists no coordination item among the low-reversibility choices: coordination is part of their
  state mechanics (guarded transitions or appends).
- **State shape.** It is low reversibility in all three, with different contents: values, slots,
  or a log.

### Evidence sensitivity

**Product-sensitive and evidence-sensitive.** Which reopen conditions actually fire depends on
SA-P3-02 (A), PA-04 (B), SA-P3-01 (C), AG-02 (all), and AG-01b × PA-04 (C). The location of
low-reversibility commitments is stable.

## 9. AC-25 — Testability cost

### Comparison question

DOC-004 asks:

- what must be built only for testing;
- which DOC-008 §5.3 checks can run as runtime validation;
- how quickly a new degradation can be observed;
- whether the constraint set can be read (TN-1);
- whether external calls can be substituted (TN-3);
- whether the Core Flow can run without the interactive UI (TN-5).

This compares how testable each architecture is, not how many tests it needs.

### Candidate A

- Relevant decisions: STATE-03 with compare-and-set in one process, DEP-01 in-process ports,
  OBS-01, INTENT-01, VALID-05 without VALID-06.
- Structural consequence:
  - **State tests:** deterministic transitions over values, in one process.
  - **Substitution (TN-3):** at in-process ports.
  - **Without the UI (TN-5):** the authority is separate from the page. The Core Flow can be
    driven against it, though the interface is not specified.
  - **Constraints (TN-1):** in each value.
  - **Geometry gate:** testable without renders.
  - **Real-file tests:** a test-side comparison of files against the value (no VALID-06).
  - **§5.3 checks possible before display:** structural, P1, P2, HM-1, HM-4 (computed). HM-3
    render errors need the optional rendered stage.
- Benefit purchased: gate and lifecycle tests need no browser, converter or second process.
- Cost accepted: agreement between computed and real geometry is a separate test concern
  (NPC-10). New output degradations surface only through test-side comparison.
- Failure / maintenance exposure: a drift between computed layout and real outputs can let decks
  pass the gate and still overflow (05 §4 *Risks*).
- Evidence uncertainty: AG-01a, PA-04.

### Candidate B

- Relevant decisions: the serialized channel, DEP-03, OBS-03, VALID-06, OBS-05, INTENT-01.
- Structural consequence:
  - **State tests:** command sequences through one channel, where order is the test input.
  - **Substitution:** at ports and at the worker boundary.
  - **Stop, late-result and concurrency cases:** involve cross-process event ordering, which a
    test must hold and release.
  - **Without the UI:** the authority is separate from the page.
  - **Constraints:** in the slots.
  - **Geometry tests:** need real files and the converter.
  - **Real-file tests:** round-trip and geometry evidence at every export (VALID-06).
  - **§5.3 checks possible before display:** structural, P1, P2, HM-3 "no content". HM-1 and HM-4
    are not possible before display.
- Benefit purchased: every export produces geometry and round-trip evidence from the real file.
  The admission gate is testable without renders.
- Cost accepted: a worker and a converter are part of the test environment for geometry, preview
  and rendered-view tests.
- Failure / maintenance exposure: overflow that passes the gate is found at export (05 §5
  *Risks*), so tests must cover the case where it was already displayed.
- Evidence uncertainty: PA-04, AG-01b.

### Candidate C

- Relevant decisions: STATE-04 with VALID-08, authority in the page, OBS-02 and OBS-04, VALID-06,
  INTENT-02, host ports.
- Structural consequence:
  - **State tests:** log replay.
  - **Validation outcomes:** logged as events.
  - **Substitution:** at host ports, including the runtime port, where responses can be held and
    released.
  - **Without the UI:** needs a page context, whether headless or not, because the authority is
    the page.
  - **Constraints:** the ledger.
  - **Gate tests:** need the render engine.
  - **Real-file tests:** VALID-06 against the measured render at every export.
  - **§5.3 checks possible before display:** structural, P1, P2, HM-1, HM-3, HM-4 (measured).
- Benefit purchased: the log gives deterministic replay and a record of every lifecycle event. The
  gate and the preview use the same rendering engine. Whether offscreen measurement reliably
  represents the displayed render is AG-01b.
- Cost accepted: a browser environment is required for lifecycle, gate and non-UI Core Flow tests.
- Failure / maintenance exposure: gate reliability depends on offscreen render behaviour (AG-01b).
- Evidence uncertainty: AG-01b, PA-04.

### Cross-candidate contrast

- **Environment for lifecycle and gate tests.**
  - A needs none beyond its own process.
  - B's gate needs none; its geometry tests need the worker and converter.
  - C needs a page context for both.
- **Geometry evidence.**
  - A tests computed geometry and must test its agreement with outputs separately.
  - B tests geometry on real files after admission.
  - C tests geometry on the displayed render before admission.
- **Recording of lifecycle history.**
  - C records it as log events.
  - A and B hold current state plus operation records.
- **Substitution points.** In-process ports (A); ports plus the worker boundary (B); host ports,
  including the runtime (C).
- **Degradation discovery.** B and C run a round-trip comparison at every export (VALID-06). A
  relies on test-side comparison.

### Evidence sensitivity

**Material.**

- PA-04 decides whether B's missing pre-display geometry is a test gap or a restructuring.
- AG-01a decides how much agreement testing A needs.
- AG-01b decides whether C's gate tests are reliable.

The environment differences are stable.

## 10. AC-26 — Output-target extensibility

### Comparison question

DOC-004 asks:

- what adding a further output format would touch outside export;
- which format capability differences it would expose (C-004).

C-003 expects further formats but fixes neither how many nor which, so no future format is
assumed here.

### Candidate A

- Relevant decisions: DELIV-01, the format capability model (NPC-12), owned writers.
- Structural consequence: a new target is a new writer over the neutral model, and the capability
  model gains an entry.
- Benefit purchased: most of the impact stays on the export side, because one model feeds every
  writer (05 §4 *Benefits*).
- Cost accepted:
  - The capability model is large for a neutral form (04 NPC-12: "large for DELIV-01 and
    DELIV-03").
  - A target that needs features the model lacks changes the model, which is low reversibility.
- Failure / maintenance exposure: capability gaps surface only at export (05 §4 *Risks*).
- Evidence uncertainty: AG-02 shows how far the model is from native PPTX, and that pattern
  repeats per target.

### Candidate B

- Relevant decisions: DELIV-02a, the PPTX → image / PDF converter.
- Structural consequence: a new target is either derived from PPTX through a converter, or a
  second writer from the PPTX-shaped model.
- Benefit purchased: targets that a converter already derives from PPTX need no new writer.
- Cost accepted:
  - PPTX object-model concepts in the content form carry into non-PPTX targets (C-004
    differences).
  - The capability model is small for a PPTX-shaped form (NPC-12: "smaller for DELIV-02a and
    DELIV-02b"), but non-PPTX targets inherit PPTX's capabilities.
- Failure / maintenance exposure: each derived target inherits converter drift.
- Evidence uncertainty: AG-02 (converter coverage).

### Candidate C

- Relevant decisions: DELIV-03 native, the page render engine.
- Structural consequence: a new target is a converter from the web form. HTML and image targets
  come from the existing render.
- Benefit purchased: web-derived targets add little outside export.
- Cost accepted:
  - Each non-web target needs a converter that tracks web rendering.
  - The capability model is large (NPC-12).
- Failure / maintenance exposure: HTML / CSS features with no equivalent in a target pass the gate
  and degrade at export (05 §6 *Risks*, for PPTX).
- Evidence uncertainty: AG-02 (the web → native fidelity pattern).

### Cross-candidate contrast

- **Where a new target attaches.** In A, a writer over a neutral model. In B, the PPTX form (by
  conversion or a second writer). In C, a converter from the web form.
- **Which representation's concepts a new target inherits.**
  - A: the neutral model's concepts.
  - B: PPTX object-model concepts.
  - C: web layout concepts.
- **Size of the format capability model (NPC-12).** Large for A and C, small for B. In B, the
  capability questions move to non-PPTX targets.
- **Targets close to the content form.** In C, web and image targets are close to the content form.
  In B, PPTX-derived targets are close. In A, no target is native to the model.

### Evidence sensitivity

**Moderate.** AG-02 shows the fidelity pattern of each candidate's conversion boundary. Other
targets would face the same pattern. The attachment point of a new target is stable.

## 11. AC-27 — Translation readiness

### Comparison question

DOC-004 asks:

- whether translation can run through the same path as other deck-level refinement;
- what happens to layout when every text length changes;
- how language interacts with active constraints (AC-04).

Translation is traced through the chain: translated text → layout or reflow → validation → preview
→ PPTX / PDF. Three things are kept apart:

- **architecture readiness** (is there a path?);
- **fidelity evidence** (does the output hold?);
- **Product validation selection** (which checks run, PA-04).

Font strategy is not required (DOC-004).

### Candidate A

- Relevant decisions: DELIV-01, OBS-01, VALID-02, INTENT-01.
- Structural consequence: the full path is:
  1. Translated text replaces text in a new value.
  2. The owned layout computation recomputes the geometry.
  3. Geometry checks run before display, as PA-04 selects.
  4. The page renders the preview.
  5. The writers produce PPTX and PDF from the model and computed layout.

  A language constraint lives in the value.
- Benefit purchased: *readiness:* the same refinement path is used, and length changes are checked
  before display.
- Cost accepted: every text length changes at once, which places the full weight on the accuracy of
  the layout computation. That accuracy covers new scripts and lengths.
- Failure / maintenance exposure: a computed fit can differ from the real fit in outputs (AG-01a ×
  AG-02 × NPC-10).
- Evidence uncertainty: *fidelity:* AG-01a, AG-02. *Product:* PA-04.

### Candidate B

- Relevant decisions: DELIV-02a, MB-08 D, VALID-06, INTENT-01.
- Structural consequence: the full path is:
  1. Translated text replaces text inside native shapes in the candidate area.
  2. The content-only gate runs, and the result is admitted.
  3. The preview is produced through the PPTX render.
  4. Text fit is known from produced files, at delivery (VALID-06, OBS-03).
- Benefit purchased: *readiness:* the same path is used, and native shapes carry over unchanged
  except for their text.
- Cost accepted: under B's PA-04 assumption, overflow caused by translation is found at export,
  after the pending version was shown (05 §5 *Trade-offs*, AC-27).
- Failure / maintenance exposure: text fit depends on the converter rendering the new text as the
  real application would.
- Evidence uncertainty: *Product:* PA-04. *Fidelity:* AG-01b, AG-02.

### Candidate C

- Relevant decisions: DELIV-03 native, OBS-02, INTENT-02.
- Structural consequence: the full path is:
  1. Translated text is written into a new payload.
  2. The browser reflows it.
  3. The reflow is measured before admission.
  4. The preview uses the same engine, and the PDF is a print of the render.
  5. The PPTX conversion must reproduce the reflowed layout.

  The ledger holds the language constraint.
- Benefit purchased: *readiness:* the same path is used, and fit is measured before admission with
  the engine that renders the preview. Whether that measurement reliably represents the displayed
  render is AG-01b.
- Cost accepted: the web → PPTX conversion must follow a reflow of every text on every slide.
- Failure / maintenance exposure: reflow features without a native PPTX equivalent degrade at
  export (05 §6 *Risks*).
- Evidence uncertainty: *fidelity:* AG-02, AG-01b. *Product:* PA-04.

### Cross-candidate contrast

- **Readiness.** All three route translation through the normal deck-level refinement path. No
  candidate needs a new path.
- **Where translation pressure lands.**
  - A: the owned layout computation.
  - B: text inside PPTX-shaped shapes, with fit known after output.
  - C: browser reflow followed by the PPTX conversion.
- **When a translated deck's fit is known.**
  - A: before display, from computed geometry.
  - B: at delivery, from real files.
  - C: before display, from a measured render.
- **Language constraint.** It lives in the value (A), in the slot (B), or in the ledger (C).

### Evidence sensitivity

**Material.**

- PA-04 decides whether B's after-display fit is acceptable at all or restructures B.
- AG-01a and AG-02 decide whether A's before-display fit matches the outputs.
- AG-02 decides whether C's conversion follows the reflow.

## 12. Cross-cutting consequence chains

### CH-1 — Representation chain (X-3)

Content form → validation information → preview path → export path → extensibility → translation.

- **Decisions:** DELIV-01 (A), DELIV-02a (B), DELIV-03 native (C).
- **Benefits:**
  - A: one model feeds preview and every writer.
  - B: the native PPTX output reduces translation between representations.
  - C: the web form is its own preview, its own validation render and its PDF source.
- **Costs:**
  - A: owned writers and a large capability model.
  - B: a converter on the preview and PDF paths, and PPTX concepts in the form.
  - C: a web → PPTX converter and a large capability model.
- **ACs affected:** AC-21, AC-22, AC-24, AC-26, AC-27.
- **Evidence-sensitive point:** AG-02, which is each candidate's X-3 invalidation condition. For
  B, also AG-01b.

### CH-2 — Geometry chain (X-4 × X-3)

Geometry source → validation placement → render dependency → testing environment → translation
handling.

- **Decisions:**
  - A: OBS-01 computed, before display.
  - B: OBS-03 / VALID-06 from files, at delivery.
  - C: OBS-02 measured, before display.
- **Benefits:**
  - A: no renderer on the admission path.
  - B: no owned layout, and evidence from real files.
  - C: the gate and the preview share one rendering engine. Whether the checked geometry reliably
    equals the displayed geometry is AG-01b.
- **Costs:**
  - A: owned layout, plus agreement testing (NPC-10).
  - B: fit is known only after display.
  - C: a renderer on the admission path (E-50: stop latency, C-03), and a browser needed for tests.
- **ACs affected:** AC-21, AC-22, AC-25, AC-27. At the Gate level, AC-10 (and AC-06 for B).
- **Evidence-sensitive point:**
  - PA-04 decides whether delivery-time geometry is admissible.
  - AG-01a decides A.
  - AG-01b decides C.

### CH-3 — State / authority chain (X-1 × X-2 × authority location)

State shape → coordination → rollback → lifecycle record → session boundary.

- **Decisions:**
  - A: values + compare-and-set in the application process.
  - B: slots + channel in the application process.
  - C: log + conditional appends in the page.
- **Benefits:**
  - A: rollback and export stability by reference, with no copy.
  - B: races resolved by order.
  - C: native lifecycle history, and synchronous session-loss reads.
- **Costs:**
  - A: every kept value is retained in memory.
  - B: copies at admission and export, and a channel stall point.
  - C: page memory holds the log. The session is bounded by the page, and multi-view semantics
    are tied to page placement.
- **ACs affected:** AC-21, AC-23, AC-24, AC-25. At the Gate level, AC-28 and AC-30 for C.
- **Evidence-sensitive point:**
  - SA-P3-01 (C).
  - AG-09 (A, B: freshness of the mirror at interception).
  - P5-TENSION-01, as a reopen trigger for C.

### CH-4 — Runtime-boundary chain (X-5)

Process or runtime placement → crash containment → dependency cost → resource use after a stop →
operational complexity.

- **Decisions:** DEP-01 only (A); DEP-01 + DEP-03 (B); DEP-01 + DEP-02c (C).
- **Benefits:**
  - A: a single process.
  - B: AI and render failures are contained. Their outcome depends on the lifecycle point: an
    operation error before admission, the SA-05 preview case after admission, or an export failure
    during export. Local worker work is terminated on stop.
  - C: host and runtime failures cannot reach page state, and an existing runtime is reused.
- **Costs:**
  - A: an in-process crash ends the session, and there is no termination on stop.
  - B: a protocol and a worker lifecycle.
  - C: confinement work, and C-14 (confinement removes much of the runtime's benefit).
- **ACs affected:** AC-21, AC-22, AC-23, AC-25.
- **Evidence-sensitive point:** AG-P4-01 (C viability) and AG-03 (resource cost for all).

### CH-5 — Provenance chain (X-6)

Origin assignment → source-processing contract → verification cost → reversibility.

- **Decisions:** PROV-05 with SOURCE-02 (A); PROV-06 with SOURCE-02 (B); PROV-06 with source text
  (C).
- **Benefits:**
  - A: "source" can only be assigned by the system, so correctness is structural.
  - B and C: either SA-P3-02 answer can be accommodated.
- **Costs:**
  - A: the ingestion and AI output contracts are shaped by construction, and the assignment is low
    reversibility.
  - B and C: a structured-output contract (E-44), and verification accuracy that must be
    demonstrated.
- **ACs affected:** AC-21, AC-24, AC-25. At the Gate level, AC-03 for all three.
- **Evidence-sensitive point:**
  - SA-P3-02 is Product-sensitive for A.
  - AG-P5-01 decides B and C under "keeps source origin".

## 13. Low-reversibility commitment map

This shows where redesign cost lives. It does not rate overall reversibility.

| Commitment | A | B | C | Why hard to reverse |
|---|---|---|---|---|
| X-1 state shape | Immutable values + references (low) | Mutable slots + candidate areas (low) | Transition log with immutable payloads (low) | Every lifecycle transition, rollback, export capture and session-loss evaluation is written against it |
| X-2 coordination backbone | Guarded transitions (part of the state mechanics; not listed as low) | Serialized channel (low) | Conditional appends (part of the log; not listed as low) | In B, every user action and operation event is a channel command. In A and C, coordination is embedded in the state mechanics above |
| X-3 content representation | Format-neutral model (low) | PPTX-shaped model (low) | Web-rendered form (low) | Geometry source, preview path, export writers or converters, origin carriage and translation all depend on it |
| Authority location | Application process (not listed as low) | Application process (not listed as low) | The page (low) | In C, moving authority changes the session boundary and session-loss evaluation, and adds a synchronization mechanism |
| X-6 provenance | By construction (low) | Verification rules (high) | Verification rules (high) | In A, construction shapes source ingestion and the AI output contract. In B and C, the rules are local |
| X-4 validation placement | OBS-01 → OBS-02 switch (medium) | Delivery-time geometry (restructuring if PA-04 differs) | Render-then-measure (restructuring if AG-01b fails with a PA-04 geometry answer) | Changing placement moves work into or out of the operation lifetime (C-02, C-03) |
| X-5 runtime boundary | None (adding DEP-03 is high) | Worker (medium) | Confined runtime (medium) | Neither B's nor C's boundary holds lifecycle state, so it can be changed without touching state |

## 14. Dependency and failure-boundary map

| Boundary | A | B | C |
|---|---|---|---|
| Lifecycle authority | Application process (single writer) | Application process (channel as single writer) | The page (single writer per page) |
| AI execution | In-process port → AI provider | Worker process → ports → AI provider | Host port → confined external runtime → AI provider |
| Renderer | Browser renders the model for preview; headless render path for AC-18 (admission path only under PA-04) | PPTX → image converter, after admission (preview, rendered view) | Page's browser engine: gate (before admission), preview, PDF |
| Export conversion | Model → PPTX writer; model → PDF writer or print of the render | Model → PPTX serializer; PPTX → PDF converter | Measured payload → native PPTX converter; PDF printed from the render |
| Failure containment | None at process level: an in-process fault ends the session; external errors → operation error | Worker failure: operation error before the success boundary; SA-05 preview failure after admission (pending kept); export failure during export (AC-09); channel stall blocks the session | Host / runtime crash → operation failure; gate render failure → operation failure; page crash → session loss |
| Session-loss boundary | Application-process scope (SESSION-04); page mirror for reload / close | Same as A; the worker workspace belongs to the scope | Page memory (SESSION-04); reload ends the session (current Product text) |
| Resource use after a stop | Outstanding calls complete and are discarded | Local worker work terminated (OP-03); provider-side consumption depends on AG-03 | Runtime invocation terminated if possible (OP-03, AG-03) |

## 15. Evidence-sensitive comparison

These are three kinds of evidence, and they are not merged.

### Gate-blocking evidence (still open in Phase 5)

| Evidence / semantic item | Candidate(s) | Current comparison consequence | If result changes |
|---|---|---|---|
| PA-04 | A, B, C | B's delivery-time geometry (CH-2) is admissible only under B's assumption. A and C place geometry before display under every answer | An answer requiring HM-1 or HM-4 before display restructures B's X-4, and the AC-21, AC-24, AC-25 and AC-27 contrasts on geometry change for B. An answer requiring no geometry check reduces the weight of AG-01a (A) and AG-01b (C) |
| SA-P3-01 | C | C's authority and session boundary are per page (CH-3). A and B accommodate every answer | "Shared session" relocates C's authority (AC-23, AC-24 surface changes). "Not allowed" adds a cross-view mechanism to C |
| SA-P3-02 | A (direct); B, C (through AG-P5-01) | A's provenance-by-construction commitment is low reversibility (CH-5) | "Keeps source origin" moves A's X-6 to Variant M, and the AC-24 contrast on provenance disappears. For B and C it makes AG-P5-01 decisive |
| AG-01a | A | A's geometry is computed (CH-2) | Failure adds a render-then-measure path to A's admission. The AC-21, AC-22, AC-25 and AC-27 contrasts on "no renderer on the admission path" change for A |
| AG-01b | B; C; A (only under a PA-04 rendered check) | B's preview, PDF and rendered view depend on a PPTX render. C's gate depends on an offscreen render | For B: no branch within X-3. For C: X-4 changes only if PA-04 requires geometry. The AC-22 and AC-25 contrasts shift |
| AG-09 | A, B | A and B evaluate session loss through a pushed mirror or a synchronous query. C reads its own log | If synchronous access is impossible and the mirror is not current, A and B carry an AC-30 gap. That affects AC-25 (test burden for staleness) and not the other trade-off dimensions |
| AG-P4-01 | C | C's X-5 is a confined external runtime (CH-4) | Failure invalidates DEP-02c. C must be revised to DEP-01 and then compared again. The AC-21 and AC-22 runtime contrasts change for C, and CH-4 changes |
| AG-P5-01 | B, C | Provenance correctness in B and C rests on verification (CH-5) | Failure under "keeps source origin" leaves B and C without a demonstrated AC-03 mechanism. The Phase 4 branch is Variant C, which needs SOURCE-02 in C |

### Candidate-viability evidence outside a Gate

| Evidence | Candidate(s) | Current comparison consequence | If result changes |
|---|---|---|---|
| AG-02 (R-028; Phase 4 invalidation conditions; not AC-05) | A, B, C | The X-3 conversion boundary is present in all three: model → writers (A); PPTX → converter (B); web → PPTX (C) | A failure invalidates the current content form. A has a narrowing branch; B and C have none within X-3. This affects AC-21 (writer or converter scope), AC-24 (redesign), AC-25 (fidelity verification), AC-26 (per-target fidelity pattern) and AC-27 (translated output) |

### Trade-off-only evidence

| Evidence | Candidate(s) | Current comparison consequence | If result changes |
|---|---|---|---|
| AG-03 (not stop correctness) | A, B, C | After-stop resource use: none terminated (A); local worker work terminated, provider-side consumption open (B); runtime terminated if possible (C) | Changes only the AC-22 and AC-23 cost column |
| AG-05 | A, B, C | Provider-flow declaration | Confidence only |
| AG-06 | A, B, C | Delivery-event observability, if PA-01 picks receipt | Confidence only |
| AG-P6-01 (new) | A, B, C | Team capability relative to each candidate's owned subsystems is unknown | Could make the AC-21 contrast material. It is not a ranking input |
| RG-01 … RG-08 | A, B, C | Reference evidence is absent or thin | Confidence only |

### Reopen trigger (not a current blocker)

- **P5-TENSION-01 / SA-P4-01.** SA-P4-01 is closed for the current baseline, because reload ends
  the session.
  - If Product changes R-045, UC-011 or BR-012 to allow reattachment, C's authority location
    (CH-3) must be relocated.
  - A and B accommodate that change.
  - It is not an open item today.

## 16. Trade-off conflicts / paired consequences

### TC-01 — Owned layout computation (A)

**Decision**

OBS-01 (the product computes geometry from the format-neutral model) with VALID-02 before display.

**Creates**
- AC-25: the gate is testable without renders or a browser.
- AC-22: no renderer sits on the admission path, unless PA-04 requires a rendered check.
- AC-21: DeckAgent owns a layout computation with text metrics.
- AC-25: agreement between computed and real geometry becomes a separate test concern (NPC-10).
- AC-27: translation puts the full weight on that computation's accuracy.

**Why the consequences are coupled**

The renderer-free gate exists only because DeckAgent computes layout itself. The same computation
is the thing whose accuracy (AG-01a) must be tested and maintained.

### TC-02 — Worker process isolation (B)

**Decision**

DEP-03 (AI and render work in a stateless worker), with OP-03 terminating work on stop.

**Creates**
- AC-23: AI and render failures are contained, and the session survives. The terminal outcome
  depends on the lifecycle point:
  - an operation error, with no version, before the C-02 success boundary;
  - the SA-05 preview-failure case after admission;
  - an export failure (AC-09) during export.
- AC-22: local worker work is terminated on stop, which bounds local worker resource consumption.
  Total provider consumption after a stop still depends on AG-03.
- AC-21: a message protocol, a worker lifecycle, and ordering across the process boundary
  (E-39, E-55).
- AC-25: stop, late-result and concurrency tests must hold and release events across processes.
- AC-23: an orphaned-worker failure mode.

**Why the consequences are coupled**

Containment and termination of local work are properties of the process boundary. So are the protocol and the
cross-process ordering discipline.

### TC-03 — Delivery-time geometry (B)

**Decision**

MB-08 D: a content-only admission gate, with geometry read from produced files at delivery
(OBS-03, VALID-06).

**Creates**
- AC-21 and AC-22: no owned layout computation and no renderer on the admission path.
- AC-25 and AC-19 context: every export yields geometry from the real file.
- AC-27: overflow caused by translation is found after the pending version was shown.
- AC-24: exposure to PA-04. Another answer restructures X-4.
- AC-25: geometry tests need real files and a converter.

**Why the consequences are coupled**

Geometry comes from real outputs precisely because it is not computed or rendered before display.
That same choice defers fit knowledge until after display.

### TC-04 — Page-held authority (C)

**Decision**

The lifecycle authority, the log and the session scope live in the page. The host is stateless.

**Creates**
- AC-23: a host or runtime crash cannot corrupt versions.
- AC-21: session-loss state is read directly, with no mirror.
- AC-23: a page crash loses the session.
- AC-24: the authority location is exposed to SA-P3-01 ("shared session") and to a future Product
  change reopening SA-P4-01.
- AC-25: running the Core Flow without the UI still needs a page context.

**Why the consequences are coupled**

Placing the authority where the interception happens is what removes the mirror and protects
state from host failures. It also ties the session lifetime and multi-view semantics to the page.

### TC-05 — Render-then-measure with the page's engine (C)

**Decision**

OBS-02 with OBS-04: the candidate is rendered offscreen and measured before admission, in the
engine that also produces the preview and the PDF.

**Creates**
- AC-25 and AC-27: the gate and the preview use the same rendering engine, including after a
  translation reflow. Whether offscreen measurement reliably represents the displayed render is
  AG-01b.
- AC-22: the render engine is already present in the page.
- AC-22 and AC-23: a renderer on the admission path (E-50), with stop latency. An uninterruptible
  render finishes and is discarded (C-03).
- AC-25: gate tests need a render engine.

**Why the consequences are coupled**

Measuring with the preview's own engine requires rendering inside the operation lifetime, and that
render is itself a dependency on the admission path. How faithful the measurement is to the
displayed render is still open (AG-01b).

### TC-06 — Confined external agent runtime (C)

**Decision**

DEP-02c: an external agent runtime behind host ports, held to a text-only, no-tool, no-write
contract.

**Creates**
- AC-21 and AC-22: generation reuses an existing runtime instead of an owned adapter.
- AC-21 and AC-22: confinement removes much of that runtime's tool-using benefit (C-14).
- AC-22: a runtime change must be re-verified against the contract.
- AC-22 and AC-23: whether the invocation can be terminated on stop is open (AG-03).

**Why the consequences are coupled**

The runtime is valuable for its tool-using loop, while the contract that makes it safe (AC-02,
AC-11) removes that loop. Its benefit and its confinement cost come from the same component.

### TC-07 — Provenance by construction (A)

**Decision**

PROV-05 with SOURCE-02: "source" origin exists only on elements the system placed from
pre-extracted source items.

**Creates**
- AC-25: origin correctness is structural, so no verification prototype is needed.
- AC-21: source-item extraction, and an AI contract that references items.
- AC-24: low reversibility. It shapes ingestion and the AI output contract, and the other
  SA-P3-02 answer restructures X-6.

**Why the consequences are coupled**

The guarantee comes from fixing, in the ingestion and AI contracts, who may assign "source". That
fixing is what makes the decision costly to reverse.

### TC-08 — Model-declared, verified provenance (B, C)

**Decision**

PROV-06: the model declares origin, and the system verifies declared spans against source.

**Creates**
- AC-24: either SA-P3-02 answer is accommodated, and the verification rules are high
  reversibility.
- AC-21: a structured-output contract (E-44).
- AC-25: verification accuracy must be demonstrated (AG-P5-01), and under "keeps source origin"
  paraphrase judgement is needed.

**Why the consequences are coupled**

Flexibility across Product answers comes from judging origin after generation. That judgement is
exactly the part whose accuracy is empirical.

### TC-09 — Content-form choice (X-3) sets extensibility against conversion burden (A, B, C)

**Decision**

DELIV-01 (A), DELIV-02a (B) or DELIV-03 native (C).

**Creates**
- AC-26:
  - A: every target is a writer over one model.
  - B: PPTX-derived targets are close to the form.
  - C: web and image targets are close to the form.
- AC-21 and AC-22:
  - A owns writers for every target, including PPTX.
  - B needs a converter for preview and PDF.
  - C needs a web → PPTX converter.
- AC-26: the size of the capability model (NPC-12) is large for A and C, and small for B, where
  PPTX concepts carry into other targets.

**Why the consequences are coupled**

A format native to the content form needs no conversion step. Every other format,
costs a writer or a converter. In A that is every format, since no format is native to the model; in C it is PPTX.

### TC-10 — Single process (A)

**Decision**

DEP-01 only. The authority, adapters and layout code share one process.

**Creates**
- AC-21 and AC-25: no protocol and no second process, and the lifecycle and gate can be tested in
  one process.
- AC-23: any in-process fault ends the session.
- AC-22: nothing terminates outstanding calls on stop.

**Why the consequences are coupled**

The absence of a boundary is both what removes the protocol cost and what removes containment and
termination.

## 17. Decision surfaces for Phase 7

These are questions only. No answer or preferred direction is implied.

**DS-01 — Where should layout and geometry knowledge live?**
- The options are:
  - owned code that computes layout (A);
  - produced files read through a converter at delivery (B);
  - the browser engine, measured before admission (C).
- Separates: OBS-01 / OBS-03 / OBS-02; X-3 × X-4.
- AC consequences: AC-21, AC-22, AC-25, AC-27.
- Related open items: PA-04, AG-01a, AG-01b, AG-02.
- Answerable now? No. It needs PA-04 and the spikes.

**DS-02 — Which content representation should carry the deck, given the expected output
evolution?**
- The options are a neutral model, a PPTX-shaped model, or a web form. C-003 expects further formats
  but names none.
- Separates: DELIV-01 / DELIV-02a / DELIV-03.
- AC consequences: AC-24, AC-26, AC-27, AC-21.
- Related open items: AG-02 (a viability invalidation for every current X-3 choice). The expected
  target formats are not defined in the sources.
- Answerable now? No. It needs AG-02, and it is sensitive to any statement of intended targets.

**DS-03 — For a session-only application, which failure boundary is acceptable for the part that
holds session state?**
- The options are:
  - an in-process fault ends the session (A);
  - a worker contains AI and render faults, but a channel stall blocks the session (B);
  - a page crash ends the session, while host and runtime faults cannot touch state (C).
- Separates: X-5 plus authority location.
- AC consequences: AC-23, AC-22, AC-21.
- Related open items: none decisive. The boundaries are structural.
- Answerable now? Structurally yes. The judgement itself belongs to Phase 7.

**DS-04 — Is process or runtime machinery justified by what it buys?**
- The machinery in question:
  - B's worker buys containment and termination of local work on stop;
  - C's confined runtime buys reuse of an existing runtime, partly offset by C-14.
- Separates: DEP-03 / DEP-02c / DEP-01 only.
- AC consequences: AC-21, AC-22, AC-23, AC-25.
- Related open items: AG-P4-01 (C viability), AG-03 (resource cost), AG-P6-01.
- Answerable now? Partly. C's side needs AG-P4-01.

**DS-05 — Should lifecycle authority be coupled to the page?**
- Separates: page-held authority (C) from authority in the application process (A, B).
- AC consequences: AC-23, AC-24, AC-25. At the Gate level, AC-28 and AC-30 (C).
- Related open items: SA-P3-01. P5-TENSION-01 as a reopen trigger only.
- Answerable now? No. It needs SA-P3-01.

**DS-06 — Which provenance semantics must Product settle before choosing an origin-assignment
mechanism?**
- The options are construction or verification.
- Separates: PROV-05 (A) / PROV-06 (B, C).
- AC consequences: AC-24, AC-25, AC-21. At the Gate level, AC-03.
- Related open items: SA-P3-02, AG-P5-01.
- Answerable now? No. It needs SA-P3-02, and AG-P5-01 under one answer.

**DS-07 — May P3 geometry checks happen after a result has been displayed?**
- Separates: MB-08 D (B) from MB-08 P (A, C).
- AC consequences: AC-27, AC-25, AC-24. At the Gate level, AC-06 and AC-10.
- Related open items: PA-04 (R-033; DOC-008 F15).
- Answerable now? No. It is a Product answer.

**DS-08 — What test environment is acceptable for lifecycle and gate verification?**
- The options are one process (A), a worker plus a converter for geometry (B), or a page context
  for everything (C).
- Separates: X-5, X-4 and the authority location.
- AC consequences: AC-25.
- Related open items: none decisive.
- Answerable now? Structurally yes.

**DS-09 — Where is the team able to own complexity?**
- The candidates place it in:
  - layout plus writers (A);
  - a channel, a protocol and converter integration (B);
  - log derivation, a web → PPTX converter and runtime confinement (C).
- Separates: the owned-subsystem profile of each candidate (§5).
- AC consequences: AC-21 (C-002).
- Related open items: AG-P6-01, P6-TENSION-01.
- Answerable now? No. It needs team-capability evidence.

## 18. Comparison stability

This classifies each comparison statement. It does not rate candidate quality.

| # | Comparison claim | Class | What could change it |
|---|---|---|---|
| S-01 | B has a worker process boundary; A and C do not (C has an external runtime process behind the host) | Stable | — |
| S-02 | The lifecycle authority is in the page in C, and in the application process in A and B | Stable | Reopens only if SA-P3-01 = "shared session" (C revision), or Product reopens SA-P4-01 |
| S-03 | State shape: values (A), slots (B), log (C), each low reversibility | Stable | — |
| S-04 | Layout knowledge is owned (A), converter / file-derived (B), or browser-derived (C) | Stable as structure | AG-01a (A) or AG-01b (C) failures would add or remove a path (see E-01, E-02) |
| S-05 | C records lifecycle history as log events; A and B hold current state plus operation records | Stable | — |
| S-06 | Version corruption by failure mid-operation is excluded in all three; session loss comes from a crash of the application process (A, B) or the page (C) | Stable | — |
| S-07 | New targets attach to a neutral model (A), PPTX (B), or the web form (C) | Stable | — |
| S-08 | Resource use after a stop differs: none terminated (A); local worker work terminated, with provider-side consumption dependent on AG-03 (B); runtime terminated if possible (C) | Stable as structure | AG-03 changes the size of the cost, not the structure |
| E-01 | A's gate needs no renderer on the admission path | Evidence-sensitive | AG-01a (and AG-01b if PA-04 requires a rendered check) |
| E-02 | C's gate measures the displayed render reliably | Evidence-sensitive | AG-01b |
| E-03 | B's preview, PDF and rendered view are available through the PPTX converter | Evidence-sensitive | AG-01b, AG-02 |
| E-04 | Each candidate's current content form reaches native PPTX and PDF without invalidating R-028 | Evidence-sensitive | AG-02 (all) |
| E-05 | C's generation dependency is a confined external runtime | Evidence-sensitive | AG-P4-01 |
| E-06 | B's and C's verified provenance keeps non-source content from passing as source | Evidence-sensitive | AG-P5-01 (under the SA-P3-02 answer "keeps source origin") |
| E-07 | A's and B's session-loss evaluation reaches the reload / close interception point in time | Evidence-sensitive | AG-09 |
| E-08 | The AC-21 feasibility contrast relative to team capacity | Evidence-sensitive | AG-P6-01 |
| P-01 | B's geometry is known only at delivery, and this is admissible | Product-sensitive | PA-04 |
| P-02 | A's provenance is a low-reversibility construction commitment | Product-sensitive | SA-P3-02 |
| P-03 | C's session boundary is the page, and each page is a separate session | Product-sensitive | SA-P3-01 |
| P-04 | Whether AG-01a and AG-01b bear on the gate at all for A and C | Product-sensitive | PA-04 (an answer that selects no geometry check) |

## 19. Phase 6 handoff

### Structural differences that matter most

- **State shape:**
  - A: values with guarded references.
  - B: slots with a serialized channel.
  - C: a log with conditional appends.
- **Content form:** a neutral model (A), a PPTX-shaped model (B), or a web form (C). Each has its
  own conversion boundary, and AG-02 tests each one.
- **Geometry:**
  - A: computed before display.
  - B: read from files at delivery.
  - C: measured from the render before display.
- **Runtime boundary:** a single process (A), a stateless worker (B), or a confined external
  runtime (C).
- **Authority location:** the application process (A, B) or the page (C).
- **Provenance:** by construction (A), or model-declared and verified (B, C).

### Stable trade-off consequences

S-01 … S-08 (§18). In particular:

- **Crash impact:**
  - A: an in-process fault ends the session.
  - B: AI and render faults are contained, with a terminal outcome that depends on the lifecycle
    point (operation error, SA-05 preview case, or export failure). The channel is a session-wide
    stall point.
  - C: a page crash ends the session, while host and runtime faults cannot touch state.
- **Low-reversibility locations** (§13): X-1 in all three; X-3 in all three; the channel in B; the
  page authority in C; the provenance construction in A.
- **New output targets** attach to a neutral model (A), PPTX (B), or the web form (C).

### Evidence-sensitive trade-off consequences

E-01 … E-08 (§18), which depend on AG-01a, AG-01b, AG-02, AG-P4-01, AG-P5-01, AG-09 and AG-P6-01.

### Product-sensitive trade-off consequences

P-01 … P-04 (§18), which depend on PA-04, SA-P3-02 and SA-P3-01. P5-TENSION-01 is a reopen trigger
for C only, not an open item.

### Evidence still required before W-035

- **Gate / Observability blockers (Phase 5):**
  - Product answers: PA-04, SA-P3-02, SA-P3-01.
  - Spikes:
    - AG-01a (A);
    - AG-01b (B; C; A only under a PA-04 rendered check);
    - AG-09 (A, B);
    - AG-P4-01 (C);
    - AG-P5-01 (B, C, under SA-P3-02 "keeps source origin").
- **Candidate-viability evidence outside a Gate:** AG-02 for A, B and C (R-028; the Phase 4
  invalidation conditions). It does not relate to AC-05.
- **Trade-off-only evidence:** AG-03, AG-05, AG-06 (conditional), AG-P6-01, RG-01 … RG-08.

### Phase-6-local issues

- **P6-TENSION-01 — Owned or external output conversion (A, C).**
  - 05 §7 lists "PPTX and PDF writers" (A) and a "web → PPTX converter" (C) under *Major external
    dependencies*.
  - The candidate sections present the same components as DeckAgent-built:
    - 05 §4 flow 9 says "DeckAgent PPTX writer";
    - 05 §4 AC-21 says "DeckAgent owns … three output paths";
    - 05 §6 AC-21 lists "a web-to-PPTX converter" among things to build.
  - The frozen artifacts do not fix which it is, and DOC-004 AC-22 does not require choosing a
    library.
  - *Effect here:* the contrasts in §5, §6 and TC-09 hold either way, but the cost lands on AC-21
    if the component is owned and on AC-22 if it is a library.
  - No artifact is modified.
- **AG-P6-01 — Team capability relative to owned subsystems.**
  - *Question:* what are the team's experience and capacity for each candidate's owned subsystems?
    These are:
    - A: layout computation and writers;
    - B: channel, worker protocol and converter integration;
    - C: log derivation, web → PPTX conversion and runtime confinement.
  - *Why it is missing:* C-002 states that capacity is limited, and DOC-004 AC-21 asks for
    feasibility "relative to team capacity". No source records team skills.
  - *Effect:* trade-off evidence only (AC-21). It blocks no Gate, and it is not a ranking input by
    itself.
- No SA-P6 item was needed. No new candidate, ADB option or mechanism was introduced.

### Trade-off comparison complete?

**Yes.** Each candidate is compared on AC-21 … AC-27, with its decisions, benefits, costs,
exposure and evidence sensitivity. Cross-cutting chains (§12), trade-off conflicts (§16) and
decision surfaces (§17) are recorded. The comparisons marked evidence-sensitive or
Product-sensitive (§18) will need to be re-checked when those items resolve.

### Ready for W-035 baseline selection?

**No. Evidence resolution is still required before a baseline recommendation.**

Under Phase 5 (DOC-004 §5), every candidate has Gate outcomes still `Not yet assessable`, and B
also has Observability outcomes open. The factual blockers are the Product answers PA-04, SA-P3-02
and SA-P3-01, and the spikes AG-01a, AG-01b, AG-09, AG-P4-01 and AG-P5-01, each for the candidates
listed above. Separately, AG-02 is required before W-035 as candidate-viability evidence for all
three. No candidate is selected or recommended here.
