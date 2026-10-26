# DeckAgent

DeckAgent is an open-source agent harness that uses large language models
(LLMs) to build and revise presentations, developed by a team of five
students from HCMUS (the University of Science, Ho Chi Minh City), Vietnam.

## Quick start

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
`pnpm` in place of `pnpm.cmd`.

## Documentation

- [Product vision](docs/spec/01-product-vision/VISION.md) — the intended product
  behavior and scope.
- [Local development](docs/development/local-development.md) — setup, provider/key
  configuration, the Web app walkthrough, CLI usage, testing, and common problems.

## Contributing

[AGENTS.md](AGENTS.md) is the index: it points to the coding standards, the
repository layout, the review criteria, the tooling guides and the
implementation plans.
