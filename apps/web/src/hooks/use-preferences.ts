import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPreferences, preferencesKeys, saveBackground, saveTheme } from '../api/preferences.ts'
import type { BackgroundId, WebPreferences } from '@deckagent/host-contracts'
import { createBackdrop } from '../background/backdrop.ts'

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

/**
 * Saves the backdrop. The choice shows at once; when the Host refuses it, the saved choice shows again, so the
 * screen always shows what the Host keeps.
 */
export function useBackgroundMutation() {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: ({ background, version }: { background: BackgroundId; version: number }) =>
      saveBackground(background, version),
    onMutate: async ({ background }) => {
      await cache.cancelQueries({ queryKey: preferencesKeys.all })
      const previous = cache.getQueryData<WebPreferences>(preferencesKeys.all)
      if (previous) cache.setQueryData<WebPreferences>(preferencesKeys.all, { ...previous, background })
      return { previous }
    },
    onError: (_error, _change, context) => {
      if (context?.previous) cache.setQueryData(preferencesKeys.all, context.previous)
    },
    onSettled: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: preferencesKeys.all }),
        cache.invalidateQueries({ queryKey: ['settings'] }),
      ])
    },
  })
}

/** Draws the saved backdrop on `canvas`. The backdrop `none` runs no animation. */
export function useBackdrop(canvas: RefObject<HTMLCanvasElement | null>) {
  const background = usePreferences().data?.background ?? 'none'
  const backdrop = useRef<ReturnType<typeof createBackdrop> | null>(null)
  useEffect(() => {
    const node = canvas.current
    if (!node) return
    const created = createBackdrop(node)
    backdrop.current = created
    return () => {
      created.set('none')
      created.dispose()
      backdrop.current = null
    }
  }, [canvas])
  useEffect(() => {
    backdrop.current?.set(background)
  }, [background])
}
