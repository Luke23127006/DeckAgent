import { HttpError, json, param, params, readJson, route } from '../../http/route-helpers.ts'
import { RequestValidationError, decodeProviderRemoveBody, decodeProviderSaveBody } from '@deckagent/host-contracts'
import { Router } from 'express'
import type { ProviderOperations } from './providers.service.ts'

function parseBody<T>(decode: (value: unknown) => T, value: unknown): T {
  try {
    return decode(value)
  } catch (error) {
    if (error instanceof RequestValidationError) throw new HttpError(400, error.code)
    throw error
  }
}

export function createProviderRoutes(providers: ProviderOperations): Router {
  const router = Router({ caseSensitive: true, strict: true })
  const providerId = params({ providerId: /^[\w.-]{1,100}$/ })
  router.put(
    '/api/providers/:providerId',
    providerId,
    route(async (req, res) => {
      const body = parseBody(decodeProviderSaveBody, await readJson(req))
      await providers.save(param(req, 'providerId'), body.provider, body.expectedVersion)
      json(res, 200, { saved: true })
    }),
  )
  router.delete(
    '/api/providers/:providerId',
    providerId,
    route(async (req, res) => {
      const body = parseBody(decodeProviderRemoveBody, await readJson(req))
      await providers.remove(param(req, 'providerId'), body.expectedVersion)
      json(res, 200, { saved: true })
    }),
  )
  router.get(
    '/api/providers/:providerId/catalog',
    providerId,
    route(async (req, res) => {
      json(res, 200, await providers.catalog(param(req, 'providerId')))
    }),
  )
  return router
}
