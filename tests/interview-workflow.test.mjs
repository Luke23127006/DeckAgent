import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startApp, finished, runs, waitFor, MemoryCredentials } from './fixtures/b02-helpers.mjs'
import { BriefClient, OutlineClient } from '../packages/client/runtime/lib/index.js'
import { brief } from './fixtures/brief.mjs'

test('Create deck collects known answers, persists one request at a time and skip never grants sources', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'interview-workflow-'))
  const f = await startApp(dir, {
    options: { providerAccess: { check: async () => {}, catalog: async () => ['model-a'] } },
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
  const known = brief()
  delete known.durationMinutes
  delete known.purpose
  known.answers = [{ topic: 'images', value: 'No images' }]
  known.sources.material = false
  await writeFile(`${f.log}.workflow.json`, JSON.stringify({ brief: known }))
  const request = await f.call('requests', 'POST', {
    sessionId: id,
    input: 'Explain Hoa Sen to students in Vietnamese [workflow]',
    deck: { action: 'collect', expectedBriefVersion: 0, expectedOutline: null },
  })
  assert.equal(request.status, 202)
  assert.equal((await finished(f.client, request.data.requestId)).at(-1).status, 'completed')
  const view = (await f.call(`sessions/${id}/interview`)).data
  assert.deepEqual(
    view.state.questions.map(q => q.topic),
    ['duration', 'purpose', 'sources'],
  )
  assert.equal(view.brief.version, 1)
  assert.equal((await f.call(`sessions/${id}/outline`)).data.currentId, null)
  const skipped = await f.call('requests', 'POST', {
    sessionId: id,
    input: 'Skip',
    deck: { action: 'skip', expectedBriefVersion: 1, expectedOutline: null },
  })
  assert.equal(skipped.status, 202)
  await finished(f.client, skipped.data.requestId)
  const after = (await f.call(`sessions/${id}/interview`)).data
  assert.deepEqual(
    after.state.questions.map(q => q.topic),
    ['sources'],
  )
  assert.equal(after.brief.current.draft.sources.modelKnowledge, false)
  assert.equal(after.brief.current.draft.sources.publicResearch, false)
  assert.ok(after.brief.current.draft.assumptions.some(a => a.includes('duration')))
  assert.equal(runs(f.log).length, 1)
  assert.equal((await f.call(`sessions/${id}/brief`)).data.version, 2)
})

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'review-workflow-'))
  const options = { providerAccess: { check: async () => {}, catalog: async () => ['model-a'] } }
  const credentials = new MemoryCredentials()
  let f = await startApp(dir, { options, credentials })
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
  const full = brief()
  full.proposedSlideCount = 2
  full.purpose = 'Explain the project'
  full.sources.material = false
  full.sources.modelKnowledge = true
  full.answers = [{ topic: 'images', value: 'No images' }]
  const plan = {
    overview: 'Initial plan',
    revisionSuggestions: ['Add an example'],
    slides: [
      { title: 'Intro', content: 'Explain purpose', blocks: [{ kind: 'bullets', items: ['Purpose'] }], sources: [] },
      { title: 'Summary', content: 'Summarize', blocks: [{ kind: 'bullets', items: ['Takeaway'] }], sources: [] },
    ],
  }
  const write = value => writeFile(`${f.log}.workflow.json`, JSON.stringify(value))
  const send = async (action, version, outline, extra = {}, input = '[workflow]') => {
    const sent = await f.call('requests', 'POST', {
      sessionId: id,
      input,
      deck: {
        action,
        expectedBriefVersion: version,
        expectedOutline: outline ? { outlineId: outline.outlineId, version: outline.version } : null,
        ...extra,
      },
    })
    assert.equal(sent.status, 202, JSON.stringify(sent.data))
    return { id: sent.data.requestId, events: await finished(f.client, sent.data.requestId) }
  }
  return {
    get f() {
      return f
    },
    dir,
    id,
    full,
    plan,
    write,
    send,
    async restart() {
      await f.app.close()
      f = await startApp(dir, { options, credentials })
    },
  }
}

test('image providers cannot be silently changed by a staged Brief or Outline', async t => {
  const x = await fixture(t)
  const draft = { ...x.full, template: { id: 'html-basic', version: 2 },
    images: { mode: 'public-research', provider: 'commons', attachmentIds: [], unmetRequirements: [] } }
  const choice = { imageChoice: 'public-research', imageProviderChoice: 'tavily',
    sourceChoice: { material: false, modelKnowledge: true, publicResearch: false } }
  await x.write({ brief: draft, outline: x.plan })
  const rejected = await x.send('collect', 0, null, choice)
  assert.equal(rejected.events.at(-1).status, 'failed')
  assert.equal((await x.f.call(`sessions/${x.id}/brief`)).data.version, 0)
  const tavily = { ...draft, images: { ...draft.images, provider: 'tavily' } }
  const plan = structuredClone(x.plan)
  plan.slides[0].blocks.push({ kind: 'web-image', query: 'forest', provider: 'commons' })
  await x.write({ brief: tavily, outline: plan })
  const invalidOutline = await x.send('collect', 0, null, choice)
  assert.equal(invalidOutline.events.at(-1).status, 'failed')
  assert.equal((await x.f.call(`sessions/${x.id}/outline`)).data.currentId, null)
})

test('web images require an explicit image choice and do not enable text research', async t => {
  const x = await fixture(t)
  const draft = { ...x.full, images: { mode: 'public-research', attachmentIds: [], unmetRequirements: [] } }
  await x.write({ brief: draft, outline: x.plan })
  const sourceChoice = { material: false, modelKnowledge: true, publicResearch: false }
  await x.send('collect', 0, null, { sourceChoice })
  assert.equal((await x.f.call(`sessions/${x.id}/brief`)).data.version, 0)
  const accepted = await x.send('collect', 0, null, { sourceChoice, imageChoice: 'public-research' })
  const current = (await x.f.call(`sessions/${x.id}/brief`)).data.current
  assert.ok(current, JSON.stringify(accepted.events.filter(e => e.kind === 'text')))
  const saved = current.draft
  assert.equal(saved.images.mode, 'public-research')
  assert.equal(saved.sources.publicResearch, false)
})

test('Brief tool repairs schema errors in the same request and keeps an unknown duration as an Interview question', async t => {
  const x = await fixture(t)
  await x.write({
    brief: { ...x.full, requestedFormat: 'HTML', durationMinutes: null, themeOverrides: null },
    repairBrief: true,
  })
  const run = await x.send('collect', 0, null, {
    sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
  })
  assert.equal(run.events.at(-1).status, 'completed', JSON.stringify(run.events))
  const view = await new BriefClient(x.f.app.origin, x.f.app.token).interview(x.id)
  assert.equal(view.brief.version, 1)
  assert.equal(view.brief.current.draft.durationMinutes, undefined)
  assert.deepEqual(
    view.state.questions.map(q => q.topic),
    ['duration'],
  )
  assert.equal(view.brief.current.draft.sources.publicResearch, false)
  assert.equal((await new OutlineClient(x.f.app.origin, x.f.app.token).snapshot(x.id)).proposals.length, 0)
  assert.equal(runs(x.f.log).length, 1)
})

test('a repaired Brief proceeds to a seven-slide Outline without changing user-selected visuals or sources', async t => {
  const x = await fixture(t)
  const draft = {
    ...x.full,
    proposedSlideCount: 7,
    template: { id: 'html-basic', version: 2 },
    requestedFormat: 'HTML',
    themeOverrides: { 'color.accent': '#123456' },
  }
  const plan = {
    ...x.plan,
    slides: Array.from({ length: 7 }, (_, i) => ({ ...x.plan.slides[0], title: `Part ${i + 1}` })),
  }
  await x.write({ brief: draft, outline: plan, repairBrief: true })
  const run = await x.send('collect', 0, null, {
    sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
  })
  assert.equal(run.events.at(-1).status, 'completed', JSON.stringify(run.events))
  const outline = (await new OutlineClient(x.f.app.origin, x.f.app.token).snapshot(x.id)).proposals[0]
  assert.equal(outline.slides.length, 7)
  assert.deepEqual(outline.brief.draft.template, { id: 'html-basic', version: 2 })
  assert.equal(outline.brief.draft.durationMinutes, 10)
  assert.equal(outline.brief.design.theme['color.accent'], '#123456')
  assert.equal(outline.brief.draft.sources.publicResearch, false)
  assert.equal((await x.f.call(`sessions/${x.id}/deck`)).data.slides.length, 0)
})

test('Brief repair exhaustion closes the request and preserves earlier Brief and Outline history', async t => {
  const x = await fixture(t)
  const choices = { sourceChoice: { material: false, modelKnowledge: true, publicResearch: false } }
  await x.write({ brief: x.full, outline: x.plan })
  await x.send('collect', 0, null, choices)
  const client = new BriefClient(x.f.app.origin, x.f.app.token),
    outlines = new OutlineClient(x.f.app.origin, x.f.app.token)
  const before = await client.snapshot(x.id),
    oldOutline = await outlines.snapshot(x.id)
  const bad = { ...x.full, requestedFormat: 'HTML', themeOverrides: null }
  await x.write({ briefAttempts: [x.full, bad, bad, bad, x.full], outline: x.plan })
  const run = await x.send('revise', 1, oldOutline.proposals[0], choices)
  assert.equal(run.events.at(-1).status, 'failed')
  assert.equal(run.events.at(-1).errorCode, 'BRIEF_REPAIR_LIMIT')
  assert.deepEqual(await client.snapshot(x.id), before)
  assert.deepEqual(await outlines.snapshot(x.id), oldOutline)
  const errors = run.events
    .filter(e => e.kind === 'text')
    .map(e => {
      try {
        return JSON.parse(e.text)
      } catch {
        return undefined
      }
    })
    .filter(v => v?.repair)
  assert.deepEqual(
    errors.slice(0, 3).map(e => e.repair.remaining),
    [2, 1, 0],
  )
  assert.ok(errors.slice(2).every(e => e.code === 'BRIEF_REPAIR_LIMIT'))
  const recovered = await x.send('question', 1, oldOutline.proposals[0], {}, 'What is in this Outline?')
  assert.equal(recovered.events.at(-1).status, 'completed')
})

test('a failed Brief repair cannot reuse an earlier staged Brief to bypass source permissions', async t => {
  const x = await fixture(t)
  await x.write({
    briefAttempts: [x.full, { ...x.full, sources: { ...x.full.sources, publicResearch: true } }],
    outline: x.plan,
  })
  const run = await x.send('collect', 0, null, {
    sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
  })
  assert.equal(run.events.at(-1).status, 'failed')
  const text = run.events
    .filter(e => e.kind === 'text')
    .map(e => e.text)
    .join('\n')
  assert.match(text, /SOURCE_CHOICE_REQUIRED/)
  assert.match(text, /BRIEF_INCOMPLETE/)
  assert.equal((await new BriefClient(x.f.app.origin, x.f.app.token).snapshot(x.id)).version, 0)
  assert.equal((await new OutlineClient(x.f.app.origin, x.f.app.token).snapshot(x.id)).proposals.length, 0)
})

test('full interview creates only an Outline, revisions keep history, and pure questions/clarification cannot mutate it', async t => {
  const x = await fixture(t)
  await x.write({ brief: x.full, outline: x.plan })
  const made = await x.send('collect', 0, null, {
    sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
  })
  assert.equal(made.events.at(-1).status, 'completed')
  const read = () => new OutlineClient(x.f.app.origin, x.f.app.token).snapshot(x.id)
  const first = (await read()).proposals[0]
  assert.equal(first.brief.version, 1)
  assert.deepEqual(first.slides[0].blocks, x.plan.slides[0].blocks)
  assert.equal((await x.f.call(`sessions/${x.id}/deck`)).data.slides.length, 0)
  const view = await new BriefClient(x.f.app.origin, x.f.app.token).interview(x.id)
  assert.equal(view.state.readyForOutline, true)
  for (const action of ['question', 'clarify']) {
    // The fake model deliberately tries to stage the same payload; read-only actions deny both tools.
    assert.equal((await x.send(action, 1, first)).events.at(-1).status, 'completed')
    assert.deepEqual((await read()).proposals[0], first)
    assert.equal((await x.f.call(`sessions/${x.id}/brief`)).data.version, 1)
  }
  await x.write({})
  assert.equal(
    (await x.send('revise', 1, first, {}, 'Why is this the first slide? [workflow]')).events.at(-1).status,
    'completed',
  )
  assert.equal((await read()).proposals.length, 1)
  assert.equal((await x.f.call(`sessions/${x.id}/brief`)).data.version, 1)
  const revised = {
    ...x.plan,
    overview: 'Reordered',
    slides: [
      { ...x.plan.slides[1], slideId: first.slides[1].slideId },
      { ...x.plan.slides[0], slideId: first.slides[0].slideId },
    ],
  }
  const changed = { ...x.full, audience: 'Teachers', requirements: [...x.full.requirements, 'Explain briefly'] }
  await x.write({ brief: changed, outline: revised })
  assert.equal((await x.send('revise', 1, first)).events.at(-1).status, 'completed')
  const next = (await read()).proposals.at(-1)
  assert.deepEqual(next.changes.briefFields, ['audience', 'requirements'])
  assert.equal(next.changes.orderChanged, true)
  assert.equal(next.changes.overviewChanged, true)
  assert.equal(next.previousOutlineId, first.outlineId)
  await x.restart()
  assert.equal((await read()).proposals[0].brief.draft.audience, x.full.audience)
  const restored = await x.send(
    'restore',
    2,
    next,
    { restoreOutlineId: first.outlineId },
    'Use the first proposal again',
  )
  assert.equal(restored.events.at(-1).status, 'completed')
  const saved = (await read()).proposals
  assert.equal(saved.length, 3)
  assert.equal(saved[2].restoredFrom, first.outlineId)
  assert.deepEqual(
    saved[2].slides.map(s => s.slideId),
    first.slides.map(s => s.slideId),
  )
  assert.equal(saved[2].brief.version, 3)
  assert.equal(saved[2].brief.draft.audience, x.full.audience)
  assert.equal((await x.f.call(`sessions/${x.id}/deck`)).data.slides.length, 0)
})

test('failed or stopped models discard staged Brief, source escalation is refused, and unsupported requests stay unresolved', async t => {
  const x = await fixture(t)
  await x.write({ brief: x.full })
  const denied = await x.send('collect', 0, null)
  assert.equal(denied.events.at(-1).status, 'failed')
  assert.equal((await x.f.call(`sessions/${x.id}/brief`)).data.version, 0)
  const failed = await x.send(
    'collect',
    0,
    null,
    { sourceChoice: { material: false, modelKnowledge: true, publicResearch: false } },
    '[workflow] [auth]',
  )
  assert.equal(failed.events.at(-1).status, 'failed')
  assert.equal((await x.f.call(`sessions/${x.id}/brief`)).data.version, 0)
  const hanging = await x.f.call('requests', 'POST', {
    sessionId: x.id,
    input: '[workflow] [hang]',
    deck: {
      action: 'collect',
      expectedBriefVersion: 0,
      expectedOutline: null,
      sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
    },
  })
  await waitFor(async () => (await x.f.client.snapshot(hanging.data.requestId)).text.includes('readyForOutline'))
  await x.f.client.stop(hanging.data.requestId)
  assert.equal((await x.f.call(`sessions/${x.id}/brief`)).data.version, 0)
  const unsupported = { ...x.full, requestedFormat: 'pptx' }
  delete unsupported.generationFormat
  await x.write({ brief: unsupported })
  assert.equal(
    (
      await x.send('collect', 0, null, {
        sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
      })
    ).events.at(-1).status,
    'completed',
  )
  const before = (await x.f.call(`sessions/${x.id}/brief`)).data
  assert.equal(before.current.design, null)
  assert.equal(
    (await new BriefClient(x.f.app.origin, x.f.app.token).interview(x.id)).state.blockers[0].code,
    'FORMAT_UNAVAILABLE',
  )
  await x.write({ brief: x.full, outline: x.plan })
  assert.equal((await x.send('collect', 1, null)).events.at(-1).status, 'failed')
  assert.deepEqual((await x.f.call(`sessions/${x.id}/brief`)).data, before)
  assert.equal((await x.send('collect', 1, null, { formatChoice: 'html' })).events.at(-1).status, 'completed')
})

test('an essential image requirement remains blocked until the user chooses the same resolution the model stages', async t => {
  const x = await fixture(t)
  const unavailable = {
    ...x.full,
    images: { mode: 'unavailable', attachmentIds: [], unmetRequirements: ['Need a newly generated photo'] },
  }
  await x.write({ brief: unavailable })
  const choice = { sourceChoice: { material: false, modelKnowledge: true, publicResearch: false } }
  assert.equal((await x.send('collect', 0, null, choice)).events.at(-1).status, 'completed')
  const client = new BriefClient(x.f.app.origin, x.f.app.token)
  assert.ok((await client.interview(x.id)).state.blockers.some(b => b.code === 'IMAGES_UNAVAILABLE'))
  await x.write({ brief: x.full, outline: x.plan })
  assert.equal((await x.send('collect', 1, null)).events.at(-1).status, 'failed')
  assert.equal((await x.send('collect', 1, null, { imageChoice: 'attachments' })).events.at(-1).status, 'failed')
  assert.equal((await client.snapshot(x.id)).version, 1)
  await x.write({ brief: x.full, outline: x.plan, expectedImageChoice: 'none' })
  assert.equal((await x.send('collect', 1, null, { imageChoice: 'none' })).events.at(-1).status, 'completed')
  assert.equal((await client.snapshot(x.id)).version, 2)
})
