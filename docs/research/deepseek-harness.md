# DeepSeek Harness

DeepSeek Harness (`https://github.com/deepseek-ai/deepseek-harness`) is an open-source agent runtime with a web interface. Items 1 to 7 were checked from 15-10-2026 to 19-10-2026 against an upstream snapshot of 19-10-2026, with no commit pinned. Most of them come from the docs and READMEs; source was read only for the sidebar, the storage domain and the workspace feed. Item 8 was checked from the docs on 04-11-2026. Item 10 comes from a run of the app on 08-11-2026 (version not noted). Nothing here was checked against OpenCode.

1. What is DeepSeek Harness?
   - Observation: an agent runtime: model + harness = agent. The model writes text; the harness lets it read and write files, run shell commands, search the web, keep a plan, call tools and decide when a task is done.
   - Observation: everything is a plugin of the Cordis framework: the agent loop, the model adapters, skills, session history, the sandbox and the web UI. A plugin provides services and registers tools, events or UI through a context object `ctx`; `cordis.yml` declares which plugins the app mounts.
   - Observation: a preset is a set of plugins that decides what one agent sees. Four presets ship: Standard, Code, Minimal and Creator.
   - Inference: a presentation agent is best built as a configuration of an existing runtime (its agent, tools and permissions), not as a new runtime with its own loop.

2. How does one request run through the agent loop?
   - Observation (`docs/agent-lifecycle.md`, `docs/architecture.md`): a turn runs steps; each step calls the model, then runs the tool calls it asked for. The loop goes on while tool results need another model call. A follow-up message enters an inbox that feeds the driver.
   - Observation: hooks exist around tools (`tools/pre-execute`, `tools/execute`, `tools/post-execute`) and before a turn ends (`agent/turn-stopping`).
   - Diagram of a turn and its steps, drawn from `docs/agent-lifecycle.md`: [agent-turn-step-lifecycle.png](evidence/deepseek-harness/agent-turn-step-lifecycle.png).
   - Observation: "model-visible means logged": the model history is rebuilt from the session log. Session events are kept; live agent events only feed the UI.
   - Inference: a change to an agent's flow sits at one of three levels. A different order of work (generate, render, check, revise) needs no loop change. A control rule (for example "check the slides before the turn ends") fits in hooks. A change of how steps are scheduled needs a new loop.
   - Proposal: ask the same three questions of any runtime DeckAgent runs on: which hooks it offers around tools and turn end, what it logs for the model, and how a follow-up message enters a running session.

3. Who owns the published deck?
   - Observation: files the agent writes in its workspace are candidates, not the deck the user sees. The host must own the published deck state, apart from any one agent turn.
   - Observation: the proposed publish order: save the slide file, check it, update the deck record in one atomic write, notify the UI. A crash after the save leaves an unused file but the deck unchanged. A revision number and an operation ID refuse a stale or repeated publish.
   - Observation: a tool may report a failure after the host already committed the change, so the deck state comes from the host, never from the tool result.
   - Observation: the UI kept tab layout in browser storage, but the deck content had to come from the host after a restart.

4. How was a deck shown?
   - Observation: the generic file preview rendered HTML, PDF, images and PPTX (as PDF). Static HTML was cleaned with DOMPurify and sandboxed with a CSP; interactive HTML ran in `sandbox="allow-scripts"` without `allow-same-origin`.
   - Observation: a file viewer knows nothing of slide order, revisions or the confirmed outline, so a deck view of its own was chosen, in the right sidebar.
   - => These sandbox settings are a concrete starting point for showing slide content with no access to app data, keys or the network.

5. Which ways to represent and change slides were compared?
   - Representation: PPTX first (DeepSeek `office-pptx` skill), HTML/CSS first (Presenton Smart HTML, Slidev), or a structured slide model with a renderer (Presenton Template V2). Free-form versus template-bound is a separate axis from the format.
   - Change: rewrite the whole slide, patch its source, or apply structured operations by element ID. Shared CSS or assets let a change reach slides outside its scope; keep theme and asset files versioned if that happens.

6. Does an outline match DeepSeek's plan mode?
   - Observation: `ui-plan` shows a plan for review and approval in the sidebar, with its own state rules.
   - => Where an outline is a reply that ends the request and its confirmation is a new request, reuse the UI ideas of plan mode, not its state rules.

7. Which technical risks were found?
   - The agent writing straight into the published files: a failure loses the last good slide.
   - Session events not yet saved when the UI reads them.
   - Retried or concurrent publishes: duplicate slides or a stale overwrite.
   - Unsafe HTML reaching the app origin or the network.
   - Fonts and images that resolve differently after a reload.
   - A slide that looks right but reads wrong to a screen reader.
   - A slide format that changes later with no version in its metadata.
   - Deleting plugins before seeing what depends on them: disable first, test, then delete.

8. Which outside services does it use, and who sets them up? (`docs/subsystems/web.md`, `packages/web/web-deepseek-api/README.md`, `packages/web/web-fetch-http/README.md`)
   - Observation: web search (`deepseek-search-api`, default; `deepseek-official`, legacy) and web fetch (`deepseek-fetch-api`; `http`, an anonymous local fetch). No image generation.
   - Observation: the user sets them up in config: `searchProvider`, `fetchProvider`, `searchApiKeyEnv` (default key `DEEPSEEK_API_KEY`), or in "Plugins > Built-in plugin settings". There is no approval step.
   - Observation: `web_search` is hidden from the model when no key is set. `web_fetch` runs in every shipped preset without asking.
   - Observation: the HTTP fetch does not restrict destination addresses, so it reaches loopback and private hosts.
   - Observation: search sends the query and, by default, `ori_question`: the latest user prompt, cut to 128 characters. `sendOriginalQuestion: false` turns this off.
   - Observation: a missing or failed service gives a typed error such as `WEB_PROVIDER_CREDENTIAL_MISSING` or `WEB_PROVIDER_CONFIGURED_UNAVAILABLE`. "No automatic retry or provider fallback occurs."
   - => The default sends private user text to the search provider. A product that promises to send no private content to public research must turn it off.
   - Not checked: the config catalog was read word for word only in part.

9. Which model settings does it use?
   - Observation (date not recorded): its DeepSeek models have a 1,048,576-token context, reasoning efforts off, low, high and max with `high` as the default, at most 256,000 output tokens, and a fallback context of 1,000,000. Choosing a model applies its default effort. The GUI offers only catalog models. A key is only format-checked before it is saved.

10. What happens to the chats of a removed workspace? (app run, 08-11-2026)
    - Observation: after a workspace is removed, its sessions stay, listed in a separate group "Ungrouped", apart from every workspace, the default one included: [removed-workspace-ungrouped.png](evidence/deepseek-harness/removed-workspace-ungrouped.png).
    - Observation: adding a workspace again for the same folder gives an empty workspace; the old sessions stay in "Ungrouped".
