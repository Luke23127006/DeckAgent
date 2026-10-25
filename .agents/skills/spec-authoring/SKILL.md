---
name: spec-authoring
description: Write or rewrite a use case (docs/spec/03-use-cases) or user segment (docs/spec/02-users) file so it follows its folder's template, its criteria and the plain-English style guide. Use when creating a spec file, converting an older one to the current template, or fixing style findings. Also the workflow for editing a use case's Active interactions or Closed flows. Not for deciding scope, and not for inventing product behavior.
---

# Spec authoring

The rules live in three files. Read them before writing. Do not restate them in the spec or in this skill.

- `docs/spec/<folder>/_TEMPLATE.md`: the structure and fixed section names.
- `docs/spec/<folder>/_CRITERIA.md`: the criteria the file must meet.
- `docs/spec/_STYLE.md`: plain English rules, evidence tags, zones, the term table, and the interface check (rule 11).

Use cases describe their flows as hand-written Mermaid `sequenceDiagram` blocks. Follow [mermaid-markdown](../mermaid-markdown/SKILL.md) for the portable subset. Nothing generates a use case diagram; edit it directly (UCG-12).

## Content sources

Write only what comes from the user, from the file being rewritten, or from the research cards in `docs/research/`. If an interaction needs behavior from none of these, keep it `[assumed]` and say so in the report. Do not invent it.

A use case explores behaviors DeckAgent could perform. A flow taken from a research card or a reference product is allowed. Its evidence says where it came from. It is not a commitment to build it.

**Active and Closed are product-design statuses, not version choices.** Set a flow to Active or Closed only from an owner decision or existing documented intent in the file. Never set them from a version's accepted or held status; a scope file neither confirms nor denies a product decision. If the evidence does not establish the choice, keep the flow's ID and content, name the question under `## Decisions needed`, give the flow no status label, and report it. Never invent a reason for a Closed row; write `Reason: owner rationale not recorded` when the source supports Closed but not the reason.

Do not write functional requirements or replace `FR-?` with a real ID unless the task asks for it. Such a task covers only flows that a version selects. Use cases have no `status` frontmatter field and hold no implementation progress.

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

1. Keep every ID (`UC-xxx`, `MF`, `Sx`, `Ax`), every citation (`FR-`, `[BR-`, `[NFR-`), the frontmatter, the evidence content, the research links, and the decision history. Notes keep their numbers: other files cite `UC-xxx Note n`.
2. Move the content into the template's sections. Active flows become interactions with their IDs beside the messages; considered alternatives that the product does not perform become Closed rows with recorded reasons.
3. Conditions and outcomes stay through the diagram, a short constraint, or a citation to the FR/BR/NFR that holds the detail. Do not discard detail merely to make the file shorter; move detail into the correct existing requirement when there is one.
4. Apply the style checks below.
5. Compare before and after: the same IDs, the same citations, the same research links.
6. A UI phrase can carry a requirement. Translate it, do not just delete it: "as an overlay" becomes "the conversation, the request text and the attachments stay as they were". A phrase that is only design (a position, a colour, a label) is removed and listed in the report as a UI decision with no home.

## Style checks

- Search the response text of the interactions and the prose of `Goal`, `Preconditions` and `Behavior constraints` for the banned-word pattern in `_STYLE.md`. Fix each hit or give a reason.
- Find sentences over 20 words (citations in `[ ]` do not count) and split them.
- Check that each term in the text is from the term table.
- Check that evidence tags are in the evidence list of the interaction sections, one line per flow, and never inside a diagram label.
- Check the Mermaid blocks against the portability defaults in mermaid-markdown: plain `sequenceDiagram` declaration, balanced `alt`/`opt`/`loop`/`end`, quoted semantics avoided, no styling. Render or preview when possible and say what you ran.
- Set the file's `Updated at: dd-mm-yyyy` line to today's date (UCG-14). Keep the `Updated at` of `Product evidence` blocks you did not change.
- Use cases only: run the interface check in `_STYLE.md` (rule 11, UCG-13) on the whole file except the frontmatter, the `Research card` line and the flow IDs. Diagram labels count. Rewrite each hit as an intent or a response, then apply the swap test.

## User segments

Follow `docs/spec/02-users/_TEMPLATE.md`: one block per need and per hypothesis, bullets for knowledge, context, pain points and limits. Keep the frontmatter as it is. Keep every need and hypothesis ID and every "Use cases" and "Handled by" value. Give each block a short name (5 words or fewer) taken from its content. When a closing `Evidence` bullet covers a list, check that no item in it has a different tag.

## Report

List: the files changed, the checks run and their results, every place where a style rule changed a meaning, every UI phrase that carried a requirement and how you wrote it, every UI decision removed with no home, every `[assumed]` you added, every flow you labeled Active or Closed and the evidence for it, every unresolved decision you left in `Decisions needed`, and every reference you reviewed after a change to a response.
