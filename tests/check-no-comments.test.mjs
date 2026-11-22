import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findComments, isCommentTarget } from '../scripts/check-no-comments.mjs'

const kinds = (fileName, text) => findComments(fileName, text).map(comment => [comment.line, comment.kind])

test('finds a line comment', () => {
  assert.deepEqual(kinds('a.ts', 'const a = 1 // note\n'), [[1, 'line']])
})

test('finds JSDoc', () => {
  assert.deepEqual(kinds('a.ts', '/** doc */\nexport const a = 1\n'), [[1, 'block']])
})

test('finds a type-check directive', () => {
  assert.deepEqual(kinds('a.ts', '// @ts-expect-error\nconst a: number = 1\n'), [[1, 'line']])
})

test('finds a comment at the end of the file', () => {
  assert.deepEqual(kinds('a.mjs', 'const a = 1\n// end\n'), [[2, 'line']])
})

test('ignores the shebang line', () => {
  assert.deepEqual(kinds('a.mjs', '#!/usr/bin/env node\nconst a = 1\n'), [])
})

test('ignores comment markers in strings and regular expressions', () => {
  const text = [
    "const url = 'https://example.com'",
    'const pattern = /a\\/\\//',
    'const note = `// not a comment ${url}`',
    'const block = "/* not a comment */"',
    '',
  ].join('\n')
  assert.deepEqual(kinds('a.ts', text), [])
})

test('finds a comment inside JSX', () => {
  assert.deepEqual(kinds('a.tsx', 'const e = <div>{/* x */}</div>\n'), [[1, 'block']])
})

test('finds a comment in a JSON config file', () => {
  assert.deepEqual(kinds('tsconfig.json', '{\n  // x\n  "a": 1\n}\n'), [[2, 'line']])
})

test('isCommentTarget selects the files in scope', () => {
  assert.equal(isCommentTarget('packages/presentation/deck/src/index.ts'), true)
  assert.equal(isCommentTarget('apps/local-web/src/cli.ts'), true)
  assert.equal(isCommentTarget('scripts/build-workspace.mjs'), true)
  assert.equal(isCommentTarget('tests/research.test.mjs'), true)
  assert.equal(isCommentTarget('tsconfig.base.json'), true)
  assert.equal(isCommentTarget('packages/host/api/tsconfig.json'), true)
  assert.equal(isCommentTarget('apps/local-web/lib/cli.js'), false)
  assert.equal(isCommentTarget('packages/x/dist/index.js'), false)
  assert.equal(isCommentTarget('docs/00-old/research/a.mjs'), false)
  assert.equal(isCommentTarget('package.json'), false)
  assert.equal(isCommentTarget('README.md'), false)
})
