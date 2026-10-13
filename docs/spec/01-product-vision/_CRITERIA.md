# Gate: Product Vision

Template: `_TEMPLATE.md`. Style: `../_STYLE.md`. Children: `../00-current-scope/`, `../02-users/`, `../03-use-cases/`, `../04-requirements/`, `../05-business-rules/`.

## 1. What the vision is, and is not

**The vision defines what DeckAgent is, before any other spec file describes what it does.** It answers five questions:

1. What is DeckAgent?
2. What problem does it exist to solve?
3. What main value does it give the user?
4. Which principles guide product choices?
5. Which boundaries belong to the nature of DeckAgent?

The questions guide the content. They are not one section each.

**The vision is not a decision log, a feature list or a scope.** A choice about a feature, a release, an interface or the code belongs in another file. The vision holds only what stays true when scope, interface or architecture change (VG-01).

**The vision does not grow by inference.** Only the owner confirms a statement. Everything else is a proposal or an open question (VG-14). A gap is written as a gap (VG-16).

### Where content belongs

| If the content is... | Then it belongs to |
|---|---|
| What DeckAgent is, why it exists, its value, its principles, its lasting boundaries | Here |
| What the current release or the thesis project covers, and in what order | `../00-current-scope/`, and the `scope` field of each use case |
| A capability the product offers, such as export, voice input or editing | `../03-use-cases/`. It comes here only when the owner says it is part of what DeckAgent is |
| A need or situation of a kind of person | `../02-users/` |
| A step, a response or a branch of one goal | `../03-use-cases/` |
| The testable statement of a system response | `../04-requirements/fr/` |
| A wait time, size target or other quality target | `../04-requirements/nfr/`. The vision cites it as `[NFR-?: topic]` |
| A limit, allowed list, file type or any other value a rule defines | `../05-business-rules/`. The vision cites it as `[BR-?: topic]` |
| How the code achieves something: engine, storage, framework, protocol, how work runs | An ADR in `docs/adr/` |
| How the product is operated or how it looks | UI design work (no folder yet) |
| A rule for how spec files are written, or a term all spec files share | `../_STYLE.md` or `AGENTS.md` |
| A raw observation of another product | `docs/research/` |

### A boundary is not a scope limit

A boundary says what DeckAgent is not, by its nature. It stays true in every release. A scope limit says what one release, or the thesis project, leaves out. Only the first belongs here.

> Scope limit (not here): "The first release has only the terminal interface."
> Boundary (here): "DeckAgent does not build, train or host an AI model."

Test: if the team had unlimited time, would the statement still hold? If no, it is a scope limit.

### Confirmed, proposed, open

Every statement has one of three states.

| State | Means | Lower specs can rely on it |
|---|---|---|
| `confirmed` | The owner said it | Yes |
| `proposed` | Someone suggested it. The owner has not decided | No |
| Open question | Not enough is known to decide | No |

A statement is not confirmed because another file contains it. That includes a use case, a segment, a research card, a reference product and common agent practice (VG-14).

### Linking direction: top-down only

The vision is the top of the chain. A lower spec file never names a vision block. To check a file against the vision, read the vision.

- The vision cites no segment, hypothesis, step or flow. One exception: an open question lists the spec items that wait for its answer (`Affects`).
- To find who is affected by a block, search the lower folders for its words (VG-11).

### Single source of truth

A fact is written in one block only. Another block refers to it by ID. A term or zone that `../_STYLE.md` defines is used here and never defined again (VG-06).

## 2. Sections, blocks and IDs

| Section | Answers | Block ID | Fields |
|---|---|---|---|
| What DeckAgent is | Question 1 | `I-x` | Statement, Status, Source, Means for specs, Updated at |
| Why DeckAgent exists | Questions 2 and 3 | `W-x` | Statement, Status, Source, Evidence, Means for specs, Updated at |
| Principles | Question 4 | `P-x` | Statement, Status, Source, Why, Means for specs, Updated at |
| Boundaries | Question 5 | `B-x` | Statement, Status, Source, Why, Means for specs, Updated at |
| Open questions | Any gap | `Q-x` | Question, Affects, Resolved by, Updated at |
| Retired | Removed IDs | none | One line per ID |

- `Status` is `confirmed` or `proposed`. It is always present (VG-07).
- `Source` says where the statement comes from. A confirmed block says `owner`. A proposed block names who proposed it and what it was inferred from (VG-14).
- `Why` gives the reason the owner gave, or says `not recorded`. Never invent a reason (VG-02).
- `Means for specs` says what a lower spec must keep true or must not assume. It holds only what follows directly from the statement. A consequence that needs another decision is a proposed block of its own. A proposed block has no `Means for specs` (VG-07).
- `Evidence` uses the tags in `../_STYLE.md`. A `W-x` block always has it (VG-15).
- IDs are never renumbered or reused. A removed block is listed under `Retired` (VG-05).
- `Updated at` is always the last field (VG-13).

## 3. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment, *CI* = checked across files. No tooling exists yet; until it does, Lint and CI rows are checked by review. "Applies from" is the status at which the criterion starts to bind (Draft or Active).

| ID | Criterion | Prevents | Check | Applies from | Source |
|---|---|---|---|---|---|
| VG-01 | Each block states what DeckAgent is, why it exists, its value, a principle or a lasting boundary. It stays true if the scope, the interface or the architecture changes. A fact that one feature or one use case alone depends on goes to that use case | A vision that grows into a feature list or a second spec; scope or design choices read as identity | Review | Draft | Project rule |
| VG-02 | A block says what is true of the product or for the user. It never says how the code achieves it. `Why` gives the owner's reason, or says `not recorded` | Architecture decided by accident; reasons invented later | Review | Draft | Nygard (decision, context, consequences) |
| VG-03 | A boundary says what DeckAgent is not, by its nature. It passes the test in section 1: it holds with unlimited time. A missing feature or a scope limit is not a boundary | Release limits turned into permanent limits; use cases written on a false belief | Review | Draft | Project rule |
| VG-04 | An open question has `Question`, `Affects` and `Resolved by`. `Affects` lists the spec items that wait for the answer, by ID, or says `none found`. `Resolved by` names a role. No other block answers the question | Gaps hidden inside statements; a question with no owner | Lint (fields) + Review | Draft | Project rule |
| VG-05 | IDs `I-x`, `W-x`, `P-x`, `B-x` and `Q-x` are never renumbered or reused. A removed block is listed under `Retired` with its ID and one line on where its content went | Citations that point at the wrong block | Review | Draft | Project rule |
| VG-06 | Each fact is written once. Another block refers to it by ID. The file does not define a term, zone or rule that `../_STYLE.md` defines | Two sources for one fact that drift apart | Review | Draft | Project rule |
| VG-07 | Every block has `Status: confirmed` or `Status: proposed`. A proposed block has no `Means for specs`, and no spec file relies on it. An Active vision has no proposed block | A proposal read as a rule | Lint (field) + Review | Draft (field), Active (no `proposed`) | Project rule |
| VG-08 | The file holds no scope, release, priority or order. It does not use the words MVP, V1, phase, roadmap or DATN. A limit of the thesis project or of a release is never written as a limit of DeckAgent | Release decisions made in the wrong folder; project limits turned into product identity | Lint (words) + Review | Draft | Project rule |
| VG-09 | The file holds no rule or quality value (SSOT). It cites `[BR-?: topic]` or `[NFR-?: topic]` for any limit, file type or target | The same rule written differently in many places | Lint (numbers, markers) + CI (IDs resolve) | Draft | Project rule |
| VG-10 | Links run top-down (section 1). Only `Affects` names lower spec items, and each ID exists or is retired | Links pointing up; dangling IDs | CI (references resolve) | Active | Project rule |
| VG-11 | A change to a block names the spec files that must be checked. The author searches `../00-current-scope/`, `../02-users/`, `../03-use-cases/`, `../04-requirements/` and `../05-business-rules/` for its words. Each conflict is reported, not chosen silently | A vision that the lower specs no longer match | Review | Draft | Project rule |
| VG-12 | Text follows `../_STYLE.md`: terms from its table, no banned vague verb, sentences of 20 words or fewer, one fact per bullet, evidence on its own line. Rules 5 and 7 do not apply, because there is no `System` or `When`. Rule 11 applies in this form: the file can name the ways to use the product (a terminal interface, a local web interface) and the three zones. It names no control, gesture, position, look, label or layout | Text that non-native readers misread; interface detail in a file all specs depend on | Lint (banned words, interface words) + Review | Draft | Project rule |
| VG-13 | Every block (each `###` heading) ends with the field `Updated at`, the date of the last change to that block, as `dd-mm-yyyy`. Any edit to a block sets it to the date of that edit. The file does not record who changed it; git history does | Blocks whose date is out of step with their text | Lint (field, date format) + Review (date matches the last edit) | Draft | Project rule |
| VG-14 | Only the owner confirms a statement. An agent writes new content only as a proposed block or an open question. Content found in a use case, a segment, a research card, a reference product or common agent practice is not confirmed by that. A proposed block names its source | Inferences and borrowed features turned into product truth | Review | Draft | Project rule |
| VG-15 | A `W-x` block that states a problem, a need or a value for people has `Evidence` with tags from `../_STYLE.md`. It says no more than its evidence shows. With `[assumed]` only, it is written as a belief ("The owner believes...") | Invented user problems, research and benefits | Lint (field, tags) + Review | Draft | Project rule |
| VG-16 | A section with nothing confirmed or proposed says `Not written yet` and names the open question that waits for it. A section is never filled to look complete | A vision that looks complete but rests on guesses | Review | Draft | Project rule |
| VG-17 | The file makes no promotional claim. It uses no word that praises rather than states, such as powerful, seamless, effortless, intuitive, smart, best or easy | Marketing text read as a commitment that no one can test | Lint (words) + Review | Draft | Project rule |
| VG-18 | A long-term direction is written as a direction ("DeckAgent aims to..."). Its `Means for specs` says that it fixes nothing about what exists now or what is in scope | A direction read as a built feature or as current scope | Review | Draft | Project rule |
| VG-19 | An Active vision has at least one confirmed block in each of the sections What DeckAgent is, Why DeckAgent exists, Principles and Boundaries | An Active vision that answers only part of the five questions | Lint (sections) + Review | Active | Project rule |

## 4. How to check

**Words (VG-12).** Run on the whole file except the frontmatter. Each hit is fixed or has a stated reason.

```
(handl(e|es|ed|ing)|manag(e|es|ed|ing)|support(s|ed)?|process(es|ed|ing)?|ensur(e|es|ed)|properly|gracefully|appropriate(ly)?|may|might|should|could)
```

**Interface (VG-12).** Use the interface check in `../_STYLE.md`. Hits on `terminal`, `web` and `interface` are allowed when they name a way to use the product. Any other hit is rewritten or has a stated reason.

**Scope and order (VG-08).**

```
(MVP|V1|phase|roadmap|release|priority|first version|later|DATN|thesis)
```

A hit is allowed in a `Means for specs` line that says a statement fixes no scope. It is also allowed where the text names `00-current-scope/`.

**Promotion (VG-17).**

```
(powerful|seamless(ly)?|effortless(ly)?|intuitive|smart|best|easy|easily|revolutionary|cutting-edge|state-of-the-art|world-class)
```

**Architecture (VG-02).** Review only. Some words show that a block describes how the code works. Examples are engine, database, queue, port, protocol, framework and API. The words model, harness, agent, tool and key are allowed: they name what DeckAgent is (the `I-x` blocks).

**Confirmation (VG-14).** Review only. For each confirmed block, check that the owner said it. For each proposed block, check that `Source` names where it came from.

## 5. Illustrations (hypothetical)

**VG-01: identity, not a feature.**

> Not met: "DeckAgent exports a deck to two kinds of file." That is a capability. It goes to a use case.
> Met: "DeckAgent is an open-source AI agent harness for making presentations."

**VG-03 and VG-08: a boundary, not a project limit.**

> Not met: "Boundary: DeckAgent has no local web interface." The team chose not to build it in the thesis project. That is scope.
> Met: "Boundary: DeckAgent does not build, train or host an AI model." It holds with unlimited time.

**VG-14: found is not confirmed.**

> Not met: "Principle: the user can speak a request." The source is a use case flow copied from a reference product. Status is `confirmed`.
> Met: the same idea is not in the vision. Someone can think it is part of what DeckAgent is. Then it is a proposed block with `Source: proposed by an agent, from a use case flow`.

**VG-15 and VG-16: a gap stays a gap.**

> Not met: "Why DeckAgent exists: people waste hours on slides." No evidence and no owner statement.
> Met: "Not written yet. See Q-5."

**VG-18: a direction, not a fact.**

> Not met: "The user works in a terminal interface or a local web interface."
> Met: "DeckAgent aims to offer a terminal interface and a local web interface over one harness." `Means for specs`: "This direction fixes neither which interface exists now nor which one is in scope."
