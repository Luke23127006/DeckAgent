import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { pinnedVersion, startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { MemoryCredentials, filesContaining, finished, waitFor } from './fixtures/b02-helpers.mjs'

// Real OpenCode CLI smoke (B02-IMP-02). Opt-in: DECKAGENT_OPENCODE_LIVE=1 and DECKAGENT_OPENCODE=<absolute path of the
// pinned CLI executable>. Part 1 uses a local Chat Completions endpoint, so it needs no provider account: it checks the
// real CLI's config, key reference, events, native session resume, Stop and the context summary (FR-079).
// Part 2 calls a real provider only when
// DECKAGENT_LIVE_BASE_URL, DECKAGENT_LIVE_PROTOCOL, DECKAGENT_LIVE_MODEL and DECKAGENT_LIVE_KEY are set.
const executable = process.env.DECKAGENT_OPENCODE ? resolve(process.env.DECKAGENT_OPENCODE) : undefined
const enabled = process.env.DECKAGENT_OPENCODE_LIVE === '1' && !!executable
const key = 'sk-live-smoke-LOCAL-4d2e'

/**
 * Local Chat Completions endpoint; records what it received. Markers are read from the newest request only (a seed
 * quotes earlier ones): [hang] never ends; [overflow] is refused once as too long (OpenAI's `context_length_exceeded`),
 * and the next call (OpenCode's summary) answers LOCAL-SUMMARY; [overflow-fail] also refuses that summary call.
 */
async function chatEndpoint() {
  const requests = []
  let overflowed = false
  let refuse = 0
  let summarizeNext = false
  const tooLong = res => res.writeHead(400, { 'content-type': 'application/json' })
    .end(JSON.stringify({ error: { message: 'maximum context length exceeded', type: 'invalid_request_error', code: 'context_length_exceeded' } }))
  const server = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/v1/models') {
      res.writeHead(req.headers.authorization === `Bearer ${key}` ? 200 : 401, { 'content-type': 'application/json' }).end('{"data":[{"id":"local-model"}]}')
      return
    }
    let raw = ''
    for await (const chunk of req) raw += chunk
    const body = JSON.parse(raw || '{}')
    requests.push({ url: req.url, authorization: req.headers.authorization, body })
    const last = [...(body.messages ?? [])].reverse().find(message => message.role === 'user')
    const text = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content ?? '')
    const newest = text.includes("The user's new request:") ? text.slice(text.lastIndexOf("The user's new request:")) : text
    if (refuse > 0) { refuse--; tooLong(res); return }
    if (newest.includes('[overflow-fail]')) { refuse = 1; tooLong(res); return }
    if (newest.includes('[overflow]') && !overflowed) { overflowed = true; summarizeNext = true; tooLong(res); return }
    const reply = summarizeNext ? 'LOCAL-SUMMARY' : `Local reply ${requests.length}`
    summarizeNext = false
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    const chunk = delta => `data: ${JSON.stringify({ id: 'live', object: 'chat.completion.chunk', created: 1, model: 'local-model', choices: [{ index: 0, delta, finish_reason: null }] })}\n\n`
    if (newest.includes('[hang]')) { res.write(chunk({ role: 'assistant', content: 'Partial before Stop' })); return }
    res.end(chunk({ role: 'assistant', content: reply }) +
      `data: ${JSON.stringify({ id: 'live', object: 'chat.completion.chunk', created: 1, model: 'local-model', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 } })}\n\ndata: [DONE]\n\n`)
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  return { requests, baseUrl: `http://127.0.0.1:${server.address().port}/v1`, close: () => new Promise(done => { server.closeAllConnections(); server.close(done) }) }
}

test(`real OpenCode CLI ${pinnedVersion}: isolated run, key by reference, events, native resume and Stop`, { skip: !enabled, timeout: 300000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-opencode-live-'))
  const endpoint = await chatEndpoint()
  const app = await startLocalWeb({ dataDir: join(dir, 'data'), home: dir, credentials: new MemoryCredentials(), openCode: { executable, timeoutMs: 120000 } })
  t.after(async () => { await app.close(); await endpoint.close(); await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 200 }) })
  const call = async (path, method = 'GET', body) => {
    const response = await fetch(`${app.origin}/api/${path}`, { method, headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, data: await response.json() }
  }
  const client = new HostClient(app.origin, app.token)
  assert.equal((await call('providers/local', 'PUT', { displayName: 'Local', protocol: 'chat-completions', baseUrl: endpoint.baseUrl, models: ['local-model'], key, new: true })).status, 200)
  const chat = (await call('sessions', 'POST', { selection: { provider: 'local', model: 'local-model' } })).data
  const first = await client.send({ sessionId: chat.sessionId, input: 'First live turn' })
  const firstEvents = await finished(client, first.requestId)
  t.diagnostic(`events: ${firstEvents.map(event => event.kind === 'status' ? event.status : event.kind).join(',')}`)
  assert.equal(firstEvents.at(-1).status, 'completed', firstEvents.at(-1).errorCode)
  assert.equal(endpoint.requests.at(-1).authorization, `Bearer ${key}`, 'The CLI resolved {env:...} to the run key')
  assert.equal((await client.history(chat.sessionId)).at(-1).content, `Local reply ${endpoint.requests.length}`)
  const second = await client.send({ sessionId: chat.sessionId, input: 'Second live turn' })
  assert.equal((await finished(client, second.requestId)).at(-1).status, 'completed')
  const sent = endpoint.requests.at(-1).body.messages.filter(message => message.role === 'user').map(message => JSON.stringify(message.content))
  assert.ok(sent.some(text => text.includes('First live turn')) && sent.some(text => text.includes('Second live turn')),
    'The resumed native session carries the first turn without DeckAgent resending it as quoted text')
  assert.equal(sent.some(text => text.includes('Earlier conversation of this chat')), false)
  const hung = await client.send({ sessionId: chat.sessionId, input: 'Wait [hang]' })
  // The pinned CLI emits text only when a part ends. Confirm the actual hanging provider call rather than
  // waiting for partial text the JSON CLI does not emit. Stop must still end that unresponsive call.
  await waitFor(() => endpoint.requests.some(request => JSON.stringify(request.body.messages.at(-1)).includes('[hang]')), 60000)
  assert.equal((await client.snapshot(hung.requestId)).status, 'active')
  const stopped = await client.stop(hung.requestId)
  assert.equal(stopped.status, 'stopped')
  const next = await client.send({ sessionId: chat.sessionId, input: 'After stop' })
  assert.equal((await finished(client, next.requestId)).at(-1).status, 'completed')

  // FR-079 with the real CLI: refused as too long, OpenCode summarizes and answers again; the boundary is saved,
  // the summary is not the reply and the whole conversation stays readable.
  const long = await client.send({ sessionId: chat.sessionId, input: 'Long turn [overflow]' })
  const longEvents = await finished(client, long.requestId)
  t.diagnostic(`overflow events: ${longEvents.map(event => event.kind === 'status' ? event.status : event.kind === 'activity' ? `${event.id}:${event.status}` : event.kind === 'notice' ? event.code : event.kind).join(',')}`)
  assert.equal(longEvents.at(-1).status, 'completed', longEvents.at(-1).errorCode)
  assert.ok(longEvents.some(event => event.kind === 'notice' && event.code === 'CONVERSATION_SUMMARIZED'))
  const afterSummary = await client.history(chat.sessionId)
  assert.ok(afterSummary.some(message => message.content === 'First live turn'))
  assert.equal(afterSummary.some(message => message.content.includes('LOCAL-SUMMARY') || message.content.includes('Continue if')), false)
  assert.equal((await call(`sessions/${chat.sessionId}/requests`)).data.at(-1).summarized, true)
  // The summary call is refused too: the request does not finish and the conversation stays as it was.
  const failing = await client.send({ sessionId: chat.sessionId, input: 'Too long [overflow-fail]' })
  const failed = (await finished(client, failing.requestId)).at(-1)
  assert.deepEqual([failed.status, failed.errorCode], ['failed', 'CONTEXT_SUMMARY_FAILED'])
  assert.deepEqual((await client.history(chat.sessionId)).slice(0, afterSummary.length), afterSummary)
  await app.close()
  assert.deepEqual(await filesContaining(join(dir, 'data'), key), [], 'The key is in no file DeckAgent or the CLI wrote')
})

const live = {
  baseUrl: process.env.DECKAGENT_LIVE_BASE_URL, protocol: process.env.DECKAGENT_LIVE_PROTOCOL,
  model: process.env.DECKAGENT_LIVE_MODEL, key: process.env.DECKAGENT_LIVE_KEY,
}

test('real provider request through the real OpenCode CLI', { skip: !enabled || !live.baseUrl || !live.protocol || !live.model || !live.key, timeout: 300000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-provider-live-'))
  const app = await startLocalWeb({ dataDir: join(dir, 'data'), home: dir, credentials: new MemoryCredentials(), openCode: { executable, timeoutMs: 180000 } })
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 200 }) })
  const headers = { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' }
  const saved = await fetch(`${app.origin}/api/providers/live`, { method: 'PUT', headers,
    body: JSON.stringify({ displayName: 'Live', protocol: live.protocol, baseUrl: live.baseUrl, models: [live.model], key: live.key, new: true }) })
  assert.equal(saved.status, 200, 'The provider accepted the key at setup')
  const chat = await (await fetch(`${app.origin}/api/sessions`, { method: 'POST', headers, body: JSON.stringify({ selection: { provider: 'live', model: live.model } }) })).json()
  const client = new HostClient(app.origin, app.token)
  const request = await client.send({ sessionId: chat.sessionId, input: 'Reply with one short sentence.' })
  const last = (await finished(client, request.requestId)).at(-1)
  assert.equal(last.status, 'completed', last.errorCode)
  t.diagnostic(`reply length: ${(await client.history(chat.sessionId)).at(-1).content.length}`)
  await app.close()
  assert.deepEqual(await filesContaining(join(dir, 'data'), live.key), [])
})
