import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPreferences, preferencesKeys, saveTheme } from '../api/preferences.ts'
import type { WebPreferences } from '@deckagent/host-contracts'

export function usePreferences() {
  const query = useQuery({
    queryKey: preferencesKeys.all,
    queryFn: ({ signal }) => getPreferences(signal),
    retry: false,
  })
  useEffect(() => {
    if (!query.data) return
    const theme = query.data.theme
    const media = matchMedia('(prefers-color-scheme: dark)')
    const paint = () =>
      document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media.matches))
    paint()
    media.addEventListener('change', paint)
    return () => media.removeEventListener('change', paint)
  }, [query.data])
  return query
}

export function useThemeMutation() {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: ({ theme, version }: { theme: WebPreferences['theme']; version: number }) => saveTheme(theme, version),
    onSettled: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: preferencesKeys.all }),
        cache.invalidateQueries({ queryKey: ['settings'] }),
      ])
    },
  })
}
