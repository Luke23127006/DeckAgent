---
id: VIS-001
title: ""             # what DeckAgent is, in a few plain words, with no praise (VG-01, VG-17)
status: Draft         # Draft | Active (Active: no proposed block, every main section confirmed, VG-07, VG-19)
---

<!-- Write in plain English: docs/spec/_STYLE.md (VG-12). Gate: _CRITERIA.md.
     The vision defines what DeckAgent is. It is not a decision log, a feature list or a scope (VG-01, VG-08).
     Before you write a block, ask: does it stay true if the scope, the interface or the code changes? If not, it goes elsewhere (_CRITERIA.md section 1).
     Only the owner confirms. Anything else is "proposed" or an open question (VG-14).
     A section with nothing confirmed or proposed says "Not written yet" and names its open question. Do not fill it to look complete (VG-16).
     Each fact is written once (VG-06). No rule or quality value (VG-09). No praise words (VG-17).

     Shared fields for every statement block:
       Statement: what is true. Present tense for what DeckAgent is. "DeckAgent aims to..." for a direction (VG-18).
       Status: "confirmed" or "proposed". Always present (VG-07).
       Source: "owner" when confirmed. When proposed: who proposed it and what it was inferred from (VG-14).
       Means for specs: what a lower spec must keep true or must not assume. Only what follows directly from the statement.
         Remove the field when Status is "proposed" (VG-07).
       Updated at: the date of the last change to this block, as dd-mm-yyyy, always the last field (VG-13).
     Headings: "### X-n · Short name" (5 words or fewer). IDs are stable: retire, never renumber (VG-05). -->

## What DeckAgent is

<!-- Question 1. What kind of product DeckAgent is, and the ideas a reader needs to understand it.
     No feature list. A capability (export, voice input, editing) is a use case, unless the owner says it defines DeckAgent (VG-01).
     Fields: Statement, Status, Source, Means for specs, Updated at. -->

### I-1 · Short name

- **Statement:**
- **Status:** proposed
- **Source:**
- **Updated at:** DD-MM-YYYY

## Why DeckAgent exists

<!-- Questions 2 and 3. The problem DeckAgent exists to solve, for whom, and the main value it gives.
     Write only what the owner said or what evidence shows. Never invent a problem, a research result, a market need or a benefit (VG-15).
     With [assumed] evidence only, write it as a belief: "The owner believes...".
     Fields: Statement, Status, Source, Evidence, Means for specs, Updated at.
     When nothing is known yet, replace the block with: "Not written yet. See Q-x." (VG-16) -->

### W-1 · Short name

- **Statement:**
- **Status:** proposed
- **Source:**
- **Evidence:** [assumed]
- **Updated at:** DD-MM-YYYY

## Principles

<!-- Question 4. Rules that guide product choices when a spec has to choose. Each one rules something out.
     Not a technical solution: "the user chooses the model" is a principle; "calls the provider over HTTP" is an ADR (VG-02).
     Why: the reason the owner gave, or "not recorded". Never invent a reason.
     Fields: Statement, Status, Source, Why, Means for specs, Updated at. -->

### P-1 · Short name

- **Statement:**
- **Status:** proposed
- **Source:**
- **Why:** not recorded
- **Updated at:** DD-MM-YYYY

## Boundaries

<!-- Question 5. What DeckAgent is not, by its nature. Test: does it hold with unlimited time? If not, it is scope (VG-03, VG-08).
     A missing feature is not a boundary. A limit of the thesis project or of a release is not a boundary.
     Write what is true in positive words where you can, not only what is absent.
     Fields: Statement, Status, Source, Why, Means for specs, Updated at. -->

### B-1 · Short name

- **Statement:**
- **Status:** proposed
- **Source:**
- **Why:** not recorded
- **Updated at:** DD-MM-YYYY

## Open questions

<!-- One block per question that waits for the owner (VG-04). Remove the section if empty.
     Fixed field names and order: Question, Affects, Resolved by, Updated at.
     Question: ends with "?". No other block answers it.
     Affects: the lower spec items that wait for the answer, by ID (for example UC-001 S5, USR-003 H-2), or "none found".
     Resolved by: a role, and the record it needs if any (for example "owner, with an ADR"). -->

### Q-1 · Short name

- **Question:**
- **Affects:** none found
- **Resolved by:** owner
- **Updated at:** DD-MM-YYYY

## Retired

<!-- IDs that were removed, each with one line on where the content went (VG-05). Never reuse them. Remove the section if empty. -->
