import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { errorCode, isContextOverflow, parseEvent } from '../apps/local-web/lib/types/opencode/events.js'
import { encodeConfiguration, isolatedEnvironment, pinnedVersion, runtimeConfiguration, safeConfiguration } from '../apps/local-web/lib/types/opencode/config.js'
import { seedPrompt } from '../apps/local-web/lib/types/opencode/history.js'
import { UnsupportedProviderError, providerConfiguration } from '../apps/local-web/lib/types/opencode/provider.js'
import { runProcess } from '../apps/local-web/lib/types/opencode/process.js'

const settings = { provider: 'fixture', protocol: 'chat-completions', baseUrl: 'http://127.0.0.1:9/v1/', model: 'model-a', key: 'sk-test-SECRET-1' }

test('image input refusal becomes an actionable safe code without retaining provider error text', () => {
  const event = parseEvent({ type: 'error', error: { name: 'APIError', data: { statusCode: 400, message: 'This model does not support image input; private-provider-marker' } } })
  assert.equal(errorCode(event), 'IMAGE_INPUT_UNAVAILABLE')
  assert.equal(JSON.stringify(event).includes('private-provider-marker'), false)
})

test('OpenCode events: known shapes are read, everything else is ignored, provider text is never copied', () => {
  assert.deepEqual(parseEvent({ type: 'step_start', sessionID: 'ses_1', part: {} }), { type: 'step_start', sessionId: 'ses_1' })
  assert.deepEqual(parseEvent({ type: 'text', sessionID: 'ses_1', part: { id: 'prt_1', text: 'Hi' } }),
    { type: 'text', sessionId: 'ses_1', partId: 'prt_1', text: 'Hi' })
  assert.deepEqual(parseEvent({ type: 'step_finish', part: { reason: 'stop' } }), { type: 'step_finish', reason: 'stop' })
  // 1.19.5 parts name their native message: assistant steps and user parts are told apart by it.
  assert.deepEqual(parseEvent({ type: 'text', sessionID: 'ses_1', part: { id: 'prt_2', messageID: 'msg_1', text: 'Hi' } }),
    { type: 'text', sessionId: 'ses_1', messageId: 'msg_1', partId: 'prt_2', text: 'Hi' })
  assert.deepEqual(parseEvent({ type: 'step_start', part: { messageID: '../bad' } }), { type: 'step_start' })
  const overflow = parseEvent({ type: 'error', error: { name: 'ContextOverflowError', data: { message: 'prompt is too long' } } })
  assert.equal(isContextOverflow(overflow), true)
  assert.equal(isContextOverflow(parseEvent({ type: 'error', error: { name: 'APIError', data: { statusCode: 500 } } })), false)
  assert.deepEqual(parseEvent({ type: 'tool_use', part: { callID: 'c1', tool: 'bash', state: { status: 'error' } } }),
    { type: 'tool', callId: 'c1', tool: 'bash', status: 'failed' })
  const error = parseEvent({ type: 'error', error: { name: 'APIError', data: { message: 'bad key sk-test-SECRET-1', statusCode: 401 } } })
  assert.deepEqual(error, { type: 'error', name: 'APIError', statusCode: 401 })
  assert.equal(JSON.stringify(error).includes('SECRET'), false)
  assert.equal(errorCode(error), 'PROVIDER_AUTH')
  assert.equal(errorCode({ type: 'error', statusCode: 429 }), 'PROVIDER_RATE_LIMIT')
  assert.equal(errorCode({ type: 'error', name: 'ContextOverflowError' }), 'CONTEXT_LIMIT')
  assert.equal(errorCode({ type: 'error', statusCode: 500 }), 'PROVIDER_HTTP')
  assert.equal(errorCode({ type: 'error' }), 'RUNTIME_FAILED')
  assert.deepEqual(parseEvent({ type: 'something_new', sessionID: '../bad id' }), { type: 'other' }, 'An unusable session ID is dropped')
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
  assert.equal(JSON.parse(encodeConfiguration(runtimeConfiguration({ ...settings, model: 'plain-model' }))).provider.deckagent.models.selected.id, 'plain-model')
  const noKey = runtimeConfiguration({ ...settings, key: undefined })
  assert.equal(noKey.provider.deckagent.options.apiKey, undefined)
  assert.throws(() => providerConfiguration({ ...settings, protocol: 'gemini', key: undefined }), UnsupportedProviderError)
  assert.throws(() => providerConfiguration({ ...settings, protocol: 'other' }), UnsupportedProviderError)
  for (const [protocol, npm] of [['responses', '@ai-sdk/openai'], ['anthropic-messages', '@ai-sdk/anthropic'], ['gemini', '@ai-sdk/google']])
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
  assert.equal(safeConfiguration({ ...resolved, agent: { ...resolved.agent, build: { permission: { '*': 'allow' } } } }, expected), false)
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

test('context seeding quotes only user and assistant text, in order, and drops no message', () => {
  const history = [
    { role: 'user', content: 'first question' },
    { role: 'assistant', content: 'first answer' },
    { role: 'tool', content: 'tool output', toolCallId: 't', name: 'read', isError: false },
    { role: 'user', content: 'second question' },
    { role: 'assistant', content: 'half', interrupted: true },
  ]
  assert.equal(seedPrompt([], 'new'), 'new')
  const prompt = seedPrompt(history, 'new request')
  assert.ok(prompt.endsWith("The user's new request:\nnew request"))
  assert.equal(prompt.includes('tool output'), false, 'Tool records are never replayed')
  assert.ok(prompt.includes('"unfinished":true'))
  // FR-079: no message is dropped without the user being told; a seed that does not fit goes through the summary.
  const long = Array.from({ length: 400 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: `message ${index} ${'x'.repeat(1000)}` }))
  const whole = seedPrompt(long, 'x')
  assert.ok(whole.includes('message 0 ') && whole.includes('message 399 '))
  assert.equal(whole.includes('not included'), false)
})

test('process runner: no shell, ordered JSON lines across chunks, malformed output and abort', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-process-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const script = join(dir, 'child.mjs')
  await writeFile(script, `
    const mode = process.argv[2]
    let input = ''
    for await (const chunk of process.stdin) input += chunk
    if (mode === 'lines') { process.stdout.write('{"n":1}\\n{"n":'); setTimeout(() => process.stdout.write('2}\\n{"n":3}'), 50) }
    if (mode === 'echo') process.stdout.write(JSON.stringify({ input, arg: process.argv[3] }) + '\\n')
    if (mode === 'bad') process.stdout.write('nope\\n')
    if (mode === 'hang') setInterval(() => {}, 1000)
  `)
  const run = (args, extra = {}) => {
    const values = []
    return runProcess(process.execPath, [script, ...args], { cwd: dir, env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot },
      signal: extra.signal ?? new AbortController().signal, input: extra.input, onLine: value => values.push(value) }).then(result => ({ result, values }))
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
  const missing = await runProcess(join(dir, 'missing.exe'), [], { cwd: dir, env: {}, signal: new AbortController().signal })
  assert.equal(missing.startFailed, true)
})
