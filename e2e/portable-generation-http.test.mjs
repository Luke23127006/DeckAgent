import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckClient, BriefClient, OutlineClient } from '../apps/web/tests/fixtures/browser-driver.mjs'
import { startApp, finished } from '../apps/host/tests/fixtures/b02-helpers.mjs'
import { brief } from '../packages/presentation/deck/tests/fixtures/brief.mjs'

for (const templateVersion of [2, 3])
  test(`Create deck prepares images, then MCP templates v${templateVersion} publish all seven layouts through the real local renderer`, {
    timeout: 180000,
  }, async t => {
    const dir = await mkdtemp(join(tmpdir(), 'portable-generation-http-'))
    const png = await readFile(new URL('../packages/tools/filesystem/tests/fixtures/attachments/sample.png', import.meta.url))
    const jpg = await readFile(new URL('../packages/tools/filesystem/tests/fixtures/attachments/sample.jpg', import.meta.url))
    let lookups = 0,
      offline = false
    const f = await startApp(dir, {
      openCode: { timeoutMs: 120000 },
      options: {
        providerAccess: { check: async () => {}, catalog: async () => ['model-a'] },
        researchAccess: {
          key: 'fixture-tavily',
          fetch: async (url, init) => {
            assert.equal(offline, false)
            if (String(url).endsWith('/usage'))
              return Response.json({
                account: {
                  current_plan: 'Researcher',
                  paygo_usage: 0,
                  paygo_limit: 0,
                  plan_usage: 0,
                  plan_limit: 1000,
                },
                key: { usage: 0, limit: null },
              })
            lookups++
            const query = JSON.parse(init.body).query
            assert.equal(JSON.parse(init.body).include_images, true)
            return Response.json({
              images: [],
              results: [
                {
                  title: query,
                  url: `https://photos.example/${query}`,
                  images: [
                    { url: 'https://photos.example/wrong.png', description: 'An unrelated car' },
                    { url: `https://photos.example/${query}.png`, description: `${query} ecosystem illustration` },
                  ],
                },
              ],
            })
          },
        },
        imageAccess: {
          resolve: async () => [{ address: '8.8.8.8', family: 4 }],
          fetch: async url => {
            assert.equal(offline, false, 'Generation must use prepared images without another network call')
            const path = new URL(url).pathname
            assert.equal(path.includes('wrong'), false, 'Do not download the first irrelevant candidate')
            if (!path.endsWith('.png'))
              return new Response(
                `<script type="application/ld+json">${JSON.stringify({
                  '@type': 'ImageObject',
                  contentUrl: `${url}.png`,
                  creator: { name: 'Fixture author' },
                  license: 'https://creativecommons.org/licenses/by/4.0/',
                })}</script>`,
                { headers: { 'content-type': 'text/html' } },
              )
            return new Response(path.includes('ocean') ? jpg : png, {
              headers: { 'content-type': path.includes('ocean') ? 'image/jpeg' : 'image/png' },
            })
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
      expectedVersion: (await f.call('settings')).data.providersVersion,
    })
    const id = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data.sessionId
    const draft = {
      ...brief(),
      template: { id: 'html-basic', version: templateVersion },
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
            {
              kind: 'web-image',
              query: 'forest',
              caption: 'Forest illustration',
              intent: {
                subject: 'Forest ecosystem',
                role: 'Show a forest habitat',
                mustInclude: ['trees'],
                mustAvoid: ['city'],
                aspect: 'landscape',
              },
            },
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
    await writeFile(
      `${f.log}.workflow.json`,
      JSON.stringify({ brief: draft, outline, selectImages: true, imageCandidateIndex: 1 }),
    )
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
    assert.equal(lookups, 3)
    const proposals = (await f.call(`sessions/${id}/outline`)).data
    const current = proposals.proposals.at(-1),
      b = interview.brief.current
    const decoded = (await new OutlineClient(f.app.origin, f.app.token).snapshot(id)).proposals.at(-1)
    assert.equal(decoded.imageReview.length, 3)
    assert.equal(decoded.imageReview[0].selection.provider, 'tavily')
    assert.equal(decoded.imageReview[0].selection.evidence, 'metadata')
    const imagePath = `sessions/${id}/outlines/${current.outlineId}/images/${decoded.imageReview[0].needId}`
    assert.equal((await fetch(`${f.app.origin}/api/${imagePath}`)).status, 401)
    assert.equal((await f.client.outlineImage(id, current.outlineId, decoded.imageReview[0].needId)).type, 'image/png')
    const wrongChat = await fetch(`${f.app.origin}/api/${imagePath.replace(id, 'other-chat')}`, {
      headers: { authorization: `Bearer ${f.app.token}` },
    })
    assert.equal(wrongChat.status, 404)
    assert.deepEqual((await f.call(`sessions/${id}/research-sources`)).data, [])
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
    assert.equal(lookups, 3)
  })
