# Gate: Functional Requirement

Template: `_TEMPLATE.md`. Style: `../../_STYLE.md`. Cited by: `../../03-use-cases/` (the `Reqs` field). Rule values: `../../05-business-rules/`. Quality targets: `../nfr/`. Versions: `../../00-current-scope/`.

## 1. What a functional requirement is, and is not

**A functional requirement (FR) is a testable statement of one system behavior under a stated condition.** It says what the system shows, keeps, changes, creates or refuses. A use case response says what the user observes in a journey. The FR adds the precision a test needs: which inputs, which outcomes, which boundary cases, what stays the same.

| If the content is... | Then it belongs to |
|---|---|
| A user goal, a journey, the order of steps, the user's intent | `../../03-use-cases/`. The use case cites the FR in `Reqs` |
| A limit, threshold, quota, allowed list, retention period or any other value a rule defines | `../../05-business-rules/`. The FR cites `[BR-xxx]`, or `[BR-?: <topic>]` until the rule exists |
| A wait time, size target, availability target or any other quality target | `../nfr/`. The FR cites `[NFR-xxx]`, or `[NFR-?: <topic>]` |
| How the user operates the product or how it looks: a label, a placement, a colour, an icon, a layout | UI design work (no folder yet). The FR writes the behavior only (section 1, Interface) |
| How the system achieves a behavior (model, queue, storage, API) | An ADR or architecture work |
| A task to build something, or how far it is built or tested | Not in the specs. An FR holds no progress, no priority and no version |
| Where an idea came from (a recording, a reference product) | The use case and its research card. An FR has no evidence field |
| The owner's choice of which flows a version must meet | The `versions` field of each use case. An FR selects nothing |

A rule without a value stays in an FR. An example is "the user cannot start a new chat while a request is active". A rule that holds a value goes to `../../05-business-rules/`.

### Granularity and reuse

- **One FR** has one coherent purpose. Its outcomes belong together and change for the same reason.
- **Split** an FR when one of these holds:
  1. Its outcomes can fail on their own, under conditions that differ in a material way.
  2. Other use case blocks need only part of it.
  3. It joins responsibilities that are not related.
  4. An acceptance condition would add behavior that only flows outside the version need. That behavior goes to its own FR.
- **Reuse** an FR when another block needs the same behavior: the same kind of condition and the same expected outcome. The use case and the data (which slide, which file) can differ. A block that adds its own behavior cites the shared FR and its own FR.
- **Same words are not the same behavior.** Reuse an FR only when the meaning is the same. Reusing it for a case with an open question decides that question silently.
- **No duplicate FR.** Before writing an FR, search the statements in this folder. A behavior an FR already covers gets no second FR.
- **No FR** for a response that a block takes whole from an included use case (`Reqs: none`). That FR traces at the included use case.
- **Seven acceptance conditions** is a guide for reading, not a split rule. Cohesion comes first. Do not split a coherent FR only because it has eight conditions.
- **Precision.** An FR can restate the core behavior. Its acceptance conditions add at least one of: observable outcomes, relevant input conditions, boundary cases, preservation guarantees, failure behavior. An FR that only repeats the use case adds nothing and is not written.

### Status and approval

Two levels. Nothing else carries approval.

- **FR status** applies to the statement: `confirmed` or `proposed`.
  - `confirmed`: the response of a use case flow, or an owner decision, gives the statement.
  - `proposed`: the author proposes the statement. It needs `Why`.
- **Acceptance condition override**: `Status: proposed default`. It marks precision the author added that no flow or owner decision gives. It has its own `Source` and `Why`. An acceptance condition without the override has the status of the FR.
- **Fully approved** means: the statement is `confirmed` and every acceptance condition is confirmed. A confirmed statement with one proposed default is not fully approved.
- Only an explicit owner decision confirms a proposed statement or a proposed default.
  - A use case block that cites the FR confirms nothing.
  - Committing or merging the file confirms nothing.
- To confirm a proposed default under a confirmed statement, remove its `Status` line. Set its `Source` to the owner decision with its date. `Why` can stay. The condition then has the status `confirmed`.
- Under a proposed statement, a proposed default keeps its override, even when the owner approves it. Removing the override would give it the status `proposed`, not `confirmed`. The FR stays not fully approved until the statement is confirmed. Approving a condition apart from a proposed statement needs a separate convention decision.
- To confirm a proposed statement, set `Status` to `confirmed` and `Source` to the owner decision with its date.

Status and completeness are separate. Status says whether the behavior is approved. A `[BR-?]` or `[NFR-?]` marker says that a value is missing. A confirmed FR can cite a rule whose values are not set yet. The marker keeps the gap visible. It does not block the FR.

### Pending decisions

Pending is not a status.

- A behavior the owner has not decided between materially different outcomes stays open.
- When the FR covers the decided part, it lists the open part under `Not specified`. One line says what is left open. It does not copy the open question. The question stays in the use case (`Open questions`).
- No statement and no acceptance condition states or assumes an outcome for a `Not specified` item.
- When a whole response depends on the decision, no FR is written. The block keeps `FR-?` until the owner decides. There is no placeholder FR.
- A question found while writing an FR goes to the open questions of the use case.

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

**Verification is not validation.** FR verification asks: does the behavior meet the stated condition? Product validation asks: does the product meet the user's expectations and the goal of the version (`../../00-current-scope/`)? The same person can take part in both. The conclusions differ. An FR does not copy a validation scenario and does not name one.

### Interface

FRs follow the intent of `_STYLE.md` rule 11. An FR describes behavior the user can observe. It does not fix a design nobody approved.

- Allowed: "Shows the outline in the conversation." "Shows the current deck." "Lets the user confirm the outline." "Shows the reason a file was rejected."
- Not allowed: a label, a placement, a colour, an icon, a position, a layout or an interaction design nobody approved.
- Name a place by its zone from `_STYLE.md`: request area, conversation, deck canvas.
- Apply the swap test in `_STYLE.md`. Each hit of its interface check is rewritten, or kept with a stated reason. An ordinary word that describes confirmed behavior is a valid reason.

### IDs and files

- One FR per file: `FR-xxx.md` in this folder. `xxx` is three digits: `FR-001`, `FR-002`.
- The `id` in the frontmatter equals the file name.
- A new FR takes the ID after the highest ID in this folder and in the retired IDs below. Gaps stay.
- An ID never changes when the title or the wording changes. An ID is never reused.
- An ID is retired only when its behavior leaves the behavioral model or merges into another FR. Removing a flow from a version retires no FR. A retired ID is listed below with the date and, after a merge, the FR it merged into.
- A split keeps the ID on one part. The other part takes a new ID. The same change updates every `Reqs` that cites the ID.
- Acceptance condition IDs are `AC-1`, `AC-2` within one FR. They are never renumbered to close a gap.
- There is no FR index. The files of this folder are the list.

Retired FR IDs: none.

### Traceability and scope

Links go top-down only (`../../03-use-cases/_CRITERIA.md`, section 1).

- A use case block cites FRs in its `Reqs` field. One FR can serve many blocks. One block can cite many FRs.
- An FR names no use case, no step, no flow and no user segment.
- An FR has no version field. `../../00-current-scope/VERSIONS.md` lists no FR.
- **Scope.** An FR belongs to a version when a block in that version's flow set cites it. An FR that only unselected blocks cite is in no version. An FR changes no flow set.
- A citation is not an approval. A selected block can cite an FR with proposed defaults (section 1, Status and approval).
- To find the blocks that use an FR, search `Reqs` in `../../03-use-cases/` for its ID. There is no reverse field.
- An FR changes with the blocks it serves. A change to the meaning of an FR is checked against every block that cites it, in the same change. A change to a block `System` is checked against its FRs (`../../03-use-cases/_CRITERIA.md`, Requirements traceability).

## 2. Evidence

An FR makes no claim about another product, so it carries no evidence tag. The source of a behavior is the use case flow and its evidence. `Source` says whether the statement comes from a use case flow, an owner decision, or the author. A proposed default can name the research behind it in `Why`, in words.

## 3. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment, *CI* = checked across files. No tooling exists yet; until it does, Lint and CI rows are checked by review.

"Applies to": *Model* = every FR file. *Version* = only the FRs that a block in the flow set of the version cites. A version check gives a report. It is not a status of the FR.

| ID | Criterion | Prevents | Check | Applies to | Source |
|---|---|---|---|---|---|
| FRG-01 | The FR states one system behavior under a stated condition: what the system shows, keeps, changes, creates or refuses. It holds no user goal, journey, rule value, quality target, interface design, architecture, task, progress or version (section 1) | Requirements that restate journeys; values in two places; design or architecture chosen by accident | Review | Model | Project rule |
| FRG-02 | Granularity follows section 1: one coherent purpose; split by the four reasons; reuse for the same behavior; no second FR for a behavior an FR covers; no FR for a response a block takes whole from an included use case | Giant FRs; one FR per step by habit; the same behavior written twice with drift | Review | Model | Project rule |
| FRG-03 | The acceptance conditions add testable precision beyond the use case response: outcomes, inputs, boundaries, preservation or failure behavior | FRs that copy the use case and add no test | Review | Model | Project rule |
| FRG-04 | The file follows `_TEMPLATE.md`: frontmatter `id` and `title`, the `Requirement` fields in order (`Statement`, `Status`, `Source`, `Why` when needed, `Updated at`), at least one acceptance condition. An optional `Why` with no reason is removed, never left empty. `Not specified` and `Notes` are removed when empty. No field for version, priority, progress, evidence, use case or segment | Files nobody can compare or check; hidden scope or progress fields | Lint (fields, order) | Model | Project rule |
| FRG-05 | `Status` is `confirmed` or `proposed`. A proposed statement has `Why`. An acceptance condition overrides only with `Status: proposed default`, and then has `Source` and `Why`. No other status value exists | Approval states nobody defined; proposals that look approved | Lint (values, fields) | Model | Project rule |
| FRG-06 | A proposed statement or a proposed default changes to confirmed only by an explicit owner decision, recorded in `Source` with its date. A citation in `Reqs`, a commit or a merge confirms nothing | Defaults approved by accident | Review | Model | Project rule |
| FRG-07 | A `Not specified` item names a behavior left open in one line. No statement and no acceptance condition states or assumes an outcome for it. A response that depends whole on an open decision has no FR; its block keeps `FR-?` | Open questions turned into requirements without a decision; placeholder FRs | Review | Model | Project rule |
| FRG-08 | Each acceptance condition is a block `### AC-n · Name` with `Given`, `When`, `Then` and `Check`. `Check` is `deterministic` or `judged`. `Then` holds observable outcomes, one per bullet, without "if". No exact model wording, unless a confirmed requirement fixes it. No validation scenario is copied or named | Conditions nobody can test; tests tied to model wording; validation mixed with verification | Lint (fields, values) + Review | Model | Project rule |
| FRG-09 | The FR holds no rule value and no quality target. It cites `[BR-xxx]` and `[NFR-xxx]`, or `[BR-?: topic]` and `[NFR-?: topic]`. Example inputs in a condition are allowed. For each FR in the version, the version check reports every marker left and every cited ID that does not exist | The same value in many files; missing values hidden inside confirmed FRs | Lint (numbers, markers) + CI (IDs resolve) | Model (no values), Version (no markers, IDs resolve) | Project rule |
| FRG-10 | Text follows `_STYLE.md` rules 1 to 10 in `Statement` and `Then`. It follows the intent of rule 11: no unapproved label, placement, colour, icon, position or layout; places named by zone; the swap test applied; each hit of the interface check rewritten or kept with a stated reason | Requirements that fix a design nobody chose; responses with two meanings | Lint (banned words, interface words) + Review (swap test) | Model | Project rule |
| FRG-11 | The file name is `FR-xxx.md` with three digits, and equals the frontmatter `id`. IDs are unique. A new ID follows the highest existing or retired ID. A retired ID is listed in section 1 and never reused. IDs are not renumbered. Acceptance condition IDs are not renumbered | Two meanings for one ID; broken citations after an edit | Lint (name, format) + CI (unique, not retired) | Model | Project rule |
| FRG-12 | The FR names no use case, step, flow or segment. It has no version field. `VERSIONS.md` lists no FR. Every acceptance condition is needed by at least one block that cites the FR | Links pointing up; a second source of scope; scope widened through an acceptance condition | Lint (no `UC-`, `USR-`, flow IDs) + Review | Model | Project rule |
| FRG-13 | The version check lists each FR in the version that is not fully approved: a `proposed` statement or a `proposed default` condition. It also lists each `Not specified` item of those FRs | Proposed precision read as approved because a selected block cites it | CI (report) | Version | Project rule |
| FRG-14 | `Updated at` is the date of the last change to the file, as `dd-mm-yyyy`. Any edit sets it. Acceptance condition blocks have no date of their own | Files whose date is out of step with their text | Lint (format) + Review | Model | Project rule |

The use case side of these checks is in `../../03-use-cases/_CRITERIA.md`: `Reqs` values and completeness (Requirements traceability, UCG-03), markers and IDs that resolve (UCG-06), `Reqs: none` (Requirements traceability).

## 4. Illustrations (hypothetical)

IDs below are examples. They are not allocated.

**FRG-02: reuse for the same behavior.**

> Not met: one FR "keeps finished slides after a stop" for the first draft, and a second FR with the same meaning for a follow-up request.
> Met: one FR, "an interrupted request keeps each finished slide and never replaces a slide with an unfinished change". Every block where work can be stopped or fail cites it. A block that also reports the number of finished slides cites a second FR for that report.

**FRG-02 and FRG-07: same words, different meaning.**

> Not met: the FR "leaving for model setup keeps the request text and the attachments" is also cited for starting a new chat. What happens to unsent text at a new chat is an open question. The citation decides it.
> Met: the new chat FR lists "what happens to request text the user did not send" under `Not specified`.

**FRG-03: precision beyond the use case.**

> Not met: Statement "The system does not accept confirming an empty outline." One condition: "Then: the outline cannot be confirmed."
> Met: the same statement. Conditions: the outline stays unconfirmed; no error message is shown; an outline whose titles the user deleted counts as empty (`proposed default`).

**FRG-05 and FRG-06: a confirmed FR with a proposed default.**

> FR-000 · Status: confirmed · Source: use case flow. AC-3 has `Status: proposed default`, `Source: proposed`, `Why: makes "empty" testable; an outline with titles and no points can still be confirmed`. A selected block cites FR-000. FR-000 is not fully approved. The version check lists AC-3. After the owner decides, AC-3 loses its `Status` line and gets `Source: owner decision, 2026-10-20`.

**FRG-08: deterministic invariant and judged quality.**

> A follow-up request changes slide 3.
> AC-1 · Check: deterministic. Then: every slide other than slide 3 is the same as before the request.
> AC-2 · Check: judged. Then: slide 3 reflects the instruction.
> Not met: "Then: the closing message says that no other slide changed." A message of the system is no proof of preservation.

**FRG-09: a confirmed FR with an open rule value.**

> Met: Statement "The system rejects a file that breaks the attachment rules [BR-?: accepted file types, number and size of attachments]. It shows the reason on the attachment." Status: confirmed. The version check reports the marker until the rule exists. The FR is not blocked.

**FRG-10: behavior, not design.**

> Not met: "The Confirm button is disabled and grey while the outline is empty."
> Met: "The system does not accept confirming an empty outline."
