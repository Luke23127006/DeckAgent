# TASK-003-A — Lifecycle and storage compatibility

Owner: Codex, lane A. Status: IN PROGRESS; automated subset PASS, full acceptance pending.
Group: [Accept inherited V1/V2 behavior on OpenCode](README.md). Entry dependency: G-001 and G-002.

## Deliverable

Fix demonstrated adapter regressions only. Stop must revoke access, abort tools, terminate descendants and drain before releasing request admission. Use copies for recovery.

## File ownership

apps/local-web/src/{web-request,index,workspace-registry,permission-store}.ts; packages/host/api/src/; packages/session/persistence/src/; packages/presentation/deck/src/.

Existing production paths were inspected. No production edits were needed for the observed cases.
This change owns `package.json` and `scripts/test-opencode.mjs`; C owns the added test files.
See [the handoff](HANDOFF.md) for exact contracts, evidence and outstanding crash/publication checks.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Stop before spawn/during approval/publication; killed Host restart; concurrent requests; failed save; old histories/decks preserved.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-003 also needs [integrated scenarios](README.md).
