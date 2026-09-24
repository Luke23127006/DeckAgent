# Architecture Acceptance Criteria (DOC-004)

- Status: Draft
- Produced by: W-028 · Used by: W-029, W-030, W-031, W-033, W-034, W-035
- V1 boundary: D-024, D-025, D-026, D-027, D-028
- Criterion set: AC-01 … AC-27 (frozen; IDs are stable and independent of kind)
- Language: this English file is the canonical source. A Vietnamese reader version exists for
  human reading; if the two differ, this file wins.

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

There is no existing DeckAgent architecture or product code to preserve (A-004 is Retired).
Criteria evaluate candidates on their own terms, not as changes to a current design.

## 2. Where it fits in the Architecture workflow

| Step | Work | Document | Role of DOC-004 |
|---|---|---|---|
| V1 boundary | W-026 | D-024 … D-028 | Sets the scope the criteria are written against |
| Criteria | W-028 | DOC-004 | This document |
| Research contract | W-029 | DOC-005 | Turns the criteria into research questions RQ-01 … RQ-17, each mapped to AC IDs |
| Reference research | W-030, W-031 | DOC-006, DOC-007 | Researchers link findings to AC IDs to show relevance. No outcomes, no verdicts |
| Mechanisms | W-033 | DOC-009 | Findings are evaluated against the criteria; candidate mechanisms are organized by the problems the criteria describe |
| Candidates | W-034 | DOC-009 | Criteria keep 2–3 candidate architectures tied to DeckAgent's problem |
| Trade-off and baseline | W-035 | DOC-009 | Candidates are assessed (§5) and compared; the baseline is chosen |

Testing (W-032, DOC-008) runs alongside. W-032 decides which checks and thresholds exist; this
document only states where validation must be possible (AC-10) and what must be observable
(AC-14 … AC-20).

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
  problem. Gates and Observability needs describe what every candidate must satisfy.
- **Trade-off and baseline (W-035).** Assess each candidate against every Gate and Observability
  need (§5), and compare candidates on every Trade-off dimension in writing, with evidence.

### 3.2 How to read a criterion entry

| Field | What it tells you |
|---|---|
| Criterion | The outcome or property required, or the dimension compared |
| Trace | Where the criterion comes from: Requirements, Constraints, Decisions, DOC-002 sections |
| Why architecture-level | Why it must be settled by the architecture rather than added later as a feature |
| Evidence to look for | What to inspect in a candidate to decide the outcome (Gates, Observability needs) |
| Questions to compare | What to compare across candidates (Trade-off dimensions only) |
| Does not require | Mechanisms or details the criterion deliberately leaves open (D-011) |

## 4. The three criterion kinds

| Kind | Applied as | Outcomes |
|---|---|---|
| Gate | Screening: a candidate that does not meet a Gate is excluded or must be revised | `Meets` · `Does not meet` · `Not yet assessable` |
| Observability need | Screening: the candidate must make the property observable; how is not prescribed | Same as Gate |
| Trade-off dimension | Comparison only, in written trade-off analysis (W-035); never pass/fail and no numeric score | Narrative comparison with evidence |

- **Gates (AC-01 … AC-13)** are invariants every candidate must hold.
- **Observability needs (AC-14 … AC-20)** make P1, P2, P3 and P5 verifiable (D-028). They require
  that a property can be observed, not that it already holds.
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

Criteria constrain outcomes, never mechanisms. For example, AC-05 requires preview, PPTX, and PDF
to derive from the same accepted state, but its **Does not require** line leaves open whether
that state is one storage location, one representation, or several components. A candidate may
meet AC-05 with any of these.

## 6. Quick criterion map

**Researched through** lists the DOC-005 research questions mapped to each criterion.

| ID | Kind | Short name | Researched through |
|---|---|---|---|
| AC-01 | Gate | V1 Core Flow completeness | RQ-04, RQ-08 |
| AC-02 | Gate | Source content handled as data | RQ-01 |
| AC-03 | Gate | Source-derived vs other content kept distinct | RQ-05 |
| AC-04 | Gate | Active constraints remain available | RQ-03, RQ-08 |
| AC-05 | Gate | Preview and exports derive from the same accepted state | RQ-06, RQ-11 |
| AC-06 | Gate | Unvalidated changes do not replace the accepted state | RQ-07, RQ-09 |
| AC-07 | Gate | One-step reject of the latest refinement | RQ-07 |
| AC-08 | Gate | Operation failures end in a determinate state | RQ-14 |
| AC-09 | Gate | Export failures leave the accepted state unchanged | RQ-11, RQ-14 |
| AC-10 | Gate | Validation is possible at acceptance and delivery points | RQ-09 |
| AC-11 | Gate | User content exposure is bounded | RQ-01 |
| AC-12 | Gate | No professional-editor dependency in the Core Flow | RQ-15 |
| AC-13 | Gate | No extension-to-role lock-in | RQ-02 |
| AC-14 | Observability need | Geometry and text metrics per output | RQ-10 |
| AC-15 | Observability need | Slide order and text readable from every output | RQ-06, RQ-11 |
| AC-16 | Observability need | Content origin observable | RQ-05 |
| AC-17 | Observability need | Before/after last refinement observable | RQ-07 |
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

## 7. Gates

Gates are invariants every candidate must satisfy. A candidate that does not meet a Gate is
excluded or must be revised (§5).

### AC-01 — V1 Core Flow completeness

- **Criterion:** The full V1 Core Flow is supported end to end: prompt, optionally with one
  content source of any type baselined by D-024 → draft → preview → repeated deck-level
  refinement with re-preview → PPTX + PDF export, running locally without hosting or accounts.
- **Trace:** DOC-002 §5, §16; R-006, R-011, R-019, R-020; D-024–D-027
- **Why architecture-level:** It determines which parts must exist and how they connect. A
  candidate lacking a refine → re-preview loop or a path to both outputs fails structurally, not
  by missing a feature that can be added later.
- **Evidence to look for:** A walkthrough of the candidate covering each Core Flow step,
  including repeated refinement; the D-024 source types; both PPTX and PDF; local runtime with
  session-only state (D-027).
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
- **Trace:** P2; R-001, R-024; D-025
- **Why architecture-level:** It decides whether user intent is available to refinement
  independently of the deck content, rather than being re-inferred from the deck each time.
- **Evidence to look for:** Where constraints stated by the user are available when a later
  refinement runs, and what happens to them when a refinement changes the deck.
- **Does not require:** Any decision about which constraints last for the whole session, when a
  constraint expires, or how constraints are represented.

### AC-05 — Preview and exports derive from the same accepted state

- **Criterion:** Preview, PPTX and PDF are derived from the same accepted presentation state,
  and export does not silently regenerate or diverge from that state.
- **Trace:** R-020, R-025, R-028; P5; D-026; DOC-002 §18 Q4–Q5
- **Why architecture-level:** It fixes the direction of data flow between the accepted state,
  preview, and each output. If outputs are built from different inputs, P5 is broken by design.
- **Evidence to look for:** The path from the accepted state to preview, to PPTX, and to PDF;
  any step on those paths that calls a model or otherwise regenerates content.
- **Does not require:** A single storage location, a single representation, or a particular
  number of components; only consistency of the accepted state across preview and export.

### AC-06 — Unvalidated changes do not replace the accepted state

- **Criterion:** Unvalidated AI-generated changes do not irreversibly replace the last accepted
  usable state.
- **Trace:** R-033, R-031
- **Why architecture-level:** It constrains when a change can become authoritative relative to
  validation, across generation and refinement.
- **Evidence to look for:** What happens to the last accepted usable state between an AI result
  being produced and that result being validated and accepted. For the first generation there
  is no earlier accepted state; the draft → accepted transition is what applies.
- **Does not require:** A state machine, staging area, or specific validation mechanism.

### AC-07 — One-step reject of the latest refinement

- **Criterion:** The user can reject the most recent refinement result and return to the
  previous accepted state (one step, not history).
- **Trace:** D-025; R-031
- **Why architecture-level:** The previous accepted state must still exist after a new one is
  produced, which affects how long states are retained.
- **Evidence to look for:** Whether the previous accepted state is still available when the user
  reviews a refinement result, and what rejecting restores.
- **Does not require:** Undo, multi-step history, or version management (D-025).

### AC-08 — Operation failures end in a determinate state

- **Criterion:** A failed generation or refinement — including an external model/tool failure or
  timeout — ends in a determinate state that preserves the last usable state, with no hang and no
  half-applied change.
- **Trace:** R-031, R-032; DOC-002 §11, §16
- **Why architecture-level:** It decides where operation boundaries sit and how external calls
  are isolated from the working state.
- **Evidence to look for:** For each external call in generation and refinement: what bounds it,
  and what state results when it fails or times out partway through.
- **Does not require:** Specific retry counts, timeout values (C-007 retired; D-011), or a
  transaction mechanism.

### AC-09 — Export failures leave the accepted state unchanged

- **Criterion:** A failed or invalid export leaves the accepted state unchanged, and export can
  be retried without regenerating content.
- **Trace:** R-020, R-027, R-031
- **Why architecture-level:** Export is a separate artifact-producing path; its failures must
  not flow back into the working state.
- **Evidence to look for:** Whether any export step writes to the accepted state, and what a
  retry of export depends on.
- **Does not require:** A specific export library, renderer, or ordering of PPTX and PDF
  production.

### AC-10 — Validation is possible at acceptance and delivery points

- **Criterion:** Validation is possible at every transition that can make content accepted
  (generation, refinement) and on every output before delivery. Checks and thresholds belong to
  W-032.
- **Trace:** R-033, R-021, R-027; D-028; D-011
- **Why architecture-level:** It fixes where validation must be possible. Which checks run and
  their thresholds are W-032's; how validation is implemented is W-033 … W-035's.
- **Evidence to look for:** For generation, refinement, PPTX export and PDF export: the point
  where a result can be inspected before it becomes accepted or is delivered, and what
  information is available there (see also AC-14, AC-15).
- **Does not require:** Specific checks, thresholds, a rubric, LLM-judge use, or a validation
  component. See §11 for the open uncertainty on where rendered-output checks can run.

### AC-11 — User content exposure is bounded

- **Criterion:** User content is not exposed through logs, temporary artifacts or external
  processing beyond the designed need; content sent to an external provider is an explicit,
  identifiable flow.
- **Trace:** R-042; D-027
- **Why architecture-level:** It decides data-flow boundaries, where temporary artifacts live,
  and what crosses a process or network boundary.
- **Evidence to look for:** Every place user content is written or sent: logs, temporary files,
  caches, model providers, rendering tools; which of these are intended.
- **Does not require:** A particular provider, local-only model use, or encryption scheme.

### AC-12 — No professional-editor dependency in the Core Flow

- **Criterion:** The V1 Core Flow does not require building or exposing professional-editor
  capability; deep editing is handed off via PPTX. Internal reuse of editor-related components
  is not restricted.
- **Trace:** R-041; C-001; DOC-002 §5.2, §18 Q8
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

## 8. Observability needs

Observability needs exist so that W-032 and later testing can verify P1, P2, P3 and P5 (D-028).
They state what must be observable, not how it is exposed.

### AC-14 — Geometry and text metrics per output

- **Criterion:** Geometry and text metrics are observable for preview, PPTX and PDF, enough to
  detect unreadable or clipped text and severe layout failure.
- **Trace:** D-028 (1); R-021, R-028; P3 hard minimum
- **Why architecture-level:** Whether metrics are available depends on where laid-out content
  can be inspected; tests cannot add this afterwards.
- **Evidence to look for:** For each of preview, PPTX and PDF, where element positions, sizes,
  and text fit can be read.
- **Does not require:** Specific metrics, thresholds (W-032), or a measurement tool.

### AC-15 — Slide order and text readable from every output

- **Criterion:** Slide order and slide text are readable from every output and from the accepted
  state.
- **Trace:** D-028 (2); R-025; P5
- **Why architecture-level:** P5 compares outputs with each other and with the state; each must
  support reading these back.
- **Evidence to look for:** How slide order and text are obtained from the accepted state, the
  PPTX, and the PDF.
- **Does not require:** A particular extraction method or comparison algorithm.

### AC-16 — Content origin observable

- **Criterion:** Content origin — source, user-stated, or AI-added — is observable for content in
  a deck state.
- **Trace:** D-028 (3); R-007; P1
- **Why architecture-level:** AC-03 requires the property to hold; AC-16 requires tests to see
  it. Origin discarded mid-pipeline cannot be recovered.
- **Evidence to look for:** Where the origin of a given piece of deck content can be read, after
  generation and after refinement.
- **Does not require:** Showing origin to the user, or a specific granularity or representation.

### AC-17 — Before/after last refinement observable

- **Criterion:** The state before and after the last refinement is observable.
- **Trace:** D-028 (4); R-024, R-031; D-025
- **Why architecture-level:** Testing P2 and reject behaviour needs both states; this aligns
  with AC-07 but is a distinct need.
- **Evidence to look for:** Whether both states can be inspected by tests after a refinement,
  including after a reject.
- **Does not require:** Diffing, history beyond one step, or persistence beyond the session.

### AC-18 — Whole deck viewable as rendered

- **Criterion:** The whole deck is viewable as rendered, for LLM-judge and human review.
- **Trace:** D-028 (5); R-021; P3
- **Why architecture-level:** It needs a rendering path usable outside interactive preview.
- **Evidence to look for:** How a rendered view of every slide can be obtained for a given state
  without manual interaction.
- **Does not require:** A specific image format, renderer, or review tooling.

### AC-19 — Output degradation discoverable from real artifacts

- **Criterion:** Degradation between the accepted state and each real output artifact is
  detectable and recordable; cross-application compatibility is learned this way.
- **Trace:** R-026, R-027; D-026
- **Why architecture-level:** D-026 defers cross-application compatibility to evidence from real
  artifacts; the candidate must make that evidence obtainable.
- **Evidence to look for:** How a produced PPTX or PDF can be compared with the accepted state,
  and where observed degradations can be recorded.
- **Does not require:** A compatibility target application (none is baselined; Keynote is not
  claimed), automated notification to the user, or a degradation catalogue up front.

### AC-20 — Operation status and failure cause reportable

- **Criterion:** Status of long-running operations and the cause of failures are reportable,
  enough to choose a recovery step.
- **Trace:** R-030, R-032; DOC-002 §11
- **Why architecture-level:** This is the recovery-reporting half of failure handling; AC-08 and
  AC-09 cover state preservation.
- **Evidence to look for:** What status and failure information is available at the point where
  an operation is reported to the user or to tests.
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

- **Criterion:** Testability cost: effort to verify P1/P2/P3/P5 and meet AC-14 … AC-20,
  including discovering output degradation from real artifacts.
- **Trace:** DOC-002 AD7, §18 Q6; D-028
- **Why architecture-level:** AC-14 … AC-20 set a floor every candidate must meet; this compares
  how cheaply each reaches and keeps it.
- **Questions to compare:** What must be built only for testing? Which behaviours can be checked
  objectively and which need rubric or human review (per W-032)? How quickly can a new output
  degradation be observed?
- **Does not require:** A test framework or coverage target.

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
| Q2 Intent/constraint survives refinement | AC-04, AC-17 |
| Q3 Source provenance sufficient for P1 | AC-03, AC-16 |
| Q4 State clear enough for preview/refine/export | AC-05, AC-06, AC-07 |
| Q5 Editable and rendered outputs from the same accepted state | AC-05, AC-09 |
| Q6 P1/P2/P3/P5 verifiable | AC-10, AC-14 … AC-20, AC-25 |
| Q7 Failure recoverable/predictable | AC-06 … AC-09, AC-20 |
| Q8 No dependence on full web editor | AC-12 |
| Q9 Fits project resources | AC-21, AC-22 |
| Q10 Option value for existing-deck editing | Not a criterion; see §12 |

### 10.2 W-028 criteria areas

| Area in W-028 | Criteria |
|---|---|
| V1 behavior fit | AC-01 … AC-04, AC-12 |
| State ownership | AC-05, AC-06, AC-07 (ownership assessed through these invariants; no owner is prescribed) |
| Recoverability | AC-06 … AC-09, AC-20 |
| Validation boundary | AC-06, AC-10 |
| Preview/export | AC-05, AC-09, AC-14, AC-15, AC-18 |
| Testability | AC-14 … AC-20, AC-25 |
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
| 4. State before/after the last refinement | AC-17 |
| 5. Whole deck viewable as rendered | AC-18 |

### 10.4 Requirements and constraints

- W-028 primary requirements: R-001 (AC-04), R-003 (via D-024, AC-01), R-004 (AC-02, AC-13),
  R-006 (AC-01), R-007 (AC-03, AC-16), R-011 (AC-01), R-019 (AC-01), R-020 (AC-01, AC-05, AC-09),
  R-021 (AC-10, AC-14, AC-18), R-024 (AC-04, AC-17), R-025 (AC-05, AC-15), R-026 (AC-19),
  R-027 (AC-09, AC-10, AC-19), R-028 (AC-05, AC-14), R-030 (AC-20), R-031 (AC-06 … AC-09, AC-17),
  R-032 (AC-08, AC-20, AC-22), R-033 (AC-06, AC-10), R-041 (AC-12), R-042 (AC-11),
  R-043 (AC-02).
- Supporting requirements: R-039 (AC-26), R-044 (AC-27).
- Constraints: C-001 (AC-12), C-002 (AC-21, AC-22), C-003 (AC-26). C-004 informs AC-26's
  comparison questions.
- Decisions: D-007 (AC-13), D-011 (mechanism boundary; AC-10, AC-24), D-024 … D-028 (V1
  boundary).

## 11. Open uncertainties carried into W-033 / W-034

**Where rendered-output checks can run (AC-10).** Some P3 hard-minimum checks, such as clipped or
unreadable text, may only be detectable on rendered output. If so, validation would need to
happen after rendering and before a result is accepted, which would put candidates that render
only at export time at a disadvantage. W-032 decides which checks exist; W-033/W-034 must state
where each candidate makes them possible.

Deliberately not treated as W-028 uncertainties, because they are learnable later unless a
concrete candidate forces the issue: constraint lifetime semantics (A-013, DOC-002 OQ-04) and
cross-application PPTX compatibility (D-026).

## 12. Exclusions and watch triggers

- **Existing-deck editing (DOC-002 §18 Q10; D-013).** No V1-specific lock-in risk was shown
  beyond what AC-05 and AC-13 already protect. The remaining costs (import fidelity, element
  identity, localized edits) belong to the capability itself (D-013, D-014), not to a V1 choice.
  **Watch trigger:** a W-034 candidate whose accepted state can only be produced by generation.
  If that appears, revisit this exclusion before W-035.
- **L-001 (further source capabilities), L-002 (restyling, AI visuals, stronger slide-targeted
  refinement), and slide-targeted request handling and disclosure (D-025):** product behaviour
  with no dependent architecture choice in first V1.
- **W-027 prototype:** a supporting input. No prototype artifact has been incorporated; revisit
  criteria only if it exposes a behaviour ambiguity that changes an architecture choice.
