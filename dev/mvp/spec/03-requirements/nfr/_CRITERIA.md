# Gate: Non-functional requirement

Template: `_TEMPLATE.md`. Style: `../../_STYLE.md`. Cited by: `../../02-use-cases/`,
`../fr/`, `../../01-product-vision/`. Rule values: `../../04-business-rules/`.

## 1. What an NFR is, and is not

**An NFR is a product-level quality constraint.** It says how fast, reliable, secure,
private, accurate, or accessible the product must be, under a stated condition. It is
verified by a measure against a target, or by a check of a required property.

### When to write an NFR

A measurable quantity does not need an NFR on its own. Write one only when all four hold:

1. A product commitment needs that quality, or a stated product risk justifies it.
2. The quality is measurable or checkable.
3. It adds an independent product-level quality constraint; it does not just repeat an FR's behavior or acceptance criterion.
4. The target changes product quality for the user. The user need not see it: security, privacy, and reliability constraints protect the user without being visible.

A quantity that fails the first test stays in an FR, the UI, or engineering work.
Behavior with security meaning (like not showing a key) is an FR. A model-output quality
target is an NFR only when you make it a product commitment.

### Where content belongs

| If the content is... | Then it belongs |
|---|---|
| What the system shows, keeps, changes, creates, or rejects, and when | `../fr/`. The FR cites this NFR |
| An allow-set, limit, quota, retention time a rule defines | `../../04-business-rules/` |
| A goal, journey, or user step | `../../02-use-cases/` |
| A metric the team uses to build/run code, not promised to the user | Not in the spec. Engineering work |
| A threshold used to compare/choose/tune a model during research | Not in the spec. Research work |
| How the system reaches a target: engine, storage, framework, tool | ADR or architecture work |
| What the product looks like or how the user operates it | UI design work (no folder yet) |

### Granularity and measures

- **One NFR** covers one quality attribute for one cohesive part of the product.
- **Several measures** can share one NFR when they check the same quality under different conditions.
- **Split** an NFR that bundles several quality attributes, or a product part that changes for unrelated reasons.
- **No duplicate.** Before writing, search the folder for existing statements.

Measures are written in the testing plan of the build that takes the NFR
(`dev/mvp/WORKFLOW.md` "Spec rules"), not in the NFR file. Each measure is a `### M-n · name` block with Condition, Measure, How to measure, Target,
Passes when. `Condition`, `Measure`, `How to measure` must be clear enough to verify;
`Target` and `Passes when` may be `not set` while pending. Do not guess a number, a
range, or "about" (NFG-04).

### IDs and files

- One NFR per file: `NFR-xxx.md`. `xxx` is three digits. The `id` equals the file name.
- A new ID follows the highest existing, parked (`../../05-backlog/`) or removed ID. An ID does not change when the title or target changes, is not reused, and is not renumbered.
- An ID is dropped only when the requirement leaves the behavior model or is merged into another NFR. A dropped ID is recorded below with the date and the NFR it merged into.
- A requirement left for later is parked in `../../05-backlog/`, not dropped.
- Measure IDs are `M-1`, `M-2` within one NFR, not renumbered.

Removed NFR IDs: none.

### Links

Links are top-down only. A use case (System or When), an FR, or the vision cites an NFR
with `[NFR-xxx]`.

- An NFR does not name a use case, step, branch, FR, or another NFR. It may cite a BR in a Condition.
- To find what cites an NFR, search for its ID in the spec files.

### One source of truth

A target lives in exactly one NFR. A use case, FR, or vision never states it or
interprets it into a number; they cite the ID. The marker `[NFR-?: topic]` is replaced by
`[NFR-xxx]` only when the NFR fully covers the marker's meaning; on partial coverage the
marker stays and the missing part is reported.

## 2. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment,
*CI* = cross-check. There is no tool yet, so review does both Lint and CI.

| ID | Criterion | Prevents | Check |
|---|---|---|---|
| NFG-01 | The NFR states one product-level quality under a stated condition. It adds its own constraint, not a repeat of an FR. No rule values, goal, journey, interface, architecture, engineering metric, progress, or version | A behavior or limit written twice | Review |
| NFG-02 | The NFR passes the four tests in section 1 | An NFR written for every quality out of habit | Review |
| NFG-03 | Granularity per section 1: one attribute for one cohesive part; several measures for the same quality; no duplicate | A giant NFR; the same target in two files | Review |
| NFG-04 | The file follows `_TEMPLATE.md`: frontmatter `id` and `title`; the Requirement fields in order; no measure (measures live in the testing plan of a build, where only `Target` and `Passes when` may be `not set`). An empty `Why` drops its line. `Undecided` and `Notes` are omitted when empty | A file that cannot be compared or checked | Lint (fields, order) |
| NFG-05 | Each measure is fully defined: a repeatable Condition, a Measure and How to measure sufficient to verify. The Target has a unit and bound or is a required property. The product-controlled or end-to-end boundary and provider-dependent conditions are stated; provider time is not silently hidden. No tool, no architecture | An unverifiable requirement; provider time promised as a product result | Review |
| NFG-06 | A pending target reads `not set` in Target and Passes when. No guessed number, range, or "about". No file presents it as an approved target | A made-up target; an open target read as decided | Lint (`not set`) + Review |
| NFG-07 | The `Undecided` section states an open aspect that is not a target, one line, ending "Pending decision." or "Pending technical evidence." for a definition lacking evidence. A missing target is `not set`, not an item here | An open question becoming a target before it is decided | Review |
| NFG-08 | The file name `NFR-xxx.md` is three digits, equal to the frontmatter `id`. The ID is unique and not renumbered. A dropped ID is recorded in section 1, not reused. The NFR does not name a use case, step, branch, FR, or another NFR | Two meanings for one ID; a link pointing up | Lint (name, format) + CI (unique) |
| NFG-09 | Text follows `../../_STYLE.md` rules 1–10 in Statement, Condition, Measure, and Target. No interface (rule 11) | A requirement read two ways; a design locked via a quality target | Lint (banned words) + Review |

## 3. Illustrations

**NFG-05: a product-controlled measure.**

> NFR-000 · Quality attribute: performance · Statement: the user sees the system start
> listening right after picking a chapter.
> M-1 · Condition: the chapter already has audio on the device, network stable. Boundary:
> product-controlled — measure only up to the system starting playback, not the provider
> time to generate new audio.
> Measure: time from picking a chapter to audio starting. How to measure: repeat picking
> the same chapter.

**NFG-02: not every quantity is an NFR.**

> Fail: an NFR fixing the system's runtime memory use. No product commitment or risk needs
> it.
> Pass: no NFR. The team tracks it as engineering work, outside the spec.
