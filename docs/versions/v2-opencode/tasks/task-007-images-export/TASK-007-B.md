# TASK-007-B — Image/export interaction

Owner: lane B; named assignee pending. Status: NOT STARTED.
Group: [Deliver images and usable export](README.md). Entry dependency: G-003; G-006 before final artifact integration.

## Deliverable

Expose selected image/export operations, statuses and errors. Validate output after direct edits; no general research dashboard.

## File ownership

packages/client/runtime/src/; proposed tests/export-browser.test.mjs.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Image provenance where needed; acquisition failure; export open/download; no replay/scope expansion.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-007 also needs [integrated scenarios](README.md).
