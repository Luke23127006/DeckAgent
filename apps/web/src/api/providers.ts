import { decodeSettings, decodeCatalog, decodeSettingsSaved } from '@deckagent/host-contracts'
import type { ProviderProtocol } from '@deckagent/host-contracts'
import { apiJson } from './client.ts'

export const providersKeys = { all: ['providers'] as const, settings: ['settings'] as const }
export interface ProviderDraft {
  displayName: string
  protocol: ProviderProtocol
  baseUrl: string
  models: readonly string[]
  key?: string
  new?: boolean
}
export function getSettings(signal?: AbortSignal) {
  return apiJson('/api/settings', decodeSettings, { signal: signal ?? null })
}
export function saveProvider(id: string, provider: ProviderDraft, expectedVersion: number) {
  return apiJson(`/api/providers/${encodeURIComponent(id)}`, decodeSettingsSaved, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...provider, expectedVersion }),
  })
}
export function removeProvider(id: string, expectedVersion: number) {
  return apiJson(`/api/providers/${encodeURIComponent(id)}`, decodeSettingsSaved, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ expectedVersion }),
  })
}
export function getCatalog(id: string) {
  return apiJson(`/api/providers/${encodeURIComponent(id)}/catalog`, decodeCatalog)
}
