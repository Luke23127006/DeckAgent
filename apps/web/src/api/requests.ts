import { decodeApprovalView, decodeRequestSnapshot, requestEvent } from '@deckagent/host-contracts'
import type { AgentRequest, RequestEvent, RequestStatus } from '@deckagent/host-contracts'
import { ApiClientError, apiFetch, apiJson, readApiError, readSseFrames } from './client.ts'

/** Whether a request still holds the one active slot of its chat. */
export function isActive(status: RequestStatus): boolean {
  return status === 'active' || status === 'waiting_approval'
}

/** Starts a request with `POST /api/requests`. */
export function sendRequest(request: AgentRequest) {
  return apiJson('/api/requests', decodeRequestSnapshot, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  })
}

/** Reads the saved state of one request. */
export function readRequest(requestId: string) {
  return apiJson(`/api/requests/${encodeURIComponent(requestId)}`, decodeRequestSnapshot)
}

/** Stops a request. The Host saves the stop at once (NFR-011). */
export function stopRequest(requestId: string) {
  return apiJson(`/api/requests/${encodeURIComponent(requestId)}/stop`, decodeRequestSnapshot, { method: 'POST' })
}

/** Saves the decision for one step that waits for approval. */
export function decideApproval(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse') {
  return apiJson(
    `/api/requests/${encodeURIComponent(requestId)}/approvals/${encodeURIComponent(approvalId)}/decision`,
    decodeApprovalView,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision }) },
  )
}

/**
 * Streams the saved events after `after`, then the live events, until the request ends. A dropped connection throws
 * `CONNECTION_LOST`. A call with the last sequence continues with no gap and no repeat (FR-068).
 */
export async function* watchRequest(requestId: string, signal: AbortSignal, after = 0): AsyncGenerator<RequestEvent> {
  const response = await apiFetch(`/api/requests/${encodeURIComponent(requestId)}/events`, {
    headers: after ? { 'last-event-id': String(after) } : {},
    signal,
  })
  if (!response.ok) throw await readApiError(response)
  const frames = readSseFrames(response, {
    maxBufferBytes: 4 * 1024 * 1024,
    lostError: 'CONNECTION_LOST',
    invalidError: 'INVALID_RESPONSE',
    eventName: 'request',
  })
  let last = after
  for await (const data of frames) {
    let event: RequestEvent
    try {
      event = requestEvent(JSON.parse(data))
    } catch {
      throw new ApiClientError('INVALID_RESPONSE', response.status)
    }
    if (event.requestId !== requestId) throw new ApiClientError('INVALID_RESPONSE', response.status)
    if (event.sequence <= last) continue
    last = event.sequence
    yield event
    if (event.kind === 'status' && !isActive(event.status)) return
  }
}
