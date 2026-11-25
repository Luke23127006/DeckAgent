import { HttpError, json, param, params, readJson, route } from '@deckagent/host-api'
import { Router } from 'express'
import type { WorkspaceOperations } from './workspaces.service.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function field(value: unknown, key: string): unknown {
  if (!isRecord(value) || Object.keys(value).some(name => name !== key)) throw new HttpError(400, 'INVALID_REQUEST')
  return value[key]
}

export function createWorkspaceRoutes(workspaces: WorkspaceOperations): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.get(
    '/api/workspaces',
    route(async (_req, res) => {
      json(res, 200, await workspaces.list())
    }),
  )
  router.post(
    '/api/workspaces',
    route(async (req, res) => {
      json(res, 200, await workspaces.add(field(await readJson(req), 'folder')))
    }),
  )
  router.put(
    '/api/workspaces/selected',
    route(async (req, res) => {
      const id = field(await readJson(req), 'id')
      if (typeof id !== 'string') throw new HttpError(400, 'INVALID_REQUEST')
      json(res, 200, await workspaces.select(id))
    }),
  )
  const notSelected = params({ workspaceId: /^(?!selected$)[\w-]{1,100}$/ })
  router.put(
    '/api/workspaces/:workspaceId',
    notSelected,
    route(async (req, res) => {
      json(res, 200, await workspaces.rename(param(req, 'workspaceId'), field(await readJson(req), 'name')))
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
      json(res, 200, await workspaces.relink(param(req, 'workspaceId'), field(await readJson(req), 'folder')))
    }),
  )
  return router
}
