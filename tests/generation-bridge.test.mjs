import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { ConfirmationClient, DeckClient } from '../packages/client/runtime/lib/index.js'
import { startApp, finished } from './fixtures/b02-helpers.mjs'
import { brief } from './fixtures/brief.mjs'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'

test('confirmed production runtime publishes a full deck through the request MCP bridge', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'generation-bridge-'))
  const f = await startApp(dir, {
    options: { providerAccess: { check: async () => {}, catalog: async () => ['model-a'] } },
  })
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  assert.equal(
    (
      await f.call('providers/test', 'PUT', {
        displayName: 'Fixture',
        protocol: 'chat-completions',
        baseUrl: 'http://127.0.0.1:1/v1',
        key: 'fixture',
        models: ['model-a'],
        new: true,
      })
    ).status,
    200,
  )
  const project = join(dir, 'project')
  await mkdir(project)
  await writeFile(join(project, 'notes.txt'), 'project marker')
  await writeFile(join(project, 'secret.txt'), 'Unselected material')
  assert.equal((await f.call('workspaces', 'POST', { folder: project })).status, 200)
  const created = await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })
  const id = created.data.sessionId
  const read = await f.client.send({ sessionId: id, input: '[mcp-read]' })
  await finished(f.client, read.requestId)
  const sessions = new SqliteSessionStore(join(dir, 'data', 'db', 'sessions.sqlite'))
  const selectedSource = sessions.requests.sourceCatalogue(id)[0]
  sessions.close()
  const decks = new DeckService(join(dir, 'data', 'db', 'decks.sqlite'))
  const draft = { ...brief(), proposedSlideCount: 3, purpose: 'Explain' }
  draft.sources = {
    material: true,
    modelKnowledge: true,
    publicResearch: false,
    refs: [{ sourceId: selectedSource.sourceId, version: selectedSource.version, kind: 'project-file' }],
  }
  draft.answers = [{ topic: 'images', value: 'None' }]
  const b = decks.saveBrief(id, { expectedVersion: 0, draft })
  const p = decks.proposeBoundOutline(id, {
    requestId: 'review',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: b.briefId, version: b.version },
    draft: {
      overview: 'Plan',
      revisionSuggestions: [],
      slides: ['Purpose', 'Approach', 'Next steps'].map(title => ({
        title,
        content: 'Explain',
        blocks: [{ kind: 'bullets', items: ['Explain'] }],
        sources: [],
      })),
    },
  })
  decks.close()
  await writeFile(`${f.log}.generation.json`, JSON.stringify({ negative: true }))
  const target = {
    confirmationId: 'generate',
    outlineId: p.outlineId,
    outlineVersion: p.version,
    briefId: b.briefId,
    briefVersion: b.version,
  }
  const response = await f.call(`sessions/${id}/deck/confirm`, 'POST', target)
  assert.equal(response.status, 200, JSON.stringify(response.data))
  const events = await finished(f.client, response.data.receipt.requestId)
  assert.equal(events.at(-1).status, 'completed', JSON.stringify(events.at(-1)))
  const client = new DeckClient(f.app.origin, f.app.token)
  const state = await client.snapshot(id)
  assert.equal(state.generation.state, 'generated')
  assert.deepEqual(
    state.slides.map(s => s.revision),
    [1, 1, 1],
  )
  for (const slide of state.slides) assert.match((await client.content(id, slide.slideId, 1)).html, /Explain/)
  assert.ok(events.some(e => e.kind === 'text' && e.text.includes('3/3')))
  assert.ok(events.some(e => e.kind === 'text' && e.text.includes('foreign scope refused')))
  assert.ok(
    events.some(e => e.kind === 'text' && e.text.includes('Selected source readable; unselected source refused')),
  )
  const retry = await new ConfirmationClient(f.app.origin, f.app.token).confirm(id, target)
  assert.equal(retry.request.requestId, response.data.receipt.requestId)
})
