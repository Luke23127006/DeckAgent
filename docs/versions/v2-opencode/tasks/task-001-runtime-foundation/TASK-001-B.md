# TASK-001-B — Verify client contract

Owner: lane B; named assignee pending. Status: NOT STARTED.
Group: [Port and qualify the OpenCode adapter](README.md). Entry dependency: Recorded dev/POC baseline; production seam proposal reviewed.

## Deliverable

Trace current Host snapshots and activity events to existing views. Verify states without adding token-stream UI. Request Host changes from A only for demonstrated incompatibility.

## File ownership

proposed tests/opencode-client-contract.test.mjs; client acceptance checklist.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Browser smoke, activity ordering, reload, no duplicate messages and correct request controls.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-001 also needs [integrated scenarios](README.md).
