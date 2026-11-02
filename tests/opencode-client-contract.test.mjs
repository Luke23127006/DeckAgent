import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'

test('OpenCode rejects unmappable options at admission without silently using the legacy model', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-admission-'))
  let legacyCalls = 0
  const app = await startLocalWeb({
    dataDir: root,
    workspace: join(root, 'work'),
    openCode: { executable: join(root, 'does-not-exist.exe') },
    selection: { provider: 'fixture', model: 'test' },
    connections: [
      {
        id: 'fixture',
        protocol: 'chat-completions',
        baseUrl: 'https://invalid.example/v1',
        tokenLimitField: 'max_completion_tokens',
      },
    ],
    model: {
      async *stream() {
        legacyCalls++
        yield { type: 'finish', reason: 'stop' }
      },
    },
  })
  t.after(async () => {
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  const client = new HostClient(app.origin, app.token)
  // Chat Completions is mapped now; its unmappable token-field option remains fail-closed.
  await assert.rejects(
    client.send({ sessionId: 'unsupported', input: 'Do not fall back' }),
    /OPENCODE_UNSUPPORTED_OPTION/,
  )
  const response = await fetch(`${app.origin}/api/requests`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${app.token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ sessionId: 'unsupported', input: 'Do not fall back' }),
  })
  assert.equal(response.status, 409)
  assert.equal((await response.json()).error.code, 'OPENCODE_UNSUPPORTED_OPTION')
  assert.equal(legacyCalls, 0)
  assert.deepEqual(await client.history('unsupported'), [])
})

test('existing clients consume CLI activities and restored history without replay (provider fixture)', {
  skip: process.env.DECKAGENT_OPENCODE_CLI_TESTS !== '1',
  timeout: 210000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-client-'))
  const server = createServer(async (req, res) => {
    for await (const _chunk of req) {
      /* Drain without retaining provider prompts or credentials. */
    }
    // External API fixture, not evidence of real model behavior.
    res.writeHead(200, { 'content-type': 'text/event-stream' }).end(
      `data: ${JSON.stringify({
        candidates: [
          { content: { role: 'model', parts: [{ text: 'Client fixture response' }] }, finishReason: 'STOP' },
        ],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
      })}\n\n`,
    )
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  const prior = process.env.DECKAGENT_CLIENT_FIXTURE_KEY
  process.env.DECKAGENT_CLIENT_FIXTURE_KEY = 'NOT_A_CREDENTIAL'
  const options = {
    dataDir: root,
    workspace: join(root, 'work'),
    openCode: {
      executable: resolve(
        process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
          '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
      ),
    },
    selection: { provider: 'google', model: 'gemini-3.1-flash-lite' },
    connections: [
      {
        id: 'google',
        protocol: 'gemini',
        baseUrl: `http://127.0.0.1:${server.address().port}/v1beta`,
        apiKeyEnv: 'DECKAGENT_CLIENT_FIXTURE_KEY',
      },
    ],
  }
  let app
  t.after(async () => {
    await app?.close()
    server.closeAllConnections()
    await new Promise(done => server.close(done))
    if (prior === undefined) delete process.env.DECKAGENT_CLIENT_FIXTURE_KEY
    else process.env.DECKAGENT_CLIENT_FIXTURE_KEY = prior
    await rm(root, { recursive: true, force: true })
  })
  app = await startLocalWeb(options)
  let client = new HostClient(app.origin, app.token)
  const management = async kind => {
    const response = await fetch(`${app.origin}/api/sessions/client/${kind}`, {
      headers: { authorization: `Bearer ${app.token}` },
    })
    assert.equal(response.status, 200)
    return response.json()
  }
  const request = await client.send({ sessionId: 'client', input: 'Keep exactly one user message' })
  const snapshots = []
  for await (const value of client.watch(request.requestId)) snapshots.push(value)
  assert.equal(snapshots[0].status, 'running')
  assert.equal(snapshots.at(-1).status, 'completed')
  assert.match(snapshots.at(-1).result.text, /Client fixture response/)
  const activities = await management('activities')
  assert.ok(activities.some(activity => activity.kind === 'model'))
  for (const activity of activities) {
    assert.ok(activity.startedAt <= activity.endedAt)
    assert.notEqual(activity.status, 'running')
  }
  const history = await client.history('client')
  assert.equal(history.filter(message => message.role === 'user').length, 1)
  const reconnected = []
  for await (const value of client.watch(request.requestId)) reconnected.push(value.status)
  assert.deepEqual(reconnected, ['completed'])
  assert.deepEqual(await client.history('client'), history)
  await app.close()
  app = await startLocalWeb(options)
  client = new HostClient(app.origin, app.token)
  assert.deepEqual(await client.history('client'), history)
  assert.deepEqual(await management('activities'), activities)
  assert.equal((await management('requests')).at(-1).status, 'completed')
})
