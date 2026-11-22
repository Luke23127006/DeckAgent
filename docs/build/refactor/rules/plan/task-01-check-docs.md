# Task 1: Documentation check library and CLI

Read this file to learn the steps of Task 1, which adds the documentation check library and its CLI.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `docs/conventions/docs.md`
- `docs/conventions/README.md` (section `Ưu tiên chặn bằng máy`)
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Create: `scripts/check-docs.mjs`
- Create: `tests/check-docs.test.mjs`
- Change: `package.json` (the `scripts` object)

**Interfaces:**
- Uses: nothing from earlier tasks.
- Produces, all exported from `scripts/check-docs.mjs`:
  - `githubSlug(heading: string): string`
  - `isDocsTarget(relativePath: string): boolean`
  - `checkMarkdown(relativePath: string, text: string, io: { exists(relativePath: string): boolean, readFile(relativePath: string): string }): Array<{ line: number, rule: string, message: string }>`
  - `findUnlisted(relativePaths: string[], readFile: (relativePath: string) => string): Array<{ line: number, rule: string, message: string, path: string }>`

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

Create `tests/check-docs.test.mjs` with this content:

```js
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkMarkdown, findUnlisted, githubSlug, isDocsTarget } from '../scripts/check-docs.mjs'

const allExist = { exists: () => true, readFile: () => '# Target\n\nRead this file to learn the target.\n\n## Part\n' }
const noneExist = { exists: () => false, readFile: () => '' }
const rules = (text, io = allExist) => checkMarkdown('docs/a.md', text, io).map(error => error.rule)

const valid = [
  '# Title',
  '',
  'Đọc file này để biết điều A.',
  '',
  'Câu có nguồn [[1]](#ref-1).',
  '',
  '## References',
  '',
  '1. <a id="ref-1"></a>[Target](b.md)',
  '',
].join('\n')

test('accepts a valid document', () => {
  assert.deepEqual(rules(valid), [])
})

test('accepts CRLF line endings', () => {
  assert.deepEqual(rules(valid.replaceAll('\n', '\r\n')), [])
})

test('accepts an English purpose line', () => {
  assert.deepEqual(rules('# Title\n\nRead this file to learn the plan.\n'), [])
})

test('rejects a first line that is not a level-1 heading', () => {
  assert.deepEqual(rules('Text\n\nĐọc file này để biết A.\n'), ['h1-first-line'])
})

test('rejects a missing purpose line', () => {
  assert.deepEqual(rules('# Title\n\nSomething else.\n'), ['purpose-line'])
})

test('rejects a purpose line with two sentences', () => {
  assert.deepEqual(rules('# Title\n\nĐọc file này để biết A. Và B.\n'), ['purpose-line'])
})

test('rejects a citation with a location', () => {
  const text = valid.replace('[[1]](#ref-1)', '[[1, §2]](#ref-1)')
  assert.deepEqual(rules(text), ['citation-format'])
})

test('rejects a citation without a reference entry', () => {
  assert.deepEqual(rules('# Title\n\nĐọc file này để biết A.\n\nCâu [[1]](#ref-1).\n'), ['citation-undefined'])
})

test('rejects a reference entry without a citation', () => {
  const text = valid.replace('Câu có nguồn [[1]](#ref-1).', 'Câu không có nguồn.')
  assert.deepEqual(rules(text), ['reference-unused'])
})

test('rejects citation numbers out of order', () => {
  const text = [
    '# Title', '', 'Đọc file này để biết A.', '',
    'Câu [[2]](#ref-2) và [[1]](#ref-1).', '',
    '## References', '',
    '1. <a id="ref-1"></a>[A](a1.md)',
    '2. <a id="ref-2"></a>[B](b1.md)', '',
  ].join('\n')
  assert.deepEqual(rules(text), ['citation-order'])
})

test('rejects a section after References', () => {
  assert.deepEqual(rules(`${valid}\n## After\n`), ['references-last'])
})

test('rejects a link to a missing file', () => {
  assert.deepEqual(rules('# Title\n\nĐọc file này để biết A.\n\n[x](missing.md)\n', noneExist), ['link-file'])
})

test('rejects a link to a missing heading in the same file', () => {
  assert.deepEqual(rules('# Title\n\nĐọc file này để biết A.\n\n[x](#nope)\n'), ['link-anchor'])
})

test('accepts a link to a Vietnamese heading in the same file', () => {
  const text = '# Title\n\nĐọc file này để biết A.\n\n[x](#ngôn-ngữ-và-văn-phong)\n\n## Ngôn ngữ và văn phong\n'
  assert.deepEqual(rules(text), [])
})

test('accepts a link to a heading in another file', () => {
  assert.deepEqual(rules('# Title\n\nĐọc file này để biết A.\n\n[x](b.md#part)\n'), [])
})

test('rejects a link to a missing heading in another file', () => {
  assert.deepEqual(rules('# Title\n\nĐọc file này để biết A.\n\n[x](b.md#nope)\n'), ['link-anchor'])
})

test('ignores citations in code', () => {
  const text = '# Title\n\nĐọc file này để biết A.\n\n```markdown\n[[1, §2]](#ref-1)\n```\n\nVí dụ `[[1, x]]` trong câu.\n'
  assert.deepEqual(rules(text), [])
})

test('githubSlug keeps Vietnamese letters', () => {
  assert.equal(githubSlug('Ngôn ngữ và văn phong'), 'ngôn-ngữ-và-văn-phong')
  assert.equal(githubSlug('Resolved & Dropped'), 'resolved--dropped')
  assert.equal(githubSlug('ID'), 'id')
})

test('isDocsTarget selects the files in scope', () => {
  assert.equal(isDocsTarget('docs/a.md'), true)
  assert.equal(isDocsTarget('docs/build/refactor/rules/plan/task-01-check-docs.md'), true)
  assert.equal(isDocsTarget('AGENTS.md'), true)
  assert.equal(isDocsTarget('LESSONS.md'), true)
  assert.equal(isDocsTarget('docs/00-old/a.md'), false)
  assert.equal(isDocsTarget('README.md'), false)
  assert.equal(isDocsTarget('.agents/skills/tdd/SKILL.md'), false)
  assert.equal(isDocsTarget('docs/a.txt'), false)
})

test('findUnlisted reports a document that no README links to', () => {
  const files = ['docs/README.md', 'docs/a.md', 'docs/b.md', 'docs/sub/README.md', 'docs/sub/c.md']
  const contents = {
    'docs/README.md': '[A](a.md)\n',
    'docs/sub/README.md': '[C](c.md)\n',
  }
  const result = findUnlisted(files, path => contents[path] ?? '')
  assert.deepEqual(result.map(error => [error.path, error.rule]), [['docs/b.md', 'unlisted-file']])
})

test('findUnlisted uses the nearest README of an ancestor folder', () => {
  const files = ['docs/README.md', 'docs/build/x/plan.md']
  const result = findUnlisted(files, () => '[Plan](build/x/plan.md)\n')
  assert.deepEqual(result, [])
})
```

- [x] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/check-docs.test.mjs`
Expected: FAIL. The output contains `Cannot find module` or `ERR_MODULE_NOT_FOUND`.

- [x] **Step 3: Implement the four exports in `scripts/check-docs.mjs`**

Use these definitions:

- Before all other rules, replace `\r\n` with `\n`.
- The citation rules and the link rules read a copy of the text. In this copy, replace each character of a fenced code block with a space, but keep each `\n`. A fenced code block starts at a line that starts with three backticks and ends at the next such line. Do the same for inline code (text between single backticks). The line numbers stay the same.
- `githubSlug(heading)`: convert to lower case, delete each character that does not match `[\p{L}\p{M}\p{N}\s_-]` (flag `u`), then replace each space with `-`. Do not merge hyphens.
- `isDocsTarget(path)`: `true` for `AGENTS.md`, `LESSONS.md`, and each path that starts with `docs/`, ends with `.md`, and does not start with `docs/00-old/`. `false` for all other paths.

`checkMarkdown` returns one entry for each failure. Each rule has one exact message:

| Rule | When | Message |
| --- | --- | --- |
| `h1-first-line` | Line 1 does not start with `# ` | `Line 1 must be a level-1 heading ("# Title"). See docs/conventions/docs.md#cấu-trúc-file.` |
| `purpose-line` | The first non-empty line after line 1 does not match `^(Đọc file này (để biết|để|giúp)|Read this file to) .+\.$`, or it matches `\.\s+\S` | `The first line after the heading must be one sentence that starts with "Đọc file này để biết" or "Read this file to". See docs/conventions/docs.md#cấu-trúc-file.` |
| `citation-format` | Text matches `\[\[[^\]]*\]\]` and the match is not `[[n]](#ref-n)` with the same digits `n` two times | `Write a citation as [[n]](#ref-n), with the number only. See docs/conventions/docs.md#trích-dẫn-nguồn.` |
| `citation-undefined` | A citation `n` has no line that matches `^n\. <a id="ref-n"></a>` | `Citation [[n]] has no entry in "## References". Add the entry.` |
| `reference-unused` | A reference entry `n` has no citation | `Reference n has no citation in the text. Cite it or remove it.` |
| `citation-order` | The numbers, in the order of their first citation, are not 1, 2, 3 and so on | `Number the citations 1, 2, 3 in the order of their first use.` |
| `references-last` | A line that starts with `## ` comes after the line `## References` | `"## References" must be the last section.` |
| `link-file` | A relative link target (not `http:`, `https:`, `mailto:`) points to a path, resolved from the folder of the file, for which `io.exists` returns `false` | `Link target "<target>" does not exist.` |
| `link-anchor` | The anchor of a link is not the `githubSlug` of a heading in the target text, and not the value of an `<a id="...">` in the target text. For a link to another file, the target text is `io.readFile(resolvedPath)`. | `Link anchor "#<anchor>" does not exist in "<file>".` |

`findUnlisted(paths, readFile)` examines each path that obeys three conditions: `isDocsTarget` accepts it, it starts with `docs/`, and its file name is not `README.md`. For each such path, find the nearest `README.md` in the folder of the path or in a parent folder, up to `docs/`. Use only `README.md` paths that are in `paths`. Resolve each Markdown link target in the README from the folder of the README. If no README exists, or no resolved link target equals the path, return `{ path, line: 1, rule: 'unlisted-file', message: 'No README.md links to this file. Add a link in the nearest README.md.' }`.

When the module runs as the main module (`import.meta.url` equals `pathToFileURL(process.argv[1]).href`):

1. Get the paths with `git ls-files --cached --others --exclude-standard` (use `execFileSync` from `node:child_process`, split the output on `\n`). Keep the paths that `isDocsTarget` accepts. Do not use paths that do not exist on disk.
2. Run `checkMarkdown` on each path with `exists` from `node:fs` `existsSync` and `readFile` from `readFileSync(path, 'utf8')`. Run `findUnlisted` on all paths.
3. Print each failure as `<path>:<line> <rule> <message>`.
4. Print the last line as `check-docs: <N> error(s) in <M> file(s)`. Exit with code 1 when N is more than 0. Otherwise exit with code 0.

- [x] **Step 4: Run the tests and make sure that they pass**

Run: `node --test --test-reporter=tap tests/check-docs.test.mjs`
Expected: PASS. The output contains `# fail 0`.

- [x] **Step 5: Add the script to `package.json`**

In `package.json`, after the line `"format:check": "biome format",`, add this line:

```json
    "check:docs": "node scripts/check-docs.mjs",
```

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" && echo valid`
Expected: the output is `valid`.

- [x] **Step 6: Run the CLI on the repository**

Run: `node scripts/check-docs.mjs; echo "exit=$?"`
Expected: the last line before `exit=` starts with `check-docs:`. The command can fail on the current documents. Task 2 makes the documents obey the check. Copy the complete output into the report.

- [x] **Step 7: Report and stop**

Send this report:
- Files changed.
- The output of Step 4 (last 20 lines) and the complete output of Step 6.
- What the commands do not prove: the CLI was not tested on a real Claude Code edit.
