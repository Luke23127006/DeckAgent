# TASK-001-C — Port isolation and MCP tests

Owner: Codex, lane C. Status: PASS for automated CLI/model isolation and MCP qualification.
Group acceptance remains separate; see [HANDOFF.md](HANDOFF.md).
Group: [Port and qualify the OpenCode adapter](README.md). Entry dependency: Recorded dev/POC baseline; production seam proposal reviewed.

## Deliverable

Promote repeatable spike capture/assertions into test-owned fixtures. Cover actual tool list, MCP tokens, validation/errors, project/plugin/agent bypass attempts and active cancellation. Never copy local credentials.

## File ownership

tests/opencode-agent.test.mjs; tests/opencode-integration.test.mjs;
tests/opencode-tool-isolation.test.mjs; tests/opencode-process.test.mjs;
tests/fixtures/opencode-phase-tools.mjs. Adapter fixes were made by the same integrator in lane A.

These paths now exist. Tests capture provider-bound declarations from the real pinned CLI.
Live-model MCP error/recovery and cancellation are separate from provider fixtures.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Real CLI/model MCP arguments/results/errors; actual tool-list capture; revoke/drain/process-tree Stop and no newly accepted tools after Stop. Config audit alone cannot pass isolation.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-001 also needs [integrated scenarios](README.md).
