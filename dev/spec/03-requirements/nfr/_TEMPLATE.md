---
id: NFR-000
title: ""
updated: DD-MM-YYYY
---

<!-- An NFR is a product-level quality constraint under a stated condition (NFG-01).
     Write it only when all four hold: a product commitment or risk needs it; it is measurable/checkable; it adds an independent constraint rather than repeating an FR; the target is meaningful to the user (NFG-02).
     No behavior (that is an FR), no rule values (that is a BR, cite [BR-xxx]), no engineering metric, no interface, no architecture, no progress.
     This file does not name a use case, step, branch, FR, or another NFR. Other files cite [NFR-xxx].
     Write per dev/spec/_STYLE.md. -->

## Requirement

<!-- Quality attribute: one, e.g. performance, reliability, data integrity, security, privacy.
     Statement: the product quality that must hold, without a target.
     Status: confirmed | proposed. Why optional, drop the line when no reason is needed. -->

- **Quality attribute:**
- **Statement:**
- **Status:** confirmed
- **Why:**

## Verification

<!-- At least one measure. One block per measure: "### M-n · name". IDs are not renumbered (NFG-08).
     Condition: the state, input, and environment, enough to repeat; state the product-controlled or end-to-end boundary; state provider-dependent conditions, do not silently hide provider time.
     Measure: the quantity measured or the property checked. How to measure: how it is measured/checked, in prose, no tool, no architecture.
     Target: a value with unit and bound, or a required property (a security/privacy check may be a non-numeric property). "not set" while pending; do not guess a number.
     Passes when: what counts as a pass. "not set" while pending. -->

### M-1 · measure name

- **Condition:**
- **Measure:**
- **How to measure:**
- **Target:** not set
- **Passes when:** not set

## Undecided

<!-- An open aspect that is not a target, one line per item, ending "Pending decision." (or "Pending technical evidence." when evidence is missing to define it).
     An undecided target is "not set", not an item here. Omit this section if empty. -->

## Notes

<!-- Only what belongs in neither the statement nor a measure, e.g. a split or merge. Omit this section if empty. -->
