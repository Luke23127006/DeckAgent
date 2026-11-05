import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { DeckClient, HostClient } from '../packages/client/runtime/lib/index.js'
import { openWireFixture, replyChat } from './fixtures/opencode-wire.mjs'
import { documentFixtures } from './fixtures/material-documents.mjs'

test('pinned CLI exposes only authorized MCP tools; image scope, ownership, stale revision and idempotency remain enforced', {
  skip: process.env.DECKAGENT_OPENCODE_CLI_TESTS !== '1',
  timeout: 90000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-image-cli-'))
  let commands = []
  const wire = await openWireFixture('chat-completions', (body, res) => {
    assert.ok(body.tools.every(tool => tool.function.name.startsWith('deckagent_')))
    assert.ok(body.tools.some(tool => tool.function.name === 'deckagent_insert_image'))
    assert.equal(
      body.tools.some(tool => /fetch|websearch|bash/.test(tool.function.name)),
      false,
    )
    const command = commands.shift()
    replyChat(res, command ? { call: command } : { text: 'Image inserted into slide 2.' })
  })
  const app = await startLocalWeb({
    dataDir: root,
    selection: { provider: 'fixture', model: 'images' },
    connections: [{ id: 'fixture', protocol: 'chat-completions', baseUrl: wire.baseUrl }],
    openCode: {
      executable: resolve('.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe'),
    },
    imageAssets: {
      fetchImage: async url => ({
        bytes: documentFixtures()['red.png'],
        mime: 'image/png',
        sourceUrl: url,
        finalUrl: url,
      }),
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
  })
  t.after(async () => {
    await app.close()
    await wire.close()
    await rm(root, { recursive: true, force: true })
  })
  const seed = new DeckService(join(root, 'decks.sqlite'))
  for (const slideId of ['one', 'two'])
    seed.publish('chat', {
      outlineId: 'plan',
      slideId,
      expectedRevision: 0,
      publicationId: slideId,
      html: `<h1>KEEP_${slideId}</h1>`,
    })
  seed.close()
  const client = new DeckClient(app.origin, app.token),
    host = new HostClient(app.origin, app.token)
  const asset = await client.importImage('chat', 'https://public.example/a.png', new AbortController().signal)
  const input = {
    outlineId: 'plan',
    slideId: 'two',
    expectedRevision: 1,
    publicationId: 'image',
    assetId: asset.assetId,
    alt: 'Red',
  }
  const tool = args => ({ name: 'deckagent_insert_image', arguments: args })
  commands = [
    tool({ ...input, slideId: 'one', publicationId: 'outside' }),
    tool({ ...input, assetId: '00000000-0000-0000-0000-000000000000', publicationId: 'foreign' }),
    tool({ ...input, expectedRevision: 99, publicationId: 'stale' }),
    tool(input),
    tool(input),
  ]
  const request = await host.send({
    sessionId: 'chat',
    input: 'Edit slide 2 only: use the imported image. Preserve slide 1.',
  })
  let terminal
  for await (const snapshot of host.watch(request.requestId, AbortSignal.timeout(180000))) {
    assert.notEqual(snapshot.status, 'awaiting_user', 'Unexpected clarification')
    terminal = snapshot
  }
  assert.equal(terminal.status, 'completed', terminal.result?.error?.code)
  assert.equal(commands.length, 0)
  const history = await host.history('chat')
  for (const code of ['SLIDE_SCOPE_DENIED', 'IMAGE_ASSET_UNAVAILABLE', 'SLIDE_IDENTITY_INVALID'])
    assert.ok(
      history.some(m => m.role === 'tool' && m.isError && m.content.includes(code)),
      code,
    )
  assert.equal((await client.snapshot('chat')).slides[0].revision, 1)
  assert.equal((await client.snapshot('chat')).slides[1].revision, 2)
  assert.equal((await client.content('chat', 'two', 2)).html.match(/data-deckagent-asset/g).length, 1)
})
