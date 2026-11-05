# TASK-008-A — Reusable external tool access

Owner: lane A; named assignee pending. Status: IMPLEMENTED; automated and full live retest PASS; manual/extended acceptance pending.
Group: [Package reusable presentation Agent Skills](README.md). Entry dependency: G-001 and G-003 for prototype; G-004, G-006 and G-007 for final gate.

## Deliverable

Decide minimal entrypoint without copying web Host/daemon. Separate transport credentials and authority. Preserve confirmation/revision/policy checks; approve package responsibility changes first.

## File ownership

apps/local-web/src/external-presentation.ts, external-cli.ts and external-host.ts; shared package implementations remain unchanged.

Implementation placement is recorded in [CONTRACT.md](CONTRACT.md). Codex implemented the lanes sequentially.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Host-independent start; explicit roots; denied cross-session/stale revision calls; same domain semantics as app.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-008 also needs [integrated scenarios](README.md).

## Implementation checkpoint

The owner selected standalone OpenCode CLI. Product instructions live in product-skills/deckagent-presentation.
The app-local stdio entrypoint uses DeckService and ToolRegistry without starting Web Host or a custom agent loop.
Confirmation is operator-only; Chat identity, admission version and slide grants are fixed at process start.
See [the contract](CONTRACT.md), [handoff](HANDOFF.md) and [manual checklist](MANUAL-ACCEPTANCE.md).
G-008 remains NOT VERIFIED; earlier gates and owner/extended acceptance remain open.
