import type { HttpFailureResponse } from '../../http/route-helpers.ts'

export type ResearchErrorCode =
  | 'INVALID_REQUEST'
  | 'PREFERENCES_STALE'
  | 'SOURCE_ARGUMENTS_INVALID'
  | 'SESSION_NOT_FOUND'
  | 'RESEARCH_KEY_UNAVAILABLE'
  | 'RESEARCH_KEY_REJECTED'
  | 'RESEARCH_QUOTA_EXHAUSTED'
  | 'RESEARCH_FREE_ONLY'
  | 'RESEARCH_RESPONSE_TOO_LARGE'
  | 'RESEARCH_UNAVAILABLE'
  | 'RESEARCH_NOT_SAVED'

export class ResearchError extends Error {
  constructor(
    readonly code: ResearchErrorCode,
    readonly detail?: Readonly<Record<string, string | boolean>>,
  ) {
    super(code)
    this.name = 'ResearchError'
  }
}

const researchStatus: Readonly<Record<ResearchErrorCode, number>> = {
  INVALID_REQUEST: 400,
  PREFERENCES_STALE: 409,
  SOURCE_ARGUMENTS_INVALID: 400,
  SESSION_NOT_FOUND: 404,
  RESEARCH_KEY_UNAVAILABLE: 503,
  RESEARCH_KEY_REJECTED: 503,
  RESEARCH_QUOTA_EXHAUSTED: 503,
  RESEARCH_FREE_ONLY: 503,
  RESEARCH_RESPONSE_TOO_LARGE: 503,
  RESEARCH_UNAVAILABLE: 503,
  RESEARCH_NOT_SAVED: 500,
}

export function mapResearchError(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof ResearchError)) return undefined
  return {
    status: researchStatus[error.code],
    code: error.code,
    ...(error.detail ? { detail: error.detail } : {}),
  }
}
