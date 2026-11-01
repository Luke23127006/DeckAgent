# TASK-001-B — Verify client contract

Owner: Codex, lane B. Status: PASS / COMPLETE.
Client fixtures and automated browser checks passed; the owner confirmed manual smoke PASS on 2 November 2026.
Group: [Port and qualify the OpenCode adapter](README.md). Entry dependency: Recorded dev/POC baseline; production seam proposal reviewed.

## Deliverable

Trace current Host snapshots and activity events to existing views. Verify states without adding token-stream UI. Request Host changes from A only for demonstrated incompatibility.

## File ownership

tests/opencode-client-contract.test.mjs; tests/opencode-browser.test.mjs;
the client checklist in HANDOFF.md. No client source or UI was changed.

These paths now exist. Browser tests use the real pinned CLI with a provider fixture.
Separate live-model tests use the real Host and clients. Owner-confirmed smoke acceptance closes this lane.
Browser version, exact manual candidate SHA and itemized manual results were not supplied.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Browser smoke, activity ordering, reload, no duplicate messages and correct request controls.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-001 also needs [integrated scenarios](README.md).
