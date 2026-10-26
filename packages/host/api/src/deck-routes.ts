import type { ServerResponse } from 'node:http'
import type { DeckReader, DeckChange } from '@deckagent/deck'
import { HttpError } from './request-controller.ts'

/** Called only after Host authentication/origin checks. Subscribe before initial read.
 * Notices are invalidations, not an event log. Every reconnect starts at current version.
 */
export function routeDeck(path: string, res: ServerResponse, decks: DeckReader, streams: Set<ServerResponse>): boolean {
  const resource =
    /^\/api\/sessions\/([\w-]{1,100})\/deck(?:\/(events|slides\/([\w-]{1,100})\/revisions\/([1-9][0-9]{0,9})))?$/.exec(
      path,
    )
  if (!resource) return false
  const sessionId = resource[1]!
  if (resource[2] !== 'events') {
    const value = resource[3] ? decks.content(sessionId, resource[3], Number(resource[4])) : decks.snapshot(sessionId)
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(value))
    return true
  }
  if (streams.size >= 64) throw new HttpError(429, 'TOO_MANY_STREAMS')
  const send = (change: DeckChange) => {
    if (res.destroyed || res.writableEnded) return
    if (!res.write(`event: deck-changed\ndata: ${JSON.stringify(change)}\n\n`)) res.end()
  }
  const unsubscribe = decks.subscribe(sessionId, send)
  try {
    const initial = decks.snapshot(sessionId)
    res.writeHead(200, { 'content-type': 'text/event-stream', 'x-accel-buffering': 'no' })
    streams.add(res)
    const heartbeat = setInterval(() => {
      if (!res.write(': heartbeat\n\n')) res.end()
    }, 15000)
    res.once('close', () => {
      clearInterval(heartbeat)
      unsubscribe()
      streams.delete(res)
    })
    send({ sessionId, deckId: initial.deckId, version: initial.version })
    return true
  } catch (error) {
    unsubscribe()
    throw error
  }
}
