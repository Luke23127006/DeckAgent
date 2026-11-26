import { HttpError, json, readJson, route } from '@deckagent/host-api'
import {
  decodePreferencesSaveBody,
  RequestValidationError,
  type WebPreferences,
  type WebSettings,
} from '@deckagent/host-contracts'
import { Router } from 'express'

export interface SettingsRoutesOptions {
  settings(): Promise<WebSettings>
  readonly preferences: {
    get(): Promise<WebPreferences>
    save(theme: WebPreferences['theme'], expectedVersion: number): Promise<WebPreferences>
  }
}

export function createSettingsRoutes(options: SettingsRoutesOptions): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.get(
    '/api/settings',
    route(async (_req, res) => {
      json(res, 200, await options.settings())
    }),
  )
  router.get(
    '/api/preferences',
    route(async (_req, res) => {
      json(res, 200, await options.preferences.get())
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
      json(res, 200, await options.preferences.save(body.theme, body.expectedVersion))
    }),
  )
  return router
}
