# TASK-007 — Deliver images and usable export

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **G-003; G-006 before final artifact integration**. Gate: **G-007 NOT VERIFIED**.
Work status: **IMPLEMENTED; OWNER BASIC SMOKE PASS**, 5 November 2026. Implementation and focused automated/live checks pass.
The owner authorized independent delivery while earlier gates remain open. This does not waive their acceptance.

## Contract handshake

The owner selected Internet images and PDF on 4 November 2026.
The user imports a public HTTPS PNG/JPEG URL. The agent uses Chat-owned asset IDs through MCP.
PDF freezes committed revisions; it does not regenerate slides or include unsaved editor drafts.
See the [accepted decision](../../../../adr/0007-internet-image-assets-and-pdf-export.md) and [exact contract](CONTRACT.md).

Codex implemented all three lanes sequentially. No runtime switch, source-folder writes or existing database schema changes occurred.
The added assets.sqlite is application-owned. Old Cordis and custom runtime remain available.

## Subtasks

| Task | Lane | Deliverable |
|---|---|---|
| [TASK-007-A](TASK-007-A.md) | A | Asset/export domain and lifecycle |
| [TASK-007-B](TASK-007-B.md) | B | Image/export interaction |
| [TASK-007-C](TASK-007-C.md) | C | Image acquisition and artifact qualification |

## G-007 acceptance

Real image-route deck saves/reopens/exports in chosen format. Inspect Vietnamese fonts, layout, images, order and content in an independent viewer. Denied network/export failures preserve deck. Final acceptance uses direct-edit representation.

All lane checks, affected automated suites and integrated manual cases must pass on the recorded candidate.
Missing model credentials/environment coverage is NOT VERIFIED or BLOCKED, never PASS.
Apply [common verification](../README.md). This gate does not rewrite historical acceptance.

## Current evidence

Fixture/domain/network/Host/browser/PDF checks pass. Real public HTTPS acquisition and
Gemini through pinned OpenCode pass. Independent PDF.js inspection and image review
confirm the recorded two-page sample, including Vietnamese direct edits and an image.
This is bounded evidence, not an arbitrary-layout or cross-platform fidelity guarantee.

The initial live prompt timed out because the existing scope guard blocks `insert`.
The corrected prompt passed; the failure remains recorded. Use [manual acceptance](MANUAL-ACCEPTANCE.md).
Owner manual results and G-003/G-006 extended acceptance remain outstanding.

## Handoff

Record final contracts, fixtures, files, compatibility and retest owners in [HANDOFF.md](HANDOFF.md).
Downstream tasks follow the [master plan](../../IMPLEMENTATION-PLAN.md). Independent preparation can continue while a gate is blocked.

## Owner smoke confirmation

Owner confirmed the six-case basic smoke PASS in chat on 5 November 2026. This is an aggregate report; exact manual candidate SHA, browser/model versions and itemized artifacts were not supplied. Extended cancellation/isolation checks and G-003/G-006 remain open. G-007 stays NOT VERIFIED.
