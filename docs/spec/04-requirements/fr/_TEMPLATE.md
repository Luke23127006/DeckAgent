---
id: FR-000            # FR- and three digits. Equals the file name. Next ID after the highest existing or retired ID; never reused (FRG-11)
title: ""             # a short name for the behavior, not for a step or a use case
---

<!-- A functional requirement states one system behavior under a stated condition (FRG-01). What the system shows, keeps, changes, creates or refuses.
     No user goal or journey, no rule value ([BR-xxx]), no quality target ([NFR-xxx]), no interface design, no architecture, no task, no progress.
     No field for status, owner decision, version, priority, progress, research, use case or segment (FRG-04, FRG-05).
     Use cases cite this FR from their flows; this file names no use case, step, flow or segment (FRG-12).
     Before writing, search the statements in this folder. A behavior an FR already covers gets no second FR (FRG-02).
     An open question never becomes a requirement. It goes to the design backlog of the ideal spec, outside docs/spec/ (FRG-06).
     Write in plain English: docs/spec/_STYLE.md. Behavior, not interface: run its interface check and the swap test (FRG-10). -->

## Requirement

<!-- Statement: one to three sentences. "The system ..." Present tense. Cite values as [BR-xxx] / [NFR-xxx]; unwritten: [BR-?: topic] / [NFR-?: topic] (FRG-09).
     Why: optional. A trade-off or a boundary the statement cannot show, in one short line. Remove the line when no reason is needed. Never leave it empty.
     Updated at: the date of the last change to this file, as dd-mm-yyyy (FRG-14).
     No Status and no Source of approval. The flows that cite the statement are its record (FRG-05). -->

- **Statement:**
- **Why:**
- **Updated at:** DD-MM-YYYY

## Acceptance conditions

<!-- At least one. One block per condition: "### AC-n · Short name". IDs are never renumbered (FRG-11).
     Given: the state and the relevant inputs, described well enough to repeat. When: the user's action or the event.
     Then: observable outcomes, one per bullet, no "if". Never the exact words of the model unless a confirmed requirement fixes them.
     Check: deterministic (observable state or an exact invariant) | judged (a person judges meaning or relevance against Then) (FRG-08).
     For model-dependent behavior, write invariants as deterministic conditions and content quality as judged ones, where both apply.
     Each condition adds precision beyond the use case (FRG-03) and is needed by a flow that cites this FR (FRG-12).
     Seven conditions is a reading guide, not a split rule. -->

### AC-1 · Short name

- **Given:**
- **When:**
- **Then:**
  -
- **Check:** deterministic

## Notes

<!-- Only what belongs neither in the statement nor in a condition, for example a split or a merge, or the boundary another FR covers.
     No decision history and no owner-decision dates (FRG-05). Remove this section if empty. -->
