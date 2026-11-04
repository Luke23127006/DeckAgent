# Decisions

Each file records one technical or product decision made during a build. A decision is
the output of a research question — it records what was chosen, why, and what was
rejected.

## Index

| ID | Question | Choice | Date | Status |
|---|---|---|---|---|
| [DEC-001](DEC-001-outline-only-checkpoint.md) | How many confirmations before the first slide | One: the outline, with the brief beside it | 04-11-2026 | decided |
| [DEC-002](DEC-002-model-writes-content-code-applies-design.md) | Who decides how a slide looks: the model or a prebuilt design system | The model writes content and the kind of slide; code applies the design system and layout | 04-11-2026 | decided |
| [DEC-003](DEC-003-user-sets-up-outside-services.md) | Who chooses the outside services besides the model provider | The user chooses and sets up each one | 04-11-2026 | decided |
| [DEC-004](DEC-004-work-runs-in-deckagent.md) | Where the work of a request runs, so that leaving the interface stops nothing | not chosen | 04-11-2026 | open |

Legacy decisions (`dev/legacy/adr/`) are research input. They have no DEC number.

## Conventions

- One file per decision: `DEC-NNN-short-topic.md`.
- IDs increase and are never reused.
- Status: `open` (not decided), `decided` (settled), or `revisiting` (reopened, with a
  reason).
- Each decision links to its source research question.
- Implementation tickets cite a decision by ID.
