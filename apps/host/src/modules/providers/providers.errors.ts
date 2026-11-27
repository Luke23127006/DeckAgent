import type { HttpFailureResponse } from '../../http/route-helpers.ts'
import { ProviderFailure } from './providers.service.ts'

const providerStatus: Readonly<Record<string, number>> = {
  INVALID_PROVIDER: 400,
  PROVIDER_KEY_REQUIRED: 400,
  PROVIDER_NOT_FOUND: 404,
  MODEL_NOT_SELECTABLE: 409,
  PROVIDER_KEY_UNAVAILABLE: 409,
  PROVIDER_ID_TAKEN: 409,
  PROVIDER_NAME_EXISTS: 409,
  PROVIDERS_STALE: 409,
  PROTOCOL_IMMUTABLE: 409,
  NEW_ENDPOINT_REQUIRES_KEY: 409,
  PROVIDER_KEY_REFUSED: 422,
  PROVIDER_CHECK_FAILED: 422,
  CREDENTIAL_STORE_UNAVAILABLE: 422,
  CATALOG_UNAVAILABLE: 502,
  PROVIDER_NO_ANSWER: 504,
  SETTINGS_STORAGE: 500,
  CREDENTIAL_NOT_SAVED: 500,
  CREDENTIAL_UNAVAILABLE: 500,
}

export function mapProviderFailure(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof ProviderFailure)) return undefined
  return {
    status: providerStatus[error.code] ?? 500,
    code: error.code,
    ...(error.detail ? { detail: error.detail } : {}),
  }
}
