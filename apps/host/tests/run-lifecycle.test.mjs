/**
 * Tests: RunController owns one run for each owner, prepares and runs passes, writes the event log, routes approvals,
 * enforces the budget, and settles the terminal status; createSourceToolsContribution filters source tools by grant.
 * Environment: pure Node.js unit test. The RunStore, AgentRuntime, ProviderResolver and source stores are in-memory
 * fakes passed as parameters, so no CLI, database, filesystem or network runs.
 * Faults caught with this driver: a tool capability that skips the serialization queue fails the test
 * `RunController serializes tool calls and emits running then completed activities`. The fault was injected,
 * observed and reverted before this file passed.
 * Run: node --test apps/host/tests/run-lifecycle.test.mjs
 * Expected values source: docs/architecture/10-agent-core.md (Contract and Luồng của một run) and the Step 2 cases of
 * docs/build/refactor/target-structure/plan/task-52-implement-run-lifecycle-and-source-kinds.md.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { RunController } from '../lib/types/runs/lifecycle/index.js'
import { RunFailure } from '../lib/types/runs/ports.js'
import { SourceToolFailure, createSourceToolsContribution, mapSourceToolFailure } from '../lib/types/tools/index.js'
import { waitFor } from './fixtures/wait-for.mjs'

const owner = { kind: 'chat', id: 'chat-1' }
const settings = {
  provider: 'fixture',
  protocol: 'chat-completions',
  baseUrl: 'http://127.0.0.1:9/v1',
  model: 'model-a',
}
const providers = { resolve: async () => settings }

function schema(name) {
  return {
    name,
    description: `${name} description`,
    inputSchema: {
      type: 'object',
      properties: { value: { type: 'string' } },
      required: [],
      additionalProperties: false,
    },
  }
}

function plan(runOwner, overrides = {}) {
  return {
    owner: runOwner,
    input: 'question',
    selection: { provider: 'fixture', model: 'model-a' },
    grants: { publicResearch: false, sourceKinds: ['workspace-files'] },
    stepLimit: 4,
    contributions: [],
    ...overrides,
  }
}

function runtimeWith(run, availability = { available: true }) {
  const calls = []
  return {
    name: 'fixture',
    calls,
    async availability() {
      return availability
    },
    async run(input, sink) {
      calls.push(input)
      return run ? run(input, sink) : { status: 'completed', usage: { modelCalls: 1 } }
    },
  }
}

function notFound() {
  const error = new Error('REQUEST_NOT_FOUND')
  error.code = 'REQUEST_NOT_FOUND'
  throw error
}

function createRunStore() {
  const records = new Map()
  const eventLog = new Map()
  const texts = new Map()
  const approvals = new Map()
  const admitCalls = []
  let approvalCount = 0

  function recordOf(requestId) {
    const record = records.get(requestId)
    if (!record) notFound()
    return record
  }

  function saveApproval(requestId, approval) {
    approvals.set(approval.approvalId, approval)
    return { kind: 'approval', approval }
  }

  return {
    admitCalls,
    approvals: {
      create(requestId, step) {
        recordOf(requestId)
        approvalCount += 1
        const approval = {
          approvalId: `approval-${approvalCount}`,
          requestId,
          operation: step.operation,
          target: step.target,
          reason: step.reason,
          state: 'pending',
        }
        return { approval, events: [saveApproval(requestId, approval)] }
      },
      decide(requestId, approvalId, decision) {
        const approval = approvals.get(approvalId)
        if (!approval || approval.requestId !== requestId) {
          const error = new Error('APPROVAL_NOT_FOUND')
          error.code = 'APPROVAL_NOT_FOUND'
          throw error
        }
        if (approval.state !== 'pending') {
          const error = new Error('APPROVAL_CONFLICT')
          error.code = 'APPROVAL_CONFLICT'
          throw error
        }
        const next = { ...approval, state: decision === 'allow-once' ? 'allowed' : 'refused' }
        return { approval: next, events: [saveApproval(requestId, next)] }
      },
      pending(requestId) {
        for (const approval of approvals.values()) {
          if (approval.requestId === requestId && approval.state === 'pending') return approval
        }
        return undefined
      },
    },
    admit(input) {
      admitCalls.push(input)
      for (const record of records.values()) {
        const active = record.status === 'active' || record.status === 'waiting_approval'
        if (active && record.owner.kind === input.owner.kind && record.owner.id === input.owner.id) {
          const error = new Error('RUN_OWNER_BUSY')
          error.code = 'RUN_OWNER_BUSY'
          throw error
        }
      }
      const record = {
        ...(input.publicResearch === undefined ? {} : { publicResearch: input.publicResearch }),
        requestId: input.requestId,
        owner: input.owner,
        status: 'active',
        selection: input.selection,
        historyStart: 0,
        startedAt: '2026-01-01T00:00:00.000Z',
        lastSequence: 0,
      }
      records.set(input.requestId, record)
      eventLog.set(input.requestId, [])
      texts.set(input.requestId, '')
      return record
    },
    append(requestId, event) {
      const record = recordOf(requestId)
      record.lastSequence += 1
      const saved = { ...event, requestId, sequence: record.lastSequence, timestamp: '2026-01-01T00:00:00.000Z' }
      eventLog.get(requestId).push(saved)
      if (event.kind === 'text') texts.set(requestId, texts.get(requestId) + event.text)
      return saved
    },
    finish(requestId, status, errorCode) {
      const record = recordOf(requestId)
      record.status = status
      if (errorCode === undefined) delete record.errorCode
      else record.errorCode = errorCode
      return []
    },
    get(requestId) {
      return records.get(requestId)
    },
    events(requestId, after = 0) {
      recordOf(requestId)
      return eventLog.get(requestId).filter(event => event.sequence > after)
    },
    text(requestId) {
      recordOf(requestId)
      return texts.get(requestId)
    },
    activeFor(runOwner) {
      for (const record of records.values()) {
        const active = record.status === 'active' || record.status === 'waiting_approval'
        if (active && record.owner.kind === runOwner.kind && record.owner.id === runOwner.id) return record.requestId
      }
      return undefined
    },
  }
}

function researchSource() {
  return {
    sourceId: 'research-1',
    version: 1,
    kind: 'research',
    provider: 'tavily',
    query: 'material',
    title: 'Source title',
    url: 'https://example.com/source',
    content: 'Excerpt',
    partial: true,
    fingerprint: 'fingerprint-1',
    retrievedAt: '2026-01-01T00:00:00.000Z',
    location: { kind: 'research-result', start: 0, end: 7 },
  }
}

function sourceOptions(sources = []) {
  return {
    chats: {
      async getInfo() {
        return { workspaceId: null }
      },
    },
    attachmentRecords: {
      sent: () => [],
      get() {
        notFound()
      },
    },
    runs: {
      sourceCatalogue: () => [],
      researchSources: () => sources,
      recordSourceRead() {
        return undefined
      },
    },
    registry: {
      async get() {
        return { folderStatus: 'missing' }
      },
      folders: () => [],
    },
    dataRoot: 'C:/data',
    home: 'C:/home',
    attachments: {
      async prepared() {
        throw new Error('unused')
      },
      async read() {
        throw new Error('unused')
      },
    },
  }
}

const researchSession = {
  revision: 'research-revision-1',
  async search() {
    return []
  },
}

async function contribute(runGrants, options = sourceOptions(), runOwner = owner) {
  const contribution = createSourceToolsContribution(options)
  return contribution.contribute({
    owner: runOwner,
    requestId: 'request-1',
    grants: runGrants,
    signal: new AbortController().signal,
  })
}

test('RunController admits one run for each owner and refuses a second start', async () => {
  const store = createRunStore()
  const gates = []
  const runtime = runtimeWith(async input => {
    if (input.owner.id === 'chat-1') await new Promise(resolve => gates.push(resolve))
    return { status: 'completed', usage: { modelCalls: 1 } }
  })
  const controller = new RunController({ store, runtime, providers })

  const first = await controller.start(plan({ kind: 'chat', id: 'chat-1' }))
  assert.equal(first.status, 'active')
  await assert.rejects(
    controller.start(plan({ kind: 'chat', id: 'chat-1' })),
    error => error instanceof RunFailure && error.code === 'RUN_OWNER_BUSY',
  )

  const second = await controller.start(plan({ kind: 'chat', id: 'chat-2' }))
  assert.equal(second.owner.id, 'chat-2')
  await waitFor(() => runtime.calls.length === 2)

  await assert.rejects(
    controller.start(plan({ kind: 'chat', id: 'chat-3' }, { requestId: first.requestId })),
    error => error instanceof RunFailure && error.code === 'GENERATION_LINK_CONFLICT',
  )

  for (const release of gates) release()
  await controller.close()
})

test('RunController refuses start after close', async () => {
  const controller = new RunController({ store: createRunStore(), runtime: runtimeWith(), providers })
  await controller.close()

  await assert.rejects(
    controller.start(plan(owner)),
    error => error instanceof RunFailure && error.code === 'HOST_CLOSED',
  )
})

test('RunController refuses start before admission when the runtime is unavailable', async () => {
  const store = createRunStore()
  const runtime = runtimeWith(undefined, {
    available: false,
    code: 'RUNTIME_VERSION_UNSUPPORTED',
    detail: { version: '1.19.5' },
  })
  const controller = new RunController({ store, runtime, providers })

  await assert.rejects(
    controller.start(plan(owner)),
    error =>
      error instanceof RunFailure && error.code === 'RUNTIME_VERSION_UNSUPPORTED' && error.detail?.version === '1.19.5',
  )
  assert.equal(store.admitCalls.length, 0)
  await controller.close()
})

test('RunController Stop saves stopped, emits closing text and refuses late events', async () => {
  const store = createRunStore()
  let startedResolve
  const started = new Promise(resolve => {
    startedResolve = resolve
  })
  let lateWrite
  const runtime = runtimeWith(async (input, sink) => {
    startedResolve()
    await sink.emit({ kind: 'text', part: 'reply', text: 'first part' })
    if (!input.signal.aborted)
      await new Promise(resolve => input.signal.addEventListener('abort', resolve, { once: true }))
    lateWrite = await sink.emit({ kind: 'text', part: 'late', text: 'late part' }).then(
      () => 'saved',
      () => 'refused',
    )
    return { status: 'failed', usage: { modelCalls: 1 }, error: { category: 'stopped', code: 'STOPPED' } }
  })
  const controller = new RunController({ store, runtime, providers })

  const snapshot = await controller.start(
    plan(owner, { closingText: status => (status === 'stopped' ? 'Stopped by the user.' : undefined) }),
  )
  await started
  await waitFor(() => store.text(snapshot.requestId) === 'first part')
  const stopped = controller.stop(snapshot.requestId)
  assert.equal(stopped.status, 'stopped')
  await controller.close()

  assert.equal(store.get(snapshot.requestId).status, 'stopped')
  assert.equal(store.text(snapshot.requestId), 'first partStopped by the user.')
  assert.equal(lateWrite, 'refused')
  assert.deepEqual(
    store
      .events(snapshot.requestId)
      .filter(event => event.kind === 'text')
      .map(event => event.part),
    ['reply', 'generation-summary'],
  )
})

test('RunController aborts the run signal when the budget is exceeded', async () => {
  const store = createRunStore()
  let aborted
  const runtime = runtimeWith(async (input, sink) => {
    sink.usage({ modelCalls: 2 })
    aborted = input.signal.aborted
    return { status: 'failed', usage: { modelCalls: 2 }, error: { category: 'stopped', code: 'STOPPED' } }
  })
  const controller = new RunController({ store, runtime, providers, budget: { modelCalls: 1 } })

  const snapshot = await controller.start(plan(owner))
  await waitFor(() => controller.get(snapshot.requestId).status !== 'active')

  assert.equal(aborted, true)
  assert.equal(controller.get(snapshot.requestId).status, 'failed')
  assert.equal(controller.get(snapshot.requestId).errorCode, 'STOPPED')
  await controller.close()
})

test('RunController runs every pass in one request, finalizes once and commits after completion', async () => {
  const store = createRunStore()
  const passes = []
  const nextContexts = []
  const finalizeContexts = []
  let commitStatus
  const runtime = runtimeWith(async input => {
    passes.push(input.requestId)
    return {
      status: 'completed',
      usage: { modelCalls: 1 },
      commit() {
        commitStatus = store.get(input.requestId).status
      },
    }
  })
  const controller = new RunController({ store, runtime, providers })

  const snapshot = await controller.start({
    ...plan(owner),
    next: async (result, context) => {
      nextContexts.push(context)
      assert.equal(result.status, 'completed')
      return plan(owner, { input: 'second pass' })
    },
    finalize: async (result, context) => {
      finalizeContexts.push(context)
      return result
    },
  })
  await waitFor(() => controller.get(snapshot.requestId).status === 'completed')

  assert.deepEqual(passes, [snapshot.requestId, snapshot.requestId])
  assert.deepEqual(
    nextContexts.map(context => context.requestId),
    [snapshot.requestId],
  )
  assert.deepEqual(
    finalizeContexts.map(context => context.requestId),
    [snapshot.requestId],
  )
  assert.equal(commitStatus, 'completed')
  await controller.close()
})

test('RunController serializes tool calls and emits running then completed activities', async () => {
  const store = createRunStore()
  const order = []
  const tools = {
    context: 'tools-context',
    manifest: 'tools-manifest',
    schemas: [schema('slow'), schema('fast')],
    executor: {
      async execute(name) {
        order.push(`${name}:start`)
        await Promise.resolve()
        await Promise.resolve()
        order.push(`${name}:end`)
        return { isError: false, content: [{ type: 'text', text: name }] }
      },
    },
  }
  const runtime = runtimeWith(async input => {
    await Promise.all([input.tools.call('slow', {}), input.tools.call('fast', {})])
    return { status: 'completed', usage: { modelCalls: 1 } }
  })
  const controller = new RunController({ store, runtime, providers })

  const snapshot = await controller.start(
    plan(owner, {
      contributions: [
        {
          name: 'fixture-tools',
          async contribute() {
            return { tools }
          },
        },
      ],
    }),
  )
  await waitFor(() => controller.get(snapshot.requestId).status === 'completed')

  assert.deepEqual(order, ['slow:start', 'slow:end', 'fast:start', 'fast:end'])
  assert.deepEqual(
    store
      .events(snapshot.requestId)
      .filter(event => event.kind === 'activity')
      .map(event => [event.label, event.status]),
    [
      ['slow', 'running'],
      ['slow', 'completed'],
      ['fast', 'running'],
      ['fast', 'completed'],
    ],
  )
  await controller.close()
})

test('RunController routes approval waits and decisions to the tool call', async () => {
  const store = createRunStore()
  const waits = []
  const decisions = []
  let approved
  const tools = {
    context: 'tools-context',
    manifest: 'tools-manifest',
    schemas: [schema('ask')],
    executor: {
      async execute(name, _args, context) {
        approved = await context.approve({
          key: 'read:outside',
          operation: 'read-file',
          target: 'C:/outside.txt',
          reason: 'outside the project folder',
        })
        return { isError: false, content: [{ type: 'text', text: name }] }
      },
    },
  }
  let active
  const runtime = runtimeWith(async input => {
    input.onApprovalWait(waiting => {
      waits.push(waiting)
      if (!waiting) return
      const pending = active.get(input.requestId).pendingApproval
      decisions.push(active.decide(input.requestId, pending.approvalId, 'allow-once').state)
    })
    await input.tools.call('ask', {})
    return { status: 'completed', usage: { modelCalls: 1 } }
  })
  active = new RunController({ store, runtime, providers, hasTools: true })

  const snapshot = await active.start(
    plan(owner, {
      contributions: [
        {
          name: 'fixture-tools',
          async contribute() {
            return { tools }
          },
        },
      ],
    }),
  )
  await waitFor(() => active.get(snapshot.requestId).status === 'completed')

  assert.equal(approved, true)
  assert.deepEqual(decisions, ['allowed'])
  assert.equal(waits.includes(true), true)
  assert.equal(waits.at(-1), false)
  await active.close()
})

test('RunController turns a tool storage failure into REQUEST_NOT_SAVED', async () => {
  const store = createRunStore()
  const tools = {
    context: 'tools-context',
    manifest: 'tools-manifest',
    schemas: [schema('broken')],
    executor: {
      async execute() {
        const error = new Error('SESSION_STORAGE')
        error.code = 'SESSION_STORAGE'
        throw error
      },
    },
  }
  const runtime = runtimeWith(async input => {
    await input.tools.call('broken', {})
    return { status: 'completed', usage: { modelCalls: 1 } }
  })
  const controller = new RunController({ store, runtime, providers })

  const snapshot = await controller.start(
    plan(owner, {
      contributions: [
        {
          name: 'fixture-tools',
          async contribute() {
            return { tools }
          },
        },
      ],
    }),
  )
  await waitFor(() => controller.get(snapshot.requestId).status === 'failed')

  assert.equal(controller.get(snapshot.requestId).errorCode, 'REQUEST_NOT_SAVED')
  assert.deepEqual(
    store
      .events(snapshot.requestId)
      .filter(event => event.kind === 'activity')
      .map(event => [event.label, event.status]),
    [['broken', 'running']],
  )
  await controller.close()
})

test('createSourceToolsContribution returns no tools for an empty grant or another owner kind', async () => {
  assert.deepEqual(await contribute({ publicResearch: false, sourceKinds: [] }), {})
  assert.deepEqual(
    await contribute({ publicResearch: false, sourceKinds: ['attachments'] }, sourceOptions(), {
      kind: 'deck',
      id: 'chat-1',
    }),
    {},
  )
})

test('createSourceToolsContribution returns only the tools of the granted kinds', async () => {
  const attachments = await contribute({ publicResearch: false, sourceKinds: ['attachments'] })
  assert.deepEqual(
    attachments.tools.schemas.map(item => item.name),
    ['read_attachment'],
  )

  const workspace = await contribute({ publicResearch: false, sourceKinds: ['workspace-files'] })
  assert.deepEqual(
    workspace.tools.schemas.map(item => item.name),
    ['list_sources', 'read_source', 'read_external'],
  )
})

test('createSourceToolsContribution grants research tools only for saved sources and the public grant', async () => {
  const denied = await contribute({ publicResearch: false, sourceKinds: ['research'] })
  assert.deepEqual(denied.tools.schemas, [])

  const saved = await contribute(
    { publicResearch: false, sourceKinds: ['research'] },
    sourceOptions([researchSource()]),
  )
  assert.deepEqual(
    saved.tools.schemas.map(item => item.name),
    ['read_research'],
  )

  const options = { ...sourceOptions([researchSource()]), research: researchSession }
  const granted = await contribute({ publicResearch: true, sourceKinds: ['research'] }, options)
  assert.deepEqual(
    granted.tools.schemas.map(item => item.name),
    ['read_research', 'research_public'],
  )
})

test('mapSourceToolFailure maps source failures and ignores other errors', () => {
  assert.deepEqual(mapSourceToolFailure(new SourceToolFailure('SOURCE_ARGUMENTS_INVALID')), {
    status: 400,
    code: 'SOURCE_ARGUMENTS_INVALID',
  })
  assert.deepEqual(mapSourceToolFailure(new SourceToolFailure('TOOL_NOT_ALLOWED')), {
    status: 403,
    code: 'TOOL_NOT_ALLOWED',
  })
  assert.deepEqual(mapSourceToolFailure(new SourceToolFailure('SESSION_NOT_FOUND')), {
    status: 404,
    code: 'SESSION_NOT_FOUND',
  })
  assert.deepEqual(mapSourceToolFailure(new SourceToolFailure('ATTACHMENT_NOT_FOUND', { attachmentId: 'a1' })), {
    status: 404,
    code: 'ATTACHMENT_NOT_FOUND',
    detail: { attachmentId: 'a1' },
  })
  assert.deepEqual(mapSourceToolFailure(new SourceToolFailure('SOURCE_UNREADABLE')), {
    status: 500,
    code: 'SOURCE_UNREADABLE',
  })
  assert.equal(mapSourceToolFailure(new Error('other')), undefined)
})
