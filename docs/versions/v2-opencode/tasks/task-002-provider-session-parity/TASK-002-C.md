# TASK-002-C — Protocol and long-history qualification

Owner: Codex, lane C. Status: BLOCKED for remaining live qualification.
Four-family wire/MCP fixtures and history tests PASS; native Gemini live PASS.
Standard Chat Completions, Responses and Anthropic live cases lack credential/model pairs.
Group: [Restore provider and session compatibility](README.md). Entry dependency: G-001.

## Deliverable

Map Chat Completions, Responses, Anthropic Messages and Gemini to pinned CLI behavior. Preserve catalog and credential protection. Measure long-history limits/cost. Do not rebuild a model loop to fill incompatibilities.

## File ownership

tests/opencode-provider-parity.test.mjs; tests/opencode-session-parity.test.mjs;
tests/opencode-parity-live.test.mjs; tests/fixtures/opencode-{wire,crash}.mjs.
Existing public ModelProviders validation/catalog/DPAPI utilities were reused; no provider package changes were needed.

These files now exist. Fixtures are not live evidence. Google Gemini 3 via Chat compatibility is now rejected
before work after the pinned SDK failed to preserve tool thought signatures.
A owns shared application wiring, Host/domain contracts, storage, manifests and lockfile. B owns client views. C owns tool/provider adapters and test fixtures unless explicitly assigned otherwise at kickoff.
One editor per file: changes needed in another lane's files go to that owner. Record the exact exception-free list before implementation.

## Verification

Per-protocol wire and live cases; custom URL, reasoning, temperature, token/timeout options; redacted failures; overflow preserves history.

Apply [common evidence rules](../README.md). Fixture completion does not replace integrated/manual or live-model acceptance.

## Handoff

Record files, contracts, commands/results, SHA and failures in [HANDOFF.md](HANDOFF.md).
Lane acceptance needs its checks; group G-002 also needs [integrated scenarios](README.md).
