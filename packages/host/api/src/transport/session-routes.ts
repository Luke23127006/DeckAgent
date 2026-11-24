import type { IncomingMessage, ServerResponse } from 'node:http'
import type { RequestController } from '../lifecycle/request-controller.ts'
import type { AttachmentManagement, HostMessage, HostOptions } from './contracts.ts'
import { routeDeck } from './deck-routes.ts'
import { HttpError } from './http-error.ts'
import { json, readJson } from './http-io.ts'
import { receiveAttachment } from './multipart.ts'

function projectHistoryMessage(message: HostMessage) {
  return {
    role: message.role,
    content: message.content,
    ...(message.role === 'user' && message.attachments
      ? {
          attachments: message.attachments.map(item => ({
            attachmentId: item.attachmentId,
            name: item.name,
            state: item.state,
            byteSize: item.byteSize,
            ...(item.detectedType ? { detectedType: item.detectedType } : {}),
            ...(item.rejectionCode ? { rejectionCode: item.rejectionCode } : {}),
            ...(item.preparation ? { preparation: item.preparation } : {}),
            ...(item.source
              ? {
                  source: {
                    sourceId: item.source.sourceId,
                    version: item.source.version,
                    kind: item.source.kind,
                    label: item.source.label,
                  },
                }
              : {}),
          })),
        }
      : {}),
    ...(message.role === 'assistant' && message.interrupted ? { interrupted: true } : {}),
    ...(message.role === 'tool'
      ? { toolCallId: message.toolCallId, name: message.name, isError: message.isError === true }
      : {}),
  }
}

async function routeAttachments(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  attachments: AttachmentManagement,
): Promise<boolean> {
  const [, sessionId, id, preview] =
    /^\/api\/sessions\/([\w-]{1,100})\/attachments(?:\/([\w-]{1,100})(\/preview)?)?$/.exec(pathname) ?? []
  if (!sessionId) return false
  if (!id && req.method === 'POST') {
    json(res, 202, await receiveAttachment(req, sessionId, attachments))
    return true
  }
  if (id && !preview && req.method === 'GET') {
    json(res, 200, await attachments.get(sessionId, id))
    return true
  }
  if (id && !preview && req.method === 'DELETE') {
    const value = await readJson(req)
    if (
      !value ||
      typeof value !== 'object' ||
      !('expectedRevision' in value) ||
      !Number.isSafeInteger(value.expectedRevision) ||
      Number(value.expectedRevision) < 0 ||
      Object.keys(value).some(key => key !== 'expectedRevision')
    )
      throw new HttpError(400, 'INVALID_REQUEST')
    json(res, 200, await attachments.remove(sessionId, id, Number(value.expectedRevision)))
    return true
  }
  if (id && preview && req.method === 'GET') {
    const abort = new AbortController()
    res.once('close', () => abort.abort())
    const result = await attachments.preview(sessionId, id, abort.signal)
    res.setHeader('content-security-policy', "sandbox; default-src 'none'; frame-ancestors 'none'")
    res.writeHead(200, { 'content-type': result.contentType, 'content-length': result.body.length })
    res.end(result.body)
    return true
  }
  return false
}

export async function routeSession(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  options: HostOptions,
  controller: RequestController | undefined,
  streams: Set<ServerResponse>,
): Promise<boolean> {
  const [, confirmSessionId] = /^\/api\/sessions\/([\w-]{1,100})\/deck\/confirm$/.exec(pathname) ?? []
  if (confirmSessionId && req.method === 'POST' && options.confirmations && controller) {
    json(
      res,
      200,
      await options.confirmations.confirm(confirmSessionId, await readJson(req), (request, settings) =>
        controller.submit(request, settings),
      ),
    )
    return true
  }
  const [, interviewSessionId] = /^\/api\/sessions\/([\w-]{1,100})\/interview$/.exec(pathname) ?? []
  if (interviewSessionId && options.briefs?.interview && req.method === 'GET') {
    json(res, 200, await options.briefs.interview(interviewSessionId))
    return true
  }
  const [, briefSessionId, briefVersion] =
    /^\/api\/sessions\/([\w-]{1,100})\/brief(?:\/versions\/(\d{1,10}))?$/.exec(pathname) ?? []
  if (briefSessionId && options.briefs) {
    if (req.method === 'GET') {
      json(
        res,
        200,
        await options.briefs.get(briefSessionId, briefVersion === undefined ? undefined : Number(briefVersion)),
      )
      return true
    }
    if (req.method === 'PUT' && briefVersion === undefined) {
      json(res, 200, await options.briefs.save(briefSessionId, await readJson(req)))
      return true
    }
  }
  if (options.decks && req.method === 'GET' && routeDeck(pathname, res, options.decks, streams)) return true
  const [, previewSessionId, previewOutlineId, previewImageId] =
    /^\/api\/sessions\/([\w-]{1,100})\/outlines\/([\w-]{1,100})\/images\/(need-[a-f0-9]{64})$/.exec(pathname) ?? []
  if (
    previewSessionId &&
    previewOutlineId &&
    previewImageId &&
    options.outlines?.outlineImagePreview &&
    req.method === 'GET'
  ) {
    const bytes = options.outlines.outlineImagePreview(previewSessionId, previewOutlineId, previewImageId)
    res.writeHead(200, {
      'content-type': 'image/png',
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    })
    res.end(bytes)
    return true
  }
  const [, outlineSessionId] = /^\/api\/sessions\/([\w-]{1,100})\/outline$/.exec(pathname) ?? []
  if (outlineSessionId && options.outlines && req.method === 'GET') {
    json(res, 200, options.outlines.outlineSnapshot(outlineSessionId))
    return true
  }
  if (options.attachments && (await routeAttachments(req, res, pathname, options.attachments))) return true
  const [, historySessionId] = /^\/api\/sessions\/([A-Za-z0-9_-]{1,100})\/history$/.exec(pathname) ?? []
  if (historySessionId && req.method === 'GET') {
    const messages = await options.readHistory(historySessionId)
    json(res, 200, messages.filter(message => message.role !== 'system').map(projectHistoryMessage))
    return true
  }
  return false
}
