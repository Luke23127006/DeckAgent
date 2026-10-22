import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DeckService } from '../packages/presentation/deck/lib/index.js'

const plan = {
  outlineId: 'outline-1',
  slides: [
    { slideId: 'intro', title: 'Introduction' },
    { slideId: 'end', title: 'Conclusion' },
  ],
}
const publication = {
  outlineId: 'outline-1',
  slideId: 'intro',
  expectedRevision: 0,
  publicationId: 'publish-1',
  html: '<h1>Introduction</h1>',
}

test('published content is immutable, ordered and durable; retry does not publish twice', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-deck-'))
  let decks = new DeckService(join(dir, 'decks.sqlite'))
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  assert.equal(decks.snapshot('chat').version, 0)
  decks.confirm('chat', plan)
  assert.deepEqual(
    decks.snapshot('chat').slides.map(s => s.status),
    ['pending', 'pending'],
  )
  const notices = []
  decks.subscribe('chat', event => {
    notices.push(event)
  })
  const first = decks.publish('chat', publication)
  assert.equal(first.revision, 1)
  assert.deepEqual(decks.publish('chat', publication), first)
  assert.equal(notices.length, 1)
  assert.equal(decks.content('chat', 'intro', 1).html, publication.html)
  assert.throws(() => decks.publish('chat', { ...publication, publicationId: 'stale' }), { code: 'DECK_CONFLICT' })
  decks.publish('chat', { ...publication, publicationId: 'publish-2', expectedRevision: 1, html: '<h1>Updated</h1>' })
  assert.equal(decks.content('chat', 'intro', 1).html, publication.html)
  decks.close()
  decks = new DeckService(join(dir, 'decks.sqlite'))
  const restored = decks.snapshot('chat')
  assert.equal(restored.version, 3)
  assert.deepEqual(
    restored.slides.map(s => [s.slideId, s.revision]),
    [
      ['intro', 2],
      ['end', 0],
    ],
  )
  assert.equal(decks.content('chat', 'intro', 2).html, '<h1>Updated</h1>')
  assert.deepEqual(decks.publish('chat', publication), first, 'retry survives restart')
  assert.throws(() => decks.publish('other-chat', publication), { code: 'DECK_NOT_CONFIRMED' })
  assert.throws(() => decks.content('other-chat', 'intro', 1), { code: 'DECK_CONTENT_NOT_FOUND' })
})

test('invalid identity, active HTML and cancelled publication leave the deck unchanged', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-reject-'))
  const decks = new DeckService(join(dir, 'decks.sqlite'))
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  decks.confirm('chat', plan)
  const original = decks.snapshot('chat')
  for (const html of [
    '<script>alert(1)</script>',
    '<iframe src="x"></iframe>',
    '<a href="https://example.com">go</a>',
    '<img src="https://example.com">',
    ' '.repeat(3),
    'x'.repeat(262145),
  ]) {
    assert.throws(() => decks.publish('chat', { ...publication, html }), { code: 'DECK_UNSAFE_HTML' })
  }
  assert.throws(() => decks.publish('chat', { ...publication, slideId: 'missing' }), { code: 'DECK_SLIDE_NOT_FOUND' })
  assert.throws(() => decks.publish('chat', { ...publication, outlineId: 'other' }), { code: 'DECK_OUTLINE_MISMATCH' })
  assert.throws(() => decks.publish('chat', publication, AbortSignal.abort()), { name: 'AbortError' })
  assert.deepEqual(decks.snapshot('chat'), original)
  decks.publish('chat', publication)
  assert.throws(() => decks.publish('chat', { ...publication, html: '<h1>Different</h1>' }), {
    code: 'DECK_PUBLICATION_CONFLICT',
  })
  assert.throws(() => decks.confirm('chat', { ...plan, outlineId: 'replacement' }), { code: 'DECK_PLAN_CONFLICT' })
})
