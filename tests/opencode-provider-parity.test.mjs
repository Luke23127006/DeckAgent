import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { OpenCodeAgentHandle } from '../apps/local-web/lib/types/opencode/agent.js'
import { MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { providerConfiguration } from '../apps/local-web/lib/types/opencode/provider.js'
import { openWireFixture, replyWire } from './fixtures/opencode-wire.mjs'
import { encodeConfiguration } from '../apps/local-web/lib/types/opencode/config.js'

const executable = resolve(
  process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
    '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
)
const enabled = process.env.DECKAGENT_OPENCODE_CLI_TESTS === '1'

test('whole-turn deadline reports timeout rather than an unexplained runtime failure', {
  skip: !enabled,
  timeout: 30000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-deadline-'))
  let expire
  const original = globalThis.setTimeout
  t.mock.method(globalThis, 'setTimeout', (callback, delay, ...args) => {
    if (delay === 180000) expire = callback
    return original(callback, delay, ...args)
  })
  const fixture = await openWireFixture('chat-completions', () => {
    assert.equal(typeof expire, 'function')
    expire()
  })
  t.after(async () => {
    await fixture.close()
    await rm(root, { recursive: true, force: true })
  })
  const agent = await OpenCodeAgentHandle.open({
    root,
    executable,
    sessionId: 'deadline',
    sessions: new MemorySessionStore(),
    tools: new ToolRegistry(),
    allowed: [],
    maxSteps: 4,
    systemPrompt: 'Reply briefly.',
    provider: { protocol: 'chat-completions', baseUrl: fixture.baseUrl, model: 'exact', key: 'FIXTURE_KEY' },
  })
  t.after(() => agent.dispose())
  const result = await agent.send('Deadline test')
  assert.equal(result.status, 'failed')
  assert.equal(result.error.code, 'PROVIDER_TIMEOUT')
  assert.equal(result.steps, 0)
  assert.equal(result.text, '')
})

test('literal config encoding preserves data after JSON decoding without exposing interpolation tokens', () => {
  const data = {
    prompt: 'literal {file:outside.txt} and {env:KEY}; slash \\{env:OTHER}; quote "',
    model: '{env:MODEL}',
    apiKey: 'fixture{file:never-read}',
  }
  const text = encodeConfiguration(data)
  assert.deepEqual(JSON.parse(text), data)
  assert.equal(/\{(?:file|env):/.test(text), false)
})

test('config-shaped prompt data cannot read a file or interpolate a credential before tool permissions', {
  skip: !enabled,
  timeout: 30000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-config-data-'))
  const path = join(root, 'not-granted.txt')
  await writeFile(path, 'FILE_CANARY_MUST_NOT_ENTER_PROMPT')
  const fixture = await openWireFixture('chat-completions', (_body, res) =>
    replyWire(res, 'chat-completions', { text: 'Data test completed' }),
  )
  t.after(async () => {
    await fixture.close()
    await rm(root, { recursive: true, force: true })
  })
  const fileToken = `{file:${path.replaceAll('\\', '/')}}`
  const envToken = '{env:DECKAGENT_REQUEST_KEY}'
  const agent = await OpenCodeAgentHandle.open({
    root,
    executable,
    sessionId: 'data',
    sessions: new MemorySessionStore(),
    tools: new ToolRegistry(),
    allowed: [],
    maxSteps: 4,
    systemPrompt: `Quoted outline topic: ${fileToken}; quoted example: ${envToken}. Do not read these resources.`,
    provider: {
      protocol: 'chat-completions',
      baseUrl: fixture.baseUrl,
      model: 'exact-{env:DECKAGENT_REQUEST_KEY}',
      key: 'CREDENTIAL_CANARY_NOT_A_REAL_KEY',
    },
  })
  t.after(() => agent.dispose())
  assert.equal((await agent.send('Reply briefly')).status, 'completed')
  const body = JSON.stringify(fixture.requests.at(-1).body)
  assert.equal(body.includes('FILE_CANARY_MUST_NOT_ENTER_PROMPT'), false)
  assert.equal(body.includes('CREDENTIAL_CANARY_NOT_A_REAL_KEY'), false)
  assert.ok(body.includes(fileToken))
  assert.ok(body.includes(envToken))
  assert.equal(fixture.requests.at(-1).body.model, 'exact-{env:DECKAGENT_REQUEST_KEY}')
})

test('CLI provider timeout aborts the API request without accepting late output', {
  skip: !enabled,
  timeout: 30000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-timeout-'))
  let requestedAt
  const fixture = await openWireFixture('chat-completions', (_body, res) => {
    requestedAt = Date.now()
    const timer = setTimeout(() => {
      if (!res.destroyed) replyWire(res, 'chat-completions', { text: 'TOO_LATE' })
    }, 10000)
    timer.unref()
  })
  t.after(async () => {
    await fixture.close()
    await rm(root, { recursive: true, force: true })
  })
  const agent = await OpenCodeAgentHandle.open({
    root,
    executable,
    sessionId: 'timeout',
    sessions: new MemorySessionStore(),
    tools: new ToolRegistry(),
    allowed: [],
    maxSteps: 4,
    systemPrompt: 'Reply briefly.',
    provider: {
      protocol: 'chat-completions',
      baseUrl: fixture.baseUrl,
      model: 'exact',
      key: 'FIXTURE_KEY',
      timeoutMs: 100,
    },
  })
  t.after(() => agent.dispose())
  const result = await agent.send('Timeout test')
  assert.equal(result.status, 'failed')
  assert.ok(requestedAt)
  assert.ok(Date.now() - requestedAt < 5000, 'Configured API timeout must not wait for the delayed response')
  assert.equal(result.text.includes('TOO_LATE'), false)
})

test('provider errors and overflow preserve history without publishing raw response bodies', {
  skip: !enabled,
  timeout: 30000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-private-error-'))
  const fixture = await openWireFixture('chat-completions', (_body, res) =>
    res
      .writeHead(400, { 'content-type': 'application/json' })
      .end(JSON.stringify({ error: { code: 'context_length_exceeded', message: 'PRIVATE_PROVIDER_ERROR_MARKER' } })),
  )
  t.after(async () => {
    await fixture.close()
    await rm(root, { recursive: true, force: true })
  })
  const sessions = new MemorySessionStore()
  await sessions.open('overflow')
  const old = [
    { role: 'user', content: 'Earlier history stays' },
    { role: 'assistant', content: 'Earlier answer' },
  ]
  await sessions.append('overflow', old)
  const agent = await OpenCodeAgentHandle.open({
    root,
    executable,
    sessions,
    sessionId: 'overflow',
    tools: new ToolRegistry(),
    allowed: [],
    maxSteps: 4,
    systemPrompt: 'Reply briefly.',
    provider: { protocol: 'chat-completions', baseUrl: fixture.baseUrl, model: 'exact', key: 'FIXTURE_KEY' },
  })
  t.after(() => agent.dispose())
  const result = await agent.send('New oversized request')
  assert.equal(result.status, 'failed')
  const messages = await sessions.read('overflow')
  assert.deepEqual(messages.slice(0, old.length), old)
  assert.equal(messages.at(-1).content, 'New oversized request')
  assert.equal(JSON.stringify({ result, messages }).includes('PRIVATE_PROVIDER_ERROR_MARKER'), false)
})

for (const protocol of ['chat-completions', 'responses', 'anthropic-messages', 'gemini'])
  test(`pinned CLI ${protocol} MCP argument/error/result round trip (provider fixture)`, {
    skip: !enabled,
    timeout: 210000,
  }, async t => {
    const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-mcp-wire-'))
    const fixture = await openWireFixture(protocol, (body, res, index) => {
      if (index === 2) {
        assert.ok(JSON.stringify(body).includes('TOOL_FAILED'))
        assert.equal(JSON.stringify(body).includes('PRIVATE_FIXTURE_ERROR'), false)
      }
      if (index === 3) assert.ok(JSON.stringify(body).includes('RECOVERED_RESULT'))
      replyWire(
        res,
        protocol,
        index < 3
          ? { call: { name: 'deckagent_probe', arguments: { value: index === 1 ? 'fail' : 'recover' } } }
          : { text: 'WIRE_COMPLETE' },
      )
    })
    t.after(async () => {
      await fixture.close()
      await rm(root, { recursive: true, force: true })
    })
    const sessions = new MemorySessionStore(),
      tools = new ToolRegistry(),
      seen = []
    tools.register({
      name: 'probe',
      description: 'Fixture probe',
      parameters: {
        type: 'object',
        properties: { value: { type: 'string' } },
        required: ['value'],
        additionalProperties: false,
      },
      async execute(args) {
        seen.push(args.value)
        if (args.value === 'fail') throw new Error('PRIVATE_FIXTURE_ERROR')
        return 'RECOVERED_RESULT'
      },
    })
    const agent = await OpenCodeAgentHandle.open({
      root,
      executable,
      sessions,
      sessionId: 'wire',
      tools,
      allowed: ['probe'],
      maxSteps: 5,
      systemPrompt: 'Follow the fixture.',
      provider: { protocol, baseUrl: fixture.baseUrl, model: 'fixture-model', key: 'FIXTURE_KEY' },
    })
    t.after(() => agent.dispose())
    const result = await agent.send('Run the probe')
    assert.equal(result.status, 'completed')
    assert.equal(result.text, 'WIRE_COMPLETE')
    assert.deepEqual(seen, ['fail', 'recover'])
    assert.equal(fixture.requests.length, 3)
    assert.deepEqual(
      (await sessions.read('wire')).filter(message => message.role === 'tool').map(message => message.isError),
      [true, false],
    )
  })

test('unmappable options reject instead of silently losing explicit settings', () => {
  const base = { protocol: 'responses', baseUrl: 'https://invalid.example/v1', model: 'exact', key: 'FIXTURE_KEY' }
  for (const options of [
    { reasoningEffort: 'low', temperature: 0.25 },
    { model: 'gpt-5', temperature: 0.25 },
    { maxOutputTokens: 32001 },
    { timeoutMs: 180001 },
    { reasoningEffort: 'unknown' },
    { protocol: 'chat-completions', tokenLimitField: 'max_completion_tokens' },
  ])
    assert.throws(() => providerConfiguration({ ...base, ...options }), { code: 'OPENCODE_UNSUPPORTED_OPTION' })
})

test('known Gemini 3 Chat-compatible signature loss rejects before a tool execution can start', () => {
  for (const suffix of ['', '/', '//']) {
    assert.throws(
      () =>
        providerConfiguration({
          protocol: 'chat-completions',
          baseUrl: `https://generativelanguage.googleapis.com/v1beta/openai${suffix}`,
          model: 'gemini-3.1-flash-lite',
          key: 'FIXTURE_KEY',
        }),
      { code: 'OPENCODE_UNSUPPORTED_PROVIDER' },
    )
  }
})

for (const [protocol, reasoning] of [
  ['chat-completions', false],
  ['responses', false],
  ['responses', true],
  ['anthropic-messages', false],
  ['gemini', false],
])
  test(`pinned CLI maps ${protocol}${reasoning ? ' reasoning' : ''} model, root, options and tools`, {
    skip: !enabled,
    timeout: 210000,
  }, async t => {
    const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-chat-wire-'))
    const captured = []
    const server = createServer(async (req, res) => {
      let body = ''
      for await (const chunk of req) body += chunk
      captured.push({
        path: req.url,
        body: JSON.parse(body),
        authorized:
          protocol === 'gemini'
            ? req.headers['x-goog-api-key'] === 'FIXTURE_KEY'
            : protocol === 'anthropic-messages'
              ? req.headers['x-api-key'] === 'FIXTURE_KEY'
              : req.headers.authorization === 'Bearer FIXTURE_KEY',
      })
      res
        .writeHead(400, { 'content-type': 'application/json' })
        .end(JSON.stringify({ error: { code: 400, message: 'CAPTURE_COMPLETE', status: 'INVALID_ARGUMENT' } }))
    })
    await new Promise(done => server.listen(0, '127.0.0.1', done))
    t.after(async () => {
      server.closeAllConnections()
      await new Promise(done => server.close(done))
      await rm(root, { recursive: true, force: true })
    })
    const tools = new ToolRegistry()
    tools.register({
      name: 'probe',
      description: 'Probe',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      async execute() {
        throw new Error('Capture must never execute a tool')
      },
    })
    const model = protocol === 'gemini' ? 'gemini-model-exact' : 'organization/model-exact'
    const agent = await OpenCodeAgentHandle.open({
      root,
      executable,
      sessionId: 'chat',
      sessions: new MemorySessionStore(),
      tools,
      allowed: ['probe'],
      maxSteps: 4,
      systemPrompt: 'Reply briefly.',
      provider: {
        protocol,
        baseUrl: `http://127.0.0.1:${server.address().port}/custom/v1`,
        model,
        key: 'FIXTURE_KEY',
        maxOutputTokens: 123,
        ...(reasoning ? { reasoningEffort: 'low' } : { temperature: 0.25 }),
      },
    })
    t.after(() => agent.dispose())
    assert.equal((await agent.send('Wire test')).status, 'failed')
    assert.ok(captured.length > 0)
    for (const request of captured) {
      const endpoint = {
        'chat-completions': 'chat/completions',
        responses: 'responses',
        'anthropic-messages': 'messages',
        gemini: `models/${model}:streamGenerateContent?alt=sse`,
      }[protocol]
      assert.equal(request.path, `/custom/v1/${endpoint}`)
      if (protocol !== 'gemini') assert.equal(request.body.model, model)
      const limit =
        protocol === 'gemini'
          ? request.body.generationConfig.maxOutputTokens
          : protocol === 'responses'
            ? request.body.max_output_tokens
            : request.body.max_tokens
      assert.equal(limit, 123)
      assert.equal(
        protocol === 'gemini' ? request.body.generationConfig.temperature : request.body.temperature,
        reasoning ? undefined : 0.25,
      )
      if (reasoning) assert.equal(request.body.reasoning.effort, 'low')
      if (protocol === 'chat-completions')
        assert.equal(
          Object.hasOwn(request.body, 'store'),
          false,
          'Responses-only options must not leak into compatible Chat APIs',
        )
      const names = request.body.tools.flatMap(tool =>
        tool.functionDeclarations ? tool.functionDeclarations.map(fn => fn.name) : [tool.function?.name ?? tool.name],
      )
      assert.deepEqual(names, ['deckagent_probe'])
      assert.equal(request.authorized, true)
    }
    t.diagnostic(
      JSON.stringify({
        protocol,
        model,
        requests: captured.length,
        path: captured[0].path,
        maxOutputTokens: 123,
        temperature: reasoning ? null : 0.25,
        reasoning,
        tools: ['deckagent_probe'],
      }),
    )
  })
