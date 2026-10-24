# DeckAgent

DeckAgent is a **Local Web app** for creating presentations through conversation
with an AI. The current demo supports outline review and confirmation, followed by
progressive HTML slide generation in a Deck Canvas. A terminal CLI is also available.
Advanced editing/recovery and full V1 acceptance are still in progress.

## Current capabilities

- Chat with a real model — Google Gemini, OpenAI, DeepSeek, Anthropic, or another
  compatible endpoint.
- Web settings for providers/models, chat history and request activities.
- Presentation outline review, scoped revision/cancellation and confirmation before
  slides are generated; completed slides appear progressively in the Canvas.
- Workspace file tools, persistent slide revisions and sandboxed slide rendering.
- Local SQLite persistence for conversations, outlines and published slides.
- Optional terminal CLI with interactive setup, session resume and a `noop` tool for
  connectivity checks.

## Requirements

- Node.js `^22.19.0` or `>=24.0.0`
- pnpm `11.28.5` (install with `npm install --global pnpm@11.28.5` if missing)

## Quick start

Run these commands from the repository root in Windows PowerShell:

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
pnpm.cmd start:local-web
```

The last command starts the local Host and opens the Web app in your browser. Keep
the terminal running while using the Web app; **Ctrl+C** stops the Host. After the
initial install/build, use `pnpm.cmd start:local-web` to open it again. Run
`pnpm.cmd build` and restart the Host after pulling source changes.

Use Node.js **22.19.0 or a newer 22.x**, or **24+**. On other shells, use `pnpm` in
place of `pnpm.cmd`.

## Use the Web app

1. Open **Models & settings**, configure your provider/API key and available model,
   then select a model for the chat. The Web app can open before a model is configured.
2. Enter your presentation request, including the topic, language and number of
   slides. Choose **Create presentation** to start the outline workflow.
3. Read the proposed outline. Expand/collapse planned-slide details, ask for changes
   through **Revise outline**, or choose **Cancel outline**.
4. Choose **Confirm outline** on the current proposal. The confirmed outline becomes
   read-only, the Canvas opens and slides move from Pending to published as they finish.
5. Use **History** to reopen a chat. Reloading or restarting with the same data
   directory preserves conversations, confirmed outlines and published slides.

**Send request** is available for ordinary chat and follow-up instructions. If a
confirmed deck still has Pending slides after an error, send a request to continue
the unfinished slides; do not confirm the same outline again.

With no arguments, `pnpm.cmd start:local-web` uses these paths relative to the
repository root:

```text
.deckagent/
├── sessions.sqlite   # conversations
├── web.sqlite        # Web settings, requests and activities
├── decks.sqlite      # outlines, Deck metadata and published slide content/revisions
└── workspace/        # files read/created by the Agent; shared by chats
```

Missing directories are created automatically; existing data is reused. To use
separate demo data and workspace, run:

```powershell
pnpm.cmd start:local-web --data-dir .deckagent/demo --workspace .deckagent/demo/workspace
```

Restart with the same arguments to reopen that demo's data. API keys, databases and
workspace files stay outside Git. The [TASK-006 demo checklist](docs/v1-plan/task-006-outline-workflow.md#verification-and-manual-acceptance)
describes the full outline-to-slides check and remaining acceptance work.

## Optional terminal CLI

Run `pnpm chat` to use the terminal interface. Its first run asks for provider,
model and API key, verifies the connection and saves the choice. Later runs
reconnect with the saved defaults.

```powershell
pnpm chat                        # interactive chat (first run sets up)
pnpm chat --setup                # reconfigure provider/model/key
pnpm chat --session <id>         # resume a saved conversation
pnpm chat --list-sessions        # list saved sessions (no API key needed)
pnpm chat --prompt "<one turn>"  # non-interactive single turn
```

In chat, `/history` prints the conversation and `/exit` quits. Configuration and data
live under `.deckagent/` (gitignored): `profile.json`, `credentials/`, and
`sessions.sqlite`.

## Documentation

- [Local development](docs/development/local-development.md) — setup, configuration,
  CLI usage, session persistence, testing, and common problems.
- [Coding conventions](docs/development/coding-conventions.md) — TypeScript conventions.
- [Repository structure](docs/development/repository-structure.md) — where code lives.
- [Code review criteria](docs/development/code-review-criteria.md) — how changes are judged.
- [Contributing](CONTRIBUTING.md) — proposing, scoping, reviewing, and verifying changes.
- [OpenCodeReview tooling](docs/tooling/open-code-review.md) — repository-local review tooling.
