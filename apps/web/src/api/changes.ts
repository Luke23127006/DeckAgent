import { decodeChangeNotice } from '@deckagent/host-contracts'
import type { ChangeNotice } from '@deckagent/host-contracts'
import { ApiClientError, apiFetch, readSseFrames } from './client.ts'

function decodeFrame(data: string, status: number): ChangeNotice {
  try {
    return decodeChangeNotice(JSON.parse(data))
  } catch {
    throw new ApiClientError('INVALID_RESPONSE', status)
  }
}

async function* streamChanges(path: string, signal: AbortSignal): AsyncGenerator<ChangeNotice> {
  const response = await apiFetch(path, { signal })
  if (!response.ok)
    throw new ApiClientError(response.status === 401 ? 'AUTH_REQUIRED' : 'CHANGES_REQUEST_FAILED', response.status)
  const frames = readSseFrames(response, {
    maxBufferBytes: 65536,
    lostError: 'CHANGES_CONNECTION_LOST',
    invalidError: 'INVALID_RESPONSE',
    eventName: 'change',
  })
  for await (const data of frames) yield decodeFrame(data, response.status)
}

/** Streams the Host-scoped notices from GET /api/changes until `signal` aborts or the stream drops. */
export async function* watchHostChanges(signal: AbortSignal): AsyncGenerator<ChangeNotice> {
  yield* streamChanges('/api/changes', signal)
}

/** Streams the notices of one chat from GET /api/sessions/:sessionId/changes. */
export async function* watchChatChanges(sessionId: string, signal: AbortSignal): AsyncGenerator<ChangeNotice> {
  yield* streamChanges(`/api/sessions/${encodeURIComponent(sessionId)}/changes`, signal)
}

/** Lists the TanStack Query prefixes that a notice invalidates. The hook writes no cache data. */
export function queryKeyPrefixesForNotice(notice: ChangeNotice): readonly (readonly unknown[])[] {
  switch (notice.topic) {
    case 'workspaces':
      return [['workspaces']]
    case 'chats':
      return [['chats']]
    case 'providers':
      return [['providers'], ['settings']]
    case 'preferences':
      return [['preferences'], ['settings']]
    case 'draft':
    case 'brief':
    case 'outline':
    case 'deck':
      return [['chats', notice.key, notice.topic]]
  }
  const unreachable: never = notice.topic
  return unreachable
}
