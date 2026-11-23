# Task 14: Enforce imports and dependency direction

Read this file to learn the steps that enforce imports and dependency direction.

This task applies the target ownership rules [[1]](#ref-1).
Keep implementation constraints [[2]](#ref-2) and test behavior [[3]](#ref-3).

**Read first:**

- [Global Constraints](README.md#global-constraints) in README.md.
- `docs/conventions/project-structure.md (Dependency rules and Enforcement)`.
- `scripts/build-workspace.mjs`.
- `tsconfig.base.json`.
- `.oxlintrc.json`.
- `package.json`.
- `.github/workflows/workspace.yml`.
- `apps/web/src/features/`.
- `apps/web/src/browser/features/`.
- `.agents/skills/tdd/SKILL.md`.
- `.agents/skills/asd-ste100/SKILL.md`.

**Files:**

- Create: scripts/check-boundaries.mjs and tests/check-boundaries.test.mjs.
- Change: package.json, tsconfig.base.json, .github/workflows/workspace.yml.
- Change: production import declarations that the new check rejects. Preserve each imported operation.
- Change: package manifests and TypeScript references only to remove dependencies made obsolete by earlier moves.

**Interfaces:**

- Produces: checkBoundaries(files: readonly { path: string, text: string }[], packageRoots: Readonly<Record<string, { root: string, exports: readonly string[] }>>): readonly { path: string, rule: string, target: string }[].
- Produces CLI: node scripts/check-boundaries.mjs. It discovers tracked and unignored production source without reading generated output.
- Produces script: check:boundaries. Successful output is 'check-boundaries: 0 error(s)'. Violations exit with code 1.
- Uses the installed TypeScript compiler API for import parsing. Adds no dependency.
- The existing build already detects package-manifest cycles. The new check adds source-import and feature-cycle checks.

**STOP when:**

- A command output differs from Expected.
- A file differs from the described input beyond accepted predecessor changes.
- A step needs a decision that this task does not contain.
- The same step fails twice.
- An existing TypeScript or oxlint setting already enforces the same proposed rule.
- A dynamic internal import has no statically resolvable target.
- Resolving a violation requires changing ownership instead of an import declaration.
- A check needs an exception to make a real production violation pass.

**Forbidden:**

- Change a file outside Files.
- Remove, skip, or weaken a test or check.
- Add a lint-disable directive or ts-expect-error.
- Add a comment that contradicts Coding Guidelines or Testware.
- Commit or push.
- Change a product rule, a database schema, or an unresolved product decision.

- [ ] **Step 1: Check the enforcement gap**

Read `scripts/build-workspace.mjs` and `.oxlintrc.json`.
The build checks package-manifest cycles.
It does not parse cross-feature imports, relative package escapes, or feature cycles.
Use the compiler API only for those missing checks.
Do not duplicate formatting, typechecking, or general lint rules.

- [ ] **Step 2: Add complete negative-fixture tests**

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { checkBoundaries } from '../scripts/check-boundaries.mjs'

const packages = {
  '@deckagent/host-contracts': { root: 'packages/host/contracts', exports: ['.'] },
  '@deckagent/host-api': { root: 'packages/host/api', exports: ['.'] },
  '@deckagent/session-persistence': { root: 'packages/session/persistence', exports: ['.'] },
  '@deckagent/deck': { root: 'packages/presentation/deck', exports: ['.', './brief'] },
  '@deckagent/html-format': { root: 'packages/presentation/html', exports: ['.'] },
}

const cases = [
  ['private package path', 'apps/web/src/index.ts',
    "import '@deckagent/session-persistence/src/index.ts'",
    'cross-package-private-import'],
  ['Browser imports Host implementation', 'apps/web/src/browser/boot.ts',
    "import '@deckagent/host-api'", 'browser-runtime-import'],
  ['wire package imports Node', 'packages/host/contracts/src/index.ts',
    "import 'node:sqlite'", 'contracts-runtime-import'],
  ['Deck imports concrete HTML', 'packages/presentation/deck/src/index.ts',
    "import '@deckagent/html-format'", 'concrete-format-import'],
  ['feature imports another private module', 'apps/web/src/features/a/index.ts',
    "import '../b/private.ts'", 'feature-private-import'],
  ['dynamic literal private path', 'apps/web/src/index.ts',
    "import('@deckagent/deck/src/index.ts')", 'cross-package-private-import'],
]

for (const [name, path, text, rule] of cases) {
  test(name, () => {
    const result = checkBoundaries([{ path, text }], packages)
    assert.deepEqual(result.map(item => item.rule), [rule])
  })
}

test('public imports and strings that resemble imports pass', () => {
  const files = [{
    path: 'apps/web/src/features/a/index.ts',
    text: "import '@deckagent/deck/brief'\nconst label = 'node:sqlite'",
  }]
  assert.deepEqual(checkBoundaries(files, packages), [])
})

test('a feature cycle fails once', () => {
  const files = [
    { path: 'apps/web/src/features/a/index.ts', text: "import '../b/index.ts'" },
    { path: 'apps/web/src/features/b/index.ts', text: "import '../a/index.ts'" },
  ]
  assert.deepEqual(
    checkBoundaries(files, packages).map(item => item.rule),
    ['dependency-cycle'],
  )
})
```

Run `node --test --test-reporter=tap tests/check-boundaries.test.mjs`.
Expected: FAIL because the check module does not exist.

- [ ] **Step 3: Implement the import check**

Parse imports, re-exports, type imports, and literal dynamic imports.
Resolve relative paths before comparing owners.
Read public package subpaths from package.json exports.
Reject a foreign package's src, lib, relative path, and non-exported subpath.

Apply these additional rules:
Browser imports only Browser modules and host/contracts.
Wire contracts import no Node, Host API, Deck implementation, Session, or application implementation.
Deck imports no concrete HTML or PPTX adapter.
A package imports no application source.
An adapter imports only the public design and document contracts from presentation packages.
A feature imports another feature only through that feature's index.ts.
A feature graph has no cycle.
Check Local Host features and Browser features as separate graphs.
Request Lifecycle imports no HTTP transport module.

Report one cycle per strongly connected component.
Sort diagnostics by path, rule, and target.
Skip comments and string literals that are not import syntax.
Report unresolved internal targets as failures.
Do not claim the static check proves runtime authority.

- [ ] **Step 4: Remove source aliases**

Remove workspace-source mappings from `tsconfig.base.json`.
Resolve cross-package code through package exports and project references.
Keep owner-local relative imports.
Do not add re-export bridges to hide violations.

- [ ] **Step 5: Install and check enforcement**

Add `check:boundaries` to package.json.
Add a separate CI step after build.
Run `corepack pnpm@11.28.5 build`.
Run `node --test --test-reporter=tap tests/check-boundaries.test.mjs`.
Run `corepack pnpm@11.28.5 check:boundaries`.
Run `corepack pnpm@11.28.5 lint`.
Expected: all commands exit with code 0. Tests print `# fail 0`.
The boundary check prints `check-boundaries: 0 error(s)`.
For each negative fixture, report its expected rule and observed failure.
The fixture tests check detection without leaving a real production violation.

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
