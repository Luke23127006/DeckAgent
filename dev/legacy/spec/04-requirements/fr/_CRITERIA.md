# Gate: Functional Requirement

Template: `_TEMPLATE.md`. Style: `../../_STYLE.md`. Cited by: `../../03-use-cases/` (the interactions that cite the FR). Rule values: `../../05-business-rules/`. Quality targets: `../nfr/`. Versions: `docs/versions/`.

## 1. What a functional requirement is, and is not

**A functional requirement (FR) is a testable statement of one system behavior under a stated condition.** It says what the system shows, keeps, changes, creates or refuses. A use case response says what the user observes in a journey. The FR adds the precision a test needs: which inputs, which outcomes, which boundary cases, what stays the same.

| If the content is... | Then it belongs to |
|---|---|
| A user goal, a journey, the order of steps, the user's intent | `../../03-use-cases/`. The use case cites the FR from its flow |
| A limit, threshold, quota, allowed list, retention period or any other value a rule defines | `../../05-business-rules/`. The FR cites `[BR-xxx]`, or `[BR-?: <topic>]` until the rule exists |
| A wait time, size target, availability target or any other quality target | `../nfr/`. The FR cites `[NFR-xxx]`, or `[NFR-?: <topic>]` |
| How the user operates the product or how it looks: a label, a placement, a colour, an icon, a layout | UI design work (no folder yet). The FR writes the behavior only (section 1, Interface) |
| How the system achieves a behavior (model, queue, storage, API) | An ADR or architecture work |
| A task to build something, or how far it is built or tested | Not in the specs. An FR holds no progress, no priority and no version |
| Where an idea came from (a recording, a reference product) | Research under `docs/research/`. An FR has no research field |
| The owner's choice of which flows a version must meet | The scope file of that version under `docs/versions/`. An FR selects nothing |
| A decision the owner has not made | The design backlog of the ideal spec, outside `docs/spec/`. No FR, no `FR-?` placeholder, and no `Not specified` item restates it |

A rule without a value stays in an FR. An example is "the user cannot start a new chat while a request is active in that chat". A rule that holds a value goes to `../../05-business-rules/`.

### Granularity and reuse

- **One FR** has one coherent purpose. Its outcomes belong together and change for the same reason.
- **Split** an FR when one of these holds:
  1. Its outcomes can fail on their own, under conditions that differ in a material way.
  2. Other use case flows need only part of it.
  3. It joins responsibilities that are not related.
  4. An acceptance condition would add behavior that only flows a version does not name need. That behavior goes to its own FR.
- **Reuse** an FR when another flow needs the same behavior: the same kind of condition and the same expected outcome. The use case and the data (which slide, which file) can differ. A flow that adds its own behavior cites the shared FR and its own FR.
- **Same words are not the same behavior.** Reuse an FR only when the meaning is the same. Reusing it for a case with an open question decides that question silently.
- **No duplicate FR.** Before writing an FR, search the statements in this folder. A behavior an FR already covers gets no second FR.
- **No FR** for a response that a flow takes whole from an included use case (the interaction adds no response of its own). That FR traces at the included use case.
- **Seven acceptance conditions** is a guide for reading, not a split rule. Cohesion comes first. Do not split a coherent FR only because it has eight conditions.
- **Precision.** An FR can restate the core behavior. Its acceptance conditions add at least one of: observable outcomes, relevant input conditions, boundary cases, preservation guarantees, failure behavior. An FR that only repeats the use case adds nothing and is not written.

### Acceptance conditions

Each acceptance condition is a block `### AC-n · Short name` with the fields `Given`, `When`, `Then` and `Check`.

- **Given:** the state and the relevant inputs. Inputs are described well enough to repeat, for example "a request with a topic and no audience".
- **When:** the action of the user or the event.
- **Then:** the observable outcomes, one per bullet. No "if": a condition goes in `Given` or `When`.
- **Check:** one value.
  - `deterministic`: the result is checked through observable state or an exact invariant. Example: an empty outline cannot be confirmed. A new chat has no deck from an earlier chat. A finished slide is still there after a stop.
  - `judged`: a person judges the meaning or relevance of an output against the stated outcome. Example: a question asks for information the request does not give. A changed slide reflects the instruction.
- An acceptance condition never requires the exact words of the model, unless a confirmed requirement fixes those words. It states what an output must say, not how.
- A person, the user included, can judge a condition when it is specific enough to give the same verdict each time.
- For model-dependent behavior, write invariants as `deterministic` conditions and content quality as `judged` ones, where both apply. A preservation guarantee is checked by comparing the state before and after, not by reading a message of the system.
- An acceptance condition can give example inputs, such as "a deck of five slides". It never defines a limit or a target. Those are BR and NFR values.

**Verification is not validation.** FR verification asks: does the behavior meet the stated condition? Product validation asks: does the product meet the user's expectations and the goal of a version (`docs/versions/<version>/SCOPE.md`)? The same person can take part in both. The conclusions differ. An FR does not copy a validation scenario and does not name one.

### Interface

FRs follow the intent of `_STYLE.md` rule 10. An FR describes behavior the user can observe. It does not fix a design nobody approved.

- Allowed: "Shows the outline in the conversation." "Shows the current deck." "Lets the user confirm the outline." "Shows the reason a file was rejected."
- Not allowed: a label, a placement, a colour, an icon, a position, a layout or an interaction design nobody approved.
- Name a place by its zone from `_STYLE.md`: request area, conversation, deck canvas.
- Apply the swap test in `_STYLE.md`. Each hit of its interface check is rewritten, or kept with a stated reason. An ordinary word that describes confirmed behavior is a valid reason.

### IDs and files

- One FR per file: `FR-xxx.md` in this folder. `xxx` is three digits: `FR-001`, `FR-002`.
- The `id` in the frontmatter equals the file name.
- A new FR takes the ID after the highest ID in this folder and in the retired IDs below. Gaps stay.
- An ID never changes when the title or the wording changes. An ID is never reused.
- An ID is retired only when its behavior leaves the ideal product or merges into another FR. Leaving a flow out of a version retires no FR. A retired ID is listed below with the date and, after a merge, the FR it merged into.
- A split keeps the ID on one part. The other part takes a new ID. The same change updates every flow citation of the ID.
- Acceptance condition IDs are `AC-1`, `AC-2` within one FR. They are never renumbered to close a gap.
- There is no FR index. The files of this folder are the list.

Retired FR IDs:

- FR-060, retired on 12-10-2026. It let the user change the provider of a saved provider configuration. It kept the models added for the earlier provider. The owner decision of 2026-10-12 on provider IDs removed that behavior from the ideal product: the provider ID never changes. It merged into no FR.

### Traceability and scope

Links go top-down only (`../../03-use-cases/_CRITERIA.md`, section 1).

- A use case flow cites the FRs of its responses. One FR can serve many flows. One flow can cite many FRs.
- An FR names no use case, no version, no step, no flow and no user segment.
- An FR has no version field. A version scope file lists no FR.
- **Scope.** An FR belongs to a version when a flow that the version scope file names cites it. An FR that only flows outside the version cite is in no version. An FR selects no flow.
- To find the flows that use an FR, search `../../03-use-cases/` for its ID. There is no reverse field.
- An FR changes with the flows it serves. A change to the meaning of an FR is checked against every flow that cites it, in the same change. A change to the response of a flow is checked against its FRs (`../../03-use-cases/_CRITERIA.md`, Requirements traceability).

## 2. Research

An FR makes no claim about another product, so it links no research. The source of a behavior is the use case flow that cites it. Use-case criteria, not this gate, decide when a use case links research.

## 3. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment, *CI* = checked across files. No tooling exists yet; until it does, Lint and CI rows are checked by review.

"Applies to": *Model* = every FR file. *Version* = only the FRs that a flow the version scope file names cites. A scope review gives a report. It is not a status of the FR.

| ID | Criterion | Prevents | Check | Applies to | Source |
|---|---|---|---|---|---|
| FRG-01 | The FR states one system behavior under a stated condition: what the system shows, keeps, changes, creates or refuses. It holds no user goal, journey, rule value, quality target, interface design, architecture, task, progress or version (section 1) | Requirements that restate journeys; values in two places; design or architecture chosen by accident | Review | Model | Project rule |
| FRG-02 | Granularity follows section 1: one coherent purpose; split by the four reasons; reuse for the same behavior; no second FR for a behavior an FR covers; no FR for a response a flow takes whole from an included use case | Giant FRs; one FR per step by habit; the same behavior written twice with drift | Review | Model | Project rule |
| FRG-03 | The acceptance conditions add testable precision beyond the use case response: outcomes, inputs, boundaries, preservation or failure behavior | FRs that copy the use case and add no test | Review | Model | Project rule |
| FRG-04 | The file follows `_TEMPLATE.md`: frontmatter `id` and `title`; the `Requirement` fields in order (`Statement`, `Updated at`); at least one acceptance condition. An optional `Why` with no reason is removed, never left empty. No field for status, source, version, priority, progress, research, use case or segment | Files nobody can compare or check; hidden scope or progress fields; an approval trail nobody maintains | Lint (fields, order) | Model | Project rule |
| FRG-05 | The FR records no decision history: no approval state, no owner-decision dates, no superseded wording, no list of earlier rules. Git history keeps the changes. `Source` and `Why` name no owner decision | An approval trail that reads as part of the behavior; requirements that age into meeting minutes | Lint (no `Status:`, no `owner decision` in fields) | Model | Project rule |
| FRG-06 | An open question never becomes a requirement and never yields a placeholder FR, a `Not specified` item or a guessed outcome. The question goes to the design backlog of the ideal spec, outside `docs/spec/`. A flow keeps `FR-?` only while a decided behavior has no requirement yet | Open questions turned into requirements without a decision; placeholder FRs | Review | Model | Project rule |
| FRG-08 | Each acceptance condition is a block `### AC-n · Name` with `Given`, `When`, `Then` and `Check`. `Check` is `deterministic` or `judged`. `Then` holds observable outcomes, one per bullet, without "if". No exact model wording, unless a confirmed requirement fixes it. No validation scenario is copied or named | Conditions nobody can test; tests tied to model wording; validation mixed with verification | Lint (fields, values) + Review | Model | Project rule |
| FRG-09 | The FR holds no rule value and no quality target. It cites `[BR-xxx]` and `[NFR-xxx]`, or `[BR-?: topic]` and `[NFR-?: topic]`. Example inputs in a condition are allowed. The scope review reports every marker left in an FR the version cites and every cited ID that does not exist | The same value in many files; missing values hidden inside confirmed FRs | Lint (numbers, markers) + CI (IDs resolve) | Model (no values), Version (no markers, IDs resolve) | Project rule |
| FRG-10 | Text follows `_STYLE.md` rules 1 to 9 in `Statement` and `Then`. It follows the intent of rule 10: no unapproved label, placement, colour, icon, position or layout; places named by zone; the swap test applied; each hit of the interface check rewritten or kept with a stated reason | Requirements that fix a design nobody chose; responses with two meanings | Lint (banned words, interface words) + Review (swap test) | Model | Project rule |
| FRG-11 | The file name is `FR-xxx.md` with three digits, and equals the frontmatter `id`. IDs are unique. A new ID follows the highest existing or retired ID. A retired ID is listed in section 1 and never reused. IDs are not renumbered. Acceptance condition IDs are not renumbered | Two meanings for one ID; broken citations after an edit | Lint (name, format) + CI (unique, not retired) | Model | Project rule |
| FRG-12 | The FR names no use case, step, flow or segment. It has no version field. A version scope file lists no FR. Every acceptance condition is needed by at least one flow that cites the FR | Links pointing up; a second source of scope; scope widened through an acceptance condition | Lint (no `UC-`, `USR-`, flow IDs) + Review | Model | Project rule |
| FRG-14 | `Updated at` is the date of the last change to the file, as `dd-mm-yyyy`. Any edit sets it. Acceptance condition blocks have no date of their own | Files whose date is out of step with their text | Lint (format) + Review | Model | Project rule |

Gate IDs FRG-07 and FRG-13 were retired on 25-10-2026, when the approval and reporting machinery around `Status`, `Source` and `Not specified` left the specs. A retired gate ID is not reused.

The use case side of these checks is in `../../03-use-cases/_CRITERIA.md`: flow citations and completeness (Requirements traceability, UCG-03), markers and IDs that resolve (UCG-06), flows that add no response of their own (Requirements traceability).

## 4. Illustrations (hypothetical)

IDs below are examples. They are not allocated.

**FRG-02: reuse for the same behavior.**

> Not met: one FR "keeps finished slides after a stop" for the first draft, and a second FR with the same meaning for a follow-up request.
> Met: one FR, "an interrupted request keeps each finished slide and never replaces a slide with an unfinished change". Every flow where work can be stopped or fail cites it. A flow that also reports the number of finished slides cites a second FR for that report.

**FRG-02 and FRG-06: same words, different meaning.**

> Not met: the FR "leaving for model setup keeps the request text and the attachments" is also cited for starting a new chat. What happens to unsent text at a new chat is an open question. The citation decides it.
> Met: the open question lives in the design backlog, outside `docs/spec/`. The FR stays silent about the open case.

**FRG-03: precision beyond the use case.**

> Not met: Statement "The system does not accept confirming an empty outline." One condition: "Then: the outline cannot be confirmed."
> Met: the same statement. Conditions: the outline stays unconfirmed; no error message is shown; an outline whose titles the user deleted counts as empty.

**FRG-08: deterministic invariant and judged quality.**

> A follow-up request changes slide 3.
> AC-1 · Check: deterministic. Then: every slide other than slide 3 is the same as before the request.
> AC-2 · Check: judged. Then: slide 3 reflects the instruction.
> Not met: "Then: the closing message says that no other slide changed." A message of the system is no proof of preservation.

**FRG-09: an FR with an open rule value.**

> Met: Statement "The system rejects a file that breaks the attachment rules [BR-?: accepted file types, number and size of attachments]. It shows the reason on the attachment." The scope review reports the marker until the rule exists. The FR is not blocked.

**FRG-10: behavior, not design.**

> Not met: "The Confirm button is disabled and grey while the outline is empty."
> Met: "The system does not accept confirming an empty outline."
