# Versions

This file defines each version of DeckAgent. It gives the identity, purpose, goal and success criteria of each version. It also gives the constraints that hold for the whole version.

- The `versions` field of each use case selects the flows of a version (`../03-use-cases/_CRITERIA.md`, Version scope). Nothing else selects a flow.
- This file holds no list of selected flows. Such a list would be a second source of scope.
- The validation baseline of a version selects no flow.

## Version list

Versions apply in this order.

1. V1

## V1

### Purpose

- **Statement:** End-to-end product validation.
- **Status:** confirmed
- **Source:** owner
- **Why:** not recorded
- **Updated at:** 11-10-2026

### Goal

- **Statement:** "Enable users to create, preview, and refine a presentation through conversation with their chosen AI model, so the result reflects their instructions and improves toward their expectations through clarification and feedback."
- **Status:** confirmed
- **Source:** owner
- **Why:** not recorded
- **Updated at:** 11-10-2026

### Success criteria

- **Statement:** These are product-level success criteria. They are not acceptance tests.
  - **SC-1 · Instruction fidelity:** DeckAgent follows clear user instructions when it creates or changes a deck.
  - **SC-2 · Intent clarification:** DeckAgent reduces uncertainty when instructions are incomplete, ambiguous or conflicting. It also helps a user who sees a problem but cannot describe the change they need.
  - **SC-3 · Iterative convergence:** DeckAgent improves a deck through feedback. It keeps content outside the requested changes as it was. The user judges whether the result moves closer to what they expect.
- **Status:** confirmed, as concepts
- **Source:** owner
- **Why:** not recorded
- **Updated at:** 11-10-2026

### Interface

- **Statement:** Local Web is the interface for creating, previewing and refining decks in V1.
- **Considered:** the terminal interface (TUI). It stays a direction of the vision (P-3). It is not selected for V1.
- **Status:** confirmed
- **Source:** owner
- **Why:** not recorded
- **Means for specs:** This sets no agent runtime and no architecture. Use cases stay free of interface details (`../_STYLE.md` rule 11).
- **Updated at:** 11-10-2026

### Export

- **Statement:** V1 has no export. The V1 journey ends when the user reviews the deck in Local Web.
- **Considered:** include export in V1. Not selected.
- **Status:** confirmed
- **Source:** owner
- **Why:** Generate, preview and refine are enough to show the V1 goal.
- **Means for specs:** UC-004 stays in the behavioral model as a future candidate. No later version is assigned to it.
- **Updated at:** 11-10-2026

### Validation baseline

The minimal validation set for the V1 goal. It is a short baseline, not a test specification.

| Scenario | Primary criterion | Purpose |
|---|---|---|
| VS-01 | SC-1 | Clear first draft from source material |
| VS-02 | SC-1 | Clear follow-up changes |
| VS-03 | SC-2 | Clarify missing intent |
| VS-04 | SC-2 | Missing facts and conflicting material |
| VS-07 | SC-3 | Multi-round refinement |
| VS-08 (revised) | SC-2 | Guided clarification for unclear follow-up feedback |

- **VS-03:** Validation keeps two things apart.
  - The system asks for information that clarifies the user's intent.
  - The system discloses assumptions it made.
  - Validation checks that clarified information changes the resulting outline or deck.
- **VS-07:** Validation checks three things.
  - Each revision follows the user's feedback.
  - Content outside the feedback stays as it was.
  - The result moves closer to what the user expects, as the user judges it. The closing message of the system is no proof of this.
- **VS-08:** The user says "Slide 3 doesn't look right."
  - DeckAgent uses the deck and the conversation as context.
  - It offers relevant directions to improve the slide.
  - The user chooses a direction or explains more.
  - DeckAgent changes the deck only when the direction is clear.
  - Basic clarification is the fallback when DeckAgent has no grounded direction to offer. Design diagnosis is not part of this scenario.
- **Boundaries:**
  - The set validates the V1 goal and its three success criteria.
  - It does not replace acceptance tests for model setup, stop, error or file input.
  - It selects no flow.
- **Considered, outside the set:** VS-05 (instructions that conflict with each other), VS-06 (a follow-up request that reaches slides it does not name), VS-09 (a model change after a change by hand).
- **Status:** confirmed
- **Source:** owner
- **Why:** not recorded
- **Updated at:** 11-10-2026
