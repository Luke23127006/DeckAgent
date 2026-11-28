import { decodePreferences } from '@deckagent/host-contracts'
import type { BackgroundId, WebPreferences } from '@deckagent/host-contracts'
import { apiJson } from './client.ts'

export const preferencesKeys = { all: ['preferences'] as const }

export function getPreferences(signal?: AbortSignal) {
  return apiJson('/api/preferences', decodePreferences, { signal: signal ?? null })
}

function savePreferences(body: Readonly<Record<string, unknown>>) {
  return apiJson('/api/preferences', decodePreferences, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function saveTheme(theme: WebPreferences['theme'], expectedVersion: number) {
  return savePreferences({ theme, expectedVersion })
}

export function saveBackground(background: BackgroundId, expectedVersion: number) {
  return savePreferences({ background, expectedVersion })
}
