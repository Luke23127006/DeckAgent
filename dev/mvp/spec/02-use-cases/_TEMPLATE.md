---
id: UC-000
title: ""
---

<!-- A use case models product behavior for one user goal reached in a single sitting (UCG-01).
     Write per dev/mvp/spec/_STYLE.md. Write intent and response, not interface (rule 11, UCG-09).
     The interaction diagram is a view generated from the Steps table and Alternative flows; do not hand-edit it (MG-02). -->

## Interaction diagram

<!-- Generated from the Steps table and Alternative flows. Do not edit between the markers. -->

<!-- BEGIN generated: use-case-sequence -->
```mermaid
sequenceDiagram
  participant U as User
  participant S as System
  U->>S: user intent
  S-->>U: system response
```
<!-- END generated: use-case-sequence -->

## Steps

<!-- This table is the source of truth; the diagram above is generated from it. One row per step S1, S2, ... in order.
     User: intent ("Pick a story"), not an action on a control.
     System: what the user observes; no "if", no settings, no interface. Cite values with [BR-xxx]/[NFR-xxx]; not written yet: [BR-?: topic].
     FR: the functional requirement ID for this response, or FR-? when there is no FR yet. A response can have several FRs. Leave blank when the step needs no FR of its own.
     Evidence: a tag from _STYLE.md, only when the step claims something about the product. Leave blank if not. -->

| Step | User | System | FR | Evidence |
|---|---|---|---|---|
| S1 |  |  | FR-? |  |

## Alternative flows

<!-- One block per alternative. Stable IDs, never renumbered (UCG-06).
     At: the step the alternative starts from, e.g. "S3". Ends: one of:
       Back to Sx / Continue at Sx / Same step / End / To UC-xxx / To UC-? (topic)
     When: a condition the system can detect, or a user intent (UCG-04).
     Fixed fields in order: At, Ends, When, System, FR. -->

### A1 · alternative name

- **At:** S?
- **Ends:** Back to S?
- **When:**
- **System:**
- **FR:** FR-?

## Situation and goal

<!-- Who wants what, and why now, in the user's words. No feature or solution (UCG-02). -->

## Trigger and precondition

<!-- Trigger: what starts the case. Precondition: what is already true. Both observable, no settings, no interface. -->

- **Trigger:**
- **Precondition:**

## Outcome and minimal guarantee

<!-- Outcome: what is true after success, verifiable by observation. Minimal guarantee: what stays true after any branch fails (UCG-05). -->

- **Outcome:**
- **Minimal guarantee:**

## Product evidence

<!-- Coverage level only: observed | none | unverified. Raw observations live in dev/mvp/research/ (UCG-08).
     Differences described in prose, not rule values. Add one block per reference product. -->

### product name

- **Coverage:** unverified
- **Research link:**
- **Differences:**

## Open questions

<!-- Each question has "?". Omit this section if empty. -->

## Notes

<!-- Why this case does not duplicate another; a design choice as one line that links its proposal in dev/mvp/decisions/. Omit if empty. -->
