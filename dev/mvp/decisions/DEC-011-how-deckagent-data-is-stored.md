---
id: DEC-011
title: "How DeckAgent stores its own data: SQLite or JSON files"
date: 08-11-2026
status: open
research: "RQ-2 in dev/mvp/builds/UC-013-workspaces-new-chat/research-checklist.md"
affects: "FR-071, FR-072, FR-073, FR-084, BR-004"
---

## Question

**What does DeckAgent store its own data in**: workspaces and chats now, then conversations (build 3), decks (build 5) and reopened chats (build 6) (RQ-2, ticket [#50](https://github.com/Luke23127006/DeckAgent/issues/50))? **Later builds build on it**, so a late change means **moving the data**. Where the data is kept is **DeckAgent's own data, never the project folder** (DEC-006, option A, ruled by the owner).

**Evidence:** the OpenCode reference at `5bd9c17` keeps workspaces and chats in **SQLite through `node:sqlite`** ([workspace-registry.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/workspace-registry.ts), [persistence](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/session/persistence/src/index.ts)). open-design keeps **SQLite state** in a daemon ([open-design-earlier-work.md](../research/open-design-earlier-work.md) item 4). **Not checked yet**: whether `node:sqlite` is **stable or experimental** in Node 22.

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · SQLite through `node:sqlite` | One database file, built into Node | All listed; a **transaction** keeps removing a workspace and its chats together (RQ-10) | **No extra package**, as in the reference. Its **stability in Node 22** is to be read in the Node docs |
| B · SQLite through a package | One database file through a package such as `better-sqlite3` | As A | **Mature**, but a **native package** to build on Windows |
| C · JSON files | One file per workspace and per chat | FR-071, FR-072; weaker for FR-073 | **Easy to read by hand**. **No transaction** across files: a crash between two writes **leaves them out of step**; **listing and searching chats** reads every file |

## Choice

<!-- Left to the PO. -->

## Why

<!-- Left to the PO. -->

## Rejected options and why

<!-- Left to the PO. -->

## Consequences

<!-- Left to the PO. -->
