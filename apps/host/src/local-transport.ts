import { HttpError } from '@deckagent/host-api'
import type { HttpErrorDetail, HttpFailureResponse, WebManagement } from '@deckagent/host-api'
import { SessionError, type SqliteSessionStore } from '@deckagent/session-persistence'
import { RequestPreparationFailure } from './features/requests/index.ts'
import type { RequestPreparationFailureCode } from './features/requests/index.ts'
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

const sourceToolStatus: Readonly<Record<string, number>> = {
  SOURCE_ARGUMENTS_INVALID: 400,
  TOOL_NOT_ALLOWED: 403,
  SESSION_NOT_FOUND: 404,
  ATTACHMENT_NOT_FOUND: 404,
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
  if (error instanceof WebStateError) {
    const status =
      error.code === 'PREFERENCES_STALE'
        ? 409
        : error.code === 'INVALID_SELECTION' || error.code === 'INVALID_REQUEST'
          ? 400
          : 500
    return mapFailureEntry(error.code, undefined, status)
  }
  return undefined
}

export type SessionReadManagement = Required<Pick<WebManagement, 'activities' | 'requests'>>

async function requireSession(store: SqliteSessionStore, id: string): Promise<void> {
  if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
}

/** Read endpoints that need an existing chat. Each one rejects an unknown chat before it reads. */
export function sessionReadManagement(store: SqliteSessionStore): SessionReadManagement {
  return {
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
