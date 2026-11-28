import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { DeckStore } from '../lib/index.js'
import { proposal } from './generation-confirmation.test.mjs'

test('a new request continues an interrupted confirmed deck after restart without changing its confirmation or theme', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deck-continuation-'))
  let active = 'first'
  let decks = new DeckStore(join(dir, 'deck.sqlite'), { activeRequest: (_chat, id) => id === active })
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  const target = proposal(decks)
  const receipt = decks.confirmGeneration('chat', target, { provider: 'fixture', model: 'model' })
  active = receipt.requestId
  decks.admitGeneration('chat', receipt.intentId, active)
  decks.startGeneration('chat', receipt.intentId, active)
  decks.finishGeneration('chat', receipt.intentId, active, 'stopped')
  const original = decks.generation('chat')
  decks.close()
  // The original-attempt payload is also the v6 representation, without activeRequestId.
  const legacy = new DatabaseSync(join(dir, 'deck.sqlite'))
  legacy.exec('DROP TABLE prepared_images; DROP TABLE image_search_attempts; PRAGMA user_version=6')
  legacy.close()
  decks = new DeckStore(join(dir, 'deck.sqlite'), { activeRequest: (_chat, id) => id === active })
  const upgraded = new DatabaseSync(join(dir, 'deck.sqlite'))
  assert.equal(upgraded.prepare('PRAGMA user_version').get().user_version, 10)
  upgraded.close()
  assert.deepEqual(decks.generation('chat').receipt, receipt)
  assert.equal(decks.generation('chat').state, 'incomplete')
  active = 'request-continue'
  decks.continueGeneration('chat', active, { provider: 'fixture', model: 'model' })
  const grant = decks.startGeneration('chat', receipt.intentId, active)
  assert.equal(grant.requestId, active)
  assert.deepEqual(decks.generation('chat').receipt, receipt)
  assert.deepEqual(decks.generation('chat').design, original.design)
  assert.equal(decks.generation('chat').startedAt, original.startedAt)
  assert.equal(decks.outlineSnapshot('chat').confirmedId, target.outlineId)
  assert.deepEqual(decks.confirmGeneration('chat', target, original.selection), receipt)
})
