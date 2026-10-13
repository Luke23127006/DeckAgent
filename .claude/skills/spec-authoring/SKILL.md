---
name: spec-authoring
description: Write or rewrite a use case (docs/spec/03-use-cases) or user segment (docs/spec/02-users) file so it follows its folder's template, its criteria and the plain-English style guide. Use when creating a spec file, converting an older one to the current template, or fixing style findings. Not for deciding scope, and not for inventing product behavior.
---

# Spec authoring

The rules live in three files. Read them before writing. Do not restate them in the spec or in this skill.

- `docs/spec/<folder>/_TEMPLATE.md`: the structure and fixed field names.
- `docs/spec/<folder>/_CRITERIA.md`: the criteria the file must meet.
- `docs/spec/_STYLE.md`: plain English rules, evidence tags, zones, the term table, and the interface check (rule 11).

## Content sources

Write only what comes from the user, from the file being rewritten, or from the research cards in `docs/research/`. If a step needs behavior from none of these, mark it `[assumed]` and say so in the report. Do not invent it.

A use case explores behaviors DeckAgent could perform. A flow taken from a research card or a reference product is allowed. Its evidence says where it came from. It is not a commitment to build it.

The `versions` field of a use case belongs to the owner. Copy it exactly. Never add, remove or reorder a version or a flow in it unless the task asks for that change. Never select a flow because a research card shows it.

Do not write functional requirements or replace `FR-?` with a real ID unless the task asks for it. Such a task covers only flows that a version selects. Use cases have no `status` field and hold no implementation progress.

## References between use cases

`_CRITERIA.md` (Related use cases, Requirements traceability) defines the rules. Keep three relations apart:

- **Invocation:** `includes` runs the main flow of the other use case. Each step that runs part of it names that step.
- **Behavior reference:** "as UC-xxx Sx says" or "as in UC-xxx Ax" reuses wording only. Never read it as a scope dependency, a flow selection or a requirement trace.
- **Scope dependency:** only `includes`, `extended_by`, an `End` to another use case, or a precondition declares one. Report a dependency you find. Never add a flow to `versions` for it.

Write `Reqs: none` only in a step that runs part of an included use case, when the block `System` names gives the whole response. A behavior reference in any other block keeps `FR-?` or FR IDs. A block that adds its own response traces only its own part. Never write a reference in `Reqs`, and never write a second FR for a response an FR already covers.

When you change the `System` of a block, search `docs/spec/` for references to it (`UC-xxx Sx`, `UC-xxx.Sx`). Change a referring block only when its meaning no longer holds. List every reference you reviewed in the report.

## New file

1. Copy the folder's `_TEMPLATE.md`. Use cases: take the ID after the highest use case ID in `03-use-cases/` and in its retired IDs (`03-use-cases/_CRITERIA.md`, Use case IDs). Never reuse, move or renumber a use case ID; only an owner decision recorded there can renumber. Segments: take the next free ID.
2. Fill every section. Write unwritten requirements, rules and quality targets as the `?` markers the criteria define. Remove sections the template marks as removable when they are empty.
3. Apply the style checks below.

## Rewrite an existing file

1. Keep every ID, every citation (`FR-`, `[BR-`, `[NFR-`), the frontmatter, the evidence content, and the logic. If a style rule forces a meaning change, do not choose silently: make the smallest change and list it in the report.
2. Move the content into the template's blocks and fields.
3. Apply the style checks below.
4. Compare before and after: the same IDs, the same citations, the same research links.
5. A UI phrase can carry a requirement. Translate it, do not just delete it. Ask what stays true if the interface changes: "as an overlay" becomes "the conversation, the request text and the attachments stay as they were". A phrase that is only design (a position, a colour, a label) is removed and listed in the report as a UI decision with no home.

## Style checks

- Search the `System`, `When` and `Situation and goal` text for the banned-word pattern in `_STYLE.md`. Fix each hit or give a reason.
- Find sentences over 20 words (citations in `[ ]` do not count) and split them.
- Check that each term in the text is from the term table, and that no field has more than 7 bullets.
- Check that evidence tags are on their own `Evidence` line.
- Check that every `###` block ends with `Updated at`. Set it to today's date (`dd-mm-yyyy`) on each block you wrote or changed. Keep the date of a block you did not change (U-14, UCG-14).
- Use cases only: run the interface check in `_STYLE.md` (rule 11, UCG-13) on the whole file except the frontmatter, the generated block and the `Research card` line. Rewrite each hit as an intent or a response, then apply the swap test to every `User`, `When` and `System` sentence. Evidence text follows the same rule: describe what the product did, not what it looked like or what its control was called. A zone is the only place name allowed.

## Use cases: finish with the flowchart

After the last edit to a use case, run [use-case-flowchart](../use-case-flowchart/SKILL.md) on the file. Do not edit the generated block by hand.

## User segments

Follow `docs/spec/02-users/_TEMPLATE.md`: one block per need and per hypothesis, bullets for knowledge, context, pain points and limits. Keep the frontmatter as it is. Keep every need and hypothesis ID and every "Use cases" and "Handled by" value. Give each block a short name (5 words or fewer) taken from its content. When a closing `Evidence` bullet covers a list, check that no item in it has a different tag.

## Report

List: the files changed, the checks run and their results, every place where a style rule changed a meaning, every UI phrase that carried a requirement and how you wrote it, every UI decision removed with no home, every `[assumed]` you added, and every reference you reviewed after a change to `System`.
