# Gate: Use Case

Template: `_TEMPLATE.md`. Style: `../_STYLE.md`. Parent: `../02-users/`. Children: `041-fr/`, `042-nfr/`, `05-business-rules/` (folder names as the project uses them; paths settle when those folders are created).

## 1. What a use case is, and is not

**A use case describes one goal a user reaches in one sitting: what the user does, and how DeckAgent visibly responds.** Each system response is a candidate functional requirement. Each alternative flow is a candidate error or edge requirement. Each rule or quality target a step depends on is cited here and defined elsewhere.

**This folder decides scope.** `02-users/` only helps detect use cases. Which ones ship first is recorded on each use case (`scope`, `ships_in_mvp`).

| If the content is... | Then it belongs to |
|---|---|
| A limit, threshold, quota, allowed list, retention period or any other value a rule defines | `05-business-rules/`. The use case cites the rule ID |
| A wait time, size target, availability target or any other quality target | `042-nfr/`. The use case cites the NFR ID |
| The testable statement of a system response | `041-fr/`. The use case cites the requirement ID |
| A raw observation from a recording (what a product did, which limit it showed) | `docs/research/use-cases/`. The use case links the research card |
| How the system achieves a response (model, queue, storage, API) | An ADR or architecture work, not here |
| How the user operates the product or how it looks: a control, menu, gesture, position, label, colour or layout | UI design work (no folder yet). The use case writes the intent and the response only (UCG-13) |
| A need or situation of a kind of person | `02-users/`. That folder lists this use case; this use case does not name the segment |

### Linking direction: top-down only

The parent file lists its children. A child never names its parent.

```
02-users (segment: needs, hypotheses)
   -> 03-use-cases (steps and branches)
        -> 041-fr, 042-nfr, 05-business-rules
        -> docs/research/use-cases (product evidence)
```

- A segment lists the use cases that serve it. A use case has no field naming a segment or a hypothesis (U-11 in `02-users/_CRITERIA.md`).
- A use case cites requirement, NFR and rule IDs. Requirements, NFRs and rules never cite a use case, a step or a segment.
- A use case links the research cards that support it. Cards do not name use cases.
- To find a parent, search the parent folder for the child ID. There is no reverse field to keep in sync.
- Siblings follow the same rule: a use case lists the use cases it `includes`, those that extend it (`extended_by`) and those that normally come `next`, never the reverse.

### Single source of truth (SSOT)

A rule or quality target is defined in exactly one place. A use case never states its value, never paraphrases it into a number, and never lists its allowed values. It writes what the system does and points to the ID:

> Not met: "The system rejects files larger than 20 MB."
> Met: "The system rejects a file that exceeds the size limit [BR-001]."

A use case may cite an ID that does not exist yet. It writes `[BR-?: <topic>]` or `[NFR-?: <topic>]`, naming the topic and nothing else. In the `Reqs` field, `FR-?` stands for "the requirement for this response, not written yet". Phase II mints the real IDs and replaces the markers. An Active use case has no marker left on the main flow or on the flows in `ships_in_mvp`; flows outside `ships_in_mvp` keep their markers until a later version writes their requirements (UCG-06).

## 2. Evidence tags

Claims about product behavior carry the same tags as `02-users` (`[observed: <source>]`, `[inferred: <source>]`, `[assumed]`). For product coverage the source is a research card or recording under `docs/research/use-cases/`. A flow nobody has recorded is `unverified` and its steps stay `[assumed]`.

## 3. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment, *CI* = checked across files. No tooling exists yet; until it does, Lint and CI rows are checked by review. "Applies from" is the status at which the criterion starts to bind (Draft or Active).

| ID | Criterion | Prevents | Check | Applies from | Source |
|---|---|---|---|---|---|
| UCG-01 | One user goal, reachable in one sitting, with an observable result of value to the user. The title is the user, a verb, a specific object and what distinguishes it, in the user's words. The use case does not name a segment; a segment in `02-users` lists it (U-11) | Cases too large or small to scope or test; two cases nobody can tell apart; cases nobody needs; links pointing up | Review | Draft | Cockburn (user-goal level) |
| UCG-02 | Situation and goal describe what the user wants and why now. They contain no feature or solution | Solutions dressed up as goals | Review | Draft | Jobs-to-be-done |
| UCG-03 | The main flow is a list of step blocks (`### Sx · Name`) with stable IDs. Each step has the fields `User`, `System` and `Reqs` (and `Evidence` when it makes a product claim), then `Updated at` (UCG-14). `System` is what the user can observe; `Reqs` holds the requirement IDs for that response. 3 to 9 steps, no "if" (branches go to alternative flows). A response describes behavior, not implementation or interface (UCG-13) | Responses buried in prose or packed into table cells; unclear source for an FR; architecture decided by accident | Lint (headings, fields, IDs) + Review | Draft | Cockburn |
| UCG-04 | Each alternative flow is a block (`### Ax · Name`) with the fields `At` (the step or steps where it starts), `End`, `When` (a condition the system can detect), `System` and `Reqs`, then `Updated at` (UCG-14). `End` uses one value from the template: returns to a step, continues at a step, stays at the same step, ends the case, or goes to another use case. Every step that takes input, can be cancelled, depends on an external service, or can take long has a branch or a stated reason for none | Branches no test can reproduce; success-path-only specs | Lint (fields) + Review (coverage) | Draft | Cockburn |
| UCG-05 | Postconditions are verifiable by observing the product. A minimal guarantee names what stays true when any branch fails | No final assertion for tests; data loss on failure | Review | Active | Cockburn |
| UCG-06 | A use case contains no rule or quality value (SSOT, section 1). It cites by ID every requirement, limit, quota, allowed list, validation, wait or availability a step depends on (`FR-xxx`, `[BR-xxx]`, `[NFR-xxx]`). An Active use case has no `?` marker on the main flow and on the flows listed in `ships_in_mvp`, and every ID cited there exists. Flows outside `ships_in_mvp` may keep `?` markers | The same rule written differently in many places; values changed in one file and not the others; requirements with no source step | Lint (numbers and markers) + CI (IDs resolve) | Draft (no values), Active (no markers on shipped flows) | Project rule |
| UCG-07 | A use case names no segment and no hypothesis. A reference from a segment (`UC-xxx.S3`, `UC-xxx.A2`) points to a step or branch that exists, and a retired ID is reported | Links pointing up; dangling references from segments; hypotheses that never reach a step | CI (references resolve) | Active | Project rule |
| UCG-08 | Product coverage is stated for each baseline product as `observed`, `not offered` or `unverified`, with a link to the research card. Differences are described in words, without rule values. Unrecorded claims stay `assumed` | Guesses read as facts; scope decided without evidence | Lint (tags) + Review | Draft | Project rule |
| UCG-09 | `scope` is `mvp`, `later` or `undecided`, with a one-line reason. For `mvp`, `ships_in_mvp` lists the main flow and the alternative flows that ship | Release scope with no basis; a case that ships without its error handling | Review | Active | Project rule |
| UCG-10 | Step and branch IDs are never renumbered once cited, and removed ones are retired, not reused. Relations are declared on the parent side only (`includes`, `extended_by`, `next`). An Active use case has no open question that changes a flow or result | Segments citing the wrong step; two-way drift; gaps hidden inside active cases | CI (references) + Review | Draft (IDs, relations), Active (questions) | Project rule |
| UCG-11 | Text follows `docs/spec/_STYLE.md`: terms from its term table, no banned vague verb, no may/might/should/could in `System`, sentences of 20 words or fewer, conditions in `When` and not as "if" in `System`, evidence on its own line | Responses that two readers understand differently; requirements nobody can test; walls of text | Lint (banned words, field names) + Review | Draft | Project rule |
| UCG-12 | The `Flow at a glance` section holds one Mermaid flowchart between the `BEGIN generated` and `END generated` markers. It shows every step, and every `At`/`End` pair of every alternative flow other than `Same step`, which is listed in a line under the diagram. It is never edited by hand; a change to a step or a flow regenerates it | A diagram that no longer matches the flows; two sources for the same flow | Review (until the skill exists), then CI (diagram matches flows) | Draft | Project rule |
| UCG-13 | A use case describes what the user wants to do and what the system tells, keeps, changes or builds. It names no widget, gesture, position, look, label or layout. It names a place only by a zone from the term table in `_STYLE.md` (request area, conversation, deck canvas). A UI detail that carries a requirement is written as the requirement. It passes the swap test in `_STYLE.md`: the sentence stays true with another interface | A spec that breaks when the design changes; requirements that fix a design nobody chose; behavior that touch-only or voice-only users cannot follow | Lint (interface words, `_STYLE.md` rule 11) + Review (swap test) | Draft | Cockburn (leave out the user interface); Constantine and Lockwood (essential use cases) |
| UCG-14 | Every block (each step, each alternative flow and each product block, written as a `###` heading) ends with the field `Updated at`, the date of the last change to that block, as `dd-mm-yyyy`. Any edit to a block sets it to the date of that edit. The file does not record who changed it; git history does | Blocks whose date is out of step with their text; readers who cannot tell which parts are current | Lint (field, date format) + Review (date matches the last edit) | Draft | Project rule |

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

> In `USR-009.md`, hypothesis H-3 (made-up figures are dangerous) has `Handled by: UC-004.S5, UC-004.A3`. `UC-004.md` mentions neither USR-009 nor H-3. Its S5 response marks any number the system added rather than the user, and cites `[BR-?: numbers added without a source]`.
