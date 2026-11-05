import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ContextStore } from '../apps/local-web/lib/types/context/store.js'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import { DatabaseSync } from 'node:sqlite'
import { startHost } from '../packages/host/api/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { setTimeout as delay } from 'node:timers/promises'

test('checkpoints keep original history and newer tool pairs; survive reopen and isolate selections and Chats', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-context-'))
  let store = new ContextStore(join(root, 'context.sqlite'))
  t.after(async () => {
    store.close()
    await rm(root, { recursive: true, force: true })
  })
  const selection = { provider: 'test', model: 'one' }
  const history = [
    { role: 'user', content: 'Keep slide 1 unchanged. '.repeat(100) },
    { role: 'assistant', content: 'Confirmed; source FACT_42, not permission.' },
  ]
  const original = structuredClone(history)
  const saved = store.commit('chat', selection, history, 'Keep slide 1 unchanged; source FACT_42; no permission.', 0)
  assert.equal(saved.revision, 1)
  assert.deepEqual(history, original)
  const tail = [
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ id: 'call', name: 'read_material', arguments: { materialId: 'source' } }],
    },
    { role: 'tool', content: 'FACT_43', toolCallId: 'call', name: 'read_material', isError: false },
  ]
  assert.deepEqual(store.project('chat', selection, [...history, ...tail]).slice(1), tail)
  assert.match(store.project('chat', selection, history)[0].content, /FACT_42/)
  assert.deepEqual(store.project('other', selection, history), history)
  assert.deepEqual(store.project('chat', { ...selection, model: 'two' }, history), history)
  assert.deepEqual(store.project('chat', selection, [{ role: 'user', content: 'Changed prefix' }]), [
    { role: 'user', content: 'Changed prefix' },
  ])
  assert.throws(() => store.commit('chat', selection, history, 'Stale replacement', 0), /CONTEXT_STALE/)
  assert.throws(() => store.commit('chat', selection, history, '', 1), /CONTEXT_SUMMARY_INVALID/)
  store.close()
  store = new ContextStore(join(root, 'context.sqlite'))
  assert.equal(store.checkpoint('chat', selection).revision, 1)
  assert.match(store.project('chat', selection, history)[0].content, /FACT_42/)
})

test('usage includes draft and cached material, labels unknowns, suggests at 85 percent without model work', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-context-usage-'))
  const selection = { provider: 'fixture', model: 'text' }
  const app = await startLocalWeb({
    dataDir: root,
    selection,
    openCode: { executable: 'unused-for-measurement' },
    materials: { maxFileBytes: 1024, maxAttachments: 3 },
    connections: [{ id: 'fixture', protocol: 'chat-completions', baseUrl: 'http://127.0.0.1:1/v1' }],
  })
  t.after(async () => {
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  const api = async (path, body = {}, method = 'POST') => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    return { status: response.status, value: await response.json() }
  }
  assert.equal(
    (
      await api(
        'providers/fixture',
        {
          displayName: 'Fixture',
          protocol: 'chat-completions',
          baseUrl: 'http://127.0.0.1:1/v1',
          models: ['text'],
          modelMetadata: [{ ...selection, contextWindow: 100 }],
        },
        'PUT',
      )
    ).status,
    200,
  )
  const id = (await api('sessions', { selection })).value.sessionId
  const sessions = new SqliteSessionStore(join(root, 'sessions.sqlite'))
  await sessions.append(id, [{ role: 'user', content: 'A long conversation '.repeat(100) }])
  const history = await sessions.read(id)
  sessions.close()
  const before = (await api(`sessions/${id}/context`)).value
  assert.equal(before.source, 'unknown')
  assert.equal(before.percentage, undefined)
  // An observation from the real prompt producer is needed, not a fabricated token report.
  const contexts = new ContextStore(join(root, 'context.sqlite'))
  const deckResponse = await fetch(`${app.origin}/api/sessions/${id}/deck`, {
    headers: { authorization: `Bearer ${app.token}` },
  })
  const deck = await deckResponse.json()
  const outlineResponse = await fetch(`${app.origin}/api/sessions/${id}/outline`, {
    headers: { authorization: `Bearer ${app.token}` },
  })
  const outline = await outlineResponse.json()
  contexts.observePrompt(id, selection, { outline, deck, materials: [], imageAssets: [] }, 400)
  contexts.close()
  const measured = (await api(`sessions/${id}/context`, { input: 'UNSENT_DRAFT' })).value
  assert.equal(measured.source, 'estimate')
  assert.deepEqual(measured.selection, selection)
  assert.ok(measured.breakdown.draft > 0)
  assert.ok(measured.percentage >= 85)
  assert.equal(measured.suggestCompact, true)
  const upload = await fetch(`${app.origin}/api/sessions/${id}/attachments`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${app.token}`,
      'content-type': 'application/octet-stream',
      'x-file-name': 'notes.txt',
    },
    body: 'Cached source text for draft estimation.',
  })
  assert.equal(upload.status, 201)
  const material = await upload.json()
  const withMaterial = (await api(`sessions/${id}/context`, { attachmentIds: [material.materialId] })).value
  assert.ok(withMaterial.breakdown.materials > 0)
  const other = (await api('sessions', { selection })).value.sessionId
  assert.equal((await api(`sessions/${other}/context`, { attachmentIds: [material.materialId] })).status, 404)
  assert.equal((await api(`sessions/${id}/context`, { attachmentIds: ['another-chat-file'] })).status, 404)
  const verify = new SqliteSessionStore(join(root, 'sessions.sqlite'))
  assert.deepEqual(await verify.read(id), history)
  verify.close()
})

test('foreign checkpoint databases are rejected without replacing their tables', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-context-foreign-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const path = join(root, 'context.sqlite')
  let db = new DatabaseSync(path)
  db.exec("CREATE TABLE private_data(value TEXT); INSERT INTO private_data VALUES('KEEP')")
  db.close()
  assert.throws(() => new ContextStore(path), /CONTEXT_SCHEMA/)
  db = new DatabaseSync(path)
  assert.equal(db.prepare('SELECT value FROM private_data').get().value, 'KEEP')
  db.close()
})

test('Stop during disposal reaches compact finalization as cancelled; awaiting Chat rejects compact', async t => {
  let release,
    disposing = false,
    finalStatus
  const drained = new Promise(resolve => {
    release = resolve
  })
  const app = await startHost({
    context: {
      usage: async () => {
        throw Error('Not used')
      },
    },
    readHistory: async () => [],
    async openAgent(id, _requestId, request) {
      return {
        sessionId: id,
        status: 'idle',
        history: async () => [],
        async send() {
          return { status: 'completed', text: 'summary', steps: 1 }
        },
        ...(request.contextAction
          ? {}
          : { question: () => ({ prompt: 'Waiting', options: ['Continue'], allowSkip: false }) }),
        async dispose() {
          if (request.contextAction) {
            disposing = true
            await drained
          }
        },
      }
    },
    async finishRequest(request, _id, result) {
      if (request.contextAction) finalStatus = result.status
    },
  })
  t.after(async () => {
    release()
    await app.close()
  })
  const client = new HostClient(app.origin, app.token)
  const compact = async id =>
    fetch(`${app.origin}/api/sessions/${id}/compact`, {
      method: 'POST',
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      body: '{}',
    })
  const waiting = await client.send({ sessionId: 'waiting-chat', input: 'Ask a question' })
  for (let i = 0; i < 100 && (await client.snapshot(waiting.requestId)).status !== 'awaiting_user'; i++) await delay(10)
  assert.equal((await client.snapshot(waiting.requestId)).status, 'awaiting_user')
  assert.equal((await compact('waiting-chat')).status, 409)
  const accepted = await (await compact('idle-chat')).json()
  for (let i = 0; i < 100 && !disposing; i++) await delay(10)
  assert.equal(disposing, true)
  await client.stop(accepted.requestId)
  release()
  let terminal
  for await (const value of client.watch(accepted.requestId)) terminal = value
  assert.equal(terminal.status, 'cancelled')
  assert.equal(finalStatus, 'cancelled')
  await client.stop(waiting.requestId)
})
