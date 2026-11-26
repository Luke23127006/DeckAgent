import { DeckError } from '@deckagent/deck'
import { HttpError } from '@deckagent/host-api'
import type { HttpErrorDetail, HttpFailureResponse, WebManagement } from '@deckagent/host-api'
import { SessionError, type SqliteSessionStore } from '@deckagent/session-persistence'
import { DeckWorkflowFailure } from './features/deck/index.ts'
import { RequestPreparationFailure } from './features/requests/index.ts'
import type { RequestPreparationFailureCode } from './features/requests/index.ts'
import { ResearchFailure, type ResearchCoordinator } from './features/research/index.ts'
import { SourceToolFailure } from './features/sources/index.ts'
import { WebStateError } from './web-state.ts'

const requestPreparationStatus: Readonly<Record<RequestPreparationFailureCode, number>> = {
  SESSION_NOT_FOUND: 404,
  CHAT_UNREADABLE: 409,
  NO_SELECTABLE_MODEL: 409,
  SESSION_UNAVAILABLE: 500,
  RUNTIME_UNAVAILABLE: 503,
  RUNTIME_VERSION_UNSUPPORTED: 503,
}

const researchStatus: Readonly<Record<string, number>> = {
  INVALID_REQUEST: 400,
  SOURCE_ARGUMENTS_INVALID: 400,
  RESEARCH_KEY_UNAVAILABLE: 503,
  RESEARCH_KEY_REJECTED: 503,
  RESEARCH_QUOTA_EXHAUSTED: 503,
  RESEARCH_FREE_ONLY: 503,
  RESEARCH_RESPONSE_TOO_LARGE: 503,
  RESEARCH_UNAVAILABLE: 503,
  RESEARCH_NOT_SAVED: 500,
}

const sourceToolStatus: Readonly<Record<string, number>> = {
  SOURCE_ARGUMENTS_INVALID: 400,
  TOOL_NOT_ALLOWED: 403,
  SESSION_NOT_FOUND: 404,
  ATTACHMENT_NOT_FOUND: 404,
}

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

function mapFailureEntry(code: string, detail: HttpErrorDetail | undefined, status: number): HttpFailureResponse {
  return { status, code, ...(detail ? { detail } : {}) }
}

function featureFailure<E extends { readonly code: string; readonly detail?: HttpErrorDetail | undefined }>(
  errorType: new (...args: never[]) => E,
  statusOf: (error: E) => number,
): (error: unknown) => HttpFailureResponse | undefined {
  return error => {
    if (!(error instanceof errorType)) return undefined
    return mapFailureEntry(error.code, error.detail, statusOf(error))
  }
}

const featureFailures = [
  featureFailure(RequestPreparationFailure, error => requestPreparationStatus[error.code]),
  featureFailure(ResearchFailure, error => researchStatus[error.code] ?? 500),
  featureFailure(SourceToolFailure, error => sourceToolStatus[error.code] ?? 500),
]

/** Maps application workflow and domain failures to HTTP responses without exposing internal details. */
export function mapApplicationFailure(error: unknown): HttpFailureResponse | undefined {
  for (const failure of featureFailures) {
    const response = failure(error)
    if (response) return response
  }
  if (error instanceof SessionError) {
    if (error.code === 'SESSION_NOT_FOUND') return { status: 404, code: 'SESSION_NOT_FOUND' }
    if (error.code === 'SESSION_CORRUPT') return { status: 409, code: 'CHAT_UNREADABLE' }
    if (error.code === 'DRAFT_TOO_LARGE') return { status: 413, code: 'DRAFT_TOO_LARGE' }
    return undefined
  }
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
  if (error instanceof DeckWorkflowFailure) return mapFailureEntry(error.code, error.detail, deckWorkflowStatus(error))
  if (error instanceof WebStateError) {
    const status = error.code === 'INVALID_SELECTION' || error.code === 'INVALID_REQUEST' ? 400 : 500
    return mapFailureEntry(error.code, undefined, status)
  }
  return undefined
}

export type SessionReadManagement = Required<Pick<WebManagement, 'research' | 'activities' | 'requests'>>

async function requireSession(store: SqliteSessionStore, id: string): Promise<void> {
  if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
}

/** Read endpoints that need an existing chat. Each one rejects an unknown chat before it reads. */
export function sessionReadManagement(store: SqliteSessionStore, research: ResearchCoordinator): SessionReadManagement {
  return {
    research: {
      save: value => research.save(value),
      remove: () => research.remove(),
      sources: async id => {
        await requireSession(store, id)
        return store.requests.researchSources(id)
      },
    },
    activities: async id => {
      await requireSession(store, id)
      return store.requests.activities(id)
    },
    requests: async id => {
      await requireSession(store, id)
      return store.requests.list(id)
    },
  }
}
