# TASK-003 handoff and G-003 manual acceptance

Candidate: `feature/v2-task-003-provider-models`, based on `6611c57` (the merged TASK-002 result). The owner confirmed all G-002 manual gates passed on 28-10-2026. The exact manual-run SHA and separate artifact were not supplied.

## Delivered behavior

- `ModelSelection` keeps `{provider,model}` valid and adds optional `reasoningLevel`. Session schema 3 migrates schema 1/2 records transactionally; existing messages and absent choices remain unchanged. The offline importer accepts the current schema as a source without changing its copy/backup checks.
- `ModelDescriptor` holds only user-saved optional fields. A catalog lookup still returns model IDs; it never adds default models or guesses metadata. Existing four built-in IDs and their saved configurations remain stable. The four allowed custom API protocol IDs are `chat-completions`, `responses`, `anthropic-messages` and `gemini`.
- Provider Settings edits the metadata of each added model. The picker groups models by provider, displays the saved name and offers only that model's saved reasoning choices. A failed validation leaves the draft in the form and leaves saved settings unchanged. Explicitly removing a model or provider clears its selected Chats; removing one reasoning choice clears only that choice. A temporarily unavailable provider at startup keeps the old selection so it can be repaired.
- `ProviderStore.capture` freezes the selected model, credential, endpoint, output limit and reasoning mapping for the entire Host request, including a clarification reply. Changes to Settings or the Chat selection affect later requests. Invalid model/effort combinations are refused before model work.
- The Responses adapter sends stateless `POST /responses` requests, keeps encrypted reasoning/output items in the opaque provider state and replays tool calls with matching `function_call_output` items. Incomplete, failed or malformed streams raise `MODEL_PROTOCOL`. The provider key remains in the HTTP header, outside saved Settings responses and model-visible history.

OpenAI's [function calling guide](https://developers.openai.com/api/docs/guides/function-calling) and [reasoning guide](https://developers.openai.com/api/docs/guides/reasoning) document the request, tool-result and stateless encrypted-reasoning shapes used by the mock fixtures. No live provider call was made by the agent.

## Automated evidence

Windows, Node 22.19.0, pnpm 11.28.5, isolated temporary profiles and loopback mock providers:

| Check | Result | Scope |
|---|---|---|
| `pnpm.cmd build`, `pnpm.cmd typecheck`, `pnpm.cmd lint` | PASS | Shared TypeScript contracts, app and client |
| `pnpm.cmd test:model-providers` | 28/28 PASS | Four adapter protocols, catalogs, per-model settings, schema 2 migration, request capture, protocol errors |
| `pnpm.cmd test:local-web`, `pnpm.cmd test:tools-browser` | 9/9 and 16/16 PASS | Host Settings, requests and client API parsing |
| `pnpm.cmd test:browser-smoke` | 7/7 PASS | Real Chrome wizard, model picker, reasoning option and failed-save draft; old chat/deck flows |
| `pnpm.cmd test:agent-runtime`, `pnpm.cmd test:session-persistence`, `pnpm.cmd test:workspace`, `pnpm.cmd test:chat-lifecycle` | 35/35, 9/9, 19/19, 3/3 PASS | Runtime, schema, offline import and prior gates |
| `pnpm.cmd test:outline-workflow`, `pnpm.cmd test:slide-pipeline`, `pnpm.cmd test:recovery-editing` | 19/19, 9/9, 26/26 PASS | Existing outline, slides and recovery behavior |
| `pnpm.cmd format:check` on three new source/test files; `git diff --check` | PASS | New-file formatting and whitespace |

A broader `format:check` invocation across 16 touched existing and new files failed: Biome would reformat the older files wholesale, including line endings and unrelated long-form layouts. This is formatting drift, not a failing typecheck or test. The three new files pass targeted formatting; a separate repository formatting cleanup is needed before a whole-file format gate can pass without obscuring the Task 3 diff.

The first workspace regression after schema 3 failed 2 legacy-import cases with `LEGACY_DATABASE_INVALID`; the importer accepted only schema 1/2. Extending its validated source versions to include 3 restored 19/19. The new browser case initially searched for a model ID in a display-name label; it now checks the option value. A second browser failure showed the client suppressed `INVALID_MODEL_METADATA`; passing that safe code through the management client made the actionable error visible. An outline regression then showed that clearing selections at startup prevented a saved Chat from recovering when its provider was configured later. Selection reconciliation now runs only after an explicit change to that provider; outline workflow passed 19/19 on retest. These failures are retained here as retest evidence.

Mocks prove request shapes and local persistence. They do not prove that a live account accepts every configured model, tool schema, effort value or certificate chain. A saved capability value records an explicit user choice, not a provider-verified guarantee. Reasoning choices are currently accepted only for Responses models because the other protocols have no approved per-model API mapping. `BR-005 V-5` release default model IDs remain unset; restore-default-model acceptance is held.

## Provider compatibility evidence

| Provider configuration | Protocol | Mock input/output | Mock tool-call round trip | Live account |
|---|---|---|---|---|
| OpenAI-compatible custom API | Responses | PASS | PASS, including stateless reasoning replay | NOT VERIFIED |
| OpenAI built-in / compatible custom API | Chat Completions | PASS | PASS | NOT VERIFIED |
| Anthropic built-in / compatible custom API | Anthropic Messages | PASS | PASS, including signed thinking replay | NOT VERIFIED |
| Google Gemini built-in / compatible custom API | Gemini | PASS | PASS, including signed part replay | NOT VERIFIED |
| DeepSeek built-in | Chat Completions | Shared adapter PASS; endpoint-specific live check pending | Shared adapter PASS | NOT VERIFIED |

## Fast manual G-003

Use the same profile and key you used for Task 2 after stopping the Host. Build, then restart with the same `--data-dir` and any previous `--workspace` argument. Create new test Chats inside the profile; keep existing Chats for restart/readability checks. Record the candidate commit, provider/model IDs, tester and date without copying keys.

1. Open Settings. Verify saved OpenAI, Anthropic, Gemini and DeepSeek configurations still appear where you had configured them. Restart the Host and check again. Open an old Chat; its history and selected model should remain.
2. Add a **custom** API configuration using the Responses protocol and a model ID supported by your account. Save one reasoning choice only if you know its API value for that model. Add another model without reasoning choices. The picker must show the first model's choice only; unknown context and output fields remain empty.
3. Start a long request in Chat X. While it runs, change X's model or reasoning choice, and edit the selected model's saved setting. The running request must finish without restarting. Send a second request; it should use the newly saved choice. Check X's request history for the original selected model/level.
4. In Settings, give a model a maximum output larger than its context window and save. The form should explain the error and retain the attempted values. Cancel; reopen Settings and verify the saved values remain.
5. Remove a saved reasoning choice from a model selected in a test Chat. The Chat should keep the model and clear that choice. Remove the model itself; the Chat should have no selected model while its history remains. A provider that is only unavailable when Host starts should keep the old choice for repair.
6. With a Responses model, ask for a safe built-in tool action such as reading a test file in the Chat's private work root, then ask a follow-up that uses the result. Confirm the tool call and answer stay in that Chat. A mock passing result is recorded above; any live call needs its own observation.
7. Reopen an old outline and published deck and send a short follow-up. Verify the deck and history remain readable. Do not try restore-default-model acceptance until release model IDs are approved.

G-003 remains `NOT VERIFIED` until these observations pass. A failed live-provider combination should be recorded by provider, model, protocol, safe error code and retry action; never include the key, raw provider response or private document content. Issue publication remains pending authorization.
