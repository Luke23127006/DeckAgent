# Task 01: Record the refactor baseline

Read this file to learn the steps that record the refactor baseline.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `package.json`.
- `tsconfig.json`.
- `tsconfig.base.json`.
- `scripts/build-workspace.mjs (lines 1-90)`.
- `.github/workflows/workspace.yml (lines 1-155)`.
- `docs/open-questions.md`.
- `tests/request-lifecycle.test.mjs (lines 1-340)`.

**Files:**

- Change: this task file, for its completion checkboxes only.

**Interfaces:**

- Uses: the existing root package scripts. Produces: a report in the conversation. Produces no application API.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- A local provider key or a public network request is necessary for a baseline test.
- A product test fails. Report the failure without changing its expected result.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [ ] **Step 1: Record the input state**

Run `git status --short`, `git rev-parse HEAD`, `node --version`, and `corepack pnpm@11.28.5 --version`.
Expected: Node prints `v22.19.0`. pnpm prints `11.28.5`.
Record pre-existing changes. Do not reset those changes.

- [ ] **Step 2: Check the current structure**

Run `corepack pnpm@11.28.5 build`.
Run `corepack pnpm@11.28.5 lint`.
Run `corepack pnpm@11.28.5 check:docs`.
Expected: each command exits with code 0. The document check reports `0 error(s)`.

- [ ] **Step 3: Record the behavioral baseline**

Run each command separately:

```bash
corepack pnpm@11.28.5 test:model-requests
corepack pnpm@11.28.5 test:source-permissions
corepack pnpm@11.28.5 test:local-foundation
corepack pnpm@11.28.5 test:deck-review
corepack pnpm@11.28.5 test:generation-publication
```

Expected: each command exits with code 0 and prints `# fail 0`.
Record test and skip counts for each command.
A skip is not evidence that the skipped behavior works.
Do not run any script whose name contains `live`.

- [ ] **Step 4: Record compatibility constraints**

Record package names, package exports, HTTP routes, event fields, database versions, and stored template versions.
Use source files and manifests. Do not inspect the user's saved application data.
Record existing differences from use cases without changing those differences.
The baseline preserves behavior. It does not certify use-case compliance.

- [ ] **Final step: Report and stop**

Send this report in the conversation:

- Files changed, including moves.
- Commands run, exit codes, and the last 20 output lines.
- Test and skip counts.
- Items that a decision table sends to the report.
- Existing failures and unresolved decisions.
- What the commands do not prove.

Mark steps complete only after their Expected results occur.
Do not start another task until the task owner accepts this report.

## References

1. <a id="ref-1"></a>[Project Structure](../../../../conventions/project-structure.md)
2. <a id="ref-2"></a>[Coding Guidelines](../../../../conventions/code.md)
3. <a id="ref-3"></a>[Testware](../../../../conventions/testware.md)
