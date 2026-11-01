# TASK-001 — Port and qualify the OpenCode adapter

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **Recorded dev/POC baseline; production seam proposal reviewed**. Gate: **G-001**. Work status: NOT STARTED.

## Contract handshake

Keep AgentHandle send/history/dispose, SendOptions and TurnResult behavior. MCP exposes only phase tools; permissions use actual deckagent_ prefixed names. Host alone confirms outlines.

A records exact symbols, input/result/error samples and file ownership before parallel implementation.
B and C can prepare independent fixtures together. Integration waits for entry gates.
Proposed product, representation or package choices need a recorded decision before dependent code starts.

## Subtasks

| Task | Lane | Deliverable |
|---|---|---|
| [TASK-001-A](TASK-001-A.md) | A | Port opt-in adapter |
| [TASK-001-B](TASK-001-B.md) | B | Verify client contract |
| [TASK-001-C](TASK-001-C.md) | C | Port isolation and MCP tests |

## G-001 acceptance

Reproduce the committed POC on supported Node and pinned CLI. Actual provider-request tool capture contains only allowed MCP tools; extra native tools/plugins/agent overrides cannot widen it. Live model: outline -> user confirm -> two slides -> edit slide two only. Legacy backend still works.

All lane checks, affected automated suites and integrated manual cases must pass on the recorded candidate.
Missing model credentials/environment coverage is NOT VERIFIED or BLOCKED, never PASS.
Apply [common verification](../README.md). This gate does not rewrite historical acceptance.

## Handoff

Record final contracts, fixtures, files, compatibility and retest owners in [HANDOFF.md](HANDOFF.md).
Downstream tasks follow the [master plan](../../IMPLEMENTATION-PLAN.md). Independent preparation can continue while a gate is blocked.
