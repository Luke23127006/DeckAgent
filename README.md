# DeckAgent

DeckAgent's goal is to create and edit presentations through conversation with an AI.
Presentation creation and editing are not implemented yet. The current core is a
**terminal CLI** that provides the underlying Agent Harness, model providers, tool
execution, and SQLite session persistence. File tools, a Web UI, and presentation
generation/editing are planned for later tasks.

## Current capabilities

- Chat with a real model — Google Gemini, OpenAI, DeepSeek, Anthropic, or another
  compatible endpoint.
- Tool calling with a built-in `noop` echo tool for connectivity checks.
- Local session persistence in SQLite, resumed with `--session`.
- First-run interactive setup that stores non-secret configuration and
  Windows-encrypted credentials.

## Requirements

- Node.js `^22.19.0` or `>=24.0.0`
- pnpm `11.28.5` (install with `npm install --global pnpm@11.28.5` if missing)

## Quick start

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm chat
```

The first `pnpm chat` asks for provider, model, and API key, verifies the connection,
and saves the choice. Later runs reconnect with the saved defaults.

## Run the application

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
