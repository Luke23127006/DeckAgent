# Outside services in reference products

Question: who chooses and sets up the outside services an agent uses besides the main
model (web search, web fetch, image generation), and what content reaches them?
Checked on 04-11-2026 from the published docs of open-design and DeepSeek Harness. No
product was run; source code was not read.

1. Why check this? The UC-001 spec said "an outside service the owner approved". The
   legacy spec meant the Product Owner (legacy FR-088). That reads as a team-curated
   list of services, which conflicts with "your model, your key" in `README.md`.

2. Which outside services does open-design use?
   - Observation: image generation (`gpt-image-2`, ImageRouter, a custom API), BYOK model
     providers (OpenAI, Anthropic, Azure OpenAI, Gemini, Ollama, LM Studio, vLLM, any
     OpenAI-compatible endpoint, Atlas Cloud), video and audio models, and connectors
     (Composio, GitHub OAuth). Sources: `README.md`, `QUICKSTART.md`,
     `deploy/.env.example` in `https://github.com/nexu-io/open-design`.
   - Observation: web search and web fetch are not documented in the pages read.
   - Inference: web search may come from the coding-agent CLI that open-design starts
     (Claude Code, Codex). Not checked.

3. Who sets them up in open-design?
   - Observation: the user. BYOK means the user enters `baseUrl`, `apiKey` and `model`
     in Settings ("Models & providers"). The user also picks the image provider.
   - Observation: no list of approved services. `OD_ALLOWED_INTERNAL_HOSTS` is only an
     allow-list of internal hosts that a provider URL may resolve to; it blocks requests
     to private addresses (an SSRF guard).
   - Observation: no on or off switch for search or image generation is documented.
   - Observation: "Cloud model and OpenDesign Cloud requests are sent to the
     corresponding services" (`README.md`). No privacy statement for image providers.

4. Which outside services does DeepSeek Harness use?
   - Observation: web search (`deepseek-search-api`, default; `deepseek-official`,
     legacy) and web fetch (`deepseek-fetch-api`; `http`, an anonymous local fetch). No
     image generation. Sources: `docs/subsystems/web.md`,
     `packages/web/web-deepseek-api/README.md`, `packages/web/web-fetch-http/README.md`
     in `https://github.com/deepseek-ai/deepseek-harness`.

5. Who sets them up in DeepSeek Harness?
   - Observation: the user, in config: `searchProvider`, `fetchProvider`, `searchApiKeyEnv`
     (default key `DEEPSEEK_API_KEY`), or in "Plugins > Built-in plugin settings".
   - Observation: no approval step. `web_search` is hidden from the model when no key is
     set. `web_fetch` runs in every shipped preset without asking.
   - Observation: the HTTP fetch does not restrict destination addresses, so it reaches
     loopback and private hosts.

6. What content does DeepSeek Harness send to search?
   - Observation: the query, and by default `ori_question`: the latest user prompt, cut
     to 128 characters. `sendOriginalQuestion: false` turns this off.
   - => The default sends private user text to the search provider. A legacy architecture
     record (ADR 0002, deleted; at commit `85130c4`) already required this to be off for
     DeckAgent.

7. What happens when a service is missing or fails?
   - Observation (DeepSeek Harness): a typed error such as
     `WEB_PROVIDER_CREDENTIAL_MISSING` or `WEB_PROVIDER_CONFIGURED_UNAVAILABLE`. "No
     automatic retry or provider fallback occurs."
   - Observation (open-design): a message with the fix ("configure a BYOK runtime in
     Settings"); a private provider URL fails with `Internal IPs blocked`. No fallback
     documented.

8. What does this mean for DeckAgent?
   - Inference: neither product has a team-approved list of services. The team decides
     which kinds of integration exist; the user chooses the service and brings the key.
   - Proposal: the user sets up each outside service; nothing is approved on the user's
     behalf. Recorded as DEC-003.
   - Proposal: keep the stricter privacy rule (FR-090): public research sends no private
     content, unlike the DeepSeek Harness default.
   - Proposal: report a missing or failed service and do not switch to another one by
     itself, as both products do (FR-089, FR-117).

9. Limits of this check.
   - Only the README, quick start, architecture and `.env.example` of open-design were
     read; its Settings docs and source were not. Item 10 adds a second read on
     05-11-2026.
   - The DeepSeek Harness config catalog was read word for word only in part.
   - Image licences and attribution are documented by neither product.

10. How does open-design set up a model provider and its key? Checked on 05-11-2026 for
    the UC-005 review, from `README.md`, `QUICKSTART.md`, `docs/headless-byok.md`,
    `docs/modes.md`, `docs/agent-adapters.md` and `docs/install-guide.md` on `main` (no
    commit hash visible). No product was run; source code was not read.
    - Observation: the docs folder has no page for the Settings or "Models & providers"
      form. The in-app setup flow is not documented.
    - Observation: two ways to run a model. Local CLI: "The daemon scans your PATH" for
      coding-agent CLIs (Claude Code, Codex, OpenCode, ...), and each CLI uses its own login
      ("The daemon does not run login flows"). BYOK: the user gives a provider
      (`QUICKSTART.md`: "BYOK runtimes configured in Settings").
    - Observation: BYOK fields in the REST API are `protocol`, `apiKey`, `baseUrl`,
      `model`, and `apiVersion` for Azure. Protocols: anthropic, openai, azure, google,
      ollama, senseaudio, aihubmix. "Use openai for a custom OpenAI-compatible gateway."
      No name field. Presets in `README.md`: OpenAI, Atlas Cloud, Anthropic, Azure OpenAI,
      Google Gemini, Ollama, LM Studio, vLLM, any OpenAI-compatible endpoint.
    - Observation: no key check at save is documented. In the REST API a wrong key shows
      only when a run fails: "A successful 202 response does not validate those upstream
      facts", then "upstream 401/403/404".
    - Observation: the BYOK model is "an explicit provider model ID"; a model list from a
      BYOK provider is not documented. CLI runtimes list models live, for example
      `opencode models`. The Settings picker takes a custom model ID.
    - Observation: model and reasoning choices are stored per agent; some runtimes offer
      thinking levels "off, minimal, low, medium, high, xhigh". "Switching agents affects
      only later runs."
    - Observation: images ("gpt-image-2, ImageRouter, custom API"), video and audio are
      listed; how their keys are set up is not documented. Web search is not documented.
    - Observation: where a BYOK key is kept, and whether it is shown again, is not
      documented. `OD_API_TOKEN` (access to open-design) and `BYOK_API_KEY` (access to the
      provider) are separate.
    - Observation: `docs/agent-adapters.md` says the BYOK path runs the OpenCode CLI
      (`byok-opencode`); `README.md` still describes a direct BYOK proxy.
    - Inference: open-design itself uses OpenCode for BYOK, so OpenCode likely owns the
      provider call and its model list there. Not checked.
    - => DeckAgent UC-005 matches open-design on: the user's own key, a custom compatible
      endpoint, the user choosing the image service, a model ID typed by hand, and a model
      change that applies only to later runs.
    - => DeckAgent differs, by owner ruling or by choice: it always checks the key before
      saving (05-11-2026), offers fewer built-in providers (a local model service goes
      through a custom model API), gets a model catalog from the provider, and sets up web
      search as an outside service.
    - Proposal: the runtime research of the first build that touches models checks how
      OpenCode keeps keys and lists models, since open-design already relies on it.

11. What did the legacy architecture record say about web research? Read on 05-11-2026
    from legacy ADR 0002 "Separate web research tools from Search and Fetch providers"
    (status proposed, PO approved the direction; deleted, readable at commit `85130c4`).
    - Observation: search and fetch were two tools the model calls, `web_search` and
      `web_fetch`, each behind its own provider adapter, following the DeepSeek Harness
      web pattern. An adapter returns sources in one shape and errors with a kind.
      Changing the provider does not change the tool names.
    - Observation: a missing or invalid provider does not fall back to another provider;
      search sends no private content from requests, conversations, attachments, project
      files or decks.
    - => The last two points match FR-089, FR-117 and FR-090 as written. The split into
      two tools behind adapters is an implementation choice, not product behavior.
    - Proposal: the implementation plan of the first build that does public research
      starts from this split, after checking what OpenCode already offers for web search
      and fetch.
