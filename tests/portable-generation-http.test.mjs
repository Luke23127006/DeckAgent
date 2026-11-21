import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckClient, BriefClient } from '../packages/client/runtime/lib/index.js'
import { startApp, finished } from './fixtures/b02-helpers.mjs'
import { brief } from './fixtures/brief.mjs'

test('Create deck prepares images, then MCP templates publish all seven layouts through the real local renderer', {
  timeout: 180000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'portable-generation-http-'))
  const png = await readFile(new URL('./fixtures/attachments/sample.png', import.meta.url))
  let lookups = 0,
    offline = false
  const f = await startApp(dir, {
    options: {
      providerAccess: { check: async () => {}, catalog: async () => ['model-a'] },
      imageAccess: {
        fetch: async url => {
          assert.equal(offline, false, 'Generation must use prepared images without another network call')
          if (String(url).startsWith('https://commons.wikimedia.org/w/api.php?')) {
            lookups++
            return Response.json({
              query: {
                pages: [
                  {
                    imageinfo: [
                      {
                        thumburl: 'https://upload.wikimedia.org/wikipedia/commons/fixture.png',
                        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Fixture.png',
                        extmetadata: {
                          Artist: { value: 'Fixture author' },
                          LicenseShortName: { value: 'CC BY 4.0' },
                          LicenseUrl: { value: 'https://creativecommons.org/licenses/by/4.0/' },
                        },
                      },
                    ],
                  },
                ],
              },
            })
          }
          return new Response(png, { headers: { 'content-type': 'image/png' } })
        },
      },
    },
  })
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  await f.call('providers/test', 'PUT', {
    displayName: 'Fixture',
    protocol: 'chat-completions',
    baseUrl: 'http://127.0.0.1:9/v1',
    key: 'fixture',
    models: ['model-a'],
    new: true,
  })
  const id = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data.sessionId
  const draft = {
    ...brief(),
    template: { id: 'html-basic', version: 2 },
    proposedSlideCount: 7,
    purpose: 'Explain',
    presenterNotes: true,
    answers: [{ topic: 'images', value: 'Use public images' }],
    sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
    images: { mode: 'public-research', attachmentIds: [], unmetRequirements: [] },
  }
  const outline = {
    overview: 'Environment',
    revisionSuggestions: [],
    slides: [
      {
        title: 'Environment',
        content: 'An introduction',
        blocks: [{ kind: 'subtitle', text: 'An introduction' }],
        sources: [],
      },
      {
        title: 'Why it matters',
        content: 'Healthy ecosystems',
        blocks: [{ kind: 'lead', text: 'Healthy ecosystems' }],
        sources: [],
      },
      {
        title: 'Components',
        content: 'Forest',
        blocks: [{ kind: 'bullets', items: ['Forest', 'Ocean'] }],
        sources: [],
      },
      {
        title: 'Land and water',
        content: 'Trees',
        blocks: [{ kind: 'columns', columns: [{ bullets: ['Trees', 'Soil'] }, { bullets: ['Rivers', 'Seas'] }] }],
        sources: [],
      },
      {
        title: 'Practice',
        content: 'One action',
        blocks: [
          { kind: 'metrics', items: [{ value: 'One action', label: 'A conceptual example' }] },
          { kind: 'source-note', text: 'No measured statistic' },
        ],
        sources: [],
      },
      {
        title: 'Forest',
        content: 'Protect habitats',
        blocks: [
          { kind: 'bullets', items: ['Protect habitats'] },
          { kind: 'web-image', query: 'forest', caption: 'Forest illustration' },
        ],
        sources: [],
      },
      {
        title: 'Forest and ocean',
        content: 'Forest illustration',
        blocks: [
          { kind: 'web-image', query: 'forest', caption: 'Forest illustration' },
          { kind: 'web-image', query: 'ocean', caption: 'Ocean illustration' },
        ],
        sources: [],
      },
    ],
  }
  await writeFile(`${f.log}.workflow.json`, JSON.stringify({ brief: draft, outline }))
  const review = await f.call('requests', 'POST', {
    sessionId: id,
    input: '[workflow] Introduce the environment',
    deck: {
      action: 'collect',
      expectedBriefVersion: 0,
      expectedOutline: null,
      imageChoice: 'public-research',
      sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
    },
  })
  assert.equal(review.status, 202, JSON.stringify(review.data))
  const reviewed = await finished(f.client, review.data.requestId)
  assert.equal(reviewed.at(-1).status, 'completed', JSON.stringify(reviewed))
  const interview = await new BriefClient(f.app.origin, f.app.token).interview(id)
  assert.deepEqual(interview.state.blockers, [])
  assert.equal(lookups, 2)
  const proposals = (await f.call(`sessions/${id}/outline`)).data
  const current = proposals.proposals.at(-1),
    b = interview.brief.current
  offline = true
  await writeFile(`${f.log}.generation.json`, '{}')
  const confirmed = await f.call(`sessions/${id}/deck/confirm`, 'POST', {
    confirmationId: 'portable-seven',
    outlineId: current.outlineId,
    outlineVersion: current.version,
    briefId: b.briefId,
    briefVersion: b.version,
  })
  assert.equal(confirmed.status, 200, JSON.stringify(confirmed.data))
  const generated = await finished(f.client, confirmed.data.request.requestId)
  assert.equal(generated.at(-1).status, 'completed', JSON.stringify(generated))
  const client = new DeckClient(f.app.origin, f.app.token),
    deck = await client.snapshot(id)
  assert.equal(deck.generation.state, 'generated')
  assert.deepEqual(
    deck.slides.map(s => s.revision),
    Array(7).fill(1),
  )
  for (const slide of deck.slides) {
    const saved = await client.content(id, slide.slideId, 1)
    assert.equal(saved.document.slideId, slide.slideId)
    assert.equal(saved.artifact.documentVersion, 1)
    assert.ok(saved.notes)
  }
  assert.equal((await client.content(id, deck.slides[6].slideId, 1)).imageCredits.length, 2)
  assert.equal(lookups, 2)
})
