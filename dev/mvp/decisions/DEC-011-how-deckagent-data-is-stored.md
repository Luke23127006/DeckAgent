---
id: DEC-011
title: "How DeckAgent stores its own data: SQLite or JSON files"
date: 08-11-2026
status: decided
research: "RQ-2 in dev/mvp/builds/UC-013-workspaces-new-chat/research/research-checklist.md"
affects: "FR-071, FR-072, FR-073, FR-084, BR-004"
---

## Question

**What does DeckAgent store its own data in**: workspaces and chats now, then conversations (build 3), decks (build 5) and reopened chats (build 6) (RQ-2, ticket [#50](https://github.com/Luke23127006/DeckAgent/issues/50))? **Later builds build on it**, so a late change means **moving the data**. Where the data is kept is **DeckAgent's own data, never the project folder** (DEC-006, option A).

**Evidence:** the OpenCode reference at `5bd9c17` keeps workspaces and chats in **SQLite through `node:sqlite`** ([workspace-registry.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/workspace-registry.ts), [persistence](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/packages/session/persistence/src/index.ts)). open-design keeps **SQLite state** in a daemon ([open-design-earlier-work.md](../research/open-design-earlier-work.md) item 4). On Node **v22.19.0**, `node:sqlite` runs but prints "**ExperimentalWarning: SQLite is an experimental feature**" (checked on 08-11-2026). open-design's daemon uses **`better-sqlite3` 12.10.0** with **plain SQL, no ORM** (`apps/daemon/package.json`, `apps/daemon/src/db.ts`), and lets pnpm **build it at install** (`onlyBuiltDependencies`, `scripts/postinstall.mjs`); it uses `node:sqlite` **only in one test** (GitHub code search, 08-11-2026).

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · SQLite through `node:sqlite` | One database file, built into Node | All listed; a **transaction** keeps removing a workspace and its chats together (RQ-10) | **No extra package**, as in the reference. Its **stability in Node 22** is to be read in the Node docs |
| B · SQLite through a package | One database file through a package such as `better-sqlite3` | As A | **Mature**, but a **native package** to build on Windows |
| C · JSON files | One file per workspace and per chat | FR-071, FR-072; weaker for FR-073 | **Easy to read by hand**. **No transaction** across files: a crash between two writes **leaves them out of step**; **listing and searching chats** reads every file |

## Choice

**B · SQLite through `better-sqlite3`**, as open-design does.

## Why

**Do as open-design does**: it is **mature** and **already runs on Windows** in the product reference, while `node:sqlite` is **still experimental** in Node 22. DeckAgent is a **graduation project**, so the cost of a **native build for new contributors** does **not apply**.

## Rejected options and why

- **A · `node:sqlite`:** **experimental in Node 22**; its API **may change**.
- **C · JSON files:** **no transaction** across files, and **listing chats reads every file**; OpenCode itself **moved from JSON files to SQLite** later and had to **migrate the data**.

## Consequences

- All reads and writes go through **one storage module** with **plain SQL**; removing a workspace and moving its chats run in **one transaction** (FR-073, BR-004).
- pnpm must be **allowed to build `better-sqlite3`** at install, and the setup docs **name the Node version**.
- Removing chats or workspaces should **reclaim space**, since a SQLite file **does not shrink by itself**.
