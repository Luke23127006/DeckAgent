# Task 4: Comment scanner

Read this file to learn the steps of Task 4, which adds the comment scanner.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- [Comment scope](README.md#comment-scope) in `README.md`.
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Create: `scripts/check-no-comments.mjs`
- Create: `tests/check-no-comments.test.mjs`
- Change: `package.json` (the `scripts` object)

**Interfaces:**
- Uses: the `typescript` package that `package.json` already lists.
- Produces, exported from `scripts/check-no-comments.mjs`:
  - `findComments(fileName: string, text: string): Array<{ line: number, kind: 'line' | 'block', text: string }>`
  - `isCommentTarget(relativePath: string): boolean`

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test.
- Delete or change a comment in an existing file. Task 4 only measures.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Write the failing tests**

Create `tests/check-no-comments.test.mjs` with this content:

```js
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
```

- [x] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/check-no-comments.test.mjs`
Expected: FAIL. The output contains `Cannot find module` or `ERR_MODULE_NOT_FOUND`.

- [x] **Step 3: Implement the exports in `scripts/check-no-comments.mjs`**

`isCommentTarget(path)` returns `true` when both conditions are true:

1. The path starts with `apps/`, `packages/`, `scripts/` or `tests/` and ends with `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs` or `.cjs`. Or the file name matches `^tsconfig[^/]*\.json$`.
2. The path does not contain `/lib/`, `/dist/` or `node_modules/`.

`findComments` uses the TypeScript compiler, not regular expressions, because only a parser can tell a comment from a string or a regular expression. Use this algorithm:

```js
import ts from 'typescript'

const scriptKindFor = fileName =>
  fileName.endsWith('.json') ? ts.ScriptKind.JSON
    : fileName.endsWith('.tsx') ? ts.ScriptKind.TSX
      : fileName.endsWith('.ts') || fileName.endsWith('.mts') || fileName.endsWith('.cts') ? ts.ScriptKind.TS
        : ts.ScriptKind.JS

export const findComments = (fileName, text) => {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKindFor(fileName))
  const ranges = new Map()
  const add = found => { for (const range of found ?? []) ranges.set(range.pos, range) }
  const visit = node => {
    add(ts.getLeadingCommentRanges(text, node.getFullStart()))
    add(ts.getTrailingCommentRanges(text, node.getEnd()))
    for (const child of node.getChildren(source)) visit(child)
  }
  visit(source)
  return [...ranges.values()]
    .sort((a, b) => a.pos - b.pos)
    .map(range => ({
      line: source.getLineAndCharacterOfPosition(range.pos).line + 1,
      kind: range.kind === ts.SyntaxKind.SingleLineCommentTrivia ? 'line' : 'block',
      text: text.slice(range.pos, range.end),
    }))
}
```

When the module runs as the main module:

1. Get the paths with `git ls-files --cached --others --exclude-standard`. Keep the paths that `isCommentTarget` accepts and that exist on disk.
2. Run `findComments` on each file.
3. With the argument `--report`, group the results. For paths in `apps/` and `packages/`, the group is the first two path parts, for example `packages/presentation`. For other paths, the group is the first path part. Print one line for each group: `<group>: <N> comment(s) in <M> file(s)`. Print the last line as `total: <N> comment(s) in <M> file(s)`. Exit with code 0.
4. Without `--report`: print each comment as `<path>:<line> <kind> Comments are not allowed. Put the meaning in a name, a type, a test or an ADR. See docs/conventions/code.md.` Print the last line as `total: <N> comment(s) in <M> file(s)`. Exit with code 1 when N is more than 0. Otherwise exit with code 0.

- [x] **Step 4: Run the tests and make sure that they pass**

Run: `node --test --test-reporter=tap tests/check-no-comments.test.mjs`
Expected: PASS. The output contains `# fail 0`.

- [x] **Step 5: Add the script to `package.json`**

In `package.json`, after the line `"check:docs": "node scripts/check-docs.mjs",`, add this line:

```json
    "check:comments": "node scripts/check-no-comments.mjs",
```

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" && echo valid`
Expected: the output is `valid`.

- [x] **Step 6: Measure the comments**

Run: `node scripts/check-no-comments.mjs --report; echo "exit=$?"`
Expected: the last two lines are `total: <N> comment(s) in <M> file(s)` and `exit=0`.

Run: `node -e "import('./scripts/check-no-comments.mjs').then(({findComments})=>{const fs=require('fs');const files=['scripts/check-docs.mjs','scripts/check-no-comments.mjs','scripts/hooks/post-edit.mjs','tests/check-docs.test.mjs','tests/post-edit-hook.test.mjs','tests/check-no-comments.test.mjs'];const n=files.reduce((s,f)=>s+findComments(f,fs.readFileSync(f,'utf8')).length,0);console.log('new files: '+n)})"`
Expected: the output is `new files: 0`.

- [x] **Step 7: Report and stop**

Send this report:
- Files changed.
- The output of Step 4 (last 20 lines) and the complete output of Step 6.
- What the commands do not prove: the scanner does not block edits yet. A later task adds it to the hook and to CI after other tasks delete the existing comments.
