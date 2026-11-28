/**
 * Tests: the layout rules of scripts/format-layout.mjs, which selects the Biome file set and adds the blank lines between imports, top-level declarations and class members. The file also tests the dense body list and the command.
 * Environment: in-memory source text with the real TypeScript compiler API. The command test uses a temporary folder.
 * Run: node --test --test-reporter=tap tests/format-layout.test.mjs
 * Expected values source: docs/build/refactor/code-layout/plan/README.md (Decisions).
 * Faults caught during mutant verification:
 * - Removing the overload exception: 'formatLayout keeps one-line groups and overloads together' and 'formatLayout adds blank lines between class members' fail.
 * - Measuring the gap from node.getStart(): 'formatLayout adds the blank line before the leading comment' fails.
 * - Always writing \n as the line ending: 'formatLayout keeps CRLF line endings and a second run changes nothing' fails.
 * - Removing the blank-line check in listDenseBodies: 'listDenseBodies lists bodies with 6 statements, 12 lines and no blank line' fails.
 * - Making --check always exit with code 0: 'the command checks, writes and lists files in a folder' fails.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { formatLayout, isLayoutTarget, listDenseBodies } from '../scripts/format-layout.mjs'

const layout = source => formatLayout('apps/host/src/sample.ts', source)

test('isLayoutTarget accepts the Biome file set only', () => {
  assert.equal(isLayoutTarget('apps/host/src/a.ts'), true)
  assert.equal(isLayoutTarget('apps/web/src/a.tsx'), true)
  assert.equal(isLayoutTarget('scripts/a.mjs'), true)
  assert.equal(isLayoutTarget('tests/a.test.mjs'), true)
  assert.equal(isLayoutTarget('packages/presentation/deck/src/a.cjs'), true)
  assert.equal(isLayoutTarget('apps/host/src/a.d.ts'), false)
  assert.equal(isLayoutTarget('apps/host/lib/a.js'), false)
  assert.equal(isLayoutTarget('apps/web/dist/a.js'), false)
  assert.equal(isLayoutTarget('packages/x/node_modules/a.ts'), false)
  assert.equal(isLayoutTarget('e2e/a.test.mjs'), false)
  assert.equal(isLayoutTarget('docs/a.md'), false)
})

test('formatLayout adds a blank line after the imports', () => {
  const result = layout("import a from 'a'\nimport b from 'b'\nexport const c = a + b\n")
  assert.equal(result.text, "import a from 'a'\nimport b from 'b'\n\nexport const c = a + b\n")
  assert.deepEqual(result.findings, [{ line: 3, rule: 'layout-after-imports' }])
})

test('formatLayout adds blank lines around multi-line top-level declarations', () => {
  const source =
    'export interface A {\n  a: string\n}\ninterface B {\n  b: string\n}\nconst one = 1\nconst two = 2\nfunction f() {\n  return one + two\n}\n'
  const result = layout(source)
  assert.equal(
    result.text,
    'export interface A {\n  a: string\n}\n\ninterface B {\n  b: string\n}\n\nconst one = 1\nconst two = 2\n\nfunction f() {\n  return one + two\n}\n',
  )
  assert.deepEqual(result.findings, [
    { line: 4, rule: 'layout-between-declarations' },
    { line: 7, rule: 'layout-between-declarations' },
    { line: 9, rule: 'layout-between-declarations' },
  ])
})

test('formatLayout adds the blank line before the leading comment', () => {
  const result = layout('const a = 1\n/** Doc. */\nexport function f() {\n  return a\n}\n')
  assert.equal(result.text, 'const a = 1\n\n/** Doc. */\nexport function f() {\n  return a\n}\n')
  assert.deepEqual(result.findings, [{ line: 2, rule: 'layout-between-declarations' }])
})

test('formatLayout keeps one-line groups and overloads together', () => {
  const source =
    "export { a } from './a.ts'\nexport { b } from './b.ts'\nexport function f(a: string): string\nexport function f(a: number): number\nexport function f(a: unknown) {\n  return a\n}\n"
  assert.deepEqual(layout(source), { text: source, findings: [] })
})

test('formatLayout adds blank lines between class members', () => {
  const source = [
    'export class S {',
    '  private readonly a = 1',
    '  private readonly b = 2',
    '  constructor(',
    '    private readonly c: number,',
    '  ) {}',
    '  run(): number {',
    '    return this.a + this.b + this.c',
    '  }',
    '  stop(x: string): void',
    '  stop(x: number): void',
    '  stop(x: unknown): void {',
    '    void x',
    '  }',
    '}',
    '',
  ].join('\n')
  const result = layout(source)
  assert.deepEqual(result.findings, [
    { line: 4, rule: 'layout-between-members' },
    { line: 7, rule: 'layout-between-members' },
    { line: 10, rule: 'layout-between-members' },
  ])
  assert.equal(result.text.split('\n')[3], '')
  assert.equal(result.text.split('\n')[4], '  constructor(')
})

test('formatLayout checks a class expression inside a function', () => {
  const source = 'export function make() {\n  return class {\n    a = 1\n    run() {\n      return 1\n    }\n  }\n}\n'
  assert.deepEqual(layout(source).findings, [{ line: 4, rule: 'layout-between-members' }])
})

test('formatLayout keeps CRLF line endings and a second run changes nothing', () => {
  const result = layout('const a = 1\r\nfunction f() {\r\n  return a\r\n}\r\n')
  assert.equal(result.text, 'const a = 1\r\n\r\nfunction f() {\r\n  return a\r\n}\r\n')
  assert.deepEqual(layout(result.text), { text: result.text, findings: [] })
})

test('formatLayout accepts an existing blank line and statements on one line', () => {
  assert.deepEqual(layout('const a = 1\n\nfunction f() {\n  return a\n}\n').findings, [])
  assert.deepEqual(layout('const a = 1; function g() {\n  return a\n}\n').findings, [])
})

test('formatLayout parses TSX and keeps one finding for each line', () => {
  const source = "import { x } from 'x'\nexport function A() {\n  return <div>{x}</div>\n}\n"
  const result = formatLayout('apps/web/src/a.tsx', source)
  assert.deepEqual(result.findings, [{ line: 2, rule: 'layout-after-imports' }])
})

test('listDenseBodies lists bodies with 6 statements, 12 lines and no blank line', () => {
  const body = ['  const b = a + 1', '  const c = b + 1', '  if (c > 10) {', '    return c', '  }', '  const d = c * 2']
  body.push('  const e = d * 2', '  const f = e * 2', '  const g = f * 2', '  return g', '}')
  const short = ['function short(a: number) {', '  const b = a', '  const c = b', '  const d = c', '  const e = d']
  short.push('  const f = e', '  return f', '}')
  const source = [
    'export function dense(a: number) {',
    ...body,
    '',
    'export function spaced(a: number) {',
    ...body.slice(0, 5),
    '',
    ...body.slice(5),
    '',
    'export const denseArrow = (a: number) => {',
    ...body,
    '',
    ...short,
    '',
  ].join('\n')
  assert.deepEqual(listDenseBodies('apps/host/src/sample.ts', source), [
    { line: 1, name: 'dense', statements: 8 },
    { line: 28, name: 'denseArrow', statements: 8 },
  ])
})

test('the command checks, writes and lists files in a folder', () => {
  const root = mkdtempSync(join(tmpdir(), 'format-layout-'))
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'src', 'a.ts'), "import a from 'a'\nexport const b = a\n")
  const script = resolve('scripts/format-layout.mjs')
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' })

  const before = run('--check', 'src')
  assert.equal(before.status, 1)
  assert.equal(
    before.stdout,
    'src/a.ts:2 layout-after-imports Add one blank line before this line.\nformat-layout: 1 finding(s)\n',
  )

  const write = run('--write', 'src')
  assert.equal(write.status, 0)
  assert.equal(write.stdout, 'format-layout: 1 file(s) changed\n')
  assert.equal(readFileSync(join(root, 'src', 'a.ts'), 'utf8'), "import a from 'a'\n\nexport const b = a\n")

  assert.equal(run('--check', 'src').status, 0)
  assert.equal(run('--dense', 'src').stdout, 'format-layout: 0 dense function bodies\n')
  assert.equal(run('--fix').status, 2)
})
