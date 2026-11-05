---
id: DEC-004
title: "The work of a request runs in DeckAgent, not in its interface"
date: 04-11-2026
status: open
research: "none yet; owner ruling in the UC-003 spec review, 04-11-2026; runtime research of the first build that touches FR-068"
affects: "FR-014, FR-018, FR-068"
---

## Question

Where does the work of an active request run, and where is its state kept, so that reloading or closing the interface, a lost connection to DeckAgent, or going to another chat stops no request (FR-068)? Legacy UC-003 Note 8 named this as a design choice for an ADR. The runtime is OpenCode.

Owner ruling of 04-11-2026 that bounds the options: a request that is active when DeckAgent itself stops does not finish, and is shown as not finished when DeckAgent starts again (UC-003 A11, FR-019). No requirement asks for a request to resume after a restart.

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · Work runs in the DeckAgent program | The request runs in the DeckAgent program (an OpenCode server session). The interface only shows it, and connects again after a reload or a lost connection | FR-068, FR-014, FR-018 | Uses the session model of the runtime `[assumed]`. The interface needs a way to catch up on what happened while it was away. When the program itself ends, the work ends |
| B · Work runs in the interface | The interface drives the work; reloading or closing it ends the request as a request that does not finish (FR-019) | FR-019 | Simple, but breaks FR-068: a reload loses the work in progress |
| C · Work runs in DeckAgent and resumes after the program restarts | As A, and a request that was running when the program ended resumes when it starts again | FR-068 | Survives a restart, but needs a saved state of each request and a rule for resuming, which no requirement asks for |

## Choice

<!-- Left to the PO. -->

## Why

<!-- Left to the PO. -->

## Rejected options and why

<!-- Left to the PO. -->

## Consequences

<!-- Left to the PO. -->
