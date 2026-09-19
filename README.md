# DeckAgent

AI-powered presentation editor that turns user intent into structured slide plans, editable
content, and exportable presentations.

## Current Status

DeckAgent is at an early stage. Application implementation does not exist yet, and requirements
and application architecture are not finalized. Existing executable code belongs to Project Hub,
the repository's internal developer and coding-agent tooling.

## Repository Structure

- `.claude/`: Claude-specific adapters and guidance.
- `docs/`: development, architecture, tooling, and agent workflow documentation.
- `scripts/`: repository-level Project Hub wrappers.
- `tools/project_hub/`: self-contained Python tooling subproject.
- `AGENTS.md` and `CLAUDE.md`: portable agent guidance and its Claude-specific adapter.

## Development

Start with the [Development Guide](docs/development.md) for repository orientation, existing tooling
commands, and verification status. DeckAgent product setup, run, test, and build commands are TODO.

## Documentation

- [Development Guide](docs/development.md): contributor instructions.
- [Architecture](docs/architecture.md): confirmed boundaries and unresolved architecture decisions.
- [Project Hub guide](docs/tooling/project-hub.md): detailed tooling setup and operation.
- [Agent guidance](AGENTS.md): repository invariants and links to canonical agent workflows.
