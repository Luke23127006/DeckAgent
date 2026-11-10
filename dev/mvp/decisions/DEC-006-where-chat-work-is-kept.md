---
id: DEC-006
title: "Where the deck source and the work of a chat are kept"
date: 05-11-2026
status: open
research: "dev/mvp/research/open-design-earlier-work.md items 8 to 10; runtime research of the first build that touches workspaces"
affects: "FR-084, FR-072, FR-073, FR-074, NFR-008"
---

## Question

**Where does DeckAgent keep the deck source** and the rest of the work of a chat (the conversation, the outline, the record of each request): **in its own data**, or **in the project folder** of the workspace? DEC-005 says the **system and the user change the same files** of the deck source, and the legacy spec said **DeckAgent writes no file into the project folder**. The answer constrains changes by hand (legacy UC-007), going back to an earlier state (legacy UC-008), export (legacy UC-004) and a project folder that cannot be read (FR-074).

**Working answer: option A**. **FR-084 is written from it**. **Choice** and **Why**: pending (the PO writes them).

**Legacy input**: the **legacy code made the same choice** (legacy ADR 0001, accepted; readable at commit `85130c4`). Its consequences, **for the PO to keep or drop**: the **data folder has a fixed path** that does not depend on where DeckAgent starts; **workspace and chat IDs do not depend on the folder path**; the **agent's temporary files are kept apart** from the user's files and from saved chat data; the **project folder is read-only**, and **only an export the user asks for writes into it**.

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · In DeckAgent's own data | The deck source and the work of every chat are kept in DeckAgent's own data, never in the project folder. A file enters the project folder only through an export the user chooses | FR-084, FR-072, FR-073, FR-074, NFR-008 | The user's folder stays as it was; a chat stays readable when its folder is gone; the default workspace works like every other workspace. A change by hand goes through DeckAgent (legacy UC-007): the user does not open the deck source in their own editor |
| B · In a folder of DeckAgent inside the project folder | The deck source of each chat is kept in a folder of DeckAgent inside the project folder | DEC-005 (same files for the system and the user) | The user sees the files, edits them in any editor and keeps them in version control. FR-084 is dropped; losing the folder loses the deck; the default workspace has no folder to keep it in. open-design runs its agent in the folder of an imported project `[inferred: open-design docs/architecture.md]` |
| C · As A, with a copy into the folder on request | As A. The user also asks to put the deck source into the project folder, as an export | FR-084, legacy UC-004 | Keeps the guarantees of A and gives the files to the user's editor; a hand edit to that copy does not come back by itself. Its detail belongs to the export and hand-edit reviews |

## Choice

<!-- Left to the PO. -->

## Why

<!-- Left to the PO. -->

## Rejected options and why

<!-- Left to the PO. -->

## Consequences

<!-- Left to the PO. -->
