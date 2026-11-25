import type { WebSession } from '@deckagent/host-contracts'
import type { Router } from 'express'
import type { WebManagement, WorkspaceManagement } from './contracts.ts'
import { json, readJson } from './http-io.ts'
import { param, params, route, WORD_ID } from './route-params.ts'

const PROVIDER_ID = params({ providerId: /^[\w.-]{1,100}$/ })

function registerWorkspaceRoutes(router: Router, workspaces: WorkspaceManagement): void {
  router.get(
    '/api/workspaces',
    route(async (_req, res) => {
      json(res, 200, await workspaces.list())
    }),
  )
  router.post(
    '/api/workspaces',
    route(async (req, res) => {
      json(res, 200, await workspaces.add(await readJson(req)))
    }),
  )
  router.put(
    '/api/workspaces/selected',
    route(async (req, res) => {
      json(res, 200, await workspaces.select(await readJson(req)))
    }),
  )
  const notSelected = params({ workspaceId: /^(?!selected$)[\w-]{1,100}$/ })
  router.put(
    '/api/workspaces/:workspaceId',
    notSelected,
    route(async (req, res) => {
      json(res, 200, await workspaces.rename(param(req, 'workspaceId'), await readJson(req)))
    }),
  )
  router.delete(
    '/api/workspaces/:workspaceId',
    notSelected,
    route(async (req, res) => {
      json(res, 200, await workspaces.remove(param(req, 'workspaceId')))
    }),
  )
  router.put(
    '/api/workspaces/:workspaceId/folder',
    notSelected,
    route(async (req, res) => {
      json(res, 200, await workspaces.relink(param(req, 'workspaceId'), await readJson(req)))
    }),
  )
}

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
  router.put(
    '/api/providers/:providerId',
    PROVIDER_ID,
    route(async (req, res) => {
      await management.saveProvider(param(req, 'providerId'), await readJson(req))
      json(res, 200, { saved: true })
    }),
  )
  router.delete(
    '/api/providers/:providerId',
    PROVIDER_ID,
    route(async (req, res) => {
      await management.deleteProvider(param(req, 'providerId'))
      json(res, 200, { saved: true })
    }),
  )
  router.get(
    '/api/providers/:providerId/catalog',
    PROVIDER_ID,
    route(async (req, res) => {
      json(res, 200, await management.catalog(param(req, 'providerId')))
    }),
  )
}

export function registerManagementRoutes(
  router: Router,
  management: WebManagement,
  withActive: (sessions: readonly WebSession[]) => Promise<readonly WebSession[]>,
): void {
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
    '/api/sessions',
    route(async (_req, res) => {
      json(res, 200, await withActive(await management.sessions()))
    }),
  )
  router.post(
    '/api/sessions',
    route(async (req, res) => {
      json(res, 201, await management.createSession(await readJson(req)))
    }),
  )
  router.put(
    '/api/sessions/:sessionId/selection',
    session,
    route(async (req, res) => {
      json(res, 200, await management.selectModel(param(req, 'sessionId'), await readJson(req)))
    }),
  )
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
  const searchSessions = management.searchSessions?.bind(management)
  if (searchSessions) {
    router.post(
      '/api/sessions/search',
      route(async (req, res) => {
        json(res, 200, await withActive(await searchSessions(await readJson(req))))
      }),
    )
  }
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
  if (management.workspaces) registerWorkspaceRoutes(router, management.workspaces)
}
