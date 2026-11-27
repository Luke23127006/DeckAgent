import type { WebSettings } from '@deckagent/host-contracts'
import { useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '../api/client.ts'
import { getSettings, providersKeys } from '../api/providers.ts'
import { listResearchSources, removeResearch, saveResearch } from '../api/research.ts'

/** The client error code of a research change, or an empty string. */
export function researchErrorCode(error: unknown): string {
  return error instanceof ApiClientError ? error.code : ''
}

/** Saves or removes the research configuration and reads the saved excerpts of a chat. */
export function useResearchActions() {
  const cache = useQueryClient()
  return {
    save: saveResearch,
    remove: removeResearch,
    sources: (sessionId: string) => listResearchSources(sessionId),
    /** Reads the settings again, so the research state and the preferences version are current. */
    refresh: async () => {
      await cache.fetchQuery({ queryKey: providersKeys.settings, queryFn: () => getSettings(), staleTime: 0 })
    },
    preferencesVersion: () => cache.getQueryData<WebSettings>(providersKeys.settings)?.preferencesVersion ?? 0,
  }
}
