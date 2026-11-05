import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { DeckClient } from '../packages/client/runtime/lib/index.js'
import { documentFixtures } from './fixtures/material-documents.mjs'
import { materialBrowser, eventually } from './fixtures/material-browser.mjs'

test('image UI imports once, inserts only selected slide, renders an opaque frame, edits and exports/reopens', {
  timeout: 90000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-images-browser-'))
  let fetches = 0
  const options = {
    dataDir: root,
    selection: { provider: 'fixture', model: 'test' },
    model: {
      async *stream() {
        yield { type: 'finish', reason: 'stop' }
      },
    },
    imageAssets: {
      fetchImage: async url => {
        fetches++
        return { bytes: documentFixtures()['red.png'], mime: 'image/png', sourceUrl: url, finalUrl: url }
      },
    },
    confirmedDecks: [
      {
        sessionId: 'chat',
        outlineId: 'plan',
        slides: [
          { slideId: 'one', title: 'One' },
          { slideId: 'two', title: 'Two' },
        ],
      },
    ],
  }
  let app = await startLocalWeb(options)
  const deck = new DeckService(join(root, 'decks.sqlite'))
  for (const [slideId, html] of [
    ['one', '<h1>KEEP_ONE</h1>'],
    ['two', '<h1>Tái chế hôm nay</h1>'],
  ])
    deck.publish('chat', { outlineId: 'plan', slideId, expectedRevision: 0, publicationId: slideId, html })
  deck.close()
  const teardown = []
  t.after(async () => {
    for (const close of teardown) await close()
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  let client = new DeckClient(app.origin, app.token)
  const { evaluate, call } = await materialBrowser(
    { after: close => teardown.push(close) },
    root,
    `${app.origin}/#token=${app.token}`,
  )
  await eventually(
    () =>
      evaluate(
        `!!document.querySelector('[data-session-id="chat"]')&&!document.querySelector('[data-session-id="chat"]').disabled`,
      ),
    'Chat unavailable',
  )
  await evaluate(`document.querySelector('[data-session-id="chat"]').click();true`)
  await eventually(
    () => evaluate(`document.querySelectorAll('[aria-label="Slides"] button').length===2`),
    'Deck unavailable',
  )
  await evaluate(
    `document.querySelectorAll('[aria-label="Slides"] button')[1].click();document.querySelector('.image-export details').open=true;true`,
  )
  await eventually(
    () => evaluate(`!document.querySelector('.image-export button').disabled`),
    'Image import unavailable',
  )
  await evaluate(
    `document.querySelector('.image-export input[type="url"]').value='https://public.example/red.png';document.querySelector('.image-export button').click();true`,
  )
  await eventually(
    () =>
      evaluate(
        `document.querySelector('.image-export select').options.length===1&&!document.querySelectorAll('.image-export button')[1].disabled`,
      ),
    'Image not ready',
  )
  assert.equal(fetches, 1)
  assert.equal(
    await evaluate(`document.querySelector('.image-export small').textContent`),
    'https://public.example/red.png',
  )
  await evaluate(`document.querySelectorAll('.image-export button')[1].click();true`)
  await eventually(async () => (await client.snapshot('chat')).slides[1].revision === 2, 'Image not committed')
  await eventually(
    () =>
      evaluate(`document.querySelector('iframe[title="Published slide"]').srcdoc.includes('data:image/png;base64,')`),
    'Image projection absent',
  )
  assert.equal(await evaluate(`document.querySelector('iframe[title="Published slide"]').getAttribute('sandbox')`), '')
  let loaded = false
  for (const target of (await call('Target.getTargets')).targetInfos.filter(
    target => target.type === 'iframe' && target.url === 'about:srcdoc',
  )) {
    const session = await call('Target.attachToTarget', { targetId: target.targetId, flatten: true })
    const result = await call(
      'Runtime.evaluate',
      {
        expression: `!!document.querySelector('img')&&document.querySelector('img').complete&&document.querySelector('img').naturalWidth>0`,
        returnByValue: true,
      },
      session.sessionId,
    )
    loaded ||= result.result.value === true
  }
  assert.equal(loaded, true, 'Image must decode inside opaque sandbox, not merely appear in srcdoc')
  const before = await client.content('chat', 'two', 2),
    doc = await client.editableSlide('chat', 'two')
  await client.editSlide('chat', {
    outlineId: 'plan',
    slideId: 'two',
    expectedRevision: 2,
    baseHash: doc.baseHash,
    editId: 'image-direct',
    operations: [
      { nodeId: doc.nodes[0].nodeId, text: 'Tái chế trực tiếp', layout: { fontSize: 28, textAlign: 'center' } },
    ],
  })
  const after = await client.content('chat', 'two', 3)
  assert.match(after.displayHtml, /src="data:image\/png;base64,/)
  assert.match(after.html, /data-deckagent-asset/)
  assert.ok(before.html.includes('data-deckagent-asset'))
  assert.equal((await client.content('chat', 'one', 1)).html, '<h1>KEEP_ONE</h1>')
  const artifact = await client.exportPdf('chat', new AbortController().signal)
  assert.equal(artifact.blob.type, 'application/pdf')
  assert.equal(
    Buffer.from(await artifact.blob.arrayBuffer())
      .subarray(0, 5)
      .toString(),
    '%PDF-',
  )
  await writeFile('.local-only/task007-browser-export.pdf', Buffer.from(await artifact.blob.arrayBuffer()))
  await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: root })
  await eventually(
    () => evaluate(`!document.querySelectorAll('.image-export button')[2].disabled`),
    'PDF button unavailable',
  )
  await evaluate(`document.querySelectorAll('.image-export button')[2].click();true`)
  const downloaded = await eventually(
    async () => (await readdir(root)).find(name => name.endsWith('.pdf')),
    'UI did not download PDF',
  )
  assert.equal((await readFile(join(root, downloaded))).subarray(0, 5).toString(), '%PDF-')
  await assert.rejects(client.imageAssets('foreign'), /IMAGE_REQUEST_FAILED/)
  await app.close()
  app = await startLocalWeb(options)
  client = new DeckClient(app.origin, app.token)
  assert.equal((await client.imageAssets('chat')).items.length, 1)
  assert.equal((await client.content('chat', 'two', 3)).html, after.html)
  assert.match((await client.content('chat', 'two', 3)).displayHtml, /data:image\/png;base64,/)
  assert.equal(fetches, 1, 'Reopen and export use immutable local bytes, never refetch source')
})
