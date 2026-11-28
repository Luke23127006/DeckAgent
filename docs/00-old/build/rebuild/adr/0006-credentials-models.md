# ADR-0006 — Credentials & Models

**Status:** Accepted — architecture direction  
**Date:** 2026-11-10  
**Decision:** TD-06  
**Depends on:** [ADR-0001](0001-local-storage.md), [ADR-0002](0002-chat-session-history.md), [ADR-0003](0003-tools-permissions.md)

## Context

DeckAgent is local-first and BYOK. UC-005 allows user-configured providers, custom model APIs, a user-selected model and reasoning level for each Chat. A provider configuration must be validated before saving (FR-041); each running Request must keep the model/provider settings captured at its start (FR-042). NFR-006 prohibits API keys in conversation, model-visible inputs, decks, error records or files outside the designated credential store.

OpenDesign has an OpenCode BYOK adapter that passes credentials in a run-scoped environment variable and references it through an OpenCode provider config. It also has a broader `app-config.json` mechanism for CLI preferences; that **must not be copied as an assumption that plaintext JSON is an acceptable DeckAgent credential store**. The `feat/v2-opencode` POC already captures a selected connection/model per request, builds OpenCode provider configuration and validates supported protocol settings.

## Decision

1. **DeckAgent owns provider configurations, model catalog choices and Chat model selection.** SQLite stores non-secret fields: provider ID, protocol, base URL, added model IDs, metadata, and Chat-selected model/reasoning. Stable built-in IDs are `openai`, `anthropic`, `google`, `deepseek` per BR-005. Custom providers use a separate validated ID; DeckAgent never chooses a substitute model automatically.
2. **Dedicated local credential store.** The Host, not the browser or SQLite product tables, stores raw keys in a designated credential store under DeckAgent Application Storage, with OS-level access restrictions. SQLite holds only a credential reference and `hasKey` metadata. The store must not be placed in a project folder, a Chat artifact, an export, or a repository. This is a *local-at-rest access boundary*, not a claim that plain files are encrypted: encryption/OS keychain choice is implementation work in the first credentials build and must be verified for supported OS targets.
3. **Host-only secret resolution at request admission.** UI can submit a key during setup over the local Host API but cannot read the saved value back; settings APIs return masked presence only. Host validates the provider/key before saving, and on failed checks leaves the previous credential intact (FR-041). Secrets cannot enter conversation, prompt, activities, diagnostic/event payloads or artifacts.
4. **Run-scoped OpenCode provider configuration.** Capture an immutable per-request snapshot: provider ID, protocol, endpoint, exact model ID, reasoning level and relevant settings. Resolve the credential only for the run's OpenCode process. Prefer OpenDesign's per-process environment-variable reference (`{env:...}` in provider config) rather than embedding literal keys into generated JSON/config. Use an isolated launch environment and scrub logs/errors. The selected provider receives the key; tools/model prompt do not. Do not persist the snapshot if it contains a secret.
5. **Separate user provider IDs from OpenCode internal routing IDs.** A custom API is mapped to the supported OpenCode provider package/transport without treating user-supplied identifiers as arbitrary executable packages. Provider protocol/model compatibility is checked before launch; unsupported combinations produce an explicit error, not a silent fallback. Keep OpenCode CLI pinned behavior in the relevant build tests.
6. **Changes affect future requests only.** Editing/deleting provider configurations or removing added models does not stop an active Request (FR-042/063). A Chat whose selected model is removed becomes unselected after the current Request, without auto-selecting an alternative (FR-065). New native session/resume guards must account for model/provider/context changes (ADR-0002).
7. **Model catalog is separate from user choices.** Fetch provider catalog when available, but save only added models; if catalog lookup fails, manual model ID entry remains possible (FR-058). Reasoning choices are validated against provider/model capabilities where known; never invent a supported level.

## Rationale

- Follow OpenDesign's **BYOK runtime transport pattern** while enforcing DeckAgent's stricter NFR-006 credential ownership.
- Keep UI, product database and generated artifacts free of raw keys. Limit per-run exposure rather than writing credentials into OpenCode global/project config files.
- Keep user selection authoritative, matching UC-005/FR-042/FR-065, and make provider configuration independent of OpenCode native-session IDs.
- Reuse `feat/v2-opencode` protocol mapping/validation as *reference code*, not as the whole legacy provider/runtime architecture.

## Consequences / contracts

- Minimal Host services: `saveProviderConfigValidated`, `listProviderConfigsRedacted`, `listAddedModels`, `selectChatModel`, `captureRequestModelSnapshot`, `resolveCredentialForRun`.
- `ProviderConfig` and `ChatSelection` are persisted in SQLite; credential bytes live only in the credential store and run-scoped process memory/environment. Deletion must clear credentials as well as configuration when no longer needed.
- Provider verification must not leak submitted secrets in thrown errors; stdout/stderr/debug config and telemetry must redact secrets. Avoid printing child-process environments or resolved OpenCode config.
- Tests in credentials/model build: invalid key and timeout preserve old setting; no key in DB/message/log/exports; supported provider/custom-protocol mapping; manual model; provider/model removal; model/reasoning changes during active run; correct OpenCode arguments; two Chats with different providers; no cross-Chat credential access.
- **Not decided here:** exact OS-specific credential store/encryption mechanism, provider-specific check endpoint, exact SQL tables, default model. These must be established in the implementing build before accepting real user keys. BR-006 V-1 remains a product-rule value to set after provider integration work, not silently filled by this ADR.

## Evidence

- [OpenDesign BYOK adapter](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/runtimes/byok-opencode.ts) — process environment API key and `{env:...}` reference in OpenCode provider config.
- [OpenDesign app configuration](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/app-config.ts) — broader CLI settings persistence; not adopted as the secret-store design.
- [DeckAgent POC provider mapping](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37/apps/local-web/src/opencode/provider.ts) — request-specific provider/model validation.
- [UC-005](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/02-use-cases/UC-005.md), [BR-005](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/04-business-rules/BR-005.md), [BR-006](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/04-business-rules/BR-006.md), [NFR-006](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/nfr/NFR-006.md), [FR-041](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-041.md), [FR-042](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-042.md).

**Evidence level:** source-code review only; no live runtime test was performed during this planning step.
