# Gate: Non-functional Requirement

Template: `_TEMPLATE.md`. Style: `../../_STYLE.md`. Cited by: `../../03-use-cases/`, `../fr/`, `../../01-product-vision/`. Rule values: `../../05-business-rules/`. Versions: `../../00-current-scope/`.

## 1. What a non-functional requirement is, and is not

**A non-functional requirement (NFR) is a product-level quality constraint.** It says how quickly, reliably, securely, privately, accurately or accessibly the product must work, under stated conditions. It is verified by a measurement against a target, or by a check of a required property.

An NFR can relate to an FR, and to the same part of the product. It adds a quality constraint of its own, which the FR does not state, and it is verified apart from the FR. An NFR never only repeats the behavior or an acceptance condition of an FR.

| If the content is... | Then it belongs to |
|---|---|
| What the system shows, keeps, changes, creates or refuses, and when | `../fr/`. The FR cites this NFR |
| An allowed set, a limit, a quota, a duration or a retention period that a rule defines | `../../05-business-rules/` |
| A user goal, a journey, a step | `../../03-use-cases/` |
| A metric the team uses to build or run the code, with no promise to the user | Not in the specs. It is engineering work |
| A threshold used to compare, choose or tune models during research | Not in the specs. It is research work |
| How the system reaches a target: engine, storage, framework, tool | An ADR or architecture work |
| How the product looks or how the user operates it | UI design work (no folder yet) |
| A task, a priority, progress or a version | Not in an NFR. Versions: the `versions` field of each use case |

### When to write an NFR

A measurable quantity does not need an NFR by itself. An NFR is written only when all four hold:

1. A product commitment needs the quality, or a stated product risk justifies it.
2. The quality can be measured or checked.
3. It adds an independent product-level quality constraint. It does not only repeat the behavior or an acceptance condition of an FR.
4. Its target changes the quality of the product for the user. The user need not see it: a security, privacy, reliability or data-integrity constraint protects the user without being visible.

A quantity that fails the first test stays a detail of an FR, of UI design or of engineering work. A behavior with a security meaning, such as not showing a key, is an FR. An NFR is added only for a constraint beyond that behavior that passes all four tests.

A `[NFR-?: topic]` marker names a topic, not a decision. A marker is replaced only by an NFR that covers its whole meaning. Otherwise it is changed or removed only by an owner decision (Single source of truth, below).

A target for the quality of model output is an NFR only when the owner makes it a product commitment. The behaviors the model keeps, such as never inventing a fact, are FRs with judged conditions.

### Granularity

- **One NFR** covers one quality attribute for one coherent part of the product. Its measurements change for the same reason.
- **Several measurements** can share one NFR when they check the same quality under different conditions.
- **Split** an NFR that joins different quality attributes, or parts of the product that change for unrelated reasons.
- **No duplicate.** Before writing an NFR, search the statements in this folder.

### Measurements

Each measurement is a block `### M-n · Name` with these fields:

- **Conditions:** the state, the inputs and the environment under which the target holds, and the measurement boundary. Inputs are described well enough to repeat. Values of a rule are cited as `[BR-xxx]`.
- **Measure:** the quantity measured, or the property checked.
- **Method:** how it is measured or checked, in words. No tool is named.
- **Target:** the value with its unit and bound, or the required property. `not set` while pending.
- **Met when:** what counts as meeting the target, for example every run or a stated share of runs. `not set` while pending.
- **Status, Source, Why:** when needed (Status and approval, below).

Rules for measurements:

- **Complete definition.** A measurement is defined when `Conditions`, `Measure` and `Method` are clear enough to verify the requirement. `Target` and `Met when` can read `not set` while the target is pending.
- **Pending target versus incomplete definition.** A pending target is allowed: the requirement and its verification are clear, and only the value or property is not set. An incomplete definition is a documentation gap: `Conditions`, `Measure` or `Method` is not clear enough to verify the requirement. A pending target never excuses an incomplete definition.
- **Recording a gap.** `Conditions`, `Measure` and `Method` never read `not set`. A field that cannot be completed yet states what is known. A `Not specified` item names the gap. When the gap needs technical evidence, the item says so. No method, tool or architecture is invented to close it.
- **Measurement boundary.** Each measurement states in `Conditions` which of two boundaries it uses.
  - Product-controlled: it measures a part of the result that DeckAgent controls.
  - End-to-end: it measures the whole result the user experiences. This can include the time or behavior of the model provider.
- **Provider conditions.** For either boundary, `Conditions` name the provider-dependent conditions that can change the result. The result can be repeated, or compared across runs under those conditions. Provider time is never left out without saying so. An end-to-end target never presents the performance of a provider as an outcome DeckAgent guarantees on its own.
- **Boundary and target are decisions.** The author does not choose either alone. The boundary follows from the statement, so a boundary the author chooses makes the statement `proposed`. A target follows an owner decision, or stays `proposed` or `pending` (Status and approval, below).
- **Properties.** A security, privacy or data-integrity requirement can be checked as a property, without a number. Example: a kind of data never appears in a stated place. No numeric target is added to such a requirement only to have a number.
- **No architecture.** A condition or a method names no engine, storage, framework or tool.

### Status and approval

Two levels, as in `../fr/_CRITERIA.md`. Nothing else carries approval.

- **NFR status** applies to the statement: `confirmed` or `proposed`.
  - `confirmed`: the statement traces to confirmed product behavior or to an explicit owner decision (Sources and confirmation, below).
  - `proposed`: the author proposes the statement. It needs `Why`.
- **Target status** applies to `Target` and `Met when` of one measurement: `confirmed`, `proposed` or `pending`.
  - A measurement with no `Status` line has the status and the source of the NFR. It adds its own `Source` when another decision set its target.
  - `proposed`: the author proposes the target. `Source: proposed`. `Why` gives the reason and the trade-off.
  - `pending`: no target is set yet. `Target` and `Met when` read `not set`. `Source: owner decision needed` or `Source: evidence needed`. `Why` names what is missing.
- A pending target is never a guessed number, a range or an "about". It is never presented as an approved target, in this file or in a file that cites it.
- A target can be confirmed only under a confirmed statement. Under a proposed statement, every target is `proposed` or `pending`.
- **Fully decided** means: the statement is confirmed and every target is confirmed. An NFR with a proposed or a pending target is not fully decided, and no report calls it decided.
- Only an explicit owner decision turns a proposed statement, or a proposed or pending target, into a confirmed one. A citation, a commit, a merge or an implementation confirms nothing.
- To confirm a target: set `Target` and `Met when`, remove the `Status` line, and set `Source` to the owner decision with its date. `Why` can stay.
- To confirm a proposed statement: set `Status` to `confirmed` and `Source` to the owner decision with its date.

Status and completeness are separate. A confirmed statement can hold pending targets. The version check lists them (NFG-13).

### Sources and confirmation

A confirmed statement or target traces to confirmed product behavior or to an explicit owner decision.

- **Confirmed product behavior** is a response of a use case flow that a version selects, or an owner decision recorded in a use case note or in the vision. A response or a note that the use case marks as a proposal, or as an open question, is not confirmed behavior.
- **A statement** is confirmed when such a source states the quality the product must have. `Source: use case flow` or `Source: owner decision, yyyy-mm-dd: <what was decided>`.
- **A target** is confirmed only when such a source states the target itself. An `[NFR-?: topic]` marker in a confirmed flow shows that a quality requirement is needed. It confirms no target.
- **Not a source of confirmation:** a citation in another file, a draft, a proposed item, an alternative under an open question, a research threshold or a reference product.
- Confirmed behavior is traced as it is. It needs no new owner decision for each NFR file.

### Pending decisions

- A target whose decision is open is a pending target. It is not a `Not specified` item.
- `Not specified` lists an aspect of the requirement that is left open and is not a target. One line each, ending "Pending owner decision." A gap in a measurement definition that needs technical evidence ends "Pending technical evidence." The question stays in the use case (`Open questions`).
- No statement and no measurement states or assumes an outcome for a `Not specified` item.

### Verification is not evaluation

NFR verification asks: does the product meet the stated target under the stated conditions? Model evaluation in research asks how well a model performs, often to compare models. A threshold from that work becomes an NFR only through an owner decision (When to write an NFR, above).

### IDs and files

- One NFR per file: `NFR-xxx.md` in this folder. `xxx` is three digits: `NFR-001`, `NFR-002`.
- The `id` in the frontmatter equals the file name. The `title` is a short name for the quality.
- A new NFR takes the ID after the highest ID in this folder and in the retired IDs below. Gaps stay.
- An ID never changes when the title, the wording or a target changes. An ID is never reused or renumbered.
- An ID is retired only when its requirement leaves the behavioral model or merges into another NFR. A retired ID is listed below with the date and, after a merge, the NFR it merged into.
- Measurement IDs are `M-1`, `M-2` within one NFR. They are never renumbered to close a gap.
- There is no NFR index. The files of this folder are the list.

Retired NFR IDs: none.

### Traceability and scope

Links go top-down only (`../../03-use-cases/_CRITERIA.md`, section 1).

- A use case block (`System` or `When`), an FR or the vision cites an NFR as `[NFR-xxx]`.
- An NFR names no use case, step, flow, segment, FR or other NFR. It can cite a BR in `Conditions`. A BR cites nothing, so no cycle arises.
- An NFR has no version field. `../../00-current-scope/VERSIONS.md` lists no NFR.
- **Scope.** An NFR belongs to a version when a block in that version's flow set cites it. It also belongs when an FR of that version cites it. A citation in the vision gives no scope. An NFR changes no flow set.
- **Product-wide NFR.** Applying to every part of the product is not the same as belonging to a version. The citation rule above still decides membership.
  - An NFR that applies product-wide, and that no block or FR of a version cites, has an open scope question for that version. No convention settles it yet.
  - The question is resolved before the NFR is accepted into the baseline of that version. The review report lists it until then.
  - The question does not block other BR or NFR work.
- To find what cites an NFR, search the spec files for its ID. There is no reverse field.

### Single source of truth

- A target lives in exactly one NFR. A use case, an FR or the vision never states it and never paraphrases it into a number. It cites the ID.
- **Replacing markers.** A marker is replaced by `[NFR-xxx]` only when the NFR covers the whole meaning of that marker. A similar topic is not enough. For each marker in use cases, FRs and the vision:
  1. Read the block or the file, and the behavior around the marker.
  2. Check that the NFR covers the same obligation.
  3. Coverage is complete: replace the marker in the same change. The changed block or file gets the date of the change.
  4. Coverage is partial: the marker stays as it is. The report names the part the NFR does not cover.
- A marker is never removed without an NFR that covers it whole, or an owner decision. A marker whose topic leads to no NFR, or to a different requirement, is changed only by an owner decision.
- **Changing a target** changes only the NFR. The same change searches the files that cite the NFR for text that relied on the old target, and reports each one. A change to a confirmed target needs an owner decision in `Source`.

## 2. Evidence

An NFR makes no claim about another product, so it carries no evidence tag. `Source` says whether the statement or a target comes from a use case flow, an owner decision or the author. A proposed target can name the research or the measurement behind it in `Why`, in words.

## 3. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment, *CI* = checked across files. No tooling exists yet; until it does, Lint and CI rows are checked by review.

"Applies to": *Model* = every NFR file. *Version* = only the NFRs in the scope of the version being checked. A version check gives a report. It is not a status of the NFR.

| ID | Criterion | Prevents | Check | Applies to | Source |
|---|---|---|---|---|---|
| NFG-01 | The NFR states one product-level quality under stated conditions. It can relate to an FR, but it adds its own constraint and never only repeats the FR's behavior or conditions. It holds no rule value, user goal, interface design, architecture, engineering metric, research threshold, task, progress or version (section 1) | Behavior or limits written twice; architecture chosen by accident; research numbers read as promises | Review | Model | Project rule |
| NFG-02 | The NFR passes the four tests in section 1 (When to write an NFR): a product commitment or risk; measurable or checkable; an independent quality constraint, not a repeat of an FR; a target that matters to the user, visible or not | NFRs written for every quality by habit; details turned into commitments | Review | Model | Project rule |
| NFG-03 | Granularity follows section 1: one quality attribute for one coherent part; several measurements allowed for the same quality; no duplicate | Giant NFRs; the same target in two files | Review | Model | Project rule |
| NFG-04 | The file follows `_TEMPLATE.md`: frontmatter `id` and `title`; the `Requirement` fields in order (`Quality attribute`, `Statement`, `Status`, `Source`, `Why` when needed, `Updated at`); at least one measurement block with `Conditions`, `Measure`, `Method`, `Target` and `Met when`. Only `Target` and `Met when` can read `not set`. An optional `Why` with no reason is removed. `Not specified` and `Notes` are removed when empty. No field for version, priority, progress, evidence, use case, FR or segment | Files nobody can compare or check; hidden scope or progress fields | Lint (fields, order) | Model | Project rule |
| NFG-05 | `Status` is `confirmed` or `proposed`. A measurement overrides only with `Status: proposed` or `Status: pending`, and then has `Source` and `Why`. A proposed statement has `Why`. No target is `confirmed` under a proposed statement | Approval states nobody defined; targets that look approved under a statement that is not | Lint (values, fields) | Model | Project rule |
| NFG-06 | A confirmed statement or target traces to confirmed product behavior or to an explicit owner decision (section 1, Sources and confirmation). A marker confirms no target. A proposed statement or target, or a pending target, becomes confirmed only by an explicit owner decision, recorded in `Source` with its date. A citation, a commit, a merge or an implementation confirms nothing | Targets approved by accident; targets read into a marker | Review | Model | Project rule |
| NFG-07 | A pending target reads `not set` in `Target` and `Met when`, and its `Why` names what is missing. No guessed number, range or "about". No file presents it as an approved target. A pending target is not a gap in the measurement definition, and does not excuse one (NFG-08) | Invented targets; open targets read as decided | Lint (`not set` with `pending`) + Review | Model | Project rule |
| NFG-08 | Each measurement is completely defined: conditions with repeatable inputs, a stated measure and a method in words that can verify the requirement. The target has a unit and bound or is a required property, with a rule for when it is met, or both read `not set` while pending. The measurement states its boundary, product-controlled or end-to-end, and the provider-dependent conditions. Provider time is never left out silently. A property check carries no artificial number. No tool or architecture is named. A definition that is not complete is recorded in `Not specified` and is a documentation gap | Requirements nobody can verify; pending targets hiding missing methods; provider delays left out silently, or promised as DeckAgent results; tools chosen by accident | Review | Model | Project rule |
| NFG-09 | A `Not specified` item names an open aspect that is not a target, in one line. It ends "Pending owner decision." for an open product decision, or "Pending technical evidence." only for an incomplete measurement definition that cannot be finished without technical evidence. A missing target is a pending target (`not set`), not an item here. An item that ends "Pending technical evidence." marks a documentation gap (NFG-08, NFG-13). No statement and no measurement assumes an outcome for an item | Open questions turned into targets without a decision; incomplete definitions read as pending targets | Review | Model | Project rule |
| NFG-10 | A target lives in one NFR only. Use cases, FRs and the vision cite the ID and never restate the target. A marker is replaced only when the NFR covers its whole meaning. A marker the NFR covers in part stays, and the report names the gap. A changed target is checked against every file that cites the NFR | The same target in many files; targets changed in one place and not the others; markers cleared by a similar topic | Lint (numbers in citing files) + CI (IDs resolve) + Review (each marker replaced or reported) | Model | Project rule |
| NFG-11 | Text follows `_STYLE.md` rules 1 to 10 in `Statement`, `Conditions`, `Measure` and `Target`. No interface design (rule 11) | Requirements with two meanings; design fixed through a quality target | Lint (banned words) + Review | Model | Project rule |
| NFG-12 | The file name is `NFR-xxx.md` with three digits, and equals the frontmatter `id`. IDs are unique. A new ID follows the highest existing or retired ID. A retired ID is listed in section 1 and never reused. Neither NFR IDs nor measurement IDs are renumbered. The NFR names no use case, step, flow, segment, FR or other NFR, and has no version field | Two meanings for one ID; links pointing up; a second source of scope | Lint (name, format, no `UC-`, `USR-`, `FR-` or other `NFR-`) + CI (unique, not retired) | Model | Project rule |
| NFG-13 | The version check lists two groups apart. First, each NFR in the version that is not fully decided: a proposed statement, a proposed target or a pending target, with its `Not specified` items. Second, each NFR with an incomplete measurement definition. An NFR in the second group is not documentation-complete | Open or proposed targets read as approved because a selected block cites them; incomplete definitions hidden among pending targets | CI (report) | Version | Project rule |
| NFG-14 | `Updated at` is the date of the last change to the file, as `dd-mm-yyyy`. Any edit sets it. Measurement blocks have no date of their own | Files whose date is out of step with their text | Lint (format) + Review | Model | Project rule |

A reviewer accepts an NFR file when NFG-01 to NFG-12 and NFG-14 hold. Each target that is not confirmed is listed in the review report. A file with an incomplete measurement definition is reported as a documentation gap, not as complete.

## 4. Illustrations (hypothetical)

IDs below are examples. They are not allocated. No target below is a decision.

**NFG-07 and NFG-08: a product-controlled measurement with a pending target.**

> NFR-000 · Quality attribute: performance · Statement: the user sees that the system started work soon after sending.
> M-1 · Conditions: a request with text only, on the user's computer. Boundary: product-controlled. The target covers the time until the system shows that it is working. It does not cover the reply of the model provider.
> Measure: time from sending to that sign. Method: time repeated sends of the same request.
> Target: not set · Met when: not set · Status: pending · Source: evidence needed · Why: no target has been set yet.

**NFG-08: a property, not a number.**

> Not met: "The key leaks in fewer than a stated share of sessions."
> Met: Measure: whether the key appears in a stated place. Target: it appears in none. Met when: no check finds it.

**NFG-02: not every measurable quantity is an NFR.**

> Not met: an NFR that fixes how much memory the system uses while it works. No product commitment or risk asks for it.
> Met: no NFR. The team tracks it as engineering work, outside the specs.
