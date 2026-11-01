# TASK-003 — Accept inherited V1/V2 behavior on OpenCode

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **G-001 and G-002**. Gate: **G-003**. Work status: NOT STARTED.

## Contract handshake

Retain Host admission/approval versions, workspace identity, ToolRegistry authorization, DeckService expectedRevision/publicationId and snapshot ordering. No changed business rules.

A records exact symbols, input/result/error samples and file ownership before parallel implementation.
B and C can prepare independent fixtures together. Integration waits for entry gates.
Proposed product, representation or package choices need a recorded decision before dependent code starts.

## Subtasks

| Task | Lane | Deliverable |
|---|---|---|
| [TASK-003-A](TASK-003-A.md) | A | Lifecycle and storage compatibility |
| [TASK-003-B](TASK-003-B.md) | B | Inherited browser/manual acceptance |
| [TASK-003-C](TASK-003-C.md) | C | Security and parity regression matrix |

## G-003 acceptance

Integrated inherited V1 smoke and V2 workspace/chat/model/permission checklists pass. Live approval once/deny/continuing grant/revoke, Stop in approval/tool work, concurrent chats and restart without replay pass. Source hashes and non-target slide revisions remain unchanged. Historical unclosed gates remain attributed separately.

All lane checks, affected automated suites and integrated manual cases must pass on the recorded candidate.
Missing model credentials/environment coverage is NOT VERIFIED or BLOCKED, never PASS.
Apply [common verification](../README.md). This gate does not rewrite historical acceptance.

## Handoff

Record final contracts, fixtures, files, compatibility and retest owners in [HANDOFF.md](HANDOFF.md).
Downstream tasks follow the [master plan](../../IMPLEMENTATION-PLAN.md). Independent preparation can continue while a gate is blocked.
