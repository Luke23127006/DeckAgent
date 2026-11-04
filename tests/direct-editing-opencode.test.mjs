import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { DeckClient, HostClient } from '../packages/client/runtime/lib/index.js'
import { openWireFixture, replyChat } from './fixtures/opencode-wire.mjs'

test('pinned CLI alternates direct and MCP edits, rejecting out-of-scope/stale operations without rewriting other bytes', {
  skip: process.env.DECKAGENT_OPENCODE_CLI_TESTS !== '1',
  timeout: 90000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-direct-cli-'))
  let commands = [],
    calls = 0
  const wire = await openWireFixture('chat-completions', (body, res) => {
    calls++
    assert.ok((body.tools ?? []).every(tool => tool.function.name.startsWith('deckagent_')))
    const command = commands.shift()
    replyChat(res, command ? { call: command } : { text: 'Actual patch complete; slide 1 unchanged.' })
  })
  const app = await startLocalWeb({
    dataDir: root,
    selection: { provider: 'fixture', model: 'editing' },
    connections: [{ id: 'fixture', protocol: 'chat-completions', baseUrl: wire.baseUrl }],
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
  })
  t.after(async () => {
    await app.close()
    await wire.close()
    await rm(root, { recursive: true, force: true })
  })
  const seed = new DeckService(join(root, 'decks.sqlite'))
  for (const [slideId, html] of [
    ['one', '<h1>KEEP_ONE</h1>'],
    ['two', '<h1>HEADING</h1><!--KEEP--><p>OLD_BODY</p>'],
  ])
    seed.publish('chat', { outlineId: 'outline', slideId, html, expectedRevision: 0, publicationId: slideId })
  seed.close()
  const deck = new DeckClient(app.origin, app.token),
    host = new HostClient(app.origin, app.token)
  const old = await deck.editableSlide('chat', 'two')
  await deck.editSlide('chat', {
    outlineId: 'outline',
    slideId: 'two',
    expectedRevision: 1,
    baseHash: old.baseHash,
    editId: 'direct',
    operations: [{ nodeId: old.nodes[0].nodeId, text: 'DIRECT_KEPT', layout: { fontSize: 28 } }],
  })
  const two = await deck.editableSlide('chat', 'two'),
    one = await deck.editableSlide('chat', 'one')
  const edit = (document, text, editId, node = document.nodes[0]) => ({
    outlineId: 'outline',
    slideId: document.slideId,
    expectedRevision: document.revision,
    baseHash: document.baseHash,
    editId,
    operations: [{ nodeId: node.nodeId, text }],
  })
  const tool = (name, args) => ({ name: `deckagent_${name}`, arguments: args })
  commands = [
    tool('read_slide', { slideId: 'two' }),
    tool('patch_slide', { edit: JSON.stringify(edit(one, 'FORBIDDEN', 'outside')) }),
    tool('patch_slide', { edit: JSON.stringify(edit(old, 'STALE', 'stale')) }),
    tool('patch_slide', {
      edit: JSON.stringify(
        edit(
          two,
          'AI_EDIT',
          'ai',
          two.nodes.find(n => n.text === 'OLD_BODY'),
        ),
      ),
    }),
  ]
  const request = await host.send({
    sessionId: 'chat',
    input:
      'Edit slide 2 only: set the body paragraph to AI_EDIT. Preserve heading, layout and all other content. Use patch_slide.',
  })
  let terminal
  for await (const snapshot of host.watch(request.requestId)) terminal = snapshot
  assert.equal(terminal.status, 'completed', terminal.result?.error?.code)
  assert.equal(commands.length, 0)
  assert.equal(calls, 5)
  assert.ok(JSON.stringify(wire.requests[1].body).includes('DIRECT_KEPT'))
  assert.equal((await deck.content('chat', 'two', 3)).html, two.html.replace('OLD_BODY', 'AI_EDIT'))
  assert.equal((await deck.content('chat', 'one', 1)).html, one.html)
  const messages = await host.history('chat')
  assert.ok(messages.some(m => m.role === 'tool' && m.isError && m.content.includes('SLIDE_SCOPE_DENIED')))
  assert.ok(messages.some(m => m.role === 'tool' && m.isError && m.content.includes('SLIDE_REVISION_CONFLICT')))
  const third = await deck.editableSlide('chat', 'two')
  await deck.editSlide('chat', edit(third, 'DIRECT_AGAIN', 'direct-again', third.nodes[0]))
  assert.equal((await deck.content('chat', 'two', 4)).html, third.html.replace('DIRECT_KEPT', 'DIRECT_AGAIN'))
  assert.equal((await deck.snapshot('chat')).slides[0].revision, 1)
})
