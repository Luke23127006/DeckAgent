import type { ChangeNotice } from '@deckagent/host-contracts'
import { useEffect, useEffectEvent } from 'react'
import { watchChatChanges } from '../api/changes.ts'
import { ApiClientError } from '../api/client.ts'

function waitForRetry(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(done, ms)
    function done() {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    signal.addEventListener('abort', done, { once: true })
  })
}

/**
 * Gives each change notice of the open chat (`draft`, `brief`, `outline`, `deck`) to `onNotice`, in order. The hook
 * owns the reader, reconnects after a drop and stops on unmount or on another chat.
 */
export function useChatNotices(sessionId: string | undefined, onNotice: (notice: ChangeNotice) => Promise<void>): void {
  const handle = useEffectEvent(onNotice)
  useEffect(() => {
    if (!sessionId) return
    const control = new AbortController()
    const signal = control.signal
    void (async () => {
      let retry = 500
      while (!signal.aborted) {
        try {
          for await (const notice of watchChatChanges(sessionId, signal)) {
            if (signal.aborted) return
            retry = 500
            if (notice.key === sessionId) await handle(notice).catch(() => {})
          }
        } catch (error) {
          if (signal.aborted) return
          if (error instanceof ApiClientError && error.code === 'AUTH_REQUIRED') return
        }
        await waitForRetry(retry, signal)
        retry = Math.min(retry * 2, 10_000)
      }
    })()
    return () => control.abort()
  }, [sessionId])
}
