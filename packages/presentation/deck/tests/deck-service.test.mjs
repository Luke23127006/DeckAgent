import { brief } from './fixtures/brief.mjs'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DeckStore } from '../lib/index.js'
import { validateLegacySlideHtml } from '@deckagent/html-format'

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
  let decks = new DeckStore(join(dir, 'decks.sqlite'), { legacyHtmlPolicy: validateLegacySlideHtml })
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
  decks = new DeckStore(join(dir, 'decks.sqlite'), { legacyHtmlPolicy: validateLegacySlideHtml })
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
  const decks = new DeckStore(join(dir, 'decks.sqlite'), { legacyHtmlPolicy: validateLegacySlideHtml })
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

test('deck, brief and outline writes emit committed versions after commit and stay silent on replay or failure', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-notices-'))
  const events = []
  const visible = []
  let reader
  const observe = (topic, sessionId, version) => {
    events.push({ topic, sessionId, version })
    visible.push({ topic, sessionId, version: reader[`${topic}HeadVersion`](sessionId) })
    throw new Error('The transport observer failed.')
  }
  const decks = new DeckStore(join(dir, 'decks.sqlite'), {
    legacyHtmlPolicy: validateLegacySlideHtml,
    onDeckChanged: (sessionId, version) => observe('deck', sessionId, version),
    onBriefChanged: (sessionId, version) => observe('brief', sessionId, version),
    onOutlineChanged: (sessionId, version) => observe('outline', sessionId, version),
  })
  t.after(async () => {
    reader?.close()
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  reader = new DeckStore(join(dir, 'decks.sqlite'))
  assert.deepEqual(
    [decks.briefHeadVersion('chat'), decks.outlineHeadVersion('chat'), decks.deckHeadVersion('chat')],
    [0, 0, 0],
  )
  const saved = decks.saveBrief('chat', { expectedVersion: 0, draft: brief() })
  assert.throws(() => decks.saveBrief('chat', { expectedVersion: 0, draft: brief() }), { code: 'BRIEF_STALE' })
  const proposal = decks.proposeOutline('legacy', {
    requestId: 'req-1',
    responseIndex: 1,
    draft: { overview: 'Plan', slides: [{ title: 'One', content: 'Body' }] },
  })
  decks.confirmOutline('legacy', { outlineId: proposal.outlineId, version: proposal.version })
  decks.confirm('chat', plan)
  decks.confirm('chat', plan)
  assert.deepEqual(events, [
    { topic: 'brief', sessionId: 'chat', version: saved.version },
    { topic: 'outline', sessionId: 'legacy', version: 1 },
    { topic: 'outline', sessionId: 'legacy', version: 2 },
    { topic: 'deck', sessionId: 'legacy', version: 1 },
    { topic: 'deck', sessionId: 'chat', version: 1 },
  ])
  const higher = decks.proposeOutline('higher', {
    requestId: 'req-higher',
    responseIndex: 1,
    draft: { overview: 'Plan', slides: [{ title: 'One', content: 'Body' }] },
  })
  decks.confirm('higher', higher)
  decks.publish('higher', {
    outlineId: higher.outlineId,
    slideId: 'slide-1',
    expectedRevision: 0,
    publicationId: 'higher-publish',
    html: '<h1>One</h1>',
  })
  decks.confirmOutline('higher', higher)
  assert.deepEqual(events.slice(-5), [
    { topic: 'outline', sessionId: 'higher', version: 1 },
    { topic: 'deck', sessionId: 'higher', version: 1 },
    { topic: 'deck', sessionId: 'higher', version: 2 },
    { topic: 'outline', sessionId: 'higher', version: 2 },
    { topic: 'deck', sessionId: 'higher', version: 2 },
  ])
  assert.deepEqual(visible, events)
  assert.deepEqual(
    [decks.briefHeadVersion('chat'), decks.outlineHeadVersion('legacy'), decks.deckHeadVersion('chat')],
    [1, 2, 1],
  )
})

test('generation and Brief proposal replays do not emit notices', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-generation-notices-'))
  const events = []
  const decks = new DeckStore(join(dir, 'decks.sqlite'), {
    onBriefChanged: (sessionId, version) => events.push(['brief', sessionId, version]),
    onOutlineChanged: (sessionId, version) => events.push(['outline', sessionId, version]),
    onDeckChanged: (sessionId, version) => events.push(['deck', sessionId, version]),
  })
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  const draft = brief()
  draft.proposedSlideCount = 1
  draft.sources.modelKnowledge = true
  draft.purpose = 'Explain'
  draft.answers = [{ topic: 'images', value: 'No images' }]
  const input = {
    requestId: 'proposal-request',
    responseIndex: 1,
    expectedBriefVersion: 0,
    expectedOutline: null,
    draft,
    outline: {
      overview: 'Plan',
      revisionSuggestions: [],
      slides: [
        { title: 'Purpose', content: 'Explain', blocks: [{ kind: 'bullets', items: ['Purpose'] }], sources: [] },
      ],
    },
  }
  const record = decks.commitBriefProposal('chat', input)
  assert.deepEqual(decks.commitBriefProposal('chat', input), record)
  assert.throws(() => decks.commitBriefProposal('chat', { ...input, responseIndex: 2 }), {
    code: 'BRIEF_REQUEST_CONFLICT',
  })
  const proposal = decks.outlineSnapshot('chat').proposals[0]
  const target = {
    confirmationId: 'confirm',
    outlineId: proposal.outlineId,
    outlineVersion: 1,
    briefId: record.briefId,
    briefVersion: 1,
  }
  const selection = { provider: 'fixture', model: 'model' }
  const receipt = decks.confirmGeneration('chat', target, selection)
  assert.deepEqual(decks.confirmGeneration('chat', target, selection), receipt)
  decks.finishGeneration('chat', receipt.intentId, receipt.requestId, 'stopped')
  decks.finishGeneration('chat', receipt.intentId, receipt.requestId, 'stopped')
  assert.deepEqual(events, [
    ['brief', 'chat', 1],
    ['outline', 'chat', 1],
    ['outline', 'chat', 2],
    ['deck', 'chat', 1],
    ['deck', 'chat', 2],
  ])
})
