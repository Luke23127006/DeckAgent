import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, mkdir, rm, writeFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { OpenCodeAgentHandle } from '../apps/local-web/lib/types/opencode/agent.js'
import { isolatedEnvironment, safeConfiguration, toolPermissions } from '../apps/local-web/lib/types/opencode/config.js'
import { runOpenCode } from '../apps/local-web/lib/types/opencode/process.js'
import { MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { phaseTools } from './fixtures/opencode-phase-tools.mjs'

test('preflight rejects additional MCP servers, plugins and agent overrides', () => {
  const permission = toolPermissions(['probe'])
  assert.deepEqual(permission, { '*': 'deny', deckagent_probe: 'allow' })
  const expected = {
    permission,
    mcp: { deckagent: { type: 'remote', url: 'http://127.0.0.1:1/mcp', headers: { Authorization: 'private' } } },
  }
  const valid = {
    permission,
    mcp: { deckagent: { ...expected.mcp.deckagent, headers: { Authorization: '***' } } },
    plugin: [],
    agent: { deckagent: { permission } },
  }
  assert.equal(safeConfiguration(valid, expected), true)
  for (const mutation of [
    { permission: { '*': 'allow' } },
    { mcp: { ...valid.mcp, rogue: valid.mcp.deckagent } },
    { plugin: ['file:///rogue.mjs'] },
    { agent: { deckagent: { permission: { '*': 'allow' } } } },
    { agent: { ...valid.agent, rogue: { permission } } },
  ])
    assert.equal(safeConfiguration({ ...valid, ...mutation }, expected), false)
})

// Opt-in local executable qualification; this endpoint intentionally fails inference.
// It captures real CLI provider requests, never claims model or tool execution success.
const enabled = process.env.DECKAGENT_OPENCODE_CLI_TESTS === '1'
const executable = resolve(
  process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
    '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
)

test('Host phases publish exactly their presentation-tool fixtures to the pinned CLI', {
  skip: !enabled,
  timeout: 210000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-phase-tools-'))
  const previous = process.env.DECKAGENT_PHASE_FIXTURE_KEY
  process.env.DECKAGENT_PHASE_FIXTURE_KEY = 'NOT_A_CREDENTIAL'
  let captured = []
  const server = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    const json = JSON.parse(body)
    if (req.url.includes('/models/gemini-3.1-flash-lite:'))
      captured.push((json.tools ?? []).flatMap(tool => (tool.functionDeclarations ?? []).map(fn => fn.name)).sort())
    res
      .writeHead(400, { 'content-type': 'application/json' })
      .end(JSON.stringify({ error: { code: 400, message: 'CAPTURE_COMPLETE', status: 'INVALID_ARGUMENT' } }))
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  t.after(async () => {
    server.closeAllConnections()
    await new Promise(done => server.close(done))
    if (previous === undefined) delete process.env.DECKAGENT_PHASE_FIXTURE_KEY
    else process.env.DECKAGENT_PHASE_FIXTURE_KEY = previous
    await rm(root, { recursive: true, force: true })
  })
  for (const [index, fixture] of phaseTools.entries()) {
    const app = await startLocalWeb({
      dataDir: join(root, String(index)),
      workspace: join(root, String(index), 'work'),
      openCode: { executable },
      selection: { provider: 'google', model: 'gemini-3.1-flash-lite' },
      connections: [
        {
          id: 'google',
          protocol: 'gemini',
          baseUrl: `http://127.0.0.1:${server.address().port}/v1beta`,
          apiKeyEnv: 'DECKAGENT_PHASE_FIXTURE_KEY',
        },
      ],
      ...(fixture.deck
        ? {
            confirmedDecks: [
              {
                sessionId: 'phase',
                outlineId: 'confirmed',
                slides: [
                  { slideId: 'one', title: 'One' },
                  { slideId: 'two', title: 'Two' },
                ],
              },
            ],
          }
        : {}),
    })
    try {
      captured = []
      const client = new HostClient(app.origin, app.token)
      const request = await client.send({ sessionId: 'phase', ...fixture.request })
      let terminal
      for await (const snapshot of client.watch(request.requestId)) terminal = snapshot
      assert.equal(terminal.status, 'failed', 'Capture endpoint deliberately refuses inference')
      assert.ok(captured.length > 0, fixture.name)
      const expected = fixture.tools.map(name => `deckagent_${name}`).sort()
      for (const actual of captured) assert.deepEqual(actual, expected, fixture.name)
      t.diagnostic(JSON.stringify({ phase: fixture.name, effectiveTools: captured }))
    } finally {
      await app.close()
    }
  }
})

test('pinned CLI exposes only the phase MCP tool at the provider boundary', {
  skip: !enabled,
  timeout: 210000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-effective-tools-'))
  const captured = []
  const server = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) {
      body += chunk
      if (body.length > 2000000) {
        req.destroy()
        return
      }
    }
    const json = JSON.parse(body)
    captured.push({
      path: req.url.split('?')[0],
      names: (json.tools ?? []).flatMap(tool =>
        (
          tool.functionDeclarations ??
          tool.function_declarations ??
          (tool.function ? [tool.function] : tool.name ? [tool] : [])
        ).map(fn => fn.name),
      ),
    })
    res.writeHead(400, { 'content-type': 'application/json' }).end(
      JSON.stringify({
        error: { code: 400, message: 'CAPTURE_COMPLETE', status: 'INVALID_ARGUMENT' },
      }),
    )
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  t.after(async () => {
    server.closeAllConnections()
    await new Promise(done => server.close(done))
    await rm(root, { recursive: true, force: true })
  })
  const sessions = new MemorySessionStore(),
    tools = new ToolRegistry()
  let calls = 0
  for (const name of ['probe', 'denied'])
    tools.register({
      name,
      description: 'Qualification probe',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      async execute() {
        calls++
        return 'probe'
      },
    })
  const agent = await OpenCodeAgentHandle.open({
    executable,
    root,
    sessionId: 'isolation',
    sessions,
    tools,
    allowed: ['probe'],
    maxSteps: 8,
    systemPrompt: 'Use only granted tools.',
    provider: {
      baseUrl: `http://127.0.0.1:${server.address().port}/v1beta`,
      model: 'gemini-3.1-flash-lite',
      key: 'NOT_A_CREDENTIAL',
    },
  })
  t.after(() => agent.dispose())
  assert.equal((await agent.send('List your available tools.')).status, 'failed')
  assert.ok(captured.length > 0, 'No provider request captured')
  assert.ok(
    captured.some(
      request =>
        request.path.includes('/models/gemini-3.1-flash-lite:') &&
        request.names.length === 1 &&
        request.names[0] === 'deckagent_probe',
    ),
    'Target model did not receive exactly deckagent_probe',
  )
  assert.ok(captured.every(request => request.names.every(name => name === 'deckagent_probe')))
  assert.equal(calls, 0)
  t.diagnostic(JSON.stringify({ scope: 'actual provider declarations; expected inference failure', captured }))
})

test('pinned CLI pure mode ignores hostile project config and cannot load its plugin', {
  skip: !enabled,
  timeout: 60000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-project-config-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const project = join(root, 'project'),
    marker = join(root, 'plugin-loaded'),
    plugin = join(root, 'canary.mjs')
  await mkdir(project)
  await writeFile(
    plugin,
    `import {writeFileSync} from 'node:fs'; writeFileSync(${JSON.stringify(marker)},'loaded'); export const Canary=async()=>({})`,
  )
  await writeFile(
    join(project, 'opencode.json'),
    JSON.stringify({
      permission: { '*': 'allow' },
      plugin: [pathToFileURL(plugin).href],
      agent: { rogue: { mode: 'primary', permission: { '*': 'allow' } } },
      mcp: { rogue: { type: 'remote', url: 'http://127.0.0.1:1/mcp' } },
    }),
  )
  const env = await isolatedEnvironment(join(root, 'private'), 'NOT_A_CREDENTIAL')
  assert.equal(env.OPENCODE_CONFIG, undefined)
  assert.equal(env.GEMINI_API_KEY, undefined)
  const permission = toolPermissions([])
  env.OPENCODE_CONFIG_CONTENT = JSON.stringify({
    permission,
    plugin: [],
    agent: { deckagent: { mode: 'primary', permission } },
  })
  const result = await runOpenCode(executable, ['debug', 'config', '--pure'], {
    cwd: project,
    env,
    signal: AbortSignal.timeout(45000),
  })
  assert.equal(result.code, 0)
  const config = JSON.parse(result.stdout)
  assert.deepEqual(config.permission, { '*': 'deny' })
  assert.deepEqual(Object.keys(config.agent), ['deckagent'])
  assert.deepEqual(config.plugin, [])
  assert.deepEqual(Object.keys(config.mcp ?? {}), [])
  await assert.rejects(access(marker), { code: 'ENOENT' })
})
