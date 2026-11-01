# TASK-001-A — Port opt-in adapter

Owner: lane A; named assignee pending. Status: NOT STARTED.
Group: [Port and qualify the OpenCode adapter](README.md). Entry dependency: Recorded dev/POC baseline; production seam proposal reviewed.

## Deliverable

Selectively port 092b799 code/tests, without its historical documentation edits. Verify executable provenance/hash and isolated configuration. Retain explicit backend selection and no automatic fallback. Publish contract and phase-tool fixtures.

## File ownership

apps/local-web/src/opencode/{agent,mcp-bridge,process}.ts; apps/local-web/src/{web-request,index,cli}.ts; root/app manifests and lockfile.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Build/typecheck; wrong binary/config fails before inference; old backend smoke; bounded malformed/truncated JSON and sanitized error paths.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-001 also needs [integrated scenarios](README.md).
