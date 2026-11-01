# TASK-009-B — Installation and compatibility guidance

Owner: lane B; named assignee pending. Status: NOT STARTED.
Group: [Switch default and retire legacy dependencies](README.md). Entry dependency: G-001, G-002 and G-003.

## Deliverable

Document supported platforms/pin, commands and backup/restore. Retire obsolete Cordis instructions only after replacement works. Keep existing UI unless error guidance needs change.

## File ownership

setup/help and developer/user documentation; installation smoke fixtures.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Fresh supported environment; reopen old profile; unsupported platform/version rejection; no secret examples.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-009 also needs [integrated scenarios](README.md).
