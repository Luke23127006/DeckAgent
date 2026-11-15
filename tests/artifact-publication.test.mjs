import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, readdir, writeFile, readFile, mkdir, symlink } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { brief } from './fixtures/brief.mjs'

async function fixture(t, options = {}, image) {
  const dir = await mkdtemp(join(tmpdir(), 'artifact-publication-'))
  let active = true
  const closeAfter = []
  const decks = new DeckService(join(dir, 'deck.sqlite'), {
    activeRequest: () => active,
    artifactRoot: join(dir, 'artifacts'),
    renderCheck: async () => {},
    ...options,
  })
  t.after(async () => {
    decks.close()
    for (const owned of closeAfter) owned.close()
    await rm(dir, { recursive: true, force: true })
  })
  const draft = brief()
  draft.sources.modelKnowledge = true
  draft.proposedSlideCount = 1
  draft.purpose = 'Explain'
  draft.answers = [{ topic: 'images', value: 'None' }]
  if (image) {
    draft.images = { mode: 'attachments', attachmentIds: [image.attachmentId], unmetRequirements: [] }
    draft.sources.refs = [image.source]
  }
  const b = decks.saveBrief('chat', { expectedVersion: 0, draft })
  const p = decks.proposeBoundOutline('chat', {
    requestId: 'review',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: b.briefId, version: 1 },
    draft: {
      overview: 'Plan',
      revisionSuggestions: [],
      slides: [
        {
          title: 'Purpose',
          content: 'Explain the purpose',
          blocks: [
            { kind: 'bullets', items: ['Explain the purpose'] },
            ...(image ? [{ kind: 'image', attachmentId: image.attachmentId }] : []),
          ],
          sources: image ? [image.source] : [],
        },
      ],
    },
  })
  const receipt = decks.confirmGeneration(
    'chat',
    { confirmationId: 'confirm', outlineId: p.outlineId, outlineVersion: 1, briefId: b.briefId, briefVersion: 1 },
    { provider: 'test', model: 'model' },
  )
  decks.admitGeneration('chat', receipt.intentId, receipt.requestId)
  const grant = decks.startGeneration('chat', receipt.intentId, receipt.requestId)
  return {
    dir,
    decks,
    grant,
    p,
    closeAfter,
    stop() {
      active = false
    },
  }
}

test('chunk retries are exact, only finalized validated artifacts publish, and late writes preserve the last-good revision', async t => {
  const f = await fixture(t)
  const slideId = f.p.slides[0].slideId
  const stage = f.decks.beginStage(f.grant, slideId, 'title-body')
  const html = '<h1>Purpose</h1><ul><li>Explain the purpose</li></ul>'
  const chunk = { sequence: 0, text: html, final: true }
  const final = f.decks.appendStage(f.grant, stage.stageId, chunk)
  assert.deepEqual(f.decks.appendStage(f.grant, stage.stageId, chunk), final)
  assert.throws(() => f.decks.appendStage(f.grant, stage.stageId, { ...chunk, text: '<h1>Other</h1>' }), {
    code: 'STAGE_CHUNK_CONFLICT',
  })
  const publication = { stageId: stage.stageId, slideId, publicationId: 'pub-1', expectedRevision: 0 }
  const both = await Promise.all([
    f.decks.publishArtifact(f.grant, publication),
    f.decks.publishArtifact(f.grant, publication),
  ])
  const first = both[0]
  assert.deepEqual(both[1], first)
  assert.deepEqual(f.decks.appendStage(f.grant, stage.stageId, chunk), final)
  assert.deepEqual(await f.decks.publishArtifact(f.grant, publication), first)
  assert.match(f.decks.content('chat', slideId, 1).html, /--color-accent/)
  assert.ok((await readdir(join(f.dir, 'artifacts'))).some(n => n.endsWith('.html')))
  f.stop()
  await assert.rejects(
    f.decks.publishArtifact(f.grant, { ...publication, publicationId: 'late', expectedRevision: 1 }),
    { code: 'GENERATION_REQUEST_INACTIVE' },
  )
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 1)
})

test('foreign grants, partial chunks, bounds, revision conflicts and interrupted rendering cannot publish', async t => {
  let stop
  const f = await fixture(t, {
    renderCheck: async () => {
      if (stop) stop()
    },
  })
  const slideId = f.p.slides[0].slideId
  assert.throws(() => f.decks.beginStage({ ...f.grant }, slideId, 'title-body'), { code: 'GENERATION_GRANT_INVALID' })
  assert.throws(() => f.decks.beginStage(f.grant, 'foreign', 'title-body'), { code: 'DECK_SLIDE_NOT_FOUND' })
  assert.throws(() => f.decks.beginStage(f.grant, slideId, 'custom'), { code: 'DESIGN_LAYOUT_INCOMPATIBLE' })
  const a = f.decks.beginStage(f.grant, slideId, 'title-body')
  const b = f.decks.beginStage(f.grant, slideId, 'title-body')
  assert.throws(() => f.decks.beginStage(f.grant, slideId, 'title-body'), { code: 'STAGE_LIMIT' })
  assert.throws(() => f.decks.appendStage(f.grant, a.stageId, { sequence: 0, text: 'x'.repeat(8193), final: true }), {
    code: 'STAGE_CHUNK_INVALID',
  })
  assert.throws(() => f.decks.appendStage(f.grant, a.stageId, { sequence: 1, text: 'x', final: true }), {
    code: 'STAGE_SEQUENCE_CONFLICT',
  })
  f.decks.appendStage(f.grant, a.stageId, { sequence: 0, text: '<h1>Purpose</h1>', final: false })
  await assert.rejects(
    f.decks.publishArtifact(f.grant, { stageId: a.stageId, slideId, publicationId: 'partial', expectedRevision: 0 }),
    { code: 'STAGE_INCOMPLETE' },
  )
  f.decks.appendStage(f.grant, a.stageId, { sequence: 1, text: '<p>Explain the purpose</p>', final: true })
  await assert.rejects(
    f.decks.publishArtifact(f.grant, { stageId: a.stageId, slideId, publicationId: 'stale', expectedRevision: 1 }),
    { code: 'DECK_CONFLICT' },
  )
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 0)
  f.decks.appendStage(f.grant, b.stageId, {
    sequence: 0,
    text: '<h1>Purpose</h1><p>Explain the purpose</p>',
    final: true,
  })
  stop = () => f.stop()
  await assert.rejects(
    f.decks.publishArtifact(f.grant, { stageId: b.stageId, slideId, publicationId: 'stopped', expectedRevision: 0 }),
    { code: 'GENERATION_REQUEST_INACTIVE' },
  )
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 0)
})

test('metadata commit failure leaves last-good pointers intact; restart removes only managed orphans and detects missing published bytes', async t => {
  const f = await fixture(t)
  const slideId = f.p.slides[0].slideId
  const make = () => {
    const s = f.decks.beginStage(f.grant, slideId, 'title-body')
    f.decks.appendStage(f.grant, s.stageId, {
      sequence: 0,
      text: '<h1>Purpose</h1><p>Explain the purpose</p>',
      final: true,
    })
    return s
  }
  const first = make()
  await f.decks.publishArtifact(f.grant, {
    stageId: first.stageId,
    slideId,
    publicationId: 'first',
    expectedRevision: 0,
  })
  const good = f.decks.content('chat', slideId, 1)
  const db = new DatabaseSync(join(f.dir, 'deck.sqlite'))
  db.exec("CREATE TRIGGER fail_artifact BEFORE INSERT ON artifact_revisions BEGIN SELECT RAISE(ABORT,'fault'); END")
  const second = make()
  await assert.rejects(
    f.decks.publishArtifact(f.grant, {
      stageId: second.stageId,
      slideId,
      publicationId: 'second',
      expectedRevision: 1,
    }),
    { code: 'DECK_STORAGE' },
  )
  assert.deepEqual(f.decks.content('chat', slideId, 1), good)
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 1)
  db.close()
  f.decks.close()
  await writeFile(join(f.dir, 'artifacts', 'keep-user-file.txt'), 'keep')
  const reopened = new DeckService(join(f.dir, 'deck.sqlite'), { artifactRoot: join(f.dir, 'artifacts') })
  f.closeAfter.push(reopened)
  assert.deepEqual(reopened.content('chat', slideId, 1), good)
  const files = await readdir(join(f.dir, 'artifacts'))
  assert.equal(files.filter(f => f.endsWith('.html')).length, 1)
  assert.equal(
    files.some(f => f.endsWith('.part')),
    false,
  )
  assert.ok(files.includes('keep-user-file.txt'))
  await writeFile(
    join(
      f.dir,
      'artifacts',
      files.find(f => f.endsWith('.html')),
    ),
    'corrupt',
  )
  assert.throws(() => reopened.content('chat', slideId, 1), { code: 'ARTIFACT_CORRUPT' })
})

test('managed PNG assets retain provenance, materialize only published bytes and reject foreign attachment identities', async t => {
  const bytes = await readFile(new URL('./fixtures/attachments/sample.png', import.meta.url))
  const attachmentId = 'att-00000000-0000-0000-0000-000000000001'
  const source = { sourceId: 'src-00000000-0000-0000-0000-000000000001', version: 1, kind: 'attachment' }
  const f = await fixture(
    t,
    { preparedImage: async () => ({ bytes, source, originalDigest: 'a'.repeat(64), parsedDigest: 'b'.repeat(64) }) },
    { attachmentId, source },
  )
  const slideId = f.p.slides[0].slideId
  const stage = f.decks.beginStage(f.grant, slideId, 'image-text')
  await assert.rejects(
    f.decks.attachStageImage(
      f.grant,
      stage.stageId,
      slideId,
      'att-00000000-0000-0000-0000-000000000002',
      new AbortController().signal,
    ),
    { code: 'ARTIFACT_ASSET_UNAVAILABLE' },
  )
  const asset = await f.decks.attachStageImage(
    f.grant,
    stage.stageId,
    slideId,
    attachmentId,
    new AbortController().signal,
  )
  assert.deepEqual(asset.source, source)
  assert.equal(asset.originalDigest, 'a'.repeat(64))
  f.decks.appendStage(f.grant, stage.stageId, {
    sequence: 0,
    text: `<h1>Purpose</h1><p>Explain the purpose</p><img src="asset:${asset.assetId}" alt="Attached image">`,
    final: true,
  })
  await f.decks.publishArtifact(f.grant, {
    stageId: stage.stageId,
    slideId,
    publicationId: 'image',
    expectedRevision: 0,
  })
  const html = f.decks.content('chat', slideId, 1).html
  assert.match(html, /data:image\/png;base64,/)
  assert.equal(html.includes(`asset:${asset.assetId}`), false)
})

test('artifact storage refuses a redirected managed parent before creating files inside a project folder', async t => {
  const f = await fixture(t)
  const project = join(f.dir, 'project'),
    redirect = join(f.dir, 'redirect')
  await mkdir(project)
  await writeFile(join(project, 'notes.txt'), 'unchanged source')
  await symlink(project, redirect, process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => new DeckService(join(f.dir, 'deck.sqlite'), { artifactRoot: join(redirect, 'decks') }), {
    code: 'ARTIFACT_STORAGE_UNAVAILABLE',
  })
  assert.deepEqual(await readdir(project), ['notes.txt'])
  assert.equal(await readFile(join(project, 'notes.txt'), 'utf8'), 'unchanged source')
})
