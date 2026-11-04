---
id: USR-000
name: ""              # short label for the situation, not a job title alone (U-02)
status: Draft         # Draft | Active (no scope or release value belongs here)
seed: ""              # one sentence: the concrete imagined person this segment started from (U-02)
dimensions:           # key = dimension name from dimensions.md in snake_case; list only dimensions that deviate from the baseline (unlisted = baseline); categorical dimensions are always listed (U-02, U-03)
  purpose: ""         # example key; knowledge dimensions are rated in the Knowledge section, not here
  stakes: ""
---

<!-- Write in plain English: docs/spec/_STYLE.md (U-13). One block per need and per hypothesis; lists for the rest.
     Evidence: every item has a tag (U-06). A list may end with one "Evidence" bullet that covers every item above it that has no Evidence line of its own. -->

## Who

<!-- 1-2 short sentences: who these people are and what brings them to DeckAgent. No features, no named individuals (U-01, U-04). -->

- 
- **Evidence:** [assumed]

## Needs

<!-- One block per need. Goal in the user's words + the situation (when, where, why now). No solutions (U-04).
     Heading: "### N-x · Short name" (5 words or fewer). Fixed fields: Goal, Situation, Use cases, Evidence, Updated at.
     Updated at: the date of the last change to this block, as dd-mm-yyyy, always the last field (U-14). Set it on every edit to the block.
     "Use cases" lists the UC IDs that serve this need. This file is the parent: use cases do not point back to it (U-11).
     Write "none yet" while no use case exists. That marks a need still to be served, not a decision. -->

### N-1 · Short name

- **Goal:** ""
- **Situation:**
- **Use cases:** none yet
- **Evidence:** [assumed]
- **Updated at:** DD-MM-YYYY

## Knowledge

<!-- Five bullets, in this order, scale in _CRITERIA.md section 3 (U-05).
     Format: "**Kind:** Level. What they can and cannot do because of this level." -->

- **Domain (the topic they present):** Level.
- **Presentation craft:** Level.
- **AI / tool literacy:** Level.
- **Language of use (what they write requests in):** Level.
- **Language of the deck and its audience:** Level.
- **Evidence:** [assumed]

## Context of use

<!-- Device, connectivity, time pressure, who sees the output, privacy or organization rules, budget. One fact per bullet (U-06). -->

-
- **Evidence:** [assumed]

## Pain points and workarounds today

<!-- What they do now, with or without competitor products, and where it hurts. One fact per bullet (U-06). -->

-
- **Evidence:** [assumed]

## Accessibility and situational limits

<!-- Permanent, temporary and situational. One block per limit. Heading: "### Type". Fixed fields: Limit, Effect on use, Evidence, Updated at.
     Write "None identified: <reason>" in Limit if there is none (U-09). -->

### Permanent

- **Limit:**
- **Effect on use:**
- **Evidence:** [assumed]
- **Updated at:** DD-MM-YYYY

## Special-case hypotheses

<!-- Situation -> what the product would have to handle. These seed use case variants and requirements (U-08, U-11).
     Heading: "### H-x · Short name". Fixed fields: Situation, Product would have to, Affects, Handled by, Evidence, Updated at.
     "Affects" names the area of the product. "Handled by" names where a use case handles it, as UC-xxx.S3 or UC-xxx.A2,
     or "none yet", or "rejected: <reason>" (U-11). If no hypotheses are found, write "None found: <reason>". -->

### H-1 · Short name

- **Situation:**
- **Product would have to:**
- **Affects:**
- **Handled by:** none yet
- **Evidence:** [assumed]
- **Updated at:** DD-MM-YYYY

## Open questions

<!-- Each has "?" and who will resolve it (U-12). Remove the section if empty. -->

## Notes

<!-- Relation to other segments (why they are distinct, U-07). Do not record scope or release decisions here. Remove if empty. -->
