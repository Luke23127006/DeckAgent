import assert from 'node:assert/strict'
import { mkdtemp, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { renderSlideAssets } from '../packages/presentation/deck/lib/index.js'
import { ImageAssetStore } from '../apps/local-web/lib/types/image-assets/store.js'
import { documentFixtures } from './fixtures/material-documents.mjs'
import { writeFile } from 'node:fs/promises'

test('export snapshot freezes ordered committed revisions and refuses incomplete decks', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-export-snapshot-')),
    deck = new DeckService(join(root, 'deck.sqlite'))
  t.after(async () => {
    deck.close()
    await rm(root, { recursive: true, force: true })
  })
  deck.confirm('chat', {
    outlineId: 'outline',
    slides: [
      { slideId: 'one', title: 'Một' },
      { slideId: 'two', title: 'Two' },
    ],
  })
  assert.throws(() => deck.freeze('chat'), /DECK_EXPORT_INCOMPLETE/)
  for (const [slideId, html] of [
    ['one', '<h1>Đã lưu một</h1>'],
    ['two', '<h1>Saved two</h1>'],
  ])
    deck.publish('chat', { outlineId: 'outline', slideId, expectedRevision: 0, publicationId: slideId, html })
  const frozen = deck.freeze('chat')
  deck.publish('chat', {
    outlineId: 'outline',
    slideId: 'two',
    expectedRevision: 1,
    publicationId: 'newer',
    html: '<h1>NEWER</h1>',
  })
  assert.deepEqual(
    frozen.slides.map(s => [s.slideId, s.revision, s.html]),
    [
      ['one', 1, '<h1>Đã lưu một</h1>'],
      ['two', 1, '<h1>Saved two</h1>'],
    ],
  )
  assert.equal(frozen.version, 3)
  assert.equal(deck.snapshot('chat').version, 4)
})

test('disabled import, invalid image bytes and cancelled acquisition leave no ready asset or partial file', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-image-failure-'))
  let calls = 0
  const disabled = await ImageAssetStore.create(root, {
    enabled: false,
    fetchImage: async () => {
      calls++
      throw Error('UNEXPECTED')
    },
  })
  assert.throws(
    () => disabled.import('chat', { url: 'https://public.example/a' }, new AbortController().signal),
    /IMAGE_IMPORT_DISABLED/,
  )
  assert.equal(calls, 0)
  await disabled.close()
  const invalid = await ImageAssetStore.create(root, {
    fetchImage: async url => ({ bytes: Buffer.from('<svg/>'), mime: 'image/png', sourceUrl: url, finalUrl: url }),
  })
  await assert.rejects(
    invalid.import('chat', { url: 'https://public.example/a' }, new AbortController().signal),
    /IMAGE_FORMAT/,
  )
  assert.equal(invalid.list('chat').length, 0)
  await invalid.close()
  const cancelled = await ImageAssetStore.create(root, {
    fetchImage: (_url, signal) =>
      new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })),
  })
  t.after(async () => {
    await cancelled.close()
    await rm(root, { recursive: true, force: true })
  })
  const abort = new AbortController(),
    work = cancelled.import('chat', { url: 'https://public.example/a' }, abort.signal)
  abort.abort()
  await assert.rejects(work)
  assert.equal(cancelled.list('chat').length, 0)
  assert.deepEqual(await readdir(join(root, 'image-assets')), [])
})

test('verified Chat assets publish as inert owned markers; foreign IDs, corrupt bytes and malformed input fail without deck changes', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-image-assets-'))
  const bytes = documentFixtures()['red.png']
  const assets = await ImageAssetStore.create(root, {
    fetchImage: async url => ({ bytes, mime: 'image/png', sourceUrl: url, finalUrl: url }),
  })
  const deck = new DeckService(join(root, 'deck.sqlite'), { assetExists: (id, a) => assets.has(id, a) })
  t.after(async () => {
    deck.close()
    await assets.close()
    await rm(root, { recursive: true, force: true })
  })
  const image = await assets.import('chat', { url: 'https://public.example/red.png' }, new AbortController().signal)
  assert.ok(image.width > 0 && image.height > 0)
  assert.equal(assets.list('other').length, 0)
  assert.throws(() => assets.get('other', image.assetId), /IMAGE_UNAVAILABLE/)
  for (const id of ['chat', 'other']) {
    deck.confirm(id, { outlineId: 'plan', slides: [{ slideId: 'one', title: 'One' }] })
    deck.publish(id, {
      outlineId: 'plan',
      slideId: 'one',
      expectedRevision: 0,
      publicationId: 'init',
      html: '<h1>GIỮ NGUYÊN</h1>',
    })
  }
  const command = {
    outlineId: 'plan',
    slideId: 'one',
    assetId: image.assetId,
    alt: 'Ảnh đỏ',
    expectedRevision: 1,
    publicationId: 'image',
  }
  assert.throws(() => deck.insertImage('other', command), /DECK_ASSET_UNAVAILABLE/)
  deck.insertImage('chat', command)
  const html = deck.content('chat', 'one', 2).html
  assert.ok(html.startsWith('<h1>GIỮ NGUYÊN</h1>'))
  assert.equal(html.includes(' src='), false)
  const display = renderSlideAssets(html, new Map([[image.assetId, await assets.dataUrl('chat', image.assetId)]]))
  assert.match(display, /src="data:image\/png;base64,/)
  assert.equal(deck.snapshot('other').slides[0].revision, 1)
  await writeFile(join(root, 'image-assets', image.assetId), 'corrupt')
  await assert.rejects(assets.dataUrl('chat', image.assetId), /IMAGE_UNAVAILABLE/)
  assert.equal(deck.snapshot('chat').slides[0].revision, 2)
})
