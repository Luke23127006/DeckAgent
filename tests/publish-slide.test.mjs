import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { registerPublishSlide } from '../packages/tools/presentation/lib/index.js'

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
