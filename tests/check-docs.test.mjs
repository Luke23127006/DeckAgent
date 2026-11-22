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
    '# Title',
    '',
    'Đọc file này để biết A.',
    '',
    'Câu [[2]](#ref-2) và [[1]](#ref-1).',
    '',
    '## References',
    '',
    '1. <a id="ref-1"></a>[A](a1.md)',
    '2. <a id="ref-2"></a>[B](b1.md)',
    '',
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
  const text =
    '# Title\n\nĐọc file này để biết A.\n\n```markdown\n[[1, §2]](#ref-1)\n```\n\nVí dụ `[[1, x]]` trong câu.\n'
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
  assert.deepEqual(
    result.map(error => [error.path, error.rule]),
    [['docs/b.md', 'unlisted-file']],
  )
})

test('findUnlisted uses the nearest README of an ancestor folder', () => {
  const files = ['docs/README.md', 'docs/build/x/plan.md']
  const result = findUnlisted(files, () => '[Plan](build/x/plan.md)\n')
  assert.deepEqual(result, [])
})

const questions = [
  '# Open Questions',
  '',
  'Đọc file này để biết A.',
  '',
  '| <a id="oq-002"></a>OQ-002 | Q |',
  '',
  '## Resolved & Dropped',
  '',
  '| <a id="oq-001"></a>OQ-001 | Q |',
  '',
].join('\n')
const questionsIo = { exists: () => true, readFile: () => questions }
const gapRules = row =>
  checkMarkdown('docs/UCs/a.md', `# Title\n\nĐọc file này để biết A.\n\n${row}\n`, questionsIo).map(error => error.rule)

test('rejects an Open gap that links a resolved question', () => {
  assert.deepEqual(gapRules('| GAP-01 | G | B | [Q](../open-questions.md#oq-001) | Open |'), ['open-gap-closed-question'])
})

test('accepts an Open gap that links an open question', () => {
  assert.deepEqual(gapRules('| GAP-01 | G | B | [Q](../open-questions.md#oq-002) | Open |'), [])
})
