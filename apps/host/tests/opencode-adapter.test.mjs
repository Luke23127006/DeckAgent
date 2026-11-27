import { createConversationContribution } from '../lib/types/modules/chats/index.js'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  classifyProviderError,
  errorCode,
  isContextOverflow,
  parseEvent,
} from '../lib/types/runtimes/opencode/events.js'
import {
  encodeConfiguration,
  isolatedEnvironment,
  pinnedVersion,
  runtimeConfiguration,
  safeConfiguration,
} from '../lib/types/runtimes/opencode/config.js'
import { seedConversationPrompt } from '../lib/types/runtimes/opencode/history.js'
import { OpenCodeAgentRuntime } from '../lib/types/runtimes/opencode/index.js'
import { UnsupportedProviderError, providerConfiguration } from '../lib/types/runtimes/opencode/provider.js'
import { runProcess } from '../lib/types/runtimes/opencode/process.js'
import { createStreamTracker } from '../lib/types/runtimes/opencode/stream-tracker.js'
import { waitFor } from './fixtures/wait-for.mjs'

const settings = {
  provider: 'fixture',
  protocol: 'chat-completions',
  baseUrl: 'http://127.0.0.1:9/v1/',
  model: 'model-a',
  key: 'sk-test-SECRET-1',
}

test('image input refusal becomes an actionable safe code without retaining provider error text', () => {
  const event = parseEvent({
    type: 'error',
    error: {
      name: 'APIError',
      data: { statusCode: 400, message: 'This model does not support image input; private-provider-marker' },
    },
  })
  assert.equal(errorCode(event), 'IMAGE_INPUT_UNAVAILABLE')
  assert.equal(JSON.stringify(event).includes('private-provider-marker'), false)
})

test('OpenCode events: known shapes are read, everything else is ignored, provider text is never copied', () => {
  assert.deepEqual(parseEvent({ type: 'step_start', sessionID: 'ses_1', part: {} }), {
    type: 'step_start',
    sessionId: 'ses_1',
  })
  assert.deepEqual(parseEvent({ type: 'text', sessionID: 'ses_1', part: { id: 'prt_1', text: 'Hi' } }), {
    type: 'text',
    sessionId: 'ses_1',
    partId: 'prt_1',
    text: 'Hi',
  })
  assert.deepEqual(parseEvent({ type: 'step_finish', part: { reason: 'stop' } }), {
    type: 'step_finish',
    reason: 'stop',
  })
  // 1.19.5 parts name their native message: assistant steps and user parts are told apart by it.
  assert.deepEqual(
    parseEvent({ type: 'text', sessionID: 'ses_1', part: { id: 'prt_2', messageID: 'msg_1', text: 'Hi' } }),
    { type: 'text', sessionId: 'ses_1', messageId: 'msg_1', partId: 'prt_2', text: 'Hi' },
  )
  assert.deepEqual(parseEvent({ type: 'step_start', part: { messageID: '../bad' } }), { type: 'step_start' })
  const overflow = parseEvent({
    type: 'error',
    error: { name: 'ContextOverflowError', data: { message: 'prompt is too long' } },
  })
  assert.equal(isContextOverflow(overflow), true)
  assert.equal(
    isContextOverflow(parseEvent({ type: 'error', error: { name: 'APIError', data: { statusCode: 500 } } })),
    false,
  )
  assert.deepEqual(parseEvent({ type: 'tool_use', part: { callID: 'c1', tool: 'bash', state: { status: 'error' } } }), {
    type: 'tool',
    callId: 'c1',
    tool: 'bash',
    status: 'failed',
  })
  const error = parseEvent({
    type: 'error',
    error: { name: 'APIError', data: { message: 'bad key sk-test-SECRET-1', statusCode: 401 } },
  })
  assert.deepEqual(error, { type: 'error', name: 'APIError', statusCode: 401 })
  assert.equal(JSON.stringify(error).includes('SECRET'), false)
  assert.equal(errorCode(error), 'PROVIDER_AUTH')
  assert.equal(errorCode({ type: 'error', statusCode: 429 }), 'PROVIDER_RATE_LIMIT')
  assert.equal(errorCode({ type: 'error', name: 'ContextOverflowError' }), 'CONTEXT_LIMIT')
  assert.equal(errorCode({ type: 'error', statusCode: 500 }), 'PROVIDER_HTTP')
  assert.equal(errorCode({ type: 'error' }), 'RUNTIME_FAILED')
  assert.deepEqual(
    parseEvent({ type: 'something_new', sessionID: '../bad id' }),
    { type: 'other' },
    'An unusable session ID is dropped',
  )
  assert.equal(parseEvent([1, 2]), undefined)
  assert.equal(parseEvent({ notype: true }), undefined)
})

test('run configuration: one provider, every native tool denied, the key only as an environment reference', () => {
  const config = runtimeConfiguration(settings)
  assert.deepEqual(config.permission, { '*': 'deny' })
  assert.deepEqual(config.agent.deckagent.permission, { '*': 'deny' })
  assert.deepEqual(config.plugin, [])
  assert.equal(config.mcp, undefined)
  assert.deepEqual(config.enabled_providers, ['deckagent'])
  // FR-079: summary on provider-reported overflow; the whole earlier conversation is summarized (exact boundary).
  assert.deepEqual(config.compaction, { auto: true, prune: false, tail_turns: 0 })
  assert.equal(config.provider.deckagent.models.selected.limit.context, 0)
  assert.equal(config.provider.deckagent.npm, '@ai-sdk/openai-compatible')
  assert.equal(config.provider.deckagent.options.baseURL, 'http://127.0.0.1:9/v1')
  const text = encodeConfiguration(config)
  assert.equal(text.includes(settings.key), false, 'No literal key in the configuration')
  assert.ok(text.includes('"apiKey":"{env:DECKAGENT_PROVIDER_KEY}"'))
  // A user-given value can never become a reference the CLI would substitute.
  const hostile = encodeConfiguration(runtimeConfiguration({ ...settings, model: '{env:PATH}' }))
  assert.equal(hostile.includes('"{env:PATH}"'), false)
  assert.equal(JSON.parse(hostile).provider.deckagent.models.selected.id, '{env:PATH}')
  const placeholder = config.provider.deckagent.options.apiKey
  assert.match(placeholder, /^__DECKAGENT_KEY_[0-9a-f]{32}__$/)
  assert.equal(
    JSON.parse(encodeConfiguration(runtimeConfiguration({ ...settings, model: 'plain-model' }))).provider.deckagent
      .models.selected.id,
    'plain-model',
  )
  const noKey = runtimeConfiguration({ ...settings, key: undefined })
  assert.equal(noKey.provider.deckagent.options.apiKey, undefined)
  assert.throws(
    () => providerConfiguration({ ...settings, protocol: 'gemini', key: undefined }),
    UnsupportedProviderError,
  )
  assert.throws(() => providerConfiguration({ ...settings, protocol: 'other' }), UnsupportedProviderError)
  for (const [protocol, npm] of [
    ['responses', '@ai-sdk/openai'],
    ['anthropic-messages', '@ai-sdk/anthropic'],
    ['gemini', '@ai-sdk/google'],
  ])
    assert.equal(providerConfiguration({ ...settings, protocol }).deckagent.npm, npm)
  assert.equal(pinnedVersion, '1.19.5')
})

test('effective configuration audit refuses tools, plugins, MCP servers and other providers', () => {
  const expected = runtimeConfiguration(settings)
  const resolved = JSON.parse(encodeConfiguration(expected).replace('{env:DECKAGENT_PROVIDER_KEY}', settings.key))
  assert.equal(safeConfiguration(resolved, expected), true)
  assert.equal(safeConfiguration({ ...resolved, permission: { '*': 'allow' } }, expected), false)
  assert.equal(safeConfiguration({ ...resolved, plugin: ['x'] }, expected), false)
  assert.equal(safeConfiguration({ ...resolved, mcp: { other: { type: 'local' } } }, expected), false)
  assert.equal(safeConfiguration({ ...resolved, provider: { ...resolved.provider, openai: {} } }, expected), false)
  assert.equal(
    safeConfiguration({ ...resolved, agent: { ...resolved.agent, build: { permission: { '*': 'allow' } } } }, expected),
    false,
  )
  assert.equal(safeConfiguration(undefined, expected), false)
})

test('isolated environment: no inherited keys or settings; the key only in this run', () => {
  const previous = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = 'sk-inherited'
  try {
    const folders = { home: 'h', config: 'c', cache: 'k', data: 'd', state: 's', work: 'w' }
    const env = isolatedEnvironment(folders, '{}', settings.key)
    assert.equal(env.OPENAI_API_KEY, undefined)
    assert.equal(env.DECKAGENT_PROVIDER_KEY, settings.key)
    assert.equal(env.XDG_DATA_HOME, 'd')
    assert.equal(env.OPENCODE_DISABLE_PROJECT_CONFIG, 'true')
    assert.equal(isolatedEnvironment(folders, '{}', undefined).DECKAGENT_PROVIDER_KEY, undefined)
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = previous
  }
})

test('conversation contribution and seeding quote user and assistant text in order without dropping messages', async () => {
  const history = [
    { role: 'user', content: 'first question' },
    { role: 'assistant', content: 'first answer' },
    { role: 'tool', content: 'tool output', toolCallId: 't', name: 'read', isError: false },
    { role: 'user', content: 'second question' },
    { role: 'assistant', content: 'half', interrupted: true },
  ]
  assert.equal(seedConversationPrompt([], 'new'), 'new')
  const parts = await createConversationContribution(async () => history).contribute({
    owner: { kind: 'chat', id: 'chat' },
    requestId: 'request',
    signal: new AbortController().signal,
    grants: { publicResearch: false, sourceKinds: [] },
  })
  const prompt = seedConversationPrompt(parts.resources[0].messages, 'new request')
  assert.ok(prompt.endsWith("The user's new request:\nnew request"))
  assert.equal(prompt.includes('tool output'), false, 'Tool records are never replayed')
  assert.ok(prompt.includes('"unfinished":true'))
  // FR-079: no message is dropped without the user being told; a seed that does not fit goes through the summary.
  const long = Array.from({ length: 400 }, (_, index) => ({
    role: index % 2 ? 'assistant' : 'user',
    content: `message ${index} ${'x'.repeat(1000)}`,
  }))
  const whole = seedConversationPrompt(long, 'x')
  assert.ok(whole.includes('message 0 ') && whole.includes('message 399 '))
  assert.equal(whole.includes('not included'), false)
})

test('process runner: no shell, ordered JSON lines across chunks, malformed output and abort', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-process-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const script = join(dir, 'child.mjs')
  await writeFile(
    script,
    `
    const mode = process.argv[2]
    let input = ''
    for await (const chunk of process.stdin) input += chunk
    if (mode === 'lines') { process.stdout.write('{"n":1}\\n{"n":'); setTimeout(() => process.stdout.write('2}\\n{"n":3}'), 50) }
    if (mode === 'echo') process.stdout.write(JSON.stringify({ input, arg: process.argv[3] }) + '\\n')
    if (mode === 'bad') process.stdout.write('nope\\n')
    if (mode === 'hang') setInterval(() => {}, 1000)
  `,
  )
  const run = (args, extra = {}) => {
    const values = []
    return runProcess(process.execPath, [script, ...args], {
      cwd: dir,
      env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot },
      signal: extra.signal ?? new AbortController().signal,
      input: extra.input,
      onLine: value => values.push(value),
    }).then(result => ({ result, values }))
  }
  const lines = await run(['lines'])
  assert.deepEqual(lines.values, [{ n: 1 }, { n: 2 }, { n: 3 }])
  assert.equal(lines.result.code, 0)
  // Arguments are passed as they are: shell metacharacters are not interpreted.
  const echo = await run(['echo', '& echo injected | x'], { input: 'prompt via stdin' })
  assert.deepEqual(echo.values, [{ input: 'prompt via stdin', arg: '& echo injected | x' }])
  assert.equal((await run(['bad'])).result.malformed, true)
  const control = new AbortController()
  const started = Date.now()
  const hung = run(['hang'], { signal: control.signal })
  setTimeout(() => control.abort(), 200)
  const ended = await hung
  assert.equal(ended.result.killed, true)
  assert.ok(Date.now() - started < 5000)
  const missing = await runProcess(join(dir, 'missing.exe'), [], {
    cwd: dir,
    env: {},
    signal: new AbortController().signal,
  })
  assert.equal(missing.startFailed, true)
})

const fakeCli = fileURLToPath(new URL('./fixtures/fake-opencode.mjs', import.meta.url))

function memoryBindings() {
  const bound = new Map()
  const completed = new Map()
  return {
    binding: ownerKey => bound.get(ownerKey),
    bind(binding) {
      bound.set(binding.ownerKey, binding)
      completed.set(binding.ownerKey, binding.lastRequestId)
    },
    unbind(ownerKey) {
      bound.delete(ownerKey)
    },
    lastCompletedRequestId(ownerKey, currentRequestId) {
      const requestId = completed.get(ownerKey)
      return requestId === currentRequestId ? undefined : requestId
    },
  }
}

function runInput(overrides = {}) {
  return {
    owner: { kind: 'chat', id: 'chat-1' },
    requestId: 'request-1',
    provider: settings,
    instructions: [],
    resources: [],
    stepLimit: 4,
    signal: new AbortController().signal,
    onApprovalWait: () => () => {},
    ...overrides,
  }
}

function request(text) {
  return [{ kind: 'conversation', messages: [{ role: 'user', content: text }] }]
}

function agentRuntime({ root, bindings = memoryBindings(), version = 'fake-1.0.0', timeoutMs = 30_000 }) {
  const log = join(root, 'fake-opencode.log')
  return {
    bindings,
    log,
    runtime: new OpenCodeAgentRuntime(process.execPath, root, bindings, {
      version,
      timeoutMs,
      launcherArgs: [fakeCli, log],
    }),
  }
}

async function loggedRuns(log) {
  const lines = (await readFile(log, 'utf8')).split('\n').filter(Boolean)
  return lines.map(line => JSON.parse(line)).filter(entry => entry.command === 'run')
}

function ended(code) {
  return { startFailed: false, code, malformed: false, killed: false, stdout: '' }
}

test('step_finish token counts: non-negative finite values are kept, anything else is dropped', () => {
  assert.deepEqual(parseEvent({ type: 'step_finish', part: { reason: 'stop', tokens: { input: 10, output: 5 } } }), {
    type: 'step_finish',
    reason: 'stop',
    tokens: { input: 10, output: 5 },
  })
  assert.deepEqual(parseEvent({ type: 'step_finish', part: { tokens: { input: 0 } } }), {
    type: 'step_finish',
    tokens: { input: 0 },
  })
  assert.deepEqual(parseEvent({ type: 'step_finish', part: { tokens: { output: 0 } } }), {
    type: 'step_finish',
    tokens: { output: 0 },
  })
  assert.deepEqual(parseEvent({ type: 'step_finish', part: { tokens: { input: -1, output: '5' } } }), {
    type: 'step_finish',
  })
  assert.deepEqual(parseEvent({ type: 'step_finish', part: { tokens: { input: 'lots', output: 1 } } }), {
    type: 'step_finish',
    tokens: { output: 1 },
  })
  assert.deepEqual(parseEvent({ type: 'step_finish', part: { tokens: { input: null } } }), { type: 'step_finish' })
  assert.deepEqual(parseEvent({ type: 'step_finish', part: { reason: 'stop' } }), {
    type: 'step_finish',
    reason: 'stop',
  })
})

test('provider errors map to the RunError category table', () => {
  assert.deepEqual(classifyProviderError({ type: 'error', statusCode: 401 }), {
    category: 'provider-auth',
    code: 'PROVIDER_AUTH',
  })
  assert.deepEqual(classifyProviderError({ type: 'error', statusCode: 403 }), {
    category: 'provider-auth',
    code: 'PROVIDER_AUTH',
  })
  assert.deepEqual(classifyProviderError({ type: 'error', name: 'ProviderAuthError' }), {
    category: 'provider-auth',
    code: 'PROVIDER_AUTH',
  })
  assert.deepEqual(classifyProviderError({ type: 'error', statusCode: 429 }), {
    category: 'provider-rate-limit',
    code: 'PROVIDER_RATE_LIMIT',
  })
  assert.deepEqual(classifyProviderError({ type: 'error', statusCode: 404 }), {
    category: 'provider-model',
    code: 'PROVIDER_MODEL_UNAVAILABLE',
  })
  assert.deepEqual(classifyProviderError({ type: 'error', statusCode: 500 }), {
    category: 'provider-other',
    code: 'PROVIDER_HTTP',
  })
  assert.deepEqual(classifyProviderError({ type: 'error' }), {
    category: 'provider-other',
    code: 'RUNTIME_FAILED',
  })
  assert.deepEqual(classifyProviderError({ type: 'error', name: 'ContextOverflowError' }), {
    category: 'context-limit',
    code: 'CONTEXT_LIMIT',
  })
  assert.deepEqual(classifyProviderError({ type: 'error', imageUnsupported: true }), {
    category: 'input-unsupported',
    code: 'IMAGE_INPUT_UNAVAILABLE',
  })
  assert.equal(errorCode({ type: 'error', statusCode: 429 }), 'PROVIDER_RATE_LIMIT')
})

test('run configuration applies the run step limit', () => {
  assert.equal(runtimeConfiguration(settings, undefined, undefined, 4).agent.deckagent.steps, 4)
  assert.equal('steps' in runtimeConfiguration(settings, undefined, undefined, 'none').agent.deckagent, false)
  assert.equal(runtimeConfiguration(settings).agent.deckagent.steps, 8)
  const published = runtimeConfiguration(
    settings,
    { url: 'http://127.0.0.1:1/mcp', names: ['publish_slide'] },
    undefined,
    'none',
  )
  assert.equal('steps' in published.agent.deckagent, false)
  assert.equal(
    runtimeConfiguration(settings, { url: 'http://127.0.0.1:1/mcp', names: ['publish_slide'] }).agent.deckagent.steps,
    8,
  )
  assert.equal(
    runtimeConfiguration(settings, { url: 'http://127.0.0.1:1/mcp', names: ['publish_slide'] }, undefined, 2).agent
      .deckagent.steps,
    2,
  )
})

test('stream tracker reports cumulative model calls and tokens after each finished step', () => {
  const usage = []
  const tracker = createStreamTracker(
    { emit: async () => {} },
    () => {},
    total => usage.push(total),
  )
  tracker.onLine({ type: 'step_start', sessionID: 'ses_1', part: { messageID: 'msg_1' } })
  tracker.onLine({
    type: 'step_finish',
    sessionID: 'ses_1',
    part: { messageID: 'msg_1', reason: 'stop', tokens: { input: 4, output: 2 } },
  })
  tracker.onLine({ type: 'step_start', sessionID: 'ses_1', part: { messageID: 'msg_2' } })
  tracker.onLine({
    type: 'step_finish',
    sessionID: 'ses_1',
    part: { messageID: 'msg_2', reason: 'stop', tokens: { input: 3 } },
  })
  assert.deepEqual(usage, [
    { modelCalls: 1, inputTokens: 4, outputTokens: 2 },
    { modelCalls: 2, inputTokens: 7, outputTokens: 2 },
  ])
  assert.deepEqual(tracker.classify(ended(0), false, false, false).runResult, {
    status: 'completed',
    usage: { modelCalls: 2, inputTokens: 7, outputTokens: 2 },
  })
})

test('stream tracker classifies a blocked summary, an unfinished summary and a refused write', async () => {
  const blockedControl = new AbortController()
  const blocked = createStreamTracker({ emit: async () => {} }, () => blockedControl.abort())
  blocked.onLine({ type: 'step_start', sessionID: 'ses_1', part: { messageID: 'msg_1' } })
  blocked.onLine({ type: 'error', sessionID: 'ses_1', error: { name: 'ContextOverflowError' } })
  blocked.onLine({ type: 'step_start', sessionID: 'ses_1', part: { messageID: 'msg_summary' } })
  blocked.onLine({
    type: 'step_finish',
    sessionID: 'ses_1',
    part: { messageID: 'msg_summary', reason: 'content-filter' },
  })
  await blocked.finalize(false, false)
  const blockedAttempt = blocked.classify(ended(0), false, false, blockedControl.signal.aborted)
  assert.deepEqual(blockedAttempt.runResult, {
    status: 'failed',
    usage: { modelCalls: 1 },
    error: { category: 'content-blocked', code: 'CONTEXT_SUMMARY_FAILED' },
  })

  const unfinished = createStreamTracker({ emit: async () => {} }, () => {})
  unfinished.onLine({ type: 'step_start', sessionID: 'ses_1', part: { messageID: 'msg_1' } })
  unfinished.onLine({ type: 'error', sessionID: 'ses_1', error: { name: 'ContextOverflowError' } })
  unfinished.onLine({ type: 'step_start', sessionID: 'ses_1', part: { messageID: 'msg_summary' } })
  await unfinished.finalize(false, false)
  assert.deepEqual(unfinished.classify(ended(0), false, false, false).runResult.error, {
    category: 'context-limit',
    code: 'CONTEXT_SUMMARY_FAILED',
  })

  const refusedControl = new AbortController()
  const refused = createStreamTracker(
    {
      emit: async () => {
        throw new Error('closed')
      },
    },
    () => refusedControl.abort(),
  )
  refused.onLine({ type: 'step_start', sessionID: 'ses_1', part: { messageID: 'msg_1' } })
  await refused.finalize(false, false)
  assert.deepEqual(refused.classify(ended(0), false, false, refusedControl.signal.aborted).runResult, {
    status: 'failed',
    usage: { modelCalls: 1 },
    error: { category: 'stopped', code: 'REQUEST_NOT_SAVED' },
  })
})

test('agent runtime availability reports a missing or unsupported CLI', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-agent-runtime-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const root = join(dir, 'runtime')
  const missing = new OpenCodeAgentRuntime(undefined, root, memoryBindings())
  assert.deepEqual(await missing.availability(), { available: false, code: 'RUNTIME_UNAVAILABLE' })
  assert.deepEqual(await agentRuntime({ root }).runtime.availability(), { available: true })
  assert.deepEqual(await agentRuntime({ root, version: '9.9.9' }).runtime.availability(), {
    available: false,
    code: 'RUNTIME_VERSION_UNSUPPORTED',
    detail: { version: '9.9.9' },
  })
})

test('agent runtime streams a run, reports usage and binds the owner', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-agent-runtime-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const root = join(dir, 'runtime')
  const { runtime, log, bindings } = agentRuntime({ root })
  const events = []
  const usage = []
  const sink = {
    emit: async event => {
      events.push(event)
    },
    usage: total => {
      usage.push(total)
    },
  }
  const conversation = {
    kind: 'conversation',
    messages: [
      { role: 'user', content: 'earlier question' },
      { role: 'user', content: 'draw a deck' },
    ],
  }

  const result = await runtime.run(runInput({ resources: [conversation] }), sink)

  assert.equal(result.status, 'completed')
  assert.deepEqual(result.usage, { modelCalls: 1, inputTokens: 10, outputTokens: 5 })
  assert.deepEqual(usage.at(-1), { modelCalls: 1, inputTokens: 10, outputTokens: 5 })
  assert.ok(events.some(event => event.kind === 'activity' && event.type === 'model'))
  assert.ok(events.some(event => event.kind === 'text' && event.text === 'Echo 1: draw a deck'))
  const [first] = await loggedRuns(log)
  assert.ok(first.args.includes('deckagent'))
  assert.ok(first.args.includes('json'))
  assert.ok(first.prompt.includes('earlier question'))
  assert.ok(first.prompt.endsWith("The user's new request:\ndraw a deck"))
  assert.deepEqual(await readdir(join(root, 'chats')).catch(() => []), [
    createHash('sha256').update('chat:chat-1').digest('hex').slice(0, 32),
  ])
  assert.equal(bindings.binding('chat:chat-1'), undefined)

  result.commit()

  const binding = bindings.binding('chat:chat-1')
  assert.match(binding.nativeSessionId, /^ses_/)
  assert.deepEqual(binding.selection, { provider: 'fixture', model: 'model-a' })
  assert.equal(binding.lastRequestId, 'request-1')
  assert.ok(
    binding.context.startsWith(
      join(root, 'chats', createHash('sha256').update('chat:chat-1').digest('hex').slice(0, 32), 'work'),
    ),
  )
  assert.match(binding.context, /[a-f0-9]{64}$/)

  const resumed = await runtime.run(runInput({ requestId: 'request-2', resources: request('follow up') }), sink)
  assert.equal(resumed.status, 'completed')
  const next = (await loggedRuns(log)).at(-1)
  assert.equal(next.resume, binding.nativeSessionId)
  assert.equal(next.prompt, 'follow up')
  assert.ok(events.some(event => event.kind === 'text' && event.text === 'Echo 2: follow up'))
})

test('agent runtime returns a categorized failure for each runtime and provider condition', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-agent-runtime-failures-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const cases = [
    {
      name: 'missing executable',
      runtime: { executable: undefined },
      input: {},
      usage: { modelCalls: 0 },
      error: { category: 'runtime-unavailable', code: 'RUNTIME_UNAVAILABLE' },
    },
    {
      name: 'unsupported provider settings',
      input: { provider: { ...settings, protocol: 'other' } },
      usage: { modelCalls: 0 },
      error: { category: 'runtime-config', code: 'PROVIDER_UNSUPPORTED' },
    },
    {
      name: 'unsafe effective configuration',
      mode: { unsafe: true },
      input: {},
      usage: { modelCalls: 0 },
      error: { category: 'runtime-config', code: 'RUNTIME_CONFIG_UNSAFE' },
    },
    {
      name: 'process exit code',
      input: { resources: request('fail [crash]') },
      usage: { modelCalls: 0 },
      error: { category: 'runtime-failed', code: 'RUNTIME_FAILED' },
    },
    {
      name: 'malformed output',
      input: { resources: request('fail [malformed]') },
      usage: { modelCalls: 0 },
      error: { category: 'runtime-protocol', code: 'RUNTIME_PROTOCOL' },
    },
    {
      name: 'unfinished run',
      input: { resources: request('fail [incomplete]') },
      usage: { modelCalls: 1 },
      error: { category: 'runtime-incomplete', code: 'RUNTIME_INCOMPLETE' },
    },
    {
      name: 'rejected key',
      input: { resources: request('fail [auth]') },
      usage: { modelCalls: 1 },
      error: { category: 'provider-auth', code: 'PROVIDER_AUTH' },
    },
    {
      name: 'context overflow during the summary',
      input: { resources: request('fail [overflow-fail]') },
      usage: { modelCalls: 1 },
      error: { category: 'context-limit', code: 'CONTEXT_SUMMARY_FAILED' },
    },
    {
      name: 'attempt clock expired',
      runtime: { timeoutMs: 300 },
      input: { resources: request('fail [hang]') },
      error: { category: 'timeout', code: 'REQUEST_TIMEOUT' },
    },
  ]
  let index = 0
  for (const item of cases) {
    const root = join(dir, String(index++))
    const executable = 'executable' in (item.runtime ?? {}) ? item.runtime.executable : process.execPath
    const log = join(root, 'fake-opencode.log')
    const runtime = new OpenCodeAgentRuntime(executable, root, memoryBindings(), {
      version: 'fake-1.0.0',
      timeoutMs: item.runtime?.timeoutMs ?? 30_000,
      launcherArgs: [fakeCli, log],
    })
    await mkdir(root, { recursive: true })
    if (item.mode) await writeFile(`${log}.mode.json`, JSON.stringify(item.mode))
    const result = await runtime.run(runInput(item.input), { emit: async () => {}, usage: () => {} })
    assert.equal(result.status, 'failed', item.name)
    assert.deepEqual(result.error, item.error, item.name)
    if (item.usage) assert.deepEqual(result.usage, item.usage, item.name)
  }
})

test('agent runtime ends a stopped run with the stopped category', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-agent-runtime-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const { runtime } = agentRuntime({ root: join(dir, 'runtime') })
  const control = new AbortController()
  const events = []
  const running = runtime.run(runInput({ resources: request('stop me [hang]'), signal: control.signal }), {
    emit: async event => {
      events.push(event)
    },
    usage: () => {},
  })
  await waitFor(() => events.some(event => event.kind === 'text'))
  control.abort()
  const result = await running
  assert.equal(result.status, 'failed')
  assert.deepEqual(result.error, { category: 'stopped', code: 'STOPPED' })
})
