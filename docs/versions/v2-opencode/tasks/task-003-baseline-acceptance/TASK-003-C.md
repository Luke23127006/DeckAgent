# TASK-003-C — Security and parity regression matrix

Owner: Codex, lane C. Status: IN PROGRESS; automated security and Gemini permission subset PASS, full acceptance pending.
Group: [Accept inherited V1/V2 behavior on OpenCode](README.md). Entry dependency: G-001 and G-002.

## Deliverable

Extend fixtures for cross-session tokens/roots, substitution races and revision conflicts. Keep legacy unit tests while that backend remains.

## File ownership

tests/v2-*.test.mjs; tests/recovery-editing.test.mjs; tests/outline-workflow.test.mjs; tests/publish-slide.test.mjs; tests/opencode-integration.test.mjs.

Existing test paths were inspected and kept unchanged. This change owns
`tests/opencode-baseline.test.mjs`, `tests/opencode-baseline-security.test.mjs` and
`tests/opencode-baseline-live.test.mjs`.
The existing public Host/client interfaces and request-local MCP bridge are the test seams.
No new runtime framework, dependency, schema or business rule is introduced.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

No source writes/cross-chat reads/publish-before-confirm; stale revision rejection; no new tool starts or revisions after Stop drain. Separate bounded observation from enforced barriers.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-003 also needs [integrated scenarios](README.md).
