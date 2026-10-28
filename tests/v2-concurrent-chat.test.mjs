import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { startHost } from '../packages/host/api/lib/index.js'
import { fork } from 'node:child_process'
import { once } from 'node:events'

async function until(read, predicate) {
  for (let i = 0; i < 200; i++) {
    const value = await read()
    if (predicate(value)) return value
    await new Promise(resolve => setTimeout(resolve, 5))
  }
  throw new Error('Expected Chat state was not reached')
}

test('two Chats run independently and management preserves their latest request outcomes', {
  timeout: 10000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-concurrent-'))
  const releases = new Map([
    ['Chat X', Promise.withResolvers()],
    ['Chat Y', Promise.withResolvers()],
  ])
  const app = await startLocalWeb({
    dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'concurrent' },
    model: {
      async *stream({ messages, signal }) {
        const input = messages.findLast(message => message.role === 'user').content
        const gate = releases.get(input)
        yield { type: 'text-delta', text: `Started ${input}` }
        await Promise.race([
          gate.promise,
          new Promise((_, reject) => {
            if (signal.aborted) reject(signal.reason)
            else signal.addEventListener('abort', () => reject(signal.reason), { once: true })
          }),
        ])
        yield { type: 'finish', reason: 'stop' }
      },
    },
  })
  t.after(async () => {
    for (const gate of releases.values()) gate.resolve()
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const client = new HostClient(app.origin, app.token)
  const list = () =>
    fetch(`${app.origin}/api/sessions`, { headers: { authorization: `Bearer ${app.token}` } }).then(response =>
      response.json(),
    )
  const x = await client.send({ sessionId: 'chat-x', input: 'Chat X' })
  const y = await client.send({ sessionId: 'chat-y', input: 'Chat Y' })
  await assert.rejects(client.send({ sessionId: 'chat-x', input: 'Duplicate X' }), /SESSION_BUSY/)
  let sessions = await list()
  assert.equal(sessions.find(row => row.sessionId === 'chat-x').latestRequest.status, 'running')
  assert.equal(sessions.find(row => row.sessionId === 'chat-y').latestRequest.requestId, y.requestId)
  await client.stop(x.requestId)
  await until(
    () => client.snapshot(x.requestId),
    value => value.status === 'cancelled',
  )
  assert.equal((await client.snapshot(y.requestId)).status, 'running')
  releases.get('Chat Y').resolve()
  await until(
    () => client.snapshot(y.requestId),
    value => value.status === 'completed',
  )
  sessions = await list()
  const savedX = sessions.find(row => row.sessionId === 'chat-x')
  const savedY = sessions.find(row => row.sessionId === 'chat-y')
  assert.equal(savedX.activeRequestId, undefined)
  assert.equal(savedX.latestRequest.status, 'cancelled')
  assert.equal(savedY.latestRequest.status, 'completed')
  const activities = await (
    await fetch(`${app.origin}/api/sessions/chat-y/activities`, { headers: { authorization: `Bearer ${app.token}` } })
  ).json()
  assert.ok(activities.length > 0)
  assert.equal(typeof activities[0].startedAt, 'number')
  assert.ok(activities[0].endedAt >= activities[0].startedAt)
  assert.ok(savedY.latestRequest.sequence > savedX.latestRequest.sequence)
  assert.equal(
    (await client.history('chat-x')).some(message => message.content.includes('Chat Y')),
    false,
  )
  assert.equal(
    (await client.history('chat-y')).some(message => message.content.includes('Chat X')),
    false,
  )
})

test('waiting Chat replies and late Stop remain bound to the original request and question revision', async t => {
  const inputs = new Map()
  const host = await startHost({
    readHistory: async () => [],
    openAgent: async sessionId => {
      const received = []
      inputs.set(sessionId, received)
      let question
      return {
        sessionId,
        status: 'idle',
        history: async () => [],
        dispose: async () => {},
        question: () => question,
        async send(input) {
          received.push(input)
          question = { prompt: `Question ${received.length} for ${sessionId}`, options: ['Answer'], allowSkip: true }
          return { status: 'completed', text: question.prompt, steps: 1 }
        },
      }
    },
  })
  t.after(() => host.close())
  const client = new HostClient(host.origin, host.token)
  const x = await client.send({ sessionId: 'x', input: 'Start X' })
  const y = await client.send({ sessionId: 'y', input: 'Start Y' })
  const waitingX = await until(
    () => client.snapshot(x.requestId),
    value => value.status === 'awaiting_user',
  )
  const waitingY = await until(
    () => client.snapshot(y.requestId),
    value => value.status === 'awaiting_user',
  )
  assert.ok(waitingX.revision > x.revision)
  const stream = client.watch(x.requestId)[Symbol.asyncIterator]()
  assert.equal((await stream.next()).value.question.questionId, waitingX.question.questionId)
  await stream.return()
  assert.equal((await client.snapshot(x.requestId)).status, 'awaiting_user', 'Disconnect only detaches the view')
  const reply = {
    sessionId: 'x',
    questionId: waitingX.question.questionId,
    version: waitingX.question.version,
    replyId: 'reply-x',
    answer: { type: 'text', text: 'Only X' },
  }
  await assert.rejects(client.reply(y.requestId, reply), /REPLY_STALE/)
  const accepted = await client.reply(x.requestId, reply)
  assert.ok(accepted.revision > waitingX.revision)
  assert.deepEqual(await client.reply(x.requestId, reply), accepted, 'A lost reply receipt is safe to repeat')
  const second = await until(
    () => client.snapshot(x.requestId),
    value => value.status === 'awaiting_user' && value.question.version === 2,
  )
  assert.ok(second.revision > accepted.revision)
  await assert.rejects(client.reply(x.requestId, { ...reply, replyId: 'late-x' }), /REPLY_STALE/)
  assert.deepEqual(inputs.get('x'), ['Start X', 'Only X'])
  assert.deepEqual(inputs.get('y'), ['Start Y'])
  assert.equal((await client.snapshot(y.requestId)).question.questionId, waitingY.question.questionId)
  await client.stop(x.requestId)
  await until(
    () => client.snapshot(x.requestId),
    value => value.status === 'cancelled',
  )
  const newerX = await client.send({ sessionId: 'x', input: 'New X' })
  await until(
    () => client.snapshot(newerX.requestId),
    value => value.status === 'awaiting_user',
  )
  await client.stop(x.requestId)
  assert.equal((await client.snapshot(newerX.requestId)).status, 'awaiting_user')
  assert.equal((await client.snapshot(y.requestId)).status, 'awaiting_user')
})

test('Host restart marks running and waiting Chats unknown without replay or losing request identity', {
  timeout: 15000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-concurrent-restart-'))
  const child = fork(new URL('./fixtures/concurrent-web.mjs', import.meta.url), [dir], {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    windowsHide: true,
  })
  const exited = once(child, 'exit')
  let app
  t.after(async () => {
    child.kill()
    await exited
    await app?.close()
    await rm(dir, { recursive: true, force: true })
  })
  const [started] = await Promise.race([
    once(child, 'message'),
    exited.then(() => {
      throw new Error('Concurrent fixture exited before readiness')
    }),
  ])
  child.kill('SIGKILL')
  await exited
  let calls = 0
  app = await startLocalWeb({
    dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'concurrent' },
    model: {
      async *stream() {
        calls++
        yield { type: 'finish', reason: 'stop' }
      },
    },
  })
  const headers = { authorization: `Bearer ${app.token}` }
  const list = await (await fetch(`${app.origin}/api/sessions`, { headers })).json()
  for (const [sessionId, requestId] of Object.entries(started)) {
    const summary = list.find(row => row.sessionId === sessionId)
    assert.equal(summary.activeRequestId, undefined)
    assert.equal(summary.latestRequest.status, 'unknown')
    assert.equal(summary.latestRequest.requestId, requestId)
    const requests = await (await fetch(`${app.origin}/api/sessions/${sessionId}/requests`, { headers })).json()
    assert.equal(requests.at(-1).status, 'unknown')
    assert.equal(requests.at(-1).requestId, requestId)
    const activities = await (await fetch(`${app.origin}/api/sessions/${sessionId}/activities`, { headers })).json()
    assert.equal(
      activities.some(activity => activity.status === 'running'),
      false,
    )
    assert.ok((await new HostClient(app.origin, app.token).history(sessionId)).length > 0)
  }
  assert.equal(calls, 0)
})
