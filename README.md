# DeckAgent

DeckAgent is an open-source agent harness that uses large language models (LLMs) to build and revise presentations, developed by a team of five students from HCMUS (the University of Science, Ho Chi Minh City), Vietnam.

## Quick start

Run these commands from the repository root in Windows PowerShell:

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm start:local-web
```

The last command starts the local Host and opens the Web app in your browser. Keep the terminal running while using the Web app; **Ctrl+C** stops the Host. After the initial install/build, `pnpm start:local-web` alone reopens it. After pulling source changes, run `pnpm build` and restart the Host.

Requires Node.js `^22.19.0` or `>=24.0.0` and pnpm `11.28.5`. Windows x64 installation includes OpenCode 1.19.5 as an application dependency; no global OpenCode installation or PATH change is needed. Keep optional dependencies enabled. Other platforms require a separately supplied compatible CLI and are not verified by this installation path.

### Windows shortcut with the local CLI

To select Node 22.19.0 through npm exec, use:

```powershell
pnpm start:local
```

This loads the root `.env`, finds the OpenCode dependency automatically and opens the same saved chats, providers and models in the default Application Storage. It needs built app output; run `pnpm build` with a supported Node version after source changes. The first Node download needs network access. See [local development](docs/development/local-development.md#local-web-workspaces-and-chats) for resource packaging, recovery and developer overrides.

## Documentation

- [Product spec](docs/spec/) — the use cases, requirements and business rules of the product, and the behaviors left for later.
- [Local development](docs/development/local-development.md) — setup, provider/key configuration, the Web app walkthrough, CLI usage, testing, and common problems.

## Contributing

[AGENTS.md](AGENTS.md) is the index: it points to the coding standards, the repository layout, the review criteria, the tooling guides and the implementation plans.
