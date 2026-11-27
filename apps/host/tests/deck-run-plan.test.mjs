/**
 * Tests deck grants, staging, restore, image recovery and generation evidence through RunController.
 * Node.js uses real deck SQLite stores and fake runtime, source-service and request-store boundaries.
 * Expected tools come from the sixteen grant cases in Task 53 and the legacy permission policy.
 * Injected faults removed grants, enabled restore execution, exposed recovery source tools, omitted proposal writes,
 * omitted generation settlement, bypassed source selection and removed evidence IDs. Each fault failed this driver.
 * Run: node --test apps/host/tests/deck-run-plan.test.mjs.
 * Expected behavior comes from Task 53 and ADR-003.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { sourceKindsForBrief } from '../lib/types/modules/deck/index.js'
import { createSourceToolsContribution } from '../lib/types/tools/index.js'

function sourceOptions(hasResearchSources) {
  return {
    store: {
      getInfo: async () => ({ workspaceId: null }),
      attachments: { sent: () => [], get: () => undefined },
      requests: {
        sourceCatalogue: () => [],
        researchSources: () =>
          hasResearchSources
            ? [{ sourceId: 'research-1', version: 1, title: 'Research', url: 'https://example.com' }]
            : [],
        recordSourceRead: () => undefined,
      },
    },
    registry: { get: async () => ({ folderStatus: 'missing' }), folders: () => [] },
    dataRoot: 'C:/data',
    home: 'C:/home',
    attachments: { prepared: async () => undefined, read: async () => undefined },
    research: { revision: 'research-1', search: async () => [] },
  }
}

test('deck source grants expose the expected tool set for all sixteen flag combinations', async () => {
  for (const material of [false, true])
    for (const briefPublicResearch of [false, true])
      for (const requestPublicResearch of [false, true])
        for (const hasResearchSources of [false, true]) {
          const brief = { sources: { material, publicResearch: briefPublicResearch } }
          const contribution = createSourceToolsContribution(sourceOptions(hasResearchSources))
          const context = {
            owner: { kind: 'chat', id: 'chat-1' },
            requestId: 'request-1',
            signal: new AbortController().signal,
          }
          const actual = await contribution.contribute({
            ...context,
            grants: {
              publicResearch: briefPublicResearch && requestPublicResearch,
              sourceKinds: sourceKindsForBrief(brief),
            },
          })
          assert.deepEqual(
            actual.tools?.schemas.map(s => s.name) ?? [],
            [
              ...(material ? ['list_sources', 'read_source', 'read_external', 'read_attachment'] : []),
              ...((material || briefPublicResearch) && hasResearchSources ? ['read_research'] : []),
              ...(briefPublicResearch && requestPublicResearch ? ['research_public'] : []),
            ],
            JSON.stringify({ material, briefPublicResearch, requestPublicResearch, hasResearchSources }),
          )
        }
})
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { HtmlFormatAdapter } from '@deckagent/html-format'
import { DeckStore } from '@deckagent/deck'
import { BriefCoordinator, createDeckRunPlan, createGenerationRunPlan } from '../lib/types/modules/deck/index.js'
import { RunController } from '../lib/types/runs/lifecycle/index.js'
import { waitFor } from './fixtures/wait-for.mjs'
import { brief as briefFixture } from '../../../packages/presentation/deck/tests/fixtures/brief.mjs'

const selection = { provider: 'fixture', model: 'model-a' }
const providers = {
  resolve: async () => ({ ...selection, protocol: 'chat-completions', baseUrl: 'http://127.0.0.1:9/v1' }),
}
function runStore() {
  const records = new Map(),
    logs = new Map()
  return {
    admit(input) {
      const record = { ...input, status: 'active', historyStart: 0, startedAt: '2026-01-01', lastSequence: 0 }
      records.set(input.requestId, record)
      logs.set(input.requestId, [])
      return record
    },
    append(id, event) {
      const record = records.get(id)
      const saved = { ...event, requestId: id, sequence: ++record.lastSequence }
      logs.get(id).push(saved)
      return saved
    },
    finish(id, status, errorCode) {
      Object.assign(records.get(id), { status, errorCode })
      return [this.append(id, { kind: 'status', status })]
    },
    get: id => records.get(id),
    events: id => logs.get(id) ?? [],
    text: id =>
      (logs.get(id) ?? [])
        .filter(e => e.kind === 'text')
        .map(e => e.text)
        .join(''),
    activeFor: owner => [...records.values()].find(r => r.owner.id === owner.id && r.status === 'active')?.requestId,
  }
}
function sessions(files = []) {
  return {
    getInfo: async () => ({}),
    read: async () => [],
    attachments: { sent: () => [] },
    requests: {
      sourceCatalogue: () => files,
      researchSources: () => [],
      activeFor: () => undefined,
      get: () => undefined,
      text: () => '',
    },
  }
}
function readyBrief(images = false) {
  return {
    ...briefFixture(),
    purpose: 'Explain',
    proposedSlideCount: 1,
    template: { id: 'html-basic', version: 2 },
    sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
    answers: [{ topic: 'images', value: images ? 'Use an image' : 'No images' }],
    images: { mode: images ? 'public-research' : 'none', attachmentIds: [], unmetRequirements: [] },
  }
}
function outlineDraft(images = false) {
  return {
    overview: 'Purpose',
    revisionSuggestions: [],
    slides: [
      {
        title: 'Purpose',
        content: 'Explain the purpose',
        sources: [],
        blocks: images
          ? [{ kind: 'web-image', query: 'forest', caption: 'Forest' }]
          : [{ kind: 'bullets', items: ['Explain the purpose'] }],
      },
    ],
  }
}
function runtime(run) {
  return { name: 'fixture', availability: async () => ({ available: true }), run }
}
async function execute(controller, plan, options) {
  const admitted = await controller.start(plan, options)
  return waitFor(() => {
    const result = controller.get(admitted.requestId)
    return result.status !== 'active' && result
  })
}

test('deck plan stages a proposal and restores it without runtime calls', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'deck-run-plan-'))
  const decks = new DeckStore(join(directory, 'decks.sqlite'))
  t.after(async () => {
    decks.close()
    await rm(directory, { recursive: true, force: true })
  })
  const store = runStore(),
    sessionStore = sessions()
  const deps = { decks, sessions: sessionStore, briefs: new BriefCoordinator(decks, sessionStore) }
  let calls = 0
  const controller = new RunController({
    store,
    providers,
    runtime: runtime(async input => {
      calls++
      assert.equal(input.stepLimit, 8)
      assert.deepEqual(
        input.tools.schemas.map(s => s.name),
        ['stage_brief', 'stage_outline'],
      )
      assert.equal((await input.tools.call('stage_brief', { json: JSON.stringify(readyBrief()) })).isError, false)
      assert.equal((await input.tools.call('stage_outline', { json: JSON.stringify(outlineDraft()) })).isError, false)
      return { status: 'completed', usage: { modelCalls: 1 } }
    }),
  })
  t.after(() => controller.close())
  const first = await execute(
    controller,
    await createDeckRunPlan(
      deps,
      {
        sessionId: 'chat',
        input: 'Collect',
        deck: {
          action: 'collect',
          sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
          expectedBriefVersion: 0,
          expectedOutline: null,
        },
      },
      selection,
    ),
  )
  assert.equal(first.status, 'completed', JSON.stringify(first))
  assert.match(first.text, /Đã lưu Outline mới/)
  const proposal = decks.outlineSnapshot('chat').proposals[0]
  assert.equal(proposal.slides[0].title, 'Purpose')
  const restore = await createDeckRunPlan(
    deps,
    {
      sessionId: 'chat',
      input: 'Restore',
      deck: {
        action: 'restore',
        expectedBriefVersion: 1,
        expectedOutline: { outlineId: proposal.outlineId, version: proposal.version },
        restoreOutlineId: proposal.outlineId,
      },
    },
    selection,
  )
  assert.equal(restore.skipRuntime, true)
  assert.equal((await execute(controller, restore)).status, 'completed')
  assert.equal(calls, 1)
  assert.equal(decks.briefSnapshot('chat').version, 2)
})

test('deck recovery uses only image tools and commits the staged proposal', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'deck-recovery-plan-'))
  const decks = new DeckStore(join(directory, 'decks.sqlite'))
  t.after(async () => {
    decks.close()
    await rm(directory, { recursive: true, force: true })
  })
  let needs = []
  const imageReview = {
    stage: async input => {
      needs = input.map(need => ({
        ...need,
        required: true,
        remainingSelections: 2,
        remainingSearches: 1,
        candidates: [],
        attempts: [],
      }))
      return needs
    },
    snapshot: () => needs,
    pending: () => needs,
    resolve: async () => {
      throw new Error('No selected image')
    },
  }
  const sessionStore = sessions(),
    store = runStore(),
    calls = []
  const controller = new RunController({
    store,
    providers,
    contributions: [createSourceToolsContribution(sourceOptions(false))],
    runtime: runtime(async input => {
      calls.push(input.tools.schemas.map(s => s.name))
      if (calls.length === 1) {
        assert.equal((await input.tools.call('stage_brief', { json: JSON.stringify(readyBrief(true)) })).isError, false)
        assert.equal(
          (await input.tools.call('stage_outline', { json: JSON.stringify(outlineDraft(true)) })).isError,
          false,
        )
      }
      return { status: 'completed', usage: { modelCalls: 1 } }
    }),
  })
  t.after(() => controller.close())
  const deps = {
    decks,
    sessions: sessionStore,
    briefs: new BriefCoordinator(decks, sessionStore),
    imageResearch: { open: () => imageReview },
  }
  const result = await execute(
    controller,
    await createDeckRunPlan(
      deps,
      {
        sessionId: 'chat',
        input: 'Collect',
        deck: {
          action: 'collect',
          sourceChoice: { material: false, modelKnowledge: true, publicResearch: false },
          imageChoice: 'public-research',
          expectedBriefVersion: 0,
          expectedOutline: null,
        },
      },
      selection,
    ),
  )
  assert.equal(result.status, 'completed', JSON.stringify(result))
  assert.deepEqual(calls, [
    ['stage_brief', 'stage_outline', 'search_slide_images', 'select_slide_image'],
    ['search_slide_images', 'select_slide_image'],
  ])
  assert.equal(decks.outlineSnapshot('chat').proposals.length, 1)
  assert.deepEqual(
    store
      .events(result.requestId)
      .filter(e => e.label === 'recover_slide_images')
      .map(e => e.status),
    ['running', 'failed'],
  )
})

function value(result) {
  assert.equal(result.isError, false, JSON.stringify(result))
  return JSON.parse(result.content[0].text)
}

test('generation plan restricts selected sources, records evidence, finishes incomplete generation and adds its report', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'generation-run-plan-'))
  const decks = new DeckStore(join(directory, 'decks.sqlite'), {
    activeRequest: () => true,
    artifactRoot: join(directory, 'artifacts'),
    formats: [new HtmlFormatAdapter()],
  })
  t.after(async () => {
    decks.close()
    await rm(directory, { recursive: true, force: true })
  })
  const draft = readyBrief()
  draft.sources = {
    material: true,
    modelKnowledge: false,
    publicResearch: false,
    refs: [{ kind: 'project-file', sourceId: 'src-00000000-0000-4000-8000-000000000001', version: 1 }],
  }
  decks.commitBriefProposal('chat', {
    requestId: 'review-1',
    responseIndex: 0,
    expectedBriefVersion: 0,
    expectedOutline: null,
    draft,
    outline: outlineDraft(),
  })
  const outline = decks.outlineSnapshot('chat').proposals[0]
  const record = decks.briefSnapshot('chat').current
  const receipt = decks.confirmGeneration(
    'chat',
    {
      confirmationId: 'confirm-1',
      outlineId: outline.outlineId,
      outlineVersion: outline.version,
      briefId: record.briefId,
      briefVersion: record.version,
    },
    selection,
  )
  decks.admitGeneration('chat', receipt.intentId, receipt.requestId)
  const reads = [],
    evidence = [],
    store = runStore()
  const files = [
    { kind: 'project-file', sourceId: 'src-00000000-0000-4000-8000-000000000001', version: 1, label: 'selected.txt' },
    { kind: 'project-file', sourceId: 'src-00000000-0000-4000-8000-000000000002', version: 1, label: 'other.txt' },
  ]
  const sourceTools = {
    prepare: async () => ({
      context: 'source',
      manifest: '',
      schemas: [
        {
          name: 'read_source',
          description: 'Read source.',
          inputSchema: {
            type: 'object',
            properties: { path: { type: 'string' } },
            required: ['path'],
            additionalProperties: false,
          },
        },
      ],
      executor: {
        execute: async (name, args) => {
          reads.push(args.path)
          return {
            isError: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  source: { kind: 'project-file', sourceId: 'src-00000000-0000-4000-8000-000000000001', version: 1 },
                  text: 'Supported fact',
                }),
              },
            ],
          }
        },
      },
    }),
  }
  const built = await createGenerationRunPlan(
    { decks, sessions: sessions(files), sourceTools },
    {
      request: { sessionId: 'chat', input: 'Generate' },
      selection,
      intentId: receipt.intentId,
      requestId: receipt.requestId,
    },
  )
  const controller = new RunController({
    store,
    providers,
    runtime: runtime(async input => {
      assert.equal(input.stepLimit, 'none')
      assert.equal((await input.tools.call('read_source', { path: 'other.txt' })).isError, true)
      const read = value(await input.tools.call('read_source', { path: 'selected.txt' }))
      evidence.push(read.evidenceId)
      const context = value(await input.tools.call('read_generation_plan', { json: '{}' }))
      const stage = value(
        await input.tools.call('begin_slide', {
          json: JSON.stringify({ slideId: context.slides[0].slideId, layoutId: 'title-body' }),
        }),
      )
      value(
        await input.tools.call('record_slide_provenance', {
          json: JSON.stringify({
            stageId: stage.stageId,
            entries: [{ text: 'Supported fact', kind: 'fact', evidenceId: read.evidenceId, quote: 'Supported fact' }],
          }),
        }),
      )
      return { status: 'completed', usage: { modelCalls: 1 } }
    }),
  })
  t.after(() => controller.close())
  const result = await execute(controller, built.plan)
  assert.equal(result.status, 'failed')
  assert.equal(result.errorCode, 'GENERATION_INCOMPLETE', JSON.stringify(result))
  assert.deepEqual(reads, ['selected.txt'])
  assert.equal(typeof evidence[0], 'string')
  assert.equal(decks.generation('chat').state, 'incomplete')
  assert.match(result.text, /Đã lưu 0\/1 slide/)
})
