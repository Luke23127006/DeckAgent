import { request } from 'node:http'
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startApp, runs, finished, waitFor } from './fixtures/b02-helpers.mjs'
import { BriefClient, ManagementClient } from '../../../e2e/fixtures/browser-driver/index.mjs'
import { brief } from '../../../packages/presentation/deck/tests/fixtures/brief.mjs'

test('Brief Host persists explicit choices across restart without a model run or Deck, and isolates Chats', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'brief-host-'))
  let f = await startApp(dir)
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const id = (await f.call('sessions', 'POST', {})).data.sessionId
  const other = (await f.call('sessions', 'POST', {})).data.sessionId
  const path = `sessions/${id}/brief`
  assert.deepEqual((await f.call(path)).data, {
    sessionId: id,
    version: 0,
    current: null,
    locked: false,
    sourceStates: [],
  })
  const first = await f.call(path, 'PUT', { expectedVersion: 0, draft: brief() })
  assert.equal(first.status, 200)
  assert.equal(first.data.current.design.template.version, 1)
  assert.equal((await f.call(path, 'PUT', { expectedVersion: 0, draft: brief() })).status, 409)
  const unsupported = brief()
  delete unsupported.generationFormat
  unsupported.requestedFormat = 'pptx'
  const second = await f.call(path, 'PUT', { expectedVersion: 1, draft: unsupported })
  assert.equal(second.status, 200)
  assert.equal(second.data.current.design, null)
  assert.equal(second.data.current.draft.requestedFormat, 'pptx')
  assert.equal(
    (await f.call(path, 'PUT', { expectedVersion: 2, draft: { ...unsupported, generationFormat: 'html' } })).status,
    400,
  )
  const foreign = brief()
  foreign.sources.refs = [{ sourceId: 'src-00000000-0000-0000-0000-000000000000', version: 1, kind: 'attachment' }]
  assert.equal((await f.call(path, 'PUT', { expectedVersion: 2, draft: foreign })).status, 404)
  assert.equal((await f.call(`sessions/${other}/brief`)).data.current, null)
  assert.equal((await f.call('sessions/missing/brief')).status, 404)
  const unauthenticated = await fetch(`${f.app.origin}/api/${path}`)
  assert.equal(unauthenticated.status, 401)
  assert.equal(runs(f.log).length, 0)
  await f.app.close()
  f = await startApp(dir)
  const reloaded = (await f.call(path)).data
  assert.equal(reloaded.version, 2)
  assert.equal(reloaded.current.draft.sources.publicResearch, false)
  assert.equal(
    (await f.call(`${path}/versions/1`)).data.current.design.fingerprint,
    first.data.current.design.fingerprint,
  )
  assert.equal((await f.call(`${path}/versions/3`)).status, 404)
  assert.equal((await f.call(`sessions/${other}/brief/versions/1`)).status, 404)
})

test('Brief accepts only sent attachment images and refuses writes during active work', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'brief-images-'))
  const f = await startApp(dir, {
    options: { providerAccess: { check: async () => {}, catalog: async () => ['model-a'] } },
  })
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  await f.call('providers/test', 'PUT', {
    displayName: 'Fixture',
    protocol: 'chat-completions',
    baseUrl: 'http://127.0.0.1:9/v1',
    key: 'fixture',
    models: ['model-a'],
    new: true,
    expectedVersion: (await f.call('settings')).data.providersVersion,
  })
  const id = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data.sessionId
  const management = new ManagementClient(f.app.origin, f.app.token)
  const client = new BriefClient(f.app.origin, f.app.token)
  const png = await readFile(new URL('./fixtures/attachments/sample.png', import.meta.url))
  const uploaded = await management.uploadAttachment(id, new File([png], 'image.png'), 0)
  const attachmentId = uploaded.attachment.attachmentId
  const prepared = await waitFor(async () => {
    const item = (await f.call(`sessions/${id}/attachments/${attachmentId}`)).data
    return item.state !== 'preparing' && item
  })
  assert.equal(prepared.state, 'ready')
  const draft = brief()
  draft.images = { mode: 'attachments', attachmentIds: [attachmentId], unmetRequirements: [] }
  await assert.rejects(client.save(id, 0, draft), /SOURCE_NOT_FOUND/)
  const chatDraft = await management.draftState(id)
  const accepted = await f.client.send({
    sessionId: id,
    input: '',
    attachmentIds: [attachmentId],
    draftRevision: chatDraft.revision,
  })
  await finished(f.client, accepted.requestId)
  const item = (await f.client.history(id)).find(m => m.role === 'user').attachments[0]
  draft.sources.refs = [{ sourceId: item.source.sourceId, version: item.source.version, kind: 'attachment' }]
  assert.equal((await client.save(id, 0, draft)).current.draft.images.attachmentIds[0], attachmentId)
  const hanging = await f.client.send({ sessionId: id, input: '[hang]' })
  await assert.rejects(client.save(id, 1, draft), /SESSION_BUSY/)
  await f.client.stop(hanging.requestId)
  assert.equal((await client.snapshot(id)).version, 1)
})

test('Brief source receipts require owning Chat and expose superseded versions without granting reads', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'brief-sources-'))
  const project = join(dir, 'project')
  await mkdir(project)
  await writeFile(join(project, 'notes.txt'), 'First source')
  const f = await startApp(dir, {
    options: { providerAccess: { check: async () => {}, catalog: async () => ['model-a'] } },
  })
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  await f.call('providers/test', 'PUT', {
    displayName: 'Fixture',
    protocol: 'chat-completions',
    baseUrl: 'http://127.0.0.1:9/v1',
    key: 'fixture',
    models: ['model-a'],
    new: true,
    expectedVersion: (await f.call('settings')).data.providersVersion,
  })
  await f.call('workspaces', 'POST', { folder: project, expectedVersion: 0 })
  const selection = { provider: 'test', model: 'model-a' }
  const id = (await f.call('sessions', 'POST', { selection })).data.sessionId
  const other = (await f.call('sessions', 'POST', { selection })).data.sessionId
  const read = async () => {
    const request = await f.client.send({ sessionId: id, input: '[mcp-read]' })
    assert.equal((await finished(f.client, request.requestId)).at(-1).status, 'completed')
    return (await f.client.history(id)).at(-1).content
  }
  const output = await read()
  const sourceId = output.match(/src-[a-f0-9-]{36}/)?.[0]
  assert.ok(sourceId, output)
  const draft = brief()
  draft.sources.refs = [{ sourceId, version: 1, kind: 'project-file' }]
  const path = `sessions/${id}/brief`
  assert.equal((await f.call(`sessions/${other}/brief`, 'PUT', { expectedVersion: 0, draft })).status, 404)
  const saved = await f.call(path, 'PUT', { expectedVersion: 0, draft })
  assert.equal(saved.status, 200)
  assert.equal(saved.data.sourceStates[0].status, 'recorded')
  await writeFile(join(project, 'notes.txt'), 'New source bytes')
  await read()
  const stale = (await f.call(path)).data
  assert.equal(stale.sourceStates[0].status, 'unavailable')
  assert.ok(
    (await new BriefClient(f.app.origin, f.app.token).interview(id)).state.blockers.some(
      b => b.code === 'SOURCE_UNAVAILABLE',
    ),
  )
  assert.deepEqual(stale.current, saved.data.current)
  assert.equal((await f.call(path, 'PUT', { expectedVersion: 1, draft })).status, 404)
  draft.sources.refs[0].version = 2
  assert.equal((await f.call(path, 'PUT', { expectedVersion: 1, draft })).status, 200)
  // Brief source selection does not grant public research to a generic request.
  draft.sources.publicResearch = true
  assert.equal((await f.call(path, 'PUT', { expectedVersion: 2, draft })).status, 200)
  const request = await f.client.send({ sessionId: id, input: '[mcp-research]' })
  await finished(f.client, request.requestId)
  assert.match((await f.client.history(id)).at(-1).content, /TOOL_NOT_ALLOWED/)
})

test('GET /api/sessions/:sessionId/changes emits initial and live brief notices and stays silent on BRIEF_STALE', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'brief-changes-'))
  const f = await startApp(dir)
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const id = (await f.call('sessions', 'POST', {})).data.sessionId
  const { port, host } = new URL(f.app.origin)
  const stream = await new Promise((resolve, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port,
        path: `/api/sessions/${id}/changes`,
        headers: { host, authorization: `Bearer ${f.app.token}` },
      },
      res => resolve({ req, res }),
    )
    req.on('error', reject)
    req.end()
  })
  t.after(() => stream.req.destroy())
  let buffer = ''
  const queued = []
  const waiters = []
  stream.res.on('data', chunk => {
    buffer += chunk.toString('utf8')
    let cut = buffer.indexOf('\n\n')
    while (cut >= 0) {
      const data = buffer
        .slice(0, cut)
        .split('\n')
        .find(line => line.startsWith('data: '))
        ?.slice(6)
      buffer = buffer.slice(cut + 2)
      if (data) {
        const notice = JSON.parse(data)
        const waiter = waiters.shift()
        if (waiter) waiter(notice)
        else queued.push(notice)
      }
      cut = buffer.indexOf('\n\n')
    }
  })
  const nextNotice = () => {
    if (queued.length) return Promise.resolve(queued.shift())
    return new Promise((resolve, reject) => {
      const deadline = setTimeout(() => reject(new Error('The session change notice did not arrive.')), 10000)
      waiters.push(notice => {
        clearTimeout(deadline)
        resolve(notice)
      })
    })
  }
  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 0 })
  assert.deepEqual(await nextNotice(), { topic: 'brief', key: id, version: 0 })
  assert.deepEqual(await nextNotice(), { topic: 'outline', key: id, version: 0 })
  assert.deepEqual(await nextNotice(), { topic: 'deck', key: id, version: 0 })
  assert.equal((await f.call(`sessions/${id}/brief`, 'PUT', { expectedVersion: 0, draft: brief() })).status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'brief', key: id, version: 1 })
  assert.equal((await f.call(`sessions/${id}/brief`, 'PUT', { expectedVersion: 0, draft: brief() })).status, 409)
  assert.equal((await f.call(`sessions/${id}/brief`, 'PUT', { expectedVersion: 1, draft: brief() })).status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'brief', key: id, version: 2 })
})
