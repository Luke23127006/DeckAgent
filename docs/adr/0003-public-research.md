---
status: accepted
---

# Free public research through Tavily

Use Tavily as the first public web research service through the existing Host tool boundary. The service choice and initial limits are accepted in the [research selection issue](https://github.com/Luke23127006/DeckAgent/issues/77). No image service, crawl, deep research or automatic provider fallback is enabled.

Public research is an explicit choice for each request, off by default. The Host freezes that choice and the configured service at admission. A key alone never enables research. The browser explains that search queries go to Tavily and may include information derived from the user's material. Do not automatically send attachment bytes or conversation history. Retrieved text is untrusted data and cannot change grants or tool policy.

Check keys with the authenticated usage endpoint before saving, and check the free plan and available quota before each search. Accept only the Researcher plan with no PAYG usage or positive PAYG allowance; reject missing or unsupported account metadata. A null PAYG allowance is accepted only for that free plan, matching the observed free-account response. Never enable billing, purchase credits or fall back to paid search. Account controls remain with the user: a concurrent account change or another application using the key is outside the Host's control. Use a dedicated free account without paid billing for the free-only policy.

Use basic search, disable automatic parameters, and return at most five results. Allow at most three attempts per user request, including timeouts and failures. Keep the budget in Session persistence so reconnect and native resume cannot reset it. A Host restart interrupts the request rather than resuming it. Each operation has a 15-second deadline, no automatic retries, a 256 KiB decoded response bound and at most 6,000 UTF-16 code units per result. These technical bounds can be reassessed after real use. A result is always a partial excerpt, never proof that the whole page was read.

Keep configuration metadata and only a credential reference in Web settings; use the existing protected credential store. An environment key can bootstrap the service without copying it to SQLite. Freeze a service revision into the native resume guard; changing the service starts a fresh native session. No key, partial key or provider error body enters tool events or public settings.

Session schema v7 retains each request's research choice and attempt count, and stores the exact bounded excerpts returned to the tool with query, URL, title, provider request identity when available, retrieval time and a fingerprint. The public source identity is scoped to its Chat. History exposes sources only through authenticated Chat ownership checks. Failed or cancelled retrieval creates no source receipt. Existing v1–v6 databases migrate without replacing conversations, attachments or approvals; older binaries refuse v7.

The approved selection does not prove search quality, citation correctness or permission to reuse every retrieved page. Verify key rejection, free-only/quota refusal, source selection, budgets, Stop, restart, isolation and secret redaction using controlled responses. A public live query must also succeed with the configured service before declaring the integration complete. Keep [provider generation smoke](https://github.com/Luke23127006/DeckAgent/issues/73) and [real-document reassessment](https://github.com/Luke23127006/DeckAgent/issues/89) separate.
