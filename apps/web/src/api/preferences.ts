import { decodePreferences } from '@deckagent/host-contracts'
import type { WebPreferences } from '@deckagent/host-contracts'
import { apiJson } from './client.ts'

export const preferencesKeys = { all: ['preferences'] as const }

export function getPreferences(signal?: AbortSignal) {
  return apiJson('/api/preferences', decodePreferences, { signal: signal ?? null })
}

export function saveTheme(theme: WebPreferences['theme'], expectedVersion: number) {
  return apiJson('/api/preferences', decodePreferences, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ theme, expectedVersion }),
  })
}
