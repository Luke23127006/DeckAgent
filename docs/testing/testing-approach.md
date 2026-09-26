# DeckAgent Testing Approach (DOC-008)

- Status: Draft — initial, architecture-independent Testing Approach. **Not the final Testing
  Plan.**
- Produced by: W-032 (Khoa) · Reviewer: Duy · Finalized by: W-036 after W-035 selects the
  Architecture baseline
- Used by: W-033 (Required Input: verification/testability needs), W-034, W-035 (via AC-25),
  W-036
- Basis: W-032 primary Requirements; D-023, D-024 … D-028; A-005; L-001, L-002;
  [DOC-004 Architecture Acceptance Criteria](../architecture/architecture-acceptance-criteria.md)
  (AC-01 … AC-27); DOC-002
- Updated: 2026-09-27. Project Hub state was read from the shared Spreadsheet on the same day, not
  from a snapshot (`./scripts/project-hub status` reported not authenticated).
- Language: this English file is the canonical source.
- References written as `§n` point to DOC-002. `AC-nn` points to DOC-004.

## 1. What this document is for

DOC-008 answers one question: **how will V1 be verified, starting from Requirements and critical
behaviors, before the Architecture is chosen?** For each mapped Requirement it states what must be
verified, when, which input artifacts are needed, what Testing produces, and which parts are
objectively testable versus which need a rubric or human evaluation.

Division of roles with DOC-004: DOC-004 states **where** validation must be possible (AC-10) and
**what** must be observable (AC-14 … AC-20). DOC-008 decides **which checks exist**, how they are
evaluated, and how thresholds will be found. DOC-008 does not choose mechanisms (D-011) and does not
add Gates for the Architecture; testability needs beyond DOC-004 go to W-033/W-035 as comparison
input under AC-25 (section 6.3).

**Out of scope / stop condition** (D-023, OR-024): no test case specification, no tool or
framework selection, no pass rates or numeric thresholds, no module-level test design, and no
assumption about any internal system structure. These are marked and deferred in section 12.

### 1.1 What to read, by role

| Role | Read | Purpose |
|---|---|---|
| W-033 — mechanism synthesis | §4, §5.3, §6 | Know which checks must run where and what must be observable, to record ACs and missing evidence per mechanism |
| W-034 — candidate architectures | §5.3, §6 | Each candidate must state whether P3 checks run before or after rendering (DOC-004 §11) |
| W-035 — trade-off | §6.3 | Compare testability cost (AC-25) with concrete questions |
| W-036 — finalize DOC-008 | §12 | List of parts waiting on the Architecture |
| Product (Duy) | §10, §11 | Findings needing a decision, and research questions |

### 1.2 Dependency labels

Anything **without** a label is architecture-independent and usable now.

| Label | Meaning | Completed by |
|---|---|---|
| **[A]** | Depends on the Architecture baseline: verification boundaries, check placement, failure points, seams | W-036, after W-035 |
| **[D]** | Depends on Detailed Design, implementation, or real artifacts: thresholds, tools, test cases, schedule | After SP-002 (final Testing Plan) |

## 2. Shared concepts

### 2.1 V1 critical behaviors (D-017)

| Code | Name | V1 hard acceptance | Primary Requirements |
|---|---|---|---|
| P1 | Source fidelity | Yes, when the workflow uses a source | R-007 |
| P2 | User intent fidelity | Yes | R-024, R-001, R-009 |
| P3 | Presentation quality | Only the D-028 hard minimum | R-021 |
| P4 | Safe refinement | **No** (D-017). No oracle in DOC-008 asserts modification locality | — |
| P5 | Output fidelity | Yes | R-025, R-028 |

### 2.2 Three evaluation modes

- **Objective** — a deterministic oracle decides pass/fail without judgement; automatable.
- **Rubric** — structured judgement against pre-written criteria by at least two raters, with
  measured agreement. An LLM judge may replace human raters only after calibration against them,
  and never with the same model + prompt configuration as the generator it grades.
- **Human evaluation** — exploratory sessions or task-based usability sessions. Produces findings
  and evidence; not a binary gate by itself.

### 2.3 Commitment level of a quality item (D-028 ladder)

`known failure mode → candidate criterion → hard gate`. An item is a **hard gate** only when the V1
baseline has committed to that minimum or it belongs to P1/P5. An item with a known failure mode
but insufficient evidence is a **candidate criterion**: it is measured and recorded but does not
fail acceptance. Professional, engaging, and aesthetic quality is **exploratory**. Section 5
applies this ladder to P3.

### 2.4 Key Content Inventory (KCI)

R-007, R-025 and R-028 all rely on the word "important" without defining it (F2). DOC-008
proposes: each test case has a pre-written KCI — the facts, numbers with units, named entities,
attributions, and section order considered important — written by someone who did not write the
generation prompt. One KCI is shared by the P1, P5 and R-028 oracles. Duy's agreement is needed
before the KCI becomes the shared definition.

### 2.5 Non-determinism

AI output varies between runs. Gate cases are run repeatedly with the model configuration
recorded; the number of repetitions and the pass rate are **[D]**. Non-AI logic (validation, state,
export) must be testable with recorded or simulated responses so that CI is deterministic — a
testability need in §6.2.

## 3. Requirement selection

### 3.1 Mapped Requirements

Exactly the W-032 primary Requirements. "Architecture-relevant" means DOC-004 has an AC tracing to
that Requirement (DOC-004 §10.4).

| ID | Group | Why mapped | AC in DOC-004 |
|---|---|---|---|
| R-007 | P1 | Main claim of P1 | AC-03, AC-16 |
| R-001 | P2 | Constraints must be captured before they can be maintained | AC-04 |
| R-024 | P2 | Main claim of P2 | AC-04, AC-17 |
| R-009 | P2 | Purpose/audience/context is part of P2; critical, not architecture-relevant | — |
| R-021 | P3 | Main claim of P3; D-028 ladder | AC-10, AC-14, AC-18 |
| R-029 | P3 / V1 boundary | Usable without design skills; only verifiable with people | — |
| R-033 | Validation boundary | Validation before an AI result becomes authoritative | AC-06, AC-10 |
| R-020 | P5 | Export from the accepted state | AC-01, AC-05, AC-09 |
| R-025 | P5 | Main claim of P5 | AC-05, AC-15 |
| R-028 | P5 | Preview matches the exported artifact | AC-05, AC-14 |
| R-026 | P5 supporting | Predictable degradation, no silent corruption | AC-19 |
| R-027 | P5 supporting | Valid and usable artifacts | AC-09, AC-10, AC-19 |
| R-031 | Reliability | Reject/failure does not lose the usable state | AC-06 … AC-09, AC-17 |
| R-032 | Reliability | External failure ends determinately | AC-08, AC-20, AC-22 |
| R-042 | Security | User data exposure — required by a REQ | AC-11 |
| R-043 | Security | Source content is untrusted data — required by a REQ | AC-02 |

### 3.2 Related but not mapped separately

The Requirements below appear in tests as **execution context**, without their own suite or
oracle (OR-012):

- R-006, R-011, R-013, R-019 — the Core Flow, deck-level refinement (D-025), and preview are the
  vehicle for running the P1/P2/P3/P5 suites. Core Flow completeness is checked at architecture
  level by AC-01.
- R-003, R-004 — D-024 fixes the corpus source types (section 8). Separating instructions from
  source content is checked through the R-043 suite.
- R-008 — the source gap is part of P1; source-gap cases live in the R-007 suite (see F1).
- R-030 — the "failure cause reportable" part is touched through the R-032 suite; status UX is not
  mapped (F11).
- R-041 — a Constraint, checked by architecture review (AC-12), not by tests.

### 3.3 Security and Performance

- **Security** covers only R-042 and R-043, the only V1-active Requirements that call for it. No
  authentication, authorization, or hardening is added: D-027 fixes V1 as a local web app with no
  accounts and no hosting.
- **Performance** is excluded: no V1-active Requirement asks for it (R-035 Later; R-036, R-037
  Product), the Risks table is empty, and quantitative thresholds are not set ahead of evidence
  (D-011). An operation having to terminate when a dependency fails is treated as reliability via
  R-032.

## 4. What to verify

Column **Level**: `Hard` = hard acceptance; `Cand.` = candidate criterion; `Expl.` = exploratory
(section 2.3). Column **Earliest** is the earliest point at which the check is meaningful
(section 7).

### 4.1 P1 — Source fidelity

| REQ | What to verify | Objective | Rubric / Human | Level | Earliest |
|---|---|---|---|---|---|
| R-007 | Important facts, numbers, meaning, and attribution from the source are not corrupted | Every number and named entity in the KCI that appears in the deck matches the source in value and unit | Meaning preserved where paraphrased (rubric); a third person arbitrates rater disagreement | Hard | When source-based generation runs |
| R-007 | AI-added or user-stated content is not presented as source-derived | No content with origin "source" that the source does not contain, read via content origin (AC-16) **[A]** | Source-gap cases (R-008): the gap is surfaced or the filled content is clearly distinguished | Hard | Same |
| R-007 | P1 still holds after refinement | Re-run the KCI and origin checks after each refinement that touches source content | — | Hard | When refinement runs |

### 4.2 P2 — User intent fidelity

| REQ | What to verify | Objective | Rubric / Human | Level | Earliest |
|---|---|---|---|---|---|
| R-001 | Intent/constraints stated by the user are captured and available to later steps | If the active constraint set is observable: each constraint in the script is present in the set **[A]**. Otherwise: only indirectly via R-024 (F5) | — | Hard | When intent capture exists |
| R-024 | Constraints still in effect keep applying across refinement turns | Measurable constraints — slide count or length range, language, required sections — hold after **every** turn of a multi-turn script; compare before/after the last turn (AC-17) | Soft constraints — tone, audience fit — are preserved (rubric) | Hard for unambiguous cases; Expl. for conflict/expiry cases (F9) | When one refinement turn runs |
| R-009 | Purpose, audience, and context visibly shape content and structure | — | Paired comparison: same request, different audience/purpose; raters can tell which deck is for whom (rubric); audience fit in exploratory sessions | Hard (via an approved rubric) | Core-flow slice |

### 4.3 P3 — Presentation quality and validation

| REQ | What to verify | Objective | Rubric / Human | Level | Earliest |
|---|---|---|---|---|---|
| R-021 | The deck avoids the D-028 hard-minimum failures | Objective proxies for HM-1, HM-3, HM-4 (section 5.1) | HM-2 and the "severe" part of HM-1, HM-4 (rubric) | Hard | Rubric v0 now; run at core-flow slice |
| R-021 | D-028 candidate criteria | Measured and recorded, never failing (section 5.2) | — | Cand. | Core-flow slice |
| R-021 | Professional, engaging, aesthetic | — | Human evaluation | Expl. | V1 acceptance |
| R-033 | An AI result becomes authoritative only after validation suited to the operation | Inject invalid candidates at generation and refinement: never become the accepted state; valid candidates do. Proposed validation set in section 5.3 | — | Hard | As soon as a validation step exists **[A]** |
| R-029 | The Core Flow can be completed without professional presentation-editing knowledge | — | Task-based usability sessions with participants matching ACT-001 and no design expertise; observation checklist | Hard (via session evidence) | V1 acceptance |

### 4.4 P5 — Output fidelity

| REQ | What to verify | Objective | Rubric / Human | Level | Earliest |
|---|---|---|---|---|---|
| R-020 | Export is produced from the current accepted state, without silent regeneration | Slide text and order of PPTX/PDF equal the accepted state (AC-15); two exports of the same state have the same content; no model call on the export path if a seam makes this observable **[A]** | — | Hard | When one exporter exists |
| R-025 | PPTX and PDF of the same accepted state keep facts, numbers, narrative order, meaning | Every KCI item is present and equal in both artifacts; slide and section order are equal (narrative order is hard per D-028) | Meaning preserved where the two formats lay content out differently (rubric) | Hard | When both exporters exist |
| R-028 | No important difference between the accepted preview and PPTX/PDF | Preview text, slide count, and slide order equal the artifacts; compare geometry where available (AC-14) | Important visual differences (rubric, on AC-18 renders); random spot checks | Hard within verified format capability | When preview and one exporter exist |
| R-026 | Known degradations have determinate behavior and are notified or recorded | Every degradation **already recorded** (from real artifacts, AC-19) is reproducible with its declared behavior and notice/record | No silent corruption in spot checks | Hard for known degradations | Once real artifacts exist **[D]** |
| R-027 | PPTX and PDF are valid and usable artifacts | PPTX passes package-structure checks; PDF parses with the expected page count; opens in the application used as evidence (F8) | Usable for further editing (PPTX) in exploratory sessions | Hard (validity); cross-application: Cand. per D-026 | When one exporter exists |

### 4.5 Reliability

| REQ | What to verify | Objective | Rubric / Human | Level | Earliest |
|---|---|---|---|---|---|
| R-031 | Rejecting the latest refinement returns to the previous accepted state (one step, D-025) | State after reject equals state before the refinement (AC-17) | — | Hard | As soon as state handling exists |
| R-031 | A failed operation does not lose the latest usable state | Fault injection at each failure point of generation, refinement, and export: the last accepted state stays intact (AC-06, AC-08, AC-09). Failed first generation: no ambiguous accepted state | — | Hard | Same; failure points **[A]** |
| R-032 | External failure ends in a determinate state, no hang | Simulate timeouts, errors, and malformed responses from models/tools: the operation reaches a determinate terminal state within a bound, the presentation state is known, the cause is reportable (AC-20). The bound's value is **[D]** (D-011) | — | Hard | As soon as an external call exists |

### 4.6 Security

| REQ | What to verify | Objective | Rubric / Human | Level | Earliest |
|---|---|---|---|---|---|
| R-042 | User content is not exposed via logs, temporary artifacts, or external flows beyond the design | Canary values placed in source and prompt do not appear in logs, leftover temporary files, or outbound payloads except declared flows (AC-11). The list of allowed flows is **[A]** | — | Hard | As soon as an upload path exists |
| R-043 | Source content cannot change system instructions or trigger actions outside policy | Injection payloads embedded in each D-024 source type with detectable effects (add a marker slide, reveal instructions, switch language, call a tool): none of the effects occur | Subtle steering cases (rubric) | Hard | As soon as a source intake path exists |

## 5. P3 — applying the D-028 quality ladder

### 5.1 Hard minimum

D-028 fixes the P3 hard minimum as the four items below (P1 and P5 have their own suites in
section 4). The words "severe", "clearly", and "unintentionally" have no measurable definition yet;
until evidence exists, that judgement goes through the rubric.

| # | Hard minimum (D-028) | Proposed objective proxy | Rubric part | Needs to observe |
|---|---|---|---|---|
| HM-1 | Unreadable or severely clipped text | Text overflowing its box or the slide; text cut off when rendered | "Severe" | Geometry and text metrics after layout (AC-14); rendered image (AC-18) |
| HM-2 | Clearly broken narrative | No reliable proxy | All of it: idea order, transitions, off-topic slides | Slide order and text (AC-15) |
| HM-3 | Broken or unintentionally empty slides | Slide with no visible content; render errors | "Unintentionally": section dividers may be sparse on purpose | Accepted state; rendered image (AC-18) |
| HM-4 | Severe layout failure | Overlapping elements hiding content; elements outside the slide area | "Severe" | Geometry (AC-14) |

**Rubric v0** for HM-1 … HM-4 is a W-032 deliverable (R-021 assigns thresholds to W-032). Rubric
v0 must be approved and calibrated before R-021 is used as a gate.

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
| RG-7 | Severity thresholds | Severity classes for HM-1, HM-4 | Case set with rater-assigned severity; measured agreement | After rubric v0 |

Rule: no item in this table becomes a failing assertion in CI until D-028 is reopened and updated.

### 5.3 Which check runs where — answering DOC-004 §11

DOC-004 §11 leaves open whether P3 checks on rendered output can run before a result is accepted.
This is the architecture-independent part of the answer; where each candidate can place the checks
is **[A]**.

| Check | Needs accepted state | Needs post-layout geometry | Needs rendered image | Needs exported artifact | Can block before accept? |
|---|---|---|---|---|---|
| P1 KCI + origin (R-007) | ✓ | | | | Yes |
| P2 measurable constraints (R-024) | ✓ | | | | Yes |
| HM-2 narrative (rubric) | ✓ | | | | Yes |
| HM-3 empty slide | ✓ | | ✓ (render errors) | | Yes, if rendering is possible before accept |
| HM-1 clipped text | | ✓ | ✓ | | Only if the candidate lays out/renders before accept |
| HM-4 layout | | ✓ | | | Only if the candidate has geometry before accept |
| R-027 validity | | | | ✓ | No — checked before delivery (AC-10) |
| P5 PPTX vs PDF (R-025) | ✓ | | | ✓ | No — checked before delivery |
| R-028 preview vs export | | ✓ | ✓ | ✓ | No — checked before delivery |

Consequence for W-033/W-034: a candidate that only has geometry at export time cannot block HM-1
and HM-4 before a result becomes accepted; R-033 then protects P3 only partially. This is evidence
for AC-10 and AC-25, not a new Gate.

## 6. What Testing needs from the Architecture

### 6.1 Already covered by DOC-004

| Checks in sections 4–5 | Satisfied by |
|---|---|
| P3 checks at generation/refinement; validity checks before delivery | AC-10 |
| HM-1, HM-4, R-028 geometry | AC-14 |
| P5, R-020, R-028, HM-2 | AC-15 |
| P1 attribution | AC-16 |
| R-024, R-031 reject | AC-17 |
| P3 rubric, R-028 visual, LLM judge | AC-18 |
| R-026, R-027 cross-application | AC-19 |
| R-032 failure cause | AC-20 |

If a candidate `Does not meet` AC-14, AC-15, AC-16, or AC-17, the corresponding P3, P5, P1, or P2
cannot be verified. Per §20, this must be raised as a scope reopen, not patched over by Testing
with workarounds.

### 6.2 Not in DOC-004 — proposed input to W-033/W-035

The needs below make testing cheaper and more reliable but are not required by DOC-004. DOC-008
does not turn them into Gates; W-033 records them as missing evidence for a mechanism, and W-035
compares them under AC-25.

| # | Need | Why | REQ |
|---|---|---|---|
| TN-1 | The active constraint set is observable after each turn | Otherwise R-001 is only indirectly testable and capture failures blur with application failures (F5) | R-001, R-024 |
| TN-2 | Validation outcome is observable: which checks ran, pass/fail | AC-10 only requires validation to be possible; testing R-033 needs to know it ran (F6) | R-033 |
| TN-3 | Calls to external models/tools go through a seam that allows replaying recorded responses and injecting failures | Deterministic tests for state, validation, export; fault injection for R-031, R-032 | R-031, R-032 |
| TN-4 | Tests can read logs, temporary directories, and outbound payloads | R-042 canary tests | R-042 |
| TN-5 | The Core Flow can run without the interactive UI | Regression and repeated gate runs (section 2.5); AC-18 already requires this for rendering | All suites |

### 6.3 AC-25 comparison questions for W-035

- What must the candidate build **only for testing** (TN-1 … TN-5, geometry extraction,
  rendering)?
- Which checks in table 5.3 can run **before** accept?
- How long from a real PPTX/PDF existing to a new degradation being recorded (AC-19)?
- How many checks move from rubric to objective thanks to data the candidate exposes?

## 7. When to test

| Phase | Testing activity | Output | Dependency |
|---|---|---|---|
| W-032 (now) | Select REQs, define checks and evaluation modes, apply the D-028 ladder, state testability needs; start KCI, rubric v0, corpus | DOC-008 draft; findings in section 10 | — |
| W-033, W-034 | Answer check and observability questions per mechanism/candidate | Testability notes for DOC-009 | — |
| W-035 | Testability input to the trade-off (section 6.3) | Testability comparison | — |
| W-036 | Add verification boundaries, test types per boundary, integration concerns, failure/recovery, preview/export consistency | DOC-008 baseline | **[A]** |
| Detailed Design (after SP-002) | Tests for contracts between components; concrete failure points | Final Testing Plan | **[D]** |
| Implementation | Authors write module tests; someone else verifies (section 9); contract tests at seams | Test results, Bugs | **[D]** |
| Core-flow slice | Suites P1 → P2 → P3 → P5, then reliability and security; measure candidate criteria; spikes on oracles (extracting PPTX/PDF content, overflow detection, judge calibration) | Evidence per critical behavior; evidence for RG-1 … RG-7 | **[D]** |
| V1 acceptance | Evidence for §16; R-029 usability sessions; exploratory sessions; L-001, L-002 observations | Acceptance evidence; sign-off by a non-implementer | **[D]** |
| From implementation on | Regression on every prompt, model, or exporter change | Trend | **[D]** |

Spike evidence is labelled as spike evidence and never counts toward acceptance.

## 8. Input artifacts

| Artifact | Used for | Status | Dependency |
|---|---|---|---|
| Requirements, Decisions D-017, D-024 … D-028, A-005 | Test basis | In Project Hub | — |
| DOC-004 | Check → AC mapping; observability | Draft, merged to `main` (PR #5) | — |
| DOC-002 | Scope, §16 acceptance, §17 testing handoff | Available (PDF, outside the repo) | — |
| Source corpus for the 5 D-024 source types: pasted text, TXT/Markdown, PDF with a text layer, DOCX, PPTX as content source; one source per deck; plus a case with embedded images to confirm images are not reused | P1, P5, R-043 | To build — no longer blocked | — |
| KCI for each corpus case | R-007, R-025, R-028, RG-5 | To build; definition awaiting Duy (F2) | — |
| Source-gap and attribution cases | R-007 (R-008) | To build | — |
| Multi-turn constraint scripts with the expected constraint set per turn | R-001, R-024 | To build; only unambiguous cases act as gates (F9) | — |
| Refinement request set covering the 7 D-025 types, plus slide-targeted cases | R-024, R-031, P1 after refinement | To build. Slide-targeted cases only check that the limitation is disclosed, not locality | — |
| Rubric v0 for HM-1 … HM-4, R-009, R-025 meaning, R-028 visuals; calibration set | R-021, R-009, R-025, R-028 | To build — owned by Testing | — |
| Injection payloads and canary values | R-042, R-043 | To build | — |
| Fault catalogue: external error types (timeout, error, malformed response) | R-032 | To build | — |
| Fault catalogue: failure points inside the system | R-031 | Awaiting the Architecture | **[A]** |
| List of flows allowed to carry user content outward | R-042 | Awaiting the Architecture | **[A]** |
| Degradation log from real artifacts | R-026, R-027 | Built from evidence, not written up front (AC-19) | **[D]** |
| Application(s) used as "usable" evidence for PPTX/PDF | R-027 | Awaiting decision (F8) | **[D]** |

## 9. Independent verification

Principle (OR-022): **where feasible, the person who implements a module is not the only person who
verifies it.** Specific reviewers are assigned only once module boundaries actually exist **[A]**;
the table below pairs roles, not names.

| Area | Independently verified by |
|---|---|
| Generation and refinement | Someone who did not write the generation prompt writes the KCI and multi-turn scripts, and owns the P1, P2 suites |
| Validation (R-033) | Someone other than the implementer writes the invalid-candidate injection tests |
| PPTX, PDF export | Someone other than the export implementer writes the P5 checker and R-027 checks |
| Preview (R-028) | The owner of the P5 checker |
| State and recovery (R-031, R-032) | Someone other than the state implementer writes the fault-injection suite |
| Source intake and security (R-042, R-043) | Someone other than the input implementer writes the injection and canary suites |
| Rubric grading | At least two raters; none is the author of the prompt being graded |
| LLM judge | Only after calibration against human raters; different model + prompt configuration from the generator |
| V1 acceptance (§16) | Signed off by someone who did not implement the modules of that critical behavior |

In a small team, rotate: whoever verifies module X implements module Y. Authors still write their
own unit tests — independence **adds** a verifier; it does not remove the author's responsibility.

## 10. Findings from reviewing the test basis

Reported only; Project Hub remains the source of truth and is not changed by this document.

- **F1** — R-008 (source gap, the other half of P1 per BR-002, and listed in D-024) is not among
  W-032's primary Requirements. DOC-008 covers it inside the R-007 suite. Duy to confirm or add it
  to W-032.
- **F2** — "Important" is not defined in the Acceptance Notes of R-007, R-025, R-028. The KCI
  (section 2.4) is the proposed shared definition.
- **F3** — R-025 Notes mention "PF-03", but that code is not defined in any Project Hub sheet or in
  the repository. It should point to its definition or be removed.
- **F4** — BR-006 (export from the accepted state, no silent regeneration) is `Proposed`, while
  R-020 with the same content is `Active` / V1 and AC-05 is a Gate.
- **F5** — The active constraint set is not among the D-028 or DOC-004 observability needs. R-001
  is then only indirectly testable via R-024 (TN-1).
- **F6** — AC-10 requires validation to be possible, not its outcome to be observable. Testing
  R-033 needs to know that validation ran and what it concluded (TN-2).
- **F7** — Use Case traceability: UC-001's failure flow does not link R-031, R-032, R-033; UC-002's
  main flow does not link R-024, R-031, R-032, R-033; UC-008 links R-039 (`Proposed` / Product),
  which is not treated as a V1 gate; UC-006 (V1 Partial) has R-019 as its only V1 Requirement.
- **F8** — R-027 says "usable in the workflow verified by V1", but the application used as evidence
  has not been chosen (D-026 defers it deliberately). Not blocking for the Architecture; must be
  settled before V1 acceptance.
- **F9** — Constraint lifetime and conflicts remain open (A-013, DOC-002 OQ-04). P2 gates use only
  unambiguous cases: a stated constraint that is never changed must persist; a constraint changed
  by the user takes its new value. Conflict and expiry cases are exploratory and produce evidence
  for OQ-04.
- **F10** — R-021 assigns thresholds to W-032, while D-028 reopens "when W-032 has enough
  evidence". That evidence only exists once real artifacts exist (section 5.2), so P3 thresholds
  will not be available within SP-002. This follows correctly from D-028, but should be understood
  jointly so that W-032 is not treated as not Done for lacking thresholds.
- **F11** — R-030 has AC-20 in DOC-004 but is not part of W-032. DOC-008 only touches failure-cause
  reporting through R-032; long-running operation status is not verified here.

## 11. Research questions from deferred uncertainty

None of the questions below is a V1 gate. Testing collects evidence for later team decisions.

| Source | Question | Evidence collected | When |
|---|---|---|---|
| L-001 | Which source capability should open next? | In exploratory/usability sessions: record each time a user wants a source outside D-024 (scans, spreadsheets, images, URLs, multiple sources) and each time a deck is worse for lack of images | V1 demo, V1 acceptance |
| L-002 | Is whole-deck restyling, AI visuals, or stronger localized refinement needed? | Count restyle, visual, and slide-targeted requests; record cases where best-effort refinement was insufficient and the extra work the user had to do | V1 demo, usability sessions |
| A-013 / OQ-04 | Which constraints last how long, and how are conflicts resolved? | Results of the F9 exploratory cases | Core-flow slice |
| D-026 | How compatible is the PPTX across applications? | Degradation log per opening application (AC-19) | Once real artifacts exist |
| A-005 | Does focusing tests on critical behaviors catch the important failures? | Share of important bugs found **outside** the P1/P2/P3/P5 suites, mainly from exploratory sessions | From core-flow slice; reviewed at V1 acceptance |

A-005 is DOC-008's founding assumption: if many important failures surface only outside these
suites, A-005's Review Trigger fires and the approach must broaden coverage.

## 12. Architecture-dependent and deferred parts

**Added by W-036 after W-035 [A]:**

- verification boundaries per component of the Architecture baseline, and test types per boundary;
- placement of each check in table 5.3 within the chosen Architecture;
- concrete failure points for the R-031 fault catalogue;
- flows allowed to carry user content outward (R-042);
- how content origin, the constraint set, and validation outcomes are read (TN-1, TN-2), if the
  Architecture provides them;
- integration concerns between preview, PPTX, and PDF;
- reviewer assignment by module boundary (section 9).

**Deferred beyond SP-002 — final Testing Plan and Detailed Design [D]:**

- quantitative thresholds, pass rates, repetition counts, coverage targets;
- P3 thresholds for RG-1 … RG-7 (via reopening D-028);
- the R-032 timeout bound;
- tools, frameworks, environments, model pinning;
- test case and test procedure specifications;
- schedule and concrete assignments;
- the application(s) used as evidence for R-027 (F8).

## 13. Mapping to W-032 Done When

| W-032 Done When | Section |
|---|---|
| Scope of what to verify | §3, §4, §5 |
| Test timing | §7 |
| Inputs / outputs | §8 (inputs), §7 Output column |
| Evaluation method | §2.2, §4, §5 |
| Ownership guideline | §9 |
| Critical / architecture-relevant REQs prioritized | §3.1 |
| Architecture-dependent parts clearly marked | §1.2, **[A]**/**[D]** labels, §12 |
| D-028 threshold/severity gaps (Supporting Input) | §5.2 |
| L-001, L-002 turned into research/test questions (Supporting Input) | §11 |
