# Credentials & Models Architecture — DeckAgent

**Decision:** [ADR-0006](../adr/0006-credentials-models.md)  
**Related:** [Storage](data.md) · [Session](session.md) · [Tools/Permissions](tools-permissions.md)

## 1. Ownership and data flow

```text
Local Web UI                         DeckAgent Host
  | Provider setup/key submission       |
  |------------------------------------>| validate provider/key before save
  |                                     |-- SQLite: provider metadata,
  |                                     |           added models,
  |                                     |           Chat model selection
  |                                     |-- Dedicated credential store:
  |                                     |           raw provider/service keys
  |<------------------------------------| redacted provider status only
  |
  | Send request on Chat                |
  |------------------------------------>| capture immutable run settings
  |                                     | resolve key in Host only
  |                                     | create isolated OpenCode config/env
  |                                     +----> opencode run --format json -m ...
  |                                                 | provider API
  |<---- persisted events/status -------- Host <-----+
```

**SQLite is the authority for selections; credential store is the authority for secrets.** OpenCode is the execution transport, not the persistent provider registry.

## 2. Minimal contracts

| Component | Responsibilities | Does not own |
|---|---|---|
| Provider Registry | Stable IDs, endpoint/protocol, added model IDs, non-secret metadata | API key bytes, runtime session |
| Credential Store | Save/read/delete key by opaque reference, restrict OS access | Conversation, Deck, preview |
| Chat Selection | Provider ID, model ID, reasoning; no silent fallback | Credential bytes |
| Run Admission | Validate selected model; freeze settings; resolve secret only for run | Long-term credential storage in event/prompt |
| OpenCode Adapter | Map allowed protocol/model; inject run-scoped env/config; sanitize output | App provider selections or permissions |

## 3. Request lifecycle invariants

1. Provider setup: validate key/service before saving. Failed checks leave existing config/key unchanged (UC-005, FR-041).
2. Chat send: reject request if no selectable model; do not auto-select (UC-003 A17, FR-065).
3. Admission: capture provider/model/reasoning/config version **once**; active Request remains on its original settings even if user edits them (FR-042).
4. Launch: OpenCode receives only the selected provider's required secret in a process-scoped environment. Config references `{env:VARIABLE}`; avoid global `opencode.json` mutations. No secret in prompt, events or persisted diagnostics (NFR-006).
5. Follow-up: native-session resume only if the model/provider/context guards still match (ADR-0002). Otherwise start new native session while keeping DeckAgent Chat history.
6. Remove provider/model: active Request continues; affected Chat has no selected model afterwards and future requests require selection (FR-063, FR-065).

## 4. Security boundary and limitations

- Local Web communicates with the trusted Host API; saved keys are write-only from the UI perspective. Settings responses expose `hasKey` only.
- Dedicated credential store must be outside project folders, exports, logs and generated artifacts, with restricted local OS access. **Exact at-rest encryption/keychain mechanism is not yet selected**; the credentials build must select and test it before storing live keys.
- Even when a key is provided through a process environment, the child process and the machine's privileged users may be able to read it. Do not call this method isolation against a compromised OS or hostile local administrator.
- Validate custom base URL/protocol, allowed provider packages and credential routing; user-supplied provider ID must not cause arbitrary package loading.
- No raw OpenCode stderr, resolved config, environment dump or credential-bearing exception should be exposed to UI/SQLite.

## 5. Build handoff

**Foundation:** ProviderConfig/ModelSelection data contracts, storage credential references, Host/API trust boundary.

**Provider & Model Integration:** actual secret store for each supported OS, key-validation flows, OpenCode mapping and per-run environment, manual model IDs/reasoning, active-run settings snapshot, redacted errors.

**Tests:** rejected/timeout validation, no secret persistence outside credential store, invalid model, switch while running, model removal, cross-Chat separation, CLI config mapping and restart behavior.

**Open items assigned to implementation:** exact credential-at-rest technology and provider verification endpoints; BR-006 V-1 provider-specific required setup. These are not reasons to reopen the chosen OpenCode CLI architecture.

## References

- [ADR-0006](../adr/0006-credentials-models.md)
- [OpenDesign BYOK implementation](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/runtimes/byok-opencode.ts)
- [DeckAgent POC adapter](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37/apps/local-web/src/opencode/provider.ts)
- [DeckAgent spec UC-005](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/02-use-cases/UC-005.md)
