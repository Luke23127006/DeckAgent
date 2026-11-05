# Gate: Use case

Template: `_TEMPLATE.md`. Style: `../_STYLE.md`. Children:
`../03-requirements/fr/`, `../03-requirements/nfr/`, `../04-business-rules/`.

## 1. What a use case is, and is not

**A use case models product behavior for one user goal reached in a single sitting.** It
says what the user does and how the product responds observably. Each system response is
a candidate functional requirement. Each alternative flow is a candidate error/edge
requirement. Each rule or quality target a step depends on is cited here and defined
elsewhere.

**A flow records behavior to consider, not a commitment to build it.** A use case
explores broadly. Evidence says where an idea came from; it does not choose anything.

### Where content belongs

| If the content is... | Then it belongs |
|---|---|
| A limit, threshold, quota, allow-list, retention time, or other value a rule defines | `../04-business-rules/`. The use case cites the rule ID |
| A wait time, size target, availability, or another quality target | `../03-requirements/nfr/`. The use case cites the NFR ID |
| A testable statement of a system response | `../03-requirements/fr/`. The use case cites the requirement ID |
| A raw observation from a transcript (what a product does, what limit it shows) | `dev/research/`. The use case links the research item |
| How the system achieves a response (model, queue, storage, API) | ADR or architecture work, not here |
| How the user operates the product or what it looks like: controls, gestures, position, labels, color, layout | UI design work (no folder yet). The use case writes only intent and response (UCG-09) |

### Link direction: top-down only

- The vision (`../01-product-vision/`) is the parent. It does not list use cases; to find the parent, read the vision.
- A use case cites requirement, NFR, and rule IDs. Requirements, NFRs, and rules never cite a use case, step, or branch.
- A use case links the research items that support it. A research item does not name a use case.

### Use case IDs

- One ID (`UC-xxx`) names a use case file. A flow ID (`Sx`, `Ax`) names a block in the file.
- The namespace is `dev/spec/`. IDs of the previous spec in `dev/legacy/spec/` (AGENTS.md "Legacy source") do not belong to it until they are migrated here.
- An ID never moves to a different goal or is reused, even after a file is deleted.
- A new ID takes the number after the highest ID in the folder, in the parked use cases of `../05-backlog/` and in the removed-ID list. Gaps stay as they are.
- A use case or a flow left for later is parked in `../05-backlog/`, not removed. A parked flow keeps its ID free in its use case, and the use case names it in a Note line only.
- IDs are not renumbered.

Removed use case IDs:

- UC-017, 05-11-2026, retired: a visual style is the rules in words of a design system (UC-010), and the user chooses a template in the interview (UC-001). Making a design system from a deck is UC-010 A11.
- UC-014, 05-11-2026, retired: the reach of the agent of a chat is fixed by code and the user chooses no permission level; a step beyond that reach is UC-003 A51.
- UC-011, 05-11-2026, retired: a chat holds at most one deck, and a second deck for another use starts in a new chat (UC-012) as a first draft (UC-001), with an exported deck attached as material. A change of the same deck is a follow-up request (UC-002).

Layer: in the target spec (`dev/spec/`) each alternative keeps At, Ends, When and FR, with
System in one line. Detailed responses live in the version spec (WORKFLOW.md "Spec
layers"). Notes stay short: a design choice is one line that links its proposal in
`dev/decisions/`, never the reasoning itself.

## 2. Evidence tags

A claim about product behavior uses a tag from `../_STYLE.md` (`[observed: <source>]`,
`[inferred: <source>]`, `[assumed]`). For product coverage, the source is a research item
or transcript under `dev/research/`. A flow nobody has recorded is `unverified` and its
steps keep `[assumed]`.

Evidence says where a flow or response came from. It is not a decision to build it. A
research item showing behavior in another product does not bring that behavior into
scope.

## 3. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment,
*CI* = cross-check. There is no tool yet, so review does both Lint and CI.

| ID | Criterion | Prevents | Check |
|---|---|---|---|
| UCG-01 | One user goal, reached in a single sitting, with an observable result of value. The title is user + verb + specific object + the distinguishing thing, in the user's words | A case too big or too small; two cases that cannot be told apart | Review |
| UCG-02 | Situation and goal describe what the user wants and why now. No feature or solution | A solution dressed up as a goal | Review |
| UCG-03 | The Steps table has 3–9 `Sx` rows in order. Each row has User (intent), System (observable, no "if"), FR (ID or `FR-?`). No settings, no interface | A response buried in prose; an unclear FR source | Lint (rows, columns) + Review |
| UCG-04 | Each alternative is a `### Ax · name` block with At, Ends, When, System, FR. `Ends` uses a value from the template. Each step that takes input, can be cancelled, depends on an external service, or can be slow has an alternative, or a recorded reason | A branch not reproducibly testable | Lint (fields) + Review |
| UCG-05 | The Outcome is verifiable by observation. The Minimal guarantee says what stays true when any branch fails | No final claim to test; data loss on failure | Review |
| UCG-06 | Step and branch IDs are not renumbered once cited; dropped IDs are listed and not reused. Each reference to another use case or block (an `Ends`, a "like UC-xxx Sx") names an ID that exists and is not dropped or parked. `UC-?` in `Ends` is allowed; a parked item is named only in a Note | A citation pointing wrong; a reference to a dropped block | CI (references) + Review |
| UCG-07 | The use case contains no rule or quality values. It cites by ID every requirement, limit, allow-list, check, or wait time a step depends on (`FR-xxx`, `[BR-xxx]`, `[NFR-xxx]`). The `?` marker is allowed on any flow | The same rule in several places; a value changed in one place but not another | Lint (numbers, markers) + CI (ID exists) |
| UCG-08 | The product coverage stated for each reference product is `observed`, `none`, or `unverified`, with a research link. Differences are described in prose, not rule values. An unrecorded claim keeps `[assumed]` | A guess read as a fact | Lint (tags) + Review |
| UCG-09 | Text follows `../_STYLE.md`: glossary words, no banned vague verbs, no "can/should/might" in System, conditions in When, one action per line, evidence on its own line. The use case writes intent and response, not a widget, gesture, position, style, or label; it names a place only by region | A response read two ways; a spec that breaks when design changes | Lint (banned words, interface words) + Review |
| UCG-10 | The interaction diagram follows `../_MERMAID.md` (MG-01..MG-10): valid, a view generated from the Steps table and Alternative flows, each message maps 1-to-1, not hand-edited | A diagram drifting from the source; a branch lost when drawn | Review (until there is a skill), then CI |

## 4. Illustrations

**UCG-03: observable, not settings.**

> Fail: "S5: the model returns the chapter JSON and the renderer draws it."
> Pass: "S5 · System: plays the chapter's audio and shows progress advancing."

**UCG-04: detectable branch.**

> Fail: "A1: there is an error. The system shows the error."
> Pass: "A1 (at S3): connection lost while fetching content. The system keeps the link
> the user entered and reports it could not fetch."

**UCG-09: intent and response, not interface.**

> Fail: "The user clicks the Play button in the bottom corner."
> Pass: "The user requests playback. The system plays audio from the saved progress
> position."
