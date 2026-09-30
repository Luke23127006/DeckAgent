# Architecture Acceptance Criteria (DOC-004)

- Status: Draft
- Produced by: W-028; updated by W-037 · Used by: W-029, W-030, W-031, W-033, W-034, W-035 ·
  Referenced by DOC-008 (W-032, W-036)
- V1 boundary: D-024 … D-028 (W-026), D-029 and D-030; V1 Business Rules BR-001 … BR-003,
  BR-005 … BR-014; V1 Use Cases UC-001, UC-002, UC-004, UC-008, UC-011, UC-013, UC-014, UC-015
- Criterion set: AC-01 … AC-30. IDs are stable and independent of kind. AC-28 … AC-30 were
  appended by W-037; no earlier ID was renumbered or reused.
- Project Hub baseline: local snapshot synced 2026-09-30 03:05 UTC (schema 4). Every ID cited here
  was checked against it; Project Hub remains the source of truth.
- Updated: 2026-09-28 (W-037: accepted/pending version lifecycle, stopping an AI operation,
  session-only work, alignment with DOC-008). Refined the same day so that AC-01, AC-17, AC-29
  and AC-30 leave "delivered" and "undownloaded" to Product. Updated 2026-09-30 (W-037, D-030):
  promotion at a refinement's commit boundary, rollback to the version accepted there, and
  BR-010 rule numbers aligned with Project Hub.
- Language: this English file is the canonical source. A Vietnamese reader version exists for
  human reading; it predates the W-037 update. If the two differ, this file wins.

## 1. What this document is for

DeckAgent has no architecture yet. Sprint 2 produces one: reference systems are researched,
candidate mechanisms and candidate architectures are built, and one candidate is chosen as the
architecture baseline (W-035). This document fixes, before any of that, what every acceptable
architecture must achieve and how candidates are compared. Criteria come first so that the
requirements are not bent to justify a solution already in mind (D-011).

It defines the criteria that W-033 … W-035 use to evaluate reference-system findings, candidate
mechanisms, and candidate architectures against the DeckAgent V1 boundary. Reference-system
researchers (W-030, W-031) link their findings to AC IDs to show relevance; they do not evaluate
anything against the criteria.

Criteria state required outcomes and comparison dimensions. They do not choose mechanisms: no
criterion requires or forbids an intermediate/canonical representation, normalization approach,
parser-vs-AI split, state representation, storage, routing, agent structure, or localized-edit
mechanism (D-011). Each criterion therefore carries a **Does not require** line.

Criteria also do not make Product decisions. Where Project Hub leaves a behavior undefined — for
example what counts as "delivered" or "undownloaded" — the criteria are written to hold under any
answer, and the open point is listed in §11. Product defines the meaning; a criterion may require
the architecture to preserve the state, boundaries, observability, and commit points needed to
apply whichever meaning Product chooses, but never lets a candidate choose it.

There is no existing DeckAgent architecture or product code to preserve (A-004 is Retired).
Criteria evaluate candidates on their own terms, not as changes to a current design.

## 2. Where it fits in the Architecture workflow

| Step | Work | Document | Role of DOC-004 |
|---|---|---|---|
| V1 boundary | W-026 | D-024 … D-028 | Sets the scope the criteria are written against |
| Criteria | W-028 | DOC-004 | This document |
| Criteria update | W-037 | DOC-004 | Aligns the criteria with R-045, R-046, D-029 and BR-009 … BR-014 (27/09/2026); appends AC-28 … AC-30 |
| Research contract | W-029 | DOC-005 | Turns the criteria into research questions RQ-01 … RQ-17, each mapped to AC IDs. AC-28 … AC-30 are not yet mapped (§6) |
| Reference research | W-030, W-031 | DOC-006, DOC-007 | Researchers link findings to AC IDs to show relevance. No outcomes, no verdicts |
| Mechanisms | W-033 | DOC-009 | Findings are evaluated against the criteria; candidate mechanisms are organized by the problems the criteria describe |
| Candidates | W-034 | DOC-009 | Criteria keep 2–3 candidate architectures tied to DeckAgent's problem |
| Trade-off and baseline | W-035 | DOC-009 | Candidates are assessed (§5) and compared; the baseline is chosen |

Testing runs alongside. The documents divide the work as follows:

- **DOC-004 (this document)** states what every acceptable architecture must make possible
  (Gates), make observable (Observability needs), or be compared on (Trade-off dimensions).
- **DOC-008 (W-032)** states what must be verified: verification targets, evaluation modes,
  testability needs (TN-1 … TN-6), and findings on Product ambiguity. A testability need becomes
  part of a criterion here only where §10.7 says so; the others are compared as testability cost
  (AC-25).
- **W-036** maps verification onto the selected architecture: verification boundaries, check
  placement, failure points, and commit points.
- **The Final Testing Plan** (after Detailed Design) holds concrete thresholds, tools, test cases,
  repetition counts, and execution details.

Which checks the product itself runs at the validation points of AC-10 is a Product question
(R-033; DOC-008 F15). Neither this document nor DOC-008 decides it.

## 3. How to use it

### 3.1 By role

- **Reference-system researcher (W-030, W-031).** Read §1 … §6, then look up a criterion entry
  when a finding touches it. In each finding, cite the AC IDs it is relevant to and say why. An
  entry's **Evidence to look for** line can hint at what to inspect in the reference system. Do not
  assign `Meets`, `Does not meet`, or `Not yet assessable` to a reference system, and do not
  score or rank it (DOC-005 §2).
- **Mechanism synthesis (W-033).** Evaluate findings against the criteria. For each candidate
  mechanism, state which AC IDs it addresses and which evidence is still missing.
- **Candidate architectures (W-034).** Use the criteria to keep each candidate tied to DeckAgent's
  problem. Gates and Observability needs describe what every candidate must satisfy. For each
  open Product point in §11, state how the candidate would accommodate each plausible answer.
- **Trade-off and baseline (W-035).** Assess each candidate against every Gate and Observability
  need (§5), and compare candidates on every Trade-off dimension in writing, with evidence.
- **Testing (W-036).** §10.7 shows where each DOC-008 testability need landed.

### 3.2 How to read a criterion entry

| Field | What it tells you |
|---|---|
| Criterion | The outcome or property required, or the dimension compared |
| Trace | Where the criterion comes from: Requirements, Business Rules, Use Cases, Decisions, Risks, DOC-002 sections |
| Why architecture-level | Why it must be settled by the architecture rather than added later as a feature |
| Evidence to look for | What to inspect in a candidate to decide the outcome (Gates, Observability needs) |
| Questions to compare | What to compare across candidates (Trade-off dimensions only) |
| Does not require | Mechanisms or details the criterion deliberately leaves open (D-011), and Product semantics it does not assume (§11) |

### 3.3 Version lifecycle terms

The criteria use Project Hub's version lifecycle (BR-010, D-030). The terms below restate it; they
add no semantics. "Commit boundary" is Project Hub's term; "recovery baseline" is DOC-004
shorthand for the deck and constraint state that Project Hub requires to be restored.

| Term | Meaning | Source |
|---|---|---|
| Accepted version | The version the deck returns to on reject or failure. A successful first generation becomes the accepted version directly | BR-010 rules 1, 3, 5, 7, 8; R-031 |
| Pending version | The validated result of a refinement, awaiting the user's decision. A further refinement that reaches its commit boundary first promotes an existing pending version, so at most one exists | BR-010 rules 2, 3b; R-011 AC2 |
| Previewed version | The version the user is currently viewing: the accepted version, or the pending version if one exists and is shown | R-019; UC-015 |
| Exported version | The version an export is built from: the previewed version at the time of export | R-020 AC1; BR-006; UC-008 step 4 |
| Promotion | A pending version becoming the accepted version: when the user keeps it, when a further refinement request reaches its commit boundary, or when a file exported from it "is produced and delivered" | BR-010 rules 3–5; D-030; UC-008 step 7 |
| Commit boundary | The point immediately before a further refinement's AI operation begins. It is reached once the request has not been refused and no clarification, warning, or confirmation remains; if none is needed, it is reached directly, with no added confirmation. Before it, the pending version stays pending and the request's constraints are not applied. At it, the pending version (if any) is promoted, its constraints become the accepted constraint set, and then the request's constraints are applied | BR-010 rules 3b, 4, 5; D-030; UC-004 step 2′; R-024 AC2–3 |
| Recovery baseline (DOC-004 shorthand) | The accepted version and its constraint set that a pending version or a running refinement returns to on reject, stop, failure, or failed validation. For a refinement it is the accepted version at that refinement's commit boundary, which may be a pending version promoted there, never an older one. Only this one baseline must be kept | BR-010 rules 5, 7, 8; R-024 AC4; R-031 AC2; R-046 AC2 |

Project Hub does **not** define, and this document does not assume:

- which event counts as "delivered" for promotion on export;
- whether R-025 and R-028 (worded for the accepted version) also apply to a file exported from a
  pending version;
- what "undownloaded" means for R-045 and BR-012;
- whether an export can be stopped.

See §11 for how each criterion stays neutral on these.

## 4. The three criterion kinds

| Kind | Applied as | Outcomes |
|---|---|---|
| Gate | Screening: a candidate that does not meet a Gate is excluded or must be revised | `Meets` · `Does not meet` · `Not yet assessable` |
| Observability need | Screening: the candidate must make the property observable; how is not prescribed | Same as Gate |
| Trade-off dimension | Comparison only, in written trade-off analysis (W-035); never pass/fail and no numeric score | Narrative comparison with evidence |

- **Gates (AC-01 … AC-13, AC-28 … AC-30)** are invariants every candidate must hold. AC-28 …
  AC-30 are numbered after AC-27 only because IDs are appended, never reused.
- **Observability needs (AC-14 … AC-20)** make P1, P2, P3 and P5 verifiable (D-028), and AC-17
  also makes the version lifecycle verifiable. They require that a property can be observed, not
  that it already holds.
- **Trade-off dimensions (AC-21 … AC-27)** are costs and option values on which candidates are
  compared; no candidate is disqualified on them.

## 5. How assessment works

Outcomes are assigned to DeckAgent candidates, never to reference systems.

| Outcome | Meaning |
|---|---|
| `Meets` | Cited evidence shows the candidate satisfies the criterion |
| `Does not meet` | Cited evidence shows it does not; the candidate is excluded or must be revised |
| `Not yet assessable` | The evidence needed to decide is missing |

`Not yet assessable` means the evidence needed to decide is missing. Record which evidence
(research finding, spike, or prototype) would decide it. It is an evidence gap, not a pass. It
is acceptable during investigation, but before W-035 recommends a candidate as the architecture
baseline, that evidence must be obtained; otherwise the candidate is treated as not meeting the
criterion.

Every assessment cites evidence: a DOC-006/DOC-007 finding, a candidate description in DOC-009,
spike or prototype results, or explicit reasoning labelled as such.

Criteria constrain outcomes, never mechanisms. For example, AC-05 requires every export to be built
from exactly the version being previewed, but its **Does not require** line leaves open whether
versions live in one storage location, one representation, or several components. A candidate may
meet AC-05 with any of these.

## 6. Quick criterion map

**Researched through** lists the DOC-005 research questions mapped to each criterion. AC-28 …
AC-30 have no mapped RQ until DOC-005 is updated; the RQs that already touch them (RQ-07, RQ-11,
RQ-14) are noted but not claimed as mappings.

| ID | Kind | Short name | Researched through |
|---|---|---|---|
| AC-01 | Gate | V1 Core Flow completeness | RQ-04, RQ-08, RQ-11 |
| AC-02 | Gate | Source content handled as data | RQ-01 |
| AC-03 | Gate | Source-derived vs other content kept distinct | RQ-05 |
| AC-04 | Gate | Active constraints remain available | RQ-03, RQ-08 |
| AC-05 | Gate | Preview and exports derive from the same version | RQ-06, RQ-11 |
| AC-06 | Gate | Unvalidated results do not become pending or accepted | RQ-07, RQ-09 |
| AC-07 | Gate | One-step reject of the pending version | RQ-07 |
| AC-08 | Gate | Operation failures end in a determinate state | RQ-14 |
| AC-09 | Gate | Cancelled or failed exports change no version | RQ-11, RQ-14 |
| AC-10 | Gate | Validation is possible and verifiable at acceptance and delivery points | RQ-09 |
| AC-11 | Gate | User content exposure is bounded | RQ-01 |
| AC-12 | Gate | No professional-editor dependency in the Core Flow | RQ-15 |
| AC-13 | Gate | No extension-to-role lock-in | RQ-02 |
| AC-14 | Observability need | Geometry and text metrics per output | RQ-10 |
| AC-15 | Observability need | Slide order and text readable from every output | RQ-06, RQ-11 |
| AC-16 | Observability need | Content origin observable | RQ-05 |
| AC-17 | Observability need | Version states observable | RQ-07 |
| AC-18 | Observability need | Whole deck viewable as rendered | RQ-10 |
| AC-19 | Observability need | Output degradation discoverable from real artifacts | RQ-13 |
| AC-20 | Observability need | Operation status and failure cause reportable | RQ-14 |
| AC-21 | Trade-off dimension | Team feasibility and learning curve | RQ-16 |
| AC-22 | Trade-off dimension | External dependency cost | RQ-16 |
| AC-23 | Trade-off dimension | Blast radius | RQ-04, RQ-17 |
| AC-24 | Trade-off dimension | Rollback and redesign cost | RQ-17 |
| AC-25 | Trade-off dimension | Testability cost | RQ-10 |
| AC-26 | Trade-off dimension | Output-target extensibility | RQ-12 |
| AC-27 | Trade-off dimension | Translation readiness | RQ-08 |
| AC-28 | Gate | Stopping an AI operation changes no version | None yet (touches RQ-14) |
| AC-29 | Gate | Version transitions occur only at defined events | None yet (touches RQ-07, RQ-11) |
| AC-30 | Gate | Session-loss state is available | None yet |

## 7. Gates

Gates are invariants every candidate must satisfy. A candidate that does not meet a Gate is
excluded or must be revised (§5). AC-28 … AC-30 appear at the end of this section.

### AC-01 — V1 Core Flow completeness

- **Criterion:** The full V1 Core Flow is supported end to end: prompt, optionally with one
  content source of any type baselined by D-024 → draft → preview → repeated deck-level
  refinement, each result previewed as a pending version the user can keep or reject → PPTX + PDF
  export of the previewed version, running locally without hosting or accounts.
- **Trace:** DOC-002 §5, §16; R-006, R-011, R-019, R-020, R-029 AC1; D-012, D-024–D-027; BR-010;
  UC-001, UC-002, UC-004, UC-008, UC-013, UC-015
- **Why architecture-level:** It determines which parts must exist and how they connect. A
  candidate lacking a refine → re-preview loop or a path to both outputs fails structurally, not
  by missing a feature that can be added later.
- **Evidence to look for:** A walkthrough of the candidate covering each step of the V1 Use Cases
  in the trace, including repeated refinement and keeping and rejecting a pending version; the
  D-024 source types; both PPTX and PDF; local runtime with session-only state (D-027, BR-012).
  The invariants behind these steps are assessed in their own criteria (AC-05 … AC-10, AC-29).
  Stopping an operation (AC-28) and starting a new deck (AC-30) are V1 behaviors outside the Core
  Flow as Product defines it (R-029 AC1, D-012), and are assessed only there.
- **Does not require:** A specific pipeline shape, agent structure, ingestion approach per source
  type, or persistence beyond the active session.

### AC-02 — Source content handled as data

- **Criterion:** Source content is handled as data: it stays distinguishable from user
  instructions and cannot alter system instructions or trigger actions outside policy.
- **Trace:** R-004, R-043; D-024
- **Why architecture-level:** It is a trust boundary crossed by every path that processes source
  content; it cannot be reliably added per feature.
- **Evidence to look for:** Where instructions and source content enter, how each is carried
  through generation and refinement, and which paths could let source text act as an instruction
  or trigger an action.
- **Does not require:** A particular sanitization, prompt structure, or isolation technique.

### AC-03 — Source-derived vs other content kept distinct

- **Criterion:** Generation and refinement preserve the distinction between source-derived and
  other content, so neither AI-added nor user-stated content is presented as source-derived.
- **Trace:** P1; R-007
- **Why architecture-level:** A distinction lost at one step cannot be recovered later, so it
  must hold across every step rather than in one component.
- **Evidence to look for:** How each step that creates or changes content treats content origin,
  including refinement of content that was originally source-derived.
- **Does not require:** Fine-grained span-level linking to the source, or any specific
  provenance representation. (Observability of origin is AC-16.)

### AC-04 — Active constraints remain available

- **Criterion:** Active constraints that are still in effect remain available to later
  refinements and do not disappear merely because the current deck no longer visibly reflects
  them. Exact lifetime semantics remain open (A-013, DOC-002 OQ-04).
- **Trace:** P2; R-001, R-024; BR-003; D-025
- **Why architecture-level:** It decides whether user intent is available to refinement
  independently of the deck content, rather than being re-inferred from the deck each time.
- **Evidence to look for:** Where constraints stated by the user are available when a later
  refinement runs, and what happens to them when a refinement changes the deck. Cancellation of a
  rejected request's constraints is assessed under AC-07; restoring the recovery baseline's
  constraints (§3.3) after a stopped, failed, or invalid refinement under AC-06, AC-08 and AC-28;
  and when a request's constraints first take effect (its commit boundary) under AC-29. Whether
  verification can read the constraint set in effect is compared under AC-25 (DOC-008 TN-1), not
  required here.
- **Does not require:** Any decision about which constraints last for the whole session, when a
  constraint expires, how single-refinement constraints are told apart (BR-003 exception), or how
  constraints are represented.

### AC-05 — Preview and exports derive from the same version

- **Criterion:** Every export is built from exactly the version being previewed when the export
  is requested: the accepted version, or the pending version if that is what is previewed
  (R-020, BR-006). Preview, PPTX and PDF of one version are all derived from that version. Export
  does not call a model to regenerate content and does not diverge from that version.
- **Trace:** R-020 AC1–2, R-025, R-028; BR-006; P5; D-026; UC-008 step 4, UC-015; DOC-002 §18
  Q4–Q5
- **Why architecture-level:** It fixes the direction of data flow between versions, preview, and
  each output. If outputs are built from different inputs, or the exported version can differ
  from the previewed one, P5 is broken by design.
- **Evidence to look for:** The path from a version (accepted or pending) to preview, to PPTX,
  and to PDF; what keeps the version an export uses from changing while the export runs; any step
  on those paths that calls a model or otherwise regenerates content.
- **Does not require:** A single storage location, a single representation, or a particular
  number of components. It does not settle whether R-025 and R-028 compare outputs of a pending
  version or only of the accepted version (§11); the derivation invariant holds either way.

### AC-06 — Unvalidated results do not become pending or accepted

- **Criterion:** An AI-generated result is not displayed, does not become a pending version, and
  does not become or replace the accepted version until it has been validated (R-033). An invalid
  result creates no version; after an invalid refinement result, the deck and constraint set are
  those of the recovery baseline (§3.3).
- **Trace:** R-033, R-031 AC2, R-024 AC4; BR-010 rules 1–2, 5; D-030; UC-001 5A, UC-002 6A,
  UC-004 4A
- **Why architecture-level:** It constrains when a result can become visible or authoritative
  relative to validation, across generation and refinement.
- **Evidence to look for:** For refinement, what happens between an AI result being produced and
  it being validated and shown as a pending version. For the first generation there is no earlier
  accepted version, and a successful result becomes the accepted version directly (BR-010 rule 1);
  the path from the result to the accepted version is what applies.
- **Does not require:** A state machine, staging area, or specific validation mechanism.

### AC-07 — One-step reject of the pending version

- **Criterion:** While a pending version exists, the user can reject it and return to the
  accepted version it was produced from, with the constraints introduced by the request that
  produced it cancelled (one step, not history).
- **Trace:** D-025; R-031; BR-010 rules 2, 7, 8; UC-013 postcondition 2
- **Why architecture-level:** The accepted version and the constraints in effect before the
  request must still exist alongside the pending version, and constraints must be attributable to
  the request that introduced them. This affects how long states are retained and how constraints
  relate to requests.
- **Evidence to look for:** Whether the accepted version and the pre-request constraint set are
  still available while the user reviews the pending version, and what rejecting restores (deck
  content and constraints).
- **Does not require:** Undo, multi-step history, or version management (D-025); keeping the
  replaced accepted version after a pending version has been promoted (BR-010 rule 8; UC-013 1A);
  a particular constraint representation.

### AC-08 — Operation failures end in a determinate state

- **Criterion:** A failed generation or refinement — including an external model/tool failure or
  timeout — ends in a determinate state with no hang and no half-applied change: it creates no
  version; a failed refinement leaves the deck and constraint set at its recovery baseline (§3.3),
  the accepted version at its commit boundary rather than an older one; and a failed first
  generation leaves no deck.
- **Trace:** R-031, R-032, R-024 AC4; D-030; BR-005, BR-010 rule 5, BR-014 rule 2; UC-001 4B,
  UC-002 5C, UC-004 3B, UC-014 2B; DOC-002 §11, §16
- **Why architecture-level:** It decides where operation boundaries sit and how external calls
  are isolated from the working state.
- **Evidence to look for:** For each external call in generation and refinement: where it crosses
  the system boundary, what bounds it, and what state results when it fails or times out partway
  through, including which accepted version and constraint set are in effect afterwards. A
  user-initiated stop is assessed under AC-28.
- **Does not require:** Specific retry counts, timeout values (C-007 retired; D-011), or a
  transaction mechanism.

### AC-09 — Cancelled or failed exports change no version

- **Criterion:** An export that is cancelled, fails, or produces an invalid file delivers no
  invalid file and leaves both the accepted and the pending version unchanged. Export can be
  retried without regenerating content.
- **Trace:** R-020 AC3, R-027, R-031; BR-005, BR-010 rule 6; UC-008 3A, 4A
- **Why architecture-level:** Export is a separate artifact-producing path. Apart from promotion
  after a successful export (AC-29), its outcomes must not flow back into the versions.
- **Evidence to look for:** Whether any export step writes to the accepted or pending version
  before the export has succeeded, and what a retry of export depends on.
- **Does not require:** A specific export library, renderer, or ordering of PPTX and PDF
  production; the ability to stop an export once file production has started (UC-014 OQ-1; §12).

### AC-10 — Validation is possible and verifiable at acceptance and delivery points

- **Criterion:** Validation is possible at every transition that can make an AI result displayed,
  pending, or accepted (generation, refinement) and on every output before delivery. The outcome
  of validation at each of these points — whether it ran, on which result, and its verdict — is
  observable.
- **Trace:** R-033 (including its note that the architecture must make this check verifiable),
  R-021, R-027; D-028; D-011; UC-008 step 5; DOC-008 TN-2
- **Why architecture-level:** It fixes where validation must be possible and that each validation
  step can be verified. An outcome not planned with its validation point is costly to expose
  later. Which checks the product must run is Product's (R-033; DOC-008 F15); what is verified
  and how is DOC-008's; thresholds belong to the Final Testing Plan; how validation is
  implemented is W-033 … W-035's.
- **Evidence to look for:** For generation, refinement, PPTX export and PDF export: the point
  where a result can be inspected before it is displayed, becomes pending or accepted, or is
  delivered; what information is available there (see also AC-04, AC-14, AC-15, AC-16); and where
  the outcome of that inspection can be observed.
- **Does not require:** Specific checks, thresholds, a rubric, LLM-judge use, a validation
  component, or a logging format. It does not decide which checks run inside the product as
  runtime validation rather than only as test oracles (§11).

### AC-11 — User content exposure is bounded

- **Criterion:** User content is not exposed through logs, temporary artifacts or external
  processing beyond the designed need; content sent to an external provider is an explicit,
  identifiable flow.
- **Trace:** R-042; D-027; DOC-008 TN-4
- **Why architecture-level:** It decides data-flow boundaries, where temporary artifacts live,
  and what crosses a process or network boundary.
- **Evidence to look for:** Every place user content is written or sent: logs, temporary files,
  caches, model providers, rendering tools; which of these are intended; and whether each is
  identifiable to verification, so that marker checks can cover every declared flow.
- **Does not require:** A particular provider, local-only model use, encryption scheme, or
  interception mechanism; deletion of a session's files when it ends (open in UC-011 OQ-1).

### AC-12 — No professional-editor dependency in the Core Flow

- **Criterion:** The V1 Core Flow does not require building or exposing professional-editor
  capability; deep editing is handed off via PPTX. Internal reuse of editor-related components
  is not restricted.
- **Trace:** R-041; D-006, D-015; DOC-002 §5.2, §18 Q8. (C-001 was retired on 27/09/2026; its
  content is recorded in D-006 and D-015.)
- **Why architecture-level:** It excludes candidates whose Core Flow only works if the user can
  directly manipulate objects. It restricts what the flow depends on, not which components may
  exist internally.
- **Evidence to look for:** Whether any Core Flow step needs user object-level manipulation to
  reach a usable deck.
- **Does not require:** Avoiding editor, rendering, or layout libraries internally.

### AC-13 — No extension-to-role lock-in

- **Criterion:** File extension does not permanently determine an input's semantic role or make
  future roles prohibitively hard to add. First V1 requires only the content-source role; no
  generalized role mechanism is required now.
- **Trace:** D-007; R-004; D-024; DOC-002 AD1
- **Why architecture-level:** D-007 is Active. Binding role to extension in the structure (for
  example, a PPTX path that can only ever be a content source) would lock out valid later
  workflows.
- **Evidence to look for:** Whether any part of the candidate makes file type and role
  inseparable, and what adding a second role for an already-supported type would touch.
- **Does not require:** A runtime role abstraction, role selection UI, or dynamic role
  inference in first V1.

### AC-28 — Stopping an AI operation changes no version

- **Criterion:** The user can stop a running generation or refinement at any time before it
  finishes. A stopped operation ends in a determinate state and creates no version, accepted or
  pending, including from a result that arrives after the stop. A stopped refinement leaves the
  deck and constraint set at its recovery baseline (§3.3); a promotion made at its commit
  boundary, before the operation began, stands and is not a version created by the operation. A
  stopped first generation leaves no deck. At most one generation or refinement runs at a time.
  If a stop and a completion coincide, exactly one of them takes effect.
- **Trace:** R-046 AC2–3, R-030, R-031 AC2, R-024 AC4; D-029, D-030; BR-005, BR-010 rule 5,
  BR-014; RK-007; UC-001 4A, UC-002 5B, UC-004 3A, UC-014 2A, 2C
- **Why architecture-level:** A stop can arrive while an external call is still outstanding, and
  that call's result can arrive later (RK-007). Whether the late result can still change a
  version depends on where operation results are committed and what owns the versions. That
  cannot be added per feature. If a candidate cannot meet this criterion, D-029's reopen
  condition applies; do not patch around it.
- **Evidence to look for:** For generation and refinement: the phases in which a stop can arrive,
  including while an external response is outstanding; the point at which a result is committed
  as a version; what happens to a result that arrives after the stop; how a coinciding stop and
  completion are resolved; and what prevents a second operation from starting and committing while
  one is running.
- **Does not require:** Cancelling the external call itself or bounding its cost (R-036 is
  Later); stopping an export (R-046 note 2; UC-014 OQ-1); a particular concurrency or cancellation
  mechanism.

### AC-29 — Version transitions occur only at defined events

- **Criterion:** Once a deck exists there is exactly one accepted version and at most one pending
  version. A version becomes accepted only through the events BR-010 defines: a successful first
  generation, or promotion of the pending version when the user keeps it, when a further
  refinement request reaches its commit boundary (§3.3), or when a file exported from it has been
  produced and delivered. For a further refinement, promotion happens at the D-030 commit
  boundary, immediately before its AI operation begins; before that boundary no version changes
  and the request's constraints do not become part of the accepted state. Promotion on export
  happens only after the file has been produced and has passed output validation (AC-10), never
  at export start, on cancel, or on failure. Each transition takes effect completely or not at
  all, and the points at which promotion at a commit boundary and promotion on export are
  committed are identifiable.
- **Trace:** BR-010 rules 1–6, 8; R-011 AC2, R-020, R-024 AC2–3, R-031; D-025, D-030;
  UC-001 postcondition 1, UC-004 step 2′, 1A, 2A–2C and postconditions 1–2, UC-008 step 7 and
  postcondition 2, UC-013 1A
- **Why architecture-level:** It decides what owns the versions and which paths may change them.
  Promotion after a successful export turns the export path, which AC-09 otherwise keeps from
  writing to versions, into a trigger for a version change. A candidate must place that trigger
  where the file is known to be good, not wherever it is convenient. Promotion at a refinement's
  commit boundary likewise ties a version change to the start of an AI operation, so pre-flight
  steps must not change versions or constraints, and the commit must sit where the operation
  actually begins.
- **Evidence to look for:** For each BR-010 transition, which part causes it and when. For
  promotion at a refinement's commit boundary: where pre-flight (clarification, warning,
  confirmation) ends and the AI operation begins; that a request cancelled or refused before
  that point leaves the pending version and the constraint set unchanged; that the boundary is
  reached directly, with no added confirmation, when no pre-flight step is needed; that the
  promoted version's constraints become the accepted set before the new request's constraints
  are applied; and what a stop or failure immediately after the boundary restores (AC-08,
  AC-28). For promotion on export: the possible commit points after successful file production
  (for example after output validation, or when the file is handed to the user), which of them
  the candidate can observe and commit at, and what would change if Product's definition of
  "delivered" moved the commit from one to another. Also, what state is visible if a transition
  is interrupted.
- **Does not require:** A state machine, version store, or number of copies; a particular
  structure for pre-flight steps or for holding an uncommitted request's constraints. It does not
  ask a candidate to define "delivered": Product defines which event counts as delivery (§11).
  The candidate must be able to commit promotion at the event Product chooses and expose where
  that commit happens.

### AC-30 — Session-loss state is available

- **Criterion:** The system holds the state needed to evaluate whether a session-ending action
  (starting a new deck, reloading, or closing the application; R-045 AC1) would lose session-only
  work, and that state is available wherever such an action can be intercepted. It includes at
  least whether a deck exists, which versions exist (accepted and pending), and every successful
  export outcome, each traceable to the version and format that produced it. Once Product defines
  "undownloaded", the R-045 warning rule can be evaluated from that state without restructuring
  the candidate.
- **Trace:** R-045, R-020; BR-012; D-027; A-029; UC-011 steps 2–3, 1B, 2A; UC-008 postcondition 5
- **Why architecture-level:** With session-only state (D-027), an exported file is the only way
  to keep a deck (UC-008 postcondition 5), so any plausible definition of "undownloaded" depends
  on which versions exist and which were exported, in which format. Some of those definitions
  cannot be evaluated if export outcomes are not recorded against version and format, or do not
  reach the parts that handle session-ending actions (which may not be the parts that own
  versions and exports). R-045 AC2 (no warning when nothing is undownloaded) could then not be
  met. Deciding what counts as work at risk is Product's (§11).
- **Evidence to look for:** Where the existence of a deck, the current versions, and successful
  export outcomes (with version and format) are held; how that state reaches each place a
  session-ending action is handled (new deck, reload, close); which session-ending events cannot
  be intercepted at all; what would change to apply each candidate definition of "undownloaded"
  listed in §11.
- **Does not require:** A modal, a particular warning UI, or a particular browser mechanism;
  persistence across sessions (R-048 is Later); a warning when the local process is terminated; a
  single "downloaded" flag. It also requires no definition of "undownloaded" or of when work
  counts as at risk: for example, whether exporting one of the two formats is enough, or whether
  one rule covers both the accepted and the pending version (§11).

## 8. Observability needs

Observability needs exist so that verification (DOC-008 now, W-036 and the Final Testing Plan
later) can check P1, P2, P3 and P5 (D-028) and the version lifecycle, stop, and session behaviors.
They state what must be observable, not how it is exposed.

### AC-14 — Geometry and text metrics per output

- **Criterion:** Geometry and text metrics are observable for preview, PPTX and PDF, enough to
  detect unreadable or clipped text and severe layout failure.
- **Trace:** D-028 (1); R-021, R-028; P3 hard minimum
- **Why architecture-level:** Whether metrics are available depends on where laid-out content
  can be inspected; tests cannot add this afterwards.
- **Evidence to look for:** For each of preview, PPTX and PDF, where element positions, sizes,
  and text fit can be read.
- **Does not require:** Specific metrics, thresholds (Final Testing Plan), or a measurement tool.

### AC-15 — Slide order and text readable from every output

- **Criterion:** Slide order and slide text are readable from every output and from each version
  (accepted and pending).
- **Trace:** D-028 (2); R-020, R-025; P5
- **Why architecture-level:** P5 compares outputs with each other and with the version they were
  built from; each must support reading these back.
- **Evidence to look for:** How slide order and text are obtained from a version, from the PPTX,
  and from the PDF built from it.
- **Does not require:** A particular extraction method or comparison algorithm.

### AC-16 — Content origin observable

- **Criterion:** Content origin — source, user-stated, or AI-added — is observable for content in
  any version (accepted or pending).
- **Trace:** D-028 (3); R-007; P1
- **Why architecture-level:** AC-03 requires the property to hold; AC-16 requires tests to see
  it. Origin discarded mid-pipeline cannot be recovered.
- **Evidence to look for:** Where the origin of a given piece of deck content can be read, after
  generation and after refinement.
- **Does not require:** Showing origin to the user, or a specific granularity or representation.

### AC-17 — Version states observable

- **Criterion:** Verification can observe the accepted version, the pending version if any, and
  the successful export outcomes of each, each traceable to the version and format that produced
  it. It can also observe the states before and after the last refinement, including after a
  reject, a stop, or a failure.
- **Trace:** D-028 (4); R-020, R-024, R-031, R-045, R-046; BR-010, BR-014; D-025, D-030;
  DOC-008 TN-6
- **Why architecture-level:** Testing P2, reject, promotion, and stop needs to compare states and
  to tell "pending version discarded" from "never created". This aligns with AC-07, AC-28, AC-29,
  and AC-30 but is a distinct need: those require the behavior, and this requires that
  verification can see it.
- **Evidence to look for:** Whether tests can inspect which versions exist, their content, and
  the successful exports made from each (version and format) after a refinement, a keep, a
  reject, a request cancelled before its commit boundary, a stop, a failure, and an export,
  including which version is accepted after a stop or failure that followed a promotion at the
  commit boundary.
- **Does not require:** Diffing, history beyond one step, persistence beyond the session, a
  particular record of exports or a single "exported" flag per version, or a definition of
  "delivered" or "undownloaded" (§11).

### AC-18 — Whole deck viewable as rendered

- **Criterion:** The whole deck is viewable as rendered, for LLM-judge and human review.
- **Trace:** D-028 (5); R-021; P3
- **Why architecture-level:** It needs a rendering path usable outside interactive preview.
- **Evidence to look for:** How a rendered view of every slide can be obtained for a given version
  without manual interaction.
- **Does not require:** A specific image format, renderer, or review tooling.

### AC-19 — Output degradation discoverable from real artifacts

- **Criterion:** Degradation between a version and each real output artifact produced from it is
  detectable and recordable; cross-application compatibility is learned this way.
- **Trace:** R-026, R-027; D-026; RK-006
- **Why architecture-level:** D-026 defers cross-application compatibility to evidence from real
  artifacts; the candidate must make that evidence obtainable.
- **Evidence to look for:** How a produced PPTX or PDF can be compared with the version it was
  produced from, and where observed degradations can be recorded.
- **Does not require:** A compatibility target application (none is baselined; Keynote is not
  claimed), automated notification to the user, or a degradation catalogue up front.

### AC-20 — Operation status and failure cause reportable

- **Criterion:** The status of long-running operations, their terminal state (done, stopped, or
  error), and the cause of failures are reportable, enough to choose a recovery step.
- **Trace:** R-030, R-032, R-046; UC-014 postcondition 1; DOC-002 §11
- **Why architecture-level:** This is the recovery-reporting half of failure and stop handling;
  AC-08, AC-09 and AC-28 cover state preservation.
- **Evidence to look for:** What status, terminal state, and failure information is available at
  the point where an operation is reported to the user or to tests.
- **Does not require:** A progress UI design, error taxonomy, or logging framework.

## 9. Trade-off dimensions

Trade-off dimensions are compared in writing across candidates in W-035, with evidence. They do
not produce a pass/fail result or a numeric score.

### AC-21 — Team feasibility and learning curve

- **Criterion:** Team feasibility and learning curve: how many unfamiliar or custom subsystems
  the candidate requires, relative to team capacity.
- **Trace:** C-002; DOC-002 AD9, §18 Q9
- **Why architecture-level:** It is a whole-candidate property that determines whether the work
  can be delivered at all.
- **Questions to compare:** Which subsystems must be custom-built? Which rely on technology the
  team has not used? How is work distributed across owners?
- **Does not require:** Effort estimates in hours or story points.

### AC-22 — External dependency cost

- **Criterion:** External dependency cost: which external models, libraries or renderers are
  critical, and what happens when one fails or changes.
- **Trace:** C-002; R-032; DOC-002 §1 Q4
- **Why architecture-level:** Dependency structure is fixed at architecture time.
- **Questions to compare:** Which dependencies are on the Core Flow's critical path? How
  replaceable is each? What behaviour, cost, or licensing risk does each bring?
- **Does not require:** Choosing a model provider or library at this stage.

### AC-23 — Blast radius

- **Criterion:** Blast radius: how far a wrong assumption or a failing part spreads.
- **Trace:** DOC-002 §1 Q5
- **Why architecture-level:** It follows from how responsibilities are divided, not from any one
  feature.
- **Questions to compare:** If a key assumption fails (for example, a generation approach does
  not produce usable layouts), which parts change? If one part fails at runtime, what else stops?
- **Does not require:** A particular modularization style.

### AC-24 — Rollback and redesign cost

- **Criterion:** Rollback and redesign cost if evidence invalidates the choice.
- **Trace:** D-011; DOC-002 §20
- **Why architecture-level:** This is the rationale for D-011: choices that are cheap to reverse
  preserve options while evidence is thin.
- **Questions to compare:** Which choices in the candidate are costly to reverse? Which DOC-002
  §20 reopen conditions would force a redesign, and how much would change?
- **Does not require:** Designing for every possible reversal.

### AC-25 — Testability cost

- **Criterion:** Testability cost: the effort to verify P1/P2/P3/P5 and the version lifecycle,
  stop, and session behaviors, and to meet AC-14 … AC-20, including discovering output
  degradation from real artifacts.
- **Trace:** DOC-002 AD7, §18 Q6; D-028; DOC-008 §5.3, §6.2 (TN-1, TN-3, TN-5), §6.3
- **Why architecture-level:** AC-10 and AC-14 … AC-20 set a floor every candidate must meet; this
  compares how cheaply each reaches and keeps it. DOC-008 testability needs that are not criteria
  in their own right are compared here (§10.7).
- **Questions to compare:**
  - What must be built only for testing?
  - Which behaviours can be checked objectively, and which need rubric or human review (per
    DOC-008)?
  - Which DOC-008 §5.3 checks could run as runtime validation before a result is displayed?
  - How quickly can a new output degradation be observed?
  - Can the active constraint set be read after each turn, including after a reject (TN-1)?
  - Can external model and tool calls be replaced in tests with recorded, failing, or
    held-and-released responses, so that failure, stop, late-result, and concurrent-request
    cases run deterministically (TN-3)?
  - Can Core Flow behavior be exercised and observed without the interactive UI (TN-5)?
- **Does not require:** A test framework, coverage target, substitution technique, or a non-UI
  interface.

### AC-26 — Output-target extensibility

- **Criterion:** Output-target extensibility: cost of adding a further output format, and whether
  impact stays mostly on the export side.
- **Trace:** C-003; R-039; D-026
- **Why architecture-level:** C-003 is an Active academic constraint, so further formats are
  expected; the cost of adding one is set by the structure.
- **Questions to compare:** What would adding a further format (for example, HTML or images)
  touch outside export? Which format capability differences (C-004) would it expose?
- **Does not require:** A canonical intermediate representation (R-039 notes this explicitly), or
  any format beyond PPTX and PDF in first V1.

### AC-27 — Translation readiness

- **Criterion:** Translation readiness: cost of later adding whole-deck translation as a
  deck-level refinement that changes language and text length across every slide.
- **Trace:** R-044
- **Why architecture-level:** R-044 is an expected future capability. It stresses the whole deck
  at once: every text changes length, and meaning and usable layout must hold.
- **Questions to compare:** Could translation run through the same path as other deck-level
  refinement? What happens to layout when all text lengths change? How would language interact
  with active constraints (AC-04)?
- **Does not require:** Translation support, font strategy, or localization design in first V1.

## 10. Traceability

### 10.1 DOC-002 §18 Architecture Handoff questions

| §18 question | Criteria |
|---|---|
| Q1 Creation-first Core Flow | AC-01 |
| Q2 Intent/constraint survives refinement | AC-04, AC-07, AC-17 |
| Q3 Source provenance sufficient for P1 | AC-03, AC-16 |
| Q4 State clear enough for preview/refine/export | AC-05, AC-06, AC-07, AC-29 |
| Q5 Editable and rendered outputs from the same version | AC-05, AC-09, AC-29 |
| Q6 P1/P2/P3/P5 verifiable | AC-10, AC-14 … AC-20, AC-25 |
| Q7 Failure recoverable/predictable | AC-06 … AC-09, AC-20, AC-28 |
| Q8 No dependence on full web editor | AC-12 |
| Q9 Fits project resources | AC-21, AC-22 |
| Q10 Option value for existing-deck editing | Not a criterion; see §12 |

### 10.2 W-028 criteria areas

| Area in W-028 | Criteria |
|---|---|
| V1 behavior fit | AC-01 … AC-04, AC-12, AC-28, AC-30 |
| State ownership | AC-05, AC-06, AC-07, AC-29, AC-30 (ownership assessed through these invariants; no owner is prescribed) |
| Recoverability | AC-06 … AC-09, AC-20, AC-28 |
| Validation boundary | AC-06, AC-10 |
| Preview/export | AC-05, AC-09, AC-14, AC-15, AC-18, AC-29 |
| Testability | AC-10, AC-14 … AC-20, AC-25 |
| Source fidelity | AC-02, AC-03, AC-16 |
| Output fidelity | AC-05, AC-15, AC-19 |
| Team feasibility | AC-21, AC-22 |
| Changeability | AC-13, AC-26, AC-27 |
| Blast radius | AC-23 |
| Rollback | AC-24 |

### 10.3 D-028 observability needs

| D-028 need | Criterion |
|---|---|
| 1. Geometry/text metrics per output | AC-14 |
| 2. Slide order and text readable from every output | AC-15 |
| 3. Content origin (made explicit in AC-16 as source, user-stated, AI-added) | AC-16 |
| 4. State before/after the last refinement (AC-17 also covers version status) | AC-17 |
| 5. Whole deck viewable as rendered | AC-18 |

### 10.4 Requirements, constraints, decisions, and risks

- W-028 primary requirements: R-001 (AC-04), R-003 (via D-024, AC-01), R-004 (AC-02, AC-13),
  R-006 (AC-01), R-007 (AC-03, AC-16), R-011 (AC-01, AC-29), R-019 (AC-01),
  R-020 (AC-01, AC-05, AC-09, AC-15, AC-29, AC-30), R-021 (AC-10, AC-14, AC-18),
  R-024 (AC-04, AC-06, AC-08, AC-17, AC-28, AC-29), R-025 (AC-05, AC-15), R-026 (AC-19),
  R-027 (AC-09, AC-10, AC-19), R-028 (AC-05, AC-14), R-030 (AC-20, AC-28),
  R-031 (AC-06 … AC-09, AC-17, AC-28, AC-29),
  R-032 (AC-08, AC-20, AC-22), R-033 (AC-06, AC-10), R-041 (AC-12), R-042 (AC-11),
  R-043 (AC-02).
- W-037 primary requirements: R-045 (AC-17, AC-30), R-046 (AC-17, AC-20, AC-28).
- Core Flow definition: R-029 AC1 and D-012 (AC-01).
- Supporting requirements: R-039 (AC-26), R-044 (AC-27).
- Constraints: C-002 (AC-21, AC-22), C-003 (AC-26). C-004 informs AC-26's comparison questions.
  C-001 is Retired; AC-12 now traces D-006 and D-015.
- Decisions: D-006 and D-015 (AC-12), D-007 (AC-13), D-011 (mechanism boundary; AC-10, AC-24),
  D-024 … D-028 (V1 boundary), D-012 (AC-01), D-027 (AC-01, AC-11, AC-30), D-029 (AC-28),
  D-030 (AC-06, AC-08, AC-17, AC-28, AC-29).
- Risks and assumptions: RK-006 (AC-19), RK-007 (AC-28), A-013 (AC-04), A-029 (AC-30).

### 10.5 V1 Use Cases

| Use Case | Criteria |
|---|---|
| UC-001 Create from prompt | AC-01, AC-04, AC-06, AC-08, AC-10, AC-28, AC-29 |
| UC-002 Create from a content source | AC-01 … AC-04, AC-06, AC-08, AC-10, AC-11, AC-13, AC-16, AC-28, AC-29 |
| UC-004 Deck-level refinement | AC-01, AC-04, AC-06, AC-07, AC-08, AC-10, AC-28, AC-29 |
| UC-008 Export PPTX or PDF | AC-05, AC-09, AC-10, AC-12, AC-19, AC-29, AC-30 |
| UC-011 Start a new deck | AC-11 (UC-011 OQ-1 is not gated), AC-30 |
| UC-013 Reject the pending version | AC-07, AC-17, AC-29 |
| UC-014 Progress and stop | AC-08, AC-20, AC-28 |
| UC-015 Preview | AC-05, AC-14, AC-15, AC-18 |

### 10.6 V1 Business Rules

| Business Rule | Criteria |
|---|---|
| BR-001 Role by purpose | AC-13 |
| BR-002 Source fidelity | AC-03, AC-16 |
| BR-003 Constraints persist | AC-04 (lifetime open, §11) |
| BR-005 Last usable version kept | AC-07, AC-08, AC-09, AC-28 |
| BR-006 Export the previewed version | AC-05 |
| BR-007 Cross-format meaning | AC-05, AC-15, AC-19 |
| BR-008 Source content is data | AC-02 |
| BR-009 One source per deck | No dependent architecture choice beyond AC-01 and AC-13; verified by tests (DOC-008 §4.7) |
| BR-010 Accepted/pending lifecycle | AC-06, AC-07, AC-08, AC-09, AC-17, AC-28, AC-29 |
| BR-011 Slide-targeted disclosure | Product behavior with no dependent architecture choice (§12) |
| BR-012 Session-only deck | AC-01, AC-30 |
| BR-013 Disclose limits | AC-19 for format losses (R-026); otherwise product behavior (§12) |
| BR-014 One AI operation at a time | AC-08, AC-17, AC-28 |

BR-004 and BR-015 … BR-018 are not V1-active.

### 10.7 DOC-008 testability needs

| TN | Classification | Where it lands | Reasoning |
|---|---|---|---|
| TN-1 Active constraint set readable | Trade-off only | AC-25; pointer in AC-04 | The behaviors that need it (reject cancels constraints, BR-010 rule 7; a stopped, failed, or invalid refinement restores the recovery baseline's constraints, BR-010 rule 5, R-024 AC4) are gated in AC-07, AC-06, AC-08 and AC-28. Reading the set is a verification convenience that D-028 does not list; R-024 stays verifiable through deck content |
| TN-2 Validation outcome readable | Strengthens a Gate | AC-10 | R-033's note requires the architecture to make the check verifiable. An outcome not planned with its validation point is costly to recover |
| TN-3 External calls controllable in tests | Split | Already covered: identifiable external-call boundaries (AC-08, AC-11, AC-22). New: stop and completion resolve to one outcome (AC-28). Trade-off: replay, fault injection, hold-and-release (AC-25). Detailed Design: substitution technique | The architecture fixes where calls cross the boundary and where results commit. Controlling calls in tests is a cost, not an invariant |
| TN-4 User-content egress observable | Already covered | AC-11 (evidence strengthened) | AC-11 already requires identifiable flows; only observability to verification is added |
| TN-5 Core Flow without the interactive UI | Trade-off only | AC-25 | No Requirement or Decision requires it; without it, gate runs are slower and less repeatable, not impossible |
| TN-6 Version status readable | Promoted | AC-17 (observability); AC-29 and AC-30 (runtime behavior) | R-046 AC3 and BR-014 rule 2 require telling "discarded" from "never created". R-045 requires the state from which "undownloaded" can be evaluated, meaning export outcomes by version and format, to be available at runtime; the definition itself stays with Product |

## 11. Open uncertainties carried into W-033 / W-034

**Where rendered-output checks can run (AC-10).** Some P3 hard-minimum checks, such as clipped or
unreadable text, may only be detectable on rendered output. If so, validation would need to
happen after rendering and before a result is displayed or accepted, which would put candidates
that render only at export time at a disadvantage. DOC-008 §5.3 states, for each check, whether it
could run as runtime validation. Which checks the product must run is a Product question (R-033;
DOC-008 F15). W-033/W-034 must state where each candidate makes them possible.

**Product semantics that are not settled.** The criteria were written to hold under any answer.
W-034 states, for each candidate, how it would accommodate each plausible answer. When Product
settles one of these, re-check the listed criteria. None should need a new Gate unless the answer
adds behavior.

| Open point | Source | How the criteria stay neutral |
|---|---|---|
| Which event counts as "delivered" for promotion on export | BR-010 rule 3c; UC-008 step 7; DOC-008 F12 | Product defines delivery. AC-29 requires promotion only after the file is produced and validated, and an identifiable commit point. Each candidate states which delivery points it can observe and commit at, and what moving between them would change. If Product chooses an event no candidate can observe, the question returns to Product |
| Whether R-025 and R-028 apply to a file exported from a pending version | R-025 AC1, R-028 AC1 vs R-020 AC1, BR-006; DOC-008 F12 | AC-05 requires derivation from the previewed version either way |
| What "undownloaded" means: one format or both; the accepted version, the pending version, or the latest; browser close vs local process termination | R-045; BR-012 rule 2; UC-011 step 2; DOC-008 F14 | AC-30 and AC-17 require successful export outcomes traceable to version and format, available where session-ending actions are intercepted. They define neither "undownloaded" nor when work counts as at risk |
| Whether the product itself must check source numbers (runtime validation vs test oracle) | UC-002 step 6; R-033; DOC-008 F15 | AC-10 requires validation to be possible and verifiable. If Product requires the check, AC-10's evidence must show the source and content origin (AC-16) available at the validation point |
| Whether an export can be stopped | UC-014 OQ-1; R-046 note 2; D-029 reopen condition | Not required (AC-09, AC-28); see §12 |

Deliberately not treated as uncertainties here, because they are learnable later unless a
concrete candidate forces the issue: constraint lifetime semantics (A-013, DOC-002 OQ-04) and
cross-application PPTX compatibility (D-026).

## 12. Exclusions and watch triggers

- **Existing-deck editing (DOC-002 §18 Q10; D-013).** No V1-specific lock-in risk was shown
  beyond what AC-05 and AC-13 already protect. The remaining costs (import fidelity, element
  identity, localized edits) belong to the capability itself (D-013, D-014), not to a V1 choice.
  **Watch trigger:** a W-034 candidate whose accepted version can only be produced by generation.
  If that appears, revisit this exclusion before W-035.
- **Stopping an export (R-046 note 2; UC-014 OQ-1).** Not in V1 scope; AC-09 covers a cancelled or
  failed export. **Watch trigger:** D-029's reopen condition ("export also needs to be
  stoppable"), or Product answering UC-014 OQ-1 with yes; if either happens, extend AC-28.
- **Cost of a stopped external call (RK-007, second half; R-036 is Later).** Observed only, not a
  criterion. AC-28 covers the state half of RK-007.
- **Persistence across sessions (R-048; BR-012 exception).** Later. **Watch trigger:** A-029's
  review trigger (users often lose decks unintentionally); AC-30 would then need revisiting.
- **L-001 (further source capabilities), L-002 (restyling, AI visuals, stronger slide-targeted
  refinement), slide-targeted request handling and disclosure (D-025, BR-011), and limit
  disclosure (BR-013) beyond format losses:** product behaviour with no dependent architecture
  choice in first V1.
- **W-027 prototype:** a supporting input. No prototype artifact has been incorporated; revisit
  criteria only if it exposes a behaviour ambiguity that changes an architecture choice.
