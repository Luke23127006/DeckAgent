---
name: Research ticket
about: A technical or product question to answer before implementation.
title: "Research: "
labels: phase:research
---

## Context

**Milestone:** mvp **Use case:** UC-XXX **Related FR/NFR:** FR-NNN / NFR-NNN **Flow step:** S?.? — {step name} **Flow tracker:** #N

## Flow diagram

<!-- Mermaid sequence diagram showing the runtime flow of the UC.
     Highlight the step(s) this question relates to using `activate` / `note`.
     The reader should see WHERE in the flow this question comes from before reading the question itself. -->

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant External

    User->>Frontend: action
    Frontend->>Backend: request

    rect rgb(255, 230, 150)
        note right of Backend: 👉 RQ-N: this step
        Backend->>External: operation
        External-->>Backend: response
    end

    Backend-->>Frontend: result
    Frontend-->>User: feedback
```

<!-- Replace the diagram above with the actual flow for this UC.
     Use `rect rgb(255, 230, 150)` to highlight the step(s) this research question comes from. -->

## Question

<!-- The specific question to answer. One question per ticket. -->

## Why this matters

<!-- Which requirement or decision depends on this answer. Be specific. -->

## Options (if technical)

<!-- Fill this table when the question is a technology choice. Remove if not applicable. -->

| Option | Description | Fits requirements | Tradeoffs |
|---|---|---|---|
| Option A | | | |
| Option B | | | |
| Option C | | | |

## Deliverable

<!-- What closing this ticket produces. Use a clickable link so the reviewer can open the file directly. Format:

     **Decision record:** [dev/mvp/decisions/DEC-NNN-topic.md](https://github.com/BuhDuy256/deck-agent/blob/main/dev/mvp/decisions/DEC-NNN-topic.md)

     **Research answer:** [dev/mvp/research/topic.md](https://github.com/BuhDuy256/deck-agent/blob/main/dev/mvp/research/topic.md), section RQ-N

     The PO writes the answer and the decision's Choice / Why. The agent supplies the options table only (dev/mvp/WORKFLOW.md "Roles"). -->

## Acceptance

- [ ] Question answered with evidence or reasoning
- [ ] Deliverable file created or updated
- [ ] Reviewed

## Blocked by

<!-- List prerequisite tickets. Remove if none. -->
