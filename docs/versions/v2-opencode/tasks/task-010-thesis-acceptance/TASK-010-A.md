# TASK-010-A — Integrated candidate and technical handoff

Owner: lane A; named assignee pending. Status: NOT STARTED.
Group: [Evaluate and hand over the thesis product](README.md). Entry dependency: G-001 through G-009; protocol preparation starts after scope review.

## Deliverable

Freeze candidate, resolve cross-task compatibility and check supported environments. Reconcile accepted ADR/spec/version pointers in a later authorized documentation change. Prepare recoverable packaging; no automatic publication.

## File ownership

application integration/configuration; final technical design/install documentation.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Required gates linked; install/reopen/export/Skills; sanitized artifacts; full requirement-to-evidence mapping.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-010 also needs [integrated scenarios](README.md).
