import type { HttpFailureResponse } from '@deckagent/host-api'
import { ResearchFailure } from './research.service.ts'

const researchStatus: Readonly<Record<string, number>> = {
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

export function mapResearchFailure(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof ResearchFailure)) return undefined
  return {
    status: researchStatus[error.code] ?? 500,
    code: error.code,
    ...(error.detail ? { detail: error.detail } : {}),
  }
}
