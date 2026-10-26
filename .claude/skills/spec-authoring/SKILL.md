---
name: spec-authoring
description: Write or rewrite a use case (docs/spec/03-use-cases) or user segment (docs/spec/02-users) file so it follows its folder's template, its criteria and the plain-English style guide. Use cases follow the Main Flow First format. Use when creating a spec file, converting an older one to the current template, or fixing style findings. Also the workflow for editing a use case's interactions or flows. Not for deciding scope, and not for inventing product behavior.
---

# Spec authoring

The rules live in three files. Read them before writing. Do not restate them in the spec or in this skill.

- `docs/spec/<folder>/_TEMPLATE.md`: the structure and fixed section names.
- `docs/spec/<folder>/_CRITERIA.md`: the criteria the file must meet.
- `docs/spec/_STYLE.md`: plain English rules, zones, the term table, and the interface check (rule 10).

## Main Flow First

This skill writes use cases in the Main Flow First format (`_TEMPLATE.md`, UCG-03 in `_CRITERIA.md`):

- One complete successful Main Flow comes first: a single continuous Mermaid `sequenceDiagram` that holds every existing main step (`MF`, `Sx`) in its original order, with no alternative, exception or option before or inside it. A repeated action that belongs to the normal successful path may keep its `loop`.
- Each considered alternative comes after the Main Flow, in its own `#### Ax · Name` subsection with its own diagram, sorted by Ax number. Alternatives are never merged, renumbered or invented.
- Every alternative names the existing step it diverges from (`Note over User,DeckAgent: Ax · Diverges at Sx`) and states its end: it returns to an existing main step, continues from one, ends the use case without the successful outcome, or transfers to another existing use case. An alternative that ended early never reads as reaching the successful final step.
- Every existing ID (`UC-xxx`, `MF`, `Sx`, `Ax`) and every citation (`FR-`, `[BR-`, `[NFR-`) stays. Reorganizing the diagrams changes their presentation, never their behavior (UCG-12).
- After moving interactions, search `docs/spec/`, `docs/versions/` and `docs/design/` for references to the moved IDs (`UC-xxx Sx`, `UC-xxx Ax`, `UC-xxx Note n`) and check that each still resolves and keeps its meaning.

Use cases describe their flows as hand-written Mermaid `sequenceDiagram` blocks. Follow [mermaid-markdown](../mermaid-markdown/SKILL.md) for the portable subset. Nothing generates a use case diagram; edit it directly (UCG-12).

## Content sources

Write only what comes from the user, from the file being rewritten, or from the research cards in `docs/research/`. If an interaction needs behavior from none of these, keep it `[assumed]` and say so in the report. Do not invent it.

A use case explores behaviors DeckAgent could perform. A flow taken from a research card or a reference product is allowed. Its evidence says where it came from. It is not a commitment to build it.

Do not write functional requirements or replace `FR-?` with a real ID unless the task asks for it. Such a task covers only flows that a version selects. Use cases have no `status` frontmatter field and hold no implementation progress. A use case labels no flow Active or Closed; product-design statuses are not part of the Main Flow First format. A considered but not selected behavior is never written as a flow (UCG-04).

## References between use cases

`_CRITERIA.md` (Related use cases, Requirements traceability) defines the rules. Keep three relations apart:

- **Invocation:** `includes` runs the main flow of the other use case. The interactions reference those steps.
- **Behavior reference:** "as UC-xxx Sx says" or "as in UC-xxx Ax" reuses wording only. Never read it as a scope dependency, a flow selection or a requirement trace.
- **Scope dependency:** only `includes`, `extended_by`, an end to another use case, or a precondition declares one. Report a dependency you find.

A response an FR already covers cites that FR; it never gets a second one. Keep every `FR-?` visible. Never write a reference in place of a requirement.

When you change the response of a step or flow, search `docs/spec/`, `docs/versions/` and `docs/design/` for references to it (`UC-xxx Sx`, `UC-xxx.Sx`, `UC-xxx Ax`). Change a referring block only when its meaning no longer holds. List every reference you reviewed in the report.

## New file

1. Copy the folder's `_TEMPLATE.md`. Use cases: take the ID after the highest use case ID in `03-use-cases/` and in its retired IDs (`03-use-cases/_CRITERIA.md`). Never reuse, move or renumber a use case ID. Segments: take the next free ID.
2. Fill every section. Write unwritten requirements, rules and quality targets as the `?` markers the criteria define. Remove sections the template marks as removable when they are empty.
3. Apply the style checks below.

## Rewrite an existing file

1. Keep every ID (`UC-xxx`, `MF`, `Sx`, `Ax`), every citation (`FR-`, `[BR-`, `[NFR-`), the frontmatter, and the research links. Notes keep their numbers: other files cite `UC-xxx Note n`.
2. Move the content into the template's sections in Main Flow First order: one continuous Main Flow diagram with every main step, then one `#### Ax` subsection per existing alternative, sorted by Ax number, each with its divergence point and its end (UCG-04). Do not invent alternatives for use cases that have none, and do not merge alternatives.
3. Conditions and outcomes stay through the diagram, a short constraint, or a citation to the FR/BR/NFR that holds the detail. Do not discard detail merely to make the file shorter; move detail into the correct existing requirement when there is one.
4. Apply the style checks below.
5. Compare before and after: the same IDs, the same citations, the same research links. After moving interactions, run the cross-reference check in the Main Flow First section above.
6. A UI phrase can carry a requirement. Translate it, do not just delete it: "as an overlay" becomes "the conversation, the request text and the attachments stay as they were". A phrase that is only design (a position, a colour, a label) is removed and listed in the report as a UI decision with no home.

## Style checks

- Search the response text of the interactions and the prose of `Goal`, `Preconditions` and `Behavior constraints` for the banned-word pattern in `_STYLE.md`. Fix each hit or give a reason.
- Find sentences over 20 words (citations in `[ ]` do not count) and split them.
- Check that each term in the text is from the term table.
- Check the Mermaid blocks against the portability defaults in mermaid-markdown: plain `sequenceDiagram` declaration, balanced `alt`/`opt`/`loop`/`end`, quoted semantics avoided, no styling. Render or preview when possible and say what you ran.
- Set the file's `Updated at: dd-mm-yyyy` line to today's date (UCG-14). Keep the `Updated at` of `Product evidence` blocks you did not change.
- Use cases only: run the interface check in `_STYLE.md` (rule 10, UCG-13) on the whole file except the frontmatter and the flow IDs. Diagram labels count. Rewrite each hit as an intent or a response, then apply the swap test.

## User segments

Follow `docs/spec/02-users/_TEMPLATE.md`: one block per need and per hypothesis, bullets for knowledge, context, pain points and limits. Keep the frontmatter as it is. Keep every need and hypothesis ID and every "Use cases" and "Handled by" value. Give each block a short name (5 words or fewer) taken from its content. When a closing `Evidence` bullet covers a list, check that no item in it has a different tag.

## Report

List: the files changed, the checks run and their results, every place where a style rule changed a meaning, every UI phrase that carried a requirement and how you wrote it, every UI decision removed with no home, every `[assumed]` you added, and every reference you reviewed after a change to a response or after moving interactions.
