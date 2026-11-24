# Task 3: Add boundary and dependency graph checker

Read this file to learn the steps of Task 3, which adds `scripts/check-boundaries.mjs` and its negative fixture test suite `tests/check-boundaries.test.mjs`.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `docs/conventions/project-structure.md` (lines 118-163)
- `scripts/check-docs.mjs` (lines 175-234)
- `package.json` (the `scripts` object)
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Create: `scripts/check-boundaries.mjs`
- Create: `tests/check-boundaries.test.mjs`
- Change: `package.json` (the `scripts` object)
- Change: this task file, for its completion checkboxes only.

**Interfaces:**
- Uses: `typescript` compiler API (installed in `devDependencies`).
- Produces, all exported from `scripts/check-boundaries.mjs`:
  - `extractImports(filePath: string, sourceText: string): Array<{ line: number, specifier: string }>`
  - `checkBoundaries(snapshot: { workspaces: Array<{ dir: string, name: string, exports?: Record<string, unknown> }>, files: Array<{ path: string, content: string }>, tsconfigPaths?: Record<string, string[]> }): Array<{ path: string, line: number, rule: string, message: string }>`
  - `formatReport(violations: Array<{ path: string, line: number, rule: string, message: string }>): string`

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment that breaks `docs/conventions/code.md`, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Write the failing unit and negative fixture tests**

Create `tests/check-boundaries.test.mjs` with this content:

```js
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkBoundaries, extractImports, formatReport } from '../scripts/check-boundaries.mjs'

const baseWorkspaces = [
  { dir: 'apps/web', name: '@deckagent/web', exports: { '.': './lib/index.js' } },
  { dir: 'packages/host/api', name: '@deckagent/host-api', exports: { '.': './lib/index.js' } },
  { dir: 'packages/host/contracts', name: '@deckagent/host-contracts', exports: { '.': './lib/index.js' } },
  {
    dir: 'packages/presentation/deck',
    name: '@deckagent/deck',
    exports: { '.': './lib/index.js', './brief': './lib/brief.js' },
  },
  { dir: 'packages/presentation/design', name: '@deckagent/design', exports: { '.': './lib/index.js' } },
  { dir: 'packages/presentation/document', name: '@deckagent/presentation-document', exports: { '.': './lib/index.js' } },
  { dir: 'packages/presentation/html', name: '@deckagent/html-format', exports: { '.': './lib/index.js' } },
  { dir: 'packages/presentation/pptx', name: '@deckagent/pptx-format', exports: { '.': './lib/index.js' } },
  { dir: 'packages/session/persistence', name: '@deckagent/session-persistence', exports: { '.': './lib/index.js' } },
  { dir: 'packages/workspace/registry', name: '@deckagent/workspace-registry', exports: { '.': './lib/index.js' } },
  { dir: 'packages/tools/filesystem', name: '@deckagent/file-tools', exports: { '.': './lib/index.js' } },
]

const rules = (files, tsconfigPaths = {}) =>
  checkBoundaries({ workspaces: baseWorkspaces, files, tsconfigPaths }).map(v => v.rule)

test('extractImports ignores imports inside comments and strings', () => {
  const source = [
    "// import x from '@deckagent/deck/src/internal'",
    "const text = \"import y from 'node:fs'\"",
    "import { ok } from '@deckagent/design'",
    "export { ok } from '@deckagent/presentation-document'",
    "const lazy = () => import('@deckagent/deck/brief')",
  ].join('\n')
  assert.deepEqual(extractImports('apps/web/src/index.ts', source), [
    { line: 3, specifier: '@deckagent/design' },
    { line: 4, specifier: '@deckagent/presentation-document' },
    { line: 5, specifier: '@deckagent/deck/brief' },
  ])
})

test('checkBoundaries accepts valid dependency structure', () => {
  const files = [
    { path: 'apps/web/src/index.ts', content: "import { startHost } from '@deckagent/host-api'\nimport { run } from './features/deck/index.ts'\n" },
    { path: 'apps/web/src/browser/transport/client.ts', content: "import type { Req } from '@deckagent/host-contracts'\n" },
    { path: 'apps/web/src/features/deck/index.ts', content: "import { load } from '../research/index.ts'\n" },
    { path: 'apps/web/src/features/research/index.ts', content: "export const load = () => 1\n" },
    { path: 'packages/presentation/html/src/index.ts', content: "import { d } from '@deckagent/design'\nimport { doc } from '@deckagent/presentation-document'\n" },
  ]
  const tsconfigPaths = { '@deckagent/deck': ['./packages/presentation/deck/src/index.ts'] }
  assert.deepEqual(rules(files, tsconfigPaths), [])
})

test('checkBoundaries rejects dynamic import of private package path', () => {
  const files = [
    { path: 'apps/web/src/index.ts', content: "export const f = () => import('@deckagent/deck/src/internal.ts')\n" },
  ]
  assert.deepEqual(rules(files), ['private-package-import'])
})

test('checkBoundaries rejects undeclared subpath and cross-workspace relative import', () => {
  const files = [
    { path: 'apps/web/src/a.ts', content: "import { x } from '@deckagent/deck/secret'\n" },
    { path: 'apps/web/src/b.ts', content: "import { y } from '../../../packages/presentation/deck/src/index.ts'\n" },
  ]
  assert.deepEqual(rules(files), ['private-package-import', 'private-package-import'])
})

test('checkBoundaries rejects tsconfig alias to private file', () => {
  const tsconfigPaths = {
    '@deckagent/deck/internal': ['./packages/presentation/deck/src/schema.ts'],
  }
  assert.deepEqual(rules([], tsconfigPaths), ['tsconfig-private-alias'])
})

test('checkBoundaries rejects node builtin and host imports in browser code', () => {
  const files = [
    { path: 'apps/web/src/browser/boot.ts', content: "import fs from 'node:fs'\nimport { h } from '@deckagent/host-api'\n" },
  ]
  assert.deepEqual(rules(files), ['browser-node-import', 'browser-node-import'])
})

test('checkBoundaries rejects runtime imports in host contracts', () => {
  const files = [
    { path: 'packages/host/contracts/src/index.ts', content: "import { startHost } from '@deckagent/host-api'\n" },
  ]
  assert.deepEqual(rules(files), ['contracts-runtime-import'])
})

test('checkBoundaries rejects transport imports in Request Lifecycle', () => {
  const files = [
    { path: 'packages/host/api/src/request-controller.ts', content: "import { HttpError } from './http-error.ts'\n" },
    { path: 'packages/host/api/src/lifecycle/controller.ts', content: "import http from 'node:http'\n" },
  ]
  assert.deepEqual(rules(files), ['lifecycle-transport-import', 'lifecycle-transport-import'])
})

test('checkBoundaries rejects deck importing concrete format adapter', () => {
  const files = [
    { path: 'packages/presentation/deck/src/artifact-store.ts', content: "import { HtmlFormatAdapter } from '@deckagent/html-format'\n" },
  ]
  assert.deepEqual(rules(files), ['deck-concrete-adapter'])
})

test('checkBoundaries rejects format adapter importing outside design and document', () => {
  const files = [
    { path: 'packages/presentation/html/src/index.ts', content: "import { DeckService } from '@deckagent/deck'\n" },
  ]
  assert.deepEqual(rules(files), ['format-adapter-dependency'])
})

test('checkBoundaries rejects package importing app and domain importing host runtime', () => {
  const files = [
    { path: 'packages/host/api/src/index.ts', content: "import { app } from '@deckagent/web'\n" },
    { path: 'packages/session/persistence/src/index.ts', content: "import { startHost } from '@deckagent/host-api'\n" },
  ]
  assert.deepEqual(rules(files), ['package-app-dependency', 'domain-runtime-dependency'])
})

test('checkBoundaries rejects private import across features', () => {
  const files = [
    { path: 'apps/web/src/features/deck/workflow.ts', content: "import { helper } from '../research/tavily.ts'\n" },
  ]
  assert.deepEqual(rules(files), ['feature-private-import'])
})

test('checkBoundaries detects a package cycle', () => {
  const files = [
    { path: 'packages/presentation/design/src/index.ts', content: "import { a } from '@deckagent/presentation-document'\n" },
    { path: 'packages/presentation/document/src/index.ts', content: "import { b } from '@deckagent/design'\n" },
  ]
  assert.deepEqual(rules(files), ['package-cycle'])
})

test('checkBoundaries detects a three-way feature cycle', () => {
  const files = [
    { path: 'apps/web/src/features/a/index.ts', content: "import { b } from '../b/index.ts'\n" },
    { path: 'apps/web/src/features/b/index.ts', content: "import { c } from '../c/index.ts'\n" },
    { path: 'apps/web/src/features/c/index.ts', content: "import { a } from '../a/index.ts'\n" },
  ]
  assert.deepEqual(rules(files), ['feature-cycle'])
})

test('formatReport summarizes violations by rule', () => {
  const text = formatReport([
    { path: 'a.ts', line: 1, rule: 'deck-concrete-adapter', message: 'msg1' },
    { path: 'b.ts', line: 2, rule: 'deck-concrete-adapter', message: 'msg2' },
  ])
  assert.match(text, /deck-concrete-adapter: 2/)
  assert.match(text, /check-boundaries: 2 violation\(s\)/)
})
```

- [x] **Step 2: Run the test and check that it fails**

Run: `node --test --test-reporter=tap tests/check-boundaries.test.mjs`
Expected: FAIL. The output contains `Cannot find module` for `scripts/check-boundaries.mjs`.

- [x] **Step 3: Implement `scripts/check-boundaries.mjs`**

Create `scripts/check-boundaries.mjs` with the three exported functions and the CLI entry point.

Requirements for `extractImports(filePath, sourceText)`:
- Parse `sourceText` with `ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true)`.
- Collect the module specifier and 1-based line number from:
  - `ts.ImportDeclaration` (`moduleSpecifier` string literal)
  - `ts.ExportDeclaration` with `moduleSpecifier` string literal
  - `ts.CallExpression` where `expression.kind === ts.SyntaxKind.ImportKeyword` and the first argument is a string literal

Requirements for `checkBoundaries(snapshot)`:
- Normalize every path to POSIX forward slashes (`/`).
- Check these twelve rules, returning `{ path, line, rule, message }` sorted by `path`, then `line`, then `rule`:
  1. `private-package-import`:
     - Any import of `@deckagent/<pkg>/<subpath>` where `./<subpath>` is not a key in that workspace's `exports` (or when `<subpath>` starts with `src/` or `lib/`).
     - Any relative import (`./` or `../`) from a file inside one workspace (or inside `tests/` or `e2e/`) that resolves into another workspace's `src/` or `lib/` directory.
  2. `tsconfig-private-alias`:
     - Each entry in `snapshot.tsconfigPaths` whose key starts with `@deckagent/` must match a declared export key of the matching workspace (`"."` for `@deckagent/<pkg>`, or `"./<subpath>"` for `@deckagent/<pkg>/<subpath>`).
     - Each target path in that entry must map to the corresponding source entry (`./<dir>/src/index.ts` for `"."`, or `./<dir>/src/<subpath>.ts` or `./<dir>/src/<subpath>/index.ts` for `"./<subpath>"`). Report at `path: 'tsconfig.base.json'`, `line: 1`.
  3. `browser-node-import`:
     - Applies to files under `apps/web/src/browser/` or `packages/client/runtime/src/`.
     - Rejects `node:*`, bare Node built-in names (`fs`, `path`, `http`, `https`, `crypto`, `child_process`, `os`, `url`, `stream`, `sqlite`, `net`, `tls`, `worker_threads`), and any `@deckagent/*` package except `@deckagent/host-contracts`, `@deckagent/design` and `@deckagent/presentation-document`.
  4. `contracts-runtime-import`:
     - Applies to files under `packages/host/contracts/`.
     - Rejects `node:*`, bare Node built-ins, and any `@deckagent/*` package other than `@deckagent/design` and `@deckagent/presentation-document`.
  5. `lifecycle-transport-import`:
     - Applies to `packages/host/api/src/request-controller.ts` and files under `packages/host/api/src/lifecycle/`.
     - Rejects `node:http`, `node:https`, and any relative import resolving to `http-error`, `deck-routes`, `multipart`, or under `packages/host/api/src/transport/`.
  6. `deck-concrete-adapter`:
     - Applies to files under `packages/presentation/deck/`.
     - Rejects `@deckagent/html-format` and `@deckagent/pptx-format`.
  7. `format-adapter-dependency`:
     - Applies to files under `packages/presentation/html/` and `packages/presentation/pptx/`.
     - Rejects any `@deckagent/*` import other than `@deckagent/design` and `@deckagent/presentation-document`.
  8. `package-app-dependency`:
     - Applies to files under `packages/`.
     - Rejects any import of a workspace whose `dir` starts with `apps/`.
  9. `domain-runtime-dependency`:
     - Applies to files under `packages/presentation/`, `packages/session/persistence/`, `packages/workspace/registry/` and `packages/tools/filesystem/`.
     - Rejects `@deckagent/host-api` and `@deckagent/browser-runtime`.
  10. `feature-private-import`:
     - Applies to files under `apps/web/src/features/<featureA>/`.
     - When a relative import resolves into `apps/web/src/features/<featureB>/` with `<featureB> !== <featureA>`, reject unless the resolved target is `apps/web/src/features/<featureB>/index.ts` (or `index.js`).
  11. `package-cycle`:
     - Build a directed graph between workspace names from `@deckagent/*` imports in workspace files under `apps/` and `packages/`.
     - Run deterministic DFS (sorted node order). For each cycle found, emit one violation with `path` set to the lowest-sorted workspace `dir`, `line: 1`, `rule: 'package-cycle'` and the cycle chain in `message`. Deduplicate identical cycles by canonical rotation.
  12. `feature-cycle`:
     - Build a directed graph between feature names in `apps/web/src/features/<feature>/` from cross-feature relative imports.
     - Run deterministic DFS (sorted node order). For each cycle found, emit one violation with `path: 'apps/web/src/features/<first>'`, `line: 1`, `rule: 'feature-cycle'` and the cycle chain in `message`. Deduplicate identical cycles by canonical rotation.

Requirements for `formatReport(violations)`:
- Print each violation as `<path>:<line> <rule> <message>`.
- Print a count per rule sorted by rule name (`<rule>: <count>`).
- Print a final summary line: `check-boundaries: <N> violation(s)`.

Requirements for the CLI entry point (`import.meta.url === pathToFileURL(process.argv[1]).href`):
- Read tracked and new non-ignored files via `git -c core.quotePath=false ls-files --cached --others --exclude-standard`.
- Discover workspaces from tracked `apps/*/package.json` and `packages/*/*/package.json`.
- Read source files in `apps/`, `packages/`, `tests/` and `e2e/` with extensions `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`, skipping paths containing `/lib/`, `/dist/` or `node_modules/`.
- Read `compilerOptions.paths` from `tsconfig.base.json`.
- Print `formatReport(violations)`.
- When `process.argv` includes `--report`, exit with code 0. Otherwise exit with code 1 when `violations.length > 0`, and code 0 when `violations.length === 0`.

- [x] **Step 4: Wire scripts into `package.json`**

Add these two entries to the `scripts` object in `package.json`:

```json
"check:boundaries": "node scripts/check-boundaries.mjs",
"check:boundaries:report": "node scripts/check-boundaries.mjs --report"
```

- [x] **Step 5: Run the unit tests, lint and report mode**

Run: `node --test --test-reporter=tap tests/check-boundaries.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `corepack pnpm@11.28.5 lint`
Expected: PASS. The command exits with code 0 and prints `Found 0 warnings and 0 errors.`.

Run: `corepack pnpm@11.28.5 check:boundaries:report`
Expected: PASS. The command exits with code 0 and prints `check-boundaries:` with a non-zero count of current legacy violations.

- [x] **Step 6: Report and stop**

Send this report:
- Files changed: list of paths
- Commands run, with the last 20 lines of output of each command
- Items that a decision table sent to the report (write `None`)
- What the commands do not prove
