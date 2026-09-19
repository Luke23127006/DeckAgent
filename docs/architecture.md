# Architecture

## Current State

DeckAgent application architecture is not yet defined. Application implementation does not exist yet.

## Confirmed Repository Boundaries

Project Hub is internal repository tooling under `tools/project_hub/`. It has its own Python package,
dependencies, tests, and configuration. It is not a DeckAgent runtime dependency and should not be
treated as the future DeckAgent application architecture.

See the [Project Hub guide](tooling/project-hub.md#architecture) for the existing tool's architecture
and the [Development Guide](development.md) for repository orientation.

## Product Architecture

TODO.

## Infrastructure

TODO.

## Deployment

TODO.

## Architecture Decisions

TODO: decide whether to adopt an ADR or other technical decision-record approach, consistent with
the source-of-truth boundaries in [AGENTS.md](../AGENTS.md).
