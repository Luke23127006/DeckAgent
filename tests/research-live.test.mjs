import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { MemoryCredentials, finished } from './fixtures/b02-helpers.mjs'

const executable = process.env.DECKAGENT_OPENCODE
const enabled = process.env.DECKAGENT_TAVILY_LIVE === '1' && !!process.env.TAVILY_API_KEY && !!executable

test('real CLI calls the Host research tool using real free Tavily and retains actual sources', { skip: !enabled, timeout: 90000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-tavily-live-'))
  const calls = []
  const query = 'site:nodejs.org Node.js official documentation'
  const server = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/v1/models') { res.writeHead(200, { 'content-type': 'application/json' }).end('{"data":[{"id":"research-model"}]}'); return }
    let raw = ''
    for await (const chunk of req) raw += chunk
    const body = JSON.parse(raw)
    calls.push(body)
    const received = body.messages.some(message => message.role === 'tool' && message.tool_call_id === 'call_research')
    const delta = received ? { role: 'assistant', content: 'Public research tool completed.' } : { role: 'assistant', tool_calls: [{ index: 0, id: 'call_research', type: 'function', function: { name: 'deckagent_research_public', arguments: JSON.stringify({ query }) } }] }
    const frame = (value, finish_reason = null) => `data: ${JSON.stringify({ id: 'research-fixture', object: 'chat.completion.chunk', created: 1, model: 'research-model', choices: [{ index: 0, delta: value, finish_reason }] })}\n\n`
    res.writeHead(200, { 'content-type': 'text/event-stream' }).end(frame(delta) + frame({}, received ? 'stop' : 'tool_calls') + 'data: [DONE]\n\n')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  let app
  t.after(async () => { await app?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }) })
  app = await startLocalWeb({ dataDir: join(dir, 'data'), home: dir, credentials: new MemoryCredentials(), openCode: { executable, timeoutMs: 60000 } })
  const api = async (path, method = 'GET', body) => {
    const response = await fetch(`${app.origin}/api/${path}`, { method, headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    assert.equal(response.ok, true, `Host status ${response.status}`)
    return response.json()
  }
  await api('research', 'PUT', { useEnvironment: true })
  await api('providers/local', 'PUT', { displayName: 'Local research fixture', protocol: 'chat-completions', baseUrl: `http://127.0.0.1:${server.address().port}/v1`, key: 'local-dummy', models: ['research-model'], new: true })
  const chat = await api('sessions', 'POST', { selection: { provider: 'local', model: 'research-model' } })
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: chat.sessionId, input: 'Find public Node.js documentation using the research tool.', publicResearch: true })
  const events = await finished(client, accepted.requestId)
  assert.equal(events.at(-1).status, 'completed')
  const sources = await api(`sessions/${chat.sessionId}/research-sources`)
  assert.ok(sources.length > 0 && sources.length <= 5)
  assert.ok(sources.every(item => item.query === query && item.kind === 'research' && item.content.length > 0 && item.fingerprint.length === 64))
  assert.ok(calls.some(call => call.messages.some(message => message.role === 'tool' && JSON.stringify(message.content).includes(sources[0].sourceId))))
  assert.ok(calls.every(call => (call.tools ?? []).every(tool => tool.function.name.startsWith('deckagent_'))))
  assert.equal(JSON.stringify(calls).includes(process.env.TAVILY_API_KEY), false)
  assert.equal(JSON.stringify(events).includes(process.env.TAVILY_API_KEY), false)
})
