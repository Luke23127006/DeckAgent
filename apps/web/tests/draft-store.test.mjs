/**
 * Tests volatile per-chat draft storage (FR-038): isolation per chat, 16,000-codepoint limit, and in-memory lifetime.
 * Environment: in-process Node test runner against the real MemoryDraftStore (no mocks or external services).
 * Run: `corepack pnpm@11.28.5 build && node --test apps/web/tests/draft-store.test.mjs` (also in `test:local-foundation`).
 * Expected results: literal values derived from FR-038 draft requirements and DraftError codes.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { MemoryDraftStore } from '../lib/types/draft-store.js'

test('drafts belong to one chat each, are capped, and live only in memory', () => {
  const drafts = new MemoryDraftStore()
  drafts.set('a', 'Draft A')
  drafts.set('b', 'Draft B')
  assert.equal(drafts.get('a'), 'Draft A')
  assert.equal(drafts.get('b'), 'Draft B')
  assert.equal(drafts.get('c'), '')
  drafts.set('a', '')
  assert.equal(drafts.get('a'), '')
  assert.equal(drafts.get('b'), 'Draft B')
  assert.equal(drafts.set('a', 'đ'.repeat(16000)).length, 16000)
  assert.throws(() => drafts.set('a', 'x'.repeat(16001)), { code: 'DRAFT_TOO_LARGE' })
  assert.equal(new MemoryDraftStore().get('b'), '', 'A new store, as after a restart, keeps no draft')
})
