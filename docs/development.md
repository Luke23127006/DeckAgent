# Development Guide

## Current Repository State

DeckAgent application implementation does not exist yet. Existing executable code belongs to
Project Hub tooling. Product development commands are TODO.

## Repository Layout

| Path | Responsibility |
| --- | --- |
| `.claude/` | Claude-specific workflow adapters, roles, and conditional guidance. |
| `docs/` | Development and architecture documentation, tooling guides, and canonical agent workflows. |
| `scripts/` | Repository-level wrappers for Project Hub. |
| `tools/project_hub/` | Self-contained Python tooling package, dependencies, tests, and configuration. |
| `AGENTS.md` | Authoritative portable repository guidance for coding agents. |
| `CLAUDE.md` | Thin Claude-specific adapter to `AGENTS.md` and canonical workflows. |

## Project Hub

See the [Project Hub guide](tooling/project-hub.md) for prerequisites, dependency setup,
authentication, configuration, and daily operation. Its [package overview](../tools/project_hub/README.md)
describes the tool's contents. Project Hub is internal tooling, not a DeckAgent runtime dependency.

## Development Commands

These commands apply only to Project Hub. Setup is documented in the existing tooling guide;
runner configuration is in [pyproject.toml](../tools/project_hub/pyproject.toml).
For tests, use Python from the tool environment with the package and development dependencies installed.

| Purpose | Command | Working Directory | Status |
| --- | --- | --- | --- |
| Project Hub dependency setup | `uv sync --project tools/project_hub --extra dev` | Repository root | Documented; execution not verified in the audit environment. |
| Project Hub CLI (macOS/Linux) | `./scripts/project-hub <command>` | Repository root | Wrapper inspected; execution not verified. |
| Project Hub CLI (PowerShell) | `./scripts/project-hub.ps1 <command>` | Repository root | Local `status` and `validate` executed; snapshot was missing and authentication unavailable. |
| Project Hub tests | `python -m pytest` | `tools/project_hub/` | All 19 tests passed using source imports and temporary files outside the repository. Execution in the locked tool environment remains unverified. |
| Lint | TODO | `tools/project_hub/` | Ruff dependency and lint rules exist; canonical command not verified. |
| Format | TODO | `tools/project_hub/` | Ruff dependency exists; canonical command not verified. |
| Build | TODO | `tools/project_hub/` | Hatchling backend configured; canonical command and build not verified. |

Replace `<command>` with a supported subcommand: `auth`, `sync`, `status`, `validate`, or `logout`.
See the [operational guide](tooling/project-hub.md#daily-use) for behavior and options;
snapshot validation is separate from software tests.

## Product Development

DeckAgent product setup, run, test, and build commands are all TODO. No application framework or
product directory structure has been selected here.

## Environment / Configuration

Project Hub reads the following process environment variables:

| Variable | Behavior |
| --- | --- |
| `PROJECT_HUB_SPREADSHEET_ID` | Overrides the spreadsheet ID in the committed configuration. |
| `PROJECT_HUB_GOOGLE_CLIENT_FILE` | Overrides the default OAuth client file; `auth --client-secrets` takes precedence. |
| `PROJECT_HUB_AUTH_DIR` | Overrides the directory for the token and default OAuth client file. |
| `LOCALAPPDATA`, `APPDATA` | Select the default Windows auth location when no auth-directory override is set. |
| `XDG_CONFIG_HOME` | Selects the default Linux auth location when no auth-directory override is set. |
| `PYTHONPATH` | Wrappers prepend the tool's source directory when using the direct-Python fallback. |

The tool does not automatically load `.env` files. The committed
[Project Hub configuration](../tools/project_hub/config/project-hub.json) owns schema mappings and
the snapshot destination. See the [Project Hub guide](tooling/project-hub.md) for credential storage
and configuration details. Product environment settings remain TODO.

## Related Documentation

- [Architecture status](architecture.md)
- [Project Hub operation](tooling/project-hub.md)
- [Repository agent guidance](../AGENTS.md)
