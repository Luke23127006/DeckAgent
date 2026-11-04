# TASK-006 — Add direct editing with controlled revisions

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **G-003**. Gate: **G-006**. Work status: IMPLEMENTED; OWNER BASIC SMOKE PASS.

Implementation checkpoint: 4 November 2026, `114dfd6` plus local changes.
The owner selected controlled HTML patches (option A). See accepted
[HTML patch decision](../../../../adr/0006-controlled-slide-html-patches.md),
[delivered contract](CONTRACT.md), [handoff](HANDOFF.md),
[manual smoke](MANUAL-ACCEPTANCE.md) and [evidence](evidence.json).
G-003 remains NOT VERIFIED; implementing the requested feature does not waive it.

The direct editor is available with either backend. OpenCode stays opt-in.
HTML remains canonical; no existing database schema changes. Text, font size,
alignment and top/left margins use revision-bound patches through DeckService.
The canvas keeps its opaque iframe sandbox. Legacy unsupported HTML remains
viewable without automatic conversion. Undo, collaboration and free drag/drop
remain outside the agreed editor scope.

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

Owner acceptance checkpoint (4 November 2026): the supplied three-step basic manual smoke is PASS: direct text/layout editing and save, reload, then AI patching of slide two while preserving visible layout and slide one. This supersedes the earlier pending basic-smoke status. It is aggregate owner confirmation without separate manual HTML/revision artifacts or exact candidate/browser/model. Optional conflict/busy manual checks and G-003 remain pending; G-006 stays NOT VERIFIED. Earlier live failures and automated retests remain recorded. No production code changed or tests reran for this status update.
