# Phase 5 — Formal Architecture Criteria Assessment

- Inputs (frozen): `01-context.md`, `02-problem-map.md`, `03-decision-bank.md`,
  `04-decision-graph.md`, `05-candidates.md`.
- Authoritative sources: the Project Hub snapshot (Product truth) and DOC-004
  `docs/architecture/architecture-acceptance-criteria.md` (AC wording and kinds).
- Supporting source: DOC-008 `docs/testing/testing-approach.md` (§5.3 and the F-items only).
  Reference research was not needed: no outcome below rests on a reference-system claim.
- Built: 2026-09-30. No source or frozen artifact
  was modified, and Project Hub was not updated.

## 1. Phase boundary and assessment rules

- **Phases 0–4 are frozen.** Candidates A, B and C are assessed exactly as `05-candidates.md`
  defines them. Nothing is repaired, and no fallback branch is used to change an outcome.
- **Out of scope:**
  - selecting, ranking or scoring a candidate;
  - the W-035 trade-off comparison;
  - resolving any PA or SA item.
- **Outcomes for Gates and Observability needs** (DOC-004 §4–§5):

  | Outcome | Used when |
  |---|---|
  | `Meets` | A structural mechanism in the frozen candidate satisfies the criterion, every dependency is present, and no open Product answer or empirical fact could change the conclusion |
  | `Does not meet` | The candidate contradicts the criterion or lacks a required structural capability, or its assumption is contradicted by Product truth. A `Required revision` is recorded; nothing is repaired |
  | `Not yet assessable` | The candidate could satisfy the criterion, but the result depends on a named open item (PA, SA, AG, or a Phase-4/5-local item). An evidence gap, not a pass (DOC-004 §5) |

- **Trade-off dimensions (AC-21 … AC-27):** each candidate gets its own profile (§8). They have no
  outcome and no comparison.
- **Source precedence:**
  1. Project Hub.
  2. DOC-004.
  3. The frozen synthesis.
  4. DOC-008.
  5. Reference research.

  Conflicts are recorded as `P5-TENSION-*` (§11), and the higher source is applied.
- **Assessment rules applied throughout:**
  - **An assumption is not evidence.** Where a candidate assumes a Product answer and another
    still-valid answer would change the outcome, the result is `Not yet assessable`.
  - **Accommodated ambiguity is non-blocking.** An open Product point does not block a criterion
    when the candidate satisfies it under every answer with the same structure.
  - **Viability evidence versus trade-off evidence.** A gap blocks an outcome only if a negative
    result would make the candidate's mechanism for that criterion fail.
    - Latency, cost and resource use are not Gate properties in DOC-004: there are no timeout
      values, C-007 is retired, and AC-28 does not require cancelling the external call. Gaps
      that bear only on those are trade-off or confidence evidence.
    - Reliability counts as viability where a result the candidate relies on for correctness could
      be wrong. It does not count where a failure only becomes a determinate operation error.
  - **Reference gaps (RG-\*)** block nothing when DeckAgent evidence can replace them. Where a
    frozen artifact used an RG as a stand-in for missing DeckAgent evidence, a Phase-5-local AG
    names that evidence (§11, P5-TENSION-02).
  - **Missing code alone never yields `Not yet assessable`.**
- **Snapshot re-check (AG-07).** The Product rows these outcomes rely on were re-read in the
  snapshot: R-021, R-028, R-033, R-045, BR-012, D-027 and UC-011. They agree with DOC-004. One
  tension with the frozen Phase 4 was found (P5-TENSION-01).

## 2. Phase-5 prerequisite check

### GC-P4-01 disposition

**Accepted as Phase-5 assessment premise.**

- **Phase 2 meaning (frozen).** ADB-DELIV-04 already allows value semantics other than STATE-03.
  - Its *Assumptions* line reads "ADB-STATE-03 **or an equivalent value semantics**".
  - Its prerequisite is "Immutable versions".
  - It is not viable only "with mutable version slots".

  The `requires ADB-STATE-03` relationship names the one value-state option in the bank. It does
  not add a requirement beyond immutable versions.
- **Phase 3 reasoning (frozen).** Two passages already treat immutable log payloads as satisfying
  what E-22 labels "Value semantics":
  - Axis A: "A log (STATE-04) behaves like values for export if its payloads are immutable."
  - MB-04 requires "immutable payloads (or DELIV-05)".
- **DELIV-04's risk is covered.** Its listed risk is a version value being freed while an export
  still references it. Candidate C keeps every payload in the page log for the whole session, and
  the log is discarded only with the session (SESSION-04).
- **Effect on the assessment:**
  - Candidate C is assessed with STATE-04 immutable payloads and DELIV-04, throughout.
  - The DELIV-05 fallback is not used for any criterion.
  - Phase 3 is not modified. E-22 remains as frozen, and this acceptance is local to Phase 5.

### Phase-4-local items carried

- **SA-P4-01** (does a reloaded view reattach to the same session while the application runs?)
  - **Disposition: superseded by current Product truth. It is closed for the current baseline.**
  - Project Hub already names reload as an action that loses the deck, and DOC-004 agrees:
    - R-045's rationale says "starting a new deck, reloading the page or closing the application
      all lose the deck".
    - R-045 AC1 and the UC-011 trigger list reload among the session-ending actions.
    - DOC-004 AC-30 does the same ("session-ending action (starting a new deck, reloading, or
      closing the application; R-045 AC1)").
  - The authoritative sources do not conflict with each other. The only conflict is with the
    frozen Phase 4 framing, recorded as P5-TENSION-01 (§11) and resolved by source precedence.
  - Consequence: "a reload ends the session" is the current baseline, not a candidate assumption.
    Candidate C conforms to it, and SA-P4-01 blocks no outcome and needs no Product decision
    before W-035.
  - **Reopen condition:** a Product change to R-045, UC-011 or BR-012 that lets a reloaded view
    keep the running session. SA-P4-01 would then reopen, and C's AC-01 and AC-30 would be
    re-assessed. Reattachment restructures C (05 §6).
- **AG-P4-01** (can the runtime selected for DEP-02c be held to the confinement contract?)
  - It covers confinement only. Physical termination on stop belongs to AG-03 and OP-03 (§9).
  - It stays unresolved. Candidate C is assessed with DEP-01 + DEP-02c. The DEP-01-only fallback
    is not used.
  - Not every contract item is a property of the runtime. Some are already guaranteed by C's
    frozen structure: the authority is in the page's memory, and the host holds no lifecycle
    state (05 §6, *Authority and state ownership*). Mapping each item to the criteria it
    protects in C:

    | Contract item | What guarantees it in C | Criteria whose outcome depends on AG-P4-01 |
    |---|---|---|
    | 1. Text or data output only | The runtime | AC-02 |
    | 2. No tool or action authority | The runtime | AC-02 ("trigger actions outside policy") |
    | 3. No workspace or file writes | The runtime | AC-11 |
    | 4. No direct access to lifecycle state | **C's structure.** The lifecycle state is page memory, and the host holds none. The runtime could reach it only by acting on the browser, which is item 2 | None beyond item 2 |
    | 5. Results return only through admission | **C's structure.** The page receives runtime output only as the return value of a port call it made itself, and admission is a conditional append in the page | None beyond item 2 |
    | 6. Declared content flow stays inspectable | The runtime | AC-11 |

    AC-06, AC-08, AC-28 and AC-29 therefore do not depend on AG-P4-01 in Candidate C (§4).

### Candidate assessment configurations

Each configuration is fixed before assessment and is not changed afterwards.

| Candidate | Configuration (as frozen in `05-candidates.md`) | Open items that can move an outcome |
|---|---|---|
| **A** | STATE-03 · STATE-05 · OP-01 + OP-04 + OP-06 · REQ-01 · INTENT-01 · DELIV-01 · DELIV-04 · VALID-02 + VALID-05 + VALID-07 · OBS-01 + OBS-04 · PROV-01 + PROV-05 · SOURCE-01/02/03 · EXPORT-01 + EXPORT-05 · SESSION-01 + SESSION-02 · SESSION-04 · ROLE-01 · DATA-01 + DATA-02 · DEP-01 | SA-P3-02; PA-04 with AG-01a (and AG-01b if PA-04 selects a rendered check); AG-09 |
| **B** | STATE-02 · STATE-05 · OP-02 + OP-03 + OP-05 + OP-07 · REQ-01 · INTENT-01 · DELIV-02a · DELIV-05 · VALID-01 + VALID-03 + VALID-05 + VALID-06 + VALID-07 · OBS-03 + OBS-05 · PROV-01 + PROV-06 · SOURCE-01/02/03 · EXPORT-01 + EXPORT-05 · SESSION-01 + SESSION-02 · SESSION-04 · ROLE-01 · DATA-01 + DATA-02 · DEP-01 + DEP-03. **Assumes PA-04:** no HM-1 or HM-4 check before display | PA-04; AG-01b; AG-09; AG-P5-01 (with SA-P3-02) |
| **C** | STATE-04 (immutable payloads) · STATE-05 · OP-01 + OP-03 + OP-04 + OP-06 · REQ-02 · INTENT-02 · DELIV-03 native · **DELIV-04 (GC-P4-01 accepted)** · VALID-02 + VALID-05 + VALID-06 + VALID-07 + VALID-08 · OBS-02 + OBS-04 · PROV-01 + PROV-06 · SOURCE-01/03 · EXPORT-01 + EXPORT-05 · SESSION-01 · SESSION-04 · ROLE-01 · DATA-01 + DATA-02 · DEP-01 + DEP-02c. Authority in the page; the host is stateless. **Assumes:** each page is a separate session (SA-P3-01). Its reload behaviour (a reload ends the session) matches current Product text; SA-P4-01 is superseded (§2) | SA-P3-01; PA-04 with AG-01b; AG-P4-01; AG-P5-01 (with SA-P3-02) |

## 3. Architecture Criteria index

Wording and kinds follow DOC-004 §6–§9. "Evidence needed" names what kind of evidence can decide the
criterion:

- **S** — architecture structure;
- **P** — a Product semantic answer;
- **Sp** — a spike or prototype;
- **O** — observable state;
- **F** — real output fidelity;
- **R** — external-runtime capability.

| AC | Kind | Requirement being assessed (DOC-004) | Evidence needed |
|---|---|---|---|
| AC-01 | Gate | The full V1 Core Flow runs end to end, locally, with session-only state: prompt (optionally one D-024 source) → draft → preview → repeated deck-level refinement with keep / reject of a pending version → PPTX + PDF export of the previewed version | S; R where a Core Flow step depends on an external capability |
| AC-02 | Gate | Source content is data: distinguishable from instructions; cannot alter system instructions or trigger actions outside policy | S; R where an external runtime could hold action authority |
| AC-03 | Gate | Generation and refinement keep source-derived content distinct from other content; AI-added or user-stated content is never presented as source-derived | S; P (SA-P3-02); Sp where the distinction relies on verifying model claims |
| AC-04 | Gate | Active constraints still in effect stay available to later refinements, independent of what the deck visibly shows | S |
| AC-05 | Gate | Every export is built from exactly the previewed version; preview, PPTX and PDF all derive from it; export neither regenerates nor diverges | S (derivation path, stability of the captured version, no model call or regeneration). Conversion fidelity is R-025 / R-028 verification and AC-19, not AC-05 (§4) |
| AC-06 | Gate | No AI result is displayed, becomes pending, or becomes accepted until validated; an invalid result creates no version and leaves the recovery baseline | S; P (which checks validation must include, PA-04) |
| AC-07 | Gate | One-step reject of the pending version restores the accepted version and cancels the request's constraints | S |
| AC-08 | Gate | A failed generation or refinement (including external failure or timeout) ends determinately, with no hang, no half-applied change, and no version; state returns to the recovery baseline | S |
| AC-09 | Gate | A cancelled or failed export, or one that produced an invalid file, delivers no invalid file and changes no version; export can be retried without regeneration | S |
| AC-10 | Gate | Validation is possible at every transition that can make a result displayed, pending or accepted, and on every output before delivery; whether it ran, on which result, and its verdict are observable | S; P (PA-04 selects checks); Sp where the information a selected check needs is empirical (geometry accuracy, render feasibility) |
| AC-11 | Gate | User content goes only to designed sinks; flows to external providers are explicit and identifiable | S; R where an external runtime could add sinks or hide flows |
| AC-12 | Gate | The Core Flow needs no professional-editor capability; deep editing is handed off through PPTX | S |
| AC-13 | Gate | File extension does not permanently fix an input's role | S |
| AC-14 | Observability | Geometry and text metrics observable for preview, PPTX and PDF, enough to detect unreadable or clipped text and severe layout failure | O per output (computed geometry, rendered measurement and real-file evidence are distinguished; see §5) |
| AC-15 | Observability | Slide order and text readable from every output and from each version | O |
| AC-16 | Observability | Content origin (source, user-stated, AI-added) observable in any version | O |
| AC-17 | Observability | Accepted and pending versions, successful export outcomes by version and format, and the states before and after the last refinement (including after reject, stop and failure) are observable | O |
| AC-18 | Observability | The whole deck can be viewed as rendered, without manual interaction | O; R (a rendering path usable outside interactive preview) |
| AC-19 | Observability | Degradation between a version and each real output is detectable and recordable | O; F (real artifacts) |
| AC-20 | Observability | Operation status, terminal state (done, stopped, error) and failure cause are reportable | O |
| AC-21 | Trade-off | Team feasibility and learning curve | Profile (§8) |
| AC-22 | Trade-off | External dependency cost | Profile (§8) |
| AC-23 | Trade-off | Blast radius | Profile (§8) |
| AC-24 | Trade-off | Rollback and redesign cost | Profile (§8) |
| AC-25 | Trade-off | Testability cost | Profile (§8) |
| AC-26 | Trade-off | Output-target extensibility | Profile (§8) |
| AC-27 | Trade-off | Translation readiness | Profile (§8) |
| AC-28 | Gate | The user can stop generation or refinement at any time. A stopped operation ends determinately and creates no version, even from a late result. The baseline is restored, and a commit-boundary promotion stands. At most one operation runs at a time. A coinciding stop and completion resolve to exactly one of them | S; P where "one at a time" depends on the session boundary across views (SA-P3-01) |
| AC-29 | Gate | Exactly one accepted and at most one pending version. Transitions happen only at BR-010 events. Commit-boundary promotion happens atomically before the AI operation. Export promotion happens only after the file is produced and validated, at an identifiable commit point that can follow Product's "delivered" | S; P (PA-01, accommodated) |
| AC-30 | Gate | Session-loss state (whether a deck exists, which versions exist, and successful export outcomes by version and format) is held and available wherever a session-ending action can be intercepted; "undownloaded" can be applied without restructuring | S; Sp (AG-09) where availability depends on synchronous interception; P (PA-02, accommodated) |

## 4. Gate assessment

**Citation form.** `05 §4 flow 6` is Candidate A's flow step 6 in `05-candidates.md`; `§5` is B and
`§6` is C. `F-xx` is a foundation row there (05 §2.1). `C-xx` and `E-xx` are Phase 3 items in
`04-decision-graph.md`. Reasoning not taken from a document is DeckAgent reasoning, labelled as
such.

### AC-01 — V1 Core Flow completeness

**Candidate A**
- Outcome: `Meets`
- Mechanism: 05 §4 flow steps 1–11. Source admission, generation, validation, admission to
  pending, and preview (the page renders the value). Repeated refinement, with commit, keep and
  reject. PPTX writer and PDF writer, both over the model. One local process with one discardable
  session scope (SESSION-04).
- Reasoning: Every Core Flow step has an owner and a path.
  - The preview is the browser's render of the model.
  - Both output paths are DeckAgent-owned writers.
  - No step depends on an unresolved external capability.
  - How faithful the outputs are is AG-02 evidence for R-028, not an AC-01 or AC-05 question
    (§4 AC-05). SA-P3-02 changes labelling (AC-03), not whether a refinement can run.
- Evidence: 05 §4 end-to-end flow; *Representation and artifact path*; *Delivery and session
  model*.
- Open condition: —
- Required revision: —

**Candidate B**
- Outcome: `Not yet assessable`
- Mechanism: 05 §5 flow steps 1–11. The preview is produced after admission: the model is written
  to PPTX in the worker, then rendered to images by a converter (OBS-05). The PDF also goes
  PPTX → converter → PDF.
- Reasoning: Two Core Flow steps, preview and PDF export, exist only through a local headless
  render of PPTX.
  - Phase 3 conditions this content form on that capability (E-52: DELIV-02a conditioned_by
    AG-01b, AG-02).
  - Phase 4 lists "the PPTX → preview / PDF path" failing as B's invalidation condition.
  - A negative result would leave B without a preview step. That is a structural gap in AC-01,
    not a latency cost.
- Evidence: 05 §5 flow 5 and 9, *Evidence gaps* (AG-01b), *Reopen conditions*; 04 E-52.
- Open condition: **AG-01b**, for B: can a local headless render of the produced PPTX supply
  preview images and PDF reliably? Would meet if AG-01b confirms it.
- Required revision: —

**Candidate C**
- Outcome: `Meets`
- Mechanism: 05 §6 flow steps 1–11.
  - The preview is the page's own render of the payload.
  - The PDF is a print of the same render. The PPTX is a native conversion.
  - The host provides stateless parsing and runtime ports.
  - Session-only state is the page's log (SESSION-04).
- Reasoning: Every step has an owner in the page or behind a host port.
  - The session boundary (a page reload ends the session) is current Product text (R-045,
    UC-011; SA-P4-01 superseded, §2).
  - Conversion fidelity is AG-02 (R-028). Runtime confinement is AC-02 and AC-11.
- Evidence: 05 §6 end-to-end flow; Project Hub R-045, UC-011, BR-012, D-027.
- Open condition: — (reopen trigger: the SA-P4-01 reopen condition in §2).
- Required revision: —

### AC-02 — Source content handled as data

**Candidate A**
- Outcome: `Meets`
- Mechanism: SOURCE-01 (labelled source in model inputs), SOURCE-02 (pre-extracted items),
  SOURCE-03 (AI output is data). DEP-01 ports; no tool or action authority for AI (F-03, F-04).
- Reasoning: Source enters only as labelled data items, and AI output returns only as a candidate
  value checked by admission. No path gives source text action authority. Whether a model
  resists injected text in its output content is verified under R-043 (testing). It is not a
  structural gap.
- Evidence: 05 §4 flow 1–2, *Source trust*; 03 AP coverage note on AP-SOURCE-01.
- Open condition: —
- Required revision: —

**Candidate B**
- Outcome: `Meets`
- Mechanism: SOURCE-01/02/03. The worker (DEP-03) holds no state and returns result events
  through the ordered channel (E-39).
- Reasoning: Same data-only path as A. The worker boundary is DeckAgent-owned and has no action
  authority.
- Evidence: 05 §5 flow 2, *Source trust*, MB-10 local adaptation.
- Open condition: —
- Required revision: —

**Candidate C**
- Outcome: `Not yet assessable`
- Mechanism: SOURCE-01, SOURCE-03; confined external agent runtime (DEP-02c).
- Reasoning: Source text is processed inside an external runtime. Whether source text can trigger
  actions depends on the runtime having no tool or action authority and returning only text or
  data: AG-P4-01 items 1–2. That is a property of the selected runtime, which C's structure does
  not supply (§2).
- Evidence: 05 §6 *Source trust*, AP-SOURCE-01 row; 04 §7 (DEP-02 observed variant excluded on
  AC-02).
- Open condition: **AG-P4-01** (items 1, 2). Would meet if the runtime satisfies the contract. If
  it cannot, the frozen DEP-02c choice is invalid, and C must first be revised to DEP-01 only and
  re-assessed.
- Required revision: —

### AC-03 — Source-derived vs other content kept distinct

**Candidate A**
- Outcome: `Not yet assessable`
- Mechanism: PROV-05 by construction. Only elements the system placed from SOURCE-02 items carry
  "source". Labels live in the value (PROV-01).
- Reasoning: The labelling rule is fixed by the candidate's own SA-P3-02 assumption: rephrased
  source content is relabelled (or not rephrased).
  - Under that answer, construction guarantees that nothing unplaced is labelled "source". AC-03
    would be met.
  - Under the other still-valid answer (rephrased content keeps source origin), construction
    cannot express it. Source-derived content from a tone or audience refinement (D-025) would be
    presented as AI-added, so the distinction would not be preserved.
  - Phase 4 records this answer as restructuring X-6 (C-11, E-41).
- Evidence: 05 §4 *Source trust*, *Product ambiguities* (SA-P3-02); 04 C-11, E-41.
- Open condition: **SA-P3-02**. Would meet under Candidate A's SA-P3-02 assumption. The other
  answer moves X-6 to Variant M (restructuring).
- Required revision: —

**Candidate B**
- Outcome: `Not yet assessable`
- Mechanism: PROV-06, model-declared and verified. Declared source spans are checked against
  SOURCE-02 items, and unverifiable "source" claims are downgraded. Labels are owned model fields
  (PROV-01).
- Reasoning: The guarantee rests on verification rejecting every non-source claim.
  - Under the SA-P3-02 answer "rephrased content is relabelled", verification can be strict
    (textual). AI-added text then cannot pass as source unless it reproduces source text.
  - Under the answer "rephrased content keeps source origin", verification must judge
    paraphrase. Whether it can do so without admitting AI-added content as source is empirical.
  - Phase 3/4 recorded this need under RG-04. Phase 5 names the DeckAgent evidence as AG-P5-01
    (P5-TENSION-02).
- Evidence: 05 §5 *Source trust*, *Evidence gaps* (RG-04 row); 04 Axis E.
- Open condition: **AG-P5-01**, decisive under the SA-P3-02 answer "keeps source origin". Would
  meet under the "relabel" answer without further evidence.
- Required revision: —

**Candidate C**
- Outcome: `Not yet assessable`
- Mechanism: PROV-06 verified by the page against extracted source text; origin as element
  attributes (PROV-01). SOURCE-02 is not selected.
- Reasoning: Same dependency as B. Verification runs against source text instead of source items.
- Evidence: 05 §6 *Source trust*, DF-SOURCE-01 row.
- Open condition: **AG-P5-01** with **SA-P3-02**, as for B.
- Required revision: —

### AC-04 — Active constraints remain available

**Candidate A**
- Outcome: `Meets`
- Mechanism: INTENT-01. The constraint set is carried in each version value, and the request's
  constraints join at the commit boundary (the fused commit, F-08).
- Reasoning: Constraints are held with the version, not re-inferred from deck content, so a later
  refinement reads them even when the deck no longer visibly reflects them. Lifetime semantics
  (PA-06, A-013) are explicitly not required by AC-04. A's per-version sets can hold any
  lifetime rule.
- Evidence: 05 §4 *Authority and state ownership*, flow 6.
- Open condition: —
- Required revision: —

**Candidate B**
- Outcome: `Meets`
- Mechanism: INTENT-01 in each slot, copied with the candidate at admission.
- Reasoning: As A.
- Evidence: 05 §5 *Authority and state ownership*.
- Open condition: —
- Required revision: —

**Candidate C**
- Outcome: `Meets`
- Mechanism: INTENT-02, an attributed constraint ledger kept as log events. Versions reference a
  ledger position (E-07).
- Reasoning: The ledger is independent of the deck payload and survives any content change.
- Evidence: 05 §6 *Authority and state ownership*.
- Open condition: —
- Required revision: —

### AC-05 — Preview and exports derive from the same version

**What AC-05 requires (re-derived from DOC-004).** DOC-004's own text settles that AC-05 is a
derivation invariant. It does not require empirical conversion fidelity:

- **Criterion.** "Does not diverge from that version" sits in the same sentence as "does not call
  a model to regenerate content". Its object is the version: the export must not come from, or
  drift to, different content.
- **Why architecture-level.** It "fixes the direction of data flow". The failure it names is
  outputs "built from different inputs" or an exported version that "can differ from the
  previewed one", which breaks P5 "by design".
- **Evidence to look for.** It lists only the derivation paths, what keeps the version stable
  during export, and any step that calls a model or regenerates content. No fidelity measurement
  is listed.
- **Does not require.** It calls the requirement "the derivation invariant", which holds whether
  or not R-025 / R-028 apply to pending versions. DOC-004 §5 and §11 describe AC-05 the same way:
  "built from exactly the version being previewed"; "AC-05 requires derivation from the previewed
  version either way".
- **Where fidelity lives in DOC-004.** How faithfully a real output reproduces the version is
  covered elsewhere:
  - R-025 and R-028, which are Product requirements, verified under DOC-008;
  - AC-19, which makes degradation observable;
  - D-026, which defers cross-application compatibility to real-artifact evidence. DOC-004 §11
    lists it as "deliberately not treated as uncertainties".

No DOC-004 text points the other way, so the text is not ambiguous, and no P5-TENSION-03 is
needed. Stable binding does not prove fidelity: AG-02 remains each candidate's evidence on
fidelity (R-028; Phase 4 invalidation conditions), outside this Gate.

**Candidate A**
- Outcome: `Meets`
- Mechanism: DELIV-04. The export captures the immutable value by identity. Preview, PPTX writer
  and PDF writer all read that value. No step on those paths calls a model (EXPORT-05 acts only
  after production).
- Reasoning: Every output derives from exactly the previewed value, which cannot change during
  export. How faithfully the writers render it is AG-02, which is R-028 evidence, not AC-05.
- Evidence: 05 §4 flow 5 and 9; 03 ADB-DELIV-04.
- Open condition: — (AG-02 remains a Phase 4 invalidation condition via R-028; §9, §12).
- Required revision: —

**Candidate B**
- Outcome: `Meets`
- Mechanism: DELIV-05. A private copy is taken by a command in the ordered channel, so no
  transition interleaves with it (E-24). Preview images and PDF are derived from the PPTX
  serialized from that version, and no model is called.
- Reasoning: Every output derives from the previewed version's copy. Converter drift is AG-02,
  which is R-028 evidence.
- Evidence: 05 §5 flow 5 and 9.
- Open condition: — (AG-02 as for A).
- Required revision: —

**Candidate C**
- Outcome: `Meets`
- Mechanism: DELIV-04 under GC-P4-01. The immutable payload is captured by identity. Preview and
  PDF come from the same render, and PPTX is converted from that payload. No model is called.
- Reasoning: As A. Web → native PPTX conversion fidelity is AG-02, which is R-028 evidence.
- Evidence: 05 §6 flow 9; §2 GC-P4-01 disposition.
- Open condition: — (AG-02 as for A).
- Required revision: —

### AC-06 — Unvalidated results do not become pending or accepted

Only what happens before the logical success boundary (C-02) is counted here. Post-admission
evaluation (B's VALID-03) and delivery-time checks (VALID-05/06) do not count for this Gate.

**Candidate A**
- Outcome: `Meets`
- Mechanism: MB-01. Structural and geometry validation run inside the operation lifetime, and
  the verdict travels with the result (VALID-07). One guarded transition then admits the result:
  validated ∧ operation current → pending set, operation done (C-02). An invalid result leaves the
  references unchanged, which is the recovery baseline set by the commit.
- Reasoning: Nothing is displayed before admission, because the page renders only admitted
  references. For every PA-04 answer, the selected checks run before the boundary: a geometry
  stage exists, and a rendered stage can be added on the same path.
  - Whether the geometry stage is accurate is an AC-10 question. It does not change this
    ordering invariant.
- Evidence: 05 §4 flow 3–5, 7, *Validation model*; 04 C-02.
- Open condition: —
- Required revision: —

**Candidate B**
- Outcome: `Not yet assessable`
- Mechanism: VALID-01 is a content-only admission gate (structural, constraint and origin checks,
  as PA-04 selects). The channel then admits the validated result while its coordinator is
  attached (C-02). The preview is produced after admission.
- Reasoning: B's structure puts no geometry before the success boundary. Its first layout
  evidence comes after the result is pending and shown (VALID-03, OBS-03 at delivery), and that
  cannot validate admission retroactively.
  - Under B's assumption (PA-04 requires no HM-1 or HM-4 check before display), every required
    check runs before the boundary. AC-06 would be met.
  - Under another still-valid PA-04 answer, results would be displayed and made pending without a
    required check. Phase 4 records this answer as restructuring X-4 (E-14, E-15).
- Evidence: 05 §5 *Validation model*, *Product ambiguities* (PA-04); 04 E-14, E-15; DOC-008 §5.3.
- Open condition: **PA-04**. Would meet under Candidate B's PA-04 assumption. Another Product
  answer restructures X-4 (to MB-08 P).
- Required revision: —

**Candidate C**
- Outcome: `Meets`
- Mechanism: The candidate is rendered offscreen and measured (OBS-02) inside the operation
  lifetime. Structural and geometry checks run (VALID-02), and declared spans are verified. Then
  one conditional append, "result admitted, operation done", which is refused if the operation is
  no longer live (C-02). Validation outcomes are also logged (VALID-08).
- Reasoning: Nothing is displayed or derived as pending before the admission append. Runtime
  output reaches the page only as the return value of the page's own port call, so it cannot
  bypass admission. That is AG-P4-01 item 5, which C's structure already guarantees (§2).
  - Geometry and rendered checks are both available before admission for every PA-04 answer.
- Evidence: 05 §6 flow 3–4, *Validation model*, *Authority and state ownership*.
- Open condition: —
- Required revision: —

### AC-07 — One-step reject of the pending version

**Candidate A**
- Outcome: `Meets`
- Mechanism: `reject(P)` is a guarded transition that clears `pending`, and it is refused if P is
  no longer pending. The accepted value keeps its own constraint set (INTENT-01), and the
  rejected request's constraints lived only in P.
- Reasoning: Both the accepted version and the constraints in force before the request exist
  while P is reviewed. One step restores both.
- Evidence: 05 §4 flow 8, lifecycle diagram.
- Open condition: —
- Required revision: —

**Candidate B**
- Outcome: `Meets`
- Mechanism: A reject command carrying P's identity, processed in order. The pending slot, with
  its constraints, is emptied.
- Reasoning: As A. The accepted slot is untouched.
- Evidence: 05 §5 flow 8, lifecycle.
- Open condition: —
- Required revision: —

**Candidate C**
- Outcome: `Meets`
- Mechanism: A conditional `rejected` append (only if P is pending). The derived accepted version
  and the ledger position revert to those of the accepted version.
- Reasoning: The ledger attributes constraints to requests (INTENT-02), so the request's
  constraints are cancelled by derivation.
- Evidence: 05 §6 flow 8, lifecycle.
- Open condition: —
- Required revision: —

### AC-08 — Operation failures end in a determinate state

**Candidate A**
- Outcome: `Meets`
- Mechanism: An operation record with a terminal cause (OP-01) and a first-terminal-wins
  transition (OP-04). External calls go through DEP-01 ports, and an adapter failure or timeout
  becomes an operation error. The references are unchanged, so the state is the recovery
  baseline set by the commit. A failed first generation leaves `(none, none)`.
- Reasoning: Every external call crosses a port whose failure is mapped to a terminal state, and
  no version is written before the success boundary.
  - An in-process crash that terminates the process ends the session. DOC-004 treats that as
    blast radius (AC-23), not as an external failure under AC-08.
  - Timeout values are not required (AG-04).
- Evidence: 05 §4 *Failure / stop model*, *Risks*; DOC-004 AC-08 *Does not require*.
- Open condition: —
- Required revision: —

**Candidate B**
- Outcome: `Meets`
- Mechanism: Ordered error events. A worker crash becomes an `error` event for the live
  operation. The candidate area is dropped, and the slots are unchanged.
- Reasoning: Failures reach state only as ordered events, and the slots change only on a
  validated result.
- Evidence: 05 §5 *Failure / stop model*.
- Open condition: —
- Required revision: —

**Candidate C**
- Outcome: `Meets`
- Mechanism: A conditional `op-failed` append. A host or runtime crash becomes an operation
  failure while the page keeps its log. No version event is appended.
- Reasoning: The runtime and host hold no lifecycle state, so a failure partway through cannot
  half-apply a change to versions or constraints. This holds whether or not AG-P4-01 is confirmed.
- Evidence: 05 §6 *Failure / stop model*, *Authority and state ownership*.
- Open condition: —
- Required revision: —

### AC-09 — Cancelled or failed exports change no version

**Candidate A**
- Outcome: `Meets`
- Mechanism: The export reads the value by identity (DELIV-04). Output is quarantined, checked,
  then released (VALID-05, F-09). Promotion happens only through EXPORT-05 after success (C-04).
- Reasoning: No export step writes to the references before success, and a failed or invalid file
  is never released. A retry recaptures the same immutable value, with no regeneration.
- Evidence: 05 §4 flow 9–10.
- Open condition: —
- Required revision: —

**Candidate B**
- Outcome: `Meets`
- Mechanism: A DELIV-05 copy; quarantine plus a round-trip re-read (VALID-05, VALID-06); promotion
  as a command after success.
- Reasoning: The export works only on its copy, and a failure releases nothing. A retry copies the
  still-previewed version.
- Evidence: 05 §5 flow 9–10.
- Open condition: —
- Required revision: —

**Candidate C**
- Outcome: `Meets`
- Mechanism: The payload is captured by identity (DELIV-04). Files are quarantined in page memory
  until VALID-05 and VALID-06 pass. Outcome and promotion appends happen only after success.
- Reasoning: As A.
- Evidence: 05 §6 flow 9–10.
- Open condition: —
- Required revision: —

### AC-10 — Validation is possible and verifiable at acceptance and delivery points

What is assessed: whether each candidate can run the checks Product selects (PA-04) at each
transition, with the information those checks need (DOC-008 §5.3), and whether each outcome is
observable. Output validation before delivery (VALID-05, F-09) and observable validation outcomes
(F-01 links validation records to identities) are common to all three.

**Candidate A**
- Outcome: `Not yet assessable`
- Mechanism: A two-stage gate inside the operation lifetime. Stage 1 is structural, P2 (INTENT-01)
  and P1 (PROV-01 plus source items); stage 2 is geometry from the product's own layout
  computation (OBS-01). An optional rendered stage uses OBS-04. Verdicts travel with the result
  (VALID-07).
- Reasoning: Checks that need no geometry are always possible.
  - For HM-1 and HM-4, A's pre-display information is computed geometry. DOC-008 §5.3 deems HM-1
    and HM-4 feasible when the candidate "lays out … before display".
  - Whether the computed layout represents the result as displayed and output is AG-01a. It is a
    correctness question (a wrong geometry passes a clipped result), not a cost question.
  - If PA-04 selects a rendered-image check (HM-3 render errors), the rendered stage sits on the
    admission path. Its reliability there is AG-01b.
  - Under a PA-04 answer that selects no geometry or render check, AC-10 would be met.
- Evidence: 05 §4 *Validation model*, *Evidence gaps* (AG-01a), AP-VALID-01 row; DOC-008 §5.3.
- Open condition: **AG-01a** (decisive if PA-04 selects HM-1 or HM-4); **AG-01b** (decisive only if
  PA-04 selects a rendered-image check); **PA-04**.
- Required revision: —

**Candidate B**
- Outcome: `Not yet assessable`
- Mechanism: VALID-01 (content-only) before admission. VALID-05 plus VALID-06 with OBS-03 before
  delivery. VALID-07 verdicts.
- Reasoning: Output validation and observable outcomes are present. Before display, no geometry
  exists by design (DOC-008 §5.3: HM-1 and HM-4 are possible "only if the candidate lays out or
  renders before display").
  - Under B's PA-04 assumption, the selected checks are all possible before display.
  - Under another still-valid answer, they are not.
- Evidence: 05 §5 *Validation model*; DOC-008 §5.3; 04 E-14, E-15.
- Open condition: **PA-04**. Would meet under Candidate B's PA-04 assumption. Another Product
  answer restructures X-4.
- Required revision: —

**Candidate C**
- Outcome: `Not yet assessable`
- Mechanism: Render then measure, in the page's own engine (OBS-02, OBS-04), inside the operation
  lifetime. Structural and geometry stages (VALID-02). VALID-05 plus VALID-06 comparing the
  converted PPTX with the measured render. VALID-07 plus VALID-08 (validation outcomes as log
  events).
- Reasoning: Every §5.3 check that needs geometry or rendering has its information before
  admission, from the same engine that produces the preview.
  - Whether an offscreen render on the admission path is reliable enough that measurements
    reflect the displayed result is AG-01b. Phase 4 records its failure as forcing a content-only
    gate, and that gate is valid only if PA-04 allows it.
  - Latency alone would be a trade-off. Reliability decides whether a selected geometry check is
    actually possible.
- Evidence: 05 §6 *Validation model*, *Evidence gaps* (AG-01b), AP-VALID-01 row.
- Open condition: **AG-01b** (decisive if PA-04 selects HM-1, HM-3 or HM-4); **PA-04**.
- Required revision: —

### AC-11 — User content exposure is bounded

**Candidate A**
- Outcome: `Meets`
- Mechanism: DATA-01 declared sinks and DATA-02 memory-first storage. Disk writes are limited to
  one session workspace (output quarantine, render workspace). The AI provider is reached only
  through a DEP-01 port.
- Reasoning: Every sink is DeckAgent-owned and enumerable, and the provider flow is one
  identifiable port. AG-05 (declaring the provider content flow) is a declaration task at W-034,
  not a structural unknown.
- Evidence: 05 §4 DF-DATA-01, AP-DATA-01 row.
- Open condition: —
- Required revision: —

**Candidate B**
- Outcome: `Meets`
- Mechanism: DATA-01 plus DATA-02. The worker channel and the render workspace are declared sinks
  (E-56).
- Reasoning: As A. The added process boundary is itself a declared flow.
- Evidence: 05 §5 DF-DATA-01, E-56 row.
- Open condition: —
- Required revision: —

**Candidate C**
- Outcome: `Not yet assessable`
- Mechanism: DATA-01 plus DATA-02. The declared sinks are page memory, the host parsing port,
  runtime process I/O, the AI provider (reached through the runtime), host temporary files, and
  downloads.
- Reasoning: The runtime's sinks are bounded only if it makes no workspace or file writes
  (AG-P4-01 item 3). The provider flow is identifiable only if it stays inspectable through the
  runtime (item 6). Both are properties of the selected runtime.
- Evidence: 05 §6 DF-DATA-01, DF-DEP-01; §9 AG-P4-01 definition.
- Open condition: **AG-P4-01** (items 3, 6).
- Required revision: —

### AC-12 — No professional-editor dependency in the Core Flow

**Candidates A, B, C** (each assessed separately; same result and reasoning)
- Outcome: A `Meets` · B `Meets` · C `Meets`
- Mechanism: The deck is reached only through generation and deck-level refinement (flow steps
  2–8 in each candidate), and deep editing is handed off through native PPTX.
- Reasoning: No Core Flow step needs the user to manipulate objects. Internal models (a neutral
  model, a PPTX-shaped model, a web form) are internal components, which AC-12 does not restrict.
- Evidence: 05 §4, §5 and §6 end-to-end flows.
- Open condition: —
- Required revision: —

### AC-13 — No extension-to-role lock-in

**Candidates A, B, C** (each assessed separately; same result and reasoning)
- Outcome: A `Meets` · B `Meets` · C `Meets`
- Mechanism: ROLE-01. Every admitted input carries an explicit role attribute.
- Reasoning: Role is a separate attribute rather than a function of file type. Adding a second
  role for PPTX touches role admission, not the extraction path.
- Evidence: 05 decision bundles, DF-ROLE-01.
- Open condition: —
- Required revision: —

### AC-28 — Stopping an AI operation changes no version

Physical cancellation of the external call is not required (DOC-004 AC-28 *Does not require*).
AG-03 and OP-03 therefore do not affect any outcome here.

**Candidate A**
- Outcome: `Meets`
- Mechanism: Stop is a guarded terminal transition on the operation record (OP-01, OP-04).
  - A later result finds the operation terminal and is discarded at admission.
  - A coinciding stop and completion are resolved by compare-and-set: the first terminal
    transition wins.
  - One slot per session (OP-06) is claimed atomically with the commit (C-01).
  - The baseline is the accepted reference as left by the commit, so a promotion made at the
    commit stands.
- Reasoning: Correctness comes from where results commit, not from terminating calls. Every
  phase in which a stop can arrive is covered: pre-flight (nothing committed), running,
  validating (C-02: the stop wins until the success boundary), and a late result.
  - SA-01 (pause for input) adds a `waiting-for-input` state and needs no change.
  - SA-P3-01 is accommodated: there is one slot per session, whatever views share it.
- Evidence: 05 §4 flow 6–7, *Failure / stop model*, lifecycle; 04 C-01, C-02.
- Open condition: —
- Required revision: —

**Candidate B**
- Outcome: `Meets`
- Mechanism: Stop is a command in the ordered channel. It detaches the coordinator and marks the
  operation `stopped`, and a later result event finds no coordinator and is dropped. Order
  decides a coinciding stop and completion (OP-05). The channel refuses a second start (OP-07).
  OP-03 terminates worker work, as a cost-control complement.
- Reasoning: As A, with ordering in place of compare-and-set. Correctness does not rely on OP-03.
- Evidence: 05 §5 flow 7, *Failure / stop model*.
- Open condition: —
- Required revision: —

**Candidate C**
- Outcome: `Not yet assessable`
- Mechanism: A conditional `op-stopped` append. The first terminal event wins (OP-04), and a later
  result is refused at append. The slot is derived from the log (OP-06) and claimed by the
  conditional commit-plus-start append. OP-03 terminates the runtime invocation.
- Reasoning: Within one page-session, every AC-28 clause holds structurally. Late results reach
  the page only as the return of its own call and are refused by the conditional append, so this
  does not depend on AG-P4-01.
  - The clause "at most one generation or refinement runs at a time" is per Product session
    (BR-014). C fixes the session boundary at the page (the SA-P3-01 assumption "each page is a
    separate session").
  - Under the still-valid SA-P3-01 answer "a second view shares the running session", two pages
    would be one Product session with two slots. Two operations could then run at once.
- Evidence: 05 §6 flow 7, *AP-P3-01 in this candidate*, *Product ambiguities* (SA-P3-01); 04 E-37.
- Open condition: **SA-P3-01**. Would meet under Candidate C's SA-P3-01 assumption. The answer
  "shared session" needs a shared authority outside the page (restructuring). The answer "not
  allowed" adds a cross-view refusal mechanism but does not change this outcome, because each
  page-session still has one slot.
- Required revision: —

### AC-29 — Version transitions occur only at defined events

PA-01 ("delivered") is accommodated in all three candidates by EXPORT-05, one localized commit
point placed after VALID-05. DOC-004 §11 returns an event that no candidate can observe to Product.
AG-06 therefore affects confidence only (§9).

**Candidate A**
- Outcome: `Meets`
- Mechanism: One atomic transition domain (F-02, realized by STATE-05) over the references,
  constraints, slot and export records.
  - Every BR-010 event is a named guarded transition:
    - first-generation admission;
    - keep(P);
    - the fused commit (promote P, apply the request's constraints, claim the slot), after a
      non-mutating pre-flight (REQ-01);
    - promotion on export (EXPORT-05, identity-checked, C-04).
  - All-or-nothing by construction. Two references mean exactly one accepted version and at most
    one pending version.
- Reasoning: The commit-boundary and export-promotion commit points are identifiable transitions.
  - A request cancelled in pre-flight changes nothing.
  - The promoted version's constraints become the accepted set before the new request's are
    applied, in one transition.
  - An interrupted transition does not exist, because the domain is atomic.
- Evidence: 05 §4 flow 4, 6, 8, 10, lifecycle; 04 C-01, C-04; F-02, F-08, F-11.
- Open condition: —
- Required revision: —

**Candidate B**
- Outcome: `Meets`
- Mechanism: Every BR-010 event is a command processed in order by the single writer: commit,
  keep, reject, `promote-on-export(V)` (identity-checked). Admission is an atomic copy-in (E-01).
- Reasoning: As A, with serialization supplying atomicity. The commit points are the commands
  themselves.
- Evidence: 05 §5 flow 4, 6, 8, 10, lifecycle.
- Open condition: —
- Required revision: —

**Candidate C**
- Outcome: `Meets`
- Mechanism: Every BR-010 event is one conditional log append: `result-admitted`, `kept`,
  `op-started+commit` (REQ-02, C-01), and `promoted-on-export(V)` (only if V is still pending).
  The ledger position moves in the same append (E-07).
- Reasoning: The log makes the commit points directly identifiable. Only the page appends, and
  runtime output cannot write to the log (AG-P4-01 items 4–5 are structural in C, §2), so this
  does not depend on AG-P4-01. SA-P3-01 does not affect this criterion, because each deck has
  exactly one accepted version and at most one pending version within its session.
- Evidence: 05 §6 flow 4, 6, 8, 10, lifecycle.
- Open condition: —
- Required revision: —

### AC-30 — Session-loss state is available

Common to all three candidates:

- EXPORT-01 records are keyed by (version, format) (F-10). With the versions, they serve every
  PA-02 reading of "undownloaded" without restructuring, so PA-02 is accommodated.
- A warning on local process termination is not required.

**Candidate A**
- Outcome: `Not yet assessable`
- Mechanism: SESSION-01, the authority's own state, queried directly on the New-deck path.
  SESSION-02, a derived summary pushed to the page after every completed transition and export,
  used for reload and close.
- Reasoning: The state exists in the authority, which is a different process from the page. At
  the reload and close interception point, it is available in one of two ways:
  - synchronously from the authority, if AG-09 shows interception can consult it; or
  - from the mirror, whose freshness at that moment is the SESSION-02 assumption. That
    assumption is "the mirror is updated before the user can trigger a leave action" (ADB-SESSION-02),
    and its staleness risk is recorded.

  Which path applies, and whether it is current at the moment of interception (C-07), is AG-09.
- Evidence: 05 §4 flow 11, DF-SESSION-01; 03 ADB-SESSION-02; 04 C-07, E-34, E-35.
- Open condition: **AG-09**. Can reload and close interception consult the authority
  synchronously, or is the pushed mirror guaranteed current at that point?
- Required revision: —

**Candidate B**
- Outcome: `Not yet assessable`
- Mechanism: SESSION-01 plus SESSION-02, as A. The mirror is pushed after every processed command.
- Reasoning: As A.
- Evidence: 05 §5 flow 11.
- Open condition: **AG-09**.
- Required revision: —

**Candidate C**
- Outcome: `Not yet assessable`
- Mechanism: SESSION-01 in the page. The session-loss state is derived from the page's own log
  and read synchronously at every interception point (New deck, reload, close).
- Reasoning: Within one page-session, the state is where interception happens. AG-09 only
  determines which events can be intercepted at all, which DOC-004 treats as evidence, not as a
  requirement.
  - Under the still-valid SA-P3-01 answer "a second view shares the running session", a second
    view of that session would hold none of its state. Its reload or close could not evaluate
    session loss.
  - SA-P4-01 is superseded by current Product text (§2), so reload is a session-ending action
    that C intercepts.
- Evidence: 05 §6 flow 11, *Delivery and session model*.
- Open condition: **SA-P3-01**. Would meet under Candidate C's SA-P3-01 assumption. The "shared
  session" answer needs shared authority outside the page.
- Required revision: —

## 5. Observability assessment

A property counts as observable only if verification can read it at the required lifecycle point.
State that is held internally but cannot be read does not count.

### AC-14 — Geometry and text metrics per output

DOC-004 requires geometry "for preview, PPTX and PDF". Three kinds of evidence are kept apart:

- **computed geometry:** the product's layout of a model;
- **rendered measurement:** layout read from an actual render;
- **real-file evidence:** read from, or by opening, the produced file.

Computed geometry alone does not count as a per-output observation. PPTX and PDF are real files
in every candidate, so their geometry can be read by opening them in a verification application.
PA-13 names that application, and it is not a candidate property. What differs by candidate is
where preview geometry comes from.

**Candidate A**
- Outcome: `Meets`
- Where: Preview is the web render of the value. The shared headless render path (OBS-04) renders
  the same value without interaction, and element positions and text fit are read from that
  render. PPTX and PDF are real files, and every output is traceable to its value (EXPORT-01).
  Computed geometry (OBS-01) is also stored with each value.
- Lifecycle point: any admitted version; every produced file.
- Unresolved capability needed: none for observability. AG-01a concerns whether computed geometry
  can stand in for these observations *in the gate* (AC-10). This outcome does not rely on
  computed geometry.
- Evidence: 05 §4 DF-OBS-02, *Representation and artifact path*.

**Candidate B**
- Outcome: `Not yet assessable`
- Where: Preview is images rendered from the produced PPTX. Its geometry can only be the
  converter's layout of that file, read from the file and its rendering (OBS-03, OBS-05). PPTX
  geometry is re-read from the file (VALID-06). The PDF is a real file produced by the same
  converter.
- Lifecycle point: after admission (preview) and at export.
- Unresolved capability needed: yes.
  - B provides preview geometry only through the local headless PPTX render, the same capability
    that blocks AC-01 and AC-18.
  - AC-14 requires the candidate to actually provide observable preview geometry. That
    observability cannot be established while the rendering capability is unconfirmed.
- Open condition: **AG-01b**.
- Evidence: 05 §5 DF-OBS-01, DF-OBS-02, *Validation model*, *Evidence gaps*.

**Candidate C**
- Outcome: `Meets`
- Where: Preview geometry is measured on the page's own render (OBS-02), which is the render the
  user sees. The PDF is printed from the same render and is a real file. PPTX geometry is re-read
  from the file and compared with the measured render (VALID-06).
- Lifecycle point: before admission (candidate), after admission (preview), at export.
- Unresolved capability needed: none.
- Evidence: 05 §6 *Validation model*, *Representation and artifact path*.

### AC-15 — Slide order and text readable from every output

**Candidates A, B, C** (each assessed separately)
- Outcome: A `Meets` · B `Meets` · C `Meets`
- Where:
  - Versions: A's value (model), B's slot (PPTX-shaped model) and C's payload (web form) each hold
    slides in order, with text.
  - Outputs: PPTX and PDF are real files from which slide order and text can be extracted.
  - Each output is keyed to its version (EXPORT-01), including pending versions.
- Lifecycle point: every accepted or pending version; every produced file.
- Unresolved capability needed: none.
- Evidence: 05 *Representation and artifact path* for §4, §5 and §6.

### AC-16 — Content origin observable

**Candidates A, B, C** (each assessed separately)
- Outcome: A `Meets` · B `Meets` · C `Meets`
- Where: Every content element carries an origin label (PROV-01, F-12): a field on A's model, an
  owned field in B's model, an element attribute in C's payload. The labels are part of every
  accepted and pending version after generation and after refinement.
- Lifecycle point: every version.
- Unresolved capability needed: none. Whether the labels are *correct* is AC-03. AC-16 requires
  only that origin can be read.
- Evidence: 05 *Source trust / provenance model* for §4, §5 and §6.

### AC-17 — Version states observable

**Candidate A**
- Outcome: `Meets`
- Where: The authority holds the `accepted` and `pending` references to identified values, the
  operation record (status and terminal cause), and EXPORT-01 records by (V, format).
  - "Discarded" and "never created" can be told apart. An operation `done` whose value is no
    longer referenced was discarded; an operation `stopped` or `error` created nothing.
  - The accepted version after a stop that followed a commit-boundary promotion is the reference
    left by the commit.
- Lifecycle point: after every transition (refinement, keep, reject, cancelled pre-flight, stop,
  failure, export).
- Unresolved capability needed: none. Reading these without the UI is an AC-25 matter (TN-5).
- Evidence: 05 §4 *Authority and state ownership*, lifecycle.

**Candidate B**
- Outcome: `Meets`
- Where: Slots with version identities, operation status with cause, EXPORT-01 records. The
  distinction between "discarded" and "never created" is drawn as in A.
- Lifecycle point: after every processed command.
- Unresolved capability needed: none.
- Evidence: 05 §5 *Authority and state ownership*, lifecycle.

**Candidate C**
- Outcome: `Meets`
- Where: The log is the record. Every admission, keep, reject, commit, stop, failure, export
  outcome and validation outcome is an event with identities, so states before and after any
  transition are derivable.
- Lifecycle point: every append.
- Unresolved capability needed: none.
- Evidence: 05 §6 lifecycle, MB-04.

### AC-18 — Whole deck viewable as rendered

**Candidate A**
- Outcome: `Meets`
- Where: The shared headless render path (OBS-04) renders every slide of a given value without
  manual interaction.
- Lifecycle point: any admitted version.
- Unresolved capability needed: none. AG-01b concerns this render *inside operations*; AC-18 is
  outside them.
- Evidence: 05 §4 DF-OBS-02.

**Candidate B**
- Outcome: `Not yet assessable`
- Where: The only rendering path is the PPTX → image converter (OBS-05).
- Lifecycle point: after admission.
- Unresolved capability needed: yes. Whether a local headless PPTX render is feasible and
  reliable is AG-01b. Phase 4 names it B's invalidation condition for AC-18, and B has no
  alternative rendering path.
- Open condition: **AG-01b**.
- Evidence: 05 §5 *Evidence gaps*, *Reopen conditions*.

**Candidate C**
- Outcome: `Meets`
- Where: The page's render engine (OBS-04) renders any payload, offscreen or on screen.
- Lifecycle point: any version, including candidates before admission.
- Unresolved capability needed: none.
- Evidence: 05 §6 DF-OBS-02.

### AC-19 — Output degradation discoverable from real artifacts

**Candidate A**
- Outcome: `Meets`
- Where: Each real PPTX or PDF is keyed to the exact immutable value it came from (EXPORT-01,
  DELIV-04), so the file can be compared with that value. Known format losses are determinable
  from the format capability model (NPC-12). Degradations are recorded by verification;
  DOC-004 requires no product-side catalogue.
- Lifecycle point: after each export.
- Unresolved capability needed: none. How much degradation occurs is AG-02 (R-028 evidence).
- Evidence: 05 §4 AP-OBS-01 row, *Delivery and session model*.

**Candidate B**
- Outcome: `Meets`
- Where: VALID-06 re-reads each produced file against the model, and OBS-03 extracts its geometry.
  Outcomes are recorded with the export.
- Lifecycle point: at export (delivery-time).
- Unresolved capability needed: none.
- Evidence: 05 §5 DF-VALID-02.

**Candidate C**
- Outcome: `Meets`
- Where: VALID-06 compares the converted PPTX with the measured render. The PDF is printed from
  the same render. Outcomes are logged.
- Lifecycle point: at export.
- Unresolved capability needed: none.
- Evidence: 05 §6 DF-VALID-02.

### AC-20 — Operation status and failure cause reportable

**Candidate A**
- Outcome: `Meets`
- Where: The operation record (OP-01): identity, status, and terminal state (`done`, `stopped`,
  `error`) with cause.
- Lifecycle point: at every operation transition.
- Unresolved capability needed: none.
- Evidence: 05 §4 *Authority and state ownership*, *Failure / stop model*.

**Candidate B**
- Outcome: `Meets`
- Where: Operation status plus coordinator presence. Error events carry the cause, including
  worker crashes.
- Lifecycle point: after every processed event.
- Unresolved capability needed: none.
- Evidence: 05 §5 *Failure / stop model*.

**Candidate C**
- Outcome: `Meets`
- Where: Operation events in the log, with terminal cause. A host or runtime failure is appended
  as `op-failed`.
- Lifecycle point: every append.
- Unresolved capability needed: none.
- Evidence: 05 §6 *Failure / stop model*.

## 6. Formal assessment matrix

| AC | Kind | Candidate A | Candidate B | Candidate C | Blocking condition / note |
|---|---|---|---|---|---|
| AC-01 | Gate | Meets | Not yet assessable | Meets | B: AG-01b (preview and PDF exist only through a local PPTX render). C: SA-P4-01 superseded by Product text (§2) |
| AC-02 | Gate | Meets | Meets | Not yet assessable | C: AG-P4-01 items 1–2 |
| AC-03 | Gate | Not yet assessable | Not yet assessable | Not yet assessable | A: SA-P3-02 (by-construction origin fixes one answer). B, C: AG-P5-01, decisive under the SA-P3-02 answer "keeps source origin" |
| AC-04 | Gate | Meets | Meets | Meets | PA-06 not required by AC-04 |
| AC-05 | Gate | Meets | Meets | Meets | Derivation invariant per DOC-004 (§4). Conversion fidelity (AG-02) is R-028 evidence, not AC-05 |
| AC-06 | Gate | Meets | Not yet assessable | Meets | B: PA-04 (the candidate's assumption; the other answer restructures X-4) |
| AC-07 | Gate | Meets | Meets | Meets | — |
| AC-08 | Gate | Meets | Meets | Meets | C: holds by page-held authority, independent of AG-P4-01 |
| AC-09 | Gate | Meets | Meets | Meets | — |
| AC-10 | Gate | Not yet assessable | Not yet assessable | Not yet assessable | A: AG-01a (and AG-01b for a rendered check) under PA-04. B: PA-04. C: AG-01b under PA-04 |
| AC-11 | Gate | Meets | Meets | Not yet assessable | C: AG-P4-01 items 3, 6. AG-05 is confidence only |
| AC-12 | Gate | Meets | Meets | Meets | — |
| AC-13 | Gate | Meets | Meets | Meets | — |
| AC-14 | Observability | Meets | Not yet assessable | Meets | A relies on its OBS-04 render and real files, not on computed geometry. B: AG-01b (preview geometry exists only through the PPTX render) |
| AC-15 | Observability | Meets | Meets | Meets | — |
| AC-16 | Observability | Meets | Meets | Meets | Label correctness is AC-03 |
| AC-17 | Observability | Meets | Meets | Meets | — |
| AC-18 | Observability | Meets | Not yet assessable | Meets | B: AG-01b (the converter is the only rendering path) |
| AC-19 | Observability | Meets | Meets | Meets | The amount of degradation is AG-02 (R-028 evidence) |
| AC-20 | Observability | Meets | Meets | Meets | — |
| AC-21 | Trade-off | Trade-off — see §8 | Trade-off — see §8 | Trade-off — see §8 | — |
| AC-22 | Trade-off | Trade-off — see §8 | Trade-off — see §8 | Trade-off — see §8 | — |
| AC-23 | Trade-off | Trade-off — see §8 | Trade-off — see §8 | Trade-off — see §8 | — |
| AC-24 | Trade-off | Trade-off — see §8 | Trade-off — see §8 | Trade-off — see §8 | — |
| AC-25 | Trade-off | Trade-off — see §8 | Trade-off — see §8 | Trade-off — see §8 | — |
| AC-26 | Trade-off | Trade-off — see §8 | Trade-off — see §8 | Trade-off — see §8 | — |
| AC-27 | Trade-off | Trade-off — see §8 | Trade-off — see §8 | Trade-off — see §8 | — |
| AC-28 | Gate | Meets | Meets | Not yet assessable | C: SA-P3-01 ("shared session" answer). AG-03 is not a blocker |
| AC-29 | Gate | Meets | Meets | Meets | PA-01 accommodated by EXPORT-05; AG-06 is confidence only |
| AC-30 | Gate | Not yet assessable | Not yet assessable | Not yet assessable | A, B: AG-09 (synchronous access or mirror freshness at reload and close). C: SA-P3-01 |

## 7. Candidate Gate / Observability status

"Latest point" follows DOC-004 §5. A `Not yet assessable` outcome still open when W-035 would
recommend a baseline counts as not meeting the criterion.

### Candidate A — Gate status

**Does not meet:** none.

**Not yet assessable Gates**

| AC | Blocker | Evidence needed | Latest point |
|---|---|---|---|
| AC-03 | SA-P3-02 | A Product answer on the origin of rephrased source content | Before W-035 |
| AC-10 | AG-01a (+ AG-01b); PA-04 | A PA-04 answer. If it selects HM-1 or HM-4: an AG-01a spike comparing computed geometry with the rendered preview and the real outputs. If it selects a rendered-image check: an AG-01b spike on the headless render in the admission path | Before W-035 |
| AC-30 | AG-09 | A spike: can reload and close interception consult the authority synchronously, or is the SESSION-02 mirror current at that point? | Before W-035 |

**Observability gaps:** none.

**Status for continued synthesis:** No known Gate failure; evidence remains open.

### Candidate B — Gate status

**Does not meet:** none.

**Not yet assessable Gates**

| AC | Blocker | Evidence needed | Latest point |
|---|---|---|---|
| AC-01 | AG-01b | A spike: a local headless PPTX render that reliably yields preview images and PDF | Before W-035 |
| AC-03 | AG-P5-01 (with SA-P3-02) | A SA-P3-02 answer. If it is "keeps source origin": a prototype of paraphrase-aware verification | Before W-035 |
| AC-06 | PA-04 | A Product answer. B's assumption: no HM-1 or HM-4 before display | Before W-035 |
| AC-10 | PA-04 | As AC-06 | Before W-035 |
| AC-30 | AG-09 | As for A | Before W-035 |

**Observability gaps**

| AC | Blocker | Evidence needed | Latest point |
|---|---|---|---|
| AC-14 | AG-01b | Same spike as AC-01: preview geometry exists only through the PPTX render | Before W-035 |
| AC-18 | AG-01b | Same spike as AC-01 | Before W-035 |

**Status for continued synthesis:** No known Gate failure; evidence remains open.

### Candidate C — Gate status

**Does not meet:** none.

**Not yet assessable Gates**

| AC | Blocker | Evidence needed | Latest point |
|---|---|---|---|
| AC-02 | AG-P4-01 | A spike: the selected runtime returns text or data only and holds no tool or action authority | Before W-035 |
| AC-03 | AG-P5-01 (with SA-P3-02) | As for B | Before W-035 |
| AC-10 | AG-01b; PA-04 | A PA-04 answer. If it selects geometry or render checks: an AG-01b spike on the reliability of an offscreen in-page render in the admission path | Before W-035 |
| AC-11 | AG-P4-01 | A spike: no workspace or file writes by the runtime; its provider flow remains inspectable | Before W-035 |
| AC-28 | SA-P3-01 | A Product answer on second-view semantics | Before W-035 |
| AC-30 | SA-P3-01 | As AC-28 | Before W-035 |

**Observability gaps:** none.

**Status for continued synthesis:** No known Gate failure; evidence remains open.

## 8. Trade-off evidence profiles

Each candidate is described on its own. No wording here compares one candidate with another.
Every candidate's list of external dependencies and owned subsystems follows its Phase 4 bundle.

### AC-21 — Team feasibility and learning curve

**Candidate A**
- Architectural consequence: DeckAgent owns these subsystems:
  - a format-neutral deck model;
  - a layout computation that produces geometry;
  - a web render of the model;
  - a PPTX writer and a PDF writer.

  Coordination is guarded transitions inside one process.
- Main cost: a custom layout computation with text metrics, plus three output paths kept
  consistent with one model.
- Main benefit: one process and one authority, with no inter-process protocol to design.
- Evidence: 05 §4 *Trade-offs*, *Complexity*.
- Uncertainty: the team's experience with layout computation is not recorded (C-002). AG-01a may
  add a measured render to the admission path.

**Candidate B**
- Architectural consequence: DeckAgent builds these, and integrates a PPTX → image and PDF
  converter:
  - a serialized command channel;
  - per-operation coordinators;
  - a worker process with a message protocol;
  - a PPTX-shaped model and serializer.
- Main cost: channel semantics, the worker lifecycle and the protocol across the process boundary
  (E-39, E-55).
- Main benefit: every race is reduced to command order. Geometry evidence is read from produced
  files, with no layout engine of its own.
- Evidence: 05 §5 *Trade-offs*, *Complexity*.
- Uncertainty: converter behaviour (AG-01b, AG-02); PA-04 may add pre-display geometry.

**Candidate C**
- Architectural consequence: DeckAgent builds these, and integrates an external agent runtime
  under a confinement contract:
  - log derivation and conditional appends in the page;
  - a render-and-measure gate;
  - a web form → native PPTX converter.
- Main cost: the web-to-PPTX converter and the runtime confinement. Confinement removes much of
  the runtime's tool-using benefit (C-14).
- Main benefit: preview, validation render and PDF share the browser engine, and lifecycle records
  come directly from the log.
- Evidence: 05 §6 *Trade-offs*, *Complexity*; 04 C-14.
- Uncertainty: AG-P4-01 (confinement), AG-02 (converter).

### AC-22 — External dependency cost

**Candidate A**
- Architectural consequence: the AI provider, behind a DEP-01 port, is the external dependency on
  the Core Flow's critical path. The PPTX and PDF writers are owned code or libraries behind the
  writers (not chosen). A headless renderer serves AC-18, and serves the admission path only if
  PA-04 requires a rendered check.
- Main cost: after a stop, outstanding provider calls run to completion and are discarded (no
  kill-on-stop; AG-03).
- Main benefit: a provider change is contained in one adapter.
- Evidence: 05 §4 *Failure / stop model*, *Trade-offs*.
- Uncertainty: AG-03 (the cost of calls outstanding after a stop).

**Candidate B**
- Architectural consequence: the critical path includes:
  - the AI provider;
  - a PPTX → image / PDF converter (on both the preview and PDF paths);
  - a worker process.
- Main cost: a converter failure or behaviour change affects preview, PDF and geometry evidence
  together.
- Main benefit: OP-03 terminates worker work on stop, which bounds consumption after a stop.
- Evidence: 05 §5 *Trade-offs*, *Failure / stop model*.
- Uncertainty: AG-01b, AG-02, AG-03 (whether termination reaches outstanding provider calls).

**Candidate C**
- Architectural consequence: the critical path includes:
  - the AI provider, reached through the runtime;
  - the external agent runtime (generation);
  - the browser render engine (gate, preview and PDF);
  - a web → native PPTX converter.
- Main cost: a runtime change must be re-checked against the confinement contract. If the runtime
  invocation cannot be physically terminated, it keeps consuming after a stop.
- Main benefit: the browser engine is already present for the preview.
- Evidence: 05 §6 *Trade-offs*, *Evidence gaps* (AG-03 row).
- Uncertainty: AG-03 (runtime termination via OP-03), AG-P4-01.

### AC-23 — Blast radius

**Candidate A**
- Architectural consequence: the authority, adapters and layout run in one process.
- Main cost:
  - A crash in an adapter or in the layout code ends the session and loses the deck.
  - A failed assumption spreads as follows:
    - AG-01a failing changes the geometry source and adds a renderer to the admission path;
    - the other SA-P3-02 answer changes X-6, which touches source ingestion and the AI contract.
- Main benefit: a failure mid-operation leaves the references unchanged. There is no cross-process
  state to reconcile.
- Evidence: 05 §4 *Failure / stop model*, *Reopen conditions*.
- Uncertainty: the probability of an in-process crash is unknown.

**Candidate B**
- Architectural consequence: AI and render work run in a worker process. The authority and the
  channel run in the application process.
- Main cost:
  - A stalled channel blocks every action in the session.
  - The other PA-04 answer changes X-4, adding a render before admission.
  - A converter change reaches preview, PDF and geometry evidence together.
- Main benefit: a worker crash becomes an operation error, and the versions are untouched.
- Evidence: 05 §5 *Trade-offs*, *Risks*.
- Uncertainty: AG-01b.

**Candidate C**
- Architectural consequence: the authority lives in the page. The host and the runtime hold no
  lifecycle state.
- Main cost:
  - A page crash loses the session.
  - The other SA-P3-01 answer ("shared session") moves the authority out of the page, as would a
    Product change reopening SA-P4-01 (reattach on reload).
  - AG-02 failing changes X-3.
- Main benefit: a host or runtime crash becomes an operation failure, and the log is untouched.
  AG-P4-01 failing changes only X-5 (to DEP-01).
- Evidence: 05 §6 *Failure / stop model*, *Reopen conditions*.
- Uncertainty: SA-P3-01, AG-P4-01.

### AC-24 — Rollback and redesign cost

DOC-002 §20 was not read in this phase (AG-08). The reopen conditions below are the candidates' own
(Phase 4).

**Candidate A**
- Architectural consequence:
  - Low reversibility: STATE-03, DELIV-01, and PROV-05, which shapes ingestion and the AI
    contract.
  - Medium: the OBS-01 → OBS-02 geometry source.
  - High: the EXPORT-05 event, the SESSION-01 / SESSION-02 split, adding DEP-03, ROLE-01.
- Main cost: an AG-02 invalidation or the other SA-P3-02 answer changes a low-reversibility
  choice.
- Main benefit: an AG-01a failure is handled by a medium-reversibility switch within the same
  state shape.
- Evidence: 05 §4 *Reversibility*, *Reopen conditions*.
- Uncertainty: AG-02, SA-P3-02.

**Candidate B**
- Architectural consequence:
  - Low reversibility: DELIV-02a, STATE-02, and the serialized channel.
  - Medium: DEP-03, which can collapse into DEP-01.
  - High: EXPORT-05, SESSION-01 / SESSION-02, the VALID-03 lane, provenance rules.
- Main cost: an AG-02 or AG-01b invalidation, or the other PA-04 answer, changes a
  low-reversibility choice (X-3 or X-4).
- Main benefit: the process boundary can be removed without touching state.
- Evidence: 05 §5 *Reversibility*, *Reopen conditions*.
- Uncertainty: PA-04, AG-01b, AG-02.

**Candidate C**
- Architectural consequence:
  - Low reversibility: STATE-04, DELIV-03, and page-held authority.
  - Medium: DEP-02c, which can be replaced by DEP-01 without touching state.
  - High: EXPORT-05, VALID-06 rules, ROLE-01, provenance rules.
- Main cost: the other SA-P3-01 answer ("shared session"), a reopened SA-P4-01, an AG-02
  failure, or an AG-01b failure together with a PA-04 answer requiring geometry each change a
  low-reversibility choice.
- Main benefit: an AG-P4-01 failure is handled at medium reversibility.
- Evidence: 05 §6 *Reversibility*, *Reopen conditions*.
- Uncertainty: SA-P3-01, AG-02, AG-01b × PA-04.

### AC-25 — Testability cost

The answers follow DOC-004 AC-25's questions and DOC-008 §5.3, §6.2 and TN-1, TN-3, TN-5. Rubric
versus objective checks follow DOC-008 and do not differ by candidate.

**Candidate A**
- Architectural consequence:
  - Runtime checks possible before display (§5.3): structural, P1, P2, and HM-1 / HM-4 on
    computed geometry. HM-3 render errors need the optional rendered stage.
  - Output checks: R-027 at delivery. R-028 needs a test-side comparison, because A has no
    VALID-06.
  - TN-1: the constraint set is in each value.
  - TN-3: external calls cross in-process ports, where recorded, failing or held responses can be
    substituted.
  - TN-5: the authority is separate from the page.
- Main cost: agreement between computed and real geometry must be tested separately (NPC-10).
  New output degradations are seen only through test-side comparison of files with values.
- Main benefit: the gate is testable without renders.
- Evidence: 05 §4 *Trade-offs* (AC-25), *Validation model*; DOC-008 §5.3.
- Uncertainty: AG-01a.

**Candidate B**
- Architectural consequence:
  - Runtime checks possible before display: structural, P1, P2, and HM-3 "no content". HM-1 and
    HM-4 are not possible before display.
  - Output checks: R-027, plus geometry and round-trip checks at every export (VALID-06).
  - TN-1: constraints in the slots.
  - TN-3: ports, plus the worker boundary as a substitution point.
  - TN-5: the authority is separate from the page.
- Main cost: geometry tests need real files and the converter.
- Main benefit: every export produces geometry and round-trip evidence at delivery, and the
  admission gate is testable without renders.
- Evidence: 05 §5 *Trade-offs* (AC-25), *Validation model*; DOC-008 §5.3.
- Uncertainty: PA-04, AG-01b.

**Candidate C**
- Architectural consequence:
  - Runtime checks possible before display: structural, P1, P2, HM-1, HM-3 and HM-4 on the
    measured render.
  - Output checks: R-027, plus R-028 at delivery (VALID-06 against the render).
  - TN-1: the ledger.
  - TN-3: host ports, including the runtime port, where responses can be held or replaced.
  - TN-5: the authority lives in the page, so the Core Flow runs only in a page context (headless
    or not).
  - The log supports replay-based state tests.
- Main cost: gate tests need a render engine, and non-UI execution needs a page context.
- Main benefit: validation outcomes and every lifecycle event are logged (VALID-08, MB-04).
- Evidence: 05 §6 *Trade-offs* (AC-25), *Validation model*; DOC-008 §5.3.
- Uncertainty: AG-01b.

### AC-26 — Output-target extensibility

**Candidate A**
- Architectural consequence: a new target is a new writer over the format-neutral model, and the
  format capability model (NPC-12) gains an entry.
- Main cost: a target needing features the model lacks changes the model (low reversibility).
- Main benefit: most of the impact stays on the export side.
- Evidence: 05 §4 *Trade-offs* (AC-26).
- Uncertainty: which target is next is not defined (C-003, R-039).

**Candidate B**
- Architectural consequence: a new target is either derived from PPTX through a converter, or a
  second writer from the PPTX-shaped model.
- Main cost: PPTX concepts in the content form carry into non-PPTX targets (C-004 differences).
- Main benefit: targets that a converter already derives from PPTX need no new writer.
- Evidence: 05 §5 *Trade-offs* (AC-26).
- Uncertainty: converter coverage (AG-02).

**Candidate C**
- Architectural consequence: a new target is a converter from the web form. HTML and image targets
  come from the existing render.
- Main cost: each non-web target needs its own converter tracking web rendering.
- Main benefit: web-derived targets add little outside export.
- Evidence: 05 §6 *Trade-offs* (AC-26).
- Uncertainty: AG-02 (converter fidelity patterns).

### AC-27 — Translation readiness

**Candidate A**
- Architectural consequence: translation runs as a deck-level refinement through the same path.
  Layout is recomputed by the owned layout computation, the gate checks the new lengths, and a
  language constraint lives in the values.
- Main cost: every text length changes, which puts full weight on computed-geometry accuracy.
- Main benefit: no new path is needed.
- Evidence: 05 §4 *Trade-offs* (AC-27).
- Uncertainty: AG-01a.

**Candidate B**
- Architectural consequence: translation goes through the same path, and text changes inside
  native shapes. Under B's PA-04 assumption, text fit is known only after output.
- Main cost: overflow caused by translation is detected at export, after the pending version was
  shown.
- Main benefit: no new path is needed, and native shapes carry over.
- Evidence: 05 §5 *Trade-offs* (AC-27), *Risks*.
- Uncertainty: PA-04.

**Candidate C**
- Architectural consequence: translation goes through the same path. The render reflows, the gate
  measures the result, the PPTX conversion follows the reflow, and the ledger holds the language
  constraint.
- Main cost: PPTX conversion must reproduce a reflowed layout.
- Main benefit: no new path is needed, and fit is measured before admission.
- Evidence: 05 §6 *Trade-offs* (AC-27).
- Uncertainty: AG-02, AG-01b.

## 9. Evidence-gap disposition

Each gap keeps one meaning across this file. Where a gap has a different effect in different
candidates, that is stated per candidate.

| Gap | Candidate | ACs affected | Effect | Required before |
|---|---|---|---|---|
| AG-01a — computed-geometry accuracy before display | A | AC-10 (if PA-04 selects HM-1 or HM-4); AC-25, AC-27 | Blocks Gate assessment | W-035 |
| AG-01a | B | — (relevant only under a PA-04 answer that already restructures B) | No effect | — |
| AG-01a | C | AC-25 | Confidence only | — |
| AG-01b — rendered image before display / local headless render | A | AC-10 (only if PA-04 selects a rendered-image check) | Blocks Gate assessment | W-035, if PA-04 selects a rendered check |
| AG-01b | B | AC-01 | Blocks Gate assessment | W-035 |
| AG-01b | B | AC-14, AC-18 | Blocks Observability assessment | W-035 |
| AG-01b | C | AC-10 (if PA-04 selects HM-1, HM-3 or HM-4); AC-22, AC-25 | Blocks Gate assessment | W-035 |
| AG-02 — real native-PPTX fidelity (incl. NPC-10) | A, B, C | AC-19, AC-24, AC-26 (AC-05 does not require fidelity, §4) | Trade-off evidence only (for AC outcomes); still a Phase 4 invalidation condition via R-028 | W-035 |
| AG-03 — outstanding calls after stop | A, B, C | AC-22, AC-23 (C: includes runtime termination via OP-03) | Trade-off evidence only | Before the W-035 comparison, for cost evidence |
| AG-04 — timeout and retry values | A, B, C | — | No effect | Benchmark (D-011) |
| AG-05 — declared AI-provider content flow | A, B | AC-11 | Confidence only | W-034 declaration |
| AG-05 | C | AC-11 (inspectability through the runtime is AG-P4-01) | Confidence only | W-034 declaration |
| AG-06 — observable delivery events | A, B, C | AC-29 (only if PA-01 = user receipt) | Confidence only (DOC-004 §11 returns an unobservable event to Product) | W-035, if PA-01 picks receipt |
| AG-09 — interceptable session-ending events | A, B | AC-30 | Blocks Gate assessment | W-035 |
| AG-09 | C | AC-30 (interception coverage only) | Confidence only | W-035 |
| AG-P4-01 — DEP-02c confinement | C | AC-02, AC-11 | Blocks Gate assessment | W-035 |
| AG-P5-01 — provenance verification (new, §11) | B, C | AC-03 (decisive under SA-P3-02 "keeps source origin") | Blocks Gate assessment | W-035 |
| AG-P5-01 | A | — | No effect | — |
| RG-01 — OpenDesign widened RQs | A, B, C | AC-17, AC-28, AC-29, AC-30 | Confidence only | Optional W-031 follow-up |
| RG-02, RG-03, RG-08 — reference absence | A, B, C | AC-04, AC-07, AC-08, AC-28, AC-29, AC-30 | Confidence only | — |
| RG-04 — no content-provenance reference | A, B, C | AC-03, AC-16 | Confidence only (the DeckAgent evidence is AG-P5-01) | — |

## 10. Product ambiguity disposition

Listed only where the ambiguity has an assessment impact on that candidate. "Supports all answers"
does not mean the ambiguity is resolved.

| Ambiguity | Candidate | ACs affected | Does it block assessment? | Why |
|---|---|---|---|---|
| PA-01 — "delivered" | A, B, C | AC-29 | No | EXPORT-05 commits promotion at whichever event Product chooses, after VALID-05; accommodated |
| PA-02 — "undownloaded" | A, B, C | AC-30, AC-17 | No | EXPORT-01 by (version, format) serves every reading; accommodated |
| PA-04 — runtime checks | A | AC-10 | Yes, jointly with AG-01a (and AG-01b for a rendered check) | Structure accommodates every answer; a geometry or render answer makes a spike decisive |
| PA-04 | B | AC-06, AC-10 | Yes | Candidate assumption; the other answer leaves required checks impossible before display (restructures X-4) |
| PA-04 | C | AC-10 | Yes, jointly with AG-01b | As A |
| PA-06 — constraint lifetime | A, B, C | AC-04 | No | AC-04 requires no lifetime semantics; every candidate holds constraints independently of deck content |
| SA-01 — pause for input | A, B, C | AC-28, AC-20 | No | Each has a `waiting-for-input` path; accommodated |
| SA-02, SA-03, SA-P3-03 — actions during a refinement or export | A, B, C | AC-05, AC-29 | No | Captured or copied versions and identity-checked promotion (C-04) hold under every answer; C-04b / C-05 apply where allowed |
| SA-04 — retry intent | A, B, C | AC-08 | No | Accommodated by policy |
| SA-05 — preview fails for a validated pending version | B | AC-01 | No | A local policy; B carries it without restructuring (it arises after admission) |
| SA-P3-01 — second view | A, B | AC-28, AC-30 | No | One authority per session, whatever views attach; accommodated |
| SA-P3-01 | C | AC-28, AC-30 | Yes | Candidate assumption; "shared session" needs shared authority outside the page |
| SA-P3-02 — origin of rephrased source | A | AC-03 | Yes | Candidate assumption; the other answer restructures X-6 |
| SA-P3-02 | B, C | AC-03 | Yes, jointly with AG-P5-01 | Structure accommodates both answers; the "keeps source origin" answer makes AG-P5-01 decisive |
| SA-P4-01 — reload reattachment | C | AC-01, AC-30 (only if reopened) | No — superseded | Closed for the current baseline by Project Hub (R-045, UC-011) and DOC-004 AC-30, which treat reload as session-ending (§2). Reopens only if Product changes that text |
| SA-P4-01 | A, B | — | No — superseded | Either answer would have been accommodated |

No assessment impact was found for PA-03 (AC-05 is neutral on it), PA-05 (export stop is not
required), PA-10, PA-11 (AC-11 does not require deletion), PA-12 or PA-13 (PA-13 governs AG-02's
evidence application only).

## 11. AP / AC consistency check

This is a sanity check only. The Phase 4 AP coverage was read against the outcomes above. Every
`Not yet assessable` outcome names a concrete gap or ambiguity.

| AP | Phase 4 open condition | Where it lands in the AC outcomes | Consistent? |
|---|---|---|---|
| AP-FLOW-01 | A: PA-04, AG-02 · B: PA-04, AG-01b, AG-02 · C: AG-02, AG-01b, SA-P3-01 | Mapped to the ACs where each condition decides: AG-02 → no AC outcome (R-028 evidence; see AP-OBS-01); PA-04, AG-01a and AG-01b → AC-10 (B: AC-06); B's AG-01b → AC-01, AC-18; C's SA-P3-01 → AC-28, AC-30. A's and C's AC-01 rest on no open condition | Yes |
| AP-SOURCE-01 | A, B structural · C: AG-P4-01, AG-05 | C: AC-02 not yet assessable | Yes |
| AP-DATA-01 | All: AG-05 (Phase 4: confidence) | AC-11: A, B meet (AG-05 is not viability); C not yet assessable on AG-P4-01 | Yes |
| AP-INTENT-01, AP-REQ-01, AP-STATE-01 | Structural, or accommodated Product semantics | AC-04, AC-07, AC-29 meet | Yes |
| AP-OP-01 | All: SA-01 (accommodated) | AC-28, AC-20 meet in A and B. C's AC-28 is blocked only on SA-P3-01 (from AP-OP-02) | Yes |
| AP-OP-02 | A, B: SA-02, SA-03 · C: SA-P3-01 | C: AC-28 not yet assessable | Yes |
| AP-VALID-01 | A: AG-01a, PA-04 · B: PA-04 · C: AG-01b, PA-04 | AC-10 not yet assessable in all three; B's AC-06 not yet assessable. A's and C's AC-06 meet: their ordering holds under every answer, and the open point is whether a check is possible (AC-10) | Yes |
| AP-PROV-01 | A: SA-P3-02 · B, C: RG-04 | AC-03 not yet assessable in all three (B, C via AG-P5-01). See P5-TENSION-02 | Yes, with P5-TENSION-02 |
| AP-OBS-01 | A: AG-02 · B: AG-01b, AG-02 · C: AG-02 | B's AG-01b → AC-14, AC-18. AG-02 decides no AC outcome: DOC-004 places conversion fidelity in R-025 / R-028 and AC-19, not AC-05. Phase 4's reopen conditions cite "AC-05 / R-028"; under DOC-004 they operate through R-028, and they still stand as invalidation conditions | Yes (Phase 4's AC-05 citation is read through R-028) |
| AP-DELIV-01 | All structural | AC-05 meets in all (derivation invariant) | Yes |
| AP-EXPORT-01 | All: PA-01, AG-06 | AC-09, AC-29 meet (accommodated; AG-06 confidence only) | Yes |
| AP-SESSION-01 | A, B: AG-09, PA-02 · C: AG-09, PA-02, SA-P4-01 | A, B: AC-30 not yet assessable on AG-09. C: AG-09 affects coverage only; SA-P4-01 is superseded by Product text; C's AC-30 is blocked by SA-P3-01 (AP-P3-01) | Yes, with P5-TENSION-01 |
| AP-DEP-01 | A, B structural · C: AG-P4-01 | C: AC-02 and AC-11 not yet assessable. AC-08 meets because a runtime failure cannot reach page-held state (§2 mapping) | Yes |
| AP-ROLE-01 | Structural | AC-13 meets | Yes |
| AP-P3-01 | A, B: SA-P3-01, no restructuring · C: SA-P3-01, conditioned | C: AC-28, AC-30 not yet assessable; A, B accommodated | Yes |

**P5-TENSION-01 — SA-P4-01 framing versus Product text on reload**

- **Frozen claim.** 05 §8 says that UC-011 1B "requires a warning on reload but does not state
  whether a session held outside the page must end". On that basis it records SA-P4-01 as open.
- **Higher sources.** Several Product texts already name reload as an action that loses the deck:
  - Project Hub R-045's rationale: "starting a new deck, reloading the page or closing the
    application all lose the deck".
  - R-045 AC1 and UC-011's trigger.
  - DOC-004 AC-30 ("session-ending action (… reloading …; R-045 AC1)").
- **Applied.** Project Hub precedence. Reload is session-ending in the current baseline, so
  SA-P4-01 is superseded and closed (§2). The authoritative sources agree with each other, so no
  Product confirmation is required.
- **Reopen condition.** A Product change to R-045, UC-011 or BR-012 that lets a reloaded view keep
  the running session. SA-P4-01 then reopens, C's AC-01 and AC-30 are re-assessed, and a
  "reattach" answer would restructure C (05 §6).
- No frozen artifact is modified.

**P5-TENSION-02 — RG-04 used as a stand-in for DeckAgent evidence**

- **Frozen claim.** 04 §11 and 05 §4–§6 record "RG-04 — prototype before W-035 if Variant C or M
  is relied on".
- **Why it is a tension.** RG-04 is a reference-research gap (no reference keeps content-level
  origin). The prototype it asks for is DeckAgent evidence, and the Phase 5 rules allow an RG as a
  blocker only where DeckAgent evidence cannot replace it.
- **Applied.** RG-04 stays confidence only. The DeckAgent evidence is named as a new gap:
  - **AG-P5-01 — Provenance verification under paraphrase.**
    - *Question:* can PROV-06 verification (model-declared origin, checked against extracted
      source) keep AI-added and user-stated content from passing as source-derived, when
      rephrased source content is allowed to keep source origin?
    - *Affects:* AC-03 for Candidates B and C.
    - *Decisive only under* the SA-P3-02 answer "keeps source origin". Under "relabel", strict
      textual verification suffices.
    - *Required before:* W-035.
    - *Not a new ADB option.* It does not broaden RG-04.
- No frozen artifact is modified.

**DOC-004 §12 watch trigger (existing-deck editing):** not triggered.

- In all three candidates, a version enters through one admission boundary.
- No candidate structurally limits the accepted version to AI generation: an import path would
  enter through the same boundary.

## 12. Required evidence before W-035

Listed only. Nothing here is performed.

### Product decisions required

- **PA-04** (runtime checks before display):
  - B: AC-06, AC-10.
  - A: AC-10, jointly with AG-01a.
  - C: AC-10, jointly with AG-01b.

  An answer that selects no geometry or render check makes AG-01a (A) and AG-01b (C) non-decisive
  for AC-10.
- **SA-P3-02** (origin of rephrased source content):
  - A: AC-03.
  - B and C: decides whether AG-P5-01 is needed.
- **SA-P3-01** (second-view semantics): C, for AC-28 and AC-30.
- **PA-01**, only if Product intends user receipt as "delivered". This brings AG-06 into play, for
  confidence only.

### Spikes / prototypes required

| Spike | Candidates | Decides |
|---|---|---|
| AG-02 — conversion fidelity | A (neutral model → PPTX, PDF), B (PPTX → preview, PDF), C (web form → PPTX) | No AC outcome. It is each candidate's Phase 4 invalidation condition (R-028) and an input to AC-19, AC-24 and AC-26 |
| AG-01a — computed-geometry accuracy | A | AC-10, if PA-04 selects HM-1 or HM-4 |
| AG-01b — local render feasibility and reliability | B (headless PPTX render); C (offscreen in-page render in the admission path); A (headless render in the admission path, only if PA-04 selects a rendered check) | B: AC-01, AC-14, AC-18 · C: AC-10 · A: AC-10 |
| AG-09 — interception and mirror freshness | A, B | AC-30 |
| AG-P4-01 — runtime confinement (items 1–3, 6) | C | AC-02, AC-11 |
| AG-P5-01 — provenance verification under paraphrase | B, C | AC-03, if SA-P3-02 = "keeps source origin" |

### Evidence that affects trade-offs only

- **AG-03:** cost after a stop, for all three. For C this includes whether the runtime invocation
  can be terminated (OP-03). It bears on AC-22 and AC-23.
- **AG-05:** the provider-flow declaration, for all three (confidence).
- **AG-06:** delivery-event observability, if PA-01 picks receipt (confidence).
- **AG-01a for C; AG-01b latency for A and C:** AC-22 and AC-25.
- **RG-01, RG-02, RG-03, RG-04, RG-08:** confidence only.
- **Team capability** relative to each candidate's owned subsystems (C-002): AC-21.

## 13. Phase 5 handoff

### Candidate A
- Gate failures: none.
- Gate NYAs: AC-03 (SA-P3-02), AC-10 (AG-01a / AG-01b with PA-04), AC-30 (AG-09).
- Observability NYAs: none.
- Trade-off evidence complete?: yes, as architecture profiles. Empirical inputs are pending for
  AC-22 and AC-23 (AG-03) and for AC-25 and AC-27 (AG-01a).
- Blocking evidence before W-035: SA-P3-02, PA-04, AG-01a (and AG-01b if PA-04 selects a
  rendered check), AG-09. AG-02 is also required, as a Phase 4 invalidation condition (R-028), but
  decides no AC outcome.

### Candidate B
- Gate failures: none.
- Gate NYAs: AC-01 (AG-01b), AC-03 (AG-P5-01 with SA-P3-02), AC-06 (PA-04), AC-10
  (PA-04), AC-30 (AG-09).
- Observability NYAs: AC-14, AC-18 (AG-01b).
- Trade-off evidence complete?: yes, as architecture profiles. Empirical inputs are pending for
  AC-22 (AG-01b, AG-03) and AC-26 (AG-02).
- Blocking evidence before W-035: PA-04, SA-P3-02 (→ AG-P5-01), AG-01b, AG-09. AG-02 as for A.

### Candidate C
- Gate failures: none.
- Gate NYAs: AC-02 (AG-P4-01), AC-03 (AG-P5-01 with SA-P3-02), AC-10 (AG-01b with
  PA-04), AC-11 (AG-P4-01), AC-28 (SA-P3-01), AC-30 (SA-P3-01).
- Observability NYAs: none.
- Trade-off evidence complete?: yes, as architecture profiles. Empirical inputs are pending for
  AC-22 and AC-23 (AG-03, runtime termination) and AC-25 (AG-01b).
- Blocking evidence before W-035: SA-P3-01, PA-04, SA-P3-02 (→ AG-P5-01), AG-01b,
  AG-P4-01. AG-02 as for A.

### Phase-5-local issues

- **P5-TENSION-01:** SA-P4-01 framing versus the Project Hub R-045 and UC-011 text on reload.
  Project Hub is applied: SA-P4-01 is superseded and closed for the current baseline, with a
  reopen condition (§2).
- **AC-05 determination:** DOC-004 defines AC-05 as a derivation invariant, and its text is not
  ambiguous on this point, so no P5-TENSION-03 is needed. AG-02 stays candidate evidence (R-028).
- **P5-TENSION-02:** RG-04 was used as a stand-in for DeckAgent evidence; this is replaced by
  AG-P5-01.
- **AG-P5-01:** provenance verification under paraphrase (B, C; AC-03).
- **Assessment premise:** GC-P4-01 accepted. Candidate C is assessed with DELIV-04 throughout.
- No PA-P5 or SA-P5 item was needed.

### Candidates requiring revision before further comparison

None. No candidate has a Gate outcome of `Does not meet`.

### Candidates whose selection is blocked only by unresolved evidence

- **Candidate A:** SA-P3-02, PA-04, AG-02, AG-01a, AG-01b (conditional on PA-04), AG-09.
- **Candidate B:** PA-04, SA-P3-02, AG-P5-01, AG-01b, AG-02, AG-09.
- **Candidate C:** SA-P3-01, PA-04, SA-P3-02, AG-P5-01, AG-02, AG-01b, AG-P4-01.

Under DOC-004 §5, any of these still open when W-035 would recommend a baseline means that
candidate is treated as not meeting the affected criterion. AG-02 appears in each list as a Phase 4
invalidation condition (R-028). It affects no AC outcome.

### Ready for Phase 6?

**Yes, for the trade-off comparison.** Every Gate and Observability need has exactly one outcome
per candidate, and no Gate fails. Every `Not yet assessable` outcome names its blocker. Each
candidate has an AC-21 … AC-27 profile.

The factual blockers apply to a W-035 **recommendation**, not to the comparison: the evidence in
§12 must be obtained first. This phase selects no candidate.
