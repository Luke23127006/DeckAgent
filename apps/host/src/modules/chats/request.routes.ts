import type { IncomingMessage, ServerResponse } from 'node:http'
import type { RequestEvent } from '@deckagent/host-contracts'
import { Router } from 'express'
import type { ChatRequestOperations } from './chats.service.ts'
import {
  HttpError,
  json,
  parseCursor,
  readAgentRequest,
  readJson,
  param,
  params,
  route,
  WORD_ID,
  openSseStream,
} from '@deckagent/host-api'

const activeStatuses = new Set(['active', 'waiting_approval'])

function streamRequestEvents(
  req: IncomingMessage,
  res: ServerResponse,
  id: string,
  controller: ChatRequestOperations,
  streams: Set<ServerResponse>,
): void {
  const after = parseCursor(req)
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
  if (!ended && !activeStatuses.has(controller.get(id).status) && last >= controller.get(id).sequence) {
    ended = true
    res.end()
  }
}

export function createRequestRoutes(
  controller: ChatRequestOperations,
  maxFiles: number,
  streams: Set<ServerResponse>,
): Router {
  const router = Router({ caseSensitive: true, strict: true })
  const request = params({ requestId: WORD_ID })
  router.post(
    '/api/requests',
    route(async (req, res) => {
      if (!controller) throw new HttpError(503, 'REQUESTS_UNAVAILABLE')
      json(res, 202, await controller.submit(await readAgentRequest(req, maxFiles)))
    }),
  )
  router.post(
    '/api/requests/:requestId/approvals/:approvalId/decision',
    params({ requestId: WORD_ID, approvalId: WORD_ID }),
    route(async (req, res) => {
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
      json(res, 200, controller.decide(param(req, 'requestId'), param(req, 'approvalId'), value.decision))
    }),
  )
  router.post(
    '/api/requests/:requestId/stop',
    request,
    route((req, res) => {
      if (!controller) throw new HttpError(404, 'REQUEST_NOT_FOUND')
      json(res, 200, controller.stop(param(req, 'requestId')))
    }),
  )
  router.get(
    '/api/requests/:requestId',
    request,
    route((req, res) => {
      if (!controller) throw new HttpError(404, 'REQUEST_NOT_FOUND')
      json(res, 200, controller.get(param(req, 'requestId')))
    }),
  )
  router.get(
    '/api/requests/:requestId/events',
    request,
    route((req, res) => {
      if (!controller) throw new HttpError(404, 'REQUEST_NOT_FOUND')
      const requestId = param(req, 'requestId')
      controller.get(requestId)
      streamRequestEvents(req, res, requestId, controller, streams)
    }),
  )
  return router
}
