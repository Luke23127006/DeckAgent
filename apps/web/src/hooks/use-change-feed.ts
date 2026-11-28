import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import type { ChangeNotice } from '@deckagent/host-contracts'
import { useEffect } from 'react'
import { queryKeyPrefixesForNotice, watchChatChanges, watchHostChanges } from '../api/changes.ts'
import { ApiClientError } from '../api/client.ts'

export interface ChangeFeedOptions {
  readonly sessionId?: string
  readonly enabled?: boolean
  readonly retryBaseMs?: number
  readonly retryMaxMs?: number
}

function waitForRetry(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) {
      resolve()
      return
    }
    function done() {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    const timer = setTimeout(done, ms)
    signal.addEventListener('abort', done, { once: true })
  })
}

async function followStream(
  stream: (signal: AbortSignal) => AsyncGenerator<ChangeNotice>,
  queryClient: QueryClient,
  signal: AbortSignal,
  retryBaseMs: number,
  retryMaxMs: number,
): Promise<void> {
  let retry = retryBaseMs
  while (!signal.aborted) {
    try {
      for await (const notice of stream(signal)) {
        if (signal.aborted) return
        retry = retryBaseMs
        for (const queryKey of queryKeyPrefixesForNotice(notice)) {
          void queryClient.invalidateQueries({ queryKey })
        }
      }
    } catch (error) {
      if (signal.aborted) return
      if (error instanceof ApiClientError && error.code === 'AUTH_REQUIRED') return
    }
    await waitForRetry(retry, signal)
    if (signal.aborted) return
    retry = Math.min(retry * 2, retryMaxMs)
  }
}

/** Invalidates the TanStack Query prefixes of each Host change notice. The hook writes no cache data. */
export function useChangeFeed(options: ChangeFeedOptions = {}): void {
  const { sessionId, enabled = true, retryBaseMs = 500, retryMaxMs = 10_000 } = options
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return
    const control = new AbortController()
    void followStream(watchHostChanges, queryClient, control.signal, retryBaseMs, retryMaxMs)
    return () => control.abort()
  }, [enabled, queryClient, retryBaseMs, retryMaxMs])

  useEffect(() => {
    if (!enabled || !sessionId) return
    const control = new AbortController()
    void followStream(
      signal => watchChatChanges(sessionId, signal),
      queryClient,
      control.signal,
      retryBaseMs,
      retryMaxMs,
    )
    return () => control.abort()
  }, [enabled, sessionId, queryClient, retryBaseMs, retryMaxMs])
}
