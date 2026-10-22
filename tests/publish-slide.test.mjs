import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { registerPublishSlide } from '../packages/tools/presentation/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'

test('a rejected meta charset draft returns actionable safe feedback and can publish a new corrected draft', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-meta-recovery-'))
  const root = join(dir, 'workspace')
  await mkdir(root)
  const decks = new DeckService(join(dir, 'decks.sqlite'))
  decks.confirm('chat', { outlineId: 'outline', slides: [{ slideId: 'slide', title: 'Recycling' }] })
  const tools = new ToolRegistry()
  const remove = await registerPublishSlide(tools, { root, sessionId: 'chat', decks, allowedSlideIds: ['slide'] })
  t.after(async () => { remove(); decks.close(); await rm(dir, { recursive: true, force: true }) })
  const html = '<!doctype html><html><head><meta charset="UTF-8"><style>h1{color:green}</style></head><body><h1>Recycling</h1></body></html>'
  await writeFile(join(root, 'first.html'), html)
  const publish = (path, publicationId) => tools.execute({ id: publicationId, name: 'publish_slide', arguments: {
    outlineId: 'outline', slideId: 'slide', expectedRevision: 0, path, publicationId,
  } }, ['publish_slide'], new AbortController().signal)
  const rejected = await publish('first.html', 'first')
  assert.equal(rejected.isError, true)
  const error = JSON.parse(rejected.content).error
  assert.equal(error.code, 'SLIDE_UNSAFE_HTML')
  assert.match(error.message, /meta/i)
  assert.match(error.message, /new draft/i)
  assert.equal(decks.snapshot('chat').slides[0].revision, 0)
  await writeFile(join(root, 'corrected.html'), html.replace('<meta charset="UTF-8">', ''))
  const receipt = await publish('corrected.html', 'corrected')
  assert.equal(receipt.isError, false)
  assert.equal(JSON.parse(receipt.content).revision, 1)
  assert.equal(decks.content('chat', 'slide', 1).html.includes('<meta'), false)
  assert.equal(await readFile(join(root, 'first.html'), 'utf8'), html)
})

test('publish_slide reads a safe draft and binds the Host Session; unsafe paths never reach publisher', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-publish-tool-'))
  await mkdir(join(dir, 'workspace'))
  await writeFile(join(dir, 'workspace', 'slide.html'), '<h1>Draft</h1>')
  await writeFile(join(dir, 'private.html'), 'PRIVATE')
  t.after(() => rm(dir, { recursive: true, force: true }))
  const tools = new ToolRegistry()
  const calls = []
  const remove = await registerPublishSlide(tools, {
    root: join(dir, 'workspace'),
    sessionId: 'host-chat',
    decks: {
      publish(sessionId, value) {
        calls.push({ sessionId, ...value })
        return { revision: 1, version: 2, sessionId, deckId: sessionId, slideId: value.slideId }
      },
    },
  })
  t.after(remove)
  const args = {
    outlineId: 'outline',
    slideId: 'slide',
    expectedRevision: 0,
    publicationId: 'attempt-1',
    path: 'slide.html',
  }
  const call = value =>
    tools.execute(
      { id: 'call', name: 'publish_slide', arguments: value },
      ['publish_slide'],
      new AbortController().signal,
    )
  const result = await call(args)
  assert.equal(result.isError, false)
  assert.equal(JSON.parse(result.content).revision, 1)
  assert.equal(calls[0].sessionId, 'host-chat')
  assert.equal(calls[0].html, '<h1>Draft</h1>')
  assert.equal((await call({ ...args, sessionId: 'other-chat' })).isError, true)
  for (const path of ['../private.html', join(dir, 'private.html'), 'CON', 'slide.html:stream']) {
    assert.equal((await call({ ...args, path })).isError, true)
  }
  assert.equal(calls.length, 1)
  remove()
  assert.equal((await call(args)).isError, true)
})
