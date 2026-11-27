import { HttpError, json, param, params, readJson, route } from '../../http/route-helpers.ts'
import {
  RequestValidationError,
  decodeChatCreateBody,
  decodeChatSearchBody,
  decodeModelSelection,
} from '@deckagent/host-contracts'
import { Router } from 'express'
import type { ChatService } from './chats.service.ts'

function parseBody<T>(decode: (value: unknown) => T, value: unknown): T {
  try {
    return decode(value)
  } catch (error) {
    if (error instanceof RequestValidationError) throw new HttpError(400, error.code)
    throw error
  }
}

export function createChatRoutes(chats: ChatService): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.get(
    '/api/sessions/:sessionId/history',
    params({ sessionId: /^[\w-]{1,100}$/ }),
    route(async (req, res) => {
      json(res, 200, await chats.history(param(req, 'sessionId')))
    }),
  )
  router.get(
    '/api/sessions',
    route(async (_req, res) => {
      json(res, 200, await chats.list())
    }),
  )
  router.post(
    '/api/sessions',
    route(async (req, res) => {
      const body = parseBody(decodeChatCreateBody, await readJson(req))
      json(res, 201, await chats.create(body.selection))
    }),
  )
  router.put(
    '/api/sessions/:sessionId/selection',
    params({ sessionId: /^[\w-]{1,100}$/ }),
    route(async (req, res) => {
      const selection = parseBody(decodeModelSelection, await readJson(req))
      json(res, 200, await chats.selectModel(param(req, 'sessionId'), selection))
    }),
  )
  router.post(
    '/api/sessions/search',
    route(async (req, res) => {
      const body = parseBody(decodeChatSearchBody, await readJson(req))
      json(res, 200, await chats.search(body.words))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/activities',
    params({ sessionId: /^[\w-]{1,100}$/ }),
    route(async (req, res) => {
      json(res, 200, await chats.activities(param(req, 'sessionId')))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/requests',
    params({ sessionId: /^[\w-]{1,100}$/ }),
    route(async (req, res) => {
      json(res, 200, await chats.requests(param(req, 'sessionId')))
    }),
  )
  return router
}
