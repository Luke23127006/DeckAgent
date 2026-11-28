# Task 1: Add the layout rules

Read this file to learn the steps of Task 1, which adds `scripts/format-layout.mjs` with the functions `isLayoutTarget` and `formatLayout`, and their tests.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `scripts/scan-module-design.mjs` (how it imports `typescript` and creates a source file)
- `tests/scan-module-design.test.mjs` (the header comment)
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Create: `scripts/format-layout.mjs`
- Test: `tests/format-layout.test.mjs`

**Interfaces:**
- Produces: `export const isLayoutTarget = relativePath => boolean`. `relativePath` uses `/`. It returns `true` for a path that starts with `apps/`, `packages/`, `scripts/` or `tests/`, ends with `.ts`, `.tsx`, `.js`, `.mjs` or `.cjs`, does not end with `.d.ts`, and has no segment `node_modules`, `lib`, `dist` or `coverage`.
- Produces: `export const formatLayout = (filePath, sourceText) => ({ text, findings })`. `findings` is an array of `{ line, rule }`, sorted by `line`. `line` is the 1-based line of the original text before which a blank line is missing. `rule` is `layout-after-imports`, `layout-between-declarations` or `layout-between-members`. `text` is the source text with one blank line added before each finding line.

**STOP when:** Task protocol only

**Forbidden:** Do not add a dependency to a `package.json` file. Do not add a command-line entry point in this task.

- [x] **Step 1: Write the failing tests**

Create `tests/format-layout.test.mjs`. Start the file with a header comment that tells these items:

- The file tests the layout rules of `scripts/format-layout.mjs`.
- The environment is in-memory source text with the real TypeScript compiler API. The tests do not read or write files.
- The run command is `node --test --test-reporter=tap tests/format-layout.test.mjs`.
- The expected values come from `docs/build/refactor/code-layout/plan/README.md` (Decisions).

Then add:

```js
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatLayout, isLayoutTarget } from '../scripts/format-layout.mjs'

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
```

- [x] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/format-layout.test.mjs`
Expected: FAIL. The output contains `ERR_MODULE_NOT_FOUND`.

- [x] **Step 3: Implement `isLayoutTarget` and `formatLayout` in `scripts/format-layout.mjs`**

Implement the rules, the gap and the line endings of the Decisions in `README.md`. A line has a maximum of one finding. When `layout-after-imports` and `layout-between-declarations` find the same line, keep `layout-after-imports`. Use `ts.ScriptKind.TSX` for `.tsx`, `ts.ScriptKind.JS` for `.js`, `.mjs` and `.cjs`, and `ts.ScriptKind.TS` for `.ts`.

- [x] **Step 4: Run the tests and make sure that they pass**

Run: `corepack pnpm@11.28.5 exec biome format --write scripts/format-layout.mjs tests/format-layout.test.mjs`
Expected: exit code 0.

Run: `node --test --test-reporter=tap tests/format-layout.test.mjs`
Expected: `# fail 0`.

Run: `corepack pnpm@11.28.5 lint`
Expected: exit code 0.

- [x] **Step 5: Prove that the tests catch a fault**

Do each change, run `node --test --test-reporter=tap tests/format-layout.test.mjs`, and undo the change:

1. Remove the exception for overloads.
2. Measure the gap from `node.getStart()` and ignore the leading comment.
3. Always write `\n` as the line ending.

Expected: each change makes one or more tests fail. Add one line for each change to the header comment of `tests/format-layout.test.mjs`, in the list `Faults caught during mutant verification`.

- [x] **Step 6: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
