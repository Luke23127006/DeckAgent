import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdtemp, mkdir, writeFile, readFile, rm, rename, symlink, link } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { registerFileTools } from '../packages/tools/filesystem/lib/index.js'
import { openToolBridge } from '../apps/local-web/lib/types/opencode/mcp-bridge.js'

function call(bridge, id, name = 'work', args = {}) {
  return fetch(bridge.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${bridge.token}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }),
  })
}

test('MCP Stop rejects queued/new work and close waits for the active tool to drain', { timeout: 10000 }, async t => {
  const sessions = new MemorySessionStore()
  await sessions.open('chat')
  const started = Promise.withResolvers(),
    aborted = Promise.withResolvers(),
    release = Promise.withResolvers()
  const tools = new ToolRegistry(),
    abort = new AbortController()
  let calls = 0,
    mutations = 0,
    drained = false,
    closing
  tools.register({
    name: 'work',
    description: 'Controlled work',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute(_args, { signal }) {
      calls++
      started.resolve()
      await new Promise(done => signal.addEventListener('abort', done, { once: true }))
      aborted.resolve()
      await release.promise
      signal.throwIfAborted()
      mutations++
      return 'must not complete'
    },
  })
  const bridge = await openToolBridge({
    tools,
    sessions,
    sessionId: 'chat',
    allowed: ['work'],
    signal: abort.signal,
    onActivity: async () => {},
  })
  t.after(async () => {
    abort.abort()
    release.resolve()
    await (closing ?? bridge.close())
  })
  const first = call(bridge, 1).then(
    async response => ({ status: response.status, body: await response.json() }),
    () => null,
  )
  await started.promise
  const second = call(bridge, 2).then(
    async response => ({ status: response.status, body: response.status === 200 ? await response.json() : null }),
    () => null,
  )
  // Give the second HTTP call time to enter the serial queue. Correctness is also
  // checked if it arrives after revocation: both paths must reject execution.
  await delay(50)
  bridge.revoke()
  abort.abort()
  await aborted.promise
  assert.equal((await call(bridge, 3)).status, 403)
  closing = bridge.close().then(() => {
    drained = true
  })
  await delay(50)
  assert.equal(drained, false, 'close must wait for the tool, not just the AbortSignal')
  release.resolve()
  // close may terminate HTTP responses after draining; delivery is not promised.
  const active = await first
  if (active) assert.equal(active.body.result.isError, true)
  const queued = await second
  if (queued?.status === 200) assert.equal(queued.body.result.isError, true)
  else if (queued) assert.equal(queued.status, 403)
  await closing
  assert.equal(calls, 1)
  assert.equal(mutations, 0)
  assert.equal((await sessions.read('chat')).filter(m => m.role === 'tool').length, 1)
})

test('MCP file access rejects sibling Chat roots, aliases, hardlinks and source writes before approval', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-mcp-roots-'))
  const work = join(root, 'work'),
    own = join(work, 'own'),
    sibling = join(work, 'sibling'),
    source = join(root, 'source')
  await mkdir(own, { recursive: true })
  await mkdir(sibling)
  await mkdir(source)
  await writeFile(join(sibling, 'secret.txt'), 'SIBLING_PRIVATE')
  await writeFile(join(source, 'input.txt'), 'SOURCE_UNCHANGED')
  await symlink(sibling, join(root, 'alias'), process.platform === 'win32' ? 'junction' : 'dir')
  await link(join(sibling, 'secret.txt'), join(root, 'hardlink.txt'))
  const tools = new ToolRegistry(),
    sessions = new MemorySessionStore()
  await sessions.open('own')
  let approvals = 0
  const files = await registerFileTools(tools, {
    root: own,
    sourceRoot: source,
    blockedRoots: [work],
    authorizeRead: async () => {
      approvals++
    },
  })
  const bridge = await openToolBridge({
    tools,
    sessions,
    sessionId: 'own',
    allowed: files.names,
    signal: new AbortController().signal,
    onActivity: async () => {},
  })
  t.after(async () => {
    await bridge.close()
    files.dispose()
    await rm(root, { recursive: true, force: true })
  })
  let id = 0
  for (const path of [join(sibling, 'secret.txt'), join(root, 'alias', 'secret.txt'), join(root, 'hardlink.txt')]) {
    const response = await (await call(bridge, ++id, 'read_file', { path, scope: 'external' })).json()
    assert.equal(response.result.isError, true)
    assert.equal(JSON.stringify(response).includes('SIBLING_PRIVATE'), false)
  }
  for (const path of ['../sibling/secret.txt', join(source, 'input.txt')])
    assert.equal(
      (await (await call(bridge, ++id, 'write_file', { path, content: 'overwrite' })).json()).result.isError,
      true,
    )
  assert.equal(approvals, 0)
  assert.equal(await readFile(join(source, 'input.txt'), 'utf8'), 'SOURCE_UNCHANGED')
  assert.equal(await readFile(join(sibling, 'secret.txt'), 'utf8'), 'SIBLING_PRIVATE')
})

test('MCP refuses a target replaced while read approval is pending', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-mcp-substitution-'))
  const work = join(root, 'work'),
    target = join(root, 'outside.txt')
  await mkdir(work)
  await writeFile(target, 'ORIGINAL')
  const tools = new ToolRegistry(),
    sessions = new MemorySessionStore()
  await sessions.open('own')
  const files = await registerFileTools(tools, {
    root: work,
    authorizeRead: async () => {
      await rename(target, join(root, 'old.txt'))
      await writeFile(target, 'SUBSTITUTED_CONTENT')
    },
  })
  const bridge = await openToolBridge({
    tools,
    sessions,
    sessionId: 'own',
    allowed: files.names,
    signal: new AbortController().signal,
    onActivity: async () => {},
  })
  t.after(async () => {
    await bridge.close()
    files.dispose()
    await rm(root, { recursive: true, force: true })
  })
  const response = await (await call(bridge, 1, 'read_file', { path: target, scope: 'external' })).json()
  assert.equal(response.result.isError, true)
  assert.equal(JSON.stringify(response).includes('SUBSTITUTED_CONTENT'), false)
})

test('failed call persistence prevents MCP side effects and hides storage exception details', async t => {
  const memory = new MemorySessionStore()
  await memory.open('chat')
  const tools = new ToolRegistry()
  let calls = 0
  tools.register({
    name: 'work',
    description: 'Must not execute',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute() {
      calls++
      return 'bad'
    },
  })
  const sessions = {
    read: id => memory.read(id),
    async append() {
      throw new Error('PRIVATE_STORAGE_DETAILS')
    },
  }
  const bridge = await openToolBridge({
    tools,
    sessions,
    sessionId: 'chat',
    allowed: ['work'],
    signal: new AbortController().signal,
    onActivity: async () => {},
  })
  t.after(() => bridge.close())
  const result = await (await call(bridge, 1)).json()
  assert.equal(result.result.isError, true)
  assert.equal(JSON.stringify(result).includes('PRIVATE_STORAGE_DETAILS'), false)
  assert.equal(calls, 0)
  assert.deepEqual(await memory.read('chat'), [])
})
