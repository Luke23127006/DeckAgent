import type { ServerResponse } from 'node:http'
import type { DeckChange, DeckReader } from '@deckagent/deck'
import { json } from './http-io.ts'
import { openSseStream } from './sse.ts'

/**
 * Called only after Host authentication/origin checks. Subscribe before initial read.
 * Notices are invalidations, not an event log. Every reconnect starts at current version.
 */
export function routeDeck(path: string, res: ServerResponse, decks: DeckReader, streams: Set<ServerResponse>): boolean {
  const resource =
    /^\/api\/sessions\/([\w-]{1,100})\/deck(?:\/(events|slides\/([\w-]{1,100})\/revisions\/([1-9][0-9]{0,9})))?$/.exec(
      path,
    )
  if (!resource) return false
  const [, sessionId, tail, slideId, rev] = resource
  if (!sessionId) return false
  if (tail !== 'events') {
    const value = slideId ? decks.content(sessionId, slideId, Number(rev)) : decks.snapshot(sessionId)
    json(res, 200, value)
    return true
  }
  const send = (change: DeckChange) => {
    if (res.destroyed || res.writableEnded) return
    if (!res.write(`event: deck-changed\ndata: ${JSON.stringify(change)}\n\n`)) res.end()
  }
  const unsubscribe = decks.subscribe(sessionId, send)
  try {
    const initial = decks.snapshot(sessionId)
    openSseStream(res, streams, unsubscribe)
    send({ sessionId, deckId: initial.deckId, version: initial.version })
    return true
  } catch (error) {
    unsubscribe()
    throw error
  }
}
