# TASK-006-C — Shared edit tools and preservation tests

Owner: lane C; named assignee pending. Status: NOT STARTED.
Group: [Add direct editing with controlled revisions](README.md). Entry dependency: G-003.

## Deliverable

Reuse publication checks for AI edits on the selected representation. Alternate AI/direct edits and measure preservation inside and outside target slides. Prepare shared operations for Skills.

## File ownership

packages/tools/presentation/src/; tests/recovery-editing.test.mjs; proposed tests/direct-editing.test.mjs.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Requested change achieved; unchanged hashes/revisions elsewhere; same-slide non-target preservation; XSS/resource URL rejection.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-006 also needs [integrated scenarios](README.md).
