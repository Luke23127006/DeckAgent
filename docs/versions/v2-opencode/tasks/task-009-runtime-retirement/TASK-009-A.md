# TASK-009-A — Default switch and dependency retirement

Owner: lane A; named assignee pending. Status: NOT STARTED.
Group: [Switch default and retire legacy dependencies](README.md). Entry dependency: G-001, G-002 and G-003.

## Deliverable

Migrate CLI execution and retire obsolete plugin/loop composition. Retain shared registry/contracts in public package initially or approve coordinated move. Audit vendor/lockfile reachability before pruning.

## File ownership

apps/local-web/src/; apps/agent-runtime/src/; apps/cordis-smoke/; packages/agent/runtime/src/; manifests/build/CI.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Import/manifest audit; clean install/build; CLI setup/list/history/prompt; missing CLI actionable error; no silent backend retry.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-009 also needs [integrated scenarios](README.md).
