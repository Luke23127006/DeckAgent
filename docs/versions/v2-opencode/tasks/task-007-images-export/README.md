# TASK-007 — Deliver images and usable export

Integrator: A. Owners: A Platform/Host, B Client/UX, C Tools/Adapters/QA. Named assignees pending.
Entry dependency: **G-003; G-006 before final artifact integration**. Gate: **G-007**. Work status: NOT STARTED.

## Contract handshake

Choose one image route (Internet OR AI service) and minimum export format with the owner. Assets have provenance, ownership and safe local references. Export freezes committed revisions; it does not regenerate slides.

A records exact symbols, input/result/error samples and file ownership before parallel implementation.
B and C can prepare independent fixtures together. Integration waits for entry gates.
Proposed product, representation or package choices need a recorded decision before dependent code starts.

## Subtasks

| Task | Lane | Deliverable |
|---|---|---|
| [TASK-007-A](TASK-007-A.md) | A | Asset/export domain and lifecycle |
| [TASK-007-B](TASK-007-B.md) | B | Image/export interaction |
| [TASK-007-C](TASK-007-C.md) | C | Image acquisition and artifact qualification |

## G-007 acceptance

Real image-route deck saves/reopens/exports in chosen format. Inspect Vietnamese fonts, layout, images, order and content in an independent viewer. Denied network/export failures preserve deck. Final acceptance uses direct-edit representation.

All lane checks, affected automated suites and integrated manual cases must pass on the recorded candidate.
Missing model credentials/environment coverage is NOT VERIFIED or BLOCKED, never PASS.
Apply [common verification](../README.md). This gate does not rewrite historical acceptance.

## Handoff

Record final contracts, fixtures, files, compatibility and retest owners in [HANDOFF.md](HANDOFF.md).
Downstream tasks follow the [master plan](../../IMPLEMENTATION-PLAN.md). Independent preparation can continue while a gate is blocked.
