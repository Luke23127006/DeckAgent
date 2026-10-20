# Contributing to DeckAgent

DeckAgent is developed by coding agents and humans against the same repository. This
file describes how changes are proposed, scoped, reviewed, and verified. Branch
protection and merge policy live in repository settings, not here.

## Setup

Follow [README.md](README.md). Install with `pnpm install --frozen-lockfile` to
reproduce the locked dependencies; use a normal `pnpm install` when you are
deliberately updating dependencies.

## Branches and pull requests

Use descriptive branch names and follow the current repository workflow.

## Scope of a change

- One concern per change; do not bundle unrelated features, refactors, formatting,
  dependency upgrades, or shared-configuration changes. Directly necessary small
  changes are explained.
- Preserve other contributors' uncommitted work; inspect the working tree before
  editing.
- When a change touches an API, schema, shared type, file format, or configuration
  contract, update the affected producers, consumers, tests, and documentation in the
  same change and explain the compatibility impact.

## Review

- Every review — human or coding agent — applies the criteria in
  [`docs/development/code-review-criteria.md`](docs/development/code-review-criteria.md)
  as the single review standard; that standard does not require a specific tool.
- A shared interface has a clear owner; consumers access it through the owning
  package's public API, not its internals.
- [OpenCodeReview](docs/tooling/open-code-review.md) (via the
  `open-code-review-delegate` skill) is an optional helper for deterministic file
  selection and rule resolution; its filters live in `.opencodereview/rule.json`.
  The project rule file adds a DeckAgent-specific rule for `.agents/**/*` and
  excludes the generated skill mirrors; application code is reviewed against OCR's
  built-in system rules.

## Code review criteria and comments

Reviews apply the criteria in
[`docs/development/code-review-criteria.md`](docs/development/code-review-criteria.md)
(`CQC-001`, and so on); that document defines the `MUST` / `SHOULD` / `MAY` levels and
the `Blocker` / `Major` / `Suggestion` / `Nit` labels. Authors resolve `Blocker`
findings before merge; for a `Major`, fix it or record why the trade-off is accepted.
Do not treat every `SHOULD` deviation as blocking.

## Checks

Run the focused checks relevant to the change using the scripts in
[`package.json`](package.json): `typecheck`, `build`, `lint`, and the area-specific
test suites. Verify formatting with `format:check <changed-files>` and apply it with
`format <changed-files>` — always pass explicit file paths, since formatting the whole
workspace would rewrite legacy code that has pre-existing drift. Never delete,
disable, or weaken a test to make a change pass.

## Verification evidence

Record what you verified and its limits — tested revision, environment, commands run,
and expected/actual results — and keep secrets out of evidence. Do not mark a task or
integration gate as passing without evidence.

See also the root [`AGENTS.md`](AGENTS.md) for scope, architecture, verification, and
handoff rules that apply to every change.
