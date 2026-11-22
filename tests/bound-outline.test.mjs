import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { brief } from './fixtures/brief.mjs'

const plan = () => ({
  overview: 'An introduction and closing',
  revisionSuggestions: ['Add a worked example'],
  slides: [
    {
      title: 'Introduction',
      content: 'Explain the topic',
      blocks: [{ kind: 'bullets', items: ['Purpose'] }],
      sources: [],
    },
    {
      title: 'Closing',
      content: 'Summarize the topic',
      blocks: [{ kind: 'bullets', items: ['Takeaway'] }],
      sources: [],
    },
  ],
})

test('Brief/Outline request receipts are atomic and idempotent; invalid, foreign or stale content leaves no partial result', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'bound-atomic-'))
  const decks = new DeckService(join(dir, 'deck.sqlite'))
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  const draft = brief()
  draft.proposedSlideCount = 2
  draft.sources.modelKnowledge = true
  const input = {
    requestId: 'complete-1',
    responseIndex: 1,
    expectedBriefVersion: 0,
    expectedOutline: null,
    draft,
    outline: plan(),
  }
  const first = decks.commitBriefProposal('chat', input)
  const p = decks.outlineSnapshot('chat').proposals[0]
  assert.deepEqual(decks.commitBriefProposal('chat', input), first)
  assert.equal(decks.outlineSnapshot('chat').proposals.length, 1)
  assert.throws(() => decks.commitBriefProposal('chat', { ...input, responseIndex: 2 }), {
    code: 'BRIEF_REQUEST_CONFLICT',
  })
  assert.throws(() => decks.commitBriefProposal('other', input), { code: 'BRIEF_REQUEST_CONFLICT' })
  assert.throws(() => decks.cancelOutline('chat', p), { code: 'OUTLINE_CANCELLATION_UNAVAILABLE' })
  assert.throws(() => decks.confirmOutline('chat', p), { code: 'DECK_CONFIRMATION_REQUIRED' })
  for (const outline of [
    { ...plan(), slides: [] },
    { ...plan(), slides: [...plan().slides, plan().slides[0]] },
    { ...plan(), slides: [{ ...plan().slides[0], slideId: 'foreign-slide' }] },
    {
      ...plan(),
      slides: [
        {
          ...plan().slides[0],
          sources: [{ sourceId: 'src-00000000-0000-0000-0000-000000000001', version: 1, kind: 'attachment' }],
        },
      ],
    },
    { ...plan(), slides: [{ ...plan().slides[0], blocks: [{ kind: 'script', text: 'bad' }] }] },
  ]) {
    assert.throws(() =>
      decks.commitBriefProposal('chat', {
        ...input,
        requestId: 'invalid',
        expectedBriefVersion: 1,
        expectedOutline: p,
        outline,
      }),
    )
    assert.equal(decks.briefSnapshot('chat').version, 1)
    assert.equal(decks.outlineSnapshot('chat').proposals.length, 1)
  }
  assert.throws(
    () =>
      decks.proposeBoundOutline('other', {
        requestId: 'foreign',
        responseIndex: 1,
        expectedBrief: { briefId: first.briefId, version: 1 },
        expectedOutline: null,
        draft: plan(),
      }),
    { code: 'BRIEF_INCOMPLETE' },
  )
  assert.equal(decks.snapshot('chat').slides.length, 0)
})

test('bound Outline revisions preserve slide identity and exact Brief history across reorder and restart', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'bound-outline-'))
  let decks = new DeckService(join(dir, 'deck.sqlite'))
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  const initial = brief()
  initial.proposedSlideCount = 2
  initial.sources.modelKnowledge = true
  const b1 = decks.saveBrief('chat', { expectedVersion: 0, draft: initial })
  const target = b => ({ briefId: b.briefId, version: b.version })
  const first = decks.proposeBoundOutline('chat', {
    requestId: 'request-1',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: target(b1),
    draft: plan(),
  })
  assert.equal(first.brief.version, 1)
  assert.equal(decks.snapshot('chat').slides.length, 0)
  const b2 = decks.saveBrief('chat', { expectedVersion: 1, draft: { ...initial, audience: 'Teachers' } })
  const draft = plan()
  draft.slides = [
    { ...draft.slides[1], slideId: first.slides[1].slideId },
    { ...draft.slides[0], slideId: first.slides[0].slideId },
  ]
  const next = decks.proposeBoundOutline('chat', {
    requestId: 'request-2',
    responseIndex: 3,
    expectedOutline: first,
    expectedBrief: target(b2),
    draft,
  })
  assert.deepEqual(
    next.slides.map(s => s.slideId),
    first.slides.map(s => s.slideId).toReversed(),
  )
  assert.deepEqual(next.changes.briefFields, ['audience'])
  assert.equal(next.changes.orderChanged, true)
  assert.equal(first.brief.draft.audience, brief().audience)
  assert.throws(
    () =>
      decks.proposeBoundOutline('chat', {
        requestId: 'stale',
        responseIndex: 5,
        expectedOutline: first,
        expectedBrief: target(b2),
        draft,
      }),
    { code: 'OUTLINE_STALE' },
  )
  decks.close()
  decks = new DeckService(join(dir, 'deck.sqlite'))
  const saved = decks.outlineSnapshot('chat')
  assert.deepEqual(
    saved.proposals.map(p => p.status),
    ['superseded', 'current'],
  )
  assert.equal(saved.proposals[0].brief.version, 1)
  assert.deepEqual(saved.proposals[1].changes, next.changes)
})
