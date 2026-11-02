# OpenCode provider and history compatibility

Candidate: 12faae91ee4f996b19a4529b561825008f17563f plus this task's uncommitted changes.
Windows x64 OpenCode 1.19.5 and MCP SDK 1.26.0 pins are unchanged. No new dependencies were added.
G-002 is NOT VERIFIED. Wire fixtures prove protocol behavior, not successful real-model inference.

## Protocol matrix

| Protocol | Bundled SDK | Wire/model/options/MCP errors and results | Live evidence | Release claim |
|---|---|---|---|---|
| Chat Completions | @ai-sdk/openai-compatible | PASS | Standard endpoint credentials/model absent; Google Gemini 3 compatibility attempt FAIL | Wire-qualified only |
| Responses | @ai-sdk/openai | PASS, including confirmed reasoning effort | Credential/model absent | Wire-qualified only |
| Anthropic Messages | @ai-sdk/anthropic | PASS | Credential/model absent | Wire-qualified only |
| Gemini native | @ai-sdk/google | PASS | PASS with gemini-3.1-flash-lite, legacy context and MCP | Live-qualified for tested configuration |

Native selector deckagent/selected is private. API bodies use the exact captured user model ID.
Provider URLs, credential headers and configured options were observed at the real CLI's provider boundary.
The fixture loop verifies arguments, a sanitized error, a successful result and subsequent text for every family.
Native tools remain denied; provider-bound declarations contain only phase-granted MCP tools.
Fixed native session titles prevent the CLI's auxiliary title-generation inference.
Config values are encoded literally before the CLI's file/env substitution pass.
A real-CLI canary regression initially demonstrated that prompt-shaped config data could read a file or inject an environment credential;
after literal encoding neither canary enters the model request. Credentials remain in the private process environment, never checked-in files.

## Option matrix

| Option | Mapping or rejection |
|---|---|
| Custom API root | Exact validated root; each SDK appends its protocol endpoint; HTTPS or loopback HTTP only |
| Credentials | Existing environment/DPAPI capture; copied once into isolated child environment; no credential logging |
| Unauthenticated connection | Chat Compatible supports no-key endpoints; other mapped SDK paths require a key |
| Model/provider IDs | Saved IDs retained; model wire ID exact; no implicit substitute |
| Output limit | Explicit 1–32,000 maps to max_tokens, max_output_tokens or generationConfig.maxOutputTokens; greater values reject before work |
| Unset output limit | Native ceiling 32,000; Anthropic preserves legacy default 4,096. Other legacy protocols omitted the field, so defaults are not identical |
| Temperature | Explicit 0–2 mapped for tested non-reasoning calls; reasoning Responses combinations and recognized reasoning models reject rather than drop it |
| Chat tokenLimitField | max_tokens mapped; max_completion_tokens rejects before work |
| Responses effort | Existing confirmed label -> exact none/minimal/low/medium/high/xhigh API value; unsupported values reject |
| Effort on other protocols | Existing legacy schema does not offer it; no new inferred reasoning choices |
| API timeout | Explicit 1–180,000 ms; default 120,000 ms. Existing whole-execution cap remains 180,000 ms |
| Unknown context metadata | Stays unknown in Settings; native internal context=0 means unspecified, not a published model window |
| Legacy connection defaults | Output/timeout/temperature/token-field/reasoning choices survive Settings save and reload; model metadata still overrides explicit per-model fields |
| Native compaction | auto=false and prune=false; no hidden history trimming |
| Oversized transport | Quoted prompt over 4,000,000 UTF-8 bytes fails before inference or new input append; existing history unchanged |
| API context overflow | Failed turn; original history and admitted input retained; no replay/automatic model change |
| Cost | Observed CLI input/output token samples are recorded. Dollar cost is unknown, not zero; thinking/cache/billing details are not fully measured |

The SDK may apply model defaults when the user leaves options unset; exact default parity is not claimed.
Particular endpoint/model compatibility still needs live evidence. Do not infer universal model support from protocol fixtures.

## Google Chat compatibility failure

The live attempt used Google's documented Chat-compatible root and the existing Gemini credential.
First, store=false was incorrectly added outside Responses. Google returned HTTP 400 before tool execution.
The option is now restricted to Responses; a wire regression asserts it is absent from Chat requests.

After that fix, Google accepted the first request and invoked the probe once.
Its next request failed HTTP 400 because functionCall lacked thought_signature.
The pinned Chat Compatible SDK does not retain the required signature for this Gemini 3 tool round trip.
The adapter now rejects Gemini 3 with Google's /openai endpoint before any tool can run.
No signature bypass, alternate agent loop or automatic model/protocol substitution was introduced.
Use native Gemini explicitly for that model.

The failing live records remain in evidence. The positive probe is retained behind DECKAGENT_GOOGLE_CHAT_PROBE=1;
it is excluded from normal supported-case acceptance and is expected to hit the fail-closed guard now.
A permanent negative regression verifies rejection. This is not a live Chat protocol PASS.

## History and identity

DeckAgent session IDs, Host request IDs, execution UUIDs and native session IDs remain distinct.
Each send starts a fresh native session. Application selection is captured once and recorded separately from the native alias.
Ordinary input appends once; continuation appends none. Prompt context is copied at send admission.

Portable context includes messages, tool names/arguments, call/result IDs, error flags and interrupted markers.
It never replays providerState, signed foreign turns or native session IDs as API protocol state.
Unmatched calls are unconfirmed; unmatched results are orphaned data.
Crash recovery does not invent a result or dispatch recorded calls.
The crash test kills a real MCP process after call persistence and before result persistence, then reopens SQLite.
The copied schema-2 fixture upgrades through the existing storage path; original file hash, message contents and saved IDs remain intact.
No SessionStore/public Message contract or database schema was changed.

## Long-history measurements

Real pinned CLI with a loopback provider fixture, before the final regression run:

| Messages | Projected UTF-8 bytes | Provider wire bytes | Send latency |
|---|---|---|---|
| 8 | 16,940 | 17,665 | 3,593 ms |
| 64 | 133,838 | 135,011 | 3,376 ms |
| 512 | 1,069,450 | 1,074,207 | 3,425 ms |

All beginning/middle/end markers survived; no stored message was truncated.
These are transport/latency measurements, not proof that a real model accepts 1 MiB or a monetary cost estimate.
The real Gemini test used about 17 KiB of legacy notes and emitted input/output token samples in evidence.json.
Dollar cost, exact token-window boundaries and large real-model context acceptance remain unqualified.
Product compaction belongs to the later context task.

## Sources and evidence

- [Pinned provider loading and bundled SDKs](https://github.com/anomalyco/opencode/blob/v1.19.5/packages/opencode/src/provider/provider.ts).
- [Pinned request preparation](https://github.com/anomalyco/opencode/blob/v1.19.5/packages/opencode/src/session/llm/request.ts).
- [Pinned option transforms and output ceiling](https://github.com/anomalyco/opencode/blob/v1.19.5/packages/opencode/src/provider/transform.ts).
- [Google's Chat-compatible API](https://ai.google.dev/gemini-api/docs/openai).
- [Pinned config substitution rules](https://github.com/anomalyco/opencode/blob/v1.19.5/packages/opencode/src/config/variable.ts).
- [Sanitized task evidence](evidence.json), including failed live attempts and subsequent guards.

## Remaining acceptance

Provide real Chat Completions, Responses and Anthropic credential/model pairs in the local environment.
Run test:opencode:parity:live; fixtures and skipped cases cannot close their live gates.
Owner manual acceptance must cover saved Settings, effort, clear unsupported-option errors, draft retention and model changes during active work.
G-002 stays NOT VERIFIED until those records exist. Historical V1/V2 and G-001 statuses remain unchanged.
