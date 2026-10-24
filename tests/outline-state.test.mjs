import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { DeckService } from '../packages/presentation/deck/lib/index.js'

const draft = { overview: 'A two-slide proposal', slides: [
  { title: 'Introduction', content: 'Explain the purpose. Audience: students. No figures are claimed.' },
  { title: 'Conclusion', content: 'Summarize the argument and disclose assumptions.' },
] }

test('migration preserves a TASK-005 v1 published deck and enables independent outline workflows', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-migrate-'))
  const path = join(dir, 'decks.sqlite')
  const legacy = new DatabaseSync(path)
  legacy.exec(await readFile(new URL('./fixtures/deck-v1.sql', import.meta.url), 'utf8'))
  legacy.close()
  const decks = new DeckService(path)
  t.after(async () => { decks.close(); await rm(dir, { recursive: true, force: true }) })
  assert.equal(decks.snapshot('legacy').version, 2)
  assert.equal(decks.content('legacy', 'intro', 1).html, '<h1>Legacy content</h1>')
  assert.deepEqual(decks.outlineSnapshot('legacy').proposals, [])
  assert.throws(() => decks.proposeOutline('legacy', { requestId: 'bad', responseIndex: 1, draft }), { code: 'OUTLINE_READ_ONLY' })
  const proposal = decks.proposeOutline('new', { requestId: 'new-request', responseIndex: 1, draft })
  decks.confirmOutline('new', proposal)
  assert.equal(decks.snapshot('new').slides.length, 2)
  assert.equal(decks.content('legacy', 'intro', 1).html, '<h1>Legacy content</h1>')
})

test('only the current outline can be confirmed; publication follows its stable identities and survives restart', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-outline-'))
  let decks = new DeckService(join(dir, 'decks.sqlite'))
  t.after(async () => { decks.close(); await rm(dir, { recursive: true, force: true }) })
  const first = decks.proposeOutline('chat', { requestId: 'request-1', responseIndex: 2, draft })
  assert.equal(decks.snapshot('chat').outlineId, null)
  assert.throws(() => decks.publish('chat', { outlineId: first.outlineId, slideId: first.slides[0].slideId,
    publicationId: 'early', expectedRevision: 0, html: '<h1>Too early</h1>' }), { code: 'DECK_NOT_CONFIRMED' })
  const second = decks.proposeOutline('chat', { requestId: 'request-2', responseIndex: 5,
    draft: { ...draft, overview: 'Revised proposal' } })
  assert.throws(() => decks.confirmOutline('chat', first), { code: 'OUTLINE_STALE' })
  assert.throws(() => decks.confirmOutline('other', second), { code: 'OUTLINE_STALE' })
  decks.confirmOutline('chat', second)
  const state = decks.outlineSnapshot('chat')
  assert.equal(state.confirmedId, second.outlineId)
  assert.deepEqual(state.proposals.map(p => p.status), ['superseded', 'confirmed'])
  assert.deepEqual(decks.snapshot('chat').slides.map(s => s.slideId), second.slides.map(s => s.slideId))
  assert.throws(() => decks.proposeOutline('chat', { requestId: 'request-3', responseIndex: 8, draft }), { code: 'OUTLINE_READ_ONLY' })
  assert.throws(() => decks.confirmOutline('chat', second), { code: 'OUTLINE_ALREADY_CONFIRMED' })
  decks.close()
  decks = new DeckService(join(dir, 'decks.sqlite'))
  assert.deepEqual(decks.outlineSnapshot('chat'), state)
  assert.equal(decks.publish('chat', { outlineId: second.outlineId, slideId: second.slides[0].slideId,
    publicationId: 'allowed', expectedRevision: 0, html: '<h1>Confirmed</h1>' }).revision, 1)
})

test('cancel keeps the proposal, invalid content changes nothing, and a new request creates a new current outline', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-outline-cancel-'))
  const decks = new DeckService(join(dir, 'decks.sqlite'))
  t.after(async () => { decks.close(); await rm(dir, { recursive: true, force: true }) })
  decks.beginOutline('chat')
  const initial = decks.outlineSnapshot('chat')
  assert.equal(initial.active, true)
  for (const invalid of [ { ...draft, confirmed: true }, { overview: 'Missing slides', slides: [] },
    { ...draft, slides: [{ title: 'Title only' }] }, { ...draft, slides: [{ title: 'Title', content: 'x'.repeat(8001) }] } ]) {
    assert.throws(() => decks.proposeOutline('chat', { requestId: 'bad', responseIndex: 0, draft: invalid }), { code: 'OUTLINE_INVALID' })
  }
  assert.deepEqual(decks.outlineSnapshot('chat'), initial)
  const first = decks.proposeOutline('chat', { requestId: 'first', responseIndex: 1, draft })
  decks.cancelOutline('chat', first)
  assert.equal(decks.outlineSnapshot('chat').currentId, null)
  assert.equal(decks.outlineSnapshot('chat').proposals[0].status, 'cancelled')
  assert.equal(decks.snapshot('chat').version, 0)
  assert.throws(() => decks.confirmOutline('chat', first), { code: 'OUTLINE_STALE' })
  const next = decks.proposeOutline('chat', { requestId: 'next', responseIndex: 3, draft })
  assert.notEqual(next.outlineId, first.outlineId)
  assert.equal(next.version, 3)
  assert.throws(() => decks.confirmOutline('chat', { ...next, version: 1 }), { code: 'OUTLINE_STALE' })
  assert.equal(decks.outlineSnapshot('chat').proposals[0].overview, first.overview)
})
