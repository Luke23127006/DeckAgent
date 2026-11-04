import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { startHost } from '../packages/host/api/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { setTimeout as delay } from 'node:timers/promises'

test('direct text/layout patch preserves non-target bytes and slide revisions; stale save and duplicate receipt are safe', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-direct-'))
  let deck = new DeckService(join(root, 'deck.sqlite'))
  t.after(async () => {
    deck.close()
    await rm(root, { recursive: true, force: true })
  })
  deck.confirm('chat', {
    outlineId: 'outline',
    slides: [
      { slideId: 'one', title: 'One' },
      { slideId: 'two', title: 'Two' },
    ],
  })
  const first = '<h1>KEEP_SLIDE_ONE</h1>'
  const second =
    '<style>p {color:blue}</style>\r\n<main><h1 class="title">Tái chế &amp; reuse</h1><!--KEEP--><p>UNCHANGED</p></main>'
  for (const [slideId, html] of [
    ['one', first],
    ['two', second],
  ])
    deck.publish('chat', { outlineId: 'outline', slideId, expectedRevision: 0, publicationId: slideId, html })
  const document = deck.editableSlide('chat', 'two')
  const node = document.nodes.find(node => node.text === 'Tái chế & reuse')
  assert.ok(node)
  const command = {
    outlineId: 'outline',
    slideId: 'two',
    expectedRevision: 1,
    baseHash: document.baseHash,
    editId: 'direct-one',
    operations: [
      {
        nodeId: node.nodeId,
        text: 'Nội dung mới <safe> & reuse',
        layout: { fontSize: 28, textAlign: 'center', marginTop: 8 },
      },
    ],
  }
  const preview = deck.previewSlideEdit('chat', command)
  assert.equal(deck.snapshot('chat').slides[1].revision, 1)
  assert.match(preview.html, /Nội dung mới &lt;safe&gt; &amp; reuse/)
  assert.ok(preview.html.includes('<!--KEEP--><p>UNCHANGED</p></main>'))
  assert.ok(preview.html.startsWith('<style>p {color:blue}</style>\r\n<main>'))
  assert.match(preview.html, /font-size:28px!important/)
  const receipt = deck.editSlide('chat', command)
  assert.equal(receipt.revision, 2)
  assert.equal(deck.content('chat', 'two', 2).html, preview.html)
  assert.deepEqual(deck.editSlide('chat', command), receipt)
  assert.throws(() => deck.editSlide('chat', { ...command, editId: 'stale' }), /DECK_CONFLICT/)
  assert.equal(deck.content('chat', 'one', 1).html, first)
  assert.equal(deck.snapshot('chat').slides[0].revision, 1)
  deck.close()
  deck = new DeckService(join(root, 'deck.sqlite'))
  assert.equal(deck.content('chat', 'two', 2).html, preview.html)
})

test('legacy ambiguity stays read-only; edits escape text and reject CSS/HTML injection, stale bases and cancelled saves', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-edit-safety-')),
    deck = new DeckService(join(root, 'deck.sqlite'))
  t.after(async () => {
    deck.close()
    await rm(root, { recursive: true, force: true })
  })
  deck.confirm('chat', {
    outlineId: 'plan',
    slides: [
      { slideId: 'safe', title: 'Safe' },
      { slideId: 'legacy', title: 'Legacy' },
    ],
  })
  for (const [slideId, html] of [
    ['safe', '<h1 style="color:red">SAFE</h1><p>KEEP</p>'],
    ['legacy', '<h1 class="one" class="two">AMBIGUOUS</h1>'],
  ])
    deck.publish('chat', { outlineId: 'plan', slideId, html, expectedRevision: 0, publicationId: slideId })
  assert.equal(deck.editableSlide('chat', 'legacy').reason, 'DECK_EDIT_UNSUPPORTED')
  assert.equal(deck.content('chat', 'legacy', 1).html, '<h1 class="one" class="two">AMBIGUOUS</h1>')
  const doc = deck.editableSlide('chat', 'safe'),
    node = doc.nodes[0]
  const command = {
    outlineId: 'plan',
    slideId: 'safe',
    expectedRevision: 1,
    baseHash: doc.baseHash,
    editId: 'safe-edit',
    operations: [{ nodeId: node.nodeId, text: '<script>alert(1)</script> & literal' }],
  }
  const preview = deck.previewSlideEdit('chat', command)
  assert.match(preview.html, /&lt;script&gt;/)
  assert.equal(preview.html.includes('<script>'), false)
  for (const operation of [
    { nodeId: node.nodeId, layout: { textAlign: 'url(https://invalid.example)' } },
    { nodeId: node.nodeId, layout: { fontSize: '12px;background:red' } },
    { nodeId: node.nodeId, layout: { background: 'url(https://invalid.example)' } },
    { nodeId: node.nodeId, html: '<img src=x>' },
  ])
    assert.throws(() => deck.editSlide('chat', { ...command, operations: [operation] }), /DECK_INVALID_EDIT/)
  assert.throws(() => deck.editSlide('chat', { ...command, baseHash: '0'.repeat(64) }), /DECK_CONFLICT/)
  assert.throws(
    () => deck.editSlide('chat', { ...command, operations: [command.operations[0], command.operations[0]] }),
    /DECK_INVALID_EDIT/,
  )
  assert.throws(() => deck.editSlide('chat', command, AbortSignal.abort()), { name: 'AbortError' })
  assert.equal(deck.snapshot('chat').slides[0].revision, 1)
  assert.equal(deck.snapshot('chat').slides[1].revision, 1)
})

test('Host edit is authenticated and idle-only; preview is read-only and another Chat can save', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-edit-host-')),
    deck = new DeckService(join(root, 'deck.sqlite'))
  for (const id of ['busy', 'idle']) {
    deck.confirm(id, { outlineId: 'plan', slides: [{ slideId: 'slide', title: 'Slide' }] })
    deck.publish(id, {
      outlineId: 'plan',
      slideId: 'slide',
      expectedRevision: 0,
      publicationId: 'initial',
      html: '<h1>TEXT</h1>',
    })
  }
  const host = await startHost({
    decks: deck,
    slideEditor: deck,
    readHistory: async () => [],
    async openAgent(id) {
      return {
        sessionId: id,
        status: 'idle',
        history: async () => [],
        async dispose() {},
        async send() {
          return { status: 'completed', steps: 1, text: 'Waiting' }
        },
        question: () => ({ prompt: 'Wait', options: ['Next'], allowSkip: false }),
      }
    },
  })
  t.after(async () => {
    await host.close()
    deck.close()
    await rm(root, { recursive: true, force: true })
  })
  const client = new HostClient(host.origin, host.token)
  const waiting = await client.send({ sessionId: 'busy', input: 'Wait' })
  for (let i = 0; i < 100 && (await client.snapshot(waiting.requestId)).status !== 'awaiting_user'; i++) await delay(10)
  assert.equal((await client.snapshot(waiting.requestId)).status, 'awaiting_user')
  const edit = async (id, action, auth = true) => {
    const d = deck.editableSlide(id, 'slide')
    return fetch(`${host.origin}/api/sessions/${id}/deck/slides/slide/${action}`, {
      method: 'POST',
      headers: { ...(auth ? { authorization: `Bearer ${host.token}` } : {}), 'content-type': 'application/json' },
      body: JSON.stringify({
        outlineId: 'plan',
        slideId: 'slide',
        expectedRevision: 1,
        baseHash: d.baseHash,
        editId: 'direct',
        operations: [{ nodeId: d.nodes[0].nodeId, text: 'NEW' }],
      }),
    })
  }
  assert.equal((await edit('idle', 'edit', false)).status, 401)
  assert.equal((await edit('busy', 'preview')).status, 200)
  assert.equal(deck.snapshot('busy').slides[0].revision, 1)
  assert.equal((await edit('busy', 'edit')).status, 409)
  assert.equal((await edit('idle', 'edit')).status, 200)
  assert.equal(deck.snapshot('idle').slides[0].revision, 2)
  await client.stop(waiting.requestId)
  for await (const ignored of client.watch(waiting.requestId)) void ignored
  assert.equal((await edit('busy', 'edit')).status, 200)
})
