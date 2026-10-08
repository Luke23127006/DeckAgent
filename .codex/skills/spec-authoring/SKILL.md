---
name: spec-authoring
description: Write or rewrite a use case (docs/spec/02-use-cases) or user segment (docs/spec/01-users) file so it follows its folder's template, its criteria and the plain-English style guide. Use when creating a spec file, converting an older one to the current template, or fixing style findings. Not for deciding scope, and not for inventing product behavior.
---

# Spec authoring

The rules live in three files. Read them before writing. Do not restate them in the spec or in this skill.

- `docs/spec/<folder>/_TEMPLATE.md`: the structure and fixed field names.
- `docs/spec/<folder>/_CRITERIA.md`: the criteria the file must meet.
- `docs/spec/_STYLE.md`: plain English rules, evidence tags, and the term table.

## Content sources

Write only what comes from the user, from the file being rewritten, or from the research cards in `docs/research/`. If a step needs behavior from none of these, mark it `[assumed]` and say so in the report. Do not invent it. Scope fields (`scope`, `ships_in_mvp`) belong to the owner; copy them, never set them.

## New file

1. Copy the folder's `_TEMPLATE.md`. Take the next free ID.
2. Fill every section. Write unwritten requirements, rules and quality targets as the `?` markers the criteria define. Remove sections the template marks as removable when they are empty.
3. Apply the style checks below.

## Rewrite an existing file

1. Keep every ID, every citation (`FR-`, `[BR-`, `[NFR-`), the frontmatter, the evidence content, and the logic. If a style rule forces a meaning change, do not choose silently: make the smallest change and list it in the report.
2. Move the content into the template's blocks and fields.
3. Apply the style checks below.
4. Compare before and after: the same IDs, the same citations, the same research links.

## Style checks

- Search the `System`, `When` and `Situation and goal` text for the banned-word pattern in `_STYLE.md`. Fix each hit or give a reason.
- Find sentences over 20 words (citations in `[ ]` do not count) and split them.
- Check that each term in the text is from the term table, and that no field has more than 7 bullets.
- Check that evidence tags are on their own `Evidence` line.

## Use cases: finish with the flowchart

After the last edit to a use case, run [use-case-flowchart](../use-case-flowchart/SKILL.md) on the file. Do not edit the generated block by hand.

## User segments

Follow `docs/spec/01-users/_TEMPLATE.md`: one block per need and per hypothesis, bullets for knowledge, context, pain points and limits. Keep the frontmatter as it is. Keep every need and hypothesis ID and every "Use cases" and "Handled by" value. Give each block a short name (5 words or fewer) taken from its content. When a closing `Evidence` bullet covers a list, check that no item in it has a different tag.

## Report

List: the files changed, the checks run and their results, every place where a style rule changed a meaning, and every `[assumed]` you added.
