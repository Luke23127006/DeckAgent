import type { HttpFailureResponse } from '../../http/route-helpers.ts'

export type SettingsErrorCode = 'PREFERENCES_STALE'

export class SettingsError extends Error {
  constructor(readonly code: SettingsErrorCode) {
    super(code)
    this.name = 'SettingsError'
  }
}

const settingsStatus: Readonly<Record<SettingsErrorCode, number>> = {
  PREFERENCES_STALE: 409,
}

export function mapSettingsError(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof SettingsError)) return undefined
  return { status: settingsStatus[error.code], code: error.code }
}
