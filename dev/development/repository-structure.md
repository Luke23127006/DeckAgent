> **Status: proposal** — This layout depends on stack and architecture decisions not yet
> made. The directory table below will be updated after the relevant decisions are
> recorded in `dev/mvp/decisions/`.

# Repository structure

This document records where code lives and who owns dependencies. It is a living
document: the sections below describe what to record and the decisions they capture;
fill in the project's own layout as the codebase takes shape. Dependencies are decided
by responsibility and public contracts, not by directory position; the invariants (no
cycles, no private-implementation imports, no bypassing a contract) are in
`code-review-criteria.md` CQC-006.

## Directory responsibilities

The layout below is a proposed default, not an approved decision. Adjust it to the
project and record the actual directories here.

| Directory | Responsibility |
| --- | --- |
| `apps/` | Application composition and process entry points. |
| `packages/` | Reusable project-owned libraries, grouped by domain as `packages/<domain>/<name>`. |
| `vendor/` | Pinned upstream code; keep upstream identities and source. Do not edit. |
| `scripts/` | Repository build and maintenance scripts. |
| `tests/` | Test suites and their fixtures. |
| `config/` | Checked-in sample/development configuration; never commit secrets. |
| `docs/` | Public documentation for outside readers; `docs/architecture/` holds the as-built module map and LLM boundary map. |
| `dev/` | Internal documentation for the dev team: the MVP (`dev/mvp/`: spec, workflow, research, decisions, templates, builds), conventions, meeting notes. |
| `dev/legacy/` | Read-only documents tied to the legacy code: how to run it, its conventions, its old version plans. |

**Legacy code.** Today `apps/`, `packages/`, `vendor/`, `scripts/` and the test files
directly in `tests/` hold the legacy code (AGENTS.md "Reference code"). Where the MVP code
lives is a Phase 3 decision; until it is recorded, do not add new
code next to the legacy code.

## When to create a new package (proposal)

Prefer extending an existing package when the new code shares its dependency direction
and public contract. Create a new package only when it needs at least one of:

- a dependency direction or data ownership that cannot live in an existing package
  without a circular dependency, a private-implementation import, or a bypassed
  contract;
- a public API surface that must not be coupled to another package; or
- a different reuse profile (a test fixture versus a runtime library).

This is a proposal, not an approved architecture decision; a new boundary still needs
owner sign-off.

## Current workspace (reference)

This section records the current packages and their dependency direction; it is not a
durable rule and changes as the codebase grows. Fill it in once the project's package
scope is decided; until then it stays empty.

| Package | Path | Depends on |
| --- | --- | --- |
| `<scope>/<name>` | `packages/<domain>/<name>` | `<scope>/<other>` |

Each row records one package: its published name, its directory, and the packages it
depends on (by contract and responsibility, not directory position).

Adding a package needs no fixed set of file changes: the workspace build discovers
packages automatically (so it changes only when a package adds a non-`index` entry
point), and the workspace manifest and shared TypeScript config are edited only when a
new glob, a root project reference, or a workspace path alias is actually required.
Package names do not always mirror directory paths; record that drift as-is and treat
renaming as a separate cleanup task.
