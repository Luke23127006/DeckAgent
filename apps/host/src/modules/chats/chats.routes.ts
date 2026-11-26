import { HttpError, json, param, params, readJson, route } from '@deckagent/host-api'
import type { ModelSelection } from '@deckagent/host-contracts'
import { Router } from 'express'
import type { ChatOperations } from './chats.service.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function searchWords(value: unknown): string {
  if (!isRecord(value) || Object.keys(value).some(name => name !== 'words')) throw new HttpError(400, 'INVALID_REQUEST')
  const words = value.words
  if (typeof words !== 'string' || words.length > 500) throw new HttpError(400, 'INVALID_REQUEST')
  return words
}

export function createChatRoutes(chats: ChatOperations, decodeSelection: (value: unknown) => ModelSelection): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.get(
    '/api/sessions',
    route(async (_req, res) => {
      json(res, 200, await chats.list())
    }),
  )
  router.post(
    '/api/sessions',
    route(async (req, res) => {
      const value = await readJson(req)
      if (!isRecord(value) || Object.keys(value).some(key => key !== 'selection'))
        throw new HttpError(400, 'INVALID_SESSION')
      const chosen = value.selection === undefined ? undefined : decodeSelection(value.selection)
      json(res, 201, await chats.create(chosen))
    }),
  )
  router.put(
    '/api/sessions/:sessionId/selection',
    params({ sessionId: /^[\w-]{1,100}$/ }),
    route(async (req, res) => {
      json(res, 200, await chats.selectModel(param(req, 'sessionId'), decodeSelection(await readJson(req))))
    }),
  )
  router.post(
    '/api/sessions/search',
    route(async (req, res) => {
      json(res, 200, await chats.search(searchWords(await readJson(req))))
    }),
  )
  return router
}
