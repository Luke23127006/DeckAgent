# Gate: Functional requirement

Template: `_TEMPLATE.md`. Style: `../../_STYLE.md`. Cited by: `../../02-use-cases/` (the FR column). Rule values: `../../04-business-rules/`. Quality targets: `../nfr/`.

## 1. What an FR is, and is not

**An FR is a testable statement of a system behavior under a stated condition.** It says what the system **shows, keeps, changes, creates, or rejects**. A **use case response** says **what the user observes in a journey**; an **FR adds the precision a test needs**: which input, which result, which edge case, what stays unchanged.

| If the content is... | Then it belongs |
|---|---|
| A goal, journey, step order, or user intent | `../../02-use-cases/`. The use case cites the FR in its FR column |
| A limit, threshold, quota, allow-list, retention time | `../../04-business-rules/`. The FR cites `[BR-xxx]`, or `[BR-?: topic]` until the rule exists |
| A wait time, size target, availability | `../nfr/`. The FR cites `[NFR-xxx]`, or `[NFR-?: topic]` |
| How the user operates it or what it looks like | UI design work (no folder yet) |
| How the system achieves a behavior (model, queue, storage, API) | ADR or architecture work |
| What to build, or how far it is built/tested | Not in the spec. An FR has no progress, priority, or version |

A **rule with no value stays in the FR**, e.g. "the user cannot start a new session while a request is running". A **rule with a value goes to** `../../04-business-rules/`.

### Granularity and reuse

- **One FR** has **one cohesive purpose**; its results **belong together** and **change for the same reason**.
- **Split** an FR when: results can **fail independently** under meaningfully different conditions; **another block needs only part of it**; it **bundles unrelated responsibilities**.
- **Reuse** an FR when another block needs the **same behavior**: the **same kind of condition**, the **same expected result**.
- **Same words is not same behavior.** **Reuse only when the meaning is the same**.
- **No duplicate FRs.** Before writing, **search the folder** for existing statements.
- **Precision.** An FR may mention the **core behavior**; an **acceptance criterion**, written by the **testing work** that takes the FR, **outside the spec**, **adds at least one of**: an observable result, a relevant input condition, an edge case, a guarantee that holds, error behavior. An FR that **only repeats the use case is not written**.

### IDs and files

- **One FR per file**: `FR-xxx.md`. `xxx` is **three digits**. The frontmatter `id` **equals the file name**.
- A **new ID is the next free ID** below. A number below it with no file, in this folder or in `../../05-backlog/`, is **not used**.
- An ID **does not change** when the title or wording changes, and is **not reused**.
- An ID is **dropped only** when the behavior **leaves the behavior model** or is **merged into another FR**. Its **file is deleted**; its **number is not used again**.
- A behavior **left for later is parked** in `../../05-backlog/`, **not dropped**.
- **Acceptance criterion IDs** are `AC-1`, `AC-2` **within one FR**, **not renumbered**. A **later build** that takes the same FR **continues its numbering**.

**Next free FR ID: FR-144**.

### Links

**Links are top-down only**. A **use case cites the FR** in the **FR column of its Steps table**. **One FR can serve several blocks**; **one block can cite several FRs**.

- An FR **does not name a use case**, step, or branch.
- To **find the blocks that use an FR**, **search for its ID** in `../../02-use-cases/`.
- An FR **changes with the blocks it serves**. A **meaning change** to an FR is **checked against every block that cites it**, **in the same change**.

## 2. Criteria

"Check" is the **intended layer**: *Lint* = machine-checkable, *Review* = human judgment, *CI* = cross-check. There is **no tool yet**, so **review does both Lint and CI**.

| ID | Criterion | Prevents | Check |
|---|---|---|---|
| FRG-01 | The FR states one system behavior under a stated condition. No goal, journey, rule values, quality targets, interface, architecture, progress, or version | A requirement restating the journey; a value in two places | Review |
| FRG-02 | Granularity per section 1: one cohesive purpose; split by reason; reuse for the same behavior; no second FR for a behavior an FR already covers | A giant FR; one FR per step out of habit; the same behavior written twice | Review |
| FRG-03 | An acceptance criterion (written by the testing work that takes the FR) adds testable precision beyond the use case response: result, input, edge, invariant, error behavior | An FR that only copies the use case, adding no test | Review |
| FRG-04 | The file follows `_TEMPLATE.md`: frontmatter `id` and `title`; the Requirement fields in order; no acceptance criterion (the testing work that takes the FR writes them). An empty `Why` drops its line. `Undecided` and `Notes` are omitted when empty. No version, priority, progress, evidence, or use case field | A file that cannot be compared or checked | Lint (fields, order) |
| FRG-05 | The FR contains no rule values or quality targets. It cites `[BR-xxx]`/`[NFR-xxx]`, or the `?` marker. Example input in a criterion is allowed | The same value in several files | Lint (numbers, markers) + CI (ID exists) |
| FRG-06 | The `Undecided` section states open behavior one line each. No statement and no criterion assumes a result for it. A response that fully depends on an open decision does not get an FR; the block keeps `FR-?` | An open question becoming a requirement before it is decided | Review |
| FRG-07 | Each criterion is a `### AC-n · name` block with Given, When, Then, Check. `Check` is `deterministic` or `evaluation`. `Then` is an observable result, one line per thing, no "if". It does not pin the exact model wording | An untestable criterion; a test tied to model wording | Lint (fields, values) + Review |
| FRG-08 | Text follows `../../_STYLE.md` rules 1–10 in Statement and Then, and the intent of rule 11: no label, position, color, or unapproved icon; name a place by region | A requirement that locks a design nobody chose | Lint (banned words, interface words) + Review |
| FRG-09 | The file name `FR-xxx.md` is three digits, equal to the frontmatter `id`. The ID is unique. A new ID is the next free ID of section 1; a dropped ID is not reused | Two meanings for one ID | Lint (name, format) + CI (unique) |

## 3. Illustrations

**FRG-02: reuse for the same behavior.**

> Fail: one FR "keep progress after stopping" for the first listen, and a second FR with the same meaning for a later listen.
> Pass: one FR "when interrupted, the saved progress is kept and not overwritten by unfinished progress". Every block that can be stopped cites it.

**FRG-08: behavior, not design.**

> Fail: "The Play button is greyed out when there is no audio."
> Pass: "The system does not accept a playback request when there is no audio."
