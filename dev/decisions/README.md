# Decisions

Each file records one technical or product decision made during a build. A decision is
the output of a research question — it records what was chosen, why, and what was
rejected.

## Index

| ID | Question | Choice | Date | Status |
|---|---|---|---|---|
| [DEC-001](DEC-001-outline-only-checkpoint.md) | How many confirmations before the first slide | One: the outline, with the brief beside it | 04-11-2026 | decided |
| [DEC-002](DEC-002-model-writes-content-code-applies-design.md) | Who decides how a slide looks: the model or a prebuilt design system | The model writes content and the kind of slide; code applies the design system and layout | 04-11-2026 | superseded by DEC-005 |
| [DEC-003](DEC-003-user-sets-up-outside-services.md) | Who chooses the outside services besides the model provider | The user chooses and sets up each one | 04-11-2026 | decided |
| [DEC-004](DEC-004-work-runs-in-deckagent.md) | Where the work of a request runs, so that leaving the interface stops nothing | not chosen | 04-11-2026 | open |
| [DEC-005](DEC-005-model-writes-source-within-template.md) | Who writes the deck source, and how a design system bounds it across generation formats | The model writes the source within a prebuilt template; code makes the theme and checks each write | 04-11-2026 | decided (C2 replaced by DEC-007) |
| [DEC-006](DEC-006-where-chat-work-is-kept.md) | Where the deck source and the work of a chat are kept: DeckAgent's own data or the project folder | not chosen | 05-11-2026 | open |
| [DEC-007](DEC-007-how-a-design-system-bounds-the-deck.md) | What role the template plays for the model, and what happens to a colour or font the user asks for outside the theme | A layout of the template that code finds fitting, or a new one when none fits; the user is asked about a colour or font outside the theme | 05-11-2026 | decided (2C amended 05-11-2026) |
| [DEC-008](DEC-008-who-starts-a-conversation-summary.md) | Who starts the summary of a conversation that outgrows the context of the model: the system, the user or both | not chosen | 05-11-2026 | open |

Legacy decisions (`dev/legacy/adr/`) are research input. They have no DEC number.

## Conventions

- One file per decision: `DEC-NNN-short-topic.md`.
- IDs increase and are never reused.
- Status: `open` (not decided), `decided` (settled), `revisiting` (reopened, with a
  reason), or `superseded` (replaced by a later decision, named in `superseded_by`).
- Each decision links to its source research question.
- Implementation tickets cite a decision by ID.
