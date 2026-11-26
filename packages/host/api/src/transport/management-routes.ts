import type { Router } from 'express'
import type { WebManagement } from './contracts.ts'
import { json } from './http-io.ts'
import { param, params, route, WORD_ID } from './route-params.ts'

export function registerManagementRoutes(router: Router, management: WebManagement): void {
  const session = params({ sessionId: WORD_ID })
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
}
