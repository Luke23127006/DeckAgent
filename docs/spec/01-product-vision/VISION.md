---
id: VIS-001
title: "An open-source AI agent harness for making presentations"
status: Draft
---

<!-- Write in plain English: docs/spec/_STYLE.md (VG-12). Gate: _CRITERIA.md. Template: _TEMPLATE.md. -->

## What DeckAgent is

### I-1 · A harness for presentations

- **Statement:** DeckAgent is an open-source AI agent harness for making presentations. A presentation here is a deck.
- **Status:** confirmed
- **Source:** owner
- **Means for specs:**
  - Every capability in the specs serves making a deck.
- **Updated at:** 09-10-2026

### I-2 · Agent = model + harness

- **Statement:**
  - The **model** is the AI model the user chooses and connects with their own key.
  - The **harness** is what DeckAgent builds: tools, a place to run them, and the logic that directs the work.
  - The **agent** is the model working inside the harness.
  - DeckAgent does not build, train or host a model of its own. Its own work is the harness.
- **Status:** confirmed
- **Source:** owner
- **Means for specs:**
  - No spec needs DeckAgent to build, train or host a model.
- **Updated at:** 09-10-2026

## Why DeckAgent exists

### W-1 · The gap DeckAgent fills

- **Statement:**
  - An AI model can understand a request, write content and decide what to do next.
  - To make a presentation itself, the model needs tools and a place to run them.
  - DeckAgent exists to connect the model's reasoning with the work of making a presentation.
  - It is for a user who wants a presentation made from their request.
- **Status:** confirmed
- **Source:** owner
- **Evidence:** [assumed: no user research yet shows this need or how common it is]
- **Means for specs:**
  - No spec states a user pain, such as lost time or weak design, without its own evidence.
  - No spec claims that DeckAgent does better than another product.
- **Updated at:** 09-10-2026

### W-2 · The main value

- **Statement:**
  - DeckAgent lets the user turn a request for a presentation into a presentation, with the model they chose.
  - The value lies in the harness built for presentations (I-2), not in a new model.
  - P-1 and P-2 guide how DeckAgent gives this value.
- **Status:** confirmed
- **Source:** owner
- **Evidence:** [assumed: no user research yet shows how users value this]
- **Means for specs:**
  - No spec promises a benefit the owner has not confirmed, such as saved time, lower cost or better design.
- **Updated at:** 09-10-2026

## Principles

### P-1 · The user chooses the model

- **Statement:** The user chooses the model and brings their own key for that model's provider (BYOK). DeckAgent has no model account of its own.
- **Status:** confirmed
- **Source:** owner
- **Why:** not recorded
- **Means for specs:**
  - No spec assumes one model or one provider.
  - A refused key or a reached usage limit belongs to the user's own provider account.
- **Updated at:** 09-10-2026

### P-2 · Open source, run by the user

- **Statement:** DeckAgent is open source. The user gets the source code, builds it and runs it on their own computer. It needs no hosted service run by the DeckAgent team.
- **Status:** confirmed
- **Source:** owner
- **Why:** not recorded
- **Means for specs:**
  - No spec needs a service, a web app or a server run by the DeckAgent team.
- **Updated at:** 09-10-2026

### P-3 · One harness, several ways in

- **Statement:** DeckAgent aims to offer a terminal interface (TUI) and a local web interface. Both use one core harness. They are ways to use DeckAgent, not two products.
- **Status:** confirmed
- **Source:** owner
- **Why:** not recorded
- **Means for specs:**
  - This direction fixes neither which interface exists now nor which one is in scope. `00-current-scope/` says that.
  - A use case states intent and response (`_STYLE.md` rule 11), so it holds for every interface.
  - No spec describes the two interfaces as separate products.
- **Updated at:** 09-10-2026

## Boundaries

### B-3 · The user's work stays local

- **Statement:** The user's chats, decks and files stay on the user's computer. Only what the harness sends to the model provider leaves it.
- **Status:** proposed
- **Source:** proposed by an agent, inferred from P-1, P-2 and the earlier vision
- **Why:** not recorded
- **Updated at:** 09-10-2026

### B-4 · No DeckAgent account

- **Statement:** DeckAgent has no user account of its own. The user signs in to nothing to use it. Their only account is with their model provider.
- **Status:** proposed
- **Source:** proposed by an agent, inferred from P-1, P-2 and the earlier vision
- **Why:** not recorded
- **Updated at:** 09-10-2026

## Open questions

### Q-7 · One person or several

- **Question:** Is each deck made by one person, by the nature of DeckAgent? Or is that only a limit of the current scope? This covers working together on a deck and sharing it by a link.
- **Affects:** USR-002 H-3, USR-005 H-4
- **Resolved by:** owner
- **Updated at:** 09-10-2026

### Q-8 · What every interface offers

- **Question:** Does every interface let the user reach the same results? Examples are seeing the slides and opening the same chats and decks.
- **Affects:** UC-001 S5, UC-001 S6, UC-002 S3
- **Resolved by:** owner
- **Updated at:** 09-10-2026

### Q-9 · Phones and tablets

- **Question:** Does "runs on the user's computer" leave out a person who has only a phone or a tablet?
- **Affects:** USR-003 H-2
- **Resolved by:** owner
- **Updated at:** 09-10-2026

## Retired

- D-1 (runs on the user's computer): now P-2. Its earlier reason is not carried over. The owner has not restated a reason.
- D-2 (the user's own model key): now P-1.
- D-3 (data stays on the computer): now B-3, proposed. That data is kept as files is an ADR matter.
- D-4 (a terminal and a local web page): now P-3, as a direction. "Both open the same chats and decks" is Q-8.
- D-5 (export to files): a capability. It stays in UC-004 and is not part of what DeckAgent is.
- D-6 (a basic edit of a deck, proposed): a capability. It waits for a use case and the owner's decision.
- M-1 (the product is hosted): covered by P-2.
- M-2 (the product has user accounts): now B-4, proposed.
- M-3 (people work on a deck together): now Q-7.
- M-4 (a deck can be shared by a link): now Q-7.
- M-5 (the product presents the deck): a capability. It stays in UC-004 notes.
- M-6 (the product reads or edits other people's decks): a capability. It stays in UC-001 and UC-004.
- Q-1 (the deck canvas in the terminal): interface design. The part that defines the product is Q-8.
- Q-2 (work after the user leaves): an architecture question for an ADR. UC-003 notes keep it.
- Q-3 (third-party sources): a capability. UC-003 A4 keeps it.
- Q-4 (voice input in the terminal): a capability. UC-003 A2 keeps it.
- B-1 (independent of reference products): not a boundary. It described research and how choices are made. Its claim about the core engine of DeepSeek Harness was not confirmed. How the agent runtime is built is open.
- B-2 (no capability by convention): not a boundary. It is a rule for writing specs. VG-14 in `_CRITERIA.md` states it for the vision.
- Q-5 (the problem DeckAgent solves): answered by the owner in W-1.
- Q-6 (the main value for the user): answered by the owner in W-2.
