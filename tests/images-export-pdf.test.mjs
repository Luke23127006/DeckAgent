import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { ImageAssetStore } from '../apps/local-web/lib/types/image-assets/store.js'
import { PdfExporter } from '../apps/local-web/lib/types/export-pdf.js'
import { documentFixtures } from './fixtures/material-documents.mjs'

test('actual sandboxed PDF renderer freezes direct edits, embeds images/fonts and drains cancellation', {
  timeout: 90000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-pdf-'))
  const bytes = documentFixtures()['red.png']
  const assets = await ImageAssetStore.create(root, {
    fetchImage: async url => ({ bytes, mime: 'image/png', sourceUrl: url, finalUrl: url }),
  })
  const deck = new DeckService(join(root, 'deck.sqlite'), { assetExists: (id, a) => assets.has(id, a) }),
    exporter = new PdfExporter()
  t.after(async () => {
    await exporter.close()
    deck.close()
    await assets.close()
    await rm(root, { recursive: true, force: true })
  })
  const image = await assets.import('chat', { url: 'https://public.example/red.png' }, new AbortController().signal)
  deck.confirm('chat', {
    outlineId: 'plan',
    slides: [
      { slideId: 'one', title: 'Một' },
      { slideId: 'two', title: 'Two' },
    ],
  })
  deck.publish('chat', {
    outlineId: 'plan',
    slideId: 'one',
    expectedRevision: 0,
    publicationId: 'one',
    html: `<h1 style="font-family:Arial;font-size:28px;color:blue">Tái chế cùng cộng đồng</h1><img data-deckagent-asset="${image.assetId}" width="160" height="120" alt="Ảnh đỏ">`,
  })
  deck.publish('chat', {
    outlineId: 'plan',
    slideId: 'two',
    expectedRevision: 0,
    publicationId: 'two',
    html: '<h1>Saved two</h1>',
  })
  const doc = deck.editableSlide('chat', 'two')
  deck.editSlide('chat', {
    outlineId: 'plan',
    slideId: 'two',
    baseHash: doc.baseHash,
    expectedRevision: 1,
    editId: 'direct',
    operations: [{ nodeId: doc.nodes[0].nodeId, text: 'DIRECT_EDIT_KEPT' }],
  })
  const frozen = deck.freeze('chat'),
    work = exporter.run(frozen, assets, new AbortController().signal)
  deck.publish('chat', {
    outlineId: 'plan',
    slideId: 'two',
    expectedRevision: 2,
    publicationId: 'newer',
    html: '<h1>NEWER_NOT_EXPORTED</h1>',
  })
  const pdf = await work
  await writeFile('.local-only/task007-fixture-export.pdf', pdf)
  const require = createRequire(new URL('../apps/local-web/package.json', import.meta.url))
  const { getDocument, OPS } = await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href)
  const loading = getDocument({
    data: Uint8Array.from(pdf),
    useWorkerFetch: false,
    useWasm: false,
    isEvalSupported: false,
  })
  const viewer = await loading.promise
  assert.equal(viewer.numPages, 2)
  const first = await viewer.getPage(1),
    second = await viewer.getPage(2)
  const text = async page =>
    (await page.getTextContent()).items
      .filter(item => 'str' in item)
      .map(item => item.str)
      .join(' ')
  assert.match(await text(first), /Tái chế cùng cộng đồng/)
  assert.match(await text(second), /DIRECT_EDIT_KEPT/)
  assert.equal((await text(second)).includes('NEWER_NOT_EXPORTED'), false)
  const operators = await first.getOperatorList()
  assert.ok(operators.fnArray.some(value => [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(value)))
  assert.equal(first.view[2], 960)
  assert.equal(first.view[3], 540)
  const pdfRequire = createRequire(require.resolve('pdfjs-dist/legacy/build/pdf.mjs'))
  const { createCanvas } = pdfRequire('@napi-rs/canvas')
  const viewport = first.getViewport({ scale: 1 }),
    canvas = createCanvas(viewport.width, viewport.height)
  await first.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
  await writeFile('.local-only/task007-independent-view.png', canvas.toBuffer('image/png'))
  await loading.destroy()
  let launched
  const ready = new Promise(resolve => {
    launched = resolve
  })
  const cancel = new AbortController(),
    stopped = new PdfExporter(undefined, () => launched())
  const interrupted = stopped.run(frozen, assets, cancel.signal)
  await ready
  cancel.abort()
  await assert.rejects(interrupted, /EXPORT_CANCELLED/)
  await stopped.close()
  assert.equal(deck.snapshot('chat').slides[1].revision, 3)
  const absent = new PdfExporter(join(root, 'missing-browser.exe'))
  await assert.rejects(absent.run(frozen, assets, new AbortController().signal), /EXPORT_UNAVAILABLE/)
  await absent.close()
  const overflow = { ...frozen, slides: [{ ...frozen.slides[0], html: '<div style="height:1800px">TOO_TALL</div>' }] }
  await assert.rejects(exporter.run(overflow, assets, new AbortController().signal), /EXPORT_LAYOUT_OVERFLOW/)
  assert.equal(deck.snapshot('chat').slides[1].revision, 3)
})
