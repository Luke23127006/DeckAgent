# TASK-002-C — Protocol and long-history qualification

Owner: lane C; named assignee pending. Status: NOT STARTED.
Group: [Restore provider and session compatibility](README.md). Entry dependency: G-001.

## Deliverable

Map Chat Completions, Responses, Anthropic Messages and Gemini to pinned CLI behavior. Preserve catalog and credential protection. Measure long-history limits/cost. Do not rebuild a model loop to fill incompatibilities.

## File ownership

packages/llm/providers/src/ provider utilities; proposed tests/opencode-provider-parity.test.mjs and tests/opencode-session-parity.test.mjs.

Proposed paths do not exist yet. Confirm module placement before implementation.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Per-protocol wire and live cases; custom URL, reasoning, temperature, token/timeout options; redacted failures; overflow preserves history.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-002 also needs [integrated scenarios](README.md).
