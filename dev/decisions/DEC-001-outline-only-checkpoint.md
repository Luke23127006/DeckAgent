---
id: DEC-001
title: "The outline is the only checkpoint before any slide"
date: 04-11-2026
status: decided
research: "none; owner ruling in the UC-001 spec review, 04-11-2026; teacher feedback of 23-10-2026 in dev/meetings/"
affects: "FR-001, FR-003, FR-021, FR-113, FR-116, BR-013"
---

## Question

How many times does the user confirm before the system builds the first slide, and what
does each confirmation accept? The legacy spec asked for two confirmations: the outline,
then the generation format (legacy FR-115). The teacher feedback of 23-10-2026 asks for an
interview before the outline and for the output format to be chosen up front. A chat
holds at most one deck (glossary "chat"); this rule is carried from the legacy spec and
is not part of this question.

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · One checkpoint | The interview chooses the generation format. The outline shows the brief with it. One confirmation accepts the outline and the brief and starts the slides | FR-001, FR-003, FR-021, FR-113, BR-013 | One round trip fewer. The brief is accepted together with the outline, so a wrong interview answer is caught only when the user reads the brief |
| B · Two checkpoints (legacy) | Confirm the outline, then confirm the generation format before the slides | Legacy FR-114, FR-115 | Explicit consent to the format, but the format is chosen after the plan, which the teacher feedback rejects; one more step |
| C · Brief, then outline | Confirm the brief after the interview, then confirm the outline | FR-021, BR-013 | Catches wrong answers before any outline; two confirmations before the first slide |

## Choice

Option A: one confirmation of the outline, with the brief shown beside it, comes before
the first slide.

## Why

- The teacher feedback of 23-10-2026 puts the interview before the outline and the format
  choice up front, so the format needs no confirmation of its own after the outline.
- The brief shows with the outline, so the user still reads every interview answer and
  assumption before anything is built (FR-008, FR-021).
- One stop before the slides keeps the first draft short for the user.
- Written by the agent at the PO's request on 04-11-2026, from the PO's rulings in the
  UC-001 review ("the outline is the only checkpoint", "no separate brief confirmation").

## Rejected options and why

- B: the generation format would be confirmed after the plan, which the teacher feedback
  rejects, and it adds a stop.
- C: the PO ruled out a separate confirmation of the brief; a wrong answer is still
  caught on the outline, before any slide.

## Consequences

- With option A, FR-003 starts slide generation on the outline confirmation, and FR-116
  locks the generation format at that moment. Later use cases that change a deck (legacy
  UC-002, UC-011, UC-012) assume one confirmed outline per chat.
