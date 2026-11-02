import assert from 'node:assert/strict'
import { mkdtemp, rm, readdir, readFile, copyFile } from 'node:fs/promises'
import { fork } from 'node:child_process'
import { once } from 'node:events'
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { OpenCodeAgentHandle } from '../apps/local-web/lib/types/opencode/agent.js'
import { MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { openWireFixture, replyChat } from './fixtures/opencode-wire.mjs'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import { historyPrompt, MAX_CONTEXT_BYTES } from '../apps/local-web/lib/types/opencode/history.js'

const executable = resolve(
  process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
    '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
)
const enabled = process.env.DECKAGENT_OPENCODE_CLI_TESTS === '1'

test('long-history wire measurements retain all turns and oversized sends make no provider request', {
  skip: !enabled,
  timeout: 210000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-long-history-'))
  const fixture = await openWireFixture('chat-completions', (_body, res) =>
    replyChat(res, { text: 'Long history fixture completed' }),
  )
  t.after(async () => {
    await fixture.close()
    await rm(root, { recursive: true, force: true })
  })
  const measurements = []
  for (const size of [16 * 1024, 128 * 1024, 1024 * 1024]) {
    const sessions = new MemorySessionStore(),
      sessionId = `long-${size}`
    await sessions.open(sessionId)
    const history = Array.from({ length: Math.ceil(size / 2048) }, (_, index) => ({
      role: index % 2 ? 'assistant' : 'user',
      content: `TURN_${index}:` + 'x'.repeat(2048),
    }))
    await sessions.append(sessionId, history)
    const agent = await OpenCodeAgentHandle.open({
      root,
      executable,
      sessionId,
      sessions,
      tools: new ToolRegistry(),
      allowed: [],
      maxSteps: 4,
      systemPrompt: 'Reply briefly.',
      provider: { protocol: 'chat-completions', baseUrl: fixture.baseUrl, model: 'exact', key: 'FIXTURE_KEY' },
    })
    const started = performance.now()
    try {
      assert.equal((await agent.send('Latest task')).status, 'completed')
      const wire = JSON.stringify(fixture.requests.at(-1).body)
      for (const index of [0, Math.floor(history.length / 2), history.length - 1])
        assert.ok(wire.includes(`TURN_${index}:`))
      assert.deepEqual((await sessions.read(sessionId)).slice(0, history.length), history)
      measurements.push({
        historyMessages: history.length,
        projectedBytes: Buffer.byteLength(historyPrompt(history)),
        wireBytes: Buffer.byteLength(wire),
        elapsedMs: Math.round(performance.now() - started),
      })
      const saved = await sessions.read(sessionId),
        count = fixture.requests.length
      const overflow = await agent.send('x'.repeat(MAX_CONTEXT_BYTES))
      assert.equal(overflow.status, 'failed')
      assert.equal(overflow.error.code, 'OPENCODE_CONTEXT_LIMIT')
      assert.deepEqual(await sessions.read(sessionId), saved)
      assert.equal(fixture.requests.length, count)
    } finally {
      await agent.dispose()
    }
  }
  t.diagnostic(
    JSON.stringify({
      scope: 'Actual CLI wire/latency measurements; provider responses are fixtures, not model cost evidence',
      measurements,
    }),
  )
})

test('oversized context fails without truncation and orphaned results stay explicit data', () => {
  const history = [{ role: 'user', content: 'x'.repeat(MAX_CONTEXT_BYTES) }]
  assert.throws(() => historyPrompt(history), { code: 'OPENCODE_CONTEXT_LIMIT' })
  assert.equal(history[0].content.length, MAX_CONTEXT_BYTES)
  const prompt = historyPrompt([
    { role: 'tool', toolCallId: 'missing', name: 'prior', isError: true, content: 'old result' },
  ])
  assert.ok(prompt.includes('orphaned'))
})

test('a copied legacy profile preserves messages and IDs while its model selection changes', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-profile-copy-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const source = join(root, 'original.sqlite'),
    target = join(root, 'copy.sqlite')
  const db = new DatabaseSync(source)
  db.exec(`CREATE TABLE sessions (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, provider TEXT, model TEXT, workspace_id TEXT DEFAULT 'default', CHECK ((provider IS NULL AND model IS NULL) OR (provider IS NOT NULL AND model IS NOT NULL))) STRICT;
    CREATE TABLE messages (session_id TEXT NOT NULL REFERENCES sessions(id), sequence INTEGER NOT NULL CHECK (sequence > 0), payload TEXT NOT NULL, PRIMARY KEY (session_id,sequence)) STRICT;
    INSERT INTO sessions VALUES ('old-chat','2026-01-01','2026-01-01','old-provider','old-model','default');
    INSERT INTO messages VALUES ('old-chat',1,'{"role":"user","content":"Keep legacy history"}');
    PRAGMA application_id = 1145128788; PRAGMA user_version = 2;`)
  db.close()
  const hash = bytes => createHash('sha256').update(bytes).digest('hex'),
    before = hash(await readFile(source))
  await copyFile(source, target)
  let sessions = new SqliteSessionStore(target)
  assert.deepEqual((await sessions.getInfo('old-chat')).selection, { provider: 'old-provider', model: 'old-model' })
  const history = await sessions.read('old-chat')
  await sessions.select('old-chat', { provider: 'new-provider', model: 'new-model', reasoningLevel: 'Thấp' })
  sessions.close()
  sessions = new SqliteSessionStore(target)
  try {
    assert.deepEqual(await sessions.read('old-chat'), history)
    assert.equal((await sessions.getInfo('old-chat')).selection.reasoningLevel, 'Thấp')
    assert.equal(hash(await readFile(source)), before)
  } finally {
    sessions.close()
  }
})

test('crash between persisted call and tool result remains unconfirmed after restart', { timeout: 15000 }, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-crash-'))
  const child = fork(new URL('./fixtures/opencode-crash.mjs', import.meta.url), [root], {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  })
  const closed = once(child, 'exit')
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await closed
    await rm(root, { recursive: true, force: true })
  })
  const [ready] = await Promise.race([
    once(child, 'message'),
    closed.then(() => {
      throw new Error('Crash fixture exited before startup')
    }),
  ])
  const entered = once(child, 'message')
  const pending = fetch(ready.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${ready.token}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'wait', arguments: {} } }),
  }).catch(() => undefined)
  assert.equal((await entered)[0].type, 'entered')
  child.kill('SIGKILL')
  await closed
  await pending
  const sessions = new SqliteSessionStore(join(root, 'sessions.sqlite'))
  try {
    const messages = await sessions.read('crashed-chat')
    assert.equal(messages.length, 1)
    assert.equal(messages[0].role, 'assistant')
    assert.equal(messages[0].toolCalls[0].name, 'wait')
    assert.ok(historyPrompt(messages).includes('unconfirmed'))
    await sessions.open('crashed-chat')
    assert.deepEqual(await sessions.read('crashed-chat'), messages)
  } finally {
    sessions.close()
  }
})

test('fresh sends preserve portable legacy tool context without providerState replay or duplicate continuation', {
  skip: !enabled,
  timeout: 210000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-history-'))
  const fixture = await openWireFixture('chat-completions', (_body, res) =>
    replyChat(res, { text: 'Fixture completed' }),
  )
  t.after(async () => {
    await fixture.close()
    await rm(root, { recursive: true, force: true })
  })
  const sessions = new MemorySessionStore()
  await sessions.open('legacy-chat')
  const legacy = [
    { role: 'user', content: 'Old request' },
    {
      role: 'assistant',
      content: '',
      toolCalls: [{ id: 'old-id', name: 'old_tool', arguments: { value: 'OLD_ARGUMENT_MARKER' } }],
      providerState: {
        provider: 'other-provider',
        model: 'other-model',
        data: { secretOpaqueState: 'MUST_NOT_REPLAY' },
      },
    },
  ]
  await sessions.append('legacy-chat', legacy)
  const options = {
    root,
    executable,
    sessionId: 'legacy-chat',
    sessions,
    tools: new ToolRegistry(),
    allowed: [],
    maxSteps: 4,
    systemPrompt: 'Do not replay earlier tools.',
    provider: { protocol: 'chat-completions', baseUrl: fixture.baseUrl, model: 'exact-model', key: 'FIXTURE_KEY' },
  }
  let agent = await OpenCodeAgentHandle.open(options)
  t.after(() => agent.dispose())
  assert.equal((await agent.send('New request')).status, 'completed')
  const wire = JSON.stringify(fixture.requests[0].body)
  assert.ok(wire.includes('OLD_ARGUMENT_MARKER'), 'Earlier tool arguments must not silently disappear')
  assert.ok(wire.includes('unconfirmed'), 'An interrupted tool call must not be described as completed')
  assert.equal(wire.includes('MUST_NOT_REPLAY'), false)
  assert.deepEqual((await sessions.read('legacy-chat')).slice(0, legacy.length), legacy)
  await agent.dispose()
  agent = await OpenCodeAgentHandle.open({ ...options, provider: { ...options.provider, model: 'another-model' } })
  assert.equal(
    (
      await agent.send('New request', {
        continuation: true,
        promptContext: [{ role: 'user', content: 'HOST_CONTEXT_ONLY' }],
      })
    ).status,
    'completed',
  )
  const nextWire = JSON.stringify(fixture.requests.at(-1).body)
  assert.ok(nextWire.includes('HOST_CONTEXT_ONLY'))
  assert.equal(nextWire.includes('OLD_ARGUMENT_MARKER'), false)
  assert.equal(
    (await sessions.read('legacy-chat')).filter(message => message.role === 'user' && message.content === 'New request')
      .length,
    1,
  )
  const executions = []
  for (const path of await readdir(root, { recursive: true }))
    if (path.endsWith('execution.json')) executions.push(JSON.parse(await readFile(join(root, path), 'utf8')))
  assert.equal(executions.length, 2)
  assert.equal(new Set(executions.map(value => value.nativeSessionId)).size, 2)
  assert.equal(
    executions.every(value => value.sessionId === 'legacy-chat'),
    true,
  )
})
