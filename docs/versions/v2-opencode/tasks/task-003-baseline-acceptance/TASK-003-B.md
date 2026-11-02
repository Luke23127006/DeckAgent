# TASK-003-B — Inherited browser/manual acceptance

Owner: Codex, lane B. Status: owner-confirmed Gemini smoke PASS; extended manual acceptance pending.
Group: [Accept inherited V1/V2 behavior on OpenCode](README.md). Entry dependency: G-001 and G-002.

## Deliverable

Reuse existing views. Execute inherited manual checklists and record tester/candidate. Include Vietnamese/English clarification, ambiguous edit scope and current permission behavior.

## File ownership

packages/client/runtime/src/ only for demonstrated regressions; tests/browser-smoke.test.mjs.

The existing client views and browser test paths were inspected and kept unchanged.
This change adds [a manual acceptance checklist](MANUAL-ACCEPTANCE.md).
OpenCode browser automation covers completion, Stop and reload without replay.
The inherited browser suite covers its existing fixture backend; it is not full OpenCode browser qualification.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Reload approval, stale response rejection, separate drafts, stable slide selection, reopen without inference; live permission decisions recorded.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-003 also needs [integrated scenarios](README.md).
