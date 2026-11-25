import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckStore } from '@deckagent/deck'
import { DeckClient } from '../apps/web/tests/fixtures/browser-driver.mjs'
import { startApp, MemoryCredentials, finished, waitFor } from '../apps/web/tests/fixtures/b02-helpers.mjs'
import { brief } from '../packages/presentation/deck/tests/fixtures/brief.mjs'

test('Stop at two of five, restart and explicitly continue publishes only missing slides on the same Deck', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'five-slide-continuation-'))
  const credentials = new MemoryCredentials()
  const options = {
    credentials,
    options: { providerAccess: { check: async () => {}, catalog: async () => ['model-a'] } },
  }
  let f = await startApp(dir, options)
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  await f.call('providers/test', 'PUT', {
    displayName: 'Fixture',
    protocol: 'chat-completions',
    baseUrl: 'http://127.0.0.1:1/v1',
    key: 'fixture',
    models: ['model-a'],
    new: true,
  })
  const id = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data.sessionId
  const decks = new DeckStore(join(dir, 'data', 'db', 'decks.sqlite'))
  const draft = {
    ...brief(),
    proposedSlideCount: 5,
    purpose: 'Explain',
    answers: [{ topic: 'images', value: 'None' }],
    sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
  }
  const b = decks.saveBrief(id, { expectedVersion: 0, draft })
  const outline = decks.proposeBoundOutline(id, {
    requestId: 'review',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: b.briefId, version: b.version },
    draft: {
      overview: 'Five slides',
      revisionSuggestions: [],
      slides: ['One', 'Two', 'Three', 'Four', 'Five'].map(title => ({
        title,
        content: 'Explain',
        blocks: [{ kind: 'bullets', items: ['Explain'] }],
        sources: [],
      })),
    },
  })
  decks.close()
  await writeFile(`${f.log}.generation.json`, JSON.stringify({ stopAfter: 2 }))
  const target = {
    confirmationId: 'five',
    outlineId: outline.outlineId,
    outlineVersion: outline.version,
    briefId: b.briefId,
    briefVersion: b.version,
  }
  const accepted = (await f.call(`sessions/${id}/deck/confirm`, 'POST', target)).data
  let client = new DeckClient(f.app.origin, f.app.token)
  await waitFor(async () => (await client.snapshot(id)).slides.filter(s => s.revision > 0).length === 2, 20000)
  await f.client.stop(accepted.request.requestId)
  await finished(f.client, accepted.request.requestId)
  assert.ok(
    (await f.client.history(id)).some(
      m => m.content.includes('2/5') && m.content.includes('chưa được kiểm tra để thống nhất'),
    ),
  )
  const before = await client.snapshot(id)
  const content = await Promise.all(before.slides.slice(0, 2).map(s => client.content(id, s.slideId, 1)))
  await f.app.close()
  await writeFile(`${f.log}.generation.json`, '{}')
  f = await startApp(dir, options)
  client = new DeckClient(f.app.origin, f.app.token)
  assert.equal((await client.snapshot(id)).generation.state, 'incomplete')
  const continued = await f.client.send({ sessionId: id, input: 'Continue the remaining slides', continueDeck: true })
  assert.notEqual(continued.requestId, accepted.request.requestId)
  const events = await finished(f.client, continued.requestId)
  assert.equal(events.at(-1).status, 'completed', JSON.stringify(events.at(-1)))
  const after = await client.snapshot(id)
  assert.equal(after.deckId, before.deckId)
  assert.equal(after.outlineId, before.outlineId)
  assert.deepEqual(
    after.slides.map(s => s.revision),
    [1, 1, 1, 1, 1],
  )
  assert.equal((await client.content(id, after.slides[4].slideId, 1)).provenance[0].origin, 'general-knowledge')
  assert.deepEqual(after.generation.receipt, before.generation.receipt)
  assert.deepEqual(await Promise.all(after.slides.slice(0, 2).map(s => client.content(id, s.slideId, 1))), content)
  assert.ok(events.some(e => e.kind === 'text' && e.text.includes('5/5')))
  assert.equal(
    (await f.call(`sessions/${id}/deck/confirm`, 'POST', target)).data.request.requestId,
    accepted.request.requestId,
  )
  const log = await readFile(f.log, 'utf8')
  assert.ok(log.includes('Continue the remaining slides'))
})
