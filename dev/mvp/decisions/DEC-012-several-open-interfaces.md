---
id: DEC-012
title: "What several open interfaces share: the workspace in use"
date: 08-11-2026
status: decided
research: "RQ-9 in dev/mvp/builds/UC-013-workspaces-new-chat/research/research-checklist.md"
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

**A · The program keeps one workspace in use**; **every open interface follows it**.

## Why

The PO took the **recommendation as shown**: the **glossary stays as written** (one workspace in use), and the **channel that pushes changes to the interface** is **needed anyway** when build 3 **streams answers**.

## Rejected options and why

- **B · Each interface keeps its own:** needs a **spec change** to the glossary, and the server must know **which interface** a new chat came from.
- **C · One interface at a time:** a **second tab or a reload** would be **refused or take over**, which **surprises the user**.

## Consequences

- The server **pushes a change of the workspace in use** to **every open interface**.
- The **current chat is not shared**: **each interface keeps its own current chat**; the **draft of one chat** is the **same in every interface** (FR-038).
- A **new chat** carries the **workspace the interface shows** `[proposed]`; when it **differs from the workspace in use**, the server **creates no chat** and the interface **updates first**. The **implementation plan** settles this detail.
