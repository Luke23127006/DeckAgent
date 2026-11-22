# Repository structure

This document defines where code lives and who owns dependencies. Dependencies are decided by responsibility and public contracts, not by directory position; the invariants (no cycles, no private-implementation imports, no bypassing a contract) are in `code-review-criteria.md` CQC-006.

## Directory responsibilities

| Directory | Responsibility |
| --- | --- |
| `apps/` | Application composition and process entry points. |
| `packages/` | Reusable DeckAgent-owned libraries, grouped by domain as `packages/<domain>/<name>`. |
| `scripts/` | Repository build and maintenance scripts. |
| `tests/` | Node test-runner suites and their fixtures in `tests/fixtures/`. |
| `config/` | Checked-in sample/development configuration; never commit secrets. |
| `docs/` | Repository documentation (placement rules in [docs/AGENTS.md](../AGENTS.md)). |

## When to create a new package (proposal)

Prefer extending an existing package when the new code shares its dependency direction and public contract. Create a new package only when it needs at least one of:

- a dependency direction or data ownership that cannot live in an existing package without a circular dependency, a private-implementation import, or a bypassed contract;
- a public API surface that must not be coupled to another package; or
- a different reuse profile (a test fixture versus a runtime library).

This is a proposal, not an approved architecture decision; a new boundary still needs owner sign-off.

## Current workspace (reference)

This section describes the current state and changes with the codebase; it is not a durable rule.

| Package | Path | Depends on |
| --- | --- | --- |
| `@deckagent/session-persistence` | `packages/session/persistence` | none |
| `@deckagent/workspace-registry` | `packages/workspace/registry` | none |
| `@deckagent/design` | `packages/presentation/design` | none |
| `@deckagent/presentation-document` | `packages/presentation/document` | design types; browser-safe contracts and decoders |
| `@deckagent/html-format` | `packages/presentation/html` | design, presentation-document, css-tree, parse5 |
| `@deckagent/pptx-format` | `packages/presentation/pptx` | design, presentation-document, pptxgenjs, jszip; native-format proof |
| `@deckagent/deck` | `packages/presentation/deck` | design, presentation-document, html-format compatibility default, zod; browser-safe Brief subpath |
| `@deckagent/file-tools` | `packages/tools/filesystem` | zip.js, fast-xml-parser, pdfjs-dist, sharp |
| `@deckagent/host-api` | `packages/host/api` | deck, busboy |
| `@deckagent/browser-runtime` | `packages/client/runtime` | deck, host-api, presentation-document; animejs at build time |
| `@deckagent/local-web` | `apps/local-web` | browser-runtime, deck, design, file-tools, host-api, session-persistence, workspace-registry, MCP SDK; optional Windows OpenCode runtime |

Adding a package needs no fixed set of file changes: the build script discovers workspace packages through pnpm (so it changes only when a package adds a non-`index` entry point), and `pnpm-workspace.yaml`, the root `tsconfig.json`, and `tsconfig.base.json` are edited only when a new glob, a root project reference, or a workspace path alias is actually required.
