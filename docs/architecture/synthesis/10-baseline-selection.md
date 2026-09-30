# Phase 7 — W-035 Baseline Architecture Selection

Status: **W-035 completed — Candidate B selected as the DeckAgent V1 architecture baseline. All
of B's required Gate and Observability criteria are satisfied (DOC-004 §5); the remaining empirical
work is post-baseline validation debt** (§10, §11; Revision 2, 2026-09-30).

- B is selected for V1 Detailed Design and implementation.
- AC-03 and AC-10 were re-assessed against DOC-004's canonical text. Both are `Meets` by labelled
  structural reasoning (§10.1, §10.2).
- Verifier accuracy and the completeness of the numeric check are post-baseline validation debt and
  Testing evidence (§10.3, §14).
- P7-TENSION-01 is closed without any change to DOC-004 (§9).
- Future evidence may reopen the affected decisions (§15).
- A-r1 is the primary alternative. C is a documented alternative.
- No candidate is scored or ranked.
- Frozen files 01–09 were not edited.

**Revision history:**

- **Revision 0** (2026-09-30). Stage A comparison (§2–§7) and evidence work (§8). It stopped with
  `NO BASELINE SELECTED`, because recommendation readiness was treated as a prerequisite for
  selection. That record is kept in Appendix R0.
- **Revision 1** (2026-09-30). The owner clarified the architecture-selection philosophy. That
  clarification is recorded as **P7-PROCESS-CORRECTION-01** (§9). The evidence is reclassified
  (§10), the W-035 decision is made (§11–§15), and the §1, §7 and §8 dispositions are annotated.
  Stage A reasoning and the executed evidence are unchanged.
- **Revision 2** (2026-09-30). Governance reconciliation. AC-03 and AC-10 were re-assessed against
  DOC-004's wording, and both are `Meets` for B. AG-P5-01 and AG-P5-01-N were reclassified.
  P7-TENSION-01 is closed, and DOC-004 is unchanged (§9, §10). §11, §14, §15 and §17 were aligned.
  B remains selected.

Method: progressive convergence (08 §1.1).

`current evidence → baseline decision → implementation evidence → validate assumptions → keep or reopen`

Trade-offs are compared in writing only (DOC-004 §4, §9): no scores, weights or points.

## 1. Status and frozen inputs

**Phase 7 has begun.** It was entered under the 08 §22 contract, as satisfied in 09 §13–§15.

**Frozen inputs.** Hash prefixes are sha256, first 16 hex. They were taken at the start of Phase 7
and re-checked at its end (§17). They are a historical record of the synthesis-time freeze check,
not a current integrity assertion: after canonicalization, Git history is the integrity record
for the finalized artifacts.

| File | Hash prefix | Matches the prior record |
|---|---|---|
| `01-context.md` | `e9b64ac005cd885a` | Yes (08 §2; 09 run) |
| `02-problem-map.md` | `bc5a1e134fb4e7c2` | Yes |
| `03-decision-bank.md` | `6055cd7c8dbc6d77` | Yes |
| `04-decision-graph.md` | `0ad50991f9002f73` | Yes |
| `05-candidates.md` | `eda1d9a90f471944` | Yes |
| `06-evaluation.md` | `cb77696f3e53833a` | Yes |
| `07-tradeoff-comparison.md` | `773a397796444aee` | Yes |
| `08-evidence-resolution.md` | `97c4677192011ee9` | Yes (Phase 9 record) |
| `09-product-semantics-resolution.md` | `709da9678ef5e2ac` | Hash at Phase 7 start (09 is "complete / ready to freeze") |

Also read, and not edited:

- DOC-004 (`docs/architecture/architecture-acceptance-criteria.md`);
- DOC-008 (`docs/testing/testing-approach.md`);
- the Project Hub snapshot.

**Comparison set:** A-r1, B and C (§2).

**Selection entry (08 §22, conditions 1–5):** all three satisfy it (09 §13). P8-GUARDRAIL-01 is
satisfied without an owner exclusion (09 §14).

**Recommendation evidence outstanding at entry (08 §22, condition 6).** Revision 2 disposes of
it (§10):

- AG-P5-01 and AG-P5-01-N are not needed to decide AC-03 or AC-10. They are post-baseline
  validation and Testing evidence.
- AG-P4-01 remains open, for C only.

| Candidate | Evidence | Decides |
|---|---|---|
| A-r1 | AG-P5-01; AG-P5-01-N | AC-03; AC-10 |
| B | AG-P5-01; AG-P5-01-N | AC-03; AC-10 |
| C | AG-P4-01; AG-P5-01; AG-P5-01-N | AC-02 and AC-11; AC-03; AC-10 |

**Product decisions treated as fixed (09 §9; not reopened):**

- **SA-P3-02A:** Preserve.
- **SA-P3-02B:** element-level `mixed`; R-008 AC2 is read at element granularity.
- **Provenance display (09 §9.4):** origin is UI-layer metadata; it is not slide content and is not
  exported.
- **PA-04A:** N, with reopen trigger VD-P9-01.
- **PA-04B:** Runtime; the scope is all numeric claims grounded in the source.
- **SA-P3-01:** Separate session.

## 2. Current candidate configurations

| Axis | A-r1 | B | C |
|---|---|---|---|
| X-1 state | STATE-03 immutable values + references | STATE-02 mutable slots + candidate areas | STATE-04 log + immutable payloads |
| X-2 coordination | Guarded compare-and-set (MB-05 G) | Serialized command channel (MB-05 S) | Guarded conditional appends (MB-05 G) |
| X-3 content form | DELIV-01 neutral model | DELIV-02a PPTX-shaped model | DELIV-03 native web form |
| X-4 validation / geometry | MB-08 P: computed geometry (OBS-01) before admission; headless render (OBS-04) | MB-08 D: content-only gate; geometry from files at delivery | MB-08 P: render then measure (OBS-02 / OBS-04) before admission |
| X-5 runtime boundary | DEP-01 in-process ports | DEP-01 + DEP-03 local worker | DEP-01 + DEP-02c confined external runtime |
| X-6 origin assignment | PROV-06 + PROV-01, verified against SOURCE-02 items (09 §11.2) | PROV-06 + PROV-01, verified against SOURCE-02 items | PROV-06 + PROV-01, verified against source text |
| Authority | Application process | Application process (worker holds no state) | Page (one session per page) |
| Session-loss evaluation | SESSION-01 + SESSION-02 mirror (required, S2) | Same as A-r1 | Direct log reads, no mirror |

**Common to all three, from Phase 9 (09 §11.1):**

- **Origin labels:** the label set is {source-derived, user-stated, AI-added, mixed}.
- **Internal citations:** declared citations are PROV-06 verification input. They are not
  span-level provenance.
- **Numeric mismatch:** a source-grounded numeric claim that does not match the source fails the
  result.
- **Provenance display:** labels reach the UI layer; the slide render and the exports carry no
  indicators.

**What each current configuration means under PA-04A = N:**

- **A-r1 and C:** the gating role of the pre-admission geometry stage is dormant, because no HM-1 or
  HM-4 check is selected. The stage remains as the VD-P9-01 evidence seam and as the in-axis
  landing point if G or R is chosen later.
- **B:** its X-4 assumption holds exactly.

## 3. Phase-6 rebasing for A-r1

Phase 6 (07) compared the frozen A. The table re-reads only the claims that A's X-6 revision
(PROV-05 → PROV-06 + PROV-01) affects. 07 is not edited.

| Phase-6 claim | Frozen claim (07) | A-r1 delta | Current Phase-7 interpretation |
|---|---|---|---|
| **CH-5** provenance chain (§12) | A: PROV-05 + SOURCE-02. Benefit: "'source' can only be assigned by the system, so correctness is structural". Cost: ingestion and AI contract shaped by construction; low reversibility. B, C: E-44 structured output; verification accuracy to be demonstrated | A-r1 uses PROV-06 + SOURCE-02, as B does | CH-5 **no longer separates the candidates**. All three bear the E-44 contract, verification accuracy (AG-P5-01) and the numeric check (AG-P5-01-N). The only remaining difference is the verification target: extracted items (A-r1, B) or source text (C) |
| **AC-24 provenance contrast** (§8 A cost; §8 cross-candidate "A's Product-sensitive reopen touches the provenance and ingestion contract"; §13 X-6 row "By construction (low)") | A's X-6 was a low-reversibility, Product-sensitive commitment | X-6 becomes verification rules (high) | **Disappears.** X-6 is high reversibility in all three. A-r1's low-reversibility commitments are STATE-03 and DELIV-01 |
| **P-02** (§18) | "A's provenance is a low-reversibility construction commitment", Product-sensitive on SA-P3-02 | SA-P3-02 answered; the revision is applied | **No longer applies** |
| **DS-06** (§17) | Construction (A) or verification (B, C); needs SA-P3-02 | — | **Answered:** verification in all three. It is no longer a W-035 decision surface |
| **E-06** (§18) | B's and C's verified provenance keeps non-source content from passing as source (AG-P5-01) | Now covers A-r1 | Evidence-sensitive **for all three** on AG-P5-01, with a shared fail consequence (08 §10) |
| **TC-07** provenance by construction (§16) | A: AC-25 "no verification prototype needed"; AC-21 source-item extraction and an AI contract that references items; AC-24 low reversibility | Does not apply to A-r1 | **Withdrawn for A-r1.** Its AC-25 benefit is gone, and its AC-24 cost is gone |
| **TC-08** model-declared, verified provenance (§16) | B, C: AC-24 "either SA-P3-02 answer accommodated"; AC-21 E-44; AC-25 accuracy must be demonstrated | Now A-r1, B and C | Applies to all three. The "either answer accommodated" option value is spent (Preserve chosen), but the verification rules stay high reversibility |
| **AC-21, A implementation surface** (§5) | "source-item extraction for by-construction placement" | — | Source-item extraction as the citation target, **plus** the E-44 output contract, citation verification and the PA-04B numeric check. A-r1's provenance subsystem is now the same kind of subsystem as B's |
| **AC-25, A** (§9) | Gate and lifecycle tests need no browser, converter or second process; provenance correctness structural | — | Unchanged for lifecycle tests. A-r1 now also needs verification-accuracy testing, which is Rubric-class (DOC-008 §4.1 R-007 rows), exactly as B and C |
| **AC-23, A assumption failures** (§7) | "the other SA-P3-02 answer changes X-6, which touches ingestion and the AI output contract" | Fired and absorbed (A-r1) | A-r1's remaining X-6 failure surface is the **shared** AG-P5-01 / AG-P5-01-N fail: architecture review of the verification contract for all three |
| **07 §7 cross-candidate "how far a failed assumption spreads"** | A: X-6 or X-3 | — | A-r1: X-3, plus the shared X-6 verification review |
| **05 §4 benefit** (used by 07 §5, §12) | "Origin cannot be mis-declared by the model" | — | No longer holds for A-r1 |
| **05 §4 risk** | "By-construction origin blocks legitimate tone or audience refinements" | — | Resolved by the revision |
| **§19 handoff "provenance" line** | By construction (A); verified (B, C) | — | Verified in all three |
| **§13 "low-reversibility locations"** | Includes "the provenance construction in A" | — | Removed |
| **§15 SA-P3-02 row** | "Keeps source origin" moves A's X-6 to Variant M; the AC-24 contrast disappears; AG-P5-01 becomes decisive for B and C | Happened | As 07 anticipated. AG-P5-01 is decisive for all three |

**Other frozen deltas the comparison uses.** These are already recorded, and repeated here only so
that §4–§7 read against the current state.

| Phase-6 item | Current reading | Recorded in |
|---|---|---|
| E-07; the AG-09 row; the AC-25 staleness tests | For A-r1 and B, the page mirror is required at dismissal (S2); ASM-SESSION-01 carries it; race tests are certain | 08 §8, §14, §15; VD-05 |
| E-03 (B converter) | Availability demonstrated on the tested machine (S1b); cost 1.9–5.5 s per conversion, 15.4 s cold start; the fidelity part is carried as AG-02a-B and AG-02b | 08 §7, §15; VD-02, VD-09 |
| E-04 (AG-02) | Carried as the explicit assumption AG-02a per candidate, candidate-invalidating; AG-02b deferred (D-026) | 08 §11; VD-01 … VD-04 |
| P-01, DS-07, TC-03 AC-24 | Under N, B's delivery-time geometry is admissible; its exposure is now to the PA-04A reopen trigger | 09 §11.3; VD-P9-01 |
| P-03, CH-3, TC-04, DS-05 | Under Separate, C's page session is the Product session. Its exposure to P5-TENSION-01 (reload reattachment) remains | 09 §11.4 |
| P-04, E-01, E-02 | Under N, AG-01a and AG-01b do not bear on any gate | 09 §11.2–§11.4 |
| E-05 (C runtime) | Still evidence-sensitive. S3 / S3b (§8.3) add that confinement depends on configuration and that the runtime has a startup footprint | This file §8.3 |

## 4. Stable facts vs unresolved evidence

### 4.1 Shared, non-separating evidence

This evidence bears on all three candidates in the same way. It is **not** used as a comparative
advantage.

| Evidence | Bears on | Why it does not separate the candidates |
|---|---|---|
| **AG-P5-01** (AC-03) | A-r1, B, C | Same contract (PROV-06 + PROV-01, element-level labels, `mixed`) and the same fail consequence: architecture review of the X-6 verification contract for all three (08 §10). The target differs (items vs source text), but paraphrase judgement is the same problem against either target. A spike should cover both targets, or show that the result does not depend on the target (§8.2) |
| **AG-P5-01-N** (AC-10) | A-r1, B, C | Same numeric rule (09 §11.1 c), the same grounding question (does declared grounding capture every source-grounded figure?), and the same fail consequence |
| **AG-02b** per-application fidelity | A-r1, B, C | Deferred by D-026, with the comparator PA-13 unset. Its eventual *direction* of drift differs by candidate (see AG-02a below), but no evidence exists yet for any |
| **VD-P9-03** (indicators absent from slides and exports) | A-r1, B, C | A local fix in the writers, converter or UI layer in every candidate |
| **Model-provider behaviour** (AG-03 cost, AG-05 declaration) | A-r1, B, C | Cost and confidence only; the provider is not chosen (§16.2) |
| **AG-P6-01** team capability | A-r1, B, C | Missing for every candidate. It cannot be used to prefer any of them |

**AG-02a is shared in kind but separating in consequence.** Every candidate must reach native,
editable PPTX and PDF (R-027, R-025), so the assumption exists in all three. Its basis and its
failure consequence differ (08 §11, §21):

| | Basis | If AG-02a fails |
|---|---|---|
| A-r1 | Reasoning, plus external evidence that native objects can be written programmatically (S1 / S1b) | A narrowing branch: narrow the model to writer-expressible features |
| B | S1 / S1b: native objects written from a structured description render deterministically | No branch within X-3 |
| C | Reasoning only | No branch within X-3; the screenshot variant is excluded |

It is therefore used comparatively, as a risk. It is not treated as fact (08 §22).

### 4.2 Candidate-separating consequences

Each row is a current difference that can legitimately bear on the baseline decision. The source of
each claim is cited.

| Dimension | A-r1 | B | C | Basis |
|---|---|---|---|---|
| State model | Values; rollback and export by reference; every kept value retained | Slots; copies at admission and export | Log; derived state; native history; the log grows | 05 §4–§6; 07 CH-3 |
| Coordination | CAS guards inside the state mechanics | One channel orders every action; a session-wide stall point; low reversibility | Conditional appends inside the log | 07 §13 |
| Representation | Neutral model; no output is native to it | PPTX-shaped; the primary deliverable is native to the form | Web form; preview and PDF are native to it, PPTX is converted | 07 CH-1, TC-09 |
| Preview / render path | Web render of the model: page, plus headless OBS-04 for AC-18 | The converter renders the produced PPTX, after admission | The page renders the payload | 06 §5 AC-14, AC-18 |
| Representation translations between the previewed form and the PPTX file | Two independent renders of one model (web; PPTX in its reader) | None beyond the renderer: the preview is a render of the same file | The web render is converted to PPTX at measured positions | Labelled reasoning over 05 flows |
| Validation placement under N | Content-level gate; the geometry stage is dormant but present | Content-level gate; X-4 matches N exactly | Content-level gate; the render / measure stage is dormant but present in the operation lifetime | 09 §11.1 d; this file §2 |
| Runtime / process boundary | One process | Authority process, worker and converter | Page, stateless host and external runtime | 07 CH-4 |
| Authority location | Application process, hosting one session per view (Separate) | Same as A-r1 | Each page | 09 §11.1 e |
| Delivery / export seams | Model → PPTX writer; model → PDF (writer or print of the render) | Model → PPTX serializer; PPTX → PDF converter; VALID-06 round trip | Measured web form → native PPTX converter; PDF printed from the render; VALID-06 | 05 flows |
| Operational complexity | Lowest process count. Needs a headless browser render path (AC-18) | A converter must be present on each user machine (VD-09); per-conversion latency on the preview path | A page, a host and a runtime with version-sensitive confinement (VD-10; S3) | 07 §14; 08 §7; §8.3 |
| Low-reversibility commitments | STATE-03, DELIV-01 | DELIV-02a, STATE-02, the channel | STATE-04, DELIV-03, page authority | 05 *Reversibility*; §3 |
| Failure isolation | None at process level. One fault ends every open session (Separate: one process, many sessions) | AI and render faults contained in the worker; an authority crash ends every session; the channel can stall | A page crash ends only that page's session; host and runtime faults become operation failures | 07 §7; labelled reasoning on 09 §11.1 e |
| Dependency risk | AI port; headless browser; PPTX writing (owned or library, P6-TENSION-01) | AI port; one converter serving preview, PDF and geometry together | Confined runtime; browser engine; web → PPTX converter | 07 §6 |
| Product-change sensitivity | PA-04A → G or R: within X-4. Reattachment, shared session or persistence: accommodated by host authority | PA-04A → G or R: **X-4 revision** (08 §15). Reattachment or shared session: accommodated | PA-04A → G or R: within X-4 via AG-01b-C. Reattachment or shared session: **authority relocation / review** | 09 §5.4, §4.6; 05 §6 |
| Candidate-specific Gate evidence open | None | None | AG-P4-01 (AC-02, AC-11) | 09 §13; §8.3 |

## 5. AC-21 … AC-27 trade-off comparison

Kinds of statement are labelled throughout:

- **[S]** structural fact;
- **[E]** evidence-backed claim;
- **[A]** assumption;
- **[D]** validation debt.

No criterion is scored.

### AC-21 — Team feasibility and learning curve

**What it asks now.** Which custom or unfamiliar subsystems each candidate needs, relative to a
limited team (C-002). The "relative to capacity" half **cannot be closed**: no team-capability
record exists (AG-P6-01), and none is inferred here.

- **A-r1** [S]:
  - It owns a neutral model, a web render of it (page and headless), a PPTX writer, and a PDF path
    (a writer or a print of the render).
  - It owns a layout computation (OBS-01). Under N, its text-metric accuracy is no longer
    gate-critical, because AG-01a is not decisive (09 §11.2).
  - It now also owns PROV-06 verification, the E-44 output contract and the numeric check, like B.
  - Values with CAS; one process; a SESSION-02 mirror.
- **B** [S]:
  - A PPTX-shaped model and serializer.
  - A command channel with coordinators, a worker process with its message protocol and lifecycle,
    and converter integration (preview, PDF, geometry).
  - VALID-06 round-trip re-reading; PROV-06 verification and the numeric check; a SESSION-02
    mirror.
- **C** [S]:
  - Log derivation and conditional appends; a constraint ledger.
  - A render-and-measure stage and a web → native PPTX converter.
  - Runtime integration under a confinement contract. [E] S3 shows that the contract holds only
    in a specific configuration (§8.3).
  - PROV-06 verification against text, plus the numeric check.
- **Trade-off.** The custom complexity sits in different places:
  - A-r1: presentation code — model, renderer, writers;
  - B: process and protocol code, plus integration of an external converter;
  - C: log derivation, the conversion that 05 §6 rates as the "high" part, and runtime confinement.

  The provenance subsystem is now common to all three, so it is not a differentiator.
- **Classification.**
  - [S] The subsystem lists (05 §4–§6).
  - [E] S1 / S1b: programmatic native-object writing works, which bears on A-r1's and B's writers.
    S3: confinement configuration work is real for C.
  - [A] Whether any subsystem is "very large" in C-002's sense.
  - [D] AG-P6-01.
- **Reversibility.**
  - A-r1 can add a worker later (DEP-03, high).
  - B can fold the worker in-process (medium).
  - C can drop the external runtime for DEP-01 ports (medium).

### AC-22 — External dependency cost

**What it asks now.** Which external parts sit on the Core Flow critical path, how replaceable
they are, and what happens when one fails or changes.

- **A-r1:**
  - [S] The AI provider sits behind an in-process port, replaceable at one adapter.
  - [S] A headless browser render path serves AC-18 and preview geometry (06 §5), and possibly the
    PDF.
  - [S] The PPTX writing library, if one is used (P6-TENSION-01), is on the export path only.
  - [S] No converter is on the preview or admission path.
  - [A] After a stop, outstanding provider calls complete and are discarded (AG-03 cost).
- **B:**
  - [S] The AI provider is called from the worker.
  - [S] One PPTX → image / PDF converter serves the preview, the PDF export and the geometry
    together. [E] S1b: available and deterministic on the tested machine; about 1.9–5.5 s per
    conversion, 15.4 s cold start.
  - [D] VD-09: availability on user machines, concurrency and crash behaviour. D-027 makes this a
    per-user-machine requirement.
  - [S] A converter change or failure touches three paths at once.
  - [S] Stop terminates the worker's local work.
- **C:**
  - [S] The external agent runtime sits on the generation path.
  - [S] The browser engine serves the gate, the preview and the PDF.
  - [S] A web → PPTX converter sits on the export path.
  - [E] S3 / K2: in its default configuration, the tested runtime sent a workspace `CLAUDE.md`
    to the provider and scanned the temp directory. Only the bare configuration kept to the
    declared flow.
  - [S] C-14: confinement removes most of the runtime's benefit.
  - [D] VD-10: every runtime version and configuration must be re-verified.
- **Trade-off.**
  - B concentrates dependency risk in **one external converter that has three roles**, which must
    be available on every user machine.
  - C places a **version- and configuration-sensitive runtime** on the generation path and keeps
    little of its reuse benefit.
  - A-r1's external surface is the smallest in kind, but it moves cost into owned code (AC-21).
- **Reversibility.**
  - A-r1: a writer change is export-only.
  - B: replacing the converter touches preview, PDF and geometry.
  - C: a runtime change needs re-verification; dropping the runtime is medium reversibility.

### AC-23 — Blast radius

**What it asks now.** How far a runtime fault, and how far a failed assumption, spreads.

- **Runtime faults [S]:**
  - **A-r1:** an in-process fault ends the authority process. Under Separate, that process hosts
    one session per view, so **every open session** is lost (labelled reasoning on 09 §11.1 e).
    Provider errors are operation failures.
  - **B:** AI and render faults are contained by the worker, and their outcome depends on the
    lifecycle point (07 §7). An authority-process crash loses every session. The channel is a
    session-wide stall point.
  - **C:** a page crash loses only that page's session. Host and runtime faults become operation
    failures. Nothing outside a page can corrupt its state.
- **Assumption failures:**
  - **A-r1:**
    - AG-02a leads to X-3, with a narrowing branch;
    - a PA-04A reopen stays within X-4 (AG-01a then decisive);
    - the shared X-6 verification review.
  - **B:**
    - a PA-04A reopen is an X-4 revision: a render moves into the operation lifetime, with stop
      latency;
    - AG-02a or VD-09 failing leaves no branch within X-3;
    - the shared X-6 review.
  - **C:**
    - a Product change to reattachment, shared session or persistence relocates the authority;
    - AG-02a failing leaves no branch;
    - an AG-P4-01 fail changes X-5 only;
    - a PA-04A reopen together with an AG-01b-C fail changes X-4;
    - the shared X-6 review.
- **Trade-off.**
  - C isolates runtime faults per session most narrowly, but has the widest Product-sensitive
    assumption surface.
  - A-r1 has the least runtime isolation (fixable by adding DEP-03, high reversibility), but the
    fewest assumption failures without a branch.
  - B contains AI and render faults, but two of its assumption failures have no branch.
- **Classification.**
  - [S] Boundaries.
  - [A] How likely any trigger is; none is known.
  - [D] VD-05 and VD-P9-02 (A-r1, B); VD-09 (B); VD-10 (C).

### AC-24 — Rollback and redesign cost

**What it asks now.** Which choices are costly to reverse, and which recorded reopen conditions
would force a redesign.

- **Low-reversibility commitments [S]:**
  - A-r1: STATE-03, DELIV-01 (PROV-05 has been removed, §3);
  - B: DELIV-02a, STATE-02, the serialized channel;
  - C: STATE-04, DELIV-03, page authority.
- **Recorded reopen triggers that reach those commitments:**
  - **A-r1:** AG-02a (X-3; a narrowing branch exists). No Product trigger in the current synthesis
    reaches a low-reversibility A-r1 commitment.
  - **B:**
    - AG-02a and VD-09 (X-3; no branch);
    - VD-P9-01, a PA-04A reopen, reaches X-4 and the operation lifetime (a revision, 08 §15). X-4
      is not listed as low reversibility, but the change is a restructuring of the admission path.
  - **C:**
    - AG-02a (X-3; no branch);
    - P5-TENSION-01, reload reattachment (page authority);
    - a shared-session or persistence Product change (page authority).
- **Trade-off.**
  - The frozen AC-24 contrast on provenance has **disappeared** (§3).
  - What remains:
    - A-r1 keeps its low-reversibility commitments away from every currently recorded Product
      reopen trigger;
    - B's exposure is validation placement, through the PA-04A trigger;
    - C's is authority placement, through session semantics.
  - X-3 is low reversibility in all three. Only A-r1 has a recorded branch within X-3.
- **Classification.**
  - [S] Reversibility (05; 07 §13).
  - [A] Whether any Product trigger fires; the owner has recorded VD-P9-01 as plausible, with no
    threshold.
  - [D] VD-01 … VD-03, VD-09, VD-P9-01.

### AC-25 — Testability cost

**What it asks now.** The effort to verify P1, P2, P3 and P5 and the lifecycle, and to meet
AC-14 … AC-20.

- **Shared [S]:**
  - Verification-accuracy testing is now needed for provenance and numeric grounding in all three.
    It is Rubric-class work (DOC-008 §2.2, §4.1): two raters, a third arbitrating paraphrase.
  - Under N, the selected runtime checks (structural, content-level, source-number) are all
    content-level, and every candidate can run them before display.
- **A-r1 [S]:**
  - Lifecycle and gate tests run in one process; TN-3 substitution at in-process ports; TN-5
    against the authority.
  - Output degradation is found by test-side comparison (no VALID-06).
  - [D] Mirror race tests (VD-05) and two-view tests (VD-P9-02).
- **B [S]:**
  - Order-based command tests; cross-process hold-and-release for stop and late results.
  - Geometry, preview and rendered-view tests need the worker and the converter.
  - VALID-06 evidence at every export.
  - [D] VD-05, VD-P9-02, VD-09.
- **C [S]:**
  - Log replay; runtime-port substitution.
  - Lifecycle, gate and non-UI tests need a page context.
  - VALID-06 against the measured render.
  - [D] Confinement conformance per runtime version and configuration (VD-10). [E] The S3 harness
    is reusable.
- **Trade-off.**
  - A-r1 has the lightest lifecycle-test environment.
  - B has the most real-file degradation evidence.
  - C has the most complete lifecycle record, but needs a page context and a recurring
    confinement suite.
  - Under N, HM-1 and HM-4 are test oracles in all three:
    - A-r1 and C can also measure before admission without gating (the VD-P9-01 seam);
    - B measures after admission (VALID-03) and at export.
- **Reversibility.** Test environments follow X-5 and authority placement. No new commitment.

### AC-26 — Output-target extensibility

**What it asks now.** The cost of a further output format, and whether its impact stays on the
export side. C-003 expects further formats; none is named.

- **[S] Unchanged from 07 §10 / TC-09:**
  - A-r1: a writer per target over one model; a large capability model (NPC-12).
  - B: PPTX-derived targets through a converter, or a second writer; PPTX concepts carried into
    other targets.
  - C: web and image targets are native; other targets need converters.
- **New but shared:** every writer or converter must also omit provenance indicators (VD-P9-03).
- **Trade-off.** It depends on which formats come next. The sources name none, so no candidate has
  a demonstrable advantage now.

### AC-27 — Translation readiness

**What it asks now.** Whether whole-deck translation (R-044) can run as a deck-level refinement,
what happens to layout, and how it interacts with constraints.

- **[S] Common:**
  - All three route translation through the normal refinement path.
  - Under N, **no candidate gates translated overflow before display**, so a translated result with
    overflow can be shown in any of them.
  - Translated source-grounded figures stay inside the PA-04B numeric scope. Cross-language number
    forms (words, decimal separators, scale words) stress AG-P5-01-N equally in all three.
- **Differences [S]:**
  - When fit knowledge is available for non-gating reporting: before admission (A-r1 computed;
    C measured) or after admission and at export (B).
  - If PA-04A reopens:
    - A-r1 absorbs it within X-4, and translation puts the whole weight on computed-layout accuracy
      (AG-01a);
    - C absorbs it within X-4 (AG-01b-C);
    - B restructures X-4.
  - The constraint lives in the value, the slot or the ledger respectively.
- **Trade-off.** Under the current Product answer, readiness is equal. The difference is option
  value if PA-04A reopens, and that favours the candidates that already have pre-admission
  geometry.
- **Classification.** [A] Whether PA-04A reopens. [D] VD-P9-01.

## 6. Candidate consequence chains

### A-r1 — value-oriented neutral model

**Main chains:**

- **Representation.** Neutral model → DeckAgent owns the presentation semantics → three output
  paths (web render, PPTX writer, PDF) from one model → no output is native, so every target is a
  translation → a large capability model (NPC-12) → preview-vs-PPTX agreement (R-028) rests on two
  independent renders agreeing: AG-02a, then AG-02b.
- **State.** Immutable values + CAS → rollback, reject and export stability by reference → no copy
  step → every kept value is retained in memory.
- **Geometry.** Computed layout before admission → under N, dormant as a gate → kept as the
  VD-P9-01 seam and the landing point for G.
- **Runtime.** One process → no protocol → no fault isolation. Under Separate, one fault ends every
  view's session → DEP-03 can be added later.
- **Provenance.** PROV-06 over SOURCE-02 items → shares B's verification contract and its evidence
  (AG-P5-01, AG-P5-01-N).

**Summary:**

| Aspect | A-r1 |
|---|---|
| Strongest benefits | The smallest process and runtime footprint. No converter on user machines. Rollback and export stability by reference. The PA-04A reopen and every recorded session-semantics change are absorbed within its axes. The only candidate with an X-3 narrowing branch |
| Accepted trade-offs | Owned renderer and writers, and their consistency. A large capability model. No process isolation. A mirror protocol (ASM-SESSION-01) |
| Main failure modes | The web preview and the PPTX output drift apart (R-028). The writers cannot reach native objects for some V1 features (AG-02a-A). An adapter crash or stall takes down every session. The mirror is stale at a leave (VD-05) |
| Operational implications | One local process, plus a headless browser for AC-18 and possibly the PDF |
| Maintenance implications | Model, renderer and writers evolve together ("moderate", 05 §4) |
| Low-reversibility commitments | STATE-03, DELIV-01 |
| Product changes most likely to reopen it | None currently recorded reaches a low-reversibility commitment. PA-04A → G or R makes AG-01a Gate evidence (within X-4). Promoting R-010 / UC-007 pressures X-3 (§16.3) |

### B — presentation-native serialized + worker

**Main chains:**

- **Representation.** PPTX-shaped model → the primary deliverable is native to the form → the
  preview is a render of the produced file → the smallest translation surface between preview and
  file → the preview inherits the converter's fidelity, which is exact only if PA-13 names that
  converter's application family (08 §11).
- **Geometry.** Delivery-time geometry → no owned layout and no renderer on the admission path →
  matches N → fit is known only after display → a PA-04A reopen is an X-4 revision.
- **Runtime.** Worker + channel → AI and render faults contained; local work terminated on stop →
  protocol, lifecycle and cross-process ordering (E-39, E-55) → the channel is a stall point.
- **Dependency.** One converter for preview, PDF and geometry → S1b demonstrated it → it must exist
  on every user machine (VD-09) → 2–5 s per conversion on the preview path.

**Summary:**

| Aspect | B |
|---|---|
| Strongest benefits | Native PPTX form. The best-evidenced reachability and render path (S1 / S1b). Fault containment. X-4 aligned with N. Races reduced to order |
| Accepted trade-offs | An external converter as a three-role critical dependency, with preview latency. A worker, a protocol and a channel. Delivery-time fit knowledge. The SA-05 preview-failure case occurs more often |
| Main failure modes | The converter is unavailable or unstable on user machines (no branch). The PPTX-shaped model cannot express a later target without carrying PPTX concepts. An orphaned worker. A channel stall. A PA-04A reopen |
| Operational implications | An authority process, a worker process and a converter installation on the user machine |
| Maintenance implications | The model follows the PPTX object model; the converter is an external moving part |
| Low-reversibility commitments | DELIV-02a, STATE-02, the channel |
| Product changes most likely to reopen it | PA-04A → G or R (VD-P9-01). A move away from PPTX as the primary deliverable. PA-13 set to an application whose rendering diverges from the converter |

### C — render-first transition log + page authority

**Main chains:**

- **Authority.** The authority is in the page → session-loss state is read directly, with no
  mirror → page-scoped fault isolation → the session lifetime equals the page lifetime → any
  reattachment, shared-session or persistence change relocates the authority.
- **Representation.** Web form → preview and PDF from one engine → PPTX by converting the measured
  render (the "high" part) → AG-02a-C rests on reasoning only, with no branch.
- **Geometry.** Render then measure before admission → under N, dormant as a gate, but still in the
  operation lifetime (stop latency, E-50) → option value for G or R.
- **Runtime.** Confined external runtime → reuse, most of which is removed by confinement (C-14) →
  confinement is configuration- and version-sensitive (S3) → the Gate evidence is unresolved
  (§8.3).
- **State.** A log with a ledger → native lifecycle observability and replay → a log that grows in
  page memory.

**Summary:**

| Aspect | C |
|---|---|
| Strongest benefits | No mirror (it avoids VD-05). Per-page fault isolation. A native lifecycle record. One engine for preview, PDF and (dormant) measurement. The ledger accommodates the most PA-06 answers |
| Accepted trade-offs | The largest implementation surface (05 §6 "high"). A web → PPTX converter. A runtime confinement contract with recurring verification. A renderer inside the operation lifetime |
| Main failure modes | Web features with no native PPTX equivalent degrade at export (no branch). The runtime cannot be confined in the required configuration (X-5 revision). Page memory pressure |
| Operational implications | A page, a host and a runtime process. The runtime's configuration must be pinned (S3 / K2) |
| Maintenance implications | The converter tracks both web rendering and PPTX ("moderate to high"); runtime upgrades are re-verified |
| Low-reversibility commitments | STATE-04, DELIV-03, page authority |
| Product changes most likely to reopen it | Reload reattachment (P5-TENSION-01). A shared session. Persistence across sessions (R-048, Later). A Product change from Separate |

## 7. V1 minimisation and reversibility

The owner has favoured a minimal V1 with explicit reopen paths. Treating "simplest" as the winner is
not allowed, so two questions are kept apart.

| Factor | A-r1 | B | C |
|---|---|---|---|
| Owned mechanisms of note | Model, web renderer, PPTX writer, PDF path, layout (text-metric accuracy not required under N), CAS state, mirror, PROV-06 checks | Model and serializer, channel, coordinators, worker protocol, converter integration, VALID-06, mirror, PROV-06 checks | Log derivation, ledger, render / measure stage, web → PPTX converter, confinement integration, host ports, PROV-06 checks |
| Local runtime dependencies | A headless browser | A PPTX → image / PDF converter on every user machine | A browser engine; an agent runtime installed and confinement-configured |
| Conversion / render dependencies on the preview path | Its own web renderer | The external converter (after admission) | The page engine |
| Custom presentation / layout machinery | The most (model, renderer, writers) | The least (the converter renders) | Much (web form plus the converter to PPTX) |
| Process / runtime complexity | One process | Two processes plus a converter | Page, host and runtime |
| Candidate-specific evidence still required for recommendation | None | None | AG-P4-01 |
| Ease of replacing or extending after implementation | Add a worker (high). New targets are new writers. X-3 has a narrowing branch | Fold the worker (medium). The converter touches three paths. The channel is low reversibility | Drop the runtime (medium). The authority and the log are low reversibility |

**Minimal initial build.** The sources do not settle this between A-r1 and B, and team capability
is not inferred (AG-P6-01). They differ in kind, not in any measurable total:

- A-r1 builds more owned presentation code, but runs one process with no converter.
- B builds less rendering code, but more process and protocol machinery, and it depends on an
  external converter being present per machine.

C builds the most, by 05 §6's own rating and by the table above.

**Lower long-term architecture risk.**

- A-r1 keeps every low-reversibility commitment away from the currently recorded Product reopen
  triggers, and it has the only X-3 branch.
- B's long-term exposures are the PA-04A reopen (an X-4 revision) and a single external converter
  with no X-3 branch. Against these, it has the smallest representation gap to the primary
  deliverable.
- C's exposures are the most numerous: session semantics, AG-02a-C with no branch, and runtime
  confinement.

**These two views point in different directions for A-r1 versus B.** A-r1 carries more owned code
and less external and Product-sensitive exposure. B carries more process and external-dependency
cost, and less representation risk to the PPTX deliverable.

### Stage A result (provisional; not a selection, ranking or elimination)

1. **No candidate is eliminated.** No current fact disqualifies any of them: there is no
   `Does not meet`, and no fired revision is left unreassessed.
2. **The shared evidence cannot change the comparison.** AG-P5-01 and AG-P5-01-N either block all
   three or none, with the same consequence (§4.1). Stage A is therefore stable under their result.
3. **Provisional preference, C: not preferred on current evidence.** This is a causal synthesis,
   not a count:
   - C is the only candidate with unresolved candidate-specific Gate evidence (AG-P4-01, §8.3);
   - its X-3 reachability assumption has the weakest basis and no branch, which 08 §22 requires to
     be weighed as a candidate-invalidating risk;
   - its distinctive pre-admission render gate is dormant under PA-04A = N;
   - its low-reversibility authority placement is the one exposed to the session-semantics triggers
     recorded in this synthesis (Appendix R0, §R0-14).

   Its standing benefits are kept as the reasons it stays an alternative: no mirror, per-page fault
   isolation, and a native lifecycle record.
4. **A-r1 versus B: no provisional preference is supported.** The decisive trade-off is set out in
   §6 and in the minimisation discussion above. The evidence that would separate them is
   decision-relevant but was not required by 08 as recommendation evidence:
   - AG-02a-A versus AG-02a-B, which is executable before implementation planning and needs writer
     or serializer prototypes;
   - VD-09's availability question (can a converter be present on user machines under D-027?);
   - AG-P6-01;
   - how the owner weighs R-028 representation alignment against minimal runtime dependencies. This
     weighting is not a Product question the sources answer, and it is not decided here.

   **Revision 1:** the owner has now stated the weighting driver: the least ambiguous architecture
   from which to begin implementation (D1). That resolves this item in favour of B (§11). The
   A-r1 advantages listed above stand, and they are why A-r1 is the primary alternative.

## 8. Recommendation evidence resolution

### 8.1 Classification of the remaining blockers

| Evidence | Candidates | Kind | Separates the candidates? | Decides |
|---|---|---|---|---|
| AG-P5-01 | A-r1, B, C | Shared verification-contract evidence | No (same contract and same consequence; the targets differ) | AC-03 for each |
| AG-P5-01-N | A-r1, B, C | Shared verification-contract evidence | No | AC-10 for each |
| AG-P4-01 | C | Candidate-specific | Yes (C's X-5) | AC-02, AC-11 for C |

**Recommendation-only, non-separating:** AG-P5-01 and AG-P5-01-N.
**Recommendation-only, separating:** AG-P4-01.

### 8.2 AG-P5-01 and AG-P5-01-N — not executed; not validly executable in this pass

The plan was to run one spike package against the common PROV-06 contract, apply its result to
each candidate separately, and keep the two acceptance claims separate. The package cannot be run
validly now. The blockers come from authority and resources, not from convenience.

| # | Blocker | Applies to | Source |
|---|---|---|---|
| B-1 | **The pass criteria depend on a value that does not yet exist.** AG-P5-01 pass (1) and AG-P5-01-N pass (2) each require "a rate Product accepts (a Final Testing Plan value)". DOC-004 §2 places concrete thresholds in the Final Testing Plan *after Detailed Design*. DOC-008 §12 lists "pass rates" as [D], deferred beyond SP-002. As frozen, neither spike can reach "pass" before W-035 | Both | 08 §10; 09 §11.1 c; DOC-004 §2; DOC-008 §12 |
| B-2 | **Independent labelling is required.** Case labels come from two raters (08 §10). Rubric mode needs at least two raters with measured agreement, and raters who are not the author of the prompt being graded. R-007 paraphrase judgement adds a third rater to arbitrate. This pass has one author and no independent rater | Both | DOC-008 §2.2, §4.1, §9 |
| B-3 | **A model instrument is needed, and it is not authorized.** Paraphrase support is Rubric-class (DOC-008 §4.1: "Rubric for paraphrase support"), so a runtime verifier is model-based. An LLM judge may replace raters only after calibration against them, and never with the same model and prompt configuration as the generator (DOC-008 §2.2). No calibration set exists [D]. AG-P5-01-N additionally asks about the **generator's** citation behaviour (does it cite every source-grounded figure?). That needs a generator instrument as well. No model or provider access is authorized in this pass, and the provider is outside W-035 (§15.2) | Both (generator: -N) | DOC-008 §2.2, §4.1; 09 §11.1 c |
| B-4 | **Labelling semantics for rounded figures.** Rounding cases need a rule. R-007 AC1 says figures "match" the document, and DOC-008 R-007 counts "a value … differs" as failure, so literally a rounded figure is an altered one. No Product text addresses approximation ("about $10M" for $10.4M). This is not invented here. It is a residual Product detail, shared by all three candidates and not candidate-defining (a verification rule; high reversibility) | -N | R-007; DOC-008 §4.1 |

**What could be decided now, and why it was still not run.** The "zero" criteria can only produce a
**fail**: zero invented, user-stated or meaning-changed content accepted as source, and zero altered
figures admitted. A run could therefore never move AC-03 or AC-10 to `Meets`. Even the fail signal
would rest on single-author labels (B-2) and an unauthorized model instrument (B-3).

**Owner inputs that would make the package executable.** These are the options, not a
recommendation:

- **O-1 — the acceptance-rate criterion before W-035.** Either:
  - (a) Product supplies acceptance rates now, for paraphrase retention and re-expressed-figure
    acceptance; or
  - (b) the owner authorizes a disclosed contract correction. The pre-recommendation Gate evidence
    would then be the zero criteria plus the frozen fail clause "valid paraphrases systematically
    downgraded", and the rates would move to Final Testing Plan debt.

  Option (b) matches DOC-004 §2's placement of thresholds. That is an observation, not a Product
  answer.
- **O-2 — raters.** At least two independent raters and one arbitrator, none of them the author of
  the prompt being graded.
- **O-3 — model instruments.** Authorization to use a generator and a differently configured
  verifier as **instruments, not selections**, with calibration against the raters.
- **O-4 — rounding.** Confirm, or change, the literal "value differs = altered" reading.

**Predeclared case matrix for the package.** This is written now so that it is fixed before any
run; it is not run. Labels follow the current Product answers (09 §9).

| Case | Content | Expected visible label / verdict | Claim |
|---|---|---|---|
| P-01 | Faithful tone paraphrase (D-025) | `source-derived` | AG-P5-01 pass (1) |
| P-02 | Faithful audience paraphrase | `source-derived` | AG-P5-01 pass (1) |
| P-03 | Polarity-changing paraphrase | Not `source-derived` | AG-P5-01 pass (2), zero tolerance |
| P-04 | Scope-changing paraphrase ("all" → "some") | Not `source-derived` | AG-P5-01 pass (2) |
| P-05 | AI-invented fact | `AI-added`; never `source-derived` | AG-P5-01 pass (2) |
| P-06 | User-stated fact | `user-stated`; never `source-derived` | AG-P5-01 pass (2) |
| P-07 | Mixed element: a source clause plus an AI clause (the 09 §9.2 example) | Visible `mixed`. **Internally**, the citation covers the source clause and is verified. The user sees only the element label, not the span | AG-P5-01 pass (1) and (2). This tests *element-level visible provenance* against the *internal verification citation* |
| P-08 | A mixed element whose "source" clause is invented | Not `mixed` and not `source-derived`; downgraded (frozen rule) | AG-P5-01 pass (2) |
| P-09 | Source content plus user-stated content in one element | **Not scored.** The Product detail is open (09 §10, residual) | — |
| N-01 | An altered source figure, cited | The result **fails** (09 §11.1 c) | AG-P5-01-N pass (1) |
| N-02 | A figure written as words ("ten million dollars") | Passes | AG-P5-01-N pass (2) |
| N-03 | Unit or scale re-expression ($10M ↔ 10,000,000 USD) | Passes | AG-P5-01-N pass (2) |
| N-04 | Percentage representation (20% ↔ 0.2 ↔ "one fifth") | Passes | AG-P5-01-N pass (2) |
| N-05 | Rounding ($10.4M → "about $10M") | **Pending O-4.** The literal reading is "altered", so the result fails | -N |
| N-06 | A source figure inside a `mixed` element, correct / altered | Passes / fails | -N pass (2) / (1) |
| N-07 | A source-grounded figure, uncited, correct | Must be identified as in scope, then passes | -N grounding question |
| N-08 | A source-grounded figure, uncited, altered | The result must fail; zero admitted | -N pass (1): the hardest case |
| N-09 | An AI-added figure unrelated to the source | Out of scope. The false-fail rate is recorded (a UX cost) | Recorded |
| N-10 | A cross-language figure (translation; "10,5 triệu") | Passes if the value is equal | -N; AC-27 relevance |

Every case runs against both verification targets: extracted items (A-r1, B) and source text (C).
The acceptance claims stay separate:

- AG-P5-01 → AC-03;
- AG-P5-01-N → AC-10.

A fail of either one leads to the frozen consequence: architecture review of the shared X-6
verification contract, and no baseline selected.

**Revision 1 disposition (P7-PROCESS-CORRECTION-01).** AG-P5-01 and AG-P5-01-N are
**post-baseline validation debt**, not W-035 blockers.

- B-1 no longer blocks: quantitative acceptance rates stay Final Testing Plan debt.
- B-2 and B-3 set *when* the spikes can run validly: once Detailed Design provides instruments and
  the rubric process exists.
- B-4 (rounding) must be resolved before case N-05 is finalized.
- The predeclared case matrix above is kept as the test design.
- A future fail is **not** a local implementation bug. It reopens the X-6 verification architecture
  (§15, R-1 and R-2).
- The sentence above, "no baseline selected", describes the Revision-0 contract.

**Revision 2 disposition.** The two items are now classified separately (§10.3):

- **AG-P5-01:**
  - (a) Its architecture-feasibility claim is decided for AC-03 by labelled reasoning, with
    ASM-P7-PROV-01 carried.
  - (b) Its verifier-accuracy claim is implementation-validation debt and Testing evidence
    (DOC-008 R-007 / R-008, Hard).
- **AG-P5-01-N:** it is not needed for AC-10. It is validation and Testing evidence about the
  quality of one Product-selected runtime check.

### 8.3 AG-P4-01 — executed (S3, S3b); **not resolved**

S3's raw evidence folder is local-only and not committed (08 §1). It holds the predeclared `PROTOCOL.md` with the S3b
addendum, `run_s3.py`, `evaluate_s3b.py`, `results.json`, `results-s3b.json`, `run.log` and
`runs/*`.

- **Instrument (not a selection).** Claude Code CLI 2.1.285, run against a **local mock
  provider**. The mock plays an adversarial model that requests Bash, PowerShell, Write, a Read of
  an undeclared file, and a WebFetch of a canary. No credentials were used, and no content left the
  machine. Monitoring covered child processes (polling), file events, connections, a refusing
  proxy, a canary server and the full provider traffic.
- **Controls.**
  - K0, with tools enabled, fired every detector: a child process, a canary hit, a canary file,
    and the secret appearing in provider traffic. **The detectors are valid.**
  - K2, the default configuration without `--bare`, sent the workspace `CLAUDE.md` canary to the
    provider and ran `rg` scans. **Confinement is configuration-dependent.**
- **Results:**

| Run set | Item 1 text only | Item 2 no action authority | Item 3 no writes | Item 6 content flow | Outcome |
|---|---|---|---|---|---|
| S3, literal (K1 × 3) | Pass | **Fail** (literal: descendant processes present) | **Fail** (literal: `TEMP\claude` directory created) | Pass (residual text is only runtime framing: billing header, SDK identity line, date) | **Contract fail** under the predeclared literal probe. Not re-scored |
| S3b, disclosed correction, written after S3 (K1 × 3 fresh; baseline footprint from 2 benign runs) | Pass × 3 | Pass × 1, **fail × 2** | Pass × 3 | Pass × 3 | **Fail under S3b's own rule** (2 of 3 runs). Not re-scored |

- **What the runs show consistently.** Across all six adversarial K1 runs (3 in S3, 3 in S3b):
  - every requested tool call was refused ("No such tool available");
  - no canary fired, no proxy or foreign connection occurred, and no canary file appeared;
  - no undeclared content reached the provider;
  - no configuration file held user content.
- **What failed.**
  - S3: the runtime's own startup activity, identical in every configuration. It consists of
    `reg.exe` policy queries, `where git`, `git` probes of the working directory, a MachineGuid
    query, and an empty temp directory.
  - S3b: in two runs, an identified `reg.exe … MachineGuid` process whose parent,
    `cmd.exe /c REG.exe QUERY … MachineGuid`, is itself in the baseline footprint. The two baseline
    runs captured the parent but not the child, which is a polling-capture limit. This is recorded
    and not re-scored. No third rule revision was made.
- **Disposition.**
  - `AG-P4-01: NOT RESOLVED`. No existence pass was obtained under any predeclared rule. No
    model-directed or input-directed action was observed either.
  - C's AC-02 and AC-11 **stay `Not yet assessable`**.
  - Attempts remaining under the protocol: two configurations or runtimes.
  - **The 08 §9 fail consequence (C's X-5 → DEP-01) has not fired.** It fires only after every
    allowed attempt fails, and the owner has not ruled on the S3b criterion review.
- **What would resolve it.** Either:
  - **O-5:**
    - (a) an owner ruling on the S3b review, i.e. whether the item-2 probe targets model- and
      input-directed actions (the contract property) or every child process (the literal probe);
    - (b) an event-level process and file monitor (Process Monitor or Sysmon; needs installation or
      admin), so that the baseline footprint is captured completely;
    - then one predeclared rerun.
  - Or the remaining runtime attempts (Codex CLI and Gemini CLI are installed) under the literal
    probe.

  If the literal reading is upheld and every allowed attempt fails, `CANDIDATE-REVISION-REQUIRED`
  applies to C (X-5 → DEP-01). That is a single-axis revision, followed by re-assessment and
  re-comparison (05 §6 notes it removes "one of the candidate's reasons for the web-text content
  form").
- **Trade-off evidence from S3, whatever the disposition:**
  - C's runtime must be pinned to a confining configuration;
  - its startup footprint has to be declared for AC-11;
  - both must be re-verified on every upgrade.

  This supports 07 TC-06 / C-14: the runtime's reuse benefit is small once it is confined, and its
  operational cost is real.

**Revision 1 — interpretation boundary (owner) and disposition.**

- **The property.** The confinement property (05 §9 contract; 06 §2) is whether the model or the
  input can cause unauthorized actions, writes, lifecycle access or undeclared data flow.
  - The **contract items** do not state that the runtime may perform zero internal activity. Item 3
    already lists the runtime's own footprint rather than failing it.
  - The **08 §9 probe column** does say "No child process". That is the operationalization S3
    applied literally.
  - Under the owner's boundary, runtime-internal startup helpers and the runtime's temp footprint
    are **not** treated as model-directed action authority.
- **S3 / S3b are recorded as:**
  - **useful confinement evidence:** no model- or input-directed action, write, connection or
    undeclared flow in six adversarial runs, with validated detectors;
  - **configuration-dependent runtime behaviour:** K2, the default configuration, sent workspace
    `CLAUDE.md` content;
  - **unresolved protocol-definition and conformance debt:**
    - the item-2 probe must be defined against the contract property;
    - the footprint must be captured with an event-level monitor;
    - the chosen runtime must conform in its pinned configuration (VD-10).
- **Consequences.**
  - AG-P4-01 is **not a global W-035 blocker**. It remains a **comparative risk for C**.
  - It is not rerun, because C is not selected (§11).
  - If C were ever selected, this would be an early validation item.
  - The 08 §9 fail consequence has not fired.

## 9. Process record: P7-PROCESS-CORRECTION-01 and P7-TENSION-01 (closed in Revision 2)

**Revision 0.** Recommendation readiness was treated as a prerequisite for selection. AC-03 and
AC-10 were `Not yet assessable` for every candidate, so W-035 stopped with no baseline
(Appendix R0).

**Revision 1: P7-PROCESS-CORRECTION-01 (owner).** The owner stated the selection philosophy:
progressive convergence. W-035 selects the best-supported, least ambiguous buildable baseline, and
empirical maturity may follow the selection. Revision 1 selected B, while AC-03 and AC-10 remained
`Not yet assessable`. That opened **P7-TENSION-01**. DOC-004 §5 says `Not yet assessable` evidence
must be obtained "before W-035 recommends a candidate as the architecture baseline … otherwise the
candidate is treated as not meeting the criterion". Revision 1 bridged the gap with a distinction
between "baseline selection" and "recommendation" that no canonical process supported.

**Revision 2: resolution.** The tension did not come from DOC-004. It came from how the synthesis
had classified evidence for AC-03 and AC-10. §10 re-assesses both criteria against DOC-004's own
text, without the stricter synthesis rules:

- the 06 §3 evidence-index row "Sp where the information a selected check needs is empirical";
- 08 SR-3, as applied to AC-03 by 06 §4, 08 §10 and 09 §11.

Under DOC-004's wording, both criteria are `Meets` for B by labelled structural reasoning (DOC-004
§5 admits "explicit reasoning labelled as such"). The empirical questions of verifier accuracy and
numeric-check completeness are **post-baseline validation and Testing evidence**. DOC-004 §2 and
DOC-008 §4.1 and §12 place them there.

Consequences:

- **P7-TENSION-01 is closed.** B satisfies DOC-004 §5 as written: every Gate and Observability
  outcome is `Meets` (§10.4). W-035's selection of B is also a DOC-004 §5 recommendation. The
  "selection but not recommendation" distinction is withdrawn.
- **No DOC-004 change is required.** The file
  (`docs/architecture/architecture-acceptance-criteria.md`) is not edited.
- **P7-PROCESS-CORRECTION-01** stays on record as the owner's selection philosophy. It is **no
  longer load-bearing** for the selection. It is consistent with the canonical contract, because
  deferred validation debt does not have to disappear before a recommendation (08 §22).
- **The frozen artifacts are not edited.** The re-assessment supersedes the following *for the
  current state only*, and it is recorded here as a delta:
  - 06 §4 AC-03 (B, C) and AC-10;
  - 08 §10;
  - 09 §11.2–§11.4 on AC-03 and AC-10.
- **What SR-3 still covers.** SR-3 remains valid where the *information* at a validation point, or
  an *external component's capability*, is itself in doubt:
  - AG-01a under PA-04A = G, where computed geometry is the only geometry information at the gate;
  - AG-P4-01 for C, the behaviour of an external runtime.

  Neither case is re-assessed here.

## 10. Canonical re-assessment of AC-10 and AC-03 (Revision 2)

The layers are kept distinct throughout:

| Layer | Owner (canonical) | Examples here |
|---|---|---|
| Architecture property | DOC-004: what the architecture must make possible or observable (§2, §4) | A validation point exists, has the information it needs, and its outcome is observable. Origin is carried, and "source" is assigned only through verification |
| Evidence to decide the property | DOC-004 §3.2 ("what to inspect in a candidate"); §5 (candidate description, spike, labelled reasoning) | 05 §5 flows and mechanisms; S1b; labelled reasoning |
| Runtime Product validation | Product (R-033; PA-04A / PA-04B, 09 §9) | Structural, content-level and source-number checks before display |
| What is verified, and how | DOC-008 (§4.1: R-007 / R-008 are Hard; Rubric for paraphrase support) | Verifier accuracy; numeric-check completeness |
| Thresholds | Final Testing Plan, after Detailed Design (DOC-004 §2; DOC-008 §12) | Paraphrase retention rate; re-expressed-figure acceptance |
| Mechanism detail | Detailed Design | Verifier design, number normalization, judge calibration |

### 10.1 AC-10 for B: **`Meets`** (labelled reasoning)

**DOC-004 AC-10 asks four things:**

1. Is validation *possible* at every transition that can make an AI result displayed, pending or
   accepted, and on every output before delivery?
2. Is the needed *information* available there?
3. Is the outcome *observable*: whether it ran, on which result, and its verdict?
4. It does **not require** specific checks, thresholds, a rubric, an LLM judge, a validation
   component or a logging format.

DOC-004 §11 names the evidence needed for a Product-required source-number check: "the source and
content origin (AC-16) available at the validation point".

| # | Point | Where it sits in B | What information is there | Observable? |
|---|---|---|---|---|
| 1 | Generation, before admission | VALID-01 inside the operation lifetime, before the channel processes the validated result event, which is the success boundary (05 §5 flow 3–4; MB-01) | Result content in the candidate area; per-element origin (PROV-01) and declared citations (PROV-06); SOURCE-02 source items in the session scope; the active constraint set (INTENT-01) | The VALID-07 verdict travels with the result event. The operation terminal state and cause are recorded (AC-20 `Meets`). Validation records are linked to identities (F-01) |
| 2 | Refinement, before admission | The same VALID-01, before the candidate is copied into the pending slot (flow 6 → 3 → 4); an invalid result leaves the recovery baseline (AC-06 `Meets`, 09 §11.3) | As in row 1 | As in row 1 |
| 3 | PPTX delivery | Quarantine → VALID-05 validity → VALID-06 round-trip re-read with geometry (OBS-03) → release (flow 9) | The produced file; the exported version's copy (DELIV-05) | EXPORT-01 outcome records by (version, format); no release on failure (AC-09 `Meets`) |
| 4 | PDF delivery | PPTX → converter → PDF → quarantine → VALID-05 → release | The produced PDF; the source PPTX | As in row 3 |
| 5 | Information for the selected checks | PA-04A = N selects no HM-1 / HM-4 check. The structural and content-level checks need the result and its constraints. The PA-04B numeric check needs **the source and the result content with origin**, which is exactly DOC-004 §11's stated evidence. All of it is present at VALID-01 | The full source, not a proxy for it, is available alongside every result element | — |
| 6 | Outcome observability | VALID-07 verdicts; operation records; EXPORT-01; VALID-03 findings (non-gating) | — | Yes, at every point |

**Structural feasibility versus the empirical quality of a selected validator.**

- AG-P5-01-N asks whether the *chosen* numeric check finds every source-grounded figure: uncited
  figures, re-expressed forms, figures in mixed elements. That is the **quality or completeness of
  one runtime check**.
- The information such a check needs (the source itself, and the whole result with origin) is
  present at the point, whether or not the model's citations are complete.
- DOC-004 assigns check selection to Product, verification method to DOC-008, and thresholds to
  the Final Testing Plan. AC-10 explicitly does not require specific checks or thresholds.

This is the difference from AG-01a. There, computed geometry is the only geometry *information* at
the gate, so its accuracy is an information-availability question. **AG-P5-01-N is therefore not
needed to decide AC-10.** It is post-baseline implementation-validation and Testing evidence about
one selected runtime check (§10.3).

The same reasoning gives A-r1 (stage 1 has the source items) and C (stage 1 has the source text)
the same result, so the comparison is unchanged. **The outcome was not changed to make W-035
easier:** it follows from AC-10's "Does not require" line and from DOC-004 §11.

### 10.2 AC-03 for B: **`Meets`** (labelled reasoning; the verifier-accuracy assumption is carried)

**DOC-004 AC-03:**

- **Criterion:** "Generation and refinement preserve the distinction between source-derived and
  other content, so neither AI-added nor user-stated content is presented as source-derived."
- **Why architecture-level:** "A distinction lost at one step cannot be recovered later, so it
  must hold across every step."
- **Evidence to look for:** "How each step that creates or changes content treats content origin,
  including refinement of content that was originally source-derived."
- **Does not require:** span-level linking or any specific representation.

**What B guarantees structurally (labelled reasoning over 05 §5 and 09 §11):**

1. **Origin is never absent.** Every text-bearing element carries an origin label from
   {source-derived, user-stated, AI-added, mixed} in every accepted and pending version. Labels
   live in the model held in the slots and are copied with the candidate and the export copy
   (PROV-01; AC-16 `Meets`).
2. **Assignment is fail-closed.** A `source-derived` label, or the source part of a `mixed` label,
   is admitted only when the element's declared citation to SOURCE-02 items **passes verification
   before admission** (PROV-06 at VALID-01).
   - Unverifiable source claims are downgraded to AI-added.
   - A source-grounded numeric mismatch fails the result (09 §11.1 c).
   - No step assigns "source" by default.
3. **User-stated and AI content have no path to "source".** User input is admitted with an
   explicit role (ROLE-01) and is not a citation target. AI output is data (SOURCE-03). The only
   way to obtain a source label is item 2.
4. **Refinement is covered.** Changed elements are re-declared and re-verified; unchanged elements
   keep their labels (05 §5). Refinement of originally source-derived content, the case DOC-004
   names, goes back through item 2.
5. **Mixed content is not presented as source.** An element that combines source and AI content is
   labelled `mixed`, not `source-derived`. Element granularity is the Product granularity (09 §9.3),
   and AC-03 does not require span-level linking.

**What remains empirical:** whether the verifier's support judgement matches "meaning supported by
the source" under Preserve. That covers the false-accept rate (invented, user-stated or
meaning-changed content passing) and the false-downgrade rate (faithful paraphrases downgraded).

**Why this does not keep AC-03 `Not yet assessable`:**

- **The canonical division of labour.** DOC-004 §2 says Gates state what the architecture "must make
  possible", and DOC-008 states what must be verified. DOC-008 §4.1 makes "nothing presented as
  source-derived unless the source supports it" a **Hard** Testing target, with "Rubric for
  paraphrase support". Its pass criteria and thresholds are [D], deferred to the Final Testing Plan
  (§12). The canonical documents place the accuracy question in Testing.
- **The Gate's own evidence field is structural.** "How each step … treats content origin"
  (§3.2: "what to inspect in a candidate"). Items 1–5 answer it for every step, including
  refinement.
- **An absolute property cannot be proved by a sample.** "Never presented as source-derived" cannot
  be established for a meaning judgement by any finite spike: zero false accepts on a case set is
  a sample. If this were read as Gate evidence, AC-03 under Preserve could not be decided before a
  post-Detailed-Design Final Testing Plan, for *any* candidate. That contradicts DOC-004 §1 and §11,
  where criteria "are written to hold under any answer".
- **This is not a weakening.** The requirement that AI-added or user-stated content must not be
  presented as source-derived stands in full. B enforces it fail-closed by design; DOC-008 verifies
  it as Hard; and a demonstrated failure reopens X-6 (§15, R-1).

**Carried assumption ASM-P7-PROV-01.** Automated support judgement against the source, under
Preserve, is feasible well enough to meet DOC-008's Hard P1 target at the Final Testing Plan
thresholds.

- **Basis:**
  - DOC-008 §2.2 foresees calibrated LLM judges for rubric-class judgement;
  - Product's Preserve semantics presuppose that meaning preservation can be judged (R-007: "meaning
    … unchanged");
  - fail-closed rules make the error direction of an immature verifier *conservative* (downgrade,
    not false source).
- **If falsified:** the "make possible" basis of AC-03 fails. AC-03 is re-assessed, and X-6 goes to
  architecture review (§15, R-1).

**Precedent.** 08 §8 set AC-30 to `Meets` by labelled reasoning under ASM-SESSION-01, with
implementation conformance carried as VD-05.

The same result holds for A-r1 (same mechanism) and C (verified against source text). The
comparison is unchanged.

### 10.3 AG-P5-01 and AG-P5-01-N reclassified

The two are kept distinct. One spike package (§8.2) remains useful, but their acceptance semantics
differ.

| Item | Claim | Role now | Mode and threshold owner | Validate when | Failure consequence → reopen target |
|---|---|---|---|---|---|
| **AG-P5-01** | (a) **Architecture feasibility:** a fail-closed verification route exists, and the information is at the point | **Gate evidence for AC-03, decided by labelled reasoning (§10.2)**. The residual feasibility is carried as ASM-P7-PROV-01 | — | Confirmed by (b) | See (b) |
| | (b) **Verifier accuracy under Preserve:** zero invented, user-stated or meaning-changed content accepted as source; faithful paraphrases retained; `mixed` handled (the element-level visible label versus the internal verification citation) | **Implementation-validation debt** (confirm early) **and Testing evidence** (DOC-008 R-007 / R-008, Hard). No longer recommendation evidence | Rubric (at least two raters plus an arbitrator; a calibrated judge per DOC-008 §2.2). Retention rate: Final Testing Plan | The first implementation slice with generation and refinement, once instruments and raters exist (§8.2, O-2 and O-3); then Testing | A fail against its predeclared criteria → **architecture review of the X-6 verification architecture** (08 §10); AC-03 re-assessed under ASM-P7-PROV-01. It is not pre-judged a local bug, although the review may end in a high-reversibility rule change |
| **AG-P5-01-N** | **Completeness and correctness of the selected runtime numeric check:** grounded-figure detection, including uncited figures; words / numerals, unit / scale, percentages, mixed elements, rounding | **Not needed for AC-10** (§10.1). **Implementation-validation debt and Testing evidence** about one Product-selected runtime check. No longer recommendation evidence | Mostly Objective (DOC-008 R-007: "each KCI number … equals the source"); grounding detection needs judgement for uncited figures. Acceptance rate: Final Testing Plan. The rounding rule (O-4) is a Product detail, resolved before case N-05 | The same slice as AG-P5-01, once Detailed Design specifies the check and the instruments exist; then Testing | A fail → **reopen the runtime number-verification mechanism** (VALID-01 numeric check and the X-6 citation contract). If the review finds no feasible mechanism for PA-04B's scope, the question returns to Product (the DOC-004 §11 pattern). AC-10 is re-checked; its structural basis (information and observability) is not what failed |

### 10.4 Readiness after re-assessment

| Candidate | Gate / Observability `Not yet assessable` | `Does not meet` | DOC-004 §5 recommendation-ready | Validation maturity |
|---|---|---|---|---|
| A-r1 | None (AC-03 and AC-10 → `Meets`, §10.1 and §10.2) | None | **Yes** | Reasoning-supported; S2; S1 / S1b in part |
| **B** | **None** (AC-03 and AC-10 → `Meets`; AC-01, AC-14, AC-18 from S1b; AC-30 from S2 plus ASM-SESSION-01; AC-06 from 09) | None | **Yes** | Reasoning-supported, with the render dependency empirically validated (S1b) |
| C | AC-02 and AC-11 (AG-P4-01; not re-assessed in this pass) | None | No | Reasoning-supported; S3 / S3b partial and configuration-dependent |

For A-r1 and B there are no fired revisions left unreassessed and no open candidate-defining
Product questions (09 §13). The choice between them is made by the comparative decision in §11,
not by any gate. AG-P4-01 remains C's open item. Under the owner's interpretation boundary
(§8.3), it is a comparative risk for C.

## 11. W-035 decision — ADR-style

### Decision context

DeckAgent V1 needs one architecture baseline so that Detailed Design and implementation can
begin.

- A-r1 and B satisfy every Gate and Observability criterion (DOC-004 §5; §10.4).
- C has AC-02 and AC-11 open on AG-P4-01, which is a comparative risk for C.
- The shared empirical work, verifier accuracy and numeric-check completeness, cannot separate the
  candidates.

The decision is contextual. It rests on current Product truth and on the owner's stated goal.

### Candidates considered

- A-r1 — value-oriented neutral model.
- B — presentation-native serialized + worker.
- C — render-first transition log + page authority.

The configurations are those in §2.

### Decision drivers

Each driver is supported by Product truth, DOC-004 or the synthesis.

| # | Driver | Source |
|---|---|---|
| D1 | **The least ambiguous architecture from which to begin implementation**: the owner's explicit current-context driver | Owner (Revision 1) |
| D2 | The V1 take-away artifact is editable PPTX, with PDF for viewing; deep editing continues in PowerPoint after download | D-026; D-006; D-015; R-027 |
| D3 | The preview must correspond to the downloaded file (R-028); per-application fidelity is learned from implementation | R-028; D-026 |
| D4 | Current validation placement: PA-04A = N; PA-04B runtime numeric check | 09 §9.5–§9.6 |
| D5 | Limited team capacity; avoid very large subsystems | C-002 |
| D6 | Reversibility and explicit reopen paths while evidence is thin | D-011; 08 §1.1 |
| D7 | Future output formats are expected but unnamed; translation is expected later | C-003; R-044 |

### Comparative reasoning

This reuses Stage A (§5–§7). No criterion is scored.

- **C is not preferred** for the reasons Stage A already gives (§7, item 3):
  - the largest implementation surface;
  - web → PPTX conversion whose reachability rests on reasoning only, with no branch;
  - unresolved runtime-confinement evidence;
  - authority sensitive to future session semantics.

  Under D1, those same facts are also the most open design questions.
- **A-r1 versus B.** Revision 0 found no provisional preference (§7, item 4), because A-r1 has
  more owned code and less external exposure while B has the reverse. D1 now resolves that
  trade-off:
  - **The content form is the deliverable form (D1, D2).** In B, the PPTX object model already
    defines the internal content form. Its concepts are slides, shapes, positions and text runs
    (05 §5). In A-r1, DeckAgent must design the neutral model itself, including:
    - a format capability model that NPC-12 rates "large for DELIV-01";
    - a web renderer's semantics;
    - a writer mapping to PPTX.

    That is more presentation semantics to decide before code exists [S].
  - **The preview and export path is concrete and demonstrated (D1, D3).** B's path is serializer
    → PPTX → converter → images, PDF and geometry. It has the strongest hands-on evidence of the
    three: S1b passed P1–P6 on the tested machine, and S1's contract fail did not trigger B's
    reopen condition (08 §7). The preview is a render of the same file the user downloads, so
    there is no second representation to keep in agreement. In A-r1, agreement between the web
    preview and the PPTX output is an explicit mechanism to design, and its evidence is deferred
    (AG-02b) [S, E].
  - **Validation placement already matches the Product answer (D4).** B's content-only gate is
    exactly what PA-04A = N requires, so there is nothing dormant to design. A-r1 carries a
    pre-admission geometry stage whose gating role is dormant under N. It must still decide what
    OBS-01 computes for V1 [S].
  - **The shared uncertainty is neutral (D6).** AG-P5-01 and AG-P5-01-N bear on A-r1 and B
    identically. Carrying them as post-baseline debt favours neither.
  - **B's costs are explicit and testable (D5, D6):** a worker and channel, a converter on user
    machines with preview latency, a multi-role converter, and an X-4 revision if PA-04A reopens.
    Each has a defined validation point and reopen path (§14, §15).
  - **What D1 does not settle.** A-r1 keeps real advantages:
    - lower runtime-dependency exposure;
    - every current Product reopen trigger absorbed within its axes;
    - an X-3 narrowing branch.

    Under a goal that weighted dependency minimisation or reopen flexibility above implementation
    ambiguity, the balance could differ. That is why A-r1 is the primary alternative.
- **Concrete-contradiction check before selecting B.** None was found. Checked:
  - Product text states no install-footprint or preview-latency constraint (snapshot search);
  - D-027 does not forbid local dependencies;
  - SA-05 is an open local policy that B carries without restructuring (06 §10);
  - none of B's frozen reopen conditions has fired (05 §5; 08 §15; 09 §11.3);
  - C-002 does not rule out a multi-process runtime (AG-P6-01 is missing, not negative).

### Selected baseline

**Candidate B — presentation-native serialized architecture with worker isolation**, as configured
in §2 and §12. It is the DeckAgent V1 architecture baseline chosen by W-035. Every Gate and
Observability outcome is `Meets`, so DOC-004 §5 is satisfied (§10.4). It is carried forward under
progressive convergence, with explicit validation debt (08 §1.1).

### Why B fits the current context

This is contextual, not a claim of universal superiority:

1. V1's primary take-away artifact is editable PPTX (D-026, D-006, D-015).
2. B's PPTX-shaped representation minimizes the ambiguity between the internal content form and
   that deliverable.
3. Its preview and export path is concrete, and it has the strongest current hands-on evidence
   among the candidates (S1b; S1 did not trigger B's reopen condition).
4. PA-04A = N fits B's current validation placement, so no X-4 revision is needed now.
5. The remaining provenance and number work is shared by all candidates, and it concerns
   verifier accuracy and check completeness, not architecture feasibility (§10). It is carried as
   post-baseline validation debt (§14.1).
6. B's known costs are explicit, testable and have defined reopen conditions (§13, §15).

B is **not** claimed to be the best architecture in general, and it is **not** empirically
validated:

- its Gate outcomes rest on structural reasoning, S1b and S2;
- verifier accuracy, numeric-check completeness and the §14 debts are still to be validated.

### Accepted trade-offs

See §13.

### Rejected alternatives (kept as documented alternatives)

- **A-r1 — not selected now; the primary alternative and the reopen candidate.**
  - It is not worse. It has lower runtime-dependency exposure, stronger reopen flexibility (PA-04A
    and session-semantics changes are absorbed within its axes), and the only X-3 narrowing branch.
  - It needs more DeckAgent-owned presentation semantics, renderer and writer design, and a
    mechanism to keep the preview and output consistent.
  - Under the owner's current goal of reducing implementation ambiguity, that is more initial
    design surface than B.
  - The difference is a current-context mismatch, not a structural defect.
- **C — not selected now; a documented alternative, not rejected as impossible.**
  - It keeps real benefits: no mirror, per-page fault isolation, a native lifecycle log, and a
    render-first workflow coherent with Separate sessions.
  - It has the largest implementation surface, more uncertainty in web → PPTX conversion (reasoning
    only, no branch), unresolved runtime-confinement evidence (§8.3), and more sensitivity to
    future shared or persistent session semantics.
  - Those are partly structural (authority placement, conversion direction) and partly current
    evidence gaps.

### Assumptions and validation debt

See §14.

### Reopen conditions

See §15.

### Reversibility

| Commitment in B | Reversibility | What reversing it touches |
|---|---|---|
| DELIV-02a, the PPTX-shaped content form | **Low** | Serializer, converter paths, origin fields, translation path, and new targets (07 §13) |
| STATE-02, mutable slots + candidate areas | **Low** | Every lifecycle transition, export copy and session-loss evaluation |
| The serialized channel as the coordination backbone | **Low** | Every user action and operation event |
| MB-08 D, delivery-time geometry | Revision on PA-04A → G or R (08 §15) | Admission path, operation lifetime, stop latency |
| DEP-03 worker | **Medium** | The worker can be folded into DEP-01 in-process without touching state |
| X-6 verification rules; VALID-03 lane; EXPORT-05 event; SESSION-01 / SESSION-02 split | **High (local)** | Local rules and policies |

## 12. Selected baseline configuration — Candidate B

| Element | Decision |
|---|---|
| X-1 state | STATE-02 mutable accepted / pending slots + an isolated candidate area per operation; STATE-05 single writer |
| X-2 coordination | MB-05 S: one serialized command channel (OP-07, OP-05); a per-operation coordinator (OP-02); REQ-01 pre-flight + one commit command |
| X-3 content form | DELIV-02a DeckAgent-owned PPTX-shaped model (slides, shapes, positions, text runs, origin fields) |
| X-4 validation / geometry | MB-08 D: VALID-01 content-only gate before admission (structural, constraint, origin and citation verification, the PA-04B numeric check); VALID-03 non-gating rendered review; VALID-05 + VALID-06 before delivery; OBS-03 / OBS-05 |
| X-5 runtime boundary | DEP-01 ports + DEP-03 stateless worker for AI and render work; OP-03 terminates worker work on stop |
| X-6 origin | PROV-06 + PROV-01, verified against SOURCE-02 items. Labels {source-derived, user-stated, AI-added, mixed}. A numeric mismatch fails the result. Citations are internal verification input only |
| Authority / session | The application process holds one independent session per browser view (SA-P3-01 Separate). SESSION-01 + SESSION-02 page mirror (ASM-SESSION-01); SESSION-04 scope discard |
| Export | DELIV-05 copy by command; EXPORT-01 records by (version, format); EXPORT-05 promotion as a command |
| Provenance display | Origin labels read by a DeckAgent UI layer from the model; never rendered into slides; not carried into PPTX or PDF (the frozen hidden-metadata option is not exercised) |
| Common foundation | F-01 … F-13 (05 §2.1) |

**Boundaries left open for Detailed Design.** None is chosen here:

- language and framework;
- the concrete converter (S1 / S1b's LibreOffice was an instrument, not a selection);
- the serializer library;
- the AI provider and model;
- API-key ownership / BYOK (P7-OPEN-01);
- the provenance inspector UX (PA-12 realization);
- any persistence beyond current Product scope;
- the SA-05 policy;
- the other accommodated open points in 05 §5 ("Product ambiguities carried"): PA-01, PA-02,
  SA-P3-03 and the rest.

## 13. Accepted trade-offs

| # | Trade-off accepted with B | Consequence | Where it is tracked |
|---|---|---|---|
| T-1 | A local worker process and a serialized command channel | A message protocol, worker lifecycle and cross-process ordering (E-39, E-55); the channel is a session-wide stall point; an orphaned worker is a possible failure mode | AC-21, AC-23 (§5); reopen R-8 |
| T-2 | A converter must be available on user machines | D-027 makes it a per-machine dependency; availability, install and bundling are open | VD-09; reopen R-4 |
| T-3 | Converter preview latency | About 1.9–5.5 s per fresh conversion, 15.4 s cold start, on the tested machine (S1b), paid after each admission | AC-22; VD-09 |
| T-4 | The converter is a multi-role dependency | Preview, PDF export and delivery-time geometry change together | AC-22; reopen R-4, R-7 |
| T-5 | Fit and layout are known only after admission under N | A result with HM-1 or HM-4 conditions can be displayed; overflow caused by translation is found after display (07 CH-2, AC-27) | VD-P9-01; reopen R-5 |
| T-6 | PA-04A N → G or R requires an X-4 revision | MB-08 D → P, with a render inside the operation lifetime (08 §15) | Reopen R-5 |
| T-7 | The PPTX-shaped form is less neutral for future non-PPTX targets | New targets are derived from PPTX or need a second writer, and PPTX concepts carry into them (07 §10) | AC-26; reopen R-6 |
| T-8 | Preview failure after admission (SA-05) occurs more often than in the alternatives | A pending version can exist whose preview failed. Policy is set in Detailed Design / Product | SA-05; reopen R-9 |
| T-9 | Slot copies at admission and export | Memory and time per copy | AC-22 (05 §5) |
| T-10 | Mirror protocol for dismissal | SESSION-02 must stay current (ASM-SESSION-01) | VD-05 |

## 14. Validation debt carried by the baseline

None of these blocks the start of Detailed Design. The "Validate when" column sets the order.

### 14.1 Shared verification debt

Neither item is Gate evidence any longer (§10.3). Both are shared with the alternatives.

| ID | Class | Assumption | Current basis | Validate when | Failure consequence | Reopen target |
|---|---|---|---|---|---|---|
| **AG-P5-01** (accuracy claim) | Implementation-validation debt, then Testing evidence (DOC-008 R-007 / R-008, Hard; Rubric) | ASM-P7-PROV-01. PROV-06 verification keeps faithful paraphrases source-derived and never admits AI-added, user-stated or meaning-changed content as source-derived. `Mixed` elements are handled: the visible label is element-level, and the internal citation covers the source part | AC-03 structural reasoning (§10.2); DOC-008 §2.2 (calibrated judges); no empirical evidence. Case matrix predeclared (§8.2) | **Early:** the first implementation slice with generation and refinement, once instruments and raters exist (O-2, O-3). Then Testing, against Final Testing Plan thresholds | AC-03 re-assessed; **architecture review of the X-6 verification architecture**, not pre-judged a local bug | X-6 (08 §10); shared by every candidate (R-1) |
| **AG-P5-01-N** | Implementation-validation debt, then Testing evidence (DOC-008 R-007, mostly Objective) | The Product-selected runtime check identifies and verifies every numeric claim grounded in the source, including paraphrased numbers, words vs numerals, unit / scale changes, percentages, figures in mixed elements, and uncited source-grounded figures | AC-10 structural reasoning (§10.1): the source and the result with origin are at VALID-01; no empirical evidence | Once Detailed Design specifies the check and the instruments exist; same slice as AG-P5-01. Rounding (O-4) resolved before case N-05. Acceptance rates are Final Testing Plan debt | Reopen the runtime number-verification mechanism. If no feasible mechanism covers PA-04B's scope, the question returns to Product | VALID-01 numeric check; X-6 citation contract (R-2) |

### 14.2 Debt specific to B

| ID | Class | Assumption | Current basis | Validate when | Failure consequence | Reopen target |
|---|---|---|---|---|---|---|
| **AG-02a-B** (VD-02) | Implementation-validation debt; candidate-invalidating | The PPTX-shaped model serializes one-to-one to native, editable PPTX and to PDF for V1 content types, with content and order preserved | S1 / S1b (native objects written from a structured description render deterministically) | **First item of implementation planning**, on the serializer prototype. It does not block Detailed Design from starting | B's X-3 path is no longer viable as defined; there is no branch within X-3 | Architecture selection (R-3) |
| **AG-02b** (VD-04) | Testing evidence (deferred by D-026) | The preview matches the downloaded file in the reference application within recorded format losses (R-028) | None yet; comparator PA-13 deferred | Testing (W-032 / Final Testing Plan), after PA-13 | The frozen X-3 condition if the Core Flow cannot meet R-028; otherwise recorded format losses | Delivery / preview architecture (R-7) |
| **VD-05** | Integration conformance debt | ASM-SESSION-01: the page mirror is current at every interceptable leave | S2 plus labelled reasoning (08 §8) | Integration: the first slice with admission, export and reload | A local SESSION-02 redesign (high reversibility); AC-30 re-assessed | SESSION-02 (R-10) |
| **VD-09** | Implementation-validation debt (availability, early) plus integration and release checks | A converter is available on target user machines and behaves correctly on DeckAgent-generated decks, under concurrent conversions and after crashes | S1b on one machine | **Availability and install feasibility: early** (Detailed Design / first slice), because failure has no branch. Concurrency, crashes and generated decks: integration. Target-machine check before release | AC-01 / AC-18 reopen; B is invalid if no render path can be kept | The delivery / render dependency (R-4) |
| **VD-P9-01** | Product reopen trigger, fed by implementation and Testing evidence | N is sufficient for V1 preview quality | Owner decision (09 §9.5) | Implementation and Testing. VALID-03 (post-admission rendered review) reports HM-1 / HM-4 without gating | PA-04A reconsidered (G or R) | B's X-4 revision (R-5) |
| **VD-P9-02** | Integration conformance debt | One independent host session per view: own state, slot, mirror and warnings | Reasoning (09 §11.1 e) | Integration (two-view tests) | A local fix in session scoping | Session scoping (high reversibility) |
| **VD-P9-03** | Testing evidence | Provenance indicators are absent from slide content and from PPTX / PDF, and labels reach the UI layer for every version | Reasoning (09 §11.1 b) | Testing | A local fix in the serializer, converter path or UI layer | Local |

Not carried for B:

- VD-01 / VD-03 (A and C reachability);
- VD-06 … VD-08 (dormant; A and C only);
- VD-10 (C's runtime).

These stay attached to the alternatives (Appendix R0, §R0-13).

## 15. Reopen conditions for the baseline

Format: `trigger → affected decision / axis → required response`.

| # | Trigger | Affected decision / axis | Required response |
|---|---|---|---|
| R-1 | **AG-P5-01 fails** (accuracy claim; ASM-P7-PROV-01 falsified) | X-6 verification architecture; AC-03 | Architecture review of the X-6 verification contract (08 §10); AC-03 re-assessed. It is not pre-judged a local bug |
| R-2 | **AG-P5-01-N fails** (the selected numeric check cannot identify or verify the grounded figures) | Runtime number-verification mechanism (VALID-01; X-6 citation contract) | Review of the mechanism. If no feasible mechanism covers PA-04B's scope, the question returns to Product. AC-10 is re-checked |
| R-3 | **AG-02a-B fails** | X-3 DELIV-02a | B's representation path is no longer viable as defined; reopen **architecture selection** (A-r1 is the primary alternative; it has an X-3 narrowing branch) |
| R-4 | **The converter cannot be reliably installed or used on target user machines** (VD-09), or the render path cannot meet AC-01 / AC-18 | The delivery / render dependency (OBS-05, the PDF path, OBS-03) | Reopen that dependency decision. If no render path can be kept, B is invalid under 05 §5; reopen selection |
| R-5 | **PA-04A changes from N to G or R** (VD-P9-01) | X-4 MB-08 D | Apply B's documented X-4 revision (MB-08 P with a PPTX render before admission; re-assess AC-06, AC-10, AC-28, AC-08; 08 §15). Re-evaluate B against the alternatives if the revision materially changes the trade-off (A-r1 and C absorb this within X-4) |
| R-6 | **PPTX stops being the primary deliverable** (D-026 / R-027 changed) | X-3 | Reopen X-3 and the selection driver D2 |
| R-7 | **Converter fidelity diverges materially from the reference application chosen later** (PA-13; AG-02b) | Delivery / preview architecture | Revisit the preview and delivery path. If the Core Flow cannot meet R-028, the frozen X-3 condition applies |
| R-8 | **Worker / channel implementation complexity materially exceeds its benefit** (C-002; 05 §5 "C-002 rules out the multi-process runtime") | DEP-03; the candidate trade-off | Reconsider DEP-03 (fold it into DEP-01; medium reversibility) or the candidate trade-off |
| R-9 | **SA-05 is answered so that a pending version whose preview failed cannot be kept or exported** | Preview-after-admission structure | 05 §5 "materially less attractive": re-evaluate B against the alternatives |
| R-10 | **VD-05 fails** (mirror not current at a leave) | SESSION-02 | A local redesign (high reversibility); AC-30 is re-assessed |
| R-11 | **Reference-slide / template reuse is promoted into V1** (R-010, UC-007 are Later) | X-3 import direction; X-6 input classes; ROLE-01 | Reopen X-3 and the input-role analysis (§16.3) |
| R-12 | **Persistence, accounts or shared-workspace semantics are added** (R-048 Later; DOC-004 §12 A-029 watch trigger) | Session scope; a new storage sink (AC-11, AC-30) | Re-assess the session scope. B's host-held authority is the attachment point; no axis change is expected, but this is not analysed in the frozen candidates |
| R-13 | **The second-view semantics change from Separate**, or reload reattachment is allowed (P5-TENSION-01) | Session authority | Accommodated by B's host authority (09 §5.3). Re-assess AC-28 / AC-30 and VD-P9-02 |

## 16. Deferred and non-baseline decisions

### 16.1 Detailed Design boundary

Selecting B **unlocks Detailed Design and implementation planning**. Detailed Design is not
started in this task. §12 lists what is left to it.

### 16.2 AI model / credential boundary (P7-OPEN-01, kept)

- Provider and credential ownership are **not candidate-defining** for W-035. In B the provider sits
  behind a DeckAgent-owned port called from the worker (DEP-01 + DEP-03).
- The following stay a **future Product / deployment decision plus a Detailed Design concern**:
  - whether DeckAgent ships an app-owned key or users bring their own key (BYOK);
  - whether provider or model choice is user-selectable.

  Nothing is chosen here. OpenDesign is not authority.
- **Requirement on the baseline:** B keeps the AI-provider boundary replaceable at one port
  adapter. The credential's location (the worker environment) is an AC-11 / R-042 declared-sink
  detail for Detailed Design.
- The model instruments that AG-P5-01 needs (§8.2, O-3) are test instruments. Authorizing them
  selects no provider.

### 16.3 Reference-slide boundary (kept)

- Reference-slide reuse is **not a V1 primitive**: R-010 and UC-007 are Proposed / Later. It is
  not added to B.
- Of the three candidates, B has the **smallest current X-3 gap** if it is promoted: a PPTX
  reference deck reads into the PPTX-shaped form. It would still pressure:
  - X-3 coverage (masters and layouts the model would need to express);
  - X-6 input classes (R-010 AC2: reference content must never verify as `source-derived`);
  - ROLE-01 (D-007, R-004).
- Promotion to V1 reopens X-3 and the input-role analysis (R-11). The Revision-0 seam table is in
  Appendix R0 (§R0-15.1).

### 16.4 Other items carried

- **Product details:** rounding tolerance (O-4); `mixed` combinations other than source + AI-added
  (09 §10); the SA-05 policy.
- **Test instruments and process:** raters (O-2); model instruments (O-3); Final Testing Plan
  acceptance rates (O-1 no longer blocks W-035).
- **AG-03 and AG-P6-01:** trade-off evidence, still missing.
- **P6-TENSION-01:** not applicable to B's own serializer choice, which is Detailed Design (library
  or owned).
- **The accommodated open points in 05 §5**, settled without an axis change.

## 17. Final status

- **Phase 7:** completed (Revision 2).
- **W-035:** **completed.**
  - **Candidate B** is selected as the DeckAgent V1 architecture baseline.
  - All of B's required Gate and Observability criteria are `Meets` (DOC-004 §5; §10.4).
  - The remaining empirical work is post-baseline validation debt (§14).
- **Governance:**
  - P7-TENSION-01 is **closed** (§9). The contradiction came from the synthesis's evidence
    classification, not from DOC-004, and DOC-004 is unchanged.
  - P7-PROCESS-CORRECTION-01 stays on record as the owner's philosophy, but it is not
    load-bearing.
- **Selection basis:** current V1 fit (editable PPTX as the primary deliverable; PA-04A = N) and
  minimal implementation ambiguity (D1). This is contextual, not universal.
- **Carried assumption:** ASM-P7-PROV-01 (§10.2).
- **Empirical validation maturity:** partial. Evidence so far is S1b and S2 plus labelled
  reasoning; the debt in §14 is still to be validated.
- **Alternatives:**
  - **A-r1** (now also DOC-004 §5 recommendation-ready) is the primary alternative and the reopen
    candidate.
  - **C** is a documented alternative; AC-02 and AC-11 are open on AG-P4-01.
- **Validation debt and reopen conditions** are explicit (§14, §15).
- **Detailed Design may begin.** It has not been started here.
- **Frozen files 01–09 were not changed by Phase 7.** Their hashes were re-checked then and
  matched §1 (a historical check; see §1). DOC-004, DOC-008
  and Project Hub were not edited.

---

## Appendix R0 — Revision 0 recommendation gate and stop record (superseded)

This is kept as history. As regards W-035's outcome, it is superseded by Revisions 1 and 2 (§9,
§10). Its readiness facts, blockers and per-candidate triggers remain accurate statements of
the evidence under the stricter contract.

Inside this appendix, a reference to §9 … §16 means the Revision-0 section of the same number,
now headed R0-9 … R0-16. References to §1 … §8 are unchanged.

### R0-9 Recommendation-readiness reassessment

Recommendation readiness requires every Gate and Observability outcome to be `Meets`, no
`Does not meet`, no fired revision left unreassessed, and no open candidate-defining Product
question (08 §22 condition 6; DOC-004 §5).

| Candidate | Gate NYA | Obs NYA | Does not meet | Fired, unreassessed revision | Open candidate-defining Product question | Recommendation-ready? |
|---|---|---|---|---|---|---|
| A-r1 | AC-03 (AG-P5-01); AC-10 (AG-P5-01-N) | None | None | None | None | **No** |
| B | AC-03 (AG-P5-01); AC-10 (AG-P5-01-N) | None | None | None | None | **No** |
| C | AC-02, AC-11 (AG-P4-01); AC-03 (AG-P5-01); AC-10 (AG-P5-01-N) | None | None | None (the 08 §9 consequence has not fired, §8.3) | None | **No** |

The requirement is not waived for any candidate.

### R0-10 W-035 decision

**`Phase 7 started but W-035 not completed` — `NO BASELINE SELECTED`.**

**The stop condition that applies:** no candidate became recommendation-ready after the evidence
work allowed in this pass. None of the following fired:

- AG-P5-01 or AG-P5-01-N **did not fail**; they were not run;
- no architecture review fired;
- no new candidate-defining Product question arose;
- no Phase-9 assumption was found inconsistent with Product truth;
- no multi-axis revision arose.

**What blocks the recommendation, exactly:**

1. **For every candidate:** AC-03 and AC-10 are `Not yet assessable`. The evidence that decides
   them (AG-P5-01, AG-P5-01-N) cannot be produced validly until O-1, O-2 and O-3 are provided, and
   O-4 for the rounding cases (§8.2).
2. **For C, in addition:** AC-02 and AC-11 are `Not yet assessable` pending AG-P4-01 (O-5, §8.3).

**Not blocking** (debt or trade-off only; 08 §22):

- AG-02a / AG-02b;
- VD-05, VD-09, VD-10;
- VD-P9-01 … VD-P9-03;
- AG-03, AG-P6-01.

**What is decided in this pass:**

- the Stage A comparison (§3–§7);
- C's provisional "not preferred" standing;
- that the A-r1 / B choice needs the owner's weighting and separating evidence (§7);
- the predeclared AG-P5-01 package (§8.2);
- the S3 / S3b evidence (§8.3).

**When the blockers clear:**

1. Re-assess AC-03 and AC-10 for all three (and AC-02 and AC-11 for C).
2. Re-check that Stage A still holds.
3. Complete this section as the ADR-style W-035 decision required by the Phase 7 brief.

No ADR is written now: an ADR would present a selection that the recommendation contract does not
yet permit.

### R0-11 Selected baseline configuration

**None.** No candidate is selected. A-r1, B and C all remain alternatives as configured in §2.

### R0-12 Accepted trade-offs

**None accepted.** Without a selected baseline there is nothing to accept. The trade-offs that
selecting each candidate would require accepting are recorded, per candidate, in §6 ("Accepted
trade-offs").

### R0-13 Validation debt

This is carried forward for every candidate, because none has been selected. Registers: 08 §21,
09 §12, and this file.

| ID | A-r1 | B | C | Validate when |
|---|---|---|---|---|
| VD-01 AG-02a-A | ● | | | Before implementation planning |
| VD-02 AG-02a-B | | ● | | Before implementation planning |
| VD-03 AG-02a-C | | | ● | Before implementation planning |
| VD-04 AG-02b (after PA-13) | ● | ● | ● | Testing |
| VD-05 ASM-SESSION-01 mirror conformance | ● | ● | | Integration |
| VD-06, VD-07, VD-08 | Dormant (A: VD-06 / VD-07) | | Dormant (VD-08) | Only if PA-04A reopens |
| VD-09 converter on generated decks, concurrency, crashes, **user-machine availability** | | ● | | Integration; before release |
| VD-10 runtime conformance, **extended in Phase 7:** the exact confining configuration (S3 / K2) and a declared startup footprint for AC-11 (S3) | | | ● | Integration; each runtime or configuration change |
| VD-P9-01 PA-04A reopen trigger | ● | ● (revision on reopen) | ● | Implementation and Testing |
| VD-P9-02 one host session per view | ● | ● | | Integration |
| VD-P9-03 no indicators in slides or exports | ● | ● | ● | Testing |

**Recommendation evidence (not debt).** This is still required before any recommendation:

- AG-P5-01 and AG-P5-01-N, for all three;
- AG-P4-01, for C.

### R0-14 Reopen conditions

No baseline was selected, so every trigger is recorded per candidate, for whichever candidate is
later selected. Format: `trigger → affected decision / axis → required response`.

| Trigger | A-r1 | B | C |
|---|---|---|---|
| **VD-P9-01:** HM-1 / HM-4 failures make V1 preview quality unacceptable, so PA-04A moves to G or R | X-4 (within the axis) → AG-01a (G) or AG-01b-A (R) becomes Gate evidence; then VD-06 / VD-07 | X-4 → `CANDIDATE-REVISION-REQUIRED`, MB-08 D → P, with a render in the operation lifetime (08 §15); re-assess AC-06, AC-10, AC-28, AC-08 | X-4 (within the axis) → AG-01b-C becomes Gate evidence; a fail means X-4 restructuring (05 §6) |
| **AG-02a fails** (representation reachability) | X-3 → narrow the model to writer-expressible features; otherwise restructure X-3 | X-3 → candidate invalid; no branch | X-3 → candidate invalid; no branch (screenshot variant excluded) |
| **AG-02b** reference-application fidelity findings (after PA-13) | X-3 → the frozen condition if the Core Flow cannot meet R-028; otherwise record format losses (AC-19, R-026) | Same; under a non-converter reference application, converter fidelity is the question | Same |
| **AG-P5-01 fails** (provenance verification) | X-6 → architecture review of the verification contract | Same | Same |
| **AG-P5-01-N fails** (the grounded numeric claims cannot be identified or checked reliably) | X-6 verification contract → architecture review; AC-10 has no source-number route | Same | Same |
| **The second-view Product semantics change from Separate** | Accommodated (host authority; SA-P3-01 options, 09 §5.3) | Accommodated | Shared → **architecture review**; Refuse → added mechanism; Take over → revision (09 §5.3) |
| **Reload reattachment** (P5-TENSION-01: R-045, UC-011 or BR-012 changed) | Accommodated | Accommodated | Authority relocation; C's AC-01 and AC-30 re-assessed (06 §2) |
| **Persistence, accounts or shared workspace** (R-048 Later; the A-029 watch trigger; DOC-004 §12) | Session scope plus a new storage sink (AC-11, AC-30 revisited). Not analysed in the frozen candidates | Same | Session state leaves page memory → authority relocation (05 §6 reattachment analysis) |
| **Reference-slide / template workflow promoted to V1** (R-010, UC-007 are Later) | X-3 import direction; X-6 input classes (§15.1) | Same (smallest X-3 gap) | Same (reverse web conversion; the largest X-3 gap) |
| **A dependency or runtime proves unavailable or operationally unacceptable** | Headless render path or PPTX library → a local replacement (export or AC-18 path only) | Converter (VD-09) → AC-01 / AC-18 reopen; B invalid if no render path can be kept | Runtime (VD-10) → X-5 → DEP-01 (medium; the rest unchanged) |
| **VD-05** mirror conformance fails | SESSION-02 redesigned locally (high) | Same | n/a |
| **VD-P9-02** per-view session isolation fails | A local fix in session scoping | Same | n/a (per-page by structure) |

### R0-15 Deferred / non-baseline decisions

#### R0-15.1 Reference-slide mechanism boundary

**Product status.** R-010 ("use a sample deck to learn from") and UC-007 are **Proposed / Later**.
R-010 AC2 states that sample-deck content is not treated as real information for the new deck.
Reference-slide retrieval and reuse is therefore **not** a V1 generation primitive. It is not added
to any candidate. PPTAgent is reference research, not Product authority.

**Where the seam would attach** (`content plan → reference retrieval → layout / style adaptation →
representation → preview / export`). This is not designed here.

| Step | A-r1 | B | C | Axis pressured |
|---|---|---|---|---|
| Reference ingestion and retrieval | PPTX → neutral-model import (a new reader) | PPTX → PPTX-shaped model (closest to the form) | PPTX → web form (the reverse of its converter) | **X-3** (import direction and capability coverage) |
| Layout / style adaptation | In the model plus the layout computation (its text-metric part becomes relevant) | In native shapes; fit known after output | Browser reflow plus measurement | X-4 (fit knowledge) |
| Role and provenance | ROLE-01 handles a "sample deck" role (D-007, R-004). R-010 AC2 makes reference text a second input class that must never verify as `source-derived` | Same | Same | **X-6** verification rules (high reversibility); the PROV-01 label semantics |
| Preview / export | Unchanged | Unchanged | Unchanged | — |

**What reopens the analysis:** a Product change that moves R-010 or UC-007 into V1, or that makes
reference-based generation a generation primitive. W-034 / W-035 analysis of X-3 (import) and
X-6 (input classes) would then be re-run.

#### R0-15.2 AI model / credential boundary (P7-OPEN-01)

**Authority check.**

- The Project Hub snapshot contains no statement on the model provider, an app-owned API key, a
  user-supplied key (BYOK), or user-selectable providers. A search of the snapshot returned no
  match.
- DOC-004 does not require choosing a provider (AC-22) or local-only model use (AC-11).
- OpenDesign's BYOK behaviour is reference research, not DeckAgent Product authority, and it is not
  used.

**Is it candidate-defining?** **No.**

- In all three candidates the provider sits behind a DeckAgent-owned port (F-05, DEP-01): in-process
  in A-r1, from the worker in B, through the runtime in C.
- Which provider is used, and who owns the credential, changes no axis.

**Residual interactions**, recorded for later and not decided:

- **C:** the external runtime brings its own authentication and provider support. S3 used an
  API-key variable. So BYOK or user-selectable providers would narrow the eligible runtimes (VD-10).
- **All three:** where a credential lives (process environment, worker, runtime) is an AC-11 /
  R-042 data-handling detail. It is a declared-sink question, not an axis.
- **D-027** (a local app, no host, no accounts): an app-owned key shipped to user machines has a
  deployment and security implication. That is a Product / deployment decision.

**Classification.**

- **Future Product / deployment decision**, for key ownership and provider selectability.
- **Detailed Design**, for adapters and credential storage.
- It stays **outside W-035**. It is not added to Project Hub.
- Separately, the AG-P5-01 package needs model **instruments** (O-3). Authorizing them selects no
  provider.

#### R0-15.3 Other items carried outside the baseline

- **P6-TENSION-01:** whether the writers and converters are owned or libraries (A-r1, C). The cost
  falls on AC-21 or AC-22; it is Detailed Design.
- **PA-13:** the reference application; deferred (D-026).
- **AG-P6-01:** team capability; trade-off only; missing.
- **AG-03:** cost after a stop; trade-off only.
- **The `mixed` combinations other than source + AI-added** (09 §10). Product detail; P-09 is
  unscored.
- **Rounding tolerance for source figures** (O-4). Product detail; shared.
- **PA-12 realization:** the provenance UI interaction is Detailed Design / UX (09 §9.4).

### R0-16 Final status

- **Phase 7:** started. **W-035:** **not completed — NO BASELINE SELECTED** (§10).
- **Evidence executed in Phase 7:** AG-P4-01 as S3 (literal contract fail) and S3b (disclosed
  correction; fail under its own rule). **Not resolved.**
- **Evidence not executed:** AG-P5-01 and AG-P5-01-N, which are not validly executable until O-1 …
  O-4 are provided. Their predeclared case matrix is ready (§8.2).
- **Recommendation readiness:** A-r1 no; B no; C no.
- **Stage A:** complete.
  - No candidate is eliminated.
  - C is provisionally not preferred on current evidence.
  - No provisional preference between A-r1 and B.
  - Separating evidence and the owner's weighting are identified.
- **Frozen files 01–09:** unchanged at Revision 0. The hashes were re-checked then and matched §1.
- **Nothing** was selected, recommended, ranked or scored. Project Hub was not updated.
