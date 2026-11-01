# TASK-007-A — Asset/export domain and lifecycle

Owner: lane A; named assignee pending. Status: NOT STARTED.
Group: [Deliver images and usable export](README.md). Entry dependency: G-003; G-006 before final artifact integration.

## Deliverable

Define frozen export snapshot and Chat-owned assets. Choose format/library using fidelity/license evidence. Specify output destination and safe partial-output cleanup.

## File ownership

packages/presentation/deck/src/; packages/host/api/src/; apps/local-web/src/.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Export during newer AI/direct edits remains consistent; missing assets; partial output failure; no source modification.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-007 also needs [integrated scenarios](README.md).
