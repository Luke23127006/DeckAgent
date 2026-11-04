import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { DeckClient, HostClient } from '../packages/client/runtime/lib/index.js'

test('live Gemini preserves direct edits and non-target bytes through read_slide and patch_slide', {
  skip: process.env.DECKAGENT_DIRECT_EDIT_LIVE !== '1',
  timeout: 240000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY required')
  const root = await mkdtemp(join(tmpdir(), 'deckagent-direct-live-'))
  const selection = { provider: 'google', model: process.env.DECKAGENT_GEMINI_MODEL ?? 'gemini-3.1-flash-lite' }
  const options = {
    dataDir: root,
    selection,
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
        outlineId: 'outline',
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
    ['one', '<h1>KEEP_SLIDE_ONE</h1>'],
    ['two', '<section><h1>Heading</h1><p>OLD_BODY</p><!--KEEP--><footer>KEEP_FOOTER</footer></section>'],
  ])
    seed.publish('chat', { outlineId: 'outline', slideId, expectedRevision: 0, publicationId: slideId, html })
  seed.close()
  let deck = new DeckClient(app.origin, app.token)
  const host = new HostClient(app.origin, app.token),
    doc = await deck.editableSlide('chat', 'two')
  await deck.editSlide('chat', {
    outlineId: 'outline',
    slideId: 'two',
    expectedRevision: 1,
    baseHash: doc.baseHash,
    editId: 'direct',
    operations: [
      { nodeId: doc.nodes[0].nodeId, text: 'TRỰC TIẾP ĐƯỢC GIỮ', layout: { fontSize: 28, textAlign: 'center' } },
    ],
  })
  const before = await deck.content('chat', 'two', 2),
    first = await deck.content('chat', 'one', 1)
  const request = await host.send({
    sessionId: 'chat',
    input:
      'Edit slide 2 only: change the paragraph OLD_BODY to exactly AI_PATCH_OK using read_slide then patch_slide. Preserve every other byte, the directly edited heading, its font size/alignment, footer, comments and slide 1.',
  })
  let terminal
  for await (const snapshot of host.watch(request.requestId)) terminal = snapshot
  assert.equal(terminal.status, 'completed', terminal.result?.error?.code)
  const snapshot = await deck.snapshot('chat')
  const tools = (await host.history('chat')).filter(m => m.role === 'tool')
  console.log(
    'LIVE_EDIT_METADATA',
    JSON.stringify({
      revisions: snapshot.slides.map(slide => slide.revision),
      tools: tools.map(tool => ({
        name: ['read_slide', 'patch_slide', 'write_file', 'publish_slide'].includes(tool.name) ? tool.name : 'other',
        failed: tool.isError === true,
      })),
    }),
  )
  assert.ok(snapshot.slides[1].revision >= 3)
  assert.equal(
    (await deck.content('chat', 'two', snapshot.slides[1].revision)).html,
    before.html.replace('OLD_BODY', 'AI_PATCH_OK'),
  )
  assert.deepEqual(await deck.content('chat', 'one', 1), first)
  assert.ok(tools.some(m => m.name === 'read_slide'))
  assert.ok(tools.some(m => m.name === 'patch_slide' && !m.isError))
  assert.equal(
    tools.some(m => ['write_file', 'publish_slide'].includes(m.name)),
    false,
  )
  const committed = new Set(
    tools.filter(tool => tool.name === 'patch_slide' && !tool.isError).map(tool => JSON.parse(tool.content).revision),
  )
  assert.equal(
    committed.size,
    snapshot.slides[1].revision - 2,
    'Every new revision must have a successful patch receipt; identical retries are deduplicated',
  )
  const current = await deck.editableSlide('chat', 'two')
  await deck.editSlide('chat', {
    outlineId: 'outline',
    slideId: 'two',
    expectedRevision: current.revision,
    baseHash: current.baseHash,
    editId: 'direct-again',
    operations: [{ nodeId: current.nodes[0].nodeId, text: 'DIRECT_AGAIN' }],
  })
  await app.close()
  app = await startLocalWeb(options)
  deck = new DeckClient(app.origin, app.token)
  assert.equal((await deck.snapshot('chat')).slides[0].revision, 1)
  const final = await deck.content('chat', 'two', current.revision + 1)
  assert.ok(final.html.includes('AI_PATCH_OK'))
  assert.ok(final.html.includes('DIRECT_AGAIN'))
  t.diagnostic(
    'PASS actual Gemini direct -> MCP patch -> direct -> restart; exact same-slide non-target bytes and slide-one HTML/revision preserved. Deck plan was a trusted synthetic fixture, not live outline generation.',
  )
})
