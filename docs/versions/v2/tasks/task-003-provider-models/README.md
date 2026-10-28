# TASK-003 — Provider APIs, Model Metadata and Reasoning Levels

**Outcome:** Complete provider protocol support and per-model selection while keeping request-time settings stable and older models readable.  
**Sequence:** task group 3 of 7. **Dependency:** G-002.  
**Read first:** `../../SCOPE.md`, `../../IMPLEMENTATION-PLAN.md`, repository `AGENTS.md` and `docs/AGENTS.md`.

## Scope and precondition

G-002 PASS. Keep saved V1 provider configuration and model selection functional.

**Mapped requirements:** UC-005 MF/A1-A12/A14; UC-003 A17/A18/A19/A27/A28/A40/A41; FR-042/055/081; BR-005/006/008.

## Shared contract for A/B/C (freeze before coding)

**M1 — Model descriptor:** provider ID + model ID + optional display name, contextWindow, maxOutputTokens, inputModalities and `reasoningOptions: {label, apiValue}[]`. Unknown remains absent/Unknown.

**M2 — Selection:** `{provider, model, reasoningLevel?}`; previously persisted `{provider,model}` stays valid. A model without confirmed effort capabilities has no effort choice.

**M3 — Protocols:** `chat-completions`, `responses`, `anthropic-messages`, `gemini` are the allowed custom API protocols (`BR-005`). Validate tool-call parity by adapter.

**M4 — Capture:** create an immutable request-time selection + provider connection + validated model metadata/effort snapshot; later UI edits affect only next request.

The implementation keeps these proposed semantics through the public `ModelSelection`, `ModelDescriptor`, `ProviderSettings.modelMetadata` and `ModelConnection.protocol` interfaces. `reasoningLevel` names a saved choice; its `apiValue` is sent only by a Responses connection. `ProviderStore.capture` freezes that connection for the request, including its key, endpoint, maximum output and selected model's reasoning mapping. Session schema 3 stores optional `reasoningLevel`; schema 1 and 2 records migrate without filling a missing choice. The mocked request/response, migration and rejection fixtures are [v2-responses.test.mjs](../../../../tests/v2-responses.test.mjs) and [v2-model-capabilities.test.mjs](../../../../tests/v2-model-capabilities.test.mjs). Other providers have no invented reasoning mapping.

See [implementation evidence and manual acceptance](HANDOFF.md). The owner confirmed all G-003 gates passed on 28-10-2026 and requested TASK-004; the exact manual-run SHA and separate artifact were not supplied.

## Parallel subtasks

| Subtask | Primary owner | Deliverable |
|---|---|---|
| [TASK-003-A](TASK-003-A.md) | A — Platform / Host | Request model/effort contracts and Responses API adapter |
| [TASK-003-B](TASK-003-B.md) | B — Client / UX | Models Settings UI and per-chat model/effort picker |
| [TASK-003-C](TASK-003-C.md) | C — Tools / Security / QA | Provider persistence, model catalog metadata and validation fixtures |

**File ownership:** A exclusively edits shared Host, application composition and request orchestration files; B exclusively edits client runtime/views; C exclusively edits filesystem/adapter/data-parser packages and listed test fixtures. If one lane needs another lane's file, create a handoff request, not a concurrent edit. No one directly edits another task's files during this group.

## Integration procedure

1. A publishes final contract names, sample JSON requests/responses and migration/error cases.
2. A/B/C build their assigned subtasks in parallel against the contract and shared fixtures; each reports tests and changed files.
3. A integrates Host/application changes; B integrates UI with real endpoints; C runs adversarial and end-to-end fixtures.
4. Re-run impacted tests and existing outline/slide regression cases.
5. Record G-003 PASS only with all required observations; else record FAIL/BLOCKED with cause and owner in `../../PROGRESS.md`.

## G-003 — Acceptance gate

- Existing OpenAI/Anthropic/Gemini/DeepSeek provider configurations still open after restart.
- OpenAI Responses adapter sends and receives tool-call traces in a mocked compatibility test.
- Each model shows only its known effort options, never a globally invented Low/Medium/High mapping.
- Changing model or reasoning during a running request does not alter that running turn.
- Unknown metadata stays unset; `UC-005 A13` remains held until release default IDs are approved and tested.

**Commands:** `pnpm build`, `pnpm typecheck`, `pnpm test:model-providers`, `pnpm test:local-web`, `pnpm test:agent-runtime`.

## Risks and non-goals

`ModelSelection` and `ProviderSettings` are currently minimal. Any new field must be optional when reading V1 records; do not turn an unknown provider token limit into a fake reliable context meter. `BR-005 V-5` remains unset.

No part of this group changes Deck Export, commits new UC-001 flow behavior, or expands product scope beyond [SCOPE.md](../../SCOPE.md).
