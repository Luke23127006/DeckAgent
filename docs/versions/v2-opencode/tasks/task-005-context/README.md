# TASK-005 — Complete bounded context and manual compaction

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **G-002 and G-004**. Gate: **G-005**. Work status: IMPLEMENTED OPT-IN; BASIC MANUAL SMOKE PASS; EXTENDED ACCEPTANCE PENDING.

Owner selected separate `context.sqlite` on 3 November 2026; see accepted
[context checkpoint decision](../../../../adr/0005-manual-context-checkpoints.md).
Implementation checkpoint: 4 November 2026, based on `019a027` plus local changes.
Entry gates remain NOT VERIFIED. Requested implementation does not waive them.

The Host owns projection and atomic checkpoints. The existing OpenCode adapter
summarizes with an ephemeral SessionStore and no tools. Readable history stays
unchanged. Context/Compact are optional Host capabilities; the old backend stays
the default. No dependency or existing database schema changes were needed.

See [contracts](CONTRACT-PROPOSAL.md), [verification and limitations](HANDOFF.md),
[manual smoke](MANUAL-ACCEPTANCE.md) and [machine-readable evidence](evidence.json).

## Contract handshake

Full history remains readable. Model context is a separate Chat/selection checkpoint. Usage is reported, estimated or unknown. Only the user starts compact on an idle Chat.

This implementation exposes a labeled byte-based estimate or Unknown. It does
not relabel completed-call provider token reports as current context occupancy.
Prompt/tool byte observations must match Chat, selection and authoritative state;
unknown image/reference costs suppress a total percentage. Known estimates at
85 percent suggest Compact and start no work.

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

Owner checkpoint (4 November 2026): the quick manual Compact/continue smoke is PASS. The owner confirmed retention of the supplied four-fact context, unsent draft, readable history and checkpoint indication for that scenario. No separate artifacts or exact manual candidate/browser/model were supplied. Stop, restart/model isolation and source-backed deck editing are not covered by this quick confirmation. The earlier full live failure and pending entry gates remain recorded; G-005 stays NOT VERIFIED. No code changes or automated reruns were needed for this update.
