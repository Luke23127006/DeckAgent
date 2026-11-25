import type { ServerResponse } from 'node:http'
import type { Router } from 'express'
import type { RequestController } from '../lifecycle/request-controller.ts'
import type { AttachmentManagement, HostMessage, HostOptions } from './contracts.ts'
import { registerDeckRoutes } from './deck-routes.ts'
import { HttpError } from './http-error.ts'
import { json, readJson } from './http-io.ts'
import { receiveAttachment } from './multipart.ts'
import { param, params, route, WORD_ID } from './route-params.ts'

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

function registerAttachmentRoutes(router: Router, attachments: AttachmentManagement): void {
  const ids = params({ sessionId: WORD_ID, attachmentId: WORD_ID })
  router.post(
    '/api/sessions/:sessionId/attachments',
    params({ sessionId: WORD_ID }),
    route(async (req, res) => {
      json(res, 202, await receiveAttachment(req, param(req, 'sessionId'), attachments))
    }),
  )
  router.get(
    '/api/sessions/:sessionId/attachments/:attachmentId',
    ids,
    route(async (req, res) => {
      json(res, 200, await attachments.get(param(req, 'sessionId'), param(req, 'attachmentId')))
    }),
  )
  router.delete(
    '/api/sessions/:sessionId/attachments/:attachmentId',
    ids,
    route(async (req, res) => {
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
      json(
        res,
        200,
        await attachments.remove(param(req, 'sessionId'), param(req, 'attachmentId'), Number(value.expectedRevision)),
      )
    }),
  )
  router.get(
    '/api/sessions/:sessionId/attachments/:attachmentId/preview',
    ids,
    route(async (req, res) => {
      const abort = new AbortController()
      res.once('close', () => abort.abort())
      const result = await attachments.preview(param(req, 'sessionId'), param(req, 'attachmentId'), abort.signal)
      res.setHeader('content-security-policy', "sandbox; default-src 'none'; frame-ancestors 'none'")
      res.writeHead(200, { 'content-type': result.contentType, 'content-length': result.body.length })
      res.end(result.body)
    }),
  )
}

export function registerSessionRoutes(
  router: Router,
  options: HostOptions,
  controller: RequestController | undefined,
  streams: Set<ServerResponse>,
): void {
  const session = params({ sessionId: WORD_ID })
  const { confirmations, briefs, decks, outlines, attachments } = options
  if (confirmations && controller) {
    router.post(
      '/api/sessions/:sessionId/deck/confirm',
      session,
      route(async (req, res) => {
        json(
          res,
          200,
          await confirmations.confirm(param(req, 'sessionId'), await readJson(req), (request, settings) =>
            controller.submit(request, settings),
          ),
        )
      }),
    )
  }
  const interview = briefs?.interview?.bind(briefs)
  if (interview) {
    router.get(
      '/api/sessions/:sessionId/interview',
      session,
      route(async (req, res) => {
        json(res, 200, await interview(param(req, 'sessionId')))
      }),
    )
  }
  if (briefs) {
    router.get(
      '/api/sessions/:sessionId/brief',
      session,
      route(async (req, res) => {
        json(res, 200, await briefs.get(param(req, 'sessionId'), undefined))
      }),
    )
    router.get(
      '/api/sessions/:sessionId/brief/versions/:version',
      params({ sessionId: WORD_ID, version: /^\d{1,10}$/ }),
      route(async (req, res) => {
        json(res, 200, await briefs.get(param(req, 'sessionId'), Number(param(req, 'version'))))
      }),
    )
    router.put(
      '/api/sessions/:sessionId/brief',
      session,
      route(async (req, res) => {
        json(res, 200, await briefs.save(param(req, 'sessionId'), await readJson(req)))
      }),
    )
  }
  if (decks) registerDeckRoutes(router, decks, streams)
  const outlineImagePreview = outlines?.outlineImagePreview?.bind(outlines)
  if (outlineImagePreview) {
    router.get(
      '/api/sessions/:sessionId/outlines/:outlineId/images/:imageId',
      params({ sessionId: WORD_ID, outlineId: WORD_ID, imageId: /^need-[a-f0-9]{64}$/ }),
      route((req, res) => {
        const bytes = outlineImagePreview(param(req, 'sessionId'), param(req, 'outlineId'), param(req, 'imageId'))
        res.writeHead(200, {
          'content-type': 'image/png',
          'cache-control': 'private, no-store',
          'x-content-type-options': 'nosniff',
        })
        res.end(bytes)
      }),
    )
  }
  if (outlines) {
    router.get(
      '/api/sessions/:sessionId/outline',
      session,
      route((req, res) => {
        json(res, 200, outlines.outlineSnapshot(param(req, 'sessionId')))
      }),
    )
  }
  if (attachments) registerAttachmentRoutes(router, attachments)
  router.get(
    '/api/sessions/:sessionId/history',
    session,
    route(async (req, res) => {
      const messages = await options.readHistory(param(req, 'sessionId'))
      json(res, 200, messages.filter(message => message.role !== 'system').map(projectHistoryMessage))
    }),
  )
}
