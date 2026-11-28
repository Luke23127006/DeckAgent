import {
  decodeConfirmationResult,
  decodeDeckChange,
  decodeDeckSnapshot,
  decodeInterview,
  decodeOutlineSnapshot,
  decodeSlideContent,
} from '@deckagent/host-contracts'
import type { ConfirmationTarget, DeckChange } from '@deckagent/host-contracts'
import { ApiClientError, apiFetch, apiJson, readApiError, readSseFrames } from './client.ts'

const timeoutMs = 15000

function chatPath(sessionId: string, part: string): string {
  return `/api/sessions/${encodeURIComponent(sessionId)}/${part}`
}

function withTimeout(signal?: AbortSignal): AbortSignal {
  return signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)
}

/** Reads the deck metadata of a chat. HTML is read for each slide revision with `readSlide`. */
export function readDeck(sessionId: string, signal?: AbortSignal) {
  return apiJson(chatPath(sessionId, 'deck'), value => decodeDeckSnapshot(value, sessionId), {
    signal: withTimeout(signal),
  })
}

/** Reads one saved slide revision. A saved revision does not change, so a cached HTML stays valid. */
export function readSlide(sessionId: string, slideId: string, revision: number, signal?: AbortSignal) {
  return apiJson(
    chatPath(sessionId, `deck/slides/${encodeURIComponent(slideId)}/revisions/${revision}`),
    value => decodeSlideContent(value, sessionId, slideId, revision),
    { signal: withTimeout(signal) },
  )
}

/**
 * Streams the deck changes of a chat. A connection always starts with a notice of the current version, also for an
 * empty deck. A notice holds no HTML. A dropped connection throws `CONNECTION_LOST`.
 */
export async function* watchDeck(sessionId: string, signal: AbortSignal): AsyncGenerator<DeckChange> {
  const response = await apiFetch(chatPath(sessionId, 'deck/events'), { signal })
  if (!response.ok) throw await readApiError(response)
  const frames = readSseFrames(response, {
    maxBufferBytes: 65536,
    lostError: 'CONNECTION_LOST',
    invalidError: 'INVALID_RESPONSE',
    eventName: 'deck-changed',
  })
  for await (const data of frames) {
    try {
      yield decodeDeckChange(JSON.parse(data), sessionId)
    } catch {
      throw new ApiClientError('INVALID_RESPONSE', response.status)
    }
  }
}

/** Reads the Outline proposals of a chat. A read never runs a request again. */
export async function readOutlines(sessionId: string, signal?: AbortSignal) {
  const response = await apiFetch(chatPath(sessionId, 'outline'), { signal: withTimeout(signal) })
  if (!response.ok)
    throw new ApiClientError(response.status === 401 ? 'AUTH_REQUIRED' : 'OUTLINE_UNAVAILABLE', response.status)
  try {
    return decodeOutlineSnapshot(await response.json(), sessionId)
  } catch {
    throw new ApiClientError('INVALID_RESPONSE', response.status)
  }
}

/** Reads the Brief of a chat and the questions that the Brief interview still asks. */
export function readInterview(sessionId: string) {
  return apiJson(chatPath(sessionId, 'interview'), value => decodeInterview(value, sessionId), {
    signal: withTimeout(),
  })
}

/**
 * Confirms one Outline and Brief version. The same `confirmationId` makes a repeated call safe: the Host keeps one
 * generation for it.
 */
export function confirmOutline(sessionId: string, target: ConfirmationTarget) {
  return apiJson(chatPath(sessionId, 'deck/confirm'), value => decodeConfirmationResult(value, sessionId, target), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(target),
    signal: withTimeout(),
  })
}

/** Reads the prepared image of one image need of an Outline, as a PNG of at most 256 KiB. */
export async function readOutlineImage(sessionId: string, outlineId: string, needId: string): Promise<Blob> {
  const response = await apiFetch(
    chatPath(sessionId, `outlines/${encodeURIComponent(outlineId)}/images/${encodeURIComponent(needId)}`),
  )
  if (!response.ok) throw await readApiError(response)
  if (response.headers.get('content-type') !== 'image/png')
    throw new ApiClientError('INVALID_RESPONSE', response.status)
  const blob = await response.blob()
  if (blob.size > 256 * 1024) throw new ApiClientError('INVALID_RESPONSE', response.status)
  return blob
}
