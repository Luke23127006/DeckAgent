/**
 * Tests: prepareRunInput composes RunContribution parts into one RunInput, and createRunBudget tracks RunUsage limits.
 * Environment: pure Node.js unit test. Contributions and ProviderResolver are in-memory fakes passed as parameters
 * (they are the seam of the composer), so no CLI, database or network runs.
 * Faults caught with this driver: a composer that calls the plan contributions before the registered ones fails
 * test 1, and a budget tracker that ignores its limits fails tests 5 and 6. Both faults were injected, observed and
 * reverted before this file passed.
 * Run: node --test --test-reporter=tap apps/host/tests/runs-preparation.test.mjs
 * Expected values source: docs/architecture/10-agent-core.md (Contract) and the Step 2 cases of
 * docs/build/refactor/target-structure/plan/task-50-add-runs-contracts-preparation-and-budget.md.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { RunFailure, createRunBudget, prepareRunInput, runOwnerKey } from '../lib/types/runs/index.js'

const owner = { kind: 'chat', id: 'chat-1' }
const grants = { publicResearch: false, sourceKinds: ['workspace-files'] }

function schema(name) {
  return {
    name,
    description: `${name} description`,
    inputSchema: {
      type: 'object',
      properties: { value: { type: 'string', description: 'value' } },
      required: ['value'],
      additionalProperties: false,
    },
  }
}

function toolSet(context, manifest, names, calls) {
  return {
    context,
    manifest,
    schemas: names.map(schema),
    executor: {
      async execute(name, args, toolContext) {
        calls.push({ name, args, owner: toolContext.owner, requestId: toolContext.requestId })
        return { isError: false, content: [{ type: 'text', text: `${name}:${String(args.value)}` }] }
      },
    },
  }
}

function contribution(name, parts, contributions) {
  return {
    name,
    async contribute(context) {
      contributions.push({ name, context })
      return parts
    },
  }
}

test('prepareRunInput follows registration order, then plan order, and binds tool calls to the ToolContext', async () => {
  const contributions = []
  const calls = []
  const resolved = []
  const signal = new AbortController().signal
  const settings = {
    provider: 'fixture',
    protocol: 'chat-completions',
    baseUrl: 'http://127.0.0.1:9/v1',
    model: 'model-a',
    key: 'sk-test',
  }
  const registered = [
    contribution(
      'source-tools',
      {
        instructions: ['source instruction'],
        tools: toolSet('context-r1', 'manifest-r1', ['read_research', 'list_sources'], calls),
        resources: [{ kind: 'conversation', messages: [{ role: 'user', content: 'earlier question' }] }],
      },
      contributions,
    ),
    contribution('chat-history', { tools: toolSet('context-r2', '', [], calls) }, contributions),
  ]
  const plan = {
    owner,
    input: 'draw a deck',
    selection: { provider: 'fixture', model: 'model-a' },
    grants,
    stepLimit: 4,
    contributions: [
      contribution(
        'deck-command',
        {
          instructions: ['deck instruction'],
          tools: toolSet('context-p1', 'manifest-p1', ['publish_slide'], calls),
          resources: [{ kind: 'conversation', messages: [{ role: 'assistant', content: 'earlier answer' }] }],
        },
        contributions,
      ),
    ],
  }
  const providers = {
    async resolve(selection) {
      resolved.push(selection)
      return settings
    },
  }
  const onApprovalWait = () => () => {}

  const input = await prepareRunInput({
    plan,
    requestId: 'request-1',
    signal,
    registered,
    providers,
    approve: async () => true,
    onApprovalWait,
  })

  assert.deepEqual(
    contributions.map(item => item.name),
    ['source-tools', 'chat-history', 'deck-command'],
  )
  for (const item of contributions) {
    assert.deepEqual(item.context.owner, owner)
    assert.equal(item.context.requestId, 'request-1')
    assert.deepEqual(item.context.grants, grants)
    assert.equal(item.context.signal, signal)
  }
  assert.deepEqual(input.instructions, ['source instruction', 'deck instruction'])
  assert.deepEqual(
    input.resources.map(resource => resource.messages.map(message => message.content)),
    [['earlier question'], ['earlier answer']],
  )
  assert.deepEqual(input.owner, owner)
  assert.equal(input.requestId, 'request-1')
  assert.equal(input.stepLimit, 4)
  assert.equal(input.signal, signal)
  assert.equal(input.onApprovalWait, onApprovalWait)
  assert.deepEqual(input.provider, settings)
  assert.deepEqual(resolved, [plan.selection])
  assert.deepEqual(
    input.tools.schemas.map(item => item.name),
    ['read_research', 'list_sources', 'publish_slide'],
  )
  assert.equal(input.tools.manifest, 'manifest-r1\n\nmanifest-p1')
  assert.match(input.tools.context, /^[a-f0-9]{64}$/)

  const first = await input.tools.call('read_research', { value: 'source' })
  assert.equal(first.content[0].text, 'read_research:source')
  const second = await input.tools.call('publish_slide', { value: 'slide' })
  assert.equal(second.content[0].text, 'publish_slide:slide')
  assert.deepEqual(
    calls.map(call => [call.name, call.owner, call.requestId]),
    [
      ['read_research', owner, 'request-1'],
      ['publish_slide', owner, 'request-1'],
    ],
  )

  await assert.rejects(input.tools.call('unknown_tool', { value: 'x' }), { code: 'TOOL_NOT_ALLOWED' })
})

test('prepareRunInput binds approve into every tool execution', async () => {
  const seen = []
  const signal = new AbortController().signal
  const plan = {
    owner,
    input: 'draw a deck',
    selection: { provider: 'fixture', model: 'model-a' },
    grants,
    stepLimit: 'none',
    contributions: [
      {
        name: 'deck-command',
        async contribute() {
          return {
            tools: {
              context: 'context-p1',
              manifest: 'manifest-p1',
              schemas: [schema('read_file')],
              executor: {
                async execute(name, args, toolContext) {
                  seen.push(await toolContext.approve({ key: 'k', operation: 'read-file', target: 't', reason: 'r' }))
                  return { isError: false, content: [{ type: 'text', text: name }] }
                },
              },
            },
          }
        },
      },
    ],
  }
  const input = await prepareRunInput({
    plan,
    requestId: 'request-2',
    signal,
    registered: [],
    providers: {
      resolve: async () => ({
        provider: 'fixture',
        protocol: 'chat-completions',
        baseUrl: 'http://127.0.0.1:9/v1',
        model: 'model-a',
      }),
    },
    approve: async () => false,
    onApprovalWait: () => () => {},
  })

  await input.tools.call('read_file', { value: 'x' })
  assert.deepEqual(seen, [false])
})

test('prepareRunInput refuses two contributions that use the same tool name', async () => {
  const settings = {
    provider: 'fixture',
    protocol: 'chat-completions',
    baseUrl: 'http://127.0.0.1:9/v1',
    model: 'model-a',
  }
  const plan = {
    owner,
    input: 'draw a deck',
    selection: { provider: 'fixture', model: 'model-a' },
    grants,
    stepLimit: 4,
    contributions: [
      contribution('deck-command', { tools: toolSet('context-p1', 'manifest-p1', ['read_file'], []) }, []),
    ],
  }

  await assert.rejects(
    prepareRunInput({
      plan,
      requestId: 'request-3',
      signal: new AbortController().signal,
      registered: [
        contribution('source-tools', { tools: toolSet('context-r1', 'manifest-r1', ['read_file'], []) }, []),
      ],
      providers: { resolve: async () => settings },
      approve: async () => true,
      onApprovalWait: () => () => {},
    }),
    error => error instanceof RunFailure && error.code === 'TOOL_NAME_CONFLICT',
  )
})

test('createRunBudget keeps the latest usage and stays silent without limits', () => {
  let fired = 0
  const budget = createRunBudget(undefined, () => {
    fired++
  })

  budget.record({ modelCalls: 1, inputTokens: 10, outputTokens: 5 })
  assert.deepEqual(budget.latest(), { modelCalls: 1, inputTokens: 10, outputTokens: 5 })
  budget.record({ modelCalls: 1_000, inputTokens: 9_000, outputTokens: 9_000 })
  assert.deepEqual(budget.latest(), { modelCalls: 1_000, inputTokens: 9_000, outputTokens: 9_000 })
  assert.equal(budget.exceeded(), undefined)
  assert.equal(fired, 0)
})

test('createRunBudget fires once when model calls exceed the limit', () => {
  const fired = []
  const budget = createRunBudget({ modelCalls: 2 }, reason => fired.push(reason))

  budget.record({ modelCalls: 2 })
  assert.equal(budget.exceeded(), undefined)
  assert.deepEqual(fired, [])

  budget.record({ modelCalls: 3 })
  assert.equal(budget.exceeded(), 'model-calls')
  budget.record({ modelCalls: 9 })
  assert.equal(budget.exceeded(), 'model-calls')
  assert.deepEqual(fired, ['model-calls'])
})

test('createRunBudget reports the first exceeded token limit and keeps the last usage', () => {
  const inputFired = []
  const inputBudget = createRunBudget({ inputTokens: 100 }, reason => inputFired.push(reason))
  inputBudget.record({ modelCalls: 1, inputTokens: 100 })
  assert.equal(inputBudget.exceeded(), undefined)
  inputBudget.record({ modelCalls: 2, inputTokens: 101 })
  assert.equal(inputBudget.exceeded(), 'input-tokens')
  assert.deepEqual(inputBudget.latest(), { modelCalls: 2, inputTokens: 101 })
  assert.deepEqual(inputFired, ['input-tokens'])

  const outputFired = []
  const outputBudget = createRunBudget({ outputTokens: 50 }, reason => outputFired.push(reason))
  outputBudget.record({ modelCalls: 1, outputTokens: 51 })
  assert.equal(outputBudget.exceeded(), 'output-tokens')
  assert.deepEqual(outputFired, ['output-tokens'])
})

test('runOwnerKey keeps the owner kind and ID distinct', () => {
  assert.equal(runOwnerKey({ kind: 'chat', id: 'chat-1' }), 'chat:chat-1')
})
