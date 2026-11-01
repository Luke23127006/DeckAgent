# TASK-010-C — Regression and quality evaluation

Owner: lane C; named assignee pending. Status: NOT STARTED.
Group: [Evaluate and hand over the thesis product](README.md). Entry dependency: G-001 through G-009; protocol preparation starts after scope review.

## Deliverable

Run deterministic security/regression and real-model evaluation separately. Include corrupt input, permission denial, interruption and scope violation. Report raw outcomes and numerator/denominator.

## File ownership

evaluation fixtures/scripts and final test evidence.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Mocks never counted as live success; frozen-revision preservation; documented quality rubric; unresolved failures visible.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-010 also needs [integrated scenarios](README.md).
