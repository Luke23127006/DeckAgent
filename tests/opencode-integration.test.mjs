import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient, DeckClient } from '../packages/client/runtime/lib/index.js'
import { OpenCodeAgentHandle } from '../apps/local-web/lib/types/opencode/agent.js'
import { MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js'

const enabled = process.env.DECKAGENT_OPENCODE_POC === '1'

test('real OpenCode model receives MCP arguments, sanitized errors and recovery results', {
  skip: !enabled,
  timeout: 210000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY)
  const root = resolve('.local-only/opencode-integration-probe', randomUUID())
  await mkdir(root, { recursive: true })
  const sessions = new MemorySessionStore(),
    tools = new ToolRegistry(),
    argumentsSeen = [],
    activities = []
  tools.register({
    name: 'probe',
    description: 'Probe with value fail first, then recover.',
    parameters: {
      type: 'object',
      properties: { value: { type: 'string' } },
      required: ['value'],
      additionalProperties: false,
    },
    async execute(args) {
      argumentsSeen.push(args.value)
      if (args.value === 'fail') throw new Error('PRIVATE_TOOL_EXCEPTION')
      return 'RECOVERY_RESULT_CONFIRMED'
    },
  })
  const agent = await OpenCodeAgentHandle.open({
    root,
    executable: resolve(
      process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
        '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
    ),
    sessionId: 'probe',
    sessions,
    tools,
    allowed: ['probe'],
    maxSteps: 8,
    systemPrompt: 'Follow the tool test instructions exactly. Do not skip either call.',
    provider: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-3.1-flash-lite',
      key: process.env.GEMINI_API_KEY,
    },
  })
  t.after(() => agent.dispose())
  const result = await agent.send(
    'Call deckagent_probe with value fail. Wait for its error, then call it with value recover. Include the exact successful tool result in your final answer.',
    {
      onActivity: async event => {
        activities.push(event)
      },
    },
  )
  assert.equal(result.status, 'completed')
  assert.deepEqual(argumentsSeen, ['fail', 'recover'])
  const history = await sessions.read('probe'),
    results = history.filter(message => message.role === 'tool')
  assert.equal(results[0].isError, true)
  assert.equal(JSON.parse(results[0].content).error.code, 'TOOL_FAILED')
  assert.equal(results[1].content, 'RECOVERY_RESULT_CONFIRMED')
  assert.equal(results[1].isError, false)
  assert.match(result.text, /RECOVERY_RESULT_CONFIRMED/)
  assert.equal(JSON.stringify({ history, activities, result }).includes('PRIVATE_TOOL_EXCEPTION'), false)
  assert.ok(activities.some(event => event.kind === 'tool' && event.status === 'failed'))
  assert.ok(activities.some(event => event.kind === 'tool' && event.status === 'completed'))
  await writeFile(
    join(root, 'evidence.json'),
    JSON.stringify(
      {
        status: 'PASS',
        model: 'gemini-3.1-flash-lite',
        argumentsSeen,
        errorCode: 'TOOL_FAILED',
        recoveryResult: results[1].content,
        privateExceptionLeaked: false,
        steps: result.steps,
      },
      null,
      2,
    ),
  )
})

test('active OpenCode cancellation aborts the real MCP handler before any side effect', {
  skip: !enabled,
  timeout: 210000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY)
  const root = resolve('.local-only/opencode-integration-stop', randomUUID())
  await mkdir(root, { recursive: true })
  const sessions = new MemorySessionStore(),
    tools = new ToolRegistry(),
    abort = new AbortController()
  let entered,
    mutations = 0
  const started = new Promise(resolve => {
    entered = resolve
  })
  tools.register({
    name: 'wait',
    description: 'Wait for the cancellation test. Call this tool now.',
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
  const agent = await OpenCodeAgentHandle.open({
    root,
    executable: resolve(
      process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
        '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
    ),
    sessionId: 'stop',
    sessions,
    tools,
    allowed: ['wait'],
    maxSteps: 8,
    systemPrompt: 'You are testing runtime cancellation. Call the requested tool immediately.',
    provider: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-3.1-flash-lite',
      key: process.env.GEMINI_API_KEY,
    },
  })
  t.after(() => agent.dispose())
  const running = agent.send('Call deckagent_wait now. After it finishes, call it a second time.', {
    signal: abort.signal,
  })
  await Promise.race([
    started,
    running.then(result => {
      throw new Error(`Tool never started: ${result.status}`)
    }),
  ])
  abort.abort()
  const result = await running
  assert.equal(result.status, 'cancelled')
  await agent.dispose()
  await new Promise(done => setTimeout(done, 2000))
  assert.equal(mutations, 0)
  assert.equal((await sessions.read('stop')).filter(m => m.role === 'tool').length, 1)
  await assert.rejects(agent.send('late call'), /unavailable/)
  await writeFile(
    join(root, 'evidence.json'),
    JSON.stringify(
      {
        status: 'PASS',
        model: 'gemini-3.1-flash-lite',
        result: result.status,
        mutations,
        lateCallsAccepted: false,
        observationWindowMs: 2000,
      },
      null,
      2,
    ),
  )
})
test('real OpenCode: outline confirmation, two slides, scoped edit, Stop, chat isolation and restart', {
  skip: !enabled,
  timeout: 600000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY is required for real-model verification')
  const root = resolve('.local-only/opencode-integration', randomUUID())
  await mkdir(root, { recursive: true })
  const executable = resolve(
    process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
      '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
  )
  const options = {
    dataDir: join(root, 'data'),
    workspace: join(root, 'work'),
    openCode: { executable },
    selection: { provider: 'google', model: 'gemini-3.1-flash-lite' },
    connections: [
      {
        id: 'google',
        protocol: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKeyEnv: 'GEMINI_API_KEY',
      },
    ],
  }
  const evidence = { root, tests: {}, model: options.selection.model }
  let app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await writeFile(join(root, 'evidence.json'), JSON.stringify(evidence, null, 2))
  })
  let client = new HostClient(app.origin, app.token),
    decks = new DeckClient(app.origin, app.token)
  const outline = async session =>
    (
      await fetch(`${app.origin}/api/sessions/${session}/outline`, {
        headers: { authorization: `Bearer ${app.token}` },
      })
    ).json()
  async function complete(request) {
    const accepted = await client.send(request)
    let result
    for await (const snapshot of client.watch(accepted.requestId)) result = snapshot
    if (result.status !== 'completed') evidence.lastFailure = result
    assert.equal(result.status, 'completed', JSON.stringify(result))
    const response = await fetch(`${app.origin}/api/sessions/${request.sessionId}/activities`, {
      headers: { authorization: `Bearer ${app.token}` },
    })
    assert.equal(response.status, 200)
    const activities = (await response.json()).filter(
      event => event.requestId === result.requestId && event.kind === 'tool',
    )
    const history = await client.history(request.sessionId)
    assert.ok(activities.length > 0)
    for (const activity of activities)
      assert.ok(
        history.some(
          message =>
            message.role === 'tool' && activity.id === `tool-${message.toolCallId}` && activity.label === message.name,
        ),
        'Tool output must belong to its request activity',
      )
    return result
  }
  // Source files must remain unchanged; a second chat must have no deck effects.
  await complete({
    sessionId: 'deck',
    presentation: true,
    input:
      'Create exactly TWO slides about recycling for adults. Titles: Why recycle; Next actions. General knowledge only, no images, no numeric claims. You have all necessary details. Propose the complete outline now, do not build slides until I confirm.',
  })
  const proposed = await outline('deck')
  assert.equal(proposed.confirmedId, null)
  assert.equal(proposed.proposals.length, 1)
  assert.equal(proposed.proposals[0].slides.length, 2)
  assert.equal((await decks.snapshot('deck')).slides.length, 0)
  evidence.tests.outlineBeforeConfirmation = 'PASS'
  const proposal = proposed.proposals[0]
  await complete({
    sessionId: 'deck',
    input: 'Confirm this complete outline and build both slides now.',
    outlineAction: { type: 'confirm', outlineId: proposal.outlineId, version: proposal.version },
  })
  const generated = await decks.snapshot('deck')
  assert.deepEqual(
    generated.slides.map(s => s.status),
    ['published', 'published'],
  )
  const first = await decks.content('deck', generated.slides[0].slideId, generated.slides[0].revision)
  const second = await decks.content('deck', generated.slides[1].slideId, generated.slides[1].revision)
  evidence.tests.twoPublishedSlides = 'PASS'
  await complete({
    sessionId: 'deck',
    input: 'Chỉ sửa slide 2: hiển thị dòng chữ POC_EDIT_TWO.',
  })
  const edited = await decks.snapshot('deck')
  assert.equal(edited.slides[0].revision, generated.slides[0].revision)
  assert.deepEqual(await decks.content('deck', edited.slides[0].slideId, edited.slides[0].revision), first)
  assert.ok(edited.slides[1].revision > generated.slides[1].revision)
  assert.match((await decks.content('deck', edited.slides[1].slideId, edited.slides[1].revision)).html, /POC_EDIT_TWO/)
  assert.ok(second.html.length)
  evidence.tests.onlySlideTwoChanged = 'PASS'
  const other = await complete({
    sessionId: 'other',
    presentation: true,
    input:
      'Propose exactly two slides about astronomy, titled Stars and Planets. All details are supplied. Do not build slides.',
  })
  assert.equal(other.sessionId, 'other')
  assert.equal((await decks.snapshot('other')).slides.length, 0)
  assert.deepEqual(await decks.snapshot('deck'), edited)
  assert.equal(
    (await client.history('other')).some(m => m.content.includes('POC_EDIT_TWO')),
    false,
  )
  evidence.tests.sessionIsolation = 'PASS'
  const stopped = await client.send({ sessionId: 'deck', input: 'Edit slide 2 only. Make its background pale blue.' })
  await client.stop(stopped.requestId)
  let terminal
  for await (const snapshot of client.watch(stopped.requestId)) terminal = snapshot
  assert.equal(terminal.status, 'cancelled')
  await new Promise(done => setTimeout(done, 2000))
  assert.deepEqual(await decks.snapshot('deck'), edited)
  evidence.tests.hostStopNoLateRevision = 'PASS'
  const savedHistory = await client.history('deck')
  await app.close()
  app = await startLocalWeb(options)
  client = new HostClient(app.origin, app.token)
  decks = new DeckClient(app.origin, app.token)
  assert.deepEqual(await decks.snapshot('deck'), edited)
  assert.deepEqual(await client.history('deck'), savedHistory)
  assert.equal((await outline('deck')).confirmedId, proposal.outlineId)
  evidence.tests.persistence = 'PASS'
  // Generated artifacts are retained for inspection, exclusively in the test-owned root.
  const files = await readdir(root, { recursive: true })
  const nativeSessions = new Set()
  for (const file of files.filter(name => name.endsWith('execution.json'))) {
    const execution = JSON.parse(await readFile(join(root, file), 'utf8'))
    assert.ok(['deck', 'other'].includes(execution.sessionId))
    if (execution.steps > 0) assert.equal(typeof execution.nativeSessionId, 'string')
    if (execution.nativeSessionId) {
      assert.equal(
        nativeSessions.has(execution.nativeSessionId),
        false,
        'Native session must not be reused across sends',
      )
      nativeSessions.add(execution.nativeSessionId)
    }
  }
  assert.ok(nativeSessions.size >= 4)
  evidence.tests.executionSessionMapping = 'PASS'
  evidence.tests.activityHistoryAssociation = 'PASS'
})
