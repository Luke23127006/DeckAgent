import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { DeckClient, HostClient } from '../packages/client/runtime/lib/index.js'

test('real Internet image -> OpenCode/Gemini MCP insert -> direct edit -> PDF -> restart', {
  skip: process.env.DECKAGENT_IMAGES_EXPORT_LIVE !== '1',
  timeout: 240000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY required')
  const root = await mkdtemp(join(tmpdir(), 'deckagent-image-live-'))
  const model = process.env.DECKAGENT_GEMINI_MODEL ?? 'gemini-3.1-flash-lite'
  assert.match(model, /^gemini-[a-z0-9._-]+$/)
  const options = {
    dataDir: root,
    selection: { provider: 'google', model },
    connections: [
      {
        id: 'google',
        protocol: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKeyEnv: 'GEMINI_API_KEY',
      },
    ],
    openCode: {
      executable: resolve('.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe'),
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
  t.after(async () => {
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  const seed = new DeckService(join(root, 'decks.sqlite'))
  for (const [slideId, html] of [
    ['one', '<h1>KEEP_ONE</h1>'],
    ['two', '<h1>Tái chế cùng cộng đồng</h1><p>KEEP_TEXT</p>'],
  ])
    seed.publish('chat', { outlineId: 'plan', slideId, expectedRevision: 0, publicationId: slideId, html })
  seed.close()
  let client = new DeckClient(app.origin, app.token)
  // Real DNS + address-pinned HTTPS; no injected fetcher, no URL credentials.
  const asset = await client.importImage(
    'chat',
    'https://raw.githubusercontent.com/github/explore/main/topics/javascript/javascript.png',
    AbortSignal.timeout(20000),
  )
  console.log(
    'LIVE_IMAGE_METADATA',
    JSON.stringify({
      mediaType: asset.mediaType,
      sizeBytes: asset.sizeBytes,
      width: asset.width,
      height: asset.height,
      sha256: asset.sha256,
      sourceHost: new URL(asset.sourceUrl).hostname,
    }),
  )
  const host = new HostClient(app.origin, app.token)
  const request = await host.send({
    sessionId: 'chat',
    input:
      'Edit slide 2 only: use the imported image asset via read_slide and insert_image. Preserve all existing text and slide 1.',
  })
  let terminal
  for await (const snapshot of host.watch(request.requestId, AbortSignal.timeout(180000))) {
    assert.notEqual(snapshot.status, 'awaiting_user', 'Unexpected clarification; scoped image work was not admitted')
    terminal = snapshot
  }
  assert.equal(terminal.status, 'completed', terminal.result?.error?.code)
  const snapshot = await client.snapshot('chat'),
    history = await host.history('chat'),
    tools = history.filter(m => m.role === 'tool')
  console.log(
    'LIVE_IMAGE_TOOLS',
    JSON.stringify(
      tools.map(m => ({
        name: ['read_slide', 'list_image_assets', 'insert_image', 'publish_slide', 'write_file'].includes(m.name)
          ? m.name
          : 'other',
        failed: !!m.isError,
      })),
    ),
  )
  assert.ok(
    tools.some(m => m.name === 'insert_image' && !m.isError),
    'Real MCP insert receipt required',
  )
  assert.equal(snapshot.slides[0].revision, 1)
  const revision = snapshot.slides[1].revision
  const inserted = await client.content('chat', 'two', revision)
  assert.ok(inserted.html.startsWith('<h1>Tái chế cùng cộng đồng</h1><p>KEEP_TEXT</p>'))
  assert.ok(inserted.html.includes(`data-deckagent-asset="${asset.assetId}"`))
  const doc = await client.editableSlide('chat', 'two')
  await client.editSlide('chat', {
    outlineId: 'plan',
    slideId: 'two',
    expectedRevision: revision,
    baseHash: doc.baseHash,
    editId: 'direct',
    operations: [
      { nodeId: doc.nodes[0].nodeId, text: 'Tái chế trực tiếp', layout: { fontSize: 28, textAlign: 'center' } },
    ],
  })
  const committed = (await client.content('chat', 'two', revision + 1)).html
  const artifact = await client.exportPdf('chat', AbortSignal.timeout(60000))
  const pdfBytes = Buffer.from(await artifact.blob.arrayBuffer())
  await writeFile('.local-only/task007-live-export.pdf', pdfBytes)
  const require = createRequire(new URL('../apps/local-web/package.json', import.meta.url))
  const { getDocument, OPS } = await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href)
  const reader = getDocument({
      data: Uint8Array.from(pdfBytes),
      useWorkerFetch: false,
      useWasm: false,
      isEvalSupported: false,
    }),
    pdf = await reader.promise
  try {
    assert.equal(pdf.numPages, 2)
    const second = await pdf.getPage(2),
      text = (await second.getTextContent()).items
        .filter(item => 'str' in item)
        .map(item => item.str)
        .join(' ')
    assert.match(text, /Tái chế trực tiếp/)
    assert.match(text, /KEEP_TEXT/)
    assert.ok(
      (await second.getOperatorList()).fnArray.some(op =>
        [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(op),
      ),
    )
  } finally {
    await reader.destroy()
  }
  await app.close()
  app = await startLocalWeb(options)
  client = new DeckClient(app.origin, app.token)
  assert.equal((await client.content('chat', 'two', revision + 1)).html, committed)
  assert.match((await client.content('chat', 'two', revision + 1)).displayHtml, /data:image\/png;base64,/)
  assert.equal((await client.content('chat', 'one', 1)).html, '<h1>KEEP_ONE</h1>')
  t.diagnostic(
    'Real public HTTPS acquisition, OpenCode model MCP insert, direct-edit preservation, PDF and restart passed. Deck plan was seeded; this test does not requalify outline generation.',
  )
})
