# Gate: Use Case

Template: `_TEMPLATE.md`. Style: `../_STYLE.md`. Parent: `../02-users/`. Children: `../04-requirements/fr/`, `../04-requirements/nfr/`, `../05-business-rules/`. Versions: `../00-current-scope/`.

## 1. What a use case is, and is not

**A use case models behaviors DeckAgent could perform, for one goal a user reaches in one sitting.** It says what the user does and how DeckAgent visibly responds. Each system response is a candidate functional requirement. Each alternative flow is a candidate error or edge requirement. Each rule or quality target a step depends on is cited here and defined elsewhere.

**A flow records a behavior to consider, not a commitment to implement it.** Use cases explore broadly. A flow can come from a need, a research card, a reference product or an assumption. Evidence says where the idea came from (section 2). The version scope says which flows a version must meet (Version scope, below). Nothing else selects a flow.

**This folder holds the flow selection of every version.** `../02-users/` only helps detect use cases. `../00-current-scope/` defines the versions and their order, never the flows.

| If the content is... | Then it belongs to |
|---|---|
| A limit, threshold, quota, allowed list, retention period or any other value a rule defines | `../05-business-rules/`. The use case cites the rule ID |
| A wait time, size target, availability target or any other quality target | `../04-requirements/nfr/`. The use case cites the NFR ID |
| The testable statement of a system response | `../04-requirements/fr/`. The use case cites the requirement ID |
| A version's identity, order, goal and the constraints that hold for the whole version | `../00-current-scope/` |
| How far the code is built or tested | Not in the specs. A use case and a requirement hold no progress |
| A raw observation from a recording (what a product did, which limit it showed) | `docs/research/use-cases/`. The use case links the research card |
| How the system achieves a response (model, queue, storage, API) | An ADR or architecture work, not here |
| How the user operates the product or how it looks: a control, menu, gesture, position, label, colour or layout | UI design work (no folder yet). The use case writes the intent and the response only (UCG-13) |
| A need or situation of a kind of person | `../02-users/`. That folder lists this use case; this use case does not name the segment |

### Linking direction: top-down only

The parent file lists its children. A child never names its parent.

```
02-users (segment: needs, hypotheses)
   -> 03-use-cases (steps and branches)
        -> 04-requirements/fr, 04-requirements/nfr, 05-business-rules
        -> docs/research/use-cases (product evidence)
```

- A segment lists the use cases that serve it. A use case has no field naming a segment or a hypothesis (U-11 in `../02-users/_CRITERIA.md`).
- A use case cites requirement, NFR and rule IDs. Requirements, NFRs and rules never cite a use case, a step or a segment.
- A use case links the research cards that support it. Cards do not name use cases.
- To find a parent, search the parent folder for the child ID. There is no reverse field to keep in sync.
- Siblings follow the same rule: a use case lists the use cases it `includes`, those that extend it (`extended_by`) and those that normally come `next`, never the reverse.
- Version IDs are names defined in `../00-current-scope/`. A use case uses them as keys of `versions`. This is not a link to a parent: `00-current-scope/` never lists flows.

### Use case IDs

A use case ID (`UC-xxx`) names a use case file. A flow ID (`Sx`, `Ax`) names a block inside one use case. UCG-10 keeps flow IDs stable. UCG-15 keeps use case IDs stable.

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

Each use case records, in the `versions` field of its frontmatter, how each version changes its flow selection:

```yaml
versions:
  V1:
    add: [MF, A1, A2, A3]
  V2:
    add: [A4, A5]
  V3:
    remove: [A3]
    add: [A6]
```

The example is hypothetical. `versions: {}` means that no version selects a flow of this use case.

- `MF` selects the whole main flow, every `Sx`. Each `Ax` is selected on its own.
- The **flow set** of a version is computed. Start from an empty set before the first version. Apply the versions in the order of the version list in `../00-current-scope/`. Each version adds and removes flows from the set of the version before it.
- Requirements still trace to each `Sx` and `Ax` through `Reqs` (Requirements traceability, below).

Rules (UCG-09):

1. Every version ID is defined in the version list in `../00-current-scope/`.
2. Versions apply in the order of that list, never in the order of the keys in this file.
3. The first version starts from an empty flow set.
4. `add` holds only flows that are not in the flow set of the version before.
5. `remove` holds only flows that are in the flow set of the version before.
6. No ID appears twice in one list.
7. No ID is in both `add` and `remove` of the same version.
8. Each ID is `MF` or the ID of an alternative flow written in this file.
9. No `Sx` is selected on its own.
10. A version that this file does not name leaves the flow set of this use case unchanged.
11. No alternative flow is in a flow set that does not hold `MF`.
12. A version never selects a flow of another use case on its behalf. Each use case records its own selection.

The check reports each broken rule as an error.

**Removing a flow is not retiring it.** `remove` takes a flow out of a version. The flow stays in the use case, its requirements stay, and a later version can add it again. Retiring removes the flow from the behavioral model and its ID is never reused (UCG-10). Retiring a flow that a version formula still names is an open decision. The check reports it and the owner decides.

**Related use cases.** A use case can relate to another use case in three ways. They are not the same. Only a scope dependency is checked against a version.

- **Invocation.** `includes: [UC-xxx]` says that this use case runs the main flow of UC-xxx as one unit. Each step that runs part of it names that step, for example "as UC-xxx S2 says".
- The alternative flows of an included use case are selected only in its own `versions`. Each one it selects applies to every use case that includes it. Selecting this use case selects no flow of UC-xxx (rule 12).
- **Behavior reference.** A response written "as UC-xxx Sx says" or "as in UC-xxx Ax" reuses the wording of that response. It calls no use case and selects no flow. It is not a scope dependency and gives no requirement trace. It names a block that exists and is not retired (UCG-10).
- **Scope dependency.** A selected flow needs another behavior to reach its `End`. Only the structure of the use case declares it: `includes`, `extended_by`, an `End` that goes to another use case, or a precondition.
- `includes` needs the main flow of the included use case. A precondition states a condition the flow needs. It does not have to name a use case, and review checks it.
- A flow that truly needs a behavior it refers to declares that need through one of these. The reference alone never does.

The version check reports each scope dependency that the version does not meet. For example, a flow set holds `MF` of this use case but not `MF` of an included use case. An `End` that goes to `UC-?` is reported the same way. The check changes no selection. The owner decides what to select. Two flows in two use cases are not the same flow because they share a number.

**Scope edits change no block date.** `versions` is in the frontmatter, not in a block. Changing it does not change `Updated at` (UCG-14). Git history keeps every earlier formula.

### Requirements traceability

- The `Reqs` field of each `Sx` and `Ax` holds one of three values: FR IDs, `FR-?` or `none`.
- FR IDs are the requirements for its response. One response can lead to several requirements. One requirement can serve several responses.
- `FR-?` means that no functional requirement exists for this response yet. A flow that no version selects can keep `FR-?`.
- `none` means that the block needs no FR of its own. It is allowed only when all of these hold:
  1. The use case `includes` the use case whose block it uses.
  2. The block runs part of the included use case. It is a step that runs one of its steps (Invocation, above).
  3. `System` names the block it runs, for example "as UC-xxx S1 says". That block gives the whole response.
  4. The block adds no response of its own.
- A behavior reference in any other block never allows `none`, even when the use case includes the other one. That block keeps FR IDs or `FR-?`.
- The requirements of a response used through `none` trace at the included use case. That use case is in the version through the `includes` dependency (Related use cases, above).
- A block can use an included step and also add its own response. Its `Reqs` then traces only its own part: FR IDs or `FR-?`.
- `Reqs` never refers to a response in another block. A reused response is written in `System` as a behavior reference.
- A response with the same meaning as one an FR already covers cites that FR. It never gets a second FR.
- Real FR IDs are written in `Reqs` when the requirements of a selected flow are specified. A use case does not cite an FR ID per bullet of `System`.
- An FR belongs to the scope of a version when a block in that version's flow set lists it. Requirements hold no version field.
- A change to the `System` of a block with real FR IDs is checked against those FRs in that change. The author also names the versions whose flow set holds that flow.
- A scope change is checked against the requirements. The check names the FRs the new flow set needs and those it no longer needs. Removing a flow from a version never deletes or retires an FR.

### Single source of truth (SSOT)

A rule or quality target is defined in exactly one place. A use case never states its value, never paraphrases it into a number, and never lists its allowed values. It writes what the system does and points to the ID:

> Not met: "The system rejects files larger than 20 MB."
> Met: "The system rejects a file that exceeds the size limit [BR-001]."

A use case may cite an ID that does not exist yet. It writes `[BR-?: <topic>]` or `[NFR-?: <topic>]`, naming the topic and nothing else. Real IDs replace the markers when the requirements, rules and quality targets of a selected flow are written. A flow that no version selects can keep its markers. For a selected flow, the version check reports each marker left (UCG-06).

## 2. Evidence tags

Claims about product behavior carry the same tags as `02-users` (`[observed: <source>]`, `[inferred: <source>]`, `[assumed]`). For product coverage the source is a research card or recording under `docs/research/use-cases/`. A flow nobody has recorded is `unverified` and its steps stay `[assumed]`.

Evidence explains where a flow or a response came from. It is not a decision to build it. A research card that shows a behavior in another product never puts that behavior in a version.

## 3. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment, *CI* = checked across files. No tooling exists yet; until it does, Lint and CI rows are checked by review.

"Applies to" says what a criterion checks. *Model* = every flow of the use case, whether a version selects it or not. *Version* = only the flows in the flow set of the version being checked. A version check gives a report. It is not a status of the use case.

| ID | Criterion | Prevents | Check | Applies to | Source |
|---|---|---|---|---|---|
| UCG-01 | One user goal, reachable in one sitting, with an observable result of value to the user. The title is the user, a verb, a specific object and what distinguishes it, in the user's words. The use case does not name a segment; a segment in `02-users` lists it (U-11) | Cases too large or small to scope or test; two cases nobody can tell apart; cases nobody needs; links pointing up | Review | Model | Cockburn (user-goal level) |
| UCG-02 | Situation and goal describe what the user wants and why now. They contain no feature or solution | Solutions dressed up as goals | Review | Model | Jobs-to-be-done |
| UCG-03 | The main flow is a list of step blocks (`### Sx · Name`) with stable IDs. Each step has the fields `User`, `System` and `Reqs` (and `Evidence` when it makes a product claim), then `Updated at` (UCG-14). `System` is what the user can observe; `Reqs` holds the requirement IDs for that response, `FR-?`, or `none` under the conditions in section 1 (Requirements traceability). `none` holds only in a block that runs part of an included use case. A response reused from another block is written in `System`, never in `Reqs`. 3 to 9 steps, no "if" (branches go to alternative flows). A response describes behavior, not implementation or interface (UCG-13) | Responses buried in prose or packed into table cells; unclear source for an FR; two FRs for one response; a response with no FR because it only reuses wording; architecture decided by accident | Lint (headings, fields, IDs) + Review | Model | Cockburn |
| UCG-04 | Each alternative flow is a block (`### Ax · Name`) with the fields `At` (the step or steps where it starts), `End`, `When` (a condition the system can detect), `System` and `Reqs`, then `Updated at` (UCG-14). `End` uses one value from the template: returns to a step, continues at a step, stays at the same step, ends the case, or goes to another use case. Every step that takes input, can be cancelled, depends on an external service, or can take long has a branch or a stated reason for none | Branches no test can reproduce; success-path-only specs | Lint (fields) + Review (coverage) | Model | Cockburn |
| UCG-05 | Postconditions are verifiable by observing the product. A minimal guarantee names what stays true when any branch fails. The version check reports each postcondition or guarantee that a selected flow reaches and that cannot be verified | No final assertion for tests; data loss on failure | Review | Model (sections present), Version (verifiable) | Cockburn |
| UCG-06 | A use case contains no rule or quality value (SSOT, section 1). It cites by ID every requirement, limit, quota, allowed list, validation, wait or availability a step depends on (`FR-xxx`, `[BR-xxx]`, `[NFR-xxx]`). A `?` marker is allowed on any flow. For each flow in the flow set, the version check reports every `FR-?`, `[BR-?]` and `[NFR-?]` marker left. It also reports every cited ID that does not exist | The same rule written differently in many places; values changed in one file and not the others; requirements with no source step; a selected flow with no requirements | Lint (numbers and markers) + CI (IDs resolve) | Model (no values), Version (no markers, IDs resolve) | Project rule |
| UCG-07 | A use case names no segment and no hypothesis. A reference from a segment (`UC-xxx.S3`, `UC-xxx.A2`) points to a step or branch that exists, and a retired ID is reported | Links pointing up; dangling references from segments; hypotheses that never reach a step | CI (references resolve) | Model | Project rule |
| UCG-08 | Product coverage is stated for each baseline product as `observed`, `not offered` or `unverified`, with a link to the research card. Differences are described in words, without rule values. Unrecorded claims stay `assumed`. Coverage is evidence, not a selection (section 2) | Guesses read as facts; scope decided from evidence alone | Lint (tags) + Review | Model | Project rule |
| UCG-09 | `versions` follows the rules in section 1 (Version scope). Only `versions` selects flows. Each broken rule is reported as an error. The version check also reports each scope dependency the version does not meet, including a missing included main flow (Related use cases, section 1). A behavior reference is not a scope dependency. The check adds and removes no flow | Scope recorded in two places; formulas that do not compute; an alternative flow selected without its main flow; a use case selected without the main flow it includes; flows selected for another use case by accident | Lint (formula) + CI (version IDs resolve, scope dependencies) | Model (formula), Version (scope dependencies) | Project rule |
| UCG-10 | Step and branch IDs are never renumbered once cited, and retired ones are listed and never reused. Removing a flow from a version is not retiring it (section 1). Relations are declared on the parent side only (`includes`, `extended_by`, `next`). Every reference to another use case or block names an ID that exists and is not retired: a relation, an `End`, or a behavior reference in `System`. `UC-?` in an `End` is allowed. This reference check does not depend on any version. A broken reference is an error in the model; a dependency a version does not meet is a version report (UCG-09). An open question that changes a flow or a result names that flow. The version check reports each open question that names a flow in the flow set | Segments citing the wrong step; two-way drift; references to retired blocks; gaps hidden inside selected flows | CI (references) + Review | Model (IDs, relations, references, questions name flows), Version (open questions) | Project rule |
| UCG-11 | Text follows `docs/spec/_STYLE.md`: terms from its term table, no banned vague verb, no may/might/should/could in `System`, sentences of 20 words or fewer, conditions in `When` and not as "if" in `System`, evidence on its own line | Responses that two readers understand differently; requirements nobody can test; walls of text | Lint (banned words, field names) + Review | Model | Project rule |
| UCG-12 | The `Flow at a glance` section holds one Mermaid flowchart between the `BEGIN generated` and `END generated` markers. It shows every step, and every `At`/`End` pair of every alternative flow other than `Same step`, which is listed in a line under the diagram. It is never edited by hand; a change to a step or a flow regenerates it | A diagram that no longer matches the flows; two sources for the same flow | Review (until the skill exists), then CI (diagram matches flows) | Model | Project rule |
| UCG-13 | A use case describes what the user wants to do and what the system tells, keeps, changes or builds. It names no widget, gesture, position, look, label or layout. It names a place only by a zone from the term table in `_STYLE.md` (request area, conversation, deck canvas). A UI detail that carries a requirement is written as the requirement. It passes the swap test in `_STYLE.md`: the sentence stays true with another interface | A spec that breaks when the design changes; requirements that fix a design nobody chose; behavior that touch-only or voice-only users cannot follow | Lint (interface words, `_STYLE.md` rule 11) + Review (swap test) | Model | Cockburn (leave out the user interface); Constantine and Lockwood (essential use cases) |
| UCG-14 | Every block (each step, each alternative flow and each product block, written as a `###` heading) ends with the field `Updated at`, the date of the last change to that block, as `dd-mm-yyyy`. Any edit to a block sets it to the date of that edit. The frontmatter, `versions` included, is not a block and has no date. The file does not record who changed it; git history does | Blocks whose date is out of step with their text; readers who cannot tell which parts are current; scope edits read as behavior changes | Lint (field, date format) + Review (date matches the last edit) | Model | Project rule |
| UCG-15 | A use case ID is never reused or moved to another goal in the `docs/spec/` namespace, also after its file is deleted. A new use case takes the ID after the highest ID in the folder and in the retired IDs. Retired IDs and the one owner-approved renumbering are listed in section 1 (Use case IDs). Gaps stay | Two meanings for one ID; old references, commits and segment links that point to the wrong use case | Review | Model | Project rule |

## 4. Illustrations (hypothetical)

**UCG-06: a response that cites a rule.**

> Not met: "S3: The system rejects a document over 20 MB or in a format other than PDF, DOCX or TXT."
> Met: "S3: The system accepts the document, or rejects it with the reason when it breaks the upload rules [BR-002]." `Reqs`: `FR-004`. The sizes and formats live in `BR-002` only. Changing a size changes one file.

**UCG-04: a detectable branch.**

> Not met: "A1: An error occurs. The system shows an error."
> Met: "A1 (at S4): The connection is lost while the deck is being generated. The system keeps the user's request and any slides already shown, and offers to resume. Ends at S4 when the connection returns."

**UCG-03: observable, not implementation.**

> Not met: "S5: The model returns slide JSON and the renderer draws it."
> Met: "S5: The system shows a draft deck the user can look through slide by slide."

**UCG-11: a response with one meaning.**

> Not met: "The system may handle the failure gracefully and a notice is shown."
> Met: When: "The model call fails." System: "Shows a notice that drafting the outline failed. Keeps the request."

**UCG-13: intent and response, not interface.**

> Not met: "The user opens the + menu, points at Skills and clicks a skill. A dropdown closes and a chip appears at the bottom left of the box."
> Met: When: "The user chooses a skill." System: "Adds a text shortcut for the skill to the request text. Does not send the request."

> Not met: "Opens the dashboard as an overlay with no dimming."
> Met: "Opens the dashboard. The conversation, the request text and the attachments stay as they were." The "no dimming" detail is a design choice. It goes to UI design, not here. What must stay true is that nothing the user prepared is lost.

**UCG-07 and U-11: the link is on the segment side.**

> In `USR-009.md`, hypothesis H-3 (made-up figures are dangerous) has `Handled by: UC-000.S5, UC-000.A3`. `UC-000.md` mentions neither USR-009 nor H-3. Its S5 response marks any number the system added rather than the user, and cites `[BR-?: numbers added without a source]`.

**UCG-09: a formula, not a list per version.**

> Not met: `V2: { add: [MF, A1, A4] }` when V1 already added `MF` and `A1`. Rule 4 fails: `MF` and `A1` are already in the flow set.
> Met: `V2: { add: [A4] }`. The flow set of V2 is computed: `MF`, `A1` and `A4`.

> Not met: `V3: { remove: [MF] }` while `A4` stays in the flow set. Rule 11 fails.
> Met: `V3: { remove: [MF, A1, A4] }`. The use case leaves the scope of V3. Its flows and their requirements stay.

**UCG-03, UCG-09 and UCG-10: invocation, behavior reference and `Reqs`.** UC-020 `includes: [UC-021]`.

> Not met: UC-020 S1 · System: "Sends the request as UC-021 S2 says." `Reqs`: "as in UC-021 S2". `Reqs` holds a reference, not a requirement.
> Met: the same `System`, with `Reqs`: `none`. The FRs of that response trace at UC-021 S2.
> Not met: UC-020 A9 starts at S5, a step that runs no part of UC-021 · System: "Keeps the draft, as in UC-021 A14." `Reqs`: `none`. This is a behavior reference, so no FR traces anywhere. It keeps `FR-?`.
> Met: UC-020 A4 · System: "Rejects the file, as in UC-021 A8." A version selects UC-020 A4 but not UC-021 A8. The check reports nothing for this reference, because it reuses wording only. It reports an error only when UC-021 A8 does not exist or is retired.
