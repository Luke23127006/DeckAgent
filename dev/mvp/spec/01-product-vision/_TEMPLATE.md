---
id: VIS-001
title: ""
updated: DD-MM-YYYY
---

<!-- Write per dev/mvp/spec/_STYLE.md. Gate: _CRITERIA.md.
     The vision says what the product is, not a decision log, feature list, or scope (VG-01).
     Before writing a block, ask: is it still true if scope, interface, or code changes? If not, it belongs elsewhere (_CRITERIA.md section 1).
     Write each fact exactly once (VG-06). No rules or quality values (VG-09). No praise words (VG-12).
     A part with nothing settled yet reads "Not written yet. See Q-x." Do not pad (VG-14).

     Fields shared by every statement block:
       Statement: what is true. Present tense for what the product is. "The product aims to..." for a direction.
       Status: "confirmed" (you decided) or "proposed" (AI suggests, awaiting your approval). Always present.
       Source: only when "proposed" — who proposed it and what it was inferred from.
       Spec implications: what lower spec must hold or must not assume. Only what follows directly from the statement. Omit the field when Status is "proposed".
       Updated date: just one `updated` in the frontmatter, the last edit date. Do not record who; git history does that. -->

## What the product is

<!-- Question 1. What kind of product this is, and the ideas needed to understand it. No feature list.
     A capability (export, voice input, editing) is a use case, unless you say it defines the product (VG-01).
     Fields: Statement, Status, Source, Spec implications. -->

### I-1 · short name

- **Statement:**
- **Status:** proposed
- **Source:**

## Why it exists

<!-- Questions 2 and 3. The problem the product solves, for whom, and the main value it gives.
     Write only what you have said or what evidence shows. Do not invent a problem, research result, or benefit.
     With only [assumed] evidence, write it as a belief: "I believe that...".
     Fields: Statement, Status, Source, Evidence, Spec implications. -->

### W-1 · short name

- **Statement:**
- **Status:** proposed
- **Source:**
- **Evidence:** [assumed]

## Principles

<!-- Question 4. The rules that guide choices when the spec must choose. Each rule rules something out.
     Not a technical solution: "the user picks the reading voice" is a principle; "call the provider over HTTP" is an ADR (VG-02).
     Fields: Statement, Status, Source, Why, Spec implications. -->

### P-1 · short name

- **Statement:**
- **Status:** proposed
- **Source:**
- **Why:**

## Boundaries

<!-- Question 5. What the product is NOT, by its nature. Test: is it still true given infinite time? If not, it is scope (VG-03).
     A missing feature is not a boundary. A V1 limit is not a boundary.
     State the true thing in positive terms where you can, not just the absence.
     Fields: Statement, Status, Source, Why, Spec implications. -->

### B-1 · short name

- **Statement:**
- **Status:** proposed
- **Source:**
- **Why:**

## Open questions

<!-- One block per question awaiting your decision (VG-04). Omit this section if empty.
     Fixed fields in order: Question, Affects.
     Question: ends with "?". No other block answers it.
     Affects: the lower spec items awaiting the answer, by ID (e.g. UC-001 S5), or "none yet". -->

### Q-1 · short name

- **Question:**
- **Affects:** none yet

## Removed

<!-- Removed IDs, one line each saying where the content went (VG-05). Not reused. Omit this section if empty. -->
