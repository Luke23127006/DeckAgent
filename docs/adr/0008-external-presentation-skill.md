---
status: accepted
---

# External presentation Skill through OpenCode CLI

The owner selected standalone OpenCode CLI as the first external agent host.
This decision covers the bounded opt-in integration. It does not finalize distribution or replace the Web runtime.

Keep a small stdio MCP entrypoint in the existing local-web application package.
It starts without the HTTP Host, Web UI, model adapter or custom agent loop.
Use public DeckService and ToolRegistry operations for outline storage, publication and revision-aware patches.
No new package responsibility or database schema is introduced.

The operator supplies an absolute profile, Chat ID, exact starting deck version and explicit slide IDs.
Transport access is the operator-started child process, not an authorization token invented by the model.
Tools cannot select another profile/Chat or confirm an outline. The operator inspects the saved proposal,
then confirms its exact outline ID/version through a separate command. Model instructions do not grant authority.

Skill instructions live in product-skills, separate from repository coding skills.
The standalone launcher copies only this Skill into an isolated OpenCode configuration directory.
Native tools are denied except the named read-only Skill loader. Only the bound presentation MCP is configured.
Plugins, extra agents and inherited project configuration remain disabled. No native shell/file/network fallback is permitted.

Existing Web behavior and data remain unchanged. External profiles are explicit and should be separate from an active Web profile.
Do not concurrently write a Web Chat through this independent operator workflow: it has no Web admission coordinator.
The first external contract covers outline creation, operator confirmation, static HTML publication and scoped text/layout edits.
Attachments, external image import, PDF export and Web context/history are not exposed by this MCP entrypoint.
Their existing application implementations remain available separately. No unsupported capability is implied by the Skill.

The source checkout and its installed workspace dependencies provide the tools; no public npm package is published.
The launcher requires an operator-supplied OpenCode 1.19.5 executable. No private developer binary path is embedded.
Current live qualification uses native Gemini. Other hosts/providers and permanent binary distribution remain proposals.
