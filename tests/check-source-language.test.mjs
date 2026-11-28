/**
 * Tests: scripts/check-source-language.mjs, which finds Vietnamese text in the production source of apps and packages.
 * Environment: in-memory source text.
 * Run: node --test --test-reporter=tap tests/check-source-language.test.mjs
 * Expected values source: docs/conventions/code.md (the English source rule) and the Vietnamese strings that apps/web/src/text.ts and packages/presentation/deck/src/interview.ts had before the English rewrite.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkSourceLanguage, isSourceLanguageTarget, RULE } from '../scripts/check-source-language.mjs'

test('finds each line of a past Vietnamese UI string, a message and a comment', () => {
  const text = [
    "  loadingWorkspace: 'Đang mở không gian làm việc…',",
    "  ['topic', 'Bạn muốn trình bày chủ đề gì?', []],",
    '  /** ID đã cấp trước, ví dụ khi xác nhận deck. */',
    "  label: 'Ungrouped chats',",
  ].join('\n')
  assert.deepEqual(checkSourceLanguage(text), [
    { line: 1, rule: RULE },
    { line: 2, rule: RULE },
    { line: 3, rule: RULE },
  ])
})

test('finds a Vietnamese letter without a tone mark, such as đ or ư', () => {
  assert.equal(checkSourceLanguage("const a = 'đ'\nconst b = 'ư'").length, 2)
})

test('accepts English text with typographic symbols', () => {
  assert.deepEqual(checkSourceLanguage("const a = 'Workspace “A” · default — Saving…'\r\nconst b = '😀'"), [])
})

test('checks only the src folders of apps and packages', () => {
  assert.equal(isSourceLanguageTarget('apps/web/src/text.ts'), true)
  assert.equal(isSourceLanguageTarget('apps/web/src/styles/legacy.css'), true)
  assert.equal(isSourceLanguageTarget('packages/presentation/deck/src/interview.ts'), true)
  assert.equal(isSourceLanguageTarget('packages\\presentation\\deck\\src\\interview.ts'), true)
  assert.equal(isSourceLanguageTarget('apps/web/tests/deck-screens.test.tsx'), false)
  assert.equal(isSourceLanguageTarget('scripts/lib/layout-fixtures.mjs'), false)
  assert.equal(isSourceLanguageTarget('e2e/browser-smoke.test.mjs'), false)
  assert.equal(isSourceLanguageTarget('apps/web/src/logo.png'), false)
})
