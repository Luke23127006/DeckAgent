import type { IncomingMessage, ServerResponse } from 'node:http'
import type { RequestEvent } from '@deckagent/host-contracts'
import type { RequestController } from '../lifecycle/request-controller.ts'
import { HttpError } from './http-error.ts'
import { json, parseCursor, readAgentRequest, readJson } from './http-io.ts'
import { openSseStream } from './sse.ts'

const activeStatuses = new Set(['active', 'waiting_approval'])

function streamRequestEvents(
  req: IncomingMessage,
  res: ServerResponse,
  id: string,
  controller: RequestController,
  streams: Set<ServerResponse>,
): void {
  const after = parseCursor(req)
  // Subscribe before reading saved events, so nothing published in between is lost; the cursor drops repeats.
  let last = after
  let ended = false
  const queued: RequestEvent[] = []
  let replaying = true
  const write = (event: RequestEvent) => {
    if (ended || event.sequence <= last || res.destroyed || res.writableEnded) return
    last = event.sequence
    const ready = res.write(`id: ${event.sequence}\nevent: request\ndata: ${JSON.stringify(event)}\n\n`)
    if ((event.kind === 'status' && !activeStatuses.has(event.status)) || !ready) {
      ended = true
      res.end()
    }
  }
  const unsubscribe = controller.subscribe(event => {
    if (event.requestId !== id) return
    if (replaying) queued.push(event)
    else write(event)
  })
  try {
    openSseStream(res, streams, unsubscribe)
  } catch (error) {
    unsubscribe()
    throw error
  }
  try {
    for (const event of controller.events(id, after)) write(event)
  } finally {
    replaying = false
    for (const event of queued.splice(0)) write(event)
  }
  // A request that ended before the cursor has nothing more to say.
  if (!ended && !activeStatuses.has(controller.get(id).status) && last >= controller.get(id).sequence) {
    ended = true
    res.end()
  }
}

export async function routeRequests(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  controller: RequestController | undefined,
  maxFiles: number,
  streams: Set<ServerResponse>,
): Promise<boolean> {
  if (pathname === '/api/requests' && req.method === 'POST') {
    // No Agent runtime is connected: refuse the request instead of pretending to start work.
    if (!controller) throw new HttpError(503, 'REQUESTS_UNAVAILABLE')
    json(res, 202, await controller.submit(await readAgentRequest(req, maxFiles)))
    return true
  }
  const [, approvalRequestId, approvalId] =
    /^\/api\/requests\/([\w-]{1,100})\/approvals\/([\w-]{1,100})\/decision$/.exec(pathname) ?? []
  if (approvalRequestId && approvalId && req.method === 'POST') {
    if (!controller) throw new HttpError(404, 'APPROVAL_NOT_FOUND')
    const value = await readJson(req)
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !('decision' in value) ||
      Object.keys(value).some(key => key !== 'decision') ||
      (value.decision !== 'allow-once' && value.decision !== 'refuse')
    )
      throw new HttpError(400, 'INVALID_REQUEST')
    json(res, 200, controller.decide(approvalRequestId, approvalId, value.decision))
    return true
  }
  const [, stopRequestId] = /^\/api\/requests\/([\w-]{1,100})\/stop$/.exec(pathname) ?? []
  if (stopRequestId && req.method === 'POST') {
    if (!controller) throw new HttpError(404, 'REQUEST_NOT_FOUND')
    json(res, 200, controller.stop(stopRequestId))
    return true
  }
  const [, requestId, eventsTail] = /^\/api\/requests\/([\w-]{1,100})(\/events)?$/.exec(pathname) ?? []
  if (requestId && req.method === 'GET') {
    if (!controller) throw new HttpError(404, 'REQUEST_NOT_FOUND')
    const snapshot = controller.get(requestId)
    if (!eventsTail) {
      json(res, 200, snapshot)
      return true
    }
    streamRequestEvents(req, res, requestId, controller, streams)
    return true
  }
  return false
}
