import { HttpError, json, param, params, readJson, route } from '@deckagent/host-api'
import {
  RequestValidationError,
  decodeWorkspaceAddBody,
  decodeWorkspaceRelinkBody,
  decodeWorkspaceRemoveBody,
  decodeWorkspaceRenameBody,
  decodeWorkspaceSelectBody,
} from '@deckagent/host-contracts'
import { Router } from 'express'
import type { WorkspaceOperations } from './workspaces.service.ts'

function parseBody<T>(decode: (value: unknown) => T, value: unknown): T {
  try {
    return decode(value)
  } catch (error) {
    if (error instanceof RequestValidationError) throw new HttpError(400, error.code)
    throw error
  }
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
      const body = parseBody(decodeWorkspaceAddBody, await readJson(req))
      json(res, 200, await workspaces.add(body.folder, body.expectedVersion))
    }),
  )
  router.put(
    '/api/workspaces/selected',
    route(async (req, res) => {
      const body = parseBody(decodeWorkspaceSelectBody, await readJson(req))
      json(res, 200, await workspaces.select(body.id, body.expectedVersion))
    }),
  )
  const notSelected = params({ workspaceId: /^(?!selected$)[\w-]{1,100}$/ })
  router.put(
    '/api/workspaces/:workspaceId',
    notSelected,
    route(async (req, res) => {
      const body = parseBody(decodeWorkspaceRenameBody, await readJson(req))
      json(res, 200, await workspaces.rename(param(req, 'workspaceId'), body.name, body.expectedVersion))
    }),
  )
  router.delete(
    '/api/workspaces/:workspaceId',
    notSelected,
    route(async (req, res) => {
      const body = parseBody(decodeWorkspaceRemoveBody, await readJson(req))
      json(res, 200, await workspaces.remove(param(req, 'workspaceId'), body.expectedVersion))
    }),
  )
  router.put(
    '/api/workspaces/:workspaceId/folder',
    notSelected,
    route(async (req, res) => {
      const body = parseBody(decodeWorkspaceRelinkBody, await readJson(req))
      json(res, 200, await workspaces.relink(param(req, 'workspaceId'), body.folder, body.expectedVersion))
    }),
  )
  return router
}
