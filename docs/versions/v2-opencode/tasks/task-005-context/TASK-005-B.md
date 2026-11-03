# TASK-005-B — Usage and compact interaction

Owner: lane B; named assignee pending. Status: IMPLEMENTED OPT-IN; AWAITING MANUAL / INTEGRATION ACCEPTANCE.
Group: [Complete bounded context and manual compaction](README.md). Entry dependency: G-002 and G-004.

## Deliverable

Implement manual compact with estimated/unknown labels. Suggestions never start work. Avoid unrelated UI redesign.

## File ownership

packages/client/runtime/src/; proposed tests/context-browser.test.mjs.

Delivered placement and exact ownership are recorded in CONTRACT-PROPOSAL.md and HANDOFF.md.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Existing BR-010 suggestion behavior; running/waiting rejection; preserved draft; actionable failure.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-005 also needs [integrated scenarios](README.md).

Implementation checkpoint (4 November 2026): see HANDOFF.md and evidence.json.
Automated subset passes; the focused live summary/continue test passes. The full
source-to-deck live test failed before Compact. No full G-005 PASS is claimed.
