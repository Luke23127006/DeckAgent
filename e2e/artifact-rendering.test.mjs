import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { DeckStore } from '@deckagent/deck'
import { ConfirmationClient, DeckClient, ManagementClient } from '../apps/web/tests/fixtures/browser-driver.mjs'
import { brief } from '../packages/presentation/deck/tests/fixtures/brief.mjs'
import { startApp, finished, waitFor, MemoryCredentials } from '../apps/host/tests/fixtures/b02-helpers.mjs'

test('real local renderer blocks malicious, out-of-theme, missing and overflowing content without replacing the published revision', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'artifact-render-'))
  let verified = false
  const runtime = {
    async prepare() {
      return {
        selection: { provider: 'fixture', model: 'model' },
        async start(run) {
          const cap = run.presentation,
            slideId = cap.plan().outline.slides[0].slideId
          const good = '<h1>Purpose</h1><ul><li>Explain</li></ul>'
          const stage = cap.begin(slideId, 'title-body')
          cap.append(stage.stageId, { sequence: 0, text: good, final: true })
          await cap.publish({ stageId: stage.stageId, slideId, publicationId: 'good', expectedRevision: 0 })
          for (const [html, code] of [
            ['<h1 onclick="alert(1)">Purpose</h1><p>Explain</p>', 'ARTIFACT_UNSAFE_HTML'],
            ['<svg><script>alert(1)</script></svg>', 'ARTIFACT_UNSAFE_HTML'],
            [
              '<style>@import "https://example.test/x.css";</style><h1>Purpose</h1><p>Explain</p>',
              'ARTIFACT_UNSAFE_CSS',
            ],
            ['<h1 style="color:red">Purpose</h1><p>Explain</p>', 'ARTIFACT_THEME_MISMATCH'],
            ['<h1>Purpose</h1><img src="data:image/svg+xml,bad"><p>Explain</p>', 'ARTIFACT_ASSET_INVALID'],
            ['<h1>Purpose</h1><p>Other content</p>', 'ARTIFACT_REQUIRED_CONTENT_MISSING'],
            ['<div style="position:absolute;left:1600px"><h1>Purpose</h1><p>Explain</p></div>', 'ARTIFACT_OVERFLOW'],
          ]) {
            const next = cap.begin(slideId, 'title-body')
            cap.append(next.stageId, { sequence: 0, text: html, final: true })
            await assert.rejects(
              cap.publish({ stageId: next.stageId, slideId, publicationId: `bad-${code}`, expectedRevision: 1 }),
              { code },
            )
            cap.discard(next.stageId)
          }
          verified = true
          return { status: 'completed' }
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
  const decks = new DeckStore(join(dir, 'data', 'db', 'decks.sqlite'))
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
  const sent = await new ConfirmationClient(f.app.origin, f.app.token).confirm(id, target)
  const events = await finished(f.client, sent.receipt.requestId)
  assert.equal(events.at(-1).status, 'completed', JSON.stringify(events.at(-1)))
  assert.equal(verified, true)
  const client = new DeckClient(f.app.origin, f.app.token)
  const state = await client.snapshot(id)
  assert.equal(state.generation.state, 'generated')
  assert.equal(state.slides[0].revision, 1)
  const content = await client.content(id, p.slides[0].slideId, 1)
  assert.match(content.html, /Explain/)
  assert.match(content.html, /img-src data:/)
})

test('a prepared PNG and its result survive a Session terminal-write failure and Host restart without replay', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'artifact-image-host-'))
  let starts = 0
  let attachmentId
  const runtime = {
    async prepare() {
      return {
        selection: { provider: 'test', model: 'model-a' },
        async start(run) {
          starts++
          const cap = run.presentation,
            slideId = cap.plan().outline.slides[0].slideId
          const stage = cap.begin(slideId, 'image-text')
          const asset = await cap.image(stage.stageId, slideId, attachmentId)
          cap.append(stage.stageId, {
            sequence: 0,
            text: `<h1>Purpose</h1><p>Explain</p><img src="asset:${asset.assetId}" alt="Prepared image" style="width:80px;height:80px">`,
            final: true,
          })
          await cap.publish({ stageId: stage.stageId, slideId, publicationId: 'image', expectedRevision: 0 })
          return { status: 'completed' }
        },
      }
    },
  }
  const options = {
    generationRuntime: runtime,
    providerAccess: { check: async () => {}, catalog: async () => ['model-a'] },
  }
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
    expectedVersion: (await f.call('settings')).data.providersVersion,
  })
  const id = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data.sessionId
  const management = new ManagementClient(f.app.origin, f.app.token)
  const bytes = await readFile(new URL('../apps/host/tests/fixtures/attachments/sample.png', import.meta.url))
  const upload = await management.uploadAttachment(id, new File([bytes], 'image.png'), 0)
  attachmentId = upload.attachment.attachmentId
  await waitFor(async () => (await f.call(`sessions/${id}/attachments/${attachmentId}`)).data.state === 'ready')
  const chatDraft = await management.draftState(id)
  const admitted = await f.client.send({
    sessionId: id,
    input: '',
    attachmentIds: [attachmentId],
    draftRevision: chatDraft.revision,
  })
  await finished(f.client, admitted.requestId)
  const ref = (await f.client.history(id))[0].attachments[0].source
  const source = { sourceId: ref.sourceId, version: ref.version, kind: 'attachment' }
  const decks = new DeckStore(join(dir, 'data', 'db', 'decks.sqlite'))
  const draft = brief()
  draft.sources.modelKnowledge = true
  draft.sources.refs = [source]
  draft.proposedSlideCount = 1
  draft.purpose = 'Explain'
  draft.images = { mode: 'attachments', attachmentIds: [attachmentId], unmetRequirements: [] }
  const b = decks.saveBrief(id, { expectedVersion: 0, draft })
  const p = decks.proposeBoundOutline(id, {
    requestId: 'review-image',
    responseIndex: 3,
    expectedOutline: null,
    expectedBrief: { briefId: b.briefId, version: 1 },
    draft: {
      overview: 'Image plan',
      revisionSuggestions: [],
      slides: [
        {
          title: 'Purpose',
          content: 'Explain',
          blocks: [
            { kind: 'bullets', items: ['Explain'] },
            { kind: 'image', attachmentId },
          ],
          sources: [source],
        },
      ],
    },
  })
  decks.close()
  const target = {
    confirmationId: 'image-confirm',
    outlineId: p.outlineId,
    outlineVersion: 1,
    briefId: b.briefId,
    briefVersion: 1,
  }
  const fault = new DatabaseSync(join(dir, 'data', 'db', 'sessions.sqlite'))
  fault.exec(
    "CREATE TRIGGER fail_terminal BEFORE UPDATE OF status ON requests WHEN NEW.status='completed' BEGIN SELECT RAISE(ABORT,'fault'); END",
  )
  fault.close()
  const result = await new ConfirmationClient(f.app.origin, f.app.token).confirm(id, target)
  await waitFor(
    async () => (await new DeckClient(f.app.origin, f.app.token).snapshot(id)).generation.state === 'generated',
  )
  assert.equal((await f.client.snapshot(result.receipt.requestId)).status, 'active')
  const first = await new DeckClient(f.app.origin, f.app.token).content(id, p.slides[0].slideId, 1)
  assert.match(first.html, /data:image\/png;base64,/)
  assert.equal(first.html.includes('files/decks'), false)
  await f.app.close()
  f = await startApp(dir, { options, credentials })
  assert.equal(starts, 1)
  assert.equal((await f.client.snapshot(result.receipt.requestId)).status, 'interrupted')
  assert.deepEqual(await new DeckClient(f.app.origin, f.app.token).content(id, p.slides[0].slideId, 1), first)
})

test('managed local renderer reuses one profile directory across renders and removes it on app close', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'artifact-reuse-'))
  let entriesDuringRun = []
  const runtime = {
    async prepare() {
      return {
        selection: { provider: 'fixture', model: 'model' },
        async start(run) {
          const cap = run.presentation
          const slideId = cap.plan().outline.slides[0].slideId
          for (let revision = 0; revision < 2; revision++) {
            const stage = cap.begin(slideId, 'title-body')
            cap.append(stage.stageId, {
              sequence: 0,
              text: `<h1>Purpose</h1><ul><li>Explain ${revision}</li></ul>`,
              final: true,
            })
            await cap.publish({
              stageId: stage.stageId,
              slideId,
              publicationId: `reuse-${revision}`,
              expectedRevision: revision,
            })
          }
          entriesDuringRun = await readdir(join(dir, 'data', 'files', 'runtime', 'artifact-check'))
          return { status: 'completed' }
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
  const decks = new DeckStore(join(dir, 'data', 'db', 'decks.sqlite'))
  const draft = brief()
  draft.sources.material = false
  draft.sources.modelKnowledge = true
  draft.proposedSlideCount = 1
  draft.purpose = 'Explain'
  draft.answers = [{ topic: 'images', value: 'None' }]
  const b = decks.saveBrief(id, { expectedVersion: 0, draft })
  const p = decks.proposeBoundOutline(id, {
    requestId: 'reuse-review',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: b.briefId, version: 1 },
    draft: {
      overview: 'Reuse plan',
      revisionSuggestions: [],
      slides: [
        { title: 'Purpose', content: 'Explain', blocks: [{ kind: 'bullets', items: ['Explain'] }], sources: [] },
      ],
    },
  })
  decks.close()
  await new ConfirmationClient(f.app.origin, f.app.token).confirm(id, {
    confirmationId: 'reuse-confirm',
    outlineId: p.outlineId,
    outlineVersion: 1,
    briefId: b.briefId,
    briefVersion: 1,
  })
  await waitFor(
    async () => (await new DeckClient(f.app.origin, f.app.token).snapshot(id)).generation.state === 'generated',
  )
  assert.equal(entriesDuringRun.filter(name => name.startsWith('render-')).length, 1)
  await f.app.close()
  const entriesAfterClose = await readdir(join(dir, 'data', 'files', 'runtime', 'artifact-check'))
  assert.deepEqual(entriesAfterClose, [])
})
