import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient, DeckClient } from '../packages/client/runtime/lib/index.js'

import { proposal, workflowModel } from './fixtures/outline-workflow.mjs'

test('shared workspace keeps earlier drafts and gives each confirmed request separate publishable paths', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-draft-collision-'))
  const workspace = join(dir, 'workspace')
  const app = await startLocalWeb({ workspace, dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'draft-paths' }, model: workflowModel() })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  await writeFile(join(workspace, 'slide-1.html'), '<h1>Keep earlier first draft</h1>')
  await writeFile(join(workspace, 'slide-2.html'), '<h1>Keep earlier second draft</h1>')
  const client = new HostClient(app.origin, app.token), deck = new DeckClient(app.origin, app.token)
  const paths = []
  for (const sessionId of ['first-deck', 'second-deck']) {
    await completed(client, { sessionId, input: 'Create a presentation about recycling', presentation: true })
    const accepted = await client.send({ sessionId, input: 'Confirm outline' })
    let terminal
    for await (const snapshot of client.watch(accepted.requestId)) terminal = snapshot
    const history = await client.history(sessionId)
    const writes = history.filter(message => message.role === 'tool' && message.content.includes('TOOL_FAILED'))
    assert.equal(writes.length, 0, writes[0]?.content)
    assert.equal(terminal.status, 'completed', JSON.stringify(terminal))
    const snapshot = await deck.snapshot(sessionId)
    assert.deepEqual(snapshot.slides.map(slide => slide.status), ['published', 'published'])
    assert.match((await deck.content(sessionId, 'slide-1', 1)).html, /Why recycle/)
    paths.push(...(await readdir(workspace)).filter(name => name.includes(accepted.requestId)))
  }
  assert.equal(paths.length, 4)
  assert.equal(new Set(paths).size, 4)
  assert.equal(await readFile(join(workspace, 'slide-1.html'), 'utf8'), '<h1>Keep earlier first draft</h1>')
  assert.equal(await readFile(join(workspace, 'slide-2.html'), 'utf8'), '<h1>Keep earlier second draft</h1>')
})

test('a confirmed deck can retry after a colliding write without another confirmation or overwriting the old draft', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-draft-retry-'))
  const workspace = join(dir, 'workspace')
  let failFirstGeneration = true
  const base = workflowModel()
  const options = { workspace, dataDir: join(dir, 'data'), selection: { provider: 'fixture', model: 'retry' },
    model: { async *stream(request) {
      if (failFirstGeneration && request.tools.some(tool => tool.name === 'publish_slide')) {
        if (request.messages.at(-1).role === 'user') {
          yield { type: 'tool-call', call: { id: 'older-write', name: 'write_file',
            arguments: { path: 'slide-1.html', content: '<h1>Should not overwrite</h1>' } } }
          yield { type: 'finish', reason: 'tool-calls' }
        } else {
          yield { type: 'text-delta', text: 'The draft write failed.' }
          yield { type: 'finish', reason: 'stop' }
        }
      } else yield* base.stream(request)
    } } }
  let app = await startLocalWeb(options)
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  await writeFile(join(workspace, 'slide-1.html'), '<h1>Keep old draft</h1>')
  let client = new HostClient(app.origin, app.token)
  await completed(client, { sessionId: 'retry', input: 'Create a presentation', presentation: true })
  const first = await client.send({ sessionId: 'retry', input: 'Confirm outline' })
  let failed
  for await (const value of client.watch(first.requestId)) failed = value
  assert.equal(failed.status, 'failed')
  assert.equal(failed.result.error.code, 'DECK_INCOMPLETE')
  failFirstGeneration = false
  await app.close()
  app = await startLocalWeb(options)
  client = new HostClient(app.origin, app.token)
  const retry = await completed(client, { sessionId: 'retry', input: 'Retry the unfinished slides using the new draft paths' })
  assert.notEqual(first.requestId, retry.requestId)
  assert.equal((await readdir(workspace)).filter(name => name.includes(retry.requestId)).length, 2)
  assert.deepEqual((await new DeckClient(app.origin, app.token).snapshot('retry')).slides.map(slide => slide.status), ['published', 'published'])
  assert.equal(await readFile(join(workspace, 'slide-1.html'), 'utf8'), '<h1>Keep old draft</h1>')
})

test('ordinary Send request gives the model a schema-valid outline argument example', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-outline-envelope-'))
  const toolResults = []
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'envelope' }, model: { async *stream(request) {
      const last = request.messages.at(-1)
      if (last.role === 'user') {
        // Follow the app-authored example. The former prompt described only the inner draft object.
        const example = /^Example propose_outline arguments: (.+)$/m.exec(request.messages[0].content)
        const args = example ? JSON.parse(example[1]) : proposal
        yield { type: 'tool-call', call: { id: 'proposal-envelope', name: 'propose_outline', arguments: args } }
        yield { type: 'finish', reason: 'tool-calls' }
      } else {
        toolResults.push(last)
        yield { type: 'text-delta', text: 'Review the outline before confirming.' }
        yield { type: 'finish', reason: 'stop' }
      }
    } } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  await completed(new HostClient(app.origin, app.token), { sessionId: 'envelope', input: 'Create a presentation about recycling' })
  assert.equal(toolResults.length, 1)
  assert.equal(toolResults[0].isError, false, toolResults[0].content)
  const snapshot = await (await fetch(`${app.origin}/api/sessions/envelope/outline`, {
    headers: { authorization: `Bearer ${app.token}` },
  })).json()
  assert.equal(snapshot.proposals.length, 1)
})

test('a staged proposal from a failed turn is never current and model calls cannot build or publish before confirmation', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-outline-fail-'))
  let fail = true
  const base = workflowModel()
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'failure' }, model: { async *stream(request) {
      if (!fail) { yield* base.stream(request); return }
      if (request.messages.at(-1).role === 'user') {
        for (const [id, name, args] of [
          ['write', 'write_file', { path: 'early.html', content: '<h1>Early</h1>' }],
          ['publish', 'publish_slide', { outlineId: 'fake', slideId: 'fake', path: 'early.html', expectedRevision: 0, publicationId: 'fake' }],
          ['proposal', 'propose_outline', { proposal: JSON.stringify(proposal) }],
        ]) yield { type: 'tool-call', call: { id, name, arguments: args } }
        yield { type: 'finish', reason: 'tool-calls' }
      } else throw new Error('Fixture model failed after staging')
    } } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'failure', input: 'Create a presentation', presentation: true })
  let result
  for await (const value of client.watch(accepted.requestId)) result = value
  assert.equal(result.status, 'failed')
  const denied = (await client.history('failure')).filter(m => m.role === 'tool').slice(0, 2)
  assert.equal(denied.length, 2)
  for (const message of denied) assert.match(message.content, /TOOL_NOT_ALLOWED/)
  const read = async () => (await fetch(`${app.origin}/api/sessions/failure/outline`, { headers: { authorization: `Bearer ${app.token}` } })).json()
  assert.deepEqual((await read()).proposals, [])
  assert.deepEqual(await readdir(join(dir, 'workspace')), [])
  fail = false
  await completed(client, { sessionId: 'failure', input: 'Try a fresh proposal' })
  assert.equal((await read()).proposals.length, 1)
})

test('revision races reject busy/stale confirmation and typed cancellation never builds slides', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-review-'))
  let release, started
  let wait = false
  const blocked = new Promise(resolve => { release = resolve })
  const entered = new Promise(resolve => { started = resolve })
  const base = workflowModel()
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'review' }, model: { async *stream(request) {
      if (wait && request.messages.at(-1).role === 'user') { started(); await blocked }
      yield* base.stream(request)
    } } })
  t.after(async () => { release(); await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  const read = async () => (await fetch(`${app.origin}/api/sessions/review/outline`, { headers: { authorization: `Bearer ${app.token}` } })).json()
  await completed(client, { sessionId: 'review', input: 'Create a presentation', presentation: true })
  const first = (await read()).proposals[0]
  wait = true
  const revision = await client.send({ sessionId: 'review', input: 'Looks good, but add detail about costs',
    outlineTarget: { outlineId: first.outlineId, version: first.version } })
  await entered
  await assert.rejects(client.send({ sessionId: 'review', input: 'Confirm outline',
    outlineAction: { type: 'confirm', outlineId: first.outlineId, version: first.version } }), /SESSION_BUSY/)
  assert.equal((await read()).confirmedId, null)
  release()
  for await (const value of client.watch(revision.requestId)) assert.notEqual(value.status, 'failed')
  const after = await read()
  assert.equal(after.proposals.length, 2)
  assert.equal(after.confirmedId, null)
  await assert.rejects(client.send({ sessionId: 'review', input: 'Confirm outline',
    outlineAction: { type: 'confirm', outlineId: first.outlineId, version: first.version } }), /OUTLINE_STALE/)
  await completed(client, { sessionId: 'review', input: 'Hủy dàn ý' })
  assert.equal((await read()).proposals[1].status, 'cancelled')
  assert.deepEqual(await readdir(join(dir, 'workspace')), [])
})

async function completed(client, input) {
  const accepted = await client.send(input)
  let result
  for await (const value of client.watch(accepted.requestId)) result = value
  assert.equal(result.status, 'completed', JSON.stringify(result))
  return result
}

test('two separate requests propose then confirm and progressively publish a multi-slide deck', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-workflow-'))
  const options = { workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    model: workflowModel(), selection: { provider: 'fixture', model: 'outline' } }
  let app = await startLocalWeb(options)
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token), deck = new DeckClient(app.origin, app.token)
  const read = async () => (await fetch(`${app.origin}/api/sessions/demo/outline`, { headers: { authorization: `Bearer ${app.token}` } })).json()
  const first = await completed(client, { sessionId: 'demo', input: 'Create two slides about recycling', presentation: true })
  const state = await read()
  assert.equal(state.proposals.length, 1)
  assert.equal(state.confirmedId, null)
  assert.equal((await deck.snapshot('demo')).version, 0)
  assert.deepEqual(await readdir(options.workspace), [])
  const current = state.proposals[0]
  assert.equal((await client.history('demo'))[current.responseIndex].role, 'assistant')
  assert.equal(current.requestId, first.requestId)
  const second = await completed(client, { sessionId: 'demo', input: 'Confirm outline',
    outlineAction: { type: 'confirm', outlineId: current.outlineId, version: current.version } })
  assert.notEqual(first.requestId, second.requestId)
  assert.match(second.result.text, /Draft ready/)
  assert.deepEqual((await deck.snapshot('demo')).slides.map(s => s.status), ['published', 'published'])
  assert.match((await deck.content('demo', current.slides[1].slideId, 1)).html, /Next actions/)
  assert.equal((await read()).proposals[0].status, 'confirmed')
  await assert.rejects(client.send({ sessionId: 'demo', input: 'Confirm outline',
    outlineAction: { type: 'confirm', outlineId: current.outlineId, version: current.version } }), /OUTLINE_ALREADY_CONFIRMED/)
  await app.close()
  app = await startLocalWeb(options)
  assert.equal((await read()).confirmedId, current.outlineId)
})

test('failed model admission leaves the outline unconfirmed; a later explicit typed confirmation uses the saved current proposal', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-admission-'))
  const options = { workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'outline' }, model: workflowModel() }
  let app = await startLocalWeb(options)
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  await completed(new HostClient(app.origin, app.token), { sessionId: 'admit', input: 'Create a presentation', presentation: true })
  await app.close()
  app = await startLocalWeb({ ...options, model: undefined })
  await assert.rejects(new HostClient(app.origin, app.token).send({ sessionId: 'admit', input: 'Confirm outline' }), /MODEL_NOT_SELECTABLE/)
  const saved = await (await fetch(`${app.origin}/api/sessions/admit/outline`, { headers: { authorization: `Bearer ${app.token}` } })).json()
  assert.equal(saved.confirmedId, null)
  assert.equal(saved.proposals.length, 1)
  assert.equal((await new DeckClient(app.origin, app.token).snapshot('admit')).version, 0)
  await app.close()
  app = await startLocalWeb(options)
  await completed(new HostClient(app.origin, app.token), { sessionId: 'admit', input: 'Xác nhận dàn ý' })
  assert.deepEqual((await new DeckClient(app.origin, app.token).snapshot('admit')).slides.map(s => s.status), ['published', 'published'])
})

test('a premature model closing message cannot mark an unpublished draft as completed', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-incomplete-'))
  const base = workflowModel()
  const app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'outline' }, model: { async *stream(request) {
      if (request.tools.some(tool => tool.name === 'publish_slide')) {
        yield { type: 'text-delta', text: 'Draft ready' }
        yield { type: 'finish', reason: 'stop' }
      } else yield* base.stream(request)
    } } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }) })
  const client = new HostClient(app.origin, app.token)
  await completed(client, { sessionId: 'incomplete', input: 'Create a presentation', presentation: true })
  const accepted = await client.send({ sessionId: 'incomplete', input: 'Confirm outline' })
  let terminal
  for await (const value of client.watch(accepted.requestId)) terminal = value
  assert.equal(terminal.status, 'failed')
  assert.equal(terminal.result.error.code, 'DECK_INCOMPLETE')
  assert.match((await client.history('incomplete')).at(-1).content, /draft is not ready/)
})
