---
id: BR-000            # BR- and three digits. Equals the file name. Next ID after the highest existing or retired ID; never reused (BRG-11)
title: "<name of the rule>"   # a short name for the rule, not for a step, a use case or an FR
---

<!-- A business rule defines the values that product behavior depends on (BRG-01): an allowed set, a limit, a threshold, a quota, a duration, a retention period, or a defined list of what counts.
     No behavior (that is an FR), no quality target (that is an NFR), no interface design, no architecture, no task, no progress, no version.
     This file names no use case, step, flow, segment, FR, NFR or other BR. Others cite it as [BR-xxx] (BRG-12).
     Before writing, search the statements and values in this folder. A value is defined once (BRG-02, BRG-09).
     Write in plain English: docs/spec/_STYLE.md (BRG-10). -->

## Rule

<!-- Statement: one to three sentences. What the rule governs, without its values. It does not repeat the behavior of the FRs that apply it.
     Status: confirmed (the rule traces to confirmed product behavior, such as a response of a selected use case flow, or to an explicit owner decision) | proposed (the author proposes it). No other value (BRG-05).
     A citation in another file, a draft, a proposed item or an alternative under an open question confirms nothing (BRG-06).
     Source: use case flow | owner decision, yyyy-mm-dd: <what was decided, in words> | proposed.
     Why: required when Status is proposed. Optional when Status is confirmed. When no reason is needed, remove the whole line. Never leave Why empty.
     Updated at: the date of the last change to this file, as dd-mm-yyyy (BRG-14).
     Only an explicit owner decision turns a proposed rule into a confirmed one. A citation, a commit or an implementation confirms nothing (BRG-06). -->

- **Statement:** <what the rule governs>
- **Status:** confirmed
- **Source:** use case flow
- **Why:** <reason>
- **Updated at:** DD-MM-YYYY

## Values

<!-- At least one. One block per value: "### V-n · Short name". IDs are never renumbered (BRG-11).
     Several values can share this file when they belong to one coherent rule (BRG-02).
     Value: exact. A number has a unit. A bound says whether it includes the limit ("at most", "fewer than"). A list says whether it is closed or open. Give an example only for an item that readers can apply in materially different ways (BRG-03).
     A value with the status and the source of the rule has the Value line only. It can add its own Source when another decision set it.
     A value is confirmed only when a confirmed source states the value itself. A [BR-?: topic] marker in a use case confirms no value (BRG-06).
     A value that differs adds three lines after Value:
       - **Status:** proposed | pending
       - **Source:** proposed (for proposed) | owner decision needed (for pending)
       - **Why:** <reason and trade-off> (for proposed) | <what is missing: which decision or evidence> (for pending)
     Pending: Value reads "not set". Never a guessed number, a range or "about" (BRG-07).
     No value is confirmed under a proposed rule (BRG-05).
     To confirm a value: set Value, remove its Status line, set Source to the owner decision with its date (BRG-06). -->

### V-1 · <name of the value>

- **Value:** not set
- **Status:** pending
- **Source:** owner decision needed
- **Why:** <what is missing>

## Not specified

<!-- Aspects of the rule left open that are not one of its values, one line each, ending "Pending owner decision." A value whose decision is open is a pending value, not an item here.
     Do not copy the open question; it stays in the use case. No statement and no value assumes an outcome for these items (BRG-08). Remove this section if empty. -->

## Notes

<!-- Only what belongs neither in the statement nor in a value, for example a split or a merge. Remove this section if empty. -->
