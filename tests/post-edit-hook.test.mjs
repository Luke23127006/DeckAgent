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
