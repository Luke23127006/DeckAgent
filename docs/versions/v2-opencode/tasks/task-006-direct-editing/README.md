# TASK-006 — Add direct editing with controlled revisions

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **G-003**. Gate: **G-006**. Work status: NOT STARTED.

## Contract handshake

Decide a minimal editable slide structure and revision-aware save command compatible with existing HTML before implementation. Host stays authoritative. Direct/AI edits share scope/conflict validation; client scripts never become trusted content.

A records exact symbols, input/result/error samples and file ownership before parallel implementation.
B and C can prepare independent fixtures together. Integration waits for entry gates.
Proposed product, representation or package choices need a recorded decision before dependent code starts.

## Subtasks

| Task | Lane | Deliverable |
|---|---|---|
| [TASK-006-A](TASK-006-A.md) | A | Revision-aware editing contract |
| [TASK-006-B](TASK-006-B.md) | B | Minimal visual editor |
| [TASK-006-C](TASK-006-C.md) | C | Shared edit tools and preservation tests |

## G-006 acceptance

User directly edits agreed text/layout operations, saves/reloads, then asks AI to edit a named slide. Non-target content/slides remain unchanged. Concurrent stale edits fail without overwrite. Legacy HTML stays viewable with an owner-accepted editing/conversion path.

All lane checks, affected automated suites and integrated manual cases must pass on the recorded candidate.
Missing model credentials/environment coverage is NOT VERIFIED or BLOCKED, never PASS.
Apply [common verification](../README.md). This gate does not rewrite historical acceptance.

## Handoff

Record final contracts, fixtures, files, compatibility and retest owners in [HANDOFF.md](HANDOFF.md).
Downstream tasks follow the [master plan](../../IMPLEMENTATION-PLAN.md). Independent preparation can continue while a gate is blocked.
