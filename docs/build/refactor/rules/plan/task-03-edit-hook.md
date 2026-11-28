# Task 3: Claude Code edit hook

Read this file to learn the steps of Task 3, which adds the Claude Code edit hook.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `scripts/check-docs.mjs` (exports only)
- `.claude/settings.json`
- `.agents/skills/tdd/SKILL.md`

**Files:**
- Create: `scripts/hooks/post-edit.mjs`
- Create: `tests/post-edit-hook.test.mjs`
- Change: `.claude/settings.json`

**Interfaces:**
- Uses: `isDocsTarget(relativePath: string): boolean` and `checkMarkdown(relativePath, text, io)` from `scripts/check-docs.mjs`.
- Produces: `runPostEdit(input: { tool_input?: { file_path?: string } }, options: { cwd: string }): { exitCode: 0 | 2, stderr: string }`, exported from `scripts/hooks/post-edit.mjs`.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Write the failing tests**

Create `tests/post-edit-hook.test.mjs` with this content:

```js
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
```

- [x] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/post-edit-hook.test.mjs`
Expected: FAIL. The output contains `Cannot find module` or `ERR_MODULE_NOT_FOUND`.

- [x] **Step 3: Implement `runPostEdit` in `scripts/hooks/post-edit.mjs`**

1. Get `file_path` from `input.tool_input`. If it is missing, return `{ exitCode: 0, stderr: '' }`.
2. Make the path relative to `options.cwd` with `path.relative`, then replace each `\` with `/`.
3. If `isDocsTarget(relativePath)` is `false`, return `{ exitCode: 0, stderr: '' }`.
4. If the file does not exist (`existsSync` returns `false`), return `{ exitCode: 0, stderr: '' }`. The hook checks content only. CI runs `check-docs` on all documents.
5. Read the file. Run `checkMarkdown` with `exists` and `readFile` that resolve paths from `options.cwd`.
6. If there are no failures, return `{ exitCode: 0, stderr: '' }`. Otherwise return `exitCode: 2` and `stderr` with one line for each failure: `<relativePath>:<line> <rule> <message>`.

When the module runs as the main module: read all of stdin, parse it as JSON, call `runPostEdit` with `cwd` set to `process.env.CLAUDE_PROJECT_DIR` when it exists, or `process.cwd()`. Write `stderr` to `process.stderr`. Exit with `exitCode`.

- [x] **Step 4: Run the tests and make sure that they pass**

Run: `node --test --test-reporter=tap tests/post-edit-hook.test.mjs`
Expected: PASS. The output contains `# fail 0`.

- [x] **Step 5: Register the hook**

Replace the complete content of `.claude/settings.json` with:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/scripts/hooks/post-edit.mjs\"",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

- [x] **Step 6: Run the hook by hand**

Run: `echo '{"tool_input":{"file_path":"docs/README.md"}}' | node scripts/hooks/post-edit.mjs; echo "exit=$?"`
Expected: the output is only `exit=0`.

Run: `echo '{"tool_input":{"file_path":"docs/missing-file.md"}}' | node scripts/hooks/post-edit.mjs; echo "exit=$?"`
Expected: the output is only `exit=0`.

- [x] **Step 7: Report and stop**

Send this report:
- Files changed.
- The output of Step 4 (last 20 lines) and Step 6.
- What the commands do not prove: the hook was not run by Claude Code. A person must edit one document in Claude Code and look at the failures that the hook shows.
