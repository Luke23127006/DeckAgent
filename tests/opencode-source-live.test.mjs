import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { MemoryCredentials, finished, waitFor } from './fixtures/b02-helpers.mjs'
import { noisyAttachmentPng } from './fixtures/attachment-fixtures.mjs'

const executable = process.env.DECKAGENT_OPENCODE
const enabled = process.env.DECKAGENT_OPENCODE_LIVE === '1' && !!executable

test('real CLI carries a normalized attachment image through MCP to the selected local provider', { skip: !enabled, timeout: 120000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-image-live-'))
  const calls = []
  let refuseImage = false
  let attachmentId
  const provider = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/v1/models') { res.writeHead(200, { 'content-type': 'application/json' }).end('{"data":[{"id":"image-model"}]}'); return }
    let raw = ''
    for await (const chunk of req) raw += chunk
    const body = JSON.parse(raw)
    calls.push(body)
    if (refuseImage) { res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: { message: 'This model does not support image input', type: 'invalid_request_error' } })); return }
    const callId = `call-${attachmentId}`
    const received = body.messages.some(message => message.role === 'tool' && message.tool_call_id === callId)
    const delta = received ? { role: 'assistant', content: 'Local image tool result received' }
      : { role: 'assistant', tool_calls: [{ index: 0, id: callId, type: 'function', function: { name: 'deckagent_read_attachment', arguments: JSON.stringify({ attachmentId }) } }] }
    const frame = (delta, finish_reason = null) => `data: ${JSON.stringify({ id: 'image-fixture', object: 'chat.completion.chunk', created: 1, model: 'image-model', choices: [{ index: 0, delta, finish_reason }] })}\n\n`
    res.writeHead(200, { 'content-type': 'text/event-stream' }).end(frame(delta) + frame({}, received ? 'stop' : 'tool_calls') + 'data: [DONE]\n\n')
  })
  await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve))
  let app
  t.after(async () => { await app?.close(); provider.closeAllConnections(); await new Promise(resolve => provider.close(resolve)); await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }) })
  app = await startLocalWeb({ dataDir: join(dir, 'data'), home: dir, credentials: new MemoryCredentials(), openCode: { executable, timeoutMs: 60000 } })
  const api = async (path, method = 'GET', body) => {
    const multipart = body instanceof FormData
    const response = await fetch(`${app.origin}/api/${path}`, { method, headers: { authorization: `Bearer ${app.token}`, ...(multipart ? {} : { 'content-type': 'application/json' }) }, ...(body === undefined ? {} : { body: multipart ? body : JSON.stringify(body) }) })
    assert.equal(response.ok, true, `Host ${path} status ${response.status}`)
    return response.json()
  }
  await api('providers/local', 'PUT', { displayName: 'Local image fixture', protocol: 'chat-completions', baseUrl: `http://127.0.0.1:${provider.address().port}/v1`, key: 'local-fixture', models: ['image-model'], new: true })
  const chat = await api('sessions', 'POST', { selection: { provider: 'local', model: 'image-model' } })
  const form = new FormData()
  form.append('expectedRevision', '0')
  form.append('file', new Blob([await readFile(new URL('./fixtures/attachments/sample.png', import.meta.url))]), 'sample.png')
  attachmentId = (await api(`sessions/${chat.sessionId}/attachments`, 'POST', form)).attachment.attachmentId
  await waitFor(async () => (await api(`sessions/${chat.sessionId}/attachments/${attachmentId}`)).state === 'ready')
  const draft = await api(`sessions/${chat.sessionId}/draft`)
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: chat.sessionId, input: '', attachmentIds: [attachmentId], draftRevision: draft.revision })
  const events = await finished(client, accepted.requestId)
  assert.equal(events.at(-1).status, 'completed', JSON.stringify(events.at(-1)))
  const images = calls.flatMap(call => call.messages.flatMap(message => Array.isArray(message.content) ? message.content.filter(part => part.type === 'image_url') : []))
  assert.ok(images.length > 0, 'The local provider must receive typed image bytes, not only a metadata receipt or unsupported-image text')
  assert.ok(images.every(image => image.image_url.url.startsWith('data:image/png;base64,')))
  assert.equal(Buffer.from(images[0].image_url.url.split(',')[1], 'base64').readUInt32BE(16), 1600)
  const noisy = new FormData()
  const nextDraft = await api(`sessions/${chat.sessionId}/draft`)
  noisy.append('expectedRevision', String(nextDraft.revision))
  noisy.append('file', new Blob([noisyAttachmentPng()]), 'noisy.png')
  attachmentId = (await api(`sessions/${chat.sessionId}/attachments`, 'POST', noisy)).attachment.attachmentId
  await waitFor(async () => (await api(`sessions/${chat.sessionId}/attachments/${attachmentId}`)).state === 'ready')
  const noisyDraft = await api(`sessions/${chat.sessionId}/draft`)
  const noisyRequest = await client.send({ sessionId: chat.sessionId, input: '', attachmentIds: [attachmentId], draftRevision: noisyDraft.revision })
  assert.equal((await finished(client, noisyRequest.requestId)).at(-1).status, 'completed', 'Less-compressible image results must fit the bounded CLI event transport')
  const noisyImages = calls.at(-1).messages.flatMap(message => Array.isArray(message.content) ? message.content.filter(part => part.type === 'image_url') : [])
  assert.ok(noisyImages.length, 'The detailed source must also arrive as image bytes')
  const noisyBytes = Buffer.from(noisyImages.at(-1).image_url.url.split(',')[1], 'base64')
  assert.ok(noisyBytes.length <= 256 * 1024)
  assert.ok(noisyBytes.readUInt32BE(16) < 1024)
  refuseImage = true
  const refused = await client.send({ sessionId: chat.sessionId, input: 'Continue with the same image' })
  const refusedEvents = await finished(client, refused.requestId)
  assert.equal(refusedEvents.at(-1).status, 'failed')
  assert.equal(refusedEvents.at(-1).errorCode, 'IMAGE_INPUT_UNAVAILABLE')
})

test('real CLI source boundary: allowed MCP read, outside approval, permanent deny, native bypass and Stop', { skip: !enabled, timeout: 180000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-source-live-'))
  const project = join(dir, 'project')
  await mkdir(project)
  await writeFile(join(project, 'notes.txt'), 'local project evidence')
  const outside = join(dir, 'outside.txt')
  await writeFile(outside, 'local outside evidence')
  const requests = []
  const provider = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/v1/models') { res.writeHead(200, { 'content-type': 'application/json' }).end('{"data":[{"id":"local-model"}]}'); return }
    let raw = ''
    for await (const chunk of req) raw += chunk
    const body = JSON.parse(raw)
    requests.push(body)
    const user = [...body.messages].reverse().find(message => message.role === 'user')
    const quoted = typeof user?.content === 'string' ? user.content : JSON.stringify(user?.content)
    const marker = "The user's new request:\n"
    const input = quoted.includes(marker) ? quoted.slice(quoted.lastIndexOf(marker) + marker.length) : quoted
    const latest = body.messages.at(-1)
    const received = latest?.role === 'tool'
    const tool = input.includes('[native-bypass]') ? 'write' : input.includes('[outside]') || input.includes('[stop]') || input.includes('[denied]')
      ? 'deckagent_read_external' : 'deckagent_read_source'
    const path = input.includes('[denied]') ? join(dir, 'data', 'db', 'sessions.sqlite') : outside
    const args = tool === 'write' ? { filePath: join(project, 'forbidden.txt'), content: 'forbidden' } : { path: tool === 'deckagent_read_source' ? 'notes.txt' : path }
    const delta = received ? { role: 'assistant', content: 'Local tool sequence finished' }
      : { role: 'assistant', tool_calls: [{ index: 0, id: `call-${requests.length}`, type: 'function', function: { name: tool, arguments: JSON.stringify(args) } }] }
    const frame = (delta, finish_reason = null) => `data: ${JSON.stringify({ id: 'local', object: 'chat.completion.chunk', created: 1, model: 'local-model', choices: [{ index: 0, delta, finish_reason }] })}\n\n`
    res.writeHead(200, { 'content-type': 'text/event-stream' }).end(frame(delta) + frame({}, received ? 'stop' : 'tool_calls') + 'data: [DONE]\n\n')
  })
  await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve))
  let app
  t.after(async () => { await app?.close(); provider.closeAllConnections(); await new Promise(resolve => provider.close(resolve)); await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }) })
  app = await startLocalWeb({ dataDir: join(dir, 'data'), home: dir, credentials: new MemoryCredentials(), openCode: { executable, timeoutMs: 60000 } })
  const api = async (path, method = 'GET', body) => {
    const response = await fetch(`${app.origin}/api/${path}`, { method, headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    assert.equal(response.ok, true, `Host ${path} status ${response.status}`)
    return response.json()
  }
  await api('providers/local', 'PUT', { displayName: 'Local fixture', protocol: 'chat-completions', baseUrl: `http://127.0.0.1:${provider.address().port}/v1`, key: 'local-dummy-key', models: ['local-model'], new: true })
  await api('workspaces', 'POST', { folder: project })
  const client = new HostClient(app.origin, app.token)
  const chat = await api('sessions', 'POST', { selection: { provider: 'local', model: 'local-model' } })
  const send = input => client.send({ sessionId: chat.sessionId, input })
  const projectRequest = await send('[project]')
  const projectEvents = await finished(client, projectRequest.requestId)
  assert.equal(projectEvents.at(-1).status, 'completed', JSON.stringify(projectEvents.at(-1)))
  assert.ok(projectEvents.some(event => event.kind === 'activity' && event.label === 'read_source' && event.status === 'completed'))
  assert.ok(requests.some(request => request.messages.some(message => message.role === 'tool' && JSON.stringify(message.content).includes('local project evidence'))))
  assert.ok(requests.every(request => (request.tools ?? []).every(tool => tool.function.name.startsWith('deckagent_'))), 'Native tools must not be exposed to the provider')
  const external = await send('[outside]')
  const approval = await waitFor(async () => (await client.snapshot(external.requestId)).pendingApproval, 30000)
  await client.decide(external.requestId, approval.approvalId, 'allow-once')
  assert.equal((await finished(client, external.requestId)).at(-1).status, 'completed')
  assert.ok(requests.some(request => request.messages.some(message => message.role === 'tool' && JSON.stringify(message.content).includes('local outside evidence'))))
  const denied = await send('[denied]')
  const deniedEvents = await finished(client, denied.requestId)
  assert.equal(deniedEvents.some(event => event.kind === 'approval'), false)
  assert.ok(deniedEvents.some(event => event.kind === 'activity' && event.label === 'read_external' && event.status === 'failed'))
  const native = await send('[native-bypass]')
  await finished(client, native.requestId)
  assert.deepEqual(await readdir(project), ['notes.txt'])
  const stopping = await send('[stop]')
  const waiting = await waitFor(async () => (await client.snapshot(stopping.requestId)).pendingApproval, 30000)
  assert.equal((await client.stop(stopping.requestId)).status, 'stopped')
  await assert.rejects(client.decide(stopping.requestId, waiting.approvalId, 'allow-once'), /REQUEST_CLOSED/)
  assert.equal(await readFile(join(project, 'notes.txt'), 'utf8'), 'local project evidence')
})
