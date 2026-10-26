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
     An open question never becomes a target or a Not specified item. It goes to the design backlog of the ideal spec, outside docs/spec/ (NFG-06).
     Write in plain English: docs/spec/_STYLE.md (NFG-11). -->

## Requirement

<!-- Quality attribute: one, for example performance, reliability, data integrity, security, privacy or accessibility.
     Statement: one to three sentences. The quality the product must have, without the target.
     Why: optional. A trade-off or a boundary the statement cannot show, in one short line. Remove the line when no reason is needed. Never leave it empty.
     Updated at: the date of the last change to this file, as dd-mm-yyyy (NFG-14).
     No Status and no Source of approval. The blocks that cite the statement are its record (NFG-05). -->

- **Quality attribute:** <attribute>
- **Statement:** <the quality the product must have>
- **Updated at:** DD-MM-YYYY

## Verification

<!-- At least one measurement. One block per measurement: "### M-n · Short name". IDs are never renumbered (NFG-12).
     Conditions: the state, the inputs and the environment, well enough to repeat. Cite rule values as [BR-xxx].
       State the boundary: product-controlled (a part of the result DeckAgent controls) or end-to-end (the whole result the user experiences, which can include provider time).
       Name the provider-dependent conditions that can change the result. Never leave provider time out silently (NFG-07).
     Measure: the quantity measured, or the property checked.
     Method: how it is measured or checked, in words. No tool, no architecture.
     Target: a value with its unit and bound, or the required property. A security, privacy or data-integrity check can be a property with no number (NFG-07).
     Met when: what counts as meeting the target, for example every run or a stated share of runs.
     Target and Met when read "not set" while no target is decided, and the block then carries a one-line Why naming what is missing (NFG-06).
     Never a guessed number, a range or an "about" (NFG-05).
     Conditions, Measure and Method always state what is known; they never read "not set" (NFG-07). -->

### M-1 · <name of the measurement>

- **Conditions:** <state, inputs and environment; the boundary: product-controlled or end-to-end; the provider-dependent conditions>
- **Measure:** <quantity or property>
- **Method:** <how it is measured or checked, in words>
- **Target:** not set
- **Met when:** not set
- **Why:** <what is missing>

## Notes

<!-- Only what belongs neither in the statement nor in a measurement, for example a split or a merge, or the boundary another requirement covers.
     No decision history and no owner-decision dates (NFG-05). Remove this section if empty. -->
