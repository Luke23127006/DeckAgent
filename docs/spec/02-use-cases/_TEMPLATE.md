---
id: UC-000
title: ""             # user + verb + specific object + what distinguishes it, in the user's words (UCG-01)
status: Draft         # Draft | Active
level: user-goal      # user-goal | subfunction (a step reused by several cases)
scope: undecided      # mvp | later | undecided (UCG-09)
scope_reason: ""      # one line: why this scope, with evidence if any (UCG-09)
ships_in_mvp: []      # for mvp: the main flow and the alternative flows that ship, for example [MF, A1, A3] (UCG-09)
includes: []          # use cases this one calls as a whole
extended_by: []       # use cases that add an optional behavior here, with the step, for example [UC-005 at S4]
next: []              # use cases that normally come after this one
                      # Relations point down or forward only. Never name a segment or a hypothesis here (UCG-01, UCG-07, UCG-10).
---

## Situation and goal

<!-- Who wants what, and why now, in the user's words. No feature or solution (UCG-01, UCG-02). Do not name a segment: 01-users lists this use case. -->

## Trigger and preconditions

<!-- Trigger: what starts the case. Preconditions: what is already true. Both observable, no implementation. -->

- Trigger:
- Preconditions:

## Main flow

<!-- 3 to 9 steps. One system response the user can observe per step. No "if" (UCG-03). IDs are stable; retire, never renumber (UCG-10).
     Requirements column: FR IDs for this response, or FR-? while the requirement is unwritten (UCG-06).
     Rules and quality targets are cited inside the response by ID, never written as values: [BR-xxx], [NFR-xxx].
     Unwritten rule: [BR-?: topic] / [NFR-?: topic], allowed in Draft only. Claims about what a product does are tagged (UCG-08). -->

| Step | Actor action | System response | Requirements |
|---|---|---|---|
| S1 | | | FR-? |

## Alternative flows

<!-- One row per branch. Cover each step that takes input, can be cancelled, uses an external service or can take long, or say why not (UCG-04).
     Same citation rules as the main flow. -->

| ID | At step | Condition the system can detect | System response | Requirements | End |
|---|---|---|---|---|---|
| A1 | S? | | | FR-? | Returns to S? / Ends / Goes to UC-xxx |

## Postconditions and minimal guarantee

<!-- Postconditions: what is true after success, verifiable by observing the product.
     Minimal guarantee: what stays true after any branch fails (UCG-05). -->

- Postconditions:
- Minimal guarantee:

## Product evidence

<!-- Coverage only: observed | not offered | unverified. Raw observations and their values stay in docs/research/use-cases/ (UCG-08).
     This case links the research card; the card does not name this use case. "Difference that matters" in words, no rule values. -->

| Product | Coverage | Research card | Difference that matters |
|---|---|---|---|
| Claude Slide Design | unverified | | |
| Napkin AI | unverified | | |

## Open questions

<!-- Each has "?" and who will resolve it. An Active case has none that changes a flow or result (UCG-10). Remove the section if empty. -->

## Notes

<!-- Why this is not the same case as another. Design choices that become ADR proposals. Do not name segments. Remove if empty. -->
