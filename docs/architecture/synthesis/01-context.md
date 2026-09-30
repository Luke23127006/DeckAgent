# Phase 0 — Authoritative Context Inventory

- Purpose: working context for architecture synthesis (W-033 onward). Inventory only — no mechanisms,
  no candidates, no recommendations.
- Built: 2026-09-30 from the Project Hub snapshot synced 2026-09-30T03:31:28Z (schema 4,
  `project-hub status` = fresh, `validate` = no structural issues).
- Part of the DeckAgent architecture synthesis. Not an authoritative document.

**Evidence-class tags used below**

| Tag | Meaning |
|---|---|
| `[PH]` | Authoritative product fact (Project Hub row) |
| `[AC]` | Architecture criterion (DOC-004) |
| `[RC]` | Research-contract rule (DOC-005) |
| `[REF]` | Reference-system source fact, as recorded by DOC-006/DOC-007 (Explicit or code-observed) |
| `[INF]` | Researcher inference, as recorded by DOC-006/DOC-007 |
| `[OQ]` | Open question (Product-owned unless stated) |
| `[GAP]` | Evidence gap |
| `[P0]` | Observation made while compiling this inventory (not a source fact) |

---

## 1. Source inventory

| Source | Role | Authority | Version / date | Caveats |
|---|---|---|---|---|
| Project Hub snapshot `.project-hub/snapshot/` | Requirements, BRs, Decisions, Risks, Constraints, UCs, Assumptions, Learnings, Work | **1 — source of truth** | Synced 2026-09-30T03:31Z; last changed tables: requirements, work, documents | Cell text is Vietnamese; treated as data. Some notes are stale (see §7). |
| DOC-004 `docs/architecture/architecture-acceptance-criteria.md` | Architecture evaluation semantics (AC-01 … AC-30) | 2 — for evaluation semantics | File header: Draft, updated 2026-09-30 (W-037, D-030); checked against a snapshot "synced 2026-09-30 03:05 UTC" | Header says Draft; PH says Active. Checked against a snapshot ~26 min older than the current one (§8). Cites DOC-002 sections and DOC-008 TN/F items that were not read in Phase 0. |
| DOC-005 `docs/research/reference-system-research-contract.md` | How reference evidence is gathered/interpreted; RQ-01 … RQ-17 ↔ AC map | 3 — for interpreting reference evidence | File header: Draft, updated 2026-09-28 and 2026-09-30 (RQ-07/09/14 widened for D-030) | PH `last_updated` still 24/09/2026. OpenDesign repo URL still a placeholder in §1.2. |
| DOC-006 `docs/research/pptagent/pptagent-architecture-research.md` | PPTAgent evidence (F-PPT-01 … 20, ADR-PPT-01 … 11) | 4 — evidence | Pinned `v0.2.0` / `d53296bc…`; paper EMNLP 2025 (`2025.emnlp-main.728`); research 2026-09-28 … 30; explicit contract-alignment note 2026-09-30 | Researcher name not filled (PH owner: Trâm). W-030 still In Progress in PH; doc says "Ready for review". PH DOC-006 has no link. §4.2 contains researcher-derived alternatives labelled non-evidence. |
| DOC-007 `docs/research/opendesign/opendesign-architecture-research.md` | OpenDesign evidence (F-OD-01 … 17, §4 rationale review) | 4 — evidence | Pinned tag `open-design-v0.24.0` / `0d3a14c1…` (package.json reports 0.23.1); research 2026-09-25, revised 2026-09-30 | No contract-alignment note for the widened RQs; coverage table unchanged (one finding per RQ). Researcher named as "workstream" (PH owner: Bảo). PH link points to a `.vi.pdf`. |
| DOC-002 (V1 Goal, Scope & Acceptance Baseline, PDF) | Official V1 baseline | Upstream of PH V1 rows | 17/09/2026; later adjustments live in D-024 … D-030 | **Not read in Phase 0** (not in repo). V1 facts below come from PH and DOC-004 only. |
| DOC-008 `docs/testing/testing-approach.md` | Testability needs TN-1 … TN-6, findings F12/F14/F15 cited by DOC-004 | Derived | PH notes say it does not yet reflect R-045/R-046 or D-030 | **Not read in Phase 0**; referenced only through DOC-004. |
| DOC-011 Figma prototype | Behavior clarification for 8 V1 UCs | Supporting (not technical evidence) | 27/09/2026; Active; W-027 in Review | Not read. DOC-004 §12 says no prototype artifact was incorporated. |

---

## 2. V1 product boundary

All items `[PH]` unless tagged. "DOC-004" references are to its restatement, not new semantics.

| Area | V1 boundary | References |
|---|---|---|
| Product stance | AI-first; not a professional slide editor; deep editing happens in PowerPoint after PPTX export | D-006, D-015, R-041, R-029; AC-12 |
| Core flow | Prompt (+ optional one source) → first deck → preview → repeated deck-level AI refinement (each result a pending version, keep/reject) → PPTX + PDF export of the previewed version | D-012, R-006, R-011, R-019, R-020, R-029 AC1; DOC-004 AC-01 |
| V1 Use Cases | UC-001, UC-002, UC-004, UC-008, UC-011, UC-013, UC-014, UC-015 (all others Later/Draft/Deprecated) | use-cases.tsv; DOC-011 |
| Input | 5 source types: pasted text, TXT/Markdown, PDF with text layer, DOCX, PPTX (content only). One source per deck. Embedded images not extracted/reused. Unsupported types rejected with the list of 5. | D-024, R-003, BR-009, UC-002 2A |
| Input role | Role by purpose, not extension (D-007 Active). V1 accepts only the content-source role; the limit must be disclosed, not implicit. | D-007, R-004, BR-001 (exception 1); AC-13 |
| Source handling | Source content is untrusted data, never instructions. Source facts/numbers/quotes preserved; AI-added content not presented as source-derived (ask or mark). | R-043, BR-008, R-007, R-008, BR-002; AC-02, AC-03 |
| Clarification | Ask when topic/purpose cannot be determined; do not ask a fixed checklist | R-002, UC-001 3A, UC-002 4A |
| Intent / constraints | Captured from the request; persist across refinements until changed/cancelled | R-001, R-024, BR-003, D-025; AC-04 |
| Refinement | Whole-deck only, 7 types: length, tone, audience, order, polish, major content change, full regenerate. Slide-targeted requests = best-effort with prior disclosure (BR-011). Local/component edit, add images, translation → refused with disclosure (UC-004 2C). | D-025, D-014, R-011, R-013, BR-011, BR-013 |
| Validation | AI results are checked before becoming pending/accepted; specific checks undecided | R-033, D-028; AC-06, AC-10 |
| Minimum quality (hard) | P1 source fidelity, P5 output fidelity, plus 4 P3 failures: unreadable/severely clipped text, broken narrative, broken/unintended blank slide, severely broken layout. P4 Safe Refinement is **not** hard acceptance. | D-017, D-028, R-021 |
| Preview | Current deck previewable after generation, after each refinement, before export; preview must match exported files within format limits | R-019, R-028, UC-015; AC-05 |
| Export | PPTX (editable) + PDF (view-only). Built from the **previewed** version, no AI regeneration. Known format losses disclosed. Files must open in the target environment (per-app compatibility learned later). | D-026, R-020, R-025 … R-028, BR-006, BR-007, BR-013, UC-008 |
| Version lifecycle | Accepted/pending with one-step reject; promotion rules in BR-010 / D-030 (see §5) | BR-010, D-025, D-030, R-031 |
| Stop / failure | User can stop a running generation/refinement; stop and failure create no version and restore the recovery baseline; external failures end deterministically, no hang | R-046, D-029, R-031, R-032, BR-005, BR-014; AC-08, AC-28 |
| Concurrency | At most one AI generation/refinement per session at a time; new request while running → wait or stop | BR-014, UC-014 2C |
| Session | Deck, source, constraints exist only in the current session. Warn (cancellable) before an action that would lose an undownloaded deck (new deck, reload, close). Exported file is the only way to keep a deck. | D-027, BR-012, R-045, UC-011, UC-008 postcondition 5 |
| Runtime | Local web app on the user's machine; no hosting, accounts, collaboration | D-027 |
| Privacy | User content not exposed via logs/temp files/external processing beyond design; sending to AI provider still to be considered by architecture | R-042 (note), D-027; AC-11 |
| Progress | Long operations show status; errors give a next step | R-030, UC-014 |
| Resources | Must fit a Software Engineering course project; no large custom subsystems just to reach core results | C-002, R-041 |
| Explicitly Later | Existing-deck editing (UC-003), local edit (UC-023), multi-version history (UC-022), persistence (R-048/UC-021), themes (UC-017), translation (R-044/UC-025), outline review (UC-016), accounts/sharing (UC-009/010/019/020), more formats, more input types | D-013, D-014, D-027, R-044, L-001, L-002 |

---

## 3. Architecture-relevant Project Hub inventory

### Requirements (V1 Active unless noted)

| ID | Short description | Why it matters to architecture | AC (explicit in DOC-004 §10.4) |
|---|---|---|---|
| R-001 | Capture intent + constraints as state later steps use | Intent must exist as state, not only inside deck | AC-04 |
| R-003 / R-004 | 5 source types; role by purpose | Input boundary; role/extension separation | AC-01, AC-02, AC-13 |
| R-006 | Complete working deck from prompt ± source | Core Flow completeness | AC-01 |
| R-007 / R-008 | Source fidelity; AI-added content distinguishable | Origin must survive every step | AC-03, AC-16 |
| R-011 | Chat refinement, 7 types; each refinement → pending | Refinement loop + version lifecycle | AC-01, AC-29 |
| R-019 | Preview after generate/refine/before export | Preview path | AC-01 |
| R-020 | Export from previewed version; pending promoted only on successful export; cancelled/failed export changes nothing | Export ↔ version direction; export as promotion trigger | AC-01, AC-05, AC-09, AC-15, AC-29, AC-30 |
| R-021 | Minimum deck quality (D-028 hard list) | Validation + observability of layout/text | AC-10, AC-14, AC-18 |
| R-024 | Constraints persist; commit-boundary ordering; rollback of constraints (AC2–AC4) | Constraint lifecycle tied to version lifecycle | AC-04, AC-06, AC-08, AC-17, AC-28, AC-29 |
| R-025 / R-026 / R-027 / R-028 | Cross-format meaning; disclose format losses; valid files; preview ≈ export | Export fidelity + observability | AC-05, AC-09, AC-10, AC-14, AC-15, AC-19 |
| R-030 | Progress + actionable errors | Status reporting | AC-20, AC-28 |
| R-031 | Return to latest accepted on reject/failure; after commit-boundary promotion, return to that version (AC2) | Recovery baseline | AC-06 … AC-09, AC-17, AC-28, AC-29 |
| R-032 | Deterministic end on AI/external failure or timeout | External-call boundary | AC-08, AC-20, AC-22 |
| R-033 | Check AI results before pending/accepted | Validation placement | AC-06, AC-10 |
| R-041 | No professional editor needed (Constraint-type) | Excludes editor-dependent flows | AC-12 |
| R-042 | Bounded user-content exposure | Data-flow boundaries | AC-11 |
| R-043 | Source content is data | Trust boundary | AC-02 |
| R-045 | Warn before losing undownloaded deck; no warning when nothing undownloaded | Session-loss state | AC-17, AC-30 |
| R-046 | Stop running AI op; return to baseline; no dangling pending | Stop semantics | AC-17, AC-20, AC-28 |
| R-038 / R-039 / R-040 (Proposed, Later) | Add input type / output format / swap AI provider cheaply | Considered as trade-offs only, "not V1 acceptance" | AC-26 (R-039); R-038, R-040 have no explicit AC |
| R-044 (Proposed, Later) | Whole-deck translation | Option value | AC-27 |

### Business Rules (V1 Active)

| ID | Short description | Why it matters | AC (DOC-004 §10.6) |
|---|---|---|---|
| BR-001 | Role by purpose; V1 content-source only, disclosed | Input model | AC-13 |
| BR-002 | Source facts preserved; AI additions distinguishable | Provenance | AC-03, AC-16 |
| BR-003 | Constraints persist until changed/cancelled; single-refinement constraints expire (distinction TBD) | Constraint lifetime | AC-04 |
| BR-005 | Keep/restore last accepted on failure/reject; no snapshot/diff mechanism required | Recovery | AC-07, AC-08, AC-09, AC-28 |
| BR-006 | Export exactly the previewed version, no AI regeneration | Export direction | AC-05 |
| BR-007 | Meaning-level (not pixel) consistency across formats | Fidelity definition | AC-05, AC-15, AC-19 |
| BR-008 | Source content never changes system behavior | Trust boundary | AC-02 |
| BR-009 | One source per deck; PPTX source = content only | Input boundary | AC-01, AC-13 (no dependent choice) |
| BR-010 | Accepted/pending lifecycle, commit boundary, recovery baseline (8 rules) | Central state invariant | AC-06 … AC-09, AC-17, AC-28, AC-29 |
| BR-011 | Slide-targeted refinement disclosed as best-effort | Pre-flight step before commit boundary | Product behavior (§12) |
| BR-012 | Session-only deck; warn before loss | Session state | AC-01, AC-30 |
| BR-013 | Disclose limits, never fake capability | Refusal/disclosure paths | AC-19 (format losses) |
| BR-014 | One AI op per session; stopped/failed op creates no version | Concurrency + stop | AC-08, AC-17, AC-28 |

### Decisions (Active, architecture-relevant)

| ID | Short description | Why it matters | AC |
|---|---|---|---|
| D-005 | Architecture docs must show dependency, boundary, contract | Output-format expectation for architecture | — |
| D-006 / D-015 | AI-first; no in-app editor; PPTX is the hand-off | Scope limit | AC-12 |
| D-007 | Role by purpose, not extension | Input model | AC-13 |
| D-009 / D-010 | Meaning-level fidelity; multi-format is a constraint, consistency a quality req | Fidelity definition | AC-05, AC-15, AC-19, AC-26 |
| D-011 | No mechanism or numeric threshold fixed before criteria/evidence | Governs all of Phase 1+ | AC-10, AC-24 (mechanism boundary) |
| D-012 | V1 proves the end-to-end creation-first flow | Core Flow | AC-01 |
| D-013 / D-014 | No existing-deck editing; whole-deck refinement only | Scope | §12 exclusions |
| D-017 | Critical: P1, P2, P3, P5; P4 not hard | Priority of quality properties | AC-03, AC-04, AC-14 … AC-19 |
| D-018 | Hybrid mode: one end-to-end slice + spikes for big unknowns | Allows spikes for evidence gaps | — |
| D-023 | Sprint 2 stops at Architecture Decision + Testing baseline; no Detailed Design | Phase boundary | — |
| D-024 … D-028 | V1 boundary (input, refinement, formats, runtime/session, quality minimum) | Scope | AC-01 etc. |
| D-029 | User can stop AI generation/refinement; stop changes no accepted version. **Reopen if architecture shows stop leaves undefined state, or export must be stoppable.** | Stop invariant + reopen trigger | AC-28 |
| D-030 | Commit boundary for promoting pending on a further refinement; rollback target | Central lifecycle rule | AC-06, AC-08, AC-17, AC-28, AC-29 |

### Risks

| ID | Description | Why it matters | AC |
|---|---|---|---|
| RK-006 | Exported PPTX layout drift/format loss breaks the D-015 hand-off | Export design + real-artifact evidence | AC-19 |
| RK-007 | Late AI result after stop overwrites accepted version or still incurs cost | Commit placement vs outstanding calls | AC-28 (state half); cost half not a criterion |

Note: RK-006 mitigation 3 ("prefer native PPTX elements") is a Risk-row mitigation, not a Decision `[P0]`.

### Constraints

| ID | Status | Description | Why it matters | AC |
|---|---|---|---|---|
| C-002 | Active | Must fit course-project resources | Feasibility screening/comparison | AC-21, AC-22 |
| C-003 | Active | Multiple export formats required academically (V1: PPTX, PDF) | Output extensibility | AC-26 |
| C-004 | Active | Formats differ in capability; don't assume parity | Fidelity definition | AC-26 (informs) |
| C-001, C-005, C-006, C-007 | Retired | Content moved to D-006/D-015, D-007, D-011 | Do not cite as active constraints | — |

### Use Cases (V1)

| ID | Architecture-relevant flows | AC (DOC-004 §10.5) |
|---|---|---|
| UC-001 | Prompt-only generation; 3A clarify; 4A stop; 4B AI failure; 5A validation fail → no deck; success → first accepted | AC-01, AC-04, AC-06, AC-08, AC-10, AC-28, AC-29 |
| UC-002 | Source-based generation; file checks; source as data; 5A **mid-generation** ask-or-mark for missing source info; P1 check listed at step 6 | AC-01 … AC-04, AC-06, AC-08, AC-10, AC-11, AC-13, AC-16, AC-28, AC-29 |
| UC-004 | Refinement; step 2′ commit boundary; 1A/2A/2B/2C pre-flight outcomes; 3A/3B/4A rollback to the version accepted at 2′ | AC-01, AC-04, AC-06, AC-07, AC-08, AC-10, AC-28, AC-29 |
| UC-008 | Export; 3A loss disclosure + cancel; 4A failure changes nothing; step 7 promotion if exported from pending | AC-05, AC-09, AC-10, AC-12, AC-19, AC-29, AC-30 |
| UC-011 | New deck/reload/close; warn if "latest version not downloaded"; 1A AI running → wait/stop | AC-11, AC-30 |
| UC-013 | Reject pending → accepted + pre-request constraints restored; 1A no pending | AC-07, AC-17, AC-29 |
| UC-014 | Progress + stop; terminal states done/stopped/error; no half-deck | AC-08, AC-20, AC-28 |
| UC-015 | Preview matches file; preview never changes deck; 1A/1B render failures | AC-05, AC-14, AC-15, AC-18 |

### Assumptions (Open, architecture-relevant — already in PH)

A-008 (users want AI to do most work), A-009 (chat is primary interaction), A-013 (constraints must persist; lifetime/conflicts open), A-014 (role-by-purpose has value), A-015 (source/AI distinction matters), A-016 (meaning over pixel fidelity), A-017 (preview is trustworthy for decisions), A-020 (users accept PowerPoint hand-off), A-021 (whole-deck refinement is enough for V1), A-022 (exported PPTX is usable for hand-off), A-023 (PPTX+PDF suffice for P5), A-029 (session-only is acceptable). A-004 is Retired (no existing architecture to preserve).

### Open Product Questions (from PH)

| Source | Question | Architecture relevance |
|---|---|---|
| A-013 / BR-003 exc. 1 | Constraint lifetime; conflicts; distinguishing single-refinement constraints | Constraint state shape (DOC-004 deliberately keeps this non-gating) |
| BR-010 rule 3c / UC-008 step 7 | What counts as "delivered" for promotion on export | Commit point on export path (AC-29) |
| R-045 / BR-012 / UC-011 | What counts as "undownloaded" | Session-loss state (AC-30) |
| R-025 / R-028 vs R-020 | Do cross-format/preview-match reqs apply to exports of a pending version | AC-05 scope |
| R-033 note / UC-002 step 6 | Which checks run in-product vs only as test oracles | Validation placement (AC-10) |
| UC-014 OQ-1 / D-029 reopen | Can export be stopped | Would extend AC-28 |
| UC-014 OQ-2 / R-032 / D-011 | Timeout thresholds, retry counts | Deferred to benchmark |
| UC-002 OQ-1 | Source size/page limits | Input boundary sizing |
| UC-002 OQ-2 / R-007 | How "important information" for P1 is measured (W-032) | Verification design |
| UC-008 OQ-1 / D-026 | Which app verifies PPTX first | RK-006 evidence |
| UC-011 OQ-1 / R-042 | Are session source/temp files deleted immediately | AC-11 (not gated) |
| R-008 note | How AI-added content is shown to users | Origin presentation (AC-16 does not require showing) |
| R-030 note | Progress UI | Not architectural per DOC-004 AC-20 |

---

## 4. Architecture Acceptance Criteria inventory

DOC-004 semantics preserved `[AC]`: Gates and Observability needs are **screening** (`Meets` / `Does not meet` / `Not yet assessable`; the last is an evidence gap, and before W-035 recommends a baseline it counts as not meeting). Trade-off dimensions are **narrative comparison only** — no pass/fail, no numeric score. Criteria constrain **outcomes, not mechanisms** (each has a "Does not require" line). Outcomes apply to DeckAgent candidates only, never to reference systems.

### Gates (AC-01 … AC-13, AC-28 … AC-30)

| ID | Short name | Concern constrained | Product ambiguity deliberately left open |
|---|---|---|---|
| AC-01 | V1 Core Flow completeness | Prompt ± 1 source → draft → preview → repeated refine (pending, keep/reject) → PPTX+PDF of previewed version; local, no hosting | Stop (AC-28) and new deck (AC-30) are assessed separately, not in Core Flow |
| AC-02 | Source content handled as data | Trust boundary between instructions and source | Technique |
| AC-03 | Source-derived vs other content kept distinct | Origin distinction survives all steps | Granularity/representation |
| AC-04 | Active constraints remain available | Constraints available to later refinements independent of deck content | Constraint lifetime, expiry, single-refinement distinction (A-013, OQ-04) |
| AC-05 | Preview and exports derive from same version | Export from exactly the previewed version; no regeneration; version stable during export | Whether R-025/R-028 cover pending-version exports |
| AC-06 | Unvalidated results don't become pending/accepted | Validation precedes visibility/authority; invalid → no version, recovery baseline restored | Which checks |
| AC-07 | One-step reject of pending | Accepted version + pre-request constraints retained while pending exists | Keeping replaced accepted versions after promotion (not required) |
| AC-08 | Operation failures end in determinate state | No hang, no half-applied change; failed refine → recovery baseline at commit boundary; failed first gen → no deck | Timeouts/retries (D-011) |
| AC-09 | Cancelled/failed exports change no version | Export path cannot write versions before success; retry without regeneration | Whether export can be stopped |
| AC-10 | Validation possible and verifiable at acceptance and delivery points | Validation possible at generation, refinement, each output; outcome (ran / on what / verdict) observable | Which checks run in-product vs test oracle (DOC-008 F15) |
| AC-11 | User content exposure bounded | Every write/send of user content is intended and identifiable | Session-file deletion (UC-011 OQ-1) |
| AC-12 | No professional-editor dependency | Core Flow needs no object-level user manipulation | — |
| AC-13 | No extension-to-role lock-in | File type must not permanently fix role | No role mechanism required now |
| AC-28 | Stopping an AI operation changes no version | Stop anytime; no version even from late result; stopped refine → recovery baseline; commit-boundary promotion stands; one op at a time; stop/completion race → exactly one wins | Cancelling the external call itself / its cost; stopping export |
| AC-29 | Version transitions only at defined events | Exactly 1 accepted, ≤1 pending; transitions only per BR-010; commit-boundary and export-promotion commit points identifiable; atomic transitions | Definition of "delivered" (candidate must be able to commit at whichever event Product picks) |
| AC-30 | Session-loss state available | Deck existence, versions, successful exports by version+format available wherever session-ending actions are intercepted | Definition of "undownloaded" (format(s), which version, browser close vs process kill) |

### Observability needs (AC-14 … AC-20)

| ID | Short name | What must be observable | Ambiguity left open |
|---|---|---|---|
| AC-14 | Geometry and text metrics per output | Positions/sizes/text fit for preview, PPTX, PDF | Metrics, thresholds |
| AC-15 | Slide order and text readable | From every output and each version (accepted, pending) | Extraction method |
| AC-16 | Content origin observable | source / user-stated / AI-added for any version | Showing origin to users |
| AC-17 | Version states observable | Accepted, pending, successful exports per version+format; before/after last refinement incl. reject, stop, failure, pre-commit cancel | "delivered", "undownloaded" |
| AC-18 | Whole deck viewable as rendered | Rendered view of every slide without manual interaction | Renderer/format |
| AC-19 | Output degradation discoverable | Version ↔ real artifact differences detectable and recordable | Target compatibility app |
| AC-20 | Operation status and failure cause reportable | Status, terminal state (done/stopped/error), cause | UI, taxonomy |

### Trade-off dimensions (AC-21 … AC-27)

| ID | Short name | Comparison question |
|---|---|---|
| AC-21 | Team feasibility / learning curve | Custom/unfamiliar subsystems vs team capacity (C-002) |
| AC-22 | External dependency cost | Critical-path dependencies, replaceability, failure/licensing |
| AC-23 | Blast radius | Spread of a wrong assumption or runtime failure |
| AC-24 | Rollback / redesign cost | Cost to reverse if evidence invalidates (D-011) |
| AC-25 | Testability cost | Effort to verify P1/P2/P3/P5 + lifecycle/stop/session; TN-1/TN-3/TN-5 compared here |
| AC-26 | Output-target extensibility | Cost of an extra format; stays on export side? (no canonical IR required) |
| AC-27 | Translation readiness | Cost of later whole-deck translation as a refinement |

DOC-004 §11 carries one non-Product uncertainty into W-033/W-034 `[AC]`: some P3 checks may only be detectable on rendered output, which would require rendering before a result is displayed/accepted.

---

## 5. Version lifecycle and operation semantics

Authoritative: BR-010 (8 rules), D-030, R-020, R-024 AC2–4, R-031 AC2, R-046, BR-014, UC-004, UC-008, UC-013, UC-014. DOC-004 §3.3 restates without adding semantics (verified `[P0]`, one naming note: "recovery baseline" is DOC-004 shorthand, not a PH term).

| Concept | What the authoritative sources define | References | Left to Product |
|---|---|---|---|
| **Accepted version** | The version the deck returns to on reject/failure. Created by successful first generation or by promotion. Only one must be retained as recovery base; older accepted versions need not be kept. | BR-010 r1, r3, r8; R-031 | — |
| **Pending version** | Result of an AI refinement that passed validation, awaiting user decision. Each refinement yields one. At most one exists (DOC-004 derivation from BR-010 r3b). | BR-010 r2; R-011 AC2; R-033; AC-29 | — |
| **Previewed version** | What the user is viewing: accepted, or pending if it exists and is shown. Preview never changes the deck. | R-019; UC-015 postcond. 2; DOC-004 §3.3 | What preview shows while a refinement is running — ownership TBD (SA-02) |
| **Exported version** | The previewed version at the time of export; no AI regeneration. | R-020 AC1–2; BR-006; UC-008 step 4 | Whether R-025/R-028 apply to pending exports |
| **Promotion** (pending → accepted) | Three triggers: (a) user keeps; (b) further refinement reaches its commit boundary; (c) file exported from pending is produced successfully **and delivered**. | BR-010 r3; D-030; UC-008 step 7 | Which event = "delivered" (c) |
| **Refinement commit boundary** | Point immediately before the new AI operation begins. Reached once the request is not refused and no clarification/warning/confirmation remains; reached directly if none needed — no added confirmation. Before it: pending stays pending; new constraints not applied. At it, in order: pending → accepted; its constraints become the accepted constraint set; new request's constraints applied; AI operation starts. | BR-010 r3b, r4, r5; D-030; UC-004 step 2′, 1A, 2A–2C; R-024 AC2–3 | — |
| **Recovery baseline** (DOC-004 term) | For a refinement: the accepted version **at that refinement's commit boundary** (may be the just-promoted pending), with its constraint set; never an older version. Only this one must be kept. | BR-010 r5, r8; R-024 AC4; R-031 AC2; R-046 AC2 | — |
| **Keep** | Pending becomes accepted. | BR-010 r3a | — |
| **Reject** (discard pending) | Deck returns to the accepted version that was the base for that refinement; constraints introduced by the request that produced the pending are cancelled. Not available if no pending (kept, promoted at commit boundary, or exported). | BR-010 r7; UC-013 (postcond. 1–2, 1A); D-025 | — |
| **Failed refinement** (AI/external failure, timeout, or validation failure) | No version created; deck + constraints return to the recovery baseline; new request's constraints dropped; a promotion done at the commit boundary stands. | BR-010 r5; BR-014 r2; R-024 AC4; R-031; UC-004 3B, 4A; UC-014 2B | Timeout/retry values (D-011) |
| **Stopped refinement** | User may stop anytime before finish. No version created; deck + constraints return to recovery baseline; no dangling pending. | R-046 AC1–3; D-029; BR-014 r2; UC-004 3A; UC-014 2A | Late-result handling is a criterion (AC-28), not a Product rule; RK-007 cost half not a criterion |
| **Pre-commit cancel / refusal** | Request cancelled/refused during clarification, warning, confirmation, or refused as unsupported: pending stays pending; no constraints retained; UC ends. | BR-010 r4; D-030; UC-004 1A, 2A, 2B, 2C | — |
| **First generation** | Success (passes validation) → accepted directly (no pending). Failure, stop, or validation fail → no deck. Preconditions: no deck in session, no AI op running. | BR-010 r1; UC-001 4A/4B/5A, postcond. 1; UC-002 5B/5C/6A | Whether UC-002 5A (ask-or-mark during generation) is an in-operation interaction — ownership TBD (SA-01) |
| **Export success** | File built from previewed version, checked to open, delivered; if from pending, pending → accepted. Only persistence path after session ends. | R-020; R-027; UC-008 steps 4–7, postcond. 2, 5; BR-010 r3c | "delivered"; "undownloaded" accounting |
| **Export failure / cancel** | No broken file delivered; accepted and pending unchanged; retry without regeneration; cancel at loss-disclosure step leaves pending pending. | R-020 AC3; BR-010 r6; UC-008 3A, 4A; AC-09 | Whether export can be stopped mid-production |
| **One op at a time** | One AI generation/refinement per session; new request while running → wait or stop. | BR-014 r1; UC-014 2C; UC-011 1A | Whether export may run concurrently with an AI op — ownership TBD (SA-03) |
| **Session-ending actions** | New deck, reload, close. If an undownloaded deck exists → warn, cancellable; no warning otherwise. New deck discards deck, source, constraints. Reload/close rely on browser leave-page warning. AI running → wait or stop before new deck. | R-045; BR-012; D-027; UC-011 (1A, 1B, 2A, 3A, 4A) | "undownloaded" definition (UC-011 step 2 says "latest version downloaded" but format/version scope unspecified); temp-file deletion (UC-011 OQ-1) |

---

## 6. Reference-system evidence inventory

Reading rules `[RC]`: evidence only; no reference system is a candidate or a scope source; no verdicts; DeckAgent version terms need not exist in a reference system — mapping is by resemblance only. DOC-006 §4.2 "Researcher-derived comparison hypothesis" rows are **not evidence** and are excluded from the clusters below.

### PPTAgent (DOC-006; `v0.2.0`, paper EMNLP 2025)

| Cluster | Findings | What the system does | Rationale / trade-off evidence | Mismatch with DeckAgent | AC |
|---|---|---|---|---|---|
| Input / source | F-PPT-01, 02; ADR-PPT-01 | Web: PDF = content, PPTX = reference template via separate parameters/dirs; MCP: packaged templates + client-supplied content. Role set by adapter path. `[REF]` | Simple wiring; new roles need new adapters `[INF]`. Paper assumes one doc + one reference. | Reference-template input not in V1; role effectively tied to file kind in Web. | AC-02, AC-11, AC-13 |
| Intent / state ownership | F-PPT-03, 20; ADR-PPT-03 | Request-derived fields (source_doc, language, length factor, outline) stored on a stateful `PPTAgent` object; no separate intent model. Web creates a fresh object per task; reused object keeps stale fields; no rollback of request state. `[REF]` | Compact API vs implicit lifetime `[INF]`. Artifact recovery ≠ intent recovery. | Generation context ≠ active constraints; no refinement loop. | AC-04, AC-08, AC-28 |
| Generation orchestration | F-PPT-04, 05; ADR-PPT-02, 04, 05 | Stage I induction → serializable `slide_induction` catalog; Stage II fixed orchestrator (planner → per-slide content organizer → layout selector → editor → coder → executor), slides concurrent via `asyncio.gather`. `[REF]` | Inspectable, parallel; more model calls; induction schema is implicit contract `[INF]`. Paper-backed stage split. | Mandatory reference-induction stage has no V1 counterpart. | AC-01, AC-21 … AC-23 |
| Provenance | F-PPT-15 | Planner indexes source sections; retrieval uses them; after editor stage, origin is not stored in slide state. `[REF]` | Small models/prompts vs no later attribution `[INF]`. | DeckAgent needs origin to hold and be observable. | AC-03, AC-16, AC-25 |
| Working representation | F-PPT-06; ADR-PPT-07 | PPTX-shaped `Presentation`/`SlidePage` object graph over a required custom `python-pptx` fork; HTML projection for LLM; save rebuilds PPTX. `[REF]` | Paper: raw XML too verbose for LLMs (stated). Editable-PPTX fidelity vs PPTX coupling. | PPTX-only delivery. | AC-05, AC-14, AC-15, AC-19, AC-22, AC-26 |
| Validation / evaluation | F-PPT-07, 08, 09; ADR-PPT-06, 08 | Inline: content/layout validation + restricted edit-API executor with traceback-driven retry on deep-copied slide; Web skips failed slides (`error_exit=False`). PPTEval is post-hoc, separate, drives no state change. `[REF]` | Local containment, partial decks possible; evaluation independent of acceptance. | No gate controls visibility/authority of a whole result. | AC-06, AC-08, AC-10, AC-14, AC-18, AC-20, AC-25 |
| Preview / render / export | F-PPT-10, 16, 18; ADR-PPT-07, 08 | No in-app preview. PPTX saved from in-memory state; LibreOffice→PDF→images used only for analysis/eval. No export record by version/format; download is a plain file read. Artifacts can be reparsed/rendered but no version↔output comparison. `[REF]` | Simple file path vs no version/export bookkeeping `[INF]`. | No PDF deliverable, no preview, no export-promotion. | AC-01, AC-05, AC-09, AC-15, AC-18, AC-19, AC-26, AC-29, AC-30 |
| Failure / recovery | F-PPT-11, 20; ADR-PPT-06 | Hierarchical: LLM retry (tenacity), per-slide edit retry, per-slide task isolation, broad Web job try/except. Not transactional; caches/partial files may remain; partial `final.pptx` behavior not established. `[REF]`/`[INF]` | Resilience vs differing semantics per layer. | Recovery unit = attempt, not a recovery baseline. | AC-08, AC-09, AC-20, AC-22 |
| Cancellation / concurrency | F-PPT-19, 18 | No stop endpoint/control/token/commit guard; task handle not retained; multiple jobs can overlap; closing the progress socket is accidental coupling, not stop. `[REF]` (answered absence) | Simpler orchestration vs no user-controlled terminal state. | AC-28 behavior absent. | AC-20, AC-22, AC-23, AC-28 |
| Dependency seams | F-PPT-13, 06; ADR-PPT-09 | OpenAI-compatible LLM adapters, ModelManager (HF ViT, fastText), MinerU HTTP, LibreOffice/Poppler, Chrome/html2image (tables), custom `python-pptx`; presentation↔APIs module cycle; content-addressed persistent caches. `[REF]` | Swappable services vs custom fork + cycle as coupling points `[INF]`. | Persistent content-addressed caches keep user content across jobs. DeckAgent would need to account for their lifecycle and privacy under D-027 (session-only) and R-042 `[P0]`. | AC-11, AC-21 … AC-24 |
| Evolution / changeability | F-PPT-14, 17; ADR-PPT-10, 11 | Web, Python, MCP reuse the core (MCP via inheritance, protected methods); reference strategy and PPTX output are cross-cutting; language/length handled at initial generation, no translation-as-refinement. `[REF]`/`[INF]` | Entry seams strong; output/refinement seams weak `[INF]`. | MCP not in paper. | AC-23, AC-24, AC-26, AC-27 |

**PPTAgent paper-vs-implementation differences recorded by DOC-006** `[REF]`: REPL vs restricted API dispatch; span APIs (paper) vs paragraph APIs (code); self-correction ≤2 (paper) vs default 3 / Web 5; experiment models vs released default config; MCP path absent from paper; Web MinerU PDF-parse edge unverified (signature/await mismatch); `pres_score` async call without await.

### OpenDesign (DOC-007; tag `open-design-v0.24.0`)

| Cluster | Findings | What the system does | Rationale / trade-off evidence | Mismatch with DeckAgent | AC |
|---|---|---|---|---|---|
| Input / source | F-OD-01, 02 | Attachment metadata in run contract, bytes in daemon-managed snapshots; instructions in separate prompt fields; role via skill/template/design-system/plugin registries, separate from media type. `[REF]` (one strategy path) | Smaller prompts; no hard security boundary — agent can still read source `[INF]`. | Broad agent/MCP tool access. | AC-02, AC-11, AC-13 |
| Intent / state ownership | F-OD-03, 06 | Daemon composes intent from conversation, project instructions, skill/template, design system, craft rules; no single typed constraint record. Workspace files = current artifact; SQLite = metadata. `[REF]`/`[INF]` | Reusable context vs hard-to-inspect active set `[INF]`. | Durable projects, not session-only. | AC-04, AC-05, AC-15, AC-30 |
| Generation orchestration | F-OD-04; §2.2–2.4 | Daemon-coordinated `request → context/prompt → runtime → workspace → validation → preview/export`; full agent loop delegated to external coding-agent CLIs/BYOK via declarative `RuntimeAgentDef` + shared engine. `[REF]` Explicit | Stated: avoid building another agent loop. Cost: runtime-dependent behavior/safety. | Multi-artifact platform. | AC-01, AC-21 … AC-23 |
| Provenance | F-OD-05 | File/version-level provenance (run, prompt, parent, digest); no content-level origin. `[REF]` | Simple history vs no claim-level attribution `[INF]`. | DeckAgent needs content-level origin. | AC-03, AC-16 |
| Working representation | F-OD-06, 15 | HTML/CSS/assets in workspace are the canonical editable form; code-first. `[REF]` | Agents edit ordinary files. | Not a native presentation object model. | AC-05, AC-12 |
| Validation / evaluation | F-OD-09, 10 | Post-run deliverable validator (status, entry file, touched paths, kind, readability); live preview **not** behind that gate; quality layered: source lint, preview geometry/render-health telemetry, Chromium render, optional PPTX fidelity audit skill. `[REF]`/`[INF]` | Cheap integrity gate; quality evidence fragmented/optional. | No pending-promotion point. | AC-06, AC-10, AC-14, AC-18, AC-25 |
| Preview / render / export | F-OD-11, 12, 13 | Preview = sandboxed iframe on selected file; export reads working file or pinned `versionId` → Electron/Chromium → format branches (PDF, screenshot PPTX, ZIP, MD, …); no durable export record; default PPTX is one image per slide; no stored degradation report. `[REF]` | Repeatable, no regeneration; unpinned export reads mutable file; screenshot PPTX trades editability for visual match. | The default PPTX holds one image per slide, so its text, shapes and tables are not editable objects. DeckAgent's PPTX must have editable text, shapes and tables (UC-008 postcond. 4; D-015) `[P0]`. | AC-01, AC-05, AC-09, AC-15, AC-19, AC-26, AC-29, AC-30 |
| Failure / recovery | F-OD-14, 07 | Run manager owns status/cancel/retry; retry suppressed after side effects; FS baseline = fingerprints, not bytes; restore = copy historical HTML over working file as a new version; no accept/reject gate. `[REF]` | Avoid duplicate side effects over workspace rollback (stated for retry). | Live mutation during run. | AC-06 … AC-09, AC-17, AC-20, AC-28, AC-29 |
| Cancellation / concurrency | F-OD-14 | Task route: revision-checked cancel vs completion; chat "send now" can briefly overlap runs; late/partial file writes can remain. `[REF]`/`[INF]` | Clear status winner, no workspace transaction. | — | AC-20, AC-28 |
| Dependency seams | F-OD-16 | Agent variation at `RuntimeAgentDef`; rendering at Electron/Chromium; packaging at format libs; deps: external CLIs, Node/Electron, native SQLite. `[REF]` Explicit (adapter) | Chromium shared failure point across formats `[INF]`. | Far broader runtime set. | AC-21, AC-22 |
| Evolution / changeability | F-OD-17; §4 | Replaced browser-only/WebSocket/in-memory/`history.jsonl`; deck host contract centralized after drift across prompt paths; agent-driven PPTX replaced by capture; one formal ADR (daemon startup). `[REF]` | Shared host contracts limit drift; rationale partly inferred. | Platform-driven changes. | AC-23, AC-24 |

**Contract-sync status of DOC-007 against the widened DOC-005 RQs** (not repaired here):

| RQ (widened clause) | DOC-007 coverage | Status |
|---|---|---|
| RQ-06: what happens to states on new project / reload / close | F-OD-06 notes projects survive reload/restart; new-project and close not addressed | `Evidence gap / contract-sync gap` (partial) |
| RQ-07: when a candidate becomes authoritative if a new request arrives during review; survival of goals/constraints across transitions; number of retained states | F-OD-07 records no pending gate, but does not state the new-request timing as an answered absence, nor constraint survival, nor retention limits | `Evidence gap / contract-sync gap` |
| RQ-09: is each check outcome recorded/observable; which state the system returns to on check failure | F-OD-09 covers where/what is checked; return state and outcome recording not stated | `Evidence gap / contract-sync gap` |
| RQ-11: produced file recorded/traceable; export changes state | F-OD-11 answers both | Covered |
| RQ-14: late result changing state; stop/completion race; concurrent ops; restoration of constraints introduced by a failed/stopped request; reported info | Race + late writes + overlap covered (F-OD-14); constraint restoration not addressed; reporting only partial | `Evidence gap / contract-sync gap` (constraint half) |
| Coverage table | All 17 rows `Answered` with one finding each; no alignment note like DOC-006's | `Evidence gap / contract-sync gap` (process) |

---

## 7. Cross-source tensions and conflicts

| # | Source A | Source B | Nature | Handling |
|---|---|---|---|---|
| T-01 | DOC-004 §2, §6: "AC-28 … AC-30 have no mapped RQ until DOC-005 is updated" | DOC-005 §4.1 (2026-09-28): AC-28 → RQ-14; AC-29 → RQ-07, RQ-11; AC-30 → RQ-06, RQ-11 | Derived-vs-derived conflict; DOC-004 text is stale relative to DOC-005 | Correction (DOC-004) |
| T-02 | PH DOC-004 status **Active** | DOC-004 file header "Status: Draft" | Metadata conflict; PH wins | Correction |
| T-03 | PH R-045 notes: "not yet in DOC-004 and DOC-008" | DOC-004 AC-30 / AC-17 trace R-045; W-037 Done | Stale PH note (PH internal inconsistency with W-037 state) | Correction (PH) |
| T-04 | PH D-029 context: "DOC-004 and DOC-008 do not reflect this capability yet" | DOC-004 AC-28 | Historical context text now stale | Correction or accept as dated context |
| T-05 | PH DOC-008 notes: does not reflect R-045/R-046; must be re-checked for D-030 | W-032 status Done; DOC-004 relies on DOC-008 TN-1…6 and F12/F14/F15 | DOC-004 depends on a derived doc that PH itself marks as behind | Later synthesis must not treat DOC-008 as current on lifecycle/stop/session |
| T-06 | DOC-004 header: checked against snapshot 2026-09-30 03:05 UTC | Current snapshot 03:31 UTC changed `requirements`, `work`, `documents` | Possible drift; content of the change unknown | Evidence gap; re-verify cited R-IDs if needed |
| T-07 | DOC-004 §12: "No prototype artifact has been incorporated" | PH DOC-011 Active, `used_by` W-028, W-037, W-033, W-035 | Tension, not contradiction (DOC-004 may have chosen not to incorporate) | Later synthesis / Product clarification of DOC-011's role |
| T-08 | PH DOC-005 `last_updated` 24/09/2026 | DOC-005 header updated 2026-09-28 and 2026-09-30 | Metadata staleness | Correction (PH) |
| T-09 | PH W-030 status **In Progress**; DOC-006 PH link empty; owner Trâm | DOC-006 "Ready for review"; researcher name not filled | Work-state vs document-state mismatch | Correction / review workflow |
| T-10 | DOC-005 §1.2 and PH W-031 required input: `<OPENDESIGN_REPO_URL>` placeholder | DOC-007 confirms `github.com/nexu-io/open-design` | Unresolved placeholder in the contract | Correction |
| T-11 | DOC-005 (latest) widened RQ-06/07/09/14 | DOC-007 coverage not re-aligned (§6 table) | Latest contract vs research coverage | Research follow-up (W-031), not repaired here |
| T-12 | DOC-005 §2 / W-030 out-of-scope: research does not propose DeckAgent architecture | DOC-006 §4.2 retains alternatives incl. "explicit session/version aggregate with accepted + pending + recovery baseline" and "stop token + commit guard + late-result suppression", labelled non-evidence | Boundary tension: near-mechanism content inside an evidence document | Later synthesis must treat §4.2 as non-evidence prompts, not a Decision Bank input |
| T-13 | PPTAgent paper | PPTAgent v0.2.0 code | Paper-vs-implementation differences (REPL vs restricted API; span vs paragraph APIs; retry counts; model config; MCP; unverified Web PDF edge; PPTEval await bug) — recorded in DOC-006 | Evidence caveat; affects confidence of Web-path claims |
| T-14 | OpenDesign tag `open-design-v0.24.0` | `package.json` at same commit reports 0.23.1 | Version-label inconsistency inside the reference system (recorded by DOC-007) | Evidence caveat |
| T-15 | PPTAgent: PPTX-shaped object model, native editable PPTX, no preview, one-shot, no stop | OpenDesign: HTML workspace, preview+export from HTML via Chromium, screenshot PPTX, live mutation, run-level cancel | Differing reference choices for the same problems (working representation, export source, validation gate placement, recovery unit, cancellation) | Later synthesis (no resolution here) |
| T-16 | R-020 AC1 / BR-006: export from **previewed** version (may be pending) | R-025 AC1 and R-028 AC1 worded for the **accepted** version | Intra-PH wording gap; DOC-004 §11 already lists it | Product clarification |
| T-17 | UC-011 step 2: check whether "the latest version" has been downloaded | R-045 / BR-012: "undownloaded" undefined; DOC-004 §11 treats it as fully open | UC-011 hints at a partial definition (latest version) without format/version scope | Product clarification |
| T-18 | BR-010 r3c: promotion when file "created successfully and delivered to the user" | UC-008: step 5 (file opens) → step 6 (user receives) → step 7 (promotion) | Order suggests delivery = step 6, but "receives" is not defined as an observable event | Product clarification (already DOC-004 §11) |
| T-19 | UC-002 5A: during step 5 (AI generating), AI asks the user or marks AI-added content, then continues | BR-010 r4 / D-030 locate clarification **before** the operation (for refinements); UC-014 terminal states are done/stopped/error only | Whether an in-flight generation can pause for user input is not specified; interacts with stop and "one op at a time" | Source reconciliation; ownership TBD (SA-01) |
| T-20 | DOC-002 cited by DOC-004 (§5, §16, §18, §20, AD-*, OQ-04) | DOC-002 not in repo / not read | Cannot verify DOC-002-traced statements in Phase 0 | Evidence gap |

---

## 8. Open questions and evidence gaps

### Product ambiguities (Product decides)

| ID | Unknown | Why it matters | Handled in |
|---|---|---|---|
| PA-01 (BR-010 r3c, UC-008 s7, DOC-008 F12) | Which event counts as "delivered" | Location of export-promotion commit (AC-29) | Product; W-034 states accommodation per plausible answer |
| PA-02 (R-045, BR-012, UC-011 s2, DOC-008 F14) | What "undownloaded" means (formats, which version, reload/close vs process kill) | Session-loss state content (AC-30) | Product; W-034 accommodation |
| PA-03 (R-025, R-028 vs R-020) | Do fidelity reqs apply to pending-version exports | AC-05 verification scope | Product |
| PA-04 (R-033, UC-002 s6, DOC-008 F15) | Which checks run in-product vs test-only | Validation placement; whether rendering must precede display (DOC-004 §11) | Product; W-033/034 show where possible |
| PA-05 (UC-014 OQ-1, D-029 reopen) | Can export be stopped | Would extend AC-28 | Product |
| PA-06 (A-013, BR-003 exc. 1, DOC-002 OQ-04) | Constraint lifetime, conflicts, single-refinement constraints | Constraint state shape (non-gating per DOC-004) | Product / learn later |
| PA-10 (UC-002 OQ-1) | Source size/page limits | Input boundary sizing | Product / benchmark |
| PA-11 (UC-011 OQ-1) | Are session source/temp files deleted at session end | AC-11 evidence (not gated) | Product |
| PA-12 (R-008 note) | How AI-added content is shown to users | UX only; AC-16 does not require display | Product |
| PA-13 (UC-008 OQ-1, D-026) | First PPTX verification application | RK-006 evidence | Product / Testing |

IDs PA-07 … PA-09 are not used; those items moved to SA-01 … SA-03 below.

### Potential semantic ambiguities / ownership TBD

Questions found while compiling Phase 0 `[P0]`. Current evidence does not show whether each one is
Product policy, left to the architecture, or already implied by existing rules. Source
reconciliation should decide ownership before any of them is treated as a Product ambiguity.

| ID | Unknown | Sources involved | Why it matters | Possible readings to reconcile |
|---|---|---|---|---|
| SA-01 | Can a running generation pause to ask the user (UC-002 5A: "AI asks the user … then continues step 5")? | UC-002 5A; R-008 AC2; BR-010 r4 / D-030 (pre-flight clarification, refinements only); UC-014 postcond. 1 | Interacts with stop (AC-28), BR-014, and operation terminal states (AC-20) | Product policy; implementation freedom within R-008; or already implied by UC ordering |
| SA-02 | What is previewed or exportable while a refinement is running, after the pending version was promoted at the commit boundary | R-019; BR-010 r5; BR-014; UC-008 preconditions; UC-015 | Preview/export availability during an operation | Product policy; architecture freedom; or implied by R-019 plus BR-010 |
| SA-03 | Can an export run while an AI operation is running | BR-014 r1 (AI ops only); UC-008 preconditions; AC-05 (version stable during export) | Export concurrency and version stability | Product policy; architecture freedom within AC-05/AC-09; or implied by BR-014 scope |

### Architecture evidence gaps (spikes / later research)

| ID | Unknown | Why it matters | Handled in |
|---|---|---|---|
| AG-01 (DOC-004 §11) | Whether P3 hard-minimum checks need rendered output before display/acceptance | Constrains where validation can sit (AC-10, AC-06, AC-14, AC-18) | W-033/W-034; possible spike (D-018) |
| AG-02 (RK-006, D-026, A-022) | Real-application PPTX compatibility | AC-19; hand-off viability | Implementation + Testing evidence |
| AG-03 (RK-007) | Behavior/cost of outstanding external calls after stop | AC-28 feasibility; D-029 reopen condition | W-033/034; spike if needed |
| AG-04 (R-032, UC-014 OQ-2, D-011) | Timeout/retry thresholds | AC-08 bounds | Benchmark |
| AG-05 (R-042 note) | Which user content goes to AI provider and how that flow is declared | AC-11 | W-033/034 |
| AG-06 | Whether any candidate can observe each plausible "delivered" event | AC-29 accommodation | W-034 |
| AG-07 (T-06) | What changed in `requirements`/`work`/`documents` after DOC-004's snapshot check | Possible trace drift | Re-check before W-033 relies on DOC-004 traces |
| AG-08 (T-20, T-05) | DOC-002 and DOC-008 content not read in Phase 0 | DOC-004 traces into them unverified here | Phase 1 if a claim depends on them |

### Reference research gaps (DOC-006 / DOC-007)

| ID | Unknown | Why it matters | Handled in |
|---|---|---|---|
| RG-01 | DOC-007 widened RQ-06/07/09/14 clauses (§6 sync table) | AC-17, AC-28, AC-29, AC-30 evidence thinner for OpenDesign | W-031 follow-up; W-033 must mark as gap |
| RG-02 | PPTAgent has no refinement, no preview, no PDF deliverable, no stop | Many lifecycle ACs have only absence evidence from PPTAgent | W-033 must not read absence as positive evidence |
| RG-03 | Neither reference has accepted/pending lifecycle, commit boundary, or session-only model | No reference evidence for AC-29/AC-30 behavior as specified | W-033 notes evidence gap |
| RG-04 | Neither reference has content-level provenance surviving edits | No positive reference evidence for AC-03/AC-16 | W-033 notes evidence gap |
| RG-05 | PPTAgent Web end-to-end path not verified at pin (MinerU edge) | Confidence of Web-path claims | Caveat in W-033 |
| RG-06 | OpenDesign findings often from one strategy path (F-OD-01, F-OD-08) | Generality of claims | Caveat in W-033 |
| RG-07 | DOC-004 has no RQ mapping for AC-28 … AC-30 in its own text (T-01) | Confusion about which RQ evidences them | Use DOC-005 §4.1 mapping |
| RG-08 | Neither reference evidences constraint-set rollback on failure/stop (PPTAgent: explicit absence F-PPT-20; OpenDesign: not addressed) | AC-04/AC-08/AC-28 constraint half | W-033 gap |

---

## 9. Phase 0 handoff summary

### Known

- V1 boundary is fixed by D-024 … D-030 plus Active V1 Requirements/BRs; V1 UCs are UC-001, 002, 004, 008, 011, 013, 014, 015.
- Version lifecycle rules (BR-010 r1–r8, D-030) are specific enough to evaluate: accepted/pending, three promotion triggers, commit boundary with ordered steps, single recovery baseline at the commit boundary, reject cancels request constraints, stop/failure/invalid result create no version.
- Session-only, local, no accounts (D-027); one AI op at a time (BR-014); stop is required (D-029/R-046).
- Export is PPTX + PDF from the previewed version with no regeneration; failed/cancelled export changes nothing.
- DOC-004 defines 16 Gates, 7 Observability needs, 7 Trade-off dimensions; outcomes-not-mechanisms; screening vs narrative comparison.
- DOC-006 (PPTAgent) covers all 17 RQs, including the widened RQ-06/07/09/11/14 (explicit alignment
  note, F-PPT-18 … 20). Much of the lifecycle coverage records that the capability is absent (RG-02).
- DOC-007 (OpenDesign) has an `Answered` row for every RQ. The widened clauses of RQ-06, RQ-07, RQ-09
  and RQ-14 are only partly covered, so they remain contract-sync gaps (§6 sync table; RG-01). For
  those clauses, OpenDesign evidence is incomplete.

### Assumed (only those already in PH)

A-008, A-009, A-013, A-014, A-015, A-016, A-017, A-020, A-021, A-022, A-023, A-029 (all Open). D-011 and D-018 govern how assumptions are tested (evidence/spikes before mechanism choices).

### Unknown

PA-01 … PA-06 and PA-10 … PA-13 (Product), SA-01 … SA-03 (ownership TBD), AG-01 … AG-08, RG-01 … RG-08 (§8). The most load-bearing: "delivered" (PA-01), "undownloaded" (PA-02), in-product validation scope and rendered-check placement (PA-04, AG-01), late results after stop (AG-03), OpenDesign contract-sync gaps (RG-01). Behavior during a running operation (SA-01 … SA-03) is also open; source reconciliation must first decide who owns each item.

### Guardrails for Phase 1 (Problem Map)

1. Project Hub wins over every derived document; cite IDs, don't restate requirements.
2. Frame problems as DOC-004 outcomes; do not smuggle mechanisms (IR, state machine, store, agent structure, renderer) into problem statements (D-011).
3. Keep Gates/Observability (screening) separate from Trade-offs (narrative, no scores).
4. Preserve BR-010/D-030 exactly: commit boundary position and ordering; recovery baseline = accepted version at the commit boundary; pre-commit steps change nothing; stop/failure/invalid create no version; promotion-on-export only after successful production and Product-defined delivery.
5. Do not define "delivered", "undownloaded", constraint lifetime, in-product checks, or export stoppability; carry them as Product-owned open points that each future candidate must accommodate.
6. Treat reference findings as evidence with their confidence and mismatch notes; absence evidence (e.g. PPTAgent has no stop) is not a design signal; DOC-006 §4.2 hypotheses are not evidence.
7. Record OpenDesign contract-sync gaps as gaps; do not fill them by inference.
8. Respect scope exclusions and watch triggers (DOC-004 §12): existing-deck editing, stoppable export, persistence, L-001/L-002.
9. Respect C-002: feasibility for a course team is a comparison dimension (AC-21/22), not a reason to relax a Gate.
10. D-029's reopen condition applies if stop cannot be made determinate; flag it rather than working around it.
