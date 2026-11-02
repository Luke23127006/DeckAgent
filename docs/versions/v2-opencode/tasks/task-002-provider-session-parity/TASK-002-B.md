# TASK-002-B — Provider compatibility interaction

Owner: Codex, lane B. Status: GEMINI MANUAL SMOKE PASS; extended acceptance pending.
Implementation and automated client/browser cases PASS. The owner confirmed the Gemini smoke test PASS on 2 November 2026.
No itemized case results, browser version or exact manual candidate SHA were supplied.
Extended effort/model-switch and remaining protocol acceptance are not inferred.
Group: [Restore provider and session compatibility](README.md). Entry dependency: G-001.

## Deliverable

Retain settings and effort UI. Explain unsupported choices; never silently substitute models or drop options. Change UI only where parity requires it.

## File ownership

packages/client/runtime/src/{host-client,request-feedback}.ts; tests/opencode-provider-ui.test.mjs;
the added compatibility case in tests/browser-smoke.test.mjs. Model picker and Settings/effort views were retained.

The test path now exists. The client now preserves stable compatibility codes and explains how to change settings.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Unknown metadata stays unknown; failed save retains draft; active request keeps selection; old configurations readable.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-002 also needs [integrated scenarios](README.md).
