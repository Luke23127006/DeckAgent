import { json, param, params, readJson, route } from '@deckagent/host-api'
import { Router } from 'express'
import type { ProviderOperations } from './providers.service.ts'

export function createProviderRoutes(providers: ProviderOperations): Router {
  const router = Router({ caseSensitive: true, strict: true })
  const providerId = params({ providerId: /^[\w.-]{1,100}$/ })
  router.put(
    '/api/providers/:providerId',
    providerId,
    route(async (req, res) => {
      await providers.save(param(req, 'providerId'), await readJson(req))
      json(res, 200, { saved: true })
    }),
  )
  router.delete(
    '/api/providers/:providerId',
    providerId,
    route(async (req, res) => {
      await providers.remove(param(req, 'providerId'))
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
