# TASK-005 — Complete bounded context and manual compaction

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **G-002 and G-004**. Gate: **G-005**. Work status: NOT STARTED.

## Contract handshake

Full history remains readable. Model context is a separate Chat/selection checkpoint. Usage is reported, estimated or unknown. Only the user starts compact on an idle Chat.

A records exact symbols, input/result/error samples and file ownership before parallel implementation.
B and C can prepare independent fixtures together. Integration waits for entry gates.
Proposed product, representation or package choices need a recorded decision before dependent code starts.

## Subtasks

| Task | Lane | Deliverable |
|---|---|---|
| [TASK-005-A](TASK-005-A.md) | A | Context checkpoint and projection |
| [TASK-005-B](TASK-005-B.md) | B | Usage and compact interaction |
| [TASK-005-C](TASK-005-C.md) | C | Context accounting and fidelity |

## G-005 acceptance

Source-backed long conversations compact and continue with confirmed outline/scope intact. Failed/cancelled compaction keeps prior context. Reopen retains checkpoint/history. Verify native compaction settings cannot silently replace this contract.

All lane checks, affected automated suites and integrated manual cases must pass on the recorded candidate.
Missing model credentials/environment coverage is NOT VERIFIED or BLOCKED, never PASS.
Apply [common verification](../README.md). This gate does not rewrite historical acceptance.

## Handoff

Record final contracts, fixtures, files, compatibility and retest owners in [HANDOFF.md](HANDOFF.md).
Downstream tasks follow the [master plan](../../IMPLEMENTATION-PLAN.md). Independent preparation can continue while a gate is blocked.
