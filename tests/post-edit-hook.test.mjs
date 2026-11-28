/**
 * Tests: runPostEdit of scripts/hooks/post-edit.mjs, which runs check-docs on an edited document, and the layout rules of scripts/format-layout.mjs and the language rule of scripts/check-source-language.mjs on an edited source file.
 * Environment: a temporary folder with real files for each test.
 * Run: node --test --test-reporter=tap tests/post-edit-hook.test.mjs
 * Expected values source: docs/build/refactor/code-layout/plan/README.md (Decisions) and the rule IDs of scripts/check-docs.mjs.
 */
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { runPostEdit } from '../scripts/hooks/post-edit.mjs'

const workspace = () => {
  const root = mkdtempSync(join(tmpdir(), 'post-edit-'))
  mkdirSync(join(root, 'docs'))
  return root
}

test('blocks an edited document that fails check-docs', () => {
  const root = workspace()
  writeFileSync(join(root, 'docs', 'bad.md'), 'Text\n')
  const result = runPostEdit({ tool_input: { file_path: join(root, 'docs', 'bad.md') } }, { cwd: root })
  assert.equal(result.exitCode, 2)
  assert.match(result.stderr, /h1-first-line/)
})

test('accepts an edited document that passes check-docs', () => {
  const root = workspace()
  writeFileSync(join(root, 'docs', 'good.md'), '# Good\n\nRead this file to learn the good file.\n')
  const result = runPostEdit({ tool_input: { file_path: join(root, 'docs', 'good.md') } }, { cwd: root })
  assert.deepEqual(result, { exitCode: 0, stderr: '' })
})

test('ignores a file outside the check scope', () => {
  const root = workspace()
  const result = runPostEdit({ tool_input: { file_path: join(root, 'src', 'a.ts') } }, { cwd: root })
  assert.deepEqual(result, { exitCode: 0, stderr: '' })
})

test('ignores input without a file path', () => {
  assert.deepEqual(runPostEdit({}, { cwd: tmpdir() }), { exitCode: 0, stderr: '' })
})

test('ignores a file that does not exist', () => {
  const root = workspace()
  const result = runPostEdit({ tool_input: { file_path: join(root, 'docs', 'missing.md') } }, { cwd: root })
  assert.deepEqual(result, { exitCode: 0, stderr: '' })
})

const sourceFile = (root, content) => {
  mkdirSync(join(root, 'apps', 'host', 'src'), { recursive: true })
  const file = join(root, 'apps', 'host', 'src', 'a.ts')
  writeFileSync(file, content)
  return file
}

test('blocks an edited source file with a missing blank line', () => {
  const root = workspace()
  const file = sourceFile(root, "import a from 'a'\nexport const b = a\n")
  const result = runPostEdit({ tool_input: { file_path: file } }, { cwd: root })
  assert.equal(result.exitCode, 2)
  assert.equal(
    result.stderr,
    'apps/host/src/a.ts:2 layout-after-imports Add one blank line before this line. Run "node scripts/format-layout.mjs --write apps/host/src/a.ts".\n',
  )
})

test('accepts an edited source file with the expected blank lines', () => {
  const root = workspace()
  const file = sourceFile(root, "import a from 'a'\n\nexport const b = a\n")
  assert.deepEqual(runPostEdit({ tool_input: { file_path: file } }, { cwd: root }), { exitCode: 0, stderr: '' })
})

test('blocks an edited source file with Vietnamese text', () => {
  const root = workspace()
  const file = sourceFile(root, "export const a = 'Chưa lưu được tệp'\n")
  const result = runPostEdit({ tool_input: { file_path: file } }, { cwd: root })
  assert.equal(result.exitCode, 2)
  assert.match(result.stderr, /^apps\/host\/src\/a\.ts:1 source-language .*English/)
})

test('accepts Vietnamese sample data in a test file', () => {
  const root = workspace()
  mkdirSync(join(root, 'apps', 'host', 'tests'), { recursive: true })
  const file = join(root, 'apps', 'host', 'tests', 'a.test.mjs')
  writeFileSync(file, "export const a = 'Kế hoạch tái chế'\n")
  assert.deepEqual(runPostEdit({ tool_input: { file_path: file } }, { cwd: root }), { exitCode: 0, stderr: '' })
})

test('ignores a source file in a build output folder', () => {
  const root = workspace()
  mkdirSync(join(root, 'apps', 'host', 'lib'), { recursive: true })
  const file = join(root, 'apps', 'host', 'lib', 'a.js')
  writeFileSync(file, "import a from 'a'\nexport const b = a\n")
  assert.deepEqual(runPostEdit({ tool_input: { file_path: file } }, { cwd: root }), { exitCode: 0, stderr: '' })
})
