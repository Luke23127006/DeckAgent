import type { ApprovalView, RequestSnapshot, RequestStatus, StoredActivity } from '@deckagent/host-contracts'
import { useEffect, useEffectEvent } from 'react'
import { ApiClientError } from '../api/client.ts'
import { isActive, watchRequest } from '../api/requests.ts'

/** The request that the stream follows. A new `generation` starts a new reader. */
export interface RequestStreamTarget {
  readonly requestId: string
  readonly sessionId: string
  readonly generation: number
}

export interface RequestStreamHandlers {
  readonly snapshot: (target: RequestStreamTarget, value: RequestSnapshot) => void
  readonly activity: (target: RequestStreamTarget, value: StoredActivity) => void
  readonly summarized: (target: RequestStreamTarget) => void
  readonly connectionLost: (target: RequestStreamTarget) => void
  /** The request ended. The saved records hold the result now. */
  readonly ended: (target: RequestStreamTarget) => void
}

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

async function follow(target: RequestStreamTarget, handlers: RequestStreamHandlers, signal: AbortSignal) {
  const parts = new Map<string, string>()
  let state: RequestStatus = 'active'
  let errorCode: string | undefined
  let cursor = 0
  let failures = 0
  let pendingApproval: ApprovalView | null = null

  while (!signal.aborted && isActive(state)) {
    try {
      for await (const event of watchRequest(target.requestId, signal, cursor)) {
        if (signal.aborted) return
        cursor = event.sequence
        failures = 0
        if (event.kind === 'text') parts.set(event.part, event.text)
        else if (event.kind === 'activity')
          handlers.activity(target, {
            requestId: target.requestId,
            sequence: event.sequence,
            id: event.id,
            label: event.label,
            type: event.type,
            status: event.status,
          })
        else if (event.kind === 'status') {
          state = event.status
          errorCode = event.errorCode
          if (!isActive(state)) pendingApproval = null
        } else if (event.kind === 'approval')
          pendingApproval = event.approval.state === 'pending' ? event.approval : null
        else if (event.kind === 'notice' && event.code === 'CONVERSATION_SUMMARIZED') handlers.summarized(target)
        handlers.snapshot(target, {
          requestId: target.requestId,
          sessionId: target.sessionId,
          status: state,
          text: [...parts.values()].filter(text => text.trim()).join('\n\n'),
          sequence: cursor,
          pendingApproval,
          ...(errorCode ? { errorCode } : {}),
        })
      }
    } catch (error) {
      if (signal.aborted) return
      if (error instanceof ApiClientError && (error.code === 'REQUEST_NOT_FOUND' || error.code === 'AUTH_REQUIRED'))
        return
      handlers.connectionLost(target)
      failures++
      await waitForRetry(Math.min(5000, 500 * failures), signal)
    }
  }

  if (!signal.aborted) handlers.ended(target)
}

/**
 * Follows one request through the saved events of the Host. The first connection replays from the start; a reconnect
 * continues after the last sequence, so no event is lost or counted twice (FR-068). The hook owns the reader and its
 * `AbortController`, and stops the reader on unmount or on a new target. A stop of the reader stops no request.
 */
export function useRequestStream(target: RequestStreamTarget | undefined, handlers: RequestStreamHandlers): void {
  const onSnapshot = useEffectEvent(handlers.snapshot)
  const onActivity = useEffectEvent(handlers.activity)
  const onSummarized = useEffectEvent(handlers.summarized)
  const onConnectionLost = useEffectEvent(handlers.connectionLost)
  const onEnded = useEffectEvent(handlers.ended)

  const requestId = target?.requestId
  const sessionId = target?.sessionId
  const generation = target?.generation

  useEffect(() => {
    if (requestId === undefined || sessionId === undefined || generation === undefined) return

    const control = new AbortController()
    const current = { requestId, sessionId, generation }
    const proxy: RequestStreamHandlers = {
      snapshot: (t, value) => onSnapshot(t, value),
      activity: (t, value) => onActivity(t, value),
      summarized: t => onSummarized(t),
      connectionLost: t => onConnectionLost(t),
      ended: t => onEnded(t),
    }
    void follow(current, proxy, control.signal)

    return () => control.abort()
  }, [requestId, sessionId, generation])
}
