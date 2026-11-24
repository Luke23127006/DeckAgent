# Task 17: Enforce imports and dependency direction

Read this file to learn the steps that extend and enable strict dependency boundary checks in CI.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `docs/conventions/project-structure.md (Dependency rules and Enforcement)`.
- `scripts/check-boundaries.mjs`.
- `tests/check-boundaries.test.mjs`.
- `.oxlintrc.json`.
- `tests/oxlint-boundaries.test.mjs`.
- `scripts/build-workspace.mjs`.
- `tsconfig.base.json`.
- `package.json`.
- `.github/workflows/workspace.yml`.
- `apps/web/src/features/`.
- `apps/web/src/integrations/`.
- `apps/web/src/browser/`.
- `.agents/skills/tdd/SKILL.md`.
- `.agents/skills/asd-ste100/SKILL.md`.

**Files:**

- Change: `scripts/check-boundaries.mjs` and `tests/check-boundaries.test.mjs`.
- Change: `.oxlintrc.json` and `tests/oxlint-boundaries.test.mjs`.
- Change: `tsconfig.base.json`, `.github/workflows/workspace.yml`, and `docs/conventions/project-structure.md` (Enforcement table only).
- Change: production import declarations that the extended check rejects. Preserve each imported operation.
- Change: package manifests and TypeScript references only to remove dependencies made obsolete by earlier moves.

**Interfaces:**

- Preserves: all 12 Wave 0 rules in `scripts/check-boundaries.mjs` (including Browser-to-Local-Host relative import rejection under `browser-node-import` and owner-local test exemptions from production-only rules).
- Preserves: `extractImports`, `checkBoundaries(snapshot)`, and `formatReport(violations)` in `scripts/check-boundaries.mjs`.
- Preserves: scripts `check:boundaries` and `check:boundaries:report` in `package.json`. Clean output ends with `check-boundaries: 0 violation(s)`. Violations exit with code 1.
- Adds rules to `checkBoundaries(snapshot)`:
  - `browser-feature-private-import`: a Browser feature under `apps/web/src/browser/features/<name>/` imports another Browser feature only through its `index`.
  - `browser-feature-cycle`: Browser feature graph has no cycle, checked separately from the Local Host feature graph.
  - `browser-transport-ui-import`: files under `apps/web/src/browser/transport/` must not import files under `apps/web/src/browser/features/`.
  - `integration-private-import`: files outside `apps/web/src/integrations/<name>/` import an integration only through its `index`.
  - `unresolved-internal-import`: a relative import in repository source must resolve to a file in the snapshot.
- Updates `.oxlintrc.json` lifecycle override to include `**/packages/host/api/src/request-controller.ts` alongside `**/packages/host/api/src/lifecycle/**`.
- Uses the installed TypeScript compiler API. Adds no dependency.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- A dynamic internal import has no statically resolvable target.
- Resolving a violation requires changing ownership instead of an import declaration.
- A check needs an exception to make a real production violation pass.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or `@ts-expect-error`.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [ ] **Step 1: Check the remaining enforcement gaps**

Run `corepack pnpm@11.28.5 check:boundaries:report`.
Inspect all 12 rules in `scripts/check-boundaries.mjs` and the 5 overrides in `.oxlintrc.json`.
Check that Wave 0 violations are down to zero after Tasks 05 through 15.
Check these remaining gaps: Browser feature private imports and cycles, Browser transport importing Browser UI features, and integration private imports.
Also check unresolved relative imports, `request-controller.ts` in `.oxlintrc.json`, and `tsconfig.base.json` source aliases.

- [ ] **Step 2: Add negative-fixture tests for the new rules**

Add test cases to `tests/check-boundaries.test.mjs` covering:

- `browser-feature-private-import`: `apps/web/src/browser/features/chats/conversation-view.ts` imports `../deck/deck-model.ts`.
- `browser-feature-cycle`: `apps/web/src/browser/features/a/index.ts` and `apps/web/src/browser/features/b/index.ts` import each other.
- `browser-transport-ui-import`: `apps/web/src/browser/transport/host-client.ts` imports `../features/chats/index.ts`.
- `integration-private-import`: `apps/web/src/features/research/research-service.ts` imports `../../integrations/research/tavily.ts`.
- `unresolved-internal-import`: `apps/web/src/features/chats/index.ts` imports `./missing-module.ts`.
- Positive case: Browser feature imports another Browser feature through `index.ts`, and Host feature imports integration through `index.ts`, with 0 violations.

Add a test case to `tests/oxlint-boundaries.test.mjs` checking that `packages/host/api/src/request-controller.ts` rejects `./http-error.ts`.

Run `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs`.
Expected: FAIL on the newly added test cases before implementation.

- [ ] **Step 3: Implement the extended checks**

Update `scripts/check-boundaries.mjs` to enforce the five added rules while keeping all 12 Wave 0 rules and existing tests passing.
Sort diagnostics by path, line, and rule.
Keep comments and non-import string literals ignored.
Do not claim the static check proves runtime authority.
Write any new violation messages in English following `.agents/skills/asd-ste100/SKILL.md` strict mode.

Update `.oxlintrc.json` to add `**/packages/host/api/src/request-controller.ts` to the Request Lifecycle override.
Update `.oxlintrc.json` to remove the obsolete `**/packages/client/runtime/src/**` override after Task 09 removes `packages/client/runtime`.

- [ ] **Step 4: Remove source aliases**

Remove workspace-source mappings from `tsconfig.base.json`.
Resolve cross-package code through package exports and project references.
Keep owner-local relative imports.
Do not add re-export bridges to hide violations.
Fix any remaining production import that `check:boundaries` rejects without changing behavior or ownership.

- [ ] **Step 5: Enable strict enforcement in CI and update documentation**

Add a `check:boundaries` step after `build` in `.github/workflows/workspace.yml`.
Update the Enforcement table in `docs/conventions/project-structure.md` so each enforced row reflects the active `oxlint` and `check:boundaries` checks.

Run:

```bash
corepack pnpm@11.28.5 build
node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/oxlint-boundaries.test.mjs
corepack pnpm@11.28.5 check:boundaries
corepack pnpm@11.28.5 lint
corepack pnpm@11.28.5 check:docs
```

Expected: all commands exit with code 0. Tests print `# fail 0`.
The boundary check prints `check-boundaries: 0 violation(s)`.
`check:docs` reports `0 error(s)`.
For each negative fixture, report its expected rule and observed failure.

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
