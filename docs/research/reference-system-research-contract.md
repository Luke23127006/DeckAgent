# Reference-System Research Contract (DOC-005)

- Status: Draft
- Produced by: W-029 · Used by: W-030 (PPTAgent → DOC-006), W-031 (OpenDesign → DOC-007)
- Input: [DOC-004 Architecture Acceptance Criteria](../architecture/architecture-acceptance-criteria.md), criteria AC-01 … AC-27
- Language: this English file is the canonical source. A Vietnamese reader version exists for
  human reading; if the two differ, this file wins.

This contract gives PPTAgent and OpenDesign research one shared frame, so that both research
documents can feed Architecture synthesis (W-033) directly and be compared side by side.

Section 1 is the working guide. Sections 2 … 9 are the rules it refers to.

## 1. Start here

### 1.1 What you produce

| Work | System | Artifact | File to fill in |
|---|---|---|---|
| W-030 | PPTAgent | DOC-006 PPTAgent Architecture Research | [`docs/research/pptagent/pptagent-architecture-research.md`](pptagent/pptagent-architecture-research.md) |
| W-031 | OpenDesign | DOC-007 OpenDesign Architecture Research | [`docs/research/opendesign/opendesign-architecture-research.md`](opendesign/opendesign-architecture-research.md) |

- Each file already exists with the required structure (§8): header, findings grouped by problem
  area, system-specific evidence, and a coverage table with one row per RQ. Fill it in; do not
  start a new file.
- Write in English.
- Supporting files (for example, a diagram of the system's main flow or a long evidence excerpt)
  may be committed only in the same folder as your artifact and only when the artifact links to
  them. They get no Project Hub ID.
- Temporary material — raw notes, cloned repositories, downloaded papers, scratch files — stays in
  `trash/`, which is not committed.

### 1.2 What you study

| System | Primary sources (priority in §5.1) |
|---|---|
| PPTAgent | Official repository `https://github.com/icip-cas/PPTAgent` (named as the code location in the paper); paper arXiv 2501.03936; official documentation, if any |
| OpenDesign | Official repository and documentation: `<OPENDESIGN_REPO_URL>` (to be confirmed before research starts) |

Pin the exact versions you use at research start (§5.2).

### 1.3 How to work

1. Read DOC-004 §1 … §6: what the criteria are for, how researchers use them, and the criterion
   map. Look up a full criterion entry only when a finding touches it.
2. Read the rest of this document once.
3. Open your artifact file. Fill in the header: versions used (§5.2) and sources consulted.
4. Before writing findings, trace the system's main flow end to end, from input to final output,
   in the paper and in the code/docs. Note the main components and where the working state lives.
   Findings hang on this map; keep rough notes in `trash/`.
5. Work through the problem areas (§4), Core RQs first. For each area, inspect the relevant
   sources, write findings with the template (§6), and update the coverage table (§7) whenever a
   row's status changes.
6. Research Extended RQs as time allows; mark any you cannot reach
   `Not researched / deferred due to time`.
7. Record important evidence that no RQ covers under system-specific evidence (§8.3).
8. Check the document against the Definition of Done (§9.1), then hand off (§9.2).

### 1.4 Using the research questions

- **RQs are a coverage checklist, not 17 independent essays.** They make sure nothing important is
  missed and that the two systems can be compared side by side.
- A finding may answer several RQs; list all of them in its Research questions field.
- One RQ may need several findings.
- Write findings around what the system actually does — a problem, a choice, and its cost — then
  map them to RQs. If a finding written for one RQ also answers another, cite it in that RQ's
  coverage row instead of writing a second finding.

### 1.5 Rules that apply throughout

- Reference systems are evidence, never a candidate architecture or a source of scope (§2).
- No verdicts: link findings to AC IDs to show relevance; never score, rank, or pass/fail a system
  (§2, §3).
- Keep what the source says, what you infer, and what it could mean for DeckAgent separate (§5.4),
  and give every finding a confidence level (§5.5).
- Finding IDs are never renumbered after handoff (§6.1).

## 2. Purpose and boundaries

Reference systems are **evidence**. Research records what a system does, why it appears to do
it, and what that could mean for DeckAgent.

Research does **not**:

- propose a DeckAgent architecture or treat a reference system as a candidate architecture;
- use a reference system as a source of DeckAgent scope — the V1 boundary is D-024 … D-028;
- score, rank, or pass/fail a reference system against DOC-004. Findings are *linked* to AC IDs
  to show relevance; comparative judgment happens in W-033 … W-035.

Avoid verdict wording in findings ("passes AC-05", "better than", "the right approach"). Prefer
"relevant to AC-05 because …".

## 3. Using DOC-004

Read DOC-004 §1 … §6 before starting (§1.3). Every research question below maps to AC IDs; use
the criterion text in DOC-004, not a paraphrase, when judging relevance. Do not reinterpret or
extend the criteria. If a finding seems important but maps to no AC ID, record it under
system-specific evidence (§8.3) and flag it.

DOC-004's outcomes (`Meets`, `Does not meet`, `Not yet assessable`) apply to DeckAgent candidates
in later Work. Never assign them to a reference system.

## 4. Research questions

Answer these questions for each system. **Core** questions must be researched. **Extended**
questions are researched as time allows; if time runs out, mark them `Not researched / deferred
due to time` (§7).

If a system clearly lacks the capability a question asks about (for example, it has no
refinement path), that is an `Answered` result: record the absence and the evidence for it.

How to use the questions: §1.4.

### 4.1 Coverage map

| RQ | Problem area | Priority | AC IDs |
|---|---|---|---|
| RQ-01 | Input & source | Core | AC-02, AC-11 |
| RQ-02 | Input & source | Core | AC-13 |
| RQ-03 | Intent | Core | AC-04 |
| RQ-04 | Generation & provenance | Core | AC-01, AC-23 |
| RQ-05 | Generation & provenance | Core | AC-03, AC-16 |
| RQ-06 | State & ownership | Core | AC-05, AC-15 |
| RQ-07 | State & ownership | Core | AC-06, AC-07, AC-17 |
| RQ-08 | Refinement | Core | AC-01, AC-04, AC-27 |
| RQ-09 | Validation & quality | Core | AC-10, AC-06 |
| RQ-10 | Validation & quality | Core | AC-14, AC-18, AC-25 |
| RQ-11 | Rendering & export | Core | AC-05, AC-09, AC-15 |
| RQ-12 | Rendering & export | Extended | AC-26 |
| RQ-13 | Rendering & export | Core | AC-19 |
| RQ-14 | Failure & recovery | Core | AC-08, AC-09, AC-20 |
| RQ-15 | Editor dependency | Extended | AC-12 |
| RQ-16 | Dependencies & cost | Core | AC-21, AC-22 |
| RQ-17 | Evolution | Extended | AC-23, AC-24 |

### 4.2 Questions by problem area

#### Input & source

**RQ-01** · Core · AC-02, AC-11
- Question: How are input files and user instructions taken in? Are they kept apart, and can
  source text influence system instructions or actions? Where is user content written or sent
  along the way (logs, temporary files, caches, tools, external model providers)?
- Why DeckAgent cares: source text must stay data and never act as an instruction (AC-02), and
  user content may only go where the design intends, including to model providers (AC-11).

**RQ-02** · Core · AC-13
- Question: Is an input's role (content, reference, template, asset, …) tied to its file type, or
  determined some other way?
- Why DeckAgent cares: D-007 keeps file type and input role separate. First V1 needs only the
  content-source role, but a structure that binds role to extension would lock out later
  workflows (AC-13).

#### Intent

**RQ-03** · Core · AC-04
- Question: Where do user goals and constraints (audience, length, language, …) live, and how do
  they reach later steps or edits?
- Why DeckAgent cares: users state constraints once and expect later refinements to respect them,
  even when the current deck no longer visibly reflects them (AC-04).

#### Generation & provenance

**RQ-04** · Core · AC-01, AC-23
- Question: What are the stages from input to a first deck? Which responsibilities are
  separated, and in what order do they run?
- Why DeckAgent cares: the V1 Core Flow needs a complete path from prompt and source to a first
  deck (AC-01), and how that path is split shows how far a wrong assumption in one stage spreads
  (AC-23).

**RQ-05** · Core · AC-03, AC-16
- Question: Does the system track which content came from the source and which was generated?
  Where, and does that survive edits?
- Why DeckAgent cares: DeckAgent must not present AI-added or user-stated content as
  source-derived (AC-03), and tests must be able to see content origin (AC-16).

#### State & ownership

**RQ-06** · Core · AC-05, AC-15
- Question: What is the working presentation state, who creates and changes it, and how do
  preview and export obtain it?
- Why DeckAgent cares: preview, PPTX and PDF must derive from the same accepted state (AC-05), and
  slide order and text must be readable from it (AC-15).

**RQ-07** · Core · AC-06, AC-07, AC-17
- Question: Can a change be rejected or an earlier state restored? What survives when a new
  result is produced?
- Why DeckAgent cares: unvalidated AI changes must not irreversibly replace the last accepted
  state (AC-06), the user can reject the latest refinement in one step (AC-07), and tests need
  the states before and after it (AC-17).

#### Refinement

**RQ-08** · Core · AC-01, AC-04, AC-27
- Question: How is a follow-up change request carried out — whole deck, selected parts, or full
  regeneration — and what stays fixed?
- Why DeckAgent cares: repeated deck-level refinement is part of the V1 Core Flow (AC-01) and must
  keep active constraints available (AC-04); later whole-deck translation is a refinement of the
  same kind (AC-27).

#### Validation & quality

**RQ-09** · Core · AC-10, AC-06
- Question: Where are generated or edited results checked before being accepted or delivered?
  What is checked, and what happens when a check fails?
- Why DeckAgent cares: validation must be possible before content becomes accepted and before any
  output is delivered (AC-10), so that unvalidated changes do not replace the accepted state
  (AC-06).

**RQ-10** · Core · AC-14, AC-18, AC-25
- Question: How does the system (or its paper) detect or measure layout, readability, and content
  quality? Does that require rendered output?
- Why DeckAgent cares: DeckAgent's quality checks need geometry and text metrics (AC-14) and a
  rendered view of the whole deck (AC-18); how cheaply quality can be checked is part of
  testability cost (AC-25).

#### Rendering & export

**RQ-11** · Core · AC-05, AC-09, AC-15
- Question: How are preview and each output format produced? Do they derive from the same state,
  and is anything regenerated at export?
- Why DeckAgent cares: exports must not silently regenerate or diverge from the accepted state
  (AC-05), export failures must leave it unchanged (AC-09), and slide order and text must be
  readable from every output (AC-15).

**RQ-12** · Extended · AC-26
- Question: Which output formats are supported, and what does adding one touch?
- Why DeckAgent cares: further output formats are expected later (C-003), and the cost of adding
  one is set by the structure (AC-26).

**RQ-13** · Core · AC-19
- Question: Does the system detect, record, or report where an output differs from the intended
  content or layout?
- Why DeckAgent cares: cross-application compatibility is learned from real output artifacts, so
  degradation must be detectable and recordable (AC-19).

#### Failure & recovery

**RQ-14** · Core · AC-08, AC-09, AC-20
- Question: What happens when a model call, tool, or export fails or times out? Is state
  preserved, and what is reported?
- Why DeckAgent cares: failures must end in a determinate state that keeps the last usable state
  (AC-08, AC-09), and their cause must be reportable (AC-20).

#### Editor dependency

**RQ-15** · Extended · AC-12
- Question: Does the core flow depend on the user directly editing objects, or is deeper editing
  handed off to another tool?
- Why DeckAgent cares: the V1 Core Flow must not require professional-editor capability; deep
  editing is handed off via PPTX (AC-12).

#### Dependencies & cost

**RQ-16** · Core · AC-21, AC-22
- Question: Which external models, libraries, renderers, and infrastructure are critical, and how
  is each isolated?
- Why DeckAgent cares: critical dependencies shape team feasibility (AC-21) and what happens when
  one fails or changes (AC-22).

#### Evolution

**RQ-17** · Extended · AC-23, AC-24
- Question: Does the history, changelog, or paper show redesigns, reversals, or known
  limitations, and what caused them?
- Why DeckAgent cares: redesigns and known limitations show how far a wrong choice spread (AC-23)
  and what reversing it cost (AC-24).

RQ-16 and RQ-17 provide indirect evidence only. Team fit and redesign cost are assessed for
DeckAgent in W-035, not by the researcher.

## 5. Evidence rules

### 5.1 Source priority

1. Official repository and official documentation
2. Original paper
3. Official product documentation (site, release notes, changelog)
4. Secondary sources (blogs, talks, third-party analysis) — only when 1–3 do not answer the
   question; state why they were needed

When sources disagree (for example, paper vs. code), record both and the conflict. Do not pick
one silently.

### 5.2 Version selection and recording

Select versions with this default rule, and record the concrete version actually used in the
research document header (§8.1):

| Source | Rule | Record |
|---|---|---|
| Repository | Current relevant stable or default-branch commit at research start | Exact commit hash or tag |
| Paper | Latest available arXiv or published version at research start | Version (e.g. arXiv `v3`) or venue |
| Docs | Page as available at research start | URL and access date |

If a different historical version is used, explain why.

### 5.3 Citations

| Source | Format |
|---|---|
| Code | `repo@<commit>:path/to/file#L<start>-L<end>` |
| Paper | Section, page, or figure/table number |
| Docs | URL (and anchor), access date |

Every claim labelled Explicit needs a citation.

### 5.4 Separating evidence, inference, and implication

Each finding keeps three fields separate:

- **Source says** — what the source states or what the code visibly does, with citation.
- **Inference** — what the researcher concludes from that, and on what basis.
- **Implication for DeckAgent** — what this could mean for DeckAgent, linked to AC IDs.

### 5.5 Confidence

Assign one confidence level per finding, based on its weakest essential claim.

| Level | Meaning |
|---|---|
| Explicit | Stated directly in a source, with a citation |
| Strong inference | Directly observed behaviour in code, or several consistent independent signals |
| Weak inference | Based only on structure, naming, or partial signals |

## 6. Writing findings

### 6.1 Template

Use one block per finding. Finding IDs are local to the research document: `F-PPT-01`, … for
PPTAgent and `F-OD-01`, … for OpenDesign.

Once the document is handed off (§9.2), finding IDs are never renumbered or reused, because
downstream work cites them. Add new findings with the next free number. If a finding is
withdrawn, keep its heading and mark it withdrawn with the reason.

```markdown
### F-XXX-NN — <short title>

- Research questions: RQ-..
- Problem addressed: <the problem this part of the system solves>
- Responsibility / boundary: <which component owns it; what it does and does not do>
- Decision / mechanism: <what the system chose to do>
- Source says: <statement or observed code behaviour> — <citation>
- Inference: <what you conclude and why>
- Rationale: <why the system appears to have made this choice; say whether the source states it
  or it is inferred>
- Trade-off: <what the choice gains and what it costs, per source or inference>
- DeckAgent implication / relevance: AC-.. — <what this could mean for DeckAgent, and why it is
  relevant to those criteria>
- Mismatch / caution: <differences in goal, scope, runtime, inputs, outputs, or V1 boundary
  (D-024 … D-027) that limit transfer to DeckAgent>
- Confidence: Explicit | Strong inference | Weak inference
```

A finding answers "what problem, what choice, why, at what cost". A description of folders or
file names alone is not a finding.

### 6.2 Worked example

The example below is illustrative only. "System X", its repository, and its documentation are
invented; the example shows the shape of a good finding, not a conclusion about PPTAgent or
OpenDesign.

```markdown
### F-X-01 — Exports are written from a stored slide description, not regenerated

- Research questions: RQ-11
- Problem addressed: Keeping the file a user downloads consistent with the result they reviewed.
- Responsibility / boundary: The export module reads the stored slide description and writes the
  output file. It calls no model and never modifies the stored description.
- Decision / mechanism: Generation writes a slide description once; export reads only that
  description.
- Source says: The export entry point takes the stored description as its only input and contains
  no model call — `systemx@a1b2c3d:export/writer.py#L40-L85`. The docs state "exports are
  reproducible from a saved project" — https://example.org/systemx/docs/export (accessed
  2026-09-25).
- Inference: Because export reads only the stored description, two exports of the same project
  should match in content. Whether preview reads the same description was not inspected, so it is
  not claimed here, and RQ-06 stays open in the coverage table until it is checked.
- Rationale: The same docs page connects reproducible exports to user reports of mismatched
  files (stated). That the design also simplifies testing is inferred.
- Trade-off: Gains repeatable exports and export retry without regeneration. Costs: anything the
  description cannot express cannot appear in any export, so the description format limits new
  output formats (inferred from the single writer interface).
- DeckAgent implication / relevance: AC-05, AC-09 — shows one way to keep an export from diverging
  from an accepted state and to retry export without regenerating content. AC-26 — relevant
  because adding an output target may depend on extending the description format.
- Mismatch / caution: System X exports one format and has no refinement loop. DeckAgent needs
  PPTX and PDF (D-026) and repeated deck-level refinement (D-025), which System X never exercises.
- Confidence: Strong inference — the export behaviour is observed directly in code; the docs
  statement alone would not show that no model is called.
```

What makes it useful:

- **Source says** holds only what is cited; the conclusion sits in **Inference**, which also states
  what was not checked.
- **Rationale** says which part is stated and which is inferred.
- **DeckAgent implication / relevance** names AC IDs and says why they are relevant, with no
  verdict about System X.
- **Mismatch / caution** names the V1 decisions that limit transfer.
- **Confidence** follows the weakest essential claim.

## 7. Tracking coverage

The coverage table is a working tool, not an end-of-task formality. It is already in your
artifact file with one row per RQ. Update it whenever you write a finding or finish looking into
a question: at any point it shows you and the reviewer what is covered and what is left.

While research is in progress, a row's Status may be empty. Before handoff, every row has one of
these statuses:

| Status | Meaning |
|---|---|
| `Answered` | Findings answer the question, including a documented absence of the capability |
| `Not found after search` | Searched, but the sources do not answer it. This is a statement about the sources, not proof the system lacks the property |
| `Not researched / deferred due to time` | Not searched, or searched only partially, because of the time box. This is not evidence about the system |

Every row that is not `Answered` also states where the researcher looked, so that a gap in the
source can be told apart from a research limitation.

Before recording `Not found after search` for a Core RQ, inspect the relevant primary sources:
the paper sections on that topic and the code/docs paths that plausibly implement it (for
example, the entry point and modules of the flow in question). A keyword search alone is not
enough. An exhaustive repository review is not required. Record the specific sections, paths,
files, or search terms inspected.

```markdown
| RQ | Priority | Status | Findings | Where looked (required unless Answered) |
|---|---|---|---|---|
| RQ-01 | Core | Answered | F-XXX-01, F-XXX-04 | |
| RQ-12 | Extended | Not researched / deferred due to time | — | README only; export modules not opened |
```

## 8. Research document structure (DOC-006, DOC-007)

Both research documents live under `docs/research/`, one folder per system (§1.1). The artifact
files already contain this structure.

### 8.1 Header

- System name, researcher, dates of research
- Versions used (§5.2): commit hash/tag, paper version, docs URLs with access dates, and the
  reason for any historical version
- Sources consulted, in priority order

### 8.2 Findings

Findings grouped by the problem areas of §4, using the template in §6.1. A finding that answers
RQs in several areas goes under the area of its main RQ and lists all its RQs.

### 8.3 System-specific evidence

Important evidence that no common question covers. Link AC IDs where they apply, and flag
findings that map to no AC ID.

- **PPTAgent (W-030):** use the paper and the code/docs together; do not only summarise the
  paper. Where paper and code differ, record both (§5.1).
- **OpenDesign (W-031):** use code/docs; go beyond the folder map to responsibilities, module
  boundaries, state/data ownership, important flows, and dependencies. Decisions that are
  inferred rather than documented are labelled with their confidence.

### 8.4 Coverage table

One row per RQ, kept up to date as described in §7.

## 9. Definition of done and handoff

### 9.1 Definition of done for DOC-006 and DOC-007

- Header records concrete versions and sources (§8.1).
- Every Core RQ is `Answered` or `Not found after search` with where the researcher looked.
- Extended RQs have a status; any `Not researched / deferred due to time` row says what was and
  was not looked at.
- Every finding separates Source says / Inference / DeckAgent implication and carries a
  confidence level.
- Every important finding has DeckAgent relevance (AC IDs) and mismatch/caution.
- No finding scores, ranks, or passes/fails the system against DOC-004.
- W-030 specifically: paper and code/docs are both used where appropriate.
- W-031 specifically: the analysis goes deeper than the folder map.
- Creating a Learning in the Project Hub is not required.

### 9.2 Handoff and what happens next

1. Complete the research document in its file (§1.1), with any supporting files in the same
   folder, and commit it through a pull request.
2. Check that every coverage table row has a status (§7) and that the Definition of Done (§9.1)
   is satisfied.
3. Notify the reviewer (Duy) that the document is ready for review. Project Hub and Work status
   updates are handled separately, according to the project workflow.
4. From handoff on, finding IDs are fixed (§6.1).
5. W-033 reads DOC-006 and DOC-007 together, evaluates the findings against DOC-004, and
   synthesises candidate mechanisms in DOC-009, citing findings by ID. If questions come back,
   answer them in the research document with new findings or added notes; existing finding IDs
   keep their meaning.
