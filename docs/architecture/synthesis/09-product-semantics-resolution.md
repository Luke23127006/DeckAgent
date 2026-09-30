# Phase 9 — Product Semantics Resolution (owner-decision package)

Status: **Product owner answers recorded (2026-09-30); consequences applied and re-assessed
(§9–§15).**

§1–§8 are the owner-decision package as it stood before the answers, and are kept as the record
of how the questions were posed. §9–§15 record the answers and their consequences, and they govern
the current state. This file recommends no Product option and selects or ranks no architecture.
Phases 0–8 are frozen and unchanged; where an answer supersedes a Phase 8 assumption, the delta is
recorded here.

Phase 7 (W-035 baseline architecture selection) has not begun.

**Revision 2 — option-model correction.** This revision makes five changes:

- SA-P3-02 is split into two orthogonal decisions (§3);
- source-number validation scope is decoupled from the visible provenance label (§4.4);
- the second-view options "refuse" and "take over" are separated (§5);
- PA-04 option N is reworded (§4.3);
- readiness is re-derived candidate by candidate (§6, §7).

**Revision 3 — consistency fixes.** This revision makes three changes, and nothing else:

- readiness distinguishes the three SA-P3-02B states explicitly. Element-level "mixed" makes no
  candidate selection-ready until its AC-03 / AC-16 re-assessment is complete (§2, §7);
- an owner exclusion cannot bypass the candidate-level entry contract. Under span-level provenance,
  Phase 7 cannot begin until the architecture review yields at least one selection-ready candidate
  (§7);
- where the Take-over warning appears is reclassified from a Product sub-decision to an
  architecture / interaction-design realization choice, unless the owner states a preference
  (§5.3, §5.5, §8, owner form).

No other Phase 9 conclusion changed.

**Revision 4 — owner answers.** The Product owner answered all five decisions and P9-TENSION-01.
This revision records them (§9), closes the Product items (§10), applies only the triggered
architecture consequences (§11), records new validation debt (§12), and recomputes readiness,
P8-GUARDRAIL-01 and Phase 7 entry (§13–§15). The owner form records the answers.

## 1. Boundary and source precedence

| Rank | Source | Used for |
|---|---|---|
| 1 | `.project-hub/snapshot` | Product meaning (Known / Unknown) |
| 2 | DOC-004 | Criteria, and their neutrality on open Product points (§1, §11) |
| 3 | Frozen 01–08 | Architecture consequences of each answer |
| 4 | DOC-008 | Supporting interpretation only |

- Reference-system research is not Product authority and is not used.
- No option is argued from how easy it makes any candidate.
- PA-13 remains deferred (08 §4).

**Frozen state consumed (08 §17, §19, §22)**, under the Phase 8 option model:

| Candidate | Selection readiness | Comparison-entry blocker | Recommendation-path items |
|---|---|---|---|
| A | Product-blocked | SA-P3-02 | PA-04 (± AG-01a / AG-01b-A) |
| B | Product-blocked | PA-04 | SA-P3-02 (± AG-P5-01) |
| C | Product-blocked | SA-P3-01 | SA-P3-02 (± AG-P5-01); PA-04 (± AG-01b-C); AG-P4-01 |

- There are zero selection-ready candidates, so P8-GUARDRAIL-01 is not satisfied.
- No Gate or Observability outcome is `Does not meet`.
- No candidate revision has fired.

**Phase 9 notes (Phase 8 is not edited):**

- **P9-NOTE-01.** Phase 8's option model (08 §4) treated "Mixed-origin elements allowed" as one
  answer class that implied A's X-6 revision "since construction cannot express a mixed element".
  That merged two separate questions: whether a paraphrase keeps its origin, and whether one
  element may mix origins. §3 re-derives the consequences for each question separately.
- **P9-NOTE-02.** Under the corrected model, span-level provenance can affect all three candidates
  (§3.4). The Phase 8 mapping of SA-P3-02 as a comparison-entry blocker "of A only" therefore
  holds only for answers without span-level provenance.

## 2. How the decisions relate

There are five owner decisions: SA-P3-02A, SA-P3-02B, PA-04A, PA-04B and SA-P3-01.

**Independent choices.** Each decision can be answered without constraining the options of any
other:

- SA-P3-02A (paraphrase origin) and SA-P3-02B (mixed composition) are orthogonal;
- PA-04A (layout / render validation) and PA-04B (source-number validation) are orthogonal;
- SA-P3-01 is independent of all four.

**Interactions of consequence, not of choice:**

1. **SA-P3-02 × PA-04B.** The visible origin label and the scope of source-number validation are
   separate Product semantics (§4.4). Provenance data can *help locate* the numeric claims that the
   chosen scope covers. Whether it can do so for a combination depends on both answers. For
   example, Relabel together with the scope "all numeric claims grounded in the source" needs
   grounding information that the visible label no longer carries (§4.4).
2. **SA-P3-01 Shared × R-045 / UC-011.** A shared session needs a reload / close sub-decision. Its
   "detaches only that view" answer changes current reload semantics and fires P5-TENSION-01
   (§5.3).

**The candidate-blocking pattern depends on the answers.** Under the Phase 8 option model, each
Product question blocked the comparison entry of exactly one candidate. Under the corrected model,
that pattern depends on SA-P3-02B:

- **02B = No:** the pattern holds; mixed-origin composition adds no re-assessment.
- **02B = element-level mixed:** every candidate additionally needs an AC-03 / AC-16 re-assessment
  (§3.4) before it can be selection-ready, even after its original blocker clears.
- **02B = span-level:** A, B and C are all under architecture review (§3.4).

Readiness under any answer is therefore derived per candidate (§7) before Phase 7.

## 3. Decision 1 — SA-P3-02: provenance semantics

### 3.1 The unresolved decisions

Phase 8 posed this as one question (08 §4). It contains two orthogonal decisions:

- **SA-P3-02A — Paraphrase origin.** When a refinement (for example tone or audience, D-025)
  faithfully rephrases content that came from the source document, keeping its facts, numbers and
  meaning, is the rephrased content source-derived or AI-added?
- **SA-P3-02B — Mixed-origin composition.** May one content element (block, bullet, table cell)
  contain parts of different origin? If yes, at what granularity is origin shown?

`SA-P3-02 = Paraphrase semantics × Mixed-origin policy`

### 3.2 Evidence

**Known (Product text):**

| Source | What it establishes |
|---|---|
| R-007 AC1–2; BR-002 rule 1 | Every figure taken from the document matches it; the meaning and quotations of document content are unchanged |
| R-008 AC1–2; BR-002 rule 2 | Content not in the document is not presented as from the document. R-008 AC2: "Người dùng thấy được **phần nào** do AI bổ sung, hoặc được hỏi trước khi AI bổ sung" (the user can see **which part** is AI-added, or is asked before the AI adds it) |
| BR-002 exception 1 | AI may add content if it is distinguishable from document content |
| UC-002 5A, postcondition 3 | AI asks, or marks content as AI-added; AI-added content is marked differently from document content |
| D-025 | Tone and audience refinements are V1 refinement types, and they necessarily rephrase |
| DOC-004 AC-03 | The distinction holds across generation and refinement, including refinement of originally source-derived content; it does **not require** span-level linking |
| DOC-004 AC-16 | Origin is observable |

**Unknown:**

- Whether "taken from the document" is judged by meaning or by wording (SA-P3-02A).
- Whether an element may mix origins, and at what granularity (SA-P3-02B).
- R-008 note 1: how AI-added content is displayed is not settled.
- A-015 is still Open.

**P9-TENSION-01 — element-level "mixed" label × R-008 AC2.** An element-level mixed label tells
the user *that* an element mixes origins, not *which part* is AI-added. R-008 AC2 requires the user
to see "phần nào" (which part) is AI-added.

- If "part" means the element, the label is consistent with R-008.
- If it means text within the element, only span-level provenance, or asking first, satisfies it.

This file does not resolve that reading. If the owner selects the element-level mixed label, the
owner is asked to confirm it against R-008 AC2.

**Frozen provenance representation (03 ADB-PROV-01, PROV-05, PROV-06; 05 §4–§6):**

- PROV-01 puts one origin label (source, user-stated or AI-added) on each text-bearing element.
- PROV-01's recorded assumptions are "an element is a meaningful unit for origin" and
  "mixed-origin elements get a defined rule (NPC-11)".
- No Phase 3 option provides span-level origin: PROV-02 anchors are explicitly "not span-level",
  and PROV-03 and PROV-04 are not viable as primary mechanisms.

| Candidate | X-6 (who assigns origin) | Where the label lives |
|---|---|---|
| A | By construction (PROV-05, SOURCE-02): "source" only on elements the system placed from extracted source items | A field on each neutral-model element |
| B | Model-declared, verified (PROV-06): the model declares origin per element and cites source items; unverifiable claims are downgraded | Owned origin fields on PPTX-shaped model elements |
| C | Model-declared, verified (PROV-06), against source text | Element attributes in the web payload |

### 3.3 SA-P3-02A options — paraphrase origin

#### Relabel — a faithful paraphrase becomes AI-added

- **Product meaning.** "Source-derived" means the document's own content, unchanged or quoted. Any
  AI rewording, even a faithful one, is AI-authored.
- **What the user sees.** After a tone or audience refinement, reworded text is marked AI-added
  even when its facts and numbers came from the document. R-007 still requires those facts and
  numbers to be correct.
- **Architecture:**
  - A: PROV-05 / X-6 stays viable, unless SA-P3-02B independently forces a representation change
    (§3.4).
  - B, C: faithful paraphrase does not require AG-P5-01; AC-03 closes by strict textual
    verification (06 §11).

#### Preserve — a faithful paraphrase keeps source-derived origin

- **Product meaning.** "Source-derived" means meaning taken from the document.
- **What the user sees.** Reworded but faithful content keeps its source marking across
  refinements.
- **Architecture:**
  - A: **CANDIDATE-REVISION-REQUIRED**. X-6 moves from PROV-05 to Variant M (PROV-06 + PROV-01)
    (08 §14). Revised A then needs AG-P5-01 for AC-03.
  - B, C: AG-P5-01 becomes Gate evidence for AC-03 before recommendation.
  - An AG-P5-01 fail → architecture review of X-6 (08 §10).

### 3.4 SA-P3-02B options — mixed-origin composition

#### No — one element, one origin

No additional representation consequence. The frozen PROV-01 applies as is, in every candidate.

#### Yes, element-level "mixed" label

- **Product meaning.** An element may combine document-derived and AI-added parts. It is labelled
  "mixed", without identifying which part is which (see P9-TENSION-01).
- **Architecture re-derivation, per candidate:**

| Candidate | Fits the current PROV-01 / X-6? | What changes | Re-assessment |
|---|---|---|---|
| A | **Within X-6 (MB-09 C), with a construction-contract extension.** A fourth label value is within PROV-01's anticipated "defined rule". But by construction, a mixed element exists only if the system can place a source item *inside* an element that also holds model text. PROV-05 as frozen places items at element level ("elements the system placed", 05 §4). Under Preserve, A's X-6 revision applies anyway | Label value set; PROV-05 placement granularity (element → sub-element placement within an element) | AC-03, AC-16; Phase 6 CH-5, P-02. If the re-assessment finds that sub-element placement cannot be done by construction, the Preserve-style X-6 revision (PROV-06) is triggered. That is a fired revision, not a silent patch |
| B | **Within X-6.** A fourth value in the owned origin fields. Verification must still locate the source-claimed part to verify it, so the model's claim must identify that part internally even though the display is element-level | Label value set; verification input | AC-03, AC-16 |
| C | **Within X-6.** A fourth value in the element attribute. Same verification note as B | Label value set; verification input | AC-03, AC-16 |

#### Yes, span-level provenance

- **Product meaning.** Parts within one element each carry, and show, their own origin.
- **Architecture re-derivation, per candidate:**

| Candidate | Current representation | Fits the current X-6? | Candidate-defining effect | Affected ACs | Affected Phase 6 claims |
|---|---|---|---|---|---|
| A | An origin field per neutral-model element; "source" by element-level placement | **No, by the frozen bank.** It invalidates PROV-01's assumption that an element is the unit of origin, and no Phase 3 option provides span-level origin. It also needs sub-element placement by construction, and a span-bearing origin field in the DeckAgent-owned neutral model (the X-3 content form) | X-6's PROV-01 component; the X-3 model schema | AC-03, AC-16 (and AC-10 if the source-number check is runtime) | CH-5; the AC-24 provenance contrast; P-02; S-07 (new targets must carry span origin) |
| B | Owned origin fields per PPTX-shaped element | **No, by the frozen bank** (same PROV-01 reason). The PPTX-shaped model already has sub-element text runs where a field could attach; that affects cost, not whether the bank covers the answer. Verification (AG-P5-01) moves to span scope | X-6's PROV-01 component; X-3 run-level fields | AC-03, AC-16 | CH-5; the AC-24 provenance contrast |
| C | Element attributes in the web payload | **No, by the frozen bank** (same PROV-01 reason). The web form has sub-element spans where an attribute could attach; that affects cost, not whether the bank covers the answer. Verification at span scope | X-6's PROV-01 component; the X-3 span attribute | AC-03, AC-16 | CH-5; the AC-24 provenance contrast |

- **Disposition: `ARCHITECTURE-REVIEW-REQUIRED`** for A, B and C, conditional on SA-P3-02B =
  span-level.
  - The answer invalidates a recorded assumption of an ADB option that all three candidates use
    (PROV-01), and the frozen decision bank has no option that covers it.
  - Whether each candidate's identity survives, meaning whether its X-6 assignment choice
    (MB-09 C or M) and its X-3 form stay intact with a new span-level PROV family option, cannot be
    decided without adding that option to DF-PROV-01 and re-running the affected Phase 4–6
    analysis.
  - Nothing is patched here.

### 3.5 Reversibility of the SA-P3-02 decisions themselves

These are architecture facts, not arguments for any option.

- **02A Relabel → Preserve later:** a baseline built on PROV-05 faces its X-6 revision; PROV-05 is
  low reversibility (05 §4). PROV-06 baselines change only verification rules (high, 05 §5–§6).
- **02A Preserve → Relabel later:** verification rules change (high reversibility).
- **02B No → element-level mixed later:** a label value is added; A also needs sub-element
  placement.
- **02B No or element-level → span-level later:** the §3.4 review, after a baseline exists.
- **02B span-level → element-level or No later:** a representation simplification.

### 3.6 Owner output form

`SA-P3-02A = Relabel | Preserve` × `SA-P3-02B = No | Yes (element-level "mixed" label | span-level provenance)`

## 4. Decision 2 — PA-04: what DeckAgent itself validates at runtime

### 4.1 The unresolved decisions

Phase 8 posed this as one question (08 §4). It contains two orthogonal decisions:

- **PA-04A — Runtime layout / render validation.** Which hard-minimum checks (HM-1 clipped text,
  HM-3 broken or empty slide, HM-4 layout failure) must DeckAgent itself enforce on every result
  before it is displayed or becomes a version, and on what evidence (geometry or rendered output)?
- **PA-04B — Source-number validation.** Must DeckAgent check, at runtime, that numbers match the
  document (UC-002 step 6)? If so, which numbers does the check cover?

There are three distinct things:

- the **property**: R-007 and R-021 must hold;
- the **test oracle**: Testing verifies the property;
- **runtime validation**: the product checks every result before showing it (DOC-008 F15, §5.3).

Only runtime validation is being decided.

### 4.2 Evidence

**Known (Product text):**

| Source | What it establishes |
|---|---|
| R-033 AC1 | Each operation type has a check before the result is displayed |
| R-033 note 1 | The specific checks are not decided; the architecture makes the check verifiable |
| R-021 AC1; D-028 | The hard minimum is a V1 property, and no runtime check is named |
| UC-001 step 5; UC-004 step 4 | "The system checks the result"; the checks are not named |
| UC-002 step 6 | "… gồm việc số liệu khớp với tài liệu" (… including that numbers match the document). DOC-008 F15: no Requirement or Decision backs it as runtime validation |
| R-007 AC1; UC-002 postcondition 2 | "Mọi số liệu … lấy từ tài liệu khớp với tài liệu" (every figure taken from the document matches the document). This is the property's scope; it is stated on figures, not on visible labels |
| UC-001 5A; UC-002 6A; UC-004 4A; BR-010 rule 5 | **The failure effect of any check that does run is decided.** The result is not displayed; the user is told and can retry; no version is created; a refinement returns to its recovery baseline |
| DOC-004 §2, AC-10, §11 | Which checks run is Product's; the criteria hold under any answer |

**Unknown:**

- The PA-04A class, and for HM-1 and HM-3 the evidence type.
- The PA-04B timing, and under runtime, its scope.

### 4.3 PA-04A options — layout / render validation

The **Product moment** is the same for every option and is fixed by R-033 and BR-010:

- first generation: before the result is displayed and becomes the accepted version;
- refinement: before it is displayed and becomes the pending version.

| Option | Enforced at runtime on every result | Evidence accepted | Failure effect |
|---|---|---|---|
| **N** | No HM-1 / HM-4 geometry or render enforcement. At most, content-level checks such as HM-3 "slide has no content" and structural validity | Result content only | Not displayed; UC failure path (Known) |
| **G** | HM-1 overflow / clipping and HM-4 overlap / out-of-bounds, judged on post-layout geometry (plus N's checks) | Geometry after layout | As N |
| **R** | At least one check on rendered output: HM-1 "text cut off when rendered" and/or HM-3 render errors (plus G's checks as selected) | Actual rendered output | As N |

**Product-visible meaning:**

- **N.** DeckAgent does not reject a generated or refined result at runtime solely because an
  HM-1 or HM-4 condition is present. R-021 remains a Product property. Confidence that the
  generation and layout mechanisms satisfy it comes from Testing, not from enforcement on each
  result at runtime. A result with such a condition can be displayed.
- **G.** A result whose laid-out text overflows or overlaps is never displayed; the user gets an
  error and a retry.
- **R.** As G, judged on how the slide actually renders.

**Non-blocking reporting.** A flag shown with a displayed result is not a check in R-033's sense,
because the failure path blocks display. It is compatible with N. List it under "additional
runtime checks" if wanted.

**Architecture consequences (unchanged from revision 1):**

| | A | B | C |
|---|---|---|---|
| N | AC-10 met (06 §4); no spike | X-4 assumption holds; AC-06 and AC-10 re-assessed | AG-01b-C not decisive; AC-10 re-assessed |
| G | AG-01a becomes Gate evidence before recommendation. A fail → X-4 geometry source moves to OBS-02 (medium; within A's X-4) | **CANDIDATE-REVISION-REQUIRED**: X-4 MB-08 D → MB-08 P, with a PPTX render before admission. Single axis (08 §15) | AG-01b-C becomes Gate evidence before recommendation. A fail → C restructuring (05 §6) |
| R | AG-01b-A becomes Gate evidence before recommendation. A fail → "materially less attractive" (05 §4) | Same revision as G | As G |

### 4.4 PA-04B — source-number validation (timing and scope)

**The visible provenance label is not the validation scope.** No Product text makes the
source-number check apply to "content labelled source-derived". The property is stated on figures
"taken from the document" (R-007 AC1; UC-002 postcondition 2), and the label is a separate,
user-facing semantic (SA-P3-02).

Example: a sentence containing a document figure is faithfully paraphrased. Under Relabel it is
marked AI-added, yet its figure is still taken from the document.

**Timing:**

- **Runtime:** a result is not displayed if a number within the validation scope does not match the
  document. The UC failure path runs (Known).
- **Testing only:** R-007 stays a Product property, verified by Testing; an individual result is
  not checked at runtime.

**Scope (asked only if the timing is Runtime):**

| Scope | Product meaning | Architecture consequence |
|---|---|---|
| All numeric claims grounded in the source (R-007's "figures taken from the document", whatever their visible label) | Any number that came from the document is checked, including in relabelled paraphrases and inside mixed elements | Needs grounding information per numeric claim, independent of the visible label. B and C: PROV-06 already produces source references per claim; they must be kept as internal grounding data even where the visible label is AI-added. A: under Relabel, a paraphrased element is model-written and loses its placement link, so A needs a grounding record separate from its label. The bank lists PROV-02 anchors as compatible with PROV-05. Whether this stays inside A's X-6 is a re-assessment item. Affects AC-10 evidence |
| Only content explicitly labelled source-derived | Numbers in AI-added or mixed-labelled content are not checked at runtime. Under Relabel, paraphrased figures are covered by Testing only | Uses the labels directly; no additional grounding record. Affects AC-10 evidence |
| Other (owner-defined) | As defined | Re-derived after the answer |

The provenance labels can help *locate* claims under either scope. They define the scope only if
the owner chooses the second option.

Under Preserve or span-level provenance, a runtime check also relies on verified origin in PROV-06
candidates (AG-P5-01).

### 4.5 Other runtime checks (optional)

DOC-008 §5.3 lists further checks that *could* run:

- P2 measurable constraints: every candidate holds an explicit constraint set at the gate;
- HM-2 narrative, through a calibrated LLM judge: content-level.

Neither affects a candidate-defining decision; either adds evidence to AC-10.

### 4.6 Reversibility of the PA-04 decisions themselves

- **PA-04A N → G or R later:** an X-4 revision after a baseline built on MB-08 D (B's current
  X-4); A and C add checks within their X-4.
- **PA-04A G or R → N later:** local in every candidate.
- **PA-04B Testing-only ↔ runtime, and label scope ↔ grounded scope:** local in B and C. In A,
  moving to the grounded scope under Relabel adds the grounding record (§4.4).

### 4.7 Owner output form

`PA-04A = N | G | R` × `PA-04B = Testing only | Runtime (scope = grounded | labelled | other)`, plus
optional additional runtime checks.

## 5. Decision 3 — SA-P3-01: meaning of a second browser view

### 5.1 The unresolved decision

> If the same user opens DeckAgent in a second browser tab or window while a session is running,
> what does that view mean?

Multi-user collaboration is excluded by D-027 and is not in question.

### 5.2 Evidence

**Known (Product text):**

| Source | What it establishes |
|---|---|
| D-027 | A local web app with no host, accounts or collaboration; the deck exists only in the open session |
| BR-012 | Deck, source and constraints exist only in the current session; warning before loss |
| BR-014 | One AI operation per **session** at a time |
| R-045; UC-011 (trigger, 1B) | New deck, reload and close each lose the deck; a warning is required when undownloaded work exists, and the action can be cancelled |
| SA-P4-01 (closed, 06 §2) | Reload ends the session under current text; P5-TENSION-01 reopens it only on a Product change to R-045, UC-011 or BR-012 |

**Unknown:**

- Whether "the open session" belongs to the application or to a view.
- What a second view means.

**Architecture baseline:**

- A and B hold the session in the host process, and views attach; they accommodate every option.
- C holds authority in the page and has no mirror (05 §6); only "Separate" fits it as frozen.

### 5.3 Options

#### Option 1 — Shared session

- **Product-visible meaning.** Both views show the same deck, versions, pending state and
  operation. An action in either view affects both. BR-014 applies across views.
- **Required sub-decision: reload or close of one view.**
  - *Ends the shared session for all views:* consistent with current R-045 / UC-011. The warning
    appears in the view that performs the action.
  - *Detaches only that view:* the other view keeps the session. This changes current reload
    semantics and fires **P5-TENSION-01** (SA-P4-01 reopens; C's AC-01 and AC-30 are
    re-assessed).
- **Architecture:**
  - A, B: accommodated.
  - C: **ARCHITECTURE-REVIEW-REQUIRED**. It needs shared authority outside the page (authority
    location, SESSION-04, the session-loss model; 08 §16). Not patched.

#### Option 2 — Separate session

- **Product-visible meaning.** Each tab or window is an independent session with its own document,
  deck, versions, pending state, constraints and operation limit. BR-014 permits one operation per
  tab. Warnings are per tab. A user can hold two decks and download from either; 05 §6 records the
  risk that the user exports from the wrong one.
- **Architecture:**
  - A, B: accommodated.
  - C: its assumption holds. AC-28 and AC-30 are re-assessed (06 §4: would meet).

#### Option 3 — Refuse second view

- **Product-visible meaning.** The second view neither creates nor attaches to a session. It tells
  the user that a session is already active. The first view stays authoritative and unaffected.
- **Architecture:**
  - A, B: accommodated; the authority refuses a second attach.
  - C: **CANDIDATE-REVISION-REQUIRED**, needing an added mechanism for cross-view *presence*
    detection and refusal. The second page needs only to know that another active page exists; no
    session state crosses pages. Re-assess AC-28, AC-30 and AC-11 (any new sink).

#### Option 4 — Take over existing session

- **Product-visible meaning.**
  - The second view may explicitly replace the existing session.
  - The takeover is a session-ending action for the existing session. Existing undownloaded work
    is protected by the R-045 / UC-011 warning-and-cancel behavior: the user is warned before that
    work would be lost and can cancel.
  - Takeover must not silently destroy the existing session. Once confirmed, the first view's
    session ends.
- **Product vs design boundary.** R-045 / UC-011 establish the warning, the ability to cancel, and
  that takeover ends the replaced session. They do not establish which browser view hosts the
  warning. That realization differs in architecture consequence, but that alone does not make it a
  Product semantic. Warning placement is therefore an architecture / interaction-design choice,
  unless the owner explicitly states a preference.
- **Architecture:**
  - A, B: accommodated under either realization. The session-loss state is in the host authority.
    The new view's in-app takeover action can consult it; S2 shows that in-app actions are not
    limited by dismissal rules. The authority ends the old scope and notifies the old view through
    its channel.
  - C: **CANDIDATE-REVISION-REQUIRED**, and **larger than refusal**. Beyond presence detection, C
    needs cross-page coordination to end the first page's session. The size of the revision depends
    on the realization branch, and both branches are carried unless the owner states a preference:
    - **Branch T1 — confirmation in the new view.** The new view needs enough of the existing
      session's session-loss state to make the warning decision. That may require a cross-page
      projection / mirror, and it re-assesses the frozen C property "session-loss state is read
      directly, with no mirror" (07 §19; 05 §6 benefits).
    - **Branch T2 — confirmation in the existing view.** The takeover request must reach the
      existing page, which performs the warning / confirmation before yielding. This needs
      cross-page coordination, but it may avoid copying the whole session-loss state into the new
      page.
  - Re-assess AC-28, AC-30 (under T1 the interception point is in another page) and AC-11, and
    Phase 6 claims CH-3 and the AC-21 "no mirror" claim.
  - If either realization forces authority out of the page, escalate C to
    **ARCHITECTURE-REVIEW-REQUIRED**.
  - These branches are architecture / design alternatives, not Product answers.

### 5.4 Reversibility of the SA-P3-01 decision itself

- **Any option → Shared later:** C's authority-location restructuring after a baseline (low
  reversibility, 05 §6). A and B are accommodated.
- **Separate ↔ Refuse ↔ Takeover later:** C gains or loses the added mechanisms. A and B are local.
- **Shared → any other later:** local in A and B.

### 5.5 Owner output form

`SA-P3-01 = Shared (reload/close one view: ends all | detaches) | Separate | Refuse | Take over`

Under Take over, the warning-and-cancel behavior is mandatory Product behavior. A preference for
where the warning appears is optional; if none is given, placement stays an architecture /
interaction-design decision (T1 / T2, §5.3).

## 6. Cross-decision consequence map

This maps consequences; it is not a ranking. Only rows with materially distinct effects are shown.

| Decision value | Candidate A | Candidate B | Candidate C |
|---|---|---|---|
| 02A Relabel | Stable (X-6 as frozen) | Stable; AC-03 by reasoning | Stable; AC-03 by reasoning |
| 02A Preserve | **Revision (X-6 → PROV-06)**; AG-P5-01 on the recommendation path | AG-P5-01 on the recommendation path | AG-P5-01 on the recommendation path |
| 02B No | No effect | No effect | No effect |
| 02B element-level "mixed" | Within X-6; sub-element placement extension; re-assess AC-03 and AC-16; P9-TENSION-01 | Within X-6; label value; re-assess AC-03 and AC-16 | As B |
| 02B span-level | **ARCHITECTURE-REVIEW-REQUIRED** | **ARCHITECTURE-REVIEW-REQUIRED** | **ARCHITECTURE-REVIEW-REQUIRED** |
| PA-04A N | Stable; AC-10 met | Stable (X-4 as frozen) | Stable |
| PA-04A G | AG-01a on the recommendation path | **Revision (X-4)** | AG-01b-C on the recommendation path |
| PA-04A R | AG-01b-A on the recommendation path | **Revision (X-4)** | AG-01b-C on the recommendation path |
| PA-04B Testing only | No effect | No effect | No effect |
| PA-04B Runtime, labelled scope | Adds to AC-10 evidence | Adds to AC-10 evidence | Adds to AC-10 evidence |
| PA-04B Runtime, grounded scope | Adds to AC-10 evidence. With 02A Relabel: a grounding record separate from the label (re-assessment item) | Adds to AC-10 evidence; internal source references retained | As B |
| SA-P3-01 Separate | Stable | Stable | Stable (assumption holds) |
| SA-P3-01 Refuse | Stable | Stable | **Revision** (presence detection) |
| SA-P3-01 Take over | Stable | Stable | **Revision** (larger: cross-page coordination to end the session; under realization T1, possibly a cross-page state projection / mirror) |
| SA-P3-01 Shared, ends all | Stable | Stable | **ARCHITECTURE-REVIEW-REQUIRED** |
| SA-P3-01 Shared, detaches | Stable | Stable | **ARCHITECTURE-REVIEW-REQUIRED**; P5-TENSION-01 fires |

## 7. Candidate readiness delta

This applies the frozen 08 §22 candidate-level entry rules (conditions 1–5).

- A candidate is selection-ready only after every candidate-defining consequence of the recorded
  answers has been incorporated and re-assessed.
- A candidate under architecture review is not selection-ready until the review completes.
- The three SA-P3-02B states are kept distinct throughout:
  - **02B = No:** no provenance re-assessment caused by mixed-origin composition;
  - **02B = element-level mixed:** a candidate is **not** selection-ready merely because its
    original comparison-entry blocker cleared. Its recorded AC-03 / AC-16 re-assessment (§3.4) must
    succeed first;
  - **02B = span-level:** architecture review is required for A, B and C.

### Candidate A

| Answer | Effect on A | A selection-ready? |
|---|---|---|
| 02A Relabel + 02B No | No provenance revision | **Yes**, once recorded, unless another chosen answer creates a candidate-defining consequence for A (PA-04B row below) |
| 02A Relabel + 02B element-level mixed | Sub-element placement extension within X-6; re-assess AC-03, AC-16 and related Phase 6 claims (CH-5, P-02); confirm P9-TENSION-01. If placement by construction fails → X-6 revision | Only after that provenance re-assessment succeeds (or after the fired revision and its re-assessment) |
| 02A Preserve + 02B No | X-6 revision (PROV-06); re-assess AC-03, AC-16, CH-5, AC-24 and P-02 | After revision and re-assessment |
| 02A Preserve + 02B element-level mixed | X-6 revision plus the label value; the AC-03 / AC-16 re-assessment covers both | After revision and re-assessment |
| any 02A + 02B span-level | ARCHITECTURE-REVIEW-REQUIRED | Not until the review completes |
| PA-04B Runtime, grounded, with 02A Relabel | A grounding record separate from the label; re-assess X-6 components and AC-10 | After re-assessment |

PA-04A and PA-04B otherwise stay on A's recommendation path (08 §17). SA-P3-01 has no effect on A.

### Candidate B

| Answer | Effect on B | B selection-ready? |
|---|---|---|
| PA-04A N + 02B No | No revision | **Yes**, once the answers are recorded, provided no other chosen answer creates a candidate-defining consequence for B |
| PA-04A N + 02B element-level mixed | Label value; re-assess AC-03 and AC-16 | Only after that re-assessment succeeds (no revision) |
| PA-04A G or R (02B No or element-level mixed) | X-4 revision; re-assess AC-06, AC-10, AC-28, AC-08, and Phase 6 CH-2, AC-22, AC-25, P-01 and the §7 lifecycle split. Under element-level mixed, also AC-03 / AC-16 | After revision and all required re-assessments |
| any PA-04A + 02B span-level | ARCHITECTURE-REVIEW-REQUIRED | Not until the review completes |

02A (± AG-P5-01) and PA-04B stay on B's recommendation path. SA-P3-01 has no effect on B.

### Candidate C

| Answer | Effect on C | C selection-ready? |
|---|---|---|
| SA-P3-01 Separate + 02B No | No revision; AC-28 and AC-30 re-assessed, as recorded | **Yes**, once AC-28 / AC-30 are re-assessed |
| SA-P3-01 Separate + 02B element-level mixed | As above, plus label value and AC-03 / AC-16 re-assessment | Only after the AC-28 / AC-30 and AC-03 / AC-16 re-assessments succeed |
| SA-P3-01 Refuse | Presence-detection mechanism; re-assess AC-28, AC-30, AC-11 (plus AC-03 / AC-16 under element-level mixed) | After revision and all required re-assessments |
| SA-P3-01 Take over | Cross-page coordination to end the session; under realization T1, possibly a cross-page state projection / mirror (§5.3). Re-assess AC-28, AC-30, AC-11, CH-3 and the AC-21 no-mirror claim (plus AC-03 / AC-16 under element-level mixed). Escalates to review if authority must leave the page | After revision and all required re-assessments, or after review |
| SA-P3-01 Shared (either sub-answer) | ARCHITECTURE-REVIEW-REQUIRED | Not until the review completes |
| any SA-P3-01 + 02B span-level | ARCHITECTURE-REVIEW-REQUIRED | Not until the review completes |

02A (± AG-P5-01), PA-04A (± AG-01b-C), PA-04B and AG-P4-01 stay on C's recommendation path.

### P8-GUARDRAIL-01 after the answers

This Phase-8 process guardrail (08 §1.3) requires two or more materially distinct selection-ready
candidates, or a recorded owner exclusion.

**Owner exclusion does not bypass the Phase-8 §22 candidate-level entry contract.** The guardrail is
evaluated only after candidate-level entry (conditions 1–5) has been evaluated for each candidate.
An owner exclusion can remove blocked alternatives from the comparison. It cannot make a candidate
that fails candidate-level entry selection-ready. The general owner-exclusion escape is unchanged
for cases where at least one candidate already satisfies candidate-level entry.

In the table, "selection-ready" means that every re-assessment the answers require is complete.
Individual-candidate conditions are those of the tables above; "A holds" means 02A Relabel without
PA-04B runtime grounded scope, "B holds" means PA-04A N, and "C holds" means SA-P3-01 Separate.

| Answer pattern | Selection-ready once recorded (no revision) | Ready only after revision / re-assessment | Guardrail |
|---|---|---|---|
| 02B = span-level (any other answers) | None | None until architecture review completes for A, B and C | **Phase 7 cannot begin.** Zero candidates satisfy candidate-level entry, so owner exclusion alone is insufficient. The review must first produce at least one surviving selection-ready candidate; then the guardrail is evaluated normally. If only one becomes selection-ready, owner exclusion of the others may satisfy the guardrail |
| 02B = No; A, B and C all hold (PA-04B Testing only or labelled scope) | A, B; C after its recorded AC-28 / AC-30 re-assessment | — | Satisfied |
| 02B = No; exactly two of A, B, C hold | Those two (C after AC-28 / AC-30) | The third, if its revision re-assesses cleanly (C under Shared → review) | Satisfied |
| 02B = No; at most one of A, B, C holds | At most one | Others after revision / re-assessment | Satisfied only after revisions, or by owner exclusion once at least one candidate satisfies candidate-level entry |
| 02B = element-level mixed (any other answers) | **None** | Every candidate, after its AC-03 / AC-16 re-assessment succeeds, together with any other revision or re-assessment its answers require (A: also the sub-element placement extension) | Not evaluable until those re-assessments complete. Then evaluated as in the 02B = No rows, counting only candidates whose re-assessments succeeded; owner exclusion is available only once at least one candidate satisfies candidate-level entry |

## 8. After the owner answers

Phase 7 does not start automatically. When the answers are supplied, the following steps are
recorded **in this file**:

1. Record every answer verbatim, including sub-decisions: SA-P3-02B granularity; PA-04B scope;
   SA-P3-01 Shared reload semantics. Also record the owner's P9-TENSION-01 confirmation if the
   element-level label is chosen.
   - For Take over, record the Take-over Product decision, and any optional warning-placement
     preference if one is supplied. If none is supplied, carry both realization branches (T1, T2;
     §5.3) into C's revision / re-assessment. An unspecified warning placement does not block
     Product-semantic closure.
2. Compute the candidate deltas from §6 and §7.
3. Apply each triggered `CANDIDATE-REVISION-REQUIRED` as the smallest explicit revised
   configuration (08 §14–§16).
4. If span-level provenance or Shared is chosen, or a Take-over re-assessment finds that authority
   must leave C's page, **stop and run architecture review** for the affected candidates. Do not
   patch.
5. Re-assess only the affected Gate and Observability outcomes.
6. Re-evaluate candidate-level Phase 7 entry under 08 §22 (conditions 1–5).
7. Re-evaluate P8-GUARDRAIL-01.
8. State whether Phase 7 may begin.

Conditional spikes run only if an answer makes them necessary for a re-assessment requested in
steps 3–5. Otherwise they stay recommendation evidence (08 §22 condition 6). AG-P4-01 stays C's
recommendation evidence. PA-13 stays deferred.

**Answer record:** recorded in §9 (2026-09-30). Steps 1–8 are carried out in §9–§15.

## 9. Owner answers (recorded 2026-09-30)

Recorded as given. Quotation marks mark the owner's own wording.

### 9.1 SA-P3-02A — Paraphrase origin

- **Decision:** `Preserve source-derived origin`.
- **Owner meaning:** "A faithful paraphrase of source content remains `source-derived` when its
  facts, figures and meaning are preserved." "`source-derived` means that the information /
  meaning originates from the source. It does NOT require the wording to remain verbatim."
- **Owner example:** source "Revenue in 2025 was $10M." → refinement "The company generated $10M
  in revenue during 2025." The refined content remains `source-derived`.

### 9.2 SA-P3-02B — Mixed-origin composition

- **Decision:** `Allow mixed-origin elements at element-level granularity`.
- **Owner meaning:** a single text-bearing element may contain both source-derived content and
  AI-added content. The element carries `origin = mixed`. "The system does NOT need span-level
  provenance." No span-level origin tracking is added.
- **Owner example:** "Revenue grew 20%, showing strong market momentum.", where "Revenue grew 20%"
  comes from the source and "showing strong market momentum" is AI-added. The whole element is
  labelled `mixed`.

### 9.3 P9-TENSION-01 — owner clarification

- "For R-008 AC2, 'which part is AI-added' may be satisfied at the content-element level."
- The system must let the user identify which element is mixed, AI-added or source-derived. It does
  not need to identify the precise text span inside a mixed element.

### 9.4 Provenance presentation in the Product UI — owner clarification

- Provenance is metadata associated with presentation elements.
- The user must be able to inspect an element's provenance through a DeckAgent UI layer. Allowed
  realizations include, for example, an inspector, a side panel, an optional overlay, or an element
  inspection mode. None is selected here; the realization is Detailed Design / UX freedom.
- Required Product semantic:
  - provenance is observable in DeckAgent;
  - provenance indicators are **not** presentation content;
  - labels such as `source-derived`, `AI-added` or `mixed` are not baked into the slide itself;
  - provenance indicators are not included in exported PPTX / PDF, unless a future Product
    decision explicitly changes that.

### 9.5 PA-04A — Runtime layout / render validation

- **Decision:** `N`.
- **Owner meaning:** for V1, DeckAgent does not require per-result HM-1 / HM-4 runtime enforcement
  using geometry or rendered-output validation before a result is shown. R-021 remains a Product
  property. Confidence that generated presentations satisfy HM-1 / HM-4 comes from Testing, rather
  than from checking every individual result at runtime.
- **Preserved:** already-required structural validation, content-level validation, and explicitly
  selected runtime checks (PA-04B). N does **not** mean "no validation at all".
- **Reopen condition (owner):** `N now` + `explicit validation seam` + `reopen to G/R if
  implementation evidence shows N is insufficient`. "Reopen PA-04A after implementation/testing if
  evidence shows HM-1 / HM-4 visual failures occur with a frequency or severity that makes V1
  preview quality unacceptable." At that point G and R are reconsidered. No numeric threshold is
  set now. Recorded as VD-P9-01 (§12).

### 9.6 PA-04B — Source-number validation

- **Decision:** `Runtime`, with scope `All numeric claims grounded in the source`.
- **Owner meaning:** any numeric claim whose factual grounding comes from the source document must
  be checked against the source before the generated or refined result is admitted and shown. The
  scope is independent of the visible provenance label; runtime checking is **not** limited to
  content visibly labelled `source-derived`.
- **Owner examples:**
  - Source "Revenue = $10M"; faithful paraphrase "The company generated ten million dollars." The
    numeric claim remains source-grounded and is inside the runtime scope.
  - A source-grounded number inside a mixed element is inside the runtime scope.
- **Failure semantics (frozen Product behavior, unchanged):** the result is not displayed; no new
  version is created; the user is informed; retry remains available; a refinement restores its
  recovery baseline as already defined (UC-001 5A, UC-002 6A, UC-004 4A; BR-010 rule 5).

**Additional runtime checks:** the owner selected none beyond PA-04B. The already-required
structural and content-level validation is preserved.

### 9.7 SA-P3-01 — Second browser view

- **Decision:** `Separate session`.
- **Owner meaning:** each browser tab or window that opens DeckAgent is its own independent,
  ephemeral session, with its own session, source, deck, accepted / pending versions, constraints
  and AI operation. No application-session state is shared between two views.
- Opening a second view does **not** attach to, stop, take over or invalidate the first session,
  and does not close the first view.
- If view A is generating and view B starts another generation, both may run: BR-014 is one AI
  operation per session.
- Each view has its own session-ending, reload and close semantics, and its own warnings.
- **Owner rationale:** V1 has no account, authentication or shared persistent workspace, and the
  Product intentionally treats each browser view as an independent ephemeral working session. This
  is a **Product simplification / session-model choice, not a technical inevitability**. The absence
  of authentication does not technically force separate sessions.

## 10. Product closure

| Item | Status | Closed by |
|---|---|---|
| SA-P3-02A | **Closed** | §9.1 (Preserve) |
| SA-P3-02B | **Closed** | §9.2 (element-level `mixed`; no span-level) |
| P9-TENSION-01 | **Closed** | §9.3: R-008 AC2 "phần nào" (which part) is read at the content-element level. This is not span-level provenance |
| PA-04A | **Closed, with a recorded reopen trigger** | §9.5 (N); VD-P9-01 |
| PA-04B | **Closed** | §9.6 (Runtime; all source-grounded numeric claims) |
| SA-P3-01 | **Closed** | §9.7 (Separate session) |
| PA-12 (R-008 note 1: how AI-added content is shown) | **Product semantic set; realization open as design** | §9.4: a DeckAgent UI layer, not slide content, not exported. The interaction is Detailed Design / UX |
| SA-P3-02 × PA-04B interaction (§2) | **Resolved** | Under Preserve, source-grounded content is declared source-derived or mixed and cited, so the §4.4 Relabel case (a grounding record separate from the label for A) does not arise |
| P5-TENSION-01 | **Not fired** | "Separate" does not change R-045, UC-011 or BR-012. It remains a reopen trigger only |
| PA-13 | Deferred (unchanged) | 08 §4 |

**Residual Product detail — non-blocking, not answered here.** §9.2 defines `mixed` for an element
that combines source-derived and AI-added content. Other combinations (for example source-derived
with user-stated content) are not addressed by the answer.

- This is not candidate-defining. In every candidate the label value set is part of PROV-01, and
  any rule that does not present non-source content as source-derived satisfies AC-03.
- It is carried to Detailed Design / Product detail. No rule is invented here.

No candidate-defining Product question remains open for A, B or C.

## 11. Triggered architecture consequences

Only consequences triggered by §9 are applied. Nothing else in the frozen configurations changes.

### 11.1 Common to A, B and C

**(a) Element-level `mixed` (SA-P3-02B).**

- The PROV-01 label value set becomes {source-derived, user-stated, AI-added, mixed}. This is
  within X-6 in all three candidates (§3.4). The origin representation stays element-level.
- **Verification input.** Under PROV-06, the model's declaration cites the source items (A, B) or
  source text (C) on which the source-derived part of a mixed element rests. The frozen PROV-06
  mechanism already works this way: "declared source spans verified against source items"
  (05 §5), and "declared source spans verified" (05 §6). This citation is verification input. It is
  not an origin label, it is not shown to the user, and it is not span-level provenance.
- **Consistency with §9.3:** holds. The user sees origin per element, and no per-span origin is
  tracked or displayed. The stop condition "element-level mixed inconsistent with the owner
  clarification" is not met.

**(b) Provenance presentation (§9.4).**

- All three candidates already hold an origin label on every element of every accepted and pending
  version (06 §5 AC-16). The clarification adds three realization obligations, none of which changes
  an axis:
  1. labels reach the DeckAgent UI layer together with the previewed version;
  2. indicators are rendered by that UI layer, outside the slide content;
  3. PPTX and PDF production does not emit indicators.
- **A:** the page receives the neutral-model value, labels included. A's writers ignore the origin
  field.
- **B:** labels are owned model fields. B's preview is converter-rendered images (OBS-05), so the UI
  layer reads labels from the model, not from the image. The frozen B option "carried into the
  export as hidden metadata only if Product needs it (PA-12)" (05 §5) is **not exercised**.
- **C:** labels are element attributes in the payload that the page renders. Indicators must stay
  outside the slide render; C also measures that render for validation (OBS-02), so they must not
  alter it. The web → PPTX converter and the PDF print path drop the attributes.

**(c) Runtime source-number check, all source-grounded numeric claims (PA-04B).**

- **Validation point:** the existing pre-admission gate, for generation and refinement:
  - A: stage 1;
  - B: VALID-01;
  - C: stage 1 (VALID-02).
  On failure, the frozen UC failure path runs (§9.6).
- **Grounding information:** under Preserve, faithfully paraphrased source content is declared
  source-derived or mixed, and cites its source (PROV-06). That citation, not the visible label,
  identifies source-grounded numeric claims. For a mixed element, the label says only "mixed"; the
  internal citation carries the grounding.
- **Verification-rule refinement (within PROV-06; high reversibility, 07 §13).** A numeric claim
  declared or cited as source-grounded that does not match the source **fails the result**. It is
  not downgraded to AI-added. A downgrade would display a source-grounded figure that does not
  match the source, which contradicts §9.6. Other unverifiable "source" claims keep the frozen
  downgrade rule.
- **Residual empirical question.** Does the declared-and-verified grounding capture every numeric
  claim whose factual grounding is the source? This includes numerals re-expressed in paraphrase
  ("ten million dollars") and source figures the model states without a citation.
  - This is information the selected check needs, and it is empirical. It falls under the frozen AC-10
    evidence class "Sp where the information a selected check needs is empirical" (06 §3).
  - It is recorded as the **numeric clause of AG-P5-01 (AG-P5-01-N)**. This extends the existing
    AG-P5-01 specification (08 §10). It is not a new spike, and it is not run.
    - **Added cases:** source figures re-expressed in other forms (words, units, rounding,
      percentages); source figures altered in paraphrase; source figures inside mixed elements;
      source figures stated without a citation.
    - **Pass (both required):**
      1. every altered source-grounded figure fails the check, with zero admitted;
      2. faithfully re-expressed figures pass at a rate Product accepts (a Final Testing Plan value).
    - **Fail:** AC-10 has no demonstrated source-number route. That leads to architecture review of
      the X-6 verification contract, which all three candidates share (as for an AG-P5-01 fail,
      08 §10).

**(d) PA-04A = N.**

- No G or R revision fires in any candidate. B's X-4 assumption (05 §5) holds.
- AG-01a, AG-01b-A and AG-01b-C are not decisive. VD-06, VD-07 and VD-08 (08 §21) are dormant; they
  become active only if PA-04A reopens (VD-P9-01).

**(e) SA-P3-01 = Separate.**

- **A, B:** the host authority keys one independent session per view. Each session has its own slot
  (OP-06 / OP-07), its own SESSION-02 mirror, and its own session-ending semantics. This is
  accommodated (05 §4, §5), with no axis change. Conformance is VD-P9-02.
- **C:** the frozen assumption "each page is a separate session" (05 §6) holds.

### 11.2 Candidate A — revision fired and applied

**Revision record** (the known branch of 08 §14):

| Field | Value |
|---|---|
| Axis | X-6 origin assignment |
| Frozen decision | PROV-05 by construction (MB-09 C), with SOURCE-02 |
| Failed assumption | "Rephrased source content is relabelled or not rephrased" (05 §4). Falsified by SA-P3-02A = Preserve |
| Revision applied | Variant M: **PROV-06 + PROV-01** (MB-09 M). SOURCE-02 source items are kept as the citation target |
| Unchanged axes | STATE-03 values with CAS guards; DELIV-01; OBS-01 + OBS-04 (MB-08 P); DEP-01; SESSION-01 + SESSION-02 |
| Revised configuration | **A-r1** |

**What changes in A's mechanisms (05 §4):**

- **Flow steps 3–4:** the model returns neutral-model content that declares origin per element and
  cites SOURCE-02 items (the structured-output contract, E-44). The system verifies each citation.
  Unverifiable "source" claims are downgraded, except a numeric mismatch, which fails the result
  (§11.1 c).
- **Stage 1 validation:** citation verification is added. The geometry stage is unchanged.
- **Labels:** the value set includes `mixed` (§11.1 a).
- The sub-element placement extension (§3.4) is **no longer needed**, because A no longer assigns
  origin by placement.

**Grounded-number requirement.** PROV-06 citations to SOURCE-02 items supply the grounding. No
grounding record separate from the label is needed, and no PROV-02 anchors are needed. The
requirement stays within the revision already authorized (08 §14), so **no architecture review**
is required.

**Identity check.**

- A-r1 still differs from B on X-1, X-2, X-3, X-4 and X-5. It now shares B's X-6 (PROV-06 with
  SOURCE-02).
- A-r1 still differs from C on X-1 … X-5 and on authority location. On X-6 it differs in the
  verification target: source items for A-r1, source text for C.
- It is a single-axis revision (08 §14), with no multi-axis restructuring.

**Gate / Observability re-assessment:**

| AC | Before (08 §17) | After | Reasoning |
|---|---|---|---|
| AC-03 | NYA (SA-P3-02) | **NYA — AG-P5-01** | The mechanism is now B's (06 §4 AC-03, Candidate B). Under Preserve, verification must judge paraphrase without admitting AI-added or user-stated content as source-derived. Mixed-element cases are in the AG-P5-01 case set (08 §10). Recommendation-only |
| AC-10 | NYA (PA-04 ± AG-01a / AG-01b-A) | **NYA — AG-P5-01-N** | Structural part holds: stage 1 has source items and citations before admission, and verdicts are observable (VALID-07). AG-01a and AG-01b-A are not decisive under N. The only open part is §11.1 (c). Recommendation-only |
| AC-16 | Meets | **Meets** (kept) | An element-level label, including `mixed`, is on every neutral-model element in every version. AC-16 requires no granularity; element level is the Product granularity (§9.3) |
| AC-06 | Meets | Meets (unchanged) | The added citation and number checks run before the success boundary |

All other A outcomes are unchanged. AC-30 is `Meets` (08 §14).

**Phase 6 claim deltas (07; not edited):**

| Claim | Delta |
|---|---|
| CH-5 | A moves from "PROV-05 with SOURCE-02" to "PROV-06 with SOURCE-02", the same as B. A's benefit "'source' can only be assigned by the system, so correctness is structural" (and 05 §4 "Origin cannot be mis-declared by the model") no longer holds. A now bears the B / C costs: the structured-output contract (E-44) and verification accuracy that must be demonstrated (AC-21, AC-25) |
| AC-24 provenance contrast | **Disappears**, as 07 §15 (SA-P3-02 row) anticipated. In 07 §13's X-6 row, A changes from "By construction (low)" to "Verification rules (high)" |
| P-02 | **Resolved; no longer applies.** A's X-6 is no longer a construction commitment |
| DS-06 | Answered: verification (PROV-06) for all three candidates |
| E-06 | Now covers A as well as B and C: AG-P5-01 is decisive for all three |
| P-04, E-01 | Under N, AG-01a and AG-01b do not bear on A's gate (unless VD-P9-01 reopens PA-04A) |

### 11.3 Candidate B — no revision

- X-4 MB-08 D holds (PA-04A = N).
- The grounded-number scope stays within PROV-06. Citations are retained as grounding data, and the
  §11.1 (c) rule refinement is local.
- Origin fields are not carried into the export (§11.1 b).

| AC | Before (08 §17) | After | Reasoning |
|---|---|---|---|
| AC-06 | NYA (PA-04) | **Meets** | Under N, every required pre-display check runs in VALID-01 before the success boundary: structural, constraint, origin and the PA-04B source-number check, all content-level. Delivery-time geometry is not a required pre-display check. This is the case 06 §4 AC-06 recorded as "would be met" under B's assumption |
| AC-10 | NYA (PA-04) | **NYA — AG-P5-01-N** | Structural part holds: VALID-01 has source items and declared spans before admission; VALID-05 / VALID-06 run before delivery; verdicts are observable (VALID-07). The only open part is §11.1 (c). Recommendation-only |
| AC-03 | NYA (SA-P3-02 ± AG-P5-01) | **NYA — AG-P5-01** | Decisive under Preserve, including mixed-element cases. Recommendation-only |
| AC-16 | Meets | **Meets** (kept) | Owned origin fields, including `mixed` |

All other B outcomes are unchanged: AC-01, AC-14 and AC-18 are `Meets` (S1b), and AC-30 is `Meets`
(08 §15).

**Phase 6 claim deltas:**

| Claim | Delta |
|---|---|
| P-01 | Under the current answer, B's delivery-only geometry is admissible. It is exposed to the VD-P9-01 reopen trigger |
| DS-07 | Answered for V1: HM-1 / HM-4 are not enforced before display. Post-display geometry (VALID-03, non-gating) is permitted |
| AC-24 (07 §15 PA-04 row; TC-03 "exposure to PA-04") | The exposure becomes exposure to the PA-04A reopen trigger. Moving N → G or R later triggers B's X-4 revision (08 §15), while A and C add checks within their X-4 (§4.6). This is recorded as a fact for Phase 7, not weighted |
| CH-2, AC-27 | Unchanged. Overflow caused by translation is still found after the pending version is shown |

### 11.4 Candidate C — no revision

- Page-held authority holds (SA-P3-01 = Separate).
- The grounded-number scope stays within PROV-06, verified against source text.

| AC | Before (08 §17) | After | Reasoning |
|---|---|---|---|
| AC-28 | NYA (SA-P3-01) | **Meets** | The Product session is the view (§9.7), and C's session boundary is the page. Each page-session has one slot, derived from its log (OP-06) and claimed by the conditional commit-plus-start append. So BR-014 "one operation per session" means one per page, and two views running two generations is Product-permitted. The other AC-28 clauses hold structurally within one page-session (06 §4 AC-28) |
| AC-30 | NYA (SA-P3-01) | **Meets** | Session-loss state is derived from the page's own log and read synchronously at every interception point of that session: New deck, reload, close. No other view holds that session's state or needs it. S2's control run showed in-page state driving the dismissal warning (Chrome 154), which is confidence only. SA-P4-01 stays closed, and P5-TENSION-01 has not fired |
| AC-03 | NYA (SA-P3-02 ± AG-P5-01) | **NYA — AG-P5-01** | As B, verified against source text. Recommendation-only |
| AC-10 | NYA (PA-04 ± AG-01b-C) | **NYA — AG-P5-01-N** | AG-01b-C is not decisive under N. Structural part holds: stage 1 has the source text and declared spans before admission; VALID-05 / VALID-06 run before delivery; outcomes are observable (VALID-07, VALID-08). Recommendation-only |
| AC-16 | Meets | **Meets** (kept) | Element attributes, including `mixed` |
| AC-02, AC-11 | NYA (AG-P4-01) | NYA — AG-P4-01 (unchanged) | Recommendation-only; not run |
| AC-06 | Meets | Meets (unchanged) | — |

**Phase 6 claim deltas:**

| Claim | Delta |
|---|---|
| P-03 | **Resolved.** "Each page is a separate session" is the Product session model |
| CH-3; TC-04 AC-24 | The exposure to SA-P3-01 ("shared session") is closed. The exposure to a Product change that reopens SA-P4-01 (P5-TENSION-01) stays |
| TC-04 AC-21 | "Session-loss state is read directly, with no mirror" stands |
| P-04, E-02 | Under N, AG-01b does not bear on C's gate (unless VD-P9-01 reopens PA-04A) |
| 05 §6 risk: export from the wrong tab | A consequence of the Product session model. It applies equally to A and B under Separate, and it is not an architecture defect |

## 12. Validation debt added by Phase 9

These entries extend the frozen register (08 §21), which is not edited.

| ID | Candidate | Assumption | Current basis | Validation required | Validate when | Consequence if it fails |
|---|---|---|---|---|---|---|
| VD-P9-01 | A, B, C | **PA-04A reopen trigger.** N is sufficient for V1 preview quality | Owner decision (§9.5) | Frequency and severity of HM-1 / HM-4 visual failures on generated decks, using the DOC-008 oracles. No threshold is set now | Implementation and Testing | PA-04A is reconsidered (G or R). If G or R is chosen: **A:** AG-01a (G) or AG-01b-A (R) becomes Gate evidence, then VD-06 / VD-07; the checks sit within A's X-4. **B:** CANDIDATE-REVISION-REQUIRED, X-4 MB-08 D → MB-08 P (08 §15). **C:** AG-01b-C becomes Gate evidence, then VD-08. None of this is performed now |
| VD-P9-02 | A, B | One independent host session per view: own state, own slot, own mirror; reload or close of one view ends only its own session, with its own warning | Reasoning (§11.1 e) | Two-view integration tests: concurrent operations; reload and close in one view while the other is mid-operation | Integration | Local fix in session scoping (high reversibility); no axis change |
| VD-P9-03 | A, B, C | Provenance indicators are absent from the slide content and from PPTX / PDF exports; labels are available in the UI layer for every accepted and pending version | Reasoning (§11.1 b) | Inspect exported packages and PDFs for indicators; check that the UI layer reads labels for each version | Testing | Local fix in the writers, converter or UI layer |

**The validation seam behind VD-P9-01.** In every candidate, a G or R check would be inserted at the
existing pre-admission gate:

- A and C already produce geometry before admission (OBS-01; OBS-02). They can measure HM-1 / HM-4
  without gating, and so collect the reopen evidence.
- B has no pre-admission geometry, which is why moving to G or R revises B. B's non-gating
  post-admission rendered evaluation (VALID-03, OBS-05) can report HM-1 / HM-4 meanwhile. That is
  non-blocking reporting (§4.3), compatible with N.

Collecting this evidence is not a runtime check under R-033, because it gates nothing.

## 13. Candidate readiness (08 §22 conditions 1–5)

Selection readiness governs entry into Phase 7. Recommendation readiness (08 §22 condition 6) is
separate, and it is not claimed for any candidate.

### Candidate A (A-r1)

1. **Triggered revisions:** X-6 PROV-05 → PROV-06 + PROV-01 (Variant M), applied as A-r1 and
   re-assessed (§11.2).
2. **Gate / Observability re-assessments:** AC-03 (open condition now AG-P5-01); AC-10 (open
   condition now AG-P5-01-N); AC-16 `Meets`; AC-06 `Meets`. Phase 6: CH-5, the AC-24 provenance
   contrast, P-02, DS-06, E-06, P-04, E-01.
3. **Candidate-defining Product question open:** none.
4. **Architecture review triggered:** none.
5. **Assumptions and validation debt:**
   - ASM-SESSION-01 (VD-05); AG-02a-A (VD-01); AG-02b (VD-04);
   - VD-P9-01, VD-P9-02, VD-P9-03;
   - verification accuracy (RG-04), which now applies to A.
6. **Selection readiness:** **Selection-ready.**
   - C1: no open Product question can change a candidate-defining decision.
   - C2: no `Does not meet`.
   - C3: the fired revision has been re-assessed.
   - C4: every empirical uncertainty is represented above.
   - C5: none too fundamental.
7. **Recommendation-only evidence:** AG-P5-01 (AC-03); AG-P5-01-N (AC-10).

### Candidate B

1. **Triggered revisions:** none. The within-X-6 label extension and the PROV-06 rule refinement
   are local.
2. **Gate / Observability re-assessments:** AC-06 → `Meets`; AC-10 (open condition now
   AG-P5-01-N); AC-03 (AG-P5-01); AC-16 `Meets`. Phase 6: P-01, DS-07, the AC-24 PA-04 exposure.
3. **Candidate-defining Product question open:** none. PA-04A is answered, and its reopen is a
   recorded trigger (VD-P9-01), not an open question.
4. **Architecture review triggered:** none.
5. **Assumptions and validation debt:**
   - ASM-SESSION-01 (VD-05); AG-02a-B (VD-02); AG-02b (VD-04); VD-09;
   - VD-P9-01, VD-P9-02, VD-P9-03.
6. **Selection readiness:** **Selection-ready** (C1–C5 hold).
7. **Recommendation-only evidence:** AG-P5-01 (AC-03); AG-P5-01-N (AC-10).

### Candidate C

1. **Triggered revisions:** none. The within-X-6 label extension and the PROV-06 rule refinement
   are local.
2. **Gate / Observability re-assessments:** AC-28 → `Meets`; AC-30 → `Meets`; AC-10 (open
   condition now AG-P5-01-N); AC-03 (AG-P5-01); AC-16 `Meets`. Phase 6: P-03, CH-3 / TC-04,
   P-04, E-02.
3. **Candidate-defining Product question open:** none.
4. **Architecture review triggered:** none.
5. **Assumptions and validation debt:**
   - confinement-contract realisability (pending AG-P4-01); AG-02a-C (VD-03); AG-02b (VD-04); VD-10;
   - VD-P9-01, VD-P9-03.
6. **Selection readiness:** **Selection-ready** (C1–C5 hold).
7. **Recommendation-only evidence:** AG-P4-01 (AC-02, AC-11); AG-P5-01 (AC-03); AG-P5-01-N (AC-10).

### Summary

| | A (A-r1) | B | C |
|---|---|---|---|
| Selection readiness | **Selection-ready** | **Selection-ready** | **Selection-ready** |
| Validation maturity | Reasoning-supported (unchanged) | Reasoning-supported (unchanged) | Reasoning-supported (unchanged) |
| Gate / Observability `Not yet assessable` | AC-03, AC-10 | AC-03, AC-10 | AC-02, AC-03, AC-10, AC-11 |
| `Does not meet` | None | None | None |
| Recommendation-ready | No | No | No |

**Shared evidence note (not a ranking).** AG-P5-01 and its numeric clause now bear on all three
candidates. Their fail consequence, architecture review of the X-6 verification contract, is common
to all three. They do not separate the candidates, but they stand before any recommendation.

## 14. P8-GUARDRAIL-01

Candidate-level entry is evaluated first (§13). A-r1, B and C each satisfy conditions 1–5, so
**three candidates are selection-ready**.

**Materially distinct.** Yes:

| Axis | A-r1 | B | C |
|---|---|---|---|
| X-1 state shape | Values (STATE-03) | Slots (STATE-02) | Log (STATE-04) |
| X-2 coordination | Compare-and-set | Serialized channel | Conditional appends |
| X-3 content form | Neutral model (DELIV-01) | PPTX-shaped (DELIV-02a) | Web form (DELIV-03 native) |
| X-4 validation placement | MB-08 P, computed geometry | MB-08 D | MB-08 P, render then measure |
| X-5 runtime boundary | DEP-01 | DEP-01 + DEP-03 | DEP-01 + DEP-02c |
| X-6 origin assignment | PROV-06, source items | PROV-06, source items | PROV-06, source text |
| Authority location | Application process | Application process | Page |

The revision removed the A / B difference on X-6. A-r1 and B still differ on five axes, and C
differs from both on at least five axes plus authority location.

**Result:** at least two materially distinct candidates are selection-ready. **P8-GUARDRAIL-01 is
satisfied without an owner exclusion.** No candidate is excluded.

## 15. May Phase 7 begin?

**The Phase 7 entry contract (08 §22) is satisfied at both levels:**

- candidate level: A-r1, B and C satisfy conditions 1–5;
- phase level: P8-GUARDRAIL-01 is satisfied.

**Phase 7 — W-035 baseline architecture selection — may begin when the owner instructs it. It has
not begun.**

Carried into Phase 7:

- the A-r1 configuration and the Phase 6 claim deltas in §11. Phase 7 revisits the frozen 07
  comparisons where these changed them;
- the §12 debt and the 08 §21 register;
- the recommendation condition (08 §22 condition 6). No candidate may be recommended while it has
  a `Not yet assessable` outcome:
  - A-r1 and B need AG-P5-01 and AG-P5-01-N;
  - C needs AG-P4-01, AG-P5-01 and AG-P5-01-N.

## Product Owner Decisions (recorded 2026-09-30; see §9)

### SA-P3-02A — Paraphrase origin

Faithful paraphrase of source content:
- [ ] Relabel as AI-added
- [x] Preserve source-derived origin

### SA-P3-02B — Mixed-origin composition

May one element contain multiple origins?
- [ ] No
- [x] Yes

If yes:
- [x] Element-level `mixed` label (confirmed against R-008 AC2 "which part" at element level; P9-TENSION-01 closed, §9.3)
- [ ] Span-level provenance

### PA-04A — Runtime layout/render validation

- [x] N — no HM-1/HM-4 per-result runtime geometry/render enforcement
- [ ] G — geometry-based validation required
- [ ] R — rendered-output validation required

### PA-04B — Source-number validation timing

- [x] Runtime
- [ ] Testing only

If Runtime, validation scope:
- [x] All numeric claims grounded in the source
- [ ] Only content explicitly labelled source-derived
- [ ] Other: __________________

Additional runtime checks:
`none selected beyond PA-04B (structural and content-level validation preserved)`

### SA-P3-01 — Second browser view

- [ ] Shared session
- [x] Separate session
- [ ] Refuse second view
- [ ] Take over existing session

If Shared:
Reload/close one view:
- [ ] Ends the shared session for all views
- [ ] Detaches only that view

If Take over:

Required Product behavior:
- takeover must warn before undownloaded work would be lost;
- user must be able to cancel.

Optional Product preference for warning placement (not applicable; Take over not selected):
`________________________________`

If blank, warning placement remains an architecture / interaction-design decision.
