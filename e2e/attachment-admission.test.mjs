import assert from 'node:assert/strict'
import test from 'node:test'
import { request } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startLocalWeb } from '@deckagent/host'
import { startApp, finished, waitFor, createAttachmentRoutes } from '../apps/host/tests/fixtures/b02-helpers.mjs'
import { ManagementClient } from '../apps/web/tests/fixtures/browser-driver.mjs'
import { HttpError } from '@deckagent/host-api'
import { startHost } from '../apps/host/tests/fixtures/http-host.mjs'
import { Readable } from 'node:stream'

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-input-'))
  const app = await startLocalWeb({ dataDir: join(dir, 'data') })
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', body) => {
    const multipart = body instanceof FormData
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, ...(multipart ? {} : { 'content-type': 'application/json' }) },
      ...(body === undefined ? {} : { body: multipart ? body : JSON.stringify(body) }),
    })
    return { status: response.status, data: await response.json() }
  }
  const chat = await api('sessions', 'POST', {})
  return { api, app, id: chat.data.sessionId }
}

test('multipart closes promptly when its storage consumer rejects a file before the boundary ends', async t => {
  const unavailable = async () => {
    throw new HttpError(404, 'ATTACHMENT_NOT_FOUND')
  }
  const host = await startHost({
    readHistory: async () => [],
    maxAttachments: 10,
    routes: [
      createAttachmentRoutes({
        maxBytes: 8,
        maxFiles: 10,
        draft: unavailable,
        save: unavailable,
        async upload(input) {
          for await (const chunk of input.bytes) {
            assert.ok(chunk.length)
            throw new HttpError(413, 'ATTACHMENT_TOO_LARGE')
          }
          throw new Error('Expected file bytes')
        },
        get: unavailable,
        remove: unavailable,
        preview: unavailable,
      }),
    ],
  })
  t.after(() => host.close())
  const body = new FormData()
  body.append('expectedRevision', '0')
  body.append('file', new Blob(['larger than storage bound']), 'limit.txt')
  const response = await fetch(`${host.origin}/api/sessions/chat/attachments`, {
    method: 'POST',
    headers: { authorization: `Bearer ${host.token}` },
    body,
    signal: AbortSignal.timeout(2000),
  })
  assert.equal(response.status, 413)
  assert.equal((await response.json()).error.code, 'ATTACHMENT_TOO_LARGE')
})

test('upload creates a revisioned draft, prepares a bounded preview and rejects stale edits without losing text', async t => {
  const { api, id } = await fixture(t)
  const saved = await api(`sessions/${id}/draft`, 'PUT', { text: 'Keep this draft', expectedRevision: 0 })
  assert.equal(saved.status, 200)
  const form = new FormData()
  form.append('expectedRevision', String(saved.data.revision))
  form.append('file', new Blob(['<script>not executable</script>\nsource']), 'notes.md')
  const uploaded = await api(`sessions/${id}/attachments`, 'POST', form)
  assert.equal(uploaded.status, 202)
  const attachmentId = uploaded.data.attachment.attachmentId
  const item = await waitFor(async () => {
    const response = await api(`sessions/${id}/attachments/${attachmentId}`)
    return response.data.state === 'preparing' ? undefined : response
  })
  assert.equal(item.data.state, 'ready')
  assert.ok(item.data.preparation.parserVersion)
  const draft = await api(`sessions/${id}/draft`)
  assert.equal(draft.data.text, 'Keep this draft')
  assert.deepEqual(draft.data.attachmentIds, [attachmentId])
  assert.equal((await api(`sessions/${id}/draft`, 'PUT', { text: 'stale', expectedRevision: 0 })).status, 409)
  const preview = await api(`sessions/${id}/attachments/${attachmentId}/preview`)
  assert.equal(preview.status, 200)
  assert.match(preview.data.text, /<script>not executable<\/script>/)
  assert.equal((await api(`sessions/${id}/draft`)).data.text, 'Keep this draft')
})

test('browser management client decodes revisioned attachment state and removes only its selected draft item', async t => {
  const { app, id } = await fixture(t)
  const client = new ManagementClient(app.origin, app.token)
  let draft = await client.draftState(id)
  assert.equal(draft.revision, 0)
  const uploaded = await client.uploadAttachment(id, new File(['client source'], 'tài-liệu.txt'), draft.revision)
  assert.equal(uploaded.attachment.name, 'tài-liệu.txt')
  assert.equal(uploaded.draft.attachments[0].attachmentId, uploaded.attachment.attachmentId)
  draft = await client.removeAttachment(id, uploaded.attachment.attachmentId, uploaded.draft.revision)
  assert.deepEqual(draft.attachmentIds, [])
})

test('upload byte bounds are inclusive and malformed multipart never makes a draft attachment ready', {
  timeout: 30000,
}, async t => {
  const { api, app, id } = await fixture(t)
  const client = new ManagementClient(app.origin, app.token)
  let draft = await client.saveDraftState(id, 'Keep valid draft text', 0)
  const exact = await client.uploadAttachment(
    id,
    new File([new Uint8Array(20 * 1024 * 1024).fill(65)], 'at-limit.txt'),
    draft.revision,
  )
  await waitFor(
    async () => (await api(`sessions/${id}/attachments/${exact.attachment.attachmentId}`)).data.state === 'ready',
  )
  draft = await client.draftState(id)
  await assert.rejects(
    client.uploadAttachment(id, new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'over-limit.txt'), draft.revision),
    /ATTACHMENT_TOO_LARGE/,
  )
  draft = await client.draftState(id)
  assert.equal(draft.text, 'Keep valid draft text')
  assert.ok(draft.attachments.some(item => item.state === 'rejected' && item.rejectionCode === 'ATTACHMENT_TOO_LARGE'))
  const boundary = 'controlled-attachment-boundary'
  const body = Readable.from(
    (async function* () {
      yield Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="expectedRevision"\r\n\r\n${draft.revision}\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="extra.txt"\r\nContent-Type: text/plain\r\n\r\nnot admitted from malformed multipart`,
      )
      await waitFor(async () =>
        (await api(`sessions/${id}/draft`)).data.attachments.some(item => item.name === 'extra.txt'),
      )
      yield Buffer.from(
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="unexpected"\r\n\r\nfield\r\n--${boundary}--\r\n`,
      )
    })(),
  )
  const malformed = await fetch(`${app.origin}/api/sessions/${id}/attachments`, {
    method: 'POST',
    headers: { authorization: `Bearer ${app.token}`, 'content-type': `multipart/form-data; boundary=${boundary}` },
    body,
    duplex: 'half',
    signal: AbortSignal.timeout(5000),
  })
  assert.equal(malformed.status, 400)
  draft = await client.draftState(id)
  assert.equal(draft.text, 'Keep valid draft text')
  assert.equal(draft.attachments.find(item => item.name === 'extra.txt').state, 'rejected')
})

test('Host counts rejected draft members toward the ten-file limit and enforces code points independently of JSON bytes', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-input-limits-'))
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
  const chat = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data
  const accepted = await f.client.send({ sessionId: chat.sessionId, input: '😀'.repeat(16000) })
  assert.equal((await finished(f.client, accepted.requestId)).at(-1).status, 'completed')
  const tooLong = await f.call('requests', 'POST', { sessionId: chat.sessionId, input: '😀'.repeat(16001) })
  assert.equal(tooLong.status, 413)
  assert.equal(tooLong.data.error.code, 'REQUEST_TEXT_TOO_LONG')
  const client = new ManagementClient(f.app.origin, f.app.token)
  for (let index = 0; index < 10; index++) {
    const draft = await client.draftState(chat.sessionId)
    await client.uploadAttachment(
      chat.sessionId,
      new File([new Uint8Array([0])], `rejected-${index}.txt`),
      draft.revision,
    )
  }
  const full = await client.draftState(chat.sessionId)
  assert.equal(full.attachmentIds.length, 10)
  await assert.rejects(
    client.uploadAttachment(chat.sessionId, new File(['extra'], 'eleven.txt'), full.revision),
    /ATTACHMENT_COUNT_EXCEEDED/,
  )
  const after = await client.removeAttachment(chat.sessionId, full.attachmentIds[0], full.revision)
  assert.equal(after.attachmentIds.length, 9)
  await client.uploadAttachment(chat.sessionId, new File(['replacement'], 'replacement.txt'), after.revision)
})

test('admission binds newly uploaded sources, accepts attachment-only input and refuses bypass of rejected draft members', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-input-requests-'))
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
  const chat = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data
  const foreign = (await f.call('sessions', 'POST', {})).data
  const path = `sessions/${chat.sessionId}`
  const upload = async (name, text) => {
    const draft = (await f.call(`${path}/draft`)).data
    const form = new FormData()
    form.append('expectedRevision', String(draft.revision))
    form.append('file', new Blob([text]), name)
    const response = await fetch(`${f.app.origin}/api/${path}/attachments`, {
      method: 'POST',
      headers: { authorization: `Bearer ${f.app.token}` },
      body: form,
    })
    assert.equal(response.status, 202)
    return (await response.json()).attachment.attachmentId
  }
  const id = await upload('notes.txt', 'admitted source evidence')
  await waitFor(async () => (await f.call(`${path}/attachments/${id}`)).data.state === 'ready')
  assert.equal((await f.call(`sessions/${foreign.sessionId}/attachments/${id}`)).status, 404)
  let draft = (await f.call(`${path}/draft`)).data
  const text = `[mcp-attachment] ${id}`
  draft = (await f.call(`${path}/draft`, 'PUT', { text, expectedRevision: draft.revision })).data
  const accepted = await f.client.send({
    sessionId: chat.sessionId,
    input: text,
    attachmentIds: [id],
    draftRevision: draft.revision,
  })
  assert.equal((await finished(f.client, accepted.requestId)).at(-1).status, 'completed')
  assert.match((await f.client.history(chat.sessionId)).at(-1).content, /admitted source evidence/)
  assert.deepEqual((await f.call(`${path}/draft`)).data.attachmentIds, [])
  const only = await upload('only.txt', 'attachment-only evidence')
  await waitFor(async () => (await f.call(`${path}/attachments/${only}`)).data.state === 'ready')
  draft = (await f.call(`${path}/draft`)).data
  const attachmentOnly = await f.client.send({
    sessionId: chat.sessionId,
    input: '',
    attachmentIds: [only],
    draftRevision: draft.revision,
  })
  assert.equal((await finished(f.client, attachmentOnly.requestId)).at(-1).status, 'completed')
  assert.ok(
    (await f.client.history(chat.sessionId)).some(
      message => message.role === 'user' && message.content === '' && message.attachments?.[0].name === 'only.txt',
    ),
  )
  assert.equal((await f.call(`${path}/attachments/${only}`, 'DELETE', { expectedRevision: 0 })).status, 409)
  const running = await f.client.send({ sessionId: chat.sessionId, input: '[hang]' })
  const nextFile = await upload('next.txt', 'next draft evidence')
  draft = (await f.call(`${path}/draft`)).data
  await f.call(`${path}/draft`, 'PUT', { text: 'next draft while request runs', expectedRevision: draft.revision })
  const activeUser = (await f.client.history(chat.sessionId)).filter(message => message.role === 'user').at(-1)
  assert.equal(activeUser.content, '[hang]')
  assert.equal(activeUser.attachments, undefined)
  await f.client.stop(running.requestId)
  draft = (await f.call(`${path}/draft`)).data
  assert.equal(draft.text, 'next draft while request runs')
  assert.deepEqual(draft.attachmentIds, [nextFile])
  assert.equal(
    (await f.call(`${path}/attachments/${nextFile}`, 'DELETE', { expectedRevision: draft.revision })).status,
    200,
  )
  const bad = await upload('bad.txt', Buffer.from([0, 1, 2]))
  await waitFor(async () => (await f.call(`${path}/attachments/${bad}`)).data.state === 'rejected')
  draft = (await f.call(`${path}/draft`)).data
  const bypass = await f.call('requests', 'POST', {
    sessionId: chat.sessionId,
    input: 'omit the rejected ID',
    attachmentIds: [],
  })
  assert.equal(bypass.status, 409)
  assert.equal(bypass.data.error.code, 'ATTACHMENT_REJECTED')
  assert.deepEqual((await f.call(`${path}/draft`)).data.attachmentIds, [bad])
})

test('draft writes and attachment preparation send draft notices on /api/sessions/:sessionId/changes without changing revision on ready', async t => {
  const { api, app, id } = await fixture(t)
  const { port, host } = new URL(app.origin)
  const stream = await new Promise((resolve, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port,
        path: `/api/sessions/${id}/changes`,
        headers: { host, authorization: `Bearer ${app.token}` },
      },
      res => resolve({ req, res }),
    )
    req.on('error', reject)
    req.end()
  })
  t.after(() => stream.req.destroy())
  assert.equal(stream.res.statusCode, 200)
  let buffer = ''
  const queued = []
  const waiters = []
  stream.res.on('data', chunk => {
    buffer += chunk.toString('utf8')
    let cut = buffer.indexOf('\n\n')
    while (cut >= 0) {
      const frame = buffer.slice(0, cut)
      buffer = buffer.slice(cut + 2)
      const data = frame.split('\n').find(line => line.startsWith('data: '))?.slice(6)
      if (data) {
        const notice = JSON.parse(data)
        const waiter = waiters.shift()
        if (waiter) waiter(notice)
        else queued.push(notice)
      }
      cut = buffer.indexOf('\n\n')
    }
  })
  const nextNotice = () =>
    queued.length ? Promise.resolve(queued.shift()) : new Promise(resolve => waiters.push(resolve))

  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 0 })
  const saved = await api(`sessions/${id}/draft`, 'PUT', { text: 'Hello', expectedRevision: 0 })
  assert.equal(saved.status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 1 })
  assert.equal((await api(`sessions/${id}/draft`, 'PUT', { text: 'stale', expectedRevision: 0 })).status, 409)

  const form = new FormData()
  form.append('expectedRevision', String(saved.data.revision))
  form.append('file', new Blob(['evidence']), 'notes.txt')
  const uploaded = await api(`sessions/${id}/attachments`, 'POST', form)
  assert.equal(uploaded.status, 202)
  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 2 })
  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 3 })
  const afterReady = await api(`sessions/${id}/draft`)
  assert.equal(afterReady.data.attachments[0].state, 'ready')
  assert.equal(afterReady.data.revision, uploaded.data.draft.revision, 'Preparation keeps draft.revision')

  const removed = await api(`sessions/${id}/attachments/${uploaded.data.attachment.attachmentId}`, 'DELETE', {
    expectedRevision: uploaded.data.draft.revision,
  })
  assert.equal(removed.status, 200)
  assert.deepEqual(await nextNotice(), { topic: 'draft', key: id, version: 4 })
})

test('draft save and attachment removal require a non-negative integer expectedRevision', async t => {
  const { api, id } = await fixture(t)
  for (const body of [{ text: 'no revision' }, { text: 'neg', expectedRevision: -1 }, { text: 'str', expectedRevision: '0' }]) {
    const res = await api(`sessions/${id}/draft`, 'PUT', body)
    assert.deepEqual([res.status, res.data.error.code], [400, 'INVALID_REQUEST'])
  }
  const tooLong = await api(`sessions/${id}/draft`, 'PUT', { text: 'x'.repeat(16001), expectedRevision: 0 })
  assert.deepEqual([tooLong.status, tooLong.data.error.code], [413, 'DRAFT_TOO_LARGE'])
  const badRemove = await api(`sessions/${id}/attachments/att-11111111-1111-4111-8111-111111111111`, 'DELETE', {})
  assert.deepEqual([badRemove.status, badRemove.data.error.code], [400, 'INVALID_REQUEST'])
})
