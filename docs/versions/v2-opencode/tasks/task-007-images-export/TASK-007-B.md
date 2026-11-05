# TASK-007-B — Image/export interaction

Owner: lane B, implemented by Codex. Status: IMPLEMENTED; owner basic smoke PASS; browser checks PASS.
Group: [Deliver images and usable export](README.md). Entry dependency: G-003; G-006 before final artifact integration.

## Deliverable

Expose selected image/export operations, statuses and errors. Validate output after direct edits; no general research dashboard.

## File ownership

packages/client/runtime/src/; tests/images-export-browser.test.mjs.

Exact paths are recorded in [CONTRACT.md](CONTRACT.md). The image/PDF panel imports URLs,
shows source provenance, inserts into the selected slide and downloads committed revisions.
Import/export can be cancelled. Image insertion is a short revision-checked save, not a cancellable background job.
Unknown save outcomes retain the publication ID for safe retry. Conflicts require a refreshed base.

## Verification

Image provenance where needed; acquisition failure; export open/download; no replay/scope expansion.

PASS: real browser import, source display, selected-slide-only revision, image decoding inside
an opaque sandbox, direct edit preserving image, authenticated export and actual download button.
Restart reads saved bytes without refetching the source. Owner manual acceptance remains pending.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-007 also needs [integrated scenarios](README.md).

## Owner smoke confirmation

Owner confirmed the six-case basic smoke PASS in chat on 5 November 2026. This is an aggregate report; exact manual candidate SHA, browser/model versions and itemized artifacts were not supplied. Extended cancellation/isolation checks and G-003/G-006 remain open. G-007 stays NOT VERIFIED.
