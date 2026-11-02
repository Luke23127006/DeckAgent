import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient, DeckClient } from '../packages/client/runtime/lib/index.js'
import { openWireFixture, replyChat } from './fixtures/opencode-wire.mjs'

const enabled = process.env.DECKAGENT_OPENCODE_CLI_TESTS === '1'
const executable = resolve(
  process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
    '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
)

async function until(read, description) {
  for (let attempt = 0; attempt < 600; attempt++) {
    const value = await read()
    if (value) return value
    await delay(50)
  }
  throw new Error(`Not observed: ${description}`)
}

// Only the external provider is scripted. Host, CLI, MCP, registry and storage are real.
async function setup(t, handle) {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-baseline-'))
  const wire = await openWireFixture('chat-completions', handle)
  const keyName = 'DECKAGENT_BASELINE_FIXTURE_KEY'
  const previous = process.env[keyName]
  process.env[keyName] = 'NOT_A_CREDENTIAL'
  const options = {
    dataDir: join(root, 'data'),
    workspace: join(root, 'work'),
    openCode: { executable },
    selection: { provider: 'fixture', model: 'baseline' },
    connections: [{ id: 'fixture', protocol: 'chat-completions', baseUrl: wire.baseUrl, apiKeyEnv: keyName }],
  }
  let app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await wire.close()
    if (previous === undefined) delete process.env[keyName]
    else process.env[keyName] = previous
    await rm(root, { recursive: true, force: true })
  })
  return {
    root,
    wire,
    get client() {
      return new HostClient(app.origin, app.token)
    },
    get decks() {
      return new DeckClient(app.origin, app.token)
    },
    async api(path, method = 'GET', value) {
      const response = await fetch(`${app.origin}/api/${path}`, {
        method,
        headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
        ...(value === undefined ? {} : { body: JSON.stringify(value) }),
      })
      return { status: response.status, data: await response.json() }
    },
    async restart() {
      await app.close()
      app = await startLocalWeb(options)
    },
  }
}

async function finished(client, requestId) {
  let terminal
  for await (const snapshot of client.watch(requestId)) terminal = snapshot
  return terminal
}

test('OpenCode Host approvals: once, deny, continuing grant, cross-chat isolation, revoke and Stop', {
  skip: !enabled,
  timeout: 210000,
}, async t => {
  let target
  const ctx = await setup(t, (body, res) => {
    if (body.messages.at(-1).role === 'tool') replyChat(res, { text: 'Read attempt finished' })
    else replyChat(res, { call: { name: 'deckagent_read_file', arguments: { path: target, scope: 'external' } } })
  })
  target = join(ctx.root, 'outside.txt')
  await writeFile(target, 'APPROVAL_CANARY')
  const create = async () =>
    (await ctx.api('sessions', 'POST', { selection: { provider: 'fixture', model: 'baseline' } })).data
  const x = await create(),
    y = await create()
  const send = sessionId => ctx.client.send({ sessionId, input: 'Read the specified external file' })
  const approval = requestId => until(async () => (await ctx.client.snapshot(requestId)).approval, 'approval')
  const decide = (requestId, sessionId, pending, decision, replyId) =>
    ctx.api(`requests/${requestId}/approval`, 'POST', {
      sessionId,
      approvalId: pending.approvalId,
      version: pending.version,
      decision,
      replyId,
    })
  const first = await send(x.sessionId)
  const once = await approval(first.requestId)
  assert.equal((await decide(first.requestId, y.sessionId, once, 'scope', 'wrong-chat')).status, 409)
  assert.equal((await decide(first.requestId, x.sessionId, once, 'once', 'once')).status, 202)
  assert.equal((await finished(ctx.client, first.requestId)).status, 'completed')
  assert.deepEqual((await ctx.api(`sessions/${x.sessionId}/permissions`)).data.grants, [])
  const second = await send(x.sessionId)
  const deny = await approval(second.requestId)
  assert.equal((await decide(second.requestId, x.sessionId, once, 'scope', 'stale')).status, 409)
  assert.equal((await decide(second.requestId, x.sessionId, deny, 'deny', 'deny')).status, 202)
  assert.equal((await finished(ctx.client, second.requestId)).status, 'completed')
  const denied = (await ctx.client.history(x.sessionId)).filter(m => m.role === 'tool').at(-1)
  assert.equal(denied.isError, true)
  assert.equal(denied.content.includes('APPROVAL_CANARY'), false)
  const third = await send(x.sessionId)
  const scope = await approval(third.requestId)
  assert.equal((await decide(third.requestId, x.sessionId, scope, 'scope', 'scope')).status, 202)
  assert.equal((await finished(ctx.client, third.requestId)).status, 'completed')
  const grant = (await ctx.api(`sessions/${x.sessionId}/permissions`)).data.grants[0]
  assert.ok(grant)
  const history = await ctx.client.history(x.sessionId)
  const count = ctx.wire.requests.length
  await ctx.restart()
  assert.equal(ctx.wire.requests.length, count, 'Restart must not infer')
  assert.deepEqual(await ctx.client.history(x.sessionId), history)
  const fourth = await send(x.sessionId)
  assert.equal((await finished(ctx.client, fourth.requestId)).status, 'completed')
  assert.equal((await ctx.client.snapshot(fourth.requestId)).approval, undefined)
  const other = await send(y.sessionId)
  await approval(other.requestId)
  await ctx.client.stop(other.requestId)
  assert.equal((await finished(ctx.client, other.requestId)).status, 'cancelled')
  assert.equal(
    (await ctx.client.history(y.sessionId)).some(m => m.content.includes('APPROVAL_CANARY')),
    false,
  )
  assert.equal((await ctx.api(`sessions/${x.sessionId}/permissions/${grant.grantId}`, 'DELETE')).status, 200)
  const revoked = await send(x.sessionId)
  const pending = await approval(revoked.requestId)
  await ctx.client.stop(revoked.requestId)
  assert.equal((await finished(ctx.client, revoked.requestId)).status, 'cancelled')
  const stoppedCount = ctx.wire.requests.length
  assert.notEqual((await decide(revoked.requestId, x.sessionId, pending, 'scope', 'late')).status, 202)
  await delay(500)
  assert.equal(ctx.wire.requests.length, stoppedCount, 'No provider continuation after stopped approval')
  assert.equal(await readFile(target, 'utf8'), 'APPROVAL_CANARY')
})

test('OpenCode Host workflow preserves confirmation, scoped revisions and restart without replay', {
  skip: !enabled,
  timeout: 150000,
}, async t => {
  let commands = []
  const ctx = await setup(t, (_body, res) => {
    const call = commands.shift()
    replyChat(res, call ? { call } : { text: 'Scripted provider finished' })
  })
  const run = async (request, calls) => {
    commands = calls
    const accepted = await ctx.client.send(request)
    const result = await finished(ctx.client, accepted.requestId)
    assert.equal(commands.length, 0, 'CLI must consume the scripted calls through MCP')
    return result
  }
  const tool = (name, args) => ({ name: `deckagent_${name}`, arguments: args })
  const sessionId = 'presentation'
  assert.equal(
    (
      await run({ sessionId, input: 'Propose two recycling slides', presentation: true }, [
        tool('propose_outline', {
          proposal: JSON.stringify({
            overview: 'Recycling for adults',
            slides: [
              { title: 'Why recycle', content: 'Save materials' },
              { title: 'Next actions', content: 'Sort and reuse' },
            ],
          }),
        }),
        // A hostile provider can request a tool absent from its declarations.
        tool('publish_slide', {
          outlineId: 'fake',
          slideId: 'fake',
          path: 'fake.html',
          expectedRevision: 0,
          publicationId: 'early',
        }),
      ])
    ).status,
    'completed',
  )
  const state = (await ctx.api(`sessions/${sessionId}/outline`)).data
  assert.equal(state.confirmedId, null)
  assert.equal((await ctx.decks.snapshot(sessionId)).slides.length, 0)
  const proposal = state.proposals[0]
  const beforeStale = ctx.wire.requests.length
  await assert.rejects(
    ctx.client.send({
      sessionId,
      input: 'Confirm outline',
      outlineAction: {
        type: 'confirm',
        outlineId: proposal.outlineId,
        version: proposal.version + 1,
      },
    }),
    /OUTLINE_STALE/,
  )
  assert.equal(ctx.wire.requests.length, beforeStale)
  const publish = (slide, path, revision, id) =>
    tool('publish_slide', {
      outlineId: proposal.outlineId,
      slideId: slide.slideId,
      path,
      expectedRevision: revision,
      publicationId: id,
    })
  const [one, two] = proposal.slides
  const generated = await run(
    {
      sessionId,
      input: 'Confirm outline',
      outlineAction: {
        type: 'confirm',
        outlineId: proposal.outlineId,
        version: proposal.version,
      },
    },
    [
      tool('write_file', { path: 'one.html', content: '<h1>Why recycle</h1>' }),
      publish(one, 'one.html', 0, 'one'),
      tool('write_file', { path: 'two.html', content: '<h1>Next actions</h1>' }),
      publish(two, 'two.html', 0, 'two'),
    ],
  )
  assert.equal(generated.status, 'completed')
  const before = await ctx.decks.snapshot(sessionId)
  assert.deepEqual(
    before.slides.map(s => s.revision),
    [1, 1],
  )
  const first = await ctx.decks.content(sessionId, one.slideId, 1)
  const edited = await run({ sessionId, input: 'Edit slide 2 only: show TEST_SLIDE_2.' }, [
    tool('write_file', { path: 'edit.html', content: '<h1>TEST_SLIDE_2</h1>' }),
    publish(one, 'edit.html', 1, 'outside-scope'),
    publish(two, 'edit.html', 0, 'stale'),
    publish(two, 'edit.html', 1, 'edit'),
    publish(two, 'edit.html', 1, 'edit'), // Exact duplicate must be idempotent.
  ])
  assert.equal(edited.status, 'completed')
  const after = await ctx.decks.snapshot(sessionId)
  assert.deepEqual(
    after.slides.map(s => s.revision),
    [1, 2],
  )
  assert.deepEqual(await ctx.decks.content(sessionId, one.slideId, 1), first)
  assert.match((await ctx.decks.content(sessionId, two.slideId, 2)).html, /TEST_SLIDE_2/)
  const results = (await ctx.client.history(sessionId)).filter(m => m.role === 'tool')
  assert.ok(results.some(m => m.isError && m.content.includes('SLIDE_SCOPE_DENIED')))
  assert.ok(results.some(m => m.isError && m.content.includes('SLIDE_REVISION_CONFLICT')))
  const history = await ctx.client.history(sessionId)
  const count = ctx.wire.requests.length
  await ctx.restart()
  assert.deepEqual(await ctx.decks.snapshot(sessionId), after)
  assert.deepEqual(await ctx.client.history(sessionId), history)
  assert.equal(ctx.wire.requests.length, count)
  await assert.rejects(
    ctx.client.send({
      sessionId,
      input: 'Confirm outline',
      outlineAction: {
        type: 'confirm',
        outlineId: proposal.outlineId,
        version: proposal.version + 1,
      },
    }),
    /OUTLINE_ALREADY_CONFIRMED/,
  )
  assert.equal(ctx.wire.requests.length, count, 'Stale confirmation must not infer')
  assert.deepEqual(await ctx.decks.snapshot(sessionId), after)
})

test('OpenCode concurrent chats keep admission, Stop and histories separate', {
  skip: !enabled,
  timeout: 90000,
}, async t => {
  let entered = 0
  const ctx = await setup(t, (_body, res) => {
    entered++
    if (entered === 1) return // First chat waits on a real HTTP stream.
    replyChat(res, { text: 'SECOND_CHAT_ONLY' })
  })
  const x = await ctx.client.send({ sessionId: 'x', input: 'FIRST_CHAT_ONLY' })
  await until(() => entered > 0, 'first provider call')
  await assert.rejects(ctx.client.send({ sessionId: 'x', input: 'duplicate' }), /SESSION_BUSY/)
  const y = await ctx.client.send({ sessionId: 'y', input: 'Second chat request' })
  assert.equal((await finished(ctx.client, y.requestId)).status, 'completed')
  assert.equal((await ctx.client.snapshot(x.requestId)).status, 'running')
  await ctx.client.stop(x.requestId)
  assert.equal((await finished(ctx.client, x.requestId)).status, 'cancelled')
  assert.equal((await ctx.client.snapshot(y.requestId)).status, 'completed')
  const count = ctx.wire.requests.length
  await delay(500)
  assert.equal(ctx.wire.requests.length, count)
  assert.equal(
    (await ctx.client.history('x')).some(m => m.content.includes('SECOND_CHAT_ONLY')),
    false,
  )
  assert.equal(
    (await ctx.client.history('y')).some(m => m.content.includes('FIRST_CHAT_ONLY')),
    false,
  )
  const next = await ctx.client.send({ sessionId: 'x', input: 'Admission released after Stop' })
  assert.equal((await finished(ctx.client, next.requestId)).status, 'completed')
})
