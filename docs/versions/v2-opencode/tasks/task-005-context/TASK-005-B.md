# TASK-005-B — Usage and compact interaction

Owner: lane B; named assignee pending. Status: NOT STARTED.
Group: [Complete bounded context and manual compaction](README.md). Entry dependency: G-002 and G-004.

## Deliverable

Implement manual compact with estimated/unknown labels. Suggestions never start work. Avoid unrelated UI redesign.

## File ownership

packages/client/runtime/src/; proposed tests/context-browser.test.mjs.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Existing BR-010 suggestion behavior; running/waiting rejection; preserved draft; actionable failure.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-005 also needs [integrated scenarios](README.md).
