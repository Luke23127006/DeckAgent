import { decodeChangeNotice } from '@deckagent/host-contracts'
import type { ChangeNotice } from '@deckagent/host-contracts'
import { fetchAuthorized, readSseFrames } from './http.ts'

/** Streams Host-scoped invalidation notices from GET /api/changes. */
export class ChangeClient {
  constructor(
    private readonly origin: string,
    private readonly token: string,
  ) {}

  async *watch(signal: AbortSignal): AsyncGenerator<ChangeNotice> {
    const response = await fetchAuthorized(this.origin, this.token, '/api/changes', { signal })
    if (!response.ok) throw new Error(response.status === 401 ? 'AUTH_REQUIRED' : 'CHANGES_REQUEST_FAILED')
    const frames = readSseFrames(response, {
      maxBufferBytes: 65536,
      lostError: 'CHANGES_CONNECTION_LOST',
      invalidError: 'INVALID_RESPONSE',
      eventName: 'change',
      matchMode: 'prefix',
    })
    for await (const data of frames) yield decodeChangeNotice(JSON.parse(data))
  }
}
