# TASK-006-B — Minimal visual editor

Owner: lane B; named assignee pending. Status: NOT STARTED.
Group: [Add direct editing with controlled revisions](README.md). Entry dependency: G-003.

## Deliverable

Implement agreed text/layout interactions and save/conflict feedback. Preserve preview sandbox. Exclude undo, design-system management and collaboration.

## File ownership

packages/client/runtime/src/deck-canvas.ts and related views; proposed direct-edit browser tests.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Edit/save/reopen; keyboard access; stale save preserves user work; Vietnamese and English text/layout cases.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-006 also needs [integrated scenarios](README.md).
