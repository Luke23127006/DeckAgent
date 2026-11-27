import { decodeResearchSources } from '@deckagent/host-contracts'
import { apiJson } from './client.ts'

/** Keys of the research data of one chat. */
export const researchKeys = {
  sources: (sessionId: string) => ['chats', sessionId, 'research-sources'] as const,
}

/** Checks the Tavily key and saves it, or checks the key of the environment. */
export function saveResearch(value: { readonly key: string } | { readonly useEnvironment: true }, version: number) {
  return apiJson('/api/research', () => undefined, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...value, expectedVersion: version }),
  })
}

/** Removes the research configuration. */
export function removeResearch(version: number) {
  return apiJson('/api/research', () => undefined, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ expectedVersion: version }),
  })
}

/** Reads the saved research excerpts of one chat. */
export function listResearchSources(sessionId: string, signal?: AbortSignal) {
  return apiJson(`/api/sessions/${encodeURIComponent(sessionId)}/research-sources`, decodeResearchSources, {
    signal: signal ?? null,
  })
}
