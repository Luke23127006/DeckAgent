/**
 * Tests DeckWorkflowError and mapDeckError HTTP status and detail mapping contracts, plus DeckService confirmation error translation.
 * Environment: pure Node.js unit test importing compiled deck module exports, @deckagent/deck DeckError, and ChatError.
 * Faults caught during mutant verification:
 * - Changing OUTLINE_NOT_FOUND restore-outline-missing from 404 to 409 failed the error mapping test.
 * - Omitting DESIGN_SYSTEM_NOT_FOUND or narrowing confirm() try/catch failed the error mapping and confirmation translation tests.
 * Run: node --test apps/host/tests/deck-errors.test.mjs
 * Expected values source: docs/build/refactor/naming-and-grouping/module-map.md (modules/deck/) and existing deck HTTP contract.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { DeckError } from '@deckagent/deck'
import { ChatError } from '../lib/types/modules/chats/index.js'
import { DeckService, DeckWorkflowError, mapDeckError } from '../lib/types/modules/deck/index.js'

test('DeckWorkflowError and mapDeckError preserve HTTP statuses, reasons and detail fields', () => {
  const cases = [
    ['BRIEF_INVALID', 400],
    ['CONFIRMATION_INVALID', 400],
    ['DESIGN_LAYOUT_INCOMPATIBLE', 400],
    ['DESIGN_SYSTEM_NOT_FOUND', 400],
    ['DESIGN_THEME_INVALID', 400],
    ['SESSION_NOT_FOUND', 404],
    ['SOURCE_NOT_FOUND', 404],
    ['BRIEF_NOT_FOUND', 404],
    ['OUTLINE_NOT_FOUND', 409],
    ['BRIEF_LOCKED', 409],
    ['BRIEF_STALE', 409],
    ['OUTLINE_STALE', 409],
    ['OUTLINE_ALREADY_CONFIRMED', 409],
    ['SESSION_BUSY', 409],
    ['GENERATION_INCOMPLETE', 409],
    ['CONFIRMATION_CONFLICT', 409],
    ['SOURCE_UNAVAILABLE', 409],
    ['GENERATION_MODEL_CHANGED', 409],
    ['GENERATION_UNAVAILABLE', 503],
    ['BRIEF_UNAVAILABLE', 500],
    ['CONFIRMATION_UNAVAILABLE', 500],
    ['DECK_PLAN_CONFLICT', 500],
    ['GENERATION_FAILED', 500],
  ]

  for (const [code, status] of cases) {
    assert.deepEqual(mapDeckError(new DeckWorkflowError(code)), { status, code })
  }

  assert.deepEqual(mapDeckError(new DeckWorkflowError('OUTLINE_NOT_FOUND', undefined, 'restore-outline-missing')), {
    status: 404,
    code: 'OUTLINE_NOT_FOUND',
  })
  assert.deepEqual(mapDeckError(new DeckWorkflowError('OUTLINE_NOT_FOUND', undefined, 'current-outline-required')), {
    status: 409,
    code: 'OUTLINE_NOT_FOUND',
  })
  assert.deepEqual(mapDeckError(new DeckWorkflowError('BRIEF_INVALID', { field: 'purpose', required: true })), {
    status: 400,
    code: 'BRIEF_INVALID',
    detail: { field: 'purpose', required: true },
  })

  assert.deepEqual(mapDeckError(new DeckError('OUTLINE_STALE')), { status: 409, code: 'OUTLINE_STALE' })
  assert.deepEqual(mapDeckError(new DeckError('DECK_CONTENT_NOT_FOUND')), {
    status: 404,
    code: 'DECK_CONTENT_NOT_FOUND',
  })
  assert.equal(mapDeckError(new DeckError('DECK_CORRUPT')), undefined)
  assert.equal(mapDeckError(new Error('unrelated')), undefined)
})

test('DeckService.confirm translates DeckError and unexpected failures while preserving ChatError from readSelection', async () => {
  const validTarget = {
    confirmationId: 'confirm-1',
    outlineId: 'outline-1',
    outlineVersion: 1,
    briefId: 'brief-1',
    briefVersion: 1,
  }
  const baseDeps = {
    chats: { getInfo: async () => ({ workspaceId: null }), history: async () => [] },
    attachments: { sent: () => [] },
    runs: {
      activeFor: () => undefined,
      get: () => undefined,
      text: () => '',
      sourceCatalogue: () => [],
      researchSources: () => [],
    },
    runStarter: { start: async () => ({ requestId: 'req-1' }) },
    sourceTools: {
      prepare: async () => ({
        context: '',
        manifest: '',
        schemas: [],
        executor: { execute: async () => ({ isError: false, content: [] }) },
      }),
    },
    runtimeAvailability: async () => ({ available: true }),
    preflightResearch: async () => {},
  }

  const corruptService = new DeckService({
    ...baseDeps,
    decks: {
      generation: () => {
        throw new DeckError('DECK_CORRUPT')
      },
    },
    readSelection: async () => ({ provider: 'p', model: 'm' }),
  })
  await assert.rejects(
    corruptService.confirm('chat-1', validTarget),
    error => error instanceof DeckWorkflowError && error.code === 'DECK_CORRUPT',
  )

  const readyBriefDeck = {
    generation: () => null,
    briefSnapshot: () => ({
      sessionId: 'chat-1',
      version: 1,
      locked: false,
      current: {
        briefId: 'brief-1',
        version: 1,
        draft: { sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] } },
      },
    }),
  }

  const chatErrorService = new DeckService({
    ...baseDeps,
    decks: readyBriefDeck,
    readSelection: async () => {
      throw new ChatError('NO_SELECTABLE_MODEL', { reason: 'no-model' })
    },
  })
  await assert.rejects(
    chatErrorService.confirm('chat-1', validTarget),
    error => error instanceof ChatError && error.code === 'NO_SELECTABLE_MODEL',
  )

  const unexpectedService = new DeckService({
    ...baseDeps,
    decks: readyBriefDeck,
    readSelection: async () => ({ provider: 'p', model: 'm' }),
    runtimeAvailability: async () => {
      throw new Error('boom')
    },
  })
  await assert.rejects(
    unexpectedService.confirm('chat-1', validTarget),
    error => error instanceof DeckWorkflowError && error.code === 'CONFIRMATION_UNAVAILABLE',
  )
})
