# TASK-004-A — Material storage and request API

Owner: lane A; named assignee pending. Status: NOT STARTED.
Group: [Complete source-to-presentation input](README.md). Entry dependency: G-003.

## Deliverable

Reuse old V2 TASK-005-A design as a proposal. Implement scoped upload/reference identity and request material snapshots. Agree recoverable schema/API changes first.

## File ownership

apps/local-web/src/; packages/host/api/src/; packages/session/persistence/src/ where necessary.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Upload/read/restart; attachment-only request; unauthorized IDs; incomplete upload; failed copied-profile migration recoverable.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-004 also needs [integrated scenarios](README.md).
