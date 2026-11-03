# TASK-005-C — Context accounting and fidelity

Owner: lane C; named assignee pending. Status: IMPLEMENTED OPT-IN; AWAITING MANUAL / INTEGRATION ACCEPTANCE.
Group: [Complete bounded context and manual compaction](README.md). Entry dependency: G-002 and G-004.

## Deliverable

Measure accounting provenance and projection bounds. Compare requirements across compaction with sources, tool results and edit instructions.

## File ownership

proposed tests/opencode-context.test.mjs; evaluation fixtures.

Delivered placement and exact ownership are recorded in CONTRACT-PROPOSAL.md and HANDOFF.md.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

No cross-chat leak/orphan result/lost confirmation; bounded model calls; fidelity measurements handed to TASK-010.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-005 also needs [integrated scenarios](README.md).

Implementation checkpoint (4 November 2026): see HANDOFF.md and evidence.json.
Automated subset passes; the focused live summary/continue test passes. The full
source-to-deck live test failed before Compact. No full G-005 PASS is claimed.
