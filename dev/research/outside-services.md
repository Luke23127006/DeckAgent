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
   - => The default sends private user text to the search provider. Legacy
     `dev/legacy/adr/0002-provider-neutral-web-research.md` already required this to be
     off for DeckAgent.

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
     read; its Settings docs and source were not.
   - The DeepSeek Harness config catalog was read word for word only in part.
   - Image licences and attribution are documented by neither product.
