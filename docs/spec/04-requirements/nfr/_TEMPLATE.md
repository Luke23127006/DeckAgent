---
id: NFR-000           # NFR- and three digits. Equals the file name. Next ID after the highest existing or retired ID; never reused (NFG-12)
title: "<name of the quality>"   # a short name for the quality, not for a step, a use case or an FR
---

<!-- A non-functional requirement is a product-level quality constraint under stated conditions (NFG-01).
     Write one only when all four hold: a product commitment or a stated risk needs it; it can be measured or checked; it adds an independent quality constraint and does not only repeat an FR; its target matters to the user, whether or not the user sees it (NFG-02).
     It can relate to an FR, but it never only repeats the FR's behavior or acceptance conditions (NFG-01).
     No behavior (that is an FR), no rule value (that is a BR, cited as [BR-xxx]), no engineering metric, no research threshold, no interface design, no architecture, no tool, no task, no progress, no version.
     This file names no use case, step, flow, segment, FR or other NFR. Others cite it as [NFR-xxx] (NFG-12).
     Before writing, search the statements in this folder (NFG-03).
     Write in plain English: docs/spec/_STYLE.md (NFG-11). -->

## Requirement

<!-- Quality attribute: one, for example performance, reliability, data integrity, security, privacy or accessibility.
     Statement: one to three sentences. The quality the product must have, without the target.
     Status: confirmed (the statement traces to confirmed product behavior, such as a response of a selected use case flow, or to an explicit owner decision) | proposed (the author proposes it). No other value (NFG-05).
     A citation in another file, a draft, a proposed item or an alternative under an open question confirms nothing (NFG-06).
     Source: use case flow | owner decision, yyyy-mm-dd: <what was decided, in words> | proposed.
     Why: required when Status is proposed. Optional when Status is confirmed. When no reason is needed, remove the whole line. Never leave Why empty.
     Updated at: the date of the last change to this file, as dd-mm-yyyy (NFG-14).
     Only an explicit owner decision turns a proposed statement into a confirmed one. A citation, a commit or an implementation confirms nothing (NFG-06). -->

- **Quality attribute:** <attribute>
- **Statement:** <the quality the product must have>
- **Status:** confirmed
- **Source:** use case flow
- **Why:** <reason>
- **Updated at:** DD-MM-YYYY

## Verification

<!-- At least one measurement. One block per measurement: "### M-n · Short name". IDs are never renumbered (NFG-12).
     Conditions: the state, the inputs and the environment, well enough to repeat. Cite rule values as [BR-xxx].
       State the boundary: product-controlled (a part of the result DeckAgent controls) or end-to-end (the whole result the user experiences, which can include provider time).
       Name the provider-dependent conditions that can change the result. Never leave provider time out silently. Never present provider performance as a DeckAgent guarantee (NFG-08).
     Measure: the quantity measured, or the property checked.
     Method: how it is measured or checked, in words. No tool, no architecture.
     Target: a value with its unit and bound, or the required property. A security, privacy or data-integrity check can be a property with no number (NFG-08).
     Met when: what counts as meeting the target, for example every run or a stated share of runs.
     Conditions, Measure and Method must be clear enough to verify the requirement. They never read "not set". A field that cannot be completed yet states what is known, and a Not specified item names the gap. That is a documentation gap, not a pending target (NFG-08).
     A measurement with the status and the source of the NFR has no Status line. It can add its own Source when another decision set its target.
     A measurement that differs adds three lines after Met when:
       - **Status:** proposed | pending
       - **Source:** proposed (for proposed) | owner decision needed | evidence needed (for pending)
       - **Why:** <reason and trade-off> (for proposed) | <what is missing: which decision or measurement> (for pending)
     Pending: Target and Met when read "not set". Never a guessed number, a range or "about" (NFG-07). A target is confirmed only when a confirmed source states the target itself; a [NFR-?: topic] marker confirms none (NFG-06).
     No target is confirmed under a proposed statement (NFG-05).
     To confirm a target: set Target and Met when, remove the Status line, set Source to the owner decision with its date (NFG-06). -->

### M-1 · <name of the measurement>

- **Conditions:** <state, inputs and environment; the boundary: product-controlled or end-to-end; the provider-dependent conditions>
- **Measure:** <quantity or property>
- **Method:** <how it is measured or checked, in words>
- **Target:** not set
- **Met when:** not set
- **Status:** pending
- **Source:** evidence needed
- **Why:** <what is missing>

## Not specified

<!-- Aspects left open that are not a target, one line each, ending "Pending owner decision." A gap in a measurement definition that needs technical evidence ends "Pending technical evidence."
     A target whose decision is open is a pending target, not an item here.
     Do not copy the open question; it stays in the use case. No statement and no measurement assumes an outcome for these items (NFG-09). Remove this section if empty. -->

## Notes

<!-- Only what belongs neither in the statement nor in a measurement, for example a split or a merge. Remove this section if empty. -->
