---
id: DEC-002
title: "The model writes the content; code applies the design system"
date: 04-11-2026
status: superseded
superseded_by: DEC-005
research: "none; owner ruling in the UC-001 spec review, 04-11-2026; teacher feedback of 23-10-2026 in dev/meetings/"
affects: "FR-022, FR-091, FR-093, BR-003, NFR-009"
---

> Superseded on 04-11-2026 by [DEC-005](DEC-005-model-writes-source-within-template.md)
> in the UC-002 spec review: option A gave no way to make a free design change in a
> follow-up request, lost changes by hand, and needed a full renderer per generation
> format. Kept as a record; do not apply it.

## Question

Who decides how a slide looks: the model, or a prebuilt design system applied by code?
The teacher feedback of 23-10-2026 asks for deterministic, prebuilt assets. WORKFLOW.md
"As-built layer" reports "the model generating CSS instead of applying a theme" as drift.
The legacy spec let the model apply a visual style, or "a suitable design that follows
the design system" (legacy FR-094, FR-104). This is an LLM boundary choice; the full
boundary table is written per build in Phase 3.

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · Code applies the design | The model writes the content of each slide. Code applies the chosen design system: colours, fonts and prebuilt layouts | FR-022, FR-093, BR-003, NFR-009 | Same look every time and testable display; less variety; the prebuilt layouts must cover the kinds of content a slide holds |
| B · The model designs | The model writes the slide source with its styling, guided by the design system as instructions | Legacy FR-094, FR-104 | Most freedom; output changes from run to run, so NFR-009 is harder to test; the drift that WORKFLOW.md names |
| C · The model picks, code applies | Code applies the design system. The model chooses a prebuilt layout for each slide from the content | FR-022, FR-091, FR-093 | Layout fits the content; the choice of layout is model judgment, but bounded by the prebuilt set |

## Choice

Option A: the model writes the content of each slide, including what kind of slide it is,
and code applies the chosen design system and maps each kind of slide to a prebuilt
layout.

## Why

- The teacher feedback of 23-10-2026 asks for deterministic, prebuilt assets, and
  WORKFLOW.md Phase 3 makes code the default: the model is called to understand the
  request, interview the user or write content.
- The same input gives the same look, so NFR-009 (display integrity) is testable with
  fixtures instead of judged per run.
- Saying what kind of slide it is (a title, a list, a comparison, an image with text) is
  part of writing the content, so the model still shapes each slide without styling it.
- Written by the agent at the PO's request on 04-11-2026, from the PO's ruling in the
  UC-001 review that UC-001 keeps only the choice of a prebuilt design system.

## Rejected options and why

- B: the look changes from run to run, NFR-009 is hard to test, and it is the drift that
  WORKFLOW.md "As-built layer" names.
- C: picking a layout becomes model judgment outside the WORKFLOW.md default; option A
  keeps the same effect through the kind of slide the model writes.

## Consequences

- The visual style, design options before the slides and conflicts between design rules
  (legacy FR-094, FR-095, FR-104, FR-105, FR-111) are reviewed with legacy UC-010 and
  UC-017 under this decision.
- The Phase 3 LLM boundary table of each build lists the prebuilt design systems and
  layouts it uses.
