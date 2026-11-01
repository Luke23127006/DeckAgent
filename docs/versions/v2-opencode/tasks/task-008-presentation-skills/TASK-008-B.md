# TASK-008-B — Product Skill package and instructions

Owner: lane B; named assignee pending. Status: NOT STARTED.
Group: [Package reusable presentation Agent Skills](README.md). Entry dependency: G-001 and G-003 for prototype; G-004, G-006 and G-007 for final gate.

## Deliverable

Write creation/editing instructions, dependencies and host limitations. Choose named compatible host; require user confirmation and scoped editing. Instructions grant no authority.

## File ownership

proposed product Skills directory outside .agents/skills; installation/examples.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Clean installation; tool discovery; sample create/edit; no dependency on DeckAgent UI or local-only paths.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-008 also needs [integrated scenarios](README.md).
