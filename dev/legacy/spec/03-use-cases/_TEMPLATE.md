---
id: UC-000
title: ""             # user + verb + specific object + what distinguishes it, in the user's words (UCG-01)
level: user-goal      # user-goal | subfunction (a step reused by several cases)
includes: []          # use cases whose main flow this one runs as one unit
extended_by: []       # use cases that add an optional behavior here
next: []              # use cases that normally come after this one
# Relations point down or forward only. Never name a segment or a hypothesis here (UCG-01, UCG-07, UCG-10).
---

Updated at: DD-MM-YYYY

<!-- A use case models the ideal product (UCG-01 in _CRITERIA.md). Every flow it holds is a
     behavior selected for the ideal product; it records no rejected options and no decisions
     process. A version file under docs/versions/<version>/ names the flows it takes. No
     `versions` field (UCG-09).
     Write in plain English: docs/spec/_STYLE.md (UCG-11).
     Write intent and response, never interface (UCG-13, _STYLE rule 10). No control, menu, gesture, position, look or label.
     Name a place only by a zone: request area, conversation, deck canvas. Before you finish, run the interface check in _STYLE.md.
     Keep the step IDs (Sx) and flow IDs (Ax) stable and visible in the diagrams (UCG-03, UCG-10):
     files under docs/spec/, docs/versions/ and docs/design/ cite them, for example "UC-003 S2".
     A question the owner has not decided goes to the design backlog of the ideal spec, outside docs/spec/. Never write an answer for it here. -->

## Goal
<!-- The user's intent and expected result, in one short paragraph (UCG-02). No feature or solution. -->

## Preconditions
<!-- The trigger, and only conditions that affect the interaction. Observable. No implementation and no interface. -->

## Interactions
<!-- Main Flow First (UCG-03). The first diagram under this heading is the complete successful Main Flow:
     one continuous `sequenceDiagram` with every existing main step (MF, Sx) in its original order,
     and no alternative, exception or option before or inside it.
     Each considered alternative goes after the Main Flow, in its own `#### Ax · Name` subsection with
     its own diagram, sorted by Ax number. Each alternative names the step it diverges from and states
     its end: it returns to a main step, continues from one, ends the use case, or transfers to another
     use case never shown as success. Keep every flow or step ID (MF, Sx, Ax) beside its message,
     alt, opt or loop label. Cite [FR-xxx], [BR-xxx], [NFR-xxx] on the messages they constrain;
     detail lives in the requirement, not here.
     `FR-?` only while a decided behavior has no requirement yet; never for an open question (UCG-06). -->

```mermaid
sequenceDiagram
    actor User
    participant DeckAgent
    Note over User,DeckAgent: MF · Complete successful journey
    User->>DeckAgent: S1 · Provides the required input
    DeckAgent-->>User: Shows the accepted input [FR-xxx]
    User->>DeckAgent: S2 · Requests the result
    DeckAgent-->>User: Shows the completed result [FR-xxx]
```

### Alternative Flows
<!-- Omit this heading when the use case has no alternative. Never create an empty section. -->

#### A1 · Input cannot be accepted
<!-- Diverges at S1. Keep the existing behavior and citations. -->

```mermaid
sequenceDiagram
    actor User
    participant DeckAgent
    Note over User,DeckAgent: A1 · Diverges at S1
    DeckAgent-->>User: Explains why the input cannot be accepted [FR-xxx]
    Note over User,DeckAgent: Returns to S1
```

## Behavior constraints
<!-- Postconditions, minimal guarantee, and only the rules a diagram cannot express briefly.
     Cite FR/NFR/BR rather than restating acceptance conditions. Omit when empty. -->

## Notes
<!-- Only a boundary or a choice that the behavior itself cannot show: why this is not the same
     case as another, what the ability promises nothing about. One subject per note; numbers are
     stable, because other files cite "UC-xxx Note n". No decision history and no dates of
     decisions; git history keeps changes. Do not name segments. Omit the section when empty. -->
