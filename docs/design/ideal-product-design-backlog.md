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

## Permission reuse

### Duration and scope of lasting permissions

**Agreed intent:** An Agent operation outside its current permission needs approval. The user can approve once, deny, or explicitly confirm an offered permission with a stated scope.

**Open:** Which reusable permission scopes does DeckAgent offer, and when does each expire?

**Review with:** Permission Design.

### Review and revoke prior permission

**Agreed intent:** The user can see and change the permission of a chat.

**Open:** What overview of prior grants is available, and how does the user revoke continuing grants across requests?

**Review with:** Permission Design.
