import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { setTimeout as delay } from 'node:timers/promises'
import { fork } from 'node:child_process'
import { once } from 'node:events'

async function until(operation) {
  for (let i = 0; i < 200; i++) {
    const value = await operation()
    if (value) return value
    await delay(10)
  }
  throw new Error('Expected permission state was not observed')
}

test('a Chat has a durable permission preset without changing its conversation', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-permission-'))
  let app = await startLocalWeb({ dataDir: dir })
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', value) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    assert.ok(response.ok, `HTTP ${response.status}`)
    return response.json()
  }
  const chat = await api('sessions', 'POST', {})
  assert.equal((await api(`sessions/${chat.sessionId}/permissions`)).preset, 'workspace-access')
  await api('permission-default', 'PUT', { preset: 'provided-materials-only' })
  const next = await api('sessions', 'POST', {})
  assert.equal((await api(`sessions/${next.sessionId}/permissions`)).preset, 'provided-materials-only')
  assert.equal((await api(`sessions/${chat.sessionId}/permissions`)).preset, 'workspace-access')
  await api(`sessions/${chat.sessionId}/permissions`, 'PUT', { preset: 'provided-materials-only' })
  await app.close()
  app = await startLocalWeb({ dataDir: dir })
  assert.equal((await api(`sessions/${chat.sessionId}/permissions`)).preset, 'provided-materials-only')
  assert.deepEqual(await api(`sessions/${chat.sessionId}/history`), [])
})

test('a running request retains its preset while the next request uses the changed preset', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-permission-snapshot-'))
  const source = join(dir, 'source')
  await mkdir(source)
  await writeFile(join(source, 'notes.txt'), 'Source fixture')
  const hold = Promise.withResolvers(),
    entered = Promise.withResolvers()
  let calls = 0
  const selection = { provider: 'fixture', model: 'snapshot' }
  const app = await startLocalWeb({
    dataDir: join(dir, 'data'),
    selection,
    model: {
      async *stream(request) {
        if (request.messages.at(-1).role === 'user') {
          if (++calls === 1) {
            entered.resolve()
            await hold.promise
          }
          yield {
            type: 'tool-call',
            call: {
              id: `read-${request.messages.length}`,
              name: 'read_file',
              arguments: { path: 'notes.txt', scope: 'source' },
            },
          }
          yield { type: 'finish', reason: 'tool-calls' }
        } else {
          yield { type: 'text-delta', text: 'Done' }
          yield { type: 'finish', reason: 'stop' }
        }
      },
    },
  })
  t.after(async () => {
    hold.resolve()
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', value) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    assert.ok(response.ok)
    return response.json()
  }
  const workspace = await api('workspaces', 'POST', { projectFolder: source })
  const chat = await api('sessions', 'POST', { selection, workspaceId: workspace.id })
  const first = await api('requests', 'POST', { sessionId: chat.sessionId, input: 'Read source' })
  await entered.promise
  await api(`sessions/${chat.sessionId}/permissions`, 'PUT', { preset: 'provided-materials-only' })
  hold.resolve()
  await until(async () => (await api(`requests/${first.requestId}`)).status === 'completed')
  const second = await api('requests', 'POST', { sessionId: chat.sessionId, input: 'Read source again' })
  const approval = await until(async () => (await api(`requests/${second.requestId}`)).approval)
  assert.equal(approval.target, await realpath(join(source, 'notes.txt')))
  await api(`requests/${second.requestId}/stop`, 'POST')
})

test('outside reads wait for a distinct versioned approval; once, denial and stale replies cannot expand access', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-approval-'))
  const target = join(dir, 'outside.txt')
  await writeFile(target, 'Approved contents')
  let calls = 0
  const app = await startLocalWeb({
    dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'approval' },
    model: {
      async *stream(request) {
        calls++
        const results = request.messages.filter(message => message.role === 'tool')
        if (results.length < 3) {
          yield {
            type: 'tool-call',
            call: { id: `read-${results.length}`, name: 'read_file', arguments: { path: target, scope: 'external' } },
          }
          yield { type: 'finish', reason: 'tool-calls' }
        } else {
          yield { type: 'text-delta', text: 'Finished with refused reads omitted' }
          yield { type: 'finish', reason: 'stop' }
        }
      },
    },
  })
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', value) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    return { status: response.status, data: await response.json() }
  }
  const chat = (await api('sessions', 'POST', { selection: { provider: 'fixture', model: 'approval' } })).data
  const accepted = (await api('requests', 'POST', { sessionId: chat.sessionId, input: 'Read the file' })).data
  const pending = await until(async () => {
    const value = (await api(`requests/${accepted.requestId}`)).data
    return value.approval && value
  })
  assert.equal(pending.question, undefined)
  assert.equal(pending.approval.target, await realpath(target))
  assert.equal(calls, 1)
  assert.equal(
    (await api(`sessions/${chat.sessionId}/history`)).data.some(message => message.content === 'Approved contents'),
    false,
  )
  const answer = {
    sessionId: chat.sessionId,
    approvalId: pending.approval.approvalId,
    version: pending.approval.version,
    replyId: 'once',
    decision: 'once',
  }
  assert.equal(
    (await api(`requests/${accepted.requestId}/approval`, 'POST', { ...answer, sessionId: 'other-chat' })).status,
    409,
  )
  assert.equal((await api(`requests/${accepted.requestId}/approval`, 'POST', answer)).status, 202)
  const second = await until(async () => {
    const value = (await api(`requests/${accepted.requestId}`)).data
    return value.approval?.version === 2 && value
  })
  assert.equal(
    (await api(`requests/${accepted.requestId}/approval`, 'POST', answer)).status,
    202,
    'Same receipt is idempotent',
  )
  assert.equal(calls, 2)
  assert.equal(
    (await api(`requests/${accepted.requestId}/approval`, 'POST', { ...answer, replyId: 'stale' })).status,
    409,
  )
  assert.equal(
    (
      await api(`requests/${accepted.requestId}/approval`, 'POST', {
        ...answer,
        approvalId: second.approval.approvalId,
        version: 2,
        replyId: 'deny',
        decision: 'deny',
      })
    ).status,
    202,
  )
  await until(async () => (await api(`requests/${accepted.requestId}`)).data.status === 'completed')
  assert.equal(calls, 4, 'A denied target may fail again but must not ask again')
  const history = (await api(`sessions/${chat.sessionId}/history`)).data.filter(message => message.role === 'tool')
  assert.deepEqual(
    history.map(message => message.isError),
    [false, true, true],
  )
  assert.deepEqual((await api(`sessions/${chat.sessionId}/permissions`)).data.grants, [])
})

test('continuing approval survives restart, belongs to one Chat and can be revoked', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-grants-'))
  const target = join(dir, 'outside.txt')
  await writeFile(target, 'Shared public fixture')
  const model = {
    async *stream(request) {
      if (request.messages.at(-1).role === 'user') {
        yield {
          type: 'tool-call',
          call: {
            id: `read-${request.messages.length}`,
            name: 'read_file',
            arguments: { path: target, scope: 'external' },
          },
        }
        yield { type: 'finish', reason: 'tool-calls' }
      } else {
        yield { type: 'text-delta', text: 'Finished' }
        yield { type: 'finish', reason: 'stop' }
      }
    },
  }
  const options = { dataDir: join(dir, 'data'), selection: { provider: 'fixture', model: 'grant' }, model }
  let app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', value) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    assert.ok(response.ok, `HTTP ${response.status}`)
    return response.json()
  }
  const x = await api('sessions', 'POST', { selection: options.selection })
  const y = await api('sessions', 'POST', { selection: options.selection })
  const request = await api('requests', 'POST', { sessionId: x.sessionId, input: 'Read' })
  const approval = await until(async () => (await api(`requests/${request.requestId}`)).approval)
  await api(`requests/${request.requestId}/approval`, 'POST', {
    sessionId: x.sessionId,
    approvalId: approval.approvalId,
    version: approval.version,
    replyId: 'scope',
    decision: 'scope',
  })
  await until(async () => (await api(`requests/${request.requestId}`)).status === 'completed')
  const grant = (await api(`sessions/${x.sessionId}/permissions`)).grants[0]
  assert.equal(grant.target, await realpath(target))
  const other = await api('requests', 'POST', { sessionId: y.sessionId, input: 'Read' })
  await until(async () => (await api(`requests/${other.requestId}`)).approval)
  await api(`requests/${other.requestId}/stop`, 'POST')
  await until(async () => (await api(`requests/${other.requestId}`)).status === 'cancelled')
  await app.close()
  app = await startLocalWeb(options)
  const resumed = await api('requests', 'POST', { sessionId: x.sessionId, input: 'Read again' })
  await until(async () => (await api(`requests/${resumed.requestId}`)).status === 'completed')
  await api(`sessions/${x.sessionId}/permissions/${grant.grantId}`, 'DELETE')
  const next = await api('requests', 'POST', { sessionId: x.sessionId, input: 'Read after revocation' })
  await until(async () => (await api(`requests/${next.requestId}`)).approval)
  assert.deepEqual((await api(`sessions/${y.sessionId}/permissions`)).grants, [])
  await api(`requests/${next.requestId}/stop`, 'POST')
})

test('Host restart keeps an interrupted approval unconfirmed and never executes or approves it', {
  timeout: 15000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-approval-restart-'))
  await writeFile(join(dir, 'outside.txt'), 'Unread contents')
  const child = fork(new URL('./fixtures/permission-web.mjs', import.meta.url), [dir], {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    windowsHide: true,
  })
  const closed = once(child, 'exit')
  let app
  t.after(async () => {
    child.kill()
    await closed
    await app?.close()
    await rm(dir, { recursive: true, force: true })
  })
  const [pending] = await Promise.race([
    once(child, 'message'),
    closed.then(() => {
      throw new Error('Fixture failed')
    }),
  ])
  child.kill('SIGKILL')
  await closed
  let calls = 0
  app = await startLocalWeb({
    dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'approval-restart' },
    model: {
      async *stream() {
        calls++
        yield { type: 'finish', reason: 'stop' }
      },
    },
  })
  const headers = { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' }
  const rows = await (await fetch(`${app.origin}/api/sessions/${pending.sessionId}/requests`, { headers })).json()
  assert.equal(rows[0].status, 'unknown')
  assert.equal(rows[0].approval.approvalId, pending.approval.approvalId)
  const stale = await fetch(`${app.origin}/api/requests/${pending.requestId}/approval`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sessionId: pending.sessionId,
      approvalId: pending.approval.approvalId,
      version: 1,
      replyId: 'old',
      decision: 'scope',
    }),
  })
  assert.equal(stale.status, 404)
  const permission = await (
    await fetch(`${app.origin}/api/sessions/${pending.sessionId}/permissions`, { headers })
  ).json()
  assert.deepEqual(permission.grants, [])
  assert.equal(calls, 0)
})
