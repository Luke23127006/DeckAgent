# Gate: Non-functional Requirement

Template: `_TEMPLATE.md`. Style: `../../_STYLE.md`. Cited by: `../../03-use-cases/`, `../fr/`, `../../01-product-vision/`. Rule values: `../../05-business-rules/`. Versions: `docs/versions/`.

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
| A task, a priority, progress or a version | Not in an NFR. Versions: the scope file of that version under `docs/versions/` |
| A decision the owner has not made | The design backlog of the ideal spec, outside `docs/spec/`. No NFR, no target and no `Not specified` item restates it |

### When to write an NFR

A measurable quantity does not need an NFR by itself. An NFR is written only when all four hold:

1. A product commitment needs the quality, or a stated product risk justifies it.
2. The quality can be measured or checked.
3. It adds an independent product-level quality constraint. It does not only repeat the behavior or an acceptance condition of an FR.
4. Its target changes the quality of the product for the user. The user need not see it: a security, privacy, reliability or data-integrity constraint protects the user without being visible.

A quantity that fails the first test stays a detail of an FR, of UI design or of engineering work. A behavior with a security meaning, such as not showing a key, is an FR. An NFR is added only for a constraint beyond that behavior that passes all four tests.

A `[NFR-?: topic]` marker names a topic, not a decided target. It is replaced only by an NFR that covers its whole meaning (Single source of truth, below).

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
- **Target:** the value with its unit and bound, or the required property. `not set` while no target is decided.
- **Met when:** what counts as meeting the target, for example every run or a stated share of runs. `not set` while no target is decided.
- **Why:** with a `not set` target, one line naming what is missing.

Rules for measurements:

- **Complete definition.** A measurement is defined when `Conditions`, `Measure` and `Method` are clear enough to verify the requirement. `Target` and `Met when` can read `not set` while no target is decided.
- **A `not set` target is never a guessed number, a range or an "about".** It is never presented as a target the product promises, in this file or in a file that cites it.
- **Recording a gap.** `Conditions`, `Measure` and `Method` never read `not set`. A field that cannot be completed yet states what is known. What is missing and needs a product decision or technical evidence goes to the design backlog of the ideal spec, outside `docs/spec/`.
- **Measurement boundary.** Each measurement states in `Conditions` which of two boundaries it uses.
  - Product-controlled: it measures a part of the result that DeckAgent controls.
  - End-to-end: it measures the whole result the user experiences. This can include the time or behavior of the model provider.
- **Provider conditions.** For either boundary, `Conditions` name the provider-dependent conditions that can change the result. The result can be repeated, or compared across runs under those conditions. Provider time is never left out without saying so. An end-to-end target never presents the performance of a provider as an outcome DeckAgent guarantees on its own.
- **Properties.** A security, privacy or data-integrity requirement can be checked as a property, without a number. Example: a kind of data never appears in a stated place. No numeric target is added to such a requirement only to have a number.
- **No architecture.** A condition or a method names no engine, storage, framework or tool.

### Pending targets

- `Target` and `Met when` read `not set` while no target is decided. The `Why` line says what is missing, in one line.
- Whether and which target is set is a product decision. It is never filled in by the author.

### Verification is not evaluation

NFR verification asks: does the product meet the stated target under the stated conditions? Model evaluation in research asks how well a model performs, often to compare models. A threshold from that work becomes an NFR only through an owner decision (When to write an NFR, above).

### IDs and files

- One NFR per file: `NFR-xxx.md` in this folder. `xxx` is three digits: `NFR-001`, `NFR-002`.
- The `id` in the frontmatter equals the file name. The `title` is a short name for the quality.
- A new NFR takes the ID after the highest ID in this folder and in the retired IDs below. Gaps stay.
- An ID never changes when the title, the wording or a target changes. An ID is never reused or renumbered.
- An ID is retired only when its requirement leaves the ideal product or merges into another NFR. A retired ID is listed below with the date and, after a merge, the NFR it merged into.
- Measurement IDs are `M-1`, `M-2` within one NFR. They are never renumbered to close a gap.
- There is no NFR index. The files of this folder are the list.

Retired NFR IDs: none.

### Traceability and scope

Links go top-down only (`../../03-use-cases/_CRITERIA.md`, section 1).

- A use case interaction or behavior constraint, an FR or the vision cites an NFR as `[NFR-xxx]`.
- An NFR names no use case, step, flow, segment, FR or other NFR. It can cite a BR in `Conditions`. A BR cites nothing, so no cycle arises.
- An NFR has no version field. A version scope file lists an NFR only as a product-wide NFR of that version (below).
- **Scope.** An NFR belongs to a version when a block of a flow that the version scope file names cites it. It also belongs when an FR of that version cites it. It also belongs when that version lists it as a product-wide NFR (below). A citation in the vision gives no scope. An NFR selects no flow.
- **Product-wide NFR.** Applying to every part of the product is not the same as belonging to a version. The citation rule above still decides membership.
  - A product-wide NFR that no block or FR of a version cites belongs to that version only when the version lists it.
  - The list is the section "Quality requirements for the whole version" of that version in `docs/versions/<version>/SCOPE.md`. It holds NFR IDs only. It holds no target and no wording of an NFR.
  - A version lists an NFR only when no FR and no response of a flow it names states a behavior that the NFR constrains. A citation added only to give scope is not allowed.
  - An NFR that a block of a named flow or an FR of the version cites is not listed. Listing it again would be a second source of scope.
- To find what cites an NFR, search the spec files for its ID. There is no reverse field.

### Single source of truth

- A target lives in exactly one NFR. A use case, an FR or the vision never states it and never paraphrases it into a number. It cites the ID.
- **Replacing markers.** A marker is replaced by `[NFR-xxx]` only when the NFR covers the whole meaning of that marker. A similar topic is not enough. Coverage is partial: the marker stays, and a report names the part the NFR does not cover.
- **Changing a target** changes only the NFR. The same change searches the files that cite the NFR for text that relied on the old target.

## 2. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment, *CI* = checked across files. No tooling exists yet; until it does, Lint and CI rows are checked by review.

"Applies to": *Model* = every NFR file. *Version* = only the NFRs in the scope of the version being checked. A scope review gives a report. It is not a status of the NFR.

| ID | Criterion | Prevents | Check | Applies to | Source |
|---|---|---|---|---|---|
| NFG-01 | The NFR states one product-level quality under stated conditions. It can relate to an FR, but it adds its own constraint and never only repeats the FR's behavior or conditions. It holds no rule value, user goal, interface design, architecture, engineering metric, research threshold, task, progress or version (section 1) | Behavior or limits written twice; architecture chosen by accident; research numbers read as promises | Review | Model | Project rule |
| NFG-02 | The NFR passes the four tests in section 1 (When to write an NFR): a product commitment or risk; measurable or checkable; an independent quality constraint, not a repeat of an FR; a target that matters to the user, visible or not | NFRs written for every quality by habit; details turned into commitments | Review | Model | Project rule |
| NFG-03 | Granularity follows section 1: one quality attribute for one coherent part; several measurements allowed for the same quality; no duplicate | Giant NFRs; the same target in two files | Review | Model | Project rule |
| NFG-04 | The file follows `_TEMPLATE.md`: frontmatter `id` and `title`; the `Requirement` fields in order (`Quality attribute`, `Statement`, `Updated at`); at least one measurement block with `Conditions`, `Measure`, `Method`, `Target` and `Met when`. Only `Target` and `Met when` can read `not set`. An optional `Why` with no reason is removed. No field for status, source, version, priority, progress, research, use case, FR, segment or other NFR. No `Not specified` section | Files nobody can compare or check; hidden scope or progress fields; an approval trail nobody maintains | Lint (fields, order) | Model | Project rule |
| NFG-05 | The NFR records no decision history: no approval state, no owner-decision dates, no superseded wording. Git history keeps the changes. No guessed number, range or "about" stands in any field | An approval trail that reads as part of the quality; invented targets | Lint (no `Status:`, no `owner decision` in fields) | Model | Project rule |
| NFG-06 | A `not set` target carries a one-line `Why` naming what is missing. No measurement presents a `not set` target as a promise, and no statement or measurement assumes an outcome for what is not decided. A missing aspect that needs a decision or technical evidence goes to the design backlog of the ideal spec, outside `docs/spec/` | Open targets read as decided; gaps hidden in the file | Review | Model | Project rule |
| NFG-07 | Each measurement is completely defined: conditions with repeatable inputs, a stated measure and a method in words that can verify the requirement. The target has a unit and bound or is a required property, with a rule for when it is met, or both read `not set` while no target is decided. The measurement states its boundary, product-controlled or end-to-end, and the provider-dependent conditions. Provider time is never left out silently. A property check carries no artificial number. No tool or architecture is named | Requirements nobody can verify; provider delays left out silently, or promised as DeckAgent results; tools chosen by accident | Review | Model | Project rule |
| NFG-09 | A target lives in one NFR only. Use cases, FRs and the vision cite the ID and never restate the target. A marker is replaced only when the NFR covers its whole meaning. A marker the NFR covers in part stays, and a report names the gap. A changed target is checked against every file that cites the NFR | The same target in many files; targets changed in one place and not the others; markers cleared by a similar topic | Lint (numbers in citing files) + CI (IDs resolve) + Review (each marker replaced or reported) | Model | Project rule |
| NFG-11 | Text follows `_STYLE.md` rules 1 to 9 in `Statement`, `Conditions`, `Measure` and `Target`. No interface design (rule 10) | Requirements with two meanings; design fixed through a quality target | Lint (banned words) + Review | Model | Project rule |
| NFG-12 | The file name is `NFR-xxx.md` with three digits, and equals the frontmatter `id`. IDs are unique. A new ID follows the highest existing or retired ID. A retired ID is listed in section 1 and never reused. Neither NFR IDs nor measurement IDs are renumbered. The NFR names no use case, step, flow, segment, FR or other NFR, and has no version field | Two meanings for one ID; links pointing up; a second source of scope | Lint (name, format, no `UC-`, `USR-`, `FR-` or other `NFR-`) + CI (unique, not retired) | Model | Project rule |
| NFG-14 | `Updated at` is the date of the last change to the file, as `dd-mm-yyyy`. Any edit sets it. Measurement blocks have no date of their own | Files whose date is out of step with their text | Lint (format) + Review | Model | Project rule |

Gate IDs NFG-08, NFG-10 and NFG-13 were retired on 25-10-2026, when the approval and reporting machinery around `Status`, `Source` and `Not specified` left the specs. Their subjects live in NFG-05, NFG-06, NFG-07 and NFG-09 now. A retired gate ID is not reused.

A reviewer accepts an NFR file when the rows above hold. Each `not set` target is reported with its `Why` line, not as a decided target.

## 3. Illustrations (hypothetical)

IDs below are examples. They are not allocated. No target below is a decision.

**NFG-06 and NFG-07: a product-controlled measurement with a target not set.**

> NFR-000 · Quality attribute: performance · Statement: the user sees that the system started work soon after sending.
> M-1 · Conditions: a request with text only, on the user's computer. Boundary: product-controlled. The measurement covers the time until the system shows that it is working. It does not cover the reply of the model provider. Provider-dependent conditions: the response time of the provider.
> Measure: time from sending to that sign. Method: time repeated sends of the same request.
> Target: not set · Met when: not set · Why: no target is decided yet.

**NFG-07: a property, not a number.**

> Not met: "The key leaks in fewer than a stated share of sessions."
> Met: Measure: whether the key appears in a stated place. Target: it appears in none. Met when: no check finds it.

**NFG-02: not every measurable quantity is an NFR.**

> Not met: an NFR that fixes how much memory the system uses while it works. No product commitment or risk asks for it.
> Met: no NFR. The team tracks it as engineering work, outside the specs.
