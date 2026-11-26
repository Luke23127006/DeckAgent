import type { Router } from 'express'
import type { WebManagement } from './contracts.ts'
import { json, readJson } from './http-io.ts'
import { param, params, route, WORD_ID } from './route-params.ts'

function registerSettingsAndProviderRoutes(router: Router, management: WebManagement): void {
  router.get(
    '/api/settings',
    route(async (_req, res) => {
      json(res, 200, await management.settings())
    }),
  )
  const research = management.research
  if (research) {
    router.put(
      '/api/research',
      route(async (req, res) => {
        await research.save(await readJson(req))
        json(res, 200, { ok: true })
      }),
    )
    router.delete(
      '/api/research',
      route(async (_req, res) => {
        await research.remove()
        json(res, 200, { ok: true })
      }),
    )
  }
  const preferences = management.preferences
  if (preferences) {
    router.get(
      '/api/preferences',
      route(async (_req, res) => {
        json(res, 200, await preferences.get())
      }),
    )
    router.put(
      '/api/preferences',
      route(async (req, res) => {
        json(res, 200, await preferences.save(await readJson(req)))
      }),
    )
  }
}

export function registerManagementRoutes(router: Router, management: WebManagement): void {
  const session = params({ sessionId: WORD_ID })
  registerSettingsAndProviderRoutes(router, management)
  const research = management.research
  if (research) {
    router.get(
      '/api/sessions/:sessionId/research-sources',
      session,
      route(async (req, res) => {
        json(res, 200, await research.sources(param(req, 'sessionId')))
      }),
    )
  }
  router.get(
    '/api/sessions/:sessionId/activities',
    session,
    route(async (req, res) => {
      json(res, 200, await management.activities(param(req, 'sessionId')))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/requests',
    session,
    route(async (req, res) => {
      json(res, 200, await management.requests(param(req, 'sessionId')))
    }),
  )
  const drafts = management.drafts
  if (drafts) {
    router.get(
      '/api/sessions/:sessionId/draft',
      session,
      route(async (req, res) => {
        json(res, 200, await drafts.get(param(req, 'sessionId')))
      }),
    )
    router.put(
      '/api/sessions/:sessionId/draft',
      session,
      route(async (req, res) => {
        json(res, 200, await drafts.save(param(req, 'sessionId'), await readJson(req)))
      }),
    )
  }
}
