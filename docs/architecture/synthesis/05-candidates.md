# Phase 4 — Architecture Candidates

- Inputs: `01-context.md`, `02-problem-map.md`, `03-decision-bank.md`, `04-decision-graph.md` (all
  frozen). DOC-004 was consulted only to confirm AC names and kinds.
- Built: 2026-09-30. This is a scratch file under `trash/` (gitignored). No Project Hub change.

## 1. Phase boundary and synthesis method

- **Out of scope:** choosing a preferred candidate, W-035 comparison, scoring, Meets / Does not
  meet outcomes, and resolving PA / SA items.
- **Method:**
  1. Separate the mechanisms that the graph forces on every viable architecture (§2) from choices
     that still have a viable alternative.
  2. Build each candidate outward from one reinforcing core, following `requires`,
     `conflicts_with`, and `conditioned_by` edges. The cores are:
     - value state with a neutral model;
     - mutable working state with a PPTX-shaped model and a process boundary;
     - a transition log with a web-rendered form and page-held authority.
  3. Close every required non-axis family for each candidate. Where the candidate depends on a
     Product answer, record the assumption instead of hiding it.
  4. Re-check each candidate against every E-* edge, C-01 / C-02 / C-04, AP-P3-01, IDENT, and SA-01
     (§10).
- **Authority placement is a candidate choice.** Two candidates place the lifecycle authority in
  the local application process, and one places it in the page. Neither placement is assumed in
  the foundation.
- **ADB naming:** IDs are cited without the `ADB-` prefix, as in Phase 3. `DELIV-02a` is the
  DeckAgent-owned PPTX-shaped model, and `DEP-02c` is the confined, text-returning DEP-02 variant.
- **Graph correction exposed by Phase 4 (GC-P4-01, Phase-4-local):**
  - E-22 states `DELIV-04 requires STATE-03`. What DELIV-04 depends on is immutable version
    semantics (a version captured by identity cannot change), not STATE-03 specifically.
  - Phase 3 Axis A already notes that a log "behaves like values for export if its payloads are
    immutable", and MB-04 requires immutable payloads.
  - This file records the correction as `DELIV-04 requires immutable version semantics (STATE-03, or
    STATE-04 with immutable payloads)`. The frozen Phase 3 file is not edited. Only Candidate C
    relies on it (§6). If the correction is not accepted, Candidate C falls back to DELIV-05 with
    its actual semantics, a private snapshot at export request, without restructuring.
- **Discarded constructions:**
  - STATE-06 as the defining authority: C-13 makes it converge on STATE-05, so it would not be a
    distinct candidate.
  - DELIV-02b with STATE-03: E-26 puts that pair under pressure, and 02a gives the same
    presentation-native character without it.
  - A second value-state candidate that differs from Candidate A only on X-5: that would be a
    local variant, not a distinct architecture.

## 2. Common Architecture Foundation

These are included only when the graph leaves **no viable alternative**, or when the item is a
Gate-derived invariant that every candidate must meet. Choices that all three candidates make but
that still have a viable alternative are listed separately in §2.2.

### 2.1 Foundation

| # | Mechanism | ADB / MB / rule | Why every viable candidate needs it | Kind |
|---|---|---|---|---|
| F-01 | Stable, unique, never-reused identities for versions and operations, linking operations, versions, validation records, and export outcomes | IDENT (E-05) | All three state shapes, OP-01, EXPORT-01, VALID-08, and DELIV-04 require it; AP-STATE-01, AP-OP-01, AP-EXPORT-01, AP-SESSION-01 presuppose it | Gate-derived invariant (AC-17, AC-28, AC-29, AC-30) |
| F-02 | A single atomic transition domain (an atomic authority boundary) over the paired lifecycle state: deck versions, constraints, operation slot, and export records change together or not at all | DF-STATE-02 (E-01 … E-03, E-07, E-16, E-24, E-29) | Every state shape requires it; immutability does not supply atomicity (E-02) | Gate-derived invariant (AC-04, AC-06, AC-29). How the boundary is realized (STATE-05 single writer, or STATE-06 combined guarded record) is candidate-specific; all three candidates choose STATE-05 (§2.2) |
| F-03 | No side channel: AI work returns data, and only admission writes version state | E-17, SOURCE-03, MB-10 | OP-01 requires containment; DEP-02 observed is excluded | Gate-derived (AC-02, AC-28) |
| F-04 | Source content is labelled as data inside model inputs | SOURCE-01 (MB-09 both variants) | Both origin-assignment variants contain it; no viable option replaces it | Graph-derived shared layer (AC-02) |
| F-05 | A dependency boundary made of DeckAgent-owned ports | DEP-01 (base of DF-DEP-01; MB-10) | Every X-5 alternative sits behind DEP-01 ports | Graph-derived (AP-DEP-01, AC-08, AC-12) |
| F-06 | Declared-sink discipline for user content | DATA-01 (base of DF-DATA-01) | Only base option; each candidate's sinks differ, but the discipline does not | Gate-derived (AC-11) |
| F-07 | Pre-admission validation inside the operation lifetime; validation success, admission, and `done` form one logical success boundary; a stop wins until that boundary | C-02, E-19, MB-01 | The only coherent placement (Axis C); validation after `done` is incoherent | Gate-derived (AC-06, AC-28, AC-20) |
| F-08 | The refinement commit boundary is atomic with claiming the single-operation slot; pre-flight changes nothing | C-01, E-16, MB-05 | Otherwise two pre-flights could both commit | Gate-derived (AC-29, AC-04; BR-014) |
| F-09 | Output validation before any file is released (quarantine, check, release) | VALID-05 (only base of DF-VALID-02; E-28) | No other base exists in the family | Gate-derived (AC-09, AC-10) |
| F-10 | Export outcome records keyed by (version identity, format) | EXPORT-01 (EXPORT-02 excluded; E-33) | Only viable option | Gate-derived (AC-30, AC-29) |
| F-11 | Export-triggered promotion targets the exported version V and is checked against V's current lifecycle state; it never acts on another version | C-04 invariant, E-29 | Holds under every SA-P3-03 answer | Gate-derived (AC-29; BR-010 rule 3c) |
| F-12 | Origin labels on every content element | PROV-01 (base of DF-PROV-01; MB-09) | Both origin-assignment variants need it; PROV-02 is only conditional on it; PROV-04 is excluded | Graph-derived (AC-03, AC-16) |
| F-13 | Client-view consistency | AP-P3-01 (E-34, E-37) | Every candidate must meet its four invariants. *Where* authority lives is candidate-specific | Phase-3-local invariant (BR-010, BR-014, R-045) |

Excluded everywhere (negative evidence or excluded sub-variants): STATE-01, REQ-03, OP-08 as
enforcement, PROV-04 for content origin, EXPORT-02, SESSION-03, DELIV-03 screenshot variant, DEP-02
observed variant.

### 2.2 Coincident choices (not foundation)

All three candidates make these choices, but a viable alternative remains. They are therefore
recorded per candidate, not as foundation.

| Family | Coincident choice | Remaining viable alternative | Why all three chose it |
|---|---|---|---|
| DF-STATE-02 | STATE-05 (a single writer realizing the F-02 atomic boundary) | STATE-06 with a combined guarded record | C-13: STATE-06 converges on STATE-05 once slot, export records, and constraints join the scope |
| DF-EXPORT-02 | EXPORT-05 | EXPORT-03, EXPORT-04 (conditional on PA-01) | Keeps PA-01 open without restructuring (E-32) |
| DF-ROLE-01 | ROLE-01 | ROLE-02 | Low-cost and local; not candidate-defining (Phase 3 §9) |
| DF-SESSION-02 | SESSION-04 | SESSION-05 | One discardable scope matches each candidate's authority placement; SESSION-05 would not change any candidate's character |

## 3. Candidate construction matrix

| Axis | Candidate A — Value-oriented neutral-model architecture | Candidate B — Presentation-native serialized architecture with worker isolation | Candidate C — Render-first transition-log architecture with page-held authority |
|---|---|---|---|
| **X-1** State shape | Immutable version values + authoritative references (STATE-03, MB-02) | Mutable accepted / pending slots + isolated candidate areas (STATE-02, MB-03) | Transition log with immutable payloads (STATE-04, MB-04) |
| **X-2** Coordination | Guarded atomic transitions (MB-05 G: OP-06, OP-04) | Serialized command authority (MB-05 S: OP-07, OP-05) | Guarded conditional log appends (MB-05 G: OP-06, OP-04) |
| **X-3** Content form | Format-neutral deck model (DELIV-01) | DeckAgent-owned PPTX-shaped model (DELIV-02a) | Web-rendered form, native PPTX conversion (DELIV-03 native) |
| **X-4** Geometry / validation | Pre-display, computed geometry (MB-08 P: VALID-02, OBS-01) | Delivery-time geometry evidence (MB-08 D: VALID-01, OBS-03, VALID-06, OBS-05) | Pre-display, render-then-measure (MB-08 P: VALID-02, OBS-02) |
| **X-5** Runtime boundary | In-process ports (DEP-01) | Ports + worker process (DEP-01 + DEP-03) | Ports + confined external agent runtime (DEP-01 + DEP-02c) |
| **X-6** Origin assignment | By construction (MB-09 C: PROV-05, SOURCE-02) | Model-declared, verified (MB-09 M: PROV-06) | Model-declared, verified (MB-09 M: PROV-06) |
| *Authority location* (not an axis) | Local application process that serves the page | Local application process; AI and render work in a separate worker process | The page (one authority per page instance); the local host process is stateless with respect to the lifecycle |

---

## 4. Candidate A — Value-oriented neutral-model architecture

### Architectural character

- Every version is an immutable value of a DeckAgent-owned, format-neutral deck model. The
  authority holds only references (`accepted`, `pending`) and the paired constraint sets.
- All version-changing actions are guarded compare-and-set transitions on those references.
  Nothing needs to be copied, because nothing is mutated.
- Geometry is computed by the product from the model before display, so the admission gate has
  geometry without rendering.
- Source content is pre-extracted into addressable items; "source" origin is assigned only by the
  system placing those items.
- One process holds the authority and calls AI and other dependencies through in-process ports.

### Candidate-defining axes

| Axis | Choice | ADB / MB |
|---|---|---|
| X-1 | Immutable version values + authoritative references | STATE-03 · MB-02 |
| X-2 | Guarded atomic transitions | STATE-05, OP-06, OP-04, REQ-01 · MB-05 G |
| X-3 | Format-neutral deck model; independent renderer and writers | DELIV-01 |
| X-4 | Pre-display validation with computed geometry | VALID-02, OBS-01, OBS-04 · MB-08 P |
| X-5 | In-process ports | DEP-01 · MB-10 |
| X-6 | Origin by construction | PROV-05, SOURCE-02, PROV-01 · MB-09 C |

### Decision bundle

| Decision family | Selected ADB(s) | Role / rationale |
|---|---|---|
| DF-STATE-01 | STATE-03 | Defining. Needs a value-capable content form (E-27): met by DELIV-01 |
| DF-STATE-02 | STATE-05 | Single lifecycle authority; atomic scope = references + constraints + slot + export records (Common foundation F-02; coincident choice §2.2) |
| DF-INTENT-01 | INTENT-01 | Constraint set carried inside each version value; pairing comes for free from the value |
| DF-REQ-01 | REQ-01 | Non-mutating pre-flight, then one fused "commit + claim slot" transition (F-08, C-01) |
| DF-OP-01 | OP-01 (base); no complement | Explicit operation record with identity and terminal state. OP-03 not selected: stop correctness does not depend on physical cancellation |
| DF-OP-02 | OP-04 | First terminal transition wins (compare-and-set) |
| DF-OP-03 | OP-06 | Session-level operation slot held with the references |
| DF-VALID-01 | VALID-02 (base); no complement | Structural stage, then geometry stage from OBS-01 |
| DF-VALID-02 | VALID-05 (base); no complement | Common foundation F-09 |
| DF-VALID-03 | VALID-07 | Verdict travels with the validated result into admission |
| DF-OBS-01 | OBS-01 | Product-computed layout; geometry is part of what the gate reads |
| DF-OBS-02 | OBS-04 | Headless render path shared with preview (AC-18); available for a rendered check if PA-04 requires one |
| DF-PROV-01 | PROV-01 (base); no complement | Common foundation F-12 |
| DF-PROV-02 | PROV-05 | Defining. Requires SOURCE-02 (E-40); conditioned_by SA-P3-02 (E-41) |
| DF-DELIV-01 | DELIV-01 | Defining. conditioned_by AG-02 (E-51) |
| DF-DELIV-02 | DELIV-04 | Export reads the immutable value by identity. Viable because STATE-03 (E-22); STATE-03 makes DELIV-05 unnecessary (E-23) |
| DF-EXPORT-01 | EXPORT-01 | Common foundation F-10 |
| DF-EXPORT-02 | EXPORT-05 | Localized promotion policy; the PA-01 event is chosen later (coincident choice) |
| DF-SESSION-01 | SESSION-01 + SESSION-02 | Carry both until AG-09: SESSION-01 for the New-deck path and any synchronous query; SESSION-02 mirror for reload / close interception (E-34, E-35) |
| DF-SESSION-02 | SESSION-04 | One session scope in the authority process, discarded as a unit |
| DF-SOURCE-01 | SOURCE-01 + SOURCE-02 + SOURCE-03 | F-03, F-04; SOURCE-02 required by PROV-05 |
| DF-ROLE-01 | ROLE-01 | Explicit role attribute on admitted input (coincident choice) |
| DF-DATA-01 | DATA-01 (base) + DATA-02 | Memory-first session content; disk writes limited to one session workspace (output quarantine, render workspace). DATA-03 not selected |
| DF-DEP-01 | DEP-01 (base); no complement | In-process adapters behind ports |

### Mechanism bundles used

- **MB-01** Admission guard core — OP-01 + OP-04 + VALID-02 + VALID-07.
- **MB-02** Value-based lifecycle — STATE-03, STATE-05, INTENT-01, DELIV-04, EXPORT-01.
- **MB-05 variant G** — REQ-01, OP-06, STATE-05, OP-04.
- **MB-06** — VALID-05, EXPORT-05, EXPORT-01, STATE-05, DELIV-04.
- **MB-07** — EXPORT-01, SESSION-01 + SESSION-02, SESSION-04.
- **MB-08 variant P** — VALID-02, OBS-01, OBS-04. Local adaptation: geometry comes from OBS-01,
  and OBS-04 is on the admission path only if PA-04 requires a rendered-image check.
- **MB-09 variant C** — SOURCE-02, PROV-05, PROV-01, SOURCE-01, SOURCE-03.
- **MB-10** — DEP-01, OP-01, SOURCE-03, DATA-01; no DEP-03 or DEP-02c.

### End-to-end architecture flow

1. **Source admission.** Input is admitted with an explicit role (ROLE-01). Source files are
   extracted into addressable source items (SOURCE-02) held in the session scope.
2. **Generation.** A generate action claims the operation slot (OP-06) and creates an operation
   record (OP-01). The AI port receives labelled source items as data (SOURCE-01). The AI returns
   a structure that references source items and adds AI content; the system places source items
   and assigns origin (PROV-05, PROV-01). The result is a candidate value, not yet a version.
3. **Validation.** Inside the operation lifetime: structural checks, then layout computed by the
   product (OBS-01) and geometry checks (VALID-02). The verdict travels with the result (VALID-07).
4. **Admission / version creation.** One guarded transition: operation still `running` and
   identity current → set `pending` to the new value, mark the operation `done`, release the slot
   (OP-04). This is the logical success boundary (C-02).
5. **Preview.** The page renders the `pending` value (or `accepted`, if no pending) through the
   shared render path (OBS-04). The page receives the value's identity with it.
6. **Refinement pre-flight / commit boundary.** Pre-flight reads state and changes nothing (REQ-01).
   The commit is one guarded transition: slot free → promote `pending` to `accepted`, apply the
   new constraints, claim the slot, start the operation (C-01). The accepted value is the recovery
   baseline.
7. **Stop / failure.** Stop is a guarded terminal transition on the operation record. If it wins,
   any later result finds the operation terminal and is discarded. No version changes.
8. **Keep / reject.** Each carries the pending identity it was issued against. Keep: `pending` →
   `accepted`. Reject: clear `pending`. Both are refused if the identity is no longer pending.
9. **Export.** The export captures the value by identity (DELIV-04). Writers produce PPTX or PDF
   into quarantine (VALID-05), validate, then release.
10. **Export promotion.** EXPORT-05 calls one guarded transition at the chosen post-production
    event: promote V only if V is still `pending` (C-04). The outcome record (V, format) is
    written (EXPORT-01).
11. **Session-ending action.** The authority evaluates "would lose undownloaded work" from
    EXPORT-01 records (SESSION-01). For page reload / close, the page reads its mirror (SESSION-02),
    which is refreshed after every completed transition. On session end, the session scope is
    discarded as a unit (SESSION-04).

### Authority and state ownership

| State | Authoritative holder | Representation |
|---|---|---|
| Session state | The lifecycle authority inside the local application process | One session scope (SESSION-04) |
| Accepted / pending | The authority | Two references to immutable version values |
| Operation state | The authority | Operation record (identity, status, terminal cause) + slot |
| Constraint state | Inside each version value | INTENT-01; the next request's constraints join the value at commit |
| Export outcome state | The authority | EXPORT-01 records keyed by (V, format) |
| Client-view state | The page | Mirrored: displayed version identity, running indicator, session-loss mirror (SESSION-02). Never consulted to decide a transition |

**AP-P3-01 in this candidate:**
- Actions from any view are evaluated by the authority against current references (compare-and-set
  on identity), so stale views cannot cause invalid transitions.
- BR-014 holds across views because there is one slot per session in the authority.
- The session-loss mirror is pushed after every completed transition and export; the New-deck path
  queries the authority directly.
- Client-reported events (a download signal, if PA-01 needs one) enter as inputs to a guarded
  transition.

### Version and operation lifecycle

```
Version references (per session):  accepted ∈ {none, V}   pending ∈ {none, V'}

First generation:  (none,none) --generate: claim slot--> op running
                   op running --[validated ∧ op current] success boundary--> (none, V1), op done
Refinement:        (A, P) --pre-flight (no change)--> (A, P)
                   (A, P) --commit: promote P, apply constraints, claim slot--> (P, none), op running
                   op running --success boundary--> (P, V2), op done
Stop / failure / validation failure:
                   op running --stop | error | invalid--> op stopped | error; references unchanged
                   (baseline = accepted as left by the commit)
Keep:              (A, P) --keep(P)--> (P, none)          [refused if P no longer pending]
Reject:            (A, P) --reject(P)--> (A, none)        [refused if P no longer pending]
Export promotion:  (A, P) --policy event for export of P, P still pending--> (P, none)
                   export of P after P left pending --> no promotion (C-04b branch, if allowed)
Operation:         running --success boundary--> done | --stop--> stopped | --failure--> error
                   (+ waiting-for-input, only under the SA-01 "pause" answer)
```

### Representation and artifact path

- **Deck content form:** DeckAgent-owned format-neutral model (DELIV-01).
- **State representation:** immutable values referenced by the authority; separate from the model.
- **Rendered form:** a web render of the model, produced by the shared headless render path and by
  the page (OBS-04).
- **PPTX path:** model → DeckAgent PPTX writer → quarantine → validation → release.
- **PDF path:** model → PDF writer (or print of the shared render) → quarantine → validation →
  release.
- **Preview path:** the page renders the model value it was sent.
- **Geometry source:** the product's own layout computation over the model (OBS-01), stored with
  the value.
- **Origin metadata:** a label on every model element, fixed at construction (PROV-01, PROV-05).

### Validation model

- **Stage 1 (structural):** schema, slide order, required fields, and origin labels present.
- **Stage 2 (geometry):** checks over computed layout (overflow, overlap, bounds) — HM checks
  selected under PA-04.
- **Optional stage 2b (rendered):** only if PA-04 requires a rendered-image check before display;
  it uses OBS-04 and depends on AG-01b.
- **Placement:** all stages sit inside the operation lifetime, before the success boundary.
- **Output validation:** VALID-05 on every produced file before release.
- **Stop:** a stop arriving during validation wins; the validated result is discarded (C-02). Any
  uninterruptible layout or render work finishes and is thrown away (C-03).
- **Conditional:** which checks run (PA-04); whether computed geometry is accurate enough (AG-01a);
  whether a rendered check is feasible (AG-01b).

### Failure / stop model

- **Late results:** rejected at admission because the operation record is terminal (OP-01, OP-04).
- **Recovery baseline:** the `accepted` reference as left by the commit boundary; `pending` is empty
  after a refinement commit.
- **State left by stop / failure:** references unchanged; operation terminal with cause (AC-20);
  slot released.
- **External work:** stop does not wait for AI calls to end. Outstanding calls may complete and are
  discarded (cost only, AG-03).
- **Isolation:** none at the process level. An adapter crash takes the authority process with it
  and ends the session (AC-23 trade-off).

### Source trust / provenance model

- **Mechanisms:** SOURCE-01 (labelled separation), SOURCE-02 (pre-extraction into items), SOURCE-03
  (AI output is data).
- **Assignment:** by construction (PROV-05). "Source" origin exists only on elements the system
  placed from source items; everything else the AI returns is labelled AI-added.
- **Across refinement:** labels are part of the value; a refinement that keeps an element keeps its
  label.
- **SA-P3-02 assumption:** rephrased source content is relabelled (or source items are not
  rephrased). Under the other answer (rephrased content keeps source origin), construction cannot
  express it, and this candidate must switch X-6 to Variant M (§4 reopen conditions).

### Delivery and session model

- **Stable export input:** the immutable value captured by identity (DELIV-04).
- **Output validation:** VALID-05.
- **Outcome record:** EXPORT-01, keyed (V, format).
- **Promotion policy:** EXPORT-05; the event is set by PA-01.
- **Session-loss evaluation:** in the authority (SESSION-01) plus a pushed mirror in the page
  (SESSION-02).
- **SA-P3-01:** accommodates every answer. Shared session: every view attaches to one scope.
  Separate sessions: one scope per view. Not allowed: the authority refuses a second attach.
- **SA-P3-03:** no assumption. Value capture keeps the export stable under either policy; if
  actions are allowed during an export, C-04b and C-05 apply.
- **Reload semantics (SA-P4-01, §8):** no assumption. The authority process can end the scope on
  the page's unload signal, or keep it for the reloaded view while the application runs.

### AP coverage

| AP | How the candidate addresses it | Relevant ADB / MB | Open condition |
|---|---|---|---|
| AP-FLOW-01 | Composition complete: every Core Flow step has an owner (flow steps 1–11) | all | Addressed with condition (PA-04, AG-02) |
| AP-SOURCE-01 | Labelled data, pre-extraction, no AI action authority | SOURCE-01/02/03 | Addressed structurally |
| AP-ROLE-01 | Explicit role attribute | ROLE-01 | Addressed structurally |
| AP-DATA-01 | Declared sinks; memory-first; one session workspace | DATA-01, DATA-02 | Requires evidence (AG-05) |
| AP-INTENT-01 | Constraints inside each value; applied at commit | INTENT-01, MB-02 | Open Product semantics (PA-06, SA-04) |
| AP-REQ-01 | Non-mutating pre-flight; fused commit | REQ-01, MB-05 G | Addressed structurally |
| AP-STATE-01 | Value references under one authority | STATE-03, STATE-05, MB-02 | Addressed structurally |
| AP-OP-01 | Operation record + CAS terminal; success boundary | OP-01, OP-04, MB-01 | Open Product semantics (SA-01) |
| AP-OP-02 | One slot in the authority, fused with the commit | OP-06, MB-05 G | Open Product semantics (SA-02, SA-03) |
| AP-VALID-01 | Two-stage gate with computed geometry; output validation | VALID-02, VALID-05, VALID-07, MB-08 P | Requires evidence (AG-01a); PA-04 |
| AP-PROV-01 | Labels by construction, carried in values | PROV-01, PROV-05, MB-09 C | Open Product semantics (SA-P3-02) |
| AP-OBS-01 | Computed geometry; shared render; format capability model for known losses (NPC-12) | OBS-01, OBS-04, DELIV-01 | Requires evidence (AG-02) |
| AP-DELIV-01 | Preview and exports read the same value by identity | DELIV-01, DELIV-04 | Addressed structurally |
| AP-EXPORT-01 | Quarantine, outcome records, localized promotion | VALID-05, EXPORT-01, EXPORT-05, MB-06 | Addressed with condition (PA-01, AG-06) |
| AP-SESSION-01 | Authority records + page mirror | SESSION-01, SESSION-02, MB-07 | Requires evidence (AG-09); PA-02 |
| AP-DEP-01 | In-process ports; failure → operation error | DEP-01, MB-10 | Addressed structurally |
| AP-P3-01 | Guarded identity checks; one slot; pushed mirror; events as inputs | OP-06, OP-04, SESSION-02 | Open Product semantics (SA-P3-01), no restructuring |

### Product ambiguities carried

| ID | Candidate assumption | Accommodates multiple answers? | Would another answer restructure it? |
|---|---|---|---|
| SA-P3-02 | Rephrased source content is relabelled, or not rephrased | No | **Yes** — X-6 moves to Variant M (PROV-06) |
| PA-04 | None | Yes — the geometry stage exists; a rendered stage can be added | No (adds a renderer to the admission path; NPC-07 cost) |
| PA-01 | None | Yes (EXPORT-05) | No |
| PA-02 | None | Yes (EXPORT-01) | No |
| PA-06 | None | Partly: per-version constraint sets; ledger-like lifetimes need derivation | No |
| PA-11 | None | Yes — scope discard covers deletion | No |
| SA-01 | None | Yes — `waiting-for-input` state in the operation record | No |
| SA-02, SA-03, SA-P3-03 | None | Yes — value capture keeps any preview / export stable | No |
| SA-P3-01 | None | Yes | No |
| SA-P4-01 | None | Yes — the host-held scope can end on unload, or the reloaded view can reattach while the application runs | No |
| SA-04 | None | Yes — request intent is held outside the value until admission | No |
| SA-05 | None | Yes — preview failure is independent of the admitted value | No |
| PA-03, PA-05, PA-10, PA-12, PA-13 | None | Yes | No |

### Evidence gaps / spikes

| Gap | Classification | What would rule the candidate out | Branch that remains |
|---|---|---|---|
| AG-01a | Candidate viability; before W-035 | Computed geometry cannot match real outputs closely enough for the selected checks | Geometry from OBS-02 via the OBS-04 render (render-then-measure). Same state shape; the admission path gains a renderer |
| AG-02 | Candidate viability; before W-035 | PPTX writer cannot produce native objects faithful to the model | Narrow the model to writer-expressible features; otherwise X-3 changes (restructuring) |
| AG-01b | Confidence only, unless PA-04 requires rendered checks | Rendered check too slow on the admission path | Keep rendered checks out of the gate (requires the PA-04 answer to allow it) |
| AG-06 | Required before W-035 only if PA-01 picks user receipt | Receipt event not observable | EXPORT-05 uses "valid file produced" (requires PA-01 to allow it) |
| AG-09 | Required before W-035 | — | Carry SESSION-01 + SESSION-02 |
| AG-05 | Confidence (W-034 declaration) | — | — |
| AG-03 | Confidence only | — | — |
| RG-04 | Prototype before W-035 if Variant C is relied on | By-construction placement cannot express D-025 refinements | Variant M |
| RG-02, RG-03, RG-08 | Confidence only | — | — |

### Benefits

- Rollback, reject, and export stability all follow from value references; no copy step exists.
- The admission gate has geometry without depending on a renderer.
- One content form is the single source for preview, PPTX, and PDF (AC-26 extensibility).
- Origin cannot be mis-declared by the model, because only the system assigns "source".
- One process and one authority keep transition reasoning local.

### Trade-offs

- **AC-21:** DeckAgent owns a layout computation and three output paths (renderer, PPTX writer,
  PDF writer).
- **AC-22:** few runtime dependencies; the cost is in owned code instead.
- **AC-23:** no process isolation; a failing adapter or layout crash ends the session.
- **AC-24:** the content model and value semantics are low-reversibility.
- **AC-25:** deterministic layout makes the gate testable without renders; agreement between
  computed and real geometry must be tested separately (NPC-10).
- **AC-26:** new output targets add writers over one model.
- **AC-27:** translation acts on model text; layout re-computation is required.
- **Retention:** every kept value stays in memory for the session (AP-DATA-01 footprint).

### Risks / failure modes

- Computed layout drifts from PowerPoint and PDF text metrics, so decks that pass the gate still
  overflow in real outputs (AG-01a × AG-02 × NPC-10).
- By-construction origin blocks legitimate tone or audience refinements if SA-P3-02 keeps source
  origin for rephrased content.
- A format capability gap in the neutral model surfaces only at export (NPC-12).
- An in-process AI adapter that blocks or crashes stalls the authority.

### Complexity

- **Implementation:** high on owned layout and writers; low to moderate on coordination.
- **Runtime / operation:** low — one process.
- **Maintenance:** moderate — the model, layout engine, and writers evolve together.

### Reversibility

- **Low:** value state shape (STATE-03); format-neutral model (DELIV-01); origin by construction
  (PROV-05), because it shapes source ingestion and the AI contract.
- **Medium:** geometry source (OBS-01 → OBS-02 switch).
- **High (local):** EXPORT-05 event, SESSION-01 / SESSION-02 split, adding DEP-03 later, ROLE-01.

### Candidate-specific reopen conditions

- **Invalid:** AG-02 shows the neutral model cannot reach native PPTX without losses that break
  AC-05 / R-028 for the Core Flow.
- **Materially less attractive:** AG-01a fails (geometry must come from renders, removing the
  renderer-free gate); PA-04 requires rendered checks before display.
- **Require restructuring:** SA-P3-02 answered "rephrased content keeps source origin" (X-6
  change); AG-02 forcing a PPTX-shaped content form (X-3 change).

---

## 5. Candidate B — Presentation-native serialized architecture with worker isolation

### Architectural character

- The deck content form is a DeckAgent-owned PPTX-shaped model. PPTX is the native output, and the
  preview and PDF are derived from the PPTX form.
- Accepted and pending are mutable slots. Each operation works in its own isolated candidate area,
  and admission copies the candidate into the pending slot atomically.
- All state-changing user actions and all operation events pass through one serialized command
  channel. Ordering, not compare-and-set, resolves every race.
- AI generation and rendering run in a separate worker process that holds no lifecycle state. Stop
  can terminate it.
- Geometry evidence comes from produced output files at delivery time. The pre-display gate is
  content-only. This is valid only under the PA-04 condition (E-15).

### Candidate-defining axes

| Axis | Choice | ADB / MB |
|---|---|---|
| X-1 | Mutable slots + isolated candidate areas | STATE-02 · MB-03 |
| X-2 | Serialized command authority | STATE-05, OP-07, OP-05, REQ-01 · MB-05 S |
| X-3 | DeckAgent-owned PPTX-shaped model | DELIV-02a |
| X-4 | Delivery-time geometry evidence | VALID-01, OBS-03, VALID-06, OBS-05, VALID-03 · MB-08 D |
| X-5 | Ports + worker process | DEP-01 + DEP-03 · MB-10 |
| X-6 | Model-declared origin, verified | PROV-06, PROV-01 · MB-09 M |

### Decision bundle

| Decision family | Selected ADB(s) | Role / rationale |
|---|---|---|
| DF-STATE-01 | STATE-02 | Defining. Requires DF-STATE-02 for an atomic copy-in (E-01) |
| DF-STATE-02 | STATE-05 | The command-processing authority is the single writer (F-02; coincident choice §2.2) |
| DF-INTENT-01 | INTENT-01 | Constraint set stored with each slot; copied with the candidate at admission |
| DF-REQ-01 | REQ-01 | Pre-flight changes nothing; "commit" is one command that promotes, applies constraints, and starts the operation (C-01) |
| DF-OP-01 | OP-02 (base) + OP-03 | Per-operation coordinator bounds where results can land; OP-03 = terminate worker work on stop (cost control). OP-03 requires OP-02 (E-21) |
| DF-OP-02 | OP-05 | All operation events are ordered in the channel; required by OP-02 (E-18); E-55 pressure satisfied |
| DF-OP-03 | OP-07 | Exclusivity by the channel: a start command is refused while an operation is live |
| DF-VALID-01 | VALID-01 (base) + VALID-03 | Content-only admission gate (structural, constraints, origin as selected by PA-04); non-gating post-admission rendered evaluation (E-47 requires OBS-05: met) |
| DF-VALID-02 | VALID-05 (base) + VALID-06 | Quarantine plus round-trip re-read of the file; supplies the geometry evidence (E-46) |
| DF-VALID-03 | VALID-07 | Verdict travels with the result event into the channel |
| DF-OBS-01 | OBS-03 | Conditional: conditioned_by PA-04 — no pre-display HM-1 / HM-4 check (E-15). Geometry read from produced files |
| DF-OBS-02 | OBS-05 | Render produced output files into images (preview and review) |
| DF-PROV-01 | PROV-01 (base); no complement | Common foundation F-12; labels are DeckAgent-owned fields of the model (E-43 met by 02a) |
| DF-PROV-02 | PROV-06 | Model declares origin per element; the system verifies declared source spans against extracted source. Structured-output contract (E-44) |
| DF-DELIV-01 | DELIV-02a | Defining. conditioned_by AG-01b and AG-02 (E-52). 02b excluded here to avoid E-26 pressure on STATE-02 |
| DF-DELIV-02 | DELIV-05 | Copy the version at export request; atomic relative to transitions because the copy is a command in the channel (E-24) |
| DF-EXPORT-01 | EXPORT-01 | Common foundation F-10 |
| DF-EXPORT-02 | EXPORT-05 | Localized promotion policy (coincident choice) |
| DF-SESSION-01 | SESSION-01 + SESSION-02 | Carry both until AG-09 (E-34, E-35) |
| DF-SESSION-02 | SESSION-04 | One session scope in the authority process; the worker's workspace belongs to it |
| DF-SOURCE-01 | SOURCE-01 + SOURCE-02 + SOURCE-03 | F-03, F-04; SOURCE-02 gives addressable source items that PROV-06 verification checks against |
| DF-ROLE-01 | ROLE-01 | Coincident choice |
| DF-DATA-01 | DATA-01 (base) + DATA-02 | Declared sinks include the worker channel (E-56) and the render workspace. DATA-03 not selected |
| DF-DEP-01 | DEP-01 (base) + DEP-03 | Worker holds no state; the authority stays outside it (E-39) |

### Mechanism bundles used

- **MB-01** — OP-02 + OP-05 + VALID-01 + VALID-07. Local adaptation: the success boundary is the
  channel processing a validated result event while its coordinator is still attached.
- **MB-03** Mutable-slot lifecycle — STATE-02, STATE-05, INTENT-01, DELIV-05, EXPORT-01.
- **MB-05 variant S** — REQ-01, OP-07, OP-05, STATE-05.
- **MB-06** — VALID-05 + VALID-06, EXPORT-05, EXPORT-01, STATE-05, DELIV-05.
- **MB-07** — EXPORT-01, SESSION-01 + SESSION-02, SESSION-04.
- **MB-08 variant D** — VALID-01, OBS-03, VALID-06, OBS-05, VALID-03.
- **MB-09 variant M** — PROV-06, PROV-01, SOURCE-01, SOURCE-03, SOURCE-02 (optional in the bundle;
  selected here).
- **MB-10** — DEP-01 + DEP-03, OP-02 (in place of OP-01), SOURCE-03, DATA-01. Local adaptation: the
  worker boundary is the enforcement point for "no side channel".

### End-to-end architecture flow

1. **Source admission.** Input is admitted with an explicit role (ROLE-01). Source is extracted into
   addressable items (SOURCE-02), held in the session scope.
2. **Generation.** A `generate` command enters the channel. If no operation is live, the channel
   creates a coordinator (OP-02) with a fresh candidate area (STATE-02) and dispatches work to the
   worker (DEP-03). The worker calls the AI through ports with labelled source (SOURCE-01) and
   returns a PPTX-shaped model with declared origin (PROV-06).
3. **Validation.** Inside the operation lifetime, before the result is admitted: structural,
   constraint, and origin checks (VALID-01); declared source spans verified against source items.
   The verdict travels with the result event (VALID-07).
4. **Admission / version creation.** The channel processes the validated result event. If the
   coordinator is still attached and no stop was ordered before it, the candidate is copied into
   the `pending` slot, the operation is marked `done`, and the coordinator is released. This is the
   logical success boundary (C-02).
5. **Preview.** The pending model is written to PPTX in the worker and rendered to images (OBS-05).
   A non-gating evaluation reviews those images (VALID-03) and reports findings.
6. **Refinement pre-flight / commit boundary.** Pre-flight reads state (REQ-01). The `commit`
   command, processed in order: promote `pending` to `accepted`, apply the new constraints, create
   the coordinator (claiming exclusivity) (C-01). Accepted is the recovery baseline.
7. **Stop / failure.** A `stop` command, processed in order, detaches the coordinator and marks the
   operation `stopped`. OP-03 then terminates the worker's in-flight work. Any later result event
   for that operation has no attached coordinator and is dropped.
8. **Keep / reject.** Commands carrying the pending identity. Processed in order; refused if that
   identity is no longer pending.
9. **Export.** An `export` command copies the version into an export area (DELIV-05). The worker
   writes PPTX (native) and PDF (via converter from PPTX), into quarantine. VALID-05 checks
   validity; VALID-06 re-reads the file and extracts geometry (OBS-03) for delivery-time geometry
   checks.
10. **Export promotion.** EXPORT-05 enqueues a `promote-on-export(V)` command at the chosen event.
    Processed in order: promote V only if V is still pending (C-04). The outcome record (V, format)
    is written.
11. **Session-ending action.** The authority evaluates undownloaded work from EXPORT-01 records
    (SESSION-01). The page decides reload / close from its mirror (SESSION-02), pushed after every
    processed command. On session end, the scope, candidate areas, and worker workspace are
    discarded (SESSION-04).

### Authority and state ownership

| State | Authoritative holder | Representation |
|---|---|---|
| Session state | The command-processing authority in the local application process | One session scope (SESSION-04) |
| Accepted / pending | The authority | Two mutable slots holding PPTX-shaped models |
| Operation state | The authority | Coordinator presence + operation status; worker holds only transient work |
| Constraint state | The authority, inside each slot | INTENT-01 |
| Export outcome state | The authority | EXPORT-01 records |
| Client-view state | The page | Mirrored: displayed version identity, running indicator, session-loss mirror. Commands only |
| Worker state | The worker process | None authoritative; candidate work and render files are transient |

**AP-P3-01 in this candidate:**
- Every action from any view is a command in one ordered channel and is evaluated against state at
  its turn, so a stale observation cannot cause an invalid transition.
- BR-014 across views holds because exclusivity is decided by the one channel per session.
- Session-loss inputs are pushed to the page after each processed command.
- Client-reported events are commands like any other.

### Version and operation lifecycle

```
Slots (per session):  accepted ∈ {empty, deck}   pending ∈ {empty, deck}   candidate area per operation

First generation:  cmd generate --> coordinator created, op running
                   result event [validated ∧ coordinator attached] --> copy candidate → pending, op done
Refinement:        pre-flight (read only)
                   cmd commit --> accepted := pending, pending := empty, constraints applied, op running
                   result event [validated ∧ attached] --> pending := candidate, op done
Stop:              cmd stop --> coordinator detached, op stopped; worker work terminated (OP-03)
Failure / validation failure:
                   error event | invalid verdict --> op error; slots unchanged; candidate area dropped
Keep(P) / Reject(P): processed in order; refused if P is no longer the pending identity
Export promotion:  cmd promote-on-export(V) --> if V is pending: accepted := V, pending := empty
                   if V left pending during the export --> no-op (C-04b branch, if allowed)
Operation:         running --> done | stopped | error   (+ waiting-for-input under SA-01 "pause")
```

### Representation and artifact path

- **Deck content form:** a DeckAgent-owned PPTX-shaped model (slides, shapes, positions, text
  runs, origin fields) (DELIV-02a).
- **State representation:** mutable slots and candidate areas holding that model; separate from the
  model itself.
- **Rendered form:** images rendered from the produced PPTX (OBS-05).
- **PPTX path:** model → PPTX serializer (native objects) → quarantine → VALID-05 / VALID-06 →
  release.
- **PDF path:** PPTX → converter → PDF → quarantine → validation → release.
- **Preview path:** PPTX → images via the converter, after admission.
- **Geometry source:** shape positions are native in the model; text-fit geometry comes from
  produced files (OBS-03).
- **Origin metadata:** DeckAgent-owned origin fields on model elements, carried into the export as
  hidden metadata only if Product needs it (PA-12).

### Validation model

- **Admission gate (VALID-01):** structural checks, constraint checks (P2, if PA-04 selects them;
  E-10 met by INTENT-01), origin checks (P1, if selected; E-11 met by PROV-01), and verification of
  declared source spans.
- **Placement:** inside the operation lifetime, before the success boundary.
- **Post-admission, non-gating (VALID-03):** rendered-image review; findings are reported, never
  change state.
- **Delivery-time (VALID-05 + VALID-06):** file validity plus geometry from the produced file
  (overflow, bounds). A failure means no release and no promotion.
- **Stop:** a `stop` ordered before the result event wins (C-02); the worker may still finish and
  its output is dropped.
- **Conditional:** valid only if PA-04 does not require HM-1 / HM-4 before display (E-15). If it
  does, E-14 requires OBS-01 or OBS-02 on the admission path: restructuring to MB-08 P with a PPTX
  render before admission (AG-01b).

### Failure / stop model

- **Late results:** the stop or failure detaches the coordinator; the result event finds none and is
  dropped. Ordering in the channel decides a coinciding stop and completion (OP-05).
- **Recovery baseline:** the `accepted` slot as set by the commit; `pending` empty after a
  refinement commit.
- **State left:** slots unchanged; candidate area discarded; operation terminal with cause.
- **External work:** terminated with the worker's in-flight job (OP-03); cost exposure reduced
  (AG-03).
- **Isolation:** the worker process isolates AI and render crashes; a crash becomes an `error` event
  for the live operation.

### Source trust / provenance model

- **Mechanisms:** SOURCE-01, SOURCE-02, SOURCE-03.
- **Assignment:** model-declared, verified (PROV-06). The model marks each element's origin and
  cites source items; the system checks the citation and downgrades unverifiable "source" claims to
  AI-added.
- **Across refinement:** labels stay on elements in the slot; a refinement re-declares origin for
  changed elements, then verification runs again.
- **SA-P3-02:** no assumption. Verification can relabel rephrased content, or keep source origin
  when the meaning is verified.

### Delivery and session model

- **Stable export input:** a copy taken by a command, so no other command can interleave (DELIV-05).
- **Output validation:** VALID-05 + VALID-06.
- **Outcome record:** EXPORT-01.
- **Promotion policy:** EXPORT-05, as a command.
- **Session-loss evaluation:** authority (SESSION-01) plus pushed page mirror (SESSION-02).
- **SA-P3-01:** accommodates every answer (one channel per session; views are command sources).
- **SA-P3-03:** no assumption. The channel can refuse commands during an export (block policy) or
  process them in order (C-04b / C-05 apply).
- **Reload semantics (SA-P4-01, §8):** no assumption. As in Candidate A, the host-held session can
  end on unload, or the reloaded view can reattach while the application runs.

### AP coverage

| AP | How the candidate addresses it | Relevant ADB / MB | Open condition |
|---|---|---|---|
| AP-FLOW-01 | Composition complete: every Core Flow step is a command or event in one channel | all | Addressed with condition (PA-04, AG-01b, AG-02) |
| AP-SOURCE-01 | Labelled data, extraction, no action authority; worker has no state access | SOURCE-01/02/03, DEP-03 | Addressed structurally |
| AP-ROLE-01 | Explicit role attribute | ROLE-01 | Addressed structurally |
| AP-DATA-01 | Declared sinks incl. worker channel and render workspace | DATA-01, DATA-02 | Requires evidence (AG-05); PA-11 |
| AP-INTENT-01 | Constraints in slots; copied with candidate | INTENT-01, MB-03 | Open Product semantics (PA-06, SA-04) |
| AP-REQ-01 | Commit is one command | REQ-01, MB-05 S | Addressed structurally |
| AP-STATE-01 | Slots + atomic copy-in by the single writer | STATE-02, STATE-05, MB-03 | Addressed structurally |
| AP-OP-01 | Coordinator detachment + ordered events + worker termination | OP-02, OP-05, OP-03, MB-01 | Open Product semantics (SA-01) |
| AP-OP-02 | Channel refuses a second start | OP-07, MB-05 S | Open Product semantics (SA-02, SA-03) |
| AP-VALID-01 | Content-only gate; delivery-time geometry | VALID-01, VALID-05, VALID-06, MB-08 D | **Open Product semantics (PA-04)** — valid only under the E-15 condition |
| AP-PROV-01 | Declared, verified labels in owned fields | PROV-01, PROV-06, MB-09 M | Requires evidence (RG-04) |
| AP-OBS-01 | Output-derived geometry; rendered images of real files; native PPTX | OBS-03, OBS-05, DELIV-02a | Requires evidence (AG-01b, AG-02) |
| AP-DELIV-01 | Preview and exports come from the same slot copy | DELIV-02a, DELIV-05 | Addressed structurally |
| AP-EXPORT-01 | Quarantine + round trip; outcome records; promotion as a command | VALID-05, VALID-06, EXPORT-01, EXPORT-05, MB-06 | Addressed with condition (PA-01, AG-06) |
| AP-SESSION-01 | Authority records + page mirror | SESSION-01, SESSION-02, MB-07 | Requires evidence (AG-09); PA-02 |
| AP-DEP-01 | Ports + worker; crash → error event | DEP-01, DEP-03, MB-10 | Addressed structurally |
| AP-P3-01 | One ordered channel per session; pushed mirror; events as commands | OP-07, OP-05, SESSION-02 | Open Product semantics (SA-P3-01), no restructuring |

### Product ambiguities carried

| ID | Candidate assumption | Accommodates multiple answers? | Would another answer restructure it? |
|---|---|---|---|
| PA-04 | **Assumed:** no HM-1 / HM-4 check is required before display | No | **Yes** — X-4 moves to MB-08 P; a PPTX render or computed layout enters the admission path |
| SA-05 | None; the case arises more often here, because preview is produced after admission | Yes — a local policy | No |
| PA-01 | None | Yes (EXPORT-05) | No |
| PA-02 | None | Yes (EXPORT-01) | No |
| SA-P4-01 | None | Yes — the host-held scope can end on unload, or the reloaded view can reattach while the application runs | No |
| PA-03, PA-13 | None | Yes; verification uses the native PPTX | No |
| PA-05 | None | Yes — an export can become a stoppable command sequence | No |
| PA-06 | None | Partly (per-slot constraint sets) | No |
| PA-11 | None | Yes — scope discard includes the worker workspace | No |
| SA-01 | None | Yes — suspend / answer are channel events | No |
| SA-02, SA-03, SA-P3-03 | None | Yes — copies and ordering | No |
| SA-P3-01 | None | Yes | No |
| SA-P3-02 | None | Yes | No |
| SA-04 | None | Yes — the coordinator's request state is dropped or kept by policy | No |
| PA-10, PA-12 | None | Yes | No |

### Evidence gaps / spikes

| Gap | Classification | What would rule the candidate out | Branch that remains |
|---|---|---|---|
| AG-02 | Candidate viability; before W-035 | The PPTX → preview / PDF converter drifts from the PPTX too much (R-028, AC-05) | None within X-3 (restructuring) |
| AG-01b | Candidate viability; before W-035 | A PPTX render cannot supply preview images fast enough for AC-18 | None within X-3 (restructuring) |
| AG-01a | Only if PA-04 requires pre-display geometry | — | — |
| AG-06 | Before W-035 only if PA-01 picks user receipt | Receipt not observable | "Valid file produced" event (if PA-01 allows) |
| AG-09 | Before W-035 | — | Carry SESSION-01 + SESSION-02 |
| AG-03 | Confidence only | — | — |
| AG-05 | Confidence (W-034 declaration) | — | — |
| RG-04 | Prototype before W-035 if Variant M is relied on | Verification cannot distinguish rephrased from new content | Variant C (PROV-05) under the matching SA-P3-02 answer |
| RG-02, RG-03, RG-08 | Confidence only | — | — |

### Benefits

- The content form is already PPTX-shaped, which reduces translation between representations.
  A serializer and converter fidelity boundary still exists (model → PPTX, PPTX → preview / PDF),
  which is why AG-02 remains a viability spike.
- Geometry evidence comes from real output files (AC-14, AC-19).
- One ordered channel removes race reasoning; every race is a question of order.
- Crash isolation and kill-on-stop through the worker boundary.
- Origin verification tolerates either SA-P3-02 answer.

### Trade-offs

- **AC-21:** a message protocol, a worker lifecycle, and channel semantics to learn and build.
- **AC-22:** a PPTX → image / PDF converter is a required runtime dependency on the preview path.
- **AC-23:** worker failure is contained; channel stall blocks all actions in the session.
- **AC-24:** the PPTX-shaped model and slot copy semantics are low-reversibility.
- **AC-25:** geometry tests need real files; the admission gate is testable without renders.
- **AC-26:** a new output target must be derived from PPTX or added as a second writer.
- **AC-27:** translation changes text inside native shapes; text fit is only known after output.
- Slot copies cost memory and time per admission and export (C-09 applies only weakly to 02a).

### Risks / failure modes

- A deck admitted as pending overflows in PPTX and is only caught at export; the user has already
  seen and kept it (PA-04 × MB-08 D).
- Preview fails to render a validated pending version (SA-05) because rendering happens after
  admission through a converter.
- Channel ordering across the process boundary: a worker event racing a `stop` must be enqueued,
  never applied directly (E-39, E-55).
- An orphaned worker keeps consuming resources after a stop.

### Complexity

- **Implementation:** moderate to high — channel, coordinator, worker protocol, converter.
- **Runtime / operation:** moderate — two processes plus a converter.
- **Maintenance:** moderate — the model follows the PPTX object model, and the converter is an
  external moving part.

### Reversibility

- **Low:** PPTX-shaped content form (DELIV-02a); mutable slot state (STATE-02); serialized channel as
  the coordination backbone.
- **Medium:** worker process boundary (DEP-03 can collapse into DEP-01 in-process).
- **High (local):** EXPORT-05 event, SESSION-01 / SESSION-02, VALID-03 lane, provenance verification
  rules.

### Candidate-specific reopen conditions

- **Invalid:** AG-02 or AG-01b shows the PPTX → preview / PDF path cannot meet R-028 / AC-18.
- **Require restructuring:** PA-04 requires HM-1 or HM-4 before display (X-4 change; E-14, E-15).
- **Materially less attractive:** SA-05 answered so that a pending version whose preview fails
  cannot be kept or exported, since preview failure after admission is structural here; or C-002
  rules out the multi-process runtime.

---

## 6. Candidate C — Render-first transition-log architecture with page-held authority

### Architectural character

- The lifecycle authority lives in the page. Each page instance holds one session. The local host
  process serves the page and exposes stateless ports (source parsing, AI runtime invocation). It
  holds no lifecycle state.
- Authoritative state is an append-only transition log with immutable payloads. Versions,
  constraint state (a ledger), operation status, and export outcomes are all derived from it.
- The deck content form is web-rendered (HTML / CSS). The preview is the page's own render; PDF is
  printed from it; PPTX is converted to native objects.
- Geometry comes from rendering the candidate and measuring it before admission. The same render
  engine serves preview and validation.
- Generation runs in a confined, text-returning external agent runtime behind ports. It returns
  deck text with declared origin, which the page verifies.

### Candidate-defining axes

| Axis | Choice | ADB / MB |
|---|---|---|
| X-1 | Transition log with immutable payloads | STATE-04 · MB-04 |
| X-2 | Guarded conditional log appends | STATE-05, OP-06, OP-04, REQ-02 · MB-05 G |
| X-3 | Web-rendered form with native PPTX conversion | DELIV-03 (native variant) |
| X-4 | Pre-display validation, render-then-measure | VALID-02, OBS-02, OBS-04 · MB-08 P |
| X-5 | Ports + confined external agent runtime | DEP-01 + DEP-02c · MB-10 |
| X-6 | Model-declared origin, verified | PROV-06, PROV-01 · MB-09 M |

### Decision bundle

| Decision family | Selected ADB(s) | Role / rationale |
|---|---|---|
| DF-STATE-01 | STATE-04 | Defining. Log appends are guarded (E-03); payloads are immutable (MB-04 requirement) |
| DF-STATE-02 | STATE-05 | The page-held log owner is the only writer (F-02; coincident choice §2.2) |
| DF-INTENT-01 | INTENT-02 | Attributed constraint ledger as log events; versions reference a ledger position. The atomic scope includes the ledger position (E-07) |
| DF-REQ-01 | REQ-02 | The operation's first step is one conditional append "commit + operation started" (C-01). Converges with REQ-01; chosen because the log records it as one event |
| DF-OP-01 | OP-01 (base) + OP-03 | Operation record as log events with identity and terminal state; OP-03 = terminate the runtime invocation on stop (cost control). E-17 containment met by DEP-01 + DEP-02c |
| DF-OP-02 | OP-04 | The first terminal event appended wins; a later terminal append for the same operation is refused. Requires OP-01 (E-20) |
| DF-OP-03 | OP-06 | The slot is log-derived ("an operation is live"); claimed by the conditional commit / start append |
| DF-VALID-01 | VALID-02 (base); no complement | Structural stage, then geometry measured from the rendered candidate |
| DF-VALID-02 | VALID-05 (base) + VALID-06 | Quarantine plus round-trip re-read of the converted PPTX, compared against the measured render (E-46 met by OBS-02) |
| DF-VALID-03 | VALID-07 + VALID-08 | Verdict travels with the result; validation outcomes are also log events (native to MB-04) |
| DF-OBS-01 | OBS-02 | Render the candidate, then measure it. E-50 pressure (renderer on the admission path) accepted, conditioned_by AG-01b |
| DF-OBS-02 | OBS-04 | One render path shared by preview and validation |
| DF-PROV-01 | PROV-01 (base); no complement | Origin as element attributes in the web form (F-12) |
| DF-PROV-02 | PROV-06 | The runtime declares origin per element; the page verifies against source text. Structured-output contract (E-44) |
| DF-DELIV-01 | DELIV-03 (native) | Defining. conditioned_by AG-02 (E-51). The screenshot variant is excluded |
| DF-DELIV-02 | DELIV-04 (conditioned by GC-P4-01) | Export reads the immutable log payload of V by identity. Viable under GC-P4-01 (§1): DELIV-04 requires immutable version semantics, which immutable payloads provide. If GC-P4-01 is not accepted: DELIV-05 with its actual semantics (a private snapshot at export request); no restructuring |
| DF-EXPORT-01 | EXPORT-01 | Outcome records are log events keyed (V, format) (F-10) |
| DF-EXPORT-02 | EXPORT-05 | Localized promotion policy; the chosen event appends a conditional promotion (coincident choice) |
| DF-SESSION-01 | SESSION-01 | The authority is in the page, so interception points query it synchronously; no mirror exists. E-35 condition (AG-09) still governs which events are interceptable |
| DF-SESSION-02 | SESSION-04 | The session scope is the page's memory; discarded as a unit when the page ends |
| DF-SOURCE-01 | SOURCE-01 + SOURCE-03 | F-03, F-04. SOURCE-02 is not selected: verification works against extracted source text |
| DF-ROLE-01 | ROLE-01 | Coincident choice |
| DF-DATA-01 | DATA-01 (base) + DATA-02 | Sinks: page memory, host parsing port, runtime process I/O, AI provider (via runtime), downloads. DATA-03 not selected |
| DF-DEP-01 | DEP-01 (base) + DEP-02c | Conditional variant: confined, text-returning, no tools, no workspace writes; its output is a candidate payload (E-38: SOURCE-03, OP-01, and a candidate area are all present) |

### Mechanism bundles used

- **MB-01** — OP-01 + OP-04 + VALID-02 + VALID-07 / VALID-08. Local adaptation: the success boundary
  is one conditional append ("validated result admitted, operation done").
- **MB-04** Transition-log lifecycle — STATE-04, STATE-05, INTENT-02, EXPORT-01 as log events,
  VALID-08.
- **MB-05 variant G** — REQ-02, OP-06, STATE-05, OP-04, realized as conditional appends.
- **MB-06** — VALID-05 + VALID-06, EXPORT-05, EXPORT-01, STATE-05, DELIV-04 (under GC-P4-01;
  otherwise DELIV-05).
- **MB-07** — EXPORT-01, SESSION-01, SESSION-04. Local adaptation: no mirror; session-loss state is
  derived from the log in the page.
- **MB-08 variant P** — VALID-02, OBS-02, OBS-04. Local adaptation: the render used for measurement
  is the page's own render engine.
- **MB-09 variant M** — PROV-06, PROV-01, SOURCE-01, SOURCE-03.
- **MB-10** — DEP-01 + DEP-02c, OP-01, SOURCE-03, DATA-01.

### End-to-end architecture flow

1. **Source admission.** Input is admitted with an explicit role (ROLE-01). The host's parsing port
   returns extracted text; the page appends a "source admitted" event with the text as an immutable
   payload.
2. **Generation.** A conditional append "operation started" (only if no operation is live) claims
   the slot. The page asks the host to invoke the confined runtime with labelled source (SOURCE-01).
   The runtime returns deck text (web form) with declared origin (PROV-06). Nothing is appended yet.
3. **Validation.** Inside the operation lifetime, the page renders the candidate offscreen with the
   preview engine (OBS-04), measures it (OBS-02), and runs structural then geometry checks
   (VALID-02). Declared source spans are verified against source text.
4. **Admission / version creation.** One conditional append, "result admitted, operation done", with
   the candidate as an immutable payload. It is refused if the operation is no longer live. This is
   the logical success boundary (C-02). The derived `pending` is now that version.
5. **Preview.** The page shows the derived pending (or accepted) version with the same render engine.
6. **Refinement pre-flight / commit boundary.** Pre-flight reads derived state and appends nothing.
   The operation's first step is one conditional append: "commit (promote pending, add constraints
   to the ledger) + operation started" (REQ-02, C-01).
7. **Stop / failure.** A conditional append "operation stopped" or "operation failed" wins if no
   terminal event exists yet. OP-03 asks the host to terminate the runtime invocation. A later
   result is refused at append.
8. **Keep / reject.** Conditional appends carrying the pending identity; refused if that identity is
   no longer pending in the derived state.
9. **Export.** The export captures the payload of V by identity. The page converts the web form to
   native PPTX objects using the measured geometry, and prints the PDF from the same render. Files
   stay in quarantine (page memory) until VALID-05 and VALID-06 pass, then are offered for download.
10. **Export promotion.** EXPORT-05 appends "promote on export (V)" at the chosen event, conditional
    on V still being pending (C-04). The outcome event (V, format) is appended.
11. **Session-ending action.** Reload, close, and New deck consult the log-derived session-loss state
    directly (SESSION-01). When the page ends, the scope is gone (SESSION-04). The host holds nothing
    to discard beyond in-flight runtime work, which OP-03 terminates.

### Authority and state ownership

| State | Authoritative holder | Representation |
|---|---|---|
| Session state | The page instance (one authority per page) | The page's in-memory log (SESSION-04) |
| Accepted / pending | The page | Derived from the log; payloads immutable |
| Operation state | The page | Operation events in the log; the slot is derived |
| Constraint state | The page | Ledger events (INTENT-02); versions reference a ledger position |
| Export outcome state | The page | Outcome events keyed (V, format) |
| Client-view state | The page | The view and the authority are the same page; rendered state is derived from the log |
| Host state | The local host process | None authoritative. In-flight runtime invocations and parsing only |

**AP-P3-01 in this candidate:**
- Every action is a conditional append evaluated against the log at that moment, so stale UI state
  cannot cause an invalid transition.
- BR-014 across views: each page is its own session, so there is exactly one slot per session.
  This holds only under the SA-P3-01 assumption "each page is a separate session".
  This depends on SA-P3-01 (see below).
- Session-loss inputs are read from the log directly, so they are always current.
- Client-observed events (for example a download trigger) are conditional appends like any other.

### Version and operation lifecycle

```
Log (per page):  … source-admitted · op-started(commit?) · result-admitted · kept · rejected ·
                   op-stopped · op-failed · export-outcome · promoted-on-export …
Derived:         accepted, pending, live operation, constraint ledger position, outcomes

First generation:  append op-started [no live op] --> op running
                   append result-admitted [op live ∧ validated] --> pending = V1, op done
Refinement:        pre-flight: no append
                   append op-started+commit [no live op] --> accepted = old pending, pending = none,
                   ledger advanced, op running
                   append result-admitted [op live ∧ validated] --> pending = V2, op done
Stop / failure / validation failure:
                   append op-stopped | op-failed [op live] --> no version event; baseline = accepted
Keep(P) / Reject(P):   append kept | rejected [P is pending]
Export promotion:  append promoted-on-export(V) [V is pending]; otherwise not appended (C-04b branch)
Operation:         running --> done | stopped | failed   (+ waiting-for-input under SA-01 "pause")
```

### Representation and artifact path

- **Deck content form:** a web-rendered deck form (HTML / CSS with element-level origin attributes)
  (DELIV-03 native).
- **State representation:** the log with immutable payloads; the payload is the content form, the log
  is not.
- **Rendered form:** the page's own render of the payload (OBS-04), used by preview and validation.
- **PPTX path:** payload → render → measured geometry → native PPTX objects → quarantine → VALID-05 /
  VALID-06 → download.
- **PDF path:** payload → print of the render → quarantine → VALID-05 → download.
- **Preview path:** direct render in the page.
- **Geometry source:** measurement of the rendered candidate (OBS-02).
- **Origin metadata:** element attributes in the payload (PROV-01).

### Validation model

- **Stage 1 (structural):** well-formedness of the web form, slide structure, origin attributes
  present, declared source spans verified.
- **Stage 2 (geometry):** measured overflow, overlap, and bounds on the rendered candidate (HM checks
  selected under PA-04). Rendered-image checks are available with no extra dependency.
- **Placement:** inside the operation lifetime, before the conditional admission append.
- **Output validation:** VALID-05 on each file; VALID-06 re-reads the PPTX and compares it with the
  measured render (conversion drift, AC-19).
- **Stop:** a stop appended before the admission append wins; the render and measurement finish and
  are discarded (C-03).
- **Conditional:** PA-04 decides which checks run; AG-01b decides whether an in-page render on the
  admission path is fast and reliable enough.

### Failure / stop model

- **Late results:** refused at append because the operation already has a terminal event (OP-01,
  OP-04).
- **Recovery baseline:** the accepted version derived from the log after the commit event.
- **State left:** no version event; operation terminal with cause; slot free.
- **External work:** the runtime invocation is terminated (OP-03); outstanding provider calls inside
  the runtime are its concern (AG-03).
- **Isolation:** runtime and parsing run outside the page; a host or runtime crash becomes an
  operation failure while the page keeps its log. A page crash ends the session.

### Source trust / provenance model

- **Mechanisms:** SOURCE-01 and SOURCE-03. The runtime is confined: no tools, no writes, text out.
- **Assignment:** model-declared, verified (PROV-06). Unverifiable "source" claims are downgraded to
  AI-added.
- **Across refinement:** the new payload carries element attributes; unchanged elements keep theirs;
  changed elements are re-declared and verified.
- **SA-P3-02:** no assumption.

### Delivery and session model

- **Stable export input:** the immutable payload captured by identity (DELIV-04 under GC-P4-01;
  otherwise a DELIV-05 private snapshot).
- **Output validation:** VALID-05 + VALID-06.
- **Outcome record:** log events (EXPORT-01).
- **Promotion policy:** EXPORT-05 as a conditional append.
- **Session-loss evaluation:** in the page, from the log (SESSION-01); no mirror.
- **SA-P3-01: conditioned.** With page-local authority and a stateless host, the candidate as
  defined supports only "each page is a separate session".
  - "A second view is not allowed" needs an added cross-view coordination mechanism, which the
    candidate does not contain: pages hold no shared state, and the host holds none.
  - "A second view shares the running session" needs a shared authority, which moves the authority
    out of the page and restructures the candidate.
- **SA-P3-03:** no assumption. Payload capture keeps the export stable; C-04b / C-05 apply if actions
  are allowed during an export.
- **Reload semantics (SA-P4-01, §8): conditioned.** A reload always ends the session here. If the
  answer is that a reloaded view reattaches to the running session, session state must be held
  outside the page (in a host-held authority or in browser storage) for the application's lifetime.
  That restructures the candidate: it moves the authority or adds a new AP-DATA-01 sink, and
  changes the session boundary.

### AP coverage

| AP | How the candidate addresses it | Relevant ADB / MB | Open condition |
|---|---|---|---|
| AP-FLOW-01 | Composition complete: every Core Flow step is an append or a derived read in the page, with stateless host ports | all | Addressed with condition (AG-02, AG-01b, SA-P3-01) |
| AP-SOURCE-01 | Labelled data; confined runtime with no tools | SOURCE-01, SOURCE-03, DEP-02c | Requires evidence (AG-P4-01 confinement; AG-05 content-flow declaration) |
| AP-ROLE-01 | Explicit role attribute | ROLE-01 | Addressed structurally |
| AP-DATA-01 | Page memory; host and runtime as declared sinks | DATA-01, DATA-02 | Requires evidence (AG-05) |
| AP-INTENT-01 | Attributed ledger in the log | INTENT-02, MB-04 | Open Product semantics (PA-06, SA-04) — accommodates the most answers |
| AP-REQ-01 | Commit fused with operation start in one append | REQ-02, MB-05 G | Addressed structurally |
| AP-STATE-01 | Log with conditional appends by one writer | STATE-04, STATE-05, MB-04 | Addressed structurally |
| AP-OP-01 | Operation events + first-terminal-wins + runtime termination | OP-01, OP-04, OP-03, MB-01 | Open Product semantics (SA-01) |
| AP-OP-02 | Log-derived slot per page | OP-06, MB-05 G | **Open Product semantics (SA-P3-01)** |
| AP-VALID-01 | Render-then-measure gate; output round-trip | VALID-02, VALID-05, VALID-06, MB-08 P | Requires evidence (AG-01b); PA-04 |
| AP-PROV-01 | Declared, verified element attributes | PROV-01, PROV-06, MB-09 M | Requires evidence (RG-04) |
| AP-OBS-01 | Measured geometry; the render is the preview; format capability model for PPTX conversion (NPC-12) | OBS-02, OBS-04, DELIV-03 | Requires evidence (AG-02) |
| AP-DELIV-01 | Preview and exports come from the same payload | DELIV-03, DELIV-04 (GC-P4-01) or DELIV-05 | Addressed structurally |
| AP-EXPORT-01 | Quarantine in page; outcome events; conditional promotion | VALID-05, VALID-06, EXPORT-01, EXPORT-05, MB-06 | Addressed with condition (PA-01, AG-06) |
| AP-SESSION-01 | Log-derived state read synchronously in the page | SESSION-01, MB-07 | Addressed with condition (AG-09 for interceptable events; PA-02; SA-P4-01 reload semantics) |
| AP-DEP-01 | Ports; confined runtime; failure → operation failure | DEP-01, DEP-02c, MB-10 | Requires evidence (AG-P4-01) |
| AP-P3-01 | Conditional appends; slot per page; direct reads | OP-06, OP-04, SESSION-01 | **Open Product semantics (SA-P3-01)** — conditioned |

### Product ambiguities carried

| ID | Candidate assumption | Accommodates multiple answers? | Would another answer restructure it? |
|---|---|---|---|
| SA-P3-01 | **Assumed:** each page is a separate session | No | **Yes** — "not allowed" needs an added cross-view coordination mechanism; "shared session" needs shared authority outside the page |
| SA-P4-01 | **Assumed:** a reload ends the session | No | **Yes** — reattaching a reloaded view needs session state held outside the page for the application's lifetime |
| PA-02 | None | Yes — every "undownloaded" reading is derivable from outcome events | No |
| PA-04 | None | Yes — geometry and rendered checks are both available pre-admission | No |
| PA-01 | None | Yes (EXPORT-05); the page observes its own download trigger | No |
| PA-06 | None | Yes — the ledger accommodates the most answers | No |
| PA-11 | None | Yes — nothing persists beyond the page, apart from host temp files | No |
| SA-01 | None | Yes — "question asked" / "answer given" events; the runtime is re-invoked with the answer inside the same operation | No |
| SA-02, SA-03, SA-P3-03 | None | Yes | No |
| SA-P3-02 | None | Yes | No |
| SA-04 | None | Yes — failed-operation intent stays in the log and can be reused or ignored | No |
| SA-05 | None | Yes — the admitted payload was already rendered once | No |
| PA-03, PA-05, PA-10, PA-12, PA-13 | None | Yes | No |

### Evidence gaps / spikes

| Gap | Classification | What would rule the candidate out | Branch that remains |
|---|---|---|---|
| AG-02 | Candidate viability; before W-035 | Web form → native PPTX objects loses too much (the screenshot fallback is excluded) | None within X-3 (restructuring) |
| AG-01b | Candidate viability; before W-035 | An in-page render on the admission path is too slow or unreliable | Content-only gate (MB-08 D), only if PA-04 allows it — restructuring |
| AG-01a | Confidence only | — | — |
| AG-P4-01 (new) | Candidate viability for X-5; spike before W-035 | The selected runtime cannot meet the DEP-02c confinement contract (text / data output only; no tool, action, or file authority; no lifecycle-state access; results only via admission; inspectable content flow) | DEP-01 ports only (X-5 change; the rest of the candidate is unchanged) |
| AG-05 | Confidence (W-034 declaration), including content that flows through the runtime | — | — |
| RG-01 | Confidence only (reference-research gap) | — | — |
| AG-09 | Before W-035 | Session-ending events cannot be intercepted in the page | None needed for authority access; interception coverage is the open point |
| AG-06 | Before W-035 only if PA-01 picks user receipt | — | "Valid file produced" event |
| AG-03 | Confidence only. Includes whether the runtime invocation can be physically terminated (OP-03) | Not an invalidation. A runtime that cannot be terminated keeps consuming after a stop (AC-22, AC-23 cost) | Late results are still rejected at admission |
| RG-04 | Prototype before W-035 if Variant M is relied on | — | Variant C (with SOURCE-02) under the matching SA-P3-02 answer |
| RG-02, RG-03, RG-08 | Confidence only | — | — |

### Benefits

- The preview and the validation render are the same render; what is checked is what is shown
  (AC-18, AC-14).
- The log gives version-state and validation observability natively (AC-17, AC-20, AC-29, AC-30).
- The host holds no lifecycle state, so a host or runtime crash cannot corrupt versions.
- Session-loss state is read directly, without a mirror.
- The ledger accommodates the widest range of constraint-lifetime answers (PA-06).

### Trade-offs

- **AC-21:** log derivation, conditional appends, a web-to-PPTX converter, and runtime integration.
- **AC-22:** an external agent runtime (C-14: confinement removes much of its benefit) and a browser
  render engine as the validation dependency.
- **AC-23:** a page crash loses the session; a host crash only fails the operation.
- **AC-24:** the log model, the web content form, and page-held authority are low-reversibility.
- **AC-25:** gate tests need a render engine; log replay makes state tests deterministic.
- **AC-26:** new output targets need converters from the web form.
- **AC-27:** translation reflows naturally in the render; PPTX conversion must follow the reflow.
- The log grows through the session (AP-DATA-01 footprint).

### Risks / failure modes

- HTML / CSS features that have no native PPTX equivalent pass the gate and degrade at export
  (AG-02 × NPC-12).
- A second tab silently creates a second session, and the user exports from the wrong one
  (SA-P3-01).
- The confined runtime is not confinable in practice and the X-5 choice falls back to DEP-01, which
  removes one of the candidate's reasons for the web-text content form.
- Page memory pressure with large decks and a growing log.

### Complexity

- **Implementation:** high — log derivation, render-and-measure gate, web-to-PPTX conversion, runtime
  confinement.
- **Runtime / operation:** moderate — page, host, and runtime process; no worker protocol for state.
- **Maintenance:** moderate to high — the converter tracks both web rendering and PPTX.

### Reversibility

- **Low:** transition-log state (STATE-04); web-rendered content form (DELIV-03); page-held authority.
- **Medium:** confined runtime (DEP-02c can be replaced by DEP-01 adapters without touching state).
- **High (local):** EXPORT-05 event, VALID-06 comparison rules, ROLE-01, provenance verification
  rules.

### Candidate-specific reopen conditions

- **Invalid:** AG-02 shows web form → native PPTX cannot meet R-028 / AC-05.
- **Require restructuring:** SA-P3-01 answered "a second view shares the running session" (shared
  authority); SA-P4-01 answered "a reloaded view reattaches to the running session"; AG-01b fails and PA-04
  requires pre-display geometry.
- **Require an added mechanism:** SA-P3-01 answered "a second view is not allowed" (cross-view
  coordination to detect and refuse a second page).
- **Invalidates the DEP-02c choice (not the candidate):** AG-P4-01 shows the selected runtime cannot
  meet the confinement contract. The runtime choice falls back to DEP-01, and the rest of C is
  unchanged.
- **Trade-off only:** AG-03 shows the runtime invocation cannot be physically terminated on stop.
  This affects OP-03 and AC-22 / AC-23, not validity, because late results are still rejected at
  admission.

---

## 7. Cross-candidate structural differences

| Concern | Candidate A | Candidate B | Candidate C |
|---|---|---|---|
| State shape | Immutable values + references | Mutable slots + candidate areas | Transition log, immutable payloads |
| Coordination | Guarded compare-and-set transitions | One serialized command channel | Guarded conditional appends |
| Content form | Format-neutral model | DeckAgent-owned PPTX-shaped model | Web-rendered form |
| Geometry | Computed by the product before display | From produced files at delivery | Measured from the render before display |
| Renderer on admission path | Only if PA-04 requires rendered checks | No | Yes |
| Runtime boundary | In-process ports | Ports + worker process | Ports + confined external runtime |
| Provenance | By construction | Model-declared, verified | Model-declared, verified |
| Authority location | Local application process | Local application process (worker holds no state) | The page |
| Export stability | Value captured by identity (DELIV-04) | Copy taken by a command (DELIV-05) | Immutable payload captured by identity (DELIV-04 under GC-P4-01; otherwise a DELIV-05 snapshot) |
| Session handling | Authority records + pushed page mirror | Authority records + pushed page mirror | Direct log reads in the page; no mirror |
| Constraint state | Inside each value | Inside each slot | Ledger events |
| Stop mechanism | CAS terminal; no physical cancel | Ordered stop + worker termination | Conditional terminal append + runtime termination |
| Crash containment | None (one process) | AI / render crash → operation error | Host / runtime crash → operation error; page crash → session loss |
| Major external dependencies | AI provider; PPTX and PDF writers | AI provider; PPTX → image / PDF converter | AI provider; external agent runtime; browser render engine; web → PPTX converter |

### Pairwise material differences

- **A vs B:** differ on all six axes (X-1 … X-6), on the stop mechanism, and on crash containment.
- **A vs C:** differ on X-1, X-3, X-5, X-6 and on authority location. Both use MB-05 G and MB-08 P,
  but the geometry source differs (computed vs measured) and the admission path differs (no renderer
  vs renderer).
- **B vs C:** differ on X-1, X-2, X-3, X-4, X-5, on authority location, and on session handling. They
  share X-6 Variant M.

## 8. Common unresolved Product semantics

**New Phase-4-local semantic ambiguity:**

- **SA-P4-01 — Does a page reload end the session?**
  - *Question:* while the local application is still running, when the user reloads the page, does
    the reload end the session, or does the reloaded view reattach to the same session?
  - *Scope:* reload and reattachment only, within the lifetime of the running local application.
    Restoring a session after the application or its process has ended is not part of this
    question, and no authoritative Product source provides for it.
  - *Why it is new:* PA-02 defines what counts as "undownloaded" work, not the session lifetime.
    SA-P3-01 covers concurrent second views, not a reload of the only view. UC-011 1B requires a
    warning on reload but does not state whether a session held outside the page must end.
  - *Ownership:* TBD. Not added to Project Hub.
  - *Affects:* AP-SESSION-01, AP-P3-01; Candidate C's authority location.

**Affecting all candidates, without restructuring any:**
- PA-01 (delivered event) — localized in EXPORT-05 everywhere.
- PA-02 (what counts as "undownloaded") — EXPORT-01 records by (version, format) serve every reading.
- PA-03, PA-13 (verification scope, first PPTX application).
- PA-05 (export as a stoppable operation).
- PA-06 (constraint lifetime) — per-version sets in A and B; a ledger in C.
- PA-10, PA-11, PA-12.
- SA-01 (pausing operation) — each candidate has a `waiting-for-input` path.
- SA-02, SA-03, SA-04.
- SA-P3-03 — the C-04 invariant holds everywhere; the C-04b / C-05 branch applies wherever actions
  are allowed during an export.

**Candidate-specific, restructuring if answered the other way:**

| Ambiguity | Candidate | Assumption | Restructuring if the other answer holds |
|---|---|---|---|
| SA-P3-02 | A | Rephrased content is relabelled (or not rephrased) | X-6 → Variant M |
| PA-04 | B | No HM-1 / HM-4 before display | X-4 → Variant P |
| SA-P3-01 | C | Each page is a separate session | "Not allowed": an added cross-view coordination mechanism. "Shared session": shared authority outside the page |
| SA-P4-01 | C | A reload ends the session | Session state held outside the page for the application's lifetime (host-held authority or browser storage) |

**Candidate-specific, carried without restructuring:** PA-04 (A, C); SA-P3-02 (B, C); SA-P3-01 (A,
B); SA-P4-01 (A, B: the host-held session can end on unload, or the reloaded view can reattach while the application runs); SA-05
(occurs more often in B).

## 9. Evidence / spike dependency matrix

| Gap | Candidate A | Candidate B | Candidate C | What result matters |
|---|---|---|---|---|
| AG-01a | **Viability** (computed geometry) | Only if PA-04 requires pre-display geometry | Confidence | Whether pre-display geometry is accurate against real outputs |
| AG-01b | Only if PA-04 requires rendered checks | **Viability** (PPTX → preview images) | **Viability** (in-page render on the admission path) | Speed and reliability of a render before or after admission |
| AG-02 | **Viability** (neutral model → PPTX) | **Viability** (PPTX → preview / PDF) | **Viability** (web form → native PPTX) | Direction of drift that each content form risks |
| AG-06 | If PA-01 = user receipt (client-reported event) | If PA-01 = user receipt (client-reported event) | If PA-01 = user receipt (page-observed trigger) | Observability of the delivered event |
| AG-09 | SESSION-01 vs SESSION-02 split | SESSION-01 vs SESSION-02 split | Interception coverage only | Which session-ending events can be intercepted synchronously |
| AG-03 | Confidence (no kill-on-stop) | Confidence (worker termination) | Confidence (runtime termination via OP-03; failure affects AC-22 / AC-23 only) | Cost after stop; not correctness |
| AG-05 | Confidence (W-034 declaration) | Confidence (W-034 declaration) | Confidence (W-034 declaration, including flow through the runtime) | Whether the content flow can be declared |
| RG-01 | Confidence | Confidence | Confidence | Reference evidence for OpenDesign's widened RQs |
| **AG-P4-01** (new) | — | — | **Viability of DEP-02c**; spike before W-035 | Whether the selected runtime can be held to the confinement contract (physical termination excluded; see AG-03) |
| RG-04 | Prototype if Variant C is relied on | Prototype if Variant M is relied on | Prototype if Variant M is relied on | Content-level provenance surviving edits |
| RG-02, RG-03, RG-08 | Confidence | Confidence | Confidence | Reference evidence is absent; reasoning is DeckAgent's |

All viability spikes fall within the five named spikes, plus AG-P4-01 for Candidate C's X-5
choice. Every spike stays before W-035; none blocks W-034 assessment.

**New Phase-4-local evidence gap:**

- **AG-P4-01 — Confinement of the selected external agent runtime.**
  - *Question:* can the external agent runtime selected for DEP-02c actually be held to the
    confinement contract?
    - Its output is text or data only.
    - It has no tool or action authority.
    - It makes no workspace or file writes.
    - It has no direct access to DeckAgent lifecycle state.
    - Its results return only through DeckAgent's admission boundary.
    - Its declared content flow remains inspectable.
  - *Out of scope:* whether an outstanding invocation can be physically terminated on stop. That
    is not a correctness prerequisite: late-result rejection (OP-01, OP-04) provides correctness,
    and Phase 3 places physical cancellation in OP-03 as a cost and resource-control complement. It
    belongs to AG-03 and to the AC-22 / AC-23 trade-offs.
  - *Why it is new:* no existing DeckAgent gap covers the whole question.
    - AG-05 covers how the content flow to the AI provider is declared. AG-P4-01 tests only whether
      the runtime lets that flow stay inspectable.
    - AG-03 covers outstanding calls after a stop, which is a cost question.
    - RG-01 is a reference-research confidence gap about OpenDesign's widened RQs, not evidence
      about a DeckAgent mechanism.
    - None of these is broadened here.
  - *Resolution:* a spike before W-035, if Candidate C is carried into the comparison.
  - *Affects:* Candidate C (X-5, MB-10, E-38).
    - If the runtime cannot meet the contract, C's DEP-02c choice is invalid, and C falls back to
      DEP-01 only.
    - If the runtime can be confined but not physically terminated, DEP-02c stays valid. The
      effect falls on AG-03, OP-03, and the AC-22 / AC-23 trade-offs.

## 10. Candidate completeness check

| Check | A | B | C |
|---|---|---|---|
| Core Flow complete (flow steps 1–11) | Yes | Yes | Yes |
| Every frozen AP + AP-P3-01 represented | Yes (17 rows) | Yes (17 rows) | Yes (17 rows) |
| Every required DF choice stated (18 families + DF-STATE-01, DF-VALID-01, DF-OBS-01, DF-PROV-01, DF-PROV-02, DF-DELIV-01) | Yes (24) | Yes (24) | Yes (24) |
| Hard `requires` edges satisfied | Yes | Yes | Yes (E-22 under GC-P4-01, or E-24 in the DELIV-05 fallback) |
| No `conflicts_with` edge active | Yes | Yes | Yes |
| No negative option or excluded sub-variant used | Yes | Yes | Yes |
| Conditional options carry their condition | n/a (none selected) | OBS-03 (PA-04) | DEP-02c (confined); DELIV-04 (GC-P4-01, with the DELIV-05 fallback) |
| Complements have a valid base | DATA-02 on DATA-01 | OP-03 on OP-02; VALID-03 on VALID-01; VALID-06 on VALID-05; DEP-03 on DEP-01; DATA-02 on DATA-01 | OP-03 on OP-01; VALID-06 on VALID-05; DEP-02c on DEP-01; DATA-02 on DATA-01 |
| AP-P3-01 satisfied | Yes | Yes | Yes, under the SA-P3-01 assumption "each page is a separate session" |
| IDENT satisfied | Yes | Yes | Yes |
| C-01 (commit atomic with slot claim) | Fused guarded transition | One command | One conditional append |
| C-02 (logical success boundary) | Guarded admission transition | Channel processes the validated result | Conditional admission append |
| C-04 (identity-checked promotion) | Guarded promotion | Promotion command | Conditional promotion append |
| SA-01 accommodated | Yes | Yes | Yes |

**Edge verification (edges that apply to at least one candidate):**

| Edge | A | B | C |
|---|---|---|---|
| E-01 STATE-02 → DF-STATE-02 | — | STATE-05 | — |
| E-02 STATE-03 → DF-STATE-02 | STATE-05 | — | — |
| E-03 STATE-04 → DF-STATE-02 | — | — | STATE-05 (conditional appends) |
| E-04 state shape → DF-OP-01 | OP-01 | OP-02 | OP-01 |
| E-05 → IDENT | Yes | Yes | Yes |
| E-07 INTENT-02 → atomic scope includes ledger | — | — | Ledger events in the same append |
| E-10 / E-11 (PA-04 P2 / P1) | INTENT-01; PROV-01 | INTENT-01; PROV-01 | INTENT-02; PROV-01 |
| E-12 VALID-02 → OBS-01 / 02 | OBS-01 | — | OBS-02 |
| E-13 VALID-02 × OBS-03 | Not both | Not both (VALID-01 + OBS-03) | Not both |
| E-14 / E-15 (PA-04 HM-1 / HM-4) | OBS-01 present | **Conditioned on PA-04** | OBS-02 present |
| E-16 REQ → fused transition | Yes | Yes | Yes |
| E-17 OP-01 → containment | DEP-01 | DEP-01 + DEP-03 (applies via MB-10) | DEP-01 + DEP-02c |
| E-18 OP-02 → DF-OP-02 | — | OP-05 | — |
| E-19 OP-04 / 05 → validation inside the lifetime | Yes | Yes | Yes |
| E-20 OP-04 → DF-OP-01 | OP-01 | — | OP-01 |
| E-21 OP-03 → OP-01 / 02 | — | OP-02 | OP-01 |
| E-22 DELIV-04 → STATE-03 (as frozen) | STATE-03 | — | **Not met as frozen.** Met under GC-P4-01 (immutable payloads); otherwise C uses DELIV-05 |
| E-23 STATE-03 ⇒ DELIV-05 unnecessary | DELIV-05 not used | — | — |
| E-24 DELIV-05 → DF-STATE-02 | — | STATE-05 | STATE-05 (only in the DELIV-05 fallback) |
| E-26 DELIV-02b pressure | — | 02a used, not 02b | — |
| E-27 STATE-03 → value-capable form | DELIV-01 | — | — |
| E-28 / E-29 EXPORT-05 → VALID-05; DF-STATE-02 | Yes | Yes | Yes |
| E-33 SESSION → EXPORT-01 | Yes | Yes | Yes |
| E-34 SESSION-02 → AP-P3-01 | Pushed mirror | Pushed mirror | — (no SESSION-02) |
| E-35 SESSION-01 → AG-09 | Carried | Carried | Carried (interception coverage) |
| E-37 OP-06 / 07 → AP-P3-01 | One slot per session | One channel per session | One slot per page-session (SA-P3-01 assumption) |
| E-38 DEP-02c → SOURCE-03, OP-01, candidate area | — | — | All present |
| E-39 DEP-03 → authority outside worker | — | Yes | — |
| E-40 / E-41 PROV-05 → SOURCE-02; SA-P3-02 | SOURCE-02; assumption stated | — | — |
| E-43 PROV-01 pressure on content form | Model fields | Owned fields (02a) | Element attributes |
| E-44 PROV-06 pressure | — | Structured-output contract | Structured-output contract |
| E-46 VALID-06 → VALID-05 + geometry | — | OBS-03 | OBS-02 |
| E-47 VALID-03 → DF-OBS-02 | — | OBS-05 | — |
| E-49 DATA-03 × SESSION-04 | DATA-03 not used | DATA-03 not used | DATA-03 not used |
| E-50 OBS-02 pressure (AG-01b) | — | — | Accepted; AG-01b viability spike |
| E-51 / E-52 content form → AG-02 / AG-01b | AG-02 | AG-01b, AG-02 | AG-02 |
| E-55 OP-07 → OP-05 | — | OP-05 | — |
| E-56 DEP-03 pressure on AP-DATA-01 | — | Worker channel declared as a sink | — |

## 11. Phase 4 handoff

### Candidates created

- Candidate A — Value-oriented neutral-model architecture.
- Candidate B — Presentation-native serialized architecture with worker isolation.
- Candidate C — Render-first transition-log architecture with page-held authority.

### Major distinguishing axes

- X-1 and X-3 differ across all three candidates: values with a neutral model, slots with a
  PPTX-shaped model, and a log with a web form.
- X-4 separates B (delivery-time geometry) from A and C (pre-display geometry, computed vs measured).
- X-5 differs across all three: in-process, worker process, and confined runtime.
- Authority location separates C (page) from A and B (local application process).

### Common foundation

F-01 … F-13 (§2.1): IDENT, one atomic transition domain over paired lifecycle state (all three
candidates realize it with STATE-05), no side channel, labelled source, DEP-01 ports,
declared sinks, the logical success boundary, the fused commit and slot claim, output quarantine,
outcome records by (version, format), identity-checked export promotion, element-level origin labels,
and client-view consistency.

### Candidate-specific evidence gaps

- **A:** AG-01a, AG-02 (viability).
- **B:** AG-01b, AG-02 (viability).
- **C:** AG-01b, AG-02, and AG-P4-01 for DEP-02c (viability). Runtime termination (AG-03) is a
  trade-off, not a viability spike.
- **All:** AG-06 (if PA-01 = receipt) and AG-09 before W-035; AG-03 and RG-02 / 03 / 08 confidence
  only; RG-04 prototype if provenance is relied on.

### Product ambiguities that could materially reshape a candidate

- SA-P3-02 → Candidate A (X-6).
- PA-04 → Candidate B (X-4).
- SA-P3-01 → Candidate C. It supports only "each page is a separate session". "Not allowed" needs
  an added cross-view coordination mechanism, and "shared session" needs shared authority.
- SA-P4-01 (new, Phase-4-local: does a reload end the session, or does the reloaded view reattach
  while the application runs?) → Candidate C (authority
  location).

### Phase-4-local items

- **GC-P4-01:** graph correction. DELIV-04 requires immutable version semantics, not STATE-03
  specifically. Candidate C's DELIV-04 depends on it; the fallback is DELIV-05. The frozen Phase 3
  file is not edited.
- **AG-P4-01:** evidence gap / spike. Can the selected external agent runtime satisfy the DEP-02c
  confinement contract?
  - The contract: text / data output only; no tool, action, or file authority; no lifecycle-state
    access; results only via admission; inspectable content flow.
  - Failing it invalidates C's DEP-02c choice, and the fallback is DEP-01 only.
  - Physical termination on stop is excluded. It stays with AG-03 / OP-03 as an AC-22 / AC-23
    trade-off.
  - RG-01, AG-03, and AG-05 are not broadened.
- **SA-P4-01:** reload and reattachment semantics within the running application's lifetime.
  Ownership TBD; not added to Project Hub.

### Candidates ready for Phase 5 assessment?

Yes. There are no factual blockers. Each candidate states its assumptions, and Phase 5 can assess
each Gate as "Not yet assessable" where an assumption or spike is still open.
