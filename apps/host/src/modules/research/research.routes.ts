import { HttpError, json, param, params, readJson, route } from '../../http/route-helpers.ts'
import { decodeResearchSaveBody, decodeResearchRemoveBody, RequestValidationError } from '@deckagent/host-contracts'
import { Router } from 'express'
import type { ResearchOperations } from './research.service.ts'

const WORD_ID = /^[\w-]{1,100}$/

export function createResearchRoutes(research: ResearchOperations): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.put(
    '/api/research',
    route(async (req, res) => {
      let body
      try {
        body = decodeResearchSaveBody(await readJson(req))
      } catch (error) {
        if (error instanceof RequestValidationError) throw new HttpError(400, error.code)
        throw error
      }
      await research.save(body, body.expectedVersion)
      json(res, 200, { ok: true })
    }),
  )
  router.delete(
    '/api/research',
    route(async (req, res) => {
      let body
      try {
        body = decodeResearchRemoveBody(await readJson(req))
      } catch (error) {
        if (error instanceof RequestValidationError) throw new HttpError(400, error.code)
        throw error
      }
      await research.remove(body.expectedVersion)
      json(res, 200, { ok: true })
    }),
  )
  router.get(
    '/api/sessions/:sessionId/research-sources',
    params({ sessionId: WORD_ID }),
    route(async (req, res) => {
      json(res, 200, await research.sources(param(req, 'sessionId')))
    }),
  )
  return router
}
