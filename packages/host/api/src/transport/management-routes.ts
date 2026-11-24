import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebSession } from '@deckagent/host-contracts'
import type { WebManagement, WorkspaceManagement } from './contracts.ts'
import { json, readJson } from './http-io.ts'

async function routeWorkspaces(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  workspaces: WorkspaceManagement,
): Promise<boolean> {
  if (pathname === '/api/workspaces') {
    if (req.method === 'GET') {
      json(res, 200, await workspaces.list())
      return true
    }
    if (req.method === 'POST') {
      json(res, 200, await workspaces.add(await readJson(req)))
      return true
    }
  }
  if (pathname === '/api/workspaces/selected' && req.method === 'PUT') {
    json(res, 200, await workspaces.select(await readJson(req)))
    return true
  }
  const workspace = /^\/api\/workspaces\/([\w-]{1,100})(\/folder)?$/.exec(pathname)
  const [, workspaceId, folderTail] = workspace ?? []
  if (workspaceId && workspaceId !== 'selected') {
    if (!folderTail && req.method === 'PUT') {
      json(res, 200, await workspaces.rename(workspaceId, await readJson(req)))
      return true
    }
    if (!folderTail && req.method === 'DELETE') {
      json(res, 200, await workspaces.remove(workspaceId))
      return true
    }
    if (folderTail && req.method === 'PUT') {
      json(res, 200, await workspaces.relink(workspaceId, await readJson(req)))
      return true
    }
  }
  return false
}

async function routeSettingsAndProviders(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  management: WebManagement,
): Promise<boolean> {
  if (pathname === '/api/settings' && req.method === 'GET') {
    json(res, 200, await management.settings())
    return true
  }
  if (pathname === '/api/research' && management.research) {
    if (req.method === 'PUT') {
      await management.research.save(await readJson(req))
      json(res, 200, { ok: true })
      return true
    }
    if (req.method === 'DELETE') {
      await management.research.remove()
      json(res, 200, { ok: true })
      return true
    }
  }
  if (pathname === '/api/preferences' && management.preferences) {
    if (req.method === 'GET') {
      json(res, 200, await management.preferences.get())
      return true
    }
    if (req.method === 'PUT') {
      json(res, 200, await management.preferences.save(await readJson(req)))
      return true
    }
  }
  const [, providerId] = /^\/api\/providers\/([\w.-]{1,100})$/.exec(pathname) ?? []
  if (providerId && (req.method === 'PUT' || req.method === 'DELETE')) {
    if (req.method === 'PUT') await management.saveProvider(providerId, await readJson(req))
    else await management.deleteProvider(providerId)
    json(res, 200, { saved: true })
    return true
  }
  const [, catalogId] = /^\/api\/providers\/([\w.-]{1,100})\/catalog$/.exec(pathname) ?? []
  if (catalogId && req.method === 'GET') {
    json(res, 200, await management.catalog(catalogId))
    return true
  }
  return false
}

export async function routeManagement(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  management: WebManagement,
  withActive: (sessions: readonly WebSession[]) => Promise<readonly WebSession[]>,
): Promise<boolean> {
  if (await routeSettingsAndProviders(req, res, pathname, management)) return true
  const [, researchSessionId] = /^\/api\/sessions\/([\w-]{1,100})\/research-sources$/.exec(pathname) ?? []
  if (researchSessionId && management.research && req.method === 'GET') {
    json(res, 200, await management.research.sources(researchSessionId))
    return true
  }
  if (pathname === '/api/sessions') {
    if (req.method === 'GET') {
      json(res, 200, await withActive(await management.sessions()))
      return true
    }
    if (req.method === 'POST') {
      json(res, 201, await management.createSession(await readJson(req)))
      return true
    }
  }
  const [, sessionId, kind] = /^\/api\/sessions\/([\w-]{1,100})\/(selection|activities|requests)$/.exec(pathname) ?? []
  if (sessionId && kind === 'selection' && req.method === 'PUT') {
    json(res, 200, await management.selectModel(sessionId, await readJson(req)))
    return true
  }
  if (sessionId && kind === 'activities' && req.method === 'GET') {
    json(res, 200, await management.activities(sessionId))
    return true
  }
  if (sessionId && kind === 'requests' && req.method === 'GET') {
    json(res, 200, await management.requests(sessionId))
    return true
  }
  if (pathname === '/api/sessions/search' && req.method === 'POST' && management.searchSessions) {
    json(res, 200, await withActive(await management.searchSessions(await readJson(req))))
    return true
  }
  const [, draftSessionId] = /^\/api\/sessions\/([\w-]{1,100})\/draft$/.exec(pathname) ?? []
  if (draftSessionId && management.drafts) {
    if (req.method === 'GET') {
      json(res, 200, await management.drafts.get(draftSessionId))
      return true
    }
    if (req.method === 'PUT') {
      json(res, 200, await management.drafts.save(draftSessionId, await readJson(req)))
      return true
    }
  }
  if (management.workspaces && pathname.startsWith('/api/workspaces')) {
    return routeWorkspaces(req, res, pathname, management.workspaces)
  }
  return false
}
