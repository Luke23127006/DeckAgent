import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, readdir, writeFile, readFile, mkdir, symlink } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckService, DeckError } from '../packages/presentation/deck/lib/index.js'
import { HtmlFormatAdapter } from '../packages/presentation/html/lib/index.js'
import { createHash } from 'node:crypto'
import { brief } from './fixtures/brief.mjs'

async function fixture(t, options = {}, image) {
  const dir = await mkdtemp(join(tmpdir(), 'artifact-publication-'))
  let active = true
  const closeAfter = []
  const decks = new DeckService(join(dir, 'deck.sqlite'), {
    formats: [new HtmlFormatAdapter()],
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
  if (image?.web) {
    draft.images = { mode: 'public-research', attachmentIds: [], unmetRequirements: [] }
  } else if (image) {
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
            ...(image?.web
              ? [{ kind: 'web-image', query: 'solar energy', required: image.required !== false }]
              : image
                ? [{ kind: 'image', attachmentId: image.attachmentId }]
                : []),
          ],
          sources: image && !image.web ? [image.source] : [],
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

test('public image bytes and attribution survive reopen; missing essential images never publish', async t => {
  const bytes = await readFile(new URL('./fixtures/attachments/sample.png', import.meta.url))
  const digest = createHash('sha256').update(bytes).digest('hex')
  let calls = 0
  const credit = {
    url: 'https://commons.wikimedia.org/wiki/File:Example.png',
    author: 'Fixture author',
    license: 'CC BY',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    unknownLicense: false,
    retrievedAt: '2026-11-21T00:00:00Z',
  }
  const f = await fixture(
    t,
    {
      researchImage: async () => {
        calls++
        return {
          bytes,
          originalDigest: digest,
          parsedDigest: digest,
          source: { sourceId: 'src-image-fixture', version: 1, kind: 'research' },
          credit,
        }
      },
    },
    { web: true },
  )
  const cap = f.decks.generationCapability(f.grant, new AbortController().signal)
  const slideId = f.p.slides[0].slideId
  const stage = cap.begin(slideId, 'image-text')
  await assert.rejects(cap.researchImage(stage.stageId, slideId, 'unconfirmed query'), {
    code: 'ARTIFACT_ASSET_UNAVAILABLE',
  })
  assert.equal(calls, 0)
  const asset = await cap.researchImage(stage.stageId, slideId, 'solar energy')
  assert.deepEqual(await cap.researchImage(stage.stageId, slideId, 'solar energy'), asset)
  assert.equal(calls, 1)
  cap.append(stage.stageId, {
    sequence: 0,
    final: true,
    text: `<h1>Purpose</h1><ul><li>Explain the purpose</li></ul><img src="asset:${asset.assetId}" alt="Solar">`,
  })
  await cap.publish({ stageId: stage.stageId, slideId, expectedRevision: 0, publicationId: 'web-publish' })
  const reopened = new DeckService(join(f.dir, 'deck.sqlite'), {
    formats: [new HtmlFormatAdapter()],
    artifactRoot: join(f.dir, 'artifacts'),
    renderCheck: async () => {},
    researchImage: async () => {
      throw new Error('must not refetch saved images')
    },
  })
  f.closeAfter.push(reopened)
  const content = reopened.content('chat', slideId, 1)
  assert.deepEqual(content.imageCredits, [credit])
  assert.match(content.html, /data:image\/png;base64,/)
  assert.equal(content.html.includes('https://upload.wikimedia.org'), false)
  const missing = cap.begin(slideId, 'image-text')
  cap.append(missing.stageId, {
    sequence: 0,
    final: true,
    text: '<h1>Purpose</h1><ul><li>Explain the purpose</li></ul>',
  })
  await assert.rejects(
    cap.publish({ stageId: missing.stageId, slideId, expectedRevision: 1, publicationId: 'missing-image' }),
    { code: 'ARTIFACT_ASSET_UNAVAILABLE' },
  )
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 1)
  cap.discard(missing.stageId)
  const unused = cap.begin(slideId, 'image-text')
  await cap.researchImage(unused.stageId, slideId, 'solar energy')
  cap.append(unused.stageId, {
    sequence: 0,
    final: true,
    text: '<h1>Purpose</h1><ul><li>Explain the purpose</li></ul>',
  })
  await assert.rejects(
    cap.publish({ stageId: unused.stageId, slideId, expectedRevision: 1, publicationId: 'unused-image' }),
    { code: 'ARTIFACT_ASSET_INVALID' },
  )
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 1)
})

test('layout retries reuse fetched web images without exhausting the request image budget', async t => {
  const bytes = await readFile(new URL('./fixtures/attachments/sample.png', import.meta.url))
  const digest = createHash('sha256').update(bytes).digest('hex')
  let calls = 0
  let renderCalls = 0
  const f = await fixture(
    t,
    {
      renderCheck: async () => {
        if (renderCalls++ < 4) throw new DeckError('ARTIFACT_OVERFLOW')
      },
      researchImage: async () => {
        calls++
        return {
          bytes,
          originalDigest: digest,
          parsedDigest: digest,
          source: { sourceId: 'src-image-retry', version: 1, kind: 'research' },
          credit: {
            url: 'https://commons.wikimedia.org/wiki/File:Example.png',
            author: 'Fixture author',
            license: 'CC0',
            licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
            unknownLicense: false,
            retrievedAt: '2026-11-21T00:00:00Z',
          },
        }
      },
    },
    { web: true },
  )
  const cap = f.decks.generationCapability(f.grant, new AbortController().signal)
  const slideId = f.p.slides[0].slideId
  let previous
  for (let attempt = 0; attempt < 5; attempt++) {
    const stage = cap.begin(slideId, 'image-text')
    const [image, repeated] = await Promise.all([
      cap.researchImage(stage.stageId, slideId, 'solar energy'),
      cap.researchImage(stage.stageId, slideId, 'solar energy'),
    ])
    assert.equal(repeated.assetId, image.assetId, 'Concurrent identical image calls must register one stage asset')
    assert.notEqual(image.assetId, previous, 'A new stage gets its own managed asset identity')
    previous = image.assetId
    assert.equal(calls, 1, 'Layout retries must not search/download the same image again')
    cap.append(stage.stageId, {
      sequence: 0,
      final: true,
      text: `<h1>Purpose</h1><ul><li>Explain the purpose</li></ul><img src="asset:${image.assetId}" alt="Solar">`,
    })
    if (attempt < 4) {
      await assert.rejects(
        cap.publish({ stageId: stage.stageId, slideId, expectedRevision: 0, publicationId: `overflow-${attempt}` }),
        { code: 'ARTIFACT_OVERFLOW' },
      )
      assert.equal(f.decks.snapshot('chat').slides[0].revision, 0)
      cap.discard(stage.stageId)
    } else {
      await cap.publish({ stageId: stage.stageId, slideId, expectedRevision: 0, publicationId: 'retried-image' })
    }
  }
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 1)
  assert.equal(f.decks.content('chat', slideId, 1).imageCredits[0].author, 'Fixture author')
})

test('an unavailable optional web image is omitted with saved metadata', async t => {
  const f = await fixture(
    t,
    {
      researchImage: async () => {
        throw new Error('offline')
      },
    },
    { web: true, required: false },
  )
  const cap = f.decks.generationCapability(f.grant, new AbortController().signal)
  const slideId = f.p.slides[0].slideId
  const stage = cap.begin(slideId, 'image-text')
  await assert.rejects(cap.researchImage(stage.stageId, slideId, 'solar energy'))
  cap.append(stage.stageId, { sequence: 0, final: true, text: '<h1>Purpose</h1><ul><li>Explain the purpose</li></ul>' })
  await cap.publish({ stageId: stage.stageId, slideId, expectedRevision: 0, publicationId: 'optional-image' })
  assert.deepEqual(f.decks.content('chat', slideId, 1).imageOmissions, ['solar energy'])
})

test('published provenance keeps real locations and rejects facts attributed only to model knowledge', async t => {
  const f = await fixture(t)
  const cap = f.decks.generationCapability(f.grant, new AbortController().signal)
  const slide = f.p.slides[0]
  const stage = cap.begin(slide.slideId, 'title-body')
  assert.throws(
    () => cap.provenance(stage.stageId, [{ text: 'Explain the purpose', kind: 'fact', origin: 'general-knowledge' }]),
    { code: 'PROVENANCE_INVALID' },
  )
  cap.provenance(
    stage.stageId,
    [{ text: 'Explain the purpose', kind: 'wording', origin: 'general-knowledge' }],
    'Explain the purpose to the audience with a concrete example.',
  )
  cap.append(stage.stageId, { sequence: 0, text: '<h1>Purpose</h1><p>Explain the purpose</p>', final: true })
  await cap.publish({
    stageId: stage.stageId,
    slideId: slide.slideId,
    expectedRevision: 0,
    publicationId: 'with-provenance',
  })
  assert.deepEqual(f.decks.content('chat', slide.slideId, 1).provenance, [
    { text: 'Explain the purpose', kind: 'wording', origin: 'general-knowledge' },
  ])
  assert.equal(
    f.decks.content('chat', slide.slideId, 1).notes,
    'Explain the purpose to the audience with a concrete example.',
  )
  assert.equal(f.decks.content('chat', slide.slideId, 1).html.includes('concrete example'), false)
})

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
  const reopened = new DeckService(join(f.dir, 'deck.sqlite'), {
    formats: [new HtmlFormatAdapter()],
    artifactRoot: join(f.dir, 'artifacts'),
  })
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
