# DeepSeek Harness

Question: what did the team learn from DeepSeek Harness (`https://github.com/deepseek-ai/deepseek-harness`)
that still applies now that DeckAgent runs on OpenCode? Compacted on 05-11-2026 from five
legacy notes written 15-10-2026 to 19-10-2026 (the PO's own analysis, an agent-lifecycle
study, a research plan, a fork-and-adapt handoff and a comparison with legacy UC-001; all
readable at commit `85130c4` under `dev/legacy/research/tech/deepseek-harness/`). That
research aimed to fork DeepSeek Harness; the fork plan, the demo stages and the
comparison with legacy UC-001 flows are dropped because the runtime is now OpenCode. The
upstream snapshot is of 19-10-2026; no commit was pinned.

1. What is DeepSeek Harness? An agent runtime: model + harness = agent. The model writes
   text; the harness lets it read and write files, run shell commands, search the web,
   keep a plan, call tools and decide when a task is done.
   - Observation: everything is a plugin of the Cordis framework: the agent loop, the
     model adapters, skills, session history, the sandbox and the web UI. A plugin
     provides services and registers tools, events or UI through a context object `ctx`;
     `cordis.yml` declares which plugins the app mounts.
   - Observation: a preset is a set of plugins that decides what one agent sees. Four
     presets ship: Standard, Code, Minimal and Creator.
   - Inference (the PO's own, 15-10-2026): DeckAgent is best thought of as a preset of a
     runtime for presentations, not as a new runtime. The same idea carries over to
     OpenCode: configure its agent, tools and permissions rather than rewrite its loop.

2. How does one request run through the agent loop?
   - Observation (`docs/agent-lifecycle.md`, `docs/architecture.md`): a turn runs steps;
     each step calls the model, then runs the tool calls it asked for. The loop goes on
     while tool results need another model call. A follow-up message enters an inbox that
     feeds the driver.
   - Observation: hooks exist around tools (`tools/pre-execute`, `tools/execute`,
     `tools/post-execute`) and before a turn ends (`agent/turn-stopping`).
   - Diagram of a turn and its steps, drawn by the team from `docs/agent-lifecycle.md`:
     [agent-turn-step-lifecycle.png](evidence/deepseek-harness/agent-turn-step-lifecycle.png).
   - Observation: "model-visible means logged": the model history is rebuilt from the
     session log. Session events are kept; live agent events only feed the UI.
   - Inference: a change to DeckAgent's flow sits at one of three levels. A different
     order of work (generate → render → check → revise) needs no loop change. A control
     rule (for example "check the slides before the turn ends") fits in hooks. A change of
     how steps are scheduled needs a new loop.
   - Proposal: the Phase 1 runtime research asks the same three questions of OpenCode:
     which hooks it offers around tools and turn end, what it logs for the model, and how
     a follow-up message enters a running session.

3. Who owns the published deck?
   - Observation: files the agent writes in its workspace are candidates, not the deck
     the user sees. The handoff concluded that the host must own the published deck
     state, apart from any one agent turn.
   - Observation: the proposed publish order was: save the slide file → check it → update
     the deck record in one atomic write → notify the UI. A crash after the save leaves an
     unused file but the deck unchanged. A revision number and an operation ID refuse a
     stale or repeated publish.
   - Observation: a tool may report a failure after the host already committed the
     change, so the deck state comes from the host, never from the tool result.
   - Observation: the UI kept tab layout in browser storage, but the deck content had to
     come from the host after a restart.
   - => This matches DEC-005 (code checks each write of the deck source) and the open
     DEC-006 (where chat work is kept). The publish order is a candidate for the
     implementation plan of the first build that writes slides.

4. How was a deck shown?
   - Observation: the generic file preview rendered HTML, PDF, images and PPTX (as PDF).
     Static HTML was cleaned with DOMPurify and sandboxed with a CSP; interactive HTML ran
     in `sandbox="allow-scripts"` without `allow-same-origin`.
   - Observation: a file viewer knows nothing of slide order, revisions or the confirmed
     outline, so the handoff chose a deck view of its own in the right sidebar.
   - => The sandbox settings are a concrete starting point for NFR-004 (shown content
     runs with no access to DeckAgent data, keys or network).

5. Which ways to represent and change slides were compared? Kept as background; DEC-005
   and DEC-007 later chose a template the model writes within.
   - Representation: PPTX first (DeepSeek `office-pptx` skill), HTML/CSS first (Presenton
     Smart HTML, Slidev), or a structured slide model with a renderer (OpenDesign,
     Presenton Template V2). Free-form versus template-bound is a separate axis from the
     format.
   - Change: rewrite the whole slide, patch its source, or apply structured operations by
     element ID. Shared CSS or assets let a change reach slides outside its scope; keep
     theme and asset files versioned if that happens.

6. Does the outline match DeepSeek's plan mode?
   - Observation: `ui-plan` shows a plan for review and approval in the sidebar, with its
     own state rules.
   - => DeckAgent's outline is a reply that ends the request, and the confirmation is a
     new request (FR-003). Reuse UI ideas, not the plan-mode state rules.

7. Which technical risks did the handoff list?
   - The agent writing straight into the published files: a failure loses the last good
     slide.
   - Session events not yet saved when the UI reads them.
   - Retried or concurrent publishes: duplicate slides or a stale overwrite.
   - Unsafe HTML reaching the app origin or the network.
   - Fonts and images that resolve differently after a reload.
   - A slide that looks right but reads wrong to a screen reader (legacy NFR-013).
   - A slide format that changes later with no version in its metadata.
   - Deleting plugins before seeing what depends on them: disable first, test, then
     delete.

8. Limits of this research.
   - Most items come from DeepSeek docs and READMEs; source code was read only for the
     sidebar, the storage domain and the workspace feed.
   - Nothing here was checked against OpenCode. Each inference is a question for the
     Phase 1 runtime research, not an answer.
   - The model settings of DeepSeek Harness, chosen by the PO as the reference for model
     settings, are recorded in [open-questions.md](open-questions.md) item 1.
