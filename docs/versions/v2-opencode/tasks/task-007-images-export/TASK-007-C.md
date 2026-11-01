# TASK-007-C — Image acquisition and artifact qualification

Owner: lane C; named assignee pending. Status: NOT STARTED.
Group: [Deliver images and usable export](README.md). Entry dependency: G-003; G-006 before final artifact integration.

## Deliverable

Select approved service/route and pin dependencies. Specify outgoing data. Apply URL/redirect/private-address checks for Internet fetch, or credential/prompt boundaries for AI service. Validate asset format/dimensions/limits.

## File ownership

proposed image/export adapters after placement decision; artifact tests.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Controlled egress plus approved live route; unavailable means no calls; no private material leaks; independent-viewer fidelity evidence.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-007 also needs [integrated scenarios](README.md).
