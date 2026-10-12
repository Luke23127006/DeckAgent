# Gate: Business Rule

Template: `_TEMPLATE.md`. Style: `../_STYLE.md`. Cited by: `../03-use-cases/`, `../04-requirements/fr/`, `../04-requirements/nfr/`, `../01-product-vision/`. Versions: `../00-current-scope/`.

## 1. What a business rule is, and is not

**A business rule (BR) defines the values that product behavior depends on.** A value is an allowed set, a limit, a threshold, a quota, a duration, a retention period, or a defined list of what counts. The behavior that applies a value is an FR. The BR says what the value is.

> FR: "The system rejects an attachment that breaks the attachment rule [BR-xxx]."
> BR-xxx: the accepted file types, the number of attachments and their size.

| If the content is... | Then it belongs to |
|---|---|
| What the system shows, keeps, changes, creates or refuses, and when | `../04-requirements/fr/`. The FR cites this BR |
| A rule with no value of its own, such as "the user cannot start a new chat while a request is active" | `../04-requirements/fr/` |
| A judgment of the model with no value that can be written down | `../04-requirements/fr/`, with judged conditions |
| A wait time, or a target for reliability, security, privacy or accessibility | `../04-requirements/nfr/` |
| A user goal, a journey, a step, the user's intent | `../03-use-cases/` |
| How the system keeps or checks a value: code, storage, configuration | An ADR or architecture work |
| How the product looks or how the user operates it | UI design work (no folder yet) |
| A task, a priority, progress or a version | Not in a BR. Versions: the `versions` field of each use case |
| Where an idea came from | The use case and its research card |

A `[BR-?: topic]` marker names a topic, not a decision. Writing the rule can show that the topic holds no value of its own. A marker is replaced only by a BR that covers its whole meaning. Otherwise it is changed or removed only by an owner decision (Single source of truth, below).

### Granularity

- **One BR** is one coherent rule. Its values govern one decision and change for related reasons.
- **Several values** can share one BR. Example: accepted file types, the number of attachments and their size form one attachment rule. Do not split a coherent rule only because it has several values.
- **Split** a BR when its values govern unrelated behaviors, or when they change for unrelated reasons.
- **Do not join** unrelated rules to have fewer files.
- **No duplicate.** Before writing a BR, search the statements and values in this folder. A value that a BR defines is never defined a second time.

### Values

- Each value is a block `### V-n · Name` with the field `Value`, and `Status`, `Source` and `Why` when needed (Status and approval, below).
- A value is exact:
  - A number has a unit.
  - A bound says whether it includes the limit, for example "at most" or "fewer than".
  - A list says whether it is closed or open.
  - An item gets an example only when readers can otherwise apply it in materially different ways.
- A value is precise enough for an FR condition to test inputs at the value and beyond it.
- A value holds no behavior. What the system does at the limit is written in the FR.

### Status and approval

Two levels, as in `../04-requirements/fr/_CRITERIA.md`. Nothing else carries approval.

- **Rule status** applies to the statement: `confirmed` or `proposed`.
  - `confirmed`: the rule traces to confirmed product behavior or to an explicit owner decision (Sources and confirmation, below).
  - `proposed`: the author proposes the rule. It needs `Why`.
- **Value status**: `confirmed`, `proposed` or `pending`.
  - A value with no `Status` line has the status and the source of the rule. It adds its own `Source` when another decision set it.
  - `proposed`: the author proposes the value. `Source: proposed`. `Why` gives the reason and the trade-off.
  - `pending`: no value is set yet. `Value` reads `not set`. `Source: owner decision needed`. `Why` names the decision or the evidence that is missing.
- A pending value is never a guessed number, a range or an "about". It is never presented as an approved limit, in this file or in a file that cites it.
- A value can be confirmed only under a confirmed rule. Under a proposed rule, every value is `proposed` or `pending`.
- **Fully decided** means: the rule is confirmed and every value is confirmed. A BR with a proposed or a pending value is not fully decided, and no report calls it decided.
- Only an explicit owner decision turns a proposed rule, or a proposed or pending value, into a confirmed one. A citation, a commit, a merge or an implementation confirms nothing.
- To confirm a value: set `Value`, remove its `Status` line, and set `Source` to the owner decision with its date. `Why` can stay.
- To confirm a proposed rule: set `Status` to `confirmed` and `Source` to the owner decision with its date.

Status and completeness are separate. A confirmed rule can hold pending values. The version check lists them (BRG-13). They do not block the FRs that cite the rule.

### Sources and confirmation

A confirmed rule or value traces to confirmed product behavior or to an explicit owner decision.

- **Confirmed product behavior** is a response of a use case flow that a version selects, or an owner decision recorded in a use case note or in the vision. A response or a note that the use case marks as a proposal, or as an open question, is not confirmed behavior.
- **A rule** is confirmed when such a source states the rule. `Source: use case flow` or `Source: owner decision, yyyy-mm-dd: <what was decided>`.
- **A value** is confirmed only when such a source states the value itself. A `[BR-?: topic]` marker in a confirmed flow shows that a rule is needed. It confirms no value of that rule.
- **Not a source of confirmation:** a citation in another file, a draft, a proposed item, an alternative under an open question, a research card or a reference product.
- Confirmed behavior is traced as it is. It needs no new owner decision for each BR file.

### Pending decisions

- A value whose decision is open is a pending value. It is not a `Not specified` item.
- `Not specified` lists an aspect of the rule that is left open and is not one of its values. An example is whether a limit counts per request or per chat. One line each, ending "Pending owner decision." The question stays in the use case (`Open questions`).
- No statement and no value states or assumes an outcome for a `Not specified` item.

### IDs and files

- One BR per file: `BR-xxx.md` in this folder. `xxx` is three digits: `BR-001`, `BR-002`.
- The `id` in the frontmatter equals the file name. The `title` is a short name for the rule.
- A new BR takes the ID after the highest ID in this folder and in the retired IDs below. Gaps stay.
- An ID never changes when the title, the wording or a value changes. An ID is never reused or renumbered.
- An ID is retired only when its rule leaves the behavioral model or merges into another BR. A retired ID is listed below with the date and, after a merge, the BR it merged into.
- Value IDs are `V-1`, `V-2` within one BR. They are never renumbered to close a gap.
- There is no BR index. The files of this folder are the list.

Retired BR IDs:

- BR-007, retired on 12-10-2026. It set the number of provider configurations the user can keep saved at one time. The owner decision of 2026-10-12 removed the limit of one and set no other value. The rule has no value to define any more.

### Traceability and scope

Links go top-down only (`../03-use-cases/_CRITERIA.md`, section 1).

- A use case block (`System` or `When`), an FR, an NFR or the vision cites a BR as `[BR-xxx]`.
- A BR names no use case, step, flow, segment, FR or NFR. It cites no other BR.
- A BR has no version field. `../00-current-scope/VERSIONS.md` lists no BR.
- **Scope.** A BR belongs to a version when a block in that version's flow set cites it. It also belongs when an FR or an NFR of that version cites it. A citation in the vision gives no scope. A BR changes no flow set.
- To find what cites a BR, search the spec files for its ID. There is no reverse field.

### Single source of truth

- A value lives in exactly one BR. Other spec files never state it, never paraphrase it into a number and never list its allowed items. They cite the ID.
- **Replacing markers.** A marker is replaced by `[BR-xxx]` only when the BR covers the whole meaning of that marker. A similar topic is not enough. For each marker in use cases, FRs, NFRs and the vision:
  1. Read the block or the file, and the behavior around the marker.
  2. Check that the BR covers the same obligation.
  3. Coverage is complete: replace the marker in the same change. The changed block or file gets the date of the change.
  4. Coverage is partial: the marker stays as it is. The report names the part the BR does not cover.
- A marker is never removed without a BR that covers it whole, or an owner decision. A marker whose topic leads to no BR, or to a different rule, is changed only by an owner decision.
- **Changing a value** changes only the BR. The same change searches the files that cite the BR for text that relied on the old value, and reports each one. A change to a confirmed value needs an owner decision in `Source`.

## 2. Evidence

A BR makes no claim about another product, so it carries no evidence tag. `Source` says whether the rule or a value comes from a use case flow, an owner decision or the author. A proposed value can name the research behind it in `Why`, in words.

## 3. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment, *CI* = checked across files. No tooling exists yet; until it does, Lint and CI rows are checked by review.

"Applies to": *Model* = every BR file. *Version* = only the BRs in the scope of the version being checked. A version check gives a report. It is not a status of the BR.

| ID | Criterion | Prevents | Check | Applies to | Source |
|---|---|---|---|---|---|
| BRG-01 | The BR defines the values of one rule that product behavior depends on. It holds no behavior, user goal, journey, quality target, interface design, architecture, task, progress or version (section 1) | Behavior written twice; values hidden in behavior; design or architecture chosen by accident | Review | Model | Project rule |
| BRG-02 | Granularity follows section 1: one coherent rule; several related values allowed; split for unrelated behaviors or reasons; no unrelated rules joined; no value defined twice | Giant rule files; one file per value by habit; the same value in two places | Review | Model | Project rule |
| BRG-03 | Each value is exact: a number has a unit; a bound is inclusive or exclusive; a list is closed or open. An item has an example when readers can otherwise apply it in materially different ways. An FR can test it at and beyond the value | Values two readers apply differently; limits nobody can test | Review | Model | Project rule |
| BRG-04 | The file follows `_TEMPLATE.md`: frontmatter `id` and `title`; the `Rule` fields in order (`Statement`, `Status`, `Source`, `Why` when needed, `Updated at`); at least one value block. An optional `Why` with no reason is removed. `Not specified` and `Notes` are removed when empty. No field for version, priority, progress, evidence, use case, FR or segment | Files nobody can compare or check; hidden scope or progress fields | Lint (fields, order) | Model | Project rule |
| BRG-05 | Rule `Status` is `confirmed` or `proposed`. A value overrides only with `Status: proposed` or `Status: pending`, and then has `Source` and `Why`. A proposed rule has `Why`. No value is `confirmed` under a proposed rule | Approval states nobody defined; values that look approved under a rule that is not | Lint (values, fields) | Model | Project rule |
| BRG-06 | A confirmed rule or value traces to confirmed product behavior or to an explicit owner decision (section 1, Sources and confirmation). A marker confirms no value. A proposed rule or value, or a pending value, becomes confirmed only by an explicit owner decision, recorded in `Source` with its date. A citation, a commit, a merge or an implementation confirms nothing | Limits approved by accident; values read into a marker | Review | Model | Project rule |
| BRG-07 | A pending value reads `not set`, and its `Why` names what is missing. No guessed number, range or "about". No file presents it as an approved limit | Invented limits; open values read as decided | Lint (`not set` with `pending`) + Review | Model | Project rule |
| BRG-08 | A `Not specified` item names an open aspect that is not a value, in one line ending "Pending owner decision." No statement and no value assumes an outcome for it | Open questions turned into rules without a decision | Review | Model | Project rule |
| BRG-09 | A value lives in one BR only. Use cases, FRs, NFRs and the vision cite the ID and never restate the value. A marker is replaced only when the BR covers its whole meaning. A marker the BR covers in part stays, and the report names the gap. A changed value is checked against every file that cites the BR | The same value in many files; values changed in one place and not the others; markers cleared by a similar topic | Lint (numbers in citing files) + CI (IDs resolve) + Review (each marker replaced or reported) | Model | Project rule |
| BRG-10 | Text follows `_STYLE.md` rules 1 to 10 in `Statement` and `Value`. No interface design (rule 11) | Rules with two meanings; design fixed through a rule | Lint (banned words) + Review | Model | Project rule |
| BRG-11 | The file name is `BR-xxx.md` with three digits, and equals the frontmatter `id`. IDs are unique. A new ID follows the highest existing or retired ID. A retired ID is listed in section 1 and never reused. Neither BR IDs nor value IDs are renumbered | Two meanings for one ID; broken citations | Lint (name, format) + CI (unique, not retired) | Model | Project rule |
| BRG-12 | The BR names no use case, step, flow, segment, FR, NFR or other BR. It has no version field. `VERSIONS.md` lists no BR | Links pointing up; a second source of scope | Lint (no `UC-`, `USR-`, `FR-`, `NFR-`, `BR-` other than its own `id`) + Review | Model | Project rule |
| BRG-13 | The version check lists each BR in the version that is not fully decided: a proposed rule, a proposed value or a pending value. It also lists each `Not specified` item of those BRs | Open or proposed limits read as approved because a selected block cites them | CI (report) | Version | Project rule |
| BRG-14 | `Updated at` is the date of the last change to the file, as `dd-mm-yyyy`. Any edit sets it. Value blocks have no date of their own | Files whose date is out of step with their text | Lint (format) + Review | Model | Project rule |

A reviewer accepts a BR file when BRG-01 to BRG-12 and BRG-14 hold. Each value that is not confirmed is listed in the review report.

## 4. Illustrations (hypothetical)

IDs below are examples. They are not allocated. No value below is a decision.

**BRG-05 and BRG-07: one rule, values with different statuses.**

> BR-000 · Status: confirmed · Source: owner decision: attachments are accepted in a limited set of formats.
> V-1 · Accepted file types · Status: pending · Value: not set · Why: the owner has not chosen the formats.
> V-2 · Number of attachments · Status: proposed · Value: a number with its bound · Why: the reason and the trade-off.
> BR-000 is not fully decided. The version check lists V-1 and V-2.

**BRG-01: a judgment is not a value.**

> Not met: a BR "the system asks when the request leaves the purpose unclear". That is behavior with a judgment. It is an FR.
> Met: the owner decides that a list of kinds of missing information exists. A BR then lists those kinds. A kind that readers can take in different ways gets an example.

**BRG-09: one place for a value.**

> Not met: a use case says "The system rejects a file over the size limit, a few megabytes [BR-000]."
> Met: "The system rejects a file over the size limit [BR-000]." The size is in BR-000 only.
