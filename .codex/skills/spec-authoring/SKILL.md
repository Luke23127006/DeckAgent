---
name: spec-authoring
description: Write or rewrite a use case file (dev/mvp/spec/02-use-cases) so it follows the folder's template, criteria, and style. Use when creating a spec file, converting an old file to the new template, or fixing style errors. Not for deciding scope or inventing product behavior.
---

# Spec authoring

The rules live in three files. Read them before writing; do not restate them in the spec or in this skill.

- `dev/mvp/spec/<folder>/_TEMPLATE.md`: the fixed structure and field names.
- `dev/mvp/spec/<folder>/_CRITERIA.md`: the criteria the file must meet.
- `dev/mvp/spec/_STYLE.md`: the writing rules, evidence tags, glossary, and interface check (rule 11).

## What the spec holds

There is one spec, `dev/mvp/spec/` (dev/mvp/WORKFLOW.md "Spec rules"). Every change needs the PO's approval.

- A use case keeps its Steps table and its alternatives with a one-line `When` each; an FR or NFR keeps its Statement only; a BR keeps its rule and values.
- No acceptance criteria and no measures: those are written in the testing plan of a build (skill `testing-plan`).
- A new behavior claims its ID here before a build uses it.

## Content sources

Write only what comes from the user, from the file being rewritten, or from a research item in `dev/mvp/research/`. If a step needs behavior from no source, mark it `[assumed]` and say so in the report. Do not invent.

A use case explores behavior the product could have. A flow taken from a research item or a reference product is allowed; evidence says where it came from; it is not a commitment to build. Do not write an FR or replace `FR-?` with a real ID unless the task asks. A use case has no status field and no installation progress.

## New file

1. Copy the folder's `_TEMPLATE.md`. Take the next free ID named in the folder's `_CRITERIA.md`, then raise that line by one. Do not reuse, move, or renumber.
2. Fill every section. Write an unwritten requirement/rule/target as a `?` marker. Omit a template section marked omittable when empty.
3. Run the style checks below.

## Rewrite an existing file

1. Keep every ID, every citation (`FR-`, `[BR-`, `[NFR-`), the frontmatter, the evidence content, and the logic. If a style rule forces a meaning change, do not choose quietly: make the smallest change and say so in the report, not in the file.
2. Move the content into the template's blocks and fields.
3. Run the style checks.
4. Compare before/after: same IDs, same citations, same research links.
5. An interface phrase can carry a requirement. Translate it, do not just delete it. Ask what stays true when the interface changes: "a Play button in the bottom corner" becomes "the user requests playback; the system plays audio from the saved progress". A phrase that is only design (position, color, label) is deleted and recorded in the report as a homeless UI decision.

## Style checks

- Search `System`, `When`, and `Situation and goal` for the banned-word patterns in `_STYLE.md`. Fix each, or record a reason.
- Split a long sentence into one action per sentence.
- Check that each term in the text is in the glossary; each field is at most 7 lines.
- Check that evidence tags are on their own line.
- Check the Markdown form (`_STYLE.md` rule 9, AGENTS.md "Writing Markdown"): each paragraph or list item on one line, no hard wrap; each sentence bolds its keywords, never a whole sentence.
- Check that the file holds no history (`_STYLE.md` rule 12): no change log, no "merged from", no ruling date. What changed goes in the report and the commit message.
- Use case: run the interface check in `_STYLE.md` (rule 11, UCG-09) over the whole file except the frontmatter and the generated block. Rewrite each hit as intent or response, then apply the swap test to every User, When, and System sentence.

## Use case: end with the diagram

After the last edit to a use case, run [use-case-sequence](../use-case-sequence/SKILL.md) on the file. Do not hand-edit the generated block.

## Report

List: the file changed, the checks run and their results, each place a style rule changed the meaning, each UI phrase that carried a requirement and how it was rewritten, each homeless UI decision deleted, each `[assumed]` added, and each reference reviewed after a System change.
