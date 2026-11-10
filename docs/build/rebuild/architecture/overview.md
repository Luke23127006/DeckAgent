# DeckAgent Rebuild — Architecture Overview

**Status:** Selected target architecture (planning). **Not implementation-verified.**  
**Source of decisions:** [`../adr/`](../adr/)  
**Implementation sequence:** [`../implementation-plan.md`](../implementation-plan.md)

## System boundary

```text
Local Web UI (reuse/adapt clean-main)
       |
       | local HTTP + event updates
       v
DeckAgent Local Host --------------------> SQLite (product state)
       |                                     + managed files (artifacts)
       |-- Workspace / Chat / Request
       |-- Provider + Credential Store
       |-- Outline / Deck / Slide revisions
       |-- Permission + Tool Gateway (MCP)
       |
       +-- OpenCode CLI: opencode run --format json
                   | native session resume: -s <sessionID>
                   | structured events, tool calls
                   v
              Model Provider

User project folder: external, **read-only** sources (not app data)
```

- **OpenCode** owns Agent Loop + runtime-native sessions. **DeckAgent Host** owns Chat history, request lifecycle, approval decisions, Deck state and all product mutations.
- **Application storage** lives outside user project folders. SQLite holds structured state; managed files hold generated sources/assets. Secrets live in a dedicated credential store.
- **OpenCode native tools** must not bypass DeckAgent's Host permission checks. Request-scoped MCP exposes only authorized operations.
- **UI is not execution authority:** reload/disconnect does not stop request; Host restart records unfinished work and never silently retries.
- **Deck** uses confirmed Outline + format/theme snapshot; only published slide revisions are previewed. Editing is scoped; read-only questions cannot mutate the Deck.
- **Templates** provide layout definitions; **Design Systems** provide theme roles, brand assets and rules. Only implemented generation formats become selectable; default HTML.

## Where details live

| Concern | Architecture contract | ADR |
|---|---|---|
| App state, Workspace folders, SQLite/artifacts | [`data.md`](data.md) | [`0001`](../adr/0001-local-storage.md) |
| Chat, OpenCode native session, history/restart | [`session.md`](session.md) | [`0002`](../adr/0002-chat-session-history.md) |
| MCP tools, Host authorization, approvals | [`tools-permissions.md`](tools-permissions.md) | [`0003`](../adr/0003-tools-permissions.md) |
| Request status, event mapping/reconnect/Stop | [`events.md`](events.md) | [`0004`](../adr/0004-request-events-lifecycle.md) |
| Outline/Deck/Slide revisions, source files | [`deck-artifacts.md`](deck-artifacts.md) | [`0005`](../adr/0005-deck-artifacts-revisions.md) |
| BYOK, model selection, credential security | [`credentials-models.md`](credentials-models.md) | [`0006`](../adr/0006-credentials-models.md) |
| Built-in/custom Design System and Templates | [`design-system-templates.md`](design-system-templates.md) | [`0007`](../adr/0007-design-system-templates.md) |

**Open implementation details:** exact SQL tables, SQLite driver, OS credential-at-rest mechanism, app routes, format-specific artifact serialization. These are assigned to corresponding builds, **not reasons to reopen architecture research**. Product rule values still missing: BR-001/002/003/006/017/018.
