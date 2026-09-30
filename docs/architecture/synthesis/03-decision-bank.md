# Phase 2 — Architecture Decision Bank

- Inputs: `01-context.md` (frozen), `02-problem-map.md` (frozen, 16 APs), Project Hub snapshot,
  DOC-004, DOC-008 (selected sections), DOC-005, DOC-006, DOC-007.
- Built: 2026-09-30. ADB IDs are fixed; do not renumber.
- This bank lists **options**. It selects nothing and assembles no candidate architecture.

## 1. Phase 2 prerequisite check

### AG-07 trace re-check

**Result: no material change. No frozen AP is affected.**

- The current snapshot was synced 2026-09-30T08:17:12Z (`status` = fresh, `validate` = no
  structural issues, `changedTables` = none).
- All 14 table hashes are identical to those recorded when Phase 0 was built. Examples:
  requirements `22c679e0…`, business_rules `14d5b09f…`, decisions `21f63c22…`, use_cases
  `a804c615…`, documents `37175b6b…`, work `c2d62d12…`. Every row Phase 0 and Phase 1 relied on is
  therefore byte-identical.
- ID check:
  - DOC-004 cites 97 Project Hub IDs; the Problem Map cites 109. None are missing.
  - IDs whose status is not Active, Done, or Open are cited only in the Later, Retired, or Draft
    sense their status gives them (for example R-048 Later, C-001 Retired, UC-022 Later).
- Residual:
  - DOC-004 and DOC-008 both say they were checked against a snapshot from 03:05 UTC. The
    03:05 → 03:31 difference cannot be reconstructed, because snapshots are not versioned.
  - The restatements that matter were compared against the current rows, and each is consistent:
    DOC-004 §3.3; DOC-008 §4.2, §4.5, §4.6 against BR-010 rules 1–8; D-030; R-024 AC2–4;
    R-031 AC2; R-046 AC2–3; R-020 AC1–3.
- AG-07 is closed for Phase 2.

### AG-08 DOC-008 read

Read: header, §1–§2, §4, §5.3, §6, §10, §12.

**Currency**
- The DOC-008 header shows an update on 2026-09-30 for D-030 and W-037.
- §4.6 covers R-045, R-046, and BR-014, and F13 is closed.
- The Project Hub DOC-008 note ("does not yet reflect R-045/R-046; re-check against D-030") is
  therefore stale. Phase 0 T-05 overstated DOC-008's staleness; the lag is in Project Hub
  metadata, not in the file.

**What must be testable (§1.3, §4)**
- P1, P2, the P3 hard minimum, and P5.
- R-033 validation before display.
- Recovery (R-031, R-032).
- The BR-010 lifecycle, including the D-030 commit boundary.
- Stop (R-046) and one operation at a time (BR-014).
- The session-loss warning (R-045).
- Egress (R-042) and injection resistance (R-043).

**Could run as runtime validation (§5.3, feasibility only)**

| Check | Runtime feasibility per DOC-008 | Data needed at the validation point |
|---|---|---|
| P1 source numbers | Feasible | Content origin (AC-16) and source text |
| P2 measurable constraints | Feasible | **Active constraint set** |
| HM-3 empty slide | Feasible | Content only |
| HM-3 render errors | Only if rendering happens before display | Rendered output |
| HM-1 clipped text | Only if layout or rendering happens before display | Post-layout geometry, or a rendered image |
| HM-4 layout failure | Only if geometry exists before display | Post-layout geometry |
| HM-2 narrative | Only with a calibrated LLM judge | Slide order and text |
| R-027 file validity | Feasible before delivery | The produced file |
| R-028 preview vs file | Feasible before delivery | Preview geometry available at export |
| R-025 PPTX vs PDF | Mainly a test oracle | Both files (UC-008 exports one chosen format per request) |
| KCI | Test-only | — |

DOC-008 draws this consequence itself: if geometry exists only at export time, HM-1 and HM-4
cannot be stopped before display. That is evidence for AC-10 and AC-25, not a Gate.

**Testability needs**
- TN-1: the active constraint set can be read after each turn, including after reject, stop,
  failure, and pre-commit cancel.
- TN-3: external calls can be substituted with recorded replay, injected failure, and
  hold-and-release responses. The technique is Detailed Design.
- TN-5: exercising the Core Flow without the UI is a cost factor only.
- TN-6: version status can be read. It is folded into AC-17, AC-29, and AC-30.

**Left to Product (§12)**
- F1, F2 (KCI), F8 (evidence application), F9 (constraint lifetime), F11
- F12: whether R-025/R-028 cover pending exports, and what "delivered" means
- F14: what "undownloaded" means
- F15: whether UC-002 step 6 is a product requirement

**Stale or narrower relative to Project Hub and DOC-004**
- TN-6 says "whether the latest version has been exported". AC-30 requires export outcomes by
  version **and format**. DOC-004 governs.
- The DOC-008 baseline is the 03:05 snapshot (see AG-07 residual).
- No DOC-008 semantics contradict BR-010, D-030, R-045, or R-046.

### Impact on frozen Phase 1

No AP was edited. Tensions carried into Phase 3:

| ID | Tension | APs |
|---|---|---|
| T-P2-01 | A runtime P2 check (§5.3) needs the active constraint set at the validation point. This is a conditional dependency AP-VALID-01 → AP-INTENT-01 (depending on PA-04), analogous to the conditional PROV dependency. It is missing from the Phase 1 dependency map. | AP-VALID-01, AP-INTENT-01 |
| T-P2-02 | AG-01 has two parts: **AG-01a**, post-layout geometry before display (HM-1, HM-4), and **AG-01b**, a rendered image before display (HM-3 render errors, visual clipping). Phase 1 treats them together as "layout or rendered". This bank separates them. | AP-VALID-01, AP-OBS-01 |
| T-P2-03 | Phase 0 T-05 and AG-08 "DOC-008 is behind" are resolved: the file is current, and the Project Hub note is stale (a Project Hub correction, not an architecture issue). | — |
| T-P2-04 | DOC-008 TN-6 is narrower than AC-30. DOC-004 governs; options below use version plus format. | AP-SESSION-01, AP-EXPORT-01 |

---

## 2. Decision Bank usage rules

- An entry is a **mechanism option**: "for problem P, mechanism M is one viable structural choice,
  under assumptions A, with consequences C". Entries are not architectures and not
  recommendations.
- APs and ADBs relate many-to-many. Families (`DF-*`) group alternatives; the stable IDs are the
  `ADB-*` IDs. AP-FLOW-01 has no family: it is the composition check in W-034.
- `Addresses` distinguishes `solves` (rare), `partially_solves`, and `constrains`. No option alone
  solves a coupled set.
- Origin labels:
  - `Observed in reference system`
  - `Adapted from reference evidence`
  - `Derived from DeckAgent constraints`
  - `Synthesis hypothesis`

  DOC-006 §4.2 is never cited as evidence.
- Every **Evidence** field separates three things: *exists* (the mechanism is observed),
  *consequence* (what the evidence shows it causes), and *DeckAgent reasoning*.
- Options marked `Not viable for DeckAgent under current V1 constraints` are kept as negative
  evidence. DOC-004 outcomes (`Meets`, `Does not meet`) are not used here.
- Where OpenDesign's widened RQ-06, RQ-07, RQ-09, or RQ-14 coverage matters, the entry says
  `OpenDesign evidence incomplete for this aspect`.
- There are no scores. Complexity and reversibility are qualitative.
- Every entry carries an **Option role** (Primary alternative, Complementary mechanism,
  Conditional variant, or Negative evidence). Every family has a **Selection mode** (see §3).
  These say which options are peer alternatives and which are add-ons or conditional. Phase 3
  decides which combinations hold.

---

## 3. Decision family index

| Decision family | Question | Main APs | Coupled set | Options | Selection mode |
|---|---|---|---|---|---|
| DF-STATE-01 | Where can a not-yet-authoritative AI result exist? | AP-STATE-01, AP-OP-01, AP-VALID-01 | K-1 | ADB-STATE-01 … 04 | choose-one |
| DF-STATE-02 | Who may apply lifecycle transitions, and how are they kept atomic? | AP-STATE-01, AP-REQ-01, AP-EXPORT-01 | K-1, K-2 | ADB-STATE-05, 06 | choose-one |
| DF-INTENT-01 | How are constraints held relative to versions and requests? | AP-INTENT-01, AP-STATE-01 | K-1 | ADB-INTENT-01 … 03 | choose-one |
| DF-REQ-01 | Where is the commit boundary committed? | AP-REQ-01, AP-STATE-01, AP-OP-01 | K-1 | ADB-REQ-01 … 03 | choose-one |
| DF-OP-01 | How is operation lifetime represented strongly enough to reject late results? | AP-OP-01, AP-DEP-01 | K-1, K-4 | ADB-OP-01 … 03 | base + optional complements |
| DF-OP-02 | How does a coinciding stop and completion resolve to one outcome? | AP-OP-01 | K-4 | ADB-OP-04, 05 | choose-one |
| DF-OP-03 | How is single-operation exclusivity enforced? | AP-OP-02 | K-4, K-2 | ADB-OP-06 … 08 | choose-one |
| DF-VALID-01 | Where is AI-result validation placed relative to admission? | AP-VALID-01, AP-OBS-01 | K-3, K-1 | ADB-VALID-01 … 04 | base + optional complements |
| DF-VALID-02 | How are output files validated before delivery? | AP-VALID-01, AP-EXPORT-01, AP-OBS-01 | K-3, K-2 | ADB-VALID-05, 06 | base + optional complements |
| DF-VALID-03 | How is the validation outcome made observable? | AP-VALID-01 | K-3 | ADB-VALID-07, 08 | choose-one-or-more |
| DF-OBS-01 | Where does post-layout geometry exist relative to display? | AP-OBS-01, AP-VALID-01, AP-DELIV-01 | K-3 | ADB-OBS-01 … 03 | choose-one |
| DF-OBS-02 | How is a rendered whole-deck view obtained? | AP-OBS-01 | K-3 | ADB-OBS-04, 05 | choose-one-or-more |
| DF-PROV-01 | At what granularity is origin held? | AP-PROV-01 | K-3 | ADB-PROV-01 … 04 | base + optional complements |
| DF-PROV-02 | Who assigns origin? | AP-PROV-01, AP-SOURCE-01 | K-3 | ADB-PROV-05, 06 | choose-one |
| DF-DELIV-01 | How do preview, PPTX, and PDF derive from a version? | AP-DELIV-01, AP-OBS-01 | K-2 | ADB-DELIV-01 … 03 | choose-one |
| DF-DELIV-02 | What keeps an exported version stable during export? | AP-DELIV-01, AP-OP-02 | K-2 | ADB-DELIV-04 … 06 | choose-one |
| DF-EXPORT-01 | How are export outcomes recorded? | AP-EXPORT-01, AP-SESSION-01 | K-2 | ADB-EXPORT-01, 02 | choose-one |
| DF-EXPORT-02 | Where is promotion on export committed? | AP-EXPORT-01, AP-STATE-01 | K-2 | ADB-EXPORT-03 … 05 | choose-one |
| DF-SESSION-01 | How does session-loss state reach interception points? | AP-SESSION-01 | K-2 | ADB-SESSION-01 … 03 | choose-one-or-more |
| DF-SESSION-02 | How is the session boundary scoped? | AP-SESSION-01, AP-DATA-01 | K-2 | ADB-SESSION-04, 05 | choose-one |
| DF-SOURCE-01 | How does source stay data and not instruction? | AP-SOURCE-01 | — | ADB-SOURCE-01 … 03 | choose-one-or-more |
| DF-ROLE-01 | How is role kept independent of file type? | AP-ROLE-01 | — | ADB-ROLE-01, 02 | choose-one |
| DF-DATA-01 | How is the user-content footprint bounded and identified? | AP-DATA-01 | — | ADB-DATA-01 … 03 | base + optional complements |
| DF-DEP-01 | Where do external dependencies cross the boundary? | AP-DEP-01, AP-OP-01, AP-DATA-01 | K-4 | ADB-DEP-01 … 03 | base + optional complements |

24 families, 66 options.

**Selection modes**

| Mode | Meaning |
|---|---|
| `choose-one` | The primary alternatives are mutually exclusive answers to the family's question. |
| `choose-one-or-more` | The options address different facets and may be combined. |
| `base + optional complements` | One base option is required. Complements may be added on top. |

**Option roles** (on every ADB entry)

| Role | Meaning |
|---|---|
| Primary alternative | A standalone answer to the family's question. |
| Complementary mechanism | Adds to a primary or base option and is not a standalone answer. |
| Conditional variant | Viable only under a stated condition: another option, or a PA, SA, or AG outcome. |
| Negative evidence | Kept to document why a shape is not viable under current V1 constraints. It is not a candidate for selection. |

Phase 3 compatibility analysis compares options **across** families. Within a family, primary
alternatives are compared only as alternatives. Complements and conditional variants are checked
only against their base or condition. Negative-evidence entries are excluded from compatibility
analysis.

---

## 4. Lifecycle core mechanisms (K-1)

## DF-STATE-01 — Where a not-yet-authoritative AI result can exist

**Selection mode:** choose-one

### ADB-STATE-01 — Mutate the working artifact in place, keep restorable history

- **Decision family:** DF-STATE-01
- **Option role:** Negative evidence
- **Mechanism:**
  - The operation writes directly into the single working deck.
  - Earlier states are kept as history.
  - Reject or failure restores by copying a history entry back over the working deck.
- **Addresses:** partially_solves AP-STATE-01 (restore); constrains AP-OP-01, AP-VALID-01,
  AP-DELIV-01.
- **Why this mechanism exists:** It is the simplest shape when the AI edits files or objects
  directly and recovery is "go back".
- **Origin:** Observed in reference system.
- **Evidence:**
  - *Exists:* OpenDesign edits the workspace directly during a run; restore copies an HTML
    version over the working file (F-OD-07, F-OD-06).
  - *Consequence:*
    - Preview can show changes mid-run (F-OD-09).
    - Stop or failure does not guarantee unchanged files, and late writes can remain (F-OD-14).
    - Restore is per file and may not cover every file a run changed (F-OD-07).
    - OpenDesign evidence is incomplete for the widened RQ-07 and RQ-14 aspects.
  - *DeckAgent reasoning:* AC-06 forbids an unvalidated result from being displayed or becoming
    pending or accepted. AC-28 forbids a late result from creating or changing a version.
- **Assumptions:** Nothing reads the working state while an operation runs, and every write can be
  compensated.
- **Benefits:** Only one deck state exists. The AI can work on the real artifact.
- **Trade-offs:**
  - Rollback is compensation after the fact.
  - The accepted, pending, and working states are conflated.
- **Risks / failure modes:**
  - Preview shows a half-written or invalid deck.
  - A stop leaves a partial deck.
  - A late write lands after a restore.
  - Compensation misses one changed part.
- **Introduces / exposes:** creates_pressure_on AP-OP-01, AP-VALID-01, AP-DELIV-01.
- **Relationships:**
  - conflicts_with ADB-VALID-01, ADB-VALID-02 (neither can keep a result invisible before
    validation if the working state is the displayed state).
  - conflicts_with ADB-DELIV-04.
- **Complexity:** Implementation low. Operational high: the correctness of compensation must be
  maintained. Maintenance high.
- **Constraints / prerequisites:** A complete write-set record for compensation.
- **Reversibility:** Low. The shape becomes the domain model for every path.
- **Evidence gaps:** RG-01.
- **Relevant Gates / Observability:** AC-06, AC-07, AC-08, AC-28, AC-29, AC-17.
- **Known incompatibility:** In the observed form, an unvalidated or partial result is visible, and
  late writes can mutate state. This contradicts AC-06 and AC-28.
- **When viable:** Only if no reader can observe the working state during an operation. In that
  case it degenerates into ADB-STATE-02.
- **When not viable:** Whenever preview or export can read working state during an operation.
  **Not viable for DeckAgent under current V1 constraints** in the observed form. Kept as negative
  evidence.

### ADB-STATE-02 — Isolated candidate area per operation, admitted into version slots

- **Decision family:** DF-STATE-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Each generation or refinement writes only into a private candidate area owned by that
    operation.
  - The accepted and pending slots change only when an admission step copies or moves a validated
    candidate into them.
  - Discarding the candidate area is the whole of rollback for the deck.
- **Addresses:** partially_solves AP-STATE-01, AP-OP-01; constrains AP-VALID-01 (the admission
  point is the validation point).
- **Why this mechanism exists:** AC-06, AC-08, and AC-28 require that nothing an operation does is
  visible or authoritative until admitted.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent applies each edit attempt to a fresh deep copy of the reference slide
    (F-PPT-07, F-PPT-08, ADR-PPT-06). That is isolation at slide-attempt level.
  - *Consequence:* A failed attempt does not corrupt the reference. But PPTAgent has no deck-level
    admission, and Web skips failed slides (F-PPT-07).
  - *DeckAgent reasoning:* The same isolation principle applied at deck level gives "no version
    unless admitted".
- **Assumptions:**
  - Accepted and pending slots are mutable holders.
  - Copying a deck into a slot is cheap enough.
- **Benefits:**
  - Stop, failure, and invalid results reduce to "discard candidate".
  - The recovery baseline is untouched by construction.
- **Trade-offs:** One more state area. The copy-in step must itself be atomic.
- **Risks / failure modes:**
  - The admission copy is interrupted, leaving a half-updated slot.
  - An operation holds a reference into slot state and mutates it indirectly.
- **Introduces / exposes:**
  - introduces_problem_candidate NPC-01 (version identity)
  - requires_followup_decision DF-STATE-02, DF-OP-01
- **Relationships:**
  - requires DF-OP-01 (admission must know the operation is still current).
  - compatible_with ADB-VALID-01, ADB-VALID-02, ADB-DELIV-05.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate: the isolation
  discipline must hold in every path.
- **Constraints / prerequisites:** Operations never receive writable references to slots.
- **Reversibility:** Medium. The admission contract is local, but every operation depends on it.
- **Evidence gaps:** AG-03 (affects confidence only).
- **Relevant Gates / Observability:** AC-06, AC-08, AC-28, AC-29, AC-17.
- **Known incompatibility:** None known.
- **When viable:** Deck size allows a candidate copy per operation.
- **When not viable:** If a result must be displayed progressively while it is being produced.
  AC-06 already forbids that.

### ADB-STATE-03 — Immutable version values with an authoritative reference set

- **Decision family:** DF-STATE-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Every deck state an operation produces is a new immutable version value.
  - The lifecycle holds only references: `accepted` (with its constraint set) and optionally
    `pending`.
  - Every transition is a reference change. Nothing mutates a version.
- **Addresses:** partially_solves AP-STATE-01, AP-DELIV-01 (stability), AP-OP-01; constrains
  AP-EXPORT-01, AP-SESSION-01.
- **Why this mechanism exists:**
  - Some invariants follow directly from immutability: export stability (AC-05), retention of
    exactly one baseline (BR-010 rule 8), and export outcomes traceable to a version (AC-30).
  - Immutability also **simplifies**, but does not by itself provide, atomic lifecycle transitions
    (AC-29). A transition still changes several things together: the `accepted` reference, the
    `pending` reference, and the paired constraint state. That requires one atomic authority
    update (DF-STATE-02 and NPC-02).
- **Origin:** Synthesis hypothesis. DOC-006 §4.2 lists a related aggregate; it was not used as
  evidence. This option is derived from AC-05, AC-29, and BR-010 rule 8.
- **Evidence:**
  - *Exists:* No reference system uses whole-deck immutable versions with a pending reference.
    OpenDesign snapshots HTML per file after a successful run (F-OD-05, F-OD-07); that is history,
    not authority.
  - *Consequence:* None observed.
  - *DeckAgent reasoning:* Because version values never change, a transition touches only
    references and constraint state, not deck content. Whether those references and the paired
    constraint state change "completely or not at all" (AC-29) depends on how they are updated
    together, which is DF-STATE-02 / NPC-02, not on immutability.
- **Assumptions:**
  - Structural sharing or copying of deck content is affordable.
  - Garbage collection of versions that are no longer referenced is acceptable.
- **Benefits:**
  - Export reads an unchanging value.
  - Versions carry an identity, which export records and session-loss evaluation can use.
  - The "before and after" states for AC-17 are just values.
  - A transition's atomic unit shrinks to references plus constraint state. No deck content is
    copied or mutated inside it.
- **Trade-offs:**
  - Retention and cleanup must be managed.
  - Every mutation path must produce a new value.
- **Risks / failure modes:**
  - An unreferenced version is kept (a memory or footprint issue; AP-DATA-01).
  - Someone mutates a "value" in place.
- **Introduces / exposes:**
  - introduces_problem_candidate NPC-01
  - creates_pressure_on AP-DATA-01 (retained values hold user content)
- **Relationships:**
  - requires DF-STATE-02 (ADB-STATE-05 or ADB-STATE-06), or NPC-02 resolution, for an atomic
    update of the `accepted` and `pending` references together with the paired constraint state.
  - compatible_with ADB-DELIV-04, ADB-EXPORT-01, ADB-SESSION-01, ADB-INTENT-01.
  - makes_unnecessary ADB-DELIV-05 (copy on export).
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate (immutability
  discipline).
- **Constraints / prerequisites:**
  - A deck representation that can be treated as a value (DF-DELIV-01 choice).
  - An atomic authority update covering references and constraints (DF-STATE-02 / NPC-02).
- **Reversibility:** Low. It becomes the domain model for generation, refinement, preview, and
  export.
- **Evidence gaps:** None blocking. No reference evidence (RG-03).
- **Relevant Gates / Observability:** AC-05, AC-06, AC-07, AC-17, AC-29, AC-30.
- **Known incompatibility:** None known.
- **When viable:** When the deck representation can be copied or shared cheaply.
- **When not viable:** When the working representation is a large mutable library object graph
  (for example an in-place PPTX object model; see ADB-DELIV-02) and copying it is costly or lossy.

### ADB-STATE-04 — Transition log as authority; versions derived by replaying transitions

- **Decision family:** DF-STATE-01
- **Option role:** Primary alternative
- **Mechanism:**
  - The authoritative state is an append-only log of lifecycle events: generated, refined, kept,
    rejected, promoted-at-boundary, exported, stopped, failed.
  - AI outputs are stored as payloads.
  - The current accepted and pending versions are derived by folding the log.
- **Addresses:** partially_solves AP-STATE-01, AP-SESSION-01, AP-EXPORT-01 (outcome record);
  constrains AP-OP-01.
- **Why this mechanism exists:**
  - AC-17 and AC-29 ask for observable transitions and identifiable commit points.
  - AC-30 asks for export outcomes by version.
  - A log records all of these by construction.
- **Origin:** Synthesis hypothesis.
- **Evidence:**
  - *Exists:* None in DOC-006 or DOC-007. OpenDesign's earlier `history.jsonl` was replaced
    (F-OD-17); that says nothing about a lifecycle log.
  - *DeckAgent reasoning:* Only the transitions matter for BR-010, and the log makes each one
    explicit.
- **Assumptions:**
  - Stored AI payloads are replayed as data; nothing regenerates.
  - The log is session-scoped (D-027).
- **Benefits:**
  - Complete observability for AC-17.
  - Commit points are explicit.
  - Export outcomes fall out of the log.
- **Trade-offs:**
  - Derived state must be recomputed or cached.
  - Folding rules duplicate BR-010 in code.
  - Heavier than V1's need for a single baseline (BR-010 rule 8).
- **Risks / failure modes:**
  - The fold logic diverges from BR-010.
  - The log grows within a long session.
  - Replaying the log is mistaken for regeneration.
- **Introduces / exposes:**
  - introduces_problem_candidate NPC-01
  - creates_pressure_on AP-DATA-01
- **Relationships:**
  - compatible_with ADB-EXPORT-01, ADB-SESSION-01.
  - To be established in Phase 3 against ADB-STATE-03.
- **Complexity:** Implementation high relative to V1. Operational low. Maintenance high (every
  rule is in the fold).
- **Constraints / prerequisites:** C-002 feasibility.
- **Reversibility:** Low.
- **Evidence gaps:** None blocking. AC-21 comparison needed.
- **Relevant Gates / Observability:** AC-17, AC-29, AC-30, AC-06.
- **Known incompatibility:** None known.
- **When viable:** When observability and auditability dominate and the team can carry the
  complexity.
- **When not viable:** If C-002 or AC-21 comparison shows the cost outweighs V1's single-baseline
  need. That is a trade-off, not a Gate.

## DF-STATE-02 — Transition authority and atomicity

**Selection mode:** choose-one

### ADB-STATE-05 — Single lifecycle authority as the only writer of version state

- **Decision family:** DF-STATE-02
- **Option role:** Primary alternative
- **Mechanism:**
  - One responsibility owns the accepted and pending versions, their constraint sets, and export
    outcomes.
  - Other parts request named transitions: keep, reject, promote-at-boundary, admit-result,
    promote-on-delivery, record-export, new-session.
  - The authority checks each request against BR-010 and applies it atomically.
- **Addresses:** partially_solves AP-STATE-01, AP-REQ-01, AP-EXPORT-01; constrains AP-OP-01,
  AP-SESSION-01.
- **Why this mechanism exists:**
  - AC-29 says "only through the events BR-010 defines".
  - Transitions arrive from three different paths: refinement, export, and user actions.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Consequence of not doing this:* OpenDesign's daemon is described as the product authority for
    files and versions (F-OD-06, §2.1), but versions change through runs, restores, and edits with
    no candidate gate (F-OD-07).
  - *DeckAgent reasoning:* A single writer makes BR-010 enforceable in one place.
- **Assumptions:** Every transition source can reach the authority synchronously enough.
- **Benefits:**
  - One place to verify BR-010.
  - Commit points are identifiable (AC-29).
  - It is the natural source for TN-6 status.
- **Trade-offs:**
  - The authority becomes central, and its blast radius grows (AC-23).
  - Coupling across K-1 and K-2.
- **Risks / failure modes:**
  - The authority accumulates unrelated logic.
  - A path bypasses it, for example export writing a flag directly.
- **Introduces / exposes:** creates_pressure_on AP-OP-02 (serializing transition requests).
- **Relationships:**
  - compatible_with ADB-STATE-02, ADB-STATE-03, ADB-STATE-04, ADB-EXPORT-01, ADB-SESSION-01,
    ADB-REQ-01.
  - Alternative to ADB-STATE-06.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** No other writer of version state exists.
- **Reversibility:** Medium.
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-29, AC-07, AC-09, AC-17, AC-30.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** If the deployment splits state across processes with no single owner
  (see ADB-SESSION-02 and ADB-DEP-03).

### ADB-STATE-06 — Distributed transitions guarded by version-identity checks

- **Decision family:** DF-STATE-02
- **Option role:** Primary alternative
- **Mechanism:**
  - Each path (export, refinement, keep and reject handlers) applies its own transition.
  - A path may apply a transition only if the version identity it read is still current
    (compare-and-set). Otherwise the transition is refused.
  - BR-010 rules are distributed across the paths.
- **Addresses:** partially_solves AP-STATE-01; constrains AP-EXPORT-01, AP-REQ-01.
- **Why this mechanism exists:** It avoids a central coordinator while still preventing stale
  writes.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* OpenDesign's task route applies a revision check when cancellation and completion
    compete (F-OD-14). That covers run status only.
  - *Consequence:* Status has a single winner, but files are not rolled back (F-OD-14).
    OpenDesign evidence is incomplete for the widened RQ-07 and RQ-14 aspects.
  - *DeckAgent reasoning:* Identity checks prevent stale writes but do not enforce which
    transitions are legal.
- **Assumptions:** Every path implements BR-010 correctly and consistently.
- **Benefits:** Paths stay independent. No single hot spot.
- **Trade-offs:**
  - BR-010 is duplicated.
  - Multi-part transitions (version plus constraint set plus outcome) need a shared atomic unit.
- **Risks / failure modes:**
  - Two paths encode different readings of BR-010.
  - Pairing drift: the deck half changes but the constraint half does not.
- **Introduces / exposes:** introduces_problem_candidate NPC-02 (multi-part atomicity).
- **Relationships:** Alternative to ADB-STATE-05. Requires NPC-01.
- **Complexity:** Implementation moderate. Operational moderate. Maintenance high (distributed
  rules).
- **Constraints / prerequisites:** Version identity (NPC-01).
- **Reversibility:** Medium.
- **Evidence gaps:** RG-01.
- **Relevant Gates / Observability:** AC-29, AC-07, AC-09.
- **Known incompatibility:** None known, but AC-29 "exactly one accepted" depends on every path
  being correct.
- **When viable:** Few transition paths and a disciplined shared rule set.
- **When not viable:** If paired deck and constraint state cannot be updated in one guarded step.

## DF-INTENT-01 — How constraints are held relative to versions and requests

**Selection mode:** choose-one

### ADB-INTENT-01 — Constraint set carried inside each version unit

- **Decision family:** DF-INTENT-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Every version (accepted or pending) carries the constraint set in effect for it.
  - A request's own constraints are held with that request until its commit boundary.
  - Rollback, reject, and promotion move deck and constraints together, as one unit.
- **Addresses:** partially_solves AP-INTENT-01, AP-STATE-01.
- **Why this mechanism exists:** BR-010 rules 5 and 7 and R-024 AC4 always move deck and
  constraints together.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Consequence of lacking it:* PPTAgent keeps request-derived fields on the coordinator object,
    with no rollback (F-PPT-20).
  - *DeckAgent reasoning:* Pairing makes UC-013 postcondition 2 and UC-004 3A, 3B, 4A mechanical.
- **Assumptions:**
  - The constraint set is small.
  - Constraints are structured enough to copy.
  - Lifetime rules (PA-06) can be applied when a new version is formed.
- **Benefits:**
  - Pairing is enforced by construction.
  - TN-1 reads directly from the version.
  - A P2 runtime check has the set at hand (T-P2-01).
- **Trade-offs:** Attribution beyond "which request produced this version" is coarse.
- **Risks / failure modes:**
  - Single-refinement constraints (BR-003 exception) leak into later versions if lifetime is not
    applied.
  - A late lifetime rule from PA-06 needs history the version does not keep.
- **Introduces / exposes:** creates_pressure_on AP-VALID-01 (the constraint set is available at
  the validation point).
- **Relationships:** compatible_with ADB-STATE-02, ADB-STATE-03, ADB-STATE-05, ADB-REQ-01.
- **Complexity:** Implementation low to moderate. Operational low. Maintenance low.
- **Constraints / prerequisites:** Constraints are captured as structured state, not only as
  prompt text.
- **Reversibility:** Medium.
- **Evidence gaps:** RG-08 (there is no reference evidence).
- **Relevant Gates / Observability:** AC-04, AC-07, AC-28, AC-29, AC-17.
- **Known incompatibility:** None known.
- **When viable:** Whenever PA-06 rules can be applied at version-formation time.
- **When not viable:** If PA-06 later needs per-constraint history across many versions. That is
  multi-step history, which V1 excludes.

### ADB-INTENT-02 — Attributed constraint ledger; versions reference a ledger position

- **Decision family:** DF-INTENT-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Each constraint is recorded with the request that introduced it and a status: pending-request,
    applied, cancelled, or superseded.
  - A version references the ledger state that applied to it.
  - Reject, rollback, and cancel mark the request's constraints cancelled rather than copying
    sets.
- **Addresses:** partially_solves AP-INTENT-01, AP-STATE-01.
- **Why this mechanism exists:**
  - AC-07 wants constraints "attributable to the request that introduced them".
  - PA-06 (lifetime, single-refinement constraints) may later need per-constraint metadata.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** *DeckAgent reasoning:* This is the only option here where attribution is
  first-class. No reference evidence (RG-08).
- **Assumptions:** Constraints can be recognized as discrete items.
- **Benefits:**
  - Accommodates several PA-06 answers (expiry, single-refinement scope, conflict records).
  - Readable for TN-1.
- **Trade-offs:**
  - A second structure to keep consistent with versions. Pairing is by reference, not by
    construction.
- **Risks / failure modes:**
  - The ledger position and the version drift apart after an interrupted transition.
  - Status bugs let a cancelled constraint re-apply.
- **Introduces / exposes:**
  - introduces_problem_candidate NPC-02
  - requires_followup_decision DF-STATE-02
- **Relationships:**
  - requires an atomic update covering version and ledger position (ADB-STATE-05, or NPC-02).
  - compatible_with ADB-STATE-03, ADB-STATE-04.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** A shared atomic unit with the version references.
- **Reversibility:** Medium.
- **Evidence gaps:** RG-08.
- **Relevant Gates / Observability:** AC-04, AC-07, AC-28, AC-29, AC-17.
- **Known incompatibility:** None known.
- **When viable:** When PA-06 is expected to need per-constraint lifecycle.
- **When not viable:** If V1 feasibility (AC-21) favours pairing by construction and PA-06 stays
  simple. That is a trade-off.

### ADB-INTENT-03 — Constraints re-derived from the admitted request history

- **Decision family:** DF-INTENT-01
- **Option role:** Primary alternative
- **Mechanism:**
  - The system keeps the sequence of admitted requests (natural language), not a structured
    constraint set.
  - Each operation derives the effective constraints from that history, for example as model
    context.
  - Rejected, cancelled, or rolled-back requests are removed from, or marked out of, the history.
- **Addresses:** partially_solves AP-INTENT-01.
- **Why this mechanism exists:** It avoids a constraint schema. Intent stays in the user's own
  words.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* OpenDesign composes intent from conversation messages, project instructions, and
    per-turn additions (F-OD-03).
  - *Consequence:* No single typed record of active constraints exists, so the active set is hard
    to inspect (F-OD-03, DOC-007 §5.1).
  - *DeckAgent reasoning:* TN-1 and a P2 runtime check need a readable active set, and
    re-derivation by a model is non-deterministic (DOC-008 §2.5).
- **Assumptions:** The model reliably honours the history, and a readable active set is not needed
  at runtime.
- **Benefits:**
  - No constraint model to design.
  - Tolerant of any PA-06 answer that can be expressed in language.
- **Trade-offs:**
  - TN-1 is only indirectly possible.
  - A P2 runtime check has no explicit set to check against.
  - Context grows with the number of turns.
- **Risks / failure modes:**
  - An old constraint is forgotten, or conflicting ones are silently blended (A-013).
  - Derivation differs between generation and validation.
- **Introduces / exposes:**
  - introduces_problem_candidate NPC-05 (determinism of constraint derivation)
  - creates_pressure_on AP-VALID-01
- **Relationships:** conflicts_with ADB-VALID-01 and ADB-VALID-02 when PA-04 selects P2 runtime
  checks, because there is no explicit set at the validation point.
- **Complexity:** Implementation low. Operational moderate. Maintenance moderate.
- **Constraints / prerequisites:** Request history is session-scoped.
- **Reversibility:** High. It can be replaced by an explicit set later without restructuring
  versions.
- **Evidence gaps:** RG-01 (OpenDesign constraint survival is incomplete).
- **Relevant Gates / Observability:** AC-04, AC-07, AC-17 (indirect only).
- **Known incompatibility:** None known against Gates. AC-04 only requires availability.
- **When viable:** If PA-04 excludes runtime P2 checks and AC-25 accepts indirect testing of R-001.
- **When not viable:** If Product requires runtime P2 checks (PA-04), or if TN-1 is weighted
  heavily.

## DF-REQ-01 — Where the refinement commit boundary is committed

**Selection mode:** choose-one

### ADB-REQ-01 — Non-mutating pre-flight, then one explicit commit transition

- **Decision family:** DF-REQ-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Pre-flight (interpret, clarify, warn, confirm, refuse) works on a draft request object only.
  - When pre-flight is complete, one explicit commit transition, owned by the lifecycle authority,
    does three things in this order: promote any pending version, set the accepted constraint set,
    and apply the request's constraints. It then hands the operation its baseline.
  - The operation starts only after the commit.
- **Addresses:** partially_solves AP-REQ-01, AP-STATE-01, AP-INTENT-01.
- **Why this mechanism exists:** D-030 and BR-010 rules 4–5 require pre-flight to change nothing
  and require that ordering at the boundary.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** *DeckAgent reasoning:* D-030 rationale: "pre-flight doesn't change version state;
  commit creates a new baseline". No reference system has a commit boundary (RG-03; F-PPT-07,
  F-OD-07).
- **Assumptions:** Pre-flight can end deterministically: nothing is left to clarify, warn about,
  or confirm.
- **Benefits:**
  - The boundary is one identifiable point (AC-29).
  - A test can hold the operation right after it (DOC-008 §6.3).
  - Cancel or refusal before it trivially changes nothing.
- **Trade-offs:** The commit and the operation start are two steps, so their gap needs a rule.
- **Risks / failure modes:**
  - A crash between commit and operation start leaves a promoted version with no operation. That
    is consistent with BR-010 (the promotion stands), but a status is needed.
- **Introduces / exposes:** requires_followup_decision DF-OP-01 (how the operation is bound to its
  baseline).
- **Relationships:**
  - requires ADB-STATE-05 or an equivalent atomic unit.
  - compatible_with ADB-INTENT-01, ADB-INTENT-02, ADB-OP-01.
  - Alternative to ADB-REQ-02.
- **Complexity:** Implementation low to moderate. Operational low. Maintenance low.
- **Constraints / prerequisites:** Draft requests are held outside version state.
- **Reversibility:** High.
- **Evidence gaps:** None blocking (RG-03: no reference evidence).
- **Relevant Gates / Observability:** AC-29, AC-04, AC-07, AC-17.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** If SA-01 resolves so that a running generation can pause for input and
  resume. In that case pre-flight-like interaction also happens after commit, and this option
  covers only refinements (see NPC-04).

### ADB-REQ-02 — Commit performed by the operation runner as its first atomic step

- **Decision family:** DF-REQ-01
- **Option role:** Primary alternative
- **Mechanism:**
  - The operation runner is started with the ready request.
  - Its first step, atomically with registering itself as the running operation, performs the
    promotion and constraint application.
  - The boundary is literally "the operation begins".
- **Addresses:** partially_solves AP-REQ-01, AP-OP-02; constrains AP-STATE-01.
- **Why this mechanism exists:** D-030 places the boundary "immediately before the AI operation
  begins". Fusing the two removes the gap left by ADB-REQ-01.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** *DeckAgent reasoning* only. RG-03.
- **Assumptions:** The runner may write lifecycle state, or may call the authority within its
  atomic start.
- **Benefits:**
  - No window between commit and start.
  - Exclusivity and commit happen together (BR-014).
- **Trade-offs:**
  - The runner and the lifecycle are coupled.
  - The runner needs write authority over versions, which conflicts with a sole-writer design
    unless it delegates.
- **Risks / failure modes:**
  - The runner fails mid-start and leaves the promotion half-applied.
  - Promotion logic leaks into operation code.
- **Introduces / exposes:** creates_pressure_on AP-STATE-01 (who writes).
- **Relationships:**
  - Its tension with ADB-STATE-05 (runner writes versus sole writer) is resolvable only if the
    runner calls the authority. Phase 3 analysis required.
  - compatible_with ADB-OP-06.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** An atomic start that covers registration and promotion.
- **Reversibility:** Medium.
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-29, AC-28 (one at a time), AC-17.
- **Known incompatibility:** None known.
- **When viable:** When operation start and the lifecycle live in the same place.
- **When not viable:** If operations run in a separate process from the lifecycle (ADB-DEP-03)
  without a transactional start.

### ADB-REQ-03 — Promote the pending version when a new request is submitted

- **Decision family:** DF-REQ-01
- **Option role:** Negative evidence
- **Mechanism:** Submitting a refinement request immediately promotes the pending version, before
  any pre-flight.
- **Addresses:** None of the frozen APs (negative evidence).
- **Why this mechanism exists:** It was the other plausible reading that D-030 considered and
  rejected (D-030 context 2).
- **Origin:** Derived from DeckAgent constraints (a rejected alternative recorded in PH).
- **Evidence:** D-030 context and rationale 1–4. BR-010 rule 4.
- **Assumptions:** —
- **Benefits:** Simplest.
- **Trade-offs:** —
- **Risks / failure modes:** Cancelling during clarification would still accept the pending
  version.
- **Introduces / exposes:** —
- **Relationships:** conflicts_with ADB-REQ-01, ADB-REQ-02.
- **Complexity:** Low throughout.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** —
- **Relevant Gates / Observability:** AC-29.
- **Known incompatibility:** It contradicts BR-010 rule 4 and D-030.
- **When viable:** Never under the current Project Hub.
- **When not viable:** **Not viable for DeckAgent under current V1 constraints.** It becomes
  relevant only if D-030's reopen condition fires.

---

## 5. Operation and concurrency mechanisms (K-4)

## DF-OP-01 — Operation lifetime strong enough to reject late results

**Selection mode:** base + optional complements (base: OP-01 or OP-02; complement: OP-03)

### ADB-OP-01 — Explicit operation record with identity and terminal state, checked at admission

- **Decision family:** DF-OP-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Each generation or refinement gets an operation record containing:
    - an identity;
    - its recovery baseline (the version at its commit boundary);
    - a state: running, done, stopped, or error.
  - Stop, failure, and completion all try to move the record to a terminal state.
  - Admitting a result into version state requires that the result's operation identity is the
    current running operation. The admission is one step with the terminal transition to `done`.
  - Results for any other identity are discarded.
- **Addresses:** partially_solves AP-OP-01, AP-OP-02; constrains AP-DEP-01, AP-STATE-01.
- **Why this mechanism exists:**
  - AC-28: a result arriving after a stop creates no version.
  - AC-20: terminal state is reportable.
  - RK-007: late results.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* OpenDesign's run manager owns status, cancellation, and a revision check for the
    cancel-versus-complete race (F-OD-14).
  - *Consequence:* In OpenDesign the status determinacy does not extend to artifact state (late
    file writes remain; F-OD-14). OpenDesign evidence is incomplete for the RQ-14 aspect of
    constraint restoration.
  - PPTAgent has no operation identity or stop at all (F-PPT-19); that is absence.
  - *DeckAgent reasoning:* Putting the identity check at the admission point, not only in status,
    closes the gap F-OD-14 exposes.
- **Assumptions:** Every path by which a result reaches version state passes through admission.
- **Benefits:**
  - Physical cancellation is unnecessary (AC-28 does not require it).
  - Terminal state and cause are reportable (AC-20).
  - Tests can hold and release responses and check admission (TN-3).
- **Trade-offs:**
  - Outstanding external work may continue and cost money (RK-007 cost half, not a criterion).
  - Needs a strict "no side channel" rule.
- **Risks / failure modes:**
  - An external component writes into shared state directly, bypassing admission (compare
    F-OD-14 late writes).
  - Identity is reused after a stop.
- **Introduces / exposes:**
  - introduces_problem_candidate NPC-01 (identity scheme shared with versions)
  - creates_pressure_on AP-DEP-01 (external results must not have write access)
- **Relationships:**
  - compatible_with ADB-STATE-02, ADB-STATE-03, ADB-REQ-01, ADB-OP-04, ADB-OP-06, ADB-DEP-01.
  - makes_unnecessary ADB-OP-03 as a correctness mechanism.
- **Complexity:** Implementation moderate. Operational low. Maintenance low to moderate.
- **Constraints / prerequisites:** A candidate-isolation option from DF-STATE-01 (other than
  ADB-STATE-01).
- **Reversibility:** Medium.
- **Evidence gaps:** AG-03 affects the cost picture, not correctness. RG-01. RG-02 (absence
  only).
- **Relevant Gates / Observability:** AC-28, AC-08, AC-20, AC-17.
- **Known incompatibility:** None known.
- **When viable:** When all writes to version state go through one admission point.
- **When not viable:** If the AI runtime writes directly into shared deck state (ADB-DEP-02 in its
  observed form).

### ADB-OP-02 — Per-operation coordinator whose lifetime bounds where results can land

- **Decision family:** DF-OP-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Each operation creates a fresh coordinator object that holds all request-derived and working
    state.
  - Results can reach the lifecycle only through that coordinator.
  - On stop or failure the coordinator is detached, so its late results have nowhere to go.
- **Addresses:** partially_solves AP-OP-01, AP-INTENT-01 (request state isolation).
- **Why this mechanism exists:** Object lifetime gives isolation without an explicit identity
  check.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* The PPTAgent Web path builds a fresh `PPTAgent` per task, so a failed task's request
    state is not reused (F-PPT-20, ADR-PPT-03).
  - *Consequence:* Isolation is a property of the adapter's lifetime, not a core invariant.
    PPTAgent has no stop, and a reused object keeps stale fields (F-PPT-20, F-PPT-19).
  - *DeckAgent reasoning:* Detachment works only if nothing else holds a reference that the
    coordinator could still write through.
- **Assumptions:**
  - Detachment is itself atomic with respect to a completing result.
  - The coordinator holds no reference to slot state.
- **Benefits:**
  - Request-derived state is naturally discarded (relevant to SA-04).
  - Little bookkeeping.
- **Trade-offs:**
  - Isolation is implicit. A completing result racing with detachment still needs a rule.
- **Risks / failure modes:**
  - A late callback still holds a lifecycle handle.
  - A detached coordinator keeps running and consuming resources.
- **Introduces / exposes:** requires_followup_decision DF-OP-02 (race resolution).
- **Relationships:**
  - compatible_with ADB-STATE-02.
  - Needs DF-OP-02 to meet the "exactly one" clause of AC-28.
  - Phase 3 must analyze it versus ADB-OP-01.
- **Complexity:** Implementation low. Operational low. Maintenance moderate (implicit rules).
- **Constraints / prerequisites:** No shared mutable handles.
- **Reversibility:** High.
- **Evidence gaps:** RG-02 (PPTAgent shows lifetime isolation only, never stop).
- **Relevant Gates / Observability:** AC-28, AC-08, AC-04.
- **Known incompatibility:** None inherent. Alone it does not resolve a coinciding stop and
  completion.
- **When viable:** Combined with an explicit race rule.
- **When not viable:** As the only mechanism, if results are delivered by callbacks that hold
  lifecycle references.

### ADB-OP-03 — Physical cancellation of outstanding external work as the stop mechanism

- **Decision family:** DF-OP-01
- **Option role:** Complementary mechanism — viable only as a cost/resource complement to OP-01 or OP-02
- **Mechanism:** Stop cancels the in-flight external calls (aborts requests, kills the worker) and
  relies on "no call means no late result".
- **Addresses:** partially_solves AP-OP-01 (terminal state), AP-DEP-01 (cost half of RK-007).
- **Why this mechanism exists:** It stops cost and resource use (RK-007 second half) and makes
  late results rarer.
- **Origin:** Synthesis hypothesis.
- **Evidence:**
  - *Exists:* OpenDesign's run manager terminates processes on cancel (F-OD-14). DOC-007 names
    cancellation as a runtime-registry responsibility (§2.1).
  - *Consequence:* Partial or late writes can still remain after termination (F-OD-14).
  - *DeckAgent reasoning:* AC-28 does not require cancelling the external call. Cancellation is
    not guaranteed across providers (AG-03).
- **Assumptions:** Every external dependency supports prompt, reliable cancellation.
- **Benefits:** Lower cost after stop. Simpler mental model.
- **Trade-offs:** Correctness would depend on provider behaviour.
- **Risks / failure modes:**
  - A response already in flight still arrives.
  - A killed worker leaves temporary files behind (AP-DATA-01).
- **Introduces / exposes:** creates_pressure_on AP-DATA-01, AP-DEP-01.
- **Relationships:** compatible_with ADB-OP-01 as a complement; alone it is insufficient.
- **Complexity:** Implementation moderate. Operational moderate. Maintenance moderate.
- **Constraints / prerequisites:** Cancellable calls.
- **Reversibility:** High.
- **Evidence gaps:** **AG-03 would require a spike before W-035** if this option is relied on.
- **Relevant Gates / Observability:** AC-28, AC-20.
- **Known incompatibility:** As the sole mechanism it cannot guarantee "no version from a late
  result". **Not viable for DeckAgent under current V1 constraints as the sole mechanism.** Viable
  as a complement.
- **When viable:** As a cost and resource complement to ADB-OP-01 or ADB-OP-02.
- **When not viable:** As the only guard.

## DF-OP-02 — Resolving a coinciding stop and completion

**Selection mode:** choose-one

### ADB-OP-04 — Single atomic terminal transition: the first to reach it wins

- **Decision family:** DF-OP-02
- **Option role:** Primary alternative
- **Mechanism:**
  - Stop, failure, and completion-with-admission each attempt one atomic transition of the
    operation from running to terminal.
  - Exactly one succeeds. The others become no-ops.
- **Addresses:** partially_solves AP-OP-01.
- **Why this mechanism exists:** AC-28: "exactly one of them takes effect".
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* OpenDesign's revision-checked task cancellation (F-OD-14).
  - *Consequence:* The status winner is clear there. Whether the result is admitted is not bound
    to it in OpenDesign.
- **Assumptions:** Admission and the terminal transition are the same atomic step.
- **Benefits:** Deterministic. Testable with hold-and-release (TN-3).
- **Trade-offs:** Admission must be short, or it lengthens the window during which a stop is
  refused.
- **Risks / failure modes:** Admission includes slow validation, so a stop arriving during
  validation must also be defined. That links to AP-VALID-01 placement.
- **Introduces / exposes:** introduces_problem_candidate NPC-03 (whether stop can pre-empt a
  running validation).
- **Relationships:**
  - requires ADB-OP-01 or ADB-OP-02.
  - Interacts with the ADB-VALID-01 and ADB-VALID-02 durations. Phase 3 analysis required.
- **Complexity:** Low throughout.
- **Constraints / prerequisites:** An atomic compare-and-set on the operation state.
- **Reversibility:** High.
- **Evidence gaps:** RG-01.
- **Relevant Gates / Observability:** AC-28, AC-20.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-OP-05 — Serialize all operation events through one ordered channel

- **Decision family:** DF-OP-02
- **Option role:** Primary alternative
- **Mechanism:**
  - Stop requests, external responses, failures, and user actions become events on one ordered
    channel.
  - A single handler processes them in order, so arrival order decides the outcome.
- **Addresses:** partially_solves AP-OP-01, AP-OP-02.
- **Why this mechanism exists:** It gives one ordering for the race and for concurrent user
  actions (SA-02, SA-03) at the same time.
- **Origin:** Synthesis hypothesis.
- **Evidence:** No reference system. *DeckAgent reasoning:* BR-014 and AC-28 both need a single
  ordering.
- **Assumptions:** Every event source can enqueue. The handler never blocks on long work.
- **Benefits:**
  - Race outcomes are reproducible when a test controls ordering (TN-3).
  - The same channel can enforce BR-014.
- **Trade-offs:**
  - Long-running work must be off the channel, with only its events on it.
  - Adds indirection.
- **Risks / failure modes:**
  - The handler blocks on validation or export, so stop latency grows.
  - Events arrive out of order across process boundaries.
- **Introduces / exposes:** creates_pressure_on AP-DELIV-01 (export events on the same channel).
- **Relationships:** compatible_with ADB-OP-07, ADB-STATE-05. It is an alternative to ADB-OP-04
  for race resolution.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** A non-blocking handler.
- **Reversibility:** Medium.
- **Evidence gaps:** None blocking.
- **Relevant Gates / Observability:** AC-28, AC-20, AC-05 (export stability, if export events are
  serialized).
- **Known incompatibility:** None known.
- **When viable:** When most state-changing actions already pass through one owner.
- **When not viable:** When the architecture spans processes without an ordered transport.

## DF-OP-03 — Enforcing single-operation exclusivity

**Selection mode:** choose-one (OP-06 or OP-07); OP-08 only as a UX add-on

### ADB-OP-06 — Session-level single operation slot checked at admission of new operations

- **Decision family:** DF-OP-03
- **Option role:** Primary alternative
- **Mechanism:**
  - The session holds at most one running AI operation.
  - Starting a new operation atomically claims the slot, or is refused with "wait or stop"
    (UC-014 2C).
  - Other actions consult a policy table for what they may do while the slot is occupied.
- **Addresses:** partially_solves AP-OP-02; constrains AP-SESSION-01, AP-EXPORT-01.
- **Why this mechanism exists:** BR-014 rule 1 and AC-28 ("what prevents a second operation from
  starting and committing").
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Consequence of absence:* PPTAgent jobs overlap freely (F-PPT-19). OpenDesign chat can briefly
    overlap during "send now" (F-OD-14).
  - *DeckAgent reasoning:* A slot claimed atomically with the start (compare ADB-REQ-02) closes
    the double-start window.
- **Assumptions:**
  - One session per running app instance.
  - The policy table can express any SA-02 or SA-03 answer.
- **Benefits:**
  - Simple and directly testable.
  - Accommodates Product's answer on export concurrency as a policy row.
- **Trade-offs:** The policy table is a new artifact that has to be maintained.
- **Risks / failure modes:**
  - A second browser tab or window opens its own session and bypasses the slot (NPC-06).
  - The slot is not released after a crash, so the session is stuck.
- **Introduces / exposes:** introduces_problem_candidate NPC-06 (multiple client views of one
  session).
- **Relationships:** compatible_with ADB-OP-01, ADB-OP-04, ADB-REQ-01, ADB-REQ-02, ADB-DELIV-06.
- **Complexity:** Low throughout.
- **Constraints / prerequisites:** A single authority for session state.
- **Reversibility:** High.
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-28, AC-05, AC-09, AC-30.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-OP-07 — Serialized command channel for all state-changing user actions

- **Decision family:** DF-OP-03
- **Option role:** Primary alternative
- **Mechanism:**
  - Every state-changing action (request, keep, reject, export, new deck, stop) is a command on one
    ordered channel.
  - A long AI operation occupies the channel's "operation" lane.
  - Other commands are admitted, queued, or refused by rule.
- **Addresses:** partially_solves AP-OP-02, AP-OP-01; constrains AP-DELIV-01, AP-SESSION-01.
- **Why this mechanism exists:** SA-02 and SA-03 remain open. A single ordering makes any answer
  enforceable in one place.
- **Origin:** Synthesis hypothesis.
- **Evidence:** No reference system. *DeckAgent reasoning* only.
- **Assumptions:** Commands are small. Long work runs outside the channel.
- **Benefits:** One ordering covers BR-014, the stop race (compare ADB-OP-05), and export
  stability.
- **Trade-offs:** More structure than the V1 need. Queued commands need status visibility (R-030).
- **Risks / failure modes:**
  - Queued keep or export commands execute against a version that changed while they waited.
- **Introduces / exposes:** creates_pressure_on AP-REQ-01 (where pre-flight sits relative to the
  channel).
- **Relationships:** compatible_with ADB-OP-05, ADB-STATE-05. It is an alternative to ADB-OP-06.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** A single session owner.
- **Reversibility:** Medium.
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-28, AC-05, AC-29.
- **Known incompatibility:** None known.
- **When viable:** If Product's answers to SA-02 and SA-03 involve many concurrent-action rules.
- **When not viable:** If AC-21 comparison favours minimal structure.

### ADB-OP-08 — Client-side prevention only (UI disables actions while running)

- **Decision family:** DF-OP-03
- **Option role:** Negative evidence — as enforcement; admissible only as a UX complement to OP-06 or OP-07
- **Mechanism:** The UI disables request, keep, reject, and export controls during an operation.
  There is no structural check.
- **Addresses:** None structurally (negative evidence).
- **Why this mechanism exists:** It is the cheapest way to meet UC-014 2C visually.
- **Origin:** Synthesis hypothesis.
- **Evidence:**
  - *DeckAgent reasoning:* AC-28 asks "what prevents a second operation from starting **and
    committing**". A reload, a second tab, or a direct call bypasses UI state.
  - PPTAgent's frontend-only lifecycle shows socket-coupled accidental behaviour (F-PPT-18).
- **Assumptions:** One UI instance per session and no programmatic access.
- **Benefits:** Trivial.
- **Trade-offs:** —
- **Risks / failure modes:** Two operations commit after a reload or with multiple views.
- **Introduces / exposes:** NPC-06.
- **Relationships:** conflicts_with the AC-28 evidence line. Superseded by ADB-OP-06 and
  ADB-OP-07.
- **Complexity:** Low.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** AG-09 (reload behaviour).
- **Relevant Gates / Observability:** AC-28.
- **Known incompatibility:** It cannot structurally prevent a second commit. **Not viable for
  DeckAgent under current V1 constraints as the sole mechanism.** It may complement a structural
  option.
- **When viable:** Only as a UX complement.
- **When not viable:** As the enforcement mechanism.

---

## 6. Validation, observability, and provenance mechanisms (K-3)

## DF-VALID-01 — Where AI-result validation is placed relative to admission

**Selection mode:** base + optional complements (base: VALID-01 or VALID-02; complements: VALID-03, VALID-04)

### ADB-VALID-01 — Single inline admission gate running all selected checks

- **Decision family:** DF-VALID-01
- **Option role:** Primary alternative
- **Mechanism:**
  - One gate sits between "operation produced a candidate" and "candidate admitted as a version".
  - It runs every check Product selects (PA-04) before admission, including any geometry or render
    checks.
  - A fail leads to an error outcome and the recovery baseline.
- **Addresses:** partially_solves AP-VALID-01; constrains AP-OP-01, AP-OBS-01, AP-STATE-01.
- **Why this mechanism exists:** AC-06 says nothing is displayed or admitted before validation.
  AC-10 says validation is possible at every admission point.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Consequence of lacking it:* OpenDesign's completion validator checks integrity only, and live
    preview is not behind it (F-OD-09). OpenDesign evidence is incomplete for the RQ-09 aspect of
    "the state returned to after a failed check".
  - PPTAgent's PPTEval is post-hoc and has no effect on state (F-PPT-09).
  - DOC-008 §5.3 lists which checks are feasible at runtime.
- **Assumptions:**
  - Everything each selected check needs exists at the gate: origin, constraint set, geometry.
  - PA-04 answer: any.
- **Benefits:**
  - One place to observe the verdict (TN-2).
  - A clean fail path to the baseline.
- **Trade-offs:**
  - Gate latency adds to the operation, which lengthens the stop window (NPC-03).
  - If geometry or render checks are selected, the renderer is on the admission path (NPC-07).
- **Risks / failure modes:**
  - A slow render check makes the operation feel hung, pressuring R-030 and R-032 bounds.
  - Renderer failure becomes operation failure.
- **Introduces / exposes:**
  - introduces_problem_candidate NPC-03, NPC-07
  - creates_pressure_on AP-DEP-01
- **Relationships:**
  - requires DF-OBS-01 (if geometry checks are selected), DF-PROV-01 (if P1 checks are selected),
    DF-INTENT-01 (if P2 checks are selected; T-P2-01).
  - conflicts_with ADB-STATE-01, and with ADB-INTENT-03 when P2 checks are selected.
  - compatible_with ADB-STATE-02, ADB-STATE-03, ADB-OP-04.
- **Complexity:** Implementation moderate. Operational moderate (renderer in the path).
  Maintenance moderate.
- **Constraints / prerequisites:** An isolated candidate (DF-STATE-01 options 02, 03, or 04).
- **Reversibility:** Medium.
- **Evidence gaps:** AG-01a and AG-01b affect confidence and cost. AG-08 is resolved by §1.
- **Relevant Gates / Observability:** AC-06, AC-10, AC-14, AC-16, AC-04.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** Only if some selected check cannot run before display, for example HM-1 or
  HM-4 with ADB-OBS-03.

### ADB-VALID-02 — Two-stage pre-admission validation: structural first, then layout or render evidence

- **Decision family:** DF-VALID-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Stage 1: cheap structural and content checks on the candidate (schema, empty slide, and P1 and
    P2 checks if selected).
  - Stage 2: produce post-layout geometry and, if needed, a rendered image, then run HM-1, HM-3
    render, and HM-4 checks.
  - Both stages complete before admission. Stage 1 failure short-circuits.
- **Addresses:** partially_solves AP-VALID-01, AP-OBS-01.
- **Why this mechanism exists:** DOC-008 §5.3 separates checks that need only content from checks
  that need geometry or rendering (T-P2-02).
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* OpenDesign layers source lint, preview geometry telemetry, Chromium render, and an
    optional audit (F-OD-10).
  - *Consequence:* In OpenDesign the layers are fragmented and optional, and not all of them gate
    anything (F-OD-10).
  - *DeckAgent reasoning:* Here both stages must gate admission.
- **Assumptions:** A geometry-producing step can run inside the operation (AG-01a).
- **Benefits:**
  - Cheap failures are fast.
  - Expensive evidence is produced only for plausible candidates.
  - Each stage's verdict is distinct (TN-2).
- **Trade-offs:** Two validation contracts. Stage 2 output (geometry) becomes a product artifact.
- **Risks / failure modes:**
  - Stage 2 geometry differs from export geometry, so R-028 holds only nominally.
- **Introduces / exposes:** NPC-07, NPC-03.
- **Relationships:**
  - requires ADB-OBS-01 or ADB-OBS-02.
  - conflicts_with ADB-OBS-03 for pre-display HM-1 and HM-4.
  - compatible_with ADB-VALID-07.
- **Complexity:** Implementation moderate to high. Operational moderate. Maintenance moderate.
- **Constraints / prerequisites:** A geometry source before display.
- **Reversibility:** Medium.
- **Evidence gaps:** **AG-01a would require a spike before W-035** (can layout geometry be
  produced before display at acceptable cost?).
- **Relevant Gates / Observability:** AC-06, AC-10, AC-14, AC-18.
- **Known incompatibility:** None known.
- **When viable:** If PA-04 or R-033 needs P3 geometry checks before display.
- **When not viable:** If no geometry exists before export (with ADB-OBS-03).

### ADB-VALID-03 — Admission gate plus non-gating post-admission evaluation

- **Decision family:** DF-VALID-01
- **Option role:** Complementary mechanism — non-gating lane alongside VALID-01 or VALID-02
- **Mechanism:**
  - The admission gate runs only the checks Product requires at runtime.
  - Further quality evaluation (candidate criteria RG-1 … RG-7, LLM-judge, rubric support) runs
    after admission, is recorded, and changes no state.
- **Addresses:** partially_solves AP-VALID-01, AP-OBS-01.
- **Why this mechanism exists:**
  - D-028 candidate criteria are "measured, never failing".
  - Evaluation cost should not sit on the admission path.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent's PPTEval is a separate post-hoc evaluator (F-PPT-09, ADR-PPT-08).
    OpenDesign's optional fidelity audit is another example (F-OD-10, F-OD-13).
  - *Consequence:* Post-hoc results cannot stop an artifact that already exists (F-PPT-09).
  - *DeckAgent reasoning:* This is acceptable only for checks that are not gates.
- **Assumptions:** PA-04 keeps some checks test-only or candidate-level.
- **Benefits:**
  - Keeps admission latency low.
  - Builds D-028 evidence.
- **Trade-offs:** Two evaluation locations, and the post-admission one needs its own observability.
- **Risks / failure modes:** A check that later becomes a hard gate (after D-028 is reopened) is
  left in the non-gating stage by mistake.
- **Introduces / exposes:** creates_pressure_on AP-OBS-01.
- **Relationships:**
  - compatible_with ADB-VALID-01 and ADB-VALID-02 as a complement.
  - Alone it conflicts_with AC-06 for any required check.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** A rendered view is available after admission (DF-OBS-02).
- **Reversibility:** High.
- **Evidence gaps:** None blocking.
- **Relevant Gates / Observability:** AC-10, AC-18, AC-25.
- **Known incompatibility:** Used alone for a required check, it would let an unvalidated result
  be admitted. It is viable only as a complement.
- **When viable:** As the evaluation lane for non-gating D-028 items.
- **When not viable:** As the only validation.

### ADB-VALID-04 — Per-part validation with local retry during generation, then deck-level admission

- **Decision family:** DF-VALID-01
- **Option role:** Complementary mechanism — inner retry inside the operation; requires VALID-01 or VALID-02 as the deck-level gate, and assumes part-based generation (NPC-08)
- **Mechanism:**
  - Inside the operation, each generated part (slide or element set) is validated and retried
    locally with feedback.
  - The assembled deck then passes a deck-level admission gate, which must include completeness:
    no dropped slides.
- **Addresses:** partially_solves AP-VALID-01, AP-OP-01; constrains AP-DEP-01.
- **Why this mechanism exists:** It catches AI output errors early and cheaply. Self-correction
  improves the chance of a valid deck.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent validates editor output and API execution for each slide attempt, retries
    with traceback feedback, and works from fresh copies (F-PPT-07, F-PPT-08, ADR-PPT-06).
  - *Consequence:* With `error_exit=False`, failed slides are skipped and a partial deck is
    produced (F-PPT-07). The paper uses up to 2 retries; the code uses 3 to 5.
  - *DeckAgent reasoning:* Skipping would break HM-2 and HM-3. The deck-level gate must reject
    incomplete decks.
- **Assumptions:** Retry counts are bounded (values deferred per D-011).
- **Benefits:**
  - Local failures are contained.
  - Cheaper than regenerating the whole deck.
- **Trade-offs:**
  - Retries lengthen operations and increase stop windows and cost.
  - Two validation levels to maintain.
- **Risks / failure modes:**
  - A partial deck is admitted.
  - Retry loops interact with stop.
- **Introduces / exposes:** creates_pressure_on AP-OP-01 (stop during retry), AP-DEP-01.
- **Relationships:**
  - compatible_with ADB-VALID-01 and ADB-VALID-02 (as the deck-level gate).
  - requires ADB-OP-01 or ADB-OP-02.
- **Complexity:** Implementation moderate to high. Operational moderate. Maintenance moderate.
- **Constraints / prerequisites:** A generation approach that works in parts. That is a
  generation-design choice not covered by any AP (NPC-08).
- **Reversibility:** Medium.
- **Evidence gaps:** RG-05 (PPTAgent Web path not verified).
- **Relevant Gates / Observability:** AC-06, AC-08, AC-10, AC-28.
- **Known incompatibility:** Without the deck-level completeness gate, a partial deck could be
  admitted. That form conflicts with the D-028 hard minimum.
- **When viable:** If generation is decomposed into parts.
- **When not viable:** For single-shot whole-deck generation, where there is nothing to retry
  locally.

## DF-VALID-02 — Output validation before delivery

**Selection mode:** base + optional complements (base: VALID-05; complement: VALID-06)

### ADB-VALID-05 — Quarantined output: the file is produced, validity-checked, then released

- **Decision family:** DF-VALID-02
- **Option role:** Primary alternative — base
- **Mechanism:**
  - Export writes the file to a held location.
  - Validity checks run on the real file: package structure, parse, page count (R-027).
  - Only on pass is it released to the user.
  - On fail it is discarded and the export ends as failed (UC-008 4A).
- **Addresses:** partially_solves AP-VALID-01, AP-EXPORT-01.
- **Why this mechanism exists:** AC-10 requires validation on every output before delivery.
  AC-09 requires that no invalid file is delivered.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Exists:* OpenDesign streams the produced file and deletes scratch files, with format checks
    inside its export path (F-OD-09, F-OD-11).
  - *Consequence:* PPTAgent has no validity check and no cleanup for a partial `final.pptx`
    (F-PPT-11).
  - DOC-008 §5.3: R-027 validity checks are runtime-feasible.
- **Assumptions:** Validity is determinable without the evidence application (F8 is open).
- **Benefits:**
  - Delivery is gated.
  - A clean attach point for promotion on export (DF-EXPORT-02).
- **Trade-offs:** Temporary file handling (AP-DATA-01).
- **Risks / failure modes:**
  - The validator accepts a file that still fails in PowerPoint (RK-006).
- **Introduces / exposes:** creates_pressure_on AP-DATA-01.
- **Relationships:** compatible_with ADB-EXPORT-03, ADB-EXPORT-04, ADB-DATA-01.
- **Complexity:** Implementation low to moderate. Operational low. Maintenance low.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** AG-02 affects confidence.
- **Relevant Gates / Observability:** AC-09, AC-10, AC-19.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-VALID-06 — Round-trip validation: re-read the produced file and compare with its version

- **Decision family:** DF-VALID-02
- **Option role:** Complementary mechanism — adds fidelity and degradation evidence on top of VALID-05
- **Mechanism:**
  - After production, the file is parsed back.
  - Its slide order, text, and, where available, geometry are compared with the source version.
  - Differences are recorded as degradation (AC-19), and blocking differences fail the export.
- **Addresses:** partially_solves AP-VALID-01, AP-OBS-01, AP-DELIV-01 (R-028 check).
- **Why this mechanism exists:** R-028 and R-025 are feasible at delivery per DOC-008 §5.3.
  AC-19 requires degradation to be discoverable.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent can reparse a produced PPTX into its model and render it (F-PPT-16).
    OpenDesign has an optional PPTX-to-HTML fidelity audit skill (F-OD-13, F-OD-10).
  - *Consequence:* In both systems the comparison is not bound to a named version, and no report
    is stored (F-PPT-16, F-OD-13).
- **Assumptions:** The parser for each output format is reliable enough to serve as an oracle.
- **Benefits:**
  - A degradation record per (version, format).
  - An R-028 check before delivery.
- **Trade-offs:** Cost of a parser per format (AC-26). Latency at export.
- **Risks / failure modes:**
  - Parser mismatch produces false degradations.
  - Blocking on a cosmetic difference.
- **Introduces / exposes:** introduces_problem_candidate NPC-09 (degradation classification:
  which differences block and which are recorded).
- **Relationships:**
  - compatible_with ADB-VALID-05, ADB-EXPORT-01.
  - requires DF-OBS-01 for geometry comparison.
- **Complexity:** Implementation moderate to high. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** Version content is readable (AC-15).
- **Reversibility:** High.
- **Evidence gaps:** AG-02.
- **Relevant Gates / Observability:** AC-19, AC-15, AC-14, AC-10.
- **Known incompatibility:** None known.
- **When viable:** Generally. The cost scales with the number of formats.
- **When not viable:** —

## DF-VALID-03 — How the validation outcome is made observable

**Selection mode:** choose-one-or-more

### ADB-VALID-07 — The verdict travels with the validated result

- **Decision family:** DF-VALID-03
- **Option role:** Primary alternative
- **Mechanism:** Each candidate, version, and output carries a validation record: which checks
  ran, on what, and with what verdict. Tests read it from the thing that was validated.
- **Addresses:** partially_solves AP-VALID-01.
- **Why this mechanism exists:** TN-2 and AC-10 ("outcome observable"), F6.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** No reference system binds verdicts to versions (F-OD-09 is run-level; PPTEval
  writes `evals.json` separately, F-PPT-09).
- **Assumptions:** Rejected candidates remain readable long enough for tests (AC-17).
- **Benefits:**
  - It is unambiguous which result the verdict applies to.
  - Tests can tell "not validated" from "failed".
- **Trade-offs:** Rejected candidates must be kept long enough to observe, which pressures
  AP-DATA-01.
- **Risks / failure modes:** The record is lost when a candidate is discarded, so a failed
  verdict cannot be observed.
- **Introduces / exposes:** creates_pressure_on AP-DATA-01.
- **Relationships:** compatible_with ADB-STATE-02, ADB-STATE-03, ADB-VALID-01, ADB-VALID-02.
- **Complexity:** Low throughout.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-10, AC-17.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-VALID-08 — Out-of-band validation event stream

- **Decision family:** DF-VALID-03
- **Option role:** Primary alternative
- **Mechanism:** Validation points emit events (identity, check, verdict) to an observable
  stream. Results carry no verdict.
- **Addresses:** partially_solves AP-VALID-01.
- **Why this mechanism exists:** It decouples observability from state and survives candidate
  discard.
- **Origin:** Synthesis hypothesis.
- **Evidence:** DeckAgent reasoning only.
- **Assumptions:** Events carry identities that link to operations and versions (NPC-01).
- **Benefits:** Observes failed candidates too. Useful for AC-20 cause reporting.
- **Trade-offs:** A second channel to keep consistent. Identity linking is required.
- **Risks / failure modes:**
  - The stream carries user content, which violates AC-11 unless it is a declared sink.
- **Introduces / exposes:** creates_pressure_on AP-DATA-01.
- **Relationships:** compatible_with ADB-OP-01, ADB-DATA-01.
- **Complexity:** Low to moderate throughout.
- **Constraints / prerequisites:** Identity scheme (NPC-01).
- **Reversibility:** High.
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-10, AC-20, AC-11.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

## DF-OBS-01 — Where post-layout geometry exists relative to display

**Selection mode:** choose-one

### ADB-OBS-01 — The product computes layout deterministically; geometry is part of version content

- **Decision family:** DF-OBS-01
- **Option role:** Primary alternative
- **Mechanism:**
  - A deterministic layout step, owned by DeckAgent, turns deck content into positioned elements.
  - Geometry and text-fit metrics are therefore available for every version before display.
- **Addresses:** partially_solves AP-OBS-01, AP-VALID-01, AP-DELIV-01.
- **Why this mechanism exists:**
  - HM-1 and HM-4 before display need geometry (DOC-008 §5.3).
  - AC-14 needs geometry for preview, PPTX, and PDF.
- **Origin:** Synthesis hypothesis.
- **Evidence:**
  - *Exists (adjacent):* PPTAgent's object model holds geometry for each shape, inherited from
    reference slides (F-PPT-06).
  - *Consequence:* Its geometry comes from reference layouts, not a layout engine.
  - *DeckAgent reasoning:* Deterministic layout makes geometry independent of any renderer.
- **Assumptions:**
  - Text measurement in the layout step matches the renderers' measurement closely enough.
  - Font availability is controlled.
- **Benefits:**
  - Geometry is available before display, with no renderer on the admission path.
  - The same geometry feeds all outputs.
- **Trade-offs:**
  - A layout engine must be built or adopted (AC-21, C-002).
  - Measurement drift from real renderers.
- **Risks / failure modes:**
  - Computed geometry says the text fits, but PowerPoint or PDF clips it (RK-006).
- **Introduces / exposes:**
  - introduces_problem_candidate NPC-10 (text-measurement agreement across preview, PPTX, and PDF)
  - creates_pressure_on AP-DEP-01 (font dependency)
- **Relationships:**
  - compatible_with ADB-VALID-02, ADB-DELIV-01.
  - Phase 3 analysis required with ADB-DELIV-02 and ADB-DELIV-03.
- **Complexity:** Implementation high. Operational low. Maintenance high.
- **Constraints / prerequisites:** Control over fonts and measurement.
- **Reversibility:** Low. It becomes part of the representation.
- **Evidence gaps:** **AG-01a**, **AG-02** would require a spike before W-035.
- **Relevant Gates / Observability:** AC-14, AC-10, AC-05.
- **Known incompatibility:** None known.
- **When viable:** If a layout step is feasible within C-002.
- **When not viable:** If AC-21 comparison shows it is too costly. That is a trade-off.

### ADB-OBS-02 — Render the version, then measure the rendered result

- **Decision family:** DF-OBS-01
- **Option role:** Primary alternative
- **Mechanism:**
  - The version is rendered by a real layout engine (for example a browser-class renderer)
    outside interactive preview.
  - Geometry and fit are read back from the rendered result.
- **Addresses:** partially_solves AP-OBS-01, AP-VALID-01.
- **Why this mechanism exists:** It gets real measured geometry without building a layout engine.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* OpenDesign's preview exposes render-health and geometry telemetry
    (`preview-observability`, F-OD-10). Its exports render stored HTML via Chromium (F-OD-11).
  - *Consequence:* Chromium becomes a shared failure point across formats (F-OD-16).
- **Assumptions:** The renderer can run headless in the local runtime (D-027).
- **Benefits:**
  - Measured, not predicted, geometry for the rendered form.
  - Also yields AC-18 images.
- **Trade-offs:**
  - A heavy dependency on the admission path, if used for validation.
  - Rendered geometry may not equal PPTX geometry.
- **Risks / failure modes:**
  - Renderer crash or slowness leads to operation failure.
  - Measured geometry differs from PPTX geometry (R-028).
- **Introduces / exposes:** NPC-07, NPC-10.
- **Relationships:**
  - compatible_with ADB-VALID-02, ADB-OBS-04, ADB-DELIV-03.
  - creates_pressure_on AP-DEP-01.
- **Complexity:** Implementation moderate. Operational moderate to high. Maintenance moderate.
- **Constraints / prerequisites:** A renderable version form.
- **Reversibility:** Medium.
- **Evidence gaps:** AG-01b, AG-02, AG-05 (the renderer as a content sink).
- **Relevant Gates / Observability:** AC-14, AC-18, AC-10, AC-11.
- **Known incompatibility:** None known.
- **When viable:** If the version has a renderable form and the renderer fits locally.
- **When not viable:** If the renderer cannot run locally or headless.

### ADB-OBS-03 — Geometry available only from produced output files

- **Decision family:** DF-OBS-01
- **Option role:** Primary alternative
- **Mechanism:** Geometry is extracted only after an output file (PPTX or PDF) exists, by parsing
  or rendering the file.
- **Addresses:** partially_solves AP-OBS-01 (AC-14 for outputs); constrains AP-VALID-01.
- **Why this mechanism exists:** It needs no pre-export layout or render step. Output geometry is
  real.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent renders through LibreOffice → PDF → images and reparses the PPTX after
    save (F-PPT-10, F-PPT-16).
  - DOC-008 §5.3: with export-time-only geometry, HM-1 and HM-4 cannot be stopped before display.
    R-033 then protects P3 only partially.
- **Assumptions:** PA-04 does not require pre-display geometry checks.
- **Benefits:** Lowest pre-display cost. Geometry is that of the real artifact.
- **Trade-offs:**
  - AC-14 for preview needs a separate path.
  - Validation of HM-1 and HM-4 is limited to delivery time.
- **Risks / failure modes:**
  - A clipped-text deck is admitted and previewed, and the problem is found only at export.
- **Introduces / exposes:** creates_pressure_on AP-VALID-01, AP-DELIV-01.
- **Relationships:**
  - conflicts_with ADB-VALID-02 (stage 2 before display).
  - compatible_with ADB-VALID-06, ADB-OBS-05.
- **Complexity:** Implementation low to moderate. Operational moderate. Maintenance low.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** AG-01a.
- **Relevant Gates / Observability:** AC-14, AC-10.
- **Known incompatibility:** None against the Gates; AC-10 requires possibility, not specific
  checks. AC-14 for preview is not covered by this option alone.
- **When viable:** If Product keeps P3 geometry checks as test oracles, or checks at delivery time.
- **When not viable:** If Product requires HM-1 or HM-4 before display.

## DF-OBS-02 — How a rendered whole-deck view is obtained

**Selection mode:** choose-one-or-more

### ADB-OBS-04 — A headless render path shared with preview

- **Decision family:** DF-OBS-02
- **Option role:** Primary alternative
- **Mechanism:** The same rendering that serves interactive preview can run without interaction
  for any version, producing images of every slide for review, LLM-judge use, and tests.
- **Addresses:** partially_solves AP-OBS-01, AP-DELIV-01 (preview identity).
- **Why this mechanism exists:** AC-18 (whole deck viewable without manual interaction) and R-028
  (preview is what the user decides on).
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* OpenDesign's preview and export share the HTML and Chromium rendering (F-OD-11,
    F-OD-12).
  - *Consequence:* The shared renderer is a common failure point (F-OD-12, F-OD-16).
- **Assumptions:** Preview rendering can run headless locally.
- **Benefits:** The reviewed images match what the user sees.
- **Trade-offs:** The renderer dependency (AC-22).
- **Risks / failure modes:** Headless rendering differs from the interactive browser (fonts,
  scaling).
- **Introduces / exposes:** NPC-10.
- **Relationships:** compatible_with ADB-OBS-02, ADB-DELIV-01, ADB-DELIV-03.
- **Complexity:** Implementation moderate. Operational moderate. Maintenance moderate.
- **Constraints / prerequisites:** —
- **Reversibility:** Medium.
- **Evidence gaps:** AG-01b.
- **Relevant Gates / Observability:** AC-18, AC-14.
- **Known incompatibility:** None known.
- **When viable:** If the preview renderer can run headless.
- **When not viable:** —

### ADB-OBS-05 — Render produced output files into images for review

- **Decision family:** DF-OBS-02
- **Option role:** Primary alternative
- **Mechanism:** The whole-deck view is obtained by converting a produced output file (PPTX or
  PDF) into slide images.
- **Addresses:** partially_solves AP-OBS-01 (AC-18, AC-19).
- **Why this mechanism exists:** It shows the real artifact, which is useful for degradation and
  PPTX compatibility.
- **Origin:** Observed in reference system.
- **Evidence:**
  - *Exists:* PPTAgent's `ppt_to_images` uses LibreOffice → PDF → Poppler for analysis and PPTEval
    (F-PPT-10, F-PPT-16).
  - *Consequence:* The renderer (LibreOffice) is not the target application, so what it shows may
    differ from PowerPoint (RK-006).
- **Assumptions:** An export or a test export is produced for each version to be viewed.
- **Benefits:** Real artifact appearance. Directly supports AC-19.
- **Trade-offs:**
  - "Every version without manual interaction" requires producing a file for each version.
  - Heavy local dependencies.
- **Risks / failure modes:** The converter's rendering is mistaken for PowerPoint's.
- **Introduces / exposes:** creates_pressure_on AP-DEP-01, AP-DATA-01 (temp files).
- **Relationships:** compatible_with ADB-OBS-03, ADB-VALID-06, ADB-DELIV-02.
- **Complexity:** Implementation low to moderate. Operational moderate to high. Maintenance
  moderate.
- **Constraints / prerequisites:** A converter available locally.
- **Reversibility:** High.
- **Evidence gaps:** AG-02.
- **Relevant Gates / Observability:** AC-18, AC-19, AC-11.
- **Known incompatibility:** None known.
- **When viable:** As a review or degradation lane.
- **When not viable:** As the only preview-equivalent view, if preview is rendered by a different
  path (R-028 comparison).

## DF-PROV-01 — Granularity at which origin is held

**Selection mode:** base + optional complements (base: PROV-01, or PROV-02 with a complement; complement: PROV-03 as cross-check)

### ADB-PROV-01 — Origin label on every content element

- **Decision family:** DF-PROV-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Every text-bearing element (block, bullet, table cell) carries an origin label: source,
    user-stated, or AI-added.
  - Every step must emit labels for what it creates and preserve or update labels for what it
    changes.
- **Addresses:** partially_solves AP-PROV-01; constrains AP-STATE-01, AP-DELIV-01.
- **Why this mechanism exists:** AC-03 and AC-16 require origin observable in any version without
  span-level linking.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Consequence of absence:* PPTAgent drops the source linkage after the editor stage (F-PPT-15).
    OpenDesign has origin only at file level (F-OD-05).
  - No positive reference evidence exists (RG-04).
- **Assumptions:**
  - An element is a meaningful unit for origin.
  - Mixed-origin elements get a defined rule (NPC-11).
- **Benefits:** Simple to observe (AC-16). Supports a P1 runtime check.
- **Trade-offs:** Every generation and refinement step must be origin-aware.
- **Risks / failure modes:**
  - A refinement rewrites an element and keeps the "source" label on AI-paraphrased content,
    which violates AC-03.
- **Introduces / exposes:** introduces_problem_candidate NPC-11 (origin semantics for mixed or
  paraphrased content).
- **Relationships:**
  - compatible_with ADB-PROV-05, ADB-PROV-06, ADB-VALID-01.
  - Requires a representation that has elements (DF-DELIV-01).
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** —
- **Reversibility:** Low. It is embedded in the representation and every step.
- **Evidence gaps:** RG-04 (no reference evidence).
- **Relevant Gates / Observability:** AC-03, AC-16.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-PROV-02 — Source anchors only for source-derived facts; everything else is non-source by default

- **Decision family:** DF-PROV-01
- **Option role:** Conditional variant — viable only with a complement for the user-stated vs AI-added split
- **Mechanism:**
  - Only content claimed as source-derived carries an anchor to a source location.
  - Content with no anchor is treated as not source-derived.
  - Whether non-source content is user-stated or AI-added is derived from the request or recorded
    coarsely.
- **Addresses:** partially_solves AP-PROV-01.
- **Why this mechanism exists:**
  - The minimal granularity that protects AC-03: nothing is presented as source-derived without a
    basis.
  - It supports a P1 runtime number check (DOC-008 §5.3).
- **Origin:** Synthesis hypothesis.
- **Evidence:** DeckAgent reasoning. PPTAgent carries section indexes through planning only
  (F-PPT-15), which suggests anchors are feasible upstream.
- **Assumptions:** Source locations are addressable (sections or passages; not span-level).
- **Benefits:**
  - "Source unless proven otherwise" errors are structurally avoided.
  - Anchors enable a check against source text.
- **Trade-offs:**
  - The user-stated versus AI-added split is weaker; AC-16 needs all three origins.
- **Risks / failure modes:** User-stated content cannot be told apart from AI-added content in
  observability.
- **Introduces / exposes:** NPC-11.
- **Relationships:** compatible_with ADB-PROV-05. Phase 3 analysis required with ADB-PROV-01.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** An addressable source structure (compare ADB-SOURCE-02).
- **Reversibility:** Medium.
- **Evidence gaps:** RG-04.
- **Relevant Gates / Observability:** AC-03, AC-16.
- **Known incompatibility:** AC-16 needs the three-way distinction to be observable. Alone, this
  option leaves the user-versus-AI split underspecified. Viable only if complemented.
- **When viable:** Combined with coarse user/AI labelling.
- **When not viable:** Alone, for AC-16.

### ADB-PROV-03 — Post-hoc origin attribution by matching output against source and request

- **Decision family:** DF-PROV-01
- **Option role:** Complementary mechanism — verification cross-check only; negative evidence as the primary mechanism
- **Mechanism:** Origin is not carried through the steps. After each operation, a separate step
  attributes each element's origin by matching it against the source text and the request.
- **Addresses:** partially_solves AP-PROV-01 (observability).
- **Why this mechanism exists:** It avoids origin-aware generation.
- **Origin:** Synthesis hypothesis.
- **Evidence:** DeckAgent reasoning. AC-03 rationale: "a distinction lost at one step cannot be
  recovered later".
- **Assumptions:** Matching is accurate enough for paraphrase.
- **Benefits:** Generation stays origin-agnostic.
- **Trade-offs:** Accuracy depends on matching, and paraphrase breaks matching.
- **Risks / failure modes:** AI-added content that resembles the source is labelled
  "source-derived". This is exactly what AC-03 forbids.
- **Introduces / exposes:** —
- **Relationships:** Conflicts with the AC-03 rationale when used as the primary mechanism. It
  could complement ADB-PROV-01 as a cross-check.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** RG-04.
- **Relevant Gates / Observability:** AC-03, AC-16.
- **Known incompatibility:** It reconstructs rather than preserves the distinction. **Not viable
  for DeckAgent under current V1 constraints as the primary mechanism** (AC-03). Possibly useful
  as a verification cross-check.
- **When viable:** As a secondary check.
- **When not viable:** As the source of truth for origin.

### ADB-PROV-04 — Run- or file-level provenance only

- **Decision family:** DF-PROV-01
- **Option role:** Negative evidence — for content origin; usable as an AC-17 complement
- **Mechanism:** Record which operation produced which version. There is no content-level origin.
- **Addresses:** partially_solves AP-STATE-01 observability (AC-17); does not address AP-PROV-01.
- **Why this mechanism exists:** It is cheap history.
- **Origin:** Observed in reference system.
- **Evidence:**
  - *Exists:* OpenDesign's version model stores source, prompt, parent, digest, and origin per
    file version (F-OD-05).
  - *Consequence:* It cannot say which claims came from the source (F-OD-05).
- **Assumptions:** —
- **Benefits:** Supports AC-17 traceability.
- **Trade-offs:** —
- **Risks / failure modes:** —
- **Introduces / exposes:** —
- **Relationships:** compatible_with every DF-STATE option, as a complement.
- **Complexity:** Low.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** —
- **Relevant Gates / Observability:** AC-16, AC-17.
- **Known incompatibility:** It cannot make content origin observable (AC-16). **Not viable for
  DeckAgent under current V1 constraints for AP-PROV-01.** Kept as negative evidence and as an
  AC-17 complement.
- **When viable:** As operation-to-version traceability.
- **When not viable:** For content origin.

## DF-PROV-02 — Who assigns origin

**Selection mode:** choose-one

### ADB-PROV-05 — Origin by construction: source content enters through system-controlled extraction

- **Decision family:** DF-PROV-02
- **Option role:** Primary alternative
- **Mechanism:**
  - Source-derived content (facts, numbers, quotes) is placed from extracted source items that the
    system controls, so it is labelled "source" by construction.
  - Model-written text is labelled AI-added unless it is placed from those items.
- **Addresses:** partially_solves AP-PROV-01, AP-SOURCE-01.
- **Why this mechanism exists:** Assigning origin by construction means the model cannot mislabel
  content as source-derived.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent's planner selects document sections and `OutlineItem.retrieve` pulls the
    content (F-PPT-15). The editor is instructed not to fabricate.
  - *Consequence:* The linkage is lost after the editor stage (F-PPT-15).
  - *DeckAgent reasoning:* Keep the linkage through placement instead of dropping it.
- **Assumptions:**
  - Source content can be extracted into addressable items (ADB-SOURCE-02).
  - Rephrasing a source item is either forbidden or re-labelled (NPC-11).
- **Benefits:**
  - Strong AC-03 guarantee for placed items.
  - P1 numbers are checkable.
- **Trade-offs:**
  - Limits how freely the model can rephrase source content (R-009 tone and audience changes).
- **Risks / failure modes:** A tone refinement rewrites a source item, and its label no longer
  fits the text.
- **Introduces / exposes:** NPC-11. creates_pressure_on AP-SOURCE-01.
- **Relationships:** requires ADB-SOURCE-02. compatible_with ADB-PROV-01, ADB-PROV-02.
- **Complexity:** Implementation moderate to high. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** A structured source model.
- **Reversibility:** Low.
- **Evidence gaps:** RG-04.
- **Relevant Gates / Observability:** AC-03, AC-16, AC-02.
- **Known incompatibility:** None known.
- **When viable:** If source structure is extractable for all five D-024 types.
- **When not viable:** If refinements must freely paraphrase source content and still keep it as
  "source" (NPC-11 unresolved).

### ADB-PROV-06 — Model-declared origin, verified by the system

- **Decision family:** DF-PROV-02
- **Option role:** Primary alternative
- **Mechanism:**
  - The model returns content together with origin claims and source references.
  - The system checks that each "source" claim references source content that exists (and, for
    numbers, matches).
  - Claims that cannot be verified are downgraded to AI-added.
- **Addresses:** partially_solves AP-PROV-01, AP-VALID-01.
- **Why this mechanism exists:** It keeps the model free to phrase content while the system still
  controls the "source" label.
- **Origin:** Synthesis hypothesis.
- **Evidence:** DeckAgent reasoning. DOC-008 §5.3 treats the P1 number check as runtime-feasible
  given origin and source.
- **Assumptions:** Models produce reliable structured origin claims. Verification covers
  paraphrase adequately.
- **Benefits:** Flexible phrasing. P1 checking is part of the flow.
- **Trade-offs:**
  - Verification of paraphrased meaning is weak (rubric territory).
  - Depends on model output structure (AC-22).
- **Risks / failure modes:** A paraphrase that changes meaning passes a "reference exists" check.
- **Introduces / exposes:** NPC-11. creates_pressure_on AP-DEP-01.
- **Relationships:** compatible_with ADB-PROV-01, ADB-VALID-01, ADB-VALID-02.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** A structured model output contract.
- **Reversibility:** Medium.
- **Evidence gaps:** RG-04.
- **Relevant Gates / Observability:** AC-03, AC-16, AC-10.
- **Known incompatibility:** None known.
- **When viable:** Generally, if verification is strict about numbers.
- **When not viable:** If verification cannot run at the admission point (depends on PA-04).

---

## 7. Preview, export, and session mechanisms (K-2)

## DF-DELIV-01 — How preview, PPTX, and PDF derive from a version

**Selection mode:** choose-one

### ADB-DELIV-01 — Format-neutral deck model as version content; independent renderer and writers

- **Decision family:** DF-DELIV-01
- **Option role:** Primary alternative
- **Mechanism:**
  - A version's content is a DeckAgent-owned, format-neutral deck description.
  - The preview renderer, the PPTX writer, and the PDF writer each derive from it independently.
- **Addresses:** partially_solves AP-DELIV-01, AP-OBS-01; constrains AP-PROV-01, AP-STATE-01.
  Relevant to the AC-26 and AC-27 trade-offs.
- **Why this mechanism exists:**
  - AC-05: every output derives from one version.
  - C-003 and R-039: further formats are expected.
  - R-039 explicitly does *not* require a canonical IR. This is one option among several.
- **Origin:** Synthesis hypothesis.
- **Evidence:**
  - *Reference contrast:* PPTAgent's PPTX-shaped model makes new output targets cross-cutting
    (F-PPT-17, ADR-PPT-07). OpenDesign shares upstream HTML but branches for each format
    (F-OD-12).
  - Neither system uses a format-neutral model.
- **Assumptions:**
  - The model can express everything V1 needs in both PPTX (editable text, shapes, tables; UC-008
    postcondition 4) and PDF.
  - Format losses are knowable before export (R-026).
- **Benefits:**
  - Symmetric derivation (AC-05).
  - Adding a format touches only a writer (AC-26).
  - Origin labels can live in the model (DF-PROV-01).
- **Trade-offs:**
  - Every writer must reproduce layout faithfully, so drift between preview and outputs is a risk
    (R-028).
  - A capability model is needed (C-004).
- **Risks / failure modes:**
  - PPTX writer output differs from preview (RK-006).
  - The model is too weak to express needed features, or too rich for some writers.
- **Introduces / exposes:**
  - introduces_problem_candidate NPC-10, NPC-12 (format capability model and loss determination)
- **Relationships:**
  - compatible_with ADB-OBS-01, ADB-STATE-03, ADB-PROV-01.
  - Phase 3 analysis required with ADB-OBS-02.
- **Complexity:** Implementation high. Operational low. Maintenance high.
- **Constraints / prerequisites:** —
- **Reversibility:** Low. It is the domain model across generation, preview, and export.
- **Evidence gaps:** **AG-02 would require a spike before W-035** (does native-object PPTX from
  the model open and edit acceptably?).
- **Relevant Gates / Observability:** AC-05, AC-15, AC-14, AC-19; AC-26, AC-27 as trade-offs.
- **Known incompatibility:** None known.
- **When viable:** If the writers can reach the P5 minimum.
- **When not viable:** If C-002 and AC-21 show three faithful writers are too costly. That is a
  trade-off.

### ADB-DELIV-02 — PPTX-shaped working model; preview and PDF derived from the PPTX form

- **Decision family:** DF-DELIV-01
- **Option role:** Primary alternative
- **Mechanism:**
  - The version's content is a presentation-object model that maps directly to PPTX.
  - PPTX is serialized from it.
  - Preview and PDF are produced by rendering or converting that PPTX form.
- **Addresses:** partially_solves AP-DELIV-01, AP-OBS-01; constrains AP-DEP-01. Relevant to the
  AC-26 trade-off.
- **Why this mechanism exists:**
  - The editable PPTX hand-off is central (D-015, UC-008 postcondition 4).
  - One source form means preview and PDF follow the PPTX.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent's `Presentation` object graph over a custom `python-pptx` build is the
    working state, and PPTX is rebuilt from it (F-PPT-06, F-PPT-10).
  - *Consequence:* Coupling to PPTX semantics and a custom fork. Non-PPTX targets touch more than
    a writer (F-PPT-17). Its LibreOffice PDF is analysis-only, not a delivery path (F-PPT-10).
- **Assumptions:**
  - A local PPTX renderer or converter produces preview and PDF faithful enough to PowerPoint
    (R-028).
- **Benefits:**
  - Strong fidelity of the editable hand-off.
  - PPTX geometry is native (AC-14 for PPTX).
- **Trade-offs:**
  - Preview depends on a PPTX renderer, and its fidelity differs from PowerPoint's.
  - Future formats are harder (AC-26).
- **Risks / failure modes:**
  - The converter's rendering differs from PowerPoint, so preview misleads the user (A-017,
    RK-006).
  - Library lock-in (AC-22).
- **Introduces / exposes:** creates_pressure_on AP-DEP-01, AP-OBS-01. NPC-10.
- **Relationships:**
  - compatible_with ADB-OBS-05, ADB-OBS-03.
  - Tension with ADB-STATE-03 (a mutable library object graph as the value; see ADB-STATE-03
    "when not viable").
- **Complexity:** Implementation moderate. Operational moderate to high (converter). Maintenance
  moderate.
- **Constraints / prerequisites:** A local converter.
- **Reversibility:** Low.
- **Evidence gaps:** AG-02, AG-01b. RG-05 (PPTAgent pinned path not fully verified).
- **Relevant Gates / Observability:** AC-05, AC-14, AC-15, AC-18, AC-19.
- **Known incompatibility:** None known.
- **When viable:** If a local PPTX → render/PDF path is faithful enough.
- **When not viable:** If preview fidelity to PowerPoint cannot be reached locally.

### ADB-DELIV-03 — Web-rendered working form; preview renders it, PDF prints it, PPTX is converted from it

- **Decision family:** DF-DELIV-01
- **Option role:** Primary alternative — native-object PPTX variant only; the screenshot variant is negative evidence
- **Mechanism:**
  - The version's content is a browser-renderable form.
  - Preview renders it. PDF comes from print or capture.
  - PPTX is produced by converting the rendered structure into native slide objects.
- **Addresses:** partially_solves AP-DELIV-01, AP-OBS-01. Relevant to the AC-26 trade-off.
- **Why this mechanism exists:**
  - Preview and PDF share one renderer, so R-028 for PDF is strong.
  - Browser layout yields measurable geometry (ADB-OBS-02).
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* OpenDesign keeps HTML as the canonical artifact. Preview renders it in a sandboxed
    iframe, and export goes through Chromium to PDF, PPTX, and so on (F-OD-11, F-OD-12).
  - *Consequence:* OpenDesign's default PPTX is one screenshot per slide, which is not editable
    (F-OD-13). Editable conversion exists only as a separate branch (F-OD-12).
  - *DeckAgent reasoning:* The screenshot variant contradicts UC-008 postcondition 4. Only a
    native-object conversion variant is viable.
- **Assumptions:** HTML → native PPTX objects conversion is feasible at V1 quality.
- **Benefits:**
  - Measured geometry and rendering come from one engine.
  - The PDF is faithful to the preview.
- **Trade-offs:**
  - The PPTX conversion is the hard part. Fidelity between preview and PPTX is at risk (R-028,
    RK-006).
  - Renderer dependency (AC-22).
- **Risks / failure modes:**
  - An editable-PPTX conversion loses layout.
  - The screenshot fallback silently breaks editability.
- **Introduces / exposes:** NPC-10, NPC-12. creates_pressure_on AP-DEP-01.
- **Relationships:**
  - compatible_with ADB-OBS-02, ADB-OBS-04.
  - The screenshot-PPTX variant conflicts_with UC-008 postcondition 4 and D-015.
- **Complexity:** Implementation high (PPTX conversion). Operational moderate. Maintenance
  moderate to high.
- **Constraints / prerequisites:** A local headless browser-class renderer.
- **Reversibility:** Low.
- **Evidence gaps:** **AG-02 would require a spike before W-035** (native-object conversion
  fidelity).
- **Relevant Gates / Observability:** AC-05, AC-14, AC-15, AC-18, AC-19.
- **Known incompatibility:** The screenshot-PPTX variant is **not viable for DeckAgent under
  current V1 constraints** (UC-008 postcondition 4, D-015). The native-conversion variant has no
  known incompatibility.
- **When viable:** Native-object conversion reaches the P5 minimum.
- **When not viable:** Only screenshot PPTX is achievable.

## DF-DELIV-02 — Stability of the exported version during export

**Selection mode:** choose-one (DELIV-04 and DELIV-06 are conditional variants)

### ADB-DELIV-04 — Export reads an immutable version value captured by identity at request time

- **Decision family:** DF-DELIV-02
- **Option role:** Conditional variant — only with ADB-STATE-03
- **Mechanism:** The export request captures the previewed version's identity. Because versions
  are immutable values, the export's input cannot change.
- **Addresses:** partially_solves AP-DELIV-01, AP-EXPORT-01 (outcome traceability).
- **Why this mechanism exists:** AC-05 ("what keeps the version an export uses from changing").
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Consequence of lacking it:* OpenDesign's unpinned export reads the mutable working file, so
    exact preview/export identity depends on stability (F-OD-11).
- **Assumptions:** ADB-STATE-03 or an equivalent value semantics.
- **Benefits:**
  - No locking. Export can run concurrently with other actions (SA-03 either way).
  - The outcome maps exactly to a version identity (AC-30).
- **Trade-offs:** Requires the value model.
- **Risks / failure modes:** A version value is freed while an export still references it.
- **Introduces / exposes:** NPC-01.
- **Relationships:**
  - requires ADB-STATE-03.
  - makes_unnecessary ADB-DELIV-06.
  - compatible_with ADB-EXPORT-01.
- **Complexity:** Low, given ADB-STATE-03.
- **Constraints / prerequisites:** Immutable versions.
- **Reversibility:** Medium (inherits from ADB-STATE-03).
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-05, AC-30, AC-17.
- **Known incompatibility:** None known.
- **When viable:** With ADB-STATE-03.
- **When not viable:** With mutable version slots.

### ADB-DELIV-05 — Copy the previewed version at export request

- **Decision family:** DF-DELIV-02
- **Option role:** Primary alternative
- **Mechanism:** The export takes a private copy of the previewed version, tagged with that
  version's identity, when it is requested. It works only from that copy.
- **Addresses:** partially_solves AP-DELIV-01, AP-EXPORT-01.
- **Why this mechanism exists:** It gives stability without immutable versions.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** DeckAgent reasoning. The OpenDesign version-pinned export is analogous (F-OD-11).
- **Assumptions:** Copying is cheap and atomic with respect to transitions.
- **Benefits:** Works with mutable slots (ADB-STATE-02).
- **Trade-offs:** The extra copy is a content sink (AP-DATA-01).
- **Risks / failure modes:** A copy taken mid-transition captures a torn version.
- **Introduces / exposes:** creates_pressure_on AP-DATA-01.
- **Relationships:**
  - compatible_with ADB-STATE-02, ADB-STATE-05.
  - Made unnecessary by ADB-STATE-03 with ADB-DELIV-04.
- **Complexity:** Low.
- **Constraints / prerequisites:** The copy is atomic relative to lifecycle transitions.
- **Reversibility:** High.
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-05, AC-11.
- **Known incompatibility:** None known.
- **When viable:** With mutable version slots.
- **When not viable:** —

### ADB-DELIV-06 — Block version-changing actions while an export runs

- **Decision family:** DF-DELIV-02
- **Option role:** Conditional variant — only under the SA-03 reading "no export concurrency"
- **Mechanism:** While an export runs, actions that could change the previewed version (keep,
  reject, new refinement commit, new deck) are refused or wait.
- **Addresses:** partially_solves AP-DELIV-01, AP-OP-02.
- **Why this mechanism exists:** It needs neither copying nor immutability.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** DeckAgent reasoning. It relates to SA-03.
- **Assumptions:** SA-03 is resolved so that export excludes version-changing actions. **Depends on
  one interpretation of SA-03.**
- **Benefits:** Simple.
- **Trade-offs:** The user may have to wait for export. It interacts with a running AI operation
  (the promotion at a commit boundary during export).
- **Risks / failure modes:** A running refinement's admission conflicts with a blocked slot, which
  needs a rule.
- **Introduces / exposes:** creates_pressure_on AP-OP-02.
- **Relationships:** compatible_with ADB-OP-06, ADB-OP-07. It is an alternative to ADB-DELIV-04
  and ADB-DELIV-05.
- **Complexity:** Low.
- **Constraints / prerequisites:** The exclusivity mechanism covers export.
- **Reversibility:** High.
- **Evidence gaps:** SA-03 (ownership TBD).
- **Relevant Gates / Observability:** AC-05, AC-28.
- **Known incompatibility:** None known under that SA-03 reading.
- **When viable:** If SA-03 is answered as "no concurrency".
- **When not viable:** If export must run while an AI operation proceeds.

## DF-EXPORT-01 — Recording export outcomes

**Selection mode:** choose-one

### ADB-EXPORT-01 — Export outcome records keyed by (version identity, format)

- **Decision family:** DF-EXPORT-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Each successful export adds a session-scoped record: version identity, format, the delivery
    event reached, and an order stamp.
  - Failed or cancelled exports record at most a non-success outcome (for AC-20), never success.
- **Addresses:** partially_solves AP-EXPORT-01, AP-SESSION-01; constrains AP-STATE-01.
- **Why this mechanism exists:**
  - AC-30 and AC-17: "every successful export outcome … traceable to the version and format".
  - Every PA-02 reading can be evaluated from this record.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Consequence of lacking it:* PPTAgent's download is a plain file read with no record
    (F-PPT-10, F-PPT-18). OpenDesign's export creates no durable record (F-OD-11).
  - Neither system can evaluate "work at risk" per version and format.
- **Assumptions:** Version identity exists (NPC-01).
- **Benefits:**
  - Accommodates any PA-02 definition (one format or both; accepted, pending, or latest).
  - Readable for TN-6 and AC-17.
- **Trade-offs:** Needs identities, and records must follow versions (pruned with them or kept).
- **Risks / failure modes:**
  - A record references a version identity that has since been reused.
  - A record is written before delivery is confirmed (see DF-EXPORT-02).
- **Introduces / exposes:** NPC-01.
- **Relationships:**
  - compatible_with ADB-STATE-03, ADB-STATE-04, ADB-STATE-05, ADB-SESSION-01, ADB-SESSION-02.
  - makes_unnecessary ADB-EXPORT-02.
- **Complexity:** Low to moderate throughout.
- **Constraints / prerequisites:** Identity scheme.
- **Reversibility:** High.
- **Evidence gaps:** RG-03 (no reference evidence).
- **Relevant Gates / Observability:** AC-30, AC-17, AC-29.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-EXPORT-02 — A single "downloaded" flag per deck or version

- **Decision family:** DF-EXPORT-01
- **Option role:** Negative evidence
- **Mechanism:** A boolean records whether the current (or latest) version has been exported.
- **Addresses:** partially_solves AP-SESSION-01 for one PA-02 reading only.
- **Why this mechanism exists:** It is the cheapest reading of UC-011 step 2 ("latest version
  downloaded") and DOC-008 TN-6.
- **Origin:** Derived from DeckAgent constraints (a narrow reading).
- **Evidence:**
  - AC-30 "Does not require … a single 'downloaded' flag" and "every successful export outcome,
    each traceable to the version and format".
  - T-P2-04: DOC-008 TN-6 is narrower than AC-30.
- **Assumptions:** PA-02 resolves as "any format of the latest version". **Depends on one reading
  of PA-02.**
- **Benefits:** Trivial.
- **Trade-offs:** Loses the format and version dimensions.
- **Risks / failure modes:** Product chooses "both formats" or "the accepted version", and the
  state cannot evaluate it without restructuring.
- **Introduces / exposes:** —
- **Relationships:** conflicts_with the AC-30 requirement to hold outcomes by version and format.
- **Complexity:** Low.
- **Constraints / prerequisites:** —
- **Reversibility:** High in code, but it violates AC-30 as written.
- **Evidence gaps:** PA-02.
- **Relevant Gates / Observability:** AC-30, AC-17.
- **Known incompatibility:** It does not hold outcomes by version and format (AC-30 criterion
  text). **Not viable for DeckAgent under current V1 constraints.** Kept as negative evidence.
- **When viable:** Only if AC-30 is changed.
- **When not viable:** Under the current DOC-004.

## DF-EXPORT-02 — Where promotion on export is committed

**Selection mode:** choose-one (EXPORT-05 keeps the event choice localized; EXPORT-03 and EXPORT-04 hard-wire one event)

### ADB-EXPORT-03 — Commit promotion when output validation passes, before hand-off

- **Decision family:** DF-EXPORT-02
- **Option role:** Conditional variant — hard-wired commit point under the PA-01 reading "valid file produced"
- **Mechanism:** If the exported version is pending, promotion is committed atomically when the
  produced file passes output validation, before or as it is released.
- **Addresses:** partially_solves AP-EXPORT-01, AP-STATE-01.
- **Why this mechanism exists:** It is the earliest point AC-29 allows ("only after the file has
  been produced and has passed output validation").
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** No reference system promotes on export (RG-03). DOC-004 AC-29 lists "after output
  validation" as one possible commit point.
- **Assumptions:** PA-01: "delivered" means "a valid file was produced". **Depends on one reading
  of PA-01.**
- **Benefits:**
  - Fully server-side observable.
  - No client confirmation needed.
- **Trade-offs:** Promotes even if the user never actually receives the file (browser save
  cancelled).
- **Risks / failure modes:** The user cancels the save dialog after promotion, so the pending
  version is promoted without delivery.
- **Introduces / exposes:** —
- **Relationships:**
  - requires ADB-VALID-05.
  - compatible_with ADB-STATE-05, ADB-EXPORT-01.
- **Complexity:** Low.
- **Constraints / prerequisites:** Output validation exists.
- **Reversibility:** High (the commit point is movable).
- **Evidence gaps:** AG-06.
- **Relevant Gates / Observability:** AC-29, AC-09, AC-10.
- **Known incompatibility:** None under that PA-01 reading.
- **When viable:** If Product accepts "valid file produced" as delivery.
- **When not viable:** If Product defines delivery as user receipt.

### ADB-EXPORT-04 — Commit promotion on an observed hand-off event from the client

- **Decision family:** DF-EXPORT-02
- **Option role:** Conditional variant — hard-wired commit point under the PA-01 reading "user receipt", subject to AG-06
- **Mechanism:** After validation, the file is offered to the user. Promotion is committed only
  when the client reports a hand-off event, such as download completed or file saved.
- **Addresses:** partially_solves AP-EXPORT-01, AP-STATE-01.
- **Why this mechanism exists:** It is the closest reading of "delivered to the user" (BR-010
  rule 3c, UC-008 step 6 → 7).
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** DeckAgent reasoning. Whether such an event is observable in a local web app is
  unknown (AG-06).
- **Assumptions:** PA-01: delivery equals user receipt. The client can observe it. **Depends on
  one reading of PA-01, and on AG-06.**
- **Benefits:** Matches the user's experience of "I have the file".
- **Trade-offs:** Needs a client-to-authority report. The event may be unobservable or unreliable.
- **Risks / failure modes:**
  - The browser gives no reliable completion signal, so promotion never happens.
  - The report is lost when the tab closes.
- **Introduces / exposes:** NPC-06 (client/authority consistency).
- **Relationships:** requires ADB-VALID-05. compatible_with ADB-EXPORT-01.
- **Complexity:** Moderate throughout.
- **Constraints / prerequisites:** An observable hand-off.
- **Reversibility:** High.
- **Evidence gaps:** **AG-06 would require a spike before W-035.**
- **Relevant Gates / Observability:** AC-29, AC-09.
- **Known incompatibility:** None known.
- **When viable:** If the hand-off is observable.
- **When not viable:** If no reliable client signal exists.

### ADB-EXPORT-05 — Localized, replaceable promotion policy over identifiable post-production events

- **Decision family:** DF-EXPORT-02
- **Option role:** Primary alternative — structural property; the event the policy selects may be the one in EXPORT-03 or in EXPORT-04
- **Mechanism:**
  - The export path makes its post-production points identifiable: file produced, output
    validation passed, file released, and hand-off confirmed where observable.
  - Which of these events triggers promotion is decided by one small, localized promotion policy.
    It sits between the export path and the lifecycle authority.
  - The policy may simply hard-code the single event Product selects.
  - The architectural value: moving promotion to a different event means replacing that policy,
    not restructuring the export path or the lifecycle.
  - No runtime-configurable delivery semantics are implied.
- **Addresses:** partially_solves AP-EXPORT-01, AP-STATE-01.
- **Why this mechanism exists:**
  - PA-01 ("delivered") is open.
  - DOC-004 AC-29 and §11 ask each candidate to show which post-production points it can commit
    at, and what moving the commit would change.
  - It does not ask for a switchable setting.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** DeckAgent reasoning only. No reference system promotes on export (RG-03).
- **Assumptions:** The candidate events are identifiable in the local runtime (AG-06).
- **Benefits:**
  - Product's later choice, or a later change to it, stays a local change.
  - The commit point is explicit (AC-29).
- **Trade-offs:**
  - The export path must expose its intermediate events even though only one will drive promotion.
- **Risks / failure modes:**
  - The policy is bypassed by a second promotion path.
  - An event is exposed but not reliable (for example, a client hand-off signal; AG-06).
- **Introduces / exposes:** —
- **Relationships:**
  - compatible_with ADB-EXPORT-01, ADB-STATE-05.
  - The event it selects corresponds to ADB-EXPORT-03 or ADB-EXPORT-04. Those entries describe the
    same commit points wired directly into the export path, without a separable policy.
- **Complexity:** Low to moderate throughout.
- **Constraints / prerequisites:** Output validation (ADB-VALID-05). A single lifecycle writer or
  an equivalent guard (DF-STATE-02).
- **Reversibility:** High.
- **Evidence gaps:** AG-06.
- **Relevant Gates / Observability:** AC-29, AC-17.
- **Known incompatibility:** None known.
- **When viable:** Generally, whether or not PA-01 has been answered.
- **When not viable:** —

## DF-SESSION-01 — How session-loss state reaches interception points

**Selection mode:** choose-one-or-more (AG-09 may require SESSION-01 + SESSION-02)

### ADB-SESSION-01 — Session-loss state held with the lifecycle authority, queried synchronously by handlers

- **Decision family:** DF-SESSION-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Deck existence, current versions, and export outcomes live with the lifecycle authority.
  - Every session-ending handler (new deck, reload, close) asks the authority whether the action
    loses work under the "undownloaded" rule Product defines. The rule is localized, and replacing
    it does not restructure the handlers.
- **Addresses:** partially_solves AP-SESSION-01.
- **Why this mechanism exists:** AC-30: the state is available wherever a session-ending action is
  intercepted.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** No reference is session-only (RG-03; F-PPT-18, F-OD-06). OpenDesign evidence is
  incomplete for the RQ-06 new-project and close clauses.
- **Assumptions:** Every interception point can query the authority synchronously. **Browser
  reload and close interception is typically synchronous and local to the page (AG-09).**
- **Benefits:** A single source of truth. The PA-02 rule is swappable.
- **Trade-offs:** Handlers must reach the authority in time.
- **Risks / failure modes:** A browser leave-page decision cannot wait for a round-trip, so no
  warning appears, or it always appears.
- **Introduces / exposes:** creates_pressure_on AP-DEP-01 (runtime split). NPC-06.
- **Relationships:**
  - requires ADB-EXPORT-01.
  - compatible_with ADB-STATE-05.
  - Alternative to, or complement of, ADB-SESSION-02.
- **Complexity:** Low to moderate throughout.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** **AG-09 would require a spike before W-035.**
- **Relevant Gates / Observability:** AC-30, AC-17.
- **Known incompatibility:** None known. It may be insufficient alone for reload and close
  (AG-09).
- **When viable:** When the authority and the interception point share synchronous access.
- **When not viable:** When interception must decide locally in the browser without a round-trip.

### ADB-SESSION-02 — A session-loss summary mirrored to the client interception boundary

- **Decision family:** DF-SESSION-01
- **Option role:** Primary alternative
- **Mechanism:**
  - The authority pushes a small derived summary to the client and keeps it current after every
    transition and export: "would lose work: yes or no" under the current rule, plus the inputs
    to that answer.
  - Browser-level interception decides from the local mirror.
- **Addresses:** partially_solves AP-SESSION-01.
- **Why this mechanism exists:** Reload and close interception in a browser must be decided
  locally (UC-011 1B).
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** DeckAgent reasoning. PPTAgent's browser holds only a task id, and unmount only
  closes the socket (F-PPT-18); that is absence.
- **Assumptions:** The mirror is updated before the user can trigger a leave action.
- **Benefits:** Works with synchronous browser interception.
- **Trade-offs:** Two copies of derived state. Staleness windows.
- **Risks / failure modes:** The mirror is stale right after an export or transition, giving a
  wrong warning or none.
- **Introduces / exposes:** NPC-06.
- **Relationships:** requires ADB-EXPORT-01. compatible_with ADB-SESSION-01 as a complement.
- **Complexity:** Moderate throughout.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** AG-09.
- **Relevant Gates / Observability:** AC-30.
- **Known incompatibility:** None known.
- **When viable:** If the authority is not in the page.
- **When not viable:** —

### ADB-SESSION-03 — Conservative warning whenever any deck exists

- **Decision family:** DF-SESSION-01
- **Option role:** Negative evidence
- **Mechanism:** Warn on every session-ending action while a deck exists. Export outcomes are not
  consulted.
- **Addresses:** None (negative evidence).
- **Why this mechanism exists:** It is the cheapest behaviour that never loses work silently.
- **Origin:** Derived from DeckAgent constraints (a narrow reading).
- **Evidence:** R-045 AC2: no warning when nothing is undownloaded. AC-30: the rule can be
  evaluated once Product defines it.
- **Assumptions:** —
- **Benefits:** Trivial.
- **Trade-offs:** —
- **Risks / failure modes:** Spurious warnings after a full export.
- **Introduces / exposes:** —
- **Relationships:** conflicts_with R-045 AC2 and AC-30.
- **Complexity:** Low.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** —
- **Relevant Gates / Observability:** AC-30.
- **Known incompatibility:** It cannot meet R-045 AC2. **Not viable for DeckAgent under current
  V1 constraints.**
- **When viable:** —
- **When not viable:** Under the current Project Hub.

## DF-SESSION-02 — How the session boundary is scoped

**Selection mode:** choose-one

### ADB-SESSION-04 — One session scope that owns all session state and is discarded as a unit

- **Decision family:** DF-SESSION-02
- **Option role:** Primary alternative
- **Mechanism:**
  - All Product state (deck, versions, source, constraints, export records, operation record)
    lives under one session scope.
  - "New deck" replaces the scope atomically. Nothing outside the scope holds session state.
- **Addresses:** partially_solves AP-SESSION-01, AP-DATA-01.
- **Why this mechanism exists:** UC-011 postcondition 1 (nothing carries over), BR-012 rule 1, and
  the semantic session boundary (AP-SESSION-01 invariant).
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Consequence of lacking it:* PPTAgent's content-addressed caches outlive jobs (ADR-PPT-09).
    MCP server state persists across tool calls (DOC-006 §3).
- **Assumptions:** PA-11 is open, so physical deletion of files is a separate decision.
- **Benefits:**
  - The semantic boundary is enforced in one place.
  - Discarding is easy to test.
- **Trade-offs:** Anything that must outlive the session (none in V1) needs an explicit exception.
- **Risks / failure modes:**
  - A component caches session content outside the scope (for example the renderer cache or the
    provider client).
- **Introduces / exposes:** creates_pressure_on AP-DATA-01.
- **Relationships:** compatible_with ADB-STATE-05, ADB-DATA-01, ADB-DATA-02.
- **Complexity:** Low throughout.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** PA-11.
- **Relevant Gates / Observability:** AC-30, AC-11, AC-01.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-SESSION-05 — Per-component clearing on new deck

- **Decision family:** DF-SESSION-02
- **Option role:** Primary alternative
- **Mechanism:** Each component that holds session data exposes its own reset. "New deck" calls
  each reset.
- **Addresses:** partially_solves AP-SESSION-01, AP-DATA-01.
- **Why this mechanism exists:** It fits distributed state without a central scope.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:** DeckAgent reasoning. PPTAgent MCP `save_generated_slides` clears component state
  in the component (F-PPT-10, DOC-006 §3).
- **Assumptions:** Every component is enumerated.
- **Benefits:** No central object.
- **Trade-offs:** Completeness depends on the enumeration.
- **Risks / failure modes:** A newly added component forgets its reset, so state leaks into the
  new session (UC-011 postcondition 1).
- **Introduces / exposes:** —
- **Relationships:** Alternative to ADB-SESSION-04.
- **Complexity:** Low implementation. Moderate maintenance.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** —
- **Relevant Gates / Observability:** AC-30, AC-11.
- **Known incompatibility:** None known.
- **When viable:** With few stateful components.
- **When not viable:** —

---

## 8. Source, role, and data-boundary mechanisms

The three DF-SOURCE-01 options are **largely complementary**. Each addresses a different half of
AC-02: keeping source content out of instructions, and preventing actions.

## DF-SOURCE-01 — Keeping source content as data, not instruction

**Selection mode:** choose-one-or-more (layered)

### ADB-SOURCE-01 — Labelled separation of source content inside model inputs

- **Decision family:** DF-SOURCE-01
- **Option role:** Complementary mechanism
- **Mechanism:**
  - Source content is passed to AI operations in a clearly delimited data section.
  - System and user instructions sit in separate sections.
  - The instructions state that source content is data only.
- **Addresses:** partially_solves AP-SOURCE-01.
- **Why this mechanism exists:** It is the minimal separation at the prompt boundary (R-043).
- **Origin:** Observed in reference system.
- **Evidence:**
  - *Exists:* OpenDesign serializes attachment facts separately from instructions, and the prompt
    layer labels them as task data (F-OD-01, inspected in one strategy path; RG-06). The PPTAgent
    editor prompt says to use source content faithfully (F-PPT-15).
  - *Consequence:* This is not a hard boundary; the agent can still read the source and may be
    influenced by it (F-OD-01 inference).
- **Assumptions:** The model honours the separation well enough in the DOC-008 §4.8 cases.
- **Benefits:** Cheap and universal.
- **Trade-offs:** A probabilistic guarantee only.
- **Risks / failure modes:** An embedded instruction steers content, for example tone or
  omissions.
- **Introduces / exposes:** —
- **Relationships:** compatible_with ADB-SOURCE-02 and ADB-SOURCE-03 (complements).
- **Complexity:** Low throughout.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** RG-06.
- **Relevant Gates / Observability:** AC-02.
- **Known incompatibility:** None inherent. Alone it may not keep source text from altering
  behaviour. Candidate-level assessment needs R-043 test evidence.
- **When viable:** As a baseline layer.
- **When not viable:** As the only layer, if injection tests show steering.

### ADB-SOURCE-02 — Pre-extract the source into a structured content model before any generative step

- **Decision family:** DF-SOURCE-01
- **Option role:** Complementary mechanism
- **Mechanism:**
  - A non-generative ingestion step turns each D-024 source into structured content: sections,
    passages, facts, and tables.
  - Generative steps receive items from that structure, never the raw file.
- **Addresses:** partially_solves AP-SOURCE-01, AP-PROV-01 (addressable anchors), AP-ROLE-01
  (per-type parsing is separated from role).
- **Why this mechanism exists:**
  - It narrows what reaches the model.
  - It gives anchors for provenance (DF-PROV-02).
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent parses the source into a `Document` with sections and media, and planning
    references those sections (F-PPT-15, ADR-PPT-01).
  - *Consequence:* The Web PDF parsing edge at the pinned version is unverified (DOC-006 §3,
    RG-05).
  - *DeckAgent reasoning:* This reduces, but does not eliminate, injection, because passage text
    is still text.
- **Assumptions:** Deterministic parsing is achievable for all five types (including PPTX content
  only, BR-009).
- **Benefits:** Enables provenance anchors and P1 checks. Per-type parsers are isolated (R-038).
- **Trade-offs:**
  - A structured-source model to design and maintain.
  - Loss of nuance from extraction.
- **Risks / failure modes:** Extraction drops or garbles numbers, which violates P1 before
  generation even starts.
- **Introduces / exposes:** creates_pressure_on AP-PROV-01, AP-ROLE-01.
- **Relationships:** compatible_with ADB-PROV-02, ADB-PROV-05, ADB-ROLE-01.
- **Complexity:** Implementation moderate to high (five types). Operational low. Maintenance
  moderate.
- **Constraints / prerequisites:** Parsers for the five D-024 types.
- **Reversibility:** Medium.
- **Evidence gaps:** RG-05.
- **Relevant Gates / Observability:** AC-02, AC-03, AC-16, AC-13.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-SOURCE-03 — AI operations hold no action authority; their outputs are data validated by the system

- **Decision family:** DF-SOURCE-01
- **Option role:** Complementary mechanism
- **Mechanism:**
  - Models and tools invoked during generation and refinement can only return content.
  - They cannot trigger file, network, lifecycle, or other system actions.
  - Any structured output is interpreted by DeckAgent through a fixed, restricted vocabulary.
- **Addresses:** partially_solves AP-SOURCE-01 (the "trigger actions" half), AP-DATA-01,
  AP-OP-01.
- **Why this mechanism exists:** AC-02: source "cannot … trigger actions outside policy". It also
  bounds egress.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent's `CodeExecutor` dispatches only registered edit functions and rejects
    unknown calls (F-PPT-08, ADR-PPT-05). By contrast, OpenDesign delegates to agents with broad
    tool and MCP access (F-OD-01, F-OD-04).
  - *Consequence:* A restricted vocabulary narrows the mutation surface but limits expressiveness
    (F-PPT-08).
- **Assumptions:** Generation does not need model-driven tool use.
- **Benefits:**
  - Injection cannot escalate beyond content.
  - Late results cannot write anything (supports ADB-OP-01).
- **Trade-offs:** Less agentic flexibility.
- **Risks / failure modes:** The vocabulary grows until it effectively becomes general code.
- **Introduces / exposes:** —
- **Relationships:**
  - compatible_with ADB-OP-01, ADB-DEP-01.
  - conflicts_with ADB-DEP-02 in its observed form.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** —
- **Reversibility:** Medium.
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-02, AC-11, AC-28.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** If the generation approach requires autonomous tool use.

## DF-ROLE-01 — Keeping role independent of file type

**Selection mode:** choose-one

### ADB-ROLE-01 — An explicit role attribute on admitted input, separate from format handling

- **Decision family:** DF-ROLE-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Each admitted input carries a role, decided by purpose, and a format.
  - Format selects the parser; role selects how the content is used.
  - V1 permits only the value `content source`, as a declared limit.
- **Addresses:** partially_solves AP-ROLE-01.
- **Why this mechanism exists:** D-007, AC-13, and BR-001 exception 1 (the limit is declared, not
  implicit).
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* OpenDesign keeps attachment media facts separate from task configuration and role
    registries (F-OD-02).
  - *Consequence:* The daemon must resolve and validate the role configuration (F-OD-02).
- **Assumptions:** One role in V1 is enough. No role inference is needed.
- **Benefits:**
  - A second role for PPTX (UC-003 or UC-007 later) adds a value, not a new path.
- **Trade-offs:** A small amount of structure that V1 does not exercise.
- **Risks / failure modes:** It grows into an unused generalized role platform, which
  over-engineering would bring about.
- **Introduces / exposes:** —
- **Relationships:** compatible_with ADB-SOURCE-02.
- **Complexity:** Low throughout.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-13.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-ROLE-02 — Role implied by entry path; per-type parsers shared across paths

- **Decision family:** DF-ROLE-01
- **Option role:** Primary alternative
- **Mechanism:**
  - Role is implicit in which flow accepts the input. V1 has one flow, "create from source",
    which accepts all five types.
  - Parsers are per type and reusable by any later flow.
- **Addresses:** partially_solves AP-ROLE-01.
- **Why this mechanism exists:** It is the simplest shape. There is no role attribute at all.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent's Web path binds role through separate `pptxFile` and `pdfFile` parameters
    and directories. MCP shows that the core does not need that pairing (F-PPT-02).
  - *Consequence:* In PPTAgent Web, role becomes effectively tied to file kind (F-PPT-02).
  - *DeckAgent reasoning:* Here a single flow accepts all types, so the type-to-role binding
    PPTAgent shows does not arise.
- **Assumptions:** Adding a role later means adding a flow.
- **Benefits:** Minimal V1 structure.
- **Trade-offs:** A second role for the same type needs a new entry path and new UI.
- **Risks / failure modes:** A later flow hard-codes "PPTX means deck to edit", which violates
  D-007.
- **Introduces / exposes:** —
- **Relationships:** Alternative to ADB-ROLE-01.
- **Complexity:** Low throughout.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** None.
- **Relevant Gates / Observability:** AC-13.
- **Known incompatibility:** None known. AC-13 forbids "prohibitively hard", and a new flow is not
  that.
- **When viable:** V1 with one role.
- **When not viable:** If later roles must share a flow.

## DF-DATA-01 — Bounding and identifying the user-content footprint

**Selection mode:** base + optional complements (base: DATA-01; complements: DATA-02, DATA-03 conditional)

### ADB-DATA-01 — Declared-sink discipline: all user-content writes and sends go through named sinks

- **Decision family:** DF-DATA-01
- **Option role:** Primary alternative — base
- **Mechanism:**
  - Every place user content may be written or sent is a declared, named sink: the session store,
    held output files, the renderer workspace, the AI provider client, and validation or evidence
    records.
  - No other path touches user content.
- **Addresses:** partially_solves AP-DATA-01; constrains AP-DEP-01.
- **Why this mechanism exists:** AC-11 ("an explicit, identifiable flow"), TN-4 (canary checks).
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Consequence of absence:* PPTAgent writes inputs, caches, and intermediate artifacts across
    `runs/` and `task.json` (F-PPT-01, ADR-PPT-09). OpenDesign agents and MCP tools can receive
    user content (F-OD-01).
- **Assumptions:** Third-party libraries do not create undeclared sinks (logs, temp files).
- **Benefits:**
  - Marker checks can enumerate every declared sink (TN-4).
  - Declaring the AI-provider flow is explicit (AG-05).
- **Trade-offs:** Discipline and review burden. Library logging must be controlled.
- **Risks / failure modes:** A library writes temp files or logs outside the declared sinks.
- **Introduces / exposes:** creates_pressure_on AP-DEP-01.
- **Relationships:** compatible_with ADB-SESSION-04, ADB-VALID-08, ADB-DEP-01.
- **Complexity:** Implementation low to moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** AG-05.
- **Relevant Gates / Observability:** AC-11.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-DATA-02 — Memory-first session content, with disk writes limited to one session workspace

- **Decision family:** DF-DATA-01
- **Option role:** Complementary mechanism
- **Mechanism:**
  - Session content is held in memory.
  - Anything that must touch disk (renderer inputs, held outputs) lives in one session workspace
    directory.
  - Deleting that workspace remains a PA-11 decision.
- **Addresses:** partially_solves AP-DATA-01, AP-SESSION-01.
- **Why this mechanism exists:** It minimizes the footprint, and the session scope matches D-027.
- **Origin:** Derived from DeckAgent constraints.
- **Evidence:**
  - *Contrast:* PPTAgent's durable `runs/` layout (ADR-PPT-09) and OpenDesign's durable workspace
    plus SQLite (F-OD-06) are both designed for persistence that V1 does not have.
- **Assumptions:** Deck sizes fit in memory. The renderer accepts a workspace path.
- **Benefits:** One location to observe or delete. Clear semantics for UC-011 OQ-1.
- **Trade-offs:**
  - A crash loses the session. That is acceptable under D-027 and A-029, but it is a consequence.
- **Risks / failure modes:** The workspace survives a crash, leaving content on disk (PA-11).
- **Introduces / exposes:** —
- **Relationships:** compatible_with ADB-SESSION-04, ADB-DATA-01.
- **Complexity:** Low throughout.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** PA-11.
- **Relevant Gates / Observability:** AC-11, AC-30.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-DATA-03 — Content-addressed persistent cache for expensive preprocessing

- **Decision family:** DF-DATA-01
- **Option role:** Conditional variant — only under a PA-11 reading that allows cross-session artifacts
- **Mechanism:** Parsed or analyzed source artifacts are cached on disk by content hash and reused
  across sessions.
- **Addresses:** None of the frozen APs directly; it is a performance option that constrains
  AP-DATA-01 and AP-SESSION-01.
- **Why this mechanism exists:** It avoids repeated expensive parsing or analysis.
- **Origin:** Observed in reference system.
- **Evidence:**
  - *Exists:* PPTAgent Web keeps MD5-keyed caches under `runs/pptx` and `runs/pdf` (F-PPT-01,
    ADR-PPT-09).
  - *Consequence:* Persistent user content, stale-cache risk, and cleanup and disk-growth issues
    (ADR-PPT-09).
- **Assumptions:** Declared as a sink (AC-11). Product accepts that source content outlives the
  session (PA-11). **Depends on one reading of PA-11.**
- **Benefits:** Performance when the same source is reused.
- **Trade-offs:** Lifecycle and privacy questions that DeckAgent would need to account for under
  D-027 and R-042.
- **Risks / failure modes:** A cached source is used in a new session, contradicting the semantic
  session boundary unless it is strictly invisible to Product state.
- **Introduces / exposes:** creates_pressure_on AP-SESSION-01, AP-DATA-01.
- **Relationships:** Phase 3 analysis required with ADB-SESSION-04.
- **Complexity:** Implementation low. Operational moderate. Maintenance moderate.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** PA-11.
- **Relevant Gates / Observability:** AC-11, AC-30.
- **Known incompatibility:** None against the Gates if declared and not visible across sessions.
- **When viable:** Only if Product accepts on-disk persistence of source-derived artifacts.
- **When not viable:** If PA-11 requires deletion at session end.

---

## 9. Dependency-boundary mechanisms

## DF-DEP-01 — Where external dependencies cross the boundary

**Selection mode:** base + optional complements (base: DEP-01; complements: DEP-03, DEP-02 confined variant)

### ADB-DEP-01 — DeckAgent-owned ports with thin in-process adapters for each dependency

- **Decision family:** DF-DEP-01
- **Option role:** Primary alternative — base
- **Mechanism:**
  - Each external dependency (model provider, renderer, PPTX and PDF writers, parsers) is reached
    only through a DeckAgent-defined port.
  - Adapters enforce bounds (timeouts per D-011 values later) and map failures to operation
    errors.
  - The ports are substitutable in tests.
- **Addresses:** partially_solves AP-DEP-01, AP-OP-01, AP-DATA-01. Relevant to the AC-22 and AC-25
  trade-offs.
- **Why this mechanism exists:**
  - R-032: bounded and determinate.
  - TN-3: replay, fault injection, hold-and-release.
  - AC-11: provider flow identifiable.
- **Origin:** Adapted from reference evidence.
- **Evidence:**
  - *Exists:* PPTAgent wraps OpenAI-compatible clients, a model manager, MinerU, and LibreOffice
    behind modules. LLM calls have tenacity retries (F-PPT-13, F-PPT-11). OpenDesign isolates
    agent variation with declarative `RuntimeAgentDef` and a shared engine (F-OD-16).
  - *Consequence:* PPTAgent still has a custom `python-pptx` fork and a presentation/API module
    cycle as coupling points (F-PPT-13). OpenDesign's Chromium is a shared failure point
    (F-OD-16).
- **Assumptions:** The dependencies are callable in-process or via a local command.
- **Benefits:** A clear test seam (TN-3). Provider changes are localized (R-040, Later).
- **Trade-offs:** Adapter maintenance. Ports may leak dependency semantics.
- **Risks / failure modes:**
  - A port mirrors one provider's API, so a change still spreads.
  - A missing bound means a hang.
- **Introduces / exposes:** —
- **Relationships:** compatible_with ADB-OP-01, ADB-SOURCE-03, ADB-DATA-01.
- **Complexity:** Implementation moderate. Operational low. Maintenance moderate.
- **Constraints / prerequisites:** —
- **Reversibility:** High.
- **Evidence gaps:** AG-04 (values only).
- **Relevant Gates / Observability:** AC-08, AC-11, AC-28; AC-22, AC-25 as trade-offs.
- **Known incompatibility:** None known.
- **When viable:** Generally.
- **When not viable:** —

### ADB-DEP-02 — Delegate the generation loop to an external agent runtime

- **Decision family:** DF-DEP-01
- **Option role:** Conditional variant — confined, text-returning variant only; the observed form is negative evidence
- **Mechanism:**
  - DeckAgent composes the context and hands the whole model-and-tool loop to an external agent
    runtime (a coding-agent CLI or similar).
  - The runtime edits a workspace or returns an artifact.
  - DeckAgent owns detection, handoff, event normalization, and product state.
- **Addresses:** partially_solves AP-DEP-01 (runtime isolation); constrains AP-SOURCE-01,
  AP-DATA-01, AP-OP-01.
- **Why this mechanism exists:** It reuses mature agent loops (tools, context, cancel) instead of
  building one.
- **Origin:** Observed in reference system.
- **Evidence:**
  - *Exists:* OpenDesign calls this its "most load-bearing design decision". Integration is
    declarative (`docs/agent-adapters.md`; F-OD-04, F-OD-16; DOC-007 §4.3, rationale explicit).
  - *Consequence:*
    - Runtime behaviour, safety, and recovery vary by agent (F-OD-04, F-OD-16).
    - Filesystem agents write the workspace directly, and late writes can remain after cancel
      (F-OD-14).
    - Agents and tools may receive user content (F-OD-01).
  - OpenDesign evidence is incomplete for the widened RQ-14 aspects.
- **Assumptions:**
  - The external runtime can be confined: no tools, no direct writes to shared state, a declared
    content flow.
  - It runs locally (D-027).
- **Benefits:**
  - No custom agent loop (AC-21).
  - Access to strong agent capabilities.
- **Trade-offs:**
  - Less control over actions (AC-02), egress (AC-11), and late writes (AC-28).
  - External CLI dependency (AC-22).
- **Risks / failure modes:**
  - An agent writes directly into the deck state, bypassing admission.
  - Source text steers tool actions.
- **Introduces / exposes:** creates_pressure_on AP-SOURCE-01, AP-DATA-01, AP-OP-01.
- **Relationships:**
  - conflicts_with ADB-SOURCE-03 in its observed form.
  - Tension with ADB-OP-01 (a side channel). Phase 3 analysis required.
- **Complexity:** Implementation moderate (integration). Operational high. Maintenance high.
- **Constraints / prerequisites:** Confinement of the runtime.
- **Reversibility:** Low. It is the generation engine.
- **Evidence gaps:** RG-01, AG-05.
- **Relevant Gates / Observability:** AC-02, AC-11, AC-28, AC-08; AC-21, AC-22 as trade-offs.
- **Known incompatibility:** In the observed form (direct workspace writes and broad tool access),
  late writes and tool actions conflict with AC-28 and AC-02. **Not viable for DeckAgent under
  current V1 constraints in the observed form.** A confined variant (text-only runtime,
  materialized into a candidate area; compare the OpenDesign text-artifact profile, F-OD-04) has
  no known incompatibility.
- **When viable:** As a confined, text-returning runtime behind ADB-DEP-01-style ports.
- **When not viable:** With direct workspace writes or tool authority.

### ADB-DEP-03 — Run AI or render work in a separate local process with a message boundary

- **Decision family:** DF-DEP-01
- **Option role:** Complementary mechanism
- **Mechanism:**
  - Generation, rendering, or both run in a separate local worker process.
  - The worker talks to the lifecycle owner through messages.
  - Stop can terminate the worker. Crashes are isolated.
- **Addresses:** partially_solves AP-DEP-01, AP-OP-01; constrains AP-STATE-01, AP-SESSION-01.
- **Why this mechanism exists:**
  - Crash isolation.
  - An enforceable "no side channel" rule: the worker has no access to state.
  - A physical stop option (compare ADB-OP-03).
- **Origin:** Synthesis hypothesis. OpenDesign's sidecars and daemon split exist (F-OD-17, ADR-0001
  in DOC-007 §4.2), but not as an isolation mechanism for DeckAgent's purposes.
- **Evidence:** DeckAgent reasoning. OpenDesign shows that process boundaries add startup and
  lifecycle coordination (DOC-007 §4.2).
- **Assumptions:** Local multi-process deployment is acceptable (D-027, C-002).
- **Benefits:**
  - A structural guarantee that the worker cannot mutate versions.
  - Kill-on-stop reduces RK-007 cost.
- **Trade-offs:**
  - Message protocol, process lifecycle, and startup complexity (AC-21).
  - Content crosses a process boundary (AC-11 sink).
- **Risks / failure modes:**
  - Orphaned workers.
  - Message ordering across processes (compare ADB-OP-05).
- **Introduces / exposes:** creates_pressure_on AP-DATA-01. NPC-06.
- **Relationships:**
  - compatible_with ADB-OP-01, ADB-OP-03.
  - Tension with ADB-REQ-02 (a transactional start across processes). Phase 3 analysis required.
- **Complexity:** Implementation moderate to high. Operational moderate. Maintenance moderate.
- **Constraints / prerequisites:** —
- **Reversibility:** Medium.
- **Evidence gaps:** AG-03.
- **Relevant Gates / Observability:** AC-28, AC-08, AC-11; AC-21, AC-22 as trade-offs.
- **Known incompatibility:** None known.
- **When viable:** If isolation or kill-on-stop is valued in the AC-21/AC-22 comparison.
- **When not viable:** If C-002 rules out the extra runtime complexity. That is a trade-off.

---

## 10. AP coverage matrix

| AP | Decision families | ADB options (viable ones in **bold**) | Coverage note |
|---|---|---|---|
| AP-FLOW-01 | — | — | Composition envelope. No standalone ADB. Checked in W-034. |
| AP-SOURCE-01 | DF-SOURCE-01, DF-PROV-02 | **SOURCE-01, 02, 03**, PROV-05 | Options are complementary rather than alternatives. No option alone gives a demonstrated guarantee; R-043 test evidence is needed. |
| AP-ROLE-01 | DF-ROLE-01 | **ROLE-01, 02**, SOURCE-02 | Adequate. Both are low-cost. |
| AP-DATA-01 | DF-DATA-01, DF-SESSION-02 | **DATA-01, 02**, DATA-03 (PA-11-dependent), **SESSION-04, 05** | Adequate. The AI-provider flow depends on AG-05. |
| AP-INTENT-01 | DF-INTENT-01 | **INTENT-01, 02, 03** | Three options. No reference evidence for rollback (RG-08). INTENT-03 conflicts with runtime P2 checks. |
| AP-REQ-01 | DF-REQ-01 | **REQ-01, 02**, REQ-03 (not viable) | **Weak:** only two viable options, both derived; no reference evidence (RG-03). SA-01 is unaccommodated (NPC-04). |
| AP-STATE-01 | DF-STATE-01, DF-STATE-02, DF-INTENT-01, DF-EXPORT-02 | STATE-01 (not viable), **STATE-02, 03, 04, 05, 06** | Strong option spread. There is no reference evidence for accepted/pending semantics. |
| AP-OP-01 | DF-OP-01, DF-OP-02 | **OP-01, 02**, OP-03 (complement only), **OP-04, 05** | Good. Correctness does not depend on AG-03. |
| AP-OP-02 | DF-OP-03, DF-DELIV-02 | **OP-06, 07**, OP-08 (not viable alone), **DELIV-06** | Adequate. The policies depend on SA-02 and SA-03. NPC-06 (multiple views) is open. |
| AP-VALID-01 | DF-VALID-01, 02, 03 | **VALID-01, 02, 04, 05, 06, 07, 08**, VALID-03 (complement) | Strong, but the choice hinges on AG-01a, AG-01b, and PA-04. |
| AP-PROV-01 | DF-PROV-01, DF-PROV-02 | **PROV-01, 05, 06**, PROV-02 (needs a complement), PROV-03 (cross-check only), PROV-04 (not viable) | **Moderate:** no positive reference evidence (RG-04). NPC-11 (paraphrase semantics) is unresolved. |
| AP-OBS-01 | DF-OBS-01, DF-OBS-02, DF-VALID-02 | **OBS-01, 02, 03, 04, 05**, VALID-06 | Strong spread. AG-01 and AG-02 decide. |
| AP-DELIV-01 | DF-DELIV-01, DF-DELIV-02 | **DELIV-01, 02, 03 (native variant), 04, 05, 06** | Strong spread. Every representation option depends on AG-02. |
| AP-EXPORT-01 | DF-EXPORT-01, DF-EXPORT-02, DF-VALID-02 | **EXPORT-01, 03, 04, 05**, EXPORT-02 (not viable) | Adequate. The commit-point options depend on PA-01 and AG-06. |
| AP-SESSION-01 | DF-SESSION-01, DF-SESSION-02 | **SESSION-01, 02, 04, 05**, SESSION-03 (not viable) | Adequate. AG-09 decides between SESSION-01 and SESSION-02, or requires both. |
| AP-DEP-01 | DF-DEP-01 | **DEP-01, 03**, DEP-02 (confined variant only) | Adequate. |

APs with weak coverage: **AP-REQ-01**, where the alternatives come from DeckAgent constraints
only, and **AP-PROV-01**, where there is no positive reference evidence and paraphrase semantics
are open. No AP has zero coverage, apart from AP-FLOW-01, which is intentional.

---

## 11. Evidence-to-mechanism trace

| Evidence | What it establishes | ADB entries informed | Transfer caution |
|---|---|---|---|
| F-OD-07, F-OD-14 | In-place mutation with restore. Status race resolved, while late or partial writes remain. | STATE-01 (negative), STATE-06, OP-01, OP-03, OP-04 | Durable projects, and no pending gate. RQ-07 and RQ-14 are incomplete (RG-01). |
| F-OD-09, F-OD-10 | The completion gate checks integrity only. Live preview is not gated. Quality is layered and optional. | VALID-01, VALID-02, VALID-03, OBS-02 | Multi-artifact platform. RQ-09 is incomplete. |
| F-OD-11, F-OD-12, F-OD-13 | Preview and export render stored HTML. A version-pinned export is stable, an unpinned one is not. The default PPTX is screenshots. | DELIV-03, DELIV-04, DELIV-05, OBS-04, VALID-06 | Screenshot PPTX contradicts UC-008 postcondition 4. |
| F-OD-04, F-OD-16, DOC-007 §4.3 | The agent loop is delegated, with declarative runtime adapters (explicit rationale). | DEP-01, DEP-02 | Broad tool access. Behaviour varies by runtime. |
| F-OD-01, F-OD-02 | Transport is separated from instructions (one strategy path). Role is separate from media type. | SOURCE-01, ROLE-01, DATA-01 | RG-06: generality. |
| F-OD-03, F-OD-05 | Intent is assembled from messages, with no typed set. Provenance is at file level. | INTENT-03, PROV-04 (negative) | — |
| F-PPT-07, F-PPT-08, ADR-PPT-06 | Retry per slide attempt on fresh copies, with restricted edit APIs. Web skips failed slides. | STATE-02, VALID-04, SOURCE-03 | Paper and code differ (retry counts, REPL vs API). Partial decks conflict with HM-2 and HM-3. |
| F-PPT-09, ADR-PPT-08 | Post-hoc evaluation never changes state. | VALID-03 | PPTEval's async path is unverified at the pin. |
| F-PPT-06, F-PPT-10, F-PPT-17, ADR-PPT-07 | A PPTX-shaped model with a custom fork. The PDF is analysis-only. Output targets are cross-cutting. | DELIV-02, OBS-05, OBS-03 | There is no PDF delivery path. |
| F-PPT-15, ADR-PPT-01 | Source linkage survives planning but not the editor stage. | PROV-02, PROV-05, SOURCE-02 | There is no end-to-end provenance. |
| F-PPT-16 | Artifacts can be reparsed and rendered, with no comparison against a version. | VALID-06, OBS-03, OBS-05 | — |
| F-PPT-18, F-PPT-19, F-PPT-20 | No version or export ledger. No stop, and jobs overlap. Request state is isolated by object lifetime. | EXPORT-01 (by contrast), OP-02, OP-06, SESSION-02 | Absence evidence is not direction (RG-02). |
| F-PPT-13, F-PPT-11 | Adapters for providers and tools. Hierarchical failure handling that is not transactional. | DEP-01 | Coupling from the custom fork. |
| ADR-PPT-09 | A persistent content-addressed cache. | DATA-03 | Lifecycle and privacy questions under D-027 and R-042. |
| DOC-008 §5.3 | Runtime feasibility of each check, and the data it needs. | VALID-01, 02, 03, 05, 06; OBS-01, 02, 03; PROV-06; INTENT-01, 03 | Feasibility only. Selection is Product's (F15, PA-04). |
| DOC-008 TN-1, TN-3, TN-6 | Readable constraint set, controllable external calls, readable version status. | INTENT-01, 02, 03; OP-01, 04; DEP-01; EXPORT-01 | TN-6 is narrower than AC-30 (T-P2-04). |
| D-030, BR-010 | The commit boundary and recovery-baseline semantics. | REQ-01, 02, 03; STATE-*; INTENT-*; OP-01 | Authoritative. |

DOC-006 §4.2 was not used as evidence anywhere. Where a similar idea appears (ADB-STATE-03, and
the DF-EXPORT and DF-OP options), it was derived from DeckAgent constraints and labelled
accordingly.

---

## 12. New Problem Candidates

### NPC-01 — Stable identity for versions and operations

- **Discovered from:** ADB-STATE-02, 03, 04, 06; ADB-OP-01; ADB-DELIV-04; ADB-EXPORT-01;
  ADB-VALID-08.
- **Problem:** Versions and operations need identities that stay unique and non-reused within a
  session. Export records, admission checks, validation records, and session-loss evaluation all
  refer to them.
- **Why architecture-level:** Several families' guarantees (AC-28, AC-30, AC-17) rest on identity.
  A reused identity breaks all of them at once.
- **Possibly already covered by:** AP-STATE-01 and AP-EXPORT-01, implicitly.
- **Needs Phase 3 analysis:** Is it implied by AP-STATE-01's "identifiable state", or is it a new
  AP?

### NPC-02 — Atomic update across multiple state parts

- **Discovered from:** ADB-STATE-06, ADB-INTENT-02.
- **Problem:** Deck version, constraint set or ledger position, and export records must change
  together in one transition, even when they are held in separate structures.
- **Why architecture-level:** Pairing drift breaks BR-010 rules 5 and 7 (AC-07, AC-29).
- **Possibly already covered by:** AP-STATE-01 ("each change must happen completely or not at
  all").
- **Needs Phase 3 analysis:** Does AP-STATE-01's atomicity invariant already cover separate
  stores?

### NPC-03 — Stop arriving during validation or admission

- **Discovered from:** ADB-OP-04, ADB-VALID-01, ADB-VALID-02, ADB-VALID-04.
- **Problem:** If validation is long, for example when it renders, it must be defined whether a
  stop pre-empts it and how that interacts with "exactly one of stop or completion takes effect".
- **Why architecture-level:** Validation placement changes the stop window, and AC-28 requires
  "at any time before it finishes".
- **Possibly already covered by:** AP-OP-01 together with AP-VALID-01 (coupled set K-1).
- **Needs Phase 3 analysis:** Does validation belong to "the operation" for stop purposes?

### NPC-04 — A waiting-for-user state inside a running operation

- **Discovered from:** ADB-REQ-01 ("when not viable"), ADB-PROV-05, ADB-PROV-06 (UC-002 5A: ask
  the user during generation).
- **Problem:** If a running generation can pause for input (SA-01), the operation needs a defined
  suspended state that relates to stop, exclusivity, and terminal states.
- **Why architecture-level:** It changes the operation lifecycle and where the commit boundary
  applies.
- **Possibly already covered by:** SA-01 (ownership TBD), AP-OP-01, AP-REQ-01.
- **Needs Phase 3 analysis:** It depends on SA-01 reconciliation. It could be Product-owned.

### NPC-05 — Determinism of constraint derivation

- **Discovered from:** ADB-INTENT-03.
- **Problem:** If constraints are derived from request history by a model, the effective set can
  differ between generation, validation, and tests.
- **Why architecture-level:** It affects TN-1, P2 runtime checks, and R-024 verification.
- **Possibly already covered by:** AP-INTENT-01.
- **Needs Phase 3 analysis:** Is this an invariant gap in AP-INTENT-01, or only a trade-off?

### NPC-06 — Multiple client views of one session, and client/authority consistency

- **Discovered from:** ADB-OP-06, ADB-OP-08, ADB-SESSION-01, ADB-SESSION-02, ADB-EXPORT-04,
  ADB-DEP-03.
- **Problem:** A local web app can be opened in several tabs or reloaded. Client-held state (the
  session-loss mirror, UI state) can diverge from the authority. It is undefined whether two views
  share one session.
- **Why architecture-level:** It affects BR-014 enforcement, R-045 correctness, and export
  hand-off observation.
- **Possibly already covered by:** No existing AP clearly covers it (AP-OP-02 and AP-SESSION-01
  touch it).
- **Needs Phase 3 analysis:** Is "one session per app instance" a Product question (possibly a new
  SA), or an architecture invariant?

### NPC-07 — Renderer on the admission path

- **Discovered from:** ADB-VALID-01, ADB-VALID-02, ADB-OBS-02.
- **Problem:** If validation needs rendering, renderer availability, latency, and failure become
  part of generation and refinement outcomes.
- **Why architecture-level:** It changes AC-08 failure surfaces, AC-22 critical dependencies, and
  stop latency.
- **Possibly already covered by:** AP-DEP-01, AP-VALID-01.
- **Needs Phase 3 analysis:** Is it covered as pressure, or does it need an explicit invariant?

### NPC-08 — Generation decomposition

- **Discovered from:** ADB-VALID-04, ADB-PROV-05.
- **Problem:** Whether generation and refinement work on parts (slides) or on the whole deck
  changes the validation, retry, and provenance options, and the stop phases.
- **Why architecture-level:** It shapes the operation's internal phases (AC-28 evidence) and
  AC-23 blast radius.
- **Possibly already covered by:** No existing AP clearly covers it. Phase 1 deliberately has no
  generation-pipeline AP.
- **Needs Phase 3 analysis:** Is this a new AP, a trade-off (AC-23), or Detailed Design?

### NPC-09 — Classifying degradation (blocking vs recorded)

- **Discovered from:** ADB-VALID-06.
- **Problem:** Round-trip comparison needs a rule for which version-to-file differences block
  delivery and which are recorded or disclosed.
- **Why architecture-level:** Where the rule is applied affects AC-09 and AC-19. The rule content
  is Product and Testing work.
- **Possibly already covered by:** AP-OBS-01, AP-EXPORT-01. Content via R-026 and BR-013.
- **Needs Phase 3 analysis:** Probably Detailed Design plus Product.

### NPC-10 — Text-measurement agreement across preview, PPTX, and PDF

- **Discovered from:** ADB-OBS-01, ADB-OBS-02, ADB-OBS-04, ADB-DELIV-01, 02, 03.
- **Problem:** Geometry computed or measured in one engine may not match how the PPTX renders in
  the target application or how the PDF renders. R-028 and HM-1 then hold only in the measured
  engine.
- **Why architecture-level:** It determines whether pre-display validation actually protects
  outputs, and it drives RK-006.
- **Possibly already covered by:** AP-OBS-01, AP-DELIV-01 (R-028 "within format limits").
- **Needs Phase 3 analysis:** It is linked to the AG-02 spike.

### NPC-11 — Origin semantics for paraphrased or mixed content

- **Discovered from:** ADB-PROV-01, 02, 05, 06.
- **Problem:** When a refinement rewrites source-derived content (tone, audience), it is undefined
  whether it keeps source origin, and whether a mixed element is allowed.
- **Why architecture-level:** It decides what AC-03 requires of every refinement step, and whether
  origin-by-construction is feasible.
- **Possibly already covered by:** AP-PROV-01 (it states the invariant, not these semantics).
- **Needs Phase 3 analysis:** It may be a Product question (R-007 "meaning preserved") and so a
  candidate SA item.

### NPC-12 — Format capability model and loss determination before export

- **Discovered from:** ADB-DELIV-01, ADB-DELIV-03.
- **Problem:** Known losses per format must be determinable before export (UC-008 3A, R-026). That
  requires knowing what each format can express relative to version content.
- **Why architecture-level:** It couples the representation to the export writers (C-004).
- **Possibly already covered by:** AP-OBS-01 ("known format losses determinable before export").
- **Needs Phase 3 analysis:** Probably covered. Confirm.

---

## 13. Preliminary relationship inventory

Only relationships justified above are listed. This is not the final decision graph.

| From | Relation | To | Basis |
|---|---|---|---|
| ADB-STATE-01 | conflicts_with | ADB-VALID-01, ADB-VALID-02, ADB-DELIV-04 | Working state is visible; no pre-admission isolation |
| ADB-STATE-02 | requires | DF-OP-01 | Admission must know the operation is current |
| ADB-STATE-03 | makes_unnecessary | ADB-DELIV-05 | Immutable values need no copy |
| ADB-DELIV-04 | requires | ADB-STATE-03 | Value semantics |
| ADB-STATE-03 | compatible_with | ADB-EXPORT-01, ADB-SESSION-01, ADB-INTENT-01 | Identity plus values |
| ADB-STATE-03 | requires | DF-STATE-02 (ADB-STATE-05 or ADB-STATE-06) or NPC-02 resolution | Atomic update of references plus paired constraints (AC-29). Immutability alone does not provide it. |
| ADB-STATE-03 | conflicts_with (Phase 3 analysis required) | ADB-DELIV-02 | A mutable library object graph as the value |
| ADB-STATE-05 | compatible_with | ADB-REQ-01, ADB-EXPORT-03/04/05, ADB-SESSION-01 | Single writer for transitions |
| ADB-REQ-02 | conflicts_with (Phase 3 analysis required) | ADB-STATE-05 | Runner writes versus sole writer |
| ADB-REQ-02 | conflicts_with (Phase 3 analysis required) | ADB-DEP-03 | Transactional start across processes |
| ADB-REQ-03 | conflicts_with | ADB-REQ-01, ADB-REQ-02 | BR-010 rule 4 |
| ADB-INTENT-02 | requires | ADB-STATE-05 or NPC-02 resolution | Atomic version and ledger update |
| ADB-INTENT-03 | conflicts_with | ADB-VALID-01, ADB-VALID-02 (if PA-04 selects P2 checks) | No explicit set at the validation point |
| ADB-OP-01 | makes_unnecessary | ADB-OP-03 (for correctness) | Admission guard |
| ADB-OP-04 | requires | ADB-OP-01 or ADB-OP-02 | A terminal state to compare-and-set |
| ADB-OP-02 | requires | DF-OP-02 | A race rule |
| ADB-OP-08 | conflicts_with | AC-28 evidence line | No structural prevention |
| ADB-VALID-02 | requires | ADB-OBS-01 or ADB-OBS-02 | Geometry before display |
| ADB-VALID-02 | conflicts_with | ADB-OBS-03 | Geometry exists only after export |
| ADB-VALID-05 | required_by | ADB-EXPORT-03, 04, 05 | Promotion only after output validation |
| ADB-EXPORT-01 | required_by | ADB-SESSION-01, ADB-SESSION-02 | Session-loss state inputs |
| ADB-EXPORT-01 | makes_unnecessary | ADB-EXPORT-02 | Superset |
| ADB-EXPORT-02 | conflicts_with | AC-30 criterion text | No version or format dimension |
| ADB-EXPORT-05 | localizes the choice among | ADB-EXPORT-03, ADB-EXPORT-04 | A replaceable promotion policy over identifiable events. Not runtime configuration. |
| ADB-DELIV-06 | depends on | SA-03 reading | — |
| ADB-DELIV-03 (screenshot variant) | conflicts_with | UC-008 postcondition 4, D-015 | Not editable |
| ADB-PROV-05 | requires | ADB-SOURCE-02 | Addressable source items |
| ADB-PROV-03 | conflicts_with | AC-03 rationale (as primary) | Reconstructs rather than preserves |
| ADB-SOURCE-03 | conflicts_with | ADB-DEP-02 (observed form) | Tool authority |
| ADB-DEP-02 | creates_pressure_on | AP-SOURCE-01, AP-DATA-01, AP-OP-01 | Side channels |
| ADB-VALID-01/02 | creates_pressure_on | AP-DEP-01, AP-OP-01 | NPC-03, NPC-07 |
| ADB-OBS-01 | compatible_with (Phase 3 analysis required) | ADB-DELIV-01 vs 02 vs 03 | Where layout is computed |
| ADB-SESSION-01 | complements (Phase 3 analysis required) | ADB-SESSION-02 | Depends on AG-09 |
| ADB-DATA-03 | conflicts_with (Phase 3 analysis required) | ADB-SESSION-04 | Cross-session artifacts |

---

## 14. Evidence gaps and spikes before later selection

| Gap | Affected ADB options | What would distinguish the options | Latest phase to resolve |
|---|---|---|---|
| AG-01a — post-layout geometry before display | VALID-01, VALID-02, OBS-01, OBS-02, OBS-03, DELIV-01/02/03 | Whether a candidate representation yields geometry before display at acceptable cost and latency, and how close it is to output geometry | Before W-035 (spike) |
| AG-01b — rendered image before display | VALID-02, OBS-02, OBS-04 | Whether local headless rendering is feasible inside operations | Before W-035 (spike) |
| AG-02 — real PPTX fidelity | DELIV-01, DELIV-02, DELIV-03 (native), OBS-01, VALID-05, VALID-06 | Build a PPTX with native objects from each candidate representation, open it in the evidence application (F8), and compare with preview | Before W-035 (spike). Full compatibility is learned in implementation (D-026). |
| AG-03 — outstanding calls after stop | OP-03, DEP-03 (cost side); OP-01 (none) | Provider cancellation behaviour and late-response timing. Correctness does not depend on it if an admission guard exists | Before W-035 only if OP-03 or DEP-03 is relied on |
| AG-05 — declared provider content flow | DATA-01, DEP-01, DEP-02 | Exactly what each operation sends to the provider | W-034 (per candidate) |
| AG-06 — observable delivery events | EXPORT-03, EXPORT-04, EXPORT-05 | Which post-production events a local web app can observe reliably | Before W-035 (spike); Product answers PA-01 |
| AG-09 — interceptable session-ending events | SESSION-01, SESSION-02, OP-08 | Whether reload and close decisions can consult the authority synchronously | Before W-035 (spike) |
| AG-04 — timeout and retry values | DEP-01, VALID-04 | Does not distinguish options | Benchmark (D-011) |
| RG-01 — OpenDesign widened RQs | STATE-01, STATE-06, OP-01, OP-04, VALID-01, SESSION-01, DEP-02 | OpenDesign's constraint restoration, the post-failure state after a check, and new-project and close behaviour | Optional W-031 follow-up; otherwise carried as incomplete |
| RG-04 — no content-provenance reference | PROV-* | A prototype carrying origin through one refinement | Before W-035 if PROV-05 or PROV-06 is relied on |
| RG-08 — no constraint-rollback reference | INTENT-* | — (no reference will provide it) | Carried |
| RG-02, RG-03 | Lifecycle, export, and session options | — | Carried; reasoning is from DeckAgent constraints |
| PA-01, PA-02, PA-04, PA-11, SA-02, SA-03 | EXPORT-03/04, EXPORT-02, VALID-01/02/03, INTENT-03, DATA-03, DELIV-06, OP-06/07 | Product answers | Product; options that accommodate several answers are flagged, not preferred |

---

## 15. Phase 2 handoff

### Decision families created (24)

| Area | Families |
|---|---|
| State | DF-STATE-01, DF-STATE-02 |
| Intent and request | DF-INTENT-01, DF-REQ-01 |
| Operation | DF-OP-01, DF-OP-02, DF-OP-03 |
| Validation | DF-VALID-01, DF-VALID-02, DF-VALID-03 |
| Observability and provenance | DF-OBS-01, DF-OBS-02, DF-PROV-01, DF-PROV-02 |
| Delivery, export, session | DF-DELIV-01, DF-DELIV-02, DF-EXPORT-01, DF-EXPORT-02, DF-SESSION-01, DF-SESSION-02 |
| Boundaries | DF-SOURCE-01, DF-ROLE-01, DF-DATA-01, DF-DEP-01 |

### Mechanism options created (66)

| Area | Options |
|---|---|
| State | ADB-STATE-01 … 06 |
| Intent and request | ADB-INTENT-01 … 03; ADB-REQ-01 … 03 |
| Operation | ADB-OP-01 … 08 |
| Validation | ADB-VALID-01 … 08 |
| Observability | ADB-OBS-01 … 05 |
| Provenance | ADB-PROV-01 … 06 |
| Delivery | ADB-DELIV-01 … 06 |
| Export | ADB-EXPORT-01 … 05 |
| Session | ADB-SESSION-01 … 05 |
| Boundaries | ADB-SOURCE-01 … 03; ADB-ROLE-01, 02; ADB-DATA-01 … 03; ADB-DEP-01 … 03 |

Kept as negative evidence ("Not viable for DeckAgent under current V1 constraints", in full or in
the stated form):
- STATE-01, REQ-03, EXPORT-02, SESSION-03, PROV-04;
- OP-03 and OP-08 as sole mechanisms;
- PROV-03 as primary;
- DELIV-03 in its screenshot variant;
- DEP-02 in its observed form.

### APs with strong option coverage

AP-STATE-01, AP-OP-01, AP-VALID-01, AP-OBS-01, AP-DELIV-01.

### APs with weak or no option coverage

- **AP-REQ-01:** two viable options, both derived, with no reference evidence. SA-01 is not
  accommodated.
- **AP-PROV-01:** no positive reference evidence, and NPC-11 is open.
- AP-FLOW-01 has no family, by design.

### Most consequential new problem candidates

| NPC | Why it matters |
|---|---|
| NPC-01 | Identity underpins AC-28, AC-30, and AC-17 |
| NPC-06 | Multiple client views; no AP clearly covers it |
| NPC-08 | Generation decomposition; no AP covers it |
| NPC-10 | Measurement agreement determines whether pre-display checks protect outputs |
| NPC-11 | Paraphrase origin semantics, possibly Product-owned |

### Relationships Phase 3 must analyze

- The cross-cutting representation choice DF-DELIV-01 × DF-OBS-01 × DF-PROV-01 × DF-STATE-01. This
  is the ADB-STATE-03 versus ADB-DELIV-02 tension, and it determines whether geometry exists before
  display (AG-01a).
- DF-VALID-01 × DF-OP-02: stop during validation (NPC-03).
- DF-REQ-01 × DF-STATE-02 × DF-DEP-01: who writes at the commit boundary; process split.
- DF-INTENT-01 × DF-VALID-01: runtime P2 check (T-P2-01).
- DF-EXPORT-02 × DF-SESSION-01 × NPC-06: client-observed events and mirrors.
- DF-DEP-01 × DF-SOURCE-01 × DF-OP-01: confined external runtimes versus side channels.

### Blocking issues before Phase 3

None block starting Phase 3. Items to carry:
- The tensions T-P2-01 … T-P2-04 (§1). Frozen APs are unchanged.
- NPC-04 and NPC-11 may turn into Product questions (new SA candidates).
- Spikes AG-01a, AG-01b, AG-02, AG-06, and AG-09 must be resolved before W-035, not before Phase 3.
