---
id: BR-000            # BR- and three digits. Equals the file name. Next ID after the highest existing or retired ID; never reused (BRG-11)
title: "<name of the rule>"   # a short name for the rule, not for a step, a use case or an FR
---

<!-- A business rule defines the values that product behavior depends on (BRG-01): an allowed set, a limit, a threshold, a quota, a duration, a retention period, or a defined list of what counts.
     No behavior (that is an FR), no quality target (that is an NFR), no interface design, no architecture, no task, no progress, no version.
     This file names no use case, step, flow, segment, FR, NFR or other BR. Others cite it as [BR-xxx] (BRG-12).
     Before writing, search the statements and values in this folder. A value is defined once (BRG-02, BRG-09).
     A value the owner has not decided reads "not set" with a one-line Why; it never becomes a guessed number (BRG-05, BRG-06).
     Write in plain English: docs/spec/_STYLE.md (BRG-10). -->

## Rule

<!-- Statement: one to three sentences. What the rule governs, without its values. It does not repeat the behavior of the FRs that apply it.
     Why: optional. A trade-off or a boundary the statement cannot show, in one short line. Remove the line when no reason is needed. Never leave it empty.
     Updated at: the date of the last change to this file, as dd-mm-yyyy (BRG-14).
     No Status and no Source of approval. The blocks that cite the rule are its record (BRG-05). -->

- **Statement:** <what the rule governs>
- **Updated at:** DD-MM-YYYY

## Values

<!-- At least one. One block per value: "### V-n · Short name". IDs are never renumbered (BRG-11).
     Several values can share this file when they belong to one coherent rule (BRG-02).
     Value: exact. A number has a unit. A bound says whether it includes the limit ("at most", "fewer than"). A list says whether it is closed or open. Give an example only for an item that readers can apply in materially different ways (BRG-03).
     A value that no decision has set yet reads "not set" and carries a one-line Why naming what is missing (BRG-06). Never a guessed number, a range or an "about" (BRG-05). -->

### V-1 · <name of the value>

- **Value:** not set
- **Why:** <what is missing>

## Notes

<!-- Only what belongs neither in the statement nor in a value, for example a split or a merge, or the boundary another rule covers.
     No decision history and no owner-decision dates (BRG-05). Remove this section if empty. -->
