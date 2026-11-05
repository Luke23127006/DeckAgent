# TASK-007-A — Asset/export domain and lifecycle

Owner: lane A, implemented by Codex. Status: IMPLEMENTED; owner basic smoke PASS; automated checks PASS.
Group: [Deliver images and usable export](README.md). Entry dependency: G-003; G-006 before final artifact integration.

## Deliverable

Define frozen export snapshot and Chat-owned assets. Choose format/library using fidelity/license evidence. Specify output destination and safe partial-output cleanup.

## File ownership

packages/presentation/deck/src/; packages/host/api/src/; apps/local-web/src/.

Exact paths are recorded in [CONTRACT.md](CONTRACT.md). The implementation adds
ImageAssetStore, PdfExporter, DeckService.freeze/insertImage and optional Host operations.
Installed Chromium keeps its sandbox enabled. PDF merger input comes only from that renderer.
No existing database schema changes. assets.sqlite and immutable image files are additive.

## Verification

Export during newer AI/direct edits remains consistent; missing assets; partial output failure; no source modification.

PASS: frozen snapshot despite a newer revision, pending deck refusal, corrupt asset refusal,
cancelled import cleanup, renderer cancellation/drain, missing browser and layout overflow.
Host tests cover authentication, destination injection and disconnect abort before PDF delivery.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-007 also needs [integrated scenarios](README.md).

## Owner smoke confirmation

Owner confirmed the six-case basic smoke PASS in chat on 5 November 2026. This is an aggregate report; exact manual candidate SHA, browser/model versions and itemized artifacts were not supplied. Extended cancellation/isolation checks and G-003/G-006 remain open. G-007 stays NOT VERIFIED.
