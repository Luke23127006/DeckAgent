import { decodePreferencesSaveBody, RequestValidationError } from '@deckagent/host-contracts'
import { Router } from 'express'
import { HttpError, json, readJson, route } from '../../http/route-helpers.ts'
import type { SettingsService } from './settings.service.ts'

export function createSettingsRoutes(settings: SettingsService): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.get(
    '/api/settings',
    route(async (_req, res) => {
      json(res, 200, await settings.read())
    }),
  )
  router.get(
    '/api/preferences',
    route(async (_req, res) => {
      json(res, 200, settings.preferences())
    }),
  )
  router.put(
    '/api/preferences',
    route(async (req, res) => {
      let body
      try {
        body = decodePreferencesSaveBody(await readJson(req))
      } catch (error) {
        if (error instanceof RequestValidationError) throw new HttpError(400, error.code)
        throw error
      }
      json(res, 200, settings.savePreferences(body.theme, body.expectedVersion))
    }),
  )
  return router
}
