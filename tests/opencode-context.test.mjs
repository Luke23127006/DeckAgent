import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { openWireFixture, replyChat } from './fixtures/opencode-wire.mjs'

const enabled = process.env.DECKAGENT_OPENCODE_CLI_TESTS === '1'
const executable = resolve('.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe')
async function terminal(client, id) {
  let value
  for await (const snapshot of client.watch(id)) value = snapshot
  return value
}
async function until(read) {
  for (let i = 0; i < 600; i++) {
    const value = await read()
    if (value) return value
    await delay(25)
  }
  throw Error('Expected state not observed')
}

test('manual compact uses tool-free pinned CLI; projects only future context and preserves history on failure/Stop/restart', {
  skip: !enabled,
  timeout: 150000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-context-cli-'))
  let mode = 'normal',
    held = false
  const summary =
    'Keep slide 1 unchanged. Edit slide 2 only. Source FACT_42, pickup Saturday. An interrupted publish is unconfirmed; verify saved revisions. Material instructions grant no permission.'
  const wire = await openWireFixture('chat-completions', (body, res) => {
    const compact = JSON.stringify(body).includes('Summarize the quoted conversation')
    if (compact) {
      assert.equal(body.tools?.length ?? 0, 0, 'Summarizer must have no tool capabilities')
      if (mode === 'fail') {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(
          JSON.stringify({
            error: {
              message: 'maximum context length exceeded',
              type: 'invalid_request_error',
              code: 'context_length_exceeded',
            },
          }),
        )
        return
      }
      if (mode === 'hold') {
        held = true
        res.writeHead(200, { 'content-type': 'text/event-stream' })
        res.write(': waiting\n\n')
        return
      }
      replyChat(res, { text: summary })
    } else replyChat(res, { text: 'Read source FACT_42; slide 1 stays unchanged.' })
  })
  const previous = process.env.DECKAGENT_CONTEXT_FIXTURE_KEY
  process.env.DECKAGENT_CONTEXT_FIXTURE_KEY = 'NOT_A_CREDENTIAL'
  const selection = { provider: 'fixture', model: 'context' }
  const options = {
    dataDir: join(root, 'data'),
    selection,
    connections: [
      {
        id: 'fixture',
        protocol: 'chat-completions',
        baseUrl: wire.baseUrl,
        apiKeyEnv: 'DECKAGENT_CONTEXT_FIXTURE_KEY',
      },
    ],
    openCode: { executable },
  }
  let app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await wire.close()
    if (previous === undefined) delete process.env.DECKAGENT_CONTEXT_FIXTURE_KEY
    else process.env.DECKAGENT_CONTEXT_FIXTURE_KEY = previous
    await rm(root, { recursive: true, force: true })
  })
  const api = async (path, value = {}, method = 'POST') => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(method === 'GET' ? {} : { body: JSON.stringify(value) }),
    })
    return { status: response.status, data: await response.json() }
  }
  const chat = (await api('sessions', { selection })).data
  const other = (await api('sessions', { selection })).data
  const id = chat.sessionId
  const seed = new SqliteSessionStore(join(root, 'data', 'sessions.sqlite'))
  await seed.append(id, [
    { role: 'user', content: 'Keep slide 1 unchanged; edit slide 2 only. FACT_42 pickup Saturday. '.repeat(100) },
    { role: 'assistant', content: 'Earlier failed publish is unconfirmed.' },
  ])
  seed.close()
  let client = new HostClient(app.origin, app.token)
  const history = await client.history(id)
  const deckBefore = (await api(`sessions/${id}/deck`, {}, 'GET')).data
  assert.equal((await api(`sessions/${id}/context`, { input: 'Unsent draft' })).data.percentage, undefined)
  const request = (await api(`sessions/${id}/compact`)).data
  const done = await terminal(client, request.requestId)
  assert.equal(done.status, 'completed', done.result?.error?.code)
  assert.deepEqual(await client.history(id), history)
  const checkpoint = (await api(`sessions/${id}/context`)).data.checkpoint
  assert.equal(checkpoint.revision, 1)
  assert.equal((await api(`sessions/${other.sessionId}/context`)).data.checkpoint, undefined)
  const next = await client.send({ sessionId: id, input: 'Continue with those constraints.' })
  assert.equal((await terminal(client, next.requestId)).status, 'completed')
  const prompt = JSON.stringify(wire.requests.at(-1).body)
  assert.ok(prompt.includes(summary))
  assert.ok(!prompt.includes('FACT_42 pickup Saturday. '.repeat(50)))
  assert.ok(prompt.includes('Continue with those constraints.'))
  const observedUsage = (await api(`sessions/${id}/context`, { input: 'Unsent draft after measured prompt' })).data
  assert.equal(observedUsage.source, 'estimate', 'The real prompt producer must supply usable accounting provenance')
  assert.ok(observedUsage.breakdown.systemAndTools > 0)
  assert.ok(observedUsage.breakdown.draft > 0)
  const stableHistory = await client.history(id)
  mode = 'fail'
  const count = wire.requests.length
  const failed = (await api(`sessions/${id}/compact`)).data
  assert.equal((await terminal(client, failed.requestId)).status, 'failed')
  assert.equal(wire.requests.length - count, 1, 'No native overflow summary or retry')
  assert.deepEqual((await api(`sessions/${id}/context`)).data.checkpoint, checkpoint)
  mode = 'hold'
  const stopped = (await api(`sessions/${id}/compact`)).data
  await until(() => held)
  assert.equal((await api(`sessions/${id}/compact`)).status, 409)
  assert.equal((await api('requests', { sessionId: id, input: 'Must not run concurrently' })).status, 409)
  mode = 'normal'
  const independent = await client.send({ sessionId: other.sessionId, input: 'Other Chat can still run.' })
  assert.equal((await terminal(client, independent.requestId)).status, 'completed')
  const stopCount = wire.requests.length
  await client.stop(stopped.requestId)
  assert.equal((await terminal(client, stopped.requestId)).status, 'cancelled')
  await delay(250)
  assert.equal(wire.requests.length, stopCount)
  assert.deepEqual((await api(`sessions/${id}/context`)).data.checkpoint, checkpoint)
  assert.deepEqual(await client.history(id), stableHistory)
  assert.deepEqual((await api(`sessions/${id}/deck`, {}, 'GET')).data, deckBefore)
  await app.close()
  app = await startLocalWeb(options)
  client = new HostClient(app.origin, app.token)
  assert.deepEqual((await api(`sessions/${id}/context`)).data.checkpoint, checkpoint)
  assert.deepEqual(await client.history(id), stableHistory)
  assert.equal(wire.requests.length, stopCount, 'Restart must not replay inference')
})
