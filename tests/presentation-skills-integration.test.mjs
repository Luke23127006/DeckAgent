import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
const require = createRequire(new URL('../apps/local-web/package.json', import.meta.url))
const { Client } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/index.js')).href)
const { StdioClientTransport } = await import(
  pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href
)
import { DeckService } from '../packages/presentation/deck/lib/index.js'

test('external stdio MCP preserves operator confirmation, session binding, scoped edits and stale revision checks', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-external-')),
    deck = new DeckService(join(root, 'decks.sqlite'))
  const clients = []
  t.after(async () => {
    for (const c of clients) await c.close()
    deck.close()
    await rm(root, { recursive: true, force: true, maxRetries: 5 })
  })
  const connect = async (slides, version) => {
    const client = new Client({ name: 'qualification', version: '1.0.0' })
    await client.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: [
          process.env.DECKAGENT_SKILLS_ENTRYPOINT ?? resolve('apps/local-web/lib/external-cli.js'),
          '--profile',
          root,
          '--session',
          'chat',
          '--action',
          'serve',
          '--slides',
          slides.join(','),
          '--version',
          String(version),
        ],
        stderr: 'ignore',
      }),
    )
    clients.push(client)
    return client
  }
  const call = (c, name, args = {}) => c.callTool({ name, arguments: args })
  const review = await connect([], 0)
  assert.deepEqual((await review.listTools()).tools.map(tool => tool.name).sort(), [
    'presentation_state',
    'propose_outline',
    'read_slide',
  ])
  assert.equal((await call(review, 'publish_slide', { publication: '{}' })).isError, true)
  const proposal = await call(review, 'propose_outline', {
    proposal: JSON.stringify({
      overview: 'Tái chế',
      slides: [
        { title: 'One', content: 'Why' },
        { title: 'Two', content: 'Actions' },
      ],
    }),
  })
  assert.equal(proposal.isError, false)
  const state = JSON.parse((await call(review, 'presentation_state')).content[0].text)
  assert.equal(state.contractVersion, 1)
  assert.equal(state.deck.outlineId, null)
  const outline = state.outline.proposals[0]
  assert.equal((await call(review, 'confirm_outline', { outlineId: outline.outlineId })).isError, true)
  await review.close()
  deck.confirmOutline('chat', { outlineId: outline.outlineId, version: outline.version })
  const ids = outline.slides.map(s => s.slideId),
    writer = await connect(ids, 1)
  for (const [index, id] of ids.entries())
    assert.equal(
      (
        await call(writer, 'publish_slide', {
          publication: JSON.stringify({
            outlineId: outline.outlineId,
            slideId: id,
            expectedRevision: 0,
            publicationId: 'initial-' + index,
            html: `<h1>SLIDE_${index + 1}</h1>`,
          }),
        })
      ).isError,
      false,
    )
  await writer.close()
  const editor = await connect([ids[1]], 3),
    before = deck.content('chat', ids[0], 1).html
  const doc = JSON.parse((await call(editor, 'read_slide', { slideId: ids[1] })).content[0].text)
  assert.equal(
    (await editor.listTools()).tools.some(tool => tool.name === 'confirm_outline' || tool.name === 'propose_outline'),
    false,
  )
  const edit = {
    outlineId: outline.outlineId,
    slideId: ids[1],
    expectedRevision: 1,
    baseHash: doc.baseHash,
    editId: 'edit',
    operations: [{ nodeId: doc.nodes[0].nodeId, text: 'EDITED_TWO' }],
  }
  assert.equal(
    (await call(editor, 'patch_slide', { edit: JSON.stringify({ ...edit, slideId: ids[0] }) })).isError,
    true,
  )
  assert.equal((await call(editor, 'patch_slide', { edit: JSON.stringify(edit) })).isError, false)
  assert.equal((await call(editor, 'patch_slide', { edit: JSON.stringify(edit) })).isError, false)
  assert.equal(
    (await call(editor, 'patch_slide', { edit: JSON.stringify({ ...edit, editId: 'stale' }) })).isError,
    true,
  )
  assert.equal((await call(editor, 'presentation_state', { sessionId: 'other' })).isError, true)
  assert.equal(deck.content('chat', ids[0], 1).html, before)
  assert.equal(deck.snapshot('chat').slides[0].revision, 1)
  assert.equal(deck.snapshot('chat').slides[1].revision, 2)
  assert.equal(deck.snapshot('other').version, 0)
})
