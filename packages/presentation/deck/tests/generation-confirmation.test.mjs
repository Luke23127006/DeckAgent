import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckStore } from '../lib/index.js'
import { brief } from './fixtures/brief.mjs'

export function proposal(decks, sessionId = 'chat') {
  const draft = brief()
  draft.sources.modelKnowledge = true
  draft.proposedSlideCount = 1
  draft.purpose = 'Explain'
  draft.answers = [{ topic: 'images', value: 'No images' }]
  const b = decks.saveBrief(sessionId, { expectedVersion: 0, draft })
  const p = decks.proposeBoundOutline(sessionId, {
    requestId: `review-${sessionId}`,
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: b.briefId, version: 1 },
    draft: {
      overview: 'A short deck',
      revisionSuggestions: [],
      slides: [
        {
          title: 'Purpose',
          content: 'Explain the purpose',
          blocks: [{ kind: 'bullets', items: ['Explain the purpose'] }],
          sources: [],
        },
      ],
    },
  })
  return {
    confirmationId: 'confirmation-1',
    outlineId: p.outlineId,
    outlineVersion: p.version,
    briefId: b.briefId,
    briefVersion: b.version,
  }
}

test('confirmation creates one pending Deck and durable intent; start locks its exact snapshot even with zero slides published', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'generation-confirm-'))
  let active = true
  let decks = new DeckStore(join(dir, 'deck.sqlite'), { activeRequest: () => active })
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  const target = proposal(decks)
  const receipt = decks.confirmGeneration('chat', target, { provider: 'fixture', model: 'model' })
  assert.deepEqual(decks.confirmGeneration('chat', target, { provider: 'fixture', model: 'model' }), receipt)
  assert.equal(decks.snapshot('chat').slides.length, 1)
  assert.equal(decks.generation('chat').formatLocked, false)
  assert.throws(
    () => decks.confirmGeneration('chat', { ...target, briefVersion: 2 }, { provider: 'fixture', model: 'model' }),
    { code: 'CONFIRMATION_CONFLICT' },
  )
  decks.admitGeneration('chat', receipt.intentId, receipt.requestId)
  const grant = decks.startGeneration('chat', receipt.intentId, receipt.requestId)
  assert.equal(grant.requestId, receipt.requestId)
  assert.equal(decks.generation('chat').formatLocked, true)
  active = false
  decks.finishGeneration('chat', receipt.intentId, receipt.requestId, 'stopped')
  const saved = decks.generation('chat')
  assert.equal(saved.state, 'incomplete')
  assert.equal(saved.formatLocked, true)
  assert.equal(decks.snapshot('chat').slides[0].status, 'pending')
  decks.close()
  decks = new DeckStore(join(dir, 'deck.sqlite'), { activeRequest: () => active })
  assert.deepEqual(decks.generation('chat'), saved)
  assert.throws(() => decks.startGeneration('chat', receipt.intentId, receipt.requestId), {
    code: 'GENERATION_REQUEST_INACTIVE',
  })
})

test('unknown and stale targets never partially confirm a proposal or lock a Deck', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'confirmation-stale-'))
  const decks = new DeckStore(join(dir, 'deck.sqlite'))
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  const target = proposal(decks)
  assert.throws(
    () => decks.confirmGeneration('chat', { ...target, input: 'also revise' }, { provider: 'test', model: 'model' }),
    { code: 'CONFIRMATION_INVALID' },
  )
  assert.throws(() => decks.confirmGeneration('other', target, { provider: 'test', model: 'model' }), {
    code: 'OUTLINE_STALE',
  })
  decks.saveBrief('chat', {
    expectedVersion: 1,
    draft: { ...decks.briefSnapshot('chat').current.draft, audience: 'Teachers' },
  })
  assert.throws(() => decks.confirmGeneration('chat', target, { provider: 'test', model: 'model' }), {
    code: 'BRIEF_STALE',
  })
  assert.equal(decks.snapshot('chat').version, 0)
  assert.equal(decks.generation('chat'), null)
  assert.equal(decks.outlineSnapshot('chat').confirmedId, null)
})
