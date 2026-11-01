# TASK-010-B — User evaluation and guides

Owner: lane B; named assignee pending. Status: NOT STARTED.
Group: [Evaluate and hand over the thesis product](README.md). Entry dependency: G-001 through G-009; protocol preparation starts after scope review.

## Deliverable

Prepare representative cases and acceptance protocol early. Record real tester decisions/rounds. Check installation, direct editing and export guides against final app.

## File ownership

user guide and evaluation cases/results.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Independent walkthrough; failure/recovery instructions; actual rounds/reasons; saved outputs scored for content/design/coherence.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-010 also needs [integrated scenarios](README.md).
