# Task 1: Build quantitative module-design scanner and unit tests

Read this file to learn the steps of Task 1, which creates the static module-design scanner and its unit test suite.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `scripts/check-boundaries.mjs` (lines 1-120)
- `tests/check-boundaries.test.mjs` (lines 1-80)
- `package.json` (lines 24-43)
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**

- Create: `scripts/scan-module-design.mjs`
- Create: `tests/scan-module-design.test.mjs`
- Change: `package.json` (lines 24-43)
- Change: this task file, for completion checkboxes only

**Interfaces:**

- Uses: `typescript` (`ts.createSourceFile`, `ts.ScriptTarget.Latest`), `node:child_process` (`execFileSync`), `node:fs` (`readFileSync`), `node:path` (`posix`).
- Produces in `scripts/scan-module-design.mjs`:
  - `AREA_ORDER: readonly string[]` containing all 14 area labels in fixed order:
    `apps/web/src/browser/`, `apps/web/src/features/`, `packages/presentation/deck/`, `apps/web/src/integrations/`, `packages/session/persistence/`, `packages/host/api/`, `packages/host/contracts/`, `apps/web/src/`, `packages/tools/filesystem/`, `packages/presentation/html/`, `packages/workspace/registry/`, `packages/presentation/design/`, `packages/presentation/document/`, `packages/presentation/pptx/`.
  - `classifyArea(relativePath: string): string | null`
  - `analyzeSourceFile(relativePath: string, sourceText: string): { path: string; area: string | null; lines: number; isBarrel: boolean; exportCount: number; longFunctions: { name: string; line: number; lines: number }[]; typeAssertions: { line: number; text: string }[]; serviceSymbols: { name: string; line: number }[] }`
  - `analyzeTestFile(relativePath: string, sourceText: string): { path: string; group: string; lines: number; hasTopHeader: boolean; fixedTimeouts: number[]; scriptsLibImports: string[] }`
  - `computeCoChangePairs(commits: readonly (readonly string[])[], options?: { maxFilesPerCommit?: number; minCount?: number }): { files: [string, string]; count: number }[]`
  - `formatScanReport(result: { areas: readonly AreaSummary[]; files: readonly SourceFileMetrics[]; tests: readonly TestFileMetrics[]; coChanges: readonly { files: [string, string]; count: number }[] }): string`
  - CLI command `node scripts/scan-module-design.mjs [--json]` and npm script `scan:module-design`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file differs from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**

- Change any file outside `Files`.
- Delete, skip, or weaken any test or check.
- Add an external npm dependency.
- Add a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Write the failing unit test file**

Create `tests/scan-module-design.test.mjs` with this exact content:

```js
/**
 * Tests: scripts/scan-module-design.mjs area classification, TypeScript AST metrics, testware signals, co-change filtering, and Markdown report formatting.
 * Environment: pure in-memory source strings and commit arrays parsed with the real TypeScript compiler API (no mocked parser or disk I/O).
 * Fail-first proof: Step 2 runs this file before scripts/scan-module-design.mjs exists and fails with ERR_MODULE_NOT_FOUND.
 * Run: node --test --test-reporter=tap tests/scan-module-design.test.mjs
 * Expected values source: docs/build/refactor/module-design/README.md (Divide-and-conquer method) and docs/build/refactor/module-design/plan/task-01-quantitative-scan-script.md.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  AREA_ORDER,
  analyzeSourceFile,
  analyzeTestFile,
  classifyArea,
  computeCoChangePairs,
  formatScanReport,
} from '../scripts/scan-module-design.mjs'

test('classifyArea maps all 14 production areas and excludes build, test, and script paths', () => {
  assert.equal(AREA_ORDER.length, 14)
  assert.equal(classifyArea('apps/web/src/browser/boot.ts'), 'apps/web/src/browser/')
  assert.equal(classifyArea('apps/web/src/features/deck/deck-workflow.ts'), 'apps/web/src/features/')
  assert.equal(classifyArea('apps/web/src/integrations/opencode/runtime.ts'), 'apps/web/src/integrations/')
  assert.equal(classifyArea('apps/web/src/index.ts'), 'apps/web/src/')
  assert.equal(classifyArea('packages/presentation/deck/src/index.ts'), 'packages/presentation/deck/')
  assert.equal(classifyArea('packages/session/persistence/src/index.ts'), 'packages/session/persistence/')
  assert.equal(classifyArea('packages/host/api/src/index.ts'), 'packages/host/api/')
  assert.equal(classifyArea('packages/host/contracts/src/validation.ts'), 'packages/host/contracts/')
  assert.equal(classifyArea('packages/tools/filesystem/src/index.ts'), 'packages/tools/filesystem/')
  assert.equal(classifyArea('packages/presentation/html/src/index.ts'), 'packages/presentation/html/')
  assert.equal(classifyArea('packages/workspace/registry/src/index.ts'), 'packages/workspace/registry/')
  assert.equal(classifyArea('packages/presentation/design/src/index.ts'), 'packages/presentation/design/')
  assert.equal(classifyArea('packages/presentation/document/src/index.ts'), 'packages/presentation/document/')
  assert.equal(classifyArea('packages/presentation/pptx/src/index.ts'), 'packages/presentation/pptx/')
  assert.equal(classifyArea('apps/web/lib/index.js'), null)
  assert.equal(classifyArea('apps/web/tests/web-session.test.mjs'), null)
  assert.equal(classifyArea('packages/host/api/tests/host-api.test.mjs'), null)
  assert.equal(classifyArea('e2e/portable-generation-http.test.mjs'), null)
  assert.equal(classifyArea('scripts/check-boundaries.mjs'), null)
})

test('analyzeSourceFile counts non-as-const assertions, exports, Service symbols, and functions over 80 lines', () => {
  const filler = Array.from({ length: 82 }, (_, index) => `  const v${index} = ${index}`).join('\n')
  const source = [
    '// comment with value as string and class FakeService {}',
    'const text = "value as number"',
    'export const MODES = ["a", "b"] as const',
    'export const parsed = JSON.parse("{}") as Record<string, unknown>',
    'export class DeckService {',
    '  run(input: unknown) {',
    filler,
    '    return input as string',
    '  }',
    '}',
    'const helper = () => 1',
    'export { helper }',
  ].join('\n')

  const result = analyzeSourceFile('packages/presentation/deck/src/sample.ts', source)
  assert.equal(result.area, 'packages/presentation/deck/')
  assert.equal(result.isBarrel, false)
  assert.equal(result.exportCount, 4)
  assert.equal(result.typeAssertions.length, 2)
  assert.deepEqual(
    result.typeAssertions.map(item => item.line),
    [4, 89],
  )
  assert.deepEqual(result.serviceSymbols, [{ name: 'DeckService', line: 5 }])
  assert.equal(result.longFunctions.length, 1)
  assert.equal(result.longFunctions[0].name, 'DeckService.run')
  assert.equal(result.longFunctions[0].line, 6)
  assert.equal(result.longFunctions[0].lines, 85)
})

test('analyzeSourceFile separates re-export barrel files from non-barrel small files', () => {
  const barrel = [
    "export { startHost } from './host.ts'",
    "export type { HostOptions } from './types.ts'",
    "export * from './events.ts'",
  ].join('\n')
  const wrapper = "export const decode = (value: unknown) => value\n"

  const barrelResult = analyzeSourceFile('apps/web/src/features/deck/index.ts', barrel)
  const wrapperResult = analyzeSourceFile('apps/web/src/browser/transport/bound-outline-decoder.ts', wrapper)

  assert.equal(barrelResult.isBarrel, true)
  assert.equal(barrelResult.lines, 3)
  assert.equal(wrapperResult.isBarrel, false)
  assert.equal(wrapperResult.lines, 1)
})

test('analyzeTestFile detects missing top headers, fixed setTimeout calls, and scripts/lib imports', () => {
  const withHeader = [
    '/** Tests: sample behavior. */',
    "import { browserSession } from '../scripts/lib/browser-session.mjs'",
    '// setTimeout(() => {}, 500) in comment must not count',
    'const wait = () => new Promise(resolve => setTimeout(resolve, 100))',
  ].join('\n')
  const withoutHeader = "import assert from 'node:assert/strict'\nassert.equal(1, 1)\n"

  const first = analyzeTestFile('e2e/sample.test.mjs', withHeader)
  const second = analyzeTestFile('apps/web/tests/sample.test.mjs', withoutHeader)

  assert.equal(first.group, 'e2e/')
  assert.equal(first.hasTopHeader, true)
  assert.deepEqual(first.fixedTimeouts, [4])
  assert.deepEqual(first.scriptsLibImports, ['../scripts/lib/browser-session.mjs'])

  assert.equal(second.group, 'apps/web/tests/')
  assert.equal(second.hasTopHeader, false)
  assert.deepEqual(second.fixedTimeouts, [])
  assert.deepEqual(second.scriptsLibImports, [])
})

test('computeCoChangePairs excludes commits over maxFilesPerCommit and sorts deterministically', () => {
  const bulkCommit = Array.from({ length: 21 }, (_, index) => `apps/web/src/file-${index}.ts`)
  const commits = [
    bulkCommit,
    bulkCommit,
    bulkCommit,
    ['apps/web/src/a.ts', 'apps/web/src/b.ts', 'apps/web/src/c.ts'],
    ['apps/web/src/b.ts', 'apps/web/src/a.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/b.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/c.ts'],
  ]

  const pairs = computeCoChangePairs(commits, { maxFilesPerCommit: 20, minCount: 3 })
  assert.deepEqual(pairs, [{ files: ['apps/web/src/a.ts', 'apps/web/src/b.ts'], count: 3 }])
})

test('formatScanReport outputs deterministic Markdown tables for areas, testware, and co-changes', () => {
  const report = formatScanReport({
    areas: [
      {
        area: 'packages/presentation/deck/',
        files: 2,
        lines: 520,
        filesOver400: 1,
        functionsOver80: 1,
        smallNonBarrelFiles: 0,
        typeAssertions: 2,
        serviceSymbols: 1,
        maxExports: 16,
      },
    ],
    files: [
      {
        path: 'packages/presentation/deck/src/index.ts',
        area: 'packages/presentation/deck/',
        lines: 500,
        isBarrel: false,
        exportCount: 16,
        longFunctions: [{ name: 'DeckService.run', line: 10, lines: 90 }],
        typeAssertions: [{ line: 20, text: 'x as string' }],
        serviceSymbols: [{ name: 'DeckService', line: 5 }],
      },
    ],
    tests: [
      {
        path: 'e2e/sample.test.mjs',
        group: 'e2e/',
        lines: 40,
        hasTopHeader: false,
        fixedTimeouts: [12],
        scriptsLibImports: ['../scripts/lib/browser-session.mjs'],
      },
    ],
    coChanges: [{ files: ['apps/web/src/a.ts', 'apps/web/src/b.ts'], count: 4 }],
  })

  assert.equal(report.includes('# Module Design Quantitative Scan'), true)
  assert.equal(report.includes('packages/presentation/deck/'), true)
  assert.equal(report.includes('DeckService.run'), true)
  assert.equal(report.includes('e2e/sample.test.mjs'), true)
  assert.equal(report.includes('apps/web/src/a.ts <-> apps/web/src/b.ts'), true)
})
```

- [x] **Step 2: Run the unit test and check that it fails**

Run: `node --test --test-reporter=tap tests/scan-module-design.test.mjs`
Expected: FAIL. The command exits with a non-zero code and the output contains `ERR_MODULE_NOT_FOUND`.

- [x] **Step 3: Implement `scripts/scan-module-design.mjs` and register the npm script**

Create `scripts/scan-module-design.mjs` implementing all exported functions from `Interfaces`:

- `classifyArea(relativePath)`: normalize `\\` to `/`. Return `null` unless the file ends with `.ts` or `.tsx` and contains no `/lib/`, `/tests/`, or `/node_modules/` segment. Match prefixes in order: `apps/web/src/browser/`, `apps/web/src/features/`, `apps/web/src/integrations/`, then `apps/web/src/` for root files under `apps/web/src/`, and the 10 package prefixes under `packages/`.
- `analyzeSourceFile(relativePath, sourceText)`:
  - Parse with `ts.createSourceFile(relativePath, sourceText, ts.ScriptTarget.Latest, true)`.
  - Count lines by splitting normalized `\n` lines (`sourceText === '' ? 0 : normalized.replace(/\n$/, '').split('\n').length`).
  - Set `isBarrel = sourceFile.statements.length > 0 && sourceFile.statements.every(statement => ts.isExportDeclaration(statement) && statement.moduleSpecifier !== undefined)`.
  - Count exported symbols from `export` modifiers on classes, interfaces, type aliases, enums, functions, and variable declarations (count each binding in `export const a = 1, b = 2`). Add each element in `export { a, b }` and add 1 for `export default` or `export *`.
  - Collect functions over 80 lines (`endLine - startLine + 1 > 80`) across `FunctionDeclaration`, `MethodDeclaration`, `FunctionExpression`, and `ArrowFunction`. Name methods as `ClassName.methodName`, variable-bound functions as the variable name, and anonymous functions as `<anonymous>`.
  - Collect `ts.isAsExpression` (excluding `ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName) && node.type.typeName.text === 'const'`) and `ts.isTypeAssertionExpression`.
  - Collect declarations (`ClassDeclaration`, `InterfaceDeclaration`, `TypeAliasDeclaration`, `FunctionDeclaration`, `VariableDeclaration`) whose identifier name ends with `Service`.
- `analyzeTestFile(relativePath, sourceText)`:
  - Set `group` to `e2e/`, `apps/web/tests/`, `tests/`, or `packages/**/tests/` (matching `packages/<g>/<p>/tests/`).
  - Set `hasTopHeader` to `true` when the first non-empty trimmed line starts with `//` or `/*`.
  - Parse with `ts.createSourceFile` to collect line numbers of `setTimeout(...)` call expressions (ignoring comments and strings) and import/export string specifiers containing `scripts/lib/`.
- `computeCoChangePairs(commits, { maxFilesPerCommit = 20, minCount = 3 } = {})`:
  - Deduplicate each commit's file list, skip commits with `length < 2` or `length > maxFilesPerCommit`, count unordered sorted `[a, b]` pairs, filter `count >= minCount`, and sort by `count` descending then `files[0]` ascending then `files[1]` ascending.
- `formatScanReport(result)`: return deterministic Markdown starting with `# Module Design Quantitative Scan`. Include the area table, files over 400 lines, functions over 80 lines, and non-barrel files under 30 lines. Also include wide-export files (`exportCount >= 10`), `*Service` symbols, the testware summary, and co-change clusters.
- CLI entrypoint (guarded with `import.meta.url === pathToFileURL(process.argv[1]).href`): list files with `git ls-files --cached --others --exclude-standard`. Read 200 non-merge commits with `git log --no-merges -n 200 --name-only --pretty=format:---COMMIT---`. Filter commit paths to classified production files and print JSON for `--json` or Markdown otherwise.

Edit `package.json` (lines 24-43) to add `"scan:module-design": "node scripts/scan-module-design.mjs"` next to `"check:boundaries:report"`.

- [x] **Step 4: Run the unit tests and check that they pass**

Run: `node --test --test-reporter=tap tests/scan-module-design.test.mjs`
Expected: PASS. The command exits with code 0 and prints `# fail 0`.

- [x] **Step 5: Run lint, boundary checks, and a live CLI smoke run**

Run each command separately:

1. `corepack pnpm@11.28.5 lint`
2. `corepack pnpm@11.28.5 check:boundaries`
3. `corepack pnpm@11.28.5 scan:module-design --json | node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(0,'utf8')); console.log('areas:', data.areas.length, 'files:', data.files.length, 'tests:', data.tests.length)"`

Expected:
- Command 1 exits with code 0 and prints `Found 0 warnings and 0 errors.`.
- Command 2 exits with code 0 and prints `check-boundaries: 0 violation(s)`.
- Command 3 exits with code 0 and prints `areas: 14` with non-zero `files` and `tests` counts.

- [x] **Step 6: Report and stop**

Send this report:
- Files changed: list exact paths created and edited
- Commands run, with exit codes and the last 20 lines of output of each command
- Items that a decision table sent to the report: `None`
- What the commands do not prove: the unit tests check AST extraction on synthetic inputs and do not approve the final 14-area triage classification
