---
title: "Product vision: a local-first deck harness with the user's own key"
status: Accepted
decided_by: owner
decided_on: 2026-10-09
replaces: "The earlier idea of a hosted web app with user accounts, cloud storage and sharing by link."
---

# Product vision

This file records what kind of product DeckAgent is. Every other file in `docs/spec/` must stay true to it.

It decides no scope. Scope stays on each use case in `../03-use-cases/`.

## The product in one paragraph

DeckAgent is a program that runs on the user's own computer. The user gives it a request and material. It uses a language model to build a deck. The user brings their own key for a model provider (BYOK). The product has no model account of its own. Chats, decks and files stay on the user's computer.

## Architecture in brief

| Part | Decision |
|---|---|
| Where it runs | On the user's computer. No server run by the product stores user data or does user work. |
| Model access | The user's own key for a model provider the user chooses. |
| Where data lives | Chats, decks, attachments and settings are files on the user's computer. |
| Ways to use it | A terminal and a local web page. Both use one engine, and both open the same chats and decks. |
| The local web page | The engine serves it to a browser on the same computer. It is not a site for other people. |
| What leaves the computer | The requests the user sends to the model provider. Third-party sources are an open question below. |
| What the product gives | Files on the user's computer: an editable deck file and a fixed deck file. |

## Two ways in, one behavior

- A use case states intent and response and names no control (style rule 11). So one use case is true in both ways in.
- A zone is a place where a kind of information lives. It is not an area of the screen.
- In the local web page, the deck canvas shows the slides.
- In the terminal, how the deck canvas shows the slides is open (see Open questions).

## What the product does not have

These exclusions are absolute. No use case may describe them, even as an alternative flow.

1. **Cloud hosting.** No server run by the product stores user data or runs user work.
2. **User accounts.** There is no sign-up, sign-in, profile or plan. The only account is the user's own account with their model provider.
3. **Real-time collaboration.** There is no shared editing, no comment and no live change between people.
4. **Sharing a deck by a link.** There is nothing hosted to link to. The user shares the exported file. The earlier plan for a read-only link is cancelled.
5. **A way to present.** The user presents from the exported file in their own tools.
6. **A reader or editor for other people's deck files.** A deck file the user gives is only material or a pattern.

## What the product does have, in the same spirit

- A basic edit of a deck the product made, on the deck canvas of the local web page. It is a candidate use case that is not yet written.
- Export to an editable file and to a fixed file. The file types are a business rule.
- Reopening an earlier chat. It reads files on the computer and needs no sign-in.

## What follows for the specs

- Export writes a file on the computer. It needs no network.
- Failures come from three outside causes. They are the key, the provider's limit and the network.
- A use case never needs an account or a server run by the product. It never needs a second person.
- Where the work runs and where state is kept is architecture. It is recorded in `docs/adr/`, not in a use case.

## Open questions

1. How does the terminal show the deck canvas? Does it also offer voice input? Resolved by: owner.
2. Does a request keep running when the user closes the terminal or the local web page? The use cases promise that the user comes back to the same state after leaving or reloading. Resolved by: owner, with an ADR.
3. Can the user connect third-party sources, such as a cloud drive? A product with no server must run that connection on the computer. Resolved by: owner.
