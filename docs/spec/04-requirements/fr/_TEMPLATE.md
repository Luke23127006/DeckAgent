---
id: FR-000            # FR- and three digits. Equals the file name. Next ID after the highest existing or retired ID; never reused (FRG-11)
title: ""             # a short name for the behavior, not for a step or a use case
---

<!-- A functional requirement states one system behavior under a stated condition (FRG-01). What the system shows, keeps, changes, creates or refuses.
     No user goal or journey, no rule value ([BR-xxx]), no quality target ([NFR-xxx]), no interface design, no architecture, no task, no progress.
     No field for version, priority, progress, evidence, use case or segment. Use cases cite this FR from their flows; this file names no use case, step, flow or segment (FRG-12).
     Before writing, search the statements in this folder. A behavior an FR already covers gets no second FR (FRG-02).
     Write in plain English: docs/spec/_STYLE.md. Behavior, not interface: run its interface check and the swap test (FRG-10). -->

## Requirement

<!-- Statement: one to three sentences. "The system ..." Present tense. Cite values as [BR-xxx] / [NFR-xxx]; unwritten: [BR-?: topic] / [NFR-?: topic] (FRG-09).
     Status: confirmed (a use case flow or an owner decision gives it) | proposed (the author proposes it). No other value (FRG-05).
     Source: use case flow | owner decision, yyyy-mm-dd: <what was decided, in words> | proposed.
     Why: required when Status is proposed. Optional when Status is confirmed. When no reason is needed, remove the whole line. Never leave Why empty.
     Updated at: the date of the last change to this file, as dd-mm-yyyy (FRG-14).
     Only an explicit owner decision changes proposed to confirmed. A citation from a use case interaction or a commit confirms nothing (FRG-06). -->

- **Statement:**
- **Status:** confirmed
- **Source:** use case flow
- **Why:**
- **Updated at:** DD-MM-YYYY

## Acceptance conditions

<!-- At least one. One block per condition: "### AC-n · Short name". IDs are never renumbered (FRG-11).
     Given: the state and the relevant inputs, described well enough to repeat. When: the user's action or the event.
     Then: observable outcomes, one per bullet, no "if". Never the exact words of the model unless a confirmed requirement fixes them.
     Check: deterministic (observable state or an exact invariant) | judged (a person judges meaning or relevance against Then) (FRG-08).
     For model-dependent behavior, write invariants as deterministic conditions and content quality as judged ones, where both apply.
     Each condition adds precision beyond the use case (FRG-03) and is needed by a flow that cites this FR (FRG-12).
     Seven conditions is a reading guide, not a split rule.
     A condition with precision that no flow or owner decision gives adds three lines after Check:
       - **Status:** proposed default
       - **Source:** proposed
       - **Why:** <reason and trade-off>
     Without them, the condition has the status of the FR. The FR is fully approved only when the statement and every condition are confirmed (FRG-05).
     Confirmed statement: when the owner confirms the default, remove the Status line and set Source to the owner decision with its date (FRG-06).
     Proposed statement: keep the override, even when the owner approves the default. The FR stays not fully approved until the statement is confirmed. -->

### AC-1 · Short name

- **Given:**
- **When:**
- **Then:**
  -
- **Check:** deterministic

## Not specified

<!-- Behaviors this FR leaves open on purpose, one line each, ending "Pending owner decision." Do not copy the open question; it stays in the use case.
     No statement and no condition states or assumes an outcome for these items (FRG-07).
     A response that depends whole on an open decision gets no FR: its flow keeps FR-?. Remove this section if empty. -->

## Notes

<!-- Only what belongs neither in the statement nor in a condition, for example a split or a merge. Remove this section if empty. -->
