import { DeckError } from '@deckagent/deck'
import type { HttpFailureResponse } from '@deckagent/host-api'
import { DeckWorkflowFailure } from './failures.ts'

const deckWorkflowStatus = (error: DeckWorkflowFailure): number => {
  if (error.code === 'OUTLINE_NOT_FOUND') return error.reason === 'restore-outline-missing' ? 404 : 409
  if (error.code === 'BRIEF_INVALID' || error.code === 'CONFIRMATION_INVALID' || error.code.startsWith('DESIGN_'))
    return 400
  if (error.code === 'SESSION_NOT_FOUND' || error.code === 'SOURCE_NOT_FOUND' || error.code === 'BRIEF_NOT_FOUND')
    return 404
  if (
    [
      'BRIEF_LOCKED',
      'BRIEF_STALE',
      'OUTLINE_STALE',
      'OUTLINE_ALREADY_CONFIRMED',
      'SESSION_BUSY',
      'GENERATION_INCOMPLETE',
      'CONFIRMATION_CONFLICT',
      'SOURCE_UNAVAILABLE',
      'GENERATION_MODEL_CHANGED',
    ].includes(error.code)
  )
    return 409
  if (error.code === 'GENERATION_UNAVAILABLE') return 503
  return 500
}

export function mapDeckFailure(error: unknown): HttpFailureResponse | undefined {
  if (error instanceof DeckError) {
    if (
      error.code === 'OUTLINE_STALE' ||
      error.code === 'OUTLINE_ALREADY_CONFIRMED' ||
      error.code === 'OUTLINE_READ_ONLY' ||
      error.code === 'OUTLINE_LIMIT'
    )
      return { status: 409, code: error.code }
    if (error.code === 'DECK_CONTENT_NOT_FOUND') return { status: 404, code: error.code }
  }
  if (error instanceof DeckWorkflowFailure)
    return { status: deckWorkflowStatus(error), code: error.code, ...(error.detail ? { detail: error.detail } : {}) }
  return undefined
}
