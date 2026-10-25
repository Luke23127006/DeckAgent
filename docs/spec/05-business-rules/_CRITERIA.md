# Gate: Business Rule

Template: `_TEMPLATE.md`. Style: `../_STYLE.md`. Cited by: `../03-use-cases/`, `../04-requirements/fr/`, `../04-requirements/nfr/`, `../01-product-vision/`. Versions: `docs/versions/`.

## 1. What a business rule is, and is not

**A business rule (BR) defines the values that product behavior depends on.** A value is an allowed set, a limit, a threshold, a quota, a duration, a retention period, or a defined list of what counts. The behavior that applies a value is an FR. The BR says what the value is.

> FR: "The system rejects an attachment that breaks the attachment rule [BR-xxx]."
> BR-xxx: the accepted file types, the number of attachments and their size.

| If the content is... | Then it belongs to |
|---|---|
| What the system shows, keeps, changes, creates or refuses, and when | `../04-requirements/fr/`. The FR cites this BR |
| A rule with no value of its own, such as "the user cannot start a new chat while a request is active in that chat" | `../04-requirements/fr/` |
| A judgment of the model with no value that can be written down | `../04-requirements/fr/`, with judged conditions |
| A wait time, or a target for reliability, security, privacy or accessibility | `../04-requirements/nfr/` |
| A user goal, a journey, a step, the user's intent | `../03-use-cases/` |
| How the system keeps or checks a value: code, storage, configuration | An ADR or architecture work |
| How the product looks or how the user operates it | UI design work (no folder yet) |
| A task, a priority, progress or a version | Not in a BR. Versions: the scope file of that version under `docs/versions/` |
| A decision the owner has not made | The design backlog of the ideal spec, outside `docs/spec/`. No BR and no value block restates it with an invented outcome |

A `[BR-?: topic]` marker names a topic, not a decided value. Writing the rule can show that the topic holds no value of its own. A marker is replaced only by a BR that covers its whole meaning (Single source of truth, below).

### Granularity

- **One BR** is one coherent rule. Its values govern one decision and change for related reasons.
- **Several values** can share one BR. Example: accepted file types, the number of attachments and their size form one attachment rule. Do not split a coherent rule only because it has several values.
- **Split** a BR when its values govern unrelated behaviors, or when they change for unrelated reasons.
- **Do not join** unrelated rules to have fewer files.
- **No duplicate.** Before writing a BR, search the statements and values in this folder. A value that a BR defines is never defined a second time.

### Values

- Each value is a block `### V-n · Name` with the field `Value`, and a `Why` line when the value needs one.
- A value is exact:
  - A number has a unit.
  - A bound says whether it includes the limit, for example "at most" or "fewer than".
  - A list says whether it is closed or open.
  - An item gets an example only when readers can otherwise apply it in materially different ways.
- A value is precise enough for an FR condition to test inputs at the value and beyond it.
- A value holds no behavior. What the system does at the limit is written in the FR.
- A value that no decision has set yet reads `not set`, never a guessed number, a range or an "about", and carries a one-line `Why` naming what is missing.

### IDs and files

- One BR per file: `BR-xxx.md` in this folder. `xxx` is three digits: `BR-001`, `BR-002`.
- The `id` in the frontmatter equals the file name. The `title` is a short name for the rule.
- A new BR takes the ID after the highest ID in this folder and in the retired IDs below. Gaps stay.
- An ID never changes when the title, the wording or a value changes. An ID is never reused or renumbered.
- An ID is retired only when its rule leaves the ideal product or merges into another BR. A retired ID is listed below with the date and, after a merge, the BR it merged into.
- Value IDs are `V-1`, `V-2` within one BR. They are never renumbered to close a gap.
- There is no BR index. The files of this folder are the list.

Retired BR IDs:

- BR-007, retired on 12-10-2026. It set the number of provider configurations the user can keep saved at one time. The owner decision of 2026-10-12 removed the limit of one and set no other value. The rule has no value to define any more.

### Traceability and scope

Links go top-down only (`../03-use-cases/_CRITERIA.md`, section 1).

- A use case interaction or behavior constraint, an FR, an NFR or the vision cites a BR as `[BR-xxx]`.
- A BR names no use case, step, flow, segment, FR or NFR. It cites no other BR.
- A BR has no version field. A version scope file lists no BR.
- **Scope.** A BR belongs to a version when a block of a flow that the version scope file names cites it. It also belongs when an FR or an NFR of that version cites it. A citation in the vision gives no scope. A BR selects no flow.
- To find what cites a BR, search the spec files for its ID. There is no reverse field.

### Single source of truth

- A value lives in exactly one BR. Other spec files never state it, never paraphrase it into a number and never list its allowed items. They cite the ID.
- **Replacing markers.** A marker is replaced by `[BR-xxx]` only when the BR covers the whole meaning of that marker. A similar topic is not enough. Coverage is partial: the marker stays, and a report names the part the BR does not cover.
- **Changing a value** changes only the BR. The same change searches the files that cite the BR for text that relied on the old value.

## 2. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment, *CI* = checked across files. No tooling exists yet; until it does, Lint and CI rows are checked by review.

"Applies to": *Model* = every BR file. *Version* = only the BRs in the scope of the version being checked. A scope review gives a report. It is not a status of the BR.

| ID | Criterion | Prevents | Check | Applies to | Source |
|---|---|---|---|---|---|
| BRG-01 | The BR defines the values of one rule that product behavior depends on. It holds no behavior, user goal, journey, quality target, interface design, architecture, task, progress or version (section 1) | Behavior written twice; values hidden in behavior; design or architecture chosen by accident | Review | Model | Project rule |
| BRG-02 | Granularity follows section 1: one coherent rule; several related values allowed; split for unrelated behaviors or reasons; no unrelated rules joined; no value defined twice | Giant rule files; one file per value by habit; the same value in two places | Review | Model | Project rule |
| BRG-03 | Each value is exact: a number has a unit; a bound is inclusive or exclusive; a list is closed or open. An item has an example when readers can otherwise apply it in materially different ways. An FR can test it at and beyond the value | Values two readers apply differently; limits nobody can test | Review | Model | Project rule |
| BRG-04 | The file follows `_TEMPLATE.md`: frontmatter `id` and `title`; the `Rule` fields in order (`Statement`, `Updated at`); at least one value block. An optional `Why` with no reason is removed, never left empty. No field for status, source, version, priority, progress, research, use case, FR, NFR or segment. No `Not specified` section | Files nobody can compare or check; hidden scope or progress fields; an approval trail nobody maintains | Lint (fields, order) | Model | Project rule |
| BRG-05 | The BR records no decision history: no approval state, no owner-decision dates, no superseded wording. Git history keeps the changes. A value that no decision has set reads `not set` and never a guessed number, a range or an "about" | An approval trail that reads as part of the rule; invented limits | Lint (no `Status:`, no `owner decision` in fields) | Model | Project rule |
| BRG-06 | A `not set` value carries a one-line `Why` naming what is missing. No statement or value assumes an outcome for what is not decided, and no file presents a `not set` value as a limit the product applies. A missing aspect that needs a decision goes to the design backlog of the ideal spec, outside `docs/spec/` | Open values read as decided; gaps hidden in the file | Review | Model | Project rule |
| BRG-09 | A value lives in one BR only. Use cases, FRs, NFRs and the vision cite the ID and never restate the value. A marker is replaced only when the BR covers its whole meaning. A marker the BR covers in part stays, and a report names the gap. A changed value is checked against every file that cites the BR | The same value in many files; values changed in one place and not the others; markers cleared by a similar topic | Lint (numbers in citing files) + CI (IDs resolve) + Review (each marker replaced or reported) | Model | Project rule |
| BRG-10 | Text follows `_STYLE.md` rules 1 to 9 in `Statement` and `Value`. No interface design (rule 10) | Rules with two meanings; design fixed through a rule | Lint (banned words) + Review | Model | Project rule |
| BRG-11 | The file name is `BR-xxx.md` with three digits, and equals the frontmatter `id`. IDs are unique. A new ID follows the highest existing or retired ID. A retired ID is listed in section 1 and never reused. Neither BR IDs nor value IDs are renumbered | Two meanings for one ID; broken citations | Lint (name, format) + CI (unique, not retired) | Model | Project rule |
| BRG-12 | The BR names no use case, step, flow, segment, FR, NFR or other BR. It has no version field. A version scope file lists no BR | Links pointing up; a second source of scope | Lint (no `UC-`, `USR-`, `FR-`, `NFR-`, `BR-` other than its own `id`) + Review | Model | Project rule |
| BRG-14 | `Updated at` is the date of the last change to the file, as `dd-mm-yyyy`. Any edit sets it. Value blocks have no date of their own | Files whose date is out of step with their text | Lint (format) + Review | Model | Project rule |

Gate IDs BRG-07, BRG-08 and BRG-13 were retired on 25-10-2026, when the approval and reporting machinery around `Status`, `Source` and `Not specified` left the specs. Their subjects live in BRG-05 and BRG-06 now. A retired gate ID is not reused.

A reviewer accepts a BR file when the rows above hold. Each `not set` value is reported with its `Why` line, not as a limit in force.

## 3. Illustrations (hypothetical)

IDs below are examples. They are not allocated. No value below is a decision.

**BRG-03, BRG-05 and BRG-06: one rule, one value not set.**

> BR-000 · Statement: the rule sets which files the system accepts as attachments: their types, their number and their size.
> V-1 · Accepted file types · Value: closed list of formats.
> V-2 · Number of new attachments in one request · Value: not set · Why: no measurement has set a number.
> BR-000 is complete as a file. The scope review reports V-2 with its `Why` line, not as a limit in force.

**BRG-01: a judgment is not a value.**

> Not met: a BR "the system asks when the request leaves the purpose unclear". That is behavior with a judgment. It is an FR.
> Met: the owner decides that a list of kinds of missing information exists. A BR then lists those kinds. A kind that readers can take in different ways gets an example.

**BRG-09: one place for a value.**

> Not met: a use case says "The system rejects a file over the size limit, a few megabytes [BR-000]."
> Met: "The system rejects a file over the size limit [BR-000]." The size is in BR-000 only.
