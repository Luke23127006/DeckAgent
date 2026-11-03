# TASK-004-C — Parsers and material projection

Owner: Codex, lane C. Status: implemented bounded parsers/MCP/image path; extended qualification pending.
Group: [Complete source-to-presentation input](README.md). Entry dependency: G-003.

## Deliverable

Review parser licenses/resource limits. Deliver seven formats, including tested image interpretation. Bound archive expansion; treat embedded instructions as untrusted. Expose authorized material only.

## File ownership

packages/tools/filesystem/src/; proposed parser module after placement decision; proposed tests/materials-ingestion.test.mjs.

Actual placement: app-local `materials/parser.ts` and `parser-worker.ts`; public binary file-read helper;
existing request-local MCP/CLI adapter; material ingestion/security/wire/live fixtures.
No replacement agent loop or daemon was added.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Known facts per format; malformed archives/images/PDF; replacement races; resource limits; live model uses facts without executing document instructions.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-004 also needs [integrated scenarios](README.md).
