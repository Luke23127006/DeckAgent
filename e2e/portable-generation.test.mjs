import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckStore } from '@deckagent/deck'
import { HtmlFormatAdapter } from '@deckagent/html-format'
import { PptxFormatAdapter, inspectPptx } from '@deckagent/pptx-format'
import { resolveDesign } from '@deckagent/design'
import { brief } from '../packages/presentation/deck/tests/fixtures/brief.mjs'

async function fixture(t, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'portable-generation-'))
  const png = await readFile(new URL('../packages/tools/filesystem/tests/fixtures/attachments/sample.png', import.meta.url))
  const digest = createHash('sha256').update(png).digest('hex')
  let calls = 0
  const config = {
    formats: [new HtmlFormatAdapter()],
    artifactRoot: join(dir, 'artifacts'),
    activeRequest: () => true,
    renderCheck: async () => {},
    researchImage: async () => {
      calls++
      return {
        bytes: png,
        originalDigest: digest,
        parsedDigest: digest,
        source: { sourceId: 'src-web-image', version: 1, kind: 'research' },
        credit: {
          url: 'https://commons.wikimedia.org/wiki/File:Fixture.png',
          author: 'Fixture author',
          license: 'CC BY',
          licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
          unknownLicense: false,
          retrievedAt: '2026-11-22T00:00:00Z',
        },
      }
    },
    ...options,
  }
  let decks = new DeckStore(join(dir, 'deck.sqlite'), config)
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  const input = {
    requestId: 'review',
    responseIndex: 1,
    expectedBriefVersion: 0,
    expectedOutline: null,
    draft: {
      ...brief(),
      template: { id: 'html-basic', version: 2 },
      purpose: 'Explain',
      proposedSlideCount: 1,
      answers: [{ topic: 'images', value: 'Public web images' }],
      sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
      images: { mode: 'public-research', attachmentIds: [], unmetRequirements: [] },
    },
    outline: {
      overview: 'Environment',
      revisionSuggestions: [],
      slides: [
        {
          title: 'Forest and ocean',
          content: 'Environment',
          blocks: [
            { kind: 'web-image', query: 'forest', caption: 'Forest ecosystem' },
            { kind: 'web-image', query: 'ocean', caption: 'Ocean ecosystem' },
          ],
          sources: [],
        },
      ],
    },
  }
  return {
    get decks() {
      return decks
    },
    input,
    png,
    calls: () => calls,
    reopen() {
      decks.close()
      decks = new DeckStore(join(dir, 'deck.sqlite'), config)
    },
  }
}
function target(decks) {
  const p = decks.outlineSnapshot('chat').proposals.at(-1),
    b = decks.briefSnapshot('chat').current
  return {
    confirmationId: 'confirmed',
    outlineId: p.outlineId,
    outlineVersion: p.version,
    briefId: b.briefId,
    briefVersion: b.version,
  }
}
function start(decks) {
  const receipt = decks.confirmGeneration('chat', target(decks), { provider: 'fixture', model: 'model' })
  decks.admitGeneration('chat', receipt.intentId, receipt.requestId)
  const grant = decks.startGeneration('chat', receipt.intentId, receipt.requestId)
  return decks.generationCapability(grant, new AbortController().signal)
}
test('two-image plans prepare before confirmation, retry offline, validate without publishing and reopen exact content', async t => {
  const f = await fixture(t)
  const token = await f.decks.prepareOutlineImages('chat', f.input, new AbortController().signal)
  f.decks.commitBriefProposal('chat', f.input, token)
  assert.equal(f.calls(), 2)
  assert.deepEqual(f.decks.imageBlockers('chat'), [])
  const cap = start(f.decks),
    slideId = cap.plan().outline.slides[0].slideId
  let stage = cap.begin(slideId, 'image-pair')
  assert.equal(stage.document.nodes.filter(n => n.kind === 'image').length, 2)
  cap.provenance(stage.stageId, [
    { kind: 'wording', origin: 'general-knowledge', text: 'Forest and ocean Forest ecosystem Ocean ecosystem' },
  ])
  cap.append(stage.stageId, {
    sequence: 0,
    text: stage.starter.replace('gap:20px', 'border:1px solid red'),
    final: true,
  })
  const issues = await cap.validate({ stageId: stage.stageId, slideId, expectedRevision: 0, publicationId: 'check' })
  assert.ok(issues.some(i => i.path.includes('border')))
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 0)
  cap.discard(stage.stageId)
  stage = cap.begin(slideId, 'image-pair')
  assert.equal(f.calls(), 2)
  assert.throws(() => cap.document(stage.stageId, { ...stage.document, nodes: [] }), {
    code: 'ARTIFACT_ASSET_UNAVAILABLE',
  })
  cap.provenance(
    stage.stageId,
    [
      { kind: 'wording', origin: 'general-knowledge', text: 'Forest and ocean' },
      { kind: 'wording', origin: 'general-knowledge', text: 'Forest ecosystem' },
      { kind: 'wording', origin: 'general-knowledge', text: 'Ocean ecosystem' },
    ],
    'Describe both ecosystems to the audience.',
  )
  cap.append(stage.stageId, { sequence: 0, text: stage.starter, final: true })
  const publication = { stageId: stage.stageId, slideId, expectedRevision: 0, publicationId: 'publish' }
  assert.deepEqual(await cap.validate(publication), [])
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 0)
  const receipt = await cap.publish(publication)
  assert.deepEqual(await cap.publish(publication), receipt)
  const content = f.decks.content('chat', slideId, 1),
    native = f.decks.nativeArtifact('chat', slideId, 1)
  assert.equal(content.document.schemaVersion, 1)
  assert.equal(content.artifact.documentVersion, 1)
  assert.equal(content.imageCredits.length, 2)
  assert.equal(content.document.notes, content.notes)
  assert.match(content.html, /data:image\/png;base64,/)
  f.reopen()
  assert.deepEqual(f.decks.content('chat', slideId, 1), content)
  assert.deepEqual(f.decks.nativeArtifact('chat', slideId, 1), native)
  assert.equal(f.calls(), 2)
})
test('missing essential images block confirmation; explicit optional revision records omissions', async t => {
  const f = await fixture(t, {
    researchImage: async () => {
      throw new Error('unavailable')
    },
  })
  const token = await f.decks.prepareOutlineImages('chat', f.input, new AbortController().signal)
  f.decks.commitBriefProposal('chat', f.input, token)
  assert.equal(f.decks.imageBlockers('chat').length, 2)
  assert.throws(() => start(f.decks), { code: 'IMAGE_PREPARATION_REQUIRED' })
  assert.equal(f.decks.snapshot('chat').slides.length, 0)
  const current = f.decks.outlineSnapshot('chat').proposals.at(-1)
  const input = {
    ...f.input,
    requestId: 'optional-review',
    expectedBriefVersion: 1,
    expectedOutline: { outlineId: current.outlineId, version: current.version },
    outline: {
      ...f.input.outline,
      slides: [
        {
          ...f.input.outline.slides[0],
          blocks: [
            { kind: 'bullets', items: ['Environment'] },
            ...f.input.outline.slides[0].blocks.map(b => ({ ...b, required: false })),
          ],
        },
      ],
    },
  }
  const optional = await f.decks.prepareOutlineImages('chat', input, new AbortController().signal)
  f.decks.commitBriefProposal('chat', input, optional)
  assert.deepEqual(f.decks.imageBlockers('chat'), [])
  const cap = start(f.decks),
    slideId = cap.plan().outline.slides[0].slideId,
    stage = cap.begin(slideId, 'image-pair')
  cap.provenance(stage.stageId, [
    { kind: 'wording', origin: 'general-knowledge', text: 'Environment' },
    { kind: 'wording', origin: 'general-knowledge', text: 'Forest and ocean' },
  ])
  cap.append(stage.stageId, { sequence: 0, text: stage.starter, final: true })
  await cap.publish({ stageId: stage.stageId, slideId, expectedRevision: 0, publicationId: 'optional' })
  assert.deepEqual(f.decks.content('chat', slideId, 1).imageOmissions, ['forest', 'ocean'])
})
test('prepared tokens cannot be used for a changed proposal and cancelled preparation never commits', async t => {
  const f = await fixture(t)
  const token = await f.decks.prepareOutlineImages('chat', f.input, new AbortController().signal)
  assert.throws(() => f.decks.commitBriefProposal('chat', { ...f.input, requestId: 'different' }, token), {
    code: 'IMAGE_PREPARATION_STALE',
  })
  assert.equal(f.decks.briefSnapshot('chat').version, 0)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(f.decks.prepareOutlineImages('chat', f.input, controller.signal), { name: 'AbortError' })
  assert.equal(f.decks.outlineSnapshot('chat').proposals.length, 0)
})
test('native PPTX proof uses editable text, image objects and notes from the same document', async t => {
  const f = await fixture(t)
  const token = await f.decks.prepareOutlineImages('chat', f.input, new AbortController().signal)
  f.decks.commitBriefProposal('chat', f.input, token)
  const cap = start(f.decks),
    stage = cap.begin(cap.plan().outline.slides[0].slideId, 'image-pair')
  const document = { ...stage.document, notes: 'Presenter notes stay separate.' }
  const context = {
    design: resolveDesign(),
    layoutId: 'image-pair',
    document,
    assets: stage.assets.map(a => ({ assetId: a.assetId, byteSize: f.png.length, bytes: f.png })),
  }
  await assert.rejects(new PptxFormatAdapter({}).build('', context), { code: 'FORMAT_FONT_MAPPING_REQUIRED' })
  const adapter = new PptxFormatAdapter({ 'system-ui, sans-serif': 'Arial' })
  const built = await adapter.build('', context),
    native = await inspectPptx(built.bytes)
  assert.match(native.slideXml[0], /<p:sp>/)
  assert.match(native.slideXml[0], /<a:t>Forest and ocean<\/a:t>/)
  assert.match(native.slideXml[0], /<p:pic>/)
  assert.match(native.notesXml[0], /Presenter notes stay separate/)
  assert.equal(native.slideXml[0].includes(document.notes), false)
  assert.ok(native.imageCount > 0)
  await assert.rejects(adapter.build('', { ...context, document: { ...document, layoutIntent: 'custom' } }), {
    code: 'FORMAT_CAPABILITY_UNSUPPORTED',
  })
})

test('correction budgets stop repeated failing drafts without publishing or discarding content', async t => {
  const f = await fixture(t)
  const token = await f.decks.prepareOutlineImages('chat', f.input, new AbortController().signal)
  f.decks.commitBriefProposal('chat', f.input, token)
  const cap = start(f.decks),
    slideId = cap.plan().outline.slides[0].slideId
  const stage = cap.begin(slideId, 'image-pair')
  cap.append(stage.stageId, { sequence: 0, text: stage.starter, final: true })
  const input = { stageId: stage.stageId, slideId, expectedRevision: 0, publicationId: 'never' }
  assert.equal((await cap.validate(input))[0].code, 'PROVENANCE_REQUIRED')
  assert.equal((await cap.validate(input))[0].code, 'PROVENANCE_REQUIRED')
  assert.equal((await cap.validate(input))[0].code, 'PROVENANCE_REQUIRED')
  assert.equal((await cap.validate(input))[0].code, 'SLIDE_CORRECTION_LIMIT')
  await assert.rejects(cap.publish(input), { code: 'SLIDE_CORRECTION_LIMIT' })
  cap.discard(stage.stageId)
  for (let i = 0; i < 3; i++) {
    const retry = cap.begin(slideId, 'image-pair')
    cap.discard(retry.stageId)
  }
  assert.throws(() => cap.begin(slideId, 'image-pair'), { code: 'SLIDE_CORRECTION_LIMIT' })
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 0)
  assert.equal(f.calls(), 2)
})

test('publication refuses content changed while its native artifact is being validated', async t => {
  let enter, release
  const entered = new Promise(resolve => {
      enter = resolve
    }),
    pending = new Promise(resolve => {
      release = resolve
    })
  t.after(() => release())
  const f = await fixture(t, {
    renderCheck: async () => {
      enter()
      await pending
    },
  })
  const token = await f.decks.prepareOutlineImages('chat', f.input, new AbortController().signal)
  f.decks.commitBriefProposal('chat', f.input, token)
  const cap = start(f.decks),
    slideId = cap.plan().outline.slides[0].slideId,
    stage = cap.begin(slideId, 'image-pair')
  const origins = ['Forest and ocean', 'Forest ecosystem', 'Ocean ecosystem'].map(text => ({
    kind: 'wording',
    origin: 'general-knowledge',
    text,
  }))
  cap.provenance(stage.stageId, origins)
  cap.append(stage.stageId, { sequence: 0, text: stage.starter, final: true })
  const publishing = cap.publish({ stageId: stage.stageId, slideId, expectedRevision: 0, publicationId: 'raced' })
  await entered
  cap.provenance(stage.stageId, origins, 'A later unvalidated change.')
  release()
  await assert.rejects(publishing, { code: 'STAGE_CHANGED' })
  assert.equal(f.decks.snapshot('chat').slides[0].revision, 0)
})
