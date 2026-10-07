---
id: USR-000
name: ""              # short label for the situation, not a job title alone (U-02)
status: Draft         # Draft | Active (no scope or release value belongs here)
seed: ""              # one sentence: the concrete imagined person this segment started from (U-02)
dimensions:           # key = dimension name from dimensions.md in snake_case; list only dimensions that deviate from the baseline (unlisted = baseline); categorical dimensions are always listed (U-02, U-03)
  purpose: ""         # example key; knowledge dimensions are rated in the Knowledge table, not here
  stakes: ""
---

## Who

<!-- 1-2 sentences: who these people are and what brings them to DeckAgent. No features, no named individuals (U-01, U-04). -->

## Needs

<!-- One row per need. Goal in the user's words + the situation (when, where, why now). No solutions (U-04). Tag every row (U-06).
     "Use cases" lists the UC IDs that serve this need. This file is the parent: use cases do not point back to it (U-11).
     Write "none yet" while no use case exists. That marks a need still to be served, not a decision. -->

| ID | Goal (user's words) | Situation | Use cases | Source |
|---|---|---|---|---|
| N-1 | | | none yet | [assumed] |

## Knowledge

<!-- All four kinds, scale in _CRITERIA.md section 3 (U-05). "In practice" = what they can and cannot do because of this level. -->

| Kind | Level | In practice | Source |
|---|---|---|---|
| Domain (the topic they present) | | | |
| Presentation craft | | | |
| AI / tool literacy | | | |
| Language of use (what they write requests in) | | | |
| Language of the deck and its audience | | | |

## Context of use

<!-- Device, connectivity, time pressure, who sees the output, privacy or organization rules, budget. Tag claims (U-06). -->

1.

## Pain points and workarounds today

<!-- What they do now, with or without competitor products, and where it hurts. Tag claims (U-06). -->

1.

## Accessibility and situational limits

<!-- Permanent, temporary and situational. Write "None identified: <reason>" if none (U-09). -->

| Type | Limit | Effect on use | Source |
|---|---|---|---|
| | | | |

## Special-case hypotheses

<!-- Situation -> what the product would have to handle. These seed use case variants and requirements (U-08, U-11).
     "Affects" names the area of the product. "Handled by" names where a use case handles it, as UC-xxx.S3 or UC-xxx.A2,
     or "none yet", or "rejected: <reason>" (U-11). If no hypotheses are found, write "None found: <reason>". -->

| ID | Hypothesis | Affects | Handled by | Source |
|---|---|---|---|---|
| H-1 | | | none yet | [assumed] |

## Open questions

<!-- Each has "?" and who will resolve it (U-12). Remove the section if empty. -->

## Notes

<!-- Relation to other segments (why they are distinct, U-07). Do not record scope or release decisions here. Remove if empty. -->
