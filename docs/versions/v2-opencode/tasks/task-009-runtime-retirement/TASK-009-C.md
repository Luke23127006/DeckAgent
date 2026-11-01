# TASK-009-C — Distribution and rollback audit

Owner: lane C; named assignee pending. Status: NOT STARTED.
Group: [Switch default and retire legacy dependencies](README.md). Entry dependency: G-001, G-002 and G-003.

## Deliverable

Review executable provenance/license/update policy. Requalify isolation after pin/platform changes. Test upgrades/rollback on copies, setup failure and cancellation; replace Cordis-only smoke.

## File ownership

proposed tests/runtime-installation.test.mjs; dependency/license evidence; lifecycle smoke replacements.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Supported Node/OS matrix; verified hashes; recover prior runnable profile; no lost decks/chats; remaining public consumers resolve.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-009 also needs [integrated scenarios](README.md).
