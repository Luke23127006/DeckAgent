# TASK-002-B — Provider compatibility interaction

Owner: lane B; named assignee pending. Status: NOT STARTED.
Group: [Restore provider and session compatibility](README.md). Entry dependency: G-001.

## Deliverable

Retain settings and effort UI. Explain unsupported choices; never silently substitute models or drop options. Change UI only where parity requires it.

## File ownership

packages/client/runtime/src/model-picker.ts and management views; proposed tests/opencode-provider-ui.test.mjs.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Unknown metadata stays unknown; failed save retains draft; active request keeps selection; old configurations readable.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-002 also needs [integrated scenarios](README.md).
