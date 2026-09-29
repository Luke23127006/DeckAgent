# DeckAgent Testing Approach (DOC-008)

- Status: Draft — W-032 output: an architecture-independent verification map. **Not the final
  Testing Plan.**
- Produced by: W-032 (Khoa) · Reviewer: Duy · Completed by: W-036 after W-035 selects the
  Architecture baseline
- Used by: W-033 (Required Input: verification/testability needs), W-034, W-035 (via AC-25),
  W-036
- Basis: W-032 primary Requirements (§3.1); V1-active Business Rules BR-002, BR-003,
  BR-005 … BR-014; D-017, D-023 … D-029; A-005; L-001, L-002; RK-006, RK-007; V1 Use Cases
  UC-001, UC-002, UC-004, UC-008, UC-011, UC-013, UC-014, UC-015;
  [DOC-004 Architecture Acceptance Criteria](../architecture/architecture-acceptance-criteria.md)
  (AC-01 … AC-27); DOC-002
- Project Hub baseline: local snapshot synced 2026-09-28 02:33 UTC (schema 4). Every ID in this
  document was checked against it. Project Hub remains the source of truth; disagreements found
  while writing this document are listed in §10.
- Updated: 2026-09-28.
- Language: this English file is the canonical source.
- `§n` refers to a section of this document unless prefixed with `DOC-002` or `DOC-004`. `AC-nn`
  points to DOC-004.

## 1. What this document is for

Before the Architecture is chosen, DOC-008 answers:

1. which V1 behaviors must stay verifiable (§2.1, §3);
2. for each, what has to hold, what a failure looks like, how it is judged (objective, rubric,
   human), and what must be observed (§4, §5);
3. where Requirements or Decisions are not yet precise enough to test (§10);
4. what Testing needs the Architecture to make observable or controllable (§6);
5. which parts wait for the Architecture (W-036) and which wait for Detailed Design and the final
   Testing Plan (§12).

Division of roles with DOC-004: DOC-004 states **where** validation must be possible (AC-10) and
**what** must be observable (AC-14 … AC-20). DOC-008 decides **which checks exist**, how they are
evaluated, and how thresholds will be found. DOC-008 does not choose mechanisms (D-011) and does not
add Gates for the Architecture; testability needs beyond DOC-004 go to W-033/W-035 as comparison
input under AC-25 (§6.2).

**Out of scope** (D-023; W-032 Out of Scope): no test case specification, no tool or framework
selection, no pass rates or numeric thresholds, no module-level test design, and no assumption
about any internal system structure. These are marked and deferred in §12.

### 1.1 What to read, by role

| Role | Read | Purpose |
|---|---|---|
| W-033 — mechanism synthesis | §1.3, §4, §5.3, §6 | Know which checks must run where and what must be observable or controllable, to record ACs and missing evidence per mechanism |
| W-034 — candidate architectures | §5.3, §6 | Each candidate states which §5.3 checks it allows before a result is displayed (DOC-004 §11), and how it meets §6.2 |
| W-035 — trade-off | §6.3 | Compare testability cost (AC-25) with concrete questions |
| W-036 — complete DOC-008 | §12 | Parts waiting on the Architecture |
| Product (Duy) | §10, §11 | Findings needing a decision, and research questions |

### 1.2 Dependency labels

Anything **without** a label is architecture-independent and settled by W-032, subject to the
open findings in §10.

| Label | Meaning | Completed by |
|---|---|---|
| **[A]** | Depends on the Architecture baseline: verification boundaries, check placement, failure points, commit points, how state is exposed | W-036, after W-035 |
| **[D]** | Depends on Detailed Design, implementation, or real artifacts: thresholds, tools, test cases, repetition counts, schedule | Final Testing Plan, after SP-002 |

### 1.3 Summary for the Architecture reader

- **Behaviors that must stay verifiable:** P1, P2, the P3 hard minimum, P5, validation before a
  result is displayed (R-033), recovery (R-031, R-032), the accepted/pending version lifecycle
  (R-020, BR-010), stopping an AI operation (R-046), the unsaved-deck warning (R-045), and
  bounded data exposure and injection resistance (R-042, R-043). See §4.
- **Must be observable:** DOC-004 AC-14 … AC-20 (§6.1), plus the proposed needs TN-1, TN-2, TN-4,
  TN-6 (§6.2): the active constraint set, validation outcomes, user-content egress paths, and
  version status. These are proposals, not Gates.
- **Must be controllable:** responses of external models and tools (replay, failure, and timing)
  (TN-3). Exercising the Core Flow without the interactive UI (TN-5) is a testability cost factor
  for AC-25, not a requirement.
- **Must not be assumed resolved:** what counts as "important" content (F2); constraint lifetime
  and conflicts (F9), and constraints from a stopped or failed refinement (F13); the
  accepted / pending / previewed / exported / delivered semantics (F12); what "undownloaded" means
  (F14); whether the product itself must check source numbers (F15); which application counts as
  evidence that PPTX is usable (F8).

## 2. Shared concepts

### 2.1 V1 critical behaviors (D-017)

| Code | Name | V1 hard acceptance | Primary Requirements (D-017) |
|---|---|---|---|
| P1 | Source fidelity | Yes, when the deck is created from a source | R-007 |
| P2 | User intent fidelity | Yes | R-024 (with R-001, R-009) |
| P3 | Presentation quality | Only the D-028 hard minimum | R-021 |
| P4 | Safe refinement | **No** (D-017). No oracle in DOC-008 asserts modification locality | — |
| P5 | Output fidelity | Yes | R-025, R-027, R-028 (with R-020) |

### 2.2 Three evaluation modes

- **Objective** — a deterministic oracle decides pass/fail without judgement; automatable.
- **Rubric** — structured judgement against pre-written criteria by at least two raters, with
  measured agreement (the agreement threshold is **[D]**). An LLM judge may replace human raters
  only after calibration against them, and never with the same model + prompt configuration as the
  generator it grades.
- **Human evaluation** — exploratory sessions or task-based usability sessions. Produces findings
  and evidence; not a binary gate by itself.

### 2.3 Commitment level of a quality item (D-028 ladder)

`known failure mode → candidate criterion → hard gate`. An item is a **hard gate** only when the V1
baseline has committed to that minimum or it belongs to P1/P5. An item with a known failure mode
but insufficient evidence is a **candidate criterion**: it is measured and recorded but does not
fail acceptance. Professional, engaging, and aesthetic quality is **exploratory**. §5 applies this
ladder to P3.

### 2.4 Key Content Inventory (KCI)

R-007, R-025 and R-028 rely on the word "important" without defining it, and UC-002 OQ-2 asks
W-032 for the P1 measure (F2). DOC-008 proposes: each test case has a pre-written KCI — the facts,
numbers with units, named entities, attributions, and section order considered important — written
by someone who did not write the generation prompt. One KCI is shared by the P1, P5 and R-028
oracles. Duy's agreement is needed before the KCI becomes the shared definition.

The KCI is a **test-time oracle**: it is written by a person for a known test source and cannot
run inside the product. Checks the product itself can run are distinguished in §5.3 (see F15).

### 2.5 Non-determinism and control

AI output varies between runs. Gate cases are run repeatedly with the model configuration
recorded; the number of repetitions and the pass rate are **[D]**. Non-AI logic (validation,
version lifecycle, stop, export) must be testable with recorded or simulated responses, including
control over *when* a response arrives, so that these tests are deterministic (TN-3).

## 3. Test basis

### 3.1 Mapped Requirements

Exactly the W-032 primary Requirements. "Architecture-relevant" means DOC-004 has an AC tracing to
the Requirement (DOC-004 §10.4).

| ID | Group | Why mapped | AC in DOC-004 |
|---|---|---|---|
| R-007 | P1 | Main claim of P1 | AC-03, AC-16 |
| R-001 | P2 | Constraints must be captured before they can be kept | AC-04 |
| R-024 | P2 | Main claim of P2 | AC-04, AC-17 |
| R-009 | P2 | Purpose/audience/context is part of P2; critical, not architecture-relevant | — |
| R-021 | P3 | Main claim of P3; D-028 ladder | AC-10, AC-14, AC-18 |
| R-029 | P3 / V1 boundary | Usable without design skills; only verifiable with people | — |
| R-033 | Validation boundary | A result is checked before it becomes pending or accepted | AC-06, AC-10 |
| R-020 | P5 / lifecycle | Export from the previewed version; a pending version becomes accepted only when its file is produced and delivered (BR-010 rule 3; "delivered" undefined — F12) | AC-01, AC-05, AC-09 (worded for the accepted state — F12) |
| R-025 | P5 | Main claim of P5 | AC-05, AC-15 |
| R-028 | P5 | Preview matches the exported file | AC-05, AC-14 |
| R-026 | P5 supporting | Predictable, disclosed degradation; no silent corruption | AC-19 |
| R-027 | P5 | Valid and usable files | AC-09, AC-10, AC-19 |
| R-031 | Reliability | Reject or failure returns to the last accepted version | AC-06 … AC-09, AC-17 |
| R-032 | Reliability | External failure ends determinately | AC-08, AC-20, AC-22 |
| R-046 | Lifecycle | Stop leaves no partial version and does not change the accepted one (D-029, BR-014, RK-007) | None yet — W-037 |
| R-045 | Session | Session-only V1 (D-027, BR-012): losing an undownloaded deck is the main data-loss path | None yet — W-037 |
| R-042 | Security | User data exposure | AC-11 |
| R-043 | Security | Source content is untrusted data | AC-02 |

### 3.2 Business Rules used as test basis

| BR | Verified through |
|---|---|
| BR-002 | P1 suite (R-007, R-008) |
| BR-003 | P2 suite (R-024); its exception for single-refinement constraints is open (F9) |
| BR-005 | R-031, R-032, R-046 |
| BR-006, BR-007 | P5 suites (R-020, R-025, R-028) |
| BR-008 | R-043 suite |
| BR-009 | Intake checks, §4.7 |
| BR-010 | Version lifecycle in R-020, R-031, R-024 |
| BR-011 | Disclosure checks, §4.7 |
| BR-012 | R-045 |
| BR-013 | Disclosure checks, §4.7; R-026 |
| BR-014 | §4.6 |

BR-001 (role by purpose) is checked by architecture review (AC-13), not by tests. BR-004 is
Later (P4) and is not verified.

### 3.3 Related but not mapped separately

These Requirements appear in tests as **execution context**, without their own suite or oracle
(W-032 description item 3: only critical and architecture-relevant Requirements are mapped):

- R-006, R-011, R-013, R-019 — the Core Flow, deck-level refinement (D-025), and preview are the
  vehicle for the P1/P2/P3/P5 suites. Core Flow completeness is checked at architecture level by
  AC-01.
- R-002 — clarification questions occur in multi-turn scripts; no separate oracle.
- R-003, R-004 — D-024 fixes the source types (§8). Rejecting unsupported types is checked in
  §4.7. The size limit is undefined (UC-002 OQ-1), so no size check is specified.
- R-008 — the source gap is the other half of P1; its cases live in the R-007 suite (F1).
- R-030 — terminal states and failure cause are touched through R-032 and R-046; progress display
  is not verified here (F11).
- R-041 — a Constraint-type Requirement, checked by architecture review (AC-12), not by tests.

### 3.4 Security and Performance

- **Security** covers only R-042 and R-043, the only V1-active Requirements that call for it. No
  authentication, authorization, or hardening is added: D-027 fixes V1 as a local web app with no
  accounts and no hosting.
- **Performance** is excluded: no V1-active Requirement asks for it (R-035, R-036, R-037 are
  Later), and neither open Risk is a performance risk (RK-006 feeds R-027 and F8; RK-007 feeds
  R-046). Quantitative bounds are not set ahead of evidence (D-011). An operation having to
  terminate when a dependency fails is treated as reliability (R-032).

## 4. What to verify

Columns: **What must hold** states the promise and what a failure looks like. **Oracle /
evaluation basis** states the verification intent, not a test case; concrete cases and scenarios
are Final Testing Plan work (§12). **Mode**: Obj = objective, Rubric, Human (§2.2). **Observe**
lists the data a verifier needs. **Level**: `Hard` = V1 hard acceptance; `Cand.` = candidate
criterion; `Expl.` = exploratory (§2.3); `Provisional` = depends on an open Product finding and is
not a gate until it is resolved. The earliest meaningful point for each suite is in §7.2.

### 4.1 P1 — Source fidelity

| REQ | What must hold | Oracle / evaluation basis | Mode | Observe | Level |
|---|---|---|---|---|---|
| R-007 | Facts, numbers with units, named entities, meaning, and attribution taken from the source are unchanged. *Failure:* a value, unit, or entity differs; a quote changes meaning or attribution | Each KCI number/entity that appears in the deck equals the source; paraphrased meaning judged against the source, with a third rater arbitrating disagreements | Obj + Rubric | Deck text; source text | Hard, when a source is used |
| R-007, R-008 | Nothing is presented as source-derived unless the source supports it. *Failure:* AI-added or user-stated content carries source origin; a gap is filled silently | No content with origin "source" is absent from the source; in source-gap cases the user is asked or the content is marked AI-added (UC-002 5A) | Obj (Rubric for paraphrase support) | Content origin (AC-16) | Hard |
| R-007 | P1 still holds after refinement. *Failure:* a refinement changes a source value or relabels origin | The two checks above re-run after each refinement that touches source content | Obj + Rubric | Before/after the refinement (AC-17); origin | Hard |

### 4.2 P2 — User intent fidelity

| REQ | What must hold | Oracle / evaluation basis | Mode | Observe | Level |
|---|---|---|---|---|---|
| R-001 | Stated intent and constraints are captured and available to later steps, without forcing the user to declare everything up front. *Failure:* a stated constraint never influences the deck, or is gone before the next refinement | Each constraint in a script is present in the active constraint set. Without TN-1 this is testable only indirectly through R-024 (F5) | Obj | Active constraint set (TN-1) | Hard |
| R-024 | Constraints in effect keep applying across refinements until the user changes or cancels them, or rejects the version whose request introduced them (BR-010 rule 5). *Failure:* a measurable constraint is violated after some turn; a rejected request's constraint still applies | Measurable constraints (e.g. slide count, language, required sections) hold after every refinement turn; after a reject, the constraint set equals the set before that refinement (UC-013 postcondition 2) | Obj; soft constraints (tone, audience fit): Rubric | Deck per turn; before/after (AC-17); constraint set (TN-1) | Hard for unambiguous cases; Expl. for lifetime and conflict cases (F9); Provisional for stopped/failed refinements (F13) |
| R-009 | Purpose, audience, and context visibly shape content and structure. *Failure:* decks for different audiences are indistinguishable | Paired comparison: same request, different audience/purpose; raters tell which deck is for whom | Rubric; Human in exploratory sessions | Rendered deck (AC-18) | Hard via an approved rubric; pass criterion **[D]** |

### 4.3 P3 — Presentation quality, and validation

| REQ | What must hold | Oracle / evaluation basis | Mode | Observe | Level |
|---|---|---|---|---|---|
| R-021 | The D-028 hard-minimum failures do not occur (§5.1) | Objective proxies for HM-1, HM-3, HM-4; rubric for HM-2 and for "severe"/"unintentional" | Obj + Rubric | Geometry (AC-14); order and text (AC-15); rendered deck (AC-18) | Hard |
| R-021 | D-028 candidate criteria (§5.2) | Measured and recorded, never failing | Obj | Same | Cand. |
| R-021 | Professional, engaging, aesthetic | Exploratory sessions | Human | Rendered deck | Expl. |
| R-033 | Every AI result is checked before it is displayed or becomes pending or accepted, for each operation type. *Failure:* an invalid result is previewed, becomes pending, or replaces the accepted version | Invalid results at generation and refinement are never displayed, pending, or accepted, and the UC failure path is taken (UC-001 5A, UC-002 6A, UC-004 4A); valid results pass. Which checks *could* run in the product: §5.3 | Obj | Validation outcome (TN-2); version status (TN-6) | Hard |
| R-029 | The Core Flow (create, preview, refine, export) can be completed without professional presentation-editing knowledge. *Failure:* participants need object-level manipulation or expert help to reach a usable deck | Task-based sessions with participants matching ACT-001; observation checklist | Human | Session observations | Hard via session evidence; pass criterion **[D]** |

### 4.4 P5 — Output fidelity

| REQ | What must hold | Oracle / evaluation basis | Mode | Observe | Level |
|---|---|---|---|---|---|
| R-020 | The file is built from exactly the version being previewed, with no AI regeneration (R-020 AC1–2). A cancelled or failed export changes neither the accepted nor the pending version (R-020 AC3, BR-010 rule 4). A pending version becomes accepted when its file is produced and delivered (BR-010 rule 3). *Failure:* file content differs from the previewed version; a model is called during export; a cancelled or failed export changes a version | File slide text and order equal the version previewed at export time (AC-15); no model call on the export path (TN-3); version status unchanged after cancel or failure | Obj | Order and text (AC-15); version status (TN-6); external calls (TN-3) | Hard; promotion on delivery Provisional (F12) |
| R-025 | PPTX and PDF keep the same facts, numbers, order, and meaning. R-025 states this for "the same accepted version"; whether it also covers an export from a pending version is open (F12). *Failure:* an item differs between formats; slide or section order differs (R-025 AC2) | Every KCI item present and equal in both; order equal; meaning where the formats lay content out differently judged by rubric | Obj + Rubric | Order and text of both files (AC-15) | Hard for the accepted version; Provisional otherwise (F12) |
| R-028 | Preview and file do not differ in content, slide order, or layout within the verified format scope. R-028 states this for "the accepted preview" (F12). *Failure:* a text or order mismatch, or a visible layout difference that would change the user's decision | Text, slide count, and order equal; geometry compared where available; visual differences judged on renders | Obj + Rubric | Geometry (AC-14); order and text (AC-15); renders (AC-18) | Hard within verified format scope, for the accepted version; Provisional otherwise (F12) |
| R-026 | Each known loss or change has a determinate handling and is disclosed before export (UC-008 3A) or recorded. *Failure:* silent loss; the same case handled differently | Each degradation **already recorded** from real artifacts (AC-19) reproduces with its declared handling and notice; spot checks for silent corruption | Obj + Human | Degradation record (AC-19) | Hard for known degradations; the catalogue itself is **[D]** |
| R-027 | PPTX and PDF are valid and open and usable in the workflow V1 verifies; PPTX text, shapes, and tables are editable (UC-008 postcondition 4). *Failure:* repair prompt, parse error, wrong page count, uneditable text | PPTX package-structure checks; PDF parses with the expected page count; the file opens in the evidence application(s) (F8); editability in exploratory sessions | Obj + Human | The produced files | Hard for validity; per-application compatibility Cand. (D-026, RK-006) |

### 4.5 Reliability

| REQ | What must hold | Oracle / evaluation basis | Mode | Observe | Level |
|---|---|---|---|---|---|
| R-031 | Rejecting the pending version returns to the previous accepted version, one step (D-025, BR-010 rule 5). *Failure:* any difference from the pre-refinement version; constraints from the rejected request remain | State after reject equals state before the refinement; constraint set equals the pre-refinement set | Obj | Before/after (AC-17); constraint set (TN-1) | Hard |
| R-031 | A failed generation, refinement, or export keeps the last accepted version; a failed first generation leaves no deck (UC-001 4B, 5A). *Failure:* a half-applied change, or the accepted version is lost or altered | Fault injection at each failure point: accepted version intact, no pending version created | Obj | Version status (TN-6); fault injection (TN-3); failure points **[A]** | Hard |
| R-032 | An external failure or timeout ends the operation in a determinate terminal state (done, stopped, or error — UC-014 postcondition 1), with no hang; the deck state is known and the cause reportable. *Failure:* the operation hangs, or ends with an unknown deck state | Simulated timeouts, errors, and malformed responses: the operation reaches the error state within a bound, deck state known, cause reported (AC-20). The bound's value is **[D]** (D-011) | Obj | Terminal state and cause (AC-20); fault injection (TN-3) | Hard |

### 4.6 Operation and session lifecycle

| REQ / BR | What must hold | Oracle / evaluation basis | Mode | Observe | Level |
|---|---|---|---|---|---|
| R-046 | The user can stop a running generation or refinement at any time before it finishes. After a stop, the accepted version is unchanged and no partial or pending version remains (R-046 AC2–3); a stopped operation creates no new version, including from a result that arrives after the stop (BR-014 rule 2, RK-007). *Failure:* the accepted version changes; a partial or pending version appears; a late result later appears | Stops that arrive at different phases of an operation, including while an external response is still outstanding, all end with the accepted version unchanged and no version created by the stopped operation; a stopped first generation leaves no deck (UC-001 4A, UC-002 5B) | Obj | Timing control (TN-3); version status (TN-6); terminal state (AC-20) | Hard. Which phases exist, and whether stop or completion wins when they coincide, depend on the commit point **[A]** |
| BR-014 | Only one AI operation runs at a time; a new request during a running operation is refused, with the choice to wait or stop (UC-014 2C). *Failure:* two operations run, or the second result overwrites the first | A request made while an operation runs is refused; at most one result is produced | Obj | Timing control (TN-3); version status (TN-6) | Hard |
| R-045 | Starting a new deck, reloading, or closing while an undownloaded deck exists shows a warning that can be cancelled; no warning appears when nothing is undownloaded (BR-012). *Failure:* a deck is lost without warning; a spurious warning; cancel does not keep the session | Warning shown or not, per trigger, in the states whose status does not depend on F14 (no deck; a deck never exported); cancel keeps the session; confirm clears deck, source, and constraints (UC-011 postcondition 1) | Obj (reload/close only through the browser) | Whether the deck counts as undownloaded (TN-6); session content | Hard for no-deck and never-exported states; Provisional for all other states (F14) |

### 4.7 Disclosure and intake rules

| BR | What must hold | Oracle / evaluation basis | Mode | Level |
|---|---|---|---|---|
| BR-011 | A slide-targeted refinement request is told, before refinement, that it is best effort and other slides may change | Message present for slide-targeted cases. Locality is **not** checked (P4 is not V1) | Obj | Hard |
| BR-013 | Limits are disclosed, never silently skipped: unsupported file type lists the 5 accepted types (R-003 AC2); an unsupported refinement type is refused with the deck unchanged (UC-004 2C); format losses are listed before export (R-026) | Message present and deck unchanged for each limit case | Obj | Hard |
| BR-009 | One source per deck (a second file is refused, UC-002 1A); a PPTX source contributes content only | Refusal case; PPTX-source cases compared on content only | Obj | Hard |

### 4.8 Security

| REQ | What must hold | Oracle / evaluation basis | Mode | Observe | Level |
|---|---|---|---|---|---|
| R-042 | User content does not appear in logs, temporary files, or outbound flows beyond the designed ones. *Failure:* a canary value appears in an undeclared sink | Marker (canary) values in source and prompt appear in no user-content sink or egress path other than the declared flows (AC-11). Whether files from an ended session are deleted is open (UC-011 OQ-1) and is recorded, not gated | Obj | User-content egress and sink paths (TN-4); allowed flows **[A]** | Hard |
| R-043 | Source content cannot change system instructions or trigger actions outside policy (BR-008). *Failure:* an embedded instruction takes effect | Instructions embedded in each D-024 source type, each with a detectable effect, have no effect | Obj; subtle steering cases: Rubric | Deck content; actions taken | Hard |

## 5. P3 — applying the D-028 quality ladder

### 5.1 Hard minimum

D-028 fixes the P3 hard minimum as the four items below (P1 and P5 have their own suites in §4).
The words "severe", "clearly", and "unintentionally" have no measurable definition yet; until
evidence exists, that judgement goes through the rubric.

| # | Hard minimum (D-028) | Proposed objective proxy | Rubric part | Needs to observe |
|---|---|---|---|---|
| HM-1 | Unreadable or severely clipped text | Text overflowing its box or the slide; text cut off when rendered | "Severe" | Geometry and text metrics after layout (AC-14); rendered image (AC-18) |
| HM-2 | Clearly broken narrative | No reliable proxy | All of it: idea order, transitions, off-topic slides | Slide order and text (AC-15) |
| HM-3 | Broken or unintentionally empty slides | Slide with no visible content; render errors | "Unintentionally": section dividers may be sparse on purpose | Accepted state; rendered image (AC-18) |
| HM-4 | Severe layout failure | Overlapping elements hiding content; elements outside the slide area | "Severe" | Geometry (AC-14) |

W-032 fixes **what** the rubric judges (the table above). The rubric instrument itself — wording,
scale, calibration set, agreement threshold — is built before the core-flow slice **[D]**, and must
be approved and calibrated before R-021 is used as a gate.

### 5.2 Candidate criteria and research gaps

The items below are **not** gates (D-028). Testing measures and records them to build evidence;
once evidence is sufficient, it proposes reopening D-028 to promote an item to a hard gate.

| # | Candidate criterion (D-028) | What to measure | Evidence needed to set a threshold | When |
|---|---|---|---|---|
| RG-1 | Font size | Smallest font size per text type, in PPTX and PDF | Distribution across the corpus; correlation with raters' "hard to read" judgements | Core-flow slice **[D]** |
| RG-2 | Density | Text per slide (words, lines, bullets) | Same, against "too dense" judgements | Core-flow slice **[D]** |
| RG-3 | Contrast | Text/background contrast ratio on rendered images | Comparison with common accessibility standards; rater judgements | Core-flow slice **[D]** |
| RG-4 | Consistency | Variation in fonts, colors, title position across slides | Raters' "inconsistent" judgements | Core-flow slice **[D]** |
| RG-5 | Key-information coverage | Share of KCI items present in the deck | Approved KCI (F2); "missing key point" judgements | When KCI and generation exist |
| RG-6 | Coherence measure | No proxy yet; use the rubric | Rater agreement on an extended HM-2 | Core-flow slice |
| RG-7 | Severity thresholds | Severity classes for HM-1, HM-4 | Case set with rater-assigned severity; measured agreement | After the rubric exists |

Rule: no item in this table becomes a failing assertion until D-028 is reopened and updated.

### 5.3 Which checks can run where — answering DOC-004 §11

DOC-004 §11 leaves open whether P3 checks on rendered output can run before a result is displayed
or accepted. R-033 requires a check "for each operation type" but leaves the checks open. The table
separates two uses of a check:

- **Test oracle** — runs in a test with prepared expectations (KCI, human raters).
- **Runtime validation** — runs inside the product on every result, with no prepared expectation.

Only the second can stop a bad result from being displayed. The table states **feasibility only**:
which checks *could* run as runtime validation and what data that would need. It does not decide
which checks the product must run; that is open under R-033 and, for P1, under F15. Where each
candidate places a runtime check is **[A]**.

| Check | Data it needs | Could it run as runtime validation? |
|---|---|---|
| P1 — numbers in source-origin content appear in the source | Result with origin (AC-16); source text | Feasible if origin and source are available where validation runs. Whether the product must run it is open (F15) |
| P1 — KCI comparison | Result; KCI | No — test oracle only |
| P2 — measurable constraints | Result; active constraint set | Feasible if the constraint set is available where validation runs (AC-04) |
| HM-2 — narrative | Slide order and text | Only through a calibrated LLM judge; rater rubric is test-time only |
| HM-3 — empty slide | Result; rendering for render errors | "No content": yes. Render errors: only if the candidate renders before display |
| HM-1 — clipped text | Post-layout geometry; rendering | Only if the candidate lays out or renders before display |
| HM-4 — layout failure | Post-layout geometry | Only if the candidate has geometry before display |
| R-027 — file validity | The produced file | Yes, before delivery (AC-10; UC-008 step 5) |
| R-028 — preview vs file | Preview geometry/render; the file | Yes before delivery, if preview geometry is available at export |
| R-025 — PPTX vs PDF | Both files | Test oracle mainly: UC-008 exports one chosen format per request |

Consequence for W-033/W-034: a candidate that has geometry only at export time cannot stop HM-1
and HM-4 failures before a result is displayed; R-033 then protects P3 only partially. This is
evidence for AC-10 and AC-25, not a new Gate.

## 6. What Testing needs from the Architecture

### 6.1 Already covered by DOC-004

| Checks in §4–§5 | Satisfied by |
|---|---|
| P3 checks at generation/refinement; validity checks before delivery | AC-10 |
| HM-1, HM-4, R-028 geometry | AC-14 |
| P5, R-020, R-028, HM-2 | AC-15 |
| P1 origin | AC-16 |
| R-024, R-031 reject | AC-17 |
| P3 rubric, R-028 visual, LLM judge | AC-18 |
| R-026, R-027 degradation | AC-19 |
| R-032, R-046 terminal state and cause | AC-20 |
| R-045, R-046, BR-010, BR-014 | **No criterion yet.** W-037 adds criteria for R-045, R-046, D-029, and BR-010; until then TN-3 and TN-6 carry the testing need |

AC-05 and AC-09 are worded around "the accepted state", while R-020 and BR-010 (changed
27/09/2026) export from the previewed version, which may be pending. Until Product resolves F12 and
W-037 updates DOC-004, DOC-008 makes no assumption about which wording governs.

If a candidate `Does not meet` AC-14, AC-15, AC-16, or AC-17, then P3, P5, P1, or P2 respectively
cannot be verified. Per DOC-002 §20, this must be raised as a scope reopen, not patched over by
Testing with workarounds.

### 6.2 Not in DOC-004 — proposed input to W-033/W-035

These needs are stated as **capabilities**, not mechanisms. DOC-008 does not turn them into
Gates; W-033 records them as missing evidence for a mechanism, and W-035 compares them under
AC-25.

| # | Capability | Needed by | Without it | Why architecture-level |
|---|---|---|---|---|
| TN-1 | The active constraint set can be read after each turn, including after a reject | R-001; R-024; constraint cancellation on reject (BR-010 rule 5) | R-001 is testable only through deck content; a capture failure and an application failure look the same; cancellation on reject is invisible until a later deck happens to show it (F5) | AC-04 decides whether constraints exist as state separate from the deck; if they do, reading them costs little; representation is not required |
| TN-2 | The outcome of validation can be read: which checks ran on which result, and the verdict | R-033; runtime checks in §5.3 | A test cannot tell "validated and passed" from "not validated"; injection tests see only the end state (F6) | AC-10 places validation points; exposing their outcome is cheap only if planned with them. No logging format is implied |
| TN-3 | Calls to external models and tools can be substituted in tests: recorded responses replayed, failures injected, and responses held and released on demand | R-031, R-032, R-046, BR-014, RK-007; deterministic tests of non-AI logic (§2.5); no model call during export (R-020); outbound payloads (R-042) | Fault injection, stop races, and late-result cases become non-deterministic or impossible; every gate run depends on a live provider | Where external calls cross the system boundary is fixed by the architecture (AC-08, AC-22); the substitution technique is Detailed Design |
| TN-4 | User-content egress and sink paths — every place user content is persisted or sent — are identifiable and observable to verification | R-042 marker checks | Absence of exposure can only be argued from design review, not shown | AC-11 already requires these flows to be explicit and identifiable; TN-4 adds only that verification can observe them. No logging, temporary-file, or interception mechanism is implied |
| TN-5 | Core Flow behavior can be exercised and observed without going through the interactive UI | All suites; repeated gate runs (§2.5) | Gate runs need UI automation: slower and less repeatable, so costlier — not impossible | **Cost factor, not a Gate:** no DOC-004 AC or Decision requires it (AC-18 covers rendering only). Compared under AC-25. No API, CLI, or headless interface is implied. Browser-only by nature: R-045 reload/close warning, R-029 sessions, preview display |
| TN-6 | Version status can be read: the current accepted version, the pending version if any, and whether the latest version has been exported | R-020 promotion, R-031, R-046, BR-014, R-045 | Lifecycle is inferred only from the UI; "pending discarded" and "never created" cannot be told apart | State ownership (DOC-004 §10.2). If W-037 makes this observable through the BR-010 criteria, TN-6 folds into DOC-004 |

### 6.3 AC-25 comparison questions for W-035

- What must the candidate build **only for testing** (TN-1 … TN-6, geometry extraction,
  rendering)?
- Which checks in §5.3 can run as runtime validation **before** a result is displayed?
- Can stop, late-result, and concurrent-request cases run deterministically (TN-3)? Where is the
  commit point that decides whether a stop or a completion wins?
- How long from a real PPTX/PDF existing to a new degradation being recorded (AC-19)?
- How many checks move from rubric to objective thanks to data the candidate exposes?

## 7. When to test

### 7.1 Phases

| Phase | Testing activity | Output | Dependency |
|---|---|---|---|
| W-032 (now) | Select the test basis, define verification targets and evaluation modes, apply the D-028 ladder, state testability needs, record findings | DOC-008 draft; findings in §10 | — |
| W-033, W-034 | Answer §5.3 and §6.2 per mechanism/candidate | Testability notes in DOC-009 | — |
| W-035 | Testability input to the trade-off (§6.3) | Testability comparison | — |
| W-036 | Add verification boundaries, test types per boundary, check placement, failure points, commit points, how observable state is exposed, preview/export integration concerns | DOC-008 baseline | **[A]** |
| Detailed Design (after SP-002) | Specify tests against component contracts; build the §8 inputs | Final Testing Plan | **[D]** |
| Implementation | Authors test their own work; someone else verifies (§9) | Test results, Bugs | **[D]** |
| Core-flow slice | Run the §4 suites; measure candidate criteria; spikes on oracles (e.g. reading content back from PPTX/PDF, overflow detection, judge calibration) | Evidence per critical behavior; evidence for RG-1 … RG-7 | **[D]** |
| V1 acceptance | Evidence for DOC-002 §16; R-029 usability sessions; exploratory sessions; §11 observations | Acceptance evidence; sign-off by a non-implementer | **[D]** |
| From implementation on | Regression on every prompt, model, or exporter change | Trend | **[D]** |

Spike evidence is labelled as spike evidence and never counts toward acceptance.

### 7.2 Earliest meaningful point per suite

| Suite | Earliest point |
|---|---|
| P1 (R-007) | Source-based generation runs |
| P2 (R-001, R-024, R-009) | Constraint capture and one refinement turn run |
| P3 hard minimum (R-021) | Core-flow slice, once layout or rendering exists |
| R-033 | A validation step exists **[A]** |
| P5 | One exporter (R-020, R-027); both exporters (R-025); preview and one exporter (R-028); real artifacts (R-026) |
| R-031, R-032, R-046, BR-014 | Version handling and one external call exist; failure points **[A]** |
| R-045 | The session UI exists |
| R-042, R-043, §4.7 | The source intake path exists |

## 8. Input artifacts

This section lists the **kinds** of input verification will need and what each depends on. Their
content is not specified here; building them is Final Testing Plan work.

| Artifact | Used for | Status | Dependency |
|---|---|---|---|
| Requirements, Business Rules, Decisions D-017, D-023 … D-029, A-005 | Test basis | In Project Hub | — |
| DOC-004 | Check → AC mapping; observability | Draft; R-045, R-046, D-029, BR-010 pending W-037 | — |
| DOC-002 | Scope, §16 acceptance, §17 testing handoff | Available (PDF, outside the repo) | — |
| Source corpus covering the 5 D-024 source types, including source-gap cases and a source with embedded images | P1, P5, R-043, §4.7 | To build | **[D]** |
| KCI for each corpus case | R-007, R-025, R-028, RG-5 | To build; definition awaiting Duy (F2) | **[D]** |
| Scenario sets for the §4.2 and §4.4–§4.7 behaviors (multi-turn constraints, refinement types, export lifecycle, stop and concurrency, session loss) | R-001, R-024, R-020, R-031, R-045, R-046, BR-011, BR-013, BR-014 | To build. Cases that depend on F9, F12, F13, or F14 are exploratory until those are resolved | **[D]**; the phases at which a stop can arrive are **[A]** |
| Rubric instrument and calibration set | R-021, R-009, R-025, R-028 | To build — owned by Testing | **[D]** |
| Injection and marker (canary) inputs | R-042, R-043 | To build | **[D]** |
| Fault sets: external failure types; failure points inside the system | R-031, R-032 | External types: **[D]**. Internal failure points: awaiting the Architecture | **[A]** |
| Flows allowed to carry user content outward | R-042 | Awaiting the Architecture | **[A]** |
| Degradation log from real artifacts | R-026, R-027 | Built from evidence, not written up front (AC-19) | **[D]** |
| Application(s) used as evidence that PPTX/PDF are usable | R-027 | Awaiting decision (F8, RK-006) | Product |

## 9. Independent verification

Principle (W-032 description item 4): **where feasible, the person who implements a module is not
the only person who verifies it.** Specific reviewers are assigned only once module boundaries
actually exist **[A]**; the table pairs roles, not names.

| Area | Independently verified by |
|---|---|
| Generation and refinement | Someone who did not write the generation prompt writes the KCI and multi-turn scripts, and owns the P1, P2 suites |
| Validation (R-033) | Someone other than the implementer writes the invalid-result injection tests |
| PPTX, PDF export | Someone other than the export implementer writes the P5 checker and R-027 checks |
| Preview (R-028) | The owner of the P5 checker |
| Version lifecycle, stop, recovery (R-020 lifecycle, R-031, R-032, R-046, BR-014) | Someone other than the state implementer writes the fault-injection and timing suites |
| Source intake and security (R-042, R-043) | Someone other than the input implementer writes the injection and canary suites |
| Rubric grading | At least two raters; none is the author of the prompt being graded |
| LLM judge | Only after calibration against human raters; different model + prompt configuration from the generator |
| V1 acceptance (DOC-002 §16) | Signed off by someone who did not implement the modules of that critical behavior |

In a small team, rotate: whoever verifies module X implements module Y. Authors still write their
own unit tests — independence **adds** a verifier; it does not remove the author's responsibility.

## 10. Findings from reviewing the test basis

Reported only; Project Hub remains the source of truth and is not changed by this document. Each
open finding states what Testing does until it is resolved.

### 10.1 Open

- **F1** — R-008 (source gap; the other half of P1 per BR-002; listed in D-024) is not among
  W-032's primary Requirements. DOC-008 covers it inside the R-007 suite. *Needs:* Duy to confirm,
  or add R-008 to W-032.
- **F2** — "Important" is not defined in the acceptance notes of R-007, R-025, R-028, and UC-002
  OQ-2 asks W-032 for the P1 measure. The KCI (§2.4) is the proposed answer. *Needs:* Duy's
  agreement before the KCI is used as a gate.
- **F5** — The active constraint set is not among the D-028 or DOC-004 observability needs. R-001
  is then testable only indirectly via R-024, and constraint cancellation on reject (BR-010 rule 5)
  cannot be observed directly. Raised as TN-1.
- **F6** — AC-10 requires validation to be possible, not its outcome to be observable. Testing
  R-033 needs to know that validation ran and what it concluded. Raised as TN-2.
- **F8** — R-027 says "usable in the workflow V1 verifies", but the evidence application has not
  been chosen (D-026 defers it; UC-008 OQ-1; RK-006 mitigation 1 asks for the choice). Not
  blocking for the Architecture; must be settled before V1 acceptance. Until then, per-application
  compatibility is a candidate criterion.
- **F9** — Constraint lifetime and conflicts are still open (A-013, DOC-002 OQ-04, UC-004 OQ-1).
  R-024 AC2 and BR-010 rule 5 now settle one case: rejecting a version cancels the constraints its
  request introduced. Still open: how single-refinement constraints are told apart from lasting ones
  (BR-003 exception: "defined later"), and conflicts. P2 gates use only unambiguous cases: an
  unchanged constraint persists; a changed constraint takes its new value; a rejected request's
  constraint is gone. Other cases are exploratory and feed OQ-04.
- **F10** — R-021 AC2 assigns threshold research to W-032, while D-028 reopens "when W-032 has
  evidence". That evidence exists only once real artifacts exist (§5.2), so P3 thresholds will not
  be available within SP-002. This follows correctly from D-028; W-032 should not be judged not Done
  for lacking thresholds.
- **F11** — R-030 is V1-active with AC-20 in DOC-004 but is not a W-032 primary Requirement. R-046
  depends on R-030, and §4.5–§4.6 verify the terminal states (UC-014 postcondition 1) and failure
  cause. Progress display itself is not verified here. *Needs:* Duy to confirm this is intended.
- **F12** — The version lifecycle uses five distinct notions: the **accepted** version, the
  **pending** version, the version **being previewed**, the version **being exported**, and the
  point at which an export counts as **delivered**. Project Hub relates them inconsistently:
  R-020 AC1 and BR-006 export the version being previewed, which may be pending. BR-010 rule 3
  promotes a pending version when its file "is produced and delivered to the user". R-025 AC1
  ("the same accepted version"), R-028 AC1 ("the accepted preview"), and DOC-004 AC-05/AC-09
  ("accepted state") speak only of the accepted version. Open: (a) whether R-025 and R-028 apply
  to an export made from a pending version; (b) what event counts as "delivered". DOC-008 does not
  define either. Until resolved, the affected checks in §4.4 are Provisional. *Needs:* Product/BA
  to settle (a) and (b); W-037 to align DOC-004. Once "delivered" is defined, how it is observed is
  **[A]**.
- **F13** — The state of constraints **introduced by a refinement request** is undefined when that
  refinement **stops** (R-046) or **fails** (R-031, R-032): are they kept, dropped, or
  something else? UC-004 3A, 3B, and 4A do not say. (Reject is already defined by BR-010 rule 5
  and R-024 AC2, and is not part of this finding.) DOC-008 treats these cases as Provisional.
  *Needs:* Product/BA rule.
- **F14** — "Undownloaded deck" (R-045, BR-012 rule 2, UC-011 step 2 "the latest version") is not
  defined. DOC-008 does not assume that exporting one of the two formats makes a deck downloaded;
  that a single rule covers the accepted and the pending version; or that closing the browser and
  terminating the local process are the same event (no warning is possible in the latter). Until
  defined, only the no-deck and never-exported states are gates. *Needs:* Product/BA definition.
- **F15** — Three things must be kept apart: (1) the **property** — R-007 requires source numbers
  and facts to be preserved; (2) the **test oracle** — Testing verifies that property (§4.1);
  (3) **runtime validation** — the product itself checks the property before a result is displayed
  or accepted. (1) does not imply (3): R-007 states the property, and R-033 requires a check per
  operation type without naming it. Only UC-002 step 6 ("checks the result, including that numbers
  match the source") describes (3), and no Requirement or Decision backs it. If (3) is required,
  the Architecture must make the source and content origin available where validation runs (§5.3).
  If not, P1 is protected by tests only. *Needs:* Product/BA to confirm whether UC-002 step 6 is a
  product requirement.

### 10.2 Closed since the previous draft

- **F3** — closed: R-025 no longer references "PF-03".
- **F4** — closed: BR-006 is `Active` (changed 27/09/2026), consistent with R-020.
- **F7** — closed: the 27/09/2026 Use Case review links R-024, R-031, R-032, R-033 to UC-004 and
  R-032, R-033 to UC-001/UC-002; UC-008 no longer links R-039; UC-006 no longer exists.

## 11. Research questions from deferred uncertainty

None of the questions below is a V1 gate. Testing collects evidence for later team decisions.

| Source | Question | Evidence collected | When |
|---|---|---|---|
| L-001 | Which source capability should open next? | In exploratory and usability sessions: record each time a user wants a source outside D-024 (scans, spreadsheets, images, URLs, multiple sources) and each time a deck is worse for lack of images | V1 demo, V1 acceptance |
| L-002 | Is whole-deck restyling (including theme choice), AI visuals, or stronger slide-targeted refinement needed? | Count restyle, theme, visual, and slide-targeted requests; record cases where best-effort refinement was insufficient and the extra work it caused | V1 demo, usability sessions |
| A-013 / OQ-04 | Which constraints last how long, and how are conflicts resolved? | Results of the F9 and F13 exploratory cases | Core-flow slice |
| D-026, RK-006 | How compatible is the PPTX across applications? | Degradation log per opening application (AC-19) | Once real artifacts exist |
| A-029 | Do users accept that a deck lives only in the current session? | In sessions: unintended deck losses, and how often the R-045 warning is dismissed versus acted on | Usability sessions |
| D-029, RK-007 | Does stopping leave indeterminate state, or does a stopped call keep costing? | Any stop case that fails §4.6; provider usage after a stop, where visible (R-036 is Later, so this is observation only) | Core-flow slice |
| A-005 | Does focusing tests on critical behaviors catch the important failures? | Share of important bugs found **outside** the §4 suites, mainly from exploratory sessions | From the core-flow slice; reviewed at V1 acceptance |

A-005 is DOC-008's founding assumption: if many important failures surface only outside these
suites, A-005's Review Trigger fires and the approach must broaden coverage.

## 12. Architecture-dependent and deferred parts

**Added by W-036 after W-035 [A]:**

- verification boundaries per component of the Architecture baseline, and test types per boundary;
- placement within the chosen Architecture of the §5.3 checks (which checks the product must run
  stays a Product question: R-033, F15);
- concrete failure points (R-031);
- commit points, including the one that decides stop vs completion, and the phases at which a stop
  can arrive (R-046);
- how the delivery point is observed, once Product defines it (F12);
- flows allowed to carry user content outward (R-042);
- how observable state is exposed: content origin, constraint set, validation outcomes, version
  status, and user-content egress paths (TN-1, TN-2, TN-4, TN-6), if the Architecture provides
  them;
- integration concerns between preview, PPTX, and PDF;
- reviewer assignment by module boundary (§9).

**Deferred beyond SP-002 — Detailed Design and the final Testing Plan [D]:**

- quantitative thresholds, pass rates, repetition counts, rater-agreement thresholds, coverage
  targets;
- P3 thresholds for RG-1 … RG-7 (via reopening D-028);
- the R-032 timeout bound;
- pass criteria for rubric-based and session-based items (R-009, R-029);
- tools, frameworks, environments, model pinning, substitution technique for external calls;
- test case and test procedure specifications; the corpus, KCI, scenario sets, fault sets, and
  rubric instrument themselves;
- schedule and concrete assignments.

**Awaiting Product decisions (not Testing's to settle):** F1, F2, F8, F9, F11 … F15.

## 13. Mapping to W-032 Done When

| W-032 Done When | Section |
|---|---|
| Scope of what to verify | §3, §4, §5 |
| Test timing | §7 |
| Inputs / outputs | §8 (inputs), §7.1 Output column |
| Evaluation method | §2.2, §4, §5 |
| Ownership guideline | §9 |
| Critical / architecture-relevant REQs prioritized | §3.1 |
| Architecture-dependent parts clearly marked | §1.2, **[A]**/**[D]** labels, §12 |
| Update of 27/09/2026: R-045, R-046, BR-009 … BR-014 | §3.1, §3.2, §4.6, §4.7 |
| D-028 threshold/severity gaps (Supporting Input) | §5.2 |
| L-001, L-002 turned into research/test questions (Supporting Input) | §11 |
