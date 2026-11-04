# DeckAgent

DeckAgent is an open-source AI agent harness for making presentations. You describe the
presentation you need; DeckAgent interviews you about the audience, the purpose and the
sources, proposes an outline for you to confirm, and then builds the slides with the AI
model you choose.

DeckAgent is developed by a team of five students from HCMUS (the University of Science,
Ho Chi Minh City), Vietnam.

> **Status:** DeckAgent is moving to the [OpenCode](https://github.com/sst/opencode)
> runtime under a new build workflow ([WORKFLOW.md](WORKFLOW.md)). The app that runs
> today is the legacy version; its code is the input for the first workflow version.

## What makes it different

A model alone can write slide markup. DeckAgent adds the harness around the model:

- **It asks before it builds.** Who the deck is for, how long the talk is, what it must
  achieve, which sources to use, which language and which output format.
- **It keeps you in control.** No slide is built until you confirm the outline and the
  output format.
- **It reuses what is prepared.** Themes, layouts, animations and format renderers are
  built in advance and applied by code. The model is called where judgment is needed:
  understanding the request, interviewing you and writing content. See
  [the LLM boundary](docs/architecture/llm-boundary.md).

## Principles

- **Your model, your key.** You choose the model and bring your own provider key.
  DeckAgent has no model account of its own.
- **Runs on your computer.** No hosted service, no DeckAgent account.
- **Your work stays local.** Chats, decks and files stay on your machine. Content leaves
  it only in requests to the provider of the model you selected, or to another service
  you set up yourself, such as a search or image service.

## Run the legacy app

Run these commands from the repository root in Windows PowerShell:

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
pnpm.cmd start:local-web
```

The last command starts the local Host and opens the Web app in your browser. Keep
the terminal running while using the Web app; **Ctrl+C** stops the Host. After the
initial install/build, `pnpm.cmd start:local-web` alone reopens it. After pulling
source changes, run `pnpm.cmd build` and restart the Host.

Requires Node.js `^22.19.0` or `>=24.0.0` and pnpm `11.28.5`. On other shells, use
`pnpm` in place of `pnpm.cmd`. Setup, provider keys, testing and common problems:
[local development](dev/legacy/development/local-development.md).

## Documentation

- [Architecture](docs/architecture/) — the modules of DeckAgent and where the model is
  used, as built.

## Contributing

- [AGENTS.md](AGENTS.md) — the index for contributors and coding agents: rules, roles
  and where everything lives.
- [WORKFLOW.md](WORKFLOW.md) — how a version is planned and how each feature goes from
  spec to verified code.

DeckAgent is inspired by [open-design](https://github.com/nexu-io/open-design), its main
product reference.
