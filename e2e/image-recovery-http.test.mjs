import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startApp, finished, runs, waitFor, MemoryCredentials } from '../apps/host/tests/fixtures/b02-helpers.mjs'
import { BriefClient, OutlineClient, DeckClient } from '../apps/web/tests/fixtures/browser-driver.mjs'
import { brief } from '../packages/presentation/deck/tests/fixtures/brief.mjs'

async function fixture(t, { pexels = true, pause = false, preparedForest = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'image-recovery-'))
  const png = await readFile(new URL('../packages/tools/filesystem/tests/fixtures/attachments/sample.png', import.meta.url))
  const jpg = await readFile(new URL('../packages/tools/filesystem/tests/fixtures/attachments/sample.jpg', import.meta.url))
  let searches = 0,
    offline = false
  let available = pexels
  let commonsSearches = 0
  const appOptions = {
    credentials: new MemoryCredentials(),
    options: {
      providerAccess: { check: async () => {}, catalog: async () => ['model-a'] },
      researchAccess: {
        key: 'tavily-fixture',
        fetch: async (url, init) => {
          assert.equal(offline, false)
          if (String(url).endsWith('/usage'))
            return Response.json({
              account: { current_plan: 'Researcher', paygo_usage: 0, paygo_limit: 0, plan_usage: 0, plan_limit: 1000 },
              key: { usage: 0, limit: null },
            })
          searches++
          const query = JSON.parse(init.body).query
          const id = query === 'forest' ? '12067501' : '21701090'
          return Response.json({
            images: [
              { url: `https://cdn.publisher.example/${query}.jpg`, description: `${query} ecosystem` },
              ...(available || (preparedForest && query === 'forest')
                ? [
                    {
                      url: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`,
                      description: `${query} ecosystem photograph`,
                    },
                  ]
                : [
                    {
                      url: `https://cdn.publisher.example/${query}-second.jpg`,
                      description: `${query} ecosystem photograph`,
                    },
                  ]),
            ],
            results: [
              { title: 'Gallery', url: 'https://publisher.example/gallery', content: 'No image licence information' },
            ],
          })
        },
      },
      imageAccess: {
        resolve: async () => [{ address: '8.8.8.8', family: 4 }],
        fetch: async url => {
          assert.equal(offline, false)
          if (new URL(url).hostname === 'commons.wikimedia.org') {
            commonsSearches++
            return Response.json({
              query: {
                pages: [
                  {
                    title: 'File:Ocean.jpg',
                    imageinfo: [
                      {
                        thumburl: 'https://upload.wikimedia.org/wikipedia/commons/ocean.jpg',
                        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Ocean.jpg',
                        extmetadata: {
                          Artist: { value: 'Ocean photographer' },
                          LicenseShortName: { value: 'CC BY 4.0' },
                          LicenseUrl: { value: 'https://creativecommons.org/licenses/by/4.0/' },
                          ImageDescription: { value: 'A blue ocean ecosystem' },
                        },
                      },
                    ],
                  },
                ],
              },
            })
          }
          if (new URL(url).hostname === 'upload.wikimedia.org')
            return new Response(jpg, { headers: { 'content-type': 'image/jpeg' } })
          if (new URL(url).hostname === 'publisher.example')
            return new Response('<html>A gallery without licence metadata</html>', {
              headers: { 'content-type': 'text/html' },
            })
          assert.equal(new URL(url).hostname, 'images.pexels.com', 'An unverified publisher asset is never downloaded')
          const ocean = String(url).includes('21701090')
          return new Response(ocean ? jpg : png, { headers: { 'content-type': ocean ? 'image/jpeg' : 'image/png' } })
        },
      },
    },
  }
  const f = await startApp(dir, appOptions)
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
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
    proposedSlideCount: 1,
    purpose: 'Explain ecosystems',
    sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
    images: { mode: 'public-research', provider: 'tavily', attachmentIds: [], unmetRequirements: [] },
    answers: [{ topic: 'images', value: 'Two distinct required ecosystem images' }],
  }
  const outline = {
    overview: 'Forest and ocean',
    revisionSuggestions: [],
    slides: [
      {
        title: 'Forest and ocean',
        content: 'Forest ecosystem',
        sources: [],
        blocks: [
          { kind: 'web-image', query: 'forest', caption: 'Forest ecosystem' },
          { kind: 'web-image', query: 'ocean', caption: 'Ocean ecosystem' },
        ],
      },
    ],
  }
  await writeFile(
    `${f.log}.workflow.json`,
    JSON.stringify({ brief: draft, outline, selectImages: true, repairImages: true, pauseImageRecovery: pause }),
  )
  const sent = await f.call('requests', 'POST', {
    sessionId: id,
    input: 'Create a forest and ocean deck [workflow]',
    deck: {
      action: 'collect',
      expectedBriefVersion: 0,
      expectedOutline: null,
      imageChoice: 'public-research',
      imageProviderChoice: 'tavily',
      sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
    },
  })
  assert.equal(sent.status, 202)
  return {
    ...f,
    id,
    requestId: sent.data.requestId,
    draft,
    outline,
    searches: () => searches,
    commonsSearches: () => commonsSearches,
    enableImages: () => {
      available = true
    },
    restart: async () => {
      await f.app.close()
      const next = await startApp(dir, appOptions)
      Object.assign(f, next)
      return next
    },
    setOffline: () => {
      offline = true
    },
  }
}

test('one bounded MCP recovery pass resolves missing source-page images and publishes a deck with honest Pexels credits', {
  timeout: 90000,
}, async t => {
  const f = await fixture(t)
  const events = await finished(f.client, f.requestId)
  assert.equal(events.at(-1).status, 'completed', JSON.stringify(events))
  assert.equal(runs(f.log).length, 2, 'One initial model run and one image recovery run')
  assert.equal(f.searches(), 2, 'Recovery selects existing relevant alternatives without spending another search')
  const interview = await new BriefClient(f.app.origin, f.app.token).interview(f.id)
  assert.deepEqual(interview.state.blockers, [])
  const current = (await new OutlineClient(f.app.origin, f.app.token).snapshot(f.id)).proposals.at(-1)
  assert.equal(current.imageReview.length, 2)
  for (const image of current.imageReview) {
    assert.equal(image.status, 'prepared')
    assert.equal(image.credit.license, 'Pexels')
    assert.equal(image.credit.evidence, 'pexels-cdn')
    assert.deepEqual(
      image.attempts.map(a => a.code),
      ['RESEARCH_IMAGE_LICENSE_REQUIRED', 'IMAGE_PREPARED'],
    )
    assert.equal(image.attempts[0].checks[0].sourceUrl, 'https://publisher.example/gallery')
  }
  assert.deepEqual((await f.call(`sessions/${f.id}/research-sources`)).data, [])
  f.setOffline()
  await writeFile(`${f.log}.generation.json`, '{}')
  const b = interview.brief.current
  const confirmed = await f.call(`sessions/${f.id}/deck/confirm`, 'POST', {
    confirmationId: 'recovered-images',
    outlineId: current.outlineId,
    outlineVersion: current.version,
    briefId: b.briefId,
    briefVersion: b.version,
  })
  assert.equal(confirmed.status, 200, JSON.stringify(confirmed.data))
  const generated = await finished(f.client, confirmed.data.request.requestId)
  assert.equal(
    generated.at(-1).status,
    'completed',
    JSON.stringify(
      generated.filter(
        e => e.kind === 'status' || e.kind === 'text' || (e.kind === 'activity' && e.status === 'failed'),
      ),
    ),
  )
  const client = new DeckClient(f.app.origin, f.app.token),
    deck = await client.snapshot(f.id)
  const saved = await client.content(f.id, deck.slides[0].slideId, 1)
  assert.equal(saved.imageCredits.length, 2)
  assert.ok(saved.imageCredits.every(c => c.license === 'Pexels' && c.evidence === 'pexels-cdn'))
})

test('a later image request resumes saved progress without restaging Brief or Outline', { timeout: 60000 }, async t => {
  const f = await fixture(t, { pexels: false })
  assert.equal((await finished(f.client, f.requestId)).at(-1).status, 'completed')
  const outlines = new OutlineClient(f.app.origin, f.app.token)
  const before = await outlines.snapshot(f.id)
  const current = before.proposals.at(-1)
  assert.ok(current.imageReview.every(i => i.status === 'unavailable'))
  f.enableImages()
  await writeFile(
    `${f.log}.workflow.json`,
    JSON.stringify({
      resumeImages: true,
      resumeNeeds: current.imageReview.map(i => ({
        ...i,
        query: f.outline.slides[i.slideIndex].blocks[i.blockIndex].query,
      })),
    }),
  )
  const searched = f.searches()
  const sent = await f.call('requests', 'POST', {
    sessionId: f.id,
    input: 'Tiếp tục hoàn thiện hai ảnh còn thiếu giúp tôi [workflow]',
    deck: {
      action: 'revise',
      expectedBriefVersion: 1,
      expectedOutline: { outlineId: current.outlineId, version: current.version },
    },
  })
  assert.equal(sent.status, 202)
  assert.equal((await finished(f.client, sent.data.requestId)).at(-1).status, 'completed')
  assert.equal(f.searches(), searched + 2, 'A new request performs actual image searches')
  const after = await outlines.snapshot(f.id)
  assert.equal(after.proposals.length, before.proposals.length + 1)
  assert.ok(after.proposals.at(-1).imageReview.every(i => i.status === 'prepared'))
  assert.deepEqual(after.proposals.at(-1).slides, current.slides, 'Only prepared image progress changes')
  assert.equal(after.proposals[0].outlineId, current.outlineId)
  const briefAfter = await new BriefClient(f.app.origin, f.app.token).snapshot(f.id)
  assert.deepEqual(briefAfter.current.draft, f.draft)
})

test('changing image provider resumes only missing positions and keeps the prepared image across reopening', {
  timeout: 60000,
}, async t => {
  const f = await fixture(t, { pexels: false, preparedForest: true })
  assert.equal((await finished(f.client, f.requestId)).at(-1).status, 'completed')
  const before = await new OutlineClient(f.app.origin, f.app.token).snapshot(f.id)
  const current = before.proposals.at(-1)
  assert.equal(current.imageReview[0].status, 'prepared')
  assert.equal(current.imageReview[1].status, 'unavailable')
  Object.assign(f, await f.restart())
  assert.deepEqual(
    await new OutlineClient(f.app.origin, f.app.token).snapshot(f.id),
    before,
    'Host restart retains both prepared images and unresolved positions',
  )
  await writeFile(
    `${f.log}.workflow.json`,
    JSON.stringify({
      resumeImages: true,
      resumeNeeds: current.imageReview.map(i => ({
        ...i,
        query: f.outline.slides[i.slideIndex].blocks[i.blockIndex].query,
      })),
    }),
  )
  const searches = f.searches()
  const sent = await f.call('requests', 'POST', {
    sessionId: f.id,
    input: 'Dùng Wikimedia Commons để hoàn thiện phần còn thiếu [workflow]',
    deck: {
      action: 'revise',
      expectedBriefVersion: 1,
      expectedOutline: { outlineId: current.outlineId, version: current.version },
      imageChoice: 'public-research',
      imageProviderChoice: 'commons',
    },
  })
  assert.equal(sent.status, 202)
  const events = await finished(f.client, sent.data.requestId)
  assert.equal(events.at(-1).status, 'completed', JSON.stringify(events))
  assert.equal(f.commonsSearches(), 1, 'Only the missing ocean position is searched using Commons')
  assert.equal(f.searches(), searches, 'No new Tavily search after switching provider')
  const after = await new OutlineClient(f.app.origin, f.app.token).snapshot(f.id)
  const next = after.proposals.at(-1)
  assert.ok(next.imageReview.every(i => i.status === 'prepared'))
  assert.equal(next.imageReview[0].digest, current.imageReview[0].digest)
  assert.deepEqual(next.imageReview[0].credit, current.imageReview[0].credit)
  assert.deepEqual(
    next.imageReview[0].selection,
    current.imageReview[0].selection,
    'Retained search provenance remains honest',
  )
  assert.equal(next.imageReview[1].selection.provider, 'commons')
  assert.deepEqual(
    next.slides.map(s => s.slideId),
    current.slides.map(s => s.slideId),
  )
  assert.equal(after.proposals[0].imageReview[1].status, 'unavailable', 'The earlier proposal is immutable')
  const saved = await new BriefClient(f.app.origin, f.app.token).snapshot(f.id)
  assert.equal(saved.current.draft.images.provider, 'commons')
  assert.deepEqual(saved.current.draft.sources, f.draft.sources)
  assert.deepEqual((await f.call(`sessions/${f.id}/research-sources`)).data, [])
  const stale = await f.call('requests', 'POST', {
    sessionId: f.id,
    input: 'Tiếp tục phần ảnh',
    deck: {
      action: 'revise',
      expectedBriefVersion: 1,
      expectedOutline: { outlineId: current.outlineId, version: current.version },
    },
  })
  assert.equal(stale.status, 409, 'An old interface cannot overwrite the newer image progress')
  assert.equal(f.commonsSearches(), 1)
  f.setOffline()
  await writeFile(`${f.log}.generation.json`, '{}')
  const confirmed = await f.call(`sessions/${f.id}/deck/confirm`, 'POST', {
    confirmationId: 'continued-images',
    outlineId: next.outlineId,
    outlineVersion: next.version,
    briefId: saved.current.briefId,
    briefVersion: saved.current.version,
  })
  assert.equal(confirmed.status, 200, JSON.stringify(confirmed.data))
  const generated = await finished(f.client, confirmed.data.request.requestId)
  assert.equal(generated.at(-1).status, 'completed', JSON.stringify(generated))
  const deckClient = new DeckClient(f.app.origin, f.app.token)
  const deck = await deckClient.snapshot(f.id)
  const content = await deckClient.content(f.id, deck.slides[0].slideId, 1)
  assert.deepEqual(content.imageCredits.map(c => c.license).toSorted(), ['CC BY', 'Pexels'])
})

test('questions do not search, recover or create revisions and Stop preserves the prior image progress', {
  timeout: 60000,
}, async t => {
  const f = await fixture(t, { pexels: false, preparedForest: true })
  await finished(f.client, f.requestId)
  const outlines = new OutlineClient(f.app.origin, f.app.token)
  const before = await outlines.snapshot(f.id)
  const current = before.proposals.at(-1)
  const searched = f.searches()
  const runCount = runs(f.log).length
  await writeFile(`${f.log}.workflow.json`, '{}')
  for (const action of ['question', 'clarify', 'revise']) {
    const sent = await f.call('requests', 'POST', {
      sessionId: f.id,
      input: 'Ảnh nào đang thiếu và vì sao? [workflow]',
      deck: {
        action,
        expectedBriefVersion: 1,
        expectedOutline: { outlineId: current.outlineId, version: current.version },
        imageChoice: 'public-research',
        imageProviderChoice: 'commons',
      },
    })
    assert.equal(sent.status, 202)
    assert.equal((await finished(f.client, sent.data.requestId)).at(-1).status, 'completed')
    assert.deepEqual(await outlines.snapshot(f.id), before)
  }
  assert.equal(runs(f.log).length, runCount + 3, 'No recovery runs for questions, including the default revise action')
  assert.equal(f.searches(), searched)
  assert.equal(f.commonsSearches(), 0)
  await writeFile(`${f.log}.workflow.json`, JSON.stringify({ resumeImages: true, pauseImageResume: true }))
  const stopped = await f.call('requests', 'POST', {
    sessionId: f.id,
    input: 'Hoàn thiện ảnh còn thiếu bằng Commons [workflow]',
    deck: {
      action: 'revise',
      expectedBriefVersion: 1,
      expectedOutline: { outlineId: current.outlineId, version: current.version },
      imageChoice: 'public-research',
      imageProviderChoice: 'commons',
    },
  })
  assert.equal(stopped.status, 202)
  await waitFor(() => f.commonsSearches() === 1)
  await f.client.stop(stopped.data.requestId)
  assert.equal((await finished(f.client, stopped.data.requestId)).at(-1).status, 'stopped')
  assert.deepEqual(await outlines.snapshot(f.id), before)
  assert.equal((await new BriefClient(f.app.origin, f.app.token).snapshot(f.id)).version, 1)
})

test('a stale image ID reports the current positions and cannot silently complete a failed search', {
  timeout: 60000,
}, async t => {
  const f = await fixture(t, { pexels: false, preparedForest: true })
  await finished(f.client, f.requestId)
  const outlines = new OutlineClient(f.app.origin, f.app.token)
  const before = await outlines.snapshot(f.id)
  const current = before.proposals.at(-1)
  const staleImageId = current.imageReview[1].needId
  await writeFile(`${f.log}.workflow.json`, JSON.stringify({ resumeImages: true, staleImageId, onlyStaleImage: true }))
  const deck = {
    action: 'revise',
    expectedBriefVersion: 1,
    expectedOutline: { outlineId: current.outlineId, version: current.version },
    imageChoice: 'public-research',
    imageProviderChoice: 'commons',
  }
  const send = () =>
    f.call('requests', 'POST', { sessionId: f.id, input: 'Đổi nguồn cho phần ảnh chưa xong [workflow]', deck })
  const stale = await send()
  assert.equal(stale.status, 202)
  const errors = await finished(f.client, stale.data.requestId)
  assert.equal(errors.at(-1).status, 'failed', JSON.stringify(errors))
  assert.equal(errors.at(-1).errorCode, 'RESEARCH_IMAGE_SELECTION_STALE')
  assert.equal(f.commonsSearches(), 0)
  assert.deepEqual(await outlines.snapshot(f.id), before)
  await writeFile(`${f.log}.workflow.json`, JSON.stringify({ resumeImages: true, staleImageId }))
  const retry = await send()
  assert.equal(retry.status, 202)
  assert.equal((await finished(f.client, retry.data.requestId)).at(-1).status, 'completed')
  assert.equal(f.commonsSearches(), 1)
  assert.ok((await outlines.snapshot(f.id)).proposals.at(-1).imageReview.every(i => i.status === 'prepared'))
})

test('unresolved sources remain visible after a single repair pass without an endless request', {
  timeout: 45000,
}, async t => {
  const f = await fixture(t, { pexels: false })
  assert.equal((await finished(f.client, f.requestId)).at(-1).status, 'completed')
  assert.equal(runs(f.log).length, 2)
  const current = (await new OutlineClient(f.app.origin, f.app.token).snapshot(f.id)).proposals.at(-1)
  assert.ok(current.imageReview.every(i => i.status === 'unavailable' && i.attempts.length === 2))
  assert.equal((await new BriefClient(f.app.origin, f.app.token).interview(f.id)).state.blockers.length, 2)
})

test('Stop during image recovery keeps the staged Brief and Outline uncommitted', { timeout: 45000 }, async t => {
  const f = await fixture(t, { pause: true })
  await waitFor(() => runs(f.log).length === 2)
  await f.client.stop(f.requestId)
  assert.equal((await finished(f.client, f.requestId)).at(-1).status, 'stopped')
  assert.equal((await new BriefClient(f.app.origin, f.app.token).snapshot(f.id)).version, 0)
  assert.equal((await new OutlineClient(f.app.origin, f.app.token).snapshot(f.id)).currentId, null)
})
