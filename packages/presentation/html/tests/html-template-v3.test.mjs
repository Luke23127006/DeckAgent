import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckService } from '@deckagent/deck'
import { brief } from '../../deck/tests/fixtures/brief.mjs'
import { HtmlFormatAdapter } from '../lib/index.js'
import { resolveDesign, findCompatibleLayouts } from '@deckagent/design'

const v3 = () => resolveDesign({ template: { id: 'html-basic', version: 3 } })
const document = {
  schemaVersion: 1,
  slideId: 'forest',
  title: 'Rừng',
  layoutIntent: 'image-text',
  provenance: [],
  nodes: [
    {
      id: 'points',
      kind: 'bullets',
      items: ['Rừng giữ đất, giữ nước và điều hòa khí hậu.', 'Rừng là nơi sinh sống của nhiều loài sinh vật.'],
    },
    { id: 'forest-image', kind: 'image', assetId: 'asset-forest', caption: 'Rừng xanh và sự sống' },
  ],
}

test('version 3 supplies controlled image composition without changing the effective theme or legacy source', async () => {
  const bytes = await readFile(new URL('../../../tools/filesystem/tests/fixtures/attachments/sample.png', import.meta.url))
  const html = new HtmlFormatAdapter()
  const context = {
    design: v3(),
    layoutId: 'image-text',
    document,
    assets: [{ assetId: 'asset-forest', byteSize: bytes.length, bytes }],
  }
  assert.deepEqual(context.design.theme, resolveDesign({ template: { id: 'html-basic', version: 2 } }).theme)
  const draft = html.context(context)
  const built = html.build(draft.starter, context)
  assert.equal(built.descriptor.policyVersion, 'html-layout-v3')
  assert.match(built.preview, /Rừng giữ đất/)
  assert.match(built.preview, /data:image\/png;base64,/)
  assert.throws(
    () =>
      html.build(
        draft.starter.replace('<section ', '<section style="display:grid;grid-template-columns:1fr 1fr" '),
        context,
      ),
    e => e.code === 'ARTIFACT_LAYOUT_MISMATCH' && e.issues.some(i => i.path === 'nativeSource.layout'),
  )
  const formatted = draft.starter.replaceAll('><', '>\n<')
  assert.doesNotThrow(() => html.build(formatted, context), 'Formatting whitespace is not a geometry change')
  const legacyContext = { ...context, design: resolveDesign({ template: { id: 'html-basic', version: 2 } }) }
  assert.match(html.context(legacyContext).starter, /da-slide da-image-text/)
  assert.equal(
    html.build(html.context(legacyContext).starter, legacyContext).descriptor.policyVersion,
    'html-document-v2',
  )
})

test('version 3 rejects excessive or incompatible content instead of offering unbounded custom layout', () => {
  const ref = v3().template
  const fit = findCompatibleLayouts(
    {
      title: 'Bảo vệ môi trường',
      blocks: [
        { kind: 'lead', text: 'Bảo vệ môi trường là bảo vệ cuộc sống.' },
        { kind: 'text', text: 'Mỗi người có thể bắt đầu từ những việc nhỏ và cụ thể mỗi ngày.' },
      ],
    },
    ref,
  )
  assert.deepEqual(
    fit.candidates.map(c => c.id),
    ['section'],
  )
  const excess = findCompatibleLayouts(
    {
      title: 'Rừng',
      blocks: [
        { kind: 'web-image', query: 'forest' },
        { kind: 'bullets', items: ['a'.repeat(141), 'b', 'c'] },
      ],
    },
    ref,
  )
  assert.deepEqual(excess.candidates, [])
  assert.equal(excess.fallbackAllowed, false)
})

test('explicit optional image omissions use a bounded text variant without adding placeholder content', () => {
  const html = new HtmlFormatAdapter()
  const context = {
    design: v3(),
    layoutId: 'image-text',
    assets: [],
    document: { ...document, nodes: document.nodes.filter(n => n.kind !== 'image') },
  }
  const source = html.context(context).starter
  const built = html.build(source, context)
  assert.match(built.preview, /da3-title-body/)
  assert.equal(built.preview.includes('<img'), false)
  assert.match(built.preview, /Rừng giữ đất/)
})

test('an over-capacity v3 Outline cannot create a generation intent or lock the reviewed proposal', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'v3-layout-capacity-'))
  const decks = new DeckService(join(dir, 'deck.sqlite'))
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  const saved = decks.saveBrief('chat', {
    expectedVersion: 0,
    draft: {
      ...brief(),
      template: v3().template,
      purpose: 'Explain',
      proposedSlideCount: 1,
      sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
      answers: [{ topic: 'images', value: 'No images' }],
    },
  })
  const proposal = decks.proposeBoundOutline('chat', {
    requestId: 'review',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: saved.briefId, version: saved.version },
    draft: {
      overview: 'Long content',
      revisionSuggestions: [],
      slides: [
        {
          title: 'Long content',
          content: 'a'.repeat(141),
          blocks: [{ kind: 'bullets', items: ['a'.repeat(141)] }],
          sources: [],
        },
      ],
    },
  })
  assert.throws(
    () =>
      decks.confirmGeneration(
        'chat',
        {
          confirmationId: 'too-long',
          outlineId: proposal.outlineId,
          outlineVersion: proposal.version,
          briefId: saved.briefId,
          briefVersion: saved.version,
        },
        { provider: 'fixture', model: 'fixture' },
      ),
    e => e.code === 'DESIGN_LAYOUT_INCOMPATIBLE' && e.issues.some(i => i.path === 'slides[0].blocks[0].items[0]'),
  )
  assert.equal(decks.generation('chat'), null)
  assert.equal(decks.outlineSnapshot('chat').proposals.at(-1).status, 'current')
})
