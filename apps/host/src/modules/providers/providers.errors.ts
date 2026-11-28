import type { HttpFailureResponse } from '../../http/route-helpers.ts'

export type ProviderErrorCode =
  | 'INVALID_PROVIDER'
  | 'PROVIDER_KEY_REQUIRED'
  | 'PROVIDER_NOT_FOUND'
  | 'MODEL_NOT_SELECTABLE'
  | 'PROVIDER_KEY_UNAVAILABLE'
  | 'PROVIDER_ID_TAKEN'
  | 'PROVIDER_NAME_EXISTS'
  | 'PROVIDERS_STALE'
  | 'PROTOCOL_IMMUTABLE'
  | 'NEW_ENDPOINT_REQUIRES_KEY'
  | 'PROVIDER_KEY_REFUSED'
  | 'PROVIDER_CHECK_FAILED'
  | 'CREDENTIAL_STORE_UNAVAILABLE'
  | 'CATALOG_UNAVAILABLE'
  | 'PROVIDER_NO_ANSWER'
  | 'SETTINGS_STORAGE'
  | 'CREDENTIAL_NOT_SAVED'
  | 'CREDENTIAL_UNAVAILABLE'

const providerStatus: Readonly<Record<ProviderErrorCode, number>> = {
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

export class ProviderError extends Error {
  constructor(
    readonly code: ProviderErrorCode,
    readonly detail?: Readonly<Record<string, string | boolean>>,
  ) {
    super(code)
    this.name = 'ProviderError'
  }
}

export function mapProviderError(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof ProviderError)) return undefined
  return {
    status: providerStatus[error.code],
    code: error.code,
    ...(error.detail ? { detail: error.detail } : {}),
  }
}
