import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { ConfirmationClient, DeckClient } from '../apps/web/lib/browser/index.js'
import { brief } from './fixtures/brief.mjs'
import { startApp, waitFor, finished } from './fixtures/b02-helpers.mjs'
import { DatabaseSync } from 'node:sqlite'

test('authenticated concurrent confirmation schedules one request, denies mixed input, and Stop preserves the snapshot lock', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'confirmation-host-'))
  let runs = 0
  const runtime = {
    async prepare() {
      return {
        selection: { provider: 'fixture', model: 'model' },
        async start(run) {
          runs++
          await new Promise(resolve => run.signal.addEventListener('abort', resolve, { once: true }))
          return { status: 'failed', errorCode: 'STOPPED' }
        },
      }
    },
  }
  const f = await startApp(dir, { options: { generationRuntime: runtime } })
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const id = (await f.call('sessions', 'POST', {})).data.sessionId
  const decks = new DeckService(join(dir, 'data', 'db', 'decks.sqlite'))
  const draft = brief()
  draft.sources.material = false
  draft.sources.modelKnowledge = true
  draft.proposedSlideCount = 1
  draft.purpose = 'Explain'
  draft.answers = [{ topic: 'images', value: 'None' }]
  const b = decks.saveBrief(id, { expectedVersion: 0, draft })
  const p = decks.proposeBoundOutline(id, {
    requestId: 'review',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: b.briefId, version: 1 },
    draft: {
      overview: 'Plan',
      revisionSuggestions: [],
      slides: [
        { title: 'Purpose', content: 'Explain', blocks: [{ kind: 'bullets', items: ['Explain'] }], sources: [] },
      ],
    },
  })
  const target = {
    confirmationId: 'confirm',
    outlineId: p.outlineId,
    outlineVersion: 1,
    briefId: b.briefId,
    briefVersion: 1,
  }
  decks.close()
  assert.equal(
    (await f.call(`sessions/${id}/deck/confirm`, 'POST', { ...target, changes: 'also add a slide' })).status,
    400,
  )
  const client = new ConfirmationClient(f.app.origin, f.app.token)
  const results = await Promise.all([client.confirm(id, target), client.confirm(id, target)])
  assert.deepEqual(results[0].receipt, results[1].receipt)
  assert.equal(runs, 1)
  const deckClient = new DeckClient(f.app.origin, f.app.token)
  assert.equal((await deckClient.snapshot(id)).generation.formatLocked, true)
  assert.equal((await f.call(`sessions/${id}/deck/confirm`, 'POST', { ...target, briefVersion: 2 })).status, 409)
  await f.client.stop(results[0].receipt.requestId)
  await waitFor(async () => (await deckClient.snapshot(id)).generation.state === 'incomplete')
  assert.equal((await deckClient.snapshot(id)).generation.formatLocked, true)
  await client.confirm(id, target)
  assert.equal(runs, 1)
})

async function seed(f, dir) {
  const id = (await f.call('sessions', 'POST', {})).data.sessionId
  const decks = new DeckService(join(dir, 'data', 'db', 'decks.sqlite'))
  const draft = brief()
  draft.sources.material = false
  draft.sources.modelKnowledge = true
  draft.proposedSlideCount = 1
  draft.purpose = 'Explain'
  draft.answers = [{ topic: 'images', value: 'None' }]
  const b = decks.saveBrief(id, { expectedVersion: 0, draft })
  const p = decks.proposeBoundOutline(id, {
    requestId: 'review',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: b.briefId, version: 1 },
    draft: {
      overview: 'Plan',
      revisionSuggestions: [],
      slides: [
        { title: 'Purpose', content: 'Explain', blocks: [{ kind: 'bullets', items: ['Explain'] }], sources: [] },
      ],
    },
  })
  decks.close()
  return {
    id,
    target: {
      confirmationId: 'confirm',
      outlineId: p.outlineId,
      outlineVersion: 1,
      briefId: b.briefId,
      briefVersion: 1,
    },
  }
}

test('admission failure keeps one pending confirmation through restart and permits only explicit idempotent scheduling retry', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'confirmation-admission-'))
  let starts = 0
  const runtime = {
    async prepare() {
      return {
        selection: { provider: 'fixture', model: 'model' },
        async start() {
          starts++
          return { status: 'failed', errorCode: 'RUNTIME_FAILED' }
        },
      }
    },
  }
  let f = await startApp(dir, { options: { generationRuntime: runtime } })
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const { id, target } = await seed(f, dir)
  const db = new DatabaseSync(join(dir, 'data', 'db', 'sessions.sqlite'))
  db.exec("CREATE TRIGGER fail_admission BEFORE INSERT ON requests BEGIN SELECT RAISE(ABORT,'fault'); END")
  const failed = await f.call(`sessions/${id}/deck/confirm`, 'POST', target)
  assert.equal(failed.status, 500)
  assert.equal(failed.data.error.code, 'REQUEST_NOT_SAVED')
  const pending = (await new DeckClient(f.app.origin, f.app.token).snapshot(id)).generation
  assert.equal(pending.state, 'pending')
  assert.equal(pending.formatLocked, false)
  assert.equal(starts, 0)
  db.exec('DROP TRIGGER fail_admission')
  db.close()
  await f.app.close()
  f = await startApp(dir, { options: { generationRuntime: runtime } })
  assert.equal(starts, 0)
  const retry = await new ConfirmationClient(f.app.origin, f.app.token).confirm(id, target)
  assert.deepEqual(retry.receipt, pending.receipt)
  await finished(f.client, retry.receipt.requestId)
  assert.equal(starts, 1)
  await new ConfirmationClient(f.app.origin, f.app.token).confirm(id, target)
  assert.equal(starts, 1)
})

test('a failed domain link after Session admission records interruption without starting a model, and an unavailable generator never confirms', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'confirmation-link-'))
  let starts = 0
  const runtime = {
    async prepare() {
      return {
        selection: { provider: 'fixture', model: 'model' },
        async start() {
          starts++
          return { status: 'completed' }
        },
      }
    },
  }
  let f = await startApp(dir)
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const { id, target } = await seed(f, dir)
  const unavailable = await f.call(`sessions/${id}/deck/confirm`, 'POST', target)
  assert.equal(unavailable.status, 409)
  assert.equal(unavailable.data.error.code, 'NO_SELECTABLE_MODEL')
  assert.equal((await new DeckClient(f.app.origin, f.app.token).snapshot(id)).version, 0)
  await f.app.close()
  f = await startApp(dir, { options: { generationRuntime: runtime } })
  const db = new DatabaseSync(join(dir, 'data', 'db', 'decks.sqlite'))
  db.exec(
    "CREATE TRIGGER fail_link BEFORE UPDATE OF state ON generation_intents WHEN NEW.state='admitted' BEGIN SELECT RAISE(ABORT,'fault'); END",
  )
  const linked = await f.call(`sessions/${id}/deck/confirm`, 'POST', target)
  db.close()
  assert.equal(linked.status, 500)
  assert.equal(linked.data.error.code, 'GENERATION_LINK_FAILED')
  const snapshot = (await new DeckClient(f.app.origin, f.app.token).snapshot(id)).generation
  assert.equal(snapshot.state, 'incomplete')
  assert.equal(snapshot.formatLocked, false)
  assert.equal(starts, 0)
})
