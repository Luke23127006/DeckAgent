# Versions

This file defines each version of DeckAgent. It gives the identity, purpose, goal and success criteria of each version. It also gives the constraints that hold for the whole version.

- The `versions` field of each use case selects the flows of a version (`../03-use-cases/_CRITERIA.md`, Version scope). Nothing else selects a flow.
- This file holds no list of selected flows. Such a list would be a second source of scope.
- The validation baseline of a version selects no flow.
- A version can list product-wide NFRs that no requirement or flow can cite (`../04-requirements/nfr/_CRITERIA.md`, Traceability and scope). The list selects no flow.

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

- **Statement:** Local Web is the interface for creating, previewing and refining decks in V1. The user reaches it only from the computer that runs DeckAgent.
- **Considered:** the terminal interface (TUI). It stays a direction of the vision (P-3). It is not selected for V1. Access from another device on the network. Not selected for V1.
- **Status:** confirmed
- **Source:** owner; owner, 2026-10-13 (access only from the computer that runs DeckAgent)
- **Why:** not recorded
- **Means for specs:** This sets no agent runtime, no server and no architecture. Use cases stay free of interface details (`../_STYLE.md` rule 11). NFR-005 states the quality of this access.
- **Updated at:** 13-10-2026

### Content editing

- **Statement:** In V1 the user changes the content and the structure of a deck through the chat. The system makes each change from the user's instructions. The user reviews the slides in the deck canvas. Direct editing of the outline and of the slides is not selected for V1.
- **Considered:** editing the outline text directly, and light direct editing of slides, such as bold, italic or a font. Neither is selected for V1. Direct editing of slides stays a future capability.
- **Status:** confirmed
- **Source:** owner
- **Why:** The system revises content from the user's intent. The user does not have to fit related changes together by hand. An instruction gives no permission to change content outside its scope.
- **Means for specs:** Use cases describe a change of content as a request (UC-001 Note 29, UC-002). A suggested option sends an instruction (UC-003 Note 23). UC-007 stays a future candidate. This selects no flow.
- **Updated at:** 12-10-2026

### Export

- **Statement:** V1 has no export. The V1 journey ends when the user reviews the deck in Local Web.
- **Considered:** include export in V1. Not selected.
- **Status:** confirmed
- **Source:** owner
- **Why:** Generate, preview and refine are enough to show the V1 goal.
- **Means for specs:** UC-004 stays in the behavioral model as a future candidate. No later version is assigned to it.
- **Updated at:** 11-10-2026

### Chats and workspace

- **Statement:** In V1 the user can start a new chat for another deck. The user can also see earlier chats and reopen one with its conversation and deck.
  - Earlier chats and their saved decks stay available after DeckAgent is closed and opened again. Work that was running then is not resumed.
  - While DeckAgent runs, reloading or closing the Local Web interface does not stop the active request.
  - V1 has one default workspace. The user chooses no folder and sets up no workspace before a chat.
  - The user cannot start a new chat or open an earlier chat while the current request is active. A request that waits for the user's answer is active.
- **Considered:** one chat only (option A), not selected. Folder-based workspaces (option C), a future candidate with no version assigned (UC-012 Note 2).
- **Status:** confirmed
- **Source:** owner; owner, 2026-10-13 (reloading or closing the interface)
- **Why:** The user can begin new deck work without choosing a folder or managing workspaces.
- **Means for specs:** This fixes no storage, working folder or runtime. UC-012 and UC-006 describe the behavior. UC-003 A13 and UC-001 A13 describe a reload.
- **Updated at:** 13-10-2026

### Models

- **Statement:** In V1 the user sets up models with their own keys or model services (Vision P-1).
  - The user can save several provider configurations. Each connects to a built-in provider or to a custom model API. Two custom model APIs can use the same API protocol.
  - No two saved provider configurations have the same provider ID. The provider ID never changes after saving. To use another provider, the user adds a provider configuration.
  - The user can change the key or other authentication information of a saved provider configuration. The user can also change its display name, and its base URL where the provider allows it. The display name is not empty and is unique.
  - The user adds models to each provider configuration, from the model catalog of the provider or by model ID. The user can remove an added model, and restore the default models after confirming.
  - The user can delete a provider configuration, except while an active request uses it.
  - Each chat has its own selected model. The user chooses it among the selectable models of every provider configuration.
  - The user sets up provider configurations and models in the Models part of the settings. It holds built-in providers, custom model APIs, the model catalog and the saved provider configurations.
- **Considered:** one working model set up with the user's key (owner, 2026-10-11). Also one provider configuration with every model its key can use (owner, 2026-10-12). Also two provider configurations for one provider, and a change of provider (owner, 2026-10-12). Both were replaced the same day. None is kept for V1.
- **Status:** confirmed
- **Source:** owner, 2026-10-12
- **Why:** not recorded
- **Means for specs:** No total number of provider configurations is set. The organization of the settings is the owner's chosen direction. It is not an interface design, and use cases stay free of interface details. UC-005 and UC-003 describe the behavior. This selects no flow and fixes no storage.
- **Updated at:** 12-10-2026

### Images

- **Statement:** In V1 the agent can use images from the user's attachments on slides. It can also make new images for slides.
  - How new images are made is not decided. This covers the technology, a separate model or service, the model or provider, and whether every model can make them.
  - DeckAgent adds no image service, no image search and no images from the internet.
  - It never changes the selected model, and never moves the work to another provider, to make an image.
  - A clear request for attached or new images is followed. When the request does not say, and the choice changes the result a lot, the system asks.
  - A new image that the user asked for, or that the result cannot do without, cannot be made: the work cannot finish. A new image the agent chose to add is left out, and the closing message says so.
  - Using images from attachments approves no file type. BR-001 sets the accepted types.
- **Considered:** the agent finds images on the internet. Not selected. The user edits slides directly, or pastes images for the agent. Future candidates, not selected for V1.
- **Status:** confirmed
- **Source:** owner, 2026-10-13
- **Why:** not recorded
- **Means for specs:** UC-001 A42, UC-002 A12 and FR-066 describe the behavior. UC-001 Note 38 holds the choice of image and the image that cannot be made. Content goes to a service other than the provider of the selected model only after an owner approval (NFR-007). How images are made is a matter for architecture research.
- **Updated at:** 13-10-2026

### Content language

- **Statement:** DeckAgent writes the content of a deck in the language the user asks for. When the language is unclear, the rules for clarification apply.
  - Vietnamese and English are checked first.
  - This is not a list of languages DeckAgent commits to.
- **Status:** confirmed
- **Source:** owner, 2026-10-13
- **Why:** not recorded
- **Means for specs:** FR-008 and FR-022 describe the behavior. NFR-009 checks the characters of Vietnamese and English first.
- **Updated at:** 13-10-2026

### Platform

- **Statement:** Windows comes first for DeckAgent.
  - The team develops, runs and checks DeckAgent on Windows first.
  - Architecture research prefers choices that work well on Windows. It avoids dependencies that make DeckAgent hard to run there.
  - macOS and Linux are not goals now.
  - The same direction holds for a later terminal interface.
- **Status:** confirmed
- **Source:** owner, 2026-10-13
- **Why:** not recorded
- **Means for specs:** This promises nothing for every Windows version, device or hardware. It sets no list of platforms or browsers, and asks for no work across several platforms. NFR-014 states the build and the run on Windows.
- **Updated at:** 13-10-2026

### Quality requirements for the whole version

- **Statement:** V1 holds these product-wide NFRs. No FR and no selected response of a use case states a behavior that they constrain.
  - NFR-005
  - NFR-014
- **Status:** confirmed
- **Source:** owner, 2026-10-13: a product-wide NFR that no requirement or flow can cite belongs to V1 through this list
- **Means for specs:** The list holds IDs only. An NFR that a block or an FR of V1 cites is not listed (`../04-requirements/nfr/_CRITERIA.md`).
- **Updated at:** 13-10-2026

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
