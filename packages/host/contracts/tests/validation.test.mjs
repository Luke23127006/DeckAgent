/**
 * Tests: host/contracts Zod decoders validate wire payloads and throw typed or expected errors on invalid input.
 * Environment: compiled @deckagent/host-contracts lib/index.js in Node.js with zero external I/O.
 * Fault check: removing a schema constraint or cross-field guard lets invalid payloads pass without throwing the expected error code or message.
 * Run: node --test --test-reporter=tap packages/host/contracts/tests/validation.test.mjs
 * Expected values source: packages/host/contracts/src/request-validation.ts, brief-validation.ts, outline-validation.ts, generation-validation.ts, chat-list-validation.ts, deck-validation.ts.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeAgentRequest,
  decodeApprovalDecisionBody,
  decodeAttachment,
  decodeAttachmentRemoveBody,
  decodeBoundProposal,
  decodeBriefView,
  decodeChangeNotice,
  decodeChatCreateBody,
  decodeChatDraft,
  decodeChatList,
  decodeHistory,
  decodeRequestSnapshot,
  decodeResearchSources,
  decodeStoredActivities,
  decodeStoredRequests,
  decodeChatSearchBody,
  decodeConfirmationResult,
  decodeDeckChange,
  decodeDeckSnapshot,
  decodeInterview,
  decodeOutlineSnapshot,
  decodeSlideContent,
  decodeDraftSaveBody,
  decodeGeneration,
  decodeModelSelection,
  decodePreferencesSaveBody,
  decodeResearchSaveBody,
  decodeResearchRemoveBody,
  decodeProviderRemoveBody,
  decodeProviderSaveBody,
  decodeWorkspaceAddBody,
  decodeWorkspaceList,
  decodeWorkspaceRelinkBody,
  decodeWorkspaceRemoveBody,
  decodeWorkspaceRenameBody,
  decodeWorkspaceSelectBody,
  providerProtocols,
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

test('draft save and attachment remove decoders require expectedRevision and keep draft length checks for the store', () => {
  assert.deepEqual(decodeDraftSaveBody({ text: 'x'.repeat(16001), expectedRevision: 0 }), {
    text: 'x'.repeat(16001),
    expectedRevision: 0,
  })
  assert.deepEqual(decodeDraftSaveBody({ text: 'ok', expectedRevision: 2, attachmentIds: [attachmentOne] }), {
    text: 'ok',
    expectedRevision: 2,
    attachmentIds: [attachmentOne],
  })
  assert.deepEqual(decodeAttachmentRemoveBody({ expectedRevision: 1 }), { expectedRevision: 1 })
  const invalid = error => error instanceof RequestValidationError && error.code === 'INVALID_REQUEST'
  for (const value of [
    undefined,
    null,
    { text: 'ok' },
    { text: 'ok', expectedRevision: -1 },
    { text: 'ok', expectedRevision: 1.5 },
    { text: 'ok', expectedRevision: '0' },
    { text: 'ok', expectedRevision: 0, extra: true },
    { text: 'ok', expectedRevision: 0, attachmentIds: ['a', 'a'] },
    { text: '\uD800', expectedRevision: 0 },
  ])
    assert.throws(() => decodeDraftSaveBody(value), invalid)
  for (const value of [undefined, {}, { expectedRevision: -1 }, { expectedRevision: 0, extra: true }])
    assert.throws(() => decodeAttachmentRemoveBody(value), invalid)
})

test('preferences and research decoders require expectedVersion and reject malformed bodies', () => {
  assert.deepEqual(decodePreferencesSaveBody({ theme: 'dark', expectedVersion: 0 }), {
    theme: 'dark',
    expectedVersion: 0,
  })
  assert.deepEqual(decodeResearchSaveBody({ key: 'secret-key', expectedVersion: 1 }), {
    key: 'secret-key',
    expectedVersion: 1,
  })
  assert.deepEqual(decodeResearchSaveBody({ useEnvironment: true, expectedVersion: 2 }), {
    useEnvironment: true,
    expectedVersion: 2,
  })
  assert.deepEqual(decodeResearchRemoveBody({ expectedVersion: 3 }), { expectedVersion: 3 })
  const invalid = error => error instanceof RequestValidationError && error.code === 'INVALID_REQUEST'
  for (const value of [
    undefined,
    { theme: 'dark' },
    { theme: 'neon', expectedVersion: 0 },
    { theme: 'dark', expectedVersion: -1 },
    { theme: 'dark', expectedVersion: 0, extra: 1 },
  ])
    assert.throws(() => decodePreferencesSaveBody(value), invalid)
  for (const value of [
    undefined,
    { key: 'ok' },
    { key: '   ', expectedVersion: 0 },
    { key: 'x'.repeat(4097), expectedVersion: 0 },
    { useEnvironment: true, key: 'ok', expectedVersion: 0 },
    { useEnvironment: false, expectedVersion: 0 },
    { useEnvironment: true, expectedVersion: -1 },
    { useEnvironment: true, expectedVersion: 0, extra: 1 },
  ])
    assert.throws(() => decodeResearchSaveBody(value), invalid)
  for (const value of [undefined, {}, { expectedVersion: -1 }, { expectedVersion: 0, extra: 1 }])
    assert.throws(() => decodeResearchRemoveBody(value), invalid)
})

test('chat and approval body decoders validate wire shapes and throw the expected validation codes', () => {
  assert.deepEqual(decodeModelSelection({ provider: 'openai', model: 'gpt-4o' }), {
    provider: 'openai',
    model: 'gpt-4o',
  })
  assert.deepEqual(decodeChatCreateBody({}), {})
  assert.deepEqual(decodeChatCreateBody({ selection: { provider: 'openai', model: 'gpt-4o' } }), {
    selection: { provider: 'openai', model: 'gpt-4o' },
  })
  assert.deepEqual(decodeChatSearchBody({ words: '' }), { words: '' })
  assert.deepEqual(decodeChatSearchBody({ words: 'x'.repeat(500) }), { words: 'x'.repeat(500) })
  assert.deepEqual(decodeApprovalDecisionBody({ decision: 'allow-once' }), { decision: 'allow-once' })
  assert.deepEqual(decodeApprovalDecisionBody({ decision: 'refuse' }), { decision: 'refuse' })

  const hasCode = code => error => error instanceof RequestValidationError && error.code === code
  for (const bad of [undefined, null, [], 'text', { extra: 1 }, { selection: { provider: 'p', model: 'm' }, extra: 1 }])
    assert.throws(() => decodeChatCreateBody(bad), hasCode('INVALID_SESSION'))
  for (const bad of [
    null,
    [],
    {},
    { provider: 'bad space', model: 'm' },
    { provider: 'p'.repeat(101), model: 'm' },
    { provider: 'p', model: '   ' },
    { provider: 'p', model: 'm'.repeat(201) },
    { provider: 'p', model: 'm', extra: 1 },
  ]) {
    assert.throws(() => decodeModelSelection(bad), hasCode('INVALID_SELECTION'))
    assert.throws(() => decodeChatCreateBody({ selection: bad }), hasCode('INVALID_SELECTION'))
  }
  for (const bad of [undefined, null, [], {}, { words: 123 }, { words: 'x'.repeat(501) }, { words: 'ok', extra: 1 }])
    assert.throws(() => decodeChatSearchBody(bad), hasCode('INVALID_REQUEST'))
  for (const bad of [undefined, null, [], {}, { decision: 'allow' }, { decision: 'refuse', extra: 1 }])
    assert.throws(() => decodeApprovalDecisionBody(bad), hasCode('INVALID_REQUEST'))
})

test('providerProtocols lists the four API protocols of BR-005 V-4', () => {
  assert.deepEqual([...providerProtocols], ['chat-completions', 'responses', 'anthropic-messages', 'gemini'])
})

test('decodeChatList keeps the listed chat fields and refuses a chat without a workspace field', () => {
  const chat = {
    sessionId: 's1',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
    messageCount: 2,
    selectable: true,
    workspaceId: null,
    readable: true,
    title: 'Kế hoạch',
    hasDraft: false,
    selection: { provider: 'river', model: 'deepseek' },
    removedSelection: 'old',
  }
  assert.deepEqual(decodeChatList([chat]), [
    {
      sessionId: 's1',
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-02T00:00:00.000Z',
      messageCount: 2,
      selectable: true,
      workspaceId: null,
      readable: true,
      title: 'Kế hoạch',
      selection: { provider: 'river', model: 'deepseek' },
    },
  ])
  const { workspaceId: _workspaceId, ...withoutWorkspace } = chat
  for (const bad of [undefined, {}, [withoutWorkspace], [{ ...chat, readable: 'yes' }]])
    assert.throws(() => decodeChatList(bad), { message: 'INVALID_RESPONSE' })
})

test('decodeWorkspaceList accepts the four folder states and refuses a negative version', () => {
  const list = {
    selectedId: 'default',
    version: 3,
    workspaces: [{ id: 'default', name: 'Mặc định', folder: null, isDefault: true, folderStatus: 'none' }],
  }
  assert.deepEqual(decodeWorkspaceList(list), list)
  for (const bad of [
    { ...list, version: -1 },
    { ...list, workspaces: [{ ...list.workspaces[0], folderStatus: 'gone' }] },
    { ...list, selectedId: 1 },
  ])
    assert.throws(() => decodeWorkspaceList(bad), { message: 'INVALID_RESPONSE' })
})

test('decodeRequestSnapshot keeps a pending approval of the same request and refuses one of another request', () => {
  const approval = {
    approvalId: 'a1',
    requestId: 'r1',
    operation: 'read-file',
    target: 'C:/notes.txt',
    reason: 'Đọc ghi chú',
    state: 'pending',
  }
  const snapshot = { requestId: 'r1', sessionId: 's1', status: 'active', text: 'Partial', sequence: 3 }
  assert.deepEqual(decodeRequestSnapshot({ ...snapshot, pendingApproval: approval }), {
    ...snapshot,
    pendingApproval: approval,
  })
  assert.deepEqual(decodeRequestSnapshot({ ...snapshot, status: 'failed', errorCode: 'RUNTIME_FAILED' }), {
    ...snapshot,
    status: 'failed',
    errorCode: 'RUNTIME_FAILED',
  })
  for (const bad of [
    { ...snapshot, pendingApproval: { ...approval, requestId: 'r2' } },
    { ...snapshot, status: 'done' },
    { ...snapshot, sequence: -1 },
    { ...snapshot, errorCode: 'raw provider message' },
  ])
    assert.throws(() => decodeRequestSnapshot(bad), { message: 'INVALID_RESPONSE' })
})

test('decodeHistory keeps the public message fields and refuses tool fields on a user message', () => {
  const history = [
    { role: 'user', content: 'Xin chào' },
    { role: 'assistant', content: 'Phần đầu', interrupted: true },
    { role: 'tool', content: 'ok', toolCallId: 'call-1', name: 'read_source', isError: false },
  ]
  assert.deepEqual(decodeHistory(history), history)
  for (const bad of [
    {},
    [{ role: 'system', content: 'x' }],
    [{ role: 'user', content: 'x', interrupted: true }],
    [{ role: 'user', content: 'x', name: 'read_source' }],
    [{ role: 'assistant', content: 'x', attachments: [] }],
  ])
    assert.throws(() => decodeHistory(bad), { message: 'INVALID_RESPONSE' })
})

test('decodeStoredRequests and decodeStoredActivities keep the saved records and refuse an unknown status', () => {
  const request = {
    requestId: 'r1',
    sessionId: 's1',
    status: 'completed',
    selection: { provider: 'fixture', model: 'm' },
    historyStart: 0,
    startedAt: '2026-11-01T00:00:00.000Z',
    endedAt: '2026-11-01T00:00:01.000Z',
    lastSequence: 4,
    summarized: true,
    publicResearch: false,
  }
  assert.deepEqual(decodeStoredRequests([request]), [request])
  assert.throws(() => decodeStoredRequests([{ ...request, status: 'done' }]), { message: 'INVALID_RESPONSE' })
  const activity = { id: 'a1', label: 'Model response', requestId: 'r1', sequence: 1, type: 'model', status: 'running' }
  assert.deepEqual(decodeStoredActivities([activity]), [activity])
  assert.throws(() => decodeStoredActivities([{ ...activity, type: 'agent' }]), { message: 'INVALID_RESPONSE' })
})

test('decodeChatDraft accepts a legacy text draft and refuses attachment ids that do not match the attachments', () => {
  assert.deepEqual(decodeChatDraft({ sessionId: 's1', text: 'Nháp' }, 's1'), { sessionId: 's1', text: 'Nháp' })
  const draft = { sessionId: 's1', text: '', revision: 2, attachmentIds: [], attachments: [] }
  assert.deepEqual(decodeChatDraft(draft, 's1'), draft)
  for (const [bad, id] of [
    [draft, 's2'],
    [{ ...draft, attachmentIds: ['att-1'] }, 's1'],
    [{ sessionId: 's1', text: '', revision: 2 }, 's1'],
  ])
    assert.throws(() => decodeChatDraft(bad, id), { message: 'INVALID_RESPONSE' })
})

test('decodeResearchSources keeps http and https excerpts and refuses another scheme', () => {
  const source = {
    title: 'Báo cáo',
    url: 'https://example.org/report',
    content: '<script>x</script>',
    sourceId: 'research-1',
    retrievedAt: '2026-11-01T00:00:00.000Z',
  }
  assert.deepEqual(decodeResearchSources([source]), [source])
  assert.throws(() => decodeResearchSources([{ ...source, url: 'javascript:alert(1)' }]), {
    message: 'INVALID_RESPONSE',
  })
})

test('decodeDeckSnapshot and decodeDeckChange keep the deck of the chat and refuse a slide status that does not match', () => {
  const deck = {
    sessionId,
    deckId: sessionId,
    outlineId: 'out-1',
    version: 2,
    slides: [
      { slideId: 'a', title: 'Intro', order: 0, revision: 1, status: 'published' },
      { slideId: 'b', title: 'Next', order: 1, revision: 0, status: 'pending' },
    ],
  }
  assert.deepEqual(decodeDeckSnapshot(deck, sessionId), deck)
  assert.deepEqual(decodeDeckChange({ sessionId, deckId: sessionId, version: 3 }, sessionId), {
    sessionId,
    deckId: sessionId,
    version: 3,
  })
  assert.deepEqual(decodeDeckSnapshot({ ...deck, version: 0, outlineId: null, slides: [] }, sessionId).slides, [])
  for (const bad of [
    { ...deck, sessionId: 'other' },
    { ...deck, slides: [{ ...deck.slides[0], status: 'pending' }] },
    { ...deck, slides: [deck.slides[0], { ...deck.slides[1], order: 0 }] },
    { ...deck, version: 0 },
    { ...deck, generation: { state: 'generating' } },
  ])
    assert.throws(() => decodeDeckSnapshot(bad, sessionId), { message: 'INVALID_RESPONSE' })
})

test('decodeSlideContent keeps the HTML of the asked revision and refuses another revision or an unsafe credit', () => {
  const content = { sessionId, slideId: 'a', revision: 1, html: '<h1>Intro</h1>', notes: 'Say hello' }
  assert.deepEqual(decodeSlideContent(content, sessionId, 'a', 1), content)
  const credit = {
    url: 'https://example.org/image',
    author: 'A',
    licenseUrl: 'https://example.org/license',
    license: 'CC0',
    unknownLicense: false,
    retrievedAt: '2026-11-01T00:00:00.000Z',
  }
  assert.deepEqual(decodeSlideContent({ ...content, imageCredits: [credit] }, sessionId, 'a', 1).imageCredits, [credit])
  for (const bad of [
    { ...content, revision: 2 },
    { ...content, html: 7 },
    { ...content, imageCredits: [{ ...credit, url: 'http://example.org/image' }] },
    { ...content, imageCredits: [{ ...credit, unknownLicense: true }] },
    { ...content, document: { slideId: 'a' } },
  ])
    assert.throws(() => decodeSlideContent(bad, sessionId, 'a', 1), { message: 'INVALID_RESPONSE' })
})

test('decodeOutlineSnapshot keeps the proposals in version order and refuses a current id without its proposal', () => {
  const proposal = {
    outlineId: 'out-1',
    requestId: 'req-1',
    version: 1,
    responseIndex: 1,
    overview: 'Overview',
    status: 'current',
    slides: [{ slideId: 's1', title: 'Intro', content: 'Hello' }],
  }
  const snapshot = { sessionId, active: true, version: 1, currentId: 'out-1', confirmedId: null, proposals: [proposal] }
  assert.deepEqual(decodeOutlineSnapshot(snapshot, sessionId), snapshot)
  const empty = { sessionId, active: false, version: 0, currentId: null, confirmedId: null, proposals: [] }
  assert.deepEqual(decodeOutlineSnapshot(empty, sessionId), empty)
  for (const bad of [
    { ...snapshot, currentId: 'out-2' },
    { ...snapshot, version: 0 },
    { ...snapshot, proposals: [{ ...proposal, slides: [] }] },
    { ...empty, proposals: [proposal] },
  ])
    assert.throws(() => decodeOutlineSnapshot(bad, sessionId), { message: 'INVALID_RESPONSE' })
})

test('decodeInterview keeps the questions and refuses a ready interview that still asks a question', () => {
  const brief = { sessionId, version: 0, current: null, locked: false, sourceStates: [] }
  const question = { topic: 'audience', prompt: 'Ai nghe?', suggestions: ['Sinh viên'], required: true }
  const state = {
    questions: [question],
    blockers: [],
    readyForOutline: false,
    skipAllowed: true,
    notice: 'Cần trả lời',
  }
  const decoded = decodeInterview({ brief, state }, sessionId)
  assert.deepEqual(decoded.state, state)
  assert.equal(decoded.brief.version, 0)
  for (const bad of [
    { brief, state: { ...state, readyForOutline: true } },
    { brief, state: { ...state, questions: [{ ...question, topic: 'colour' }] } },
    { brief, state: { ...state, questions: [question, question] } },
    { brief: { ...brief, sessionId: 'other' }, state },
  ])
    assert.throws(() => decodeInterview(bad, sessionId), { message: 'INVALID_RESPONSE' })
})

test('decodeConfirmationResult keeps the request of the receipt and refuses a receipt for another Outline version', () => {
  const target = {
    confirmationId: 'conf-1',
    outlineId: 'out-1',
    outlineVersion: 2,
    briefId: 'brief-1',
    briefVersion: 1,
  }
  const receipt = {
    ...target,
    sessionId,
    deckId: sessionId,
    intentId: 'intent-1',
    requestId: 'req-1',
    fingerprint: shaOne,
    createdAt: '2026-11-01T00:00:00.000Z',
  }
  const request = { requestId: 'req-1', sessionId, status: 'active', text: '', sequence: 0 }
  assert.deepEqual(decodeConfirmationResult({ receipt, request }, sessionId, target), { receipt, request })
  for (const bad of [
    { receipt: { ...receipt, outlineVersion: 1 }, request },
    { receipt, request: { ...request, requestId: 'req-2' } },
    { receipt, request: { ...request, status: 'queued' } },
    { receipt: { ...receipt, fingerprint: 'x' }, request },
  ])
    assert.throws(() => decodeConfirmationResult(bad, sessionId, target), { message: 'INVALID_RESPONSE' })
})
