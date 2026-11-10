---
id: DEC-009
title: "Where an answer finds the source of content in the deck"
date: 05-11-2026
status: open
research: "no research item"
affects: "FR-138, FR-024, FR-029, FR-137, UC-001 S5, UC-002 S3, UC-009 A3"
---

## Question

The user asks **where a figure, a date, a name or a claim** in the deck **comes from**. **Where does the answer find that source**: in a **record the system keeps when it writes the content**, or by having the **model look again** through the deck and the material **when the user asks**? The answer sets **what the first draft and each follow-up request keep** while they write slides, and whether the answer is **checked in CI or only in eval**. The **closing messages** of the first draft (FR-024) and of a follow-up request (FR-029) **already disclose the source per slide**.

**Working answer: option A**. **FR-138 and UC-009 A3 are written from it**, and FR-138 is cited at UC-001 S5 and UC-002 S3. **Choice** and **Why**: pending (the PO writes them).

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · Kept when written | While it writes a slide, the system keeps the source of each content of a kind that needs a source [BR-015]: the file and the place in the material, the public research result, or the model's general knowledge. An answer reads this record; content with no record gets "source not known" | FR-138, FR-024, FR-029 | The same answer every time, checked in CI from the record. The closing messages use the same record. Writing a slide costs more: the model states a source per content and code keeps it. A deck source changed by hand (backlog UC-007) has no record for the changed part |
| B · Found again when asked | Nothing is kept. When asked, the model reads the deck and the material again and finds the source | FR-137 | Simplest to build. The answer can name a wrong source or differ between two questions, and is checked only in eval. A source from public research is lost unless the result stays in the conversation |
| C · Record first, then search | As A; when no record exists, the model looks again and says that the source was found again and is not certain | FR-138, FR-137 | Covers content with no record. Two paths to build and to test; the user has to tell a kept source from a found one |

## Choice

<!-- Left to the PO. -->

## Why

<!-- Left to the PO. -->

## Rejected options and why

<!-- Left to the PO. -->

## Consequences

<!-- Left to the PO. -->
