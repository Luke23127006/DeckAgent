# TASK-006-A — Revision-aware editing contract

Owner: lane A; named assignee pending. Status: IMPLEMENTED; automated/live subset and owner basic smoke PASS; extended integration acceptance pending.
Group: [Add direct editing with controlled revisions](README.md). Entry dependency: G-003.

## Deliverable

Compare minimal structured edits and validated HTML patches against current slides. Record representation, operations and compatibility before code. Extend DeckService rather than replacing it.

## File ownership

packages/presentation/deck/src/; packages/host/api/src/; apps/local-web/src/editing-workflow.ts.

Delivered names, file ownership and compatibility are in CONTRACT.md and HANDOFF.md.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Legacy/new fixtures; revision conflicts; invalid patch; scope checks; failed transactions; evidence for any schema migration.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-006 also needs [integrated scenarios](README.md).

Checkpoint (4 November 2026): owner selected HTML patches. Automated domain, Host,
browser and pinned-CLI checks pass; focused real Gemini editing passes. G-006
remains NOT VERIFIED pending manual acceptance and its entry gate.

Owner confirmed the basic three-step manual smoke PASS on 4 November 2026.
See HANDOFF.md for scope and remaining gate conditions.
