# Phase 1 — Architecture Problem Map

- Input: `01-context.md` (Phase 0, frozen). Scratch file under `trash/` (gitignored).
- Built: 2026-09-30. AP IDs are fixed from this phase on; never renumber.

## 1. Method and scope

- Problems are derived from Project Hub (source of truth) and the DOC-004 criteria. The Phase 0 IDs
  (PA, SA, AG, RG, T) are reused unchanged.
- Each problem groups the architecture pressures that share one structural responsibility.
  Criteria are not mapped one-to-one: one AC may feed several problems, and several ACs may feed one.
- Problems describe outcomes and invariants only. No mechanism, representation, storage, component,
  state machine, technology, or candidate is named or implied.
- Reference research (DOC-006, DOC-007) is used only to show that a problem admits real architectural
  variation, or that evidence is missing. No AP exists because a reference system has a component,
  and DOC-006 §4.2 hypotheses are not used.
- Trade-off dimensions (AC-21 … AC-27) remain comparison dimensions. They appear as pressure inside
  APs and in §6, never as pass/fail problems.
- New items discovered in this phase are marked `[P1]`.

## 2. Problem Map

---

## AP-FLOW-01 — Core Flow integration envelope (cross-cutting)

> **Role:** a cross-cutting integration envelope, not a mechanism-seeking problem. Phase 2 does not
> look for a standalone FLOW mechanism. AP-FLOW-01 is the check that the options chosen for the
> other APs compose into a complete, local V1 Core Flow (the AC-01 walkthrough).

### Problem
Every V1 Core Flow step must be reachable end to end: prompt with an optional D-024 source, first
deck, preview, repeated whole-deck refinement with keep or reject, and PPTX plus PDF export of the
previewed version. The flow must run locally without hosting, accounts, or any user object-level
editing.

### Why architecture-level
Completeness is a property of how the parts compose. A structure that lacks a refine → re-preview
loop, or a path to both outputs, fails structurally, and adding a feature later cannot fix it
(DOC-004 AC-01 rationale). No single mechanism provides it, so this entry is used to check the
composition of the other APs.

### Driven by
- D-012, D-024 … D-027, D-006, D-015; R-006, R-011, R-019, R-020, R-029 AC1, R-041; C-002
- AC-01, AC-12; trade-off pressure from AC-21, AC-22
- UC-001, UC-002, UC-004, UC-008, UC-013, UC-015; BR-009, BR-012

### Must hold
- All five D-024 source types, and a prompt with no source, can reach a first deck.
- Refinement can repeat without limit. Each result can be previewed and then kept or rejected.
- PPTX and PDF can both be produced from whichever version is previewed.
- No Core Flow step requires the user to manipulate slide objects. Deep editing is handed off
  through PPTX.
- The whole flow runs on the user's machine, with state limited to the session.

### Product ambiguity
- PA-10: source size and page limits are open (handled in AP-ROLE-01). The composed flow must still
  work under whatever limits Product sets.

### Evidence gaps
- RG-05: the PPTAgent Web path was not verified end to end at the pinned version.
- Neither reference system implements this exact flow (no preview plus refine loop in PPTAgent; no
  accepted/pending model in OpenDesign), so there is no complete reference walkthrough (RG-02, RG-03).

### Related problems
- AP-FLOW-01 requires (composition check over) AP-ROLE-01, AP-STATE-01, AP-DELIV-01, AP-EXPORT-01
  and AP-OP-01: the loop is complete only if admission, versions, preview/export binding, export,
  and operation termination compose end to end.
- AP-FLOW-01 constrains AP-DEP-01: the local-only runtime (D-027) limits which dependencies are
  admissible.

### Later-phase questions
Composition checks, applied to each assembled candidate:
- Which responsibilities are on the critical path of each V1 Use Case step?
- Where does the local runtime boundary lie between the user's browser session and local processing?
- Which Core Flow steps depend on external services, and which on local ones only?

### Out of scope / deferred
Stop (AP-OP-01) and new deck (AP-SESSION-01) are assessed in their own problems (DOC-004 AC-01 note).
Existing-deck editing (D-013), local edits (D-014), and editor surfaces (D-015) are excluded.

---

## AP-SOURCE-01 — Source trust and instruction separation

### Problem
Source content must enter and move through generation and refinement as untrusted data. It must
stay distinguishable from user instructions, and it must never alter system instructions or trigger
actions.

### Why architecture-level
Every path that reads source content crosses this trust boundary, so it cannot reliably be added
per feature (AC-02).

### Driven by
- R-043, R-004 AC1; BR-008; D-024
- AC-02
- UC-002 step 3; UC-004 step 3 (source used as grounding for refinement)

### Must hold
- Source content cannot become an instruction, whether during generation, during refinement, or
  when used as grounding for later refinements.
- The user's request and the source content are distinguishable wherever both reach an AI
  operation.
- No path lets source text trigger an action outside policy.

### Product ambiguity
None known.

### Evidence gaps
- RG-06: OpenDesign's transport separation was inspected in one strategy path only (F-OD-01).
- Both references show that the source–agent boundary can be soft (F-OD-01 inference; F-PPT-02).
  Whether that holds under DeckAgent's AC-02 is a question for candidate evaluation, not settled
  evidence.

### Related problems
- AP-SOURCE-01 overlaps_with AP-DATA-01: the same content flows are governed for trust (here) and
  for exposure (there).
- AP-SOURCE-01 creates_pressure_on AP-PROV-01: keeping source content distinguishable is a
  precondition for tracking its origin.
- AP-SOURCE-01 creates_pressure_on AP-INTENT-01: request content must be separable from source
  content before intent is captured.
- AP-SOURCE-01 overlaps_with AP-ROLE-01: both act at the input boundary, but the two can vary
  independently.

### Later-phase questions
- Where do instructions and source content first enter, and how is each carried to AI operations?
- Which paths could let source text act as an instruction or trigger an action?

### Out of scope / deferred
Sanitization, prompt structure, and isolation technique (AC-02 "Does not require").

---

## AP-ROLE-01 — Input admission and role independence from file type

### Problem
An input's semantic role must be decided by purpose, not fixed by its file type. V1's
content-source-only role must be a declared limit, and adding a later role for an
already-supported type must not require restructuring. Inputs outside the V1 boundary must be
refused with disclosure and no state change.

### Why architecture-level
Binding role to extension in the structure (for example, a type that can only ever be a content
source) would lock out valid later workflows (AC-13, D-007 Active).

### Driven by
- R-003, R-004; BR-001, BR-009, BR-013; D-007, D-024; A-014
- AC-13; AC-01 (the five D-024 source types must reach generation)
- UC-002 steps 1–2, 1A, 2A, 2B, 3A

### Must hold
- File type limits technical capability only. It does not permanently decide role.
- V1's content-source-only role is a declared limit, not implicit (BR-001 exception).
- Adding a second role for an already-supported type does not require restructuring.
- Unsupported, multiple, oversized, or unreadable inputs are refused with disclosure and no state
  change (UC-002 1A, 2A, 2B, 3A).
- A PPTX used as a source contributes content only (BR-009 rule 2).

### Product ambiguity
- PA-10: size and page limits are open. Admission must work with whatever limits Product sets.

### Evidence gaps
- Reference contrast: PPTAgent's Web adapter ties role to file kind through separate parameters
  (F-PPT-02). OpenDesign models role separately from media type (F-OD-02). This confirms the
  variation exists; neither is direction.

### Related problems
- AP-ROLE-01 overlaps_with AP-SOURCE-01 (same boundary, independent property).
- AP-ROLE-01 constrains AP-FLOW-01: only admitted inputs reach the Core Flow.

### Later-phase questions
- Where is an input's role decided, and what information decides it?
- What would adding a second role for a supported file type touch?
- Where are inputs refused, and what state exists before admission?

### Out of scope / deferred
Role-selection UI and runtime role inference (AC-13 "Does not require"). L-001 (OCR, XLSX/CSV,
images, URLs, multiple sources, embedded images) is Later.

---

## AP-DATA-01 — User-content footprint and egress

### Problem
Every place user content (request, source, deck) is written or sent must be intended and
identifiable to verification, including logs, temporary artifacts, caches, rendering tools, and AI
providers. Content sent to an external provider must be an explicit, identifiable flow.

### Why architecture-level
Process, network, and storage boundaries are fixed by the architecture. Where temporary artifacts
live, and what crosses to external services, cannot be retrofitted (AC-11).

### Driven by
- R-042 (including its note that sending to AI providers must be considered by W-028); D-027; BR-012
- AC-11; DOC-008 TN-4 via DOC-004 §10.7
- UC-002, UC-011 (step 5, OQ-1)

### Must hold
- No user content appears in logs, temp artifacts, or outbound flows beyond the declared set.
- Each declared flow, including to AI providers, is identifiable, so verification can check all of
  them.
- Session-only state (D-027) is not contradicted by content persisting beyond what the design
  declares.

### Product ambiguity
- PA-11: whether session files are deleted when the session ends is open and not gated (AC-11 does
  not require deletion). The architecture must support either answer.

### Evidence gaps
- AG-05: which user content goes to the AI provider, and how that flow is declared.
- Reference contrast: PPTAgent keeps content-addressed caches across jobs (ADR-PPT-09), and
  OpenDesign lets agents and tools read attachments (F-OD-01). Both show that footprint varies with
  architecture. Neither is DeckAgent evidence.

### Related problems
- AP-DATA-01 overlaps_with AP-SOURCE-01 (same flows, different property).
- AP-DATA-01 overlaps_with AP-DEP-01: each external dependency is a potential egress point.
- AP-DATA-01 overlaps_with AP-SESSION-01: session end is where the footprint question arises.

### Later-phase questions
- Where is user content written during generation, refinement, preview, validation, and export?
- Which external services receive user content, and at which boundary?
- What remains on disk after a session ends?

### Out of scope / deferred
Encryption scheme, provider choice, and local-only models (AC-11 "Does not require"). Accounts and
data-deletion UI are Later (R-051, R-052).

---

## AP-INTENT-01 — Intent capture, attribution, and availability

### Problem
User intent and constraints must be captured as state that later operations can use independently
of visible deck content. Each constraint must stay attributable to the request that introduced it,
so it can be applied, kept, or cancelled when the version lifecycle requires.

### Why architecture-level
Two questions are settled structurally, not per feature: whether intent is available to
refinement without being re-inferred from the deck (AC-04), and whether constraints can be
attributed to requests (AC-07 rationale). The lifecycle problem (AP-STATE-01) cannot restore
constraints it cannot attribute.

### Driven by
- R-001, R-002, R-009, R-024; BR-003; D-025, D-030; A-009, A-013
- AC-04, AC-07 (constraint half), AC-29 (constraint half); AC-25 via TN-1 (trade-off)
- UC-001 step 2 and postcondition 2; UC-002 step 4; UC-004 steps 2′–3 and postcondition 2; UC-013
  postcondition 2

### Must hold
- Constraints still in effect are available to every later refinement, even when the current deck
  no longer shows them.
- A new request's constraints are separable from the accepted constraint set until that request's
  commit boundary.
- Constraints introduced by a request can be identified as a group, so they can be cancelled on
  reject, stop, failure, or refusal.
- The user is not forced to declare everything up front (R-001 AC3), and clarification is
  targeted, not a checklist (R-002).

### Product ambiguity
- PA-06: constraint lifetime, conflict handling, and how single-refinement constraints are told
  apart (BR-003 exception) are open. The architecture must be able to apply any lifetime rule
  Product later sets without restructuring. DOC-004 treats this as learnable later, not gating.
- SA-04 `[P1]`: after a failed or stopped first generation, are the request's captured intent and
  constraints kept for a retry? BR-010 rule 5 covers refinements only. UC-001 4B and UC-002 5C
  "suggest retry" without saying what the retry reuses.

### Evidence gaps
- RG-08: neither reference system shows constraint rollback. PPTAgent keeps request-derived fields
  on a reused object (F-PPT-20); OpenDesign spreads intent across messages and prompt inputs
  (F-OD-03).
- RG-01: OpenDesign does not cover the widened RQ-07/RQ-14 constraint clauses.

### Related problems
- AP-INTENT-01 constrains AP-STATE-01: attribution defines what reject and rollback can restore.
- AP-INTENT-01 overlaps_with AP-REQ-01: pre-flight is where a request's constraints are captured
  but not yet applied.
- AP-INTENT-01 creates_pressure_on AP-DEP-01: intent must reach AI operations without depending on
  one provider's context handling.

### Later-phase questions
- Where does captured intent live relative to deck content, and what reads it?
- How is a constraint linked to the request that introduced it?
- What must be readable to verify that the active constraint set is correct after each turn?

### Out of scope / deferred
Constraint expiry rules and conflict resolution (Product, PA-06). Constraint representation
(Detailed Design).

---

## AP-REQ-01 — Request pre-flight and the refinement commit boundary

### Problem
A refinement request may need interpreting, clarifying, warning, confirming, or refusing before any
AI operation begins, and none of that may change version or constraint state. The point where
pre-flight ends and the operation begins must be one identifiable place. It is reached directly
when no pre-flight step is needed, and it is where the D-030 promotion and constraint application
happen.

### Why architecture-level
D-030 ties a version change to the start of an AI operation. If pre-flight steps can change state,
or if the boundary is not a single identifiable point, then cancel and refusal semantics, rollback
targets, and constraint ordering all become undefined (AC-29 rationale).

### Driven by
- D-030; BR-010 rules 3b, 4, 5; BR-011; BR-013; R-002; R-011 AC3; R-024 AC2–3
- AC-29 (commit-boundary half), AC-04, AC-07; AC-17 (pre-commit cancel must be observable)
- UC-004 steps 2 and 2′, alternatives 1A, 2A, 2B, 2C; UC-001 3A; UC-002 4A

### Must hold
- Before the commit boundary, no version changes and the new request's constraints are not applied.
- A request cancelled or refused before the boundary leaves the pending version (if any) pending,
  keeps none of the request's constraints, and ends the use case.
- When nothing remains to clarify, warn, or confirm, the boundary is reached directly, with no
  added confirmation.
- At the boundary, in this order: any pending version is promoted, its constraints become the
  accepted set, the request's constraints are applied, and then the AI operation starts.
- Unsupported refinement types are refused with disclosure (UC-004 2C). Slide-targeted requests
  get the best-effort disclosure first (BR-011).
- The point at which promotion at the boundary is committed is identifiable (AC-29).

### Product ambiguity
- SA-01: whether a running generation can pause for user input (UC-002 5A). That would mean
  interaction after the operation has started. For first generation there is no commit-boundary
  rule, so ownership is TBD.
- No other open Product semantics: D-030 fully defines the boundary for refinements.

### Evidence gaps
- RG-03: neither reference system has a commit boundary. PPTAgent has no refinement transaction
  (F-PPT-07); OpenDesign has no pending gate (F-OD-07).
- RG-01: OpenDesign's RQ-07 "new request while a candidate is under review" clause is uncovered.

### Related problems
- AP-REQ-01 requires AP-INTENT-01: constraint application at the boundary needs attributable
  request constraints.
- AP-REQ-01 constrains AP-STATE-01: the boundary is one of the defined promotion events.
- AP-REQ-01 constrains AP-OP-01: the boundary defines the recovery baseline a later stop or
  failure returns to.
- AP-REQ-01 overlaps_with AP-OP-02: a request arriving while an operation runs is resolved before
  pre-flight (BR-014).

### Later-phase questions
- Where does pre-flight end and the AI operation begin, and what enforces that nothing changes
  earlier?
- Which responsibility decides that no clarification, warning, or confirmation remains?
- What state is visible if the transition at the boundary is interrupted?

### Out of scope / deferred
Wording of clarification or disclosure (UI). Classifying requests into the 7 D-025 types is
behavior; only its placement before the boundary is architectural.

---

## AP-STATE-01 — Version authority over paired deck and constraint state

### Problem
Once a deck exists, there must be exactly one authoritative accepted version with its constraint
set, and at most one pending version with its own constraint set. Both may change only at the
events BR-010 defines, and each change must happen completely or not at all. Keep, reject,
promotion at the commit boundary, promotion on export, and recovery to the recovery baseline must
each act on deck content and constraint state together.

### Why architecture-level
It decides what owns versions and which paths may change them (AC-29). Reject, stop, failure,
invalid results, and promotion all act on the deck-and-constraint pair. A split that lets one half
move without the other breaks BR-010 rules 5 and 7 and R-024 AC4.

### Driven by
- BR-010 (all 8 rules); BR-005; D-025, D-030; R-011 AC2, R-013 AC2, R-020, R-024 AC2–4, R-031
- AC-06, AC-07, AC-29 (both halves); AC-17 (observability of the lifecycle)
- UC-001 postcondition 1; UC-004 postconditions 1–3; UC-008 step 7 and postcondition 2; UC-013

### Must hold
- Exactly one accepted version once a deck exists; at most one pending version.
- A successful first generation becomes the accepted version directly. A successful refinement
  becomes the pending version.
- Promotion happens only on keep, at the commit boundary, or on export under the Product-defined
  delivery condition. Nothing else promotes.
- Rejecting restores the accepted version the refinement started from, with the pre-request
  constraint set.
- Only one recovery baseline must be retained: the accepted version at the latest commit boundary.
  Older accepted versions need not be kept.
- Each transition is atomic. An interrupted transition leaves an identifiable, consistent state.
- Verification can observe the accepted version, the pending version, and the states before and
  after the last refinement, including after reject, pre-commit cancel, stop, and failure (AC-17).
  It can also tell "pending discarded" from "never created".

### Product ambiguity
- PA-01: which event counts as "delivered" for promotion on export. The architecture must be able
  to commit that promotion at whichever post-production event Product chooses.
- PA-06: constraint lifetime rules act on the constraint half.
- SA-02: what is previewed while a refinement runs after the boundary promoted the pending version.

### Evidence gaps
- RG-02, RG-03: no reference system implements accepted/pending semantics. PPTAgent is one-shot;
  OpenDesign restores history after changing files in place (F-OD-07).
- RG-01, RG-08: OpenDesign coverage of the widened RQ-07 clauses and of constraint survival is
  missing.

### Related problems
- AP-STATE-01 requires AP-INTENT-01: constraint attribution is needed for reject and rollback.
- AP-STATE-01 requires AP-VALID-01: no result enters the lifecycle unvalidated.
- AP-STATE-01 overlaps_with AP-REQ-01, AP-OP-01, AP-EXPORT-01: these are the three sources of
  transitions besides keep and reject.
- AP-STATE-01 creates_pressure_on AP-SESSION-01: version existence is part of session-loss state.
- AP-STATE-01 creates_pressure_on AP-DELIV-01: the previewed version is defined in terms of
  accepted and pending.

### Later-phase questions
- Which single responsibility is authoritative for versions and their constraint sets?
- Which paths are allowed to request a transition, and how is each checked against BR-010?
- What does a partially completed transition look like, and who can observe it?
- What must remain alive while a pending version is under review?

### Out of scope / deferred
Multi-version history (UC-022, BR-016) and persistence across sessions (R-048) are Later.

---

## AP-OP-01 — AI operation termination and result admission

### Problem
Every generation or refinement must end in exactly one terminal state: done, stopped, or error. It
must never hang. Only a result that is admitted by the operation's own completion, and has passed
validation, may create a version. A stop at any time, an external failure or timeout, or a late
result after a stop or failure must create no version and must leave deck and constraints at the
recovery baseline. A stopped or failed first generation leaves no deck.

### Why architecture-level
A stop or failure can arrive while an external call is still outstanding, and that call's result
may arrive later (RK-007). Whether it can still change a version depends on where operation
results are committed and what owns versions (AC-28 rationale). Operation boundaries and the
isolation of external calls from working state are set by the structure (AC-08).

### Driven by
- R-030, R-031 AC2, R-032, R-033, R-046; BR-005, BR-010 rules 1, 5, BR-014 rule 2; D-029, D-030;
  RK-007
- AC-08, AC-28, AC-06 (the invalid-result path), AC-20 (reporting)
- UC-001 4A, 4B, 5A; UC-002 5B, 5C, 6A; UC-004 3A, 3B, 4A; UC-014 2A, 2B and postconditions

These four concerns (Special attention B) are coupled at the admission point, so they are kept in
one problem:
- stopping the user-visible operation;
- accepting or rejecting a late completion;
- restoring deck state;
- restoring constraint state.

Cancelling external work sits in AP-DEP-01. Concurrency sits in AP-OP-02.

### Must hold
- The user can stop a running generation or refinement at any time before it finishes (R-046 AC1).
- A stopped, failed, timed-out, or invalid operation creates no version, accepted or pending.
- A result arriving after the operation has ended as stopped or error cannot create or change a
  version.
- If a stop and a completion coincide, exactly one takes effect.
- A stopped or failed refinement leaves deck and constraints at the recovery baseline: the version
  accepted at its commit boundary, never an older one. A promotion made at the boundary stands.
- No dangling pending version remains after a stop (R-046 AC3).
- Status, terminal state, and failure cause are reportable enough to choose a recovery step
  (AC-20).
- Stopping does not require cancelling the external call (AC-28 "Does not require").

### Product ambiguity
- SA-01: if a generation can pause for user input, a waiting state inside a running operation
  would need a defined relation to stop and to the terminal states.
- SA-04 `[P1]`: what a retry after a failed or stopped first generation reuses.
- PA-05: whether export can be stopped. If yes, the same admission guarantee extends to export
  (DOC-004 §12 watch trigger).

### Evidence gaps
- AG-03: behavior and cost of outstanding external calls after a stop. D-029's reopen condition
  applies if a determinate stop cannot be shown.
- AG-04: timeout and retry values (D-011). Only the values are open; being bounded is a Must hold.
- RG-02: PPTAgent has no stop, late-result, or race semantics (F-PPT-19). That is absence evidence,
  not direction.
- OpenDesign shows a clear winner in status when cancel and completion race, while late file writes
  still land (F-OD-14). This shows that status determinacy and state determinacy can differ.
- RG-01, RG-08: OpenDesign's RQ-14 constraint-restoration clause is uncovered.

### Related problems
- AP-OP-01 requires AP-STATE-01: recovery targets and "creates no version" are defined there.
- AP-OP-01 requires AP-VALID-01: admission depends on the validation outcome.
- AP-OP-01 requires AP-REQ-01: the recovery baseline is fixed at the commit boundary.
- AP-OP-01 overlaps_with AP-DEP-01: external-call boundaries determine where late results can come
  from.
- AP-OP-01 overlaps_with AP-OP-02: exclusivity is what makes a single terminal state per operation
  meaningful.

### Later-phase questions
- At what point is an operation's result committed as a version, and what guards that point?
- In which phases can a stop arrive, and what does each phase leave behind?
- How is a result recognised as belonging to an operation that has already ended?
- What information about the terminal state and its cause exists where the operation is reported?

### Out of scope / deferred
Cost of a stopped external call (RK-007 second half; R-036 Later). Progress UI (R-030 note). Retry
counts and timeout values.

---

## AP-OP-02 — Operation exclusivity and concurrent user actions

### Problem
Only one AI generation or refinement may run in a session at a time. Every other user action that
can arrive during a running operation must resolve to a defined outcome that does not disturb that
operation's result admission or the version state. Those actions are: a new request, keep, reject,
preview, export, and starting a new deck.

### Why architecture-level
Preventing a second operation from starting and committing while one runs depends on where
operations are admitted and committed (AC-28 evidence line). What else can act on version state
during an operation is a structural property, not a UI rule.

### Driven by
- BR-014; R-046; D-029; RK-007
- AC-28 (the one-at-a-time clause); AC-05 (version stability during export); AC-09
- UC-014 2C; UC-011 1A; UC-004 and UC-001 precondition 2; UC-002 precondition 2

### Must hold
- At most one generation or refinement runs at a time. A new request while one runs is resolved as
  wait or stop (UC-014 2C).
- Starting a new deck while an operation runs requires waiting or stopping first (UC-011 1A).
- No concurrent action can make a running operation commit into a version state it did not start
  from.
- An export in progress reads a version that does not change underneath it (AC-05).

### Product ambiguity
- SA-02: what is previewed, and what may be kept, rejected, or exported, while a refinement runs.
- SA-03: whether an export may run at the same time as an AI operation.
- PA-05: whether export itself becomes a stoppable operation under the same rules.

The architecture must be able to apply either answer to SA-02 and SA-03 without restructuring.

### Evidence gaps
- RG-02: PPTAgent allows overlapping jobs (F-PPT-19).
- OpenDesign allows a brief overlap in chat "send now" (F-OD-14). This shows the invariant is not
  universal, and it is only evidence that the variation exists.

### Related problems
- AP-OP-02 constrains AP-OP-01, AP-DELIV-01, AP-EXPORT-01: it defines what may run concurrently
  with each of them.
- AP-OP-02 overlaps_with AP-SESSION-01: session-ending actions during an operation.
- AP-OP-02 overlaps_with AP-REQ-01: a request arriving mid-operation is resolved before its
  pre-flight.

### Later-phase questions
- Which responsibility knows an operation is running, and which actions consult it?
- Which actions can proceed during an operation, and what version do they see?
- How does the design stay open to Product's answers on SA-02 and SA-03?

### Out of scope / deferred
Multi-user or multi-session concurrency (no accounts in V1).

---

## AP-VALID-01 — Validation points and validation observability

### Problem
Validation must be possible at every point where an AI result could become displayed, pending, or
accepted, and on every output file before delivery. At each point, the information the checks need
must be available. Whether validation ran, on which result, and with what verdict must be
observable. Which checks run in the product is decided by Product, not by the architecture.

### Why architecture-level
Validation points fix where results can be inspected before they become visible or authoritative.
An outcome not planned together with its validation point is costly to expose later (AC-10). If
some hard-minimum checks need rendered output (AG-01), rendering must be available before display
or acceptance, which changes how data flows.

### Driven by
- R-033 (including its note), R-021, R-027, R-007; D-028, D-017, D-011
- AC-06, AC-10; AC-14, AC-15, AC-16 (information that must be available at validation points);
  AC-25 (trade-off)
- UC-001 step 5 and 5A; UC-002 step 6 and 6A; UC-004 step 4 and 4A; UC-008 step 5 and 4A

### Must hold
- No AI result is displayed, becomes pending, or becomes or replaces the accepted version before it
  passes validation.
- An invalid result creates no version. After an invalid refinement, deck and constraints are at
  the recovery baseline (with AP-STATE-01 and AP-OP-01).
- No output file is delivered before validation. An invalid file is treated as a failed export
  (UC-008 4A).
- The validation outcome (ran or not, subject, verdict) is observable for generation, refinement,
  PPTX, and PDF.
- Validation works for any set of checks Product selects, including a runtime check of source
  numbers (PA-04).
- The two kinds of check can sit at different points: cheap structural checks, and checks that
  need rendered or laid-out evidence (AP-OBS-01).

### Product ambiguity
- PA-04: which checks run in the product and which only as test oracles, including UC-002 step 6
  (source numbers). If Product requires a check, the information it needs must be present at that
  validation point (for source numbers, source content plus origin from AP-PROV-01).
- SA-05 `[P1]`: a validated pending version whose preview fails to render (UC-015 1A: "deck does
  not change"). Can it still be kept or exported? This bears on whether display-level rendering is
  part of validation.

### Evidence gaps
- AG-01: whether P3 hard-minimum checks need rendered output before display or acceptance.
  DOC-004 §11.
- AG-08: DOC-008 §5.3 (which checks could run at runtime) and F15 were not read, and PH notes say
  DOC-008 is behind.
- Reference contrast: OpenDesign's completion validator checks integrity only, and live preview is
  not behind it (F-OD-09). PPTAgent validates inline for each slide attempt, and PPTEval is post-hoc
  with no effect on state (F-PPT-07, F-PPT-09). This confirms real variation in where the gate sits.
- RG-01: OpenDesign's RQ-09 "state returned to after a failed check" clause is uncovered.

### Related problems
- AP-VALID-01 constrains AP-STATE-01 and AP-OP-01: a result is admitted only after validation.
- AP-VALID-01 depends conditionally on AP-OBS-01: layout, text, and render observability is always
  required (AC-14, AC-15, AC-18), but whether runtime validation uses it depends on PA-04 (which
  checks run in the product) and AG-01 (whether P3 checks need rendered output). Unconditionally,
  AP-OBS-01 creates_pressure_on AP-VALID-01.
- AP-VALID-01 requires AP-PROV-01 when Product selects source-fidelity checks.
- AP-VALID-01 constrains AP-EXPORT-01: validation precedes delivery and any promotion on export.
- AP-VALID-01 creates_pressure_on AP-OP-01 and AP-FLOW-01: rendered checks before display lengthen
  the operation window and add dependencies (AC-21, AC-22).

### Later-phase questions
- At which points can each kind of result be inspected before it becomes visible, authoritative, or
  delivered?
- What information is available at each point?
- Where is each validation outcome recorded or exposed?
- Which checks can run only on rendered output, and where does that output exist relative to the
  display point?

### Out of scope / deferred
Thresholds and rubrics (Final Testing Plan). LLM-judge use. The choice of checks (Product, PA-04).

---

## AP-PROV-01 — Content origin across generation and refinement

### Problem
For content in any version, accepted or pending, the distinction between source-derived,
user-stated, and AI-added content must be kept through every generation and refinement step, and
must be observable. This includes refinement of content that was originally source-derived. AI-added
content must never be presented as source-derived.

### Why architecture-level
An origin distinction lost at one step cannot be recovered later, so it must hold across every
step, not inside one component (AC-03, AC-16 rationale). It shapes what each step receives and
emits.

### Driven by
- R-007, R-008; BR-002; D-017 (P1 critical), D-028 (need 3); A-015
- AC-03, AC-16; AC-10 (if Product requires source checks); AC-25 (trade-off)
- UC-002 step 6, 5A and postconditions 2–3; UC-004 step 3 (source used as grounding for refinement)

### Must hold
- No step presents AI-added or user-stated content as source-derived.
- Origin can be read for content in any version, after generation and after each refinement.
- Content with no basis in the source is either asked about or marked as AI-added (R-008 AC2).
- Source facts, numbers, meaning, and quotations are preserved when derived from the source
  (R-007), and they remain checkable (see AP-VALID-01).

### Product ambiguity
- PA-12: how AI-added content is shown to users. AC-16 requires observability, not display.
- PA-04: whether the product itself checks source numbers.
- SA-01: whether "ask the user" in UC-002 5A happens during a running operation.
- UC-002 OQ-2 / R-007: how "important information" is measured (W-032).

### Evidence gaps
- RG-04: neither reference system keeps content-level origin through edits. PPTAgent drops source
  linkage after the editor stage (F-PPT-15); OpenDesign records file-level origin only (F-OD-05).
  There is no positive reference evidence.

### Related problems
- AP-PROV-01 requires AP-SOURCE-01: source content must remain distinguishable to be tracked.
- AP-PROV-01 constrains AP-STATE-01: pending and accepted versions must both carry observable
  origin.
- AP-PROV-01 creates_pressure_on AP-DEP-01: AI operations must return content whose origin can be
  determined.

### Later-phase questions
- At which steps is origin created, transformed, or at risk of being lost?
- What happens to origin when a refinement rewrites source-derived content?
- Where can a test read the origin of a given piece of content in a pending version?

### Out of scope / deferred
Span-level links back to the source (not required). User-facing origin display (Product).

---

## AP-OBS-01 — Inspectable presentation forms

### Problem
Enough information must be readable, for any version and for each real output file, to detect the
P3 hard-minimum failures and P5 divergences, and to discover degradation between a version and the
real files produced from it. That means geometry and text-fit metrics for preview, PPTX, and PDF;
slide order and text; a rendered view of the whole deck; and version-to-artifact differences.

### Why architecture-level
Whether metrics exist depends on where laid-out content can be inspected, and tests cannot add
this afterwards (AC-14). A rendering path usable outside interactive preview (AC-18), and the
ability to compare real artifacts with their source version (AC-19, D-026), are structural.

### Driven by
- R-021, R-025, R-026, R-027, R-028; D-026, D-028 (needs 1, 2, 5); BR-007; C-004; RK-006; A-017,
  A-022
- AC-14, AC-15, AC-18, AC-19; AC-25 (trade-off)
- UC-015 1B and postcondition 1; UC-008 steps 3 and 5 and 3A

### Must hold
- Geometry and text-fit are observable for preview, PPTX, and PDF.
- Slide order and slide text are readable from each version and from each output built from it.
- A rendered view of every slide of a given version is obtainable without manual interaction.
- Differences between a version and each real PPTX or PDF produced from it can be detected and
  recorded.
- Known format losses are determinable before export, so they can be disclosed (R-026, BR-013,
  UC-008 3A).

### Product ambiguity
- PA-03: whether R-025 and R-028 apply to files exported from a pending version. This affects what
  is compared, not whether it is observable.
- PA-13: which application verifies PPTX first.

### Evidence gaps
- AG-01: whether validation needs rendered evidence (shared with AP-VALID-01).
- AG-02: real-application PPTX compatibility is learned only from real artifacts (D-026).
- Reference contrast: OpenDesign layers source lint, preview telemetry, render, and an optional
  audit, and stores no degradation report (F-OD-10, F-OD-13). PPTAgent can reparse and render
  artifacts but has no version-to-output comparison (F-PPT-16).

### Related problems
- AP-OBS-01 creates_pressure_on AP-VALID-01: if runtime validation needs layout or rendered
  evidence (PA-04, AG-01), it can use only what this makes available at its validation points.
- AP-OBS-01 overlaps_with AP-DELIV-01: the same outputs must be both version-bound and inspectable.
- AP-OBS-01 creates_pressure_on AP-DEP-01: rendering and inspection may add critical dependencies
  (AC-22).

### Later-phase questions
- For each of preview, PPTX, and PDF, where can positions, sizes, and text fit be read?
- How is a rendered whole-deck view of a given version obtained?
- How can a produced file be compared with the version it came from, and where are observed
  degradations recorded?

### Out of scope / deferred
Metrics, thresholds, and tools (Final Testing Plan). Target compatibility application (Product or
Testing). An upfront degradation catalogue.

---

## AP-DELIV-01 — Version binding for preview and outputs

### Problem
Preview must show exactly the previewed version: the accepted version, or the pending version if
one exists and is shown. Every export must be built from exactly the version being previewed when
the export is requested. Preview, PPTX, and PDF of one version must all derive from that version.
Nothing on those paths may regenerate content, and the exported version must not change while the
export runs.

### Why architecture-level
This fixes the direction of data flow between versions, preview, and each output. If outputs are
built from different inputs, or the exported version can differ from the previewed one, P5 is
broken by design (AC-05 rationale).

### Driven by
- R-019, R-020 AC1–2, R-025, R-028; BR-006, BR-007; D-009, D-026; C-004; A-016, A-017
- AC-05, AC-15; AC-01 (the export end of the Core Flow)
- UC-008 step 4; UC-015 steps 1–3 and postconditions

### Must hold
- There is one well-defined previewed version at any time. Preview never changes the deck (UC-015
  postcondition 2).
- An export reads the version previewed at the moment it was requested, and that version is stable
  for the rest of the export.
- No model call and no content regeneration happens on the preview or export paths.
- PPTX and PDF of the same version keep the same facts, numbers, order, and meaning, within format
  limits (BR-007).
- Preview matches the exported files in content, slide order, and layout, within format limits and
  the verified scope (R-028).

### Product ambiguity
- PA-03: whether R-025 and R-028 apply to pending-version exports. The derivation invariant holds
  either way.
- SA-02: what is previewed during a running refinement.
- SA-03: whether an export can run during an AI operation.

### Evidence gaps
- AG-02: real PPTX fidelity (RK-006).
- Reference contrast: OpenDesign's export can read a mutable working file unless pinned to a
  version (F-OD-11). PPTAgent builds output directly from in-memory state and has no preview
  (F-PPT-10). This confirms variation in binding.

### Related problems
- AP-DELIV-01 requires AP-STATE-01: the previewed version is defined over accepted and pending.
- AP-DELIV-01 constrains AP-EXPORT-01: export outcomes refer to a well-defined version.
- AP-DELIV-01 overlaps_with AP-OBS-01.
- AP-OP-02 constrains AP-DELIV-01 (version stability while other actions run).

### Later-phase questions
- What is the path from a version to preview, to PPTX, and to PDF?
- What keeps the version an export reads from changing while the export runs?
- Which step on each path could call a model or otherwise regenerate content?

### Out of scope / deferred
Single vs multiple representations or storage (AC-05 "Does not require"). Output formats beyond
PPTX and PDF (option value only; §6).

---

## AP-EXPORT-01 — Export side effects: failure isolation, outcome recording, and promotion

### Problem
Export is the one artifact-producing path that may also change version state. A cancelled or
failed export, or one that produces an invalid file, must deliver no invalid file and change no
version, and must be retryable without regeneration. A successful export must be recorded against
the version and format that produced it. A successful export of a pending version must promote it,
only after the file has been produced and validated and at the Product-defined delivery event,
never at export start, on cancel, or on failure.

### Why architecture-level
Promotion after a successful export turns the export path, which AC-09 otherwise keeps from
writing to versions, into a trigger for a version change. The trigger must sit where the file is
known to be good (AC-29 rationale). The export outcomes recorded here also feed session-loss state
(AC-30).

### Driven by
- R-020 AC3, R-026, R-027; BR-005, BR-010 rules 3c and 6, BR-013; D-026, D-027
- AC-09, AC-29 (export half), AC-30 (export outcomes), AC-17 (export outcomes observable), AC-10
  (output validation)
- UC-008 steps 3–7, 3A, 4A and postconditions 2 and 5

### Must hold
- No export step writes to the accepted or pending version before the export has succeeded.
- A failed, cancelled, or invalid export leaves both versions unchanged and delivers no invalid
  file. It can be retried without regenerating content.
- Cancelling at the loss-disclosure step leaves a pending version pending (UC-008 3A).
- Promotion on export happens only after successful production and output validation, at the
  delivery event Product defines, and completely or not at all.
- Every successful export outcome is traceable to its version and format, and observable.
- The point at which promotion on export is committed is identifiable.

### Product ambiguity
- PA-01: which event counts as "delivered". The architecture must be able to observe and commit at
  each plausible post-production event and show what moving between them changes. If Product picks
  an event no candidate can observe, the question returns to Product (DOC-004 §11).
- PA-02: what counts as "undownloaded" determines how recorded outcomes are used, not whether they
  are recorded.
- PA-05: whether export can be stopped.
- SA-03: whether export may run at the same time as an AI operation.

### Evidence gaps
- AG-06: which delivery events a candidate can observe in a local web app.
- RG-03: neither reference system records export outcomes against version and format, or promotes
  on export (F-PPT-10, F-PPT-18; F-OD-11).

### Related problems
- AP-EXPORT-01 constrains AP-STATE-01: it is one of the promotion triggers.
- AP-EXPORT-01 requires AP-DELIV-01 and AP-VALID-01.
- AP-EXPORT-01 creates_pressure_on AP-SESSION-01: recorded outcomes are the main input to the
  session-loss decision.
- Internal tension, recorded here as coupling rather than conflicts_with: the "export writes no
  version" isolation (AC-09) and the "successful export promotes" rule (AC-29) must hold on one path.

### Later-phase questions
- Which post-production events are observable (file validated, file handed over, and so on), and
  which can promotion be committed at?
- Where is a successful export outcome recorded, and what reads it?
- What does a retry depend on?

### Out of scope / deferred
Export library or renderer. Ordering of PPTX and PDF production. Stopping an export (PA-05; watch
trigger).

---

## AP-SESSION-01 — Session-loss evaluability

### Problem
V1 is session-only. At every session-ending boundary that can be intercepted (new deck, reload,
close), the system must hold enough current-session state to decide whether an action would lose
undownloaded work under Product's eventual definition, and that state must be available at that
boundary. The state includes whether a deck exists, which versions exist, and each successful
export by version and format. When nothing would be lost, no warning is shown. Starting a new deck
must discard the deck, source, and constraints completely.

### Why architecture-level
The parts that handle session-ending actions may not be the parts that own versions and exports.
If export outcomes are not recorded against version and format, or do not reach those boundaries,
some plausible definitions of "undownloaded" cannot be evaluated, and R-045 AC2 (no needless
warning) cannot be met (AC-30 rationale). This is not a persistence problem.

### Driven by
- R-045, R-020; BR-012; D-027; A-029
- AC-30, AC-17 (export outcomes observable), AC-01 (session-only runtime)
- UC-011 steps 2–6, 1A, 1B, 2A, 3A, 4A; UC-008 postcondition 5

### Must hold
- Deck existence, current versions, and successful export outcomes (by version and format) are
  available wherever a session-ending action is intercepted.
- A warning appears only when an action would lose undownloaded work, and the user can cancel.
- Once Product defines "undownloaded", the warning rule can be evaluated from that state without
  restructuring.
- Starting a new deck yields an empty session: no deck, source, or constraints carried over
  (UC-011 postcondition 1).
- Session-ending actions during a running AI operation follow AP-OP-02.
- Product state is session-scoped (D-027, BR-012 rule 1). Once a session ends or a new deck starts,
  no deck, source, or constraint from the previous session is available to the product or to AI
  operations. Whether temporary or source artifacts are physically deleted or remain on disk is
  not decided here (PA-11; AP-DATA-01).

### Product ambiguity
- PA-02: what counts as "undownloaded" (one format or both; accepted, pending, or latest; reload or
  close vs process termination). UC-011 step 2 ("latest version downloaded") is a partial hint only
  (T-17).
- PA-11: deletion of session files at session end.
- PA-01: whether an exported pending version counts as delivered and promoted affects which version
  counts as saved.

### Evidence gaps
- AG-09 `[P1]`: which session-ending events are interceptable at all in a local web app (reload,
  tab close, app close, local process termination). UC-011 1B assumes a browser leave-page warning.
  DOC-004 AC-30 asks candidates to name uninterceptable events, but no Phase 0 or reference
  evidence covers this.
- RG-01: OpenDesign's RQ-06 new-project and close clauses are uncovered.
- RG-03: no reference system is session-only. PPTAgent keeps durable job files with no outcome
  state (F-PPT-18); OpenDesign has durable projects (F-OD-06).

### Related problems
- AP-SESSION-01 requires AP-EXPORT-01 (recorded outcomes) and AP-STATE-01 (version existence).
- AP-SESSION-01 overlaps_with AP-OP-02 and AP-DATA-01.

### Later-phase questions
- Where are deck existence, versions, and export outcomes held, and how do they reach each place a
  session-ending action is handled?
- Which session-ending events cannot be intercepted?
- What would change to apply each plausible definition of "undownloaded"?

### Out of scope / deferred
Warning UI and modal wording. Persistence across sessions (R-048, Later). A single "downloaded"
flag (AC-30 "Does not require").

---

## AP-DEP-01 — External AI and tool dependency boundary

### Problem
Every call to an external model, tool, renderer, or library that the Core Flow depends on must
cross an identifiable boundary. The call must be bounded so it cannot hang an operation, and its
failure must surface as a determinate operation outcome. The boundary must be placed so that the
effects of a dependency changing or failing are contained. Whether an outstanding call is actually
cancelled on stop is not required.

### Why architecture-level
The dependency structure is fixed when the architecture is chosen (AC-22). External-call boundaries
are also where failures, timeouts, late results, and user-content egress originate (AC-08, AC-11,
AC-28 evidence lines).

### Driven by
- R-032, R-042, R-046; D-011, D-027; C-002; RK-006, RK-007; R-040 (Later)
- AC-08 (external-call part), AC-11 (provider flow), AC-28 (outstanding calls); trade-off pressure
  from AC-21, AC-22, AC-23, AC-25 (TN-3: replacing calls in tests)
- UC-001 4B, UC-002 5C, UC-004 3B, UC-014 2B

### Must hold
- Each external call in generation, refinement, validation, preview, and export crosses an
  identifiable boundary.
- Every external call is bounded. A failure or timeout becomes an error outcome of the enclosing
  operation, not a hang (R-032).
- An external result arriving outside its operation's lifetime is subject to AP-OP-01 admission.
- User content crossing to a provider is a declared flow (AP-DATA-01).

### Product ambiguity
None known. Timeout and retry values are deliberately deferred (D-011) and are not a Product
question.

### Evidence gaps
- AG-03: cost and behavior of outstanding calls after stop.
- AG-04: timeout and retry values.
- AG-05: the declared provider flow.
- Reference contrast: OpenDesign delegates the entire agent loop, so behavior varies by runtime
  (F-OD-04, F-OD-16). PPTAgent wraps providers in adapters but depends on a custom `python-pptx`
  fork (F-PPT-13). This confirms variation in dependency placement.

### Related problems
- AP-DEP-01 overlaps_with AP-OP-01 and AP-DATA-01.
- AP-DEP-01 is constrained by AP-FLOW-01 (local runtime), AP-OBS-01, and AP-VALID-01 (rendering
  dependencies).
- AP-DEP-01 is under pressure from AP-INTENT-01 and AP-PROV-01: intent and origin must survive the
  model boundary.

### Later-phase questions
- Which external dependencies are on the Core Flow's critical path?
- Where does each cross the system boundary, and what bounds it?
- What else stops or changes if one of them fails or is replaced?
- Can each be substituted with recorded, failing, or held-and-released responses for verification?

### Out of scope / deferred
Provider, model, or library choice. Multi-provider support (R-040 Later). Retry counts and timeouts.

---

## 3. Problem dependency map

| From | Relation | To | Why |
|---|---|---|---|
| AP-STATE-01 | requires | AP-INTENT-01 | Reject and rollback restore the constraint set, which needs request attribution |
| AP-REQ-01 | requires | AP-INTENT-01 | Constraints are captured in pre-flight and applied only at the boundary |
| AP-REQ-01 | constrains | AP-STATE-01 | The commit boundary is a promotion event |
| AP-REQ-01 | constrains | AP-OP-01 | The boundary fixes the recovery baseline for stop and failure |
| AP-OP-01 | requires | AP-STATE-01 | "No version" and "recovery baseline" are defined by the lifecycle |
| AP-VALID-01 | constrains | AP-STATE-01, AP-OP-01 | Admission into the lifecycle only after validation |
| AP-OBS-01 | creates_pressure_on (conditional dependency) | AP-VALID-01 | Observability is always required. Runtime validation uses it only if PA-04 selects such checks or AG-01 shows P3 checks need rendered output |
| AP-VALID-01 | requires | AP-PROV-01 | Only if Product selects source-fidelity checks (PA-04) |
| AP-VALID-01 | creates_pressure_on | AP-OP-01, AP-FLOW-01, AP-DEP-01 | Rendered checks before display lengthen operations and add dependencies (AG-01) |
| AP-EXPORT-01 | constrains | AP-STATE-01 | Successful export is a promotion trigger |
| AP-EXPORT-01 | requires | AP-DELIV-01, AP-VALID-01 | Outcomes refer to a bound version; delivery follows output validation |
| AP-SESSION-01 | requires | AP-EXPORT-01, AP-STATE-01 | Session-loss state is made of versions plus recorded export outcomes |
| AP-DELIV-01 | requires | AP-STATE-01 | The previewed version is defined over accepted and pending |
| AP-OP-02 | constrains | AP-OP-01, AP-DELIV-01, AP-EXPORT-01, AP-SESSION-01 | Defines what may happen while an operation runs |
| AP-DEP-01 | overlaps_with | AP-OP-01 | Late results originate at external-call boundaries |
| AP-SOURCE-01 | creates_pressure_on | AP-PROV-01, AP-INTENT-01 | Source and request content must be distinguishable first |
| AP-SOURCE-01 | overlaps_with | AP-ROLE-01 | Same input boundary; trust and role vary independently |
| AP-PROV-01 | constrains | AP-STATE-01 | Every version must carry observable origin |
| AP-DATA-01 | overlaps_with | AP-SOURCE-01, AP-DEP-01, AP-SESSION-01 | Same content flows, different property (exposure) |
| AP-FLOW-01 | requires (composition check) | AP-ROLE-01, AP-STATE-01, AP-DELIV-01, AP-EXPORT-01, AP-OP-01 | Envelope: checks that the chosen options compose into the complete local Core Flow; not a mechanism dependency |

No `conflicts_with` relationship was found between APs. The tensions that exist are inside single
problems (AP-EXPORT-01: isolation vs promotion) or are trade-off pressure (AP-VALID-01 rendered
checks vs AC-21/AC-22).

## 4. Problem clusters

| Cluster | APs | Shared concern |
|---|---|---|
| **Product state and lifecycle** | AP-STATE-01, AP-INTENT-01, AP-REQ-01 | What is authoritative, what is candidate, and when each changes |
| **AI operation boundary** | AP-OP-01, AP-OP-02, AP-DEP-01 | How operations start, end, exclude each other, and admit results |
| **Input, content trust, and origin** | AP-ROLE-01, AP-SOURCE-01, AP-PROV-01, AP-DATA-01 | Which inputs are admitted and in what role, what content is, where it came from, where it may go |
| **Validation and observability** | AP-VALID-01, AP-OBS-01 | What can be inspected, where, and before what |
| **Delivery and session** | AP-DELIV-01, AP-EXPORT-01, AP-SESSION-01 | Which version leaves the system, what that changes, what is at risk |
| **Cross-cutting integration envelope** | AP-FLOW-01 | Composition check over all clusters, not a cluster of its own mechanisms |

## 5. Coupled problems

**K-1 — Lifecycle core: AP-STATE-01 + AP-INTENT-01 + AP-REQ-01 + AP-OP-01 (+ AP-VALID-01)**
A choice about where candidate results live, or when they are committed, also decides:
- what reject, stop, failure, and invalid results restore;
- when request constraints take effect;
- where the commit boundary sits.

Optimising versions alone can leave constraints unattributable. Optimising stop alone can let a
late result bypass the lifecycle. Optimising pre-flight alone can move the boundary.

**K-2 — Delivery chain: AP-DELIV-01 + AP-EXPORT-01 + AP-SESSION-01 + AP-STATE-01**
Which version an export reads, how its outcome is recorded, whether it promotes, and whether the
session-loss rule can be evaluated form one chain:
- A binding choice that ignores outcome recording can make "undownloaded" unevaluable.
- A promotion placement that ignores validation can promote on a bad file.
- PA-01 and PA-02 both land on this chain.

**K-3 — Evidence for validation: AP-VALID-01 + AP-OBS-01 + AP-PROV-01**
Validation can use only the evidence that exists at its point:
- Observability (AP-OBS-01) is always required. It becomes a validation input only if PA-04
  selects such checks or AG-01 shows rendered evidence is needed. In that case, observability and
  validation placement must be decided together.
- If Product requires source checks (PA-04), origin must be present at that point too.

Choosing observability only for tests risks leaving runtime validation unable to see what it needs.

**K-4 — Operation timing: AP-OP-01 + AP-OP-02 + AP-DEP-01**
Late results, races, and concurrency all originate where external calls cross the boundary and
where operations are admitted. Treating "stop" as a UI concern, or concurrency as a queueing
detail, would leave RK-007 unaddressed.

## 6. Primary vs supporting problems

### Primary structural problems
A wrong choice would reshape large parts of the architecture.
- AP-STATE-01: version authority and paired state
- AP-OP-01: operation termination and result admission
- AP-DELIV-01: data-flow direction from version to preview and outputs
- AP-VALID-01: placement of validation relative to visibility and authority
- AP-PROV-01: origin must survive every step and cannot be recovered later
- AP-INTENT-01: availability and attribution of intent, inseparable from AP-STATE-01

### Supporting structural problems
Architecture-level, but more localized once the primary problems are shaped.
- AP-REQ-01: a boundary definition inside K-1
- AP-OP-02: exclusivity rules
- AP-EXPORT-01: export side effects
- AP-SESSION-01: state availability at session boundaries
- AP-OBS-01: inspectability. Escalates to primary if AG-01 shows rendered checks must precede
  display.
- AP-SOURCE-01: source trust and instruction separation
- AP-ROLE-01: input admission and role independence
- AP-DATA-01: content footprint
- AP-DEP-01: gate aspects of external calls

### Cross-cutting integration envelope
- AP-FLOW-01: not mechanism-seeking. Phase 2 creates no standalone FLOW options. It is used to
  check that the options chosen for the other APs compose into the complete, local V1 Core Flow
  (AC-01 walkthrough, AC-12).

### Trade-off-only concerns
Compared in writing in W-035, never pass/fail, and not standalone APs.

| Concern | AC | Stresses |
|---|---|---|
| Team feasibility and learning curve (C-002) | AC-21 | All; especially AP-OBS-01, AP-VALID-01, AP-DEP-01 |
| External dependency cost | AC-22 | AP-DEP-01, AP-OBS-01, AP-FLOW-01 |
| Blast radius | AC-23 | K-1, K-2 |
| Rollback and redesign cost; DOC-002 §20 reopen conditions | AC-24 | AP-STATE-01, AP-DELIV-01, AP-PROV-01 |
| Testability cost (TN-1, TN-3, TN-5) | AC-25 | AP-INTENT-01, AP-DEP-01, AP-OP-01, AP-OBS-01 |
| Output-target extensibility (C-003, R-039) | AC-26 | AP-DELIV-01, AP-OBS-01 |
| Translation readiness (R-044) | AC-27 | AP-INTENT-01, AP-PROV-01, AP-OBS-01 (layout under length change) |
| Input-type extension (R-038), provider independence (R-040) | none explicit | AP-ROLE-01, AP-DEP-01 |
| Existing-deck editing watch trigger (DOC-004 §12) | none | AP-STATE-01 (watch for a candidate whose accepted version can only come from generation) |

## 7. Product ambiguities carried forward

| ID | Unresolved | Affects |
|---|---|---|
| PA-01 | Which event counts as "delivered" | AP-EXPORT-01, AP-STATE-01, AP-SESSION-01 |
| PA-02 | What counts as "undownloaded" | AP-SESSION-01, AP-EXPORT-01 |
| PA-03 | Whether R-025 and R-028 apply to pending-version exports | AP-DELIV-01, AP-OBS-01 |
| PA-04 | Which checks run in the product vs as test oracles | AP-VALID-01, AP-PROV-01, AP-OBS-01 |
| PA-05 | Whether export can be stopped | AP-EXPORT-01, AP-OP-01, AP-OP-02 |
| PA-06 | Constraint lifetime and conflicts | AP-INTENT-01, AP-STATE-01 |
| PA-10 | Source size and page limits | AP-ROLE-01, AP-FLOW-01 |
| PA-11 | Deletion of session files | AP-DATA-01, AP-SESSION-01 |
| PA-12 | Display of AI-added content | AP-PROV-01 |
| PA-13 | First PPTX verification application | AP-OBS-01 |
| SA-01 | Can a running generation pause for user input (ownership TBD) | AP-OP-01, AP-REQ-01, AP-PROV-01 |
| SA-02 | Preview and allowed actions during a running refinement (ownership TBD) | AP-OP-02, AP-DELIV-01, AP-STATE-01 |
| SA-03 | Export concurrent with an AI operation (ownership TBD) | AP-OP-02, AP-EXPORT-01, AP-DELIV-01 |
| SA-04 `[P1]` | Is intent from a failed or stopped first generation reused on retry (ownership TBD) | AP-INTENT-01, AP-OP-01 |
| SA-05 `[P1]` | Can a validated pending version whose preview fails to render be kept or exported (ownership TBD) | AP-VALID-01, AP-DELIV-01, AP-STATE-01 |

## 8. Evidence gaps carried forward

| ID | Missing evidence | Affects | Blocks W-033 now? |
|---|---|---|---|
| AG-01 | Whether P3 checks need rendered output before display or acceptance | AP-VALID-01, AP-OBS-01 | No. W-033 must keep both placements open. It must be settled before W-035 recommends a baseline. |
| AG-02 | Real-application PPTX compatibility | AP-OBS-01, AP-DELIV-01 | No. It is learned from implementation (D-026). |
| AG-03 | Outstanding external calls after stop | AP-OP-01, AP-DEP-01 | No for synthesis. It is needed for AC-28 assessment and could trigger D-029's reopen condition. |
| AG-04 | Timeout and retry values | AP-OP-01, AP-DEP-01 | No. Benchmark (D-011). |
| AG-05 | Declared AI-provider content flow | AP-DATA-01, AP-DEP-01 | No, but W-033 must address it explicitly. |
| AG-06 | Observable delivery events | AP-EXPORT-01 | No. W-034 per candidate. |
| AG-07 | Snapshot drift since DOC-004's trace check | All traces | Cheap prerequisite: re-verify traces before W-033 cites them. |
| AG-08 | DOC-002 and DOC-008 (§5.3, TN, F12, F14, F15) unread; DOC-008 behind per PH | AP-VALID-01, AP-OBS-01, AP-INTENT-01 | Partly. W-033 needs DOC-008 §5.3 to reason about runtime checks. |
| AG-09 `[P1]` | Interceptability of session-ending events in the local runtime | AP-SESSION-01 | No. Needed for AC-30 assessment. |
| RG-01 | OpenDesign's widened RQ-06/07/09/14 clauses | AP-STATE-01, AP-REQ-01, AP-OP-01, AP-VALID-01, AP-SESSION-01, AP-INTENT-01 | No. W-033 must mark OpenDesign evidence on these as incomplete. |
| RG-02 | PPTAgent evidence is mostly absence for lifecycle, stop, and preview | AP-STATE-01, AP-OP-01, AP-OP-02, AP-DELIV-01 | No. Absence is not direction. |
| RG-03 | No reference has accepted/pending, commit boundary, session-only state, or export outcomes | AP-STATE-01, AP-REQ-01, AP-EXPORT-01, AP-SESSION-01 | No. W-033 proceeds without reference evidence here. |
| RG-04 | No reference keeps content-level origin | AP-PROV-01 | No. Same as RG-03. |
| RG-05 | PPTAgent Web path not verified at the pinned version | AP-FLOW-01 | No. Confidence caveat. |
| RG-06 | OpenDesign findings from one strategy path | AP-SOURCE-01, AP-REQ-01 | No. Generality caveat. |
| RG-08 | No reference evidence on constraint rollback | AP-INTENT-01, AP-STATE-01, AP-OP-01 | No. |

## 9. Deferred and non-architecture concerns

Deliberately not APs:
- Retry counts and timeout values (AG-04; D-011)
- UI layout, progress design, and the wording of warnings or disclosures (R-030 note, BR-011,
  BR-013)
- Validation thresholds and rubrics (Final Testing Plan)
- Test framework selection
- Choice of AI provider, library, or framework
- Persistence beyond V1 (R-048, UC-021)
- Existing-deck editing (D-013, UC-003)
- Local object editing (D-014, UC-023)
- Translation implementation (R-044, UC-025)
- Themes (UC-017)
- Outline review (UC-016)
- Accounts and sharing (UC-009, UC-010, UC-019, UC-020)
- Output formats beyond PPTX and PDF, other than their option value (AC-26)
- Cost of a stopped external call (RK-007 second half; R-036 Later)
- Classifying requests into the 7 D-025 types, other than its placement before the commit boundary
  (AP-REQ-01)

Pressure from these items is recorded inside the APs above (for example, AC-27 layout pressure
under AP-OBS-01, and AC-26 under AP-DELIV-01).

## 10. Phase 1 handoff

### Problem set

| AP | Purpose |
|---|---|
| AP-FLOW-01 | Cross-cutting envelope: the chosen options must compose into a complete, local Core Flow with no editor dependency |
| AP-SOURCE-01 | Source content stays untrusted data, separate from instructions |
| AP-ROLE-01 | Inputs admitted or refused with disclosure; role not bound to file type |
| AP-DATA-01 | Every place user content is written or sent is intended and identifiable |
| AP-INTENT-01 | Intent is available independently of the deck and attributable to requests |
| AP-REQ-01 | Pre-flight changes nothing; one identifiable commit boundary with ordered effects |
| AP-STATE-01 | One accepted version and at most one pending, as paired deck and constraint state, changing only at BR-010 events |
| AP-OP-01 | Every operation ends in one terminal state; only admitted, validated results create versions |
| AP-OP-02 | One AI operation at a time; defined outcomes for concurrent user actions |
| AP-VALID-01 | Validation is possible and observable before visibility, authority, and delivery |
| AP-PROV-01 | Source, user-stated, and AI-added origin kept and observable in every version |
| AP-OBS-01 | Layout, text, render, and degradation evidence obtainable for versions and real outputs |
| AP-DELIV-01 | Preview and both outputs bound to exactly the previewed, stable version, with no regeneration |
| AP-EXPORT-01 | Export failures change nothing; successes are recorded; promotion only after validated delivery |
| AP-SESSION-01 | Session-loss decision can be evaluated at every interceptable session-ending boundary |
| AP-DEP-01 | External calls are identifiable, bounded, and contained |

### Highest-coupling problems
- **K-1:** AP-STATE-01, AP-INTENT-01, AP-REQ-01, AP-OP-01, with AP-VALID-01
- **K-2:** AP-DELIV-01, AP-EXPORT-01, AP-SESSION-01, AP-STATE-01
- **K-3:** AP-VALID-01, AP-OBS-01, AP-PROV-01
- **K-4:** AP-OP-01, AP-OP-02, AP-DEP-01

### Inputs required by Phase 2
- For every AP: the "Must hold" invariants and "Later-phase questions" as the index for mechanism
  options, and the AC IDs as the assessment hook.
- Coupled sets K-1 … K-4 must be addressed as units. Options for one member must state their
  effect on the others.
- Every Product-owned point (PA-01 … PA-06, PA-10 … PA-13) must be accommodated. Before any SA item
  (SA-01 … SA-05) is treated as Product-owned, it needs source reconciliation.
- For each evidence gap, Phase 2 must state whether a mechanism option depends on it (especially
  AG-01, AG-03, AG-05, AG-08) and which evidence would decide it.
- Reference evidence per AP, with the RG caveats. Absence evidence and DOC-006 §4.2 are not inputs.
- Trade-off-only concerns (§6) are inputs to comparison, not to screening.
- AP-FLOW-01 is a composition check applied to assembled options (W-034), not a Decision Bank
  entry that needs its own mechanisms.
- AP-SOURCE-01 and AP-ROLE-01 get separate options. Where one option affects both, it must say so.
