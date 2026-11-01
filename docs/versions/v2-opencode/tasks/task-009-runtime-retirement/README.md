# TASK-009 — Switch default and retire legacy dependencies

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **G-001, G-002 and G-003**. Gate: **G-009**. Work status: NOT STARTED.

## Contract handshake

Switch default only after parity. Retain durable data/shared public contracts. Inventory all Cordis/custom-loop consumers. Migrate existing CLI or obtain a separate explicit product decision; never silently delete it.

A records exact symbols, input/result/error samples and file ownership before parallel implementation.
B and C can prepare independent fixtures together. Integration waits for entry gates.
Proposed product, representation or package choices need a recorded decision before dependent code starts.

## Subtasks

| Task | Lane | Deliverable |
|---|---|---|
| [TASK-009-A](TASK-009-A.md) | A | Default switch and dependency retirement |
| [TASK-009-B](TASK-009-B.md) | B | Installation and compatibility guidance |
| [TASK-009-C](TASK-009-C.md) | C | Distribution and rollback audit |

## G-009 acceptance

Supported installation validates binary/dependencies. Local Web and existing CLI operations use OpenCode. No production Cordis/custom-loop consumer remains. Copied-profile rollback/interrupted upgrade is recoverable. Removed tests have replacement coverage or documented Cordis-only retirement.

All lane checks, affected automated suites and integrated manual cases must pass on the recorded candidate.
Missing model credentials/environment coverage is NOT VERIFIED or BLOCKED, never PASS.
Apply [common verification](../README.md). This gate does not rewrite historical acceptance.

## Handoff

Record final contracts, fixtures, files, compatibility and retest owners in [HANDOFF.md](HANDOFF.md).
Downstream tasks follow the [master plan](../../IMPLEMENTATION-PLAN.md). Independent preparation can continue while a gate is blocked.
