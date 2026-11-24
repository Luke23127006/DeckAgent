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
  analyzeSourceFile,
  analyzeTestFile,
  classifyArea,
  computeCoChangePairs,
  formatScanReport,
} from '../scripts/scan-module-design.mjs'

test('classifyArea maps all 14 production areas and excludes build, test, and script paths', () => {
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
  assert.equal(classifyArea('apps/web/lib/index.ts'), null)
  assert.equal(classifyArea('apps/web/src/lib/generated.ts'), null)
  assert.equal(classifyArea('apps/web/tests/helper.ts'), null)
  assert.equal(classifyArea('packages/host/api/tests/fixture.tsx'), null)
  assert.equal(classifyArea('packages/host/api/node_modules/pkg/index.ts'), null)
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
  const wrapper = 'export const decode = (value: unknown) => value\n'

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
    ['apps/web/src/b.ts', 'apps/web/src/c.ts'],
    ['apps/web/src/c.ts', 'apps/web/src/b.ts'],
    ['apps/web/src/b.ts', 'apps/web/src/c.ts'],
    ['apps/web/src/b.ts', 'apps/web/src/c.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/d.ts'],
    ['apps/web/src/d.ts', 'apps/web/src/a.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/d.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/b.ts'],
    ['apps/web/src/b.ts', 'apps/web/src/a.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/b.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/c.ts'],
  ]

  const pairs = computeCoChangePairs(commits, { maxFilesPerCommit: 20, minCount: 3 })
  assert.deepEqual(pairs, [
    { files: ['apps/web/src/b.ts', 'apps/web/src/c.ts'], count: 4 },
    { files: ['apps/web/src/a.ts', 'apps/web/src/b.ts'], count: 3 },
    { files: ['apps/web/src/a.ts', 'apps/web/src/d.ts'], count: 3 },
  ])
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

  const lines = report.split('\n')
  assert.equal(lines[0], '# Module Design Quantitative Scan')
  assert.equal(lines.includes('| packages/presentation/deck/ | 2 | 520 | 1 | 1 | 0 | 2 | 1 | 16 |'), true)
  assert.equal(lines.includes('| packages/presentation/deck/src/index.ts | packages/presentation/deck/ | 500 | 16 | 1 |'), true)
  assert.equal(lines.includes('| packages/presentation/deck/src/index.ts | 10 | DeckService.run | 90 |'), true)
  assert.equal(lines.includes('| packages/presentation/deck/src/index.ts | 5 | DeckService |'), true)
  assert.equal(lines.includes('| e2e/ | 1 | 40 | 1 | 1 | 1 |'), true)
  assert.equal(
    lines.includes('| e2e/sample.test.mjs | e2e/ | 40 | no | 12 | ../scripts/lib/browser-session.mjs |'),
    true,
  )
  assert.equal(lines.includes('| apps/web/src/a.ts <-> apps/web/src/b.ts | 4 |'), true)
})
