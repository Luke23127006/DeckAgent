import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BriefClient, OutlineClient } from '../apps/web/lib/browser/index.js'
import { startApp, finished } from './fixtures/b02-helpers.mjs'
import { brief } from './fixtures/brief.mjs'

const longBullet =
  'Rừng và đại dương đều là những môi trường tự nhiên quan trọng, nuôi dưỡng sự sống và giữ cân bằng cho Trái Đất.'
const shortBullet = 'Rừng và đại dương nuôi dưỡng sự sống, góp phần giữ cân bằng môi trường.'
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'layout-review-http-'))
  let searches = 0
  const f = await startApp(dir, {
    options: {
      providerAccess: { check: async () => {}, catalog: async () => ['model-a'] },
      imageAccess: {
        fetch: async () => {
          searches++
          return Response.json({ query: { pages: [] } })
        },
      },
    },
  })
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
    template: { id: 'html-basic', version: 3 },
    purpose: 'Explain',
    proposedSlideCount: 1,
    sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
    images: { mode: 'public-research', provider: 'commons', attachmentIds: [], unmetRequirements: [] },
    answers: [{ topic: 'images', value: 'Two ecosystem illustrations' }],
  }
  const plan = {
    overview: 'Ecosystems',
    revisionSuggestions: [],
    slides: [
      {
        title: 'Rừng và đại dương',
        content: 'Hai hệ sinh thái',
        sources: [],
        blocks: [
          { kind: 'web-image', query: 'forest', caption: 'Rừng', required: false },
          { kind: 'web-image', query: 'ocean', caption: 'Đại dương', required: false },
          { kind: 'bullets', items: [longBullet] },
        ],
      },
    ],
  }
  const corrected = structuredClone(plan)
  corrected.slides[0].blocks[2].items[0] = shortBullet
  return {
    ...f,
    id,
    draft,
    plan,
    corrected,
    searches: () => searches,
    send: () =>
      f.call('requests', 'POST', {
        sessionId: id,
        input: 'Tạo bài trình bày [workflow]',
        deck: {
          action: 'collect',
          expectedBriefVersion: 0,
          expectedOutline: null,
          imageChoice: 'public-research',
          imageProviderChoice: 'commons',
          sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
        },
      }),
  }
}

test('staging reports exact layout capacity and the model repairs it before any image search or proposal save', {
  timeout: 45000,
}, async t => {
  const f = await fixture(t)
  await writeFile(
    `${f.log}.workflow.json`,
    JSON.stringify({ brief: f.draft, outline: f.plan, repairOutline: true, repairedOutline: f.corrected }),
  )
  const sent = await f.send()
  assert.equal(sent.status, 202)
  const events = await finished(f.client, sent.data.requestId)
  assert.equal(events.at(-1).status, 'completed', JSON.stringify(events))
  const errors = events
    .filter(e => e.kind === 'text')
    .map(e => {
      try {
        return JSON.parse(e.text)
      } catch {
        return null
      }
    })
    .filter(v => v?.code === 'DESIGN_LAYOUT_INCOMPATIBLE')
  assert.equal(errors[0]?.issues[0].path, 'slides[0].blocks[2].items[0]')
  assert.equal(errors[0]?.issues[0].actual, 111)
  assert.equal(errors[0]?.issues[0].limit, 90)
  assert.equal(errors[0]?.repair.remaining, 2)
  const snapshot = await new OutlineClient(f.app.origin, f.app.token).snapshot(f.id)
  assert.equal(snapshot.proposals.length, 1)
  assert.equal(snapshot.proposals[0].slides[0].blocks[2].items[0], shortBullet)
  assert.deepEqual(
    snapshot.proposals[0].slides[0].blocks
      .slice(0, 2)
      .map(b => Object.fromEntries(Object.entries(b).filter(([key]) => key !== 'provider'))),
    f.plan.slides[0].blocks.slice(0, 2),
  )
  assert.equal(f.searches(), 2, 'Only the accepted Outline spends its two image searches')
})

test('unrepaired or exhausted layout staging ends with its actual error and commits no invalid proposal', {
  timeout: 45000,
}, async t => {
  const f = await fixture(t)
  for (const exhausted of [false, true]) {
    await writeFile(
      `${f.log}.workflow.json`,
      JSON.stringify({
        brief: f.draft,
        ...(exhausted ? { outlineAttempts: [f.plan, f.plan, f.plan, f.corrected] } : { outline: f.plan }),
      }),
    )
    const sent = await f.send()
    assert.equal(sent.status, 202)
    const events = await finished(f.client, sent.data.requestId)
    assert.equal(events.at(-1).status, 'failed', JSON.stringify(events))
    assert.equal(events.at(-1).errorCode, exhausted ? 'OUTLINE_REPAIR_LIMIT' : 'DESIGN_LAYOUT_INCOMPATIBLE')
    assert.equal((await new BriefClient(f.app.origin, f.app.token).snapshot(f.id)).version, 0)
    assert.equal((await new OutlineClient(f.app.origin, f.app.token).snapshot(f.id)).currentId, null)
  }
  assert.equal(f.searches(), 0, 'Invalid content never starts image search')
})
