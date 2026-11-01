# TASK-005-A — Context checkpoint and projection

Owner: lane A; named assignee pending. Status: NOT STARTED.
Group: [Complete bounded context and manual compaction](README.md). Entry dependency: G-002 and G-004.

## Deliverable

Implement old V2 TASK-007-A semantics at the CLI seam. Decide checkpoint transaction/conflict behavior and verify pin-specific native compaction control.

## File ownership

apps/local-web/src/opencode/agent.ts; packages/session/persistence/src/; packages/host/api/src/.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Idle-only compact; failure/cancel atomicity; restart/model switch; next request uses summary, original history remains.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-005 also needs [integrated scenarios](README.md).
