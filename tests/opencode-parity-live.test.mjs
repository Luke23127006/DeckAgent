import assert from 'node:assert/strict'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { OpenCodeAgentHandle } from '../apps/local-web/lib/types/opencode/agent.js'
import { MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js'

const enabled = process.env.DECKAGENT_OPENCODE_PARITY_LIVE === '1'
const geminiModel = process.env.DECKAGENT_GEMINI_MODEL ?? 'gemini-3.1-flash-lite'
const cases = [
  {
    name: 'gemini',
    protocol: 'gemini',
    key: 'GEMINI_API_KEY',
    model: geminiModel,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  // Explicit diagnostic opt-in retains the earlier failing positive probe.
  // Normal acceptance uses standard Chat endpoints; this combination is now fail-closed.
  {
    name: 'chat-completions-google',
    protocol: 'chat-completions',
    key: 'GEMINI_API_KEY',
    model: geminiModel,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    diagnosticOnly: true,
  },
  {
    name: 'chat-completions-openai',
    protocol: 'chat-completions',
    key: 'OPENAI_API_KEY',
    model: process.env.DECKAGENT_CHAT_MODEL,
    baseUrl: process.env.DECKAGENT_CHAT_BASE_URL ?? 'https://api.openai.com/v1',
  },
  {
    name: 'responses',
    protocol: 'responses',
    key: 'OPENAI_API_KEY',
    model: process.env.DECKAGENT_RESPONSES_MODEL,
    baseUrl: process.env.DECKAGENT_RESPONSES_BASE_URL ?? 'https://api.openai.com/v1',
  },
  {
    name: 'anthropic-messages',
    protocol: 'anthropic-messages',
    key: 'ANTHROPIC_API_KEY',
    model: process.env.DECKAGENT_ANTHROPIC_MODEL,
    baseUrl: process.env.DECKAGENT_ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com/v1',
  },
]

for (const item of cases)
  test(`live ${item.name}: legacy context, MCP and observed usage`, {
    skip: !enabled
      ? 'Enable explicit live command'
      : item.diagnosticOnly && process.env.DECKAGENT_GOOGLE_CHAT_PROBE !== '1'
        ? 'Known unsupported signature path; previous FAIL retained; negative guard test covers rejection'
        : !process.env[item.key] || !item.model
          ? 'Required credential or explicit model ID unavailable; NOT VERIFIED'
          : false,
    timeout: 210000,
  }, async t => {
    const root = resolve('.local-only/opencode-task002-live', item.name, randomUUID())
    await mkdir(root, { recursive: true })
    const evidence = { status: 'FAIL', protocol: item.protocol, model: item.model, root, checks: {} }
    const sessions = new MemorySessionStore(),
      tools = new ToolRegistry(),
      seen = []
    await sessions.open('legacy-context')
    const legacy = [
      {
        role: 'user',
        content: `Remember reference marker HISTORY_PIN_42. Background notes: ${'recycling reference '.repeat(900)}`,
      },
      {
        role: 'assistant',
        content: 'Reference marker noted.',
        providerState: {
          provider: 'legacy-other-provider',
          model: 'legacy-other-model',
          data: { opaque: 'DO_NOT_REPLAY_OPAQUE_STATE' },
        },
      },
    ]
    await sessions.append('legacy-context', legacy)
    tools.register({
      name: 'probe',
      description: 'Verify a reference marker from the earlier user context. Return the validation result.',
      parameters: {
        type: 'object',
        properties: { value: { type: 'string' } },
        required: ['value'],
        additionalProperties: false,
      },
      async execute(args) {
        seen.push(args.value)
        assert.equal(args.value, 'HISTORY_PIN_42')
        return 'PARITY_LIVE_OK'
      },
    })
    const agent = await OpenCodeAgentHandle.open({
      root,
      executable: resolve(
        process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
          '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
      ),
      sessionId: 'legacy-context',
      sessions,
      tools,
      allowed: ['probe'],
      maxSteps: 6,
      systemPrompt:
        'You are validating context continuity. Use the probe tool exactly once with the earlier user reference marker. Do not infer a reference from provider state. Return the exact successful tool result.',
      provider: {
        protocol: item.protocol,
        baseUrl: item.baseUrl,
        model: item.model,
        key: process.env[item.key],
        maxOutputTokens: 2048,
      },
    })
    t.after(async () => {
      await agent.dispose()
      await writeFile(join(root, 'evidence.json'), JSON.stringify(evidence, null, 2))
    })
    const started = performance.now()
    const result = await agent.send(
      'Use the earlier reference marker as value for deckagent_probe, then return its result.',
    )
    evidence.elapsedMs = Math.round(performance.now() - started)
    evidence.turnStatus = result.status
    evidence.toolCalls = seen.length
    if (result.status !== 'completed') evidence.errorCode = result.error.code
    assert.equal(result.status, 'completed')
    assert.match(result.text, /PARITY_LIVE_OK/)
    assert.deepEqual(seen, ['HISTORY_PIN_42'])
    assert.deepEqual((await sessions.read('legacy-context')).slice(0, legacy.length), legacy)
    assert.equal((await sessions.read('legacy-context')).filter(message => message.role === 'user').length, 2)
    evidence.checks = {
      legacyContextMarker: 'PASS',
      mcpArgumentsAndResult: 'PASS',
      originalHistoryPreserved: 'PASS',
      oneNewUserInput: 'PASS',
    }
    const executions = []
    for (const path of await readdir(root, { recursive: true }))
      if (path.endsWith('execution.json')) executions.push(JSON.parse(await readFile(join(root, path), 'utf8')))
    assert.equal(executions.length, 1)
    evidence.usage = executions[0].usage
    evidence.monetaryCost = null
    evidence.costNote =
      'Observed CLI token counts only; no pricing estimate or claim that custom-provider cost is zero.'
    evidence.status = 'PASS'
    t.diagnostic(
      JSON.stringify({
        protocol: item.protocol,
        model: item.model,
        status: evidence.status,
        usage: evidence.usage,
        elapsedMs: evidence.elapsedMs,
        monetaryCost: null,
      }),
    )
  })
