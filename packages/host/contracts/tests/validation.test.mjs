/**
 * Tests: host/contracts Zod decoders validate wire payloads and throw typed or expected errors on invalid input.
 * Environment: compiled @deckagent/host-contracts lib/index.js in Node.js with zero external I/O.
 * Fault check: removing a schema constraint or cross-field guard lets invalid payloads pass without throwing the expected error code or message.
 * Run: node --test --test-reporter=tap packages/host/contracts/tests/validation.test.mjs
 * Expected values source: packages/host/contracts/src/request-validation.ts, brief-validation.ts, outline-validation.ts, generation-validation.ts.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeAgentRequest,
  decodeAttachment,
  decodeBoundProposal,
  decodeBriefView,
  decodeChangeNotice,
  decodeGeneration,
  decodeProviderRemoveBody,
  decodeProviderSaveBody,
  decodeWorkspaceAddBody,
  decodeWorkspaceRelinkBody,
  decodeWorkspaceRemoveBody,
  decodeWorkspaceRenameBody,
  decodeWorkspaceSelectBody,
  requestEvent,
  RequestValidationError,
} from '../lib/index.js'

const sessionId = 'session-test-1'
const attachmentOne = 'att-11111111-1111-4111-8111-111111111111'
const sourceOne = 'src-11111111-1111-4111-8111-111111111111'
const briefOne = 'brief-11111111-1111-4111-8111-111111111111'
const shaOne = 'a'.repeat(64)

function validBriefRecord() {
  return {
    sessionId,
    briefId: briefOne,
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    draft: {
      topic: 'Solar Energy',
      requirements: ['Include metrics'],
      answers: [{ topic: 'topic', value: 'Solar Energy' }],
      assumptions: [],
      sources: {
        material: true,
        modelKnowledge: false,
        publicResearch: false,
        refs: [{ sourceId: sourceOne, version: 1, kind: 'attachment' }],
      },
      images: {
        mode: 'none',
        attachmentIds: [],
        unmetRequirements: [],
      },
    },
    design: null,
  }
}

test('decodeAgentRequest accepts valid chat, deck, and publicResearch payloads', () => {
  const chat = decodeAgentRequest({ sessionId, input: 'Build a deck', publicResearch: true }, 4)
  assert.deepEqual(chat, { sessionId, input: 'Build a deck', publicResearch: true })

  const deck = decodeAgentRequest(
    {
      sessionId,
      input: 'Update brief',
      deck: {
        action: 'collect',
        expectedBriefVersion: 1,
        expectedOutline: { outlineId: 'out-1', version: 2 },
        imageChoice: 'public-research',
        imageProviderChoice: 'tavily',
      },
    },
    4,
  )
  assert.equal(deck.deck?.action, 'collect')
  assert.equal(deck.deck?.imageProviderChoice, 'tavily')
})

test('decodeAgentRequest rejects empty, oversized, and malformed payloads with RequestValidationError', () => {
  assert.throws(
    () => decodeAgentRequest({ sessionId, input: '   ' }, 4),
    error => error instanceof RequestValidationError && error.code === 'REQUEST_EMPTY',
  )
  assert.throws(
    () => decodeAgentRequest({ sessionId, input: 'x'.repeat(16001) }, 4),
    error => error instanceof RequestValidationError && error.code === 'REQUEST_TEXT_TOO_LONG',
  )
  for (const bad of [
    { sessionId, input: 'hi', publicResearch: 'yes' },
    {
      sessionId,
      input: 'hi',
      continueDeck: true,
      deck: { action: 'collect', expectedBriefVersion: 0, expectedOutline: null },
    },
    { sessionId, input: 'hi', extraField: 1 },
    { sessionId, input: '', attachmentIds: [attachmentOne, attachmentOne] },
  ]) {
    assert.throws(
      () => decodeAgentRequest(bad, 4),
      error => error instanceof RequestValidationError && error.code === 'INVALID_REQUEST',
    )
  }
})

test('decodeAttachment and requestEvent reject invalid wire shapes with INVALID_RESPONSE', () => {
  const attachment = decodeAttachment({
    attachmentId: attachmentOne,
    name: 'notes.md',
    state: 'ready',
    byteSize: 128,
  })
  assert.equal(attachment.attachmentId, attachmentOne)
  assert.throws(() => decodeAttachment({ attachmentId: 'bad', name: 'notes.md', state: 'ready', byteSize: 0 }), {
    message: 'INVALID_RESPONSE',
  })

  const event = requestEvent({
    requestId: 'req-1',
    sequence: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
    kind: 'status',
    status: 'active',
  })
  assert.equal(event.kind, 'status')
  assert.throws(
    () =>
      requestEvent({
        requestId: 'req-1',
        sequence: 1,
        timestamp: '2026-01-01T00:00:00.000Z',
        kind: 'approval',
        approval: {
          approvalId: 'apr-1',
          requestId: 'req-other',
          operation: 'read-file',
          target: 'a.txt',
          reason: 'Read file',
          state: 'pending',
        },
      }),
    { message: 'INVALID_RESPONSE' },
  )
})

test('decodeBriefView, decodeBoundProposal, and decodeGeneration enforce domain invariants', () => {
  const brief = validBriefRecord()
  const decodedBrief = decodeBriefView(
    {
      sessionId,
      version: 1,
      current: brief,
      locked: false,
      sourceStates: [{ source: { sourceId: sourceOne, version: 1, kind: 'attachment' }, status: 'recorded' }],
    },
    sessionId,
  )
  assert.equal(decodedBrief.version, 1)
  assert.throws(
    () =>
      decodeBriefView({ sessionId: 'other', version: 0, current: null, locked: false, sourceStates: [] }, sessionId),
    {
      message: 'INVALID_RESPONSE',
    },
  )

  const proposal = decodeBoundProposal(
    {
      outlineId: 'out-1',
      requestId: 'req-1',
      version: 1,
      responseIndex: 0,
      overview: 'Deck overview',
      status: 'current',
      slides: [
        {
          slideId: 'slide-1',
          title: 'Intro',
          content: 'Overview content',
          blocks: [{ kind: 'text', text: 'Overview content' }],
          sources: [{ sourceId: sourceOne, version: 1, kind: 'attachment' }],
        },
      ],
      revisionSuggestions: ['Keep it concise'],
      brief,
      changes: {
        orderChanged: false,
        overviewChanged: false,
        suggestionsChanged: false,
        briefFields: [],
        added: [],
        removed: [],
        changed: [],
      },
    },
    sessionId,
  )
  assert.equal(proposal.slides.length, 1)
  assert.throws(
    () =>
      decodeBoundProposal(
        {
          outlineId: 'out-1',
          requestId: 'req-1',
          version: 1,
          responseIndex: 0,
          overview: 'Deck overview',
          status: 'current',
          slides: [
            {
              slideId: 'slide-1',
              title: 'Intro',
              content: 'Overview content',
              blocks: [{ kind: 'text', text: 'Overview content' }],
              sources: [{ sourceId: 'src-22222222-2222-4222-8222-222222222222', version: 1, kind: 'attachment' }],
            },
          ],
          revisionSuggestions: [],
          brief,
          changes: {
            orderChanged: false,
            overviewChanged: false,
            suggestionsChanged: false,
            briefFields: [],
            added: [],
            removed: [],
            changed: [],
          },
        },
        sessionId,
      ),
    { message: 'INVALID_RESPONSE' },
  )

  const theme = {
    'color.background': '#ffffff',
    'color.surface': '#f5f5f5',
    'color.text': '#111111',
    'color.muted': '#666666',
    'color.accent': '#0055ff',
    'color.onAccent': '#ffffff',
    'color.border': '#dddddd',
    'font.heading': 'Inter',
    'font.body': 'Inter',
    'type.display': 48,
    'type.heading': 28,
    'type.body': 16,
    'type.caption': 12,
    'space.unit': 8,
    'type.lineHeight': 1.4,
  }
  const generation = decodeGeneration(
    {
      format: 'html',
      state: 'generated',
      formatLocked: true,
      startedAt: '2026-01-01T00:00:00.000Z',
      selection: { provider: 'fixture', model: 'fixture-model' },
      design: {
        format: 'html',
        designSystem: { id: 'ds-1', version: 1 },
        template: { id: 'tpl-1', version: 1 },
        theme,
        rules: ['One idea per slide'],
        brandAssets: [],
        viewport: { width: 1280, height: 720 },
        fingerprint: shaOne,
      },
      receipt: {
        sessionId,
        deckId: sessionId,
        confirmationId: 'conf-1',
        outlineId: 'out-1',
        briefId: briefOne,
        intentId: 'intent-1',
        requestId: 'req-1',
        outlineVersion: 1,
        briefVersion: 1,
        fingerprint: shaOne,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    },
    sessionId,
  )
  assert.equal(generation.state, 'generated')
  assert.throws(() => decodeGeneration({ format: 'html' }, sessionId), { message: 'INVALID_GENERATION_RESPONSE' })
})

test('decodeChangeNotice accepts valid notices and rejects malformed shapes with INVALID_RESPONSE', () => {
  assert.deepEqual(decodeChangeNotice({ topic: 'workspaces', key: 'host', version: 0 }), {
    topic: 'workspaces',
    key: 'host',
    version: 0,
  })
  for (const bad of [
    null,
    { topic: 'unknown', key: 'host', version: 0 },
    { topic: 'workspaces', key: '', version: 0 },
    { topic: 'workspaces', key: 'host', version: -1 },
    { topic: 'workspaces', key: 'host', version: 1.5 },
    { topic: 'workspaces', key: 'host', version: 0, extra: true },
  ]) {
    assert.throws(() => decodeChangeNotice(bad), { message: 'INVALID_RESPONSE' })
  }
})

test('workspace body decoders enforce expectedVersion and strict keys while keeping domain fields unchecked', () => {
  assert.deepEqual(decodeWorkspaceAddBody({ folder: '/project', expectedVersion: 0 }), {
    folder: '/project',
    expectedVersion: 0,
  })
  assert.deepEqual(decodeWorkspaceAddBody({ expectedVersion: 1 }), { folder: undefined, expectedVersion: 1 })
  assert.deepEqual(decodeWorkspaceAddBody({ folder: 42, expectedVersion: 2 }), { folder: 42, expectedVersion: 2 })
  assert.deepEqual(decodeWorkspaceSelectBody({ id: 'default', expectedVersion: 0 }), {
    id: 'default',
    expectedVersion: 0,
  })
  assert.deepEqual(decodeWorkspaceRenameBody({ name: 'x'.repeat(101), expectedVersion: 3 }), {
    name: 'x'.repeat(101),
    expectedVersion: 3,
  })
  assert.deepEqual(decodeWorkspaceRelinkBody({ folder: '/other', expectedVersion: 4 }), {
    folder: '/other',
    expectedVersion: 4,
  })
  assert.deepEqual(decodeWorkspaceRemoveBody({ expectedVersion: 5 }), { expectedVersion: 5 })

  for (const call of [
    () => decodeWorkspaceAddBody({ folder: '/project' }),
    () => decodeWorkspaceAddBody({ folder: '/project', expectedVersion: -1 }),
    () => decodeWorkspaceAddBody({ folder: '/project', expectedVersion: 0, extra: 1 }),
    () => decodeWorkspaceSelectBody({ id: 1, expectedVersion: 0 }),
    () => decodeWorkspaceSelectBody({ id: 'default' }),
    () => decodeWorkspaceRenameBody({ name: 'ok', expectedVersion: 1.2 }),
    () => decodeWorkspaceRelinkBody({ folder: '/a', expectedVersion: 0, extra: true }),
    () => decodeWorkspaceRemoveBody({}),
    () => decodeWorkspaceRemoveBody({ expectedVersion: 0, extra: true }),
  ]) {
    assert.throws(call, error => error instanceof RequestValidationError && error.code === 'INVALID_REQUEST')
  }
})

test('provider write bodies require a non-negative expectedVersion and keep the other fields', () => {
  assert.deepEqual(decodeProviderSaveBody({ displayName: 'A', models: [], expectedVersion: 3 }), {
    provider: { displayName: 'A', models: [] },
    expectedVersion: 3,
  })
  assert.deepEqual(decodeProviderRemoveBody({ expectedVersion: 0 }), { expectedVersion: 0 })
  const invalid = error => error instanceof RequestValidationError && error.code === 'INVALID_REQUEST'
  for (const value of [
    undefined,
    null,
    [],
    'x',
    { displayName: 'A' },
    { expectedVersion: -1 },
    { expectedVersion: 1.5 },
    { expectedVersion: '1' },
  ])
    assert.throws(() => decodeProviderSaveBody(value), invalid)
  for (const value of [undefined, {}, { expectedVersion: -1 }, { expectedVersion: 0, extra: true }])
    assert.throws(() => decodeProviderRemoveBody(value), invalid)
})
