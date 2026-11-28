import { DeckError } from '@deckagent/deck'
import type { HttpFailureResponse } from '../../http/route-helpers.ts'

export type OutlineNotFoundReason = 'current-outline-required' | 'restore-outline-missing'

export type DeckWorkflowErrorCode =
  | 'BRIEF_INVALID'
  | 'CONFIRMATION_INVALID'
  | 'DESIGN_CONTENT_INVALID'
  | 'DESIGN_FONT_UNAVAILABLE'
  | 'DESIGN_FORMAT_UNAVAILABLE'
  | 'DESIGN_LAYOUT_INCOMPATIBLE'
  | 'DESIGN_SELECTION_INVALID'
  | 'DESIGN_SNAPSHOT_INVALID'
  | 'DESIGN_SYSTEM_NOT_FOUND'
  | 'DESIGN_TEMPLATE_NOT_FOUND'
  | 'DESIGN_THEME_INVALID'
  | 'SESSION_NOT_FOUND'
  | 'SOURCE_NOT_FOUND'
  | 'BRIEF_NOT_FOUND'
  | 'OUTLINE_NOT_FOUND'
  | 'BRIEF_LOCKED'
  | 'BRIEF_STALE'
  | 'OUTLINE_STALE'
  | 'OUTLINE_ALREADY_CONFIRMED'
  | 'OUTLINE_READ_ONLY'
  | 'OUTLINE_LIMIT'
  | 'SESSION_BUSY'
  | 'GENERATION_INCOMPLETE'
  | 'CONFIRMATION_CONFLICT'
  | 'SOURCE_UNAVAILABLE'
  | 'GENERATION_MODEL_CHANGED'
  | 'GENERATION_UNAVAILABLE'
  | 'BRIEF_INCOMPLETE'
  | 'BRIEF_UNAVAILABLE'
  | 'BRIEF_PROPOSAL_REQUIRED'
  | 'CONFIRMATION_UNAVAILABLE'
  | 'GENERATION_FAILED'
  | 'GENERATION_GRANT_REQUIRED'
  | 'GENERATION_GRANT_INVALID'
  | 'GENERATION_SCOPE_INVALID'
  | 'GENERATION_ALREADY_ADMITTED'
  | 'GENERATION_ALREADY_STARTED'
  | 'GENERATION_NOT_FOUND'
  | 'GENERATION_REQUEST_INACTIVE'
  | 'IMAGE_PREPARATION_REQUIRED'
  | 'DECK_CORRUPT'
  | 'DECK_CLOSED'
  | 'DECK_PLAN_CONFLICT'
  | 'DECK_STORAGE'
  | 'DECK_INVALID_ID'

export class DeckWorkflowError extends Error {
  constructor(
    readonly code: DeckWorkflowErrorCode,
    readonly detail?: Readonly<Record<string, string | boolean>>,
    readonly reason?: OutlineNotFoundReason,
  ) {
    super(code)
    this.name = 'DeckWorkflowError'
  }
}

const deckWorkflowStatus: Readonly<Record<DeckWorkflowErrorCode, number>> = {
  BRIEF_INVALID: 400,
  CONFIRMATION_INVALID: 400,
  DESIGN_CONTENT_INVALID: 400,
  DESIGN_FONT_UNAVAILABLE: 400,
  DESIGN_FORMAT_UNAVAILABLE: 400,
  DESIGN_LAYOUT_INCOMPATIBLE: 400,
  DESIGN_SELECTION_INVALID: 400,
  DESIGN_SNAPSHOT_INVALID: 400,
  DESIGN_SYSTEM_NOT_FOUND: 400,
  DESIGN_TEMPLATE_NOT_FOUND: 400,
  DESIGN_THEME_INVALID: 400,
  SESSION_NOT_FOUND: 404,
  SOURCE_NOT_FOUND: 404,
  BRIEF_NOT_FOUND: 404,
  OUTLINE_NOT_FOUND: 409,
  BRIEF_LOCKED: 409,
  BRIEF_STALE: 409,
  OUTLINE_STALE: 409,
  OUTLINE_ALREADY_CONFIRMED: 409,
  OUTLINE_READ_ONLY: 409,
  OUTLINE_LIMIT: 409,
  SESSION_BUSY: 409,
  GENERATION_INCOMPLETE: 409,
  CONFIRMATION_CONFLICT: 409,
  SOURCE_UNAVAILABLE: 409,
  GENERATION_MODEL_CHANGED: 409,
  GENERATION_UNAVAILABLE: 503,
  BRIEF_INCOMPLETE: 500,
  BRIEF_UNAVAILABLE: 500,
  BRIEF_PROPOSAL_REQUIRED: 500,
  CONFIRMATION_UNAVAILABLE: 500,
  GENERATION_FAILED: 500,
  GENERATION_GRANT_REQUIRED: 500,
  GENERATION_GRANT_INVALID: 500,
  GENERATION_SCOPE_INVALID: 500,
  GENERATION_ALREADY_ADMITTED: 500,
  GENERATION_ALREADY_STARTED: 500,
  GENERATION_NOT_FOUND: 500,
  GENERATION_REQUEST_INACTIVE: 500,
  IMAGE_PREPARATION_REQUIRED: 500,
  DECK_CORRUPT: 500,
  DECK_CLOSED: 500,
  DECK_PLAN_CONFLICT: 500,
  DECK_STORAGE: 500,
  DECK_INVALID_ID: 500,
}

export function deckWorkflowErrorCode(value: unknown): DeckWorkflowErrorCode | undefined {
  if (typeof value !== 'string' || !Object.hasOwn(deckWorkflowStatus, value)) return undefined
  return Object.keys(deckWorkflowStatus).find((code): code is DeckWorkflowErrorCode => code === value)
}

export function mapDeckError(error: unknown): HttpFailureResponse | undefined {
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
  if (error instanceof DeckWorkflowError) {
    const status =
      error.code === 'OUTLINE_NOT_FOUND' && error.reason === 'restore-outline-missing'
        ? 404
        : deckWorkflowStatus[error.code]
    return { status, code: error.code, ...(error.detail ? { detail: error.detail } : {}) }
  }
  return undefined
}
