---
id: DEC-008
title: "Who starts the summary of a conversation that outgrows the context of the model"
date: 05-11-2026
status: open
research: "dev/mvp/research/context-compaction.md items 2 to 4; owner ruling in the UC-015 spec review, 05-11-2026; runtime research of the first build that runs requests"
affects: "FR-079, FR-019, UC-003 A52, glossary (context, conversation summary)"
---

## Question

A long chat ends up with a conversation that no longer fits the context of the selected model. Who starts the summary that makes it fit again: the system by itself, the user, or both? Legacy UC-015 let only the user compact and never compacted by itself. OpenCode compacts a session by itself by default (`compaction.auto: true`). The answer sets the OpenCode configuration, decides whether a request can fail because the context is full, and decides whether the user needs to see the context usage (FR-078, in the backlog).

Owner ruling of 05-11-2026 in the UC-015 review: option A. FR-079 and UC-003 A52 are written from it. The Choice and the Why are left to the PO.

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · The system, by itself | When the context is full during a request, the system writes a conversation summary, goes on with the work and says so in the conversation. The user has no compact command | FR-079, FR-019 | Matches the OpenCode default. The user never watches a context number, and a long request does not fail because the context fills. The user does not choose when detail of the earlier conversation leaves what the model reads; the brief, the outline, the deck and the attachments must reach the model apart from the summary |
| B · Only the user | As legacy UC-015: the user sees the context usage and compacts; the system suggests at a threshold and never compacts by itself | Legacy FR-078, FR-079, BR-010 | The user controls when detail is summarized. Auto compaction is turned off in OpenCode, so a request that fills the context fails (FR-019). The user must understand context usage, and a usage meter (FR-078) and a threshold (BR-010) are needed |
| C · Both | As A, and the user also compacts by command at any time without an active request | FR-079, legacy FR-078 | Most control. Adds a command, its own flows (refused while a request is active, failed compact) and likely a usage meter, for a need nobody reported |

## Choice

<!-- Left to the PO. -->

## Why

<!-- Left to the PO. -->

## Rejected options and why

<!-- Left to the PO. -->

## Consequences

<!-- Left to the PO. -->
