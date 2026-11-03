# TASK-004-B — Attachment and reference interaction

Owner: Codex, lane B. Status: implemented; browser subset PASS; owner manual acceptance pending.
Group: [Complete source-to-presentation input](README.md). Entry dependency: G-003.

## Deliverable

Complete the disabled attachment path with ready/rejected/extracting states and named references. Preserve drafts and selection; references are not permanent attachment copies.

## File ownership

packages/client/runtime/src/; proposed tests/materials-browser.test.mjs.

Actual placement: `materials-view.ts`, existing Composer/Host client/error feedback,
and `tests/materials-browser.test.mjs`. No new client framework.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Corrupt/protected files cannot send as ready; removal/restart; attachment-only send; accessible errors.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-004 also needs [integrated scenarios](README.md).
