> **Status: proposal** — These conventions assume TypeScript and a workspace layout
> that depend on stack choices not yet decided (see `dev/mvp/research/stack-and-deployment.md`
> Q-035). Treat as guidance, not constraint, until the relevant decisions are recorded
> in `dev/mvp/decisions/`.

# Coding conventions

This document records the project's coding conventions. It is a living document: each
section names a topic a convention must cover and the kind of decision it records.
Fill each placeholder with the project's own choice as the codebase takes shape; an
unfilled section does not constrain a change. The conventions apply to new code and to
changes under review.

Examples illustrate a rule; they are not additional rules. Where the codebase does not
yet follow a rule, the gap is marked **Known drift** — do not copy the drift. How a
change is judged (`MUST` / `SHOULD` / `MAY`) is in
[`code-review-criteria.md`](./code-review-criteria.md); where code lives is in
[`repository-structure.md`](./repository-structure.md).

## 1. File and directory naming

- Source files use `kebab-case.ts`; one primary concern per file.
- A package's public barrel is `index.ts`; cross-module contracts for a package live
  in `contracts.ts`.
- Test files follow the testing conventions in §7.

## 2. TypeScript symbols and exports

- `interface` for public object contracts; `type` for unions and aliases.
- Discriminated unions carry a literal tag (`role`, `type`, `status`).
- Mark contract fields `readonly`; use `readonly T[]` and `Readonly<Record<...>>`.
- Distinguish a package's public API (imported through its barrel or contract file)
  from internal module exports; only the public API is subject to surface-stability
  review.
- Prefer explicit `export` / `export type` for new public APIs so a reviewer sees the
  surface change in one place.
- Classes `PascalCase`; functions, variables, and members `camelCase`;
  `SCREAMING_SNAKE_CASE` for error codes (see §4) and, where it helps, named
  constants.

## 3. Imports and module boundaries

- Relative imports within a package include the `.ts` extension
  (`import { buildPrompt } from './prompt.ts'`).
- Cross-package imports use a workspace alias recorded in `repository-structure.md`
  (for example `import { Something } from '<scope>/<package>'`).
- Node built-ins use the `node:` prefix; use `import type` for type-only symbols.
- Dependency invariants (no cycles, no private-implementation imports, no bypassing a
  contract) are enforced by CQC-006.

## 4. Errors

- Each domain boundary chooses one error shape it owns: codes in
  `SCREAMING_SNAKE_CASE` prefixed by area, and human-readable messages that never
  contain secrets or raw exception bodies.
- Distinguishing error outcomes and not leaking secrets are judged by CQC-008 and
  CQC-009.

## 5. Async and data-copy idioms

- Model streaming returns an `AsyncIterable`; tool execution returns a `Promise`.
- Respect `AbortSignal`: `throwIfAborted()`, and combine with `AbortSignal.any` /
  `AbortSignal.timeout`.
- Copy (`structuredClone`) only at an ownership or mutation boundary — where a stored
  or shared value could otherwise be mutated by its caller.
- Failure, cancellation, and resource-ownership rules are judged by CQC-010, CQC-011,
  and CQC-012.

## 6. Type safety

- `tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`, and
  `noUnusedParameters`; do not relax these per package.
- Validate untrusted data at runtime before trusting its type; prefer narrow unions
  over `any`, use `unknown` and narrow before use, and use `never` for exhaustive
  checks.
- Do not add a type assertion to hide a contract mismatch or skip validation.

## 7. Testing

- New tests must be discoverable through the project's verification commands and must
  not require real credentials or cloud access. Record the project's current test
  toolchain and test-file layout here.
- Import the built output, not `src`, so tests exercise what is shipped.
- Use the framework's teardown hook and a temporary-directory helper for isolation;
  prefer loopback servers for anything network-facing.
- What makes a change "verified" and "testable" is judged by CQC-014 and CQC-018.

## 8. Package naming and public APIs

- Record the project's package scope and vendor scope here
  (`@<project>/*` owned; `<vendor>/*` vendored).
- A library's public entry point is declared in its manifest so consumers resolve the
  same surface the build produces; apps are private with no `exports`.
- Expose a small, stable barrel; put multi-component contracts in `contracts.ts`.
- **Known drift:** package names do not always mirror directory paths — see
  `repository-structure.md`; renaming is a separate cleanup task.
