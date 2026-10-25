# Gate: Use Case

Template: `_TEMPLATE.md`. Style: `../_STYLE.md`. Parent: `../02-users/`. Children: `../04-requirements/fr/`, `../04-requirements/nfr/`, `../05-business-rules/`. Versions: `docs/versions/`.

## 1. What a use case is, and is not

**A use case models the ideal product.** It says what the user does and how DeckAgent visibly responds, as product-level interactions. Each Active response is a candidate functional requirement. Each considered branch is a candidate error or edge requirement. Each rule or quality target an interaction depends on is cited here and defined elsewhere.

**Active and Closed are product-design statuses of a flow, independent of any version.**

- **Active** means the flow was considered and is designed into the ideal product. Its behavior is written as a sequence diagram.
- **Closed** means the flow was considered and not selected for the ideal product. It is kept briefly: ID, description, why it was not selected, an optional reconsideration condition or source. It carries no diagram.
- Active and Closed say nothing about what a version builds. A version file under `docs/versions/` names the Active flows it takes. A flow that no version takes stays Active; a version that leaves a flow out keeps it in the use case, with its requirements and evidence.
- Do not set a flow to Closed when the only source is a version leaving it out, and never set it to Active because a version takes it. Presence in a scope file neither confirms nor denies the product decision.
- Assigning Active or Closed needs an owner decision or existing documented intent. If the evidence does not establish the choice, do not guess: name the question under `## Decisions needed`, keep the flow's ID and content, and give it no status label.

**This folder holds the behavioral model, not the scope.** `../02-users/` only helps detect use cases. `docs/versions/` selects the flows of each version and never writes their behavior.

| If the content is... | Then it belongs to |
|---|---|
| A limit, threshold, quota, allowed list, retention period or any other value a rule defines | `../05-business-rules/`. The use case cites the rule ID |
| A wait time, size target, availability target or any other quality target | `../04-requirements/nfr/`. The use case cites the NFR ID |
| The testable statement of a system response | `../04-requirements/fr/`. The interaction cites the requirement ID |
| A version's identity, order, goal, accepted flows and the constraints that hold for the whole version | `docs/versions/<version>/` |
| How far the code is built or tested | Not in the specs. A use case and a requirement hold no progress |
| A raw observation from a recording (what a product did, which limit it showed) | `docs/research/use-cases/`. The use case links the research card |
| How the system achieves a response (model, queue, storage, API) | An ADR or architecture work, not here |
| How the user operates the product or how it looks: a control, menu, gesture, position, label, colour or layout | UI design work (no folder yet). The interactions write the intent and the response only (UCG-13) |
| A need or situation of a kind of person | `../02-users/`. That folder lists this use case; this use case does not name the segment |

### Linking direction: top-down only

The parent file lists its children. A child never names its parent.

```
02-users (segment: needs, hypotheses)
   -> 03-use-cases (Active interactions, Closed flows)
        -> 04-requirements/fr, 04-requirements/nfr, 05-business-rules
        -> docs/research/use-cases (product evidence)
```

- A segment lists the use cases that serve it. A use case has no field naming a segment or a hypothesis (U-11 in `../02-users/_CRITERIA.md`).
- A use case cites requirement, NFR and rule IDs. Requirements, NFRs and rules never cite a use case, a flow or a segment.
- A use case links the research cards that support it. Cards do not name use cases.
- To find a parent, search the parent folder for the child ID. There is no reverse field to keep in sync.
- Siblings follow the same rule: a use case lists the use cases it `includes`, those that extend it (`extended_by`) and those that normally come `next`, never the reverse.
- A use case does not name a version. A version file names the flows it takes, and its links point up to the spec.

### Use case and flow IDs

A use case ID (`UC-xxx`) names a use case file. A flow ID names the interactions: `MF` and `S1`, `S2`, … for the main steps, `A1`, `A2`, … for the considered branches. Step and flow IDs stay stable and visible in the diagrams (UCG-10). Attributes and step fields of the old block format are gone; an ID never reattaches to a different behavior.

- The namespace is `docs/spec/`. IDs used in the earlier `docs/specification/` folder are not part of it.
- A use case ID names one user goal. It is never moved to another goal and never used again. This holds after its file is deleted or its goal is replaced.
- A deleted use case leaves a retired ID, listed below. Gaps between IDs stay. IDs need not be consecutive.
- A new use case takes the ID after the highest ID in this folder and in the list of retired IDs.
- Retiring a use case removes it from the behavioral model. It does not rule out its user goal in later exploration.
- IDs are not renumbered. Only an owner decision recorded below can renumber them.

Renumbering (owner, 2026-10-10):

- The owner approved one renumbering to close the gap left by the deck import use case.
- Old to new: UC-005 to UC-004, UC-006 to UC-005, UC-007 to UC-006, UC-008 to UC-007, UC-009 to UC-008, UC-010 to UC-009, UC-011 to UC-010, UC-012 to UC-011.
- UC-001, UC-002 and UC-003 kept their IDs. No flow ID changed.
- UC-004 is now export. The deck import use case that used UC-004 before has no ID in the current sequence. It was removed in commit `ea6dacc`.
- Commits before the renumbering use the old IDs.

Retired use case IDs: none.

### Version scope

A version file under `docs/versions/<version>/` names the Active flows of this domain that the version takes. It names a use case and the flow IDs it takes, for example `UC-001: MF, A10, A11`. Naming a use case without flow IDs takes its whole main flow. The scope file of a version holds the goal and the choices of that version, and it is the only record of what the version takes. `docs/versions/README.md` describes the layout.

- Every flow ID it names exists in this folder, and no `Sx` is named on its own.
- An alternative flow is named only when the main flow of its use case is taken too.
- A version file never writes the behavior of a flow. The use case is the only source of its behavior.
- The scope file is not a block of the spec and carries no `Updated at` of the spec.

**Leaving a flow out is not retiring it, and not closing it.** A version that does not name a flow leaves the Active flow in the use case, with its requirements and its evidence. A later version can take it. Retiring removes the flow from the behavioral model and its ID is never reused (UCG-10).

**Related use cases.** A use case can relate to another use case in three ways. They are not the same.

- **Invocation.** `includes: [UC-xxx]` says that this use case runs the main flow of UC-xxx as one unit. The interactions reference those steps, for example "as UC-xxx S2 says".
- A use case that includes another one also has the Active flows of the included use case. A branch of the included use case cites its FRs at that use case. It never becomes a flow of the including use case.
- **Behavior reference.** A response written "as UC-xxx Sx says" or "as in UC-xxx Ax" reuses the wording of that response. It calls no use case. It names a flow that exists and is not retired (UCG-10).
- **Dependency.** A flow needs another behavior to reach its end. Only the structure of the use case declares it: `includes`, `extended_by`, an end that goes to another use case, or a precondition.
- A flow that truly needs a behavior it refers to declares that need through one of these. The reference alone never does.

The scope review checks that a version file names a flow whose dependency the same file meets. A taken flow whose `includes` main flow is not taken in that version, or whose end goes to a use case or a flow the version does not take, is reported. The report changes no selection; the owner decides what the version takes. Two flows in two use cases are not the same flow because they share a number.

### Requirements traceability

- Every Active interaction that produces a response cites its requirements: FR IDs, `FR-?` when none exists yet, or both (mixed) in the same citation.
- FR IDs are written on the interaction or message they constrain. One response can have several FRs, and one FR can serve several responses.
- `FR-?` means that no functional requirement exists for this response yet. An Active flow can keep `FR-?` until its requirements are written; the flow stays incomplete while `FR-?` remains.
- `FR-?` never hides in a diagram: it appears, or the flow keeps a short constraint naming what still lacks a requirement.
- A citation never replaces a requirement. A response an FR already covers cites that FR. It never gets a second FR.
- An FR belongs to the scope of a version when the version file names a flow whose interactions cite it. Requirements hold no version field.
- A change to the response of a flow cited with real FR IDs is checked against those FRs in the same change. The author also names each version file that names the flow.
- Changing what a version takes is checked against the requirements. The report names the FRs the new selection needs and those it no longer needs. Leaving a flow out of a version never deletes or retires an FR.

### Single source of truth (SSOT)

A rule or quality target is defined in exactly one place. A use case never states its value, never paraphrases it into a number, and never lists its allowed values. It writes what the system does and points to the ID:

> Not met: The message text: "The system rejects files larger than 20 MB."
> Met: The message text: "The system rejects a file that exceeds the size limit [BR-001]."

A use case may cite an ID that does not exist yet. It writes `[BR-?: <topic>]` or `[NFR-?: <topic>]`, naming the topic and nothing else. Real IDs replace the markers when the requirements, rules and quality targets are written. Until then the marker stays. The scope review reports each marker left in a flow that a version file names (UCG-06).

## 2. Evidence tags

Claims about product behavior carry the same tags as `02-users` (`[observed: <source>]`, `[inferred: <source>]`, `[assumed]`). For product coverage the source is a research card or recording under `docs/research/use-cases/`. A flow nobody has recorded is `unverified` and its behavior stays `[assumed]`.

Evidence explains where a flow or a response came from. It is not a decision to build it. A research card that shows a behavior in another product never puts that behavior in a version. Evidence sits in the compact evidence list of the interaction sections, not inside the diagram. A Closed flow keeps its research; its table row may cite the card or the decision that closed it.

## 3. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment, *CI* = checked across files. No tooling exists yet; until it does, Lint and CI rows are checked by review.

"Applies to" says what a criterion checks. *Model* = every flow of the use case. *Version* = what a version file under `docs/versions/<version>/` takes from it. A scope review gives a report. It is not a status of the use case.

| ID | Criterion | Prevents | Check | Applies to | Source |
|---|---|---|---|---|---|
| UCG-01 | One user goal, reachable in one sitting, with an observable result of value to the user. The title is the user, a verb, a specific object and what distinguishes it, in the user's words. The use case does not name a segment; a segment in `02-users` lists it (U-11) | Cases too large or small to scope or test; two cases nobody can tell apart; cases nobody needs; links pointing up | Review | Model | Cockburn (user-goal level) |
| UCG-02 | The goal describes what the user wants and why now. It contains no feature or solution | Solutions dressed up as goals | Review | Model | Jobs-to-be-done |
| UCG-03 | Active interactions are product-level Mermaid `sequenceDiagram` blocks, with `User` and `DeckAgent` as participants (+ rarely another product party, never architecture components). The main flow is one or more diagrams, split into named sections when crowded. Every step of the main flow keeps its ID (`MF`, `Sx`) and every Active branch keeps its ID (`Ax`) beside its message, `alt`, `opt` or `loop` label. A behavior that an FR covers cites it (`[FR-xxx]`); a rule or target cites `[BR-xxx]` or `[NFR-xxx]`. The responses describe what the user can observe: what the system tells, keeps, changes or builds; never implementation and never interface (UCG-13). Each interaction section carries a compact evidence list, one line per flow. The diagrams are hand-written and authoritative; nothing generates them | Architecture diagrams posing as product flows; flows that lose their IDs and break citations elsewhere; two sources for the same behavior; evidence lost in a rewrite | Lint (diagram blocks, IDs cited resolve) + Review (observable, no interface) | Model | Cockburn; Mermaid sequence diagrams |
| UCG-04 | Every considered branch is either Active in a diagram or a Closed row. A Closed row holds the flow ID, a description, why it was not selected (a recorded reason, never an invented one), and an optional reconsideration condition or source. A flow must not be given Active or Closed without an owner decision or existing documented intent; an unassigned flow is named under `Decisions needed` with its ID intact. Every step that takes input, can be cancelled, depends on an external service, or can take long has an Active branch or a Closed row, or a stated reason for none | Branches no test can reproduce; success-path-only specs; Closed reasons invented after the fact; a flow silently dropped in a rewrite | Review | Model | Cockburn |
| UCG-05 | Postconditions are verifiable by observing the product. A minimal guarantee names what stays true when any branch fails. Both go under `Behavior constraints`. The scope review reports each postcondition or guarantee of a flow a version file names that cannot be verified | No final assertion for tests; data loss on failure | Review | Model (sections present), Version (verifiable) | Cockburn |
| UCG-06 | A use case contains no rule or quality value (SSOT, section 1). It cites by ID every requirement, limit, quota, allowed list, validation, wait or availability an interaction depends on (`FR-xxx`, `[BR-xxx]`, `[NFR-xxx]`). A `?` marker is allowed on any flow. For each flow a version file names, the scope review reports every `FR-?`, `[BR-?]` and `[NFR-?]` marker left, including an `FR-?` after real FR IDs. It also reports every cited ID that does not exist | The same rule written differently in many places; values changed in one file and not the others; requirements with no source flow; a taken flow with no requirements | Lint (numbers and markers) + CI (IDs resolve) | Model (no values), Version (no markers, IDs resolve) | Project rule |
| UCG-07 | A use case names no segment and no hypothesis. A reference from a segment (`UC-xxx.S3`, `UC-xxx.A2`) points to a step or branch whose ID exists in a diagram of that use case, and a retired ID is reported | Links pointing up; dangling references from segments; hypotheses that never reach an interaction | CI (references resolve) | Model | Project rule |
| UCG-08 | Product coverage is stated for each baseline product as `observed`, `not offered` or `unverified`, with a link to the research card. Differences are described in words, without rule values. Unrecorded claims stay `assumed`. Coverage is evidence, not a choice of flow (section 2) | Guesses read as facts; scope decided from evidence alone | Lint (tags) + Review | Model | Project rule |
| UCG-09 | A use case holds no flow selection and no version key. Only the scope file of a version under `docs/versions/` names flows, and its rules hold (Version scope, section 1). The scope review reports a flow ID that does not exist, an `Sx` named alone, an alternative flow without its main flow, and a dependency the version does not meet. The review changes no selection | Scope recorded in two places; a use case that reads as one release; an alternative flow selected without its main flow; flows selected for another use case by accident | Review + CI (flow IDs resolve, dependencies met) | Model (no version field), Version (scope file) | Project rule |
| UCG-10 | Step and branch IDs are never renumbered once cited, and retired ones are listed and never reused. Leaving a flow out of a version is not retiring it (section 1). Relations are declared on the parent side only (`includes`, `extended_by`, `next`). Every reference to another use case or flow names an ID that exists and is not retired: a relation, a diagram citation, or a behavior reference in a response. `UC-?` is allowed for a use case that is not written yet. This reference check does not depend on any version. A broken reference is an error in the model; a dependency a version does not meet is a scope report (UCG-09). `Decisions needed` entries and Notes that change a flow or a result name that flow. The scope review reports each entry that names a flow a version file takes | Segments citing the wrong step; two-way drift; references to retired blocks; gaps hidden inside a taken flow | CI (references) + Review | Model (IDs, relations, references, questions name flows), Version | Project rule |
| UCG-11 | Text follows `docs/spec/_STYLE.md`: terms from its term table, no banned vague verb, no may/might/should/could in a response, sentences of 20 words or fewer, conditions named with the flow they belong to | Responses that two readers understand differently; requirements nobody can test; walls of text | Lint (banned words) + Review | Model | Project rule |
| UCG-12 | The Active interactions are authoritative. No block in a use case is generated, and no tool regenerates a diagram from prose. A change to a flow's behavior changes its diagram in the same edit. Diagram text uses the conservative Mermaid subset of the `mermaid-markdown` skill | A diagram that no longer matches the flows; prose and diagram saying two things; diagram text that common previews cannot render | Review | Model | Project rule |
| UCG-13 | A use case describes what the user wants to do and what the system tells, keeps, changes or builds. It names no widget, gesture, position, look, label or layout — in the prose and in the diagram labels. It names a place only by a zone from the term table in `_STYLE.md`. A UI detail that carries a requirement is written as the requirement. Interactions pass the swap test in `_STYLE.md`: the sentence stays true with another interface | A spec that breaks when the design changes; requirements that fix a design nobody chose; behavior that touch-only or voice-only users cannot follow | Lint (interface words, `_STYLE.md` rule 11) + Review (swap test) | Model | Cockburn (leave out the user interface); Constantine and Lockwood (essential use cases) |
| UCG-14 | The file carries one `Updated at: dd-mm-yyyy` line under the frontmatter, the date of the last change to the file. Any edit to the use case sets it to the date of that edit. The `Product evidence` blocks keep their own `Updated at`, because research coverage is recorded per observation. The frontmatter holds no date. The file does not record who changed it; git history does | A file whose date is out of step with its text; readers who cannot tell which parts are current; per-block bookkeeping nobody maintains | Lint (file date, date format) + Review | Model | Project rule (revises the block-level rule of the pre-migration format) |
| UCG-15 | A use case ID is never reused or moved to another goal in the `docs/spec/` namespace, also after its file is deleted. A new use case takes the ID after the highest ID in the folder and in the retired IDs. Retired IDs and the one owner-approved renumbering are listed in section 1 (Use case and flow IDs). Gaps stay | Two meanings for one ID; old references, commits and segment links that point to the wrong use case | Review | Model | Project rule |

## 4. Illustrations (hypothetical)

**UCG-06: a response that cites a rule.**

> Not met, diagram label: `DeckAgent-->>User: Rejects a document over 20 MB or in a format other than PDF.`
> Met, diagram label: `DeckAgent-->>User: Accepts the document, or rejects it with the reason [FR-004] [BR-002].` The sizes and formats live in `BR-002` only. Changing a size changes one file.

**UCG-03 and UCG-13: observable, not implementation, not interface.**

> Not met, diagram label: `User->>DeckAgent: Opens the + menu, points at Skills and clicks a skill.`
> Met, diagram label: `User->>DeckAgent: S1 · Chooses a skill.` with the response `DeckAgent-->>User: Adds a text shortcut for the skill to the request text [FR-xxx]. Does not send the request.`

> Not met: `DeckAgent-->>User: The model returns slide JSON and the renderer draws it.`
> Met: `DeckAgent-->>User: S5 · Shows a draft deck the user can look through slide by slide.`

**UCG-11: a response with one meaning.**

> Not met: `DeckAgent-->>User: May handle the failure gracefully.`
> Met, inside `alt A11 · The work fails`: `DeckAgent-->>User: Says the outline could not be drafted. Keeps the request [FR-xxx].`

**UCG-13: intent and response, not interface.**

> Not met: `DeckAgent-->>User: Opens the dashboard as an overlay with no dimming.`
> Met: `DeckAgent-->>User: Opens the dashboard. The conversation, the request text and the attachments stay as they were.` The "no dimming" detail is a design choice. It goes to UI design, not here. What must stay true is that nothing the user prepared is lost.

**UCG-07 and U-11: the link is on the segment side.**

> In `USR-009.md`, hypothesis H-3 (made-up figures are dangerous) has `Handled by: UC-000.S5, UC-000.A3`. `UC-000.md` mentions neither USR-009 nor H-3. Its S5 interaction marks any number the system added rather than the user, and cites `[BR-?: numbers added without a source]`.

**UCG-09: the scope lives in the version file, not in the use case.**

> Not met: `UC-020.md` holds `versions: { V1: { add: [MF, A4] } }`. The use case selects its own scope, so the spec reads as one release.
> Met: `docs/versions/v1/SCOPE.md` names `UC-020: MF, A4`. `UC-020.md` has no `versions` field and reads as the ideal product. A2 that no version names stays an Active flow, with its requirements and evidence.

**UCG-03, UCG-09 and UCG-10: invocation, behavior reference and requirements.** UC-020 `includes: [UC-021]`.

> Not met: UC-020 S1 response: "Sends the request as UC-021 S2 says." with the requirement citation "as in UC-021 S2".
> Met: the same response text, and the requirements of that response trace at UC-021 S2. A step that adds no response of its own cites no FR itself.
> Met: UC-020 A4 response: "Rejects the file, as in UC-021 A8." The scope file takes UC-021 A8 or not; this reference changes nothing. The report is about existence only: an error when UC-021 A8 does not exist or is retired.
