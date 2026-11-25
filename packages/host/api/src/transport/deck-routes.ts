import type { ServerResponse } from 'node:http'
import type { DeckChange, DeckReader } from '@deckagent/deck'
import type { Router } from 'express'
import { json } from './http-io.ts'
import { param, params, route, WORD_ID } from './route-params.ts'
import { openSseStream } from './sse.ts'

/**
 * Called only after Host authentication/origin checks. Subscribe before initial read.
 * Notices are invalidations, not an event log. Every reconnect starts at current version.
 */
export function registerDeckRoutes(router: Router, decks: DeckReader, streams: Set<ServerResponse>): void {
  router.get(
    '/api/sessions/:sessionId/deck',
    params({ sessionId: WORD_ID }),
    route((req, res) => {
      json(res, 200, decks.snapshot(param(req, 'sessionId')))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/deck/slides/:slideId/revisions/:revision',
    params({ sessionId: WORD_ID, slideId: WORD_ID, revision: /^[1-9][0-9]{0,9}$/ }),
    route((req, res) => {
      json(res, 200, decks.content(param(req, 'sessionId'), param(req, 'slideId'), Number(param(req, 'revision'))))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/deck/events',
    params({ sessionId: WORD_ID }),
    route((req, res) => {
      const sessionId = param(req, 'sessionId')
      const send = (change: DeckChange) => {
        if (res.destroyed || res.writableEnded) return
        if (!res.write(`event: deck-changed\ndata: ${JSON.stringify(change)}\n\n`)) res.end()
      }
      const unsubscribe = decks.subscribe(sessionId, send)
      try {
        const initial = decks.snapshot(sessionId)
        openSseStream(res, streams, unsubscribe)
        send({ sessionId, deckId: initial.deckId, version: initial.version })
      } catch (error) {
        unsubscribe()
        throw error
      }
    }),
  )
}
