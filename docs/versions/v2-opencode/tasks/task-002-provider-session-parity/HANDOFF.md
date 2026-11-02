# TASK-002 — Provider/session handoff

Updated 2 November 2026. Owner/integrator: Codex for A/B/C.
Entry G-001 remains owner-confirmed PASS. G-002: **NOT VERIFIED**.
A implementation/automated checks PASS. B Gemini manual smoke is owner-confirmed PASS; extended acceptance remains pending.
C is blocked on remaining live credentials/models.
No production-default switch, commit, push or Issue publication occurred.

## Candidate and ownership

Baseline: 12faae91ee4f996b19a4529b561825008f17563f, initially clean on feat/v2-opencode.
Candidate is that commit plus the files hashed in [evidence.json](evidence.json).
One editor executed all lanes; no concurrent file ownership conflicts.

| Lane | Actual files |
|---|---|
| A | apps/local-web/src/provider-settings.ts; provider-generation-options.ts; opencode/{agent,provider,history,config}.ts; package.json; scripts/test-opencode.mjs |
| B | packages/client/runtime/src/{host-client,request-feedback}.ts; tests/opencode-provider-ui.test.mjs; compatibility case in tests/browser-smoke.test.mjs |
| C | tests/opencode-provider-parity.test.mjs; tests/opencode-session-parity.test.mjs; tests/opencode-parity-live.test.mjs; tests/fixtures/opencode-{wire,crash}.mjs; contract update in tests/opencode-client-contract.test.mjs |
| Integrator | This group's files and evidence; V2 OpenCode PROGRESS/DECISIONS; docs/development/opencode.md |

No shared package responsibility, public AgentHandle/Message/SessionStore interface or database schema changed.
The public ModelProviders validator/catalog/DPAPI utilities are reused, not copied or replaced.
The SDK and executable pins are unchanged; no dependency or lockfile package changes were needed.
Permanent architecture/distribution choices remain proposed. This work extends the opt-in app-local seam only.

## Contracts and compatibility

[COMPATIBILITY.md](COMPATIBILITY.md) is the detailed protocol/options/history matrix.
ProviderStore.captureOpenCode snapshots saved IDs, model, metadata overrides, credential and options once.
Saving Settings or changing Chat selection during work does not alter an active snapshot; the next request uses new values.
Generation defaults from older connection configs now survive Settings save/reload instead of disappearing.
Existing protocol immutability and credential protection remain enforced.

Native selector deckagent/selected is private; wire model IDs and saved application IDs stay exact.
Only four fixed bundled SDKs can be selected. Fixed session titles prevent auxiliary title-model inference.
Unsupported options return HTTP 409 before inference. The client preserves stable codes, explains settings actions and keeps the unsent draft.
Model picker/Settings/effort views were retained.

Fresh native sessions receive quoted portable history, not signed providerState replay.
Tool arguments, IDs, result/error associations and interrupted state are preserved as data.
An unfinished call is unconfirmed; unmatched results are orphaned.
Crash recovery does not execute recorded calls or invent tool results.
Ordinary input appends once; continuation appends none; caller prompt context is copied at send admission.
A 4,000,000-byte transport guard and disabled native compaction/pruning prevent silent history trimming.
This does not estimate a model token window. Provider-side overflow still fails safely with admitted history preserved.

Private execution records distinguish application selection, Host request, execution UUID and native session identity.
Observed CLI token samples are kept; monetary cost is null rather than a misleading zero from absent native catalog pricing.
Only validated HTTP status values enter failure diagnostics; raw provider bodies/headers are not published.

## Verified behavior

- Four protocol families: actual pinned CLI wire model/root/auth/options/tool declarations.
- Each family: real MCP argument, sanitized error, recovered result and subsequent text through a provider fixture.
- Custom model IDs, Responses effort labels, temperature/output mappings and API timeout.
- Explicit rejection of unsupported fields, bounds, reasoning/temperature combinations and known signature-incompatible endpoint/model.
- Active Host request keeps its captured model while Settings and Chat selection change; following request uses the new model.
- Settings defaults/credentials survive save and reopen; unknown model metadata remains absent.
- Copied schema-2 SQLite fixture retains original file hash, history and IDs; existing migration path changes only the copy.
- Real process crash after persisted MCP call, before result: SQLite reopens with an unconfirmed record and no automatic replay.
- Fresh native IDs across sends; continuation/context override; foreign provider state excluded.
- Long-history transport probes retain first/middle/last markers and all stored turns at roughly 16 KiB, 128 KiB and 1 MiB.
- Browser compatibility rejection explains the error, keeps input and does not start inference.
- Existing presentation/permission/isolation behavior remains covered by regression and live Gemini scenarios.

## Commands and evidence

Use Node 22.19.0 and pnpm 11.28.5. Windows x64 OpenCode 1.19.5 SHA256:
d7b473388cb62555970e400ce54cdfb6d6573608beea6f8fdf382cd1a698a3fa.
MCP SDK 1.26.0. All fixtures/profiles are test-owned.
Credentials came only from local environment/optional .env; values are absent from this handoff and evidence.

- pnpm.cmd build / typecheck / lint: PASS.
- format:check on the 13 new or previously formatted source/test files: PASS.
- Existing compact layout in provider-settings, client error files and browser-smoke was retained to avoid unrelated reformatting.
- pnpm.cmd install --lockfile-only --offline --frozen-lockfile: PASS; fresh install is not newly certified.
- pnpm.cmd test:opencode:parity:cli: 24 PASS, zero failures/skips; sanitized summaries in evidence.json.
- pnpm.cmd test:opencode:parity: 9 PASS, 15 SKIP; skips do not qualify runtime behavior.
- pnpm.cmd test:opencode:cli: 16 PASS, including provider-bound native-tool isolation.
- Affected legacy suites: 171 PASS.
- pnpm.cmd test:browser-smoke: 9 PASS, including the new compatibility/draft case.
- Existing live Gemini suite: 3 PASS (error/recovery, active Stop, full outline/confirm/two slides/slide-two edit/isolation/restart).
- Live parity: native Gemini legacy-context/MCP/observed-usage PASS. Standard Chat, Responses and Anthropic missing pairs remain NOT VERIFIED.
- Later settings-preservation changes were retested with the affected Settings/model suites; historical runs are not rewritten.
- Config literal-encoding security regression and subsequent credential/wire/live retests are recorded separately below and in evidence.

## Failures, fixes and coverage decisions

1. First Chat tracer failed because the adapter was Gemini-only; mapped fixed bundled SDKs and exact wire IDs.
2. Initial option capture rejected Responses. Added request-local mapping and metadata override validation.
3. A title-generation request used native default temperature rather than the chosen agent temperature.
   Fixed native titles remove that extra inference; all captured task requests now use the selected model/options.
4. Responses reasoning plus temperature silently lost temperature in the bundled SDK.
   Such combinations, and recognized reasoning-model temperature requests, now reject before work.
5. Early test assumed provider Settings could not change under an active lease.
   Existing semantics allow safe edits while capture remains immutable; test now verifies old and next snapshots separately.
6. Chat-compatible Google live returned HTTP 400 because Responses-only store=false leaked into Chat bodies.
   Restricted store=false to Responses and added a wire regression.
7. After that fix, Google invoked the probe but rejected the next turn for missing thought_signature.
   The pinned compatible SDK loses the required Gemini 3 signature.
   The adapter now refuses that Google endpoint/model before any tool side effect.
   Failed live records are retained; the positive probe remains an explicit diagnostic opt-in, not a claimed supported case.
   No signature bypass, native SDK patch, proxy agent loop, model substitute or unsafe retry was added.
8. Saving/reopening Settings dropped legacy generation defaults.
   Added generation-options preservation and round-trip tests, including continued rejection of max_completion_tokens.
   Validation order was corrected to preserve the existing PROTOCOL_IMMUTABLE error.
9. A real-CLI canary proved that file/env tokens in agent prompt config could read a file or interpolate a credential
   before model-visible tool filtering. The file/key were fake test canaries, not user secrets.
   Generated config now encodes those tokens as JSON Unicode literals before CLI substitution.
   SDK credentials are literal private environment-config values, never checked-in configuration.
   JSON decoding preserves exact user strings; file/env canaries no longer enter model request data.
   This strengthens application-level isolation; it is still not an OS sandbox.

## Remaining acceptance and next action

Live pairs still needed, set locally without sending key values in chat:

- OPENAI_API_KEY + DECKAGENT_CHAT_MODEL for standard Chat Completions.
- OPENAI_API_KEY + DECKAGENT_RESPONSES_MODEL for Responses.
- ANTHROPIC_API_KEY + DECKAGENT_ANTHROPIC_MODEL for Anthropic Messages.
- Optional per-family BASE_URL overrides are documented in the runtime guide.

Run test:opencode:parity:live after configuration.
The known Google/Gemini-3 Chat path is not an alternative live credential workaround; select native Gemini explicitly.
Fixtures and skipped cases cannot close G-002.

Owner manual checks still pending:

- [ ] Reopen a saved profile and confirm provider/model IDs, history and optional metadata remain correct.
- [ ] Select confirmed Responses effort; verify active work keeps its captured choice and later work uses changes.
- [ ] Trigger an unsupported option; verify clear error, retained draft and no inference.
- [ ] Test protocol/model choices actually claimed for release after live credentials are available.
- [ ] Record tester/browser/candidate and accept G-002 on the bounded compatibility matrix.

Dollar cost, exact real-model maximum context and exhaustive model/endpoint compatibility remain unqualified.
Native session resume is not required and is not implemented.
Old V1/V2 statuses and G-001 owner acceptance are unchanged; no scope-guard business-rule change was made.
G-002 stays NOT VERIFIED. TASK-003 full integration remains gated; independent preparation is allowed.
GitHub Issue remains unpublished; this task did not authorize external publication.

Final evidence update: the owner confirmed only Gemini credentials are available.
Other live families remain blocked; Settings/effort manual acceptance is pending.
Final CLI parity: 24 PASS. Post-encoding Gemini parity: 1 PASS / 4 SKIP.
Settings retest: 12 PASS / 1 SKIP. Enhanced literal-model canary: 1 PASS.
The 16 foundation, 171 legacy, 9 browser and 3 presentation-live results precede the final config-encoding change.
The final CLI parity and Gemini parity runs verify the later adapter changes.

Follow-up: targeted browser checks on the current candidate passed 2/2.
Rejected-work draft and selected model survive reload without replay; invalid-save draft behavior also passed.
See MANUAL-ACCEPTANCE.md for concrete remaining owner cases and isolated-profile restart instructions.
No new live credential families or owner acceptance were inferred.

Manual incident: Gemini returned HTTP 503 with zero steps. A later execution aborted near the 180-second whole-turn deadline, also with zero steps.
The deadline was mislabeled OPENCODE_FAILED. A real-CLI hanging-provider regression failed before the fix and passed afterward.
The adapter now records timedOut and reports PROVIDER_TIMEOUT; user cancellation retains ABORTED priority.
Build PASS; targeted API/deadline checks 2 PASS; process/cancellation checks 3 PASS; direct Biome lint PASS (148 files).
The pnpm lint wrapper returned a shell error despite clean Biome output; direct invocation exited zero.
No automatic retry or timeout increase was added. Gemini availability and the manual context smoke remain BLOCKED.

Direct-provider diagnostic: three tiny Gemini generateContent REST requests, outside OpenCode, each returned HTTP 503 / UNAVAILABLE (1729, 2557 and 1154 ms).
Used current environment/root .env credentials, no retries; no key values, provider bodies or model text recorded.
The failure reproduces without OpenCode. It does not prove every key/project restriction is absent, or compare credentials inside an already-running Host.
Gemini manual smoke remains BLOCKED; provider availability must recover before claiming live acceptance.

## Owner smoke confirmation

On 2 November 2026 the owner confirmed the Task 002 smoke test PASS and requested status updates before committing.
This supersedes the earlier Gemini manual-smoke blocker, while keeping the earlier HTTP 503 and deadline evidence.
The report refers to the seven-case Gemini smoke checklist in chat. No itemized outcomes, browser version or exact manual SHA were supplied.
Effort/model switching and live Chat Completions, Responses and Anthropic remain unverified.
Implementation and the bounded Gemini smoke are ready for owner commit; G-002 remains NOT VERIFIED for full protocol qualification.
No commit, push or Issue publication was performed.
