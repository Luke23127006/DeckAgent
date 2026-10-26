import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import { AgentRuntime, MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js'

test('Web model selection changes independently of conversation and survives restart; CLI bind still guards mismatches', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-web-session-'))
  const path = join(dir, 'sessions.sqlite')
  let store = new SqliteSessionStore(path)
  t.after(async () => {
    store.close()
    await rm(dir, { recursive: true, force: true })
  })
  await store.bind('chat', { provider: 'first', model: 'a' })
  await store.append('chat', [{ role: 'user', content: 'Keep this conversation' }])
  await store.select('chat', { provider: 'second', model: 'b' })
  store.close()
  store = new SqliteSessionStore(path)
  assert.deepEqual((await store.getInfo('chat')).selection, { provider: 'second', model: 'b' })
  assert.deepEqual(await store.read('chat'), [{ role: 'user', content: 'Keep this conversation' }])
  await assert.rejects(store.bind('chat', { provider: 'first', model: 'a' }), { code: 'SESSION_CONFLICT' })
})

test('activities report real tool failure separately from a successful request', async t => {
  const tools = new ToolRegistry()
  tools.register({
    name: 'fail',
    description: 'Fixture failure',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute() {
      throw new Error('private failure')
    },
  })
  const runtime = new AgentRuntime({
    sessions: new MemorySessionStore(),
    tools,
    model: {
      async *stream(request) {
        if (request.messages.at(-1).role === 'tool') {
          yield { type: 'text-delta', text: 'The operation failed safely' }
          yield { type: 'finish', reason: 'stop' }
        } else {
          yield { type: 'tool-call', call: { id: 'one', name: 'fail', arguments: {} } }
          yield { type: 'finish', reason: 'tool-calls' }
        }
      },
    },
  })
  t.after(() => runtime.dispose())
  const agent = await runtime.createAgent({
    sessionId: 'activities',
    selection: { provider: 'fixture', model: 'a' },
    tools: ['fail'],
  })
  const events = []
  const result = await agent.send('Try', {
    onActivity: async event => {
      events.push(event)
    },
  })
  assert.equal(result.status, 'completed')
  assert.deepEqual(
    events.map(({ kind, status }) => [kind, status]),
    [
      ['model', 'running'],
      ['model', 'completed'],
      ['tool', 'running'],
      ['tool', 'failed'],
      ['model', 'running'],
      ['model', 'completed'],
    ],
  )
  assert.equal(JSON.stringify(events).includes('private failure'), false)
})

test('cancelling a tool with an unconfirmed side effect reports an unknown activity outcome', async t => {
  const tools = new ToolRegistry()
  const abort = new AbortController()
  tools.register({
    name: 'write',
    description: 'Fixture write',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute() {
      abort.abort()
      return 'Side effect happened before cancellation was observed'
    },
  })
  const runtime = new AgentRuntime({
    sessions: new MemorySessionStore(),
    tools,
    model: {
      async *stream() {
        yield { type: 'tool-call', call: { id: 'one', name: 'write', arguments: {} } }
        yield { type: 'finish', reason: 'tool-calls' }
      },
    },
  })
  t.after(() => runtime.dispose())
  const agent = await runtime.createAgent({
    sessionId: 'cancel',
    selection: { provider: 'fixture', model: 'a' },
    tools: ['write'],
  })
  const events = []
  const result = await agent.send('Try', {
    signal: abort.signal,
    onActivity: async event => {
      events.push(event)
    },
  })
  assert.equal(result.status, 'cancelled')
  assert.equal(events.at(-1).status, 'unknown')
})
