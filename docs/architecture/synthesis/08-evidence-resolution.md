# Pre-W-035 Evidence Resolution

Status: **ACCEPTED / FROZEN** (Phase 8). Pre-selection evidence pass. It selects, ranks and
recommends nothing. Phases 0–6 stay frozen; every change of outcome is recorded here as a delta.

Phase naming used here:

- Phase 5 — formal Gate / Observability assessment;
- Phase 6 — trade-off comparison;
- Phase 8 — uncertainty / evidence resolution (this file);
- Phase 7 — W-035 baseline architecture selection.

Phase 7 may consume, and revisit where evidence changed, the Phase 6 comparisons. Assessment,
comparison and baseline selection all remain part of the W-035 workflow.

**Revision 3 — final cleanup before freeze.** Two changes, and nothing else:

- the "at least two candidates" rule is relabelled as the Phase-8 process guardrail
  P8-GUARDRAIL-01, rather than attributed to DOC-004;
- Phase 7 is named as W-035 baseline architecture selection.

No evidence, outcome, disposition, classification or readiness result changed.

**Revision 2 — methodology correction.** Revision 1 treated every unresolved empirical item as
making a candidate "not eligible". Revision 2 re-derives the W-035 entry contract from source
precedence (§1.2). It separates Product blockers, Gate evidence required before a recommendation,
explicit architecture assumptions, and deferred validation debt.

All executed evidence is unchanged: S1 remains a contract fail, and S1b and S2 remain as recorded
(§7, §8). So are the raw findings, the predeclared contracts, the Product source analysis and the
reopen conditions.

## 1. Boundary and method

### 1.1 Progressive convergence

The goal of W-035 is not to prove an architecture correct before implementation. The goal is to
choose the best-supported baseline under current Product truth, constraints, research and evidence,
and to make every residual assumption, validation debt and reopen condition explicit. After the
baseline is chosen, the architecture converges through a feedback loop:

```
baseline → implementation evidence → validate assumption → keep baseline | fire reopen condition
```

This pass therefore distinguishes two kinds of evidence:

- **Selection evidence:** evidence that must exist before a candidate may be compared or
  recommended, because an authoritative source requires it (§1.2).
- **Validation debt:** empirical questions carried into the baseline as explicit assumptions, each
  with a validation point and a reopen consequence (§21).

The absence of an implementation is never, by itself, a reason to exclude a candidate.

**Order followed:**

1. Rebuild the blocker graph (§3).
2. Resolve Product semantics from authoritative text only (§4).
3. Recompute which spikes remain decisive (§5).
4. Predeclare a contract, then run, each spike that was unconditionally decisive and executable
   (§6–§11).
5. Re-derive the W-035 entry contract (§1.2), then record readiness (§17–§22).

**Sources:**

- Authoritative for Product meaning: `.project-hub/snapshot` and DOC-004.
- Supporting interpretation only: DOC-008.
- Evidence of what DeckAgent can build, never of Product semantics: reference research.
- DOC-005 contains no rule on evidence maturity; it only places comparative judgment in
  W-033 … W-035.

**Evidence record:** raw spike artifacts (each spike's predeclared `PROTOCOL*.md`, its scripts,
the inputs, raw outputs and `results*.json`) were produced during architecture synthesis and
remain local-only; they are not part of the committed repository. This file preserves each
spike's protocol, observed result, interpretation, limitations and architecture disposition.
Artifact names cited below refer to that local record.

**Environment of executed spikes:** Windows 11 (10.0.26300); Python 3.13.13; Node 22.19.0;
LibreOffice 26.2.5.2; Google Chrome 154.0.8037.59; python-pptx 1.0.2; PyMuPDF 1.27.2.3. PowerPoint
is not installed.

### 1.2 Source precedence for pre-W-035 prerequisites

**What the authoritative sources require before W-035:**

| Source | Text | What it requires before W-035 |
|---|---|---|
| DOC-004 §5 | "`Not yet assessable` … is acceptable during investigation, but before W-035 **recommends** a candidate as the architecture baseline, that evidence must be obtained; otherwise the candidate is treated as not meeting the criterion." | Every Gate and Observability outcome of the candidate being **recommended** must be decided. This applies at recommendation, not at comparison |
| DOC-004 §5 | "Every assessment cites evidence: a DOC-006/DOC-007 finding, a candidate description in DOC-009, spike or prototype results, or **explicit reasoning labelled as such**." | Labelled reasoning is admissible evidence. A spike is required only where reasoning cannot decide the outcome |
| DOC-004 §1, §3.1 | Criteria "never let a candidate choose" Product meaning; W-034 states "how the candidate would accommodate each plausible answer" | A candidate whose defining decision depends on an unanswered Product question cannot be assessed as if the answer were known |
| DOC-004 §2, §3.1 | W-035: "Candidates are assessed (§5) and compared; the baseline is chosen" | Assessment and comparison precede the baseline choice within W-035. DOC-004 states no minimum number of candidates; the minimum used in this file is the Phase-8 guardrail P8-GUARDRAIL-01 (§1.3), not a DOC-004 requirement |
| DOC-004 AC-19 | "D-026 defers cross-application compatibility to evidence from real artifacts." *Does not require:* "A compatibility target application (none is baselined …)" | Architecture must make degradation discoverable, not prove per-application fidelity |
| D-026 point 3, rationale 2 | Per-application PPTX compatibility "được học từ implementation và Testing, không chốt trước Architecture" (is learned from implementation and Testing, not fixed before Architecture); "Không biến PowerPoint, Google Slides, LibreOffice hoặc Keynote thành điều kiện bắt buộc trước khi có file thật để test" (do not make PowerPoint, Google Slides, LibreOffice or Keynote a mandatory condition before real files exist to test) | Per-application fidelity is explicitly deferred past Architecture |
| R-028 AC1 and note 1 | "… trong phạm vi đã kiểm chứng" (within the verified scope); "Kiến trúc phải cho quan sát được bố cục và file tải về để W-032 kiểm chứng" (the architecture must make layout and the downloaded file observable so that W-032 can verify them) | The architecture's R-028 duty is observability (AC-14, AC-19); verification is W-032's |

**Rules derived from the sources above.** They are applied in every later section.

- **SR-1 (DOC-004 §5).** A Gate or Observability outcome must be `Meets` for any candidate W-035
  recommends. `Not yet assessable` blocks recommendation. It does not block comparison.
- **SR-2 (DOC-004 §5).** Labelled reasoning may decide an outcome when the property depends only
  on DeckAgent-owned structure: ownership, ordering, data flow, placement. Phase 5 already did this
  for most `Meets` outcomes. For example, A's and C's AC-01 are `Meets` although no writer or
  converter exists.
- **SR-3 (DOC-004 §5, as applied in 06).** When an outcome depends on the behaviour of a component
  the candidate does not own, or on empirical correspondence between an owned computation and real
  output, reasoning cannot decide it. A demonstration is required before recommendation. Phase 5's
  judgments of this kind are kept (AG-01a and C's AG-01b as correctness questions for AC-10;
  AG-P4-01 for C's AC-02 and AC-11).
- **SR-4 (DOC-004 §1, §3.1).** An unanswered Product question that can change a candidate-defining
  decision blocks that candidate from comparison. A question that only decides how a Gate outcome
  closes blocks recommendation, not comparison.
- **SR-5 (D-026, AC-19, R-028; DOC-004 §5 read with 06 §4).** Evidence that decides no AC outcome
  is not required before W-035 unless an authoritative source says so. None does for AG-02. Such
  evidence becomes validation debt at the earliest point its failure consequence justifies.

**Claimed prerequisites checked against these rules:**

| Claimed pre-W-035 prerequisite | Where claimed | A. Authoritative? | B. Introduced by synthesis? | C. Deferred by authority? | Disposition |
|---|---|---|---|---|---|
| AG-02, all candidates | 05 §4–§6 ("before W-035"); 06 §12, §13; 08 rev 1 §11 | No: it decides no AC outcome (06 §4 AC-05) | Yes (Phase 4 viability rule) | Partly: the per-application part is deferred (D-026, AC-19) | **ER-PROCESS-CORRECTION-01** |
| PA-13 before W-035 | 08 rev 1 §4 | No | Yes (08 rev 1) | Yes (D-026 rationale 2; AC-19) | **ER-PROCESS-CORRECTION-02** |
| AG-09 by spike before W-035 | 05 §4, §5; 06 §4 AC-30 | SR-1 requires AC-30 decided | The spike form was introduced by synthesis | No | **ER-PROCESS-CORRECTION-03**: decidable by labelled reasoning (SR-2); conformance becomes debt |
| AG-P4-01 needs runtime identity | 08 rev 1 §9 | — | Yes (08 rev 1) | — | **ER-PROCESS-CORRECTION-04**: identity is Detailed Design; the Gate evidence requirement stays (SR-3) |
| "Not eligible — unresolved evidence" | 08 rev 1 §17, §19 | SR-1 applies at recommendation only | Yes (08 rev 1) | — | **ER-PROCESS-CORRECTION-05**: two-dimensional readiness (§17, §19) |
| AG-01b for B | 05 §5; 06 §4, §5 | SR-3 (external renderer existence) | — | No | Kept; already resolved (S1b) |
| AG-01a, AG-01b-A, AG-01b-C | 06 §4 AC-10 | SR-3 (Phase 5 correctness judgment) | — | No | Kept; conditional on PA-04 |
| AG-P5-01 | 06 §11 | SR-3 (AC-03) | — | No | Kept; conditional on SA-P3-02 |

**The five process corrections**

- **ER-PROCESS-CORRECTION-01 — AG-02 timing.** 05 made AG-02 a "before W-035" viability spike.
  Under SR-5 and D-026 that timing is not authoritative. AG-02 is split into:
  - **AG-02a**, representation reachability. It is application-independent and becomes an explicit
    assumption.
  - **AG-02b**, per-application fidelity. It is deferred to implementation and Testing.

  Every frozen AG-02 reopen condition stands unchanged as a baseline reopen trigger (§11). 05 is
  not edited.
- **ER-PROCESS-CORRECTION-02 — PA-13.** Reclassified from a pre-W-035 Product decision to a
  deferred validation semantic (§4).
- **ER-PROCESS-CORRECTION-03 — AG-09.** "Is the mirror guaranteed current" (06 §4) asks for a
  design guarantee over DeckAgent-owned ordering. A guarantee is established by reasoning over
  that ordering; tests can only fail to falsify it. AG-09 is therefore split into:
  - architectural feasibility, decided here by labelled reasoning plus S2 (§8);
  - protocol conformance, which becomes validation debt.

  This does **not** extend to AG-01a or C's AG-01b. Those concern empirical correspondence (SR-3),
  and Phase 5's judgment is kept.
- **ER-PROCESS-CORRECTION-04 — AG-P4-01 prerequisite.** Revision 1 said the runtime identity was
  missing. The frozen X-5 decision is the confinement contract over a runtime *class* (05 §6;
  04 ADB-DEP-02: "a coding-agent CLI or similar"), so identity is Detailed Design. The Gate
  evidence remains required for C (SR-3; 06 §4 AC-02, AC-11). It can be produced now by an
  existence demonstration on any representative runtime of the class, which selects none.
- **ER-PROCESS-CORRECTION-05 — readiness semantics.** The one-dimensional "eligible" test is
  replaced by two dimensions (§17, §19):
  - selection readiness: Selection-ready, Product-blocked, Structurally blocked, or Candidate
    revision required;
  - validation maturity: Reasoning-supported, Externally evidenced, Empirically validated, or
    Implementation-validated.

  SR-1's recommendation requirement is kept separately, in the Phase 7 contract (§22).

### 1.3 Phase-8 process guardrail

This is a synthesis rule local to Phase 8. It is **not** text required by DOC-004 or any other
authoritative source. DOC-004 §2 establishes only that W-035 assesses and compares candidates
before choosing a baseline; this guardrail is derived to keep that comparison meaningful.

**P8-GUARDRAIL-01 — Meaningful baseline-selection comparison**

> Do not begin baseline selection when fewer than two materially distinct candidates are
> selection-ready, unless an explicit owner decision records that the blocked alternatives are
> intentionally excluded from consideration.

Purpose:

- stop a Product-blocked candidate from being silently eliminated merely because another candidate
  becomes ready first;
- preserve the intent of comparing materially distinct architectures;
- make exclusion an explicit decision, rather than an accidental consequence of the order in which
  questions are resolved.

## 2. Frozen input check

- **Files and hash prefixes** (sha256, first 16 hex). They were taken at the start of revision 1
  and re-checked after revision 2; all are unchanged:

  | File | Hash prefix |
  |---|---|
  | 01 | `e9b64ac005cd885a` |
  | 02 | `bc5a1e134fb4e7c2` |
  | 03 | `6055cd7c8dbc6d77` |
  | 04 | `0ad50991f9002f73` |
  | 05 | `eda1d9a90f471944` |
  | 06 | `cb77696f3e53833a` |
  | 07 | `773a397796444aee` |

  These prefixes are a historical record of the synthesis-time freeze check, not a current
  integrity assertion. The files were later normalized for repository location; Git history is
  the integrity record for the finalized artifacts.
- **The Phase 6 state matches 07 §19 and 06 §13.** Specifically:
  - no Gate is `Does not meet`;
  - SA-P4-01 is closed;
  - P5-TENSION-01 is a reopen trigger only;
  - AC-05 is `Meets` for A, B and C.
- **Candidate configurations used:** 05 §4 (A), §5 (B), §6 (C) with GC-P4-01. No fallback branch is
  used anywhere in this pass.
- **Mismatch found: none.**

## 3. Blocker dependency graph and pre-selection classification

Kinds:

- **G** = Gate blocker;
- **O** = Observability blocker;
- **V** = candidate-viability evidence outside a Gate;
- **T** = trade-off-only evidence;
- **R** = reopen trigger.

The **Blocks** column separates two effects:

- **comparison entry:** the candidate cannot enter Phase 7 — W-035 baseline architecture
  selection (SR-4);
- **recommendation:** the candidate can be compared but not recommended while the item is open
  (SR-1).

Classification follows the five tests in the task:

1. Can the item change a candidate-defining decision?
2. Is it Product-owned?
3. Do the authoritative sources expect the knowledge before Architecture?
4. How reversible is a later failure?
5. Does a known fallback exist?

It never depends on whether code exists today.

| Item | Candidate | Current kind | Pre-selection class | Blocks | Why | Validation phase | Reopen consequence |
|---|---|---|---|---|---|---|---|
| PA-04 | B | G (AC-06, AC-10) | Must resolve before selection | Comparison entry | G or R changes X-4, which is defining (05 §5; 04 E-14, E-15). Product-owned (R-033 note 1) | Product | B: X-4 → MB-08 P revision |
| PA-04 | A, C | G (AC-10) | Must resolve before selection | Recommendation | Both accommodate every answer without restructuring (05 §4, §6 tables). The answer decides how AC-10 closes: N → met (06 §4); G or R → a spike is decisive | Product | A: none. C: via AG-01b-C |
| SA-P3-02 | A | G (AC-03) | Must resolve before selection | Comparison entry | "Keeps origin" changes X-6, which is defining (05 §4; 04 E-41) | Product | A: X-6 → Variant M revision |
| SA-P3-02 | B, C | G (AC-03) | Must resolve before selection | Recommendation | Both accommodate both answers (05 §5, §6). "Relabel" → AC-03 closes by reasoning (06 §11); "keeps" → AG-P5-01 is decisive. A passing AG-P5-01 would close AC-03 under either answer | Product | Via AG-P5-01 |
| SA-P3-01 | C | G (AC-28, AC-30) | Must resolve before selection | Comparison entry | "Shared" relocates C's defining page-held authority; "not allowed" adds a mechanism (05 §6) | Product | C: restructuring or an added mechanism |
| SA-P3-01 | A, B | — | Not a blocker | — | Accommodated (05 §4, §5) | — | — |
| PA-13 | A, B, C | V (AG-02 comparator) | Deferred empirical validation | Nothing | Deferred by D-026 and AC-19 (§4) | Testing (W-032 / Final Testing Plan) | None by itself |
| AG-01a | A | G (AC-10), only under PA-04 G | Must resolve before selection, conditional | Recommendation | Empirical correspondence (SR-3; 06 §4: "a correctness question") | After PA-04; before A is recommended | X-4 geometry source → OBS-02 (medium; "materially less attractive") |
| AG-01b-A | A | G (AC-10), only under PA-04 R | Must resolve before selection, conditional | Recommendation | A rendered check on the admission path (06 §4) | After PA-04; before A is recommended | "Materially less attractive" (05 §4) |
| AG-01b-B | B | G + O | Resolved (S1b) | — | External renderer existence (SR-3); demonstrated | Residual → debt VD-09 | B: invalid if the render path later fails AC-18 |
| AG-01b-C | C | G (AC-10), only under PA-04 G or R | Must resolve before selection, conditional | Recommendation | Offscreen-vs-displayed correspondence (SR-3; 06 §4: "reliability decides whether a selected geometry check is actually possible") | After PA-04; before C is recommended. Executable now | C: X-4 restructuring (05 §6) |
| AG-09, platform part | A, B | G (AC-30) | Resolved (S2) | — | Only the in-page mirror path exists | — | — |
| AG-09, feasibility | A, B | G (AC-30) | Resolved by labelled reasoning (§8) | — | A design guarantee over owned ordering (SR-2) | — | — |
| AG-09, conformance | A, B | — | Deferred empirical validation | Nothing | Implementation conformance to ASM-SESSION-01 | Integration | AC-30 reopens; local SESSION-02 redesign (high reversibility) |
| AG-P4-01 | C | G (AC-02, AC-11) | Must resolve before selection | Recommendation | An external runtime's behaviour (SR-3; 06 §4). Identity is Detailed Design | Now: existence demonstration; then conformance of the chosen runtime (VD-10) | C: X-5 → DEP-01 (medium; rest unchanged) |
| AG-P5-01 | B, C (and A after its revision) | G (AC-03), only under SA-P3-02 "keeps" | Must resolve before selection, conditional | Recommendation | Empirical verifier behaviour (SR-3) | After SA-P3-02; before recommendation | Architecture review of X-6 for all candidates (§10) |
| AG-02a, reachability | A, B, C | V | May remain explicit assumption | Nothing | Decides no AC outcome (SR-5). Candidate-invalidating with low reversibility, so it is validated at the earliest post-selection point | Before implementation planning | A: invalid or narrow the model (X-3). B, C: invalid, no branch within X-3 |
| AG-02b, per-application fidelity | A, B, C | V | Deferred empirical validation | Nothing | D-026 point 3; AC-19; R-028 note 1 | Testing, after PA-13 | The same frozen X-3 conditions, if the Core Flow cannot meet R-028 |
| AG-03 | A, B, C | T | Trade-off only | Nothing | Cost after a stop; correctness is structural (AC-28) | Integration (optional) | None |
| AG-P6-01 | A, B, C | T | Trade-off only | Nothing | No team-capability record | Before W-035, if the team supplies it | None |
| P5-TENSION-01 | C | R | Reopen trigger only | Nothing | A Product change to R-045, UC-011 or BR-012 | — | SA-P4-01 reopens; C's AC-01 and AC-30 are re-assessed |

## 4. Product-semantic resolution

The source analysis is unchanged from revision 1. What changes is each item's blocking scope and
PA-13's category.

### PA-04

**Sources read:**

- R-033 AC1: a check per operation type before display.
- R-033 note 1: "Cách kiểm tra cụ thể chưa quyết định; kiến trúc phải làm bước này kiểm chứng được"
  (the specific checks are not decided; the architecture must make this step verifiable).
- R-021 AC1 and D-028: the hard minimum as a product property.
- UC-001 step 5, UC-002 step 6, UC-004 step 4.
- DOC-004 §2, AC-10 and §11: "Neither this document nor DOC-008 decides it."
- DOC-008 §5.3 and F15 (supporting only).

No snapshot item answers F15 or selects any runtime HM check.

**Disposition: `PRODUCT-DECISION-REQUIRED: PA-04`.**

**Question for Product:**

> For every generated or refined result, before it is displayed or becomes a pending or accepted
> version, which of these must DeckAgent itself check at runtime (as opposed to Testing verifying
> them only as test oracles)?
> (1) HM-1 unreadable or severely clipped text; (2) HM-3 broken or unintentionally empty slide;
> (3) HM-4 severe layout failure; (4) UC-002 step 6, source numbers match the document (F15).
> For HM-1 and HM-3, must detection be on the rendered output, or is post-layout geometry enough?

**Answer classes and their effects:**

| Answer class | A | B | C |
|---|---|---|---|
| **N:** no HM check at runtime, or only HM-3 "no content" | AC-10 met (06 §4) | Assumption holds; AC-06 and AC-10 re-assessed | AG-01b-C not decisive; AC-10 re-assessed |
| **G:** HM-1 or HM-4, geometry sufficient | AG-01a decisive for AC-10 | **CANDIDATE-REVISION-REQUIRED** (X-4 → MB-08 P) | AG-01b-C decisive |
| **R:** a check on rendered output | AG-01b-A decisive | **CANDIDATE-REVISION-REQUIRED** (as G) | AG-01b-C decisive |

**Blocking scope (verified against 05):**

- **B:** blocks comparison entry. 05 §5 records "Assumed: no HM-1 / HM-4 check before display";
  another answer restructures X-4.
- **A and C:** block recommendation only. 05 §4 and §6 record that PA-04 has no assumption and
  that another answer restructures neither.

### SA-P3-02

**Sources read:** R-007, R-008, BR-002 (rules 1–2 and exception 1), UC-002 postcondition 3, D-025,
R-008 note 1, A-015.

**Disposition: `PRODUCT-DECISION-REQUIRED: SA-P3-02`.** The text protects meaning, not wording;
both labellings are compatible with it, and mixed elements are unaddressed (04 NPC-11).

**Question for Product:**

> When a refinement (for example tone or audience, D-025) rephrases content that came from the
> source document while keeping its facts, numbers and meaning, is the result still shown as
> source-derived, or as AI-added? May a single element mix source-derived and AI-added content, and
> if so, how is it labelled?

**Effects by answer:**

| Answer | A | B, C |
|---|---|---|
| Relabel as AI-added | PROV-05 stays viable; AC-03 closes by reasoning | Strict textual verification; AC-03 closes by reasoning (06 §11) |
| Keeps source origin | **CANDIDATE-REVISION-REQUIRED** (X-6 → Variant M) | AG-P5-01 decisive for AC-03 |
| Mixed-origin elements allowed | Same revision as "keeps" | AG-P5-01 scope includes sub-element spans |

**Blocking scope (verified against 05):**

- **A:** blocks comparison entry. 05 §4 records "Candidate assumption … Yes — X-6 moves to
  Variant M"; E-41 is the conditioning edge.
- **B and C:** block recommendation only. 05 §5 and §6 record no assumption.

**SA-P3-02 is the only Product question on every candidate's recommendation path.**

### SA-P3-01

**Sources read:** D-027, BR-012, BR-014, R-045, UC-011, R-053, UC-019. No text addresses a second
view of one running application.

**Disposition: `PRODUCT-DECISION-REQUIRED: SA-P3-01`.**

**Question for Product:**

> If the user opens DeckAgent in a second browser tab or window while a session is running, is that
> view (1) the same session, showing and acting on the same deck; (2) a new, separate session; or
> (3) not allowed (refused, or told that a session is already open)?

**Effects by answer:**

| Answer | A, B | C |
|---|---|---|
| (2) Separate session | Accommodated | Assumption holds; AC-28 and AC-30 re-assessed |
| (3) Not allowed | Accommodated | **CANDIDATE-REVISION-REQUIRED**: an added cross-view mechanism |
| (1) Shared session | Accommodated | **CANDIDATE-REVISION-REQUIRED**: shared authority outside the page. This touches several defining properties → **architecture review before W-035** |

**Blocking scope (verified against 05):**

- **C:** blocks comparison entry. Page-held authority is C's distinguishing character: its title,
  and 05 §3's "authority location" row.
- **A and B:** not a blocker (05 §4, §5: "accommodates every answer").

It does **not** block W-035 globally.

### PA-13 — reclassified (ER-PROCESS-CORRECTION-02)

- **Sources:**
  - UC-008 OQ-1: which application verifies PPTX first (open).
  - DOC-008 F8: awaiting Product.
  - D-026 point 3 and rationale 2: per-application compatibility is learned from implementation and
    Testing and is not fixed before Architecture; no application is to be a mandatory condition
    before real files exist to test.
  - DOC-004 AC-19: "Does not require: A compatibility target application (none is baselined …)".
  - DOC-004 §11: cross-application compatibility is deliberately not an uncertainty for the
    candidates.
  - R-028 note 1: architecture makes the output observable; W-032 verifies.
- **Analysis.**
  - *Category 1* (selection-blocking) would need a source that makes the reference application an
    Architecture input. None exists, and D-026 says the opposite.
  - *Category 3* (a genuine conflict) would need two authoritative sources that cannot be
    reconciled. UC-008 OQ-1 being open and D-026 deferring the answer to implementation and Testing
    are consistent: the question is open *and* scheduled after Architecture.
- **Classification: Category 2 — deferred validation semantic.** Architecture proceeds under the
  AC-19 obligation: degradation must be discoverable from real artifacts for any reference
  application. Product or Testing sets the reference later, and AG-02b runs against it. No
  ER-TENSION-02 is needed.

## 5. Recomputed spike set

| Spike | Candidate | Still required? | Needed to choose, or to validate? | Status |
|---|---|---|---|---|
| AG-01a | A | Only under PA-04 G | Needed before **recommending** A (SR-3, AC-10) | Specified (§6) |
| AG-01b-B | B | Yes | Needed to choose (AC-01, AC-14, AC-18) | **Run; resolved (§7)** |
| AG-01b-C | C | Only under PA-04 G or R | Needed before **recommending** C (SR-3, AC-10) | Specified; executable now (§7) |
| AG-01b-A | A | Only under PA-04 R | Needed before **recommending** A | Specified (§7) |
| AG-09, platform | A, B | Yes | Needed to choose | **Run; resolved (§8)** |
| AG-09, conformance | A, B | Yes | To validate the assumption (integration) | Debt VD-05 |
| AG-P4-01 | C | Yes | Needed before **recommending** C (SR-3) | Specified; executable now (§9) |
| AG-P5-01 | B, C (and A after its revision) | Only under SA-P3-02 "keeps" | Needed before **recommending** B or C | Specified (§10) |
| AG-02a | A, B, C | Yes | To validate the assumption (before implementation planning) | Debt VD-01 … 03 |
| AG-02b | A, B, C | Yes | To validate the assumption (Testing, after PA-13) | Debt VD-04 |
| AG-03 | A, B, C | No | Trade-off | Open |

## 6. AG-01a

- **Status:** `Product decision required` (PA-04). Not run.
- **Pre-selection class:** under PA-04 G, AG-01a must resolve before A is **recommended** (SR-3;
  06 §4 treats it as a correctness question). It needs a prototype of A's layout computation.
  Phase 7 must record that cost if it considers A under PA-04 G.

**Executable specification, used only under PA-04 = G:**

- **Question:** does A's computed post-layout geometry detect the HM-1 / HM-4 failure cases that the
  selected checks target, as they appear in the real outputs?
- **Candidate decision:** A's OBS-01 geometry in the stage-2 gate (MB-08 P, renderer-free).
- **Hypothesis:** over a labelled case set, computed-geometry verdicts of overflow, clipping,
  overlap and out-of-bounds agree with the verdicts read from the real outputs. There is no case
  where computed geometry says "fits" and the output shows the selected failure.
- **Comparison target:** A's preview render (OBS-04) for the displayed form. PPTX correspondence
  in a reference application is AG-02b (D-026).
- **Case set:** text-fit boundary cases (±1 line, ±5% width), long unbroken words, Vietnamese
  diacritic line heights, bullets and tables, font fallback, overlapping shapes, shapes near slide
  edges.
- **Pass:** zero false "fits" on the selected failure types; every disagreement is explained by a
  known format loss (NPC-12).
- **Fail:** any unexplained false "fits".
- **Artifacts:** case decks, computed-geometry dumps, render geometry dumps (S1's `read_pdf` method
  can be reused), and a diff table.
- **Scope guardrail:** not general output fidelity; no latency; no check selection.
- **Consequence:**
  - Pass: A's AC-10 is re-assessed.
  - Fail: A's frozen "materially less attractive" condition fires. X-4's geometry source moves to
    OBS-02 via OBS-04, which is within A's own X-4 bundle (05 §4) and medium reversibility.

## 7. AG-01b

### Candidate B — executed (S1, S1b); evidence unchanged

- **Question** (06 §4 AC-01): can a local headless render of a produced PPTX supply preview
  images, a whole-deck rendered view, preview geometry and the PDF?
- **Predeclared contract:** the S1 `PROTOCOL.md` (P1–P6; local-only, §1).
- **Instrument:** LibreOffice 26.2.5.2 headless as the experimental local renderer (not a
  selection); python-pptx as a stand-in producer of native PPTX objects (not B's serializer); and
  PyMuPDF.

**S1 result: contract FAIL, on P4 only.**

| Deck | P1 | P2 | P3 | P4 | P5 | P6 | Conversion time, 5 runs (s) |
|---|---|---|---|---|---|---|---|
| d1-basic (10 slides) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 15.42 (first, cold profile) · 2.28 · 2.83 · 2.55 · 2.22 |
| d2-vi (6) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2.37 · 2.61 · 2.92 · 3.44 · 2.69 |
| d3-edge (4) | ✓ | ✓ | ✓ | **✗** | ✓ | ✓ | 2.97 · 2.63 · 3.03 · 3.79 · 3.77 |
| d4-table (3) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2.97 · 3.29 · 3.98 · 2.94 · 3.48 |
| d5-long (30) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3.96 · 2.96 · 2.65 · 5.18 · 5.46 |

- **The P4 failure** (`results.json`, `missing_text`): overflow lines 11–15 and the out-of-bounds
  marker are absent from the page text. The renderer clips at the slide boundary.
- **The geometry still exposed both failures:**
  - text max y 557.07 pt, against a text-box bottom of 180 pt and a page height of 540 pt;
  - text max x 965.91 pt, against a page width of 959.98 pt.
- **Reading.** P4 required a slide render to contain off-slide text; that is a defect in the
  predeclared criterion. S1 stays a **contract fail**, and it is not re-scored.

**S1b: a separate run on fresh decks, with a corrected contract disclosed as written after S1**
(`PROTOCOL-S1b.md`). P4 is split:

- P4a: all in-slide text is present on its page;
- P4b: every overflow or edge case is exposed, by a crossing line or by text absent from the page.
  This includes a text box flush with the slide bottom.

**S1b result: PASS.**

| Deck | P1 | P2 | P3 | P4a | P4b | P5 | P6 | Conversion time, 5 runs (s) |
|---|---|---|---|---|---|---|---|---|
| e1-mixed (8, tables, Vietnamese) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2.96 · 2.72 · 2.34 · 2.88 · 3.31 |
| e2-edge (4) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2.88 · 2.50 · 3.12 · 2.89 · 2.99 |
| e3-long (40, Vietnamese) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3.63 · 2.98 · 2.24 · 1.88 · 2.25 |

Edge exposure in e2:

- (a) inner overflow: 18 crossing lines, 1 string absent;
- (b) flush-bottom overflow: 1 crossing line, 5 strings absent;
- (c) left-edge crossing: 1 crossing line, 1 string absent.

The images were spot-checked; Vietnamese diacritics are intact. The fonts were Calibri and
ArialMT.

**Findings:**

1. The render capability B depends on (per-slide images, whole deck, per-line geometry, PDF) is
   demonstrated locally, headless and deterministically on the tested environment.
2. The render is slide-bounded. Off-slide content is detectable only by edge-crossing geometry or
   by text missing from the page; both signals are available.
3. Measured cost: a fresh renderer process per conversion of about 1.9–5.5 s, with one 15.4 s cold
   start. This is trade-off evidence; no threshold is applied (C-007, D-011).

**Frozen reopen condition check.** The S1 fail does not show that the path "cannot meet R-028 /
AC-18": the clipping is identical in the preview and the PDF, and the whole deck remains viewable.
The condition does **not** fire.

**Scope not established:**

- reference-application fidelity (AG-02b);
- behaviour on DeckAgent-generated decks;
- concurrency and renderer crash recovery;
- renderer availability on user machines;
- the renderer choice.

These residuals are debt VD-09.

**Methodology review of B's AC-01, AC-14 and AC-18.** The review found no contradiction in DOC-004:

- AC-18 requires "a rendering path usable outside interactive preview" and "does not require a
  specific … renderer".
- AC-14 requires the geometry to be observable.

Both are demonstrated. **`Meets` is kept.**

**Status:** `Resolved — pass` (S1b), with S1 recorded as `Resolved — fail` (contract defect; reopen
condition not triggered).

### Candidate C — specified, not run

- **Status:** `Product decision required` (PA-04 G or R).
- **Pre-selection class:** under G or R, it must resolve before C is recommended (SR-3; 06 §4:
  "reliability decides whether a selected geometry check is actually possible"). It is executable
  now: no DeckAgent code is needed, because it tests the engine.
- **Question:** does a measurement taken on an offscreen render in the same browser engine report
  the same text boxes, overflow and clipping as the render the user sees?
- **Structural fact (no spike needed):** gate and preview use the same engine.
- **Hypothesis:** for the same payload, viewport, fonts and device pixel ratio, per-element boxes
  agree within 0.5 CSS px between the offscreen and the displayed render.
- **Pass:** agreement on the §6 case set, including a font that is still loading, a different
  viewport width, and zoom ≠ 100%.
- **Fail:** any disagreement that flips an overflow or clipping verdict → C's frozen condition
  "AG-01b fails and PA-04 requires pre-display geometry" → restructuring.
- **Artifacts:** an HTML case set, a CDP harness (S2's `run_s2.mjs` is reusable), and box dumps.
- **Scope guardrail:** not PPTX conversion; no latency threshold.

### Candidate A — specified, not run

- **Status:** `Product decision required` (PA-04 R).
- **Pre-selection class:** under R, it must resolve before A is recommended.
- **Question:** can A's shared headless render (OBS-04) run inside the operation lifetime and supply
  the rendered-check input before the success boundary, with a stop winning (C-02 / C-03)?
- **Pass:** input produced for every §6 case before admission, and a stop during rendering wins.
- **Fail:** A's frozen "materially less attractive" condition applies.

## 8. AG-09

### Platform part — executed (S2); evidence unchanged

- **Question (06 §4 AC-30, A and B):** at every interceptable session-ending action, is current
  session-loss state available to the decision?
- **New deck:** an in-app action. The page can ask the authority before showing its own
  confirmation, so the state is available (structural).
- **Reload, navigation, close:** S2, run under a predeclared contract
  (the S2 `PROTOCOL.md`; local-only, §1).

| Scenario | Reload | Navigate | Close | Host received |
|---|---|---|---|---|
| control (in-page `mirror.atRisk`) | dialog | dialog | dialog | — |
| sync-xhr to the local host | no dialog | no dialog | no dialog | beacon only: `NetworkError … Synchronous XHR in page dismissal` |
| async-fetch (documentation) | no dialog | — | — | `/authority` (too late to affect the decision) |

- **Outcome:** `path-ii-only` for all three triggers.
- **Finding.** In the tested Chrome, a leave interception cannot consult the out-of-page authority.
  For A and B, the SESSION-02 page-side mirror is **required** at reload, navigation and close.

### Architectural feasibility — decided by labelled reasoning (ER-PROCESS-CORRECTION-03)

The open question after S2 is whether A's and B's SESSION-02 can guarantee that the mirror is
current at interception. The frozen ADB-SESSION-02 states the requirement itself as its assumption:
"the mirror is updated before the user can trigger a leave action" (03). It is rated high
reversibility, and it is not a candidate-defining axis (05 §4 and §5: "SESSION-01 / SESSION-02
split — High").

**Reasoning (labelled).** A consistency mechanism exists in principle without restructuring A or
B. It requires only the ordering constraints below, recorded as **ASM-SESSION-01**.

1. **One ordered update stream.** Every authority change that can alter the verdict under any
   PA-02 reading produces a mirror update, in authority order. This is already the frozen behaviour:
   A pushes after each transition and export; B pushes after each processed command.
2. **Visibility coupling.** No version and no export outcome becomes visible or deliverable to the
   user except through the page applying the update that carries it. The mirror is therefore never
   behind the state the user can see or has downloaded.
3. **Atomic application.** Each update is applied within one page task. A leave handler runs in its
   own task, so under the platform's run-to-completion model it observes whole updates only. S2
   confirms that the handler reads in-page state synchronously.
4. **State not yet visible.** An admitted result in flight to the page may or may not count as "at
   risk". That is a PA-02 question, and either reading is implementable: for the counting reading,
   the authority pushes an "incoming result" marker before the admission takes effect.

**Conclusion.** The invariant holds under items 1–4: *at every interceptable leave, the page
evaluates the verdict from state that is current with respect to everything the user can see or
has downloaded, and, where PA-02 requires it, with respect to admitted results in flight.* That is
what AC-30 requires ("that state is available wherever such an action can be intercepted"; *does
not require* "a particular browser mechanism").

**What stays open.** Whether the implemented protocol conforms to ASM-SESSION-01 is **validation
debt VD-05**. It is not a pre-selection blocker, because a failure is a local SESSION-02 redesign
(high reversibility) and not an axis change.

**Not claimed:** that any implementation exists or has been tested beyond S2.

**Status:** platform part `Resolved — pass`; feasibility `Resolved — labelled reasoning`;
conformance `Deferred empirical validation`.

**C:** confidence only. S2's control shows that in-page state drives the warning. C's AC-30 stays
blocked on SA-P3-01.

## 9. AG-P4-01

- **Question in the task (Step 9):** does C's unnamed runtime make C structurally underspecified
  (A), or is runtime identity Detailed Design (B)?
- **Answer: B.** The frozen X-5 choice is "Ports + confined external agent runtime" (05 §3, §6).
  Its content is the confinement contract (05 §6 evidence-gap row; 06 §2). ADB-DEP-02 names only a
  class ("a coding-agent CLI or similar", 03). Any runtime that satisfies the contract realises the
  decision. C is therefore **not** structurally underspecified.
- **Gate consequence is unchanged (SR-3).** 06 §4 records that AC-02 and AC-11 for C depend on "a
  property of the selected runtime, which C's structure does not supply". An external component's
  behaviour cannot be established by reasoning. Under DOC-004 §5, C cannot be **recommended** while
  AC-02 and AC-11 are `Not yet assessable`.
- **Corrected prerequisite (ER-PROCESS-CORRECTION-04).** Revision 1's "prerequisite missing:
  runtime identity" is withdrawn. The Gate evidence is an **existence demonstration**: at least
  one representative runtime of the class satisfies contract items 1–3 and 6. It is run as S1 was:
  the runtime used is an instrument, not a selection. It is executable now and was not run in this
  patch.
- **Status:** `Evidence unavailable`; executable now. Pre-selection class: must resolve before C is
  recommended. Afterwards, the chosen runtime's conformance becomes debt VD-10.

**Executable specification** (items 4–5 hold by C's structure):

| # | Property | Probe | Pass | Fail |
|---|---|---|---|---|
| 1 | Text / data output only | Prompts request files, images or tool calls; capture every output channel | Only text or data on the declared channel | Any artifact on another channel |
| 2 | No tool or action authority | Tools disabled by configuration; prompts request shell, fetch, file read; monitor the process tree and network | No child process; no network call except to the declared provider endpoint; no file read outside the input | Any |
| 3 | No workspace or file writes | Empty, write-monitored directory (for example Process Monitor) | Zero undeclared writes (the runtime's own cache is listed) | Any undeclared write |
| 6 | Content flow inspectable | Proxy the provider traffic; compare with the declared flow (AG-05) | Every content byte sent is attributable to the declared input | Undeclared content |

- **Scope guardrail:** physical cancellation is AG-03; no model-quality assessment.
- **Consequence:**
  - Pass: C's AC-02 and AC-11 are re-assessed.
  - Fail on every runtime of the class tried: **CANDIDATE-REVISION-REQUIRED**. X-5 → DEP-01; the
    rest of C is unchanged (05 §6). The fallback is not used to produce a pass.

## 10. AG-P5-01

- **Status:** `Product decision required` (SA-P3-02). It is decisive only under "keeps source
  origin". Not run.
- **Pre-selection class:** under "keeps", it must resolve before B or C (and a revised A) is
  recommended (SR-3, AC-03).
- **Option recorded, not taken.** A pass obtained *before* the Product answer would close B's and
  C's AC-03 under both answers, and would remove SA-P3-02 from their recommendation path. A would
  still need the answer, because its X-6 depends on it.

**Executable specification:**

- **Question:** can PROV-06 verification keep valid paraphrases as source-derived, while no
  AI-invented or user-stated content passes as source-derived? B verifies against source items; C
  verifies against source text.
- **Case set:** faithful paraphrases (D-025 tone and audience rewrites); meaning-changing
  paraphrases (a number, polarity or scope changed); AI-invented facts; user-stated facts; and
  mixed elements if Product allows them. Labels come from two raters (DOC-008 §9).
- **Pass (both required):**
  1. valid paraphrases keep source origin at a rate Product accepts (a Final Testing Plan value);
  2. **zero** invented, user-stated or meaning-changed items verified as source-derived.
- **Fail:** any false "source-derived", or valid paraphrases systematically downgraded. The second
  failure is judged against Product's answer.
- **Scope guardrail:** not general model quality; no provider selection.
- **Consequence:**
  - Pass: AC-03 is re-assessed.
  - Fail under "keeps": no demonstrated X-6 option for any candidate, since Variant C is not viable
    under "keeps" → architecture review.

## 11. AG-02

AG-02 is candidate-viability evidence (R-028; the Phase 4 conditions). It is **not** AC-05, which
stays `Meets` for A, B and C.

### ER-TENSION-01 — disposition

| | Interpretation A — strict pre-selection validation | Interpretation B — deferred empirical validation |
|---|---|---|
| Authoritative support | None found. DOC-004 §5 requires evidence for AC outcomes; AG-02 decides none (06 §4 AC-05). R-028 does not set a pre-Architecture point | D-026 point 3 and rationale 2; DOC-004 AC-19 (why and "does not require"); DOC-004 §11 (cross-application compatibility not an uncertainty); R-028 AC1 ("within the verified scope") and note 1 (W-032 verifies) |
| Conflict with authority | Conflicts with D-026 rationale 2: it would make a reference application (PA-13) a mandatory condition before real files exist to test | None found |
| Effect on W-035 | Blocks every candidate until each candidate's writer or converter exists and PA-13 is fixed | W-035 may proceed with X-3 as an explicit assumption per candidate |
| Effect on convergence | Builds three output paths before choosing one; two are then discarded | Builds the chosen path first; its evidence feeds the feedback loop (§1.1) |
| Reversibility / risk | Lowest post-selection risk, at maximum pre-selection cost | A failure after selection reopens X-3, which is **low reversibility** in all three candidates (05). The risk is bounded by validating reachability before implementation planning (VD-01 … 03) and by carrying the frozen reopen conditions as baseline triggers |

**Disposition: Interpretation B, by source precedence** (ER-PROCESS-CORRECTION-01). It is not
chosen for convenience: Interpretation A has no authoritative support and conflicts with D-026.

The residual risk is real. X-3 is low reversibility, and for B and C an AG-02 failure leaves no
branch within X-3. Phase 7 must therefore weigh each candidate's AG-02a assumption as a
candidate-invalidating risk and **must not treat it as fact** (§22).

### The split

- **AG-02a — representation reachability.** It is application-independent. Can the candidate's
  content form be turned into a valid, native, editable PPTX (R-027: text, shapes and tables
  editable) and into a PDF, for the V1 content types, with content and order preserved (R-025)?
  This is checked by package validation and object inspection, so no reference application is
  needed. It is not deferred by D-026, and it is not required by DOC-004 before W-035. →
  **Explicit architecture assumption**, validated **before implementation planning**.
- **AG-02b — per-application fidelity.** Does the preview match the downloaded file as rendered by
  the reference application (R-028), with text fit agreeing (NPC-10)? It is deferred by D-026. →
  **Deferred empirical validation**, run in Testing after PA-13.

| Candidate | AG-02a assumption | Current basis | AG-02b | Frozen reopen condition (now a baseline trigger) |
|---|---|---|---|---|
| A | The neutral model can be written as native editable PPTX objects and as a PDF for V1 content types | Reasoning. External evidence from S1/S1b that native text boxes, bullets and tables can be written programmatically and render correctly | Deferred | Invalid, or X-3 restructured / the model narrowed |
| B | The PPTX-shaped model serializes one-to-one to native PPTX objects | S1/S1b: native objects written from a structured description render deterministically; preview–PDF agreement follows from the single render path | Deferred. Under a LibreOffice reference the preview is that application's render (tested version); otherwise it is converter fidelity | Invalid; no branch within X-3 |
| C | The web form can be converted to native editable PPTX objects at measured positions for V1 content types, within the NPC-12 capability model | Reasoning only (05 §6: measured geometry → native objects; capability model). PDF-from-render says nothing about PPTX | Deferred | Invalid; no branch within X-3; the screenshot fallback is excluded |

**The executable specification is unchanged from revision 1.**

- **AG-02a** checks package validity, the native object types present, editability of text,
  shapes and tables, and extracted content and order against the version.
- **AG-02b** adds the preview-versus-reference-render comparison once PA-13 is set.

## 12. Trade-off-only evidence

### AG-03

No provider invocation was run. It stays open as cost evidence:

- **A:** outstanding calls complete and are discarded.
- **B:** OP-03 terminates local worker work; provider-side consumption depends on AG-03.
- **C:** physical runtime termination is AG-03, not AG-P4-01.

It is not required for any Gate.

### AG-P6-01

`AG-P6-01 — unresolved trade-off evidence.` The snapshot has no team-capability record
(`actors.tsv` lists product actors only; C-002 gives no skill data).

W-035 would benefit from the team's experience with:

- owned text layout and rendering;
- process and channel design and worker lifecycles;
- browser rendering, DOM measurement and web → PPTX conversion;
- event-log and state modelling;
- PPTX writing, headless office rendering and headless browser automation libraries.

This is not a Gate blocker.

### Others

- **B converter cost (S1/S1b):** about 1.9–5.5 s per fresh-process conversion, with a 15.4 s cold
  start. This is AC-22 and AC-23 evidence.
- **A/B mirror necessity (S2):** SESSION-02 is required at dismissal. AC-25 therefore includes
  staleness and race tests for A and B.
- **RG-*:** confidence only.

## 13. Evidence results register

| ID | Status | Candidate | Finding | Evidence | Selection relevance | Validation phase | Consequence |
|---|---|---|---|---|---|---|---|
| PA-04 | Product decision required | A, B, C | Checks left open by Product text | R-033; DOC-004 §2, §11; F15 | B: comparison entry; A, C: recommendation | Product | §4 |
| SA-P3-02 | Product decision required | A, B, C | Meaning protected, wording not; mixed elements open | R-007, R-008, BR-002, D-025 | A: comparison entry; B, C: recommendation | Product | §4 |
| SA-P3-01 | Product decision required | C | Second view unaddressed | D-027, BR-012 | C: comparison entry | Product | §4 |
| PA-13 | Deferred validation semantic | A, B, C | Reference application deferred by authority | D-026; AC-19; UC-008 OQ-1 | None | Testing | AG-02b comparator |
| AG-01b-B (S1) | Resolved — fail | B | Contract fail on P4 (criterion defect) | `s1-ag01b-b/results.json` | Recorded; no reopen | — | None |
| AG-01b-B (S1b) | Resolved — pass | B | Render capability demonstrated | `results-s1b.json`, `png/`, `geometry/` | Closed B's AC-01, AC-14, AC-18 | Residual: VD-09 | B `Meets` kept |
| AG-01b-C | Product decision required | C | Decisive only under PA-04 G or R | — | C: recommendation (conditional) | Now, if needed | §7 |
| AG-01b-A | Product decision required | A | Decisive only under PA-04 R | — | A: recommendation (conditional) | After PA-04 | §7 |
| AG-01a | Product decision required | A | Decisive only under PA-04 G | — | A: recommendation (conditional) | After PA-04 | §6 |
| AG-09 platform (S2) | Resolved — pass | A, B | The mirror is the only path at dismissal | `s2-ag09-platform/results.json` | Closed the synchronous-query branch | — | SESSION-02 required |
| AG-09 feasibility | Resolved — labelled reasoning | A, B | ASM-SESSION-01 gives a consistency mechanism without restructuring | §8; 03 ADB-SESSION-02; S2 | Closed AC-30 for A, B | — | AC-30 `Meets` (§14, §15) |
| AG-09 conformance | Deferred empirical validation | A, B | Protocol not implemented | — | None | Integration | VD-05 |
| AG-P4-01 | Evidence unavailable (executable now) | C | Existence demonstration pending | 06 §4 | C: recommendation | Now | §9 |
| AG-P5-01 | Product decision required | B, C | Decisive only under "keeps" | — | B, C: recommendation (conditional) | After SA-P3-02, or proactively | §10 |
| AG-02a-A/B/C | Deferred empirical validation (explicit assumption) | A, B, C | Reachability not demonstrated | §11 | None (not an AC outcome) | Before implementation planning | VD-01 … 03 |
| AG-02b-A/B/C | Deferred empirical validation | A, B, C | Per-application fidelity deferred | D-026 | None | Testing, after PA-13 | VD-04 |
| AG-03 | Trade-off evidence only | A, B, C | Not measured | — | None | Optional | — |
| AG-P6-01 | Trade-off evidence only | A, B, C | No record | `actors.tsv`, C-002 | None | If supplied | — |
| ER-TENSION-01 | Resolved — process correction | A, B, C | Interpretation B | §11 | Removed AG-02 as a selection prerequisite | — | ER-PROCESS-CORRECTION-01 |
| SA-P4-01 | No longer decisive | C | Closed | 06 §2 | None | — | P5-TENSION-01 remains a trigger |

## 14. Candidate A deltas

### Frozen configuration

05 §4: STATE-03 values, CAS guards, DELIV-01, OBS-01 + OBS-04, DEP-01, PROV-05, SESSION-01 +
SESSION-02.

### Triggered reopen conditions

None has fired. Pending on Product: SA-P3-02 "keeps" or mixed elements (X-6).

### Required revision

None now. **Conditional:** `CANDIDATE-REVISION-REQUIRED` fires only if SA-P3-02 = "keeps source
origin".

| Field | Value |
|---|---|
| Axis | X-6 origin assignment |
| Frozen decision | PROV-05 by construction (MB-09 C) |
| Failed assumption | Rephrased source content is relabelled or not rephrased |
| Known branch | Variant M: PROV-06 + PROV-01 |
| Smallest revised configuration | A with X-6 = PROV-06; all other axes unchanged |
| Re-assessment then required | AC-03 (AG-P5-01 becomes decisive for A), AC-16; Phase 6 CH-5, the AC-24 provenance contrast, P-02 |

### Assessment deltas

| AC | Phase 5 | New outcome | Evidence |
|---|---|---|---|
| AC-30 | Not yet assessable (AG-09) | **Meets** | S2 (the mirror is the only path) plus labelled reasoning under ASM-SESSION-01 (§8; ER-PROCESS-CORRECTION-03). Conformance is VD-05 |

AC-03 and AC-10 are unchanged (`Not yet assessable`: SA-P3-02; PA-04 with AG-01a / AG-01b-A).

### Trade-off deltas

- **07 §15 AG-09 row and E-07:** "a pushed mirror or a synchronous query" → **a pushed mirror
  only**, carried under ASM-SESSION-01.
- **AC-25:** staleness and race tests are certain for A, not conditional.
- **E-04 (AG-02):** it stays evidence-sensitive, but it is now carried as the explicit assumption
  AG-02a-A rather than as a selection prerequisite.

## 15. Candidate B deltas

### Frozen configuration

05 §5: STATE-02, serialized channel, DELIV-02a, MB-08 D, DEP-03 + OP-03, PROV-06, SESSION-01 +
SESSION-02. Assumes PA-04 N.

### Triggered reopen conditions

None has fired: S1's fail does not trigger the condition (§7). Pending on Product: PA-04 G or R
(X-4).

### Required revision

None now. **Conditional:** `CANDIDATE-REVISION-REQUIRED` fires only if PA-04 = G or R.

| Field | Value |
|---|---|
| Axis | X-4 |
| Frozen decision | MB-08 D |
| Failed assumption | No HM-1 / HM-4 check before display |
| Known branch | MB-08 P with a PPTX render before admission |
| Smallest revised configuration | B with the S1b-type render inside the operation lifetime |
| Re-assessment then required | AC-06, AC-10, AC-28, AC-08; Phase 6 CH-2, AC-22, AC-25, P-01, the §7 lifecycle split |

### Assessment deltas

| AC | Phase 5 | New outcome | Evidence |
|---|---|---|---|
| AC-01 | Not yet assessable (AG-01b) | **Meets** (kept) | S1b |
| AC-14 | Not yet assessable (AG-01b) | **Meets** (kept) | S1b P5; S1 d3 and S1b e2 exposure |
| AC-18 | Not yet assessable (AG-01b) | **Meets** (kept) | S1b P1–P3 |
| AC-30 | Not yet assessable (AG-09) | **Meets** | S2 plus labelled reasoning under ASM-SESSION-01 (§8). Conformance is VD-05 |

AC-03, AC-06 and AC-10 are unchanged (`Not yet assessable`).

### Trade-off deltas

- **AC-22:** converter cost measured; converter availability established (E-03, availability
  part).
- **E-03, fidelity part:** carried as AG-02a-B and AG-02b.
- **VALID-06:** clipping detection combines edge-crossing geometry with text absence.
- **AG-09 row and E-07:** as A.

## 16. Candidate C deltas

### Frozen configuration

05 §6 with GC-P4-01: STATE-04, INTENT-02, REQ-02, DELIV-03 native, DELIV-04, OBS-02 / OBS-04,
DEP-02c, PROV-06, SESSION-01; page-held authority.

### Triggered reopen conditions

None has fired. Pending:

- SA-P3-01 (1) or (3);
- PA-04 G or R together with an AG-01b-C fail;
- an AG-P4-01 fail;
- P5-TENSION-01 (reopen trigger only).

### Required revision

None now. **Conditional:**

- If SA-P3-01 = (3): an added cross-view mechanism.
- If SA-P3-01 = (1): shared authority outside the page. This touches several defining properties
  → **architecture review before W-035**.
- If AG-P4-01 fails: X-5 → DEP-01.

### Assessment deltas

None. AC-02 and AC-11 stay `Not yet assessable` on AG-P4-01. Runtime identity is no longer a
prerequisite (ER-PROCESS-CORRECTION-04).

### Trade-off deltas

- **E-04 (AG-02):** carried as AG-02a-C, the least-evidenced reachability assumption (reasoning
  only).
- **E-05 (AG-P4-01):** the existence demonstration is executable now.

## 17. Selection readiness (supersedes revision 1's eligibility snapshot)

Two independent dimensions (ER-PROCESS-CORRECTION-05):

- **Selection readiness:** Selection-ready, Product-blocked, Structurally blocked, or Candidate
  revision required. It governs entry into **Phase 7 — W-035 baseline architecture selection**.
- **Recommendation**, governed separately by SR-1: every Gate and Observability outcome of the
  recommended candidate must be `Meets` (DOC-004 §5).

| Candidate | Product blockers (comparison entry) | Product items on the recommendation path | Structural blockers | Explicit architecture assumptions | Deferred validation debt | Revision currently required? | Selection readiness |
|---|---|---|---|---|---|---|---|
| A | **SA-P3-02** (X-6) | PA-04 (AC-10; AG-01a or AG-01b-A under G or R) | None | ASM-SESSION-01; AG-02a-A | VD-01, VD-04, VD-05 (+ VD-06, VD-07 per PA-04) | No (conditional on SA-P3-02) | **Product-blocked** |
| B | **PA-04** (X-4) | SA-P3-02 (AC-03; AG-P5-01 under "keeps") | None | ASM-SESSION-01; AG-02a-B | VD-02, VD-04, VD-05, VD-09 | No (conditional on PA-04) | **Product-blocked** |
| C | **SA-P3-01** (authority location) | SA-P3-02 (AC-03); PA-04 (AC-10 via AG-01b-C). Gate evidence: AG-P4-01 | None | Confinement-contract realisability (pending AG-P4-01); AG-02a-C | VD-03, VD-04, VD-08, VD-10 | No (conditional on SA-P3-01, AG-P4-01) | **Product-blocked** |

**Gate outcomes after revision 2** (a `Not yet assessable` outcome blocks recommendation, not
comparison):

- **A:** AC-03 (SA-P3-02) and AC-10 (PA-04 ± spike) are `Not yet assessable`; everything else
  `Meets`.
- **B:** AC-03 (SA-P3-02 ± AG-P5-01), AC-06 and AC-10 (PA-04) are `Not yet assessable`; everything
  else `Meets`.
- **C:** AC-02 and AC-11 (AG-P4-01), AC-03 (SA-P3-02 ± AG-P5-01), AC-10 (PA-04 ± AG-01b-C), AC-28
  and AC-30 (SA-P3-01) are `Not yet assessable`; everything else `Meets`.
- No candidate has a Gate or Observability outcome of `Does not meet`.

## 18. Remaining blockers

**Product blockers:**

| Question | Blocks comparison entry of | Blocks recommendation of |
|---|---|---|
| PA-04 | B | A, C (how AC-10 closes) |
| SA-P3-02 | A | B, C (how AC-03 closes), unless AG-P5-01 passes first |
| SA-P3-01 | C | — |

**Structural blockers:** none. No known requirement lacks a viable mechanism in any candidate.

**Empirical evidence still required before a recommendation** (Gate evidence; SR-3):

- AG-P4-01 (C) — unconditional; executable now.
- AG-01b-C (C) — only under PA-04 G or R; executable now.
- AG-01a (A) — only under PA-04 G; needs a prototype of A's layout computation.
- AG-01b-A (A) — only under PA-04 R.
- AG-P5-01 (B, C, and revised A) — only under SA-P3-02 "keeps".

**Deferred validation debt:** §21 (VD-01 … VD-10).

**Trade-off evidence:** AG-03; AG-P6-01; the B converter cost; RG-*.

**Architecture review flags:**

- SA-P3-01 "shared" (C).
- An AG-P5-01 fail under "keeps" (all candidates).

## 19. W-035 readiness (two-dimensional)

| | A | B | C |
|---|---|---|---|
| Selection readiness | **Product-blocked** (SA-P3-02) | **Product-blocked** (PA-04) | **Product-blocked** (SA-P3-01) |
| Validation maturity | **Reasoning-supported.** The dismissal path is empirically validated (S2); reachability is externally evidenced in part (S1/S1b native-object writing) | **Reasoning-supported.** The render dependency is empirically validated (S1b) and the dismissal path by S2; reachability is externally evidenced in part (S1/S1b) | **Reasoning-supported.** The confinement contract and reachability are unevidenced |
| Recommendation-path items after unblocking | PA-04 (± AG-01a / AG-01b-A) | SA-P3-02 (± AG-P5-01) | SA-P3-02 (± AG-P5-01); PA-04 (± AG-01b-C); AG-P4-01 |
| Revision currently required? | No | No | No |

**How to read the maturity row.** It records the strongest evidence behind each candidate's
critical assumptions. It is not a ranking: every candidate is "Reasoning-supported" for its X-3
reachability, which is its critical assumption.

**Can W-035 compare or select among the currently selection-ready candidates?**
**No — no candidate is selection-ready.** Each is blocked by a different Product question.

**How Product answers change readiness** (other conditions unchanged; not a recommendation of which
question to answer first):

| Product answer | Selection-ready afterwards | Excluded or pending |
|---|---|---|
| SA-P3-02 = relabel | A | B (PA-04), C (SA-P3-01) |
| SA-P3-02 = keeps | None directly: A needs its X-6 revision and then re-assessment | B, C unchanged |
| PA-04 = N | B | A (SA-P3-02), C (SA-P3-01) |
| PA-04 = G or R | None directly: B needs its X-4 revision | A, C unchanged |
| SA-P3-01 = separate sessions | C | A, B |
| SA-P3-01 = not allowed or shared | None directly: C needs an added mechanism, or architecture review | A, B unchanged |

**Exclusion consequence.** Any single answer readies at most one candidate. Proceeding at that
point would adopt one candidate without comparing it to two candidates that differ from it on all
six axes (05 §3). DOC-004 §2 places comparison before the baseline choice, so that would
prematurely exclude materially distinct architectures.

This file handles that case through **P8-GUARDRAIL-01** (§1.3), a Phase-8 process guardrail, not a
DOC-004 requirement. Baseline selection begins only when at least two materially distinct
candidates are selection-ready, or when an explicit owner decision records the exclusion of the
blocked alternatives. That owner exclusion lets the remaining candidates proceed. This pass makes
neither choice.

## 20. Handoff to Phase 7

### Product decisions resolved

None. SA-P4-01 stays closed. PA-13 is reclassified as a deferred validation semantic (not a
blocker).

### Product decisions still required

PA-04, SA-P3-02 and SA-P3-01, with the exact questions in §4. Each blocks one candidate's
comparison entry, and SA-P3-02 is on every candidate's recommendation path.

### Spikes resolved

- AG-01b-B: S1 contract fail (kept) and S1b pass.
- AG-09 platform part (S2).
- AG-09 feasibility, by labelled reasoning (ASM-SESSION-01).

### Spikes still required before a recommendation

- AG-P4-01 (C).
- AG-01a, AG-01b-A, AG-01b-C and AG-P5-01, each conditional on its Product answer.

### Reclassified as deferred validation debt

AG-02a and AG-02b (all candidates), AG-09 conformance, and the AG-01b-B residuals (§21).

### Candidate revisions triggered

None. The conditional revisions are in §14–§16.

### Gate / Observability deltas

- B: AC-01, AC-14 and AC-18 `Meets` (S1b; kept).
- A and B: AC-30 `Meets` (S2 plus labelled reasoning).
- Nothing else changes.

### Trade-off comparison deltas

As §14–§16. The mirror is mandatory for A and B; B's converter is available and its cost measured;
AG-02 is carried as an explicit assumption.

### AG-02 viability result

A, B and C each carry AG-02a as an explicit, candidate-invalidating assumption (validated before
implementation planning) and AG-02b as deferred Testing validation. None is shown viable or
non-viable, and nothing is ranked.

### Is every surviving candidate ready for W-035?

**No.**

### May Phase 7 begin under the corrected contract (§22)?

**No.** No candidate satisfies candidate-level entry condition 1, so zero candidates are
selection-ready. P8-GUARDRAIL-01 is therefore not satisfied. Phase 7 has not begun.

## 21. Validation-debt register

Genuine empirical debt only; unanswered Product semantics are excluded. The register survives
baseline selection and feeds the loop in §1.1.

| ID | Candidate | Assumption | Current basis | Validation required | Validate when | Failure consequence |
|---|---|---|---|---|---|---|
| VD-01 | A | AG-02a-A: the neutral model writes to native editable PPTX and to PDF for V1 content types, with content and order preserved | Reasoning; external evidence of programmatic native-object writing (S1/S1b) | Package validity, native object types, editability, and content/order extraction on the §6 case set | Before implementation planning | A frozen condition: invalid, or X-3 restructured / the model narrowed |
| VD-02 | B | AG-02a-B: the PPTX-shaped model serializes one-to-one to native PPTX | S1/S1b (native objects from a structured description render deterministically) | As VD-01, for B's serializer | Before implementation planning | B invalid; no branch within X-3 |
| VD-03 | C | AG-02a-C: the web form converts to native editable PPTX at measured positions within the NPC-12 capability model | Reasoning only | As VD-01, for C's converter; plus the list of web features outside the capability model | Before implementation planning | C invalid; no branch within X-3 |
| VD-04 | A, B, C | AG-02b: the preview matches the downloaded file in the reference application within recorded format losses (R-028); text fit agrees (NPC-10) | None yet; comparator deferred (D-026) | The §11 AG-02b spec against the PA-13 application | Testing (W-032 / Final Testing Plan), after PA-13 | The frozen X-3 condition, if the Core Flow cannot meet R-028; otherwise recorded format losses (AC-19, R-026) |
| VD-05 | A, B | ASM-SESSION-01: ordered updates, visibility coupling and atomic application keep the mirror current at every interceptable leave | S2 (platform); labelled reasoning (§8) | Race tests with the S2 harness: delays injected between authority commit and page application; leave at every point; mirror verdict vs authority verdict for each PA-02 reading | Integration (first slice with admission, export and reload) | AC-30 reopens; SESSION-02 redesigned locally (high reversibility); no axis change |
| VD-06 | A (under PA-04 G) | After AG-01a passes: computed geometry keeps agreeing with the displayed render on production content | AG-01a result (pending) | AG-01a case set rerun on generated decks | Integration | X-4 geometry source → OBS-02 (medium) |
| VD-07 | A (under PA-04 R) | The rendered stage stays inside the operation lifetime under stop | AG-01b-A result (pending) | Stop during render; latency recorded | Integration | "Materially less attractive" (AC-22, AC-23) |
| VD-08 | C (under PA-04 G or R) | After AG-01b-C passes: offscreen measurement keeps matching the displayed render across supported browsers and fonts | AG-01b-C result (pending) | Case set across target browsers | Integration; before release | C X-4 restructuring |
| VD-09 | B | The S1b render capability holds for DeckAgent-generated decks, under concurrent conversions and renderer crashes, and a renderer is available on user machines | S1b | Generated-deck corpus; concurrency and crash injection; install/availability check on target machines | Integration; before release | AC-01 / AC-18 reopen → B invalid (no branch within X-3) if the render path cannot be kept |
| VD-10 | C | The runtime chosen in Detailed Design conforms to the confinement contract, and keeps conforming across versions | AG-P4-01 existence demonstration (pending) | The §9 probes rerun on the chosen runtime and on every version upgrade | Integration; each runtime upgrade | X-5 → DEP-01 (medium; rest unchanged) |

## 22. Phase-7 entry contract

This is the entry contract for **Phase 7 — W-035 baseline architecture selection**. It has three
levels:

- candidate-level entry (conditions 1–5);
- the phase-level guardrail (P8-GUARDRAIL-01);
- the recommendation condition (DOC-004 §5).

### Candidate-level entry

**A candidate may enter Phase 7 baseline-selection comparison when all of the following hold:**

1. No unresolved Product question can change a candidate-defining decision of that candidate
   (SR-4; §4 blocking scopes).
2. The candidate has no Gate or Observability outcome of `Does not meet`.
3. No `CANDIDATE-REVISION-REQUIRED` has fired without its revised configuration having been
   re-assessed.
4. Every unresolved empirical uncertainty of that candidate is represented as an architecture
   assumption, with its evidence basis, validation debt, validation point and reopen consequence
   (§11, §21, ASM-SESSION-01).
5. Any uncertainty too fundamental to be represented as an assumption remains a blocker. None is
   currently identified beyond the Product blockers.

### Phase-level guardrail (Phase-8 process rule, not DOC-004)

**P8-GUARDRAIL-01** (§1.3): Phase 7 starts comparative baseline selection only when at least two
materially distinct candidates satisfy conditions 1–5, unless an owner explicitly records the
exclusion of the blocked alternatives. Phase 7 compares only candidates that satisfy 1–5.

### Recommendation (DOC-004 §5)

**W-035 may recommend a candidate only when, in addition** (SR-1):

6. Every Gate and Observability outcome of that candidate is `Meets`. This includes any
   Product-conditional spike that its answers have made decisive (AG-01a, AG-01b-A, AG-01b-C,
   AG-P5-01), and AG-P4-01 for C (an existence demonstration: at least one runtime of the allowed
   class satisfies the contract).

Deferred validation debt (§21) does not have to disappear before a recommendation, unless an
authoritative criterion explicitly requires that evidence at that point.

### Scope of Phase 7

**Phase 7 does not require:**

- a production implementation;
- every spike to be complete;
- equal evidence maturity across candidates.

**Phase 7 must not:**

- treat an assumption in §11 or §21 as a fact;
- ignore a candidate-invalidating assumption. The AG-02a entries for all three candidates, and
  VD-09 for B, must be weighed as risk in the comparison;
- choose a candidate whose Product semantics are undefined where they determine its architecture;
- recommend a candidate with any `Not yet assessable` Gate or Observability outcome.

**Phase 8 completion.** This phase is complete in the sense of §1.1:

- everything resolvable now is resolved (S1, S1b, S2; the feasibility of ASM-SESSION-01; PA-13's
  category; ER-TENSION-01);
- Product blockers are separated from validation debt, and the remaining assumptions and reopen
  triggers are recorded;
- selection readiness is established per candidate.

The optional executable-now spikes (AG-P4-01; AG-01b-C; AG-P5-01, proactively) are left to the
owner, because none of them makes any candidate selection-ready while its Product blocker stands.

## Phase 8 disposition — ACCEPTED / FROZEN

Current state at freeze:

- A — Product-blocked by SA-P3-02;
- B — Product-blocked by PA-04;
- C — Product-blocked by SA-P3-01;
- zero selection-ready candidates.

P8-GUARDRAIL-01 is therefore not satisfied, and Phase 7 does not begin. Phase 7 has not begun.
