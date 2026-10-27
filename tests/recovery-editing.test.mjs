import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, mkdir, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { editingScope } from '../apps/local-web/lib/types/editing-workflow.js'
import { RequestController } from '../packages/host/api/lib/types/request-controller.js'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { HostClient, DeckClient } from '../packages/client/runtime/lib/index.js'
import { workflowModel } from './fixtures/outline-workflow.mjs'
import { RuntimeError } from '../packages/agent/runtime/lib/index.js'

async function workspaceFiles(root) {
  return (await readdir(root, { recursive: true, withFileTypes: true }))
    .filter(entry => !entry.isDirectory())
    .map(entry => join(relative(root, entry.parentPath), entry.name)).sort()
}

function requestRoot(workspace, sessionId, requestId) {
  return join(workspace, createHash('sha256').update(sessionId).digest('hex'), requestId)
}

const plan = { sessionId: 'editing', outlineId: 'outline', slides: [
  { slideId: 'one', title: 'Opening' }, { slideId: 'two', title: 'Details' }, { slideId: 'three', title: 'Closing' },
] }
const deck = { slides: plan.slides.map((slide, order) => ({ ...slide, order, revision: order === 2 ? 0 : 1, status: order === 2 ? 'pending' : 'published' })) }

for (const mode of ['stalls', 'draft-written', 'partly-published', 'provider-failure']) test(`idle recovery is bounded and never replays ${mode}`, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-idle-budget-'))
  let attempts = 0
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'), confirmedDecks: [plan],
    selection: { provider: 'fixture', model: 'idle-budget' }, model: { async *stream(request) {
      const last = request.messages.at(-1)
      if (last.role === 'user') attempts++
      if (mode === 'provider-failure') throw new RuntimeError('PROVIDER_HTTP', 'Fixture provider error')
      if (mode !== 'stalls' && last.role === 'user') {
        yield { type: 'tool-call', call: { id: 'budget-write', name: 'write_file', arguments: { path: 'draft.html', content: '<h1>One draft</h1>' } } }
        yield { type: 'finish', reason: 'tool-calls' }
      } else if (mode === 'partly-published' && last.name === 'write_file') {
        yield { type: 'tool-call', call: { id: 'budget-publish', name: 'publish_slide', arguments: {
          outlineId: 'outline', slideId: 'one', expectedRevision: 0, publicationId: 'once', path: 'draft.html',
        } } }
        yield { type: 'finish', reason: 'tool-calls' }
      } else { yield { type: 'text-delta', text: 'Waiting for Host; work will happen later.' }; yield { type: 'finish', reason: 'stop' } }
    } } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'editing', input: 'Tiếp tục' })
  let terminal
  for await (const value of client.watch(accepted.requestId)) terminal = value
  assert.equal(terminal.status, 'failed')
  assert.equal(attempts, mode === 'stalls' ? 2 : 1)
  assert.equal(terminal.result.error.code, mode === 'provider-failure' ? 'PROVIDER_HTTP' : 'EDIT_INCOMPLETE')
  assert.deepEqual((await new DeckClient(app.origin, app.token).snapshot('editing')).slides.map(slide => slide.revision), mode === 'partly-published' ? [1, 0, 0] : [0, 0, 0])
  assert.deepEqual(await workspaceFiles(join(dir, 'workspace')), mode === 'draft-written' || mode === 'partly-published' ? [relative(join(dir, 'workspace'), join(requestRoot(join(dir, 'workspace'), 'editing', accepted.requestId), 'draft.html'))] : [])
  if (mode === 'draft-written' || mode === 'partly-published') {
    assert.equal(await readFile(join(requestRoot(join(dir, 'workspace'), 'editing', accepted.requestId), 'draft.html'), 'utf8'), '<h1>One draft</h1>')
  }
  assert.deepEqual((await client.history('editing')).filter(message => message.role === 'user').map(message => message.content), ['Tiếp tục'])
})

test('Stop during the one idle recovery attempt cancels without a third model attempt', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-stop-recovery-'))
  let attempts = 0, signalEntered
  const entered = new Promise(resolve => { signalEntered = resolve })
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'), confirmedDecks: [plan],
    selection: { provider: 'fixture', model: 'stop-recovery' }, model: { async *stream(request) {
      attempts++
      if (attempts === 2) {
        signalEntered()
        await new Promise((_, reject) => {
          if (request.signal.aborted) reject(new Error('Stopped'))
          else request.signal.addEventListener('abort', () => reject(new Error('Stopped')), { once: true })
        })
      }
      yield { type: 'text-delta', text: 'Waiting for Host.' }; yield { type: 'finish', reason: 'stop' }
    } } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'editing', input: 'Tiếp tục' })
  await entered
  await client.stop(accepted.requestId)
  let terminal
  for await (const value of client.watch(accepted.requestId)) terminal = value
  assert.equal(terminal.status, 'cancelled')
  assert.equal(attempts, 2)
  assert.deepEqual(await workspaceFiles(join(dir, 'workspace')), [])
})

test('a natural request to build all seven confirmed slides resolves scope before writing or publishing', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-natural-resume-'))
  const confirmed = { sessionId: 'seven', outlineId: 'seven-outline', slides: Array.from({ length: 7 }, (_, i) => ({ slideId: `slide-${i + 1}`, title: `Title ${i + 1}` })) }
  const base = workflowModel()
  let resolved = false
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'), confirmedDecks: [confirmed],
    selection: { provider: 'fixture', model: 'natural-resume' }, model: { async *stream(request) {
      const last = request.messages.at(-1)
      if (request.tools.some(tool => tool.name === 'resolve_slide_scope')) {
        assert.equal(request.tools.some(tool => ['write_file', 'publish_slide'].includes(tool.name)), false)
        if (last.role === 'user') {
          yield { type: 'tool-call', call: { id: 'resolve-seven', name: 'resolve_slide_scope', arguments: {
            scope: JSON.stringify({ mode: 'continue', slideIds: confirmed.slides.map(slide => slide.slideId) }),
          } } }
          yield { type: 'finish', reason: 'tool-calls' }
        } else {
          assert.equal(last.isError, false)
          resolved = true
          yield { type: 'text-delta', text: 'Continue the confirmed plan.' }; yield { type: 'finish', reason: 'stop' }
        }
      } else yield* base.stream(request)
    } } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'seven', input: 'Xác nhận lại dàn ý 7 slide đã nêu và dựng toàn bộ slide' })
  let terminal
  for await (const value of client.watch(accepted.requestId)) terminal = value
  assert.equal(terminal.status, 'completed')
  assert.equal(resolved, true)
  assert.deepEqual((await new DeckClient(app.origin, app.token).snapshot('seven')).slides.map(slide => slide.status), Array(7).fill('published'))
  assert.deepEqual((await client.history('seven')).filter(message => message.role === 'user').map(message => message.content),
    ['Xác nhận lại dàn ý 7 slide đã nêu và dựng toàn bộ slide'])
})

test('unscoped writes cannot create drafts and cannot be reported as completed despite model success prose', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-unscoped-write-'))
  let step = 0
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'), confirmedDecks: [plan],
    selection: { provider: 'fixture', model: 'unscoped' }, model: { async *stream(request) {
      assert.equal(request.tools.some(tool => ['write_file', 'publish_slide'].includes(tool.name)), false)
      if (step++ === 0) {
        yield { type: 'tool-call', call: { id: 'unscoped-write', name: 'write_file', arguments: { path: 'must-not-exist.html', content: '<h1>Forbidden</h1>' } } }
        yield { type: 'finish', reason: 'tool-calls' }
      } else {
        yield { type: 'text-delta', text: 'Everything is done and published.' }
        yield { type: 'finish', reason: 'stop' }
      }
    } } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'editing', input: 'Làm nốt phần đó giúp tôi' })
  let terminal
  for await (const value of client.watch(accepted.requestId)) terminal = value
  assert.equal(terminal.status, 'failed')
  assert.equal(terminal.result.error.code, 'SLIDE_SCOPE_DENIED')
  assert.deepEqual(await workspaceFiles(join(dir, 'workspace')), [])
  assert.deepEqual((await new DeckClient(app.origin, app.token).snapshot('editing')).slides.map(slide => slide.revision), [0, 0, 0])
})

for (const invalid of ['unknown-id', 'published-slide', 'duplicate-id']) test(`scope resolution rejects ${invalid} without granting writes`, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-invalid-scope-'))
  await mkdir(join(dir, 'data'))
  const seed = new DeckService(join(dir, 'data', 'decks.sqlite'))
  seed.confirm(plan.sessionId, plan)
  seed.publish(plan.sessionId, { outlineId: plan.outlineId, slideId: 'one', expectedRevision: 0, publicationId: 'seed', html: '<h1>Preserve published</h1>' })
  seed.close()
  const ids = invalid === 'unknown-id' ? ['invented'] : invalid === 'published-slide' ? ['one'] : ['two', 'two']
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'), confirmedDecks: [plan],
    selection: { provider: 'fixture', model: 'invalid-scope' }, model: { async *stream(request) {
      assert.equal(request.tools.some(tool => ['write_file', 'publish_slide'].includes(tool.name)), false)
      if (request.messages.at(-1).role === 'user') {
        yield { type: 'tool-call', call: { id: 'invalid-scope', name: 'resolve_slide_scope', arguments: { scope: JSON.stringify({ mode: 'continue', slideIds: ids }) } } }
        yield { type: 'finish', reason: 'tool-calls' }
      } else {
        assert.equal(request.messages.at(-1).isError, true)
        yield { type: 'text-delta', text: 'Done' }; yield { type: 'finish', reason: 'stop' }
      }
    } } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'editing', input: 'Làm nốt phần còn lại' })
  let terminal
  for await (const value of client.watch(accepted.requestId)) terminal = value
  assert.equal(terminal.status, 'failed')
  assert.equal(terminal.result.error.code, 'SLIDE_SCOPE_DENIED')
  assert.deepEqual((await new DeckClient(app.origin, app.token).snapshot('editing')).slides.map(slide => slide.revision), [1, 0, 0])
  assert.deepEqual(await workspaceFiles(join(dir, 'workspace')), [])
})

test('ambiguous follow-up asks within the request and a scoped answer finishes pending slides without re-confirming', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-followup-question-'))
  const base = workflowModel()
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'), confirmedDecks: [plan],
    selection: { provider: 'fixture', model: 'scope-question' }, model: { async *stream(request) {
      const last = request.messages.at(-1)
      if (request.tools.some(tool => tool.name === 'publish_slide')) { yield* base.stream(request); return }
      assert.equal(request.tools.some(tool => tool.name === 'review_outline'), false)
      if (last.role === 'user') {
        yield { type: 'tool-call', call: { id: `scope-question-${request.messages.length}`, name: last.content === 'Làm tiếp phần đó' ? 'ask_clarification' : 'resolve_slide_scope',
          arguments: last.content === 'Làm tiếp phần đó'
            ? { question: JSON.stringify({ prompt: 'Bạn muốn tạo phần nào?', options: ['Tạo tất cả slide còn trống'], allowSkip: false }) }
            : { scope: JSON.stringify({ mode: 'continue', slideIds: ['one', 'two', 'three'] }) } } }
        yield { type: 'finish', reason: 'tool-calls' }
      } else { yield { type: 'text-delta', text: 'Host will apply your decision.' }; yield { type: 'finish', reason: 'stop' } }
    } } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'editing', input: 'Làm tiếp phần đó' })
  let question
  for await (const snapshot of client.watch(accepted.requestId)) if (snapshot.status === 'awaiting_user') { question = snapshot.question; break }
  assert.equal(question.allowSkip, false)
  await client.reply(accepted.requestId, { sessionId: 'editing', questionId: question.questionId, version: question.version,
    replyId: 'scope-answer', answer: { type: 'option', index: 0 } })
  let terminal
  for await (const snapshot of client.watch(accepted.requestId)) terminal = snapshot
  assert.equal(terminal.status, 'completed')
  assert.deepEqual((await new DeckClient(app.origin, app.token).snapshot('editing')).slides.map(slide => slide.status), ['published', 'published', 'published'])
  assert.equal((await client.history('editing')).filter(message => message.role === 'user').length, 2)
})

test('scope resolves explicit references and denies ambiguous, mismatched and excluded targets', () => {
  for (const [input, expected] of [
    ['Sửa slide 2', ['two']], ['Edit slides 1 and 3', ['one', 'three']],
    ['Rút gọn slide 3', ['three']], ['Rút gọn slide 2 và thêm slide về rủi ro', []],
    ['Rút gọn slide 1 "Details"', []], ['Rút gọn slide 4', []],
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
