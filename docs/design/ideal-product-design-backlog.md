# Ideal Product — Design Backlog

These are unsettled product-design questions. They are **not** selected use-case flows, functional requirements or V1 commitments. Keep them outside `docs/spec/` until the Product Owner decides the behavior.

## Source inspection with slide editing

### Source inspection and direct editing

**Agreed intent:** A user can inspect where content on a finished slide came from through the interface. The user can request verification by the Agent without automatically changing the deck.

**Open:** How do source inspection, selecting slide content, manual editing and Agent editing share an interaction? The UI-first decision is retained; no detailed UI has been approved.

**Review with:** Direct Editing, Agent Editing, Undo/Redo and History.

### Source references after a change

**Open:** What happens to a source reference when a user or Agent edits the supported content, or when a deck state is restored? A source for an earlier value must not be claimed as evidence for a changed value without justification.

**Review with:** Direct Editing, Agent Editing, Undo/Redo and History.
