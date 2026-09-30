# Phase 3 — Decision / Consequence Graph

- Inputs: `01-context.md`, `02-problem-map.md`, `03-decision-bank.md` (all frozen). DOC-004 and
  DOC-008 were consulted only to confirm rules already cited in Phases 0–2.
- Built: 2026-09-30. This is a scratch file under `trash/` (gitignored). The Phase-3 IDs
  (`AP-P3-*`, `SA-P3-*`, `C-*`, `E-*`, `MB-*`, `X-*`) exist only in this artifact.

## 1. Phase boundary and method

- Phases 0–2 are frozen, and nothing in them is edited. New problems and ambiguities found here
  are kept local to this file (`AP-P3-*`, `SA-P3-*`) until they are formally accepted.
- No architecture candidate is assembled or preferred. No W-035 comparison is made.
- Negative-evidence entries, and the non-viable sub-variants of mixed entries, are excluded from
  every candidate-forming path. They appear only in §7.
- The compatibility analysis is targeted, not Cartesian:
  - alternatives inside a `choose-one` family are exclusive by family semantics, so no
    `conflicts_with` edges are added between them;
  - complements are analysed only against their base option, and against the cross-family
    options they materially affect;
  - conditional variants are analysed only under the condition that makes them viable.
- The analysis runs through seven cross-family axes (§5). It stops recursing when a consequence is
  already covered by an AP, is Detailed Design, is Product-owned, is a trade-off, or is an
  evidence gap.
- Graph-level prerequisite **IDENT** (from the NPC-01 disposition): versions and operations have
  identities that are stable, unique within the session, and never reused. Those identities must
  be able to link operations, versions, validation records, and export outcomes. The identifier
  type is Detailed Design.
- Four representation layers stay distinct throughout:
  - **state representation**: how authority holds versions (DF-STATE-01);
  - **deck content form**: DF-DELIV-01;
  - **rendered form**: DF-OBS-01 and DF-OBS-02;
  - **output artifacts**: PPTX and PDF files.

## 2. Graph-active node inventory

Status values:
- `graph-active`: may appear on a candidate-forming path.
- `graph-active-conditional`: may appear only under the stated condition.
- `complement-only`: never a standalone answer. It attaches to a base option.
- `excluded-negative`: kept as negative evidence only.

| ADB | Family | Role | Graph status | Variant / condition note |
|---|---|---|---|---|
| STATE-01 | DF-STATE-01 | Negative | excluded-negative | In-place mutation contradicts AC-06 and AC-28 |
| STATE-02 | DF-STATE-01 | Primary | graph-active | Mutable slots with admission copy-in |
| STATE-03 | DF-STATE-01 | Primary | graph-active | Requires a value-capable deck content form (see Axis B) |
| STATE-04 | DF-STATE-01 | Primary | graph-active | — |
| STATE-05 | DF-STATE-02 | Primary | graph-active | — |
| STATE-06 | DF-STATE-02 | Primary | graph-active | Viable only with a single combined guarded record (C-13) |
| INTENT-01 | DF-INTENT-01 | Primary | graph-active | — |
| INTENT-02 | DF-INTENT-01 | Primary | graph-active | — |
| INTENT-03 | DF-INTENT-01 | Primary | graph-active-conditional | conditioned_by PA-04: no runtime P2 check selected |
| REQ-01 | DF-REQ-01 | Primary | graph-active | Converges with REQ-02 under C-01 |
| REQ-02 | DF-REQ-01 | Primary | graph-active | Converges with REQ-01 under C-01 |
| REQ-03 | DF-REQ-01 | Negative | excluded-negative | Contradicts BR-010 rule 4 and D-030 |
| OP-01 | DF-OP-01 | Primary | graph-active | — |
| OP-02 | DF-OP-01 | Primary | graph-active | Needs DF-OP-02 |
| OP-03 | DF-OP-01 | Complement | complement-only | Cost and resource complement to OP-01 or OP-02 |
| OP-04 | DF-OP-02 | Primary | graph-active | — |
| OP-05 | DF-OP-02 | Primary | graph-active | — |
| OP-06 | DF-OP-03 | Primary | graph-active | — |
| OP-07 | DF-OP-03 | Primary | graph-active | — |
| OP-08 | DF-OP-03 | Negative | excluded-negative | Allowed only as a UX add-on, outside the graph |
| VALID-01 | DF-VALID-01 | Primary | graph-active | Base option |
| VALID-02 | DF-VALID-01 | Primary | graph-active | Base option. Needs geometry before display |
| VALID-03 | DF-VALID-01 | Complement | complement-only | Non-gating evaluation lane |
| VALID-04 | DF-VALID-01 | Complement | complement-only | Assumes part-based generation (NPC-08) |
| VALID-05 | DF-VALID-02 | Primary (base) | graph-active | — |
| VALID-06 | DF-VALID-02 | Complement | complement-only | Attaches to VALID-05 |
| VALID-07 | DF-VALID-03 | Primary | graph-active | — |
| VALID-08 | DF-VALID-03 | Primary | graph-active | — |
| OBS-01 | DF-OBS-01 | Primary | graph-active | — |
| OBS-02 | DF-OBS-01 | Primary | graph-active | — |
| OBS-03 | DF-OBS-01 | Primary | graph-active-conditional | conditioned_by PA-04: no pre-display HM-1/HM-4 check |
| OBS-04 | DF-OBS-02 | Primary | graph-active | — |
| OBS-05 | DF-OBS-02 | Primary | graph-active | — |
| PROV-01 | DF-PROV-01 | Primary | graph-active | Base option |
| PROV-02 | DF-PROV-01 | Conditional | graph-active-conditional | Only with coarse user/AI labelling (a PROV-01-style complement) |
| PROV-03 | DF-PROV-01 | Complement | complement-only | Verification cross-check |
| PROV-04 | DF-PROV-01 | Negative | excluded-negative | Usable as an AC-17 trace outside the candidate-forming graph |
| PROV-05 | DF-PROV-02 | Primary | graph-active | Also conditioned_by SA-P3-02 |
| PROV-06 | DF-PROV-02 | Primary | graph-active | — |
| DELIV-01 | DF-DELIV-01 | Primary | graph-active | conditioned_by AG-02 |
| DELIV-02 | DF-DELIV-01 | Primary | graph-active | Two sub-variants: **02a** a DeckAgent-owned PPTX-shaped model; **02b** a library object graph as working state |
| DELIV-03 | DF-DELIV-01 | Primary | graph-active (native-object PPTX only) | The screenshot-PPTX variant is excluded |
| DELIV-04 | DF-DELIV-02 | Conditional | graph-active-conditional | Only with STATE-03 |
| DELIV-05 | DF-DELIV-02 | Primary | graph-active | — |
| DELIV-06 | DF-DELIV-02 | Conditional | graph-active-conditional | conditioned_by SA-03 and SA-P3-03 ("no concurrency during export") |
| EXPORT-01 | DF-EXPORT-01 | Primary | graph-active | — |
| EXPORT-02 | DF-EXPORT-01 | Negative | excluded-negative | Contradicts the AC-30 criterion text |
| EXPORT-03 | DF-EXPORT-02 | Conditional | graph-active-conditional | PA-01 reading: "valid file produced" |
| EXPORT-04 | DF-EXPORT-02 | Conditional | graph-active-conditional | PA-01 reading: "user receipt", and AG-06 |
| EXPORT-05 | DF-EXPORT-02 | Primary | graph-active | Localized policy. Its event is chosen later |
| SESSION-01 | DF-SESSION-01 | Primary | graph-active | conditioned_by AG-09 |
| SESSION-02 | DF-SESSION-01 | Primary | graph-active | — |
| SESSION-03 | DF-SESSION-01 | Negative | excluded-negative | Contradicts R-045 AC2 |
| SESSION-04 | DF-SESSION-02 | Primary | graph-active | — |
| SESSION-05 | DF-SESSION-02 | Primary | graph-active | — |
| SOURCE-01 | DF-SOURCE-01 | Complement (layered) | graph-active | A layered family; the three options are combinable peers |
| SOURCE-02 | DF-SOURCE-01 | Complement (layered) | graph-active | Same |
| SOURCE-03 | DF-SOURCE-01 | Complement (layered) | graph-active | Same |
| ROLE-01 | DF-ROLE-01 | Primary | graph-active | — |
| ROLE-02 | DF-ROLE-01 | Primary | graph-active | — |
| DATA-01 | DF-DATA-01 | Primary (base) | graph-active | — |
| DATA-02 | DF-DATA-01 | Complement | complement-only | — |
| DATA-03 | DF-DATA-01 | Conditional | graph-active-conditional | conditioned_by PA-11 |
| DEP-01 | DF-DEP-01 | Primary (base) | graph-active | — |
| DEP-02 | DF-DEP-01 | Conditional | graph-active-conditional (confined, text-returning variant only) | The observed variant is excluded |
| DEP-03 | DF-DEP-01 | Complement | complement-only | Worker process complement |

Totals:

| Status | Count |
|---|---|
| graph-active | 44 |
| graph-active-conditional | 9 |
| complement-only | 7 |
| excluded-negative | 6 |
| **Total** | **66** |

Two further sub-variants are excluded: the screenshot variant of DELIV-03 and the observed variant
of DEP-02.

DF-SOURCE-01's three options are Phase-2 "complements" inside a `choose-one-or-more` family with
no base. They are kept graph-active as layered peers; otherwise AP-SOURCE-01 would have no
candidate-forming option.

## 3. NPC disposition

### NPC-01 — Stable identity for versions and operations

- **Disposition:** Covered by existing AP.
- **Reasoning:** Several AP invariants already presuppose identity:
  - AP-STATE-01: states can be told apart, including "pending discarded" from "never created".
  - AP-OP-01: a result can be recognised as belonging to an ended operation.
  - AP-EXPORT-01: outcomes are traceable to a version and a format.
  - AP-SESSION-01: outcomes are evaluated per version.

  Identity is the shared precondition of these invariants, not a separate problem.
- **Affected APs:** AP-STATE-01, AP-OP-01, AP-EXPORT-01, AP-SESSION-01, AP-VALID-01.
- **Affected ADB families:** DF-STATE-01, DF-STATE-02, DF-OP-01, DF-EXPORT-01, DF-VALID-03,
  DF-DELIV-02.
- **Action:** No new AP. Identity becomes the graph-level prerequisite **IDENT** (§1), with
  `requires IDENT` edges in §4. The identifier type is Detailed Design.

### NPC-02 — Atomic update across state parts

- **Disposition:** Covered by existing AP.
- **Reasoning:** AP-STATE-01 already requires each change to "happen completely or not at all" and
  to act on deck and constraint state together.
  - Phase 3 locates the **owner** of that guarantee: DF-STATE-02, the transition authority.
  - An immutable value (STATE-03) does not provide the guarantee (§1, E-02).
  - The logical transition covers the `accepted` reference, the `pending` reference, the paired
    constraint state, and, where applicable, the export-outcome record and the operation slot
    (C-01, C-04).
- **Affected APs:** AP-STATE-01, AP-INTENT-01, AP-REQ-01, AP-EXPORT-01.
- **Affected ADB families:** DF-STATE-02 (owner), DF-STATE-01, DF-INTENT-01, DF-REQ-01,
  DF-EXPORT-02.
- **Action:** No new AP. `DF-STATE-02 resolves_consequence NPC-02`. STATE-06 is viable only when
  every part sits in one guarded record (C-13).

### NPC-03 — Stop during validation or admission

- **Disposition:** Covered by existing AP (AP-OP-01 together with AP-VALID-01). It is resolved by
  a derived rule (C-02).
- **Reasoning:**
  - AC-28 lets the user stop "at any time before it finishes". AC-06 forbids admission before
    validation.
  - The UC-001, UC-002, and UC-004 main flows put "check result" before "show result", and UC-014
    has only three terminal states: done, stopped, error.
  - If validation ran after a terminal `done`, a stop arriving during validation would be refused
    while the result was not yet visible. That contradicts R-046 AC1 under any reading.
  - So, for stop purposes, the operation's lifetime extends through validation up to the admission
    commit. Validation success, admission, and `done` form one logical success boundary: terminal
    success cannot occur before validation and admission succeed. The sources do not require
    these to be one physical event, only that no observer sees `done` without an admitted,
    validated version.
  - A stop that wins during validation discards the result, even if it has been validated.
  - Whether rendering on the validation path can be interrupted affects only resources and stop
    latency (C-03). That is Detailed Design and a trade-off, not a correctness question.
- **Affected APs:** AP-OP-01, AP-VALID-01.
- **Affected ADB families:** DF-OP-02, DF-VALID-01, DF-STATE-01.
- **Action:** No new AP. `ADB-OP-04 / ADB-OP-05 resolves_consequence NPC-03` under rule C-02. No
  new semantic ambiguity: the rule satisfies R-046 whether or not Product regards validation as
  "AI processing".

### NPC-04 — Operation waiting for user input

- **Disposition:** Product ambiguity / semantic question. It is already SA-01, so no new SA is
  created.
- **Reasoning:** A suspended state inside an operation exists only if SA-01 is answered "a running
  generation may pause for input" (UC-002 5A). Under the other answer, UC-002 5A takes the
  "mark as AI-added" path, or the clarification moves to pre-flight.
- **Affected APs:** AP-OP-01, AP-REQ-01, AP-PROV-01.
- **Affected ADB families:** DF-OP-01, DF-OP-02, DF-REQ-01, DF-PROV-02.
- **Action:** Carry SA-01. Phase 4 candidates must state how they would accommodate each SA-01
  answer, including what stop means while suspended.

### NPC-05 — Determinism of constraint derivation

- **Disposition:** Trade-off consequence.
- **Reasoning:** It arises only with INTENT-03, which is already conditioned_by PA-04. When no P2
  runtime check is selected, the cost falls on TN-1 and R-024 testability, which is AC-25.
- **Affected APs:** AP-INTENT-01.
- **Affected ADB families:** DF-INTENT-01.
- **Action:** Record under AC-25 for W-035. No AP.

### NPC-06 — Multiple client views and client–authority consistency

- **Disposition:** New architecture problem **AP-P3-01**, plus a spin-off Product question
  **SA-P3-01**.
- **Reasoning:**
  - V1 is a local web app (D-027), so reloads and second tabs are unavoidable.
  - No frozen AP states that an action issued from a stale or concurrent client observation must
    not cause an invalid lifecycle transition. AP-OP-02, AP-SESSION-01, and AP-EXPORT-01 each
    touch this, but none owns it.
  - Where authority resides relative to the browser boundary is left to candidates. That includes
    a browser-owned or session-per-view authority.
  - Whether a second view shares the running session is a semantic question that no source
    answers (BR-014 speaks of "per session").
- **Affected APs:** AP-OP-02, AP-SESSION-01, AP-EXPORT-01, AP-STATE-01.
- **Affected ADB families:** DF-OP-03, DF-SESSION-01, DF-EXPORT-02, DF-STATE-02.
- **Action:** Define AP-P3-01 and SA-P3-01 (below).

#### AP-P3-01 — Client-view consistency: stale or concurrent observations cannot cause invalid lifecycle transitions

- **Problem:** A client view (the initial view, a reloaded view, a second view) acts on what it
  last observed about version state, operation status, and session-loss inputs. That observation
  can be stale, or concurrent with another view's action. Acting on it must never produce a
  lifecycle transition that BR-010, BR-014, or R-045 would forbid against the current state.
- **Must hold, wherever authority resides:**
  - A version-changing action is evaluated against the current lifecycle state, not against the
    view's observation. It has no effect if the version it targets is no longer in the expected
    state. For example, "keep" on a version that is no longer pending does nothing.
  - BR-014 exclusivity holds across every view that can issue actions within one session. Two
    views cannot each start an operation.
  - A session-loss decision made at a client interception point reflects every transition and
    export that completed before the user's action.
  - A client-reported event, such as a hand-off or download signal, changes lifecycle state only
    through the same checked transition path as any other action.
- **Left to candidates:** where authority resides (a server-side process, the page itself, one
  authority per view, or another arrangement) and how the invariants above are met there. The
  answer to SA-P3-01 narrows which placements are viable but does not fix one.
- **Why architecture-level:** Every placement of authority must show how it meets these
  invariants, and the answer constrains exclusivity, session-loss evaluation, and export promotion.
- **Status:** Phase-3-local. It exists only in this graph until formally accepted.

#### SA-P3-01 — Semantics of a second client view

- **Question:** Is a second browser view of the running local app the same session (sharing the
  deck), a separate session, or not allowed?
- **Ownership:** TBD — not added to Project Hub.
- **Affects:** AP-P3-01, AP-OP-02, AP-SESSION-01.

### NPC-07 — Renderer on the admission path

- **Disposition:** Covered by existing AP (AP-DEP-01 requires every external dependency to be
  bounded, with failure turned into an operation error). The cost side is a trade-off consequence
  (AC-22, AC-08 failure surface).
- **Reasoning:** The consequence exists only if AG-01b and PA-04 lead to rendered checks before
  admission.
- **Affected APs:** AP-DEP-01, AP-VALID-01, AP-OP-01.
- **Affected ADB families:** DF-VALID-01, DF-OBS-01, DF-DEP-01.
- **Action:** An edge (`ADB-OBS-02 creates_pressure_on AP-DEP-01`, conditioned_by AG-01b). No new
  AP.

### NPC-08 — Generation decomposition

- **Disposition:** Trade-off consequence (AC-23, AC-25). The internal generation shape is Detailed
  Design.
- **Reasoning:**
  - AC-01 explicitly does not require any pipeline shape.
  - Every Gate invariant applies at the operation boundary (admission, stop, validation),
    whatever the internal decomposition.
  - Decomposition changes local retry (VALID-04), the stop phases (inside the operation), and
    blast radius. None of that changes which cross-family combinations are viable.
- **Affected APs:** AP-OP-01, AP-VALID-01, AP-PROV-01.
- **Affected ADB families:** DF-VALID-01 (VALID-04), DF-PROV-02.
- **Action:** VALID-04 stays conditioned on part-based generation. Candidates may state their
  generation shape as a non-defining attribute. It is not an axis.

### NPC-09 — Degradation classification

- **Disposition:** Detailed Design concern. The content of the rules belongs to Product and
  Testing (R-026, BR-013, the DOC-008 catalogue).
- **Reasoning:** Where the rule is applied is already fixed by VALID-05, VALID-06, and AP-EXPORT-01.
  What the rule says is not architectural.
- **Affected APs:** AP-OBS-01, AP-EXPORT-01.
- **Affected ADB families:** DF-VALID-02.
- **Action:** Defer.

### NPC-10 — Text-measurement agreement across outputs

- **Disposition:** Testing / spike concern.
- **Reasoning:**
  - It is the same uncertainty as AG-02 (real PPTX fidelity) and AG-01a (the geometry source),
    seen from the angle of measurement.
  - It varies with the deck content form (Axis B) but does not create a new invariant; R-028 and
    HM-1 already state the requirement.
- **Affected APs:** AP-OBS-01, AP-DELIV-01, AP-VALID-01.
- **Affected ADB families:** DF-OBS-01, DF-DELIV-01.
- **Action:** Add to the AG-02 spike scope: compare the chosen geometry source with the geometry in
  the real PPTX and PDF.

### NPC-11 — Origin of paraphrased or mixed content

- **Disposition:** Product ambiguity / semantic question, recorded as **SA-P3-02**.
- **Reasoning:** Three Product rules leave the question open:
  - R-007 preserves meaning.
  - BR-002 exception 1 allows AI additions if they are distinguishable.
  - D-025 includes tone and audience refinements, which necessarily rephrase source-derived text.

  Whether a rephrased source fact is still "source-derived", and whether an element may mix
  origins, is a semantic rule. Only Product can set it. Provenance options differ in which answers
  they can accommodate (Axis E).
- **Affected APs:** AP-PROV-01, AP-VALID-01.
- **Affected ADB families:** DF-PROV-01, DF-PROV-02.
- **Action:** SA-P3-02 (below). No AP.

#### SA-P3-02 — Origin of rephrased source content

- **Question:** When a refinement rephrases source-derived content (for example tone or audience),
  does the result keep source origin? May a single element mix origins?
- **Ownership:** TBD — not added to Project Hub.
- **Affects:** AP-PROV-01, AP-VALID-01. Most directly ADB-PROV-05.

### NPC-12 — Format capability model

- **Disposition:** Covered by existing AP (AP-OBS-01: "known format losses are determinable before
  export").
- **Reasoning:** The need exists under every DF-DELIV-01 option. Its scope depends on the content
  form: large for DELIV-01 and DELIV-03, smaller for DELIV-02a and DELIV-02b.
- **Affected APs:** AP-OBS-01, AP-DELIV-01.
- **Affected ADB families:** DF-DELIV-01.
- **Action:** No AP. It stays as an Axis-B consequence.

**Summary by disposition**

| Disposition | Count | NPCs |
|---|---|---|
| Covered by existing AP | 5 | NPC-01, 02, 03, 07, 12 |
| New architecture problem | 1 | NPC-06 → AP-P3-01, plus SA-P3-01 |
| Product ambiguity / semantic question | 2 | NPC-04 → existing SA-01; NPC-11 → SA-P3-02 |
| Detailed Design concern | 1 | NPC-09 |
| Testing / spike concern | 1 | NPC-10 |
| Trade-off consequence | 2 | NPC-05, 08 |
| Not a distinct problem | 0 | — |

## 4. Structural relationship graph

Only material edges are listed. Rows marked † fold several family alternatives into one row. A
row counts as one edge in the handoff totals.

| # | From | Relation | To | Scope / condition | Reason |
|---|---|---|---|---|---|
| E-01 | STATE-02 | requires | DF-STATE-02 | — | The copy-in of deck and constraints must be atomic (NPC-02) |
| E-02 | STATE-03 | requires | DF-STATE-02 | — | Immutable values do not make the reference-and-constraint update atomic |
| E-03 | STATE-04 | requires | DF-STATE-02 | — | Log appends must be serialized or guarded |
| E-04 | STATE-02 / 03 / 04 † | requires | DF-OP-01 | — | Admission must know the producing operation is still current |
| E-05 | STATE-02 / 03 / 04, STATE-06, OP-01, EXPORT-01, VALID-08, DELIV-04 † | requires | IDENT | — | NPC-01 disposition |
| E-06 | STATE-06 | requires | a single combined guarded record | — | C-13: versions, constraints, slot, and export records must be guarded together |
| E-07 | INTENT-02 | requires | DF-STATE-02 | The atomic scope includes the ledger position | Pairing by reference |
| E-08 | INTENT-03 | conditioned_by | PA-04 | No runtime P2 check | T-P2-01 |
| E-09 | INTENT-03 | conflicts_with | VALID-01, VALID-02 | Only if PA-04 selects a runtime P2 check | No explicit constraint set at the validation point |
| E-10 | VALID-01 / 02 † | requires | INTENT-01 or INTENT-02 | conditioned_by PA-04 (P2) | T-P2-01 |
| E-11 | VALID-01 / 02 † | requires | PROV-01 (or PROV-02 plus its complement) | conditioned_by PA-04 (P1) | Origin must be present at the gate (DOC-008 §5.3) |
| E-12 | VALID-02 | requires | OBS-01 or OBS-02 | — | Geometry before display |
| E-13 | VALID-02 | conflicts_with | OBS-03 | — | OBS-03 has geometry only after export |
| E-14 | VALID-01 | requires | OBS-01 or OBS-02 | conditioned_by PA-04 (HM-1 or HM-4 at runtime) | Same |
| E-15 | OBS-03 | conditioned_by | PA-04 | No pre-display HM-1/HM-4 check | DOC-008 §5.3 |
| E-16 | REQ-01 / 02 † | requires | DF-STATE-02 and DF-OP-03 within one atomic transition | — | C-01: commit and slot claim must be atomic |
| E-17 | OP-01 | requires | DF-DEP-01 containment (DEP-01, or the confined DEP-02) | — | No side channel writes version state |
| E-18 | OP-02 | requires | DF-OP-02 | — | A race rule |
| E-19 | OP-04 / OP-05 † | requires | a DF-VALID-01 base placed inside the operation lifetime | — | C-02: `done` cannot precede validation and admission (one logical success boundary) |
| E-20 | OP-04 | requires | DF-OP-01 | — | Needs a terminal state to compare-and-set |
| E-21 | OP-03 | requires | OP-01 or OP-02 | Complement | It cannot be the sole guard |
| E-22 | DELIV-04 | requires | STATE-03 | Condition | Value semantics |
| E-23 | STATE-03 | makes_unnecessary | DELIV-05 | — | Values need no copy |
| E-24 | DELIV-05 | requires | DF-STATE-02 | — | The copy must be atomic relative to transitions |
| E-25 | DELIV-06 | conditioned_by | SA-03, SA-P3-03 | "No concurrency during export" | — |
| E-26 | DELIV-02b | creates_pressure_on | STATE-02, STATE-03 | — | Copying or snapshotting a library object graph is costly and may lose information (C-09) |
| E-27 | STATE-03 | conditioned_by | a value-capable deck content form | Met by DELIV-01, DELIV-02a, DELIV-03 | Special rule: state representation is distinct from content form |
| E-28 | EXPORT-03 / 04 / 05 † | requires | VALID-05 | — | Promotion only after output validation (AC-29) |
| E-29 | EXPORT-03 / 04 / 05 † | requires | DF-STATE-02 | Identity-checked against the exported version's current state; behaviour when that version was rejected or superseded is conditioned_by SA-P3-03 (C-04b) | C-04 |
| E-30 | EXPORT-03 | conditioned_by | PA-01 | — | — |
| E-31 | EXPORT-04 | conditioned_by | PA-01, AG-06 | — | — |
| E-32 | EXPORT-05 | makes_unnecessary | EXPORT-03 and EXPORT-04 as separate structural choices | — | The chosen event lives inside the policy |
| E-33 | SESSION-01 / 02 † | requires | EXPORT-01 | — | Outcomes by version and format |
| E-34 | SESSION-02 | requires | AP-P3-01 client-view consistency | — | The session-loss input the view reads must reflect every completed transition |
| E-35 | SESSION-01 | conditioned_by | AG-09 | — | Synchronous access from the interception point |
| E-36 | EXPORT-04 | creates_pressure_on | AP-P3-01 client-view consistency | — | A client-observed event must go through the checked transition path |
| E-37 | OP-06 / OP-07 † | requires | AP-P3-01 client-view consistency | — | The slot or channel must be shared across every view that can issue actions in one session, wherever it resides |
| E-38 | DEP-02 (confined) | requires | SOURCE-03, OP-01, and a DF-STATE-01 candidate area | Condition | Confinement means text returned and materialized, no tool authority |
| E-39 | DEP-03 | requires | DF-STATE-02 held outside the worker | Complement | The worker holds no state |
| E-40 | PROV-05 | requires | SOURCE-02 | — | Addressable source items |
| E-41 | PROV-05 | conditioned_by | SA-P3-02 | — | Placing source items by construction is incompatible with freely rephrasing them as "source" |
| E-42 | PROV-02 | requires | PROV-01 (coarse user/AI labelling) | Condition | AC-16 needs the three-way distinction |
| E-43 | PROV-01 | creates_pressure_on | DF-DELIV-01 | Strongest for DELIV-02b | Origin must be carried in the version's content form (C-10) |
| E-44 | PROV-06 | creates_pressure_on | AP-DEP-01 | — | A structured-output contract with the model |
| E-45 | VALID-04 | requires | VALID-01 or VALID-02 (with a completeness check) | Complement, part-based generation | Otherwise a partial deck could be admitted |
| E-46 | VALID-06 | requires | VALID-05; DF-OBS-01 for geometry | Complement | — |
| E-47 | VALID-03 | requires | DF-OBS-02 | Complement | Needs a rendered view |
| E-48 | DATA-03 | conditioned_by | PA-11 | — | — |
| E-49 | DATA-03 | conflicts_with | SESSION-04 | If PA-11 requires deletion at session end, or if the cache becomes visible to Product state | Semantic session boundary |
| E-50 | OBS-02 | creates_pressure_on | AP-DEP-01, AP-OP-01 | conditioned_by AG-01b | NPC-07; stop latency |
| E-51 | DELIV-01, DELIV-03 (native) † | conditioned_by | AG-02 | Spike before W-035 | Fidelity of native PPTX objects |
| E-52 | DELIV-02a / 02b † | conditioned_by | AG-01b, AG-02 | Preview and PDF go through a PPTX renderer or converter | A-017, R-028 |
| E-53 | DF-STATE-02 | resolves_consequence | NPC-02 | — | — |
| E-54 | OP-04 / OP-05 † with rule C-02 | resolves_consequence | NPC-03 | — | — |
| E-55 | OP-07 | creates_pressure_on | DF-OP-02 (toward OP-05) | — | One shared ordering is natural |
| E-56 | DEP-03 | creates_pressure_on | AP-DATA-01 | — | Content crosses a process boundary |

Phase 2 tensions resolved here:
- **REQ-02 × STATE-05** (runner writes versus sole writer): not a conflict. The fused step can be
  one authority transition, "commit boundary + register operation" (C-01).
- **REQ-02 × DEP-03** (a transactional start across processes): not a conflict. The commit and the
  registration happen at the authority, and dispatch to the worker follows. The operation is
  already `running` during dispatch.
- **STATE-03 × DELIV-02:** a cost pressure, not a conflict (E-26, E-27). A PPTX-shaped model owned
  by DeckAgent (02a) can be a value. Only a library object graph (02b) makes copying costly.

## 5. Cross-family axis analysis

### Axis A — Authoritative state and transition authority

- **Families:** DF-STATE-01, DF-STATE-02, DF-INTENT-01, DF-REQ-01.
- **Main options:**
  - State shape: STATE-02 (mutable slots), STATE-03 (immutable values plus references), STATE-04
    (transition log).
  - Authority: STATE-05 (single writer) or STATE-06 (combined guarded record).
  - Intent: INTENT-01 (paired), INTENT-02 (ledger), INTENT-03 (conditional).
- **Key edges:** E-01 … E-07, E-16, E-22 … E-24.
- **Findings:**
  - All three state shapes require DF-STATE-02 and IDENT. NPC-02 never disappears through the
    state-shape choice alone. It disappears only through the authority choice (E-53).
  - Mutable slots (STATE-02) need export stability through a copy (DELIV-05). Immutable values
    (STATE-03) make that copy unnecessary (E-23). A log (STATE-04) behaves like values for export
    if its payloads are immutable.
  - INTENT-01 pairs naturally with STATE-02 and STATE-03, because the constraint set lives in the
    version unit. INTENT-02 pairs naturally with STATE-04, because ledger entries are events.
    Either intent option works with any shape, provided the atomic scope covers it (E-07).
  - STATE-06 converges on STATE-05 as more parts join the atomic scope: the slot (C-01), export
    records (C-04), and the constraint ledger. A distinct STATE-06 branch stays coherent only with
    few transition paths (C-13).
  - REQ-01 and REQ-02 converge under C-01. The remaining difference is who invokes the fused
    transition (the lifecycle authority, or the operation runner calling the authority). That is
    not candidate-defining.
- **Open conditions:** PA-06 (constraint lifetime; INTENT-02 accommodates the most answers).
  PA-04 (INTENT-03). SA-04 (retry intent after a failed first generation).

### Axis B — Deck content form, rendered form, and geometry source

- **Families:** DF-DELIV-01, DF-DELIV-02, DF-OBS-01, DF-OBS-02, DF-PROV-01.
- **Main options:**
  - Content form: DELIV-01 (format-neutral), DELIV-02a (DeckAgent-owned PPTX-shaped), DELIV-02b
    (library object graph), DELIV-03 native (web-rendered, with native PPTX conversion).
  - Geometry source: OBS-01 (computed), OBS-02 (render then measure), OBS-03 (conditional; only
    after export).

| Content form | Geometry before display | Needs a render before admission (if geometry checks are selected) | Carries origin naturally | Compatible with immutable values | Main AG dependence | NPC-10 / NPC-12 load |
|---|---|---|---|---|---|---|
| DELIV-01 | via OBS-01, or OBS-02 on its preview renderer | Only with OBS-02 | Yes | Yes | AG-02 (PPTX and PDF writers) | High / high |
| DELIV-02a | Shape positions are native; text fit needs OBS-01 or a PPTX render | For text fit | Yes (DeckAgent-owned fields) | Yes | AG-01b / AG-02 (preview and PDF via converter) | Medium / low |
| DELIV-02b | As 02a | As 02a | Awkward (library metadata) — E-43 | Under pressure (E-26) | Same | Medium / low |
| DELIV-03 native | Native via OBS-02 | Yes (a browser-class render) | Yes | Yes | AG-02 (HTML → native PPTX objects) | Medium / high |

- **Findings:**
  - Keeping the layers distinct matters. STATE-03 does not imply DELIV-01, and DELIV-02 does not
    imply mutable state (E-27).
  - OBS-04 (a headless render shared with preview) fits DELIV-01 and DELIV-03. OBS-05 (rendering
    output files) fits DELIV-02 and any form that uses VALID-06.
  - Every content form carries an AG-02 spike. The direction of the risk differs:
    - DELIV-01 and DELIV-03 risk drift from the model or HTML into PPTX.
    - DELIV-02 risks drift from PPTX into the preview and PDF.
- **Open conditions:** AG-01a, AG-01b, AG-02 (spikes before W-035). PA-03. PA-13.

### Axis C — Validation placement, admission, and stop

- **Families:** DF-VALID-01, DF-VALID-03, DF-OP-01, DF-OP-02, DF-STATE-01.
- **Derived model (C-02):**
  - Validation sits **inside the operation lifetime**: after the AI's compute, and before the
    terminal transition.
  - Validation success, admission, and `done` form one logical success boundary, guarded by
    operation identity (OP-01 or OP-02) and by the race rule (OP-04 or OP-05). Terminal success
    cannot occur before validation and admission succeed. How the boundary is realized (one
    transition, or ordered steps that no observer can split) is Detailed Design.
  - A stop that arrives before the boundary wins; the result is discarded, even if validation
    later passes.
  - A validated result can never be admitted after a stop.
  - Validation that runs after a terminal `done` is incoherent, because it contradicts R-046 AC1
    and AC-06 together.
- **Variation that remains:**
  - What the gate contains: VALID-01 (single gate) or VALID-02 (structural, then geometry).
  - Where geometry comes from: Axis B.
  - Whether a renderer is on the admission path: yes with OBS-02, or with OBS-01 plus a
    rendered-image check; no with OBS-01 geometry only, or with OBS-03.
- **Consequences:**
  - C-03: rendering that cannot be interrupted continues after a stop, so it costs resources and
    stop-response latency. That is a trade-off.
  - NPC-07 is covered by AP-DEP-01.
- **Open conditions:** PA-04 (which checks run), AG-01a, AG-01b.

### Axis D — Coordination of version-changing actions

- **Families:** DF-OP-03, DF-OP-02, DF-STATE-02, DF-REQ-01, DF-EXPORT-02.
- **Two coherent styles:**

  | Style | Options | How ordering is achieved |
  |---|---|---|
  | **Guarded** | STATE-05 (or STATE-06 with a combined record) + OP-06 slot + OP-04 compare-and-set | Each action is an atomic authority transition, identity-checked against current state |
  | **Serialized** | STATE-05 + OP-07 command channel + OP-05 event ordering | All actions and events are processed in one order |

- **Findings:**
  - Neither style depends on the order in which views observe state. Both must satisfy AP-P3-01
    client-view consistency (E-37), wherever the slot or channel resides.
  - One ordered command path is **not** required. Identity-checked atomic transitions give the
    same BR-010 guarantees.
  - Both styles meet the C-04 invariant: promotion targets the exported version's identity.
    Whether export promotion can race with keep, reject, or a refinement commit at all depends on
    SA-P3-03. If those actions are allowed during an export, the C-04b / C-05 branch applies.
- **Open conditions:** SA-02, SA-03, SA-P3-03, SA-P3-01.

### Axis E — Source grounding and origin assignment

- **Families:** DF-SOURCE-01, DF-PROV-01, DF-PROV-02, DF-VALID-01, DF-INTENT-01.
- **Findings:**
  - SOURCE-01, 02, and 03 are layers. SOURCE-03 is also the main enabler of AP-DEP-01 containment
    (E-38).
  - Only PROV-05 and PROV-06 differ materially:

    | Option | Origin assigned by | Requires | Conditioned by |
    |---|---|---|---|
    | PROV-05 | Construction (the system places extracted source items) | SOURCE-02 (E-40) | SA-P3-02 (E-41) |
    | PROV-06 | The model, then verified by the system | A structured-output contract (E-44) | — |

  - Both need a PROV-01 label layer for AC-16.
  - After paraphrase:
    - PROV-06 plus PROV-01 accommodates either answer to SA-P3-02: relabel as AI-added, or keep
      as source if verified.
    - PROV-05 accommodates only "rephrased content is re-labelled", or rules that forbid
      rephrasing source items.
  - Runtime P1 checks (PA-04) need explicit origin at the gate (E-11). Runtime P2 checks need an
    explicit constraint set (E-10).
- **Open conditions:** SA-P3-02, PA-04, PA-12, RG-04.

### Axis F — Session, client, and delivery observation

- **Families:** DF-SESSION-01, DF-SESSION-02, DF-EXPORT-01, DF-EXPORT-02, DF-OP-03.
- **State that can go stale on the client:** the operation-running indicator, the session-loss
  mirror, the displayed pending version, and a download or hand-off signal. AP-P3-01 requires
  that acting on any of them cannot cause an invalid lifecycle transition, whatever holds
  authority.
- **Findings:**
  - Browser reload or close interception decides synchronously in the page (UC-011 1B).
    - If authority resides outside the page, a mirror (SESSION-02) is needed.
    - If authority resides in the page, the page reads it directly. Consistency across views then
      falls on SA-P3-01 and on how each view's authority relates to the others.
    - SESSION-01 alone is enough only if the page can consult wherever authority resides
      synchronously, which AG-09 must establish.
    - The New-deck path can use SESSION-01 directly.
  - Delivery semantics that depend on browser-observable events: only EXPORT-04 (and EXPORT-05 if
    Product picks a hand-off event), subject to AG-06.
  - The multiple-tab question is split: its semantics are Product's (SA-P3-01); the client-view
    consistency invariants are architectural (AP-P3-01). Where authority resides is a candidate
    choice.
- **Open conditions:** PA-01, PA-02, AG-06, AG-09, SA-P3-01.

### Axis G — AI runtime containment and process boundary

- **Families:** DF-DEP-01, DF-OP-01, DF-SOURCE-01, DF-DATA-01, DF-STATE-01.
- **Findings:**
  - External runtimes must never mutate shared state directly (E-17). This rules out the observed
    DEP-02 variant.
  - The confined DEP-02 variant keeps only text-returning use, which removes much of DEP-02's
    stated benefit, the reuse of a tool-using agent loop (C-14).
  - No correctness mechanism depends on physical cancellation. OP-03 and DEP-03 add cost control
    and crash isolation only.
  - Content sinks that cannot be avoided:
    - the AI provider (AG-05);
    - the renderer workspace, if OBS-02, OBS-04, or OBS-05 is used;
    - held output files (VALID-05);
    - a process-boundary channel (DEP-03);
    - validation records that contain content (VALID-07 and VALID-08).

    Each must be a declared DATA-01 sink.
- **Three material alternatives:**
  - in-process ports (DEP-01);
  - ports plus a worker process (DEP-01 + DEP-03);
  - a confined external agent runtime behind ports (DEP-01 + DEP-02 confined).
- **Open conditions:** AG-03 (cost only), AG-05, RG-01.

## 6. Recursive consequences discovered

| # | Source combination | Consequence | Disposition |
|---|---|---|---|
| C-01 | DF-REQ-01 × DF-OP-03 × DF-STATE-02 | The commit-boundary transition must be atomic with claiming the single-operation slot. Otherwise two pre-flights could both commit (for example from two views). As a result, REQ-01 and REQ-02 converge. | Existing AP (AP-REQ-01 with AP-OP-02) |
| C-02 | DF-VALID-01 × DF-OP-02 × DF-OP-01 | Validation success, admission, and terminal `done` form one **logical success boundary**. Terminal success cannot be observed before validation and admission have both succeeded, and a stop can win until that boundary. The sources do not require the three to be one physical implementation event. | Existing AP (AP-OP-01, AP-VALID-01). Resolves NPC-03 |
| C-03 | C-02 × OBS-02 / VALID-02 | Validation work that cannot be interrupted continues after a stop, and its output is discarded. | Detailed Design and trade-off (AC-22, R-030 stop latency) |
| C-04 | DF-EXPORT-02 × DF-STATE-02 | **Invariant:** promotion on export targets the identity of the exported version V and is checked against V's current lifecycle state. It never acts on a different version, such as a newer pending one. | Existing AP (AP-STATE-01; BR-010 rule 3c applies only to "the pending version") |
| C-04b | C-04 × keep/reject/commit during an export | **Branch, conditioned_by SA-P3-03.** If Product allows these actions while an export runs: a V rejected or superseded during its own export is not promoted, and the later promotion is a no-op. If Product blocks them during an export, this case does not arise. Whether the file of a rejected V is still delivered is also SA-P3-03. | Product: SA-P3-03 |
| C-05 | C-04b × DF-REQ-01 | Within the C-04b branch that allows a refinement commit during an export: if the commit promotes V while an export of V runs, the export's later promotion is a no-op. The outcome record is still keyed to V (now accepted). | Existing AP (AP-EXPORT-01, AP-SESSION-01), conditioned_by SA-P3-03 |
| C-06 | DF-OP-03 × DF-SESSION-01 × client views | An action from a stale or concurrent view must not cause an invalid transition: it is evaluated against current lifecycle state. The running status and session-loss inputs a view relies on must be consistent across views, wherever authority resides. | New AP-P3-01 |
| C-07 | DF-SESSION-01 × browser interception | A synchronous page-local decision needs session-loss inputs that are current at that moment: a fresh mirror, synchronous access to wherever authority resides, or authority in the page. | Evidence gap AG-09; AP-P3-01 |
| C-09 | DELIV-02b × STATE-02 / STATE-03 | Copying or snapshotting a library object graph for candidate isolation or for values is costly and possibly lossy. | Trade-off (AC-21, AC-24). Possible spike folded into AG-02 |
| C-10 | PROV-01 × DELIV-02b | Origin labels need a home in the content form. A library graph has no natural slot for them. | Trade-off (AC-21, AC-25) |
| C-11 | PROV-05 × D-025 tone/audience refinements | Placing source items by construction conflicts with rephrasing them, unless Product defines relabelling. | Product: SA-P3-02 |
| C-12 | DF-VALID-01 × DF-INTENT-01 (PA-04) | A runtime P2 check requires an explicit constraint set at the gate. This confirms T-P2-01 as a graph edge (E-10). | Existing AP (AP-VALID-01 / AP-INTENT-01, conditional) |
| C-13 | STATE-06 × C-01 × C-04 × INTENT-02 | Distributed guarded transitions need one combined guarded record covering versions, constraints, slot, and export records, which converges toward a single authority. | Existing AP (AP-STATE-01). Trade-off (AC-23) |
| C-14 | E-17 × DEP-02 | Confining an external agent runtime removes most of its stated benefit (reusing a tool-using loop). | Trade-off (AC-21, AC-22) |

C-08 was withdrawn during analysis: renderer isolation in a worker is the same consequence as
NPC-07 plus C-03. The number is not reused.

Recursion stopped at every row: each ends in an existing AP, Detailed Design, a Product question,
a trade-off, or an evidence gap. Only C-06 produced a new AP.

### SA-P3-03 — User actions during an export

- **Question:** While an export is in progress, may the user keep, reject, commit a new refinement,
  or start a new deck? If the exported pending version is rejected in the meantime, is the file
  still delivered?
- **Ownership:** TBD — not added to Project Hub.
- **Relation to SA-03:** SA-03 asks about an export running during an AI operation. SA-P3-03 asks
  about user actions during an export.
- **Affects:** DELIV-06, AP-OP-02, AP-EXPORT-01, MB-05, MB-06; conditions the C-04b / C-05 branch.

## 7. Pruned / non-candidate-forming branches

| ADB / variant | Status | Reason |
|---|---|---|
| STATE-01 | Excluded — known incompatible | Contradicts AC-06 and AC-28 (visible partial state, late writes) |
| REQ-03 | Excluded — known incompatible | Contradicts BR-010 rule 4 and D-030 |
| OP-08 (as enforcement) | Excluded — known incompatible | Not structural (AC-28). A UX add-on only |
| PROV-04 (for content origin) | Excluded — known incompatible | No content-level origin (AC-16). Usable as an AC-17 trace |
| EXPORT-02 | Excluded — known incompatible | Contradicts the AC-30 text |
| SESSION-03 | Excluded — known incompatible | Contradicts R-045 AC2 |
| DELIV-03 screenshot variant | Excluded — known incompatible | UC-008 postcondition 4, D-015 |
| DEP-02 observed variant | Excluded — known incompatible | Direct writes and tool authority contradict AC-28 and AC-02 (E-17) |
| OP-03 | Complement only | Cannot guarantee AC-28 alone |
| VALID-03 | Complement only | Non-gating |
| VALID-04 | Complement only | Needs a deck-level gate. Assumes part-based generation |
| VALID-06 | Complement only | Adds to VALID-05 |
| PROV-03 | Complement only | Reconstructs rather than preserves origin (AC-03) |
| DATA-02 | Complement only | Footprint minimization on top of DATA-01 |
| DEP-03 | Complement only | Adds to DEP-01 |
| INTENT-03 | Conditional branch | PA-04 (no runtime P2 check) |
| OBS-03 | Conditional branch | PA-04 (no pre-display HM-1/HM-4) |
| PROV-02 | Conditional branch | Needs PROV-01 coarse labels |
| DELIV-04 | Conditional branch | Only with STATE-03 |
| DELIV-06 | Conditional branch | SA-03 and SA-P3-03 |
| EXPORT-03, EXPORT-04 | Conditional branch | PA-01 (EXPORT-04 also AG-06). Realizable inside EXPORT-05 (E-32) |
| DATA-03 | Conditional branch | PA-11 |
| DEP-02 confined variant | Conditional branch | Only confined (E-38) |
| All other graph-active entries | Still candidate-forming | — |

Two options were merged by convergence, not pruned. REQ-01 and REQ-02 remain listed. Under C-01
their difference (who invokes the fused transition) is non-defining.

## 8. Mechanism Bundles

Every bundle below is a reusable building block, **not an architecture candidate**. A bundle may
appear in several future candidates. Variants inside a bundle are labelled alternatives.

### MB-01 — Admission guard core

- **Purpose:** Nothing unvalidated, stopped, failed, or late becomes a version. Validation
  success, admission, and terminal `done` form one logical success boundary (C-02).
- **Contains:** OP-01 (or OP-02 plus a race rule); OP-04 or OP-05; a DF-VALID-01 base (VALID-01 or
  VALID-02) inside the operation lifetime; VALID-07 and/or VALID-08.
- **Requires:** an isolated state shape (one of MB-02, MB-03, MB-04); DF-STATE-02; IDENT; DF-DEP-01
  containment (E-17).
- **Excludes:** STATE-01; OP-03 as the sole guard; DEP-02 in its observed form; validation after a
  terminal `done`.
- **Why coherent:** Operation identity, the validation verdict, and the race outcome are all
  checked before the success boundary. No observer sees `done` without an admitted version.
- **Open conditions:** PA-04 (gate contents); AG-01a and AG-01b (gate latency); SA-01 (a suspended
  state).

### MB-02 — Value-based lifecycle

- **Purpose:** Versions are immutable values. The authority holds only references and the paired
  constraints.
- **Contains:** STATE-03, STATE-05, INTENT-01, DELIV-04, EXPORT-01.
- **Requires:** a value-capable content form (DELIV-01, DELIV-02a, or DELIV-03); IDENT; MB-01.
- **Excludes:** DELIV-05 (made unnecessary); DELIV-02b (under pressure; E-26).
- **Why coherent:**
  - Export stability comes for free.
  - Outcome records key on value identity.
  - One atomic unit covers the references and constraints.
- **Open conditions:** PA-06; the retention footprint (AP-DATA-01).

### MB-03 — Mutable-slot lifecycle

- **Purpose:** Accepted and pending slots hold decks. Operations work in isolated candidate areas.
  Admission copies a candidate in.
- **Contains:** STATE-02, STATE-05, INTENT-01 or INTENT-02, DELIV-05, EXPORT-01.
- **Requires:** MB-01; IDENT; an atomic copy-in (E-01, E-24).
- **Excludes:** DELIV-04.
- **Why coherent:** It works with any content form, including DELIV-02b, at the cost of copies.
- **Open conditions:** PA-06; C-09 (copy cost for 02b).

### MB-04 — Transition-log lifecycle

- **Purpose:** Lifecycle events are the authority. Versions and outcomes are derived from them.
- **Contains:** STATE-04, STATE-05, INTENT-02, EXPORT-01 (as log events), VALID-08.
- **Requires:** MB-01; IDENT; immutable payloads (or DELIV-05).
- **Excludes:** —
- **Why coherent:** AC-17, AC-29, and AC-30 observability are native to the log. INTENT-02 ledger
  entries are events.
- **Open conditions:** AC-21 feasibility (trade-off); AP-DATA-01 growth.

### MB-05 — Commit boundary and exclusivity

- **Purpose:** Pre-flight changes nothing. One atomic transition performs promotion, applies
  constraints, and claims the slot (C-01).
- **Contains:**
  - Variant G (guarded): REQ-01 or REQ-02, OP-06, STATE-05 (or STATE-06 with a combined record),
    OP-04.
  - Variant S (serialized): REQ-01, OP-07, OP-05, STATE-05.
- **Requires:** AP-P3-01 client-view consistency (the slot or channel is shared by every view
  that can issue actions in one session, wherever it resides; E-37); IDENT.
- **Excludes:** REQ-03; OP-08 as enforcement.
- **Why coherent:** Both variants give BR-014 plus D-030. They differ in how ordering is achieved
  (Axis D).
- **Open conditions:** SA-01, SA-02, SA-03, SA-P3-01, SA-P3-03.

### MB-06 — Validated delivery and localized promotion

- **Purpose:** No invalid file is delivered. Promotion happens once, at an identifiable,
  replaceable post-production event, and is identity-checked (C-04 invariant). Behaviour when the
  exported version is rejected or superseded during the export follows the SA-P3-03 branch
  (C-04b, C-05).
- **Contains:** VALID-05 (+ VALID-06 as a complement), EXPORT-05, EXPORT-01, STATE-05, and one of
  DELIV-04, DELIV-05, or DELIV-06.
- **Requires:** DF-STATE-02; IDENT.
- **Excludes:** EXPORT-02.
- **Why coherent:** Output validation precedes the promotion policy, and the policy calls a single
  authority transition.
- **Open conditions:** PA-01; AG-06; PA-03; SA-P3-03 (and DELIV-06 depends on SA-03).

### MB-07 — Session-loss evaluation

- **Purpose:** Every interceptable session-ending action can evaluate "would lose undownloaded
  work" from inputs that are current at the moment of the action. The semantic session boundary is
  enforced in one place.
- **Contains:** EXPORT-01, SESSION-01 and/or SESSION-02, SESSION-04 (or SESSION-05).
- **Requires:** AP-P3-01 client-view consistency (E-34); IDENT.
- **Excludes:** SESSION-03; DATA-03 when PA-11 requires deletion.
- **Why coherent:** One record of outcomes by version and format serves every PA-02 reading. The
  delivery route to the browser is set by AG-09.
- **Open conditions:** PA-02, PA-11, AG-09, SA-P3-01.

### MB-08 — Geometry and validation placement

- **Purpose:** Place geometry-dependent checks relative to display.
- **Contains:**
  - Variant P (pre-display): VALID-02, OBS-01 or OBS-02, OBS-04, (+ VALID-03).
  - Variant D (delivery-time): VALID-01 (content-only gate), OBS-03, VALID-06, OBS-05, (+ VALID-03).
- **Requires:** Axis-B content form. Variant P requires geometry before display (E-12).
- **Excludes:** In Variant P, OBS-03 (E-13). Variant D is valid only if PA-04 does not require
  HM-1 or HM-4 before display (E-15).
- **Why coherent:** Each variant supplies exactly the evidence its gate consumes.
- **Open conditions:** PA-04; AG-01a; AG-01b; AG-02 (via NPC-10).

### MB-09 — Source grounding and origin

- **Purpose:** Source stays data, and origin is kept and observable in every version.
- **Contains:**
  - Variant C (by construction): SOURCE-02, PROV-05, PROV-01, SOURCE-01, SOURCE-03.
  - Variant M (model-declared, verified): PROV-06, PROV-01, SOURCE-01, SOURCE-03 (+ SOURCE-02
    optional).
- **Requires:** a content form that can carry origin labels (E-43). If PA-04 selects P1 runtime
  checks, the MB-01 gate must read origin (E-11).
- **Excludes:** PROV-03 as the primary mechanism; PROV-04.
- **Why coherent:** Each variant has a single assigner of the "source" label.
- **Open conditions:** SA-P3-02 (conditions Variant C); PA-12; RG-04.

### MB-10 — Contained AI boundary

- **Purpose:** External AI and tools cannot write state, cannot act, and send content only through
  declared flows.
- **Contains:** DEP-01, SOURCE-03, DATA-01 (+ DEP-03, OP-03, DATA-02 as complements; + DEP-02
  confined as a conditional variant).
- **Requires:** MB-01's admission point.
- **Excludes:** DEP-02 in its observed form.
- **Why coherent:** A late result can reach state only through admission. Egress is enumerable
  (TN-4).
- **Open conditions:** AG-05; AG-03 (for DEP-03 and OP-03); RG-01.

## 9. Candidate-defining axes for Phase 4

| Axis | Families | Material alternatives | Constrains | Open evidence |
|---|---|---|---|---|
| **X-1 Authoritative state shape** | DF-STATE-01 (+ DF-INTENT-01 pairing) | Immutable values (MB-02) · mutable slots (MB-03) · transition log (MB-04) | DF-DELIV-02 (export stability), DF-INTENT-01 pairing, the retention footprint, which content forms fit (E-26, E-27) | None blocking. AC-21 and AC-24 are trade-offs |
| **X-2 Coordination style** | DF-OP-03, DF-OP-02, DF-STATE-02, DF-REQ-01 | Guarded atomic transitions (MB-05 G) · serialized command authority (MB-05 S) | How export promotion, keep/reject, commit, stop, and client actions are ordered (C-01, C-04, C-06) | SA-02, SA-03, SA-P3-01, SA-P3-03 (policies, not the style) |
| **X-3 Deck content form** | DF-DELIV-01 (+ DF-OBS-01, DF-OBS-02) | Format-neutral (DELIV-01) · PPTX-shaped (DELIV-02a or 02b) · web-rendered with native PPTX conversion (DELIV-03) | Geometry source, the render path, origin carriage, AC-26 and AC-27 option value, X-1 fit | **AG-02**, AG-01b (spikes before W-035) |
| **X-4 Geometry and validation placement** | DF-VALID-01, DF-OBS-01, DF-VALID-02 | Pre-display geometry checks (MB-08 P) · delivery-time geometry evidence (MB-08 D) | Renderer on the admission path (NPC-07), stop latency (C-03), what R-033 protects | **PA-04**, **AG-01a**, AG-01b |
| **X-5 AI runtime containment and process boundary** | DF-DEP-01 (+ DF-OP-01, DF-DATA-01) | In-process ports · ports + worker process · a confined external agent runtime | Content sinks, kill-on-stop, crash isolation, AC-21 and AC-22 | AG-03 (cost only), AG-05 |
| **X-6 Origin assignment** | DF-PROV-02 (+ DF-SOURCE-01, DF-PROV-01) | By construction (MB-09 C) · model-declared, verified (MB-09 M) | Source ingestion depth, generation freedom under D-025, P1 runtime checks | **SA-P3-02**, RG-04 |

These are not candidate-defining: DF-EXPORT-02 (EXPORT-05 localizes the PA-01 choice),
DF-SESSION-01 (decided by AG-09 or by combining both options), DF-ROLE-01 (low-cost and local), and
REQ-01 versus REQ-02 (converged). Every candidate must still state its choice in these families.

Axis coupling:
- X-1 and X-3 interact through E-26 and E-27: STATE-03 with DELIV-02b is under pressure.
- X-3 and X-4 interact: DELIV-03 makes MB-08 P natural. Variant D does not depend on the content
  form.

The other axes vary largely independently.

## 10. Product ambiguities after graph analysis

| ID | Affected bundles / axes | Can Phase 4 proceed without it? |
|---|---|---|
| PA-01 | MB-06 | Yes. EXPORT-05 keeps the choice local |
| PA-02 | MB-07 | Yes. EXPORT-01 serves every reading |
| PA-03 | MB-06, X-3 (verification scope) | Yes |
| PA-04 | MB-01, MB-08, X-4; INTENT-03, OBS-03 | Yes, if candidates carry both X-4 variants or state their assumption |
| PA-05 | MB-01 and MB-05 (if export becomes an operation) | Yes. DOC-004 §12 watch trigger |
| PA-06 | MB-02, MB-03, MB-04 | Yes (INTENT-02 accommodates the most answers) |
| PA-10 | AP-ROLE-01 (outside bundles) | Yes |
| PA-11 | MB-07, MB-10; DATA-03 | Yes |
| PA-12 | MB-09 | Yes |
| PA-13 | X-3 (AG-02 spike) | Yes. Needed for the spike's evidence application |
| SA-01 | MB-01, MB-05, MB-09 | Yes. Candidates state how they accommodate each answer (NPC-04) |
| SA-02 | MB-05, X-2 | Yes |
| SA-03 | MB-05, MB-06, DELIV-06 | Yes |
| SA-04 | Axis A (intent on retry) | Yes |
| SA-05 | MB-01, MB-08 | Yes |
| **SA-P3-01** (new) | MB-05, MB-07, AP-P3-01 | Yes. The AP-P3-01 invariants hold under any answer |
| **SA-P3-02** (new) | MB-09, X-6 | Yes. Variant M accommodates both answers; Variant C only one |
| **SA-P3-03** (new) | MB-05, MB-06; C-04b, C-05 | Yes. The C-04 invariant holds under any answer; candidates carry the C-04b branch or state their assumption |

The three new SA-P3 items have ownership TBD and were not added to Project Hub. None blocks
candidate assembly.

## 11. Evidence gaps and spikes

| Gap | Graph elements affected | Latest resolution | Can Phase 4 proceed carrying alternatives? |
|---|---|---|---|
| AG-01a — post-layout geometry before display | X-4, MB-08 P, OBS-01, OBS-02, VALID-02 | Spike before W-035 | Yes |
| AG-01b — rendered image before display | X-4, X-3, MB-08 P, OBS-02, OBS-04, DELIV-02 | Spike before W-035 | Yes |
| AG-02 — real native-PPTX fidelity (now also covering NPC-10, and C-09 copy cost) | X-3 (every content form), MB-08 | Spike before W-035; full compatibility is learned in implementation | Yes. It conditions viability, so W-035 cannot recommend without it |
| AG-03 — outstanding calls after stop | X-5 (DEP-03, OP-03 complements) | Only if a candidate relies on kill-on-stop for cost | Yes. Affects confidence only |
| AG-04 — timeout and retry values | — | Benchmark (D-011) | Yes. No effect on the graph |
| AG-05 — declared provider content flow | X-5, MB-10 | W-034 (each candidate declares its flows) | Yes |
| AG-06 — observable delivery events | MB-06 (event choice inside EXPORT-05) | Spike before W-035, if PA-01 picks user receipt | Yes |
| AG-09 — interceptable session-ending events | MB-07 (SESSION-01 vs SESSION-02) | Spike before W-035 | Yes (carry SESSION-01 + SESSION-02) |
| RG-01 — OpenDesign widened RQs | X-1, X-5, MB-01 (confidence only) | Optional W-031 follow-up | Yes |
| RG-02, RG-03, RG-08 | X-1, X-2, MB-02 … MB-07 | Carried. The reasoning comes from DeckAgent constraints | Yes |
| RG-04 — no content-provenance reference | X-6, MB-09 | Prototype before W-035 if Variant C or M is relied on | Yes |

## 12. Phase 3 handoff

### NPC disposition summary

| Disposition | Count | NPCs |
|---|---|---|
| Covered by existing AP | 5 | NPC-01, 02, 03, 07, 12 |
| New architecture problem | 1 | NPC-06 → AP-P3-01 |
| Product ambiguity | 2 | NPC-04 → SA-01; NPC-11 → SA-P3-02 |
| Detailed Design | 1 | NPC-09 |
| Testing / spike | 1 | NPC-10 |
| Trade-off | 2 | NPC-05, 08 |

New IDs, all Phase-3-local:
- **AP-P3-01:** client-view consistency — stale or concurrent client observations cannot cause
  invalid lifecycle transitions. Where authority resides is left to candidates.
- **SA-P3-01:** semantics of a second client view.
- **SA-P3-02:** origin of rephrased source content.
- **SA-P3-03:** user actions during an export.

### Graph-active options

| Category | Count |
|---|---|
| Unconditional (graph-active) | 44 |
| Conditional (graph-active-conditional) | 9 |
| **Graph-active total** | **53** |
| Complement-only | 7 |
| Excluded-negative | 6 |
| Excluded sub-variants | 2 |

### Hard requires and conflicts

- **31 `requires` rows**:
  - E-01 … E-07, E-10 … E-12, E-14, E-16 … E-22, E-24, E-28, E-29, E-33, E-34, E-37 … E-40, E-42,
    E-45 … E-47.
- **3 `conflicts_with` rows**:
  - E-09: INTENT-03 × runtime P2 gate (conditional).
  - E-13: VALID-02 × OBS-03.
  - E-49: DATA-03 × SESSION-04 (conditional).
- **2 `makes_unnecessary` rows**:
  - E-23: STATE-03 → DELIV-05.
  - E-32: EXPORT-05 → EXPORT-03/04 as separate structural choices.
- Few conflicts remain because intra-family alternatives are exclusive by family semantics, and
  known-incompatible variants were pruned in §7.
- **The most consequential edges:**
  - E-02: immutable values still need DF-STATE-02.
  - E-16 / C-01: the commit is atomic with the slot claim.
  - E-19 / C-02: validation, admission, and `done` form one logical success boundary.
  - E-17: no side channel.
  - E-27 / E-26: state representation is separate from content form.
  - E-10 / E-11: runtime checks need an explicit constraint set and explicit origin.
  - E-29 / C-04: promotion is identity-checked (the reject/supersede branch C-04b is conditioned
    by SA-P3-03).

### Mechanism bundles

| Bundle | Purpose |
|---|---|
| MB-01 | Admission guard core |
| MB-02 | Value-based lifecycle |
| MB-03 | Mutable-slot lifecycle |
| MB-04 | Transition-log lifecycle |
| MB-05 | Commit boundary and exclusivity (G / S) |
| MB-06 | Validated delivery and localized promotion |
| MB-07 | Session-loss evaluation |
| MB-08 | Geometry and validation placement (P / D) |
| MB-09 | Source grounding and origin (C / M) |
| MB-10 | Contained AI boundary |

### Candidate-defining axes

| Axis | Choice |
|---|---|
| X-1 | Authoritative state shape |
| X-2 | Coordination style |
| X-3 | Deck content form |
| X-4 | Geometry and validation placement |
| X-5 | AI runtime containment and process boundary |
| X-6 | Origin assignment |

### Blocking issues before Phase 4

None. The accepted Phase 1–2 structure plus this graph is enough to assemble candidates.

### Non-blocking uncertainties to carry

- AP-P3-01 and SA-P3-01 … 03 await formal acceptance.
- The spikes AG-01a, AG-01b, AG-02, AG-06, and AG-09 must be done before W-035, not before W-034.
- PA-04 decides whether both X-4 variants stay open.
- SA-P3-02 conditions X-6 Variant C.
- SA-01 (a suspended operation) must be accommodated by every candidate.
