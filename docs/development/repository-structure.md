# Repository structure

This document defines where code lives and who owns dependencies. Dependencies are
decided by responsibility and public contracts, not by directory position; the
invariants (no cycles, no private-implementation imports, no bypassing a contract)
are in `code-review-criteria.md` CQC-006.

## Directory responsibilities

| Directory | Responsibility |
| --- | --- |
| `apps/` | Application composition and process entry points. |
| `packages/` | Reusable DeckAgent-owned libraries, grouped by domain as `packages/<domain>/<name>`. |
| `vendor/` | Pinned upstream code; keep upstream identities and source (see [UPSTREAM.md](../../UPSTREAM.md)). Do not edit. |
| `scripts/` | Repository build and maintenance scripts. |
| `tests/` | Node test-runner suites and their fixtures in `tests/fixtures/`. |
| `config/` | Checked-in sample/development configuration; never commit secrets. |
| `docs/` | Repository documentation (placement rules in [docs/AGENTS.md](../AGENTS.md)). |

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

This section describes the current state and changes with the codebase; it is not a
durable rule.

| Package | Path | Depends on |
| --- | --- | --- |
| `@deckagent/agent-runtime` | `packages/agent/runtime` | `@deepseek-ai/cordis` |
| `@deckagent/model-providers` | `packages/llm/providers` | `@deckagent/agent-runtime` |
| `@deckagent/session-persistence` | `packages/session/persistence` | `@deckagent/agent-runtime` |
| `@deckagent/foundation-fixture` | `packages/testing/foundation-fixture` | `@deepseek-ai/cordis` |
| `@deckagent/agent-runtime-cli` | `apps/agent-runtime` | runtime, providers, persistence, `@deepseek-ai/cordis` |
| `@deckagent/foundation` | `apps/foundation` | `@deepseek-ai/cordis`, fixture |

Adding a package touches `pnpm-workspace.yaml`, the root `package.json`, the root
`tsconfig.json`, `tsconfig.base.json`, and the build script; the build script's
hard-coded root list is known debt (candidate for a later cleanup). Package names do
not always mirror directory paths (`model-providers` in `packages/llm`, `-cli` on
`apps/agent-runtime`); this drift is recorded as-is and renaming is a separate
cleanup task.
