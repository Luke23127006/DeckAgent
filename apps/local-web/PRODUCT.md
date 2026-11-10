# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A person who wants a presentation made from a request (VISION W-1, confirmed by the owner). They bring their own model key and run DeckAgent on their own computer. They open the local web interface from the machine that runs DeckAgent.

The specs list nine user segments (`docs/spec/02-users/USR-001` to `USR-009`), for example a student defending a thesis in a second language. All are marked `[assumed]`: no user research backs any of them. No segment is the primary user. Future design work must not rank them or invent a persona.

## Product Purpose

DeckAgent is an open-source AI agent harness for making presentations (VISION I-1). The model is the AI model the user chooses. The harness is what DeckAgent builds: tools, a place to run them, and the logic that directs the work. The agent is the model working inside the harness (I-2). DeckAgent builds, trains and hosts no model.

DeckAgent lets the user turn a request for a presentation into a presentation, with the model they chose (W-2).

This app is the local web interface, the one interface V1 takes. V1 goal (owner, 11-10-2026): "Enable users to create, preview, and refine a presentation through conversation with their chosen AI model, so the result reflects their instructions and improves toward their expectations through clarification and feedback."

V1 success criteria (`docs/versions/v1/SCOPE.md`): SC-1 instruction fidelity, SC-2 intent clarification, SC-3 iterative convergence.

## Positioning

Not written yet. The owner has not stated how DeckAgent differs from another presentation tool. VISION W-1 forbids a claim that DeckAgent does better than another product. Do not invent one.

## Operating Context

- The user runs DeckAgent from source on their own computer. The web interface is reached only from that machine. Access from another device on the network is not in V1.
- The user works through chat. They ask for a deck and answer the agent's clarifying questions. They look at the slides in the deck canvas and ask for changes in chat.
- The interface lets the user start a new chat, see earlier chats and reopen one with its conversation and deck. One chat holds one deck. V1 has one default workspace, and the user does not pick a folder.
- Chats and decks stay after DeckAgent is closed and reopened. A request that was running when DeckAgent closed does not resume.
- The user sets up models in the Models part of settings: built-in providers, custom model APIs, a model catalog and the saved provider configurations. Each chat has its own selected model.
- The user's chats, decks and files stay on their computer. User content leaves it only in requests to the provider of the selected model (B-3).

## Capabilities and Constraints

In V1:
- Create, preview and refine a deck through chat. The user changes content and structure by asking in chat.
- Clarifying questions from the agent when a request is missing, vague or contradictory.
- Multiple provider configurations, with a model chosen per chat.
- Images: the agent uses images the user attached, and creates new images for slides. How new images are created is undecided.

Not in V1 (`SCOPE.md`):
- Export. V1 ends when the user has reviewed the deck in the web interface.
- Direct editing of the outline text. Light direct editing on a slide (bold, italic, font).
- Terminal interface (TUI). It stays a direction in VISION P-3.
- Changing chat or workspace while a request is active. Workspaces by folder.

Constraints:
- No assumption of one model or one provider (P-1). The provider's own account decides a refused key or a reached usage limit.
- No hosted service run by the DeckAgent team (P-2).
- Use case text carries no interface detail (`docs/spec/_STYLE.md` rule 11). Interface decisions belong to UI design work.

Terms used in the specs: deck, deck canvas, chat, request, provider configuration, built-in provider, custom model API, model catalog, selected model. See `docs/spec/_STYLE.md`. The root `GLOSSARY.md` that `AGENTS.md` mentions does not exist yet.

Undecided (VISION open questions): whether a deck has one author by the nature of DeckAgent or only in this scope (Q-7); whether every interface offers the same results (Q-8); whether a person with only a phone or tablet is excluded (Q-9). B-4 (no DeckAgent account) is proposed, not confirmed.

## Evidence on Hand

- Product spec: `docs/spec/` (vision, nine user segments, use cases, requirements, business rules).
- V1 scope and implementation records: `docs/versions/v1/` (`SCOPE.md`, `PROGRESS.md`, `task-004-local-web.md`, `ui-prototype-alignment-todo.md`).
- UX design work: `docs/design/UX-design/` (V1 UX foundation, UX prototype, interactive prototype, state inventory, transition matrix, Figma annotations and copy).
- Sample slides for the deck canvas: `apps/local-web/src/sample-slides.ts`.
- Absent: user research, testimonials, customers, benchmarks and usage data. Do not make any up.

## Product Principles

1. **The user chooses the model.** The interface never assumes one model or one provider, and never presents the model as DeckAgent's own (P-1).
2. **The user's work stays on their computer.** The interface does not suggest an upload, an account or a hosted service (P-2, B-3).
3. **One harness, several ways in.** The web interface is one way to use DeckAgent, not a separate product (P-3).
4. **Say what failed and what to do next.** For a user-facing failure, state what failed and, when an action exists, what the user can do (`AGENTS.md`).
5. **Claim only what is confirmed.** The interface and its copy promise no benefit, such as saved time or better design, that the owner has not confirmed (W-2).

## Accessibility & Inclusion

No product-specific accessibility standard has been set. Some segments mention a non-native language and the audience's accessibility needs (`docs/spec/02-users/dimensions.md`), all `[assumed]`. Record a required standard here when the owner sets one.
