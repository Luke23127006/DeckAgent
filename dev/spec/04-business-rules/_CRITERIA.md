# Gate: Business rule

Template: `_TEMPLATE.md`. Style: `../_STYLE.md`. Cited by: `../02-use-cases/`,
`../03-requirements/fr/`, `../03-requirements/nfr/`, `../01-product-vision/`.

## 1. What a BR is, and is not

**A BR defines a value that product behavior depends on.** The value is an allow-set,
limit, threshold, quota, retention time, or list that defines "what counts". The behavior
that applies the value is an FR. The BR says what the value is.

> FR: "The system rejects a link that does not match the source rule [BR-xxx]."
> BR-xxx: the accepted sources, and the link form of each source.

| If the content is... | Then it belongs |
|---|---|
| What the system shows, keeps, changes, creates, or rejects, and when | `../03-requirements/fr/`. The FR cites this BR |
| A rule with no value of its own, like "cannot start a new session while listening" | `../03-requirements/fr/` |
| A model judgment with no writable value | `../03-requirements/fr/`, with an evaluation criterion |
| A wait time, reliability, security, privacy, or accessibility target | `../03-requirements/nfr/` |
| A goal, journey, step, or user intent | `../02-use-cases/` |
| How the system keeps or checks a value: code, storage, config | ADR or architecture work |
| What the product looks like or how the user operates it | UI design work (no folder yet) |

The marker `[BR-?: topic]` names a topic, not a decision. Writing the rule may show the
topic has no value of its own. The marker is replaced by a BR only when it fully covers
the meaning; on partial coverage the marker stays and the missing part is reported.

### Granularity and values

- **One BR** is one cohesive rule. Its values govern one decision and change for related reasons.
- **Several values** can share one BR. Do not split a cohesive rule just because it has several values; do not merge unrelated rules to save files.
- **No duplicate.** Before writing, search the folder for existing statements and values.

Each value is a `### V-n · name` block with a Value field. Exact value: a number with
unit; a bound saying inclusive or unbounded; a list saying closed or open. The value is
precise enough for an FR criterion to test at and past the value. A value holds no
behavior — what the system does at a limit is written in the FR.

### IDs and files

- One BR per file: `BR-xxx.md`. `xxx` is three digits. The `id` equals the file name.
- A new ID follows the highest existing, parked (`../05-backlog/`) or removed ID. An ID does not change when the title, wording, or value changes; it is not reused and not renumbered.
- An ID is dropped only when the rule leaves the behavior model or is merged into another BR. A dropped ID is recorded below with the date and the BR it merged into.
- A rule left for later is parked in `../05-backlog/`, not dropped.
- Value IDs are `V-1`, `V-2` within one BR, not renumbered.

Removed BR IDs:

- BR-009, 05-11-2026, dropped: no permission presets and no approval that lasts; the reach of the agent is fixed by code (FR-077) and an approval covers one step once (FR-076).
- BR-010, 05-11-2026, dropped: the warning threshold only told the user when to compact; the system now summarizes by itself (FR-079) and the user has no compact command.

### Links

Links are top-down only. A use case (System or When), an FR, an NFR, or the vision cites
a BR with `[BR-xxx]`.

- A BR does not name a use case, step, branch, FR, or NFR. It does not cite another BR.
- To find what cites a BR, search for its ID in the spec files.

### One source of truth

A value lives in exactly one BR. Other spec files never state it, interpret it into a
number, or list the allowed items; they cite the ID. Changing a value changes only the BR;
in the same change, find the files that cite the BR for text that relied on the old value,
and report each one.

## 2. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment,
*CI* = cross-check. There is no tool yet, so review does both Lint and CI.

| ID | Criterion | Prevents | Check |
|---|---|---|---|
| BRG-01 | The BR defines the value of a rule that product behavior depends on. No behavior, goal, journey, quality target, interface, architecture, progress, or version | A behavior written twice; a value hidden in behavior | Review |
| BRG-02 | Granularity per section 1: one cohesive rule; related values allowed; split for unrelated behavior/reasons; no value defined twice | A giant rule file; the same value in two places | Review |
| BRG-03 | Each value is exact: a number with unit; a bound inclusive or not; a list closed or open. An FR can test at and past the value | A value two people apply two ways | Review |
| BRG-04 | The file follows `_TEMPLATE.md`: frontmatter `id` and `title`; the Rule fields in order; at least one value block. An empty `Why` drops its line. `Undecided` and `Notes` are omitted when empty | A file that cannot be compared or checked | Lint (fields, order) |
| BRG-05 | A pending value reads `not set`. No guessed number, range, or "about". No file presents it as an approved limit | A made-up limit; an open value read as decided | Lint (`not set`) + Review |
| BRG-06 | The `Undecided` section states an open aspect that is not a value, one line, ending "Pending decision.". An undecided value is `not set`, not an item here | An open question becoming a rule before it is decided | Review |
| BRG-07 | A value lives in one BR. Use case, FR, NFR, and vision cite the ID, not the value again. A marker is replaced only when the BR fully covers the meaning | The same value in several files; a marker erased by a similar topic | Lint (numbers in citing files) + CI (ID exists) + Review |
| BRG-08 | The file name `BR-xxx.md` is three digits, equal to the frontmatter `id`. The ID is unique and not renumbered. A dropped ID is recorded in section 1, not reused. The BR does not name a use case, step, branch, FR, NFR, or another BR | Two meanings for one ID; a link pointing up | Lint (name, format) + CI (unique) |
| BRG-09 | Text follows `../_STYLE.md` rules 1–10 in Statement and Value. No interface (rule 11) | A rule read two ways; a design locked via a rule | Lint (banned words) + Review |

## 3. Illustrations

**BRG-01: a judgment is not a value.**

> Fail: BR "the system asks when the source is unclear". That is behavior with a
> judgment, which is an FR.
> Pass: you decide there is a list of accepted source types. The BR lists those types.

**BRG-07: one place for a value.**

> Fail: a use case says "The system backs off a few seconds on interruption [BR-000]."
> Pass: "The system backs off by the back-off limit [BR-000]." The number lives in
> BR-000.
