# Ideal product spec — open design questions

This file is the design backlog of the ideal spec (`docs/spec/`). It holds the questions the Product Owner has not decided. The spec files name none of them as decided behavior, and nothing in this file is an answer. The spec stays version-free; which version takes which behavior is a scope decision under `docs/versions/`.

Maintained by hand. Resolve a question by recording the decision, then move the change into the affected spec files with it.

## Workspace and chats (UC-013, UC-012, BR-004)

- What display name a new workspace gets, whether the user can change it later, and whether display names must be unique [BR-?].
- Which workspaces the product sets up by default besides the default workspace, if any [BR-?].
- Whether adding the same folder again as a workspace binds the chats it had, or starts without them.

## Requests that stopped or failed early (UC-002, UC-003 Note 18, UC-006, UC-008)

- After a stop or a failure, which deck does a later try-again action start from: the deck as the work left it, or the deck before the request?
- What work runs again: the whole request, or only the changes not yet made?
- How the system avoids making the same change twice, for example adding the same new slide again.
- Which causes of a failure keep the user from sending a new request (FR-019).
- Whether a stop takes effect at once (UC-003 Note 10).

## Keys and providers (UC-005, BR-005, BR-006)

- Whether the system checks the key with the provider beyond the check at saving (UC-005 A6), and what that check covers.
- What each built-in provider needs besides a key, and which of its default settings the user can change [BR-006]. Its base URL can change only where the provider allows it. Each answer waits for checks with the provider.
- How the system knows that a custom model API needs a key, and whether the user can change the API protocol of a saved custom model API [BR-006].
- Which built-in providers have default models, and their model IDs, with each release [BR-005].
- The model settings each added model holds in practice: its display name within the provider configuration, its context window, its highest output, its kinds of input. Which providers report them, and for which models [BR-005]. Values wait for evidence from each provider and from the implementation.
- The reasoning levels of each added model, and the API value each level uses for each provider [BR-005]. Values wait for evidence from each provider and from the implementation.

## Context and compact (UC-015)

- Does the provider report a context usage for each of its models, and which of the numbers shown are exact? This is a quality-target question for an NFR [NFR-?].

## Session export (UC-016)

- Which parts of a session the archive holds beyond the conversation, the request records, the outline and deck state, and the attachments.
- What counts as a decision recorded in the conversation, and how the export marks it.
- Where the system puts the files of an export and how it names them.
- Whether an export warns about content the user gave that holds a secret, such as an attached file with a password. The export keeps out the credentials DeckAgent keeps, and it changes nothing in the content the user gave (FR-080).
- Import and restore of a session archive: the ideal product has no such behavior (the flow ID UC-016 A4 is retired). Worth research only if the owner wants a backup or a migration capability.

## Deck editing, design and history (UC-001, UC-002, UC-007, UC-008, UC-010, UC-011, UC-017)

- Does every first draft offer design options, or only when the user asks (UC-001 A36)?
- Can the user choose a layout for each slide, or only a visual style for the deck (UC-001 A36)?
- Does a pattern come only from a file, or also from the deck of an earlier chat (UC-001 Note 16)?
- Does the question about a missing topic (UC-001 A32) also cover missing material and material that disagrees with itself (UC-001 Note 20)?
- Does a follow-up request ever replace the whole deck with a new topic, and what does the system offer then (UC-002 Note 18)?
- Is a design diagnosis of a slide offered: judging a slide against its purpose and naming the problems to change?
- Does every first draft get presenter notes, or only when the request asks for them (UC-001 A37)?
- Can the user change presenter notes by hand (UC-001 A37)?
- The user changed a slide by hand (UC-007). A later request changes that slide, or every slide. What happens to the change by hand (UC-002)?
- Can the system tell a change by hand from a change it made, and does it say so before it changes such a slide (UC-002)?
- Does a change of slide design leave a state in the deck history (UC-002 A8, UC-008)?
- When a request changes a slide, do its presenter notes change with it (UC-002 A9)?
- Which changes a basic edit offers: text only, or also adding, deleting, duplicating and moving slides (UC-007)?
- Can the user change the deck by hand while the system works on a request (UC-007)?
- Which parts of a slide can the user change by hand [BR-?] (UC-007 A6)?
- Does a change by hand make a new state of the deck in its history, and does the conversation record it (UC-007)?
- Is undo the same behavior as going back to an earlier state (UC-007 A5, UC-008)?
- Can the user delete the only slide of the deck (UC-007 A2)? Does every interface offer changes by hand (Vision Q-8)?
- After a change by hand, does undo take back only that change, also the later change, or is undo not offered then (UC-007 A9)?
- When does the system keep a state of the deck: after each request, after each change by hand, or when the user chooses [BR-?]. After going back, are the newer states still there (UC-008)?
- Can the user look at a state without going back to it? Are the states there after DeckAgent was closed (UC-008)?
- Does a request that stopped or failed leave a state (UC-008)? Does going back change what the model knows at the next request? What does the user see when going back fails partway (UC-008)?
- How does the system tell a question about the deck from a request to change it (UC-009, UC-011)?
- When a request asks a question and a change, does the system do both, or answer only (UC-009 A2)?
- Can an answer to a deck question use sources outside the deck and the user's material, such as the web (UC-009)?
- Is a question about something other than this deck part of the same use case (UC-009)?
- What does the system compare the deck with to find gaps (UC-009 A5)?
- Which built-in design systems DeckAgent offers, and which of the supported brand attributes each one holds [BR-?] (UC-010).
- Which design rules can a design system hold, and which can a visual style hold [BR-?]. Does reading a brand guide need the model the user set up (UC-010, UC-017)?
- Can the user make one design system the default for new decks (UC-010)?
- Is a variant in the same chat as the original, or in a new chat (UC-011)? What happens to a variant that is half made when a stop or a failure ends the work (UC-011 Note 4)?
- Does the variant use the material the user gave for the original (UC-011)? Does it have its own deck history (UC-008)? When the original changes later, does the variant change too (UC-011)?
- How does the system tell a request for a variant from a request to change the deck (UC-002, UC-011)?
- Can the user export several variants at once (UC-004, UC-011)?

## Chats and earlier work (UC-006, BR-004)

- Which earlier work can the user open: only chats, or also an exported file (UC-006)?

## Security and privacy constraints (NFR)

- The range of computers on which the performance targets must hold (NFR-001, NFR-011, NFR-012, NFR-014).
- The providers and models under which the performance targets must hold (NFR-002, NFR-012).
- Which Windows versions, hardware and browsers the build-and-run targets must hold on (NFR-014).
- Which screen readers and browsers the accessibility checks use (NFR-013).
- Which languages DeckAgent commits to, beyond Vietnamese and English as the languages checked first (NFR-009).
- Whether other programs of the same user on the computer can read a saved key (NFR-006).

## Architecture research, no product decision needed now (UC-003 Note 34)

- Several open views and windows, and several running copies of DeckAgent.
- A work loop with no bound, and a request whose provider sends nothing.
- Use of the model, of money and of the computer by one request.
- How the system makes a new image, and which part of the product does it; how it knows a valid way is available; what it does with a model that cannot take images as input; how images reach the agent within the agent-access and egress bounds [NFR-003] [NFR-007].
- How the real image capabilities of each provider and model are checked.
- How a saved key is protected from other programs on the computer.

## Awaiting technical evidence, no product decision needed now

- The unit and the maximum of the request length [BR-002] (UC-003).
- The number of attachments per request, and the size of one attachment [BR-001] (BR-001).
