import { Router } from 'express'
import { json, openSseStream, param, params, readJson, route } from '@deckagent/host-api'
import type { HostRouteContext } from '@deckagent/host-api'
import type { DeckChange } from '@deckagent/host-contracts'
import type { DeckOperations } from './deck.service.ts'

const WORD_ID = /^[\w-]{1,100}$/

export function createDeckRoutes(deck: DeckOperations, context: HostRouteContext): Router {
  const router = Router({ caseSensitive: true, strict: true })
  const session = params({ sessionId: WORD_ID })
  const submit = context.submit
  if (submit) {
    router.post(
      '/api/sessions/:sessionId/deck/confirm',
      session,
      route(async (req, res) => {
        json(res, 200, await deck.confirm(param(req, 'sessionId'), await readJson(req), submit))
      }),
    )
  }
  router.get(
    '/api/sessions/:sessionId/interview',
    session,
    route(async (req, res) => {
      json(res, 200, await deck.interview(param(req, 'sessionId')))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/brief',
    session,
    route(async (req, res) => {
      json(res, 200, await deck.getBrief(param(req, 'sessionId'), undefined))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/brief/versions/:version',
    params({ sessionId: WORD_ID, version: /^\d{1,10}$/ }),
    route(async (req, res) => {
      json(res, 200, await deck.getBrief(param(req, 'sessionId'), Number(param(req, 'version'))))
    }),
  )
  router.put(
    '/api/sessions/:sessionId/brief',
    session,
    route(async (req, res) => {
      json(res, 200, await deck.saveBrief(param(req, 'sessionId'), await readJson(req)))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/deck',
    session,
    route((req, res) => {
      json(res, 200, deck.snapshot(param(req, 'sessionId')))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/deck/slides/:slideId/revisions/:revision',
    params({ sessionId: WORD_ID, slideId: WORD_ID, revision: /^[1-9][0-9]{0,9}$/ }),
    route((req, res) => {
      json(res, 200, deck.content(param(req, 'sessionId'), param(req, 'slideId'), Number(param(req, 'revision'))))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/deck/events',
    session,
    route((req, res) => {
      const sessionId = param(req, 'sessionId')
      const send = (change: DeckChange) => {
        if (res.destroyed || res.writableEnded) return
        if (!res.write(`event: deck-changed\ndata: ${JSON.stringify(change)}\n\n`)) res.end()
      }
      const unsubscribe = deck.subscribe(sessionId, send)
      try {
        const initial = deck.snapshot(sessionId)
        openSseStream(res, context.streams, unsubscribe)
        send({ sessionId, deckId: initial.deckId, version: initial.version })
      } catch (error) {
        unsubscribe()
        throw error
      }
    }),
  )
  router.get(
    '/api/sessions/:sessionId/outlines/:outlineId/images/:imageId',
    params({ sessionId: WORD_ID, outlineId: WORD_ID, imageId: /^need-[a-f0-9]{64}$/ }),
    route((req, res) => {
      const bytes = deck.outlineImagePreview(param(req, 'sessionId'), param(req, 'outlineId'), param(req, 'imageId'))
      res.writeHead(200, {
        'content-type': 'image/png',
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      })
      res.end(bytes)
    }),
  )
  router.get(
    '/api/sessions/:sessionId/outline',
    session,
    route((req, res) => {
      json(res, 200, deck.outlineSnapshot(param(req, 'sessionId')))
    }),
  )
  return router
}
