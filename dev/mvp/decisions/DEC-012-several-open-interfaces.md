---
id: DEC-012
title: "What several open interfaces share: the workspace in use and the current chat"
date: 08-11-2026
status: open
research: "RQ-9 in dev/mvp/builds/UC-013-workspaces-new-chat/research-checklist.md"
affects: "FR-071, FR-053, FR-038"
---

## Question

When the user has **two interfaces open at once** (two browser tabs, or two windows), and **one of them switches the workspace in use**, **does the other switch too** (RQ-9, ticket [#54](https://github.com/Luke23127006/DeckAgent/issues/54))? The glossary has **one workspace in use**. Open question 19 leaves **several open views** to the **implementation plan**. The answer **depends on how DeckAgent runs** (DEC-010).

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · Shared by the program | The **program keeps one workspace in use**; every open interface **follows it** | The glossary's single workspace in use | **One truth**; each interface **needs to hear changes** from the program |
| B · Each interface keeps its own | Each interface has **its own workspace in use** and current chat; a new chat joins the workspace of the interface that starts it | FR-053 per interface | **No syncing**. The glossary's **"one workspace in use"** becomes **"one per interface"**: a **spec change** |
| C · One interface at a time | A second interface **is refused** or **takes over** from the first | The glossary as written | **Simplest to test**. A **reload or a second tab** needs a clear rule |

## Choice

<!-- Left to the PO. -->

## Why

<!-- Left to the PO. -->

## Rejected options and why

<!-- Left to the PO. -->

## Consequences

<!-- Left to the PO. -->
