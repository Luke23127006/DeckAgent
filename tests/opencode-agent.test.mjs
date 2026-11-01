import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm, mkdir, readFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { OpenCodeAgentHandle } from '../apps/local-web/lib/types/opencode/agent.js'
import { MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { openToolBridge } from '../apps/local-web/lib/types/opencode/mcp-bridge.js'
import { registerFileTools } from '../packages/tools/filesystem/lib/index.js'

test('revoking MCP admission during activity persistence prevents a tool from starting', async t => {
  const sessions = new MemorySessionStore()
  await sessions.open('revoked')
  const tools = new ToolRegistry()
  let calls = 0
  tools.register({
    name: 'probe',
    description: 'Probe',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute() {
      calls++
      return 'must not execute'
    },
  })
  const bridge = await openToolBridge({
    tools,
    allowed: ['probe'],
    sessions,
    sessionId: 'revoked',
    signal: new AbortController().signal,
    async onActivity() {
      bridge.revoke()
    },
  })
  t.after(() => bridge.close())
  const response = await fetch(bridge.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${bridge.token}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'probe', arguments: {} } }),
  })
  assert.equal((await response.json()).result.isError, true)
  assert.equal(calls, 0)
})

test('MCP never forwards private persistence or activity exception messages', async t => {
  const sessions = new MemorySessionStore()
  await sessions.open('private')
  const bridge = await openToolBridge({
    tools: new ToolRegistry(),
    allowed: [],
    sessions,
    sessionId: 'private',
    signal: new AbortController().signal,
    async onActivity() {
      throw new Error('TEST_PRIVATE_DETAILS')
    },
  })
  t.after(() => bridge.close())
  const response = await fetch(bridge.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${bridge.token}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'unknown', arguments: {} } }),
  })
  const result = await response.json()
  assert.equal(result.result.isError, true)
  assert.equal(JSON.stringify(result).includes('TEST_PRIVATE_DETAILS'), false)
  assert.deepEqual(await sessions.read('private'), [])
})

test('OpenCode refuses an unpinned executable before recording conversation or starting tools', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-pin-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const executable = join(root, 'wrong.exe')
  await writeFile(executable, 'not the approved binary')
  const sessions = new MemorySessionStore()
  await sessions.open('chat')
  await assert.rejects(
    OpenCodeAgentHandle.open({
      sessionId: 'chat',
      executable,
      root,
      sessions,
      tools: new ToolRegistry(),
      allowed: [],
      systemPrompt: '',
      maxSteps: 8,
      provider: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-3.1-flash-lite',
        key: 'not-a-real-key',
      },
    }),
    /pinned/i,
  )
  assert.deepEqual(await sessions.read('chat'), [])
})

test('request MCP bridge enforces token, allowlist, registry validation and revocation', async t => {
  const sessions = new MemorySessionStore()
  await sessions.open('chat')
  const tools = new ToolRegistry(),
    abort = new AbortController(),
    activity = []
  let calls = 0
  for (const name of ['probe', 'denied'])
    tools.register({
      name,
      description: 'test tool',
      parameters: {
        type: 'object',
        properties: { value: { type: 'string' } },
        required: ['value'],
        additionalProperties: false,
      },
      async execute(args) {
        calls++
        return JSON.stringify({ echoed: args.value })
      },
    })
  const bridge = await openToolBridge({
    tools,
    allowed: ['probe'],
    sessions,
    sessionId: 'chat',
    signal: abort.signal,
    onActivity: async e => {
      activity.push(e)
    },
  })
  t.after(() => bridge.close())
  let id = 0
  const post = (method, params, token = bridge.token) =>
    fetch(bridge.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
    })
  assert.equal((await post('tools/list', {}, 'wrong-token')).status, 403)
  const listed = await (await post('tools/list', {})).json()
  assert.deepEqual(
    listed.result.tools.map(t => t.name),
    ['probe'],
  )
  const good = await (await post('tools/call', { name: 'probe', arguments: { value: 'exact' } })).json()
  assert.equal(JSON.parse(good.result.content[0].text).echoed, 'exact')
  const toolResult = (await sessions.read('chat')).find(message => message.role === 'tool' && message.name === 'probe')
  assert.ok(
    activity.some(event => event.id === `tool-${toolResult.toolCallId}` && event.status === 'running'),
    'Tool activity must match the existing client history join',
  )
  assert.ok(activity.some(event => event.id === `tool-${toolResult.toolCallId}` && event.status === 'completed'))
  const invalid = await (await post('tools/call', { name: 'probe', arguments: { value: 42 } })).json()
  assert.equal(invalid.result.isError, true)
  const denied = await (await post('tools/call', { name: 'denied', arguments: { value: 'x' } })).json()
  assert.equal(denied.result.isError, true)
  const extraField = await (
    await post('tools/call', { name: 'probe', arguments: { value: 'x', extra: 'unexpected' } })
  ).json()
  assert.equal(extraField.result.isError, true)
  assert.equal(calls, 1)
  assert.ok(activity.some(e => e.label === 'probe' && e.status === 'completed'))
  bridge.revoke()
  abort.abort()
  assert.equal((await post('tools/call', { name: 'probe', arguments: { value: 'late' } })).status, 403)
  assert.equal(calls, 1)
  assert.equal((await sessions.read('chat')).filter(m => m.role === 'tool').length, 4)
})

test('MCP Stop drains an active tool and rejects new work without crossing session boundaries', async t => {
  const sessions = new MemorySessionStore()
  await sessions.open('first')
  await sessions.open('second')
  const tools = new ToolRegistry(),
    abort = new AbortController()
  let entered,
    mutations = 0
  const started = new Promise(resolve => {
    entered = resolve
  })
  tools.register({
    name: 'wait',
    description: 'Wait for cancellation',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute(_args, { signal }) {
      entered()
      await new Promise((_, reject) =>
        signal.addEventListener('abort', () => reject(new Error('Stopped')), { once: true }),
      )
      mutations++
      return 'must never complete'
    },
  })
  const first = await openToolBridge({
    tools,
    allowed: ['wait'],
    sessions,
    sessionId: 'first',
    signal: abort.signal,
    onActivity: async () => {},
  })
  const second = await openToolBridge({
    tools,
    allowed: [],
    sessions,
    sessionId: 'second',
    signal: new AbortController().signal,
    onActivity: async () => {},
  })
  t.after(async () => {
    await first.close()
    await second.close()
  })
  const call = (url, token) =>
    fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'wait', arguments: {} } }),
    })
  assert.equal((await call(second.url, first.token)).status, 403)
  const running = call(first.url, first.token)
  await started
  first.revoke()
  abort.abort()
  assert.equal((await call(first.url, first.token)).status, 403)
  const result = await (await running).json()
  assert.equal(result.result.isError, true)
  assert.equal(mutations, 0)
  assert.deepEqual(await sessions.read('second'), [])
  assert.equal((await sessions.read('first')).at(-1).isError, true)
})

test('MCP file tools preserve read approval and cannot write outside private draft scope', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-files-'))
  const work = join(root, 'work'),
    source = join(root, 'source')
  await mkdir(work)
  await mkdir(source)
  await writeFile(join(source, 'input.txt'), 'source must remain unchanged')
  const sessions = new MemorySessionStore()
  await sessions.open('files')
  const tools = new ToolRegistry()
  let approvals = 0
  const files = await registerFileTools(tools, {
    root: work,
    sourceRoot: source,
    async authorizeRead() {
      approvals++
      throw new Error('User denied approval')
    },
  })
  const bridge = await openToolBridge({
    tools,
    allowed: files.names,
    sessions,
    sessionId: 'files',
    signal: new AbortController().signal,
    onActivity: async () => {},
  })
  t.after(async () => {
    await bridge.close()
    files.dispose()
    await rm(root, { recursive: true, force: true })
  })
  let id = 0
  const call = async (name, args) =>
    (
      await (
        await fetch(bridge.url, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${bridge.token}`,
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name, arguments: args } }),
        })
      ).json()
    ).result
  assert.equal((await call('write_file', { path: '../source/input.txt', content: 'overwrite' })).isError, true)
  assert.equal((await call('write_file', { path: '../outside.html', content: 'escape' })).isError, true)
  await assert.rejects(access(join(root, 'outside.html')))
  const denied = await call('read_file', { scope: 'source', path: 'input.txt' })
  assert.equal(denied.isError, true)
  assert.equal(approvals, 1)
  assert.equal(JSON.stringify(denied).includes('source must remain unchanged'), false)
  assert.equal(await readFile(join(source, 'input.txt'), 'utf8'), 'source must remain unchanged')
})
