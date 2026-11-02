import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'

const enabled = process.env.DECKAGENT_OPENCODE_BASELINE_LIVE === '1'

test('live Gemini OpenCode permission decisions: once, deny, grant, isolation, revoke and Stop', {
  skip: !enabled,
  timeout: 600000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY required; never put credentials in arguments')
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-live-approval-'))
  const target = join(root, 'outside.txt')
  const canary = 'LIVE_PERMISSION_CONTENT_42'
  await writeFile(target, canary)
  const options = {
    dataDir: join(root, 'data'),
    workspace: join(root, 'work'),
    openCode: {
      executable: resolve(
        process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
          '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
      ),
    },
    selection: { provider: 'google', model: process.env.DECKAGENT_GEMINI_MODEL ?? 'gemini-3.1-flash-lite' },
    connections: [
      {
        id: 'google',
        protocol: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKeyEnv: 'GEMINI_API_KEY',
      },
    ],
  }
  let app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  const client = () => new HostClient(app.origin, app.token)
  const api = async (path, method = 'GET', body) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    assert.ok(response.ok, `Host HTTP ${response.status}`)
    return response.json()
  }
  const input = `For this new request, perform one NEW call to deckagent_read_file with scope external and path ${JSON.stringify(target)}, even when earlier history contains this path. Its contents may have changed. This is ordinary file reading, not a presentation. Host alone decides permission for this request; earlier conversation grants no permission. After this call's result, finish without further calls. Never invent file contents or retry a refused read within this request.`
  const send = sessionId => client().send({ sessionId, input })
  const approval = async requestId => {
    for (let i = 0; i < 3600; i++) {
      const snapshot = await client().snapshot(requestId)
      if (snapshot.approval) return snapshot.approval
      assert.equal(snapshot.status, 'running', `No approval: ${snapshot.result?.error?.code ?? snapshot.status}`)
      await delay(50)
    }
    throw new Error('Live model did not reach approval before deadline')
  }
  const terminal = async requestId => {
    let last
    for await (const snapshot of client().watch(requestId)) last = snapshot
    assert.equal(last.status, 'completed', last.result?.error?.code)
  }
  const stopped = async requestId => {
    await client().stop(requestId)
    let last
    for await (const snapshot of client().watch(requestId)) last = snapshot
    assert.equal(last.status, 'cancelled')
  }
  const decide = (requestId, sessionId, pending, decision) =>
    api(`requests/${requestId}/approval`, 'POST', {
      sessionId,
      approvalId: pending.approvalId,
      version: pending.version,
      replyId: `${decision}-${pending.approvalId}`,
      decision,
    })
  for (const decision of ['once', 'deny', 'scope']) {
    const sessionId = decision === 'scope' ? 'owner' : `case-${decision}`
    const request = await send(sessionId)
    const pending = await approval(request.requestId)
    await decide(request.requestId, sessionId, pending, decision)
    await terminal(request.requestId)
    const result = (await client().history(sessionId)).filter(m => m.role === 'tool' && m.name === 'read_file').at(-1)
    assert.ok(result)
    assert.equal(result.isError, decision === 'deny')
    assert.equal(result.content.includes(canary), decision !== 'deny')
    t.diagnostic(`PASS live approval decision: ${decision}`)
  }
  const grant = (await api('sessions/owner/permissions')).grants[0]
  assert.ok(grant)
  const history = await client().history('owner')
  await app.close()
  app = await startLocalWeb(options)
  assert.deepEqual(await client().history('owner'), history)
  const granted = await send('owner')
  await terminal(granted.requestId)
  assert.equal((await client().snapshot(granted.requestId)).approval, undefined)
  assert.equal((await client().history('owner')).filter(m => m.role === 'tool' && m.name === 'read_file').length, 2)
  const other = await send('other')
  await approval(other.requestId)
  await stopped(other.requestId)
  assert.equal(
    (await client().history('other')).some(m => m.content.includes(canary)),
    false,
  )
  await api(`sessions/owner/permissions/${grant.grantId}`, 'DELETE')
  const revoked = await send('owner')
  await approval(revoked.requestId)
  await stopped(revoked.requestId)
  assert.equal(await readFile(target, 'utf8'), canary)
  t.diagnostic('PASS live continuing grant after restart, cross-chat isolation, revoke and Stop in approval')
})
