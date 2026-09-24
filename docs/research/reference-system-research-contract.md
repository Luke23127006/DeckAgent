# Reference-System Research Contract (DOC-005)

- Status: Draft
- Produced by: W-029 · Used by: W-030 (PPTAgent → DOC-006), W-031 (OpenDesign → DOC-007)
- Input: [DOC-004 Architecture Acceptance Criteria](../architecture/architecture-acceptance-criteria.md), criteria AC-01 … AC-27

This contract gives PPTAgent and OpenDesign research one shared frame, so that both research
documents can feed Architecture synthesis (W-033) directly and be compared side by side.

## 1. Purpose and boundaries

Reference systems are **evidence**. Research records what a system does, why it appears to do
it, and what that could mean for DeckAgent.

Research does **not**:

- propose a DeckAgent architecture or treat a reference system as a candidate architecture;
- use a reference system as a source of DeckAgent scope — the V1 boundary is D-024 … D-028;
- score, rank, or pass/fail a reference system against DOC-004. Findings are *linked* to AC IDs
  to show relevance; comparative judgment happens in W-033 … W-035.

Avoid verdict wording in findings ("passes AC-05", "better than", "the right approach"). Prefer
"relevant to AC-05 because …".

## 2. Input: DOC-004 criteria

Read the frozen criterion set in DOC-004 before starting. Every research question below maps to
AC IDs; use the criterion text there, not a paraphrase, when judging relevance. Do not
reinterpret or extend the criteria. If a finding seems important but maps to no AC ID, record it
in the system-specific section (§6.3) and flag it.

## 3. Evidence rules

### 3.1 Source priority

1. Official repository and official documentation
2. Original paper
3. Official product documentation (site, release notes, changelog)
4. Secondary sources (blogs, talks, third-party analysis) — only when 1–3 do not answer the
   question; state why they were needed

When sources disagree (for example, paper vs. code), record both and the conflict. Do not pick
one silently.

### 3.2 Version selection and recording

Select versions with this default rule, and record the concrete version actually used in the
research document header (§6.1):

| Source | Rule | Record |
|---|---|---|
| Repository | Current relevant stable or default-branch commit at research start | Exact commit hash or tag |
| Paper | Latest available arXiv or published version at research start | Version (e.g. arXiv `v3`) or venue |
| Docs | Page as available at research start | URL and access date |

If a different historical version is used, explain why.

### 3.3 Citations

| Source | Format |
|---|---|
| Code | `repo@<commit>:path/to/file#L<start>-L<end>` |
| Paper | Section, page, or figure/table number |
| Docs | URL (and anchor), access date |

Every claim labelled Explicit needs a citation.

### 3.4 Separating evidence, inference, and implication

Each finding keeps three fields separate:

- **Source says** — what the source states or what the code visibly does, with citation.
- **Inference** — what the researcher concludes from that, and on what basis.
- **Implication for DeckAgent** — what this could mean for DeckAgent, linked to AC IDs.

### 3.5 Confidence

Assign one confidence level per finding, based on its weakest essential claim.

| Level | Meaning |
|---|---|
| Explicit | Stated directly in a source, with a citation |
| Strong inference | Directly observed behaviour in code, or several consistent independent signals |
| Weak inference | Based only on structure, naming, or partial signals |

## 4. Common research questions

Answer these questions for each system. **Core** questions must be researched. **Extended**
questions are researched as time allows; if time runs out, mark them `Not researched / deferred
due to time` (§6.4).

If a system clearly lacks the capability a question asks about (for example, it has no
refinement path), that is an `Answered` result: record the absence and the evidence for it.

| RQ | Problem area | Question about the reference system | AC IDs | Priority |
|---|---|---|---|---|
| RQ-01 | Input & source | How are input files and user instructions taken in? Are they kept apart, and can source text influence system instructions or actions? Where is user content written or sent along the way (logs, temporary files, caches, tools, external model providers)? | AC-02, AC-11 | Core |
| RQ-02 | Input & source | Is an input's role (content, reference, template, asset, …) tied to its file type, or determined some other way? | AC-13 | Core |
| RQ-03 | Intent | Where do user goals and constraints (audience, length, language, …) live, and how do they reach later steps or edits? | AC-04 | Core |
| RQ-04 | Generation & provenance | What are the stages from input to a first deck? Which responsibilities are separated, and in what order do they run? | AC-01, AC-23 | Core |
| RQ-05 | Generation & provenance | Does the system track which content came from the source and which was generated? Where, and does that survive edits? | AC-03, AC-16 | Core |
| RQ-06 | State & ownership | What is the working presentation state, who creates and changes it, and how do preview and export obtain it? | AC-05, AC-15 | Core |
| RQ-07 | State & ownership | Can a change be rejected or an earlier state restored? What survives when a new result is produced? | AC-06, AC-07, AC-17 | Core |
| RQ-08 | Refinement | How is a follow-up change request carried out — whole deck, selected parts, or full regeneration — and what stays fixed? | AC-01, AC-04, AC-27 | Core |
| RQ-09 | Validation & quality | Where are generated or edited results checked before being accepted or delivered? What is checked, and what happens when a check fails? | AC-10, AC-06 | Core |
| RQ-10 | Validation & quality | How does the system (or its paper) detect or measure layout, readability, and content quality? Does that require rendered output? | AC-14, AC-18, AC-25 | Core |
| RQ-11 | Rendering & export | How are preview and each output format produced? Do they derive from the same state, and is anything regenerated at export? | AC-05, AC-09, AC-15 | Core |
| RQ-12 | Rendering & export | Which output formats are supported, and what does adding one touch? | AC-26 | Extended |
| RQ-13 | Rendering & export | Does the system detect, record, or report where an output differs from the intended content or layout? | AC-19 | Core |
| RQ-14 | Failure & recovery | What happens when a model call, tool, or export fails or times out? Is state preserved, and what is reported? | AC-08, AC-09, AC-20 | Core |
| RQ-15 | Editor dependency | Does the core flow depend on the user directly editing objects, or is deeper editing handed off to another tool? | AC-12 | Extended |
| RQ-16 | Dependencies & cost | Which external models, libraries, renderers, and infrastructure are critical, and how is each isolated? | AC-21, AC-22 | Core |
| RQ-17 | Evolution | Does the history, changelog, or paper show redesigns, reversals, or known limitations, and what caused them? | AC-23, AC-24 | Extended |

RQ-16 and RQ-17 provide indirect evidence only. Team fit and redesign cost are assessed for
DeckAgent in W-035, not by the researcher.

## 5. Finding template

Use one block per finding. Finding IDs are local to the research document: `F-PPT-01`, … for
PPTAgent and `F-OD-01`, … for OpenDesign.

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

## 6. Research document structure (DOC-006, DOC-007)

Store both research documents under `docs/research/`.

### 6.1 Header

- System name, researcher, dates of research
- Versions used (§3.2): commit hash/tag, paper version, docs URLs with access dates, and the
  reason for any historical version
- Sources consulted, in priority order

### 6.2 Findings

Findings grouped by the problem areas of §4, using the template in §5.

### 6.3 System-specific evidence

Important evidence that no common question covers. Link AC IDs where they apply, and flag
findings that map to no AC ID.

- **PPTAgent (W-030):** use the paper and the code/docs together; do not only summarise the
  paper. Where paper and code differ, record both (§3.1).
- **OpenDesign (W-031):** use code/docs; go beyond the folder map to responsibilities, module
  boundaries, state/data ownership, important flows, and dependencies. Decisions that are
  inferred rather than documented are labelled with their confidence.

### 6.4 Coverage table

One row per RQ. Every row has a status; every row that is not `Answered` also states where the
researcher looked, so that a gap in the source can be told apart from a research limitation.

| Status | Meaning |
|---|---|
| `Answered` | Findings answer the question, including a documented absence of the capability |
| `Not found after search` | Searched, but the sources do not answer it. This is a statement about the sources, not proof the system lacks the property |
| `Not researched / deferred due to time` | Not searched, or searched only partially, because of the time box. This is not evidence about the system |

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

## 7. Definition of done for DOC-006 and DOC-007

- Header records concrete versions and sources (§6.1).
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
