import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '../api/client.ts'
import { getSettings, getCatalog, saveProvider, removeProvider, providersKeys } from '../api/providers.ts'
import type { ProviderDraft } from '../api/providers.ts'

export function useSettings() {
  return useQuery({ queryKey: providersKeys.settings, queryFn: ({ signal }) => getSettings(signal), retry: false })
}
export function useProviderMutation() {
  const cache = useQueryClient()
  async function refresh() {
    await Promise.all([
      cache.invalidateQueries({ queryKey: providersKeys.settings }),
      cache.invalidateQueries({ queryKey: providersKeys.all }),
      cache.invalidateQueries({ queryKey: ['chats'] }),
    ])
  }
  return useMutation({
    gcTime: 0,
    mutationFn: (change: { id: string; expectedVersion: number; provider?: ProviderDraft }) =>
      change.provider
        ? saveProvider(change.id, change.provider, change.expectedVersion)
        : removeProvider(change.id, change.expectedVersion),
    onSuccess: refresh,
    onError: async error => {
      if (error instanceof ApiClientError && error.code === 'PROVIDERS_STALE') await refresh()
    },
  })
}
export function useProviderCatalog() {
  return useMutation({ mutationFn: getCatalog })
}
export function settingsError(error: unknown) {
  return error instanceof ApiClientError ? error.code : 'HOST_REQUEST_FAILED'
}
