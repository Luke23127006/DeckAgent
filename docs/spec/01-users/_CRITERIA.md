# Gate: User Segment

Template: `_TEMPLATE.md`. Dimension catalog: `dimensions.md` (format in section 5).

## 1. What a user segment is, and is not

**A user segment is a group of people who share the same values on the dimensions that change what they need, what they know, or how they use DeckAgent.** It exists to expose special use cases and requirements that "the user" in general would hide.

**This folder does not decide scope.** Its only job is to help detect use cases. Which use cases ship first is decided from `02-use-cases/`, so nothing here records an MVP or V1 choice.

| If the content is... | Then it belongs to |
|---|---|
| An AI service, export pipeline or any non-human participant | The supporting actors of a use case, or architecture work later. Not here |
| A product feature or solution ("needs a template gallery") | A requirement. Describe the need behind it here |
| A role inside one use case (primary actor) | The use case. This folder lists the use cases that serve each segment; the use case does not name the segment |
| A rule that applies to two or more segments or use cases | A business rule |
| Market size, pricing, business priority, release scope | Scope or strategy documents (`00-current-scope/`, `02-use-cases/`), not user description |
| A named real individual | Nowhere. A segment is a pattern, not a person |

### Linking direction

Links run top-down. The parent file lists its children; a child never names its parent. This folder is the top of the chain (segment, then use case, then requirement or rule). Each segment lists the use cases that serve it, per need and per special-case hypothesis (U-11). A use case holds no field naming a segment. To find the segments of a use case, search this folder.

## 2. How segments are found

1. Seed with a concrete imagined person (a student defending a thesis, a manager pitching tomorrow). Record this as `seed`.
2. Generalize the seed into a segment by stating its values on the dimensions in `dimensions.md` that deviate from the baseline. A dimension left unlisted means the segment sits at the baseline for it. Categorical dimensions have no baseline and are always listed.
3. Run the gap check (U-10): every extreme value in the catalog is either covered by a segment or marked `No segment yet` with a gap note. A gap is a discovery task, not a decision to exclude anyone.
4. Once use cases exist, list them on the needs and hypotheses they serve (U-11). A need with `none yet` is a discovery task: a use case may be missing, or the need may not be one a use case can serve.

## 3. Confidence tags and knowledge scale

Every claim about users carries one tag, written `[observed: <source>]`, `[inferred: <source>]` or `[assumed]`:

| Tag | Meaning |
|---|---|
| `observed` | Seen directly by the team: interview, recording, data, a product's own statement. Source required |
| `inferred` | Reasoned from observed facts. Source of the facts required |
| `assumed` | No evidence yet. Allowed in Draft; each one is a research task |

Knowledge level, rated per kind (domain, presentation craft, AI/tool literacy, language of use, language of the deck and its audience):

| Level | Anchor |
|---|---|
| None | Has never done it, or cannot do it without help |
| Basic | Can follow a guided flow; gets stuck on anything unusual |
| Working | Does it regularly; knows common options and their trade-offs |
| Expert | Could teach it; wants control and expects advanced options |

## 4. Criteria

"Check" is the intended layer: *Lint* = machine-checkable, *Review* = human judgment. No lint tooling exists yet; until it does, Lint rows are checked by review.

| ID | Criterion | Prevents | Check | Applies from | Source |
|---|---|---|---|---|---|
| U-01 | A segment describes humans only (see section 1) | Mixing system actors with people; losing the reason this folder exists | Review | Draft | Cockburn (actor vs. user) |
| U-02 | A segment is defined by its non-baseline values on dimensions from `dimensions.md` (unlisted = baseline), plus a one-sentence `seed`. A job title or age alone is not a definition | Stereotypes; segments nobody can tell apart | Lint (fields) + Review | Draft | Cooper (persona) |
| U-03 | Every dimension in the catalog states what changes when its value changes (a flow, a limit or a quality requirement). A dimension that changes nothing is removed | Decorative demographics; combinatorial explosion | Review | Draft | Project rule |
| U-04 | Each need is a goal plus its situation (when, where, why now), in the user's words, with no feature or solution | Solutions dressed up as needs | Review | Draft | Jobs-to-be-done (job in situation) |
| U-05 | Knowledge is rated separately for domain, presentation craft, AI/tool literacy and language (twice: language of use, and language of the deck and its audience), using the scale in section 3, with a note on what the level means in practice | "Non-technical" treated as one level; a person fluent in one language and weak in another rated as a single level | Lint (5 rows, valid level) + Review | Draft | Project rule |
| U-06 | Every claim about needs, knowledge, context, pain points and limits carries a confidence tag (section 3) | Guesses read as facts | Lint (tag present) + Review (source valid) | Draft | Project rule |
| U-07 | Two segments differ on at least one behavior-changing dimension. If not, merge them | Duplicate segments | Review | Draft | Project rule |
| U-08 | Special-case hypotheses are listed: each states a situation and what the product would have to handle. If none are found, say so with the reason | Segments that never influence the spec | Review | Active | Project rule |
| U-09 | Permanent, temporary and situational limits (for example one hand, bright screen, second language) are considered. "None identified" needs a reason | Quietly excluding users | Review | Active | Microsoft Inclusive Design |
| U-10 | In `dimensions.md`, every non-baseline extreme value is covered by at least one segment or marked `No segment yet` with a gap note. Baseline values are covered implicitly | Claiming to serve everyone without checking who is missing | Review | Active | Project rule |
| U-11 | Links run top-down. Each need lists the use cases that serve it (`none yet` if none). Each hypothesis says where it is handled (a use case step or branch, `none yet`, or `rejected` with a reason). Every user-goal use case is listed by at least one segment. A use case does not name segments or hypotheses | No trace from a person to the spec; hypotheses that never reach a use case; two-way links that drift | CI (references resolve, no orphan use case) | Active | Project rule |
| U-12 | An Active segment has no `assumed` claim without an open question that names who will resolve it | Assumptions hidden inside an Active segment | Lint | Active | Project rule |

## 5. `dimensions.md` format

One table. Every row is a dimension. Groups follow the segment template: need, knowledge (the four kinds in section 3), context and constraint. Add or remove rows as evidence appears.

| Group | Dimension | Baseline | Values (extremes in bold) | What changes | Covered by | Gap note |
|---|---|---|---|---|---|---|

- `Baseline` is the value the product can assume without special handling. It may sit at one end of a spectrum or in the middle. Segments do not list it, and it needs no coverage (U-10).
- `What changes` is required and names the kind of use case or requirement affected (U-03).
- A categorical dimension has no spectrum and no baseline (shown as `-`), so every listed value counts as an extreme and every segment lists it. The one exception is when a value is clearly the unmarked case (for example `native, single language`).
- Knowledge dimensions are rated in each segment's Knowledge table, not in frontmatter. The baseline rule decides only which knowledge levels need coverage.
- `Covered by` lists segment IDs per non-baseline value; `Gap note` is filled only when such a value has no segment yet (U-10).
- A fact like age or job is a proxy, not a dimension. Proxies are listed separately, with the dimensions they may hint at.

## 6. Illustrations (hypothetical)

**U-04: need written well.**

> Not met: "Needs an AI template gallery." That is a solution.
> Met: "I have a thesis defense on Friday and my advisor wants clean slides, but I have never designed one. I want something presentable I can fix quickly." The situation (deadline, no design skill) is visible, and nothing says how to solve it.

**U-05: knowledge split.**

> Not met: "Non-technical user."
> Met: domain Expert (knows the research topic), presentation craft Basic, AI/tool literacy Working, language Working (presents in a second language). Each level yields different requirements: guidance and defaults for craft, translation help for language.

**U-03: a dimension earns its place.**

> "Device" stays: phone-only use changes which flows are even possible.
> "Hair color" would not: nothing changes.
