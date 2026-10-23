import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { editingScope } from '../apps/local-web/lib/types/editing-workflow.js'
import { RequestController } from '../packages/host/api/lib/types/request-controller.js'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { HostClient, DeckClient } from '../packages/client/runtime/lib/index.js'

const plan = { sessionId: 'editing', outlineId: 'outline', slides: [
  { slideId: 'one', title: 'Opening' }, { slideId: 'two', title: 'Details' }, { slideId: 'three', title: 'Closing' },
] }
const deck = { slides: plan.slides.map((slide, order) => ({ ...slide, order, revision: order === 2 ? 0 : 1, status: order === 2 ? 'pending' : 'published' })) }

test('scope resolves explicit references and denies ambiguous, mismatched and excluded targets', () => {
  for (const [input, expected] of [
    ['Sửa slide 2', ['two']], ['Edit slides 1 and 3', ['one', 'three']],
    ['Edit slides 1-2', ['one', 'two']], ['Sửa slide "Details"', ['two']],
    ['Continue', ['three']], ['Edit all slides', ['one', 'two', 'three']],
    ['Make it better', []], ['Edit slide 4', []], ['Edit slides 1-999999999', []],
    ['Edit slide 1 "Details"', []], ['Edit all slides except slide 2', []],
    ['Do not change slide 1; edit slide 2', []], ['Add slide 4', []],
    ['Edit slide 2 to match slide 1', ['two']], ['Edit slide 2 title to "all slides"', ['two']],
    ['Edit slide 2 or 3', []], ['Edit slide 2.5', []], ['Edit slide 2abc', []],
  ]) assert.deepEqual(editingScope(input, deck), expected, input)
})

test('Stop is idempotent and retains the lock through disposal and finalization', async () => {
  let releaseDispose, releaseFinalize, disposed
  const disposalStarted = new Promise(resolve => { disposed = resolve })
  const disposal = new Promise(resolve => { releaseDispose = resolve })
  const finalized = new Promise(resolve => { releaseFinalize = resolve })
  const controller = new RequestController(async () => ({
    async send(_input, { signal }) {
      await new Promise(resolve => { if (signal.aborted) resolve(); else signal.addEventListener('abort', resolve, { once: true }) })
      return { status: 'cancelled', text: '', steps: 0, error: { code: 'TURN_CANCELLED', message: 'Stopped' } }
    },
    async dispose() { disposed(); await disposal },
  }), async () => finalized)
  const accepted = await controller.submit({ sessionId: 'locked', input: 'work' })
  assert.equal(controller.stop(accepted.requestId).status, 'running')
  controller.stop(accepted.requestId)
  await disposalStarted
  await assert.rejects(controller.submit({ sessionId: 'locked', input: 'overlap' }), { code: 'SESSION_BUSY' })
  releaseDispose()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(controller.active('locked'), accepted.requestId)
  releaseFinalize()
  await controller.close()
  assert.equal(controller.stop(accepted.requestId).status, 'cancelled')
  assert.equal(controller.active('locked'), undefined)
  assert.throws(() => controller.stop('missing'), { code: 'REQUEST_NOT_FOUND' })
})

test('Agent reads current HTML, publishes only authorized slide, preserves other revisions and restarts without replay', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-editing-'))
  await mkdir(join(dir, 'data'))
  const seed = new DeckService(join(dir, 'data', 'decks.sqlite'))
  seed.confirm(plan.sessionId, plan)
  for (const slide of plan.slides) seed.publish(plan.sessionId, { outlineId: plan.outlineId, slideId: slide.slideId,
    expectedRevision: 0, publicationId: `seed-${slide.slideId}`, html: `<h1>${slide.title}</h1>` })
  seed.close()
  let calls = 0
  const results = []
  const options = { workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'), confirmedDecks: [plan],
    selection: { provider: 'fixture', model: 'editing' }, model: { async *stream(request) {
      calls++
      const last = request.messages.at(-1)
      assert.equal(request.tools.some(tool => tool.name === 'propose_outline'), false)
      const tool = (name, args) => ({ type: 'tool-call', call: { id: `edit-${request.messages.length}`, name, arguments: args } })
      if (last.role === 'user') yield tool('read_slide', { slideId: 'two' })
      else {
        results.push(last)
        if (last.name === 'read_slide') {
          assert.equal(JSON.parse(last.content).html, '<h1>Details</h1>')
          yield tool('write_file', { path: 'edit.html', content: '<h1>Edited details</h1>' })
        } else if (last.name === 'write_file') yield tool('publish_slide', { outlineId: 'outline', slideId: 'one', expectedRevision: 1, publicationId: 'denied', path: 'edit.html' })
        else if (last.isError) yield tool('publish_slide', { outlineId: 'outline', slideId: 'two', expectedRevision: 1, publicationId: 'edit-two', path: 'edit.html' })
        else { yield { type: 'text-delta', text: 'Slide 2 updated; other slides unchanged.' }; yield { type: 'finish', reason: 'stop' }; return }
      }
      yield { type: 'finish', reason: 'tool-calls' }
    } } }
  let app = await startLocalWeb(options)
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  let client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'editing', input: 'Edit slide 2' })
  let terminal
  for await (const snapshot of client.watch(accepted.requestId)) terminal = snapshot
  assert.equal(terminal.status, 'completed')
  assert.ok(results.some(result => result.name === 'publish_slide' && result.isError))
  let api = new DeckClient(app.origin, app.token)
  const beforeRestart = await api.snapshot('editing')
  assert.deepEqual(beforeRestart.slides.map(slide => slide.revision), [1, 2, 1])
  assert.equal((await api.content('editing', 'one', 1)).html, '<h1>Opening</h1>')
  assert.equal((await api.content('editing', 'two', 1)).html, '<h1>Details</h1>')
  const before = calls
  await app.close()
  app = await startLocalWeb(options)
  client = new HostClient(app.origin, app.token)
  api = new DeckClient(app.origin, app.token)
  assert.deepEqual(await api.snapshot('editing'), beforeRestart)
  assert.ok((await client.history('editing')).some(message => message.content.includes('Slide 2 updated')))
  assert.equal(calls, before)
  const headers = { authorization: `Bearer ${app.token}` }
  assert.equal((await fetch(`${app.origin}/api/requests/absent/stop`, { method: 'POST' })).status, 401)
  assert.equal((await fetch(`${app.origin}/api/requests/absent/stop`, { method: 'POST', headers })).status, 404)
})

for (const mode of ['stop', 'failure']) test(`interrupted editing (${mode}) keeps committed revisions and hides unfinished drafts`, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-edit-interruption-'))
  await mkdir(join(dir, 'data'))
  const seed = new DeckService(join(dir, 'data', 'decks.sqlite'))
  seed.confirm('editing', plan)
  for (const slide of plan.slides) seed.publish('editing', { outlineId: 'outline', slideId: slide.slideId,
    expectedRevision: 0, publicationId: `seed-${slide.slideId}`, html: `<h1>${slide.title}</h1>` })
  seed.close()
  let ready
  const paused = new Promise(resolve => { ready = resolve })
  const options = { workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'), confirmedDecks: [plan],
    selection: { provider: 'fixture', model: 'interrupt' }, model: { async *stream(request) {
      const last = request.messages.at(-1)
      let name, args
      if (last.role === 'user') { name = 'write_file'; args = { path: 'finished.html', content: '<h1>Changed opening</h1>' } }
      else if (last.name === 'write_file' && !request.messages.some(message => message.role === 'tool' && message.name === 'publish_slide')) {
        name = 'publish_slide'; args = { outlineId: 'outline', slideId: 'one', expectedRevision: 1, publicationId: 'finished', path: 'finished.html' }
      } else if (last.name === 'publish_slide') { name = 'write_file'; args = { path: 'unfinished.html', content: '<h1>Must remain private</h1>' } }
      else {
        ready()
        if (mode === 'failure') throw new Error('Fixture model failure')
        await new Promise((_, reject) => {
          if (request.signal.aborted) reject(request.signal.reason)
          else request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true })
        })
        return
      }
      yield { type: 'tool-call', call: { id: `interruption-${request.messages.length}`, name, arguments: args } }
      yield { type: 'finish', reason: 'tool-calls' }
    } } }
  const app = await startLocalWeb(options)
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'editing', input: 'Edit all slides' })
  await paused
  if (mode === 'stop') await client.stop(accepted.requestId)
  let terminal
  for await (const snapshot of client.watch(accepted.requestId)) terminal = snapshot
  assert.equal(terminal.status, mode === 'stop' ? 'cancelled' : 'failed')
  assert.match(terminal.result.text, /1 slides published or changed/)
  const requests = await (await fetch(`${app.origin}/api/sessions/editing/requests`, { headers: { authorization: `Bearer ${app.token}` } })).json()
  const record = requests.find(item => item.requestId === accepted.requestId)
  assert.ok(Number.isSafeInteger(record.noticeIndex) && record.noticeIndex >= record.historyStart)
  assert.equal((await client.history('editing'))[record.noticeIndex].content, terminal.result.text, 'Recovery provenance must point at the exact saved Host notice')
  const api = new DeckClient(app.origin, app.token)
  assert.deepEqual((await api.snapshot('editing')).slides.map(slide => slide.revision), [2, 1, 1])
  assert.equal((await api.content('editing', 'two', 1)).html, '<h1>Details</h1>')
  assert.equal((await api.content('editing', 'one', 2)).html, '<h1>Changed opening</h1>')
})

test('a model claiming an edit is finished without publishing cannot complete the edit request', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-empty-edit-'))
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'), confirmedDecks: [plan],
    selection: { provider: 'fixture', model: 'empty' }, model: { async *stream() {
      yield { type: 'text-delta', text: 'All changes are done.' }
      yield { type: 'finish', reason: 'stop' }
    } } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'editing', input: 'Edit slide 2' })
  let terminal
  for await (const snapshot of client.watch(accepted.requestId)) terminal = snapshot
  assert.equal(terminal.status, 'failed')
  assert.equal(terminal.result.error.code, 'EDIT_INCOMPLETE')
  assert.match(terminal.result.text, /1 requested slides were not changed/)
  assert.deepEqual((await new DeckClient(app.origin, app.token).snapshot('editing')).slides.map(slide => slide.revision), [0, 0, 0])
})
