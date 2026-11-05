# Gate: Product vision

Template: `_TEMPLATE.md`. Style: `../_STYLE.md`. Children: `../02-use-cases/`,
`../03-requirements/`, `../04-business-rules/`.

## 1. What the vision is, and is not

**The vision defines what the product is, before any other spec file describes what it
does.** It answers five questions: (1) What is the product? (2) What problem does it
solve? (3) What main value does it give? (4) What principles guide choices? (5) What
boundaries belong to the product's nature?

**The vision is not a decision log, a feature list, or scope.** It keeps only what stays
true when scope, interface, or architecture changes (VG-01).

**The vision does not grow by inference.** Only you confirm a statement. Everything else
is a proposal or an open question (VG-13). A gap is written as a gap (VG-14).

### Where content belongs

| If the content is... | Then it belongs |
|---|---|
| What the product is, why it exists, value, principles, durable boundaries | Here |
| A capability the product provides | `../02-use-cases/`. Point here only when you say it is part of the product's nature |
| A step, a response, or a branch of a goal | `../02-use-cases/` |
| A testable statement of a system response | `../03-requirements/fr/` |
| A wait time, a size target, or another quality target | `../03-requirements/nfr/`. The vision cites `[NFR-?: topic]` |
| A limit, allow-list, file type, or other value a rule defines | `../04-business-rules/`. The vision cites `[BR-?: topic]` |
| How code achieves something: engine, storage, framework, protocol | decision record in `dev/mvp/decisions/` |
| How the product is operated or looks | UI design work (no folder yet) |
| Rules for writing spec files, or shared terminology | `../_STYLE.md` or `AGENTS.md` |
| A raw observation of another product | `dev/mvp/research/` |

### A boundary is not a scope limit

A boundary says what the product is NOT, by its nature. It holds in every release. A
scope limit says what a release leaves out. Only the former belongs here.

> Scope limit (not here): "V1 is web-only."
> Boundary (here): "The product does not generate story content; it only reads existing
> content."

Test: given infinite time, is the statement still true? If not, it is a scope limit.

### Confirmed, proposed, open

Each statement has one of two statuses.

| Status | Meaning | Lower spec may rely on it |
|---|---|---|
| `confirmed` | You have said it | Yes |
| `proposed` | AI suggests it, you have not decided | No |

An open question is a third state: not enough is known to decide.

### Link direction: top-down only

The vision is the top of the chain. A lower spec file never names a vision block. To
check a file against the vision, read the vision.

### One source of truth

A fact is written in exactly one block. Other blocks point to it by ID. A term or region
that `../_STYLE.md` defines is used here, not redefined (VG-06).

## 2. Sections, blocks, and IDs

| Section | Answers | Block ID | Fields |
|---|---|---|---|
| What the product is | Question 1 | `I-x` | Statement, Status, Source, Spec implications |
| Why it exists | Questions 2 and 3 | `W-x` | Statement, Status, Source, Evidence, Spec implications |
| Principles | Question 4 | `P-x` | Statement, Status, Source, Why, Spec implications |
| Boundaries | Question 5 | `B-x` | Statement, Status, Source, Why, Spec implications |
| Open questions | Any gap | `Q-x` | Question, Affects |
| Next free IDs | One line per kind | none | `I-x`, `W-x`, `P-x`, `B-x`, `Q-x` |

- `Status` is `confirmed` or `proposed`. Always present.
- `Source` appears only when `proposed` — says who proposed it and what it was inferred from.
- `Why` gives the reason, or drop the line. Do not invent a reason.
- `Spec implications` appears only on a `confirmed` block, and only what follows directly from the statement.
- IDs are never renumbered or reused. A removed block is deleted; its ID is not used again (VG-05).

## 3. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment,
*CI* = cross-check. There is no tool yet, so review does both Lint and CI.

| ID | Criterion | Prevents | Check |
|---|---|---|---|
| VG-01 | Each block says what the product is, why it exists, its value, a principle, or a durable boundary. It stays true when scope, interface, or architecture changes. A fact that only one feature or use case depends on belongs with that use case | The vision becoming a feature list | Review |
| VG-02 | A block says what is true of the product or for the user. It never says how code achieves it. `Why` gives your reason, or drops the line | Architecture chosen by accident | Review |
| VG-03 | A boundary says what the product is NOT by nature, via the test in section 1. A missing feature or a scope limit is not a boundary | A V1 limit turning into a permanent one | Review |
| VG-04 | An open question has `Question` and `Affects`. `Affects` lists the spec items awaiting the answer by ID, or "none yet". No other block answers the question | A gap hidden inside a statement | Lint (fields) + Review |
| VG-05 | IDs `I-x`, `W-x`, `P-x`, `B-x`, `Q-x` are never renumbered or reused. The file names the next free ID of each kind | A citation pointing at the wrong block | Review |
| VG-06 | Each fact is written once. Other blocks point by ID. The file does not redefine a term, region, or rule that `../_STYLE.md` defines | Two sources for one fact drifting apart | Review |
| VG-07 | Each block has `Status: confirmed` or `proposed`. A `proposed` block has `Source` and no `Spec implications`. Lower spec does not rely on a `proposed` block | A proposal read as a rule | Lint (fields) + Review |
| VG-08 | The file contains no scope, order, or priority. No use of MVP, V1, phase, roadmap | A scope decision put in the wrong place | Lint (words) + Review |
| VG-09 | The file contains no rules or quality values. It cites `[BR-?: topic]` or `[NFR-?: topic]` for every limit or target | The same rule written in several places | Lint (numbers, markers) + CI (ID exists) |
| VG-10 | Links are top-down only. Only `Affects` names a lower spec item, and each ID exists | A link pointing up; a dangling ID | CI (reference exists) |
| VG-11 | Text follows `../_STYLE.md`: glossary words, no banned vague verbs, one fact per line, evidence on its own line | Text a reader reads two ways | Lint (banned words) + Review |
| VG-12 | The file has no marketing. No praise words like powerful, smooth, intuitive, smart, best, easy | Marketing copy read as a commitment | Lint (words) + Review |
| VG-13 | Only you confirm a statement. AI writes new content only as a `proposed` block or an open question. Content found in a use case, research link, or reference product is not confirmed because of that | Inference and borrowed features becoming product truth | Review |
| VG-14 | A `W-x` block stating a human problem, need, or value has `Evidence` with a tag from `../_STYLE.md`. It does not overstate the evidence. With only `[assumed]`, write it as a belief ("I believe that..."). A part with nothing yet reads "Not written yet. See Q-x." | A made-up user problem; a vision that looks complete but is guesswork | Lint (fields, tags) + Review |

## 4. Illustrations

**VG-01: nature, not feature.**

> Fail: "The product reads a story chapter into audio." That is a capability; it belongs
> in a use case.
> Pass: "The product is a personal novel-listening app, hosted on the Internet, with
> accounts."

**VG-03: boundary, not V1 limit.**

> Fail: "Boundary: no auto-advance to the next chapter." V1 chose not to do it; that is
> scope.
> Pass: "Boundary: the product does not generate or own story content; it reads content
> from a source."
